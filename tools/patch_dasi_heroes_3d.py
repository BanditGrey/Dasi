"""
Script de atualização do gerador de heróis 3D em src/client/dev_viewer/dasi3dContent.js
Implementa suporte completo para as 5 Classes Canônicas:
- DK (Dark Knight / Blade Knight)
- DW (Dark Wizard / Soul Master)
- ELF (Fairy Elf / Muse Elf)
- MG (Magic Gladiator / Duel Master)
- DL (Dark Lord / Lord Emperor)
Com carregador GLB oficial do Blender 5.2, geometria procedural de alta fidelidade e animações de combate.
"""

from pathlib import Path

content = Path("src/client/dev_viewer/dasi3dContent.js").read_text(encoding="utf-8")

start_marker = "export function createHero(heroClass"
end_marker = "// ============================================================================\n// 2. GERADOR DE MONSTROS 3D"

# Se o comentário tiver \r\n:
if end_marker not in content:
    end_marker = "// ============================================================================\r\n// 2. GERADOR DE MONSTROS 3D"

start_pos = content.find(start_marker)
end_pos = content.find(end_marker)

if start_pos == -1 or end_pos == -1:
    print(f"Erro: marcadores não encontrados! start_pos={start_pos}, end_pos={end_pos}")
    exit(1)

hero_code = '''export function createHero(heroClass, options = {}, THREE) {
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

  // Armadura Principal (reativa ao slider de refinamento)
  let mainArmorColor = PALETTES.dragonCrimson;
  let metalnessVal = 0.88;
  let roughnessVal = 0.22;

  if (setTier === 'PHOENIX') {
    mainArmorColor = PALETTES.phoenixDark;
    metalnessVal = 0.90;
    roughnessVal = 0.15;
  } else if (setTier === 'GRAND_SOUL' || heroClass === 'DW') {
    mainArmorColor = PALETTES.arcaneSapphire;
    metalnessVal = 0.40;
    roughnessVal = 0.35;
  } else if (setTier === 'SPIRIT' || heroClass === 'ELF') {
    mainArmorColor = PALETTES.elfEmerald;
    metalnessVal = 0.55;
    roughnessVal = 0.30;
  } else if (setTier === 'HURRICANE' || heroClass === 'MG') {
    mainArmorColor = 0x111827; // Obsidiana Escura
    metalnessVal = 0.92;
    roughnessVal = 0.18;
  } else if (setTier === 'DARK_MASTER' || setTier === 'DARK_STEEL' || heroClass === 'DL') {
    mainArmorColor = 0x0f172a; // Aço Imperial Preto com Ouro
    metalnessVal = 0.95;
    roughnessVal = 0.16;
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
    });
  }

  // --------------------------------------------------------------------------
  // RIG & ANIMADOR CINEMÁTICO PROCEDURAL POR CLASSE
  // --------------------------------------------------------------------------
  const updateAnim = (animName, time, delta) => {
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
'''

new_content = content[:start_pos] + hero_code + "\n\n" + content[end_pos:]
Path("src/client/dev_viewer/dasi3dContent.js").write_text(new_content, encoding="utf-8")
print("[OK] dasi3dContent.js atualizado com sucesso com as 5 classes!")
