// Scenery manager: trees, grass, playground with swing (kids)
window.Scenery = function(parent){
  const group = new THREE.Group(); parent.add(group);
  const items = [];
  const lenZ = 160;

  // Materials
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x0a3a1a });
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x1f7a3b });
  const swingMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
  const kidBodyMat = new THREE.MeshLambertMaterial({ color: 0xffcba4 });
  const kidClothMat = new THREE.MeshLambertMaterial({ color: 0x3477eb });

  const themes = [
    { name:'urban', grass:0x0a3a1a, leaf:0x1f7a3b },
    { name:'park', grass:0x0f4d22, leaf:0x2aa74a },
    { name:'residential', grass:0x155e2b, leaf:0x38c172 },
    { name:'downtown', grass:0x0a2a3a, leaf:0x1a6a8a }
  ];
  let themeIndex = 0;
  function applyTheme(){
    const t = themes[themeIndex % themes.length];
    grassMat.color.setHex(t.grass);
    leafMat.color.setHex(t.leaf);
  }
  applyTheme();

  // Grass strips
  const grassLeft = new THREE.Mesh(new THREE.BoxGeometry(8,0.1,lenZ), grassMat); grassLeft.position.set(-18, -0.05, lenZ/2); group.add(grassLeft);
  const grassRight = new THREE.Mesh(new THREE.BoxGeometry(8,0.1,lenZ), grassMat); grassRight.position.set(18, -0.05, lenZ/2); group.add(grassRight);

  // Trees
  function makeTree(){
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.25,2,8), trunkMat); trunk.position.y=1; tree.add(trunk);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1,10,10), leafMat); crown.position.y=2.5; tree.add(crown);
    return tree;
  }
  for (let i=0;i<20;i++){
    const t1 = makeTree(); t1.position.set(-18+Math.random()*6,0,Math.random()*lenZ); group.add(t1); items.push({m:t1,type:'tree'});
    const t2 = makeTree(); t2.position.set(18-Math.random()*6,0,Math.random()*lenZ); group.add(t2); items.push({m:t2,type:'tree'});
  }

  // Playground: swing with kids
  function makeSwingSet(){
    const swing = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(3,0.1,0.1), swingMat); frame.position.set(0,2.2,0); swing.add(frame);
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1,2.2,0.1), swingMat); leg1.position.set(-1.2,1.1,0); swing.add(leg1);
    const leg2 = leg1.clone(); leg2.position.x = 1.2; swing.add(leg2);
    const ropePivot = new THREE.Group(); ropePivot.position.set(0,1.9,0); swing.add(ropePivot);
    const rope = new THREE.Mesh(new THREE.BoxGeometry(0.05,1,0.05), swingMat); rope.position.y=-0.5; ropePivot.add(rope);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.1,0.3), swingMat); seat.position.y=-1.05; ropePivot.add(seat);
    // Kid: body + head
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.5,0.2), kidClothMat); body.position.set(0,-1.25,0); ropePivot.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15,10,10), kidBodyMat); head.position.set(0,-1.0,0.15); ropePivot.add(head);
    swing.userData = { ropePivot, t: Math.random()*Math.PI };
    return swing;
  }
  for (let i=0;i<3;i++){
    const s = makeSwingSet();
    const side = Math.random()<0.5?-1:1;
    s.position.set(side*19,0,10+i*35);
    group.add(s); items.push({m:s,type:'swing'});
  }

  function update(speed, dt){
    // Move all scenery backwards to simulate forward motion.
    group.position.z -= speed*dt;
    if (group.position.z < -lenZ){ group.position.z += lenZ; }
    // Animate swings
    for (const it of items){
      if (it.type==='swing'){
        const rp = it.m.userData.ropePivot; if (!rp) continue;
        it.m.userData.t += dt; rp.rotation.z = Math.sin(it.m.userData.t*1.2)*0.3;
      }
    }
  }
  function reset(){ group.position.z = 0; }
  function nextTheme(){ themeIndex = (themeIndex + 1) % themes.length; applyTheme(); }
  function setThemeIndex(i){ themeIndex = ((i%themes.length)+themes.length)%themes.length; applyTheme(); }

  return { update, reset, nextTheme, setThemeIndex };
}
