/**
 * DASI MMORPG - AMBIENT LIFE & WORLD VITALITY ENGINE
 * Motor de vida ambiental, fauna dinâmica (critters), bandos de aves reativas,
 * cardumes de peixes de Atlans e iluminação dinâmica de tochas/braseiros.
 */

import * as THREE from './libs/three.module.js';
import { loadAnimatedCreatureGLB } from './dasi3dContent.js';

/**
 * Cria sprite de identificação flutuante (billboard 3D) para NPCs Cidadãos
 */
export function createNpcBillboardSprite(title, subtitle, accentColor = '#fbbf24', THREE_INSTANCE = THREE) {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return new THREE_INSTANCE.Group();
  }
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(4, 4, 248, 56, 8);
    } else {
      ctx.fillRect(4, 4, 248, 56);
    }
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = accentColor;
    ctx.stroke();

    ctx.font = 'bold 18px "Rajdhani", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 128, 22);

    if (subtitle) {
      ctx.font = '12px "Rajdhani", sans-serif';
      ctx.fillStyle = accentColor;
      ctx.fillText(subtitle, 128, 44);
    }
  }

  const texture = new THREE_INSTANCE.CanvasTexture(canvas);
  const mat = new THREE_INSTANCE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE_INSTANCE.Sprite(mat);
  sprite.scale.set(2.4, 0.6, 1.0);
  return sprite;
}

export class AmbientLifeEngine {
  constructor(scene, currentScenarioId = 'lorencia_citadel', audioSynthesizer = null) {
    this.scene = scene;
    this.currentScenarioId = currentScenarioId;
    this.audioSynthesizer = audioSynthesizer;
    this.enabled = true;
    this.containerGroup = new THREE.Group();
    this.containerGroup.name = 'DASI_AMBIENT_LIFE_ROOT';
    this.scene.add(this.containerGroup);

    this.birds = [];
    this.bats = [];
    this.fishes = [];
    this.torches = [];
    this.critters = [];
    this.npcs = [];
    this.weatherParticles = null;
    this.clock = new THREE.Clock();

    this.initBiomeFauna(currentScenarioId);
  }

  /**
   * Alterna a visibilidade e atualização da fauna ambiental
   */
  toggleAmbient(enable) {
    this.enabled = enable !== undefined ? !!enable : !this.enabled;
    this.containerGroup.visible = this.enabled;
    return this.enabled;
  }

  /**
   * Limpa entidades ambientais ativas ao trocar de cenário
   */
  publicClear() {
    while (this.containerGroup.children.length > 0) {
      const child = this.containerGroup.children[0];
      this.containerGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }
    this.birds = [];
    this.bats = [];
    this.fishes = [];
    this.torches = [];
    this.critters = [];
    this.npcs = [];
    this.weatherParticles = null;
  }

  /**
   * Inicializa a fauna e ambientação específica do bioma ativo
   */
  initBiomeFauna(scenarioId) {
    this.publicClear();
    this.currentScenarioId = scenarioId;
    const sId = String(scenarioId || '').toLowerCase();

    if (sId.includes('lorencia') || sId.includes('noria')) {
      this.initFlockOfBirds(12, sId.includes('noria') ? 0x60a5fa : 0x334155);
      this.initTorches([
        { x: -6.5, y: 2.2, z: -6.5, color: 0xff7722, intensity: 2.2, dist: 14 },
        { x: 6.5, y: 2.2, z: -6.5, color: 0xff7722, intensity: 2.2, dist: 14 },
        { x: -6.5, y: 2.2, z: 6.5, color: 0xff7722, intensity: 2.2, dist: 14 },
        { x: 6.5, y: 2.2, z: 6.5, color: 0xff7722, intensity: 2.2, dist: 14 },
      ]);
      this.initWildCritters(3, 'fox');
    } else if (sId.includes('devias')) {
      // Braseiro Rei de Devias (Chama azul-dourada épica)
      this.initTorches([
        { x: 0, y: 3.5, z: 0, color: 0x38bdf8, intensity: 4.5, dist: 24 },
        { x: -10, y: 2.0, z: -8, color: 0xf59e0b, intensity: 2.5, dist: 12 },
        { x: 10, y: 2.0, z: -8, color: 0xf59e0b, intensity: 2.5, dist: 12 },
      ]);
    } else if (sId.includes('dungeon')) {
      this.initCaveBats(10);
      this.initTorches([
        { x: -4, y: 2.1, z: -4, color: 0x22c55e, intensity: 1.8, dist: 10 },
        { x: 4, y: 2.1, z: -4, color: 0x22c55e, intensity: 1.8, dist: 10 },
        { x: 0, y: 2.5, z: 8, color: 0x10b981, intensity: 2.0, dist: 12 },
      ]);
    } else if (sId.includes('atlans')) {
      this.initSchoolOfFish(18);
    } else if (sId.includes('lost_tower')) {
      this.initTorches([
        { x: -5, y: 2.4, z: -5, color: 0xef4444, intensity: 3.2, dist: 16 },
        { x: 5, y: 2.4, z: -5, color: 0xef4444, intensity: 3.2, dist: 16 },
      ]);
    }

    // Inicialização de Cidadãos / Habitantes (NPCs 3D) e Clima Atmosférico
    this.initNpcs(scenarioId);
    this.initWeather(scenarioId);
  }

  // =========================================================================
  // 1. BANDO DE AVES REATIVAS (LORENCIA & NORIA)
  // =========================================================================
  initFlockOfBirds(count = 10, featherColor = 0x334155) {
    const birdGeo = new THREE.BufferGeometry();
    // V-shaped wing mesh simples e ultra-leve para 60 FPS
    const verts = new Float32Array([
      // Asa Esquerda
      -0.35, 0.0, -0.15,
      0.0, 0.0, 0.0,
      -0.15, 0.0, 0.2,
      // Asa Direita
      0.0, 0.0, 0.0,
      0.35, 0.0, -0.15,
      0.15, 0.0, 0.2,
    ]);
    birdGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    birdGeo.computeVertexNormals();

    const birdMat = new THREE.MeshStandardMaterial({
      color: featherColor,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(birdGeo, birdMat);
      const perchX = (Math.random() - 0.5) * 22;
      const perchZ = (Math.random() - 0.5) * 22;
      const perchY = 0.05 + Math.random() * 0.1;

      mesh.position.set(perchX, perchY, perchZ);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.scale.setScalar(0.7 + Math.random() * 0.4);
      this.containerGroup.add(mesh);

      this.birds.push({
        mesh,
        state: 'LANDED', // 'LANDED' | 'TAKING_OFF' | 'FLYING' | 'LANDING'
        perchPos: new THREE.Vector3(perchX, perchY, perchZ),
        flyTarget: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        wingFlapSpeed: 10 + Math.random() * 6,
        wingFlapPhase: Math.random() * Math.PI * 2,
        flightAltitude: 3.5 + Math.random() * 3.5,
        orbitCenter: new THREE.Vector3(0, 5, 0),
        orbitRadius: 10 + Math.random() * 8,
        orbitSpeed: 0.8 + Math.random() * 0.6,
        orbitAngle: Math.random() * Math.PI * 2,
        stateTimer: Math.random() * 5,
      });
    }
  }

  // =========================================================================
  // 2. MORCEGOS CAVERNADORES (DUNGEON CATACOMBS)
  // =========================================================================
  initCaveBats(count = 8) {
    const batGeo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      -0.25, 0, -0.1,  0, 0, 0,  -0.1, 0, 0.15,
       0, 0, 0,  0.25, 0, -0.1,   0.1, 0, 0.15,
    ]);
    batGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    batGeo.computeVertexNormals();

    const batMat = new THREE.MeshBasicMaterial({ color: 0x18181b, side: THREE.DoubleSide });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(batGeo, batMat);
      mesh.position.set((Math.random() - 0.5) * 16, 2.5 + Math.random() * 1.5, (Math.random() - 0.5) * 16);
      this.containerGroup.add(mesh);

      this.bats.push({
        mesh,
        center: new THREE.Vector3((Math.random() - 0.5) * 10, 2.8, (Math.random() - 0.5) * 10),
        radius: 3 + Math.random() * 4,
        speed: 1.5 + Math.random() * 1.2,
        angle: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // =========================================================================
  // 3. CARDUME DE PEIXES (ATLANS THALASSA)
  // =========================================================================
  initSchoolOfFish(count = 15) {
    const fishGeo = new THREE.ConeGeometry(0.08, 0.32, 5);
    fishGeo.rotateX(Math.PI / 2);
    const fishMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(fishGeo, fishMat);
      const angle = (i / count) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * 7, 0.6 + Math.random() * 1.8, Math.sin(angle) * 7);
      this.containerGroup.add(mesh);

      this.fishes.push({
        mesh,
        baseY: mesh.position.y,
        radius: 6 + Math.random() * 4,
        speed: 0.6 + Math.random() * 0.4,
        angle,
        wigglePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  // =========================================================================
  // 4. TOCHAS E BRASEIROS COM FLICKER DE LUZ DINÂMICA
  // =========================================================================
  initTorches(torchConfigs) {
    for (const cfg of torchConfigs) {
      const light = new THREE.PointLight(cfg.color, cfg.intensity, cfg.dist);
      light.position.set(cfg.x, cfg.y, cfg.z);
      light.castShadow = false; // Leveza de performance para manter 60 FPS
      this.containerGroup.add(light);

      // Partículas sutis de fogo
      const emberGeo = new THREE.BufferGeometry();
      const emberPos = new Float32Array(15 * 3);
      for (let i = 0; i < 15; i++) {
        emberPos[i * 3 + 0] = cfg.x + (Math.random() - 0.5) * 0.2;
        emberPos[i * 3 + 1] = cfg.y + Math.random() * 0.5;
        emberPos[i * 3 + 2] = cfg.z + (Math.random() - 0.5) * 0.2;
      }
      emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
      const emberMat = new THREE.PointsMaterial({
        color: cfg.color,
        size: 0.08,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const emberPoints = new THREE.Points(emberGeo, emberMat);
      this.containerGroup.add(emberPoints);

      this.torches.push({
        light,
        emberPoints,
        baseIntensity: cfg.intensity,
        baseColor: new THREE.Color(cfg.color),
        flickerSeed: Math.random() * 100,
      });
    }
  }

  // =========================================================================
  // 5. FAUNA TERRESTRE (RAPOSAS SELVAGENS & CRITTERS DE LORENCIA/NORIA)
  // =========================================================================
  initWildCritters(count = 3, kind = 'fox') {
    const glbPath = 'models/critters/fox_animated.glb';

    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      group.name = `CRITTER_${kind.toUpperCase()}_${i}`;

      const posX = (i === 0 ? -5.5 : i === 1 ? 5.5 : 0) + (Math.random() - 0.5) * 2.0;
      const posZ = 7.0 + i * 3.5 + (Math.random() - 0.5) * 2.0;
      group.position.set(posX, 0, posZ);
      group.rotation.y = Math.random() * Math.PI * 2;

      // Geometria leve de fallback/placeholder caso o GLB demore a carregar ou ambiente headless
      const bodyGeo = new THREE.ConeGeometry(0.25, 0.6, 6);
      bodyGeo.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.65,
        metalness: 0.1,
      });
      const fallbackMesh = new THREE.Mesh(bodyGeo, bodyMat);
      fallbackMesh.position.y = 0.25;
      fallbackMesh.name = 'CRITTER_FALLBACK_BODY';
      group.add(fallbackMesh);

      const critterData = {
        group,
        fallbackMesh,
        kind,
        state: 'GRAZING', // 'GRAZING' | 'PATROL' | 'FLEEING'
        territoryCenter: new THREE.Vector3(posX, 0, posZ),
        targetPos: new THREE.Vector3(posX, 0, posZ),
        fleeDirection: new THREE.Vector3(),
        speed: 1.1,
        stateTimer: 2.0 + Math.random() * 3.0,
        animController: null,
      };

      if (typeof window !== 'undefined' && window.location && typeof loadAnimatedCreatureGLB === 'function') {
        loadAnimatedCreatureGLB(
          glbPath,
          group,
          THREE,
          (model, animCtrl) => {
            critterData.animController = animCtrl;
            fallbackMesh.visible = false;
            model.scale.setScalar(0.7);
            animCtrl.playAction('idle');
          },
          [fallbackMesh]
        );
      }

      this.critters.push(critterData);
      this.containerGroup.add(group);
    }
  }

  // =========================================================================
  // 6. CIDADÃOS E HABITANTES DAS CIDADES (NPCS 3D INTERATIVOS)
  // =========================================================================
  initNpcs(scenarioId) {
    const sId = String(scenarioId || '').toLowerCase();
    if (sId.includes('lorencia')) {
      this.spawnBlacksmithNpc({ x: -6.5, y: 0, z: -2.0, name: 'Ferreiro Han' });
      this.spawnPotionGirlNpc({ x: 6.5, y: 0, z: -2.0, name: 'Pupa Alquimista' });
      this.spawnSentinelNpc({ x: 0.0, y: 0, z: 12.0, name: 'Sentinela de Lorencia' });
    } else if (sId.includes('noria')) {
      this.spawnChaosGoblinNpc({ x: 5.5, y: 0, z: 2.0, name: 'Duende do Caos' });
      this.spawnPotionGirlNpc({ x: -5.5, y: 0, z: 2.0, name: 'Fada das Essências' });
    } else if (sId.includes('devias')) {
      this.spawnBlacksmithNpc({ x: -7.0, y: 0, z: -3.0, name: 'Armeiro Boreal' });
      this.spawnPotionGirlNpc({ x: 7.0, y: 0, z: -3.0, name: 'Alquimista do Gelo' });
    }
  }

  spawnBlacksmithNpc(cfg) {
    const group = new THREE.Group();
    group.name = `NPC_BLACKSMITH_${cfg.name}`;
    group.position.set(cfg.x, cfg.y, cfg.z);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.85, roughness: 0.25 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

    // Tronco e cabeça
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.45), bodyMat);
    torso.position.y = 0.95;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }));
    head.position.y = 1.55;
    group.add(head);

    // Bigorna e Toco de Carvalho
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.65, 8), woodMat);
    stump.position.set(0.65, 0.32, 0);
    group.add(stump);

    const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.28), ironMat);
    anvil.position.set(0.65, 0.77, 0);
    group.add(anvil);

    // Braço direito com martelo em pivô de ombro
    const hammerArmPivot = new THREE.Group();
    hammerArmPivot.position.set(0.42, 1.35, 0);

    const hammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 6), woodMat);
    hammerHandle.position.set(0, -0.25, 0);
    hammerArmPivot.add(hammerHandle);

    const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.14), ironMat);
    hammerHead.position.set(0, -0.55, 0);
    hammerArmPivot.add(hammerHead);

    group.add(hammerArmPivot);

    // Emitter de faíscas da bigorna
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(8 * 3);
    for (let i = 0; i < 8; i++) {
      sparkPositions[i * 3 + 0] = 0.65 + (Math.random() - 0.5) * 0.15;
      sparkPositions[i * 3 + 1] = 0.92;
      sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.08,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    group.add(sparkPoints);

    // Billboard de Nome e Ofício
    const nameSprite = createNpcBillboardSprite('🔨 ' + cfg.name, 'Forja, Armas & Reparos', '#fbbf24', THREE);
    nameSprite.position.set(0, 2.05, 0);
    group.add(nameSprite);

    const npcData = {
      group,
      npcId: 'han_blacksmith',
      name: cfg.name,
      hammerArmPivot,
      sparkPoints,
      sparkTimer: 0,
    };

    group.userData = { isNpc: true, npcId: 'han_blacksmith', name: cfg.name };
    group.traverse((c) => { c.userData = group.userData; });

    this.npcs.push(npcData);
    this.containerGroup.add(group);
  }

  spawnPotionGirlNpc(cfg) {
    const group = new THREE.Group();
    group.name = `NPC_POTION_${cfg.name}`;
    group.position.set(cfg.x, cfg.y, cfg.z);

    const robeMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.7 });
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.3 });
    const liquidMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.85 });

    // Corpo de túnica esmeralda
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.4, 8), robeMat);
    robe.position.y = 0.7;
    group.add(robe);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 }));
    head.position.y = 1.48;
    group.add(head);

    // Caldeirão de Cobre com Poção Borbulhante
    const cauldron = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.3, 0.45, 12), copperMat);
    cauldron.position.set(0.65, 0.22, 0);
    group.add(cauldron);

    const potionSurface = new THREE.Mesh(new THREE.CircleGeometry(0.36, 12), liquidMat);
    potionSurface.rotation.x = -Math.PI / 2;
    potionSurface.position.set(0.65, 0.44, 0);
    group.add(potionSurface);

    // Bolhas de vapor da poção
    const bubbleGeo = new THREE.BufferGeometry();
    const bubblePositions = new Float32Array(6 * 3);
    for (let i = 0; i < 6; i++) {
      bubblePositions[i * 3 + 0] = 0.65 + (Math.random() - 0.5) * 0.25;
      bubblePositions[i * 3 + 1] = 0.45 + Math.random() * 0.4;
      bubblePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
    }
    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));
    const bubbleMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.09,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const bubblePoints = new THREE.Points(bubbleGeo, bubbleMat);
    group.add(bubblePoints);

    // Billboard de Nome e Ofício
    const nameSprite = createNpcBillboardSprite('🧪 ' + cfg.name, 'Poções de Vida & Mana', '#34d399', THREE);
    nameSprite.position.set(0, 1.95, 0);
    group.add(nameSprite);

    const npcData = {
      group,
      npcId: 'pupa_potion_girl',
      name: cfg.name,
      bubblePoints,
    };

    group.userData = { isNpc: true, npcId: 'pupa_potion_girl', name: cfg.name };
    group.traverse((c) => { c.userData = group.userData; });

    this.npcs.push(npcData);
    this.containerGroup.add(group);
  }

  spawnSentinelNpc(cfg) {
    const group = new THREE.Group();
    group.name = `NPC_SENTINEL_${cfg.name}`;
    group.position.set(cfg.x, cfg.y, cfg.z);

    const plateMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const cloakMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8 });

    // Armadura de Cavaleiro Imperial
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.95, 0.4), plateMat);
    torso.position.y = 1.0;
    group.add(torso);

    const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.1), cloakMat);
    cape.position.set(0, 0.95, -0.22);
    group.add(cape);

    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.35), plateMat);
    helm.position.y = 1.62;
    group.add(helm);

    // Alabarda Imperial em posição de guarda
    const spearPivot = new THREE.Group();
    spearPivot.position.set(0.4, 1.0, 0.1);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.3, 6), plateMat);
    shaft.position.y = 0.5;
    spearPivot.add(shaft);

    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 4), plateMat);
    blade.position.y = 1.7;
    spearPivot.add(blade);

    group.add(spearPivot);

    // Billboard de Nome e Guarda
    const nameSprite = createNpcBillboardSprite('🛡️ ' + cfg.name, 'Guarda Imperial da Cidadela', '#93c5fd', THREE);
    nameSprite.position.set(0, 2.15, 0);
    group.add(nameSprite);

    const npcData = {
      group,
      npcId: 'sentinel_guard',
      name: cfg.name,
      spearPivot,
    };

    group.userData = { isNpc: true, npcId: 'sentinel_guard', name: cfg.name };
    group.traverse((c) => { c.userData = group.userData; });

    this.npcs.push(npcData);
    this.containerGroup.add(group);
  }

  spawnChaosGoblinNpc(cfg) {
    const group = new THREE.Group();
    group.name = `NPC_CHAOS_${cfg.name}`;
    group.position.set(cfg.x, cfg.y, cfg.z);

    const goblinSkin = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.6 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), goblinSkin);
    body.position.y = 0.5;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), goblinSkin);
    head.position.y = 0.9;
    group.add(head);

    const goggles = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 8), brassMat);
    goggles.rotation.z = Math.PI / 2;
    goggles.position.set(0, 0.95, 0.18);
    group.add(goggles);

    // Billboard de Nome e Altar
    const nameSprite = createNpcBillboardSprite('⚡ ' + cfg.name, 'Combinações da Chaos Machine', '#f59e0b', THREE);
    nameSprite.position.set(0, 1.5, 0);
    group.add(nameSprite);

    const npcData = {
      group,
      npcId: 'chaos_goblin',
      name: cfg.name,
    };

    group.userData = { isNpc: true, npcId: 'chaos_goblin', name: cfg.name };
    group.traverse((c) => { c.userData = group.userData; });

    this.npcs.push(npcData);
    this.containerGroup.add(group);
  }

  // =========================================================================
  // 7. SISTEMA CLIMÁTICO E ATMOSFERA AMBIENTAL
  // =========================================================================
  initWeather(scenarioId) {
    const sId = String(scenarioId || '').toLowerCase();
    let particleCount = 180;
    let color = 0x93c5fd;
    let size = 0.08;
    let spreadX = 36;
    let spreadZ = 36;
    let spreadY = 12;
    let fallSpeed = 3.5;
    let windSpeed = 0.4;
    let kind = 'rain';

    if (sId.includes('devias')) {
      kind = 'snow';
      color = 0xf8fafc;
      particleCount = 240;
      size = 0.10;
      fallSpeed = 2.2;
      windSpeed = 2.8;
    } else if (sId.includes('noria')) {
      kind = 'fireflies';
      color = 0xfacc15;
      particleCount = 75;
      size = 0.12;
      fallSpeed = 0.3;
      windSpeed = 0.2;
    } else if (sId.includes('atlans')) {
      kind = 'bubbles';
      color = 0x38bdf8;
      particleCount = 120;
      size = 0.10;
      fallSpeed = -1.8;
      windSpeed = 0.3;
    } else if (sId.includes('lost_tower')) {
      kind = 'embers';
      color = 0xf97316;
      particleCount = 140;
      size = 0.09;
      fallSpeed = -0.8;
      windSpeed = 0.5;
    } else if (!sId.includes('lorencia')) {
      return;
    }

    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * spreadX;
      positions[i * 3 + 1] = Math.random() * spreadY;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0.75,
      blending: kind === 'fireflies' || kind === 'embers' ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geom, mat);
    points.name = `DASI_WEATHER_${kind.toUpperCase()}`;
    this.containerGroup.add(points);

    this.weatherParticles = {
      points,
      positions,
      kind,
      spreadX,
      spreadY,
      spreadZ,
      fallSpeed,
      windSpeed,
    };
  }
  update(delta, playerPos) {
    if (!this.enabled || !this.containerGroup.visible) return;
    const elapsed = this.clock.getElapsedTime();

    // 1. Atualiza Aves (Lorencia / Noria)
    for (const bird of this.birds) {
      const bPos = bird.mesh.position;
      const distToPlayer = playerPos ? bPos.distanceTo(playerPos) : 999;

      // Reação ao Jogador: se o jogador se aproximar a menos de 4m, a ave decola
      if (bird.state === 'LANDED') {
        if (distToPlayer < 4.2) {
          bird.state = 'TAKING_OFF';
          bird.velocity.set((bPos.x - playerPos.x) * 1.5, 3.5, (bPos.z - playerPos.z) * 1.5);
          if (this.audioSynthesizer && typeof this.audioSynthesizer.playWildlifeSound === 'function') {
            this.audioSynthesizer.playWildlifeSound('wings');
          }
        } else {
          // Bate a asa sutilmente ou bica o chão
          bird.mesh.rotation.x = Math.sin(elapsed * 2 + bird.wingFlapPhase) * 0.1;
        }
      } else if (bird.state === 'TAKING_OFF') {
        bPos.addScaledVector(bird.velocity, delta);
        bird.mesh.rotation.y = Math.atan2(bird.velocity.x, bird.velocity.z);
        // Bater de asas rápido
        bird.mesh.scale.x = (0.7 + Math.sin(elapsed * bird.wingFlapSpeed) * 0.3);

        if (bPos.y >= bird.flightAltitude) {
          bird.state = 'FLYING';
          bird.orbitCenter.set(bPos.x, bird.flightAltitude, bPos.z);
        }
      } else if (bird.state === 'FLYING') {
        bird.orbitAngle += bird.orbitSpeed * delta;
        const targetX = bird.orbitCenter.x + Math.cos(bird.orbitAngle) * bird.orbitRadius;
        const targetZ = bird.orbitCenter.z + Math.sin(bird.orbitAngle) * bird.orbitRadius;
        const targetY = bird.flightAltitude + Math.sin(elapsed * 1.2 + bird.wingFlapPhase) * 0.6;

        const dx = targetX - bPos.x;
        const dz = targetZ - bPos.z;
        bPos.x += dx * 2.0 * delta;
        bPos.z += dz * 2.0 * delta;
        bPos.y = targetY;

        bird.mesh.rotation.y = Math.atan2(dx, dz);
        bird.mesh.rotation.z = Math.sin(elapsed * 2) * 0.15; // Inclinação aerodinâmica
        bird.mesh.scale.x = 0.8 + Math.sin(elapsed * (bird.wingFlapSpeed * 0.7)) * 0.25;

        // Se o jogador estiver longe e a ave voou bastante, ela pousa de volta
        bird.stateTimer += delta;
        if (bird.stateTimer > 18.0 && distToPlayer > 8.0) {
          bird.state = 'LANDING';
        }
      } else if (bird.state === 'LANDING') {
        bPos.lerp(bird.perchPos, 1.2 * delta);
        bird.mesh.scale.x = 0.8 + Math.sin(elapsed * bird.wingFlapSpeed) * 0.2;
        if (bPos.distanceTo(bird.perchPos) < 0.25) {
          bPos.copy(bird.perchPos);
          bird.state = 'LANDED';
          bird.stateTimer = 0;
          bird.mesh.rotation.z = 0;
        }
      }
    }

    // 2. Atualiza Morcegos (Dungeon)
    for (const bat of this.bats) {
      bat.angle += bat.speed * delta;
      bat.mesh.position.x = bat.center.x + Math.cos(bat.angle) * bat.radius;
      bat.mesh.position.z = bat.center.z + Math.sin(bat.angle) * bat.radius;
      bat.mesh.position.y = bat.center.y + Math.sin(elapsed * 4 + bat.phase) * 0.35;
      bat.mesh.rotation.y = bat.angle + Math.PI / 2;
      bat.mesh.scale.x = 0.8 + Math.sin(elapsed * 18 + bat.phase) * 0.3; // Bate asas rápido
    }
    if (this.bats.length > 0 && this.audioSynthesizer && typeof this.audioSynthesizer.playWildlifeSound === 'function') {
      if (Math.random() < 0.003) {
        this.audioSynthesizer.playWildlifeSound('bat');
      }
    }

    // 3. Atualiza Cardume de Peixes (Atlans)
    for (const fish of this.fishes) {
      fish.angle += fish.speed * delta;
      fish.mesh.position.x = Math.cos(fish.angle) * fish.radius;
      fish.mesh.position.z = Math.sin(fish.angle) * fish.radius;
      fish.mesh.position.y = fish.baseY + Math.sin(elapsed * 2.5 + fish.wigglePhase) * 0.2;
      fish.mesh.rotation.y = fish.angle + Math.PI;
      fish.mesh.rotation.z = Math.sin(elapsed * 8 + fish.wigglePhase) * 0.15; // Ondulação da cauda
    }

    // 4. Atualiza Tochas e Braseiros (Flicker Orgânico)
    for (const torch of this.torches) {
      const flicker = 1.0 + 0.14 * Math.sin(elapsed * 14 + torch.flickerSeed) +
                            0.08 * Math.cos(elapsed * 29 + torch.flickerSeed * 1.5) +
                            0.05 * Math.sin(elapsed * 47);
      torch.light.intensity = torch.baseIntensity * flicker;

      // Anima partículas de fuligem subindo
      if (torch.emberPoints) {
        const posAttr = torch.emberPoints.geometry.attributes.position;
        const arr = posAttr.array;
        for (let i = 0; i < arr.length / 3; i++) {
          arr[i * 3 + 1] += delta * 0.45;
          arr[i * 3 + 0] += Math.sin(elapsed * 3 + i) * 0.003;
          if (arr[i * 3 + 1] > torch.light.position.y + 0.9) {
            arr[i * 3 + 1] = torch.light.position.y;
            arr[i * 3 + 0] = torch.light.position.x + (Math.random() - 0.5) * 0.18;
          }
        }
        posAttr.needsUpdate = true;
      }
    }

    // 5. Atualiza Fauna Terrestre (Raposas Selvagens)
    for (const critter of this.critters) {
      const cPos = critter.group.position;
      const distToPlayer = playerPos ? cPos.distanceTo(playerPos) : 999;

      if (critter.state === 'FLEEING') {
        // Fuga galopando em alta velocidade
        cPos.addScaledVector(critter.fleeDirection, critter.speed * delta);
        const targetAngle = Math.atan2(critter.fleeDirection.x, critter.fleeDirection.z);
        critter.group.rotation.y = THREE.MathUtils.lerp(critter.group.rotation.y, targetAngle, Math.min(1.0, 10 * delta));

        critter.stateTimer -= delta;
        if (critter.stateTimer <= 0 && distToPlayer > 8.0) {
          critter.state = 'GRAZING';
          critter.speed = 1.1;
          critter.stateTimer = 3.0 + Math.random() * 4.0;
          if (critter.animController) critter.animController.playAction('idle');
        }
      } else {
        // Reação ao Jogador: aproximação súbita (< 4.5m) assusta o animal
        if (distToPlayer < 4.5 && playerPos) {
          critter.state = 'FLEEING';
          critter.speed = 4.2; // Galope rápido
          critter.fleeDirection.set(cPos.x - playerPos.x, 0, cPos.z - playerPos.z).normalize();
          if (critter.fleeDirection.lengthSq() < 0.001) {
            critter.fleeDirection.set(1, 0, 0);
          }
          critter.stateTimer = 3.5 + Math.random() * 2.0;
          if (critter.animController) critter.animController.playAction('run');
          if (this.audioSynthesizer && typeof this.audioSynthesizer.playWildlifeSound === 'function') {
            this.audioSynthesizer.playWildlifeSound('wings');
          }
        } else if (critter.state === 'PATROL') {
          const dx = critter.targetPos.x - cPos.x;
          const dz = critter.targetPos.z - cPos.z;
          const distToTarget = Math.sqrt(dx * dx + dz * dz);

          if (distToTarget < 0.35) {
            critter.state = 'GRAZING';
            critter.stateTimer = 2.5 + Math.random() * 3.5;
            if (critter.animController) critter.animController.playAction('idle');
          } else {
            cPos.x += (dx / distToTarget) * critter.speed * delta;
            cPos.z += (dz / distToTarget) * critter.speed * delta;
            const targetAngle = Math.atan2(dx, dz);
            critter.group.rotation.y = THREE.MathUtils.lerp(critter.group.rotation.y, targetAngle, Math.min(1.0, 8 * delta));
          }
        } else if (critter.state === 'GRAZING') {
          critter.stateTimer -= delta;
          if (critter.stateTimer <= 0) {
            critter.state = 'PATROL';
            critter.speed = 1.2;
            const patrolAngle = Math.random() * Math.PI * 2;
            const patrolDist = 1.5 + Math.random() * 3.5;
            critter.targetPos.set(
              critter.territoryCenter.x + Math.cos(patrolAngle) * patrolDist,
              critter.territoryCenter.y,
              critter.territoryCenter.z + Math.sin(patrolAngle) * patrolDist
            );
            if (critter.animController) critter.animController.playAction('walk');
          }
        }
      }

      if (critter.animController) {
        critter.animController.update(delta);
      }
    }

    // 6. Atualiza Cidadãos e Habitantes (NPCs 3D)
    for (const npc of this.npcs) {
      if (npc.npcId === 'han_blacksmith') {
        const swing = Math.sin(elapsed * 3.8);
        npc.hammerArmPivot.rotation.z = swing * 0.45 - 0.2;
        if (swing > 0.88) {
          npc.sparkPoints.material.opacity = 1.0;
        } else {
          npc.sparkPoints.material.opacity = Math.max(0, npc.sparkPoints.material.opacity - delta * 4.0);
        }
      } else if (npc.npcId === 'pupa_potion_girl') {
        const arr = npc.bubblePoints.geometry.attributes.position.array;
        for (let i = 0; i < arr.length / 3; i++) {
          arr[i * 3 + 1] += delta * 0.35;
          if (arr[i * 3 + 1] > 1.1) {
            arr[i * 3 + 1] = 0.45;
            arr[i * 3 + 0] = 0.65 + (Math.random() - 0.5) * 0.22;
          }
        }
        npc.bubblePoints.geometry.attributes.position.needsUpdate = true;
      } else if (npc.npcId === 'sentinel_guard') {
        const dist = playerPos ? npc.group.position.distanceTo(playerPos) : 999;
        if (dist < 3.8) {
          npc.spearPivot.rotation.x = THREE.MathUtils.lerp(npc.spearPivot.rotation.x, -0.3, 6 * delta);
        } else {
          npc.spearPivot.rotation.x = THREE.MathUtils.lerp(npc.spearPivot.rotation.x, 0, 4 * delta);
        }
      } else if (npc.npcId === 'chaos_goblin') {
        npc.group.position.y = Math.abs(Math.sin(elapsed * 4.5)) * 0.12;
      }
    }

    // 7. Atualiza Partículas Climáticas Atmosféricas (Chuva, Neve, Esporos, Bolhas, Fagulhas)
    if (this.weatherParticles) {
      const wp = this.weatherParticles;
      const arr = wp.positions;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] -= wp.fallSpeed * delta;
        arr[i * 3 + 0] += Math.sin(elapsed * 1.5 + i) * 0.02 + wp.windSpeed * delta;

        if (wp.fallSpeed > 0 && arr[i * 3 + 1] < 0.05) {
          arr[i * 3 + 1] = wp.spreadY;
          arr[i * 3 + 0] = (Math.random() - 0.5) * wp.spreadX;
          arr[i * 3 + 2] = (Math.random() - 0.5) * wp.spreadZ;
        } else if (wp.fallSpeed < 0 && arr[i * 3 + 1] > wp.spreadY) {
          arr[i * 3 + 1] = 0.1;
          arr[i * 3 + 0] = (Math.random() - 0.5) * wp.spreadX;
          arr[i * 3 + 2] = (Math.random() - 0.5) * wp.spreadZ;
        }

        if (Math.abs(arr[i * 3 + 0]) > wp.spreadX / 2) {
          arr[i * 3 + 0] = -Math.sign(arr[i * 3 + 0]) * (wp.spreadX / 2);
        }
      }
      wp.points.geometry.attributes.position.needsUpdate = true;
    }
  }
}
