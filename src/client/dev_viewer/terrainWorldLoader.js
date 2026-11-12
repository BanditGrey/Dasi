/**
 * DASI MMORPG - LOADER DE OBJETOS E MUNDOS CANÔNICOS (DEV VIEWER)
 * Engenharia reversa dos layouts de mapa (EncTerrain*.obj) do MU Online Season 5.2.
 * Converte coordenadas clássicas (Z-up, escala 100.0) para o espaço Three.js (Y-up, metros).
 */

export const MU_TERRAIN_SCALE = 100.0; // Conforme #define TERRAIN_SCALE 100.f (ZzzLodTerrain.h)

/**
 * Converte coordenadas canônicas do MU Online para Three.js:
 * MU Online: X=horizontal, Y=profundidade horizontal, Z=elevação vertical.
 * Three.js:  X=horizontal, Y=elevação vertical,        Z=profundidade horizontal.
 */
export function muToThreeCoords(muPos) {
  if (!muPos) return { x: 0, y: 0, z: 0 };
  return {
    x: Number((muPos.x / MU_TERRAIN_SCALE).toFixed(3)),
    y: Number((muPos.z / MU_TERRAIN_SCALE).toFixed(3)),
    z: Number((muPos.y / MU_TERRAIN_SCALE).toFixed(3)),
  };
}

/**
 * Converte rotação canônica em graus para radianos (Yaw, Pitch, Roll).
 */
export function muToThreeRotation(muAngle) {
  if (!muAngle) return { x: 0, y: 0, z: 0 };
  const degToRad = Math.PI / 180;
  return {
    x: Number(((muAngle.pitch || 0) * degToRad).toFixed(4)),
    y: Number(((muAngle.yaw || 0) * degToRad).toFixed(4)),
    z: Number(((muAngle.roll || 0) * degToRad).toFixed(4)),
  };
}

/**
 * Busca a lista de mapas canônicos disponíveis na API do servidor.
 */
export async function fetchCanonicalMapsList(baseUrl = '') {
  try {
    const res = await fetch(`${baseUrl}/api/canonical-maps`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Busca o sumário e disposição de objetos de um mapa específico.
 */
export async function fetchCanonicalMap(mapId, baseUrl = '') {
  try {
    const res = await fetch(`${baseUrl}/api/canonical-maps/${encodeURIComponent(mapId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Filtra instâncias de objetos que residem dentro da caixa delimitadora do cenário.
 */
export function filterObjectsInBounds(objects, bounds) {
  if (!Array.isArray(objects) || !bounds) return [];
  const { minX, maxX, minZ, maxZ } = bounds;

  return objects.filter((obj) => {
    const pos = muToThreeCoords(obj.position);
    return pos.x >= minX && pos.x <= maxX && pos.z >= minZ && pos.z <= maxZ;
  });
}

/**
 * Gera instâncias Three.js para os objetos de um layout canônico.
 */
export function createObjectMarkersGroup(objects, THREE) {
  if (!THREE || !Array.isArray(objects)) return null;

  const group = new THREE.Group();
  group.name = 'CanonicalWorldObjects';

  const geom = new THREE.BoxGeometry(0.8, 1.2, 0.8);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.4,
    metalness: 0.1,
    wireframe: false,
  });

  for (const obj of objects) {
    const mesh = new THREE.Mesh(geom, mat);
    const pos = muToThreeCoords(obj.position);
    const rot = muToThreeRotation(obj.angle);

    mesh.position.set(pos.x, pos.y + 0.6, pos.z);
    mesh.rotation.set(rot.x, rot.y, rot.z);
    mesh.scale.setScalar(Math.max(0.2, obj.scale || 1.0));
    mesh.userData = {
      muIndex: obj.index,
      muType: obj.type,
      canonicalScale: obj.scale,
    };

    group.add(mesh);
  }

  return group;
}
