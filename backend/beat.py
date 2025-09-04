#!/usr/bin/env python3
"""Celery Beat Scheduler

Celery beat scheduler for periodic tasks.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.celery_config import celery_app

if __name__ == '__main__':
    # Start the Celery beat scheduler
    celery_app.start([
        'beat',
        '--loglevel=info',
        '--scheduler=django_celery_beat.schedulers:DatabaseScheduler',
        '--pidfile=/tmp/celerybeat.pid'
    ])