  # 🎮 Quick Start Guide - Open World Roam Game

## Play Instantly

Your game is **fully operational** and ready to play right now!

### Option 1: Local Play (Recommended for Testing)

```powershell
# Terminal 1: Start the server
python .\tools\server.py 8000

# Terminal 2 or Browser: Open this link
http://localhost:8000
```

**That's it!** The game loads immediately. No build step, no compilation.

### Option 2: Online Play (Instant HTTps

1. Locate: `git-hub-demo-game.zip` (in your project root)
2. Visit: https://app.netlify.com/drop
3. Drag-and-drop the ZIP file
4. **Instant HTTPS link appears!** Copy and share 🔗

---

## How to Play (2-Minute Tutorial)

### Movement
- **W, A, S, D** or **Arrow Keys** = Move around the infinite world
- **Spacebar** = Jump (gravity pulls you down)

### Survive the Snake
- 🔴 **Red snake** appears after 5 seconds
- Chase speed: **1.5× your speed**
- Collect power-ups to escape!

### Collect Power-Ups
Walk over glowing boxes:
- 🟠 **Orange** = Speed Boost (30% faster for 12 seconds)
- 🔵 **Cyan** = Shield (Protected from snake for 15 seconds)
- 🟢 **Green** = Health (Restore if caught)

### Visuals & Audio
- **Dust trails** when walking
- **Footstep sounds** with each step
- **Jump sound** when pressing Space
- **Pickup chime** when collecting power-ups
- **Danger alert** when snake is close

### Camera Modes
- **Top-down**: Default view, perfect control
- **Follow**: Camera stays behind character
- **Overview**: Zoomed out, see more terrain

### 3D Mode (Optional)
Check the **"3D Mode"** box to see the game in full 3D with:
- Humanoid character with running animation
- Realistic lighting and shadows
- 3D power-up boxes and particles

### Graphics Quality
- **Low**: Fast performance, basic visuals
- **Medium**: Default, good balance
- **High**: Beautiful, needs faster device

You can also open the Settings (click "Settings ⚙️") and use the **Presets** (Low/Medium/High) to apply a bundle of graphics options (shadows, particles, fog, bloom) quickly. The current FPS is shown in the top-left as an "FPS" counter to help you judge performance.

### Choose Your Character
- **Explorer (Yellow)** — The default
- **Scout (Blue)** — Swift and nimble
- **Ranger (Green)** — Natural blend

---

## Game Mechanics Explained

### Score
- **Points** = Distance you've traveled
- Higher score = longer survival time ✅

### Physics
- **Gravity** pulls you down from jumps
- **Water & Trees** block movement (collision)
- **All terrain types** are walkable (grass, sand, snow)

### The Snake
1. **First 5 seconds**: Free exploration (head start)
2. **Then**: Red snake spawns ~600 units away
3. **Chases at**: 1.5× your movement speed
4. **Collision**: Game over (unless you have shield active)
5. **Shield blocks**: Snake bounces away, you stay safe

### Power-Ups
**Speed Boost** (12 sec)
- Increases velocity by 30%
- Great for escaping!
- Wears off after timer expires

**Shield** (15 sec)
- Blocks snake collision
- Snake bounces away
- Wear it once then it's gone

**Health** (instant)
- Restores if you get caught
- Future enhancement: full game reset

### Terrain Biomes
Three procedural terrain types:
- **Grass (Green)**: Common, 33% of world
- **Sand (Tan)**: Desert regions, 33% of world
- **Snow (White-Blue)**: Frozen areas, 34% of world
- All walkable, all have same physics

### Particle Effects
- **Dust trails**: Under your feet when moving
- **Landing particles**: Burst when you hit ground
- **Pickup particles**: Explode when collecting power-ups
- **Danger particles**: Red haze near snake

---

## Controls Quick Reference

| Action | Key(s) |
|--------|--------|
| Move Up | W, ↑ |
| Move Left | A, ← |
| Move Down | S, ↓ |
| Move Right | D, → |
| Jump | Space |
| Switch Camera | Dropdown menu |
| Toggle 3D | Checkbox |
| Change Quality | Dropdown menu |
| Pick Character | Dropdown menu |

---

## Tips & Tricks

### 🏃 Escape the Snake
1. **Zig-zag**: Change direction unpredictably
2. **Hop obstacles**: Jump over things (snake can't)
3. **Use shield**: Pop a shield power-up for 15 seconds of safety
4. **Speed boost**: Combine with shield for maximum escape velocity
5. **Circle terrain**: Use water/trees as natural barriers (you can't walk through, snake can't either)

### 🎯 Maximize Your Score
- **Avoid standing still**: Score increments only on movement
- **Explore**: Venture into new territory for higher scores
- **Power-ups are rare**: Collect them when you find them
- **Use shield defensively**: Only activate when snake is close

### 📊 Best Settings
- **Graphics**: Medium (good balance of speed & beauty)
- **Camera**: Follow (best for dodging)
- **3D Mode**: Try it once, then 2D is faster

### 🔊 Sound Tips
- Game auto-plays sounds (no buttons needed)
- Footsteps signal movement is working
- Jump sound confirms spacebar registered
- Chime means you got a power-up

---

## Troubleshooting

### "Game won't load"
- Check Python server is running: `python .\tools\server.py 8000`
- Use exact URL: `http://localhost:8000` (not localhost:8000/)
- Try a different browser (Chrome or Firefox)

### "No sounds"
- Browser may need permission
- Check browser console (F12) for errors
- Audio requires HTTPS or localhost (not file://)
- Some browsers start the AudioContext in a suspended state; click or press a key on the page to enable audio

### "Movement is choppy"
- Switch to **Low graphics**
- Disable **3D Mode**
- Close other browser tabs
- Refresh page (F5)

### "Snake won't appear"
- Wait 5 full seconds from game start
- Check HUD for "Snake active!" message
- Snake spawns ~600 units away (off-screen initially)

### "Power-ups not spawning"
- They spawn randomly and rare (~1 per 500×500 area)
- Explore more terrain to find them
- Check HUD for pickup messages

---

## How It Works (Technical Peekaboo)

### No Server Required
- Everything runs in your browser
- No internet connection needed (offline play!)
- All rendering happens locally

### Procedural Generation
- Terrain is randomly generated but **deterministic** (same each time)
- Infinite map: no boundaries or loading screens
- Biomes appear procedurally based on location

### Real-Time Audio
- Sounds are **synthesized** (not pre-recorded)
- Uses Web Audio API (modern browser feature)
- No audio files = smaller game size

### Physics Simulation
- Gravity: 800 pixels/second²
- Jump force: 400 pixels/second
- Terminal velocity: 600 pixels/second (max fall speed)

### 3D Rendering
- Optional Three.js renderer
- Shadows and lighting calculations
- Humanoid character model with animation

---

## What Makes This Game Special

✨ **Lightweight**: ~250 KB total (includes Three.js CDN link)  
⚡ **Fast**: Runs smoothly on most devices  
🎯 **Addictive**: Simple mechanics, high challenge  
🎨 **Beautiful**: Multiple biomes, particle effects, 3D mode  
🔊 **Immersive**: Real-time procedural audio  
📱 **No Installation**: Pure web-based, works everywhere  
🔓 **Open Source**: Fully customizable code  

---

## Ready to Play?

1. **Start server**: `python .\tools\server.py 8000`
2. **Open browser**: `http://localhost:8000`
3. **Move with WASD**, **Jump with Space**
4. **Survive the snake**, **Collect power-ups**
5. **Have fun!** 🎮

---

### Questions?
Check `FEATURES.md` for detailed feature documentation  
Check `IMPLEMENTATION.md` for technical details  
Check source code (`game/main.js`, `game/main3d.js`, `game/audio.js`)

**Enjoy your game! 🚀**
