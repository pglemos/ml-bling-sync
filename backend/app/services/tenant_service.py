from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
from fastapi import HTTPException

from app.domain.models import Tenant, User, Product, Order, Integration
from app.schemas.tenant import (
    TenantCreate, TenantUpdate, TenantResponse, 
    TenantStats, TenantBranding, TenantSettings
)
from app.core.security import generate_uuid

class TenantService:
    """Service for tenant management operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_tenant(self, tenant_data: TenantCreate) -> Tenant:
        """Create a new tenant"""
        
        # Check if slug already exists
        existing_tenant = self.db.query(Tenant).filter(
            Tenant.slug == tenant_data.slug
        ).first()
        
        if existing_tenant:
            raise HTTPException(
                status_code=400,
                detail="Tenant with this slug already exists"
            )
        
        # Check if domain already exists (if provided)
        if tenant_data.domain:
            existing_domain = self.db.query(Tenant).filter(
                Tenant.domain == tenant_data.domain
            ).first()
            
            if existing_domain:
                raise HTTPException(
                    status_code=400,
                    detail="Tenant with this domain already exists"
                )
        
        # Set trial end date (30 days from now)
        trial_ends_at = datetime.utcnow() + timedelta(days=30)
        
        # Create tenant
        tenant = Tenant(
            id=generate_uuid(),
            name=tenant_data.name,
            slug=tenant_data.slug,
            domain=tenant_data.domain,
            status=tenant_data.status,
            logo_url=tenant_data.logo_url,
            primary_color=tenant_data.primary_color,
            secondary_color=tenant_data.secondary_color,
            accent_color=tenant_data.accent_color,
            font_family=tenant_data.font_family,
            contact_email=tenant_data.contact_email,
            contact_phone=tenant_data.contact_phone,
            address=tenant_data.address,
            settings=tenant_data.settings,
            features=self._get_default_features(),
            trial_ends_at=trial_ends_at
        )
        
        self.db.add(tenant)
        self.db.commit()
        self.db.refresh(tenant)
        
        return tenant
    
    def get_tenant(self, tenant_id: str) -> Optional[Tenant]:
        """Get tenant by ID"""
        return self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    def get_tenant_by_slug(self, slug: str) -> Optional[Tenant]:
        """Get tenant by slug"""
        return self.db.query(Tenant).filter(Tenant.slug == slug).first()
    
    def get_tenant_by_domain(self, domain: str) -> Optional[Tenant]:
        """Get tenant by domain"""
        return self.db.query(Tenant).filter(Tenant.domain == domain).first()
    
    def update_tenant(self, tenant_id: str, tenant_data: TenantUpdate) -> Optional[Tenant]:
        """Update tenant"""
        tenant = self.get_tenant(tenant_id)
        if not tenant:
            return None
        
        # Check domain uniqueness if being updated
        if tenant_data.domain and tenant_data.domain != tenant.domain:
            existing_domain = self.db.query(Tenant).filter(
                and_(
                    Tenant.domain == tenant_data.domain,
                    Tenant.id != tenant_id
                )
            ).first()
            
            if existing_domain:
                raise HTTPException(
                    status_code=400,
                    detail="Tenant with this domain already exists"
                )
        
        # Update fields
        update_data = tenant_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tenant, field, value)
        
        self.db.commit()
        self.db.refresh(tenant)
        
        return tenant
    
    def delete_tenant(self, tenant_id: str) -> bool:
        """Delete tenant and all related data"""
        tenant = self.get_tenant(tenant_id)
        if not tenant:
            return False
        
        # Note: Cascade delete will handle related records
        self.db.delete(tenant)
        self.db.commit()
        
        return True
    
    def list_tenants(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> tuple[List[Tenant], int]:
        """List tenants with pagination and filtering"""
        query = self.db.query(Tenant)
        
        # Apply filters
        if status:
            query = query.filter(Tenant.status == status)
        
        if search:
            search_filter = or_(
                Tenant.name.ilike(f"%{search}%"),
                Tenant.slug.ilike(f"%{search}%"),
                Tenant.domain.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        tenants = query.offset(skip).limit(limit).all()
        
        return tenants, total
    
    def get_tenant_stats(self, tenant_id: str) -> Optional[TenantStats]:
        """Get tenant statistics"""
        tenant = self.get_tenant(tenant_id)
        if not tenant:
            return None
        
        # Count related records
        total_users = self.db.query(func.count(User.id)).filter(
            User.tenant_id == tenant_id
        ).scalar() or 0
        
        total_products = self.db.query(func.count(Product.id)).filter(
            Product.tenant_id == tenant_id
        ).scalar() or 0
        
        total_orders = self.db.query(func.count(Order.id)).filter(
            Order.tenant_id == tenant_id
        ).scalar() or 0
        
        total_integrations = self.db.query(func.count(Integration.id)).filter(
            Integration.tenant_id == tenant_id
        ).scalar() or 0
        
        active_integrations = self.db.query(func.count(Integration.id)).filter(
            and_(
                Integration.tenant_id == tenant_id,
                Integration.status == "active"
            )
        ).scalar() or 0
        
        # Get last activity (most recent order or user login)
        last_order = self.db.query(func.max(Order.created_at)).filter(
            Order.tenant_id == tenant_id
        ).scalar()
        
        last_login = self.db.query(func.max(User.last_login)).filter(
            User.tenant_id == tenant_id
        ).scalar()
        
        last_activity = None
        if last_order and last_login:
            last_activity = max(last_order, last_login)
        elif last_order:
            last_activity = last_order
        elif last_login:
            last_activity = last_login
        
        return TenantStats(
            total_users=total_users,
            total_products=total_products,
            total_orders=total_orders,
            total_integrations=total_integrations,
            active_integrations=active_integrations,
            last_activity=last_activity
        )
    
    def get_tenant_branding(self, tenant_id: str) -> Optional[TenantBranding]:
        """Get tenant branding information"""
        tenant = self.get_tenant(tenant_id)
        if not tenant:
            return None
        
        return TenantBranding(
            logo_url=tenant.logo_url,
            primary_color=tenant.primary_color,
            secondary_color=tenant.secondary_color,
            accent_color=tenant.accent_color,
            font_family=tenant.font_family,
            name=tenant.name,
            domain=tenant.domain
        )
    
    def update_tenant_branding(
        self, 
        tenant_id: str, 
        branding_data: Dict[str, Any]
    ) -> Optional[Tenant]:
        """Update tenant branding"""
        tenant = self.get_tenant(tenant_id)
        if not tenant:
            return None
        
        # Update branding fields
        branding_fields = [
            'logo_url', 'primary_color', 'secondary_color', 
            'accent_color', 'font_family'
        ]
        
        for field in branding_fields:
            if field in branding_data:
                setattr(tenant, field, branding_data[field])
        
        self.db.commit()
        self.db.refresh(tenant)
        
        return tenant
    
    def update_tenant_features(
        self, 
        tenant_id: str, 
        features: Dict[str, bool]
    ) -> Optional[Tenant]:
        """Update tenant feature flags"""
        tenant = self.get_tenant(tenant_id)
        if not tenant:
            return None
        
        # Merge with existing features
        current_features = tenant.features or {}
        current_features.update(features)
        tenant.features = current_features
        
        self.db.commit()
        self.db.refresh(tenant)
        
        return tenant
    
    def update_tenant_settings(
        self, 
        tenant_id: str, 
        settings: Dict[str, Any]
    ) -> Optional[Tenant]:
        """Update tenant settings"""
        tenant = self.get_tenant(tenant_id)
        if not tenant:
            return None
        
        # Merge with existing settings
        current_settings = tenant.settings or {}
        current_settings.update(settings)
        tenant.settings = current_settings
        
        self.db.commit()
        self.db.refresh(tenant)
        
        return tenant
    
    def check_tenant_feature(self, tenant_id: str, feature_name: str) -> bool:
        """Check if tenant has access to a specific feature"""
        tenant = self.get_tenant(tenant_id)
        if not tenant:
            return False
        
        features = tenant.features or {}
        return features.get(feature_name, False)
    
    def _get_default_features(self) -> Dict[str, bool]:
        """Get default feature flags for new tenants"""
        return {
            "api_access": True,
            "bulk_operations": True,
            "advanced_reporting": False,
            "custom_branding": True,
            "webhook_notifications": False,
            "priority_support": False,
            "data_export": True,
            "multi_user": True,
            "integrations_limit": 3,
            "products_limit": 1000,
            "orders_limit": 5000
        }