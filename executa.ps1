# Script de automação para o projeto ML + Bling Sync
# Autor: Assistente de Programação
# Data: $(Get-Date)

# Função para imprimir mensagens coloridas
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Verificar se o Git está instalado
function Test-Git {
    try {
        $gitVersion = git --version
        Write-Success "Git está instalado: $gitVersion"
        return $true
    }
    catch {
        Write-Error "Git não está instalado. Por favor, instale o Git antes de continuar."
        return $false
    }
}

# Verificar se o Node.js está instalado
function Test-Node {
    try {
        $nodeVersion = node -v
        Write-Success "Node.js $nodeVersion está instalado"
        return $true
    }
    catch {
        Write-Error "Node.js não está instalado. Por favor, instale o Node.js antes de continuar."
        return $false
    }
}

# Verificar se o Docker está instalado (opcional)
function Test-Docker {
    try {
        $dockerVersion = docker --version
        Write-Success "Docker está instalado: $dockerVersion"
        return $true
    }
    catch {
        Write-Warning "Docker não está instalado. Alguns recursos podem não funcionar corretamente."
        return $false
    }
}

# Instalar dependências do frontend
function Install-FrontendDeps {
    Write-Status "Instalando dependências do frontend..."
    
    if (-not (Test-Path "package.json")) {
        Write-Warning "package.json não encontrado. Criando um novo..."
        $packageJson = @"
{
  "name": "ml-bling-sync-dashboard",
  "version": "1.0.0",
  "description": "Dashboard para ML + Bling Sync",
  "main": "dashboard.html",
  "scripts": {
    "start": "http-server -p 3000 -o",
    "dev": "http-server -p 3000 -o -c-1"
  },
  "devDependencies": {
    "http-server": "^14.1.1"
  }
}
"@
        $packageJson | Out-File -FilePath "package.json" -Encoding UTF8
    }
    
    try {
        npm install
        Write-Success "Dependências do frontend instaladas"
        return $true
    }
    catch {
        Write-Error "Falha ao instalar dependências do frontend"
        return $false
    }
}

# Criar arquivo de ambiente
function New-EnvFile {
    Write-Status "Criando arquivo de ambiente..."
    
    $envContent = @"
# Configurações do Ambiente
NODE_ENV=development
PORT=5000

# URLs
FRONTEND_URL=http://localhost:3000
API_BASE_URL=https://ml-bling-sync.vercel.app/api

# Mercado Livre
ML_CLIENT_ID=seu_ml_client_id
ML_CLIENT_SECRET=seu_ml_client_secret
ML_REDIRECT_URI=https://ml-bling-sync.vercel.app/auth/ml/callback

# Bling
BLING_API_KEY=sua_bling_api_key

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ml_bling_sync

# Redis (para filas e cache)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=seu_jwt_secret
JWT_EXPIRES_IN=7d
"@

    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Success "Arquivo .env criado. Por favor, edite-o com suas credenciais reais."
}

# Iniciar servidor local
function Start-LocalServer {
    Write-Status "Iniciando servidor local..."
    
    try {
        # Verificar se http-server está instalado globalmente
        $httpServerInstalled = $false
        try {
            http-server --version | Out-Null
            $httpServerInstalled = $true
        }
        catch {
            Write-Status "Instalando http-server globalmente..."
            npm install -g http-server
            $httpServerInstalled = $true
        }
        
        if ($httpServerInstalled) {
            Write-Success "Iniciando servidor em http://localhost:3000"
            Write-Status "Dashboard disponível em: http://localhost:3000/dashboard.html"
            Write-Status "Versão Vercel disponível em: https://ml-bling-sync.vercel.app"
            
            # Abrir navegador
            Start-Process "http://localhost:3000/dashboard.html"
            
            # Iniciar servidor
            http-server -p 3000 -o
        }
    }
    catch {
        Write-Error "Falha ao iniciar servidor local"
        Write-Status "Você pode acessar o dashboard diretamente pelo arquivo:"
        Write-Status "file:///C:/Users/Pedro/ml-bling-sync/dashboard.html"
        Write-Status "Ou pela versão Vercel: https://ml-bling-sync.vercel.app"
    }
}

# Função principal
function Main {
    Write-Status "Iniciando configuração do projeto ML + Bling Sync..."
    
    # Verificar pré-requisitos
    $gitOk = Test-Git
    $nodeOk = Test-Node
    $dockerOk = Test-Docker
    
    if (-not $gitOk -or -not $nodeOk) {
        Write-Error "Pré-requisitos não atendidos. Por favor, instale Git e Node.js."
        return
    }
    
    # Instalar dependências
    $depsOk = Install-FrontendDeps
    
    # Criar arquivo de ambiente
    New-EnvFile
    
    Write-Success "Configuração concluída!"
    Write-Status "Dashboard local: http://localhost:3000/dashboard.html"
    Write-Status "Dashboard Vercel: https://ml-bling-sync.vercel.app"
    Write-Status "Arquivo local: file:///C:/Users/Pedro/ml-bling-sync/dashboard.html"
    
    # Perguntar se deseja iniciar servidor local
    $response = Read-Host "Deseja iniciar o servidor local? (s/n)"
    if ($response -eq 's' -or $response -eq 'S') {
        Start-LocalServer
    } else {
        Write-Success "Configuração concluída. Acesse https://ml-bling-sync.vercel.app para usar o dashboard."
        # Abrir Vercel no navegador
        Start-Process "https://ml-bling-sync.vercel.app"
    }
}

# Executar função principal
Main