from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
import logging

from ...database import get_db
from ...domain.models import Order, SupplierOrderTask, SupplierTaskStatus
from ...schemas.orders import (
    OrderResponse,
    OrderCreate,
    OrderUpdate,
    SupplierOrderTaskResponse,
    SupplierOrderTaskCreate,
    SupplierOrderTaskUpdate,
    OrderWebhookPayload
)
from ...services.order_tasks import OrderTaskService, OrderWebhookService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/orders", tags=["orders"])

# Order endpoints
@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get orders with pagination and filtering"""
    query = db.query(Order)
    
    if status:
        query = query.filter(Order.status == status)
    
    orders = query.offset(skip).limit(limit).all()
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific order by ID"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db)
):
    """Create a new order"""
    try:
        order = Order(**order_data.dict())
        db.add(order)
        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=400, detail="Error creating order")

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    order_data: OrderUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        for field, value in order_data.dict(exclude_unset=True).items():
            setattr(order, field, value)
        
        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating order {order_id}: {str(e)}")
        raise HTTPException(status_code=400, detail="Error updating order")

# Webhook endpoint
@router.post("/webhook")
async def order_webhook(
    payload: OrderWebhookPayload,
    db: Session = Depends(get_db)
):
    """Handle incoming order webhooks"""
    try:
        webhook_service = OrderWebhookService(db)
        order = webhook_service.process_order_webhook(payload)
        
        return {
            "status": "success",
            "order_id": order.id,
            "message": "Order processed and supplier tasks created"
        }
    except Exception as e:
        logger.error(f"Error processing order webhook: {str(e)}")
        raise HTTPException(status_code=400, detail="Error processing webhook")

# Supplier task endpoints
@router.get("/{order_id}/supplier-tasks", response_model=List[SupplierOrderTaskResponse])
async def get_order_supplier_tasks(
    order_id: str,
    db: Session = Depends(get_db)
):
    """Get supplier tasks for a specific order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    task_service = OrderTaskService(db)
    tasks = task_service.get_supplier_tasks(order_id=order_id)
    return tasks

@router.post("/{order_id}/supplier-tasks", response_model=SupplierOrderTaskResponse)
async def create_supplier_task(
    order_id: str,
    task_data: SupplierOrderTaskCreate,
    db: Session = Depends(get_db)
):
    """Create a new supplier task for an order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        task_service = OrderTaskService(db)
        task_data.order_id = order_id  # Ensure order_id matches URL
        task = task_service._create_supplier_task(task_data)
        db.commit()
        return task
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating supplier task: {str(e)}")
        raise HTTPException(status_code=400, detail="Error creating supplier task")

@router.get("/supplier-tasks", response_model=List[SupplierOrderTaskResponse])
async def get_supplier_tasks(
    status: Optional[SupplierTaskStatus] = Query(None),
    supplier_sku: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get supplier tasks with filtering"""
    task_service = OrderTaskService(db)
    tasks = task_service.get_supplier_tasks(
        status=status,
        supplier_sku=supplier_sku,
        limit=limit,
        offset=skip
    )
    return tasks

@router.put("/supplier-tasks/{task_id}", response_model=SupplierOrderTaskResponse)
async def update_supplier_task(
    task_id: str,
    task_data: SupplierOrderTaskUpdate,
    db: Session = Depends(get_db)
):
    """Update a supplier task"""
    task_service = OrderTaskService(db)
    task = task_service.update_supplier_task(task_id, task_data)
    
    if not task:
        raise HTTPException(status_code=404, detail="Supplier task not found")
    
    try:
        db.commit()
        return task
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating supplier task {task_id}: {str(e)}")
        raise HTTPException(status_code=400, detail="Error updating supplier task")

@router.get("/supplier-tasks/{task_id}", response_model=SupplierOrderTaskResponse)
async def get_supplier_task(
    task_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific supplier task"""
    task = db.query(SupplierOrderTask).filter(SupplierOrderTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Supplier task not found")
    return task

# Export endpoints
@router.post("/supplier-tasks/export-csv")
async def export_supplier_tasks_csv(
    task_ids: List[str],
    db: Session = Depends(get_db)
):
    """Export supplier tasks to CSV"""
    try:
        task_service = OrderTaskService(db)
        csv_content = task_service.export_tasks_to_csv(task_ids)
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=supplier_tasks.csv"}
        )
    except Exception as e:
        logger.error(f"Error exporting CSV: {str(e)}")
        raise HTTPException(status_code=400, detail="Error exporting CSV")

@router.post("/supplier-tasks/generate-panel-url")
async def generate_supplier_panel_url(
    task_ids: List[str],
    base_url: Optional[str] = Query("https://supplier-panel.example.com"),
    db: Session = Depends(get_db)
):
    """Generate secure URL for supplier panel"""
    try:
        task_service = OrderTaskService(db)
        panel_url = task_service.generate_supplier_panel_url(task_ids, base_url)
        
        return {
            "panel_url": panel_url,
            "task_count": len(task_ids),
            "expires_in": "24h"  # Would be configurable
        }
    except Exception as e:
        logger.error(f"Error generating panel URL: {str(e)}")
        raise HTTPException(status_code=400, detail="Error generating panel URL")

# Bulk operations
@router.post("/supplier-tasks/bulk-update")
async def bulk_update_supplier_tasks(
    task_ids: List[str],
    update_data: SupplierOrderTaskUpdate,
    db: Session = Depends(get_db)
):
    """Bulk update supplier tasks"""
    try:
        task_service = OrderTaskService(db)
        updated_tasks = []
        
        for task_id in task_ids:
            task = task_service.update_supplier_task(task_id, update_data)
            if task:
                updated_tasks.append(task)
        
        db.commit()
        
        return {
            "updated_count": len(updated_tasks),
            "total_requested": len(task_ids),
            "tasks": updated_tasks
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error bulk updating tasks: {str(e)}")
        raise HTTPException(status_code=400, detail="Error bulk updating tasks")