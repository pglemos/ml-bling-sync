# ML Bling Sync - Runbook de Operações

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Produção](#arquitetura-de-produção)
3. [Procedimentos de Deploy](#procedimentos-de-deploy)
4. [Monitoramento e Alertas](#monitoramento-e-alertas)
5. [Troubleshooting](#troubleshooting)
6. [Disaster Recovery](#disaster-recovery)
7. [Manutenção](#manutenção)
8. [Contatos de Emergência](#contatos-de-emergência)

## Visão Geral

Este runbook contém todos os procedimentos operacionais para o sistema ML Bling Sync em produção.

### Ambientes

- **Development**: `dev.ml-bling-sync.com`
- **Staging**: `staging.ml-bling-sync.com`
- **Production**: `app.ml-bling-sync.com`

### Componentes Principais

- **Frontend**: Next.js (React)
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: Celery + Redis
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

## Arquitetura de Produção

### Infraestrutura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   Frontend      │────│   Backend       │
│   (Nginx)       │    │   (Next.js)     │    │   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │   Workers       │─────────────┤
                       │   (Celery)      │             │
                       └─────────────────┘             │
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │────│   Redis         │────│   Monitoring    │
│   (Primary)     │    │   (Cache/Queue) │    │   (Prometheus)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Recursos por Ambiente

#### Production
- **Frontend**: 2 instâncias (2 CPU, 4GB RAM)
- **Backend**: 3 instâncias (4 CPU, 8GB RAM)
- **Workers**: 2 instâncias (2 CPU, 4GB RAM)
- **PostgreSQL**: 1 instância (8 CPU, 16GB RAM, 500GB SSD)
- **Redis**: 1 instância (2 CPU, 4GB RAM)

#### Staging
- **Frontend**: 1 instância (1 CPU, 2GB RAM)
- **Backend**: 1 instância (2 CPU, 4GB RAM)
- **Workers**: 1 instância (1 CPU, 2GB RAM)
- **PostgreSQL**: 1 instância (2 CPU, 4GB RAM, 100GB SSD)
- **Redis**: 1 instância (1 CPU, 2GB RAM)

## Procedimentos de Deploy

### Deploy Automatizado (Recomendado)

#### 1. Deploy via GitHub Actions

```bash
# Trigger deploy para staging
git push origin main

# Trigger deploy para produção
git tag v1.2.3
git push origin v1.2.3
```

#### 2. Deploy Manual

```bash
# Clone do repositório
git clone https://github.com/company/ml-bling-sync.git
cd ml-bling-sync

# Deploy para staging
./scripts/deploy.sh staging v1.2.3

# Deploy para produção (após validação)
./scripts/deploy.sh production v1.2.3
```

### Checklist de Deploy

#### Pré-Deploy
- [ ] Todos os testes passando
- [ ] Code review aprovado
- [ ] Backup do banco de dados criado
- [ ] Notificação da equipe sobre o deploy
- [ ] Verificação de dependências externas

#### Durante o Deploy
- [ ] Monitorar logs em tempo real
- [ ] Verificar health checks
- [ ] Validar métricas de performance
- [ ] Testar funcionalidades críticas

#### Pós-Deploy
- [ ] Smoke tests executados
- [ ] Métricas de erro normais
- [ ] Performance dentro do esperado
- [ ] Notificação de sucesso para a equipe

### Rollback

#### Rollback Automático

```bash
# Via script
./scripts/deploy.sh production --rollback

# Via Helm
helm rollback ml-bling-sync-production
```

#### Rollback Manual

```bash
# Listar releases
helm history ml-bling-sync-production

# Rollback para versão específica
helm rollback ml-bling-sync-production 5

# Verificar status
kubectl get pods -n production
```

## Monitoramento e Alertas

### Dashboards Principais

#### 1. Dashboard de Sistema
- **URL**: `https://grafana.ml-bling-sync.com/d/system`
- **Métricas**: CPU, Memória, Disco, Rede
- **Alertas**: Uso > 80%, Disco > 90%

#### 2. Dashboard de Aplicação
- **URL**: `https://grafana.ml-bling-sync.com/d/app`
- **Métricas**: Requests/s, Latência, Erros
- **Alertas**: Error rate > 5%, Latência > 2s

#### 3. Dashboard de Negócio
- **URL**: `https://grafana.ml-bling-sync.com/d/business`
- **Métricas**: Sincronizações, Usuários ativos, Revenue
- **Alertas**: Sincronizações falhando > 10%

### Alertas Críticos

#### Nível 1 - Crítico (Resposta imediata)
- Sistema indisponível (> 5 min)
- Error rate > 10%
- Database down
- Perda de dados

#### Nível 2 - Alto (Resposta em 30 min)
- Performance degradada
- Error rate > 5%
- Disco > 90%
- Sincronizações falhando

#### Nível 3 - Médio (Resposta em 2 horas)
- Uso de recursos > 80%
- Latência elevada
- Alertas de segurança

### Comandos de Monitoramento

```bash
# Status geral do cluster
kubectl get nodes
kubectl get pods --all-namespaces

# Logs da aplicação
kubectl logs -f deployment/backend -n production
kubectl logs -f deployment/frontend -n production

# Métricas de recursos
kubectl top nodes
kubectl top pods -n production

# Status do banco de dados
psql -h db.ml-bling-sync.com -U postgres -c "SELECT version();"
psql -h db.ml-bling-sync.com -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

## Troubleshooting

### Problemas Comuns

#### 1. Aplicação Não Responde

**Sintomas**: HTTP 502/503, timeouts

**Diagnóstico**:
```bash
# Verificar pods
kubectl get pods -n production

# Verificar logs
kubectl logs deployment/backend -n production --tail=100

# Verificar recursos
kubectl top pods -n production
```

**Soluções**:
- Restart dos pods: `kubectl rollout restart deployment/backend -n production`
- Scale up: `kubectl scale deployment/backend --replicas=5 -n production`
- Verificar configurações de rede

#### 2. Banco de Dados Lento

**Sintomas**: Queries lentas, timeouts de conexão

**Diagnóstico**:
```sql
-- Queries ativas
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Estatísticas de tabelas
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats WHERE tablename = 'products';
```

**Soluções**:
- Kill queries longas: `SELECT pg_terminate_backend(pid);`
- Reindex tabelas: `REINDEX TABLE products;`
- Analisar estatísticas: `ANALYZE;`
- Verificar configurações de conexão

#### 3. Sincronizações Falhando

**Sintomas**: Erros nos logs, produtos não sincronizados

**Diagnóstico**:
```bash
# Logs dos workers
kubectl logs deployment/worker -n production

# Status das filas
redis-cli -h redis.ml-bling-sync.com LLEN sync_queue

# Verificar conectores
curl -X GET "https://api.ml-bling-sync.com/health/connectors"
```

**Soluções**:
- Restart workers: `kubectl rollout restart deployment/worker -n production`
- Limpar filas: `redis-cli -h redis.ml-bling-sync.com FLUSHDB`
- Verificar credenciais dos conectores
- Re-executar sincronizações falhadas

#### 4. Problemas de Performance

**Sintomas**: Latência alta, timeouts

**Diagnóstico**:
```bash
# APM traces
curl "https://apm.ml-bling-sync.com/api/traces?service=backend&duration=>2s"

# Métricas de cache
redis-cli -h redis.ml-bling-sync.com INFO stats

# Profiling da aplicação
curl "https://api.ml-bling-sync.com/debug/profile"
```

**Soluções**:
- Otimizar queries lentas
- Aumentar cache TTL
- Scale horizontal
- Otimizar código crítico

### Logs e Debugging

#### Localização dos Logs

```bash
# Logs da aplicação (Kubernetes)
kubectl logs -f deployment/backend -n production
kubectl logs -f deployment/frontend -n production
kubectl logs -f deployment/worker -n production

# Logs do sistema (ELK Stack)
# Kibana: https://kibana.ml-bling-sync.com
# Query: kubernetes.namespace:"production" AND kubernetes.container.name:"backend"

# Logs do banco de dados
# PostgreSQL logs via monitoring dashboard
```

#### Níveis de Log

- **ERROR**: Erros que impedem funcionamento
- **WARN**: Situações anômalas que não impedem funcionamento
- **INFO**: Informações importantes de fluxo
- **DEBUG**: Informações detalhadas para debugging

## Disaster Recovery

### Backup Strategy

#### Banco de Dados

```bash
# Backup automático (diário às 2:00 AM)
# Configurado via cron job no cluster

# Backup manual
pg_dump -h db.ml-bling-sync.com -U postgres ml_bling_sync > backup_$(date +%Y%m%d_%H%M%S).sql

# Upload para S3
aws s3 cp backup_*.sql s3://ml-bling-sync-backups/database/

# Verificar backups
aws s3 ls s3://ml-bling-sync-backups/database/ --recursive
```

#### Arquivos e Configurações

```bash
# Backup de configurações
kubectl get configmaps -n production -o yaml > configmaps_backup.yaml
kubectl get secrets -n production -o yaml > secrets_backup.yaml

# Backup de volumes persistentes
# Configurado via snapshots automáticos do cloud provider
```

### Procedimentos de Recovery

#### 1. Recovery Completo do Sistema

**Cenário**: Perda total do cluster

```bash
# 1. Provisionar nova infraestrutura
terraform apply -var="environment=production-recovery"

# 2. Restaurar banco de dados
psql -h new-db.ml-bling-sync.com -U postgres -c "CREATE DATABASE ml_bling_sync;"
psql -h new-db.ml-bling-sync.com -U postgres ml_bling_sync < latest_backup.sql

# 3. Deploy da aplicação
./scripts/deploy.sh production-recovery latest

# 4. Verificar integridade
./scripts/verify-recovery.sh

# 5. Atualizar DNS
# Apontar app.ml-bling-sync.com para novo cluster
```

#### 2. Recovery do Banco de Dados

**Cenário**: Corrupção ou perda de dados

```bash
# 1. Parar aplicação
kubectl scale deployment/backend --replicas=0 -n production
kubectl scale deployment/worker --replicas=0 -n production

# 2. Backup do estado atual (se possível)
pg_dump -h db.ml-bling-sync.com -U postgres ml_bling_sync > corrupted_backup.sql

# 3. Restaurar do backup
psql -h db.ml-bling-sync.com -U postgres -c "DROP DATABASE ml_bling_sync;"
psql -h db.ml-bling-sync.com -U postgres -c "CREATE DATABASE ml_bling_sync;"
psql -h db.ml-bling-sync.com -U postgres ml_bling_sync < latest_backup.sql

# 4. Executar migrações se necessário
kubectl run migration --image=ml-bling-sync/backend:latest --rm -it -- alembic upgrade head

# 5. Reiniciar aplicação
kubectl scale deployment/backend --replicas=3 -n production
kubectl scale deployment/worker --replicas=2 -n production

# 6. Verificar integridade
./scripts/verify-data-integrity.sh
```

#### 3. Recovery de Configurações

```bash
# Restaurar ConfigMaps
kubectl apply -f configmaps_backup.yaml

# Restaurar Secrets
kubectl apply -f secrets_backup.yaml

# Restart pods para aplicar configurações
kubectl rollout restart deployment/backend -n production
kubectl rollout restart deployment/frontend -n production
```

### RTO e RPO

- **RTO (Recovery Time Objective)**: 4 horas
- **RPO (Recovery Point Objective)**: 1 hora
- **Backup Frequency**: A cada 6 horas
- **Backup Retention**: 30 dias

## Manutenção

### Manutenção Programada

#### Janela de Manutenção
- **Frequência**: Mensal (primeira segunda-feira do mês)
- **Horário**: 02:00 - 06:00 AM (horário local)
- **Duração**: Máximo 4 horas

#### Checklist de Manutenção

##### Mensal
- [ ] Atualização de dependências
- [ ] Limpeza de logs antigos
- [ ] Verificação de backups
- [ ] Análise de performance
- [ ] Revisão de alertas
- [ ] Teste de disaster recovery

##### Trimestral
- [ ] Atualização do Kubernetes
- [ ] Atualização do sistema operacional
- [ ] Revisão de capacidade
- [ ] Auditoria de segurança
- [ ] Otimização de banco de dados

##### Anual
- [ ] Revisão completa da arquitetura
- [ ] Teste completo de disaster recovery
- [ ] Renovação de certificados
- [ ] Revisão de contratos de SLA

### Comandos de Manutenção

```bash
# Limpeza de logs
kubectl delete pods --field-selector=status.phase==Succeeded -n production

# Limpeza de imagens Docker
docker system prune -af

# Otimização do banco
psql -h db.ml-bling-sync.com -U postgres -c "VACUUM ANALYZE;"

# Verificação de certificados
echo | openssl s_client -servername app.ml-bling-sync.com -connect app.ml-bling-sync.com:443 2>/dev/null | openssl x509 -noout -dates

# Atualização de dependências
./scripts/update-dependencies.sh
```

## Contatos de Emergência

### Equipe de Operações

- **Tech Lead**: João Silva - +55 11 99999-1111 - joao@company.com
- **DevOps Engineer**: Maria Santos - +55 11 99999-2222 - maria@company.com
- **SRE**: Pedro Costa - +55 11 99999-3333 - pedro@company.com

### Fornecedores

- **Cloud Provider**: AWS Support - +1 800 123-4567
- **Database**: PostgreSQL Support - support@postgresql.com
- **Monitoring**: Grafana Support - support@grafana.com

### Escalation Matrix

1. **Nível 1**: Engineer on-call (resposta em 15 min)
2. **Nível 2**: Tech Lead (resposta em 30 min)
3. **Nível 3**: CTO (resposta em 1 hora)
4. **Nível 4**: CEO (resposta em 2 horas)

### Canais de Comunicação

- **Slack**: #ops-alerts, #incidents
- **PagerDuty**: https://company.pagerduty.com
- **Status Page**: https://status.ml-bling-sync.com

---

**Última atualização**: $(date)
**Versão**: 1.0
**Responsável**: Equipe de Operações