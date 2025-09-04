from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

class SupplierTaskStatus(str, Enum):
    """Supplier task status enumeration"""
    CREATED = "created"
    SENT = "sent"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

class OrderStatus(str, Enum):
    """Order status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"

# Base schemas
class SupplierOrderTaskBase(BaseModel):
    """Base schema for supplier order tasks"""
    supplier_sku: str = Field(..., description="SKU from supplier")
    quantity: int = Field(..., gt=0, description="Quantity to order")
    unit_price: Optional[float] = Field(None, description="Unit price")
    total_price: Optional[float] = Field(None, description="Total price")
    status: SupplierTaskStatus = Field(default=SupplierTaskStatus.CREATED)
    
    # Shipping address
    shipping_name: Optional[str] = Field(None, description="Shipping recipient name")
    shipping_address: Optional[str] = Field(None, description="Shipping address")
    shipping_city: Optional[str] = Field(None, description="Shipping city")
    shipping_state: Optional[str] = Field(None, description="Shipping state")
    shipping_zip: Optional[str] = Field(None, description="Shipping ZIP code")
    shipping_country: Optional[str] = Field(None, description="Shipping country")
    
    # Supplier information
    supplier_name: Optional[str] = Field(None, description="Supplier name")
    supplier_email: Optional[str] = Field(None, description="Supplier email")
    supplier_phone: Optional[str] = Field(None, description="Supplier phone")
    
    notes: Optional[str] = Field(None, description="Additional notes")

class SupplierOrderTaskCreate(SupplierOrderTaskBase):
    """Schema for creating supplier order tasks"""
    order_id: str = Field(..., description="Associated order ID")

class SupplierOrderTaskUpdate(BaseModel):
    """Schema for updating supplier order tasks"""
    status: Optional[SupplierTaskStatus] = None
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    notes: Optional[str] = None
    external_task_id: Optional[str] = None

class SupplierOrderTaskResponse(SupplierOrderTaskBase):
    """Schema for supplier order task responses"""
    id: str
    order_id: str
    external_task_id: Optional[str] = None
    sent_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Order schemas
class OrderBase(BaseModel):
    """Base schema for orders"""
    order_number: str = Field(..., description="Order number")
    customer_name: str = Field(..., description="Customer name")
    customer_email: Optional[str] = Field(None, description="Customer email")
    customer_phone: Optional[str] = Field(None, description="Customer phone")
    customer_document: Optional[str] = Field(None, description="Customer document")
    status: OrderStatus = Field(default=OrderStatus.PENDING)
    total_amount: float = Field(..., description="Total order amount")
    shipping_cost: float = Field(default=0, description="Shipping cost")
    discount_amount: float = Field(default=0, description="Discount amount")
    notes: Optional[str] = Field(None, description="Order notes")

class OrderCreate(OrderBase):
    """Schema for creating orders"""
    integration_id: str = Field(..., description="Integration ID")
    external_id: Optional[str] = Field(None, description="External platform ID")
    external_data: Optional[dict] = Field(None, description="External platform data")

class OrderUpdate(BaseModel):
    """Schema for updating orders"""
    status: Optional[OrderStatus] = None
    notes: Optional[str] = None
    is_synced: Optional[bool] = None

class OrderResponse(OrderBase):
    """Schema for order responses"""
    id: str
    integration_id: str
    external_id: Optional[str] = None
    external_data: Optional[dict] = None
    is_synced: bool = False
    last_sync: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    supplier_tasks: List[SupplierOrderTaskResponse] = []
    
    class Config:
        from_attributes = True

# Webhook schemas
class OrderWebhookPayload(BaseModel):
    """Schema for order webhook payloads"""
    order_id: str = Field(..., description="External order ID")
    order_number: str = Field(..., description="Order number")
    customer_name: str = Field(..., description="Customer name")
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    total_amount: float = Field(..., description="Total amount")
    shipping_cost: float = Field(default=0)
    discount_amount: float = Field(default=0)
    items: List[dict] = Field(..., description="Order items")
    shipping_address: Optional[dict] = None
    integration_source: str = Field(..., description="Source integration")
    external_data: Optional[dict] = None

# CSV Export schemas
class SupplierTaskCSVRow(BaseModel):
    """Schema for CSV export rows"""
    task_id: str
    order_number: str
    supplier_sku: str
    quantity: int
    supplier_name: Optional[str]
    supplier_email: Optional[str]
    shipping_name: Optional[str]
    shipping_address: Optional[str]
    shipping_city: Optional[str]
    shipping_state: Optional[str]
    shipping_zip: Optional[str]
    status: str
    created_at: str
    notes: Optional[str]