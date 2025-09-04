const { BlingConnector } = require('./dist/bling/BlingConnector.js');

const blingConfig = {
  type: 'bling',
  credentials: {
    api_key: 'test-api-key' // Replace with actual API key
  }
};

async function testBlingConnector() {
  console.log('🔧 Testing Bling Connector with Real API Implementation');
  console.log('=' .repeat(60));
  
  const connector = new BlingConnector();
  connector.configure(blingConfig);
  
  try {
    // Test 1: Connection test
    console.log('\n1. Testing connection...');
    const isConnected = await connector.test_connection();
    console.log('Connection result:', isConnected ? '✅ Connected' : '❌ Failed');
    
    // Test 2: Import products
    console.log('\n2. Testing product import...');
    const importResult = await connector.import_products(5, 0);
    console.log('Import result:', {
      success: importResult.success,
      products_imported: importResult.products_imported,
      products_updated: importResult.products_updated,
      products_failed: importResult.products_failed,
      duration: importResult.duration_ms
    });
    
    // Test 3: Fetch inventory
    console.log('\n3. Testing inventory fetch...');
    const inventory = await connector.fetch_inventory();
    console.log('Inventory items found:', inventory.length);
    if (inventory.length > 0) {
      console.log('Sample inventory item:', inventory[0]);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testBlingConnector().catch(console.error);