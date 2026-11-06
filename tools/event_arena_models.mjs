import * as THREE from 'three';

/**
 * Static, portable Three.js scene sources for the three Event Arena GLBs.
 * The server collision catalog remains authoritative; these scenes contain no
 * colliders, lights, particles, text glyphs, or gameplay animation.
 */

const UP = new THREE.Vector3(0, 1, 0);
const TAU = Math.PI * 2;

function pbr(name, color, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0.12,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
    flatShading: options.flatShading ?? false,
  });
  material.name = name;
  return material;
}

function group(parent, name) {
  const object = new THREE.Group();
  object.name = name;
  parent.add(object);
  return object;
}

function addMesh(parent, name, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.position.set(position[0], position[1], position[2]);
  object.rotation.set(rotation[0], rotation[1], rotation[2]);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function box(parent, name, material, position, size, rotationY = 0) {
  const object = addMesh(parent, name, new THREE.BoxGeometry(size[0], size[1], size[2]), material, position);
  object.rotation.y = rotationY;
  return object;
}

function cylinder(parent, name, material, position, radiusTop, radiusBottom, height, segments = 16) {
  return addMesh(parent, name, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material, position);
}

function sphere(parent, name, material, position, scale, segments = 16) {
  const object = addMesh(parent, name, new THREE.SphereGeometry(1, segments, Math.max(8, Math.floor(segments * 0.65))), material, position);
  object.scale.set(scale[0], scale[1], scale[2]);
  return object;
}

function horizontalRing(parent, name, material, radius, tube, y, segments = 80) {
  return addMesh(
    parent,
    name,
    new THREE.TorusGeometry(radius, tube, 8, segments),
    material,
    [0, y, 0],
    [Math.PI / 2, 0, 0],
  );
}

function beamBetween(parent, name, material, start, end, radius = 0.1, segments = 8) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const object = addMesh(
    parent,
    name,
    new THREE.CylinderGeometry(radius, radius, direction.length(), segments),
    material,
    a.clone().add(b).multiplyScalar(0.5).toArray(),
  );
  object.quaternion.setFromUnitVectors(UP, direction.normalize());
  return object;
}

function horizontalBeam(parent, name, material, x1, z1, x2, z2, y, width, thickness) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  return box(
    parent,
    name,
    material,
    [(x1 + x2) / 2, y, (z1 + z2) / 2],
    [length, thickness, width],
    -Math.atan2(dz, dx),
  );
}

function circleFloor(parent, name, material, radius, y, segments = 96) {
  return addMesh(
    parent,
    name,
    new THREE.CircleGeometry(radius, segments),
    material,
    [0, y, 0],
    [-Math.PI / 2, 0, 0],
  );
}

function octagonRingGeometry(innerRadius, outerRadius, height, sides = 8, angleOffset = Math.PI / 8) {
  const positions = [];
  const indices = [];
  const addQuad = (points) => {
    const start = positions.length / 3;
    for (const point of points) positions.push(point[0], point[1], point[2]);
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };
  const point = (radius, angle, y) => [Math.cos(angle) * radius, y, Math.sin(angle) * radius];

  for (let i = 0; i < sides; i++) {
    const a0 = angleOffset + (i / sides) * TAU;
    const a1 = angleOffset + ((i + 1) / sides) * TAU;
    const i0 = point(innerRadius, a0, height);
    const i1 = point(innerRadius, a1, height);
    const o0 = point(outerRadius, a0, height);
    const o1 = point(outerRadius, a1, height);
    const ib0 = point(innerRadius, a0, 0);
    const ib1 = point(innerRadius, a1, 0);
    const ob0 = point(outerRadius, a0, 0);
    const ob1 = point(outerRadius, a1, 0);

    // Top, underside, outer wall and inner wall of this octagonal seating tier.
    addQuad([i0, i1, o1, o0]);
    addQuad([ib0, ob0, ob1, ib1]);
    addQuad([ob0, o0, o1, ob1]);
    addQuad([ib0, ib1, i1, i0]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeArenaRoot(name, scenarioId, title) {
  const root = new THREE.Group();
  root.name = name;
  root.userData = {
    assetKind: 'event-arena-static-visual',
    assetVersion: 1,
    scenarioId,
    title,
    staticVisualOnly: true,
    collisionsIncluded: false,
    runtimeEffectsIncluded: false,
  };
  return root;
}

function addFlutedColumn(parent, name, x, z, bottom, height, radius, stone, accent, segments = 16) {
  const shaftHeight = height - 1.05;
  cylinder(parent, `${name}_base`, stone, [x, bottom + 0.18, z], radius * 1.38, radius * 1.48, 0.36, segments);
  cylinder(parent, `${name}_foot_moulding`, accent, [x, bottom + 0.43, z], radius * 1.19, radius * 1.19, 0.16, segments);
  cylinder(parent, `${name}_shaft`, stone, [x, bottom + 0.48 + shaftHeight / 2, z], radius * 0.74, radius, shaftHeight, segments);
  for (let rib = 0; rib < 8; rib++) {
    const angle = (rib / 8) * TAU;
    const rx = x + Math.cos(angle) * radius * 0.72;
    const rz = z + Math.sin(angle) * radius * 0.72;
    cylinder(parent, `${name}_flute_${String(rib + 1).padStart(2, '0')}`, accent, [rx, bottom + 0.48 + shaftHeight / 2, rz], radius * 0.045, radius * 0.045, shaftHeight * 0.92, 6);
  }
  cylinder(parent, `${name}_capital`, accent, [x, bottom + height - 0.37, z], radius * 1.35, radius * 1.1, 0.42, segments);
  box(parent, `${name}_abacus`, stone, [x, bottom + height - 0.08, z], [radius * 2.9, 0.24, radius * 2.9]);
}

function addGothicArch(parent, name, center, tangent, radial, yBase, height, halfWidth, material, tubeRadius = 0.24) {
  const point = (side, up) => [
    center[0] + tangent[0] * side + radial[0] * 0.06,
    yBase + up,
    center[1] + tangent[1] * side + radial[1] * 0.06,
  ];
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(...point(-halfWidth, 0)),
    new THREE.Vector3(...point(-halfWidth, height * 0.58)),
    new THREE.Vector3(...point(-halfWidth * 0.52, height * 0.82)),
    new THREE.Vector3(...point(0, height)),
    new THREE.Vector3(...point(halfWidth * 0.52, height * 0.82)),
    new THREE.Vector3(...point(halfWidth, height * 0.58)),
    new THREE.Vector3(...point(halfWidth, 0)),
  ], false, 'centripetal');
  return addMesh(parent, name, new THREE.TubeGeometry(curve, 32, tubeRadius, 8, false), material);
}

function addPentagram(parent, materials) {
  const group = new THREE.Group();
  group.name = 'devil_square_pentagram';
  const radius = 13.2;
  const points = Array.from({ length: 5 }, (_, index) => {
    const angle = -Math.PI / 2 + (index / 5) * TAU;
    return [Math.cos(angle) * radius, 0.09, Math.sin(angle) * radius];
  });
  horizontalRing(group, 'devil_square_pentagram_outer_inlay', materials.brass, radius + 0.75, 0.09, 0.075, 96);
  horizontalRing(group, 'devil_square_pentagram_inner_ward', materials.greenRunes, 4.45, 0.07, 0.078, 64);
  for (let index = 0; index < 5; index++) {
    const start = points[index];
    const end = points[(index + 2) % 5];
    beamBetween(group, `devil_square_pentagram_rune_${String(index + 1).padStart(2, '0')}`, materials.greenRunes, start, end, 0.115, 8);
  }
  for (let index = 0; index < 10; index++) {
    const angle = (index / 10) * TAU;
    const rune = addMesh(
      group,
      `devil_square_floor_sigils_${String(index + 1).padStart(2, '0')}`,
      new THREE.OctahedronGeometry(0.22, 0),
      index % 2 ? materials.goldRunes : materials.greenRunes,
      [Math.cos(angle) * 17.8, 0.11, Math.sin(angle) * 17.8],
    );
    rune.scale.set(1, 0.18, 1);
    rune.rotation.y = angle;
  }
  parent.add(group);
  return group;
}

function addSkullTotem(parent, cardinal, x, z, faceYaw, materials) {
  const totem = group(parent, `devil_square_skull_totem_${cardinal}`);
  totem.position.set(x, 0, z);
  totem.rotation.y = faceYaw;
  cylinder(totem, `${cardinal}_totem_foot`, materials.stone, [0, 0.26, 0], 1.48, 1.65, 0.52, 12);
  cylinder(totem, `${cardinal}_totem_base_trim`, materials.brass, [0, 0.58, 0], 1.34, 1.42, 0.14, 12);
  cylinder(totem, `${cardinal}_totem_shaft`, materials.darkStone, [0, 2.12, 0], 0.94, 1.18, 2.95, 12);
  cylinder(totem, `${cardinal}_totem_shaft_ring_low`, materials.stoneEdge, [0, 0.86, 0], 1.05, 1.12, 0.18, 12);
  cylinder(totem, `${cardinal}_totem_shaft_ring_high`, materials.brass, [0, 3.44, 0], 1.14, 1.14, 0.22, 12);
  cylinder(totem, `${cardinal}_totem_capital`, materials.stone, [0, 3.68, 0], 1.3, 1.05, 0.28, 12);

  const skull = group(totem, `${cardinal}_carved_skull`);
  skull.position.set(0, 4.55, 0.02);
  sphere(skull, `${cardinal}_skull_cranium`, materials.bone, [0, 0, 0], [0.82, 0.66, 0.58], 20);
  box(skull, `${cardinal}_skull_jaw`, materials.bone, [0, -0.51, 0.13], [1.08, 0.35, 0.7]);
  box(skull, `${cardinal}_skull_mouth_shadow`, materials.black, [0, -0.39, 0.47], [0.72, 0.23, 0.12]);
  for (let tooth = 0; tooth < 5; tooth++) {
    const tx = (tooth - 2) * 0.16;
    box(skull, `${cardinal}_skull_tooth_${tooth + 1}`, materials.ivory, [tx, -0.4, 0.54], [0.075, 0.16, 0.06]);
  }
  for (const side of [-1, 1]) {
    sphere(skull, `${cardinal}_skull_eye_socket_${side < 0 ? 'left' : 'right'}`, materials.black, [side * 0.31, 0.06, 0.49], [0.22, 0.2, 0.12], 12);
    sphere(skull, `${cardinal}_skull_ember_eye_${side < 0 ? 'left' : 'right'}`, materials.greenRunes, [side * 0.31, 0.06, 0.595], [0.095, 0.11, 0.045], 12);
    const horn = addMesh(skull, `${cardinal}_skull_horn_${side < 0 ? 'left' : 'right'}`, new THREE.ConeGeometry(0.25, 1.05, 8), materials.bone, [side * 0.64, 0.54, 0.06]);
    horn.rotation.z = side * -0.58;
    horn.rotation.x = -0.08;
  }
  const brow = addMesh(skull, `${cardinal}_skull_brow_ridge`, new THREE.TorusGeometry(0.37, 0.095, 8, 18, Math.PI), materials.ivory, [0, 0.27, 0.48]);
  brow.rotation.z = Math.PI;
  for (let band = 0; band < 3; band++) {
    box(skull, `${cardinal}_skull_forehead_rune_${band + 1}`, materials.brass, [0, 0.46 + band * 0.08, 0.55], [0.33 - band * 0.055, 0.035, 0.045]);
  }

  const flame = addMesh(totem, `${cardinal}_totem_everflame_outer`, new THREE.ConeGeometry(0.72, 1.55, 9), materials.orangeFire, [0, 5.65, -0.05]);
  flame.rotation.z = Math.PI;
  const innerFlame = addMesh(totem, `${cardinal}_totem_everflame_inner`, new THREE.ConeGeometry(0.4, 1.15, 8), materials.greenRunes, [0, 5.7, 0.02]);
  innerFlame.rotation.z = Math.PI;
  totem.userData.cardinal = cardinal;
  return totem;
}

function addTriumphChest(parent, materials) {
  const chest = group(parent, 'devil_square_triumph_chest');
  cylinder(chest, 'devil_square_chest_pedestal_base', materials.brass, [0, 0.24, 0], 1.65, 1.82, 0.48, 12);
  cylinder(chest, 'devil_square_chest_pedestal_stone', materials.stone, [0, 0.63, 0], 1.38, 1.55, 0.34, 12);
  horizontalRing(chest, 'devil_square_chest_pedestal_rune_ring', materials.goldRunes, 1.38, 0.07, 0.81, 48);
  box(chest, 'devil_square_chest_body', materials.chestGold, [0, 1.48, 0], [1.9, 1.15, 1.42]);
  box(chest, 'devil_square_chest_front_panel', materials.brass, [0, 1.48, 0.73], [1.42, 0.7, 0.06]);
  box(chest, 'devil_square_chest_lid', materials.chestGold, [0, 2.12, 0], [2.06, 0.24, 1.55]);
  const lidArch = addMesh(chest, 'devil_square_chest_crowned_lid', new THREE.SphereGeometry(1, 20, 12, 0, TAU, 0, Math.PI / 2), materials.chestGold, [0, 2.17, 0]);
  lidArch.scale.set(1.04, 0.48, 0.78);
  box(chest, 'devil_square_chest_lock_plate', materials.goldRunes, [0, 1.54, 0.79], [0.32, 0.46, 0.08]);
  sphere(chest, 'devil_square_chest_heart_jewel', materials.greenRunes, [0, 1.57, 0.88], [0.16, 0.21, 0.08], 12);
  for (const side of [-1, 1]) {
    box(chest, `devil_square_chest_corner_guard_${side < 0 ? 'left' : 'right'}`, materials.brass, [side * 0.83, 1.55, 0.76], [0.16, 0.88, 0.09]);
  }
  chest.position.y = 0;
  return chest;
}

export function buildDevilSquare() {
  const root = makeArenaRoot('DEVIL_SQUARE', 'EVT_02', 'Devil Square — Praça Circular da Carnificina Pentagramal');
  const materials = {
    foundation: pbr('DS_BasaltFoundation', 0x15171d, { roughness: 0.9 }),
    floor: pbr('DS_GraniteFloor', 0x2a2a2f, { roughness: 0.82, metalness: 0.08 }),
    darkStone: pbr('DS_ObsidianStone', 0x24252a, { roughness: 0.76, metalness: 0.16 }),
    stone: pbr('DS_CarvedStone', 0x44434b, { roughness: 0.84, metalness: 0.08 }),
    stoneEdge: pbr('DS_WornEdge', 0x777078, { roughness: 0.7, metalness: 0.18 }),
    iron: pbr('DS_BlackIron', 0x20252d, { roughness: 0.31, metalness: 0.88 }),
    brass: pbr('DS_AgedBrass', 0x8e6b32, { roughness: 0.38, metalness: 0.78 }),
    ivory: pbr('DS_BoneIvory', 0xd0c49c, { roughness: 0.68, metalness: 0.03 }),
    bone: pbr('DS_WeatheredBone', 0xa99d7d, { roughness: 0.78, metalness: 0.02 }),
    black: pbr('DS_SocketShadow', 0x080b10, { roughness: 0.95, metalness: 0.02 }),
    orangeFire: pbr('DS_EverflameOrange', 0xff651f, { roughness: 0.32, emissive: 0xf04410, emissiveIntensity: 2.4 }),
    greenRunes: pbr('DS_EmeraldHellfire', 0x36d883, { roughness: 0.28, metalness: 0.12, emissive: 0x13c783, emissiveIntensity: 2.3 }),
    goldRunes: pbr('DS_TriumphGold', 0xe5a82c, { roughness: 0.3, metalness: 0.7, emissive: 0xa66d0b, emissiveIntensity: 1.2 }),
    chestGold: pbr('DS_ChestGold', 0xb58227, { roughness: 0.26, metalness: 0.84 }),
  };

  cylinder(root, 'devil_square_foundation', materials.foundation, [0, -0.39, 0], 24.75, 25.0, 0.78, 96);
  circleFloor(root, 'devil_square_floor', materials.floor, 24.45, 0.012, 96);
  horizontalRing(root, 'devil_square_inner_masonry_ring', materials.stoneEdge, 22.8, 0.18, 0.08, 96);
  horizontalRing(root, 'devil_square_outer_masonry_ring', materials.brass, 24.18, 0.2, 0.09, 96);
  horizontalRing(root, 'devil_square_floor_ward_ring_01', materials.darkStone, 7.2, 0.09, 0.065, 96);
  horizontalRing(root, 'devil_square_floor_ward_ring_02', materials.brass, 10.15, 0.055, 0.07, 96);
  addPentagram(root, materials);

  const cage = group(root, 'devil_square_iron_cage');
  horizontalRing(cage, 'devil_square_cage_lower_rail', materials.iron, 24.35, 0.19, 0.62, 96);
  horizontalRing(cage, 'devil_square_cage_mid_rail', materials.iron, 24.35, 0.11, 3.1, 96);
  horizontalRing(cage, 'devil_square_cage_crown_rail', materials.iron, 24.35, 0.2, 5.82, 96);
  for (let index = 0; index < 64; index++) {
    const angle = (index / 64) * TAU;
    const x = Math.cos(angle) * 24.35;
    const z = Math.sin(angle) * 24.35;
    cylinder(cage, `devil_square_cage_bar_${String(index + 1).padStart(2, '0')}`, materials.iron, [x, 3.2, z], 0.085, 0.105, 5.15, 6);
    const spike = addMesh(cage, `devil_square_cage_spike_${String(index + 1).padStart(2, '0')}`, new THREE.ConeGeometry(0.18, 0.55, 6), materials.brass, [x, 6.13, z]);
    spike.rotation.z = Math.PI;
  }
  for (let index = 0; index < 16; index++) {
    const angle = (index / 16) * TAU;
    const x = Math.cos(angle) * 24.1;
    const z = Math.sin(angle) * 24.1;
    cylinder(cage, `devil_square_cage_buttress_${String(index + 1).padStart(2, '0')}`, materials.stone, [x, 2.95, z], 0.34, 0.57, 5.9, 8);
    cylinder(cage, `devil_square_cage_buttress_cap_${String(index + 1).padStart(2, '0')}`, materials.brass, [x, 5.95, z], 0.7, 0.55, 0.34, 8);
  }

  const totems = [
    ['north', 0, 16, Math.PI],
    ['east', 16, 0, -Math.PI / 2],
    ['south', 0, -16, 0],
    ['west', -16, 0, Math.PI / 2],
  ];
  for (const [cardinal, x, z, yaw] of totems) addSkullTotem(root, cardinal, x, z, yaw, materials);
  addTriumphChest(root, materials);

  for (let index = 0; index < 8; index++) {
    const angle = (index / 8) * TAU + Math.PI / 8;
    const x = Math.cos(angle) * 20.4;
    const z = Math.sin(angle) * 20.4;
    const brazier = group(root, `devil_square_brazier_${String(index + 1).padStart(2, '0')}`);
    cylinder(brazier, `devil_square_brazier_foot_${index + 1}`, materials.stone, [x, 0.26, z], 0.56, 0.68, 0.52, 10);
    cylinder(brazier, `devil_square_brazier_stem_${index + 1}`, materials.iron, [x, 1.0, z], 0.22, 0.32, 1.0, 8);
    cylinder(brazier, `devil_square_brazier_bowl_${index + 1}`, materials.brass, [x, 1.62, z], 0.68, 0.36, 0.28, 10);
    const fire = addMesh(brazier, `devil_square_brazier_flame_${index + 1}`, new THREE.ConeGeometry(0.38, 1.1, 8), index % 2 ? materials.orangeFire : materials.greenRunes, [x, 2.24, z]);
    fire.rotation.z = Math.PI;
  }

  return root;
}

function addChaosTile(parent, row, column, materials) {
  const tileName = `chaos_castle_tile_r${String(row).padStart(2, '0')}_c${String(column).padStart(2, '0')}`;
  const tile = group(parent, tileName);
  const x = (column - 2.5) * 7;
  const z = (row - 2.5) * 7;
  tile.position.set(x, 0, z);
  tile.userData.tile = { row, column, staticVisualOnly: true };
  const variant = (row * 5 + column * 3) % 4;
  const topMaterial = variant === 0 ? materials.slabLight : variant === 1 ? materials.slabWarm : materials.slab;
  box(tile, `${tileName}_load_bearing_slab`, materials.slabEdge, [0, -0.34, 0], [6.76, 0.82, 6.76]);
  box(tile, `${tileName}_stone_face`, topMaterial, [0, 0.13, 0], [6.42, 0.16, 6.42]);
  for (let side = -1; side <= 1; side += 2) {
    box(tile, `${tileName}_inlaid_edge_x_${side < 0 ? 'west' : 'east'}`, materials.violetMetal, [side * 3.02, 0.232, 0], [0.1, 0.035, 6.12]);
    box(tile, `${tileName}_inlaid_edge_z_${side < 0 ? 'south' : 'north'}`, materials.violetMetal, [0, 0.232, side * 3.02], [6.12, 0.035, 0.1]);
  }
  for (let corner = 0; corner < 4; corner++) {
    const sx = corner % 2 === 0 ? -1 : 1;
    const sz = corner < 2 ? -1 : 1;
    const rivet = addMesh(tile, `${tileName}_corner_rivet_${corner + 1}`, new THREE.OctahedronGeometry(0.14, 0), materials.brass, [sx * 2.76, 0.25, sz * 2.76]);
    rivet.scale.set(1, 0.42, 1);
  }
  if ((row + column) % 3 === 0) {
    const rune = addMesh(tile, `${tileName}_ward_sigillum`, new THREE.OctahedronGeometry(0.8, 0), materials.rune, [0, 0.255, 0]);
    rune.scale.set(1, 0.075, 0.58);
  } else {
    horizontalRing(tile, `${tileName}_stone_engraving`, materials.runeDim, 1.48, 0.035, 0.25, 24);
    const centralMark = addMesh(tile, `${tileName}_central_mark`, new THREE.BoxGeometry(0.9, 0.045, 0.12), materials.runeDim, [0, 0.255, 0]);
    centralMark.rotation.y = (row + column) % 2 ? Math.PI / 4 : -Math.PI / 4;
  }
  return tile;
}

function addBrokenGothicRuins(parent, index, x, z, materials) {
  const ruin = group(parent, `chaos_castle_ruin_${String(index + 1).padStart(2, '0')}`);
  ruin.position.set(x, 0, z);
  const side = index % 2 === 0 ? 1 : -1;
  const yaw = Math.atan2(-x, -z);
  ruin.rotation.y = yaw;
  cylinder(ruin, `chaos_castle_ruin_${index + 1}_foot`, materials.ruinStone, [0, 0.32, 0], 2.2, 2.6, 0.64, 8);
  for (let pillar = 0; pillar < 2; pillar++) {
    const px = pillar === 0 ? -2.1 : 2.1;
    cylinder(ruin, `chaos_castle_ruin_${index + 1}_pillar_${pillar + 1}`, materials.ruinStone, [px, 3.75 + (pillar === 1 ? 0.7 : 0), 0], 0.72, 1.0, 6.8 + (pillar === 1 ? 1.4 : 0), 10);
    cylinder(ruin, `chaos_castle_ruin_${index + 1}_capital_${pillar + 1}`, materials.violetMetal, [px, 7.1 + (pillar === 1 ? 0.7 : 0), 0], 1.18, 0.86, 0.48, 8);
    const cap = addMesh(ruin, `chaos_castle_ruin_${index + 1}_broken_spire_${pillar + 1}`, new THREE.ConeGeometry(0.55, 1.8, 6), materials.rune, [px, 8.35 + (pillar === 1 ? 0.7 : 0), 0]);
    cap.rotation.z = (pillar === 0 ? -1 : 1) * 0.16 * side;
  }
  horizontalBeam(ruin, `chaos_castle_ruin_${index + 1}_lintel_left`, materials.ruinStone, -2.1, 0, 0, 0, 7.5, 0.9, 0.9);
  horizontalBeam(ruin, `chaos_castle_ruin_${index + 1}_lintel_right`, materials.ruinStone, 0, 0, 2.1, 0, 7.5, 0.9, 0.9);
  beamBetween(ruin, `chaos_castle_ruin_${index + 1}_pointed_arch_left`, materials.violetMetal, [-2.1, 7.5, 0], [0, 10.1, 0], 0.36, 8);
  beamBetween(ruin, `chaos_castle_ruin_${index + 1}_pointed_arch_right`, materials.violetMetal, [0, 10.1, 0], [2.1, 7.5, 0], 0.36, 8);
  for (let shard = 0; shard < 3; shard++) {
    const gargoyle = addMesh(ruin, `chaos_castle_ruin_${index + 1}_gargoyle_shard_${shard + 1}`, new THREE.DodecahedronGeometry(0.7 + shard * 0.1, 0), materials.ruinStone, [(shard - 1) * 0.7, 5.2 + shard * 0.45, 0.85]);
    gargoyle.rotation.set(shard * 0.5, shard * 0.75, shard * 0.32);
  }
  return ruin;
}

function addFloatingAbyssShard(parent, index, angle, radius, y, size, materials) {
  const shard = addMesh(
    parent,
    `chaos_castle_floating_abyss_shard_${String(index + 1).padStart(2, '0')}`,
    new THREE.DodecahedronGeometry(size, 0),
    index % 3 === 0 ? materials.violetRock : materials.voidStone,
    [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
  );
  shard.rotation.set(index * 0.31, angle * 1.7, index * 0.57);
  shard.scale.set(1.15, 0.6 + (index % 3) * 0.18, 0.9);
  return shard;
}

export function buildChaosCastle() {
  const root = makeArenaRoot('CHAOS_CASTLE', 'EVT_03', 'Chaos Castle — Coliseu Suspenso das Lajes Desabantes');
  const materials = {
    slab: pbr('CC_BasaltSlate', 0x383940, { roughness: 0.78, metalness: 0.18 }),
    slabLight: pbr('CC_AshSlate', 0x4e4d56, { roughness: 0.8, metalness: 0.13 }),
    slabWarm: pbr('CC_CharredSlate', 0x393238, { roughness: 0.83, metalness: 0.1 }),
    slabEdge: pbr('CC_BrokenBasalt', 0x202129, { roughness: 0.88, metalness: 0.2 }),
    violetMetal: pbr('CC_VioletIron', 0x55415e, { roughness: 0.34, metalness: 0.85 }),
    brass: pbr('CC_OldBrass', 0x89703b, { roughness: 0.4, metalness: 0.78 }),
    rune: pbr('CC_ChaosRune', 0xb870ff, { roughness: 0.25, metalness: 0.22, emissive: 0x8429cf, emissiveIntensity: 1.85 }),
    runeDim: pbr('CC_FaintRune', 0x806191, { roughness: 0.48, metalness: 0.45, emissive: 0x542d78, emissiveIntensity: 0.55 }),
    voidStone: pbr('CC_VoidStone', 0x100d18, { roughness: 0.98, metalness: 0.05 }),
    violetRock: pbr('CC_LevitatingVioletRock', 0x31213f, { roughness: 0.9, metalness: 0.1 }),
    ruinStone: pbr('CC_RuinedGothicStone', 0x292932, { roughness: 0.88, metalness: 0.12 }),
    field: pbr('CC_AnonymityBarrier', 0x8964ad, { roughness: 0.22, metalness: 0.22, emissive: 0x48296e, emissiveIntensity: 0.55, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
  };

  circleFloor(root, 'chaos_castle_abyss_floor', materials.voidStone, 34, -7.8, 96);
  const voidRift = addMesh(root, 'chaos_castle_abyss_rift', new THREE.RingGeometry(20.8, 36, 96), materials.runeDim, [0, -6.8, 0], [-Math.PI / 2, 0, 0]);
  voidRift.material = pbr('CC_AbyssRiftMaterial', 0x170d25, { roughness: 0.5, emissive: 0x401b65, emissiveIntensity: 0.85, side: THREE.DoubleSide });
  horizontalRing(root, 'chaos_castle_outer_void_rune', materials.rune, 21.2, 0.17, -4.3, 96);
  horizontalRing(root, 'chaos_castle_inner_void_edge', materials.violetMetal, 20.7, 0.24, -3.1, 96);

  const platform = group(root, 'chaos_castle_suspended_platform');
  for (let row = 0; row < 6; row++) {
    for (let column = 0; column < 6; column++) addChaosTile(platform, row, column, materials);
  }
  horizontalRing(platform, 'chaos_castle_platform_rune_circlet', materials.runeDim, 19.1, 0.065, 0.28, 96);

  const barrier = addMesh(
    root,
    'chaos_castle_force_barrier',
    new THREE.CylinderGeometry(20.65, 20.65, 9.5, 64, 1, true),
    materials.field,
    [0, 4.2, 0],
  );
  barrier.userData.nonCollidingVisual = true;
  horizontalRing(root, 'chaos_castle_barrier_crown', materials.runeDim, 20.65, 0.105, 8.95, 80);
  horizontalRing(root, 'chaos_castle_barrier_foot', materials.violetMetal, 20.65, 0.12, -0.48, 80);

  for (let index = 0; index < 4; index++) {
    const angle = Math.PI / 4 + (index / 4) * TAU;
    const radius = 27.5;
    addBrokenGothicRuins(root, index, Math.cos(angle) * radius, Math.sin(angle) * radius, materials);
  }
  for (let index = 0; index < 20; index++) {
    const angle = (index / 20) * TAU + 0.13;
    const radius = 22.8 + (index % 4) * 1.45;
    const y = -2.8 + (index % 5) * 1.2;
    addFloatingAbyssShard(root, index, angle, radius, y, 0.52 + (index % 3) * 0.24, materials);
  }
  for (let index = 0; index < 8; index++) {
    const angle = (index / 8) * TAU;
    const x = Math.cos(angle) * 20.75;
    const z = Math.sin(angle) * 20.75;
    const pylon = group(root, `chaos_castle_ward_pylon_${String(index + 1).padStart(2, '0')}`);
    cylinder(pylon, `chaos_castle_ward_pylon_base_${index + 1}`, materials.ruinStone, [x, 0.55, z], 0.85, 1.1, 1.1, 8);
    cylinder(pylon, `chaos_castle_ward_pylon_shaft_${index + 1}`, materials.violetMetal, [x, 2.45, z], 0.46, 0.65, 2.8, 8);
    const crystal = addMesh(pylon, `chaos_castle_ward_pylon_crystal_${index + 1}`, new THREE.OctahedronGeometry(0.62, 1), materials.rune, [x, 4.25, z]);
    crystal.rotation.y = angle;
  }
  return root;
}

function addDuelTorch(parent, index, x, z, materials) {
  const torch = group(parent, `duel_coliseum_torch_${String(index + 1).padStart(2, '0')}`);
  cylinder(torch, `duel_coliseum_torch_base_${index + 1}`, materials.stone, [x, 0.38, z], 0.58, 0.78, 0.72, 10);
  cylinder(torch, `duel_coliseum_torch_shaft_${index + 1}`, materials.bronze, [x, 1.6, z], 0.19, 0.28, 1.72, 8);
  cylinder(torch, `duel_coliseum_torch_cup_${index + 1}`, materials.gold, [x, 2.56, z], 0.52, 0.31, 0.2, 10);
  horizontalRing(torch, `duel_coliseum_torch_cup_rim_${index + 1}`, materials.gold, 0.47, 0.055, 2.67, 24);
  const flame = addMesh(torch, `duel_coliseum_torch_flame_${index + 1}`, new THREE.ConeGeometry(0.34, 0.95, 8), index % 2 ? materials.blueFire : materials.goldFire, [x, 3.18, z]);
  flame.rotation.z = Math.PI;
  const inner = addMesh(torch, `duel_coliseum_torch_core_${index + 1}`, new THREE.ConeGeometry(0.16, 0.58, 7), materials.whiteFire, [x, 3.2, z]);
  inner.rotation.z = Math.PI;
}

function addBanner(parent, name, x, z, angle, cloth, materials) {
  const banner = group(parent, name);
  banner.position.set(x, 0, z);
  banner.rotation.y = angle;
  cylinder(banner, `${name}_pole`, materials.bronze, [0, 5.4, 0], 0.09, 0.13, 10.8, 8);
  box(banner, `${name}_crossbar`, materials.gold, [0, 10.42, 0], [1.75, 0.12, 0.15]);
  const flag = new THREE.Shape();
  flag.moveTo(-0.72, 0);
  flag.lineTo(0.72, 0);
  flag.lineTo(0.72, -2.1);
  flag.lineTo(0, -2.55);
  flag.lineTo(-0.72, -2.1);
  flag.closePath();
  const clothMesh = addMesh(banner, `${name}_cloth`, new THREE.ShapeGeometry(flag), cloth, [0, 10.28, 0.07]);
  clothMesh.material.side = THREE.DoubleSide;
  const crest = addMesh(banner, `${name}_heraldic_crest`, new THREE.OctahedronGeometry(0.34, 0), materials.gold, [0, 9.32, 0.12]);
  crest.scale.set(0.72, 1.2, 0.32);
  return banner;
}

function addScoreboard(parent, materials) {
  const board = group(parent, 'duel_coliseum_scoreboard');
  board.position.set(0, 9.2, -4.6);
  box(board, 'duel_coliseum_scoreboard_backplate', materials.boardDark, [0, 0, 0], [9.2, 3.05, 0.48]);
  box(board, 'duel_coliseum_scoreboard_frame_top', materials.gold, [0, 1.58, 0.05], [9.6, 0.18, 0.6]);
  box(board, 'duel_coliseum_scoreboard_frame_bottom', materials.gold, [0, -1.58, 0.05], [9.6, 0.18, 0.6]);
  for (const side of [-1, 1]) {
    box(board, `duel_coliseum_scoreboard_frame_side_${side < 0 ? 'left' : 'right'}`, materials.gold, [side * 4.7, 0, 0.05], [0.18, 3.15, 0.6]);
    const panelMaterial = side < 0 ? materials.sapphire : materials.sunGold;
    box(board, `duel_coliseum_scoreboard_combatant_panel_${side < 0 ? 'blue' : 'gold'}`, panelMaterial, [side * 2.75, 0.35, 0.28], [2.55, 1.58, 0.1]);
    for (let bar = 0; bar < 3; bar++) {
      box(board, `duel_coliseum_scoreboard_health_bar_${side}_${bar + 1}`, materials.scoreGlow, [side * 2.75, -0.72 - bar * 0.19, 0.34], [1.45 - bar * 0.2, 0.075, 0.055]);
    }
  }
  box(board, 'duel_coliseum_scoreboard_center_bezel', materials.bronze, [0, 0.23, 0.3], [2.0, 1.85, 0.14]);
  box(board, 'duel_coliseum_scoreboard_score_10_left', materials.scoreGlow, [-0.38, 0.27, 0.39], [0.11, 0.82, 0.06]);
  box(board, 'duel_coliseum_scoreboard_score_10_right', materials.scoreGlow, [0.38, 0.27, 0.39], [0.11, 0.82, 0.06]);
  for (const y of [-0.54, 1.12]) box(board, `duel_coliseum_scoreboard_center_rune_${y < 0 ? 'lower' : 'upper'}`, materials.goldFire, [0, y, 0.4], [0.42, 0.07, 0.07]);
  const crest = addMesh(board, 'duel_coliseum_scoreboard_glory_crest', new THREE.OctahedronGeometry(0.48, 0), materials.goldFire, [0, 1.02, 0.4]);
  crest.scale.set(0.7, 1.25, 0.38);
  horizontalRing(board, 'duel_coliseum_scoreboard_halo', materials.scoreGlow, 5.2, 0.045, 0, 64);
  board.rotation.y = 0;
  return board;
}

export function buildDuelColiseum() {
  const root = makeArenaRoot('DUEL_COLISEUM', 'EVT_04', 'Coliseu de Duelos — A Grande Arena da Glória');
  const materials = {
    foundation: pbr('DC_LimestoneFoundation', 0x3c3b39, { roughness: 0.84, metalness: 0.12 }),
    stone: pbr('DC_ArenaTravertine', 0x77716a, { roughness: 0.8, metalness: 0.08 }),
    stoneLight: pbr('DC_CutAlabaster', 0xa49a88, { roughness: 0.64, metalness: 0.08 }),
    stoneDark: pbr('DC_ShadowedMasonry', 0x34343a, { roughness: 0.86, metalness: 0.1 }),
    marble: pbr('DC_PolishedDuelMarble', 0xd6d1c1, { roughness: 0.22, metalness: 0.12 }),
    bronze: pbr('DC_AgedBronze', 0x6f5334, { roughness: 0.35, metalness: 0.84 }),
    gold: pbr('DC_HonorGold', 0xc59a43, { roughness: 0.26, metalness: 0.82 }),
    sunGold: pbr('DC_SolarScore', 0xd59932, { roughness: 0.28, metalness: 0.45, emissive: 0x9e5c14, emissiveIntensity: 1.3 }),
    sapphire: pbr('DC_SapphireScore', 0x3186c7, { roughness: 0.27, metalness: 0.4, emissive: 0x1269b4, emissiveIntensity: 1.4 }),
    scoreGlow: pbr('DC_HolographicGlow', 0xd6e7ff, { roughness: 0.2, emissive: 0x69bdf4, emissiveIntensity: 2.6 }),
    goldFire: pbr('DC_GoldFlame', 0xffb43a, { roughness: 0.28, emissive: 0xff8200, emissiveIntensity: 2.4 }),
    blueFire: pbr('DC_SapphireFlame', 0x5dbdff, { roughness: 0.24, emissive: 0x168bf5, emissiveIntensity: 2.6 }),
    whiteFire: pbr('DC_WhiteFireCore', 0xfff2c2, { roughness: 0.22, emissive: 0xffe7a1, emissiveIntensity: 2.8 }),
    bannerCrimson: pbr('DC_CrimsonVelvet', 0x852b32, { roughness: 0.88, metalness: 0.02, side: THREE.DoubleSide }),
    bannerSapphire: pbr('DC_SapphireVelvet', 0x214c78, { roughness: 0.88, metalness: 0.02, side: THREE.DoubleSide }),
    boardDark: pbr('DC_ScoreboardObsidian', 0x151a24, { roughness: 0.34, metalness: 0.74 }),
    dome: pbr('DC_ForceDomeMaterial', 0x75c9ed, { roughness: 0.17, metalness: 0.18, emissive: 0x3ba6d4, emissiveIntensity: 0.52, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
    domeGold: pbr('DC_ForceDomeGold', 0xe3c07d, { roughness: 0.24, metalness: 0.55, emissive: 0xa4782d, emissiveIntensity: 0.75 }),
  };

  cylinder(root, 'duel_coliseum_octagonal_foundation', materials.foundation, [0, 0.23, 0], 17.55, 17.8, 0.86, 8);
  cylinder(root, 'duel_coliseum_arena_floor', materials.stone, [0, 0.64, 0], 17.2, 17.55, 0.1, 8);
  const centralBase = cylinder(root, 'duel_coliseum_honor_dais_base', materials.stoneDark, [0, 0.89, 0], 7.78, 8.0, 0.42, 8);
  centralBase.rotation.y = Math.PI / 8;
  const daisTop = cylinder(root, 'duel_coliseum_fighting_floor', materials.marble, [0, 1.15, 0], 7.42, 7.74, 0.16, 8);
  daisTop.rotation.y = Math.PI / 8;
  const medallion = cylinder(root, 'duel_coliseum_fighting_floor_medallion', materials.stoneLight, [0, 1.245, 0], 2.55, 2.58, 0.035, 8);
  medallion.rotation.y = Math.PI / 8;
  horizontalRing(root, 'duel_coliseum_fighting_floor_honor_ring', materials.gold, 6.55, 0.08, 1.25, 48);
  horizontalRing(root, 'duel_coliseum_fighting_floor_inner_ring', materials.bronze, 3.0, 0.055, 1.27, 40);
  for (let index = 0; index < 8; index++) {
    const angle = Math.PI / 8 + (index / 8) * TAU;
    const x = Math.cos(angle) * 4.85;
    const z = Math.sin(angle) * 4.85;
    horizontalBeam(root, `duel_coliseum_fighting_floor_marble_vein_${String(index + 1).padStart(2, '0')}`, materials.stoneLight, x, z, Math.cos(angle + Math.PI) * 4.85, Math.sin(angle + Math.PI) * 4.85, 1.25, 0.055, 0.035);
  }

  const tierSpecs = [
    [8.05, 10.25, 0.69, 0.72],
    [10.25, 12.45, 1.41, 0.72],
    [12.45, 14.65, 2.13, 0.72],
    [14.65, 17.0, 2.85, 0.72],
  ];
  tierSpecs.forEach(([innerRadius, outerRadius, y, height], index) => {
    const tier = addMesh(
      root,
      `duel_coliseum_seating_tier_${String(index + 1).padStart(2, '0')}`,
      octagonRingGeometry(innerRadius, outerRadius, height, 8, Math.PI / 8),
      index % 2 ? materials.stoneDark : materials.stone,
      [0, y, 0],
    );
    tier.material.flatShading = true;
    horizontalRing(root, `duel_coliseum_seating_tier_trim_${String(index + 1).padStart(2, '0')}`, materials.bronze, (innerRadius + outerRadius) / 2, 0.045, y + height + 0.015, 32);
  });

  for (let index = 0; index < 8; index++) {
    const angle = (index / 8) * TAU + Math.PI / 8;
    const x = Math.cos(angle) * 14.05;
    const z = Math.sin(angle) * 14.05;
    addFlutedColumn(root, `duel_coliseum_arcade_column_${String(index + 1).padStart(2, '0')}`, x, z, 3.55, 7.2, 0.48, materials.stoneLight, materials.gold, 14);
    const nextAngle = ((index + 1) / 8) * TAU + Math.PI / 8;
    const nextX = Math.cos(nextAngle) * 14.05;
    const nextZ = Math.sin(nextAngle) * 14.05;
    const midpointAngle = angle + Math.PI / 8;
    const tangent = [-Math.sin(midpointAngle), Math.cos(midpointAngle)];
    const radial = [Math.cos(midpointAngle), Math.sin(midpointAngle)];
    const center = [Math.cos(midpointAngle) * 14.05, Math.sin(midpointAngle) * 14.05];
    addGothicArch(root, `duel_coliseum_archway_${String(index + 1).padStart(2, '0')}`, center, tangent, radial, 4.08, 5.35, 2.55, materials.stoneLight, 0.29);
    horizontalBeam(root, `duel_coliseum_arcade_architrave_${String(index + 1).padStart(2, '0')}`, materials.stoneDark, x, z, nextX, nextZ, 10.93, 0.72, 0.82);
  }
  const arcadeCrown = addMesh(root, 'duel_coliseum_arcade_crown', octagonRingGeometry(13.6, 14.6, 0.58, 8, Math.PI / 8), materials.stoneLight, [0, 11.02, 0]);
  arcadeCrown.material.flatShading = true;

  horizontalRing(root, 'duel_coliseum_arena_boundary_inlay', materials.gold, 17.1, 0.075, 0.72, 64);
  for (let index = 0; index < 8; index++) {
    const angle = (index / 8) * TAU;
    const x = Math.cos(angle) * 12.65;
    const z = Math.sin(angle) * 12.65;
    cylinder(root, `duel_coliseum_honor_plinth_${String(index + 1).padStart(2, '0')}`, materials.gold, [x, 1.35, z], 0.9, 1.15, 1.45, 8);
    cylinder(root, `duel_coliseum_honor_plinth_crown_${String(index + 1).padStart(2, '0')}`, materials.stoneLight, [x, 2.14, z], 1.2, 0.95, 0.22, 8);
    const gem = addMesh(root, `duel_coliseum_honor_plinth_gem_${String(index + 1).padStart(2, '0')}`, new THREE.OctahedronGeometry(0.34, 1), index % 2 ? materials.sapphire : materials.sunGold, [x, 2.48, z]);
    gem.rotation.y = angle;
  }

  const banners = [
    [-12.2, -8.4, 0.2, materials.bannerCrimson],
    [12.2, -8.4, -0.2, materials.bannerSapphire],
    [-12.2, 8.4, Math.PI - 0.2, materials.bannerSapphire],
    [12.2, 8.4, Math.PI + 0.2, materials.bannerCrimson],
  ];
  banners.forEach(([x, z, angle, cloth], index) => addBanner(root, `duel_coliseum_heraldic_banner_${index + 1}`, x, z, angle, cloth, materials));
  for (let index = 0; index < 8; index++) {
    const angle = (index / 8) * TAU + Math.PI / 8;
    addDuelTorch(root, index, Math.cos(angle) * 11.4, Math.sin(angle) * 11.4, materials);
  }

  const dome = addMesh(
    root,
    'duel_coliseum_force_dome',
    new THREE.SphereGeometry(17.45, 64, 24, 0, TAU, 0, Math.PI / 2),
    materials.dome,
    [0, 0.62, 0],
  );
  dome.scale.y = 0.66;
  dome.userData.nonCollidingVisual = true;
  horizontalRing(root, 'duel_coliseum_force_dome_equator', materials.domeGold, 17.45, 0.065, 0.72, 96);
  horizontalRing(root, 'duel_coliseum_force_dome_halo_lower', materials.domeGold, 15.2, 0.035, 4.2, 96);
  horizontalRing(root, 'duel_coliseum_force_dome_halo_upper', materials.domeGold, 10.2, 0.035, 8.0, 96);
  addScoreboard(root, materials);
  return root;
}

export const EVENT_ARENA_BUILDERS = Object.freeze({
  EVT_02: buildDevilSquare,
  EVT_03: buildChaosCastle,
  EVT_04: buildDuelColiseum,
});

export function buildEventArena(id) {
  const key = String(id ?? '').toUpperCase();
  const builder = EVENT_ARENA_BUILDERS[key];
  if (!builder) throw new Error(`Arena de evento não suportada: ${id}. Use EVT_02, EVT_03 ou EVT_04.`);
  return builder();
}
