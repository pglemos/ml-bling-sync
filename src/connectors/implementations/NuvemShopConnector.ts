import { BaseConnector } from '../base/BaseConnector';
import { 
  SyncResult, 
  WebhookPayload, 
  InventoryUpdate, 
  RawProduct,
  NormalizedProduct 
} from '../types';
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

export class NuvemShopConnector extends BaseConnector {
  private nuvemshopApiUrl: string = '';
  private accessToken: string = '';
  private storeId: string = '';
  protected apiClient: AxiosInstance | null = null;
  private webhookSecret: string = '';

  protected setupApiClient(): void {
    this.validateConfig();
    
    const { store_id, access_token, webhook_secret } = this.config!.credentials;
    this.storeId = store_id;
    this.accessToken = access_token;
    this.webhookSecret = webhook_secret || '';
    this.nuvemshopApiUrl = `https://api.nuvemshop.com.br/v1/${store_id}`;
    
    this.apiClient = axios.create({
      baseURL: this.nuvemshopApiUrl,
      headers: {
        'Authentication': `bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ML-Bling-Sync/1.0'
      },
      timeout: 30000
    });
    
    this.log('info', 'Nuvem Shop API client configured', { store_id });
  }

  async test_connection(): Promise<boolean> {
    try {
      this.validateConfig();
      this.setupApiClient();
      
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }
      
      this.log('info', 'Testing Nuvem Shop connection...');
      
      // Test connection by fetching store information
      const response = await this.apiClient.get('/store');
      
      if (response.status === 200 && response.data) {
        this.log('info', 'Nuvem Shop connection test successful', {
          store_name: response.data.name,
          store_id: response.data.id
        });
        return true;
      }
      
      throw new Error('Invalid response from Nuvem Shop API');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      this.log('error', 'Nuvem Shop connection test failed', { error: errorMsg });
      return false;
    }
  }

  async import_products(limit: number = 50, offset: number = 0): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      this.validateConfig();
      this.setupApiClient();
      
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }
      
      this.log('info', 'Starting Nuvem Shop product import', { limit, offset });

      // Fetch products from Nuvem Shop API
      const response = await this.apiClient.get('/products', {
        params: {
          per_page: Math.min(limit, 200), // Nuvem Shop max limit is 200
          page: Math.floor(offset / limit) + 1,
          fields: 'id,name,description,brand,category,variants,images,created_at,updated_at,published'
        }
      });
      
      const products = response.data || [];
      
      let imported = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const rawProduct of products) {
        try {
          if (!this.validateProduct(rawProduct)) {
            failed++;
            continue;
          }

          const normalizedProduct = this.normalize_product(rawProduct);
          
          // TODO: Save to database
          this.log('info', 'Product normalized', { 
            spu_id: normalizedProduct.spu.id, 
            skus_count: normalizedProduct.skus.length 
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
      this.log('info', 'Nuvem Shop import completed', result);
      
      return result;
    } catch (error) {
      const errorMsg = `Nuvem Shop import failed: ${error}`;
      this.log('error', errorMsg);
      return this.createSyncResult(false, 0, 0, 0, [errorMsg], startTime);
    }
  }

  async fetch_inventory(skus?: string[]): Promise<InventoryUpdate[]> {
    try {
      this.validateConfig();
      this.setupApiClient();
      
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }
      
      this.log('info', 'Fetching Nuvem Shop inventory', { skus_count: skus?.length });

      const inventoryUpdates: InventoryUpdate[] = [];
      
      if (skus && skus.length > 0) {
        // Fetch specific variants by SKU
        for (const sku of skus) {
          try {
            const response = await this.apiClient.get('/products', {
              params: {
                q: sku,
                fields: 'variants'
              }
            });
            
            const products = response.data || [];
            for (const product of products) {
              if (product.variants) {
                for (const variant of product.variants) {
                  if (variant.sku === sku) {
                    inventoryUpdates.push({
                      sku: variant.sku,
                      quantity: variant.stock || 0,
                      price: parseFloat(variant.price) || 0
                    });
                  }
                }
              }
            }
          } catch (error) {
            this.log('warn', `Failed to fetch inventory for SKU ${sku}`, error);
          }
        }
      } else {
        // Fetch all products with variants
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          try {
            const response = await this.apiClient.get('/products', {
              params: {
                page,
                per_page: 200,
                fields: 'variants'
              }
            });
            
            const products = response.data || [];
            
            if (products.length === 0) {
              hasMore = false;
              break;
            }
            
            for (const product of products) {
              if (product.variants) {
                for (const variant of product.variants) {
                  if (variant.sku) {
                    inventoryUpdates.push({
                      sku: variant.sku,
                      quantity: variant.stock || 0,
                      price: parseFloat(variant.price) || 0
                    });
                  }
                }
              }
            }
            
            page++;
            if (products.length < 200) {
              hasMore = false;
            }
          } catch (error) {
            this.log('warn', `Failed to fetch inventory page ${page}`, error);
            hasMore = false;
          }
        }
      }

      this.log('info', 'Nuvem Shop inventory fetched', { count: inventoryUpdates.length });
      return inventoryUpdates;
    } catch (error) {
      this.log('error', 'Failed to fetch Nuvem Shop inventory', error);
      return [];
    }
  }

  async handle_webhook(payload: WebhookPayload): Promise<void> {
    try {
      this.log('info', 'Processing Nuvem Shop webhook', { event: payload.event });
      
      // Validate webhook signature if secret is configured
      if (this.webhookSecret && payload.headers) {
        const signature = payload.headers['x-nuvemshop-hmac-sha256'];
        if (!signature || !this.validateWebhookSignature(JSON.stringify(payload.data) || '', signature)) {
          this.log('error', 'Invalid webhook signature');
          throw new Error('Invalid webhook signature');
        }
      }

      switch (payload.event) {
        case 'product/created':
        case 'product/updated':
          await this.handleProductWebhook(payload.data);
          break;
        case 'product/stock_updated':
          await this.handleInventoryWebhook(payload.data);
          break;
        default:
          this.log('warn', 'Unhandled Nuvem Shop webhook event', { event: payload.event });
      }
    } catch (error) {
      this.log('error', 'Failed to process Nuvem Shop webhook', error);
      throw error;
    }
  }

  private async handleProductWebhook(productData: any): Promise<void> {
    this.log('info', 'Processing product webhook', { product_id: productData.id });
    
    // TODO: Normalize and update product in database
    const normalizedProduct = this.normalize_product(productData);
    this.log('info', 'Product webhook processed', { spu_id: normalizedProduct.spu.id });
  }

  private async handleInventoryWebhook(inventoryData: any): Promise<void> {
    this.log('info', 'Processing inventory webhook', inventoryData);
    
    // TODO: Update inventory in database
  }

  // Mock data for testing
  private getMockNuvemShopProducts(): RawProduct[] {
    return [
      {
        id: "789",
        title: "Camiseta Básica Unissex",
        description: "Camiseta 100% algodão, corte unissex",
        vendor: "Basic Wear",
        product_type: "Roupas",
        tags: ["camiseta", "unissex", "básica"],
        variants: [
          {
            id: "v4",
            sku: "TSHIRT-01",
            price: 49.90,
            inventory_quantity: 25,
            title: "P - Branco",
            weight: 150,
            barcode: "7891234567893"
          },
          {
            id: "v5",
            sku: "TSHIRT-02",
            price: 54.90,
            inventory_quantity: 18,
            title: "M - Preto",
            weight: 160,
            barcode: "7891234567894"
          }
        ],
        images: ["/images/camiseta-basica.jpg"],
        created_at: "2024-01-12T11:00:00Z",
        updated_at: "2024-01-22T09:15:00Z"
      },
      {
        id: "101112",
        title: "Bermuda Moletom",
        description: "Bermuda em moletom com bolsos",
        vendor: "Comfort Zone",
        product_type: "Roupas",
        tags: ["bermuda", "moletom", "casual"],
        variants: [
          {
            id: "v6",
            sku: "SHORTS-01",
            price: 79.90,
            inventory_quantity: 12,
            title: "M - Cinza",
            weight: 300,
            barcode: "7891234567895"
          }
        ],
        images: ["/images/bermuda-moletom.jpg"],
        created_at: "2024-01-08T14:00:00Z",
        updated_at: "2024-01-19T11:20:00Z"
      }
    ];
  }

  // OAuth methods
  generateOAuthUrl(clientId: string, redirectUri: string, scopes: string[] = ['read_products', 'write_products']): string {
    const baseUrl = 'https://www.nuvemshop.com.br/apps/authorize/token';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' ')
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, clientId: string, clientSecret: string): Promise<any> {
    try {
      const response = await axios.post('https://www.nuvemshop.com.br/apps/authorize/token', {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code'
      });
      
      return response.data;
    } catch (error: any) {
      this.log('error', 'Failed to exchange code for token', error.response?.data || error.message);
      throw error;
    }
  }

  // Webhook validation
  private validateWebhookSignature(body: string, signature: string): boolean {
    try {
      if (!this.webhookSecret) {
        this.log('warn', 'Webhook secret not configured, skipping validation');
        return true;
      }
      
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body, 'utf8')
        .digest('base64');
      
      const providedSignature = signature.replace('sha256=', '');
      
      // Check if lengths match before comparison
      if (expectedSignature.length !== providedSignature.length) {
        this.log('warn', 'Webhook signature length mismatch');
        return false;
      }
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'base64'),
        Buffer.from(providedSignature, 'base64')
      );
    } catch (error) {
      this.log('error', 'Error validating webhook signature', error);
      return false;
    }
  }

  // Webhook management
  async createWebhook(url: string, events: string[]): Promise<any> {
    try {
      this.setupApiClient();
      
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }
      
      const response = await this.apiClient.post('/webhooks', {
        webhook: {
          url: url,
          event: events.join(','),
          format: 'json'
        }
      });
      
      this.log('info', 'Webhook created successfully', { webhook_id: response.data.id });
      return response.data;
    } catch (error: any) {
      this.log('error', 'Failed to create webhook', error.response?.data || error.message);
      throw error;
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      this.setupApiClient();
      
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }
      
      await this.apiClient.delete(`/webhooks/${webhookId}`);
      this.log('info', 'Webhook deleted successfully', { webhook_id: webhookId });
    } catch (error: any) {
      this.log('error', 'Failed to delete webhook', error.response?.data || error.message);
      throw error;
    }
  }

  async listWebhooks(): Promise<any[]> {
    try {
      this.setupApiClient();
      
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }
      
      const response = await this.apiClient.get('/webhooks');
      return response.data || [];
    } catch (error: any) {
      this.log('error', 'Failed to list webhooks', error.response?.data || error.message);
      return [];
    }
  }
}
