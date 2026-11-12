/**
 * DASI MMORPG - DEV CLIENT & INTERACTIVE INVENTORY INSPECTOR
 * WebSocket Client, Drag & Drop Handler, Audio Synthesizer & Canvas Glow Shader Engine.
 */

import * as THREE from './libs/three.module.js';
import { GLTFExporter } from './libs/GLTFExporter.js';
import { buildEditedScenarioSnapshot } from './exportEditedScenario.js';
import { exportScenarioBatch } from './exportScenarioBatch.js';
import { createEnvironment } from './dasi3dContent.js';
import { Dasi3DFeatureViewer } from './dasi3dViewer.js';
import { ARMORY_METADATA } from './dasi3dArmory.js';
import { ARMOR_SLOTS, ARMOR_VARIANTS, CLASS_WEAPONS, WEAPON_NAMES } from './modularHero.js';
import { CHARACTER_CONCEPTS, getCharacterConcept } from './characterConcepts.js';
import { CLASSIC_CONCEPTS, SCENARIO_BLOCKOUTS, conceptKeyForScenario, getScenarioConcept, getScenarioBlockout } from './classicConcepts.js';
import { canonicalTileScenario, saveTileEdits, validateTileDocument, makeTileDocument, tileDocumentLayers, OBJECT_VARIANTS } from './tileFloor.js';
import { Dasi3DAvatarRenderer, DasiHeroClassModal, CLASS_DEFINITIONS } from './dasi3dAvatar.js';
import { Dasi3DRealtimeArena } from './dasi3dRealtimeArena.js';
import {
  HarmonicAudioSynthesizer,
  LevelUpSystem,
  ChaosMachineVFX,
  PortalSystem,
  IdleAutoCombatEngine,
} from './dasiActionGameplay.js';
import { OPCODES } from './protocolOpcodes.js';

// ============================================================================
// CONSTANTES & CONFIGURAÇÕES
// ============================================================================
const LOCATION_TYPE = {
  GRID: 0,
  EQUIPMENT: 1,
};

const CELL_SIZE = 52;
const CELL_GAP = 2;

export function getItemIcon(defId) {
  if (!defId) return '📦';
  if (ITEM_ICONS[defId]) return ITEM_ICONS[defId];

  const id = defId.toLowerCase();
  if (id.startsWith('wings_') || id.startsWith('cape_')) return '🪽';
  if (id.startsWith('box_of_kundun')) return '🎁';
  if (id.startsWith('fruit_')) {
    if (id.includes('strength')) return '🍎';
    if (id.includes('agility')) return '🍏';
    if (id.includes('vitality')) return '🍊';
    if (id.includes('energy')) return '🍇';
    return '🍒';
  }
  if (id.startsWith('potion_health')) return '🍷';
  if (id.startsWith('potion_mana')) return '🧪';
  if (id.startsWith('potion_antidote')) return '💊';
  if (id.includes('scroll')) return '📜';
  if (id.includes('beer') || id.includes('ale')) return '🍺';
  if (id.startsWith('jewel_')) return '💎';
  if (id.includes('feather') || id.includes('crest') || id.includes('flame')) return '🪶';
  if (id.includes('fenrir') || id.includes('horse') || id.includes('uniria') || id.includes('dinorant')) return '🦄';
  if (id.includes('raven')) return '🦅';
  if (id.includes('imp')) return '😈';
  if (id.endsWith('_helm') || id.endsWith('_mask') || id.endsWith('_cap')) return '🪖';
  if (id.endsWith('_armor') || id.endsWith('_mail') || id.endsWith('_robe')) return '🥋';
  if (id.endsWith('_pants') || id.endsWith('_legs') || id.endsWith('_skirt')) return '👖';
  if (id.endsWith('_gloves') || id.endsWith('_gauntlets')) return '🧤';
  if (id.endsWith('_boots') || id.endsWith('_shoes')) return '👢';
  if (id.endsWith('_shield')) return '🛡️';
  if (id.endsWith('_sword') || id.endsWith('_blade') || id.includes('dagger') || id.includes('falchion') || id.includes('gladius')) return '🗡️';
  if (id.endsWith('_axe')) return '🪓';
  if (id.endsWith('_staff') || id.endsWith('_wand')) return '🪄';
  if (id.endsWith('_bow') || id.endsWith('_crossbow')) return '🏹';
  if (id.endsWith('_scepter')) return '🔱';
  if (id.startsWith('ring_')) return '💍';
  if (id.startsWith('pendant_')) return '📿';

  return '📦';
}

const ITEM_ICONS = {
  jewel_of_creation: '💠',
  lochs_feather: '🪶',
  crest_of_monarch: '👑',
  condor_feather: '🪶',
  condor_flame: '🔥',
  box_of_kundun_1: '🎁',
  box_of_kundun_2: '🎁',
  box_of_kundun_3: '🎁',
  box_of_kundun_4: '🎁',
  box_of_kundun_5: '🎁',
  fruit_strength: '🍎',
  fruit_agility: '🍏',
  fruit_vitality: '🍊',
  fruit_energy: '🍇',
  fruit_command: '🍒',
  wings_of_satan: '🪽',
  wings_of_heaven: '🪽',
  wings_of_fairy: '🪽',
  wings_of_soul: '🪽',
  wings_of_elf: '🪽',
  wings_of_darkness: '🪽',
  cape_of_lord: '🪽',
  wings_of_storm: '🪽',
  wings_of_space_time: '🪽',
  wings_of_dimension: '🪽',
  wings_of_eternal: '🪽',
  wings_of_illusion: '🪽',
  wings_of_ruin: '🪽',
  cape_of_emperor: '🪽',
  dragon_blade: '🗡️',
  archangel_sword: '⚔️',
  chaos_dragon_axe: '🪓',
  kundun_staff: '🪄',
  celestial_bow: '🏹',
  short_sword: '🗡️',
  small_dagger: '🗡️',
  dragon_shield: '🛡️',
  tower_shield: '🛡️',
  dragon_helm: '🪖',
  dragon_armor: '🥋',
  dragon_pants: '👖',
  dragon_gloves: '🧤',
  dragon_boots: '👢',
  wings_of_dragon: '🪽',
  jewel_of_blessing: '💎',
  jewel_of_soul: '🔮',
  jewel_of_life: '💚',
  jewel_of_chaos: '⚡',
  jewel_of_harmony: '✨',
  ring_of_ice: '💍',
  pendant_of_ability: '📿',
  guardian_angel: '👼',
};

// ============================================================================
// SÍNTESE DE ÁUDIO WEB (Web Audio API)
// ============================================================================
class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  // Som cristalino celestial de sucesso (Continent of Legend style)
  playSuccessSound() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now);       // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6
      osc1.frequency.exponentialRampToValueAtTime(1567.98, now + 0.35); // G6

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now);       // E5
      osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Som metálico de falha
  playFailureSound() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Som de Sino Sagrado da Joia caindo no chão (Continent of Legend style)
  playJewelDropSound() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Toque primário (Cristal puro ressonante)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const oscOvertone = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2637.02, now); // E7
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(3135.96, now); // G7
      oscOvertone.type = 'sine';
      oscOvertone.frequency.setValueAtTime(5274.04, now); // E8

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc1.connect(gain);
      osc2.connect(gain);
      oscOvertone.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      oscOvertone.start(now);
      osc1.stop(now + 1.4);
      osc2.stop(now + 1.4);
      oscOvertone.stop(now + 1.4);

      // Segundo eco característico com 90ms de delay
      const oscEcho = this.ctx.createOscillator();
      const gainEcho = this.ctx.createGain();
      oscEcho.type = 'sine';
      oscEcho.frequency.setValueAtTime(3520.00, now + 0.09); // A7
      gainEcho.gain.setValueAtTime(0.001, now);
      gainEcho.gain.setValueAtTime(0.25, now + 0.09);
      gainEcho.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      oscEcho.connect(gainEcho);
      gainEcho.connect(this.ctx.destination);
      oscEcho.start(now + 0.09);
      oscEcho.stop(now + 1.2);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Som de impacto / corte de lâmina
  playHitSound() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Som de Dano Excelente / Crítico
  playExcellentSound() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.16);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, now);
      osc2.frequency.exponentialRampToValueAtTime(2093, now + 0.2);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Som de coleta de item (pickup)
  playPickupSound() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
}

const sfx = new SoundEffects();

// ============================================================================
// CLIENTE WEBSOCKET & ESTADO LOCAL
// ============================================================================
class DevClientApp {
  constructor() {
    this.ws = null;
    this.pingTimer = null;
    this.pingStart = 0;
    this.seqOut = 0;
    this.sessionId = null;

    // Estado recebido do servidor
    this.character = null;
    this.definitions = {};
    this.inventoryState = { cols: 8, rows: 8, items: [], equipped: [] };
    this.lastKalimaPortalId = null;

    // Estado do mouse / Drag & Drop
    this.draggedItem = null;
    this.draggedSource = null; // { type: GRID | EQUIPMENT, slot, x, y }
    this.inspectedItem = null;
    this.previewOverrideLevel = 7;

    // Elementos DOM
    this.domGrid = document.getElementById('inventory-grid');
    this.domItemsLayer = document.getElementById('items-layer');
    this.domLogs = document.getElementById('console-logs');
    this.domStatusBadge = document.getElementById('conn-status-badge');
    this.domStatusDot = document.getElementById('status-dot');
    this.domStatusText = document.getElementById('conn-status-text');
    this.domRtt = document.getElementById('telemetry-rtt');
    this.domSession = document.getElementById('telemetry-session');
    this.domCard = document.getElementById('inspected-item-card');
    this.domSlider = document.getElementById('level-slider');
    this.domSliderVal = document.getElementById('slider-level-val');
    this.domGlowBadge = document.getElementById('glow-tier-badge');
    this.canvas = document.getElementById('glow-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Estado da Arena de Combate 2D
    this.combatCanvas = document.getElementById('combat-canvas');
    this.combatCtx = this.combatCanvas ? this.combatCanvas.getContext('2d') : null;
    this.monsters = new Map();
    this.groundDrops = new Map();
    this.floatingDamages = [];
    this.slashEffects = [];
    this.selectedTargetId = null;
    this.playerX = 380;
    this.playerY = 240;
    this.playerTargetX = 380;
    this.playerTargetY = 240;
    this.playerXp = 0;
    this.attackSwing = 0;
    this.viewMode = 'split';

    // Elementos DOM do Combate
    this.domArenaMobs = document.getElementById('arena-mobs-counter');
    this.domArenaDrops = document.getElementById('arena-drops-counter');
    this.domArenaXp = document.getElementById('arena-xp-counter');
    this.domHudTargetName = document.getElementById('hud-target-name');
    this.domHudTargetType = document.getElementById('hud-target-type');
    this.domHudTargetHpFill = document.getElementById('hud-target-hp-fill');
    this.domHudTargetHpText = document.getElementById('hud-target-hp-text');
    this.domHudTargetGhostHp = document.getElementById('hud-target-ghost-hp');
    this.domHudTargetPoise = document.getElementById('hud-target-poise-fill');
    this.domArenaPanel = document.getElementById('combat-arena-panel');
    this.domWorkspaceGrid = document.getElementById('main-workspace-grid');
    this.domViewer3DPanel = document.getElementById('dasi-3d-panel');
    this.domBossesPanel = document.getElementById('bosses-panel');
    this.domEventsPanel = document.getElementById('events-panel');
    this.activeBosses = new Map();
    this.selectedBossId = null;
    this.activeInvasions = [];
    this.eventsStatus = null;
    this.dungeonsStatus = [];
    this.guildStatus = null;
    this.siegeStatus = null;
    this.viewer3DInstance = null;
    this.arena3D = null;
    this.use3DRenderer = true;

    // Sistemas de Gameplay de Ação & Teleporte
    this.harmonicAudio = new HarmonicAudioSynthesizer();
    this.currentMap = 'LORENCIA';
    this.domMapBadge = document.getElementById('arena-map-badge');
    this.domWarpOverlay = document.getElementById('warp-tunnel-overlay');
    this.domLevelUpBanner = document.getElementById('levelup-celebration-banner');
    this.domLevelUpSub = document.getElementById('levelup-banner-sub');

    // Motor de Combate 100% Idle & Telemetria AFK
    this.idleEngine = new IdleAutoCombatEngine();
    this.domIdleBadge = document.getElementById('idle-status-badge');
    this.domIdleText = document.getElementById('idle-status-text');
    this.domIdleAction = document.getElementById('idle-action-text');
    this.domBtnToggleIdle = document.getElementById('btn-toggle-autohunt');
    this.domAfkUptime = document.getElementById('afk-uptime');
    this.domAfkKills = document.getElementById('afk-kills');
    this.domAfkZen = document.getElementById('afk-zen');
    this.domAfkJewels = document.getElementById('afk-jewels');
    this.domAfkDps = document.getElementById('afk-dps');

    // Estado Vital do Jogador (Orbes 3D & Action Bar)
    this.playerHp = 1250;
    this.playerMaxHp = 1250;
    this.playerMp = 680;
    this.playerMaxMp = 680;
    this.playerSd = 500;
    this.playerMaxSd = 500;
    this.playerSta = 100;
    this.playerMaxSta = 100;
    this.cooldowns = { Q: 0, W: 0, E: 0, R: 0, SPACE: 0 };
    this.maxCooldowns = { Q: 2000, W: 2000, E: 1200, R: 3000, SPACE: 1500 };

    this.domHealthFluid = document.getElementById('health-fluid-fill');
    this.domManaFluid = document.getElementById('mana-fluid-fill');
    this.domHealthVal = document.getElementById('orb-health-val');
    this.domManaVal = document.getElementById('orb-mana-val');
    this.domSdFill = document.getElementById('gauge-sd-fill');
    this.domStaFill = document.getElementById('gauge-sta-fill');

    this.initGridCells();
    this.initCanvasShaderEngine();
    this.initCombatArena();
    this.init3DAvatarSystem();
    this.initBossesPanel();
    this.initEventsPanel();
    this.bindEvents();
    this.connect();
  }

  // Gera as 64 células vazias do grid 8x8
  initGridCells() {
    this.domGrid.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.x = c;
        cell.dataset.y = r;
        this.domGrid.appendChild(cell);
      }
    }
  }

  // Conexão WebSocket
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:8080';
    const wsUrl = `${protocol}//${host}`;

    this.log(`Conectando ao GameServer em ${wsUrl}...`, 'info');
    this.updateStatus(false, 'Conectando...');

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (e) {
      this.log(`Falha ao instanciar WebSocket: ${e.message}`, 'danger');
      return;
    }

    this.ws.onopen = () => {
      this.log('Conexão TCP/WebSocket estabelecida. Iniciando Handshake Hello...', 'info');
      this.sendPacket(OPCODES.HANDSHAKE_HELLO, {
        clientVersion: '1.0.0-PROD',
        clientTime: Date.now(),
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleServerMessage(data);
      } catch (err) {
        console.error('Erro ao interpretar pacote JSON:', err);
      }
    };

    this.ws.onclose = () => {
      this.updateStatus(false, 'Desconectado');
      this.log('Conexão encerrada pelo servidor.', 'warning');
      if (this.pingTimer) clearInterval(this.pingTimer);
    };

    this.ws.onerror = (err) => {
      this.log('Erro na conexão com GameServer.', 'danger');
    };
  }

  updateStatus(online, text) {
    if (online) {
      this.domStatusDot.className = 'status-dot online';
      this.domStatusText.textContent = text || 'ONLINE';
    } else {
      this.domStatusDot.className = 'status-dot offline';
      this.domStatusText.textContent = text || 'OFFLINE';
    }
  }

  sendPacket(opcodeObj, payload = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.seqOut = (this.seqOut + 1) & 0xffffffff;
    const packet = {
      opcode: opcodeObj.opcode,
      subcode: opcodeObj.subcode,
      seq: this.seqOut,
      payload,
    };
    this.ws.send(JSON.stringify(packet));
  }

  // Roteamento de mensagens do servidor
  handleServerMessage(msg) {
    const { opcode, subcode, payload } = msg;

    // 1. Handshake Challenge -> Envia Login Req
    if (opcode === OPCODES.HANDSHAKE_CHALLENGE.opcode && subcode === OPCODES.HANDSHAKE_CHALLENGE.subcode) {
      this.log(`Handshake confirmado pelo Servidor (Salt: ${payload.salt}). Autenticando...`, 'info');
      this.sendPacket(OPCODES.AUTH_LOGIN_REQ, {
        username: 'BladeKnight_Hero',
        characterClass: 'DK',
      });
      return;
    }

    // 2. Auth Login Res
    if (opcode === OPCODES.AUTH_LOGIN_RES.opcode && subcode === OPCODES.AUTH_LOGIN_RES.subcode) {
      if (payload.success) {
        this.sessionId = payload.sessionId;
        this.character = payload.character;
        this.domSession.textContent = payload.sessionId.substring(0, 10) + '...';
        this.updateStatus(true, 'AUTENTICADO');
        this.updateCharacterUI(payload.character);
        this.log(`Login autorizado com sucesso! Personagem: [${payload.character.name}]`, 'success');

        // Inicia loop de Ping
        this.startPingLoop();
      } else {
        this.log(`Autenticação rejeitada: ${payload.message}`, 'danger');
      }
      return;
    }

    // 3. Pong (Cálculo RTT)
    if (opcode === OPCODES.PONG.opcode) {
      const rtt = Date.now() - this.pingStart;
      this.domRtt.textContent = `${rtt} ms`;
      return;
    }

    // 3.5 Sincronização de Vitais do Jogador & Respawn (0x10:0x01)
    if (opcode === 0x10 && subcode === 0x01) {
      if (payload.currentHp !== undefined) this.playerHp = payload.currentHp;
      if (payload.maxHp !== undefined) this.playerMaxHp = payload.maxHp;
      if (payload.currentMp !== undefined) this.playerMp = payload.currentMp;
      if (payload.maxMp !== undefined) this.playerMaxMp = payload.maxMp;
      if (payload.currentSd !== undefined) this.playerSd = payload.currentSd;
      if (payload.maxSd !== undefined) this.playerMaxSd = payload.maxSd;
      if (payload.x !== undefined && payload.y !== undefined) {
        this.playerX = payload.x;
        this.playerY = payload.y;
        this.playerTargetX = payload.x;
        this.playerTargetY = payload.y;
        if (this.arena3D) {
          const c3d = this.arena3D.to3DCoords(payload.x, payload.y);
          this.arena3D.playerGroup.position.set(c3d.x, 0, c3d.z);
          this.arena3D.playerTargetPos.set(c3d.x, 0, c3d.z);
          if (this.arena3D.keyboardController) {
            this.arena3D.keyboardController.teleportTo(c3d.x, c3d.z);
          }
        }
      }
      this.update3DHud();
      if (payload.respawned) {
        this.log('✨ Você renasceu revigorado na praça de Lorencia!', 'success');
        const banner = document.getElementById('levelup-celebration-banner');
        if (banner) banner.classList.remove('show');
      }
      return;
    }

    // 4. Sincronização Completa de Inventário
    if (opcode === OPCODES.INVENTORY_SYNC_ALL.opcode && subcode === OPCODES.INVENTORY_SYNC_ALL.subcode) {
      if (payload.definitions) this.definitions = payload.definitions;
      if (payload.character) this.updateCharacterUI(payload.character);
      this.inventoryState = payload.inventory;
      this.renderFullInventory();
      this.log(`Inventário sincronizado (${payload.inventory.items.length} itens na bolsa, ${payload.inventory.equipped.length} equipados).`, 'info');
      return;
    }

    // 5. Resposta de Movimento de Item
    if (opcode === OPCODES.ITEM_MOVE_RES.opcode && subcode === OPCODES.ITEM_MOVE_RES.subcode) {
      if (payload.success) {
        this.log(`Movimento de item validado pelo servidor.`, 'info');
      } else {
        this.log(`Movimento rejeitado: ${payload.error || 'Ação inválida'}`, 'warning');
      }
      if (payload.inventoryState) {
        this.inventoryState = payload.inventoryState;
        this.renderFullInventory();
      }
      return;
    }

    // 6. Resposta de Uso de Joia
    if (opcode === OPCODES.ITEM_USE_JEWEL_RES.opcode && subcode === OPCODES.ITEM_USE_JEWEL_RES.subcode) {
      this.handleJewelResult(payload);
      return;
    }

    // 7. Resposta de Spawn Dev
    if (opcode === OPCODES.ITEM_SPAWN_DEV_RES.opcode && subcode === OPCODES.ITEM_SPAWN_DEV_RES.subcode) {
      if (payload.success) {
        this.log(`Item spawned com sucesso (${payload.itemDefId} x${payload.spawnedCount}).`, 'success');
      } else {
        this.log(`Falha ao spawnar item: inventário cheio.`, 'warning');
      }
      if (payload.inventoryState) {
        this.inventoryState = payload.inventoryState;
        this.renderFullInventory();
      }
      return;
    }

    // 8. Sincronização de Monstros & Spawns (0x15:0x01)
    if (opcode === OPCODES.MONSTER_SPAWN_OR_MOVE.opcode && subcode === OPCODES.MONSTER_SPAWN_OR_MOVE.subcode) {
      this.handleMonsterSync(payload);
      return;
    }

    // 9. Drop de Itens no Chão (0x16:0x01)
    if (opcode === OPCODES.GROUND_ITEM_DROP.opcode && subcode === OPCODES.GROUND_ITEM_DROP.subcode) {
      this.handleGroundItemDrop(payload);
      return;
    }

    // 10. Resposta de Coleta de Item (0x16:0x02)
    if (opcode === OPCODES.GROUND_ITEM_PICKUP_RES.opcode && subcode === OPCODES.GROUND_ITEM_PICKUP_RES.subcode) {
      this.handleGroundItemPickup(payload);
      return;
    }

    // 11. Remoção de Item do Chão (0x16:0x03)
    if (opcode === OPCODES.GROUND_ITEM_REMOVE.opcode && subcode === OPCODES.GROUND_ITEM_REMOVE.subcode) {
      this.groundDrops.delete(payload.dropId);
      if (this.domArenaDrops) this.domArenaDrops.textContent = this.groundDrops.size;
      return;
    }

    // 12. Resultado de Ataque & Dano Colorido (0x50:0x02)
    if (opcode === OPCODES.COMBAT_ATTACK_RES.opcode && subcode === OPCODES.COMBAT_ATTACK_RES.subcode) {
      this.handleCombatAttackResult(payload);
      return;
    }

    // 13. Resultado da Máquina do Caos (0x72:0x02)
    if (opcode === OPCODES.CHAOS_MACHINE_MIX_RES.opcode && subcode === OPCODES.CHAOS_MACHINE_MIX_RES.subcode) {
      this.handleChaosMachineMixResult(payload);
      return;
    }

    // 14. Resultado de Compra em Loja de NPC (0x74:0x02)
    if (opcode === OPCODES.NPC_SHOP_BUY_RES.opcode && subcode === OPCODES.NPC_SHOP_BUY_RES.subcode) {
      this.handleNpcShopBuyResult(payload);
      return;
    }

    // 15. Resultado de Distribuição de Atributos (0x75:0x02)
    if (opcode === OPCODES.STAT_POINT_ALLOC_RES.opcode && subcode === OPCODES.STAT_POINT_ALLOC_RES.subcode) {
      this.handleStatPointAllocResult(payload);
      return;
    }

    // 16. Resultado de Abertura de Box of Kundun (0x80:0x07)
    if (opcode === OPCODES.BOX_KUNDUN_OPEN_RES.opcode && subcode === OPCODES.BOX_KUNDUN_OPEN_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playSuccessSound();
        const itemCount = payload.loot?.items?.length || 1;
        this.log(`🎁 [Box of Kundun] Caixa explodiu em feixe de luz! ${itemCount} itens excelentes e relíquias espalhadas no chão!`, 'success');
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Box of Kundun] ${payload.error || 'Falha ao abrir caixa.'}`, 'warning');
      }
      return;
    }

    // 17. Resultado de Consumo de Fruta Mágica (0x75:0x04)
    if (opcode === OPCODES.FRUIT_CONSUME_RES.opcode && subcode === OPCODES.FRUIT_CONSUME_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playSuccessSound();
        this.log(`🍎 [Fruta Mágica] ${payload.message || `+${payload.pointsGained} pontos em ${payload.statGained}!`}`, 'success');
        if (payload.character) {
          this.character = { ...this.character, ...payload.character };
          this.updateCharacterUI(this.character);
        }
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Fruta Mágica] ${payload.error || 'Falha ao consumir fruta.'}`, 'warning');
      }
      return;
    }

    // 18. Resultado de Venda de Item em Loja de NPC (0x74:0x04)
    if (opcode === OPCODES.NPC_SHOP_SELL_RES.opcode && subcode === OPCODES.NPC_SHOP_SELL_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playSuccessSound();
        this.log(`💰 [Mercador] ${payload.message || `Item vendido por ${payload.zenGained} Zen!`}`, 'success');
        if (payload.zenRemaining !== undefined && this.character) {
          this.character.zen = payload.zenRemaining;
          this.updateCharacterUI(this.character);
        }
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Mercador] ${payload.error || 'Falha ao vender item.'}`, 'warning');
      }
      return;
    }

    // 19. Sincronização e Atualização de Chefes (0x80:0x02)
    if (opcode === OPCODES.BOSS_UPDATE_RES.opcode && subcode === OPCODES.BOSS_UPDATE_RES.subcode) {
      this.handleBossUpdate(payload);
      return;
    }

    // 20. Alerta e Início de Telégrafo do Chefe (0x80:0x03)
    if (opcode === OPCODES.BOSS_TELEGRAPH_CAST.opcode && subcode === OPCODES.BOSS_TELEGRAPH_CAST.subcode) {
      this.handleBossTelegraph(payload);
      return;
    }

    // 21. Anúncio de Invasão Dourada (0x80:0x05)
    if (opcode === OPCODES.GOLDEN_INVASION_RES.opcode && subcode === OPCODES.GOLDEN_INVASION_RES.subcode) {
      this.handleGoldenInvasion(payload);
      return;
    }

    // 22. Status Geral das Arenas de Eventos (0x81:0x02)
    if (opcode === OPCODES.EVENT_STATUS_RES.opcode && subcode === OPCODES.EVENT_STATUS_RES.subcode) {
      this.handleEventStatusUpdate(payload);
      return;
    }

    // 23. Atualização de Blood Castle (0x81:0x06)
    if (opcode === OPCODES.BLOOD_CASTLE_UPDATE_RES.opcode && subcode === OPCODES.BLOOD_CASTLE_UPDATE_RES.subcode) {
      this.updateBloodCastleUI(payload);
      return;
    }

    // 24. Atualização de Devil Square (0x81:0x08)
    if (opcode === OPCODES.DEVIL_SQUARE_UPDATE_RES.opcode && subcode === OPCODES.DEVIL_SQUARE_UPDATE_RES.subcode) {
      this.updateDevilSquareUI(payload);
      return;
    }

    // 25. Atualização de Chaos Castle (0x81:0x0a)
    if (opcode === OPCODES.CHAOS_CASTLE_UPDATE_RES.opcode && subcode === OPCODES.CHAOS_CASTLE_UPDATE_RES.subcode) {
      this.updateChaosCastleUI(payload);
      return;
    }

    // 26. Atualização de Duelo 1v1 (0x81:0x0c)
    if (opcode === OPCODES.DUEL_UPDATE_RES.opcode && subcode === OPCODES.DUEL_UPDATE_RES.subcode) {
      this.updateDuelColiseumUI(payload);
      return;
    }

    // 27. Atualização de Masmorra / Dungeon Catacumbas (0x82:0x04)
    if (opcode === OPCODES.DUNGEON_PROGRESS_RES.opcode && subcode === OPCODES.DUNGEON_PROGRESS_RES.subcode) {
      this.updateDungeonUI(payload);
      return;
    }

    // 28. Estado de Guilda (0xB0:0x02)
    if (opcode === OPCODES.GUILD_STATUS_RES.opcode && subcode === OPCODES.GUILD_STATUS_RES.subcode) {
      this.handleGuildStatusUpdate(payload);
      return;
    }

    // 29. Estado do Cerco ao Castelo (0xB1:0x02)
    if (opcode === OPCODES.SIEGE_STATUS_RES.opcode && subcode === OPCODES.SIEGE_STATUS_RES.subcode) {
      this.updateSiegeUI(payload.siege || payload);
      return;
    }
    if (opcode === OPCODES.SIEGE_REGISTER_RES.opcode && subcode === OPCODES.SIEGE_REGISTER_RES.subcode) {
      this.log(
        payload.success ? '📜 Guilda inscrita no Cerco ao Castelo!' : `📜 ${payload.error || 'Falha na inscrição.'}`,
        payload.success ? 'success' : 'error'
      );
      if (payload.siege) this.updateSiegeUI(payload.siege);
      return;
    }
    if (opcode === OPCODES.SIEGE_ATTACK_STRUCTURE_RES.opcode && subcode === OPCODES.SIEGE_ATTACK_STRUCTURE_RES.subcode) {
      this.log(`💥 Estrutura ${payload.structureId}: ${payload.hp} HP restantes.`, 'info');
      this.refreshSiegeStatus();
      return;
    }
    if (opcode === OPCODES.SIEGE_CROWN_SEAL_RES.opcode && subcode === OPCODES.SIEGE_CROWN_SEAL_RES.subcode) {
      this.log(
        payload.success ? '👑 Selo da Coroa em canalização...' : `👑 ${payload.error || 'Canalização interrompida.'}`,
        payload.success ? 'success' : 'error'
      );
      if (payload.siege) this.updateSiegeUI(payload.siege);
      return;
    }

    // 30. Navegação e Teleportes (0x30:0x02 e 0x30:0x04)
    if (opcode === OPCODES.TELEPORT_RES.opcode && subcode === OPCODES.TELEPORT_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playPortalWarpSound();
        this.log(`🌌 [Teleporte /move] Sucesso! Mapa: ${payload.map} (${payload.x}, ${payload.y}). Zen restante: ${payload.zenRemaining}`, 'success');
        if (this.character && payload.zenRemaining !== undefined) {
          this.character.zen = payload.zenRemaining;
          this.updateCharacterUI(this.character);
        }
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Teleporte] Falha: ${payload.error}`, 'warning');
      }
      return;
    }
    if (opcode === OPCODES.GATE_TRIGGER_RES.opcode && subcode === OPCODES.GATE_TRIGGER_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playPortalWarpSound();
        this.log(`🚪 [Portal Físico] Atravessou portal! Destino: Mapa ${payload.targetMap} (${payload.targetX}, ${payload.targetY}).`, 'info');
      } else {
        this.log(`🚪 [Portal Físico] Rejeitado: ${payload.error}`, 'warning');
      }
      return;
    }

    // 30b. Kalima Portal & Entrada (0x81:0x0e e 0x81:0x10)
    if (opcode === OPCODES.KALIMA_PORTAL_SPAWN_RES.opcode && subcode === OPCODES.KALIMA_PORTAL_SPAWN_RES.subcode) {
      if (payload.success) {
        this.lastKalimaPortalId = payload.portalId;
        if (this.sfx) this.sfx.playPortalWarpSound();
        this.log(`🌌 [Kalima Portal] Portal para Kalima ${payload.kalimaLevel} aberto por ${payload.durationSeconds}s! ID: ${payload.portalId} em (${payload.x}, ${payload.y}).`, 'success');
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Kalima Portal] Falha ao abrir portal: ${payload.error}`, 'warning');
      }
      return;
    }
    if (opcode === OPCODES.KALIMA_ENTER_RES.opcode && subcode === OPCODES.KALIMA_ENTER_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playPortalWarpSound();
        this.log(`🌊 [Kalima] Você adentrou as profundezas de Kalima ${payload.kalimaLevel}! Prepare-se para enfrentar Lord Kundun!`, 'success');
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Kalima] Entrada rejeitada: ${payload.error}`, 'warning');
      }
      return;
    }

    // 31. Social Party (0xB2)
    if (opcode === OPCODES.PARTY_INVITE_RES.opcode && subcode === OPCODES.PARTY_INVITE_RES.subcode) {
      this.log(payload.success ? `🤝 [Party] Convite enviado para sessão ${payload.targetSessionId}!` : `❌ [Party] Convite falhou: ${payload.error}`, payload.success ? 'info' : 'warning');
      return;
    }
    if (opcode === OPCODES.PARTY_RESPOND_INVITE_RES.opcode && subcode === OPCODES.PARTY_RESPOND_INVITE_RES.subcode) {
      this.log(payload.success ? `🤝 [Party] Você ingressou no grupo com sucesso!` : `❌ [Party] Resposta ao convite falhou: ${payload.error}`, payload.success ? 'success' : 'warning');
      return;
    }
    if (opcode === OPCODES.PARTY_LEAVE_RES.opcode && subcode === OPCODES.PARTY_LEAVE_RES.subcode) {
      this.log(`🤝 [Party] ${payload.message || 'Você saiu do grupo.'}`, 'info');
      return;
    }
    if (opcode === OPCODES.PARTY_INFO_RES.opcode && subcode === OPCODES.PARTY_INFO_RES.subcode) {
      this.log(`🤝 [Party] Grupo Atualizado: ${payload.members?.length || 0} membros. Bônus EXP: ${payload.expBonusPct}% (${payload.partyType})`, 'info');
      return;
    }

    // 32. Troca Atômica / Trade (0x76)
    if (opcode === OPCODES.TRADE_REQUEST_RES.opcode && subcode === OPCODES.TRADE_REQUEST_RES.subcode) {
      this.log(payload.success ? `⚖️ [Trade] Solicitação de troca enviada para ${payload.targetSessionId}!` : `❌ [Trade] Falha ao solicitar: ${payload.error}`, payload.success ? 'info' : 'warning');
      return;
    }
    if (opcode === OPCODES.TRADE_RESPOND_RES.opcode && subcode === OPCODES.TRADE_RESPOND_RES.subcode) {
      this.log(payload.success ? `⚖️ [Trade] Sessão de troca aberta com sucesso!` : `❌ [Trade] Resposta de troca rejeitada: ${payload.error}`, payload.success ? 'success' : 'warning');
      return;
    }
    if (opcode === OPCODES.TRADE_ITEM_ADD_RES.opcode && subcode === OPCODES.TRADE_ITEM_ADD_RES.subcode) {
      this.log(payload.success ? `⚖️ [Trade] Item adicionado à negociação.` : `❌ [Trade] Item rejeitado: ${payload.error}`, payload.success ? 'info' : 'warning');
      return;
    }
    if (opcode === OPCODES.TRADE_ZEN_ADD_RES.opcode && subcode === OPCODES.TRADE_ZEN_ADD_RES.subcode) {
      this.log(payload.success ? `⚖️ [Trade] Oferta de Zen atualizada: ${payload.zen} Zen.` : `❌ [Trade] Oferta de Zen falhou: ${payload.error}`, payload.success ? 'info' : 'warning');
      return;
    }
    if (opcode === OPCODES.TRADE_CONFIRM_RES.opcode && subcode === OPCODES.TRADE_CONFIRM_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playSuccessSound();
        this.log(`⚖️ [Trade Concluído] Troca atômica finalizada com sucesso!`, 'success');
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Trade] Falha na confirmação: ${payload.error}`, 'warning');
      }
      return;
    }
    if (opcode === OPCODES.TRADE_CANCEL_RES.opcode && subcode === OPCODES.TRADE_CANCEL_RES.subcode) {
      this.log(`⚖️ [Trade Cancelado] A negociação foi cancelada. Itens devolvidos com segurança.`, 'info');
      return;
    }

    // 33. Loja Pessoal / Personal Shop (0x77)
    if (opcode === OPCODES.PSHOP_OPEN_RES.opcode && subcode === OPCODES.PSHOP_OPEN_RES.subcode) {
      this.log(payload.success ? `🏪 [PShop] Loja Pessoal aberta com sucesso: "${payload.title}"!` : `❌ [PShop] Falha ao abrir loja: ${payload.error}`, payload.success ? 'success' : 'warning');
      return;
    }
    if (opcode === OPCODES.PSHOP_CLOSE_RES.opcode && subcode === OPCODES.PSHOP_CLOSE_RES.subcode) {
      this.log(`🏪 [PShop] Loja Pessoal encerrada.`, 'info');
      return;
    }
    if (opcode === OPCODES.PSHOP_BUY_RES.opcode && subcode === OPCODES.PSHOP_BUY_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playSuccessSound();
        this.log(`🏪 [PShop Compra] Item adquirido com sucesso por ${payload.price} Zen!`, 'success');
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [PShop] Falha na compra: ${payload.error}`, 'warning');
      }
      return;
    }
    if (opcode === OPCODES.PSHOP_INSPECT_RES.opcode && subcode === OPCODES.PSHOP_INSPECT_RES.subcode) {
      this.log(`🏪 [PShop] Loja de [${payload.sellerName}]: "${payload.title}" (${payload.items?.length || 0} itens à venda).`, 'info');
      return;
    }

    // 34. Progressão: Resets, Quests e Master Skill Tree (0x83)
    if (opcode === OPCODES.RESET_RES.opcode && subcode === OPCODES.RESET_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playSuccessSound();
        this.log(`🌟 [RESET CONCLUÍDO] Reset #${payload.resets}! Nível reiniciado para 1, +${payload.pointsBonus} pontos bônus recebidos!`, 'success');
        if (this.character) {
          this.character.level = 1;
          this.character.resets = payload.resets;
          this.character.statPoints = (this.character.statPoints || 0) + payload.pointsBonus;
          this.updateCharacterUI(this.character);
        }
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Reset] Falha: ${payload.error}`, 'warning');
      }
      return;
    }
    if (opcode === OPCODES.MASTER_RESET_RES.opcode && subcode === OPCODES.MASTER_RESET_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playSuccessSound();
        this.log(`👑 [MASTER RESET CONCLUÍDO] Master Reset #${payload.masterResets}! +${payload.wCoinsBonus} WCoins concedidos!`, 'success');
        if (this.character) {
          this.character.level = 1;
          this.character.resets = 0;
          this.character.masterResets = payload.masterResets;
          this.updateCharacterUI(this.character);
        }
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Master Reset] Falha: ${payload.error}`, 'warning');
      }
      return;
    }
    if (opcode === OPCODES.QUEST_INFO_RES.opcode && subcode === OPCODES.QUEST_INFO_RES.subcode) {
      this.log(`📜 [Quests de Evolução] Sebina 2nd: ${payload.progression?.sebinaChangeCompleted ? 'Completa' : 'Pendente'} | Marlon Combo: ${payload.progression?.marlonComboCompleted ? 'Completa' : 'Pendente'} | Devin 3rd: ${payload.progression?.thirdClassChangeCompleted ? 'Completa' : 'Pendente'}`, 'info');
      return;
    }
    if (opcode === OPCODES.QUEST_ACTION_RES.opcode && subcode === OPCODES.QUEST_ACTION_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playSuccessSound();
        this.log(`📜 [Quest Concluída] ${payload.message || 'Evolução de classe realizada com glória!'}`, 'success');
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Quest] Falha: ${payload.error}`, 'warning');
      }
      return;
    }
    if (opcode === OPCODES.MASTER_SKILL_ALLOC_RES.opcode && subcode === OPCODES.MASTER_SKILL_ALLOC_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playSuccessSound();
        this.log(`✨ [Master Skill] Ponto alocado com sucesso na habilidade [${payload.skillId}]! Pontos restantes: ${payload.remainingPoints}`, 'success');
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Master Skill] Falha: ${payload.error}`, 'warning');
      }
      return;
    }

    // 35. Famílias Gens (0x84)
    if (opcode === OPCODES.GENS_JOIN_RES.opcode && subcode === OPCODES.GENS_JOIN_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playSuccessSound();
        this.log(`⚔️ [Gens] Você jurou lealdade à Família ${payload.family}! Glória ao seu clã!`, 'success');
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Gens] Falha ao ingressar: ${payload.error}`, 'warning');
      }
      return;
    }
    if (opcode === OPCODES.GENS_STATUS_RES.opcode && subcode === OPCODES.GENS_STATUS_RES.subcode) {
      this.log(`⚔️ [Gens] Família: ${payload.family || 'Nenhuma'} | Patente: ${payload.rankName || 'Nenhuma'} | Contribuição: ${payload.contribution || 0} pts`, 'info');
      return;
    }
    if (opcode === OPCODES.GENS_LEAVE_RES.opcode && subcode === OPCODES.GENS_LEAVE_RES.subcode) {
      this.log(`⚔️ [Gens] Você abandonou sua Família Gens.`, 'info');
      return;
    }

    // 36. Refinamentos Harmony e Socket (0x85)
    if (opcode === OPCODES.HARMONY_SMELT_RES.opcode && subcode === OPCODES.HARMONY_SMELT_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playSuccessSound();
        this.log(`💎 [Harmony Smelt] Sucesso! Opção de Harmonia despertada no item (+${payload.harmonyOption}).`, 'success');
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Harmony] Falha no refino: ${payload.error}`, 'warning');
      }
      return;
    }
    if (opcode === OPCODES.HARMONY_RESTORE_RES.opcode && subcode === OPCODES.HARMONY_RESTORE_RES.subcode) {
      this.log(payload.success ? `💎 [Harmony Restore] Opção de Harmonia purificada do item.` : `❌ [Harmony] Restauração falhou: ${payload.error}`, payload.success ? 'info' : 'warning');
      return;
    }
    if (opcode === OPCODES.SOCKET_MOUNT_RES.opcode && subcode === OPCODES.SOCKET_MOUNT_RES.subcode) {
      if (payload.success) {
        if (this.sfx) this.sfx.playSuccessSound();
        this.log(`🔮 [Socket System] Seed Sphere acoplada com perfeição no slot ${payload.slotIndex}!`, 'success');
      } else {
        if (this.sfx) this.sfx.playFailureSound();
        this.log(`❌ [Socket System] Falha ao acoplar: ${payload.error}`, 'warning');
      }
      return;
    }
    if (opcode === OPCODES.SOCKET_UNMOUNT_RES.opcode && subcode === OPCODES.SOCKET_UNMOUNT_RES.subcode) {
      this.log(payload.success ? `🔮 [Socket System] Seed Sphere desencaixada do slot ${payload.slotIndex}.` : `❌ [Socket System] Falha: ${payload.error}`, payload.success ? 'info' : 'warning');
      return;
    }
  }

  // Inicia ping periódico a cada 5s
  startPingLoop() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      this.pingStart = Date.now();
      this.sendPacket(OPCODES.PING, { clientTime: this.pingStart });
    }, 5000);
  }


  // ==========================================================================
  // SISTEMA DE AVATARES 3D & SALÃO DOS HERÓIS (AS 5 CLASSES CANÔNICAS)
  // ==========================================================================
  init3DAvatarSystem() {
    const avatarCanvas = document.getElementById('char-avatar-canvas');
    if (avatarCanvas) {
      this.avatar3DRenderer = new Dasi3DAvatarRenderer('char-avatar-canvas', this.charClass || 'DK');
    }
    this.heroClassModal = new DasiHeroClassModal(this);
  }

  switchHeroClass(newClass) {
    const classDef = CLASS_DEFINITIONS[newClass];
    if (!classDef) return;

    this.charClass = newClass;

    const nameEl = document.getElementById('char-name');
    const classEl = document.getElementById('char-class');
    const avatarTagEl = document.getElementById('avatar-class-tag');

    if (nameEl) nameEl.textContent = classDef.title;
    if (classEl) classEl.textContent = classDef.id;
    if (avatarTagEl) avatarTagEl.textContent = classDef.id;

    if (this.character) {
      this.character.characterClass = newClass;
      this.character.name = classDef.title;
      this.character.strength = classDef.baseStats.str;
      this.character.agility = classDef.baseStats.agi;
      this.character.vitality = classDef.baseStats.vit;
      this.character.energy = classDef.baseStats.ene;
      this.updateCharacterUI(this.character);
    }

    if (this.avatar3DRenderer) {
      this.avatar3DRenderer.setClass(newClass);
    }

    // Atualiza Habilidades na Barra Idle do HUD
    const slot1 = document.getElementById('slot-skill-cyclone');
    const slot2 = document.getElementById('slot-skill-deathstab');
    if (classDef.skills.length >= 2) {
      if (slot1) {
        slot1.title = `Auto-Skill: ${classDef.skills[0].name} (${classDef.skills[0].desc})`;
        const iconEl = slot1.querySelector('.idle-skill-icon');
        const lblEl = slot1.querySelector('.idle-skill-label');
        if (iconEl) iconEl.textContent = classDef.skills[0].icon;
        if (lblEl) lblEl.textContent = classDef.skills[0].name;
      }
      if (slot2) {
        slot2.title = `Auto-Skill: ${classDef.skills[1].name} (${classDef.skills[1].desc})`;
        const iconEl = slot2.querySelector('.idle-skill-icon');
        const lblEl = slot2.querySelector('.idle-skill-label');
        if (iconEl) iconEl.textContent = classDef.skills[1].icon;
        if (lblEl) lblEl.textContent = classDef.skills[1].name;
      }
    }

    // Atualiza a malha do Herói na Arena 3D
    if (this.arena3D && typeof this.arena3D.updatePlayerHeroClass === 'function') {
      this.arena3D.updatePlayerHeroClass(newClass);
    }

    // Se estiver no Painel 3D e visualizando Herói, atualiza também
    if (this.viewer3DInstance && this.viewer3DInstance.currentCategory === 'HERO') {
      const tierMap = { DK: 'DRAGON', DW: 'GRAND_SOUL', ELF: 'SPIRIT', MG: 'HURRICANE', DL: 'DARK_MASTER' };
      this.viewer3DInstance.selectEntity('HERO', newClass, { setTier: tierMap[newClass] || 'DRAGON' });
    }
    if (this.updateSplitArtDisplay && this.viewer3DInstance && this.viewer3DInstance.currentCategory === 'HERO') {
      this.updateSplitArtDisplay('HERO_' + newClass);
    }

    if (typeof sfx !== 'undefined' && sfx) {
      sfx.playLevelUpSound();
    }

    this.log(`⚔️👑 [SALÃO DOS HERÓIS] Você assumiu a classe ${classDef.name} (${classDef.title})!`, 'success');
  }

  updateCharacterUI(char) {
    if (!char) return;
    this.character = char;
    document.getElementById('char-name').textContent = char.name;
    document.getElementById('char-class').textContent = char.characterClass;
    const avatarTagEl = document.getElementById('avatar-class-tag');
    if (avatarTagEl) avatarTagEl.textContent = char.characterClass;
    if (this.avatar3DRenderer && this.avatar3DRenderer.currentClass !== char.characterClass) {
      this.avatar3DRenderer.setClass(char.characterClass);
    }
    document.getElementById('char-level').textContent = char.level;
    document.getElementById('stat-str').textContent = char.strength;
    document.getElementById('stat-agi').textContent = char.agility;
    document.getElementById('stat-vit').textContent = char.vitality;
    document.getElementById('stat-ene').textContent = char.energy;

    const statPtsEl = document.getElementById('stat-points');
    const freePts = char.statPoints ?? 0;
    if (statPtsEl) statPtsEl.textContent = freePts;

    const pillFreePts = document.getElementById('pill-free-points');
    if (pillFreePts) {
      pillFreePts.style.display = freePts > 0 ? 'flex' : 'none';
    }

    document.querySelectorAll('.btn-stat-add').forEach((btn) => {
      btn.style.display = freePts > 0 ? 'inline-flex' : 'none';
    });

    this.updateActionBarForClass(char.characterClass);
  }

  updateActionBarForClass(className) {
    const isDw = className === 'DW' || className === 'SOUL_MASTER';
    const isElf = className === 'ELF' || className === 'FAIRY_ELF' || className === 'MUSE_ELF';
    const isMg = className === 'MG' || className === 'DUEL_MASTER';
    const isDl = className === 'DL' || className === 'LORD_EMPEROR';
    const isSu = className === 'SU' || className === 'DIMENSION_MASTER';
    const isRf = className === 'RF' || className === 'FIST_MASTER';

    const slotCyclone = document.getElementById('slot-skill-cyclone');
    const slotDeathstab = document.getElementById('slot-skill-deathstab');
    const slotWeapon = document.getElementById('slot-skill-weapon');
    const hintTitle = document.getElementById('hint-class-title');
    if (hintTitle) {
      hintTitle.textContent = `GUIA DE COMANDOS CANÔNICOS (${className})`;
    }

    if (isDw) {
      if (slotCyclone) {
        const icon = slotCyclone.querySelector('.idle-skill-icon');
        const lbl = slotCyclone.querySelector('.idle-skill-label');
        const status = slotCyclone.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '🔥';
        if (lbl) lbl.textContent = 'Fireball';
        if (status) status.textContent = '[E / 2]';
        slotCyclone.title = 'Fireball [Atalho: E / 2] - Bola de Fogo Arcana';
      }
      if (slotDeathstab) {
        const icon = slotDeathstab.querySelector('.idle-skill-icon');
        const lbl = slotDeathstab.querySelector('.idle-skill-label');
        const status = slotDeathstab.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '👻';
        if (lbl) lbl.textContent = 'Evil Spirits';
        if (status) status.textContent = '[R / 3 / RMB]';
        slotDeathstab.title = 'Evil Spirits [Atalho: R / 3 ou Botão Direito] - Espíritos Malignos AoE';
      }
      if (slotWeapon) {
        const icon = slotWeapon.querySelector('.idle-skill-icon');
        const lbl = slotWeapon.querySelector('.idle-skill-label');
        if (icon) icon.textContent = '🔮';
        if (lbl) lbl.textContent = 'Energy Ball';
        slotWeapon.title = 'Energy Ball [Atalho: Botão Esquerdo] - Projétil Arcano Básico';
      }
    } else if (isElf) {
      if (slotCyclone) {
        const icon = slotCyclone.querySelector('.idle-skill-icon');
        const lbl = slotCyclone.querySelector('.idle-skill-label');
        const status = slotCyclone.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '🏹';
        if (lbl) lbl.textContent = 'Triple Shot';
        if (status) status.textContent = '[E / 2]';
        slotCyclone.title = 'Triple Shot [Atalho: E / 2] - Disparo Tríplice em Cone';
      }
      if (slotDeathstab) {
        const icon = slotDeathstab.querySelector('.idle-skill-icon');
        const lbl = slotDeathstab.querySelector('.idle-skill-label');
        const status = slotDeathstab.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '🎯';
        if (lbl) lbl.textContent = 'Penetration';
        if (status) status.textContent = '[R / 3 / RMB]';
        slotDeathstab.title = 'Penetration [Atalho: R / 3 ou Botão Direito] - Disparo Perfurante Letal';
      }
      if (slotWeapon) {
        const icon = slotWeapon.querySelector('.idle-skill-icon');
        const lbl = slotWeapon.querySelector('.idle-skill-label');
        if (icon) icon.textContent = '🏹';
        if (lbl) lbl.textContent = 'Flecha Élfica';
        slotWeapon.title = 'Disparo com Arco e Aljava [Atalho: Botão Esquerdo]';
      }
    } else if (isMg) {
      if (slotCyclone) {
        const icon = slotCyclone.querySelector('.idle-skill-icon');
        const lbl = slotCyclone.querySelector('.idle-skill-label');
        const status = slotCyclone.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '🔥';
        if (lbl) lbl.textContent = 'Fire Slash';
        if (status) status.textContent = '[E / 2]';
        slotCyclone.title = 'Fire Slash [Atalho: E / 2] - Golpe Igneo Cortante';
      }
      if (slotDeathstab) {
        const icon = slotDeathstab.querySelector('.idle-skill-icon');
        const lbl = slotDeathstab.querySelector('.idle-skill-label');
        const status = slotDeathstab.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '⚡';
        if (lbl) lbl.textContent = 'Power Slash';
        if (status) status.textContent = '[R / 3 / RMB]';
        slotDeathstab.title = 'Power Slash [Atalho: R / 3 ou Botão Direito] - Lâmina de Energia em Arco';
      }
      if (slotWeapon) {
        const icon = slotWeapon.querySelector('.idle-skill-icon');
        const lbl = slotWeapon.querySelector('.idle-skill-label');
        if (icon) icon.textContent = '⚔️';
        if (lbl) lbl.textContent = 'Golpe MG';
        slotWeapon.title = 'Lâmina Rúnica Mágica [Atalho: Botão Esquerdo]';
      }
    } else if (isDl) {
      if (slotCyclone) {
        const icon = slotCyclone.querySelector('.idle-skill-icon');
        const lbl = slotCyclone.querySelector('.idle-skill-label');
        const status = slotCyclone.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '💥';
        if (lbl) lbl.textContent = 'Fire Burst';
        if (status) status.textContent = '[E / 2 / RMB]';
        slotCyclone.title = 'Fire Burst [Atalho: E / 2 ou Botão Direito] - Detonação Ígnea em Cadeia';
      }
      if (slotDeathstab) {
        const icon = slotDeathstab.querySelector('.idle-skill-icon');
        const lbl = slotDeathstab.querySelector('.idle-skill-label');
        const status = slotDeathstab.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '🌋';
        if (lbl) lbl.textContent = 'Earthquake';
        if (status) status.textContent = '[R / 3]';
        slotDeathstab.title = 'Earthquake [Atalho: R / 3] - Impacto Sísmico 360° do Dark Horse';
      }
      if (slotWeapon) {
        const icon = slotWeapon.querySelector('.idle-skill-icon');
        const lbl = slotWeapon.querySelector('.idle-skill-label');
        if (icon) icon.textContent = '🔱';
        if (lbl) lbl.textContent = 'Golpe do Cetro';
        slotWeapon.title = 'Ataque do Cetro Imperial [Atalho: Botão Esquerdo]';
      }
    } else if (isSu) {
      if (slotCyclone) {
        const icon = slotCyclone.querySelector('.idle-skill-icon');
        const lbl = slotCyclone.querySelector('.idle-skill-label');
        const status = slotCyclone.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '⚡';
        if (lbl) lbl.textContent = 'Lightning Shock';
        if (status) status.textContent = '[E / 2]';
        slotCyclone.title = 'Lightning Shock [Atalho: E / 2] - Choque Elétrico Dimensional';
      }
      if (slotDeathstab) {
        const icon = slotDeathstab.querySelector('.idle-skill-icon');
        const lbl = slotDeathstab.querySelector('.idle-skill-label');
        const status = slotDeathstab.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '🪞';
        if (lbl) lbl.textContent = 'Damage Reflect';
        if (status) status.textContent = '[R / 3 / RMB]';
        slotDeathstab.title = 'Damage Reflect [Atalho: R / 3 ou Botão Direito] - Espelho de Reflexão de Dano';
      }
      if (slotWeapon) {
        const icon = slotWeapon.querySelector('.idle-skill-icon');
        const lbl = slotWeapon.querySelector('.idle-skill-label');
        if (icon) icon.textContent = '🔮';
        if (lbl) lbl.textContent = 'Orbe Invocador';
        slotWeapon.title = 'Ataque Místico da Invocadora [Atalho: Botão Esquerdo]';
      }
    } else if (isRf) {
      if (slotCyclone) {
        const icon = slotCyclone.querySelector('.idle-skill-icon');
        const lbl = slotCyclone.querySelector('.idle-skill-label');
        const status = slotCyclone.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '🐉';
        if (lbl) lbl.textContent = 'Dragon Roar';
        if (status) status.textContent = '[E / 2]';
        slotCyclone.title = 'Dragon Roar [Atalho: E / 2] - Rugido Sônico 360°';
      }
      if (slotDeathstab) {
        const icon = slotDeathstab.querySelector('.idle-skill-icon');
        const lbl = slotDeathstab.querySelector('.idle-skill-label');
        const status = slotDeathstab.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '👊';
        if (lbl) lbl.textContent = 'Chain Drive';
        if (status) status.textContent = '[R / 3 / RMB]';
        slotDeathstab.title = 'Chain Drive [Atalho: R / 3 ou Botão Direito] - Sucessão de Socos Devastadores';
      }
      if (slotWeapon) {
        const icon = slotWeapon.querySelector('.idle-skill-icon');
        const lbl = slotWeapon.querySelector('.idle-skill-label');
        if (icon) icon.textContent = '🥊';
        if (lbl) lbl.textContent = 'Punho de Ferro';
        slotWeapon.title = 'Ataque Marcial Desarmado [Atalho: Botão Esquerdo]';
      }
    } else {
      if (slotCyclone) {
        const icon = slotCyclone.querySelector('.idle-skill-icon');
        const lbl = slotCyclone.querySelector('.idle-skill-label');
        const status = slotCyclone.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '🌪️';
        if (lbl) lbl.textContent = 'Twisting Slash';
        if (status) status.textContent = '[E / 2 / RMB]';
        slotCyclone.title = 'Twisting Slash [Atalho: E / 2 ou Botão Direito] - Dano em Área 360°';
      }
      if (slotDeathstab) {
        const icon = slotDeathstab.querySelector('.idle-skill-icon');
        const lbl = slotDeathstab.querySelector('.idle-skill-label');
        const status = slotDeathstab.querySelector('.idle-skill-status');
        if (icon) icon.textContent = '⚡';
        if (lbl) lbl.textContent = 'Death Stab';
        if (status) status.textContent = '[R / 3]';
        slotDeathstab.title = 'Death Stab [Atalho: R / 3] - Estocada Perfurante Letal';
      }
      if (slotWeapon) {
        const icon = slotWeapon.querySelector('.idle-skill-icon');
        const lbl = slotWeapon.querySelector('.idle-skill-label');
        if (icon) icon.textContent = '⚔️';
        if (lbl) lbl.textContent = 'Golpe DK';
        slotWeapon.title = 'Ataque Primário da Lâmina [Atalho: Botão Esquerdo]';
      }
    }
  }

  handleStatPointAllocResult(payload) {
    if (payload.success) {
      this.character = payload.character;
      this.updateCharacterUI(payload.character);
      this.playerMaxHp = 1000 + (payload.character.level * 25) + (payload.character.vitality * 2);
      this.playerMaxMp = 450 + (payload.character.level * 18) + (payload.character.energy * 2);
      this.update3DHud();
      sfx.playPickupSound();
      this.log(`✨💪 [ATRIBUTO ELEVADO] ${payload.message || 'Ponto distribuído com sucesso!'}`, 'success');
    } else {
      this.log(`⚠️ [FALHA NA ALOCAÇÃO] ${payload.error || 'Não foi possível alocar o atributo.'}`, 'warning');
    }
  }

  handleNpcShopBuyResult(payload) {
    if (payload.success) {
      if (payload.inventoryState) {
        this.inventoryState = payload.inventoryState;
        this.renderFullInventory();
      }
      if (this.character) {
        this.character.zen = payload.zenRemaining;
      }
      const shopZenEl = document.getElementById('shop-player-zen');
      if (shopZenEl) shopZenEl.textContent = `${(payload.zenRemaining || 0).toLocaleString()} Zen`;
      sfx.playPickupSound();
      this.log(`🛒 [COMPRA NO MERCADOR] ${payload.message || 'Item adquirido com sucesso!'}`, 'success');
    } else {
      this.log(`⚠️ [FALHA NA COMPRA] ${payload.error || 'Saldo insuficiente ou bolsa cheia!'}`, 'warning');
    }
  }

  handleChaosMachineMixResult(payload) {
    if (payload.success) {
      if (payload.createdItem || payload.updatedItem) {
        sfx.playJewelSuccessSound();
      }
      this.triggerChaosForge();
      this.log(`⚡💎 [MÁQUINA DO CAOS] ${payload.message || 'Fusão alquímica completada com sucesso!'}`, 'success');
    } else {
      sfx.playJewelFailSound();
      this.log(`💥 [COLAPSO DO CAOS] ${payload.message || 'A fusão alquímica colapsou!'}`, 'danger');
    }
    this.sendPacket(OPCODES.INVENTORY_SYNC_ALL, {});
  }

  // ==========================================================================
  // HANDLERS DO SISTEMA DE MONSTROS, COMBATE E DROPS
  // ==========================================================================

  // Sincronização de Monstros
  handleMonsterSync(payload) {
    if (!payload.monsters) return;
    const currentMobIds = new Set();
    for (const m of payload.monsters) {
      currentMobIds.add(m.id);
      const existing = this.monsters.get(m.id);
      if (existing) {
        existing.targetX = m.x;
        existing.targetY = m.y;
        existing.currentHp = m.currentHp;
        existing.maxHp = m.maxHp;
        existing.state = m.state;
        existing.isDead = m.isDead;
      } else {
        this.monsters.set(m.id, {
          ...m,
          displayX: m.x,
          displayY: m.y,
        });
      }
    }

    for (const id of this.monsters.keys()) {
      if (!currentMobIds.has(id)) {
        this.monsters.delete(id);
      }
    }

    if (this.domArenaMobs) {
      let aliveCount = 0;
      for (const m of this.monsters.values()) {
        if (!m.isDead) aliveCount++;
      }
      this.domArenaMobs.textContent = aliveCount;
    }

    if (this.selectedTargetId) {
      const mob = this.monsters.get(this.selectedTargetId);
      this.updateTargetHud(mob);
    }

    if (this.arena3D) {
      this.arena3D.syncMonsters(this.monsters);
    }
  }

  // Queda de Itens no Chão
  handleGroundItemDrop(payload) {
    const drops = Array.isArray(payload?.drops) ? payload.drops : payload?.drop ? [payload.drop] : [];
    if (drops.length === 0) return;
    let hasJewel = false;

    for (const drop of drops) {
      if (!drop?.dropId) continue;
      this.groundDrops.set(drop.dropId, drop);
      if (drop.isJewel) hasJewel = true;
    }

    if (this.domArenaDrops) this.domArenaDrops.textContent = this.groundDrops.size;

    if (this.arena3D) {
      this.arena3D.syncGroundDrops(this.groundDrops);
    }

    if (hasJewel) {
      sfx.playJewelDropSound();
      this.log(`💎✨ [JOIA SAGRADA] Uma Joia Sagrada caiu com feixe de luz nas planícies!`, 'success');
    }
  }

  // Coleta de Item
  handleGroundItemPickup(payload) {
    if (payload.success) {
      this.groundDrops.delete(payload.dropId);
      if (this.domArenaDrops) this.domArenaDrops.textContent = this.groundDrops.size;
      if (this.arena3D) this.arena3D.syncGroundDrops(this.groundDrops);
      sfx.playPickupSound();

      if (payload.zen > 0) {
        this.log(`💰 [COLETA] Você recolheu ${payload.zen} Zen do chão!`, 'success');
      } else if (payload.item) {
        const def = this.definitions[payload.item.defId];
        const name = def ? def.name : payload.item.defId;
        this.log(`🖐️ [COLETA] Você recolheu [${name} +${payload.item.level || 0}] para a sua bolsa!`, 'success');
      }

      if (this.idleEngine) {
        const isJewel = Boolean(payload.item && (
          payload.item.defId.includes('jewel') ||
          payload.item.defId.includes('bless') ||
          payload.item.defId.includes('soul') ||
          payload.item.defId.includes('chaos') ||
          payload.item.defId.includes('life')
        ));
        this.idleEngine.recordLoot(isJewel, payload.zen || 0);
      }

      if (payload.inventoryState) {
        this.inventoryState = payload.inventoryState;
        this.renderFullInventory();
      }
    } else {
      this.log(`Falha ao coletar item: ${payload.error || 'Ação inválida'}`, 'warning');
    }
  }

  // Resultado de Ataque & Dano Colorido
  handleCombatAttackResult(payload) {
    const { targetId, damage, damageType, colorHex, isMiss, isDead, staggered, targetHp, targetMaxHp, xpGained, isPlayerTarget } = payload;

    // Se o ataque for desferido por monstro contra o próprio jogador
    if (isPlayerTarget || targetId === this.sessionId) {
      if (!isMiss && damage > 0) {
        this.playerHp = targetHp;
        if (payload.targetSd !== undefined) this.playerSd = payload.targetSd;
        this.update3DHud();

        if (this.arena3D) {
          this.arena3D.spawnDamageText(this.playerX, this.playerY, damage, '#ef4444');
        }

        if (isDead) {
          this.log('☠️ [DERROTA] Você foi abatido em combate! Renascendo na praça de Lorencia...', 'warning');
          const banner = document.getElementById('levelup-celebration-banner');
          const title = banner?.querySelector('.levelup-banner-title');
          const sub = document.getElementById('levelup-banner-sub');
          if (banner && title && sub) {
            title.textContent = '☠️ VOCÊ FOI DERROTADO ☠️';
            title.style.color = '#ef4444';
            sub.textContent = 'Renascendo no centro sagrado de Lorencia...';
            banner.classList.add('show');
            setTimeout(() => {
              title.textContent = '⭐ LEVEL UP! ⭐';
              title.style.color = '';
              banner.classList.remove('show');
            }, 2500);
          }
        }
      }
      return;
    }

    const mob = this.monsters.get(targetId);
    const boss = this.activeBosses.get(targetId);

    if (this.idleEngine) {
      if (!isMiss && damage > 0) {
        this.idleEngine.recordDamageDealt(damage);
      }
      if (isDead) {
        this.idleEngine.recordMonsterKilled();
      }
      if (xpGained) {
        this.idleEngine.metrics.xpGained += xpGained;
      }
    }

    if (mob) {
      mob.currentHp = targetHp;
      mob.maxHp = targetMaxHp;
      mob.isDead = isDead;
      if (staggered) {
        mob.state = 'STAGGERED';
        mob.staggerUntil = Date.now() + 150;
      }
      this.updateTargetHud(mob);
    }

    if (boss) {
      boss.currentHp = targetHp;
      boss.maxHp = targetMaxHp;
      boss.isDead = isDead;
      if (this.arena3D && typeof this.arena3D.syncBosses === 'function') {
        this.arena3D.syncBosses(this.activeBosses);
      }
      this.updateBossHud(boss);
    }

    const target = mob || boss;
    const posX = target ? (target.displayX || target.x) : this.playerX + 50;
    const posY = target ? (target.displayY || target.y) : this.playerY - 20;

    // Adiciona número flutuante de dano colorido
    this.floatingDamages.push({
      x: posX + (Math.random() * 20 - 10),
      y: posY - 25,
      text: isMiss ? 'MISS' : damage.toString(),
      damageType,
      colorHex: colorHex || '#FFFFFF',
      alpha: 1.0,
      createdAt: Date.now(),
      lifetime: 1200,
    });

    // Adiciona efeito de corte / faísca
    this.slashEffects.push({
      x: posX,
      y: posY,
      radius: damageType === 'EXCELLENT' || damageType === 'CRITICAL' ? 32 : 22,
      colorHex: colorHex || '#FFFFFF',
      createdAt: Date.now(),
      lifetime: 250,
    });

    // Projeta número flutuante de dano na Arena 3D e dispara reação física/visual no monstro
    if (this.arena3D && !isMiss) {
      this.arena3D.spawnDamageText(posX, posY, damage, colorHex);
      if (typeof this.arena3D.onEntityDamaged === 'function') {
        const targetType = target ? (target.type || target.name || target.kind || 'spider') : 'spider';
        this.arena3D.onEntityDamaged(targetId, isDead, staggered, targetType);
      }
    }

    // Gatilho de animação do atacante
    this.attackSwing = 1.0;

    // Efeitos Sonoros
    if (damageType === 'EXCELLENT') {
      sfx.playExcellentSound();
      this.log(`⚔️💥 [DANO EXCELENTE] ${damage} de dano verde no monstro!`, 'success');
    } else if (damageType === 'CRITICAL') {
      sfx.playExcellentSound();
      this.log(`⚔️⚡ [DANO CRÍTICO] ${damage} de dano azul no monstro!`, 'info');
    } else if (damageType === 'IGNORE_DEFENSE') {
      sfx.playExcellentSound();
      this.log(`⚔️👑 [IGNORAR DEFESA] ${damage} de dano dourado direto na armadura!`, 'warning');
    } else if (!isMiss) {
      sfx.playHitSound();
    }

    if (xpGained > 0) {
      this.playerXp += xpGained;
      if (this.domArenaXp) this.domArenaXp.textContent = this.playerXp;
      if (isDead) {
        this.log(`💀 [INIMIGO DERROTADO] Alvo eliminado! (+${xpGained} XP)`, 'info');
      }

      // Verificação autoritativa de Level Up por acúmulo de XP
      const curLvl = this.character ? this.character.level : 250;
      const prog = LevelUpSystem.processXpGain(curLvl, this.playerXp, 0);
      if (prog.leveledUp && prog.currentLevel > curLvl) {
        if (this.character) {
          this.character.level = prog.currentLevel;
          this.character.strength += 3;
          this.character.agility += 2;
          this.character.vitality += 2;
        }
        this.playerMaxHp = prog.maxHp;
        this.playerHp = prog.maxHp;
        this.playerMaxMp = prog.maxMp;
        this.playerMp = prog.maxMp;
        this.updateCharacterUI(this.character);
        this.update3DHud();
        this.triggerLevelUpCelebration(prog.currentLevel);
      }
    }
  }

  updateTargetHud(mob) {
    if (!mob || mob.isDead) {
      this.domHudTargetName.textContent = 'Nenhum (Clique em um monstro)';
      this.domHudTargetType.textContent = '';
      this.domHudTargetHpFill.style.width = '0%';
      if (this.domHudTargetGhostHp) this.domHudTargetGhostHp.style.width = '0%';
      this.domHudTargetHpText.textContent = '-- / --';
      if (this.domHudTargetPoise) this.domHudTargetPoise.style.width = '100%';
      return;
    }

    this.domHudTargetName.textContent = `[Nv.${mob.level}] ${mob.name}`;
    this.domHudTargetType.textContent = ` • ${mob.type.toUpperCase()}`;
    const pct = Math.max(0, Math.min(100, Math.round((mob.currentHp / mob.maxHp) * 100)));
    this.domHudTargetHpFill.style.width = `${pct}%`;
    if (this.domHudTargetGhostHp) {
      setTimeout(() => {
        if (this.domHudTargetGhostHp) this.domHudTargetGhostHp.style.width = `${pct}%`;
      }, 150);
    }
    this.domHudTargetHpText.textContent = `${mob.currentHp} / ${mob.maxHp}`;
    if (this.domHudTargetPoise) {
      const poisePct = mob.staggerUntil && Date.now() < mob.staggerUntil ? 0 : 100;
      this.domHudTargetPoise.style.width = `${poisePct}%`;
    }
  }

  // ==========================================================================
  // RENDERIZAÇÃO DO INVENTÁRIO (GRADE 8x8 & PAPERDOLL)
  // ==========================================================================
  renderFullInventory() {
    // 1. Limpa camada de itens da grade
    this.domItemsLayer.innerHTML = '';

    // 2. Limpa todos os slots de equipamento
    const slotElements = document.querySelectorAll('.equip-slot');
    slotElements.forEach((el) => {
      el.innerHTML = '';
      el.classList.remove('has-item');
    });

    // 3. Renderiza itens na grade 8x8
    for (const entry of this.inventoryState.items) {
      const itemView = this.createItemElement(entry.item, entry.width, entry.height, entry.x, entry.y);
      this.domItemsLayer.appendChild(itemView);
    }

    // 4. Renderiza itens equipados nos slots
    for (const eq of this.inventoryState.equipped) {
      const slotEl = document.getElementById(`slot-${eq.slot}`);
      if (slotEl) {
        const itemView = this.createItemElement(eq.item, 1, 1, null, null, eq.slot);
        slotEl.appendChild(itemView);
        slotEl.classList.add('has-item');
      }
    }

    // Atualiza contador de ocupação
    document.getElementById('inv-capacity-counter').textContent = 
      `Itens: ${this.inventoryState.items.length} / 64 células`;

    // Atualiza inspeção se o item inspecionado ainda existir
    if (this.inspectedItem) {
      this.inspectItem(this.inspectedItem);
    } else if (this.inventoryState.items.length > 0) {
      this.inspectItem(this.inventoryState.items[0].item);
    }

    // Sincroniza visualização 3D do herói com itens equipados
    this.syncPaperdollTo3DHero();
  }

  syncPaperdollTo3DHero() {
    if (!this.inventoryState || !this.inventoryState.equipped) return;

    // Detecta itens equipados
    const armorEquip = this.inventoryState.equipped.find((e) => e.slot === 'ARMOR' || e.slot === 'HELM');
    const weaponEquip = this.inventoryState.equipped.find((e) => e.slot === 'WEAPON_RIGHT' || e.slot === 'WEAPON_LEFT');

    let detectedTier = null;
    let maxRefinement = 0;

    for (const eq of this.inventoryState.equipped) {
      if (eq.item && typeof eq.item.level === 'number' && eq.item.level > maxRefinement) {
        maxRefinement = eq.item.level;
      }
    }

    if (armorEquip && armorEquip.item) {
      detectedTier = this.getTierFromItemDef(armorEquip.item.defId);
    }
    if (!detectedTier && weaponEquip && weaponEquip.item) {
      detectedTier = this.getTierFromItemDef(weaponEquip.item.defId);
    }

    if (detectedTier && this.viewer3DInstance) {
      this.viewer3DInstance.currentSetTier = detectedTier;
      if (this.viewer3DInstance.currentCategory === 'HERO') {
        const heroClass = this.viewer3DInstance.currentSubId || 'DK';
        this.viewer3DInstance.selectEntity('HERO', heroClass, { setTier: detectedTier });
      }
    }

    if (maxRefinement > 0 && this.viewer3DInstance) {
      this.viewer3DInstance.updateRefinementGlow(maxRefinement);
      const rangeRefine = document.getElementById('range-3d-refinement');
      if (rangeRefine) rangeRefine.value = maxRefinement;
      const lblRefine = document.getElementById('lbl-refinement-level');
      if (lblRefine) lblRefine.textContent = `+${maxRefinement} REFINAMENTO`;
    }
  }

  getTierFromItemDef(defId) {
    if (!defId) return null;
    const id = defId.toLowerCase();
    if (id.includes('dark_phoenix') || id.includes('phoenix')) return 'PHOENIX';
    if (id.includes('dragon')) return 'DRAGON';
    if (id.includes('plate') && !id.includes('light')) return 'PLATE';
    if (id.includes('scale')) return 'SCALE';
    if (id.includes('leather')) return 'LEATHER';
    if (id.includes('grand_soul')) return 'GRAND_SOUL';
    if (id.includes('legendary')) return 'LEGENDARY';
    if (id.includes('sphinx')) return 'SPHINX';
    if (id.includes('bone')) return 'BONE';
    if (id.includes('pad')) return 'PAD';
    if (id.includes('divine')) return 'DIVINE';
    if (id.includes('spirit')) return 'SPIRIT';
    if (id.includes('wind')) return 'WIND';
    if (id.includes('silk')) return 'SILK';
    if (id.includes('vine')) return 'VINE';
    if (id.includes('hurricane')) return 'HURRICANE';
    if (id.includes('storm_crow')) return 'STORM_CROW';
    if (id.includes('dark_master')) return 'DARK_MASTER';
    if (id.includes('light_plate')) return 'LIGHT_PLATE';
    return null;
  }

  createItemElement(item, width = 1, height = 1, gridX = null, gridY = null, equipSlot = null) {
    const el = document.createElement('div');
    el.className = 'item-view';
    el.dataset.uuid = item.uuid;
    el.dataset.defId = item.defId;

    const def = this.definitions[item.defId] || { name: item.defId, category: 'ITEM' };
    const isJewel = def.category === 'JEWEL';
    const isExcl = (item.excellentMask || 0) > 0;

    if (isExcl) el.classList.add('is-excellent');

    // Nível de brilho visual (+0 a +15)
    const glowLevel = Math.min(15, Math.max(0, item.level || 0));
    el.classList.add(`glow-level-${glowLevel}`);

    // Posicionamento se estiver na grade
    if (gridX !== null && gridY !== null) {
      const effWidth = (width * CELL_SIZE) + ((width - 1) * CELL_GAP);
      const effHeight = (height * CELL_SIZE) + ((height - 1) * CELL_GAP);
      const posX = gridX * (CELL_SIZE + CELL_GAP);
      const posY = gridY * (CELL_SIZE + CELL_GAP);

      el.style.width = `${effWidth}px`;
      el.style.height = `${effHeight}px`;
      el.style.left = `${posX}px`;
      el.style.top = `${posY}px`;
      el.dataset.gridX = gridX;
      el.dataset.gridY = gridY;
    } else {
      // Slot de equipamento
      el.style.width = '100%';
      el.style.height = '100%';
      el.dataset.equipSlot = equipSlot;
    }

    const icon = getItemIcon(item.defId);
    const lvlStr = item.level > 0 ? `+${item.level}` : '';

    el.innerHTML = `
      <div class="item-badge-top">
        <span class="item-level-text">${lvlStr}</span>
        ${item.luck ? '<span title="Possui Sorte (Luck +25% Critical)">🍀</span>' : ''}
      </div>
      <div class="item-body-icon">${icon}</div>
      <div class="item-badge-bottom">
        <span class="item-name-tag">${def.name}</span>
        ${item.skill ? '<span title="Habilidade Especial">⚡</span>' : ''}
      </div>
    `;

    // Interações de Hover e Inspeção
    el.addEventListener('mouseenter', () => {
      this.inspectItem(item);
    });

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.inspectItem(item);
    });

    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (item.defId.startsWith('box_of_kundun')) {
        this.log(`🎁 [Box of Kundun] Abrindo ${def.name}...`, 'info');
        this.sendPacket(OPCODES.BOX_KUNDUN_OPEN_REQ, {
          boxDefId: item.defId,
          playerX: this.playerX || 400,
          playerY: this.playerY || 250,
        });
      } else if (item.defId.startsWith('fruit_')) {
        this.log(`🍎 [Fruta] Saboreando fruta de atributos: ${def.name}...`, 'info');
        this.sendPacket(OPCODES.FRUIT_CONSUME_REQ, {
          fruitDefId: item.defId,
        });
      }
    });

    // Configuração de Drag & Drop
    this.setupItemDraggable(el, item, gridX, gridY, equipSlot);

    return el;
  }

  // ==========================================================================
  // DRAG & DROP MODERNO (ITENS E JOIAS)
  // ==========================================================================
  setupItemDraggable(el, item, gridX, gridY, equipSlot) {
    el.setAttribute('draggable', 'true');

    el.addEventListener('dragstart', (e) => {
      this.draggedItem = item;
      this.draggedSource = {
        uuid: item.uuid,
        defId: item.defId,
        type: gridX !== null ? LOCATION_TYPE.GRID : LOCATION_TYPE.EQUIPMENT,
        x: gridX,
        y: gridY,
        slot: equipSlot,
      };

      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.uuid);
    });

    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      this.clearGridHighlights();
      this.draggedItem = null;
      this.draggedSource = null;
    });

    // Se soltar algo sobre este item (ex: uma Joia sendo solta sobre uma arma!)
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!this.draggedItem || this.draggedItem.uuid === item.uuid) return;

      const draggedDef = this.definitions[this.draggedItem.defId];
      if (draggedDef && draggedDef.category === 'JEWEL') {
        e.stopPropagation();
        el.style.outline = '2px solid #ffd700';
        el.style.filter = 'brightness(1.5)';
      }
    });

    el.addEventListener('dragleave', () => {
      el.style.outline = '';
      el.style.filter = '';
    });

    el.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.style.outline = '';
      el.style.filter = '';

      if (!this.draggedItem || this.draggedItem.uuid === item.uuid) return;

      const draggedDef = this.definitions[this.draggedItem.defId];
      if (draggedDef && draggedDef.category === 'JEWEL') {
        // APLICAÇÃO DE JOIA!
        this.log(`Aplicando ${draggedDef.name} sobre ${this.definitions[item.defId]?.name || 'Item'}...`, 'info');
        this.sendPacket(OPCODES.ITEM_USE_JEWEL_REQ, {
          jewelUuid: this.draggedItem.uuid,
          targetUuid: item.uuid,
          targetLocation: equipSlot ? LOCATION_TYPE.EQUIPMENT : LOCATION_TYPE.GRID,
          targetSlot: equipSlot || undefined,
        });
      }
    });
  }

  bindEvents() {
    // 1. Dragover e Drop na Grade 8x8
    this.domGrid.addEventListener('dragover', (e) => {
      e.preventDefault();
      const rect = this.domGrid.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      const cellX = Math.floor(rawX / (CELL_SIZE + CELL_GAP));
      const cellY = Math.floor(rawY / (CELL_SIZE + CELL_GAP));

      if (cellX >= 0 && cellX < 8 && cellY >= 0 && cellY < 8) {
        this.highlightGridTarget(cellX, cellY);
      }
    });

    this.domGrid.addEventListener('dragleave', () => {
      this.clearGridHighlights();
    });

    this.domGrid.addEventListener('drop', (e) => {
      e.preventDefault();
      this.clearGridHighlights();
      if (!this.draggedItem || !this.draggedSource) return;

      const rect = this.domGrid.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const cellX = Math.floor(rawX / (CELL_SIZE + CELL_GAP));
      const cellY = Math.floor(rawY / (CELL_SIZE + CELL_GAP));

      if (cellX < 0 || cellX >= 8 || cellY < 0 || cellY >= 8) return;

      // Envia requisição de movimento
      this.sendPacket(OPCODES.ITEM_MOVE_REQ, {
        itemUuid: this.draggedItem.uuid,
        sourceType: this.draggedSource.type,
        sourceSlot: this.draggedSource.slot,
        sourceX: this.draggedSource.x,
        sourceY: this.draggedSource.y,
        targetType: LOCATION_TYPE.GRID,
        targetX: cellX,
        targetY: cellY,
        rotated: !!this.draggedItem.rotated,
      });
    });

    // 2. Dragover e Drop nos Slots de Equipamento do Paperdoll
    const equipSlots = document.querySelectorAll('.equip-slot');
    equipSlots.forEach((slotEl) => {
      const slotName = slotEl.dataset.slot;

      slotEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        slotEl.classList.add('drag-over-valid');
      });

      slotEl.addEventListener('dragleave', () => {
        slotEl.classList.remove('drag-over-valid');
      });

      slotEl.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        slotEl.classList.remove('drag-over-valid');

        if (!this.draggedItem || !this.draggedSource) return;

        const draggedDef = this.definitions[this.draggedItem.defId];
        // Se for joia e já existir um item equipado no slot: aplica a joia!
        const existingInSlot = this.inventoryState.equipped.find((eq) => eq.slot === slotName);
        if (draggedDef && draggedDef.category === 'JEWEL' && existingInSlot) {
          this.log(`Aplicando ${draggedDef.name} em item equipado [${slotName}]...`, 'info');
          this.sendPacket(OPCODES.ITEM_USE_JEWEL_REQ, {
            jewelUuid: this.draggedItem.uuid,
            targetUuid: existingInSlot.item.uuid,
            targetLocation: LOCATION_TYPE.EQUIPMENT,
            targetSlot: slotName,
          });
          return;
        }

        // Tenta equipar o item no slot
        this.sendPacket(OPCODES.ITEM_MOVE_REQ, {
          itemUuid: this.draggedItem.uuid,
          sourceType: this.draggedSource.type,
          sourceSlot: this.draggedSource.slot,
          sourceX: this.draggedSource.x,
          sourceY: this.draggedSource.y,
          targetType: LOCATION_TYPE.EQUIPMENT,
          targetSlot: slotName,
        });
      });
    });

    // 3. Toolbar Dev Spawners
    document.getElementById('btn-spawn-bless')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { itemDefId: 'jewel_of_blessing', count: 1 });
    });
    document.getElementById('btn-spawn-soul')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { itemDefId: 'jewel_of_soul', count: 1 });
    });
    document.getElementById('btn-spawn-life')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { itemDefId: 'jewel_of_life', count: 1 });
    });
    document.getElementById('btn-spawn-chaos')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { itemDefId: 'jewel_of_chaos', count: 1 });
    });
    document.getElementById('btn-spawn-harmony')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { itemDefId: 'jewel_of_harmony', count: 1 });
    });
    document.getElementById('btn-spawn-blade')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, {
        itemDefId: 'dragon_blade',
        level: 0,
        luck: true,
        skill: true,
        excellentMask: 8,
      });
    });
    document.getElementById('btn-spawn-wings')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { itemDefId: 'wings_of_dragon', level: 0, luck: true });
    });

    document.getElementById('btn-spawn-creation')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { itemDefId: 'jewel_of_creation', count: 1 });
    });

    document.getElementById('btn-spawn-feather')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { itemDefId: 'lochs_feather', count: 1 });
    });

    document.getElementById('btn-spawn-wings3')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { itemDefId: 'wings_of_storm', level: 0, luck: true });
    });

    document.getElementById('btn-spawn-box-1')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { itemDefId: 'box_of_kundun_1', count: 1 });
    });

    document.getElementById('btn-spawn-box-5')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { itemDefId: 'box_of_kundun_5', count: 1 });
    });

    document.getElementById('btn-spawn-fruit')?.addEventListener('click', () => {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { itemDefId: 'fruit_strength', count: 1 });
    });

    // 4. Reconectar
    document.getElementById('btn-reconnect')?.addEventListener('click', () => {
      this.connect();
    });

    // 5. Limpar Console
    document.getElementById('btn-clear-log')?.addEventListener('click', () => {
      this.domLogs.innerHTML = '';
    });

    // 6. Refinement Level Slider Override
    this.domSlider?.addEventListener('input', (e) => {
      const lvl = parseInt(e.target.value, 10);
      this.previewOverrideLevel = lvl;
      this.domSliderVal.textContent = `+${lvl}`;
      this.updateGlowBadge(lvl);
    });

    // 7. Clique no Canvas da Arena (Combate, Coleta ou Movimento)
    if (this.combatCanvas) {
      this.combatCanvas.addEventListener('click', (e) => {
        const rect = this.combatCanvas.getBoundingClientRect();
        const scaleX = this.combatCanvas.width / rect.width;
        const scaleY = this.combatCanvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        // Prioridade 1: Coleta de item no chão
        for (const drop of this.groundDrops.values()) {
          const dist = Math.hypot(drop.x - clickX, drop.y - clickY);
          if (dist <= 30) {
            this.sendPacket(OPCODES.GROUND_ITEM_PICKUP_REQ, {
              dropId: drop.dropId,
              playerX: this.playerX,
              playerY: this.playerY,
            });
            this.playerTargetX = drop.x;
            this.playerTargetY = drop.y;
            return;
          }
        }

        // Prioridade 2: Ataque ao clicar em monstro
        for (const mob of this.monsters.values()) {
          if (mob.isDead) continue;
          const mx = mob.displayX || mob.x;
          const my = mob.displayY || mob.y;
          const dist = Math.hypot(mx - clickX, my - clickY);
          if (dist <= 34) {
            this.selectedTargetId = mob.id;
            this.updateTargetHud(mob);
            this.sendPacket(OPCODES.COMBAT_ATTACK_REQ, {
              targetMobId: mob.id,
              playerX: this.playerX,
              playerY: this.playerY,
            });
            return;
          }
        }

        // Prioridade 3: Movimento do jogador no chão
        this.playerTargetX = Math.round(clickX);
        this.playerTargetY = Math.round(clickY);
      });
    }

    // 8. Botões de Ação de Combate
    // 8. Controles do Motor 100% Idle & Gestão de Personagem
    if (this.domBtnToggleIdle) {
      this.domBtnToggleIdle.addEventListener('click', () => {
        const nextState = !this.idleEngine.isEnabled();
        this.idleEngine.setEnabled(nextState);
        this.domBtnToggleIdle.textContent = nextState ? '⏸️ Pausar Caça' : '▶️ Retomar Caça';
        if (this.domIdleBadge) {
          this.domIdleBadge.classList.toggle('paused', !nextState);
        }
        if (this.domIdleText) {
          this.domIdleText.textContent = nextState ? '⚡ AUTO-HUNT ATIVO (100% IDLE)' : '⏸️ AUTO-HUNT PAUSADO';
        }
        this.log(nextState ? '⚡ [AUTO-HUNT] Modo 100% Idle retomado! O herói prossegue o combate autônomo.' : '⏸️ [AUTO-HUNT] Modo Idle pausado para inspeção.', nextState ? 'success' : 'warning');
      });
    }

    // Botão de Level Up (+5 Pontos de Atributos)
    const btnLvlUp = document.getElementById('btn-arena-levelup');
    if (btnLvlUp) {
      btnLvlUp.addEventListener('click', () => this.simulateLevelUp());
    }

    // Botão de Forja do Caos (Chaos Machine)
    const btnChaosForge = document.getElementById('btn-arena-chaosforge');
    if (btnChaosForge) {
      btnChaosForge.addEventListener('click', () => this.triggerChaosForge());
    }

    // Botões de Teletransporte de Mapa (faixa de reinos da Arena de Combate)
    const teleportTargets = {
      lorencia: 'LORENCIA',
      noria: 'NORIA',
      devias: 'DEVIAS',
      dungeon: 'DUNGEON',
      lost_tower: 'LOST_TOWER',
      atlans: 'ATLANS',
      tarkan: 'TARKAN',
      icarus: 'ICARUS',
    };
    Object.entries(teleportTargets).forEach(([mKey, mapId]) => {
      const btn = document.getElementById(`btn-teleport-${mKey}`);
      if (btn) {
        btn.addEventListener('click', () => this.teleportMap(mapId));
      }
    });

    // Distribuição de Atributos (+1 / Shift: +5)
    document.querySelectorAll('.btn-stat-add').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const stat = btn.getAttribute('data-stat');
        const points = e.shiftKey ? 5 : 1;
        this.sendPacket(OPCODES.STAT_POINT_ALLOC_REQ, { stat, points });
      });
    });

    // Fechamento de Modais
    document.querySelectorAll('.btn-close-modal').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
      });
    });

    // Modal de Caça AFK Offline
    const btnOpenAfk = document.getElementById('btn-open-afk-modal');
    const modalAfk = document.getElementById('modal-afk-rewards');
    if (btnOpenAfk && modalAfk) {
      btnOpenAfk.addEventListener('click', () => {
        this.updateAfkModalSimulation(1);
        modalAfk.style.display = 'flex';
      });

      document.querySelectorAll('.btn-duration').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.btn-duration').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const hours = parseFloat(btn.getAttribute('data-hours') || '1');
          this.updateAfkModalSimulation(hours);
        });
      });

      const btnClaimAfk = document.getElementById('btn-claim-afk-rewards');
      if (btnClaimAfk) {
        btnClaimAfk.addEventListener('click', () => {
          this.claimAfkOfflineRewards();
          modalAfk.style.display = 'none';
        });
      }
    }

    // Modal da Chaos Machine
    const btnOpenChaos = document.getElementById('btn-open-chaos-modal');
    const modalChaos = document.getElementById('modal-chaos-machine');
    if (btnOpenChaos && modalChaos) {
      btnOpenChaos.addEventListener('click', () => {
        this.updateChaosRecipeTab('CHAOS_WEAPON');
        modalChaos.style.display = 'flex';
      });

      document.querySelectorAll('.btn-recipe-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.btn-recipe-tab').forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');
          this.updateChaosRecipeTab(tab.getAttribute('data-recipe'));
        });
      });

      const btnExecChaos = document.getElementById('btn-chaos-mix-execute');
      if (btnExecChaos) {
        btnExecChaos.addEventListener('click', () => {
          this.executeChaosMachineMix();
        });
      }
    }

    // Modal da Loja de NPCs
    const btnOpenShop = document.getElementById('btn-open-shop-modal');
    const modalShop = document.getElementById('modal-npc-shop');
    if (btnOpenShop && modalShop) {
      btnOpenShop.addEventListener('click', () => {
        this.shopMode = 'buy';
        document.getElementById('btn-shop-mode-buy')?.classList.add('active');
        document.getElementById('btn-shop-mode-sell')?.classList.remove('active');
        this.renderNpcShopCatalog('han_blacksmith');
        modalShop.style.display = 'flex';
      });

      document.querySelectorAll('.btn-shop-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.btn-shop-tab').forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');
          if (this.shopMode === 'sell') {
            this.renderNpcShopSellCatalog();
          } else {
            this.renderNpcShopCatalog(tab.getAttribute('data-shop'));
          }
        });
      });

      document.getElementById('btn-shop-mode-buy')?.addEventListener('click', () => {
        document.getElementById('btn-shop-mode-buy')?.classList.add('active');
        document.getElementById('btn-shop-mode-sell')?.classList.remove('active');
        this.shopMode = 'buy';
        this.renderNpcShopCatalog(this.activeShopId || 'han_blacksmith');
      });

      document.getElementById('btn-shop-mode-sell')?.addEventListener('click', () => {
        document.getElementById('btn-shop-mode-sell')?.classList.add('active');
        document.getElementById('btn-shop-mode-buy')?.classList.remove('active');
        this.shopMode = 'sell';
        this.renderNpcShopSellCatalog();
      });
    }

    // Modal da Orquestração Mestre do Servidor
    const btnOpenOrch = document.getElementById('btn-open-server-orchestration-modal');
    const modalOrch = document.getElementById('modal-server-orchestration');
    if (btnOpenOrch && modalOrch) {
      btnOpenOrch.addEventListener('click', () => {
        modalOrch.style.display = 'flex';
      });

      document.getElementById('btn-orch-reset')?.addEventListener('click', () => {
        this.sendReset();
      });

      document.getElementById('btn-orch-mreset')?.addEventListener('click', () => {
        this.sendMasterReset();
      });

      document.getElementById('btn-orch-quest-info')?.addEventListener('click', () => {
        this.sendQuestInfo();
      });

      document.getElementById('btn-orch-quest-sebina')?.addEventListener('click', () => {
        this.sendQuestAction('sebina', 'COMPLETE');
      });

      document.getElementById('btn-orch-quest-marlon')?.addEventListener('click', () => {
        this.sendQuestAction('marlon', 'COMPLETE');
      });

      document.getElementById('btn-orch-quest-devin')?.addEventListener('click', () => {
        this.sendQuestAction('devin', 'COMPLETE');
      });

      document.getElementById('btn-orch-gens-duprian')?.addEventListener('click', () => {
        this.sendGensJoin('DUPRIAN');
      });

      document.getElementById('btn-orch-gens-vanert')?.addEventListener('click', () => {
        this.sendGensJoin('VANERT');
      });

      document.getElementById('btn-orch-gens-status')?.addEventListener('click', () => {
        this.sendGensStatus();
      });

      document.getElementById('btn-orch-party-leave')?.addEventListener('click', () => {
        this.sendPartyLeave();
      });

      document.getElementById('btn-orch-pshop-open')?.addEventListener('click', () => {
        this.sendPShopOpen('Loja Rara do Herói', []);
      });

      document.getElementById('btn-orch-pshop-close')?.addEventListener('click', () => {
        this.sendPShopClose();
      });

      document.getElementById('btn-orch-trade-cancel')?.addEventListener('click', () => {
        this.sendTradeCancel();
      });

      document.getElementById('btn-orch-kalima-spawn')?.addEventListener('click', () => {
        const x = Math.round(this.playerX || 143);
        const y = Math.round(this.playerY || 128);
        this.sendKalimaSpawn('lost_map_7', x, y);
      });

      document.getElementById('btn-orch-kalima-enter')?.addEventListener('click', () => {
        if (this.lastKalimaPortalId) {
          this.sendKalimaEnter(this.lastKalimaPortalId);
        } else {
          this.log('⚠️ Nenhum portal de Kalima ativo registrado localmente. Abra um portal com Lost Map primeiro!', 'warning');
        }
      });

      document.getElementById('btn-orch-harmony-smelt')?.addEventListener('click', () => {
        const firstItem = this.inventoryState && this.inventoryState.items && this.inventoryState.items[0];
        if (firstItem) {
          this.sendHarmonySmelt(firstItem.uuid || firstItem.id);
        } else {
          this.log('⚠️ Nenhum item encontrado no inventário para refino com Jewel of Harmony!', 'warning');
        }
      });

      document.getElementById('btn-orch-harmony-restore')?.addEventListener('click', () => {
        const firstItem = this.inventoryState && this.inventoryState.items && this.inventoryState.items[0];
        if (firstItem) {
          this.sendHarmonyRestore(firstItem.uuid || firstItem.id);
        } else {
          this.log('⚠️ Nenhum item selecionado para remoção de propriedades de Harmony!', 'warning');
        }
      });
    }

    // Modal de Galeria de Concept Art Oficial
    const btnOpenArt = document.getElementById('btn-open-art-modal');
    const modalArt = document.getElementById('modal-concept-art');
    const conceptImg = document.getElementById('concept-art-img');
    const conceptTitle = document.getElementById('concept-art-title');
    const conceptDesc = document.getElementById('concept-art-desc');

    const artData = {
      LORENCIA: {
        title: 'Lorencia Citadel — Praça Central & Fonte do Arcanjo',
        desc: 'Melancolia medieval gótica sob chuva fria contínua. Fonte octogonal de pedra com a estátua em bronze do Arcanjo de Loren empunhando sua espada celestial sob um halo dourado flutuante, ladeada pelo Bazar com tendas coloridas, a Taverna da Lareira Dourada e a muralha fortificada.',
        src: 'art/lorencia_concept_art.jpg',
        color: '#fbbf24',
        border: '#d97706',
        features: [
          'Calçamento Gótico: Textura PBR com juntas de argamassa e poças reflexivas.',
          'Fonte do Arcanjo: Bacia octogonal com bronze sagrado e halo dourado.',
          'Muralha & Torres: Ameias com portão de carvalho e grade de ferro.',
          'Iluminação 2200K: 8 tochas com chamas vivas e flicker dinâmico.'
        ]
      },
      NORIA: {
        title: 'Noria Feywood — Santuário Arbóreo & Máquina do Caos',
        desc: 'Santuário milenar élfico no coração de Feywood com sequóias de 40 metros. Oficina da Máquina do Caos com 3 anéis giroscópicos concêntricos de latão, 4 pistões a vapor e núcleo de plasma magenta pulsante. Altar de alabastro da Rainha Lúthien, bacia das Águas da Vida, cogumelos neon e esporos brilhantes.',
        src: 'art/noria_concept_art.jpg',
        color: '#6ee7b7',
        border: '#10b981',
        features: [
          'Árvore Ancestral: Sequoia oca de 40m com passadiços e raízes retorcidas.',
          'Oficina do Caos: Núcleo de plasma magenta, anéis de latão e 4 pistões a vapor.',
          'Altar de Lúthien: Alabastro lunar e fonte das Águas da Vida.',
          'Bioluminescência: Cogumelos neon e nuvem de esporos flutuantes.'
        ]
      },
      DEVIAS: {
        title: 'Devias Boreal — Fortaleza Glacial & O Grande Braseiro Rei',
        desc: 'Fortaleza ártica sob nevasca severa. O Grande Braseiro Rei de 12 metros com fogo sagrado rugindo e anel de degelo térmico com pedra molhada reflexiva. Ao fundo, a Catedral Glacial com arcobotantes de gelo e a Rosácea de Gelo safira, emoldurada por 8 pináculos de cristal translúcido.',
        src: 'art/devias_concept_art.jpg',
        color: '#7dd3fc',
        border: '#38bdf8',
        features: [
          'Catedral Glacial: Abóbada ogival com arcobotantes e Rosácea Safira.',
          'Braseiro do Rei: 12m de altura com anel de degelo térmico em pedra molhada.',
          'Pináculos de Gelo: 8 estalactites ciclópicas com reflexão especular.',
          'Nevasca Ártica: Partículas volumétricas de neve rodopiante a -30°C.'
        ]
      },
      ATLANS: {
        title: 'Atlans Thalassa — Santuário de Nácar & Cemitério dos Leviatãs',
        desc: 'Ruínas do reino oceânico submerso nas profundezas abissais. Solo de areia perolada banhado por reflexos solares cáusticos ondulantes, Santuário de Nácar com domo de ar hidrostático, costelas fósseis colossais de Leviatã ancestral, 4 anéis de aceleração Slipstream e recifes bioluminescentes.',
        src: 'art/atlans_concept_art.jpg',
        color: '#67e8f9',
        border: '#06b6d4',
        features: [
          'Santuário de Nácar: Cúpula com domo de ar hidrostático e colunas gregas.',
          'Cáusticas Submarinas: Reflexos solares ondulantes projetados no solo perolado.',
          'Fóssil do Leviatã: Arcadas ósseas colossais repousando na areia abissal.',
          'Fendas Hidrotermais: Chaminés de basalto emitindo colunas de bolhas e gás.'
        ]
      },
      DUNGEON: {
        title: 'Dungeon Catacombs — Catacumbas do Abismo Esquecido',
        desc: 'Subterrâneo claustrofóbico e opressivo em cantaria romana deteriorada. Paredes forradas com nichos fúnebres repletos de milhares de crânios humanos e ossários seculares. Gaiolas de ferro enferrujado pendem de abóbadas de pedra escura por correntes ciclópicas. Tochas de fogo verde sulfúrico refletindo em poças fétidas de sangue estagnado e lodo venenoso.',
        src: 'art/dungeon_concept_art.jpg',
        color: '#34d399',
        border: '#10b981',
        features: [
          'Ossuário Ciclópico: Paredes com nichos de milhares de crânios e ossadas.',
          'Gaiolas Suspensas: Grilhões e jaulas de ferro balançando sob correntes.',
          'Tochas Sulfúricas: Iluminação verde-esmeralda com sombras profundas.',
          'Poças Tóxicas: Água estagnada e lodo ácido com reflexão especular.'
        ]
      },
      LOST_TOWER: {
        title: 'Lost Tower Inferno — A Torre de Obsidiana & Magma',
        desc: 'Monumental torre gótica vertical esculpida em basalto negro e placas polidas de obsidiana. Grelhas de ferro vazadas no piso revelam cascatas de magma incandescente a 1400°C que iluminam pilares cobertos de inscrições demoníacas em ouro fundido. Tochas com fogo sulfúrico azul-turquesa contrastam com as chamas rubras sob tempestade de cinzas.',
        src: 'art/lost_tower_concept_art.jpg',
        color: '#f87171',
        border: '#ef4444',
        features: [
          'Grelhas de Magma: Solo vazado com lava fluida emissiva HDR e convecção térmica.',
          'Basalto & Obsidiana: Paredes de rocha vulcânica com runas demoníacas em ouro.',
          'Tochas Sulfúricas Azuis: Chamas ciano de enxofre em suportes de bronze draconiano.',
          'Trono de Balrog: Pináculo com foice de chamas eternas sobre o abismo.'
        ]
      },
      TARKAN: {
        title: 'Tarkan Desert — O Deserto de Cinzas de Kar-Dune',
        desc: 'Vasta imensidão desértica de areias ocre-avermelhadas escaldantes sob sol ofuscante de 5800K. Imponentes costelas fossilizadas de vermes e leviatãs do deserto erguem-se 15 metros sobre as dunas. Engrenagens colossais enferrujadas e eixos de antigas máquinas de guerra emergem da areia impulsionada por ventos implacáveis.',
        src: 'art/tarkan_concept_art.jpg',
        color: '#fbbf24',
        border: '#d97706',
        features: [
          'Costelas Fossilizadas: 6 arcadas ósseas ciclópicas formando uma nave natural.',
          'Engrenagens de Autômato: Rodas dentadas de ferro fundido semienterradas na areia.',
          'Oásis Fervilhante: Lagoa sulfúrica borbulhante com cactos de metal negro.',
          'Tempestade de Areia: 600 partículas douradas de poeira e miragem térmica.'
        ]
      },
      ICARUS: {
        title: 'Icarus Aethel — Arquipélago Celeste & Ninho do Dark Phoenix',
        desc: 'Cadeia de ilhas flutuantes no vácuo estelar sobre mar de nuvens douradas no crepúsculo eterno (Eternal Golden Hour). Platô central sustentado pelo Monólito de Aetherita gravitacional, passarelas fotônicas de luz pura e o ninho em flor de lótus de obsidiana do Dark Phoenix sob nebulosa cósmica.',
        src: 'art/icarus_concept_art.jpg',
        color: '#e9d5ff',
        border: '#c084fc',
        features: [
          'Ilhas Levitantes: Cones rochosos invertidos suspensos sobre mar de nuvens.',
          'Monólitos de Aetherita: Cristais celestes flutuantes com núcleo antigravidade.',
          'Passarelas Fotônicas: Pontes prismáticas translúcidas com refração de luz.',
          'Ninho do Dark Phoenix: Trono de obsidiana e lótus sob o vácuo estrelado.'
        ]
      },
      VALLEY_OF_LOREN: {
        title: 'Valley of Loren — Fortaleza do Castle Siege',
        desc: 'Monumental fortaleza medieval-gótica erguida nas gargantas do Vale de Loren sob céu tempestuoso de crepúsculo violeta. Muralhas ciclópicas de granito com ameias guarnecidas por arqueiros e balistas. Catapultas no campo de batalha arremessam barris de pez inflamável contra o portão monumental de ferro. Ponte levadiça sobre fosso de lava fervente.',
        src: 'art/valley_of_loren_concept_art.jpg',
        color: '#f87171',
        border: '#b91c1c',
        features: [
          'Muralhas Ciclópicas: Baluartes com portão monumental de ferro de 25M HP.',
          'Estátuas da Vida: 4 arcanjos de alabastro com auras curativas e invulnerabilidade.',
          'Ponte Levadiça: Passarela de aço sobre abismo com fosso de lava ardente.',
          'Trono Imperial: Estrado com Selo da Coroa que requer 30s de canalização.'
        ]
      },
      BLOOD_CASTLE: {
        title: 'Blood Castle — A Ponte do Martírio Celestial',
        desc: 'Infinita ponte gótica suspensa sobre vácuo cósmico avermelhado onde nebulosas e estrelas cadentes iluminam a penumbra com raios divinos (God Rays). Passagem estreita de pedra ladeada por estátuas colossais de arcanjos com asas fraturadas e espadas voltadas ao solo. Hordas demoníacas avançando contra o Portão do Arcanjo ferido.',
        src: 'art/blood_castle_concept_art.jpg',
        color: '#f43f5e',
        border: '#be123c',
        features: [
          'Ponte Suspensa: Passarela de 120m no vácuo celestial com estátuas de arcanjos.',
          'Portão do Arcanjo: Barreira colossal com campo de relâmpagos carmesins.',
          'Rush de 15 Minutos: Corrida contra o relógio para quebrar hordas e recuperar a arma.',
          'Altar do Arcanjo Caído: Santuário final com concessão da bênção triunfal.'
        ]
      },
      HERO_DK: {
        title: 'Dark Knight (Blade Knight / Cavaleiro do Sangue)',
        desc: 'Guerreiro de combate brutal corpo a corpo revestido na armadura Dragon Set escarlate com espinhos nas ombreiras e alto-relevo draconiano. Empunha a colossal Dragon Blade runada de fogo sagrado e desdobra as imponentes Wings of Dragon.',
        src: 'art/dark_knight_concept_art.jpg',
        color: '#ef4444',
        border: '#b91c1c',
        features: [
          'Dragon Set PBR: Placas carmesins com alto-relevo draconiano e ombreiras duplas espinhadas.',
          'Dragon Blade: Lâmina pesada de 1.8m com runas flamejantes e gema rubi pulsante.',
          'Wings of Dragon: Asas dracônicas com membranas coriáceas e chamas místicas.',
          'Modelo 3D Real GLB: 266 KB otimizado via Blender 5.2 LTS com mapas PBR de metal e escamas.'
        ]
      },
      HERO_DW: {
        title: 'Dark Wizard (Soul Master / Arquimago do Caos)',
        desc: 'Feiticeiro místico e mestre da canalização arcana levitando no Grand Soul Set safira e violeta com filigranas de ouro. Empunha o lendário Cajado de Kundun com orbe giratória de mana e desdobra as Wings of Soul estelares.',
        src: 'art/dark_wizard_concept_art.jpg',
        color: '#38bdf8',
        border: '#0284c7',
        features: [
          'Grand Soul Set PBR: Túnica e placas safiras reluzentes com forro de veludo arcano.',
          'Cajado de Kundun: Haste espiral dourada coroada por anéis giroscópicos e orbe giratória.',
          'Wings of Soul: Asas celestes luminescentes com partículas astrais azuis.',
          'Modelo 3D Real GLB: 519 KB gerado no Blender 5.2 LTS com shader emissivo arcano.'
        ]
      },
      HERO_ELF: {
        title: 'Fairy Elf (Muse Elf / Vigia da Floresta)',
        desc: 'Nobre arqueira da floresta de Noria em armadura Spirit Set esmeralda e dourada com diadema de louros. Empunha o Celestial Bow com flechas de fótons e sustenta as etéreas Wings of Spirits com transludicência feérica.',
        src: 'art/fairy_elf_concept_art.jpg',
        color: '#34d399',
        border: '#059669',
        features: [
          'Spirit Set PBR: Malha esmeralda leve com protetores e filigranas orgânicas da árvore.',
          'Celestial Bow: Arco recurvo de madeira viva pulsante e corda de luz celestial.',
          'Wings of Spirits: Asas de fada com gradiente translúcido e poeira feérica.',
          'Modelo 3D Real GLB: 365 KB com alinhamento esbelto e materiais PBR de folhagem/ouro.'
        ]
      },
      HERO_MG: {
        title: 'Magic Gladiator (Duel Master / Gladiador Rúnico)',
        desc: 'Híbrido lendário combinando esgrima pesada e feitiçaria destrutiva. Revestido no Hurricane Set de obsidiana com circuitos rúnicos cianos, Wings of Darkness com bordas de lâminas afiadas, empunhando a Fire Blade flamejante e a Thunder Blade relampejante.',
        src: 'art/magic_gladiator_concept_art.jpg',
        color: '#06b6d4',
        border: '#0891b2',
        features: [
          'Hurricane Set PBR: Armadura de obsidiana com circuitos rúnicos cianos e peitoral aberto.',
          'Dual Blades: Espada do Fogo Carmesim (Mão Direita) e Espada do Trovão Ciano (Mão Esquerda).',
          'Wings of Darkness: Asas mecânico-arcanas com bordas de navalha e penas de aço.',
          'Modelo 3D Real GLB: 228 KB com suporte a dual-wielding e emissão rúnica sincronizada.'
        ]
      },
      HERO_DL: {
        title: 'Dark Lord (Lord Emperor / Soberano Imperial)',
        desc: 'Imperador supremo das terras de Lorencia. Traja o opulento Dark Master Set de aço negro e ouro 24k com capa escarlate imperial. Empunha o Cetro Real Imperial com cabeça solar e comanda o corvo espectral Dark Raven.',
        src: 'art/dark_lord_concept_art.jpg',
        color: '#fbbf24',
        border: '#d97706',
        features: [
          'Dark Master Set PBR: Armadura de aço negro temperado com adornos em ouro puro 24k.',
          'Cetro Real & Dark Raven: Cetro solar imperial e Corvo Espectral pousado no ombro.',
          'Capa Imperial de Veludo: Manto escarlate damascado com forro dourado.',
          'Modelo 3D Real GLB: 326 KB com hierarquia completa de cetro, coroa e mascote Dark Raven.'
        ]
      }
    };

    Object.assign(artData, {
      DEVIL_SQUARE: {
        title: 'Devil Square — Praça das Sombras', color: '#fca5a5', border: '#991b1b',
        features: ['Arena circular: Piso de pedra com espaço aberto para combate.', 'Pentagrama: Inscrição infernal sob luz de brasas.', 'Totens: Quatro marcos de pedra com fogo.'],
      },
      CHAOS_CASTLE: {
        title: 'Chaos Castle — Coliseu sobre o Abismo', color: '#d8b4fe', border: '#7e22ce',
        features: ['Lajes: Plataforma modular suspensa sobre o vazio.', 'Abismo: Névoa e luz violeta discreta.', 'Perímetro: Ruínas e bordas ameaçadoras.'],
      },
      DUEL_COLISEUM: {
        title: 'Coliseu de Duelos — Arena da Glória', color: '#fde68a', border: '#a16207',
        features: ['Arena octogonal: Área aberta para duelos.', 'Arquibancadas: Pedra escura e formas monumentais.', 'Iluminação: Tochas e detalhes em bronze envelhecido.'],
      },
    });

    // Artes de referência por família; os conceitos não são plantas exatas dos mapas.
    for (const [key, concept] of Object.entries(CLASSIC_CONCEPTS)) {
      artData[key].src = concept.file ? models/scenarios/.glb : `;
      artData[key].desc = `Referência visual do bioma: ${concept.description}`;
    }
    const pendingConcept = {
      title: 'Concept específico em preparação',
      desc: 'Não há referência visual disponível para esta seleção.',
      src: '', color: '#cbd5e1', border: '#64748b', features: [],
    };

    // Os novos concepts são referências iniciais, não uma garantia de que os GLBs existentes correspondem.
    for (const id of Object.keys(CHARACTER_CONCEPTS)) {
      const concept = getCharacterConcept(id);
      Object.assign(artData[`HERO_${id}`], {
        src: concept.src,
        title: `${id} — ${concept.title}`,
        desc: `Concept inicial: ${concept.description} O modelo 3D existente ainda precisa de revisão.`,
        features: [],
      });
    }

    artData.DK = artData.HERO_DK;
    artData.DW = artData.HERO_DW;
    artData.ELF = artData.HERO_ELF;
    artData.MG = artData.HERO_MG;
    artData.DL = artData.HERO_DL;

    const resolveArtDisplay = (id) => {
      const family = conceptKeyForScenario(id);
      const base = artData[family] || pendingConcept;
      const specific = getScenarioConcept(id);
      if (specific) return { ...base, ...specific, title: `${id} — ${specific.title}`, desc: `Concept individual: ${specific.description}`, features: [] };
      if (/^(LOR|NOR|DEV|DNG|LT|ATL|TAR|ICA|VOL|EVT)_\d+$/.test(id || '')) {
        return { ...base, title: `${id} — ${base.title}`, desc: `Referência de família (concept individual pendente). ${base.desc}`, features: [] };
      }
      return base;
    };

    const updateArtDisplay = (biome) => {
      const canonicalBiome = conceptKeyForScenario(biome);
      const data = resolveArtDisplay(biome);
      if (conceptImg) { const isImg = data.src && !data.src.endsWith('.glb'); conceptImg.style.display = isImg ? 'block' : 'none'; if (isImg) conceptImg.src = data.src; }
      if (conceptTitle) {
        conceptTitle.textContent = data.title;
        conceptTitle.style.color = data.color;
      }
      if (conceptDesc) conceptDesc.textContent = data.desc;

      document.querySelectorAll('.btn-art-tab').forEach((tab) => {
        const isSelected = tab.getAttribute('data-biome') === canonicalBiome;
        tab.classList.toggle('active', isSelected);
        tab.style.borderColor = isSelected ? data.border : 'rgba(255,255,255,0.15)';
        tab.style.background = isSelected ? `${data.border}40` : 'rgba(255,255,255,0.05)';
        tab.style.color = isSelected ? data.color : '#cbd5e1';
      });
    };

    // Painel Comparativo Lado a Lado: Concept Art vs Modelo 3D Real
    const btnToggleSplit = document.getElementById('btn-toggle-art-split');
    const panelSplit = document.getElementById('concept-art-split-panel');
    const btnCloseSplit = document.getElementById('btn-close-art-split');
    const splitImg = document.getElementById('split-concept-art-img');
    const splitTitle = document.getElementById('split-concept-art-title');
    const splitDesc = document.getElementById('split-concept-art-desc');
    const splitFeatures = document.getElementById('split-concept-art-features');
    const blockoutLink = document.getElementById('scenario-blockout-download');
    const viewerBody = document.querySelector('.viewer-3d-body');

    this.updateSplitArtDisplay = (biome) => {
      const data = resolveArtDisplay(biome);
      const blockoutPath = getScenarioBlockout(biome);
      if (blockoutLink) {
        blockoutLink.style.display = blockoutPath ? 'block' : 'none';
        if (blockoutPath) blockoutLink.href = blockoutPath;
      }
      if (splitImg) { const isImg = data.src && !data.src.endsWith('.glb'); splitImg.style.display = isImg ? 'block' : 'none'; if (isImg) splitImg.src = data.src; }
      if (splitTitle) {
        splitTitle.textContent = data.title;
        splitTitle.style.color = data.color;
      }
      if (splitDesc) splitDesc.textContent = data.desc;
      if (splitFeatures && data.features) {
        if (splitFeatures.parentElement) splitFeatures.parentElement.style.display = data.features.length ? '' : 'none';
        splitFeatures.innerHTML = data.features.map(f => {
          const parts = f.split(':');
          return `<li><strong style="color: #f1f5f9;">${parts[0]}:</strong>${parts.slice(1).join(':')}</li>`;
        }).join('');
      }
    };

    if (btnToggleSplit && panelSplit) {
      btnToggleSplit.addEventListener('click', () => {
        const isShown = panelSplit.style.display === 'flex';
        panelSplit.style.display = isShown ? 'none' : 'flex';
        if (viewerBody) viewerBody.classList.toggle('has-split', !isShown);
        btnToggleSplit.style.background = isShown
          ? 'linear-gradient(180deg, #059669, #047857)'
          : 'linear-gradient(180deg, #d97706, #b45309)';
        if (!isShown) {
          const v = this.viewer3DInstance;
          const cat = v?.currentCategory || document.querySelector('.btn-3d-cat.active')?.getAttribute('data-cat') || 'ENVIRONMENT';
          const hero = (cat === 'HERO' ? v?.currentSubId : null) || document.querySelector('.btn-sub-entity.active[data-cat="HERO"]')?.getAttribute('data-id') || 'DK';
          const env = (cat === 'ENVIRONMENT' ? v?.currentSubId : null) || document.querySelector('.btn-sub-entity.active[data-cat="ENVIRONMENT"]')?.getAttribute('data-id') || 'LORENCIA';
          if (cat === 'HERO') {
            this.updateSplitArtDisplay('HERO_' + hero);
          } else {
            this.updateSplitArtDisplay(env);
          }
        }
        setTimeout(() => {
          if (this.viewer3DInstance) this.viewer3DInstance.onWindowResize();
        }, 60);
      });
    }

    if (btnCloseSplit && panelSplit) {
      btnCloseSplit.addEventListener('click', () => {
        panelSplit.style.display = 'none';
        if (viewerBody) viewerBody.classList.remove('has-split');
        if (btnToggleSplit) btnToggleSplit.style.background = 'linear-gradient(180deg, #059669, #047857)';
        setTimeout(() => {
          if (this.viewer3DInstance) this.viewer3DInstance.onWindowResize();
        }, 60);
      });
    }

    if (btnOpenArt && modalArt) {
      btnOpenArt.addEventListener('click', () => {
        const v = this.viewer3DInstance;
        const cat = v?.currentCategory || document.querySelector('.btn-3d-cat.active')?.getAttribute('data-cat') || 'ENVIRONMENT';
        const hero = (cat === 'HERO' ? v?.currentSubId : null) || document.querySelector('.btn-sub-entity.active[data-cat="HERO"]')?.getAttribute('data-id') || 'DK';
        const env = (cat === 'ENVIRONMENT' ? v?.currentSubId : null) || document.querySelector('.btn-sub-entity.active[data-cat="ENVIRONMENT"]')?.getAttribute('data-id') || 'LORENCIA';
        const currentBiome = cat === 'HERO' ? 'HERO_' + hero : env;
        updateArtDisplay(currentBiome);
        modalArt.style.display = 'flex';
      });

      document.querySelectorAll('.btn-art-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          updateArtDisplay(tab.getAttribute('data-biome'));
        });
      });
    }

    // 9. Abas de Alternância de Visão (Arena, Cenários 3D, Bolsa, Dividido, Visualizador 3D)
    const tabCombat = document.getElementById('tab-combat');
    const tabScenery = document.getElementById('tab-scenery');
    const tabBosses = document.getElementById('tab-bosses');
    const tabEvents = document.getElementById('tab-events');
    const tabInventory = document.getElementById('tab-inventory');
    const tabSplit = document.getElementById('tab-split');
    const tabViewer3D = document.getElementById('tab-viewer3d');
    const btnQuickScenery = document.getElementById('btn-quick-scenery');

    const setMode = (mode) => {
      try {
        this.viewMode = mode;
      [tabCombat, tabScenery, tabBosses, tabEvents, tabInventory, tabSplit, tabViewer3D].forEach((b) => b && b.classList.remove('active'));
      if (this.domBossesPanel) this.domBossesPanel.style.display = 'none';
      if (this.domEventsPanel) this.domEventsPanel.style.display = 'none';

      if (mode === 'combat') {
        if (tabCombat) tabCombat.classList.add('active');
        if (this.domArenaPanel) this.domArenaPanel.style.display = 'flex';
        if (this.domWorkspaceGrid) this.domWorkspaceGrid.style.display = 'none';
        if (this.domViewer3DPanel) this.domViewer3DPanel.style.display = 'none';
        if (this.arena3D && this.use3DRenderer) {
          setTimeout(() => this.arena3D.onWindowResize(), 50);
        }
      } else if (mode === 'scenery') {
        if (tabScenery) tabScenery.classList.add('active');
        if (this.domArenaPanel) this.domArenaPanel.style.display = 'none';
        if (this.domWorkspaceGrid) this.domWorkspaceGrid.style.display = 'none';
        if (this.domViewer3DPanel) this.domViewer3DPanel.style.display = 'flex';

        if (!this.viewer3DInstance) {
          this.initViewer3D('ENVIRONMENT', 'LORENCIA');
        } else {
          const catBtn = document.querySelector('.btn-3d-cat[data-cat="ENVIRONMENT"]');
          if (catBtn) catBtn.click();
        }
        if (this.updateSplitArtDisplay) {
          const activeSubBtn = document.querySelector('.btn-sub-entity.active[data-cat="ENVIRONMENT"]');
          const currentBiome = (activeSubBtn && activeSubBtn.getAttribute('data-id')) || 'LORENCIA';
          this.updateSplitArtDisplay(currentBiome);
        }
        [20, 80, 200, 350].forEach((delay) => {
          setTimeout(() => {
            if (this.viewer3DInstance) this.viewer3DInstance.onWindowResize();
          }, delay);
        });
      } else if (mode === 'bosses') {
        if (tabBosses) tabBosses.classList.add('active');
        if (this.domArenaPanel) this.domArenaPanel.style.display = 'none';
        if (this.domWorkspaceGrid) this.domWorkspaceGrid.style.display = 'none';
        if (this.domViewer3DPanel) this.domViewer3DPanel.style.display = 'none';
        if (this.domBossesPanel) this.domBossesPanel.style.display = 'flex';
        this.refreshActiveBosses();
      } else if (mode === 'events') {
        if (tabEvents) tabEvents.classList.add('active');
        if (this.domArenaPanel) this.domArenaPanel.style.display = 'none';
        if (this.domWorkspaceGrid) this.domWorkspaceGrid.style.display = 'none';
        if (this.domViewer3DPanel) this.domViewer3DPanel.style.display = 'none';
        if (this.domEventsPanel) this.domEventsPanel.style.display = 'flex';
        this.refreshEventsStatus();
      } else if (mode === 'inventory') {
        if (tabInventory) tabInventory.classList.add('active');
        if (this.domArenaPanel) this.domArenaPanel.style.display = 'none';
        if (this.domWorkspaceGrid) this.domWorkspaceGrid.style.display = 'grid';
        if (this.domViewer3DPanel) this.domViewer3DPanel.style.display = 'none';
      } else if (mode === 'viewer3d') {
        if (tabViewer3D) tabViewer3D.classList.add('active');
        if (this.domArenaPanel) this.domArenaPanel.style.display = 'none';
        if (this.domWorkspaceGrid) this.domWorkspaceGrid.style.display = 'none';
        if (this.domViewer3DPanel) this.domViewer3DPanel.style.display = 'flex';

        if (!this.viewer3DInstance) {
          this.initViewer3D('HERO', 'DK');
        } else {
          const heroCatBtn = document.querySelector('.btn-3d-cat[data-cat="HERO"]');
          if (heroCatBtn && !heroCatBtn.classList.contains('active')) heroCatBtn.click();
        }
        [20, 80, 200, 350].forEach((delay) => {
          setTimeout(() => {
            if (this.viewer3DInstance) this.viewer3DInstance.onWindowResize();
          }, delay);
        });
      } else {
        if (tabSplit) tabSplit.classList.add('active');
        if (this.domArenaPanel) this.domArenaPanel.style.display = 'flex';
        if (this.domWorkspaceGrid) this.domWorkspaceGrid.style.display = 'grid';
        if (this.domViewer3DPanel) this.domViewer3DPanel.style.display = 'none';
        if (this.arena3D && this.use3DRenderer) {
          setTimeout(() => this.arena3D.onWindowResize(), 50);
        }
      }
      } catch (err) {
        console.error('[DevClientApp] Falha ao alternar modo ' + mode, err);
      }
    };

    if (tabCombat) tabCombat.addEventListener('click', () => setMode('combat'));
    if (tabScenery) tabScenery.addEventListener('click', () => setMode('scenery'));
    if (btnQuickScenery) btnQuickScenery.addEventListener('click', () => setMode('scenery'));
    if (tabBosses) tabBosses.addEventListener('click', () => setMode('bosses'));
    if (tabEvents) tabEvents.addEventListener('click', () => setMode('events'));
    if (tabInventory) tabInventory.addEventListener('click', () => setMode('inventory'));
    if (tabSplit) tabSplit.addEventListener('click', () => setMode('split'));
    if (tabViewer3D) tabViewer3D.addEventListener('click', () => setMode('viewer3d'));



    // 10. Atalhos de Teclado & Action Bar Moderna 3D
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      this.handleShortcut(e.code, e);
    });

    // Cliques diretos nos slots da Action Bar
    document.querySelectorAll('.action-slot').forEach((slot) => {
      slot.addEventListener('click', () => {
        const cls = this.character?.characterClass;
        const isDw = cls === 'DW' || cls === 'SOUL_MASTER';
        const isElf = cls === 'ELF' || cls === 'FAIRY_ELF' || cls === 'MUSE_ELF';
        const skillE = isDw ? 'fireball' : isElf ? 'triple_shot' : 'cyclone';
        const skillR = isDw ? 'evil_spirits' : isElf ? 'penetration' : 'death_stab';
        const primaryAtk = isDw ? 'energy_ball' : isElf ? 'triple_shot' : 'ATTACK';
        const secondaryAtk = isDw ? 'evil_spirits' : isElf ? 'penetration' : 'cyclone';

        const key = slot.getAttribute('data-key');
        if (key === 'Q') this.useHealthPotion();
        else if (key === 'W') this.useManaPotion();
        else if (key === 'E') this.castSkill('E', skillE);
        else if (key === 'R') this.castSkill('R', skillR);
        else if (key === 'SPACE') this.performDodge();
        else if (key === 'LMB') {
          const btnBossAtk = document.getElementById('btn-boss-attack');
          if (btnBossAtk) btnBossAtk.click();
          else if (this.arena3D) this.arena3D.triggerSkill(primaryAtk);
        } else if (key === 'RMB') {
          this.castSkill('E', secondaryAtk);
        }
      });
    });

    // Inicia loop de regeneração e animação de cooldowns
    this.startHudVitalsLoop();

    // Inicia de acordo com parâmetros de URL ou padrão 'combat' (Arena Lorencia 3D Jogável)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const initialTab = urlParams.get('tab') || 'combat';
      setMode(initialTab);

      if (urlParams.get('cat')) {
        setTimeout(() => {
          const catBtn = document.querySelector(`.btn-3d-cat[data-cat="${urlParams.get('cat')}"]`);
          if (catBtn) catBtn.click();
        }, 150);
      }
      if (urlParams.get('hero')) {
        setTimeout(() => {
          const heroBtn = document.querySelector(`.btn-sub-entity[data-cat="HERO"][data-id="${urlParams.get('hero')}"]`);
          if (heroBtn) heroBtn.click();
        }, 250);
      }
      if (urlParams.get('modular') === '1' || urlParams.get('modular') === 'true') {
        setTimeout(() => {
          const modCheck = document.getElementById('hero-modular-mode');
          if (modCheck && !modCheck.checked) {
            modCheck.checked = true;
            modCheck.dispatchEvent(new Event('change'));
          }
        }, 350);
      }
    } catch (tabErr) {
      console.error('[DevClientApp] Erro na inicialização da aba inicial:', tabErr);
    }
  }

  // ==========================================================================
  // INICIALIZAÇÃO E CONTROLE DO VISUALIZADOR 3D NATIVO (Three.js WebGL)
  // ==========================================================================
  initViewer3D(initialCategory = 'ENVIRONMENT', initialSubId = null) {
    if (!initialSubId) {
      if (initialCategory === 'HERO') initialSubId = 'DK';
      else if (initialCategory === 'MONSTER') initialSubId = 'SPIDER';
      else if (initialCategory === 'ARMORY') initialSubId = 'DRAGON_BLADE';
      else initialSubId = 'LORENCIA';
    } else if (initialCategory === 'HERO' && !['DK', 'DW', 'ELF', 'MG', 'DL'].includes(initialSubId)) {
      initialSubId = 'DK';
    }
    this.viewer3DInstance = new Dasi3DFeatureViewer('dasi-3d-viewport', initialCategory, initialSubId);

    const badgeMode = document.getElementById('badge-3d-mode');
    const badgeGlow = document.getElementById('badge-3d-glow');
    const lblRefine = document.getElementById('lbl-refinement-level');
    const descRefine = document.getElementById('desc-refinement-3d');
    const rangeRefine = document.getElementById('range-3d-refinement');
    const groupRefine = document.getElementById('group-3d-refinement');
    const groupAnims = document.getElementById('group-3d-animations');
    const groupBestiaryAnims = document.getElementById('group-3d-bestiary-anims');

    const subHeroes = document.getElementById('sub-group-heroes');
    const subMonsters = document.getElementById('sub-group-monsters');
    const subEnvironments = document.getElementById('sub-group-environments');
    const subArmory = document.getElementById('sub-group-armory');
    const subNpcs = document.getElementById('sub-group-npcs');
    const subMounts = document.getElementById('sub-group-mounts');
    const selectArmoryItem = document.getElementById('select-armory-item');
    const armoryTitle = document.getElementById('armory-info-title');
    const armoryBadge = document.getElementById('armory-info-badge');
    const armoryReq = document.getElementById('armory-info-req');
    const armoryDesc = document.getElementById('armory-info-desc');
    const armorySubmodeBtns = document.querySelectorAll('.btn-armory-submode');

    let currentCategory = initialCategory || 'HERO';
    let currentHero = initialCategory === 'HERO' ? (initialSubId || 'DK') : 'DK';
    let currentSetTier = 'DRAGON';
    let currentMonster = 'SPIDER';
    let currentNpc = 'NPC_HANZO';
    let currentMount = 'DARK_HORSE';
    let currentEnv = initialCategory === 'ENVIRONMENT' ? (initialSubId || 'LORENCIA') : 'LORENCIA';
    let currentArmorySub = 'WEAPON';
    let currentArmoryItem = 'DRAGON_BLADE';

    const tileStatus = document.getElementById('tile-floor-status');
    const tileCol = document.getElementById('tile-col');
    const tileRow = document.getElementById('tile-row');
    const tileVariant = document.getElementById('tile-variant');
    const updateTileStatus = (controller, id) => {
      if (!tileStatus) return;
      tileStatus.textContent = controller
        ? `${canonicalTileScenario(id)}: ${controller.cols} colunas × ${controller.rows} linhas (tiles de até ${controller.tileSize} m).`
        : 'Este cenário ainda não possui piso plano modular.';
      if (tileCol) { tileCol.max = controller ? String(controller.cols - 1) : '0'; tileCol.value = '0'; }
      if (tileRow) { tileRow.max = controller ? String(controller.rows - 1) : '0'; tileRow.value = '0'; }
    };
    this.viewer3DInstance.onTileFloorChanged = updateTileStatus;
    updateTileStatus(this.viewer3DInstance.activeEntity?.tileFloor, currentEnv);
    const applyTile = (col, row) => {
      const viewer = this.viewer3DInstance;
      const controller = viewer?.currentCategory === 'ENVIRONMENT' && viewer.activeEntity?.tileFloor;
      if (!controller) { updateTileStatus(null, viewer?.currentSubId); return; }
      const value = tileVariant?.value;
      const ok = value === 'remover_objeto' ? controller.setObject(col, row, 'original') : OBJECT_VARIANTS.includes(value) ? controller.setObject(col, row, value) : controller.setTile(col, row, value);
      if (!ok) {
        tileStatus.textContent = 'Coluna, linha ou variante inválida, ou célula fora da área editável.'; return;
      }
      const saved = saveTileEdits(viewer.currentSubId, controller);
      tileStatus.textContent = saved ? `Tile ${col}, ${row} atualizado e salvo neste navegador.` : `Tile ${col}, ${row} atualizado, mas não foi possível salvar.`;
    };
    document.getElementById('tile-apply')?.addEventListener('click', () => {
      if (tileCol?.value === '' || tileRow?.value === '') { tileStatus.textContent = 'Informe coluna e linha.'; return; }
      applyTile(Number(tileCol?.value), Number(tileRow?.value));
    });
    this.viewer3DInstance?.renderer?.domElement?.addEventListener('dblclick', (event) => {
      const viewer = this.viewer3DInstance;
      const controller = viewer?.currentCategory === 'ENVIRONMENT' && viewer.activeEntity?.tileFloor;
      if (!controller) return;
      const rect = viewer.renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const pointer = new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(pointer, viewer.camera);
      let cell = controller.pickCell?.(ray);
      if (!controller.pickCell) {
        const hit = ray.intersectObject(controller.mesh)[0];
        if (hit?.instanceId === undefined) return;
        cell = { col: hit.instanceId % controller.cols, row: Math.floor(hit.instanceId / controller.cols) };
      }
      if (!cell) return;
      const { col, row } = cell;
      if (tileCol) tileCol.value = String(col);
      if (tileRow) tileRow.value = String(row);
      applyTile(col, row);
    });
    document.getElementById('tile-reset')?.addEventListener('click', () => {
      const viewer = this.viewer3DInstance;
      const controller = viewer?.currentCategory === 'ENVIRONMENT' && viewer.activeEntity?.tileFloor;
      if (!controller) return;
      controller.clearEdits();
      const saved = saveTileEdits(viewer.currentSubId, controller);
      tileStatus.textContent = saved ? 'Alterações locais removidas.' : 'Alterações removidas da tela, mas não foi possível salvar.';
    });
    document.getElementById('tile-export')?.addEventListener('click', () => {
      const viewer = this.viewer3DInstance;
      const controller = viewer?.currentCategory === 'ENVIRONMENT' && viewer.activeEntity?.tileFloor;
      if (!controller) return;
      const scenarioId = canonicalTileScenario(viewer.currentSubId);
      const payload = makeTileDocument(scenarioId, controller);
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = `${scenarioId.toLowerCase()}-tiles.json`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    document.getElementById('tile-export-glb')?.addEventListener('click', async (event) => {
      const viewer = this.viewer3DInstance;
      if (viewer?.currentCategory !== 'ENVIRONMENT' || !viewer.activeEntity?.tileFloor) return;
      const scenarioId = canonicalTileScenario(viewer.currentSubId);
      const button = event.currentTarget;
      button.disabled = true;
      try {
        // Snapshot sincronizado antes da exportação assíncrona: não altera a cena viva.
        const snapshot = buildEditedScenarioSnapshot(THREE, viewer.activeEntity.group);
        const buffer = await new GLTFExporter().parseAsync(snapshot, { binary: true, onlyVisible: true });
        const url = URL.createObjectURL(new Blob([buffer], { type: 'model/gltf-binary' }));
        const link = document.createElement('a');
        link.href = url; link.download = `${scenarioId.toLowerCase()}-editado.glb`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        tileStatus.textContent = 'GLB visual exportado; colisões e efeitos dinâmicos não estão incluídos.';
      } catch (error) {
        console.error('Falha ao exportar GLB visual', error);
        tileStatus.textContent = 'Não foi possível exportar o GLB visual.';
      } finally { button.disabled = false; }
    });

    document.getElementById('tile-export-all')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const zip = await exportScenarioBatch({
          THREE, scenarioIds: SCENARIO_BLOCKOUTS, storage: globalThis.localStorage,
          createEnvironment, Exporter: GLTFExporter,
          onProgress: ({ id, completed, total }) => { tileStatus.textContent = id ? `Gerando ${id}: ${completed + 1}/${total}…` : `Gerados ${total} cenários.`; },
        });
        const url = URL.createObjectURL(zip);
        const link = document.createElement('a');
        link.href = url; link.download = 'dasi-cenarios-editados.zip'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        tileStatus.textContent = 'Lote exportado com as edições salvas neste navegador; sem colisões.';
      } catch (error) {
        console.error('Falha na exportação em lote', error);
        tileStatus.textContent = `Lote não exportado: ${error.message || 'erro inesperado'}.`;
      } finally { button.disabled = false; }
    });

    document.getElementById('tile-import')?.addEventListener('change', async (event) => {
      const input = event.target;
      const viewer = this.viewer3DInstance;
      const controller = viewer?.currentCategory === 'ENVIRONMENT' && viewer.activeEntity?.tileFloor;
      const file = input.files?.[0];
      if (!controller || !file) return;
      if (file.size > 200000) { tileStatus.textContent = 'Arquivo de tiles muito grande.'; input.value = ''; return; }
      try {
        const data = JSON.parse(await file.text());
        // A seleção pode mudar enquanto o arquivo é lido.
        if (viewer.activeEntity?.tileFloor !== controller || !validateTileDocument(data, viewer.currentSubId, controller)) throw new Error('Documento inválido');
        const layers = tileDocumentLayers(data);
        controller.clearEdits();
        controller.applyEdits(layers.floor);
        controller.applyEdits(layers.objects, 'objects');
        tileStatus.textContent = saveTileEdits(viewer.currentSubId, controller) ? 'Tiles importados e salvos neste navegador.' : 'Tiles importados, mas não foi possível salvar.';
      } catch {
        tileStatus.textContent = 'Arquivo inválido ou incompatível com este cenário; nada foi alterado.';
      } finally { input.value = ''; }
    });

    const glowDescriptions = {
      0: 'Metal PBR fosco/polido sem emissão arcana (+0 a +6).',
      7: 'Pulso rúnico ciano suave correndo pelas bordas e runas.',
      9: 'Aura solar dourada cintilante com partículas aditivas e realce metálico.',
      11: 'Arcos elétricos de plasma e centelhas intensas de fogo sacro.',
      15: 'Corona celestial divina volumétrica com vórtice e ressonância máxima (+15).'
    };

    const getGlowTitle = (lvl) => {
      if (lvl <= 6) return `+${lvl} METAL PBR`;
      if (lvl <= 8) return `+${lvl} PULSO RÚNICO`;
      if (lvl <= 10) return `+${lvl} AURA SOLAR DOURADA`;
      if (lvl <= 12) return `+${lvl} ARCOS DE RAIO/FOGO`;
      return `+${lvl} CORONA CELESTIAL`;
    };

    const applyGlow = (lvl) => {
      const level = parseInt(lvl, 10);
      if (this.viewer3DInstance) this.viewer3DInstance.updateRefinementGlow(level);
      if (rangeRefine) rangeRefine.value = level;
      const title = getGlowTitle(level);
      if (lblRefine) lblRefine.textContent = title;
      if (badgeGlow) badgeGlow.textContent = `REFINAMENTO: ${title}`;

      let descKey = 0;
      if (level >= 13) descKey = 15;
      else if (level >= 11) descKey = 11;
      else if (level >= 9) descKey = 9;
      else if (level >= 7) descKey = 7;
      if (descRefine) descRefine.textContent = glowDescriptions[descKey];

      document.querySelectorAll('.btn-quick-glow').forEach((btn) => {
        btn.classList.toggle('active', parseInt(btn.dataset.level, 10) === level);
      });
    };

    const updateAnimButtons = (category, id) => {
      const btnSkill1 = document.getElementById('btn-anim-skill1');
      // O painel de clips só aparece para criaturas com GLB articulado.
      if (groupBestiaryAnims) {
        const articulated = category === 'MONSTER' && !!this.viewer3DInstance?.hasAnimatedBestiary?.(id);
        groupBestiaryAnims.style.display = articulated ? 'flex' : 'none';
      }
      const btnSkill2 = document.getElementById('btn-anim-skill2');
      const btnRoll = document.getElementById('btn-anim-roll');

      if (category === 'HERO') {
        if (btnRoll) btnRoll.style.display = 'flex';
        if (id === 'DK') {
          if (btnSkill1) { btnSkill1.textContent = '🔥 Twisting Slash [E]'; btnSkill1.dataset.anim = 'TWISTING_SLASH'; }
          if (btnSkill2) { btnSkill2.textContent = '⚡ Death Stab [R]'; btnSkill2.dataset.anim = 'DEATH_STAB'; }
        } else if (id === 'DW') {
          if (btnSkill1) { btnSkill1.textContent = '🔮 Evil Spirits [E]'; btnSkill1.dataset.anim = 'TWISTING_SLASH'; }
          if (btnSkill2) { btnSkill2.textContent = '❄️ Ice Storm [R]'; btnSkill2.dataset.anim = 'DEATH_STAB'; }
        } else if (id === 'ELF') {
          if (btnSkill1) { btnSkill1.textContent = '🏹 Triple Shot [E]'; btnSkill1.dataset.anim = 'TWISTING_SLASH'; }
          if (btnSkill2) { btnSkill2.textContent = '💚 Blessing / Heal [R]'; btnSkill2.dataset.anim = 'DEATH_STAB'; }
        } else if (id === 'MG') {
          if (btnSkill1) { btnSkill1.textContent = '🔥 Fire Slash [E]'; btnSkill1.dataset.anim = 'TWISTING_SLASH'; }
          if (btnSkill2) { btnSkill2.textContent = '⚡ Power Slash [R]'; btnSkill2.dataset.anim = 'DEATH_STAB'; }
        } else if (id === 'DL') {
          if (btnSkill1) { btnSkill1.textContent = '💥 Fireburst [E]'; btnSkill1.dataset.anim = 'TWISTING_SLASH'; }
          if (btnSkill2) { btnSkill2.textContent = '🌋 Earthquake [R]'; btnSkill2.dataset.anim = 'DEATH_STAB'; }
        }
      } else if (category === 'MONSTER') {
        if (btnSkill1) { btnSkill1.textContent = '🐾 Andar (Walk)'; btnSkill1.dataset.anim = 'WALK'; }
        if (btnSkill2) { btnSkill2.textContent = '⚔️ Atacar (Attack)'; btnSkill2.dataset.anim = 'ATTACK'; }
        if (btnRoll) btnRoll.style.display = 'none';
      }
    };

    const updateArmoryDisplay = (itemId, subType) => {
      currentArmoryItem = itemId;
      if (subType) currentArmorySub = subType;

      if (this.viewer3DInstance) {
        this.viewer3DInstance.selectEntity('ARMORY', currentArmoryItem, { subType: currentArmorySub });
      }

      const meta = ARMORY_METADATA ? ARMORY_METADATA[currentArmoryItem] : null;
      if (badgeMode) {
        badgeMode.textContent = `MODO: ARMARIA 3D (${meta ? meta.name : currentArmoryItem})`;
      }

      if (meta) {
        if (armoryTitle) armoryTitle.textContent = meta.name;
        if (armoryReq) armoryReq.textContent = `Classe: ${meta.classReq}`;
        if (armoryDesc) armoryDesc.textContent = meta.desc;
        if (armoryBadge) {
          armoryBadge.textContent = 'GLB Real (Blender 5.2)';
          armoryBadge.style.background = 'rgba(34, 197, 94, 0.2)';
          armoryBadge.style.borderColor = '#22c55e';
          armoryBadge.style.color = '#4ade80';
        }
      }

      const currentGlowVal = rangeRefine ? parseInt(rangeRefine.value, 10) : 0;
      applyGlow(currentGlowVal);
      this.log(`⚔️ [ARMARIA 3D] Visualizando modelo PBR: ${meta ? meta.name : currentArmoryItem} (${currentArmorySub})`, 'success');
    };

    const modularMode = document.getElementById('hero-modular-mode');
    const armorSlot = document.getElementById('hero-armor-slot');
    const armorVariant = document.getElementById('hero-armor-variant');
    const weaponSelect = document.getElementById('hero-weapon-select');
    const modularStatus = document.getElementById('hero-modular-status');

    const updateWeaponDropdown = () => {
      if (!weaponSelect) return;
      weaponSelect.innerHTML = '';
      const available = CLASS_WEAPONS[currentHero] || [];
      for (const wep of available) {
        const opt = document.createElement('option');
        opt.value = wep;
        opt.textContent = WEAPON_NAMES[wep] || wep;
        weaponSelect.appendChild(opt);
      }
    };

    const refreshModularLinks = () => {
      if (!Object.hasOwn(CHARACTER_CONCEPTS, currentHero) || !ARMOR_SLOTS.includes(armorSlot.value) || !ARMOR_VARIANTS.includes(armorVariant.value)) return;
      document.getElementById('hero-modular-download').href = `models/modular_heroes/hero_${currentHero.toLowerCase()}_modular.glb`;
      document.getElementById('hero-armor-download').href = `models/modular_heroes/${currentHero.toLowerCase()}_${armorSlot.value}_${armorVariant.value}.glb`;
      const curWep = weaponSelect?.value || CLASS_WEAPONS[currentHero]?.[0];
      const wepLink = document.getElementById('hero-weapon-download');
      if (wepLink && curWep) {
        wepLink.href = `models/modular_heroes/${currentHero.toLowerCase()}_weapon_${curWep.toLowerCase()}.glb`;
      }
    };
    updateWeaponDropdown();
    modularMode?.addEventListener('change', () => {
      this.viewer3DInstance.modularHeroMode = modularMode.checked;
      if (currentCategory === 'HERO') this.viewer3DInstance.selectEntity('HERO', currentHero, { setTier: currentSetTier });
      modularStatus.textContent = modularMode.checked ? 'Blockout modular ativo; trocas são apenas visuais e temporárias.' : 'Modelo anterior ativo; blockout modular desativado.';
    });
    const baseMeshToggle = document.getElementById('hero-base-mesh-toggle');
    baseMeshToggle?.addEventListener('change', () => {
      const viewer = this.viewer3DInstance;
      if (viewer?.activeEntity?.group) {
        const bodyBlockout = viewer.activeEntity.group.getObjectByName('body_blockout');
        if (bodyBlockout) {
          bodyBlockout.visible = baseMeshToggle.checked;
          if (modularStatus) {
            modularStatus.textContent = baseMeshToggle.checked ? 'Corpo base visível sob as peças de armadura.' : 'Corpo base oculto (apenas peças de armadura visíveis).';
          }
        }
      }
    });
    armorSlot?.addEventListener('change', refreshModularLinks);
    armorVariant?.addEventListener('change', refreshModularLinks);
    weaponSelect?.addEventListener('change', refreshModularLinks);
    document.getElementById('hero-armor-apply')?.addEventListener('click', () => {
      const viewer = this.viewer3DInstance;
      if (viewer.currentCategory !== 'HERO' || !viewer.activeEntity?.setArmor) {
        modularStatus.textContent = 'Ative um herói válido para trocar peças.'; return;
      }
      const changed = viewer.activeEntity.setArmor(armorSlot.value, armorVariant.value);
      modularStatus.textContent = changed ? 'Peça trocada nesta prévia; não afeta inventário ou servidor.' : 'Peça ou variante inválida.';
    });
    document.getElementById('hero-weapon-apply')?.addEventListener('click', () => {
      const viewer = this.viewer3DInstance;
      if (viewer.currentCategory !== 'HERO' || !viewer.activeEntity?.setWeapon) {
        modularStatus.textContent = 'Ative um herói válido para trocar de arma.'; return;
      }
      const changed = viewer.activeEntity.setWeapon(weaponSelect.value);
      modularStatus.textContent = changed ? `Arma trocada para ${WEAPON_NAMES[weaponSelect.value] || weaponSelect.value}.` : 'Arma inválida para esta classe.';
    });
    refreshModularLinks();

    // 1. Alternador de Categoria
    const catButtons = document.querySelectorAll('.btn-3d-cat');
    catButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        catButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat;

        if (subHeroes) subHeroes.style.display = currentCategory === 'HERO' ? 'flex' : 'none';
        if (subMonsters) subMonsters.style.display = currentCategory === 'MONSTER' ? 'flex' : 'none';
        if (subEnvironments) subEnvironments.style.display = currentCategory === 'ENVIRONMENT' ? 'flex' : 'none';
        if (subArmory) subArmory.style.display = currentCategory === 'ARMORY' ? 'flex' : 'none';
        if (subNpcs) subNpcs.style.display = currentCategory === 'NPC' ? 'flex' : 'none';
        if (subMounts) subMounts.style.display = currentCategory === 'MOUNT' ? 'flex' : 'none';
        if (groupRefine) groupRefine.style.display = (currentCategory === 'HERO' || currentCategory === 'CHAOS_MACHINE' || currentCategory === 'ARMORY') ? 'flex' : 'none';
        if (groupAnims) groupAnims.style.display = (currentCategory === 'HERO' || currentCategory === 'MONSTER') ? 'flex' : 'none';
        if (groupBestiaryAnims) groupBestiaryAnims.style.display = 'none';

        if (currentCategory === 'HERO') {
          this.viewer3DInstance.selectEntity('HERO', currentHero, { setTier: currentSetTier });
          if (badgeMode) badgeMode.textContent = `MODO: HERÓI (${currentHero})`;
          updateAnimButtons('HERO', currentHero);
        } else if (currentCategory === 'MONSTER') {
          this.viewer3DInstance.selectEntity('MONSTER', currentMonster);
          if (badgeMode) badgeMode.textContent = `MODO: MONSTRO (${currentMonster})`;
          updateAnimButtons('MONSTER', currentMonster);
        } else if (currentCategory === 'ENVIRONMENT') {
          this.viewer3DInstance.selectEntity('ENVIRONMENT', currentEnv);
          if (badgeMode) badgeMode.textContent = `MODO: CENÁRIO (${currentEnv})`;
          if (this.updateSplitArtDisplay) this.updateSplitArtDisplay(currentEnv);
        } else if (currentCategory === 'NPC') {
          this.viewer3DInstance.selectEntity('NPC', currentNpc);
          if (badgeMode) badgeMode.textContent = `MODO: NPC (${currentNpc})`;
        } else if (currentCategory === 'MOUNT') {
          this.viewer3DInstance.selectEntity('MOUNT', currentMount);
          if (badgeMode) badgeMode.textContent = `MODO: MONTARIA/PET (${currentMount})`;
        } else if (currentCategory === 'CHAOS_MACHINE') {
          this.viewer3DInstance.selectEntity('CHAOS_MACHINE');
          if (badgeMode) badgeMode.textContent = 'MODO: MÁQUINA DO CAOS';
        } else if (currentCategory === 'ARMORY') {
          updateArmoryDisplay(currentArmoryItem, currentArmorySub);
        }
      });
    });

    // 2. Sub-seleção de Entidades (Heróis, Monstros, Cenários, NPCs, Montarias)
    const subEntityButtons = document.querySelectorAll('.btn-sub-entity');
    subEntityButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        const id = btn.dataset.id;

        btn.parentElement.querySelectorAll('.btn-sub-entity').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        if (cat === 'HERO') {
          currentHero = id;
          updateWeaponDropdown();
          refreshModularLinks();
          this.viewer3DInstance.selectEntity('HERO', currentHero, { setTier: currentSetTier });
          if (badgeMode) badgeMode.textContent = `MODO: HERÓI (${currentHero})`;
          updateAnimButtons('HERO', currentHero);
          if (this.updateSplitArtDisplay) this.updateSplitArtDisplay('HERO_' + currentHero);
        } else if (cat === 'MONSTER') {
          currentMonster = id;
          this.viewer3DInstance.selectEntity('MONSTER', currentMonster);
          if (badgeMode) badgeMode.textContent = `MODO: MONSTRO (${currentMonster})`;
          updateAnimButtons('MONSTER', currentMonster);
        } else if (cat === 'NPC') {
          currentNpc = id;
          this.viewer3DInstance.selectEntity('NPC', currentNpc);
          if (badgeMode) badgeMode.textContent = `MODO: NPC (${currentNpc})`;
        } else if (cat === 'MOUNT') {
          currentMount = id;
          this.viewer3DInstance.selectEntity('MOUNT', currentMount);
          if (badgeMode) badgeMode.textContent = `MODO: MONTARIA/PET (${currentMount})`;
        } else if (cat === 'ENVIRONMENT') {
          currentEnv = id;
          this.viewer3DInstance.selectEntity('ENVIRONMENT', currentEnv);
          if (badgeMode) badgeMode.textContent = `MODO: CENÁRIO (${currentEnv})`;
          if (this.updateSplitArtDisplay) this.updateSplitArtDisplay(currentEnv);
          document.querySelectorAll('.btn-vp-biome').forEach((b) => {
            const isSel = b.getAttribute('data-id') === id;
            b.classList.toggle('active', isSel);
            b.style.background = isSel ? 'rgba(217, 119, 6, 0.35)' : 'transparent';
            b.style.borderColor = isSel ? '#f59e0b' : 'rgba(255,255,255,0.12)';
            b.style.color = isSel ? '#fbbf24' : '#94a3b8';
          });
          const selectScenario47 = document.getElementById('select-scenario-47');
          if (selectScenario47) {
            const prefix = id.startsWith('VOL') || id.startsWith('VALLEY') || id.startsWith('SIEGE') ? 'VOL'
              : (id.startsWith('EVT') || id.startsWith('EVENT') ? 'EVT' : id.substring(0, 3));
            const firstOption = Array.from(selectScenario47.options).find(o => o.value.startsWith(prefix));
            if (firstOption) selectScenario47.value = firstOption.value;
          }
        }
      });
    });

    // 2.1 Botões Flutuantes no Topo do Viewport 3D
    document.querySelectorAll('.btn-vp-biome').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const envBtn = document.querySelector(`.btn-sub-entity[data-cat="ENVIRONMENT"][data-id="${id}"]`);
        if (envBtn) envBtn.click();
      });
    });

    // 2.2 Dropdown Completo dos 47 Cenários Canônicos 3D
    const selectScenario47 = document.getElementById('select-scenario-47');
    if (selectScenario47) {
      selectScenario47.addEventListener('change', (e) => {
        const scenarioId = e.target.value;
        currentEnv = scenarioId;
        if (this.viewer3DInstance) {
          this.viewer3DInstance.selectEntity('ENVIRONMENT', scenarioId);
        }
        if (this.arena3D) {
          this.arena3D.switchMap(scenarioId);
        }
        if (badgeMode) badgeMode.textContent = `MODO: CENÁRIO (${scenarioId})`;
        if (this.updateSplitArtDisplay) this.updateSplitArtDisplay(scenarioId);
        this.log(`🗺️ [3D CENÁRIO] Carregado: ${scenarioId} com colisões físicas ativas.`, 'success');
      });
    }

    // 2.3 Botão de Alternância de Wireframes de Colisão 3D
    const btnToggleCollision = document.getElementById('btn-toggle-collision-debug');
    if (btnToggleCollision) {
      btnToggleCollision.addEventListener('click', () => {
        let isViewerOn = false;
        let isArenaOn = false;
        if (this.viewer3DInstance) {
          isViewerOn = this.viewer3DInstance.toggleCollisionDebug();
        }
        if (this.arena3D) {
          isArenaOn = this.arena3D.toggleCollisionDebug();
        }
        const active = isViewerOn || isArenaOn;
        btnToggleCollision.textContent = active ? '🛡️ Colisão 3D: ON' : '🛡️ Colisão 3D: OFF';
        btnToggleCollision.style.background = active ? 'rgba(34, 197, 94, 0.35)' : 'rgba(244, 63, 94, 0.20)';
        btnToggleCollision.style.borderColor = active ? '#22c55e' : '#f43f5e';
        btnToggleCollision.style.color = active ? '#86efac' : '#fda4af';
        this.log(`🛡️ [COLISÃO FÍSICA] Wireframes de Colisão 3D ${active ? 'ATIVADOS (Visíveis)' : 'DESATIVADOS'}.`, 'info');
      });
    }

    // 2.3b Botão de Alternância de Vida Ambiental & Fauna Dinâmica
    const btnToggleAmbient = document.getElementById('btn-toggle-ambient-life');
    if (btnToggleAmbient) {
      btnToggleAmbient.addEventListener('click', () => {
        let active = true;
        if (this.arena3D && typeof this.arena3D.toggleAmbientLife === 'function') {
          active = this.arena3D.toggleAmbientLife();
        }
        btnToggleAmbient.textContent = active ? '🕊️ Fauna: ON' : '🕊️ Fauna: OFF';
        btnToggleAmbient.style.background = active ? 'rgba(16, 185, 129, 0.25)' : 'rgba(100, 116, 139, 0.20)';
        btnToggleAmbient.style.borderColor = active ? '#10b981' : '#64748b';
        btnToggleAmbient.style.color = active ? '#6ee7b7' : '#94a3b8';
        this.log(`🕊️ [VITALIDADE AMBIENTAL] Fauna, bandos e tochas ${active ? 'ATIVADOS' : 'DESATIVADOS'}.`, 'info');
      });
    }

    // 2.4 Controles da Armaria 3D (Submodos: Armas, Escudos, Sets)
    armorySubmodeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        armorySubmodeBtns.forEach((b) => {
          b.classList.remove('active');
          b.style.borderColor = 'rgba(255,255,255,0.15)';
          b.style.background = 'transparent';
          b.style.color = '#94a3b8';
        });
        btn.classList.add('active');
        btn.style.borderColor = '#38bdf8';
        btn.style.background = 'rgba(56, 189, 248, 0.2)';
        btn.style.color = '#7dd3fc';

        const sub = btn.dataset.sub;
        currentArmorySub = sub;

        if (selectArmoryItem) {
          const optWeapons = document.getElementById('optgroup-armory-weapons');
          const optShields = document.getElementById('optgroup-armory-shields');
          const optSets = document.getElementById('optgroup-armory-sets');

          if (optWeapons) optWeapons.style.display = (sub === 'WEAPON') ? '' : 'none';
          if (optShields) optShields.style.display = (sub === 'SHIELD') ? '' : 'none';
          if (optSets) optSets.style.display = (sub === 'ARMOR_SET') ? '' : 'none';

          let firstOption = null;
          if (sub === 'WEAPON' && optWeapons) firstOption = optWeapons.querySelector('option');
          else if (sub === 'SHIELD' && optShields) firstOption = optShields.querySelector('option');
          else if (sub === 'ARMOR_SET' && optSets) firstOption = optSets.querySelector('option');

          if (firstOption) {
            selectArmoryItem.value = firstOption.value;
            updateArmoryDisplay(firstOption.value, sub);
          }
        }
      });
    });

    if (selectArmoryItem) {
      selectArmoryItem.addEventListener('change', (e) => {
        const itemId = e.target.value;
        const meta = ARMORY_METADATA ? ARMORY_METADATA[itemId] : null;
        const subType = meta ? meta.type : (itemId.startsWith('SET_') ? 'ARMOR_SET' : (itemId.includes('SHIELD') ? 'SHIELD' : 'WEAPON'));

        armorySubmodeBtns.forEach((b) => {
          const isCurrent = b.dataset.sub === subType;
          b.classList.toggle('active', isCurrent);
          if (isCurrent) {
            b.style.borderColor = '#38bdf8';
            b.style.background = 'rgba(56, 189, 248, 0.2)';
            b.style.color = '#7dd3fc';
          } else {
            b.style.borderColor = 'rgba(255,255,255,0.15)';
            b.style.background = 'transparent';
            b.style.color = '#94a3b8';
          }
        });

        updateArmoryDisplay(itemId, subType);
      });
    }

    // 3. Seleção de Tier de Set
    const tierButtons = document.querySelectorAll('.btn-set-tier');
    tierButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        tierButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentSetTier = btn.dataset.tier;
        if (currentCategory === 'HERO') {
          this.viewer3DInstance.selectEntity('HERO', currentHero, { setTier: currentSetTier });
        }
      });
    });

    // 4. Slider de Refinamento
    if (rangeRefine) {
      rangeRefine.addEventListener('input', (e) => {
        applyGlow(e.target.value);
      });
    }

    // 5. Botões Rápidos de Refinamento
    document.querySelectorAll('.btn-quick-glow').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyGlow(btn.dataset.level);
      });
    });

    // 6. Botões de Animação
    const animButtons = document.querySelectorAll('.btn-3d-anim');
    animButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        animButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const anim = btn.dataset.anim;
        if (this.viewer3DInstance) this.viewer3DInstance.triggerAnimation(anim);
      });
    });

    // 6b. Botões de Clips do Bestiário Articulado (IDLE/MOVE/ATTACK/HURT/DEATH)
    const bestiaryAnimButtons = document.querySelectorAll('.btn-3d-bestiary-anim');
    bestiaryAnimButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        bestiaryAnimButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.viewer3DInstance) this.viewer3DInstance.triggerBestiaryAnimation(btn.dataset.bestiaryAnim);
      });
    });

    // 7. Botões de Câmera
    document.querySelectorAll('.btn-3d-cam').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        if (this.viewer3DInstance) this.viewer3DInstance.setCameraPreset(preset);
      });
    });

    if (initialCategory === 'ENVIRONMENT') {
      const catBtn = document.querySelector('.btn-3d-cat[data-cat="ENVIRONMENT"]');
      if (catBtn) catBtn.click();
      const envBtn = document.querySelector(`.btn-sub-entity[data-cat="ENVIRONMENT"][data-id="${currentEnv}"]`);
      if (envBtn) envBtn.click();
    } else if (initialCategory === 'ARMORY') {
      const catBtn = document.querySelector('.btn-3d-cat[data-cat="ARMORY"]');
      if (catBtn) catBtn.click();
    }

    // Garantir render correto logo após a troca de tab com múltiplas tentativas
    [30, 100, 250].forEach((delay) => {
      setTimeout(() => {
        if (this.viewer3DInstance) this.viewer3DInstance.onWindowResize();
      }, delay);
    });
  }

  useHealthPotion() {
    if (this.cooldowns.Q > Date.now()) return;
    this.cooldowns.Q = Date.now() + this.maxCooldowns.Q;
    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 320);
    this.update3DHud();
    this.log('🧪 [POÇÃO DE VIDA] Recuperou +320 HP!', 'success');
  }

  useManaPotion() {
    if (this.cooldowns.W > Date.now()) return;
    this.cooldowns.W = Date.now() + this.maxCooldowns.W;
    this.playerMp = Math.min(this.playerMaxMp, this.playerMp + 240);
    this.update3DHud();
    this.log('💧 [POÇÃO DE MANA] Recuperou +240 MP!', 'info');
  }

  castSkill(slotKey, skillId) {
    if (this.cooldowns[slotKey] > Date.now()) return;
    const mpCost = slotKey === 'E' ? 35 : 55;
    if (this.playerMp < mpCost) {
      this.log('⚠️ [MANA INSUFICIENTE] Não é possível conjurar a habilidade!', 'warning');
      return;
    }
    this.playerMp -= mpCost;
    this.cooldowns[slotKey] = Date.now() + this.maxCooldowns[slotKey];
    this.update3DHud();

    if (this.arena3D) {
      this.arena3D.triggerSkill(skillId);
    }

    if (!this.selectedTargetId) {
      const firstMob = Array.from(this.monsters.values()).find((m) => !m.isDead);
      if (firstMob) {
        this.selectedTargetId = firstMob.id;
        this.updateTargetHud(firstMob);
      }
    }

    if (this.selectedTargetId) {
      this.sendPacket(OPCODES.COMBAT_ATTACK_REQ, {
        targetMobId: this.selectedTargetId,
        skillId: skillId,
        playerX: this.playerX,
        playerY: this.playerY,
      });
    }
  }

  performDodge() {
    if (this.cooldowns.SPACE > Date.now()) return;
    if (this.playerSta < 30) {
      this.log('⚠️ [ESTAMINA ESGOTADA] Falha ao esquivar!', 'warning');
      return;
    }
    this.playerSta -= 30;
    this.cooldowns.SPACE = Date.now() + this.maxCooldowns.SPACE;
    this.update3DHud();
    this.log('💨 [ESQUIVA TÁTICA] Rolamento com quadros de invulnerabilidade (I-Frames)!', 'info');

    if (this.arena3D) {
      this.arena3D.triggerSkill('roll');
    }

    // Desloca o jogador levemente para frente
    this.playerX += 45;
    this.playerTargetX = this.playerX;
  }

  triggerPickup() {
    for (const drop of this.groundDrops.values()) {
      const dist = Math.hypot(drop.x - this.playerX, drop.y - this.playerY);
      if (dist <= 250) {
        this.sendPacket(OPCODES.GROUND_ITEM_PICKUP_REQ, {
          dropId: drop.dropId,
          playerX: this.playerX,
          playerY: this.playerY,
        });
      }
    }
  }

  // ==========================================================================
  // MÉTODOS DE GAMEPLAY DE AÇÃO: LEVEL UP, TELETRANSPORTE E CHAOS MACHINE
  // ==========================================================================

  simulateLevelUp() {
    const nextLvl = (this.character ? this.character.level : 250) + 1;
    if (this.character) {
      this.character.level = nextLvl;
      this.character.statPoints = (this.character.statPoints ?? 0) + 5;
    }
    this.playerMaxHp = 1000 + nextLvl * 25 + (this.character ? this.character.vitality * 2 : 0);
    this.playerHp = this.playerMaxHp;
    this.playerMaxMp = 450 + nextLvl * 18 + (this.character ? this.character.energy * 2 : 0);
    this.playerMp = this.playerMaxMp;

    this.updateCharacterUI(this.character);
    this.update3DHud();
    this.triggerLevelUpCelebration(nextLvl);
    this.log(`🌟 [LEVEL UP] Nível ${nextLvl}! Você recebeu +5 Pontos Livres de Atributos para distribuir!`, 'success');
  }

  triggerLevelUpCelebration(level) {
    // 1. Efeito 3D da Auréola Dourada e Coluna de Luz Solar
    if (this.arena3D) {
      this.arena3D.triggerLevelUpVFX(level);
    } else {
      this.harmonicAudio.playLevelUpSound();
    }

    // 2. Banner Celebratório Visual no HUD
    if (this.domLevelUpBanner) {
      if (this.domLevelUpSub) {
        this.domLevelUpSub.textContent = `Nível ${level} Alcançado! Auréola Solar & Vitais Elevados!`;
      }
      this.domLevelUpBanner.classList.add('show-banner');
      clearTimeout(this._lvlTimer);
      this._lvlTimer = setTimeout(() => {
        this.domLevelUpBanner.classList.remove('show-banner');
      }, 2800);
    }

    this.log(`🌟👑 [LEVEL UP!] Parabéns! Você ascendeu ao Nível ${level}! Auréola dourada e bênção solar ativadas!`, 'success');
  }

  teleportMap(mapId) {
    if (this.currentMap === mapId) return;
    this.currentMap = mapId;

    if (this.arena3D) {
      this.arena3D.switchMap(mapId);
    } else {
      this.harmonicAudio.playPortalWarpSound(mapId);
      this.triggerWarpFlash(mapId, mapId);
    }
    this.updateMapButtonsUI(mapId);
  }

  updateMapButtonsUI(mapId) {
    const biomeMap = {
      LOR: 'LORENCIA', NOR: 'NORIA', DEV: 'DEVIAS', DNG: 'DUNGEON',
      LT: 'LOST_TOWER', ATL: 'ATLANS', TAR: 'TARKAN', ICA: 'ICARUS',
      VOL: 'VALLEY_OF_LOREN', EVT: 'BLOOD_CASTLE'
    };
    const prefix = (mapId || '').split('_')[0].toUpperCase();
    const activeBiome = biomeMap[prefix] || (mapId || '').toUpperCase();

    ['lorencia', 'noria', 'devias', 'dungeon', 'lost_tower', 'atlans', 'tarkan', 'icarus'].forEach((mKey) => {
      const btn = document.getElementById(`btn-teleport-${mKey}`);
      if (btn) {
        btn.classList.toggle('active-map', mKey.toUpperCase() === activeBiome);
      }
    });

    document.querySelectorAll('.btn-vp-biome').forEach((btn) => {
      const id = btn.getAttribute('data-id');
      const isSel = id === activeBiome;
      btn.style.border = isSel ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)';
      btn.style.color = isSel ? '#38bdf8' : '#94a3b8';
    });

    const selectScenario47 = document.getElementById('select-scenario-47');
    if (selectScenario47) {
      if (Array.from(selectScenario47.options).some(o => o.value === mapId)) {
        selectScenario47.value = mapId;
      }
    }

    if (this.domMapBadge) {
      const biomeLabels = {
        LORENCIA: 'PLANÍCIES DE LORENCIA',
        NORIA: 'SANTUÁRIO DE NORIA (FEYWOOD)',
        DEVIAS: 'FORTALEZA BOREAL DE DEVIAS',
        DUNGEON: 'CATACUMBAS ABISSAIS DE DUNGEON',
        LOST_TOWER: 'TORRE PERDIDA DE BALROG',
        ATLANS: 'REINO SUBMARINO DE ATLANS',
        TARKAN: 'DESERTO CARMESIM DE TARKAN',
        ICARUS: 'ARQUIPÉLAGO CELESTE DE ICARUS',
        VALLEY_OF_LOREN: 'VALE DE LOREN — CERCO AO CASTELO',
        BLOOD_CASTLE: 'BLOOD CASTLE — PONTE DO MARTÍRIO',
        DEVIL_SQUARE: 'DEVIL SQUARE — PRAÇA PENTAGRAMAL',
        CHAOS_CASTLE: 'CHAOS CASTLE — COLISEU SUSPENSO',
        DUEL_COLISEUM: 'COLISEU DE DUELOS — ARENA DA GLÓRIA'
      };
      this.domMapBadge.textContent = biomeLabels[activeBiome] || activeBiome;
    }
  }

  triggerWarpFlash(mapId, mapName) {
    if (this.domWarpOverlay) {
      this.domWarpOverlay.classList.add('active-warp');
      setTimeout(() => {
        this.domWarpOverlay.classList.remove('active-warp');
      }, 420);
    }
    this.updateMapButtonsUI(mapId);
  }

  triggerChaosForge() {
    this.log('⚙️⚡ [MÁQUINA DO CAOS] Forja ativada! Engrenagens em rotação acelerada, confinamento de plasma e raio de fusão solar!', 'warning');

    if (this.viewer3DInstance) {
      this.viewer3DInstance.selectEntity('CHAOS_MACHINE');
      this.viewer3DInstance.triggerChaosForge(true, (success) => {
        this.log(success ? '✨💎 [FORJA BEM-SUCEDIDA] Item Lendário forjado com sucesso!' : '💥 [FALHA NA FUSÃO] A fusão entrou em colapso!', success ? 'success' : 'danger');
      });
    } else {
      this.harmonicAudio.playChaosPhaseSound('ignition');
      setTimeout(() => this.harmonicAudio.playChaosPhaseSound('surge'), 1400);
      setTimeout(() => this.harmonicAudio.playChaosPhaseSound('laser'), 3000);
      setTimeout(() => {
        this.harmonicAudio.playChaosPhaseSound('success');
        this.log('✨💎 [FORJA BEM-SUCEDIDA] Item do Caos forjado com poder celestial!', 'success');
      }, 4200);
    }
  }

  // ==========================================================================
  // RECOMPENSAS DE CAÇA AFK OFFLINE (IDLE PROGRESSION)
  // ==========================================================================
  updateAfkModalSimulation(hours) {
    if (!this.idleEngine) return;
    const rewards = this.idleEngine.simulateOfflineHunting(hours, this.currentMap || 'LORENCIA');
    this.pendingAfkRewards = rewards;

    const elMobs = document.getElementById('afk-modal-mobs');
    const elZen = document.getElementById('afk-modal-zen');
    const elXp = document.getElementById('afk-modal-xp');
    const elBless = document.getElementById('afk-jewel-bless');
    const elSoul = document.getElementById('afk-jewel-soul');
    const elChaos = document.getElementById('afk-jewel-chaos');
    const elLife = document.getElementById('afk-jewel-life');

    if (elMobs) elMobs.textContent = rewards.monstersKilled.toLocaleString();
    if (elZen) elZen.textContent = `${rewards.zenCollected.toLocaleString()} Zen`;
    if (elXp) elXp.textContent = `+${rewards.xpGained.toLocaleString()} XP`;
    if (elBless) elBless.textContent = rewards.jewels.bless;
    if (elSoul) elSoul.textContent = rewards.jewels.soul;
    if (elChaos) elChaos.textContent = rewards.jewels.chaos;
    if (elLife) elLife.textContent = rewards.jewels.life;
  }

  claimAfkOfflineRewards() {
    if (!this.pendingAfkRewards) return;
    const rew = this.pendingAfkRewards;

    if (this.character) {
      this.character.zen = (this.character.zen || 0) + rew.zenCollected;
    }

    if (this.idleEngine) {
      this.idleEngine.metrics.monstersKilled += rew.monstersKilled;
      this.idleEngine.metrics.zenCollected += rew.zenCollected;
      const totalJewels = rew.jewels.bless + rew.jewels.soul + rew.jewels.chaos + rew.jewels.life;
      this.idleEngine.metrics.jewelsCollected += totalJewels;
    }

    if (rew.jewels.bless > 0) {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { defId: 'jewel_bless', level: 0 });
    }
    if (rew.jewels.soul > 0) {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { defId: 'jewel_soul', level: 0 });
    }
    if (rew.jewels.chaos > 0) {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { defId: 'jewel_chaos', level: 0 });
    }
    if (rew.jewels.life > 0) {
      this.sendPacket(OPCODES.ITEM_SPAWN_DEV_REQ, { defId: 'jewel_life', level: 0 });
    }

    sfx.playPickupSound();
    this.harmonicAudio.playLevelUpSound();

    this.log(`🌟🎁 [RECOMPENSAS AFK RESGATADAS] +${rew.zenCollected.toLocaleString()} Zen, +${rew.xpGained.toLocaleString()} XP e Joias adicionadas à bolsa!`, 'success');
  }

  // ==========================================================================
  // FORJA DA MÁQUINA DO CAOS (INTERACTIVE CHAOS MACHINE)
  // ==========================================================================
  updateChaosRecipeTab(recipeKey) {
    this.activeChaosRecipe = recipeKey;
    const titleEl = document.getElementById('chaos-recipe-title');
    const descEl = document.getElementById('chaos-recipe-desc');
    const rateEl = document.getElementById('chaos-success-rate');
    const costEl = document.getElementById('chaos-zen-cost');
    const fillEl = document.getElementById('chaos-progress-fill');

    if (recipeKey === 'CHAOS_WEAPON') {
      if (titleEl) titleEl.textContent = 'Forja de Armas do Caos';
      if (descEl) descEl.textContent = 'Combina um item de equipamento +4 ou superior com opções adicionais, 1x Jewel of Chaos e Zen para sintetizar uma poderosa arma mística do Caos (Chaos Dragon Axe, Nature Bow ou Lightning Staff).';
      if (rateEl) rateEl.textContent = '75%';
      if (costEl) costEl.textContent = '100.000 Zen';
      if (fillEl) fillEl.style.width = '75%';
    } else if (recipeKey === 'FIRST_WING') {
      if (titleEl) titleEl.textContent = 'Síntese de Asas Nível 1';
      if (descEl) descEl.textContent = 'Combina uma Arma do Caos +4 ou superior com opções adicionais, 1x Jewel of Chaos e Zen para criar as lendárias Asas de Dragão, Asas Espirituais ou Asas Élficas com absorção de dano e velocidade.';
      if (rateEl) rateEl.textContent = '60%';
      if (costEl) costEl.textContent = '250.000 Zen';
      if (fillEl) fillEl.style.width = '60%';
    } else if (recipeKey === 'ITEM_UPGRADE') {
      if (titleEl) titleEl.textContent = 'Refinamento Alquímico (+10 a +15)';
      if (descEl) descEl.textContent = 'Eleva equipamentos do nível +9 até +15 consumindo Jewel of Bless, Jewel of Soul, Jewel of Chaos e Zen sagrado. O item ganha coroas luminosas e auras gloriosas.';
      if (rateEl) rateEl.textContent = '50%';
      if (costEl) costEl.textContent = '500.000 Zen';
      if (fillEl) fillEl.style.width = '50%';
    }
  }

  executeChaosMachineMix() {
    const mixType = this.activeChaosRecipe || 'CHAOS_WEAPON';
    this.triggerChaosForge();

    const itemUuids = [];
    if (this.inventoryState && this.inventoryState.gridItems) {
      const chaosJewel = this.inventoryState.gridItems.find((i) => i.defId === 'jewel_chaos');
      if (chaosJewel) itemUuids.push(chaosJewel.uuid);

      const blessJewel = this.inventoryState.gridItems.find((i) => i.defId === 'jewel_bless');
      if (blessJewel) itemUuids.push(blessJewel.uuid);

      const equipItem = this.inventoryState.gridItems.find((i) => i.defId.includes('sword') || i.defId.includes('armor') || i.defId.includes('dragon'));
      if (equipItem) itemUuids.push(equipItem.uuid);
    }

    this.sendPacket(OPCODES.CHAOS_MACHINE_MIX_REQ, {
      mixType: mixType,
      itemUuids: itemUuids,
    });
  }

  // ==========================================================================
  // LOJA DE COMERCIANTES (NPC MERCHANTS: HAN, PUPA & LUMEN)
  // ==========================================================================
  renderNpcShopCatalog(shopId) {
    this.activeShopId = shopId;
    const container = document.getElementById('shop-catalog-container');
    if (!container) return;

    container.innerHTML = '';
    const zenEl = document.getElementById('shop-player-zen');
    if (zenEl && this.character) {
      zenEl.textContent = `${(this.character.zen || 1250000).toLocaleString()} Zen`;
    }

    const catalogs = {
      han_blacksmith: [
        { itemDefId: 'small_dagger', name: 'Small Dagger', icon: '🗡️', priceZen: 500 },
        { itemDefId: 'short_sword', name: 'Short Sword (+Skill)', icon: '⚔️', priceZen: 1500 },
        { itemDefId: 'short_bow', name: 'Short Bow (+Skill)', icon: '🏹', priceZen: 1200 },
        { itemDefId: 'elven_bow', name: 'Elven Bow (+Skill)', icon: '🏹', priceZen: 3500 },
        { itemDefId: 'great_reign_crossbow', name: 'Great Reign Crossbow', icon: '🎯', priceZen: 28000 },
        { itemDefId: 'skull_staff', name: 'Skull Staff', icon: '🔮', priceZen: 4000 },
        { itemDefId: 'arrows', name: 'Arrows (Flechas Élficas)', icon: '🏹', priceZen: 300 },
        { itemDefId: 'bolts', name: 'Bolts (Virotes de Besta)', icon: '🎯', priceZen: 400 },
        { itemDefId: 'dragon_gloves', name: 'Dragon Gloves', icon: '🧤', priceZen: 20000 },
        { itemDefId: 'dragon_boots', name: 'Dragon Boots', icon: '👢', priceZen: 25000 },
      ],
      pupa_potion_girl: [
        { itemDefId: 'potion_health_small', name: 'Health Potion (Pequena)', icon: '🧪', priceZen: 80 },
        { itemDefId: 'potion_health_medium', name: 'Health Potion (Média)', icon: '🧪', priceZen: 150 },
        { itemDefId: 'potion_health', name: 'Health Potion (Grande)', icon: '🧪', priceZen: 250 },
        { itemDefId: 'potion_mana_small', name: 'Mana Potion (Pequena)', icon: '💧', priceZen: 100 },
        { itemDefId: 'potion_mana_medium', name: 'Mana Potion (Média)', icon: '💧', priceZen: 200 },
        { itemDefId: 'potion_mana', name: 'Mana Potion (Grande)', icon: '💧', priceZen: 350 },
      ],
      lumen_barmaid: [
        { itemDefId: 'potion_health_small', name: 'Health Potion (Pequena)', icon: '🧪', priceZen: 80 },
        { itemDefId: 'potion_health_medium', name: 'Health Potion (Média)', icon: '🧪', priceZen: 150 },
        { itemDefId: 'potion_health', name: 'Health Potion (Grande)', icon: '🧪', priceZen: 250 },
        { itemDefId: 'potion_mana_small', name: 'Mana Potion (Pequena)', icon: '💧', priceZen: 100 },
        { itemDefId: 'potion_mana_medium', name: 'Mana Potion (Média)', icon: '💧', priceZen: 200 },
        { itemDefId: 'potion_mana', name: 'Mana Potion (Grande)', icon: '💧', priceZen: 350 },
        { itemDefId: 'town_portal_scroll', name: 'Pergaminho de Retorno', icon: '📜', priceZen: 1200 },
        { itemDefId: 'ale_beer', name: 'Cerveja de Lorencia', icon: '🍺', priceZen: 800 },
      ],
    };

    const items = catalogs[shopId] || catalogs.han_blacksmith;
    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'shop-item-card';
      card.innerHTML = `
        <div class="shop-item-info">
          <div class="shop-item-icon">${item.icon}</div>
          <div class="shop-item-texts">
            <span class="shop-item-name">${item.name}</span>
            <span class="shop-item-price">${item.priceZen.toLocaleString()} Zen</span>
          </div>
        </div>
        <button class="btn-buy-item" data-defid="${item.itemDefId}">Comprar</button>
      `;

      card.querySelector('.btn-buy-item').addEventListener('click', () => {
        this.sendPacket(OPCODES.NPC_SHOP_BUY_REQ, {
          npcId: shopId,
          itemDefId: item.itemDefId,
        });
      });

      container.appendChild(card);
    });
  }

  renderNpcShopSellCatalog() {
    const container = document.getElementById('shop-catalog-container');
    if (!container) return;

    container.innerHTML = '';
    const zenEl = document.getElementById('shop-player-zen');
    if (zenEl && this.character) {
      zenEl.textContent = `${(this.character.zen || 1250000).toLocaleString()} Zen`;
    }

    const items = this.inventoryState?.gridItems || [];
    if (items.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 28px; color: #94a3b8; font-style: italic; background: rgba(0,0,0,0.25); border-radius: 8px;">
          🎒 Sua bolsa de inventário está vazia.<br>Derrote monstros ou compre itens para negociar com os mercadores imperiais!
        </div>
      `;
      return;
    }

    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'shop-item-card';
      const icon = item.icon || (item.defId.includes('sword') || item.defId.includes('blade') ? '⚔️' : item.defId.includes('bow') ? '🏹' : item.defId.includes('potion') ? '🧪' : item.defId.includes('jewel') ? '💎' : '🛡️');
      const sellPrice = item.sellPrice || (item.defId.includes('jewel') ? 4500000 : 800 + (item.level || 0) * 400);

      card.innerHTML = `
        <div class="shop-item-info">
          <div class="shop-item-icon">${icon}</div>
          <div class="shop-item-texts">
            <span class="shop-item-name">${item.name || item.defId} ${item.level ? '+' + item.level : ''}</span>
            <span class="shop-item-price" style="color: #34d399;">+${sellPrice.toLocaleString()} Zen</span>
          </div>
        </div>
        <button class="btn-buy-item" style="background: linear-gradient(135deg, #059669, #10b981);" data-uuid="${item.uuid}">Vender</button>
      `;

      card.querySelector('button').addEventListener('click', () => {
        this.sendPacket(OPCODES.NPC_SHOP_SELL_REQ, {
          itemUuid: item.uuid,
        });
        setTimeout(() => this.renderNpcShopSellCatalog(), 300);
      });

      container.appendChild(card);
    });
  }

  handleShortcut(code, e) {
    if (code === 'KeyQ' || (code === 'Digit1' && (this.viewMode === 'combat' || this.viewMode === 'split'))) {
      this.useHealthPotion();
    } else if (code === 'KeyW') {
      this.useManaPotion();
    } else if (code === 'KeyE' || (code === 'Digit2' && (this.viewMode === 'combat' || this.viewMode === 'split'))) {
      const cls = this.character?.characterClass;
      const isDw = cls === 'DW' || cls === 'SOUL_MASTER';
      const isElf = cls === 'ELF' || cls === 'FAIRY_ELF' || cls === 'MUSE_ELF';
      const skill = isDw ? 'fireball' : isElf ? 'triple_shot' : 'cyclone';
      this.castSkill('E', skill);
    } else if (code === 'KeyR' || (code === 'Digit3' && (this.viewMode === 'combat' || this.viewMode === 'split'))) {
      const cls = this.character?.characterClass;
      const isDw = cls === 'DW' || cls === 'SOUL_MASTER';
      const isElf = cls === 'ELF' || cls === 'FAIRY_ELF' || cls === 'MUSE_ELF';
      const skill = isDw ? 'evil_spirits' : isElf ? 'penetration' : 'death_stab';
      this.castSkill('R', skill);
    } else if (code === 'Space') {
      if (e) e.preventDefault();
      this.performDodge();
    } else if (code === 'KeyF') {
      this.triggerPickup();
    } else if (code === 'KeyL') {
      this.simulateLevelUp();
    } else if (code === 'KeyC') {
      this.triggerChaosForge();
    } else if (code === 'Digit1') {
      this.teleportMap('LORENCIA');
    } else if (code === 'Digit2') {
      this.teleportMap('NORIA');
    } else if (code === 'Digit3') {
      this.teleportMap('DEVIAS');
    } else if (code === 'Digit4') {
      this.teleportMap('DUNGEON');
    } else if (code === 'Digit5') {
      this.teleportMap('LOST_TOWER');
    } else if (code === 'Digit6') {
      this.teleportMap('ATLANS');
    } else if (code === 'Digit7') {
      this.teleportMap('TARKAN');
    } else if (code === 'Digit8') {
      this.teleportMap('ICARUS');
    }
  }

  update3DHud() {
    if (this.domHealthFluid) {
      const hpPct = Math.round((this.playerHp / this.playerMaxHp) * 100);
      this.domHealthFluid.style.height = `${hpPct}%`;
      if (this.domHealthVal) this.domHealthVal.textContent = `${this.playerHp} / ${this.playerMaxHp}`;
    }
    if (this.domManaFluid) {
      const mpPct = Math.round((this.playerMp / this.playerMaxMp) * 100);
      this.domManaFluid.style.height = `${mpPct}%`;
      if (this.domManaVal) this.domManaVal.textContent = `${this.playerMp} / ${this.playerMaxMp}`;
    }
    if (this.domSdFill) {
      const sdPct = Math.round((this.playerSd / this.playerMaxSd) * 100);
      this.domSdFill.style.width = `${sdPct}%`;
    }
    if (this.domStaFill) {
      const staPct = Math.round((this.playerSta / this.playerMaxSta) * 100);
      this.domStaFill.style.width = `${staPct}%`;
    }
  }

  startHudVitalsLoop() {
    setInterval(() => {
      // Regenera estamina lentamente
      if (this.playerSta < this.playerMaxSta) {
        this.playerSta = Math.min(this.playerMaxSta, this.playerSta + 3);
        if (this.domStaFill) {
          const staPct = Math.round((this.playerSta / this.playerMaxSta) * 100);
          this.domStaFill.style.width = `${staPct}%`;
        }
      }

      // Executa ciclo do Motor de Combate 100% Idle e atualiza telemetria AFK
      this.updateIdleCombat(0.05);

      // Atualiza overlays de cooldown legados se presentes
      const now = Date.now();
      ['Q', 'W', 'E', 'R', 'SPACE'].forEach((key) => {
        const cdOverlay = document.getElementById(`cd-${key}`);
        if (cdOverlay) {
          const remaining = this.cooldowns[key] - now;
          if (remaining > 0) {
            const pct = (remaining / this.maxCooldowns[key]) * 100;
            cdOverlay.style.height = `${pct}%`;
          } else {
            cdOverlay.style.height = '0%';
          }
        }
      });
    }, 50);
  }

  // ==========================================================================
  // MOTOR DE COMBATE 100% IDLE & ROTAÇÃO AUTÔNOMA DE HABILIDADES
  // ==========================================================================
  updateIdleCombat(deltaTime) {
    if (!this.idleEngine) return;

    const now = Date.now();

    // 1. Atualiza Status e Cooldowns Visuais dos Slots da Rotação
    const cdCyclone = document.getElementById('idle-cd-cyclone');
    const statusCyclone = document.getElementById('idle-status-cyclone');
    const skillCyclone = this.idleEngine.skills.find((s) => s.id === 'cyclone');
    if (skillCyclone) {
      const remaining = Math.max(0, (skillCyclone.lastUsedMs + skillCyclone.cooldownMs) - now);
      if (cdCyclone) {
        const pct = (remaining / skillCyclone.cooldownMs) * 100;
        cdCyclone.style.height = `${pct}%`;
      }
      if (statusCyclone) {
        if (remaining > 0) {
          statusCyclone.textContent = `${(remaining / 1000).toFixed(1)}s`;
          statusCyclone.className = 'idle-skill-status on-cooldown';
        } else {
          statusCyclone.textContent = 'PRONTO';
          statusCyclone.className = 'idle-skill-status';
        }
      }
    }

    const cdDeathStab = document.getElementById('idle-cd-deathstab');
    const statusDeathStab = document.getElementById('idle-status-deathstab');
    const skillDeathStab = this.idleEngine.skills.find((s) => s.id === 'death_stab');
    if (skillDeathStab) {
      const remaining = Math.max(0, (skillDeathStab.lastUsedMs + skillDeathStab.cooldownMs) - now);
      if (cdDeathStab) {
        const pct = (remaining / skillDeathStab.cooldownMs) * 100;
        cdDeathStab.style.height = `${pct}%`;
      }
      if (statusDeathStab) {
        if (remaining > 0) {
          statusDeathStab.textContent = `${(remaining / 1000).toFixed(1)}s`;
          statusDeathStab.className = 'idle-skill-status on-cooldown';
        } else {
          statusDeathStab.textContent = 'PRONTO';
          statusDeathStab.className = 'idle-skill-status';
        }
      }
    }

    const cdHp = document.getElementById('idle-cd-hp');
    const remainingHpPotion = Math.max(0, (this.idleEngine.lastPotionHpMs + this.idleEngine.config.potionCooldownSec * 1000) - now);
    if (cdHp) {
      cdHp.style.height = `${(remainingHpPotion / (this.idleEngine.config.potionCooldownSec * 1000)) * 100}%`;
    }

    const cdMp = document.getElementById('idle-cd-mp');
    const remainingMpPotion = Math.max(0, (this.idleEngine.lastPotionMpMs + this.idleEngine.config.potionCooldownSec * 1000) - now);
    if (cdMp) {
      cdMp.style.height = `${(remainingMpPotion / (this.idleEngine.config.potionCooldownSec * 1000)) * 100}%`;
    }

    // 2. Telemetria AFK (Uptime, Kills, Zen, Joias, DPS)
    if (this.domAfkUptime) {
      const s = this.idleEngine.metrics.uptimeSec;
      const hrs = String(Math.floor(s / 3600)).padStart(2, '0');
      const mins = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const secs = String(s % 60).padStart(2, '0');
      this.domAfkUptime.textContent = `${hrs}:${mins}:${secs}`;
    }
    if (this.domAfkKills) this.domAfkKills.textContent = this.idleEngine.metrics.monstersKilled.toLocaleString();
    if (this.domAfkZen) this.domAfkZen.textContent = this.idleEngine.metrics.zenCollected.toLocaleString();
    if (this.domAfkJewels) this.domAfkJewels.textContent = this.idleEngine.metrics.jewelsCollected.toLocaleString();
    if (this.domAfkDps) this.domAfkDps.textContent = this.idleEngine.metrics.dps.toLocaleString();

    if (!this.idleEngine.isEnabled()) {
      if (this.domIdleAction) this.domIdleAction.textContent = 'Auto-Hunt Pausado';
      return;
    }

    // 3. Monta o estado atual para o motor autônomo
    const monstersList = Array.from(this.monsters.values()).map((m) => ({
      id: m.id,
      x: m.x,
      y: m.y,
      isDead: m.isDead,
      name: m.name,
    }));

    const dropsList = Array.from(this.groundDrops.values()).map((d) => ({
      dropId: d.dropId,
      x: d.x,
      y: d.y,
      isJewel: d.isJewel,
      zen: d.zen,
    }));

    const actions = {
      movePlayer: (targetX, targetY) => {
        this.playerTargetX = Math.round(targetX);
        this.playerTargetY = Math.round(targetY);
        if (this.arena3D) {
          const p3d = this.arena3D.to3DCoords(targetX, targetY);
          this.arena3D.playerTargetPos.set(p3d.x, 0, p3d.z);
        }
      },
      attackMonster: (mobId, skillId) => {
        this.selectedTargetId = mobId;
        const mob = this.monsters.get(mobId);
        if (mob) this.updateTargetHud(mob);

        if (skillId) {
          if (this.arena3D) {
            this.arena3D.triggerSkill(skillId);
          }
          this.sendPacket(OPCODES.COMBAT_ATTACK_REQ, {
            targetMobId: mobId,
            skillId: skillId,
            playerX: this.playerX,
            playerY: this.playerY,
          });
        } else {
          if (this.arena3D) {
            this.arena3D.triggerSkill('strike');
          }
          this.sendPacket(OPCODES.COMBAT_ATTACK_REQ, {
            targetMobId: mobId,
            playerX: this.playerX,
            playerY: this.playerY,
          });
        }
      },
      pickupDrop: (dropId) => {
        this.sendPacket(OPCODES.GROUND_ITEM_PICKUP_REQ, {
          dropId: dropId,
          playerX: this.playerX,
          playerY: this.playerY,
        });
      },
      useHealthPotion: () => {
        this.useHealthPotion();
      },
      useManaPotion: () => {
        this.useManaPotion();
      },
    };

    const decision = this.idleEngine.update(deltaTime, {
      playerX: this.playerX,
      playerY: this.playerY,
      playerHp: this.playerHp,
      playerMaxHp: this.playerMaxHp,
      playerMp: this.playerMp,
      playerMaxMp: this.playerMaxMp,
      monsters: monstersList,
      groundDrops: dropsList,
    }, actions);

    if (this.domIdleAction) {
      this.domIdleAction.textContent = decision.action;
    }
  }

  highlightGridTarget(targetX, targetY) {
    this.clearGridHighlights();
    const w = this.draggedItem ? (this.definitions[this.draggedItem.defId]?.width || 1) : 1;
    const h = this.draggedItem ? (this.definitions[this.draggedItem.defId]?.height || 1) : 1;

    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const x = targetX + dx;
        const y = targetY + dy;
        if (x < 8 && y < 8) {
          const cell = this.domGrid.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`);
          if (cell) cell.classList.add('highlight-valid');
        }
      }
    }
  }

  clearGridHighlights() {
    const cells = this.domGrid.querySelectorAll('.grid-cell');
    cells.forEach((c) => {
      c.classList.remove('highlight-valid', 'highlight-invalid');
    });
  }

  // ==========================================================================
  // RESULTADO DO REFINAMENTO DE JOIAS (ÁUDIO & FLASH)
  // ==========================================================================
  handleJewelResult(payload) {
    const { success, outcome, message, newLevel, targetUuid, inventoryState } = payload;

    if (success) {
      sfx.playSuccessSound();
      this.log(`✨ [FORJA DIVINA] ${message}`, 'success');
    } else {
      sfx.playFailureSound();
      this.log(`💥 [FALHA NA FORJA] ${message}`, 'danger');
    }

    // Atualiza estado do inventário
    if (inventoryState) {
      this.inventoryState = inventoryState;
      this.renderFullInventory();
    }

    // Aplica animação de flash no item alvo
    const targetEl = document.querySelector(`.item-view[data-uuid="${targetUuid}"]`);
    if (targetEl) {
      targetEl.classList.remove('flash-success-anim', 'flash-fail-anim');
      void targetEl.offsetWidth; // Força reflow
      targetEl.classList.add(success ? 'flash-success-anim' : 'flash-fail-anim');
    }
  }

  // ==========================================================================
  // INSPEÇÃO DETALHADA DO ITEM
  // ==========================================================================
  inspectItem(item) {
    this.inspectedItem = item;
    const def = this.definitions[item.defId] || { name: item.defId, category: 'ITEM' };
    const isExcl = (item.excellentMask || 0) > 0;

    this.domSlider.value = item.level;
    this.previewOverrideLevel = item.level;
    this.domSliderVal.textContent = `+${item.level}`;
    this.updateGlowBadge(item.level);

    let statsHtml = `
      <div class="card-stat-row"><span class="stat-key">Categoria:</span> <span class="stat-val">${def.category}</span></div>
      <div class="card-stat-row"><span class="stat-key">Dimensões:</span> <span class="stat-val">${def.width}x${def.height}</span></div>
      <div class="card-stat-row"><span class="stat-key">Durabilidade:</span> <span class="stat-val">${item.durability} / ${item.maxDurability}</span></div>
    `;

    if (def.minDamage && def.maxDamage) {
      const dmgBonus = item.level * 3;
      statsHtml += `
        <div class="card-stat-row">
          <span class="stat-key">Dano de Ataque:</span>
          <span class="stat-val">${def.minDamage + dmgBonus} ~ ${def.maxDamage + dmgBonus}</span>
        </div>
      `;
    }

    if (def.defense) {
      const defBonus = item.level * 2;
      statsHtml += `
        <div class="card-stat-row">
          <span class="stat-key">Defesa:</span>
          <span class="stat-val">${def.defense + defBonus}</span>
        </div>
      `;
    }

    if (def.requirements) {
      const req = def.requirements;
      statsHtml += `
        <div class="card-stat-row">
          <span class="stat-key">Requisitos:</span>
          <span class="stat-val">FOR ${req.strength || 0} / AGI ${req.agility || 0}</span>
        </div>
      `;
    }

    let extraHtml = '';
    if (item.skill) {
      extraHtml += `<div class="card-stat-row"><span class="stat-key">Habilidade:</span> <span class="stat-val" style="color:#60a5fa">Possui Skill de Arma</span></div>`;
    }
    if (item.luck) {
      extraHtml += `<div class="card-stat-row"><span class="stat-key">Sorte (Luck):</span> <span class="stat-val" style="color:#34d399">Taxa de Crítico +25%, Refino +5%</span></div>`;
    }
    if (item.optionLevel > 0) {
      extraHtml += `<div class="card-stat-row"><span class="stat-key">Opção da Vida:</span> <span class="stat-val" style="color:#facc15">+${item.optionLevel} Adicional</span></div>`;
    }

    let exclHtml = '';
    if (isExcl) {
      exclHtml = `
        <div class="excl-options-box">
          <div class="excl-option-row">✨ Item Excelente de Continente Lendário</div>
          <div class="excl-option-row">⚡ Dano Aumentado +2% & Taxa Excelente +10%</div>
        </div>
      `;
    }

    this.domCard.innerHTML = `
      <div class="card-title ${isExcl ? 'excellent-name' : ''}">${def.name} +${item.level}</div>
      <div class="card-subtitle">${isExcl ? 'Excelente ' : ''}${def.name}</div>
      <div class="card-stats-list">
        ${statsHtml}
        ${extraHtml}
        ${exclHtml}
      </div>
    `;
  }

  updateGlowBadge(level) {
    if (level <= 6) {
      this.domGlowBadge.textContent = `+${level} PBR PADRÃO`;
      this.domGlowBadge.style.borderColor = '#64748b';
      this.domGlowBadge.style.color = '#cbd5e1';
    } else if (level <= 8) {
      this.domGlowBadge.textContent = `+${level} RUNIC CYAN PULSE`;
      this.domGlowBadge.style.borderColor = '#38bdf8';
      this.domGlowBadge.style.color = '#38bdf8';
    } else if (level <= 10) {
      this.domGlowBadge.textContent = `+${level} SHIMMERING GOLD AURA`;
      this.domGlowBadge.style.borderColor = '#fbbf24';
      this.domGlowBadge.style.color = '#fbbf24';
    } else if (level <= 12) {
      this.domGlowBadge.textContent = `+${level} CHROMATIC ARCS & FIRE`;
      this.domGlowBadge.style.borderColor = '#f97316';
      this.domGlowBadge.style.color = '#f97316';
    } else {
      this.domGlowBadge.textContent = `+${level} GODLIKE CELESTIAL CORONA`;
      this.domGlowBadge.style.borderColor = '#e879f9';
      this.domGlowBadge.style.color = '#e879f9';
    }
  }

  // ==========================================================================
  // MOTOR DE SHADER GLOW DINÂMICO NO CANVAS (+0 ATÉ +15)
  // ==========================================================================
  initCanvasShaderEngine() {
    let t = 0;
    this.meshRotY = 0;
    this.meshRotX = 0;
    this.isDraggingMesh = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    this.canvas?.addEventListener('mousedown', (e) => {
      this.isDraggingMesh = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingMesh) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      this.meshRotY += dx * 0.025;
      this.meshRotX += dy * 0.025;
      this.meshRotX = Math.max(-0.8, Math.min(0.8, this.meshRotX));
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      if (this.isDraggingMesh) {
        this.isDraggingMesh = false;
        this.canvas.style.cursor = 'grab';
      }
    });

    const renderLoop = () => {
      t += 0.035;
      if (!this.isDraggingMesh) {
        this.meshRotY += 0.015;
      }
      const w = this.canvas.width;
      const h = this.canvas.height;
      const ctx = this.ctx;

      ctx.clearRect(0, 0, w, h);

      // Fundo escuro com gradiente radial
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 140);
      bgGrad.addColorStop(0, '#10141e');
      bgGrad.addColorStop(1, '#050608');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const lvl = this.previewOverrideLevel;
      const centerX = w / 2;
      const centerY = h / 2;

      // 1. TIER +13 a +15: Corona Volumétrica e Ondas de Calor
      if (lvl >= 13) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 5; i++) {
          const radius = 60 + Math.sin(t * 3 + i) * 12 + (lvl - 12) * 10;
          const auraGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
          auraGrad.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
          auraGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.25)');
          auraGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. TIER +9 a +12: Aura Shimmer & Arcos de Energia
      if (lvl >= 9) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const numParticles = lvl >= 11 ? 16 : 8;
        for (let p = 0; p < numParticles; p++) {
          const angle = (p / numParticles) * Math.PI * 2 + t * 1.5;
          const dist = 42 + Math.sin(t * 4 + p) * 14;
          const px = centerX + Math.cos(angle) * dist;
          const py = centerY + Math.sin(angle) * dist * 1.3;

          ctx.fillStyle = lvl >= 11 ? '#fb923c' : '#fde047';
          ctx.beginPath();
          ctx.arc(px, py, 2.5 + Math.sin(t * 5 + p) * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. TIER +7 a +8: Pulso Rúnico Ciano
      if (lvl >= 7 && lvl <= 8) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const pulse = (Math.sin(t * 2.5) + 1) * 0.5;
        const runeGrad = ctx.createRadialGradient(centerX, centerY, 15, centerX, centerY, 55 + pulse * 15);
        runeGrad.addColorStop(0, `rgba(56, 189, 248, ${0.25 + pulse * 0.25})`);
        runeGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = runeGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Renderização Tridimensional da Lâmina com Projeção 3D
      ctx.save();
      ctx.translate(centerX, centerY - 8);

      const rotY = this.meshRotY;
      const rotX = this.meshRotX;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const project3D = (x, y, z) => {
        const rx = x * cosY - z * sinY;
        const rz = x * sinY + z * cosY;
        const ry = y * cosX - rz * sinX;
        const fov = 200;
        const depth = fov / (fov + rz + 40);
        return { px: rx * depth, py: ry * depth, z: rz };
      };

      const tip = project3D(0, -70, 0);
      const midR = project3D(12, -18, 4);
      const midL = project3D(-12, -18, 4);
      const spine = project3D(0, 18, 6);
      const baseR = project3D(9, 28, 2);
      const baseL = project3D(-9, 28, 2);

      // Face Direita da Lâmina
      ctx.beginPath();
      ctx.moveTo(tip.px, tip.py);
      ctx.lineTo(spine.px, spine.py);
      ctx.lineTo(baseR.px, baseR.py);
      ctx.lineTo(midR.px, midR.py);
      ctx.closePath();

      const lightR = Math.max(0.2, (cosY + 1.2) * 0.5);
      ctx.fillStyle = lvl >= 13 ? `rgba(244, 63, 94, ${lightR})` :
                      lvl >= 9 ? `rgba(251, 191, 36, ${lightR})` :
                      lvl >= 7 ? `rgba(56, 189, 248, ${lightR})` :
                      `rgba(203, 213, 225, ${lightR})`;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = lvl >= 9 ? '#fff' : '#64748b';
      ctx.stroke();

      // Face Esquerda da Lâmina
      ctx.beginPath();
      ctx.moveTo(tip.px, tip.py);
      ctx.lineTo(midL.px, midL.py);
      ctx.lineTo(baseL.px, baseL.py);
      ctx.lineTo(spine.px, spine.py);
      ctx.closePath();

      const lightL = Math.max(0.15, (-cosY + 1.2) * 0.4);
      ctx.fillStyle = lvl >= 13 ? `rgba(168, 85, 247, ${lightL})` :
                      lvl >= 9 ? `rgba(180, 83, 9, ${lightL})` :
                      lvl >= 7 ? `rgba(3, 105, 161, ${lightL})` :
                      `rgba(100, 116, 139, ${lightL})`;
      ctx.fill();
      ctx.stroke();

      // Guarda 3D Chanfrada
      const gL = project3D(-24, 28, 5);
      const gR = project3D(24, 28, 5);
      const gB = project3D(0, 34, 5);
      ctx.beginPath();
      ctx.moveTo(gL.px, gL.py);
      ctx.lineTo(gR.px, gR.py);
      ctx.lineTo(gB.px, gB.py);
      ctx.closePath();
      ctx.fillStyle = '#b45309';
      ctx.fill();
      ctx.stroke();

      // Empunhadura e Pomo 3D
      const hTop = project3D(0, 34, 0);
      const hBot = project3D(0, 56, 0);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(hTop.px, hTop.py);
      ctx.lineTo(hBot.px, hBot.py);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hBot.px, hBot.py, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      requestAnimationFrame(renderLoop);
    };

    requestAnimationFrame(renderLoop);
  }

  // ==========================================================================
  // RENDERIZAÇÃO DA ARENA DE COMBATE 3D / 2D (MONSTROS, EFEITOS & DROPS)
  // ==========================================================================
  initCombatArena() {
    // 1. Inicializa o Motor 3D Real da Arena Three.js
    const container3D = document.getElementById('combat-3d-viewport');
    if (container3D) {
      this.arena3D = new Dasi3DRealtimeArena('combat-3d-viewport', this);
    }

    // 2. Botão de Alternância entre Motor 3D e Retro 2D
    const btnToggleEngine = document.getElementById('btn-toggle-engine');
    const canvas2D = document.getElementById('combat-canvas');

    if (btnToggleEngine) {
      btnToggleEngine.addEventListener('click', () => {
        this.use3DRenderer = !this.use3DRenderer;
        if (this.use3DRenderer) {
          btnToggleEngine.textContent = '💎 Motor 3D Ativo';
          if (container3D) container3D.style.display = 'block';
          if (canvas2D) canvas2D.style.display = 'none';
          if (this.arena3D) this.arena3D.onWindowResize();
        } else {
          btnToggleEngine.textContent = '🕹️ Modo Retro 2D';
          if (container3D) container3D.style.display = 'none';
          if (canvas2D) canvas2D.style.display = 'block';
        }
      });
    }

    // 3. Loop contínuo (mantém retro 2D funcionando se alternado)
    const loop = () => {
      if (!this.use3DRenderer) {
        this.renderCombatFrame();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  renderCombatFrame() {
    if (!this.combatCtx || !this.combatCanvas) return;
    const ctx = this.combatCtx;
    const w = this.combatCanvas.width;
    const h = this.combatCanvas.height;
    const now = Date.now();

    // 1. Fundo do Terreno de Lorencia (Planície escura medieval)
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, w, h);

    // Grade sutil de paralelepípedos / solo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Marcações de Zonas no chão com fontes góticas sutis
    ctx.font = '11px Cinzel, serif';
    ctx.fillStyle = 'rgba(240, 192, 90, 0.25)';
    ctx.fillText('CAMPOS DAS ARANHAS [NORTE]', 60, 40);
    ctx.fillText('CEMITÉRIO DAS ALMAS [LESTE]', 520, 40);
    ctx.fillText('PLANÍCIES DOS HOUNDS [OESTE]', 60, 390);
    ctx.fillText('CHARCOS DOS TOUROS [SUL]', 520, 390);
    ctx.fillText('PORTÃO DE LORENCIA', 350, 215);

    // Círculo rúnico central de Lorencia
    ctx.strokeStyle = 'rgba(198, 155, 63, 0.15)';
    ctx.beginPath();
    ctx.arc(400, 210, 60, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Movimento suave do jogador
    const pdx = this.playerTargetX - this.playerX;
    const pdy = this.playerTargetY - this.playerY;
    const pdist = Math.hypot(pdx, pdy);
    if (pdist > 2) {
      this.playerX += (pdx / pdist) * Math.min(pdist, 3.5);
      this.playerY += (pdy / pdist) * Math.min(pdist, 3.5);
    }

    // 3. Renderiza Feixes de Luz e Drops no Chão
    for (const drop of this.groundDrops.values()) {
      const dx = drop.x;
      const dy = drop.y;

      // FEIXE DE LUZ CELESTIAL VERTICAL PARA JOIAS (BLESS, SOUL, LIFE, CHAOS)
      if (drop.isJewel) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Pulso oscilante do feixe
        const beamPulse = 0.7 + Math.sin(now / 180) * 0.3;
        const beamGrad = ctx.createLinearGradient(dx, dy, dx, 0);
        beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
        beamGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.6)');
        beamGrad.addColorStop(0.7, 'rgba(245, 208, 97, 0.4)');
        beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

        // Coluna de luz vertical
        ctx.fillStyle = beamGrad;
        const bWidth = 26 * beamPulse;
        ctx.fillRect(dx - bWidth / 2, 0, bWidth, dy);

        // Núcleo brilhante fino
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(dx - 3, 0, 6, dy);

        // Círculo rúnico giratório na base
        const runeAngle = now / 600;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dx, dy, 18 + Math.sin(now / 200) * 4, runeAngle, runeAngle + Math.PI * 1.5);
        ctx.stroke();

        ctx.restore();
      }

      // Ícone do item no chão
      ctx.save();
      const bob = Math.sin(now / 250 + dx) * 3;
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let dropIcon = '📦';
      if (drop.zen > 0) dropIcon = '💰';
      else if (drop.item) dropIcon = getItemIcon(drop.item.defId);

      ctx.shadowColor = drop.isJewel ? '#38bdf8' : drop.isExcellent ? '#10b981' : 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = drop.isJewel ? 16 : 8;
      ctx.fillText(dropIcon, dx, dy + bob);

      // Etiqueta do drop com fundo
      ctx.font = '10px Rajdhani, sans-serif';
      let tagText = '';
      if (drop.zen > 0) tagText = `${drop.zen} Zen`;
      else if (drop.item) {
        const def = this.definitions[drop.item.defId];
        tagText = (drop.isExcellent ? 'Exc ' : '') + (def ? def.name : drop.item.defId);
        if (drop.item.level > 0) tagText += ` +${drop.item.level}`;
      }

      if (tagText) {
        const tw = ctx.measureText(tagText).width;
        ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
        ctx.fillRect(dx - tw / 2 - 4, dy + bob + 12, tw + 8, 14);
        ctx.strokeStyle = drop.isJewel ? '#38bdf8' : drop.isExcellent ? '#10b981' : '#c69b3f';
        ctx.lineWidth = 1;
        ctx.strokeRect(dx - tw / 2 - 4, dy + bob + 12, tw + 8, 14);

        ctx.fillStyle = drop.isJewel ? '#38bdf8' : drop.isExcellent ? '#34d399' : '#f0c05a';
        ctx.fillText(tagText, dx, dy + bob + 19);
      }
      ctx.restore();
    }

    // 4. Renderiza Monstros
    for (const mob of this.monsters.values()) {
      if (mob.isDead) continue;

      // Interpolação suave de posição
      mob.displayX = mob.displayX || mob.x;
      mob.displayY = mob.displayY || mob.y;
      mob.displayX += (mob.x - mob.displayX) * 0.15;
      mob.displayY += (mob.y - mob.displayY) * 0.15;

      let mx = mob.displayX;
      let my = mob.displayY;

      // Tremor de Stagger
      if (mob.state === 'STAGGERED' && now < (mob.staggerUntil || 0)) {
        mx += (Math.random() - 0.5) * 6;
        my += (Math.random() - 0.5) * 6;
      }

      // Retículo de seleção se estiver focado
      if (this.selectedTargetId === mob.id) {
        ctx.save();
        ctx.strokeStyle = '#f0c05a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const rot = now / 400;
        ctx.arc(mx, my, 22, rot, rot + Math.PI * 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(mx, my, 22, rot + Math.PI, rot + Math.PI * 1.8);
        ctx.stroke();
        ctx.restore();
      }

      // Desenha ícone do monstro
      ctx.save();
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let mobIcon = '🕷️';
      if (mob.type === 'hound') mobIcon = '🐺';
      else if (mob.type === 'bull_fighter') mobIcon = '🐂';
      else if (mob.type === 'skeleton') mobIcon = '💀';

      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText(mobIcon, mx, my);

      // Nome e Nível do Monstro
      ctx.font = '10px Rajdhani, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`[${mob.level}] ${mob.name}`, mx, my - 22);

      // Barra de Vida do Monstro
      const hpWidth = 36;
      const hpHeight = 4;
      ctx.fillStyle = '#220808';
      ctx.fillRect(mx - hpWidth / 2, my - 16, hpWidth, hpHeight);

      const hpPct = Math.max(0, Math.min(1, mob.currentHp / mob.maxHp));
      const fillGrad = ctx.createLinearGradient(mx - hpWidth / 2, 0, mx + hpWidth / 2, 0);
      fillGrad.addColorStop(0, '#ef4444');
      fillGrad.addColorStop(1, '#10b981');
      ctx.fillStyle = fillGrad;
      ctx.fillRect(mx - hpWidth / 2, my - 16, hpWidth * hpPct, hpHeight);
      ctx.strokeStyle = '#381616';
      ctx.lineWidth = 1;
      ctx.strokeRect(mx - hpWidth / 2, my - 16, hpWidth, hpHeight);

      ctx.restore();
    }

    // 5. Renderiza Personagem Hero
    ctx.save();
    const px = this.playerX;
    const py = this.playerY;

    // Sombra do herói
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(px, py + 12, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ícone do Herói
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛡️', px, py);

    // Arma equipada na mão do herói
    const weaponEquipped = this.inventoryState.equipped.find((e) => e.slot === 'WEAPON_RIGHT');
    if (weaponEquipped) {
      const wIcon = getItemIcon(weaponEquipped.item.defId);
      ctx.font = '18px sans-serif';
      const swingOffset = this.attackSwing > 0 ? Math.sin(this.attackSwing * Math.PI) * 15 : 0;
      ctx.fillText(wIcon, px + 14 + swingOffset, py - 4);
    }

    // Arco de Golpe de Espada (Slash Arc)
    if (this.attackSwing > 0) {
      this.attackSwing = Math.max(0, this.attackSwing - 0.1);
      ctx.strokeStyle = 'rgba(240, 192, 90, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px + 10, py, 28, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    }

    // Nome e Classe
    ctx.font = '11px Cinzel, serif';
    ctx.fillStyle = '#f5d061';
    ctx.fillText(this.character ? `[Nv.${this.character.level}] ${this.character.name}` : 'Hero', px, py - 24);
    ctx.restore();

    // 6. Efeitos de Slash & Impacto
    for (let i = this.slashEffects.length - 1; i >= 0; i--) {
      const slash = this.slashEffects[i];
      const age = now - slash.createdAt;
      if (age > slash.lifetime) {
        this.slashEffects.splice(i, 1);
        continue;
      }

      const progress = age / slash.lifetime;
      const alpha = 1 - progress;
      ctx.save();
      ctx.strokeStyle = slash.colorHex || '#ffffff';
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3 * (1 - progress);
      ctx.beginPath();
      ctx.arc(slash.x, slash.y, slash.radius * (0.8 + progress * 0.5), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 7. Números de Dano Colorido Flutuantes
    for (let i = this.floatingDamages.length - 1; i >= 0; i--) {
      const dmg = this.floatingDamages[i];
      const age = now - dmg.createdAt;
      if (age > dmg.lifetime) {
        this.floatingDamages.splice(i, 1);
        continue;
      }

      const progress = age / dmg.lifetime;
      dmg.y -= 1.1;
      const alpha = Math.max(0, 1 - Math.pow(progress, 2));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 16px Rajdhani, sans-serif';
      ctx.textAlign = 'center';

      let displayStr = dmg.text;
      if (dmg.damageType === 'EXCELLENT') displayStr = `EXCELLENT! ${dmg.text}`;
      else if (dmg.damageType === 'CRITICAL') displayStr = `CRITICAL! ${dmg.text}`;
      else if (dmg.damageType === 'IGNORE_DEFENSE') displayStr = `IGN DEF! ${dmg.text}`;

      // Borda preta espessa
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(displayStr, dmg.x, dmg.y);

      // Preenchimento com a cor autoritativa do servidor
      ctx.fillStyle = dmg.colorHex;
      ctx.fillText(displayStr, dmg.x, dmg.y);
      ctx.restore();
    }
  }

  // ==========================================================================
  // MÉTODOS DO SISTEMA DE CHEFES & INVASÕES DOURADAS
  // ==========================================================================
  initBossesPanel() {
    // Spawners de chefes canônicos
    document.querySelectorAll('.btn-boss-spawn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bossDefId = btn.getAttribute('data-boss');
        this.spawnBoss(bossDefId);
      });
    });

    // Invasões Douradas por Tier
    document.querySelectorAll('.btn-invasion-tier').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tier = parseInt(btn.getAttribute('data-tier') || '1', 10);
        this.triggerGoldenInvasion(tier);
      });
    });

    const btnRandomInvasion = document.getElementById('btn-trigger-random-invasion');
    if (btnRandomInvasion) {
      btnRandomInvasion.addEventListener('click', () => {
        const randomTier = Math.floor(Math.random() * 5) + 1;
        this.triggerGoldenInvasion(randomTier);
      });
    }

    // Abertura de Box of Kundun (+1..+5)
    document.querySelectorAll('.btn-box-open').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tier = parseInt(btn.getAttribute('data-box') || '1', 10);
        this.openBoxOfKundun(tier);
      });
    });

    // Ações de Ataque / Despawn
    const btnAttackBoss = document.getElementById('btn-boss-attack');
    if (btnAttackBoss) {
      btnAttackBoss.addEventListener('click', () => {
        this.testAttackBoss();
      });
    }

    const btnDespawnBoss = document.getElementById('btn-boss-despawn');
    if (btnDespawnBoss) {
      btnDespawnBoss.addEventListener('click', () => {
        this.despawnSelectedBoss();
      });
    }
  }

  async spawnBoss(bossDefId) {
    this.log(`👹 Invocando chefe autoritativo: [${bossDefId}]...`, 'info');
    const request = { type: bossDefId };

    // Controles administrativos usam a API HTTP, que também devolve erros de permissão
    // sem fechar a sessão WebSocket autenticada do jogador.
    try {
      const res = await fetch('/api/bosses/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.boss) {
        this.activeBosses.set(data.boss.id, data.boss);
        this.selectedBossId = data.boss.id;
        this.syncBossesInArena();
        this.updateBossHud(data.boss);
        this.updateActiveBossesList();
        this.log(`👑 Chefe ${data.boss.name} despertou em ${data.boss.location || 'Mundo Aberto'}! [HP: ${data.boss.currentHp}]`, 'success');
        if (this.sfx) this.sfx.playSuccessSound();
      }
    } catch (err) {
      this.log(`❌ Não foi possível invocar ${bossDefId}: ${err.message}`, 'warning');
      console.warn('Erro ao invocar chefe:', err);
    }
  }

  async triggerGoldenInvasion(tier = 1) {
    const safeTier = Math.max(1, Math.min(5, Number.parseInt(tier, 10) || 1));
    this.log(`🌟 Disparando Invasão Dourada Tier ${safeTier}...`, 'info');
    try {
      const res = await fetch('/api/events/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'GOLDEN_INVASION', tier: safeTier, mapId: 'LORENCIA' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.invasion) this.handleGoldenInvasion({ invasion: data.invasion });
    } catch (err) {
      this.log(`❌ Não foi possível disparar a Invasão Dourada: ${err.message}`, 'warning');
      console.warn('Erro ao disparar invasão dourada:', err);
    }
  }

  async openBoxOfKundun(tier = 1) {
    const safeTier = Math.max(1, Math.min(5, Number.parseInt(tier, 10) || 1));
    const lootBox = document.getElementById('box-loot-result');
    if (lootBox) lootBox.innerHTML = `<em>Invocando bênção de Kundun (Caixa +${safeTier})...</em>`;

    try {
      const res = await fetch('/api/box/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boxId: `box_of_kundun_${safeTier}`,
          playerX: this.playerX ?? 125,
          playerY: this.playerY ?? 125,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      const loot = data.loot;
      if (loot) {
        const generatedItems = Array.isArray(loot.items) ? loot.items : [];
        const itemNames = generatedItems.map((item) => `${item.name || item.defId || item.item?.defId || 'Item'} (+${item.level || 0})`).join(', ');
        const jewels = generatedItems.filter((item) => String(item.defId || '').startsWith('jewel_')).map((item) => item.defId);
        const jewelNames = jewels.length > 0 ? `Joias: ${jewels.join(', ')}` : 'Sem joias extras';
        if (lootBox) {
          lootBox.innerHTML = `<strong style="color: #4ade80;">🎁 Drops da Box +${safeTier} Gerados:</strong><br>${itemNames || 'Itens espalhados no chão'}<br><span style="color: #fde047;">${jewelNames}</span> &bull; <span style="color: #cbd5e1;">${(loot.zen || 0).toLocaleString()} Zen</span>`;
        }
        this.log(`🎁 [Box +${safeTier}] Bênção de Kundun aberta.`, 'success');
        if (this.sfx) this.sfx.playSuccessSound();
      }
    } catch (err) {
      this.log(`❌ Não foi possível abrir a Box of Kundun: ${err.message}`, 'warning');
      console.warn('Erro ao abrir Box of Kundun:', err);
    }
  }

  async refreshActiveBosses() {
    try {
      const res = await fetch('/api/bosses');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.activeBosses)) {
        this.activeBosses.clear();
        for (const boss of data.activeBosses) this.activeBosses.set(boss.id, boss);
        this.syncBossesInArena();

        const activeCount = document.getElementById('bosses-active-count');
        if (activeCount) activeCount.textContent = Array.from(this.activeBosses.values()).filter((boss) => !boss.isDead).length;
        const invasionCount = document.getElementById('invasions-active-count');
        if (invasionCount) invasionCount.textContent = (data.activeInvasions || []).length;

        if (!this.activeBosses.has(this.selectedBossId)) {
          this.selectedBossId = this.activeBosses.keys().next().value || null;
        }
        if (this.selectedBossId) this.updateBossHud(this.activeBosses.get(this.selectedBossId));
        this.updateActiveBossesList();
      }
    } catch (err) {
      console.warn('Erro ao buscar chefes ativos:', err);
    }
  }

  syncBossesInArena() {
    if (this.arena3D && typeof this.arena3D.syncBosses === 'function') {
      this.arena3D.syncBosses(this.activeBosses);
    }
  }

  updateBossHud(boss) {
    if (!boss) return;
    const nameEl = document.getElementById('boss-hud-name');
    const locEl = document.getElementById('boss-hud-loc');
    const phaseEl = document.getElementById('boss-hud-phase');
    const stateEl = document.getElementById('boss-hud-state');
    const hpFill = document.getElementById('boss-hp-fill');
    const shieldFill = document.getElementById('boss-shield-fill');
    const hpText = document.getElementById('boss-hp-text');
    const poiseFill = document.getElementById('boss-poise-fill');
    const poiseText = document.getElementById('boss-poise-text');
    const iconEl = document.getElementById('boss-hud-icon');
    const auraText = document.getElementById('boss-aura-text');

    const maxHp = Math.max(1, Number(boss.maxHp) || 1);
    const currentHp = Math.max(0, Number(boss.currentHp) || 0);
    const currentShield = Math.max(0, Number(boss.currentShield ?? boss.shield) || 0);
    const maxShield = Math.max(0, Number(boss.maxShield) || 0);
    const currentPoise = Math.max(0, Number(boss.poise) || 0);
    const maxPoise = Math.max(1, Number(boss.maxPoise) || 100);
    const type = String(boss.type || boss.id || '').toLowerCase();

    if (nameEl) nameEl.textContent = boss.name || boss.title || 'Chefe';
    if (locEl) locEl.textContent = `Localização: ${boss.location || boss.map || 'Mundo Aberto'} • Nível ${boss.level || 50}`;
    if (phaseEl) phaseEl.textContent = boss.currentPhaseName || `FASE ${boss.currentPhaseIndex || boss.currentPhase || 1}`;
    if (stateEl) {
      const isStaggered = boss.state === 'STAGGERED' || boss.isStaggered;
      const isDead = boss.isDead || boss.state === 'DEAD';
      stateEl.textContent = isDead ? 'DERROTADO' : boss.isEnraged ? 'FÚRIA' : isStaggered ? 'ATORDOADO' : boss.state === 'ATTACKING' ? 'CANALIZANDO' : 'NORMAL';
      stateEl.style.borderColor = isDead ? '#64748b' : boss.isEnraged ? '#ef4444' : isStaggered ? '#38bdf8' : '#f59e0b';
    }

    const hpPct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
    const shieldPct = maxShield > 0 ? Math.max(0, Math.min(100, (currentShield / maxShield) * 100)) : 0;
    const poisePct = Math.max(0, Math.min(100, (currentPoise / maxPoise) * 100));
    if (hpFill) hpFill.style.width = `${hpPct}%`;
    if (shieldFill) shieldFill.style.width = `${shieldPct}%`;
    if (hpText) hpText.textContent = `${currentHp.toLocaleString()} / ${maxHp.toLocaleString()} (Escudo: ${currentShield.toLocaleString()})`;
    if (poiseFill) poiseFill.style.width = `${poisePct}%`;
    if (poiseText) poiseText.textContent = `${Math.round(poisePct)}% ${boss.isEnraged ? '(Imune a Stagger)' : ''}`;

    if (iconEl) {
      if (type.includes('gorgon')) iconEl.textContent = '🐍';
      else if (type.includes('ice_queen')) iconEl.textContent = '❄️';
      else if (type.includes('hydra')) iconEl.textContent = '🐲';
      else if (type.includes('balrog')) iconEl.textContent = '🔥';
      else if (type.includes('zaikan')) iconEl.textContent = '🦂';
      else if (type.includes('kundun')) iconEl.textContent = '👑';
      else iconEl.textContent = '👹';
    }

    if (auraText) {
      auraText.textContent = boss.auraActive
        ? `Aura de proximidade: ${boss.auraType || 'Ativa'}`
        : '';
    }
  }

  handleBossUpdate(payload = {}) {
    if (payload.error) this.log(`❌ [Chefe] ${payload.error}`, 'warning');
    const isFullSnapshot = Array.isArray(payload.bosses) || Array.isArray(payload.activeBosses);
    const bosses = Array.isArray(payload.bosses)
      ? payload.bosses
      : Array.isArray(payload.activeBosses)
        ? payload.activeBosses
        : payload.boss
          ? [payload.boss]
          : [];

    if (isFullSnapshot) this.activeBosses.clear();
    for (const boss of bosses) {
      if (boss?.id) this.activeBosses.set(boss.id, boss);
    }

    if (!this.activeBosses.has(this.selectedBossId)) {
      this.selectedBossId = this.activeBosses.keys().next().value || null;
    }
    if (this.selectedBossId) this.updateBossHud(this.activeBosses.get(this.selectedBossId));
    const activeCount = document.getElementById('bosses-active-count');
    if (activeCount) {
      activeCount.textContent = Array.from(this.activeBosses.values()).filter((boss) => !boss.isDead).length;
    }
    this.updateActiveBossesList();
    this.syncBossesInArena();
  }

  handleBossTelegraph(payload = {}) {
    const nameEl = document.getElementById('boss-telegraph-name');
    const descEl = document.getElementById('boss-telegraph-desc');
    const fillEl = document.getElementById('boss-telegraph-fill');
    const telegraph = payload.telegraph || {};
    const skill = telegraph.skill || {};
    const ability = skill.name || telegraph.skillName || payload.abilityName || 'Golpe Fatal';
    const shape = skill.shape || telegraph.shape || telegraph.type || 'CIRCLE';
    const duration = Number(skill.castDurationMs || telegraph.durationMs || telegraph.remainingMs || 2500);
    const radius = Number(skill.radius || telegraph.radius || 12);
    const angleDegrees = Number(skill.angleDeg || telegraph.angleDeg || 90);
    const originX = telegraph.originX ?? telegraph.x ?? payload.x ?? 125;
    const originY = telegraph.originY ?? telegraph.y ?? payload.y ?? 125;
    const targetX = telegraph.targetX ?? originX;
    const targetY = telegraph.targetY ?? originY;
    const direction = Math.atan2(targetY - originY, targetX - originX);
    const renderType = shape === 'ARENA_WIDE' ? 'ARENA' : shape;

    if (nameEl) nameEl.textContent = `${String(ability).toUpperCase()} (${renderType})`;
    if (descEl) descEl.textContent = `Área: ${renderType} • Raio: ${radius} • Canalização: ${(duration / 1000).toFixed(1)}s`;
    if (fillEl) {
      fillEl.style.transition = 'none';
      fillEl.style.width = '0%';
      setTimeout(() => {
        fillEl.style.transition = `width ${duration}ms linear`;
        fillEl.style.width = '100%';
      }, 20);
    }

    if (this.arena3D && typeof this.arena3D.renderTelegraph === 'function') {
      this.arena3D.renderTelegraph({
        type: renderType,
        radius,
        angleDegrees,
        width: Number(skill.lineWidth || 4),
        durationMs: duration,
        x: originX,
        y: originY,
        direction,
      });
    }

    this.log(`⚠️ [Telégrafo de Chefe] ${ability} canalizando por ${(duration / 1000).toFixed(1)}s! Esquive da área vermelha!`, 'warning');
  }

  handleGoldenInvasion(payload = {}) {
    const invasion = payload.invasion || payload;
    this.log(`🌟 [Invasão Dourada] ${invasion.announcement || payload.announcement || 'Dragões Dourados avistados!'}`, 'success');
    this.refreshActiveBosses();
  }

  testAttackBoss() {
    if (!this.selectedBossId) {
      this.log('Nenhum chefe selecionado para atacar.', 'warning');
      return;
    }
    const boss = this.activeBosses.get(this.selectedBossId);
    if (!boss || boss.isDead) return;

    this.log(`⚔️ Desferindo golpe em ${boss.name}...`, 'info');
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendPacket(OPCODES.COMBAT_ATTACK_REQ, {
        targetMobId: boss.id,
        skillId: 'twisting_slash',
        playerX: this.playerX,
        playerY: this.playerY,
      });
    }
  }

  async despawnSelectedBoss() {
    if (!this.selectedBossId) return;
    const bossId = this.selectedBossId;
    try {
      const res = await fetch('/api/bosses/despawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bossId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      this.log('Chefe removido do mundo pelo console de desenvolvimento.', 'info');
      this.selectedBossId = null;
      await this.refreshActiveBosses();
    } catch (err) {
      this.log(`❌ Não foi possível remover o chefe: ${err.message}`, 'warning');
      console.warn('Erro ao remover chefe:', err);
    }
  }

  updateActiveBossesList() {
    const listEl = document.getElementById('active-bosses-list');
    if (!listEl) return;
    if (this.activeBosses.size === 0) {
      listEl.innerHTML = '<div class="empty-list-notice">Nenhum chefe ativo no momento. Use os botões à esquerda para invocar.</div>';
      return;
    }

    listEl.innerHTML = '';
    for (const [id, boss] of this.activeBosses.entries()) {
      const card = document.createElement('div');
      const phase = boss.currentPhaseName || `Fase ${boss.currentPhaseIndex || boss.currentPhase || 1}`;
      const location = boss.location || boss.map || 'Mundo Aberto';
      const state = boss.isDead ? 'Derrotado' : `${phase} • HP: ${(boss.currentHp || 0).toLocaleString()}`;
      card.className = 'boss-roster-item';
      card.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(30, 41, 59, 0.7); border: 1px solid ${this.selectedBossId === id ? '#f59e0b' : 'rgba(255,255,255,0.1)'}; border-radius: 4px; cursor: pointer;`;
      card.innerHTML = `
        <div>
          <strong style="color: #fde047; font-size: 13px;">${boss.name}</strong>
          <div style="font-size: 11px; color: #94a3b8;">${state} • ${location}</div>
        </div>
        <button style="padding: 4px 8px; font-size: 11px; background: #3b82f6; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Focar</button>
      `;
      card.addEventListener('click', () => {
        this.selectedBossId = id;
        this.updateBossHud(boss);
        this.updateActiveBossesList();
      });
      listEl.appendChild(card);
    }
  }

  initEventsPanel() {
    const btnRefresh = document.getElementById('btn-refresh-events');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => this.refreshEventsStatus());
    }

    // Blood Castle Actions
    const btnBcEnter = document.getElementById('btn-bc-enter');
    if (btnBcEnter) btnBcEnter.addEventListener('click', () => this.sendEventAction('BLOOD_CASTLE', 'ENTER'));
    const btnBcMob = document.getElementById('btn-bc-kill-mob');
    if (btnBcMob) btnBcMob.addEventListener('click', () => this.sendEventAction('BLOOD_CASTLE', 'KILL_MOB'));
    const btnBcGate = document.getElementById('btn-bc-hit-gate');
    if (btnBcGate) btnBcGate.addEventListener('click', () => this.sendEventAction('BLOOD_CASTLE', 'HIT_GATE'));
    const btnBcDeliver = document.getElementById('btn-bc-deliver');
    if (btnBcDeliver) btnBcDeliver.addEventListener('click', () => this.sendEventAction('BLOOD_CASTLE', 'DELIVER_WEAPON'));

    // Devil Square Actions
    const btnDsEnter = document.getElementById('btn-ds-enter');
    if (btnDsEnter) btnDsEnter.addEventListener('click', () => this.sendEventAction('DEVIL_SQUARE', 'ENTER'));
    const btnDsWave = document.getElementById('btn-ds-next-wave');
    if (btnDsWave) btnDsWave.addEventListener('click', () => this.sendEventAction('DEVIL_SQUARE', 'ADVANCE_WAVE'));
    const btnDsChest = document.getElementById('btn-ds-chest');
    if (btnDsChest) btnDsChest.addEventListener('click', () => this.sendEventAction('DEVIL_SQUARE', 'OPEN_CHEST'));

    // Chaos Castle Actions
    const btnCcEnter = document.getElementById('btn-cc-enter');
    if (btnCcEnter) btnCcEnter.addEventListener('click', () => this.sendEventAction('CHAOS_CASTLE', 'ENTER'));
    const btnCcKill = document.getElementById('btn-cc-kill-bot');
    if (btnCcKill) btnCcKill.addEventListener('click', () => this.sendEventAction('CHAOS_CASTLE', 'KILL_COMBATANT'));
    const btnCcCollapse = document.getElementById('btn-cc-collapse');
    if (btnCcCollapse) btnCcCollapse.addEventListener('click', () => this.sendEventAction('CHAOS_CASTLE', 'TRIGGER_COLLAPSE'));

    // Duel Actions
    const btnDuelStart = document.getElementById('btn-duel-start');
    if (btnDuelStart) btnDuelStart.addEventListener('click', () => this.sendEventAction('DUEL_COLISEUM', 'START'));
    const btnDuelP1 = document.getElementById('btn-duel-score-p1');
    if (btnDuelP1) btnDuelP1.addEventListener('click', () => this.sendEventAction('DUEL_COLISEUM', 'SCORE_P1'));
    const btnDuelP2 = document.getElementById('btn-duel-score-p2');
    if (btnDuelP2) btnDuelP2.addEventListener('click', () => this.sendEventAction('DUEL_COLISEUM', 'SCORE_P2'));
    const btnDuelEnd = document.getElementById('btn-duel-end');
    if (btnDuelEnd) btnDuelEnd.addEventListener('click', () => this.sendEventAction('DUEL_COLISEUM', 'END'));

    // Dungeon Actions
    const btnDngStart = document.getElementById('btn-dng-start');
    if (btnDngStart) btnDngStart.addEventListener('click', () => this.sendDungeonAction('START'));
    const btnDngKey = document.getElementById('btn-dng-key');
    if (btnDngKey) btnDngKey.addEventListener('click', () => this.sendDungeonAction('COLLECT_KEY'));
    const btnDngDrain = document.getElementById('btn-dng-drain');
    if (btnDngDrain) btnDngDrain.addEventListener('click', () => this.sendDungeonAction('DRAIN_VALVE'));
    const btnDngPillar = document.getElementById('btn-dng-pillar');
    if (btnDngPillar) btnDngPillar.addEventListener('click', () => this.sendDungeonAction('BREAK_PILLAR'));

    // Castle Siege Actions
    const btnSiegeRegister = document.getElementById('btn-siege-register');
    if (btnSiegeRegister) btnSiegeRegister.addEventListener('click', () => this.sendSiegeAction('REGISTER'));
    const btnSiegeGate = document.getElementById('btn-siege-hit-gate');
    if (btnSiegeGate) btnSiegeGate.addEventListener('click', () => this.sendSiegeAction('HIT_GATE'));
    const btnSiegeStatue = document.getElementById('btn-siege-hit-statue');
    if (btnSiegeStatue) btnSiegeStatue.addEventListener('click', () => this.sendSiegeAction('HIT_STATUE'));
    const btnSiegeWest = document.getElementById('btn-siege-pedestal-west');
    if (btnSiegeWest) btnSiegeWest.addEventListener('click', () => this.sendSiegeAction('PEDESTAL_WEST'));
    const btnSiegeEast = document.getElementById('btn-siege-pedestal-east');
    if (btnSiegeEast) btnSiegeEast.addEventListener('click', () => this.sendSiegeAction('PEDESTAL_EAST'));
    const btnSiegeCrown = document.getElementById('btn-siege-crown');
    if (btnSiegeCrown) btnSiegeCrown.addEventListener('click', () => this.sendSiegeAction('CROWN_SEAL'));
  }

  // ==========================================================================
  // AÇÕES DE CERCO AO CASTELO (0xB1) & PAINEL DE GUILDA
  // ==========================================================================
  sendSiegeAction(action) {
    this.log(`🏰 [Cerco] Ação: ${action}...`, 'info');
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (action === 'REGISTER') {
      this.sendPacket(OPCODES.SIEGE_REGISTER_REQ, {});
    } else if (action === 'HIT_GATE') {
      this.sendPacket(OPCODES.SIEGE_ATTACK_STRUCTURE_REQ, {
        structureId: 'cyclopean_iron_gate',
        damage: 500000,
      });
    } else if (action === 'HIT_STATUE') {
      this.sendPacket(OPCODES.SIEGE_ATTACK_STRUCTURE_REQ, {
        structureId: 'life_statue_nw',
        damage: 400000,
      });
    } else if (action === 'PEDESTAL_WEST') {
      this.sendPacket(OPCODES.SIEGE_PEDESTAL_REQ, { side: 'west' });
    } else if (action === 'PEDESTAL_EAST') {
      this.sendPacket(OPCODES.SIEGE_PEDESTAL_REQ, { side: 'east' });
    } else if (action === 'CROWN_SEAL') {
      this.sendPacket(OPCODES.SIEGE_CROWN_SEAL_REQ, { action: 'BEGIN' });
    }
  }

  handleGuildStatusUpdate(payload) {
    this.guildStatus = payload;
    if (payload.message) {
      this.log(`🛡️ [Guilda] ${payload.message}`, payload.success === false ? 'error' : 'success');
    }
  }

  async refreshSiegeStatus() {
    try {
      const res = await fetch('/api/castle-siege');
      const data = await res.json();
      this.updateSiegeUI(data);
    } catch (err) {
      console.warn('Erro ao consultar o Cerco ao Castelo:', err);
    }
  }

  updateSiegeUI(siege) {
    if (!siege) return;
    this.siegeStatus = siege;

    const formatNumber = (value) => Number(value ?? 0).toLocaleString('pt-BR');
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    const phaseLabels = {
      CLOSED: 'FECHADO',
      REGISTRATION: 'INSCRIÇÕES',
      BATTLE: 'EM BATALHA',
      CONCLUDED: 'CONCLUÍDO',
    };
    setText('siege-status-tag', phaseLabels[siege.phase] ?? siege.phase);

    const totalSeconds = Math.floor((siege.timeRemainingMs ?? 0) / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    setText('siege-timer-val', `${minutes}:${seconds}`);

    const gate = siege.gate;
    if (gate) {
      const pct = gate.maxHp ? Math.round((gate.hp / gate.maxHp) * 100) : 0;
      setText('siege-gate-hp', `${formatNumber(gate.hp)} / ${formatNumber(gate.maxHp)} (${pct}%)`);
    }

    const standing = siege.standingStatues ?? 0;
    setText('siege-statues-val', `${standing} / 4 de pé`);

    const respawnLabels = { VOL_03: 'Pátio (VOL_03)', VOL_04: 'Ponte (VOL_04)', VOL_01: 'Campo (VOL_01)' };
    setText('siege-respawn-val', respawnLabels[siege.defenderRespawnScenario] ?? siege.defenderRespawnScenario ?? '—');

    const seal = siege.crownSeal || {};
    const pedestals = [seal.pedestalWest, seal.pedestalEast].filter(Boolean).length;
    setText('siege-seal-val', `${seal.progressPercent ?? 0}% (${pedestals}/2 pedestais)`);

    setText('siege-owner-val', siege.castleOwner ? siege.castleOwner.name : 'Sem dono');

    // Estepper de estágios
    const stageOrder = ['GATE_ASSAULT', 'COURTYARD_STATUES', 'DRAWBRIDGE_CROSSING', 'CROWN_SEAL'];
    const currentIndex = stageOrder.indexOf(siege.stage);
    [1, 2, 3, 4].forEach((n) => {
      const el = document.getElementById(`siege-step-${n}`);
      if (!el) return;
      el.classList.toggle('active', siege.stage === 'TRIUMPH' || n - 1 === currentIndex);
      el.classList.toggle('done', siege.stage === 'TRIUMPH' || n - 1 < currentIndex);
    });

    // Placar de guildas
    const boardEl = document.getElementById('siege-scoreboard');
    if (boardEl) {
      const scoreboard = siege.scoreboard || [];
      boardEl.innerHTML = '';
      if (scoreboard.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-list-notice';
        empty.textContent = 'Placar vazio — nenhum dano registrado.';
        boardEl.appendChild(empty);
      } else {
        scoreboard.slice(0, 5).forEach((entry, index) => {
          const row = document.createElement('div');
          row.className = 'detail-row';
          row.innerHTML = `<span>#${index + 1} ${entry.guildName || entry.guildId}</span><strong>${formatNumber(entry.damage)} dano</strong>`;
          boardEl.appendChild(row);
        });
      }
    }
  }

  async sendEventAction(eventType, action) {
    this.log(`🏆 [Evento ${eventType}] Enviando ação: ${action}...`, 'info');
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (eventType === 'BLOOD_CASTLE') this.sendPacket(OPCODES.BLOOD_CASTLE_ACTION_REQ, { action });
      else if (eventType === 'DEVIL_SQUARE') this.sendPacket(OPCODES.DEVIL_SQUARE_ACTION_REQ, { action });
      else if (eventType === 'CHAOS_CASTLE') this.sendPacket(OPCODES.CHAOS_CASTLE_ACTION_REQ, { action });
      else if (eventType === 'DUEL_COLISEUM') this.sendPacket(OPCODES.DUEL_ACTION_REQ, { action });
    }
    try {
      const res = await fetch('/api/events/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, action }),
      });
      const data = await res.json();
      if (data.success) {
        this.log(`🏆 [Evento ${eventType}] ${data.message || 'Ação executada com sucesso!'}`, 'success');
        this.refreshEventsStatus();
      }
    } catch (err) {
      console.warn('Erro ao disparar evento:', err);
    }
  }

  async sendDungeonAction(action) {
    this.log(`💀 [Catacumbas] Ação: ${action}...`, 'info');
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendPacket(OPCODES.DUNGEON_PROGRESS_REQ, { action });
    }
    try {
      const res = await fetch('/api/dungeons', {
        method: 'GET',
      });
      const instances = await res.json();
      if (instances && instances.length > 0) {
        this.updateDungeonUI(instances[0]);
      }
    } catch (err) {
      console.warn('Erro ao consultar masmorras:', err);
    }
  }

  async refreshEventsStatus() {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      this.eventsStatus = data;
      this.handleEventStatusUpdate(data);

      const dngRes = await fetch('/api/dungeons');
      const dngList = await dngRes.json();
      if (dngList && dngList.length > 0) {
        this.updateDungeonUI(dngList[0]);
      }

      await this.refreshSiegeStatus();
    } catch (err) {
      console.warn('Erro ao buscar status de eventos:', err);
    }
  }

  handleEventStatusUpdate(data) {
    if (data.bloodCastle) this.updateBloodCastleUI(data.bloodCastle);
    if (data.devilSquare) this.updateDevilSquareUI(data.devilSquare);
    if (data.chaosCastle) this.updateChaosCastleUI(data.chaosCastle);
    if (data.duelColiseum) this.updateDuelColiseumUI(data.duelColiseum);
  }

  updateBloodCastleUI(bc) {
    const statusTag = document.getElementById('bc-status-tag');
    const timerVal = document.getElementById('bc-timer-val');
    const bridgeCount = document.getElementById('bc-bridge-count');
    const gateHp = document.getElementById('bc-gate-hp');

    if (statusTag) statusTag.textContent = bc.state || 'ABERTO';
    if (timerVal && bc.remainingTimeMs !== undefined) {
      const mins = Math.floor(bc.remainingTimeMs / 60000);
      const secs = Math.floor((bc.remainingTimeMs % 60000) / 1000);
      timerVal.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    if (bridgeCount) bridgeCount.textContent = `${bc.bridgeKillCount || 0} / ${bc.bridgeKillQuota || 40}`;
    if (gateHp) gateHp.textContent = `${(bc.gateHp || 100000).toLocaleString()} HP (${Math.round(((bc.gateHp || 100000) / 100000) * 100)}%)`;

    for (let i = 1; i <= 4; i++) {
      const stepEl = document.getElementById(`bc-step-${i}`);
      if (stepEl) {
        if (bc.currentStage >= i) stepEl.classList.add('active');
        else stepEl.classList.remove('active');
      }
    }
  }

  updateDevilSquareUI(ds) {
    const statusTag = document.getElementById('ds-status-tag');
    const waveVal = document.getElementById('ds-wave-val');
    const scoreVal = document.getElementById('ds-score-val');
    const killsVal = document.getElementById('ds-kills-val');

    if (statusTag) statusTag.textContent = ds.state || 'ABERTO';
    if (waveVal) waveVal.textContent = `Onda ${ds.currentWave || 1} / 4`;
    if (scoreVal) scoreVal.textContent = `${(ds.totalScore || 0).toLocaleString()} pts`;
    if (killsVal) killsVal.textContent = (ds.monstersKilled || 0).toString();
  }

  updateChaosCastleUI(cc) {
    const statusTag = document.getElementById('cc-status-tag');
    const stageVal = document.getElementById('cc-stage-val');
    const aliveVal = document.getElementById('cc-alive-val');

    if (statusTag) statusTag.textContent = cc.state || 'ABERTO';
    if (stageVal) stageVal.textContent = `Anel ${cc.stage || 1} (${cc.sizeMeters || 42}m &times; ${cc.sizeMeters || 42}m)`;
    if (aliveVal) aliveVal.textContent = `${cc.combatantsAlive || 100} / 100`;
  }

  updateDuelColiseumUI(duel) {
    const statusTag = document.getElementById('duel-status-tag');
    const p1Score = document.getElementById('duel-p1-score');
    const p2Score = document.getElementById('duel-p2-score');

    if (statusTag) statusTag.textContent = duel.state || 'AGUARDANDO';
    if (p1Score) p1Score.textContent = duel.duelist1?.score || 0;
    if (p2Score) p2Score.textContent = duel.duelist2?.score || 0;
  }

  updateDungeonUI(dng) {
    const floorVal = document.getElementById('dng-floor-val');
    const keyStatus = document.getElementById('dng-key-status');
    const mudStatus = document.getElementById('dng-mud-status');
    const pillarsStatus = document.getElementById('dng-pillars-status');
    const timeVal = document.getElementById('dng-time-val');
    const valvesVal = document.getElementById('dng-valves-val');

    if (floorVal) floorVal.textContent = `Andar ${dng.currentFloor || 1} &bull; Ranque ${dng.rank || 'S'}`;
    if (keyStatus) keyStatus.textContent = `🔑 Chave de Ossos: ${dng.hasBoneKey ? 'Coletada (Portão Destrancado)' : 'Pendente'}`;
    if (mudStatus) mudStatus.textContent = `🧪 Lodo Ácido (Andar 2): ${dng.acidMudActive ? 'ATIVO (-40% vel, 25 DoT)' : 'Drenado'}`;
    if (pillarsStatus) pillarsStatus.textContent = `🏛️ Pilares Rúnicos (Andar 3): ${dng.pillarsRemaining !== undefined ? dng.pillarsRemaining : 8} / 8`;
    if (valvesVal) valvesVal.textContent = `${dng.valvesDrained || 0} / 3 Válvulas`;

    if (timeVal && dng.elapsedMs !== undefined) {
      const mins = Math.floor(dng.elapsedMs / 60000);
      const secs = Math.floor((dng.elapsedMs % 60000) / 1000);
      timeVal.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} (Ranque S < 5m)`;
    }
  }

  // ==========================================================================
  // ORQUESTRAÇÃO MESTRE: HELPERS DE COMUNICAÇÃO DE REDE DO CLIENTE
  // ==========================================================================
  sendTeleport(gateId, targetMap) {
    this.sendPacket(OPCODES.TELEPORT_REQ, { gateId, targetMap });
  }

  sendGateTrigger(gateId) {
    this.sendPacket(OPCODES.GATE_TRIGGER_REQ, { gateId });
  }

  sendPartyInvite(targetSessionId) {
    this.sendPacket(OPCODES.PARTY_INVITE_REQ, { targetSessionId });
  }

  sendPartyRespondInvite(inviterSessionId, accept) {
    this.sendPacket(OPCODES.PARTY_RESPOND_INVITE_REQ, { inviterSessionId, accept });
  }

  sendPartyLeave() {
    this.sendPacket(OPCODES.PARTY_LEAVE_REQ, {});
  }

  sendTradeRequest(targetSessionId) {
    this.sendPacket(OPCODES.TRADE_REQUEST_REQ, { targetSessionId });
  }

  sendTradeRespond(requesterSessionId, accept) {
    this.sendPacket(OPCODES.TRADE_RESPOND_REQ, { requesterSessionId, accept });
  }

  sendTradeAddItem(itemUuid, tradeSlot) {
    this.sendPacket(OPCODES.TRADE_ITEM_ADD_REQ, { itemUuid, tradeSlot });
  }

  sendTradeAddZen(zen) {
    this.sendPacket(OPCODES.TRADE_ZEN_ADD_REQ, { zen });
  }

  sendTradeConfirm() {
    this.sendPacket(OPCODES.TRADE_CONFIRM_REQ, {});
  }

  sendTradeCancel() {
    this.sendPacket(OPCODES.TRADE_CANCEL_REQ, {});
  }

  sendPShopOpen(title, items) {
    this.sendPacket(OPCODES.PSHOP_OPEN_REQ, { title, items });
  }

  sendPShopClose() {
    this.sendPacket(OPCODES.PSHOP_CLOSE_REQ, {});
  }

  sendPShopInspect(sellerSessionId) {
    this.sendPacket(OPCODES.PSHOP_INSPECT_REQ, { sellerSessionId });
  }

  sendPShopBuy(sellerSessionId, itemUuid) {
    this.sendPacket(OPCODES.PSHOP_BUY_REQ, { sellerSessionId, itemUuid });
  }

  sendReset() {
    this.sendPacket(OPCODES.RESET_REQ, {});
  }

  sendMasterReset() {
    this.sendPacket(OPCODES.MASTER_RESET_REQ, {});
  }

  sendQuestInfo() {
    this.sendPacket(OPCODES.QUEST_INFO_REQ, {});
  }

  sendQuestAction(questId, action) {
    this.sendPacket(OPCODES.QUEST_ACTION_REQ, { questId, action });
  }

  sendMasterSkillAlloc(skillId) {
    this.sendPacket(OPCODES.MASTER_SKILL_ALLOC_REQ, { skillId });
  }

  sendGensJoin(family) {
    this.sendPacket(OPCODES.GENS_JOIN_REQ, { family });
  }

  sendGensStatus() {
    this.sendPacket(OPCODES.GENS_STATUS_REQ, {});
  }

  sendGensLeave() {
    this.sendPacket(OPCODES.GENS_LEAVE_REQ, {});
  }

  sendHarmonySmelt(itemUuid) {
    this.sendPacket(OPCODES.HARMONY_SMELT_REQ, { itemUuid });
  }

  sendHarmonyRestore(itemUuid) {
    this.sendPacket(OPCODES.HARMONY_RESTORE_REQ, { itemUuid });
  }

  sendSocketMount(targetUuid, seedDefId, slotIndex) {
    this.sendPacket(OPCODES.SOCKET_MOUNT_REQ, { targetUuid, seedDefId, slotIndex });
  }

  sendSocketUnmount(targetUuid, slotIndex) {
    this.sendPacket(OPCODES.SOCKET_UNMOUNT_REQ, { targetUuid, slotIndex });
  }

  sendKalimaSpawn(lostMapDefId, x, y) {
    this.sendPacket(OPCODES.KALIMA_PORTAL_SPAWN_REQ, { lostMapDefId, x, y });
  }

  sendKalimaEnter(portalId) {
    this.sendPacket(OPCODES.KALIMA_ENTER_REQ, { portalId });
  }

  log(msg, type = 'info') {
    const row = document.createElement('div');
    row.className = `log-row ${type}`;

    const now = new Date();
    const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;

    row.innerHTML = `
      <span class="timestamp">${timeStr}</span>
      <span class="source">[GameServer]</span>
      <span class="msg">${msg}</span>
    `;

    this.domLogs.appendChild(row);
    this.domLogs.scrollTop = this.domLogs.scrollHeight;
  }
}

// Iniciação no carregamento da página
// (o script é um módulo deferido: se o DOM já estiver pronto, inicializa direto)
function bootDevClientApp() {
  try {
    window.dasiClient = new DevClientApp();
  } catch (err) {
    console.error('[DevClientApp FATAL BOOT ERROR]:', err);
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new ErrorEvent('error', { error: err, message: err.message }));
    }
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootDevClientApp);
} else {
  bootDevClientApp();
}
