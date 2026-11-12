/**
 * Dasi MMORPG - Sistema Canônico de Itens Socket (Seed Spheres & Socket Options)
 * Engenharia reversa integral do Webzen MU Online Season 5.2 (SocketItemOption.cpp, SocketItemType.cpp, ChaosBox.cpp).
 *
 * Suporta:
 * 1. 6 Elementos Canônicos (Fire, Water, Ice, Wind, Lightning, Earth).
 * 2. 30 Opções de Seed com 5 Ranks de Esfera (Sphere 1 a 5).
 * 3. Criação de Seed no Seed Master (Elpis em Elbeland) com taxa de 80-90% e custo 1.000.000 Zen.
 * 4. Combinação de Seed Sphere (Seed + Sphere 1..5 + Chaos + Creation) com taxa 80-90%.
 * 5. Aplicação (Mount) em slot vazio (254 / 0xFE) com 100% de sucesso.
 * 6. Remoção (Unmount) com destruição da esfera e liberação do slot para 254.
 * 7. Bônus de Socket de Arma/Armadura (ex: Fogo+Raio+Gelo = +11 Dmg).
 * 8. Opções de Pacote (Package Options: Dano Dobrado +3%, Ignorar Defesa +1%).
 * 9. Codificação canônica de 1 byte por slot: Byte = OptionIndex + (SphereLevel * 50).
 */

export const SocketElementType = {
  NONE: 0,
  FIRE: 1,
  WATER: 2,
  ICE: 3,
  WIND: 4,
  LIGHTNING: 5,
  EARTH: 6,
} as const;

export type SocketElementType = typeof SocketElementType[keyof typeof SocketElementType];

export const SOCKET_SLOT_EMPTY = 254; // 0xFE
export const SOCKET_SLOT_NONE = 255;  // 0xFF
export const MAX_SOCKET_OPTIONS = 50;

export interface SocketOptionDefinition {
  index: number;
  type: SocketElementType;
  subIndex: number;
  name: string;
  values: [number, number, number, number, number]; // Valores para Sphere 1..5
}

export const CANONICAL_SOCKET_OPTIONS: Record<number, SocketOptionDefinition> = {
  // Fogo (Ataque e BP)
  0: { index: 0, type: SocketElementType.FIRE, subIndex: 0, name: 'Add Damage By Level', values: [20, 19, 18, 17, 14] },
  1: { index: 1, type: SocketElementType.FIRE, subIndex: 1, name: 'Add Attack Speed', values: [7, 8, 9, 10, 11] },
  2: { index: 2, type: SocketElementType.FIRE, subIndex: 2, name: 'Add Min Damage', values: [30, 32, 35, 40, 50] },
  3: { index: 3, type: SocketElementType.FIRE, subIndex: 3, name: 'Add Max Damage', values: [20, 22, 25, 30, 35] },
  4: { index: 4, type: SocketElementType.FIRE, subIndex: 4, name: 'Add Damage', values: [20, 22, 25, 30, 35] },
  5: { index: 5, type: SocketElementType.FIRE, subIndex: 5, name: 'Sub BP Consumption Rate', values: [40, 41, 42, 43, 44] },

  // Água (Defesa e Redução)
  10: { index: 10, type: SocketElementType.WATER, subIndex: 0, name: 'Mul Defense Success Rate', values: [10, 11, 12, 13, 14] },
  11: { index: 11, type: SocketElementType.WATER, subIndex: 1, name: 'Add Defense', values: [30, 33, 36, 39, 42] },
  12: { index: 12, type: SocketElementType.WATER, subIndex: 2, name: 'Add Shield Damage Reduction', values: [1, 2, 3, 4, 5] },
  13: { index: 13, type: SocketElementType.WATER, subIndex: 3, name: 'Add Damage Reduction', values: [4, 5, 6, 7, 8] },
  14: { index: 14, type: SocketElementType.WATER, subIndex: 4, name: 'Add Damage Reflect', values: [5, 6, 7, 8, 9] },

  // Gelo (Monstros, Skill Dmg, Sucesso)
  16: { index: 16, type: SocketElementType.ICE, subIndex: 0, name: 'Add Hunt HP', values: [8, 7, 6, 5, 4] },
  17: { index: 17, type: SocketElementType.ICE, subIndex: 1, name: 'Add Hunt MP', values: [8, 7, 6, 5, 4] },
  18: { index: 18, type: SocketElementType.ICE, subIndex: 2, name: 'Add Skill Damage', values: [37, 40, 45, 50, 60] },
  19: { index: 19, type: SocketElementType.ICE, subIndex: 3, name: 'Add Attack Success Rate', values: [25, 27, 30, 35, 40] },
  20: { index: 20, type: SocketElementType.ICE, subIndex: 4, name: 'Add Item Durability Rate', values: [30, 32, 34, 36, 38] },

  // Vento (Vida, Mana, BP)
  21: { index: 21, type: SocketElementType.WIND, subIndex: 0, name: 'Add HP Recovery', values: [8, 10, 13, 16, 20] },
  22: { index: 22, type: SocketElementType.WIND, subIndex: 1, name: 'Mul Max HP', values: [4, 5, 6, 7, 8] },
  23: { index: 23, type: SocketElementType.WIND, subIndex: 2, name: 'Mul Max MP', values: [4, 5, 6, 7, 8] },
  24: { index: 24, type: SocketElementType.WIND, subIndex: 3, name: 'Add MP Recovery', values: [7, 14, 21, 28, 35] },
  25: { index: 25, type: SocketElementType.WIND, subIndex: 4, name: 'Add Max BP', values: [25, 30, 35, 40, 50] },
  26: { index: 26, type: SocketElementType.WIND, subIndex: 5, name: 'Add BP Recovery', values: [3, 5, 7, 10, 15] },

  // Raio (Crítico e Excelente)
  29: { index: 29, type: SocketElementType.LIGHTNING, subIndex: 0, name: 'Add Excellent Damage', values: [15, 20, 25, 30, 40] },
  30: { index: 30, type: SocketElementType.LIGHTNING, subIndex: 1, name: 'Add Excellent Damage Rate', values: [10, 11, 12, 13, 14] },
  31: { index: 31, type: SocketElementType.LIGHTNING, subIndex: 2, name: 'Add Critical Damage', values: [30, 32, 35, 40, 50] },
  32: { index: 32, type: SocketElementType.LIGHTNING, subIndex: 3, name: 'Add Critical Damage Rate', values: [8, 9, 10, 11, 12] },

  // Terra (Atributos Básicos)
  34: { index: 34, type: SocketElementType.EARTH, subIndex: 0, name: 'Add Strength', values: [30, 32, 34, 36, 38] },
  35: { index: 35, type: SocketElementType.EARTH, subIndex: 1, name: 'Add Dexterity', values: [30, 32, 34, 36, 38] },
  36: { index: 36, type: SocketElementType.EARTH, subIndex: 2, name: 'Add Vitality', values: [30, 32, 34, 36, 38] },
  37: { index: 37, type: SocketElementType.EARTH, subIndex: 3, name: 'Add Energy', values: [30, 32, 34, 36, 38] },
};

export const SocketBonusOption = {
  NONE: 255,
  WEAPON_DAMAGE: 0,        // +11 Dano (Fire, Lightning, Ice)
  WEAPON_SKILL_DAMAGE: 1,  // +11 Dano de Skill (Lightning, Ice, Fire)
  STAFF_DAMAGE: 2,         // +5 Dano (Fire, Lightning, Ice)
  STAFF_SKILL_DAMAGE: 3,   // +11 Dano de Skill (Lightning, Ice, Fire)
  ARMOR_DEFENSE: 4,        // +24 Defesa (Water, Earth, Wind)
  ARMOR_MAX_HP: 5,         // +29 Vida Máxima (Earth, Wind, Water)
} as const;

export type SocketBonusOption = typeof SocketBonusOption[keyof typeof SocketBonusOption];

export interface DecodedSocketSlot {
  rawByte: number;
  isEmpty: boolean;
  isNone: boolean;
  optionIndex: number;
  sphereLevel: number; // 0..4 (Níveis 1..5)
  definition?: SocketOptionDefinition;
  value: number;
}

export interface SocketItemData {
  slots: [number, number, number, number, number]; // 5 bytes canônicos
  bonusOption: number; // Byte de bônus ativado
}

export class SocketItemSystem {
  /**
   * Codifica um slot de socket no formato canônico de 1 byte da Webzen:
   * rawByte = optionIndex + (sphereLevel * 50)
   */
  public static encodeSocketByte(optionIndex: number, sphereLevel: number): number {
    if (!CANONICAL_SOCKET_OPTIONS[optionIndex]) {
      return SOCKET_SLOT_EMPTY;
    }
    const clampedLevel = Math.max(0, Math.min(4, sphereLevel));
    return (optionIndex + (clampedLevel * MAX_SOCKET_OPTIONS)) & 0xFF;
  }

  /**
   * Decodifica um byte de socket para sua opção, esfera e valor canônico
   */
  public static decodeSocketByte(rawByte: number): DecodedSocketSlot {
    if (rawByte === SOCKET_SLOT_EMPTY) {
      return { rawByte, isEmpty: true, isNone: false, optionIndex: -1, sphereLevel: -1, value: 0 };
    }
    if (rawByte === SOCKET_SLOT_NONE) {
      return { rawByte, isEmpty: false, isNone: true, optionIndex: -1, sphereLevel: -1, value: 0 };
    }

    const optionIndex = rawByte % MAX_SOCKET_OPTIONS;
    const sphereLevel = Math.floor(rawByte / MAX_SOCKET_OPTIONS);
    const def = CANONICAL_SOCKET_OPTIONS[optionIndex];

    if (!def || sphereLevel < 0 || sphereLevel > 4) {
      return { rawByte, isEmpty: true, isNone: false, optionIndex: -1, sphereLevel: -1, value: 0 };
    }

    return {
      rawByte,
      isEmpty: false,
      isNone: false,
      optionIndex,
      sphereLevel,
      definition: def,
      value: def.values[sphereLevel],
    };
  }

  /**
   * Avalia a ativação de Bônus de Socket no item (armas ou armaduras)
   * Baseado na ordem dos 3 primeiros tipos elementais montados
   */
  public static calculateBonusOption(slots: number[], isWeapon: boolean, isStaff: boolean): number {
    const types: SocketElementType[] = [];
    for (const slot of slots) {
      const decoded = this.decodeSocketByte(slot);
      if (!decoded.isEmpty && !decoded.isNone && decoded.definition) {
        types.push(decoded.definition.type);
      }
    }

    if (types.length < 3) {
      return SocketBonusOption.NONE;
    }

    const [t1, t2, t3] = types;

    if (isWeapon) {
      if (isStaff) {
        if (t1 === SocketElementType.FIRE && t2 === SocketElementType.LIGHTNING && t3 === SocketElementType.ICE) {
          return SocketBonusOption.STAFF_DAMAGE; // +5 Dmg
        }
        if (t1 === SocketElementType.LIGHTNING && t2 === SocketElementType.ICE && t3 === SocketElementType.FIRE) {
          return SocketBonusOption.STAFF_SKILL_DAMAGE; // +11 Skill Dmg
        }
      } else {
        if (t1 === SocketElementType.FIRE && t2 === SocketElementType.LIGHTNING && t3 === SocketElementType.ICE) {
          return SocketBonusOption.WEAPON_DAMAGE; // +11 Dmg
        }
        if (t1 === SocketElementType.LIGHTNING && t2 === SocketElementType.ICE && t3 === SocketElementType.FIRE) {
          return SocketBonusOption.WEAPON_SKILL_DAMAGE; // +11 Skill Dmg
        }
      }
    } else {
      // Armaduras e Escudos
      if (t1 === SocketElementType.WATER && t2 === SocketElementType.EARTH && t3 === SocketElementType.WIND) {
        return SocketBonusOption.ARMOR_DEFENSE; // +24 Defesa
      }
      if (t1 === SocketElementType.EARTH && t2 === SocketElementType.WIND && t3 === SocketElementType.WATER) {
        return SocketBonusOption.ARMOR_MAX_HP; // +29 HP
      }
    }

    return SocketBonusOption.NONE;
  }

  /**
   * Avalia Opções de Pacote (Package Options) conjuntas em todos os itens equipados:
   * - Double Damage +3%: Requer 1 de cada um dos 6 elementos
   * - Ignore Defense +1%: Requer 1 Fogo, 3 Água, 1 Gelo, 3 Vento, 1 Raio, 2 Terra
   */
  public static calculatePackageOptions(equippedSocketSlots: number[][]): { doubleDamageRate: number; ignoreDefenseRate: number } {
    const elementCounts: Record<SocketElementType, number> = {
      [SocketElementType.NONE]: 0,
      [SocketElementType.FIRE]: 0,
      [SocketElementType.WATER]: 0,
      [SocketElementType.ICE]: 0,
      [SocketElementType.WIND]: 0,
      [SocketElementType.LIGHTNING]: 0,
      [SocketElementType.EARTH]: 0,
    };

    for (const itemSlots of equippedSocketSlots) {
      for (const rawByte of itemSlots) {
        const decoded = this.decodeSocketByte(rawByte);
        if (!decoded.isEmpty && !decoded.isNone && decoded.definition) {
          elementCounts[decoded.definition.type]++;
        }
      }
    }

    let doubleDamageRate = 0;
    let ignoreDefenseRate = 0;

    // Double Damage +3%
    if (
      elementCounts[SocketElementType.FIRE] >= 1 &&
      elementCounts[SocketElementType.WATER] >= 1 &&
      elementCounts[SocketElementType.ICE] >= 1 &&
      elementCounts[SocketElementType.WIND] >= 1 &&
      elementCounts[SocketElementType.LIGHTNING] >= 1 &&
      elementCounts[SocketElementType.EARTH] >= 1
    ) {
      doubleDamageRate += 3;
    }

    // Ignore Defense +1%
    if (
      elementCounts[SocketElementType.FIRE] >= 1 &&
      elementCounts[SocketElementType.WATER] >= 3 &&
      elementCounts[SocketElementType.ICE] >= 1 &&
      elementCounts[SocketElementType.WIND] >= 3 &&
      elementCounts[SocketElementType.LIGHTNING] >= 1 &&
      elementCounts[SocketElementType.EARTH] >= 2
    ) {
      ignoreDefenseRate += 1;
    }

    return { doubleDamageRate, ignoreDefenseRate };
  }

  /**
   * Simulação da Mistura de Criação de Seed no Seed Master (Elpis)
   * Requisitos: Item +4 + Item Excelente +4 + Chaos + Creation + Harmony + 1.000.000 Zen
   */
  public static mixCreateSeed(
    hasItemPlus4: boolean,
    hasExcPlus4: boolean,
    hasChaos: boolean,
    hasCreation: boolean,
    hasHarmony: boolean,
    zen: number,
    forcedRoll?: number
  ): { success: boolean; seedElement?: SocketElementType; seedOptionIndex?: number; cost: number; error?: string } {
    const COST = 1_000_000;
    if (!hasItemPlus4 || !hasExcPlus4 || !hasChaos || !hasCreation || !hasHarmony) {
      return { success: false, cost: 0, error: 'Ingredientes insuficientes para Criação de Seed' };
    }
    if (zen < COST) {
      return { success: false, cost: 0, error: 'Zen insuficiente (necessário 1.000.000)' };
    }

    // Taxa base canônica: 80% (até 90% com valor de compra dos itens)
    const successRate = 85;
    const roll = forcedRoll !== undefined ? forcedRoll : Math.random() * 100;

    if (roll < successRate) {
      // Elemento aleatório de 1 a 6
      const seedElement = (1 + Math.floor(Math.random() * 6)) as SocketElementType;
      // Filtra as opções daquele elemento
      const candidateIndices = Object.values(CANONICAL_SOCKET_OPTIONS)
        .filter((o) => o.type === seedElement)
        .map((o) => o.index);
      const seedOptionIndex = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];

      return { success: true, seedElement, seedOptionIndex, cost: COST };
    }

    return { success: false, cost: COST, error: 'Falha na fusão da Seed (materiais destruídos)' };
  }

  /**
   * Monta uma Seed Sphere em um slot vazio de um item socket
   * Custo: 1.000.000 Zen + Chaos + Creation (100% de sucesso)
   */
  public static mountSeedSphere(
    itemSlots: [number, number, number, number, number],
    targetSlotIdx: number,
    optionIndex: number,
    sphereLevel: number,
    isWeapon: boolean,
    isStaff: boolean
  ): { success: boolean; newSlots: [number, number, number, number, number]; bonusOption: number; error?: string } {
    if (targetSlotIdx < 0 || targetSlotIdx >= 5) {
      return { success: false, newSlots: [...itemSlots], bonusOption: SocketBonusOption.NONE, error: 'Índice de slot inválido' };
    }
    if (itemSlots[targetSlotIdx] !== SOCKET_SLOT_EMPTY) {
      return { success: false, newSlots: [...itemSlots], bonusOption: SocketBonusOption.NONE, error: 'O slot escolhido não está vazio' };
    }

    const encoded = this.encodeSocketByte(optionIndex, sphereLevel);
    const newSlots: [number, number, number, number, number] = [...itemSlots];
    newSlots[targetSlotIdx] = encoded;

    const bonusOption = this.calculateBonusOption(newSlots, isWeapon, isStaff);
    return { success: true, newSlots, bonusOption };
  }

  /**
   * Extrai (desmonta) uma Seed Sphere de um item socket
   * O slot volta a ser SOCKET_SLOT_EMPTY (254). A esfera montada é destruída canonicamente.
   */
  public static unmountSeedSphere(
    itemSlots: [number, number, number, number, number],
    targetSlotIdx: number,
    isWeapon: boolean,
    isStaff: boolean
  ): { success: boolean; newSlots: [number, number, number, number, number]; bonusOption: number; error?: string } {
    if (targetSlotIdx < 0 || targetSlotIdx >= 5) {
      return { success: false, newSlots: [...itemSlots], bonusOption: SocketBonusOption.NONE, error: 'Índice de slot inválido' };
    }
    if (itemSlots[targetSlotIdx] === SOCKET_SLOT_EMPTY || itemSlots[targetSlotIdx] === SOCKET_SLOT_NONE) {
      return { success: false, newSlots: [...itemSlots], bonusOption: SocketBonusOption.NONE, error: 'Nenhuma Seed Sphere montada no slot' };
    }

    const newSlots: [number, number, number, number, number] = [...itemSlots];
    newSlots[targetSlotIdx] = SOCKET_SLOT_EMPTY;

    const bonusOption = this.calculateBonusOption(newSlots, isWeapon, isStaff);
    return { success: true, newSlots, bonusOption };
  }
}
