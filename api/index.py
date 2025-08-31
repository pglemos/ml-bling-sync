from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        if self.path == '/':
            response = {"message": "Hello World from Vercel!"}
        elif self.path == '/api/test':
            response = {"status": "success", "message": "API is working on Vercel"}
        else:
            response = {"error": "Not found"}
            
        self.wfile.write(json.dumps(response).encode('utf-8'))
        return