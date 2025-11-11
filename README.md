# git-hub-demo

An **open-world roaming game** with physics, power-ups, particle effects, and biome-based terrain. Built with vanilla **JavaScript/HTML5 Canvas** (2D) and **Three.js** (3D mode). Features include gravity-based jumping, a pursuing snake enemy, collectible power-ups, and dynamic terrain biomes.

## 🎮 Features

- **Open-World Roaming**: Infinite procedurally-generated terrain with three biome types (grass, sand, snow)
- **Physics System**: Gravity, jumping, velocity-based movement with collision detection
- **Snake Chase**: AI pursuer with 1.5× player speed and 5-second head start; defeated if you activate the shield power-up
- **Power-Ups**: Speed boost, shield, and health items spawn randomly across the map
- **Particle Effects**: Dust trails while walking, landing particles, pickup explosions, and danger indicators
- **Running Animation**: Synchronized arm/leg swinging based on movement velocity
- **Audio Synthesis**: Procedural footstep, jump, pickup, and danger sounds (no external audio files)
- **Multiple Perspectives**: Top-down, follow cam, and zoomed-out overview modes
- **3D Renderer**: Toggle between 2D canvas and 3D Three.js rendering
- **Graphics Quality**: Low, medium, and high quality settings
- **Character Skins**: Three color variants (Explorer/Yellow, Scout/Blue, Ranger/Green)
- **Score Tracking**: Distance-based scoring system
- **Multi-Language Example**: HTML/JS frontend, Python map generator and server, Java map generator

## 📁 Project Structure

```
.
├── game/
│   ├── index.html          # Main game page (Canvas + Three.js)
│   ├── main.js             # Core game loop, physics, AI, particle system
│   ├── main3d.js           # Three.js 3D renderer
│   ├── audio.js            # Web Audio API synthesis (NEW)
│   ├── style.css           # HUD and layout styling
│   └── map.json            # Static tile map (generated)
├── tools/
│   ├── generate_map.py     # Python map generator
│   └── server.py           # Python HTTP server
├── java/
│   └── MapGenerator.java    # Java map generator (multi-language example)
├── FEATURES.md             # Detailed feature documentation
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.7+ (for local server)
- Modern browser (Firefox, Chrome, Edge)

### Local Setup

1. **Generate the map** (optional; a default map.json is included):
   ```powershell
   python .\tools\generate_map.py
   ```

2. **Start the local server**:
   ```powershell
   python .\tools\server.py 8000
   ```

3. **Open in your browser**:
   ```
   http://localhost:8000
   ```

### Controls

| Key                | Action                 |
|--------------------|------------------------|
| **W / ↑**          | Move up                |
| **A / ←**          | Move left              |
| **S / ↓**          | Move down              |
| **D / →**          | Move right             |
| **Space**          | Jump                   |
| **Perspective**    | Switch camera mode     |
| **3D Mode**        | Toggle 3D renderer     |
| **Graphics**       | Quality setting (Low/Med/High) |
| **Character**      | Choose color skin      |

## 🎯 Gameplay

### Objective
Survive as long as possible while avoiding the snake pursuer. Collect power-ups to gain temporary advantages.

### Game Mechanics

- **Movement**: Use WASD to move freely; collide with water/trees to block movement
- **Jumping**: Press Space to jump; gravity pulls you down; landing emits particles
- **Snake**: After 5-second head start, a red snake chases you at 1.5× your speed
- **Power-Ups**: Run over glowing boxes to activate:
  - 🟠 **Speed Boost** (orange): 30% faster movement for 12 seconds
  - 🔵 **Shield** (cyan): Protect against snake collision for 15 seconds
  - 🟢 **Health** (green): Restore game state if caught
- **Score**: Increments by distance traveled
- **Game Over**: Touched by snake without shield; message displayed

### Biomes

Three procedurally-generated terrain types:
- **Grass** (green): Common terrain, normal traversal
- **Sand** (tan): Desert-like regions, same physics as grass
- **Snow** (white-blue): Frozen regions, visually distinct but same mechanics

## 🎨 3D Mode

Toggle **3D Mode** to switch from 2D canvas to Three.js 3D rendering:
- Full 3D scene with lighting, shadows, and realistic materials
- Humanoid player character with running animation
- Dynamic tile and object rendering based on view distance
- Glowing power-up boxes and particle effects in 3D
- Smoother camera follow and visual immersion

## 🔊 Audio

All sounds are **procedurally synthesized** using Web Audio API (no external files):
- **Footsteps**: Low-frequency sweep (200→100 Hz) when walking
- **Jump**: Rising frequency (400→600 Hz) on spacebar
- **Pickup**: High chime (600→1200 Hz) when collecting power-ups
- **Danger**: Alert tone when snake approaches or collision imminent

## 📊 System Requirements

- **Browser**: Modern ES6-compatible (Firefox 60+, Chrome 60+, Edge 79+, Safari 12+)
- **Screen**: 1024×600 minimum recommended
- **Performance**: 60 FPS on most devices; adjustable graphics quality
- **Network**: Not required (fully client-side, no backend calls)

## 🌐 Deployment

### Option 1: Netlify Drop (Instant)
1. Download the ZIP: `git-hub-demo-game.zip`
2. Visit https://app.netlify.com/drop
3. Drag-and-drop the ZIP → get instant HTTPS link

### Option 2: GitHub Pages (Automatic)
1. Push to GitHub with Actions enabled
2. Automatic deploy to: `https://<username>.github.io/git-hub-demo/`

### Option 3: Local Server
```powershell
python .\tools\server.py 8000
# Open: http://localhost:8000
```

## 📝 Code Examples

### Playing a Sound
```javascript
Audio.playFootstep();  // Footstep sound
Audio.playJump();      // Jump sound
Audio.playPickup();    // Power-up collected
Audio.playDanger();    // Danger alert
```

### Spawning Particles
```javascript
addParticle(x, y, vx, vy, lifetime, color);
// Example: dust trail while walking
addParticle(player.x, player.y, Math.random()-0.5, -20, 0.3, 'rgba(200,200,200,0.5)');
```

### Checking Collision
```javascript
if(checkCollision(nextX, nextY, player.size)) {
  // Collision detected; don't move
}
```

## 🔧 Configuration

### Graphics Quality
- **Low**: 1.0 pixel ratio, far tile render distance, reduced shadows
- **Medium**: Native device pixel ratio, moderate distance, full shadows
- **High**: 2.0 pixel ratio (sharp), far distance, high-res shadow maps

### Physics Settings (in `main.js`)
```javascript
const physics = {
  gravity: 800,        // pixels/s² downward acceleration
  jumpForce: 400,      // initial upward velocity
  maxFallSpeed: 600,   // terminal velocity
  friction: 0.92,      // velocity damping
};
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Game won't load | Check Python server is running; use exact URL `http://localhost:8000` |
| Sounds not working | Browser may block audio; check console for Web Audio errors |
| 3D mode crashes | Update browser; disable high graphics if low-end device |
| Snake not appearing | Wait 5 seconds for head start to expire |
| Movement feels sluggish | Try switching to low graphics or 2D mode |

## 📚 Multi-Language Code Examples

### Python Map Generator
```bash
python .\tools\generate_map.py [output_file.json]
```

### Java Map Generator
```bash
javac .\java\MapGenerator.java
java -cp .\java MapGenerator > .\game\map.json
```

## 🎓 Learning Resources

This project demonstrates:
- **Canvas 2D API**: Rendering, transformations, animations
- **Three.js**: 3D scenes, materials, lighting, shadows
- **Physics**: Gravity, collision detection, velocity-based movement
- **Procedural Generation**: Seeded noise for infinite terrain
- **Web Audio API**: Real-time sound synthesis
- **Game Loop**: Frame-based physics and rendering
- **Performance Optimization**: Dynamic LOD, object pooling

## 🤝 Contributing

Suggested enhancements:
- Mobile touch controls
- Leaderboard backend integration
- Additional power-up types (time slow, teleport, invisibility)
- Biome-specific hazards (quicksand, ice patches)
- NPC characters and interactions
- Level progression system

## 📄 License

This project is provided as-is for educational and recreational purposes.

## 🙋 FAQ

**Q: Can I play this on mobile?**  
A: Currently optimized for desktop. Mobile touch support can be added.

**Q: Is there multiplayer?**  
A: Removed for simplicity and deployment. Can be re-added via WebSocket.

**Q: Why no external audio files?**  
A: Procedural synthesis keeps the game lightweight (~200KB) and works offline.

**Q: Can I modify the game?**  
A: Yes! Code is straightforward vanilla JavaScript; modify `main.js` and `main3d.js` freely.

**Q: How does the biome system work?**  
A: Seeded pseudo-random noise (coordNoise) generates consistent, infinite biomes based on tile coordinates.

---

**Enjoy the game! 🎮** Report bugs or suggest features via issues.


Option 1 — Netlify (very easy)
- Go to https://app.netlify.com/drop and drag the `game/` folder onto the page. Netlify will upload and give you an HTTPS link instantly. No backend required.

Option 2 — GitHub Pages (free)
- Create a repository and push the project. In GitHub settings enable GitHub Pages from the `gh-pages` branch or from the `main` branch's `/docs` folder. Then push the contents of `game/` to that branch/folder and GitHub will publish an HTTPS link.

Notes
- Because the project is now static you get an HTTPS (protected) link when deployed with Netlify or GitHub Pages that will open in Firefox without mixed-content or WebSocket issues.
- If you want me to prepare a ZIP with the `game/` folder or a small deploy script for Netlify/GitHub Pages, say which one and I will add it.
