# ML + Bling Sync

Integração entre Mercado Livre e Bling para sincronização automática de produtos e categorias.

## 🚀 Status do Projeto

✅ **Frontend**: Dashboard funcional com Next.js e Tailwind CSS  
✅ **Backend**: API Python funcional no Vercel  
✅ **Deploy**: Hospedado em [https://ml-bling-sync.vercel.app](https://ml-bling-sync.vercel.app)  
🔄 **Integração**: Em desenvolvimento  

## 🏗️ Estrutura do Projeto

```
ml-bling-sync/
├── frontend/                 # Aplicação Next.js
│   ├── src/
│   │   ├── app/             # Páginas da aplicação
│   │   ├── components/      # Componentes React
│   │   ├── services/        # Serviços de API
│   │   └── styles/          # Estilos CSS
│   ├── package.json         # Dependências Node.js
│   └── tailwind.config.js   # Configuração Tailwind
├── backend/                  # API Python (estrutura para Node.js)
│   ├── src/                 # Código fonte
│   └── package.json         # Dependências Node.js
├── api/                     # API Python para Vercel
│   └── index.py            # Handler principal
├── dashboard.html           # Dashboard estático (legado)
├── vercel.json             # Configuração Vercel
└── docker-compose.yml      # Configuração Docker
```

## 🚀 Execução Local

### Opção 1: Dashboard Online (Recomendado)
Acesse diretamente: [https://ml-bling-sync.vercel.app/dashboard.html](https://ml-bling-sync.vercel.app/dashboard.html)

### Opção 2: Execução Local
```bash
# Instalar dependências do frontend
cd frontend
npm install
npm run dev

# Acessar em http://localhost:3000
```

### Opção 3: Docker
```bash
docker-compose up -d
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

## 🔧 Funcionalidades Implementadas

- ✅ Dashboard responsivo com Tailwind CSS
- ✅ Navegação entre seções (Dashboard, Integrações, Produtos, etc.)
- ✅ Sistema de notificações toast
- ✅ Spinner de carregamento
- ✅ Estrutura para integração com APIs
- ✅ Design moderno e responsivo

## 🚧 Em Desenvolvimento

- 🔄 Integração com Mercado Livre
- 🔄 Integração com Bling
- 🔄 Sincronização de produtos
- 🔄 Sincronização de categorias
- 🔄 Sistema de logs
- 🔄 Autenticação de usuários

## 🌐 Deploy

O projeto está configurado para deploy automático no Vercel:
- **URL**: https://ml-bling-sync.vercel.app
- **API**: https://ml-bling-sync.vercel.app/api
- **Dashboard**: https://ml-bling-sync.vercel.app/dashboard.html

## 📝 Próximos Passos

1. Implementar autenticação JWT
2. Conectar com APIs do Mercado Livre
3. Conectar com APIs do Bling
4. Implementar sincronização automática
5. Adicionar sistema de logs
6. Implementar testes automatizados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
