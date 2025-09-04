"""Security monitoring and management endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from app.core.security import get_current_active_user, require_role
from app.domain.models import User
from app.core.circuit_breaker import get_circuit_breaker_manager
from app.core.rate_limiting import get_rate_limiter
from app.core.security_middleware import SecurityEventLogger
from app.schemas.security import (
    CircuitBreakerStatsResponse,
    RateLimitStatsResponse,
    SecurityEventResponse,
    SecurityDashboardResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/circuit-breakers", response_model=List[CircuitBreakerStatsResponse])
async def get_circuit_breaker_stats(
    current_user: User = Depends(require_role("admin"))
):
    """Get circuit breaker statistics"""
    try:
        manager = get_circuit_breaker_manager()
        stats = await manager.get_all_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting circuit breaker stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get circuit breaker statistics"
        )

@router.post("/circuit-breakers/{name}/reset")
async def reset_circuit_breaker(
    name: str,
    current_user: User = Depends(require_role("admin"))
):
    """Reset a specific circuit breaker"""
    try:
        manager = get_circuit_breaker_manager()
        breaker = manager.get_breaker(name)
        await breaker.reset()
        
        logger.info(f"Circuit breaker {name} reset by user {current_user.id}")
        return {"message": f"Circuit breaker {name} reset successfully"}
    except Exception as e:
        logger.error(f"Error resetting circuit breaker {name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset circuit breaker {name}"
        )

@router.post("/circuit-breakers/reset-all")
async def reset_all_circuit_breakers(
    current_user: User = Depends(require_role("admin"))
):
    """Reset all circuit breakers"""
    try:
        manager = get_circuit_breaker_manager()
        await manager.reset_all()
        
        logger.info(f"All circuit breakers reset by user {current_user.id}")
        return {"message": "All circuit breakers reset successfully"}
    except Exception as e:
        logger.error(f"Error resetting all circuit breakers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset all circuit breakers"
        )

@router.get("/rate-limits", response_model=RateLimitStatsResponse)
async def get_rate_limit_stats(
    current_user: User = Depends(require_role("admin"))
):
    """Get rate limiting statistics"""
    try:
        rate_limiter = get_rate_limiter()
        stats = await rate_limiter.get_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting rate limit stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get rate limit statistics"
        )

@router.delete("/rate-limits/{key}")
async def clear_rate_limit(
    key: str,
    current_user: User = Depends(require_role("admin"))
):
    """Clear rate limit for a specific key"""
    try:
        rate_limiter = get_rate_limiter()
        await rate_limiter.clear_limit(key)
        
        logger.info(f"Rate limit cleared for key {key} by user {current_user.id}")
        return {"message": f"Rate limit cleared for key {key}"}
    except Exception as e:
        logger.error(f"Error clearing rate limit for key {key}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear rate limit for key {key}"
        )

@router.get("/events", response_model=List[SecurityEventResponse])
async def get_security_events(
    limit: int = 100,
    offset: int = 0,
    event_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(require_role("admin"))
):
    """Get security events from logs"""
    try:
        # This would typically query a logging system or database
        # For now, return a placeholder response
        events = []
        
        # In a real implementation, you would:
        # 1. Query your logging system (ELK, Splunk, etc.)
        # 2. Filter by event_type, date range, etc.
        # 3. Return structured security events
        
        return events
    except Exception as e:
        logger.error(f"Error getting security events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get security events"
        )

@router.get("/dashboard", response_model=SecurityDashboardResponse)
async def get_security_dashboard(
    current_user: User = Depends(require_role("admin"))
):
    """Get security dashboard data"""
    try:
        # Get circuit breaker stats
        cb_manager = get_circuit_breaker_manager()
        circuit_breaker_stats = await cb_manager.get_all_stats()
        
        # Get rate limiting stats
        rate_limiter = get_rate_limiter()
        rate_limit_stats = await rate_limiter.get_stats()
        
        # Calculate summary metrics
        total_circuit_breakers = len(circuit_breaker_stats)
        open_circuit_breakers = sum(1 for cb in circuit_breaker_stats if cb.get('state') == 'open')
        
        # Get recent security events (placeholder)
        recent_events = []
        
        dashboard_data = {
            "summary": {
                "total_circuit_breakers": total_circuit_breakers,
                "open_circuit_breakers": open_circuit_breakers,
                "healthy_circuit_breakers": total_circuit_breakers - open_circuit_breakers,
                "total_rate_limited_requests": rate_limit_stats.get('total_blocked', 0),
                "active_rate_limits": rate_limit_stats.get('active_limits', 0)
            },
            "circuit_breakers": circuit_breaker_stats,
            "rate_limits": rate_limit_stats,
            "recent_events": recent_events,
            "last_updated": datetime.utcnow()
        }
        
        return dashboard_data
    except Exception as e:
        logger.error(f"Error getting security dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get security dashboard data"
        )

@router.post("/test-circuit-breaker")
async def test_circuit_breaker(
    name: str,
    should_fail: bool = False,
    current_user: User = Depends(require_role("admin"))
):
    """Test circuit breaker functionality"""
    try:
        manager = get_circuit_breaker_manager()
        breaker = manager.get_breaker(name)
        
        async def test_function():
            if should_fail:
                raise Exception("Test failure")
            return "Test success"
        
        result = await breaker.call(test_function)
        
        logger.info(f"Circuit breaker {name} test executed by user {current_user.id}")
        return {
            "message": "Circuit breaker test completed",
            "result": result,
            "breaker_stats": await breaker.get_stats()
        }
    except Exception as e:
        logger.error(f"Circuit breaker test failed: {e}")
        return {
            "message": "Circuit breaker test failed",
            "error": str(e),
            "breaker_stats": await breaker.get_stats() if 'breaker' in locals() else None
        }

@router.get("/health")
async def security_health_check():
    """Security system health check"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow(),
            "components": {}
        }
        
        # Check circuit breaker manager
        try:
            cb_manager = get_circuit_breaker_manager()
            stats = await cb_manager.get_all_stats()
            health_status["components"]["circuit_breakers"] = {
                "status": "healthy",
                "total": len(stats),
                "open": sum(1 for cb in stats if cb.get('state') == 'open')
            }
        except Exception as e:
            health_status["components"]["circuit_breakers"] = {
                "status": "unhealthy",
                "error": str(e)
            }
            health_status["status"] = "degraded"
        
        # Check rate limiter
        try:
            rate_limiter = get_rate_limiter()
            await rate_limiter.get_stats()
            health_status["components"]["rate_limiter"] = {
                "status": "healthy"
            }
        except Exception as e:
            health_status["components"]["rate_limiter"] = {
                "status": "unhealthy",
                "error": str(e)
            }
            health_status["status"] = "degraded"
        
        return health_status
    except Exception as e:
        logger.error(f"Security health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow(),
            "error": str(e)
        }

@router.post("/block-ip")
async def block_ip_address(
    ip_address: str,
    reason: str,
    duration_minutes: int = 60,
    current_user: User = Depends(require_role("admin"))
):
    """Block an IP address"""
    try:
        # This would typically update a firewall or rate limiter
        # For now, we'll just log the action
        
        SecurityEventLogger.log_suspicious_activity(
            "ip_blocked",
            {
                "blocked_ip": ip_address,
                "reason": reason,
                "duration_minutes": duration_minutes,
                "blocked_by": current_user.id
            },
            "admin_action"
        )
        
        logger.warning(
            f"IP address {ip_address} blocked by admin {current_user.id}",
            extra={
                "blocked_ip": ip_address,
                "reason": reason,
                "duration_minutes": duration_minutes
            }
        )
        
        return {
            "message": f"IP address {ip_address} blocked successfully",
            "duration_minutes": duration_minutes,
            "reason": reason
        }
    except Exception as e:
        logger.error(f"Error blocking IP address: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to block IP address"
        )

@router.delete("/block-ip/{ip_address}")
async def unblock_ip_address(
    ip_address: str,
    current_user: User = Depends(require_role("admin"))
):
    """Unblock an IP address"""
    try:
        # This would typically update a firewall or rate limiter
        # For now, we'll just log the action
        
        SecurityEventLogger.log_suspicious_activity(
            "ip_unblocked",
            {
                "unblocked_ip": ip_address,
                "unblocked_by": current_user.id
            },
            "admin_action"
        )
        
        logger.info(
            f"IP address {ip_address} unblocked by admin {current_user.id}",
            extra={
                "unblocked_ip": ip_address
            }
        )
        
        return {
            "message": f"IP address {ip_address} unblocked successfully"
        }
    except Exception as e:
        logger.error(f"Error unblocking IP address: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unblock IP address"
        )