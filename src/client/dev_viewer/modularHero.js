/** Protótipos 3D modulares de heróis. Não são modelos finais nem rigs esqueléticos. */
export const HERO_CLASSES = Object.freeze({
  DK: { color: 0x792328, trim: 0xa38649, accent: 0xd54735, label: 'Cavaleiro' },
  DW: { color: 0x322960, trim: 0xa99558, accent: 0x37b6da, label: 'Mago' },
  ELF: { color: 0x215846, trim: 0xc19a4d, accent: 0x79cf84, label: 'Elfa' },
  MG: { color: 0x28375d, trim: 0x8995ab, accent: 0x8c70d9, label: 'Gladiador' },
  DL: { color: 0x252832, trim: 0xc69d52, accent: 0xad2637, label: 'Lorde' },
});
export const ARMOR_SLOTS = Object.freeze(['helmet', 'chest', 'shoulders', 'gloves', 'legs', 'boots']);
export const ARMOR_VARIANTS = Object.freeze(['base', 'elite']);
const ANCHORS = Object.freeze({ helmet: [0, 1.66, 0], chest: [0, 1.23, 0], shoulders: [0, 1.46, 0], gloves: [0, 0.95, 0], legs: [0, 0.68, 0], boots: [0, 0.17, 0] });

/** Cria peça no espaço local do slot; as duas variantes possuem geometrias distintas. */
export function createArmorModule(THREE, heroClass, slot, variant) {
  if (!Object.hasOwn(HERO_CLASSES, heroClass) || !ARMOR_SLOTS.includes(slot) || !ARMOR_VARIANTS.includes(variant)) throw new Error('Módulo de armadura inválido');
  const spec = HERO_CLASSES[heroClass], elite = variant === 'elite';
  const group = new THREE.Group();
  group.name = `module_${heroClass}_${slot}_${variant}`;
  group.userData = { kind: 'armor_module', heroClass, slot, variant, formatVersion: 1 };
  const primary = new THREE.MeshStandardMaterial({ color: spec.color, metalness: 0.72, roughness: 0.38 });
  const trim = new THREE.MeshStandardMaterial({ color: spec.trim, metalness: 0.8, roughness: 0.28 });
  const gem = new THREE.MeshStandardMaterial({ color: spec.accent, emissive: spec.accent, emissiveIntensity: elite ? 0.5 : 0.15, roughness: 0.3 });
  function add(geometry, material, x, y, z, name) {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.name = name; mesh.castShadow = true; group.add(mesh); return mesh;
  }
  if (slot === 'helmet') {
    if (heroClass === 'DW') add(new THREE.ConeGeometry(0.25, elite ? 0.48 : 0.36, 8), primary, 0, 0.22, 0, 'hood');
    else if (heroClass === 'ELF') add(new THREE.TorusGeometry(0.16, 0.03, 6, 12), trim, 0, 0.12, 0, 'circlet').rotation.x = Math.PI / 2;
    else add(new THREE.BoxGeometry(0.32, 0.3, 0.3), primary, 0, 0.04, 0, 'helm');
    add(new THREE.OctahedronGeometry(0.055), gem, 0, 0.1, 0.17, 'helmet_gem');
    if (elite) for (const side of [-1, 1]) {
      const horn = add(new THREE.ConeGeometry(0.055, 0.32, 5), trim, side * 0.21, 0.22, 0, `horn_${side}`); horn.rotation.z = -side * 0.5;
    }
  } else if (slot === 'chest') {
    add(new THREE.BoxGeometry(0.58, 0.52, 0.32), primary, 0, 0, 0, 'chest_plate');
    add(new THREE.BoxGeometry(0.46, 0.035, 0.04), trim, 0, -0.19, 0.18, 'chest_trim');
    add(new THREE.OctahedronGeometry(elite ? 0.1 : 0.07), gem, 0, 0.04, 0.19, 'chest_gem');
    if (elite) for (const side of [-1, 1]) add(new THREE.BoxGeometry(0.1, 0.4, 0.04), trim, side * 0.21, 0, 0.18, `chest_edge_${side}`);
  } else if (slot === 'shoulders') {
    for (const side of [-1, 1]) {
      const shoulder = add(new THREE.SphereGeometry(elite ? 0.23 : 0.18, 8, 6), primary, side * 0.39, 0, 0, `shoulder_${side}`);
      shoulder.scale.set(1.1, 0.65, 0.85);
      if (elite) { const spike = add(new THREE.ConeGeometry(0.09, 0.27, 5), trim, side * 0.44, 0.2, 0, `shoulder_spike_${side}`); spike.rotation.z = -side * 0.35; }
    }
  } else if (slot === 'gloves') {
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(elite ? 0.2 : 0.16, 0.25, 0.19), primary, side * 0.38, 0, 0, `gauntlet_${side}`);
      if (elite) add(new THREE.BoxGeometry(0.19, 0.045, 0.2), trim, side * 0.38, 0.08, 0, `gauntlet_trim_${side}`);
    }
  } else if (slot === 'legs') {
    for (const side of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.13, 0.11, 0.55, 8), primary, side * 0.16, 0, 0, `greave_${side}`);
      if (elite) add(new THREE.BoxGeometry(0.14, 0.25, 0.04), trim, side * 0.16, 0, 0.12, `greave_trim_${side}`);
    }
  } else if (slot === 'boots') {
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(0.23, 0.22, elite ? 0.35 : 0.29), primary, side * 0.16, 0, 0.035, `boot_${side}`);
      if (elite) add(new THREE.BoxGeometry(0.23, 0.04, 0.34), trim, side * 0.16, -0.04, 0.04, `boot_trim_${side}`);
    }
  }
  return group;
}

export function createModularHero(THREE, heroClass, variant = 'base') {
  if (!Object.hasOwn(HERO_CLASSES, heroClass) || !ARMOR_VARIANTS.includes(variant)) throw new Error('Herói modular inválido');
  const group = new THREE.Group(); group.name = `hero_${heroClass}_modular`;
  group.userData = { kind: 'modular_hero', heroClass, formatVersion: 1 };
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x75685c, roughness: 0.9 });
  const body = new THREE.Group(); body.name = 'body_blockout'; group.add(body);
  function bodyMesh(geometry, x, y, z, name) { const mesh = new THREE.Mesh(geometry, bodyMat); mesh.name = name; mesh.position.set(x, y, z); body.add(mesh); }
  bodyMesh(new THREE.SphereGeometry(0.15, 12, 8), 0, 1.66, 0, 'head_base');
  bodyMesh(new THREE.BoxGeometry(0.43, 0.46, 0.23), 0, 1.23, 0, 'torso_base');
  for (const side of [-1, 1]) {
    bodyMesh(new THREE.CylinderGeometry(0.075, 0.065, 0.52, 8), side * 0.38, 1.12, 0, `arm_${side}`);
    bodyMesh(new THREE.CylinderGeometry(0.09, 0.08, 0.64, 8), side * 0.16, 0.63, 0, `leg_${side}`);
  }
  // Armas indicativas de cada arquétipo; são blockouts fixos, não equipamentos do inventário.
  const weapon = new THREE.Group(); weapon.name = `weapon_blockout_${heroClass}`; weapon.position.set(0.66, 1.02, 0.1); group.add(weapon);
  const metal = new THREE.MeshStandardMaterial({ color: HERO_CLASSES[heroClass].trim, metalness: 0.7, roughness: 0.35 });
  const magic = new THREE.MeshStandardMaterial({ color: HERO_CLASSES[heroClass].accent, emissive: HERO_CLASSES[heroClass].accent, emissiveIntensity: 0.25 });
  function weaponPart(geometry, material, x, y, z, name) { const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.position.set(x, y, z); weapon.add(mesh); return mesh; }
  if (heroClass === 'DK' || heroClass === 'MG') {
    weaponPart(new THREE.BoxGeometry(0.09, 0.83, 0.045), metal, 0, 0.25, 0, 'blade');
    weaponPart(new THREE.BoxGeometry(0.32, 0.06, 0.08), metal, 0, -0.13, 0, 'guard');
    weaponPart(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), magic, 0, -0.28, 0, 'grip');
  } else if (heroClass === 'ELF') {
    weaponPart(new THREE.TorusGeometry(0.42, 0.028, 6, 20, Math.PI), metal, 0, 0, 0, 'bow');
    weaponPart(new THREE.BoxGeometry(0.012, 0.84, 0.012), metal, -0.01, 0, 0, 'bowstring');
  } else {
    weaponPart(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), metal, 0, 0, 0, 'staff');
    weaponPart(new THREE.OctahedronGeometry(heroClass === 'DL' ? 0.16 : 0.12), magic, 0, 0.62, 0, 'staff_focus');
  }
  const anchors = {}, selections = {};
  for (const slot of ARMOR_SLOTS) {
    const anchor = new THREE.Group(); anchor.name = `slot_${slot}`; anchor.position.fromArray(ANCHORS[slot]); group.add(anchor); anchors[slot] = anchor;
  }
  function setArmor(slot, next) {
    if (!ARMOR_SLOTS.includes(slot) || !ARMOR_VARIANTS.includes(next)) return false;
    const module = createArmorModule(THREE, heroClass, slot, next);
    const anchor = anchors[slot];
    for (const old of [...anchor.children]) {
      anchor.remove(old);
      const materials = new Set(); old.traverse(node => { if (node.isMesh) { node.geometry.dispose(); for (const m of Array.isArray(node.material) ? node.material : [node.material]) materials.add(m); } });
      for (const material of materials) material.dispose();
    }
    anchor.add(module); selections[slot] = next; return true;
  }
  for (const slot of ARMOR_SLOTS) setArmor(slot, variant);
  return { group, anchors, setArmor, getArmor: () => ({ ...selections }), updateAnim: () => {}, glowMaterials: [] };
}
