/**
 * DASI MMORPG - CATÁLOGO DE CONTEÚDO PROCEDURAL 3D
 * Modelos 3D Nativos em Tempo Real para Heróis, Monstros e Cenários.
 * Inspirado no Continent of Legend (MU Online) com fidelidade PBR moderna.
 *
 * Módulos Exportados:
 * - createHero(heroClass, setTier, weaponType, THREE)
 * - createMonster(monsterType, THREE)
 * - createEnvironment(envType, THREE)
 */

// ============================================================================
// PALETAS DE MATERIAIS & CORES GÓTICAS PBR
// ============================================================================
import { buildScenario3D } from './dasi3dScenarios.js';
import { GLTFLoader } from './libs/GLTFLoader.js';

// ============================================================================
// MAPA DE MODELOS 3D GLB REAIS COMPILADOS VIA BLENDER 5.2 LTS
// ============================================================================
export const GLTF_BIOME_MAP = {
  LORENCIA: 'models/lorencia_citadel.glb',
  NORIA: 'models/noria_feywood.glb',
  DEVIAS: 'models/devias_boreal.glb',
  ATLANS: 'models/atlans_thalassa.glb',
  ICARUS: 'models/icarus_aethel.glb',
  DUNGEON: 'models/dungeon_catacombs.glb',
  LOST_TOWER: 'models/lost_tower_abyss.glb',
  TARKAN: 'models/tarkan_desert.glb',
  VALLEY_OF_LOREN: 'models/valley_of_loren_citadel.glb',
  BLOOD_CASTLE: 'models/blood_castle_bridge.glb',
  // Arenas de evento sem GLB dedicado reutilizam a arte 3D canônica do bioma
  // temático mais próximo (a geometria procedural de dasi3dScenarios.js cobre o resto).
  EVT_02: 'models/dungeon_catacombs.glb',
  EVT_03: 'models/lost_tower_abyss.glb',
  EVT_04: 'models/lorencia_citadel.glb',
  DEVIL_SQUARE: 'models/dungeon_catacombs.glb',
  CHAOS_CASTLE: 'models/lost_tower_abyss.glb',
  DUEL_COLISEUM: 'models/lorencia_citadel.glb',
};

// ============================================================================
// MAPA DE MODELOS 3D GLB DAS 5 CLASSES HEROICAS COMPILADAS VIA BLENDER 5.2 LTS
// ============================================================================
export const GLTF_HERO_MAP = {
  DK: 'models/hero_dark_knight.glb',
  DW: 'models/hero_dark_wizard.glb',
  ELF: 'models/hero_fairy_elf.glb',
  MG: 'models/hero_magic_gladiator.glb',
  DL: 'models/hero_dark_lord.glb',
};

export function loadRealHeroGLTF(heroClass, targetGroup, THREE, onComplete) {
  const glbPath = GLTF_HERO_MAP[heroClass];
  if (!glbPath) return;

  try {
    const loader = new GLTFLoader();
    loader.load(
      glbPath,
      (gltf) => {
        const model = gltf.scene;
        model.name = `REAL_HERO_${heroClass}`;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        targetGroup.add(model);
        console.log(`[Dasi3D] Herói Real GLB carregado: ${heroClass} (${glbPath})`);
        if (onComplete) onComplete(model);
      },
      undefined,
      (err) => {
        console.warn(`[Dasi3D] Fallback procedural mantido para ${heroClass}:`, err);
      }
    );
  } catch (err) {
    console.warn(`[Dasi3D] Erro ao carregar GLTF do Herói:`, err);
  }
}

/**
 * Gerador de Texturas Procedurais PBR em Tempo Real (Canvas 2D -> WebGL Texture)
 * Garante rugosidade, veios e relevos fiéis ao Concept Art sem depender de downloads externos.
 */
export function createProceduralCanvasTexture(type, THREE, repeatX = 6, repeatY = 6) {
  if (typeof document === 'undefined') return null; // Compatibilidade com Node.js / Headless
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (type === 'COBBLESTONE') {
    // Calçamento de pedra gótica com juntas de argamassa e relevo
    ctx.fillStyle = '#1c1f26';
    ctx.fillRect(0, 0, 256, 256);
    const tileW = 32, tileH = 16;
    for (let y = 0; y < 256; y += tileH) {
      const row = Math.floor(y / tileH);
      const offsetX = (row % 2) * (tileW / 2);
      for (let x = -tileW; x < 256 + tileW; x += tileW) {
        const px = x + offsetX;
        const shade = Math.floor(65 + Math.random() * 35);
        ctx.fillStyle = `rgb(${shade - 10}, ${shade}, ${shade + 12})`;
        ctx.fillRect(px + 1, y + 1, tileW - 2, tileH - 2);
        // Frisos de desgaste e quebra na pedra
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(px + 2, y + 2, tileW - 4, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(px + 2, y + tileH - 3, tileW - 4, 2);
      }
    }
  } else if (type === 'MOSSY_WOOD') {
    // Casca de sequoia antiga com musgo bioluminescente
    ctx.fillStyle = '#1e140a';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 256;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(16, 185, 129, 0.45)' : 'rgba(39, 26, 12, 0.6)';
      ctx.fillRect(x, 0, Math.random() * 4 + 1, 256);
    }
    for (let m = 0; m < 30; m++) {
      const mx = Math.random() * 256, my = Math.random() * 256, rad = Math.random() * 12 + 4;
      const grad = ctx.createRadialGradient(mx, my, 1, mx, my, rad);
      grad.addColorStop(0, 'rgba(52, 211, 153, 0.55)');
      grad.addColorStop(1, 'rgba(5, 150, 105, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(mx, my, rad, 0, Math.PI * 2); ctx.fill();
    }
  } else if (type === 'GLACIAL_ICE') {
    // Gelo de pergelissolo translúcido com rachaduras e cristais
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(0.5, '#0284c7');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;
    for (let c = 0; c < 12; c++) {
      ctx.beginPath();
      let sx = Math.random() * 256, sy = Math.random() * 256;
      ctx.moveTo(sx, sy);
      for (let s = 0; s < 4; s++) {
        sx += (Math.random() - 0.5) * 40;
        sy += (Math.random() - 0.5) * 40;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
  } else if (type === 'OCEAN_CAUSTICS') {
    // Padrão de reflexão solar cáustica submersa sobre areia perolada
    ctx.fillStyle = '#022c43';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 3;
    for (let w = 0; w < 16; w++) {
      ctx.beginPath();
      for (let x = 0; x < 256; x += 10) {
        const y = w * 16 + Math.sin(x * 0.05 + w) * 8;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (type === 'AETHER_MARBLE') {
    // Mármore celestial com veios de cristal Aetherita ciano
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
    ctx.lineWidth = 2;
    for (let v = 0; v < 8; v++) {
      ctx.beginPath();
      let vx = Math.random() * 256, vy = 0;
      ctx.moveTo(vx, vy);
      while (vy < 256) {
        vx += (Math.random() - 0.5) * 20;
        vy += Math.random() * 30 + 10;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

/**
 * Mapa de resolução de ID de cenário (ou código de bioma) para o bioma/zona
 * canônico usado nos modelos GLB. As 4 arenas de evento usam a arte da zona
 * temática (BLOOD_CASTLE, DEVIL_SQUARE, CHAOS_CASTLE, DUEL_COLISEUM).
 */
export function resolveScenarioBiome(scenarioId) {
  const id = String(scenarioId || '').toUpperCase();
  if (GLTF_BIOME_MAP[id]) return id;
  const prefix = id.split('_')[0];
  const prefixMap = {
    LOR: 'LORENCIA', NOR: 'NORIA', DEV: 'DEVIAS', DNG: 'DUNGEON',
    LT: 'LOST_TOWER', ATL: 'ATLANS', TAR: 'TARKAN', ICA: 'ICARUS',
    VOL: 'VALLEY_OF_LOREN', EVT: 'BLOOD_CASTLE',
    VALLEY: 'VALLEY_OF_LOREN', EVENT: 'BLOOD_CASTLE', SIEGE: 'VALLEY_OF_LOREN',
  };
  const byPrefix = prefixMap[prefix] || id;
  // Arenas de evento têm arte própria por cenário
  if (prefix === 'EVT' && GLTF_BIOME_MAP[`EVT_${id.split('_')[1]}`]) {
    return `EVT_${id.split('_')[1]}`;
  }
  return byPrefix;
}

/**
 * Carregador Assíncrono do Cenário 3D Real (GLB PBR) compilado pelo Blender 5.2
 */
export function loadBiomeGLB(biomeId, THREE, targetGroup, onComplete) {
  if (typeof window === 'undefined') return; // Safe for Node.js
  const canonicalBiome = resolveScenarioBiome(biomeId);
  const glbPath = GLTF_BIOME_MAP[canonicalBiome];
  if (!glbPath) return;

  try {
    const loader = new GLTFLoader();
    loader.load(
      glbPath,
      (gltf) => {
        const model = gltf.scene;
        model.name = `REAL_SCENERY_${canonicalBiome}`;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Limpa quaisquer meshes primitivas de mock para manter apenas a geometria 3D Real do Blender 5.2
        for (let i = targetGroup.children.length - 1; i >= 0; i--) {
          const child = targetGroup.children[i];
          if (child.isMesh && !child.name.startsWith('REAL_SCENERY_')) {
            targetGroup.remove(child);
          }
        }

        targetGroup.add(model);
        console.log(`[Dasi3D] Cenário Real GLB carregado com sucesso: ${canonicalBiome} (${glbPath})`);
        if (onComplete) onComplete(model);
      },
      undefined,
      (err) => {
        console.warn(`[Dasi3D] Falha ao carregar GLB de ${canonicalBiome}, mantendo geometria procedural:`, err);
      }
    );
  } catch (err) {
    console.warn(`[Dasi3D] Erro ao instanciar GLTFLoader:`, err);
  }
}

export const PALETTES = {
  skin: 0xd4a373,
  skinPale: 0xf3e9dc,
  clothNavy: 0x1e293b,
  clothCrimson: 0x881337,
  clothEmerald: 0x064e3b,
  clothGold: 0xd97706,
  leatherBrown: 0x451a03,
  leatherDark: 0x1c1917,
  metalDarkIron: 0x27272a,
  metalPlate: 0x52525b,
  metalSilver: 0x94a3b8,
  metalGold: 0xf59e0b,
  dragonCrimson: 0x991b1b,
  dragonSpike: 0x1f2937,
  phoenixDark: 0x18181b,
  phoenixFlame: 0xf97316,
  arcaneSapphire: 0x2563eb,
  arcaneCyan: 0x06b6d4,
  elfEmerald: 0x10b981,
  elfGoldLeaf: 0xfacc15,
  boneIvory: 0xe2e8f0,
  boneDark: 0x71717a,
  spiderChitin: 0x18181b,
  spiderVenom: 0x84cc16,
  dragonScales: 0xb91c1c,
  minotaurFur: 0x292524,
  stoneCobble: 0x334155,
  stoneWall: 0x1e293b,
  woodOak: 0x3f2e21,
  waterLake: 0x0284c7,
  snowWhite: 0xf1f5f9,
  iceGlacial: 0x38bdf8,
  nacarMarble: 0xe2e8f0,
  pearlSand: 0xfef08a,
  coralCyan: 0x06b6d4,
  coralMagenta: 0xf43f5e,
  abyssDeep: 0x0369a1,
  slipstreamBlue: 0x38bdf8,
  hydrothermalBasalt: 0x18181b,
  aetheriteCrystal: 0x38bdf8,
  aethelGrass: 0x94a3b8,
  lightBridgePrism: 0xe0f2fe,
  thermalUpliftGold: 0xfbbf24,
  phoenixObsidian: 0x09090b,
};

// ============================================================================
// 1. GERADOR DE HERÓIS 3D (DARK KNIGHT, DARK WIZARD, FAIRY ELF)
// ============================================================================
export function createHero(heroClass, options = {}, THREE) {
  const rootGroup = new THREE.Group();
  const parts = {};
  const glowMaterials = [];

  const setTier = options.setTier || 'DRAGON'; // 'DRAGON' | 'PHOENIX' | 'GRAND_SOUL' | 'SPIRIT' | 'HURRICANE' | 'DARK_STEEL'
  const weaponType = options.weaponType || 'DEFAULT';

  // --------------------------------------------------------------------------
  // MATERIAIS BASE COMPARTILHADOS & PALETAS CANÔNICAS
  // --------------------------------------------------------------------------
  let heroSkinColor = PALETTES.skin;
  if (heroClass === 'ELF') heroSkinColor = PALETTES.skinPale;
  else if (heroClass === 'MG' || heroClass === 'DL') heroSkinColor = 0xd49b6a;

  const skinMat = new THREE.MeshStandardMaterial({
    color: heroSkinColor,
    roughness: 0.60,
    metalness: 0.05,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: PALETTES.metalGold,
    metalness: 0.90,
    roughness: 0.22,
  });
  glowMaterials.push(goldTrimMat);

  // Armadura Principal (reativa ao slider de refinamento e tier do set)
  let mainArmorColor = PALETTES.dragonCrimson;
  let metalnessVal = 0.88;
  let roughnessVal = 0.22;

  const st = String(setTier).toUpperCase();
  if (st === 'LEATHER') {
    mainArmorColor = 0x543310;
    metalnessVal = 0.10;
    roughnessVal = 0.80;
  } else if (st === 'SCALE') {
    mainArmorColor = 0x334155;
    metalnessVal = 0.82;
    roughnessVal = 0.30;
  } else if (st === 'PLATE') {
    mainArmorColor = 0x64748b;
    metalnessVal = 0.90;
    roughnessVal = 0.20;
  } else if (st === 'DRAGON') {
    mainArmorColor = PALETTES.dragonCrimson;
    metalnessVal = 0.88;
    roughnessVal = 0.22;
  } else if (st === 'PHOENIX' || st === 'DARK_PHOENIX') {
    mainArmorColor = PALETTES.phoenixDark;
    metalnessVal = 0.92;
    roughnessVal = 0.15;
  } else if (st === 'PAD') {
    mainArmorColor = 0x475569;
    metalnessVal = 0.10;
    roughnessVal = 0.85;
  } else if (st === 'BONE') {
    mainArmorColor = 0xe2e8f0;
    metalnessVal = 0.25;
    roughnessVal = 0.45;
  } else if (st === 'SPHINX') {
    mainArmorColor = 0x1e3a8a;
    metalnessVal = 0.45;
    roughnessVal = 0.35;
  } else if (st === 'LEGENDARY') {
    mainArmorColor = 0x1d4ed8;
    metalnessVal = 0.55;
    roughnessVal = 0.30;
  } else if (st === 'GRAND_SOUL') {
    mainArmorColor = 0x6b21a8;
    metalnessVal = 0.65;
    roughnessVal = 0.25;
  } else if (st === 'VINE') {
    mainArmorColor = 0x166534;
    metalnessVal = 0.10;
    roughnessVal = 0.80;
  } else if (st === 'SILK') {
    mainArmorColor = 0xf1f5f9;
    metalnessVal = 0.20;
    roughnessVal = 0.40;
  } else if (st === 'WIND') {
    mainArmorColor = 0x047857;
    metalnessVal = 0.45;
    roughnessVal = 0.35;
  } else if (st === 'SPIRIT') {
    mainArmorColor = PALETTES.elfEmerald;
    metalnessVal = 0.65;
    roughnessVal = 0.25;
  } else if (st === 'DIVINE') {
    mainArmorColor = 0xf8fafc;
    metalnessVal = 0.82;
    roughnessVal = 0.15;
  } else if (st === 'STORM_CROW') {
    mainArmorColor = 0x1f2937;
    metalnessVal = 0.80;
    roughnessVal = 0.30;
  } else if (st === 'HURRICANE' || heroClass === 'MG') {
    mainArmorColor = 0x7f1d1d;
    metalnessVal = 0.90;
    roughnessVal = 0.18;
  } else if (st === 'DARK_MASTER' || heroClass === 'DL') {
    mainArmorColor = 0x0f172a;
    metalnessVal = 0.95;
    roughnessVal = 0.16;
  } else if (heroClass === 'DW') {
    mainArmorColor = PALETTES.arcaneSapphire;
    metalnessVal = 0.50;
    roughnessVal = 0.35;
  } else if (heroClass === 'ELF') {
    mainArmorColor = PALETTES.elfEmerald;
    metalnessVal = 0.65;
    roughnessVal = 0.28;
  }

  const armorMat = new THREE.MeshStandardMaterial({
    color: mainArmorColor,
    metalness: metalnessVal,
    roughness: roughnessVal,
  });
  glowMaterials.push(armorMat);

  // Material de Lâminas e Armas (alta refletividade e emissão ao aprimorar)
  const weaponMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.94,
    roughness: 0.12,
  });
  glowMaterials.push(weaponMat);

  // --------------------------------------------------------------------------
  // PEDESTAL DE MÁRMORE OBSIDIANO COM ANEL RÚNICO
  // --------------------------------------------------------------------------
  const pedestalGroup = new THREE.Group();
  const baseGeom = new THREE.CylinderGeometry(1.6, 1.8, 0.22, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x0a0c10,
    roughness: 0.25,
    metalness: 0.65,
  });
  const pedestalMesh = new THREE.Mesh(baseGeom, baseMat);
  pedestalMesh.position.y = 0.11;
  pedestalMesh.receiveShadow = true;
  pedestalGroup.add(pedestalMesh);

  // Anel Rúnico Fluorescente Temático
  const ringColor = heroClass === 'ELF' ? 0x10b981 : heroClass === 'DW' ? 0x38bdf8 : heroClass === 'MG' ? 0xa855f7 : heroClass === 'DL' ? 0xf59e0b : 0xef4444;
  const ringEmissive = heroClass === 'ELF' ? 0x059669 : heroClass === 'DW' ? 0x0284c7 : heroClass === 'MG' ? 0x7e22ce : heroClass === 'DL' ? 0xb45309 : 0xdc2626;

  const ringGeom = new THREE.RingGeometry(1.25, 1.48, 48);
  const ringMat = new THREE.MeshStandardMaterial({
    color: ringColor,
    emissive: ringEmissive,
    emissiveIntensity: 0.85,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const ringMesh = new THREE.Mesh(ringGeom, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.225;
  pedestalGroup.add(ringMesh);
  parts.pedestalRing = ringMesh;
  rootGroup.add(pedestalGroup);

  // --------------------------------------------------------------------------
  // ANATOMIA BÁSICA DO HERÓI (ROOT -> TORSO -> HEAD / ARMS / LEGS)
  // --------------------------------------------------------------------------
  const heroRoot = new THREE.Group();
  heroRoot.position.y = 0.22;
  parts.root = heroRoot;
  rootGroup.add(heroRoot);

  // Tronco / Peitoral
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 1.15, 0);
  parts.torso = torsoGroup;
  heroRoot.add(torsoGroup);

  if (heroClass === 'DK') {
    // Peitoral Musculoso com Placas de Aço e Gema Arcana
    const chestGeom = new THREE.BoxGeometry(0.55, 0.52, 0.32);
    const chestMesh = new THREE.Mesh(chestGeom, armorMat);
    chestMesh.castShadow = true;
    torsoGroup.add(chestMesh);

    // Gema Central no Peitoral
    const gemGeom = new THREE.OctahedronGeometry(0.08, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });
    const gemMesh = new THREE.Mesh(gemGeom, gemMat);
    gemMesh.position.set(0, 0.08, 0.17);
    gemMesh.rotation.z = Math.PI / 4;
    torsoGroup.add(gemMesh);

    // Ombreiras Duplas Góticas Spiked Pauldrons
    const pauldronGeom = new THREE.ConeGeometry(0.18, 0.35, 4);
    const pauldronL = new THREE.Mesh(pauldronGeom, armorMat);
    pauldronL.position.set(-0.38, 0.22, 0);
    pauldronL.rotation.z = 0.6;
    torsoGroup.add(pauldronL);

    const pauldronR = pauldronL.clone();
    pauldronR.position.x = 0.38;
    pauldronR.rotation.z = -0.6;
    torsoGroup.add(pauldronR);

  } else if (heroClass === 'DW') {
    // Túnica Mágica Longa e Fluida
    const robeGeom = new THREE.CylinderGeometry(0.24, 0.42, 0.72, 12);
    const robeMesh = new THREE.Mesh(robeGeom, armorMat);
    robeMesh.position.y = -0.05;
    robeMesh.castShadow = true;
    torsoGroup.add(robeMesh);

    // Gola Alta Mística de Feiticeiro
    const collarGeom = new THREE.CylinderGeometry(0.25, 0.22, 0.20, 10, 1, true, 0, Math.PI * 1.5);
    const collarMesh = new THREE.Mesh(collarGeom, goldTrimMat);
    collarMesh.position.set(0, 0.26, 0.02);
    collarMesh.rotation.y = Math.PI * 0.75;
    torsoGroup.add(collarMesh);

    // Capa Arcana Flutuante nas Costas
    const capeGeom = new THREE.PlaneGeometry(0.65, 1.2, 4, 8);
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });
    const capeMesh = new THREE.Mesh(capeGeom, capeMat);
    capeMesh.position.set(0, 0.15, -0.22);
    capeMesh.rotation.x = 0.15;
    parts.cape = capeMesh;
    torsoGroup.add(capeMesh);

  } else if (heroClass === 'ELF') {
    // Armadura Leve de Silfo com Folhas Douradas
    const corsetGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.48, 8);
    const corsetMesh = new THREE.Mesh(corsetGeom, armorMat);
    corsetMesh.castShadow = true;
    torsoGroup.add(corsetMesh);

    // Faixas de Ouro nos Ombros
    const goldBandGeom = new THREE.TorusGeometry(0.12, 0.025, 6, 16);
    const bandL = new THREE.Mesh(goldBandGeom, goldTrimMat);
    bandL.position.set(-0.25, 0.15, 0);
    bandL.rotation.y = Math.PI / 2;
    torsoGroup.add(bandL);

    const bandR = bandL.clone();
    bandR.position.x = 0.25;
    torsoGroup.add(bandR);

    // Aljava de Flechas nas Costas
    const quiverGeom = new THREE.CylinderGeometry(0.06, 0.04, 0.65, 8);
    const quiverMat = new THREE.MeshStandardMaterial({ color: PALETTES.leatherBrown, roughness: 0.6 });
    const quiverMesh = new THREE.Mesh(quiverGeom, quiverMat);
    quiverMesh.position.set(0.16, 0.15, -0.20);
    quiverMesh.rotation.z = -0.45;
    torsoGroup.add(quiverMesh);

    // Pontas das Flechas na Aljava
    const arrowsGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const arrowTipGeom = new THREE.ConeGeometry(0.025, 0.08, 4);
      const arrowTip = new THREE.Mesh(arrowTipGeom, goldTrimMat);
      arrowTip.position.set(0.12 + (i % 2) * 0.04, 0.45 + Math.floor(i / 2) * 0.05, -0.18);
      arrowsGroup.add(arrowTip);
    }
    torsoGroup.add(arrowsGroup);

  } else if (heroClass === 'MG') {
    // Armadura Hurricane de Gladiador Rúnico (Torso Aberto, Circuitos Neon e Lâminas de Ombro)
    const chestGeom = new THREE.BoxGeometry(0.52, 0.50, 0.30);
    const chestMesh = new THREE.Mesh(chestGeom, armorMat);
    chestMesh.castShadow = true;
    torsoGroup.add(chestMesh);

    // Circuito Rúnico Neon no Peito
    const runeCoreGeom = new THREE.BoxGeometry(0.12, 0.12, 0.05);
    const runeCoreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 2.5,
    });
    const runeCore = new THREE.Mesh(runeCoreGeom, runeCoreMat);
    runeCore.position.set(0, 0.08, 0.16);
    torsoGroup.add(runeCore);

    // Ombreiras de Lâmina Angular
    for (let s of [-1, 1]) {
      const pGeom = new THREE.ConeGeometry(0.16, 0.34, 4);
      const pMesh = new THREE.Mesh(pGeom, weaponMat);
      pMesh.position.set(s * 0.38, 0.20, 0);
      pMesh.rotation.set(0, s * 0.5, s * -0.6);
      torsoGroup.add(pMesh);
    }

  } else if (heroClass === 'DL') {
    // Armadura Imperial de Lorde (Peitoral com Águia Solar e Capa de Veludo)
    const chestGeom = new THREE.BoxGeometry(0.58, 0.52, 0.34);
    const chestMesh = new THREE.Mesh(chestGeom, armorMat);
    chestMesh.castShadow = true;
    torsoGroup.add(chestMesh);

    // Brasão Imperial Dourado
    const crestGeom = new THREE.CylinderGeometry(0.10, 0.10, 0.04, 8);
    const crestMesh = new THREE.Mesh(crestGeom, goldTrimMat);
    crestMesh.position.set(0, 0.08, 0.18);
    crestMesh.rotation.x = Math.PI / 2;
    torsoGroup.add(crestMesh);

    // Ombreiras Pesadas Douradas
    for (let s of [-1, 1]) {
      const pGeom = new THREE.CylinderGeometry(0.16, 0.14, 0.22, 12);
      const pMesh = new THREE.Mesh(pGeom, goldTrimMat);
      pMesh.position.set(s * 0.40, 0.20, 0);
      torsoGroup.add(pMesh);
    }

    // Majestosa Capa Imperial de Veludo
    const capeGeom = new THREE.PlaneGeometry(0.72, 1.35, 4, 8);
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      roughness: 0.65,
      side: THREE.DoubleSide,
    });
    const capeMesh = new THREE.Mesh(capeGeom, capeMat);
    capeMesh.position.set(0, 0.10, -0.24);
    capeMesh.rotation.x = 0.18;
    parts.cape = capeMesh;
    torsoGroup.add(capeMesh);
  }

  // --------------------------------------------------------------------------
  // CABEÇA & ELMO / CAPUZ / DIADEMA / COROA
  // --------------------------------------------------------------------------
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.42, 0);
  parts.head = headGroup;
  torsoGroup.add(headGroup);

  const faceGeom = new THREE.SphereGeometry(0.15, 16, 16);
  const faceMesh = new THREE.Mesh(faceGeom, skinMat);
  headGroup.add(faceMesh);

  if (heroClass === 'DK') {
    // Elmo Dragão Fechado com Chifres Curvados
    const helmGeom = new THREE.BoxGeometry(0.32, 0.32, 0.34);
    const helmMesh = new THREE.Mesh(helmGeom, armorMat);
    helmMesh.castShadow = true;
    headGroup.add(helmMesh);

    // Visor Vermelho Rúnico
    const visorGeom = new THREE.BoxGeometry(0.24, 0.05, 0.08);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xff0000,
      emissiveIntensity: 2.0,
      roughness: 0.1,
    });
    const visorMesh = new THREE.Mesh(visorGeom, visorMat);
    visorMesh.position.set(0, 0.02, 0.16);
    headGroup.add(visorMesh);

    // Chifres do Elmo
    const hornGeom = new THREE.ConeGeometry(0.06, 0.42, 6);
    const hornL = new THREE.Mesh(hornGeom, goldTrimMat);
    hornL.position.set(-0.20, 0.18, -0.05);
    hornL.rotation.set(-0.2, 0, 0.65);
    headGroup.add(hornL);

    const hornR = hornL.clone();
    hornR.position.x = 0.20;
    hornR.rotation.z = -0.65;
    headGroup.add(hornR);

  } else if (heroClass === 'DW') {
    // Chapéu Místico Pontiagudo de Arquimago
    const hatBrimGeom = new THREE.CylinderGeometry(0.34, 0.34, 0.03, 16);
    const hatBrim = new THREE.Mesh(hatBrimGeom, armorMat);
    hatBrim.position.y = 0.14;
    headGroup.add(hatBrim);

    const hatConeGeom = new THREE.ConeGeometry(0.22, 0.55, 12);
    const hatCone = new THREE.Mesh(hatConeGeom, armorMat);
    hatCone.position.set(0, 0.38, -0.06);
    hatCone.rotation.x = -0.22;
    headGroup.add(hatCone);

    // Faixa Dourada com Gema de Safira
    const gemHatGeom = new THREE.DodecahedronGeometry(0.045);
    const gemHatMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });
    const gemHat = new THREE.Mesh(gemHatGeom, gemHatMat);
    gemHat.position.set(0, 0.18, 0.16);
    headGroup.add(gemHat);

  } else if (heroClass === 'ELF') {
    // Diadema Élfico de Folhas Douradas e Orelhas Pontiagudas
    const circletGeom = new THREE.TorusGeometry(0.16, 0.02, 8, 16);
    const circletMesh = new THREE.Mesh(circletGeom, goldTrimMat);
    circletMesh.position.set(0, 0.06, 0);
    circletMesh.rotation.x = Math.PI / 2.3;
    headGroup.add(circletMesh);

    // Orelhas Élficas
    const earGeom = new THREE.ConeGeometry(0.04, 0.20, 4);
    const earL = new THREE.Mesh(earGeom, skinMat);
    earL.position.set(-0.16, 0.04, -0.04);
    earL.rotation.set(-0.4, 0, 1.1);
    headGroup.add(earL);

    const earR = earL.clone();
    earR.position.x = 0.16;
    earR.rotation.z = -1.1;
    headGroup.add(earR);

    // Cabelo Dourado Fluido
    const hairGeom = new THREE.CylinderGeometry(0.04, 0.18, 0.65, 8);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 });
    const hairMesh = new THREE.Mesh(hairGeom, hairMat);
    hairMesh.position.set(0, -0.10, -0.12);
    hairMesh.rotation.x = 0.25;
    headGroup.add(hairMesh);

  } else if (heroClass === 'MG') {
    // Gladiador Rúnico: Sem Elmo! Tiara Rúnica Dourada e Cabelos Prateados Espetados
    const circletGeom = new THREE.TorusGeometry(0.155, 0.018, 8, 20);
    const circletMesh = new THREE.Mesh(circletGeom, goldTrimMat);
    circletMesh.position.set(0, 0.06, 0);
    circletMesh.rotation.x = Math.PI / 2.3;
    headGroup.add(circletMesh);

    const runeGemMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 3.5,
    });
    const runeGem = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), runeGemMat);
    runeGem.position.set(0, 0.08, 0.16);
    headGroup.add(runeGem);

    // Cabelo Prateado Espetado
    const sHairMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.35 });
    const sHairGeom = new THREE.ConeGeometry(0.18, 0.50, 8);
    const sHairMesh = new THREE.Mesh(sHairGeom, sHairMat);
    sHairMesh.position.set(0, 0.18, -0.06);
    sHairMesh.rotation.x = 0.35;
    headGroup.add(sHairMesh);

  } else if (heroClass === 'DL') {
    // Lorde Imperial: Coroa Real com Spikes de Ouro e Rubi Solar Central
    const crownGeom = new THREE.CylinderGeometry(0.17, 0.16, 0.08, 16);
    const crownMesh = new THREE.Mesh(crownGeom, goldTrimMat);
    crownMesh.position.set(0, 0.16, 0);
    headGroup.add(crownMesh);

    for (let i = 0; i < 5; i++) {
      const ang = (i - 2) * 0.40;
      const spGeom = new THREE.ConeGeometry(0.025, 0.15, 4);
      const spMesh = new THREE.Mesh(spGeom, goldTrimMat);
      spMesh.position.set(Math.sin(ang) * 0.16, 0.25, Math.cos(ang) * 0.16);
      headGroup.add(spMesh);
    }

    const rubyMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 3.0,
    });
    const rubyMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), rubyMat);
    rubyMesh.position.set(0, 0.20, 0.17);
    headGroup.add(rubyMesh);
  }

  // --------------------------------------------------------------------------
  // BRAÇOS & MÃOS (ARTICULAÇÃO SUPERIOR)
  // --------------------------------------------------------------------------
  const armL = new THREE.Group();
  armL.position.set(-0.36, 0.12, 0);
  parts.armL = armL;
  torsoGroup.add(armL);

  const limbGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.52, 8);
  const armLMesh = new THREE.Mesh(limbGeom, armorMat);
  armLMesh.position.y = -0.26;
  armLMesh.castShadow = true;
  armL.add(armLMesh);

  const armR = new THREE.Group();
  armR.position.set(0.36, 0.12, 0);
  parts.armR = armR;
  torsoGroup.add(armR);

  const armRMesh = armLMesh.clone();
  armR.add(armRMesh);

  // --------------------------------------------------------------------------
  // PERNAS & GREVAS (LOCOMOÇÃO)
  // --------------------------------------------------------------------------
  const legL = new THREE.Group();
  legL.position.set(-0.18, -0.28, 0);
  parts.legL = legL;
  torsoGroup.add(legL);

  const legGeom = new THREE.CylinderGeometry(0.10, 0.08, 0.68, 8);
  const legLMesh = new THREE.Mesh(legGeom, armorMat);
  legLMesh.position.y = -0.34;
  legLMesh.castShadow = true;
  legL.add(legLMesh);

  const legR = new THREE.Group();
  legR.position.set(0.18, -0.28, 0);
  parts.legR = legR;
  torsoGroup.add(legR);

  const legRMesh = legLMesh.clone();
  legR.add(legRMesh);

  // --------------------------------------------------------------------------
  // ARMAS ICÔNICAS POR CLASSE
  // --------------------------------------------------------------------------
  if (heroClass === 'DK') {
    // DRAGON BLADE / ARCHANGEL SWORD (Mão Direita)
    const bladeGroup = new THREE.Group();
    bladeGroup.position.set(0, -0.48, 0.15);
    bladeGroup.rotation.x = Math.PI / 2;
    parts.blade = bladeGroup;
    armR.add(bladeGroup);

    const guardGeom = new THREE.BoxGeometry(0.32, 0.05, 0.08);
    const guardMesh = new THREE.Mesh(guardGeom, goldTrimMat);
    bladeGroup.add(guardMesh);

    const bladeGeom = new THREE.BoxGeometry(0.14, 1.45, 0.035);
    const bladeMesh = new THREE.Mesh(bladeGeom, weaponMat);
    bladeMesh.position.y = 0.76;
    bladeMesh.castShadow = true;
    bladeGroup.add(bladeMesh);

    const tipGeom = new THREE.ConeGeometry(0.07, 0.24, 4);
    const tipMesh = new THREE.Mesh(tipGeom, weaponMat);
    tipMesh.position.y = 1.58;
    tipMesh.rotation.y = Math.PI / 4;
    bladeGroup.add(tipMesh);

  } else if (heroClass === 'DW') {
    // CAJADO DE KUNDUN (Mão Direita)
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0, -0.42, 0.20);
    staffGroup.rotation.x = 0.3;
    parts.staff = staffGroup;
    armR.add(staffGroup);

    const shaftGeom = new THREE.CylinderGeometry(0.03, 0.03, 1.85, 10);
    const shaftMesh = new THREE.Mesh(shaftGeom, goldTrimMat);
    shaftMesh.position.y = 0.35;
    staffGroup.add(shaftMesh);

    const orbGeom = new THREE.SphereGeometry(0.14, 16, 16);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.2,
      roughness: 0.05,
    });
    const orbMesh = new THREE.Mesh(orbGeom, orbMat);
    orbMesh.position.y = 1.35;
    parts.manaOrb = orbMesh;
    staffGroup.add(orbMesh);

    const staffRingGeom = new THREE.TorusGeometry(0.22, 0.02, 6, 16);
    const staffRing = new THREE.Mesh(staffRingGeom, goldTrimMat);
    staffRing.position.y = 1.35;
    parts.staffRing = staffRing;
    staffGroup.add(staffRing);

    // Orbe Flutuante na Mão Esquerda (Casting Focus)
    const handOrbGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const handOrb = new THREE.Mesh(handOrbGeom, orbMat);
    handOrb.position.set(0, -0.48, 0.12);
    parts.handOrb = handOrb;
    armL.add(handOrb);

  } else if (heroClass === 'ELF') {
    // ARCO CELESTIAL (Mão Esquerda)
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0, -0.38, 0.20);
    parts.bow = bowGroup;
    armL.add(bowGroup);

    const bowGeom = new THREE.TorusGeometry(0.68, 0.03, 8, 24, Math.PI * 0.95);
    const bowMesh = new THREE.Mesh(bowGeom, goldTrimMat);
    bowMesh.rotation.z = Math.PI * 0.52;
    bowGroup.add(bowMesh);

    const stringGeom = new THREE.CylinderGeometry(0.006, 0.006, 1.32);
    const stringMat = new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      emissive: 0x10b981,
      emissiveIntensity: 2.5,
    });
    const stringMesh = new THREE.Mesh(stringGeom, stringMat);
    stringMesh.position.x = 0.32;
    bowGroup.add(stringMesh);

    const arrowGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.85);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0xecfdf5,
      emissive: 0x34d399,
      emissiveIntensity: 1.8,
    });
    const arrowMesh = new THREE.Mesh(arrowGeom, arrowMat);
    arrowMesh.rotation.z = Math.PI / 2;
    arrowMesh.position.set(0.15, 0, 0);
    parts.arrow = arrowMesh;
    bowGroup.add(arrowMesh);

  } else if (heroClass === 'MG') {
    // ESPADAS RÚNICAS DUPLAS (Fogo na Direita, Trovão na Esquerda)
    const bladeFireGroup = new THREE.Group();
    bladeFireGroup.position.set(0, -0.48, 0.15);
    bladeFireGroup.rotation.x = Math.PI / 2.2;
    parts.blade = bladeFireGroup;
    parts.bladeFire = bladeFireGroup;
    armR.add(bladeFireGroup);

    const fbladeGeom = new THREE.BoxGeometry(0.10, 1.25, 0.03);
    const fbladeMesh = new THREE.Mesh(fbladeGeom, weaponMat);
    fbladeMesh.position.y = 0.65;
    bladeFireGroup.add(fbladeMesh);

    const fireEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 3.5,
    });
    const fedgeGeom = new THREE.BoxGeometry(0.02, 1.20, 0.032);
    const fedgeMesh = new THREE.Mesh(fedgeGeom, fireEdgeMat);
    fedgeMesh.position.set(0.05, 0.65, 0);
    bladeFireGroup.add(fedgeMesh);

    // Espada do Trovão (Mão Esquerda)
    const bladeThunderGroup = new THREE.Group();
    bladeThunderGroup.position.set(0, -0.48, 0.15);
    bladeThunderGroup.rotation.x = Math.PI / 2.2;
    parts.bladeThunder = bladeThunderGroup;
    armL.add(bladeThunderGroup);

    const tbladeMesh = new THREE.Mesh(fbladeGeom, weaponMat);
    tbladeMesh.position.y = 0.65;
    bladeThunderGroup.add(tbladeMesh);

    const thunderEdgeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 3.5,
    });
    const tedgeMesh = new THREE.Mesh(fedgeGeom, thunderEdgeMat);
    tedgeMesh.position.set(-0.05, 0.65, 0);
    bladeThunderGroup.add(tedgeMesh);

  } else if (heroClass === 'DL') {
    // CETRO DO GRANDE LORDE (Mão Direita)
    const scepterGroup = new THREE.Group();
    scepterGroup.position.set(0, -0.42, 0.18);
    scepterGroup.rotation.x = 0.25;
    parts.scepter = scepterGroup;
    armR.add(scepterGroup);

    const shaftGeom = new THREE.CylinderGeometry(0.03, 0.03, 1.65, 10);
    const shaftMesh = new THREE.Mesh(shaftGeom, goldTrimMat);
    shaftMesh.position.y = 0.25;
    scepterGroup.add(shaftMesh);

    // Esfera Solar no Topo
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 2.8,
    });
    const sunOrb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), sunMat);
    sunOrb.position.y = 1.15;
    parts.sunOrb = sunOrb;
    scepterGroup.add(sunOrb);

    const sunRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 6, 16), goldTrimMat);
    sunRing.position.y = 1.15;
    scepterGroup.add(sunRing);

    // ESCUDO IMPERIAL (Mão Esquerda)
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(0, -0.35, 0.15);
    parts.shield = shieldGroup;
    armL.add(shieldGroup);

    const shGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 16);
    const shMesh = new THREE.Mesh(shGeom, goldTrimMat);
    shMesh.rotation.z = Math.PI / 2;
    shieldGroup.add(shMesh);

    // COMPANHEIRO: DARK RAVEN (No Ombro Esquerdo)
    const ravenGroup = new THREE.Group();
    ravenGroup.position.set(-0.40, 0.35, 0);
    parts.darkRaven = ravenGroup;
    torsoGroup.add(ravenGroup);

    const ravenMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.35, metalness: 0.4 });
    const rBody = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.20, 8), ravenMat);
    rBody.rotation.x = 0.35;
    ravenGroup.add(rBody);

    const rHead = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), ravenMat);
    rHead.position.set(0, 0.12, 0.06);
    ravenGroup.add(rHead);

    const rBeak = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 4), goldTrimMat);
    rBeak.position.set(0, 0.11, 0.11);
    rBeak.rotation.x = Math.PI / 2;
    ravenGroup.add(rBeak);
  }

  // --------------------------------------------------------------------------
  // ASAS TIER 2 TRANSLÚCIDAS ARTICULADAS (WINGS)
  // --------------------------------------------------------------------------
  const wingsGroup = new THREE.Group();
  wingsGroup.position.set(0, 0.18, -0.16);
  parts.wings = wingsGroup;
  torsoGroup.add(wingsGroup);

  const wingColor = heroClass === 'ELF' ? 0x10b981 : heroClass === 'DW' ? 0x38bdf8 : heroClass === 'MG' ? 0x6b21a8 : heroClass === 'DL' ? 0x991b1b : 0xef4444;
  const wingEmissive = heroClass === 'ELF' ? 0x059669 : heroClass === 'DW' ? 0x0284c7 : heroClass === 'MG' ? 0x581c87 : heroClass === 'DL' ? 0xd97706 : 0xb91c1c;

  const membraneMat = new THREE.MeshStandardMaterial({
    color: wingColor,
    emissive: wingEmissive,
    emissiveIntensity: 0.65,
    roughness: 0.25,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });
  glowMaterials.push(membraneMat);

  // Asa Esquerda
  const wingL = new THREE.Group();
  const boneLGeom = new THREE.BoxGeometry(0.85, 0.06, 0.05);
  const boneL = new THREE.Mesh(boneLGeom, goldTrimMat);
  boneL.position.x = -0.42;
  wingL.add(boneL);

  const membLGeom = new THREE.PlaneGeometry(0.85, 0.65, 4, 4);
  const membL = new THREE.Mesh(membLGeom, membraneMat);
  membL.position.set(-0.42, -0.32, 0);
  membL.rotation.y = 0.2;
  wingL.add(membL);

  parts.wingLeft = wingL;
  wingsGroup.add(wingL);

  // Asa Direita
  const wingR = new THREE.Group();
  const boneR = new THREE.Mesh(boneLGeom, goldTrimMat);
  boneR.position.x = 0.42;
  wingR.add(boneR);

  const membR = new THREE.Mesh(membLGeom, membraneMat);
  membR.position.set(0.42, -0.32, 0);
  membR.rotation.y = -0.2;
  wingR.add(membR);

  parts.wingRight = wingR;
  wingsGroup.add(wingR);

  // Carregamento Assíncrono do Modelo GLB Oficial (Blender 5.2) se disponível
  if (options.useRealGLB !== false && typeof GLTFLoader !== 'undefined') {
    loadRealHeroGLTF(heroClass, heroRoot, THREE, (glbModel) => {
      // Ajusta escala e posição para casar com o pedestal
      glbModel.position.set(0, 0, 0);
      parts.realGLB = glbModel;
      if (torsoGroup) {
        torsoGroup.visible = false;
      }
      const statusBadge = document.getElementById('lbl-real-scenery-status');
      if (statusBadge) {
        statusBadge.textContent = '🎮 Modelo 3D: Real GLB (Blender 5.2 PBR)';
        statusBadge.style.color = '#34d399';
      }
    });
  }

  // --------------------------------------------------------------------------
  // RIG & ANIMADOR CINEMÁTICO PROCEDURAL POR CLASSE
  // --------------------------------------------------------------------------
  const updateAnim = (animName, time, delta) => {
    // 0. Animação Sutil do Modelo Real GLB se ativo
    if (parts.realGLB) {
      parts.realGLB.position.y = Math.sin(time * 2.2) * 0.015;
      parts.realGLB.traverse((c) => {
        if (c.name && c.name.includes('Wing_L')) {
          c.rotation.y = Math.sin(time * 3.0) * 0.12;
        } else if (c.name && c.name.includes('Wing_R')) {
          c.rotation.y = -Math.sin(time * 3.0) * 0.12;
        } else if (c.name && c.name.includes('Raven')) {
          c.position.y = Math.sin(time * 4.0) * 0.02;
        }
      });
    }

    // 1. Rotação do Anel Rúnico
    if (parts.pedestalRing) {
      parts.pedestalRing.rotation.z = time * 0.25;
    }

    // 2. Ondulação das Asas
    if (parts.wingLeft && parts.wingRight) {
      const wingFlap = Math.sin(time * 3.2) * 0.18;
      parts.wingLeft.rotation.y = wingFlap - 0.25;
      parts.wingRight.rotation.y = -wingFlap + 0.25;
    }

    // 3. Efeitos Específicos por Classe
    if (heroClass === 'DW') {
      if (parts.staffRing) {
        parts.staffRing.rotation.x = time * 2.0;
        parts.staffRing.rotation.y = time * 1.5;
      }
      if (parts.handOrb) {
        parts.handOrb.position.y = -0.48 + Math.sin(time * 4.0) * 0.04;
      }
      if (parts.cape) {
        parts.cape.rotation.x = 0.15 + Math.sin(time * 2.5) * 0.08;
      }
    } else if (heroClass === 'DL') {
      if (parts.cape) {
        parts.cape.rotation.x = 0.18 + Math.sin(time * 2.0) * 0.06;
      }
      if (parts.darkRaven) {
        parts.darkRaven.rotation.y = Math.sin(time * 1.5) * 0.25;
        parts.darkRaven.position.y = 0.35 + Math.sin(time * 2.5) * 0.01;
      }
      if (parts.sunOrb) {
        parts.sunOrb.rotation.y = time * 2.0;
      }
    } else if (heroClass === 'MG') {
      if (parts.bladeFire) {
        parts.bladeFire.rotation.x = Math.PI / 2.2 + Math.sin(time * 3.0) * 0.05;
      }
      if (parts.bladeThunder) {
        parts.bladeThunder.rotation.x = Math.PI / 2.2 - Math.sin(time * 3.0) * 0.05;
      }
    }

    // 4. Animações de Ação Específicas
    if (animName === 'IDLE') {
      const breath = Math.sin(time * 2.4);
      if (parts.torso) parts.torso.position.y = 1.15 + breath * 0.015;
      if (parts.head) parts.head.rotation.x = breath * 0.02;

      if (heroClass === 'DK') {
        if (parts.armR) parts.armR.rotation.set(breath * 0.04, 0, 0);
        if (parts.armL) parts.armL.rotation.set(-breath * 0.03, 0, 0);
        if (parts.root) parts.root.rotation.set(0, 0, 0);
      } else if (heroClass === 'DW') {
        if (parts.root) parts.root.position.y = 0.22 + Math.sin(time * 1.8) * 0.06;
        if (parts.armL) parts.armL.rotation.set(0.3 + breath * 0.05, 0, 0.4);
      } else if (heroClass === 'ELF') {
        if (parts.armL) parts.armL.rotation.set(0.2, 0, -0.1);
        if (parts.armR) parts.armR.rotation.set(-0.2 + breath * 0.03, 0, 0.2);
      } else if (heroClass === 'MG') {
        if (parts.armL) parts.armL.rotation.set(0.1 + breath * 0.02, 0, -0.15);
        if (parts.armR) parts.armR.rotation.set(0.1 - breath * 0.02, 0, 0.15);
      } else if (heroClass === 'DL') {
        if (parts.armL) parts.armL.rotation.set(-0.1, 0, 0.1);
        if (parts.armR) parts.armR.rotation.set(0.15 + breath * 0.03, 0, 0);
      }
    } else if (animName === 'TWISTING_SLASH' || animName === 'SKILL_1') {
      if (heroClass === 'DK') {
        const turn = (time * 12.0) % (Math.PI * 2);
        if (parts.root) parts.root.rotation.y = turn;
        if (parts.armR) parts.armR.rotation.set(Math.PI / 2.2, 0, 0.3);
        if (parts.torso) parts.torso.position.y = 1.10;
      } else if (heroClass === 'DW') {
        if (parts.armR) parts.armR.rotation.set(Math.PI * 0.8, 0, -0.2);
        if (parts.armL) parts.armL.rotation.set(Math.PI * 0.8, 0, 0.2);
        if (parts.root) parts.root.position.y = 0.35 + Math.sin(time * 6.0) * 0.05;
      } else if (heroClass === 'ELF') {
        const pull = Math.sin(time * 8.0);
        if (parts.armL) parts.armL.rotation.set(Math.PI / 2, 0, -0.4);
        if (parts.armR) parts.armR.rotation.set(Math.PI / 2, 0, 0.6 + pull * 0.2);
      } else if (heroClass === 'MG') {
        const swing = Math.sin(time * 12.0);
        if (parts.armR) parts.armR.rotation.set(Math.PI / 2.5, swing * 0.8, 0.4);
        if (parts.armL) parts.armL.rotation.set(Math.PI / 2.5, -swing * 0.8, -0.4);
      } else if (heroClass === 'DL') {
        const slam = Math.sin(time * 8.0);
        if (parts.armR) parts.armR.rotation.set(Math.PI / 2 + slam * 0.6, 0, 0);
      }
    } else if (animName === 'DEATH_STAB' || animName === 'SKILL_2') {
      const thrust = Math.sin(time * 10.0);
      if (parts.root) parts.root.position.z = Math.max(0, thrust * 0.8);
      if (parts.armR) parts.armR.rotation.set(Math.PI / 2 + thrust * 0.2, 0, 0);
    } else if (animName === 'ROLL' || animName === 'DODGE') {
      const roll = (time * 6.0) % (Math.PI * 2);
      if (parts.root) {
        parts.root.rotation.x = roll;
        parts.root.position.y = 0.22 + Math.sin(roll) * 0.25;
      }
    }
  };

  return {
    group: rootGroup,
    parts,
    glowMaterials,
    weaponMat,
    armorMat,
    updateAnim,
  };
}


// ============================================================================
// 2. GERADOR DE MONSTROS 3D (SPIDER, BUDGE DRAGON, BULL FIGHTER, SKELETON)
// ============================================================================
export function createMonster(monsterType, THREE) {
  const rootGroup = new THREE.Group();
  const parts = {};
  const glowMaterials = [];

  // Pedestal Sombrio de Spawn
  const groundRingGeom = new THREE.RingGeometry(1.0, 1.25, 32);
  const groundRingMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75,
  });
  const groundRing = new THREE.Mesh(groundRingGeom, groundRingMat);
  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = 0.02;
  rootGroup.add(groundRing);
  parts.groundRing = groundRing;

  if (monsterType === 'SPIDER') {
    // ------------------------------------------------------------------------
    // ARANHA GIGANTE (8 Patas Articuladas, Quelíceras, 6 Olhos Vermelhos)
    // ------------------------------------------------------------------------
    const spiderMat = new THREE.MeshStandardMaterial({
      color: PALETTES.spiderChitin,
      roughness: 0.35,
      metalness: 0.55,
    });

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 2.8,
      roughness: 0.1,
    });

    const venomMat = new THREE.MeshStandardMaterial({
      color: PALETTES.spiderVenom,
      emissive: 0x4d7c0f,
      emissiveIntensity: 1.5,
    });

    // Cefalotórax (Cabeça/Tórax)
    const cephGeom = new THREE.SphereGeometry(0.32, 12, 10);
    const cephMesh = new THREE.Mesh(cephGeom, spiderMat);
    cephMesh.position.set(0, 0.45, 0.15);
    cephMesh.scale.set(1.0, 0.7, 1.2);
    cephMesh.castShadow = true;
    rootGroup.add(cephMesh);
    parts.ceph = cephMesh;

    // Abdômen Pulsante Traseiro
    const abdGeom = new THREE.SphereGeometry(0.55, 14, 12);
    const abdMesh = new THREE.Mesh(abdGeom, spiderMat);
    abdMesh.position.set(0, 0.62, -0.65);
    abdMesh.scale.set(1.1, 0.9, 1.4);
    abdMesh.castShadow = true;
    rootGroup.add(abdMesh);
    parts.abdomen = abdMesh;

    // 6 Olhos Múltiplos Vermelhos
    for (let i = 0; i < 6; i++) {
      const eyeGeom = new THREE.SphereGeometry(0.04, 8, 8);
      const eyeMesh = new THREE.Mesh(eyeGeom, eyeMat);
      const xOffset = (i % 3 - 1) * 0.08;
      const yOffset = Math.floor(i / 3) * 0.07;
      eyeMesh.position.set(xOffset, 0.52 + yOffset, 0.48);
      rootGroup.add(eyeMesh);
    }

    // Quelíceras Frontais Venenosas
    const fangGeom = new THREE.ConeGeometry(0.05, 0.22, 6);
    const fangL = new THREE.Mesh(fangGeom, venomMat);
    fangL.position.set(-0.10, 0.35, 0.50);
    fangL.rotation.set(0.6, 0, 0.2);
    rootGroup.add(fangL);
    parts.fangL = fangL;

    const fangR = fangL.clone();
    fangR.position.x = 0.10;
    fangR.rotation.z = -0.2;
    rootGroup.add(fangR);
    parts.fangR = fangR;

    // 8 Patas Articuladas (4 de cada lado)
    parts.legs = [];
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1;
      const index = i % 4;
      const legGroup = new THREE.Group();
      legGroup.position.set(side * 0.28, 0.45, 0.28 - index * 0.26);

      // Coxa (Segmento 1)
      const coxaGeom = new THREE.CylinderGeometry(0.04, 0.035, 0.45, 6);
      const coxa = new THREE.Mesh(coxaGeom, spiderMat);
      coxa.position.set(side * 0.22, 0.18, 0);
      coxa.rotation.z = side * -0.9;
      legGroup.add(coxa);

      // Tarso (Segmento 2 tocando o solo)
      const tibiaGeom = new THREE.CylinderGeometry(0.035, 0.02, 0.65, 6);
      const tibia = new THREE.Mesh(tibiaGeom, spiderMat);
      tibia.position.set(side * 0.48, -0.15, 0);
      tibia.rotation.z = side * 0.65;
      legGroup.add(tibia);

      rootGroup.add(legGroup);
      parts.legs.push({ group: legGroup, side, index });
    }
  } else if (monsterType === 'BUDGE_DRAGON') {
    // ------------------------------------------------------------------------
    // BUDGE DRAGON (Pequeno Dragão Alado Vermelho com Escamas e Asas Rápidas)
    // ------------------------------------------------------------------------
    const dragonMat = new THREE.MeshStandardMaterial({
      color: PALETTES.dragonScales,
      roughness: 0.4,
      metalness: 0.3,
    });

    const hornMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.2,
      metalness: 0.8,
    });

    const fireMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 2.2,
    });

    // Tronco Reptiliano
    const bodyGeom = new THREE.SphereGeometry(0.38, 12, 10);
    const bodyMesh = new THREE.Mesh(bodyGeom, dragonMat);
    bodyMesh.position.set(0, 0.85, 0);
    bodyMesh.scale.set(0.9, 1.2, 1.1);
    bodyMesh.castShadow = true;
    rootGroup.add(bodyMesh);
    parts.body = bodyMesh;

    // Cabeça Chifruda
    const headGeom = new THREE.BoxGeometry(0.28, 0.24, 0.42);
    const headMesh = new THREE.Mesh(headGeom, dragonMat);
    headMesh.position.set(0, 1.35, 0.22);
    headMesh.castShadow = true;
    rootGroup.add(headMesh);
    parts.head = headMesh;

    // Chifres do Dragãozinho
    const hornGeom = new THREE.ConeGeometry(0.05, 0.32, 6);
    const hornL = new THREE.Mesh(hornGeom, hornMat);
    hornL.position.set(-0.12, 1.55, 0.08);
    hornL.rotation.set(-0.4, 0, 0.4);
    rootGroup.add(hornL);

    const hornR = hornL.clone();
    hornR.position.x = 0.12;
    hornR.rotation.z = -0.4;
    rootGroup.add(hornR);

    // Baforada / Centelha no Bico
    const fireSpit = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09), fireMat);
    fireSpit.position.set(0, 1.28, 0.48);
    parts.fireSpit = fireSpit;
    rootGroup.add(fireSpit);

    // Asas Membranosas Batendo Rápido
    const wingGeom = new THREE.PlaneGeometry(0.65, 0.45);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });

    const wingL = new THREE.Mesh(wingGeom, wingMat);
    wingL.position.set(-0.35, 1.05, -0.08);
    wingL.rotation.y = 0.3;
    rootGroup.add(wingL);
    parts.wingL = wingL;

    const wingR = wingL.clone();
    wingR.position.x = 0.35;
    wingR.rotation.y = -0.3;
    rootGroup.add(wingR);
    parts.wingR = wingR;

    // Cauda Sinuosa
    const tailGeom = new THREE.CylinderGeometry(0.02, 0.08, 0.75, 6);
    const tailMesh = new THREE.Mesh(tailGeom, dragonMat);
    tailMesh.position.set(0, 0.65, -0.45);
    tailMesh.rotation.x = -0.7;
    rootGroup.add(tailMesh);
    parts.tail = tailMesh;
  } else if (monsterType === 'BULL_FIGHTER') {
    // ------------------------------------------------------------------------
    // BULL FIGHTER (Minotauro Brutamontes com Chifres de Marfim e Machado Pesado)
    // ------------------------------------------------------------------------
    const furMat = new THREE.MeshStandardMaterial({
      color: PALETTES.minotaurFur,
      roughness: 0.75,
      metalness: 0.1,
    });

    const hornMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.3,
      metalness: 0.2,
    });

    const ironAxeMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      metalness: 0.88,
      roughness: 0.25,
    });

    // Tronco Massivo
    const torsoGeom = new THREE.BoxGeometry(0.85, 0.95, 0.58);
    const torsoMesh = new THREE.Mesh(torsoGeom, furMat);
    torsoMesh.position.set(0, 1.35, 0);
    torsoMesh.castShadow = true;
    rootGroup.add(torsoMesh);
    parts.torso = torsoMesh;

    // Cabeça de Touro
    const headGeom = new THREE.BoxGeometry(0.52, 0.48, 0.55);
    const headMesh = new THREE.Mesh(headGeom, furMat);
    headMesh.position.set(0, 1.95, 0.15);
    rootGroup.add(headMesh);
    parts.head = headMesh;

    // Chifres Longos Curvados para a Frente
    const hornLGeom = new THREE.ConeGeometry(0.09, 0.65, 8);
    const hornL = new THREE.Mesh(hornLGeom, hornMat);
    hornL.position.set(-0.38, 2.15, 0.22);
    hornL.rotation.set(0.6, 0, 0.85);
    rootGroup.add(hornL);

    const hornR = hornL.clone();
    hornR.position.x = 0.38;
    hornR.rotation.z = -0.85;
    rootGroup.add(hornR);

    // Argola no Focinho
    const snoutRingGeom = new THREE.TorusGeometry(0.08, 0.02, 6, 16);
    const snoutRing = new THREE.Mesh(snoutRingGeom, hornMat);
    snoutRing.position.set(0, 1.78, 0.45);
    snoutRing.rotation.y = Math.PI / 2;
    rootGroup.add(snoutRing);

    // Machado de Batalha Duplo
    const axeGroup = new THREE.Group();
    axeGroup.position.set(0.65, 1.15, 0.25);
    axeGroup.rotation.x = Math.PI / 4;
    parts.axe = axeGroup;
    rootGroup.add(axeGroup);

    const handleGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.65, 8);
    const handleMesh = new THREE.Mesh(handleGeom, new THREE.MeshStandardMaterial({ color: PALETTES.leatherBrown }));
    axeGroup.add(handleMesh);

    const bladeLGeom = new THREE.BoxGeometry(0.45, 0.65, 0.04);
    const bladeL = new THREE.Mesh(bladeLGeom, ironAxeMat);
    bladeL.position.set(-0.25, 0.55, 0);
    axeGroup.add(bladeL);

    const bladeR = bladeL.clone();
    bladeR.position.x = 0.25;
    axeGroup.add(bladeR);
  } else if (monsterType === 'SKELETON') {
    // ------------------------------------------------------------------------
    // SKELETON WARRIOR (Crânio, Costelas Expostas, Escudo e Cimitarra)
    // ------------------------------------------------------------------------
    const boneMat = new THREE.MeshStandardMaterial({
      color: PALETTES.boneIvory,
      roughness: 0.55,
      metalness: 0.1,
    });

    const eyeSoulMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.5,
    });

    const rustSwordMat = new THREE.MeshStandardMaterial({
      color: 0x52525b,
      metalness: 0.75,
      roughness: 0.4,
    });

    // Crânio
    const skullGeom = new THREE.BoxGeometry(0.28, 0.32, 0.30);
    const skullMesh = new THREE.Mesh(skullGeom, boneMat);
    skullMesh.position.set(0, 1.65, 0);
    rootGroup.add(skullMesh);
    parts.skull = skullMesh;

    // Órbitas Oculares com Almas Espectrais Ciano
    const eyeGeom = new THREE.SphereGeometry(0.04, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeom, eyeSoulMat);
    eyeL.position.set(-0.07, 1.68, 0.14);
    rootGroup.add(eyeL);

    const eyeR = eyeL.clone();
    eyeR.position.x = 0.07;
    rootGroup.add(eyeR);

    // Caixa Torácica / Costelas
    const ribcageGeom = new THREE.CylinderGeometry(0.22, 0.18, 0.55, 6, 4, true);
    const ribcage = new THREE.Mesh(ribcageGeom, boneMat);
    ribcage.position.set(0, 1.25, 0);
    rootGroup.add(ribcage);
    parts.ribcage = ribcage;

    // Coluna Vertebral
    const spineGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.65, 6);
    const spine = new THREE.Mesh(spineGeom, boneMat);
    spine.position.set(0, 1.22, -0.05);
    rootGroup.add(spine);

    // Escudo Redondo de Madeira e Ferro (Braço Esquerdo)
    const shieldGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 16);
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.65 });
    const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    shieldMesh.position.set(-0.45, 1.15, 0.15);
    shieldMesh.rotation.z = Math.PI / 2;
    rootGroup.add(shieldMesh);
    parts.shield = shieldMesh;

    // Cimitarra Curva (Mão Direita)
    const swordGroup = new THREE.Group();
    swordGroup.position.set(0.45, 1.05, 0.10);
    swordGroup.rotation.x = Math.PI / 3;
    parts.sword = swordGroup;
    rootGroup.add(swordGroup);

    const swordBladeGeom = new THREE.BoxGeometry(0.08, 0.95, 0.02);
    const swordBlade = new THREE.Mesh(swordBladeGeom, rustSwordMat);
    swordBlade.position.y = 0.45;
    swordGroup.add(swordBlade);
  }

  // --------------------------------------------------------------------------
  // RIG & ANIMADOR CINEMÁTICO DE MONSTROS
  // --------------------------------------------------------------------------
  const updateAnim = (animName, time, delta) => {
    if (parts.groundRing) {
      parts.groundRing.rotation.z = time * 0.35;
    }

    if (monsterType === 'SPIDER') {
      // Movimento rítmico das 8 patas
      const gaitSpeed = animName === 'WALK' ? 12.0 : 3.0;
      if (parts.legs) {
        parts.legs.forEach(({ group, side, index }) => {
          const phase = index * 0.78 + (side > 0 ? Math.PI : 0);
          const step = Math.sin(time * gaitSpeed + phase);
          group.rotation.x = step * (animName === 'WALK' ? 0.35 : 0.08);
          group.position.y = 0.45 + Math.max(0, step * 0.08);
        });
      }
      if (parts.abdomen) {
        // Pulso do abdômen
        const pump = 1.0 + Math.sin(time * 3.5) * 0.06;
        parts.abdomen.scale.set(1.1 * pump, 0.9 * pump, 1.4 * pump);
      }
      if (parts.fangL && parts.fangR) {
        const bite = Math.sin(time * 6.0) * 0.15;
        parts.fangL.rotation.y = bite;
        parts.fangR.rotation.y = -bite;
      }
    } else if (monsterType === 'BUDGE_DRAGON') {
      // Asas batem em alta frequência
      const flap = Math.sin(time * 18.0) * 0.6;
      if (parts.wingL) parts.wingL.rotation.z = flap;
      if (parts.wingR) parts.wingR.rotation.z = -flap;

      // Cauda sinuosa
      if (parts.tail) parts.tail.rotation.y = Math.sin(time * 6.0) * 0.35;

      // Voo pairado
      if (parts.body) parts.body.position.y = 0.85 + Math.sin(time * 4.0) * 0.08;
    } else if (monsterType === 'BULL_FIGHTER') {
      // Respiração pesada e balanço do machado
      const breath = Math.sin(time * 2.2);
      if (parts.torso) parts.torso.position.y = 1.35 + breath * 0.025;
      if (parts.axe) {
        if (animName === 'ATTACK') {
          // Golpe violento com o machado
          const chop = (time * 5.0) % Math.PI;
          parts.axe.rotation.x = Math.sin(chop) * 1.5;
        } else {
          parts.axe.rotation.x = Math.PI / 4 + breath * 0.06;
        }
      }
    } else if (monsterType === 'SKELETON') {
      // Trepidação rítmica óssea
      const rattle = Math.sin(time * 3.0);
      if (parts.skull) parts.skull.rotation.y = rattle * 0.12;
      if (parts.sword) {
        if (animName === 'ATTACK') {
          const slash = (time * 8.0) % Math.PI;
          parts.sword.rotation.z = Math.sin(slash) * 1.2;
        } else {
          parts.sword.rotation.x = Math.PI / 3 + rattle * 0.08;
        }
      }
    }
  };

  return {
    group: rootGroup,
    parts,
    glowMaterials,
    updateAnim,
  };
}

// ============================================================================
// 3. GERADOR DE CENÁRIOS 3D CANÔNICOS E VIVOS (5 BIOMAS DE DASI)
// ============================================================================
// 3. GERADOR DE CENÁRIOS 3D CANÔNICOS BASEADOS NO CONCEPT ART & LEVEL DESIGN
// ============================================================================
export function createEnvironment(envType, THREE) {
  // Todos os cenários operam 100% no pipeline 3D Real (GLB PBR do Blender 5.2 + Partículas e Luzes Dinâmicas)
  const legacyBiomes = [];
  if (!legacyBiomes.includes(envType)) {
    const envGroup = new THREE.Group();
    const dynamicLights = [];
    const animParts = {};
    buildScenario3D(envType, THREE, envGroup, dynamicLights, animParts);
    // Dispara carregamento assíncrono do GLB real compilado do Blender 5.2
    loadBiomeGLB(envType, THREE, envGroup, (model) => {
      animParts.realSceneryModel = model;
    });
    return {
      group: envGroup,
      dynamicLights,
      animParts,
      updateAnim: (...args) => {
        let time = 0, dt = 0.016;
        if (args.length >= 3) { time = typeof args[1] === 'number' ? args[1] : 0; dt = typeof args[2] === 'number' ? args[2] : 0.016; }
        else if (args.length === 2) { time = typeof args[0] === 'number' ? args[0] : 0; dt = typeof args[1] === 'number' ? args[1] : 0.016; }
        else if (args.length === 1) { time = typeof args[0] === 'number' ? args[0] : 0; }
        if (animParts.fountainWater) animParts.fountainWater.rotation.z = time * 0.2;
        if (animParts.archangelHalo) { animParts.archangelHalo.rotation.z = time * 0.8; }
        if (animParts.chaosGear) animParts.chaosGear.rotation.y = time * 1.5;
        if (animParts.chaosCore) animParts.chaosCore.rotation.x = time * 1.2;
        if (animParts.kingFlame) animParts.kingFlame.scale.y = 1.0 + Math.sin(time * 6.0) * 0.15;
        if (animParts.airDome) animParts.airDome.scale.y = 1.0 + Math.sin(time * 2.5) * 0.05;
        if (animParts.aetheriteCore) { animParts.aetheriteCore.rotation.y = time * 1.2; }
        if (animParts.phoenixFire) { animParts.phoenixFire.rotation.y = time * 2.0; }
        if (animParts.zaikanVortex) { animParts.zaikanVortex.rotation.y = -time * 1.8; }

        // Atualização Dinâmica de Partículas dos 47 Cenários (60 FPS)
        if (animParts.rainSystem) {
          const rPos = animParts.rainSystem.geometry.attributes.position.array;
          const count = rPos.length / 3;
          for (let i = 0; i < count; i++) {
            rPos[i * 3 + 1] -= dt * 11.5;
            rPos[i * 3 + 0] -= dt * 1.3;
            if (rPos[i * 3 + 1] < 0.0) {
              rPos[i * 3 + 1] = 12.0;
              rPos[i * 3 + 0] = (Math.random() - 0.5) * 40.0;
            }
          }
          animParts.rainSystem.geometry.attributes.position.needsUpdate = true;
        }

        if (animParts.sporeSystem) {
          const sPos = animParts.sporeSystem.geometry.attributes.position.array;
          const count = sPos.length / 3;
          for (let i = 0; i < count; i++) {
            sPos[i * 3 + 1] += Math.sin(time * 1.5 + i) * 0.015;
            sPos[i * 3 + 0] += Math.cos(time * 0.8 + i) * 0.012;
          }
          animParts.sporeSystem.geometry.attributes.position.needsUpdate = true;
        }

        if (animParts.blizzardSystem) {
          const snPos = animParts.blizzardSystem.geometry.attributes.position.array;
          const count = snPos.length / 3;
          for (let i = 0; i < count; i++) {
            snPos[i * 3 + 0] -= dt * 12.5;
            snPos[i * 3 + 1] -= dt * 1.6;
            snPos[i * 3 + 2] += Math.sin(time * 3.0 + i) * 0.035;
            if (snPos[i * 3 + 0] < -20.0) {
              snPos[i * 3 + 0] = 20.0;
              snPos[i * 3 + 1] = Math.random() * 10.0;
            }
          }
          animParts.blizzardSystem.geometry.attributes.position.needsUpdate = true;
        }

        if (animParts.acidVapor) {
          const aPos = animParts.acidVapor.geometry.attributes.position.array;
          const count = aPos.length / 3;
          for (let i = 0; i < count; i++) {
            aPos[i * 3 + 1] += dt * 1.4;
            aPos[i * 3 + 0] += Math.sin(time * 1.8 + i) * 0.012;
            if (aPos[i * 3 + 1] > 6.0) {
              aPos[i * 3 + 1] = 0.1;
              aPos[i * 3 + 0] = (Math.random() - 0.5) * 36.0;
            }
          }
          animParts.acidVapor.geometry.attributes.position.needsUpdate = true;
        }

        if (animParts.dungeonWisps) {
          animParts.dungeonWisps.forEach((wisp) => {
            const { baseX, baseZ, seed, speed } = wisp.userData;
            wisp.position.x = baseX + Math.sin(time * speed + seed) * 1.2;
            wisp.position.y = 1.4 + Math.sin(time * (speed * 1.3) + seed) * 0.6;
            wisp.position.z = baseZ + Math.cos(time * (speed * 0.9) + seed) * 1.2;
          });
        }

        if (animParts.lostTowerEmbers) {
          const ePos = animParts.lostTowerEmbers.geometry.attributes.position.array;
          const count = ePos.length / 3;
          for (let i = 0; i < count; i++) {
            ePos[i * 3 + 1] += dt * 3.2;
            ePos[i * 3 + 0] += Math.sin(time * 2.2 + i) * 0.02;
            ePos[i * 3 + 2] += Math.cos(time * 1.7 + i) * 0.02;
            if (ePos[i * 3 + 1] > 9.0) {
              ePos[i * 3 + 1] = 0.2;
              ePos[i * 3 + 0] = (Math.random() - 0.5) * 38.0;
              ePos[i * 3 + 2] = (Math.random() - 0.5) * 38.0;
            }
          }
          animParts.lostTowerEmbers.geometry.attributes.position.needsUpdate = true;
        }

        if (animParts.tarkanSandstorm) {
          const tPos = animParts.tarkanSandstorm.geometry.attributes.position.array;
          const count = tPos.length / 3;
          for (let i = 0; i < count; i++) {
            tPos[i * 3 + 0] -= dt * 14.0;
            tPos[i * 3 + 1] += Math.sin(time * 3.5 + i) * 0.015;
            tPos[i * 3 + 2] += Math.cos(time * 2.5 + i) * 0.025;
            if (tPos[i * 3 + 0] < -25.0) {
              tPos[i * 3 + 0] = 25.0;
              tPos[i * 3 + 1] = Math.random() * 4.0;
              tPos[i * 3 + 2] = (Math.random() - 0.5) * 50.0;
            }
          }
          animParts.tarkanSandstorm.geometry.attributes.position.needsUpdate = true;
        }

        if (animParts.abyssalPlankton) {
          const pPos = animParts.abyssalPlankton.geometry.attributes.position.array;
          const count = pPos.length / 3;
          for (let i = 0; i < count; i++) {
            pPos[i * 3 + 1] += Math.sin(time * 1.2 + i) * 0.01;
            pPos[i * 3 + 0] += Math.cos(time * 0.9 + i) * 0.015;
            pPos[i * 3 + 2] += Math.sin(time * 0.7 + i) * 0.01;
          }
          animParts.abyssalPlankton.geometry.attributes.position.needsUpdate = true;
        }

        if (animParts.bubbles) {
          animParts.bubbles.forEach((b) => {
            b.position.y += dt * b.userData.speed;
            b.position.x += Math.sin(time * 2.5 + b.userData.seed) * 0.015;
            if (b.position.y > 7.0) {
              b.position.y = 0.2;
              b.position.x = (Math.random() - 0.5) * 30.0;
              b.position.z = (Math.random() - 0.5) * 30.0;
            }
          });
        }

        if (animParts.starSystem) {
          animParts.starSystem.rotation.y = time * 0.05;
        }

        if (animParts.torches) {
          animParts.torches.forEach(({ flame, light }, idx) => {
            const flicker = 1.0 + Math.sin(time * 16.0 + idx * 2.3) * 0.18 + Math.cos(time * 31.0 + idx) * 0.08;
            if (light) light.intensity = 2.6 * flicker;
            if (flame) flame.scale.set(flicker, flicker * 1.15, flicker);
          });
        }
      }
    };
  }
  const envGroup = new THREE.Group();
  const dynamicLights = [];
  const animParts = {};

  // Dispara carregamento assíncrono do modelo 3D Real (.glb) compilado pelo Blender 5.2
  loadBiomeGLB(envType, THREE, envGroup, (model) => {
    animParts.realSceneryModel = model;
  });

  if (envType === 'LORENCIA') {
    // ========================================================================
    // 1. LORENCIA: Cidadela do Castelo de Loren & Planícies Cinzentas
    // (Conforme docs/level_design/Lorencia_Level_Design.md)
    // ========================================================================
    // 1.1 Chão de Calçamento de Pedra Calcária Gótica com Desníveis
    const floorGeom = new THREE.PlaneGeometry(42, 42, 32, 32);
    const cobbleTex = createProceduralCanvasTexture('COBBLESTONE', THREE, 8, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.65,
      metalness: 0.20,
      map: cobbleTex,
      bumpMap: cobbleTex,
      bumpScale: 0.05,
    });
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    envGroup.add(floorMesh);

    // 1.2 Depressões e Poças de Água da Chuva com Reflexão Especular
    const puddlesGroup = new THREE.Group();
    const puddleCoords = [
      [-3.8, 0.015, -2.5, 2.2, 1.6],
      [4.5, 0.015, -2.0, 2.6, 1.8],
      [-3.0, 0.015, 4.2, 2.0, 1.4],
      [4.2, 0.015, 4.8, 2.4, 1.6],
      [0.0, 0.015, 7.5, 3.2, 2.0],
      [-7.5, 0.015, 1.0, 1.8, 1.3],
      [7.5, 0.015, 1.0, 1.9, 1.4],
    ];
    animParts.puddles = [];
    puddleCoords.forEach(([px, py, pz, rx, rz]) => {
      const puddleGeom = new THREE.CircleGeometry(1.0, 16);
      const puddleMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.04,
        metalness: 0.40,
        transparent: true,
        opacity: 0.80,
      });
      const puddle = new THREE.Mesh(puddleGeom, puddleMat);
      puddle.rotation.x = -Math.PI / 2;
      puddle.scale.set(rx, rz, 1.0);
      puddle.position.set(px, py, pz);
      puddlesGroup.add(puddle);
      animParts.puddles.push(puddle);
    });
    envGroup.add(puddlesGroup);

    // 1.3 A Grande Fonte Monumental do Arcanjo de Loren (POI 1: Centro da Praça)
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(0, 0, 0);

    // Degraus concêntricos da fonte
    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 0.20, 16), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }));
    step1.position.y = 0.10;
    fountainGroup.add(step1);

    const step2 = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.20, 16), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65 }));
    step2.position.y = 0.30;
    fountainGroup.add(step2);

    // Bacia octogonal em cantaria trabalhada
    const basinOuterGeom = new THREE.CylinderGeometry(2.7, 3.0, 0.65, 8);
    const basinMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.60, metalness: 0.15 });
    const basinMesh = new THREE.Mesh(basinOuterGeom, basinMat);
    basinMesh.position.y = 0.65;
    basinMesh.castShadow = true;
    fountainGroup.add(basinMesh);

    // Água da bacia com transparência e ondulação rúnica
    const waterGeom = new THREE.CircleGeometry(2.5, 24);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
      roughness: 0.05,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88,
    });
    const waterMesh = new THREE.Mesh(waterGeom, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 0.92;
    fountainGroup.add(waterMesh);
    animParts.fountainWater = waterMesh;

    // 4 Gárgulas nos cantos da bacia vertendo jatos d'água
    for (let g = 0; g < 4; g++) {
      const angle = (g / 4) * Math.PI * 2 + Math.PI / 8;
      const gargoyle = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.45), basinMat);
      gargoyle.position.set(Math.cos(angle) * 2.7, 0.95, Math.sin(angle) * 2.7);
      gargoyle.rotation.y = -angle + Math.PI / 2;
      fountainGroup.add(gargoyle);

      // Jato de água curvo
      const streamGeom = new THREE.CylinderGeometry(0.04, 0.07, 0.55, 6);
      const streamMesh = new THREE.Mesh(streamGeom, waterMat);
      streamMesh.position.set(Math.cos(angle) * 2.9, 0.70, Math.sin(angle) * 2.9);
      streamMesh.rotation.z = Math.cos(angle) * 0.4;
      streamMesh.rotation.x = Math.sin(angle) * 0.4;
      fountainGroup.add(streamMesh);
    }

    // Pedestal ornamental esculpido
    const pedestalGeom = new THREE.CylinderGeometry(0.55, 0.75, 1.8, 12);
    const pedestalMesh = new THREE.Mesh(pedestalGeom, basinMat);
    pedestalMesh.position.y = 1.7;
    fountainGroup.add(pedestalMesh);

    // Estátua Colossal em Bronze do Arcanjo de Loren
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.82, roughness: 0.28 });
    const archangelTorso = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.6, 8), bronzeMat);
    archangelTorso.position.y = 3.2;
    fountainGroup.add(archangelTorso);

    const archangelHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), bronzeMat);
    archangelHead.position.y = 4.15;
    fountainGroup.add(archangelHead);

    // Espada Sagrada do Arcanjo erguida ao céu
    const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.16), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 }));
    swordBlade.position.set(0.42, 4.4, 0.35);
    fountainGroup.add(swordBlade);

    const swordCrossguard = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.12), bronzeMat);
    swordCrossguard.position.set(0.42, 3.6, 0.35);
    fountainGroup.add(swordCrossguard);

    // Asas imponentes do Arcanjo
    for (let side of [-1, 1]) {
      const wingGeom = new THREE.ConeGeometry(0.24, 2.2, 4);
      const wingMesh = new THREE.Mesh(wingGeom, bronzeMat);
      wingMesh.position.set(side * 0.7, 3.5, -0.3);
      wingMesh.rotation.set(0.35, side * 0.65, 0);
      fountainGroup.add(wingMesh);
    }

    // Halo Dourado Sagrado do Arcanjo (Flutuante e Pulsante)
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });
    const archangelHalo = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.045, 8, 24), haloMat);
    archangelHalo.position.set(0, 4.45, 0);
    archangelHalo.rotation.x = Math.PI / 3;
    fountainGroup.add(archangelHalo);
    animParts.archangelHalo = archangelHalo;

    envGroup.add(fountainGroup);

    // 1.4 O Bazar 3D (Player Personal Stores) com Tendas, Tapetes e Baús
    animParts.bazaarTents = [];
    const tentData = [
      { pos: [-7.2, 0, -4.0], color: 0x6b21a8, name: 'Tenda de Joias & Rúnicos' },
      { pos: [7.2, 0, -4.0], color: 0x1e3a8a, name: 'Tenda de Armaduras Dragon' },
      { pos: [-7.2, 0, 4.5], color: 0x881337, name: 'Tenda de Armas & Lâminas' },
      { pos: [7.2, 0, 4.5], color: 0xb45309, name: 'Tenda de Asas & Poções' },
    ];
    tentData.forEach(({ pos, color }, idx) => {
      const tentGroup = new THREE.Group();
      tentGroup.position.set(pos[0], pos[1], pos[2]);

      // Tapete Estendido no Calçamento
      const rugGeom = new THREE.PlaneGeometry(3.6, 2.8);
      const rugMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
      const rug = new THREE.Mesh(rugGeom, rugMat);
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0, 0.02, 0);
      tentGroup.add(rug);

      // Toldo de Tecido Piramidal da Tenda
      const awningGeom = new THREE.ConeGeometry(2.3, 1.5, 4);
      const awningMat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
      const awningMesh = new THREE.Mesh(awningGeom, awningMat);
      awningMesh.position.y = 2.45;
      awningMesh.rotation.y = Math.PI / 4;
      awningMesh.castShadow = true;
      tentGroup.add(awningMesh);
      animParts.bazaarTents.push(awningMesh);

      // 4 Postes de sustentação de carvalho
      for (let px of [-1.3, 1.3]) {
        for (let pz of [-1.0, 1.0]) {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.0, 6), new THREE.MeshStandardMaterial({ color: 0x3d2817 }));
          pole.position.set(px, 1.0, pz);
          tentGroup.add(pole);
        }
      }

      // Baú de Madeira Reforçado com Ferro
      const chestBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.65), new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.7 }));
      chestBase.position.set(0, 0.28, -0.2);
      tentGroup.add(chestBase);

      const chestLid = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 1.0, 10, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.7 }));
      chestLid.rotation.z = Math.PI / 2;
      chestLid.position.set(0, 0.55, -0.2);
      tentGroup.add(chestLid);

      // Mostruário de armas na lateral
      const weaponRack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.15), new THREE.MeshStandardMaterial({ color: 0x3d2817 }));
      weaponRack.position.set(1.2, 0.45, 0.4);
      weaponRack.rotation.y = 0.3;
      tentGroup.add(weaponRack);

      envGroup.add(tentGroup);
    });

    // 1.5 Taverna da Lareira Dourada (Fachada Sul) com Chaminé e Pórtico
    const tavernGroup = new THREE.Group();
    tavernGroup.position.set(0, 0, 13.5);

    // Paredes de cantaria e vigas de carvalho
    const tavernWalls = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 4.0), basinMat);
    tavernWalls.position.y = 2.75;
    tavernGroup.add(tavernWalls);

    // Vigas aparentes transversais (Timber Framing)
    for (let vx of [-6.0, -2.0, 2.0, 6.0]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.25, 5.5, 0.15), new THREE.MeshStandardMaterial({ color: 0x271a0c }));
      beam.position.set(vx, 2.75, -2.05);
      tavernGroup.add(beam);
    }

    // Telhado de ardósia negra
    const tavernRoof = new THREE.Mesh(new THREE.ConeGeometry(10.2, 2.8, 4), new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 }));
    tavernRoof.position.y = 6.8;
    tavernRoof.rotation.y = Math.PI / 4;
    tavernGroup.add(tavernRoof);

    // Chaminé de alvenaria proeminente
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, 1.2), basinMat);
    chimney.position.set(4.5, 6.8, 0);
    tavernGroup.add(chimney);

    // Janelas ogivais iluminadas a 2100K
    for (let wx of [-4.5, -1.8, 1.8, 4.5]) {
      const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 2.4,
      }));
      winMesh.position.set(wx, 2.8, -2.02);
      tavernGroup.add(winMesh);
    }

    // Pórtico de Entrada com Barris de Carvalho
    const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x271a0c }));
    porticoRoof.position.set(0, 3.2, -2.8);
    tavernGroup.add(porticoRoof);

    for (let px of [-1.6, 1.6]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 3.0, 8), new THREE.MeshStandardMaterial({ color: 0x271a0c }));
      post.position.set(px, 1.5, -3.6);
      tavernGroup.add(post);
    }

    // 2 Barris de Hidromel sob o pórtico
    for (let bx of [-2.4, 2.4]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 1.0, 10), new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 }));
      barrel.position.set(bx, 0.5, -2.8);
      tavernGroup.add(barrel);
    }

    // Puffs de fumaça subindo da chaminé
    animParts.smokePuffs = [];
    for (let sm = 0; sm < 8; sm++) {
      const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.24 + sm * 0.07, 6, 6), new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.45 - sm * 0.04,
      }));
      smoke.position.set(4.5, 8.6 + sm * 0.75, 13.5);
      smoke.userData = { initialY: 8.6, speed: 0.85 + sm * 0.12, idx: sm };
      envGroup.add(smoke);
      animParts.smokePuffs.push(smoke);
    }
    envGroup.add(tavernGroup);

    // 1.6 Muralha Norte Fortificada & Portão do Bastião da Vigília Glacial
    const northWallGroup = new THREE.Group();
    northWallGroup.position.set(0, 0, -13.0);

    const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(26, 5.5, 2.0), basinMat);
    wallMesh.position.y = 2.75;
    wallMesh.castShadow = true;
    northWallGroup.add(wallMesh);

    // Ameias defensivas no topo da muralha
    for (let c = -12; c <= 12; c += 2) {
      const crenel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.6), basinMat);
      crenel.position.set(c, 5.9, 0.8);
      northWallGroup.add(crenel);
    }

    // Duas Torres Cilíndricas Gêmeas
    for (let side of [-1, 1]) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 9.0, 12), basinMat);
      tower.position.set(side * 12.5, 4.5, 0);
      northWallGroup.add(tower);

      const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 3.5, 12), new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 }));
      towerRoof.position.set(side * 12.5, 10.75, 0);
      northWallGroup.add(towerRoof);
    }

    // Portão Ogival Central com Grade de Ferro Levadiça
    const gateFrame = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.35, 8, 16, Math.PI), basinMat);
    gateFrame.position.set(0, 3.2, 0.95);
    northWallGroup.add(gateFrame);

    const portcullis = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.8, 0.25), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.35 }));
    portcullis.position.set(0, 1.9, 0.9);
    northWallGroup.add(portcullis);

    envGroup.add(northWallGroup);

    // 1.7 Cemitério Abandonado das Almas Esquecidas (Sudeste)
    const cemeteryGroup = new THREE.Group();
    cemeteryGroup.position.set(11.0, 0, 7.5);

    // Cerca de ferro forjado enferrujada delimitando a área
    for (let f = -3; f <= 3; f++) {
      const fencePost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8 }));
      fencePost.position.set(f * 0.9, 0.6, -2.5);
      cemeteryGroup.add(fencePost);
    }

    // 6 Lápides góticas em ângulos inclinados
    const gravePositions = [
      [-1.5, 0, -1.0, 0.15],
      [-0.2, 0, -1.2, -0.10],
      [1.2, 0, -0.8, 0.22],
      [-1.0, 0, 1.0, -0.18],
      [0.5, 0, 1.2, 0.12],
      [1.8, 0, 1.4, -0.25],
    ];
    gravePositions.forEach(([gx, gy, gz, rotZ]) => {
      const grave = new THREE.Mesh(new THREE.BoxGeometry(0.40, 1.05, 0.18), basinMat);
      grave.position.set(gx, 0.52, gz);
      grave.rotation.z = rotZ;
      grave.rotation.y = rotZ * 1.5;
      cemeteryGroup.add(grave);
    });

    // Pequeno Mausoléu Gótico com Cripta
    const mausoleum = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 2.6), basinMat);
    mausoleum.position.set(2.8, 1.2, 0);
    cemeteryGroup.add(mausoleum);

    const mausoleumRoof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.4, 4), new THREE.MeshStandardMaterial({ color: 0x1c1917 }));
    mausoleumRoof.position.set(2.8, 3.1, 0);
    mausoleumRoof.rotation.y = Math.PI / 4;
    cemeteryGroup.add(mausoleumRoof);

    // Fogos-Fátuos (Wisps Espectrais) em órbitas tridimensionais
    animParts.wisps = [];
    for (let w = 0; w < 4; w++) {
      const wisp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 4.0,
      }));
      wisp.position.set(w * 0.8, 1.3, (w % 2) * 0.9);
      wisp.userData = { baseX: 11.0 + w * 0.8, baseZ: 7.5 + (w % 2) * 0.9, seed: w * 1.8 };
      envGroup.add(wisp);
      animParts.wisps.push(wisp);
    }
    envGroup.add(cemeteryGroup);

    // 1.8 Oito Tochas Medievais com Chamas Vivas e Luz Cintilante (Flicker)
    animParts.torches = [];
    const torchCoords = [
      [-3.4, 0, 3.4],
      [3.4, 0, 3.4],
      [-3.4, 0, -8.8],
      [3.4, 0, -8.8],
      [-9.0, 0, 0.0],
      [9.0, 0, 0.0],
      [-1.8, 0, 11.2],
      [1.8, 0, 11.2],
    ];
    torchCoords.forEach(([tx, ty, tz]) => {
      const torchGroup = new THREE.Group();
      torchGroup.position.set(tx, ty, tz);

      const postMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.1, 8), new THREE.MeshStandardMaterial({ color: 0x271a0c }));
      postMesh.position.y = 1.05;
      torchGroup.add(postMesh);

      // Gaiola de ferro de suporte
      const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.35, 6), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9 }));
      cage.position.y = 2.1;
      torchGroup.add(cage);

      const flameMesh = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.38, 6), new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 4.0,
      }));
      flameMesh.position.y = 2.3;
      torchGroup.add(flameMesh);

      const torchLight = new THREE.PointLight(0xf59e0b, 2.6, 10.0);
      torchLight.position.set(0, 2.4, 0);
      torchGroup.add(torchLight);

      dynamicLights.push(torchLight);
      animParts.torches.push({ flame: flameMesh, light: torchLight });
      envGroup.add(torchGroup);
    });

    // 1.9 Sistema de Chuva Volumétrica de Lorencia (280 gotas cadentes)
    const rainCount = 280;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let r = 0; r < rainCount; r++) {
      rainPositions[r * 3 + 0] = (Math.random() - 0.5) * 36.0;
      rainPositions[r * 3 + 1] = Math.random() * 12.0;
      rainPositions[r * 3 + 2] = (Math.random() - 0.5) * 36.0;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.085,
      transparent: true,
      opacity: 0.68,
    });
    const rainSystem = new THREE.Points(rainGeo, rainMat);
    envGroup.add(rainSystem);
    animParts.rainSystem = rainSystem;

  } else if (envType === 'NORIA') {
    // ========================================================================
    // 2. NORIA (FEYWOOD): Santuário Arbóreo & Oficina do Gnômico do Caos
    // (Conforme docs/level_design/Noria_Feywood_Level_Design.md)
    // ========================================================================
    // 2.1 Solo de Musgo Aveludado com Relevos de Raízes
    const groundGeom = new THREE.PlaneGeometry(42, 42, 32, 32);
    const mossTex = createProceduralCanvasTexture('MOSSY_WOOD', THREE, 6, 6);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      roughness: 0.85,
      metalness: 0.04,
      map: mossTex,
      bumpMap: mossTex,
      bumpScale: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    envGroup.add(groundMesh);

    // Raízes gigantes sinuosas cruzando a clareira
    for (let r = 0; r < 5; r++) {
      const rootCurve = new THREE.Mesh(new THREE.TorusGeometry(4.5 + r * 1.5, 0.35 - r * 0.04, 8, 24, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x271a0c, roughness: 0.85 }));
      rootCurve.rotation.x = Math.PI / 2;
      rootCurve.rotation.z = (r * 0.9);
      rootCurve.position.set((r % 2 === 0 ? -4 : 4), 0.15, (r * 2.0 - 5.0));
      envGroup.add(rootCurve);
    }

    // 2.2 A OFICINA DO GNÔMICO DO CAOS (Tronco de Sequoia Oca de 40m)
    const chaosGroup = new THREE.Group();
    chaosGroup.position.set(-9.0, 0, 3.5);

    // Casca colossal de sequoia oca
    const sequoiaHollow = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.6, 9.0, 16), new THREE.MeshStandardMaterial({
      color: 0x271a0c,
      roughness: 0.88,
    }));
    sequoiaHollow.position.y = 4.5;
    chaosGroup.add(sequoiaHollow);

    // Entrada em arco ogival aberta
    const entranceArch = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.4, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x3d2817 }));
    entranceArch.position.set(3.8, 2.5, 0);
    entranceArch.rotation.y = Math.PI / 2;
    chaosGroup.add(entranceArch);

    // Roda d'água mecânica na lateral da oficina
    const waterWheel = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.25, 8, 16), new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 }));
    waterWheel.position.set(0, 2.2, 5.2);
    chaosGroup.add(waterWheel);
    animParts.waterWheel = waterWheel;

    // A MÁQUINA DO CAOS (Monólito Forjador de Dasi)
    // Reator Central de Vidro Vulcânico com Plasma Magenta
    const plasmaCoreGeom = new THREE.SphereGeometry(1.3, 16, 16);
    const plasmaCoreMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: 0xd946ef,
      emissiveIntensity: 4.2,
      roughness: 0.08,
    });
    const plasmaCore = new THREE.Mesh(plasmaCoreGeom, plasmaCoreMat);
    plasmaCore.position.set(0, 2.6, 0);
    chaosGroup.add(plasmaCore);
    animParts.chaosCore = plasmaCore;

    const chaosCoreLight = new THREE.PointLight(0xd946ef, 4.0, 14);
    chaosCoreLight.position.set(0, 2.6, 0);
    chaosGroup.add(chaosCoreLight);
    dynamicLights.push(chaosCoreLight);
    animParts.chaosLight = chaosCoreLight;

    // 3 Anéis Giroscópicos de Latão e Ouro girando continuamente
    animParts.chaosRings = [];
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.90, roughness: 0.20 });
    for (let r of [1.6, 1.95, 2.35]) {
      const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 8, 24), brassMat);
      ringMesh.position.set(0, 2.6, 0);
      chaosGroup.add(ringMesh);
      animParts.chaosRings.push(ringMesh);
    }

    // 4 Pistões a Vapor Verticais de Latão em Bombeamento Ativo
    animParts.pistons = [];
    const pistonCoords = [
      [-2.4, 0, -2.4],
      [2.4, 0, -2.4],
      [-2.4, 0, 2.4],
      [2.4, 0, 2.4],
    ];
    pistonCoords.forEach(([px, py, pz], pIdx) => {
      const baseHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.40, 1.3, 8), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 }));
      baseHousing.position.set(px, 0.65, pz);
      chaosGroup.add(baseHousing);

      const pistonRod = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 2.5, 8), brassMat);
      pistonRod.position.set(px, 1.9, pz);
      pistonRod.userData = { initialY: 1.9, pIdx };
      chaosGroup.add(pistonRod);
      animParts.pistons.push(pistonRod);
    });

    // A Bancada de Sacrifício com Entalhes e a Alavanca do Juízo
    const sacrificePlinth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.6), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }));
    sacrificePlinth.position.set(0, 0.4, 3.2);
    chaosGroup.add(sacrificePlinth);

    const chaosLever = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 }));
    chaosLever.position.set(1.1, 1.2, 3.2);
    chaosLever.rotation.z = -0.35;
    chaosGroup.add(chaosLever);

    envGroup.add(chaosGroup);

    // 2.3 ALTAR DA RAINHA ÉLFICA (LÚTHIEN) & FONTE DA ÁGUA DA VIDA (Leste)
    const altarGroup = new THREE.Group();
    altarGroup.position.set(9.0, 0, 3.5);

    // Terraço de Alabastro Lunar
    const altarTerrace = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.8, 16), new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.22,
      metalness: 0.12,
    }));
    altarTerrace.position.y = 0.4;
    altarGroup.add(altarTerrace);

    // Bacia de Cura (Água da Vida Sagrada)
    const healingWater = new THREE.Mesh(new THREE.CircleGeometry(3.0, 24), new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 1.6,
      transparent: true,
      opacity: 0.88,
      roughness: 0.05,
    }));
    healingWater.rotation.x = -Math.PI / 2;
    healingWater.position.y = 0.82;
    altarGroup.add(healingWater);
    animParts.healingWater = healingWater;

    // Estátua de Lúthien em Mármore Lunar com o Arco de Fenrir
    const queenStatue = new THREE.Mesh(new THREE.ConeGeometry(0.50, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
    queenStatue.position.y = 2.1;
    altarGroup.add(queenStatue);

    const queenHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
    queenHead.position.y = 3.35;
    altarGroup.add(queenHead);

    const fenrirBow = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 6, 16), brassMat);
    fenrirBow.rotation.x = Math.PI / 2;
    fenrirBow.position.set(0, 2.8, 0.4);
    altarGroup.add(fenrirBow);

    // 2 Obeliscos com Cristais de Seiva Fossilizada
    for (let ox of [-3.2, 3.2]) {
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
      pylon.position.set(ox, 1.6, -1.8);
      altarGroup.add(pylon);

      const sapCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 3.0,
      }));
      sapCrystal.position.set(ox, 3.4, -1.8);
      altarGroup.add(sapCrystal);
    }
    envGroup.add(altarGroup);

    // 2.4 Árvores-Mãe Élficas Ancestrais com Copas Bioluminescentes
    const treePositions = [
      [-5.2, 0, -7.5],
      [6.2, 0, -7.0],
      [0.0, 0, 12.0],
    ];
    treePositions.forEach(([x, y, z]) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, y, z);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.6, 6.2, 10), new THREE.MeshStandardMaterial({ color: 0x271a0c, roughness: 0.85 }));
      trunk.position.y = 3.1;
      treeGroup.add(trunk);

      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2, 1), new THREE.MeshStandardMaterial({
        color: 0x059669,
        emissive: 0x047857,
        emissiveIntensity: 0.55,
        roughness: 0.38,
      }));
      canopy.position.y = 6.6;
      treeGroup.add(canopy);
      envGroup.add(treeGroup);
    });

    // 2.5 Ponte Suspensa de Raízes e Tábuas de Cedro
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 0.40, 0);
    for (let p = -6; p <= 6; p++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.42), new THREE.MeshStandardMaterial({ color: 0x3d2817 }));
      plank.position.set(0, Math.sin(p * 0.25) * 0.15, p * 0.48);
      bridgeGroup.add(plank);
    }
    envGroup.add(bridgeGroup);

    // 2.6 Cogumelos Gigantes Bioluminescentes (5 Famílias Pulsantes)
    animParts.mushrooms = [];
    const shroomCoords = [
      [-3.0, 0, 1.8, 0x38bdf8],
      [3.2, 0, 1.2, 0x10b981],
      [-2.4, 0, -3.8, 0xa855f7],
      [3.6, 0, -3.2, 0x38bdf8],
      [0.0, 0, -5.5, 0xfbbf24],
    ];
    shroomCoords.forEach(([sx, sy, sz, color]) => {
      const shroomGroup = new THREE.Group();
      shroomGroup.position.set(sx, sy, sz);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.20, 0.95, 8), new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.45 }));
      stem.position.y = 0.475;
      shroomGroup.add(stem);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.42, 12), new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.6,
        roughness: 0.18,
      }));
      cap.position.y = 1.05;
      shroomGroup.add(cap);

      const glowLight = new THREE.PointLight(color, 2.0, 6.0);
      glowLight.position.set(0, 1.2, 0);
      shroomGroup.add(glowLight);

      dynamicLights.push(glowLight);
      animParts.mushrooms.push({ cap, light: glowLight });
      envGroup.add(shroomGroup);
    });

    // 2.7 Nuvem de Esporos Místicos (350 partículas em espiral mágica)
    const sporeCount = 350;
    const sporeGeo = new THREE.BufferGeometry();
    const sporePositions = new Float32Array(sporeCount * 3);
    for (let s = 0; s < sporeCount; s++) {
      sporePositions[s * 3 + 0] = (Math.random() - 0.5) * 28.0;
      sporePositions[s * 3 + 1] = 0.3 + Math.random() * 5.0;
      sporePositions[s * 3 + 2] = (Math.random() - 0.5) * 28.0;
    }
    sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));
    const sporeMat = new THREE.PointsMaterial({
      color: 0x86efac,
      size: 0.075,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
    });
    const sporeSystem = new THREE.Points(sporeGeo, sporeMat);
    envGroup.add(sporeSystem);
    animParts.sporeSystem = sporeSystem;

  } else if (envType === 'DEVIAS') {
    // ========================================================================
    // 3. DEVIAS (BOREAL): Fortaleza Gélida & Grande Braseiro Rei
    // (Conforme docs/level_design/Devias_Boreal_Level_Design.md)
    // ========================================================================
    // 3.1 Manto de Neve Espesso Volumétrico
    const snowGeom = new THREE.PlaneGeometry(42, 42, 32, 32);
    const iceTex = createProceduralCanvasTexture('GLACIAL_ICE', THREE, 8, 8);
    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.40,
      metalness: 0.15,
      map: iceTex,
      bumpMap: iceTex,
      bumpScale: 0.05,
    });
    const snowMesh = new THREE.Mesh(snowGeom, snowMat);
    snowMesh.rotation.x = -Math.PI / 2;
    snowMesh.receiveShadow = true;
    envGroup.add(snowMesh);

    // 3.2 Círculo de Degelo Térmico de 25m (Pedra Molhada e Reflexiva)
    const meltGeom = new THREE.CircleGeometry(5.0, 24);
    const meltMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.10,
      metalness: 0.32,
    });
    const meltMesh = new THREE.Mesh(meltGeom, meltMat);
    meltMesh.rotation.x = -Math.PI / 2;
    meltMesh.position.y = 0.02;
    envGroup.add(meltMesh);

    // 3.3 O GRANDE BRASEIRO REI (The King's Hearth - 12 metros de altura)
    const hearthGroup = new THREE.Group();
    hearthGroup.position.set(0, 0, 0);

    const hearthPedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.5, 1.1, 12), new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
    }));
    hearthPedestal.position.y = 0.55;
    hearthGroup.add(hearthPedestal);

    const hearthBowl = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.4, 12), new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.94,
      roughness: 0.25,
    }));
    hearthBowl.position.y = 1.7;
    hearthBowl.rotation.x = Math.PI;
    hearthGroup.add(hearthBowl);

    // Fogo Sagrado de Dupla Labareda (5.5 de Intensidade Máxima)
    const hearthFlame = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.6, 8), new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 5.5,
    }));
    hearthFlame.position.y = 2.8;
    hearthGroup.add(hearthFlame);

    const hearthInnerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.9, 8), new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 6.2,
    }));
    hearthInnerFlame.position.y = 2.6;
    hearthGroup.add(hearthInnerFlame);

    const hearthLight = new THREE.PointLight(0xf97316, 5.8, 18);
    hearthLight.position.set(0, 3.0, 0);
    hearthGroup.add(hearthLight);
    dynamicLights.push(hearthLight);

    animParts.kingHearth = { flame: hearthFlame, innerFlame: hearthInnerFlame, light: hearthLight };
    envGroup.add(hearthGroup);

    // 3.4 Catedral Gótica do Manto Glacial (Fachada Norte) com Contrafortes
    const cathedralGroup = new THREE.Group();
    cathedralGroup.position.set(0, 0, -12.0);

    const cathedralFacade = new THREE.Mesh(new THREE.BoxGeometry(18, 8.5, 2.8), new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.55,
    }));
    cathedralFacade.position.y = 4.25;
    cathedralGroup.add(cathedralFacade);

    for (let side of [-1, 1]) {
      const buttress = new THREE.Mesh(new THREE.BoxGeometry(2.2, 10.0, 3.4), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      buttress.position.set(side * 9.5, 5.0, 0);
      cathedralGroup.add(buttress);
    }

    // A Grande Rosácea de Gelo (Rose Window) com Luz Safira que Respira
    const roseWindow = new THREE.Mesh(new THREE.CircleGeometry(2.4, 16), new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 3.5,
      roughness: 0.05,
    }));
    roseWindow.position.set(0, 5.8, 1.45);
    cathedralGroup.add(roseWindow);
    animParts.roseWindow = roseWindow;

    const roseLight = new THREE.PointLight(0x38bdf8, 2.8, 9);
    roseLight.position.set(0, 5.8, 2.2);
    cathedralGroup.add(roseLight);
    dynamicLights.push(roseLight);

    envGroup.add(cathedralGroup);

    // 3.5 Oito Cristais Colossais de Gelo Glacial Esculpidos
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
      roughness: 0.05,
      metalness: 0.18,
      transparent: true,
      opacity: 0.88,
    });
    const crystalPositions = [
      [-6.5, 0, -5.2],
      [7.0, 0, -4.5],
      [-7.2, 0, 5.8],
      [6.8, 0, 6.2],
      [-3.5, 0, 8.2],
      [3.5, 0, 8.2],
      [-9.0, 0, 0.0],
      [9.0, 0, 0.0],
    ];
    crystalPositions.forEach(([cx, cy, cz], idx) => {
      const crystalMesh = new THREE.Mesh(new THREE.ConeGeometry(0.62, 3.8, 6), crystalMat);
      crystalMesh.position.set(cx, 1.9, cz);
      crystalMesh.rotation.set(0.14, idx * 0.75, -0.12);
      crystalMesh.castShadow = true;
      envGroup.add(crystalMesh);
    });

    // 3.6 Nevasca Boreal Agressiva (Blizzard: 450 flocos rápidos)
    const snowCount = 450;
    const snowPartGeo = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);
    for (let sn = 0; sn < snowCount; sn++) {
      snowPositions[sn * 3 + 0] = (Math.random() - 0.5) * 36.0;
      snowPositions[sn * 3 + 1] = Math.random() * 10.0;
      snowPositions[sn * 3 + 2] = (Math.random() - 0.5) * 36.0;
    }
    snowPartGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    const blizzardMat = new THREE.PointsMaterial({
      color: 0xf8fafc,
      size: 0.095,
      transparent: true,
      opacity: 0.88,
    });
    const blizzardSystem = new THREE.Points(snowPartGeo, blizzardMat);
    envGroup.add(blizzardSystem);
    animParts.blizzardSystem = blizzardSystem;

  } else if (envType === 'ATLANS') {
    // ========================================================================
    // 4. ATLANS (THALASSA): Ruínas Submersas & Covil da Hydra
    // (Conforme docs/level_design/Atlans_Thalassa_Level_Design.md)
    // ========================================================================
    // 4.1 Leito Oceânico de Areia Perolada
    const sandGeom = new THREE.PlaneGeometry(42, 42, 32, 32);
    const causticTex = createProceduralCanvasTexture('OCEAN_CAUSTICS', THREE, 6, 6);
    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.65,
      metalness: 0.06,
      map: causticTex,
    });
    const sandMesh = new THREE.Mesh(sandGeom, sandMat);
    sandMesh.rotation.x = -Math.PI / 2;
    sandMesh.receiveShadow = true;
    envGroup.add(sandMesh);

    // Manto de Cáusticas Submarinas (Luz Solar Ondulante no Fundo)
    const causticsGeom = new THREE.PlaneGeometry(38, 38, 20, 20);
    const causticsMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.48,
      roughness: 0.1,
    });
    const causticsMesh = new THREE.Mesh(causticsGeom, causticsMat);
    causticsMesh.rotation.x = -Math.PI / 2;
    causticsMesh.position.y = 0.03;
    envGroup.add(causticsMesh);
    animParts.causticsMesh = causticsMesh;

    // 4.2 SANTUÁRIO DE NÁCAR (Safe Zone Subaquática)
    const nacarGroup = new THREE.Group();
    nacarGroup.position.set(0, 0, 0);

    const nacarMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.20,
      roughness: 0.12,
    });
    const nacarPlatform = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.2, 0.70, 16), nacarMat);
    nacarPlatform.position.y = 0.35;
    nacarGroup.add(nacarPlatform);

    // 4 Arcos Parabólicos Hidrodinâmicos de Nácar
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI;
      const archMesh = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.26, 8, 24), nacarMat);
      archMesh.rotation.y = angle;
      archMesh.position.y = 2.5;
      nacarGroup.add(archMesh);
    }

    // Domo de Ar Místico Central com Respiração Hidrostática
    const airDome = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 16), new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.60,
      roughness: 0.05,
    }));
    airDome.position.y = 2.0;
    nacarGroup.add(airDome);
    animParts.airDome = airDome;
    envGroup.add(nacarGroup);

    // 4.3 CEMITÉRIO DOS LEVIATÃS (8 Costelas Ciclópicas e Crânio Fóssil)
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
    for (let r = -4; r <= 3; r++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.22, 6, 16), boneMat);
      rib.position.set(8.5 + (r * 0.8), 1.8, -7.0);
      rib.rotation.set(Math.PI / 2 + 0.2, 0, (r % 2 === 0 ? 0.34 : -0.34));
      envGroup.add(rib);
    }

    // 4.4 TÚNEIS DE CORRENTEZA RÁPIDA (Slipstream Jet Rings)
    animParts.slipstreamRings = [];
    const slipstreamMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 3.4,
      transparent: true,
      opacity: 0.80,
    });
    for (let s = 0; s < 4; s++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.16, 8, 20), slipstreamMat);
      ring.position.set(-7.5, 2.3, -5.5 + (s * 3.6));
      envGroup.add(ring);
      animParts.slipstreamRings.push(ring);
    }

    // 4.5 Recifes de Corais de Gorgônia Luminescentes
    const coralCyanMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.4 });
    const coralRedMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 2.4 });
    const coralCoords = [
      [-4.2, 0, 6.5, coralRedMat],
      [5.0, 0, 6.8, coralCyanMat],
      [-6.0, 0, -9.0, coralCyanMat],
      [7.2, 0, 1.5, coralRedMat],
    ];
    coralCoords.forEach(([cx, cy, cz, mat_c]) => {
      for (let b = 0; b < 5; b++) {
        const branch = new THREE.Mesh(new THREE.ConeGeometry(0.24, 2.1, 5), mat_c);
        branch.position.set(cx + (b * 0.30), 1.05, cz);
        branch.rotation.set((b - 2) * 0.2, 0, (b - 2) * 0.25);
        envGroup.add(branch);
      }
    });

    // 4.6 Fenda Vulcânica Hidrotermal (Black Smoker Vent)
    const ventMesh = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.0, 8), new THREE.MeshStandardMaterial({
      color: 0x18181b,
      emissive: 0xea580c,
      emissiveIntensity: 2.5,
      roughness: 0.9,
    }));
    ventMesh.position.set(0, 1.5, 12.8);
    envGroup.add(ventMesh);

    const ventLight = new THREE.PointLight(0xea580c, 3.5, 9);
    ventLight.position.set(0, 2.8, 12.8);
    envGroup.add(ventLight);
    dynamicLights.push(ventLight);

    // 4.7 Enxame de 80 Bolhas Efervescentes com Subida e Balanço Horizontal
    animParts.bubbles = [];
    for (let b = 0; b < 80; b++) {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.07 + Math.random() * 0.06, 6, 6), new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.74,
      }));
      bubble.position.set((Math.random() - 0.5) * 22.0, Math.random() * 7.5, (Math.random() - 0.5) * 22.0);
      bubble.userData = { speed: 1.1 + Math.random() * 0.9, seed: Math.random() * 10.0 };
      envGroup.add(bubble);
      animParts.bubbles.push(bubble);
    }

  } else if (envType === 'ICARUS') {
    // ========================================================================
    // 5. ICARUS (AETHEL): Arquipélago Celeste & Voo com Asas
    // (Conforme docs/level_design/Icarus_Aethel_Level_Design.md)
    // ========================================================================
    // 5.1 Mar de Nuvens Crepusculares no Vácuo Inferior (Eternal Golden Hour)
    const cloudFloorGeom = new THREE.PlaneGeometry(72, 72, 24, 24);
    const cloudFloorMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x92400e,
      emissiveIntensity: 1.4,
      roughness: 0.9,
      transparent: true,
      opacity: 0.88,
    });
    const cloudFloor = new THREE.Mesh(cloudFloorGeom, cloudFloorMat);
    cloudFloor.rotation.x = -Math.PI / 2;
    cloudFloor.position.y = -9.0;
    envGroup.add(cloudFloor);
    animParts.cloudFloor = cloudFloor;

    // 5.2 ILHA FLUTUANTE CENTRAL (Platô de Ancoragem) - Levitação Harmônica
    const centralIslandGroup = new THREE.Group();
    centralIslandGroup.position.set(0, 0, 0);

    const islandTop = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.8, 0.9, 16), new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
    }));
    islandTop.position.y = 0.45;
    centralIslandGroup.add(islandTop);

    // Cone Rochoso Invertido
    const islandCone = new THREE.Mesh(new THREE.ConeGeometry(6.6, 5.2, 16), new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.8,
    }));
    islandCone.position.y = -2.6;
    islandCone.rotation.x = Math.PI;
    centralIslandGroup.add(islandCone);

    // Monólito de Aetherita Gravitacional no Vértice Inferior
    const aetheriteCore = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 4.5,
      roughness: 0.05,
    }));
    aetheriteCore.position.y = -5.6;
    centralIslandGroup.add(aetheriteCore);
    animParts.aetheriteCore = aetheriteCore;

    const aetheriteLight = new THREE.PointLight(0x38bdf8, 4.8, 15);
    aetheriteLight.position.set(0, -5.6, 0);
    centralIslandGroup.add(aetheriteLight);
    dynamicLights.push(aetheriteLight);

    animParts.centralIsland = centralIslandGroup;
    envGroup.add(centralIslandGroup);

    // 5.3 ILHAS SATÉLITES PERIFÉRICAS (Espinha dos Dragões Celestes)
    const satCoords = [
      [-10.8, 0.8, 0],
      [10.8, 0.8, 0],
      [0, 1.8, 11.5],
    ];
    animParts.satellites = [];
    satCoords.forEach(([sx, sy, sz], idx) => {
      const satGroup = new THREE.Group();
      satGroup.position.set(sx, sy, sz);
      satGroup.userData = { initialY: sy, idx };

      const satTop = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 0.70, 12), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      satTop.position.y = 0.35;
      satGroup.add(satTop);

      const satCone = new THREE.Mesh(new THREE.ConeGeometry(3.6, 3.2, 12), new THREE.MeshStandardMaterial({ color: 0x475569 }));
      satCone.position.y = -1.6;
      satCone.rotation.x = Math.PI;
      satGroup.add(satCone);

      envGroup.add(satGroup);
      animParts.satellites.push(satGroup);
    });

    // 5.4 PONTES DE CRISTAL DE LUZ ARCANA (Light Bridges)
    animParts.lightBridges = [];
    const lightBridgeMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.8,
      transparent: true,
      opacity: 0.74,
      roughness: 0.05,
    });
    for (let bx of [-5.4, 5.4]) {
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.10, 1.4), lightBridgeMat);
      bridge.position.set(bx, 0.7, 0);
      envGroup.add(bridge);
      animParts.lightBridges.push(bridge);
    }

    // 5.5 CORRENTES TÉRMICAS ASCENDENTES (Thermal Uplifts Douradas)
    animParts.upliftRings = [];
    const upliftMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 3.6,
      transparent: true,
      opacity: 0.76,
    });
    for (let u = 0; u < 4; u++) {
      const upRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.10, 6, 16), upliftMat);
      upRing.position.set(0, 0.65 + (u * 1.3), 6.5);
      envGroup.add(upRing);
      animParts.upliftRings.push(upRing);
    }

    // 5.6 O PINÁCULO DA CRIAÇÃO: Ninho de Lótus de Obsidiana do Dark Phoenix
    const phoenixGroup = new THREE.Group();
    phoenixGroup.position.set(0, 2.8, -11.0);

    const nestMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.90,
      roughness: 0.16,
      emissive: 0x7c2d12,
      emissiveIntensity: 1.5,
    });
    const nestBase = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.5, 0.70, 12), nestMat);
    nestBase.position.y = 0.35;
    phoenixGroup.add(nestBase);

    // 8 Pétalas de Lótus de Obsidiana
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.58, 2.6, 4), nestMat);
      petal.position.set(Math.cos(angle) * 3.6, 1.5, Math.sin(angle) * 3.6);
      petal.rotation.set(0.26 * Math.sin(angle), 0, 0.26 * Math.cos(angle));
      phoenixGroup.add(petal);
    }

    // Braseiro Central de Fogo Cósmico
    const phoenixFire = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 12), new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 5.0,
    }));
    phoenixFire.position.y = 1.6;
    phoenixGroup.add(phoenixFire);
    animParts.phoenixFire = phoenixFire;

    const phoenixLight = new THREE.PointLight(0xf59e0b, 4.2, 11);
    phoenixLight.position.set(0, 1.9, 0);
    phoenixGroup.add(phoenixLight);
    dynamicLights.push(phoenixLight);

    envGroup.add(phoenixGroup);

    // 5.7 Poeira Estelar Astral (300 partículas no vácuo de Icarus)
    const starCount = 300;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let st = 0; st < starCount; st++) {
      starPositions[st * 3 + 0] = (Math.random() - 0.5) * 38.0;
      starPositions[st * 3 + 1] = -5.0 + Math.random() * 15.0;
      starPositions[st * 3 + 2] = (Math.random() - 0.5) * 38.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.085,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });
    const starSystem = new THREE.Points(starGeo, starMat);
    envGroup.add(starSystem);
    animParts.starSystem = starSystem;
  }

  // ==========================================================================
  // ANIMADOR DINÂMICO DE CENÁRIOS EM TEMPO REAL (60 FPS - VIVO)
  // Suporta chamadas com (time, dt), (anim, time, dt) ou (elapsed, delta)
  // ==========================================================================
  const updateAnim = (...args) => {
    let time = 0;
    let dt = 0.016;

    if (args.length >= 3) {
      time = typeof args[1] === 'number' ? args[1] : 0;
      dt = typeof args[2] === 'number' ? args[2] : 0.016;
    } else if (args.length === 2) {
      time = typeof args[0] === 'number' ? args[0] : 0;
      dt = typeof args[1] === 'number' ? args[1] : 0.016;
    } else if (args.length === 1) {
      time = typeof args[0] === 'number' ? args[0] : 0;
    }

    // 1. LORENCIA
    if (animParts.torches) {
      animParts.torches.forEach(({ flame, light }, idx) => {
        const flicker = 1.0 + Math.sin(time * 16.0 + idx * 2.3) * 0.18 + Math.cos(time * 31.0 + idx) * 0.08;
        light.intensity = 2.6 * flicker;
        flame.scale.set(flicker, flicker * 1.15, flicker);
      });
    }
    if (animParts.fountainWater) {
      animParts.fountainWater.rotation.z = time * 0.18;
    }
    if (animParts.archangelHalo) {
      const haloPulse = 1.0 + Math.sin(time * 2.5) * 0.15;
      animParts.archangelHalo.scale.setScalar(haloPulse);
      animParts.archangelHalo.rotation.z = time * 0.8;
    }
    if (animParts.wisps) {
      animParts.wisps.forEach((wisp) => {
        const { baseX, baseZ, seed } = wisp.userData;
        wisp.position.x = baseX + Math.sin(time * 1.8 + seed) * 0.45;
        wisp.position.y = 1.2 + Math.cos(time * 2.2 + seed) * 0.35;
        wisp.position.z = baseZ + Math.sin(time * 1.4 + seed * 2.0) * 0.45;
      });
    }
    if (animParts.bazaarTents) {
      animParts.bazaarTents.forEach((tent, idx) => {
        tent.rotation.z = Math.sin(time * 3.0 + idx * 1.5) * 0.04;
      });
    }
    if (animParts.smokePuffs) {
      animParts.smokePuffs.forEach((smoke) => {
        smoke.position.y += smoke.userData.speed * dt;
        smoke.position.x += Math.sin(time * 2.0 + smoke.userData.idx) * 0.01;
        if (smoke.position.y > 12.0) {
          smoke.position.y = smoke.userData.initialY;
          smoke.position.x = 4.5;
        }
      });
    }
    if (animParts.puddles) {
      animParts.puddles.forEach((puddle, idx) => {
        puddle.material.opacity = 0.70 + Math.sin(time * 2.0 + idx) * 0.15;
      });
    }
    if (animParts.rainSystem) {
      const rPos = animParts.rainSystem.geometry.attributes.position.array;
      const count = rPos.length / 3;
      for (let i = 0; i < count; i++) {
        rPos[i * 3 + 1] -= dt * 11.5;
        rPos[i * 3 + 0] -= dt * 1.3;
        if (rPos[i * 3 + 1] < 0.0) {
          rPos[i * 3 + 1] = 12.0;
          rPos[i * 3 + 0] = (Math.random() - 0.5) * 36.0;
        }
      }
      animParts.rainSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 2. NORIA
    if (animParts.chaosRings) {
      animParts.chaosRings.forEach((ring, idx) => {
        ring.rotation.x = time * (0.9 + idx * 0.45);
        ring.rotation.y = time * (0.7 + idx * 0.35);
      });
    }
    if (animParts.chaosCore) {
      const pulse = 1.0 + Math.sin(time * 4.5) * 0.18;
      animParts.chaosCore.scale.set(pulse, pulse, pulse);
      if (animParts.chaosLight) {
        animParts.chaosLight.intensity = 4.0 * pulse;
      }
    }
    if (animParts.pistons) {
      animParts.pistons.forEach((piston) => {
        const { initialY, pIdx } = piston.userData;
        piston.position.y = initialY + Math.sin(time * 5.0 + pIdx * (Math.PI / 2)) * 0.42;
      });
    }
    if (animParts.waterWheel) {
      animParts.waterWheel.rotation.x = time * 1.2;
    }
    if (animParts.mushrooms) {
      animParts.mushrooms.forEach(({ cap, light }, idx) => {
        const pulse = 1.0 + Math.sin(time * 3.2 + idx * 1.3) * 0.28;
        light.intensity = 2.0 * pulse;
        cap.scale.set(pulse, pulse * 1.08, pulse);
      });
    }
    if (animParts.sporeSystem) {
      const sPos = animParts.sporeSystem.geometry.attributes.position.array;
      const count = sPos.length / 3;
      for (let i = 0; i < count; i++) {
        sPos[i * 3 + 1] += Math.sin(time * 1.5 + i) * 0.015;
        sPos[i * 3 + 0] += Math.cos(time * 0.8 + i) * 0.012;
      }
      animParts.sporeSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 3. DEVIAS
    if (animParts.kingHearth) {
      const flicker = 1.0 + Math.sin(time * 18.0) * 0.18 + Math.cos(time * 33.0) * 0.10;
      animParts.kingHearth.light.intensity = 5.8 * flicker;
      animParts.kingHearth.flame.scale.set(flicker, flicker * 1.15, flicker);
      if (animParts.kingHearth.innerFlame) {
        animParts.kingHearth.innerFlame.scale.set(flicker * 1.1, flicker * 1.25, flicker * 1.1);
      }
    }
    if (animParts.roseWindow) {
      const breathe = 1.0 + Math.sin(time * 1.8) * 0.18;
      animParts.roseWindow.material.emissiveIntensity = 3.5 * breathe;
    }
    if (animParts.blizzardSystem) {
      const snPos = animParts.blizzardSystem.geometry.attributes.position.array;
      const count = snPos.length / 3;
      for (let i = 0; i < count; i++) {
        snPos[i * 3 + 0] -= dt * 12.5;
        snPos[i * 3 + 1] -= dt * 1.6;
        snPos[i * 3 + 2] += Math.sin(time * 3.0 + i) * 0.035;
        if (snPos[i * 3 + 0] < -18.0) {
          snPos[i * 3 + 0] = 18.0;
          snPos[i * 3 + 1] = Math.random() * 10.0;
        }
      }
      animParts.blizzardSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 4. ATLANS
    if (animParts.slipstreamRings) {
      animParts.slipstreamRings.forEach((ring, idx) => {
        ring.rotation.z = time * (1.5 + idx * 0.35);
      });
    }
    if (animParts.airDome) {
      animParts.airDome.scale.y = 1.0 + Math.sin(time * 2.2) * 0.08;
    }
    if (animParts.causticsMesh) {
      animParts.causticsMesh.material.opacity = 0.40 + Math.sin(time * 1.6) * 0.15;
    }
    if (animParts.bubbles) {
      animParts.bubbles.forEach((b) => {
        b.position.y += dt * b.userData.speed;
        b.position.x += Math.sin(time * 2.5 + b.userData.seed) * 0.015;
        if (b.position.y > 7.2) {
          b.position.y = 0.2;
          b.position.x = (Math.random() - 0.5) * 22.0;
        }
      });
    }

    // 5. ICARUS
    if (animParts.centralIsland) {
      animParts.centralIsland.position.y = Math.sin(time * 0.85) * 0.25;
    }
    if (animParts.satellites) {
      animParts.satellites.forEach((sat) => {
        const { initialY, idx } = sat.userData;
        sat.position.y = initialY + Math.sin(time * 0.95 + idx * 1.6) * 0.38;
      });
    }
    if (animParts.aetheriteCore) {
      animParts.aetheriteCore.rotation.y = time * 1.35;
      animParts.aetheriteCore.rotation.x = Math.sin(time * 0.7) * 0.22;
    }
    if (animParts.upliftRings) {
      animParts.upliftRings.forEach((ring, idx) => {
        ring.rotation.z = time * (1.6 - idx * 0.25);
        ring.scale.setScalar(1.0 + Math.sin(time * 3.2 + idx) * 0.15);
      });
    }
    if (animParts.phoenixFire) {
      const swirl = 1.0 + Math.sin(time * 5.5) * 0.18;
      animParts.phoenixFire.scale.set(swirl, swirl * 1.25, swirl);
    }
    if (animParts.cloudFloor) {
      animParts.cloudFloor.position.y = -9.0 + Math.sin(time * 0.4) * 0.28;
    }
    if (animParts.starSystem) {
      animParts.starSystem.rotation.y = time * 0.04;
    }
  };

  return {
    group: envGroup,
    dynamicLights,
    animParts,
    updateAnim,
  };
}
