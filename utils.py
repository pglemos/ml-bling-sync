import os
from typing import Optional, Dict, Any
from supabase import create_client

def _load_env():
    # tenta carregar .env e .env.local se existirem (não quebra se não tiver python-dotenv)
    try:
        from dotenv import load_dotenv  # type: ignore
        load_dotenv(".env", override=False)
        load_dotenv(".env.local", override=False)
    except Exception:
        pass

_load_env()

# Usa primeiro SUPABASE_URL / SERVICE_ROLE; se não, cai na NEXT_PUBLIC_*
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("❌ Variáveis do Supabase não configuradas. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def get_integration_tokens(provider: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Pega o token MAIS RECENTE na tabela 'integrations' para o provider informado.
    Se user_id for fornecido, filtra por usuário; senão, pega de qualquer usuário (o mais novo).
    """
    try:
        q = supabase.table("integrations").select("*").eq("provider", provider)
        if user_id:
            q = q.eq("user_id", user_id)
        res = q.order("created_at", desc=True).limit(1).execute()
        rows = res.data or []
        if not rows:
            raise RuntimeError(f"❌ Nenhuma integração '{provider}' encontrada na tabela 'integrations'.")
        row = rows[0]
        return {
            "access_token": row.get("access_token", ""),
            "refresh_token": row.get("refresh_token"),
            "expires_in": row.get("expires_in"),
            "user_id": row.get("user_id", ""),
            "id": row.get("id", ""),
        }
    except Exception as e:
        raise RuntimeError(f"❌ Erro ao buscar integração '{provider}': {str(e)}")
