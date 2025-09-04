#!/bin/bash

# ML Bling Sync - Development Setup Script
# Este script automatiza a configuração do ambiente de desenvolvimento

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependências do sistema
check_system_dependencies() {
    log_info "Verificando dependências do sistema..."
    
    local missing_deps=()
    
    # Node.js
    if ! command_exists node; then
        missing_deps+=("Node.js")
    else
        local node_version=$(node --version | sed 's/v//')
        log_success "Node.js $node_version encontrado"
    fi
    
    # Python
    if ! command_exists python3; then
        missing_deps+=("Python 3")
    else
        local python_version=$(python3 --version | cut -d' ' -f2)
        log_success "Python $python_version encontrado"
    fi
    
    # Docker
    if ! command_exists docker; then
        missing_deps+=("Docker")
    else
        log_success "Docker encontrado"
    fi
    
    # Docker Compose
    if ! command_exists docker-compose; then
        missing_deps+=("Docker Compose")
    else
        log_success "Docker Compose encontrado"
    fi
    
    # Git
    if ! command_exists git; then
        missing_deps+=("Git")
    else
        log_success "Git encontrado"
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Dependências faltando: ${missing_deps[*]}"
        log_info "Por favor, instale as dependências antes de continuar"
        exit 1
    fi
    
    log_success "Todas as dependências do sistema estão instaladas"
}

# Verificar versões mínimas
check_versions() {
    log_info "Verificando versões mínimas..."
    
    # Node.js >= 18
    local node_version=$(node --version | sed 's/v//' | cut -d'.' -f1)
    if [[ $node_version -lt 18 ]]; then
        log_error "Node.js versão 18+ é necessária (atual: $(node --version))"
        exit 1
    fi
    
    # Python >= 3.9
    local python_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [[ $(echo "$python_version < 3.9" | bc -l) -eq 1 ]]; then
        log_error "Python 3.9+ é necessário (atual: $(python3 --version))"
        exit 1
    fi
    
    log_success "Versões das dependências são compatíveis"
}

# Configurar ambiente Python
setup_python_env() {
    log_info "Configurando ambiente Python..."
    
    cd backend
    
    # Criar virtual environment se não existir
    if [[ ! -d "venv" ]]; then
        log_info "Criando virtual environment..."
        python3 -m venv venv
    fi
    
    # Ativar virtual environment
    source venv/bin/activate
    
    # Atualizar pip
    log_info "Atualizando pip..."
    pip install --upgrade pip
    
    # Instalar dependências
    log_info "Instalando dependências Python..."
    pip install -r requirements.txt
    pip install -r requirements-dev.txt
    
    cd ..
    
    log_success "Ambiente Python configurado"
}

# Configurar ambiente Node.js
setup_node_env() {
    log_info "Configurando ambiente Node.js..."
    
    cd frontend
    
    # Instalar dependências
    log_info "Instalando dependências Node.js..."
    npm install
    
    cd ..
    
    log_success "Ambiente Node.js configurado"
}

# Configurar banco de dados
setup_database() {
    log_info "Configurando banco de dados..."
    
    # Verificar se o Docker está rodando
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker não está rodando. Por favor, inicie o Docker"
        exit 1
    fi
    
    # Subir serviços de desenvolvimento
    log_info "Subindo serviços de desenvolvimento..."
    docker-compose -f docker-compose.dev.yml up -d postgres redis
    
    # Aguardar serviços ficarem prontos
    log_info "Aguardando serviços ficarem prontos..."
    sleep 10
    
    # Executar migrações
    log_info "Executando migrações do banco de dados..."
    cd backend
    source venv/bin/activate
    alembic upgrade head
    cd ..
    
    log_success "Banco de dados configurado"
}

# Configurar arquivos de ambiente
setup_env_files() {
    log_info "Configurando arquivos de ambiente..."
    
    # Backend .env
    if [[ ! -f "backend/.env" ]]; then
        log_info "Criando backend/.env..."
        cp backend/.env.example backend/.env
        log_warning "Por favor, revise e ajuste as configurações em backend/.env"
    else
        log_info "backend/.env já existe"
    fi
    
    # Frontend .env
    if [[ ! -f "frontend/.env.local" ]]; then
        log_info "Criando frontend/.env.local..."
        cp frontend/.env.example frontend/.env.local
        log_warning "Por favor, revise e ajuste as configurações em frontend/.env.local"
    else
        log_info "frontend/.env.local já existe"
    fi
    
    log_success "Arquivos de ambiente configurados"
}

# Executar testes para verificar setup
run_verification_tests() {
    log_info "Executando testes de verificação..."
    
    # Teste backend
    log_info "Testando backend..."
    cd backend
    source venv/bin/activate
    python -c "import app; print('Backend OK')"
    cd ..
    
    # Teste frontend
    log_info "Testando frontend..."
    cd frontend
    npm run type-check
    cd ..
    
    log_success "Testes de verificação passaram"
}

# Configurar Git hooks
setup_git_hooks() {
    log_info "Configurando Git hooks..."
    
    # Pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook para ML Bling Sync

set -e

echo "Executando verificações pre-commit..."

# Linting frontend
echo "Linting frontend..."
cd frontend
npm run lint
cd ..

# Linting backend
echo "Linting backend..."
cd backend
source venv/bin/activate
flake8 .
black --check .
isort --check-only .
cd ..

echo "Pre-commit verificações passaram!"
EOF
    
    chmod +x .git/hooks/pre-commit
    
    log_success "Git hooks configurados"
}

# Criar dados de exemplo
setup_sample_data() {
    log_info "Criando dados de exemplo..."
    
    cd backend
    source venv/bin/activate
    
    # Executar script de dados de exemplo se existir
    if [[ -f "scripts/create_sample_data.py" ]]; then
        python scripts/create_sample_data.py
        log_success "Dados de exemplo criados"
    else
        log_warning "Script de dados de exemplo não encontrado"
    fi
    
    cd ..
}

# Exibir informações finais
show_final_info() {
    echo ""
    log_success "Setup de desenvolvimento concluído!"
    echo ""
    log_info "Para iniciar o desenvolvimento:"
    echo ""
    echo "  1. Backend:"
    echo "     cd backend"
    echo "     source venv/bin/activate"
    echo "     uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    echo "  2. Frontend:"
    echo "     cd frontend"
    echo "     npm run dev"
    echo ""
    echo "  3. Serviços (PostgreSQL, Redis):"
    echo "     docker-compose -f docker-compose.dev.yml up -d"
    echo ""
    log_info "URLs importantes:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8000"
    echo "  - API Docs: http://localhost:8000/docs"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo ""
    log_info "Comandos úteis:"
    echo "  - Executar testes: ./scripts/run-tests.sh"
    echo "  - Fazer release: ./scripts/release.sh <versão>"
    echo "  - Reset do ambiente: ./scripts/dev-setup.sh --reset"
    echo ""
}

# Reset do ambiente
reset_environment() {
    log_warning "Resetando ambiente de desenvolvimento..."
    
    # Parar containers
    docker-compose -f docker-compose.dev.yml down -v
    
    # Remover virtual environment
    rm -rf backend/venv
    
    # Remover node_modules
    rm -rf frontend/node_modules
    
    # Remover arquivos de build
    rm -rf frontend/dist
    rm -rf backend/dist
    
    log_success "Ambiente resetado"
}

# Função principal
main() {
    local reset_flag=${1:-""}
    
    if [[ "$reset_flag" == "--reset" ]]; then
        reset_environment
        return 0
    fi
    
    log_info "Iniciando setup do ambiente de desenvolvimento..."
    
    check_system_dependencies
    check_versions
    setup_env_files
    setup_python_env
    setup_node_env
    setup_database
    setup_git_hooks
    run_verification_tests
    setup_sample_data
    
    show_final_info
}

# Executar função principal
main "$@"