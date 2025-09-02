"""
Authentication schemas for ML-Bling Sync API
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class TokenData(BaseModel):
    """Token data schema"""
    user_id: Optional[str] = None

class Token(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    username: str
    email: str
    roles: List[str]

class UserLogin(BaseModel):
    """User login request schema"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=6, description="User password")

class UserRegister(BaseModel):
    """User registration request schema"""
    email: EmailStr = Field(..., description="User email")
    username: str = Field(..., min_length=3, max_length=100, description="Username")
    full_name: str = Field(..., min_length=2, max_length=255, description="Full name")
    password: str = Field(..., min_length=8, description="Password")
    confirm_password: str = Field(..., description="Password confirmation")

class UserResponse(BaseModel):
    """User response schema"""
    id: str
    email: str
    username: str
    full_name: str
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    roles: List[str]

class PasswordChange(BaseModel):
    """Password change request schema"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., description="Password confirmation")

class PasswordReset(BaseModel):
    """Password reset request schema"""
    email: EmailStr = Field(..., description="User email")

class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema"""
    token: str = Field(..., description="Reset token")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., description="Password confirmation")

class RefreshToken(BaseModel):
    """Refresh token request schema"""
    refresh_token: str = Field(..., description="Refresh token")

class UserProfileUpdate(BaseModel):
    """User profile update schema"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None

class UserStatusUpdate(BaseModel):
    """User status update schema"""
    is_active: bool
    is_verified: bool

class RoleCreate(BaseModel):
    """Role creation schema"""
    name: str = Field(..., min_length=2, max_length=100, description="Role name")
    description: Optional[str] = Field(None, description="Role description")
    permissions: List[str] = Field(default=[], description="Permission names")

class RoleUpdate(BaseModel):
    """Role update schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class RoleResponse(BaseModel):
    """Role response schema"""
    id: str
    name: str
    description: Optional[str]
    is_system: bool
    created_at: datetime
    permissions: List[str]

class PermissionCreate(BaseModel):
    """Permission creation schema"""
    name: str = Field(..., min_length=2, max_length=100, description="Permission name")
    description: Optional[str] = Field(None, description="Permission description")
    resource: str = Field(..., min_length=2, max_length=100, description="Resource name")
    action: str = Field(..., min_length=2, max_length=100, description="Action name")

class PermissionUpdate(BaseModel):
    """Permission update schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    resource: Optional[str] = Field(None, min_length=2, max_length=100)
    action: Optional[str] = Field(None, min_length=2, max_length=100)

class PermissionResponse(BaseModel):
    """Permission response schema"""
    id: str
    name: str
    description: Optional[str]
    resource: str
    action: str
    created_at: datetime

class UserRoleAssign(BaseModel):
    """User role assignment schema"""
    user_id: str = Field(..., description="User ID")
    role_id: str = Field(..., description="Role ID")

class UserRoleRemove(BaseModel):
    """User role removal schema"""
    user_id: str = Field(..., description="User ID")
    role_id: str = Field(..., description="Role ID")

class RolePermissionAssign(BaseModel):
    """Role permission assignment schema"""
    role_id: str = Field(..., description="Role ID")
    permission_id: str = Field(..., description="Permission ID")

class RolePermissionRemove(BaseModel):
    """Role permission removal schema"""
    role_id: str = Field(..., description="Role ID")
    permission_id: str = Field(..., description="Permission ID")

class AuthAuditLog(BaseModel):
    """Authentication audit log schema"""
    id: str
    user_id: str
    action: str
    resource: str
    resource_id: Optional[str]
    details: Optional[dict]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

class LoginAttempt(BaseModel):
    """Login attempt tracking schema"""
    email: EmailStr
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SessionInfo(BaseModel):
    """Session information schema"""
    session_id: str
    user_id: str
    ip_address: str
    user_agent: str
    created_at: datetime
    last_activity: datetime
    is_active: bool

class TwoFactorSetup(BaseModel):
    """Two-factor authentication setup schema"""
    secret_key: str
    qr_code_url: str
    backup_codes: List[str]

class TwoFactorVerify(BaseModel):
    """Two-factor authentication verification schema"""
    code: str = Field(..., min_length=6, max_length=6, description="TOTP code")
    backup_code: Optional[str] = Field(None, description="Backup code")

class TwoFactorDisable(BaseModel):
    """Two-factor authentication disable schema"""
    current_password: str = Field(..., description="Current password")
    totp_code: str = Field(..., min_length=6, max_length=6, description="TOTP code")
