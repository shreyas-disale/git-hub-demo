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
    const mat = new THREE.MeshLambertMaterial({color: 0x3a7d3a});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI/2;
    mesh.position.set(tx*tileSize + tileSize/2, 0, ty*tileSize + tileSize/2);
    mesh.receiveShadow = false;
    tileMeshes.set(key, mesh);
    scene.add(mesh);
    return mesh;
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
    playerMesh.add(lArm);
    const rArm = new THREE.Mesh(armGeom, armMat);
    rArm.position.set(6, 12, 0);
    playerMesh.add(rArm);
    // legs
    const legGeom = new THREE.BoxGeometry(3, 12, 3);
    const legMat = new THREE.MeshStandardMaterial({color: 0x222222});
    const lLeg = new THREE.Mesh(legGeom, legMat);
    lLeg.position.set(-2.5, 2, 0);
    playerMesh.add(lLeg);
    const rLeg = new THREE.Mesh(legGeom, legMat);
    rLeg.position.set(2.5, 2, 0);
    playerMesh.add(rLeg);
    // attach a simple shirt color (torso material)
    playerMesh.userData.parts = {torso: torso, head: head, lArm: lArm, rArm: rArm, lLeg: lLeg, rLeg: rLeg};
    scene.add(playerMesh);
  }

  function createSnakeMesh(){
    if(snakeMesh){ scene.remove(snakeMesh); snakeMesh=null; }
    const geom = new THREE.SphereGeometry(8, 12, 12);
    const mat = new THREE.MeshStandardMaterial({color: 0xff4d4d});
    snakeMesh = new THREE.Mesh(geom, mat);
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

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    hemi.position.set(0,200,0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(-100,200,-100);
    scene.add(dir);

  createHumanMesh();
    createSnakeMesh();

    window.setGraphics = (q)=>{
      quality = q;
      renderer.setPixelRatio((q === 'low') ? 1 : (window.devicePixelRatio || 1));
    };

    window.start3D = start3D;
    window.stop3D = stop3D;

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
    // update tiles
    updateTiles();
    // update player position
    if(playerMesh && window.player){
      const px = window.player.x; const py = window.player.y;
      playerMesh.position.set(px, 0, py);
      // apply character color
      const col = window.playerColor || 'yellow';
      const parts = playerMesh.userData.parts;
      if(parts && parts.torso) parts.torso.material.color.set(col);
    }
    // snake
    if(snakeMesh && window.snake){
      snakeMesh.position.set(window.snake.x, 6, window.snake.y);
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
