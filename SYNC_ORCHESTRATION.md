# Sistema de Orquestração de Sincronização

Este documento descreve o sistema de orquestração de sincronização implementado para gerenciar a sincronização de dados entre diferentes plataformas de e-commerce.

## Visão Geral

O sistema de orquestração permite:
- Agendar e executar sincronizações de forma assíncrona
- Monitorar o progresso e status das sincronizações
- Gerenciar filas de prioridade
- Visualizar estatísticas e métricas
- Cancelar e reagendar jobs

## Componentes

### Backend

#### 1. Modelos de Dados (`backend/app/domain/models.py`)
- `SyncJobStatus`: Enumeração com estados dos jobs (QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED)
- `SyncJob`: Modelo principal para jobs de sincronização

#### 2. Tarefas Celery (`backend/app/services/sync_tasks.py`)
- `sync_products_task`: Sincronização de produtos
- `sync_inventory_task`: Sincronização de inventário
- `sync_orders_task`: Sincronização de pedidos
- `sync_all_integrations_task`: Sincronização completa
- `cleanup_old_sync_jobs_task`: Limpeza de jobs antigos

#### 3. API Routes (`backend/app/api/routers/sync.py`)
- `POST /api/sync/jobs`: Criar job individual
- `POST /api/sync/jobs/bulk`: Criar jobs em massa
- `GET /api/sync/jobs/{job_id}`: Status do job
- `DELETE /api/sync/jobs/{job_id}`: Cancelar job
- `GET /api/sync/jobs`: Listar jobs
- `GET /api/sync/queue/stats`: Estatísticas da fila
- `POST /api/sync/quick`: Sincronização rápida

#### 4. Configuração Celery (`backend/app/core/celery_config.py`)
- Configuração de filas por prioridade
- Roteamento de tarefas
- Agendamento de tarefas periódicas
- Configurações de worker

### Frontend

#### 1. Dashboard de Sincronização (`src/components/sync/SyncDashboard.tsx`)
- Visualização de estatísticas da fila
- Lista de jobs com filtros
- Criação de novos jobs
- Sincronização rápida
- Monitoramento em tempo real

#### 2. Página do Dashboard (`src/app/dashboard/sync/page.tsx`)
- Página Next.js para o dashboard
- Integração com o componente SyncDashboard

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
CELERY_TASK_SERIALIZER=json
CELERY_RESULT_SERIALIZER=json
CELERY_TIMEZONE=America/Sao_Paulo
CELERY_WORKER_CONCURRENCY=4
CELERY_WORKER_MAX_TASKS_PER_CHILD=1000
CELERY_TASK_SOFT_TIME_LIMIT=300
CELERY_TASK_TIME_LIMIT=600
CELERY_RESULT_EXPIRES=3600

# Flower Configuration
FLOWER_PORT=5555
FLOWER_BASIC_AUTH=admin:password
FLOWER_URL_PREFIX=/flower
```

### Dependências

Instale as dependências do backend:

```bash
cd backend
pip install -r requirements.txt
```

## Execução

### Desenvolvimento

Para facilitar o desenvolvimento, use o script `start_services.py`:

```bash
cd backend
python start_services.py
```

Este script inicia:
- Servidor FastAPI (porta 8000)
- Worker Celery
- Celery Beat (agendador)
- Flower (monitoramento - porta 5555)

### Produção

Em produção, execute cada serviço separadamente:

```bash
# Terminal 1: Backend API
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Worker Celery
cd backend
python worker.py

# Terminal 3: Celery Beat
cd backend
python beat.py

# Terminal 4: Flower (opcional)
cd backend
python flower.py
```

## Uso

### Dashboard Web

Acesse o dashboard em: `http://localhost:3000/dashboard/sync`

### API Endpoints

#### Criar Job de Sincronização

```bash
curl -X POST "http://localhost:8000/api/sync/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "integration_id": "uuid-da-integracao",
    "sync_type": "products",
    "priority": "high",
    "options": {
      "full_sync": true,
      "batch_size": 100
    }
  }'
```

#### Verificar Status do Job

```bash
curl "http://localhost:8000/api/sync/jobs/{job_id}"
```

#### Listar Jobs

```bash
curl "http://localhost:8000/api/sync/jobs?status=running&limit=10"
```

#### Estatísticas da Fila

```bash
curl "http://localhost:8000/api/sync/queue/stats"
```

#### Sincronização Rápida

```bash
curl -X POST "http://localhost:8000/api/sync/quick" \
  -H "Content-Type: application/json" \
  -d '{
    "integration_id": "uuid-da-integracao",
    "sync_types": ["products", "inventory"]
  }'
```

## Monitoramento

### Flower

Acesse o Flower em: `http://localhost:5555/flower`

- Visualize workers ativos
- Monitore tarefas em execução
- Veja estatísticas de performance
- Gerencie filas

### Logs

Os logs são configurados para diferentes níveis:
- INFO: Operações normais
- WARNING: Situações que requerem atenção
- ERROR: Erros que impedem a execução

## Filas e Prioridades

### Filas Disponíveis

1. `urgent`: Prioridade máxima
2. `high_priority`: Alta prioridade
3. `sync_products`: Sincronização de produtos
4. `sync_inventory`: Sincronização de inventário
5. `sync_orders`: Sincronização de pedidos
6. `sync_bulk`: Operações em massa
7. `maintenance`: Tarefas de manutenção
8. `default`: Fila padrão

### Roteamento

O sistema roteia automaticamente as tarefas para as filas apropriadas baseado no tipo e prioridade.

## Manutenção

### Limpeza Automática

O sistema executa automaticamente:
- Limpeza de jobs antigos (diariamente às 02:00)
- Sincronização completa (diariamente às 03:00)

### Limpeza Manual

```python
from app.services.sync_tasks import cleanup_old_sync_jobs_task
cleanup_old_sync_jobs_task.delay()
```

## Troubleshooting

### Problemas Comuns

1. **Redis não conecta**: Verifique se o Redis está rodando
2. **Worker não processa**: Verifique as configurações de fila
3. **Jobs ficam em QUEUED**: Verifique se o worker está ativo
4. **Flower não carrega**: Verifique as credenciais de autenticação

### Logs de Debug

Para habilitar logs detalhados:

```env
LOG_LEVEL=DEBUG
CELERY_LOG_LEVEL=DEBUG
```

## Extensibilidade

### Adicionando Novos Tipos de Sincronização

1. Adicione o novo tipo em `sync_tasks.py`
2. Configure o roteamento em `celery_config.py`
3. Atualize a interface no frontend
4. Adicione testes apropriados

### Personalizando Filas

Modifique `CELERY_TASK_ROUTES` em `celery_config.py` para personalizar o roteamento de tarefas.