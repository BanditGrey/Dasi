/**
 * Dasi MMORPG - Gerenciador de Sessões de Jogadores
 * Mantém instâncias isoladas de conexões ativas, inventários em grade e slots equipados.
 */

import { GridInventory } from '../inventory/GridInventory.ts';
import { Item } from '../inventory/Item.ts';
import { EquipmentSlot, WeaponExcellentOption, ArmorExcellentOption } from '../inventory/types.ts';
import type { SerializedInventoryState, CharacterSummary } from './protocol.ts';
import { ComboSkillEngine } from '../combat/ComboSkillEngine.ts';
import { EffectManager } from '../combat/EffectManager.ts';
import { QuestManager, type CharacterProgressionState } from '../progression/QuestManager.ts';
import { MasterSkillTree, type MasterSkillTreeState } from '../progression/MasterSkillTree.ts';

export type SessionState = 'HANDSHAKE' | 'AUTHENTICATED' | 'DISCONNECTED';

export interface ActiveBuff {
  value: number;
  durationMs: number;
  expiresAt: number;
}

export interface ClientSession {
  sessionId: string;
  socket: unknown; // WebSocket
  isBinaryMode: boolean;
  state: SessionState;
  username: string;
  character: CharacterSummary;
  inventory: GridInventory;
  connectedAt: number;
  lastPingAt: number;
  seqIn: number;
  seqOut: number;

  // Atributos de Combate Canônicos
  currentHp?: number;
  maxHp?: number;
  currentSd?: number;
  maxSd?: number;
  currentMp?: number;
  maxMp?: number;
  partyId?: string;
  activeBuffs?: Map<string, ActiveBuff>;
  recentSkills?: string[];
  x?: number;
  y?: number;
  currentMap?: number;
  pkLevel?: number;
  pkCount?: number;

  // Sistemas Orquestrados do Servidor
  resets?: number;
  masterResets?: number;
  wCoins?: number;
  progressionState?: CharacterProgressionState;
  masterTreeState?: MasterSkillTreeState;
  comboEngine?: ComboSkillEngine;
  effectManager?: EffectManager;
  gensFamily?: number;
  gensContribution?: number;
  gensRank?: number;
  activeTradeId?: string;
  pshopTitle?: string;
  pshopOpen?: boolean;
}

export class SessionManager {
  private sessions: Map<string, ClientSession> = new Map();
  private socketToSessionId: Map<unknown, string> = new Map();
  private sessionCounter = 1;

  public createSession(socket: unknown, isBinaryMode = false): ClientSession {
    const sessionId = `sess-${Date.now().toString(16)}-${(this.sessionCounter++).toString(16).padStart(4, '0')}`;
    
    // Cria inventário 8x8 padrão de Continent of Legend
    const inventory = new GridInventory({ cols: 8, rows: 8 });

    // Personagem padrão DK (Dark Knight / Blade Knight) nível 250 com atributos suficientes
    const character: CharacterSummary = {
      name: 'HeroOfDasi',
      characterClass: 'DK',
      level: 250,
      strength: 320,
      agility: 120,
      vitality: 100,
      energy: 80,
      command: 0,
      zen: 2000000, // 2 Milhões de Zen inicial para testes de forja e compras
      statPoints: 25, // 25 pontos livres para distribuição
    };

    const session: ClientSession = {
      sessionId,
      socket,
      isBinaryMode,
      state: 'HANDSHAKE',
      username: 'Anonymous',
      character,
      inventory,
      connectedAt: Date.now(),
      lastPingAt: Date.now(),
      seqIn: 0,
      seqOut: 0,
      currentHp: 1200,
      maxHp: 1200,
      currentSd: 800,
      maxSd: 800,
      currentMp: 300,
      maxMp: 300,
      activeBuffs: new Map(),
      recentSkills: [],
      x: 100,
      y: 100,
      currentMap: 0,
      resets: 0,
      masterResets: 0,
      wCoins: 0,
      progressionState: QuestManager.createDefaultState(sessionId, character.name, 1, character.level),
      masterTreeState: MasterSkillTree.createDefaultTree(sessionId),
      comboEngine: new ComboSkillEngine(),
      effectManager: new EffectManager(),
      gensFamily: 0,
      gensContribution: 0,
      gensRank: 0,
      activeTradeId: undefined,
      pshopTitle: undefined,
      pshopOpen: false,
    };

    // Pré-popula com itens icônicos do Continent of Legend
    this.populateInitialInventory(inventory);

    this.sessions.set(sessionId, session);
    this.socketToSessionId.set(socket, sessionId);

    return session;
  }

  public getSession(sessionId: string): ClientSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getSessionBySocket(socket: unknown): ClientSession | undefined {
    const sessionId = this.socketToSessionId.get(socket);
    if (!sessionId) return undefined;
    return this.sessions.get(sessionId);
  }

  public authenticateSession(
    sessionId: string,
    username: string,
    characterClass = 'DK'
  ): ClientSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.username = username || 'Warrior';
    session.character.name = username || 'Warrior';
    session.character.characterClass = characterClass;
    session.state = 'AUTHENTICATED';

    return session;
  }

  public removeSessionBySocket(socket: unknown): string | null {
    const sessionId = this.socketToSessionId.get(socket);
    if (!sessionId) return null;

    this.socketToSessionId.delete(socket);
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state = 'DISCONNECTED';
      this.sessions.delete(sessionId);
    }
    return sessionId;
  }

  public removeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.socketToSessionId.delete(session.socket);
      session.state = 'DISCONNECTED';
      this.sessions.delete(sessionId);
    }
  }

  public getAllSessions(): ClientSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Concede ganho de níveis autoritativo (+5 pontos de atributos por nível)
   */
  public levelUp(sessionId: string, levels = 1): CharacterSummary | null {
    const session = this.sessions.get(sessionId);
    if (!session || levels <= 0) return null;

    session.character.level += levels;
    session.character.statPoints += levels * 5;
    return session.character;
  }

  /**
   * Modifica a quantidade de Zen do personagem
   */
  public addZen(sessionId: string, amount: number): number | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.character.zen = Math.max(0, (session.character.zen ?? 0) + amount);
    return session.character.zen;
  }

  /**
   * Serializa o inventário do jogador com informações adicionais para a interface gráfica
   */
  public getSerializedInventoryState(session: ClientSession): SerializedInventoryState {
    const allPlaced = session.inventory.getAllGridItems();
    const allEquipped = session.inventory.getAllEquipped();

    const items = allPlaced.map((p) => ({
      item: p.item,
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      rotated: !!p.item.rotated,
    }));

    const equipped: { slot: EquipmentSlot; item: (typeof allEquipped extends Map<any, infer V> ? V : never) }[] = [];
    for (const [slot, item] of allEquipped.entries()) {
      equipped.push({ slot, item });
    }

    return {
      cols: session.inventory.cols,
      rows: session.inventory.rows,
      items,
      equipped,
    };
  }

  /**
   * Preenche o inventário com itens clássicos para exploração e testes em tempo real
   */
  public populateInitialInventory(inventory: GridInventory): void {
    // 1. Dragon Blade +7 com Sorte e Habilidade (Arma lendária)
    const dragonBlade = Item.create('dragon_blade', {
      level: 7,
      luck: true,
      skill: true,
      excellentMask: WeaponExcellentOption.INCREASE_DMG_2_PERCENT | WeaponExcellentOption.ATTACK_SPEED_7,
      optionLevel: 4,
    });
    inventory.addItem(dragonBlade, 0, 0);

    // 2. Dragon Shield +6 com Sorte
    const dragonShield = Item.create('dragon_shield', {
      level: 6,
      luck: true,
      skill: false,
      excellentMask: ArmorExcellentOption.DEFENSE_RATE_10_PCT,
    });
    inventory.addItem(dragonShield, 2, 0);

    // 3. Wings of Dragon +9
    const wingsOfDragon = Item.create('wings_of_dragon', {
      level: 9,
      luck: true,
      optionLevel: 8,
    });
    inventory.addItem(wingsOfDragon, 4, 0);

    // 4. Peças do Set Dragon (+0 a +5 para teste de Joias)
    const dragonHelm = Item.create('dragon_helm', { level: 3, luck: true });
    const dragonArmor = Item.create('dragon_armor', { level: 5, luck: true });
    const dragonPants = Item.create('dragon_pants', { level: 2, luck: false });
    const dragonGloves = Item.create('dragon_gloves', { level: 4, luck: true });
    const dragonBoots = Item.create('dragon_boots', { level: 1, luck: true });

    inventory.addItem(dragonHelm, 0, 4);
    inventory.addItem(dragonArmor, 2, 4);
    inventory.addItem(dragonPants, 4, 3);
    inventory.addItem(dragonGloves, 6, 0);
    inventory.addItem(dragonBoots, 6, 2);

    // 5. Joias Sagradas de MU Online para aprimoramento
    // 4x Jewel of Blessing
    for (let i = 0; i < 4; i++) {
      const bless = Item.create('jewel_of_blessing');
      inventory.addItem(bless, 6, 4 + i);
    }

    // 4x Jewel of Soul
    for (let i = 0; i < 4; i++) {
      const soul = Item.create('jewel_of_soul');
      inventory.addItem(soul, 7, 4 + i);
    }

    // 2x Jewel of Life
    const life1 = Item.create('jewel_of_life');
    const life2 = Item.create('jewel_of_life');
    inventory.addItem(life1, 4, 5);
    inventory.addItem(life2, 5, 5);

    // 2x Jewel of Chaos
    const chaos1 = Item.create('jewel_of_chaos');
    const chaos2 = Item.create('jewel_of_chaos');
    inventory.addItem(chaos1, 4, 6);
    inventory.addItem(chaos2, 5, 6);

    // 2x Jewel of Harmony
    const harm1 = Item.create('jewel_of_harmony');
    const harm2 = Item.create('jewel_of_harmony');
    inventory.addItem(harm1, 4, 7);
    inventory.addItem(harm2, 5, 7);
  }
}
