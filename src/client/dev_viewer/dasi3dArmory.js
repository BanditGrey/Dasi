/**
 * DASI MMORPG - MOTOR DE ARMARIA E FORJA 3D (WEBGL THREE.JS & BLENDER 5.2)
 * Reconstrução e Exibição Tridimensional de Todas as Armaduras, Armas e Escudos Canônicos.
 * Suporta Modelos Reais GLB (Blender 5.2 PBR) e Geometrias Procedurais WebGL em Tempo Real.
 */

import { GLTFLoader } from './libs/GLTFLoader.js';

// ============================================================================
// MAPA DE MODELOS 3D GLB REAIS COMPILADOS VIA BLENDER 5.2 LTS
// ============================================================================
export const GLTF_ARMORY_MAP = {
  // Armas Icônicas
  DRAGON_BLADE: 'models/armory/dragon_blade.glb',
  ARCHANGEL_SWORD: 'models/armory/archangel_sword.glb',
  CHAOS_DRAGON_AXE: 'models/armory/chaos_dragon_axe.glb',
  SWORD_OF_DESTRUCTION: 'models/armory/sword_of_destruction.glb',
  KUNDUN_STAFF: 'models/armory/kundun_staff.glb',
  CHAOS_LIGHTNING_STAFF: 'models/armory/chaos_lightning_staff.glb',
  CELESTIAL_BOW: 'models/armory/celestial_bow.glb',
  GREAT_REIGN_CROSSBOW: 'models/armory/great_reign_crossbow.glb',
  RUNE_BLADE: 'models/armory/rune_blade.glb',
  LORD_SCEPTER: 'models/armory/lord_scepter.glb',

  // Escudos Clássicos
  DRAGON_SHIELD: 'models/armory/dragon_shield.glb',
  TOWER_SHIELD: 'models/armory/tower_shield.glb',
  SKULL_SHIELD: 'models/armory/skull_shield.glb',

  // Conjuntos de Armaduras (em Manequim de Museu)
  SET_DRAGON: 'models/armory/armor_set_dragon.glb',
  SET_DARK_PHOENIX: 'models/armory/armor_set_dark_phoenix.glb',
  SET_LEGENDARY: 'models/armory/armor_set_legendary.glb',
  SET_GRAND_SOUL: 'models/armory/armor_set_grand_soul.glb',
  SET_SPIRIT: 'models/armory/armor_set_spirit.glb',
  SET_DIVINE: 'models/armory/armor_set_divine.glb',
};

// ============================================================================
// CATÁLOGO DE LORE & METADADOS DA ARMARIA
// ============================================================================
export const ARMORY_METADATA = {
  // --- ARMAS ---
  DRAGON_BLADE: {
    name: 'Dragon Blade',
    type: 'WEAPON',
    classReq: 'Cavaleiro do Sangue / Gladiador (DK/MG)',
    desc: 'Lâmina colossal forjada no sangue de dragões vermelhos. Espinha dorsal serrilhada com gema escarlate incandescente e guarda esculpida em chifres.',
    palette: 0xef4444,
  },
  ARCHANGEL_SWORD: {
    name: 'Sword of Archangel',
    type: 'WEAPON',
    classReq: 'Cavaleiro da Lâmina / Mestre (DK/MG)',
    desc: 'A espada sagrada do Arcanjo de Lorencia. Guarda esculpida em asas de querubim douradas com lâmina perolada e runas de luz pura.',
    palette: 0x38bdf8,
  },
  CHAOS_DRAGON_AXE: {
    name: 'Chaos Dragon Axe',
    type: 'WEAPON',
    classReq: 'Cavaleiro do Sangue (DK)',
    desc: 'Machado colossal forjado na lendária Máquina do Caos de Noria. Lâminas duplas em crescente com pontas pontiagudas e núcleo de plasma carmesim.',
    palette: 0xf59e0b,
  },
  SWORD_OF_DESTRUCTION: {
    name: 'Sword of Destruction',
    type: 'WEAPON',
    classReq: 'Cavaleiro do Sangue / Gladiador (DK/MG)',
    desc: 'Espada demoníaca das profundezas de Lost Tower. Fenda central de magma crepitante com dentes serrilhados que rasgam armaduras pesadas.',
    palette: 0xdc2626,
  },
  KUNDUN_STAFF: {
    name: 'Staff of Kundun',
    type: 'WEAPON',
    classReq: 'Mago Arcano / Grão-Mago (DW)',
    desc: 'O cajado supremo de Lord Kundun. Serpentes de ouro entrelaçadas segurando um orbe de mana estelar flutuante com anéis celestiais giratórios.',
    palette: 0x60a5fa,
  },
  CHAOS_LIGHTNING_STAFF: {
    name: 'Chaos Lightning Staff',
    type: 'WEAPON',
    classReq: 'Mago Arcano (DW)',
    desc: 'Cajado de eletricidade estática pura. Pontas em tridente de ferro negro que geram arcos voltaicos contínuos e potencializam tempestades arcanas.',
    palette: 0xa855f7,
  },
  CELESTIAL_BOW: {
    name: 'Celestial Bow',
    type: 'WEAPON',
    classReq: 'Vigia da Floresta / Elfa Musa (ELF)',
    desc: 'Arco divino forjado a partir de plumas de Fênix e madeira viva ancestral. Dispara flechas de fótons e emite aura verde esmeralda luminosa.',
    palette: 0x10b981,
  },
  GREAT_REIGN_CROSSBOW: {
    name: 'Great Reign Crossbow',
    type: 'WEAPON',
    classReq: 'Vigia da Floresta (ELF)',
    desc: 'Besta pesada de repetição com tambor giratório de aço e latão. Combina a engenharia gnômica de Noria com a balística élfica de alta precisão.',
    palette: 0x34d399,
  },
  RUNE_BLADE: {
    name: 'Rune Blade of Aether',
    type: 'WEAPON',
    classReq: 'Gladiador Rúnico (MG)',
    desc: 'Espada bifurcada forjada especificamente para canalização simultânea de feitiços de fogo/raio e golpes físicos cortantes.',
    palette: 0x06b6d4,
  },
  LORD_SCEPTER: {
    name: 'Imperial Lord Scepter',
    type: 'WEAPON',
    classReq: 'Soberano Imperial (DL)',
    desc: 'Cetro de comando régio com coroa imperial dourada e selo de rubi. Concede autoridade militar sobre o Dark Raven e o corcel Dark Horse.',
    palette: 0xeab308,
  },

  // --- ESCUDOS ---
  DRAGON_SHIELD: {
    name: 'Dragon Shield',
    type: 'SHIELD',
    classReq: 'Cavaleiro do Sangue / Gladiador (DK/MG)',
    desc: 'Escudo pesado em cabeça de dragão com moldura de ouro forjado e olhos rubis incandescentes.',
    palette: 0xb91c1c,
  },
  TOWER_SHIELD: {
    name: 'Tower Shield',
    type: 'SHIELD',
    classReq: 'Cavaleiro do Sangue / Lorde Imperial (DK/DL)',
    desc: 'Escudo pavês retangular maciço de aço gótico negro reforçado com cruz dourada.',
    palette: 0x475569,
  },
  SKULL_SHIELD: {
    name: 'Skull Shield',
    type: 'SHIELD',
    classReq: 'Cavaleiro / Mago / Gladiador (DK/DW/MG)',
    desc: 'Broquel necromântico adornado com o crânio de um titã abissal de Dungeon e chifres frontais curvos.',
    palette: 0x10b981,
  },

  // --- SETS DE ARMADURA ---
  SET_DRAGON: {
    name: 'Dragon Armor Set',
    type: 'ARMOR_SET',
    classReq: 'Cavaleiro do Sangue (DK)',
    desc: 'A armadura mais lendária de Lorencia. Placas de aço carmesim polido com ombreiras espinhosas, elmo de dragão fechado e detalhes em ouro puro.',
    palette: 0x991b1b,
  },
  SET_DARK_PHOENIX: {
    name: 'Dark Phoenix Set',
    type: 'ARMOR_SET',
    classReq: 'Cavaleiro da Lâmina / Mestre (DK)',
    desc: 'Armadura forjada nas cinzas da Fênix de Icarus. Placas de obsidiana negra polida com frisos incandescentes de magma dourado.',
    palette: 0x18181b,
  },
  SET_LEGENDARY: {
    name: 'Legendary Armor Set',
    type: 'ARMOR_SET',
    classReq: 'Mago Arcano / Mestre das Almas (DW)',
    desc: 'Manto azul safira real adornado com símbolos astrológicos em ouro, gola alta mística e ombreiras pontiagudas.',
    palette: 0x1d4ed8,
  },
  SET_GRAND_SOUL: {
    name: 'Grand Soul Set',
    type: 'ARMOR_SET',
    classReq: 'Grão-Mago do Caos (DW)',
    desc: 'Vestimenta cerimonial cósmica tecida com poeira estelar violeta e safira translúcida, potencializando o Mana Shield.',
    palette: 0x6b21a8,
  },
  SET_SPIRIT: {
    name: 'Spirit Armor Set',
    type: 'ARMOR_SET',
    classReq: 'Vigia da Floresta / Elfa Musa (ELF)',
    desc: 'Armadura viva das árvores sagradas de Feywood. Placas em formato de folhas esmeralda translúcidas com filigranas de ouro e tiara de cristal.',
    palette: 0x059669,
  },
  SET_DIVINE: {
    name: 'Divine Armor Set',
    type: 'ARMOR_SET',
    classReq: 'Senhora dos Elementos (ELF)',
    desc: 'Armadura celestial perolada consagrada pela Rainha Lúthien. Reflete luz estelar e concede agilidade e graça inigualáveis.',
    palette: 0xf8fafc,
  },
};

// ============================================================================
// CONSTRUÇÃO PROCEDURAL DE ARMAS 3D (WEBGL THREE.JS)
// ============================================================================

export function createProceduralWeapon(weaponId, THREE) {
  const group = new THREE.Group();
  const glowMaterials = [];

  const matGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.90, roughness: 0.20 });
  const matSteel = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.12 });
  const matDarkSteel = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.88, roughness: 0.25 });
  const matLeather = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.75 });
  const matRuby = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.2, roughness: 0.1 });
  const matCyan = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.5, roughness: 0.08 });
  const matEmerald = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 2.0, roughness: 0.1 });

  glowMaterials.push(matSteel, matGold, matRuby, matCyan, matEmerald);

  if (weaponId === 'DRAGON_BLADE') {
    // Cabo & Pomo
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.50, 16), matLeather);
    handle.position.y = 0.25;
    group.add(handle);

    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), matGold);
    pommel.position.y = 0.02;
    group.add(pommel);

    // Guarda de Dragão
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.10), matGold);
    guard.position.y = 0.52;
    group.add(guard);

    // Gema Ruby Central
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), matRuby);
    gem.position.set(0, 0.52, 0.06);
    group.add(gem);

    // Chifres na Guarda
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.32, 6), matGold);
      horn.position.set(side * 0.24, 0.60, 0);
      horn.rotation.z = side * -0.6;
      group.add(horn);
    }

    // Lâmina Colossal Biselada
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.20, 1.65, 0.04), matSteel);
    blade.position.y = 1.35;
    group.add(blade);

    // Ponta Triangular
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.40, 4), matSteel);
    tip.position.y = 2.35;
    tip.rotation.y = Math.PI / 4;
    group.add(tip);

    // Espinha Dorsal Carmesim
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.45, 0.055), matRuby);
    spine.position.y = 1.30;
    group.add(spine);

  } else if (weaponId === 'ARCHANGEL_SWORD') {
    // Cabo de Ouro
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 16), matGold);
    handle.position.y = 0.22;
    group.add(handle);

    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), matCyan);
    pommel.position.y = 0.02;
    group.add(pommel);

    // Guarda em Asas Angélicas
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.04), matGold);
      wing.position.set(side * 0.16, 0.48, 0);
      wing.rotation.z = side * 0.4;
      group.add(wing);
    }

    // Lâmina Celestial Longa
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.70, 0.035), matSteel);
    blade.position.y = 1.35;
    group.add(blade);

    // Sulco Rúnico de Luz
    const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.40, 0.045), matCyan);
    fuller.position.y = 1.32;
    group.add(fuller);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.35, 4), matSteel);
    tip.position.y = 2.35;
    tip.rotation.y = Math.PI / 4;
    group.add(tip);

  } else if (weaponId === 'CHAOS_DRAGON_AXE') {
    // Cabo Longo
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.75, 16), matDarkSteel);
    shaft.position.y = 0.90;
    group.add(shaft);

    // Lâminas Duplas em Crescente
    for (const side of [-1, 1]) {
      const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.40, 0.04, 16), matSteel);
      blade.position.set(side * 0.35, 1.45, 0);
      blade.rotation.x = Math.PI / 2;
      blade.scale.set(1.0, 0.8, 1.0);
      group.add(blade);

      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 6), matGold);
      spike.position.set(side * 0.65, 1.55, 0);
      spike.rotation.z = side * -Math.PI / 3;
      group.add(spike);
    }

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), matRuby);
    core.position.set(0, 1.45, 0);
    group.add(core);

  } else if (weaponId === 'KUNDUN_STAFF') {
    // Haste de Ouro Real
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.05, 16), matGold);
    shaft.position.y = 1.05;
    group.add(shaft);

    // Orbe de Mana Cósmico
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), matCyan);
    orb.position.y = 2.15;
    group.add(orb);

    // Anel de Kundun Flutuante
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 8, 24), matGold);
    ring.position.y = 2.15;
    group.add(ring);

  } else if (weaponId === 'CELESTIAL_BOW') {
    // Membros Curvos
    const limbs = new THREE.Mesh(new THREE.TorusGeometry(0.80, 0.04, 8, 24, Math.PI * 0.95), matGold);
    limbs.rotation.z = Math.PI * 0.52;
    limbs.position.y = 1.10;
    group.add(limbs);

    // Gema Central
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), matEmerald);
    gem.position.set(0, 1.10, 0.05);
    group.add(gem);

    // Corda Holográfica
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.55), matCyan);
    string.position.set(0.38, 1.10, 0);
    group.add(string);

  } else {
    // Fallback genérico de espada rúnica
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.80, 16), matSteel);
    shaft.position.y = 0.90;
    group.add(shaft);
  }

  return { mesh: group, glowMaterials };
}

// ============================================================================
// CONSTRUÇÃO PROCEDURAL DE ESCUDOS 3D
// ============================================================================

export function createProceduralShield(shieldId, THREE) {
  const group = new THREE.Group();
  const glowMaterials = [];

  const matGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.90, roughness: 0.20 });
  const matSteel = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
  const matCrimson = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.88, roughness: 0.20 });
  const matRuby = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.2 });

  glowMaterials.push(matGold, matCrimson, matRuby);

  if (shieldId === 'DRAGON_SHIELD') {
    // Corpo em Cabeça de Dragão
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.07, 24), matCrimson);
    body.rotation.x = Math.PI / 2;
    body.scale.set(0.85, 1.35, 1.0);
    body.position.y = 0.90;
    group.add(body);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.50, 0.04, 8, 24), matGold);
    rim.rotation.x = Math.PI / 2;
    rim.scale.set(0.85, 1.35, 1.0);
    rim.position.set(0, 0.90, 0.04);
    group.add(rim);

    // Olhos Rubis
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), matRuby);
      eye.position.set(side * 0.16, 1.05, 0.08);
      group.add(eye);
    }
  } else if (shieldId === 'TOWER_SHIELD') {
    // Escudo Pavês Retangular
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.65, 0.06), matSteel);
    plate.position.y = 0.95;
    group.add(plate);

    // Cruz Gótica Reforçada
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.55, 0.04), matGold);
    crossV.position.set(0, 0.95, 0.04);
    group.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.14, 0.04), matGold);
    crossH.position.set(0, 1.15, 0.04);
    group.add(crossH);
  } else {
    // Skull Shield
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 20), matSteel);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.90;
    group.add(body);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), matGold);
    skull.position.set(0, 0.90, 0.08);
    group.add(skull);
  }

  return { mesh: group, glowMaterials };
}

// ============================================================================
// CONSTRUÇÃO PROCEDURAL DE CONJUNTO DE ARMADURA (MANEQUIM DE EXPOSIÇÃO)
// ============================================================================

export function createProceduralArmorStand(setId, THREE) {
  const root = new THREE.Group();
  const glowMaterials = [];

  // Configuração de Cores por Tier
  let primaryColor = 0x991b1b; // Dragon
  let trimColor = 0xf59e0b;
  let metalness = 0.88;
  let roughness = 0.22;

  if (setId === 'SET_DARK_PHOENIX') {
    primaryColor = 0x18181b;
    trimColor = 0xf59e0b;
    metalness = 0.92;
    roughness = 0.15;
  } else if (setId === 'SET_LEGENDARY') {
    primaryColor = 0x1d4ed8;
    trimColor = 0xf59e0b;
    metalness = 0.50;
    roughness = 0.35;
  } else if (setId === 'SET_GRAND_SOUL') {
    primaryColor = 0x6b21a8;
    trimColor = 0x38bdf8;
    metalness = 0.60;
    roughness = 0.30;
  } else if (setId === 'SET_SPIRIT') {
    primaryColor = 0x059669;
    trimColor = 0xf59e0b;
    metalness = 0.65;
    roughness = 0.25;
  } else if (setId === 'SET_DIVINE') {
    primaryColor = 0xf8fafc;
    trimColor = 0xf59e0b;
    metalness = 0.80;
    roughness = 0.15;
  }

  const matArmor = new THREE.MeshStandardMaterial({ color: primaryColor, metalness, roughness });
  const matTrim = new THREE.MeshStandardMaterial({ color: trimColor, metalness: 0.90, roughness: 0.20 });
  const matVisor = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xff0000, emissiveIntensity: 2.0 });

  glowMaterials.push(matArmor, matTrim, matVisor);

  // Manequim: Botas
  for (const side of [-1, 1]) {
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.28), matArmor);
    boot.position.set(side * 0.20, 0.14, 0);
    root.add(boot);
  }

  // Manequim: Calças / Grevas
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.09, 0.60, 12), matArmor);
    leg.position.set(side * 0.20, 0.55, 0);
    root.add(leg);
  }

  // Manequim: Peitoral / Torso
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.55, 0.34), matArmor);
  chest.position.set(0, 1.15, 0);
  root.add(chest);

  // Ombreiras
  for (const side of [-1, 1]) {
    const pauldron = new THREE.Mesh(new THREE.ConeGeometry(0.20, 0.38, 4), matTrim);
    pauldron.position.set(side * 0.40, 1.40, 0);
    pauldron.rotation.z = side * -0.6;
    root.add(pauldron);
  }

  // Elmo Completo
  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.36), matArmor);
  helm.position.set(0, 1.65, 0);
  root.add(helm);

  // Visor Rúnico
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), matVisor);
  visor.position.set(0, 1.65, 0.17);
  root.add(visor);

  return { mesh: root, glowMaterials };
}

// ============================================================================
// CONSTRUÇÃO DO CENÁRIO DO MUSEU / PEDESTAL DE EXPOSIÇÃO 3D
// ============================================================================

export function buildArmoryShowcase(entityId, category, THREE, options = {}) {
  const rootGroup = new THREE.Group();
  const parts = {};
  const glowMaterials = [];

  // 1. Pedestal de Mármore Obsidiano Gótico
  const pedestalGroup = new THREE.Group();
  const baseGeom = new THREE.CylinderGeometry(1.5, 1.8, 0.25, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x0a0c10,
    roughness: 0.22,
    metalness: 0.70,
  });
  const pedestalMesh = new THREE.Mesh(baseGeom, baseMat);
  pedestalMesh.position.y = 0.125;
  pedestalMesh.receiveShadow = true;
  pedestalGroup.add(pedestalMesh);

  // Anel de Runas Fluorescentes
  const ringGeom = new THREE.RingGeometry(1.25, 1.45, 48);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 1.2,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const ringMesh = new THREE.Mesh(ringGeom, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.255;
  pedestalGroup.add(ringMesh);
  parts.runicRing = ringMesh;
  glowMaterials.push(ringMat);

  rootGroup.add(pedestalGroup);

  // 2. Feixe Volumétrico de Luz Celestial Descendente
  const beamGeom = new THREE.CylinderGeometry(0.40, 1.20, 4.5, 24, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const beamMesh = new THREE.Mesh(beamGeom, beamMat);
  beamMesh.position.y = 2.4;
  parts.lightBeam = beamMesh;
  rootGroup.add(beamMesh);

  // 3. Sistema de Poeira Luminosa Flutuante (Partículas Aditivas)
  const pCount = 60;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3 + 0] = (Math.random() - 0.5) * 1.8;
    pPos[i * 3 + 1] = 0.4 + Math.random() * 2.2;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xfde047,
    size: 0.045,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
  });
  const sparkleSystem = new THREE.Points(pGeo, pMat);
  rootGroup.add(sparkleSystem);
  parts.sparkles = sparkleSystem;

  // 4. Item Central Flutuante & Rotativo
  const itemAnchor = new THREE.Group();
  itemAnchor.position.y = category === 'ARMOR_SET' ? 0.25 : 0.65;
  parts.anchor = itemAnchor;
  rootGroup.add(itemAnchor);

  // Fallback Procedural Imediato
  let proceduralItem = null;
  if (category === 'WEAPON') {
    proceduralItem = createProceduralWeapon(entityId, THREE);
  } else if (category === 'SHIELD') {
    proceduralItem = createProceduralShield(entityId, THREE);
  } else if (category === 'ARMOR_SET') {
    proceduralItem = createProceduralArmorStand(entityId, THREE);
  }

  if (proceduralItem) {
    itemAnchor.add(proceduralItem.mesh);
    glowMaterials.push(...proceduralItem.glowMaterials);
    parts.proceduralMesh = proceduralItem.mesh;
  }

  // Carregamento Assíncrono do Modelo Real Blender 5.2 GLB
  const glbPath = GLTF_ARMORY_MAP[entityId];
  if (glbPath) {
    try {
      const loader = new GLTFLoader();
      loader.load(
        glbPath,
        (gltf) => {
          const realModel = gltf.scene;
          realModel.name = `REAL_GLB_${entityId}`;

          // Escala e centralização precisa
          if (category === 'WEAPON') {
            realModel.scale.set(1.1, 1.1, 1.1);
            realModel.position.set(0, 0.1, 0);
          } else if (category === 'SHIELD') {
            realModel.scale.set(1.15, 1.15, 1.15);
            realModel.position.set(0, 0.2, 0);
          } else if (category === 'ARMOR_SET') {
            realModel.scale.set(1.0, 1.0, 1.0);
            realModel.position.set(0, 0, 0);
          }

          realModel.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                glowMaterials.push(child.material);
              }
            }
          });

          // Substitui o modelo procedural com transição suave
          if (parts.proceduralMesh) {
            itemAnchor.remove(parts.proceduralMesh);
          }
          itemAnchor.add(realModel);
          parts.realModel = realModel;
          console.log(`[Armory3D] Modelo Real GLB carregado com sucesso: ${entityId} (${glbPath})`);
        },
        undefined,
        (err) => {
          console.warn(`[Armory3D] Mantendo fallback procedural para ${entityId}:`, err);
        }
      );
    } catch (e) {
      console.warn(`[Armory3D] Erro ao instanciar GLTFLoader:`, e);
    }
  }

  // 5. Controlador de Refinamento (+0 a +15)
  function updateRefinementGlow(level) {
    const lvl = Math.max(0, Math.min(15, level || 0));

    glowMaterials.forEach((mat) => {
      if (!mat) return;

      if (lvl <= 6) {
        // +0 a +6: Sem aura mágica
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0.0;
        mat.roughness = 0.22 - lvl * 0.015;
      } else if (lvl <= 8) {
        // +7 e +8: Pulso rúnico ciano suave
        mat.emissive = new THREE.Color(0x38bdf8);
        mat.emissiveIntensity = 0.6 + (lvl - 7) * 0.4;
      } else if (lvl <= 10) {
        // +9 e +10: Aura solar dourada com centelhas
        mat.emissive = new THREE.Color(0xf59e0b);
        mat.emissiveIntensity = 1.2 + (lvl - 9) * 0.5;
      } else if (lvl <= 12) {
        // +11 e +12: Arcos elétricos de relâmpago de plasma
        mat.emissive = new THREE.Color(0xec4899);
        mat.emissiveIntensity = 1.8 + (lvl - 11) * 0.5;
      } else {
        // +13 a +15: Corona celestial máxima com ressonância cósmica
        mat.emissive = new THREE.Color(0x818cf8);
        mat.emissiveIntensity = 2.4 + (lvl - 13) * 0.6;
      }
    });

    if (parts.lightBeam && parts.lightBeam.material) {
      parts.lightBeam.material.opacity = 0.08 + (lvl / 15) * 0.18;
    }
  }

  // 6. Atualizador de Animações Contínuas
  function update(delta = 0.016) {
    // Rotação suave do item
    if (parts.anchor) {
      parts.anchor.rotation.y += delta * 0.75;
    }

    // Rotação do anel rúnico no chão
    if (parts.runicRing) {
      parts.runicRing.rotation.z -= delta * 0.35;
    }

    // Partículas flutuantes ascendentes
    if (parts.sparkles && parts.sparkles.geometry) {
      const positions = parts.sparkles.geometry.attributes.position.array;
      for (let i = 0; i < pCount; i++) {
        positions[i * 3 + 1] += delta * 0.35;
        if (positions[i * 3 + 1] > 2.8) {
          positions[i * 3 + 1] = 0.4;
        }
      }
      parts.sparkles.geometry.attributes.position.needsUpdate = true;
    }
  }

  return {
    group: rootGroup,
    parts,
    glowMaterials,
    updateRefinementGlow,
    update,
  };
}
