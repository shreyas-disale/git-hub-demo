"""Generate a simple tile map JSON for the web demo.
Usage: python tools/generate_map.py [output_path]
"""
import json
import random
import sys

WIDTH = 120
HEIGHT = 80
TILE_SIZE = 16

def generate(w=WIDTH,h=HEIGHT):
    tiles = [[0 for _ in range(w)] for __ in range(h)]
    for y in range(h):
        for x in range(w):
            r = random.random()
            if r < 0.08:
                tiles[y][x] = 1  # water
            elif r < 0.12:
                tiles[y][x] = 2  # tree
            else:
                tiles[y][x] = 0  # grass
    # add a lake
    cx = random.randint(10,w-10)
    cy = random.randint(10,h-10)
    for dy in range(-6,7):
        for dx in range(-10,11):
            if 0 <= cy+dy < h and 0 <= cx+dx < w:
                if dx*dx/100 + dy*dy/36 < 1.0:
                    tiles[cy+dy][cx+dx] = 1
    return {
        'width': w,
        'height': h,
        'tileSize': TILE_SIZE,
        'tiles': tiles
    }

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '../game/map.json'
    m = generate()
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(m, f)
    print('Wrote', out)
