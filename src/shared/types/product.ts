export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  images: string[];
  marketplaces: string[];
  provider: 'manual' | 'imported';
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  sync_status: {
    mercadolivre: 'synced' | 'not_synced' | 'error';
    shopee: 'synced' | 'not_synced' | 'error';
    amazon: 'synced' | 'not_synced' | 'error';
    magalu: 'synced' | 'not_synced' | 'error';
  };
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    low_stock: number;
  };
}

export interface ProductFilters {
  search: string;
  category: string;
  status: string;
  marketplace: string;
  priceRange: [number, number];
  stockRange: [number, number];
}

export interface UploadResponse {
  url: string;
  key: string;
  size: number;
  type: string;
  name: string;
}
