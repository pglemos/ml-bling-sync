# ML Bling Sync - Guia de Onboarding para Desenvolvedores

## Bem-vindo ao Time! 🚀

Este guia vai te ajudar a configurar seu ambiente de desenvolvimento e entender a arquitetura do ML Bling Sync.

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Ambiente](#configuração-do-ambiente)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Estrutura do Código](#estrutura-do-código)
5. [Fluxos de Desenvolvimento](#fluxos-de-desenvolvimento)
6. [Padrões e Convenções](#padrões-e-convenções)
7. [Testes](#testes)
8. [Deploy e CI/CD](#deploy-e-cicd)
9. [Recursos Úteis](#recursos-úteis)

## Pré-requisitos

### Software Necessário

#### Essencial
- **Node.js** (v18+): [Download](https://nodejs.org/)
- **Python** (3.11+): [Download](https://python.org/)
- **Git**: [Download](https://git-scm.com/)
- **Docker**: [Download](https://docker.com/)
- **VS Code**: [Download](https://code.visualstudio.com/)

#### Recomendado
- **Docker Compose**: Para orquestração local
- **Postman/Insomnia**: Para testes de API
- **DBeaver**: Para gerenciamento do banco
- **Redis CLI**: Para debug do cache

### Extensões do VS Code

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "ms-python.isort",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode-remote.remote-containers",
    "ms-vscode.docker",
    "redhat.vscode-yaml",
    "ms-kubernetes-tools.vscode-kubernetes-tools"
  ]
}
```

### Contas e Acessos

- [ ] **GitHub**: Acesso ao repositório
- [ ] **Slack**: Canais #dev, #general, #alerts
- [ ] **Jira/Linear**: Para tracking de tasks
- [ ] **Figma**: Para designs e protótipos
- [ ] **AWS Console**: Para recursos de produção (se necessário)
- [ ] **Grafana**: Para monitoramento
- [ ] **Sentry**: Para error tracking

## Configuração do Ambiente

### 1. Clone do Repositório

```bash
# Clone o repositório
git clone https://github.com/company/ml-bling-sync.git
cd ml-bling-sync

# Configure seu Git
git config user.name "Seu Nome"
git config user.email "seu.email@company.com"
```

### 2. Configuração Automática

#### Windows (PowerShell)
```powershell
# Execute o script de setup
.\make.ps1 setup

# Ou manualmente:
.\scripts\dev-setup.ps1
```

#### Linux/macOS
```bash
# Execute o script de setup
make setup

# Ou manualmente:
./scripts/dev-setup.sh
```

### 3. Configuração Manual (se necessário)

#### Backend (Python)

```bash
# Navegue para o backend
cd backend

# Crie ambiente virtual
python -m venv venv

# Ative o ambiente (Windows)
venv\Scripts\activate
# Ative o ambiente (Linux/macOS)
source venv/bin/activate

# Instale dependências
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Configure variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

#### Frontend (Next.js)

```bash
# Navegue para o frontend
cd frontend

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite o arquivo .env.local com suas configurações
```

### 4. Banco de Dados Local

#### Opção 1: Docker (Recomendado)

```bash
# Inicie os serviços
docker-compose up -d postgres redis

# Execute migrações
cd backend
alembic upgrade head

# Carregue dados de exemplo
python scripts/seed_data.py
```

#### Opção 2: Instalação Local

```bash
# PostgreSQL
# Instale PostgreSQL localmente
# Crie database: ml_bling_sync_dev

# Redis
# Instale Redis localmente
# Inicie o serviço Redis
```

### 5. Verificação da Instalação

```bash
# Teste o backend
cd backend
python -m pytest tests/ -v

# Teste o frontend
cd frontend
npm test

# Inicie os serviços
# Terminal 1: Backend
cd backend && uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Workers
cd backend && celery -A app.worker worker --loglevel=info
```

### 6. Acesso às Aplicações

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Arquitetura do Sistema

### Visão Geral

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Backend       │────│   External APIs │
│   (Next.js)     │    │   (FastAPI)     │    │   (Bling, ML)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │   Workers       │
         │              │   (Celery)      │
         │              └─────────────────┘
         │                       │
┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │────│   Redis         │
│   (Database)    │    │   (Cache/Queue) │
└─────────────────┘    └─────────────────┘
```

### Componentes Principais

#### Frontend (Next.js + React)
- **Framework**: Next.js 14 com App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + React Query
- **Auth**: NextAuth.js
- **Forms**: React Hook Form + Zod

#### Backend (FastAPI + Python)
- **Framework**: FastAPI
- **ORM**: SQLAlchemy + Alembic
- **Auth**: JWT + OAuth2
- **Validation**: Pydantic
- **Background Tasks**: Celery

#### Database (PostgreSQL)
- **Primary DB**: PostgreSQL 15+
- **Migrations**: Alembic
- **Connection Pool**: SQLAlchemy

#### Cache/Queue (Redis)
- **Cache**: Application cache
- **Queue**: Celery task queue
- **Sessions**: User sessions

### Fluxo de Dados

```
1. User Action (Frontend)
   ↓
2. API Request (HTTP/REST)
   ↓
3. Authentication & Validation (Backend)
   ↓
4. Business Logic (Services)
   ↓
5. Database Operations (Repository)
   ↓
6. Background Tasks (Celery) [se necessário]
   ↓
7. External API Calls [se necessário]
   ↓
8. Response (JSON)
   ↓
9. UI Update (Frontend)
```

## Estrutura do Código

### Organização do Repositório

```
ml-bling-sync/
├── backend/                 # API Python (FastAPI)
│   ├── app/
│   │   ├── api/            # Endpoints da API
│   │   ├── core/           # Configurações e utilitários
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── schemas/        # Schemas Pydantic
│   │   ├── services/       # Lógica de negócio
│   │   ├── repositories/   # Acesso a dados
│   │   ├── connectors/     # Integrações externas
│   │   └── worker/         # Tasks Celery
│   ├── tests/              # Testes do backend
│   ├── alembic/            # Migrações do banco
│   └── requirements.txt    # Dependências Python
├── frontend/               # App React (Next.js)
│   ├── src/
│   │   ├── app/            # App Router (Next.js 14)
│   │   ├── components/     # Componentes React
│   │   ├── lib/            # Utilitários e configurações
│   │   ├── hooks/          # Custom hooks
│   │   ├── stores/         # Estado global (Zustand)
│   │   └── types/          # Tipos TypeScript
│   ├── public/             # Assets estáticos
│   └── package.json        # Dependências Node.js
├── docs/                   # Documentação
├── scripts/                # Scripts de automação
├── .github/                # GitHub Actions
├── docker-compose.yml      # Desenvolvimento local
└── README.md              # Documentação principal
```

### Backend - Estrutura Detalhada

#### API Endpoints (`app/api/`)

```python
# app/api/v1/endpoints/products.py
from fastapi import APIRouter, Depends
from app.services.product_service import ProductService
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter()

@router.post("/", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    service: ProductService = Depends()
):
    return await service.create_product(product)
```

#### Services (`app/services/`)

```python
# app/services/product_service.py
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate

class ProductService:
    def __init__(self, repo: ProductRepository = Depends()):
        self.repo = repo
    
    async def create_product(self, product_data: ProductCreate):
        # Lógica de negócio aqui
        return await self.repo.create(product_data)
```

#### Models (`app/models/`)

```python
# app/models/product.py
from sqlalchemy import Column, Integer, String, Decimal
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    price = Column(Decimal(10, 2), nullable=False)
    sku = Column(String, unique=True, nullable=False)
```

#### Schemas (`app/schemas/`)

```python
# app/schemas/product.py
from pydantic import BaseModel
from decimal import Decimal

class ProductBase(BaseModel):
    name: str
    price: Decimal
    sku: str

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    
    class Config:
        from_attributes = True
```

### Frontend - Estrutura Detalhada

#### Pages (`src/app/`)

```typescript
// src/app/products/page.tsx
import { ProductList } from '@/components/products/ProductList'
import { ProductFilters } from '@/components/products/ProductFilters'

export default function ProductsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Produtos</h1>
      <ProductFilters />
      <ProductList />
    </div>
  )
}
```

#### Components (`src/components/`)

```typescript
// src/components/products/ProductList.tsx
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from './ProductCard'

export function ProductList() {
  const { data: products, isLoading } = useProducts()
  
  if (isLoading) return <div>Carregando...</div>
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

#### Hooks (`src/hooks/`)

```typescript
// src/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(res => res.data)
  })
}
```

#### Stores (`src/stores/`)

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    token: null,
    login: async (email, password) => {
      // Implementar login
    },
    logout: () => set({ user: null, token: null })
  }),
  { name: 'auth-storage' }
))
```

## Fluxos de Desenvolvimento

### Git Workflow

#### Branch Strategy

```
main (production)
├── develop (staging)
│   ├── feature/user-authentication
│   ├── feature/product-sync
│   └── feature/dashboard-metrics
├── hotfix/critical-bug-fix
└── release/v1.2.0
```

#### Convenções de Branch

- **feature/**: Novas funcionalidades
- **bugfix/**: Correções de bugs
- **hotfix/**: Correções críticas
- **release/**: Preparação de releases
- **chore/**: Tarefas de manutenção

#### Convenções de Commit

```bash
# Formato: type(scope): description

# Tipos:
feat(auth): add JWT authentication
fix(sync): resolve product duplication issue
docs(api): update endpoint documentation
style(ui): improve button styling
refactor(db): optimize query performance
test(api): add integration tests
chore(deps): update dependencies
```

### Processo de Desenvolvimento

#### 1. Pegando uma Task

```bash
# 1. Sincronize com develop
git checkout develop
git pull origin develop

# 2. Crie uma branch
git checkout -b feature/product-filtering

# 3. Implemente a funcionalidade
# ... código ...

# 4. Teste localmente
npm test
pytest

# 5. Commit e push
git add .
git commit -m "feat(products): add filtering by category"
git push origin feature/product-filtering
```

#### 2. Code Review

```bash
# 1. Abra Pull Request no GitHub
# 2. Aguarde review de pelo menos 1 pessoa
# 3. Faça ajustes se necessário
# 4. Merge após aprovação
```

#### 3. Deploy

```bash
# Deploy automático após merge em develop (staging)
# Deploy manual para production via tag
git tag v1.2.3
git push origin v1.2.3
```

### Debugging

#### Backend (Python)

```python
# Debug com breakpoints
import pdb; pdb.set_trace()

# Debug com logs
import logging
logger = logging.getLogger(__name__)
logger.debug(f"Processing product: {product.id}")

# Debug com VS Code
# Configure launch.json para FastAPI
```

#### Frontend (React)

```typescript
// Debug com console
console.log('Product data:', product)

// Debug com React DevTools
// Instale a extensão React Developer Tools

// Debug com VS Code
// Configure debugger para Next.js
```

#### Database

```sql
-- Debug queries lentas
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Debug locks
SELECT * FROM pg_locks WHERE NOT granted;
```

## Padrões e Convenções

### Código Python

#### Formatação

```python
# Use Black para formatação automática
black .

# Use isort para imports
isort .

# Use flake8 para linting
flake8 .
```

#### Convenções

```python
# Nomes de classes: PascalCase
class ProductService:
    pass

# Nomes de funções/variáveis: snake_case
def create_product(product_data: dict) -> Product:
    pass

# Constantes: UPPER_CASE
MAX_RETRY_ATTEMPTS = 3

# Imports organizados
from typing import List, Optional  # stdlib

from fastapi import APIRouter      # third-party
from sqlalchemy import Column      # third-party

from app.models import Product     # local
```

#### Docstrings

```python
def sync_products(tenant_id: int, force: bool = False) -> List[Product]:
    """
    Sincroniza produtos do Bling para o sistema.
    
    Args:
        tenant_id: ID do tenant
        force: Força sincronização mesmo se recente
        
    Returns:
        Lista de produtos sincronizados
        
    Raises:
        BlingAPIError: Erro na API do Bling
        ValidationError: Dados inválidos
    """
    pass
```

### Código TypeScript/React

#### Formatação

```bash
# Use Prettier para formatação
npx prettier --write .

# Use ESLint para linting
npx eslint . --fix
```

#### Convenções

```typescript
// Componentes: PascalCase
function ProductCard({ product }: ProductCardProps) {
  return <div>{product.name}</div>
}

// Hooks: camelCase com 'use' prefix
function useProducts() {
  return useQuery(['products'], fetchProducts)
}

// Tipos: PascalCase
interface Product {
  id: number
  name: string
  price: number
}

// Enums: PascalCase
enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}
```

#### Estrutura de Componentes

```typescript
// ProductCard.tsx
import { Card } from '@/components/ui/card'
import { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
  onEdit?: (product: Product) => void
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
  const handleEdit = () => {
    onEdit?.(product)
  }
  
  return (
    <Card className="p-4">
      <h3 className="font-semibold">{product.name}</h3>
      <p className="text-gray-600">R$ {product.price}</p>
      <button onClick={handleEdit}>Editar</button>
    </Card>
  )
}
```

### Database

#### Convenções de Nomenclatura

```sql
-- Tabelas: plural, snake_case
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices: idx_table_column
CREATE INDEX idx_products_name ON products(name);

-- Foreign keys: fk_table_column
ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_product_id 
FOREIGN KEY (product_id) REFERENCES products(id);
```

#### Migrações

```python
# alembic/versions/001_create_products_table.py
"""Create products table

Revision ID: 001
Revises: 
Create Date: 2024-01-15 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('price', sa.Numeric(10, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('products')
```

## Testes

### Estratégia de Testes

```
Pirâmide de Testes:

     /\     E2E Tests (Playwright)
    /  \    - User journeys
   /    \   - Critical flows
  /______\  
 
  /________\  Integration Tests (pytest)
 /          \ - API endpoints
/____________\ - Database operations

/________________\ Unit Tests (pytest/jest)
                   - Business logic
                   - Components
                   - Utilities
```

### Backend Tests (Python)

#### Unit Tests

```python
# tests/unit/test_product_service.py
import pytest
from unittest.mock import Mock
from app.services.product_service import ProductService
from app.schemas.product import ProductCreate

class TestProductService:
    def test_create_product_success(self):
        # Arrange
        mock_repo = Mock()
        service = ProductService(repo=mock_repo)
        product_data = ProductCreate(name="Test", price=10.0, sku="TEST")
        
        # Act
        result = service.create_product(product_data)
        
        # Assert
        mock_repo.create.assert_called_once_with(product_data)
        assert result is not None
```

#### Integration Tests

```python
# tests/integration/test_product_api.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestProductAPI:
    def test_create_product_endpoint(self):
        # Arrange
        product_data = {
            "name": "Test Product",
            "price": 29.99,
            "sku": "TEST001"
        }
        
        # Act
        response = client.post("/api/v1/products/", json=product_data)
        
        # Assert
        assert response.status_code == 201
        assert response.json()["name"] == "Test Product"
```

#### Fixtures

```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app

@pytest.fixture(scope="session")
def test_db():
    engine = create_engine("sqlite:///./test.db")
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(test_db):
    Session = sessionmaker(bind=test_db)
    session = Session()
    yield session
    session.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
```

### Frontend Tests (TypeScript)

#### Unit Tests

```typescript
// src/components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from './ProductCard'

const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: 29.99,
  sku: 'TEST001'
}

describe('ProductCard', () => {
  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('R$ 29.99')).toBeInTheDocument()
  })
  
  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn()
    render(<ProductCard product={mockProduct} onEdit={mockOnEdit} />)
    
    fireEvent.click(screen.getByText('Editar'))
    expect(mockOnEdit).toHaveBeenCalledWith(mockProduct)
  })
})
```

#### Integration Tests

```typescript
// src/hooks/useProducts.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProducts } from './useProducts'
import { api } from '@/lib/api'

jest.mock('@/lib/api')
const mockedApi = api as jest.Mocked<typeof api>

describe('useProducts', () => {
  it('fetches products successfully', async () => {
    const mockProducts = [mockProduct]
    mockedApi.get.mockResolvedValue({ data: mockProducts })
    
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
    
    const { result } = renderHook(() => useProducts(), { wrapper })
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data).toEqual(mockProducts)
  })
})
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/product-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid=email]', 'test@example.com')
    await page.fill('[data-testid=password]', 'password')
    await page.click('[data-testid=login-button]')
    await page.waitForURL('/dashboard')
  })
  
  test('should create a new product', async ({ page }) => {
    await page.goto('/products')
    await page.click('[data-testid=add-product-button]')
    
    await page.fill('[data-testid=product-name]', 'Test Product')
    await page.fill('[data-testid=product-price]', '29.99')
    await page.fill('[data-testid=product-sku]', 'TEST001')
    
    await page.click('[data-testid=save-product-button]')
    
    await expect(page.locator('text=Test Product')).toBeVisible()
  })
})
```

### Executando Testes

```bash
# Backend
cd backend

# Testes unitários
pytest tests/unit/ -v

# Testes de integração
pytest tests/integration/ -v

# Todos os testes
pytest -v

# Com coverage
pytest --cov=app tests/

# Frontend
cd frontend

# Testes unitários
npm test

# Testes em modo watch
npm test -- --watch

# E2E tests
npx playwright test

# E2E em modo UI
npx playwright test --ui
```

## Deploy e CI/CD

### Ambientes

- **Development**: Ambiente local
- **Staging**: `staging.ml-bling-sync.com`
- **Production**: `app.ml-bling-sync.com`

### Pipeline CI/CD

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest
      - name: Run linting
        run: flake8 .
  
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: ./scripts/deploy.sh staging
  
  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./scripts/deploy.sh production
```

### Scripts de Deploy

```bash
# Deploy para staging
./scripts/deploy.sh staging

# Deploy para produção
./scripts/deploy.sh production v1.2.3

# Rollback
./scripts/deploy.sh production --rollback
```

## Recursos Úteis

### Documentação

- **API Docs**: http://localhost:8000/docs (Swagger)
- **Redoc**: http://localhost:8000/redoc
- **Database Schema**: `docs/database-schema.md`
- **Architecture**: `docs/architecture.md`

### Ferramentas de Debug

```bash
# Logs da aplicação
docker-compose logs -f backend
docker-compose logs -f frontend

# Conectar ao banco
psql -h localhost -U postgres -d ml_bling_sync_dev

# Conectar ao Redis
redis-cli -h localhost -p 6379

# Monitorar filas Celery
celery -A app.worker flower
```

### Comandos Úteis

```bash
# Reset do banco de dados
.\make.ps1 db-reset

# Executar migrações
.\make.ps1 db-migrate

# Gerar nova migração
cd backend && alembic revision --autogenerate -m "Add new table"

# Executar linting
.\make.ps1 lint

# Executar todos os testes
.\make.ps1 test

# Build das imagens Docker
.\make.ps1 build
```

### Links Importantes

- **Repository**: https://github.com/company/ml-bling-sync
- **Staging**: https://staging.ml-bling-sync.com
- **Production**: https://app.ml-bling-sync.com
- **Monitoring**: https://grafana.ml-bling-sync.com
- **Error Tracking**: https://sentry.io/ml-bling-sync
- **Documentation**: https://docs.ml-bling-sync.com

### Contatos

- **Tech Lead**: João Silva - joao@company.com
- **Senior Dev**: Maria Santos - maria@company.com
- **DevOps**: Pedro Costa - pedro@company.com
- **Product**: Ana Lima - ana@company.com

### Próximos Passos

1. **Primeira Semana**:
   - [ ] Configurar ambiente local
   - [ ] Executar aplicação localmente
   - [ ] Fazer primeiro commit
   - [ ] Participar de daily standups

2. **Primeira Sprint**:
   - [ ] Pegar primeira task simples
   - [ ] Fazer primeiro PR
   - [ ] Entender fluxo de deploy
   - [ ] Conhecer a equipe

3. **Primeiro Mês**:
   - [ ] Contribuir com feature completa
   - [ ] Entender arquitetura completa
   - [ ] Participar de code reviews
   - [ ] Sugerir melhorias

---

**Bem-vindo ao time! 🎉**

Se tiver dúvidas, não hesite em perguntar no Slack (#dev) ou para qualquer membro da equipe.

**Última atualização**: Janeiro 2024
**Versão**: 1.0
**Responsável**: Equipe de Desenvolvimento