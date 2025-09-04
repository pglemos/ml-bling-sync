"""Tests for security functionality"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi import FastAPI, Request, Response
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from app.core.security import (
    SecurityValidator, SecurityHeaders, get_client_ip,
    hash_identifier, generate_secure_token
)
from app.core.rate_limiting import RateLimiter, RateLimitConfig
from app.core.circuit_breaker import (
    CircuitBreaker, CircuitBreakerConfig, CircuitState,
    retry_with_backoff, RetryConfig
)
from app.core.security_middleware import SecurityMiddleware, CSRFMiddleware

class TestSecurityValidator:
    """Test security validation functionality"""
    
    def setup_method(self):
        self.validator = SecurityValidator()
    
    def test_sanitize_string(self):
        """Test string sanitization"""
        # Test HTML escaping
        assert self.validator.sanitize_string("<script>alert('xss')</script>") == "&lt;script&gt;alert('xss')&lt;/script&gt;"
        
        # Test normal string
        assert self.validator.sanitize_string("normal text") == "normal text"
        
        # Test empty string
        assert self.validator.sanitize_string("") == ""
        
        # Test None
        assert self.validator.sanitize_string(None) == ""
    
    def test_validate_sql_injection(self):
        """Test SQL injection detection"""
        # Test malicious patterns
        assert not self.validator.validate_sql_injection("'; DROP TABLE users; --")
        assert not self.validator.validate_sql_injection("1' OR '1'='1")
        assert not self.validator.validate_sql_injection("UNION SELECT * FROM passwords")
        
        # Test safe strings
        assert self.validator.validate_sql_injection("normal search term")
        assert self.validator.validate_sql_injection("user@example.com")
        assert self.validator.validate_sql_injection("product-123")
    
    def test_validate_xss(self):
        """Test XSS detection"""
        # Test malicious patterns
        assert not self.validator.validate_xss("<script>alert('xss')</script>")
        assert not self.validator.validate_xss("javascript:alert('xss')")
        assert not self.validator.validate_xss("<img src=x onerror=alert('xss')>")
        
        # Test safe strings
        assert self.validator.validate_xss("normal text")
        assert self.validator.validate_xss("<p>Safe HTML</p>")
        assert self.validator.validate_xss("user@example.com")
    
    def test_validate_email(self):
        """Test email validation"""
        # Test valid emails
        assert self.validator.validate_email("user@example.com")
        assert self.validator.validate_email("test.email+tag@domain.co.uk")
        
        # Test invalid emails
        assert not self.validator.validate_email("invalid-email")
        assert not self.validator.validate_email("@domain.com")
        assert not self.validator.validate_email("user@")
    
    def test_validate_uuid(self):
        """Test UUID validation"""
        # Test valid UUIDs
        assert self.validator.validate_uuid("123e4567-e89b-12d3-a456-426614174000")
        assert self.validator.validate_uuid("550e8400-e29b-41d4-a716-446655440000")
        
        # Test invalid UUIDs
        assert not self.validator.validate_uuid("invalid-uuid")
        assert not self.validator.validate_uuid("123-456-789")
        assert not self.validator.validate_uuid("")
    
    def test_sanitize_filename(self):
        """Test filename sanitization"""
        # Test dangerous filenames
        assert self.validator.sanitize_filename("../../../etc/passwd") == "etc_passwd"
        assert self.validator.sanitize_filename("file<script>.txt") == "file_script_.txt"
        assert self.validator.sanitize_filename("con.txt") == "con_.txt"  # Windows reserved
        
        # Test normal filenames
        assert self.validator.sanitize_filename("document.pdf") == "document.pdf"
        assert self.validator.sanitize_filename("my-file_123.txt") == "my-file_123.txt"

class TestSecurityHeaders:
    """Test security headers functionality"""
    
    def setup_method(self):
        self.headers = SecurityHeaders()
    
    def test_get_security_headers(self):
        """Test security headers generation"""
        headers = self.headers.get_security_headers()
        
        # Check required headers
        assert "X-Content-Type-Options" in headers
        assert "X-Frame-Options" in headers
        assert "X-XSS-Protection" in headers
        assert "Strict-Transport-Security" in headers
        assert "Content-Security-Policy" in headers
        assert "Referrer-Policy" in headers
        
        # Check values
        assert headers["X-Content-Type-Options"] == "nosniff"
        assert headers["X-Frame-Options"] == "DENY"
        assert headers["X-XSS-Protection"] == "1; mode=block"

class TestRateLimiter:
    """Test rate limiting functionality"""
    
    @pytest.fixture
    def mock_redis(self):
        """Mock Redis client"""
        redis_mock = Mock()
        redis_mock.pipeline.return_value.__enter__.return_value = redis_mock
        redis_mock.pipeline.return_value.__exit__.return_value = None
        redis_mock.zcard.return_value = 0
        redis_mock.zremrangebyscore.return_value = None
        redis_mock.zadd.return_value = None
        redis_mock.expire.return_value = None
        redis_mock.execute.return_value = [0, None, None, None]
        return redis_mock
    
    def test_rate_limiter_init(self, mock_redis):
        """Test rate limiter initialization"""
        config = RateLimitConfig()
        limiter = RateLimiter(mock_redis, config)
        
        assert limiter.redis == mock_redis
        assert limiter.config == config
    
    @pytest.mark.asyncio
    async def test_check_rate_limit_allowed(self, mock_redis):
        """Test rate limit check when allowed"""
        config = RateLimitConfig()
        limiter = RateLimiter(mock_redis, config)
        
        # Mock Redis to return count below limit
        mock_redis.execute.return_value = [5, None, None, None]  # 5 requests in window
        
        result = await limiter.check_rate_limit("test_key", "default")
        
        assert result.allowed is True
        assert result.remaining > 0
    
    @pytest.mark.asyncio
    async def test_check_rate_limit_blocked(self, mock_redis):
        """Test rate limit check when blocked"""
        config = RateLimitConfig()
        limiter = RateLimiter(mock_redis, config)
        
        # Mock Redis to return count above limit
        mock_redis.execute.return_value = [101, None, None, None]  # 101 requests in window
        
        result = await limiter.check_rate_limit("test_key", "default")
        
        assert result.allowed is False
        assert result.remaining == 0

class TestCircuitBreaker:
    """Test circuit breaker functionality"""
    
    @pytest.fixture
    def mock_redis(self):
        """Mock Redis client"""
        redis_mock = Mock()
        redis_mock.hget.return_value = None
        redis_mock.hset.return_value = None
        redis_mock.hincrby.return_value = 1
        redis_mock.expire.return_value = None
        return redis_mock
    
    def test_circuit_breaker_init(self, mock_redis):
        """Test circuit breaker initialization"""
        config = CircuitBreakerConfig()
        cb = CircuitBreaker("test_service", config, mock_redis)
        
        assert cb.name == "test_service"
        assert cb.config == config
        assert cb.redis == mock_redis
    
    @pytest.mark.asyncio
    async def test_circuit_breaker_closed_state(self, mock_redis):
        """Test circuit breaker in closed state"""
        config = CircuitBreakerConfig(failure_threshold=5)
        cb = CircuitBreaker("test_service", config, mock_redis)
        
        # Mock Redis to return closed state
        mock_redis.hget.side_effect = lambda key, field: {
            "state": "closed",
            "failure_count": "2"
        }.get(field)
        
        async def test_func():
            return "success"
        
        result = await cb.call(test_func)
        assert result == "success"
    
    @pytest.mark.asyncio
    async def test_circuit_breaker_open_state(self, mock_redis):
        """Test circuit breaker in open state"""
        config = CircuitBreakerConfig(failure_threshold=5, recovery_timeout=60)
        cb = CircuitBreaker("test_service", config, mock_redis)
        
        # Mock Redis to return open state (recent)
        current_time = datetime.now().timestamp()
        mock_redis.hget.side_effect = lambda key, field: {
            "state": "open",
            "failure_count": "6",
            "opened_at": str(current_time - 30)  # Opened 30 seconds ago
        }.get(field)
        
        async def test_func():
            return "success"
        
        with pytest.raises(Exception):  # Should raise CircuitBreakerOpenError
            await cb.call(test_func)

class TestRetryMechanism:
    """Test retry mechanism"""
    
    @pytest.mark.asyncio
    async def test_retry_success_on_first_attempt(self):
        """Test successful execution on first attempt"""
        config = RetryConfig(max_attempts=3)
        
        call_count = 0
        async def test_func():
            nonlocal call_count
            call_count += 1
            return "success"
        
        result = await retry_with_backoff(test_func, config)
        
        assert result == "success"
        assert call_count == 1
    
    @pytest.mark.asyncio
    async def test_retry_success_after_failures(self):
        """Test successful execution after some failures"""
        config = RetryConfig(max_attempts=3, base_delay=0.01)  # Fast for testing
        
        call_count = 0
        async def test_func():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise Exception("Temporary failure")
            return "success"
        
        result = await retry_with_backoff(test_func, config)
        
        assert result == "success"
        assert call_count == 3
    
    @pytest.mark.asyncio
    async def test_retry_max_attempts_exceeded(self):
        """Test failure when max attempts exceeded"""
        config = RetryConfig(max_attempts=2, base_delay=0.01)
        
        call_count = 0
        async def test_func():
            nonlocal call_count
            call_count += 1
            raise Exception("Persistent failure")
        
        with pytest.raises(Exception, match="Persistent failure"):
            await retry_with_backoff(test_func, config)
        
        assert call_count == 2

class TestSecurityMiddleware:
    """Test security middleware"""
    
    def setup_method(self):
        self.app = FastAPI()
        
        @self.app.get("/test")
        async def test_endpoint():
            return {"message": "success"}
        
        # Add security middleware
        self.app.add_middleware(SecurityMiddleware)
        self.client = TestClient(self.app)
    
    def test_security_headers_added(self):
        """Test that security headers are added to responses"""
        response = self.client.get("/test")
        
        assert response.status_code == 200
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "X-XSS-Protection" in response.headers
    
    def test_large_request_blocked(self):
        """Test that large requests are blocked"""
        large_data = "x" * (10 * 1024 * 1024 + 1)  # > 10MB
        
        response = self.client.post("/test", data=large_data)
        
        assert response.status_code == 413  # Request Entity Too Large
    
    def test_suspicious_user_agent_blocked(self):
        """Test that suspicious user agents are blocked"""
        response = self.client.get("/test", headers={"User-Agent": "sqlmap"})
        
        assert response.status_code == 403  # Forbidden

class TestCSRFMiddleware:
    """Test CSRF protection middleware"""
    
    def setup_method(self):
        self.app = FastAPI()
        
        @self.app.post("/test")
        async def test_endpoint():
            return {"message": "success"}
        
        # Add CSRF middleware
        self.app.add_middleware(CSRFMiddleware)
        self.client = TestClient(self.app)
    
    def test_csrf_token_required_for_post(self):
        """Test that CSRF token is required for POST requests"""
        response = self.client.post("/test", json={"data": "test"})
        
        assert response.status_code == 403  # Forbidden due to missing CSRF token
    
    def test_csrf_token_valid(self):
        """Test that valid CSRF token allows request"""
        # First, get a CSRF token (this would typically be from a form)
        # For testing, we'll mock the token validation
        with patch('app.core.security_middleware.CSRFMiddleware._validate_csrf_token', return_value=True):
            response = self.client.post(
                "/test", 
                json={"data": "test"},
                headers={"X-CSRF-Token": "valid-token"}
            )
            
            assert response.status_code == 200

class TestSecurityUtilities:
    """Test security utility functions"""
    
    def test_get_client_ip(self):
        """Test client IP extraction"""
        # Mock request with X-Forwarded-For header
        request = Mock()
        request.headers = {"X-Forwarded-For": "192.168.1.1, 10.0.0.1"}
        request.client.host = "127.0.0.1"
        
        ip = get_client_ip(request)
        assert ip == "192.168.1.1"
        
        # Mock request without X-Forwarded-For
        request.headers = {}
        ip = get_client_ip(request)
        assert ip == "127.0.0.1"
    
    def test_hash_identifier(self):
        """Test identifier hashing"""
        identifier = "user123"
        hashed = hash_identifier(identifier)
        
        assert hashed != identifier
        assert len(hashed) == 64  # SHA-256 hex digest length
        
        # Same input should produce same hash
        assert hash_identifier(identifier) == hashed
    
    def test_generate_secure_token(self):
        """Test secure token generation"""
        token1 = generate_secure_token()
        token2 = generate_secure_token()
        
        assert token1 != token2
        assert len(token1) == 64  # 32 bytes = 64 hex chars
        assert len(token2) == 64
        
        # Test custom length
        token3 = generate_secure_token(16)
        assert len(token3) == 32  # 16 bytes = 32 hex chars

class TestSecurityIntegration:
    """Integration tests for security components"""
    
    @pytest.mark.asyncio
    async def test_rate_limiting_with_circuit_breaker(self):
        """Test rate limiting combined with circuit breaker"""
        # This would test the interaction between rate limiting and circuit breaker
        # when both are applied to the same service
        pass
    
    @pytest.mark.asyncio
    async def test_security_event_logging(self):
        """Test that security events are properly logged"""
        # This would test the security event logging functionality
        pass
    
    def test_end_to_end_security_flow(self):
        """Test complete security flow from request to response"""
        # This would test the entire security pipeline:
        # 1. Request validation
        # 2. Rate limiting
        # 3. Authentication
        # 4. Authorization
        # 5. Circuit breaker
        # 6. Response security headers
        pass

if __name__ == "__main__":
    pytest.main([__file__])