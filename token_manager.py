import os
import requests
from datetime import datetime, timedelta
from supabase import create_client, Client

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Config ML e Bling
ML_CLIENT_ID = os.getenv("ML_CLIENT_ID")
ML_CLIENT_SECRET = os.getenv("ML_CLIENT_SECRET")
BLING_CLIENT_ID = os.getenv("BLING_CLIENT_ID")
BLING_CLIENT_SECRET = os.getenv("BLING_CLIENT_SECRET")

def get_integration(user_id: str, provider: str):
    """Busca integração do usuário no Supabase"""
    response = supabase.table("integrations").select("*").eq("user_id", user_id).eq("provider", provider).single().execute()
    return response.data if response.data else None

def update_integration(user_id: str, provider: str, access_token: str, refresh_token: str, expires_in: int):
    """Atualiza token no Supabase"""
    supabase.table("integrations").update({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": expires_in,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("user_id", user_id).eq("provider", provider).execute()

def refresh_ml_token(user_id: str, refresh_token: str):
    url = "https://api.mercadolibre.com/oauth/token"
    payload = {
        "grant_type": "refresh_token",
        "client_id": ML_CLIENT_ID,
        "client_secret": ML_CLIENT_SECRET,
        "refresh_token": refresh_token,
    }
    response = requests.post(url, data=payload, timeout=30)
    
    if response.status_code >= 400:
        raise Exception(f"Erro ao atualizar token ML: {response.status_code} {response.text}")
        
    data = response.json()
    if "access_token" not in data or "refresh_token" not in data:
        raise Exception(f"Resposta inválida do ML: {data}")
        
    update_integration(user_id, "ml", data["access_token"], data["refresh_token"], data["expires_in"])
    return data["access_token"]

def refresh_bling_token(user_id: str, refresh_token: str):
    url = "https://www.bling.com.br/Api/v3/oauth/token"
    payload = {
        "grant_type": "refresh_token",
        "client_id": BLING_CLIENT_ID,
        "client_secret": BLING_CLIENT_SECRET,
        "refresh_token": refresh_token,
    }
    response = requests.post(url, data=payload, timeout=30)
    
    if response.status_code >= 400:
        raise Exception(f"Erro ao atualizar token Bling: {response.status_code} {response.text}")
        
    data = response.json()
    if "access_token" not in data or "refresh_token" not in data:
        raise Exception(f"Resposta inválida do Bling: {data}")
        
    update_integration(user_id, "bling", data["access_token"], data["refresh_token"], data["expires_in"])
    return data["access_token"]

def get_valid_token(user_id: str, provider: str):
    """Retorna um token válido para o usuário"""
    integration = get_integration(user_id, provider)
    if not integration:
        raise Exception(f"Nenhuma integração encontrada para {provider}")

    # Verifica se o token está expirado ou perto do vencimento
    # Se expires_in for None ou menor que 60 segundos, atualiza o token
    expires_in = integration.get("expires_in", 0)
    if expires_in is None or expires_in < 60:  # token expirado ou perto do vencimento
        try:
            if provider == "ml":
                return refresh_ml_token(user_id, integration["refresh_token"])
            elif provider == "bling":
                return refresh_bling_token(user_id, integration["refresh_token"])
            else:
                raise Exception("Provider inválido")
        except Exception as e:
            raise Exception(f"Erro ao atualizar token {provider}: {str(e)}")

    return integration["access_token"]
