import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown para testes E2E
 * Limpa o ambiente de teste após executar os testes
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Iniciando limpeza global dos testes E2E...');

  try {
    // 1. Limpar dados de teste
    await cleanTestData();

    // 2. Limpar banco de dados de teste
    await cleanTestDatabase();

    // 3. Limpar arquivos temporários
    await cleanTempFiles();

    // 4. Limpar cache Redis
    await cleanRedisCache();

    // 5. Gerar relatório de limpeza
    await generateCleanupReport();

    console.log('✅ Limpeza global concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na limpeza global:', error);
    // Não falhar por causa de erro de limpeza
  }
}

/**
 * Limpa dados de teste do banco
 */
async function cleanTestData() {
  console.log('🗑️ Limpando dados de teste...');
  
  try {
    // Script SQL para limpar dados de teste
    const cleanupSQL = `
      -- Limpar dados de teste (manter estrutura)
      DELETE FROM sync_executions WHERE tenant_id LIKE 'test-%';
      DELETE FROM supplier_order_tasks WHERE tenant_id LIKE 'test-%';
      DELETE FROM orders WHERE tenant_id LIKE 'test-%';
      DELETE FROM products WHERE tenant_id LIKE 'test-%';
      DELETE FROM connectors WHERE tenant_id LIKE 'test-%';
      DELETE FROM billing_subscriptions WHERE tenant_id LIKE 'test-%';
      DELETE FROM tenants WHERE id LIKE 'test-%';
      DELETE FROM users WHERE email LIKE '%@test.com';
      
      -- Resetar sequências se necessário
      SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;
      SELECT setval(pg_get_serial_sequence('tenants', 'id'), COALESCE(MAX(id), 1)) FROM tenants;
    `;
    
    // Salvar script em arquivo temporário
    const scriptPath = path.join(__dirname, 'cleanup.sql');
    fs.writeFileSync(scriptPath, cleanupSQL);
    
    // Executar script de limpeza
    execSync(`psql ml_bling_sync_test -f ${scriptPath}`, {
      stdio: 'pipe',
      env: {
        ...process.env,
        PGUSER: 'postgres',
        PGPASSWORD: 'postgres',
        PGHOST: 'localhost',
        PGPORT: '5432'
      }
    });
    
    // Remover script temporário
    fs.unlinkSync(scriptPath);
    
    console.log('✅ Dados de teste limpos');
  } catch (error) {
    console.warn('⚠️ Aviso: Erro ao limpar dados de teste:', error);
  }
}

/**
 * Limpa banco de dados de teste (opcional)
 */
async function cleanTestDatabase() {
  console.log('🗄️ Limpando banco de dados de teste...');
  
  try {
    // Opcionalmente, dropar o banco de teste completamente
    if (process.env.DROP_TEST_DB === 'true') {
      execSync('dropdb ml_bling_sync_test --if-exists', {
        stdio: 'pipe',
        env: {
          ...process.env,
          PGUSER: 'postgres',
          PGPASSWORD: 'postgres',
          PGHOST: 'localhost',
          PGPORT: '5432'
        }
      });
      console.log('🗑️ Banco de dados de teste removido');
    } else {
      console.log('📊 Banco de dados de teste mantido (use DROP_TEST_DB=true para remover)');
    }
  } catch (error) {
    console.warn('⚠️ Aviso: Erro ao limpar banco de dados:', error);
  }
}

/**
 * Limpa arquivos temporários criados durante os testes
 */
async function cleanTempFiles() {
  console.log('📁 Limpando arquivos temporários...');
  
  try {
    const tempFiles = [
      path.join(__dirname, 'test-data.json'),
      path.join(__dirname, 'tenant-config.json'),
      path.join(__dirname, 'cleanup.sql')
    ];
    
    for (const file of tempFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`🗑️ Removido: ${path.basename(file)}`);
      }
    }
    
    // Limpar diretório de screenshots de teste
    const screenshotsDir = path.join(__dirname, 'test-results');
    if (fs.existsSync(screenshotsDir)) {
      // Manter apenas os últimos resultados se não for CI
      if (!process.env.CI) {
        console.log('📸 Mantendo screenshots para debug local');
      } else {
        // No CI, limpar tudo
        fs.rmSync(screenshotsDir, { recursive: true, force: true });
        console.log('🗑️ Screenshots de teste removidos');
      }
    }
    
    console.log('✅ Arquivos temporários limpos');
  } catch (error) {
    console.warn('⚠️ Aviso: Erro ao limpar arquivos temporários:', error);
  }
}

/**
 * Limpa cache Redis usado nos testes
 */
async function cleanRedisCache() {
  console.log('🔄 Limpando cache Redis...');
  
  try {
    // Limpar apenas chaves de teste
    const testKeyPatterns = [
      'test:*',
      'session:test-*',
      'rate_limit:test-*',
      'circuit_breaker:test-*',
      'alert:test-*',
      'metrics:test-*'
    ];
    
    for (const pattern of testKeyPatterns) {
      try {
        execSync(`redis-cli --scan --pattern "${pattern}" | xargs -r redis-cli del`, {
          stdio: 'pipe'
        });
      } catch (error) {
        // Ignorar erros individuais de limpeza
      }
    }
    
    console.log('✅ Cache Redis limpo');
  } catch (error) {
    console.warn('⚠️ Aviso: Erro ao limpar cache Redis:', error);
  }
}

/**
 * Gera relatório de limpeza
 */
async function generateCleanupReport() {
  console.log('📊 Gerando relatório de limpeza...');
  
  try {
    const report = {
      timestamp: new Date().toISOString(),
      cleanup_performed: {
        test_data: true,
        temp_files: true,
        redis_cache: true,
        database_dropped: process.env.DROP_TEST_DB === 'true'
      },
      environment: {
        ci: !!process.env.CI,
        node_version: process.version,
        platform: process.platform
      },
      test_results_preserved: !process.env.CI
    };
    
    const reportPath = path.join(__dirname, 'cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📋 Relatório de limpeza gerado:', reportPath);
  } catch (error) {
    console.warn('⚠️ Aviso: Erro ao gerar relatório:', error);
  }
}

/**
 * Função auxiliar para verificar se um serviço está rodando
 */
async function isServiceRunning(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 segundos timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Função auxiliar para aguardar um tempo
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default globalTeardown;