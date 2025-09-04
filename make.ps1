# ML Bling Sync - PowerShell Script (Equivalente ao Makefile)
# Comandos úteis para desenvolvimento e deployment no Windows

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    [Parameter(Position=1)]
    [string]$Param1,
    [Parameter(Position=2)]
    [string]$Param2
)

# Variáveis
$PROJECT_NAME = "ml-bling-sync"
$DOCKER_REGISTRY = "ghcr.io"
$IMAGE_PREFIX = "$DOCKER_REGISTRY/$PROJECT_NAME"

# Função para obter versão do Git
function Get-Version {
    try {
        return (git describe --tags --always --dirty 2>$null)
    } catch {
        return "dev"
    }
}

$VERSION = Get-Version

# Funções de logging com cores
function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Função de ajuda
function Show-Help {
    Write-Host "ML Bling Sync - PowerShell Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso: .\make.ps1 <comando> [parâmetros]" -ForegroundColor White
    Write-Host ""
    Write-Host "Comandos disponíveis:" -ForegroundColor White
    Write-Host ""
    Write-Host "  help                 Mostrar esta ajuda" -ForegroundColor Cyan
    Write-Host "  setup                Configurar ambiente de desenvolvimento" -ForegroundColor Cyan
    Write-Host "  setup-reset          Resetar ambiente de desenvolvimento" -ForegroundColor Cyan
    Write-Host "  dev                  Iniciar servidores de desenvolvimento" -ForegroundColor Cyan
    Write-Host "  dev-backend          Iniciar apenas o servidor backend" -ForegroundColor Cyan
    Write-Host "  dev-frontend         Iniciar apenas o servidor frontend" -ForegroundColor Cyan
    Write-Host "  dev-stop             Parar servidores de desenvolvimento" -ForegroundColor Cyan
    Write-Host "  install              Instalar dependências do projeto" -ForegroundColor Cyan
    Write-Host "  test                 Executar todos os testes" -ForegroundColor Cyan
    Write-Host "  test-unit            Executar apenas testes unitários" -ForegroundColor Cyan
    Write-Host "  test-integration     Executar apenas testes de integração" -ForegroundColor Cyan
    Write-Host "  test-e2e             Executar apenas testes E2E" -ForegroundColor Cyan
    Write-Host "  test-frontend        Executar apenas testes do frontend" -ForegroundColor Cyan
    Write-Host "  test-backend         Executar apenas testes do backend" -ForegroundColor Cyan
    Write-Host "  test-performance     Executar testes de performance" -ForegroundColor Cyan
    Write-Host "  test-security        Executar testes de segurança" -ForegroundColor Cyan
    Write-Host "  lint                 Executar linting em todo o código" -ForegroundColor Cyan
    Write-Host "  lint-fix             Corrigir problemas de linting automaticamente" -ForegroundColor Cyan
    Write-Host "  security             Verificar vulnerabilidades de segurança" -ForegroundColor Cyan
    Write-Host "  build                Build das imagens Docker" -ForegroundColor Cyan
    Write-Host "  build-frontend       Build de produção do frontend" -ForegroundColor Cyan
    Write-Host "  build-backend        Build de produção do backend" -ForegroundColor Cyan
    Write-Host "  migrate              Executar migrações do banco de dados" -ForegroundColor Cyan
    Write-Host "  migrate-create       Criar nova migração" -ForegroundColor Cyan
    Write-Host "  migrate-downgrade    Reverter última migração" -ForegroundColor Cyan
    Write-Host "  deploy-staging       Deploy para ambiente de staging" -ForegroundColor Cyan
    Write-Host "  deploy-production    Deploy para ambiente de produção" -ForegroundColor Cyan
    Write-Host "  rollback-staging     Rollback no ambiente de staging" -ForegroundColor Cyan
    Write-Host "  rollback-production  Rollback no ambiente de produção" -ForegroundColor Cyan
    Write-Host "  release              Fazer release" -ForegroundColor Cyan
    Write-Host "  release-fast         Fazer release pulando testes" -ForegroundColor Cyan
    Write-Host "  clean                Limpar arquivos temporários e caches" -ForegroundColor Cyan
    Write-Host "  clean-all            Limpar tudo incluindo dependências" -ForegroundColor Cyan
    Write-Host "  logs                 Mostrar logs dos serviços de desenvolvimento" -ForegroundColor Cyan
    Write-Host "  logs-db              Mostrar logs apenas do PostgreSQL" -ForegroundColor Cyan
    Write-Host "  logs-redis           Mostrar logs apenas do Redis" -ForegroundColor Cyan
    Write-Host "  db-connect           Conectar ao banco de dados PostgreSQL" -ForegroundColor Cyan
    Write-Host "  redis-connect        Conectar ao Redis" -ForegroundColor Cyan
    Write-Host "  db-backup            Fazer backup do banco de dados" -ForegroundColor Cyan
    Write-Host "  db-restore           Restaurar backup do banco de dados" -ForegroundColor Cyan
    Write-Host "  db-reset             Resetar banco de dados" -ForegroundColor Cyan
    Write-Host "  status               Mostrar status dos serviços" -ForegroundColor Cyan
    Write-Host "  info                 Mostrar informações do projeto" -ForegroundColor Cyan
    Write-Host "  check-deps           Verificar dependências do sistema" -ForegroundColor Cyan
    Write-Host "  update-deps          Atualizar dependências do projeto" -ForegroundColor Cyan
    Write-Host "  docs                 Gerar documentação da API" -ForegroundColor Cyan
    Write-Host "  format               Executar formatação de código" -ForegroundColor Cyan
    Write-Host "  quality              Executar análise completa de qualidade de código" -ForegroundColor Cyan
    Write-Host "  ci                   Executar pipeline completo de CI" -ForegroundColor Cyan
    Write-Host "  prod-ready           Verificar se está pronto para produção" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor White
    Write-Host "  .\make.ps1 setup          # Configurar ambiente de desenvolvimento" -ForegroundColor Gray
    Write-Host "  .\make.ps1 dev            # Iniciar desenvolvimento" -ForegroundColor Gray
    Write-Host "  .\make.ps1 test           # Executar todos os testes" -ForegroundColor Gray
    Write-Host "  .\make.ps1 deploy-staging # Deploy para staging" -ForegroundColor Gray
}

# Função para executar comandos com tratamento de erro
function Invoke-Command($cmd) {
    Write-Host "Executando: $cmd" -ForegroundColor Gray
    Invoke-Expression $cmd
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Comando falhou com código de saída: $LASTEXITCODE"
        exit $LASTEXITCODE
    }
}

# Função para verificar se um comando existe
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Comandos principais
switch ($Command.ToLower()) {
    "help" {
        Show-Help
    }
    
    "setup" {
        Write-Info "Configurando ambiente de desenvolvimento..."
        if (Test-Path "scripts\dev-setup.sh") {
            if (Test-Command "bash") {
                Invoke-Command "bash scripts/dev-setup.sh"
            } else {
                Write-Warning "Bash não encontrado. Execute manualmente os comandos de setup."
            }
        } else {
            Write-Warning "Script dev-setup.sh não encontrado."
        }
        Write-Success "Ambiente configurado com sucesso!"
    }
    
    "setup-reset" {
        Write-Warning "Resetando ambiente de desenvolvimento..."
        if (Test-Path "scripts\dev-setup.sh") {
            if (Test-Command "bash") {
                Invoke-Command "bash scripts/dev-setup.sh --reset"
            } else {
                Write-Warning "Bash não encontrado. Execute manualmente os comandos de reset."
            }
        }
        Write-Success "Ambiente resetado!"
    }
    
    "dev" {
        Write-Info "Iniciando servidores de desenvolvimento..."
        Invoke-Command "docker-compose -f docker-compose.dev.yml up -d postgres redis"
        Write-Host "Aguardando serviços ficarem prontos..."
        Start-Sleep -Seconds 5
        
        # Iniciar backend em background
        Start-Job -ScriptBlock {
            Set-Location $using:PWD
            & .\make.ps1 dev-backend
        } | Out-Null
        
        # Iniciar frontend em background
        Start-Job -ScriptBlock {
            Set-Location $using:PWD
            & .\make.ps1 dev-frontend
        } | Out-Null
        
        Write-Success "Servidores iniciados em background"
        Write-Info "Use '.\make.ps1 status' para verificar o status"
    }
    
    "dev-backend" {
        Write-Info "Iniciando backend..."
        Set-Location "backend"
        if (Test-Path "venv\Scripts\Activate.ps1") {
            & .\venv\Scripts\Activate.ps1
            Invoke-Command "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
        } else {
            Write-Error "Ambiente virtual não encontrado. Execute 'setup' primeiro."
        }
    }
    
    "dev-frontend" {
        Write-Info "Iniciando frontend..."
        Set-Location "frontend"
        Invoke-Command "npm run dev"
    }
    
    "dev-stop" {
        Write-Info "Parando servidores de desenvolvimento..."
        Invoke-Command "docker-compose -f docker-compose.dev.yml down"
        Get-Process | Where-Object {$_.ProcessName -like "*uvicorn*" -or $_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Success "Servidores parados"
    }
    
    "install" {
        Write-Info "Instalando dependências..."
        
        # Backend
        Set-Location "backend"
        if (Test-Path "venv\Scripts\Activate.ps1") {
            & .\venv\Scripts\Activate.ps1
            Invoke-Command "pip install -r requirements.txt -r requirements-dev.txt"
        }
        
        # Frontend
        Set-Location "..\frontend"
        Invoke-Command "npm install"
        
        Set-Location ".."
        Write-Success "Dependências instaladas"
    }
    
    "test" {
        Write-Info "Executando todos os testes..."
        if (Test-Path "scripts\run-tests.sh") {
            if (Test-Command "bash") {
                Invoke-Command "bash scripts/run-tests.sh"
            } else {
                Write-Warning "Bash não encontrado. Execute os testes manualmente."
            }
        }
    }
    
    "test-unit" {
        Write-Info "Executando testes unitários..."
        if (Test-Command "bash") {
            Invoke-Command "bash scripts/run-tests.sh --unit"
        }
    }
    
    "test-integration" {
        Write-Info "Executando testes de integração..."
        if (Test-Command "bash") {
            Invoke-Command "bash scripts/run-tests.sh --integration"
        }
    }
    
    "test-e2e" {
        Write-Info "Executando testes E2E..."
        if (Test-Command "bash") {
            Invoke-Command "bash scripts/run-tests.sh --e2e"
        }
    }
    
    "test-frontend" {
        Write-Info "Executando testes do frontend..."
        Set-Location "frontend"
        Invoke-Command "npm test"
        Set-Location ".."
    }
    
    "test-backend" {
        Write-Info "Executando testes do backend..."
        Set-Location "backend"
        if (Test-Path "venv\Scripts\Activate.ps1") {
            & .\venv\Scripts\Activate.ps1
            Invoke-Command "pytest"
        }
        Set-Location ".."
    }
    
    "lint" {
        Write-Info "Executando linting..."
        
        # Frontend
        Set-Location "frontend"
        Invoke-Command "npm run lint"
        if (Test-Command "npm run type-check") {
            Invoke-Command "npm run type-check"
        }
        
        # Backend
        Set-Location "..\backend"
        if (Test-Path "venv\Scripts\Activate.ps1") {
            & .\venv\Scripts\Activate.ps1
            Invoke-Command "flake8 ."
            Invoke-Command "black --check ."
            Invoke-Command "isort --check-only ."
            if (Test-Command "mypy") {
                Invoke-Command "mypy ."
            }
        }
        
        Set-Location ".."
        Write-Success "Linting concluído"
    }
    
    "lint-fix" {
        Write-Info "Corrigindo problemas de linting..."
        
        # Frontend
        Set-Location "frontend"
        if (Test-Command "npm run lint:fix") {
            Invoke-Command "npm run lint:fix"
        }
        
        # Backend
        Set-Location "..\backend"
        if (Test-Path "venv\Scripts\Activate.ps1") {
            & .\venv\Scripts\Activate.ps1
            Invoke-Command "black ."
            Invoke-Command "isort ."
        }
        
        Set-Location ".."
        Write-Success "Problemas de linting corrigidos"
    }
    
    "security" {
        Write-Info "Verificando vulnerabilidades..."
        
        # Frontend
        Set-Location "frontend"
        Invoke-Command "npm audit --audit-level=high"
        
        # Backend
        Set-Location "..\backend"
        if (Test-Path "venv\Scripts\Activate.ps1") {
            & .\venv\Scripts\Activate.ps1
            if (Test-Command "safety") {
                Invoke-Command "safety check"
            }
            if (Test-Command "bandit") {
                Invoke-Command "bandit -r app/"
            }
        }
        
        Set-Location ".."
        Write-Success "Verificação de segurança concluída"
    }
    
    "build" {
        Write-Info "Fazendo build das imagens Docker..."
        Invoke-Command "docker build -t $IMAGE_PREFIX/backend:$VERSION -t $IMAGE_PREFIX/backend:latest -f backend/Dockerfile backend/"
        Invoke-Command "docker build -t $IMAGE_PREFIX/frontend:$VERSION -t $IMAGE_PREFIX/frontend:latest -f frontend/Dockerfile frontend/"
        Write-Success "Build das imagens concluído"
    }
    
    "build-frontend" {
        Write-Info "Fazendo build do frontend..."
        Set-Location "frontend"
        Invoke-Command "npm run build"
        Set-Location ".."
        Write-Success "Build do frontend concluído"
    }
    
    "build-backend" {
        Write-Info "Fazendo build do backend..."
        Set-Location "backend"
        if (Test-Path "venv\Scripts\Activate.ps1") {
            & .\venv\Scripts\Activate.ps1
            Invoke-Command "python -m build"
        }
        Set-Location ".."
        Write-Success "Build do backend concluído"
    }
    
    "status" {
        Write-Info "Status dos serviços:"
        Invoke-Command "docker-compose -f docker-compose.dev.yml ps"
        Write-Host ""
        Write-Info "Verificando aplicações:"
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✅ Backend: OK" -ForegroundColor Green
        } catch {
            Write-Host "❌ Backend: Não disponível" -ForegroundColor Red
        }
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✅ Frontend: OK" -ForegroundColor Green
        } catch {
            Write-Host "❌ Frontend: Não disponível" -ForegroundColor Red
        }
    }
    
    "info" {
        Write-Host "ML Bling Sync - Informações do Projeto" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Versão: $VERSION"
        Write-Host "Registry: $DOCKER_REGISTRY"
        Write-Host "Imagens: $IMAGE_PREFIX"
        Write-Host ""
        Write-Host "URLs de desenvolvimento:"
        Write-Host "  Frontend: http://localhost:3000"
        Write-Host "  Backend: http://localhost:8000"
        Write-Host "  API Docs: http://localhost:8000/docs"
        Write-Host "  PostgreSQL: localhost:5432"
        Write-Host "  Redis: localhost:6379"
        Write-Host ""
        Write-Host "Comandos úteis:"
        Write-Host "  .\make.ps1 dev     # Iniciar desenvolvimento"
        Write-Host "  .\make.ps1 test    # Executar testes"
        Write-Host "  .\make.ps1 lint    # Verificar código"
        Write-Host "  .\make.ps1 build   # Build das imagens"
    }
    
    "check-deps" {
        Write-Info "Verificando dependências do sistema..."
        
        $deps = @(
            @{Name="Node.js"; Command="node"; VersionArg="--version"},
            @{Name="Python"; Command="python"; VersionArg="--version"},
            @{Name="Docker"; Command="docker"; VersionArg="--version"},
            @{Name="Docker Compose"; Command="docker-compose"; VersionArg="--version"},
            @{Name="Git"; Command="git"; VersionArg="--version"},
            @{Name="Kubectl"; Command="kubectl"; VersionArg="version --client --short"; Optional=$true},
            @{Name="Helm"; Command="helm"; VersionArg="version --short"; Optional=$true}
        )
        
        foreach ($dep in $deps) {
            if (Test-Command $dep.Command) {
                try {
                    $version = Invoke-Expression "$($dep.Command) $($dep.VersionArg)" 2>$null
                    Write-Host "✅ $($dep.Name): $version" -ForegroundColor Green
                } catch {
                    Write-Host "✅ $($dep.Name): Instalado" -ForegroundColor Green
                }
            } else {
                if ($dep.Optional) {
                    Write-Host "⚠️  $($dep.Name): Não instalado (opcional)" -ForegroundColor Yellow
                } else {
                    Write-Host "❌ $($dep.Name): Não instalado" -ForegroundColor Red
                }
            }
        }
    }
    
    "clean" {
        Write-Info "Limpando arquivos temporários..."
        
        $pathsToClean = @(
            "frontend\dist",
            "frontend\node_modules\.cache",
            "backend\dist",
            "backend\.pytest_cache",
            "backend\__pycache__"
        )
        
        foreach ($path in $pathsToClean) {
            if (Test-Path $path) {
                Remove-Item -Recurse -Force $path
                Write-Host "Removido: $path" -ForegroundColor Gray
            }
        }
        
        # Remover arquivos .pyc
        Get-ChildItem -Recurse -Filter "*.pyc" | Remove-Item -Force
        Get-ChildItem -Recurse -Directory -Name "__pycache__" | Remove-Item -Recurse -Force
        
        Invoke-Command "docker system prune -f"
        Write-Success "Limpeza concluída"
    }
    
    "clean-all" {
        Write-Warning "Limpando todas as dependências..."
        
        # Executar clean primeiro
        & $MyInvocation.MyCommand.Path clean
        
        # Remover dependências
        if (Test-Path "frontend\node_modules") {
            Remove-Item -Recurse -Force "frontend\node_modules"
        }
        if (Test-Path "backend\venv") {
            Remove-Item -Recurse -Force "backend\venv"
        }
        
        Invoke-Command "docker-compose -f docker-compose.dev.yml down -v"
        Invoke-Command "docker system prune -af"
        Write-Success "Limpeza completa concluída"
    }
    
    default {
        Write-Error "Comando desconhecido: $Command"
        Write-Host "Use '.\make.ps1 help' para ver os comandos disponíveis."
        exit 1
    }
}