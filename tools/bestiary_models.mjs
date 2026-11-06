import * as THREE from 'three';
import { createMonster } from '../src/client/dev_viewer/dasi3dContent.js';
import { GOLDEN_INVASION_IDS, buildGoldenInvasionCreature } from './golden_invasion_models.mjs';

/**
 * Static bestiary GLB sources. Four creatures reuse existing Dev Viewer
 * blockouts; Hydra, Zaikan, Kundun and the five Golden Invasion variants use
 * first-pass standalone geometry for their static reference prototypes.
 */

const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);

function pbr(name, color, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.7,
    metalness: options.metalness ?? 0.15,
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

function makeRoot(id, title, source) {
  const root = new THREE.Group();
  root.name = `BESTIARY_${id}`;
  root.userData = {
    assetKind: 'bestiary-creature-static',
    assetVersion: 1,
    creatureId: id,
    title,
    source,
    staticVisualOnly: true,
    collisionsIncluded: false,
    skeletalRigIncluded: false,
    animationClipsIncluded: false,
    runtimeEffectsIncluded: false,
  };
  return root;
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

function box(parent, name, material, position, size, rotation = [0, 0, 0]) {
  return addMesh(parent, name, new THREE.BoxGeometry(size[0], size[1], size[2]), material, position, rotation);
}

function cylinder(parent, name, material, position, radiusTop, radiusBottom, height, segments = 12) {
  return addMesh(parent, name, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material, position);
}

function sphere(parent, name, material, position, scale, segments = 16) {
  const object = addMesh(parent, name, new THREE.SphereGeometry(1, segments, Math.max(8, Math.floor(segments * 0.65))), material, position);
  object.scale.set(scale[0], scale[1], scale[2]);
  return object;
}

function cone(parent, name, material, position, radius, height, segments = 8, rotation = [0, 0, 0]) {
  return addMesh(parent, name, new THREE.ConeGeometry(radius, height, segments), material, position, rotation);
}

function beamBetween(parent, name, material, start, end, radius = 0.12, segments = 8) {
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

function curvedTube(parent, name, material, coordinates, radius, tubularSegments = 32, radialSegments = 10) {
  const curve = new THREE.CatmullRomCurve3(coordinates.map((point) => new THREE.Vector3(...point)), false, 'centripetal');
  return addMesh(parent, name, new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false), material);
}

function horizontalRing(parent, name, material, radius, tube, position, segments = 48) {
  return addMesh(parent, name, new THREE.TorusGeometry(radius, tube, 8, segments), material, position, [Math.PI / 2, 0, 0]);
}

function addBalrogAnatomy(root) {
  const obsidian = pbr('Balrog_ObsidianLimbs', 0x1d1b22, { roughness: 0.62, metalness: 0.42 });
  const armor = pbr('Balrog_VolcanicArmor', 0x3d2928, { roughness: 0.48, metalness: 0.56 });
  const magma = pbr('Balrog_LavaSeams', 0xff5626, { roughness: 0.26, emissive: 0xd8340a, emissiveIntensity: 1.8 });
  const claw = pbr('Balrog_ClawIron', 0x211d24, { roughness: 0.25, metalness: 0.88 });

  for (const side of [-1, 1]) {
    const hip = [side * 0.3, 1.0, 0.02];
    const knee = [side * 0.34, 0.55, 0.05];
    const ankle = [side * 0.35, 0.14, 0.13];
    beamBetween(root, `balrog_thigh_${side < 0 ? 'left' : 'right'}`, obsidian, hip, knee, 0.19, 8);
    sphere(root, `balrog_knee_${side < 0 ? 'left' : 'right'}`, armor, knee, [0.24, 0.22, 0.24], 10);
    beamBetween(root, `balrog_greave_${side < 0 ? 'left' : 'right'}`, armor, knee, ankle, 0.16, 8);
    box(root, `balrog_hoof_${side < 0 ? 'left' : 'right'}`, claw, [side * 0.35, 0.09, 0.27], [0.48, 0.18, 0.64], [0.05, 0, side * 0.05]);
    cone(root, `balrog_hoof_spur_${side < 0 ? 'left' : 'right'}`, claw, [side * 0.35, 0.13, 0.57], 0.11, 0.42, 5, [Math.PI / 2, 0, 0]);

    const shoulder = [side * 0.48, 2.0, 0.02];
    const elbow = [side * 0.75, 1.7, 0.14];
    const wrist = side > 0 ? [0.77, 1.4, 0.3] : [-0.92, 1.25, 0.22];
    beamBetween(root, `balrog_upper_arm_${side < 0 ? 'left' : 'right'}`, obsidian, shoulder, elbow, 0.18, 8);
    sphere(root, `balrog_elbow_guard_${side < 0 ? 'left' : 'right'}`, armor, elbow, [0.25, 0.26, 0.25], 10);
    beamBetween(root, `balrog_forearm_${side < 0 ? 'left' : 'right'}`, armor, elbow, wrist, 0.16, 8);
    sphere(root, `balrog_gauntlet_${side < 0 ? 'left' : 'right'}`, claw, wrist, [0.23, 0.2, 0.22], 10);
    for (let finger = 0; finger < 3; finger++) {
      cone(root, `balrog_finger_claw_${side}_${finger + 1}`, claw, [wrist[0] + side * (finger - 1) * 0.12, wrist[1] - 0.12, wrist[2] + 0.18], 0.06, 0.28, 5, [Math.PI, 0, 0]);
    }
    const pauldron = addMesh(root, `balrog_shoulder_plate_${side < 0 ? 'left' : 'right'}`, new THREE.DodecahedronGeometry(0.42, 0), armor, [side * 0.62, 2.12, -0.03]);
    pauldron.scale.set(1.24, 0.76, 0.92);
    cone(root, `balrog_shoulder_horn_${side < 0 ? 'left' : 'right'}`, claw, [side * 0.82, 2.38, -0.04], 0.15, 0.62, 7, [0, 0, side * -0.4]);
  }

  box(root, 'balrog_lower_cuirass', armor, [0, 1.05, 0.25], [0.75, 0.36, 0.56]);
  for (let rib = 0; rib < 4; rib++) {
    box(root, `balrog_magma_rib_${rib + 1}`, magma, [0, 1.28 + rib * 0.2, 0.34], [0.62 - rib * 0.06, 0.045, 0.035]);
  }
  return root;
}

function addGoldenTitanAnatomy(root) {
  const gold = pbr('GoldenTitan_SolarGoldLimbs', 0xd89516, { roughness: 0.2, metalness: 0.94, emissive: 0x5a3200, emissiveIntensity: 0.22 });
  const trim = pbr('GoldenTitan_Trim', 0xffd65a, { roughness: 0.18, metalness: 0.97, emissive: 0xa66e08, emissiveIntensity: 0.42 });
  const dark = pbr('GoldenTitan_JointShadow', 0x66450e, { roughness: 0.37, metalness: 0.84 });
  const glow = pbr('GoldenTitan_InnerLight', 0xfff2a1, { roughness: 0.18, emissive: 0xffc928, emissiveIntensity: 1.3 });

  for (const side of [-1, 1]) {
    const hip = [side * 0.23, 1.15, 0];
    const knee = [side * 0.27, 0.62, 0.04];
    const ankle = [side * 0.28, 0.16, 0.12];
    beamBetween(root, `golden_titan_thigh_${side < 0 ? 'left' : 'right'}`, gold, hip, knee, 0.22, 8);
    box(root, `golden_titan_thigh_guard_${side < 0 ? 'left' : 'right'}`, trim, [side * 0.25, 0.94, 0.2], [0.38, 0.49, 0.14]);
    sphere(root, `golden_titan_knee_${side < 0 ? 'left' : 'right'}`, trim, knee, [0.28, 0.22, 0.26], 10);
    beamBetween(root, `golden_titan_greave_${side < 0 ? 'left' : 'right'}`, gold, knee, ankle, 0.17, 8);
    box(root, `golden_titan_boot_${side < 0 ? 'left' : 'right'}`, dark, [side * 0.28, 0.13, 0.24], [0.48, 0.24, 0.62]);
    box(root, `golden_titan_boot_toe_${side < 0 ? 'left' : 'right'}`, trim, [side * 0.28, 0.17, 0.53], [0.46, 0.17, 0.18]);

    const shoulder = [side * 0.58, 2.02, 0];
    const elbow = [side * 0.83, 1.7, 0.08];
    const wrist = side > 0 ? [0.68, 1.35, 0.25] : [-0.9, 1.35, 0.22];
    beamBetween(root, `golden_titan_upper_arm_${side < 0 ? 'left' : 'right'}`, gold, shoulder, elbow, 0.19, 8);
    sphere(root, `golden_titan_elbow_${side < 0 ? 'left' : 'right'}`, dark, elbow, [0.23, 0.22, 0.23], 10);
    beamBetween(root, `golden_titan_forearm_${side < 0 ? 'left' : 'right'}`, gold, elbow, wrist, 0.17, 8);
    box(root, `golden_titan_bracer_${side < 0 ? 'left' : 'right'}`, trim, [wrist[0], wrist[1] + 0.05, wrist[2]], [0.3, 0.43, 0.28]);
    sphere(root, `golden_titan_fist_${side < 0 ? 'left' : 'right'}`, dark, wrist, [0.21, 0.2, 0.22], 10);
  }
  box(root, 'golden_titan_belt', trim, [0, 1.08, 0.27], [0.74, 0.18, 0.16]);
  box(root, 'golden_titan_front_tasset', gold, [0, 0.76, 0.28], [0.4, 0.46, 0.14]);
  for (let side of [-1, 1]) {
    box(root, `golden_titan_side_tasset_${side < 0 ? 'left' : 'right'}`, trim, [side * 0.36, 0.75, 0.08], [0.18, 0.42, 0.16], [0, 0, side * 0.18]);
  }
  sphere(root, 'golden_titan_solar_buckle', glow, [0, 1.08, 0.38], [0.13, 0.14, 0.07], 12);
  return root;
}

function addExistingBlockout(id, title, scale, landmarks) {
  const generated = createMonster(id, THREE);
  const root = generated.group;
  generated.parts.groundRing?.removeFromParent();
  if (id === 'BALROG') addBalrogAnatomy(root);
  if (id === 'GOLDEN_TITAN') addGoldenTitanAnatomy(root);
  root.name = `BESTIARY_${id}`;
  root.scale.setScalar(scale);
  if (id === 'GORGON') root.position.y = 0.38;
  if (id === 'BALROG') root.position.y = 0.06;
  root.userData = {
    assetKind: 'bestiary-creature-static',
    assetVersion: 1,
    creatureId: id,
    title,
    source: 'src/client/dev_viewer/dasi3dContent.js:createMonster',
    staticVisualOnly: true,
    collisionsIncluded: false,
    skeletalRigIncluded: false,
    animationClipsIncluded: false,
    runtimeEffectsIncluded: false,
    landmarks: Object.values(landmarks),
  };
  for (const [part, name] of Object.entries(landmarks)) {
    const object = generated.parts[part];
    if (object?.isObject3D) object.name = name;
  }
  let index = 0;
  root.traverse((object) => {
    if (object !== root && !object.name) {
      object.name = `${id.toLowerCase()}_${object.isMesh ? 'mesh' : 'node'}_${String(index++).padStart(3, '0')}`;
    }
  });
  return root;
}

function buildHydra() {
  const root = makeRoot('HYDRA', 'Hydra — O Terror dos Mares de Atlans', 'tools/bestiary_models.mjs');
  const m = {
    scale: pbr('Hydra_AbyssalScales', 0x07576a, { roughness: 0.32, metalness: 0.52 }),
    belly: pbr('Hydra_PearlBelly', 0x8bd6cb, { roughness: 0.42, metalness: 0.12 }),
    ridge: pbr('Hydra_LeviathanRidge', 0x113944, { roughness: 0.38, metalness: 0.5 }),
    coral: pbr('Hydra_VenomCoral', 0x26c4c3, { roughness: 0.24, metalness: 0.28, emissive: 0x078e9b, emissiveIntensity: 1.15 }),
    eye: pbr('Hydra_AbyssalEyes', 0x6fffe4, { roughness: 0.16, emissive: 0x00ddb8, emissiveIntensity: 2.8 }),
    tooth: pbr('Hydra_CoralFangs', 0xd6f0dc, { roughness: 0.3, metalness: 0.1 }),
    fin: pbr('Hydra_TranslucentFin', 0x1597a6, { roughness: 0.36, metalness: 0.15, transparent: true, opacity: 0.82, side: THREE.DoubleSide }),
  };

  const body = group(root, 'hydra_coiled_body');
  sphere(body, 'hydra_main_muscle', m.scale, [0, 1.55, -0.35], [1.28, 0.82, 2.0], 28);
  sphere(body, 'hydra_underbelly', m.belly, [0, 1.24, 0.05], [0.9, 0.42, 1.68], 24);
  sphere(body, 'hydra_shoulder_mass', m.scale, [0, 1.88, 1.04], [1.12, 0.86, 0.94], 24);
  curvedTube(body, 'hydra_tail_curve', m.scale, [
    [0, 1.42, -1.55], [0.02, 1.38, -2.35], [0.14, 1.9, -2.98], [0.26, 2.78, -3.28], [0.35, 3.25, -3.18],
  ], 0.32, 30, 12);
  for (let index = 0; index < 10; index++) {
    const z = -1.7 + index * 0.31;
    const y = 2.2 + Math.sin((index / 9) * Math.PI) * 0.34;
    cone(body, `hydra_dorsal_spine_${String(index + 1).padStart(2, '0')}`, index % 2 ? m.coral : m.ridge, [0, y, z], 0.23, 0.68 + (index % 3) * 0.08, 7, [0, 0, index % 2 ? 0.08 : -0.08]);
  }
  for (let side of [-1, 1]) {
    const fin = addMesh(body, `hydra_swim_fin_${side < 0 ? 'left' : 'right'}`, new THREE.PlaneGeometry(1.35, 0.95, 3, 3), m.fin, [side * 1.18, 1.32, -0.22], [0.08, side * 0.32, side * -0.22]);
    fin.scale.set(side, 1, 1);
    beamBetween(body, `hydra_swim_fin_bone_${side < 0 ? 'left' : 'right'}`, m.coral, [side * 0.75, 1.35, -0.1], [side * 1.74, 1.48, -0.55], 0.055, 7);
  }

  const heads = [
    { id: 'left', x: -1.14, height: 4.13, z: 2.17, scale: 0.9 },
    { id: 'center', x: 0, height: 4.58, z: 2.38, scale: 1.08 },
    { id: 'right', x: 1.14, height: 4.13, z: 2.17, scale: 0.9 },
  ];
  for (const [index, headConfig] of heads.entries()) {
    const head = group(root, `hydra_head_${headConfig.id}`);
    const { x, height, z, scale } = headConfig;
    curvedTube(head, `hydra_neck_${headConfig.id}`, m.scale, [
      [x * 0.7, 1.72, 0.85], [x * 0.9, 2.15, 1.18], [x, 2.92, 1.55], [x * 1.02, height - 0.35, 1.94], [x, height - 0.15, z - 0.15],
    ], 0.28 * scale, 26, 12);
    sphere(head, `hydra_skull_${headConfig.id}`, m.scale, [x, height, z], [0.64 * scale, 0.47 * scale, 0.76 * scale], 22);
    sphere(head, `hydra_snout_${headConfig.id}`, m.belly, [x, height - 0.15, z + 0.56 * scale], [0.47 * scale, 0.26 * scale, 0.48 * scale], 18);
    box(head, `hydra_jaw_${headConfig.id}`, m.scale, [x, height - 0.38 * scale, z + 0.55 * scale], [0.77 * scale, 0.2 * scale, 0.62 * scale]);
    for (const side of [-1, 1]) {
      sphere(head, `hydra_eye_${headConfig.id}_${side < 0 ? 'left' : 'right'}`, m.eye, [x + side * 0.28 * scale, height + 0.08 * scale, z + 0.59 * scale], [0.1 * scale, 0.085 * scale, 0.07 * scale], 12);
      cone(head, `hydra_temporal_horn_${headConfig.id}_${side < 0 ? 'left' : 'right'}`, m.coral, [x + side * 0.43 * scale, height + 0.37 * scale, z - 0.12 * scale], 0.18 * scale, 0.67 * scale, 7, [side * 0.22, 0, side * -0.44]);
    }
    for (let tooth = 0; tooth < 4; tooth++) {
      const tx = (tooth - 1.5) * 0.16 * scale;
      cone(head, `hydra_fang_${headConfig.id}_${tooth + 1}`, m.tooth, [x + tx, height - 0.38 * scale, z + 0.81 * scale], 0.09 * scale, 0.29 * scale, 6, [Math.PI, 0, 0]);
    }
    for (let gill = 0; gill < 3; gill++) {
      cone(head, `hydra_gill_${headConfig.id}_${gill + 1}`, m.ridge, [x + (index - 1) * 0.08, height - 0.28 + gill * 0.17, z - 0.42 * scale], 0.12 * scale, 0.45 * scale, 6, [0, 0, (gill - 1) * 0.2]);
    }
  }

  for (let index = 0; index < 7; index++) {
    const angle = (index / 7) * TAU;
    const x = Math.cos(angle) * 0.78;
    const z = -0.45 + Math.sin(angle) * 1.1;
    sphere(root, `hydra_bioluminescent_vent_${index + 1}`, m.eye, [x, 1.72 + (index % 2) * 0.16, z], [0.1, 0.09, 0.1], 10);
  }
  root.position.y = -0.72;
  root.userData.landmarks = ['hydra_coiled_body', 'hydra_head_left', 'hydra_head_center', 'hydra_head_right', 'hydra_tail_curve'];
  return root;
}

function buildZaikan() {
  const root = makeRoot('ZAIKAN', 'Zaikan — O Flagelo das Areias', 'tools/bestiary_models.mjs');
  const m = {
    shell: pbr('Zaikan_ScorchedGoldenCarapace', 0x80551e, { roughness: 0.39, metalness: 0.72 }),
    shellLight: pbr('Zaikan_SunlitChitin', 0xc18a32, { roughness: 0.3, metalness: 0.76 }),
    under: pbr('Zaikan_DesertChitin', 0x392b1d, { roughness: 0.72, metalness: 0.36 }),
    edge: pbr('Zaikan_BlackenedSickleSteel', 0x292522, { roughness: 0.25, metalness: 0.9 }),
    core: pbr('Zaikan_SolarVacuumCore', 0xff9f1c, { roughness: 0.2, metalness: 0.2, emissive: 0xf06b0a, emissiveIntensity: 2.3 }),
    psionic: pbr('Zaikan_PsionicAmber', 0xf2df78, { roughness: 0.18, metalness: 0.55, emissive: 0xb98920, emissiveIntensity: 1.15 }),
    bone: pbr('Zaikan_OssifiedMandibles', 0xd1b87e, { roughness: 0.63, metalness: 0.14 }),
  };

  const abdomen = group(root, 'zaikan_scorpion_abdomen');
  sphere(abdomen, 'zaikan_underbody', m.under, [0, 1.58, -0.58], [1.02, 0.77, 1.25], 22);
  sphere(abdomen, 'zaikan_dorsal_shell', m.shell, [0, 2.0, -0.56], [1.05, 0.67, 1.12], 20);
  for (let plate = 0; plate < 5; plate++) {
    const z = 0.24 - plate * 0.44;
    const plateMesh = addMesh(abdomen, `zaikan_abdominal_armor_${plate + 1}`, new THREE.DodecahedronGeometry(0.56 - plate * 0.03, 0), plate % 2 ? m.shell : m.shellLight, [0, 1.85 - plate * 0.09, z]);
    plateMesh.scale.set(1.25, 0.42, 0.82);
    plateMesh.rotation.z = plate % 2 ? -0.08 : 0.08;
  }
  for (let index = 0; index < 7; index++) {
    const x = (index - 3) * 0.22;
    cone(abdomen, `zaikan_dorsal_spike_${index + 1}`, m.edge, [x, 2.66, -0.3 - Math.abs(index - 3) * 0.12], 0.16, 0.64, 6, [0, 0, (index - 3) * -0.14]);
  }

  const thorax = group(root, 'zaikan_biomechanical_thorax');
  cylinder(thorax, 'zaikan_torso_core', m.under, [0, 2.55, 0.12], 0.72, 0.9, 1.18, 12);
  sphere(thorax, 'zaikan_breastplate', m.shellLight, [0, 2.64, 0.64], [0.82, 0.92, 0.3], 20);
  sphere(thorax, 'zaikan_solar_vacuum_core', m.core, [0, 2.62, 0.94], [0.29, 0.36, 0.12], 16);
  horizontalRing(thorax, 'zaikan_chest_core_setting', m.psionic, 0.42, 0.055, [0, 2.62, 0.98], 32);
  for (const side of [-1, 1]) {
    const pauldron = addMesh(thorax, `zaikan_shoulder_shell_${side < 0 ? 'left' : 'right'}`, new THREE.DodecahedronGeometry(0.66, 0), m.shellLight, [side * 0.86, 3.05, 0.1]);
    pauldron.scale.set(1.15, 0.77, 1.0);
    cone(thorax, `zaikan_shoulder_spur_${side < 0 ? 'left' : 'right'}`, m.edge, [side * 1.18, 3.42, 0.0], 0.24, 0.95, 7, [0, 0, side * -0.45]);
  }
  sphere(root, 'zaikan_chitinous_head', m.shell, [0, 3.52, 0.28], [0.58, 0.47, 0.62], 18);
  box(root, 'zaikan_mandible_bridge', m.under, [0, 3.32, 0.78], [0.74, 0.24, 0.54]);
  for (const side of [-1, 1]) {
    sphere(root, `zaikan_eye_${side < 0 ? 'left' : 'right'}`, m.psionic, [side * 0.24, 3.57, 0.77], [0.13, 0.12, 0.08], 12);
    cone(root, `zaikan_mandible_${side < 0 ? 'left' : 'right'}`, m.bone, [side * 0.27, 3.15, 0.96], 0.18, 0.68, 6, [Math.PI, 0, side * 0.3]);
    curvedTube(root, `zaikan_psionic_antenna_${side < 0 ? 'left' : 'right'}`, m.shellLight, [
      [side * 0.27, 3.85, 0.28], [side * 0.44, 4.2, 0.22], [side * 0.62, 4.52, 0.09], [side * 0.7, 4.82, 0.15],
    ], 0.075, 18, 7);
    const antennaCore = addMesh(root, `zaikan_antenna_psionic_crystal_${side < 0 ? 'left' : 'right'}`, new THREE.OctahedronGeometry(0.19, 1), m.psionic, [side * 0.7, 4.83, 0.15]);
    antennaCore.rotation.z = side * 0.25;
  }

  for (let index = 0; index < 4; index++) {
    const side = index % 2 === 0 ? -1 : 1;
    const rear = index >= 2;
    const z0 = rear ? -0.6 : 0.12;
    const z1 = rear ? -1.4 : 0.85;
    const hip = [side * 0.72, 1.8, z0];
    const knee = [side * (rear ? 1.35 : 1.4), 1.0, z1];
    const foot = [side * (rear ? 1.72 : 1.74), 0.18, z1 + (rear ? -0.16 : 0.24)];
    beamBetween(root, `zaikan_walking_leg_${index + 1}_upper`, m.shell, hip, knee, 0.22, 8);
    sphere(root, `zaikan_walking_leg_${index + 1}_joint`, m.shellLight, knee, [0.28, 0.25, 0.26], 10);
    beamBetween(root, `zaikan_walking_leg_${index + 1}_lower`, m.under, knee, foot, 0.13, 8);
    cone(root, `zaikan_walking_leg_${index + 1}_spur`, m.edge, [foot[0], 0.2, foot[2] + 0.12], 0.13, 0.4, 6, [Math.PI / 2, 0, side * 0.22]);
  }

  for (const side of [-1, 1]) {
    const shoulder = [side * 0.86, 2.92, 0.4];
    const elbow = [side * 1.35, 2.38, 0.62];
    const wrist = [side * 1.74, 1.96, 0.92];
    beamBetween(root, `zaikan_sickle_arm_${side < 0 ? 'left' : 'right'}_upper`, m.shellLight, shoulder, elbow, 0.24, 9);
    beamBetween(root, `zaikan_sickle_arm_${side < 0 ? 'left' : 'right'}_forearm`, m.shell, elbow, wrist, 0.18, 9);
    sphere(root, `zaikan_sickle_arm_${side < 0 ? 'left' : 'right'}_wrist`, m.edge, wrist, [0.3, 0.24, 0.3], 10);
    curvedTube(root, `zaikan_scythe_blade_${side < 0 ? 'left' : 'right'}`, m.edge, [
      [wrist[0], wrist[1], wrist[2]], [side * 2.02, 2.28, 1.05], [side * 2.23, 2.72, 0.93], [side * 2.18, 3.17, 0.65], [side * 1.92, 3.42, 0.53],
    ], 0.13, 22, 8);
  }

  curvedTube(root, 'zaikan_scorpion_tail', m.shellLight, [
    [0, 1.92, -1.35], [0.05, 2.22, -1.82], [0.12, 2.95, -1.92], [0.14, 3.75, -1.64], [0.1, 4.42, -1.16], [0, 4.86, -0.63],
  ], 0.25, 34, 11);
  for (let index = 0; index < 5; index++) {
    const t = index / 4;
    const y = 2.2 + t * 2.45;
    const z = -1.8 + t * 1.12;
    const segment = addMesh(root, `zaikan_tail_armored_segment_${index + 1}`, new THREE.DodecahedronGeometry(0.32 - t * 0.06, 0), index % 2 ? m.shell : m.shellLight, [0.08 + t * 0.05, y, z]);
    segment.scale.set(1.1, 0.62, 0.82);
  }
  cone(root, 'zaikan_solar_stinger', m.edge, [0, 5.22, -0.48], 0.4, 1.05, 7, [Math.PI, 0, 0]);
  cone(root, 'zaikan_stinger_core', m.core, [0, 5.2, -0.42], 0.17, 0.72, 6, [Math.PI, 0, 0]);
  root.position.y = -0.07;
  root.userData.landmarks = ['zaikan_scorpion_abdomen', 'zaikan_biomechanical_thorax', 'zaikan_solar_vacuum_core', 'zaikan_scorpion_tail', 'zaikan_solar_stinger'];
  return root;
}

function buildKundun() {
  const root = makeRoot('KUNDUN', 'Lord Kundun — Mestre do Caos', 'tools/bestiary_models.mjs');
  const m = {
    robe: pbr('Kundun_ChaosVelvet', 0x171329, { roughness: 0.67, metalness: 0.22, side: THREE.DoubleSide }),
    armor: pbr('Kundun_ObsidianArmor', 0x29213d, { roughness: 0.3, metalness: 0.84 }),
    armorLight: pbr('Kundun_ChaosSteel', 0x5d477a, { roughness: 0.26, metalness: 0.88 }),
    gold: pbr('Kundun_AgedGold', 0x9a7438, { roughness: 0.32, metalness: 0.82 }),
    flesh: pbr('Kundun_AshenSkin', 0x876c85, { roughness: 0.63, metalness: 0.12 }),
    eye: pbr('Kundun_VoidEyes', 0xe27cff, { roughness: 0.15, emissive: 0x9416c7, emissiveIntensity: 2.9 }),
    chaos: pbr('Kundun_ChaosCore', 0xc23fff, { roughness: 0.18, metalness: 0.2, emissive: 0x8000d9, emissiveIntensity: 2.2 }),
    stone: pbr('Kundun_GravestoneRelics', 0x3b3444, { roughness: 0.85, metalness: 0.15 }),
  };

  const mantle = group(root, 'kundun_chaos_mantle');
  const robe = addMesh(mantle, 'kundun_floor_length_robe', new THREE.ConeGeometry(1.28, 2.5, 16, 3, true), m.robe, [0, 1.42, -0.02]);
  robe.scale.set(1, 1, 0.82);
  cylinder(mantle, 'kundun_robe_waist_guard', m.armor, [0, 2.35, 0.04], 0.52, 0.72, 0.42, 12);
  for (let fold = 0; fold < 12; fold++) {
    const angle = (fold / 12) * TAU;
    const x = Math.cos(angle) * 0.94;
    const z = Math.sin(angle) * 0.62;
    const foldMesh = box(mantle, `kundun_robe_gold_hem_${fold + 1}`, m.gold, [x, 0.29, z], [0.12, 0.08, 0.32], [0, angle, 0]);
    foldMesh.scale.set(1, 1, 0.75);
  }

  const torso = group(root, 'kundun_chaos_torso');
  cylinder(torso, 'kundun_chest_cuirass', m.armor, [0, 3.04, 0.02], 0.48, 0.67, 1.18, 12);
  box(torso, 'kundun_front_breastplate', m.armorLight, [0, 3.13, 0.47], [0.82, 0.93, 0.2]);
  sphere(torso, 'kundun_chest_chaos_orb', m.chaos, [0, 3.1, 0.62], [0.27, 0.33, 0.14], 18);
  horizontalRing(torso, 'kundun_chest_orb_setting', m.gold, 0.39, 0.055, [0, 3.1, 0.63], 32);
  for (const side of [-1, 1]) {
    const shoulder = addMesh(torso, `kundun_spiked_pauldron_${side < 0 ? 'left' : 'right'}`, new THREE.DodecahedronGeometry(0.72, 1), m.armorLight, [side * 0.78, 3.58, -0.02]);
    shoulder.scale.set(1.15, 0.72, 1.0);
    for (let spike = 0; spike < 3; spike++) {
      cone(torso, `kundun_pauldron_spike_${side}_${spike + 1}`, m.gold, [side * (0.78 + spike * 0.14), 4.02 - spike * 0.08, -0.03 - spike * 0.14], 0.16, 0.72, 6, [0, 0, side * -0.38]);
    }
  }

  sphere(root, 'kundun_face', m.flesh, [0, 4.05, 0.1], [0.43, 0.54, 0.4], 20);
  box(root, 'kundun_face_guard', m.armor, [0, 3.94, 0.42], [0.72, 0.23, 0.2]);
  for (const side of [-1, 1]) {
    sphere(root, `kundun_eye_${side < 0 ? 'left' : 'right'}`, m.eye, [side * 0.16, 4.08, 0.45], [0.09, 0.075, 0.06], 12);
    curvedTube(root, `kundun_crown_horn_${side < 0 ? 'left' : 'right'}`, m.armorLight, [
      [side * 0.24, 4.35, 0], [side * 0.42, 4.7, -0.02], [side * 0.52, 5.1, -0.09], [side * 0.37, 5.42, -0.12],
    ], 0.15, 20, 8);
    cone(root, `kundun_temple_spike_${side < 0 ? 'left' : 'right'}`, m.gold, [side * 0.55, 4.24, 0], 0.14, 0.56, 6, [0, 0, side * -0.4]);
  }
  cylinder(root, 'kundun_crown_band', m.gold, [0, 4.45, 0], 0.48, 0.49, 0.15, 12);
  const crownGem = addMesh(root, 'kundun_crown_chaos_gem', new THREE.OctahedronGeometry(0.24, 1), m.chaos, [0, 4.6, 0.43]);
  crownGem.rotation.z = 0.22;

  const arms = group(root, 'kundun_four_arms');
  for (const side of [-1, 1]) {
    const shoulder = [side * 0.76, 3.55, 0.06];
    const elbow = [side * 1.18, 2.96, 0.22];
    const wrist = [side * 1.42, 2.43, 0.44];
    beamBetween(arms, `kundun_upper_arm_${side < 0 ? 'left' : 'right'}`, m.armor, shoulder, elbow, 0.19, 10);
    sphere(arms, `kundun_elbow_${side < 0 ? 'left' : 'right'}`, m.armorLight, elbow, [0.25, 0.27, 0.25], 12);
    beamBetween(arms, `kundun_forearm_${side < 0 ? 'left' : 'right'}`, m.armorLight, elbow, wrist, 0.16, 10);
    sphere(arms, `kundun_gauntlet_${side < 0 ? 'left' : 'right'}`, m.armor, wrist, [0.27, 0.24, 0.3], 12);
    for (let finger = 0; finger < 3; finger++) {
      cone(arms, `kundun_claw_${side}_${finger + 1}`, m.gold, [wrist[0] + side * (finger - 1) * 0.12, wrist[1] - 0.19, wrist[2] + 0.12], 0.07, 0.3, 5, [Math.PI, 0, 0]);
    }
  }
  // Lower, smaller pair of spectral arms frames the chest core without implying a rig.
  for (const side of [-1, 1]) {
    const shoulder = [side * 0.52, 2.95, -0.18];
    const wrist = [side * 1.02, 2.26, -0.08];
    beamBetween(arms, `kundun_spectral_lower_arm_${side < 0 ? 'left' : 'right'}`, m.stone, shoulder, wrist, 0.11, 8);
    const hand = addMesh(arms, `kundun_spectral_lower_hand_${side < 0 ? 'left' : 'right'}`, new THREE.OctahedronGeometry(0.22, 0), m.eye, wrist);
    hand.scale.set(0.8, 1.25, 0.6);
  }

  const staff = group(root, 'kundun_chaos_staff');
  staff.position.set(1.68, 0.15, 0.08);
  staff.rotation.z = -0.07;
  cylinder(staff, 'kundun_staff_shaft', m.armorLight, [0, 2.25, 0], 0.075, 0.12, 4.5, 10);
  cylinder(staff, 'kundun_staff_grip', m.gold, [0, 1.25, 0.02], 0.11, 0.11, 0.75, 8);
  for (let index = 0; index < 3; index++) {
    const angle = (index / 3) * TAU;
    beamBetween(staff, `kundun_staff_orb_cage_${index + 1}`, m.gold, [0, 4.36, 0], [Math.cos(angle) * 0.58, 4.82, Math.sin(angle) * 0.48], 0.045, 7);
  }
  sphere(staff, 'kundun_staff_chaos_orb', m.chaos, [0, 4.77, 0], [0.38, 0.42, 0.38], 18);
  horizontalRing(staff, 'kundun_staff_orb_ring_x', m.eye, 0.55, 0.045, [0, 4.77, 0], 40);
  const ringZ = addMesh(staff, 'kundun_staff_orb_ring_z', new THREE.TorusGeometry(0.48, 0.04, 8, 40), m.gold, [0, 4.77, 0]);
  ringZ.rotation.y = Math.PI / 2;

  const halo = group(root, 'kundun_gravitational_halo');
  halo.position.set(0, 3.38, -0.72);
  const haloA = addMesh(halo, 'kundun_halo_primary_ring', new THREE.TorusGeometry(1.38, 0.065, 8, 64), m.eye);
  haloA.rotation.x = 0.3;
  const haloB = addMesh(halo, 'kundun_halo_crossing_ring', new THREE.TorusGeometry(1.05, 0.045, 8, 56), m.gold);
  haloB.rotation.set(1.1, 0.35, 0.4);
  const haloC = addMesh(halo, 'kundun_halo_chaos_ring', new THREE.TorusGeometry(0.74, 0.035, 8, 48), m.chaos);
  haloC.rotation.set(0.2, 1.0, 0.85);
  for (let index = 0; index < 8; index++) {
    const angle = (index / 8) * TAU;
    const crystal = addMesh(halo, `kundun_halo_floating_rune_${index + 1}`, new THREE.OctahedronGeometry(0.17 + (index % 3) * 0.04, 0), index % 2 ? m.gold : m.chaos, [Math.cos(angle) * 1.45, Math.sin(angle) * 1.0, 0]);
    crystal.rotation.set(angle, angle * 1.3, -angle * 0.4);
  }
  root.position.y = -0.14;
  root.userData.landmarks = ['kundun_chaos_mantle', 'kundun_chaos_torso', 'kundun_crown_chaos_gem', 'kundun_chaos_staff', 'kundun_gravitational_halo'];
  return root;
}

const creatureBuilders = {
  ICE_QUEEN: () => addExistingBlockout('ICE_QUEEN', 'Ice Queen — A Dama Solitária de Boreal', 1.1, {
    gown: 'ice_queen_ice_gown', torso: 'ice_queen_crystalline_bodice', head: 'ice_queen_face', crown: 'ice_queen_ice_crown', scepter: 'ice_queen_frost_scepter', frostHalo: 'ice_queen_blizzard_halo',
  }),
  GORGON: () => addExistingBlockout('GORGON', 'Gorgon — O Guardião do Abismo', 1.55, {
    coil: 'gorgon_serpentine_coil', tail: 'gorgon_triple_stinger_tail', torso: 'gorgon_scaled_torso', head: 'gorgon_serpent_crown', armL: 'gorgon_left_claw', armR: 'gorgon_right_claw',
  }),
  HYDRA: buildHydra,
  BALROG: () => addExistingBlockout('BALROG', 'Balrog — O Lorde do Abismo Infernal', 1.9, {
    torso: 'balrog_obsidian_torso', magmaCore: 'balrog_magma_heart', head: 'balrog_demon_head', wingL: 'balrog_left_wing', wingR: 'balrog_right_wing', scythe: 'balrog_magma_scythe',
  }),
  ZAIKAN: buildZaikan,
  KUNDUN: buildKundun,
  GOLDEN_TITAN: () => addExistingBlockout('GOLDEN_TITAN', 'Golden Titan — O Campeão da Invasão Dourada', 1.45, {
    torso: 'golden_titan_solar_cuirass', head: 'golden_titan_solar_helm', visor: 'golden_titan_solar_visor', sword: 'golden_titan_sunblade', solarHalo: 'golden_titan_halo',
  }),
};
for (const id of GOLDEN_INVASION_IDS) {
  creatureBuilders[id] = () => buildGoldenInvasionCreature(id);
}

export const BESTIARY_CREATURES = Object.freeze(Object.keys(creatureBuilders));

export function buildBestiaryCreature(id) {
  const key = String(id ?? '').trim().toUpperCase();
  const builder = creatureBuilders[key];
  if (!builder) throw new Error(`Criatura sem GLB procedural: ${id}. Disponíveis: ${BESTIARY_CREATURES.join(', ')}.`);
  const root = builder();
  let index = 0;
  root.traverse((object) => {
    if (object !== root && !object.name) object.name = `${key.toLowerCase()}_${object.isMesh ? 'mesh' : 'node'}_${String(index++).padStart(3, '0')}`;
  });
  return root;
}
