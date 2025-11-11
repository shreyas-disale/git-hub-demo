// Minimal three.js-based 3D renderer for the demo.
// Expects `window.player`, `window.getTileAt(tx,ty)`, and `window.otherPlayers` to exist.
(() => {
  if(typeof THREE === 'undefined'){
    console.warn('three.js not loaded');
    return;
  }

  let renderer, scene, camera;
  let container = document.getElementById('scene3d');
  let rafId = null;
  let quality = 'medium';
  let tileMeshes = new Map();
  let playerMesh = null;
  let snakeMesh = null;
  let particles = []; // particle effects
  let sunLight, shadowLight;

  // Apply 3D graphics settings: shadows, fog, bloom-like adjustments
  function apply3DGraphicsSettings(){
    if(!scene || !renderer || !sunLight) return;
    const s = window.graphicsSettings || {};
    // Shadows
    const sq = s.shadowQuality || 'medium';
    if(sq === 'off'){
      sunLight.castShadow = false;
      renderer.shadowMap.enabled = false;
    } else {
      sunLight.castShadow = true;
      renderer.shadowMap.enabled = true;
      const mapSize = (sq === 'low') ? 512 : (sq === 'high') ? 2048 : 1024;
      sunLight.shadow.mapSize.width = mapSize;
      sunLight.shadow.mapSize.height = mapSize;
      // adjust intensity slightly
      sunLight.intensity = (sq === 'low') ? 0.8 : (sq === 'high') ? 1.2 : 1.0;
    }

    // Fog - use FogExp2 for smoother effect
    const fogDensity = (typeof s.fogDensity === 'number') ? s.fogDensity : 0.15;
    scene.fog = new THREE.FogExp2(0x87ceeb, Math.max(0.0005, fogDensity * 0.0015));

    // Bloom/emissive tweak (simple approach)
    if(s.bloom){
      renderer.toneMappingExposure = 1.1;
    } else {
      renderer.toneMappingExposure = 1.0;
    }
  }

  function setSize(){
    if(!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function hexToThreeColor(hexStr){
    const c = new THREE.Color(hexStr);
    return c;
  }

  function makeTileMesh(tx, ty, tileSize){
    const key = tx+','+ty;
    const geo = new THREE.PlaneGeometry(tileSize, tileSize);
    
    // Get biome color
    const v = coordNoise(tx, ty, 2);
    let tileColor = 0x3a7d3a;
    if(v < 0.33) tileColor = 0x3a7d3a; // grass green
    else if(v < 0.66) tileColor = 0xd4a574; // sand tan
    else tileColor = 0xe0e0ff; // snow white-blue
    
    const mat = new THREE.MeshStandardMaterial({color: tileColor, metalness: 0.0, roughness: 0.8});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI/2;
    mesh.position.set(tx*tileSize + tileSize/2, 0.1, ty*tileSize + tileSize/2);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    tileMeshes.set(key, mesh);
    scene.add(mesh);
    return mesh;
  }

  // Deterministic pseudo-random based on coordinates
  function coordNoise(x,y,seed=1337){
    let n = x*374761393 + y*668265263 + seed;
    n = (n ^ (n >>> 13)) * 1274126177;
    n = (n ^ (n >>> 16)) >>> 0;
    return n / 4294967295;
  }

  function updateTiles(){
    const ts = (window.mapData && window.mapData.tileSize) ? window.mapData.tileSize : 16;
    const camX = window.player.x;
    const camY = window.player.y;
    const halfTiles = (quality === 'low') ? 10 : (quality === 'high') ? 30 : 18;
    const minTX = Math.floor((camX/ts) - halfTiles);
    const maxTX = Math.floor((camX/ts) + halfTiles);
    const minTY = Math.floor((camY/ts) - halfTiles);
    const maxTY = Math.floor((camY/ts) + halfTiles);

    // mark existing
    const needed = new Set();
    for(let ty = minTY; ty<=maxTY; ty++){
      for(let tx = minTX; tx<=maxTX; tx++){
        needed.add(tx+','+ty);
        if(!tileMeshes.has(tx+','+ty)){
          const tile = window.getTileAt(tx, ty);
          const mesh = makeTileMesh(tx, ty, ts);
          if(tile===0) mesh.material.color.set(0x3a7d3a);
          else if(tile===1) mesh.material.color.set(0x1767a0);
          else if(tile===2) mesh.material.color.set(0x2b2b17);
          else mesh.material.color.set(0x666666);
        }
      }
    }
    // remove extras
    for(const k of Array.from(tileMeshes.keys())){
      if(!needed.has(k)){
        const m = tileMeshes.get(k);
        scene.remove(m);
        tileMeshes.delete(k);
      }
    }
  }

  function createHumanMesh(){
    if(playerMesh){ scene.remove(playerMesh); playerMesh=null; }
    playerMesh = new THREE.Group();
    // torso
    const torsoGeom = new THREE.BoxGeometry(8, 14, 6);
    const torsoMat = new THREE.MeshStandardMaterial({color: 0xffff00});
    const torso = new THREE.Mesh(torsoGeom, torsoMat);
    torso.position.y = 12;
    playerMesh.add(torso);
    // head
    const headGeom = new THREE.SphereGeometry(4, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({color: 0xffe0bd});
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 22;
    playerMesh.add(head);
    // left arm
    const armGeom = new THREE.BoxGeometry(3, 12, 3);
    const armMat = new THREE.MeshStandardMaterial({color: 0xffe0bd});
    const lArm = new THREE.Mesh(armGeom, armMat);
    lArm.position.set(-6, 12, 0);
    lArm.castShadow = true;
    lArm.receiveShadow = true;
    playerMesh.add(lArm);
    const rArm = new THREE.Mesh(armGeom, armMat);
    rArm.position.set(6, 12, 0);
    rArm.castShadow = true;
    rArm.receiveShadow = true;
    playerMesh.add(rArm);
    // legs
    const legGeom = new THREE.BoxGeometry(3, 12, 3);
    const legMat = new THREE.MeshStandardMaterial({color: 0x222222});
    const lLeg = new THREE.Mesh(legGeom, legMat);
    lLeg.position.set(-2.5, 2, 0);
    lLeg.castShadow = true;
    lLeg.receiveShadow = true;
    playerMesh.add(lLeg);
    const rLeg = new THREE.Mesh(legGeom, legMat);
    rLeg.position.set(2.5, 2, 0);
    rLeg.castShadow = true;
    rLeg.receiveShadow = true;
    playerMesh.add(rLeg);
    // attach a simple shirt color (torso material)
    playerMesh.userData.parts = {torso: torso, head: head, lArm: lArm, rArm: rArm, lLeg: lLeg, rLeg: rLeg};
    scene.add(playerMesh);
  }

  function createSnakeMesh(){
    if(snakeMesh){ scene.remove(snakeMesh); snakeMesh=null; }
    const geom = new THREE.SphereGeometry(8, 12, 12);
    const mat = new THREE.MeshStandardMaterial({color: 0xff4d4d, metalness: 0.3, roughness: 0.7});
    snakeMesh = new THREE.Mesh(geom, mat);
    snakeMesh.castShadow = true;
    snakeMesh.receiveShadow = true;
    scene.add(snakeMesh);
  }

  function createOtherMesh(){
    // we create on-the-fly in the loop
  }

  function start3D(){
    if(rafId) return;
    quality = window.quality || 'medium';
    renderer = new THREE.WebGLRenderer({antialias: quality === 'high'});
  renderer.setPixelRatio((quality === 'low') ? 1 : (window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 500, 2000);

    camera = new THREE.PerspectiveCamera(60, container.clientWidth/container.clientHeight, 1, 10000);
    camera.position.set(0, 120, -180);
    camera.lookAt(0,0,0);

    // Enhanced lighting: sun + ambient
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    hemi.position.set(0,200,0);
    scene.add(hemi);
    
    sunLight = new THREE.DirectionalLight(0xffffcc, 1.0);
    sunLight.position.set(200, 300, -200);
    sunLight.castShadow = true;
  // shadow map size will be adjusted by graphics settings
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -500;
    sunLight.shadow.camera.right = 500;
    sunLight.shadow.camera.top = 500;
    sunLight.shadow.camera.bottom = -500;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 3000;
    scene.add(sunLight);
    
    // Add a subtle ambient light to lift shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

  createHumanMesh();
    createSnakeMesh();

  // Apply initial 3D graphics settings if available
  if(window.graphicsSettings) apply3DGraphicsSettings();

    window.setGraphics = (q)=>{
      quality = q;
      renderer.setPixelRatio((q === 'low') ? 1 : (window.devicePixelRatio || 1));
    };

    window.start3D = start3D;
    window.stop3D = stop3D;
    window.apply3DGraphicsSettings = apply3DGraphicsSettings;

    onResize();
    animate();
    window.addEventListener('resize', onResize);
  }

  function stop3D(){
    if(!rafId) return;
    cancelAnimationFrame(rafId); rafId = null;
    if(renderer){
      renderer.dispose();
      renderer.domElement.remove();
      renderer = null;
    }
    tileMeshes.forEach(m=>scene.remove(m));
    tileMeshes.clear();
    if(scene){
      scene = null;
      camera = null;
    }
    window.removeEventListener('resize', onResize);
  }

  function onResize(){ if(container) setSize(); }

  function animate(){
    rafId = requestAnimationFrame(animate);
    // Update 3D graphics settings dynamically
    if(window.graphicsSettings) apply3DGraphicsSettings();
    // update tiles
    updateTiles();
    // update player position
    if(playerMesh && window.player){
      const px = window.player.x; const py = window.player.y; const pz = window.player.z || 0;
      playerMesh.position.set(px, 8 + pz, py);
      // apply character color
      const col = window.playerColor || 'yellow';
      const colorMap = {yellow: 0xffde59, blue: 0x4d9de0, green: 0x52b788};
      const parts = playerMesh.userData.parts;
      if(parts && parts.torso) parts.torso.material.color.setHex(colorMap[col] || 0xffde59);
      
      // running animation: swing arms/legs based on movement
      const phase = window.player.animationPhase || 0;
      if(parts) {
        const swing = Math.sin(phase * Math.PI * 2) * 0.3;
        if(parts.lArm) parts.lArm.rotation.x = swing;
        if(parts.rArm) parts.rArm.rotation.x = -swing;
        if(parts.lLeg) parts.lLeg.rotation.x = -swing * 0.5;
        if(parts.rLeg) parts.rLeg.rotation.x = swing * 0.5;
      }
    }
    // snake
    if(snakeMesh && window.snake){
      snakeMesh.position.set(window.snake.x, 6, window.snake.y);
    }
    
    // Render powerups
    for(let i = scene.children.length-1; i>=0; i--){
      const ch = scene.children[i];
      if(ch.userData && (ch.userData.isPowerup || ch.userData.isParticle)) scene.remove(ch);
    }
    if(window.powerups && Array.isArray(window.powerups)){
      for(const p of window.powerups) {
        const geom = new THREE.BoxGeometry(12, 12, 12);
        let color = 0xffaa00;
        if(p.type === 'shield') color = 0x00aaff;
        else if(p.type === 'health') color = 0x00ff00;
        const emissiveIntensity = (window.graphicsSettings && window.graphicsSettings.bloom) ? 1.2 : 0.5;
        const mat = new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity});
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(p.x, 10, p.y);
        mesh.rotation.y += 0.05;
        mesh.userData.isPowerup = true;
        scene.add(mesh);
      }
    }
    
    // Render particles (respect particle quality)
    if(window.particles && Array.isArray(window.particles)){
      const pq = window.graphicsSettings && window.graphicsSettings.particleQuality ? window.graphicsSettings.particleQuality : 'medium';
      const maxRender = (pq === 'off') ? 0 : (pq === 'low') ? 24 : (pq === 'high') ? 200 : 80;
      let count = 0;
      for(const p of window.particles) {
        if(count++ >= maxRender) break;
        const geom = new THREE.SphereGeometry(2, 4, 4);
        const alpha = Math.max(0.05, p.life / p.maxLife);
        let color = 0xcccccc;
        if(typeof p.color === 'string'){
          if(p.color.includes('ffaa00')) color = 0xffaa00;
          else if(p.color.includes('00aaff')) color = 0x00aaff;
          else if(p.color.includes('00ff00')) color = 0x00ff00;
          else if(p.color.includes('255,100,100')) color = 0xff6464;
        }
        const mat = new THREE.MeshStandardMaterial({color, transparent: true, opacity: alpha});
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(p.x, 2 + (1 - alpha) * 2, p.y);
        mesh.userData.isParticle = true;
        scene.add(mesh);
      }
    }
    
    // other players: create small boxes
    // remove existing other-meshes
    // naive approach: remove all 'other_' children then recreate
    for(let i = scene.children.length-1; i>=0; i--){
      const ch = scene.children[i];
      if(ch.userData && ch.userData.otherId){ scene.remove(ch); }
    }
    if(window.otherPlayers){
      for(const id in window.otherPlayers){
        if(id === window.clientId) continue;
        const op = window.otherPlayers[id];
        const box = new THREE.Mesh(new THREE.BoxGeometry(8,12,8), new THREE.MeshStandardMaterial({color:0xff6b6b}));
        box.position.set(op.x, 6, op.y);
        box.userData.otherId = id;
        scene.add(box);
      }
    }

    // camera follows player
    if(window.player && camera){
      const targetX = window.player.x;
      const targetZ = window.player.y;
      camera.position.x += (targetX - camera.position.x) * 0.1;
      camera.position.z += (targetZ - camera.position.z) * 0.1;
      camera.position.y = 120;
      camera.lookAt(targetX, 0, targetZ);
    }

    renderer.render(scene, camera);
  }

  // expose start/stop on window so main.js can call them
  window.start3D = start3D;
  window.stop3D = stop3D;
})();
