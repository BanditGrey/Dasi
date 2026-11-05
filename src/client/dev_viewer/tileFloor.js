/** Pisos visuais em células 4x4. Não modifica colisões ou o servidor. */
export const TILE_SIZE = 4;
export const TILE_VARIANTS = Object.freeze({
  original: 0xffffff,
  escuro: 0xa1a1a1,
  claro: 0xd7d7d7,
  musgo: 0x91aa86,
  terra: 0xc4a682,
});

const ALIASES = { LORENCIA: 'LOR_01', NORIA: 'NOR_01', DEVIAS: 'DEV_01', DUNGEON: 'DNG_01', LOST_TOWER: 'LT_01', ATLANS: 'ATL_01', TARKAN: 'TAR_01', ICARUS: 'ICA_01', VALLEY_OF_LOREN: 'VOL_01', BLOOD_CASTLE: 'EVT_01' };
export function canonicalTileScenario(id) { return ALIASES[id] || id; }

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
  const matrix = new THREE.Object3D();
  const color = new THREE.Color();
  const variants = {};
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
    }
  }
  function setTile(col, row, variant) {
    if (!Number.isInteger(col) || !Number.isInteger(row) || col < 0 || row < 0 || col >= cols || row >= rows || typeof variant !== 'string' || !Object.hasOwn(TILE_VARIANTS, variant)) return false;
    const index = row * cols + col;
    mesh.setColorAt(index, color.setHex(TILE_VARIANTS[variant]));
    mesh.instanceColor.needsUpdate = true;
    // O tile alterado aparece acima de detalhes planos (como o calçamento), sem alterar física.
    const transform = new THREE.Matrix4();
    mesh.getMatrixAt(index, transform);
    transform.elements[14] = variant === 'original' ? 0 : 0.05;
    mesh.setMatrixAt(index, transform);
    mesh.instanceMatrix.needsUpdate = true;
    if (variant === 'original') delete variants[`${col},${row}`];
    else variants[`${col},${row}`] = variant;
    return true;
  }
  function applyEdits(edits) {
    if (!edits || typeof edits !== 'object' || Array.isArray(edits)) return;
    for (const [key, variant] of Object.entries(edits)) {
      if (!/^\d+,\d+$/.test(key)) continue;
      const [col, row] = key.split(',').map(Number);
      setTile(col, row, variant);
    }
  }
  return { mesh, cols, rows, width, height, setTile, applyEdits, getEdits: () => ({ ...variants }) };
}

export function loadTileEdits(id) {
  try {
    const data = JSON.parse(globalThis.localStorage?.getItem(`dasi:tiles:v1:${canonicalTileScenario(id)}`) || 'null');
    return data?.version === 1 && data.scenarioId === canonicalTileScenario(id) ? data.edits : {};
  } catch { return {}; }
}

export function saveTileEdits(id, controller) {
  try {
    if (!globalThis.localStorage) return false;
    const scenarioId = canonicalTileScenario(id);
    globalThis.localStorage.setItem(`dasi:tiles:v1:${scenarioId}`, JSON.stringify({ version: 1, scenarioId, edits: controller.getEdits() }));
    return true;
  } catch { return false; }
}

/** Valida arquivo antes de modificar o estado atual; limita o tamanho à grade. */
export function validateTileDocument(data, scenarioId, controller) {
  if (!data || data.version !== 1 || data.scenarioId !== canonicalTileScenario(scenarioId) ||
      data.tileSize !== TILE_SIZE || data.cols !== controller.cols || data.rows !== controller.rows ||
      !data.edits || typeof data.edits !== 'object' || Array.isArray(data.edits)) return false;
  const entries = Object.entries(data.edits);
  if (entries.length > controller.cols * controller.rows) return false;
  return entries.every(([key, variant]) => {
    if (!/^\d+,\d+$/.test(key) || typeof variant !== 'string' || !Object.hasOwn(TILE_VARIANTS, variant)) return false;
    const [col, row] = key.split(',').map(Number);
    return Number.isSafeInteger(col) && Number.isSafeInteger(row) && col < controller.cols && row < controller.rows;
  });
}
