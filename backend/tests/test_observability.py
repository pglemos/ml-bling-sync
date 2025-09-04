"""Testes para o sistema de observabilidade."""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
from typing import Dict, Any

from app.core.health import (
    HealthStatus, HealthCheckResult, HealthChecker,
    check_database, check_redis, check_external_apis,
    check_system_resources, check_application_metrics,
    get_health_summary, get_readiness_check, get_liveness_check
)
from app.core.structured_logging import (
    LogLevel, LogCategory, LogContext, StructuredLogEntry,
    StructuredLogger, get_logger, log_function_call, log_api_call,
    LogContextManager, configure_logging
)
from app.core.alerting import (
    AlertSeverity, AlertStatus, AlertCategory, Alert, AlertRule,
    AlertManager, EmailNotificationChannel, WebhookNotificationChannel,
    SlackNotificationChannel
)
from app.core.metrics import (
    MetricType, MetricCategory, MetricsCollector, PerformanceMonitor,
    MetricsMiddleware, DatabaseMetricsCollector, get_metrics_collector,
    get_performance_monitor, monitor_function, update_system_metrics_task
)
from app.core.sync_dashboard import (
    ReplayStatus, DashboardTimeRange, SyncExecutionSummary,
    SyncStats, ConnectorStats, TenantStats, ReplayStats,
    ReplayRequest, SyncDashboard
)
from app.core.observability_config import (
    ObservabilityLevel, ObservabilityConfig, load_observability_config,
    apply_environment_config
)

class TestHealthChecker:
    """Testes para o sistema de health checks."""
    
    @pytest.fixture
    def health_checker(self):
        return HealthChecker()
    
    def test_health_check_result_creation(self):
        """Testa criação de resultado de health check."""
        result = HealthCheckResult(
            name="test_check",
            status=HealthStatus.HEALTHY,
            message="All good",
            details={"version": "1.0.0"}
        )
        
        assert result.name == "test_check"
        assert result.status == HealthStatus.HEALTHY
        assert result.message == "All good"
        assert result.details["version"] == "1.0.0"
        assert isinstance(result.timestamp, datetime)
    
    def test_health_checker_registration(self, health_checker):
        """Testa registro de health checks."""
        async def dummy_check():
            return HealthCheckResult("dummy", HealthStatus.HEALTHY, "OK")
        
        health_checker.register_check("dummy", dummy_check, interval=30)
        
        assert "dummy" in health_checker.checks
        assert health_checker.checks["dummy"]["interval"] == 30
    
    @pytest.mark.asyncio
    async def test_health_checker_execution(self, health_checker):
        """Testa execução de health checks."""
        async def healthy_check():
            return HealthCheckResult("healthy", HealthStatus.HEALTHY, "OK")
        
        async def unhealthy_check():
            return HealthCheckResult("unhealthy", HealthStatus.UNHEALTHY, "Error")
        
        health_checker.register_check("healthy", healthy_check)
        health_checker.register_check("unhealthy", unhealthy_check)
        
        results = await health_checker.run_checks()
        
        assert len(results) == 2
        assert results["healthy"].status == HealthStatus.HEALTHY
        assert results["unhealthy"].status == HealthStatus.UNHEALTHY
    
    @pytest.mark.asyncio
    async def test_database_health_check(self):
        """Testa health check do banco de dados."""
        # Mock database connection
        mock_db = AsyncMock()
        mock_db.execute.return_value = None
        
        with patch('app.core.health.get_database', return_value=mock_db):
            result = await check_database()
            
            assert result.name == "database"
            assert result.status == HealthStatus.HEALTHY
            mock_db.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_redis_health_check(self):
        """Testa health check do Redis."""
        mock_redis = AsyncMock()
        mock_redis.ping.return_value = True
        
        with patch('app.core.health.get_redis', return_value=mock_redis):
            result = await check_redis()
            
            assert result.name == "redis"
            assert result.status == HealthStatus.HEALTHY
            mock_redis.ping.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_system_resources_check(self):
        """Testa verificação de recursos do sistema."""
        with patch('psutil.virtual_memory') as mock_memory, \
             patch('psutil.disk_usage') as mock_disk:
            
            # Mock memory usage (70%)
            mock_memory.return_value.percent = 70.0
            
            # Mock disk usage (80%)
            mock_disk.return_value.percent = 80.0
            
            result = await check_system_resources()
            
            assert result.name == "system_resources"
            assert result.status == HealthStatus.HEALTHY
            assert "memory_percent" in result.details
            assert "disk_percent" in result.details

class TestStructuredLogging:
    """Testes para o sistema de logging estruturado."""
    
    def test_log_context_creation(self):
        """Testa criação de contexto de log."""
        context = LogContext(
            request_id="req-123",
            user_id="user-456",
            tenant_id="tenant-789",
            operation="test_operation"
        )
        
        assert context.request_id == "req-123"
        assert context.user_id == "user-456"
        assert context.tenant_id == "tenant-789"
        assert context.operation == "test_operation"
    
    def test_structured_log_entry(self):
        """Testa criação de entrada de log estruturado."""
        context = LogContext(request_id="req-123")
        
        entry = StructuredLogEntry(
            level=LogLevel.INFO,
            category=LogCategory.API,
            message="Test message",
            context=context,
            extra_data={"key": "value"}
        )
        
        assert entry.level == LogLevel.INFO
        assert entry.category == LogCategory.API
        assert entry.message == "Test message"
        assert entry.context.request_id == "req-123"
        assert entry.extra_data["key"] == "value"
    
    def test_structured_logger(self):
        """Testa logger estruturado."""
        logger = StructuredLogger("test_logger")
        
        with patch.object(logger.logger, 'info') as mock_info:
            logger.info(
                "Test message",
                category=LogCategory.API,
                extra_data={"test": True}
            )
            
            mock_info.assert_called_once()
    
    def test_log_function_call_decorator(self):
        """Testa decorador de log de função."""
        @log_function_call
        def test_function(x: int, y: int) -> int:
            return x + y
        
        with patch('app.core.structured_logging.get_logger') as mock_get_logger:
            mock_logger = Mock()
            mock_get_logger.return_value = mock_logger
            
            result = test_function(2, 3)
            
            assert result == 5
            assert mock_logger.info.call_count == 2  # entrada e saída
    
    def test_log_context_manager(self):
        """Testa gerenciador de contexto de log."""
        with LogContextManager(request_id="req-123", operation="test"):
            # Verificar se o contexto foi definido
            pass
        
        # Verificar se o contexto foi limpo
        pass

class TestAlerting:
    """Testes para o sistema de alertas."""
    
    @pytest.fixture
    def alert_manager(self):
        return AlertManager()
    
    def test_alert_creation(self):
        """Testa criação de alerta."""
        alert = Alert(
            id="alert-123",
            title="Test Alert",
            description="Test description",
            severity=AlertSeverity.HIGH,
            category=AlertCategory.SYSTEM,
            source="test_source",
            metadata={"key": "value"}
        )
        
        assert alert.id == "alert-123"
        assert alert.title == "Test Alert"
        assert alert.severity == AlertSeverity.HIGH
        assert alert.status == AlertStatus.ACTIVE
        assert isinstance(alert.created_at, datetime)
    
    def test_alert_rule_creation(self):
        """Testa criação de regra de alerta."""
        rule = AlertRule(
            id="rule-123",
            name="High CPU Usage",
            description="Alert when CPU usage > 80%",
            condition="cpu_usage > 80",
            severity=AlertSeverity.HIGH,
            category=AlertCategory.SYSTEM,
            enabled=True,
            cooldown_minutes=15
        )
        
        assert rule.id == "rule-123"
        assert rule.name == "High CPU Usage"
        assert rule.enabled is True
        assert rule.cooldown_minutes == 15
    
    @pytest.mark.asyncio
    async def test_email_notification_channel(self):
        """Testa canal de notificação por email."""
        channel = EmailNotificationChannel(
            smtp_host="smtp.test.com",
            smtp_port=587,
            username="test@test.com",
            password="password",
            from_email="alerts@test.com"
        )
        
        alert = Alert(
            id="alert-123",
            title="Test Alert",
            description="Test description",
            severity=AlertSeverity.HIGH,
            category=AlertCategory.SYSTEM,
            source="test"
        )
        
        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = Mock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            await channel.send_notification(alert, ["recipient@test.com"])
            
            mock_server.send_message.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_alert_manager_create_alert(self, alert_manager):
        """Testa criação de alerta pelo gerenciador."""
        with patch.object(alert_manager.redis, 'hset') as mock_hset, \
             patch.object(alert_manager, '_send_notifications') as mock_send:
            
            alert = await alert_manager.create_alert(
                title="Test Alert",
                description="Test description",
                severity=AlertSeverity.HIGH,
                category=AlertCategory.SYSTEM,
                source="test"
            )
            
            assert alert.title == "Test Alert"
            assert alert.severity == AlertSeverity.HIGH
            mock_hset.assert_called_once()
            mock_send.assert_called_once()

class TestMetrics:
    """Testes para o sistema de métricas."""
    
    @pytest.fixture
    def metrics_collector(self):
        return MetricsCollector()
    
    def test_metrics_collector_counter(self, metrics_collector):
        """Testa contador de métricas."""
        metrics_collector.increment_counter(
            "test_counter",
            category=MetricCategory.API,
            labels={"method": "GET"}
        )
        
        # Verificar se a métrica foi registrada
        assert "test_counter" in metrics_collector.counters
    
    def test_metrics_collector_histogram(self, metrics_collector):
        """Testa histograma de métricas."""
        metrics_collector.record_histogram(
            "test_histogram",
            value=1.5,
            category=MetricCategory.DATABASE,
            labels={"operation": "select"}
        )
        
        # Verificar se a métrica foi registrada
        assert "test_histogram" in metrics_collector.histograms
    
    def test_performance_monitor(self):
        """Testa monitor de performance."""
        monitor = PerformanceMonitor()
        
        with monitor.measure("test_operation"):
            # Simular operação
            pass
        
        # Verificar se a métrica foi registrada
        metrics = monitor.get_metrics()
        assert "test_operation" in metrics
    
    def test_monitor_function_decorator(self):
        """Testa decorador de monitoramento de função."""
        @monitor_function("test_function")
        def test_function(x: int) -> int:
            return x * 2
        
        with patch('app.core.metrics.get_performance_monitor') as mock_get_monitor:
            mock_monitor = Mock()
            mock_get_monitor.return_value = mock_monitor
            
            result = test_function(5)
            
            assert result == 10
            mock_monitor.measure.assert_called_once()

class TestSyncDashboard:
    """Testes para o dashboard de sincronização."""
    
    @pytest.fixture
    def sync_dashboard(self):
        return SyncDashboard()
    
    def test_sync_execution_summary(self):
        """Testa resumo de execução de sincronização."""
        summary = SyncExecutionSummary(
            execution_id="exec-123",
            connector_id="conn-456",
            tenant_id="tenant-789",
            status="completed",
            start_time=datetime.now() - timedelta(minutes=5),
            end_time=datetime.now(),
            records_processed=100,
            records_success=95,
            records_failed=5
        )
        
        assert summary.execution_id == "exec-123"
        assert summary.records_processed == 100
        assert summary.success_rate == 0.95
    
    @pytest.mark.asyncio
    async def test_dashboard_overview(self, sync_dashboard):
        """Testa visão geral do dashboard."""
        with patch.object(sync_dashboard, '_get_sync_stats') as mock_stats, \
             patch.object(sync_dashboard, '_get_recent_executions') as mock_executions:
            
            mock_stats.return_value = SyncStats(
                total_executions=100,
                successful_executions=95,
                failed_executions=5,
                total_records_processed=10000,
                average_execution_time=120.5
            )
            
            mock_executions.return_value = []
            
            overview = await sync_dashboard.get_overview()
            
            assert overview["stats"].total_executions == 100
            assert overview["stats"].success_rate == 0.95
    
    @pytest.mark.asyncio
    async def test_replay_creation(self, sync_dashboard):
        """Testa criação de replay."""
        replay_request = ReplayRequest(
            execution_ids=["exec-123", "exec-456"],
            connector_id="conn-789",
            tenant_id="tenant-123",
            start_time=datetime.now() - timedelta(hours=1),
            end_time=datetime.now()
        )
        
        with patch.object(sync_dashboard.redis, 'hset') as mock_hset:
            replay_id = await sync_dashboard.create_replay(replay_request)
            
            assert replay_id.startswith("replay_")
            mock_hset.assert_called()

class TestObservabilityConfig:
    """Testes para configuração de observabilidade."""
    
    def test_observability_config_creation(self):
        """Testa criação de configuração de observabilidade."""
        config = ObservabilityConfig()
        
        assert config.level == ObservabilityLevel.STANDARD
        assert config.metrics.enabled is True
        assert config.logging.enabled is True
        assert config.health_checks.enabled is True
    
    def test_basic_level_configuration(self):
        """Testa configuração de nível básico."""
        config = ObservabilityConfig(level=ObservabilityLevel.BASIC)
        
        assert config.metrics.custom_metrics_enabled is False
        assert config.alerting.enabled is False
        assert config.tracing.enabled is False
    
    def test_enterprise_level_configuration(self):
        """Testa configuração de nível enterprise."""
        config = ObservabilityConfig(level=ObservabilityLevel.ENTERPRISE)
        
        assert config.tracing.enabled is True
        assert config.alerting.escalation_enabled is True
        assert config.security_monitoring.gdpr_compliance is True
    
    def test_environment_config_application(self):
        """Testa aplicação de configuração por ambiente."""
        config = ObservabilityConfig()
        
        config = apply_environment_config(config, "production")
        
        assert config.level == ObservabilityLevel.ADVANCED
        assert config.logging.log_level == "WARNING"
        assert config.alerting.escalation_enabled is True
    
    @patch.dict('os.environ', {
        'OBSERVABILITY_LEVEL': 'advanced',
        'METRICS_ENABLED': 'true',
        'LOG_LEVEL': 'DEBUG',
        'ALERTING_ENABLED': 'true'
    })
    def test_load_config_from_environment(self):
        """Testa carregamento de configuração a partir de variáveis de ambiente."""
        config = load_observability_config()
        
        assert config.level == ObservabilityLevel.ADVANCED
        assert config.metrics.enabled is True
        assert config.logging.log_level == "DEBUG"
        assert config.alerting.enabled is True

class TestObservabilityIntegration:
    """Testes de integração para observabilidade."""
    
    @pytest.mark.asyncio
    async def test_health_check_with_alerting(self):
        """Testa integração entre health checks e alertas."""
        health_checker = HealthChecker()
        alert_manager = AlertManager()
        
        # Registrar health check que falha
        async def failing_check():
            return HealthCheckResult(
                "failing_service",
                HealthStatus.UNHEALTHY,
                "Service is down"
            )
        
        health_checker.register_check("failing_service", failing_check)
        
        with patch.object(alert_manager, 'create_alert') as mock_create_alert:
            results = await health_checker.run_checks()
            
            # Verificar se alerta foi criado para serviço não saudável
            unhealthy_results = [
                r for r in results.values() 
                if r.status == HealthStatus.UNHEALTHY
            ]
            
            if unhealthy_results:
                # Simular criação de alerta
                await alert_manager.create_alert(
                    title=f"Health Check Failed: {unhealthy_results[0].name}",
                    description=unhealthy_results[0].message,
                    severity=AlertSeverity.HIGH,
                    category=AlertCategory.SYSTEM,
                    source="health_checker"
                )
                
                mock_create_alert.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_metrics_with_alerting(self):
        """Testa integração entre métricas e alertas."""
        metrics_collector = MetricsCollector()
        alert_manager = AlertManager()
        
        # Simular métrica de alta latência
        metrics_collector.record_histogram(
            "api_request_duration",
            value=5.0,  # 5 segundos - alta latência
            category=MetricCategory.API,
            labels={"endpoint": "/api/sync"}
        )
        
        with patch.object(alert_manager, 'evaluate_rules') as mock_evaluate:
            # Simular avaliação de regras de alerta
            await alert_manager.evaluate_rules()
            
            mock_evaluate.assert_called_once()
    
    def test_structured_logging_with_metrics(self):
        """Testa integração entre logging estruturado e métricas."""
        logger = StructuredLogger("test_logger")
        metrics_collector = MetricsCollector()
        
        with patch.object(metrics_collector, 'increment_counter') as mock_counter:
            # Log de erro deve incrementar métrica
            logger.error(
                "Test error",
                category=LogCategory.API,
                extra_data={"endpoint": "/api/test"}
            )
            
            # Simular incremento de métrica de erro
            metrics_collector.increment_counter(
                "log_entries_total",
                category=MetricCategory.SYSTEM,
                labels={"level": "error", "category": "api"}
            )
            
            mock_counter.assert_called_once()

# Fixtures globais
@pytest.fixture
def mock_redis():
    """Mock do Redis para testes."""
    redis_mock = AsyncMock()
    redis_mock.hset = AsyncMock()
    redis_mock.hget = AsyncMock()
    redis_mock.hgetall = AsyncMock()
    redis_mock.delete = AsyncMock()
    redis_mock.ping = AsyncMock(return_value=True)
    return redis_mock

@pytest.fixture
def mock_database():
    """Mock do banco de dados para testes."""
    db_mock = AsyncMock()
    db_mock.execute = AsyncMock()
    db_mock.fetch_all = AsyncMock()
    db_mock.fetch_one = AsyncMock()
    return db_mock

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Configuração do ambiente de teste."""
    # Configurar logging para testes
    import logging
    logging.getLogger().setLevel(logging.CRITICAL)
    
    yield
    
    # Limpeza após testes
    pass