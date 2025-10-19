// Enemy cars: pooled boxes advancing toward camera, with optional police chase behavior
window.EnemyPool = function(scene, playerXProvider, scoreProvider){
  const pool = [];
  const active = [];
  const colors = [0xffc107, 0x9b59b6, 0xf39c12, 0x16a085, 0xe67e22, 0x1abc9c];
  let policeActive = 0;
  function get(){
    let e = pool.pop();
    if (!e){
      const color = colors[Math.floor(Math.random()*colors.length)];
      const isPolice = Math.random() < 0.18; // ~18% chance
      const car = Models.buildCar(color, isPolice);
      scene.add(car);
      e = { mesh: car, bbox: new THREE.Box3().setFromObject(car), speed: 10, police: isPolice, t: Math.random()*Math.PI };
      if (isPolice){ policeActive++; AudioMgr.sirenStart(); }
    }
    active.push(e); return e;
  }
  function spawn(zStart, laneX, speed, forcePolice=false){
    const e = get();
    // If reusing from pool, ensure police state set
    if (e.police){ e.t = Math.random()*Math.PI; }
    // Ensure we maintain desired number of police by score
    const score = (typeof scoreProvider === 'function') ? scoreProvider() : 0;
    const desiredPolice = Math.min(5, 1 + Math.floor(score/550));
    if ((policeActive < desiredPolice || forcePolice) && !e.police){
      // convert this car to police variant
      while(e.mesh.children.length) e.mesh.remove(e.mesh.children[0]);
      const rebuilt = Models.buildCar(0xffffff, true);
      while(rebuilt.children.length) e.mesh.add(rebuilt.children[0]);
      e.mesh.userData = rebuilt.userData;
      e.police = true; policeActive++; AudioMgr.sirenStart();
    }
    e.speed = speed;
    // reset push physics
    e.pushVX = 0; e.pushVZ = 0;
    e.mesh.position.set(laneX, 0.5, zStart);
    e.bbox.setFromObject(e.mesh);
  }
  function update(dt){
    for (let i=active.length-1;i>=0;i--){
      const e = active[i];
      // Base forward motion
      let forward = e.speed;
      // Police chase: slightly faster and avoid blocking by preferring lateral chase
      if (e.police && typeof playerXProvider === 'function'){
        forward += 4;
        const px = playerXProvider();
        const dx = THREE.MathUtils.clamp(px - e.mesh.position.x, -1, 1);
        e.mesh.position.x += dx * dt * 2.8; // stronger lateral chase
      }
      e.mesh.position.z -= forward * dt;
      // Push physics when bumped
      if (Math.abs(e.pushVX) > 0.01 || Math.abs(e.pushVZ) > 0.01){
        e.mesh.position.x += e.pushVX * dt;
        e.mesh.position.z += e.pushVZ * dt;
        e.pushVX *= 0.92; e.pushVZ *= 0.9;
      }
      e.bbox.setFromObject(e.mesh);
      // Police lightbar blinking
      if (e.police && e.mesh.userData.lightbar){
        e.t += dt*6;
        const onR = (Math.sin(e.t) > 0);
        e.mesh.userData.lightbar.red.material.color.setHex(onR?0xff2d2d:0x220000);
        e.mesh.userData.lightbar.blue.material.color.setHex(onR?0x000022:0x2d7bff);
      }
      if (e.mesh.position.z < -20){ // off screen behind camera
        scene.remove(e.mesh);
        if (e.police){ policeActive = Math.max(0, policeActive-1); if (policeActive===0) AudioMgr.sirenStop(); }
        // rebuild model properties for reuse next time
        const color = colors[Math.floor(Math.random()*colors.length)];
        const isPolice = Math.random() < 0.18;
        // remove old children
        while(e.mesh.children.length) e.mesh.remove(e.mesh.children[0]);
        const rebuilt = Models.buildCar(color, isPolice);
        // transfer rebuilt children into existing group to keep reference stable
        while(rebuilt.children.length) e.mesh.add(rebuilt.children[0]);
        e.mesh.userData = rebuilt.userData;
        e.police = isPolice; if (isPolice){ policeActive++; AudioMgr.sirenStart(); }
        pool.push(e); active.splice(i,1);
      }
    }
  }
  function each(fn){ active.forEach(fn); }
  function clear(){
    for (let i=active.length-1;i>=0;i--){
      const e = active[i];
      scene.remove(e.mesh);
      if (e.police) policeActive = Math.max(0, policeActive-1);
      pool.push(e);
      active.splice(i,1);
    }
    if (policeActive===0) AudioMgr.sirenStop();
  }
  return { spawn, update, each, clear };
}
