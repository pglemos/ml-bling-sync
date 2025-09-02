# Estrutura Organizada do Projeto ML-Bling-Sync

## 📁 Estrutura de Pastas

```
ml-bling-sync/
├── 📁 frontend/                    # Aplicação Next.js
│   ├── 📁 src/
│   │   ├── 📁 app/                # Páginas da aplicação (App Router)
│   │   ├── 📁 components/         # Componentes React organizados
│   │   │   ├── 📁 common/         # Componentes reutilizáveis
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Label.tsx
│   │   │   │   ├── Textarea.tsx
│   │   │   │   ├── Checkbox.tsx
│   │   │   │   ├── Pagination.tsx
│   │   │   │   └── ImageUploader.tsx
│   │   │   ├── 📁 dashboard/      # Componentes do dashboard
│   │   │   │   ├── StatCard.tsx
│   │   │   │   └── SalesChart.tsx
│   │   │   ├── 📁 products/       # Componentes de produtos
│   │   │   │   ├── ProductForm.tsx
│   │   │   │   ├── ProductActions.tsx
│   │   │   │   ├── ProductFilters.tsx
│   │   │   │   ├── ProductSearch.tsx
│   │   │   │   ├── ProductsTable.tsx
│   │   │   │   └── ProductsColumns.tsx
│   │   │   ├── 📁 orders/         # Componentes de pedidos
│   │   │   │   ├── OrdersTable.tsx
│   │   │   │   ├── OrdersColumns.tsx
│   │   │   │   ├── OrderFilters.tsx
│   │   │   │   ├── OrderActions.tsx
│   │   │   │   ├── OrderHistory.tsx
│   │   │   │   ├── OrderDetailsHeader.tsx
│   │   │   │   ├── OrderItemsTable.tsx
│   │   │   │   ├── OrdersBulkActions.tsx
│   │   │   │   └── ManualOrderForm.tsx
│   │   │   ├── 📁 integrations/   # Componentes de integrações
│   │   │   │   ├── IntegrationCard.tsx
│   │   │   │   └── IntegrationModal.tsx
│   │   │   ├── 📁 returns/        # Componentes de devoluções
│   │   │   │   ├── ReturnsTable.tsx
│   │   │   │   ├── ReturnsColumns.tsx
│   │   │   │   ├── ReturnFilters.tsx
│   │   │   │   ├── ReturnActions.tsx
│   │   │   │   └── ReturnRequestForm.tsx
│   │   │   ├── 📁 layout/         # Componentes de layout
│   │   │   │   ├── Topbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── AppLayout.tsx
│   │   │   ├── 📁 catalog/        # Componentes do catálogo
│   │   │   ├── 📁 financial/      # Componentes financeiros
│   │   │   ├── 📁 inventory/      # Componentes de estoque
│   │   │   └── 📁 kits/           # Componentes de kits
│   │   ├── 📁 types/              # Definições de tipos TypeScript
│   │   ├── 📁 services/           # Serviços de API
│   │   ├── 📁 hooks/              # Hooks personalizados
│   │   ├── 📁 contexts/           # Contextos React
│   │   ├── 📁 lib/                # Bibliotecas e utilitários
│   │   └── 📁 styles/             # Estilos globais
│   ├── package.json               # Dependências Node.js
│   ├── tailwind.config.js         # Configuração Tailwind CSS
│   └── next.config.js             # Configuração Next.js
├── 📁 backend/                     # API Node.js/Express (estrutura)
│   ├── 📁 src/
│   │   ├── 📁 api/                # Endpoints da API
│   │   ├── 📁 core/               # Lógica de negócio
│   │   ├── 📁 infra/              # Infraestrutura
│   │   └── 📁 config/             # Configurações
│   └── package.json               # Dependências Node.js
├── 📁 python_scripts/             # Scripts Python organizados
│   ├── 📁 models/                 # Modelos de dados
│   │   ├── product.py
│   │   ├── order.py
│   │   ├── category.py
│   │   ├── integration.py
│   │   ├── return_request.py
│   │   ├── kit.py
│   │   ├── audit_log.py
│   │   ├── role.py
│   │   ├── user.py
│   │   └── common.py
│   ├── 📁 services/               # Serviços de negócio
│   │   ├── product_service.py
│   │   ├── order_service.py
│   │   ├── category_service.py
│   │   ├── integration_service.py
│   │   ├── return_request_service.py
│   │   ├── dashboard_service.py
│   │   ├── bling_service.py
│   │   ├── mercadolivre_service.py
│   │   └── encryption.py
│   ├── 📁 repositories/           # Acesso a dados
│   │   ├── base_repository.py
│   │   ├── product_repository.py
│   │   ├── order_repository.py
│   │   ├── category_repository.py
│   │   ├── integration_repository.py
│   │   ├── return_request_repository.py
│   │   ├── dashboard_repository.py
│   │   ├── user_repository.py
│   │   ├── role_repository.py
│   │   └── audit_repository.py
│   └── 📁 migrations/             # Migrações de banco
│       ├── a1b2c3d4e5f6_initial_migration.py
│       ├── c7a8b9d0e1f2_add_orders_table.py
│       ├── d5e6f7g8h9i0_add_order_items.py
│       ├── e1f2g3h4i5j6_add_reserved_stock_to_products.py
│       ├── f1e2d3c4b5a6_add_product_images.py
│       ├── g1h2i3j4k5l6_add_returns_tables.py
│       ├── h1i2j3k4l5m6_add_integrations_table.py
│       └── i1j2k3l4m5n6_add_category_model.py
├── 📁 api/                        # API Python para Vercel
│   └── index.py                   # Handler principal
├── 📁 docs/                       # Documentação
│   └── ARQUITETURA.md             # Arquitetura do sistema
├── 📁 docker/                     # Configurações Docker
├── 📁 .github/                    # GitHub Actions
├── 📁 shared/                     # Código compartilhado
├── 📁 scripts/                    # Scripts de automação
├── 📁 public/                     # Arquivos estáticos
├── dashboard.html                  # Dashboard estático (legado)
├── vercel.json                    # Configuração Vercel
├── docker-compose.yml             # Configuração Docker Compose
├── requirements.txt                # Dependências Python
└── README.md                      # Documentação principal
```

## 🔧 Componentes Organizados por Funcionalidade

### 📊 Dashboard
- **StatCard.tsx**: Cards de estatísticas
- **SalesChart.tsx**: Gráfico de vendas

### 📦 Produtos
- **ProductForm.tsx**: Formulário de produto
- **ProductActions.tsx**: Ações de produto
- **ProductFilters.tsx**: Filtros de produto
- **ProductSearch.tsx**: Busca de produtos
- **ProductsTable.tsx**: Tabela de produtos
- **ProductsColumns.tsx**: Colunas da tabela

### 📋 Pedidos
- **OrdersTable.tsx**: Tabela de pedidos
- **OrdersColumns.tsx**: Colunas da tabela
- **OrderFilters.tsx**: Filtros de pedido
- **OrderActions.tsx**: Ações de pedido
- **OrderHistory.tsx**: Histórico de pedidos
- **OrderDetailsHeader.tsx**: Cabeçalho de detalhes
- **OrderItemsTable.tsx**: Tabela de itens
- **OrdersBulkActions.tsx**: Ações em lote
- **ManualOrderForm.tsx**: Formulário manual

### 🔌 Integrações
- **IntegrationCard.tsx**: Card de integração
- **IntegrationModal.tsx**: Modal de integração

### 📤 Devoluções
- **ReturnsTable.tsx**: Tabela de devoluções
- **ReturnsColumns.tsx**: Colunas da tabela
- **ReturnFilters.tsx**: Filtros de devolução
- **ReturnActions.tsx**: Ações de devolução
- **ReturnRequestForm.tsx**: Formulário de devolução

### 🎨 Componentes Comuns
- **Button.tsx**: Botão reutilizável
- **Input.tsx**: Campo de entrada
- **Table.tsx**: Tabela reutilizável
- **Label.tsx**: Rótulo de campo
- **Textarea.tsx**: Área de texto
- **Checkbox.tsx**: Caixa de seleção
- **Pagination.tsx**: Paginação
- **ImageUploader.tsx**: Upload de imagem

### 🏗️ Layout
- **Topbar.tsx**: Barra superior
- **Sidebar.tsx**: Barra lateral
- **AppLayout.tsx**: Layout principal

## 🚀 Próximos Passos

1. **Implementar funcionalidades**: Conectar os componentes com APIs reais
2. **Adicionar testes**: Implementar testes unitários e de integração
3. **Otimizar performance**: Lazy loading, memoização, etc.
4. **Melhorar UX**: Feedback visual, validações, etc.
5. **Documentar APIs**: Swagger/OpenAPI para endpoints
6. **CI/CD**: Pipeline de deploy automático

## 📝 Notas

- Todos os componentes estão organizados por funcionalidade
- Componentes comuns estão na pasta `common/` para reutilização
- Estrutura preparada para escalabilidade
- Padrões consistentes de nomenclatura
- Separação clara entre frontend e backend
