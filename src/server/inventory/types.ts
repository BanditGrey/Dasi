/**
 * Dasi MMORPG - Tipos e Interfaces do Sistema de Inventário e Itens
 * Arquitetura inspirada no Continent of Legend (MU Online) com padrões modernos.
 */

export const ItemCategory = {
  WEAPON: 'WEAPON',
  SHIELD: 'SHIELD',
  HELM: 'HELM',
  ARMOR: 'ARMOR',
  PANTS: 'PANTS',
  GLOVES: 'GLOVES',
  BOOTS: 'BOOTS',
  WING: 'WING',
  HELPER: 'HELPER',
  RING: 'RING',
  PENDANT: 'PENDANT',
  JEWEL: 'JEWEL',
  CONSUMABLE: 'CONSUMABLE',
  EVENT: 'EVENT',
  BOX: 'BOX',
} as const;

export type ItemCategory = typeof ItemCategory[keyof typeof ItemCategory];

export const EquipmentSlot = {
  HELM: 'HELM',
  ARMOR: 'ARMOR',
  PANTS: 'PANTS',
  GLOVES: 'GLOVES',
  BOOTS: 'BOOTS',
  WEAPON_RIGHT: 'WEAPON_RIGHT', // Mão principal
  WEAPON_LEFT: 'WEAPON_LEFT',   // Mão secundária ou Escudo
  WINGS: 'WINGS',
  HELPER: 'HELPER',             // Fairy, Horn of Uniria, Dinorant, Dark Raven
  PENDANT: 'PENDANT',
  RING_RIGHT: 'RING_RIGHT',
  RING_LEFT: 'RING_LEFT',
} as const;

export type EquipmentSlot = typeof EquipmentSlot[keyof typeof EquipmentSlot];

export const JewelType = {
  BLESSING: 'BLESSING',
  SOUL: 'SOUL',
  LIFE: 'LIFE',
  CHAOS: 'CHAOS',
  CREATION: 'CREATION',
  HARMONY: 'HARMONY',
} as const;

export type JewelType = typeof JewelType[keyof typeof JewelType];

/**
 * Bitmask de Opções Excelentes (Armas)
 */
export const WeaponExcellentOption = {
  MANA_PER_KILL: 1 << 0,          // Recupera Mana/8 ao derrotar monstro
  HP_PER_KILL: 1 << 1,            // Recupera Vida/8 ao derrotar monstro
  ATTACK_SPEED_7: 1 << 2,         // Velocidade de Ataque +7
  INCREASE_DMG_2_PERCENT: 1 << 3, // Dano Aumentado em +2%
  INCREASE_DMG_PER_LEVEL: 1 << 4, // Dano Aumentado em +Nível / 20
  EXCELLENT_DAMAGE_10_PCT: 1 << 5,// Taxa de Dano Excelente +10% (Dano Verde Neon)
} as const;

/**
 * Bitmask de Opções Excelentes (Armaduras e Escudos)
 */
export const ArmorExcellentOption = {
  ZEN_30_PERCENT: 1 << 0,         // Zen adicional de monstros +30%
  DEFENSE_RATE_10_PCT: 1 << 1,    // Taxa de Sucesso de Defesa +10%
  REFLECT_DAMAGE_5_PCT: 1 << 2,   // Dano Refletido +5%
  DAMAGE_DECREASE_4_PCT: 1 << 3,  // Dano Recebido Diminuído em 4%
  INCREASE_MANA_4_PCT: 1 << 4,    // Mana Máxima +4%
  INCREASE_HP_4_PCT: 1 << 5,      // Vida Máxima +4%
} as const;

export const HarmonyOptionType = {
  MIN_ATTACK_POWER: 'MIN_ATTACK_POWER',
  MAX_ATTACK_POWER: 'MAX_ATTACK_POWER',
  CRITICAL_DAMAGE: 'CRITICAL_DAMAGE',
  ATTACK_SPEED: 'ATTACK_SPEED',
  DEFENSE_POWER: 'DEFENSE_POWER',
  MAX_HP: 'MAX_HP',
  DAMAGE_DECREASE: 'DAMAGE_DECREASE',
  SD_RATIO: 'SD_RATIO',
} as const;

export type HarmonyOptionType = typeof HarmonyOptionType[keyof typeof HarmonyOptionType];

export interface HarmonyOption {
  type: HarmonyOptionType;
  level: number; // Nível da opção amarela (1 a 13)
  value: number; // Valor numérico do bônus
}

/**
 * Requisitos de equipamento. Apenas os atributos exigidos pelo item são
 * declarados (ex.: cajados exigem Energia, espadas exigem Força/Agilidade).
 * Atributos ausentes são tratados como 0.
 */
export interface ItemRequirements {
  strength?: number;
  agility?: number;
  vitality?: number;
  energy?: number;
  command?: number;
  level?: number;
  allowedClasses?: string[]; // DK, DW, ELF, MG, DL, etc.
}

export interface ItemDefinition {
  id: string;               // Ex: 'dragon_blade', 'dragon_armor', 'jewel_bless'
  name: string;
  category: ItemCategory;
  width: number;            // 1 a 2
  height: number;           // 1 a 4
  baseDurability: number;
  minDamage?: number;
  maxDamage?: number;
  defense?: number;
  defenseRate?: number;
  attackSpeed?: number;
  isTwoHanded?: boolean;
  validEquipSlots?: EquipmentSlot[];
  requirements: ItemRequirements;
}

export interface ItemInstance {
  uuid: string;             // Identificador único persistente (UUIDv4)
  defId: string;            // Referência à definição base (ItemDefinition.id)
  level: number;            // 0 a 15
  durability: number;       // Atual
  maxDurability: number;    // Base + bônus de nível
  skill: boolean;           // Possui habilidade de arma
  luck: boolean;            // +25% Crítico e +5% em forja
  optionLevel: number;      // Opção da Joia da Vida (+0, +4, +8, +12, +16, +20, +24, +28)
  excellentMask: number;    // Bitmask de opções excelentes
  harmonyOption?: HarmonyOption | null;
  itemOption380?: boolean;
  ancientOption?: number;
  socketOptions?: number[];
  socketBonusOption?: number;
  serial?: number;
  rotated?: boolean;        // Orientação no grid (se rotacionado, width e height invertem)
}

export interface PlacedItem {
  item: ItemInstance;
  x: number;                // Coordenada Coluna (0 a 7)
  y: number;                // Coordenada Linha (0 a 7)
  width: number;            // Largura efetiva considerando rotação
  height: number;           // Altura efetiva considerando rotação
}

export interface GridDimensions {
  cols: number; // Padrão: 8
  rows: number; // Padrão: 8
}

export const UpgradeOutcome = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  LEVEL_DOWN: 'LEVEL_DOWN',
  DESTROYED: 'DESTROYED',
  NO_EFFECT: 'NO_EFFECT',
  INVALID_TARGET: 'INVALID_TARGET',
} as const;

export type UpgradeOutcome = typeof UpgradeOutcome[keyof typeof UpgradeOutcome];

export interface UpgradeResult {
  outcome: UpgradeOutcome;
  previousLevel: number;
  newLevel: number;
  previousOption?: number;
  newOption?: number;
  message: string;
  itemDestroyed: boolean;
}
