/**
 * DASI MMORPG - ARENA DE COMBATE 3D EM TEMPO REAL
 * Motor de Gameplay 3D com Three.js WebGL conectado ao GameServer autoritativo.
 * 
 * Funcionalidades:
 * - Cenários 3D Dinâmicos com Transição Contínua (Lorencia, Noria, Devias)
 * - Portais de Teletransporte 3D com vórtice animado, anéis rúnicos e horizonte de eventos
 * - Efeito 3D de Level Up (Auréola dourada ascendente, feixe solar e partículas em espiral)
 * - Controles Fluidos por Teclado (WASD / Setas) com aceleração e inércia física
 * - Feedback Sonoro Harmônico (Web Audio API procedural para passos, portais, skills e fanfarra)
 * - Herói 3D com física de movimento suave, interpolação de rotação e animações de ação
 * - Monstros 3D sincronizados (Spider, Budge Dragon, Bull Fighter, Skeleton) com barras de vida 3D
 * - Raycaster 3D interativo para movimento, ataque ao clicar no monstro, portais e drops
 * - Drops 3D físicos no solo com colunas de luz celestial e rotação contínua (Bless, Soul, Chaos, Zen)
 * - Números de dano flutuantes em espaço 3D (Branco, Laranja Crítico, Ciano Excelente, Dourado)
 * - Câmera isométrica dinâmica com amortecimento suave (Smooth Camera Follow)
 */

import * as THREE from './libs/three.module.js';
import { OPCODES } from './protocolOpcodes.js';
import {
  createHero,
  createMonster,
  createEnvironment,
  createProceduralCanvasTexture,
  loadBestiaryCreatureGLB,
  loadAnimatedCreatureGLB,
} from './dasi3dContent.js';
import { resolveBestiaryRuntimeModel } from './bestiaryRuntimeMap.js';
import { DasiCollisionEngine } from './dasiCollisionEngine.js';
import {
  HarmonicAudioSynthesizer,
  LevelUpSystem,
  PortalSystem,
  KeyboardController,
} from './dasiActionGameplay.js';
import { AmbientLifeEngine } from './ambientLifeEngine.js';

export class Dasi3DRealtimeArena {
  constructor(containerId, appReference) {
    this.container = document.getElementById(containerId);
    this.app = appReference; // Referência à instância de DevClientApp

    if (!this.container) {
      console.error(`[Dasi3DArena] Container #${containerId} não encontrado.`);
      return;
    }

    // Configurações de Escala (Mapeamento 2D -> 3D)
    this.scaleFactor = 0.04; // 1 unidade 2D = 0.04m em 3D
    this.originX = 420;      // Centro X em 2D
    this.originY = 210;      // Centro Y em 2D

    // Estado da Cena e Sistemas
    this.clock = new THREE.Clock();
    this.currentMap = 'LORENCIA';
    this.currentScenarioId = 'LOR_01';
    this.showCollisionDebug = false;
    this.debugCollidersMesh = null;
    this.playerColliderMesh = null;
    this.harmonicAudio = new HarmonicAudioSynthesizer();
    this.monsters3D = new Map();   // id -> entidade 3D sincronizada com MobSpawner
    this.bosses3D = new Map();     // id -> entidade 3D sincronizada separadamente com BossManager
    this.drops3D = new Map();      // dropId -> { group, mesh, beam, light }
    this.portals3D = new Map();    // portalId -> { group, vortexDisc, innerRing, outerRing, portalLight, particlesPoints, labelSprite, def }
    this.floatingTexts = [];       // { sprite, targetY, life, maxLife }
    this.clickDecals = [];         // { mesh, life }
    this.activeLevelUpVFX = null;
    this.isTeleporting = false;

    // Referências do Jogador 3D
    this.playerHero = null;
    this.playerGroup = new THREE.Group();
    this.playerTargetPos = new THREE.Vector3(0, 0, 0);
    this.cameraOffset = new THREE.Vector3(0, 8.5, 9.5);
    this.cameraLookTarget = new THREE.Vector3(0, 0, 0);

    // Controlador de Teclado (WASD) com Colisão Física e Deslizamento
    this.keyboardController = new KeyboardController({ x: 0, z: 0 });
    this.keyboardController.collisionResolver = (curr, desired) => {
      return DasiCollisionEngine.resolveMovement(this.currentScenarioId, curr, desired);
    };
    this.keyboardController.onFootstepCallback = (dist) => {
      let surf = 'stone';
      const mapKey = (this.currentScenarioId || this.currentMap || '').toUpperCase();
      if (mapKey.startsWith('NOR') || mapKey === 'NORIA') surf = 'grass';
      else if (mapKey.startsWith('DEV') || mapKey === 'DEVIAS') surf = 'snow';
      else if (mapKey.startsWith('TAR') || mapKey === 'TARKAN') surf = 'sand';
      else if (mapKey.startsWith('LT') || mapKey === 'LOST_TOWER') surf = 'metal';
      else if (mapKey.startsWith('DNG') || mapKey === 'DUNGEON') surf = 'crypt';
      else if (mapKey.startsWith('ATL') || mapKey === 'ATLANS') surf = 'water';
      else if (mapKey.startsWith('ICA') || mapKey === 'ICARUS') surf = 'crystal';
      this.harmonicAudio.playFootstep(surf);
    };
    this.keyboardController.onShortcutCallback = (code) => {
      if (this.app && typeof this.app.handleShortcut === 'function') {
        this.app.handleShortcut(code);
      }
    };
    this.keyboardController.attachListeners(window);

    // Raycaster para cliques no solo 3D, monstros e portais
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.initScene();
    this.initEnvironment();
    this.initPlayer();
    this.ambientLife = new AmbientLifeEngine(this.scene, this.currentScenarioId);
    this.buildPortals(this.currentMap);
    this.initInteractionEvents();

    window.addEventListener('resize', () => this.onWindowResize());
    this.animate();
  }

  // ==========================================================================
  // CONVERSÃO DE COORDENADAS (2D SERVER <-> 3D THREE.JS)
  // ==========================================================================
  to3DCoords(x2d, y2d) {
    const x3d = (x2d - this.originX) * this.scaleFactor;
    const z3d = (y2d - this.originY) * this.scaleFactor;
    return { x: x3d, z: z3d };
  }

  to2DCoords(x3d, z3d) {
    const x2d = Math.round(this.originX + (x3d / this.scaleFactor));
    const y2d = Math.round(this.originY + (z3d / this.scaleFactor));
    return { x: x2d, y: y2d };
  }

  // ==========================================================================
  // INICIALIZAÇÃO DA CENA THREE.JS
  // ==========================================================================
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090d);
    this.scene.fog = new THREE.FogExp2(0x07090d, 0.028);

    const w = this.container.clientWidth || 840;
    const h = this.container.clientHeight || 420;

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.2, 100);
    this.camera.position.set(0, 9.5, 11.0);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Iluminação PBR Base
    this.ambientLight = new THREE.AmbientLight(0x1e293b, 0.95);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffecd2, 1.9);
    this.sunLight.position.set(12, 18, 10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 40;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(0x60a5fa, 0.65);
    this.fillLight.position.set(-10, 8, -8);
    this.scene.add(this.fillLight);
  }

  // ==========================================================================
  // CENÁRIO 3D & TRANSIÇÃO DE MAPAS (LORENCIA, NORIA, DEVIAS)
  // ==========================================================================
  initEnvironment() {
    this.envGroup = new THREE.Group();

    // 1. Chão Navegável (Plano para Raycasting)
    const groundGeom = new THREE.PlaneGeometry(42, 26, 32, 32);
    this.groundMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.8,
      metalness: 0.15,
    });
    this.walkPlane = new THREE.Mesh(groundGeom, this.groundMat);
    this.walkPlane.rotation.x = -Math.PI / 2;
    this.walkPlane.position.y = -0.02;
    this.walkPlane.receiveShadow = true;
    this.envGroup.add(this.walkPlane);

    // 2. Elementos Procedurais de Cenário
    this.rebuildEnvironmentProps(this.currentMap);
    this.scene.add(this.envGroup);
  }

  rebuildEnvironmentProps(mapId) {
    if (this.currentMapPropsGroup) {
      this.envGroup.remove(this.currentMapPropsGroup);
      this.currentMapPropsGroup = null;
    }

    // Instancia o ambiente 3D do catálogo procedural
    this.currentEnvEntity = createEnvironment(mapId, THREE);
    this.currentMapPropsGroup = this.currentEnvEntity.group;
    this.envGroup.add(this.currentMapPropsGroup);

    // Ajusta piso, névoa e luzes conforme o mapa ou cenário dos 47 reinos
    const biomePrefix = mapId.split('_')[0];
    const biomeMap = {
      LOR: 'LORENCIA', NOR: 'NORIA', DEV: 'DEVIAS', DNG: 'DUNGEON',
      LT: 'LOST_TOWER', ATL: 'ATLANS', TAR: 'TARKAN', ICA: 'ICARUS'
    };
    const biomeKey = biomeMap[biomePrefix] || mapId;
    const cfg = (PortalSystem.MAP_CONFIGS && (PortalSystem.MAP_CONFIGS[mapId] || PortalSystem.MAP_CONFIGS[biomeKey])) || {
      groundColor: 0x1f242d,
      fogColor: 0x07090d,
      fogDensity: 0.028,
      ambientColor: 0x1e293b,
      sunColor: 0xffecd2,
      sunIntensity: 1.9,
    };
    this.groundMat.color.setHex(cfg.groundColor);
    let floorTex = null;
    if (biomeKey === 'LORENCIA' || biomeKey.startsWith('LOR')) {
      floorTex = createProceduralCanvasTexture('COBBLESTONE', THREE, 8, 5);
      this.groundMat.roughness = 0.65;
      this.groundMat.metalness = 0.20;
    } else if (biomeKey === 'NORIA' || biomeKey.startsWith('NOR')) {
      floorTex = createProceduralCanvasTexture('MOSSY_WOOD', THREE, 6, 4);
      this.groundMat.roughness = 0.85;
      this.groundMat.metalness = 0.05;
    } else if (biomeKey === 'DEVIAS' || biomeKey.startsWith('DEV')) {
      floorTex = createProceduralCanvasTexture('GLACIAL_ICE', THREE, 8, 5);
      this.groundMat.roughness = 0.35;
      this.groundMat.metalness = 0.25;
    } else if (biomeKey === 'ATLANS' || biomeKey.startsWith('ATL')) {
      floorTex = createProceduralCanvasTexture('OCEAN_CAUSTICS', THREE, 6, 4);
      this.groundMat.roughness = 0.40;
      this.groundMat.metalness = 0.15;
    } else if (biomeKey === 'ICARUS' || biomeKey.startsWith('ICA')) {
      floorTex = createProceduralCanvasTexture('AETHER_MARBLE', THREE, 8, 5);
      this.groundMat.roughness = 0.20;
      this.groundMat.metalness = 0.30;
    }
    if (floorTex) {
      this.groundMat.map = floorTex;
      this.groundMat.bumpMap = floorTex;
      this.groundMat.bumpScale = 0.04;
      this.groundMat.needsUpdate = true;
    }
    this.scene.background.setHex(cfg.fogColor);
    this.scene.fog.color.setHex(cfg.fogColor);
    this.scene.fog.density = cfg.fogDensity;
    this.ambientLight.color.setHex(cfg.ambientColor);
    this.sunLight.color.setHex(cfg.sunColor);
    this.sunLight.intensity = cfg.sunIntensity;
  }

  // ==========================================================================
  // CONSTRUÇÃO E ANIMAÇÃO DE PORTAIS 3D
  // ==========================================================================
  buildPortals(mapId) {
    // Remove portais anteriores
    for (const p of this.portals3D.values()) {
      this.scene.remove(p.group);
    }
    this.portals3D.clear();

    const portalDefs = PortalSystem.getPortalsForMap(mapId);
    portalDefs.forEach((pDef) => {
      const portalObj = PortalSystem.createPortal3DMesh(pDef, THREE);
      portalObj.def = pDef;
      this.scene.add(portalObj.group);
      this.portals3D.set(pDef.id, portalObj);
    });
  }

  /**
   * Transição Dinâmica e Suave de Mapas & Cenários dos 47 Reinos
   */
  switchMap(newMapId) {
    if (this.currentMap === newMapId) return;

    const oldMap = this.currentMap;
    this.currentMap = newMapId;

    const biomeMap = {
      LORENCIA: 'LOR_01', NORIA: 'NOR_01', DEVIAS: 'DEV_01', DUNGEON: 'DNG_01',
      LOST_TOWER: 'LT_01', ATLANS: 'ATL_01', TARKAN: 'TAR_01', ICARUS: 'ICA_01'
    };
    if (newMapId.includes('_') || DasiCollisionEngine.getScenario(newMapId)) {
      this.currentScenarioId = newMapId;
    } else {
      this.currentScenarioId = biomeMap[newMapId] || 'LOR_01';
    }

    // 1. Áudio de Vórtice Dimensional
    this.harmonicAudio.playPortalWarpSound(newMapId);

    // 2. Reconstrução dos Elementos 3D de Cenário e Portais
    this.rebuildEnvironmentProps(newMapId);
    this.buildPortals(newMapId);
    if (this.ambientLife) {
      this.ambientLife.initBiomeFauna(this.currentScenarioId);
    }

    // Recompõe Wireframes de Debug de Colisão se estiver ativo
    if (this.showCollisionDebug) {
      if (this.debugCollidersMesh) {
        this.scene.remove(this.debugCollidersMesh);
        this.debugCollidersMesh = null;
      }
      this.debugCollidersMesh = DasiCollisionEngine.createDebugCollidersMesh(this.currentScenarioId, THREE);
      this.scene.add(this.debugCollidersMesh);
      if (!this.playerColliderMesh && this.playerGroup) {
        this.playerColliderMesh = DasiCollisionEngine.createPlayerColliderMesh(THREE);
        this.playerGroup.add(this.playerColliderMesh);
      }
    }

    // 3. Posiciona o Jogador no Ponto de Spawn do Cenário / Mapa
    const sc = DasiCollisionEngine.getScenario(this.currentScenarioId);
    const cfg = PortalSystem.MAP_CONFIGS[newMapId] || PortalSystem.MAP_CONFIGS.LORENCIA;
    const spawnX = sc ? sc.spawnPoint.x : cfg.spawnPoint.x;
    const spawnZ = sc ? sc.spawnPoint.z : cfg.spawnPoint.z;

    this.playerGroup.position.set(spawnX, 0, spawnZ);
    this.playerTargetPos.set(spawnX, 0, spawnZ);
    this.keyboardController.teleportTo(spawnX, spawnZ);

    const coords2D = this.to2DCoords(spawnX, spawnZ);
    this.app.playerX = coords2D.x;
    this.app.playerY = coords2D.y;
    this.app.playerTargetX = coords2D.x;
    this.app.playerTargetY = coords2D.y;

    // 4. Dispara Flash / Túnel de Dobra no App
    if (this.app && typeof this.app.triggerWarpFlash === 'function') {
      this.app.triggerWarpFlash(newMapId, sc ? sc.name : cfg.name);
    }

    // 5. Notificação de Texto Flutuante 3D
    this.spawnDamageText(coords2D.x, coords2D.y, `🌀 ENTRANDO EM: ${(sc ? sc.name : cfg.name).toUpperCase()}`, '#38bdf8');
    this.app.log(`🌀 [TELETRANSPORTE] Você atravessou o portal de [${oldMap}] para [${sc ? sc.name : cfg.name}]!`, 'info');

    // 6. Sincroniza Dropdown dos 47 Cenários e Botões de Bioma na UI
    if (this.app) {
      if (typeof this.app.updateMapButtonsUI === 'function') {
        this.app.updateMapButtonsUI(newMapId);
      }
      const selectScenario47 = document.getElementById('select-scenario-47');
      if (selectScenario47) {
        selectScenario47.value = this.currentScenarioId;
      }
    }
  }

  /**
   * Alterna a Visualização 3D das Caixas de Colisão e Limites Físicos (Wireframe Debug)
   */
  toggleCollisionDebug(show) {
    this.showCollisionDebug = (show !== undefined) ? !!show : !this.showCollisionDebug;
    if (this.debugCollidersMesh) {
      this.scene.remove(this.debugCollidersMesh);
      this.debugCollidersMesh = null;
    }
    if (this.playerColliderMesh) {
      if (this.playerColliderMesh.parent) {
        this.playerColliderMesh.parent.remove(this.playerColliderMesh);
      }
      this.playerColliderMesh = null;
    }
    if (this.showCollisionDebug) {
      this.debugCollidersMesh = DasiCollisionEngine.createDebugCollidersMesh(this.currentScenarioId, THREE);
      this.scene.add(this.debugCollidersMesh);
      if (this.playerGroup) {
        this.playerColliderMesh = DasiCollisionEngine.createPlayerColliderMesh(THREE);
        this.playerGroup.add(this.playerColliderMesh);
      }
    }
    return this.showCollisionDebug;
  }

  // ==========================================================================
  // JOGADOR 3D (DARK KNIGHT COM DRAGON SET + DRAGON BLADE + ASAS)
  // ==========================================================================
  initPlayer() {
    this.playerGroup = new THREE.Group();
    const heroClass = (this.app && this.app.charClass) || 'DK';
    this.playerHero = createHero(heroClass, { setTier: 'DRAGON', useRealGLB: true }, THREE);

    // Posicionamento Inicial
    const sc = DasiCollisionEngine.getScenario(this.currentScenarioId);
    const startX = sc ? sc.spawnPoint.x : 0;
    const startZ = sc ? sc.spawnPoint.z : -5.0;
    const start3D = { x: startX, z: startZ };
    this.playerGroup.position.set(start3D.x, 0, start3D.z);
    this.playerTargetPos.set(start3D.x, 0, start3D.z);
    this.keyboardController.teleportTo(start3D.x, start3D.z);

    this.playerGroup.add(this.playerHero.group);

    // Círculo de Seleção / Aura nos pés do Jogador
    const heroRingGeom = new THREE.RingGeometry(0.55, 0.65, 32);
    const heroRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      side: THREE.DoubleSide,
    });
    const heroRing = new THREE.Mesh(heroRingGeom, heroRingMat);
    heroRing.rotation.x = -Math.PI / 2;
    heroRing.position.y = 0.04;
    this.playerGroup.add(heroRing);

    // Cápsula wireframe de colisão física oficial (raio 0.45m, altura 1.85m)
    if (this.showCollisionDebug) {
      this.playerColliderMesh = DasiCollisionEngine.createPlayerColliderMesh(THREE);
      this.playerGroup.add(this.playerColliderMesh);
    }

    this.scene.add(this.playerGroup);
  }

  /**
   * Atualiza dinamicamente a malha 3D e armadura do herói na Arena ao trocar de classe
   */
  updatePlayerHeroClass(newClass) {
    if (!this.playerGroup) return;
    if (this.playerHero && this.playerHero.group) {
      this.playerGroup.remove(this.playerHero.group);
    }
    const setTierMap = {
      DK: 'DRAGON',
      DW: 'GRAND_SOUL',
      ELF: 'SPIRIT',
      MG: 'HURRICANE',
      DL: 'DARK_MASTER'
    };
    this.playerHero = createHero(newClass, { setTier: setTierMap[newClass] || 'DRAGON', useRealGLB: true }, THREE);
    this.playerGroup.add(this.playerHero.group);
    if (this.showCollisionDebug && !this.playerColliderMesh) {
      this.playerColliderMesh = DasiCollisionEngine.createPlayerColliderMesh(THREE);
      this.playerGroup.add(this.playerColliderMesh);
    }
    console.log(`[Dasi3DArena] Malha do jogador 3D atualizada para modelo oficial: ${newClass}`);
  }

  // ==========================================================================
  // EVENTOS DE INTERAÇÃO (CLIQUE NO SOLO, MONSTRO, PORTAL OU DROP)
  // ==========================================================================
  initInteractionEvents() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      // 1. Checa se clicou em algum portal 3D
      for (const portalObj of this.portals3D.values()) {
        const hits = this.raycaster.intersectObjects(portalObj.group.children, true);
        if (hits.length > 0) {
          this.switchMap(portalObj.def.targetMap);
          return;
        }
      }

      // 2. Checa se clicou em algum drop 3D no solo
      for (const [dropId, dropObj] of this.drops3D.entries()) {
        const hits = this.raycaster.intersectObjects(dropObj.group.children, true);
        if (hits.length > 0) {
          this.onDropClicked(dropId);
          return;
        }
      }

      // 3. Chefes chegam por um fluxo separado do MobSpawner.
      for (const [bossId, bossObj] of this.bosses3D.entries()) {
        const hits = this.raycaster.intersectObjects(bossObj.group.children, true);
        if (hits.length > 0) {
          this.onBossClicked(bossId);
          return;
        }
      }

      // 4. Checa se clicou em algum monstro 3D
      for (const [mobId, mobObj] of this.monsters3D.entries()) {
        const hits = this.raycaster.intersectObjects(mobObj.group.children, true);
        if (hits.length > 0) {
          this.onMonsterClicked(mobId);
          return;
        }
      }

      // 5. Checa clique no solo navegável para movimentação
      const groundHits = this.raycaster.intersectObject(this.walkPlane);
      if (groundHits.length > 0) {
        const hitPoint = groundHits[0].point;
        this.onGroundClicked(hitPoint.x, hitPoint.z);
      }
    });
  }

  onGroundClicked(x3d, z3d) {
    this.playerTargetPos.set(x3d, 0, z3d);

    const coords2D = this.to2DCoords(x3d, z3d);
    this.app.playerTargetX = coords2D.x;
    this.app.playerTargetY = coords2D.y;

    this.spawnClickDecal(x3d, z3d);
  }

  onMonsterClicked(mobId) {
    const mob = this.app.monsters.get(mobId);
    if (!mob || mob.isDead) return;

    this.app.selectedTargetId = mobId;
    this.app.updateTargetHud(mob);

    this.app.sendPacket(OPCODES.COMBAT_ATTACK_REQ, {
      targetMobId: mob.id,
      playerX: this.app.playerX,
      playerY: this.app.playerY,
    });

    this.triggerPlayerAttackAnim();
  }

  onBossClicked(bossId) {
    const boss = this.app.activeBosses?.get(bossId);
    if (!boss || boss.isDead) return;

    this.app.selectedBossId = bossId;
    this.app.updateBossHud?.(boss);
    this.app.updateActiveBossesList?.();
    this.app.sendPacket(OPCODES.COMBAT_ATTACK_REQ, {
      targetMobId: boss.id,
      playerX: this.app.playerX,
      playerY: this.app.playerY,
    });
    this.triggerPlayerAttackAnim();
  }

  onDropClicked(dropId) {
    const drop = this.app.groundDrops.get(dropId);
    if (!drop) return;

    this.harmonicAudio?.playItemPickupSound();
    this.app.sendPacket(OPCODES.GROUND_ITEM_PICKUP_REQ, {
      dropId: drop.dropId,
      playerX: this.app.playerX,
      playerY: this.app.playerY,
    });
  }

  spawnClickDecal(x, z) {
    const decalGeom = new THREE.RingGeometry(0.2, 0.45, 24);
    const decalMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const decalMesh = new THREE.Mesh(decalGeom, decalMat);
    decalMesh.rotation.x = -Math.PI / 2;
    decalMesh.position.set(x, 0.03, z);
    this.scene.add(decalMesh);
    this.clickDecals.push({ mesh: decalMesh, life: 0.45 });
  }

  // ==========================================================================
  // DISPARO DE HABILIDADES 3D DO ACTION RPG
  // ==========================================================================
  triggerSkill(skillType) {
    if (skillType === 'cyclone' || skillType === 'TWISTING_SLASH') {
      this.triggerTwistingSlash();
    } else if (skillType === 'death_stab') {
      this.triggerDeathStab();
    } else if (skillType === 'roll') {
      this.triggerRoll();
    }
  }

  triggerPlayerAttackAnim() {
    if (this.playerHero && this.playerHero.updateAnim) {
      this.playerHero.updateAnim('DEATH_STAB', this.clock.getElapsedTime(), 0.1);
    }
  }

  triggerTwistingSlash() {
    this.isSpinning = true;
    this.spinTimer = 0.85;
    this.harmonicAudio.playSkillSound('cyclone');

    const ringGeom = new THREE.TorusGeometry(2.4, 0.06, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.9,
    });
    const slashVortex = new THREE.Mesh(ringGeom, ringMat);
    slashVortex.rotation.x = Math.PI / 2;
    slashVortex.position.set(this.playerGroup.position.x, 1.1, this.playerGroup.position.z);
    this.scene.add(slashVortex);

    const fadeOut = () => {
      slashVortex.scale.multiplyScalar(1.08);
      ringMat.opacity -= 0.08;
      if (ringMat.opacity > 0) {
        requestAnimationFrame(fadeOut);
      } else {
        this.scene.remove(slashVortex);
      }
    };
    fadeOut();
  }

  triggerDeathStab() {
    this.isStabbing = true;
    this.stabTimer = 0.55;
    this.harmonicAudio.playSkillSound('death_stab');
  }

  triggerRoll() {
    this.isRolling = true;
    this.rollTimer = 0.65;
    this.harmonicAudio.playDodgeSound();
  }

  // ==========================================================================
  // DISPARO DO EFEITO 3D DE LEVEL UP (AURÉOLA DOURADA & LUZ SOLAR)
  // ==========================================================================
  triggerLevelUpVFX(newLevel) {
    if (this.activeLevelUpVFX) {
      this.scene.remove(this.activeLevelUpVFX.group);
      this.activeLevelUpVFX = null;
    }

    const vfx = LevelUpSystem.createLevelUp3DGroup(THREE);
    vfx.group.position.set(this.playerGroup.position.x, 0, this.playerGroup.position.z);
    this.scene.add(vfx.group);
    this.activeLevelUpVFX = vfx;

    // Fanfarra Sonora Celestial
    this.harmonicAudio.playLevelUpSound();

    // Texto Flutuante Dourado no Espaço 3D
    const coords2d = this.to2DCoords(this.playerGroup.position.x, this.playerGroup.position.z);
    this.spawnDamageText(coords2d.x, coords2d.y, `⭐ LEVEL UP! NÍVEL ${newLevel} ⭐`, '#facc15');
  }

  // ==========================================================================
  // SINCRONIZAÇÃO DE MONSTROS 3D COM O SERVIDOR
  // ==========================================================================
  createSynchronizedEntity(entityId, entityData, bossCollection = false) {
    const entityType = String(entityData.type || '').toLowerCase();
    const visual = resolveBestiaryRuntimeModel(entityType);
    const isBoss = bossCollection || entityData.isBoss || entityType.startsWith('boss_') || !!visual?.isBoss;
    const isGolden = entityType.startsWith('golden_');
    const modelScale = visual?.scale ?? (isBoss ? 2.4 : isGolden ? 1.4 : 1);
    const fallbackType = visual?.fallbackType || 'SPIDER';
    const coords3D = this.to3DCoords(entityData.x, entityData.y);
    const entity = createMonster(fallbackType, THREE);
    entity.group.position.set(coords3D.x, 0, coords3D.z);
    entity.group.scale.setScalar(modelScale);

    let bossRing = null;
    let goldRing = null;
    if (isBoss) {
      const bossRingGeom = new THREE.RingGeometry(1.6, 2.1, 32);
      bossRingGeom.rotateX(-Math.PI / 2);
      const bossRingMat = new THREE.MeshBasicMaterial({
        color: 0xdc2626,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      bossRing = new THREE.Mesh(bossRingGeom, bossRingMat);
      entity.group.add(bossRing);
    } else if (isGolden) {
      const goldRingGeom = new THREE.RingGeometry(1.2, 1.5, 32);
      goldRingGeom.rotateX(-Math.PI / 2);
      const goldRingMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      goldRing = new THREE.Mesh(goldRingGeom, goldRingMat);
      entity.group.add(goldRing);
    }

    const hpCanvas = document.createElement('canvas');
    hpCanvas.width = 160;
    hpCanvas.height = 28;
    const hpTex = new THREE.CanvasTexture(hpCanvas);
    const spriteMat = new THREE.SpriteMaterial({ map: hpTex });
    const hpSprite = new THREE.Sprite(spriteMat);
    const labelHeight = visual?.labelHeight ?? (isBoss ? 3.6 : 1.9);
    hpSprite.position.y = labelHeight / modelScale;
    hpSprite.scale.set(isBoss ? 2.5 : isGolden ? 1.8 : 1.4, isBoss ? 0.38 : 0.28, 1.0);
    entity.group.add(hpSprite);

    this.scene.add(entity.group);

    const synchronizedEntity = {
      id: entityId,
      group: entity.group,
      entity,
      hpSprite,
      hpCanvas,
      hpTex,
      type: visual?.modelId || fallbackType,
      isBoss,
      isGolden,
      targetPos: new THREE.Vector3(coords3D.x, 0, coords3D.z),
      state: entityData.state || 'IDLE',
      isDead: false,
      glbModel: null,
      animController: null,
      playAction(actionName) {
        if (this.animController) this.animController.playAction(actionName);
      },
    };

    const preserved = [entity.parts?.groundRing, bossRing, goldRing, hpSprite];
    if (visual?.animatedPath) {
      loadAnimatedCreatureGLB(visual.animatedPath, entity.group, THREE, (glbModel, animController) => {
        synchronizedEntity.glbModel = glbModel;
        synchronizedEntity.animController = animController;
        entity.parts.realGLB = glbModel;
      }, preserved);
    } else if (visual?.modelId) {
      loadBestiaryCreatureGLB(visual.modelId, entity.group, THREE, (glbModel) => {
        synchronizedEntity.glbModel = glbModel;
        entity.parts.realGLB = glbModel;
      }, preserved);
    }

    return synchronizedEntity;
  }

  updateSynchronizedEntity(synchronizedEntity, entityData) {
    const coords3D = this.to3DCoords(entityData.x, entityData.y);
    synchronizedEntity.targetPos.set(coords3D.x, 0, coords3D.z);
    synchronizedEntity.state = entityData.state || 'IDLE';

    const maxHp = Math.max(1, Number(entityData.maxHp) || 1);
    const currentHp = Math.max(0, Number(entityData.currentHp) || 0);
    const hpPct = Math.max(0, Math.min(1, currentHp / maxHp));
    const shield = Math.max(0, Number(entityData.currentShield ?? entityData.shield) || 0);
    const maxShield = Math.max(1, Number(entityData.maxShield) || maxHp);
    const shieldPct = Math.max(0, Math.min(1, shield / maxShield));
    const ctx = synchronizedEntity.hpCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 160, 28);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 160, 28);
      ctx.fillStyle = synchronizedEntity.isBoss ? '#ef4444' : (hpPct > 0.4 ? '#10b981' : '#ef4444');
      ctx.fillRect(2, 2, Math.round(156 * hpPct), 24);
      if (shieldPct > 0) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.fillRect(2, 2, Math.round(156 * shieldPct), 8);
      }
      synchronizedEntity.hpTex.needsUpdate = true;
    }

    if (entityData.isDead && !synchronizedEntity.isDead) {
      synchronizedEntity.isDead = true;
      this.animateMonsterDeath(synchronizedEntity);
    } else if (!synchronizedEntity.isDead && synchronizedEntity.animController) {
      if (entityData.state === 'ATTACKING') {
        synchronizedEntity.animController.playAction('attack');
      } else if (entityData.state === 'STAGGERED') {
        synchronizedEntity.animController.playAction('hit');
      }
    }
  }

  syncEntityCollection(serverEntities, renderEntities, bossCollection = false) {
    const entries = serverEntities instanceof Map
      ? serverEntities.entries()
      : Array.isArray(serverEntities)
        ? serverEntities.map((entity) => [entity.id, entity])
        : Object.entries(serverEntities || {});
    const activeIds = new Set();

    for (const [entityId, entityData] of entries) {
      if (!entityData || !entityId) continue;
      activeIds.add(entityId);
      let synchronizedEntity = renderEntities.get(entityId);
      if (!synchronizedEntity) {
        synchronizedEntity = this.createSynchronizedEntity(entityId, entityData, bossCollection);
        renderEntities.set(entityId, synchronizedEntity);
      }
      this.updateSynchronizedEntity(synchronizedEntity, entityData);
    }

    for (const [entityId, synchronizedEntity] of renderEntities.entries()) {
      if (!activeIds.has(entityId)) {
        this.scene.remove(synchronizedEntity.group);
        renderEntities.delete(entityId);
      }
    }
  }

  syncMonsters(serverMonstersMap) {
    this.syncEntityCollection(serverMonstersMap, this.monsters3D, false);
  }

  syncBosses(serverBosses) {
    this.syncEntityCollection(serverBosses, this.bosses3D, true);
  }

  animateMonsterDeath(mob3D) {
    if (mob3D.animController) {
      mob3D.animController.playAction('death');
    }
    const delayBeforeSink = mob3D.animController ? 900 : 80;
    setTimeout(() => {
      let fade = 1.0;
      const sink = () => {
        fade -= 0.04;
        mob3D.group.position.y -= 0.03;
        mob3D.group.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = Math.max(0, fade);
          }
        });
        if (fade > 0) {
          requestAnimationFrame(sink);
        } else {
          this.scene.remove(mob3D.group);
        }
      };
      sink();
    }, delayBeforeSink);
  }

  onEntityDamaged(entityId, isDead, staggered, monsterType = 'spider') {
    const entity3D = this.monsters3D.get(entityId) || this.bosses3D.get(entityId);
    if (!entity3D) return;

    if (isDead) {
      this.harmonicAudio?.playMonsterDeathSound(monsterType);
      if (!entity3D.isDead) {
        entity3D.isDead = true;
        this.animateMonsterDeath(entity3D);
      }
    } else {
      this.harmonicAudio?.playMonsterHitSound(monsterType);
      if (entity3D.animController) {
        entity3D.animController.playAction('hit', 0.1);
        setTimeout(() => {
          if (!entity3D.isDead && entity3D.animController) {
            const moveDist = entity3D.group.position.distanceTo(entity3D.targetPos);
            entity3D.animController.playAction(moveDist > 0.08 ? 'walk' : 'idle', 0.2);
          }
        }, 300);
      }

      // Flash vermelho/alaranjado na malha 3D
      entity3D.group.traverse((child) => {
        if (child.isMesh && child.material) {
          const mat = Array.isArray(child.material) ? child.material[0] : child.material;
          if (mat && mat.emissive) {
            const origColor = mat.emissive.getHex();
            mat.emissive.setHex(0xef4444);
            setTimeout(() => {
              if (mat && mat.emissive) mat.emissive.setHex(origColor);
            }, 120);
          }
        }
      });
    }
  }

  // ==========================================================================
  // SINCRONIZAÇÃO DE DROPS 3D
  // ==========================================================================
  syncGroundDrops(serverDropsMap) {
    const activeDropIds = new Set();

    for (const [dropId, dropData] of serverDropsMap.entries()) {
      activeDropIds.add(dropId);

      if (!this.drops3D.has(dropId)) {
        const coords3D = this.to3DCoords(dropData.x, dropData.y);
        const dropGroup = new THREE.Group();
        dropGroup.position.set(coords3D.x, 0, coords3D.z);

        let jewelColor = 0xf59e0b;
        let isJewel = dropData.isJewel;

        if (dropData.item) {
          const id = dropData.item.defId;
          if (id === 'jewel_of_blessing') jewelColor = 0x38bdf8;
          else if (id === 'jewel_of_soul') jewelColor = 0xc084fc;
          else if (id === 'jewel_of_life') jewelColor = 0x4ade80;
          else if (id === 'jewel_of_chaos') jewelColor = 0xfb923c;
        }

        const gemGeom = isJewel ? new THREE.OctahedronGeometry(0.18, 0) : new THREE.CylinderGeometry(0.15, 0.15, 0.05, 12);
        const gemMat = new THREE.MeshStandardMaterial({
          color: jewelColor,
          emissive: jewelColor,
          emissiveIntensity: 1.5,
          roughness: 0.1,
          metalness: 0.3,
        });
        const gemMesh = new THREE.Mesh(gemGeom, gemMat);
        gemMesh.position.y = 0.35;
        dropGroup.add(gemMesh);

        if (isJewel) {
          const beamGeom = new THREE.CylinderGeometry(0.12, 0.28, 6.5, 16, 1, true);
          const beamMat = new THREE.MeshBasicMaterial({
            color: jewelColor,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
          });
          const beamMesh = new THREE.Mesh(beamGeom, beamMat);
          beamMesh.position.y = 3.25;
          dropGroup.add(beamMesh);

          const dropLight = new THREE.PointLight(jewelColor, 2.5, 5);
          dropLight.position.set(0, 0.6, 0);
          dropGroup.add(dropLight);

          const jewelKey = dropData.item?.defId || 'bless';
          this.harmonicAudio?.playJewelDropSound(jewelKey);
        }

        this.scene.add(dropGroup);
        this.drops3D.set(dropId, { group: dropGroup, mesh: gemMesh, isJewel });
      }
    }

    for (const [dropId, drop3D] of this.drops3D.entries()) {
      if (!serverDropsMap.has(dropId)) {
        this.scene.remove(drop3D.group);
        this.drops3D.delete(dropId);
      }
    }
  }

  // ==========================================================================
  // NÚMEROS DE DANO FLUTUANTES NO ESPAÇO 3D
  // ==========================================================================
  spawnDamageText(x2d, y2d, damage, colorHex = '#ffffff') {
    const coords3D = this.to3DCoords(x2d, y2d);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 32px Rajdhani, sans-serif';
    ctx.fillStyle = colorHex;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText(`${damage}`, 128, 44);

    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 1.0 });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(coords3D.x + (Math.random() - 0.5) * 0.4, 2.1, coords3D.z + (Math.random() - 0.5) * 0.4);
    sprite.scale.set(2.4, 0.6, 1.0);

    this.scene.add(sprite);
    this.floatingTexts.push({ sprite, life: 1.1, maxLife: 1.1 });
  }

  // ==========================================================================
  // LOOP PRINCIPAL DE ANIMAÇÃO & CÂMERA FOLLOW
  // ==========================================================================
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // 1. ATUALIZAÇÃO DA FÍSICA DE TECLADO (WASD) COM RESOLUÇÃO DE COLISÃO
    const kbResult = this.keyboardController.update(delta);
    if (kbResult.isMoving) {
      // Movimento direto contínuo do jogador pelo teclado com deslizamento físico
      const currentPos = { x: this.playerGroup.position.x, z: this.playerGroup.position.z };
      const desiredPos = { x: kbResult.position.x, z: kbResult.position.z };
      const resolved = DasiCollisionEngine.resolveMovement(
        this.currentScenarioId,
        currentPos,
        desiredPos
      );

      this.playerGroup.position.set(resolved.x, 0, resolved.z);
      this.playerGroup.rotation.y = kbResult.rotationY;
      this.playerTargetPos.set(resolved.x, 0, resolved.z);
      this.keyboardController.position.x = resolved.x;
      this.keyboardController.position.z = resolved.z;

      // Sincroniza coordenadas 2D com a lógica de rede do app
      const coords2D = this.to2DCoords(resolved.x, resolved.z);
      this.app.playerX = coords2D.x;
      this.app.playerY = coords2D.y;
      this.app.playerTargetX = coords2D.x;
      this.app.playerTargetY = coords2D.y;
    } else {
      // Movimento autônomo suave em direção ao alvo (Auto-Hunt / Clique no chão) com colisão física
      const moveDiffX = this.playerTargetPos.x - this.playerGroup.position.x;
      const moveDiffZ = this.playerTargetPos.z - this.playerGroup.position.z;
      const dist3D = Math.hypot(moveDiffX, moveDiffZ);

      if (dist3D > 0.12) {
        const moveSpeed = 4.2; // Unidades 3D por segundo
        const step = Math.min(dist3D, moveSpeed * delta);
        const currentPos = { x: this.playerGroup.position.x, z: this.playerGroup.position.z };
        const desiredPos = {
          x: currentPos.x + (moveDiffX / dist3D) * step,
          z: currentPos.z + (moveDiffZ / dist3D) * step,
        };

        const resolved = DasiCollisionEngine.resolveMovement(
          this.currentScenarioId,
          currentPos,
          desiredPos
        );

        this.playerGroup.position.set(resolved.x, 0, resolved.z);
        if (resolved.collided) {
          this.playerTargetPos.set(resolved.x, 0, resolved.z);
        }

        const targetAngle = Math.atan2(moveDiffX, moveDiffZ);
        let diff = targetAngle - this.playerGroup.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.playerGroup.rotation.y += diff * Math.min(1.0, 10.0 * delta);

        const coords2D = this.to2DCoords(resolved.x, resolved.z);
        this.app.playerX = coords2D.x;
        this.app.playerY = coords2D.y;

        this.keyboardController.position.x = resolved.x;
        this.keyboardController.position.z = resolved.z;
      } else {
        const coords2D = this.to2DCoords(this.playerGroup.position.x, this.playerGroup.position.z);
        this.app.playerX = coords2D.x;
        this.app.playerY = coords2D.y;
      }
    }

    // 2. DETECÇÃO DE PROXIMIDADE COM PORTAIS 3D (TELETRANSPORTE)
    if (!this.isTeleporting) {
      const nearbyPortal = PortalSystem.checkProximity(
        this.playerGroup.position.x,
        this.playerGroup.position.z,
        this.currentMap
      );
      if (nearbyPortal) {
        this.isTeleporting = true;
        this.switchMap(nearbyPortal.targetMap);
        setTimeout(() => {
          this.isTeleporting = false;
        }, 2200);
      }
    }

    // 3. ANIMAÇÃO DOS PORTAIS 3D (VÓRTICE & ANÉIS)
    for (const portalObj of this.portals3D.values()) {
      PortalSystem.updatePortalAnimation(portalObj, elapsed, delta);
    }

    // 4. ATUALIZAÇÃO DO EFEITO 3D DE LEVEL UP (AURÉOLA & PARTÍCULAS)
    if (this.activeLevelUpVFX) {
      this.activeLevelUpVFX.group.position.x = this.playerGroup.position.x;
      this.activeLevelUpVFX.group.position.z = this.playerGroup.position.z;
      const stillActive = LevelUpSystem.updateLevelUpAnimation(this.activeLevelUpVFX, delta);
      if (!stillActive) {
        this.scene.remove(this.activeLevelUpVFX.group);
        this.activeLevelUpVFX = null;
      }
    }

    // 5. ANIMAÇÃO CINEMÁTICA DO HERÓI (TWISTING SLASH, STRIDE OU IDLE)
    if (this.isSpinning) {
      this.spinTimer -= delta;
      if (this.spinTimer <= 0) this.isSpinning = false;
      this.playerGroup.rotation.y += delta * 18.0;
      if (this.playerHero && this.playerHero.triggerAnimation) {
        this.playerHero.triggerAnimation('TWISTING_SLASH');
      }
      if (this.playerHero && this.playerHero.updateAnim) {
        this.playerHero.updateAnim('TWISTING_SLASH', elapsed, delta);
      }
    } else if (this.isStabbing) {
      this.stabTimer -= delta;
      if (this.stabTimer <= 0) this.isStabbing = false;
      if (this.playerHero && this.playerHero.triggerAnimation) {
        this.playerHero.triggerAnimation('DEATH_STAB');
      }
      if (this.playerHero && this.playerHero.updateAnim) {
        this.playerHero.updateAnim('DEATH_STAB', elapsed, delta);
      }
    } else if (this.playerHero && this.playerHero.updateAnim) {
      const isHeroWalking = kbResult.isMoving || Math.hypot(this.playerTargetPos.x - this.playerGroup.position.x, this.playerTargetPos.z - this.playerGroup.position.z) > 0.2;
      this.playerHero.updateAnim(isHeroWalking ? 'Walking_A' : 'Idle', elapsed, delta);
    }

    // 6. SUAVE CAMERA FOLLOW ISOMÉTRICO
    this.cameraLookTarget.lerp(this.playerGroup.position, 0.08);
    this.camera.position.set(
      this.cameraLookTarget.x + this.cameraOffset.x,
      this.cameraLookTarget.y + this.cameraOffset.y,
      this.cameraLookTarget.z + this.cameraOffset.z
    );
    this.camera.lookAt(this.cameraLookTarget.x, this.cameraLookTarget.y + 0.6, this.cameraLookTarget.z);

    // 7. ATUALIZAÇÃO DE MONSTROS E CHEFES 3D (COM ANIMATION MIXER & ROTAÇÃO)
    for (const entityMap of [this.monsters3D, this.bosses3D]) {
      for (const entity3D of entityMap.values()) {
        if (!entity3D.isDead) {
          const moveDist = entity3D.group.position.distanceTo(entity3D.targetPos);
          entity3D.group.position.lerp(entity3D.targetPos, 0.15);

          // Rotação suave em direção ao destino de movimento
          if (moveDist > 0.05) {
            const dx = entity3D.targetPos.x - entity3D.group.position.x;
            const dz = entity3D.targetPos.z - entity3D.group.position.z;
            const targetRot = Math.atan2(dx, dz);
            let diff = targetRot - entity3D.group.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            entity3D.group.rotation.y += diff * Math.min(1.0, 10.0 * delta);
          }

          // Atualização de animação esquelética PBR ou procedural
          if (entity3D.animController) {
            if (entity3D.state === 'ATTACKING') {
              entity3D.animController.playAction('attack');
            } else if (entity3D.state === 'STAGGERED') {
              entity3D.animController.playAction('hit');
            } else if (moveDist > 0.08) {
              entity3D.animController.playAction('walk');
            } else {
              entity3D.animController.playAction('idle');
            }
            entity3D.animController.update(delta);
          } else if (entity3D.entity && entity3D.entity.updateAnim) {
            entity3D.entity.updateAnim('WALK', elapsed, delta);
          }
        } else if (entity3D.animController) {
          entity3D.animController.update(delta);
        }
      }
    }

    // 8. ROTAÇÃO CONTÍNUA DOS DROPS 3D
    for (const drop3D of this.drops3D.values()) {
      drop3D.mesh.rotation.y += delta * 2.2;
      drop3D.mesh.position.y = 0.35 + Math.sin(elapsed * 3.5) * 0.06;
    }

    // 9. ATUALIZAÇÃO PROCEDURAL DO CENÁRIO ATIVO
    if (this.currentEnvEntity && typeof this.currentEnvEntity.updateAnim === 'function') {
      this.currentEnvEntity.updateAnim(elapsed, delta);
    }

    // 10. NÚMEROS DE DANO E TEXTOS 3D
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const item = this.floatingTexts[i];
      item.life -= delta;
      item.sprite.position.y += delta * 1.4;
      item.sprite.material.opacity = Math.max(0, item.life / item.maxLife);

      if (item.life <= 0) {
        this.scene.remove(item.sprite);
        this.floatingTexts.splice(i, 1);
      }
    }

    // 11. DECALQUES DE CLIQUE
    for (let i = this.clickDecals.length - 1; i >= 0; i--) {
      const d = this.clickDecals[i];
      d.life -= delta;
      d.mesh.scale.multiplyScalar(1.05);
      d.mesh.material.opacity = d.life / 0.45;
      if (d.life <= 0) {
        this.scene.remove(d.mesh);
        this.clickDecals.splice(i, 1);
      }
    }

    // 12. VIDA AMBIENTAL & FAUNA REATIVA (AVES, MORCEGOS, PEIXES, TOCHAS)
    if (this.ambientLife) {
      this.ambientLife.update(delta, this.playerGroup.position);
    }

    this.renderer.render(this.scene, this.camera);
  }

  renderTelegraph(telegraphData) {
    if (!this.scene) return;
    const { type, radius = 10, angleDegrees = 90, length = 20, width = 4, durationMs = 2500, x = 0, y = 0, direction = 0 } = telegraphData;
    const coords3D = this.to3DCoords(x, y);

    const group = new THREE.Group();
    group.position.set(coords3D.x, 0.04, coords3D.z);

    let geom;
    if (type === 'CONE') {
      const angleRad = (angleDegrees * Math.PI) / 180;
      geom = new THREE.RingGeometry(0.2, radius * 0.45, 32, 1, -angleRad / 2, angleRad);
      group.rotation.y = -direction;
    } else if (type === 'LINE') {
      geom = new THREE.PlaneGeometry(width * 0.45, length * 0.45);
      group.rotation.y = -direction;
    } else {
      // CIRCLE or ARENA
      const rad = (type === 'ARENA' ? Math.max(radius, 20) : radius) * 0.45;
      geom = new THREE.CircleGeometry(rad, 48);
    }
    geom.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    if (type === 'CIRCLE' || type === 'ARENA') {
      const rad = (type === 'ARENA' ? Math.max(radius, 20) : radius) * 0.45;
      const ringGeom = new THREE.RingGeometry(rad - 0.15, rad, 48);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      group.add(new THREE.Mesh(ringGeom, ringMat));
    }

    this.scene.add(group);

    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      mat.opacity = 0.25 + Math.sin(progress * Math.PI * 6) * 0.2;
      if (progress >= 1) {
        clearInterval(interval);
        mat.color.setHex(0xffffff);
        mat.opacity = 0.8;
        setTimeout(() => {
          this.scene.remove(group);
          geom.dispose();
          mat.dispose();
        }, 120);
      }
    }, 33);
  }

  onWindowResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight || 420;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
