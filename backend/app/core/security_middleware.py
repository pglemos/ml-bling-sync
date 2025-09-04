"""Security middleware for FastAPI application"""

import time
import logging
from typing import Callable, Optional
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.security import (
    SecurityValidator, 
    SecurityHeaders, 
    get_client_ip, 
    hash_identifier,
    log_audit_event
)
from app.core.rate_limiting import RateLimiter, get_rate_limiter
from app.core.config import settings

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    """Comprehensive security middleware"""
    
    def __init__(self, app, enable_rate_limiting: bool = True):
        super().__init__(app)
        self.enable_rate_limiting = enable_rate_limiting
        self.rate_limiter = get_rate_limiter() if enable_rate_limiting else None
        
        # Security configuration
        self.max_request_size = 10 * 1024 * 1024  # 10MB
        self.blocked_user_agents = [
            'sqlmap', 'nikto', 'nmap', 'masscan', 'nessus',
            'openvas', 'w3af', 'skipfish', 'burp'
        ]
        
        # Suspicious patterns in URLs
        self.suspicious_url_patterns = [
            '../', '..\\', '/etc/passwd', '/proc/', 
            'cmd.exe', 'powershell', 'bash', 'sh',
            '<script', 'javascript:', 'vbscript:',
            'union select', 'drop table', 'insert into'
        ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request through security checks"""
        start_time = time.time()
        client_ip = get_client_ip(request)
        hashed_ip = hash_identifier(client_ip)
        
        try:
            # 1. Basic security checks
            await self._check_request_security(request, client_ip)
            
            # 2. Rate limiting
            if self.enable_rate_limiting:
                await self._check_rate_limits(request, hashed_ip)
            
            # 3. Input validation for POST/PUT requests
            if request.method in ["POST", "PUT", "PATCH"]:
                await self._validate_request_body(request)
            
            # 4. Process request
            response = await call_next(request)
            
            # 5. Add security headers
            response = self._add_security_headers(response)
            
            # 6. Log successful request
            processing_time = time.time() - start_time
            await self._log_request(request, response, processing_time, client_ip)
            
            return response
            
        except HTTPException as e:
            # Log security violation
            await self._log_security_violation(request, e, client_ip)
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )
        except Exception as e:
            # Log unexpected error
            logger.error(f"Security middleware error: {e}", exc_info=True)
            await self._log_security_violation(
                request, 
                HTTPException(status_code=500, detail="Internal server error"),
                client_ip
            )
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )
    
    async def _check_request_security(self, request: Request, client_ip: str):
        """Perform basic security checks on request"""
        
        # Check request size
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_request_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Request too large"
            )
        
        # Check User-Agent
        user_agent = request.headers.get("user-agent", "").lower()
        for blocked_agent in self.blocked_user_agents:
            if blocked_agent in user_agent:
                logger.warning(f"Blocked suspicious user agent: {user_agent} from {client_ip}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        # Check URL for suspicious patterns
        url_path = str(request.url.path).lower()
        query_params = str(request.url.query).lower()
        full_url = f"{url_path}?{query_params}"
        
        for pattern in self.suspicious_url_patterns:
            if pattern in full_url:
                logger.warning(f"Suspicious URL pattern detected: {pattern} in {full_url} from {client_ip}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid request"
                )
        
        # Validate URL path
        if not SecurityValidator.validate_sql_safe(url_path):
            logger.warning(f"Potential SQL injection in URL: {url_path} from {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request"
            )
        
        # Check for directory traversal
        if "../" in url_path or "..\\" in url_path:
            logger.warning(f"Directory traversal attempt: {url_path} from {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request"
            )
    
    async def _check_rate_limits(self, request: Request, hashed_ip: str):
        """Check rate limits for the request"""
        if not self.rate_limiter:
            return
        
        # Different limits for different endpoints
        path = request.url.path
        method = request.method
        
        # Authentication endpoints - stricter limits
        if "/auth/" in path:
            limit_key = f"auth:{hashed_ip}"
            if not await self.rate_limiter.check_limit(limit_key, 5, 300):  # 5 requests per 5 minutes
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many authentication attempts"
                )
        
        # API endpoints - general limits
        elif "/api/" in path:
            limit_key = f"api:{hashed_ip}"
            if not await self.rate_limiter.check_limit(limit_key, 100, 60):  # 100 requests per minute
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded"
                )
        
        # File upload endpoints - special limits
        elif "/upload" in path:
            limit_key = f"upload:{hashed_ip}"
            if not await self.rate_limiter.check_limit(limit_key, 10, 60):  # 10 uploads per minute
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Upload rate limit exceeded"
                )
    
    async def _validate_request_body(self, request: Request):
        """Validate request body for security issues"""
        try:
            # Get request body
            body = await request.body()
            if not body:
                return
            
            # Convert to string for validation
            body_str = body.decode('utf-8', errors='ignore')
            
            # Check for SQL injection
            if not SecurityValidator.validate_sql_safe(body_str):
                logger.warning(f"Potential SQL injection in request body from {get_client_ip(request)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid request content"
                )
            
            # Check for XSS
            if not SecurityValidator.validate_xss_safe(body_str):
                logger.warning(f"Potential XSS in request body from {get_client_ip(request)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid request content"
                )
            
        except UnicodeDecodeError:
            # Binary content is okay (e.g., file uploads)
            pass
        except Exception as e:
            logger.error(f"Error validating request body: {e}")
            # Don't block request for validation errors
            pass
    
    def _add_security_headers(self, response: Response) -> Response:
        """Add security headers to response"""
        headers = SecurityHeaders.get_security_headers()
        for key, value in headers.items():
            response.headers[key] = value
        return response
    
    async def _log_request(self, request: Request, response: Response, processing_time: float, client_ip: str):
        """Log request for monitoring"""
        try:
            # Log basic request info
            logger.info(
                f"{request.method} {request.url.path} - {response.status_code} - {processing_time:.3f}s",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "processing_time": processing_time,
                    "client_ip": hash_identifier(client_ip),
                    "user_agent": request.headers.get("user-agent", "unknown")
                }
            )
        except Exception as e:
            logger.error(f"Error logging request: {e}")
    
    async def _log_security_violation(self, request: Request, exception: HTTPException, client_ip: str):
        """Log security violations"""
        try:
            logger.warning(
                f"Security violation: {exception.detail}",
                extra={
                    "violation_type": "security_check_failed",
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": exception.status_code,
                    "detail": exception.detail,
                    "client_ip": hash_identifier(client_ip),
                    "user_agent": request.headers.get("user-agent", "unknown"),
                    "headers": dict(request.headers)
                }
            )
        except Exception as e:
            logger.error(f"Error logging security violation: {e}")

class CSRFMiddleware(BaseHTTPMiddleware):
    """CSRF protection middleware"""
    
    def __init__(self, app, exempt_paths: Optional[list] = None):
        super().__init__(app)
        self.exempt_paths = exempt_paths or [
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/docs",
            "/openapi.json",
            "/health"
        ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Check CSRF token for state-changing requests"""
        
        # Skip CSRF check for safe methods and exempt paths
        if (request.method in ["GET", "HEAD", "OPTIONS"] or 
            any(request.url.path.startswith(path) for path in self.exempt_paths)):
            return await call_next(request)
        
        # Check CSRF token
        csrf_token = request.headers.get("X-CSRF-Token")
        if not csrf_token:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "CSRF token missing"}
            )
        
        # Validate CSRF token (implement your validation logic)
        # For now, just check if it exists
        if len(csrf_token) < 10:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Invalid CSRF token"}
            )
        
        return await call_next(request)

class SecurityEventLogger:
    """Centralized security event logging"""
    
    @staticmethod
    def log_failed_login(username: str, client_ip: str, reason: str):
        """Log failed login attempt"""
        logger.warning(
            f"Failed login attempt for {username}",
            extra={
                "event_type": "failed_login",
                "username": username,
                "client_ip": hash_identifier(client_ip),
                "reason": reason,
                "timestamp": time.time()
            }
        )
    
    @staticmethod
    def log_suspicious_activity(activity_type: str, details: dict, client_ip: str):
        """Log suspicious activity"""
        logger.warning(
            f"Suspicious activity detected: {activity_type}",
            extra={
                "event_type": "suspicious_activity",
                "activity_type": activity_type,
                "details": details,
                "client_ip": hash_identifier(client_ip),
                "timestamp": time.time()
            }
        )
    
    @staticmethod
    def log_privilege_escalation(user_id: str, attempted_action: str, client_ip: str):
        """Log privilege escalation attempt"""
        logger.warning(
            f"Privilege escalation attempt by user {user_id}",
            extra={
                "event_type": "privilege_escalation",
                "user_id": user_id,
                "attempted_action": attempted_action,
                "client_ip": hash_identifier(client_ip),
                "timestamp": time.time()
            }
        )
    
    @staticmethod
    def log_data_access(user_id: str, resource: str, action: str, client_ip: str):
        """Log sensitive data access"""
        logger.info(
            f"Data access: {action} on {resource} by user {user_id}",
            extra={
                "event_type": "data_access",
                "user_id": user_id,
                "resource": resource,
                "action": action,
                "client_ip": hash_identifier(client_ip),
                "timestamp": time.time()
            }
        )

# Security configuration
class SecurityConfig:
    """Security configuration settings"""
    
    # Rate limiting settings
    RATE_LIMIT_ENABLED = True
    RATE_LIMIT_REDIS_URL = getattr(settings, 'REDIS_URL', None)
    
    # Security headers
    SECURITY_HEADERS_ENABLED = True
    
    # CSRF protection
    CSRF_ENABLED = True
    CSRF_EXEMPT_PATHS = [
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/docs",
        "/openapi.json",
        "/health"
    ]
    
    # Request validation
    MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10MB
    VALIDATE_REQUEST_BODY = True
    
    # Logging
    LOG_SECURITY_EVENTS = True
    LOG_ALL_REQUESTS = False  # Set to True for debugging

# Helper function to add all security middleware
def add_security_middleware(app):
    """Add all security middleware to FastAPI app"""
    
    # Add security middleware
    if SecurityConfig.RATE_LIMIT_ENABLED:
        app.add_middleware(
            SecurityMiddleware,
            enable_rate_limiting=True
        )
    
    # Add CSRF middleware
    if SecurityConfig.CSRF_ENABLED:
        app.add_middleware(
            CSRFMiddleware,
            exempt_paths=SecurityConfig.CSRF_EXEMPT_PATHS
        )
    
    return app