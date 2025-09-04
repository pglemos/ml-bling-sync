#!/usr/bin/env python3
"""Celery Flower Monitor

Flower web-based tool for monitoring and administrating Celery clusters.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.celery_config import celery_app
from app.core.config import settings

if __name__ == '__main__':
    # Start Flower
    celery_app.start([
        'flower',
        '--port=5555',
        '--broker=' + settings.REDIS_URL,
        '--basic_auth=admin:admin123',  # Change in production
        '--url_prefix=flower',
        '--persistent=True',
        '--db=/tmp/flower.db',
        '--max_tasks=10000'
    ])