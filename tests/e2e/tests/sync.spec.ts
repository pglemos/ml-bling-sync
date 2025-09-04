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
    connectors: [{ id: 'bling-test-connector', name: 'Bling Test Connector', type: 'bling' }]
  };
}

test.describe('Sincronização', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    const user = testData.users.find((u: any) => u.role === 'admin');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('deve exibir a página de sincronização corretamente', async ({ page }) => {
    await page.goto('/dashboard/sync');
    
    // Verificar elementos principais
    await expect(page.locator('h1')).toContainText('Sincronização');
    await expect(page.locator('[data-testid="sync-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="connector-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-syncs"]')).toBeVisible();
    
    // Verificar botões de ação
    await expect(page.locator('[data-testid="new-sync-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-history-button"]')).toBeVisible();
  });

  test('deve mostrar estatísticas de sincronização', async ({ page }) => {
    await page.goto('/dashboard/sync');
    
    // Verificar cards de estatísticas
    await expect(page.locator('[data-testid="total-syncs"]')).toBeVisible();
    await expect(page.locator('[data-testid="successful-syncs"]')).toBeVisible();
    await expect(page.locator('[data-testid="failed-syncs"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-success-rate"]')).toBeVisible();
    
    // Verificar que os valores são numéricos
    const totalSyncs = await page.locator('[data-testid="total-syncs"] .value').textContent();
    expect(totalSyncs).toMatch(/^\d+$/);
  });

  test('deve listar conectores disponíveis', async ({ page }) => {
    await page.goto('/dashboard/sync');
    
    // Verificar lista de conectores
    const connectorList = page.locator('[data-testid="connector-list"]');
    await expect(connectorList).toBeVisible();
    
    // Verificar se há pelo menos um conector
    const connectorItems = connectorList.locator('[data-testid="connector-item"]');
    await expect(connectorItems.first()).toBeVisible();
    
    // Verificar elementos do conector
    const firstConnector = connectorItems.first();
    await expect(firstConnector.locator('[data-testid="connector-name"]')).toBeVisible();
    await expect(firstConnector.locator('[data-testid="connector-status"]')).toBeVisible();
    await expect(firstConnector.locator('[data-testid="connector-actions"]')).toBeVisible();
  });

  test('deve iniciar uma nova sincronização', async ({ page }) => {
    await page.goto('/dashboard/sync');
    
    // Clicar no botão de nova sincronização
    await page.click('[data-testid="new-sync-button"]');
    
    // Verificar modal de nova sincronização
    await expect(page.locator('[data-testid="new-sync-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="connector-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-type-select"]')).toBeVisible();
    
    // Selecionar conector
    await page.selectOption('[data-testid="connector-select"]', testData.connectors[0].id);
    
    // Selecionar tipo de sincronização
    await page.selectOption('[data-testid="sync-type-select"]', 'products');
    
    // Configurar opções avançadas
    await page.click('[data-testid="advanced-options-toggle"]');
    await expect(page.locator('[data-testid="batch-size-input"]')).toBeVisible();
    await page.fill('[data-testid="batch-size-input"]', '50');
    
    // Iniciar sincronização
    await page.click('[data-testid="start-sync-button"]');
    
    // Verificar que a sincronização foi iniciada
    await expect(page.locator('[data-testid="sync-started-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-sync-modal"]')).not.toBeVisible();
    
    // Verificar que aparece na lista de sincronizações ativas
    await expect(page.locator('[data-testid="active-syncs"]')).toBeVisible();
  });

  test('deve mostrar progresso de sincronização em tempo real', async ({ page }) => {
    await page.goto('/dashboard/sync');
    
    // Interceptar WebSocket ou polling para simular progresso
    await page.route('**/api/sync/*/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'sync-123',
          status: 'running',
          progress: 45,
          records_processed: 450,
          total_records: 1000,
          current_operation: 'Processando produtos'
        })
      });
    });
    
    // Iniciar sincronização (simulada)
    await page.click('[data-testid="new-sync-button"]');
    await page.selectOption('[data-testid="connector-select"]', testData.connectors[0].id);
    await page.selectOption('[data-testid="sync-type-select"]', 'products');
    await page.click('[data-testid="start-sync-button"]');
    
    // Verificar elementos de progresso
    await expect(page.locator('[data-testid="sync-progress-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-progress-text"]')).toContainText('45%');
    await expect(page.locator('[data-testid="records-processed"]')).toContainText('450');
    await expect(page.locator('[data-testid="current-operation"]')).toContainText('Processando produtos');
  });

  test('deve permitir cancelar sincronização em andamento', async ({ page }) => {
    await page.goto('/dashboard/sync');
    
    // Simular sincronização em andamento
    await page.route('**/api/sync/*/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'sync-123',
          status: 'running',
          progress: 30,
          can_cancel: true
        })
      });
    });
    
    // Iniciar sincronização
    await page.click('[data-testid="new-sync-button"]');
    await page.selectOption('[data-testid="connector-select"]', testData.connectors[0].id);
    await page.selectOption('[data-testid="sync-type-select"]', 'products');
    await page.click('[data-testid="start-sync-button"]');
    
    // Verificar botão de cancelar
    await expect(page.locator('[data-testid="cancel-sync-button"]')).toBeVisible();
    
    // Cancelar sincronização
    await page.click('[data-testid="cancel-sync-button"]');
    
    // Confirmar cancelamento
    await expect(page.locator('[data-testid="cancel-confirmation-modal"]')).toBeVisible();
    await page.click('[data-testid="confirm-cancel-button"]');
    
    // Verificar que a sincronização foi cancelada
    await expect(page.locator('[data-testid="sync-cancelled-notification"]')).toBeVisible();
  });

  test('deve exibir histórico de sincronizações', async ({ page }) => {
    await page.goto('/dashboard/sync/history');
    
    // Verificar elementos do histórico
    await expect(page.locator('h1')).toContainText('Histórico de Sincronizações');
    await expect(page.locator('[data-testid="sync-history-table"]')).toBeVisible();
    
    // Verificar filtros
    await expect(page.locator('[data-testid="date-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="connector-filter"]')).toBeVisible();
    
    // Verificar colunas da tabela
    const table = page.locator('[data-testid="sync-history-table"]');
    await expect(table.locator('th')).toContainText(['Data/Hora', 'Conector', 'Tipo', 'Status', 'Registros', 'Duração', 'Ações']);
  });

  test('deve filtrar histórico por data', async ({ page }) => {
    await page.goto('/dashboard/sync/history');
    
    // Aplicar filtro de data
    await page.fill('[data-testid="date-from"]', '2024-01-01');
    await page.fill('[data-testid="date-to"]', '2024-01-31');
    await page.click('[data-testid="apply-filters-button"]');
    
    // Verificar que a tabela foi atualizada
    await expect(page.locator('[data-testid="sync-history-table"] tbody tr')).toHaveCount(0); // Assumindo que não há dados neste período
    
    // Limpar filtros
    await page.click('[data-testid="clear-filters-button"]');
    
    // Verificar que os filtros foram limpos
    await expect(page.locator('[data-testid="date-from"]')).toHaveValue('');
    await expect(page.locator('[data-testid="date-to"]')).toHaveValue('');
  });

  test('deve exibir detalhes de uma sincronização', async ({ page }) => {
    await page.goto('/dashboard/sync/history');
    
    // Interceptar requisição de detalhes
    await page.route('**/api/sync/sync-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'sync-123',
          connector_id: 'bling-connector',
          type: 'products',
          status: 'completed',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T10:05:00Z',
          records_processed: 100,
          records_success: 95,
          records_failed: 5,
          errors: [
            { record_id: 'prod-1', error: 'Invalid SKU format' },
            { record_id: 'prod-2', error: 'Missing required field' }
          ],
          logs: [
            { timestamp: '2024-01-15T10:00:00Z', level: 'INFO', message: 'Sync started' },
            { timestamp: '2024-01-15T10:05:00Z', level: 'INFO', message: 'Sync completed' }
          ]
        })
      });
    });
    
    // Clicar em uma sincronização para ver detalhes
    await page.click('[data-testid="sync-row-sync-123"] [data-testid="view-details-button"]');
    
    // Verificar modal de detalhes
    await expect(page.locator('[data-testid="sync-details-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-id"]')).toContainText('sync-123');
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('completed');
    await expect(page.locator('[data-testid="records-processed"]')).toContainText('100');
    
    // Verificar abas de detalhes
    await expect(page.locator('[data-testid="overview-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="errors-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="logs-tab"]')).toBeVisible();
    
    // Verificar aba de erros
    await page.click('[data-testid="errors-tab"]');
    await expect(page.locator('[data-testid="error-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-item"]')).toHaveCount(2);
    
    // Verificar aba de logs
    await page.click('[data-testid="logs-tab"]');
    await expect(page.locator('[data-testid="log-list"]')).toBeVisible();
  });

  test('deve permitir fazer replay de sincronização', async ({ page }) => {
    await page.goto('/dashboard/sync/history');
    
    // Interceptar requisição de replay
    await page.route('**/api/sync/replay', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          replay_id: 'replay-456',
          status: 'queued',
          original_sync_id: 'sync-123'
        })
      });
    });
    
    // Clicar no botão de replay
    await page.click('[data-testid="sync-row-sync-123"] [data-testid="replay-button"]');
    
    // Verificar modal de confirmação de replay
    await expect(page.locator('[data-testid="replay-confirmation-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="replay-warning"]')).toContainText('Esta ação irá re-executar a sincronização');
    
    // Confirmar replay
    await page.click('[data-testid="confirm-replay-button"]');
    
    // Verificar notificação de sucesso
    await expect(page.locator('[data-testid="replay-started-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="replay-started-notification"]')).toContainText('Replay iniciado');
  });

  test('deve configurar conector corretamente', async ({ page }) => {
    await page.goto('/dashboard/sync/connectors');
    
    // Clicar em configurar conector
    await page.click('[data-testid="configure-connector-bling"]');
    
    // Verificar modal de configuração
    await expect(page.locator('[data-testid="connector-config-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="connector-name"]')).toContainText('Bling');
    
    // Preencher configurações
    await page.fill('[data-testid="api-key-input"]', 'test-api-key-123');
    await page.fill('[data-testid="base-url-input"]', 'https://api.bling.com.br/v3');
    
    // Configurações avançadas
    await page.click('[data-testid="advanced-settings-toggle"]');
    await page.fill('[data-testid="timeout-input"]', '30');
    await page.fill('[data-testid="retry-attempts-input"]', '3');
    
    // Testar conexão
    await page.click('[data-testid="test-connection-button"]');
    
    // Verificar resultado do teste
    await expect(page.locator('[data-testid="connection-test-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="connection-test-result"]')).toContainText('Conexão bem-sucedida');
    
    // Salvar configuração
    await page.click('[data-testid="save-config-button"]');
    
    // Verificar notificação de sucesso
    await expect(page.locator('[data-testid="config-saved-notification"]')).toBeVisible();
  });

  test('deve mostrar métricas de performance', async ({ page }) => {
    await page.goto('/dashboard/sync/metrics');
    
    // Verificar gráficos de métricas
    await expect(page.locator('[data-testid="sync-performance-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="throughput-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-rate-chart"]')).toBeVisible();
    
    // Verificar seletores de período
    await expect(page.locator('[data-testid="time-range-selector"]')).toBeVisible();
    
    // Alterar período
    await page.selectOption('[data-testid="time-range-selector"]', '7d');
    
    // Verificar que os gráficos foram atualizados
    await expect(page.locator('[data-testid="chart-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-loading"]')).not.toBeVisible();
  });

  test('deve funcionar em modo offline', async ({ page, context }) => {
    await page.goto('/dashboard/sync');
    
    // Simular modo offline
    await context.setOffline(true);
    
    // Tentar iniciar sincronização
    await page.click('[data-testid="new-sync-button"]');
    
    // Verificar mensagem de offline
    await expect(page.locator('[data-testid="offline-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-notification"]')).toContainText('Sem conexão com a internet');
    
    // Verificar que o botão está desabilitado
    await expect(page.locator('[data-testid="start-sync-button"]')).toBeDisabled();
    
    // Voltar online
    await context.setOffline(false);
    
    // Verificar que a funcionalidade volta ao normal
    await expect(page.locator('[data-testid="offline-notification"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="start-sync-button"]')).toBeEnabled();
  });

  test('deve validar permissões de usuário', async ({ page }) => {
    // Fazer logout e login como usuário comum
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    const regularUser = testData.users.find((u: any) => u.role === 'user');
    if (regularUser) {
      await page.fill('input[type="email"]', regularUser.email);
      await page.fill('input[type="password"]', regularUser.password);
      await page.click('button[type="submit"]');
      
      await page.goto('/dashboard/sync');
      
      // Verificar que usuário comum não pode configurar conectores
      await expect(page.locator('[data-testid="configure-connector-button"]')).not.toBeVisible();
      
      // Verificar que pode ver sincronizações mas não pode iniciar novas
      await expect(page.locator('[data-testid="sync-overview"]')).toBeVisible();
      await expect(page.locator('[data-testid="new-sync-button"]')).not.toBeVisible();
    }
  });
});