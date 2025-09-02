from http.server import BaseHTTPRequestHandler
import json
import os
import mimetypes

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Definir o caminho base para os arquivos estáticos
        base_path = os.path.join(os.path.dirname(__file__), '..')
        
        # Rotas da API
        if self.path == '/api' or self.path == '/api/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"message": "Hello World from Vercel!"}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
        elif self.path == '/api/test':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "success", "message": "API is working on Vercel"}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
        
        # Redirecionar / para /dashboard.html
        if self.path == '/':
            self.send_response(302)
            self.send_header('Location', '/dashboard.html')
            self.end_headers()
            return
        
        # Servir arquivos estáticos
        try:
            # Remover a barra inicial para obter o caminho relativo
            file_path = self.path.lstrip('/')
            
            # Construir o caminho completo do arquivo
            full_path = os.path.join(base_path, file_path)
            
            # Verificar se o arquivo existe
            if os.path.exists(full_path) and os.path.isfile(full_path):
                # Determinar o tipo MIME do arquivo
                content_type, _ = mimetypes.guess_type(full_path)
                if content_type is None:
                    content_type = 'application/octet-stream'
                
                # Enviar o arquivo
                with open(full_path, 'rb') as file:
                    content = file.read()
                    self.send_response(200)
                    self.send_header('Content-type', content_type)
                    self.send_header('Content-length', str(len(content)))
                    self.end_headers()
                    self.wfile.write(content)
            else:
                # Arquivo não encontrado
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {"error": "File not found"}
                self.wfile.write(json.dumps(response).encode('utf-8'))
        except Exception as e:
            # Erro ao servir o arquivo
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"error": str(e)}
            self.wfile.write(json.dumps(response).encode('utf-8'))
        
        return