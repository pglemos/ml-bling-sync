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

export class ShopifyConnector extends BaseConnector {
  private shopifyApiUrl: string = '';
  private accessToken: string = '';
  protected apiClient: AxiosInstance | null = null;
  private webhookSecret: string = '';

  protected setupApiClient(): void {
    this.validateConfig();
    
    const { shop_domain, access_token, webhook_secret } = this.config!.credentials;
    this.shopifyApiUrl = `https://${shop_domain}.myshopify.com/admin/api/2023-10`;
    this.accessToken = access_token;
    this.webhookSecret = webhook_secret || '';
    
    this.apiClient = axios.create({
      baseURL: this.shopifyApiUrl,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    this.log('info', 'Shopify API client configured', { shop_domain });
  }

  async test_connection(): Promise<boolean> {
    try {
      this.validateConfig();
      this.setupApiClient();
      
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }
      
      this.log('info', 'Testing Shopify connection...');
      
      // Test connection by fetching shop information
      const response = await this.apiClient.get('/shop.json');
      
      if (response.status === 200 && response.data.shop) {
        this.log('info', 'Shopify connection test successful', {
          shop_name: response.data.shop.name,
          shop_id: response.data.shop.id
        });
        return true;
      }
      
      throw new Error('Invalid response from Shopify API');
    } catch (error: any) {
      const errorMsg = error.response?.data?.errors || error.message || 'Unknown error';
      this.log('error', 'Shopify connection test failed', { error: errorMsg });
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
      
      this.log('info', 'Starting Shopify product import', { limit, offset });

      // Fetch products from Shopify API
      const response = await this.apiClient.get('/products.json', {
        params: {
          limit: Math.min(limit, 250), // Shopify max limit is 250
          page_info: offset > 0 ? this.generatePageInfo(offset) : undefined,
          fields: 'id,title,body_html,vendor,product_type,tags,variants,images,created_at,updated_at'
        }
      });
      
      const products = response.data.products || [];
      
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
      this.log('info', 'Shopify import completed', result);
      
      return result;
    } catch (error) {
      const errorMsg = `Shopify import failed: ${error}`;
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
      
      this.log('info', 'Fetching Shopify inventory', { skus_count: skus?.length });

      const inventory: InventoryUpdate[] = [];
      
      if (skus && skus.length > 0) {
        // Fetch specific SKUs
        for (const sku of skus) {
          try {
            const response = await this.apiClient.get('/products.json', {
              params: {
                fields: 'variants',
                limit: 250
              }
            });
            
            for (const product of response.data.products || []) {
              for (const variant of product.variants || []) {
                if (variant.sku === sku) {
                  inventory.push({
                    sku: variant.sku,
                    quantity: variant.inventory_quantity || 0,
                    price: parseFloat(variant.price) || 0
                  });
                }
              }
            }
          } catch (error) {
            this.log('warn', `Failed to fetch inventory for SKU ${sku}`, error);
          }
        }
      } else {
        // Fetch all inventory
        const response = await this.apiClient.get('/products.json', {
          params: {
            fields: 'variants',
            limit: 250
          }
        });
        
        for (const product of response.data.products || []) {
          for (const variant of product.variants || []) {
            if (variant.sku) {
              inventory.push({
                sku: variant.sku,
                quantity: variant.inventory_quantity || 0,
                price: parseFloat(variant.price) || 0
              });
            }
          }
        }
      }

      this.log('info', 'Shopify inventory fetched', { count: inventory.length });
      return inventory;
    } catch (error: any) {
      this.log('error', 'Failed to fetch Shopify inventory', error);
      return [];
    }
  }

  async handle_webhook(payload: WebhookPayload): Promise<void> {
    try {
      // Validate webhook signature if secret is configured
      if (this.webhookSecret && payload.headers) {
        const isValid = this.validateWebhookSignature(
          JSON.stringify(payload.data),
          payload.headers['x-shopify-hmac-sha256'] || '',
          this.webhookSecret
        );
        
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }
      
      this.log('info', 'Processing Shopify webhook', { event: payload.event });

      switch (payload.event) {
        case 'products/create':
        case 'products/update':
          await this.handleProductWebhook(payload.data);
          break;
        case 'inventory_levels/update':
          await this.handleInventoryWebhook(payload.data);
          break;
        default:
          this.log('warn', 'Unhandled Shopify webhook event', { event: payload.event });
      }
    } catch (error) {
      this.log('error', 'Failed to process Shopify webhook', error);
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

  // OAuth methods
  public generateOAuthUrl(redirectUri: string, scopes: string[] = ['read_products', 'read_inventory']): string {
    const { shop_domain, client_id } = this.config!.credentials;
    const state = crypto.randomBytes(16).toString('hex');
    
    const params = new URLSearchParams({
      client_id,
      scope: scopes.join(','),
      redirect_uri: redirectUri,
      state,
      response_type: 'code'
    });
    
    return `https://${shop_domain}.myshopify.com/admin/oauth/authorize?${params.toString()}`;
  }

  public async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
    const { shop_domain, client_id, client_secret } = this.config!.credentials;
    
    try {
      const response = await axios.post(`https://${shop_domain}.myshopify.com/admin/oauth/access_token`, {
        client_id,
        client_secret,
        code,
        redirect_uri: redirectUri
      });
      
      return response.data.access_token;
    } catch (error: any) {
      this.log('error', 'Failed to exchange code for token', error);
      throw new Error('OAuth token exchange failed');
    }
  }

  // Webhook validation
  private validateWebhookSignature(body: string, signature: string, secret: string): boolean {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(body, 'utf8');
      const hash = hmac.digest('base64');
      
      // Ensure both buffers have the same length for comparison
      const hashBuffer = Buffer.from(hash);
      const signatureBuffer = Buffer.from(signature);
      
      if (hashBuffer.length !== signatureBuffer.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(hashBuffer, signatureBuffer);
    } catch (error) {
      this.log('error', 'Webhook signature validation failed', error);
      return false;
    }
  }

  // Pagination helper
  private generatePageInfo(offset: number): string {
    // Simple implementation - in production, use proper cursor-based pagination
    return Buffer.from(`offset:${offset}`).toString('base64');
  }

  // Webhook management
  public async createWebhook(topic: string, address: string): Promise<any> {
    try {
      this.setupApiClient();
      
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }
      
      const response = await this.apiClient.post('/webhooks.json', {
        webhook: {
          topic,
          address,
          format: 'json'
        }
      });
      
      this.log('info', 'Webhook created', { topic, address, id: response.data.webhook.id });
      return response.data.webhook;
    } catch (error: any) {
      this.log('error', 'Failed to create webhook', error);
      throw error;
    }
  }

  public async deleteWebhook(webhookId: string): Promise<void> {
    try {
      this.setupApiClient();
      
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }
      
      await this.apiClient.delete(`/webhooks/${webhookId}.json`);
      this.log('info', 'Webhook deleted', { webhookId });
    } catch (error: any) {
      this.log('error', 'Failed to delete webhook', error);
      throw error;
    }
  }

  public async listWebhooks(): Promise<any[]> {
    try {
      this.setupApiClient();
      
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }
      
      const response = await this.apiClient.get('/webhooks.json');
      return response.data.webhooks || [];
    } catch (error: any) {
      this.log('error', 'Failed to list webhooks', error);
      return [];
    }
  }

  // Mock data for testing
  private getMockShopifyProducts(): RawProduct[] {
    return [
      {
        id: "123",
        title: "Camisa Polo Masculina",
        description: "Camisa polo de alta qualidade em algodão",
        vendor: "Fashion Brand",
        product_type: "Roupas",
        tags: ["polo", "masculino", "algodão"],
        variants: [
          {
            id: "v1",
            sku: "POLO-01",
            price: 89.90,
            inventory_quantity: 10,
            title: "P",
            weight: 200,
            barcode: "7891234567890"
          },
          {
            id: "v2",
            sku: "POLO-02",
            price: 89.90,
            inventory_quantity: 15,
            title: "M",
            weight: 220,
            barcode: "7891234567891"
          }
        ],
        images: ["/images/polo-azul.jpg"],
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T14:30:00Z"
      },
      {
        id: "456",
        title: "Calça Jeans Feminina",
        description: "Calça jeans skinny com elastano",
        vendor: "Denim Co",
        product_type: "Roupas",
        tags: ["jeans", "feminino", "skinny"],
        variants: [
          {
            id: "v3",
            sku: "JEANS-01",
            price: 129.90,
            inventory_quantity: 8,
            title: "36",
            weight: 400,
            barcode: "7891234567892"
          }
        ],
        images: ["/images/jeans-azul.jpg"],
        created_at: "2024-01-10T09:00:00Z",
        updated_at: "2024-01-18T16:45:00Z"
      }
    ];
  }
}
