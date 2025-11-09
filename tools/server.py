"""Simple static server to serve the `game/` folder for local testing.
Run: python tools/server.py 8000
Then open: http://localhost:8000/
"""
import http.server
import socketserver
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.join(os.path.dirname(__file__), '..', 'game')

os.chdir(ROOT)
Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(('0.0.0.0', PORT), Handler) as httpd:
    print(f"Serving {ROOT} at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('Shutting down')
        httpd.server_close()
