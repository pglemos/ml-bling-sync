from utils import get_integration_tokens
import requests

# O user_id que vimos no Supabase
USER_ID = "1d2b8b0c-726e-4c8a-863b-c4f0b4c147ab"

def get_ml_categories(access_token):
    """Busca categorias do Mercado Livre"""
    url = "https://api.mercadolibre.com/sites/MLB/categories"
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.get(url, headers=headers)

    if resp.status_code != 200:
        raise Exception(f"Erro ao buscar categorias do ML: {resp.text}")

    return resp.json()

def create_bling_category(access_token, category_name, parent_id=None):
    """Cria categoria no Bling"""
    url = "https://www.bling.com.br/Api/v3/categorias"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {"descricao": category_name}
    if parent_id:
        payload["idCategoriaPai"] = parent_id

    resp = requests.post(url, json=payload, headers=headers)

    if resp.status_code not in (200, 201):
        print(f"Erro ao criar categoria {category_name}: {resp.text}")
        return None

    return resp.json()

def main():
    # Tokens Mercado Livre
    ml_tokens = get_integration_tokens(USER_ID, "ml")
    print("🔑 Token Mercado Livre:", ml_tokens["access_token"][:20], "...")

    # Tokens Bling
    bling_tokens = get_integration_tokens(USER_ID, "bling")
    print("🔑 Token Bling:", bling_tokens["access_token"][:20], "...")

    # 1) Buscar categorias do Mercado Livre
    categories = get_ml_categories(ml_tokens["access_token"])
    print(f"✅ {len(categories)} categorias encontradas no ML")

    # 2) Criar no Bling (exemplo só das 3 primeiras para teste)
    for cat in categories[:3]:
        created = create_bling_category(bling_tokens["access_token"], cat["name"])
        print("📦 Criada no Bling:", created)

if __name__ == "__main__":
    main()
