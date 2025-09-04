"""Schemas para endpoints de observabilidade."""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from uuid import UUID
from enum import Enum
from pydantic import BaseModel, Field

from app.core.health import HealthStatus
from app.core.sync_dashboard import ReplayStatus, DashboardTimeRange
from app.domain.sync_run import SyncRunStatus, SyncRunType

class HealthCheckResult(BaseModel):
    """Resultado de uma verificação de saúde."""
    name: str
    status: HealthStatus
    message: Optional[str] = None
    duration_ms: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class HealthCheckResponse(BaseModel):
    """Resposta do endpoint de health check."""
    status: HealthStatus
    timestamp: datetime
    checks: List[HealthCheckResult]
    version: str
    uptime_seconds: float

class MetricValue(BaseModel):
    """Valor de uma métrica com timestamp."""
    value: float
    timestamp: datetime
    labels: Dict[str, str] = Field(default_factory=dict)

class MetricsResponse(BaseModel):
    """Resposta com métricas customizadas."""
    metrics: Dict[str, List[MetricValue]]
    timestamp: datetime
    period_minutes: int

class SystemMetricsResponse(BaseModel):
    """Resposta com métricas do sistema."""
    cpu_usage_percent: float
    memory_usage_bytes: int
    active_operations: int
    operation_history: List[Dict[str, Any]]
    timestamp: datetime

class SyncRunSummary(BaseModel):
    """Resumo de uma execução de sincronização."""
    id: UUID
    tenant_id: UUID
    tenant_name: str
    connector_type: str
    status: SyncRunStatus
    sync_type: SyncRunType
    started_at: datetime
    completed_at: Optional[datetime]
    duration_seconds: Optional[float]
    items_processed: int
    items_failed: int
    error_message: Optional[str]
    can_replay: bool
    replay_count: int = 0

class SyncStats(BaseModel):
    """Estatísticas de sincronização."""
    total_runs: int
    successful_runs: int
    failed_runs: int
    running_runs: int
    success_rate: float
    avg_duration_seconds: float
    total_items_processed: int
    total_items_failed: int
    last_sync_at: Optional[datetime]

class ConnectorStats(BaseModel):
    """Estatísticas por conector."""
    connector_type: str
    total_runs: int
    success_rate: float
    avg_duration_seconds: float
    last_sync_at: Optional[datetime]
    error_rate: float
    items_per_minute: float

class TenantStats(BaseModel):
    """Estatísticas por tenant."""
    tenant_id: UUID
    tenant_name: str
    total_runs: int
    success_rate: float
    active_connectors: int
    last_sync_at: Optional[datetime]
    quota_usage: float

class ReplayStats(BaseModel):
    """Estatísticas de replay."""
    total_replays: int
    pending_replays: int
    running_replays: int
    completed_replays: int
    failed_replays: int
    success_rate: float
    active_replays: int

class DashboardPeriod(BaseModel):
    """Período do dashboard."""
    start: str
    end: str
    range: DashboardTimeRange

class SyncDashboardResponse(BaseModel):
    """Resposta do dashboard de sincronização."""
    period: DashboardPeriod
    stats: SyncStats
    connector_stats: List[ConnectorStats]
    tenant_stats: List[TenantStats]
    recent_runs: List[SyncRunSummary]
    active_runs: List[SyncRunSummary]
    replay_stats: ReplayStats

class ReplayRequestCreate(BaseModel):
    """Requisição para criar um replay."""
    sync_run_id: UUID
    config_override: Optional[Dict[str, Any]] = None

class ReplayRequestResponse(BaseModel):
    """Resposta com dados de um replay."""
    id: UUID
    original_sync_run_id: UUID
    status: ReplayStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by: UUID
    error_message: Optional[str] = None

class AlertSeverity(str, Enum):
    """Severidade de alertas."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(str, Enum):
    """Status de alertas."""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    SUPPRESSED = "suppressed"

class AlertCategory(str, Enum):
    """Categoria de alertas."""
    SYSTEM = "system"
    SECURITY = "security"
    PERFORMANCE = "performance"
    BUSINESS = "business"
    INTEGRATION = "integration"

class AlertResponse(BaseModel):
    """Resposta com dados de um alerta."""
    id: UUID
    title: str
    description: str
    severity: AlertSeverity
    status: AlertStatus
    category: AlertCategory
    created_at: datetime
    updated_at: Optional[datetime]
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[UUID] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[UUID] = None
    metadata: Optional[Dict[str, Any]] = None

class LogLevel(str, Enum):
    """Níveis de log."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class LogCategory(str, Enum):
    """Categorias de log."""
    API = "api"
    DATABASE = "database"
    SYNC = "sync"
    CONNECTOR = "connector"
    SECURITY = "security"
    SYSTEM = "system"
    BUSINESS = "business"

class StructuredLogEntry(BaseModel):
    """Entrada de log estruturado."""
    timestamp: datetime
    level: LogLevel
    category: LogCategory
    message: str
    request_id: Optional[str] = None
    tenant_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    correlation_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    exception: Optional[str] = None
    stack_trace: Optional[str] = None

class StructuredLogsResponse(BaseModel):
    """Resposta com logs estruturados."""
    logs: List[StructuredLogEntry]
    total: int
    period_minutes: int
    filters: Dict[str, Optional[str]]

class CustomMetricRequest(BaseModel):
    """Requisição para adicionar métrica customizada."""
    metric_name: str = Field(..., description="Nome da métrica")
    value: float = Field(..., description="Valor da métrica")
    labels: Optional[Dict[str, str]] = Field(None, description="Labels da métrica")

class CustomMetricResponse(BaseModel):
    """Resposta ao adicionar métrica customizada."""
    message: str
    metric_name: str
    value: float
    labels: Optional[Dict[str, str]]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PerformanceMetrics(BaseModel):
    """Métricas de performance."""
    operation_name: str
    avg_duration_ms: float
    min_duration_ms: float
    max_duration_ms: float
    total_calls: int
    error_count: int
    error_rate: float
    last_call_at: datetime

class PerformanceReport(BaseModel):
    """Relatório de performance."""
    period_start: datetime
    period_end: datetime
    operations: List[PerformanceMetrics]
    total_operations: int
    avg_response_time_ms: float
    error_rate: float

class SystemResourceUsage(BaseModel):
    """Uso de recursos do sistema."""
    cpu_percent: float
    memory_percent: float
    memory_used_bytes: int
    memory_total_bytes: int
    disk_percent: float
    disk_used_bytes: int
    disk_total_bytes: int
    network_sent_bytes: int
    network_recv_bytes: int
    timestamp: datetime

class DatabaseMetrics(BaseModel):
    """Métricas do banco de dados."""
    active_connections: int
    max_connections: int
    database_size_bytes: int
    slow_queries_count: int
    avg_query_time_ms: float
    deadlocks_count: int
    cache_hit_ratio: float
    timestamp: datetime

class ConnectorMetrics(BaseModel):
    """Métricas de conectores."""
    connector_type: str
    total_requests: int
    successful_requests: int
    failed_requests: int
    avg_response_time_ms: float
    rate_limit_hits: int
    last_sync_at: Optional[datetime]
    error_rate: float
    uptime_percent: float

class BusinessMetrics(BaseModel):
    """Métricas de negócio."""
    active_tenants: int
    total_sync_runs_today: int
    successful_sync_runs_today: int
    total_items_synced_today: int
    revenue_today: float
    api_calls_today: int
    quota_usage_percent: float
    top_connectors: List[Dict[str, Any]]

class ComprehensiveMetricsResponse(BaseModel):
    """Resposta com métricas abrangentes."""
    timestamp: datetime
    system_resources: SystemResourceUsage
    database_metrics: DatabaseMetrics
    connector_metrics: List[ConnectorMetrics]
    business_metrics: BusinessMetrics
    performance_report: PerformanceReport
    active_alerts_count: int
    health_status: HealthStatus

class MonitoringDashboardResponse(BaseModel):
    """Resposta do dashboard de monitoramento."""
    overview: ComprehensiveMetricsResponse
    sync_dashboard: SyncDashboardResponse
    recent_alerts: List[AlertResponse]
    system_health: HealthCheckResponse
    uptime_stats: Dict[str, Any]
    performance_trends: Dict[str, List[float]]