// Connectors package entry point
// This file exports all connector classes and types

// Base connector
export { BaseConnector } from './base/BaseConnector';

// Specific connectors
export { ShopifyConnector } from './shopify/ShopifyConnector';
export { NuvemShopConnector } from './nuvemshop/NuvemShopConnector';
export { BlingConnector } from './bling/BlingConnector';
export type { SKUMapping, SKUReconciliationResult } from './bling/BlingConnector';

// Types
export * from './types';

// Import classes for factory function
import { BaseConnector } from './base/BaseConnector';
import { ShopifyConnector } from './shopify/ShopifyConnector';
import { NuvemShopConnector } from './nuvemshop/NuvemShopConnector';
import { BlingConnector } from './bling/BlingConnector';

// Factory function to create connector instances
export function createConnector(type: 'shopify' | 'nuvemshop' | 'bling'): BaseConnector {
  switch (type) {
    case 'shopify':
      return new ShopifyConnector();
    case 'nuvemshop':
      return new NuvemShopConnector();
    case 'bling':
      return new BlingConnector();
    default:
      throw new Error(`Unknown connector type: ${type}`);
  }
}
