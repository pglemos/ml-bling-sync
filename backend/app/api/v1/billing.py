from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenant import get_current_tenant, require_tenant
from app.core.auth import get_current_user
from app.domain.models import User, UsageMetric
from app.schemas.billing import (
    PlanCreate, PlanUpdate, PlanResponse,
    SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse,
    UsageRecordCreate, UsageRecordResponse,
    PaymentResponse, InvoiceResponse,
    FeatureFlagResponse, QuotaCheckResponse,
    StripeWebhookEvent, BillingPortalSessionResponse,
    CheckoutSessionCreate, CheckoutSessionResponse
)
from app.services.billing_service import BillingService
from app.core.exceptions import NotFoundError, ValidationError
from app.core.config import settings

import stripe
from stripe.error import StripeError

router = APIRouter()

# Plan Management (Admin only)
@router.post("/plans", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    plan_data: PlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new billing plan (Admin only)"""
    # TODO: Add admin role check
    billing_service = BillingService(db)
    plan = await billing_service.create_plan(plan_data)
    return plan

@router.get("/plans", response_model=List[PlanResponse])
async def list_plans(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List all available plans"""
    billing_service = BillingService(db)
    plans = await billing_service.list_plans(active_only=active_only)
    return plans

@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: str,
    db: Session = Depends(get_db)
):
    """Get plan details"""
    billing_service = BillingService(db)
    try:
        plan = await billing_service.get_plan(plan_id)
        return plan
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put("/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: str,
    plan_data: PlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a plan (Admin only)"""
    # TODO: Add admin role check
    billing_service = BillingService(db)
    try:
        plan = await billing_service.update_plan(plan_id, plan_data)
        return plan
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

# Subscription Management
@router.post("/subscriptions", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """Create a new subscription for the current tenant"""
    billing_service = BillingService(db)
    try:
        subscription = await billing_service.create_subscription(tenant_id, subscription_data)
        return subscription
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/subscriptions/current", response_model=Optional[SubscriptionResponse])
async def get_current_subscription(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant)
):
    """Get current subscription for the tenant"""
    billing_service = BillingService(db)
    subscription = await billing_service.get_tenant_subscription(tenant_id)
    return subscription

@router.delete("/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
async def cancel_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """Cancel a subscription"""
    billing_service = BillingService(db)
    try:
        # Verify subscription belongs to tenant
        subscription = await billing_service.get_subscription(subscription_id)
        if subscription.tenant_id != tenant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        subscription = await billing_service.cancel_subscription(subscription_id)
        return subscription
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# Usage Tracking
@router.post("/usage", response_model=UsageRecordResponse, status_code=status.HTTP_201_CREATED)
async def record_usage(
    usage_data: UsageRecordCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant)
):
    """Record usage for the current tenant"""
    billing_service = BillingService(db)
    try:
        usage_record = await billing_service.record_usage(tenant_id, usage_data)
        return usage_record
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/usage/{metric}/summary")
async def get_usage_summary(
    metric: UsageMetric,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant)
):
    """Get usage summary for a metric"""
    if not start_date:
        start_date = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if not end_date:
        end_date = datetime.utcnow()
    
    billing_service = BillingService(db)
    summary = await billing_service.get_usage_summary(tenant_id, metric, start_date, end_date)
    return summary

# Feature Flags and Quotas
@router.get("/features/{feature_name}", response_model=FeatureFlagResponse)
async def check_feature_access(
    feature_name: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant)
):
    """Check if tenant has access to a feature"""
    billing_service = BillingService(db)
    has_access = await billing_service.check_feature_access(tenant_id, feature_name)
    return FeatureFlagResponse(feature_name=feature_name, enabled=has_access)

@router.get("/quotas/{quota_name}/check", response_model=QuotaCheckResponse)
async def check_quota_limit(
    quota_name: str,
    current_usage: int,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant)
):
    """Check if tenant is within quota limits"""
    billing_service = BillingService(db)
    quota_check = await billing_service.check_quota_limit(tenant_id, quota_name, current_usage)
    return QuotaCheckResponse(
        quota_name=quota_name,
        allowed=quota_check["allowed"],
        current_usage=quota_check.get("current_usage", current_usage),
        limit=quota_check.get("limit"),
        remaining=quota_check.get("remaining"),
        reason=quota_check.get("reason")
    )

# Stripe Integration
@router.post("/checkout/sessions", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    checkout_data: CheckoutSessionCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """Create a Stripe checkout session"""
    billing_service = BillingService(db)
    
    try:
        # Get plan details
        plan = await billing_service.get_plan(checkout_data.plan_id)
        
        if not plan.stripe_price_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Plan does not support online payments"
            )
        
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price": plan.stripe_price_id,
                "quantity": 1,
            }],
            mode="subscription",
            success_url=checkout_data.success_url,
            cancel_url=checkout_data.cancel_url,
            client_reference_id=tenant_id,
            metadata={
                "tenant_id": tenant_id,
                "plan_id": checkout_data.plan_id
            }
        )
        
        return CheckoutSessionResponse(
            session_id=checkout_session.id,
            url=checkout_session.url
        )
    
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except StripeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Stripe error: {str(e)}")

@router.post("/portal/sessions", response_model=BillingPortalSessionResponse)
async def create_billing_portal_session(
    return_url: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user)
):
    """Create a Stripe billing portal session"""
    billing_service = BillingService(db)
    
    try:
        # Get current subscription
        subscription = await billing_service.get_tenant_subscription(tenant_id)
        if not subscription or not subscription.stripe_customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active subscription found"
            )
        
        # Create billing portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=subscription.stripe_customer_id,
            return_url=return_url
        )
        
        return BillingPortalSessionResponse(url=portal_session.url)
    
    except StripeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Stripe error: {str(e)}")

# Webhooks
@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")
    
    billing_service = BillingService(db)
    await billing_service.handle_stripe_webhook(event["type"], event["data"]["object"])
    
    return {"status": "success"}