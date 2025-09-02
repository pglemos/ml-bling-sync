"""
Domain models for ML-Bling Sync API
"""

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, 
    Float, ForeignKey, JSON, Enum, Index, UniqueConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from datetime import datetime
import enum
import uuid

Base = declarative_base()

def generate_uuid():
    """Generate UUID for primary keys"""
    return str(uuid.uuid4())

# Enums
class ProductStatus(str, enum.Enum):
    """Product status enumeration"""
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

class OrderStatus(str, enum.Enum):
    """Order status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"

class IntegrationType(str, enum.Enum):
    """Integration type enumeration"""
    MERCADOLIVRE = "mercadolivre"
    BLING = "bling"
    SHOPEE = "shopee"
    WOOCOMMERCE = "woocommerce"

class IntegrationStatus(str, enum.Enum):
    """Integration status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    TESTING = "testing"

class ReturnStatus(str, enum.Enum):
    """Return status enumeration"""
    REQUESTED = "requested"
    APPROVED = "approved"
    RECEIVED = "received"
    REFUNDED = "refunded"
    REJECTED = "rejected"

class ReservationStatus(str, enum.Enum):
    """Reservation status enumeration"""
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    FULFILLED = "fulfilled"

# User and Role Models
class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"

class Role(Base):
    """Role model for RBAC"""
    __tablename__ = "roles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    users = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Role(id={self.id}, name={self.name})>"

class Permission(Base):
    """Permission model for granular access control"""
    __tablename__ = "permissions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    resource = Column(String(100), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    roles = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Permission(id={self.id}, name={self.name})>"

class UserRole(Base):
    """Many-to-many relationship between users and roles"""
    __tablename__ = "user_roles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    role_id = Column(String(36), ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'role_id', name='uq_user_role'),
    )

class RolePermission(Base):
    """Many-to-many relationship between roles and permissions"""
    __tablename__ = "role_permissions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    role_id = Column(String(36), ForeignKey("roles.id"), nullable=False)
    permission_id = Column(String(36), ForeignKey("permissions.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")
    
    __table_args__ = (
        UniqueConstraint('role_id', 'permission_id', name='uq_role_permission'),
    )

# Integration Models
class Integration(Base):
    """Integration model for external platform connections"""
    __tablename__ = "integrations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    type = Column(Enum(IntegrationType), nullable=False, index=True)
    status = Column(Enum(IntegrationStatus), default=IntegrationStatus.INACTIVE, index=True)
    credentials = Column(JSON, nullable=False)  # Encrypted credentials
    settings = Column(JSON, default={})
    last_sync = Column(DateTime(timezone=True))
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    products = relationship("Product", back_populates="integration")
    categories = relationship("Category", back_populates="integration")
    orders = relationship("Order", back_populates="integration")
    
    def __repr__(self):
        return f"<Integration(id={self.id}, name={self.name}, type={self.type})>"

# Product Models
class Category(Base):
    """Category model for product classification"""
    __tablename__ = "categories"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    parent_id = Column(String(36), ForeignKey("categories.id"))
    integration_id = Column(String(36), ForeignKey("integrations.id"), nullable=False)
    external_id = Column(String(255), index=True)  # ID from external platform
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    integration = relationship("Integration", back_populates="categories")
    parent = relationship("Category", remote_side=[id], backref="children")
    products = relationship("Product", back_populates="category")
    
    __table_args__ = (
        Index('idx_category_integration_external', 'integration_id', 'external_id'),
    )
    
    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name})>"

class Product(Base):
    """Product model for catalog management"""
    __tablename__ = "products"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(500), nullable=False, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    price = Column(Float, nullable=False)
    cost_price = Column(Float)
    stock_quantity = Column(Integer, default=0)
    reserved_quantity = Column(Integer, default=0)
    min_stock = Column(Integer, default=0)
    max_stock = Column(Integer)
    weight = Column(Float)
    dimensions = Column(JSON)  # {length, width, height}
    status = Column(Enum(ProductStatus), default=ProductStatus.DRAFT, index=True)
    integration_id = Column(String(36), ForeignKey("integrations.id"), nullable=False)
    category_id = Column(String(36), ForeignKey("categories.id"))
    external_id = Column(String(255), index=True)  # ID from external platform
    external_data = Column(JSON)  # Additional data from external platform
    is_synced = Column(Boolean, default=False)
    last_sync = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    integration = relationship("Integration", back_populates="products")
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    reservations = relationship("StockReservation", back_populates="product")
    
    __table_args__ = (
        Index('idx_product_integration_external', 'integration_id', 'external_id'),
        Index('idx_product_status_synced', 'status', 'is_synced'),
    )
    
    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, sku={self.sku})>"
    
    @property
    def available_stock(self):
        """Calculate available stock (total - reserved)"""
        return max(0, self.stock_quantity - self.reserved_quantity)

class ProductImage(Base):
    """Product image model"""
    __tablename__ = "product_images"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    url = Column(String(500), nullable=False)
    alt_text = Column(String(255))
    order_index = Column(Integer, default=0)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="images")
    
    __table_args__ = (
        Index('idx_product_image_order', 'product_id', 'order_index'),
    )

# Order Models
class Order(Base):
    """Order model for sales management"""
    __tablename__ = "orders"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_number = Column(String(100), unique=True, nullable=False, index=True)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255))
    customer_phone = Column(String(50))
    customer_document = Column(String(50))
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, index=True)
    total_amount = Column(Float, nullable=False)
    shipping_cost = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    notes = Column(Text)
    integration_id = Column(String(36), ForeignKey("integrations.id"), nullable=False)
    external_id = Column(String(255), index=True)  # ID from external platform
    external_data = Column(JSON)  # Additional data from external platform
    is_synced = Column(Boolean, default=False)
    last_sync = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    integration = relationship("Integration", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_order_integration_external', 'integration_id', 'external_id'),
        Index('idx_order_status_created', 'status', 'created_at'),
    )
    
    def __repr__(self):
        return f"<Order(id={self.id}, order_number={self.order_number})>"

class OrderItem(Base):
    """Order item model"""
    __tablename__ = "order_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

# Kit Models
class Kit(Base):
    """Kit model for product bundles"""
    __tablename__ = "kits"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(500), nullable=False, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    items = relationship("KitItem", back_populates="kit", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Kit(id={self.id}, name={self.name}, sku={self.sku})>"

class KitItem(Base):
    """Kit item model"""
    __tablename__ = "kit_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    kit_id = Column(String(36), ForeignKey("kits.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    kit = relationship("Kit", back_populates="items")
    product = relationship("Product")
    
    __table_args__ = (
        Index('idx_kit_item_order', 'kit_id', 'order_index'),
    )

# Return Models
class Return(Base):
    """Return model for product returns"""
    __tablename__ = "returns"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    rma_number = Column(String(100), unique=True, nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255))
    reason = Column(Text)
    status = Column(Enum(ReturnStatus), default=ReturnStatus.REQUESTED, index=True)
    refund_amount = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    order = relationship("Order")
    items = relationship("ReturnItem", back_populates="return_request", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Return(id={self.id}, rma_number={self.rma_number})>"

class ReturnItem(Base):
    """Return item model"""
    __tablename__ = "return_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    return_id = Column(String(36), ForeignKey("returns.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    return_request = relationship("Return", back_populates="items")
    product = relationship("Product")

# Stock Reservation Models
class StockReservation(Base):
    """Stock reservation model"""
    __tablename__ = "stock_reservations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String(255))
    status = Column(Enum(ReservationStatus), default=ReservationStatus.ACTIVE, index=True)
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="reservations")
    
    __table_args__ = (
        Index('idx_reservation_status_expires', 'status', 'expires_at'),
    )

# Financial Models
class FinancialTransaction(Base):
    """Financial transaction model"""
    __tablename__ = "financial_transactions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    transaction_type = Column(String(100), nullable=False, index=True)  # sale, refund, fee, etc.
    amount = Column(Float, nullable=False)
    description = Column(Text)
    order_id = Column(String(36), ForeignKey("orders.id"))
    integration_id = Column(String(36), ForeignKey("integrations.id"))
    external_id = Column(String(255), index=True)
    transaction_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order")
    integration = relationship("Integration")
    
    __table_args__ = (
        Index('idx_financial_type_date', 'transaction_type', 'transaction_date'),
    )

# Audit Models
class AuditLog(Base):
    """Audit log model for security tracking"""
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False, index=True)
    resource = Column(String(100), nullable=False, index=True)
    resource_id = Column(String(36), index=True)
    details = Column(JSON)
    ip_address = Column(String(45))  # IPv4 or IPv6
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    __table_args__ = (
        Index('idx_audit_user_action', 'user_id', 'action'),
        Index('idx_audit_resource', 'resource', 'resource_id'),
        Index('idx_audit_created', 'created_at'),
    )
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, user_id={self.user_id}, action={self.action})>"

# Dashboard Models
class DashboardMetric(Base):
    """Dashboard metric model for caching"""
    __tablename__ = "dashboard_metrics"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(Float, nullable=False)
    metric_unit = Column(String(50))
    period = Column(String(50), index=True)  # daily, weekly, monthly
    period_date = Column(DateTime(timezone=True), index=True)
    integration_id = Column(String(36), ForeignKey("integrations.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    integration = relationship("Integration")
    
    __table_args__ = (
        Index('idx_metric_name_period', 'metric_name', 'period', 'period_date'),
    )
