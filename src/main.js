  function setHealthUI(){
    const el = document.getElementById('health-fill');
    if (!el) return;
    const w = Math.max(0, Math.min(100, health));
    el.style.width = w + '%';
    // simple color shift: green -> red
    if (w > 60) el.style.background = 'linear-gradient(90deg, #22c55e, #84cc16)';
    else if (w > 30) el.style.background = 'linear-gradient(90deg, #f59e0b, #eab308)';
    else el.style.background = 'linear-gradient(90deg, #ef4444, #f43f5e)';
  }
// Main game bootstrap
(function(){
  const canvas = document.getElementById('game-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x071018, 1);
  // quality
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x071018, 20, 140);
  // World group holds road, scenery, player, and enemies so we can transform as a whole
  const world = new THREE.Group();
  scene.add(world);

  const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 500);
  camera.position.set(0, 18, -14);
  camera.lookAt(0, 0.5, 12);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5); scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9); dir.position.set(6,16,-12); dir.castShadow = true; dir.shadow.mapSize.set(1024,1024); dir.shadow.camera.near=1; dir.shadow.camera.far=80; scene.add(dir);

  const road = new Road(world);
  const enemies = new EnemyPool(world, ()=>player.mesh.position.x, ()=>score);
  let player = new Player(world, GameState.state.skin);
  const scenery = new Scenery(world);
  // Apply persisted theme at boot
  if (typeof GameState.state.themeIndex === 'number') {
    scenery.setThemeIndex(GameState.state.themeIndex);
  }

  const lanes = [-6.7, 0, 6.7];
  let boundsX = 14.0; // widened to allow sidewalk driving
  // World turning
  let turnTargetY = 0;
  let turning = false;
  function requestTurn(dir){ // dir: -1 left, +1 right
    if (turning) return;
    turning = true;
    turnTargetY = world.rotation.y + (dir<0 ? -Math.PI/2 : Math.PI/2);
    scenery.nextTheme();
  }

  // Input handling: drag/swipe
  let dragging=false, lastX=0;
  function onPointerDown(e){ dragging=true; lastX = e.clientX || (e.touches?e.touches[0].clientX:0); AudioMgr.resume(); }
  function steerSign(){ return GameState.state.invertSteer ? -1 : 1; }
  function onPointerMove(e){ if(!dragging) return; const cx = e.clientX || (e.touches?e.touches[0].clientX:0); const dx = (cx-lastX); lastX=cx; player.setSpeedX(dx*0.03*UI.getSensitivity()*steerSign()); }
  function onPointerUp(){ dragging=false; player.setSpeedX(0); }
  window.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchstart', onPointerDown, {passive:true});
  window.addEventListener('touchmove', onPointerMove, {passive:true});
  window.addEventListener('touchend', onPointerUp);

  // Keyboard controls
  const keys = { left:false, right:false };
  window.addEventListener('keydown', (e)=>{
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'p') { if(!running) return; paused = !paused; paused?UI.show(UI.overlays.pause):UI.hide(UI.overlays.pause); }
    if (e.key === 'Escape') { if (paused) { paused=false; UI.hide(UI.overlays.pause);} }
  });
  window.addEventListener('keyup', (e)=>{
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.right = false;
  });

  // Resize
  function onResize(){ camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); }
  window.addEventListener('resize', onResize);

  // Game variables
  let running = false;
  let paused = false;
  let score = 0;
  let best = GameState.state.highScore || 0;
  let speed = 20; // world scroll speed
  let spawnTimer = 0;
  let spawnInterval = 1.2;
  let fpsSMA = 60;
  let postSpawnTimer = -1; // spawn extra wave after restart
  let grace = 0; // collision grace period after restart
  let health = 100; // car health

  UI.setBest(best);
  UI.syncSettings();
  UI.btn.start.addEventListener('click', ()=>{ startGame(); AudioMgr.click(); });
  UI.btn.settings.addEventListener('click', ()=>{ UI.hide(UI.overlays.main); UI.show(UI.overlays.settings); AudioMgr.click(); });
  UI.btn.shop.addEventListener('click', ()=>{ UI.hide(UI.overlays.main); UI.show(UI.overlays.shop); AudioMgr.click(); });
  UI.btn.pause.addEventListener('click', ()=>{ if(!running) return; paused=true; UI.show(UI.overlays.pause); AudioMgr.click(); });
  UI.btn.resume.addEventListener('click', ()=>{ paused=false; UI.hide(UI.overlays.pause); AudioMgr.click(); });
  UI.btn.exit.addEventListener('click', ()=>{ endToMenu(); AudioMgr.click(); });
  UI.btn.restart.addEventListener('click', ()=>{ restartGame(); AudioMgr.click(); });
  UI.btn.menu.addEventListener('click', ()=>{ endToMenu(); AudioMgr.click(); });
  UI.btn.cont.addEventListener('click', async ()=>{
    AudioMgr.click();
    const ok = await Monetization.showRewardedAd();
    if (ok){ UI.hide(UI.overlays.gameover); running=true; paused=false; AudioMgr.playMusic(); }
  });
  UI.toggleMusic.addEventListener('change', (e)=>{ GameState.set('music', e.target.checked); if(e.target.checked) AudioMgr.playMusic(); else AudioMgr.stopMusic(); });
  UI.toggleSfx.addEventListener('change', (e)=>{ GameState.set('sfx', e.target.checked); });
  if (UI.toggleInvert) UI.toggleInvert.addEventListener('change', (e)=>{ GameState.set('invertSteer', e.target.checked); });
  if (UI.selectTheme) UI.selectTheme.addEventListener('change', (e)=>{ const i = parseInt(e.target.value||'0',10)||0; GameState.set('themeIndex', i); scenery.setThemeIndex(i); });
  UI.toggleFps.addEventListener('change', (e)=>{ GameState.set('showFps', e.target.checked); UI.setFpsVisible(e.target.checked); });
  UI.rangeSens.addEventListener('input', (e)=>{ const v = parseFloat(e.target.value||'1'); GameState.set('sensitivity', v); });
  UI.btn.settingsBack.addEventListener('click', ()=>{ UI.hide(UI.overlays.settings); UI.show(UI.overlays.main); AudioMgr.click(); });
  UI.btn.shopBack.addEventListener('click', ()=>{ UI.hide(UI.overlays.shop); UI.show(UI.overlays.main); AudioMgr.click(); });
  UI.btn.removeAds.addEventListener('click', async ()=>{ const ok = await Monetization.purchaseUpgrade(); if (ok){ GameState.set('removeAds', true); } });
  document.querySelectorAll('.car-skin').forEach(b=>{
    b.addEventListener('click', ()=>{ const s=b.dataset.skin; GameState.set('skin', s); player.setSkin(s); AudioMgr.click(); });
  });

  function startGame(){
    score = 0; speed = 20; spawnInterval = 1.2; spawnTimer = 0;
    clearEnemies();
    player.setX(0); player.setSpeedX(0);
    UI.hide(UI.overlays.main); UI.show(UI.overlays.hud); UI.hide(UI.overlays.gameover); UI.hide(UI.overlays.pause);
    // reset particles
    for (let i=particles.length-1;i>=0;i--){ const p=particles[i]; particleGroup.remove(p); particles.splice(i,1); }
    // reset clock to avoid big dt on first frame
    prev = Utils.now();
    scenery.reset();
    running = true; paused = false; AudioMgr.playMusic();
    UI.showControls();
    grace = 2.0; // 2s invulnerability
    health = 100; setHealthUI();
    // spawn an initial wave so the road isn't empty after restart
    // Force 2 police and 3 regular cars spaced out
    spawnEnemy(0, true);
    spawnEnemy(18, true);
    spawnEnemy(36, false);
    spawnEnemy(54, false);
    spawnEnemy(72, false);
    postSpawnTimer = 2.0;
  }
  function restartGame(){ startGame(); }
  function endToMenu(){ running=false; paused=false; UI.hide(UI.overlays.hud); UI.hide(UI.overlays.pause); UI.hideControls(); UI.show(UI.overlays.main); AudioMgr.stopMusic(); }
  function gameOver(){
    spawnExplosion(player.mesh.position.clone());
    running=false; paused=false; UI.setFinal(score); UI.hide(UI.overlays.hud); UI.hideControls(); UI.show(UI.overlays.gameover); AudioMgr.stopMusic(); AudioMgr.crash(); if (score>best){ best=score; GameState.set('highScore', Math.floor(best)); UI.setBest(best); }
  }
  function clearEnemies(){ enemies.clear(); }

  // Spawn enemies on lanes
  function spawnEnemy(zOffset=0, forcePolice=false){
    const lane = lanes[Math.floor(Math.random()*lanes.length)];
    const zStart = player.getZ() + 110 + zOffset; // further away to avoid instant overlaps
    const eSpeed = speed * Utils.randRange(0.9, 1.2);
    enemies.spawn(zStart, lane, eSpeed, forcePolice);
  }

  let prev = Utils.now();
  // Speed lines
  const lines = new THREE.Group(); scene.add(lines);
  const lineCount = 120;
  for (let i=0;i<lineCount;i++){
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0, -1.2)]);
    const m = new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent:true, opacity: 0.35 });
    const l = new THREE.Line(g, m);
    l.position.set(Utils.randRange(-8,8), 0.2, Utils.randRange(0,140));
    lines.add(l);
  }

  // Guardrails
  const railMat = new THREE.MeshBasicMaterial({ color: 0x0f1720 });
  const railGeo = new THREE.BoxGeometry(1,0.6,160);
  const leftRail = new THREE.Mesh(railGeo, railMat); leftRail.position.set(-11.2,0.3,80); scene.add(leftRail);
  const rightRail = new THREE.Mesh(railGeo, railMat); rightRail.position.set(11.2,0.3,80); scene.add(rightRail);

  // Explosion particles
  const particleGroup = new THREE.Group(); scene.add(particleGroup);
  const maxParticles = 100; const particles=[];
  function spawnExplosion(pos){
    for (let i=0;i<maxParticles;i++){
      const geo = new THREE.SphereGeometry(0.05, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff5555 });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);
      p.userData = { v: new THREE.Vector3(Utils.randRange(-6,6), Utils.randRange(2,8), Utils.randRange(-6,6)), life: Utils.randRange(0.4,0.9) };
      particleGroup.add(p); particles.push(p);
    }
  }

  function tick(){
    const t = Utils.now();
    let dt = (t - prev) / 1000; prev = t;
    dt = Math.min(dt, 0.033); // cap

    if (running && !paused){
      // Difficulty ramp
      speed = Math.min(60, speed + dt*0.8);
      spawnInterval = Math.max(0.45, spawnInterval - dt*0.06);

      road.update(speed*dt);
      scenery.update(speed, dt, player.mesh.position.x, player.mesh.position.z);
      enemies.update(dt);
      player.update(dt);

      // Handle world turning animation
      if (turning){
        world.rotation.y = THREE.MathUtils.lerp(world.rotation.y, turnTargetY, 0.08);
        if (Math.abs(world.rotation.y - turnTargetY) < 0.01){ world.rotation.y = turnTargetY; turning=false; }
      }

      // Clamp player to widened road
      player.setX(Utils.clamp(player.mesh.position.x, -boundsX, boundsX));

      // Keyboard + mobile button movement
      const kx = (keys.left?-1:0) + (keys.right?1:0) + (ctl.left?-1:0) + (ctl.right?1:0);
      if (kx !== 0) player.setSpeedX(10*kx*UI.getSensitivity()*steerSign()); else if(!dragging) player.setSpeedX(0);

      // Drift toggle
      player.setDrift(!!ctl.drift);

      // Turn combo: hold drift and tap left/right triggers a world turn
      if (ctl.drift && (ctl.left || ctl.right)){
        if (ctl.left) { requestTurn(-1); }
        else if (ctl.right) { requestTurn(1); }
      }

      // Accel/Brake affect speed
      if (ctl.accel) speed = Math.min(65, speed + 30*dt);
      if (ctl.brake) speed = Math.max(12, speed - 40*dt);

      // Scoring
      score += dt * speed * 0.5;
      UI.setScore(score);
      if (grace>0) { grace -= dt; }

      // Spawning
      spawnTimer -= dt; if (spawnTimer<=0){ spawnEnemy(); spawnTimer = spawnInterval; }
      if (postSpawnTimer>0){ postSpawnTimer -= dt; if (postSpawnTimer<=0){
        // extra density wave
        spawnEnemy(0, false); spawnEnemy(12, false); spawnEnemy(24, true);
        postSpawnTimer = -1;
      }}

      // Collisions (disabled during grace period)
      if (grace<=0) {
        enemies.each(e=>{
          if (e.bbox.intersectsBox(player.bounds())){
            // Apply damage
            const base = e.police ? 25 : 12;
            const sev = Math.min(1, speed/60);
            health -= Math.round(base + sev*15);
            setHealthUI();
            // Push physics on enemy
            const dx = e.mesh.position.x - player.mesh.position.x;
            const dz = e.mesh.position.z - player.mesh.position.z;
            const inv = Math.max(0.001, Math.hypot(dx,dz));
            const ux = dx/inv, uz = dz/inv;
            e.pushVX = (e.pushVX||0) + ux * 18; // lateral push
            e.pushVZ = (e.pushVZ||0) + uz * 22; // forward push
            // Light recoil on player
            player.setX(player.mesh.position.x - ux * 0.6);
            // Arrest/game over on zero health
            if (health <= 0){ gameOver(); }
          }
        });
      }
    }

    // Animate lines and particles always
    for (let i=0;i<lines.children.length;i++){
      const l = lines.children[i];
      l.position.z -= speed*0.8*dt;
      if (l.position.z < -10) l.position.z += 150;
    }
    for (let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.userData.life -= dt; if (p.userData.life<=0){ particleGroup.remove(p); particles.splice(i,1); continue; }
      p.position.addScaledVector(p.userData.v, dt);
      p.userData.v.y -= 9.8*dt*0.6;
    }

    // FPS update
    const fps = 1/dt; fpsSMA = fpsSMA*0.9 + fps*0.1; if (GameState.state.showFps) UI.setFps(fpsSMA);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  // Scenery replaces previous simple buildings

  requestAnimationFrame(tick);

  // Mobile controls wiring
  const ctl = { left:false, right:false, accel:false, brake:false, drift:false };
  function bindHold(el, key){
    const onDown = (e)=>{ e.preventDefault(); ctl[key]=true; };
    const onUp = (e)=>{ e.preventDefault(); ctl[key]=false; };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onUp);
    el.addEventListener('touchstart', onDown, {passive:false});
    el.addEventListener('touchend', onUp);
  }
  bindHold(UI.ctl.left, 'left');
  bindHold(UI.ctl.right, 'right');
  bindHold(UI.ctl.accel, 'accel');
  bindHold(UI.ctl.brake, 'brake');
  bindHold(UI.ctl.drift, 'drift');
  // Hide controls when paused
  UI.btn.pause.addEventListener('click', ()=> UI.hideControls());
  UI.btn.resume.addEventListener('click', ()=> UI.showControls());
  UI.btn.settings.addEventListener('click', ()=> UI.hideControls());
  UI.btn.shop.addEventListener('click', ()=> UI.hideControls());
  UI.btn.settingsBack.addEventListener('click', ()=> UI.showControls());
  UI.btn.shopBack.addEventListener('click', ()=> UI.showControls());

})();
