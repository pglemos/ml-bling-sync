# Release Checklist - ML Bling Sync

## Pré-Release

### 🔍 Code Review & Quality
- [ ] Todos os PRs foram revisados e aprovados
- [ ] Código está seguindo os padrões estabelecidos
- [ ] Documentação foi atualizada (README, API docs, etc.)
- [ ] Comentários e TODOs desnecessários foram removidos
- [ ] Logs de debug foram removidos ou configurados adequadamente

### 🧪 Testes
- [ ] Todos os testes unitários estão passando
- [ ] Todos os testes de integração estão passando
- [ ] Testes E2E (Playwright) executados com sucesso
- [ ] Testes de performance executados
- [ ] Testes de segurança executados
- [ ] Coverage de testes está acima de 80%

### 🔒 Segurança
- [ ] Scan de vulnerabilidades executado (npm audit, safety)
- [ ] Dependências atualizadas para versões seguras
- [ ] Secrets e chaves não estão expostos no código
- [ ] Rate limiting configurado adequadamente
- [ ] CORS configurado corretamente
- [ ] Headers de segurança configurados

### 📊 Performance
- [ ] Bundle size analisado e otimizado
- [ ] Lazy loading implementado onde necessário
- [ ] Imagens otimizadas
- [ ] Cache configurado adequadamente
- [ ] Database queries otimizadas
- [ ] Índices de banco de dados criados

### 🗄️ Database
- [ ] Migrations testadas em ambiente de staging
- [ ] Backup do banco de dados criado
- [ ] Scripts de rollback preparados
- [ ] Índices necessários criados
- [ ] Constraints de integridade verificadas

### 🔧 Configuração
- [ ] Variáveis de ambiente documentadas
- [ ] Configurações de produção validadas
- [ ] Logs configurados adequadamente
- [ ] Monitoramento configurado
- [ ] Alertas configurados

## Ambiente de Staging

### 🚀 Deploy
- [ ] Deploy em staging executado com sucesso
- [ ] Migrations executadas corretamente
- [ ] Serviços iniciaram sem erros
- [ ] Health checks passando

### ✅ Validação Funcional
- [ ] Login/logout funcionando
- [ ] Sincronização de produtos funcionando
- [ ] Sincronização de pedidos funcionando
- [ ] Dashboard carregando corretamente
- [ ] Relatórios sendo gerados
- [ ] Notificações funcionando
- [ ] Integração com Bling funcionando
- [ ] Integração com Stripe funcionando

### 🔍 Testes de Integração
- [ ] APIs externas respondendo corretamente
- [ ] Webhooks funcionando
- [ ] Jobs em background executando
- [ ] Cache funcionando
- [ ] Sessões persistindo corretamente

### 📈 Performance em Staging
- [ ] Tempo de resposta das APIs < 500ms
- [ ] Tempo de carregamento das páginas < 3s
- [ ] Memory usage estável
- [ ] CPU usage normal
- [ ] Database performance adequada

## Release

### 📝 Documentação
- [ ] CHANGELOG.md atualizado
- [ ] Versão atualizada em package.json
- [ ] Release notes preparadas
- [ ] Documentação de API atualizada
- [ ] Guias de migração criados (se necessário)

### 🏷️ Versionamento
- [ ] Tag de versão criada (ex: v1.2.0)
- [ ] Branch de release criada
- [ ] Commits organizados e com mensagens claras
- [ ] Merge para main/master executado

### 🚀 Deploy Produção
- [ ] Backup do banco de dados criado
- [ ] Deploy executado com sucesso
- [ ] Migrations executadas
- [ ] Serviços reiniciados
- [ ] Health checks passando
- [ ] Rollback plan preparado

## Pós-Release

### 🔍 Monitoramento
- [ ] Logs sendo coletados corretamente
- [ ] Métricas sendo reportadas
- [ ] Alertas configurados e funcionando
- [ ] Dashboard de monitoramento atualizado
- [ ] Error tracking funcionando

### ✅ Validação Produção
- [ ] Smoke tests executados
- [ ] Funcionalidades críticas testadas
- [ ] Performance monitorada por 1 hora
- [ ] Logs verificados por erros
- [ ] Usuários conseguem acessar o sistema

### 📊 Métricas
- [ ] Baseline de performance estabelecido
- [ ] Métricas de negócio coletadas
- [ ] SLA sendo monitorado
- [ ] Alertas de performance configurados

### 📢 Comunicação
- [ ] Equipe notificada sobre o release
- [ ] Usuários notificados (se necessário)
- [ ] Documentação de suporte atualizada
- [ ] Release notes publicadas

## Rollback Plan

### 🔄 Preparação
- [ ] Scripts de rollback testados
- [ ] Backup verificado
- [ ] Plano de comunicação preparado
- [ ] Equipe de plantão definida

### ⚠️ Critérios para Rollback
- [ ] Error rate > 5%
- [ ] Response time > 2x baseline
- [ ] Funcionalidade crítica quebrada
- [ ] Perda de dados detectada
- [ ] Vulnerabilidade de segurança descoberta

### 🚨 Processo de Rollback
1. [ ] Parar deploy se ainda em andamento
2. [ ] Reverter código para versão anterior
3. [ ] Executar rollback de migrations (se necessário)
4. [ ] Reiniciar serviços
5. [ ] Verificar health checks
6. [ ] Comunicar equipe e usuários
7. [ ] Investigar causa raiz

## Checklist por Ambiente

### Development
- [ ] Testes locais passando
- [ ] Linting sem erros
- [ ] Build local funcionando
- [ ] Docker containers funcionando

### Staging
- [ ] Deploy automatizado funcionando
- [ ] Testes E2E passando
- [ ] Performance adequada
- [ ] Integração com serviços externos

### Production
- [ ] Zero downtime deploy
- [ ] Monitoramento ativo
- [ ] Backup automático
- [ ] Alertas configurados

## Responsabilidades

### Tech Lead
- [ ] Revisar checklist completo
- [ ] Aprovar deploy para produção
- [ ] Monitorar pós-deploy
- [ ] Decidir sobre rollback se necessário

### DevOps
- [ ] Executar deploy
- [ ] Configurar monitoramento
- [ ] Verificar infraestrutura
- [ ] Manter backup atualizado

### QA
- [ ] Executar testes finais
- [ ] Validar funcionalidades em staging
- [ ] Smoke tests em produção
- [ ] Reportar issues encontrados

### Product Owner
- [ ] Validar funcionalidades de negócio
- [ ] Aprovar release notes
- [ ] Comunicar stakeholders
- [ ] Definir critérios de sucesso

## Ferramentas e Comandos

### Build e Deploy
```bash
# Build frontend
npm run build

# Build backend
python -m build

# Run tests
npm test
pytest

# E2E tests
npx playwright test

# Security scan
npm audit
safety check

# Deploy staging
./scripts/deploy-staging.sh

# Deploy production
./scripts/deploy-production.sh
```

### Monitoramento
```bash
# Check health
curl https://api.mlblingsync.com/health

# Check metrics
curl https://api.mlblingsync.com/metrics

# View logs
kubectl logs -f deployment/ml-bling-sync

# Check database
psql -h prod-db -c "SELECT COUNT(*) FROM sync_runs WHERE created_at > NOW() - INTERVAL '1 hour';"
```

### Rollback
```bash
# Rollback deployment
kubectl rollout undo deployment/ml-bling-sync

# Rollback database
psql -h prod-db -f rollback-v1.2.0.sql

# Check rollback status
kubectl rollout status deployment/ml-bling-sync
```

## Contatos de Emergência

- **Tech Lead**: [nome] - [telefone] - [email]
- **DevOps**: [nome] - [telefone] - [email]
- **DBA**: [nome] - [telefone] - [email]
- **Product Owner**: [nome] - [telefone] - [email]

## Links Importantes

- **Monitoring Dashboard**: https://grafana.mlblingsync.com
- **Error Tracking**: https://sentry.mlblingsync.com
- **CI/CD Pipeline**: https://github.com/company/ml-bling-sync/actions
- **Documentation**: https://docs.mlblingsync.com
- **Status Page**: https://status.mlblingsync.com

---

**Data do Release**: ___________
**Versão**: ___________
**Responsável**: ___________
**Aprovado por**: ___________

**Assinatura do Tech Lead**: ___________
**Data**: ___________