from http.server import BaseHTTPRequestHandler
import json
import datetime

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "message": "API is working!",
            "method": "GET",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        self.wfile.write(json.dumps(response).encode())
        return
    
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "message": "API is working!",
            "method": "POST",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        self.wfile.write(json.dumps(response).encode())
        return

