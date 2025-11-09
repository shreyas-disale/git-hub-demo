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
const player = {x:0,y:0,size:10, speed:200};
const cam = {x:0,y:0,scale:1};
let perspective = 'top'; // 'top' | 'follow' | 'overview'
let keys = {};
addEventListener('keydown', e=>keys[e.key]=true);
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

// Multiplayer state (unchanged)
let ws = null;
let clientId = null;
let otherPlayers = {}; // id -> {x,y}

// UI bindings
const perspectiveSelect = document.getElementById('perspective');
const multiToggle = document.getElementById('multiplayerToggle');
const serverUrlInput = document.getElementById('serverUrl');
const connectBtn = document.getElementById('connectBtn');
const statusSpan = document.getElementById('status');

perspectiveSelect.addEventListener('change', e=>{ perspective = e.target.value; updateCameraForPerspective(); });
connectBtn.addEventListener('click', ()=>{
  if(ws){ disconnectWS(); }
  if(multiToggle.checked){ connectWS(serverUrlInput.value); }
});

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
  // input
  let dx=0, dy=0;
  if(keys['w']||keys['ArrowUp']) dy -= 1;
  if(keys['s']||keys['ArrowDown']) dy += 1;
  if(keys['a']||keys['ArrowLeft']) dx -= 1;
  if(keys['d']||keys['ArrowRight']) dx += 1;
  if(dx||dy){
    const len = Math.hypot(dx,dy)||1;
    player.x += (dx/len) * player.speed * dt;
    player.y += (dy/len) * player.speed * dt;
  }

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
    if(dist < (player.size + snake.size) * 0.9){
      // caught - simple response: stop the game and show message
      // freeze movement
      player.speed = 0;
      snake.speed = 0;
      // show text for a moment by setting headstart negative large
      headstart = -999;
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

  // send multiplayer update if connected
  if(ws && ws.readyState === WebSocket.OPEN){
    const payload = {type:'update', x: player.x, y: player.y};
    try{ ws.send(JSON.stringify(payload)); }catch(e){}
  }

  draw();
  requestAnimationFrame(loop);
}

function draw(){
  ctx.save();
  ctx.scale(DPR, DPR);
  ctx.clearRect(0,0,canvas.width,canvas.height);

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
      const wx = tx*ts + ts/2;
      const wy = ty*ts + ts/2;
      const s = worldToScreen(wx,wy);
      const size = ts*cam.scale;
      if(tile===0) ctx.fillStyle = '#3a7d3a'; // grass
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

  // draw player
  const p = worldToScreen(player.x, player.y);
  ctx.fillStyle = '#ffde59';
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(4, player.size*cam.scale), 0, Math.PI*2);
  ctx.fill();

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

  // draw other players
  for(const id in otherPlayers){
    if(id === clientId) continue;
    const op = otherPlayers[id];
    const sp = worldToScreen(op.x, op.y);
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, Math.max(3, player.size*cam.scale*0.8), 0, Math.PI*2);
    ctx.fill();
    // label
    ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif';
    ctx.fillText(id.substring(0,4), sp.x+6, sp.y-6);
  }

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

  ctx.restore();
}

loadMap();

// --- Multiplayer WebSocket client ---
function connectWS(url){
  try{
    ws = new WebSocket(url);
  }catch(e){ statusSpan.textContent = 'Bad URL'; return; }
  statusSpan.textContent = 'Connecting...';
  ws.addEventListener('open', ()=>{ statusSpan.textContent = 'Connected'; });
  ws.addEventListener('close', ()=>{ statusSpan.textContent = 'Disconnected'; ws=null; clientId=null; otherPlayers={}; });
  ws.addEventListener('message', ev=>{
    try{
      const m = JSON.parse(ev.data);
      if(m.type === 'id'){
        clientId = m.id; statusSpan.textContent = 'Ready ('+clientId.substring(0,6)+')';
      } else if(m.type === 'state'){
        otherPlayers = m.players || {};
      }
    }catch(e){console.error(e)}
  });
}

function disconnectWS(){ if(ws){ ws.close(); ws=null; clientId=null; otherPlayers={}; statusSpan.textContent='Closed'; } }

// try auto-connect if multiplayer checkbox is on and WS available
if(multiToggle.checked){ connectBtn.click(); }

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

// expose useful items for the 3D renderer
window.player = player;
window.getTileAt = getTileAt;
window.mapData = map;
window.cam = cam;
window.otherPlayers = otherPlayers;
window.clientId = clientId;
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
