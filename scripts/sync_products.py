import time
import requests
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from .utils import supabase, get_integration_tokens

ML_API = "https://api.mercadolibre.com"

def fetch_item_category(token: str, item_id: str) -> Optional[str]:
    """Busca o item no ML e retorna a category_id."""
    r = requests.get(
        f"{ML_API}/items/{item_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    if r.status_code == 404:
        print(f"⚠️ Item {item_id} não encontrado no ML.")
        return None
    if r.status_code >= 400:
        raise RuntimeError(f"Erro item {item_id}: {r.status_code} {r.text}")
    return r.json().get("category_id")

def fetch_category_path(cat_id: str) -> Dict[str, Any]:
    """Busca a categoria e monta path_from_root -> 'A > B > C'."""
    r = requests.get(f"{ML_API}/categories/{cat_id}", timeout=30)
    if r.status_code >= 400:
        raise RuntimeError(f"Erro categoria {cat_id}: {r.status_code} {r.text}")
    cat = r.json()
    path = cat.get("path_from_root", []) or []
    path_str = " > ".join([n.get("name", "") for n in path]) or cat.get("name", "")
    return {
        "id": cat.get("id"),
        "name": cat.get("name"),
        "path": path,          # lista de {id, name}
        "path_str": path_str,  # string pronta
    }

def main(user_id: Optional[str] = None):
    try:
        # Token do ML
        ml = get_integration_tokens("ml", user_id)
        print(f"🔑 Token Mercado Livre: {ml['access_token'][:30]} ...")

        # Busca produtos e filtra em Python (simplifica nulos)
        res = supabase.table("products").select(
            "id, sku, ml_item_id, ml_category_id, ml_category_path"
        ).execute()
        products = res.data or []

        pendentes = [
            p for p in products
            if p.get("ml_item_id") and (not p.get("ml_category_id") or not p.get("ml_category_path"))
        ]

        if not pendentes:
            print("✅ Nenhum produto pendente (verifique se 'ml_item_id' está preenchido).")
            return

        ok = 0
        fail = 0

        for p in pendentes:
            item_id = str(p["ml_item_id"])
            try:
                cat_id = fetch_item_category(ml["access_token"], item_id)
                if not cat_id:
                    fail += 1
                    continue

                cat = fetch_category_path(cat_id)

                update_payload = {
                    "ml_category_id": cat["id"],
                    "ml_category_name": cat["name"],
                    "ml_category_path": cat["path_str"],
                    "ml_category_hierarchy": cat["path"],  # JSON
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
                supabase.table("products").update(update_payload).eq("id", p["id"]).execute()

                ok += 1
                label = p.get("sku") or p["id"]
                print(f"✅ {label}: {cat['path_str']}")
            except Exception as e:
                fail += 1
                print(f"❌ {item_id}: {e}")

            # Evita burst / respeita rate limit
            time.sleep(0.2)

        print(f"\nResumo: atualizados {ok}, falhas {fail}, total {len(pendentes)}.")
    except Exception as e:
        print(f"❌ Erro geral: {e}")

def sync_products():
    """Função exportada para sincronizar produtos do ML"""
    main()

if __name__ == "__main__":
    main()
