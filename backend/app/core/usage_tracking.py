from typing import Dict, Any, Optional
from datetime import datetime
from functools import wraps
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenant import get_tenant_from_request
from app.domain.models import UsageMetric
from app.services.billing_service import BillingService
from app.schemas.billing import UsageRecordCreate

class UsageTracker:
    """Usage tracking and quota enforcement"""
    
    def __init__(self):
        self.metrics_config = {
            UsageMetric.API_CALLS: {
                "quota_name": "api_calls_per_month",
                "description": "API calls per month"
            },
            UsageMetric.PRODUCTS_SYNCED: {
                "quota_name": "products",
                "description": "Active products"
            },
            UsageMetric.ORDERS_PROCESSED: {
                "quota_name": "orders_per_month",
                "description": "Orders processed per month"
            },
            UsageMetric.INTEGRATIONS_ACTIVE: {
                "quota_name": "integrations",
                "description": "Active integrations"
            },
            UsageMetric.USERS_ACTIVE: {
                "quota_name": "users",
                "description": "Active users"
            },
            UsageMetric.WEBHOOKS_SENT: {
                "quota_name": "webhooks_per_month",
                "description": "Webhooks sent per month"
            }
        }
    
    async def track_usage(self, db: Session, tenant_id: str, metric: UsageMetric, 
                         quantity: int = 1, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Track usage and return True if within limits"""
        billing_service = BillingService(db)
        
        try:
            # Record usage
            usage_data = UsageRecordCreate(
                metric=metric,
                quantity=quantity,
                metadata=metadata or {}
            )
            await billing_service.record_usage(tenant_id, usage_data)
            
            # Check quota if applicable
            if metric in self.metrics_config:
                quota_name = self.metrics_config[metric]["quota_name"]
                
                # Get current usage for quota check
                current_usage = await self._get_current_usage(db, tenant_id, metric)
                quota_check = await billing_service.check_quota_limit(tenant_id, quota_name, current_usage)
                
                return quota_check["allowed"]
            
            return True
            
        except Exception:
            # Don't fail the request if usage tracking fails
            return True
    
    async def check_quota(self, db: Session, tenant_id: str, metric: UsageMetric, 
                         additional_usage: int = 1) -> Dict[str, Any]:
        """Check quota without recording usage"""
        if metric not in self.metrics_config:
            return {"allowed": True, "unlimited": True}
        
        billing_service = BillingService(db)
        quota_name = self.metrics_config[metric]["quota_name"]
        
        # Get current usage
        current_usage = await self._get_current_usage(db, tenant_id, metric)
        projected_usage = current_usage + additional_usage
        
        return await billing_service.check_quota_limit(tenant_id, quota_name, projected_usage)
    
    async def _get_current_usage(self, db: Session, tenant_id: str, metric: UsageMetric) -> int:
        """Get current usage for a metric"""
        from sqlalchemy import func, and_
        from app.domain.models import UsageRecord
        
        # For monthly metrics, get usage from start of current month
        if "per_month" in self.metrics_config[metric]["quota_name"]:
            start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            result = db.query(func.sum(UsageRecord.quantity)).filter(
                and_(
                    UsageRecord.tenant_id == tenant_id,
                    UsageRecord.metric == metric,
                    UsageRecord.timestamp >= start_of_month
                )
            ).scalar()
        else:
            # For absolute metrics (like active products), get total count
            result = db.query(func.sum(UsageRecord.quantity)).filter(
                and_(
                    UsageRecord.tenant_id == tenant_id,
                    UsageRecord.metric == metric
                )
            ).scalar()
        
        return result or 0

# Global usage tracker instance
usage_tracker = UsageTracker()

# Decorator for automatic usage tracking
def track_api_usage(metric: UsageMetric = UsageMetric.API_CALLS, quantity: int = 1):
    """Decorator to automatically track API usage"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request and db from function arguments
            request = None
            db = None
            
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                elif hasattr(arg, 'query'):  # SQLAlchemy Session
                    db = arg
            
            # Try to get from kwargs
            if not request:
                request = kwargs.get('request')
            if not db:
                db = kwargs.get('db')
            
            # Get tenant ID
            tenant_id = None
            if request:
                tenant_id = get_tenant_from_request(request)
            
            # Track usage if we have the required info
            if db and tenant_id:
                try:
                    quota_check = await usage_tracker.check_quota(db, tenant_id, metric, quantity)
                    if not quota_check["allowed"]:
                        raise HTTPException(
                            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            detail=f"Quota exceeded: {quota_check.get('reason', 'Usage limit reached')}"
                        )
                    
                    # Execute the function
                    result = await func(*args, **kwargs)
                    
                    # Track successful usage
                    await usage_tracker.track_usage(db, tenant_id, metric, quantity)
                    
                    return result
                except HTTPException:
                    raise
                except Exception as e:
                    # If usage tracking fails, still execute the function
                    return await func(*args, **kwargs)
            else:
                # If we can't track usage, still execute the function
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator

# Middleware for automatic API call tracking
class UsageTrackingMiddleware:
    """Middleware to automatically track API usage"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Only track API calls (not static files, health checks, etc.)
            if self._should_track_request(request):
                tenant_id = get_tenant_from_request(request)
                
                if tenant_id:
                    # Get database session
                    db_gen = get_db()
                    db = next(db_gen)
                    
                    try:
                        # Check quota before processing request
                        quota_check = await usage_tracker.check_quota(
                            db, tenant_id, UsageMetric.API_CALLS, 1
                        )
                        
                        if not quota_check["allowed"]:
                            # Send quota exceeded response
                            response = {
                                "type": "http.response.start",
                                "status": 429,
                                "headers": [
                                    [b"content-type", b"application/json"],
                                    [b"x-quota-exceeded", b"true"]
                                ]
                            }
                            await send(response)
                            
                            body = {
                                "type": "http.response.body",
                                "body": b'{"detail": "API quota exceeded"}'
                            }
                            await send(body)
                            return
                        
                        # Process request normally
                        await self.app(scope, receive, send)
                        
                        # Track successful API call
                        await usage_tracker.track_usage(
                            db, tenant_id, UsageMetric.API_CALLS, 1,
                            metadata={
                                "path": request.url.path,
                                "method": request.method,
                                "user_agent": request.headers.get("user-agent")
                            }
                        )
                        
                    finally:
                        db.close()
                else:
                    # No tenant ID, process normally
                    await self.app(scope, receive, send)
            else:
                # Not an API call, process normally
                await self.app(scope, receive, send)
        else:
            # Not HTTP, process normally
            await self.app(scope, receive, send)
    
    def _should_track_request(self, request: Request) -> bool:
        """Determine if request should be tracked"""
        path = request.url.path
        
        # Don't track these paths
        excluded_paths = [
            "/health",
            "/metrics",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/favicon.ico",
            "/static/",
            "/webhooks/",  # Don't track webhook calls
        ]
        
        for excluded in excluded_paths:
            if path.startswith(excluded):
                return False
        
        # Only track API calls
        return path.startswith("/api/")

# Helper functions for common usage patterns
async def track_product_sync(db: Session, tenant_id: str, product_count: int) -> bool:
    """Track product synchronization"""
    return await usage_tracker.track_usage(
        db, tenant_id, UsageMetric.PRODUCTS_SYNCED, product_count
    )

async def track_order_processing(db: Session, tenant_id: str, order_count: int = 1) -> bool:
    """Track order processing"""
    return await usage_tracker.track_usage(
        db, tenant_id, UsageMetric.ORDERS_PROCESSED, order_count
    )

async def track_webhook_sent(db: Session, tenant_id: str, webhook_count: int = 1) -> bool:
    """Track webhook sending"""
    return await usage_tracker.track_usage(
        db, tenant_id, UsageMetric.WEBHOOKS_SENT, webhook_count
    )

async def check_feature_access(db: Session, tenant_id: str, feature_name: str) -> bool:
    """Check if tenant has access to a feature"""
    billing_service = BillingService(db)
    return await billing_service.check_feature_access(tenant_id, feature_name)