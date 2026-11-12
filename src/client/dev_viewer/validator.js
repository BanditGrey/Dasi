/**
 * DASI MMORPG — MOTOR DO ESTÚDIO DE VALIDAÇÃO CANÔNICA (SIM / NÃO)
 * WebGL Three.js PBR, Inspeção de Colisão Física e Registro de Homologação.
 */

import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';

// ============================================================================
// 1. CATÁLOGO MESTRE DOS 23 ASSETS CANÔNICOS OFICIAIS
// ============================================================================
export const VALIDATION_CATALOG = [
  // --- MODELO BASE GOLDEN MASTER (INSPEÇÃO MODULAR DE CAMADAS) ---
  {
    id: 'HERO_DK_MASTER',
    category: 'HERO',
    name: 'Dark Knight (Golden Master Base)',
    subtitle: 'Corpo Completo & Camadas Modulares Canônicas • Dragon Set + 2 Armas',
    glb: 'models/hero_dk_master_base.glb',
    sourceBmd: 'Player01.bmd + Helm03 + Armor03 + Pant03 + Glove03 + Boot03 + Wings01 + Sword02/Sword01',
    collision: { radius: 0.45, height: 1.85, step: 0.35 },
    lore: 'Arquitetura canônica de alta fidelidade: anatomia humana com malhas independentes (cabeça, tronco, mãos, pernas e pés), armadura de placas completa de encaixe perfeito, asas de dragão articuladas e armas clássicas.',
    isModularMaster: true,
  },
  // --- 5 CLASSES HEROICAS ---
  {
    id: 'DK',
    category: 'HERO',
    name: 'Dark Knight (Blade Knight)',
    subtitle: 'Guerreiro Corporal de Lorencia • Dragon Set + Dragon Blade',
    glb: 'models/animated_heroes/hero_dk_animated.glb',
    masterGlb: 'models/hero_dk_master_base.glb',
    animatedGlb: 'models/animated_heroes/hero_dk_animated.glb',
    sourceBmd: 'HelmClass02, HelmMale02, ArmorMale02, Wing06, Sword02, Sword17.bmd',
    collision: { radius: 0.45, height: 1.85, step: 0.35 },
    lore: 'Especialista em combate corpo a corpo, armadura pesada de placas carmesim e corte giratório (Twisting Slash).',
    isModularMaster: true,
  },
  {
    id: 'DW',
    category: 'HERO',
    name: 'Dark Wizard (Soul Master)',
    subtitle: 'Mago Arcano de Lorencia • Legendary Set + Kundun Staff',
    glb: 'models/animated_heroes/hero_dw_animated.glb',
    masterGlb: 'models/hero_dw_master_base.glb',
    animatedGlb: 'models/animated_heroes/hero_dw_animated.glb',
    sourceBmd: 'HelmClass01, HelmMale04, ArmorMale04, Wing05, Staff05.bmd',
    collision: { radius: 0.45, height: 1.80, step: 0.35 },
    lore: 'Mestre das artes arcanas elementais, canalizador de tempestades elétricas, nevascas e escudo de mana.',
    isModularMaster: true,
  },
  {
    id: 'ELF',
    category: 'HERO',
    name: 'Fairy Elf (Muse Elf)',
    subtitle: 'Arqueira dos Bosques de Noria • Guardian Set + Celestial Bow',
    glb: 'models/animated_heroes/hero_elf_animated.glb',
    masterGlb: 'models/hero_elf_master_base.glb',
    animatedGlb: 'models/animated_heroes/hero_elf_animated.glb',
    sourceBmd: 'HelmClass03, HelmElf05, ArmorElf05, Wing04, Bow04.bmd',
    collision: { radius: 0.42, height: 1.75, step: 0.35 },
    lore: 'Sentinela de combate à distância, agilidade extrema, disparos múltiplos (Triple Shot) e bênçãos de suporte.',
    isModularMaster: true,
  },
  {
    id: 'MG',
    category: 'HERO',
    name: 'Magic Gladiator (Duel Master)',
    subtitle: 'Guerreiro Híbrido de Lorencia • Storm Crow Set + Rune Blade',
    glb: 'models/animated_heroes/hero_mg_animated.glb',
    masterGlb: 'models/hero_mg_master_base.glb',
    animatedGlb: 'models/animated_heroes/hero_mg_animated.glb',
    sourceBmd: 'HelmClass04, ArmorMale16, PantMale16, Wing07, Sword16, Sword10.bmd',
    collision: { radius: 0.48, height: 1.90, step: 0.35 },
    lore: 'Cavaleiro místico capaz de empunhar lâminas pesadas e conjurar simultaneamente magias de destruição em massa.',
    isModularMaster: true,
  },
  {
    id: 'DL',
    category: 'HERO',
    name: 'Dark Lord (Lord Emperor)',
    subtitle: 'Soberano das Trevas do Vale de Loren • Dark Steel Set + Scepter',
    glb: 'models/animated_heroes/hero_dl_animated.glb',
    masterGlb: 'models/hero_dl_master_base.glb',
    animatedGlb: 'models/animated_heroes/hero_dl_animated.glb',
    sourceBmd: 'HelmClass05, HelmMale28, ArmorMale28, DarkLordRobe02, Mace05.bmd',
    collision: { radius: 0.48, height: 1.90, step: 0.35 },
    lore: 'Comandante imperial armado com cetro real, capa de liderança e controle absoluto sobre tropas e invocações.',
    isModularMaster: true,
  },

  // --- 6 CHEFES DE BIOMA ---
  {
    id: 'GORGON',
    category: 'BOSS',
    name: 'Gorgon',
    subtitle: 'Soberano do Abismo de Dungeon • Monster12.bmd + Staff05.bmd',
    glb: 'models/bestiary/gorgon.glb',
    sourceBmd: 'Monster12.bmd (Gorgon) + Staff05.bmd (Cajado Serpentino)',
    collision: { radius: 0.85, height: 2.40, step: 0.35 },
    lore: 'Entidade ofídica ancestral armada com báculo encantado que petrifica intrusos nas profundezas de Dungeon.',
  },
  {
    id: 'ICE_QUEEN',
    category: 'BOSS',
    name: 'Ice Queen',
    subtitle: 'A Rainha Glacial de Devias • Monster19.bmd + Staff02.bmd',
    glb: 'models/bestiary/ice_queen.glb',
    sourceBmd: 'Monster19.bmd (Ice Queen) + Staff02.bmd (Cetro de Gelo)',
    collision: { radius: 0.55, height: 2.00, step: 0.35 },
    lore: 'Monarca das neves eternas de Devias, capaz de desacelerar o movimento de combatentes com geada mortal.',
  },
  {
    id: 'BALROG',
    category: 'BOSS',
    name: 'Balrog',
    subtitle: 'Lorde Vulcânico de Lost Tower • Monster28.bmd + Spear10.bmd',
    glb: 'models/bestiary/balrog.glb',
    sourceBmd: 'Monster28.bmd (Balrog) + Spear10.bmd (Foice das Chamas)',
    collision: { radius: 1.10, height: 3.20, step: 0.45 },
    lore: 'Demônio alado de magma que patrulha o topo de Lost Tower desferindo golpes incendiários devastadores.',
  },
  {
    id: 'HYDRA',
    category: 'BOSS',
    name: 'Hydra',
    subtitle: 'Serpente das Profundezas de Atlans • Monster38.bmd (7 malhas)',
    glb: 'models/bestiary/hydra.glb',
    sourceBmd: 'Monster38.bmd (Hydra Submeshes 0..6)',
    collision: { radius: 1.40, height: 3.00, step: 0.45 },
    lore: 'Serpente aquática colossal com múltiplos corpos articulados e escamas bioluminescentes no oceano de Atlans.',
  },
  {
    id: 'ZAIKAN',
    category: 'BOSS',
    name: 'Zaikan',
    subtitle: 'O Demônio do Deserto Carmesim de Tarkan • Monster43.bmd',
    glb: 'models/bestiary/zaikan.glb',
    sourceBmd: 'Monster43.bmd (Zaikan Submeshes 0..2)',
    collision: { radius: 1.20, height: 2.80, step: 0.45 },
    lore: 'Titã escorpiônico mutante que emerge das tempestades de areia de Tarkan com ferrões perfurantes de alto impacto.',
  },
  {
    id: 'KUNDUN',
    category: 'BOSS',
    name: 'Kundun',
    subtitle: 'Lorde da Escuridão e Caos de Kalima • Monster65.bmd + Staff12.bmd',
    glb: 'models/bestiary/kundun.glb',
    sourceBmd: 'Monster65.bmd (10 malhas) + Staff12.bmd (Cajado do Caos)',
    collision: { radius: 1.50, height: 3.60, step: 0.45 },
    lore: 'O Supremo Mestre do Caos de Kalima. Detém 10 sub-malhas de pura energia caótica e o lendário cajado do abismo.',
  },

  // --- 6 CRIATURAS DA INVASÃO DOURADA ---
  {
    id: 'GOLDEN_BUDGE_DRAGON',
    category: 'GOLDEN',
    name: 'Golden Budge Dragon',
    subtitle: 'Pequeno Dragão Áureo de Lorencia • Monster03.bmd (PBR Ouro)',
    glb: 'models/bestiary/golden_budge_dragon.glb',
    sourceBmd: 'Monster03.bmd (Budge Dragon) + Multiplicador Dourado PBR',
    collision: { radius: 0.40, height: 1.00, step: 0.25 },
    lore: 'Alvo áureo primordial das primeiras invasões que dropa a lendária Box of Kundun +1 ao ser derrotado.',
  },
  {
    id: 'GOLDEN_TITAN',
    category: 'GOLDEN',
    name: 'Golden Titan',
    subtitle: 'Colosso Áureo de Lorencia • Monster06.bmd + Axe03.bmd',
    glb: 'models/bestiary/golden_titan.glb',
    sourceBmd: 'Monster06.bmd + Axe03.bmd (Machado Solar)',
    collision: { radius: 0.90, height: 2.60, step: 0.40 },
    lore: 'Guerreiro gigante revestido em ouro polido armado com machado pesado de combate.',
  },
  {
    id: 'GOLDEN_SOLDIER',
    category: 'GOLDEN',
    name: 'Golden Soldier',
    subtitle: 'Sentinela Dourado de Devias • Monster30.bmd + Sword15.bmd',
    glb: 'models/bestiary/golden_soldier.glb',
    sourceBmd: 'Monster30.bmd + Sword15.bmd (Lâmina Solar)',
    collision: { radius: 0.60, height: 2.10, step: 0.35 },
    lore: 'Sentinela blindado que acompanha as tropas invasoras com espada áurea e alta velocidade de ataque.',
  },
  {
    id: 'GOLDEN_DRAGON',
    category: 'GOLDEN',
    name: 'Golden Dragon',
    subtitle: 'Grande Dragão Alado Dourado • Monster32.bmd',
    glb: 'models/bestiary/golden_dragon.glb',
    sourceBmd: 'Monster32.bmd (Grande Dragão Dourado)',
    collision: { radius: 1.20, height: 2.80, step: 0.45 },
    lore: 'Predador alado supremo que sobrevoa Lorencia e Noria durante invasões douradas anunciadas no servidor.',
  },
  {
    id: 'GOLDEN_LIZARD_KING',
    category: 'GOLDEN',
    name: 'Golden Lizard King',
    subtitle: 'Monarca Sauriano Dourado de Atlans • Monster37.bmd + Staff07.bmd',
    glb: 'models/bestiary/golden_lizard_king.glb',
    sourceBmd: 'Monster37.bmd + Staff07.bmd (Cajado Ofídico)',
    collision: { radius: 0.85, height: 2.40, step: 0.40 },
    lore: 'Líder dos répteis marinhos imbuído pelo poder da invasão áurea, com alta regeneração e dano mágico.',
  },
  {
    id: 'GOLDEN_TANTALOS',
    category: 'GOLDEN',
    name: 'Golden Tantalos',
    subtitle: 'Guardião Áureo de Tarkan • Monster43.bmd',
    glb: 'models/bestiary/golden_tantalos.glb',
    sourceBmd: 'Monster43.bmd (Tantalos Áureo)',
    collision: { radius: 1.20, height: 2.80, step: 0.45 },
    lore: 'O guardião do deserto de Tarkan em versão dourada, portador da Box of Kundun +5.',
  },

  // --- 6 CRIATURAS DE CAMPO CLÁSSICAS ---
  {
    id: 'SPIDER',
    category: 'FIELD',
    name: 'Spider',
    subtitle: 'Aranha Venenosa das Planícies • Monster10.bmd',
    glb: 'models/bestiary/spider.glb',
    sourceBmd: 'Monster10.bmd (Spider)',
    collision: { radius: 0.45, height: 0.70, step: 0.25 },
    lore: 'Criatura inicial das planícies com movimentos rápidos de patas e ferrões de peçonha leve.',
  },
  {
    id: 'BULL_FIGHTER',
    category: 'FIELD',
    name: 'Bull Fighter',
    subtitle: 'Minotauro Brutal de Lorencia • Monster01.bmd',
    glb: 'models/bestiary/bull_fighter.glb',
    sourceBmd: 'Monster01.bmd (Bull Fighter)',
    collision: { radius: 0.65, height: 1.90, step: 0.35 },
    lore: 'Minotauro couraçado que avança em investida física contra guerreiros novatos nos portões de Lorencia.',
  },
  {
    id: 'HOUND',
    category: 'FIELD',
    name: 'Hound',
    subtitle: 'Cão Infernal de Lorencia • Monster02.bmd',
    glb: 'models/bestiary/hound.glb',
    sourceBmd: 'Monster02.bmd (Hound)',
    collision: { radius: 0.50, height: 1.10, step: 0.30 },
    lore: 'Fera canina veloz com mandíbulas afiadas e dentes de predador que caça em matilha nos arredores da cidade.',
  },
  {
    id: 'SKELETON',
    category: 'FIELD',
    name: 'Skeleton',
    subtitle: 'Guerreiro Esqueleto de Dungeon • Monster15.bmd',
    glb: 'models/bestiary/skeleton.glb',
    sourceBmd: 'Monster15.bmd (Skeleton Warrior)',
    collision: { radius: 0.45, height: 1.80, step: 0.35 },
    lore: 'Restos mortais reanimados empunhando espadas de ferro enferrujadas nos corredores sombrios de Dungeon.',
  },
  {
    id: 'LICH',
    category: 'FIELD',
    name: 'Lich',
    subtitle: 'Feiticeiro Necromante de Dungeon • Monster05.bmd',
    glb: 'models/bestiary/lich.glb',
    sourceBmd: 'Monster05.bmd (Lich Necromancer)',
    collision: { radius: 0.55, height: 1.90, step: 0.35 },
    lore: 'Necromante flutuante com túnica mágica que conjura orbes venenosos e feitiços de maldição à distância.',
  },
  {
    id: 'DEATH_KNIGHT',
    category: 'FIELD',
    name: 'Death Knight',
    subtitle: 'Cavaleiro da Morte de Lost Tower • Monster30.bmd + Sword15.bmd',
    glb: 'models/bestiary/death_knight.glb',
    sourceBmd: 'Monster30.bmd + Sword15.bmd (Lâmina da Morte)',
    collision: { radius: 0.60, height: 2.10, step: 0.35 },
    lore: 'Guerreiro caído de Lost Tower revestido em armadura negra com cortes pesados de lâmina larga.',
  },
];

// ============================================================================
// 2. ARMAZENAMENTO PERSISTENTE LOCAL (localStorage)
// ============================================================================
const STORAGE_KEY = 'dasi_validation_decisions_v1';

function loadDecisions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('[Validator] Falha ao carregar decisões do localStorage:', e);
    return {};
  }
}

function saveDecisions(decisions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
  } catch (e) {
    console.error('[Validator] Falha ao salvar decisões no localStorage:', e);
  }
}

// ============================================================================
// 3. CLASSE CONTROLADORA DO ESTÚDIO DE VALIDAÇÃO
// ============================================================================
export class ValidationStudio {
  constructor() {
    this.catalog = VALIDATION_CATALOG;
    this.decisions = loadDecisions();
    this.activeIndex = 0;
    this.currentFilter = 'ALL';
    this.searchQuery = '';

    // Three.js State
    this.container = document.getElementById('val-canvas-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // 3D Objects State
    this.currentModel = null;
    this.currentColliderGroup = null;
    this.gridHelper = null;
    this.mixer = null;
    this.activeAction = null;
    this.wireframeMode = false;
    this.showCollision = true;
    this.showGrid = true;
    this.showWings = true;
        this.isPlayingAnim = false; // SEMPRE COMEÇA PARADO CONFORME DIRETRIZ!

    // Estado de Camadas Modulares (Inspeção Canônica de Anatomia & Equipamentos)
    this.layersState = {
      body: true,      // Body_Head, Body_Chest, Body_Gloves, Body_Legs, Body_Boots
      helm: true,      // Armor_Helm
      chest: true,     // Armor_Chest
      gloves: true,    // Armor_Gloves
      legs: true,      // Armor_Legs
      boots: true,     // Armor_Boots
      wings: true,     // Wings_Dragon
      weapon_r: true,  // Weapon_Right
      weapon_l: true,  // Weapon_Left
    };

    // Cache de GLTF
    this.gltfLoader = new GLTFLoader();

    this.initThree();
    this.bindDOM();
    this.renderItemList();
    this.selectItem(0);
    this.updateProgressStats();
  }

  // --------------------------------------------------------------------------
  // INICIALIZAÇÃO DA CENA THREE.JS
  // --------------------------------------------------------------------------
  initThree() {
    if (!this.container) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090d);
    this.scene.fog = new THREE.FogExp2(0x07090d, 0.035);

    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;

    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 150);
    this.camera.position.set(0, 2.4, 5.2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.target.set(0, 1.2, 0);
    this.controls.minDistance = 1.0;
    this.controls.maxDistance = 25.0;

    // Iluminação PBR de Estúdio
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff3e0, 2.2);
    sunLight.position.set(5, 10, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    fillLight.position.set(-6, 4, -4);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xf59e0b, 1.8, 15);
    rimLight.position.set(0, 4, -3);
    this.scene.add(rimLight);

    // Grid de Solo com Marcação Métrica
    this.gridHelper = new THREE.GridHelper(10, 20, 0xf59e0b, 0x334155);
    this.gridHelper.position.y = 0.0;
    this.scene.add(this.gridHelper);

    // Anel Central de Spawn
    const ringGeom = new THREE.RingGeometry(0.8, 0.85, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.005;
    this.scene.add(ringMesh);

    // Loop de Renderização
    window.addEventListener('resize', () => this.onWindowResize());
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    if (this.mixer && this.isPlayingAnim) {
      this.mixer.update(delta);
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.currentModel) {
      this.fitCameraToObject(this.currentModel);
    }
  }

  // --------------------------------------------------------------------------
  // CRIAÇÃO DA CÁPSULA WIREFRAME DE COLISÃO OFICIAL (MU ONLINE)
  // --------------------------------------------------------------------------
  createCapsuleWireframe(radius, height, stepHeight) {
    const group = new THREE.Group();
    group.name = 'COLLISION_CAPSULE_VISUAL';

    const cylHeight = Math.max(0.1, height - (radius * 2));
    const cylGeom = new THREE.CylinderGeometry(radius, radius, cylHeight, 24, 1, true);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });

    // Cilindro central
    const cylWire = new THREE.Mesh(cylGeom, wireMat);
    const cylFill = new THREE.Mesh(cylGeom, fillMat);
    const cylGroup = new THREE.Group();
    cylGroup.add(cylWire, cylFill);
    cylGroup.position.y = radius + (cylHeight / 2);
    group.add(cylGroup);

    // Cúpula superior
    const domeGeom = new THREE.SphereGeometry(radius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeWire = new THREE.Mesh(domeGeom, wireMat);
    const domeFill = new THREE.Mesh(domeGeom, fillMat);
    const domeGroup = new THREE.Group();
    domeGroup.add(domeWire, domeFill);
    domeGroup.position.y = radius + cylHeight;
    group.add(domeGroup);

    // Cúpula inferior
    const bottomDomeGeom = new THREE.SphereGeometry(radius, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bottomDomeWire = new THREE.Mesh(bottomDomeGeom, wireMat);
    const bottomDomeFill = new THREE.Mesh(bottomDomeGeom, fillMat);
    const bottomGroup = new THREE.Group();
    bottomGroup.add(bottomDomeWire, bottomDomeFill);
    bottomGroup.position.y = radius;
    group.add(bottomGroup);

    // Indicador de Step Height (Degrau transponível)
    if (stepHeight > 0) {
      const stepGeom = new THREE.RingGeometry(radius * 0.98, radius * 1.05, 32);
      const stepMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
      const stepMesh = new THREE.Mesh(stepGeom, stepMat);
      stepMesh.rotation.x = -Math.PI / 2;
      stepMesh.position.y = stepHeight;
      group.add(stepMesh);
    }

    return group;
  }

  // --------------------------------------------------------------------------
  // CARGA DO MODELO 3D SELECIONADO
  // --------------------------------------------------------------------------
  async loadModel(asset) {
    // Limpa modelo e colisor anterior
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.currentModel.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose();
          if (Array.isArray(o.material)) o.material.forEach((m) => m?.dispose());
          else o.material?.dispose();
        }
      });
      this.currentModel = null;
    }

    if (this.currentColliderGroup) {
      this.scene.remove(this.currentColliderGroup);
      this.currentColliderGroup = null;
    }

    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }

    this.showToast(`Carregando ${asset.name}...`);

    try {
      const gltf = await this.gltfLoader.loadAsync(asset.glb);
      const root = gltf.scene;
      root.name = `ACTIVE_VALIDATION_${asset.id}`;

      let totalVerts = 0;
      let meshCount = 0;

      root.traverse((obj) => {
        if (obj.isMesh) {
          meshCount++;
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (obj.geometry) {
            const count = obj.geometry.attributes.position ? obj.geometry.attributes.position.count : 0;
            totalVerts += count;
          }
          if (this.wireframeMode && obj.material) {
            obj.material.wireframe = true;
          }
        }
      });

      this.currentModel = root;
      this.scene.add(root);

      // Atualiza métricas geométricas no painel
      document.getElementById('val-metric-verts').textContent = totalVerts.toLocaleString('pt-BR');
      document.getElementById('val-metric-meshes').textContent = `${meshCount} sub-malhas`;

      // Cria e anexa a cápsula de colisão
      const col = asset.collision;
      this.currentColliderGroup = this.createCapsuleWireframe(col.radius, col.height, col.step);
      this.currentColliderGroup.visible = this.showCollision;
      this.scene.add(this.currentColliderGroup);

      // Aplica estado de visibilidade das asas/capas
      this.applyWingsVisibility(root);

      // Configuração de Animação (SEMPRE COMEÇA PARADO NA POSTURA ERETA IDLE/STAND!)
      const animSelect = document.getElementById('val-anim-select');
      const animBtn = document.getElementById('tool-toggle-anim');
      this.isPlayingAnim = false;
      if (animBtn) {
        animBtn.classList.remove('active');
        animBtn.textContent = '⏸️ Parado (Clique p/ Animar)';
      }

      animSelect.innerHTML = '';
      if (gltf.animations && gltf.animations.length > 0) {
        this.currentAnimations = gltf.animations;
        root.animations = gltf.animations;
        animSelect.style.display = 'inline-block';
        this.mixer = new THREE.AnimationMixer(root);

        // Seleciona clipe ereto de repouso (Idle / Stand / Breath)
        const defaultClip = gltf.animations.find(a => /^idle$/i.test(a.name)) ||
                            gltf.animations.find(a => /^idle_loop$/i.test(a.name)) ||
                            gltf.animations.find(a => /idle_shield|sword_idle/i.test(a.name)) ||
                            gltf.animations.find(a => /idle|stand|breath|rest/i.test(a.name)) ||
                            gltf.animations[0];

        gltf.animations.forEach((clip) => {
          const opt = document.createElement('option');
          opt.value = clip.name;
          opt.textContent = `🎬 ${clip.name} (${clip.duration.toFixed(1)}s)`;
          if (clip.name === defaultClip.name) {
            opt.selected = true;
          }
          animSelect.appendChild(opt);
        });

        animSelect.value = defaultClip.name;

        // Postura estática inicial ereta (Idle pausado no frame 0)
        this.activeAction = this.mixer.clipAction(defaultClip);
        this.activeAction.play();
        this.activeAction.paused = true;
        this.mixer.update(0);
        root.updateMatrixWorld(true);
      } else {
        this.currentAnimations = [];
        animSelect.style.display = 'none';
      }

      // Detecção de Camadas Modulares (Dark Knight Master Base ou similares)
      Object.keys(this.layersState).forEach(k => this.layersState[k] = true);
      // O corpo nu fica desativado por padrão sob armadura completa para evitar z-fighting
      this.layersState.body = false;
      this.syncLayerButtonsUI();

      const isModular = !!asset.isModularMaster ||
        root.children.some(c => /^(body_|armor_|weapon_|wings_)/i.test(c.name)) ||
        root.getObjectByName('Body_Head') !== null ||
        root.getObjectByName('body_blockout') !== null;

      const layersBar = document.getElementById('val-layers-bar');
      const modularSection = document.getElementById('val-modular-section');
      if (layersBar) layersBar.style.display = isModular ? 'flex' : 'none';
      if (modularSection) modularSection.style.display = isModular ? 'block' : 'none';

      if (isModular) {
        this.applyLayerVisibility();
      } else {
        this.updateModelMetrics();
      }

      // Enquadramento Ótico da Câmera com Safe Area livre de oclusão de UI
      this.fitCameraToObject(root);

    } catch (err) {
      console.error(`[Validator] Erro ao carregar GLB ${asset.glb}:`, err);
      this.showToast(`❌ Falha ao carregar ${asset.glb}`);
    }
  }

  // --------------------------------------------------------------------------
  // ENQUADRAMENTO DE CÂMERA COM SAFE AREA & VISIBILIDADE DAS ASAS
  // --------------------------------------------------------------------------
  computeVisibleBoundingBox(object) {
    const box = new THREE.Box3();
    let hasVisibleMesh = false;

    object.updateMatrixWorld(true);

    object.traverse((child) => {
      if (child.isMesh && child.visible) {
        hasVisibleMesh = true;
        if (child.isSkinnedMesh) {
          const meshBox = new THREE.Box3().setFromObject(child);
          if (!meshBox.isEmpty()) {
            box.union(meshBox);
            return;
          }
        }
        if (child.geometry) {
          if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
          if (child.geometry.boundingBox) {
            const geomBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
            box.union(geomBox);
          }
        }
      }
    });

    if (!hasVisibleMesh || box.isEmpty()) {
      return new THREE.Box3().setFromObject(object);
    }
    return box;
  }

  fitCameraToObject(object, padding = 1.25) {
    if (!object || !this.camera || !this.controls) return;

    object.updateMatrixWorld(true);

    const box = this.computeVisibleBoundingBox(object);
    if (box.isEmpty()) return;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Dimensões do viewport central
    const containerH = this.container.clientHeight || window.innerHeight || 600;
    const containerW = this.container.clientWidth || window.innerWidth || 800;

    // Altura ocupada por elementos flutuantes de UI:
    // Barra superior (.val-3d-toolbar): top 14px + altura ~48px + margem segura = ~85px
    // Barra inferior (.val-decision-bar): bottom 16px + altura ~76px + margem segura = ~120px
    const layersBar = document.getElementById('val-layers-bar');
    const hasLayersBar = layersBar && layersBar.style.display !== 'none';
    const topUiInset = hasLayersBar ? 100 : 85;
    const bottomUiInset = 120;
    const safeHeightPx = Math.max(180, containerH - (topUiInset + bottomUiInset));
    const safeHeightRatio = safeHeightPx / containerH;

    // Margem de segurança horizontal (5% em cada borda lateral)
    const safeWidthRatio = 0.90;

    const fovRad = this.camera.fov * (Math.PI / 180);
    const aspect = this.camera.aspect || (containerW / containerH);

    // Distância necessária para enquadrar perfeitamente a altura vertical dentro da Safe Area livre
    const distVertical = (size.y / 2) / (Math.tan(fovRad / 2) * safeHeightRatio);

    // Distância necessária para a largura (envergadura das asas)
    const distHorizontal = (size.x / 2) / (Math.tan(fovRad / 2) * aspect * safeWidthRatio);

    // Distância necessária para profundidade tridimensional
    const distDepth = (size.z / 2) * 0.8;

    // Distância final com padding ergonômico
    const distance = Math.max(distVertical, distHorizontal, distDepth, 4.2) * padding;

    // Compensação óptica vertical: o centro livre fica ligeiramente acima do centro da tela
    const deltaYPx = (bottomUiInset - topUiInset) / 2;
    const worldHeightAtDistance = 2 * distance * Math.tan(fovRad / 2);
    const opticalOffsetWorld = (deltaYPx / containerH) * worldHeightAtDistance;

    const targetY = center.y - opticalOffsetWorld;
    this.controls.target.set(center.x, Math.max(0.4, targetY), center.z);

    this.camera.position.set(
      center.x,
      targetY + (size.y * 0.04),
      center.z + distance
    );

    this.camera.near = 0.05;
    this.camera.far = Math.max(300, distance * 12);
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }


  // --------------------------------------------------------------------------
  // INSPEÇÃO MODULAR DE CAMADAS (ANATOMIA, ARMADURA, ASAS E ARMAS)
  // --------------------------------------------------------------------------
  updateModelMetrics() {
    if (!this.currentModel) return;

    let totalVerts = 0;
    let visibleVerts = 0;
    let totalMeshes = 0;
    let visibleMeshes = 0;
    const activeNodes = [];

    this.currentModel.traverse((obj) => {
      if (obj.isMesh) {
        totalMeshes++;
        const count = obj.geometry?.attributes?.position ? obj.geometry.attributes.position.count : 0;
        totalVerts += count;
        if (obj.visible) {
          visibleMeshes++;
          visibleVerts += count;
          activeNodes.push(obj.name || 'malha');
        }
      }
    });

    const vertElem = document.getElementById('val-metric-verts');
    const meshElem = document.getElementById('val-metric-meshes');
    if (vertElem) {
      vertElem.textContent = visibleVerts.toLocaleString('pt-BR');
      vertElem.title = `${visibleVerts.toLocaleString('pt-BR')} vértices visíveis de ${totalVerts.toLocaleString('pt-BR')} totais`;
    }
    if (meshElem) {
      meshElem.textContent = `${visibleMeshes}/${totalMeshes} nós ativos`;
      meshElem.title = `Nós ativos: ${activeNodes.join(', ')}`;
    }

    const badgeModular = document.getElementById('val-modular-badge');
    if (badgeModular) {
      badgeModular.textContent = `${visibleMeshes} / ${totalMeshes} NÓS ATIVOS`;
    }
  }

  applyLayerVisibility() {
    if (!this.currentModel) return;

    this.currentModel.traverse((child) => {
      if (!child.isMesh) return;
      const n = ((child.name || '') + ' ' + (child.parent?.name || '')).toLowerCase();

      // 1. Corpo Base (Anatomia)
      if (n.startsWith('body_') || n.includes('body_blockout') || n.includes('base_head') ||
          n.includes('base_chest') || n.includes('base_gloves') || n.includes('base_legs') || n.includes('base_boots')) {
        if (this.layersState.body) {
          child.visible = true;
        } else {
          // Substituição canônica inteligente: mostra a pele/anatomia apenas se a peça de armadura estiver oculta
          if (n.includes('head') && !this.layersState.helm) child.visible = true;
          else if (n.includes('chest') && !this.layersState.chest) child.visible = true;
          else if (n.includes('gloves') && !this.layersState.gloves) child.visible = true;
          else if (n.includes('legs') && !this.layersState.legs) child.visible = true;
          else if (n.includes('boots') && !this.layersState.boots) child.visible = true;
          else child.visible = false;
        }
      }
      // 2. Elmo
      else if (n.startsWith('armor_helm') || n.includes('slot_helmet') || n.includes('helmet') || n.includes('dragon_helm')) {
        child.visible = this.layersState.helm;
      }
      // 3. Peitoral / Ombreiras
      else if (n.startsWith('armor_chest') || n.includes('slot_chest') || n.includes('slot_shoulders') || n.includes('dragon_chest')) {
        child.visible = this.layersState.chest;
      }
      // 4. Luvas / Manoplas
      else if (n.startsWith('armor_gloves') || n.includes('slot_gloves') || n.includes('dragon_gloves')) {
        child.visible = this.layersState.gloves;
      }
      // 5. Calças / Perneiras
      else if (n.startsWith('armor_legs') || n.includes('slot_legs') || n.includes('dragon_legs')) {
        child.visible = this.layersState.legs;
      }
      // 6. Botas de Placas
      else if (n.startsWith('armor_boots') || n.includes('slot_boots') || n.includes('dragon_boots')) {
        child.visible = this.layersState.boots;
      }
      // 7. Asas / Capa
      else if (n.startsWith('wings_') || n.includes('wings') || n.includes('cape') || n.includes('mantle')) {
        child.visible = this.layersState.wings && this.showWings;
      }
      // 8. Arco (Fairy Elf)
      else if (n.includes('elf_weapon') || n.includes('bow')) {
        child.visible = this.layersState.weapon_r || this.layersState.weapon_l;
      }
      // 9. Arma Direita
      else if (n.startsWith('weapon_right') || n.includes('weapon_r') || n.includes('dragon_blade') ||
               (n.includes('weapon') && !n.includes('left') && !n.includes('archangel'))) {
        child.visible = this.layersState.weapon_r;
      }
      // 10. Arma Esquerda
      else if (n.startsWith('weapon_left') || n.includes('weapon_l') || n.includes('archangel') || n.includes('shield')) {
        child.visible = this.layersState.weapon_l;
      }
    });

    this.updateModelMetrics();
    this.fitCameraToObject(this.currentModel);
    this.syncLayerButtonsUI();
  }

  setLayerVisibility(layerKey, isVisible) {
    if (layerKey in this.layersState) {
      this.layersState[layerKey] = isVisible;
      if (layerKey === 'wings') {
        this.showWings = isVisible;
        const wingsBtn = document.getElementById('tool-toggle-wings');
        if (wingsBtn) wingsBtn.classList.toggle('active', this.showWings);
      }
      this.applyLayerVisibility();
      this.showToast(`Camada [${layerKey.toUpperCase()}] ${isVisible ? 'visível ✅' : 'oculta ❌'}`);
    }
  }

  toggleLayer(layerKey) {
    this.setLayerVisibility(layerKey, !this.layersState[layerKey]);
  }

  setLayerPreset(preset) {
    if (preset === 'ALL_ARMOR') {
      Object.keys(this.layersState).forEach(k => this.layersState[k] = true);
      this.showWings = true;
      this.showToast('✨ Armadura Completa, Asas e Armas ativadas');
    } else if (preset === 'BODY_ONLY') {
      this.layersState.body = true;
      this.layersState.helm = false;
      this.layersState.chest = false;
      this.layersState.gloves = false;
      this.layersState.legs = false;
      this.layersState.boots = false;
      this.layersState.wings = false;
      this.layersState.weapon_r = false;
      this.layersState.weapon_l = false;
      this.showWings = false;
      this.showToast('👤 Visualizando anatomia corporal limpa (sem armaduras)');
    } else if (preset === 'ARMOR_ONLY') {
      this.layersState.body = false;
      this.layersState.helm = true;
      this.layersState.chest = true;
      this.layersState.gloves = true;
      this.layersState.legs = true;
      this.layersState.boots = true;
      this.layersState.wings = true;
      this.layersState.weapon_r = true;
      this.layersState.weapon_l = true;
      this.showToast('🛡️ Visualizando conjunto de armadura de placas (sem corpo)');
    }
    const wingsBtn = document.getElementById('tool-toggle-wings');
    if (wingsBtn) wingsBtn.classList.toggle('active', this.showWings);
    this.applyLayerVisibility();
  }

  syncLayerButtonsUI() {
    const layerKeys = ['body', 'helm', 'chest', 'gloves', 'legs', 'boots', 'wings', 'weapon_r', 'weapon_l'];
    for (const key of layerKeys) {
      const active = !!this.layersState[key];
      // Barra flutuante
      const btnId = 'layer-btn-' + key.replace('_', '-');
      const btn = document.getElementById(btnId);
      if (btn) btn.classList.toggle('active', active);

      // Sidebar direita
      const tileId = 'tile-layer-' + key.replace('_', '-');
      const tile = document.getElementById(tileId);
      if (tile) {
        tile.classList.toggle('active', active);
        const toggleSpan = tile.querySelector('.val-layer-tile-toggle');
        if (toggleSpan) toggleSpan.textContent = active ? 'ON' : 'OFF';
      }
    }
  }

  applyWingsVisibility(root) {
    if (!root) return;
    root.traverse((child) => {
      if (!child.isMesh) return;
      const n = (child.name || '').toLowerCase();
      const m = (child.material?.name || '').toLowerCase();
      const isWing = n.includes('wing') || n.includes('cape') || n.includes('mantle') || n.includes('asa') ||
                     m.includes('wing') || m.includes('newingel') || m.includes('devil_wing') ||
                     m.includes('neww') || m.includes('ndw') || m.includes('level_man');
      if (isWing) {
        child.visible = this.showWings;
      }
    });
  }

  toggleWings() {
    this.showWings = !this.showWings;
    const btn = document.getElementById('tool-toggle-wings');
    if (btn) btn.classList.toggle('active', this.showWings);

    if (this.currentModel) {
      this.applyWingsVisibility(this.currentModel);
      this.fitCameraToObject(this.currentModel);
      this.showToast(this.showWings ? '🪽 Asas/Capas visíveis e enquadradas' : '🪽 Asas/Capas ocultas');
    }
  }

  // --------------------------------------------------------------------------
  // ATUALIZAÇÃO DA INTERFACE E DETALHES DO ITEM ATIVO
  // --------------------------------------------------------------------------
  selectItem(index) {
    if (index < 0 || index >= this.catalog.length) return;
    this.activeIndex = index;
    const asset = this.catalog[index];

    // Atualiza classes ativas na lista
    document.querySelectorAll('.val-item-card').forEach((card, idx) => {
      card.classList.toggle('active', idx === index);
    });

    // Atualiza cabeçalho de detalhes
    document.getElementById('val-active-title').textContent = asset.name;
    document.getElementById('val-active-subtitle').textContent = asset.subtitle;

    // Atualiza métricas técnicas
    document.getElementById('val-metric-glb').textContent = asset.glb.split('/').pop();
    document.getElementById('val-metric-bmd').textContent = asset.sourceBmd;
    document.getElementById('val-metric-radius').textContent = `${asset.collision.radius}m`;
    document.getElementById('val-metric-height').textContent = `${asset.collision.height}m / ${asset.collision.step}m`;

    // Atualiza badge de status
    const decision = this.decisions[asset.id] || { status: 'PENDING', notes: '' };
    this.updateStatusBadge(decision.status);

    // Atualiza campo de anotações
    const notesInput = document.getElementById('val-notes-input');
    notesInput.value = decision.notes || '';

    // Atualiza concept image
    const conceptImg = document.getElementById('val-concept-img');
    const conceptPlaceholder = document.getElementById('val-concept-placeholder');
    if (asset.conceptImage) {
      conceptImg.src = asset.conceptImage;
      conceptImg.style.display = 'block';
      conceptPlaceholder.style.display = 'none';
    } else {
      conceptImg.src = '';
      conceptImg.style.display = 'none';
      conceptPlaceholder.style.display = 'block';
    }

    // Carrega o modelo 3D
    this.loadModel(asset);
  }

  updateStatusBadge(status) {
    const badge = document.getElementById('val-active-badge');
    badge.className = 'val-status-chip';
    if (status === 'APPROVED') {
      badge.classList.add('val-status-approved');
      badge.textContent = '✅ APROVADO (SIM)';
    } else if (status === 'REJECTED') {
      badge.classList.add('val-status-rejected');
      badge.textContent = '❌ REPROVADO (NÃO)';
    } else {
      badge.classList.add('val-status-pending');
      badge.textContent = '⏳ PENDENTE';
    }
  }

  // --------------------------------------------------------------------------
  // PROCESSAMENTO DAS DECISÕES DE VOTO (SIM / NÃO / PENDENTE)
  // --------------------------------------------------------------------------
  vote(status) {
    const asset = this.catalog[this.activeIndex];
    if (!asset) return;

    const notes = document.getElementById('val-notes-input').value.trim();
    this.decisions[asset.id] = {
      status,
      notes,
      timestamp: new Date().toISOString(),
    };

    saveDecisions(this.decisions);
    this.updateStatusBadge(status);
    this.renderItemList();
    this.updateProgressStats();

    if (status === 'APPROVED') {
      this.showToast(`✅ "${asset.name}" homologado com sucesso!`);
    } else if (status === 'REJECTED') {
      this.showToast(`❌ "${asset.name}" marcado para ajustes.`);
    } else {
      this.showToast(`⏳ Decisão de "${asset.name}" redefinida para pendente.`);
    }

    // Avança suavemente para o próximo item
    setTimeout(() => {
      if (this.activeIndex < this.catalog.length - 1) {
        this.selectItem(this.activeIndex + 1);
      }
    }, 450);
  }

  // --------------------------------------------------------------------------
  // LISTA LATERAL E FILTRAGEM
  // --------------------------------------------------------------------------
  renderItemList() {
    const list = document.getElementById('val-item-list');
    list.innerHTML = '';

    const query = this.searchQuery.toLowerCase();

    this.catalog.forEach((asset, idx) => {
      const decision = this.decisions[asset.id] || { status: 'PENDING' };

      // Filtragem por categoria e status
      if (this.currentFilter !== 'ALL') {
        if (this.currentFilter === 'HERO' && asset.category !== 'HERO') return;
        if (this.currentFilter === 'BOSS' && asset.category !== 'BOSS') return;
        if (this.currentFilter === 'GOLDEN' && asset.category !== 'GOLDEN') return;
        if (this.currentFilter === 'FIELD' && asset.category !== 'FIELD') return;
        if (this.currentFilter === 'APPROVED' && decision.status !== 'APPROVED') return;
        if (this.currentFilter === 'REJECTED' && decision.status !== 'REJECTED') return;
        if (this.currentFilter === 'PENDING' && decision.status !== 'PENDING') return;
      }

      // Filtragem por busca textual
      if (query && !asset.name.toLowerCase().includes(query) && !asset.subtitle.toLowerCase().includes(query)) {
        return;
      }

      const card = document.createElement('div');
      card.className = `val-item-card ${idx === this.activeIndex ? 'active' : ''}`;
      card.addEventListener('click', () => this.selectItem(idx));

      const meta = document.createElement('div');
      meta.className = 'val-item-meta';

      const name = document.createElement('span');
      name.className = 'val-item-name';
      name.textContent = asset.name;

      const sub = document.createElement('span');
      sub.className = 'val-item-sub';
      sub.textContent = asset.subtitle.split('•')[0] || asset.subtitle;

      meta.appendChild(name);
      meta.appendChild(sub);

      const statusChip = document.createElement('span');
      statusChip.className = 'val-status-chip';
      if (decision.status === 'APPROVED') {
        statusChip.classList.add('val-status-approved');
        statusChip.textContent = 'SIM';
      } else if (decision.status === 'REJECTED') {
        statusChip.classList.add('val-status-rejected');
        statusChip.textContent = 'NÃO';
      } else {
        statusChip.classList.add('val-status-pending');
        statusChip.textContent = '⏳';
      }

      card.appendChild(meta);
      card.appendChild(statusChip);
      list.appendChild(card);
    });
  }

  updateProgressStats() {
    let approved = 0;
    let rejected = 0;
    const total = this.catalog.length;

    this.catalog.forEach((asset) => {
      const d = this.decisions[asset.id];
      if (d?.status === 'APPROVED') approved++;
      if (d?.status === 'REJECTED') rejected++;
    });

    const evaluated = approved + rejected;
    const percent = Math.round((evaluated / total) * 100);

    document.getElementById('val-progress-stats').textContent = `${evaluated} de ${total} validados (${percent}%)`;
    document.getElementById('val-approval-stats').textContent = `✅ ${approved} Aprovados • ❌ ${rejected} Reprovados`;

    document.getElementById('val-progress-app-bar').style.width = `${(approved / total) * 100}%`;
    document.getElementById('val-progress-rej-bar').style.width = `${(rejected / total) * 100}%`;
  }

  // --------------------------------------------------------------------------
  // EXPORTAÇÃO DE RELATÓRIO MARKDOWN / OBSIDIAN & ÁREA DE TRANSFERÊNCIA
  // --------------------------------------------------------------------------
  generateMarkdownReport() {
    let md = `# Relatório de Auditoria e Validação Canônica — Dasi MMORPG\n\n`;
    md += `**Data da Auditoria:** ${new Date().toLocaleString('pt-BR')}\n`;

    let approved = 0;
    let rejected = 0;
    this.catalog.forEach((asset) => {
      const d = this.decisions[asset.id];
      if (d?.status === 'APPROVED') approved++;
      if (d?.status === 'REJECTED') rejected++;
    });

    md += `**Status Global:** ${approved} Aprovados (SIM) | ${rejected} Reprovados (NÃO) | Total: ${this.catalog.length}\n\n`;
    md += `| ID | Categoria | Nome | Arquivo GLB | Decisão | Observações do Auditor |\n`;
    md += `|---|---|---|---|---|---|\n`;

    this.catalog.forEach((asset) => {
      const d = this.decisions[asset.id] || { status: 'PENDING', notes: '' };
      const statusIcon = d.status === 'APPROVED' ? '✅ SIM (Aprovado)' : d.status === 'REJECTED' ? '❌ NÃO (Reprovado)' : '⏳ Pendente';
      const cleanNotes = (d.notes || '—').replace(/\|/g, '-').replace(/\n/g, ' ');
      md += `| \`${asset.id}\` | ${asset.category} | ${asset.name} | \`${asset.glb}\` | ${statusIcon} | ${cleanNotes} |\n`;
    });

    md += `\n---\n*Gerado automaticamente pelo Dasi Canonical Validation Studio.*`;
    return md;
  }

  exportMarkdownFile() {
    const md = this.generateMarkdownReport();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dasi_canonical_audit_report_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('📄 Relatório Markdown exportado!');
  }

  copySummaryToClipboard() {
    let approved = 0;
    let rejected = 0;
    this.catalog.forEach((asset) => {
      const d = this.decisions[asset.id];
      if (d?.status === 'APPROVED') approved++;
      if (d?.status === 'REJECTED') rejected++;
    });

    const summary = `⚔️ [Auditoria Dasi 3D] Progresso: ${approved + rejected}/${this.catalog.length} validados (${approved} Aprovados ✅, ${rejected} Reprovados ❌).`;
    navigator.clipboard.writeText(summary).then(() => {
      this.showToast('📋 Resumo copiado para a área de transferência!');
    }).catch(() => {
      this.showToast(summary);
    });
  }

  // --------------------------------------------------------------------------
  // EVENT BINDINGS
  // --------------------------------------------------------------------------
  bindDOM() {
    // Ações de Voto
    document.getElementById('btn-vote-sim').addEventListener('click', () => this.vote('APPROVED'));
    document.getElementById('btn-vote-nao').addEventListener('click', () => this.vote('REJECTED'));
    document.getElementById('btn-vote-clear').addEventListener('click', () => this.vote('PENDING'));

    // Navegação
    document.getElementById('btn-nav-prev').addEventListener('click', () => {
      if (this.activeIndex > 0) this.selectItem(this.activeIndex - 1);
    });
    document.getElementById('btn-nav-next').addEventListener('click', () => {
      if (this.activeIndex < this.catalog.length - 1) this.selectItem(this.activeIndex + 1);
    });

    // Busca Textual
    document.getElementById('val-search-input').addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderItemList();
    });

    // Filtros por Categoria
    document.querySelectorAll('.btn-val-pill').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-val-pill').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentFilter = e.currentTarget.dataset.filter;
        this.renderItemList();
      });
    });

    // 3D Toolbar Controls
    document.getElementById('tool-reset-cam').addEventListener('click', () => {
      if (this.currentModel) {
        this.fitCameraToObject(this.currentModel);
        this.showToast('🎥 Câmera resetada e enquadrada');
      }
    });

    const wireBtn = document.getElementById('tool-toggle-wireframe');
    wireBtn.addEventListener('click', () => {
      this.wireframeMode = !this.wireframeMode;
      wireBtn.classList.toggle('active', this.wireframeMode);
      if (this.currentModel) {
        this.currentModel.traverse((o) => {
          if (o.isMesh && o.material) {
            if (Array.isArray(o.material)) o.material.forEach((m) => m.wireframe = this.wireframeMode);
            else o.material.wireframe = this.wireframeMode;
          }
        });
      }
      this.showToast(this.wireframeMode ? '🕸️ Wireframe ativado' : '🎨 Sombreado PBR ativado');
    });

    const colBtn = document.getElementById('tool-toggle-collision');
    colBtn.addEventListener('click', () => {
      this.showCollision = !this.showCollision;
      colBtn.classList.toggle('active', this.showCollision);
      if (this.currentColliderGroup) {
        this.currentColliderGroup.visible = this.showCollision;
      }
      this.showToast(this.showCollision ? '🛡️ Colisor físico visível' : '🛡️ Colisor físico oculto');
    });

    const wingsBtn = document.getElementById('tool-toggle-wings');
    if (wingsBtn) {
      wingsBtn.addEventListener('click', () => this.toggleWings());
    }

    const gridBtn = document.getElementById('tool-toggle-grid');
    gridBtn.addEventListener('click', () => {
      this.showGrid = !this.showGrid;
      gridBtn.classList.toggle('active', this.showGrid);
      if (this.gridHelper) {
        this.gridHelper.visible = this.showGrid;
      }
    });

    const animBtn = document.getElementById('tool-toggle-anim');
    animBtn.addEventListener('click', () => {
      this.isPlayingAnim = !this.isPlayingAnim;
      animBtn.classList.toggle('active', this.isPlayingAnim);
      animBtn.textContent = this.isPlayingAnim ? '▶️ Em Reprodução' : '⏸️ Parado (Clique p/ Animar)';
      if (this.activeAction) {
        this.activeAction.paused = !this.isPlayingAnim;
      }
    });

    document.getElementById('val-anim-select').addEventListener('change', (e) => {
      if (!this.mixer || !this.currentModel) return;
      const clipName = e.target.value;
      this.mixer.stopAllAction();
      const anims = this.currentAnimations || this.currentModel.animations || [];
      const clip = THREE.AnimationClip.findByName(anims, clipName);
      if (clip) {
        this.activeAction = this.mixer.clipAction(clip);
        this.activeAction.play();
        this.activeAction.paused = !this.isPlayingAnim;
        this.mixer.update(0);
      }
    });

    // Campo de notas com auto-save ao digitar
    document.getElementById('val-notes-input').addEventListener('input', (e) => {
      const asset = this.catalog[this.activeIndex];
      if (!asset) return;
      if (!this.decisions[asset.id]) {
        this.decisions[asset.id] = { status: 'PENDING', notes: '' };
      }
      this.decisions[asset.id].notes = e.target.value;
      saveDecisions(this.decisions);
    });

    // Exportações
    document.getElementById('btn-export-markdown').addEventListener('click', () => this.exportMarkdownFile());
    document.getElementById('btn-copy-summary').addEventListener('click', () => this.copySummaryToClipboard());

    
    // Event Listeners para Inspeção Modular por Camadas
    const layerMap = [
      ['layer-btn-body', 'body'],
      ['layer-btn-helm', 'helm'],
      ['layer-btn-chest', 'chest'],
      ['layer-btn-gloves', 'gloves'],
      ['layer-btn-legs', 'legs'],
      ['layer-btn-boots', 'boots'],
      ['layer-btn-wings', 'wings'],
      ['layer-btn-weapon-r', 'weapon_r'],
      ['layer-btn-weapon-l', 'weapon_l'],
      ['tile-layer-body', 'body'],
      ['tile-layer-helm', 'helm'],
      ['tile-layer-chest', 'chest'],
      ['tile-layer-gloves', 'gloves'],
      ['tile-layer-legs', 'legs'],
      ['tile-layer-boots', 'boots'],
      ['tile-layer-wings', 'wings'],
      ['tile-layer-weapon-r', 'weapon_r'],
      ['tile-layer-weapon-l', 'weapon_l'],
    ];

    layerMap.forEach(([elementId, layerKey]) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.addEventListener('click', () => this.toggleLayer(layerKey));
      }
    });

    const presetMap = [
      ['layer-preset-full', 'ALL_ARMOR'],
      ['layer-preset-body', 'BODY_ONLY'],
      ['layer-preset-armor', 'ARMOR_ONLY'],
      ['tile-preset-full', 'ALL_ARMOR'],
      ['tile-preset-body', 'BODY_ONLY'],
      ['tile-preset-armor', 'ARMOR_ONLY'],
    ];

    presetMap.forEach(([elementId, presetKey]) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.addEventListener('click', () => this.setLayerPreset(presetKey));
      }
    });

    // Atalhos de Teclado Oficiais
    window.addEventListener('keydown', (e) => {
      // Ignora se estiver digitando em campo de texto
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 's' || e.key === 'S') {
        this.vote('APPROVED');
      } else if (e.key === 'n' || e.key === 'N') {
        this.vote('REJECTED');
      } else if (e.key === 'x' || e.key === 'X') {
        this.toggleWings();
      } else if (e.key === 'p' || e.key === 'P') {
        animBtn.click();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (this.activeIndex < this.catalog.length - 1) this.selectItem(this.activeIndex + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (this.activeIndex > 0) this.selectItem(this.activeIndex - 1);
      } else if (e.key === 'c' || e.key === 'C') {
        colBtn.click();
      } else if (e.key === 'w' || e.key === 'W') {
        wireBtn.click();
      } else if (e.key === ' ') {
        e.preventDefault();
        document.getElementById('tool-reset-cam').click();
      }
    });
  }

  showToast(message) {
    const toast = document.getElementById('val-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }
}

// Inicializa quando a página for carregada no navegador
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.dasiValidator = new ValidationStudio();
  });
}
