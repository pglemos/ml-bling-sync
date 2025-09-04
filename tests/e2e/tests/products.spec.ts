import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carregar dados de teste
const testDataPath = join(__dirname, '..', 'test-data.json');
let testData: any;

try {
  testData = JSON.parse(readFileSync(testDataPath, 'utf-8'));
} catch {
  testData = {
    users: [{ email: 'admin@test.com', password: 'admin123', role: 'admin', name: 'Admin Test' }],
    tenant: { id: 'test-tenant-123', name: 'Test Tenant' },
    products: [
      {
        id: 'prod-123',
        sku: 'TEST-001',
        name: 'Produto Teste 1',
        price: 99.99,
        stock: 50,
        category: 'Eletrônicos',
        status: 'active'
      },
      {
        id: 'prod-456',
        sku: 'TEST-002',
        name: 'Produto Teste 2',
        price: 149.99,
        stock: 25,
        category: 'Roupas',
        status: 'inactive'
      }
    ]
  };
}

test.describe('Produtos', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    const user = testData.users.find((u: any) => u.role === 'admin');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Navegar para produtos
    await page.goto('/dashboard/products');
  });

  test('deve exibir a lista de produtos corretamente', async ({ page }) => {
    // Interceptar requisição de produtos
    await page.route('**/api/products**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: testData.products,
          total: testData.products.length,
          page: 1,
          per_page: 20
        })
      });
    });
    
    // Verificar elementos principais
    await expect(page.locator('h1')).toContainText('Produtos');
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-product-button"]')).toBeVisible();
    
    // Verificar filtros e busca
    await expect(page.locator('[data-testid="search-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-filter"]')).toBeVisible();
    
    // Verificar colunas da tabela
    const table = page.locator('[data-testid="products-table"]');
    await expect(table.locator('th')).toContainText(['SKU', 'Nome', 'Categoria', 'Preço', 'Estoque', 'Status', 'Ações']);
    
    // Verificar produtos na tabela
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(testData.products.length);
    
    // Verificar primeiro produto
    const firstRow = rows.first();
    await expect(firstRow.locator('[data-testid="product-sku"]')).toContainText('TEST-001');
    await expect(firstRow.locator('[data-testid="product-name"]')).toContainText('Produto Teste 1');
    await expect(firstRow.locator('[data-testid="product-price"]')).toContainText('R$ 99,99');
  });

  test('deve permitir buscar produtos', async ({ page }) => {
    // Interceptar requisição de busca
    await page.route('**/api/products?search=*', async route => {
      const url = new URL(route.request().url());
      const searchTerm = url.searchParams.get('search');
      
      const filteredProducts = testData.products.filter((p: any) => 
        p.name.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
        p.sku.toLowerCase().includes(searchTerm?.toLowerCase() || '')
      );
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: filteredProducts,
          total: filteredProducts.length,
          page: 1,
          per_page: 20
        })
      });
    });
    
    // Realizar busca
    await page.fill('[data-testid="search-products"]', 'Teste 1');
    await page.keyboard.press('Enter');
    
    // Verificar resultados
    const rows = page.locator('[data-testid="products-table"] tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('[data-testid="product-name"]')).toContainText('Produto Teste 1');
    
    // Limpar busca
    await page.fill('[data-testid="search-products"]', '');
    await page.keyboard.press('Enter');
    
    // Verificar que todos os produtos voltaram
    await expect(rows).toHaveCount(testData.products.length);
  });

  test('deve filtrar produtos por categoria', async ({ page }) => {
    // Interceptar requisição de filtro
    await page.route('**/api/products?category=*', async route => {
      const url = new URL(route.request().url());
      const category = url.searchParams.get('category');
      
      const filteredProducts = testData.products.filter((p: any) => 
        p.category === category
      );
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: filteredProducts,
          total: filteredProducts.length,
          page: 1,
          per_page: 20
        })
      });
    });
    
    // Aplicar filtro de categoria
    await page.selectOption('[data-testid="category-filter"]', 'Eletrônicos');
    
    // Verificar resultados
    const rows = page.locator('[data-testid="products-table"] tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('[data-testid="product-category"]')).toContainText('Eletrônicos');
    
    // Limpar filtro
    await page.selectOption('[data-testid="category-filter"]', '');
    await expect(rows).toHaveCount(testData.products.length);
  });

  test('deve filtrar produtos por status', async ({ page }) => {
    // Interceptar requisição de filtro
    await page.route('**/api/products?status=*', async route => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      
      const filteredProducts = testData.products.filter((p: any) => 
        p.status === status
      );
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: filteredProducts,
          total: filteredProducts.length,
          page: 1,
          per_page: 20
        })
      });
    });
    
    // Aplicar filtro de status
    await page.selectOption('[data-testid="status-filter"]', 'active');
    
    // Verificar resultados
    const rows = page.locator('[data-testid="products-table"] tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('[data-testid="product-status"]')).toHaveClass(/active/);
  });

  test('deve adicionar novo produto', async ({ page }) => {
    // Interceptar requisição de criação
    await page.route('**/api/products', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'prod-789',
            sku: 'NEW-001',
            name: 'Produto Novo',
            price: 199.99,
            stock: 100,
            category: 'Casa',
            status: 'active'
          })
        });
      }
    });
    
    // Clicar no botão de adicionar produto
    await page.click('[data-testid="add-product-button"]');
    
    // Verificar modal de novo produto
    await expect(page.locator('[data-testid="product-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Novo Produto');
    
    // Preencher formulário
    await page.fill('[data-testid="product-sku"]', 'NEW-001');
    await page.fill('[data-testid="product-name"]', 'Produto Novo');
    await page.fill('[data-testid="product-description"]', 'Descrição do produto novo');
    await page.fill('[data-testid="product-price"]', '199.99');
    await page.fill('[data-testid="product-stock"]', '100');
    await page.selectOption('[data-testid="product-category"]', 'Casa');
    
    // Adicionar imagem
    await page.click('[data-testid="add-image-button"]');
    await page.fill('[data-testid="image-url"]', 'https://example.com/image.jpg');
    await page.fill('[data-testid="image-alt"]', 'Imagem do produto');
    
    // Configurações avançadas
    await page.click('[data-testid="advanced-settings-toggle"]');
    await page.fill('[data-testid="product-weight"]', '1.5');
    await page.fill('[data-testid="product-dimensions"]', '10x20x30');
    await page.check('[data-testid="track-inventory"]');
    
    // Salvar produto
    await page.click('[data-testid="save-product-button"]');
    
    // Verificar notificação de sucesso
    await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Produto criado com sucesso');
    
    // Verificar que o modal foi fechado
    await expect(page.locator('[data-testid="product-modal"]')).not.toBeVisible();
  });

  test('deve validar campos obrigatórios ao adicionar produto', async ({ page }) => {
    // Clicar no botão de adicionar produto
    await page.click('[data-testid="add-product-button"]');
    
    // Tentar salvar sem preencher campos obrigatórios
    await page.click('[data-testid="save-product-button"]');
    
    // Verificar mensagens de erro
    await expect(page.locator('[data-testid="sku-error"]')).toContainText('SKU é obrigatório');
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Nome é obrigatório');
    await expect(page.locator('[data-testid="price-error"]')).toContainText('Preço é obrigatório');
    
    // Preencher apenas SKU
    await page.fill('[data-testid="product-sku"]', 'TEST-SKU');
    
    // Verificar que erro do SKU desapareceu
    await expect(page.locator('[data-testid="sku-error"]')).not.toBeVisible();
    
    // Verificar que outros erros ainda estão presentes
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-error"]')).toBeVisible();
  });

  test('deve editar produto existente', async ({ page }) => {
    // Interceptar requisição de edição
    await page.route('**/api/products/prod-123', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...testData.products[0],
            name: 'Produto Editado',
            price: 129.99
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(testData.products[0])
        });
      }
    });
    
    // Clicar no botão de editar do primeiro produto
    await page.click('[data-testid="edit-product-prod-123"]');
    
    // Verificar modal de edição
    await expect(page.locator('[data-testid="product-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Editar Produto');
    
    // Verificar que os campos estão preenchidos
    await expect(page.locator('[data-testid="product-sku"]')).toHaveValue('TEST-001');
    await expect(page.locator('[data-testid="product-name"]')).toHaveValue('Produto Teste 1');
    await expect(page.locator('[data-testid="product-price"]')).toHaveValue('99.99');
    
    // Editar campos
    await page.fill('[data-testid="product-name"]', 'Produto Editado');
    await page.fill('[data-testid="product-price"]', '129.99');
    
    // Salvar alterações
    await page.click('[data-testid="save-product-button"]');
    
    // Verificar notificação de sucesso
    await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Produto atualizado com sucesso');
  });

  test('deve excluir produto', async ({ page }) => {
    // Interceptar requisição de exclusão
    await page.route('**/api/products/prod-123', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 204
        });
      }
    });
    
    // Clicar no botão de excluir
    await page.click('[data-testid="delete-product-prod-123"]');
    
    // Verificar modal de confirmação
    await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmation-message"]')).toContainText('Tem certeza que deseja excluir este produto?');
    
    // Confirmar exclusão
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Verificar notificação de sucesso
    await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Produto excluído com sucesso');
    
    // Verificar que o produto foi removido da tabela
    const rows = page.locator('[data-testid="products-table"] tbody tr');
    await expect(rows).toHaveCount(testData.products.length - 1);
  });

  test('deve cancelar exclusão de produto', async ({ page }) => {
    // Clicar no botão de excluir
    await page.click('[data-testid="delete-product-prod-123"]');
    
    // Verificar modal de confirmação
    await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible();
    
    // Cancelar exclusão
    await page.click('[data-testid="cancel-delete-button"]');
    
    // Verificar que o modal foi fechado
    await expect(page.locator('[data-testid="delete-confirmation-modal"]')).not.toBeVisible();
    
    // Verificar que o produto ainda está na tabela
    const rows = page.locator('[data-testid="products-table"] tbody tr');
    await expect(rows).toHaveCount(testData.products.length);
  });

  test('deve visualizar detalhes do produto', async ({ page }) => {
    // Interceptar requisição de detalhes
    await page.route('**/api/products/prod-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...testData.products[0],
          description: 'Descrição detalhada do produto',
          images: [
            { url: 'https://example.com/image1.jpg', alt: 'Imagem 1' },
            { url: 'https://example.com/image2.jpg', alt: 'Imagem 2' }
          ],
          variants: [
            { id: 'var-1', name: 'Tamanho P', price: 99.99, stock: 20 },
            { id: 'var-2', name: 'Tamanho M', price: 99.99, stock: 30 }
          ],
          sync_history: [
            { date: '2024-01-15T10:00:00Z', action: 'created', source: 'bling' },
            { date: '2024-01-14T15:30:00Z', action: 'updated', source: 'manual' }
          ]
        })
      });
    });
    
    // Clicar no nome do produto para ver detalhes
    await page.click('[data-testid="product-name-prod-123"]');
    
    // Verificar página de detalhes
    await expect(page).toHaveURL('/dashboard/products/prod-123');
    await expect(page.locator('h1')).toContainText('Produto Teste 1');
    
    // Verificar seções de detalhes
    await expect(page.locator('[data-testid="product-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-images"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-variants"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-history"]')).toBeVisible();
    
    // Verificar informações básicas
    await expect(page.locator('[data-testid="product-sku"]')).toContainText('TEST-001');
    await expect(page.locator('[data-testid="product-price"]')).toContainText('R$ 99,99');
    await expect(page.locator('[data-testid="product-stock"]')).toContainText('50');
    
    // Verificar imagens
    const images = page.locator('[data-testid="product-image"]');
    await expect(images).toHaveCount(2);
    
    // Verificar variantes
    const variants = page.locator('[data-testid="variant-item"]');
    await expect(variants).toHaveCount(2);
    await expect(variants.first().locator('[data-testid="variant-name"]')).toContainText('Tamanho P');
  });

  test('deve importar produtos em lote', async ({ page }) => {
    // Interceptar requisição de importação
    await page.route('**/api/products/import', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          job_id: 'import-123',
          status: 'processing',
          total_rows: 100,
          processed_rows: 0
        })
      });
    });
    
    // Clicar no botão de importar
    await page.click('[data-testid="import-products-button"]');
    
    // Verificar modal de importação
    await expect(page.locator('[data-testid="import-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Importar Produtos');
    
    // Fazer upload do arquivo
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles({
      name: 'produtos.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('sku,name,price,stock\nTEST-001,Produto 1,99.99,50\nTEST-002,Produto 2,149.99,25')
    });
    
    // Verificar preview dos dados
    await expect(page.locator('[data-testid="import-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-rows"]')).toContainText('2 produtos serão importados');
    
    // Configurar opções de importação
    await page.check('[data-testid="update-existing"]');
    await page.selectOption('[data-testid="duplicate-strategy"]', 'skip');
    
    // Iniciar importação
    await page.click('[data-testid="start-import-button"]');
    
    // Verificar progresso da importação
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
  });

  test('deve exportar produtos', async ({ page }) => {
    // Interceptar requisição de exportação
    await page.route('**/api/products/export', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          download_url: '/api/downloads/products-export-123.csv',
          expires_at: '2024-01-15T12:00:00Z'
        })
      });
    });
    
    // Clicar no botão de exportar
    await page.click('[data-testid="export-products-button"]');
    
    // Verificar modal de exportação
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();
    
    // Selecionar formato
    await page.selectOption('[data-testid="export-format"]', 'csv');
    
    // Selecionar campos
    await page.check('[data-testid="field-sku"]');
    await page.check('[data-testid="field-name"]');
    await page.check('[data-testid="field-price"]');
    await page.check('[data-testid="field-stock"]');
    
    // Aplicar filtros
    await page.selectOption('[data-testid="export-category"]', 'Eletrônicos');
    await page.selectOption('[data-testid="export-status"]', 'active');
    
    // Iniciar exportação
    await page.click('[data-testid="start-export-button"]');
    
    // Verificar notificação de sucesso
    await expect(page.locator('[data-testid="export-success-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-link"]')).toBeVisible();
  });

  test('deve sincronizar produtos com conectores', async ({ page }) => {
    // Interceptar requisição de sincronização
    await page.route('**/api/products/sync', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sync_id: 'sync-456',
          status: 'started',
          connector: 'bling',
          estimated_duration: 300
        })
      });
    });
    
    // Clicar no botão de sincronizar
    await page.click('[data-testid="sync-products-button"]');
    
    // Verificar modal de sincronização
    await expect(page.locator('[data-testid="sync-modal"]')).toBeVisible();
    
    // Selecionar conector
    await page.selectOption('[data-testid="connector-select"]', 'bling');
    
    // Configurar opções de sincronização
    await page.selectOption('[data-testid="sync-direction"]', 'bidirectional');
    await page.check('[data-testid="sync-images"]');
    await page.check('[data-testid="sync-stock"]');
    
    // Iniciar sincronização
    await page.click('[data-testid="start-sync-button"]');
    
    // Verificar notificação de início
    await expect(page.locator('[data-testid="sync-started-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-started-notification"]')).toContainText('Sincronização iniciada');
  });

  test('deve gerenciar categorias de produtos', async ({ page }) => {
    // Navegar para categorias
    await page.click('[data-testid="manage-categories-button"]');
    
    // Verificar modal de categorias
    await expect(page.locator('[data-testid="categories-modal"]')).toBeVisible();
    
    // Verificar lista de categorias
    await expect(page.locator('[data-testid="categories-list"]')).toBeVisible();
    
    // Adicionar nova categoria
    await page.click('[data-testid="add-category-button"]');
    await page.fill('[data-testid="category-name"]', 'Nova Categoria');
    await page.fill('[data-testid="category-description"]', 'Descrição da categoria');
    await page.click('[data-testid="save-category-button"]');
    
    // Verificar que a categoria foi adicionada
    await expect(page.locator('[data-testid="category-item"]')).toContainText('Nova Categoria');
    
    // Editar categoria
    await page.click('[data-testid="edit-category-button"]');
    await page.fill('[data-testid="category-name"]', 'Categoria Editada');
    await page.click('[data-testid="save-category-button"]');
    
    // Excluir categoria
    await page.click('[data-testid="delete-category-button"]');
    await page.click('[data-testid="confirm-delete-category"]');
  });

  test('deve funcionar paginação', async ({ page }) => {
    // Interceptar requisição com paginação
    await page.route('**/api/products?page=*', async route => {
      const url = new URL(route.request().url());
      const pageNum = parseInt(url.searchParams.get('page') || '1');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: testData.products,
          total: 100,
          page: pageNum,
          per_page: 20,
          total_pages: 5
        })
      });
    });
    
    // Verificar controles de paginação
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-info"]')).toContainText('Página 1 de 5');
    
    // Ir para próxima página
    await page.click('[data-testid="next-page-button"]');
    await expect(page.locator('[data-testid="page-info"]')).toContainText('Página 2 de 5');
    
    // Ir para página específica
    await page.click('[data-testid="page-3-button"]');
    await expect(page.locator('[data-testid="page-info"]')).toContainText('Página 3 de 5');
    
    // Voltar para primeira página
    await page.click('[data-testid="first-page-button"]');
    await expect(page.locator('[data-testid="page-info"]')).toContainText('Página 1 de 5');
  });

  test('deve ordenar produtos por diferentes colunas', async ({ page }) => {
    // Interceptar requisições de ordenação
    await page.route('**/api/products?sort=*', async route => {
      const url = new URL(route.request().url());
      const sortBy = url.searchParams.get('sort');
      const order = url.searchParams.get('order') || 'asc';
      
      let sortedProducts = [...testData.products];
      
      if (sortBy === 'name') {
        sortedProducts.sort((a, b) => {
          const comparison = a.name.localeCompare(b.name);
          return order === 'desc' ? -comparison : comparison;
        });
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: sortedProducts,
          total: sortedProducts.length,
          page: 1,
          per_page: 20
        })
      });
    });
    
    // Ordenar por nome (ascendente)
    await page.click('[data-testid="sort-name"]');
    
    // Verificar indicador de ordenação
    await expect(page.locator('[data-testid="sort-name"]')).toHaveClass(/sort-asc/);
    
    // Ordenar por nome (descendente)
    await page.click('[data-testid="sort-name"]');
    await expect(page.locator('[data-testid="sort-name"]')).toHaveClass(/sort-desc/);
    
    // Ordenar por preço
    await page.click('[data-testid="sort-price"]');
    await expect(page.locator('[data-testid="sort-price"]')).toHaveClass(/sort-asc/);
  });

  test('deve funcionar em modo responsivo', async ({ page }) => {
    // Testar em mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verificar que a tabela se adapta
    await expect(page.locator('[data-testid="mobile-product-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="products-table"]')).not.toBeVisible();
    
    // Verificar cards de produtos
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards).toHaveCount(testData.products.length);
    
    // Verificar elementos do card
    const firstCard = productCards.first();
    await expect(firstCard.locator('[data-testid="card-sku"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="card-name"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="card-price"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="card-actions"]')).toBeVisible();
    
    // Testar menu de ações no mobile
    await firstCard.locator('[data-testid="card-menu-button"]').click();
    await expect(page.locator('[data-testid="mobile-actions-menu"]')).toBeVisible();
  });
});