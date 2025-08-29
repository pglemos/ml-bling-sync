import requests
import json
import time
import concurrent.futures
import sys
from pathlib import Path
from token_manager import get_bling_token, get_ml_token

MAPA_CATEGORIAS = Path("mapa_categorias.json")
LOJA_ID = 205557111  # ID da sua loja no Bling
MAX_WORKERS = 10  # Número de threads paralelas

def carregar_mapa():
    if MAPA_CATEGORIAS.exists():
        with open(MAPA_CATEGORIAS, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def salvar_mapa(mapa):
    with open(MAPA_CATEGORIAS, "w", encoding="utf-8") as f:
        json.dump(mapa, f, ensure_ascii=False, indent=2)

# ------------------ funções do Bling e ML (iguais ao seu código original) ------------------

def listar_categorias_bling(token):
    categorias = {}
    pagina = 1
    while True:
        url = f"https://www.bling.com.br/Api/v3/categorias/produtos?pagina={pagina}&limite=100"
        resp = requests.get(url, headers={"Authorization": f"Bearer {token}"})
        try:
            resp.raise_for_status()
            data = resp.json()
            if "data" not in data:
                break
            for categoria in data["data"]:
                categorias[categoria["descricao"]] = {
                    "id": categoria["id"],
                    "id_pai": categoria.get("idCategoriaPai"),
                    "nome": categoria["descricao"]
                }
            if not data.get("hasNextPage", False):
                break
            pagina += 1
        except Exception as e:
            print(f"❌ Erro ao listar categorias do Bling: {e}")
            break
    return categorias

def criar_categoria(token, nome, id_pai=None):
    url = "https://www.bling.com.br/Api/v3/categorias/produtos"
    payload = {"descricao": nome}
    if id_pai:
        payload["idCategoriaPai"] = id_pai
    try:
        resp = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=30
        )
        if resp.status_code == 409:
            print(f"⚠️ Categoria '{nome}' já existe no Bling")
            return None
        resp.raise_for_status()
        return resp.json()["data"]["id"]
    except Exception as e:
        print(f"❌ Erro ao criar categoria '{nome}': {e}")
        return None

def processar_item_ml(item_id, token_ml):
    try:
        url_item = f"https://api.mercadolibre.com/items/{item_id}"
        r = requests.get(url_item, headers={"Authorization": f"Bearer {token_ml}"}, timeout=30)
        r.raise_for_status()
        item_data = r.json()
        categoria_id = item_data.get("category_id")
        if not categoria_id:
            return None
        url_cat = f"https://api.mercadolibre.com/categories/{categoria_id}"
        rc = requests.get(url_cat, timeout=30)
        rc.raise_for_status()
        cat_data = rc.json()
        path = [p["name"] for p in cat_data.get("path_from_root", [])]
        full_path = " > ".join(path)
        return {
            "categoria_id": categoria_id,
            "nome": cat_data["name"],
            "path": path,
            "full_path": full_path
        }
    except Exception as e:
        print(f"⚠️ Erro ao processar item {item_id}: {e}")
        return None

def coletar_itens_ml(token_ml, user_id):
    itens = []
    statuses = ["active", "paused", "closed"]
    for status in statuses:
        offset = 0
        limit = 50
        while True:
            url = f"https://api.mercadolibre.com/users/{user_id}/items/search?status={status}&limit={limit}&offset={offset}"
            resp = requests.get(url, headers={"Authorization": f"Bearer {token_ml}"}, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            items_batch = data.get("results", [])
            if not items_batch:
                break
            itens.extend(items_batch)
            if len(items_batch) < limit:
                break
            offset += limit
    return itens

def coletar_categorias_ml(token_ml, user_id):
    print("📦 Coletando todos os itens do ML...")
    itens = coletar_itens_ml(token_ml, user_id)
    print(f"✅ Encontrados {len(itens)} itens no ML")
    categorias = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_item = {
            executor.submit(processar_item_ml, item_id, token_ml): item_id
            for item_id in itens
        }
        for future in concurrent.futures.as_completed(future_to_item):
            resultado = future.result()
            if resultado:
                categorias[resultado["categoria_id"]] = {
                    "nome": resultado["nome"],
                    "path": resultado["path"],
                    "full_path": resultado["full_path"]
                }
    return categorias

def criar_hierarquia_completa(token, path, categorias_existentes):
    current_parent = None
    for nivel in path:
        if nivel in categorias_existentes:
            categoria_info = categorias_existentes[nivel]
            if categoria_info["id_pai"] == current_parent:
                current_parent = categoria_info["id"]
                continue
            else:
                print(f"⚠️ Categoria '{nivel}' existe mas com hierarquia diferente. Criando nova...")
        novo_id = criar_categoria(token, nivel, current_parent)
        if novo_id:
            categorias_existentes[nivel] = {
                "id": novo_id,
                "id_pai": current_parent,
                "nome": nivel
            }
            current_parent = novo_id
            time.sleep(0.5)
        else:
            print(f"⏭️ Pulando categoria '{nivel}' na hierarquia")
            break
    return current_parent

def vincular_categoria_loja(token, categoria_id, categoria_ml_id, nome_categoria):
    url = "https://www.bling.com.br/Api/v3/categorias/lojas"
    payload = {
        "idLoja": LOJA_ID,
        "idCategoria": categoria_id,
        "codigo": categoria_ml_id,
        "descricao": nome_categoria
    }
    try:
        resp = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=30
        )
        if resp.status_code in [200, 201]:
            print(f"✅ Categoria {categoria_id} vinculada à loja")
            return True
        elif resp.status_code == 422:
            return True
        else:
            print(f"❌ Erro ao vincular categoria: {resp.text}")
            return False
    except Exception as e:
        print(f"❌ Erro ao vincular categoria: {e}")
        return False

# ------------------ sincronização principal ------------------

def sincronizar_categorias(user_id: str):
    print(f"🔄 Sincronizando categorias ML -> Bling para usuário {user_id}...")

    try:
        token_ml = get_ml_token(user_id)
        token_bling = get_bling_token(user_id)

        r = requests.get("https://api.mercadolibre.com/users/me",
                         headers={"Authorization": f"Bearer {token_ml}"},
                         timeout=30)
        r.raise_for_status()
        ml_user_id = r.json()["id"]

        print("📦 Coletando categorias do Mercado Livre...")
        categorias_ml = coletar_categorias_ml(token_ml, ml_user_id)
        print(f"✅ Encontradas {len(categorias_ml)} categorias únicas no ML")

        print("📦 Carregando categorias do Bling...")
        categorias_bling = listar_categorias_bling(token_bling)
        print(f"✅ Encontradas {len(categorias_bling)} categorias no Bling")

        mapa = carregar_mapa()

        for cat_id, dados in categorias_ml.items():
            path = dados["path"]
            print(f"🌳 Processando hierarquia: {' > '.join(path)}")
            categoria_folha_id = criar_hierarquia_completa(token_bling, path, categorias_bling)
            if categoria_folha_id:
                if vincular_categoria_loja(token_bling, categoria_folha_id, cat_id, dados["nome"]):
                    mapa[cat_id] = {
                        "nome": dados["nome"],
                        "bling_id": categoria_folha_id,
                        "hierarquia": dados["full_path"]
                    }

        salvar_mapa(mapa)
        print("✅ Arquivo atualizado: mapa_categorias.json")
        print("✅ Hierarquia de categorias criada com sucesso no Bling!")

    except Exception as e:
        print(f"❌ Erro durante a sincronização: {e}")
        raise

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Informe o user_id do Supabase como argumento.")
        print("👉 Exemplo: python create_missing_categorias.py c2a55af4-4c5b-4b20-8d9d-8a1cce2d3b9a")
        sys.exit(1)
    user_id = sys.argv[1]
    sincronizar_categorias(user_id)
