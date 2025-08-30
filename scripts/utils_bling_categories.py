# utils_bling_categories.py
import requests

BLING_BASE = "https://www.bling.com.br/Api/v3"

def ensure_bling_category_chain(bling_token: str, chain: list[str]) -> tuple[int, str]:
    """
    chain: ["Casa, Móveis e Decoração", "Enfeites e Decoração da Casa", ... , "Árvores de Natal"]
    Retorna: (id_da_categoria_folha, breadcrumb_criado)
    """
    headers = {"Authorization": f"Bearer {bling_token}", "Content-Type": "application/json"}
    parent_id = None
    built = []

    for name in chain:
        built.append(name)

        # 1) tenta achar pelo nome + pai
        params = {"pagina": 1, "limite": 100}
        r = requests.get(f"{BLING_BASE}/categorias/produtos", headers=headers, params=params, timeout=30)
        r.raise_for_status()
        found_id = None
        for item in r.json().get("data", []):
            if item["descricao"].strip().lower() == name.strip().lower():
                # se precisar validar por pai, use item.get("idCategoriaPai")
                found_id = item["id"]
                break

        # 2) cria se não existir
        if not found_id:
            payload = {"descricao": name}
            if parent_id:
                payload["idCategoriaPai"] = parent_id  # campo de pai
            c = requests.post(f"{BLING_BASE}/categorias/produtos", headers=headers, json=payload, timeout=30)
            if c.status_code >= 300:
                raise RuntimeError(f"Erro ao criar '{name}': {c.text}")
            found_id = c.json()["data"]["id"]

        parent_id = found_id

    return parent_id, " > ".join(chain)
