// Simple top-down roaming demo with multiple perspectives, infinite procedural map outside initial map,
// and a pursuing snake that chases the player after a 5s head start.
const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
let DPR = window.devicePixelRatio || 1;
function resize(){
  canvas.width = Math.floor(innerWidth * DPR);
  canvas.height = Math.floor(innerHeight * DPR);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
}
addEventListener('resize', resize);
resize();

// camera / player
const player = {x:0,y:0,z:0,size:10, speed:200, color:'yellow'};
const cam = {x:0,y:0,scale:1};
let perspective = 'top'; // 'top' | 'follow' | 'overview'

// Graphics settings (defaults)
window.graphicsSettings = {
  shadowQuality: 'medium', // off|low|medium|high
  particleQuality: 'medium', // off|low|medium|high
  fogDensity: 0.15,
  bloom: false,
  uiTheme: 'dark'
};

// Physics: gravity, velocity, jumping, collision
const physics = {
  gravity: 800, // acceleration downward (px/s^2)
  jumpForce: 400, // initial upward velocity on jump (px/s)
  maxFallSpeed: 600, // terminal velocity
  friction: 0.92, // horizontal velocity damping
  isGrounded: false,
  velocityY: 0,
  velocityX: 0,
  velocityZ: 0, // forward/back
};

// Particles: dust trails and visual effects
const particles = [];
function addParticle(x, y, vx, vy, life, color) {
  particles.push({x, y, vx, vy, life, maxLife: life, color});
}

function updateParticles(dt) {
  for(let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 200 * dt; // gravity on particles
    p.life -= dt;
    if(p.life <= 0) particles.splice(i, 1);
  }
}

// Power-ups system
const powerups = [];
const activePowerups = {speedBoost: 0, shield: 0, health: 100};
const maxPowerups = 8;

function spawnPowerup() {
  if(powerups.length >= maxPowerups) return;
  // random location ~300-800 units from player
  const angle = Math.random() * Math.PI * 2;
  const dist = 300 + Math.random() * 500;
  const x = player.x + Math.cos(angle) * dist;
  const y = player.y + Math.sin(angle) * dist;
  const types = ['speed', 'shield', 'health'];
  const type = types[Math.floor(Math.random() * types.length)];
  powerups.push({x, y, type, lifetime: 30, size: 8});
}

function updatePowerups(dt) {
  activePowerups.speedBoost = Math.max(0, activePowerups.speedBoost - dt);
  activePowerups.shield = Math.max(0, activePowerups.shield - dt);
  
  for(let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.lifetime -= dt;
    
    // check collision with player
    const dist = Math.hypot(p.x - player.x, p.y - player.y);
    if(dist < player.size + p.size) {
      if(p.type === 'speed') {
        activePowerups.speedBoost = 12;
        player.speed = 250;
      } else if(p.type === 'shield') {
        activePowerups.shield = 15;
      } else if(p.type === 'health') {
        activePowerups.health = 100;
      }
      Audio.playPickup();
      // emit pickup particles
      for(let j = 0; j < 8; j++) {
        const angle = (j / 8) * Math.PI * 2;
        addParticle(p.x, p.y, Math.cos(angle) * 200, Math.sin(angle) * 200, 0.5, p.type === 'speed' ? '#ffaa00' : p.type === 'shield' ? '#00aaff' : '#00ff00');
      }
      powerups.splice(i, 1);
    } else if(p.lifetime <= 0) {
      powerups.splice(i, 1);
    }
  }
  
  // periodically spawn powerups
  if(Math.random() < 0.0001 * dt) spawnPowerup();
}

// Biome system: determine tile color/type based on noise
function getBiomeColor(tx, ty) {
  const v = coordNoise(tx, ty, 2);
  if(v < 0.33) return {color: '#3a7d3a', name: 'grass'};
  if(v < 0.66) return {color: '#d4a574', name: 'sand'};
  return {color: '#e0e0ff', name: 'snow'};
}

// Running animation
player.animationPhase = 0;
function updateAnimation(dt) {
  const speed = Math.hypot(physics.velocityX, physics.velocityZ);
  if(speed > 10) {
    player.animationPhase += speed * 0.01; // sync to velocity
  } else {
    player.animationPhase *= 0.9; // slow down animation
  }
}

let score = 0; // distance travelled
let distanceTravelledSince = {x: player.x, y: player.y}; // track for score

function isWalkableAt(tx, ty){
  const tile = getTileAt(tx, ty);
  return tile === 0; // only grass is walkable
}

function checkCollision(x, y, radius){
  // check if the circle at (x,y) with radius overlaps any unwalkable tile
  const ts = (map && map.tileSize) ? map.tileSize : 16;
  const checks = [
    {dx: 0, dy: 0}, {dx: radius, dy: 0}, {dx: -radius, dy: 0},
    {dx: 0, dy: radius}, {dx: 0, dy: -radius},
    {dx: radius*0.7, dy: radius*0.7}, {dx: -radius*0.7, dy: -radius*0.7}
  ];
  for(const c of checks){
    const tx = Math.floor((x+c.dx) / ts);
    const ty = Math.floor((y+c.dy) / ts);
    if(!isWalkableAt(tx, ty)) return true; // collision
  }
  return false;
}

let keys = {};
addEventListener('keydown', e=>{
  keys[e.key]=true;
  // jump on space
  if(e.key === ' ' && physics.isGrounded){
    physics.velocityY = -physics.jumpForce;
    physics.isGrounded = false;
  }
});
addEventListener('keyup', e=>keys[e.key]=false);

// map (may be loaded from map.json). Outside its bounds we use procedural generation for an "endless" world.
let map = null;
function loadMap(){
  fetch('map.json').then(r=>r.json()).then(m=>{map=m; // center player on loaded map
    player.x = Math.floor(m.width/2) * m.tileSize + m.tileSize/2;
    player.y = Math.floor(m.height/2) * m.tileSize + m.tileSize/2;
    requestAnimationFrame(loop);
  }).catch(e=>{
    // no static map; start with player at origin
    map = null;
    requestAnimationFrame(loop);
  });
}

// Simple deterministic pseudo-random based on tile coordinates
function coordNoise(x,y,seed=1337){
  // 32-bit integer hash
  let n = x*374761393 + y*668265263 + seed;
  n = (n ^ (n >>> 13)) * 1274126177;
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 4294967295;
}

function getTileAt(tx, ty){
  // if map exists and coordinates inside, use it
  if(map && tx >= 0 && ty >= 0 && tx < map.width && ty < map.height){
    return map.tiles[ty][tx];
  }
  // procedural fallback: water ~8%, trees ~12%, else grass
  const v = coordNoise(tx, ty);
  if(v < 0.08) return 1; // water
  if(v < 0.12) return 2; // tree
  return 0; // grass
}

// UI bindings
const perspectiveSelect = document.getElementById('perspective');
// multiplayer removed: no websocket, no connect controls
perspectiveSelect.addEventListener('change', e=>{ perspective = e.target.value; updateCameraForPerspective(); });

function updateCameraForPerspective(){
  if(perspective === 'top') cam.scale = 1;
  else if(perspective === 'follow') cam.scale = 1.7;
  else if(perspective === 'overview') cam.scale = 0.6;
}
updateCameraForPerspective();

function worldToScreen(wx,wy){
  const sx = (wx - cam.x) * cam.scale + canvas.width/2;
  const sy = (wy - cam.y) * cam.scale + canvas.height/2;
  return {x:sx,y:sy};
}

// --- Snake (pursuer) ---
const snake = {x:0,y:0, size:12, speed: player.speed * 1.5, active:false};
let headstart = 5.0; // seconds of head start for player
let snakeSpawned = false;

// spawn the snake at an offset from player (far away)
function spawnSnake(){
  snakeSpawned = true;
  // spawn approximately 600 units away in a random direction
  const angle = (Math.random() * Math.PI*2);
  snake.x = player.x + Math.cos(angle) * 600;
  snake.y = player.y + Math.sin(angle) * 600;
  snake.speed = player.speed * 1.5; // update speed relative to player
}

let last = performance.now();
function loop(t){
  const dt = (t-last)/1000; last=t;
  
  // Apply gravity and update vertical velocity
  physics.velocityY += physics.gravity * dt;
  if(physics.velocityY > physics.maxFallSpeed) physics.velocityY = physics.maxFallSpeed;
  
  // Update player vertical position
  player.z += physics.velocityY * dt;
  if(player.z < 0){
    player.z = 0;
    physics.velocityY = 0;
    physics.isGrounded = true;
    // emit landing particles
    for(let i = 0; i < 5; i++) {
      addParticle(player.x + (Math.random()-0.5)*20, player.y + (Math.random()-0.5)*20, 
                  (Math.random()-0.5)*100, -50, 0.3, '#999');
    }
  }
  
  // input
  let dx=0, dy=0;
  if(keys['w']||keys['ArrowUp']) dy -= 1;
  if(keys['s']||keys['ArrowDown']) dy += 1;
  if(keys['a']||keys['ArrowLeft']) dx -= 1;
  if(keys['d']||keys['ArrowRight']) dx += 1;
  if(dx||dy){
    const len = Math.hypot(dx,dy)||1;
    physics.velocityX = (dx/len) * player.speed;
    physics.velocityZ = (dy/len) * player.speed;
  } else {
    physics.velocityX *= physics.friction;
    physics.velocityZ *= physics.friction;
  }
  
  // apply speed boost if active
  if(activePowerups.speedBoost > 0) {
    physics.velocityX *= 1.3;
    physics.velocityZ *= 1.3;
  }
  
  // Update player position with collision
  let nextX = player.x + physics.velocityX * dt;
  let nextY = player.y + physics.velocityZ * dt;
  
  // simple collision: don't move if colliding
  if(!checkCollision(nextX, nextY, player.size)){
    player.x = nextX;
    player.y = nextY;
    // emit walking dust particles
    // particle emission depends on particle quality
    const pq = window.graphicsSettings && window.graphicsSettings.particleQuality ? window.graphicsSettings.particleQuality : 'medium';
    const particleMultiplier = (pq === 'off') ? 0 : (pq === 'low') ? 0.35 : (pq === 'high') ? 1.25 : 1.0;
    if(Math.random() < 0.3 * particleMultiplier) {
      addParticle(player.x + (Math.random()-0.5)*15, player.y + (Math.random()-0.5)*15, 
                  (Math.random()-0.5)*50, -20, 0.4, 'rgba(200,200,200,0.5)');
      if(Math.random() < 0.5) Audio.playFootstep();
    }
  }
  
  // update score (distance travelled)
  const distMoved = Math.hypot(player.x - distanceTravelledSince.x, player.y - distanceTravelledSince.y);
  score += distMoved / 10; // normalize
  distanceTravelledSince.x = player.x;
  distanceTravelledSince.y = player.y;
  
  // update all systems
  updateParticles(dt);
  updatePowerups(dt);
  updateAnimation(dt);

  // headstart countdown
  if(!snake.active){
    headstart -= dt;
    if(headstart <= 0){
      snake.active = true;
      if(!snakeSpawned) spawnSnake();
    }
  }

  // snake AI - simple pursuit
  if(snake.active){
    // ensure snake speed follows player's speed changes
    snake.speed = player.speed * 1.5;
    const sx = player.x - snake.x;
    const sy = player.y - snake.y;
    const dist = Math.hypot(sx, sy) || 1;
    const nx = sx / dist;
    const ny = sy / dist;
    // move snake toward player
    snake.x += nx * snake.speed * dt;
    snake.y += ny * snake.speed * dt;
    // collision check
    if(dist < (player.size + snake.size) * 0.9 && activePowerups.shield <= 0){
      // caught - simple response: stop the game and show message
      // freeze movement
      player.speed = 0;
      snake.speed = 0;
      Audio.playDanger();
      // show text for a moment by setting headstart negative large
      headstart = -999;
    } else if(dist < (player.size + snake.size) * 0.9 && activePowerups.shield > 0) {
      // shield active - bounce snake away
      snake.x -= nx * 200 * dt;
      snake.y -= ny * 200 * dt;
      activePowerups.shield -= dt;
    }
  }
  
  // emit snake danger particles when close
  if(snake.active && Math.hypot(player.x - snake.x, player.y - snake.y) < 200) {
    if(Math.random() < 0.1) {
      addParticle(snake.x + (Math.random()-0.5)*20, snake.y + (Math.random()-0.5)*20,
                  (Math.random()-0.5)*100, (Math.random()-0.5)*100, 0.3, 'rgba(255,100,100,0.6)');
    }
  }

  // different behavior per perspective
  if(perspective === 'top'){
    cam.x += (player.x - cam.x) * 5 * dt;
    cam.y += (player.y - cam.y) * 5 * dt;
  } else if(perspective === 'follow'){
    cam.x += (player.x - cam.x) * 10 * dt;
    cam.y += (player.y - cam.y) * 10 * dt;
  } else if(perspective === 'overview'){
    cam.x += (player.x - cam.x) * 2 * dt;
    cam.y += (player.y - cam.y) * 2 * dt;
  }

  // multiplayer removed — no network updates

  draw();
  // FPS counting (update every 500ms)
  frames++;
  const nowF = performance.now();
  if(nowF - fpsLast >= 500){
    fps = Math.round((frames) * 1000 / (nowF - fpsLast));
    fpsLast = nowF;
    frames = 0;
    if(fpsEl) fpsEl.textContent = 'FPS: ' + fps;
  }
  requestAnimationFrame(loop);
}

function draw(){
  ctx.save();
  ctx.scale(DPR, DPR);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Simple 2D lighting: darken scene and punch a soft circular light around player
  const lightRadius = Math.max(80, 120 * cam.scale);
  const pScreen = worldToScreen(player.x, player.y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  const grad = ctx.createRadialGradient(pScreen.x, pScreen.y, lightRadius*0.2, pScreen.x, pScreen.y, lightRadius);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(pScreen.x, pScreen.y, lightRadius, 0, Math.PI*2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  const ts = (map && map.tileSize) ? map.tileSize : 16;
  // compute visible tile range (in tile coordinates)
  const halfW = (innerWidth/2)/cam.scale;
  const halfH = (innerHeight/2)/cam.scale;
  const minX = Math.floor((cam.x-halfW)/ts)-2;
  const maxX = Math.ceil((cam.x+halfW)/ts)+2;
  const minY = Math.floor((cam.y-halfH)/ts)-2;
  const maxY = Math.ceil((cam.y+halfH)/ts)+2;

  for(let ty=minY; ty<=maxY; ty++){
    for(let tx=minX; tx<=maxX; tx++){
      const tile = getTileAt(tx, ty);
      const biome = getBiomeColor(tx, ty);
      const wx = tx*ts + ts/2;
      const wy = ty*ts + ts/2;
      const s = worldToScreen(wx,wy);
      const size = ts*cam.scale;
      
      if(tile===0) ctx.fillStyle = biome.color; // biome-colored grass
      else if(tile===1) ctx.fillStyle = '#1767a0'; // water
      else if(tile===2) ctx.fillStyle = '#2b2b17'; // tree (darker)
      else ctx.fillStyle = '#666';
      ctx.fillRect(s.x - size/2, s.y - size/2, size, size);
      if(tile===2){
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(s.x, s.y-3, Math.max(2, size*0.15), 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  // draw powerups
  for(const p of powerups) {
    const ps = worldToScreen(p.x, p.y);
    const alpha = Math.min(1, p.lifetime);
    if(p.type === 'speed') ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
    else if(p.type === 'shield') ctx.fillStyle = `rgba(0, 150, 255, ${alpha})`;
    else ctx.fillStyle = `rgba(0, 255, 100, ${alpha})`;
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, p.size * cam.scale * 2, 0, Math.PI*2);
    ctx.fill();
    // glow effect
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, p.size * cam.scale * 3, 0, Math.PI*2);
    ctx.stroke();
  }

  // draw particles
  for(const p of particles) {
    const ps = worldToScreen(p.x, p.y);
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = typeof p.color === 'string' && p.color.includes('rgba') 
      ? p.color.replace(/[\d.]+\)/, alpha + ')')
      : p.color;
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, Math.max(1, 3 * alpha), 0, Math.PI*2);
    ctx.fill();
  }

  // Fog overlay (2D): subtle colored overlay based on fogDensity setting
  const fogDensity = (window.graphicsSettings && typeof window.graphicsSettings.fogDensity === 'number') ? window.graphicsSettings.fogDensity : 0.15;
  if(fogDensity > 0.01){
    ctx.fillStyle = 'rgba(135,206,235,' + Math.min(0.6, fogDensity * 0.6) + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // draw player
  const p = worldToScreen(player.x, player.y);
  const playerColors = {yellow: '#ffde59', blue: '#4d9de0', green: '#52b788'};
  ctx.fillStyle = playerColors[player.color] || '#ffde59';
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(4, player.size*cam.scale), 0, Math.PI*2);
  ctx.fill();
  
  // running animation indicator (leaning)
  const leanAngle = Math.sin(player.animationPhase * Math.PI * 2) * 0.2;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(leanAngle);
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(4, player.size*cam.scale), 0, Math.PI*2);
  ctx.stroke();
  ctx.restore();

  // draw snake
  if(snakeSpawned){
    const sp = worldToScreen(snake.x, snake.y);
    ctx.fillStyle = '#ff4d4d';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, Math.max(6, snake.size*cam.scale), 0, Math.PI*2);
    ctx.fill();
    // simple body - draw a tail towards player slightly
    ctx.strokeStyle = 'rgba(255,77,77,0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y);
    const mid = worldToScreen((snake.x+player.x)/2, (snake.y+player.y)/2);
    ctx.lineTo(mid.x, mid.y);
    ctx.stroke();
  }

  // multiplayer removed — no other players to render

  // HUD: headstart countdown
  ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
  if(!snake.active && headstart > 0){
    ctx.fillText('Head start: ' + Math.ceil(headstart) + 's', 12, 30);
  } else if(!snake.active && headstart <= 0){
    ctx.fillText('Snake is about to start...', 12, 30);
  } else {
    ctx.fillText('Snake active!', 12, 30);
  }

  // if player caught
  if(headstart < -10){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(canvas.width/2 - 160, canvas.height/2 - 40, 320, 80);
    ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif';
    ctx.fillText('You were caught by the snake!', canvas.width/2 - 150, canvas.height/2);
  }

  // HUD: score and status
  ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 12, canvas.height - 20);
  ctx.fillText('Height: ' + Math.floor(player.z), 12, canvas.height - 40);
  
  // HUD: active powerups
  if(activePowerups.speedBoost > 0) {
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('SPEED BOOST! ' + Math.ceil(activePowerups.speedBoost) + 's', 12, canvas.height - 60);
  }
  if(activePowerups.shield > 0) {
    ctx.fillStyle = '#00aaff';
    ctx.fillText('SHIELD! ' + Math.ceil(activePowerups.shield) + 's', 12, canvas.height - 80);
  }

  ctx.restore();
}

loadMap();

// 3D mode support: expose some globals for the 3D renderer and add a toggle
let is3D = false;
const threeToggle = document.getElementById('mode3d');
const graphicsSelect = document.getElementById('graphics');
const characterSelect = document.getElementById('character');
if(threeToggle) threeToggle.addEventListener('change', ()=>{
  is3D = threeToggle.checked;
  window.is3D = is3D;
  const sceneDiv = document.getElementById('scene3d');
  if(sceneDiv) sceneDiv.style.display = is3D ? 'block' : 'none';
  if(is3D && window.start3D) window.start3D();
  if(!is3D && window.stop3D) window.stop3D();
});
if(graphicsSelect) graphicsSelect.addEventListener('change', ()=>{ if(window.setGraphics) window.setGraphics(graphicsSelect.value); });
if(characterSelect) characterSelect.addEventListener('change', ()=>{ player.color = characterSelect.value; window.playerColor = player.color; });

// Settings panel bindings
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const settingsClose = document.getElementById('settingsClose');
const shadowSelect = document.getElementById('shadowQuality');
const particleSelect = document.getElementById('particleQuality');
const fogRange = document.getElementById('fogDensity');
const fogValue = document.getElementById('fogValue');
const bloomToggle = document.getElementById('bloomToggle');
const uiTheme = document.getElementById('uiTheme');

function applyGraphicsSettings(){
  const s = window.graphicsSettings;
  // DPR / renderer hint
  if(s.shadowQuality === 'off') window.setGraphics && window.setGraphics('low');
  else if(s.shadowQuality === 'low') window.setGraphics && window.setGraphics('medium');
  else if(s.shadowQuality === 'medium') window.setGraphics && window.setGraphics('medium');
  else window.setGraphics && window.setGraphics('high');

  // Update DOM theme
  if(s.uiTheme === 'light') document.body.classList.add('theme-light'); else document.body.classList.remove('theme-light');

  // fog value shown
  if(fogValue) fogValue.textContent = s.fogDensity.toFixed(2);

  // expose settings to 3D renderer
  window.graphicsSettings = Object.assign(window.graphicsSettings || {}, s);
}

if(settingsToggle) settingsToggle.addEventListener('click', ()=>{ if(settingsPanel) settingsPanel.classList.toggle('hidden'); });
if(settingsClose) settingsClose.addEventListener('click', ()=>{ if(settingsPanel) settingsPanel.classList.add('hidden'); });
if(shadowSelect) shadowSelect.addEventListener('change', (e)=>{ window.graphicsSettings.shadowQuality = e.target.value; applyGraphicsSettings(); });
if(particleSelect) particleSelect.addEventListener('change', (e)=>{ window.graphicsSettings.particleQuality = e.target.value; applyGraphicsSettings(); });
if(fogRange) fogRange.addEventListener('input', (e)=>{ window.graphicsSettings.fogDensity = parseFloat(e.target.value); applyGraphicsSettings(); });
if(bloomToggle) bloomToggle.addEventListener('change', (e)=>{ window.graphicsSettings.bloom = !!e.target.checked; applyGraphicsSettings(); });
if(uiTheme) uiTheme.addEventListener('change', (e)=>{ window.graphicsSettings.uiTheme = e.target.value; applyGraphicsSettings(); });

// initialize settings UI values
if(shadowSelect) shadowSelect.value = window.graphicsSettings.shadowQuality;
if(particleSelect) particleSelect.value = window.graphicsSettings.particleQuality;
if(fogRange) fogRange.value = window.graphicsSettings.fogDensity;
if(bloomToggle) bloomToggle.checked = !!window.graphicsSettings.bloom;
if(uiTheme) uiTheme.value = window.graphicsSettings.uiTheme;
applyGraphicsSettings();

// Preset application
function applyPreset(name){
  if(!window.graphicsSettings) window.graphicsSettings = {};
  if(name === 'low'){
    window.graphicsSettings.shadowQuality = 'off';
    window.graphicsSettings.particleQuality = 'low';
    window.graphicsSettings.fogDensity = 0.05;
    window.graphicsSettings.bloom = false;
    window.graphicsSettings.uiTheme = 'dark';
  } else if(name === 'high'){
    window.graphicsSettings.shadowQuality = 'high';
    window.graphicsSettings.particleQuality = 'high';
    window.graphicsSettings.fogDensity = 0.25;
    window.graphicsSettings.bloom = true;
    window.graphicsSettings.uiTheme = 'dark';
  } else { // medium
    window.graphicsSettings.shadowQuality = 'medium';
    window.graphicsSettings.particleQuality = 'medium';
    window.graphicsSettings.fogDensity = 0.15;
    window.graphicsSettings.bloom = false;
    window.graphicsSettings.uiTheme = 'dark';
  }
  // update UI controls
  if(shadowSelect) shadowSelect.value = window.graphicsSettings.shadowQuality;
  if(particleSelect) particleSelect.value = window.graphicsSettings.particleQuality;
  if(fogRange) fogRange.value = window.graphicsSettings.fogDensity;
  if(bloomToggle) bloomToggle.checked = !!window.graphicsSettings.bloom;
  if(uiTheme) uiTheme.value = window.graphicsSettings.uiTheme;
  applyGraphicsSettings();
  // let 3D renderer pick up changes
  if(window.apply3DGraphicsSettings) window.apply3DGraphicsSettings();
}

// Preset buttons binding
const presetLow = document.getElementById('presetLow');
const presetMed = document.getElementById('presetMed');
const presetHigh = document.getElementById('presetHigh');
if(presetLow) presetLow.addEventListener('click', ()=> applyPreset('low'));
if(presetMed) presetMed.addEventListener('click', ()=> applyPreset('medium'));
if(presetHigh) presetHigh.addEventListener('click', ()=> applyPreset('high'));

// FPS counter
let fps = 0, frames = 0, fpsLast = performance.now();
const fpsEl = document.getElementById('fpsCounter');

// expose useful items for the 3D renderer
window.player = player;
window.getTileAt = getTileAt;
window.mapData = map;
window.cam = cam;
window.powerups = powerups;
window.particles = particles;
window.activePowerups = activePowerups;
window.setGraphics = (q)=>{ // default hook
  if(q === 'low') DPR = 1; else if(q === 'medium') DPR = window.devicePixelRatio || 1; else DPR = Math.min(2, window.devicePixelRatio || 1.5);
};
window.playerColor = player.color || 'yellow';
// expose snake and headstart for the 3D renderer / debugging
window.snake = snake;
window.headstart = headstart;

// ensure draw skips when 3D is active
const _origDraw = draw;
function draw(){
  if(window.is3D) return; // 2D renderer paused when in 3D mode
  _origDraw();
}
