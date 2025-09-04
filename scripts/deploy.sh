#!/bin/bash

# ML Bling Sync - Deployment Script
# Este script automatiza o deployment da aplicação

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

# Configurações
DOCKER_REGISTRY="ghcr.io"
IMAGE_PREFIX="ml-bling-sync"
KUBECTL_TIMEOUT="300s"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=10

# Verificar dependências
check_dependencies() {
    log_info "Verificando dependências..."
    
    local missing_deps=()
    
    if ! command -v docker >/dev/null; then
        missing_deps+=("docker")
    fi
    
    if ! command -v kubectl >/dev/null; then
        missing_deps+=("kubectl")
    fi
    
    if ! command -v helm >/dev/null; then
        missing_deps+=("helm")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Dependências faltando: ${missing_deps[*]}"
        exit 1
    fi
    
    log_success "Dependências verificadas"
}

# Verificar contexto do Kubernetes
check_k8s_context() {
    local environment=$1
    
    log_info "Verificando contexto do Kubernetes..."
    
    local current_context=$(kubectl config current-context)
    log_info "Contexto atual: $current_context"
    
    # Verificar se o contexto corresponde ao ambiente
    case $environment in
        "staging")
            if [[ ! $current_context =~ staging ]]; then
                log_warning "Contexto pode não ser de staging: $current_context"
                read -p "Continuar mesmo assim? (y/N): " -n 1 -r
                echo ""
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    exit 1
                fi
            fi
            ;;
        "production")
            if [[ ! $current_context =~ prod ]]; then
                log_error "Contexto não é de produção: $current_context"
                log_info "Use: kubectl config use-context <production-context>"
                exit 1
            fi
            ;;
    esac
    
    log_success "Contexto do Kubernetes verificado"
}

# Build das imagens Docker
build_images() {
    local version=$1
    
    log_info "Fazendo build das imagens Docker..."
    
    # Build da imagem do backend
    log_info "Build da imagem do backend..."
    docker build -t $DOCKER_REGISTRY/$IMAGE_PREFIX/backend:$version \
        -t $DOCKER_REGISTRY/$IMAGE_PREFIX/backend:latest \
        -f backend/Dockerfile backend/
    
    # Build da imagem do frontend
    log_info "Build da imagem do frontend..."
    docker build -t $DOCKER_REGISTRY/$IMAGE_PREFIX/frontend:$version \
        -t $DOCKER_REGISTRY/$IMAGE_PREFIX/frontend:latest \
        -f frontend/Dockerfile frontend/
    
    log_success "Imagens Docker criadas"
}

# Push das imagens para o registry
push_images() {
    local version=$1
    
    log_info "Fazendo push das imagens para o registry..."
    
    # Login no registry se necessário
    if [[ -n "$GITHUB_TOKEN" ]]; then
        echo $GITHUB_TOKEN | docker login $DOCKER_REGISTRY -u $GITHUB_ACTOR --password-stdin
    fi
    
    # Push das imagens
    docker push $DOCKER_REGISTRY/$IMAGE_PREFIX/backend:$version
    docker push $DOCKER_REGISTRY/$IMAGE_PREFIX/backend:latest
    docker push $DOCKER_REGISTRY/$IMAGE_PREFIX/frontend:$version
    docker push $DOCKER_REGISTRY/$IMAGE_PREFIX/frontend:latest
    
    log_success "Imagens enviadas para o registry"
}

# Backup do banco de dados (apenas produção)
backup_database() {
    local environment=$1
    
    if [[ "$environment" != "production" ]]; then
        return 0
    fi
    
    log_info "Fazendo backup do banco de dados..."
    
    local backup_name="ml-bling-sync-backup-$(date +%Y%m%d-%H%M%S)"
    
    # Executar backup usando kubectl
    kubectl exec -n ml-bling-sync deployment/postgres -- \
        pg_dump -U postgres ml_bling_sync | \
        gzip > "backups/$backup_name.sql.gz"
    
    log_success "Backup criado: backups/$backup_name.sql.gz"
}

# Executar migrações do banco de dados
run_migrations() {
    local environment=$1
    
    log_info "Executando migrações do banco de dados..."
    
    # Criar job de migração
    kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: migration-$(date +%s)
  namespace: ml-bling-sync-$environment
spec:
  template:
    spec:
      containers:
      - name: migration
        image: $DOCKER_REGISTRY/$IMAGE_PREFIX/backend:latest
        command: ["alembic", "upgrade", "head"]
        envFrom:
        - secretRef:
            name: ml-bling-sync-secrets
        - configMapRef:
            name: ml-bling-sync-config
      restartPolicy: Never
  backoffLimit: 3
EOF
    
    # Aguardar conclusão da migração
    kubectl wait --for=condition=complete job/migration-$(date +%s) \
        -n ml-bling-sync-$environment --timeout=$KUBECTL_TIMEOUT
    
    log_success "Migrações executadas"
}

# Deploy usando Helm
deploy_with_helm() {
    local environment=$1
    local version=$2
    
    log_info "Fazendo deploy com Helm..."
    
    local namespace="ml-bling-sync-$environment"
    local release_name="ml-bling-sync-$environment"
    
    # Criar namespace se não existir
    kubectl create namespace $namespace --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy com Helm
    helm upgrade --install $release_name ./helm/ml-bling-sync \
        --namespace $namespace \
        --set image.tag=$version \
        --set environment=$environment \
        --values ./helm/ml-bling-sync/values-$environment.yaml \
        --wait \
        --timeout=$KUBECTL_TIMEOUT
    
    log_success "Deploy com Helm concluído"
}

# Verificar health checks
check_health() {
    local environment=$1
    
    log_info "Verificando health checks..."
    
    local namespace="ml-bling-sync-$environment"
    local retries=0
    
    while [[ $retries -lt $HEALTH_CHECK_RETRIES ]]; do
        # Verificar se os pods estão prontos
        local ready_pods=$(kubectl get pods -n $namespace -l app=ml-bling-sync \
            -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | \
            grep -o True | wc -l)
        
        local total_pods=$(kubectl get pods -n $namespace -l app=ml-bling-sync \
            --no-headers | wc -l)
        
        if [[ $ready_pods -eq $total_pods && $total_pods -gt 0 ]]; then
            log_success "Todos os pods estão prontos ($ready_pods/$total_pods)"
            break
        fi
        
        log_info "Aguardando pods ficarem prontos ($ready_pods/$total_pods)..."
        sleep $HEALTH_CHECK_INTERVAL
        ((retries++))
    done
    
    if [[ $retries -eq $HEALTH_CHECK_RETRIES ]]; then
        log_error "Health check falhou após $HEALTH_CHECK_RETRIES tentativas"
        return 1
    fi
    
    # Verificar endpoint de health
    local service_url
    case $environment in
        "staging")
            service_url="https://staging-api.ml-bling-sync.com"
            ;;
        "production")
            service_url="https://api.ml-bling-sync.com"
            ;;
        *)
            service_url="http://localhost:8000"
            ;;
    esac
    
    log_info "Verificando endpoint de health: $service_url/health"
    
    retries=0
    while [[ $retries -lt $HEALTH_CHECK_RETRIES ]]; do
        if curl -s "$service_url/health" | grep -q '"status":"healthy"'; then
            log_success "Endpoint de health respondendo corretamente"
            return 0
        fi
        
        log_info "Aguardando endpoint de health..."
        sleep $HEALTH_CHECK_INTERVAL
        ((retries++))
    done
    
    log_error "Endpoint de health não respondeu corretamente"
    return 1
}

# Smoke tests
run_smoke_tests() {
    local environment=$1
    
    log_info "Executando smoke tests..."
    
    local base_url
    case $environment in
        "staging")
            base_url="https://staging-api.ml-bling-sync.com"
            ;;
        "production")
            base_url="https://api.ml-bling-sync.com"
            ;;
        *)
            base_url="http://localhost:8000"
            ;;
    esac
    
    # Teste básico de API
    log_info "Testando endpoint de health..."
    if ! curl -s "$base_url/health" | grep -q '"status":"healthy"'; then
        log_error "Smoke test falhou: health endpoint"
        return 1
    fi
    
    # Teste de autenticação
    log_info "Testando endpoint de autenticação..."
    local auth_response=$(curl -s -o /dev/null -w "%{http_code}" "$base_url/auth/login")
    if [[ "$auth_response" != "405" && "$auth_response" != "200" ]]; then
        log_error "Smoke test falhou: auth endpoint (HTTP $auth_response)"
        return 1
    fi
    
    # Teste de métricas
    log_info "Testando endpoint de métricas..."
    if ! curl -s "$base_url/metrics" | grep -q "ml_bling_sync"; then
        log_error "Smoke test falhou: metrics endpoint"
        return 1
    fi
    
    log_success "Smoke tests passaram"
}

# Rollback
rollback_deployment() {
    local environment=$1
    local revision=${2:-""}
    
    log_warning "Fazendo rollback do deployment..."
    
    local namespace="ml-bling-sync-$environment"
    local release_name="ml-bling-sync-$environment"
    
    if [[ -n "$revision" ]]; then
        helm rollback $release_name $revision --namespace $namespace
    else
        helm rollback $release_name --namespace $namespace
    fi
    
    log_success "Rollback concluído"
}

# Monitoramento pós-deploy
post_deploy_monitoring() {
    local environment=$1
    
    log_info "Iniciando monitoramento pós-deploy..."
    
    # Aguardar 5 minutos e verificar métricas
    log_info "Aguardando 5 minutos para coleta de métricas..."
    sleep 300
    
    # Verificar logs de erro
    local namespace="ml-bling-sync-$environment"
    local error_count=$(kubectl logs -n $namespace -l app=ml-bling-sync \
        --since=5m | grep -i error | wc -l)
    
    if [[ $error_count -gt 10 ]]; then
        log_warning "Muitos erros detectados nos logs ($error_count)"
        log_info "Verifique os logs: kubectl logs -n $namespace -l app=ml-bling-sync"
    else
        log_success "Logs estão normais ($error_count erros)"
    fi
    
    # Verificar métricas de performance
    log_info "Verificando métricas de performance..."
    # Aqui você pode adicionar verificações específicas de métricas
    
    log_success "Monitoramento pós-deploy concluído"
}

# Mostrar ajuda
show_help() {
    echo "ML Bling Sync - Deployment Script"
    echo ""
    echo "Uso: $0 <ambiente> <versão> [opções]"
    echo ""
    echo "Ambientes:"
    echo "  staging     Deploy para ambiente de staging"
    echo "  production  Deploy para ambiente de produção"
    echo ""
    echo "Opções:"
    echo "  --skip-build        Pular build das imagens"
    echo "  --skip-push         Pular push das imagens"
    echo "  --skip-migrations   Pular migrações do banco"
    echo "  --skip-tests        Pular smoke tests"
    echo "  --rollback [rev]    Fazer rollback (opcionalmente para revisão específica)"
    echo "  --dry-run           Simular deployment sem executar"
    echo "  --help              Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 staging v1.2.3                    # Deploy normal para staging"
    echo "  $0 production v1.2.3 --skip-build    # Deploy para produção sem build"
    echo "  $0 staging --rollback                # Rollback para versão anterior"
    echo "  $0 production --rollback 5           # Rollback para revisão 5"
}

# Função principal
main() {
    local environment=$1
    local version=$2
    local skip_build=false
    local skip_push=false
    local skip_migrations=false
    local skip_tests=false
    local rollback=false
    local rollback_revision=""
    local dry_run=false
    
    # Parse argumentos
    shift 2 2>/dev/null || true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-push)
                skip_push=true
                shift
                ;;
            --skip-migrations)
                skip_migrations=true
                shift
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --rollback)
                rollback=true
                rollback_revision=$2
                shift 2
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "Opção desconhecida: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Validar argumentos
    if [[ -z "$environment" ]]; then
        log_error "Ambiente é obrigatório"
        show_help
        exit 1
    fi
    
    if [[ "$environment" != "staging" && "$environment" != "production" ]]; then
        log_error "Ambiente deve ser 'staging' ou 'production'"
        exit 1
    fi
    
    if [[ "$rollback" == "false" && -z "$version" ]]; then
        log_error "Versão é obrigatória para deploy"
        show_help
        exit 1
    fi
    
    # Verificar se é produção e pedir confirmação
    if [[ "$environment" == "production" && "$dry_run" == "false" ]]; then
        log_warning "Você está fazendo deploy para PRODUÇÃO!"
        read -p "Tem certeza? Digite 'DEPLOY' para confirmar: " confirmation
        if [[ "$confirmation" != "DEPLOY" ]]; then
            log_info "Deploy cancelado"
            exit 0
        fi
    fi
    
    log_info "Iniciando deployment para $environment..."
    
    if [[ "$dry_run" == "true" ]]; then
        log_warning "Modo dry-run ativado - nenhuma mudança será feita"
    fi
    
    # Verificações iniciais
    check_dependencies
    check_k8s_context $environment
    
    # Rollback
    if [[ "$rollback" == "true" ]]; then
        if [[ "$dry_run" == "false" ]]; then
            rollback_deployment $environment $rollback_revision
            check_health $environment
        fi
        log_success "Rollback concluído"
        exit 0
    fi
    
    # Deploy normal
    if [[ "$skip_build" == "false" && "$dry_run" == "false" ]]; then
        build_images $version
    fi
    
    if [[ "$skip_push" == "false" && "$dry_run" == "false" ]]; then
        push_images $version
    fi
    
    if [[ "$environment" == "production" && "$dry_run" == "false" ]]; then
        backup_database $environment
    fi
    
    if [[ "$skip_migrations" == "false" && "$dry_run" == "false" ]]; then
        run_migrations $environment
    fi
    
    if [[ "$dry_run" == "false" ]]; then
        deploy_with_helm $environment $version
        check_health $environment
    fi
    
    if [[ "$skip_tests" == "false" && "$dry_run" == "false" ]]; then
        run_smoke_tests $environment
    fi
    
    if [[ "$dry_run" == "false" ]]; then
        post_deploy_monitoring $environment
    fi
    
    log_success "Deployment para $environment concluído com sucesso! 🚀"
    
    # Informações finais
    case $environment in
        "staging")
            log_info "Aplicação disponível em: https://staging.ml-bling-sync.com"
            log_info "API disponível em: https://staging-api.ml-bling-sync.com"
            ;;
        "production")
            log_info "Aplicação disponível em: https://ml-bling-sync.com"
            log_info "API disponível em: https://api.ml-bling-sync.com"
            ;;
    esac
}

# Executar função principal
main "$@"