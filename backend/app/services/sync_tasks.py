"""Celery Tasks for Synchronization

Background tasks for product, inventory, and order synchronization.
"""

import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from celery import current_task
import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.sync_orchestrator import celery_app
from app.infra.database import get_db
from app.domain.models import SyncJob, SyncJobStatus, Integration
from app.infra.websockets import broadcast_sync_update

# Configure logging
logger = logging.getLogger(__name__)

# Import connectors dynamically
def get_connector(integration_type: str, config: Dict[str, Any]):
    """Get connector instance based on integration type"""
    if integration_type == 'shopify':
        from src.connectors.shopify.ShopifyConnector import ShopifyConnector
        connector = ShopifyConnector()
        connector.configure(config)
        return connector
    elif integration_type == 'nuvemshop':
        from src.connectors.nuvemshop.NuvemShopConnector import NuvemShopConnector
        connector = NuvemShopConnector()
        connector.configure(config)
        return connector
    elif integration_type == 'bling':
        from src.connectors.bling.BlingConnector import BlingConnector
        connector = BlingConnector()
        connector.configure(config)
        return connector
    else:
        raise ValueError(f"Unknown integration type: {integration_type}")

@celery_app.task(bind=True, name='app.services.sync_tasks.sync_products')
def sync_products(self, job_id: str):
    """Sync products from supplier"""
    db = next(get_db())
    
    try:
        # Get sync job
        sync_job = db.query(SyncJob).filter(SyncJob.id == job_id).first()
        if not sync_job:
            raise ValueError(f"Sync job not found: {job_id}")
        
        # Update job status
        sync_job.status = SyncJobStatus.RUNNING
        sync_job.started_at = datetime.utcnow()
        sync_job.task_id = self.request.id
        db.commit()
        
        # Get integration
        integration = db.query(Integration).filter(Integration.id == sync_job.integration_id).first()
        if not integration:
            raise ValueError(f"Integration not found: {sync_job.integration_id}")
        
        # Broadcast start event
        asyncio.create_task(broadcast_sync_update({
            "job_id": job_id,
            "status": "running",
            "message": "Starting product synchronization",
            "progress": 0
        }))
        
        # Get connector
        connector = get_connector(integration.type, {
            'type': integration.type,
            'credentials': integration.credentials
        })
        
        # Get sync options
        options = sync_job.options or {}
        limit = options.get('limit', 100)
        offset = options.get('offset', 0)
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 10, 'message': 'Connecting to supplier'})
        sync_job.progress = 10
        db.commit()
        
        # Test connection
        if not connector.test_connection():
            raise Exception("Failed to connect to supplier")
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 20, 'message': 'Importing products'})
        sync_job.progress = 20
        db.commit()
        
        # Import products
        result = connector.import_products(limit, offset)
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 80, 'message': 'Processing results'})
        sync_job.progress = 80
        db.commit()
        
        # Update job with results
        sync_job.status = SyncJobStatus.COMPLETED if result['success'] else SyncJobStatus.FAILED
        sync_job.completed_at = datetime.utcnow()
        sync_job.progress = 100
        sync_job.result = result
        
        if not result['success'] and result.get('errors'):
            sync_job.error_message = '; '.join(result['errors'])
        
        db.commit()
        
        # Broadcast completion event
        asyncio.create_task(broadcast_sync_update({
            "job_id": job_id,
            "status": "completed" if result['success'] else "failed",
            "message": f"Imported {result['products_imported']} products" if result['success'] else "Sync failed",
            "progress": 100,
            "result": result
        }))
        
        logger.info(f"Product sync completed: {job_id} - {result}")
        return result
        
    except Exception as e:
        # Update job with error
        sync_job.status = SyncJobStatus.FAILED
        sync_job.completed_at = datetime.utcnow()
        sync_job.error_message = str(e)
        sync_job.progress = 0
        db.commit()
        
        # Broadcast error event
        asyncio.create_task(broadcast_sync_update({
            "job_id": job_id,
            "status": "failed",
            "message": f"Sync failed: {str(e)}",
            "progress": 0,
            "error": str(e)
        }))
        
        logger.error(f"Product sync failed: {job_id} - {e}")
        raise
    
    finally:
        db.close()

@celery_app.task(bind=True, name='app.services.sync_tasks.sync_inventory')
def sync_inventory(self, job_id: str):
    """Sync inventory from supplier"""
    db = next(get_db())
    
    try:
        # Get sync job
        sync_job = db.query(SyncJob).filter(SyncJob.id == job_id).first()
        if not sync_job:
            raise ValueError(f"Sync job not found: {job_id}")
        
        # Update job status
        sync_job.status = SyncJobStatus.RUNNING
        sync_job.started_at = datetime.utcnow()
        sync_job.task_id = self.request.id
        db.commit()
        
        # Get integration
        integration = db.query(Integration).filter(Integration.id == sync_job.integration_id).first()
        if not integration:
            raise ValueError(f"Integration not found: {sync_job.integration_id}")
        
        # Broadcast start event
        asyncio.create_task(broadcast_sync_update({
            "job_id": job_id,
            "status": "running",
            "message": "Starting inventory synchronization",
            "progress": 0
        }))
        
        # Get connector
        connector = get_connector(integration.type, {
            'type': integration.type,
            'credentials': integration.credentials
        })
        
        # Get sync options
        options = sync_job.options or {}
        skus = options.get('skus', [])
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 20, 'message': 'Fetching inventory'})
        sync_job.progress = 20
        db.commit()
        
        # Fetch inventory
        inventory = connector.fetch_inventory(skus if skus else None)
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 80, 'message': 'Processing inventory data'})
        sync_job.progress = 80
        db.commit()
        
        # Process inventory data (update database, etc.)
        result = {
            'success': True,
            'inventory_items': len(inventory),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Update job with results
        sync_job.status = SyncJobStatus.COMPLETED
        sync_job.completed_at = datetime.utcnow()
        sync_job.progress = 100
        sync_job.result = result
        db.commit()
        
        # Broadcast completion event
        asyncio.create_task(broadcast_sync_update({
            "job_id": job_id,
            "status": "completed",
            "message": f"Updated {len(inventory)} inventory items",
            "progress": 100,
            "result": result
        }))
        
        logger.info(f"Inventory sync completed: {job_id} - {result}")
        return result
        
    except Exception as e:
        # Update job with error
        sync_job.status = SyncJobStatus.FAILED
        sync_job.completed_at = datetime.utcnow()
        sync_job.error_message = str(e)
        sync_job.progress = 0
        db.commit()
        
        # Broadcast error event
        asyncio.create_task(broadcast_sync_update({
            "job_id": job_id,
            "status": "failed",
            "message": f"Inventory sync failed: {str(e)}",
            "progress": 0,
            "error": str(e)
        }))
        
        logger.error(f"Inventory sync failed: {job_id} - {e}")
        raise
    
    finally:
        db.close()

@celery_app.task(bind=True, name='app.services.sync_tasks.sync_orders')
def sync_orders(self, job_id: str):
    """Sync orders from supplier"""
    db = next(get_db())
    
    try:
        # Get sync job
        sync_job = db.query(SyncJob).filter(SyncJob.id == job_id).first()
        if not sync_job:
            raise ValueError(f"Sync job not found: {job_id}")
        
        # Update job status
        sync_job.status = SyncJobStatus.RUNNING
        sync_job.started_at = datetime.utcnow()
        sync_job.task_id = self.request.id
        db.commit()
        
        # Get integration
        integration = db.query(Integration).filter(Integration.id == sync_job.integration_id).first()
        if not integration:
            raise ValueError(f"Integration not found: {sync_job.integration_id}")
        
        # Broadcast start event
        asyncio.create_task(broadcast_sync_update({
            "job_id": job_id,
            "status": "running",
            "message": "Starting order synchronization",
            "progress": 0
        }))
        
        # Get connector
        connector = get_connector(integration.type, {
            'type': integration.type,
            'credentials': integration.credentials
        })
        
        # Get sync options
        options = sync_job.options or {}
        limit = options.get('limit', 50)
        since = options.get('since')
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 20, 'message': 'Fetching orders'})
        sync_job.progress = 20
        db.commit()
        
        # Fetch orders (this would need to be implemented in connectors)
        # For now, simulate order sync
        result = {
            'success': True,
            'orders_imported': 0,
            'orders_updated': 0,
            'orders_failed': 0,
            'message': 'Order sync not yet implemented in connectors'
        }
        
        # Update job with results
        sync_job.status = SyncJobStatus.COMPLETED
        sync_job.completed_at = datetime.utcnow()
        sync_job.progress = 100
        sync_job.result = result
        db.commit()
        
        # Broadcast completion event
        asyncio.create_task(broadcast_sync_update({
            "job_id": job_id,
            "status": "completed",
            "message": "Order sync completed (placeholder)",
            "progress": 100,
            "result": result
        }))
        
        logger.info(f"Order sync completed: {job_id} - {result}")
        return result
        
    except Exception as e:
        # Update job with error
        sync_job.status = SyncJobStatus.FAILED
        sync_job.completed_at = datetime.utcnow()
        sync_job.error_message = str(e)
        sync_job.progress = 0
        db.commit()
        
        # Broadcast error event
        asyncio.create_task(broadcast_sync_update({
            "job_id": job_id,
            "status": "failed",
            "message": f"Order sync failed: {str(e)}",
            "progress": 0,
            "error": str(e)
        }))
        
        logger.error(f"Order sync failed: {job_id} - {e}")
        raise
    
    finally:
        db.close()

@celery_app.task(name='app.services.sync_tasks.sync_all_integrations')
def sync_all_integrations():
    """Periodic task to sync all active integrations"""
    db = next(get_db())
    
    try:
        # Get all active integrations
        integrations = db.query(Integration).filter(Integration.is_active == True).all()
        
        logger.info(f"Starting periodic sync for {len(integrations)} integrations")
        
        for integration in integrations:
            # Queue product sync for each integration
            from app.services.sync_orchestrator import orchestrator, SyncRequest, SyncPriority
            
            request = SyncRequest(
                integration_id=integration.id,
                sync_type='products',
                priority=SyncPriority.LOW,
                options={'limit': 50, 'offset': 0}
            )
            
            asyncio.create_task(orchestrator.queue_sync(request))
        
        logger.info(f"Queued periodic sync for {len(integrations)} integrations")
        return {'synced_integrations': len(integrations)}
        
    except Exception as e:
        logger.error(f"Periodic sync failed: {e}")
        raise
    
    finally:
        db.close()

@celery_app.task(name='app.services.sync_tasks.cleanup_old_sync_jobs')
def cleanup_old_sync_jobs():
    """Clean up old sync jobs"""
    db = next(get_db())
    
    try:
        # Delete jobs older than 30 days
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        deleted_count = db.query(SyncJob).filter(
            SyncJob.created_at < cutoff_date
        ).delete()
        
        db.commit()
        
        logger.info(f"Cleaned up {deleted_count} old sync jobs")
        return {'deleted_jobs': deleted_count}
        
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        raise
    
    finally:
        db.close()