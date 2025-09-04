# Security System Documentation

## Overview

The ML Bling Sync platform implements a comprehensive security system designed to protect against various threats and ensure system reliability. The security system includes multiple layers of protection:

- **Rate Limiting**: Prevents abuse and ensures fair resource usage
- **Circuit Breaker**: Protects against cascading failures in external integrations
- **Input Validation**: Prevents injection attacks and malformed data
- **Security Headers**: Protects against common web vulnerabilities
- **CSRF Protection**: Prevents cross-site request forgery attacks
- **Audit Logging**: Tracks security events and user activities
- **IP Blocking**: Blocks malicious IP addresses

## Components

### 1. Rate Limiting

The rate limiting system uses Redis-based sliding window algorithm to control request rates.

#### Configuration

```python
from app.core.rate_limiting import RateLimitConfig

config = RateLimitConfig(
    default_limit=100,  # requests per window
    window_size=3600,   # 1 hour in seconds
    plans={
        "free": {"limit": 50, "window": 3600},
        "pro": {"limit": 500, "window": 3600},
        "enterprise": {"limit": 2000, "window": 3600}
    }
)
```

#### Usage

```python
from app.core.rate_limiting import RateLimiter

limiter = RateLimiter(redis_client, config)
result = await limiter.check_rate_limit("user:123", "pro")

if not result.allowed:
    raise HTTPException(status_code=429, detail="Rate limit exceeded")
```

#### Rate Limit Headers

The system automatically adds rate limit headers to responses:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets
- `X-RateLimit-Retry-After`: Seconds to wait before retrying (when blocked)

### 2. Circuit Breaker

The circuit breaker pattern protects against cascading failures when calling external services.

#### States

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Circuit is open, requests fail fast
- **HALF_OPEN**: Testing if service has recovered

#### Configuration

```python
from app.core.circuit_breaker import CircuitBreakerConfig

config = CircuitBreakerConfig(
    failure_threshold=5,    # Open after 5 failures
    recovery_timeout=60,    # Try recovery after 60 seconds
    success_threshold=3,    # Close after 3 successes in half-open
    timeout=30.0           # Request timeout
)
```

#### Usage

```python
from app.core.circuit_breaker import CircuitBreaker

cb = CircuitBreaker("bling_api", config, redis_client)

@cb.circuit_breaker
async def call_bling_api():
    # Your API call here
    return await bling_client.get_products()

# Or use directly
result = await cb.call(call_bling_api)
```

#### Retry Mechanism

```python
from app.core.circuit_breaker import retry, RetryConfig

retry_config = RetryConfig(
    max_attempts=3,
    base_delay=1.0,
    max_delay=60.0,
    exponential_base=2.0,
    jitter=True
)

@retry(retry_config)
async def unreliable_function():
    # Function that might fail
    pass
```

### 3. Input Validation and Sanitization

The security validator protects against injection attacks and validates input data.

#### Usage

```python
from app.core.security import SecurityValidator

validator = SecurityValidator()

# Sanitize user input
safe_input = validator.sanitize_string(user_input)

# Validate against SQL injection
if not validator.validate_sql_injection(query):
    raise HTTPException(status_code=400, detail="Invalid input")

# Validate against XSS
if not validator.validate_xss(content):
    raise HTTPException(status_code=400, detail="Invalid content")

# Validate email
if not validator.validate_email(email):
    raise HTTPException(status_code=400, detail="Invalid email")

# Sanitize filename
safe_filename = validator.sanitize_filename(uploaded_filename)
```

### 4. Security Middleware

The security middleware provides automatic protection for all requests.

#### Features

- **Request Size Limiting**: Blocks requests larger than configured limit
- **User Agent Filtering**: Blocks known malicious user agents
- **URL Pattern Detection**: Detects suspicious URL patterns
- **Security Headers**: Adds security headers to all responses
- **Rate Limiting**: Applies rate limiting based on user plan
- **Input Validation**: Validates request bodies for POST/PUT/PATCH

#### Configuration

```python
from app.core.security_middleware import add_security_middleware

# Add to FastAPI app
add_security_middleware(app)
```

#### Security Headers

The following security headers are automatically added:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### 5. CSRF Protection

CSRF protection is automatically applied to state-changing requests.

#### How it works

1. CSRF tokens are generated for each session
2. Tokens must be included in POST/PUT/PATCH/DELETE requests
3. Tokens are validated on each request
4. Invalid or missing tokens result in 403 Forbidden

#### Frontend Integration

```javascript
// Get CSRF token from meta tag or API
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

// Include in requests
fetch('/api/v1/products', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(data)
});
```

### 6. Security Monitoring

The system provides comprehensive security monitoring and alerting.

#### Security Events

The following events are automatically logged:

- Failed login attempts
- Rate limit violations
- Circuit breaker state changes
- Suspicious activity detection
- Input validation failures
- IP blocking events
- Privilege escalation attempts

#### Security Dashboard

Access the security dashboard at `/api/v1/security/dashboard` to view:

- Circuit breaker status
- Rate limiting statistics
- Recent security events
- System health metrics
- Blocked IP addresses

#### API Endpoints

```bash
# Get security dashboard
GET /api/v1/security/dashboard

# Get circuit breaker stats
GET /api/v1/security/circuit-breakers

# Reset circuit breaker
POST /api/v1/security/circuit-breakers/{name}/reset

# Get rate limit stats
GET /api/v1/security/rate-limits

# Clear rate limits
DELETE /api/v1/security/rate-limits

# Get security events
GET /api/v1/security/events

# Block IP address
POST /api/v1/security/block-ip

# Unblock IP address
DELETE /api/v1/security/block-ip/{ip}

# Test circuit breaker
POST /api/v1/security/test-circuit-breaker

# Health check
GET /api/v1/security/health
```

## Security Best Practices

### 1. Authentication and Authorization

- Always use JWT tokens for API authentication
- Implement proper role-based access control (RBAC)
- Use refresh tokens for long-lived sessions
- Validate permissions on every request

### 2. Data Protection

- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper session management
- Sanitize all user inputs

### 3. Monitoring and Alerting

- Monitor security events in real-time
- Set up alerts for suspicious activities
- Regularly review security logs
- Implement automated incident response

### 4. Configuration Management

- Use environment variables for sensitive configuration
- Regularly rotate secrets and keys
- Implement proper secret management
- Keep dependencies up to date

### 5. Testing

- Implement security tests in CI/CD pipeline
- Perform regular penetration testing
- Use static code analysis tools
- Test rate limiting and circuit breaker functionality

## Incident Response

### 1. Security Event Detection

When a security event is detected:

1. Event is logged with full context
2. Automated response may be triggered (e.g., IP blocking)
3. Alerts are sent to security team
4. Incident tracking is initiated

### 2. Response Procedures

#### High Severity Events

- Immediate notification to security team
- Automatic blocking of suspicious IPs
- Circuit breaker activation for affected services
- Incident commander assignment

#### Medium Severity Events

- Logged for investigation
- Rate limiting may be applied
- Monitoring increased
- Review within 24 hours

#### Low Severity Events

- Logged for trend analysis
- No immediate action required
- Weekly review process

### 3. Recovery Procedures

1. **Assess Impact**: Determine scope and severity
2. **Contain Threat**: Block malicious actors
3. **Investigate**: Analyze logs and evidence
4. **Remediate**: Fix vulnerabilities
5. **Monitor**: Watch for recurring issues
6. **Document**: Update procedures and lessons learned

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Security Settings
SECURITY_SECRET_KEY=your-secret-key
SECURITY_MAX_REQUEST_SIZE=10485760  # 10MB
SECURITY_RATE_LIMIT_ENABLED=true
SECURITY_CIRCUIT_BREAKER_ENABLED=true
SECURITY_CSRF_ENABLED=true

# Rate Limiting
RATE_LIMIT_DEFAULT=100
RATE_LIMIT_WINDOW=3600

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=60
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=3

# Monitoring
SECURITY_LOG_LEVEL=INFO
SECURITY_ALERT_WEBHOOK=https://your-webhook-url
```

### Database Configuration

The security system uses Redis for:

- Rate limiting counters
- Circuit breaker state
- Blocked IP addresses
- Security event caching

Ensure Redis is properly configured with:

- Persistence enabled
- Appropriate memory limits
- Security (password, network restrictions)
- Monitoring and alerting

## Troubleshooting

### Common Issues

#### Rate Limiting Not Working

1. Check Redis connectivity
2. Verify configuration
3. Check middleware order
4. Review logs for errors

#### Circuit Breaker Not Opening

1. Verify failure threshold configuration
2. Check if exceptions are being caught
3. Review circuit breaker logs
4. Test with manual failures

#### Security Headers Missing

1. Check middleware configuration
2. Verify middleware order
3. Check for conflicting middleware
4. Review response processing

### Debugging

Enable debug logging:

```python
import logging
logging.getLogger('app.core.security').setLevel(logging.DEBUG)
logging.getLogger('app.core.rate_limiting').setLevel(logging.DEBUG)
logging.getLogger('app.core.circuit_breaker').setLevel(logging.DEBUG)
```

### Performance Monitoring

Monitor these metrics:

- Rate limiting overhead
- Circuit breaker response times
- Security validation latency
- Redis performance
- Memory usage

## Security Compliance

The security system helps meet various compliance requirements:

### SOC 2

- Access controls and authentication
- Audit logging and monitoring
- Data protection and encryption
- Incident response procedures

### GDPR

- Data protection by design
- Audit trails for data access
- Security breach notification
- Data minimization principles

### ISO 27001

- Information security management
- Risk assessment and treatment
- Security controls implementation
- Continuous monitoring and improvement

## Updates and Maintenance

### Regular Tasks

- Review security logs weekly
- Update security configurations monthly
- Test incident response procedures quarterly
- Conduct security assessments annually

### Security Updates

- Monitor security advisories
- Apply security patches promptly
- Update dependencies regularly
- Review and update security policies

### Performance Optimization

- Monitor Redis performance
- Optimize rate limiting algorithms
- Tune circuit breaker parameters
- Review security middleware overhead

For more information or support, contact the security team or refer to the API documentation.