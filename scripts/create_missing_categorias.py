import requests
import time
from typing import Optional, Dict, Any
from .utils import get_integration_tokens, supabase

def get_item_category_ml(item_id: str, access_token: str) -> Optional[str]:
    """Busca o item no ML e retorna o category_id"""
    try:
        url = f"https://api.mercadolibre.com/items/{item_id}"
        resp = requests.get(
            url, 
            headers={"Authorization": f"Bearer {access_token}"}, 
            timeout=30
        )
        
        if resp.status_code == 404:
            print(f"⚠️ Item {item_id} não encontrado no ML.")
            return None
            
        if resp.status_code != 200:
            print(f"⚠️ Erro ao buscar item {item_id}: {resp.status_code} - {resp.text}")
            return None
            
        data = resp.json()
        category_id = data.get("category_id")
        
        if not category_id:
            print(f"⚠️ Item {item_id} não possui categoria definida no ML.")
            return None
            
        return category_id
    except Exception as e:
        print(f"❌ Erro ao buscar item {item_id}: {str(e)}")
        return None

def get_category_path_ml(category_id, access_token):
    """Busca hierarquia completa da categoria no ML"""
    try:
        url = f"https://api.mercadolibre.com/categories/{category_id}"
        resp = requests.get(url, headers={"Authorization": f"Bearer {access_token}"}, timeout=30)
        if resp.status_code != 200:
            print(f"⚠️ Erro ao buscar categoria {category_id}: {resp.status_code} - {resp.text}")
            return []
            
        data = resp.json()
        path = data.get("path_from_root", [])
        
        # Verificar se o path está no formato esperado
        if not path and data.get("name"):
            # Se não tiver path_from_root mas tiver name, criar um nó único
            return [{"id": data.get("id"), "name": data.get("name")}]
            
        return path
    except Exception as e:
        print(f"❌ Erro ao buscar categoria {category_id}: {str(e)}")
        return []

def create_category_bling(path, bling_token):
    """Cria categorias no Bling seguindo a hierarquia"""
    try:
        # Importar a função do utils_bling_categories.py
        from utils_bling_categories import ensure_bling_category_chain
        
        # Extrair apenas os nomes das categorias para criar a cadeia
        category_names = [node.get("name", "") for node in path if node.get("name")]
        
        if not category_names:
            print("⚠️ Lista de categorias vazia. Nada a criar no Bling.")
            return
            
        # Usar a função mais robusta para criar a cadeia de categorias
        try:
            category_id, breadcrumb = ensure_bling_category_chain(bling_token, category_names)
            print(f"✅ Categorias criadas no Bling: {breadcrumb} (id={category_id})")
            return category_id
        except Exception as e:
            print(f"❌ Erro ao criar categorias no Bling usando ensure_bling_category_chain: {str(e)}")
            # Fallback para o método original se a função acima falhar
            _create_category_bling_fallback(path, bling_token)
    except ImportError:
        # Se não conseguir importar a função, usar o método original
        print("⚠️ Módulo utils_bling_categories não encontrado. Usando método alternativo.")
        _create_category_bling_fallback(path, bling_token)
    except Exception as e:
        print(f"❌ Erro geral ao criar categorias no Bling: {str(e)}")

def _create_category_bling_fallback(path, bling_token):
    """Método alternativo para criar categorias no Bling (fallback)"""
    parent_id = None
    for node in path:
        try:
            # Verificar se temos o nome da categoria
            if not node.get("name"):
                print("⚠️ Nó de categoria sem nome. Pulando...")
                continue
                
            data = {"descricao": node["name"]}
            if parent_id:
                data["idCategoriaPai"] = parent_id

            # Primeiro, verificar se a categoria já existe
            try:
                # Buscar categorias existentes
                search_resp = requests.get(
                    "https://www.bling.com.br/Api/v3/categorias/produtos",
                    headers={"Authorization": f"Bearer {bling_token}"},
                    params={"descricao": node["name"]},
                    timeout=30
                )
                
                if search_resp.status_code == 200:
                    categories = search_resp.json().get("data", [])
                    # Verificar se já existe uma categoria com o mesmo nome e mesmo pai
                    for cat in categories:
                        if cat.get("descricao") == node["name"] and (not parent_id or cat.get("idCategoriaPai") == parent_id):
                            parent_id = cat.get("id")
                            print(f"📦 Categoria já existe no Bling: {node['name']} (id={parent_id})")
                            # Respeitar rate limit
                            time.sleep(0.5)
                            break
                    else:  # Se não encontrou, criar nova
                        # Criar nova categoria
                        resp = requests.post(
                            "https://www.bling.com.br/Api/v3/categorias/produtos",
                            headers={"Authorization": f"Bearer {bling_token}", "Content-Type": "application/json"},
                            json=data,
                            timeout=30
                        )

                        if resp.status_code in [200, 201]:
                            parent_id = resp.json().get("data", {}).get("id")
                            print(f"📦 Categoria criada no Bling: {node['name']} (id={parent_id})")
                        else:
                            print(f"⚠️ Erro ao criar {node['name']}: {resp.status_code} - {resp.text}")
                            if resp.status_code == 429:  # Rate limit
                                print("⏳ Aguardando 5 segundos devido a rate limit...")
                                time.sleep(5)
                                continue
                            break
                else:
                    print(f"⚠️ Erro ao buscar categorias: {search_resp.status_code} - {search_resp.text}")
                    # Tentar criar mesmo assim
                    resp = requests.post(
                        "https://www.bling.com.br/Api/v3/categorias/produtos",
                        headers={"Authorization": f"Bearer {bling_token}", "Content-Type": "application/json"},
                        json=data,
                        timeout=30
                    )

                    if resp.status_code in [200, 201]:
                        parent_id = resp.json().get("data", {}).get("id")
                        print(f"📦 Categoria criada no Bling: {node['name']} (id={parent_id})")
                    else:
                        print(f"⚠️ Erro ao criar {node['name']}: {resp.status_code} - {resp.text}")
                        break
            except Exception as e:
                print(f"⚠️ Erro ao verificar categoria existente: {str(e)}. Tentando criar...")
                # Tentar criar mesmo assim
                resp = requests.post(
                    "https://www.bling.com.br/Api/v3/categorias/produtos",
                    headers={"Authorization": f"Bearer {bling_token}", "Content-Type": "application/json"},
                    json=data,
                    timeout=30
                )

                if resp.status_code in [200, 201]:
                    parent_id = resp.json().get("data", {}).get("id")
                    print(f"📦 Categoria criada no Bling: {node['name']} (id={parent_id})")
                else:
                    print(f"⚠️ Erro ao criar {node['name']}: {resp.status_code} - {resp.text}")
                    break
            
            # Respeitar rate limit entre operações
            time.sleep(0.5)
            
        except Exception as e:
            print(f"❌ Erro ao processar categoria {node.get('name', '')}: {str(e)}")
            break
    
    return parent_id

def main():
    try:
        ml_tokens = get_integration_tokens("ml")
        bling_tokens = get_integration_tokens("bling")

        # Buscar produtos com ml_item_id e que não tenham ml_category_path ou ml_category_id
        # Usando uma consulta mais precisa para garantir que pegamos apenas produtos que precisam de atualização
        try:
            # Primeiro tentamos com filtros simples
            products = supabase.table("products") \
                .select("*") \
                .filter("ml_item_id", "not.is", "null") \
                .filter("ml_category_path", "is", "null") \
                .limit(100) \
                .execute() \
                .data
        except Exception as e:
            print(f"⚠️ Erro na primeira tentativa de consulta: {str(e)}. Tentando alternativa...")
            # Alternativa com sintaxe mais simples
            try:
                # Usando filtros mais simples para evitar problemas de sintaxe
                products = supabase.table("products") \
                    .select("*") \
                    .filter("ml_item_id", "not.is", "null") \
                    .filter("ml_category_path", "is", "null") \
                    .limit(100) \
                    .execute() \
                    .data
            except Exception as e2:
                print(f"❌ Erro na segunda tentativa de consulta: {str(e2)}")
                # Última alternativa - buscar todos e filtrar manualmente
                products = supabase.table("products") \
                    .select("*") \
                    .execute() \
                    .data
                # Filtrar manualmente
                products = [p for p in products if p.get("ml_item_id") and (not p.get("ml_category_id") or not p.get("ml_category_path"))]
                # Limitar para não sobrecarregar
                products = products[:100]

        if not products:
            print("✅ Nenhum produto pendente encontrado.")
            return
            
        print(f"🔍 Encontrados {len(products)} produtos para processar.")
        
        ok = 0
        fail = 0
        
        for product in products:
            try:
                # Verificando se temos o ml_item_id ou category_id
                ml_item_id = product.get("ml_item_id")
                category_id = product.get("ml_category_id") or product.get("category_id")
                
                if not category_id and not ml_item_id:
                    print(f"⚠️ Produto {product.get('id')} sem ml_item_id e sem category_id. Pulando...")
                    fail += 1
                    continue
                    
                # Se não temos category_id mas temos ml_item_id, precisamos buscar o item no ML primeiro
                if not category_id and ml_item_id:
                     print(f"🔍 Buscando categoria para o item {ml_item_id}...")
                     try:
                         # Buscar o item no ML para obter a categoria
                         item_category_id = get_item_category_ml(ml_item_id, ml_tokens["access_token"])
                         if not item_category_id:
                             print(f"⚠️ Não foi possível obter a categoria para o item {ml_item_id}. Pulando...")
                             fail += 1
                             continue
                         category_id = item_category_id
                         print(f"✅ Categoria encontrada para o item {ml_item_id}: {category_id}")
                     except Exception as e:
                         print(f"❌ Erro ao buscar categoria para o item {ml_item_id}: {str(e)}")
                         fail += 1
                         continue
                     
                     # Respeitar rate limit
                     time.sleep(0.3)

                # 1. Buscar hierarquia no ML
                try:
                    path = get_category_path_ml(category_id, ml_tokens["access_token"])
                    if not path:
                        print(f"⚠️ Caminho de categoria vazio para {category_id}. Pulando...")
                        fail += 1
                        continue
                    
                    # Respeitar rate limit
                    time.sleep(0.3)
                except Exception as e:
                    print(f"❌ Erro ao buscar caminho da categoria {category_id}: {str(e)}")
                    fail += 1
                    continue

                # 2. Atualizar produto no Supabase
                path_str = " > ".join([node.get("name", "") for node in path])
                update_payload = {
                    "ml_category_id": category_id,
                    "ml_category_path": path_str,
                    "ml_category_hierarchy": path
                }
                
                supabase.table("products").update(update_payload).eq("id", product["id"]).execute()

                print(f"✅ Atualizado produto {product.get('sku') or product['id']} com categoria: {path_str}")

                # 3. Criar hierarquia no Bling
                if path:
                    try:
                        create_category_bling(path, bling_tokens["access_token"])
                        # Respeitar rate limit
                        time.sleep(0.5)  # Bling API tem limite mais restritivo
                    except Exception as e:
                        print(f"⚠️ Erro ao criar categoria no Bling: {str(e)}")
                        # Continuamos mesmo com erro na criação da categoria no Bling
                        # pois já atualizamos o produto no Supabase
                
                ok += 1
            except Exception as e:
                fail += 1
                print(f"❌ Erro ao processar produto {product.get('id')}: {str(e)}")
        
        print(f"\nResumo: atualizados {ok}, falhas {fail}, total {len(products)}.")
    except Exception as e:
        print(f"❌ Erro geral: {str(e)}")

def sync_categories():
    """Função exportada para sincronizar categorias do ML com o Bling"""
    main()

if __name__ == "__main__":
    main()
