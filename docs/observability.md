# Sistema de Observabilidade - ML Bling Sync

## Visão Geral

O sistema de observabilidade do ML Bling Sync fornece monitoramento abrangente, logging estruturado, alertas inteligentes e dashboards em tempo real para garantir a operação confiável da plataforma.

## Componentes Principais

### 1. Health Checks

Sistema de verificação de saúde que monitora componentes críticos:

#### Verificações Disponíveis
- **Database**: Conectividade e performance do PostgreSQL
- **Redis**: Disponibilidade do cache e sessões
- **APIs Externas**: Conectividade com Bling e outros serviços
- **Recursos do Sistema**: CPU, memória e espaço em disco
- **Métricas da Aplicação**: Performance e throughput

#### Endpoints
```
GET /api/v1/health          # Status geral
GET /api/v1/health/ready    # Readiness check (Kubernetes)
GET /api/v1/health/live     # Liveness check (Kubernetes)
```

#### Exemplo de Resposta
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": {
      "status": "healthy",
      "response_time_ms": 45,
      "details": {
        "connection_pool_size": 10,
        "active_connections": 3
      }
    },
    "redis": {
      "status": "healthy",
      "response_time_ms": 12
    }
  }
}
```

### 2. Métricas

Coleta e exposição de métricas para monitoramento:

#### Tipos de Métricas
- **Contadores**: Requisições HTTP, erros, operações de sync
- **Histogramas**: Latência de APIs, tempo de processamento
- **Gauges**: Conexões ativas, uso de memória
- **Summaries**: Percentis de performance

#### Categorias
- **API**: Métricas de endpoints REST
- **Database**: Performance de queries
- **Sync**: Operações de sincronização
- **System**: Recursos do sistema
- **Business**: KPIs de negócio
- **Security**: Eventos de segurança

#### Endpoints
```
GET /api/v1/metrics              # Formato Prometheus
GET /api/v1/metrics/custom       # Métricas customizadas
GET /api/v1/metrics/system       # Métricas do sistema
POST /api/v1/metrics/custom      # Adicionar métrica customizada
```

#### Exemplo de Uso
```python
from app.core.metrics import get_metrics_collector, monitor_function

metrics = get_metrics_collector()

# Incrementar contador
metrics.increment_counter(
    "api_requests_total",
    labels={"method": "GET", "endpoint": "/api/sync"}
)

# Registrar latência
metrics.record_histogram(
    "api_request_duration",
    value=0.250,
    labels={"endpoint": "/api/sync"}
)

# Decorador para monitoramento automático
@monitor_function("process_sync_data")
async def process_sync_data(data):
    # Função será automaticamente monitorada
    pass
```

### 3. Logging Estruturado

Sistema de logging avançado com contexto e estruturação:

#### Características
- **Formato JSON**: Logs estruturados para análise
- **Contexto de Requisição**: Rastreamento por request_id
- **Categorização**: Logs organizados por categoria
- **Sampling**: Controle de volume de logs
- **Sanitização**: Remoção automática de dados sensíveis

#### Níveis de Log
- `DEBUG`: Informações detalhadas de desenvolvimento
- `INFO`: Eventos normais da aplicação
- `WARNING`: Situações que requerem atenção
- `ERROR`: Erros que não impedem a operação
- `CRITICAL`: Falhas críticas do sistema

#### Categorias
- `API`: Requisições e respostas HTTP
- `DATABASE`: Operações de banco de dados
- `SYNC`: Processos de sincronização
- `AUTH`: Autenticação e autorização
- `SECURITY`: Eventos de segurança
- `SYSTEM`: Eventos do sistema
- `BUSINESS`: Eventos de negócio

#### Exemplo de Uso
```python
from app.core.structured_logging import get_logger, LogCategory

logger = get_logger("sync_service")

# Log estruturado
logger.info(
    "Sync process started",
    category=LogCategory.SYNC,
    extra_data={
        "tenant_id": "tenant-123",
        "connector_id": "bling-connector",
        "batch_size": 100
    }
)

# Decorador para log automático
@log_function_call
async def sync_products(tenant_id: str):
    # Entrada e saída da função serão logadas automaticamente
    pass
```

### 4. Sistema de Alertas

Alertas inteligentes com múltiplos canais de notificação:

#### Severidades
- `LOW`: Informativo, não requer ação imediata
- `MEDIUM`: Requer atenção, mas não é crítico
- `HIGH`: Requer ação rápida
- `CRITICAL`: Requer ação imediata

#### Categorias
- `SYSTEM`: Problemas de infraestrutura
- `APPLICATION`: Erros da aplicação
- `SECURITY`: Eventos de segurança
- `BUSINESS`: Problemas de negócio
- `PERFORMANCE`: Problemas de performance

#### Canais de Notificação
- **Email**: SMTP configurável
- **Slack**: Webhooks para canais
- **Webhook**: HTTP callbacks customizados

#### Regras de Alerta
```python
# Exemplo de regras pré-definidas
ALERT_RULES = [
    {
        "name": "High Error Rate",
        "condition": "error_rate > 0.05",  # 5% de erro
        "severity": "HIGH",
        "category": "APPLICATION"
    },
    {
        "name": "Database Connection Pool Exhausted",
        "condition": "db_pool_usage > 0.9",  # 90% do pool
        "severity": "CRITICAL",
        "category": "SYSTEM"
    }
]
```

#### Endpoints
```
GET /api/v1/alerts              # Listar alertas
POST /api/v1/alerts/{id}/ack    # Reconhecer alerta
POST /api/v1/alerts/{id}/resolve # Resolver alerta
```

### 5. Dashboard de Sincronização

Dashboard especializado para monitoramento de sincronizações:

#### Funcionalidades
- **Visão Geral**: Estatísticas gerais de sync
- **Execuções Recentes**: Últimas sincronizações
- **Estatísticas por Conector**: Performance por integração
- **Estatísticas por Tenant**: Uso por cliente
- **Sistema de Replay**: Re-execução de sincronizações

#### Replay de Sincronizações
Permite re-executar sincronizações com falha:

```python
# Criar replay
replay_request = ReplayRequest(
    execution_ids=["exec-123", "exec-456"],
    connector_id="bling-connector",
    tenant_id="tenant-123",
    start_time=datetime.now() - timedelta(hours=1),
    end_time=datetime.now()
)

replay_id = await dashboard.create_replay(replay_request)
```

#### Endpoints
```
GET /api/v1/dashboard/sync                    # Visão geral
POST /api/v1/dashboard/sync/replay           # Criar replay
POST /api/v1/dashboard/sync/replay/{id}/run  # Executar replay
GET /api/v1/dashboard/sync/replay/{id}       # Status do replay
```

## Configuração

### Níveis de Observabilidade

#### Basic
- Health checks básicos
- Logging simples
- Métricas essenciais
- Sem alertas

#### Standard (Padrão)
- Todos os health checks
- Logging estruturado
- Métricas completas
- Alertas básicos

#### Advanced
- Tracing distribuído
- APM habilitado
- Profiling de performance
- Detecção de anomalias

#### Enterprise
- Todas as funcionalidades avançadas
- Escalação de alertas
- Compliance GDPR
- Métricas de alta cardinalidade

### Variáveis de Ambiente

```bash
# Nível de observabilidade
OBSERVABILITY_LEVEL=standard

# Métricas
METRICS_ENABLED=true
PROMETHEUS_ENABLED=true

# Logging
LOG_LEVEL=INFO
ELASTICSEARCH_ENABLED=false
ELASTICSEARCH_HOST=localhost:9200

# Health Checks
HEALTH_CHECK_INTERVAL=30

# Alertas
ALERTING_ENABLED=true
EMAIL_ALERTS_ENABLED=false
SLACK_ALERTS_ENABLED=false
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=alerts@company.com
SMTP_PASSWORD=password

# Tracing
TRACING_ENABLED=false
JAEGER_ENABLED=false
JAEGER_HOST=localhost
JAEGER_PORT=14268
```

### Configuração por Código

```python
from app.core.observability_config import (
    ObservabilityConfig, ObservabilityLevel
)

# Configuração customizada
config = ObservabilityConfig(
    level=ObservabilityLevel.ADVANCED,
    environment="production"
)

# Ajustar configurações específicas
config.metrics.system_metrics_interval = 15
config.alerting.escalation_enabled = True
config.logging.log_level = "WARNING"
```

## Integração com Kubernetes

### Health Checks
```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: ml-bling-sync
    livenessProbe:
      httpGet:
        path: /api/v1/health/live
        port: 8000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /api/v1/health/ready
        port: 8000
      initialDelaySeconds: 5
      periodSeconds: 5
```

### Service Monitor (Prometheus)
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ml-bling-sync
spec:
  selector:
    matchLabels:
      app: ml-bling-sync
  endpoints:
  - port: http
    path: /api/v1/metrics
    interval: 30s
```

## Monitoramento e Alertas

### Métricas Importantes

#### SLIs (Service Level Indicators)
- **Disponibilidade**: % de uptime
- **Latência**: P95 de tempo de resposta
- **Taxa de Erro**: % de requisições com erro
- **Throughput**: Requisições por segundo

#### Alertas Críticos
- Taxa de erro > 5%
- Latência P95 > 2 segundos
- Disponibilidade < 99.9%
- Pool de conexões DB > 90%
- Uso de memória > 85%
- Espaço em disco < 10%

### Dashboards Grafana

#### Dashboard Principal
- Visão geral do sistema
- Métricas de SLI/SLO
- Status de health checks
- Alertas ativos

#### Dashboard de Sincronização
- Execuções por hora
- Taxa de sucesso
- Latência por conector
- Volume de dados processados

#### Dashboard de Infraestrutura
- Uso de recursos
- Performance de banco de dados
- Métricas de Redis
- Logs de erro

## Troubleshooting

### Problemas Comuns

#### Health Checks Falhando
```bash
# Verificar conectividade do banco
curl http://localhost:8000/api/v1/health

# Logs detalhados
docker logs ml-bling-sync | grep health
```

#### Métricas Não Aparecendo
```bash
# Verificar endpoint de métricas
curl http://localhost:8000/api/v1/metrics

# Verificar configuração do Prometheus
kubectl get servicemonitor ml-bling-sync -o yaml
```

#### Alertas Não Sendo Enviados
```bash
# Verificar configuração SMTP
kubectl get secret smtp-config -o yaml

# Testar conectividade
telnet smtp.gmail.com 587
```

### Logs de Debug

```python
# Habilitar logs de debug para observabilidade
import logging
logging.getLogger("app.core.health").setLevel(logging.DEBUG)
logging.getLogger("app.core.metrics").setLevel(logging.DEBUG)
logging.getLogger("app.core.alerting").setLevel(logging.DEBUG)
```

## Melhores Práticas

### Desenvolvimento
1. **Sempre adicionar logs estruturados** em funções críticas
2. **Usar decoradores de monitoramento** para funções importantes
3. **Definir métricas de negócio** relevantes
4. **Testar health checks** em ambiente de desenvolvimento

### Produção
1. **Configurar alertas críticos** antes do deploy
2. **Monitorar SLIs/SLOs** continuamente
3. **Revisar dashboards** regularmente
4. **Manter logs por período adequado** para auditoria

### Segurança
1. **Sanitizar dados sensíveis** nos logs
2. **Usar HTTPS** para webhooks de alertas
3. **Restringir acesso** aos endpoints de métricas
4. **Auditar configurações** de observabilidade

## Roadmap

### Próximas Funcionalidades
- [ ] Tracing distribuído com OpenTelemetry
- [ ] Machine Learning para detecção de anomalias
- [ ] Integração com PagerDuty
- [ ] Dashboards customizáveis por tenant
- [ ] Métricas de custo por operação
- [ ] Alertas preditivos
- [ ] Compliance automático (SOC2, GDPR)

### Melhorias Planejadas
- [ ] Performance otimizada para alta cardinalidade
- [ ] Compressão de métricas históricas
- [ ] Sampling inteligente de logs
- [ ] Cache distribuído para métricas
- [ ] API GraphQL para dashboards

## Suporte

Para questões relacionadas ao sistema de observabilidade:

1. **Documentação**: Consulte esta documentação
2. **Logs**: Verifique logs da aplicação
3. **Métricas**: Analise dashboards do Grafana
4. **Alertas**: Revise alertas ativos
5. **Suporte**: Contate a equipe de DevOps

---

*Última atualização: Janeiro 2024*