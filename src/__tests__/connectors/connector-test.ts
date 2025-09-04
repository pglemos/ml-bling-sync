// Test file to demonstrate connector functionality
// This file shows how to use the connector system

import { 
  createConnector, 
  ShopifyConnector, 
  NuvemShopConnector, 
  BlingConnector,
  ConnectorConfig 
} from '../index';

// Test configurations
const shopifyConfig: ConnectorConfig = {
  id: 'shopify-test',
  name: 'Test Shopify Store',
  type: 'shopify',
  credentials: {
    shop_domain: 'test-store',
    access_token: 'test-token'
  },
  isActive: true
};

const nuvemshopConfig: ConnectorConfig = {
  id: 'nuvemshop-test',
  name: 'Test Nuvem Shop Store',
  type: 'nuvemshop',
  credentials: {
    store_id: '12345',
    access_token: 'test-token'
  },
  isActive: true
};

const blingConfig: ConnectorConfig = {
  id: 'bling-test',
  name: 'Test Bling Integration',
  type: 'bling',
  credentials: {
    api_key: 'test-api-key'
  },
  isActive: true
};

// Test function to demonstrate connector usage
export async function testConnectors() {
  console.log('🚀 Testing ML Bling Sync Connectors');
  console.log('=====================================\n');

  // Test Shopify Connector
  console.log('📦 Testing Shopify Connector...');
  const shopifyConnector = createConnector('shopify') as ShopifyConnector;
  shopifyConnector.configure(shopifyConfig);
  
  const shopifyConnectionTest = await shopifyConnector.test_connection();
  console.log(`✅ Shopify connection: ${shopifyConnectionTest ? 'SUCCESS' : 'FAILED'}`);
  
  const shopifyImportResult = await shopifyConnector.import_products(10);
  console.log(`📊 Shopify import: ${shopifyImportResult.products_imported} products imported`);
  
  const shopifyInventory = await shopifyConnector.fetch_inventory(['POLO-01']);
  console.log(`📋 Shopify inventory: ${shopifyInventory.length} items fetched\n`);

  // Test Nuvem Shop Connector
  console.log('🛍️ Testing Nuvem Shop Connector...');
  const nuvemshopConnector = createConnector('nuvemshop') as NuvemShopConnector;
  nuvemshopConnector.configure(nuvemshopConfig);
  
  const nuvemshopConnectionTest = await nuvemshopConnector.test_connection();
  console.log(`✅ Nuvem Shop connection: ${nuvemshopConnectionTest ? 'SUCCESS' : 'FAILED'}`);
  
  const nuvemshopImportResult = await nuvemshopConnector.import_products(10);
  console.log(`📊 Nuvem Shop import: ${nuvemshopImportResult.products_imported} products imported`);
  
  const nuvemshopInventory = await nuvemshopConnector.fetch_inventory(['TSHIRT-01']);
  console.log(`📋 Nuvem Shop inventory: ${nuvemshopInventory.length} items fetched\n`);

  // Test Bling Connector
  console.log('🔗 Testing Bling Connector...');
  const blingConnector = createConnector('bling') as BlingConnector;
  blingConnector.configure(blingConfig);
  
  const blingConnectionTest = await blingConnector.test_connection();
  console.log(`✅ Bling connection: ${blingConnectionTest ? 'SUCCESS' : 'FAILED'}`);
  
  const blingImportResult = await blingConnector.import_products(10);
  console.log(`📊 Bling import: ${blingImportResult.products_imported} products imported`);
  
  const blingInventory = await blingConnector.fetch_inventory(['BL001']);
  console.log(`📋 Bling inventory: ${blingInventory.length} items fetched`);
  
  const pendingMappings = await blingConnector.getPendingMappings();
  console.log(`🔄 Bling pending mappings: ${pendingMappings.length} SKUs need manual mapping\n`);

  console.log('✨ All connector tests completed!');
  
  return {
    shopify: {
      connection: shopifyConnectionTest,
      import: shopifyImportResult,
      inventory: shopifyInventory.length
    },
    nuvemshop: {
      connection: nuvemshopConnectionTest,
      import: nuvemshopImportResult,
      inventory: nuvemshopInventory.length
    },
    bling: {
      connection: blingConnectionTest,
      import: blingImportResult,
      inventory: blingInventory.length,
      pendingMappings: pendingMappings.length
    }
  };
}

// Example webhook handling
export async function testWebhookHandling() {
  console.log('🔔 Testing Webhook Handling...');
  
  const shopifyConnector = createConnector('shopify') as ShopifyConnector;
  shopifyConnector.configure(shopifyConfig);
  
  // Mock webhook payload
  const mockWebhook = {
    event: 'products/update',
    timestamp: new Date().toISOString(),
    supplier: 'shopify',
    data: {
      id: '123',
      title: 'Updated Product',
      variants: [{
        id: 'v1',
        sku: 'UPDATED-SKU',
        price: 99.90,
        inventory_quantity: 5
      }]
    }
  };
  
  try {
    await shopifyConnector.handle_webhook(mockWebhook);
    console.log('✅ Webhook processed successfully');
  } catch (error) {
    console.log('❌ Webhook processing failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testConnectors()
    .then(() => testWebhookHandling())
    .catch(console.error);
}
