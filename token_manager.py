import os
import time
import requests
import base64
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv()

# Agora sim pega as variáveis
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

BLING_CLIENT_ID = os.getenv("BLING_CLIENT_ID")
BLING_CLIENT_SECRET = os.getenv("BLING_CLIENT_SECRET")

ML_CLIENT_ID = os.getenv("ML_CLIENT_ID")
ML_CLIENT_SECRET = os.getenv("ML_CLIENT_SECRET")

# Só cria o cliente depois que o .env foi carregado
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)



# ==============================
# FUNÇÕES AUXILIARES
# ==============================

def get_user_token(provider: str, user_id: str):
    """Busca token do Supabase"""
    resp = supabase.table("user_tokens").select("*") \
        .eq("provider", provider).eq("user_id", user_id).single().execute()
    if resp.data:
        return resp.data
    return None


def save_user_token(provider: str, user_id: str, tokens: dict):
    """Salva token atualizado no Supabase"""
    data = {
        "provider": provider,
        "user_id": user_id,
        "access_token": tokens["access_token"],
        "refresh_token": tokens.get("refresh_token"),
        "expires_at": int(time.time()) + int(tokens["expires_in"]),
    }
    supabase.table("user_tokens").upsert(data).execute()


# ==============================
# REFRESH TOKENS
# ==============================

def refresh_bling_token(user_id: str):
    tokens = get_user_token("bling", user_id)
    if not tokens:
        raise Exception("Token Bling não encontrado para este usuário.")

    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        raise Exception("Refresh token Bling não encontrado.")

    url = "https://www.bling.com.br/Api/v3/oauth/token"

    auth_str = f"{BLING_CLIENT_ID}:{BLING_CLIENT_SECRET}"
    auth_b64 = base64.b64encode(auth_str.encode("ascii")).decode("ascii")

    headers = {
        "Authorization": f"Basic {auth_b64}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }

    response = requests.post(url, data=data, headers=headers)
    response.raise_for_status()
    new_tokens = response.json()
    save_user_token("bling", user_id, new_tokens)
    return new_tokens


def refresh_ml_token(user_id: str):
    tokens = get_user_token("ml", user_id)
    if not tokens:
        raise Exception("Token Mercado Livre não encontrado para este usuário.")

    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        raise Exception("Refresh token ML não encontrado.")

    url = "https://api.mercadolibre.com/oauth/token"
    payload = {
        "grant_type": "refresh_token",
        "client_id": ML_CLIENT_ID,
        "client_secret": ML_CLIENT_SECRET,
        "refresh_token": refresh_token,
    }

    response = requests.post(url, data=payload)
    response.raise_for_status()
    new_tokens = response.json()
    save_user_token("ml", user_id, new_tokens)
    return new_tokens


# ==============================
# GET TOKENS
# ==============================

def get_bling_token(user_id: str):
    tokens = get_user_token("bling", user_id)
    if not tokens:
        raise Exception("Token Bling não encontrado. Autentique primeiro.")

    if time.time() >= tokens.get("expires_at", 0) - 60:
        tokens = refresh_bling_token(user_id)
    return tokens["access_token"]


def get_ml_token(user_id: str):
    tokens = get_user_token("ml", user_id)
    if not tokens:
        raise Exception("Token Mercado Livre não encontrado. Autentique primeiro.")

    if time.time() >= tokens.get("expires_at", 0) - 60:
        tokens = refresh_ml_token(user_id)
    return tokens["access_token"]

if __name__ == "__main__":
    print("Supabase URL:", SUPABASE_URL)
    print("Client criado com sucesso ✅")
