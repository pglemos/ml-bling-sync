from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api' or self.path == '/api/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"message": "Hello World from Vercel!"}
            self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/test':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "success", "message": "API is working on Vercel"}
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"error": "Not Found"}
            self.wfile.write(json.dumps(response).encode('utf-8'))
        return
