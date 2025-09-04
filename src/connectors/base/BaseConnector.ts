import { 
  ConnectorInterface, 
  ConnectorConfig, 
  RawProduct, 
  NormalizedProduct, 
  NormalizedSPU, 
  NormalizedSKU,
  SyncResult, 
  WebhookPayload, 
  InventoryUpdate 
} from '../types';

export abstract class BaseConnector implements ConnectorInterface {
  protected config: ConnectorConfig | null = null;
  protected apiClient: any = null;

  constructor() {}

  // Abstract methods that must be implemented by subclasses
  abstract import_products(limit?: number, offset?: number): Promise<SyncResult>;
  abstract fetch_inventory(skus?: string[]): Promise<InventoryUpdate[]>;
  abstract handle_webhook(payload: WebhookPayload): Promise<void>;
  abstract test_connection(): Promise<boolean>;

  // Configuration
  configure(config: ConnectorConfig): void {
    this.config = config;
    this.setupApiClient();
  }

  protected abstract setupApiClient(): void;

  // Common normalization logic
  normalize_product(raw_product: RawProduct): NormalizedProduct {
    if (!this.config) {
      throw new Error('Connector not configured');
    }

    const spu: NormalizedSPU = {
      id: `spu_${this.config.id}_${raw_product.id}`,
      title: raw_product.title,
      description: raw_product.description,
      vendor: raw_product.vendor,
      category: raw_product.product_type,
      tags: raw_product.tags,
      images: raw_product.images,
      supplier_id: this.config.id,
      supplier_product_id: raw_product.id,
      created_at: raw_product.created_at ? new Date(raw_product.created_at) : new Date(),
      updated_at: raw_product.updated_at ? new Date(raw_product.updated_at) : new Date()
    };

    const skus: NormalizedSKU[] = raw_product.variants.map(variant => ({
      id: `sku_${this.config!.id}_${variant.id}`,
      spu_id: spu.id,
      supplier_sku: variant.sku,
      title: variant.title,
      price: variant.price,
      stock: variant.inventory_quantity,
      weight: variant.weight,
      barcode: variant.barcode,
      mapping_status: 'auto' as const,
      created_at: new Date(),
      updated_at: new Date()
    }));

    return { spu, skus };
  }

  // Helper methods
  protected createSyncResult(
    success: boolean,
    imported: number = 0,
    updated: number = 0,
    failed: number = 0,
    errors: string[] = [],
    startTime: number = Date.now()
  ): SyncResult {
    return {
      success,
      products_imported: imported,
      products_updated: updated,
      products_failed: failed,
      errors,
      duration_ms: Date.now() - startTime
    };
  }

  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.config?.type?.toUpperCase() || 'CONNECTOR'}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
    }
  }

  // Validation helpers
  protected validateConfig(): void {
    if (!this.config) {
      throw new Error('Connector configuration is required');
    }
    if (!this.config.credentials) {
      throw new Error('Connector credentials are required');
    }
  }

  protected validateProduct(product: RawProduct): boolean {
    if (!product.id || !product.title) {
      this.log('warn', 'Invalid product: missing id or title', product);
      return false;
    }
    if (!product.variants || product.variants.length === 0) {
      this.log('warn', 'Invalid product: no variants found', product);
      return false;
    }
    return true;
  }
}
