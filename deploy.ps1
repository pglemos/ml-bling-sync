# Script para fazer deploy na Vercel

# Adicionar todas as alterações ao git
git add .

# Commit com mensagem descritiva
git commit -m "Implementação de melhorias na interface: botão limpar filtros, CSS dos steps e progresso SSE"

# Push para o repositório remoto (que está conectado à Vercel)
git push

# Mensagem de conclusão
Write-Host "Deploy concluído! As alterações estarão disponíveis em https://ml-bling-sync.vercel.app/dashboard.html em alguns minutos."