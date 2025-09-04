# ML Bling Sync - Guia do Cliente

## Bem-vindo ao ML Bling Sync! 🚀

Este guia vai te ajudar a configurar e usar o ML Bling Sync para sincronizar seus produtos entre o Bling e o Mercado Livre de forma automática e inteligente.

## Índice

1. [Primeiros Passos](#primeiros-passos)
2. [Configuração de Conectores](#configuração-de-conectores)
3. [Sincronização de Produtos](#sincronização-de-produtos)
4. [Dashboard e Monitoramento](#dashboard-e-monitoramento)
5. [Configurações Avançadas](#configurações-avançadas)
6. [Solução de Problemas](#solução-de-problemas)
7. [FAQ - Perguntas Frequentes](#faq---perguntas-frequentes)
8. [Suporte](#suporte)

## Primeiros Passos

### 1. Criando sua Conta

1. **Acesse**: https://app.ml-bling-sync.com
2. **Clique em**: "Criar Conta"
3. **Preencha**:
   - Nome completo
   - E-mail
   - Senha (mínimo 8 caracteres)
   - Nome da empresa
4. **Confirme** seu e-mail clicando no link enviado
5. **Faça login** com suas credenciais

### 2. Escolhendo seu Plano

Após o login, você será direcionado para escolher um plano:

#### 📦 **Starter** - R$ 49/mês
- Até 100 produtos
- 1.000 sincronizações/mês
- Suporte por e-mail
- Ideal para pequenos negócios

#### 🚀 **Professional** - R$ 149/mês
- Até 1.000 produtos
- 10.000 sincronizações/mês
- Suporte prioritário
- Relatórios avançados
- Ideal para negócios em crescimento

#### 🏢 **Enterprise** - R$ 399/mês
- Produtos ilimitados
- Sincronizações ilimitadas
- Suporte 24/7
- White-label
- API personalizada
- Ideal para grandes empresas

### 3. Tour Inicial

Após escolher o plano, você será guiado por um tour que mostra:
- Como conectar o Bling
- Como conectar o Mercado Livre
- Como configurar sua primeira sincronização
- Como monitorar o status

## Configuração de Conectores

### Conectando o Bling

#### 1. Obtendo as Credenciais do Bling

1. **Acesse** sua conta no Bling
2. **Vá para**: Configurações → API
3. **Gere** uma nova chave de API
4. **Copie** a chave gerada

#### 2. Configurando no ML Bling Sync

1. **No dashboard**, clique em "Conectores"
2. **Clique** em "Conectar Bling"
3. **Cole** sua chave de API
4. **Teste** a conexão
5. **Salve** as configurações

```
✅ Conexão bem-sucedida!
Seus produtos do Bling serão importados em alguns minutos.
```

### Conectando o Mercado Livre

#### 1. Autorizando o Acesso

1. **No dashboard**, clique em "Conectores"
2. **Clique** em "Conectar Mercado Livre"
3. **Você será redirecionado** para o Mercado Livre
4. **Faça login** em sua conta do ML
5. **Autorize** o acesso do ML Bling Sync
6. **Você será redirecionado** de volta

#### 2. Configurações Adicionais

1. **Selecione** suas categorias de produtos
2. **Configure** templates de anúncios
3. **Defina** regras de preço
4. **Teste** a conexão

```
✅ Mercado Livre conectado!
Você pode começar a sincronizar seus produtos.
```

### Verificando as Conexões

No painel "Conectores", você deve ver:

```
🟢 Bling - Conectado
   Última sincronização: há 5 minutos
   Status: Ativo
   
🟢 Mercado Livre - Conectado
   Última sincronização: há 3 minutos
   Status: Ativo
```

## Sincronização de Produtos

### Configuração Básica

#### 1. Primeira Sincronização

1. **Vá para**: "Produtos" → "Sincronização"
2. **Clique** em "Nova Sincronização"
3. **Selecione**:
   - Origem: Bling
   - Destino: Mercado Livre
   - Produtos: Todos ou por categoria
4. **Configure** as opções:
   - Sincronizar preços ✅
   - Sincronizar estoque ✅
   - Sincronizar descrições ✅
5. **Clique** em "Iniciar Sincronização"

#### 2. Acompanhando o Progresso

```
📊 Sincronização em Andamento

▓▓▓▓▓▓▓▓░░ 80% (240/300 produtos)

✅ Sincronizados: 240
⏳ Pendentes: 60
❌ Erros: 0

Tempo estimado: 5 minutos
```

### Configurações Avançadas

#### Mapeamento de Categorias

1. **Vá para**: "Configurações" → "Mapeamento"
2. **Configure** como as categorias do Bling se relacionam com o ML:

```
Bling                    →  Mercado Livre
─────────────────────────────────────────
Eletrônicos             →  MLB1000 (Eletrônicos)
Roupas Masculinas       →  MLB1430 (Roupas e Acessórios)
Casa e Jardim          →  MLB1574 (Casa, Móveis e Decoração)
```

#### Templates de Anúncios

1. **Crie templates** para diferentes tipos de produtos:

```html
<!-- Template para Eletrônicos -->
<h2>{{produto.nome}}</h2>

<h3>Características:</h3>
<ul>
  <li>Marca: {{produto.marca}}</li>
  <li>Modelo: {{produto.modelo}}</li>
  <li>Garantia: 12 meses</li>
</ul>

<h3>Descrição:</h3>
<p>{{produto.descricao}}</p>

<h3>Entrega:</h3>
<p>Enviamos para todo o Brasil via Correios ou transportadora.</p>
```

#### Regras de Preço

1. **Configure** como os preços são calculados:

```
Regra: Eletrônicos
├── Preço base: Preço do Bling
├── Margem: +15%
├── Taxa ML: -6%
├── Frete grátis: Acima de R$ 100
└── Preço final: R$ 109,40
```

### Sincronização Automática

#### Configurando Horários

1. **Vá para**: "Configurações" → "Automação"
2. **Configure** os horários:

```
🕐 Sincronização de Preços
   ├── Frequência: A cada 2 horas
   ├── Horários: 08:00, 10:00, 12:00, 14:00, 16:00, 18:00
   └── Status: Ativo

📦 Sincronização de Estoque
   ├── Frequência: A cada 30 minutos
   ├── Horários: Contínuo
   └── Status: Ativo

📝 Sincronização de Produtos
   ├── Frequência: Diária
   ├── Horário: 02:00
   └── Status: Ativo
```

## Dashboard e Monitoramento

### Visão Geral

O dashboard principal mostra:

```
📊 RESUMO GERAL

┌─────────────────┬─────────────────┬─────────────────┐
│   📦 Produtos   │   💰 Vendas     │   📈 Performance│
│                 │                 │                 │
│      1.247      │    R$ 45.230    │      98.5%      │
│   sincronizados │   este mês      │   uptime        │
└─────────────────┴─────────────────┴─────────────────┘

🔄 ÚLTIMA SINCRONIZAÇÃO
├── Horário: 14:30 (há 15 minutos)
├── Produtos: 1.247 sincronizados
├── Erros: 0
└── Status: ✅ Sucesso

⚠️ ALERTAS
├── 3 produtos com estoque baixo
├── 1 produto com preço desatualizado
└── 0 erros de sincronização
```

### Relatórios

#### Relatório de Vendas

1. **Acesse**: "Relatórios" → "Vendas"
2. **Visualize**:

```
📈 VENDAS POR CANAL (Últimos 30 dias)

┌─────────────────┬─────────┬─────────┬─────────┐
│     Canal       │ Vendas  │ Valor   │   %     │
├─────────────────┼─────────┼─────────┼─────────┤
│ Mercado Livre   │   156   │ 28.450  │  62.9%  │
│ Loja Física     │    89   │ 16.780  │  37.1%  │
│ TOTAL           │   245   │ 45.230  │ 100.0%  │
└─────────────────┴─────────┴─────────┴─────────┘

🏆 TOP 5 PRODUTOS
1. Smartphone XYZ - 23 vendas - R$ 4.560
2. Fone Bluetooth - 18 vendas - R$ 2.340
3. Carregador USB-C - 15 vendas - R$ 890
4. Capa Protetora - 12 vendas - R$ 480
5. Película de Vidro - 11 vendas - R$ 220
```

#### Relatório de Sincronização

```
🔄 HISTÓRICO DE SINCRONIZAÇÕES

┌─────────────┬─────────┬─────────┬─────────┬─────────┐
│    Data     │ Horário │Produtos │ Sucesso │  Erros  │
├─────────────┼─────────┼─────────┼─────────┼─────────┤
│ 15/01/2024  │  14:30  │  1.247  │  1.247  │    0    │
│ 15/01/2024  │  12:30  │  1.247  │  1.245  │    2    │
│ 15/01/2024  │  10:30  │  1.247  │  1.247  │    0    │
│ 15/01/2024  │  08:30  │  1.247  │  1.247  │    0    │
└─────────────┴─────────┴─────────┴─────────┴─────────┘

📊 Taxa de Sucesso: 99.8%
⏱️ Tempo Médio: 3m 45s
```

### Alertas e Notificações

#### Configurando Alertas

1. **Vá para**: "Configurações" → "Alertas"
2. **Configure** quando ser notificado:

```
📧 NOTIFICAÇÕES POR E-MAIL
├── ✅ Erros de sincronização
├── ✅ Estoque baixo (< 5 unidades)
├── ✅ Produtos sem preço
├── ✅ Relatório diário
└── ✅ Relatório semanal

📱 NOTIFICAÇÕES PUSH
├── ✅ Erros críticos
├── ✅ Sincronização concluída
└── ❌ Vendas realizadas

💬 SLACK/TEAMS
├── Webhook: https://hooks.slack.com/...
├── Canal: #vendas
└── ✅ Ativo
```

## Configurações Avançadas

### Multi-tenant (Plano Enterprise)

#### Configurando Múltiplas Lojas

1. **Acesse**: "Configurações" → "Lojas"
2. **Adicione** uma nova loja:

```
🏪 LOJA PRINCIPAL
├── Nome: Eletrônicos Silva
├── CNPJ: 12.345.678/0001-90
├── Bling: Conectado
├── ML: Conectado
└── Status: Ativa

🏪 LOJA FILIAL
├── Nome: Eletrônicos Silva - Shopping
├── CNPJ: 12.345.678/0002-71
├── Bling: Conectado
├── ML: Conectado
└── Status: Ativa
```

### White-label (Plano Enterprise)

#### Personalizando a Interface

1. **Vá para**: "Configurações" → "Branding"
2. **Personalize**:

```
🎨 IDENTIDADE VISUAL
├── Logo: [Upload da sua logo]
├── Cores primárias: #1E40AF
├── Cores secundárias: #F3F4F6
├── Favicon: [Upload do favicon]
└── Domínio: sync.suaempresa.com

📝 TEXTOS
├── Nome do sistema: "Sync Pro"
├── Slogan: "Sincronização inteligente"
├── Rodapé: "© 2024 Sua Empresa"
└── E-mails: Template personalizado
```

### API Personalizada

#### Usando a API

```bash
# Autenticação
curl -X POST "https://api.ml-bling-sync.com/auth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "suasenha"
  }'

# Resposta
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}

# Listar produtos
curl -X GET "https://api.ml-bling-sync.com/products" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# Sincronizar produto específico
curl -X POST "https://api.ml-bling-sync.com/products/123/sync" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

## Solução de Problemas

### Problemas Comuns

#### 1. Produtos não sincronizando

**Sintomas**: Produtos não aparecem no Mercado Livre

**Possíveis causas**:
- ❌ Conexão com Bling inativa
- ❌ Produto sem categoria mapeada
- ❌ Produto sem preço
- ❌ Produto sem estoque

**Soluções**:
1. **Verifique** a conexão com o Bling
2. **Configure** o mapeamento de categorias
3. **Adicione** preço ao produto no Bling
4. **Adicione** estoque ao produto

#### 2. Preços desatualizados

**Sintomas**: Preços no ML diferentes do Bling

**Possíveis causas**:
- ❌ Sincronização automática desabilitada
- ❌ Erro na regra de preço
- ❌ Cache do Mercado Livre

**Soluções**:
1. **Ative** a sincronização automática de preços
2. **Revise** as regras de preço
3. **Force** uma sincronização manual
4. **Aguarde** até 30 minutos para o cache atualizar

#### 3. Estoque incorreto

**Sintomas**: Estoque no ML diferente do Bling

**Possíveis causas**:
- ❌ Venda não processada no Bling
- ❌ Sincronização de estoque desabilitada
- ❌ Produto pausado no ML

**Soluções**:
1. **Processe** as vendas no Bling
2. **Ative** a sincronização de estoque
3. **Reative** o produto no ML
4. **Execute** sincronização manual

#### 4. Erros de conexão

**Sintomas**: "Erro de conexão" nos conectores

**Possíveis causas**:
- ❌ Credenciais inválidas
- ❌ Token expirado
- ❌ API fora do ar

**Soluções**:
1. **Reconecte** o conector
2. **Verifique** as credenciais
3. **Aguarde** alguns minutos e tente novamente
4. **Entre em contato** com o suporte

### Logs e Diagnósticos

#### Visualizando Logs

1. **Vá para**: "Configurações" → "Logs"
2. **Filtre** por:
   - Data/hora
   - Tipo de evento
   - Produto específico
   - Nível de erro

```
📋 LOGS DE SINCRONIZAÇÃO

[15/01 14:30:15] INFO  Iniciando sincronização de produtos
[15/01 14:30:16] INFO  Conectando ao Bling... ✅
[15/01 14:30:17] INFO  Conectando ao Mercado Livre... ✅
[15/01 14:30:18] INFO  Processando produto: Smartphone XYZ
[15/01 14:30:19] WARN  Produto sem categoria mapeada: Acessórios
[15/01 14:30:20] INFO  Produto sincronizado: SKU-001
[15/01 14:30:21] ERROR Falha ao sincronizar: SKU-002 - Preço inválido
[15/01 14:33:45] INFO  Sincronização concluída: 1245/1247 produtos
```

#### Executando Diagnósticos

1. **Clique** em "Executar Diagnóstico"
2. **Aguarde** o resultado:

```
🔍 DIAGNÓSTICO DO SISTEMA

✅ Conexão com Bling: OK
✅ Conexão com Mercado Livre: OK
✅ Banco de dados: OK
✅ Filas de processamento: OK
⚠️  Cache: 85% de uso (recomendado: <80%)
❌ Produto SKU-002: Sem preço definido

📊 RESUMO
├── Status geral: ⚠️  Atenção
├── Problemas encontrados: 2
├── Ações recomendadas: 2
└── Última verificação: há 2 minutos
```

## FAQ - Perguntas Frequentes

### Geral

**Q: Posso usar o ML Bling Sync com outras plataformas além do Mercado Livre?**
R: Atualmente suportamos apenas Bling + Mercado Livre, mas estamos trabalhando para adicionar Shopee, Amazon e outras plataformas em breve.

**Q: Meus dados estão seguros?**
R: Sim! Utilizamos criptografia SSL/TLS, armazenamento seguro na AWS e seguimos as melhores práticas de segurança. Seus dados nunca são compartilhados com terceiros.

**Q: Posso cancelar minha assinatura a qualquer momento?**
R: Sim, você pode cancelar a qualquer momento. Não há multas ou taxas de cancelamento.

### Sincronização

**Q: Com que frequência os produtos são sincronizados?**
R: Por padrão:
- Preços: A cada 2 horas
- Estoque: A cada 30 minutos
- Novos produtos: Diariamente às 02:00

Você pode personalizar essas frequências nas configurações.

**Q: O que acontece se eu alterar um produto diretamente no Mercado Livre?**
R: As alterações feitas diretamente no ML serão sobrescritas na próxima sincronização. Recomendamos fazer todas as alterações no Bling.

**Q: Posso sincronizar apenas alguns produtos?**
R: Sim! Você pode:
- Filtrar por categoria
- Filtrar por tags
- Selecionar produtos específicos
- Usar regras personalizadas

### Preços e Estoque

**Q: Como são calculados os preços no Mercado Livre?**
R: Você pode configurar regras de preço que incluem:
- Margem de lucro
- Desconto para taxa do ML
- Frete grátis
- Promoções automáticas

**Q: O que acontece quando um produto fica sem estoque?**
R: O produto é automaticamente pausado no Mercado Livre e reativado quando o estoque for reposto.

**Q: Posso ter preços diferentes para cada canal?**
R: Sim! Você pode configurar regras específicas para cada plataforma.

### Técnicas

**Q: Qual é o limite de produtos por plano?**
R:
- Starter: 100 produtos
- Professional: 1.000 produtos
- Enterprise: Ilimitado

**Q: Posso integrar com meu sistema próprio?**
R: Sim! O plano Enterprise inclui acesso à nossa API REST para integrações customizadas.

**Q: Vocês oferecem suporte para migração?**
R: Sim! Nossa equipe pode ajudar na migração de outros sistemas. Entre em contato conosco.

### Faturamento

**Q: Como funciona a cobrança?**
R: A cobrança é mensal, no cartão de crédito. Você recebe a fatura por e-mail todo mês.

**Q: Posso mudar de plano?**
R: Sim! Você pode fazer upgrade ou downgrade a qualquer momento. As alterações são aplicadas no próximo ciclo de cobrança.

**Q: Vocês oferecem desconto anual?**
R: Sim! Pagando anualmente você ganha 2 meses grátis (desconto de ~17%).

## Suporte

### Canais de Atendimento

#### 📧 E-mail
- **Geral**: suporte@ml-bling-sync.com
- **Técnico**: tech@ml-bling-sync.com
- **Comercial**: vendas@ml-bling-sync.com
- **Tempo de resposta**: 24 horas

#### 💬 Chat Online
- **Disponível**: Segunda a sexta, 9h às 18h
- **Acesso**: Botão no canto inferior direito
- **Tempo de resposta**: Imediato

#### 📞 Telefone (Plano Professional+)
- **Número**: (11) 4000-0000
- **Horário**: Segunda a sexta, 9h às 18h
- **Tempo de resposta**: Imediato

#### 🚨 Suporte 24/7 (Plano Enterprise)
- **WhatsApp**: (11) 99999-0000
- **E-mail**: urgente@ml-bling-sync.com
- **Tempo de resposta**: 1 hora

### Central de Ajuda

#### 📚 Base de Conhecimento
- **URL**: https://help.ml-bling-sync.com
- **Conteúdo**:
  - Tutoriais em vídeo
  - Guias passo a passo
  - Artigos técnicos
  - Casos de uso

#### 🎥 Vídeos Tutoriais
- **Canal YouTube**: ML Bling Sync Oficial
- **Playlist**: "Primeiros Passos"
- **Duração**: 5-10 minutos cada

#### 📖 Webinars
- **Frequência**: Quinzenal
- **Temas**: Novidades, dicas, casos de sucesso
- **Inscrição**: newsletter@ml-bling-sync.com

### Status do Sistema

#### 🔍 Página de Status
- **URL**: https://status.ml-bling-sync.com
- **Informações**:
  - Uptime em tempo real
  - Incidentes ativos
  - Manutenções programadas
  - Histórico de incidentes

#### 📊 SLA (Service Level Agreement)
- **Uptime garantido**: 99.9%
- **Tempo de resposta**: < 2 segundos
- **Sincronização**: < 5 minutos
- **Suporte**: Conforme plano

### Comunidade

#### 👥 Grupo no Telegram
- **Nome**: ML Bling Sync - Usuários
- **Link**: https://t.me/mlblingsync
- **Membros**: 500+ usuários
- **Moderação**: 24/7

#### 💼 LinkedIn
- **Página**: ML Bling Sync
- **Conteúdo**: Dicas, novidades, casos de sucesso
- **Frequência**: 3x por semana

---

**Precisa de ajuda?**

Não hesite em entrar em contato conosco! Nossa equipe está sempre pronta para ajudar você a ter sucesso com o ML Bling Sync.

**Última atualização**: Janeiro 2024
**Versão**: 1.0
**Responsável**: Equipe de Sucesso do Cliente