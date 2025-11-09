"""Simple WebSocket multiplayer server.
Requires: pip install websockets
Run: python tools/multiplayer_server.py
Clients connect and send JSON messages like: {"type":"update","x":123,"y":456}
Server broadcasts state: {"type":"state","players":{id:{x:..,y:..}, ...}}
"""
import asyncio
import json
import uuid
import websockets

CONNECTED = set()
PLAYERS = {}  # id -> {x,y}

async def handler(ws, path):
    uid = str(uuid.uuid4())
    CONNECTED.add(ws)
    PLAYERS[uid] = {"x":0, "y":0}
    try:
        # send assigned id
        await ws.send(json.dumps({"type":"id", "id": uid}))
        async for msg in ws:
            try:
                m = json.loads(msg)
            except Exception:
                continue
            if m.get('type') == 'update':
                PLAYERS[uid] = {"x": m.get('x', PLAYERS[uid]['x']), "y": m.get('y', PLAYERS[uid]['y'])}
            # broadcast snapshot to all
            snapshot = json.dumps({"type":"state", "players": PLAYERS})
            await asyncio.gather(*[c.send(snapshot) for c in list(CONNECTED) if c.open])
    except websockets.ConnectionClosed:
        pass
    finally:
        CONNECTED.discard(ws)
        if uid in PLAYERS: del PLAYERS[uid]
        # broadcast removal
        snapshot = json.dumps({"type":"state", "players": PLAYERS})
        await asyncio.gather(*[c.send(snapshot) for c in list(CONNECTED) if c.open])

async def main():
    async with websockets.serve(handler, '0.0.0.0', 8765):
        print('Multiplayer server listening on ws://0.0.0.0:8765')
        await asyncio.Future()  # run forever

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('Server shutting down')
