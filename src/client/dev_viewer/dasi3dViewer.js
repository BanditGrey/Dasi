/**
 * DASI MMORPG - VISUALIZADOR 3D INTERATIVO EM TEMPO REAL
 * Renderizador WebGL nativo via Three.js (Online & Offline)
 * 
 * Funcionalidades:
 * - Catálogo 100% 3D: Heróis (DK, DW, ELF), Monstros (Spider, Budge Dragon, Bull Fighter, Skeleton) e Cenários (Lorencia, Noria, Devias).
 * - Refinamento Dinâmico em tempo real (+0 até +15 com auras PBR, runas ciano, centelhas e corona celestial).
 * - Reprodutor de Animações Cinemáticas do Action RPG por Classe e Criatura.
 * - Máquina do Caos 3D (Chaos Machine de Noria com forja ativa, engrenagens giratórias e raio de fusão).
 * - Câmera Orbital 360° suave (OrbitControls) com presets direcionais.
 */

import * as THREE from './libs/three.module.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { createHero, createMonster, createEnvironment } from './dasi3dContent.js';
import { createModularHero } from './modularHero.js';
import { buildArmoryShowcase, ARMORY_METADATA } from './dasi3dArmory.js';
import { DasiCollisionEngine } from './dasiCollisionEngine.js';
import { ChaosMachineVFX, HarmonicAudioSynthesizer } from './dasiActionGameplay.js';

export class Dasi3DFeatureViewer {
  constructor(canvasContainerId, initialCategory = 'ENVIRONMENT', initialSubId = 'LORENCIA') {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) {
      console.error(`[Dasi3DViewer] Container ${canvasContainerId} não encontrado.`);
      return;
    }

    // Configurações e Estado
    this.currentCategory = initialCategory; // 'HERO' | 'MONSTER' | 'ENVIRONMENT' | 'CHAOS_MACHINE'
    this.currentSubId = initialSubId;       // 'DK', 'DW', 'ELF' | 'SPIDER', etc. | 'LORENCIA', etc.
    this.currentSetTier = 'DRAGON';
    this.refinementLevel = 9;      // +0 até +15
    this.currentAnim = 'IDLE';
    this.animTime = 0;
    this.clock = new THREE.Clock();

    // Entidades e Grupos de Cena
    this.activeEntity = null;
    this.chaosMachineGroup = new THREE.Group();
    this.particlesGroup = new THREE.Group();
    this.showCollisionDebug = false;
    this.debugCollidersMesh = null;
    this.chaosGears = [];
    this.chaosCore = null;
    this.chaosRings = [];

    // Sistema de Efeitos e Áudio da Chaos Machine
    this.chaosVFX = new ChaosMachineVFX();
    this.harmonicAudio = new HarmonicAudioSynthesizer();
    this.fusionBeamVfx = null;

    this.initScene();
    this.initLights();
    this.buildChaosMachine();
    this.buildParticles();

    // Seleção Inicial Conforme Categoria (Padrão: Cenário Lorencia 3D)
    this.selectEntity(this.currentCategory, this.currentSubId, { setTier: this.currentSetTier });
    if (this.currentCategory === 'HERO') {
      this.updateRefinementGlow(this.refinementLevel);
    }

    window.addEventListener('resize', () => this.onWindowResize());
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06080c);
    this.scene.fog = new THREE.FogExp2(0x06080c, 0.035);

    const width = this.container.clientWidth || 840;
    const height = this.container.clientHeight || 520;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 2.2, 5.0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 80.0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
    this.controls.target.set(0, 1.4, 0);
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0x1a2238, 0.90);
    this.scene.add(ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffecd2, 1.85);
    this.keyLight.position.set(4, 8, 5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 30;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.75);
    fillLight.position.set(-4, 3, -3);
    this.scene.add(fillLight);

    this.rimLight = new THREE.PointLight(0xf59e0b, 2.5, 9);
    this.rimLight.position.set(0, 2.5, -2.5);
    this.scene.add(this.rimLight);
  }

  // ==========================================================================
  // CONSTRUÇÃO PROCEDURAL DA MÁQUINA DO CAOS (NORIA CHAOS MACHINE 3D)
  // ==========================================================================
  buildChaosMachine() {
    this.chaosMachineGroup = new THREE.Group();
    this.chaosMachineGroup.visible = false;

    // Base de Pedra Talhada com Runas
    const baseGeo = new THREE.CylinderGeometry(2.2, 2.6, 0.6, 16);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.8,
      metalness: 0.2,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.3;
    base.receiveShadow = true;
    this.chaosMachineGroup.add(base);

    // Caldeirão Central de Bronze
    const potGeo = new THREE.CylinderGeometry(1.4, 0.9, 1.2, 16);
    this.potMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      metalness: 0.85,
      roughness: 0.35,
    });
    this.potMesh = new THREE.Mesh(potGeo, this.potMat);
    this.potMesh.position.y = 1.1;
    this.potMesh.castShadow = true;
    this.chaosMachineGroup.add(this.potMesh);

    // Engrenagens Mecânicas Rotativas Goblins
    const gearGeo = new THREE.TorusGeometry(0.7, 0.08, 8, 24);
    const gearMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.3,
    });

    this.chaosGears = [];
    for (let i = 0; i < 3; i++) {
      const gear = new THREE.Mesh(gearGeo, gearMat);
      gear.position.set(
        Math.cos((i / 3) * Math.PI * 2) * 1.5,
        1.1 + i * 0.15,
        Math.sin((i / 3) * Math.PI * 2) * 1.5
      );
      gear.rotation.x = Math.PI / 2;
      this.chaosMachineGroup.add(gear);
      this.chaosGears.push({ mesh: gear, speed: (i % 2 === 0 ? 1 : -1) * (1.2 + i * 0.5) });
    }

    // Núcleo de Plasma do Caos
    const coreGeo = new THREE.IcosahedronGeometry(0.42, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xfb923c,
      wireframe: true,
    });
    this.chaosCore = new THREE.Mesh(coreGeo, coreMat);
    this.chaosCore.position.set(0, 2.1, 0);
    this.chaosMachineGroup.add(this.chaosCore);

    // Anéis Concêntricos de Confinamento Magnético
    const ringGeo = new THREE.TorusGeometry(0.65, 0.025, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.chaosRings = [];
    for (let r = 0; r < 2; r++) {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 2.1, 0);
      this.chaosMachineGroup.add(ring);
      this.chaosRings.push(ring);
    }

    // Pedestais das Joias Sagradas (Bless, Soul, Chaos)
    const jewelColors = [0x38bdf8, 0xc084fc, 0xfb923c];
    for (let j = 0; j < 3; j++) {
      const angle = (j / 3) * Math.PI * 2 + Math.PI / 6;
      const jPedGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.8, 8);
      const jPed = new THREE.Mesh(jPedGeo, this.potMat);
      jPed.position.set(Math.cos(angle) * 1.8, 0.8, Math.sin(angle) * 1.8);
      this.chaosMachineGroup.add(jPed);

      // Joia Flutuante
      const jewelGeo = new THREE.OctahedronGeometry(0.14, 0);
      const jewelMat = new THREE.MeshStandardMaterial({
        color: jewelColors[j],
        emissive: jewelColors[j],
        emissiveIntensity: 1.0,
        metalness: 0.2,
        roughness: 0.1,
      });
      const jewel = new THREE.Mesh(jewelGeo, jewelMat);
      jewel.position.set(Math.cos(angle) * 1.8, 1.4, Math.sin(angle) * 1.8);
      this.chaosMachineGroup.add(jewel);
    }

    // Componente 3D do Raio de Fusão Solar e Shockwave
    this.fusionBeamVfx = ChaosMachineVFX.createFusionBeamMesh(THREE);
    this.chaosMachineGroup.add(this.fusionBeamVfx.beamGroup);

    this.scene.add(this.chaosMachineGroup);
  }

  // ==========================================================================
  // DISPARO DA FORJA DA CHAOS MACHINE (SEQUÊNCIA CINEMÁTICA)
  // ==========================================================================
  triggerChaosForge(isSuccess = true, callback) {
    this.chaosVFX.startForge(
      isSuccess,
      (phase) => {
        this.harmonicAudio.playChaosPhaseSound(phase.toLowerCase());
      },
      (success) => {
        if (success) {
          this.harmonicAudio.playChaosPhaseSound('success');
        } else {
          this.harmonicAudio.playChaosPhaseSound('fail');
        }
        if (callback) callback(success);
      }
    );
  }

  // ==========================================================================
  // SISTEMA DE PARTÍCULAS VOLUMÉTRICAS
  // ==========================================================================
  buildParticles() {
    this.particlesGroup = new THREE.Group();
    const count = 120;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 4.0;
      pos[i * 3 + 1] = Math.random() * 3.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.055,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(geo, mat);
    this.particlesGroup.add(this.particleSystem);
    this.scene.add(this.particlesGroup);
  }

  // ==========================================================================
  // SELETOR DINÂMICO DE ENTIDADE (HERÓIS, MONSTROS, CENÁRIOS, MÁQUINA)
  // ==========================================================================
  selectEntity(category, id, options = {}) {
    this.currentCategory = category;
    this.currentSubId = id;
    if (category !== 'ENVIRONMENT') this.onTileFloorChanged?.(null, id);
    if (options.setTier) this.currentSetTier = options.setTier;

    if (this.activeEntity && this.activeEntity.group) {
      this.scene.remove(this.activeEntity.group);
      this.activeEntity = null;
    }

    this.chaosMachineGroup.visible = false;

    // Reseta iluminação e atmosfera para modos não-cenário
    if (category !== 'ENVIRONMENT') {
      this.scene.background.setHex(0x06080c);
      this.scene.fog.color.setHex(0x06080c);
      this.scene.fog.density = 0.035;
      this.keyLight.color.setHex(0xffecd2);
      this.keyLight.intensity = 1.85;
    }

    if (category === 'HERO') {
      const hero = this.modularHeroMode ? createModularHero(THREE, id) : createHero(id, { setTier: this.currentSetTier }, THREE);
      this.activeEntity = hero;
      this.scene.add(hero.group);

      this.controls.target.set(0, 1.4, 0);
      this.camera.position.set(0, 2.2, 4.8);
      this.updateRefinementGlow(this.refinementLevel);

    } else if (category === 'MONSTER') {
      const monster = createMonster(id, THREE);
      this.activeEntity = monster;
      this.scene.add(monster.group);

      if (id === 'SPIDER') {
        this.controls.target.set(0, 0.55, 0);
        this.camera.position.set(0, 1.9, 3.8);
      } else if (id === 'BUDGE_DRAGON') {
        this.controls.target.set(0, 1.1, 0);
        this.camera.position.set(0, 1.9, 3.6);
      } else if (id === 'BULL_FIGHTER') {
        this.controls.target.set(0, 1.6, 0);
        this.camera.position.set(0, 2.4, 4.8);
      } else if (id === 'SKELETON') {
        this.controls.target.set(0, 1.35, 0);
        this.camera.position.set(0, 2.0, 4.0);
      } else if (id === 'ICE_QUEEN') {
        this.controls.target.set(0, 1.4, 0);
        this.camera.position.set(0, 2.1, 4.2);
      } else if (id === 'GORGON') {
        this.controls.target.set(0, 1.4, 0);
        this.camera.position.set(0, 2.2, 4.8);
      } else if (id === 'BALROG') {
        this.controls.target.set(0, 1.8, 0);
        this.camera.position.set(0, 2.6, 5.6);
      } else if (id === 'GOLDEN_TITAN') {
        this.controls.target.set(0, 1.8, 0);
        this.camera.position.set(0, 2.6, 5.4);
      }

    } else if (category === 'ENVIRONMENT') {
      const env = createEnvironment(id, THREE);
      this.activeEntity = env;
      this.scene.add(env.group);
      this.onTileFloorChanged?.(env.tileFloor, id);

      // Reconstroi wireframes de debug de colisão física se ativo
      if (this.debugCollidersMesh) {
        this.scene.remove(this.debugCollidersMesh);
        this.debugCollidersMesh = null;
      }
      if (this.showCollisionDebug) {
        this.debugCollidersMesh = DasiCollisionEngine.createDebugCollidersMesh(id, THREE);
        this.scene.add(this.debugCollidersMesh);
      }

      if (id === 'LORENCIA' || id.startsWith('LOR_')) {
        this.scene.background.setHex(0x0c0e14);
        this.scene.fog.color.setHex(0x0c0e14);
        this.scene.fog.density = 0.010;
        this.keyLight.color.setHex(0xffecd2);
        this.keyLight.intensity = 2.10;
        this.controls.target.set(0, 1.5, 0);
        this.camera.position.set(15.0, 16.0, 19.0);
      } else if (id === 'NORIA' || id.startsWith('NOR_')) {
        this.scene.background.setHex(0x04110a);
        this.scene.fog.color.setHex(0x04110a);
        this.scene.fog.density = 0.012;
        this.keyLight.color.setHex(0xa7f3d0);
        this.keyLight.intensity = 1.80;
        this.controls.target.set(0, 2.0, 0);
        this.camera.position.set(15.0, 15.0, 18.0);
      } else if (id === 'DEVIAS' || id.startsWith('DEV_')) {
        this.scene.background.setHex(0x0d1522);
        this.scene.fog.color.setHex(0x0d1522);
        this.scene.fog.density = 0.012;
        this.keyLight.color.setHex(0xbae6fd);
        this.keyLight.intensity = 1.90;
        this.controls.target.set(0, 2.0, 0);
        this.camera.position.set(15.0, 16.0, 19.0);
      } else if (id === 'DUNGEON' || id.startsWith('DNG_')) {
        this.scene.background.setHex(0x070c08);
        this.scene.fog.color.setHex(0x070c08);
        this.scene.fog.density = 0.016;
        this.keyLight.color.setHex(0x86efac);
        this.keyLight.intensity = 2.20;
        this.controls.target.set(0, 1.5, 0);
        this.camera.position.set(14.0, 15.0, 18.0);
      } else if (id === 'LOST_TOWER' || id.startsWith('LT_')) {
        this.scene.background.setHex(0x160606);
        this.scene.fog.color.setHex(0x160606);
        this.scene.fog.density = 0.014;
        this.keyLight.color.setHex(0xf87171);
        this.keyLight.intensity = 2.40;
        this.controls.target.set(0, 1.8, 0);
        this.camera.position.set(15.0, 16.0, 20.0);
      } else if (id === 'ATLANS' || id.startsWith('ATL_')) {
        this.scene.background.setHex(0x001326);
        this.scene.fog.color.setHex(0x001326);
        this.scene.fog.density = 0.014;
        this.keyLight.color.setHex(0x38bdf8);
        this.keyLight.intensity = 2.40;
        this.controls.target.set(0, 1.5, 0);
        this.camera.position.set(14.0, 15.0, 18.0);
      } else if (id === 'TARKAN' || id.startsWith('TAR_')) {
        this.scene.background.setHex(0x1c0909);
        this.scene.fog.color.setHex(0x1c0909);
        this.scene.fog.density = 0.012;
        this.keyLight.color.setHex(0xfbbf24);
        this.keyLight.intensity = 2.50;
        this.controls.target.set(0, 1.5, 0);
        this.camera.position.set(15.0, 16.0, 19.0);
      } else if (id === 'ICARUS' || id.startsWith('ICA_')) {
        this.scene.background.setHex(0x260d33);
        this.scene.fog.color.setHex(0x260d33);
        this.scene.fog.density = 0.008;
        this.keyLight.color.setHex(0xfbbf24);
        this.keyLight.intensity = 2.60;
        this.controls.target.set(0, 1.0, 0);
        this.camera.position.set(16.0, 18.0, 22.0);
      } else {
        this.controls.target.set(0, 1.5, 0);
        this.camera.position.set(14.0, 15.0, 18.0);
      }

    } else if (category === 'CHAOS_MACHINE') {
      this.chaosMachineGroup.visible = true;
      this.controls.target.set(0, 1.2, 0);
      this.camera.position.set(0, 2.5, 4.5);
    } else if (category === 'ARMORY') {
      const armoryEntity = buildArmoryShowcase(id, options.subType || 'WEAPON', THREE, options);
      this.activeEntity = armoryEntity;
      this.scene.add(armoryEntity.group);

      if (options.subType === 'ARMOR_SET') {
        this.controls.target.set(0, 1.15, 0);
        this.camera.position.set(0, 1.8, 3.8);
      } else {
        this.controls.target.set(0, 1.05, 0);
        this.camera.position.set(0, 1.5, 3.2);
      }
      this.updateRefinementGlow(this.refinementLevel);
    }

    this.controls.update();
  }

  setMode(mode) {
    if (mode === 'HERO') this.selectEntity('HERO', 'DK');
    else if (mode === 'CHAOS_MACHINE') this.selectEntity('CHAOS_MACHINE');
    else if (mode === 'TERRAIN') this.selectEntity('ENVIRONMENT', 'LORENCIA');
  }

  toggleCollisionDebug(show) {
    this.showCollisionDebug = (show !== undefined) ? !!show : !this.showCollisionDebug;
    if (this.debugCollidersMesh) {
      this.scene.remove(this.debugCollidersMesh);
      this.debugCollidersMesh = null;
    }
    if (this.showCollisionDebug && this.currentCategory === 'ENVIRONMENT') {
      this.debugCollidersMesh = DasiCollisionEngine.createDebugCollidersMesh(this.currentSubId, THREE);
      this.scene.add(this.debugCollidersMesh);
    }
    return this.showCollisionDebug;
  }

  updateRefinementGlow(level) {
    this.refinementLevel = level;

    let emissiveColor = new THREE.Color(0x000000);
    let intensity = 0.0;
    let roughness = 0.22;
    let rimIntensity = 1.5;

    if (level <= 6) {
      emissiveColor = new THREE.Color(0x000000);
      intensity = 0.0;
      roughness = 0.25;
      rimIntensity = 1.0;
    } else if (level <= 8) {
      emissiveColor = new THREE.Color(0x38bdf8);
      intensity = 0.9;
      roughness = 0.16;
      rimIntensity = 2.0;
    } else if (level <= 10) {
      emissiveColor = new THREE.Color(0xfbbf24);
      intensity = 1.6;
      roughness = 0.10;
      rimIntensity = 3.0;
    } else if (level <= 12) {
      emissiveColor = new THREE.Color(0xf97316);
      intensity = 2.4;
      roughness = 0.06;
      rimIntensity = 4.0;
    } else {
      emissiveColor = new THREE.Color(0xe879f9);
      intensity = 3.6;
      roughness = 0.02;
      rimIntensity = 5.5;
    }

    if (this.activeEntity && this.activeEntity.glowMaterials) {
      this.activeEntity.glowMaterials.forEach((mat) => {
        if (mat.emissive) {
          mat.emissive.copy(emissiveColor);
          mat.emissiveIntensity = intensity;
          mat.roughness = roughness;
        }
      });
    }

    if (this.activeEntity && typeof this.activeEntity.updateRefinementGlow === 'function') {
      this.activeEntity.updateRefinementGlow(level);
    }

    if (this.rimLight) {
      this.rimLight.color.copy(
        level >= 13 ? new THREE.Color(0xe879f9) :
        level >= 7 ? new THREE.Color(0x38bdf8) :
        new THREE.Color(0xf59e0b)
      );
      this.rimLight.intensity = rimIntensity;
    }

    if (this.particleSystem) {
      this.particleSystem.visible = (level >= 9);
    }
  }

  triggerAnimation(animName) {
    this.currentAnim = animName;
    this.animTime = 0.0;
  }

  setCameraPreset(preset) {
    if (!this.controls || !this.camera) return;

    if (preset === 'RESET') {
      if (this.currentCategory === 'HERO') {
        this.controls.target.set(0, 1.4, 0);
        this.camera.position.set(0, 2.2, 4.8);
      } else if (this.currentCategory === 'MONSTER') {
        this.controls.target.set(0, 1.2, 0);
        this.camera.position.set(0, 2.0, 4.2);
      } else if (this.currentCategory === 'ENVIRONMENT') {
        this.controls.target.set(0, 1.5, 0);
        this.camera.position.set(15.0, 16.0, 19.0);
      } else {
        this.controls.target.set(0, 1.2, 0);
        this.camera.position.set(0, 2.5, 4.5);
      }
    } else if (preset === 'FRONT') {
      this.controls.target.set(0, 1.35, 0);
      this.camera.position.set(0, 1.6, 3.2);
    } else if (preset === 'WINGS') {
      this.controls.target.set(0, 1.45, 0);
      this.camera.position.set(0, 1.9, -3.6);
    } else if (preset === 'BLADE') {
      this.controls.target.set(0.45, 1.15, 0.1);
      this.camera.position.set(1.4, 1.45, 1.8);
    }
    this.controls.update();
  }

  // ==========================================================================
  // LOOP PRINCIPAL DE RENDERIZAÇÃO & ATUALIZAÇÃO CINEMÁTICA
  // ==========================================================================
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();
    this.animTime += delta;

    // 1. Atualização Cinemática da Entidade Ativa
    if (this.activeEntity && typeof this.activeEntity.updateAnim === 'function') {
      this.activeEntity.updateAnim(this.currentAnim, elapsed, delta);
    }

    // 2. Animação da Máquina do Caos (quando ativa)
    if (this.currentCategory === 'CHAOS_MACHINE') {
      const vfxState = this.chaosVFX.update(delta);

      for (const gear of this.chaosGears) {
        gear.mesh.rotation.z += delta * gear.speed * vfxState.gearSpeedMultiplier;
      }

      if (this.potMat) {
        if (vfxState.coreHeat > 0.05) {
          this.potMat.emissive.setHex(0xea580c);
          this.potMat.emissiveIntensity = vfxState.coreHeat * 2.2;
        } else {
          this.potMat.emissive.setHex(0x000000);
          this.potMat.emissiveIntensity = 0.0;
        }
      }

      if (this.fusionBeamVfx) {
        ChaosMachineVFX.applyVfxToMeshes(this.fusionBeamVfx, vfxState, delta);
      }

      if (this.chaosCore) {
        this.chaosCore.rotation.x += delta * 1.5 * vfxState.gearSpeedMultiplier;
        this.chaosCore.rotation.y += delta * 2.0 * vfxState.gearSpeedMultiplier;
        const pulse = 1.0 + Math.sin(elapsed * (4.0 + vfxState.gearSpeedMultiplier)) * 0.15;
        this.chaosCore.scale.set(pulse, pulse, pulse);
      }

      for (let i = 0; i < this.chaosRings.length; i++) {
        const ring = this.chaosRings[i];
        ring.rotation.x = elapsed * (i === 0 ? 2.5 : -2.0) * (1.0 + vfxState.coreHeat * 2.5);
        ring.rotation.y = elapsed * (i === 0 ? 1.8 : 3.0) * (1.0 + vfxState.coreHeat * 2.5);
      }
    }

    // 3. Vórtice de Partículas Volumétricas
    if (this.particleSystem && this.particleSystem.visible) {
      const pos = this.particleSystem.geometry.attributes.position.array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += delta * 0.45;
        if (pos[i * 3 + 1] > 3.5) {
          pos[i * 3 + 1] = 0.2;
        }
      }
      this.particleSystem.geometry.attributes.position.needsUpdate = true;
      this.particlesGroup.rotation.y = elapsed * 0.15;
    }

    // 4. Atualizador Dinâmico de Entidade Ativa (Armaria / Forja 3D)
    if (this.activeEntity && typeof this.activeEntity.update === 'function') {
      this.activeEntity.update(delta);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || 520;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
