"""Security-related Pydantic schemas"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class CircuitBreakerState(str, Enum):
    """Circuit breaker states"""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreakerConfigResponse(BaseModel):
    """Circuit breaker configuration"""
    failure_threshold: int
    recovery_timeout: int
    success_threshold: int
    timeout: float

class CircuitBreakerStatsResponse(BaseModel):
    """Circuit breaker statistics response"""
    name: str
    state: CircuitBreakerState
    failure_count: int
    success_count: int
    total_requests: int
    total_failures: int
    total_successes: int
    failure_rate: float
    last_failure_time: Optional[float]
    last_success_time: Optional[float]
    opened_at: Optional[float]
    last_state_change: float
    config: CircuitBreakerConfigResponse

class RateLimitStatsResponse(BaseModel):
    """Rate limiting statistics response"""
    total_requests: int = 0
    total_blocked: int = 0
    active_limits: int = 0
    top_limited_keys: List[Dict[str, Any]] = []
    current_limits: Dict[str, Dict[str, Any]] = {}

class SecurityEventType(str, Enum):
    """Security event types"""
    FAILED_LOGIN = "failed_login"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    DATA_ACCESS = "data_access"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    CIRCUIT_BREAKER_OPENED = "circuit_breaker_opened"
    IP_BLOCKED = "ip_blocked"
    SECURITY_VIOLATION = "security_violation"

class SecurityEventResponse(BaseModel):
    """Security event response"""
    id: str
    event_type: SecurityEventType
    timestamp: datetime
    user_id: Optional[str]
    client_ip: Optional[str]
    user_agent: Optional[str]
    details: Dict[str, Any]
    severity: str = "medium"
    resolved: bool = False

class SecuritySummaryResponse(BaseModel):
    """Security summary statistics"""
    total_circuit_breakers: int
    open_circuit_breakers: int
    healthy_circuit_breakers: int
    total_rate_limited_requests: int
    active_rate_limits: int
    recent_security_events: int = 0
    failed_logins_last_hour: int = 0
    blocked_ips: int = 0

class SecurityDashboardResponse(BaseModel):
    """Security dashboard response"""
    summary: SecuritySummaryResponse
    circuit_breakers: List[CircuitBreakerStatsResponse]
    rate_limits: RateLimitStatsResponse
    recent_events: List[SecurityEventResponse]
    last_updated: datetime

class BlockIPRequest(BaseModel):
    """Request to block an IP address"""
    ip_address: str = Field(..., description="IP address to block")
    reason: str = Field(..., description="Reason for blocking")
    duration_minutes: int = Field(60, description="Duration in minutes", ge=1, le=43200)  # Max 30 days

class SecurityAlertRequest(BaseModel):
    """Request to create a security alert"""
    alert_type: str = Field(..., description="Type of security alert")
    severity: str = Field("medium", description="Alert severity")
    message: str = Field(..., description="Alert message")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional details")

class SecurityAlertResponse(BaseModel):
    """Security alert response"""
    id: str
    alert_type: str
    severity: str
    message: str
    details: Dict[str, Any]
    created_at: datetime
    resolved: bool
    resolved_at: Optional[datetime]
    resolved_by: Optional[str]

class SecurityConfigResponse(BaseModel):
    """Security configuration response"""
    rate_limiting_enabled: bool
    circuit_breaker_enabled: bool
    security_headers_enabled: bool
    csrf_protection_enabled: bool
    max_request_size: int
    blocked_user_agents: List[str]
    suspicious_patterns: List[str]

class SecurityConfigUpdateRequest(BaseModel):
    """Request to update security configuration"""
    rate_limiting_enabled: Optional[bool] = None
    circuit_breaker_enabled: Optional[bool] = None
    security_headers_enabled: Optional[bool] = None
    csrf_protection_enabled: Optional[bool] = None
    max_request_size: Optional[int] = Field(None, ge=1024, le=100*1024*1024)  # 1KB to 100MB

class ThreatIntelligenceResponse(BaseModel):
    """Threat intelligence response"""
    ip_address: str
    threat_score: float = Field(..., ge=0.0, le=1.0)
    threat_types: List[str]
    country: Optional[str]
    organization: Optional[str]
    last_seen: Optional[datetime]
    is_malicious: bool
    confidence: float = Field(..., ge=0.0, le=1.0)

class SecurityMetricsResponse(BaseModel):
    """Security metrics response"""
    timestamp: datetime
    requests_per_minute: int
    blocked_requests_per_minute: int
    failed_authentications_per_minute: int
    circuit_breaker_trips: int
    average_response_time: float
    error_rate: float

class SecurityReportRequest(BaseModel):
    """Request for security report"""
    start_date: datetime
    end_date: datetime
    report_type: str = Field(..., description="Type of report to generate")
    include_details: bool = Field(False, description="Include detailed events")
    format: str = Field("json", description="Report format (json, csv, pdf)")

class SecurityReportResponse(BaseModel):
    """Security report response"""
    report_id: str
    report_type: str
    generated_at: datetime
    start_date: datetime
    end_date: datetime
    summary: Dict[str, Any]
    download_url: Optional[str]
    expires_at: datetime

class SecurityIncidentRequest(BaseModel):
    """Request to create a security incident"""
    title: str = Field(..., description="Incident title")
    description: str = Field(..., description="Incident description")
    severity: str = Field("medium", description="Incident severity")
    incident_type: str = Field(..., description="Type of incident")
    affected_systems: List[str] = Field(default_factory=list)
    indicators: Dict[str, Any] = Field(default_factory=dict)

class SecurityIncidentResponse(BaseModel):
    """Security incident response"""
    id: str
    title: str
    description: str
    severity: str
    incident_type: str
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: str
    assigned_to: Optional[str]
    affected_systems: List[str]
    indicators: Dict[str, Any]
    timeline: List[Dict[str, Any]]
    resolution: Optional[str]
    resolved_at: Optional[datetime]

class SecurityAuditLogResponse(BaseModel):
    """Security audit log response"""
    id: str
    timestamp: datetime
    user_id: Optional[str]
    action: str
    resource: str
    resource_id: Optional[str]
    client_ip: str
    user_agent: Optional[str]
    success: bool
    details: Dict[str, Any]
    risk_score: float = Field(..., ge=0.0, le=1.0)

class SecurityComplianceResponse(BaseModel):
    """Security compliance response"""
    framework: str  # e.g., "SOC2", "ISO27001", "GDPR"
    compliance_score: float = Field(..., ge=0.0, le=1.0)
    requirements_met: int
    total_requirements: int
    last_assessment: datetime
    next_assessment: datetime
    findings: List[Dict[str, Any]]
    recommendations: List[str]

class SecurityPolicyResponse(BaseModel):
    """Security policy response"""
    id: str
    name: str
    description: str
    policy_type: str
    enabled: bool
    created_at: datetime
    updated_at: datetime
    rules: List[Dict[str, Any]]
    enforcement_level: str  # "log", "warn", "block"
    exceptions: List[Dict[str, Any]]

class SecurityPolicyUpdateRequest(BaseModel):
    """Request to update security policy"""
    name: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
    rules: Optional[List[Dict[str, Any]]] = None
    enforcement_level: Optional[str] = None
    exceptions: Optional[List[Dict[str, Any]]] = None