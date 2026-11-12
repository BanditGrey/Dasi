/**
 * DASI MMORPG - CANONICAL 3D ASSET BUILDER & EXPORTER
 * Exporta GLBs de alta qualidade PBR para:
 * 1. 10 NPCs Canônicos de Lorencia, Noria, Devias e Blood Castle
 * 2. 10 Montarias & Pets Oficiais (Dark Horse, Fenrir, Dinorant, Uniria, Dark Raven, Imp, Anjo, Panda)
 * 3. 5 Asas & Capas Lendárias Nível 2 e Nível 3
 */

import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';

// Mock de FileReader para Node.js
class NodeFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = value;
      this.onloadend?.();
    }).catch((err) => this.onerror?.(err));
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`;
      this.onloadend?.();
    }).catch((err) => this.onerror?.(err));
  }
}
globalThis.FileReader = NodeFileReader;

const exporter = new GLTFExporter();

async function exportGlb(filePath, object3D) {
  const glbBuffer = await exporter.parseAsync(object3D, { binary: true });
  await writeFile(filePath, Buffer.from(glbBuffer));
  console.log(`[GLB Export] Sucesso: ${filePath} (${glbBuffer.byteLength} bytes)`);
}

// ============================================================================
// CONSTRUTORES DE 10 NPCS CANÔNICOS
// ============================================================================

function createBlacksmithHanzo() {
  const root = new THREE.Group();
  root.name = 'NPC_HANZO_THE_BLACKSMITH';

  const apronMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
  const hotIronMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8, roughness: 0.4 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });

  // Corpo / Avental de Ferreiro
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.9, 12), apronMat);
  torso.position.y = 1.05;
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), skinMat);
  head.position.y = 1.62;
  root.add(head);

  // Bigode e bandana de ferreiro
  const bandana = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xb91c1c }));
  bandana.position.y = 1.72;
  root.add(bandana);

  // Pernas com calças de couro
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.7, 8), woodMat);
  legL.position.set(-0.18, 0.35, 0);
  const legR = legL.clone();
  legR.position.x = 0.18;
  root.add(legL, legR);

  // Braço esquerdo segurando tenaz
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.6, 8), skinMat);
  armL.position.set(-0.45, 1.05, 0.15);
  armL.rotation.x = Math.PI / 4;
  root.add(armL);

  // Braço direito com martelo de forja levantado
  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.6, 8), skinMat);
  armR.position.set(0.45, 1.25, 0.1);
  armR.rotation.x = -Math.PI / 3;
  root.add(armR);

  const hammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), woodMat);
  hammerHandle.position.set(0.5, 1.5, 0.3);
  hammerHandle.rotation.x = -Math.PI / 3;
  const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.32), ironMat);
  hammerHead.position.set(0.5, 1.75, 0.45);
  root.add(hammerHandle, hammerHead);

  // Bigorna de Ferro Fundido
  const anvilBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.45, 12), ironMat);
  anvilBase.position.set(0, 0.22, 0.65);
  const anvilTop = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.9), ironMat);
  anvilTop.position.set(0, 0.52, 0.65);
  const anvilHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 8), ironMat);
  anvilHorn.position.set(0, 0.52, 1.15);
  anvilHorn.rotation.x = Math.PI / 2;
  root.add(anvilBase, anvilTop, anvilHorn);

  // Barra de Ferro em Brasa sobre a bigorna
  const hotBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.45), hotIronMat);
  hotBar.position.set(0, 0.65, 0.65);
  root.add(hotBar);

  return root;
}

function createPharmacistPupa() {
  const root = new THREE.Group();
  root.name = 'NPC_PUPA_THE_PHARMACIST';

  const robeMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.65 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.5 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.3 });
  const potionMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.7, transparent: true, opacity: 0.85 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x573a1e, roughness: 0.8 });

  // Túnica esmeralda graciosa
  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.3, 12), robeMat);
  dress.position.y = 0.65;
  root.add(dress);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.5, 10), robeMat);
  torso.position.y = 1.35;
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), skinMat);
  head.position.y = 1.65;
  root.add(head);

  // Chapéu cônico de boticária
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 12), robeMat);
  hatBrim.position.y = 1.76;
  const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 10), robeMat);
  hatCone.position.set(0, 2.0, -0.05);
  hatCone.rotation.x = -0.15;
  root.add(hatBrim, hatCone);

  // Caldeirão de Cobre com Poção Borbulhante
  const cauldron = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12, 0, Math.PI * 2, Math.PI / 4, Math.PI * 0.75), copperMat);
  cauldron.position.set(0.6, 0.35, 0.3);
  const potionLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 12), potionMat);
  potionLiquid.position.set(0.6, 0.5, 0.3);
  root.add(cauldron, potionLiquid);

  // Mesa com Frascos de Poções
  const table = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.4), woodMat);
  table.position.set(-0.6, 0.3, 0.2);
  const redFlask = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.6 }));
  redFlask.position.set(-0.7, 0.68, 0.2);
  const blueFlask = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.6 }));
  blueFlask.position.set(-0.55, 0.68, 0.2);
  root.add(table, redFlask, blueFlask);

  return root;
}

function createSentinelGuard() {
  const root = new THREE.Group();
  root.name = 'NPC_SENTINEL_GUARD';

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.3 });
  const blueCapeMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 });

  // Armadura Completa de Placas
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.85, 10), steelMat);
  torso.position.y = 1.25;
  root.add(torso);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 10), goldTrimMat);
  belt.position.y = 0.85;
  root.add(belt);

  // Elmo de Guarda Imperial
  const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.35, 10), steelMat);
  helm.position.y = 1.75;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.15), goldTrimMat);
  visor.position.set(0, 1.76, 0.14);
  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.35), new THREE.MeshStandardMaterial({ color: 0xb91c1c }));
  crest.position.set(0, 1.95, 0);
  root.add(helm, visor, crest);

  // Pernas
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.8, 8), steelMat);
  legL.position.set(-0.18, 0.4, 0);
  const legR = legL.clone();
  legR.position.x = 0.18;
  root.add(legL, legR);

  // Capa Real Azul
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.1), blueCapeMat);
  cape.position.set(0, 1.1, -0.25);
  cape.rotation.x = 0.15;
  root.add(cape);

  // Lança Longa / Alabarda Imperial
  const spearShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
  spearShaft.position.set(0.55, 1.4, 0.15);
  const spearBlade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 4), steelMat);
  spearBlade.position.set(0.55, 2.9, 0.15);
  root.add(spearShaft, spearBlade);

  // Escudo Imperial
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.08), steelMat);
  shield.position.set(-0.45, 1.1, 0.25);
  const shieldEmblem = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.1), goldTrimMat);
  shieldEmblem.position.set(-0.45, 1.1, 0.26);
  root.add(shield, shieldEmblem);

  return root;
}

function createChaosGoblin() {
  const root = new THREE.Group();
  root.name = 'NPC_CHAOS_GOBLIN';

  const skinMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 });
  const chaosCoreMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.85, roughness: 0.2 });

  // Corpo Pequeno e Encurvado do Goblin
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), leatherMat);
  torso.position.set(0, 0.65, 0);
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 10), skinMat);
  head.position.set(0, 0.95, 0.1);
  root.add(head);

  // Orelhas Pontudas Longas de Goblin
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.35, 6), skinMat);
  earL.position.set(-0.28, 1.0, 0);
  earL.rotation.z = Math.PI / 3;
  const earR = earL.clone();
  earR.position.x = 0.28;
  earR.rotation.z = -Math.PI / 3;
  root.add(earL, earR);

  // Óculos de Engenharia do Caos
  const goggleL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8), brassMat);
  goggleL.position.set(-0.1, 0.98, 0.3);
  goggleL.rotation.x = Math.PI / 2;
  const goggleR = goggleL.clone();
  goggleR.position.x = 0.1;
  root.add(goggleL, goggleR);

  // Máquina do Caos (Pedestal Tecnológico de Noria)
  const altarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.45, 12), brassMat);
  altarBase.position.set(0, 0.22, 0.65);
  const gearRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.07, 8, 16), brassMat);
  gearRing.position.set(0, 0.46, 0.65);
  gearRing.rotation.x = Math.PI / 2;

  // Núcleo Arcano de Fusão do Caos
  const chaosCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), chaosCoreMat);
  chaosCore.position.set(0, 0.7, 0.65);
  root.add(altarBase, gearRing, chaosCore);

  return root;
}

function createPriestessSebina() {
  const root = new THREE.Group();
  root.name = 'NPC_SEBINA_THE_PRIEST';

  const whiteRobeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.25 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
  const holyAuraMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.8, transparent: true, opacity: 0.8 });

  // Túnica Cerimonial Branca e Dourada
  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.45, 12), whiteRobeMat);
  dress.position.y = 0.72;
  root.add(dress);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.55, 10), whiteRobeMat);
  torso.position.y = 1.45;
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), skinMat);
  head.position.y = 1.78;
  root.add(head);

  // Manto com Capuz Cerimonial
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), whiteRobeMat);
  hood.position.y = 1.82;
  root.add(hood);

  // Auréola Sagrada Flutuante
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 8, 24), holyAuraMat);
  halo.position.set(0, 2.05, -0.05);
  halo.rotation.x = Math.PI / 4;
  root.add(halo);

  // Cetro Sagrado com Cruz Solar
  const staffShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.1, 8), goldTrimMat);
  staffShaft.position.set(0.45, 1.05, 0.2);
  const sunCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.05), goldTrimMat);
  sunCrossV.position.set(0.45, 2.15, 0.2);
  const sunCrossH = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.05), goldTrimMat);
  sunCrossH.position.set(0.45, 2.2, 0.2);
  root.add(staffShaft, sunCrossV, sunCrossH);

  return root;
}

function createBarmaidLumen() {
  const root = new THREE.Group();
  root.name = 'NPC_LUMEN_THE_BARMAID';

  const dressMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
  const corsetMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.5 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x573a1e, roughness: 0.85 });
  const beerMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.5, transparent: true, opacity: 0.85 });

  // Vestido de Taverneira Carmesim
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.25, 12), dressMat);
  skirt.position.y = 0.62;
  root.add(skirt);

  const corset = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.45, 10), corsetMat);
  corset.position.y = 1.3;
  root.add(corset);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), skinMat);
  head.position.y = 1.68;
  root.add(head);

  // Cabelo trançado castanho
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), corsetMat);
  hair.position.y = 1.72;
  root.add(hair);

  // Balcão de Carvalho da Taverna
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.45), woodMat);
  bar.position.set(0, 0.45, 0.5);
  root.add(bar);

  // Canecas de Cerveja de Lorencia com Espuma
  const mugL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8), woodMat);
  mugL.position.set(-0.25, 0.98, 0.5);
  const foamL = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.04, 8), beerMat);
  foamL.position.set(-0.25, 1.08, 0.5);
  const mugR = mugL.clone();
  mugR.position.x = 0.25;
  const foamR = foamL.clone();
  foamR.position.x = 0.25;
  root.add(mugL, foamL, mugR, foamR);

  return root;
}

function createCraftswomanLala() {
  const root = new THREE.Group();
  root.name = 'NPC_ELF_LALA';

  const tunicMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
  const bowWoodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.75 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.3 });

  // Túnica Élfica Verde Floresta
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.25, 12), tunicMat);
  skirt.position.y = 0.62;
  root.add(skirt);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.5, 10), tunicMat);
  torso.position.y = 1.32;
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), skinMat);
  head.position.y = 1.68;
  root.add(head);

  // Orelhas Élficas Longas
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 6), skinMat);
  earL.position.set(-0.2, 1.72, -0.05);
  earL.rotation.z = Math.PI / 3;
  const earR = earL.clone();
  earR.position.x = 0.2;
  earR.rotation.z = -Math.PI / 3;
  root.add(earL, earR);

  // Bancada com Arco e Aljava de Flechas
  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.4), bowWoodMat);
  bench.position.set(0.55, 0.35, 0.3);
  const bowStave = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 6, 16, Math.PI), bowWoodMat);
  bowStave.position.set(0.55, 0.75, 0.3);
  bowStave.rotation.x = Math.PI / 2;
  const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.5, 8), tunicMat);
  quiver.position.set(-0.45, 0.75, 0.2);
  quiver.rotation.z = 0.2;
  root.add(bench, bowStave, quiver);

  return root;
}

function createJewelerLahap() {
  const root = new THREE.Group();
  root.name = 'NPC_LAHAP_THE_JEWELER';

  const velvetMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
  const blessMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.85 });
  const soulMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xbe123c, emissiveIntensity: 0.85 });

  // Túnica de Seda Roxa Imperial
  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.4, 12), velvetMat);
  robe.position.y = 0.7;
  root.add(robe);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfed7aa }));
  head.position.y = 1.62;
  root.add(head);

  // Turbante com Gema Central
  const turban = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.09, 8, 16), velvetMat);
  turban.position.y = 1.74;
  turban.rotation.x = Math.PI / 2;
  const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), blessMat);
  jewel.position.set(0, 1.76, 0.25);
  root.add(turban, jewel);

  // Mesa com Bandeja de Joias de Bless e Soul
  const table = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.75, 0.5), goldMat);
  table.position.set(0, 0.38, 0.55);
  const jewelBless = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), blessMat);
  jewelBless.position.set(-0.2, 0.85, 0.55);
  const jewelSoul = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), soulMat);
  jewelSoul.position.set(0.2, 0.85, 0.55);
  root.add(table, jewelBless, jewelSoul);

  return root;
}

function createShadowPhantom() {
  const root = new THREE.Group();
  root.name = 'NPC_SHADOW_PHANTOM_SOLDIER';

  const ghostMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0369a1,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.75,
    roughness: 0.3,
  });

  // Soldado Espectral Translúcido
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.85, 10), ghostMat);
  torso.position.y = 1.25;
  root.add(torso);

  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), ghostMat);
  helm.position.y = 1.78;
  root.add(helm);

  // Espada Espectral fincada no chão
  const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 0.04), ghostMat);
  swordBlade.position.set(0, 0.65, 0.45);
  const swordGuard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.08), ghostMat);
  swordGuard.position.set(0, 1.25, 0.45);
  root.add(swordBlade, swordGuard);

  // Círculo Mágico de Bênção (Buff Aura)
  const buffRing = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.95, 24), ghostMat);
  buffRing.rotation.x = -Math.PI / 2;
  buffRing.position.y = 0.02;
  root.add(buffRing);

  return root;
}

function createCharonBoatman() {
  const root = new THREE.Group();
  root.name = 'NPC_CHARON_THE_BOATMAN';

  const cloakMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.9 });
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
  const redGlowMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.9 });

  // Manto Sombrio do Guardião do Blood Castle
  const mantle = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.5, 12), cloakMat);
  mantle.position.y = 0.75;
  root.add(mantle);

  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.7), cloakMat);
  hood.position.y = 1.72;
  root.add(hood);

  // Olhos vermelhos brilhantes sob as trevas do capuz
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), redGlowMat);
  eyeL.position.set(-0.08, 1.68, 0.16);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.08;
  root.add(eyeL, eyeR);

  // Cajado do Barqueiro com Lanterna Carmesim
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), boneMat);
  staff.position.set(0.5, 1.2, 0.2);
  const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), redGlowMat);
  lantern.position.set(0.5, 2.25, 0.3);
  root.add(staff, lantern);

  return root;
}

// ============================================================================
// CONSTRUTORES DE 10 MONTARIAS & PETS CANÔNICOS
// ============================================================================

function createDarkHorseMount() {
  const root = new THREE.Group();
  root.name = 'MOUNT_DARK_HORSE';

  const blackCoatMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });
  const goldArmorMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
  const flameHoofMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xd97706, emissiveIntensity: 0.95 });

  // Tronco Muscular do Cavalo
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 1.8, 12), blackCoatMat);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 1.25, 0);
  root.add(body);

  // Barda Dourada de Proteção
  const armorPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.63, 0.9, 12), goldArmorMat);
  armorPlate.rotation.x = Math.PI / 2;
  armorPlate.position.set(0, 1.28, 0.1);
  root.add(armorPlate);

  // Pescoço e Cabeça Arqueada
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.95, 10), blackCoatMat);
  neck.position.set(0, 1.8, 0.75);
  neck.rotation.x = -Math.PI / 4;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.75), blackCoatMat);
  head.position.set(0, 2.15, 1.15);
  root.add(neck, head);

  // Elmo de Batalha com Chifre Dourado
  const horseHelm = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.5), goldArmorMat);
  horseHelm.position.set(0, 2.25, 1.15);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 6), goldArmorMat);
  horn.position.set(0, 2.5, 1.3);
  horn.rotation.x = Math.PI / 4;
  root.add(horseHelm, horn);

  // 4 Pernas com Cascos Flamejantes
  const legPositions = [
    [-0.35, 0.55, 0.65],
    [0.35, 0.55, 0.65],
    [-0.35, 0.55, -0.65],
    [0.35, 0.55, -0.65],
  ];
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 1.1, 8), blackCoatMat);
    leg.position.set(x, y, z);
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.2, 8), flameHoofMat);
    hoof.position.set(x, 0.1, z);
    root.add(leg, hoof);
  });

  return root;
}

function createFenrirMount(variant = 'RED') {
  const root = new THREE.Group();
  root.name = `MOUNT_FENRIR_${variant}`;

  const colors = {
    RED: { body: 0x991b1b, armor: 0xef4444, glow: 0xf97316 },
    BLUE: { body: 0x1e3a8a, armor: 0x38bdf8, glow: 0x67e8f9 },
    BLACK: { body: 0x18181b, armor: 0x3f3f46, glow: 0xa855f7 },
    GOLDEN: { body: 0xb45309, armor: 0xf59e0b, glow: 0xfef08a },
  }[variant] || { body: 0x991b1b, armor: 0xef4444, glow: 0xf97316 };

  const wolfMat = new THREE.MeshStandardMaterial({ color: colors.body, roughness: 0.5 });
  const armorMat = new THREE.MeshStandardMaterial({ color: colors.armor, metalness: 0.85, roughness: 0.25 });
  const coreMat = new THREE.MeshStandardMaterial({ color: colors.glow, emissive: colors.glow, emissiveIntensity: 0.9 });

  // Tronco Muscular do Lobo
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 1.9, 12), wolfMat);
  torso.rotation.x = Math.PI / 2;
  torso.position.set(0, 1.1, 0);
  root.add(torso);

  // Armadura Dorsal com Espinhos
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.9), armorMat);
  saddle.position.set(0, 1.45, 0);
  const dorsalSpike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.45, 4), armorMat);
  dorsalSpike.position.set(0, 1.7, 0);
  root.add(saddle, dorsalSpike);

  // Cabeça Feroz de Lobo com Mandíbulas
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.85, 8), wolfMat);
  head.rotation.x = -Math.PI / 2;
  head.position.set(0, 1.45, 1.25);
  root.add(head);

  // Chifre Bladado Frontal do Fenrir
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.55, 4), armorMat);
  horn.position.set(0, 1.8, 1.35);
  horn.rotation.x = Math.PI / 5;
  root.add(horn);

  // Núcleo de Energia no Peito
  const chestCore = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), coreMat);
  chestCore.position.set(0, 1.1, 0.95);
  root.add(chestCore);

  // 4 Patas Blindadas
  const paws = [
    [-0.45, 0.5, 0.7],
    [0.45, 0.5, 0.7],
    [-0.45, 0.5, -0.7],
    [0.45, 0.5, -0.7],
  ];
  paws.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 1.0, 8), wolfMat);
    leg.position.set(x, y, z);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 0.22), armorMat);
    guard.position.set(x, y + 0.1, z);
    root.add(leg, guard);
  });

  return root;
}

function createDinorantMount() {
  const root = new THREE.Group();
  root.name = 'MOUNT_DINORANT';

  const scaleMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.6 });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xa16207, emissiveIntensity: 0.5, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  const saddleMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });

  // Corpo de Réptil Alado
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 1.7, 10), scaleMat);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 1.05, 0);
  root.add(body);

  // Cabeça Dracônica
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.75, 6), scaleMat);
  head.rotation.x = -Math.PI / 2;
  head.position.set(0, 1.35, 1.1);
  root.add(head);

  // Asas de Dinorant
  const wingL = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), wingMat);
  wingL.position.set(-0.8, 1.4, 0);
  wingL.rotation.y = 0.3;
  const wingR = wingL.clone();
  wingR.position.x = 0.8;
  wingR.rotation.y = -0.3;
  root.add(wingL, wingR);

  // Cauda Longa
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.2, 8), scaleMat);
  tail.rotation.x = Math.PI / 2.3;
  tail.position.set(0, 0.8, -1.25);
  root.add(tail);

  // Sela de Montaria
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.15, 0.7), saddleMat);
  saddle.position.set(0, 1.35, 0);
  root.add(saddle);

  return root;
}

function createUniriaMount() {
  const root = new THREE.Group();
  root.name = 'MOUNT_UNIRIA';

  const coatMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.8, metalness: 0.5 });
  const maneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });

  // Corpo Elegante do Unicórnio
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 1.6, 12), coatMat);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 1.15, 0);
  root.add(body);

  // Cabeça e Pescoço Nobre
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.35, 0.85, 10), coatMat);
  neck.position.set(0, 1.65, 0.65);
  neck.rotation.x = -Math.PI / 4;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.65), coatMat);
  head.position.set(0, 1.95, 1.0);
  root.add(neck, head);

  // Chifre Espiral Luminoso
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.6, 8), hornMat);
  horn.position.set(0, 2.25, 1.15);
  horn.rotation.x = Math.PI / 4;
  root.add(horn);

  // Crina Branca
  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.4), maneMat);
  mane.position.set(0, 1.7, 0.45);
  mane.rotation.x = -Math.PI / 4;
  root.add(mane);

  return root;
}

function createDarkRavenPet() {
  const root = new THREE.Group();
  root.name = 'PET_DARK_RAVEN';

  const featherMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.9 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 });

  // Corpo Aerodinâmico do Corvo de Batalha
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 8), featherMat);
  body.rotation.x = Math.PI / 2.5;
  body.position.set(0, 1.4, 0);
  root.add(body);

  // Cabeça e Bico Afiado
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), featherMat);
  head.position.set(0, 1.55, 0.35);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), beakMat);
  beak.rotation.x = -Math.PI / 2;
  beak.position.set(0, 1.52, 0.52);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), eyeMat);
  eyeL.position.set(-0.08, 1.58, 0.4);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.08;
  root.add(head, beak, eyeL, eyeR);

  // Grandes Asas Abertas em Voo
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.4), featherMat);
  wingL.position.set(-0.55, 1.5, 0);
  wingL.rotation.z = -0.2;
  const wingR = wingL.clone();
  wingR.position.x = 0.55;
  wingR.rotation.z = 0.2;
  root.add(wingL, wingR);

  return root;
}

function createImpPet() {
  const root = new THREE.Group();
  root.name = 'PET_IMP_SATAN';

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
  const tridentMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.3 });

  // Corpo Pequeno de Diabrete Flutuante
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), skinMat);
  body.position.set(0, 1.2, 0);
  root.add(body);

  // Cabeça com Chifrinhos
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), skinMat);
  head.position.set(0, 1.45, 0);
  const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 6), hornMat);
  hornL.position.set(-0.09, 1.62, 0);
  hornL.rotation.z = -0.3;
  const hornR = hornL.clone();
  hornR.position.x = 0.09;
  hornR.rotation.z = 0.3;
  root.add(head, hornL, hornR);

  // Asinhas de Morcego
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, side: THREE.DoubleSide });
  const wingL = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.3), wingMat);
  wingL.position.set(-0.28, 1.35, -0.15);
  wingL.rotation.y = 0.3;
  const wingR = wingL.clone();
  wingR.position.x = 0.28;
  wingR.rotation.y = -0.3;
  root.add(wingL, wingR);

  // Mini Tridente de Satã
  const trident = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), tridentMat);
  trident.position.set(0.25, 1.1, 0.2);
  const tridentHead = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.03), tridentMat);
  tridentHead.position.set(0.25, 1.5, 0.2);
  root.add(trident, tridentHead);

  return root;
}

function createGuardianAngelPet() {
  const root = new THREE.Group();
  root.name = 'PET_GUARDIAN_ANGEL';

  const robeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const haloMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.85 });

  // Pequeno Anjinho Flutuante
  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 10), robeMat);
  dress.position.set(0, 1.1, 0);
  root.add(dress);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
  head.position.set(0, 1.48, 0);
  root.add(head);

  // Auréola Dourada
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 16), haloMat);
  halo.position.set(0, 1.65, 0);
  halo.rotation.x = Math.PI / 2;
  root.add(halo);

  // Asas de Penas Brancas
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.03), wingMat);
  wingL.position.set(-0.3, 1.35, -0.1);
  wingL.rotation.z = -0.3;
  const wingR = wingL.clone();
  wingR.position.x = 0.3;
  wingR.rotation.z = 0.3;
  root.add(wingL, wingR);

  return root;
}

// ============================================================================
// CONSTRUTORES DE 5 ASAS & CAPAS CANÔNICAS
// ============================================================================

function createWingsOfDragon() {
  const root = new THREE.Group();
  root.name = 'WINGS_OF_DRAGON_LEVEL2';

  const boneMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 });
  const membraneMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.75,
    roughness: 0.3,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });

  // Espinha Central e Fecho Dorsal
  const centerBrooch = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), goldMat);
  centerBrooch.rotation.x = Math.PI / 2;
  centerBrooch.position.set(0, 1.25, 0);
  const gemCenter = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshStandardMaterial({ color: 0xb91c1c, emissive: 0xef4444, emissiveIntensity: 0.9 }));
  gemCenter.position.set(0, 1.25, 0.06);
  root.add(centerBrooch, gemCenter);

  // Ossatura Articulada do Dragão Esquerda
  const boneL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 10), boneMat);
  boneL.position.set(-0.85, 1.25, 0);
  boneL.rotation.z = Math.PI / 3;
  const spurL = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.45, 8), boneMat);
  spurL.position.set(-1.65, 1.75, 0);
  spurL.rotation.z = Math.PI / 4;
  const subBoneL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8), boneMat);
  subBoneL.position.set(-1.1, 0.85, 0);
  subBoneL.rotation.z = Math.PI / 5;

  const membL = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2, 8, 8), membraneMat);
  membL.position.set(-0.9, 0.85, 0);
  membL.rotation.y = 0.25;

  // Asa Direita
  const boneR = boneL.clone();
  boneR.position.x = 0.85;
  boneR.rotation.z = -Math.PI / 3;
  const spurR = spurL.clone();
  spurR.position.x = 1.65;
  spurR.rotation.z = -Math.PI / 4;
  const subBoneR = subBoneL.clone();
  subBoneR.position.x = 1.1;
  subBoneR.rotation.z = -Math.PI / 5;

  const membR = membL.clone();
  membR.position.x = 0.9;
  membR.rotation.y = -0.25;

  root.add(boneL, spurL, subBoneL, membL, boneR, spurR, subBoneR, membR);
  return root;
}

function createWingsOfSoul() {
  const root = new THREE.Group();
  root.name = 'WINGS_OF_SOUL_LEVEL2';

  const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  const soulMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.85,
    roughness: 0.2,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });
  const runeMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, emissive: 0x38bdf8, emissiveIntensity: 0.9, wireframe: true });

  // Estrutura Arcana de Cristal e Círculo Rúnico Dorsal
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.08), silverMat);
  spine.position.set(0, 1.1, 0);
  const runeCircle = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 24), runeMat);
  runeCircle.position.set(0, 1.15, -0.05);

  // Asas Superiores
  const wingTopL = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2, 8, 8), soulMat);
  wingTopL.position.set(-0.85, 1.35, 0);
  wingTopL.rotation.y = 0.2;
  const wingTopR = wingTopL.clone();
  wingTopR.position.x = 0.85;
  wingTopR.rotation.y = -0.2;

  // Asas Inferiores (Butterfly Arcane)
  const wingBotL = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9, 6, 6), soulMat);
  wingBotL.position.set(-0.65, 0.65, 0);
  wingBotL.rotation.y = 0.15;
  const wingBotR = wingBotL.clone();
  wingBotR.position.x = 0.65;
  wingBotR.rotation.y = -0.15;

  root.add(spine, runeCircle, wingTopL, wingTopR, wingBotL, wingBotR);
  return root;
}

function createWingsOfSpirits() {
  const root = new THREE.Group();
  root.name = 'WINGS_OF_SPIRITS_LEVEL2';

  const vineMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 });
  const faeMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.8,
    roughness: 0.25,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.6, side: THREE.DoubleSide });

  // Broche de Folhas e Flores
  const brooch = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), vineMat);
  brooch.position.set(0, 1.2, 0);

  // Par Superior de Asas Feéricas
  const wingTopL = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.3, 8, 8), faeMat);
  wingTopL.position.set(-0.9, 1.35, 0);
  wingTopL.rotation.y = 0.25;
  const wingTopR = wingTopL.clone();
  wingTopR.position.x = 0.9;
  wingTopR.rotation.y = -0.25;

  // Par Inferior de Asas Feéricas
  const wingBotL = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9, 6, 6), leafMat);
  wingBotL.position.set(-0.7, 0.65, 0);
  wingBotL.rotation.y = 0.2;
  const wingBotR = wingBotL.clone();
  wingBotR.position.x = 0.7;
  wingBotR.rotation.y = -0.2;

  // Nervuras de Vinha
  const vineL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 8), vineMat);
  vineL.position.set(-0.85, 1.35, 0.02);
  vineL.rotation.z = Math.PI / 3.2;
  const vineR = vineL.clone();
  vineR.position.x = 0.85;
  vineR.rotation.z = -Math.PI / 3.2;

  root.add(brooch, wingTopL, wingTopR, wingBotL, wingBotR, vineL, vineR);
  return root;
}

function createWingsOfDarkness() {
  const root = new THREE.Group();
  root.name = 'WINGS_OF_DARKNESS_LEVEL2';

  const darkBoneMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.85, roughness: 0.3 });
  const abyssalMat = new THREE.MeshStandardMaterial({
    color: 0x7e22ce,
    emissive: 0x581c87,
    emissiveIntensity: 0.85,
    roughness: 0.3,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x6b21a8, emissiveIntensity: 0.7 });

  // Núcleo Abissal Central
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), spikeMat);
  core.position.set(0, 1.2, 0);

  // Asas Dentadas de Morcego Abissal
  const wingL = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4, 8, 8), abyssalMat);
  wingL.position.set(-0.95, 1.2, 0);
  wingL.rotation.y = 0.25;
  const wingR = wingL.clone();
  wingR.position.x = 0.95;
  wingR.rotation.y = -0.25;

  // Ossatura e Garras Noturnas
  const boneL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.7, 8), darkBoneMat);
  boneL.position.set(-0.9, 1.3, 0.02);
  boneL.rotation.z = Math.PI / 3;
  const clawL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), darkBoneMat);
  clawL.position.set(-1.7, 1.8, 0.02);
  clawL.rotation.z = Math.PI / 4;

  const boneR = boneL.clone();
  boneR.position.x = 0.9;
  boneR.rotation.z = -Math.PI / 3;
  const clawR = clawL.clone();
  clawR.position.x = 1.7;
  clawR.rotation.z = -Math.PI / 4;

  root.add(core, wingL, wingR, boneL, clawL, boneR, clawR);
  return root;
}

function createCapeOfLord() {
  const root = new THREE.Group();
  root.name = 'CAPE_OF_LORD_LEVEL2';

  const royalVelvetMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.65, side: THREE.DoubleSide });
  const goldChainMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.2 });
  const lionEmblemMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.25 });

  // Fecho Imperial de Ouro e Ombreiras
  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.1), goldChainMat);
  clasp.position.set(0, 1.5, -0.15);
  const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12), lionEmblemMat);
  medallion.position.set(0, 1.48, -0.1);
  medallion.rotation.x = Math.PI / 2;

  // Manto Longo com Dobras Onduladas
  const mantle = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.7, 8, 10), royalVelvetMat);
  mantle.position.set(0, 0.68, -0.22);
  mantle.rotation.x = 0.12;

  // Faixa de Borda Dourada Imperial
  const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.7, 0.02), goldChainMat);
  trimL.position.set(-0.47, 0.68, -0.21);
  trimL.rotation.x = 0.12;
  const trimR = trimL.clone();
  trimR.position.x = 0.47;

  root.add(clasp, medallion, mantle, trimL, trimR);
  return root;
}

// ============================================================================
// PIPELINE DE EXECUÇÃO EM LOTE
// ============================================================================

async function main() {
  console.log('[Canonical Asset Builder] Iniciando geração dos 25 novos modelos 3D...');

  const npcsDir = 'src/client/dev_viewer/models/npcs';
  const mountsDir = 'src/client/dev_viewer/models/mounts';
  const wingsDir = 'src/client/dev_viewer/models/wings';

  await mkdir(npcsDir, { recursive: true });
  await mkdir(mountsDir, { recursive: true });
  await mkdir(wingsDir, { recursive: true });

  // 1. Exporta 10 NPCs
  await exportGlb(`${npcsDir}/npc_han_blacksmith.glb`, createBlacksmithHanzo());
  await exportGlb(`${npcsDir}/npc_pupa_pharmacist.glb`, createPharmacistPupa());
  await exportGlb(`${npcsDir}/npc_sentinel_guard.glb`, createSentinelGuard());
  await exportGlb(`${npcsDir}/npc_chaos_goblin.glb`, createChaosGoblin());
  await exportGlb(`${npcsDir}/npc_sebina_priestess.glb`, createPriestessSebina());
  await exportGlb(`${npcsDir}/npc_lumen_barmaid.glb`, createBarmaidLumen());
  await exportGlb(`${npcsDir}/npc_lala_craftswoman.glb`, createCraftswomanLala());
  await exportGlb(`${npcsDir}/npc_lahap_jeweler.glb`, createJewelerLahap());
  await exportGlb(`${npcsDir}/npc_shadow_phantom.glb`, createShadowPhantom());
  await exportGlb(`${npcsDir}/npc_charon_boatman.glb`, createCharonBoatman());

  // 2. Exporta 8 Montarias & Pets
  await exportGlb(`${mountsDir}/mount_dark_horse.glb`, createDarkHorseMount());
  await exportGlb(`${mountsDir}/mount_fenrir_red.glb`, createFenrirMount('RED'));
  await exportGlb(`${mountsDir}/mount_fenrir_blue.glb`, createFenrirMount('BLUE'));
  await exportGlb(`${mountsDir}/mount_fenrir_black.glb`, createFenrirMount('BLACK'));
  await exportGlb(`${mountsDir}/mount_fenrir_golden.glb`, createFenrirMount('GOLDEN'));
  await exportGlb(`${mountsDir}/mount_dinorant.glb`, createDinorantMount());
  await exportGlb(`${mountsDir}/mount_uniria.glb`, createUniriaMount());
  await exportGlb(`${mountsDir}/pet_dark_raven.glb`, createDarkRavenPet());
  await exportGlb(`${mountsDir}/pet_imp_satan.glb`, createImpPet());
  await exportGlb(`${mountsDir}/pet_guardian_angel.glb`, createGuardianAngelPet());

  // 3. Exporta 5 Asas & Capas
  await exportGlb(`${wingsDir}/wings_dragon_level2.glb`, createWingsOfDragon());
  await exportGlb(`${wingsDir}/wings_soul_level2.glb`, createWingsOfSoul());
  await exportGlb(`${wingsDir}/wings_spirits_level2.glb`, createWingsOfSpirits());
  await exportGlb(`${wingsDir}/wings_darkness_level2.glb`, createWingsOfDarkness());
  await exportGlb(`${wingsDir}/cape_of_lord.glb`, createCapeOfLord());

  console.log('[Canonical Asset Builder] Todos os 25 modelos foram compilados e exportados com sucesso!');
}

main().catch((err) => {
  console.error('[Canonical Asset Builder] Erro fatal:', err);
  process.exit(1);
});
