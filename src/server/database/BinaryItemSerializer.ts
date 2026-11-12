/**
 * Dasi MMORPG - Webzen Canonical Binary Item Serializer
 * Implementação exata e autoritativa dos empacotadores e desempacotadores de 16 bytes (SQL Database)
 * e 12 bytes (Network Packet) de acordo com o código fonte oficial Webzen Season 5.2 (ItemManager.cpp).
 * 
 * Formato DB (16 Bytes por Item):
 * - Byte 0: Index Low (0..255)
 * - Byte 1: Skill (bit 7), Level 0..15 (bits 3..6), Luck (bit 2), Option3 Low (bits 0..1)
 * - Byte 2: Durability (0..255)
 * - Bytes 3-6: 32-bit Item Serial Number (Big-Endian)
 * - Byte 7: Index bit 8 (0x80), Option3 High (0x40), Excellent Option Mask (bits 0..5)
 * - Byte 8: Ancient Set Option (bits 0..3)
 * - Byte 9: Index bits 9..12 (bits 4..7), 380 Option (bit 3: 0x08), Periodic (bit 1), Expired (bit 2)
 * - Byte 10: Jewel of Harmony Option ((OptionId << 4) | OptionRank) ou Socket Bonus
 * - Bytes 11-15: 5 Slots de Socket (0xFF = vazio)
 * 
 * Tamanhos Canônicos:
 * - Inventory: 108 slots * 16 bytes = 1.728 bytes (VARBINARY(1728))
 * - Warehouse: 240 slots * 16 bytes = 3.840 bytes (VARBINARY(3840))
 */

import type { ItemInstance, PlacedItem } from '../inventory/types.ts';
import { ITEM_DEFINITIONS } from '../inventory/definitions.ts';

/**
 * Mapeamento canônico entre string defId e ItemIndex numérico Webzen (Section * 512 + Type)
 */
export const ITEM_INDEX_BY_DEF_ID: Record<string, number> = {
  // Swords (Section 0)
  short_sword: 0 * 512 + 0,
  blade: 0 * 512 + 3,
  broad_sword: 0 * 512 + 5,
  crystal_sword: 0 * 512 + 10,
  dragon_blade: 0 * 512 + 14,
  sword_of_destruction: 0 * 512 + 16,
  archangel_sword: 0 * 512 + 19,
  knight_blade: 0 * 512 + 20,
  bone_blade: 0 * 512 + 22,
  explosion_blade: 0 * 512 + 23,

  // Axes / Maces (Section 1 / 2)
  chaos_dragon_axe: 1 * 512 + 6,
  soleil_scepter: 2 * 512 + 14,

  // Bows / Crossbows (Section 4)
  short_bow: 4 * 512 + 0,
  elven_bow: 4 * 512 + 2,
  battle_bow: 4 * 512 + 3,
  tiger_bow: 4 * 512 + 4,
  silver_bow: 4 * 512 + 5,
  chaos_nature_bow: 4 * 512 + 6,
  celestial_bow: 4 * 512 + 7,
  arrow_viper_bow: 4 * 512 + 16,
  great_reign_crossbow: 4 * 512 + 17,
  saint_crossbow: 4 * 512 + 18,
  archangel_crossbow: 4 * 512 + 19,
  sylph_wind_bow: 4 * 512 + 21,

  // Staffs (Section 5)
  skull_staff: 5 * 512 + 0,
  angelic_staff: 5 * 512 + 1,
  serpent_staff: 5 * 512 + 2,
  thunder_sword: 5 * 512 + 3,
  gorgon_staff: 5 * 512 + 4,
  legendary_staff: 5 * 512 + 5,
  resurrection_staff: 5 * 512 + 6,
  chaos_lightning_staff: 5 * 512 + 7,
  kundun_staff: 5 * 512 + 9,
  archangel_staff: 5 * 512 + 10,
  grand_viper_staff: 5 * 512 + 12,

  // Shields (Section 6)
  dragon_shield: 6 * 512 + 9,

  // Helms (Section 7)
  dragon_helm: 7 * 512 + 1,
  black_dragon_helm: 7 * 512 + 16,
  great_dragon_helm: 7 * 512 + 21,
  bone_helm: 7 * 512 + 4,
  guardian_helm: 7 * 512 + 8,
  dragon_knight_helm: 7 * 512 + 29,
  venom_mist_helm: 7 * 512 + 30,
  sylpid_ray_helm: 7 * 512 + 31,
  sunlight_helm: 7 * 512 + 33,
  storm_crow_helm: 7 * 512 + 43,

  // Armors (Section 8)
  dragon_armor: 8 * 512 + 1,
  black_dragon_armor: 8 * 512 + 16,
  great_dragon_armor: 8 * 512 + 21,
  bone_armor: 8 * 512 + 4,
  guardian_armor: 8 * 512 + 8,
  dragon_knight_armor: 8 * 512 + 29,
  venom_mist_armor: 8 * 512 + 30,
  sylpid_ray_armor: 8 * 512 + 31,
  volcano_armor: 8 * 512 + 32,
  sunlight_armor: 8 * 512 + 33,
  storm_crow_armor: 8 * 512 + 43,

  // Pants (Section 9)
  dragon_pants: 9 * 512 + 1,
  black_dragon_pants: 9 * 512 + 16,
  great_dragon_pants: 9 * 512 + 21,
  bone_pants: 9 * 512 + 4,
  guardian_pants: 9 * 512 + 8,
  dragon_knight_pants: 9 * 512 + 29,
  venom_mist_pants: 9 * 512 + 30,
  sylpid_ray_pants: 9 * 512 + 31,
  volcano_pants: 9 * 512 + 32,
  sunlight_pants: 9 * 512 + 33,
  storm_crow_pants: 9 * 512 + 43,

  // Gloves (Section 10)
  dragon_gloves: 10 * 512 + 1,
  black_dragon_gloves: 10 * 512 + 16,
  great_dragon_gloves: 10 * 512 + 21,
  bone_gloves: 10 * 512 + 4,
  guardian_gloves: 10 * 512 + 8,
  dragon_knight_gloves: 10 * 512 + 29,
  venom_mist_gloves: 10 * 512 + 30,
  sylpid_ray_gloves: 10 * 512 + 31,
  volcano_gloves: 10 * 512 + 32,
  sunlight_gloves: 10 * 512 + 33,
  storm_crow_gloves: 10 * 512 + 43,

  // Boots (Section 11)
  dragon_boots: 11 * 512 + 1,
  black_dragon_boots: 11 * 512 + 16,
  great_dragon_boots: 11 * 512 + 21,
  bone_boots: 11 * 512 + 4,
  guardian_boots: 11 * 512 + 8,
  dragon_knight_boots: 11 * 512 + 29,
  venom_mist_boots: 11 * 512 + 30,
  sylpid_ray_boots: 11 * 512 + 31,
  volcano_boots: 11 * 512 + 32,
  sunlight_boots: 11 * 512 + 33,
  storm_crow_boots: 11 * 512 + 43,

  // Wings (Section 12)
  wings_of_dragon: 12 * 512 + 2,

  // Pets & Helpers (Section 13)
  guardian_angel: 13 * 512 + 0,
  horn_of_uniria: 13 * 512 + 2,
  dinorant: 13 * 512 + 3,
  fenrir_red: 13 * 512 + 37,
  fenrir_black: 13 * 512 + 37,
  fenrir_blue: 13 * 512 + 37,
  fenrir_gold: 13 * 512 + 37,

  // Jewels & Consumables (Section 14)
  jewel_of_chaos: 14 * 512 + 15,
  jewel_of_blessing: 14 * 512 + 13,
  jewel_of_soul: 14 * 512 + 14,
  jewel_of_life: 14 * 512 + 16,
  jewel_of_creation: 14 * 512 + 22,
  jewel_of_guardian: 14 * 512 + 31,
  gemstone: 14 * 512 + 41,
  jewel_of_harmony: 14 * 512 + 42,
  lower_refining_stone: 14 * 512 + 43,
  higher_refining_stone: 14 * 512 + 44,
};

export const DEF_ID_BY_ITEM_INDEX: Record<number, string> = {};
for (const [defId, idx] of Object.entries(ITEM_INDEX_BY_DEF_ID)) {
  DEF_ID_BY_ITEM_INDEX[idx] = defId;
}

export class BinaryItemSerializer {
  public static readonly DB_ITEM_SIZE = 16;
  public static readonly PACKET_ITEM_SIZE = 12;
  public static readonly INVENTORY_MAX_SLOTS = 108; // 12 equip + 64 main + 32 ext
  public static readonly WAREHOUSE_MAX_SLOTS = 240; // 120 main + 120 ext

  /**
   * Converte uma instância de item em buffer canônico de 16 bytes para SQL Database
   */
  public static serializeItem16(item: ItemInstance | null, customSerial?: number): Buffer {
    const buf = Buffer.alloc(this.DB_ITEM_SIZE);

    if (!item) {
      buf.fill(0xff);
      return buf;
    }

    const itemIndex = ITEM_INDEX_BY_DEF_ID[item.defId] ?? 0;
    const serial = customSerial !== undefined ? customSerial : (item.serial ?? 0);
    const jolOption = Math.floor((item.optionLevel || 0) / 4); // 0..7 (+0..+28)

    // Byte 0: Index Low
    buf[0] = itemIndex & 0xff;

    // Byte 1: Skill (bit 7), Level (bits 3-6), Luck (bit 2), Option3 Low (bits 0-1)
    let b1 = 0;
    b1 |= (item.level & 0x0f) * 8;
    b1 |= (item.skill ? 1 : 0) * 128;
    b1 |= (item.luck ? 1 : 0) * 4;
    b1 |= jolOption & 3;
    buf[1] = b1;

    // Byte 2: Durability
    buf[2] = Math.min(255, Math.floor(item.durability || 0));

    // Bytes 3-6: 32-bit Serial Number (Big-Endian)
    buf[3] = (serial >>> 24) & 0xff;
    buf[4] = (serial >>> 16) & 0xff;
    buf[5] = (serial >>> 8) & 0xff;
    buf[6] = serial & 0xff;

    // Byte 7: Index bit 8 (0x80), Option3 High (0x40), Excellent Option Mask (bits 0..5)
    let b7 = 0;
    b7 |= (itemIndex & 256) >> 1; // bit 8 de Index vai para bit 7 (0x80)
    b7 |= jolOption > 3 ? 64 : 0; // bit 2 de JoL Option vai para bit 6 (0x40)
    b7 |= (item.excellentMask || 0) & 0x3f;
    buf[7] = b7;

    // Byte 8: Ancient Set Option (bits 0..3)
    buf[8] = (item.ancientOption || 0) & 0x0f;

    // Byte 9: Index bits 9..12 (bits 4..7), 380 Option (bit 3: 0x08)
    let b9 = 0;
    b9 |= (itemIndex & (15 * 512)) >> 5; // bits 9-12 do índice
    b9 |= item.itemOption380 ? 0x08 : 0; // 380 Option bit 3
    buf[9] = b9;

    // Byte 10: Jewel of Harmony Option
    if (item.harmonyOption && (item.harmonyOption as any).id) {
      const optId = (item.harmonyOption as any).id & 0x0f;
      const rank = (item.harmonyOption.level || 0) & 0x0f;
      buf[10] = (optId << 4) | rank;
    } else {
      buf[10] = 0;
    }

    // Bytes 11-15: Sockets (0xFF = vazio)
    if (item.socketOptions && item.socketOptions.length === 5) {
      for (let s = 0; s < 5; s++) buf[11 + s] = item.socketOptions[s];
    } else {
      buf.fill(0xff, 11, 16);
    }

    return buf;
  }

  /**
   * Converte 16 bytes da base de dados de volta para ItemInstance
   */
  public static deserializeItem16(buf: Buffer, offset: number = 0): {
    item: ItemInstance;
    itemIndex: number;
    serial: number;
  } | null {
    if (offset + this.DB_ITEM_SIZE > buf.length) return null;

    // Verificação de slot vazio canônica
    if (buf[offset] === 0xff && (buf[offset + 7] & 0x80) === 0x80 && (buf[offset + 9] & 0xf0) === 0xf0) {
      return null;
    }
    if (buf[offset] === 0xff && buf[offset + 1] === 0xff && buf[offset + 2] === 0xff) {
      return null;
    }

    const b0 = buf[offset];
    const b1 = buf[offset + 1];
    const b2 = buf[offset + 2];
    const b3 = buf[offset + 3];
    const b4 = buf[offset + 4];
    const b5 = buf[offset + 5];
    const b6 = buf[offset + 6];
    const b7 = buf[offset + 7];
    const b8 = buf[offset + 8];
    const b9 = buf[offset + 9];
    const b10 = buf[offset + 10];

    // Reconstrução do ItemIndex (0..8191)
    const itemIndex = b0 | ((b9 & 0xf0) * 32) | ((b7 & 0x80) * 2);
    const defId = DEF_ID_BY_ITEM_INDEX[itemIndex] || `unknown_item_${itemIndex}`;

    const skill = ((b1 / 128) & 1) === 1;
    const luck = ((b1 / 4) & 1) === 1;
    const jolOption = (b1 & 3) + ((b7 & 64) / 16); // 0..7
    const level = (b1 / 8) & 15;
    const durability = b2;
    const serial = ((b3 << 24) | (b4 << 16) | (b5 << 8) | b6) >>> 0;
    const excellentMask = b7 & 0x3f;
    const ancientOption = b8 & 0x0f;
    const itemOption380 = (b9 & 0x08) !== 0;

    let harmonyOption = null;
    if (b10 > 0) {
      const optId = (b10 & 0xf0) >> 4;
      const rank = b10 & 0x0f;
      harmonyOption = {
        type: `HARMONY_OPT_${optId}` as any,
        level: rank,
        value: 0,
      };
      (harmonyOption as any).id = optId;
    }

    const socketOptions = [
      buf[offset + 11],
      buf[offset + 12],
      buf[offset + 13],
      buf[offset + 14],
      buf[offset + 15],
    ];

    const def = ITEM_DEFINITIONS[defId];
    const maxDur = def ? def.baseDurability + level : 255;

    const item: ItemInstance = {
      uuid: `bin-${serial || Date.now()}-${offset}`,
      defId,
      level,
      durability,
      maxDurability: maxDur,
      skill,
      luck,
      optionLevel: jolOption * 4,
      excellentMask,
      ancientOption,
      itemOption380,
      harmonyOption,
      socketOptions,
      serial,
    };

    return { item, itemIndex, serial };
  }

  /**
   * Serializa um inventário completo (108 slots * 16 bytes = 1.728 bytes)
   */
  public static serializeInventory(items: PlacedItem[], maxSlots: number = this.INVENTORY_MAX_SLOTS): Buffer {
    const totalBytes = maxSlots * this.DB_ITEM_SIZE;
    const buffer = Buffer.alloc(totalBytes, 0xff);

    for (let slot = 0; slot < items.length && slot < maxSlots; slot++) {
      const placed = items[slot];
      if (placed && placed.item) {
        const itemBuf = this.serializeItem16(placed.item);
        itemBuf.copy(buffer, slot * this.DB_ITEM_SIZE);
      }
    }

    return buffer;
  }

  /**
   * Deserializa um inventário completo a partir do buffer SQL VARBINARY(1728)
   */
  public static deserializeInventory(buffer: Buffer, maxSlots: number = this.INVENTORY_MAX_SLOTS): (PlacedItem | null)[] {
    const slots: (PlacedItem | null)[] = [];

    for (let slot = 0; slot < maxSlots; slot++) {
      const offset = slot * this.DB_ITEM_SIZE;
      if (offset + this.DB_ITEM_SIZE > buffer.length) break;

      const deserialized = this.deserializeItem16(buffer, offset);
      if (deserialized) {
        const def = ITEM_DEFINITIONS[deserialized.item.defId];
        const w = def ? def.width : 1;
        const h = def ? def.height : 1;
        slots.push({
          item: deserialized.item,
          x: slot % 8,
          y: Math.floor(slot / 8),
          width: w,
          height: h,
        });
      } else {
        slots.push(null);
      }
    }

    return slots;
  }

  /**
   * Serializa uma Warehouse (Baú) completo (240 slots * 16 bytes = 3.840 bytes)
   */
  public static serializeWarehouse(items: PlacedItem[], maxSlots: number = this.WAREHOUSE_MAX_SLOTS): Buffer {
    return this.serializeInventory(items, maxSlots);
  }

  /**
   * Deserializa uma Warehouse (Baú) completo a partir de buffer SQL VARBINARY(3840)
   */
  public static deserializeWarehouse(buffer: Buffer, maxSlots: number = this.WAREHOUSE_MAX_SLOTS): (PlacedItem | null)[] {
    return this.deserializeInventory(buffer, maxSlots);
  }

  /**
   * Converte uma instância de item em buffer de 12 bytes para pacotes de rede (CItemManager::ItemByteConvert)
   */
  public static serializeItemPacket12(item: ItemInstance | null): Buffer {
    const buf = Buffer.alloc(this.PACKET_ITEM_SIZE, 0xff);
    if (!item) return buf;

    const itemIndex = ITEM_INDEX_BY_DEF_ID[item.defId] ?? 0;
    const jolOption = Math.floor((item.optionLevel || 0) / 4);

    buf[0] = itemIndex & 0xff;

    let b1 = 0;
    b1 |= (item.level & 0x0f) * 8;
    b1 |= (item.skill ? 1 : 0) * 128;
    b1 |= (item.luck ? 1 : 0) * 4;
    b1 |= jolOption & 3;
    buf[1] = b1;

    buf[2] = Math.min(255, Math.floor(item.durability || 0));

    let b3 = 0;
    b3 |= (itemIndex & 256) >> 1;
    b3 |= jolOption > 3 ? 64 : 0;
    b3 |= (item.excellentMask || 0) & 0x3f;
    buf[3] = b3;

    buf[4] = (item.ancientOption || 0) & 0x0f;

    let b5 = 0;
    b5 |= (itemIndex & (15 * 512)) >> 5;
    b5 |= item.itemOption380 ? 0x08 : 0;
    buf[5] = b5;

    if (item.harmonyOption && (item.harmonyOption as any).id) {
      const optId = (item.harmonyOption as any).id & 0x0f;
      const rank = (item.harmonyOption.level || 0) & 0x0f;
      buf[6] = (optId << 4) | rank;
    } else {
      buf[6] = 0;
    }

    if (item.socketOptions && item.socketOptions.length === 5) {
      for (let s = 0; s < 5; s++) buf[7 + s] = item.socketOptions[s];
    } else {
      buf.fill(0xff, 7, 12);
    }

    return buf;
  }
}
