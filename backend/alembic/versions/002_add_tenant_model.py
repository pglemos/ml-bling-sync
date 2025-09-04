"""Add tenant model and multi-tenancy support

Revision ID: 002
Revises: 001
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # Create tenant status enum
    tenant_status_enum = postgresql.ENUM(
        'active', 'inactive', 'suspended', 'trial',
        name='tenantstatus'
    )
    tenant_status_enum.create(op.get_bind())
    
    # Create tenants table
    op.create_table(
        'tenants',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('domain', sa.String(255), nullable=True),
        sa.Column('status', tenant_status_enum, server_default='trial'),
        
        # Branding settings
        sa.Column('logo_url', sa.String(500), nullable=True),
        sa.Column('primary_color', sa.String(7), server_default='#3B82F6'),
        sa.Column('secondary_color', sa.String(7), server_default='#1E40AF'),
        sa.Column('accent_color', sa.String(7), server_default='#10B981'),
        sa.Column('font_family', sa.String(100), server_default='Inter'),
        
        # Contact information
        sa.Column('contact_email', sa.String(255), nullable=True),
        sa.Column('contact_phone', sa.String(50), nullable=True),
        sa.Column('address', sa.Text, nullable=True),
        
        # Settings and features
        sa.Column('settings', sa.JSON, server_default='{}'),
        sa.Column('features', sa.JSON, server_default='{}'),
        
        # Billing
        sa.Column('plan_id', sa.String(100), nullable=True),
        sa.Column('subscription_id', sa.String(100), nullable=True),
        sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # Create indexes for tenants
    op.create_index('idx_tenants_slug', 'tenants', ['slug'], unique=True)
    op.create_index('idx_tenants_domain', 'tenants', ['domain'], unique=True)
    op.create_index('idx_tenants_status', 'tenants', ['status'])
    
    # Add tenant_id to users table
    op.add_column('users', sa.Column('tenant_id', sa.String(36), nullable=True))
    op.create_foreign_key('fk_users_tenant', 'users', 'tenants', ['tenant_id'], ['id'])
    op.create_index('idx_users_tenant', 'users', ['tenant_id'])
    
    # Remove unique constraints from users (will be unique per tenant)
    op.drop_constraint('users_email_key', 'users', type_='unique')
    op.drop_constraint('users_username_key', 'users', type_='unique')
    
    # Add composite unique constraints for tenant + email/username
    op.create_unique_constraint('uq_tenant_user_email', 'users', ['tenant_id', 'email'])
    op.create_unique_constraint('uq_tenant_user_username', 'users', ['tenant_id', 'username'])
    
    # Add tenant_id to integrations table
    op.add_column('integrations', sa.Column('tenant_id', sa.String(36), nullable=True))
    op.create_foreign_key('fk_integrations_tenant', 'integrations', 'tenants', ['tenant_id'], ['id'])
    op.create_index('idx_integrations_tenant', 'integrations', ['tenant_id'])
    
    # Add tenant_id to products table
    op.add_column('products', sa.Column('tenant_id', sa.String(36), nullable=True))
    op.create_foreign_key('fk_products_tenant', 'products', 'tenants', ['tenant_id'], ['id'])
    op.create_index('idx_products_tenant', 'products', ['tenant_id'])
    
    # Remove unique constraint from products SKU (will be unique per tenant)
    op.drop_constraint('products_sku_key', 'products', type_='unique')
    op.create_unique_constraint('uq_tenant_product_sku', 'products', ['tenant_id', 'sku'])
    
    # Add tenant_id to orders table
    op.add_column('orders', sa.Column('tenant_id', sa.String(36), nullable=True))
    op.create_foreign_key('fk_orders_tenant', 'orders', 'tenants', ['tenant_id'], ['id'])
    op.create_index('idx_orders_tenant', 'orders', ['tenant_id'])
    
    # Remove unique constraint from orders order_number (will be unique per tenant)
    op.drop_constraint('orders_order_number_key', 'orders', type_='unique')
    op.create_unique_constraint('uq_tenant_order_number', 'orders', ['tenant_id', 'order_number'])
    
    # Create a default tenant for existing data
    op.execute("""
        INSERT INTO tenants (id, name, slug, status, created_at)
        VALUES (
            'default-tenant-id',
            'Default Tenant',
            'default',
            'active',
            NOW()
        )
    """)
    
    # Update existing records to use default tenant
    op.execute("UPDATE users SET tenant_id = 'default-tenant-id' WHERE tenant_id IS NULL")
    op.execute("UPDATE integrations SET tenant_id = 'default-tenant-id' WHERE tenant_id IS NULL")
    op.execute("UPDATE products SET tenant_id = 'default-tenant-id' WHERE tenant_id IS NULL")
    op.execute("UPDATE orders SET tenant_id = 'default-tenant-id' WHERE tenant_id IS NULL")
    
    # Make tenant_id columns non-nullable
    op.alter_column('users', 'tenant_id', nullable=False)
    op.alter_column('integrations', 'tenant_id', nullable=False)
    op.alter_column('products', 'tenant_id', nullable=False)
    op.alter_column('orders', 'tenant_id', nullable=False)

def downgrade():
    # Remove tenant_id columns and constraints
    op.drop_constraint('fk_orders_tenant', 'orders', type_='foreignkey')
    op.drop_constraint('uq_tenant_order_number', 'orders', type_='unique')
    op.drop_index('idx_orders_tenant', 'orders')
    op.drop_column('orders', 'tenant_id')
    op.create_unique_constraint('orders_order_number_key', 'orders', ['order_number'])
    
    op.drop_constraint('fk_products_tenant', 'products', type_='foreignkey')
    op.drop_constraint('uq_tenant_product_sku', 'products', type_='unique')
    op.drop_index('idx_products_tenant', 'products')
    op.drop_column('products', 'tenant_id')
    op.create_unique_constraint('products_sku_key', 'products', ['sku'])
    
    op.drop_constraint('fk_integrations_tenant', 'integrations', type_='foreignkey')
    op.drop_index('idx_integrations_tenant', 'integrations')
    op.drop_column('integrations', 'tenant_id')
    
    op.drop_constraint('fk_users_tenant', 'users', type_='foreignkey')
    op.drop_constraint('uq_tenant_user_email', 'users', type_='unique')
    op.drop_constraint('uq_tenant_user_username', 'users', type_='unique')
    op.drop_index('idx_users_tenant', 'users')
    op.drop_column('users', 'tenant_id')
    op.create_unique_constraint('users_email_key', 'users', ['email'])
    op.create_unique_constraint('users_username_key', 'users', ['username'])
    
    # Drop tenants table and indexes
    op.drop_index('idx_tenants_status', 'tenants')
    op.drop_index('idx_tenants_domain', 'tenants')
    op.drop_index('idx_tenants_slug', 'tenants')
    op.drop_table('tenants')
    
    # Drop tenant status enum
    tenant_status_enum = postgresql.ENUM(name='tenantstatus')
    tenant_status_enum.drop(op.get_bind())