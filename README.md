# git-hub-demo

This workspace contains a small multi-language demo: a browser-based open-world roaming example (HTML + JavaScript + CSS), plus helper map generators in Python and Java, and a simple Python static server for local testing.

Contents added:

- `game/` — web demo (open `index.html` via the server).
- `tools/generate_map.py` — Python script that writes `game/map.json`.
- `tools/server.py` — Python static server to serve the `game/` folder.
- `tools/multiplayer_server.py` — simple WebSocket server for multiplayer.
- `requirements.txt` — Python dependency file (websockets).
- `java/MapGenerator.java` — Java example that prints the same map JSON to stdout (compile & run to produce `game/map.json`).

Quick start (Python):

1. Generate the map JSON:

```powershell
python .\tools\generate_map.py
```

This writes `game/map.json` (default). Then run the static server:

```powershell
python .\tools\server.py 8000
```

Open the exact local link in your browser:

http://localhost:8000/

Controls: Use WASD / Arrow keys to move. Use the Perspective selector and the Multiplayer checkbox in the top-left.

Multiplayer (quick start)

1. Install the Python dependency:

```powershell
pip install -r requirements.txt
```

2. Start the WebSocket multiplayer server (separate terminal):

```powershell
python .\tools\multiplayer_server.py
```

3. Start the static server to serve the web client (another terminal):

```powershell
python .\tools\server.py 8000
```

4. Open `http://localhost:8000/`, enable Multiplayer via the checkbox in the top-left, then click Connect.

Troubleshooting & "link did not start"

- If you opened `index.html` directly using the file:// protocol the browser may block loading `map.json` or the WebSocket may not connect. Make sure the static server from step 3 is running and then open `http://localhost:8000/`.
- If you see a blank page: open the browser developer console (F12) and look for errors (e.g., missing `map.json` or blocked WebSocket). Copy any errors here and I can help debug.

Hosting a public link

- I can't publish a public link from this environment. If you want a public playable link I can prepare a deploy package and steps for hosting. Options:
  - Deploy the static client to Vercel/Netlify (static only). Multiplayer will require a separate server.
  - Deploy the WebSocket server to a cloud VM (or a container on services like DigitalOcean, AWS EC2), and point the client to its ws:// or wss:// address.

If you'd like, tell me which hosting provider you'd prefer and I'll prepare deploy instructions and a small script to run it.
