"""Configurações para o sistema de observabilidade."""

import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum

class ObservabilityLevel(str, Enum):
    """Níveis de observabilidade."""
    BASIC = "basic"
    STANDARD = "standard"
    ADVANCED = "advanced"
    ENTERPRISE = "enterprise"

@dataclass
class MetricsConfig:
    """Configuração de métricas."""
    enabled: bool = True
    prometheus_enabled: bool = True
    custom_metrics_enabled: bool = True
    system_metrics_interval: int = 30  # segundos
    retention_days: int = 30
    high_cardinality_limit: int = 10000
    
    # Configurações específicas
    collect_db_metrics: bool = True
    collect_redis_metrics: bool = True
    collect_api_metrics: bool = True
    collect_business_metrics: bool = True

@dataclass
class LoggingConfig:
    """Configuração de logging."""
    enabled: bool = True
    structured_logging: bool = True
    log_level: str = "INFO"
    log_format: str = "json"
    
    # Destinos de log
    console_enabled: bool = True
    file_enabled: bool = True
    elasticsearch_enabled: bool = False
    
    # Configurações de arquivo
    log_file_path: str = "/var/log/ml-bling-sync/app.log"
    max_file_size: str = "100MB"
    backup_count: int = 5
    
    # Configurações de Elasticsearch
    elasticsearch_host: Optional[str] = None
    elasticsearch_index: str = "ml-bling-sync-logs"
    
    # Filtros
    sensitive_fields: List[str] = field(default_factory=lambda: [
        "password", "token", "api_key", "secret", "authorization"
    ])
    
    # Sampling
    debug_sampling_rate: float = 0.1
    info_sampling_rate: float = 1.0
    warning_sampling_rate: float = 1.0
    error_sampling_rate: float = 1.0

@dataclass
class HealthCheckConfig:
    """Configuração de health checks."""
    enabled: bool = True
    interval_seconds: int = 30
    timeout_seconds: int = 10
    
    # Checks específicos
    database_check: bool = True
    redis_check: bool = True
    external_apis_check: bool = True
    disk_space_check: bool = True
    memory_check: bool = True
    
    # Thresholds
    memory_threshold_percent: float = 85.0
    disk_threshold_percent: float = 90.0
    response_time_threshold_ms: float = 5000.0

@dataclass
class AlertingConfig:
    """Configuração de alertas."""
    enabled: bool = True
    
    # Canais de notificação
    email_enabled: bool = False
    slack_enabled: bool = False
    webhook_enabled: bool = False
    
    # Configurações de email
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    default_from_email: str = "alerts@ml-bling-sync.com"
    
    # Configurações de Slack
    slack_webhook_url: Optional[str] = None
    slack_channel: str = "#alerts"
    
    # Configurações de webhook
    webhook_url: Optional[str] = None
    webhook_timeout: int = 30
    
    # Regras de supressão
    suppression_enabled: bool = True
    max_alerts_per_hour: int = 10
    duplicate_alert_window_minutes: int = 60
    
    # Escalação
    escalation_enabled: bool = False
    escalation_delay_minutes: int = 30

@dataclass
class TracingConfig:
    """Configuração de tracing distribuído."""
    enabled: bool = False
    
    # Jaeger
    jaeger_enabled: bool = False
    jaeger_host: str = "localhost"
    jaeger_port: int = 14268
    
    # OpenTelemetry
    otel_enabled: bool = False
    otel_endpoint: Optional[str] = None
    
    # Sampling
    sampling_rate: float = 0.1
    
    # Instrumentação
    instrument_database: bool = True
    instrument_redis: bool = True
    instrument_http: bool = True
    instrument_celery: bool = True

@dataclass
class DashboardConfig:
    """Configuração do dashboard."""
    enabled: bool = True
    
    # Refresh intervals
    default_refresh_interval: int = 30  # segundos
    min_refresh_interval: int = 5
    max_refresh_interval: int = 300
    
    # Data retention
    metrics_retention_hours: int = 24
    logs_retention_hours: int = 72
    
    # Limits
    max_dashboard_widgets: int = 20
    max_chart_data_points: int = 1000
    
    # Features
    real_time_updates: bool = True
    export_enabled: bool = True
    sharing_enabled: bool = True

@dataclass
class SecurityMonitoringConfig:
    """Configuração de monitoramento de segurança."""
    enabled: bool = True
    
    # Detecção de anomalias
    anomaly_detection: bool = True
    failed_login_threshold: int = 5
    suspicious_activity_threshold: int = 10
    
    # Rate limiting monitoring
    rate_limit_monitoring: bool = True
    rate_limit_alert_threshold: float = 0.8  # 80% do limite
    
    # Audit logging
    audit_logging: bool = True
    audit_retention_days: int = 90
    
    # Compliance
    gdpr_compliance: bool = True
    data_anonymization: bool = True

@dataclass
class PerformanceMonitoringConfig:
    """Configuração de monitoramento de performance."""
    enabled: bool = True
    
    # APM
    apm_enabled: bool = False
    apm_service_name: str = "ml-bling-sync"
    
    # Profiling
    profiling_enabled: bool = False
    profiling_sample_rate: float = 0.01
    
    # Thresholds
    slow_query_threshold_ms: float = 1000.0
    slow_api_threshold_ms: float = 2000.0
    memory_leak_threshold_mb: float = 100.0
    
    # Monitoring intervals
    performance_check_interval: int = 60  # segundos
    memory_check_interval: int = 300  # segundos

@dataclass
class ObservabilityConfig:
    """Configuração principal de observabilidade."""
    level: ObservabilityLevel = ObservabilityLevel.STANDARD
    
    # Sub-configurações
    metrics: MetricsConfig = field(default_factory=MetricsConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    health_checks: HealthCheckConfig = field(default_factory=HealthCheckConfig)
    alerting: AlertingConfig = field(default_factory=AlertingConfig)
    tracing: TracingConfig = field(default_factory=TracingConfig)
    dashboard: DashboardConfig = field(default_factory=DashboardConfig)
    security_monitoring: SecurityMonitoringConfig = field(default_factory=SecurityMonitoringConfig)
    performance_monitoring: PerformanceMonitoringConfig = field(default_factory=PerformanceMonitoringConfig)
    
    # Configurações globais
    environment: str = "development"
    service_name: str = "ml-bling-sync"
    service_version: str = "1.0.0"
    
    # Features por nível
    def __post_init__(self):
        """Ajusta configurações baseado no nível de observabilidade."""
        if self.level == ObservabilityLevel.BASIC:
            self._configure_basic()
        elif self.level == ObservabilityLevel.STANDARD:
            self._configure_standard()
        elif self.level == ObservabilityLevel.ADVANCED:
            self._configure_advanced()
        elif self.level == ObservabilityLevel.ENTERPRISE:
            self._configure_enterprise()
    
    def _configure_basic(self):
        """Configuração básica de observabilidade."""
        self.metrics.custom_metrics_enabled = False
        self.metrics.collect_business_metrics = False
        self.logging.structured_logging = False
        self.alerting.enabled = False
        self.tracing.enabled = False
        self.security_monitoring.anomaly_detection = False
        self.performance_monitoring.profiling_enabled = False
    
    def _configure_standard(self):
        """Configuração padrão de observabilidade."""
        # Mantém configurações padrão
        pass
    
    def _configure_advanced(self):
        """Configuração avançada de observabilidade."""
        self.tracing.enabled = True
        self.performance_monitoring.apm_enabled = True
        self.performance_monitoring.profiling_enabled = True
        self.security_monitoring.anomaly_detection = True
        self.logging.elasticsearch_enabled = True
    
    def _configure_enterprise(self):
        """Configuração enterprise de observabilidade."""
        self._configure_advanced()
        self.alerting.escalation_enabled = True
        self.dashboard.real_time_updates = True
        self.security_monitoring.gdpr_compliance = True
        self.metrics.high_cardinality_limit = 50000

def load_observability_config() -> ObservabilityConfig:
    """Carrega configuração de observabilidade a partir de variáveis de ambiente."""
    
    config = ObservabilityConfig()
    
    # Nível de observabilidade
    level = os.getenv("OBSERVABILITY_LEVEL", "standard").lower()
    if level in ["basic", "standard", "advanced", "enterprise"]:
        config.level = ObservabilityLevel(level)
    
    # Environment
    config.environment = os.getenv("ENVIRONMENT", "development")
    config.service_name = os.getenv("SERVICE_NAME", "ml-bling-sync")
    config.service_version = os.getenv("SERVICE_VERSION", "1.0.0")
    
    # Metrics
    config.metrics.enabled = os.getenv("METRICS_ENABLED", "true").lower() == "true"
    config.metrics.prometheus_enabled = os.getenv("PROMETHEUS_ENABLED", "true").lower() == "true"
    
    # Logging
    config.logging.log_level = os.getenv("LOG_LEVEL", "INFO")
    config.logging.elasticsearch_enabled = os.getenv("ELASTICSEARCH_ENABLED", "false").lower() == "true"
    config.logging.elasticsearch_host = os.getenv("ELASTICSEARCH_HOST")
    
    # Health checks
    config.health_checks.interval_seconds = int(os.getenv("HEALTH_CHECK_INTERVAL", "30"))
    
    # Alerting
    config.alerting.enabled = os.getenv("ALERTING_ENABLED", "true").lower() == "true"
    config.alerting.email_enabled = os.getenv("EMAIL_ALERTS_ENABLED", "false").lower() == "true"
    config.alerting.slack_enabled = os.getenv("SLACK_ALERTS_ENABLED", "false").lower() == "true"
    config.alerting.slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    
    # SMTP
    config.alerting.smtp_host = os.getenv("SMTP_HOST")
    config.alerting.smtp_port = int(os.getenv("SMTP_PORT", "587"))
    config.alerting.smtp_username = os.getenv("SMTP_USERNAME")
    config.alerting.smtp_password = os.getenv("SMTP_PASSWORD")
    
    # Tracing
    config.tracing.enabled = os.getenv("TRACING_ENABLED", "false").lower() == "true"
    config.tracing.jaeger_enabled = os.getenv("JAEGER_ENABLED", "false").lower() == "true"
    config.tracing.jaeger_host = os.getenv("JAEGER_HOST", "localhost")
    config.tracing.jaeger_port = int(os.getenv("JAEGER_PORT", "14268"))
    
    return config

# Instância global da configuração
observability_config = load_observability_config()

def get_observability_config() -> ObservabilityConfig:
    """Retorna a configuração global de observabilidade."""
    return observability_config

# Configurações específicas por ambiente
ENVIRONMENT_CONFIGS = {
    "development": {
        "level": ObservabilityLevel.BASIC,
        "metrics": {"system_metrics_interval": 60},
        "logging": {"log_level": "DEBUG"},
        "alerting": {"enabled": False}
    },
    "staging": {
        "level": ObservabilityLevel.STANDARD,
        "metrics": {"system_metrics_interval": 30},
        "logging": {"log_level": "INFO"},
        "alerting": {"enabled": True}
    },
    "production": {
        "level": ObservabilityLevel.ADVANCED,
        "metrics": {"system_metrics_interval": 15},
        "logging": {"log_level": "WARNING"},
        "alerting": {"enabled": True, "escalation_enabled": True}
    }
}

def apply_environment_config(config: ObservabilityConfig, environment: str) -> ObservabilityConfig:
    """Aplica configurações específicas do ambiente."""
    
    env_config = ENVIRONMENT_CONFIGS.get(environment, {})
    
    if "level" in env_config:
        config.level = env_config["level"]
    
    if "metrics" in env_config:
        for key, value in env_config["metrics"].items():
            setattr(config.metrics, key, value)
    
    if "logging" in env_config:
        for key, value in env_config["logging"].items():
            setattr(config.logging, key, value)
    
    if "alerting" in env_config:
        for key, value in env_config["alerting"].items():
            setattr(config.alerting, key, value)
    
    return config