"""Health check system for monitoring application status"""

import asyncio
import time
import psutil
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from redis import Redis
import httpx
import logging

from app.core.database import get_db
from app.core.redis import get_redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class HealthStatus(str, Enum):
    """Health check status levels"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"

@dataclass
class HealthCheckResult:
    """Result of a health check"""
    name: str
    status: HealthStatus
    message: str
    duration_ms: float
    timestamp: datetime
    details: Dict[str, Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "status": self.status.value,
            "message": self.message,
            "duration_ms": self.duration_ms,
            "timestamp": self.timestamp.isoformat(),
            "details": self.details or {}
        }

class HealthChecker:
    """Health check coordinator"""
    
    def __init__(self):
        self.checks: Dict[str, callable] = {}
        self.last_results: Dict[str, HealthCheckResult] = {}
        self.check_intervals: Dict[str, int] = {}  # seconds
        
    def register_check(self, name: str, check_func: callable, interval: int = 60):
        """Register a health check function"""
        self.checks[name] = check_func
        self.check_intervals[name] = interval
        
    async def run_check(self, name: str) -> HealthCheckResult:
        """Run a specific health check"""
        if name not in self.checks:
            return HealthCheckResult(
                name=name,
                status=HealthStatus.UNKNOWN,
                message=f"Check '{name}' not found",
                duration_ms=0,
                timestamp=datetime.utcnow()
            )
        
        start_time = time.time()
        try:
            result = await self.checks[name]()
            duration_ms = (time.time() - start_time) * 1000
            
            if isinstance(result, HealthCheckResult):
                result.duration_ms = duration_ms
                result.timestamp = datetime.utcnow()
                self.last_results[name] = result
                return result
            else:
                # Handle simple boolean or string results
                status = HealthStatus.HEALTHY if result else HealthStatus.UNHEALTHY
                message = str(result) if isinstance(result, str) else ("OK" if result else "Failed")
                
                result = HealthCheckResult(
                    name=name,
                    status=status,
                    message=message,
                    duration_ms=duration_ms,
                    timestamp=datetime.utcnow()
                )
                self.last_results[name] = result
                return result
                
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(f"Health check '{name}' failed: {e}")
            
            result = HealthCheckResult(
                name=name,
                status=HealthStatus.UNHEALTHY,
                message=f"Check failed: {str(e)}",
                duration_ms=duration_ms,
                timestamp=datetime.utcnow(),
                details={"error": str(e), "type": type(e).__name__}
            )
            self.last_results[name] = result
            return result
    
    async def run_all_checks(self) -> Dict[str, HealthCheckResult]:
        """Run all registered health checks"""
        tasks = [self.run_check(name) for name in self.checks.keys()]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            name: result if isinstance(result, HealthCheckResult) else 
            HealthCheckResult(
                name=name,
                status=HealthStatus.UNHEALTHY,
                message=f"Unexpected error: {result}",
                duration_ms=0,
                timestamp=datetime.utcnow()
            )
            for name, result in zip(self.checks.keys(), results)
        }
    
    def get_overall_status(self, results: Dict[str, HealthCheckResult]) -> HealthStatus:
        """Determine overall system health status"""
        if not results:
            return HealthStatus.UNKNOWN
        
        statuses = [result.status for result in results.values()]
        
        if any(status == HealthStatus.UNHEALTHY for status in statuses):
            return HealthStatus.UNHEALTHY
        elif any(status == HealthStatus.DEGRADED for status in statuses):
            return HealthStatus.DEGRADED
        elif all(status == HealthStatus.HEALTHY for status in statuses):
            return HealthStatus.HEALTHY
        else:
            return HealthStatus.UNKNOWN

# Global health checker instance
health_checker = HealthChecker()

# Health check implementations

async def check_database() -> HealthCheckResult:
    """Check database connectivity and performance"""
    try:
        async for db in get_db():
            start_time = time.time()
            
            # Test basic connectivity
            result = await db.execute(text("SELECT 1"))
            query_time = (time.time() - start_time) * 1000
            
            # Test connection pool
            pool_info = db.get_bind().pool.status()
            
            # Check for slow queries (> 100ms is concerning)
            if query_time > 100:
                status = HealthStatus.DEGRADED
                message = f"Database responding slowly ({query_time:.1f}ms)"
            else:
                status = HealthStatus.HEALTHY
                message = f"Database OK ({query_time:.1f}ms)"
            
            return HealthCheckResult(
                name="database",
                status=status,
                message=message,
                duration_ms=0,  # Will be set by run_check
                timestamp=datetime.utcnow(),
                details={
                    "query_time_ms": query_time,
                    "pool_status": pool_info
                }
            )
            
    except Exception as e:
        return HealthCheckResult(
            name="database",
            status=HealthStatus.UNHEALTHY,
            message=f"Database connection failed: {str(e)}",
            duration_ms=0,
            timestamp=datetime.utcnow(),
            details={"error": str(e)}
        )

async def check_redis() -> HealthCheckResult:
    """Check Redis connectivity and performance"""
    try:
        redis_client = get_redis()
        start_time = time.time()
        
        # Test basic connectivity
        await redis_client.ping()
        ping_time = (time.time() - start_time) * 1000
        
        # Get Redis info
        info = await redis_client.info()
        memory_usage = info.get('used_memory_human', 'unknown')
        connected_clients = info.get('connected_clients', 0)
        
        # Check for performance issues
        if ping_time > 50:
            status = HealthStatus.DEGRADED
            message = f"Redis responding slowly ({ping_time:.1f}ms)"
        else:
            status = HealthStatus.HEALTHY
            message = f"Redis OK ({ping_time:.1f}ms)"
        
        return HealthCheckResult(
            name="redis",
            status=status,
            message=message,
            duration_ms=0,
            timestamp=datetime.utcnow(),
            details={
                "ping_time_ms": ping_time,
                "memory_usage": memory_usage,
                "connected_clients": connected_clients,
                "version": info.get('redis_version', 'unknown')
            }
        )
        
    except Exception as e:
        return HealthCheckResult(
            name="redis",
            status=HealthStatus.UNHEALTHY,
            message=f"Redis connection failed: {str(e)}",
            duration_ms=0,
            timestamp=datetime.utcnow(),
            details={"error": str(e)}
        )

async def check_external_apis() -> HealthCheckResult:
    """Check external API connectivity"""
    apis_to_check = [
        {"name": "Bling API", "url": "https://bling.com.br/Api/v3/", "timeout": 10},
        {"name": "Mercado Livre API", "url": "https://api.mercadolibre.com/sites/MLB", "timeout": 10}
    ]
    
    results = []
    overall_status = HealthStatus.HEALTHY
    
    async with httpx.AsyncClient() as client:
        for api in apis_to_check:
            try:
                start_time = time.time()
                response = await client.get(api["url"], timeout=api["timeout"])
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    api_status = HealthStatus.HEALTHY
                    api_message = f"OK ({response_time:.1f}ms)"
                elif response.status_code < 500:
                    api_status = HealthStatus.DEGRADED
                    api_message = f"HTTP {response.status_code} ({response_time:.1f}ms)"
                    overall_status = HealthStatus.DEGRADED
                else:
                    api_status = HealthStatus.UNHEALTHY
                    api_message = f"HTTP {response.status_code} ({response_time:.1f}ms)"
                    overall_status = HealthStatus.UNHEALTHY
                
                results.append({
                    "name": api["name"],
                    "status": api_status.value,
                    "message": api_message,
                    "response_time_ms": response_time,
                    "status_code": response.status_code
                })
                
            except Exception as e:
                overall_status = HealthStatus.UNHEALTHY
                results.append({
                    "name": api["name"],
                    "status": HealthStatus.UNHEALTHY.value,
                    "message": f"Connection failed: {str(e)}",
                    "error": str(e)
                })
    
    healthy_apis = sum(1 for r in results if r["status"] == "healthy")
    total_apis = len(results)
    
    return HealthCheckResult(
        name="external_apis",
        status=overall_status,
        message=f"{healthy_apis}/{total_apis} APIs healthy",
        duration_ms=0,
        timestamp=datetime.utcnow(),
        details={"apis": results}
    )

async def check_system_resources() -> HealthCheckResult:
    """Check system resource usage"""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_percent = (disk.used / disk.total) * 100
        
        # Load average (Unix only)
        try:
            load_avg = psutil.getloadavg()
        except AttributeError:
            load_avg = None
        
        # Determine status based on thresholds
        issues = []
        status = HealthStatus.HEALTHY
        
        if cpu_percent > 90:
            issues.append(f"High CPU usage: {cpu_percent:.1f}%")
            status = HealthStatus.UNHEALTHY
        elif cpu_percent > 70:
            issues.append(f"Elevated CPU usage: {cpu_percent:.1f}%")
            status = HealthStatus.DEGRADED
        
        if memory_percent > 90:
            issues.append(f"High memory usage: {memory_percent:.1f}%")
            status = HealthStatus.UNHEALTHY
        elif memory_percent > 80:
            issues.append(f"Elevated memory usage: {memory_percent:.1f}%")
            if status == HealthStatus.HEALTHY:
                status = HealthStatus.DEGRADED
        
        if disk_percent > 95:
            issues.append(f"High disk usage: {disk_percent:.1f}%")
            status = HealthStatus.UNHEALTHY
        elif disk_percent > 85:
            issues.append(f"Elevated disk usage: {disk_percent:.1f}%")
            if status == HealthStatus.HEALTHY:
                status = HealthStatus.DEGRADED
        
        message = "; ".join(issues) if issues else "System resources OK"
        
        details = {
            "cpu_percent": cpu_percent,
            "memory_percent": memory_percent,
            "memory_available_gb": memory.available / (1024**3),
            "disk_percent": disk_percent,
            "disk_free_gb": disk.free / (1024**3)
        }
        
        if load_avg:
            details["load_average"] = load_avg
        
        return HealthCheckResult(
            name="system_resources",
            status=status,
            message=message,
            duration_ms=0,
            timestamp=datetime.utcnow(),
            details=details
        )
        
    except Exception as e:
        return HealthCheckResult(
            name="system_resources",
            status=HealthStatus.UNHEALTHY,
            message=f"Failed to check system resources: {str(e)}",
            duration_ms=0,
            timestamp=datetime.utcnow(),
            details={"error": str(e)}
        )

async def check_application_metrics() -> HealthCheckResult:
    """Check application-specific metrics"""
    try:
        # This would typically check application-specific metrics
        # For now, we'll check basic application health indicators
        
        details = {
            "uptime_seconds": time.time() - getattr(check_application_metrics, '_start_time', time.time()),
            "python_version": psutil.Process().exe(),
            "process_id": psutil.Process().pid,
            "thread_count": psutil.Process().num_threads(),
            "open_files": len(psutil.Process().open_files()),
            "memory_info": psutil.Process().memory_info()._asdict()
        }
        
        # Set start time if not set
        if not hasattr(check_application_metrics, '_start_time'):
            check_application_metrics._start_time = time.time()
        
        return HealthCheckResult(
            name="application",
            status=HealthStatus.HEALTHY,
            message="Application running normally",
            duration_ms=0,
            timestamp=datetime.utcnow(),
            details=details
        )
        
    except Exception as e:
        return HealthCheckResult(
            name="application",
            status=HealthStatus.UNHEALTHY,
            message=f"Application health check failed: {str(e)}",
            duration_ms=0,
            timestamp=datetime.utcnow(),
            details={"error": str(e)}
        )

# Register all health checks
health_checker.register_check("database", check_database, interval=30)
health_checker.register_check("redis", check_redis, interval=30)
health_checker.register_check("external_apis", check_external_apis, interval=60)
health_checker.register_check("system_resources", check_system_resources, interval=60)
health_checker.register_check("application", check_application_metrics, interval=60)

async def get_health_summary() -> Dict[str, Any]:
    """Get comprehensive health summary"""
    results = await health_checker.run_all_checks()
    overall_status = health_checker.get_overall_status(results)
    
    return {
        "status": overall_status.value,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {name: result.to_dict() for name, result in results.items()},
        "summary": {
            "total_checks": len(results),
            "healthy_checks": sum(1 for r in results.values() if r.status == HealthStatus.HEALTHY),
            "degraded_checks": sum(1 for r in results.values() if r.status == HealthStatus.DEGRADED),
            "unhealthy_checks": sum(1 for r in results.values() if r.status == HealthStatus.UNHEALTHY),
            "unknown_checks": sum(1 for r in results.values() if r.status == HealthStatus.UNKNOWN)
        }
    }

async def get_readiness_check() -> Dict[str, Any]:
    """Kubernetes readiness probe - check if app can serve traffic"""
    critical_checks = ["database", "redis"]
    results = {}
    
    for check_name in critical_checks:
        results[check_name] = await health_checker.run_check(check_name)
    
    overall_status = health_checker.get_overall_status(results)
    ready = overall_status in [HealthStatus.HEALTHY, HealthStatus.DEGRADED]
    
    return {
        "ready": ready,
        "status": overall_status.value,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {name: result.to_dict() for name, result in results.items()}
    }

async def get_liveness_check() -> Dict[str, Any]:
    """Kubernetes liveness probe - check if app is alive"""
    # Simple check to ensure the application is responsive
    try:
        start_time = time.time()
        
        # Basic application health
        app_result = await check_application_metrics()
        response_time = (time.time() - start_time) * 1000
        
        alive = app_result.status != HealthStatus.UNHEALTHY
        
        return {
            "alive": alive,
            "status": app_result.status.value,
            "response_time_ms": response_time,
            "timestamp": datetime.utcnow().isoformat(),
            "message": app_result.message
        }
        
    except Exception as e:
        return {
            "alive": False,
            "status": HealthStatus.UNHEALTHY.value,
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }