/** Pisos visuais em células 4x4. Não modifica colisões ou o servidor. */
export const TILE_SIZE = 4;
export const TILE_VARIANTS = Object.freeze({
  original: 0xffffff,
  escuro: 0xa1a1a1,
  claro: 0xd7d7d7,
  musgo: 0x91aa86,
  terra: 0xc4a682,
  laje: 0xffffff,
  pedra: 0xffffff,
  muro_x: 0xffffff,
  muro_y: 0xffffff,
  arbusto: 0xffffff,
});

export const OBJECT_VARIANTS = Object.freeze(['muro_x', 'muro_y', 'arbusto']);
const isObjectVariant = variant => OBJECT_VARIANTS.includes(variant);

const ALIASES = { LORENCIA: 'LOR_01', NORIA: 'NOR_01', DEVIAS: 'DEV_01', DUNGEON: 'DNG_01', LOST_TOWER: 'LT_01', ATLANS: 'ATL_01', TARKAN: 'TAR_01', ICARUS: 'ICA_01', VALLEY_OF_LOREN: 'VOL_01', BLOOD_CASTLE: 'EVT_01' };
export function canonicalTileScenario(id) { return ALIASES[id] || id; }

/** Grade visual sobre o topo de um bloco retangular, sem substituir sua geometria. */
export function createTiledBoxTop(THREE, box) {
  if (!box || box.geometry?.type !== 'BoxGeometry' || Array.isArray(box.material) ||
      box.rotation.x !== 0 || box.rotation.y !== 0 || box.rotation.z !== 0) return null;
  const { width, height, depth } = box.geometry.parameters;
  if (![width, height, depth].every(n => Number.isFinite(n) && n > 0)) return null;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), box.material);
  plane.position.set(box.position.x, box.position.y + height * box.scale.y / 2 + 0.002, box.position.z);
  plane.rotation.x = -Math.PI / 2;
  plane.scale.set(box.scale.x, box.scale.z, 1);
  plane.receiveShadow = box.receiveShadow;
  const controller = createTiledFloor(THREE, plane);
  plane.geometry.dispose();
  return controller;
}

/** Recebe a malha plana original, preservando posição, rotação e material. */
export function createTiledFloor(THREE, floor) {
  if (!floor || floor.geometry?.type !== 'PlaneGeometry' || Array.isArray(floor.material)) return null;
  const { width, height } = floor.geometry.parameters;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  const cols = Math.ceil(width / TILE_SIZE), rows = Math.ceil(height / TILE_SIZE);
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), floor.material.clone(), cols * rows);
  mesh.name = 'scenario_tiled_floor';
  mesh.position.copy(floor.position);
  mesh.rotation.copy(floor.rotation);
  mesh.scale.copy(floor.scale);
  mesh.receiveShadow = floor.receiveShadow;
  mesh.castShadow = floor.castShadow;
  // Peças 3D visuais são instanciadas separadamente; o plano continua sendo
  // a superfície de seleção. Não representam colisores do servidor.
  const slabGeometry = new THREE.BoxGeometry(0.96, 0.96, 0.12);
  const stoneGeometry = new THREE.CylinderGeometry(0.45, 0.49, 0.16, 4);
  stoneGeometry.rotateX(Math.PI / 2);
  stoneGeometry.rotateZ(Math.PI / 4);
  const modules = {
    laje: new THREE.InstancedMesh(slabGeometry, new THREE.MeshStandardMaterial({ color: 0x77736e, roughness: 0.95 }), cols * rows),
    pedra: new THREE.InstancedMesh(stoneGeometry, new THREE.MeshStandardMaterial({ color: 0x554e48, roughness: 1 }), cols * rows),
    muro_x: new THREE.InstancedMesh(new THREE.BoxGeometry(0.96, 0.12, 1.6), new THREE.MeshStandardMaterial({ color: 0x66615b, roughness: 1 }), cols * rows),
    muro_y: new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.96, 1.6), new THREE.MeshStandardMaterial({ color: 0x66615b, roughness: 1 }), cols * rows),
    arbusto: new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({ color: 0x455d35, roughness: 1 }), cols * rows),
  };
  const moduleCounts = Object.fromEntries(Object.keys(modules).map(name => [name, 0]));
  for (const [name, module] of Object.entries(modules)) {
    module.visible = false;
    module.name = `scenario_tile_${name}`;
    module.frustumCulled = false;
    module.receiveShadow = true;
    // O plano subjacente fornece a célula também quando uma peça está presente.
    module.raycast = () => {};
    mesh.add(module);
  }
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  const matrix = new THREE.Object3D();
  const color = new THREE.Color();
  const variants = {};
  const objects = {};
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const w = Math.min(TILE_SIZE, width - col * TILE_SIZE);
      const h = Math.min(TILE_SIZE, height - row * TILE_SIZE);
      matrix.position.set(-width / 2 + col * TILE_SIZE + w / 2, -height / 2 + row * TILE_SIZE + h / 2, 0);
      matrix.scale.set(w, h, 1);
      matrix.updateMatrix();
      const index = row * cols + col;
      mesh.setMatrixAt(index, matrix.matrix);
      mesh.setColorAt(index, color.setHex(TILE_VARIANTS.original));
      for (const module of Object.values(modules)) module.setMatrixAt(index, hidden);
    }
  }
  function setTile(col, row, variant) {
    return setLayer(col, row, variant, 'floor');
  }
  function setObject(col, row, variant) {
    return setLayer(col, row, variant, 'objects');
  }
  function setLayer(col, row, variant, layer) {
    if (!Number.isInteger(col) || !Number.isInteger(row) || col < 0 || row < 0 || col >= cols || row >= rows || typeof variant !== 'string' || !Object.hasOwn(TILE_VARIANTS, variant) || (variant !== 'original' && isObjectVariant(variant) !== (layer === 'objects'))) return false;
    const index = row * cols + col;
    const edits = layer === 'objects' ? objects : variants;
    const previous = edits[`${col},${row}`];
    if (layer === 'floor') {
      mesh.setColorAt(index, color.setHex(TILE_VARIANTS[variant]));
      mesh.instanceColor.needsUpdate = true;
    }
    const w = Math.min(TILE_SIZE, width - col * TILE_SIZE);
    const h = Math.min(TILE_SIZE, height - row * TILE_SIZE);
    for (const [name, module] of Object.entries(modules)) {
      if (isObjectVariant(name) !== (layer === 'objects')) continue;
      if (variant === name) {
        const elevation = name === 'laje' ? 0.11 : name === 'pedra' ? 0.13 : name === 'arbusto' ? 0.65 : 0.85;
        matrix.position.set(-width / 2 + col * TILE_SIZE + w / 2, -height / 2 + row * TILE_SIZE + h / 2, elevation);
        // Arbustos conservam porte menor em células grandes.
        matrix.scale.set(name === 'arbusto' ? Math.min(w, 2) : w, name === 'arbusto' ? Math.min(h, 2) : h, name === 'arbusto' ? 1.2 : 1);
        matrix.updateMatrix();
        module.setMatrixAt(index, matrix.matrix);
      } else module.setMatrixAt(index, hidden);
      if (previous !== variant) {
        if (previous === name) moduleCounts[name]--;
        if (variant === name) moduleCounts[name]++;
      }
      module.visible = moduleCounts[name] > 0;
      module.instanceMatrix.needsUpdate = true;
    }
    // O tile alterado aparece acima de detalhes planos (como o calçamento), sem alterar física.
    if (layer === 'floor') {
      const transform = new THREE.Matrix4();
      mesh.getMatrixAt(index, transform);
      transform.elements[14] = variant === 'original' ? 0 : 0.05;
      mesh.setMatrixAt(index, transform);
      mesh.instanceMatrix.needsUpdate = true;
    }
    if (variant === 'original') delete edits[`${col},${row}`];
    else edits[`${col},${row}`] = variant;
    return true;
  }
  function applyEdits(edits, layer = 'floor') {
    if (!edits || typeof edits !== 'object' || Array.isArray(edits)) return;
    for (const [key, variant] of Object.entries(edits)) {
      if (!/^\d+,\d+$/.test(key)) continue;
      const [col, row] = key.split(',').map(Number);
      (layer === 'objects' ? setObject : setTile)(col, row, variant);
    }
  }
  function clearEdits() {
    for (const [layer, setter] of [[variants, setTile], [objects, setObject]]) {
      for (const key of Object.keys(layer)) {
        const [col, row] = key.split(',').map(Number);
        setter(col, row, 'original');
      }
    }
  }
  return { mesh, cols, rows, width, height, setTile, setObject, applyEdits, clearEdits, getEdits: () => ({ ...variants }), getObjects: () => ({ ...objects }) };
}

/** Migra documentos antigos com uma única camada sem modificar os dados originais. */
export function tileDocumentLayers(data) {
  if (data?.version === 2) return { floor: data.floor, objects: data.objects };
  const floor = {}, objects = {};
  for (const [key, value] of Object.entries(data?.edits || {})) {
    (isObjectVariant(value) ? objects : floor)[key] = value;
  }
  return { floor, objects };
}

export function makeTileDocument(id, controller) {
  return { version: 2, scenarioId: canonicalTileScenario(id), tileSize: TILE_SIZE, cols: controller.cols, rows: controller.rows, floor: controller.getEdits(), objects: controller.getObjects() };
}

export function loadTileEdits(id, controller) {
  try {
    const data = JSON.parse(globalThis.localStorage?.getItem(`dasi:tiles:v1:${canonicalTileScenario(id)}`) || 'null');
    // Arquivos locais v1 anteriores não incluíam dimensões.
    if (data?.version === 1 && data.tileSize === undefined) data.tileSize = TILE_SIZE, data.cols = controller.cols, data.rows = controller.rows;
    return validateTileDocument(data, id, controller) ? tileDocumentLayers(data) : { floor: {}, objects: {} };
  } catch { return { floor: {}, objects: {} }; }
}

export function saveTileEdits(id, controller) {
  try {
    if (!globalThis.localStorage) return false;
    globalThis.localStorage.setItem(`dasi:tiles:v1:${canonicalTileScenario(id)}`, JSON.stringify(makeTileDocument(id, controller)));
    return true;
  } catch { return false; }
}

/** Valida integralmente antes de modificar qualquer camada. */
export function validateTileDocument(data, scenarioId, controller) {
  if (!data || ![1, 2].includes(data.version) || data.scenarioId !== canonicalTileScenario(scenarioId) ||
      data.tileSize !== TILE_SIZE || data.cols !== controller.cols || data.rows !== controller.rows) return false;
  const validEntries = (edits, layer) => {
    if (!edits || typeof edits !== 'object' || Array.isArray(edits)) return false;
    const entries = Object.entries(edits);
    if (entries.length > controller.cols * controller.rows) return false;
    return entries.every(([key, variant]) => {
      if (!/^(0|[1-9]\d*),(0|[1-9]\d*)$/.test(key) || typeof variant !== 'string' || !Object.hasOwn(TILE_VARIANTS, variant)) return false;
      if (variant !== 'original' && layer !== 'legacy' && isObjectVariant(variant) !== (layer === 'objects')) return false;
      const [col, row] = key.split(',').map(Number);
      return Number.isSafeInteger(col) && Number.isSafeInteger(row) && col < controller.cols && row < controller.rows;
    });
  };
  return data.version === 1 ? validEntries(data.edits, 'legacy') : validEntries(data.floor, 'floor') && validEntries(data.objects, 'objects');
}
