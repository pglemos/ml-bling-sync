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
    tenant: { id: 'test-tenant-123', name: 'Test Tenant' }
  };
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    const user = testData.users.find((u: any) => u.role === 'admin');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('deve exibir o dashboard principal corretamente', async ({ page }) => {
    // Verificar elementos principais do dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-overview"]')).toBeVisible();
    
    // Verificar navegação lateral
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-sync"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-suppliers"]')).toBeVisible();
  });

  test('deve mostrar estatísticas gerais', async ({ page }) => {
    // Verificar cards de estatísticas
    await expect(page.locator('[data-testid="total-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-suppliers"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-success-rate"]')).toBeVisible();
    
    // Verificar que os valores são numéricos ou percentuais
    const totalProducts = await page.locator('[data-testid="total-products"] .value').textContent();
    expect(totalProducts).toMatch(/^\d+$/);
    
    const successRate = await page.locator('[data-testid="sync-success-rate"] .value').textContent();
    expect(successRate).toMatch(/^\d+(\.\d+)?%$/);
  });

  test('deve exibir gráfico de sincronizações recentes', async ({ page }) => {
    // Verificar seção de gráficos
    await expect(page.locator('[data-testid="recent-syncs-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-title"]')).toContainText('Sincronizações Recentes');
    
    // Verificar controles do gráfico
    await expect(page.locator('[data-testid="chart-period-selector"]')).toBeVisible();
    
    // Alterar período do gráfico
    await page.selectOption('[data-testid="chart-period-selector"]', '7d');
    
    // Verificar que o gráfico foi atualizado
    await expect(page.locator('[data-testid="chart-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-loading"]')).not.toBeVisible();
  });

  test('deve mostrar atividades recentes', async ({ page }) => {
    // Verificar seção de atividades
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
    await expect(page.locator('[data-testid="activities-title"]')).toContainText('Atividades Recentes');
    
    // Verificar lista de atividades
    const activityList = page.locator('[data-testid="activity-list"]');
    await expect(activityList).toBeVisible();
    
    // Verificar elementos de uma atividade
    const firstActivity = activityList.locator('[data-testid="activity-item"]').first();
    if (await firstActivity.count() > 0) {
      await expect(firstActivity.locator('[data-testid="activity-icon"]')).toBeVisible();
      await expect(firstActivity.locator('[data-testid="activity-description"]')).toBeVisible();
      await expect(firstActivity.locator('[data-testid="activity-timestamp"]')).toBeVisible();
    }
  });

  test('deve navegar para diferentes seções', async ({ page }) => {
    // Navegar para Sincronização
    await page.click('[data-testid="nav-sync"]');
    await expect(page).toHaveURL('/dashboard/sync');
    await expect(page.locator('h1')).toContainText('Sincronização');
    
    // Voltar ao dashboard
    await page.click('[data-testid="nav-dashboard"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Navegar para Produtos
    await page.click('[data-testid="nav-products"]');
    await expect(page).toHaveURL('/dashboard/products');
    
    // Navegar para Pedidos
    await page.click('[data-testid="nav-orders"]');
    await expect(page).toHaveURL('/dashboard/orders');
    
    // Navegar para Fornecedores
    await page.click('[data-testid="nav-suppliers"]');
    await expect(page).toHaveURL('/dashboard/suppliers');
  });

  test('deve exibir notificações', async ({ page }) => {
    // Interceptar requisição de notificações
    await page.route('**/api/notifications', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          notifications: [
            {
              id: 'notif-1',
              type: 'sync_completed',
              title: 'Sincronização Concluída',
              message: 'Sincronização de produtos finalizada com sucesso',
              timestamp: '2024-01-15T10:00:00Z',
              read: false
            },
            {
              id: 'notif-2',
              type: 'sync_failed',
              title: 'Falha na Sincronização',
              message: 'Erro ao sincronizar pedidos do Bling',
              timestamp: '2024-01-15T09:30:00Z',
              read: false
            }
          ],
          unread_count: 2
        })
      });
    });
    
    // Verificar ícone de notificações
    await expect(page.locator('[data-testid="notifications-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-badge"]')).toContainText('2');
    
    // Abrir painel de notificações
    await page.click('[data-testid="notifications-button"]');
    await expect(page.locator('[data-testid="notifications-panel"]')).toBeVisible();
    
    // Verificar notificações
    const notifications = page.locator('[data-testid="notification-item"]');
    await expect(notifications).toHaveCount(2);
    
    // Verificar primeira notificação
    const firstNotification = notifications.first();
    await expect(firstNotification.locator('[data-testid="notification-title"]')).toContainText('Sincronização Concluída');
    await expect(firstNotification.locator('[data-testid="notification-message"]')).toContainText('produtos finalizada');
    
    // Marcar como lida
    await firstNotification.click();
    await expect(page.locator('[data-testid="notification-badge"]')).toContainText('1');
  });

  test('deve permitir busca global', async ({ page }) => {
    // Verificar campo de busca
    await expect(page.locator('[data-testid="global-search"]')).toBeVisible();
    
    // Interceptar requisição de busca
    await page.route('**/api/search**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              type: 'product',
              id: 'prod-123',
              title: 'Produto Teste',
              description: 'SKU: TEST-001',
              url: '/dashboard/products/prod-123'
            },
            {
              type: 'order',
              id: 'order-456',
              title: 'Pedido #456',
              description: 'Cliente: João Silva',
              url: '/dashboard/orders/order-456'
            }
          ]
        })
      });
    });
    
    // Realizar busca
    await page.fill('[data-testid="global-search"]', 'teste');
    await page.keyboard.press('Enter');
    
    // Verificar resultados
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    const results = page.locator('[data-testid="search-result-item"]');
    await expect(results).toHaveCount(2);
    
    // Verificar primeiro resultado
    const firstResult = results.first();
    await expect(firstResult.locator('[data-testid="result-title"]')).toContainText('Produto Teste');
    await expect(firstResult.locator('[data-testid="result-description"]')).toContainText('SKU: TEST-001');
    
    // Clicar no resultado
    await firstResult.click();
    await expect(page).toHaveURL('/dashboard/products/prod-123');
  });

  test('deve exibir alertas do sistema', async ({ page }) => {
    // Interceptar requisição de alertas
    await page.route('**/api/alerts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          alerts: [
            {
              id: 'alert-1',
              severity: 'warning',
              title: 'Taxa de Erro Elevada',
              message: 'Taxa de erro nas sincronizações está acima de 5%',
              timestamp: '2024-01-15T10:00:00Z',
              acknowledged: false
            },
            {
              id: 'alert-2',
              severity: 'info',
              title: 'Manutenção Programada',
              message: 'Manutenção do sistema programada para amanhã às 2h',
              timestamp: '2024-01-15T09:00:00Z',
              acknowledged: false
            }
          ]
        })
      });
    });
    
    // Verificar seção de alertas
    await expect(page.locator('[data-testid="system-alerts"]')).toBeVisible();
    
    // Verificar alertas
    const alerts = page.locator('[data-testid="alert-item"]');
    await expect(alerts).toHaveCount(2);
    
    // Verificar alerta de warning
    const warningAlert = alerts.first();
    await expect(warningAlert.locator('[data-testid="alert-severity"]')).toHaveClass(/warning/);
    await expect(warningAlert.locator('[data-testid="alert-title"]')).toContainText('Taxa de Erro Elevada');
    
    // Reconhecer alerta
    await warningAlert.locator('[data-testid="acknowledge-alert"]').click();
    await expect(warningAlert).toHaveClass(/acknowledged/);
  });

  test('deve mostrar status dos conectores', async ({ page }) => {
    // Interceptar requisição de status dos conectores
    await page.route('**/api/connectors/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          connectors: [
            {
              id: 'bling-connector',
              name: 'Bling',
              status: 'healthy',
              last_sync: '2024-01-15T10:00:00Z',
              response_time: 250
            },
            {
              id: 'shopify-connector',
              name: 'Shopify',
              status: 'degraded',
              last_sync: '2024-01-15T09:30:00Z',
              response_time: 1200
            }
          ]
        })
      });
    });
    
    // Verificar seção de status dos conectores
    await expect(page.locator('[data-testid="connectors-status"]')).toBeVisible();
    
    // Verificar conectores
    const connectors = page.locator('[data-testid="connector-status-item"]');
    await expect(connectors).toHaveCount(2);
    
    // Verificar conector saudável
    const healthyConnector = connectors.first();
    await expect(healthyConnector.locator('[data-testid="connector-name"]')).toContainText('Bling');
    await expect(healthyConnector.locator('[data-testid="connector-status"]')).toHaveClass(/healthy/);
    await expect(healthyConnector.locator('[data-testid="response-time"]')).toContainText('250ms');
    
    // Verificar conector degradado
    const degradedConnector = connectors.nth(1);
    await expect(degradedConnector.locator('[data-testid="connector-status"]')).toHaveClass(/degraded/);
  });

  test('deve permitir personalizar dashboard', async ({ page }) => {
    // Verificar botão de personalização
    await expect(page.locator('[data-testid="customize-dashboard"]')).toBeVisible();
    
    // Abrir modal de personalização
    await page.click('[data-testid="customize-dashboard"]');
    await expect(page.locator('[data-testid="customize-modal"]')).toBeVisible();
    
    // Verificar opções de widgets
    await expect(page.locator('[data-testid="widget-options"]')).toBeVisible();
    
    // Desabilitar um widget
    await page.uncheck('[data-testid="widget-recent-activities"]');
    
    // Salvar personalização
    await page.click('[data-testid="save-customization"]');
    
    // Verificar que o widget foi removido
    await expect(page.locator('[data-testid="recent-activities"]')).not.toBeVisible();
    
    // Reabilitar widget
    await page.click('[data-testid="customize-dashboard"]');
    await page.check('[data-testid="widget-recent-activities"]');
    await page.click('[data-testid="save-customization"]');
    
    // Verificar que o widget voltou
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
  });

  test('deve atualizar dados em tempo real', async ({ page }) => {
    // Interceptar WebSocket ou polling
    await page.route('**/api/dashboard/realtime', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stats: {
            total_products: 1250,
            total_orders: 89,
            active_suppliers: 15,
            sync_success_rate: 98.5
          },
          last_updated: '2024-01-15T10:05:00Z'
        })
      });
    });
    
    // Verificar indicador de atualização em tempo real
    await expect(page.locator('[data-testid="realtime-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="realtime-indicator"]')).toHaveClass(/connected/);
    
    // Verificar timestamp da última atualização
    await expect(page.locator('[data-testid="last-updated"]')).toBeVisible();
    
    // Simular desconexão
    await page.route('**/api/dashboard/realtime', async route => {
      await route.abort();
    });
    
    // Aguardar e verificar indicador de desconexão
    await page.waitForTimeout(5000);
    await expect(page.locator('[data-testid="realtime-indicator"]')).toHaveClass(/disconnected/);
  });

  test('deve funcionar em diferentes tamanhos de tela', async ({ page }) => {
    // Testar em desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-overview"]')).toBeVisible();
    
    // Testar em tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Abrir menu mobile
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible();
    
    // Testar em mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="stats-overview"]')).toBeVisible();
    
    // Verificar que os cards se reorganizam
    const statsCards = page.locator('[data-testid="stat-card"]');
    const firstCard = statsCards.first();
    const secondCard = statsCards.nth(1);
    
    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    
    // Em mobile, os cards devem estar empilhados verticalmente
    expect(firstCardBox!.y).toBeLessThan(secondCardBox!.y);
  });

  test('deve manter estado ao navegar', async ({ page }) => {
    // Personalizar período do gráfico
    await page.selectOption('[data-testid="chart-period-selector"]', '30d');
    
    // Navegar para outra página
    await page.click('[data-testid="nav-sync"]');
    await expect(page).toHaveURL('/dashboard/sync');
    
    // Voltar ao dashboard
    await page.click('[data-testid="nav-dashboard"]');
    
    // Verificar que o período selecionado foi mantido
    await expect(page.locator('[data-testid="chart-period-selector"]')).toHaveValue('30d');
  });

  test('deve exibir informações do usuário', async ({ page }) => {
    // Verificar menu do usuário
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Abrir menu do usuário
    await page.click('[data-testid="user-menu"]');
    await expect(page.locator('[data-testid="user-dropdown"]')).toBeVisible();
    
    // Verificar informações do usuário
    await expect(page.locator('[data-testid="user-name"]')).toContainText(testData.users[0].name);
    await expect(page.locator('[data-testid="user-email"]')).toContainText(testData.users[0].email);
    await expect(page.locator('[data-testid="user-role"]')).toContainText(testData.users[0].role);
    
    // Verificar opções do menu
    await expect(page.locator('[data-testid="profile-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();
  });
});