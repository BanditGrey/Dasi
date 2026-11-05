/**
 * DASI MMORPG - MOTOR DE AVATARES 3D & SALÃO DOS HERÓIS (CONTINENT OF LEGEND)
 * Gerencia a renderização em tempo real de Avatares 3D dos personagens no HUD
 * e o Modal de Seleção de Classes Canônicas com visualização tridimensional.
 * 
 * As 5 Classes Canônicas Originais:
 * 1. Dark Knight (Cavaleiro do Sangue / Blade Knight / Blade Master)
 * 2. Dark Wizard (Arquimago do Caos / Soul Master / Grand Master)
 * 3. Fairy Elf (Vigia da Floresta / Muse Elf / High Elf)
 * 4. Magic Gladiator (Gladiador Rúnico / Duel Master)
 * 5. Dark Lord (Soberano Imperial / Lord Emperor)
 */

import * as THREE from './libs/three.module.js';
import { GLTF_HERO_MAP } from './dasi3dContent.js';
import { GLTFLoader } from './libs/GLTFLoader.js';

// ============================================================================
// METADADOS E DEFINIÇÕES DAS 5 CLASSES ORIGINAIS
// ============================================================================
export const CLASS_DEFINITIONS = {
  DK: {
    id: 'DK',
    name: 'Cavaleiro do Sangue',
    title: 'Blade Knight',
    evolutionStage: 'Cavaleiro (Lvl 1) ➔ Cavaleiro da Lâmina (Lvl 150) ➔ Mestre da Lâmina (Lvl 400)',
    role: 'Tanque Físico & Bruiser Corpo a Corpo',
    roleTag: '⚔️ MELEE / TANK',
    icon: '⚔️',
    themeColor: '#ef4444',
    glowColor: '#dc2626',
    lore: 'Nascido nas planícies cinzentas e na cidadela de Lorencia. Especialista em combate brutal de impacto físico, sustentando espadas colossais de duas mãos e armaduras de escamas de dragão.',
    weaponName: 'Dragon Blade & Escudo Torre',
    armorSetName: 'Dragon Set (+15 com Corona Carmesim)',
    wingsName: 'Wings of Dragon (Asas do Dragão)',
    baseStats: { str: 320, agi: 120, vit: 100, ene: 80, cmd: 0 },
    statFocus: 'Força (Dano e Equipamentos) e Vitalidade (HP e Resistência)',
    skills: [
      { id: 'cyclone', name: 'Twisting Slash', icon: '🌪️', desc: 'Tormenta de Aço 360° com vácuo centrípeto que suga monstros para o fio da lâmina.' },
      { id: 'deathstab', name: 'Death Stab', icon: '⚡', desc: 'Estocada do Trovão perfurante com onda cônica de alta velocidade.' },
      { id: 'rageful', name: 'Rageful Blow', icon: '💥', desc: 'Impacto devastador que racha o solo e atordoa inimigos em 8 metros.' },
      { id: 'fortitude', name: 'Greater Fortitude', icon: '🛡️', desc: 'Grito gutural de sangue que multiplica o HP de todo o grupo.' },
    ],
  },

  DW: {
    id: 'DW',
    name: 'Arquimago do Caos',
    title: 'Soul Master',
    evolutionStage: 'Mago Arcano (Lvl 1) ➔ Mestre das Almas (Lvl 150) ➔ Grão-Mago do Caos (Lvl 400)',
    role: 'Dano Mágico em Área & Feitiços Elementais',
    roleTag: '🔮 MAGIC / AOE',
    icon: '🔮',
    themeColor: '#38bdf8',
    glowColor: '#0284c7',
    lore: 'Mestre da matéria etérea e dos mistérios arcanos. Levita sobre o solo enquanto canaliza tempestades de gelo, vulcões incandescentes e espíritos famintos que orbitam em espirais infinitas.',
    weaponName: 'Cajado de Kundun & Orbe Flutuante de Mana',
    armorSetName: 'Grand Soul Set (+15 com Safira Celestial)',
    wingsName: 'Wings of Soul (Asas da Alma)',
    baseStats: { str: 120, agi: 140, vit: 80, ene: 380, cmd: 0 },
    statFocus: 'Energia (Poder Mágico Puro e Mana) e Agilidade (Velocidade de Conjuração)',
    skills: [
      { id: 'evilspirits', name: 'Evil Spirits', icon: '🌪️', desc: 'Legião das Sombras em ondas espirais expansivas contínuas em 360°.' },
      { id: 'hellfire', name: 'Hellfire', icon: '🔥', desc: 'Pentagrama incandescente com pilares de magma cósmico que projetam alvos no ar.' },
      { id: 'icestorm', name: 'Ice Storm', icon: '❄️', desc: 'Nevasca com estalactites gigantescas que congelam e aplicam -60% de lentidão.' },
      { id: 'manashield', name: 'Mana Shield', icon: '🛡️', desc: 'Barreira espiritual reflexiva que converte 70% do dano em perda de mana.' },
    ],
  },

  ELF: {
    id: 'ELF',
    name: 'Vigia da Floresta',
    title: 'Muse Elf',
    evolutionStage: 'Caçadora Élfica (Lvl 1) ➔ Elfa Musa (Lvl 150) ➔ Senhora dos Elementos (Lvl 400)',
    role: 'Dano Físico à Distância, Suporte & Invocação',
    roleTag: '🪽 RANGED / SUPPORT',
    icon: '🪽',
    themeColor: '#10b981',
    glowColor: '#059669',
    lore: 'Protetora sagrada da Árvore Mãe de Noria Feywood. Possui agilidade sobre-humana, disparando flechas de fótons em trajetórias balísticas perfeitas, entoando cânticos de cura e invocando titãs da terra.',
    weaponName: 'Arco Celestial & Aljava Encantada',
    armorSetName: 'Spirit Set (+15 com Filigranas Douradas)',
    wingsName: 'Wings of Spirits (Asas de Fada)',
    baseStats: { str: 100, agi: 380, vit: 90, ene: 150, cmd: 0 },
    statFocus: 'Agilidade (Taxa de Ataque, Esquiva e Balística) e Energia (Poder de Cura/Buff)',
    skills: [
      { id: 'tripleshot', name: 'Triple Shot', icon: '🏹', desc: 'Disparo simultâneo de 3 flechas que convergem com dano perfurante cumulativo.' },
      { id: 'penetration', name: 'Penetration', icon: '💨', desc: 'Flecha supersônica com vácuo que atravessa uma linha infinita de monstros.' },
      { id: 'healing', name: 'Healing & Blessing', icon: '✨', desc: 'Cântico das Estrelas que regenera Vida e amplifica Ataque e Defesa dos aliados.' },
      { id: 'summon', name: 'Summon Titã/Golem', icon: '🗿', desc: 'Invoca um colossal golem de rocha e vinhas com golpes sísmicos de área.' },
    ],
  },

  MG: {
    id: 'MG',
    name: 'Gladiador Rúnico',
    title: 'Duel Master',
    evolutionStage: 'Gladiador Mágico (Lvl 220) ➔ Mestre Duelista (Lvl 400)',
    role: 'Híbrido de Combate (Físico & Mágico de Alta Velocidade)',
    roleTag: '⚡ HYBRID / SPELLBLADE',
    icon: '⚡',
    themeColor: '#a855f7',
    glowColor: '#7e22ce',
    lore: 'Guerreiro transcendental que recusa o uso de elmos pesados para manter sua mente em sintonia pura com o éter. Empunha espadas rúnicas duplas incandescentes, mesclando golpes físicos brutais com feitiços destrutivos.',
    weaponName: 'Espadas Rúnicas Duplas (Fogo & Trovão)',
    armorSetName: 'Hurricane Set (+15 com Circuitos Neon)',
    wingsName: 'Wings of Darkness (Asas das Trevas)',
    baseStats: { str: 280, agi: 240, vit: 110, ene: 250, cmd: 0 },
    statFocus: 'Equilíbrio Tríplice: Força (Lâminas), Agilidade (Velocidade) e Energia (Runas)',
    skills: [
      { id: 'fireslash', name: 'Fire Slash', icon: '🔥', desc: 'Cortes rápidos em cruz incandescentes que despedaçam 25% da armadura inimiga.' },
      { id: 'powerslash', name: 'Power Slash', icon: '⚔️', desc: 'Estocada mística veloz que projeta 5 lâminas de luz em leque aberto.' },
      { id: 'runicsurge', name: 'Runic Surge', icon: '⚡', desc: 'Converte 50% de todo dano físico em puro dano arcano ignorando escudos.' },
      { id: 'hybridtwisting', name: 'Twisting Slash + Evil Spirits', icon: '🌪️', desc: 'Capaz de alternar instantaneamente entre habilidades físicas e mágicas.' },
    ],
  },

  DL: {
    id: 'DL',
    name: 'Soberano Imperial',
    title: 'Lord Emperor',
    evolutionStage: 'Lorde Imperial (Lvl 250) ➔ Imperador Soberano (Lvl 400)',
    role: 'Comandante Supremo, Montaria & Força Sísmica',
    roleTag: '👑 SOVEREIGN / COMMANDER',
    icon: '👑',
    themeColor: '#f59e0b',
    glowColor: '#b45309',
    lore: 'Monarca da Fortaleza de Loren. Envolto em um manto imperial de veludo escarlate, empunha o Cetro Real do Grande Lorde e comanda o Dark Raven, um corvo de guerra espectral dotado de inteligência autônoma.',
    weaponName: 'Cetro Real do Grande Lorde & Escudo Imperial',
    armorSetName: 'Dark Master Set (+15 com Capa de Veludo & Dark Raven)',
    wingsName: 'Mantle of Monarch (Capa da Monarquia)',
    baseStats: { str: 260, agi: 130, vit: 140, ene: 220, cmd: 180 },
    statFocus: 'Força (Cetro), Liderança/Comando (Poder do Corvo) e Vitalidade (Lorde)',
    skills: [
      { id: 'fireburst', name: 'Fireburst', icon: '💥', desc: 'Estalo de chicote ígneo no solo que dispara 3 explosões em cadeia devastadoras.' },
      { id: 'earthquake', name: 'Earthquake', icon: '🌋', desc: 'Pisada sísmica com corcel Dark Horse que arremessa inimigos em 12 metros.' },
      { id: 'ravencmd', name: 'Raven Strike', icon: '🦅', desc: 'Comanda o Dark Raven a mergulhar em rasante supersônico contra o alvo.' },
      { id: 'spark', name: 'Electric Spark', icon: '⚡', desc: 'Raio celestial retilíneo monumental cujo dano escala com aliados próximos.' },
    ],
  },
};

// ============================================================================
// CONSTRUTOR PROCEDURAL DO BUSTO / AVATAR 3D DO PERSONAGEM (PBR CLOSE-UP)
// ============================================================================
export function createHeroBust(heroClass, THREE) {
  const bustGroup = new THREE.Group();

  // Materiais
  const skinMat = new THREE.MeshStandardMaterial({
    color: heroClass === 'ELF' ? 0xf3e9dc : heroClass === 'MG' || heroClass === 'DL' ? 0xd49b6a : 0xdfab7d,
    roughness: 0.55,
    metalness: 0.05,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.90,
    roughness: 0.20,
  });

  let armorColor = 0x991b1b; // DK Vermelho Dragão
  let armorMetal = 0.88;
  let armorRough = 0.22;

  if (heroClass === 'DW') {
    armorColor = 0x1e3a8a; // DW Azul Safira
    armorMetal = 0.35;
    armorRough = 0.40;
  } else if (heroClass === 'ELF') {
    armorColor = 0x065f46; // ELF Verde Esmeralda
    armorMetal = 0.60;
    armorRough = 0.30;
  } else if (heroClass === 'MG') {
    armorColor = 0x18181b; // MG Obsidiana
    armorMetal = 0.92;
    armorRough = 0.18;
  } else if (heroClass === 'DL') {
    armorColor = 0x0f172a; // DL Aço Nobre Preto
    armorMetal = 0.95;
    armorRough = 0.16;
  }

  const armorMat = new THREE.MeshStandardMaterial({
    color: armorColor,
    metalness: armorMetal,
    roughness: armorRough,
  });

  // Base / Colarinho do Busto
  const chestGeom = new THREE.CylinderGeometry(0.35, 0.45, 0.38, 16);
  const chestMesh = new THREE.Mesh(chestGeom, armorMat);
  chestMesh.position.y = -0.15;
  bustGroup.add(chestMesh);

  // Ombreiras
  for (let s of [-1, 1]) {
    const pGeom = new THREE.ConeGeometry(0.18, 0.28, 6);
    const pMesh = new THREE.Mesh(pGeom, heroClass === 'DL' ? goldMat : armorMat);
    pMesh.position.set(s * 0.42, -0.05, 0);
    pMesh.rotation.z = s * -0.55;
    bustGroup.add(pMesh);
  }

  // Pescoço
  const neckGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.18, 12);
  const neckMesh = new THREE.Mesh(neckGeom, skinMat);
  neckMesh.position.y = 0.10;
  bustGroup.add(neckMesh);

  // Cabeça
  const headGeom = new THREE.SphereGeometry(0.20, 16, 16);
  const headMesh = new THREE.Mesh(headGeom, skinMat);
  headMesh.position.y = 0.32;
  bustGroup.add(headMesh);

  // Específicos por Classe no Busto
  if (heroClass === 'DK') {
    // Elmo com Chifres de Dragão
    const helmGeom = new THREE.BoxGeometry(0.44, 0.42, 0.44);
    const helmMesh = new THREE.Mesh(helmGeom, armorMat);
    helmMesh.position.set(0, 0.34, 0);
    bustGroup.add(helmMesh);

    // Visor Vermelho
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xff0000,
      emissiveIntensity: 3.0,
      roughness: 0.1,
    });
    const visorGeom = new THREE.BoxGeometry(0.32, 0.06, 0.10);
    const visorMesh = new THREE.Mesh(visorGeom, visorMat);
    visorMesh.position.set(0, 0.34, 0.22);
    bustGroup.add(visorMesh);

    // Chifres
    for (let s of [-1, 1]) {
      const hornGeom = new THREE.ConeGeometry(0.08, 0.45, 6);
      const hornMesh = new THREE.Mesh(hornGeom, goldMat);
      hornMesh.position.set(s * 0.26, 0.52, -0.05);
      hornMesh.rotation.set(-0.2, s * 0.2, s * 0.7);
      bustGroup.add(hornMesh);
    }
  } else if (heroClass === 'DW') {
    // Chapéu Místico
    const brimGeom = new THREE.CylinderGeometry(0.46, 0.46, 0.04, 16);
    const brimMesh = new THREE.Mesh(brimGeom, armorMat);
    brimMesh.position.set(0, 0.46, 0);
    bustGroup.add(brimMesh);

    const coneGeom = new THREE.ConeGeometry(0.28, 0.65, 12);
    const coneMesh = new THREE.Mesh(coneGeom, armorMat);
    coneMesh.position.set(0, 0.75, -0.08);
    coneMesh.rotation.x = -0.25;
    bustGroup.add(coneMesh);

    // Gema de Safira
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 3.5,
    });
    const gemGeom = new THREE.OctahedronGeometry(0.06, 0);
    const gemMesh = new THREE.Mesh(gemGeom, gemMat);
    gemMesh.position.set(0, 0.52, 0.22);
    bustGroup.add(gemMesh);
  } else if (heroClass === 'ELF') {
    // Diadema de Folhas
    const circletGeom = new THREE.TorusGeometry(0.21, 0.025, 8, 20);
    const circletMesh = new THREE.Mesh(circletGeom, goldMat);
    circletMesh.position.set(0, 0.38, 0);
    circletMesh.rotation.x = Math.PI / 2.3;
    bustGroup.add(circletMesh);

    // Orelhas Pontiagudas
    for (let s of [-1, 1]) {
      const earGeom = new THREE.ConeGeometry(0.05, 0.32, 4);
      const earMesh = new THREE.Mesh(earGeom, skinMat);
      earMesh.position.set(s * 0.22, 0.36, -0.05);
      earMesh.rotation.set(-0.4, 0, s * 1.15);
      bustGroup.add(earMesh);
    }

    // Cabelo Dourado
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.35 });
    const hairGeom = new THREE.CylinderGeometry(0.05, 0.25, 0.85, 8);
    const hairMesh = new THREE.Mesh(hairGeom, hairMat);
    hairMesh.position.set(0, 0.10, -0.16);
    hairMesh.rotation.x = 0.25;
    bustGroup.add(hairMesh);
  } else if (heroClass === 'MG') {
    // Tiara Rúnica (MG não usa elmo)
    const bandGeom = new THREE.TorusGeometry(0.21, 0.02, 8, 20);
    const bandMesh = new THREE.Mesh(bandGeom, goldMat);
    bandMesh.position.set(0, 0.38, 0);
    bandMesh.rotation.x = Math.PI / 2.2;
    bustGroup.add(bandMesh);

    // Gema Rúnica Neon
    const runeGemMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 4.0,
    });
    const runeGem = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), runeGemMat);
    runeGem.position.set(0, 0.40, 0.21);
    bustGroup.add(runeGem);

    // Cabelo Prateado Espetado
    const sHairMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.30 });
    const sHairGeom = new THREE.ConeGeometry(0.24, 0.65, 8);
    const sHairMesh = new THREE.Mesh(sHairGeom, sHairMat);
    sHairMesh.position.set(0, 0.52, -0.06);
    sHairMesh.rotation.x = 0.40;
    bustGroup.add(sHairMesh);
  } else if (heroClass === 'DL') {
    // Coroa Imperial com Spikes e Rubi Solar
    const crownGeom = new THREE.CylinderGeometry(0.23, 0.22, 0.12, 16);
    const crownMesh = new THREE.Mesh(crownGeom, goldMat);
    crownMesh.position.set(0, 0.48, 0);
    bustGroup.add(crownMesh);

    for (let i = 0; i < 5; i++) {
      const ang = (i - 2) * 0.4;
      const spGeom = new THREE.ConeGeometry(0.04, 0.20, 4);
      const spMesh = new THREE.Mesh(spGeom, goldMat);
      spMesh.position.set(Math.sin(ang) * 0.22, 0.60, Math.cos(ang) * 0.22);
      bustGroup.add(spMesh);
    }

    // Rubi Central
    const rubyMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 3.5,
    });
    const rubyMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), rubyMat);
    rubyMesh.position.set(0, 0.52, 0.23);
    bustGroup.add(rubyMesh);

    // Capa de Veludo Vermelho atrás dos ombros
    const capeGeom = new THREE.PlaneGeometry(0.75, 0.85);
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      roughness: 0.65,
      side: THREE.DoubleSide,
    });
    const capeMesh = new THREE.Mesh(capeGeom, capeMat);
    capeMesh.position.set(0, -0.05, -0.22);
    capeMesh.rotation.x = 0.15;
    bustGroup.add(capeMesh);
  }

  return bustGroup;
}

// ============================================================================
// CLASSE PRINCIPAL: RENDERIZADOR DO AVATAR 3D DO HUD
// ============================================================================
export class Dasi3DAvatarRenderer {
  constructor(canvasId, initialClass = 'DK') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`[Dasi3DAvatar] Canvas #${canvasId} não encontrado.`);
      return;
    }

    this.currentClass = initialClass;
    this.clock = new THREE.Clock();
    this.isHovered = false;
    this.mouseAngleX = 0;
    this.mouseAngleY = 0;

    this.initScene();
    this.setClass(this.currentClass);
    this.setupListeners();
    this.animate();
  }

  initScene() {
    this.width = this.canvas.clientWidth || 68;
    this.height = this.canvas.clientHeight || 68;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, 0.1, 20);
    this.camera.position.set(0, 0.32, 1.85);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Iluminação Tri-Point Dramática para Retratos RPG
    const ambLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambLight);

    this.keyLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    this.keyLight.position.set(1.5, 2.0, 2.0);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.PointLight(0x38bdf8, 3.5, 5);
    this.rimLight.position.set(-1.2, 0.8, -1.0);
    this.scene.add(this.rimLight);

    this.avatarBust = null;
  }

  setClass(heroClass) {
    this.currentClass = heroClass;
    if (this.avatarBust) {
      this.scene.remove(this.avatarBust);
      this.avatarBust = null;
    }

    // Tenta carregar modelo GLB ou usa busto procedural
    const bust = createHeroBust(heroClass, THREE);
    this.avatarBust = bust;
    this.scene.add(bust);

    // Ajusta luz do Rim conforme cor da classe
    const def = CLASS_DEFINITIONS[heroClass];
    if (def && this.rimLight) {
      this.rimLight.color.set(def.themeColor);
    }
  }

  setupListeners() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mouseenter', () => {
      this.isHovered = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.mouseAngleX = 0;
      this.mouseAngleY = 0;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      this.mouseAngleY = x * 0.85;
      this.mouseAngleX = y * 0.45;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const t = this.clock.getElapsedTime();

    if (this.avatarBust) {
      if (this.isHovered) {
        // Segue suavemente o ponteiro do mouse
        this.avatarBust.rotation.y += (this.mouseAngleY - this.avatarBust.rotation.y) * 0.12;
        this.avatarBust.rotation.x += (this.mouseAngleX - this.avatarBust.rotation.x) * 0.12;
      } else {
        // Respiração e oscilação contínua sutil
        const rotY = Math.sin(t * 1.2) * 0.25;
        const breath = Math.sin(t * 2.5) * 0.015;
        this.avatarBust.rotation.y = rotY;
        this.avatarBust.position.y = breath;
        this.avatarBust.rotation.x = Math.sin(t * 1.5) * 0.04;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// ============================================================================
// SALÃO DOS HERÓIS: MODAL INTERATIVO DE SELEÇÃO DE CLASSES & AVATARES 3D
// ============================================================================
export class DasiHeroClassModal {
  constructor(appInstance) {
    this.app = appInstance;
    this.modalEl = document.getElementById('modal-hero-classes');
    this.cardRenderers = new Map();
    this.initModalEvents();
  }

  initModalEvents() {
    const btnOpen = document.getElementById('btn-switch-class-modal');
    const avatarContainer = document.getElementById('char-avatar-container');
    const btnClose = document.getElementById('btn-close-class-modal');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => this.open());
    }

    if (avatarContainer) {
      avatarContainer.addEventListener('click', () => this.open());
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => this.close());
    }

    // Fechar ao clicar fora do conteúdo
    if (this.modalEl) {
      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl) {
          this.close();
        }
      });
    }

    // Tecla ESC fecha modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl && this.modalEl.style.display !== 'none') {
        this.close();
      }
    });
  }

  open() {
    if (!this.modalEl) return;
    this.modalEl.style.display = 'flex';
    this.renderClassCards();
  }

  close() {
    if (!this.modalEl) return;
    this.modalEl.style.display = 'none';
  }

  renderClassCards() {
    const container = document.getElementById('hero-classes-grid');
    if (!container) return;

    const currentClass = this.app.charClass || 'DK';

    container.innerHTML = Object.values(CLASS_DEFINITIONS).map((c) => {
      const isSelected = c.id === currentClass;
      return `
        <div class="hero-class-card ${isSelected ? 'active-class' : ''}" data-class="${c.id}" style="--class-theme: ${c.themeColor}">
          <div class="class-card-header">
            <span class="class-card-role">${c.roleTag}</span>
            ${isSelected ? '<span class="class-active-badge">CLASSE ATIVA</span>' : ''}
          </div>

          <!-- Viewport 3D do Avatar da Classe -->
          <div class="class-card-avatar-wrap">
            <canvas id="class-avatar-canvas-${c.id}" class="class-card-3d-canvas" width="140" height="140"></canvas>
            <div class="class-card-glow-circle"></div>
          </div>

          <div class="class-card-info">
            <h3 class="class-card-title">${c.name}</h3>
            <span class="class-card-subtitle">${c.title}</span>
            <p class="class-card-evo">${c.evolutionStage}</p>
            <p class="class-card-desc">${c.lore}</p>
          </div>

          <!-- Equipamento Icônico -->
          <div class="class-card-equipment">
            <div class="equip-row"><span class="eq-lbl">Arma:</span> <strong>${c.weaponName}</strong></div>
            <div class="equip-row"><span class="eq-lbl">Armadura:</span> <strong>${c.armorSetName}</strong></div>
            <div class="equip-row"><span class="eq-lbl">Asas:</span> <strong>${c.wingsName}</strong></div>
          </div>

          <!-- Habilidades Icônicas -->
          <div class="class-card-skills">
            <div class="skills-header">HABILIDADES REAIS:</div>
            <div class="skills-pills">
              ${c.skills.map(s => `<span class="skill-pill" title="${s.desc}">${s.icon} ${s.name}</span>`).join('')}
            </div>
          </div>

          <!-- Botão de Ação -->
          <div class="class-card-action">
            <button class="btn-select-class ${isSelected ? 'btn-current' : ''}" data-class="${c.id}">
              ${isSelected ? '✔ CLASSE EM USO' : `⚔️ SELECIONAR ${c.title.toUpperCase()}`}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Instancia mini-renderizadores 3D para cada cartão
    Object.keys(CLASS_DEFINITIONS).forEach((cid) => {
      const canvas = document.getElementById(`class-avatar-canvas-${cid}`);
      if (canvas) {
        this.initCard3DViewer(canvas, cid);
      }
    });

    // Eventos de Clique nos Botões de Selecionar Classe
    container.querySelectorAll('.btn-select-class:not(.btn-current)').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const selectedId = btn.getAttribute('data-class');
        if (selectedId) {
          this.app.switchHeroClass(selectedId);
          this.close();
        }
      });
    });
  }

  initCard3DViewer(canvas, heroClass) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
    camera.position.set(0, 0.32, 1.85);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(140, 140);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 2.0);
    dirLight.position.set(1.5, 2.0, 2.0);
    scene.add(dirLight);

    const def = CLASS_DEFINITIONS[heroClass];
    const rimLight = new THREE.PointLight(def ? def.themeColor : 0x38bdf8, 3.5, 5);
    rimLight.position.set(-1.2, 0.8, -1.0);
    scene.add(rimLight);

    const bust = createHeroBust(heroClass, THREE);
    scene.add(bust);

    let isHover = false;
    let targetRotY = 0;

    canvas.parentElement.addEventListener('mouseenter', () => { isHover = true; });
    canvas.parentElement.addEventListener('mouseleave', () => { isHover = false; });
    canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      targetRotY = x * 1.2;
    });

    const clock = new THREE.Clock();
    const renderLoop = () => {
      if (this.modalEl.style.display === 'none') return;
      requestAnimationFrame(renderLoop);

      const t = clock.getElapsedTime();
      if (isHover) {
        bust.rotation.y += (targetRotY - bust.rotation.y) * 0.15;
      } else {
        bust.rotation.y = Math.sin(t * 1.2) * 0.35;
        bust.position.y = Math.sin(t * 2.2) * 0.015;
      }
      renderer.render(scene, camera);
    };
    renderLoop();
  }
}
