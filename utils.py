# utils.py
import os
import time
import requests
from dotenv import load_dotenv
from supabase import create_client

# Carrega variáveis do .env.local
load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ML_CLIENT_ID = os.getenv("ML_CLIENT_ID")
ML_CLIENT_SECRET = os.getenv("ML_CLIENT_SECRET")
BLING_CLIENT_ID = os.getenv("BLING_CLIENT_ID")
BLING_CLIENT_SECRET = os.getenv("BLING_CLIENT_SECRET")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("❌ Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não foram carregadas!")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def refresh_ml_token(refresh_token: str):
    """Renova token do Mercado Livre"""
    url = "https://api.mercadolibre.com/oauth/token"
    payload = {
        "grant_type": "refresh_token",
        "client_id": ML_CLIENT_ID,
        "client_secret": ML_CLIENT_SECRET,
        "refresh_token": refresh_token
    }
    resp = requests.post(url, data=payload)
    resp.raise_for_status()
    return resp.json()


def refresh_bling_token(refresh_token: str):
    """Renova token do Bling"""
    url = "https://www.bling.com.br/Api/v3/oauth/token"
    payload = {
        "grant_type": "refresh_token",
        "client_id": BLING_CLIENT_ID,
        "client_secret": BLING_CLIENT_SECRET,
        "refresh_token": refresh_token
    }
    resp = requests.post(url, data=payload)
    resp.raise_for_status()
    return resp.json()


def get_integration_tokens(user_id: str, provider: str):
    """Busca token mais recente no Supabase e renova se expirado"""
    response = supabase.table("integrations") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("provider", provider) \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()

    if not response.data:
        raise Exception(f"⚠️ Nenhum token encontrado para {provider}")

    token_data = response.data[0]

    # Checar expiração
    now = int(time.time())
    if token_data["expires_in"] and int(token_data["expires_in"]) < now:
        print(f"🔄 Token expirado para {provider}, renovando...")

        if provider == "ml":
            new_tokens = refresh_ml_token(token_data["refresh_token"])
        elif provider == "bling":
            new_tokens = refresh_bling_token(token_data["refresh_token"])
        else:
            raise Exception(f"⚠️ Provider desconhecido: {provider}")

        # Atualiza no Supabase
        supabase.table("integrations").update({
            "access_token": new_tokens["access_token"],
            "refresh_token": new_tokens.get("refresh_token", token_data["refresh_token"]),
            "expires_in": now + int(new_tokens["expires_in"]),
            "updated_at": time.strftime('%Y-%m-%d %H:%M:%S')
        }).eq("id", token_data["id"]).execute()

        token_data.update(new_tokens)
        token_data["expires_in"] = now + int(new_tokens["expires_in"])

    return token_data
