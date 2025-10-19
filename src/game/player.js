// Player car: model with wheels + simple drift physics
window.Player = function(scene, skin){
  const colorMap = { red: 0xe74c3c, blue: 0x3498db, green: 0x2ecc71 };
  const car = Models.buildCar(colorMap[skin]||0xe74c3c, false);
  car.position.set(0, 0.5, 10);
  scene.add(car);
  const bbox = new THREE.Box3().setFromObject(car);
  let vx = 0; // lateral velocity
  let ax = 0; // input acceleration
  let yaw = 0;
  let drift = false;

  function setSkin(s){ const col = colorMap[s]||0xe74c3c; car.traverse(n=>{ if(n.material && n.material.color){ n.material.color.setHex(col); } }); }
  function update(dt){
    // simple drift physics: integrate lateral velocity with damping
    const gain = drift ? 1.7 : 1.0;
    const damp = drift ? 0.97 : 0.9;
    vx += (ax * gain) * dt;
    vx *= damp; // friction
    car.position.x += vx * dt;
    // visual yaw/tilt
    yaw = THREE.MathUtils.lerp(yaw, -vx*0.03, 0.2);
    car.rotation.y = yaw;
    car.rotation.z = -vx*0.02;
    // wheel rotation/steer
    const wheels = (car.userData.wheels||[]);
    for (let i=0;i<wheels.length;i++){
      const w = wheels[i];
      w.rotation.x -= 8*dt; // rolling forward
      if (i<2) w.rotation.y = THREE.MathUtils.lerp(w.rotation.y, THREE.MathUtils.clamp(ax*0.02,-0.3,0.3), 0.4);
    }
    bbox.setFromObject(car);
  }
  function setX(x){ car.position.x = x; }
  function bounds(){ return bbox; }
  function setSpeedX(v){ ax = v; }
  function getZ(){ return car.position.z; }
  function setDrift(v){ drift = !!v; }
  return { mesh: car, update, setX, bounds, setSpeedX, getZ, setSkin, setDrift };
}
