from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum

class TenantStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    TRIAL = "trial"

class TenantBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, regex=r'^[a-z0-9-]+$')
    domain: Optional[str] = Field(None, max_length=255)
    status: TenantStatus = TenantStatus.TRIAL
    
    # Branding settings
    logo_url: Optional[str] = Field(None, max_length=500)
    primary_color: str = Field("#3B82F6", regex=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: str = Field("#1E40AF", regex=r'^#[0-9A-Fa-f]{6}$')
    accent_color: str = Field("#10B981", regex=r'^#[0-9A-Fa-f]{6}$')
    font_family: str = Field("Inter", max_length=100)
    
    # Contact information
    contact_email: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    
    # Settings and features
    settings: Dict[str, Any] = Field(default_factory=dict)
    features: Dict[str, Any] = Field(default_factory=dict)
    
    @validator('slug')
    def validate_slug(cls, v):
        if not v or not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Slug must contain only alphanumeric characters and hyphens')
        return v.lower()
    
    @validator('domain')
    def validate_domain(cls, v):
        if v and not v.replace('.', '').replace('-', '').isalnum():
            raise ValueError('Invalid domain format')
        return v.lower() if v else v

class TenantCreate(TenantBase):
    """Schema for creating a new tenant"""
    pass

class TenantUpdate(BaseModel):
    """Schema for updating a tenant"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    domain: Optional[str] = Field(None, max_length=255)
    status: Optional[TenantStatus] = None
    
    # Branding settings
    logo_url: Optional[str] = Field(None, max_length=500)
    primary_color: Optional[str] = Field(None, regex=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field(None, regex=r'^#[0-9A-Fa-f]{6}$')
    accent_color: Optional[str] = Field(None, regex=r'^#[0-9A-Fa-f]{6}$')
    font_family: Optional[str] = Field(None, max_length=100)
    
    # Contact information
    contact_email: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    
    # Settings and features
    settings: Optional[Dict[str, Any]] = None
    features: Optional[Dict[str, Any]] = None
    
    @validator('domain')
    def validate_domain(cls, v):
        if v and not v.replace('.', '').replace('-', '').isalnum():
            raise ValueError('Invalid domain format')
        return v.lower() if v else v

class TenantResponse(TenantBase):
    """Schema for tenant response"""
    id: str
    plan_id: Optional[str] = None
    subscription_id: Optional[str] = None
    trial_ends_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TenantBranding(BaseModel):
    """Schema for tenant branding information"""
    logo_url: Optional[str] = None
    primary_color: str = "#3B82F6"
    secondary_color: str = "#1E40AF"
    accent_color: str = "#10B981"
    font_family: str = "Inter"
    name: str
    domain: Optional[str] = None

class TenantSettings(BaseModel):
    """Schema for tenant settings"""
    settings: Dict[str, Any] = Field(default_factory=dict)
    features: Dict[str, Any] = Field(default_factory=dict)

class TenantFeatureFlag(BaseModel):
    """Schema for individual feature flag"""
    feature_name: str
    enabled: bool
    description: Optional[str] = None

class TenantStats(BaseModel):
    """Schema for tenant statistics"""
    total_users: int = 0
    total_products: int = 0
    total_orders: int = 0
    total_integrations: int = 0
    active_integrations: int = 0
    last_activity: Optional[datetime] = None

class TenantList(BaseModel):
    """Schema for tenant list response"""
    tenants: List[TenantResponse]
    total: int
    page: int
    size: int
    pages: int