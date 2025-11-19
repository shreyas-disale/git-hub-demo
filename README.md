# git-hub-demo

An **open-world roaming game** with **vehicles, physics, power-ups**, and particle effects. Built with vanilla **JavaScript/HTML5 Canvas** (2D) and **Three.js** (3D mode). Features include gravity-based jumping, a pursuing snake enemy, collectible power-ups, dynamic terrain biomes, and a full **vehicle system** with scooters, bikes, cars, auto-rickshaws, buses, and planes.

## 🎮 Features

- **Open-World Roaming**: Infinite procedurally-generated terrain with three biome types (grass, sand, snow)
- **Advanced Physics System**: Gravity, velocity-based movement, steering, braking, collision detection, and vehicle-specific physics
- **Vehicle System** (NEW): Drive 7 different vehicles:
  - 🚶 **Walking** – Normal player movement (200 px/s max)
  - 🛴 **Scooter** – Light 2-wheeler (180 px/s max)
  - 🏍️ **Motorcycle** – Fast sports bike (280 px/s max)
  - 🚗 **Car** – 4-wheeler sedan (250 px/s max)
  - 🛺 **Auto-Rickshaw** – Traditional Indian 3-wheeler (160 px/s max)
  - 🚌 **Bus** – Heavy public transport (140 px/s max)
  - ✈️ **Plane** – Airborne craft with altitude control (400 px/s max)
- **Snake Chase**: AI pursuer with dynamic speed based on your vehicle
- **Power-Ups**: Speed boost, shield, and health items spawn randomly across the map
- **Particle Effects**: Dust trails while driving, landing particles, pickup explosions
- **Running/Driving Animation**: Synchronized animation based on movement velocity and vehicle type
- **Audio Synthesis**: Procedural sound effects (no external audio files required)
- **Multiple Perspectives**: Top-down, follow cam, and zoomed-out overview modes
- **3D Renderer**: Toggle between 2D canvas and 3D Three.js rendering
- **Graphics Quality**: Low, medium, and high quality settings
- **Character System** (NEW): 5 unique characters with personality, appearance, and stat modifiers:
  - ⚡ **Soham** (Athlete, Blue) – Fast and agile (+15% speed, +25% jump)
  - ⚖️ **Shreyas** (All-Rounder, Black) – Perfectly balanced in all aspects
  - 🔥 **Akshata** (Fierce & Feisty, Red) – Strong and confident (+15% acceleration, +10% jump)
  - 💝 **Namal** (Sweet Guardian, White) – Kind and defensive (-5% speed, +10% mass)
  - ✨ **Mehwish** (Graceful Beauty, Pink) – Most beautiful and graceful (+8% speed, +18% jump, lightest)
- **Score Tracking**: Distance-based scoring system
- **Comprehensive Debugging**: Console logs and error handling for troubleshooting

## 📁 Project Structure

```
.
├── game/
│   ├── index.html          # Main game page (Canvas + Three.js + Vehicle UI)
│   ├── main.js             # Core game loop, physics, vehicle system, AI, particles
│   ├── main3d.js           # Three.js 3D renderer
│   ├── audio.js            # Web Audio API synthesis
│   ├── style.css           # HUD and layout styling
│   └── map.json            # Static tile map (generated)
├── tools/
│   ├── generate_map.py     # Python map generator
│   └── server.py           # Python HTTP server
├── java/
│   └── MapGenerator.java    # Java map generator (multi-language example)
├── FEATURES.md             # Detailed feature documentation
├── QUICKSTART.md           # Quick reference guide
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.7+ (for local server)
- Modern browser (Chrome, Firefox, Edge)
- **Internet access** (for Three.js CDN) or local Three.js file

### Local Setup

1. **Generate the map** (optional; a default map.json is included):
   ```powershell
   python .\tools\generate_map.py
   ```

2. **Start the local server**:
   ```powershell
   python .\tools\server.py 8000
   ```
   
   **Note:** If port 8000 is already in use, try:
   ```powershell
   python .\tools\server.py 8001
   ```

3. **Open in your browser**:
   ```
   http://localhost:8000  (or :8001 if 8000 is in use)
   ```

### Controls

| Key                | Action                          |
|--------------------|---------------------------------|
| **W / ↑**          | Move forward / Accelerate       |
| **A / ←**          | Turn left / Steer left          |
| **S / ↓**          | Move backward / Reverse         |
| **D / →**          | Turn right / Steer right        |
| **Shift**          | Brake (for vehicles)            |
| **Space**          | Jump (walking only)             |
| **Vehicle Menu**   | Select driving mode             |
| **Perspective**    | Switch camera mode              |
| **3D Mode**        | Toggle 3D renderer              |
| **Graphics**       | Quality setting (Low/Med/High)  |
| **Character**      | Choose color skin               |
| **Settings ⚙️**   | Open graphics/audio settings    |

## � Gameplay

### Objective
Survive as long as possible while avoiding the snake pursuer. Collect power-ups to gain temporary advantages. Drive different vehicles and master their unique physics.

### Game Mechanics

#### Movement & Vehicles
- **Walking**: Basic movement, can jump
- **Driving**: Use W/A/S/D for acceleration, steering, and braking
  - Each vehicle has unique max speed, acceleration, and steering response
  - Friction varies by vehicle type (bikes are twitchier, buses are heavier)
  - Steering angle is shown visually in the direction the vehicle faces
- **Planes**: Can gain/lose altitude with W/S keys while airborne

#### Snake Mechanic
- After 5-second head start, a red snake chases you at 1.5× your vehicle's max speed
- The snake's speed scales with your current vehicle
- Protect yourself with shield power-ups or switch to a slower vehicle to outmaneuver
- If caught without shield, game over

#### Power-Ups
- 🟠 **Speed Boost** (orange): 30% velocity multiplier for 12 seconds
- 🔵 **Shield** (cyan): Protect against snake collision for 15 seconds
- 🟢 **Health** (green): Restore health status

#### Score
- Increments by distance traveled (normalized by 10)
- Higher vehicle speeds = higher score per second

#### Character Selection
Each character has unique stats and personality:

| Character | Color | Title | Trait | Speed | Jump | Mass |
|-----------|-------|-------|-------|-------|------|------|
| **Soham** ⚡ | Blue | Athlete | Fast & agile, built for speed | +15% | +25% | -15% |
| **Shreyas** ⚖️ | Black | All-Rounder | Perfectly balanced | Normal | Normal | Normal |
| **Akshata** 🔥 | Red | Fierce & Feisty | Strong but rude | +5% | +10% | +5% |
| **Namal** 💝 | White | Sweet Guardian | Kind & defensive | -5% | -5% | +10% |
| **Mehwish** ✨ | Pink | Graceful Beauty | Most beautiful, graceful | +8% | +18% | -10% |

**Character Personalities:**
- **Soham**: Athletic and determined, excels at speed and agility
- **Shreyas**: Balanced adventurer, equally skilled at all things
- **Akshata**: Strong-willed and bold; appears rude but has a caring heart
- **Namal**: Sweet, kind-hearted guardian; protective and caring to everyone
- **Mehwish**: Most beautiful and graceful; moves with elegant charm

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

### Browser Security & Firewall Issues

#### 🔴 Microsoft Edge (SmartScreen)
When running locally, Edge may block the page due to SmartScreen filter:

**Solution:**
1. Click **"Don't send"** or **"Provide feedback"** button
2. Click **"Show more"** → **"Allow"** to proceed
3. Alternatively, bypass by:
   - Opening **Settings** → **Privacy, search, and services**
   - Disable **Microsoft Defender SmartScreen** for local localhost connections
   - Or use **InPrivate mode** which may skip some checks

#### 🔵 Firefox
Firefox is generally more permissive. If you see warnings:

**Solution:**
1. **Firewall Access**: Windows Firewall may block Python server
   - Press `Win+R`, type `wf.msc` (Windows Defender Firewall with Advanced Security)
   - Click **Inbound Rules** → **New Rule...**
   - Select **Port** → **TCP** → **Specific local ports: 8000** (or 8001)
   - Click **Allow** → **Finish**
   
2. **Content Restrictions**: If localhost is blocked
   - Go to `about:config` in address bar
   - Search `dom.disable_beforeunload` and toggle if needed
   - Most localhost access is allowed by default in Firefox

#### 🌐 Chrome/Chromium
Generally permissive for localhost:

**If blocked (rare):**
1. Check Windows Firewall (see Firefox solution above)
2. Try incognito mode (`Ctrl+Shift+N`)
3. Clear cache: `Ctrl+Shift+Delete`

### Port Already in Use

**Error**: `OSError: [WinError 10048] Only one usage of each socket address...`

**Solution:**
```powershell
# Option 1: Use a different port
python .\tools\server.py 8001

# Option 2: Find and kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Option 3: Allow Python through Windows Firewall
# (See browser security section above)
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Game won't load | Check Python server is running; use exact URL `http://localhost:8000` (or :8001); disable SmartScreen in Edge |
| "Localhost refused to connect" | Port in use; try `python .\tools\server.py 8001` |
| Sounds not working | Browser may block audio; check dev console (F12) for Web Audio errors; click page to activate audio context |
| 3D mode crashes | Update browser to latest version; disable high graphics if low-end device; check console for Three.js errors |
| Snake not appearing | Wait 5 seconds for head start to expire; check snake spawn at 600px away |
| Movement feels sluggish | Try switching to low graphics or 2D mode; check FPS counter (top-left) |
| Vehicle not changing | Ensure JavaScript console shows no errors; refresh page after vehicle select |
| Settings panel won't close | Click "Close" button or click ⚙️ again to toggle |

### Debugging

Open **Developer Console** in your browser:
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
- **Firefox**: Press `F12` or `Ctrl+Shift+K`
- **Safari**: Enable in Preferences → Advanced → Show Develop menu

**Look for**:
- `[GAME]` prefixed logs (game initialization, vehicle changes, physics updates)
- `[GAME ERROR]` for runtime issues
- `Uncaught` errors in red text (JavaScript failures)
- Network errors in **Network** tab (if Three.js CDN fails)

**Example Good Console Output**:
```
[GAME] Game initialization started
[GAME] Canvas and context ready; DPR= 1.5
[GAME] All game globals exposed to window scope
[GAME] Game initialization started
[GAME] Initial vehicle initialized
```

**If you see errors**, please note them and:
1. Ensure all files are in `game/` folder
2. Check that `map.json` exists
3. Verify Three.js CDN is accessible (check Network tab)
4. Try different browser or port

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
