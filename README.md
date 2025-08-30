# ML + Bling Sync

Integração entre Mercado Livre e Bling para sincronização automática de produtos e categorias.

## Getting Started

### Execução Local

Para executar o projeto localmente:

```bash
python api.py
```

Acesse o dashboard em [http://localhost:8000](http://localhost:8000) com seu navegador.

**Alternativa:** Se o servidor local não estiver funcionando, você pode acessar o dashboard diretamente pelo arquivo:
`file:///C:/Users/Pedro/ml-bling-sync/dashboard.html`

### Versão Hospedada no Vercel

Este projeto está configurado para ser executado no Vercel. Acesse o dashboard em [https://ml-bling-sync.vercel.app](https://ml-bling-sync.vercel.app).

## Estrutura do Projeto

- `api.py` - API FastAPI para sincronização
- `dashboard.html` - Interface de usuário para gerenciar a sincronização
- `create_missing_categorias.py` - Script para sincronizar categorias
- `sync_products.py` - Script para sincronizar produtos
- `vercel.json` - Configuração para implantação no Vercel
- `requirements.txt` - Dependências do projeto

## Funcionalidades

- Sincronização automática de categorias entre Mercado Livre e Bling
- Sincronização automática de produtos entre Mercado Livre e Bling
- Dashboard para monitoramento e controle da sincronização
- API para integração com outros sistemas

## Deploy no Vercel

Este projeto está configurado para ser implantado no Vercel. Siga os passos abaixo para implantar:

1. Crie uma conta no [Vercel](https://vercel.com) se ainda não tiver uma
2. Instale a CLI do Vercel: `npm i -g vercel`
3. Faça login na sua conta: `vercel login`
4. No diretório do projeto, execute: `vercel`
5. Siga as instruções na tela para completar a implantação

Alternativamente, você pode conectar seu repositório GitHub ao Vercel para implantação automática.
