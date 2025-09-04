# ML Bling Sync - Guia para Windows

Este guia explica como usar o projeto ML Bling Sync no Windows, onde o comando `make` não está disponível nativamente.

## Alternativa ao Makefile

Como o Windows não possui o comando `make` por padrão, criamos um script PowerShell equivalente que oferece a mesma funcionalidade.

### Usando o Script PowerShell

Em vez de usar `make <comando>`, use:

```powershell
.\make.ps1 <comando>
```

## Comandos Principais

### Configuração Inicial
```powershell
# Verificar dependências do sistema
.\make.ps1 check-deps

# Configurar ambiente de desenvolvimento
.\make.ps1 setup

# Instalar dependências
.\make.ps1 install
```

### Desenvolvimento
```powershell
# Iniciar todos os serviços de desenvolvimento
.\make.ps1 dev

# Iniciar apenas o backend
.\make.ps1 dev-backend

# Iniciar apenas o frontend
.\make.ps1 dev-frontend

# Parar todos os serviços
.\make.ps1 dev-stop

# Verificar status dos serviços
.\make.ps1 status
```

### Testes
```powershell
# Executar todos os testes
.\make.ps1 test

# Executar apenas testes unitários
.\make.ps1 test-unit

# Executar apenas testes E2E
.\make.ps1 test-e2e

# Executar testes do frontend
.\make.ps1 test-frontend

# Executar testes do backend
.\make.ps1 test-backend
```

### Qualidade de Código
```powershell
# Executar linting
.\make.ps1 lint

# Corrigir problemas de linting automaticamente
.\make.ps1 lint-fix

# Verificar vulnerabilidades de segurança
.\make.ps1 security

# Executar análise completa de qualidade
.\make.ps1 quality
```

### Build e Deploy
```powershell
# Build das imagens Docker
.\make.ps1 build

# Build apenas do frontend
.\make.ps1 build-frontend

# Build apenas do backend
.\make.ps1 build-backend

# Deploy para staging
.\make.ps1 deploy-staging

# Deploy para produção
.\make.ps1 deploy-production
```

### Banco de Dados
```powershell
# Executar migrações
.\make.ps1 migrate

# Criar nova migração
.\make.ps1 migrate-create

# Conectar ao banco de dados
.\make.ps1 db-connect

# Fazer backup do banco
.\make.ps1 db-backup

# Resetar banco de dados
.\make.ps1 db-reset
```

### Utilitários
```powershell
# Mostrar informações do projeto
.\make.ps1 info

# Mostrar logs dos serviços
.\make.ps1 logs

# Limpar arquivos temporários
.\make.ps1 clean

# Limpar tudo (incluindo dependências)
.\make.ps1 clean-all

# Mostrar ajuda completa
.\make.ps1 help
```

## Dependências Necessárias

### Obrigatórias
- **Node.js** (v18+): Para o frontend React
- **Python** (v3.8+): Para o backend FastAPI
- **Git**: Para controle de versão

### Opcionais (para produção)
- **Docker**: Para containerização
- **Docker Compose**: Para orquestração de containers
- **kubectl**: Para deploy em Kubernetes
- **Helm**: Para gerenciamento de charts Kubernetes

## Instalação de Dependências no Windows

### Node.js
1. Baixe do site oficial: https://nodejs.org/
2. Execute o instalador e siga as instruções
3. Verifique: `node --version`

### Python
1. Baixe do site oficial: https://python.org/
2. **IMPORTANTE**: Marque "Add Python to PATH" durante a instalação
3. Verifique: `python --version`

### Docker Desktop
1. Baixe do site oficial: https://docker.com/products/docker-desktop
2. Execute o instalador
3. Reinicie o computador se necessário
4. Verifique: `docker --version`

### Git
1. Baixe do site oficial: https://git-scm.com/
2. Execute o instalador com as configurações padrão
3. Verifique: `git --version`

## Configuração do Ambiente Virtual Python

O script automatiza isso, mas se precisar fazer manualmente:

```powershell
# Navegar para o diretório backend
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
.\venv\Scripts\Activate.ps1

# Instalar dependências
pip install -r requirements.txt -r requirements-dev.txt
```

## Configuração do Frontend

```powershell
# Navegar para o diretório frontend
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

## Troubleshooting

### Erro de Política de Execução do PowerShell

Se receber erro sobre política de execução, execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erro "bash não encontrado"

Alguns scripts usam bash. Instale o Git Bash ou WSL:

1. **Git Bash**: Já incluído com o Git for Windows
2. **WSL**: Execute `wsl --install` no PowerShell como administrador

### Problemas com Docker

Se o Docker não estiver funcionando:

1. Verifique se o Docker Desktop está rodando
2. Verifique se a virtualização está habilitada no BIOS
3. Para WSL2, certifique-se de que está atualizado

### Problemas com Portas

Se as portas estiverem em uso:

```powershell
# Verificar o que está usando a porta 3000
netstat -ano | findstr :3000

# Verificar o que está usando a porta 8000
netstat -ano | findstr :8000

# Matar processo por PID (substitua XXXX pelo PID)
taskkill /PID XXXX /F
```

## Estrutura do Projeto

```
ml-bling-sync/
├── frontend/          # Aplicação React
├── backend/           # API FastAPI
├── scripts/           # Scripts de automação
├── tests/             # Testes E2E
├── .github/           # Workflows CI/CD
├── make.ps1           # Script PowerShell (equivalente ao Makefile)
├── Makefile           # Makefile original (para Linux/Mac)
└── README-WINDOWS.md  # Este arquivo
```

## URLs de Desenvolvimento

Quando os serviços estiverem rodando:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Próximos Passos

1. Execute `.\make.ps1 check-deps` para verificar dependências
2. Execute `.\make.ps1 setup` para configurar o ambiente
3. Execute `.\make.ps1 dev` para iniciar o desenvolvimento
4. Acesse http://localhost:3000 para ver a aplicação

## Suporte

Para mais informações:
- Execute `.\make.ps1 help` para ver todos os comandos
- Execute `.\make.ps1 info` para ver informações do projeto
- Consulte a documentação no diretório `docs/`