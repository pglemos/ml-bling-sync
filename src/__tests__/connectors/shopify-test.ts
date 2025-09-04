import { ShopifyConnector } from './ShopifyConnector';
import { ConnectorConfig } from '../types';

// Test configuration for Shopify
const shopifyConfig: ConnectorConfig = {
  id: 'shopify-test',
  name: 'Shopify Test Store',
  type: 'shopify',
  isActive: true,
  credentials: {
    shop_domain: 'test-store', // Replace with actual shop domain
    access_token: 'test-token', // Replace with actual access token
    client_id: 'test-client-id', // Replace with actual client ID
    client_secret: 'test-client-secret', // Replace with actual client secret
    webhook_secret: 'test-webhook-secret' // Replace with actual webhook secret
  }
};

async function testShopifyConnector() {
  console.log('🛍️ Testing Shopify Connector with Real API Implementation');
  console.log('=' .repeat(60));
  
  const connector = new ShopifyConnector();
  connector.configure(shopifyConfig);
  
  try {
    // Test 1: OAuth URL Generation
    console.log('\n1. Testing OAuth URL Generation...');
    const oauthUrl = connector.generateOAuthUrl(
      'https://your-app.com/auth/callback',
      ['read_products', 'read_inventory', 'write_products']
    );
    console.log('✅ OAuth URL generated:', oauthUrl);
    
    // Test 2: Connection Test (will fail with test credentials)
    console.log('\n2. Testing Connection...');
    const isConnected = await connector.test_connection();
    console.log(isConnected ? '✅ Connection successful' : '❌ Connection failed (expected with test credentials)');
    
    // Test 3: Webhook Management
    console.log('\n3. Testing Webhook Management...');
    try {
      const webhooks = await connector.listWebhooks();
      console.log('✅ Webhooks listed:', webhooks.length, 'webhooks found');
      
      // Create a test webhook (will fail with test credentials)
      const webhook = await connector.createWebhook(
        'products/update',
        'https://your-app.com/webhooks/shopify'
      );
      console.log('✅ Webhook created:', webhook.id);
    } catch (error) {
      console.log('❌ Webhook operations failed (expected with test credentials)');
    }
    
    // Test 4: Product Import (will fail with test credentials)
    console.log('\n4. Testing Product Import...');
    try {
      const importResult = await connector.import_products(10);
      console.log('✅ Products imported:', {
        success: importResult.success,
        products_imported: importResult.products_imported,
        products_updated: importResult.products_updated,
        products_failed: importResult.products_failed
      });
    } catch (error) {
      console.log('❌ Product import failed (expected with test credentials)');
    }
    
    // Test 5: Inventory Fetch (will fail with test credentials)
    console.log('\n5. Testing Inventory Fetch...');
    try {
      const inventory = await connector.fetch_inventory(['TEST-SKU-001']);
      console.log('✅ Inventory fetched:', inventory.length, 'items');
    } catch (error) {
      console.log('❌ Inventory fetch failed (expected with test credentials)');
    }
    
    // Test 6: Webhook Processing
    console.log('\n6. Testing Webhook Processing...');
    const mockWebhook = {
      event: 'products/update',
      data: {
        id: '123456789',
        title: 'Test Product',
        variants: [
          {
            id: '987654321',
            sku: 'TEST-SKU-001',
            price: '29.99',
            inventory_quantity: 100
          }
        ]
      },
      timestamp: new Date().toISOString(),
      supplier: 'shopify',
      headers: {
        'x-shopify-hmac-sha256': 'test-signature'
      }
    };
    
    try {
      await connector.handle_webhook(mockWebhook);
      console.log('✅ Webhook processed successfully');
    } catch (error) {
      console.log('❌ Webhook processing failed:', (error as Error).message);
    }
    
    console.log('\n🎉 Shopify Connector Test Completed!');
    console.log('\n📝 Notes:');
    console.log('- Replace test credentials with real Shopify app credentials');
    console.log('- OAuth flow requires a web server to handle the callback');
    console.log('- Webhooks require HTTPS endpoints for production');
    console.log('- API calls will fail with test credentials but code structure is ready');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// OAuth Flow Example
function demonstrateOAuthFlow() {
  console.log('\n🔐 OAuth Flow Example:');
  console.log('=' .repeat(40));
  console.log('1. Generate OAuth URL and redirect user');
  console.log('2. User authorizes your app on Shopify');
  console.log('3. Shopify redirects back with authorization code');
  console.log('4. Exchange code for access token');
  console.log('5. Store access token securely');
  console.log('6. Use access token for API calls');
  
  const connector = new ShopifyConnector();
  connector.configure(shopifyConfig);
  const oauthUrl = connector.generateOAuthUrl('https://your-app.com/auth/callback');
  console.log('\nOAuth URL:', oauthUrl);
  
  // Example of exchanging code for token (would be called in your callback handler)
  console.log('\n// In your callback handler:');
  console.log('const accessToken = await connector.exchangeCodeForToken(code, redirectUri);');
}

// Webhook Setup Example
function demonstrateWebhookSetup() {
  console.log('\n🪝 Webhook Setup Example:');
  console.log('=' .repeat(40));
  console.log('1. Create webhooks for events you want to monitor');
  console.log('2. Shopify will send POST requests to your endpoint');
  console.log('3. Validate webhook signatures for security');
  console.log('4. Process webhook data and update your system');
  
  console.log('\n// Example webhook topics:');
  console.log('- products/create');
  console.log('- products/update');
  console.log('- products/delete');
  console.log('- inventory_levels/update');
  console.log('- orders/create');
  console.log('- orders/updated');
}

if (require.main === module) {
  testShopifyConnector()
    .then(() => {
      demonstrateOAuthFlow();
      demonstrateWebhookSetup();
    })
    .catch(console.error);
}

export { testShopifyConnector, demonstrateOAuthFlow, demonstrateWebhookSetup };
