#!/bin/bash

# ML Bling Sync - Test Runner Script
# Este script executa todos os tipos de testes da aplicação

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

# Variáveis globais
TEST_RESULTS_DIR="test-results"
COVERAGE_DIR="coverage"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FAILED_TESTS=()

# Criar diretórios de resultados
setup_test_directories() {
    log_info "Configurando diretórios de teste..."
    
    mkdir -p $TEST_RESULTS_DIR
    mkdir -p $COVERAGE_DIR
    
    log_success "Diretórios configurados"
}

# Verificar se os serviços estão rodando
check_services() {
    log_info "Verificando serviços necessários..."
    
    # Verificar PostgreSQL
    if ! docker-compose -f docker-compose.dev.yml ps postgres | grep -q "Up"; then
        log_warning "PostgreSQL não está rodando. Iniciando..."
        docker-compose -f docker-compose.dev.yml up -d postgres
        sleep 5
    fi
    
    # Verificar Redis
    if ! docker-compose -f docker-compose.dev.yml ps redis | grep -q "Up"; then
        log_warning "Redis não está rodando. Iniciando..."
        docker-compose -f docker-compose.dev.yml up -d redis
        sleep 3
    fi
    
    log_success "Serviços verificados"
}

# Executar testes unitários do backend
run_backend_unit_tests() {
    log_info "Executando testes unitários do backend..."
    
    cd backend
    
    # Ativar virtual environment
    source venv/bin/activate
    
    # Executar testes com coverage
    pytest tests/unit/ \
        -v \
        --cov=app \
        --cov-report=html:../$COVERAGE_DIR/backend-unit \
        --cov-report=xml:../$COVERAGE_DIR/backend-unit-coverage.xml \
        --cov-report=term \
        --junit-xml=../$TEST_RESULTS_DIR/backend-unit-results.xml \
        --tb=short
    
    local exit_code=$?
    cd ..
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "Testes unitários do backend passaram"
    else
        log_error "Testes unitários do backend falharam"
        FAILED_TESTS+=("backend-unit")
    fi
    
    return $exit_code
}

# Executar testes de integração do backend
run_backend_integration_tests() {
    log_info "Executando testes de integração do backend..."
    
    cd backend
    
    # Ativar virtual environment
    source venv/bin/activate
    
    # Executar testes de integração
    pytest tests/integration/ \
        -v \
        --cov=app \
        --cov-report=html:../$COVERAGE_DIR/backend-integration \
        --cov-report=xml:../$COVERAGE_DIR/backend-integration-coverage.xml \
        --cov-report=term \
        --junit-xml=../$TEST_RESULTS_DIR/backend-integration-results.xml \
        --tb=short
    
    local exit_code=$?
    cd ..
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "Testes de integração do backend passaram"
    else
        log_error "Testes de integração do backend falharam"
        FAILED_TESTS+=("backend-integration")
    fi
    
    return $exit_code
}

# Executar testes unitários do frontend
run_frontend_unit_tests() {
    log_info "Executando testes unitários do frontend..."
    
    cd frontend
    
    # Executar testes com coverage
    npm test -- \
        --run \
        --coverage \
        --reporter=junit \
        --outputFile=../$TEST_RESULTS_DIR/frontend-unit-results.xml
    
    local exit_code=$?
    
    # Mover coverage para diretório correto
    if [[ -d "coverage" ]]; then
        mv coverage ../$COVERAGE_DIR/frontend-unit
    fi
    
    cd ..
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "Testes unitários do frontend passaram"
    else
        log_error "Testes unitários do frontend falharam"
        FAILED_TESTS+=("frontend-unit")
    fi
    
    return $exit_code
}

# Executar testes de componentes do frontend
run_frontend_component_tests() {
    log_info "Executando testes de componentes do frontend..."
    
    cd frontend
    
    # Executar testes de componentes
    npm run test:components -- \
        --run \
        --reporter=junit \
        --outputFile=../$TEST_RESULTS_DIR/frontend-component-results.xml
    
    local exit_code=$?
    cd ..
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "Testes de componentes do frontend passaram"
    else
        log_error "Testes de componentes do frontend falharam"
        FAILED_TESTS+=("frontend-component")
    fi
    
    return $exit_code
}

# Executar testes E2E
run_e2e_tests() {
    log_info "Executando testes E2E..."
    
    # Verificar se as aplicações estão rodando
    check_applications_running
    
    cd tests/e2e
    
    # Instalar dependências se necessário
    if [[ ! -d "node_modules" ]]; then
        npm install
    fi
    
    # Executar testes E2E
    npx playwright test \
        --reporter=html,junit \
        --output-dir=../../$TEST_RESULTS_DIR/e2e
    
    local exit_code=$?
    cd ../..
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "Testes E2E passaram"
    else
        log_error "Testes E2E falharam"
        FAILED_TESTS+=("e2e")
    fi
    
    return $exit_code
}

# Verificar se as aplicações estão rodando para E2E
check_applications_running() {
    log_info "Verificando se as aplicações estão rodando..."
    
    # Verificar backend
    if ! curl -s http://localhost:8000/health >/dev/null; then
        log_warning "Backend não está rodando. Iniciando..."
        cd backend
        source venv/bin/activate
        nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
        echo $! > ../backend.pid
        cd ..
        sleep 10
    fi
    
    # Verificar frontend
    if ! curl -s http://localhost:3000 >/dev/null; then
        log_warning "Frontend não está rodando. Iniciando..."
        cd frontend
        nohup npm run dev > ../frontend.log 2>&1 &
        echo $! > ../frontend.pid
        cd ..
        sleep 15
    fi
    
    log_success "Aplicações verificadas"
}

# Executar testes de performance
run_performance_tests() {
    log_info "Executando testes de performance..."
    
    cd backend
    source venv/bin/activate
    
    # Executar testes de performance com locust
    if command -v locust >/dev/null; then
        locust -f tests/performance/locustfile.py \
            --headless \
            --users 10 \
            --spawn-rate 2 \
            --run-time 60s \
            --host http://localhost:8000 \
            --html ../$TEST_RESULTS_DIR/performance-report.html
        
        local exit_code=$?
        
        if [[ $exit_code -eq 0 ]]; then
            log_success "Testes de performance passaram"
        else
            log_error "Testes de performance falharam"
            FAILED_TESTS+=("performance")
        fi
    else
        log_warning "Locust não instalado. Pulando testes de performance"
    fi
    
    cd ..
}

# Executar testes de segurança
run_security_tests() {
    log_info "Executando testes de segurança..."
    
    # Backend security
    cd backend
    source venv/bin/activate
    
    # Safety check
    safety check --json --output ../$TEST_RESULTS_DIR/safety-report.json || true
    
    # Bandit security linter
    bandit -r app/ -f json -o ../$TEST_RESULTS_DIR/bandit-report.json || true
    
    cd ..
    
    # Frontend security
    cd frontend
    
    # npm audit
    npm audit --json > ../$TEST_RESULTS_DIR/npm-audit-report.json || true
    
    cd ..
    
    log_success "Testes de segurança concluídos"
}

# Gerar relatório consolidado
generate_consolidated_report() {
    log_info "Gerando relatório consolidado..."
    
    local report_file="$TEST_RESULTS_DIR/consolidated-report-$TIMESTAMP.html"
    
    cat > $report_file << EOF
<!DOCTYPE html>
<html>
<head>
    <title>ML Bling Sync - Relatório de Testes</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .failed-tests { background: #ffe6e6; }
        .passed-tests { background: #e6ffe6; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ML Bling Sync - Relatório de Testes</h1>
        <p>Executado em: $(date)</p>
        <p>Timestamp: $TIMESTAMP</p>
    </div>
    
    <div class="section">
        <h2>Resumo</h2>
EOF
    
    if [[ ${#FAILED_TESTS[@]} -eq 0 ]]; then
        echo "        <p class='success'>✅ Todos os testes passaram!</p>" >> $report_file
    else
        echo "        <p class='error'>❌ ${#FAILED_TESTS[@]} suíte(s) de teste falharam</p>" >> $report_file
        echo "        <div class='failed-tests'>" >> $report_file
        echo "            <h3>Testes que falharam:</h3>" >> $report_file
        echo "            <ul>" >> $report_file
        for test in "${FAILED_TESTS[@]}"; do
            echo "                <li>$test</li>" >> $report_file
        done
        echo "            </ul>" >> $report_file
        echo "        </div>" >> $report_file
    fi
    
    cat >> $report_file << EOF
    </div>
    
    <div class="section">
        <h2>Arquivos de Resultado</h2>
        <ul>
            <li><a href="backend-unit-results.xml">Backend Unit Tests (XML)</a></li>
            <li><a href="backend-integration-results.xml">Backend Integration Tests (XML)</a></li>
            <li><a href="frontend-unit-results.xml">Frontend Unit Tests (XML)</a></li>
            <li><a href="frontend-component-results.xml">Frontend Component Tests (XML)</a></li>
            <li><a href="e2e/">E2E Tests Results</a></li>
            <li><a href="performance-report.html">Performance Report</a></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Coverage Reports</h2>
        <ul>
            <li><a href="../coverage/backend-unit/index.html">Backend Unit Coverage</a></li>
            <li><a href="../coverage/backend-integration/index.html">Backend Integration Coverage</a></li>
            <li><a href="../coverage/frontend-unit/index.html">Frontend Unit Coverage</a></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Security Reports</h2>
        <ul>
            <li><a href="safety-report.json">Python Safety Report</a></li>
            <li><a href="bandit-report.json">Bandit Security Report</a></li>
            <li><a href="npm-audit-report.json">NPM Audit Report</a></li>
        </ul>
    </div>
</body>
</html>
EOF
    
    log_success "Relatório consolidado gerado: $report_file"
}

# Cleanup de processos
cleanup_processes() {
    log_info "Limpando processos..."
    
    # Parar backend se foi iniciado pelo script
    if [[ -f "backend.pid" ]]; then
        kill $(cat backend.pid) 2>/dev/null || true
        rm backend.pid
    fi
    
    # Parar frontend se foi iniciado pelo script
    if [[ -f "frontend.pid" ]]; then
        kill $(cat frontend.pid) 2>/dev/null || true
        rm frontend.pid
    fi
}

# Mostrar ajuda
show_help() {
    echo "ML Bling Sync - Test Runner"
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  --unit              Executar apenas testes unitários"
    echo "  --integration       Executar apenas testes de integração"
    echo "  --e2e               Executar apenas testes E2E"
    echo "  --performance       Executar apenas testes de performance"
    echo "  --security          Executar apenas testes de segurança"
    echo "  --frontend          Executar apenas testes do frontend"
    echo "  --backend           Executar apenas testes do backend"
    echo "  --coverage          Gerar apenas relatórios de coverage"
    echo "  --no-cleanup        Não limpar processos ao final"
    echo "  --help              Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0                  # Executar todos os testes"
    echo "  $0 --unit          # Apenas testes unitários"
    echo "  $0 --frontend --unit # Apenas testes unitários do frontend"
}

# Função principal
main() {
    local run_unit=false
    local run_integration=false
    local run_e2e=false
    local run_performance=false
    local run_security=false
    local run_frontend=false
    local run_backend=false
    local run_all=true
    local no_cleanup=false
    
    # Parse argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit)
                run_unit=true
                run_all=false
                shift
                ;;
            --integration)
                run_integration=true
                run_all=false
                shift
                ;;
            --e2e)
                run_e2e=true
                run_all=false
                shift
                ;;
            --performance)
                run_performance=true
                run_all=false
                shift
                ;;
            --security)
                run_security=true
                run_all=false
                shift
                ;;
            --frontend)
                run_frontend=true
                run_all=false
                shift
                ;;
            --backend)
                run_backend=true
                run_all=false
                shift
                ;;
            --no-cleanup)
                no_cleanup=true
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
    
    # Trap para cleanup
    if [[ "$no_cleanup" != "true" ]]; then
        trap cleanup_processes EXIT
    fi
    
    log_info "Iniciando execução de testes..."
    
    setup_test_directories
    check_services
    
    # Executar testes baseado nos argumentos
    if [[ "$run_all" == "true" ]]; then
        run_backend_unit_tests || true
        run_backend_integration_tests || true
        run_frontend_unit_tests || true
        run_frontend_component_tests || true
        run_e2e_tests || true
        run_performance_tests || true
        run_security_tests || true
    else
        if [[ "$run_backend" == "true" || "$run_unit" == "true" ]]; then
            run_backend_unit_tests || true
        fi
        
        if [[ "$run_backend" == "true" || "$run_integration" == "true" ]]; then
            run_backend_integration_tests || true
        fi
        
        if [[ "$run_frontend" == "true" || "$run_unit" == "true" ]]; then
            run_frontend_unit_tests || true
        fi
        
        if [[ "$run_frontend" == "true" ]]; then
            run_frontend_component_tests || true
        fi
        
        if [[ "$run_e2e" == "true" ]]; then
            run_e2e_tests || true
        fi
        
        if [[ "$run_performance" == "true" ]]; then
            run_performance_tests || true
        fi
        
        if [[ "$run_security" == "true" ]]; then
            run_security_tests || true
        fi
    fi
    
    generate_consolidated_report
    
    # Resultado final
    echo ""
    if [[ ${#FAILED_TESTS[@]} -eq 0 ]]; then
        log_success "Todos os testes passaram! 🎉"
        exit 0
    else
        log_error "${#FAILED_TESTS[@]} suíte(s) de teste falharam: ${FAILED_TESTS[*]}"
        exit 1
    fi
}

# Executar função principal
main "$@"