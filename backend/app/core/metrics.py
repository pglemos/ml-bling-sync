"""Sistema de métricas e monitoramento para ML Bling Sync."""

import time
import asyncio
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, field
from collections import defaultdict, deque
import threading
from contextlib import asynccontextmanager
import psutil
import redis
from prometheus_client import Counter, Histogram, Gauge, Summary, CollectorRegistry, generate_latest
from fastapi import Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.structured_logging import get_logger

logger = get_logger(__name__)

class MetricType(str, Enum):
    """Tipos de métricas disponíveis."""
    COUNTER = "counter"
    HISTOGRAM = "histogram"
    GAUGE = "gauge"
    SUMMARY = "summary"

class MetricCategory(str, Enum):
    """Categorias de métricas."""
    API = "api"
    DATABASE = "database"
    SYNC = "sync"
    CONNECTOR = "connector"
    SYSTEM = "system"
    BUSINESS = "business"
    SECURITY = "security"

@dataclass
class MetricDefinition:
    """Definição de uma métrica."""
    name: str
    type: MetricType
    category: MetricCategory
    description: str
    labels: List[str] = field(default_factory=list)
    buckets: Optional[List[float]] = None
    quantiles: Optional[List[float]] = None

@dataclass
class MetricValue:
    """Valor de uma métrica com timestamp."""
    value: float
    timestamp: datetime
    labels: Dict[str, str] = field(default_factory=dict)

class MetricsCollector:
    """Coletor de métricas com suporte a Prometheus."""
    
    def __init__(self, registry: Optional[CollectorRegistry] = None):
        self.registry = registry or CollectorRegistry()
        self._metrics: Dict[str, Any] = {}
        self._custom_metrics: Dict[str, List[MetricValue]] = defaultdict(list)
        self._lock = threading.Lock()
        
        # Métricas padrão do sistema
        self._setup_default_metrics()
    
    def _setup_default_metrics(self):
        """Configura métricas padrão do sistema."""
        # API Metrics
        self.http_requests_total = Counter(
            'http_requests_total',
            'Total HTTP requests',
            ['method', 'endpoint', 'status_code', 'tenant_id'],
            registry=self.registry
        )
        
        self.http_request_duration = Histogram(
            'http_request_duration_seconds',
            'HTTP request duration',
            ['method', 'endpoint', 'tenant_id'],
            buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
            registry=self.registry
        )
        
        # Database Metrics
        self.db_connections_active = Gauge(
            'db_connections_active',
            'Active database connections',
            registry=self.registry
        )
        
        self.db_query_duration = Histogram(
            'db_query_duration_seconds',
            'Database query duration',
            ['operation', 'table'],
            buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
            registry=self.registry
        )
        
        # Sync Metrics
        self.sync_runs_total = Counter(
            'sync_runs_total',
            'Total sync runs',
            ['tenant_id', 'connector', 'status'],
            registry=self.registry
        )
        
        self.sync_duration = Histogram(
            'sync_duration_seconds',
            'Sync operation duration',
            ['tenant_id', 'connector', 'operation'],
            buckets=[1, 5, 10, 30, 60, 300, 600],
            registry=self.registry
        )
        
        self.sync_items_processed = Counter(
            'sync_items_processed_total',
            'Total items processed in sync',
            ['tenant_id', 'connector', 'item_type'],
            registry=self.registry
        )
        
        # System Metrics
        self.system_cpu_usage = Gauge(
            'system_cpu_usage_percent',
            'System CPU usage percentage',
            registry=self.registry
        )
        
        self.system_memory_usage = Gauge(
            'system_memory_usage_bytes',
            'System memory usage in bytes',
            registry=self.registry
        )
        
        self.system_disk_usage = Gauge(
            'system_disk_usage_percent',
            'System disk usage percentage',
            ['mount_point'],
            registry=self.registry
        )
        
        # Business Metrics
        self.active_tenants = Gauge(
            'active_tenants_total',
            'Total active tenants',
            registry=self.registry
        )
        
        self.api_quota_usage = Gauge(
            'api_quota_usage_percent',
            'API quota usage percentage',
            ['tenant_id', 'plan'],
            registry=self.registry
        )
        
        # Security Metrics
        self.security_events_total = Counter(
            'security_events_total',
            'Total security events',
            ['event_type', 'severity', 'tenant_id'],
            registry=self.registry
        )
        
        self.rate_limit_hits = Counter(
            'rate_limit_hits_total',
            'Total rate limit hits',
            ['tenant_id', 'endpoint'],
            registry=self.registry
        )
    
    def record_http_request(self, method: str, endpoint: str, status_code: int, 
                           duration: float, tenant_id: str = "unknown"):
        """Registra uma requisição HTTP."""
        self.http_requests_total.labels(
            method=method,
            endpoint=endpoint,
            status_code=str(status_code),
            tenant_id=tenant_id
        ).inc()
        
        self.http_request_duration.labels(
            method=method,
            endpoint=endpoint,
            tenant_id=tenant_id
        ).observe(duration)
    
    def record_db_query(self, operation: str, table: str, duration: float):
        """Registra uma query de banco de dados."""
        self.db_query_duration.labels(
            operation=operation,
            table=table
        ).observe(duration)
    
    def record_sync_run(self, tenant_id: str, connector: str, status: str, 
                       duration: float, items_processed: int = 0, 
                       item_type: str = "unknown"):
        """Registra uma execução de sincronização."""
        self.sync_runs_total.labels(
            tenant_id=tenant_id,
            connector=connector,
            status=status
        ).inc()
        
        self.sync_duration.labels(
            tenant_id=tenant_id,
            connector=connector,
            operation="full_sync"
        ).observe(duration)
        
        if items_processed > 0:
            self.sync_items_processed.labels(
                tenant_id=tenant_id,
                connector=connector,
                item_type=item_type
            ).inc(items_processed)
    
    def record_security_event(self, event_type: str, severity: str, 
                             tenant_id: str = "unknown"):
        """Registra um evento de segurança."""
        self.security_events_total.labels(
            event_type=event_type,
            severity=severity,
            tenant_id=tenant_id
        ).inc()
    
    def update_system_metrics(self):
        """Atualiza métricas do sistema."""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            self.system_cpu_usage.set(cpu_percent)
            
            # Memory
            memory = psutil.virtual_memory()
            self.system_memory_usage.set(memory.used)
            
            # Disk
            for disk in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(disk.mountpoint)
                    self.system_disk_usage.labels(
                        mount_point=disk.mountpoint
                    ).set(usage.percent)
                except (PermissionError, OSError):
                    continue
                    
        except Exception as e:
            logger.error(f"Erro ao atualizar métricas do sistema: {e}")
    
    def get_prometheus_metrics(self) -> str:
        """Retorna métricas no formato Prometheus."""
        return generate_latest(self.registry).decode('utf-8')
    
    def add_custom_metric(self, name: str, value: float, 
                         labels: Optional[Dict[str, str]] = None):
        """Adiciona uma métrica customizada."""
        with self._lock:
            metric_value = MetricValue(
                value=value,
                timestamp=datetime.utcnow(),
                labels=labels or {}
            )
            self._custom_metrics[name].append(metric_value)
            
            # Manter apenas os últimos 1000 valores
            if len(self._custom_metrics[name]) > 1000:
                self._custom_metrics[name] = self._custom_metrics[name][-1000:]
    
    def get_custom_metrics(self, name: str, 
                          since: Optional[datetime] = None) -> List[MetricValue]:
        """Obtém métricas customizadas."""
        with self._lock:
            metrics = self._custom_metrics.get(name, [])
            if since:
                metrics = [m for m in metrics if m.timestamp >= since]
            return metrics

class PerformanceMonitor:
    """Monitor de performance para operações específicas."""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics = metrics_collector
        self._active_operations: Dict[str, datetime] = {}
        self._operation_history: deque = deque(maxlen=1000)
    
    @asynccontextmanager
    async def monitor_operation(self, operation_name: str, 
                               labels: Optional[Dict[str, str]] = None):
        """Context manager para monitorar operações."""
        start_time = time.time()
        operation_id = f"{operation_name}_{int(start_time * 1000)}"
        
        self._active_operations[operation_id] = datetime.utcnow()
        
        try:
            yield operation_id
        except Exception as e:
            # Registrar erro
            self.metrics.add_custom_metric(
                f"{operation_name}_errors",
                1,
                {**(labels or {}), "error_type": type(e).__name__}
            )
            raise
        finally:
            duration = time.time() - start_time
            
            # Registrar duração
            self.metrics.add_custom_metric(
                f"{operation_name}_duration",
                duration,
                labels
            )
            
            # Remover da lista de operações ativas
            self._active_operations.pop(operation_id, None)
            
            # Adicionar ao histórico
            self._operation_history.append({
                "operation": operation_name,
                "duration": duration,
                "timestamp": datetime.utcnow(),
                "labels": labels or {}
            })
    
    def get_active_operations(self) -> Dict[str, datetime]:
        """Retorna operações ativas."""
        return self._active_operations.copy()
    
    def get_operation_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Retorna histórico de operações."""
        return list(self._operation_history)[-limit:]

class MetricsMiddleware:
    """Middleware para coletar métricas de requisições HTTP."""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics = metrics_collector
    
    async def __call__(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Extrair informações da requisição
        method = request.method
        path = request.url.path
        tenant_id = getattr(request.state, 'tenant_id', 'unknown')
        
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            logger.error(f"Erro na requisição {method} {path}: {e}")
            raise
        finally:
            duration = time.time() - start_time
            
            # Registrar métricas
            self.metrics.record_http_request(
                method=method,
                endpoint=path,
                status_code=status_code,
                duration=duration,
                tenant_id=tenant_id
            )
        
        return response

class DatabaseMetricsCollector:
    """Coletor de métricas específicas do banco de dados."""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics = metrics_collector
    
    async def collect_db_metrics(self, db: AsyncSession):
        """Coleta métricas do banco de dados."""
        try:
            # Conexões ativas
            result = await db.execute(text(
                "SELECT count(*) FROM pg_stat_activity WHERE state = 'active'"
            ))
            active_connections = result.scalar()
            self.metrics.db_connections_active.set(active_connections)
            
            # Tamanho do banco
            result = await db.execute(text(
                "SELECT pg_database_size(current_database())"
            ))
            db_size = result.scalar()
            self.metrics.add_custom_metric("database_size_bytes", db_size)
            
            # Estatísticas de tabelas
            result = await db.execute(text("""
                SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
                FROM pg_stat_user_tables
            """))
            
            for row in result:
                table_name = f"{row.schemaname}.{row.tablename}"
                self.metrics.add_custom_metric(
                    "table_inserts_total", 
                    row.n_tup_ins, 
                    {"table": table_name}
                )
                self.metrics.add_custom_metric(
                    "table_updates_total", 
                    row.n_tup_upd, 
                    {"table": table_name}
                )
                self.metrics.add_custom_metric(
                    "table_deletes_total", 
                    row.n_tup_del, 
                    {"table": table_name}
                )
                
        except Exception as e:
            logger.error(f"Erro ao coletar métricas do banco: {e}")

# Instância global do coletor de métricas
metrics_collector = MetricsCollector()
performance_monitor = PerformanceMonitor(metrics_collector)
db_metrics_collector = DatabaseMetricsCollector(metrics_collector)

# Função para obter o coletor de métricas
def get_metrics_collector() -> MetricsCollector:
    """Retorna a instância global do coletor de métricas."""
    return metrics_collector

def get_performance_monitor() -> PerformanceMonitor:
    """Retorna a instância global do monitor de performance."""
    return performance_monitor

# Decorador para monitorar funções
def monitor_performance(operation_name: str, labels: Optional[Dict[str, str]] = None):
    """Decorador para monitorar performance de funções."""
    def decorator(func):
        if asyncio.iscoroutinefunction(func):
            async def async_wrapper(*args, **kwargs):
                async with performance_monitor.monitor_operation(operation_name, labels):
                    return await func(*args, **kwargs)
            return async_wrapper
        else:
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    metrics_collector.add_custom_metric(
                        f"{operation_name}_errors",
                        1,
                        {**(labels or {}), "error_type": type(e).__name__}
                    )
                    raise
                finally:
                    duration = time.time() - start_time
                    metrics_collector.add_custom_metric(
                        f"{operation_name}_duration",
                        duration,
                        labels
                    )
            return sync_wrapper
    return decorator

# Task para atualizar métricas do sistema periodicamente
async def update_system_metrics_task():
    """Task para atualizar métricas do sistema periodicamente."""
    while True:
        try:
            metrics_collector.update_system_metrics()
            
            # Atualizar métricas do banco de dados
            async for db in get_db():
                await db_metrics_collector.collect_db_metrics(db)
                break
                
        except Exception as e:
            logger.error(f"Erro ao atualizar métricas do sistema: {e}")
        
        await asyncio.sleep(30)  # Atualizar a cada 30 segundos