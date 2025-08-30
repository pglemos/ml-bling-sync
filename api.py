from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import datetime
import os

app = FastAPI()

# Configurar CORS para permitir acesso de qualquer origem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variáveis para armazenar métricas
metrics = {
    "productsCount": 3,
    "pendingCount": 0,
    "lastSync": "Agora",
    "syncCount": 856
}

# Produtos de exemplo
products = [
    {"name": "iPhone 15 Pro Max", "sku": "TEST-001", "price": "R$ 8.999", "status": "Em Estoque"},
    {"name": "MacBook Air M3", "sku": "TEST-002", "price": "R$ 12.999", "status": "Em Estoque"},
    {"name": "iPad Pro 12.9\"", "sku": "TEST-003", "price": "R$ 7.499", "status": "Em Estoque"}
]

@app.get("/")
def read_root():
    # Servir o dashboard.html como página principal
    return FileResponse("dashboard.html")

@app.get("/dashboard")
def get_dashboard():
    return FileResponse("dashboard.html")

@app.get("/api/sync")
def run_sync():
    try:
        # Simulação de sincronização (sem dependências externas)
        # sync_categories()
        # sync_products()
        
        # Atualizar métricas
        metrics["lastSync"] = "Agora"
        metrics["syncCount"] += 1
        
        return {"success": True, "message": "Sincronização simulada concluída com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/add-test-products")
def add_test_products():
    try:
        # Adicionar produtos de teste (simulação)
        global products
        products = [
            {"name": "iPhone 15 Pro Max", "sku": "TEST-001", "price": "R$ 8.999", "status": "Em Estoque"},
            {"name": "MacBook Air M3", "sku": "TEST-002", "price": "R$ 12.999", "status": "Em Estoque"},
            {"name": "iPad Pro 12.9\"", "sku": "TEST-003", "price": "R$ 7.499", "status": "Em Estoque"},
            {"name": "Apple Watch Series 9", "sku": "TEST-004", "price": "R$ 4.999", "status": "Em Estoque"}
        ]
        
        # Atualizar métricas
        metrics["productsCount"] = len(products)
        
        return {"success": True, "message": "Produtos de teste adicionados", "count": len(products)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/check-integrations")
def check_integrations():
    try:
        # Simulação de verificação de integrações
        return {
            "success": True,
            "integrations": {
                "mercadolivre": {"status": "connected", "token_valid": True},
                "bling": {"status": "connected", "token_valid": True}
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/products")
def get_products():
    return {"products": products}

@app.get("/api/metrics")
def get_metrics():
    return metrics

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)