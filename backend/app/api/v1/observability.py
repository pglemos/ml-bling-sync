"""Endpoints de observabilidade - health checks, métricas e monitoramento."""

from typing import Dict, List, Optional, Any
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.health import (
    get_health_summary, 
    get_readiness_check, 
    get_liveness_check,
    HealthStatus
)
from app.core.metrics import get_metrics_collector, get_performance_monitor
from app.core.sync_dashboard import (
    get_sync_dashboard, 
    DashboardTimeRange, 
    ReplayRequest
)
from app.core.structured_logging import get_logger
from app.core.alerting import get_alert_manager
from app.schemas.observability import (
    HealthCheckResponse,
    MetricsResponse,
    SyncDashboardResponse,
    ReplayRequestCreate,
    ReplayRequestResponse,
    AlertResponse,
    SystemMetricsResponse
)
from app.core.auth import get_current_user, require_permissions
from app.domain.user import User
from app.core.tenant import get_current_tenant
from app.domain.tenant import Tenant

router = APIRouter()
logger = get_logger(__name__)
metrics_collector = get_metrics_collector()
performance_monitor = get_performance_monitor()

@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Endpoint de verificação de saúde geral."""
    try:
        health_summary = await get_health_summary()
        
        # Determinar status HTTP baseado na saúde
        status_code = 200
        if health_summary["overall_status"] == HealthStatus.DEGRADED:
            status_code = 200  # Ainda operacional
        elif health_summary["overall_status"] == HealthStatus.UNHEALTHY:
            status_code = 503  # Service Unavailable
        
        return HealthCheckResponse(
            status=health_summary["overall_status"],
            timestamp=datetime.utcnow(),
            checks=health_summary["checks"],
            version=health_summary.get("version", "unknown"),
            uptime_seconds=health_summary.get("uptime_seconds", 0)
        )
        
    except Exception as e:
        logger.error(f"Erro na verificação de saúde: {e}")
        raise HTTPException(status_code=500, detail="Erro interno na verificação de saúde")

@router.get("/health/ready")
async def readiness_check():
    """Endpoint de verificação de prontidão (Kubernetes)."""
    try:
        is_ready = await get_readiness_check()
        if is_ready:
            return {"status": "ready"}
        else:
            raise HTTPException(status_code=503, detail="Service not ready")
    except Exception as e:
        logger.error(f"Erro na verificação de prontidão: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")

@router.get("/health/live")
async def liveness_check():
    """Endpoint de verificação de vivacidade (Kubernetes)."""
    try:
        is_alive = await get_liveness_check()
        if is_alive:
            return {"status": "alive"}
        else:
            raise HTTPException(status_code=503, detail="Service not alive")
    except Exception as e:
        logger.error(f"Erro na verificação de vivacidade: {e}")
        raise HTTPException(status_code=503, detail="Service not alive")

@router.get("/metrics", response_class=PlainTextResponse)
async def get_prometheus_metrics():
    """Endpoint para métricas no formato Prometheus."""
    try:
        return metrics_collector.get_prometheus_metrics()
    except Exception as e:
        logger.error(f"Erro ao obter métricas Prometheus: {e}")
        raise HTTPException(status_code=500, detail="Erro ao obter métricas")

@router.get("/metrics/custom", response_model=MetricsResponse)
async def get_custom_metrics(
    metric_name: Optional[str] = Query(None, description="Nome da métrica específica"),
    since_minutes: int = Query(60, description="Minutos atrás para buscar métricas")
):
    """Obtém métricas customizadas."""
    try:
        since_time = datetime.utcnow() - timedelta(minutes=since_minutes)
        
        if metric_name:
            metrics_data = metrics_collector.get_custom_metrics(metric_name, since_time)
            return MetricsResponse(
                metrics={metric_name: metrics_data},
                timestamp=datetime.utcnow(),
                period_minutes=since_minutes
            )
        else:
            # Retornar todas as métricas customizadas
            all_metrics = {}
            for name in metrics_collector._custom_metrics.keys():
                all_metrics[name] = metrics_collector.get_custom_metrics(name, since_time)
            
            return MetricsResponse(
                metrics=all_metrics,
                timestamp=datetime.utcnow(),
                period_minutes=since_minutes
            )
            
    except Exception as e:
        logger.error(f"Erro ao obter métricas customizadas: {e}")
        raise HTTPException(status_code=500, detail="Erro ao obter métricas")

@router.get("/metrics/system", response_model=SystemMetricsResponse)
async def get_system_metrics():
    """Obtém métricas do sistema."""
    try:
        # Atualizar métricas do sistema
        metrics_collector.update_system_metrics()
        
        # Obter operações ativas
        active_operations = performance_monitor.get_active_operations()
        
        # Obter histórico de operações
        operation_history = performance_monitor.get_operation_history(limit=50)
        
        return SystemMetricsResponse(
            cpu_usage_percent=metrics_collector.system_cpu_usage._value._value,
            memory_usage_bytes=metrics_collector.system_memory_usage._value._value,
            active_operations=len(active_operations),
            operation_history=operation_history,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Erro ao obter métricas do sistema: {e}")
        raise HTTPException(status_code=500, detail="Erro ao obter métricas do sistema")

@router.get("/dashboard/sync", response_model=SyncDashboardResponse)
async def get_sync_dashboard(
    time_range: DashboardTimeRange = Query(DashboardTimeRange.LAST_24_HOURS),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """Obtém dados do dashboard de sincronização."""
    try:
        dashboard = get_sync_dashboard()
        
        # Verificar permissões - admin pode ver todos os tenants
        tenant_id = None
        if not current_user.is_admin:
            tenant_id = current_tenant.id
        
        overview = await dashboard.get_overview(
            tenant_id=tenant_id,
            time_range=time_range,
            start_date=start_date,
            end_date=end_date
        )
        
        return SyncDashboardResponse(**overview)
        
    except Exception as e:
        logger.error(f"Erro ao obter dashboard de sincronização: {e}")
        raise HTTPException(status_code=500, detail="Erro ao obter dashboard")

@router.post("/dashboard/sync/replay", response_model=ReplayRequestResponse)
async def create_sync_replay(
    request: ReplayRequestCreate,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """Cria uma requisição de replay de sincronização."""
    try:
        dashboard = get_sync_dashboard()
        
        replay_request = await dashboard.create_replay(
            sync_run_id=request.sync_run_id,
            user_id=current_user.id,
            config_override=request.config_override
        )
        
        return ReplayRequestResponse(
            id=replay_request.id,
            original_sync_run_id=replay_request.original_sync_run_id,
            status=replay_request.status,
            created_at=replay_request.created_at,
            created_by=replay_request.created_by
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao criar replay: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar replay")

@router.post("/dashboard/sync/replay/{replay_id}/execute")
async def execute_sync_replay(
    replay_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Executa um replay de sincronização."""
    try:
        dashboard = get_sync_dashboard()
        
        # Executar replay em background
        success = await dashboard.execute_replay(replay_id)
        
        if success:
            return {"message": "Replay iniciado com sucesso", "replay_id": replay_id}
        else:
            raise HTTPException(status_code=400, detail="Falha ao iniciar replay")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao executar replay {replay_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao executar replay")

@router.get("/dashboard/sync/replay/{replay_id}", response_model=ReplayRequestResponse)
async def get_replay_status(
    replay_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Obtém o status de um replay."""
    try:
        dashboard = get_sync_dashboard()
        
        replay_request = await dashboard.get_replay_status(replay_id)
        
        if not replay_request:
            raise HTTPException(status_code=404, detail="Replay não encontrado")
        
        return ReplayRequestResponse(
            id=replay_request.id,
            original_sync_run_id=replay_request.original_sync_run_id,
            status=replay_request.status,
            created_at=replay_request.created_at,
            started_at=replay_request.started_at,
            completed_at=replay_request.completed_at,
            created_by=replay_request.created_by,
            error_message=replay_request.error_message
        )
        
    except Exception as e:
        logger.error(f"Erro ao obter status do replay {replay_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao obter status do replay")

@router.delete("/dashboard/sync/replay/{replay_id}")
async def cancel_sync_replay(
    replay_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Cancela um replay de sincronização."""
    try:
        dashboard = get_sync_dashboard()
        
        success = await dashboard.cancel_replay(replay_id)
        
        if success:
            return {"message": "Replay cancelado com sucesso"}
        else:
            raise HTTPException(status_code=400, detail="Replay não pode ser cancelado")
            
    except Exception as e:
        logger.error(f"Erro ao cancelar replay {replay_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao cancelar replay")

@router.get("/dashboard/sync/replay", response_model=List[ReplayRequestResponse])
async def get_replay_history(
    limit: int = Query(50, le=100),
    current_tenant: Tenant = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """Obtém histórico de replays."""
    try:
        dashboard = get_sync_dashboard()
        
        # Verificar permissões - admin pode ver todos os tenants
        tenant_id = None
        if not current_user.is_admin:
            tenant_id = current_tenant.id
        
        replay_history = await dashboard.get_replay_history(
            tenant_id=tenant_id,
            limit=limit
        )
        
        return [
            ReplayRequestResponse(
                id=replay.id,
                original_sync_run_id=replay.original_sync_run_id,
                status=replay.status,
                created_at=replay.created_at,
                started_at=replay.started_at,
                completed_at=replay.completed_at,
                created_by=replay.created_by,
                error_message=replay.error_message
            )
            for replay in replay_history
        ]
        
    except Exception as e:
        logger.error(f"Erro ao obter histórico de replays: {e}")
        raise HTTPException(status_code=500, detail="Erro ao obter histórico")

@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user)
):
    """Obtém alertas do sistema."""
    try:
        alert_manager = get_alert_manager()
        
        alerts = await alert_manager.get_alerts(
            severity=severity,
            status=status,
            limit=limit
        )
        
        return [
            AlertResponse(
                id=alert.id,
                title=alert.title,
                description=alert.description,
                severity=alert.severity,
                status=alert.status,
                category=alert.category,
                created_at=alert.created_at,
                updated_at=alert.updated_at,
                metadata=alert.metadata
            )
            for alert in alerts
        ]
        
    except Exception as e:
        logger.error(f"Erro ao obter alertas: {e}")
        raise HTTPException(status_code=500, detail="Erro ao obter alertas")

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Reconhece um alerta."""
    try:
        alert_manager = get_alert_manager()
        
        success = await alert_manager.acknowledge_alert(
            alert_id=alert_id,
            acknowledged_by=current_user.id
        )
        
        if success:
            return {"message": "Alerta reconhecido com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Alerta não encontrado")
            
    except Exception as e:
        logger.error(f"Erro ao reconhecer alerta {alert_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao reconhecer alerta")

@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Resolve um alerta."""
    try:
        alert_manager = get_alert_manager()
        
        success = await alert_manager.resolve_alert(
            alert_id=alert_id,
            resolved_by=current_user.id
        )
        
        if success:
            return {"message": "Alerta resolvido com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Alerta não encontrado")
            
    except Exception as e:
        logger.error(f"Erro ao resolver alerta {alert_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao resolver alerta")

@router.get("/logs/structured")
async def get_structured_logs(
    level: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    since_minutes: int = Query(60),
    limit: int = Query(100, le=1000),
    current_user: User = Depends(require_permissions(["admin"]))
):
    """Obtém logs estruturados (apenas para admins)."""
    try:
        # TODO: Implementar busca em logs estruturados
        # Por enquanto, retornar placeholder
        return {
            "logs": [],
            "total": 0,
            "period_minutes": since_minutes,
            "filters": {
                "level": level,
                "category": category
            }
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter logs estruturados: {e}")
        raise HTTPException(status_code=500, detail="Erro ao obter logs")

@router.post("/metrics/custom")
async def add_custom_metric(
    metric_name: str,
    value: float,
    labels: Optional[Dict[str, str]] = None,
    current_user: User = Depends(get_current_user)
):
    """Adiciona uma métrica customizada."""
    try:
        metrics_collector.add_custom_metric(metric_name, value, labels)
        
        return {
            "message": "Métrica adicionada com sucesso",
            "metric_name": metric_name,
            "value": value,
            "labels": labels
        }
        
    except Exception as e:
        logger.error(f"Erro ao adicionar métrica customizada: {e}")
        raise HTTPException(status_code=500, detail="Erro ao adicionar métrica")