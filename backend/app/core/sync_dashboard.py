"""Dashboard de sincronização com funcionalidade de replay."""

import asyncio
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, field
from uuid import UUID, uuid4
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.structured_logging import get_logger
from app.core.metrics import get_metrics_collector, monitor_performance
from app.domain.sync_run import SyncRun, SyncRunStatus, SyncRunType
from app.domain.tenant import Tenant
from app.services.connector_service import ConnectorService

logger = get_logger(__name__)
metrics = get_metrics_collector()

class ReplayStatus(str, Enum):
    """Status de replay de sincronização."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class DashboardTimeRange(str, Enum):
    """Intervalos de tempo para o dashboard."""
    LAST_HOUR = "1h"
    LAST_6_HOURS = "6h"
    LAST_24_HOURS = "24h"
    LAST_7_DAYS = "7d"
    LAST_30_DAYS = "30d"
    CUSTOM = "custom"

@dataclass
class SyncRunSummary:
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

@dataclass
class SyncStats:
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

@dataclass
class ConnectorStats:
    """Estatísticas por conector."""
    connector_type: str
    total_runs: int
    success_rate: float
    avg_duration_seconds: float
    last_sync_at: Optional[datetime]
    error_rate: float
    items_per_minute: float

@dataclass
class TenantStats:
    """Estatísticas por tenant."""
    tenant_id: UUID
    tenant_name: str
    total_runs: int
    success_rate: float
    active_connectors: int
    last_sync_at: Optional[datetime]
    quota_usage: float

@dataclass
class ReplayRequest:
    """Requisição de replay de sincronização."""
    id: UUID = field(default_factory=uuid4)
    original_sync_run_id: UUID = None
    tenant_id: UUID = None
    connector_type: str = None
    status: ReplayStatus = ReplayStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by: UUID = None
    error_message: Optional[str] = None
    config_override: Optional[Dict[str, Any]] = None

class SyncDashboard:
    """Dashboard de sincronização com funcionalidades de monitoramento e replay."""
    
    def __init__(self, connector_service: ConnectorService):
        self.connector_service = connector_service
        self._replay_requests: Dict[UUID, ReplayRequest] = {}
        self._active_replays: Dict[UUID, asyncio.Task] = {}
    
    @monitor_performance("sync_dashboard_get_overview")
    async def get_overview(self, 
                          tenant_id: Optional[UUID] = None,
                          time_range: DashboardTimeRange = DashboardTimeRange.LAST_24_HOURS,
                          start_date: Optional[datetime] = None,
                          end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Obtém visão geral do dashboard de sincronização."""
        
        # Calcular período
        if time_range == DashboardTimeRange.CUSTOM:
            if not start_date or not end_date:
                raise ValueError("start_date e end_date são obrigatórios para intervalo customizado")
            period_start = start_date
            period_end = end_date
        else:
            period_end = datetime.utcnow()
            if time_range == DashboardTimeRange.LAST_HOUR:
                period_start = period_end - timedelta(hours=1)
            elif time_range == DashboardTimeRange.LAST_6_HOURS:
                period_start = period_end - timedelta(hours=6)
            elif time_range == DashboardTimeRange.LAST_24_HOURS:
                period_start = period_end - timedelta(days=1)
            elif time_range == DashboardTimeRange.LAST_7_DAYS:
                period_start = period_end - timedelta(days=7)
            elif time_range == DashboardTimeRange.LAST_30_DAYS:
                period_start = period_end - timedelta(days=30)
        
        async for db in get_db():
            # Estatísticas gerais
            stats = await self._get_sync_stats(db, tenant_id, period_start, period_end)
            
            # Estatísticas por conector
            connector_stats = await self._get_connector_stats(db, tenant_id, period_start, period_end)
            
            # Estatísticas por tenant (se não filtrado por tenant)
            tenant_stats = []
            if not tenant_id:
                tenant_stats = await self._get_tenant_stats(db, period_start, period_end)
            
            # Execuções recentes
            recent_runs = await self._get_recent_sync_runs(db, tenant_id, limit=20)
            
            # Execuções ativas
            active_runs = await self._get_active_sync_runs(db, tenant_id)
            
            # Estatísticas de replay
            replay_stats = await self._get_replay_stats(period_start, period_end)
            
            return {
                "period": {
                    "start": period_start.isoformat(),
                    "end": period_end.isoformat(),
                    "range": time_range
                },
                "stats": stats,
                "connector_stats": connector_stats,
                "tenant_stats": tenant_stats,
                "recent_runs": recent_runs,
                "active_runs": active_runs,
                "replay_stats": replay_stats
            }
    
    async def _get_sync_stats(self, db: AsyncSession, tenant_id: Optional[UUID], 
                             start_date: datetime, end_date: datetime) -> SyncStats:
        """Obtém estatísticas gerais de sincronização."""
        
        # Query base
        query = select(SyncRun).where(
            and_(
                SyncRun.started_at >= start_date,
                SyncRun.started_at <= end_date
            )
        )
        
        if tenant_id:
            query = query.where(SyncRun.tenant_id == tenant_id)
        
        result = await db.execute(query)
        sync_runs = result.scalars().all()
        
        if not sync_runs:
            return SyncStats(
                total_runs=0,
                successful_runs=0,
                failed_runs=0,
                running_runs=0,
                success_rate=0.0,
                avg_duration_seconds=0.0,
                total_items_processed=0,
                total_items_failed=0,
                last_sync_at=None
            )
        
        total_runs = len(sync_runs)
        successful_runs = len([r for r in sync_runs if r.status == SyncRunStatus.COMPLETED])
        failed_runs = len([r for r in sync_runs if r.status == SyncRunStatus.FAILED])
        running_runs = len([r for r in sync_runs if r.status == SyncRunStatus.RUNNING])
        
        success_rate = (successful_runs / total_runs) * 100 if total_runs > 0 else 0
        
        # Duração média (apenas para execuções completadas)
        completed_runs = [r for r in sync_runs if r.completed_at and r.started_at]
        avg_duration = 0.0
        if completed_runs:
            durations = [(r.completed_at - r.started_at).total_seconds() for r in completed_runs]
            avg_duration = sum(durations) / len(durations)
        
        total_items_processed = sum(r.items_processed or 0 for r in sync_runs)
        total_items_failed = sum(r.items_failed or 0 for r in sync_runs)
        
        last_sync_at = max((r.started_at for r in sync_runs), default=None)
        
        return SyncStats(
            total_runs=total_runs,
            successful_runs=successful_runs,
            failed_runs=failed_runs,
            running_runs=running_runs,
            success_rate=success_rate,
            avg_duration_seconds=avg_duration,
            total_items_processed=total_items_processed,
            total_items_failed=total_items_failed,
            last_sync_at=last_sync_at
        )
    
    async def _get_connector_stats(self, db: AsyncSession, tenant_id: Optional[UUID],
                                  start_date: datetime, end_date: datetime) -> List[ConnectorStats]:
        """Obtém estatísticas por conector."""
        
        query = select(
            SyncRun.connector_type,
            func.count(SyncRun.id).label('total_runs'),
            func.count(SyncRun.id).filter(SyncRun.status == SyncRunStatus.COMPLETED).label('successful_runs'),
            func.avg(
                func.extract('epoch', SyncRun.completed_at - SyncRun.started_at)
            ).filter(SyncRun.completed_at.isnot(None)).label('avg_duration'),
            func.max(SyncRun.started_at).label('last_sync_at'),
            func.sum(SyncRun.items_processed).label('total_items'),
            func.sum(SyncRun.items_failed).label('total_errors')
        ).where(
            and_(
                SyncRun.started_at >= start_date,
                SyncRun.started_at <= end_date
            )
        ).group_by(SyncRun.connector_type)
        
        if tenant_id:
            query = query.where(SyncRun.tenant_id == tenant_id)
        
        result = await db.execute(query)
        rows = result.all()
        
        connector_stats = []
        for row in rows:
            success_rate = (row.successful_runs / row.total_runs) * 100 if row.total_runs > 0 else 0
            error_rate = (row.total_errors / row.total_items) * 100 if row.total_items > 0 else 0
            
            # Calcular items por minuto
            items_per_minute = 0.0
            if row.avg_duration and row.avg_duration > 0:
                avg_items_per_run = row.total_items / row.total_runs if row.total_runs > 0 else 0
                items_per_minute = (avg_items_per_run / row.avg_duration) * 60
            
            connector_stats.append(ConnectorStats(
                connector_type=row.connector_type,
                total_runs=row.total_runs,
                success_rate=success_rate,
                avg_duration_seconds=row.avg_duration or 0.0,
                last_sync_at=row.last_sync_at,
                error_rate=error_rate,
                items_per_minute=items_per_minute
            ))
        
        return connector_stats
    
    async def _get_tenant_stats(self, db: AsyncSession, 
                               start_date: datetime, end_date: datetime) -> List[TenantStats]:
        """Obtém estatísticas por tenant."""
        
        query = select(
            SyncRun.tenant_id,
            Tenant.name.label('tenant_name'),
            func.count(SyncRun.id).label('total_runs'),
            func.count(SyncRun.id).filter(SyncRun.status == SyncRunStatus.COMPLETED).label('successful_runs'),
            func.count(func.distinct(SyncRun.connector_type)).label('active_connectors'),
            func.max(SyncRun.started_at).label('last_sync_at')
        ).select_from(
            SyncRun.__table__.join(Tenant.__table__)
        ).where(
            and_(
                SyncRun.started_at >= start_date,
                SyncRun.started_at <= end_date
            )
        ).group_by(SyncRun.tenant_id, Tenant.name)
        
        result = await db.execute(query)
        rows = result.all()
        
        tenant_stats = []
        for row in rows:
            success_rate = (row.successful_runs / row.total_runs) * 100 if row.total_runs > 0 else 0
            
            # TODO: Implementar cálculo real de quota usage
            quota_usage = 0.0
            
            tenant_stats.append(TenantStats(
                tenant_id=row.tenant_id,
                tenant_name=row.tenant_name,
                total_runs=row.total_runs,
                success_rate=success_rate,
                active_connectors=row.active_connectors,
                last_sync_at=row.last_sync_at,
                quota_usage=quota_usage
            ))
        
        return tenant_stats
    
    async def _get_recent_sync_runs(self, db: AsyncSession, 
                                   tenant_id: Optional[UUID], 
                                   limit: int = 20) -> List[SyncRunSummary]:
        """Obtém execuções de sincronização recentes."""
        
        query = select(SyncRun).options(
            selectinload(SyncRun.tenant)
        ).order_by(desc(SyncRun.started_at)).limit(limit)
        
        if tenant_id:
            query = query.where(SyncRun.tenant_id == tenant_id)
        
        result = await db.execute(query)
        sync_runs = result.scalars().all()
        
        summaries = []
        for run in sync_runs:
            duration_seconds = None
            if run.completed_at and run.started_at:
                duration_seconds = (run.completed_at - run.started_at).total_seconds()
            
            # Verificar se pode fazer replay
            can_replay = run.status in [SyncRunStatus.COMPLETED, SyncRunStatus.FAILED]
            
            # Contar replays existentes
            replay_count = len([r for r in self._replay_requests.values() 
                              if r.original_sync_run_id == run.id])
            
            summaries.append(SyncRunSummary(
                id=run.id,
                tenant_id=run.tenant_id,
                tenant_name=run.tenant.name if run.tenant else "Unknown",
                connector_type=run.connector_type,
                status=run.status,
                sync_type=run.sync_type,
                started_at=run.started_at,
                completed_at=run.completed_at,
                duration_seconds=duration_seconds,
                items_processed=run.items_processed or 0,
                items_failed=run.items_failed or 0,
                error_message=run.error_message,
                can_replay=can_replay,
                replay_count=replay_count
            ))
        
        return summaries
    
    async def _get_active_sync_runs(self, db: AsyncSession, 
                                   tenant_id: Optional[UUID]) -> List[SyncRunSummary]:
        """Obtém execuções de sincronização ativas."""
        
        query = select(SyncRun).options(
            selectinload(SyncRun.tenant)
        ).where(SyncRun.status == SyncRunStatus.RUNNING)
        
        if tenant_id:
            query = query.where(SyncRun.tenant_id == tenant_id)
        
        result = await db.execute(query)
        sync_runs = result.scalars().all()
        
        summaries = []
        for run in sync_runs:
            # Calcular duração atual
            duration_seconds = (datetime.utcnow() - run.started_at).total_seconds()
            
            summaries.append(SyncRunSummary(
                id=run.id,
                tenant_id=run.tenant_id,
                tenant_name=run.tenant.name if run.tenant else "Unknown",
                connector_type=run.connector_type,
                status=run.status,
                sync_type=run.sync_type,
                started_at=run.started_at,
                completed_at=None,
                duration_seconds=duration_seconds,
                items_processed=run.items_processed or 0,
                items_failed=run.items_failed or 0,
                error_message=None,
                can_replay=False,
                replay_count=0
            ))
        
        return summaries
    
    async def _get_replay_stats(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Obtém estatísticas de replay."""
        
        # Filtrar replays no período
        period_replays = [
            r for r in self._replay_requests.values()
            if start_date <= r.created_at <= end_date
        ]
        
        total_replays = len(period_replays)
        pending_replays = len([r for r in period_replays if r.status == ReplayStatus.PENDING])
        running_replays = len([r for r in period_replays if r.status == ReplayStatus.RUNNING])
        completed_replays = len([r for r in period_replays if r.status == ReplayStatus.COMPLETED])
        failed_replays = len([r for r in period_replays if r.status == ReplayStatus.FAILED])
        
        success_rate = (completed_replays / total_replays) * 100 if total_replays > 0 else 0
        
        return {
            "total_replays": total_replays,
            "pending_replays": pending_replays,
            "running_replays": running_replays,
            "completed_replays": completed_replays,
            "failed_replays": failed_replays,
            "success_rate": success_rate,
            "active_replays": len(self._active_replays)
        }
    
    @monitor_performance("sync_dashboard_create_replay")
    async def create_replay(self, sync_run_id: UUID, user_id: UUID, 
                           config_override: Optional[Dict[str, Any]] = None) -> ReplayRequest:
        """Cria uma requisição de replay para uma execução de sincronização."""
        
        async for db in get_db():
            # Verificar se a execução existe e pode ser replicada
            result = await db.execute(
                select(SyncRun).where(SyncRun.id == sync_run_id)
            )
            sync_run = result.scalar_one_or_none()
            
            if not sync_run:
                raise ValueError(f"SyncRun {sync_run_id} não encontrada")
            
            if sync_run.status not in [SyncRunStatus.COMPLETED, SyncRunStatus.FAILED]:
                raise ValueError(f"SyncRun {sync_run_id} não pode ser replicada (status: {sync_run.status})")
            
            # Criar requisição de replay
            replay_request = ReplayRequest(
                original_sync_run_id=sync_run_id,
                tenant_id=sync_run.tenant_id,
                connector_type=sync_run.connector_type,
                created_by=user_id,
                config_override=config_override
            )
            
            self._replay_requests[replay_request.id] = replay_request
            
            logger.info(f"Replay criado: {replay_request.id} para SyncRun {sync_run_id}")
            
            # Registrar métrica
            metrics.add_custom_metric(
                "sync_replay_created",
                1,
                {
                    "tenant_id": str(sync_run.tenant_id),
                    "connector_type": sync_run.connector_type
                }
            )
            
            return replay_request
    
    @monitor_performance("sync_dashboard_execute_replay")
    async def execute_replay(self, replay_id: UUID) -> bool:
        """Executa um replay de sincronização."""
        
        replay_request = self._replay_requests.get(replay_id)
        if not replay_request:
            raise ValueError(f"Replay {replay_id} não encontrado")
        
        if replay_request.status != ReplayStatus.PENDING:
            raise ValueError(f"Replay {replay_id} não está pendente (status: {replay_request.status})")
        
        # Marcar como em execução
        replay_request.status = ReplayStatus.RUNNING
        replay_request.started_at = datetime.utcnow()
        
        try:
            # Criar task assíncrona para executar o replay
            task = asyncio.create_task(self._execute_replay_task(replay_request))
            self._active_replays[replay_id] = task
            
            logger.info(f"Replay {replay_id} iniciado")
            return True
            
        except Exception as e:
            replay_request.status = ReplayStatus.FAILED
            replay_request.error_message = str(e)
            replay_request.completed_at = datetime.utcnow()
            
            logger.error(f"Erro ao iniciar replay {replay_id}: {e}")
            return False
    
    async def _execute_replay_task(self, replay_request: ReplayRequest):
        """Task para executar o replay de sincronização."""
        
        try:
            async for db in get_db():
                # Obter a execução original
                result = await db.execute(
                    select(SyncRun).where(SyncRun.id == replay_request.original_sync_run_id)
                )
                original_run = result.scalar_one()
                
                # Executar nova sincronização com base na original
                await self.connector_service.execute_sync(
                    tenant_id=replay_request.tenant_id,
                    connector_type=replay_request.connector_type,
                    sync_type=original_run.sync_type,
                    config_override=replay_request.config_override
                )
                
                # Marcar como completado
                replay_request.status = ReplayStatus.COMPLETED
                replay_request.completed_at = datetime.utcnow()
                
                logger.info(f"Replay {replay_request.id} completado com sucesso")
                
                # Registrar métrica
                metrics.add_custom_metric(
                    "sync_replay_completed",
                    1,
                    {
                        "tenant_id": str(replay_request.tenant_id),
                        "connector_type": replay_request.connector_type
                    }
                )
                
        except Exception as e:
            replay_request.status = ReplayStatus.FAILED
            replay_request.error_message = str(e)
            replay_request.completed_at = datetime.utcnow()
            
            logger.error(f"Erro ao executar replay {replay_request.id}: {e}")
            
            # Registrar métrica
            metrics.add_custom_metric(
                "sync_replay_failed",
                1,
                {
                    "tenant_id": str(replay_request.tenant_id),
                    "connector_type": replay_request.connector_type,
                    "error_type": type(e).__name__
                }
            )
        
        finally:
            # Remover da lista de replays ativos
            self._active_replays.pop(replay_request.id, None)
    
    async def get_replay_status(self, replay_id: UUID) -> Optional[ReplayRequest]:
        """Obtém o status de um replay."""
        return self._replay_requests.get(replay_id)
    
    async def cancel_replay(self, replay_id: UUID) -> bool:
        """Cancela um replay em execução."""
        
        replay_request = self._replay_requests.get(replay_id)
        if not replay_request:
            return False
        
        if replay_request.status == ReplayStatus.RUNNING:
            # Cancelar task se estiver em execução
            task = self._active_replays.get(replay_id)
            if task:
                task.cancel()
                self._active_replays.pop(replay_id, None)
            
            replay_request.status = ReplayStatus.CANCELLED
            replay_request.completed_at = datetime.utcnow()
            
            logger.info(f"Replay {replay_id} cancelado")
            return True
        
        return False
    
    async def get_replay_history(self, tenant_id: Optional[UUID] = None, 
                                limit: int = 50) -> List[ReplayRequest]:
        """Obtém histórico de replays."""
        
        replays = list(self._replay_requests.values())
        
        if tenant_id:
            replays = [r for r in replays if r.tenant_id == tenant_id]
        
        # Ordenar por data de criação (mais recente primeiro)
        replays.sort(key=lambda x: x.created_at, reverse=True)
        
        return replays[:limit]

# Instância global do dashboard
sync_dashboard = None

def get_sync_dashboard() -> SyncDashboard:
    """Retorna a instância global do dashboard de sincronização."""
    global sync_dashboard
    if sync_dashboard is None:
        from app.services.connector_service import get_connector_service
        sync_dashboard = SyncDashboard(get_connector_service())
    return sync_dashboard