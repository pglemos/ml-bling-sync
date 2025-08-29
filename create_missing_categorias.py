import requests
from utils import get_integration_tokens, supabase

def get_category_path_ml(category_id, access_token):
    """Busca hierarquia completa da categoria no ML"""
    url = f"https://api.mercadolibre.com/categories/{category_id}"
    resp = requests.get(url, headers={"Authorization": f"Bearer {access_token}"})
    if resp.status_code != 200:
        raise Exception(f"Erro ao buscar categoria {category_id}: {resp.text}")
    return resp.json().get("path_from_root", [])

def create_category_bling(path, bling_token):
    """Cria categorias no Bling seguindo a hierarquia"""
    parent_id = None
    for node in path:
        data = {"descricao": node["name"]}
        if parent_id:
            data["idCategoriaPai"] = parent_id

        resp = requests.post(
            "https://www.bling.com.br/Api/v3/categorias",
            headers={"Authorization": f"Bearer {bling_token}"},
            json=data
        )

        if resp.status_code in [200, 201]:
            parent_id = resp.json().get("data", {}).get("id")
            print(f"📦 Categoria criada/confirmada no Bling: {node['name']} (id={parent_id})")
        else:
            print(f"⚠️ Erro ao criar {node['name']}: {resp.text}")
            break

def main():
    ml_tokens = get_integration_tokens("ml")
    bling_tokens = get_integration_tokens("bling")

    # Buscar todos os produtos que ainda não possuem ml_category_path
    products = supabase.table("products").select("*").is_("ml_category_path", None).execute().data

    for product in products:
        category_id = product.get("category_id")
        if not category_id:
            continue

        # 1. Buscar hierarquia no ML
        path = get_category_path_ml(category_id, ml_tokens["access_token"])

        # 2. Atualizar produto no Supabase
        supabase.table("products").update({
            "ml_category_path": path
        }).eq("id", product["id"]).execute()

        print(f"✅ Atualizado produto {product['id']} com categorias ML")

        # 3. Criar hierarquia no Bling
        if path:
            create_category_bling(path, bling_tokens["access_token"])

if __name__ == "__main__":
    main()
