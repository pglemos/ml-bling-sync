import os
from supabase import create_client

# 🔗 Conexão com Supabase
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_integration_tokens(user_id: str, provider: str):
    """
    Busca sempre o token mais recente de um provider (ml ou bling)
    """
    response = (
        supabase.table("integrations")
        .select("*")
        .eq("user_id", user_id)
        .eq("provider", provider)
        .order("created_at", desc=True)  # ✅ pega o mais recente
        .limit(1)
        .execute()
    )

    if not response.data:
        raise Exception(f"Nenhum token encontrado para {provider}")

    return response.data[0]


def refresh_integration_token(user_id: str, provider: str, new_tokens: dict):
    """
    Atualiza o token do provider no Supabase
    """
    response = (
        supabase.table("integrations")
        .update(new_tokens)
        .eq("user_id", user_id)
        .eq("provider", provider)
        .execute()
    )
    return response.data
