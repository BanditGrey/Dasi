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
  BOSS_SYSTEM: 0x80,
  EVENT_ARENA: 0x81,
  DUNGEON_SYSTEM: 0x82,
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

  // Dungeon System (0x82)
  MSG_DUNGEON_ENTER_REQ: { opcode: 0x82, subcode: 0x01 },
  MSG_DUNGEON_ENTER_RES: { opcode: 0x82, subcode: 0x02 },
  MSG_DUNGEON_PROGRESS_REQ: { opcode: 0x82, subcode: 0x03 },
  MSG_DUNGEON_PROGRESS_RES: { opcode: 0x82, subcode: 0x04 },
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
