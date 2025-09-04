"""Celery Configuration

Celery configuration for background task processing.
"""

import os
from celery import Celery
from kombu import Queue
from app.core.config import settings

# Create Celery instance
celery_app = Celery(
    "ml_bling_sync",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.services.sync_tasks",
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer=settings.CELERY_TASK_SERIALIZER,
    accept_content=settings.CELERY_ACCEPT_CONTENT,
    result_serializer=settings.CELERY_RESULT_SERIALIZER,
    timezone=settings.CELERY_TIMEZONE,
    enable_utc=settings.CELERY_ENABLE_UTC,
    
    # Task routing
    task_routes={
        "app.services.sync_tasks.sync_products": {"queue": "sync_products"},
        "app.services.sync_tasks.sync_inventory": {"queue": "sync_inventory"},
        "app.services.sync_tasks.sync_orders": {"queue": "sync_orders"},
        "app.services.sync_tasks.sync_all_integrations": {"queue": "sync_bulk"},
        "app.services.sync_tasks.cleanup_old_sync_jobs": {"queue": "maintenance"},
    },
    
    # Queue configuration
    task_default_queue="default",
    task_queues=(
        Queue("default", routing_key="default"),
        Queue("sync_products", routing_key="sync_products"),
        Queue("sync_inventory", routing_key="sync_inventory"),
        Queue("sync_orders", routing_key="sync_orders"),
        Queue("sync_bulk", routing_key="sync_bulk"),
        Queue("maintenance", routing_key="maintenance"),
        Queue("high_priority", routing_key="high_priority"),
        Queue("urgent", routing_key="urgent"),
    ),
    
    # Worker settings
    worker_prefetch_multiplier=settings.CELERY_WORKER_PREFETCH_MULTIPLIER,
    task_acks_late=True,
    worker_max_tasks_per_child=settings.CELERY_WORKER_MAX_TASKS_PER_CHILD,
    
    # Task execution settings
    task_soft_time_limit=settings.CELERY_TASK_SOFT_TIME_LIMIT,
    task_time_limit=settings.CELERY_TASK_TIME_LIMIT,
    task_max_retries=settings.CELERY_TASK_MAX_RETRIES,
    task_default_retry_delay=settings.CELERY_TASK_DEFAULT_RETRY_DELAY,
    
    # Result backend settings
    result_expires=settings.CELERY_RESULT_EXPIRES,
    result_persistent=True,
    
    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        "cleanup-old-sync-jobs": {
            "task": "app.services.sync_tasks.cleanup_old_sync_jobs",
            "schedule": 3600.0,  # Every hour
            "options": {"queue": "maintenance"}
        },
        "sync-all-integrations-daily": {
            "task": "app.services.sync_tasks.sync_all_integrations",
            "schedule": 86400.0,  # Every 24 hours
            "options": {"queue": "sync_bulk"}
        },
    },
    beat_scheduler="django_celery_beat.schedulers:DatabaseScheduler",
)

# Priority routing
def route_task(name, args, kwargs, options, task=None, **kwds):
    """Custom task routing based on priority"""
    priority = kwargs.get('priority', 'normal')
    
    if priority == 'urgent':
        return {'queue': 'urgent'}
    elif priority == 'high':
        return {'queue': 'high_priority'}
    
    # Default routing
    return None

celery_app.conf.task_routes = (route_task,)

# Error handling
@celery_app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery setup"""
    print(f'Request: {self.request!r}')
    return 'Debug task completed'

# Task failure handler
@celery_app.task(bind=True)
def task_failure_handler(self, task_id, error, traceback):
    """Handle task failures"""
    print(f'Task {task_id} failed: {error}')
    print(f'Traceback: {traceback}')
    
    # Here you could send notifications, log to external services, etc.
    # For now, we'll just log the error
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f'Task {task_id} failed: {error}', exc_info=True)

# Connect failure handler
celery_app.conf.task_annotations = {
    '*': {'on_failure': task_failure_handler}
}

if __name__ == '__main__':
    celery_app.start()