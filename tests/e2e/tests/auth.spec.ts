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
    users: [
      { email: 'admin@test.com', password: 'admin123', role: 'admin', name: 'Admin Test' },
      { email: 'user@test.com', password: 'user123', role: 'user', name: 'User Test' }
    ]
  };
}

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    // Ir para a página de login
    await page.goto('/login');
  });

  test('deve exibir a página de login corretamente', async ({ page }) => {
    // Verificar elementos da página de login
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Verificar links
    await expect(page.locator('a[href="/register"]')).toBeVisible();
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    const user = testData.users.find((u: any) => u.role === 'admin');
    
    // Preencher formulário de login
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    
    // Submeter formulário
    await page.click('button[type="submit"]');
    
    // Verificar redirecionamento para dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Verificar elementos do dashboard
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    
    // Verificar nome do usuário
    await expect(page.locator('[data-testid="user-name"]')).toContainText(user.name);
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Tentar login com credenciais inválidas
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Verificar mensagem de erro
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Credenciais inválidas');
    
    // Verificar que permanece na página de login
    await expect(page).toHaveURL('/login');
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    // Tentar submeter sem preencher campos
    await page.click('button[type="submit"]');
    
    // Verificar validação HTML5
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('deve fazer logout corretamente', async ({ page }) => {
    const user = testData.users.find((u: any) => u.role === 'admin');
    
    // Fazer login primeiro
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Fazer logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Verificar redirecionamento para login
    await expect(page).toHaveURL('/login');
    
    // Verificar que não consegue acessar dashboard sem autenticação
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('deve redirecionar usuário autenticado do login para dashboard', async ({ page }) => {
    const user = testData.users.find((u: any) => u.role === 'admin');
    
    // Fazer login
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Tentar acessar login novamente
    await page.goto('/login');
    
    // Deve redirecionar para dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('deve funcionar o link "Esqueci minha senha"', async ({ page }) => {
    await page.click('a[href="/forgot-password"]');
    
    await expect(page).toHaveURL('/forgot-password');
    await expect(page.locator('h1')).toContainText('Recuperar Senha');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('deve funcionar o link de registro', async ({ page }) => {
    await page.click('a[href="/register"]');
    
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h1')).toContainText('Criar Conta');
  });

  test('deve manter sessão após refresh da página', async ({ page }) => {
    const user = testData.users.find((u: any) => u.role === 'admin');
    
    // Fazer login
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Refresh da página
    await page.reload();
    
    // Verificar que ainda está autenticado
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('deve expirar sessão após timeout', async ({ page }) => {
    // Este teste simula expiração de sessão
    // Em um cenário real, você configuraria um timeout muito baixo
    
    const user = testData.users.find((u: any) => u.role === 'admin');
    
    // Fazer login
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Simular expiração de sessão via API
    await page.evaluate(() => {
      // Limpar tokens do localStorage/sessionStorage
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Tentar fazer uma requisição que requer autenticação
    await page.goto('/dashboard/sync');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL('/login');
  });

  test('deve mostrar loading durante autenticação', async ({ page }) => {
    const user = testData.users.find((u: any) => u.role === 'admin');
    
    // Interceptar requisição de login para adicionar delay
    await page.route('**/api/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo delay
      route.continue();
    });
    
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    
    // Clicar em submit e verificar loading
    await page.click('button[type="submit"]');
    
    // Verificar indicador de loading
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Aguardar conclusão do login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
  });

  test('deve funcionar em diferentes tamanhos de tela', async ({ page }) => {
    // Testar em mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Testar em tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Testar em desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('deve ter acessibilidade adequada', async ({ page }) => {
    // Verificar labels dos inputs
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    
    // Verificar navegação por teclado
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
    
    // Verificar atributos de acessibilidade
    await expect(page.locator('input[type="email"]')).toHaveAttribute('aria-label');
    await expect(page.locator('input[type="password"]')).toHaveAttribute('aria-label');
  });
});