"""Add billing models

Revision ID: 003
Revises: 002
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None

def upgrade():
    # Create plans table
    op.create_table('plans',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price_cents', sa.Integer(), nullable=False, default=0),
        sa.Column('interval', sa.Enum('MONTH', 'YEAR', name='planinterval'), nullable=False),
        sa.Column('trial_days', sa.Integer(), nullable=True, default=0),
        sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', 'ARCHIVED', name='planstatus'), nullable=True),
        sa.Column('stripe_price_id', sa.String(255), nullable=True),
        sa.Column('features', sa.JSON(), nullable=True),
        sa.Column('quotas', sa.JSON(), nullable=True),
        sa.Column('is_popular', sa.Boolean(), nullable=True, default=False),
        sa.Column('sort_order', sa.Integer(), nullable=True, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('stripe_price_id')
    )
    
    # Create indexes for plans
    op.create_index('idx_plan_status_sort', 'plans', ['status', 'sort_order'])
    op.create_index('idx_plan_interval_price', 'plans', ['interval', 'price_cents'])
    op.create_index('ix_plans_status', 'plans', ['status'])
    op.create_index('ix_plans_stripe_price_id', 'plans', ['stripe_price_id'])
    
    # Create subscriptions table
    op.create_table('subscriptions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False),
        sa.Column('plan_id', sa.String(36), nullable=False),
        sa.Column('stripe_subscription_id', sa.String(255), nullable=True),
        sa.Column('stripe_customer_id', sa.String(255), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'PAST_DUE', 'TRIALING', 'UNPAID', name='subscriptionstatus'), nullable=True),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('canceled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['plan_id'], ['plans.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stripe_subscription_id'),
        sa.UniqueConstraint('tenant_id', name='uq_subscription_tenant')
    )
    
    # Create indexes for subscriptions
    op.create_index('idx_subscription_tenant_status', 'subscriptions', ['tenant_id', 'status'])
    op.create_index('idx_subscription_plan_status', 'subscriptions', ['plan_id', 'status'])
    op.create_index('idx_subscription_period', 'subscriptions', ['current_period_start', 'current_period_end'])
    op.create_index('ix_subscriptions_status', 'subscriptions', ['status'])
    op.create_index('ix_subscriptions_stripe_subscription_id', 'subscriptions', ['stripe_subscription_id'])
    op.create_index('ix_subscriptions_stripe_customer_id', 'subscriptions', ['stripe_customer_id'])
    
    # Create usage_records table
    op.create_table('usage_records',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False),
        sa.Column('subscription_id', sa.String(36), nullable=False),
        sa.Column('metric', sa.Enum('API_CALLS', 'PRODUCTS_SYNCED', 'ORDERS_PROCESSED', 'STORAGE_USED', 'INTEGRATIONS_ACTIVE', 'USERS_ACTIVE', 'WEBHOOKS_SENT', name='usagemetric'), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, default=0),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for usage_records
    op.create_index('idx_usage_tenant_metric_time', 'usage_records', ['tenant_id', 'metric', 'timestamp'])
    op.create_index('idx_usage_subscription_metric', 'usage_records', ['subscription_id', 'metric'])
    op.create_index('idx_usage_metric_timestamp', 'usage_records', ['metric', 'timestamp'])
    op.create_index('ix_usage_records_metric', 'usage_records', ['metric'])
    op.create_index('ix_usage_records_timestamp', 'usage_records', ['timestamp'])
    
    # Create payments table
    op.create_table('payments',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False),
        sa.Column('subscription_id', sa.String(36), nullable=False),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(3), nullable=True, default='usd'),
        sa.Column('status', sa.Enum('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED', name='paymentstatus'), nullable=True),
        sa.Column('stripe_payment_intent_id', sa.String(255), nullable=True),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stripe_payment_intent_id')
    )
    
    # Create indexes for payments
    op.create_index('idx_payment_tenant_status', 'payments', ['tenant_id', 'status'])
    op.create_index('idx_payment_subscription_status', 'payments', ['subscription_id', 'status'])
    op.create_index('idx_payment_created', 'payments', ['created_at'])
    op.create_index('ix_payments_status', 'payments', ['status'])
    op.create_index('ix_payments_stripe_payment_intent_id', 'payments', ['stripe_payment_intent_id'])
    
    # Create invoices table
    op.create_table('invoices',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False),
        sa.Column('subscription_id', sa.String(36), nullable=False),
        sa.Column('invoice_number', sa.String(100), nullable=False),
        sa.Column('subtotal_cents', sa.Integer(), nullable=False, default=0),
        sa.Column('tax_cents', sa.Integer(), nullable=True, default=0),
        sa.Column('total_cents', sa.Integer(), nullable=False, default=0),
        sa.Column('currency', sa.String(3), nullable=True, default='usd'),
        sa.Column('status', sa.Enum('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE', name='invoicestatus'), nullable=True),
        sa.Column('stripe_invoice_id', sa.String(255), nullable=True),
        sa.Column('line_items', sa.JSON(), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invoice_number'),
        sa.UniqueConstraint('stripe_invoice_id')
    )
    
    # Create indexes for invoices
    op.create_index('idx_invoice_tenant_status', 'invoices', ['tenant_id', 'status'])
    op.create_index('idx_invoice_subscription_status', 'invoices', ['subscription_id', 'status'])
    op.create_index('idx_invoice_due_date', 'invoices', ['due_date'])
    op.create_index('idx_invoice_created', 'invoices', ['created_at'])
    op.create_index('ix_invoices_invoice_number', 'invoices', ['invoice_number'])
    op.create_index('ix_invoices_status', 'invoices', ['status'])
    op.create_index('ix_invoices_stripe_invoice_id', 'invoices', ['stripe_invoice_id'])
    
    # Insert default plans
    op.execute("""
        INSERT INTO plans (id, name, description, price_cents, interval, trial_days, status, features, quotas, is_popular, sort_order)
        VALUES 
        ('starter-plan-id', 'Starter', 'Perfect for small businesses getting started', 0, 'MONTH', 14, 'ACTIVE', 
         '{"basic_sync": true, "email_support": true, "api_access": false, "advanced_analytics": false, "white_label": false}',
         '{"products": 100, "orders_per_month": 500, "api_calls_per_month": 1000, "integrations": 2, "users": 2}',
         false, 1),
        ('professional-plan-id', 'Professional', 'For growing businesses with advanced needs', 4900, 'MONTH', 14, 'ACTIVE',
         '{"basic_sync": true, "email_support": true, "api_access": true, "advanced_analytics": true, "white_label": false, "priority_support": true}',
         '{"products": 1000, "orders_per_month": 5000, "api_calls_per_month": 10000, "integrations": 10, "users": 10}',
         true, 2),
        ('enterprise-plan-id', 'Enterprise', 'For large organizations with custom requirements', 19900, 'MONTH', 14, 'ACTIVE',
         '{"basic_sync": true, "email_support": true, "api_access": true, "advanced_analytics": true, "white_label": true, "priority_support": true, "custom_integrations": true, "dedicated_support": true}',
         '{"products": -1, "orders_per_month": -1, "api_calls_per_month": -1, "integrations": -1, "users": -1}',
         false, 3)
    """)

def downgrade():
    # Drop tables in reverse order
    op.drop_table('invoices')
    op.drop_table('payments')
    op.drop_table('usage_records')
    op.drop_table('subscriptions')
    op.drop_table('plans')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS planstatus')
    op.execute('DROP TYPE IF EXISTS planinterval')
    op.execute('DROP TYPE IF EXISTS subscriptionstatus')
    op.execute('DROP TYPE IF EXISTS paymentstatus')
    op.execute('DROP TYPE IF EXISTS invoicestatus')
    op.execute('DROP TYPE IF EXISTS usagemetric')