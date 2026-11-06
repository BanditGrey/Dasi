import * as THREE from 'three';

/** Static first-pass GLB sources for the Golden Invasion creatures. */
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);

export const GOLDEN_INVASION_IDS = Object.freeze([
  'GOLDEN_BUDGE_DRAGON',
  'GOLDEN_SOLDIER',
  'GOLDEN_LIZARD_KING',
  'GOLDEN_TANTALOS',
  'GOLDEN_DRAGON',
]);

function material(name, color, options = {}) {
  const result = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.25,
    metalness: options.metalness ?? 0.88,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
    flatShading: options.flatShading ?? false,
  });
  result.name = name;
  return result;
}

function root(id, title) {
  const result = new THREE.Group();
  result.name = `BESTIARY_${id}`;
  result.userData = {
    assetKind: 'bestiary-creature-static',
    assetVersion: 1,
    creatureId: id,
    title,
    source: 'tools/golden_invasion_models.mjs',
    staticVisualOnly: true,
    collisionsIncluded: false,
    skeletalRigIncluded: false,
    animationClipsIncluded: false,
    runtimeEffectsIncluded: false,
  };
  return result;
}

function mesh(parent, name, geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const result = new THREE.Mesh(geometry, mat);
  result.name = name;
  result.position.set(...position);
  result.rotation.set(...rotation);
  result.castShadow = true;
  result.receiveShadow = true;
  parent.add(result);
  return result;
}

function box(parent, name, mat, position, size, rotation = [0, 0, 0]) {
  return mesh(parent, name, new THREE.BoxGeometry(...size), mat, position, rotation);
}

function sphere(parent, name, mat, position, scale, segments = 16) {
  const result = mesh(parent, name, new THREE.SphereGeometry(1, segments, Math.max(8, Math.floor(segments * 0.65))), mat, position);
  result.scale.set(...scale);
  return result;
}

function cylinder(parent, name, mat, position, top, bottom, height, segments = 12, rotation = [0, 0, 0]) {
  return mesh(parent, name, new THREE.CylinderGeometry(top, bottom, height, segments), mat, position, rotation);
}

function cone(parent, name, mat, position, radius, height, segments = 8, rotation = [0, 0, 0]) {
  return mesh(parent, name, new THREE.ConeGeometry(radius, height, segments), mat, position, rotation);
}

function beam(parent, name, mat, start, end, radius = 0.12, segments = 8) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const result = mesh(parent, name, new THREE.CylinderGeometry(radius, radius, direction.length(), segments), mat, a.clone().add(b).multiplyScalar(0.5).toArray());
  result.quaternion.setFromUnitVectors(UP, direction.normalize());
  return result;
}

function tube(parent, name, mat, points, radius, segments = 28, radialSegments = 9) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)), false, 'centripetal');
  return mesh(parent, name, new THREE.TubeGeometry(curve, segments, radius, radialSegments, false), mat);
}

function membrane(parent, name, mat, vertices, fan = true) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 3));
  if (fan) {
    const indices = [];
    for (let index = 1; index < vertices.length - 1; index++) indices.push(0, index, index + 1);
    geometry.setIndex(indices);
  }
  geometry.computeVertexNormals();
  return mesh(parent, name, geometry, mat);
}

function horizontalRing(parent, name, mat, radius, thickness, position, segments = 40) {
  return mesh(parent, name, new THREE.TorusGeometry(radius, thickness, 8, segments), mat, position, [Math.PI / 2, 0, 0]);
}

function addDorsalSpines(parent, prefix, mat, start, count, spacing, height, width = 0.16) {
  for (let index = 0; index < count; index++) {
    const [x, y, z] = start;
    const progress = count <= 1 ? 0 : index / (count - 1);
    cone(parent, `${prefix}_${String(index + 1).padStart(2, '0')}`, mat, [x, y + Math.sin(progress * Math.PI) * 0.12, z + index * spacing], width, height * (0.8 + Math.sin(progress * Math.PI) * 0.2), 7, [0, 0, (index - (count - 1) / 2) * 0.07]);
  }
}

function buildGoldenBudgeDragon() {
  const id = 'GOLDEN_BUDGE_DRAGON';
  const model = root(id, 'Golden Budge Dragon — O Pequeno Saqueador Dourado');
  const gold = material('GoldenBudge_SunlitScales', 0xe7ad2d, { roughness: 0.22, metalness: 0.92 });
  const paleGold = material('GoldenBudge_PolishedTrim', 0xffdc75, { roughness: 0.17, metalness: 0.96, emissive: 0x6e4200, emissiveIntensity: 0.25 });
  const shadowGold = material('GoldenBudge_AmberUnderbelly', 0x8e5514, { roughness: 0.4, metalness: 0.76 });
  const wingGold = material('GoldenBudge_ThinGoldMembrane', 0xffc94e, { roughness: 0.28, metalness: 0.72, transparent: true, opacity: 0.94, side: THREE.DoubleSide });
  const eye = material('GoldenBudge_RubyEyes', 0xff472c, { roughness: 0.16, emissive: 0xa71905, emissiveIntensity: 1.8 });
  const claw = material('GoldenBudge_ClawTips', 0x55310d, { roughness: 0.22, metalness: 0.92 });

  const body = new THREE.Group();
  body.name = 'golden_budge_dragon_body';
  model.add(body);
  sphere(body, 'golden_budge_dragon_muscular_body', gold, [0, 0.86, -0.12], [0.62, 0.48, 0.9], 20);
  sphere(body, 'golden_budge_dragon_belly', shadowGold, [0, 0.63, 0.22], [0.5, 0.31, 0.72], 18);
  tube(body, 'golden_budge_dragon_neck', gold, [[0, 0.98, 0.48], [0, 1.28, 0.72], [0, 1.42, 1.02]], 0.31, 18, 9);
  sphere(body, 'golden_budge_dragon_head', gold, [0, 1.48, 1.18], [0.48, 0.36, 0.48], 18);
  sphere(body, 'golden_budge_dragon_muzzle', paleGold, [0, 1.33, 1.57], [0.38, 0.2, 0.36], 14);
  box(body, 'golden_budge_dragon_jaw', shadowGold, [0, 1.18, 1.54], [0.5, 0.16, 0.38]);
  for (const side of [-1, 1]) {
    sphere(body, `golden_budge_dragon_eye_${side < 0 ? 'left' : 'right'}`, eye, [side * 0.25, 1.55, 1.5], [0.08, 0.07, 0.055], 10);
    cone(body, `golden_budge_dragon_horn_${side < 0 ? 'left' : 'right'}`, paleGold, [side * 0.25, 1.79, 1.02], 0.12, 0.48, 7, [0, 0, side * -0.38]);
    cone(body, `golden_budge_dragon_fang_${side < 0 ? 'left' : 'right'}`, paleGold, [side * 0.14, 1.18, 1.76], 0.055, 0.2, 5, [Math.PI, 0, 0]);

    const hip = [side * 0.37, 0.65, 0.22];
    const ankle = [side * 0.45, 0.16, 0.54];
    beam(body, `golden_budge_dragon_leg_${side < 0 ? 'left' : 'right'}`, gold, hip, ankle, 0.13, 8);
    sphere(body, `golden_budge_dragon_foot_${side < 0 ? 'left' : 'right'}`, paleGold, [side * 0.45, 0.12, 0.62], [0.2, 0.12, 0.3], 10);
    for (let toe = 0; toe < 3; toe++) cone(body, `golden_budge_dragon_claw_${side}_${toe + 1}`, claw, [side * 0.45 + (toe - 1) * 0.1, 0.12, 0.84], 0.045, 0.2, 5, [Math.PI / 2, 0, 0]);

    const wingVertices = [
      [side * 0.36, 1.12, -0.32], [side * 0.85, 1.82, -0.34], [side * 1.58, 1.9, -0.26],
      [side * 1.32, 1.08, -0.25], [side * 0.82, 0.9, -0.28],
    ];
    membrane(body, `golden_budge_dragon_wing_${side < 0 ? 'left' : 'right'}`, wingGold, wingVertices);
    beam(body, `golden_budge_dragon_wing_bone_${side < 0 ? 'left' : 'right'}`, paleGold, wingVertices[0], wingVertices[2], 0.055, 7);
    beam(body, `golden_budge_dragon_wing_rib_${side < 0 ? 'left' : 'right'}`, paleGold, wingVertices[1], wingVertices[3], 0.035, 6);
  }
  tube(body, 'golden_budge_dragon_tail', gold, [[0, 0.8, -0.8], [0.05, 0.68, -1.22], [0.16, 0.82, -1.7], [0.25, 1.12, -1.94]], 0.16, 22, 8);
  cone(body, 'golden_budge_dragon_tail_spade', paleGold, [0.25, 1.16, -1.98], 0.22, 0.52, 5, [Math.PI / 2, 0, 0]);
  addDorsalSpines(body, 'golden_budge_dragon_back_spine', paleGold, [0, 1.23, -0.62], 5, 0.26, 0.34, 0.09);
  model.userData.landmarks = ['golden_budge_dragon_body', 'golden_budge_dragon_head', 'golden_budge_dragon_wing_left', 'golden_budge_dragon_wing_right', 'golden_budge_dragon_tail'];
  return model;
}

function buildGoldenSoldier() {
  const id = 'GOLDEN_SOLDIER';
  const model = root(id, 'Golden Soldier — O Cavaleiro Esqueleto Dourado');
  const armor = material('GoldenSoldier_PolishedArmor', 0xe1a820, { roughness: 0.2, metalness: 0.95 });
  const trim = material('GoldenSoldier_BurnishedTrim', 0xffdf71, { roughness: 0.16, metalness: 0.97, emissive: 0x704100, emissiveIntensity: 0.25 });
  const bone = material('GoldenSoldier_AgedGoldBone', 0xa97621, { roughness: 0.44, metalness: 0.82 });
  const joint = material('GoldenSoldier_DarkJoints', 0x49300e, { roughness: 0.38, metalness: 0.78 });
  const eye = material('GoldenSoldier_RedSoulEyes', 0xff321d, { roughness: 0.15, emissive: 0xa81405, emissiveIntensity: 2.1 });

  const body = new THREE.Group();
  body.name = 'golden_soldier_armored_skeleton';
  model.add(body);
  // Legs, greaves and broad plated boots.
  for (const side of [-1, 1]) {
    const hip = [side * 0.28, 1.65, 0];
    const knee = [side * 0.32, 0.96, 0.04];
    const ankle = [side * 0.34, 0.22, 0.12];
    beam(body, `golden_soldier_thigh_${side < 0 ? 'left' : 'right'}`, bone, hip, knee, 0.16, 8);
    sphere(body, `golden_soldier_knee_${side < 0 ? 'left' : 'right'}`, trim, knee, [0.22, 0.2, 0.2], 10);
    beam(body, `golden_soldier_greave_${side < 0 ? 'left' : 'right'}`, armor, knee, ankle, 0.15, 8);
    box(body, `golden_soldier_boot_${side < 0 ? 'left' : 'right'}`, armor, [side * 0.34, 0.14, 0.26], [0.42, 0.22, 0.56]);
    box(body, `golden_soldier_toe_plate_${side < 0 ? 'left' : 'right'}`, trim, [side * 0.34, 0.19, 0.51], [0.4, 0.11, 0.17]);
  }

  box(body, 'golden_soldier_pelvis', joint, [0, 1.69, 0], [0.72, 0.42, 0.48]);
  cylinder(body, 'golden_soldier_breastplate', armor, [0, 2.25, 0.02], 0.42, 0.63, 0.98, 10);
  box(body, 'golden_soldier_chest_badge', trim, [0, 2.37, 0.4], [0.42, 0.44, 0.14]);
  sphere(body, 'golden_soldier_solar_medallion', eye, [0, 2.37, 0.49], [0.11, 0.11, 0.06], 12);
  for (let rib = 0; rib < 4; rib++) {
    const y = 1.93 + rib * 0.18;
    tube(body, `golden_soldier_rib_${rib + 1}`, bone, [[-0.38, y, 0.29], [-0.2, y - 0.06, 0.42], [0, y - 0.08, 0.45], [0.2, y - 0.06, 0.42], [0.38, y, 0.29]], 0.045, 10, 5);
  }

  sphere(body, 'golden_soldier_skull', bone, [0, 3.06, 0.02], [0.37, 0.44, 0.34], 16);
  box(body, 'golden_soldier_jaw', armor, [0, 2.81, 0.29], [0.42, 0.18, 0.22]);
  for (const side of [-1, 1]) {
    sphere(body, `golden_soldier_eye_${side < 0 ? 'left' : 'right'}`, eye, [side * 0.14, 3.1, 0.31], [0.075, 0.065, 0.05], 10);
    cone(body, `golden_soldier_helmet_horn_${side < 0 ? 'left' : 'right'}`, trim, [side * 0.32, 3.4, -0.03], 0.13, 0.56, 7, [0, 0, side * -0.35]);
    const pauldron = mesh(body, `golden_soldier_pauldron_${side < 0 ? 'left' : 'right'}`, new THREE.DodecahedronGeometry(0.38, 0), armor, [side * 0.62, 2.67, 0]);
    pauldron.scale.set(1.3, 0.82, 1.0);
    cone(body, `golden_soldier_pauldron_spike_${side < 0 ? 'left' : 'right'}`, trim, [side * 0.76, 2.98, -0.03], 0.12, 0.48, 6, [0, 0, side * -0.35]);
  }
  cylinder(body, 'golden_soldier_helmet_band', trim, [0, 3.35, 0], 0.42, 0.42, 0.13, 12);
  cone(body, 'golden_soldier_helmet_crest', trim, [0, 3.65, -0.08], 0.19, 0.52, 7);

  for (const side of [-1, 1]) {
    const shoulder = [side * 0.62, 2.55, 0.02];
    const elbow = [side * 0.85, 2.08, 0.12];
    const wrist = side < 0 ? [-0.84, 1.68, 0.28] : [0.88, 1.73, 0.3];
    beam(body, `golden_soldier_upper_arm_${side < 0 ? 'left' : 'right'}`, bone, shoulder, elbow, 0.14, 8);
    sphere(body, `golden_soldier_elbow_${side < 0 ? 'left' : 'right'}`, trim, elbow, [0.19, 0.18, 0.18], 10);
    beam(body, `golden_soldier_forearm_${side < 0 ? 'left' : 'right'}`, armor, elbow, wrist, 0.14, 8);
    sphere(body, `golden_soldier_gauntlet_${side < 0 ? 'left' : 'right'}`, trim, wrist, [0.2, 0.18, 0.2], 10);
    for (let finger = 0; finger < 3; finger++) cone(body, `golden_soldier_finger_${side}_${finger + 1}`, bone, [wrist[0] + (finger - 1) * 0.1, wrist[1] - 0.14, wrist[2] + 0.1], 0.045, 0.2, 5, [Math.PI, 0, 0]);
  }

  // A ceremonial bearded axe and shield make the soldier silhouette distinct from the Titan.
  const axe = new THREE.Group();
  axe.name = 'golden_soldier_sun_axe';
  axe.position.set(0.92, 1.42, 0.25);
  axe.rotation.z = -0.12;
  body.add(axe);
  cylinder(axe, 'golden_soldier_axe_shaft', bone, [0, 0.65, 0], 0.065, 0.08, 1.6, 8);
  const axeHead = mesh(axe, 'golden_soldier_axe_head', new THREE.DodecahedronGeometry(0.39, 0), trim, [0.17, 1.38, 0]);
  axeHead.scale.set(0.45, 1.5, 0.22);
  cone(axe, 'golden_soldier_axe_beard', armor, [0.32, 1.08, 0], 0.19, 0.55, 5, [0, 0, Math.PI / 2]);
  const shield = new THREE.Group();
  shield.name = 'golden_soldier_round_shield';
  shield.position.set(-0.95, 1.8, 0.37);
  body.add(shield);
  const shieldPlate = mesh(shield, 'golden_soldier_shield_plate', new THREE.CylinderGeometry(0.4, 0.4, 0.13, 12), armor, [0, 0, 0], [Math.PI / 2, 0, 0]);
  shieldPlate.scale.set(1, 1.15, 1);
  horizontalRing(shield, 'golden_soldier_shield_rim', trim, 0.43, 0.055, [0, 0, 0.075], 32);
  sphere(shield, 'golden_soldier_shield_boss', eye, [0, 0, 0.13], [0.13, 0.13, 0.07], 10);
  model.userData.landmarks = ['golden_soldier_armored_skeleton', 'golden_soldier_skull', 'golden_soldier_sun_axe', 'golden_soldier_round_shield'];
  return model;
}

function buildGoldenLizardKing() {
  const id = 'GOLDEN_LIZARD_KING';
  const model = root(id, 'Golden Lizard King — Monarca Anfíbio Dourado');
  const scales = material('LizardKing_LuminousGoldScales', 0xc99528, { roughness: 0.27, metalness: 0.86 });
  const plates = material('LizardKing_CrownGold', 0xffd45f, { roughness: 0.2, metalness: 0.94 });
  const belly = material('LizardKing_OliveBronzeBelly', 0x6e5a26, { roughness: 0.48, metalness: 0.64 });
  const webbing = material('LizardKing_AmphibiousFin', 0xe8b83d, { roughness: 0.31, metalness: 0.68, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
  const eye = material('LizardKing_AmberEyes', 0xf9ffad, { roughness: 0.14, emissive: 0x95b325, emissiveIntensity: 1.5 });
  const claw = material('LizardKing_DarkGoldClaws', 0x543d14, { roughness: 0.22, metalness: 0.92 });

  const body = new THREE.Group();
  body.name = 'golden_lizard_king_amphibious_body';
  model.add(body);
  sphere(body, 'golden_lizard_king_abdomen', scales, [0, 1.28, -0.35], [1.0, 0.72, 1.45], 22);
  sphere(body, 'golden_lizard_king_belly', belly, [0, 0.99, 0.36], [0.78, 0.42, 1.0], 18);
  sphere(body, 'golden_lizard_king_chest', scales, [0, 1.55, 0.7], [0.86, 0.75, 0.78], 20);
  tube(body, 'golden_lizard_king_neck', scales, [[0, 1.72, 0.9], [0, 1.96, 1.15], [0, 2.2, 1.35]], 0.39, 18, 9);
  sphere(body, 'golden_lizard_king_head', scales, [0, 2.27, 1.42], [0.62, 0.48, 0.65], 18);
  sphere(body, 'golden_lizard_king_snout', plates, [0, 2.08, 1.95], [0.57, 0.28, 0.52], 14);
  box(body, 'golden_lizard_king_lower_jaw', belly, [0, 1.88, 1.89], [0.8, 0.19, 0.58]);
  for (const side of [-1, 1]) {
    sphere(body, `golden_lizard_king_eye_${side < 0 ? 'left' : 'right'}`, eye, [side * 0.35, 2.34, 1.93], [0.11, 0.09, 0.065], 10);
    cone(body, `golden_lizard_king_crown_horn_${side < 0 ? 'left' : 'right'}`, plates, [side * 0.4, 2.68, 1.16], 0.17, 0.68, 7, [0, 0, side * -0.4]);
    for (let gill = 0; gill < 3; gill++) {
      cone(body, `golden_lizard_king_gill_${side}_${gill + 1}`, plates, [side * (0.55 + gill * 0.06), 1.86 - gill * 0.19, 0.9 - gill * 0.1], 0.12, 0.38, 6, [0, 0, side * -0.55]);
    }
  }
  for (let plate = 0; plate < 6; plate++) {
    const z = 0.6 - plate * 0.43;
    const y = 1.92 - Math.abs(plate - 2) * 0.08;
    const dorsal = mesh(body, `golden_lizard_king_dorsal_plate_${plate + 1}`, new THREE.DodecahedronGeometry(0.42, 0), plate % 2 ? scales : plates, [0, y, z]);
    dorsal.scale.set(1.6, 0.48, 0.84);
  }
  addDorsalSpines(body, 'golden_lizard_king_back_spine', plates, [-0.02, 2.22, -1.2], 6, 0.38, 0.54, 0.15);

  for (let index = 0; index < 4; index++) {
    const side = index % 2 === 0 ? -1 : 1;
    const front = index < 2;
    const hip = [side * (front ? 0.68 : 0.62), front ? 1.38 : 1.25, front ? 0.82 : -0.9];
    const elbow = [side * (front ? 1.08 : 1.02), 0.72, front ? 1.08 : -1.12];
    const foot = [side * (front ? 1.2 : 1.1), 0.17, front ? 1.55 : -0.52];
    beam(body, `golden_lizard_king_leg_${index + 1}_upper`, scales, hip, elbow, 0.2, 9);
    sphere(body, `golden_lizard_king_leg_${index + 1}_joint`, plates, elbow, [0.25, 0.22, 0.26], 10);
    beam(body, `golden_lizard_king_leg_${index + 1}_lower`, belly, elbow, foot, 0.14, 8);
    sphere(body, `golden_lizard_king_webbed_foot_${index + 1}`, plates, foot, [0.34, 0.13, 0.42], 10);
    for (let toe = 0; toe < 3; toe++) {
      const x = foot[0] + (toe - 1) * 0.18;
      const z = foot[2] + (front ? 0.27 : -0.27);
      cone(body, `golden_lizard_king_claw_${index + 1}_${toe + 1}`, claw, [x, 0.13, z], 0.055, 0.27, 5, [front ? Math.PI / 2 : -Math.PI / 2, 0, 0]);
    }
  }
  tube(body, 'golden_lizard_king_tail', scales, [[0, 1.16, -1.45], [0.04, 0.92, -2.12], [0.1, 0.78, -2.85], [0.14, 0.96, -3.55], [0.12, 1.34, -3.94]], 0.34, 32, 10);
  for (let plate = 0; plate < 5; plate++) {
    const progress = plate / 4;
    const scale = 0.28 - progress * 0.1;
    const dorsal = mesh(body, `golden_lizard_king_tail_armored_plate_${plate + 1}`, new THREE.DodecahedronGeometry(scale, 0), plates, [0.08 + progress * 0.04, 1.22 - progress * 0.2, -1.85 - progress * 0.47]);
    dorsal.scale.set(1.25, 0.5, 1.0);
  }
  model.userData.landmarks = ['golden_lizard_king_amphibious_body', 'golden_lizard_king_head', 'golden_lizard_king_dorsal_plate_1', 'golden_lizard_king_tail'];
  return model;
}

function buildGoldenTantalos() {
  const id = 'GOLDEN_TANTALOS';
  const model = root(id, 'Golden Tantalos — O Titã das Areias Solares');
  const gold = material('Tantalos_SunForgedArmor', 0xd6a029, { roughness: 0.24, metalness: 0.94 });
  const trim = material('Tantalos_SolarFiligree', 0xffdc72, { roughness: 0.18, metalness: 0.97, emissive: 0x87520a, emissiveIntensity: 0.3 });
  const bronze = material('Tantalos_ScorchedBronze', 0x6e4819, { roughness: 0.45, metalness: 0.79 });
  const joint = material('Tantalos_ObsidianJoints', 0x302319, { roughness: 0.42, metalness: 0.72 });
  const core = material('Tantalos_SolarCore', 0xfff0a1, { roughness: 0.16, emissive: 0xffb323, emissiveIntensity: 1.8 });

  const body = new THREE.Group();
  body.name = 'golden_tantalos_solar_titan';
  model.add(body);
  for (const side of [-1, 1]) {
    const hip = [side * 0.44, 2.0, 0];
    const knee = [side * 0.5, 1.08, 0.05];
    const ankle = [side * 0.56, 0.2, 0.13];
    beam(body, `golden_tantalos_thigh_${side < 0 ? 'left' : 'right'}`, joint, hip, knee, 0.26, 10);
    box(body, `golden_tantalos_thigh_plate_${side < 0 ? 'left' : 'right'}`, gold, [side * 0.47, 1.58, 0.24], [0.52, 0.72, 0.18]);
    sphere(body, `golden_tantalos_knee_${side < 0 ? 'left' : 'right'}`, trim, knee, [0.34, 0.28, 0.3], 12);
    beam(body, `golden_tantalos_greave_${side < 0 ? 'left' : 'right'}`, gold, knee, ankle, 0.22, 9);
    box(body, `golden_tantalos_boot_${side < 0 ? 'left' : 'right'}`, bronze, [side * 0.56, 0.15, 0.31], [0.62, 0.28, 0.78]);
    box(body, `golden_tantalos_boot_toe_${side < 0 ? 'left' : 'right'}`, trim, [side * 0.56, 0.21, 0.68], [0.58, 0.18, 0.2]);
  }

  cylinder(body, 'golden_tantalos_pelvis', joint, [0, 2.02, 0], 0.62, 0.74, 0.5, 12);
  box(body, 'golden_tantalos_front_tasset', gold, [0, 1.69, 0.42], [0.66, 0.65, 0.16]);
  cylinder(body, 'golden_tantalos_torso', joint, [0, 3.0, 0], 0.77, 0.83, 1.55, 14);
  const cuirass = mesh(body, 'golden_tantalos_solar_cuirass', new THREE.DodecahedronGeometry(0.82, 1), gold, [0, 3.05, 0.36]);
  cuirass.scale.set(1.35, 1.08, 0.62);
  sphere(body, 'golden_tantalos_solar_emblem', core, [0, 3.12, 0.83], [0.28, 0.35, 0.12], 14);
  horizontalRing(body, 'golden_tantalos_emblem_setting', trim, 0.44, 0.055, [0, 3.12, 0.86], 36);
  for (let plate = 0; plate < 4; plate++) {
    box(body, `golden_tantalos_abdomen_plate_${plate + 1}`, bronze, [0, 2.43 + plate * 0.17, 0.62], [0.7 - plate * 0.06, 0.13, 0.09]);
  }
  for (const side of [-1, 1]) {
    const pauldron = mesh(body, `golden_tantalos_sun_pauldron_${side < 0 ? 'left' : 'right'}`, new THREE.DodecahedronGeometry(0.68, 1), trim, [side * 0.96, 3.72, 0.02]);
    pauldron.scale.set(1.35, 0.85, 1.0);
    for (let spike = 0; spike < 3; spike++) cone(body, `golden_tantalos_pauldron_spear_${side}_${spike + 1}`, bronze, [side * (0.86 + spike * 0.22), 4.09 - spike * 0.11, -0.1], 0.15, 0.63, 7, [0, 0, side * -0.45]);
  }
  sphere(body, 'golden_tantalos_helmeted_head', bronze, [0, 4.28, 0.03], [0.46, 0.55, 0.42], 18);
  box(body, 'golden_tantalos_face_mask', gold, [0, 4.17, 0.39], [0.75, 0.28, 0.18]);
  for (const side of [-1, 1]) {
    sphere(body, `golden_tantalos_eye_${side < 0 ? 'left' : 'right'}`, core, [side * 0.15, 4.24, 0.49], [0.07, 0.055, 0.045], 10);
    cone(body, `golden_tantalos_helmet_horn_${side < 0 ? 'left' : 'right'}`, trim, [side * 0.32, 4.59, -0.03], 0.18, 0.74, 7, [0, 0, side * -0.35]);
  }
  cylinder(body, 'golden_tantalos_helmet_circlet', trim, [0, 4.53, 0], 0.49, 0.49, 0.14, 14);
  cone(body, 'golden_tantalos_solar_crest', trim, [0, 4.88, -0.05], 0.2, 0.62, 8);

  for (const side of [-1, 1]) {
    const shoulder = [side * 0.96, 3.66, 0.04];
    const elbow = [side * 1.34, 3.03, 0.16];
    const wrist = [side * 1.4, 2.43, 0.34];
    beam(body, `golden_tantalos_upper_arm_${side < 0 ? 'left' : 'right'}`, joint, shoulder, elbow, 0.25, 10);
    sphere(body, `golden_tantalos_elbow_guard_${side < 0 ? 'left' : 'right'}`, trim, elbow, [0.33, 0.3, 0.32], 12);
    beam(body, `golden_tantalos_forearm_${side < 0 ? 'left' : 'right'}`, gold, elbow, wrist, 0.21, 9);
    box(body, `golden_tantalos_bracer_${side < 0 ? 'left' : 'right'}`, trim, [wrist[0], wrist[1], wrist[2]], [0.38, 0.56, 0.34]);
    sphere(body, `golden_tantalos_fist_${side < 0 ? 'left' : 'right'}`, joint, wrist, [0.23, 0.22, 0.24], 10);
  }

  const mace = new THREE.Group();
  mace.name = 'golden_tantalos_solar_maul';
  mace.position.set(1.76, 0.25, 0.2);
  mace.rotation.z = 0.06;
  body.add(mace);
  cylinder(mace, 'golden_tantalos_maul_shaft', bronze, [0, 1.52, 0], 0.1, 0.15, 3.0, 10);
  const head = mesh(mace, 'golden_tantalos_maul_head', new THREE.IcosahedronGeometry(0.55, 1), trim, [0, 3.18, 0]);
  head.scale.set(1.0, 0.95, 0.9);
  sphere(mace, 'golden_tantalos_maul_core', core, [0, 3.18, 0.42], [0.28, 0.28, 0.18], 12);
  for (let spike = 0; spike < 6; spike++) {
    const angle = (spike / 6) * TAU;
    cone(mace, `golden_tantalos_maul_sunray_${spike + 1}`, bronze, [Math.cos(angle) * 0.57, 3.18 + Math.sin(angle) * 0.57, 0], 0.12, 0.48, 6, [0, 0, -angle]);
  }
  const cape = membrane(body, 'golden_tantalos_desert_cape', material('Tantalos_DesertBanner', 0x8a3c13, { roughness: 0.58, metalness: 0.42, side: THREE.DoubleSide }), [[-0.52, 3.82, -0.55], [0.52, 3.82, -0.55], [0.88, 1.02, -0.72], [-0.76, 1.02, -0.72]]);
  cape.userData.isStaticCape = true;
  model.userData.landmarks = ['golden_tantalos_solar_titan', 'golden_tantalos_solar_cuirass', 'golden_tantalos_solar_maul', 'golden_tantalos_desert_cape'];
  return model;
}

function buildGoldenDragon() {
  const id = 'GOLDEN_DRAGON';
  const model = root(id, 'Great Golden Dragon — O Dragão Dourado de Kundun');
  const scales = material('GoldenDragon_ImperialScales', 0xdfaa32, { roughness: 0.23, metalness: 0.93 });
  const plate = material('GoldenDragon_SunlitArmor', 0xffd45e, { roughness: 0.18, metalness: 0.97, emissive: 0x6c4305, emissiveIntensity: 0.23 });
  const belly = material('GoldenDragon_AmberUnderbelly', 0x95601c, { roughness: 0.42, metalness: 0.75 });
  const membraneMat = material('GoldenDragon_GoldWingMembrane', 0xe4a92e, { roughness: 0.3, metalness: 0.74, transparent: true, opacity: 0.94, side: THREE.DoubleSide });
  const claw = material('GoldenDragon_ObsidianClaws', 0x322716, { roughness: 0.22, metalness: 0.88 });
  const eye = material('GoldenDragon_WhiteSolarEyes', 0xfffac8, { roughness: 0.12, emissive: 0xffbd29, emissiveIntensity: 2.2 });

  const body = new THREE.Group();
  body.name = 'golden_dragon_colossal_body';
  model.add(body);
  sphere(body, 'golden_dragon_barrel_chest', scales, [0, 1.95, 0.42], [1.18, 0.94, 1.72], 24);
  sphere(body, 'golden_dragon_belly', belly, [0, 1.52, 0.95], [0.86, 0.52, 1.16], 20);
  sphere(body, 'golden_dragon_haunches', scales, [0, 1.72, -1.1], [1.16, 0.83, 1.18], 20);
  sphere(body, 'golden_dragon_solar_heart', eye, [0, 2.16, 1.48], [0.27, 0.32, 0.13], 14);
  horizontalRing(body, 'golden_dragon_heart_setting', plate, 0.42, 0.06, [0, 2.16, 1.5], 36);

  tube(body, 'golden_dragon_serpentine_neck', scales, [[0, 2.12, 1.42], [0, 2.36, 1.92], [0, 2.98, 2.32], [0, 3.7, 2.53], [0, 4.12, 2.78]], 0.43, 34, 12);
  sphere(body, 'golden_dragon_skull', scales, [0, 4.25, 2.92], [0.66, 0.48, 0.7], 20);
  sphere(body, 'golden_dragon_muzzle', plate, [0, 4.03, 3.48], [0.52, 0.28, 0.61], 16);
  box(body, 'golden_dragon_lower_jaw', belly, [0, 3.82, 3.44], [0.76, 0.2, 0.55]);
  for (const side of [-1, 1]) {
    sphere(body, `golden_dragon_eye_${side < 0 ? 'left' : 'right'}`, eye, [side * 0.39, 4.3, 3.37], [0.105, 0.08, 0.06], 12);
    cone(body, `golden_dragon_crown_horn_${side < 0 ? 'left' : 'right'}`, plate, [side * 0.44, 4.64, 2.63], 0.2, 0.8, 8, [0, 0, side * -0.3]);
    cone(body, `golden_dragon_jaw_fang_${side < 0 ? 'left' : 'right'}`, plate, [side * 0.25, 3.9, 3.86], 0.085, 0.32, 6, [Math.PI, 0, 0]);
  }
  addDorsalSpines(body, 'golden_dragon_dorsal_spine', plate, [0, 2.82, -1.84], 12, 0.4, 0.7, 0.18);
  for (let index = 0; index < 6; index++) {
    const y = 2.2 + index * 0.3;
    const z = 1.38 - index * 0.43;
    tube(body, `golden_dragon_neck_ridge_${index + 1}`, plate, [[-0.28, y, z], [0, y + 0.12, z - 0.08], [0.28, y, z]], 0.055, 8, 5);
  }

  for (const side of [-1, 1]) {
    const wingRoot = [side * 0.78, 2.76, -0.45];
    const vertices = [
      wingRoot,
      [side * 1.92, 4.72, -0.5],
      [side * 4.72, 5.08, -0.42],
      [side * 4.13, 3.52, -0.36],
      [side * 3.62, 1.5, -0.34],
      [side * 1.58, 1.72, -0.4],
    ];
    membrane(body, `golden_dragon_wing_${side < 0 ? 'left' : 'right'}`, membraneMat, vertices);
    beam(body, `golden_dragon_wing_main_bone_${side < 0 ? 'left' : 'right'}`, plate, wingRoot, vertices[2], 0.13, 9);
    beam(body, `golden_dragon_wing_outer_bone_${side < 0 ? 'left' : 'right'}`, plate, vertices[2], vertices[4], 0.085, 8);
    beam(body, `golden_dragon_wing_inner_rib_${side < 0 ? 'left' : 'right'}`, scales, vertices[1], vertices[5], 0.07, 8);
    beam(body, `golden_dragon_wing_middle_rib_${side < 0 ? 'left' : 'right'}`, scales, wingRoot, vertices[3], 0.065, 8);
    for (let digit = 0; digit < 3; digit++) {
      const from = vertices[3];
      const to = [side * (3.85 + digit * 0.29), 2.55 - digit * 0.35, -0.36];
      beam(body, `golden_dragon_wing_finger_${side}_${digit + 1}`, plate, from, to, 0.055, 7);
    }
  }

  // Four grounded legs, scaled claws, and a long balancing tail.
  for (let index = 0; index < 4; index++) {
    const side = index % 2 === 0 ? -1 : 1;
    const front = index < 2;
    const hip = [side * (front ? 0.83 : 0.92), front ? 1.52 : 1.42, front ? 1.18 : -1.24];
    const knee = [side * (front ? 1.0 : 1.08), 0.83, front ? 1.36 : -1.52];
    const paw = [side * (front ? 1.03 : 1.12), 0.18, front ? 1.73 : -0.86];
    beam(body, `golden_dragon_leg_${index + 1}_upper`, scales, hip, knee, 0.27, 10);
    sphere(body, `golden_dragon_leg_${index + 1}_joint`, plate, knee, [0.32, 0.28, 0.3], 12);
    beam(body, `golden_dragon_leg_${index + 1}_lower`, scales, knee, paw, 0.2, 9);
    sphere(body, `golden_dragon_paw_${index + 1}`, plate, paw, [0.39, 0.17, 0.43], 12);
    for (let toe = 0; toe < 3; toe++) cone(body, `golden_dragon_claw_${index + 1}_${toe + 1}`, claw, [paw[0] + (toe - 1) * 0.19, 0.14, paw[2] + (front ? 0.33 : -0.33)], 0.075, 0.34, 6, [front ? Math.PI / 2 : -Math.PI / 2, 0, 0]);
  }
  tube(body, 'golden_dragon_long_tail', scales, [[0, 1.64, -1.92], [0.04, 1.46, -2.82], [0.08, 1.28, -3.72], [0.16, 1.42, -4.55], [0.25, 1.76, -5.1]], 0.38, 42, 12);
  for (let index = 0; index < 6; index++) {
    const progress = index / 5;
    cone(body, `golden_dragon_tail_spine_${index + 1}`, plate, [0.05 + progress * 0.18, 1.67 - progress * 0.15, -2.2 - progress * 0.52], 0.14 - progress * 0.045, 0.55 - progress * 0.2, 7, [0, 0, -0.2]);
  }
  const tailBlade = mesh(body, 'golden_dragon_tail_solar_blade', new THREE.OctahedronGeometry(0.42, 0), plate, [0.25, 1.84, -5.16]);
  tailBlade.scale.set(0.75, 1.6, 0.48);
  model.userData.landmarks = ['golden_dragon_colossal_body', 'golden_dragon_skull', 'golden_dragon_wing_left', 'golden_dragon_wing_right', 'golden_dragon_long_tail', 'golden_dragon_solar_heart'];
  return model;
}

const builders = {
  GOLDEN_BUDGE_DRAGON: buildGoldenBudgeDragon,
  GOLDEN_SOLDIER: buildGoldenSoldier,
  GOLDEN_LIZARD_KING: buildGoldenLizardKing,
  GOLDEN_TANTALOS: buildGoldenTantalos,
  GOLDEN_DRAGON: buildGoldenDragon,
};

export function buildGoldenInvasionCreature(id) {
  const key = String(id ?? '').trim().toUpperCase();
  const builder = builders[key];
  if (!builder) throw new Error(`Criatura de Invasão Dourada desconhecida: ${id}. Disponíveis: ${GOLDEN_INVASION_IDS.join(', ')}.`);
  return builder();
}
