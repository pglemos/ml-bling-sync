"""Rate limiting implementation with Redis backend"""

import time
import json
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import redis.asyncio as redis
from app.core.config import settings
from app.core.security import get_tenant_from_request
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """Redis-based rate limiter with sliding window"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def is_allowed(
        self, 
        key: str, 
        limit: int, 
        window_seconds: int,
        cost: int = 1
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if request is allowed using sliding window rate limiting
        
        Args:
            key: Unique identifier for the rate limit (e.g., tenant_id:endpoint)
            limit: Maximum number of requests allowed in the window
            window_seconds: Time window in seconds
            cost: Cost of this request (default 1)
            
        Returns:
            Tuple of (is_allowed, metadata)
        """
        now = time.time()
        window_start = now - window_seconds
        
        # Use Redis pipeline for atomic operations
        pipe = self.redis.pipeline()
        
        # Remove old entries
        pipe.zremrangebyscore(key, 0, window_start)
        
        # Count current requests
        pipe.zcard(key)
        
        # Add current request with cost
        for _ in range(cost):
            pipe.zadd(key, {f"{now}:{time.time_ns()}": now})
        
        # Set expiration
        pipe.expire(key, window_seconds + 1)
        
        results = await pipe.execute()
        current_count = results[1] + cost
        
        is_allowed = current_count <= limit
        
        if not is_allowed:
            # Remove the requests we just added since they're not allowed
            for _ in range(cost):
                await self.redis.zpopmax(key)
        
        # Calculate reset time
        reset_time = int(now + window_seconds)
        
        metadata = {
            'limit': limit,
            'remaining': max(0, limit - current_count) if is_allowed else 0,
            'reset': reset_time,
            'retry_after': window_seconds if not is_allowed else None,
            'current_count': current_count
        }
        
        return is_allowed, metadata
    
    async def get_usage(
        self, 
        key: str, 
        window_seconds: int
    ) -> Dict[str, Any]:
        """Get current usage for a rate limit key"""
        now = time.time()
        window_start = now - window_seconds
        
        # Clean old entries and count current
        await self.redis.zremrangebyscore(key, 0, window_start)
        current_count = await self.redis.zcard(key)
        
        return {
            'current_count': current_count,
            'window_start': window_start,
            'window_end': now
        }

class RateLimitConfig:
    """Rate limit configuration per tenant and endpoint"""
    
    # Default rate limits (requests per minute)
    DEFAULT_LIMITS = {
        'api_calls': 1000,  # General API calls
        'auth': 60,         # Authentication endpoints
        'sync': 100,        # Sync operations
        'webhook': 500,     # Webhook endpoints
        'upload': 50,       # File uploads
    }
    
    # Plan-based multipliers
    PLAN_MULTIPLIERS = {
        'starter': 1.0,
        'professional': 3.0,
        'enterprise': 10.0
    }
    
    @classmethod
    def get_limit(
        cls, 
        endpoint_type: str, 
        plan: str = 'starter',
        custom_limits: Optional[Dict[str, int]] = None
    ) -> int:
        """Get rate limit for endpoint type and plan"""
        base_limit = cls.DEFAULT_LIMITS.get(endpoint_type, cls.DEFAULT_LIMITS['api_calls'])
        
        # Apply custom limits if provided
        if custom_limits and endpoint_type in custom_limits:
            base_limit = custom_limits[endpoint_type]
        
        # Apply plan multiplier
        multiplier = cls.PLAN_MULTIPLIERS.get(plan, 1.0)
        
        return int(base_limit * multiplier)
    
    @classmethod
    def get_endpoint_type(cls, path: str, method: str) -> str:
        """Determine endpoint type from request path and method"""
        path = path.lower()
        
        if '/auth/' in path or '/login' in path or '/register' in path:
            return 'auth'
        elif '/sync/' in path or '/synchronization' in path:
            return 'sync'
        elif '/webhook' in path:
            return 'webhook'
        elif method.upper() in ['POST', 'PUT', 'PATCH'] and ('/upload' in path or '/import' in path):
            return 'upload'
        else:
            return 'api_calls'

class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for rate limiting"""
    
    def __init__(self, app, redis_url: str = None):
        super().__init__(app)
        self.redis_url = redis_url or settings.REDIS_URL
        self.redis_client = None
        self.rate_limiter = None
    
    async def setup_redis(self):
        """Setup Redis connection"""
        if not self.redis_client:
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            self.rate_limiter = RateLimiter(self.redis_client)
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with rate limiting"""
        # Skip rate limiting for health checks and static files
        if request.url.path in ['/health', '/docs', '/redoc'] or request.url.path.startswith('/static/'):
            return await call_next(request)
        
        await self.setup_redis()
        
        try:
            # Get tenant information
            tenant_id = await get_tenant_from_request(request)
            if not tenant_id:
                tenant_id = 'anonymous'
            
            # Get tenant plan (you might want to cache this)
            plan = await self._get_tenant_plan(tenant_id)
            
            # Determine endpoint type and rate limit
            endpoint_type = RateLimitConfig.get_endpoint_type(
                request.url.path, 
                request.method
            )
            
            limit = RateLimitConfig.get_limit(endpoint_type, plan)
            
            # Create rate limit key
            rate_limit_key = f"rate_limit:{tenant_id}:{endpoint_type}"
            
            # Check rate limit
            is_allowed, metadata = await self.rate_limiter.is_allowed(
                key=rate_limit_key,
                limit=limit,
                window_seconds=60,  # 1 minute window
                cost=1
            )
            
            if not is_allowed:
                logger.warning(
                    f"Rate limit exceeded for tenant {tenant_id} on {endpoint_type}",
                    extra={
                        'tenant_id': tenant_id,
                        'endpoint_type': endpoint_type,
                        'limit': limit,
                        'current_count': metadata['current_count']
                    }
                )
                
                raise HTTPException(
                    status_code=429,
                    detail={
                        'error': 'Rate limit exceeded',
                        'limit': metadata['limit'],
                        'retry_after': metadata['retry_after']
                    },
                    headers={
                        'X-RateLimit-Limit': str(metadata['limit']),
                        'X-RateLimit-Remaining': str(metadata['remaining']),
                        'X-RateLimit-Reset': str(metadata['reset']),
                        'Retry-After': str(metadata['retry_after'])
                    }
                )
            
            # Process request
            response = await call_next(request)
            
            # Add rate limit headers to response
            response.headers['X-RateLimit-Limit'] = str(metadata['limit'])
            response.headers['X-RateLimit-Remaining'] = str(metadata['remaining'])
            response.headers['X-RateLimit-Reset'] = str(metadata['reset'])
            
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Rate limiting error: {e}", exc_info=True)
            # Continue without rate limiting if there's an error
            return await call_next(request)
    
    async def _get_tenant_plan(self, tenant_id: str) -> str:
        """Get tenant plan (implement caching here)"""
        # This should be cached and fetched from database
        # For now, return default
        if tenant_id == 'anonymous':
            return 'starter'
        
        # TODO: Implement actual tenant plan lookup with caching
        return 'starter'

# Decorator for additional rate limiting on specific endpoints
def rate_limit(
    limit: int, 
    window_seconds: int = 60, 
    key_func: Optional[callable] = None,
    cost: int = 1
):
    """Decorator for additional rate limiting on specific endpoints"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # This would need to be implemented based on your framework
            # For now, just call the original function
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Utility functions
async def get_rate_limit_status(
    redis_client: redis.Redis,
    tenant_id: str,
    endpoint_type: str = 'api_calls'
) -> Dict[str, Any]:
    """Get current rate limit status for a tenant"""
    rate_limiter = RateLimiter(redis_client)
    key = f"rate_limit:{tenant_id}:{endpoint_type}"
    
    usage = await rate_limiter.get_usage(key, 60)
    plan = 'starter'  # TODO: Get actual plan
    limit = RateLimitConfig.get_limit(endpoint_type, plan)
    
    return {
        'tenant_id': tenant_id,
        'endpoint_type': endpoint_type,
        'limit': limit,
        'current_usage': usage['current_count'],
        'remaining': max(0, limit - usage['current_count']),
        'reset_time': usage['window_end'] + 60
    }

async def reset_rate_limit(
    redis_client: redis.Redis,
    tenant_id: str,
    endpoint_type: str = None
) -> bool:
    """Reset rate limit for a tenant (admin function)"""
    try:
        if endpoint_type:
            key = f"rate_limit:{tenant_id}:{endpoint_type}"
            await redis_client.delete(key)
        else:
            # Reset all rate limits for tenant
            pattern = f"rate_limit:{tenant_id}:*"
            keys = await redis_client.keys(pattern)
            if keys:
                await redis_client.delete(*keys)
        
        logger.info(f"Rate limit reset for tenant {tenant_id}, endpoint_type: {endpoint_type}")
        return True
    except Exception as e:
        logger.error(f"Error resetting rate limit: {e}")
        return False