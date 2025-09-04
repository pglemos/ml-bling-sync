// Types and interfaces for connectors

export interface ConnectorConfig {
  id: string;
  name: string;
  type: 'shopify' | 'nuvemshop' | 'bling';
  credentials: Record<string, any>;
  isActive: boolean;
  lastSync?: Date;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  inventory_quantity: number;
  title?: string;
  weight?: number;
  barcode?: string;
}

export interface RawProduct {
  id: string;
  title: string;
  description?: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  variants: ProductVariant[];
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface NormalizedSPU {
  id: string;
  title: string;
  description?: string;
  vendor?: string;
  category?: string;
  tags?: string[];
  images?: string[];
  supplier_id: string;
  supplier_product_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface NormalizedSKU {
  id: string;
  spu_id: string;
  supplier_sku: string;
  master_sku?: string; // For reconciliation
  title?: string;
  price: number;
  stock: number;
  weight?: number;
  barcode?: string;
  mapping_status: 'auto' | 'manual' | 'pending';
  created_at: Date;
  updated_at: Date;
}

export interface NormalizedProduct {
  spu: NormalizedSPU;
  skus: NormalizedSKU[];
}

export interface SyncResult {
  success: boolean;
  products_imported: number;
  products_updated: number;
  products_failed: number;
  errors: string[];
  duration_ms: number;
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  supplier: string;
  headers?: Record<string, string>;
}

export interface InventoryUpdate {
  sku: string;
  quantity: number;
  price?: number;
}

export interface ConnectorInterface {
  // Core methods
  import_products(limit?: number, offset?: number): Promise<SyncResult>;
  fetch_inventory(skus?: string[]): Promise<InventoryUpdate[]>;
  handle_webhook(payload: WebhookPayload): Promise<void>;
  
  // Configuration
  configure(config: ConnectorConfig): void;
  test_connection(): Promise<boolean>;
  
  // Normalization
  normalize_product(raw_product: RawProduct): NormalizedProduct;
}
