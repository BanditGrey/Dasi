/**
 * DASI MMORPG - SISTEMA DE PERSONAGENS, ARMADURAS E ARMAS MODULARES 3D (CONTINENT OF LEGEND)
 * Implementa heróis modulares com 6 slots de armadura (Base e Elite), armas icônicas trocáveis,
 * materiais PBR físicos, asas translúcidas e animação cinemática viva em tempo real.
 */

if (typeof globalThis !== 'undefined' && typeof self === 'undefined') {
  globalThis.self = globalThis;
}

export const HERO_CLASSES = Object.freeze({
  DK: { color: 0x792328, trim: 0xd4af37, accent: 0xef4444, secondary: 0x331014, label: 'Cavaleiro' },
  DW: { color: 0x1e3a8a, trim: 0xe0b84c, accent: 0x38bdf8, secondary: 0x0f172a, label: 'Mago' },
  ELF: { color: 0x166534, trim: 0xdfb750, accent: 0x34d399, secondary: 0x064e3b, label: 'Elfa' },
  MG: { color: 0x1f2937, trim: 0x94a3b8, accent: 0x06b6d4, secondary: 0x7f1d1d, label: 'Gladiador' },
  DL: { color: 0x111827, trim: 0xf59e0b, accent: 0xdc2626, secondary: 0x881337, label: 'Lorde' },
});

export const ARMOR_SLOTS = Object.freeze(['helmet', 'chest', 'shoulders', 'gloves', 'legs', 'boots']);
export const ARMOR_VARIANTS = Object.freeze(['base', 'elite']);

export const CLASS_WEAPONS = Object.freeze({
  DK: Object.freeze(['DRAGON_BLADE', 'ARCHANGEL_SWORD', 'CHAOS_DRAGON_AXE', 'SWORD_OF_DESTRUCTION']),
  DW: Object.freeze(['KUNDUN_STAFF', 'CHAOS_LIGHTNING_STAFF']),
  ELF: Object.freeze(['CELESTIAL_BOW', 'GREAT_REIGN_CROSSBOW']),
  MG: Object.freeze(['RUNE_BLADE', 'DUAL_ELEMENTAL']),
  DL: Object.freeze(['LORD_SCEPTER', 'GREAT_LORD_SCEPTER']),
});

export const WEAPON_NAMES = Object.freeze({
  DRAGON_BLADE: 'Dragon Blade',
  ARCHANGEL_SWORD: 'Sword of Archangel',
  CHAOS_DRAGON_AXE: 'Chaos Dragon Axe',
  SWORD_OF_DESTRUCTION: 'Sword of Destruction',
  KUNDUN_STAFF: 'Staff of Kundun',
  CHAOS_LIGHTNING_STAFF: 'Chaos Lightning Staff',
  CELESTIAL_BOW: 'Celestial Bow',
  GREAT_REIGN_CROSSBOW: 'Great Reign Crossbow',
  RUNE_BLADE: 'Rune Blade of Aether',
  DUAL_ELEMENTAL: 'Dual Flame & Thunder Blades',
  LORD_SCEPTER: 'Imperial Lord Scepter',
  GREAT_LORD_SCEPTER: 'Radiant Lord Scepter',
});

const ANCHORS = Object.freeze({
  helmet: [0, 1.66, 0],
  chest: [0, 1.23, 0],
  shoulders: [0, 1.46, 0],
  gloves: [0, 0.95, 0],
  legs: [0, 0.68, 0],
  boots: [0, 0.17, 0],
});

/**
 * Cria módulo de armadura individual no espaço local do slot.
 * As variantes 'base' e 'elite' possuem geometria, silhueta e acabamentos distintos.
 */
export function createArmorModule(THREE, heroClass, slot, variant) {
  if (!Object.hasOwn(HERO_CLASSES, heroClass) || !ARMOR_SLOTS.includes(slot) || !ARMOR_VARIANTS.includes(variant)) {
    throw new Error('Módulo de armadura inválido');
  }

  const spec = HERO_CLASSES[heroClass];
  const elite = variant === 'elite';

  const group = new THREE.Group();
  group.name = `module_${heroClass}_${slot}_${variant}`;
  group.userData = { kind: 'armor_module', heroClass, slot, variant, formatVersion: 1 };

  const primary = new THREE.MeshStandardMaterial({
    color: spec.color,
    metalness: heroClass === 'DW' ? 0.35 : 0.85,
    roughness: heroClass === 'DW' ? 0.40 : 0.24,
  });

  const trim = new THREE.MeshStandardMaterial({
    color: spec.trim,
    metalness: 0.92,
    roughness: 0.18,
  });

  const gem = new THREE.MeshStandardMaterial({
    color: spec.accent,
    emissive: spec.accent,
    emissiveIntensity: elite ? 2.2 : 0.8,
    roughness: 0.12,
  });

  const darkMetal = new THREE.MeshStandardMaterial({
    color: spec.secondary,
    metalness: 0.90,
    roughness: 0.28,
  });

  function add(geometry, material, x, y, z, name) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // 1. HELMET
  if (slot === 'helmet') {
    if (heroClass === 'DW') {
      const hood = add(new THREE.ConeGeometry(0.26, elite ? 0.58 : 0.40, 12), primary, 0, elite ? 0.28 : 0.22, -0.04, 'hood');
      if (elite) {
        hood.rotation.x = -0.18;
        add(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 16), primary, 0, 0.06, 0, 'hood_brim');
        add(new THREE.TorusGeometry(0.36, 0.015, 6, 16), trim, 0, 0.06, 0, 'hood_rim').rotation.x = Math.PI / 2;
      }
    } else if (heroClass === 'ELF') {
      const circlet = add(new THREE.TorusGeometry(0.18, elite ? 0.035 : 0.025, 8, 16), trim, 0, 0.08, 0, 'circlet');
      circlet.rotation.x = Math.PI / 2.2;
      for (const side of [-1, 1]) {
        const leaf = add(new THREE.ConeGeometry(0.035, 0.16, 4), trim, side * 0.17, 0.10, 0, `circlet_leaf_${side}`);
        leaf.rotation.set(-0.2, 0, side * 0.9);
      }
    } else if (heroClass === 'MG') {
      const band = add(new THREE.TorusGeometry(0.17, 0.025, 6, 16), darkMetal, 0, 0.08, 0, 'circlet');
      band.rotation.x = Math.PI / 2.2;
      add(new THREE.BoxGeometry(0.08, 0.06, 0.04), trim, 0, 0.11, 0.17, 'tiara_crest');
    } else if (heroClass === 'DL') {
      add(new THREE.CylinderGeometry(0.20, 0.19, 0.10, 16), trim, 0, 0.12, 0, 'helm');
      for (let i = 0; i < 5; i++) {
        const ang = (i - 2) * 0.42;
        const spike = add(new THREE.ConeGeometry(0.025, elite ? 0.22 : 0.14, 4), trim, Math.sin(ang) * 0.19, elite ? 0.26 : 0.22, Math.cos(ang) * 0.19, `crown_spike_${i}`);
        spike.rotation.y = ang;
      }
    } else {
      add(new THREE.BoxGeometry(0.34, 0.32, 0.34), primary, 0, 0.05, 0, 'helm');
      add(new THREE.BoxGeometry(0.26, 0.05, 0.06), gem, 0, 0.06, 0.18, 'visor_slit');
    }

    add(new THREE.OctahedronGeometry(elite ? 0.065 : 0.045), gem, 0, 0.12, 0.18, 'helmet_gem');

    if (elite) {
      for (const side of [-1, 1]) {
        const horn = add(new THREE.ConeGeometry(0.06, 0.42, 6), trim, side * 0.22, 0.24, -0.02, `horn_${side}`);
        horn.rotation.set(-0.2, side * 0.3, side * -0.65);
      }
    }
  }

  // 2. CHEST
  else if (slot === 'chest') {
    add(new THREE.BoxGeometry(0.60, 0.54, 0.34), primary, 0, 0, 0, 'chest_plate');
    add(new THREE.BoxGeometry(0.50, 0.04, 0.05), trim, 0, -0.20, 0.19, 'chest_trim');
    add(new THREE.OctahedronGeometry(elite ? 0.11 : 0.075), gem, 0, 0.05, 0.20, 'chest_gem');
    add(new THREE.CylinderGeometry(0.18, 0.24, 0.08, 12), trim, 0, 0.26, 0, 'chest_gorget');

    if (elite) {
      for (const side of [-1, 1]) {
        const edge = add(new THREE.BoxGeometry(0.12, 0.44, 0.06), trim, side * 0.24, 0.01, 0.19, `chest_edge_${side}`);
        edge.rotation.z = side * -0.12;
      }
      add(new THREE.ConeGeometry(0.08, 0.16, 4), darkMetal, 0, -0.06, 0.20, 'chest_crest').rotation.x = Math.PI;
    }
  }

  // 3. SHOULDERS
  else if (slot === 'shoulders') {
    for (const side of [-1, 1]) {
      const shoulder = add(new THREE.SphereGeometry(elite ? 0.25 : 0.20, 10, 8), primary, side * 0.42, 0, 0, `shoulder_${side}`);
      shoulder.scale.set(1.2, 0.70, 0.90);
      add(new THREE.TorusGeometry(elite ? 0.24 : 0.19, 0.025, 6, 12), trim, side * 0.42, 0, 0, `shoulder_rim_${side}`).rotation.y = Math.PI / 2;

      if (elite) {
        const spike = add(new THREE.ConeGeometry(0.095, 0.36, 5), trim, side * 0.48, 0.24, 0, `shoulder_spike_${side}`);
        spike.rotation.set(0, side * 0.2, side * -0.45);
        add(new THREE.OctahedronGeometry(0.05), gem, side * 0.46, 0.04, 0.14, `shoulder_gem_${side}`);
      }
    }
  }

  // 4. GLOVES
  else if (slot === 'gloves') {
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(elite ? 0.22 : 0.18, 0.30, 0.21), primary, side * 0.40, 0, 0, `gauntlet_${side}`);
      add(new THREE.BoxGeometry(elite ? 0.24 : 0.20, 0.05, 0.23), trim, side * 0.40, -0.10, 0, `gauntlet_cuff_${side}`);

      if (elite) {
        add(new THREE.BoxGeometry(0.23, 0.05, 0.23), trim, side * 0.40, 0.10, 0, `gauntlet_trim_${side}`);
        add(new THREE.OctahedronGeometry(0.04), gem, side * 0.40, 0, 0.12, `gauntlet_gem_${side}`);
      }
    }
  }

  // 5. LEGS
  else if (slot === 'legs') {
    for (const side of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.14, 0.12, 0.60, 10), primary, side * 0.18, 0, 0, `greave_${side}`);
      add(new THREE.TorusGeometry(0.13, 0.02, 6, 12), trim, side * 0.18, -0.22, 0, `greave_ring_${side}`).rotation.x = Math.PI / 2;

      const knee = add(new THREE.ConeGeometry(0.08, 0.12, 4), trim, side * 0.18, 0.14, 0.10, `knee_${side}`);
      knee.rotation.x = Math.PI / 2;

      if (elite) {
        add(new THREE.BoxGeometry(0.15, 0.30, 0.05), trim, side * 0.18, 0, 0.13, `greave_trim_${side}`);
        add(new THREE.OctahedronGeometry(0.04), gem, side * 0.18, 0.14, 0.16, `knee_gem_${side}`);
      }
    }
  }

  // 6. BOOTS
  else if (slot === 'boots') {
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(0.24, 0.24, elite ? 0.38 : 0.32), primary, side * 0.18, 0, 0.04, `boot_${side}`);
      add(new THREE.BoxGeometry(0.26, 0.04, elite ? 0.40 : 0.34), darkMetal, side * 0.18, -0.10, 0.04, `boot_sole_${side}`);

      if (elite) {
        add(new THREE.BoxGeometry(0.25, 0.05, 0.36), trim, side * 0.18, -0.03, 0.05, `boot_trim_${side}`);
        const spur = add(new THREE.ConeGeometry(0.04, 0.14, 4), trim, side * 0.18, -0.04, -0.18, `boot_spur_${side}`);
        spur.rotation.x = -Math.PI / 2;
      }
    }
  }

  return group;
}

/**
 * Cria módulo de arma individual e intercambiável com materiais PBR e nós canônicos.
 */
export function createWeaponModule(THREE, heroClass, weaponId) {
  if (!Object.hasOwn(CLASS_WEAPONS, heroClass) || !CLASS_WEAPONS[heroClass].includes(weaponId)) {
    throw new Error('Módulo de arma inválido');
  }

  const group = new THREE.Group();
  group.name = `module_${heroClass}_weapon_${weaponId.toLowerCase()}`;
  group.userData = { kind: 'weapon_module', heroClass, weaponId, formatVersion: 1 };

  const matGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.92, roughness: 0.18 });
  const matSteel = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.12 });
  const matDarkSteel = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.90, roughness: 0.22 });
  const matLeather = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.75 });
  const matRuby = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.5, roughness: 0.1 });
  const matSapphire = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.8, roughness: 0.08 });
  const matEmerald = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 2.5, roughness: 0.1 });
  const matOrangeFlame = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 3.0, roughness: 0.1 });
  const matCyanNeon = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 3.0, roughness: 0.08 });
  const matPurpleLightning = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 3.0, roughness: 0.1 });

  function part(geometry, material, x, y, z, name) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  }

  if (weaponId === 'DRAGON_BLADE') {
    part(new THREE.BoxGeometry(0.14, 1.45, 0.04), matSteel, 0, 0.55, 0, 'blade');
    part(new THREE.BoxGeometry(0.38, 0.07, 0.09), matGold, 0, -0.22, 0, 'guard');
    part(new THREE.CylinderGeometry(0.035, 0.035, 0.35, 8), matLeather, 0, -0.42, 0, 'grip');
    part(new THREE.OctahedronGeometry(0.06), matRuby, 0, -0.62, 0, 'pommel');
    const tip = part(new THREE.ConeGeometry(0.09, 0.26, 4), matSteel, 0, 1.38, 0, 'blade_tip');
    tip.rotation.y = Math.PI / 4;
    part(new THREE.BoxGeometry(0.05, 1.30, 0.05), matRuby, 0, 0.55, 0, 'blade_fuller');
    for (const side of [-1, 1]) {
      const horn = part(new THREE.ConeGeometry(0.045, 0.28, 5), matGold, side * 0.22, -0.12, 0, `guard_horn_${side}`);
      horn.rotation.z = side * -0.55;
    }
  } else if (weaponId === 'ARCHANGEL_SWORD') {
    part(new THREE.BoxGeometry(0.12, 1.50, 0.035), matSteel, 0, 0.60, 0, 'blade');
    part(new THREE.CylinderGeometry(0.032, 0.032, 0.36, 10), matGold, 0, -0.38, 0, 'grip');
    part(new THREE.SphereGeometry(0.06, 12, 12), matSapphire, 0, -0.58, 0, 'pommel');
    const tip = part(new THREE.ConeGeometry(0.08, 0.30, 4), matSteel, 0, 1.45, 0, 'blade_tip');
    tip.rotation.y = Math.PI / 4;
    part(new THREE.BoxGeometry(0.04, 1.35, 0.042), matSapphire, 0, 0.60, 0, 'blade_fuller');
    for (const side of [-1, 1]) {
      const wing = part(new THREE.BoxGeometry(0.18, 0.06, 0.05), matGold, side * 0.18, -0.16, 0, `angel_guard_${side}`);
      wing.rotation.z = side * -0.4;
    }
    part(new THREE.OctahedronGeometry(0.06), matSapphire, 0, -0.16, 0.04, 'guard_gem');
  } else if (weaponId === 'CHAOS_DRAGON_AXE') {
    part(new THREE.CylinderGeometry(0.04, 0.035, 1.60, 10), matDarkSteel, 0, 0.20, 0, 'grip');
    part(new THREE.BoxGeometry(0.18, 0.22, 0.16), matGold, 0, 0.85, 0, 'axe_socket');
    part(new THREE.OctahedronGeometry(0.08), matOrangeFlame, 0, 0.85, 0.08, 'axe_core');
    for (const side of [-1, 1]) {
      const blade = part(new THREE.BoxGeometry(0.35, 0.50, 0.04), matSteel, side * 0.26, 0.85, 0, `blade_axe_${side}`);
      blade.rotation.z = side * 0.15;
      part(new THREE.BoxGeometry(0.04, 0.52, 0.045), matOrangeFlame, side * 0.44, 0.85, 0, `axe_edge_${side}`);
    }
    const tip = part(new THREE.ConeGeometry(0.06, 0.35, 4), matSteel, 0, 1.15, 0, 'axe_tip');
    tip.rotation.y = Math.PI / 4;
  } else if (weaponId === 'SWORD_OF_DESTRUCTION') {
    part(new THREE.BoxGeometry(0.18, 1.40, 0.038), matDarkSteel, 0, 0.55, 0, 'blade');
    part(new THREE.BoxGeometry(0.48, 0.09, 0.10), matDarkSteel, 0, -0.22, 0, 'guard');
    part(new THREE.CylinderGeometry(0.035, 0.035, 0.38, 8), matDarkSteel, 0, -0.42, 0, 'grip');
    part(new THREE.ConeGeometry(0.07, 0.18, 5), matDarkSteel, 0, -0.65, 0, 'pommel').rotation.x = Math.PI;
    part(new THREE.BoxGeometry(0.05, 1.30, 0.045), matRuby, 0, 0.55, 0, 'magma_core');
    const tip = part(new THREE.ConeGeometry(0.12, 0.32, 4), matDarkSteel, 0, 1.35, 0, 'blade_tip');
    tip.rotation.y = Math.PI / 4;
    for (let i = 0; i < 4; i++) {
      part(new THREE.ConeGeometry(0.035, 0.12, 4), matDarkSteel, 0.11, 0.1 + i * 0.28, 0, `serration_${i}`).rotation.z = -Math.PI / 2;
    }
  } else if (weaponId === 'KUNDUN_STAFF') {
    part(new THREE.CylinderGeometry(0.035, 0.035, 1.90, 10), matDarkSteel, 0, 0.15, 0, 'staff');
    part(new THREE.SphereGeometry(0.15, 16, 16), matSapphire, 0, 1.15, 0, 'staff_focus');
    const ring = part(new THREE.TorusGeometry(0.24, 0.025, 6, 16), matGold, 0, 1.15, 0, 'staff_ring');
    ring.rotation.x = Math.PI / 2;
    part(new THREE.CylinderGeometry(0.05, 0.04, 0.25, 8), matGold, 0, 0.95, 0, 'staff_collar');
  } else if (weaponId === 'CHAOS_LIGHTNING_STAFF') {
    part(new THREE.CylinderGeometry(0.035, 0.035, 1.85, 10), matDarkSteel, 0, 0.15, 0, 'staff');
    part(new THREE.OctahedronGeometry(0.13), matPurpleLightning, 0, 1.15, 0, 'staff_focus');
    const ring = part(new THREE.TorusGeometry(0.22, 0.02, 6, 16), matPurpleLightning, 0, 1.15, 0, 'staff_ring');
    ring.rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) {
      const prong = part(new THREE.ConeGeometry(0.03, 0.30, 4), matSteel, side * 0.16, 1.25, 0, `lightning_prong_${side}`);
      prong.rotation.z = side * -0.25;
    }
    part(new THREE.ConeGeometry(0.035, 0.38, 4), matSteel, 0, 1.30, 0, 'lightning_prong_center');
  } else if (weaponId === 'CELESTIAL_BOW') {
    part(new THREE.TorusGeometry(0.66, 0.032, 8, 24, Math.PI * 0.95), matGold, 0, 0, 0, 'bow').rotation.z = Math.PI * 0.52;
    part(new THREE.CylinderGeometry(0.008, 0.008, 1.28), matEmerald, 0.30, 0, 0, 'bowstring');
    const arrow = part(new THREE.CylinderGeometry(0.012, 0.012, 0.85), matSteel, 0.15, 0, 0, 'arrow');
    arrow.rotation.z = Math.PI / 2;
    part(new THREE.OctahedronGeometry(0.05), matEmerald, 0, 0, 0.03, 'bow_gem');
  } else if (weaponId === 'GREAT_REIGN_CROSSBOW') {
    part(new THREE.BoxGeometry(0.14, 0.12, 0.90), matDarkSteel, 0, 0, 0, 'stock');
    part(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 16), matGold, 0, 0.08, -0.10, 'drum');
    part(new THREE.BoxGeometry(0.70, 0.05, 0.06), matSteel, 0, 0.04, 0.35, 'bow_limbs');
    part(new THREE.CylinderGeometry(0.008, 0.008, 0.68), matSteel, 0, 0.04, 0.15, 'crossbow_string');
    part(new THREE.BoxGeometry(0.05, 0.03, 0.75), matEmerald, 0, 0.08, 0.20, 'arrow');
  } else if (weaponId === 'RUNE_BLADE') {
    part(new THREE.BoxGeometry(0.09, 1.35, 0.035), matSteel, -0.05, 0.45, 0, 'blade_l');
    part(new THREE.BoxGeometry(0.09, 1.35, 0.035), matSteel, 0.05, 0.45, 0, 'blade_r');
    part(new THREE.BoxGeometry(0.03, 1.30, 0.042), matCyanNeon, 0, 0.45, 0, 'blade_aether');
    part(new THREE.BoxGeometry(0.36, 0.06, 0.08), matGold, 0, -0.22, 0, 'guard');
    part(new THREE.CylinderGeometry(0.032, 0.032, 0.35, 8), matDarkSteel, 0, -0.42, 0, 'grip');
    part(new THREE.OctahedronGeometry(0.055), matCyanNeon, 0, -0.62, 0, 'pommel');
  } else if (weaponId === 'DUAL_ELEMENTAL') {
    part(new THREE.BoxGeometry(0.11, 1.28, 0.035), matSteel, 0, 0.45, 0, 'blade');
    part(new THREE.BoxGeometry(0.32, 0.06, 0.08), matGold, 0, -0.22, 0, 'guard');
    part(new THREE.CylinderGeometry(0.032, 0.032, 0.32, 8), matDarkSteel, 0, -0.40, 0, 'grip');
    part(new THREE.BoxGeometry(0.02, 1.20, 0.038), matOrangeFlame, 0.055, 0.45, 0, 'blade_fire_edge');

    const leftBladeGroup = new THREE.Group();
    leftBladeGroup.name = 'blade_thunder_left';
    leftBladeGroup.position.set(-1.32, 0, 0);
    group.add(leftBladeGroup);

    const tbl = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.28, 0.035), matSteel);
    tbl.position.y = 0.45;
    leftBladeGroup.add(tbl);
    const tg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.08), matGold);
    tg.position.y = -0.22;
    leftBladeGroup.add(tg);
    const tgr = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.32, 8), matDarkSteel);
    tgr.position.y = -0.40;
    leftBladeGroup.add(tgr);
    const tedge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.20, 0.038), matCyanNeon);
    tedge.position.set(-0.055, 0.45, 0);
    leftBladeGroup.add(tedge);
  } else if (weaponId === 'LORD_SCEPTER') {
    part(new THREE.CylinderGeometry(0.035, 0.035, 1.70, 10), matDarkSteel, 0, 0.15, 0, 'staff');
    part(new THREE.SphereGeometry(0.13, 16, 16), matRuby, 0, 1.05, 0, 'staff_focus');
    part(new THREE.TorusGeometry(0.19, 0.022, 6, 16), matGold, 0, 1.05, 0, 'scepter_ring');

    const shieldGroup = new THREE.Group();
    shieldGroup.name = 'shield_pavise_dl';
    shieldGroup.position.set(-1.21, 0, 0.05);
    group.add(shieldGroup);

    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 16), matGold);
    sh.rotation.z = Math.PI / 2;
    shieldGroup.add(sh);
    const shSpike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), matRuby);
    shSpike.rotation.y = Math.PI / 4;
    shSpike.position.x = -0.04;
    shieldGroup.add(shSpike);
  } else if (weaponId === 'GREAT_LORD_SCEPTER') {
    part(new THREE.CylinderGeometry(0.038, 0.034, 1.80, 12), matGold, 0, 0.20, 0, 'staff');
    part(new THREE.DodecahedronGeometry(0.14), matGold, 0, 1.15, 0, 'staff_focus');
    part(new THREE.TorusGeometry(0.24, 0.03, 6, 18), matGold, 0, 1.15, 0, 'scepter_halo');
    for (let i = 0; i < 8; i++) {
      const ang = i * (Math.PI / 4);
      const spike = part(new THREE.ConeGeometry(0.025, 0.16, 4), matRuby, Math.sin(ang) * 0.24, 1.15 + Math.cos(ang) * 0.24, 0, `sun_ray_${i}`);
      spike.rotation.z = -ang;
    }

    const eagleShield = new THREE.Group();
    eagleShield.name = 'shield_eagle_dl';
    eagleShield.position.set(-1.21, 0, 0.05);
    group.add(eagleShield);

    const esh = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.65, 0.45), matDarkSteel);
    eagleShield.add(esh);
    const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), matGold);
    crest.position.set(-0.06, 0.05, 0);
    eagleShield.add(crest);
  }

  return group;
}

/**
 * Cria o personagem heróico completo montado com corpo anatômico, armas icônicas trocáveis,
 * asas e slots para módulos de armadura.
 */
export function createModularHero(THREE, heroClass, variant = 'base', initialWeapon = null) {
  if (!Object.hasOwn(HERO_CLASSES, heroClass) || !ARMOR_VARIANTS.includes(variant)) {
    throw new Error('Herói modular inválido');
  }

  const group = new THREE.Group();
  group.name = `hero_${heroClass}_modular`;
  group.userData = { kind: 'modular_hero', heroClass, formatVersion: 1 };

  const spec = HERO_CLASSES[heroClass];
  const glowMaterials = [];

  let skinColor = 0xc98c62;
  if (heroClass === 'ELF') skinColor = 0xf0d5c0;
  else if (heroClass === 'MG' || heroClass === 'DL') skinColor = 0xd49b6a;

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.55,
    metalness: 0.05,
  });

  const hairColor = heroClass === 'ELF' ? 0xfde047 : heroClass === 'MG' ? 0xd1d5db : 0x27272a;
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColor,
    roughness: 0.40,
    metalness: heroClass === 'MG' ? 0.25 : 0.08,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: spec.trim,
    metalness: 0.92,
    roughness: 0.18,
  });
  glowMaterials.push(metalMat);

  const weaponSteelMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.12,
  });
  glowMaterials.push(weaponSteelMat);

  const gemMat = new THREE.MeshStandardMaterial({
    color: spec.accent,
    emissive: spec.accent,
    emissiveIntensity: 2.5,
    roughness: 0.10,
  });
  glowMaterials.push(gemMat);

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: spec.secondary,
    metalness: 0.90,
    roughness: 0.28,
  });
  glowMaterials.push(darkMetalMat);

  // CORPO DE REFERÊNCIA & ANATOMIA
  const body = new THREE.Group();
  body.name = 'body_blockout';
  group.add(body);

  function bodyPart(geometry, material, x, y, z, name) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    body.add(mesh);
    return mesh;
  }

  const headMesh = bodyPart(new THREE.SphereGeometry(0.16, 16, 14), skinMat, 0, 1.66, 0, 'head_base');
  
  if (heroClass === 'ELF') {
    for (const side of [-1, 1]) {
      const ear = bodyPart(new THREE.ConeGeometry(0.04, 0.22, 4), skinMat, side * 0.16, 1.66, -0.04, `ear_${side}`);
      ear.rotation.set(-0.35, 0, side * 1.15);
    }
    const hair = bodyPart(new THREE.CylinderGeometry(0.05, 0.22, 0.75, 8), hairMat, 0, 1.48, -0.14, 'long_hair');
    hair.rotation.x = 0.22;
  } else if (heroClass === 'MG') {
    const sHair = bodyPart(new THREE.ConeGeometry(0.20, 0.55, 8), hairMat, 0, 1.84, -0.06, 'spiky_hair');
    sHair.rotation.x = 0.35;
  }

  bodyPart(new THREE.BoxGeometry(0.48, 0.48, 0.26), skinMat, 0, 1.23, 0, 'torso_base');

  for (const side of [-1, 1]) {
    bodyPart(new THREE.CylinderGeometry(0.08, 0.07, 0.54, 8), skinMat, side * 0.38, 1.12, 0, `arm_${side}`);
    bodyPart(new THREE.CylinderGeometry(0.10, 0.08, 0.68, 8), skinMat, side * 0.16, 0.63, 0, `leg_${side}`);
  }

  // Companheiro Corvo no DL
  if (heroClass === 'DL') {
    const raven = new THREE.Group();
    raven.name = 'dark_raven_companion';
    raven.position.set(-0.42, 1.58, 0);
    group.add(raven);

    const ravenBody = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.20, 8), darkMetalMat);
    ravenBody.rotation.x = 0.35;
    raven.add(ravenBody);
    const ravenHead = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), darkMetalMat);
    ravenHead.position.set(0, 0.12, 0.06);
    raven.add(ravenHead);
    const ravenBeak = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.07, 4), metalMat);
    ravenBeak.position.set(0, 0.11, 0.11);
    ravenBeak.rotation.x = Math.PI / 2;
    raven.add(ravenBeak);
  }

  // ASAS TRANSLÚCIDAS ARTICULADAS
  const wingsGroup = new THREE.Group();
  wingsGroup.name = `wings_blockout_${heroClass}`;
  wingsGroup.position.set(0, 1.35, -0.16);
  group.add(wingsGroup);

  const wingColor = spec.accent;
  const wingMat = new THREE.MeshStandardMaterial({
    color: wingColor,
    emissive: wingColor,
    emissiveIntensity: 0.75,
    roughness: 0.22,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });
  glowMaterials.push(wingMat);

  const wingL = new THREE.Group();
  wingL.name = 'wing_left';
  const boneL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.05), metalMat);
  boneL.position.x = -0.42;
  wingL.add(boneL);
  const membL = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.65, 4, 4), wingMat);
  membL.position.set(-0.42, -0.32, 0);
  membL.rotation.y = 0.2;
  wingL.add(membL);
  wingsGroup.add(wingL);

  const wingR = new THREE.Group();
  wingR.name = 'wing_right';
  const boneR = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.05), metalMat);
  boneR.position.x = 0.42;
  wingR.add(boneR);
  const membR = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.65, 4, 4), wingMat);
  membR.position.set(0.42, -0.32, 0);
  membR.rotation.y = -0.2;
  wingR.add(membR);
  wingsGroup.add(wingR);

  // ÂNCORAS DOS SLOTS DE ARMADURA
  const anchors = {};
  const selections = {};

  for (const slot of ARMOR_SLOTS) {
    const anchor = new THREE.Group();
    anchor.name = `slot_${slot}`;
    anchor.position.fromArray(ANCHORS[slot]);
    group.add(anchor);
    anchors[slot] = anchor;
  }

  let currentRefineLevel = 0;
  function updateRefinementGlow(level) {
    currentRefineLevel = level;
    let emissiveColor = new THREE.Color(0x000000);
    let intensity = 0.0;
    let roughness = 0.22;

    if (level <= 6) {
      emissiveColor = new THREE.Color(0x000000);
      intensity = 0.0;
      roughness = 0.25;
    } else if (level <= 8) {
      emissiveColor = new THREE.Color(0x38bdf8); // Ciano gélido clássico +7/+8
      intensity = 0.9;
      roughness = 0.16;
    } else if (level <= 10) {
      emissiveColor = new THREE.Color(0xfbbf24); // Ouro brilhante +9/+10
      intensity = 1.6;
      roughness = 0.10;
    } else if (level <= 12) {
      emissiveColor = new THREE.Color(0xf97316); // Fogo carmesim/laranja +11/+12
      intensity = 2.4;
      roughness = 0.06;
    } else {
      emissiveColor = new THREE.Color(0xe879f9); // Roxo/Magenta Celestial +13/+15
      intensity = 3.6;
      roughness = 0.02;
    }

    group.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          if (mat.isMeshStandardMaterial && mat.name !== 'skin') {
            mat.roughness = roughness;
            if (level >= 7) {
              mat.emissive = mat.emissive || new THREE.Color();
              mat.emissive.copy(emissiveColor);
              mat.emissiveIntensity = intensity;
            } else if (mat.userData?.originalEmissive) {
              mat.emissive.copy(mat.userData.originalEmissive);
              mat.emissiveIntensity = mat.userData.originalIntensity ?? 0;
            } else {
              mat.emissive.setHex(0x000000);
              mat.emissiveIntensity = 0;
            }
          }
        }
      }
    });
  }

  function setArmor(slot, next) {
    if (!ARMOR_SLOTS.includes(slot) || !ARMOR_VARIANTS.includes(next)) return false;
    const module = createArmorModule(THREE, heroClass, slot, next);
    const anchor = anchors[slot];
    for (const old of [...anchor.children]) {
      anchor.remove(old);
      const materials = new Set();
      old.traverse(node => {
        if (node.isMesh) {
          node.geometry.dispose();
          for (const m of Array.isArray(node.material) ? node.material : [node.material]) materials.add(m);
        }
      });
      for (const material of materials) material.dispose();
    }
    anchor.add(module);
    selections[slot] = next;
    if (currentRefineLevel > 0) updateRefinementGlow(currentRefineLevel);
    return true;
  }

  for (const slot of ARMOR_SLOTS) setArmor(slot, variant);

  // ÂNCORA DA ARMA MODULAR
  const weaponAnchor = new THREE.Group();
  weaponAnchor.name = 'slot_weapon';
  weaponAnchor.position.set(0.66, 1.02, 0.1);
  group.add(weaponAnchor);
  anchors.weapon = weaponAnchor;

  let currentWeapon = initialWeapon || CLASS_WEAPONS[heroClass][0];

  function setWeapon(weaponId) {
    if (!CLASS_WEAPONS[heroClass]?.includes(weaponId)) return false;
    for (const old of [...weaponAnchor.children]) {
      weaponAnchor.remove(old);
      const materials = new Set();
      old.traverse(node => {
        if (node.isMesh) {
          node.geometry.dispose();
          for (const m of Array.isArray(node.material) ? node.material : [node.material]) materials.add(m);
        }
      });
      for (const material of materials) material.dispose();
    }
    const wepModule = createWeaponModule(THREE, heroClass, weaponId);
    wepModule.name = `weapon_blockout_${heroClass}`;
    weaponAnchor.add(wepModule);
    currentWeapon = weaponId;
    if (currentRefineLevel > 0) updateRefinementGlow(currentRefineLevel);
    return true;
  }

  setWeapon(currentWeapon);

  // MOTOR DE ANIMAÇÃO CINEMÁTICA VIVA
  const updateAnim = (animName, time, delta) => {
    const breath = Math.sin(time * 2.4);
    body.position.y = breath * 0.015;
    headMesh.rotation.x = breath * 0.02;

    const wingFlap = Math.sin(time * 3.2) * 0.18;
    wingL.rotation.y = wingFlap - 0.25;
    wingR.rotation.y = -wingFlap + 0.25;

    if (heroClass === 'DW') {
      const staffRing = weaponAnchor.getObjectByName('staff_ring');
      if (staffRing) {
        staffRing.rotation.x = time * 2.0;
        staffRing.rotation.y = time * 1.5;
      }
      const staffFocus = weaponAnchor.getObjectByName('staff_focus');
      if (staffFocus) {
        staffFocus.position.y = 1.15 + Math.sin(time * 3.5) * 0.04;
      }
    } else if (heroClass === 'DL') {
      const raven = group.getObjectByName('dark_raven_companion');
      if (raven) {
        raven.rotation.y = Math.sin(time * 1.6) * 0.25;
        raven.position.y = 1.58 + Math.sin(time * 2.8) * 0.015;
      }
      const halo = weaponAnchor.getObjectByName('scepter_halo');
      if (halo) {
        halo.rotation.z = time * 1.2;
      }
    } else if (heroClass === 'MG') {
      weaponAnchor.rotation.x = -Math.sin(time * 3.0) * 0.05;
    }

    if (animName === 'TWISTING_SLASH' || animName === 'SKILL_1') {
      group.rotation.y = (time * 12.0) % (Math.PI * 2);
    } else if (animName === 'DEATH_STAB' || animName === 'SKILL_2') {
      const thrust = Math.sin(time * 10.0);
      group.position.z = Math.max(0, thrust * 0.6);
    } else if (animName === 'ROLL' || animName === 'DODGE') {
      const roll = (time * 6.0) % (Math.PI * 2);
      group.rotation.x = roll;
      group.position.y = Math.sin(roll) * 0.3;
    } else {
      group.rotation.y = 0;
      group.rotation.x = 0;
      group.position.z = 0;
    }
  };

  return {
    group,
    anchors,
    setArmor,
    getArmor: () => ({ ...selections }),
    setWeapon,
    getWeapon: () => currentWeapon,
    getAvailableWeapons: () => [...CLASS_WEAPONS[heroClass]],
    updateAnim,
    updateRefinementGlow,
    glowMaterials,
  };
}
