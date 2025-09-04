from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc

from app.domain.models import (
    Plan, Subscription, UsageRecord, Payment, Invoice,
    PlanStatus, SubscriptionStatus, PaymentStatus, InvoiceStatus,
    UsageMetric, Tenant
)
from app.schemas.billing import (
    PlanCreate, PlanUpdate, PlanResponse,
    SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse,
    UsageRecordCreate, UsageRecordResponse,
    PaymentResponse, InvoiceResponse
)
from app.core.exceptions import NotFoundError, ValidationError
from app.core.config import settings

import stripe
from stripe.error import StripeError

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

class BillingService:
    """Service for managing billing operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Plan Management
    async def create_plan(self, plan_data: PlanCreate) -> Plan:
        """Create a new billing plan"""
        # Check if plan name already exists
        existing_plan = self.db.query(Plan).filter(Plan.name == plan_data.name).first()
        if existing_plan:
            raise ValidationError(f"Plan with name '{plan_data.name}' already exists")
        
        # Create Stripe price if needed
        stripe_price_id = None
        if plan_data.price_cents > 0:
            try:
                stripe_price = stripe.Price.create(
                    unit_amount=plan_data.price_cents,
                    currency="usd",
                    recurring={"interval": plan_data.interval.value},
                    product_data={"name": plan_data.name}
                )
                stripe_price_id = stripe_price.id
            except StripeError as e:
                raise ValidationError(f"Failed to create Stripe price: {str(e)}")
        
        plan = Plan(
            name=plan_data.name,
            description=plan_data.description,
            price_cents=plan_data.price_cents,
            interval=plan_data.interval,
            trial_days=plan_data.trial_days,
            features=plan_data.features or {},
            quotas=plan_data.quotas or {},
            is_popular=plan_data.is_popular,
            sort_order=plan_data.sort_order,
            stripe_price_id=stripe_price_id
        )
        
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return plan
    
    async def get_plan(self, plan_id: str) -> Plan:
        """Get plan by ID"""
        plan = self.db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            raise NotFoundError(f"Plan with ID {plan_id} not found")
        return plan
    
    async def list_plans(self, active_only: bool = True) -> List[Plan]:
        """List all plans"""
        query = self.db.query(Plan)
        if active_only:
            query = query.filter(Plan.status == PlanStatus.ACTIVE)
        return query.order_by(Plan.sort_order, Plan.price_cents).all()
    
    async def update_plan(self, plan_id: str, plan_data: PlanUpdate) -> Plan:
        """Update a plan"""
        plan = await self.get_plan(plan_id)
        
        for field, value in plan_data.dict(exclude_unset=True).items():
            setattr(plan, field, value)
        
        self.db.commit()
        self.db.refresh(plan)
        return plan
    
    # Subscription Management
    async def create_subscription(self, tenant_id: str, subscription_data: SubscriptionCreate) -> Subscription:
        """Create a new subscription"""
        # Check if tenant already has an active subscription
        existing_sub = self.db.query(Subscription).filter(
            and_(
                Subscription.tenant_id == tenant_id,
                Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING])
            )
        ).first()
        
        if existing_sub:
            raise ValidationError("Tenant already has an active subscription")
        
        # Get plan
        plan = await self.get_plan(subscription_data.plan_id)
        
        # Create Stripe subscription if plan has a price
        stripe_subscription_id = None
        stripe_customer_id = subscription_data.stripe_customer_id
        
        if plan.stripe_price_id:
            try:
                stripe_subscription = stripe.Subscription.create(
                    customer=stripe_customer_id,
                    items=[{"price": plan.stripe_price_id}],
                    trial_period_days=plan.trial_days if plan.trial_days > 0 else None
                )
                stripe_subscription_id = stripe_subscription.id
            except StripeError as e:
                raise ValidationError(f"Failed to create Stripe subscription: {str(e)}")
        
        # Calculate trial and period dates
        now = datetime.utcnow()
        trial_start = now if plan.trial_days > 0 else None
        trial_end = now + timedelta(days=plan.trial_days) if plan.trial_days > 0 else None
        
        subscription = Subscription(
            tenant_id=tenant_id,
            plan_id=subscription_data.plan_id,
            stripe_subscription_id=stripe_subscription_id,
            stripe_customer_id=stripe_customer_id,
            status=SubscriptionStatus.TRIALING if plan.trial_days > 0 else SubscriptionStatus.ACTIVE,
            trial_start=trial_start,
            trial_end=trial_end,
            current_period_start=now,
            current_period_end=now + timedelta(days=30)  # Default to monthly
        )
        
        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)
        return subscription
    
    async def get_subscription(self, subscription_id: str) -> Subscription:
        """Get subscription by ID"""
        subscription = self.db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not subscription:
            raise NotFoundError(f"Subscription with ID {subscription_id} not found")
        return subscription
    
    async def get_tenant_subscription(self, tenant_id: str) -> Optional[Subscription]:
        """Get active subscription for tenant"""
        return self.db.query(Subscription).filter(
            and_(
                Subscription.tenant_id == tenant_id,
                Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING])
            )
        ).first()
    
    async def cancel_subscription(self, subscription_id: str) -> Subscription:
        """Cancel a subscription"""
        subscription = await self.get_subscription(subscription_id)
        
        # Cancel in Stripe if exists
        if subscription.stripe_subscription_id:
            try:
                stripe.Subscription.delete(subscription.stripe_subscription_id)
            except StripeError as e:
                raise ValidationError(f"Failed to cancel Stripe subscription: {str(e)}")
        
        subscription.status = SubscriptionStatus.CANCELED
        subscription.canceled_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(subscription)
        return subscription
    
    # Usage Tracking
    async def record_usage(self, tenant_id: str, usage_data: UsageRecordCreate) -> UsageRecord:
        """Record usage for a tenant"""
        # Get active subscription
        subscription = await self.get_tenant_subscription(tenant_id)
        if not subscription:
            raise ValidationError("No active subscription found for tenant")
        
        usage_record = UsageRecord(
            tenant_id=tenant_id,
            subscription_id=subscription.id,
            metric=usage_data.metric,
            quantity=usage_data.quantity,
            metadata=usage_data.metadata or {}
        )
        
        self.db.add(usage_record)
        self.db.commit()
        self.db.refresh(usage_record)
        return usage_record
    
    async def get_usage_summary(self, tenant_id: str, metric: UsageMetric, 
                               start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get usage summary for a tenant and metric"""
        usage_records = self.db.query(UsageRecord).filter(
            and_(
                UsageRecord.tenant_id == tenant_id,
                UsageRecord.metric == metric,
                UsageRecord.timestamp >= start_date,
                UsageRecord.timestamp <= end_date
            )
        ).all()
        
        total_usage = sum(record.quantity for record in usage_records)
        
        return {
            "metric": metric.value,
            "total_usage": total_usage,
            "period_start": start_date,
            "period_end": end_date,
            "records_count": len(usage_records)
        }
    
    # Feature Flag Management
    async def check_feature_access(self, tenant_id: str, feature_name: str) -> bool:
        """Check if tenant has access to a feature"""
        subscription = await self.get_tenant_subscription(tenant_id)
        if not subscription:
            return False
        
        plan = subscription.plan
        features = plan.features or {}
        return features.get(feature_name, False)
    
    async def check_quota_limit(self, tenant_id: str, quota_name: str, current_usage: int) -> Dict[str, Any]:
        """Check if tenant is within quota limits"""
        subscription = await self.get_tenant_subscription(tenant_id)
        if not subscription:
            return {"allowed": False, "reason": "No active subscription"}
        
        plan = subscription.plan
        quotas = plan.quotas or {}
        quota_limit = quotas.get(quota_name)
        
        if quota_limit is None:
            return {"allowed": True, "unlimited": True}
        
        if current_usage >= quota_limit:
            return {
                "allowed": False,
                "reason": f"Quota limit exceeded: {current_usage}/{quota_limit}",
                "current_usage": current_usage,
                "limit": quota_limit
            }
        
        return {
            "allowed": True,
            "current_usage": current_usage,
            "limit": quota_limit,
            "remaining": quota_limit - current_usage
        }
    
    # Webhook Handling
    async def handle_stripe_webhook(self, event_type: str, event_data: Dict[str, Any]) -> None:
        """Handle Stripe webhook events"""
        if event_type == "invoice.payment_succeeded":
            await self._handle_payment_succeeded(event_data)
        elif event_type == "invoice.payment_failed":
            await self._handle_payment_failed(event_data)
        elif event_type == "customer.subscription.updated":
            await self._handle_subscription_updated(event_data)
        elif event_type == "customer.subscription.deleted":
            await self._handle_subscription_deleted(event_data)
    
    async def _handle_payment_succeeded(self, event_data: Dict[str, Any]) -> None:
        """Handle successful payment"""
        stripe_subscription_id = event_data.get("subscription")
        if not stripe_subscription_id:
            return
        
        subscription = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        
        if subscription:
            subscription.status = SubscriptionStatus.ACTIVE
            self.db.commit()
    
    async def _handle_payment_failed(self, event_data: Dict[str, Any]) -> None:
        """Handle failed payment"""
        stripe_subscription_id = event_data.get("subscription")
        if not stripe_subscription_id:
            return
        
        subscription = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        
        if subscription:
            subscription.status = SubscriptionStatus.PAST_DUE
            self.db.commit()
    
    async def _handle_subscription_updated(self, event_data: Dict[str, Any]) -> None:
        """Handle subscription update"""
        stripe_subscription_id = event_data.get("id")
        if not stripe_subscription_id:
            return
        
        subscription = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        
        if subscription:
            # Update subscription details from Stripe data
            subscription.status = SubscriptionStatus(event_data.get("status", subscription.status))
            subscription.current_period_start = datetime.fromtimestamp(event_data.get("current_period_start", 0))
            subscription.current_period_end = datetime.fromtimestamp(event_data.get("current_period_end", 0))
            self.db.commit()
    
    async def _handle_subscription_deleted(self, event_data: Dict[str, Any]) -> None:
        """Handle subscription deletion"""
        stripe_subscription_id = event_data.get("id")
        if not stripe_subscription_id:
            return
        
        subscription = self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        
        if subscription:
            subscription.status = SubscriptionStatus.CANCELED
            subscription.canceled_at = datetime.utcnow()
            subscription.ended_at = datetime.utcnow()
            self.db.commit()