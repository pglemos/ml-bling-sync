import subprocess
import time
import os
from pathlib import Path
import webbrowser
import json
import requests
import base64
import secrets
from flask import Flask, request
import threading
from pyngrok import ngrok

app = Flask(__name__)

# Configurações
BLING_CLIENT_ID = "594eb44f082df52483687ff30527989ecc9a4e8a"
BLING_CLIENT_SECRET = "20268b08e2d5d24ec0133355b9d38521aac5b99f37445646e4c8e92da270"
ML_CLIENT_ID = "4988290511933135"
ML_CLIENT_SECRET = "kK6AOP3lniFUzz76G8Q5geZoQV4TDsg0"

# Variáveis globais para armazenar os códigos
bling_code = None
ml_code = None
public_url = None

# Rotas de callback
@app.route("/callback/bling")
def callback_bling():
    global bling_code
    bling_code = request.args.get("code")
    print(f"✅ Code Bling recebido: {bling_code}")
    return "Autenticação Bling concluída! Você pode fechar esta janela."

@app.route("/callback/ml")
def callback_ml():
    global ml_code
    ml_code = request.args.get("code")
    print(f"✅ Code ML recebido: {ml_code}")
    return "Autenticação Mercado Livre concluída! Você pode fechar esta janela."

def trocar_codigo_bling(code, redirect_uri):
    url = "https://www.bling.com.br/Api/v3/oauth/token"
    
    # Preparar dados para Basic Auth
    auth_str = f"{BLING_CLIENT_ID}:{BLING_CLIENT_SECRET}"
    auth_bytes = auth_str.encode('ascii')
    auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
    
    headers = {
        'Authorization': f'Basic {auth_b64}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri
    }
    
    resp = requests.post(url, data=payload, headers=headers)
    try:
        resp.raise_for_status()
    except:
        print(f"Erro na resposta do Bling: {resp.text}")
        raise
    tokens = resp.json()
    tokens["expires_at"] = int(time.time()) + int(tokens["expires_in"])
    save_tokens(tokens, "bling_tokens.json")
    print("✅ Tokens Bling salvos com sucesso!")
    return tokens

def trocar_codigo_ml(code, redirect_uri):
    url = "https://api.mercadolibre.com/oauth/token"
    payload = {
        "grant_type": "authorization_code",
        "client_id": ML_CLIENT_ID,
        "client_secret": ML_CLIENT_SECRET,
        "code": code,
        "redirect_uri": redirect_uri
    }
    
    response = requests.post(url, data=payload)
    try:
        response.raise_for_status()
    except:
        print(f"Erro na resposta do ML: {response.text}")
        raise
    tokens = response.json()
    tokens['expires_at'] = time.time() + tokens['expires_in']
    save_tokens(tokens, "ml_token.json")
    print("✅ Tokens ML salvos com sucesso!")
    return tokens

def save_tokens(data, filename):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def check_tokens():
    return (Path("bling_tokens.json").exists() and 
            Path("ml_token.json").exists())

def start_flask_server():
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)

def autenticacao_automatica():
    """Autenticação automática com servidor Flask e Ngrok"""
    global public_url, bling_code, ml_code
    
    print("🔐 Iniciando autenticação automática...")
    
    # Iniciar servidor Flask em thread
    flask_thread = threading.Thread(target=start_flask_server)
    flask_thread.daemon = True
    flask_thread.start()
    
    # Aguardar o servidor iniciar
    time.sleep(2)
    
    # Iniciar Ngrok
    try:
        tunnel = ngrok.connect(5000, bind_tls=True)
        public_url = tunnel.public_url
        print(f"🔗 URL pública: {public_url}")
    except Exception as e:
        print(f"❌ Erro ao iniciar Ngrok: {e}")
        return False
    
    # URLs de autorização
    auth_url_bling = (
        f"https://www.bling.com.br/Api/v3/oauth/authorize"
        f"?response_type=code&client_id={BLING_CLIENT_ID}"
        f"&redirect_uri={public_url}/callback/bling"
    )
    
    auth_url_ml = (
        f"https://auth.mercadolibre.com.br/authorization"
        f"?response_type=code&client_id={ML_CLIENT_ID}"
        f"&redirect_uri={public_url}/callback/ml"
    )
    
    print("\n🌐 Abrindo URLs de autenticação...")
    print(f"👉 Bling: {auth_url_bling}")
    print(f"👉 Mercado Livre: {auth_url_ml}")
    
    webbrowser.open(auth_url_bling)
    webbrowser.open(auth_url_ml)
    
    print("\n⏳ Aguardando autenticação...")
    print("⚠️  IMPORTANTE: Você precisa configurar estas URLs nas plataformas:")
    print(f"   - Bling: {public_url}/callback/bling")
    print(f"   - Mercado Livre: {public_url}/callback/ml")
    print("\n⏳ Após configurar, complete a autenticação nos navegadores que abriram...")
    
    # Aguardar os callbacks
    timeout = 300  # 5 minutos
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        if bling_code and ml_code:
            break
        time.sleep(1)
    
    if not bling_code or not ml_code:
        print("❌ Tempo limite excedido. Não foi possível obter os códigos.")
        return False
    
    # Trocar códigos por tokens
    print("\n🔄 Obtendo tokens de acesso...")
    try:
        trocar_codigo_bling(bling_code, f"{public_url}/callback/bling")
        trocar_codigo_ml(ml_code, f"{public_url}/callback/ml")
        print("✅ Autenticação concluída com sucesso!")
        return True
    except Exception as e:
        print(f"❌ Erro durante a autenticação: {e}")
        return False

def start_services():
    if not check_tokens():
        print("🔄 Iniciando autenticação...")
        if autenticacao_automatica():
            print("✅ Tokens obtidos com sucesso!")
        else:
            print("❌ Falha na autenticação automática. Tente novamente.")
            return
    
    # Inicia sincronização
    print("🚀 Iniciando sincronização...")
    subprocess.Popen(["python", "create_missing_categorias.py"])

if __name__ == "__main__":
    start_services()