import requests
import os
from supabase import create_client, Client

# 🔑 Variáveis de ambiente (configure no Vercel e local .env)
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_tokens(provider: str):
    """Busca tokens no Supabase para o provedor (ml ou bling)."""
    data = supabase.table("integrations").select("*").eq("provider", provider).execute()
    if len(data.data) == 0:
        raise Exception(f"Nenhum token encontrado para {provider}")
    return data.data[0]  # pega o primeiro (ou último válido)

def get_ml_categories(access_token: str):
    """Puxa categorias do Mercado Livre (exemplo: MLB)."""
    url = "https://api.mercadolibre.com/sites/MLB/categories"
    headers = {"Authorization": f"Bearer {access_token}"}
    res = requests.get(url, headers=headers)
    res.raise_for_status()
    return res.json()

def create_bling_category(access_token: str, category_name: str, parent_id=None):
    """Cria categoria (família) no Bling."""
    url = "https://www.bling.com.br/Api/v3/categorias"
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    payload = {
        "descricao": category_name,
    }
    if parent_id:
        payload["idCategoriaPai"] = parent_id

    res = requests.post(url, headers=headers, json=payload)
    if res.status_code not in [200, 201]:
        print("❌ Erro ao criar categoria:", res.text)
    else:
        print(f"✅ Categoria criada: {category_name}")
    return res.json()

def sync_categories():
    # 1. Pega tokens
    ml_tokens = get_tokens("ml")
    bling_tokens = get_tokens("bling")

    # 2. Busca categorias ML
    ml_categories = get_ml_categories(ml_tokens["access_token"])

    # 3. Cria no Bling
    for cat in ml_categories:
        create_bling_category(bling_tokens["access_token"], cat["name"])

if __name__ == "__main__":
    sync_categories()
