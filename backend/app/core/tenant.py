from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.domain.models import Tenant, User
from app.infra.database import get_db
from app.core.auth import get_current_user

class TenantContext:
    """Tenant context for request-scoped tenant information"""
    
    def __init__(self):
        self._tenant_id: Optional[str] = None
        self._tenant: Optional[Tenant] = None
        self._user: Optional[User] = None
    
    @property
    def tenant_id(self) -> Optional[str]:
        return self._tenant_id
    
    @property
    def tenant(self) -> Optional[Tenant]:
        return self._tenant
    
    @property
    def user(self) -> Optional[User]:
        return self._user
    
    def set_context(self, tenant_id: str, tenant: Tenant, user: User):
        self._tenant_id = tenant_id
        self._tenant = tenant
        self._user = user
    
    def clear(self):
        self._tenant_id = None
        self._tenant = None
        self._user = None
    
    def get_tenant_filter(self, model_class):
        """Get tenant filter for SQLAlchemy queries"""
        if not self._tenant_id:
            raise HTTPException(status_code=403, detail="No tenant context")
        
        if hasattr(model_class, 'tenant_id'):
            return model_class.tenant_id == self._tenant_id
        return None
    
    def apply_tenant_filter(self, query, model_class):
        """Apply tenant filter to SQLAlchemy query"""
        tenant_filter = self.get_tenant_filter(model_class)
        if tenant_filter is not None:
            return query.filter(tenant_filter)
        return query

# Global tenant context
tenant_context = TenantContext()

def get_tenant_context() -> TenantContext:
    """Get the current tenant context"""
    return tenant_context

async def get_tenant_from_request(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[Tenant]:
    """Extract tenant from request (subdomain, header, or domain)"""
    
    # Try to get tenant from custom header first
    tenant_slug = request.headers.get("X-Tenant-Slug")
    
    if not tenant_slug:
        # Try to get from subdomain
        host = request.headers.get("host", "")
        if "." in host:
            subdomain = host.split(".")[0]
            if subdomain and subdomain != "www" and subdomain != "api":
                tenant_slug = subdomain
    
    if not tenant_slug:
        # Try to get from custom domain
        domain = request.headers.get("host", "")
        tenant = db.query(Tenant).filter(Tenant.domain == domain).first()
        if tenant:
            return tenant
    
    if tenant_slug:
        tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        return tenant
    
    return None

async def require_tenant(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Tenant:
    """Require tenant context and set it up"""
    
    # First try to get tenant from request
    tenant = await get_tenant_from_request(request, db)
    
    if not tenant:
        # If no tenant from request, use user's tenant
        tenant = current_user.tenant
    
    if not tenant:
        raise HTTPException(
            status_code=400,
            detail="No tenant context available"
        )
    
    # Verify user belongs to this tenant
    if current_user.tenant_id != tenant.id:
        raise HTTPException(
            status_code=403,
            detail="User does not belong to this tenant"
        )
    
    # Set tenant context
    tenant_context.set_context(tenant.id, tenant, current_user)
    
    return tenant

def get_tenant_branding(tenant: Tenant) -> Dict[str, Any]:
    """Get tenant branding configuration"""
    return {
        "logo_url": tenant.logo_url,
        "primary_color": tenant.primary_color,
        "secondary_color": tenant.secondary_color,
        "accent_color": tenant.accent_color,
        "font_family": tenant.font_family,
        "name": tenant.name,
        "domain": tenant.domain
    }

def check_tenant_feature(feature_name: str, tenant: Optional[Tenant] = None) -> bool:
    """Check if tenant has access to a specific feature"""
    if not tenant:
        tenant = tenant_context.tenant
    
    if not tenant:
        return False
    
    features = tenant.features or {}
    return features.get(feature_name, False)

def get_tenant_setting(setting_name: str, default_value: Any = None, tenant: Optional[Tenant] = None) -> Any:
    """Get tenant-specific setting"""
    if not tenant:
        tenant = tenant_context.tenant
    
    if not tenant:
        return default_value
    
    settings = tenant.settings or {}
    return settings.get(setting_name, default_value)

class TenantAwareQuery:
    """Helper class for tenant-aware database queries"""
    
    def __init__(self, db: Session, tenant_context: TenantContext):
        self.db = db
        self.tenant_context = tenant_context
    
    def query(self, model_class):
        """Create a tenant-filtered query"""
        query = self.db.query(model_class)
        return self.tenant_context.apply_tenant_filter(query, model_class)
    
    def get(self, model_class, id: str):
        """Get a single record by ID with tenant filtering"""
        query = self.query(model_class)
        return query.filter(model_class.id == id).first()
    
    def create(self, model_class, **kwargs):
        """Create a new record with tenant_id automatically set"""
        if hasattr(model_class, 'tenant_id') and 'tenant_id' not in kwargs:
            kwargs['tenant_id'] = self.tenant_context.tenant_id
        
        instance = model_class(**kwargs)
        self.db.add(instance)
        return instance

def get_tenant_db(db: Session = Depends(get_db)) -> TenantAwareQuery:
    """Get tenant-aware database query helper"""
    return TenantAwareQuery(db, tenant_context)