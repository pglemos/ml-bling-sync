from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.infra.database import get_db
from app.core.auth import get_current_user
from app.core.tenant import require_tenant, get_tenant_branding, get_tenant_context
from app.domain.models import User, Tenant
from app.schemas.tenant import (
    TenantCreate, TenantUpdate, TenantResponse, TenantList,
    TenantStats, TenantBranding, TenantSettings, TenantFeatureFlag
)
from app.services.tenant_service import TenantService

router = APIRouter(prefix="/tenants", tags=["tenants"])

@router.post("/", response_model=TenantResponse)
async def create_tenant(
    tenant_data: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new tenant (admin only)"""
    # TODO: Add admin role check
    
    tenant_service = TenantService(db)
    tenant = tenant_service.create_tenant(tenant_data)
    
    return TenantResponse.from_orm(tenant)

@router.get("/", response_model=TenantList)
async def list_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List tenants with pagination and filtering (admin only)"""
    # TODO: Add admin role check
    
    tenant_service = TenantService(db)
    tenants, total = tenant_service.list_tenants(
        skip=skip,
        limit=limit,
        status=status,
        search=search
    )
    
    pages = (total + limit - 1) // limit
    page = (skip // limit) + 1
    
    return TenantList(
        tenants=[TenantResponse.from_orm(tenant) for tenant in tenants],
        total=total,
        page=page,
        size=limit,
        pages=pages
    )

@router.get("/current", response_model=TenantResponse)
async def get_current_tenant(
    request: Request,
    tenant: Tenant = Depends(require_tenant),
    db: Session = Depends(get_db)
):
    """Get current tenant information"""
    return TenantResponse.from_orm(tenant)

@router.get("/current/branding", response_model=TenantBranding)
async def get_current_tenant_branding(
    request: Request,
    tenant: Tenant = Depends(require_tenant)
):
    """Get current tenant branding information"""
    return get_tenant_branding(tenant)

@router.get("/current/stats", response_model=TenantStats)
async def get_current_tenant_stats(
    request: Request,
    tenant: Tenant = Depends(require_tenant),
    db: Session = Depends(get_db)
):
    """Get current tenant statistics"""
    tenant_service = TenantService(db)
    stats = tenant_service.get_tenant_stats(tenant.id)
    
    if not stats:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return stats

@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tenant by ID (admin only or own tenant)"""
    tenant_service = TenantService(db)
    tenant = tenant_service.get_tenant(tenant_id)
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Check if user can access this tenant
    # TODO: Add admin role check or verify user belongs to tenant
    if current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return TenantResponse.from_orm(tenant)

@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    tenant_data: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update tenant (admin only or own tenant)"""
    tenant_service = TenantService(db)
    
    # Check if user can access this tenant
    # TODO: Add admin role check or verify user belongs to tenant
    if current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant = tenant_service.update_tenant(tenant_id, tenant_data)
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return TenantResponse.from_orm(tenant)

@router.delete("/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete tenant (admin only)"""
    # TODO: Add admin role check
    
    tenant_service = TenantService(db)
    success = tenant_service.delete_tenant(tenant_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": "Tenant deleted successfully"}

@router.put("/current/branding")
async def update_current_tenant_branding(
    branding_data: Dict[str, Any],
    request: Request,
    tenant: Tenant = Depends(require_tenant),
    db: Session = Depends(get_db)
):
    """Update current tenant branding"""
    tenant_service = TenantService(db)
    updated_tenant = tenant_service.update_tenant_branding(tenant.id, branding_data)
    
    if not updated_tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": "Branding updated successfully"}

@router.put("/current/features")
async def update_current_tenant_features(
    features: Dict[str, bool],
    request: Request,
    tenant: Tenant = Depends(require_tenant),
    db: Session = Depends(get_db)
):
    """Update current tenant feature flags"""
    tenant_service = TenantService(db)
    updated_tenant = tenant_service.update_tenant_features(tenant.id, features)
    
    if not updated_tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": "Features updated successfully"}

@router.put("/current/settings")
async def update_current_tenant_settings(
    settings: Dict[str, Any],
    request: Request,
    tenant: Tenant = Depends(require_tenant),
    db: Session = Depends(get_db)
):
    """Update current tenant settings"""
    tenant_service = TenantService(db)
    updated_tenant = tenant_service.update_tenant_settings(tenant.id, settings)
    
    
    if not updated_tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": "Settings updated successfully"}

@router.get("/current/features/{feature_name}")
async def check_tenant_feature(
    feature_name: str,
    request: Request,
    tenant: Tenant = Depends(require_tenant),
    db: Session = Depends(get_db)
):
    """Check if current tenant has access to a specific feature"""
    tenant_service = TenantService(db)
    has_feature = tenant_service.check_tenant_feature(tenant.id, feature_name)
    
    return {
        "feature_name": feature_name,
        "enabled": has_feature
    }

@router.get("/slug/{slug}", response_model=TenantResponse)
async def get_tenant_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get tenant by slug (public endpoint for tenant discovery)"""
    tenant_service = TenantService(db)
    tenant = tenant_service.get_tenant_by_slug(slug)
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Return limited information for public access
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        domain=tenant.domain,
        status=tenant.status,
        logo_url=tenant.logo_url,
        primary_color=tenant.primary_color,
        secondary_color=tenant.secondary_color,
        accent_color=tenant.accent_color,
        font_family=tenant.font_family,
        contact_email=tenant.contact_email,
        contact_phone=tenant.contact_phone,
        address=tenant.address,
        settings={},  # Don't expose settings
        features={},  # Don't expose features
        created_at=tenant.created_at,
        updated_at=tenant.updated_at
    )

@router.get("/domain/{domain}", response_model=TenantBranding)
async def get_tenant_branding_by_domain(
    domain: str,
    db: Session = Depends(get_db)
):
    """Get tenant branding by domain (public endpoint for white-label)"""
    tenant_service = TenantService(db)
    tenant = tenant_service.get_tenant_by_domain(domain)
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return get_tenant_branding(tenant)