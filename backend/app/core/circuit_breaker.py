"""Circuit breaker and retry mechanisms for external integrations"""

import asyncio
import time
import logging
from typing import Any, Callable, Optional, Dict, List, Union
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import random
import json
from functools import wraps
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Circuit is open, requests fail fast
    HALF_OPEN = "half_open" # Testing if service is back

@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker"""
    failure_threshold: int = 5          # Number of failures to open circuit
    recovery_timeout: int = 60          # Seconds to wait before trying half-open
    success_threshold: int = 3          # Successes needed in half-open to close
    timeout: float = 30.0               # Request timeout in seconds
    expected_exception: tuple = (Exception,)  # Exceptions that count as failures

@dataclass
class CircuitBreakerStats:
    """Circuit breaker statistics"""
    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: Optional[float] = None
    last_success_time: Optional[float] = None
    total_requests: int = 0
    total_failures: int = 0
    total_successes: int = 0
    opened_at: Optional[float] = None
    last_state_change: float = field(default_factory=time.time)

class CircuitBreaker:
    """Circuit breaker implementation with Redis persistence"""
    
    def __init__(
        self, 
        name: str,
        config: CircuitBreakerConfig,
        redis_client: Optional[redis.Redis] = None
    ):
        self.name = name
        self.config = config
        self.redis = redis_client
        self._stats = CircuitBreakerStats()
        self._lock = asyncio.Lock()
    
    async def _load_stats(self) -> CircuitBreakerStats:
        """Load stats from Redis"""
        if not self.redis:
            return self._stats
        
        try:
            data = await self.redis.get(f"circuit_breaker:{self.name}")
            if data:
                stats_dict = json.loads(data)
                stats = CircuitBreakerStats(
                    state=CircuitState(stats_dict.get('state', 'closed')),
                    failure_count=stats_dict.get('failure_count', 0),
                    success_count=stats_dict.get('success_count', 0),
                    last_failure_time=stats_dict.get('last_failure_time'),
                    last_success_time=stats_dict.get('last_success_time'),
                    total_requests=stats_dict.get('total_requests', 0),
                    total_failures=stats_dict.get('total_failures', 0),
                    total_successes=stats_dict.get('total_successes', 0),
                    opened_at=stats_dict.get('opened_at'),
                    last_state_change=stats_dict.get('last_state_change', time.time())
                )
                return stats
        except Exception as e:
            logger.error(f"Error loading circuit breaker stats: {e}")
        
        return CircuitBreakerStats()
    
    async def _save_stats(self, stats: CircuitBreakerStats):
        """Save stats to Redis"""
        if not self.redis:
            return
        
        try:
            data = {
                'state': stats.state.value,
                'failure_count': stats.failure_count,
                'success_count': stats.success_count,
                'last_failure_time': stats.last_failure_time,
                'last_success_time': stats.last_success_time,
                'total_requests': stats.total_requests,
                'total_failures': stats.total_failures,
                'total_successes': stats.total_successes,
                'opened_at': stats.opened_at,
                'last_state_change': stats.last_state_change
            }
            await self.redis.setex(
                f"circuit_breaker:{self.name}",
                3600,  # 1 hour TTL
                json.dumps(data)
            )
        except Exception as e:
            logger.error(f"Error saving circuit breaker stats: {e}")
    
    async def _should_attempt_reset(self, stats: CircuitBreakerStats) -> bool:
        """Check if we should attempt to reset from OPEN to HALF_OPEN"""
        if stats.state != CircuitState.OPEN:
            return False
        
        if not stats.opened_at:
            return True
        
        return time.time() - stats.opened_at >= self.config.recovery_timeout
    
    async def _record_success(self, stats: CircuitBreakerStats) -> CircuitBreakerStats:
        """Record a successful call"""
        stats.success_count += 1
        stats.total_successes += 1
        stats.last_success_time = time.time()
        
        if stats.state == CircuitState.HALF_OPEN:
            if stats.success_count >= self.config.success_threshold:
                stats.state = CircuitState.CLOSED
                stats.failure_count = 0
                stats.success_count = 0
                stats.opened_at = None
                stats.last_state_change = time.time()
                logger.info(f"Circuit breaker {self.name} closed after successful recovery")
        
        return stats
    
    async def _record_failure(self, stats: CircuitBreakerStats) -> CircuitBreakerStats:
        """Record a failed call"""
        stats.failure_count += 1
        stats.total_failures += 1
        stats.last_failure_time = time.time()
        
        if stats.state == CircuitState.CLOSED:
            if stats.failure_count >= self.config.failure_threshold:
                stats.state = CircuitState.OPEN
                stats.opened_at = time.time()
                stats.last_state_change = time.time()
                logger.warning(f"Circuit breaker {self.name} opened due to {stats.failure_count} failures")
        elif stats.state == CircuitState.HALF_OPEN:
            stats.state = CircuitState.OPEN
            stats.opened_at = time.time()
            stats.last_state_change = time.time()
            logger.warning(f"Circuit breaker {self.name} reopened during half-open test")
        
        return stats
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        async with self._lock:
            stats = await self._load_stats()
            stats.total_requests += 1
            
            # Check if circuit is open
            if stats.state == CircuitState.OPEN:
                if not await self._should_attempt_reset(stats):
                    await self._save_stats(stats)
                    raise CircuitBreakerOpenError(
                        f"Circuit breaker {self.name} is open. "
                        f"Next attempt in {self.config.recovery_timeout - (time.time() - (stats.opened_at or 0)):.1f}s"
                    )
                else:
                    stats.state = CircuitState.HALF_OPEN
                    stats.success_count = 0
                    stats.last_state_change = time.time()
                    logger.info(f"Circuit breaker {self.name} entering half-open state")
        
        # Execute the function
        try:
            if asyncio.iscoroutinefunction(func):
                result = await asyncio.wait_for(
                    func(*args, **kwargs),
                    timeout=self.config.timeout
                )
            else:
                result = func(*args, **kwargs)
            
            # Record success
            async with self._lock:
                stats = await self._record_success(stats)
                await self._save_stats(stats)
            
            return result
            
        except self.config.expected_exception as e:
            # Record failure
            async with self._lock:
                stats = await self._record_failure(stats)
                await self._save_stats(stats)
            
            logger.error(f"Circuit breaker {self.name} recorded failure: {e}")
            raise
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get current circuit breaker statistics"""
        stats = await self._load_stats()
        return {
            'name': self.name,
            'state': stats.state.value,
            'failure_count': stats.failure_count,
            'success_count': stats.success_count,
            'total_requests': stats.total_requests,
            'total_failures': stats.total_failures,
            'total_successes': stats.total_successes,
            'failure_rate': stats.total_failures / max(stats.total_requests, 1),
            'last_failure_time': stats.last_failure_time,
            'last_success_time': stats.last_success_time,
            'opened_at': stats.opened_at,
            'last_state_change': stats.last_state_change,
            'config': {
                'failure_threshold': self.config.failure_threshold,
                'recovery_timeout': self.config.recovery_timeout,
                'success_threshold': self.config.success_threshold,
                'timeout': self.config.timeout
            }
        }
    
    async def reset(self):
        """Manually reset circuit breaker to closed state"""
        async with self._lock:
            stats = CircuitBreakerStats()
            await self._save_stats(stats)
            logger.info(f"Circuit breaker {self.name} manually reset")

class CircuitBreakerOpenError(Exception):
    """Exception raised when circuit breaker is open"""
    pass

class RetryConfig:
    """Configuration for retry mechanism"""
    
    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
        retryable_exceptions: tuple = (Exception,)
    ):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.retryable_exceptions = retryable_exceptions
    
    def calculate_delay(self, attempt: int) -> float:
        """Calculate delay for given attempt number"""
        delay = self.base_delay * (self.exponential_base ** (attempt - 1))
        delay = min(delay, self.max_delay)
        
        if self.jitter:
            # Add jitter to prevent thundering herd
            delay = delay * (0.5 + random.random() * 0.5)
        
        return delay

async def retry_with_backoff(
    func: Callable,
    config: RetryConfig,
    *args,
    **kwargs
) -> Any:
    """Execute function with retry and exponential backoff"""
    last_exception = None
    
    for attempt in range(1, config.max_attempts + 1):
        try:
            if asyncio.iscoroutinefunction(func):
                return await func(*args, **kwargs)
            else:
                return func(*args, **kwargs)
        
        except config.retryable_exceptions as e:
            last_exception = e
            
            if attempt == config.max_attempts:
                logger.error(f"All {config.max_attempts} retry attempts failed for {func.__name__}")
                break
            
            delay = config.calculate_delay(attempt)
            logger.warning(
                f"Attempt {attempt}/{config.max_attempts} failed for {func.__name__}: {e}. "
                f"Retrying in {delay:.2f}s"
            )
            
            await asyncio.sleep(delay)
    
    raise last_exception

# Decorator for circuit breaker
def circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: int = 60,
    success_threshold: int = 3,
    timeout: float = 30.0,
    redis_client: Optional[redis.Redis] = None
):
    """Decorator to add circuit breaker protection to a function"""
    config = CircuitBreakerConfig(
        failure_threshold=failure_threshold,
        recovery_timeout=recovery_timeout,
        success_threshold=success_threshold,
        timeout=timeout
    )
    
    breaker = CircuitBreaker(name, config, redis_client)
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await breaker.call(func, *args, **kwargs)
        return wrapper
    return decorator

# Decorator for retry
def retry(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: tuple = (Exception,)
):
    """Decorator to add retry logic to a function"""
    config = RetryConfig(
        max_attempts=max_attempts,
        base_delay=base_delay,
        max_delay=max_delay,
        exponential_base=exponential_base,
        jitter=jitter,
        retryable_exceptions=retryable_exceptions
    )
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await retry_with_backoff(func, config, *args, **kwargs)
        return wrapper
    return decorator

# Combined decorator
def resilient(
    name: str,
    max_attempts: int = 3,
    base_delay: float = 1.0,
    failure_threshold: int = 5,
    recovery_timeout: int = 60,
    timeout: float = 30.0,
    redis_client: Optional[redis.Redis] = None
):
    """Decorator combining retry and circuit breaker"""
    def decorator(func):
        # Apply circuit breaker first, then retry
        func = circuit_breaker(
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
            timeout=timeout,
            redis_client=redis_client
        )(func)
        
        func = retry(
            max_attempts=max_attempts,
            base_delay=base_delay
        )(func)
        
        return func
    return decorator

# Circuit breaker manager
class CircuitBreakerManager:
    """Manage multiple circuit breakers"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis = redis_client
        self.breakers: Dict[str, CircuitBreaker] = {}
    
    def get_breaker(
        self, 
        name: str, 
        config: Optional[CircuitBreakerConfig] = None
    ) -> CircuitBreaker:
        """Get or create a circuit breaker"""
        if name not in self.breakers:
            config = config or CircuitBreakerConfig()
            self.breakers[name] = CircuitBreaker(name, config, self.redis)
        return self.breakers[name]
    
    async def get_all_stats(self) -> List[Dict[str, Any]]:
        """Get stats for all circuit breakers"""
        stats = []
        for breaker in self.breakers.values():
            stats.append(await breaker.get_stats())
        return stats
    
    async def reset_all(self):
        """Reset all circuit breakers"""
        for breaker in self.breakers.values():
            await breaker.reset()

# Global circuit breaker manager instance
_circuit_breaker_manager = None

def get_circuit_breaker_manager() -> CircuitBreakerManager:
    """Get global circuit breaker manager"""
    global _circuit_breaker_manager
    if _circuit_breaker_manager is None:
        redis_client = redis.from_url(settings.REDIS_URL) if hasattr(settings, 'REDIS_URL') else None
        _circuit_breaker_manager = CircuitBreakerManager(redis_client)
    return _circuit_breaker_manager