import { NuvemShopConnector } from './NuvemShopConnector';
import { ConnectorConfig } from '../types';

// Test configuration for Nuvem Shop
const nuvemshopConfig = {
  id: 'test-nuvemshop-1',
  name: 'nuvemshop',
  type: 'nuvemshop' as const,
  credentials: {
    store_id: '123456', // Test store ID
    access_token: 'test_access_token_here', // Test access token
    webhook_secret: 'test_webhook_secret_here' // Test webhook secret
  },
  isActive: true
};

async function testNuvemShopConnector() {
  console.log('🧪 Testing Nuvem Shop Connector...');
  
  const connector = new NuvemShopConnector();
  
  try {
    // Test OAuth URL generation
    console.log('\n📋 Testing OAuth URL generation...');
    connector.configure(nuvemshopConfig);
    const oauthUrl = connector.generateOAuthUrl(
      'test_client_id',
      'https://localhost:3000/callback',
      ['read_products', 'write_products']
    );
    console.log('✅ OAuth URL generated:', oauthUrl);
    
    // Test connection (will fail with test credentials)
    console.log('\n🔗 Testing connection...');
    const isConnected = await connector.test_connection();
    console.log('Connection result:', isConnected ? '✅ Success' : '❌ Failed (expected with test credentials)');
    
    // Test webhook management (will fail with test credentials)
    console.log('\n🪝 Testing webhook management...');
    try {
      const webhooks = await connector.listWebhooks();
      console.log('✅ Webhooks listed:', webhooks.length);
      
      // Try to create a webhook
      const webhook = await connector.createWebhook(
        'https://your-app.com/webhooks/nuvemshop',
        ['product/created', 'product/updated', 'product/stock_updated']
      );
      console.log('✅ Webhook created:', webhook.id);
    } catch (error: any) {
      console.log('❌ Webhook management failed (expected with test credentials):', error.message);
    }
    
    // Test product import (will fail with test credentials)
    console.log('\n📦 Testing product import...');
    try {
      const result = await connector.import_products(10, 0);
      console.log('✅ Products imported:', result);
    } catch (error: any) {
      console.log('❌ Product import failed (expected with test credentials):', error.message);
    }
    
    // Test inventory fetch (will fail with test credentials)
    console.log('\n📊 Testing inventory fetch...');
    try {
      const inventory = await connector.fetch_inventory(['TEST-SKU-001']);
      console.log('✅ Inventory fetched:', inventory);
    } catch (error: any) {
      console.log('❌ Inventory fetch failed (expected with test credentials):', error.message);
    }
    
    // Test webhook processing
    console.log('\n🔄 Testing webhook processing...');
    const mockWebhook = {
      event: 'product/updated',
      data: {
        id: '12345',
        name: 'Test Product',
        variants: [
          {
            id: 'v1',
            sku: 'TEST-001',
            price: 99.90,
            stock: 10
          }
        ]
      },
      timestamp: new Date().toISOString(),
      supplier: 'nuvemshop',
      body: JSON.stringify({ test: 'webhook' }),
      headers: {
        'x-nuvemshop-hmac-sha256': 'test_signature'
      }
    };
    
    try {
      await connector.handle_webhook(mockWebhook);
      console.log('✅ Webhook processed successfully');
    } catch (error: any) {
      console.log('❌ Webhook processing failed:', error.message);
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🎯 Nuvem Shop Connector test completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Get real Nuvem Shop credentials from your app');
  console.log('2. Update the config with real store_id and access_token');
  console.log('3. Test with real API calls');
  console.log('\n🔗 OAuth Flow Example:');
  console.log('1. Redirect user to:', connector.generateOAuthUrl('your_client_id', 'your_redirect_uri'));
  console.log('2. Handle callback and exchange code for token');
  console.log('3. Use access_token in connector config');
  console.log('\n🪝 Webhook Setup Example:');
  console.log('- URL: https://your-app.com/webhooks/nuvemshop');
  console.log('- Events: product/created, product/updated, product/stock_updated');
  console.log('- Secret: Configure in Nuvem Shop app settings');
}

// Run the test
testNuvemShopConnector().catch(console.error);
