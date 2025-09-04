from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import logging
import csv
import io

from ..domain.models import Order, SupplierOrderTask, Product, SupplierTaskStatus
from ..schemas.orders import (
    SupplierOrderTaskCreate,
    SupplierOrderTaskUpdate,
    SupplierOrderTaskResponse,
    OrderWebhookPayload,
    SupplierTaskCSVRow
)

logger = logging.getLogger(__name__)

class OrderTaskService:
    """Service for managing supplier order tasks"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_supplier_tasks_from_order(self, order: Order) -> List[SupplierOrderTask]:
        """Create supplier tasks from an order"""
        try:
            supplier_tasks = []
            
            # Group order items by supplier
            supplier_groups = self._group_items_by_supplier(order)
            
            for supplier_info, items in supplier_groups.items():
                for item in items:
                    # Get product to extract supplier SKU
                    product = self.db.query(Product).filter(Product.id == item.product_id).first()
                    if not product:
                        logger.warning(f"Product {item.product_id} not found for order {order.id}")
                        continue
                    
                    # Create supplier task
                    task_data = SupplierOrderTaskCreate(
                        order_id=order.id,
                        supplier_sku=product.sku,  # Use product SKU as supplier SKU for now
                        quantity=item.quantity,
                        unit_price=item.unit_price,
                        total_price=item.total_price,
                        status=SupplierTaskStatus.CREATED,
                        
                        # Extract shipping info from order
                        shipping_name=order.customer_name,
                        shipping_address=self._extract_shipping_address(order),
                        
                        # Supplier info (would come from product/supplier mapping)
                        supplier_name=supplier_info.get('name'),
                        supplier_email=supplier_info.get('email'),
                        supplier_phone=supplier_info.get('phone'),
                        
                        notes=f"Auto-generated from order {order.order_number}"
                    )
                    
                    supplier_task = self._create_supplier_task(task_data)
                    supplier_tasks.append(supplier_task)
            
            # Log audit trail
            self._log_audit_event(
                order_id=order.id,
                event_type="supplier_tasks_created",
                details={
                    "tasks_count": len(supplier_tasks),
                    "order_number": order.order_number
                }
            )
            
            return supplier_tasks
            
        except Exception as e:
            logger.error(f"Error creating supplier tasks for order {order.id}: {str(e)}")
            raise
    
    def _group_items_by_supplier(self, order: Order) -> Dict[tuple, List]:
        """Group order items by supplier (simplified - assumes one supplier per order)"""
        # For now, assume all items go to the same supplier
        # In a real implementation, this would query supplier mappings
        default_supplier = {
            'name': 'Default Supplier',
            'email': 'supplier@example.com',
            'phone': None
        }
        
        return {tuple(default_supplier.items()): order.items}
    
    def _extract_shipping_address(self, order: Order) -> Optional[str]:
        """Extract shipping address from order external data"""
        if order.external_data and 'shipping_address' in order.external_data:
            addr = order.external_data['shipping_address']
            return f"{addr.get('street', '')}, {addr.get('city', '')}, {addr.get('state', '')} {addr.get('zip', '')}"
        return None
    
    def _create_supplier_task(self, task_data: SupplierOrderTaskCreate) -> SupplierOrderTask:
        """Create a new supplier task"""
        supplier_task = SupplierOrderTask(**task_data.dict())
        self.db.add(supplier_task)
        self.db.flush()  # Get ID without committing
        return supplier_task
    
    def get_supplier_tasks(
        self,
        order_id: Optional[str] = None,
        status: Optional[SupplierTaskStatus] = None,
        supplier_sku: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[SupplierOrderTask]:
        """Get supplier tasks with filters"""
        query = self.db.query(SupplierOrderTask)
        
        if order_id:
            query = query.filter(SupplierOrderTask.order_id == order_id)
        if status:
            query = query.filter(SupplierOrderTask.status == status)
        if supplier_sku:
            query = query.filter(SupplierOrderTask.supplier_sku.ilike(f"%{supplier_sku}%"))
        
        return query.offset(offset).limit(limit).all()
    
    def update_supplier_task(
        self,
        task_id: str,
        update_data: SupplierOrderTaskUpdate
    ) -> Optional[SupplierOrderTask]:
        """Update a supplier task"""
        task = self.db.query(SupplierOrderTask).filter(SupplierOrderTask.id == task_id).first()
        if not task:
            return None
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(task, field, value)
        
        # Set timestamp fields based on status
        if update_data.status:
            now = datetime.utcnow()
            if update_data.status == SupplierTaskStatus.SENT:
                task.sent_at = now
            elif update_data.status == SupplierTaskStatus.CONFIRMED:
                task.confirmed_at = now
            elif update_data.status == SupplierTaskStatus.CANCELLED:
                task.cancelled_at = now
        
        self.db.flush()
        return task
    
    def export_tasks_to_csv(self, task_ids: List[str]) -> str:
        """Export supplier tasks to CSV format"""
        tasks = self.db.query(SupplierOrderTask).filter(
            SupplierOrderTask.id.in_(task_ids)
        ).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Task ID', 'Order Number', 'Supplier SKU', 'Quantity',
            'Supplier Name', 'Supplier Email', 'Shipping Name',
            'Shipping Address', 'Shipping City', 'Shipping State',
            'Shipping ZIP', 'Status', 'Created At', 'Notes'
        ])
        
        # Write data rows
        for task in tasks:
            writer.writerow([
                task.id,
                task.order.order_number if task.order else '',
                task.supplier_sku,
                task.quantity,
                task.supplier_name or '',
                task.supplier_email or '',
                task.shipping_name or '',
                task.shipping_address or '',
                task.shipping_city or '',
                task.shipping_state or '',
                task.shipping_zip or '',
                task.status.value,
                task.created_at.isoformat() if task.created_at else '',
                task.notes or ''
            ])
        
        return output.getvalue()
    
    def generate_supplier_panel_url(
        self,
        task_ids: List[str],
        base_url: str = "https://supplier-panel.example.com"
    ) -> str:
        """Generate secure URL for supplier panel with task parameters"""
        # In a real implementation, this would:
        # 1. Create a signed token with task IDs
        # 2. Set expiration time
        # 3. Include supplier authentication
        
        import urllib.parse
        
        params = {
            'tasks': ','.join(task_ids),
            'timestamp': datetime.utcnow().isoformat(),
            # 'signature': self._sign_params(params)  # Would implement signing
        }
        
        query_string = urllib.parse.urlencode(params)
        return f"{base_url}/tasks?{query_string}"
    
    def _log_audit_event(self, order_id: str, event_type: str, details: Dict[str, Any]):
        """Log audit events for compliance"""
        # In a real implementation, this would write to an audit log table
        logger.info(
            f"Audit Event: {event_type}",
            extra={
                'order_id': order_id,
                'event_type': event_type,
                'details': details,
                'timestamp': datetime.utcnow().isoformat()
            }
        )

class OrderWebhookService:
    """Service for handling order webhooks"""
    
    def __init__(self, db: Session):
        self.db = db
        self.order_task_service = OrderTaskService(db)
    
    def process_order_webhook(self, payload: OrderWebhookPayload) -> Order:
        """Process incoming order webhook and create supplier tasks"""
        try:
            # Create or update order
            order = self._create_or_update_order(payload)
            
            # Create supplier tasks
            supplier_tasks = self.order_task_service.create_supplier_tasks_from_order(order)
            
            # Commit transaction
            self.db.commit()
            
            logger.info(
                f"Processed order webhook: {payload.order_number}, "
                f"created {len(supplier_tasks)} supplier tasks"
            )
            
            return order
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error processing order webhook: {str(e)}")
            raise
    
    def _create_or_update_order(self, payload: OrderWebhookPayload) -> Order:
        """Create or update order from webhook payload"""
        # Check if order already exists
        existing_order = self.db.query(Order).filter(
            Order.external_id == payload.order_id
        ).first()
        
        if existing_order:
            # Update existing order
            existing_order.customer_name = payload.customer_name
            existing_order.customer_email = payload.customer_email
            existing_order.customer_phone = payload.customer_phone
            existing_order.total_amount = payload.total_amount
            existing_order.shipping_cost = payload.shipping_cost
            existing_order.discount_amount = payload.discount_amount
            existing_order.external_data = payload.external_data
            return existing_order
        
        # Create new order
        # Note: This assumes integration_id is available or can be determined
        # In a real implementation, you'd map integration_source to integration_id
        order = Order(
            order_number=payload.order_number,
            customer_name=payload.customer_name,
            customer_email=payload.customer_email,
            customer_phone=payload.customer_phone,
            total_amount=payload.total_amount,
            shipping_cost=payload.shipping_cost,
            discount_amount=payload.discount_amount,
            external_id=payload.order_id,
            external_data=payload.external_data,
            integration_id="default-integration-id"  # Would be determined dynamically
        )
        
        self.db.add(order)
        self.db.flush()  # Get ID
        
        # Create order items (simplified)
        # In a real implementation, you'd create OrderItem records
        
        return order