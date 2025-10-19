// Procedural car models (body + wheels + optional police lightbar)
window.Models = (function(){
  function makeWheel(radius=0.6, width=0.4){
    const geo = new THREE.CylinderGeometry(radius, radius, width, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.2, roughness: 0.8 });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.z = Math.PI/2; // align to roll around X
    m.castShadow = true;
    return m;
  }
  function makeBody(color){
    const body = new THREE.Group();
    // chassis
    const baseGeo = new THREE.BoxGeometry(2.2, 0.6, 4.8);
    const baseMat = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.7 });
    const base = new THREE.Mesh(baseGeo, baseMat); base.position.y = 0.6; base.castShadow = true; body.add(base);
    // cabin
    const cabGeo = new THREE.BoxGeometry(1.8, 0.7, 2.0);
    const cabMat = new THREE.MeshStandardMaterial({ color: (color & 0x7fffff) + 0x202020, metalness: 0.2, roughness: 0.8 });
    const cab = new THREE.Mesh(cabGeo, cabMat); cab.position.set(0, 1.1, 0.2); cab.castShadow = true; body.add(cab);
    // wheels
    const wheelPositions = [
      [-1.1, 0.4, 1.5], [1.1, 0.4, 1.5], // front
      [-1.1, 0.4, -1.6], [1.1, 0.4, -1.6] // rear
    ];
    const wheels = wheelPositions.map(p=>{ const w = makeWheel(); w.position.set(p[0], p[1], p[2]); body.add(w); return w; });
    return { body, wheels, base, cab };
  }
  function addPoliceLightbar(group){
    const bar = new THREE.Group();
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.15,0.6), new THREE.MeshBasicMaterial({ color: 0xff2d2d }));
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.15,0.6), new THREE.MeshBasicMaterial({ color: 0x2d7bff }));
    red.position.set(-0.35, 1.55, 0.3);
    blue.position.set(0.35, 1.55, 0.3);
    bar.add(red); bar.add(blue);
    group.add(bar);
    return { bar, red, blue };
  }
  function buildCar(color=0xe74c3c, police=false){
    const { body, wheels } = makeBody(color);
    let lightbar = null;
    if (police){ lightbar = addPoliceLightbar(body); }
    // expose fields
    const car = new THREE.Group();
    car.add(body);
    car.userData = { wheels, lightbar };
    return car;
  }
  return { buildCar };
})();
