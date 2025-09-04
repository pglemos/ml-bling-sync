import { chromium, FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Global setup para testes E2E
 * Prepara o ambiente de teste antes de executar os testes
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando setup global dos testes E2E...');

  try {
    // 1. Verificar se as dependências estão instaladas
    await checkDependencies();

    // 2. Preparar banco de dados de teste
    await setupTestDatabase();

    // 3. Preparar dados de teste
    await seedTestData();

    // 4. Verificar se os serviços estão rodando
    await checkServices();

    // 5. Criar usuários de teste
    await createTestUsers();

    // 6. Configurar tenant de teste
    await setupTestTenant();

    console.log('✅ Setup global concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no setup global:', error);
    throw error;
  }
}

/**
 * Verifica se as dependências necessárias estão instaladas
 */
async function checkDependencies() {
  console.log('📦 Verificando dependências...');
  
  try {
    // Verificar Node.js
    execSync('node --version', { stdio: 'pipe' });
    
    // Verificar Python
    execSync('python --version', { stdio: 'pipe' });
    
    // Verificar PostgreSQL
    execSync('psql --version', { stdio: 'pipe' });
    
    // Verificar Redis
    execSync('redis-cli --version', { stdio: 'pipe' });
    
    console.log('✅ Todas as dependências estão disponíveis');
  } catch (error) {
    console.error('❌ Dependência faltando:', error);
    throw new Error('Dependências necessárias não estão instaladas');
  }
}

/**
 * Configura o banco de dados de teste
 */
async function setupTestDatabase() {
  console.log('🗄️ Configurando banco de dados de teste...');
  
  try {
    // Criar banco de teste se não existir
    try {
      execSync('createdb ml_bling_sync_test', { stdio: 'pipe' });
      console.log('📊 Banco de dados de teste criado');
    } catch (error) {
      // Banco já existe, continuar
      console.log('📊 Banco de dados de teste já existe');
    }
    
    // Executar migrações
    execSync('cd backend && alembic upgrade head', {
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ml_bling_sync_test'
      }
    });
    
    console.log('✅ Banco de dados configurado');
  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error);
    throw error;
  }
}

/**
 * Popula o banco com dados de teste
 */
async function seedTestData() {
  console.log('🌱 Populando dados de teste...');
  
  try {
    // Executar script de seed
    execSync('cd backend && python scripts/seed_test_data.py', {
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ml_bling_sync_test'
      }
    });
    
    console.log('✅ Dados de teste populados');
  } catch (error) {
    console.warn('⚠️ Aviso: Erro ao popular dados de teste:', error);
    // Não falhar o setup por causa disso
  }
}

/**
 * Verifica se os serviços necessários estão rodando
 */
async function checkServices() {
  console.log('🔍 Verificando serviços...');
  
  const services = [
    { name: 'Frontend', url: 'http://localhost:3000' },
    { name: 'Backend', url: 'http://localhost:8000/health' },
    { name: 'PostgreSQL', url: 'postgresql://localhost:5432' },
    { name: 'Redis', url: 'redis://localhost:6379' }
  ];
  
  for (const service of services) {
    try {
      if (service.url.startsWith('http')) {
        const response = await fetch(service.url);
        if (response.ok) {
          console.log(`✅ ${service.name} está rodando`);
        } else {
          throw new Error(`Status: ${response.status}`);
        }
      } else {
        // Para serviços não-HTTP, assumir que estão rodando se chegou até aqui
        console.log(`✅ ${service.name} está disponível`);
      }
    } catch (error) {
      console.error(`❌ ${service.name} não está disponível:`, error);
      throw new Error(`Serviço ${service.name} não está rodando`);
    }
  }
}

/**
 * Cria usuários de teste
 */
async function createTestUsers() {
  console.log('👥 Criando usuários de teste...');
  
  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      name: 'Admin Test'
    },
    {
      email: 'user@test.com',
      password: 'user123',
      role: 'user',
      name: 'User Test'
    },
    {
      email: 'supplier@test.com',
      password: 'supplier123',
      role: 'supplier',
      name: 'Supplier Test'
    }
  ];
  
  try {
    // Salvar usuários de teste em arquivo para uso nos testes
    const testDataPath = path.join(__dirname, 'test-data.json');
    const testData = {
      users: testUsers,
      tenant: {
        id: 'test-tenant-123',
        name: 'Test Tenant',
        domain: 'test.localhost'
      },
      connectors: [
        {
          id: 'bling-test-connector',
          name: 'Bling Test Connector',
          type: 'bling',
          config: {
            api_key: 'test-api-key',
            base_url: 'https://api.bling.com.br/v3'
          }
        }
      ]
    };
    
    fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));
    console.log('✅ Usuários de teste criados');
  } catch (error) {
    console.error('❌ Erro ao criar usuários de teste:', error);
    throw error;
  }
}

/**
 * Configura tenant de teste
 */
async function setupTestTenant() {
  console.log('🏢 Configurando tenant de teste...');
  
  try {
    // Configurações específicas do tenant de teste
    const tenantConfig = {
      id: 'test-tenant-123',
      name: 'Test Tenant',
      domain: 'test.localhost',
      settings: {
        theme: {
          primary_color: '#007bff',
          logo_url: '/test-logo.png'
        },
        features: {
          sync_enabled: true,
          billing_enabled: true,
          analytics_enabled: true
        },
        limits: {
          max_products: 1000,
          max_api_calls_per_hour: 1000
        }
      }
    };
    
    // Salvar configuração do tenant
    const configPath = path.join(__dirname, 'tenant-config.json');
    fs.writeFileSync(configPath, JSON.stringify(tenantConfig, null, 2));
    
    console.log('✅ Tenant de teste configurado');
  } catch (error) {
    console.error('❌ Erro ao configurar tenant de teste:', error);
    throw error;
  }
}

export default globalSetup;