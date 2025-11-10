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

Serving and secure public link

Multiplayer has been removed to simplify hosting and to make a secure public link easier to provide.

Local server

Run the static server and open the demo in your browser (Firefox works fine):

```powershell
python -m http.server 8000 --directory ".\game"
```

Open in Firefox:

http://127.0.0.1:8000/

Public (HTTPS) hosting — recommended

Option 1 — Netlify (very easy)
- Go to https://app.netlify.com/drop and drag the `game/` folder onto the page. Netlify will upload and give you an HTTPS link instantly. No backend required.

Option 2 — GitHub Pages (free)
- Create a repository and push the project. In GitHub settings enable GitHub Pages from the `gh-pages` branch or from the `main` branch's `/docs` folder. Then push the contents of `game/` to that branch/folder and GitHub will publish an HTTPS link.

Notes
- Because the project is now static you get an HTTPS (protected) link when deployed with Netlify or GitHub Pages that will open in Firefox without mixed-content or WebSocket issues.
- If you want me to prepare a ZIP with the `game/` folder or a small deploy script for Netlify/GitHub Pages, say which one and I will add it.
