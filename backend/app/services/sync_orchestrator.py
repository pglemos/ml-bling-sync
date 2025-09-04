"""Sync Orchestration Service

Orchestrates synchronization between suppliers and marketplaces using Celery tasks.
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass
import asyncio
from celery import Celery
from celery.result import AsyncResult
import redis
import json

from app.core.config import settings
from app.infra.database import get_db
from app.domain.models import Integration, SyncJob, SyncJobStatus

# Configure logging
logger = logging.getLogger(__name__)

# Celery app configuration
celery_app = Celery(
    'ml-bling-sync',
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=['app.services.sync_tasks']
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_disable_rate_limits=False,
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,
    beat_schedule={
        'sync-all-integrations': {
            'task': 'app.services.sync_tasks.sync_all_integrations',
            'schedule': timedelta(minutes=30),  # Every 30 minutes
        },
        'cleanup-old-sync-jobs': {
            'task': 'app.services.sync_tasks.cleanup_old_sync_jobs',
            'schedule': timedelta(hours=24),  # Daily cleanup
        },
    },
)

# Redis client for queue management
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class SyncPriority(Enum):
    """Sync job priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

@dataclass
class SyncRequest:
    """Sync request data structure"""
    integration_id: str
    sync_type: str  # 'products', 'inventory', 'orders'
    priority: SyncPriority = SyncPriority.NORMAL
    options: Dict[str, Any] = None
    scheduled_at: Optional[datetime] = None
    user_id: Optional[str] = None

class SyncOrchestrator:
    """Main orchestrator for synchronization tasks"""
    
    def __init__(self):
        self.redis = redis_client
        self.celery = celery_app
        
    async def queue_sync(self, request: SyncRequest) -> str:
        """Queue a synchronization task"""
        try:
            # Create sync job record
            db = next(get_db())
            sync_job = SyncJob(
                integration_id=request.integration_id,
                sync_type=request.sync_type,
                status=SyncJobStatus.QUEUED,
                priority=request.priority.value,
                options=request.options or {},
                scheduled_at=request.scheduled_at or datetime.utcnow(),
                user_id=request.user_id
            )
            db.add(sync_job)
            db.commit()
            db.refresh(sync_job)
            
            # Queue Celery task
            task_name = f"app.services.sync_tasks.sync_{request.sync_type}"
            
            if request.scheduled_at and request.scheduled_at > datetime.utcnow():
                # Schedule for later
                task = self.celery.send_task(
                    task_name,
                    args=[sync_job.id],
                    eta=request.scheduled_at,
                    priority=self._get_celery_priority(request.priority)
                )
            else:
                # Execute immediately
                task = self.celery.send_task(
                    task_name,
                    args=[sync_job.id],
                    priority=self._get_celery_priority(request.priority)
                )
            
            # Update job with task ID
            sync_job.task_id = task.id
            db.commit()
            
            logger.info(f"Sync job queued: {sync_job.id} (task: {task.id})")
            return sync_job.id
            
        except Exception as e:
            logger.error(f"Failed to queue sync job: {e}")
            raise
        finally:
            db.close()
    
    async def get_sync_status(self, job_id: str) -> Dict[str, Any]:
        """Get status of a sync job"""
        try:
            db = next(get_db())
            sync_job = db.query(SyncJob).filter(SyncJob.id == job_id).first()
            
            if not sync_job:
                return {"error": "Job not found"}
            
            result = {
                "id": sync_job.id,
                "integration_id": sync_job.integration_id,
                "sync_type": sync_job.sync_type,
                "status": sync_job.status.value,
                "priority": sync_job.priority,
                "created_at": sync_job.created_at.isoformat(),
                "started_at": sync_job.started_at.isoformat() if sync_job.started_at else None,
                "completed_at": sync_job.completed_at.isoformat() if sync_job.completed_at else None,
                "progress": sync_job.progress,
                "result": sync_job.result,
                "error_message": sync_job.error_message
            }
            
            # Get Celery task status if available
            if sync_job.task_id:
                celery_result = AsyncResult(sync_job.task_id, app=self.celery)
                result["celery_status"] = celery_result.status
                result["celery_info"] = celery_result.info
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get sync status: {e}")
            return {"error": str(e)}
        finally:
            db.close()
    
    async def cancel_sync(self, job_id: str) -> bool:
        """Cancel a sync job"""
        try:
            db = next(get_db())
            sync_job = db.query(SyncJob).filter(SyncJob.id == job_id).first()
            
            if not sync_job:
                return False
            
            # Cancel Celery task
            if sync_job.task_id:
                self.celery.control.revoke(sync_job.task_id, terminate=True)
            
            # Update job status
            sync_job.status = SyncJobStatus.CANCELLED
            sync_job.completed_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Sync job cancelled: {job_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cancel sync job: {e}")
            return False
        finally:
            db.close()
    
    async def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics"""
        try:
            # Get Celery queue stats
            inspect = self.celery.control.inspect()
            active_tasks = inspect.active()
            scheduled_tasks = inspect.scheduled()
            reserved_tasks = inspect.reserved()
            
            # Get database stats
            db = next(get_db())
            total_jobs = db.query(SyncJob).count()
            queued_jobs = db.query(SyncJob).filter(SyncJob.status == SyncJobStatus.QUEUED).count()
            running_jobs = db.query(SyncJob).filter(SyncJob.status == SyncJobStatus.RUNNING).count()
            completed_jobs = db.query(SyncJob).filter(SyncJob.status == SyncJobStatus.COMPLETED).count()
            failed_jobs = db.query(SyncJob).filter(SyncJob.status == SyncJobStatus.FAILED).count()
            
            return {
                "celery": {
                    "active_tasks": len(active_tasks.get('celery@worker', [])) if active_tasks else 0,
                    "scheduled_tasks": len(scheduled_tasks.get('celery@worker', [])) if scheduled_tasks else 0,
                    "reserved_tasks": len(reserved_tasks.get('celery@worker', [])) if reserved_tasks else 0
                },
                "database": {
                    "total_jobs": total_jobs,
                    "queued_jobs": queued_jobs,
                    "running_jobs": running_jobs,
                    "completed_jobs": completed_jobs,
                    "failed_jobs": failed_jobs
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get queue stats: {e}")
            return {"error": str(e)}
        finally:
            db.close()
    
    async def schedule_bulk_sync(self, integration_ids: List[str], sync_type: str, 
                                priority: SyncPriority = SyncPriority.NORMAL) -> List[str]:
        """Schedule bulk synchronization for multiple integrations"""
        job_ids = []
        
        for integration_id in integration_ids:
            request = SyncRequest(
                integration_id=integration_id,
                sync_type=sync_type,
                priority=priority
            )
            job_id = await self.queue_sync(request)
            job_ids.append(job_id)
        
        logger.info(f"Scheduled bulk sync: {len(job_ids)} jobs for {sync_type}")
        return job_ids
    
    def _get_celery_priority(self, priority: SyncPriority) -> int:
        """Convert sync priority to Celery priority"""
        priority_map = {
            SyncPriority.LOW: 1,
            SyncPriority.NORMAL: 5,
            SyncPriority.HIGH: 8,
            SyncPriority.URGENT: 10
        }
        return priority_map.get(priority, 5)

# Global orchestrator instance
orchestrator = SyncOrchestrator()