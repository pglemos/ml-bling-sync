from token_manager import supabase, save_user_token, get_user_token
import time

# Simulando um user_id (no futuro vem do Supabase Auth)
USER_ID = "1d2b8b0c-726e-4c8a-863b-c4f0b4c147ab"

# Testa salvar um token fictício do Mercado Livre
fake_tokens = {
    "access_token": "fake_access_123",
    "refresh_token": "fake_refresh_123",
    "expires_in": 3600,  # 1 hora
}

print("💾 Salvando token de teste...")
save_user_token("ml", USER_ID, fake_tokens)

print("📥 Buscando token salvo...")
tokens = get_user_token("ml", USER_ID)
print("Resultado:", tokens)

if tokens:
    print("✅ Conseguiu salvar e buscar token do Supabase!")
else:
    print("❌ Erro: não conseguiu salvar/ler token.")
