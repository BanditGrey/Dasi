/**
 * Dasi MMORPG - Harmony and Level 380 PvP System
 * Engenharia reversa e implementação canônica baseada nas fontes Webzen C++ GameServer:
 * - JewelOfHarmonyOption.h / .cpp
 * - JewelOfHarmonyType.h / .cpp
 * - 380ItemOption.h / .cpp
 * - 380ItemType.h / .cpp
 * - ChaosBox.cpp (JewelOfHarmonyItemPurityMix, JewelOfHarmonyItemSmeltMix, JewelOfHarmonyItemRestoreMix, Item380Mix)
 */

import type { ItemInstance } from './types.ts';
import { ITEM_DEFINITIONS } from './definitions.ts';

export const JewelOfHarmonyItemType = {
  NONE: 0,
  WEAPON: 1,
  STAFF: 2,
  ARMOR: 3,
} as const;

export type JewelOfHarmonyItemType = typeof JewelOfHarmonyItemType[keyof typeof JewelOfHarmonyItemType];

export interface HarmonyOptionDef {
  id: number;
  name: string;
  rate: number;
  minLevel: number;
  values: number[]; // 16 patamares (ranks 0..15)
  money: number[];  // Custo de restauração em Zen
}

// -----------------------------------------------------------------------------
// Tabelas Canônicas de Opções (JewelOfHarmonyOption.txt)
// -----------------------------------------------------------------------------
export const HARMONY_WEAPON_OPTIONS: Record<number, HarmonyOptionDef> = {
  1: {
    id: 1,
    name: 'Add Min Physi Damage',
    rate: 50,
    minLevel: 0,
    values: [2, 3, 4, 5, 6, 7, 9, 11, 12, 14, 15, 16, 17, 20, 20, 20],
    money: [100000, 110000, 120000, 130000, 140000, 150000, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  2: {
    id: 2,
    name: 'Add Max Physi Damage',
    rate: 50,
    minLevel: 0,
    values: [3, 4, 5, 6, 7, 8, 10, 12, 14, 17, 20, 23, 26, 29, 29, 29],
    money: [100000, 110000, 120000, 130000, 140000, 150000, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  3: {
    id: 3,
    name: 'Sub Require Strength',
    rate: 40,
    minLevel: 0,
    values: [6, 8, 10, 12, 14, 16, 20, 23, 26, 29, 32, 35, 37, 40, 40, 40],
    money: [100000, 110000, 120000, 130000, 140000, 150000, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  4: {
    id: 4,
    name: 'Sub Require Dexterity',
    rate: 40,
    minLevel: 0,
    values: [6, 8, 10, 12, 14, 16, 20, 23, 26, 29, 32, 35, 37, 40, 40, 40],
    money: [100000, 110000, 120000, 130000, 140000, 150000, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  5: {
    id: 5,
    name: 'Add Physi Damage',
    rate: 30,
    minLevel: 6,
    values: [0, 0, 0, 0, 0, 0, 7, 8, 9, 11, 12, 14, 16, 19, 19, 19],
    money: [0, 0, 0, 0, 0, 0, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  6: {
    id: 6,
    name: 'Add Critical Damage',
    rate: 30,
    minLevel: 6,
    values: [0, 0, 0, 0, 0, 0, 12, 14, 16, 18, 20, 22, 24, 30, 30, 30],
    money: [0, 0, 0, 0, 0, 0, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  7: {
    id: 7,
    name: 'Add Skill Damage',
    rate: 20,
    minLevel: 9,
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 14, 16, 18, 22, 22, 22],
    money: [0, 0, 0, 0, 0, 0, 0, 0, 0, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  8: {
    id: 8,
    name: 'Add Attack Success Rate PvP',
    rate: 20,
    minLevel: 9,
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 7, 9, 11, 14, 14, 14],
    money: [0, 0, 0, 0, 0, 0, 0, 0, 0, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  9: {
    id: 9,
    name: 'Sub SD Rate',
    rate: 20,
    minLevel: 9,
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 5, 7, 9, 10, 10, 10],
    money: [0, 0, 0, 0, 0, 0, 0, 0, 0, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  10: {
    id: 10,
    name: 'Add SD Ignore Rate',
    rate: 10,
    minLevel: 13,
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 10, 10],
    money: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 500000, 500000, 500000],
  },
};

export const HARMONY_STAFF_OPTIONS: Record<number, HarmonyOptionDef> = {
  1: {
    id: 1,
    name: 'Add Magic Damage',
    rate: 50,
    minLevel: 0,
    values: [6, 8, 10, 12, 14, 16, 17, 18, 19, 21, 23, 25, 27, 31, 31, 31],
    money: [100000, 110000, 120000, 130000, 140000, 150000, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  2: {
    id: 2,
    name: 'Sub Require Strength',
    rate: 40,
    minLevel: 0,
    values: [6, 8, 10, 12, 14, 16, 20, 23, 26, 29, 32, 35, 37, 40, 40, 40],
    money: [100000, 110000, 120000, 130000, 140000, 150000, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  3: {
    id: 3,
    name: 'Sub Require Dexterity',
    rate: 40,
    minLevel: 0,
    values: [6, 8, 10, 12, 14, 16, 20, 23, 26, 29, 32, 35, 37, 40, 40, 40],
    money: [100000, 110000, 120000, 130000, 140000, 150000, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  4: {
    id: 4,
    name: 'Add Skill Damage',
    rate: 30,
    minLevel: 6,
    values: [0, 0, 0, 0, 0, 0, 7, 10, 13, 16, 19, 22, 25, 30, 30, 30],
    money: [0, 0, 0, 0, 0, 0, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  5: {
    id: 5,
    name: 'Add Critical Damage',
    rate: 30,
    minLevel: 6,
    values: [0, 0, 0, 0, 0, 0, 10, 12, 14, 16, 18, 20, 22, 28, 28, 28],
    money: [0, 0, 0, 0, 0, 0, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  6: {
    id: 6,
    name: 'Sub SD Rate',
    rate: 20,
    minLevel: 9,
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 6, 8, 10, 13, 13, 13],
    money: [0, 0, 0, 0, 0, 0, 0, 0, 0, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  7: {
    id: 7,
    name: 'Add Attack Success Rate PvP',
    rate: 20,
    minLevel: 9,
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 7, 9, 11, 14, 14, 14],
    money: [0, 0, 0, 0, 0, 0, 0, 0, 0, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  8: {
    id: 8,
    name: 'Add SD Ignore Rate',
    rate: 10,
    minLevel: 13,
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 15, 15],
    money: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 500000, 500000, 500000],
  },
};

export const HARMONY_ARMOR_OPTIONS: Record<number, HarmonyOptionDef> = {
  1: {
    id: 1,
    name: 'Add Defense',
    rate: 50,
    minLevel: 0,
    values: [3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 22, 25, 25, 25],
    money: [100000, 110000, 120000, 130000, 140000, 150000, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  2: {
    id: 2,
    name: 'Add Max BP',
    rate: 40,
    minLevel: 3,
    values: [0, 0, 0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 25, 25],
    money: [0, 0, 0, 130000, 140000, 150000, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  3: {
    id: 3,
    name: 'Add Max HP',
    rate: 40,
    minLevel: 3,
    values: [0, 0, 0, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 30, 30, 30],
    money: [0, 0, 0, 130000, 140000, 150000, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  4: {
    id: 4,
    name: 'Add HP Recovery',
    rate: 30,
    minLevel: 6,
    values: [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8],
    money: [0, 0, 0, 0, 0, 0, 200000, 220000, 240000, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  5: {
    id: 5,
    name: 'Add MP Recovery',
    rate: 20,
    minLevel: 9,
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 5, 5],
    money: [0, 0, 0, 0, 0, 0, 0, 0, 0, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  6: {
    id: 6,
    name: 'Add Defense Success Rate PvP',
    rate: 20,
    minLevel: 9,
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 4, 5, 6, 8, 8, 8],
    money: [0, 0, 0, 0, 0, 0, 0, 0, 0, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  7: {
    id: 7,
    name: 'Add Damage Reduction',
    rate: 20,
    minLevel: 9,
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 4, 5, 6, 7, 7, 7],
    money: [0, 0, 0, 0, 0, 0, 0, 0, 0, 280000, 320000, 360000, 400000, 500000, 500000, 500000],
  },
  8: {
    id: 8,
    name: 'Add SD Rate',
    rate: 10,
    minLevel: 13,
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5],
    money: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 500000, 500000, 500000],
  },
};

// -----------------------------------------------------------------------------
// Tabela de Itens Nível 380 Canônicos
// -----------------------------------------------------------------------------
export const CANONICAL_380_ITEMS = new Set([
  // Armas 380
  'bone_blade',
  'grand_viper_staff',
  'sylph_wind_bow',
  'explosion_blade',
  'soleil_scepter',
  // Sets 380
  'dragon_knight_helm', 'dragon_knight_armor', 'dragon_knight_pants', 'dragon_knight_gloves', 'dragon_knight_boots',
  'venom_mist_helm', 'venom_mist_armor', 'venom_mist_pants', 'venom_mist_gloves', 'venom_mist_boots',
  'sylpid_ray_helm', 'sylpid_ray_armor', 'sylpid_ray_pants', 'sylpid_ray_gloves', 'sylpid_ray_boots',
  'volcano_armor', 'volcano_pants', 'volcano_gloves', 'volcano_boots',
  'sunlight_helm', 'sunlight_armor', 'sunlight_pants', 'sunlight_gloves', 'sunlight_boots',
  'storm_crow_helm', 'storm_crow_armor', 'storm_crow_pants', 'storm_crow_gloves', 'storm_crow_boots',
]);

export interface Level380PvPBonus {
  attackSuccessRatePvP?: number;
  damagePvP?: number;
  defenseSuccessRatePvP?: number;
  defensePvP?: number;
  maxHp?: number;
  maxSd?: number;
  sdRecoveryType?: number;
  sdRecoveryRate?: number;
}

export class HarmonyAnd380System {
  /**
   * Determina o tipo de equipamento para opções Harmony:
   * 1: Weapon (Espadas, Machados, Clavas, Lanças, Arcos)
   * 2: Staff (Cajados de Mago / Invocadora)
   * 3: Armor (Helm, Armor, Pants, Gloves, Boots, Shields)
   */
  public static getHarmonyItemType(defId: string): JewelOfHarmonyItemType {
    const def = ITEM_DEFINITIONS[defId];
    if (!def) return JewelOfHarmonyItemType.NONE;

    if (def.category === 'WEAPON') {
      if (defId.includes('staff')) {
        return JewelOfHarmonyItemType.STAFF;
      }
      return JewelOfHarmonyItemType.WEAPON;
    }

    if (
      def.category === 'HELM' ||
      def.category === 'ARMOR' ||
      def.category === 'PANTS' ||
      def.category === 'GLOVES' ||
      def.category === 'BOOTS' ||
      def.category === 'SHIELD'
    ) {
      return JewelOfHarmonyItemType.ARMOR;
    }

    return JewelOfHarmonyItemType.NONE;
  }

  /**
   * Refinamento de Gemstone em Jewel of Harmony na NPC Elpis (Kanturu Tower of Refinement)
   * Taxa canônica Webzen: 80% de chance de sucesso.
   */
  public static refineGemstone(randomRoll: number = Math.random()): {
    success: boolean;
    resultItemDefId: string | null;
  } {
    const successRate = 0.80; // 80%
    if (randomRoll < successRate) {
      return { success: true, resultItemDefId: 'jewel_of_harmony' };
    }
    return { success: false, resultItemDefId: null };
  }

  /**
   * Fundição de Equipamentos para gerar Pedras de Refinamento no NPC Osborne
   * - Item Comum/Excelente elegível -> 50% Lower Refining Stone (comum) / 80% Higher Refining Stone (excelente)
   * - Sets Ancient ou itens já harmonizados não podem ser fundidos
   */
  public static smeltItem(
    item: ItemInstance,
    randomRoll: number = Math.random()
  ): {
    success: boolean;
    resultItemDefId: string | null;
    message: string;
  } {
    if (item.harmonyOption && item.harmonyOption.level >= 0) {
      return { success: false, resultItemDefId: null, message: 'Item com opção Harmony não pode ser fundido' };
    }
    if (item.ancientOption && item.ancientOption > 0) {
      return { success: false, resultItemDefId: null, message: 'Itens Ancient não podem ser fundidos' };
    }

    const type = this.getHarmonyItemType(item.defId);
    if (type === JewelOfHarmonyItemType.NONE) {
      return { success: false, resultItemDefId: null, message: 'Tipo de item inelegível para fundição' };
    }

    const isExc = (item.excellentMask || 0) > 0;
    const rate = isExc ? 0.80 : 0.50;
    const stoneDefId = isExc ? 'higher_refining_stone' : 'lower_refining_stone';

    if (randomRoll < rate) {
      return {
        success: true,
        resultItemDefId: stoneDefId,
        message: `Fundição bem sucedida! Criado ${stoneDefId}`,
      };
    }

    return {
      success: false,
      resultItemDefId: null,
      message: 'Fundição falhou! O item virou cinzas.',
    };
  }

  /**
   * Aplicação da Jewel of Harmony em um item no inventário
   * Sorteia uma opção canônica correspondente ao tipo (Weapon, Staff, Armor) e nível do item.
   */
  public static applyJewelOfHarmony(
    item: ItemInstance,
    randomRoll: number = Math.random()
  ): {
    success: boolean;
    option?: HarmonyOptionDef;
    rank?: number;
    message: string;
  } {
    const type = this.getHarmonyItemType(item.defId);
    if (type === JewelOfHarmonyItemType.NONE) {
      return { success: false, message: 'Item não aceita Jewel of Harmony' };
    }
    if (item.ancientOption && item.ancientOption > 0) {
      return { success: false, message: 'Itens Ancient não podem receber Jewel of Harmony' };
    }
    if (item.harmonyOption && (item.harmonyOption as any).id > 0) {
      return { success: false, message: 'Item já possui opção Harmony ativa' };
    }

    let optionTable: Record<number, HarmonyOptionDef>;
    if (type === JewelOfHarmonyItemType.WEAPON) optionTable = HARMONY_WEAPON_OPTIONS;
    else if (type === JewelOfHarmonyItemType.STAFF) optionTable = HARMONY_STAFF_OPTIONS;
    else optionTable = HARMONY_ARMOR_OPTIONS;

    // Filtra opções válidas com base no nível do item (+0 a +15)
    const validOptions = Object.values(optionTable).filter((opt) => item.level >= opt.minLevel);
    if (validOptions.length === 0) {
      return { success: false, message: 'Nível insuficiente para qualquer opção Harmony' };
    }

    // Roleta ponderada por Rate
    const totalWeight = validOptions.reduce((acc, opt) => acc + opt.rate, 0);
    let cumulative = 0;
    let selectedOption = validOptions[0];

    const pickPoint = randomRoll * totalWeight;
    for (const opt of validOptions) {
      cumulative += opt.rate;
      if (pickPoint <= cumulative) {
        selectedOption = opt;
        break;
      }
    }

    // Inicializa a opção no Rank 0 (ou no nível mínimo correspondente)
    const initialRank = selectedOption.minLevel;
    item.harmonyOption = {
      type: selectedOption.name as any,
      level: initialRank,
      value: selectedOption.values[initialRank],
    };
    (item.harmonyOption as any).id = selectedOption.id;

    return {
      success: true,
      option: selectedOption,
      rank: initialRank,
      message: `Opção Harmony concedida: ${selectedOption.name} (Rank ${initialRank})`,
    };
  }

  /**
   * Evolução do Rank da opção Harmony através de Pedras de Refinamento
   * - Lower Refining Stone: 20% de sucesso
   * - Higher Refining Stone: 50% de sucesso
   * - Em caso de sucesso: Rank + 1 (máximo 15)
   * - Em caso de falha: permanece ou Rank - 1 (mínimo minLevel)
   */
  public static upgradeHarmonyOption(
    item: ItemInstance,
    stoneDefId: 'lower_refining_stone' | 'higher_refining_stone',
    randomRoll: number = Math.random()
  ): {
    success: boolean;
    currentRank: number;
    currentValue: number;
    message: string;
  } {
    if (!item.harmonyOption || (item.harmonyOption as any).id === undefined) {
      return { success: false, currentRank: 0, currentValue: 0, message: 'Item não possui opção Harmony' };
    }

    const type = this.getHarmonyItemType(item.defId);
    let optionTable: Record<number, HarmonyOptionDef>;
    if (type === JewelOfHarmonyItemType.WEAPON) optionTable = HARMONY_WEAPON_OPTIONS;
    else if (type === JewelOfHarmonyItemType.STAFF) optionTable = HARMONY_STAFF_OPTIONS;
    else optionTable = HARMONY_ARMOR_OPTIONS;

    const optId = (item.harmonyOption as any).id;
    const optDef = optionTable[optId];
    if (!optDef) {
      return { success: false, currentRank: 0, currentValue: 0, message: 'Definição da opção Harmony inválida' };
    }

    const maxRank = 15;
    if (item.harmonyOption.level >= maxRank) {
      return {
        success: false,
        currentRank: item.harmonyOption.level,
        currentValue: item.harmonyOption.value,
        message: 'Opção Harmony já atingiu o rank máximo (15)',
      };
    }

    const rate = stoneDefId === 'higher_refining_stone' ? 0.50 : 0.20;
    if (randomRoll < rate) {
      item.harmonyOption.level = Math.min(maxRank, item.harmonyOption.level + 1);
      item.harmonyOption.value = optDef.values[item.harmonyOption.level];
      return {
        success: true,
        currentRank: item.harmonyOption.level,
        currentValue: item.harmonyOption.value,
        message: `Refinamento bem sucedido! ${optDef.name} subiu para Rank ${item.harmonyOption.level}`,
      };
    } else {
      // Falha: regride 1 nível até o mínimo original
      if (item.harmonyOption.level > optDef.minLevel) {
        item.harmonyOption.level -= 1;
        item.harmonyOption.value = optDef.values[item.harmonyOption.level];
      }
      return {
        success: false,
        currentRank: item.harmonyOption.level,
        currentValue: item.harmonyOption.value,
        message: `Refinamento falhou! Rank atual: ${item.harmonyOption.level}`,
      };
    }
  }

  /**
   * Remoção da Opção Harmony no NPC Jerridon
   * Custo canônico em Zen de acordo com MoneyTable[Rank].
   */
  public static removeHarmonyOption(item: ItemInstance): {
    success: boolean;
    costZen: number;
    message: string;
  } {
    if (!item.harmonyOption || (item.harmonyOption as any).id === undefined) {
      return { success: false, costZen: 0, message: 'Item não possui opção Harmony para remover' };
    }

    const type = this.getHarmonyItemType(item.defId);
    let optionTable: Record<number, HarmonyOptionDef>;
    if (type === JewelOfHarmonyItemType.WEAPON) optionTable = HARMONY_WEAPON_OPTIONS;
    else if (type === JewelOfHarmonyItemType.STAFF) optionTable = HARMONY_STAFF_OPTIONS;
    else optionTable = HARMONY_ARMOR_OPTIONS;

    const optId = (item.harmonyOption as any).id;
    const optDef = optionTable[optId];
    const rank = item.harmonyOption.level;
    const cost = optDef ? optDef.money[rank] : 100000;

    item.harmonyOption = null;
    return {
      success: true,
      costZen: cost,
      message: 'Opção Harmony purificada e removida com sucesso.',
    };
  }

  // ===========================================================================
  // SISTEMA DE ITENS NÍVEL 380 E COMBINAÇÃO PVP CHAOS MACHINE
  // ===========================================================================

  /**
   * Verifica se o item pertence à lista de itens nível 380
   */
  public static is380Item(defId: string): boolean {
    return CANONICAL_380_ITEMS.has(defId);
  }

  /**
   * Combinação de Item 380 na Chaos Machine (CChaosBox::Item380Mix)
   * Requisitos:
   * - 1x Item 380 com nível >= +4 e opção JoL >= +4 (+1)
   * - 1x Jewel of Guardian (14, 31)
   * - 1x Jewel of Harmony (14, 42)
   * - 10.000.000 Zen
   * Taxa: 50% (para +4 a +6) ou 60% (para +7 ou mais).
   * Em caso de falha: O ITEM NUNCA É DESTRUÍDO! Apenas as joias e zen são consumidos.
   */
  public static combine380PvP(
    item: ItemInstance,
    currentZen: number,
    hasGuardian: boolean,
    hasHarmony: boolean,
    randomRoll: number = Math.random()
  ): {
    success: boolean;
    itemDestroyed: boolean;
    costZen: number;
    message: string;
  } {
    const COST_ZEN = 10_000_000;

    if (!this.is380Item(item.defId)) {
      return { success: false, itemDestroyed: false, costZen: 0, message: 'O item não é de nível 380' };
    }
    if (item.level < 4 || (item.optionLevel || 0) < 4) {
      return { success: false, itemDestroyed: false, costZen: 0, message: 'O item 380 deve ser no mínimo +4 com option +4' };
    }
    if (item.itemOption380) {
      return { success: false, itemDestroyed: false, costZen: 0, message: 'O item já possui os bônus PvP 380 ativos' };
    }
    if (!hasGuardian || !hasHarmony) {
      return { success: false, itemDestroyed: false, costZen: 0, message: 'Necessário 1x Jewel of Guardian e 1x Jewel of Harmony' };
    }
    if (currentZen < COST_ZEN) {
      return { success: false, itemDestroyed: false, costZen: 0, message: 'Zen insuficiente (10.000.000 Zen necessário)' };
    }

    const successRate = item.level >= 7 ? 0.60 : 0.50;

    if (randomRoll < successRate) {
      item.itemOption380 = true;
      return {
        success: true,
        itemDestroyed: false,
        costZen: COST_ZEN,
        message: 'Combinação 380 PvP bem-sucedida! Bônus ancestrais despertados.',
      };
    } else {
      // Falha: o item é mantido intacto (ChaosBoxItemKeep)
      return {
        success: false,
        itemDestroyed: false,
        costZen: COST_ZEN,
        message: 'Combinação 380 PvP falhou! As joias foram consumidas, mas o item foi preservado.',
      };
    }
  }

  /**
   * Retorna os bônus fixos de PvP 380 calculados de acordo com o slot/tipo da peça
   */
  public static get380PvPBonuses(item: ItemInstance): Level380PvPBonus {
    if (!item.itemOption380) return {};

    const def = ITEM_DEFINITIONS[item.defId];
    if (!def) return {};

    switch (def.category) {
      case 'WEAPON':
        return {
          damagePvP: 200,
          attackSuccessRatePvP: 10,
        };
      case 'HELM':
        return {
          sdRecoveryRate: 2,
          defenseSuccessRatePvP: 10,
        };
      case 'ARMOR':
        return {
          sdRecoveryType: 1, // Recuperação automática contínua de SD
          defenseSuccessRatePvP: 10,
        };
      case 'PANTS':
        return {
          defensePvP: 200,
          defenseSuccessRatePvP: 10,
        };
      case 'GLOVES':
        return {
          maxHp: 200,
          defenseSuccessRatePvP: 10,
        };
      case 'BOOTS':
        return {
          maxSd: 700,
          defenseSuccessRatePvP: 10,
        };
      default:
        return {};
    }
  }
}
