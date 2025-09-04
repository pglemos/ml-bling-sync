"""Sync Orchestration API Routes

API endpoints for managing synchronization jobs and queue.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.services.sync_orchestrator import orchestrator, SyncRequest, SyncPriority
from app.infra.database import get_db
from app.domain.models import User, SyncJob, Integration
from sqlalchemy.orm import Session

router = APIRouter()

# Pydantic models
class SyncJobRequest(BaseModel):
    """Request model for creating sync jobs"""
    integration_id: str = Field(..., description="Integration ID to sync")
    sync_type: str = Field(..., description="Type of sync: products, inventory, orders")
    priority: str = Field(default="normal", description="Priority: low, normal, high, urgent")
    options: Optional[Dict[str, Any]] = Field(default=None, description="Sync options")
    scheduled_at: Optional[datetime] = Field(default=None, description="Schedule sync for later")

class BulkSyncRequest(BaseModel):
    """Request model for bulk sync jobs"""
    integration_ids: List[str] = Field(..., description="List of integration IDs")
    sync_type: str = Field(..., description="Type of sync: products, inventory, orders")
    priority: str = Field(default="normal", description="Priority: low, normal, high, urgent")

class SyncJobResponse(BaseModel):
    """Response model for sync jobs"""
    id: str
    integration_id: str
    sync_type: str
    status: str
    priority: str
    progress: int
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    result: Optional[Dict[str, Any]]
    error_message: Optional[str]

@router.post("/jobs", response_model=Dict[str, str])
async def create_sync_job(
    request: SyncJobRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new sync job"""
    try:
        # Validate integration exists and belongs to user
        integration = db.query(Integration).filter(
            Integration.id == request.integration_id,
            Integration.user_id == current_user.id
        ).first()
        
        if not integration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Integration not found"
            )
        
        # Validate sync type
        if request.sync_type not in ['products', 'inventory', 'orders']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid sync type. Must be: products, inventory, or orders"
            )
        
        # Validate priority
        priority_map = {
            'low': SyncPriority.LOW,
            'normal': SyncPriority.NORMAL,
            'high': SyncPriority.HIGH,
            'urgent': SyncPriority.URGENT
        }
        
        if request.priority not in priority_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid priority. Must be: low, normal, high, or urgent"
            )
        
        # Create sync request
        sync_request = SyncRequest(
            integration_id=request.integration_id,
            sync_type=request.sync_type,
            priority=priority_map[request.priority],
            options=request.options,
            scheduled_at=request.scheduled_at,
            user_id=current_user.id
        )
        
        # Queue the sync job
        job_id = await orchestrator.queue_sync(sync_request)
        
        return {"job_id": job_id, "message": "Sync job queued successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create sync job: {str(e)}"
        )

@router.post("/jobs/bulk", response_model=Dict[str, Any])
async def create_bulk_sync_jobs(
    request: BulkSyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create multiple sync jobs"""
    try:
        # Validate integrations exist and belong to user
        integrations = db.query(Integration).filter(
            Integration.id.in_(request.integration_ids),
            Integration.user_id == current_user.id
        ).all()
        
        if len(integrations) != len(request.integration_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more integrations not found"
            )
        
        # Validate sync type
        if request.sync_type not in ['products', 'inventory', 'orders']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid sync type. Must be: products, inventory, or orders"
            )
        
        # Validate priority
        priority_map = {
            'low': SyncPriority.LOW,
            'normal': SyncPriority.NORMAL,
            'high': SyncPriority.HIGH,
            'urgent': SyncPriority.URGENT
        }
        
        if request.priority not in priority_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid priority. Must be: low, normal, high, or urgent"
            )
        
        # Schedule bulk sync
        job_ids = await orchestrator.schedule_bulk_sync(
            request.integration_ids,
            request.sync_type,
            priority_map[request.priority]
        )
        
        return {
            "job_ids": job_ids,
            "count": len(job_ids),
            "message": f"Scheduled {len(job_ids)} sync jobs"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create bulk sync jobs: {str(e)}"
        )

@router.get("/jobs/{job_id}", response_model=Dict[str, Any])
async def get_sync_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get sync job status"""
    try:
        # Verify job belongs to user
        sync_job = db.query(SyncJob).filter(SyncJob.id == job_id).first()
        
        if not sync_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sync job not found"
            )
        
        # Check if user owns the integration
        integration = db.query(Integration).filter(
            Integration.id == sync_job.integration_id,
            Integration.user_id == current_user.id
        ).first()
        
        if not integration:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get job status from orchestrator
        status_info = await orchestrator.get_sync_status(job_id)
        
        return status_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sync job status: {str(e)}"
        )

@router.delete("/jobs/{job_id}")
async def cancel_sync_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a sync job"""
    try:
        # Verify job belongs to user
        sync_job = db.query(SyncJob).filter(SyncJob.id == job_id).first()
        
        if not sync_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sync job not found"
            )
        
        # Check if user owns the integration
        integration = db.query(Integration).filter(
            Integration.id == sync_job.integration_id,
            Integration.user_id == current_user.id
        ).first()
        
        if not integration:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Cancel the job
        success = await orchestrator.cancel_sync(job_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to cancel sync job"
            )
        
        return {"message": "Sync job cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel sync job: {str(e)}"
        )

@router.get("/jobs", response_model=List[SyncJobResponse])
async def list_sync_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    integration_id: Optional[str] = Query(None, description="Filter by integration ID"),
    sync_type: Optional[str] = Query(None, description="Filter by sync type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100, description="Number of jobs to return"),
    offset: int = Query(0, ge=0, description="Number of jobs to skip")
):
    """List sync jobs for the current user"""
    try:
        # Build query
        query = db.query(SyncJob).join(Integration).filter(
            Integration.user_id == current_user.id
        )
        
        # Apply filters
        if integration_id:
            query = query.filter(SyncJob.integration_id == integration_id)
        
        if sync_type:
            query = query.filter(SyncJob.sync_type == sync_type)
        
        if status:
            query = query.filter(SyncJob.status == status)
        
        # Order by creation date (newest first)
        query = query.order_by(SyncJob.created_at.desc())
        
        # Apply pagination
        sync_jobs = query.offset(offset).limit(limit).all()
        
        # Convert to response format
        response = []
        for job in sync_jobs:
            response.append(SyncJobResponse(
                id=job.id,
                integration_id=job.integration_id,
                sync_type=job.sync_type,
                status=job.status.value,
                priority=job.priority,
                progress=job.progress,
                created_at=job.created_at,
                started_at=job.started_at,
                completed_at=job.completed_at,
                result=job.result,
                error_message=job.error_message
            ))
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list sync jobs: {str(e)}"
        )

@router.get("/queue/stats", response_model=Dict[str, Any])
async def get_queue_stats(
    current_user: User = Depends(get_current_user)
):
    """Get queue statistics"""
    try:
        stats = await orchestrator.get_queue_stats()
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get queue stats: {str(e)}"
        )

@router.post("/integrations/{integration_id}/sync/{sync_type}")
async def quick_sync(
    integration_id: str,
    sync_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    priority: str = Query("normal", description="Sync priority")
):
    """Quick sync endpoint for immediate synchronization"""
    try:
        # Validate integration exists and belongs to user
        integration = db.query(Integration).filter(
            Integration.id == integration_id,
            Integration.user_id == current_user.id
        ).first()
        
        if not integration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Integration not found"
            )
        
        # Validate sync type
        if sync_type not in ['products', 'inventory', 'orders']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid sync type. Must be: products, inventory, or orders"
            )
        
        # Create sync request
        priority_map = {
            'low': SyncPriority.LOW,
            'normal': SyncPriority.NORMAL,
            'high': SyncPriority.HIGH,
            'urgent': SyncPriority.URGENT
        }
        
        sync_request = SyncRequest(
            integration_id=integration_id,
            sync_type=sync_type,
            priority=priority_map.get(priority, SyncPriority.NORMAL),
            user_id=current_user.id
        )
        
        # Queue the sync job
        job_id = await orchestrator.queue_sync(sync_request)
        
        return {
            "job_id": job_id,
            "message": f"Quick {sync_type} sync started for {integration.name}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start quick sync: {str(e)}"
        )