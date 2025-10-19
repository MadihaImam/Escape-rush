// Road: two long tiles scrolling for infinite effect
window.Road = function(scene){
  const tileLen = 80; // along Z
  const tileWidth = 20; // along X
  const tiles = [];
  const mat = new THREE.MeshBasicMaterial({ color: 0x1b2838 });
  for (let i=0;i<2;i++){
    const geo = new THREE.BoxGeometry(tileWidth, 0.1, tileLen);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, -0.1, i*tileLen);
    scene.add(mesh);
    tiles.push(mesh);
  }
  const laneMarkers = [];
  const laneMat = new THREE.LineBasicMaterial({ color: 0xf1f7ff });
  for (let i=-1;i<=1;i++){
    const points = [new THREE.Vector3(i*6.7,0,0), new THREE.Vector3(i*6.7,0,160)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, laneMat); line.position.y=0.05; scene.add(line); laneMarkers.push(line);
  }
  function update(speed){
    tiles.forEach(t=>{ t.position.z -= speed; });
    if (tiles[0].position.z < -tileLen){
      const first = tiles.shift();
      first.position.z = tiles[tiles.length-1].position.z + tileLen;
      tiles.push(first);
    }
  }
  return { update, tileWidth };
}
