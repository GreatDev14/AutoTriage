import http.server
import socketserver
import os

PORT = 80

class AutoTriageHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/app' or self.path == '/autotriage':
            self.path = '/simple.html'
        return super().do_GET()

if __name__ == '__main__':
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    try:
        with socketserver.TCPServer(("", PORT), AutoTriageHandler) as httpd:
            print(f"Serving AutoTriage on Port {PORT}...")
            httpd.serve_forever()
    except Exception as e:
        print(f"Error starting port {PORT}: {e}")
