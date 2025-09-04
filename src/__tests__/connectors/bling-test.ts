import { BlingConnector } from './BlingConnector.js';
import { ConnectorConfig } from '../types.js';

// Test configuration for Bling connector
const blingConfig = {
  id: 'bling-test',
  name: 'Bling Test',
  type: 'bling' as const,
  credentials: {
    api_key: 'test_api_key_123' // This is a test key, real API calls will fail
  },
  isActive: true
};

async function testBlingConnector() {
  console.log('🔧 Testing Bling Connector...');
  
  const connector = new BlingConnector();
  connector.configure(blingConfig);
  
  try {
    // Test 1: Connection test
    console.log('\n1. Testing connection...');
    const connectionResult = await connector.test_connection();
    console.log('Connection test result:', connectionResult);
    
    // Test 2: Import products
    console.log('\n2. Testing product import...');
    const importResult = await connector.import_products(10, 0);
    console.log('Import result:', {
      success: importResult.success,
      products_imported: importResult.products_imported,
      products_updated: importResult.products_updated,
      products_failed: importResult.products_failed,
      duration: importResult.duration_ms
    });
    
    // Test 3: Fetch inventory
    console.log('\n3. Testing inventory fetch...');
    const inventory = await connector.fetch_inventory(['BL001', 'BL002']);
    console.log('Inventory result:', inventory);
    
    // Test 4: SKU reconciliation
    console.log('\n4. Testing SKU reconciliation...');
    const mockProduct = {
      spu: {
        id: 'test-spu-1',
        title: 'Test Product',
        description: 'A test product for reconciliation',
        vendor: 'Test Vendor',
        product_type: 'Test Type',
        tags: ['test', 'reconciliation'],
        images: [],
        supplier_id: 'bling',
        supplier_product_id: 'bling-prod-123',
        created_at: new Date(),
        updated_at: new Date()
      },
      skus: [
        {
          id: 'test-sku-1',
          spu_id: 'test-spu-1',
          supplier_sku: 'BLING-ABC123',
          title: 'Test SKU 1',
          price: 99.99,
          stock: 10,
          weight: 0.5,
          barcode: '1234567890123',
          mapping_status: 'pending' as const,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]
    };
    
    const reconciledProduct = await connector.reconcileSKUs(mockProduct);
    console.log('Reconciled product SKUs:', reconciledProduct.skus.map(sku => ({
      supplier_sku: sku.supplier_sku,
      master_sku: sku.master_sku,
      mapping_status: sku.mapping_status
    })));
    
    // Test 5: Manual SKU mapping
    console.log('\n5. Testing manual SKU mapping...');
    await connector.createManualMapping('BL002', 'MASTER-002');
    
    // Test 6: SKU reconciliation report
    console.log('\n6. Testing SKU reconciliation report...');
    const report = await connector.getSKUReconciliationReport();
    console.log('Reconciliation report:', {
      mapped_count: report.mapped.length,
      pending_count: report.pending.length,
      conflicts_count: report.conflicts.length
    });
    
    // Test 7: Bulk mappings
    console.log('\n7. Testing bulk mappings...');
    await connector.bulkCreateMappings([
      { supplier_sku: 'BL003', master_sku: 'MASTER-003' },
      { supplier_sku: 'BL004', master_sku: 'MASTER-004' }
    ]);
    
    // Test 8: Webhook processing
    console.log('\n8. Testing webhook processing...');
    const mockWebhook = {
      event: 'produto.alterado',
      data: {
        id: 'BL123',
        codigo: 'BL001',
        descricao: 'Produto Atualizado',
        preco: 29.90
      },
      timestamp: new Date().toISOString(),
      supplier: 'bling',
      headers: {
        'content-type': 'application/json'
      }
    };
    
    await connector.handle_webhook(mockWebhook);
    console.log('Webhook processed successfully');
    
    console.log('\n✅ All Bling connector tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBlingConnector().catch(console.error);
