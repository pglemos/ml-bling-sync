"""
Product schemas for ML-Bling Sync API
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

class ProductImageBase(BaseModel):
    """Base product image schema"""
    url: str = Field(..., description="Image URL")
    alt_text: Optional[str] = Field(None, max_length=255, description="Alt text for accessibility")
    order_index: int = Field(0, ge=0, description="Display order")
    is_primary: bool = Field(False, description="Primary image flag")

class ProductImageCreate(ProductImageBase):
    """Product image creation schema"""
    pass

class ProductImageUpdate(BaseModel):
    """Product image update schema"""
    url: Optional[str] = None
    alt_text: Optional[str] = Field(None, max_length=255)
    order_index: Optional[int] = Field(None, ge=0)
    is_primary: Optional[bool] = None

class ProductImageResponse(ProductImageBase):
    """Product image response schema"""
    id: str
    product_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    """Base product schema"""
    name: str = Field(..., min_length=1, max_length=500, description="Product name")
    sku: str = Field(..., min_length=1, max_length=100, description="Stock keeping unit")
    description: Optional[str] = Field(None, description="Product description")
    price: Decimal = Field(..., gt=0, description="Product price")
    cost_price: Optional[Decimal] = Field(None, ge=0, description="Product cost price")
    stock_quantity: int = Field(0, ge=0, description="Available stock quantity")
    min_stock: int = Field(0, ge=0, description="Minimum stock level")
    max_stock: Optional[int] = Field(None, ge=0, description="Maximum stock level")
    weight: Optional[Decimal] = Field(None, ge=0, description="Product weight in kg")
    dimensions: Optional[Dict[str, float]] = Field(None, description="Product dimensions")
    integration_id: str = Field(..., description="Integration ID")
    category_id: Optional[str] = Field(None, description="Category ID")
    external_id: Optional[str] = Field(None, max_length=255, description="External platform ID")
    external_data: Optional[Dict[str, Any]] = Field(None, description="External platform data")

    @validator('dimensions')
    def validate_dimensions(cls, v):
        if v is not None:
            required_keys = {'length', 'width', 'height'}
            if not all(key in v for key in required_keys):
                raise ValueError('Dimensions must include length, width, and height')
            if any(v[key] <= 0 for key in required_keys):
                raise ValueError('All dimensions must be positive')
        return v

    @validator('max_stock')
    def validate_max_stock(cls, v, values):
        if v is not None and 'min_stock' in values and v < values['min_stock']:
            raise ValueError('Max stock cannot be less than min stock')
        return v

class ProductCreate(ProductBase):
    """Product creation schema"""
    images: Optional[List[ProductImageCreate]] = Field(default=[], description="Product images")

class ProductUpdate(BaseModel):
    """Product update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    min_stock: Optional[int] = Field(None, ge=0)
    max_stock: Optional[int] = Field(None, ge=0)
    weight: Optional[Decimal] = Field(None, ge=0)
    dimensions: Optional[Dict[str, float]] = None
    category_id: Optional[str] = None
    external_id: Optional[str] = Field(None, max_length=255)
    external_data: Optional[Dict[str, Any]] = None

class ProductResponse(ProductBase):
    """Product response schema"""
    id: str
    reserved_quantity: int
    status: str
    is_synced: bool
    last_sync: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    images: List[ProductImageResponse]
    category_name: Optional[str] = None
    integration_name: Optional[str] = None

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    """Product list response schema"""
    products: List[ProductResponse]
    total: int
    page: int
    size: int
    pages: int

class ProductFilter(BaseModel):
    """Product filter schema"""
    search: Optional[str] = Field(None, description="Search term for name or SKU")
    status: Optional[str] = Field(None, description="Product status filter")
    integration_id: Optional[str] = Field(None, description="Integration filter")
    category_id: Optional[str] = Field(None, description="Category filter")
    min_price: Optional[Decimal] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[Decimal] = Field(None, ge=0, description="Maximum price filter")
    in_stock: Optional[bool] = Field(None, description="In stock filter")
    is_synced: Optional[bool] = Field(None, description="Sync status filter")
    created_after: Optional[datetime] = Field(None, description="Created after date")
    created_before: Optional[datetime] = Field(None, description="Created before date")

class ProductSort(BaseModel):
    """Product sort schema"""
    field: str = Field("created_at", description="Sort field")
    order: str = Field("desc", regex="^(asc|desc)$", description="Sort order")

class ProductBulkUpdate(BaseModel):
    """Product bulk update schema"""
    product_ids: List[str] = Field(..., min_items=1, description="Product IDs to update")
    updates: ProductUpdate = Field(..., description="Update data")

class ProductBulkDelete(BaseModel):
    """Product bulk delete schema"""
    product_ids: List[str] = Field(..., min_items=1, description="Product IDs to delete")
    force: bool = Field(False, description="Force deletion even if products have orders")

class ProductSync(BaseModel):
    """Product sync schema"""
    product_ids: Optional[List[str]] = Field(None, description="Specific product IDs to sync")
    integration_id: Optional[str] = Field(None, description="Sync specific integration")
    force: bool = Field(False, description="Force sync even if already synced")

class ProductSyncResponse(BaseModel):
    """Product sync response schema"""
    synced_count: int
    failed_count: int
    errors: List[str]
    sync_id: str

class ProductImport(BaseModel):
    """Product import schema"""
    file_url: str = Field(..., description="CSV file URL")
    integration_id: str = Field(..., description="Integration ID for import")
    category_id: Optional[str] = Field(None, description="Default category ID")
    update_existing: bool = Field(False, description="Update existing products")
    create_categories: bool = Field(True, description="Create missing categories")

class ProductImportResponse(BaseModel):
    """Product import response schema"""
    import_id: str
    total_rows: int
    processed_count: int
    created_count: int
    updated_count: int
    error_count: int
    errors: List[str]

class ProductExport(BaseModel):
    """Product export schema"""
    format: str = Field("csv", regex="^(csv|excel|json)$", description="Export format")
    filters: Optional[ProductFilter] = Field(None, description="Export filters")
    fields: List[str] = Field(default=["id", "name", "sku", "price", "stock_quantity"], description="Fields to export")

class ProductExportResponse(BaseModel):
    """Product export response schema"""
    export_id: str
    file_url: str
    expires_at: datetime
    record_count: int

class ProductStats(BaseModel):
    """Product statistics schema"""
    total_products: int
    active_products: int
    draft_products: int
    out_of_stock: int
    low_stock: int
    synced_products: int
    total_value: Decimal
    average_price: Decimal

class ProductImageReorder(BaseModel):
    """Product image reorder schema"""
    image_orders: List[Dict[str, Any]] = Field(..., description="List of {image_id: order_index}")

class ProductBulkStatus(BaseModel):
    """Product bulk status update schema"""
    product_ids: List[str] = Field(..., min_items=1, description="Product IDs to update")
    status: str = Field(..., description="New status")

class ProductDuplicate(BaseModel):
    """Product duplication schema"""
    product_id: str = Field(..., description="Product ID to duplicate")
    new_sku: str = Field(..., description="New SKU for duplicated product")
    copy_images: bool = Field(True, description="Copy product images")
    copy_stock: bool = Field(False, description="Copy stock quantity")

class ProductVariation(BaseModel):
    """Product variation schema"""
    name: str = Field(..., description="Variation name")
    sku: str = Field(..., description="Variation SKU")
    price: Decimal = Field(..., gt=0, description="Variation price")
    stock_quantity: int = Field(0, ge=0, description="Variation stock")
    attributes: Dict[str, Any] = Field(..., description="Variation attributes")

class ProductWithVariations(ProductBase):
    """Product with variations schema"""
    variations: List[ProductVariation] = Field(default=[], description="Product variations")
    is_variable: bool = Field(False, description="Has variations flag")

class ProductInventory(BaseModel):
    """Product inventory schema"""
    product_id: str
    current_stock: int
    reserved_stock: int
    available_stock: int
    incoming_stock: int
    outgoing_stock: int
    last_updated: datetime

class ProductPricing(BaseModel):
    """Product pricing schema"""
    product_id: str
    base_price: Decimal
    sale_price: Optional[Decimal]
    cost_price: Optional[Decimal]
    margin_percentage: Optional[Decimal]
    markup_percentage: Optional[Decimal]
    currency: str = Field("BRL", description="Price currency")
