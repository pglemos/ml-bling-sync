"""Add supplier order task table

Revision ID: 001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create supplier_task_status enum
    supplier_task_status = postgresql.ENUM(
        'CREATED', 'SENT', 'CONFIRMED', 'CANCELLED',
        name='suppliertaskstatus'
    )
    supplier_task_status.create(op.get_bind())
    
    # Create supplier_order_tasks table
    op.create_table(
        'supplier_order_tasks',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('order_id', sa.String(36), sa.ForeignKey('orders.id'), nullable=False),
        sa.Column('supplier_sku', sa.String(255), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Float()),
        sa.Column('total_price', sa.Float()),
        sa.Column('status', supplier_task_status, nullable=False, server_default='CREATED'),
        
        # Shipping address fields
        sa.Column('shipping_name', sa.String(255)),
        sa.Column('shipping_address', sa.Text()),
        sa.Column('shipping_city', sa.String(100)),
        sa.Column('shipping_state', sa.String(50)),
        sa.Column('shipping_zip', sa.String(20)),
        sa.Column('shipping_country', sa.String(50)),
        
        # Supplier information fields
        sa.Column('supplier_name', sa.String(255)),
        sa.Column('supplier_email', sa.String(255)),
        sa.Column('supplier_phone', sa.String(50)),
        
        # Task metadata fields
        sa.Column('notes', sa.Text()),
        sa.Column('external_task_id', sa.String(255)),
        sa.Column('sent_at', sa.DateTime(timezone=True)),
        sa.Column('confirmed_at', sa.DateTime(timezone=True)),
        sa.Column('cancelled_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # Create indexes
    op.create_index(
        'idx_supplier_task_order_status',
        'supplier_order_tasks',
        ['order_id', 'status']
    )
    op.create_index(
        'idx_supplier_task_sku',
        'supplier_order_tasks',
        ['supplier_sku']
    )
    op.create_index(
        'idx_supplier_task_created',
        'supplier_order_tasks',
        ['created_at']
    )
    op.create_index(
        'idx_supplier_task_external_id',
        'supplier_order_tasks',
        ['external_task_id']
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_supplier_task_external_id', 'supplier_order_tasks')
    op.drop_index('idx_supplier_task_created', 'supplier_order_tasks')
    op.drop_index('idx_supplier_task_sku', 'supplier_order_tasks')
    op.drop_index('idx_supplier_task_order_status', 'supplier_order_tasks')
    
    # Drop table
    op.drop_table('supplier_order_tasks')
    
    # Drop enum
    op.execute('DROP TYPE suppliertaskstatus')