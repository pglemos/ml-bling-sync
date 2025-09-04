from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from enum import Enum

class PlanInterval(str, Enum):
    MONTH = "month"
    YEAR = "year"

class PlanStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"
    PAST_DUE = "past_due"
    TRIALING = "trialing"
    UNPAID = "unpaid"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"
    REFUNDED = "refunded"

# Plan Schemas
class PlanFeatures(BaseModel):
    api_access: bool = True
    bulk_operations: bool = False
    advanced_reporting: bool = False
    custom_branding: bool = False
    webhook_notifications: bool = False
    priority_support: bool = False
    data_export: bool = True
    multi_user: bool = False
    integrations_limit: int = 1
    products_limit: int = 1000
    orders_limit: int = 1000
    api_calls_limit: int = 10000
    storage_limit_gb: int = 1
    
class PlanQuotas(BaseModel):
    integrations: int = 1
    products: int = 1000
    orders_per_month: int = 1000
    api_calls_per_month: int = 10000
    storage_gb: int = 1
    users: int = 1
    webhooks: int = 0
    
class PlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price_cents: int = Field(..., ge=0)
    interval: PlanInterval
    trial_days: int = Field(0, ge=0, le=365)
    features: PlanFeatures
    quotas: PlanQuotas
    stripe_price_id: Optional[str] = None
    is_popular: bool = False
    sort_order: int = 0
    
class PlanCreate(PlanBase):
    pass
    
class PlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price_cents: Optional[int] = Field(None, ge=0)
    trial_days: Optional[int] = Field(None, ge=0, le=365)
    features: Optional[PlanFeatures] = None
    quotas: Optional[PlanQuotas] = None
    is_popular: Optional[bool] = None
    sort_order: Optional[int] = None
    status: Optional[PlanStatus] = None
    
class PlanResponse(PlanBase):
    id: str
    status: PlanStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        
class PlanList(BaseModel):
    plans: List[PlanResponse]
    total: int
    
# Subscription Schemas
class SubscriptionBase(BaseModel):
    tenant_id: str
    plan_id: str
    stripe_subscription_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    
class SubscriptionCreate(SubscriptionBase):
    payment_method_id: Optional[str] = None
    
class SubscriptionUpdate(BaseModel):
    plan_id: Optional[str] = None
    status: Optional[SubscriptionStatus] = None
    
class SubscriptionResponse(SubscriptionBase):
    id: str
    status: SubscriptionStatus
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related data
    plan: Optional[PlanResponse] = None
    
    class Config:
        from_attributes = True
        
# Usage Tracking Schemas
class UsageMetric(str, Enum):
    API_CALLS = "api_calls"
    PRODUCTS_SYNCED = "products_synced"
    ORDERS_PROCESSED = "orders_processed"
    STORAGE_USED = "storage_used"
    INTEGRATIONS_ACTIVE = "integrations_active"
    USERS_ACTIVE = "users_active"
    WEBHOOKS_SENT = "webhooks_sent"
    
class UsageRecord(BaseModel):
    tenant_id: str
    subscription_id: str
    metric: UsageMetric
    quantity: int = Field(..., ge=0)
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
    
class UsageRecordCreate(BaseModel):
    metric: UsageMetric
    quantity: int = Field(..., ge=0)
    metadata: Optional[Dict[str, Any]] = None
    
class UsageRecordResponse(UsageRecord):
    id: str
    
    class Config:
        from_attributes = True
        
class UsageSummary(BaseModel):
    tenant_id: str
    subscription_id: str
    period_start: datetime
    period_end: datetime
    metrics: Dict[UsageMetric, int]
    quotas: Dict[UsageMetric, int]
    overages: Dict[UsageMetric, int]
    
# Payment Schemas
class PaymentBase(BaseModel):
    tenant_id: str
    subscription_id: str
    amount_cents: int = Field(..., ge=0)
    currency: str = Field("usd", min_length=3, max_length=3)
    stripe_payment_intent_id: Optional[str] = None
    
class PaymentCreate(PaymentBase):
    payment_method_id: Optional[str] = None
    
class PaymentResponse(PaymentBase):
    id: str
    status: PaymentStatus
    failure_reason: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        
# Invoice Schemas
class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    OPEN = "open"
    PAID = "paid"
    VOID = "void"
    UNCOLLECTIBLE = "uncollectible"
    
class InvoiceLineItem(BaseModel):
    description: str
    quantity: int = 1
    unit_amount_cents: int
    total_amount_cents: int
    
class InvoiceBase(BaseModel):
    tenant_id: str
    subscription_id: str
    invoice_number: str
    subtotal_cents: int = Field(..., ge=0)
    tax_cents: int = Field(0, ge=0)
    total_cents: int = Field(..., ge=0)
    currency: str = Field("usd", min_length=3, max_length=3)
    stripe_invoice_id: Optional[str] = None
    
class InvoiceCreate(InvoiceBase):
    line_items: List[InvoiceLineItem]
    
class InvoiceResponse(InvoiceBase):
    id: str
    status: InvoiceStatus
    line_items: List[InvoiceLineItem]
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        
# Webhook Schemas
class WebhookEventType(str, Enum):
    SUBSCRIPTION_CREATED = "subscription.created"
    SUBSCRIPTION_UPDATED = "subscription.updated"
    SUBSCRIPTION_DELETED = "subscription.deleted"
    PAYMENT_SUCCEEDED = "payment.succeeded"
    PAYMENT_FAILED = "payment.failed"
    INVOICE_CREATED = "invoice.created"
    INVOICE_PAID = "invoice.paid"
    INVOICE_PAYMENT_FAILED = "invoice.payment_failed"
    
class StripeWebhookEvent(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    created: int
    livemode: bool
    
# Billing Portal Schemas
class BillingPortalSession(BaseModel):
    url: str
    return_url: str
    
class CheckoutSession(BaseModel):
    url: str
    session_id: str
    
class CheckoutSessionCreate(BaseModel):
    plan_id: str
    success_url: str
    cancel_url: str
    trial_days: Optional[int] = None
    
# Feature Flag Schemas
class FeatureFlag(BaseModel):
    name: str
    enabled: bool
    plan_required: Optional[str] = None
    quota_limit: Optional[int] = None
    description: Optional[str] = None
    
class FeatureFlagCheck(BaseModel):
    feature_name: str
    enabled: bool
    quota_used: Optional[int] = None
    quota_limit: Optional[int] = None
    quota_remaining: Optional[int] = None
    plan_required: Optional[str] = None
    current_plan: Optional[str] = None