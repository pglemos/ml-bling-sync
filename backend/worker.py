#!/usr/bin/env python3
"""Celery Worker

Celery worker for processing background tasks.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.celery_config import celery_app

if __name__ == '__main__':
    # Start the Celery worker
    celery_app.start([
        'worker',
        '--loglevel=info',
        '--concurrency=4',
        '--queues=default,sync_products,sync_inventory,sync_orders,sync_bulk,maintenance,high_priority,urgent',
        '--hostname=worker@%h',
        '--max-tasks-per-child=1000',
        '--time-limit=600',
        '--soft-time-limit=300'
    ])