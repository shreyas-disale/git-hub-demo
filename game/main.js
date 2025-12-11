      // Simple top-down roaming demo with multiple perspectives, infinite procedural map outside initial map,
// and a pursuing snake that chases the player after a 5s head start.
// ENHANCED WITH: Vehicle system, advanced physics, debugging, and Indian street features

// Debugging and error logging
const DEBUG = true;
function log(...args) { if(DEBUG) console.log('[GAME]', ...args); }
function error(...args) { console.error('[GAME ERROR]', ...args); }
log('Game initialization started');

const canvas = document.getElementById('world');
if(!canvas) { error('Canvas element not found'); throw new Error('Canvas missing'); }
const ctx = canvas.getContext('2d');
if(!ctx) { error('Canvas 2D context not available'); throw new Error('2D context failed'); }
let DPR = window.devicePixelRatio || 1;
log('Canvas and context ready; DPR=', DPR);
function resize(){
  canvas.width = Math.floor(innerWidth * DPR);
  canvas.height = Math.floor(innerHeight * DPR);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
}
addEventListener('resize', resize);
resize();

// camera / player
const player = {x:0,y:0,z:0,size:10, speed:200, color:'yellow', character: 'soham'};
const cam = {x:0,y:0,scale:1};
let perspective = 'top'; // 'top' | 'follow' | 'overview'

// ========== CHARACTER SYSTEM ==========
// Character profiles with names, colors, personality, and stat modifiers
const characters = {
  'soham': {
    name: 'Soham',
    title: 'Athlete',
    description: 'Fast, agile, and athletic. Excels at speed and jumping.',
    color: '#4d9de0', // Blue
    icon: '⚡',
    statMods: {
      speedMultiplier: 1.15,      // 15% faster base speed
      accelerationMult: 1.2,       // 20% better acceleration
      jumpForce: 1.25,             // 25% higher jump
      frictionMult: 0.95,          // Less friction (more agile)
      massMultiplier: 0.85         // Lighter, more responsive
    },
    personality: 'Athletic and determined, Soham is built for speed and agility.'
  },
  'shreyas': {
    name: 'Shreyas',
    title: 'All-Rounder',
    description: 'Perfectly balanced in all aspects. Master of all trades.',
    color: '#000000', // Black
    icon: '⚖️',
    statMods: {
      speedMultiplier: 1.0,        // Normal speed
      accelerationMult: 1.0,       // Normal acceleration
      jumpForce: 1.0,              // Normal jump
      frictionMult: 1.0,           // Normal friction
      massMultiplier: 1.0          // Normal mass
    },
    personality: 'Shreyas is the balanced adventurer, equally skilled at all things.'
  },
  'akshata': {
    name: 'Akshata',
    title: 'Fierce & Feisty',
    description: 'Strong and confident. Rude on the outside, but has a good heart.',
    color: '#ff1744', // Red
    icon: '🔥',
    statMods: {
      speedMultiplier: 1.05,       // 5% faster
      accelerationMult: 1.15,      // 15% better acceleration
      jumpForce: 1.1,              // 10% higher jump
      frictionMult: 0.98,          // Slightly less friction
      massMultiplier: 1.05         // Slightly heavier, more stable
    },
    personality: 'Akshata is strong-willed and bold. She appears rude but has a caring heart beneath.'
  },
  'namal': {
    name: 'Namal',
    title: 'Sweet Guardian',
    description: 'Kind and sweet. Excellent defense and protection.',
    color: '#ffffff', // White
    icon: '💝',
    statMods: {
      speedMultiplier: 0.95,       // 5% slower
      accelerationMult: 0.95,      // 5% slower acceleration
      jumpForce: 0.95,             // 5% lower jump
      frictionMult: 1.05,          // More friction (stability)
      massMultiplier: 1.1          // Heavier, more defensive
    },
    personality: 'Namal is the sweet, kind-hearted guardian. Protective and caring to everyone.'
  },
  'mehwish': {
    name: 'Mehwish',
    title: 'Graceful Beauty',
    description: 'Beautiful and graceful. Moves with elegance and charm.',
    color: '#ff69b4', // Pink
    icon: '✨',
    statMods: {
      speedMultiplier: 1.08,       // 8% faster
      accelerationMult: 1.12,      // 12% better acceleration
      jumpForce: 1.18,             // 18% higher jump
      frictionMult: 0.92,          // Less friction (smooth movement)
      massMultiplier: 0.9          // Lightest character, most graceful
    },
    personality: 'Mehwish is the most beautiful and graceful of all. She moves with elegant charm.'
  }
};

let currentCharacter = characters['soham'];

function switchCharacter(charName) {
  if(!characters[charName]) {
    error('Unknown character:', charName);
    return;
  }
  currentCharacter = characters[charName];
  player.character = charName;
  player.color = currentCharacter.color;
  
  // Apply character stat modifiers to player and physics
  const baseSpeed = 200;
  const baseJump = 400;
  player.speed = baseSpeed * currentCharacter.statMods.speedMultiplier;
  physics.jumpForce = baseJump * currentCharacter.statMods.jumpForce;
  physics.gravity = 800 * (1 / currentCharacter.statMods.massMultiplier); // heavier = higher effective gravity
  
  log('Character switched to:', charName, '(' + currentCharacter.name + ')');
  log('  Speed:', player.speed.toFixed(1), 'px/s');
  log('  Jump Force:', physics.jumpForce.toFixed(1));
  log('  Description:', currentCharacter.personality);
  
  // Update UI if character selector exists
  const charSelect = document.getElementById('character');
  if(charSelect) charSelect.value = charName;
  
  // Update character info in settings panel
  updateCharacterInfoDisplay();
}

// ========== END CHARACTER SYSTEM ==========

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

// ========== VEHICLE SYSTEM ==========
// Vehicle definitions with physics properties
const vehicleTypes = {
  'walking': {
    name: 'Walking',
    maxSpeed: 200,
    acceleration: 600,
    friction: 0.92,
    mass: 1,
    width: 10,
    height: 10,
    color: '#ffde59',
    icon: '🚶'
  },
  'scooter': {
    name: 'Scooter',
    maxSpeed: 180,
    acceleration: 400,
    friction: 0.88,
    mass: 50,
    width: 16,
    height: 12,
    color: '#ff9500',
    icon: '🛴',
    wheelSize: 4
  },
  'bike': {
    name: 'Motorcycle',
    maxSpeed: 280,
    acceleration: 700,
    friction: 0.85,
    mass: 150,
    width: 14,
    height: 20,
    color: '#ff1744',
    icon: '🏍️',
    wheelSize: 5
  },
  'car': {
    name: 'Car',
    maxSpeed: 250,
    acceleration: 500,
    friction: 0.90,
    mass: 1200,
    width: 24,
    height: 32,
    color: '#4d9de0',
    icon: '🚗',
    wheelSize: 6
  },
  'autorickshaw': {
    name: 'Auto-Rickshaw (3-wheeler)',
    maxSpeed: 160,
    acceleration: 350,
    friction: 0.89,
    mass: 400,
    width: 20,
    height: 24,
    color: '#ffab00',
    icon: '🛺',
    wheelSize: 5
  },
  'bus': {
    name: 'Bus',
    maxSpeed: 140,
    acceleration: 250,
    friction: 0.92,
    mass: 5000,
    width: 40,
    height: 60,
    color: '#ff5722',
    icon: '🚌',
    wheelSize: 7
  },
  'plane': {
    name: 'Plane (Airborne)',
    maxSpeed: 400,
    acceleration: 900,
    friction: 0.80,
    mass: 50000,
    width: 50,
    height: 40,
    color: '#2196f3',
    icon: '✈️',
    wheelSize: 0,
    isAirborne: true
  }
};

let currentVehicleType = 'walking';
let vehicle = null;

function initializeVehicle(type) {
  const vehicleClass = vehicleTypes[type] || vehicleTypes['walking'];
  currentVehicleType = type;
  vehicle = {
    type: type,
    ...vehicleClass,
    velocityX: 0,
    velocityZ: 0,
    velocityY: 0,
    acceleration: 0, // current acceleration
    steering: 0, // steering angle
    enginePower: 0, // current engine force
    braking: 0, // current braking force
    animationPhase: 0
  };
  log('Vehicle initialized:', type, vehicle.name);
  return vehicle;
}

function switchVehicle(newType) {
  if(!vehicleTypes[newType]) {
    error('Unknown vehicle type:', newType);
    return;
  }
  // Keep position and some momentum
  const oldVel = vehicle ? {x: vehicle.velocityX, z: vehicle.velocityZ} : {x: 0, z: 0};
  initializeVehicle(newType);
  vehicle.velocityX = oldVel.x * 0.5; // reduce momentum on switch
  vehicle.velocityZ = oldVel.z * 0.5;
  log('Switched to vehicle:', newType);
}

function updateVehiclePhysics(dt) {
  if(!vehicle) initializeVehicle('walking');
  
  const v = vehicle;
  const input = {forward: 0, backward: 0, left: 0, right: 0, brake: 0};
  
  // Read input
  if(keys['w'] || keys['ArrowUp']) input.forward = 1;
  if(keys['s'] || keys['ArrowDown']) input.backward = 1;
  if(keys['a'] || keys['ArrowLeft']) input.left = 1;
  if(keys['d'] || keys['ArrowRight']) input.right = 1;
  if(keys['Shift']) input.brake = 1;
  
  // Engine power calculation
  const targetAccel = (input.forward - input.backward) * v.acceleration;
  v.enginePower += (targetAccel - v.enginePower) * Math.min(1, dt * 3);
  
  // Braking reduces velocity
  if(input.brake) {
    v.velocityX *= Math.pow(0.85, dt);
    v.velocityZ *= Math.pow(0.85, dt);
  }
  
  // Steering (for vehicles, not walking)
  if(v.type !== 'walking') {
    const steeringSpeed = (v.type === 'plane') ? 0.05 : 0.08;
    v.steering += (input.left - input.right) * steeringSpeed;
    v.steering = Math.max(-0.4, Math.min(0.4, v.steering)); // clamp steering
  }
  
  // Apply force based on engine power and current velocity
  const currentSpeed = Math.hypot(v.velocityX, v.velocityZ);
  const speedFactor = Math.max(0, 1 - currentSpeed / v.maxSpeed);
  
  const forceX = Math.sin(v.steering) * v.enginePower * speedFactor * dt;
  const forceZ = Math.cos(v.steering) * v.enginePower * speedFactor * dt;
  
  v.velocityX += forceX;
  v.velocityZ += forceZ;
  
  // Speed limit
  const speed = Math.hypot(v.velocityX, v.velocityZ);
  if(speed > v.maxSpeed) {
    const ratio = v.maxSpeed / speed;
    v.velocityX *= ratio;
    v.velocityZ *= ratio;
  }
  
  // Apply friction (air/ground)
  const frictionFactor = Math.pow(v.friction, dt);
  v.velocityX *= frictionFactor;
  v.velocityZ *= frictionFactor;
  
  // Gravity for non-airborne vehicles (simplified)
  if(!v.isAirborne && v.type !== 'plane') {
    v.velocityY += physics.gravity * dt;
    if(v.velocityY > physics.maxFallSpeed) v.velocityY = physics.maxFallSpeed;
  } else if(v.isAirborne || v.type === 'plane') {
    // Planes can gain/lose altitude
    if(keys['w'] || keys['ArrowUp']) v.velocityY = -200; // climb
    if(keys['s'] || keys['ArrowDown']) v.velocityY = 200;  // descend
    v.velocityY *= 0.98; // drag
  }
  
  // Animation phase (wheels/propeller spinning)
  const wheelRotSpeed = speed / 50;
  v.animationPhase += wheelRotSpeed * dt;
}

// ========== END VEHICLE SYSTEM ==========

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
  
  // Apply gravity and update vertical velocity (for player, not vehicle when walking)
  if(!vehicle || vehicle.type === 'walking') {
    physics.velocityY += physics.gravity * dt;
    if(physics.velocityY > physics.maxFallSpeed) physics.velocityY = physics.maxFallSpeed;
  }
  
  // Update player vertical position
  player.z += (vehicle && vehicle.type !== 'walking') ? (vehicle.velocityY || 0) * dt : physics.velocityY * dt;
  if(player.z < 0){
    player.z = 0;
    if(!vehicle || vehicle.type === 'walking') {
      physics.velocityY = 0;
      physics.isGrounded = true;
    }
    // emit landing particles
    for(let i = 0; i < 5; i++) {
      addParticle(player.x + (Math.random()-0.5)*20, player.y + (Math.random()-0.5)*20, 
                  (Math.random()-0.5)*100, -50, 0.3, '#999');
    }
  }
  
  // Update vehicle physics (or walking)
  updateVehiclePhysics(dt);
  
  // Move player based on vehicle or walking velocity
  let nextX = player.x + (vehicle ? vehicle.velocityX : physics.velocityX) * dt;
  let nextY = player.y + (vehicle ? vehicle.velocityZ : physics.velocityZ) * dt;
  
  // simple collision: don't move if colliding
  if(!checkCollision(nextX, nextY, (vehicle ? vehicle.width : player.size)/2)){
    player.x = nextX;
    player.y = nextY;
    // emit driving/walking dust particles
    // particle emission depends on particle quality and vehicle speed
    const pq = window.graphicsSettings && window.graphicsSettings.particleQuality ? window.graphicsSettings.particleQuality : 'medium';
    const particleMultiplier = (pq === 'off') ? 0 : (pq === 'low') ? 0.35 : (pq === 'high') ? 1.25 : 1.0;
    const speed = vehicle ? Math.hypot(vehicle.velocityX, vehicle.velocityZ) : Math.hypot(physics.velocityX, physics.velocityZ);
    if(speed > 20 && Math.random() < 0.3 * particleMultiplier * (speed / 150)) {
      addParticle(player.x + (Math.random()-0.5)*15, player.y + (Math.random()-0.5)*15, 
                  (Math.random()-0.5)*50, -20, 0.4, 'rgba(200,200,200,0.5)');
      if(vehicle && vehicle.type === 'walking' && Math.random() < 0.5) Audio.playFootstep();
    }
  } else {
    // Collision: reduce velocity
    if(vehicle) {
      vehicle.velocityX *= 0.3;
      vehicle.velocityZ *= 0.3;
    } else {
      physics.velocityX *= 0.3;
      physics.velocityZ *= 0.3;
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
  
  // Update vehicle animation phase or player animation
  if(vehicle && vehicle.type !== 'walking') {
    // vehicle animation already updated in updateVehiclePhysics
  } else {
    updateAnimation(dt);
  }

  // headstart countdown
  if(!snake.active){
    headstart -= dt;
    if(headstart <= 0){
      snake.active = true;
      if(!snakeSpawned) spawnSnake();
    }
  }

  // snake AI - simple pursuit (targeting player)
  if(snake.active){
    // ensure snake speed follows player's vehicle speed changes
    const playerSpeed = vehicle ? vehicle.maxSpeed : player.speed;
    snake.speed = playerSpeed * 1.5;
    const sx = player.x - snake.x;
    const sy = player.y - snake.y;
    const dist = Math.hypot(sx, sy) || 1;
    const nx = sx / dist;
    const ny = sy / dist;
    // move snake toward player
    snake.x += nx * snake.speed * dt;
    snake.y += ny * snake.speed * dt;
    // collision check
    const collisionRadius = (vehicle ? vehicle.width : player.size) + snake.size;
    if(dist < collisionRadius * 0.9 && activePowerups.shield <= 0){
      // caught - simple response: stop the game and show message
      // freeze movement
      if(vehicle) {
        vehicle.velocityX = 0;
        vehicle.velocityZ = 0;
      } else {
        player.speed = 0;
      }
      snake.speed = 0;
      Audio.playDanger();
      // show text for a moment by setting headstart negative large
      headstart = -999;
    } else if(dist < collisionRadius * 0.9 && activePowerups.shield > 0) {
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
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.scale(DPR, DPR);

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

  // draw player / vehicle
  const p = worldToScreen(player.x, player.y);
  const playerColors = {yellow: '#ffde59', blue: '#4d9de0', green: '#52b788'};
  ctx.fillStyle = (vehicle && vehicle.color) ? vehicle.color : (playerColors[player.color] || '#ffde59');
  
  if(vehicle && vehicle.type !== 'walking') {
    // Draw vehicle as rectangle
    const w = vehicle.width * cam.scale;
    const h = vehicle.height * cam.scale;
    const rotation = Math.atan2(vehicle.velocityZ, vehicle.velocityX);
    
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(rotation);
    ctx.fillRect(-w/2, -h/2, w, h);
    
    // Draw wheels/highlights
    if(vehicle.wheelSize > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      const wheelR = vehicle.wheelSize * cam.scale;
      ctx.beginPath(); ctx.arc(-w/3, -h/2.5, wheelR, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(w/3, -h/2.5, wheelR, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(-w/3, h/2.5, wheelR, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(w/3, h/2.5, wheelR, 0, Math.PI*2); ctx.fill();
    }
    
    // Draw direction indicator / windows
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-w/4, -h/3, w/2, h/6);
    
    ctx.restore();
  } else {
    // Draw player as circle
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
  }

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
  
  // Show current character and vehicle
  ctx.font = '14px sans-serif';
  if(currentCharacter) {
    ctx.fillStyle = currentCharacter.color;
    ctx.fillText('Character: ' + currentCharacter.icon + ' ' + currentCharacter.name + ' (' + currentCharacter.title + ')', 12, canvas.height - 60);
  }
  if(vehicle) {
    ctx.fillStyle = '#fff';
    ctx.fillText('Vehicle: ' + vehicle.icon + ' ' + vehicle.name + ' | Speed: ' + Math.floor(Math.hypot(vehicle.velocityX, vehicle.velocityZ)) + ' px/s', 12, canvas.height - 100);
  }
  
  // HUD: active powerups
  if(activePowerups.speedBoost > 0) {
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('SPEED BOOST! ' + Math.ceil(activePowerups.speedBoost) + 's', 12, canvas.height - 80);
  }
  if(activePowerups.shield > 0) {
    ctx.fillStyle = '#00aaff';
    ctx.fillText('SHIELD! ' + Math.ceil(activePowerups.shield) + 's', 12, canvas.height - 120);
  }

  ctx.restore();
}

loadMap();

// 3D mode support: expose some globals for the 3D renderer and add a toggle
let is3D = false;
const threeToggle = document.getElementById('mode3d');
const graphicsSelect = document.getElementById('graphics');
const characterSelect = document.getElementById('character');
const vehicleSelect = document.getElementById('vehicle');

if(threeToggle) threeToggle.addEventListener('change', ()=>{
  is3D = threeToggle.checked;
  window.is3D = is3D;
  const sceneDiv = document.getElementById('scene3d');
  if(sceneDiv) sceneDiv.style.display = is3D ? 'block' : 'none';
  if(is3D && window.start3D) window.start3D();
  if(!is3D && window.stop3D) window.stop3D();
});
if(graphicsSelect) graphicsSelect.addEventListener('change', ()=>{ if(window.setGraphics) window.setGraphics(graphicsSelect.value); });
if(characterSelect) characterSelect.addEventListener('change', (e)=>{
  log('Character change requested:', e.target.value);
  switchCharacter(e.target.value);
});
if(vehicleSelect) vehicleSelect.addEventListener('change', (e)=>{
  log('Vehicle change requested:', e.target.value);
  switchVehicle(e.target.value);
});

// Initialize vehicle on startup
initializeVehicle('walking');
switchCharacter('soham');
log('Initial vehicle and character initialized');

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

// Update character info display in settings panel
function updateCharacterInfoDisplay(){
  if(!currentCharacter) return;
  const charNameEl = document.getElementById('charName');
  const charDescEl = document.getElementById('charDesc');
  if(charNameEl) {
    charNameEl.textContent = currentCharacter.icon + ' ' + currentCharacter.name + ' (' + currentCharacter.title + ')';
    charNameEl.style.color = currentCharacter.color;
  }
  if(charDescEl) {
    charDescEl.innerHTML = '<strong>Personality:</strong> ' + currentCharacter.personality + 
                          '<br><strong>Speed:</strong> ' + (currentCharacter.statMods.speedMultiplier * 100).toFixed(0) + '% | ' +
                          '<strong>Jump:</strong> ' + (currentCharacter.statMods.jumpForce * 100).toFixed(0) + '% | ' +
                          '<strong>Mass:</strong> ' + (currentCharacter.statMods.massMultiplier * 100).toFixed(0) + '%';
  }
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
// expose vehicle system
window.vehicle = vehicle;
window.currentVehicleType = currentVehicleType;
window.switchVehicle = switchVehicle;
window.vehicleTypes = vehicleTypes;
// expose character system
window.currentCharacter = currentCharacter;
window.switchCharacter = switchCharacter;
window.characters = characters;
log('All game globals exposed to window scope');

// ensure draw skips when 3D is active
const _origDraw = draw;
function draw(){
  if(window.is3D) return; // 2D renderer paused when in 3D mode
  _origDraw();
}
