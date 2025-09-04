#!/bin/bash

# ML Bling Sync - Release Script
# Este script automatiza o processo de release da aplicação

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

# Verificar se estamos na branch main
check_branch() {
    local current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" && "$current_branch" != "master" ]]; then
        log_error "Você deve estar na branch main/master para fazer release"
        exit 1
    fi
    log_success "Branch atual: $current_branch"
}

# Verificar se o working directory está limpo
check_working_directory() {
    if [[ -n $(git status --porcelain) ]]; then
        log_error "Working directory não está limpo. Commit ou stash suas mudanças."
        git status --short
        exit 1
    fi
    log_success "Working directory está limpo"
}

# Verificar se estamos atualizados com o remote
check_remote_sync() {
    git fetch origin
    local local_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse origin/$(git branch --show-current))
    
    if [[ "$local_commit" != "$remote_commit" ]]; then
        log_error "Branch local não está sincronizada com o remote"
        log_info "Execute: git pull origin $(git branch --show-current)"
        exit 1
    fi
    log_success "Branch sincronizada com o remote"
}

# Executar testes
run_tests() {
    log_info "Executando testes..."
    
    # Frontend tests
    log_info "Executando testes do frontend..."
    cd frontend
    npm test -- --run --coverage
    cd ..
    
    # Backend tests
    log_info "Executando testes do backend..."
    cd backend
    pytest tests/ -v --cov=app
    cd ..
    
    log_success "Todos os testes passaram"
}

# Executar linting
run_linting() {
    log_info "Executando linting..."
    
    # Frontend linting
    log_info "Linting do frontend..."
    cd frontend
    npm run lint
    npm run type-check
    cd ..
    
    # Backend linting
    log_info "Linting do backend..."
    cd backend
    flake8 .
    black --check .
    isort --check-only .
    mypy .
    cd ..
    
    log_success "Linting passou"
}

# Verificar vulnerabilidades
check_security() {
    log_info "Verificando vulnerabilidades..."
    
    # Frontend security
    log_info "Verificando vulnerabilidades do frontend..."
    cd frontend
    npm audit --audit-level=high
    cd ..
    
    # Backend security
    log_info "Verificando vulnerabilidades do backend..."
    cd backend
    safety check
    cd ..
    
    log_success "Verificação de segurança passou"
}

# Atualizar versão
update_version() {
    local version=$1
    
    log_info "Atualizando versão para $version..."
    
    # Atualizar package.json do frontend
    cd frontend
    npm version $version --no-git-tag-version
    cd ..
    
    # Atualizar pyproject.toml do backend
    cd backend
    sed -i "s/version = \".*\"/version = \"$version\"/" pyproject.toml
    cd ..
    
    # Atualizar CHANGELOG.md
    local date=$(date +"%Y-%m-%d")
    sed -i "1i\\## [$version] - $date\\n" CHANGELOG.md
    
    log_success "Versão atualizada para $version"
}

# Criar commit de release
create_release_commit() {
    local version=$1
    
    log_info "Criando commit de release..."
    
    git add .
    git commit -m "chore: release v$version"
    
    log_success "Commit de release criado"
}

# Criar tag
create_tag() {
    local version=$1
    
    log_info "Criando tag v$version..."
    
    git tag -a "v$version" -m "Release v$version"
    
    log_success "Tag v$version criada"
}

# Push para remote
push_release() {
    local version=$1
    
    log_info "Fazendo push do release..."
    
    git push origin $(git branch --show-current)
    git push origin "v$version"
    
    log_success "Release v$version enviado para o remote"
}

# Verificar se a versão é válida
validate_version() {
    local version=$1
    
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        log_error "Versão inválida: $version"
        log_info "Use o formato semver: MAJOR.MINOR.PATCH (ex: 1.2.3)"
        exit 1
    fi
    
    # Verificar se a tag já existe
    if git tag -l | grep -q "^v$version$"; then
        log_error "Tag v$version já existe"
        exit 1
    fi
    
    log_success "Versão $version é válida"
}

# Gerar changelog
generate_changelog() {
    local version=$1
    local previous_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    
    log_info "Gerando changelog..."
    
    if [[ -n "$previous_tag" ]]; then
        log_info "Mudanças desde $previous_tag:"
        git log --pretty=format:"- %s" $previous_tag..HEAD
    else
        log_info "Primeiro release - todas as mudanças:"
        git log --pretty=format:"- %s"
    fi
    
    echo ""
}

# Build da aplicação
build_application() {
    log_info "Fazendo build da aplicação..."
    
    # Build frontend
    log_info "Build do frontend..."
    cd frontend
    npm run build
    cd ..
    
    # Build backend (se necessário)
    log_info "Build do backend..."
    cd backend
    python -m build
    cd ..
    
    log_success "Build concluído"
}

# Função principal
main() {
    local version=$1
    local skip_tests=${2:-false}
    
    if [[ -z "$version" ]]; then
        log_error "Uso: $0 <versão> [skip-tests]"
        log_info "Exemplo: $0 1.2.3"
        log_info "Para pular testes: $0 1.2.3 skip-tests"
        exit 1
    fi
    
    log_info "Iniciando processo de release para versão $version"
    
    # Verificações pré-release
    validate_version $version
    check_branch
    check_working_directory
    check_remote_sync
    
    # Testes e qualidade (se não for para pular)
    if [[ "$skip_tests" != "skip-tests" ]]; then
        run_linting
        check_security
        run_tests
    else
        log_warning "Pulando testes conforme solicitado"
    fi
    
    # Build
    build_application
    
    # Gerar changelog
    generate_changelog $version
    
    # Confirmar release
    echo ""
    log_warning "Você está prestes a fazer release da versão $version"
    read -p "Continuar? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Release cancelado"
        exit 0
    fi
    
    # Processo de release
    update_version $version
    create_release_commit $version
    create_tag $version
    push_release $version
    
    log_success "Release v$version concluído com sucesso!"
    log_info "O GitHub Actions irá automaticamente:"
    log_info "  - Executar testes E2E"
    log_info "  - Fazer build das imagens Docker"
    log_info "  - Deploy para staging"
    log_info "  - Criar release no GitHub"
    log_info "  - Aguardar aprovação para produção"
    
    echo ""
    log_info "Acompanhe o progresso em:"
    log_info "  https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:\/]\([^.]*\).*/\1/')/actions"
}

# Executar função principal
main "$@"