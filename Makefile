# ML Bling Sync - Makefile
# Comandos úteis para desenvolvimento e deployment

.PHONY: help setup dev test build deploy clean lint security
.DEFAULT_GOAL := help

# Variáveis
PROJECT_NAME := ml-bling-sync
VERSION := $(shell git describe --tags --always --dirty)
DOCKER_REGISTRY := ghcr.io
IMAGE_PREFIX := $(DOCKER_REGISTRY)/$(PROJECT_NAME)

# Cores para output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

# Funções auxiliares
define log_info
	@echo -e "$(BLUE)[INFO]$(NC) $(1)"
endef

define log_success
	@echo -e "$(GREEN)[SUCCESS]$(NC) $(1)"
endef

define log_warning
	@echo -e "$(YELLOW)[WARNING]$(NC) $(1)"
endef

define log_error
	@echo -e "$(RED)[ERROR]$(NC) $(1)"
endef

## Mostrar ajuda
help:
	@echo "ML Bling Sync - Makefile"
	@echo ""
	@echo "Comandos disponíveis:"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "Exemplos:"
	@echo "  make setup          # Configurar ambiente de desenvolvimento"
	@echo "  make dev            # Iniciar desenvolvimento"
	@echo "  make test           # Executar todos os testes"
	@echo "  make deploy-staging # Deploy para staging"

## Configurar ambiente de desenvolvimento
setup:
	$(call log_info,"Configurando ambiente de desenvolvimento...")
	@chmod +x scripts/*.sh
	@./scripts/dev-setup.sh
	$(call log_success,"Ambiente configurado com sucesso!")

## Resetar ambiente de desenvolvimento
setup-reset: ## Resetar ambiente de desenvolvimento
	$(call log_warning,"Resetando ambiente de desenvolvimento...")
	@./scripts/dev-setup.sh --reset
	$(call log_success,"Ambiente resetado!")

## Iniciar desenvolvimento (frontend + backend)
dev: ## Iniciar servidores de desenvolvimento
	$(call log_info,"Iniciando servidores de desenvolvimento...")
	@docker-compose -f docker-compose.dev.yml up -d postgres redis
	@echo "Aguardando serviços ficarem prontos..."
	@sleep 5
	@$(MAKE) dev-backend &
	@$(MAKE) dev-frontend &
	@wait

## Iniciar apenas o backend
dev-backend: ## Iniciar apenas o servidor backend
	$(call log_info,"Iniciando backend...")
	@cd backend && source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

## Iniciar apenas o frontend
dev-frontend: ## Iniciar apenas o servidor frontend
	$(call log_info,"Iniciando frontend...")
	@cd frontend && npm run dev

## Parar servidores de desenvolvimento
dev-stop: ## Parar servidores de desenvolvimento
	$(call log_info,"Parando servidores de desenvolvimento...")
	@docker-compose -f docker-compose.dev.yml down
	@pkill -f "uvicorn" || true
	@pkill -f "npm run dev" || true
	$(call log_success,"Servidores parados")

## Instalar dependências
install: ## Instalar dependências do projeto
	$(call log_info,"Instalando dependências...")
	@cd backend && source venv/bin/activate && pip install -r requirements.txt -r requirements-dev.txt
	@cd frontend && npm install
	$(call log_success,"Dependências instaladas")

## Executar todos os testes
test: ## Executar todos os testes
	$(call log_info,"Executando todos os testes...")
	@./scripts/run-tests.sh

## Executar apenas testes unitários
test-unit: ## Executar apenas testes unitários
	$(call log_info,"Executando testes unitários...")
	@./scripts/run-tests.sh --unit

## Executar apenas testes de integração
test-integration: ## Executar apenas testes de integração
	$(call log_info,"Executando testes de integração...")
	@./scripts/run-tests.sh --integration

## Executar apenas testes E2E
test-e2e: ## Executar apenas testes E2E
	$(call log_info,"Executando testes E2E...")
	@./scripts/run-tests.sh --e2e

## Executar apenas testes do frontend
test-frontend: ## Executar apenas testes do frontend
	$(call log_info,"Executando testes do frontend...")
	@./scripts/run-tests.sh --frontend

## Executar apenas testes do backend
test-backend: ## Executar apenas testes do backend
	$(call log_info,"Executando testes do backend...")
	@./scripts/run-tests.sh --backend

## Executar testes de performance
test-performance: ## Executar testes de performance
	$(call log_info,"Executando testes de performance...")
	@./scripts/run-tests.sh --performance

## Executar testes de segurança
test-security: ## Executar testes de segurança
	$(call log_info,"Executando testes de segurança...")
	@./scripts/run-tests.sh --security

## Executar linting em todo o código
lint: ## Executar linting em todo o código
	$(call log_info,"Executando linting...")
	@cd frontend && npm run lint
	@cd frontend && npm run type-check
	@cd backend && source venv/bin/activate && flake8 .
	@cd backend && source venv/bin/activate && black --check .
	@cd backend && source venv/bin/activate && isort --check-only .
	@cd backend && source venv/bin/activate && mypy .
	$(call log_success,"Linting concluído")

## Corrigir problemas de linting automaticamente
lint-fix: ## Corrigir problemas de linting automaticamente
	$(call log_info,"Corrigindo problemas de linting...")
	@cd frontend && npm run lint:fix
	@cd backend && source venv/bin/activate && black .
	@cd backend && source venv/bin/activate && isort .
	$(call log_success,"Problemas de linting corrigidos")

## Verificar vulnerabilidades de segurança
security: ## Verificar vulnerabilidades de segurança
	$(call log_info,"Verificando vulnerabilidades...")
	@cd frontend && npm audit --audit-level=high
	@cd backend && source venv/bin/activate && safety check
	@cd backend && source venv/bin/activate && bandit -r app/
	$(call log_success,"Verificação de segurança concluída")

## Build das imagens Docker
build: ## Build das imagens Docker
	$(call log_info,"Fazendo build das imagens Docker...")
	@docker build -t $(IMAGE_PREFIX)/backend:$(VERSION) -t $(IMAGE_PREFIX)/backend:latest -f backend/Dockerfile backend/
	@docker build -t $(IMAGE_PREFIX)/frontend:$(VERSION) -t $(IMAGE_PREFIX)/frontend:latest -f frontend/Dockerfile frontend/
	$(call log_success,"Build das imagens concluído")

## Build de produção do frontend
build-frontend: ## Build de produção do frontend
	$(call log_info,"Fazendo build do frontend...")
	@npm run build
	$(call log_success,"Build do frontend concluído")

## Build de produção do backend
build-backend: ## Build de produção do backend
	$(call log_info,"Fazendo build do backend...")
	@cd backend && source venv/bin/activate && python -m build
	$(call log_success,"Build do backend concluído")

## Executar migrações do banco de dados
migrate: ## Executar migrações do banco de dados
	$(call log_info,"Executando migrações...")
	@cd backend && source venv/bin/activate && alembic upgrade head
	$(call log_success,"Migrações executadas")

## Criar nova migração
migrate-create: ## Criar nova migração (use: make migrate-create MESSAGE="descrição")
	$(call log_info,"Criando nova migração...")
	@cd backend && source venv/bin/activate && alembic revision --autogenerate -m "$(MESSAGE)"
	$(call log_success,"Migração criada")

## Reverter última migração
migrate-downgrade: ## Reverter última migração
	$(call log_warning,"Revertendo última migração...")
	@cd backend && source venv/bin/activate && alembic downgrade -1
	$(call log_success,"Migração revertida")

## Deploy para staging
deploy-staging: ## Deploy para ambiente de staging
	$(call log_info,"Fazendo deploy para staging...")
	@./scripts/deploy.sh staging $(VERSION)

## Deploy para produção
deploy-production: ## Deploy para ambiente de produção
	$(call log_warning,"Fazendo deploy para PRODUÇÃO...")
	@./scripts/deploy.sh production $(VERSION)

## Rollback no staging
rollback-staging: ## Rollback no ambiente de staging
	$(call log_warning,"Fazendo rollback no staging...")
	@./scripts/deploy.sh staging --rollback

## Rollback na produção
rollback-production: ## Rollback no ambiente de produção
	$(call log_warning,"Fazendo rollback na PRODUÇÃO...")
	@./scripts/deploy.sh production --rollback

## Fazer release
release: ## Fazer release (use: make release VERSION=1.2.3)
	$(call log_info,"Fazendo release $(VERSION)...")
	@./scripts/release.sh $(VERSION)

## Fazer release pulando testes
release-fast: ## Fazer release pulando testes (use: make release-fast VERSION=1.2.3)
	$(call log_warning,"Fazendo release rápido $(VERSION)...")
	@./scripts/release.sh $(VERSION) skip-tests

## Limpar arquivos temporários e caches
clean: ## Limpar arquivos temporários e caches
	$(call log_info,"Limpando arquivos temporários...")
	@rm -rf frontend/dist
	@rm -rf frontend/node_modules/.cache
	@rm -rf backend/dist
	@rm -rf backend/.pytest_cache
	@rm -rf backend/__pycache__
	@find . -name "*.pyc" -delete
	@find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@docker system prune -f
	$(call log_success,"Limpeza concluída")

## Limpar tudo (incluindo dependências)
clean-all: clean ## Limpar tudo incluindo dependências
	$(call log_warning,"Limpando todas as dependências...")
	@rm -rf frontend/node_modules
	@rm -rf backend/venv
	@docker-compose -f docker-compose.dev.yml down -v
	@docker system prune -af
	$(call log_success,"Limpeza completa concluída")

## Mostrar logs do desenvolvimento
logs: ## Mostrar logs dos serviços de desenvolvimento
	@docker-compose -f docker-compose.dev.yml logs -f

## Mostrar logs apenas do PostgreSQL
logs-db: ## Mostrar logs apenas do PostgreSQL
	@docker-compose -f docker-compose.dev.yml logs -f postgres

## Mostrar logs apenas do Redis
logs-redis: ## Mostrar logs apenas do Redis
	@docker-compose -f docker-compose.dev.yml logs -f redis

## Conectar ao banco de dados
db-connect: ## Conectar ao banco de dados PostgreSQL
	@docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d ml_bling_sync

## Conectar ao Redis
redis-connect: ## Conectar ao Redis
	@docker-compose -f docker-compose.dev.yml exec redis redis-cli

## Backup do banco de dados
db-backup: ## Fazer backup do banco de dados
	$(call log_info,"Fazendo backup do banco de dados...")
	@mkdir -p backups
	@docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres ml_bling_sync > backups/backup-$(shell date +%Y%m%d-%H%M%S).sql
	$(call log_success,"Backup criado em backups/")

## Restaurar backup do banco de dados
db-restore: ## Restaurar backup do banco de dados (use: make db-restore FILE=backup.sql)
	$(call log_warning,"Restaurando backup do banco de dados...")
	@docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d ml_bling_sync < $(FILE)
	$(call log_success,"Backup restaurado")

## Resetar banco de dados
db-reset: ## Resetar banco de dados (CUIDADO: apaga todos os dados)
	$(call log_warning,"Resetando banco de dados...")
	@docker-compose -f docker-compose.dev.yml down -v
	@docker-compose -f docker-compose.dev.yml up -d postgres
	@sleep 5
	@$(MAKE) migrate
	$(call log_success,"Banco de dados resetado")

## Mostrar status dos serviços
status: ## Mostrar status dos serviços
	$(call log_info,"Status dos serviços:")
	@docker-compose -f docker-compose.dev.yml ps
	@echo ""
	$(call log_info,"Verificando aplicações:")
	@curl -s http://localhost:8000/health 2>/dev/null && echo "✅ Backend: OK" || echo "❌ Backend: Não disponível"
	@curl -s http://localhost:3000 2>/dev/null >/dev/null && echo "✅ Frontend: OK" || echo "❌ Frontend: Não disponível"

## Mostrar informações do projeto
info: ## Mostrar informações do projeto
	@echo "ML Bling Sync - Informações do Projeto"
	@echo ""
	@echo "Versão: $(VERSION)"
	@echo "Registry: $(DOCKER_REGISTRY)"
	@echo "Imagens: $(IMAGE_PREFIX)"
	@echo ""
	@echo "URLs de desenvolvimento:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend: http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis: localhost:6379"
	@echo ""
	@echo "Comandos úteis:"
	@echo "  make dev     # Iniciar desenvolvimento"
	@echo "  make test    # Executar testes"
	@echo "  make lint    # Verificar código"
	@echo "  make build   # Build das imagens"

## Verificar dependências do sistema
check-deps: ## Verificar dependências do sistema
	$(call log_info,"Verificando dependências do sistema...")
	@command -v node >/dev/null && echo "✅ Node.js: $$(node --version)" || echo "❌ Node.js: Não instalado"
	@command -v python3 >/dev/null && echo "✅ Python: $$(python3 --version)" || echo "❌ Python: Não instalado"
	@command -v docker >/dev/null && echo "✅ Docker: $$(docker --version)" || echo "❌ Docker: Não instalado"
	@command -v docker-compose >/dev/null && echo "✅ Docker Compose: $$(docker-compose --version)" || echo "❌ Docker Compose: Não instalado"
	@command -v git >/dev/null && echo "✅ Git: $$(git --version)" || echo "❌ Git: Não instalado"
	@command -v kubectl >/dev/null && echo "✅ Kubectl: $$(kubectl version --client --short)" || echo "⚠️  Kubectl: Não instalado (opcional)"
	@command -v helm >/dev/null && echo "✅ Helm: $$(helm version --short)" || echo "⚠️  Helm: Não instalado (opcional)"

## Atualizar dependências
update-deps: ## Atualizar dependências do projeto
	$(call log_info,"Atualizando dependências...")
	@npm update
	@cd backend && source venv/bin/activate && pip install --upgrade -r requirements.txt
	$(call log_success,"Dependências atualizadas")

## Gerar documentação da API
docs: ## Gerar documentação da API
	$(call log_info,"Gerando documentação da API...")
	@cd backend && source venv/bin/activate && python scripts/generate_openapi.py
	$(call log_success,"Documentação gerada")

## Executar formatação de código
format: ## Executar formatação de código
	$(call log_info,"Formatando código...")
	@npm run format
	@cd backend && source venv/bin/activate && black .
	@cd backend && source venv/bin/activate && isort .
	$(call log_success,"Código formatado")

## Executar análise de qualidade de código
quality: lint security ## Executar análise completa de qualidade de código
	$(call log_success,"Análise de qualidade concluída")

## Pipeline completo de CI
ci: install lint security test build ## Executar pipeline completo de CI
	$(call log_success,"Pipeline de CI concluído")

## Preparar para produção
prod-ready: ci docs ## Verificar se está pronto para produção
	$(call log_success,"Projeto pronto para produção!")