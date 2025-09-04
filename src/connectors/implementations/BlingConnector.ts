import { BaseConnector } from '../base/BaseConnector';
import { 
  SyncResult, 
  WebhookPayload, 
  InventoryUpdate, 
  RawProduct,
  NormalizedProduct,
  NormalizedSKU 
} from '../types';
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

export interface SKUMapping {
  id: string;
  supplier_sku: string;
  master_sku: string;
  confidence_score: number;
  mapping_type: 'auto' | 'manual' | 'pending';
  created_at: Date;
  updated_at: Date;
}

export interface SKUReconciliationResult {
  mapped: SKUMapping[];
  pending: string[];
  conflicts: { supplier_sku: string; candidates: string[] }[];
}

export class BlingConnector extends BaseConnector {
  private blingApiUrl: string = 'https://bling.com.br/Api/v2';
  private apiKey: string = '';
  protected apiClient: AxiosInstance | null = null;
  private skuMappings: Map<string, SKUMapping> = new Map();

  protected setupApiClient(): void {
    this.validateConfig();
    
    const { api_key } = this.config!.credentials;
    this.apiKey = api_key;
    
    this.apiClient = axios.create({
      baseURL: this.blingApiUrl,
      params: {
        apikey: this.apiKey
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ML-Bling-Sync/1.0'
      },
      timeout: 30000
    });
    
    this.log('info', 'Bling API client configured');
  }

  async test_connection(): Promise<boolean> {
    try {
      this.validateConfig();
      
      if (!this.apiClient) {
        this.setupApiClient();
      }
      
      this.log('info', 'Testing Bling connection...');
      
      // Test connection by calling the situacao endpoint
      const response = await this.apiClient!.get('/situacao');
      
      if (response.status === 200 && response.data) {
        this.log('info', 'Bling connection test successful');
        return true;
      } else {
        this.log('error', 'Bling connection test failed: Invalid response');
        return false;
      }
    } catch (error: any) {
      this.log('error', 'Bling connection test failed', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return false;
    }
  }

  async import_products(limit: number = 50, offset: number = 0): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      this.validateConfig();
      
      if (!this.apiClient) {
        this.setupApiClient();
      }
      
      this.log('info', 'Starting Bling product import', { limit, offset });

      // Fetch products from Bling API
      const response = await this.apiClient!.get('/produtos', {
        params: {
          limite: limit,
          pagina: Math.floor(offset / limit) + 1
        }
      });
      
      const products = response.data?.retorno?.produtos || [];
      
      let imported = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const productWrapper of products) {
        const rawProduct = productWrapper.produto;
        try {
          if (!this.validateProduct(rawProduct)) {
            failed++;
            continue;
          }

          const normalizedProduct = this.normalize_product(rawProduct);
          
          // Apply SKU reconciliation
          const reconciledProduct = await this.reconcileSKUs(normalizedProduct);
          
          // TODO: Save to database
          this.log('info', 'Product normalized and reconciled', { 
            spu_id: reconciledProduct.spu.id, 
            skus_count: reconciledProduct.skus.length,
            pending_mappings: reconciledProduct.skus.filter(sku => sku.mapping_status === 'pending').length
          });
          
          imported++;
        } catch (error) {
          failed++;
          const errorMsg = `Failed to process product ${rawProduct.id}: ${error}`;
          errors.push(errorMsg);
          this.log('error', errorMsg);
        }
      }

      const result = this.createSyncResult(true, imported, 0, failed, errors, startTime);
      this.log('info', 'Bling import completed', result);
      
      return result;
    } catch (error) {
      const errorMsg = `Bling import failed: ${error}`;
      this.log('error', errorMsg);
      return this.createSyncResult(false, 0, 0, 0, [errorMsg], startTime);
    }
  }

  async fetch_inventory(skus?: string[]): Promise<InventoryUpdate[]> {
    try {
      this.validateConfig();
      
      if (!this.apiClient) {
        this.setupApiClient();
      }
      
      this.log('info', 'Fetching Bling inventory', { skus_count: skus?.length });

      const inventoryUpdates: InventoryUpdate[] = [];
      
      if (skus && skus.length > 0) {
        // Fetch specific SKUs
        for (const sku of skus) {
          try {
            const response = await this.apiClient!.get('/produto', {
              params: { codigo: sku }
            });
            
            const product = response.data?.retorno?.produtos?.[0]?.produto;
            if (product) {
              inventoryUpdates.push({
                sku: product.codigo || sku,
                quantity: parseInt(product.estoqueAtual) || 0,
                price: parseFloat(product.preco) || 0
              });
            }
          } catch (error) {
            this.log('warn', `Failed to fetch inventory for SKU ${sku}`, error);
          }
        }
      } else {
        // Fetch all products with pagination
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const response = await this.apiClient!.get('/produtos', {
            params: {
              limite: 100,
              pagina: page
            }
          });
          
          const products = response.data?.retorno?.produtos || [];
          
          for (const productWrapper of products) {
            const product = productWrapper.produto;
            if (product && product.codigo) {
              inventoryUpdates.push({
                sku: product.codigo,
                quantity: parseInt(product.estoqueAtual) || 0,
                price: parseFloat(product.preco) || 0
              });
            }
          }
          
          hasMore = products.length === 100;
          page++;
        }
      }

      this.log('info', 'Bling inventory fetched', { count: inventoryUpdates.length });
      return inventoryUpdates;
    } catch (error) {
      this.log('error', 'Failed to fetch Bling inventory', error);
      return [];
    }
  }

  async handle_webhook(payload: WebhookPayload): Promise<void> {
    try {
      this.log('info', 'Processing Bling webhook', { event: payload.event });

      switch (payload.event) {
        case 'produto.alterado':
          await this.handleProductWebhook(payload.data);
          break;
        case 'estoque.alterado':
          await this.handleInventoryWebhook(payload.data);
          break;
        default:
          this.log('warn', 'Unhandled Bling webhook event', { event: payload.event });
      }
    } catch (error) {
      this.log('error', 'Failed to process Bling webhook', error);
      throw error;
    }
  }

  // SKU Reconciliation Methods
  async reconcileSKUs(product: NormalizedProduct): Promise<NormalizedProduct> {
    this.log('info', 'Starting SKU reconciliation', { spu_id: product.spu.id });
    
    const reconciledSKUs: NormalizedSKU[] = [];
    
    for (const sku of product.skus) {
      const mapping = await this.findSKUMapping(sku.supplier_sku);
      
      if (mapping) {
        // Apply existing mapping
        reconciledSKUs.push({
          ...sku,
          mapping_status: mapping.mapping_type,
          master_sku: mapping.master_sku
        });
      } else {
        // Try auto-mapping
        const autoMapping = await this.attemptAutoMapping(sku.supplier_sku);
        
        if (autoMapping.confidence_score > 0.8) {
          reconciledSKUs.push({
            ...sku,
            mapping_status: 'auto',
            master_sku: autoMapping.master_sku
          });
          
          // Save auto-mapping for future use
          await this.saveSKUMapping({
            id: `mapping_${Date.now()}_${Math.random()}`,
            supplier_sku: sku.supplier_sku,
            master_sku: autoMapping.master_sku,
            confidence_score: autoMapping.confidence_score,
            mapping_type: 'auto',
            created_at: new Date(),
            updated_at: new Date()
          });
        } else {
          // Mark as pending manual mapping
          reconciledSKUs.push({
            ...sku,
            mapping_status: 'pending'
          });
        }
      }
    }
    
    return {
      ...product,
      skus: reconciledSKUs
    };
  }

  async findSKUMapping(supplierSku: string): Promise<SKUMapping | null> {
    // Check in-memory cache first
    const cached = this.skuMappings.get(supplierSku);
    if (cached) {
      return cached;
    }
    
    // TODO: Query database for existing mapping
    // For now, return null to force auto-mapping or manual intervention
    return null;
  }

  async attemptAutoMapping(supplierSku: string): Promise<{ master_sku: string; confidence_score: number }> {
    // TODO: Query existing master SKUs from database
    const mockMasterSKUs = ['MASTER-001', 'MASTER-002', 'MASTER-003', 'SKU-A001', 'SKU-B002'];
    
    let bestMatch = { master_sku: '', confidence_score: 0 };
    
    for (const masterSku of mockMasterSKUs) {
      const similarity = this.calculateSKUSimilarity(supplierSku, masterSku);
      
      if (similarity > bestMatch.confidence_score) {
        bestMatch = {
          master_sku: masterSku,
          confidence_score: similarity
        };
      }
    }
    
    // Generate a potential master SKU if no good match found
    if (bestMatch.confidence_score < 0.5) {
      bestMatch = {
        master_sku: this.generateMasterSKU(supplierSku),
        confidence_score: 0.6
      };
    }
    
    return bestMatch;
  }

  async saveSKUMapping(mapping: SKUMapping): Promise<void> {
    // Save to in-memory cache
    this.skuMappings.set(mapping.supplier_sku, mapping);
    
    // TODO: Save to database
    this.log('info', 'SKU mapping saved', { 
      supplier_sku: mapping.supplier_sku, 
      master_sku: mapping.master_sku,
      type: mapping.mapping_type,
      confidence: mapping.confidence_score
    });
  }

  async getPendingMappings(): Promise<string[]> {
    // TODO: Query database for SKUs with pending mapping status
    return ['BL002', 'BL003'];
  }

  async createManualMapping(supplierSku: string, masterSku: string): Promise<void> {
    const mapping: SKUMapping = {
      id: `manual_${Date.now()}_${Math.random()}`,
      supplier_sku: supplierSku,
      master_sku: masterSku,
      confidence_score: 1.0,
      mapping_type: 'manual',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await this.saveSKUMapping(mapping);
    this.log('info', 'Manual SKU mapping created', { supplierSku, masterSku });
  }

  // SKU Similarity and Generation Methods
  private calculateSKUSimilarity(sku1: string, sku2: string): number {
    // Normalize SKUs for comparison
    const normalized1 = sku1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalized2 = sku2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    
    // Convert distance to similarity score (0-1)
    const similarity = maxLength === 0 ? 1 : 1 - (distance / maxLength);
    
    // Boost score for exact prefix/suffix matches
    if (normalized1.startsWith(normalized2.substring(0, 3)) || 
        normalized2.startsWith(normalized1.substring(0, 3))) {
      return Math.min(1, similarity + 0.2);
    }
    
    return similarity;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private generateMasterSKU(supplierSku: string): string {
    // Generate a master SKU based on supplier SKU
    const normalized = supplierSku.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-4);
    
    return `MST-${normalized}-${timestamp}`;
  }

  // Public methods for SKU reconciliation management
  async getSKUReconciliationReport(): Promise<SKUReconciliationResult> {
    const mapped: SKUMapping[] = Array.from(this.skuMappings.values());
    const pending = await this.getPendingMappings();
    
    // TODO: Identify conflicts (multiple suppliers mapping to same master SKU)
    const conflicts: { supplier_sku: string; candidates: string[] }[] = [];
    
    return {
      mapped,
      pending,
      conflicts
    };
  }

  async bulkCreateMappings(mappings: { supplier_sku: string; master_sku: string }[]): Promise<void> {
    for (const { supplier_sku, master_sku } of mappings) {
      await this.createManualMapping(supplier_sku, master_sku);
    }
    
    this.log('info', 'Bulk SKU mappings created', { count: mappings.length });
  }

  private async handleProductWebhook(productData: any): Promise<void> {
    this.log('info', 'Processing product webhook', { product_id: productData.id });
    
    // TODO: Normalize, reconcile and update product in database
    const normalizedProduct = this.normalize_product(productData);
    const reconciledProduct = await this.reconcileSKUs(normalizedProduct);
    this.log('info', 'Product webhook processed', { spu_id: reconciledProduct.spu.id });
  }

  private async handleInventoryWebhook(inventoryData: any): Promise<void> {
    this.log('info', 'Processing inventory webhook', inventoryData);
    
    // TODO: Update inventory in database
  }

  // Mock data for testing
  private getMockBlingProducts(): RawProduct[] {
    return [
      {
        id: "BL123",
        title: "Produto Bling A",
        description: "Produto de teste do Bling",
        vendor: "Bling Supplier",
        product_type: "Eletrônicos",
        tags: ["bling", "teste"],
        variants: [
          {
            id: "blv1",
            sku: "BL001",
            price: 25.90,
            inventory_quantity: 50,
            title: "Variação 1",
            weight: 100,
            barcode: "7891234567896"
          }
        ],
        images: ["/images/produto-bling-a.jpg"],
        created_at: "2024-01-05T08:00:00Z",
        updated_at: "2024-01-25T12:00:00Z"
      },
      {
        id: "BL456",
        title: "Produto Bling B",
        description: "Outro produto de teste do Bling",
        vendor: "Bling Supplier",
        product_type: "Casa",
        tags: ["bling", "casa"],
        variants: [
          {
            id: "blv2",
            sku: "BL002",
            price: 35.90,
            inventory_quantity: 30,
            title: "Variação 2",
            weight: 250,
            barcode: "7891234567897"
          },
          {
            id: "blv3",
            sku: "BL003",
            price: 15.90,
            inventory_quantity: 75,
            title: "Variação 3",
            weight: 80,
            barcode: "7891234567898"
          }
        ],
        images: ["/images/produto-bling-b.jpg"],
        created_at: "2024-01-03T10:30:00Z",
        updated_at: "2024-01-23T15:45:00Z"
      }
    ];
  }
}
