/**
 * Dasi MMORPG - Protocolo de Rede e Definições de Pacotes
 * Baseado na arquitetura de enquadramento binário de alta performance (C1/C2)
 * e compatível com clientes Web/WebSocket em JSON ou Binário.
 */

import type { EquipmentSlot, ItemInstance, UpgradeOutcome } from '../inventory/types.ts';
import type { SerializedMonster, GroundDropItem } from '../combat/Monster.ts';

export const OpcodeGroup = {
  AUTH_SESSION: 0x01,
  PING_PONG: 0x02,
  SESSION_TERMINATE: 0x03,
  WORLD: 0x10,
  MONSTER: 0x15,
  GROUND_ITEM: 0x16,
  MOVEMENT: 0x30,
  COMBAT: 0x50,
  INVENTORY: 0x70,
  JEWELS: 0x71,
  CHAOS_MACHINE: 0x72,
  DEV_OPS: 0x73,
  NPC_SHOP: 0x74,
  CHARACTER_STATS: 0x75,
  TRADE: 0x76,
  PERSONAL_SHOP: 0x77,
  BOSS_SYSTEM: 0x80,
  EVENT_ARENA: 0x81,
  DUNGEON_SYSTEM: 0x82,
  PROGRESSION: 0x83,
  GENS_SYSTEM: 0x84,
  SOCKET_HARMONY: 0x85,
  SOCIAL_GUILD: 0xB0,
  CASTLE_SIEGE: 0xB1,
  SOCIAL_PARTY: 0xB2,
} as const;

export const Opcodes = {
  // Handshake & Auth
  MSG_HANDSHAKE_HELLO: { opcode: 0x01, subcode: 0x01 },
  MSG_HANDSHAKE_CHALLENGE: { opcode: 0x01, subcode: 0x02 },
  MSG_AUTH_LOGIN_REQ: { opcode: 0x01, subcode: 0x03 },
  MSG_AUTH_LOGIN_RES: { opcode: 0x01, subcode: 0x04 },

  // Ping / KeepAlive
  MSG_PING: { opcode: 0x02, subcode: 0x01 },
  MSG_PONG: { opcode: 0x02, subcode: 0x02 },

  // Session
  MSG_SESSION_TERMINATE: { opcode: 0x03, subcode: 0x01 },

  // Monsters & Spawns
  MSG_MONSTER_SPAWN_OR_MOVE: { opcode: 0x15, subcode: 0x01 },

  // Ground Drops & Pickup
  MSG_GROUND_ITEM_DROP: { opcode: 0x16, subcode: 0x01 },
  MSG_GROUND_ITEM_PICKUP_REQ: { opcode: 0x16, subcode: 0x02 },
  MSG_GROUND_ITEM_PICKUP_RES: { opcode: 0x16, subcode: 0x02 },
  MSG_GROUND_ITEM_REMOVE: { opcode: 0x16, subcode: 0x03 },

  // Combat
  MSG_COMBAT_ATTACK_REQ: { opcode: 0x50, subcode: 0x01 },
  MSG_COMBAT_ATTACK_RES: { opcode: 0x50, subcode: 0x02 },

  // Telemetria & Status do Jogador
  MSG_PLAYER_STATUS_VITALS: { opcode: 0x10, subcode: 0x01 },
  MSG_PLAYER_STATUS_EXP: { opcode: 0x10, subcode: 0x02 },

  // Action Bar & Habilidades / Cooldowns
  MSG_ACTION_EXECUTE_REQ: { opcode: 0x51, subcode: 0x01 },
  MSG_ACTION_COOLDOWN_RES: { opcode: 0x51, subcode: 0x02 },
  MSG_POTION_USE_REQ: { opcode: 0x51, subcode: 0x03 },
  MSG_DODGE_REQ: { opcode: 0x51, subcode: 0x04 },

  // Inventory
  MSG_INVENTORY_SYNC_ALL: { opcode: 0x70, subcode: 0x01 },
  MSG_ITEM_MOVE_REQ: { opcode: 0x70, subcode: 0x02 },
  MSG_ITEM_MOVE_RES: { opcode: 0x70, subcode: 0x03 },

  // Jewels
  MSG_ITEM_USE_JEWEL_REQ: { opcode: 0x71, subcode: 0x01 },
  MSG_ITEM_USE_JEWEL_RES: { opcode: 0x71, subcode: 0x02 },

  // Chaos Machine (0x72)
  MSG_CHAOS_MACHINE_MIX_REQ: { opcode: 0x72, subcode: 0x01 },
  MSG_CHAOS_MACHINE_MIX_RES: { opcode: 0x72, subcode: 0x02 },

  // Dev Commands
  MSG_ITEM_SPAWN_DEV_REQ: { opcode: 0x73, subcode: 0x01 },
  MSG_ITEM_SPAWN_DEV_RES: { opcode: 0x73, subcode: 0x02 },

  // NPC Shops (0x74)
  MSG_NPC_SHOP_BUY_REQ: { opcode: 0x74, subcode: 0x01 },
  MSG_NPC_SHOP_BUY_RES: { opcode: 0x74, subcode: 0x02 },
  MSG_NPC_SHOP_SELL_REQ: { opcode: 0x74, subcode: 0x03 },
  MSG_NPC_SHOP_SELL_RES: { opcode: 0x74, subcode: 0x04 },

  // Stat Points Allocation (0x75)
  MSG_STAT_POINT_ALLOC_REQ: { opcode: 0x75, subcode: 0x01 },
  MSG_STAT_POINT_ALLOC_RES: { opcode: 0x75, subcode: 0x02 },
  MSG_FRUIT_CONSUME_REQ: { opcode: 0x75, subcode: 0x03 },
  MSG_FRUIT_CONSUME_RES: { opcode: 0x75, subcode: 0x04 },

  // Boss System (0x80)
  MSG_BOSS_SPAWN_REQ: { opcode: 0x80, subcode: 0x01 },
  MSG_BOSS_UPDATE_RES: { opcode: 0x80, subcode: 0x02 },
  MSG_BOSS_TELEGRAPH_CAST: { opcode: 0x80, subcode: 0x03 },
  MSG_GOLDEN_INVASION_REQ: { opcode: 0x80, subcode: 0x04 },
  MSG_GOLDEN_INVASION_RES: { opcode: 0x80, subcode: 0x05 },
  MSG_BOX_KUNDUN_OPEN_REQ: { opcode: 0x80, subcode: 0x06 },
  MSG_BOX_KUNDUN_OPEN_RES: { opcode: 0x80, subcode: 0x07 },

  // Event Arenas (0x81)
  MSG_EVENT_STATUS_REQ: { opcode: 0x81, subcode: 0x01 },
  MSG_EVENT_STATUS_RES: { opcode: 0x81, subcode: 0x02 },
  MSG_EVENT_ENTER_REQ: { opcode: 0x81, subcode: 0x03 },
  MSG_EVENT_ENTER_RES: { opcode: 0x81, subcode: 0x04 },
  MSG_BLOOD_CASTLE_ACTION_REQ: { opcode: 0x81, subcode: 0x05 },
  MSG_BLOOD_CASTLE_UPDATE_RES: { opcode: 0x81, subcode: 0x06 },
  MSG_DEVIL_SQUARE_ACTION_REQ: { opcode: 0x81, subcode: 0x07 },
  MSG_DEVIL_SQUARE_UPDATE_RES: { opcode: 0x81, subcode: 0x08 },
  MSG_CHAOS_CASTLE_ACTION_REQ: { opcode: 0x81, subcode: 0x09 },
  MSG_CHAOS_CASTLE_UPDATE_RES: { opcode: 0x81, subcode: 0x0a },
  MSG_DUEL_ACTION_REQ: { opcode: 0x81, subcode: 0x0b },
  MSG_DUEL_UPDATE_RES: { opcode: 0x81, subcode: 0x0c },
  MSG_KALIMA_PORTAL_SPAWN_REQ: { opcode: 0x81, subcode: 0x0d },
  MSG_KALIMA_PORTAL_SPAWN_RES: { opcode: 0x81, subcode: 0x0e },
  MSG_KALIMA_ENTER_REQ: { opcode: 0x81, subcode: 0x0f },
  MSG_KALIMA_ENTER_RES: { opcode: 0x81, subcode: 0x10 },

  // Dungeon System (0x82)
  MSG_DUNGEON_ENTER_REQ: { opcode: 0x82, subcode: 0x01 },
  MSG_DUNGEON_ENTER_RES: { opcode: 0x82, subcode: 0x02 },
  MSG_DUNGEON_PROGRESS_REQ: { opcode: 0x82, subcode: 0x03 },
  MSG_DUNGEON_PROGRESS_RES: { opcode: 0x82, subcode: 0x04 },

  // Guildas & Alianças (0xB0) — docs/technical/Network_Protocol.md §3
  MSG_GUILD_STATUS_REQ: { opcode: 0xB0, subcode: 0x01 },
  MSG_GUILD_STATUS_RES: { opcode: 0xB0, subcode: 0x02 },
  MSG_GUILD_CREATE_REQ: { opcode: 0xB0, subcode: 0x03 },
  MSG_GUILD_CREATE_RES: { opcode: 0xB0, subcode: 0x04 },
  MSG_GUILD_INVITE_REQ: { opcode: 0xB0, subcode: 0x05 },
  MSG_GUILD_INVITE_RES: { opcode: 0xB0, subcode: 0x06 },
  MSG_GUILD_RESPOND_INVITE_REQ: { opcode: 0xB0, subcode: 0x07 },
  MSG_GUILD_RESPOND_INVITE_RES: { opcode: 0xB0, subcode: 0x08 },
  MSG_GUILD_RANK_REQ: { opcode: 0xB0, subcode: 0x09 },
  MSG_GUILD_RANK_RES: { opcode: 0xB0, subcode: 0x0a },
  MSG_GUILD_LEAVE_REQ: { opcode: 0xB0, subcode: 0x0b },
  MSG_GUILD_LEAVE_RES: { opcode: 0xB0, subcode: 0x0c },
  MSG_GUILD_ALLIANCE_REQ: { opcode: 0xB0, subcode: 0x0d },
  MSG_GUILD_ALLIANCE_RES: { opcode: 0xB0, subcode: 0x0e },
  MSG_GUILD_TREASURY_REQ: { opcode: 0xB0, subcode: 0x0f },
  MSG_GUILD_TREASURY_RES: { opcode: 0xB0, subcode: 0x10 },

  // Cerco ao Castelo (0xB1)
  MSG_SIEGE_STATUS_REQ: { opcode: 0xB1, subcode: 0x01 },
  MSG_SIEGE_STATUS_RES: { opcode: 0xB1, subcode: 0x02 },
  MSG_SIEGE_REGISTER_REQ: { opcode: 0xB1, subcode: 0x03 },
  MSG_SIEGE_REGISTER_RES: { opcode: 0xB1, subcode: 0x04 },
  MSG_SIEGE_ATTACK_STRUCTURE_REQ: { opcode: 0xB1, subcode: 0x05 },
  MSG_SIEGE_ATTACK_STRUCTURE_RES: { opcode: 0xB1, subcode: 0x06 },
  MSG_SIEGE_PEDESTAL_REQ: { opcode: 0xB1, subcode: 0x07 },
  MSG_SIEGE_PEDESTAL_RES: { opcode: 0xB1, subcode: 0x08 },
  MSG_SIEGE_CROWN_SEAL_REQ: { opcode: 0xB1, subcode: 0x09 },
  MSG_SIEGE_CROWN_SEAL_RES: { opcode: 0xB1, subcode: 0x0a },

  // Navegação e Teleportes (0x30)
  MSG_TELEPORT_REQ: { opcode: 0x30, subcode: 0x01 },
  MSG_TELEPORT_RES: { opcode: 0x30, subcode: 0x02 },
  MSG_GATE_TRIGGER_REQ: { opcode: 0x30, subcode: 0x03 },
  MSG_GATE_TRIGGER_RES: { opcode: 0x30, subcode: 0x04 },

  // Sistema de Troca Atômica / Trade (0x76)
  MSG_TRADE_REQUEST_REQ: { opcode: 0x76, subcode: 0x01 },
  MSG_TRADE_REQUEST_RES: { opcode: 0x76, subcode: 0x02 },
  MSG_TRADE_RESPOND_REQ: { opcode: 0x76, subcode: 0x03 },
  MSG_TRADE_RESPOND_RES: { opcode: 0x76, subcode: 0x04 },
  MSG_TRADE_ITEM_ADD_REQ: { opcode: 0x76, subcode: 0x05 },
  MSG_TRADE_ITEM_ADD_RES: { opcode: 0x76, subcode: 0x06 },
  MSG_TRADE_ZEN_ADD_REQ: { opcode: 0x76, subcode: 0x07 },
  MSG_TRADE_ZEN_ADD_RES: { opcode: 0x76, subcode: 0x08 },
  MSG_TRADE_CONFIRM_REQ: { opcode: 0x76, subcode: 0x09 },
  MSG_TRADE_CONFIRM_RES: { opcode: 0x76, subcode: 0x0a },
  MSG_TRADE_CANCEL_REQ: { opcode: 0x76, subcode: 0x0b },
  MSG_TRADE_CANCEL_RES: { opcode: 0x76, subcode: 0x0c },

  // Loja Pessoal / Personal Shop (0x77)
  MSG_PSHOP_OPEN_REQ: { opcode: 0x77, subcode: 0x01 },
  MSG_PSHOP_OPEN_RES: { opcode: 0x77, subcode: 0x02 },
  MSG_PSHOP_CLOSE_REQ: { opcode: 0x77, subcode: 0x03 },
  MSG_PSHOP_CLOSE_RES: { opcode: 0x77, subcode: 0x04 },
  MSG_PSHOP_BUY_REQ: { opcode: 0x77, subcode: 0x05 },
  MSG_PSHOP_BUY_RES: { opcode: 0x77, subcode: 0x06 },
  MSG_PSHOP_INSPECT_REQ: { opcode: 0x77, subcode: 0x07 },
  MSG_PSHOP_INSPECT_RES: { opcode: 0x77, subcode: 0x08 },

  // Progressão: Resets, Master Resets, Quests e Master Skill Tree (0x83)
  MSG_RESET_REQ: { opcode: 0x83, subcode: 0x01 },
  MSG_RESET_RES: { opcode: 0x83, subcode: 0x02 },
  MSG_MASTER_RESET_REQ: { opcode: 0x83, subcode: 0x03 },
  MSG_MASTER_RESET_RES: { opcode: 0x83, subcode: 0x04 },
  MSG_QUEST_INFO_REQ: { opcode: 0x83, subcode: 0x05 },
  MSG_QUEST_INFO_RES: { opcode: 0x83, subcode: 0x06 },
  MSG_QUEST_ACTION_REQ: { opcode: 0x83, subcode: 0x07 },
  MSG_QUEST_ACTION_RES: { opcode: 0x83, subcode: 0x08 },
  MSG_MASTER_SKILL_ALLOC_REQ: { opcode: 0x83, subcode: 0x09 },
  MSG_MASTER_SKILL_ALLOC_RES: { opcode: 0x83, subcode: 0x0a },

  // Famílias Gens (0x84)
  MSG_GENS_JOIN_REQ: { opcode: 0x84, subcode: 0x01 },
  MSG_GENS_JOIN_RES: { opcode: 0x84, subcode: 0x02 },
  MSG_GENS_STATUS_REQ: { opcode: 0x84, subcode: 0x03 },
  MSG_GENS_STATUS_RES: { opcode: 0x84, subcode: 0x04 },
  MSG_GENS_LEAVE_REQ: { opcode: 0x84, subcode: 0x05 },
  MSG_GENS_LEAVE_RES: { opcode: 0x84, subcode: 0x06 },

  // Refinamentos Harmony e Socket (0x85)
  MSG_HARMONY_SMELT_REQ: { opcode: 0x85, subcode: 0x01 },
  MSG_HARMONY_SMELT_RES: { opcode: 0x85, subcode: 0x02 },
  MSG_HARMONY_RESTORE_REQ: { opcode: 0x85, subcode: 0x03 },
  MSG_HARMONY_RESTORE_RES: { opcode: 0x85, subcode: 0x04 },
  MSG_SOCKET_MOUNT_REQ: { opcode: 0x85, subcode: 0x05 },
  MSG_SOCKET_MOUNT_RES: { opcode: 0x85, subcode: 0x06 },
  MSG_SOCKET_UNMOUNT_REQ: { opcode: 0x85, subcode: 0x07 },
  MSG_SOCKET_UNMOUNT_RES: { opcode: 0x85, subcode: 0x08 },

  // Sistema de Grupo / Social Party (0xB2)
  MSG_PARTY_INVITE_REQ: { opcode: 0xB2, subcode: 0x01 },
  MSG_PARTY_INVITE_RES: { opcode: 0xB2, subcode: 0x02 },
  MSG_PARTY_RESPOND_INVITE_REQ: { opcode: 0xB2, subcode: 0x03 },
  MSG_PARTY_RESPOND_INVITE_RES: { opcode: 0xB2, subcode: 0x04 },
  MSG_PARTY_LEAVE_REQ: { opcode: 0xB2, subcode: 0x05 },
  MSG_PARTY_LEAVE_RES: { opcode: 0xB2, subcode: 0x06 },
  MSG_PARTY_INFO_RES: { opcode: 0xB2, subcode: 0x07 },
} as const;

export const LocationType = {
  GRID: 0,
  EQUIPMENT: 1,
} as const;

export type LocationType = typeof LocationType[keyof typeof LocationType];

export interface HandshakeHelloPayload {
  clientVersion: string;
  clientTime: number;
}

export interface HandshakeChallengePayload {
  serverVersion: string;
  serverTime: number;
  salt: string;
}

export interface AuthLoginReqPayload {
  username: string;
  token?: string;
  characterClass?: string;
}

export interface CharacterSummary {
  name: string;
  characterClass: string;
  level: number;
  strength: number;
  agility: number;
  vitality: number;
  energy: number;
  /** Comando (exclusivo do Dark Lord / Soberano Imperial) */
  command: number;
  zen: number;
  statPoints: number;
}

export interface AuthLoginResPayload {
  success: boolean;
  sessionId: string;
  token: string;
  character: CharacterSummary;
  message?: string;
}

export interface ItemMoveReqPayload {
  itemUuid: string;
  sourceType: LocationType;
  sourceX?: number; // Para GRID: coluna (0..7); Para EQUIPMENT: não usado
  sourceY?: number; // Para GRID: linha (0..7); Para EQUIPMENT: não usado
  sourceSlot?: EquipmentSlot; // Quando sourceType === EQUIPMENT
  targetType: LocationType;
  targetX?: number; // Para GRID
  targetY?: number; // Para GRID
  targetSlot?: EquipmentSlot; // Quando targetType === EQUIPMENT
  rotated?: boolean;
}

export interface ItemMoveResPayload {
  success: boolean;
  itemUuid: string;
  sourceType: LocationType;
  targetType: LocationType;
  targetSlot?: EquipmentSlot;
  newX?: number;
  newY?: number;
  rotated?: boolean;
  error?: string;
  inventoryState?: SerializedInventoryState;
}

export interface ItemUseJewelReqPayload {
  jewelUuid: string;
  targetUuid: string;
  targetLocation: LocationType;
  targetSlot?: EquipmentSlot;
  targetX?: number;
  targetY?: number;
}

export interface ItemUseJewelResPayload {
  success: boolean;
  outcome: UpgradeOutcome;
  jewelUuid: string;
  targetUuid: string;
  previousLevel: number;
  newLevel: number;
  previousOption?: number;
  newOption?: number;
  itemDestroyed: boolean;
  message: string;
  updatedItem?: ItemInstance | null;
  inventoryState?: SerializedInventoryState;
}

export interface ItemSpawnDevReqPayload {
  itemDefId: string;
  level?: number;
  excellentMask?: number;
  luck?: boolean;
  skill?: boolean;
  count?: number;
}

export interface ChaosMachineMixReqPayload {
  mixType: 'CHAOS_WEAPON' | 'FIRST_WING' | 'SECOND_WING' | 'THIRD_WING' | 'FRUIT_CREATION' | 'ITEM_UPGRADE';
  itemUuids: string[];
  targetItemUuid?: string;
  rngRoll?: number;
}

export interface ChaosMachineMixResPayload {
  success: boolean;
  mixType: string;
  rate: number;
  zenCost: number;
  createdItem?: ItemInstance | null;
  updatedItem?: ItemInstance | null;
  destroyedItemUuids: string[];
  message: string;
  itemDestroyed?: boolean;
  inventoryState?: SerializedInventoryState;
  character?: CharacterSummary;
}

export interface NpcShopBuyReqPayload {
  npcId: string;
  itemDefId: string;
  targetX?: number;
  targetY?: number;
}

export interface NpcShopBuyResPayload {
  success: boolean;
  npcId: string;
  itemDefId: string;
  boughtItem?: ItemInstance | null;
  zenRemaining: number;
  /** Imposto Territorial recolhido nesta transação (0 quando não há castelo) */
  taxPaid?: number;
  message?: string;
  error?: string;
  inventoryState?: SerializedInventoryState;
  character?: CharacterSummary;
}

export interface NpcShopSellReqPayload {
  itemUuid: string;
}

export interface NpcShopSellResPayload {
  success: boolean;
  itemUuid?: string;
  zenGained?: number;
  zenRemaining: number;
  /** Imposto Territorial descontado desta venda (0 quando não há castelo) */
  taxPaid?: number;
  message?: string;
  error?: string;
  inventoryState?: SerializedInventoryState;
}

export interface StatPointAllocReqPayload {
  stat: 'strength' | 'agility' | 'vitality' | 'energy' | 'command';
  points: number;
}

export interface StatPointAllocResPayload {
  success: boolean;
  stat: 'strength' | 'agility' | 'vitality' | 'energy' | 'command';
  pointsAllocated: number;
  pointsRemaining: number;
  character: CharacterSummary;
  message?: string;
  error?: string;
}

export interface FruitConsumeReqPayload {
  fruitDefId: string;
}

export interface FruitConsumeResPayload {
  success: boolean;
  fruitDefId?: string;
  statGained?: 'strength' | 'agility' | 'vitality' | 'energy' | 'command';
  pointsGained?: number;
  newTotal?: number;
  character?: CharacterSummary;
  inventoryState?: SerializedInventoryState;
  message?: string;
  error?: string;
}

export interface MonsterSpawnOrMovePayload {
  monsters: SerializedMonster[];
  timestamp?: number;
}

export interface CombatAttackReqPayload {
  targetMobId: string;
  skillId?: string;
  playerX: number;
  playerY: number;
}

export interface CombatAttackResPayload {
  success: boolean;
  attackerId: string;
  targetId: string;
  isMiss: boolean;
  damage: number;
  damageType: string;
  colorHex: string;
  targetHp: number;
  targetMaxHp: number;
  isDead: boolean;
  staggered: boolean;
  hitStopMs: number;
  knockback: { x: number; y: number };
  dropsGenerated?: GroundDropItem[];
  xpGained?: number;
  error?: string;
}

export interface GroundItemDropPayload {
  drops: GroundDropItem[];
}

export interface GroundItemPickupReqPayload {
  dropId: string;
  playerX: number;
  playerY: number;
}

export interface GroundItemPickupResPayload {
  success: boolean;
  dropId: string;
  item?: ItemInstance | null;
  zen?: number;
  error?: string;
  inventoryState?: SerializedInventoryState;
}

export interface GroundItemRemovePayload {
  dropId: string;
}

// -----------------------------------------------------------------------------
// Payloads de Navegação e Portais (0x30)
// -----------------------------------------------------------------------------
export interface TeleportReqPayload {
  destinationName: string;
}

export interface TeleportResPayload {
  success: boolean;
  destinationName?: string;
  map?: number;
  x?: number;
  y?: number;
  zenCost?: number;
  zenRemaining?: number;
  error?: string;
}

export interface GateTriggerReqPayload {
  currentMap: number;
  currentX: number;
  currentY: number;
}

export interface GateTriggerResPayload {
  triggered: boolean;
  targetGateIndex?: number;
  map?: number;
  x?: number;
  y?: number;
  message?: string;
}

// -----------------------------------------------------------------------------
// Payloads de Troca Atômica / Trade (0x76)
// -----------------------------------------------------------------------------
export interface TradeRequestReqPayload {
  targetSessionId: string;
}

export interface TradeRequestResPayload {
  success: boolean;
  tradeId?: string;
  targetSessionId?: string;
  targetName?: string;
  initiatorSessionId?: string;
  initiatorName?: string;
  message?: string;
  error?: string;
}

export interface TradeRespondReqPayload {
  tradeId: string;
  accept: boolean;
}

export interface TradeRespondResPayload {
  success: boolean;
  tradeId: string;
  state: string;
  message?: string;
  error?: string;
}

export interface TradeItemAddReqPayload {
  tradeId: string;
  itemUuid: string;
}

export interface TradeItemAddResPayload {
  success: boolean;
  tradeId: string;
  item?: ItemInstance;
  error?: string;
}

export interface TradeZenAddReqPayload {
  tradeId: string;
  amountZen: number;
}

export interface TradeZenAddResPayload {
  success: boolean;
  tradeId: string;
  zenOffered: number;
  error?: string;
}

export interface TradeConfirmReqPayload {
  tradeId: string;
}

export interface TradeConfirmResPayload {
  success: boolean;
  tradeId: string;
  completed: boolean;
  state: string;
  inventoryState?: SerializedInventoryState;
  character?: CharacterSummary;
  message?: string;
  error?: string;
}

export interface TradeCancelReqPayload {
  tradeId: string;
}

export interface TradeCancelResPayload {
  success: boolean;
  tradeId: string;
  state: string;
  inventoryState?: SerializedInventoryState;
  message: string;
}

// -----------------------------------------------------------------------------
// Payloads de Loja Pessoal / Personal Shop (0x77)
// -----------------------------------------------------------------------------
export interface PShopOpenReqPayload {
  title: string;
  items: Array<{
    slot: number;
    itemId: string;
    itemName: string;
    priceZen: number;
    priceBless: number;
    priceSoul: number;
    width: number;
    height: number;
  }>;
}

export interface PShopOpenResPayload {
  success: boolean;
  title?: string;
  itemCount?: number;
  error?: string;
}

export interface PShopCloseResPayload {
  success: boolean;
  message: string;
}

export interface PShopBuyReqPayload {
  sellerSessionId: string;
  slot: number;
}

export interface PShopBuyResPayload {
  success: boolean;
  sellerSessionId?: string;
  slot?: number;
  boughtItem?: ItemInstance | null;
  buyerZen?: number;
  buyerBless?: number;
  buyerSoul?: number;
  inventoryState?: SerializedInventoryState;
  error?: string;
}

export interface PShopInspectReqPayload {
  sellerSessionId: string;
}

export interface PShopInspectResPayload {
  success: boolean;
  sellerSessionId?: string;
  ownerName?: string;
  title?: string;
  items?: Array<{
    slot: number;
    itemId: string;
    itemName: string;
    priceZen: number;
    priceBless: number;
    priceSoul: number;
    width: number;
    height: number;
  }>;
  error?: string;
}

// -----------------------------------------------------------------------------
// Payloads de Progressão: Resets, Quests e Master Skill Tree (0x83)
// -----------------------------------------------------------------------------
export interface ResetResPayload {
  success: boolean;
  resets: number;
  level: number;
  statPoints: number;
  zenRemaining: number;
  character?: CharacterSummary;
  error?: string;
}

export interface MasterResetResPayload {
  success: boolean;
  masterResets: number;
  resetsRemaining: number;
  wCoinsGranted: number;
  masterPointsGranted: number;
  character?: CharacterSummary;
  error?: string;
}

export interface QuestInfoResPayload {
  success: boolean;
  characterId: string;
  classTier: number;
  hasComboUnlocked: boolean;
  hasMasterLevelUnlocked: boolean;
  quests: Record<string, { questId: string; completed: boolean; active: boolean; progressCount: number; requiredCount: number }>;
}

export interface QuestActionReqPayload {
  questId: string;
  action: 'START' | 'COMPLETE';
}

export interface QuestActionResPayload {
  success: boolean;
  questId: string;
  completed: boolean;
  classTier: number;
  hasComboUnlocked: boolean;
  statPointsBonus: number;
  message?: string;
  error?: string;
}

export interface MasterSkillAllocReqPayload {
  skillId: string;
}

export interface MasterSkillAllocResPayload {
  success: boolean;
  skillId: string;
  newLevel: number;
  availablePoints: number;
  error?: string;
}

// -----------------------------------------------------------------------------
// Payloads de Famílias Gens (0x84)
// -----------------------------------------------------------------------------
export interface GensJoinReqPayload {
  family: 1 | 2; // 1 = Vanert, 2 = Duprian
}

export interface GensJoinResPayload {
  success: boolean;
  family: number;
  symbol: number;
  contribution: number;
  rank: number;
  error?: string;
}

export interface GensStatusResPayload {
  success: boolean;
  family: number;
  symbol: number;
  contribution: number;
  rank: number;
}

export interface GensLeaveResPayload {
  success: boolean;
  penaltyFeeZen?: number;
  message: string;
  error?: string;
}

// -----------------------------------------------------------------------------
// Payloads de Refinamentos Harmony e Socket (0x85)
// -----------------------------------------------------------------------------
export interface HarmonySmeltReqPayload {
  targetItemUuid: string;
  gemstoneItemUuid?: string;
}

export interface HarmonySmeltResPayload {
  success: boolean;
  targetItemUuid: string;
  optionName?: string;
  optionValue?: number;
  inventoryState?: SerializedInventoryState;
  error?: string;
}

export interface HarmonyRestoreReqPayload {
  targetItemUuid: string;
}

export interface HarmonyRestoreResPayload {
  success: boolean;
  targetItemUuid: string;
  restored: boolean;
  inventoryState?: SerializedInventoryState;
  error?: string;
}

export interface SocketMountReqPayload {
  targetItemUuid: string;
  socketIndex: number;
  seedSphereUuid: string;
}

export interface SocketMountResPayload {
  success: boolean;
  targetItemUuid: string;
  socketIndex: number;
  mountedSphere?: string;
  inventoryState?: SerializedInventoryState;
  error?: string;
}

export interface SocketUnmountReqPayload {
  targetItemUuid: string;
  socketIndex: number;
}

export interface SocketUnmountResPayload {
  success: boolean;
  targetItemUuid: string;
  socketIndex: number;
  unmounted: boolean;
  inventoryState?: SerializedInventoryState;
  error?: string;
}

// -----------------------------------------------------------------------------
// Payloads de Grupo / Social Party (0xB2)
// -----------------------------------------------------------------------------
export interface PartyInviteReqPayload {
  targetSessionId: string;
}

export interface PartyInviteResPayload {
  success: boolean;
  partyId?: string;
  targetSessionId?: string;
  message?: string;
  error?: string;
}

export interface PartyRespondInviteReqPayload {
  partyId: string;
  accept: boolean;
}

export interface PartyRespondInviteResPayload {
  success: boolean;
  partyId: string;
  memberCount: number;
  isGoldParty: boolean;
  members: Array<{ sessionId: string; name: string; className: string; level: number; isLeader?: boolean }>;
  error?: string;
}

export interface PartyLeaveResPayload {
  success: boolean;
  message: string;
}

export interface PartyInfoResPayload {
  partyId: string;
  isGoldParty: boolean;
  memberCount: number;
  members: Array<{ sessionId: string; name: string; className: string; level: number; isLeader?: boolean }>;
}

export interface SerializedInventoryState {
  cols: number;
  rows: number;
  items: {
    item: ItemInstance;
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
  }[];
  equipped: {
    slot: EquipmentSlot;
    item: ItemInstance;
  }[];
}

export interface PacketMessage<T = unknown> {
  opcode: number;
  subcode: number;
  seq: number;
  payload: T;
}

/**
 * Cálculo de CRC16-CCITT (Polinômio 0x1021)
 */
export function calculateCRC16(data: Uint8Array): number {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc;
}

/**
 * Codifica pacote em formato binário C1 (header = 0xC1, tamanho <= 255) ou C2 (tamanho > 255)
 */
export function encodeBinaryPacket(opcode: number, subcode: number, seq: number, payload: object): Buffer {
  const jsonStr = JSON.stringify(payload);
  const payloadBuf = Buffer.from(jsonStr, 'utf-8');
  const payloadLen = payloadBuf.length;

  if (payloadLen + 10 <= 255) {
    // Cabeçalho C1
    const totalLen = payloadLen + 10;
    const buf = Buffer.alloc(totalLen);
    buf.writeUInt8(0xc1, 0);
    buf.writeUInt8(totalLen, 1);
    buf.writeUInt8(opcode, 2);
    buf.writeUInt8(subcode, 3);
    buf.writeUInt32BE(seq, 4);

    // Checksum inicializado como 0 para cálculo
    buf.writeUInt16BE(0, 8);
    payloadBuf.copy(buf, 10);

    const crc = calculateCRC16(buf.subarray(2)); // CRC sobre opcode até o final
    buf.writeUInt16BE(crc, 8);
    return buf;
  } else {
    // Cabeçalho C2
    const totalLen = payloadLen + 12;
    const buf = Buffer.alloc(totalLen);
    buf.writeUInt8(0xc2, 0);
    buf.writeUInt16BE(totalLen, 1);
    buf.writeUInt8(opcode, 3);
    buf.writeUInt8(subcode, 4);
    buf.writeUInt16BE(0, 5); // Checksum temporário
    buf.writeUInt32BE(seq, 7);
    payloadBuf.copy(buf, 11);

    const crc = calculateCRC16(buf.subarray(3));
    buf.writeUInt16BE(crc, 5);
    return buf;
  }
}

/**
 * Decodifica pacote binário C1/C2
 */
export function decodeBinaryPacket(buf: Buffer): PacketMessage | null {
  if (buf.length < 10) return null;
  const header = buf.readUInt8(0);

  if (header === 0xc1) {
    const totalLen = buf.readUInt8(1);
    if (buf.length < totalLen) return null;

    const opcode = buf.readUInt8(2);
    const subcode = buf.readUInt8(3);
    const seq = buf.readUInt32BE(4);
    const checksum = buf.readUInt16BE(8);

    // Valida CRC
    const checkBuf = Buffer.from(buf.subarray(2, totalLen));
    checkBuf.writeUInt16BE(0, 6);
    const expectedCrc = calculateCRC16(checkBuf);
    if (checksum !== expectedCrc) {
      console.warn(`[NetworkProtocol] CRC mismatch: recebido ${checksum}, esperado ${expectedCrc}`);
      // Em dev podemos prosseguir ou registrar aviso
    }

    const payloadRaw = buf.subarray(10, totalLen).toString('utf-8');
    const payload = JSON.parse(payloadRaw);

    return { opcode, subcode, seq, payload };
  } else if (header === 0xc2) {
    if (buf.length < 12) return null;
    const totalLen = buf.readUInt16BE(1);
    if (buf.length < totalLen) return null;

    const opcode = buf.readUInt8(3);
    const subcode = buf.readUInt8(4);
    const checksum = buf.readUInt16BE(5);
    const seq = buf.readUInt32BE(7);

    const checkBuf = Buffer.from(buf.subarray(3, totalLen));
    checkBuf.writeUInt16BE(0, 2);
    const expectedCrc = calculateCRC16(checkBuf);
    if (checksum !== expectedCrc) {
      console.warn(`[NetworkProtocol] C2 CRC mismatch: recebido ${checksum}, esperado ${expectedCrc}`);
    }

    const payloadRaw = buf.subarray(11, totalLen).toString('utf-8');
    const payload = JSON.parse(payloadRaw);

    return { opcode, subcode, seq, payload };
  }

  return null;
}

export interface KalimaPortalSpawnReqPayload {
  lostMapDefId: string;
  x?: number;
  y?: number;
}

export interface KalimaPortalSpawnResPayload {
  success: boolean;
  portalId?: string;
  kalimaLevel?: number;
  durationSeconds?: number;
  x?: number;
  y?: number;
  error?: string;
}

export interface KalimaEnterReqPayload {
  portalId: string;
}

export interface KalimaEnterResPayload {
  success: boolean;
  kalimaLevel?: number;
  targetMap?: string;
  x?: number;
  y?: number;
  error?: string;
}

