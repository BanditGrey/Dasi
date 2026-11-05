import {
  UpgradeOutcome,
  ItemCategory,
} from './types.ts';
import type {
  ItemInstance,
  UpgradeResult,
  HarmonyOptionType,
} from './types.ts';
import { Item } from './Item.ts';

export interface ChaosMachineIngredients {
  chaosJewels: number;
  blessJewels: number;
  soulJewels: number;
  zen: number;
  hasTalismanOfLuck?: boolean;          // +10% de taxa adicional
  hasTalismanOfChaosAssembly?: boolean; // Protege contra quebra total do item
}

export class JewelSystem {
  /**
   * Aplicação da Jewel of Blessing (Joia da Bênção)
   * - Restrição: Itens de nível +0 a +5
   * - Taxa de sucesso: 100%
   * - Efeito: Nível +1
   */
  public static applyJewelOfBlessing(target: ItemInstance): UpgradeResult {
    const def = Item.getDefinition(target);

    // Joia não pode ser aplicada em outras joias ou consumíveis
    if (def.category === ItemCategory.JEWEL || def.category === ItemCategory.CONSUMABLE) {
      return {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: target.level,
        newLevel: target.level,
        itemDestroyed: false,
        message: 'A Joia da Bênção não pode ser aplicada neste tipo de item.',
      };
    }

    if (target.level >= 6) {
      return {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: target.level,
        newLevel: target.level,
        itemDestroyed: false,
        message: 'A Joia da Bênção só pode ser utilizada em itens de nível +0 a +5.',
      };
    }

    const prevLevel = target.level;
    target.level += 1;

    // Atualiza durabilidade máxima
    const isExcl = target.excellentMask > 0;
    target.maxDurability = def.baseDurability + target.level * 2 + (isExcl ? 15 : 0);
    target.durability = target.maxDurability;

    return {
      outcome: UpgradeOutcome.SUCCESS,
      previousLevel: prevLevel,
      newLevel: target.level,
      itemDestroyed: false,
      message: `Sucesso Divino! O item evoluiu para +${target.level}.`,
    };
  }

  /**
   * Aplicação da Jewel of Soul (Joia da Alma)
   * - Restrição: Itens de nível +0 a +8 (Alvo final +1 a +9)
   * - Taxa de sucesso: 50% base, 75% se o item possuir Sorte (Luck)
   * - Penalidade em caso de falha:
   *   - Nível <= 6: Reduz 1 nível (ex: +6 vira +5)
   *   - Nível 7 ou 8: O item reseta para nível +0 (Risco clássico de MU)
   */
  public static applyJewelOfSoul(
    target: ItemInstance,
    rngRoll?: number
  ): UpgradeResult {
    const def = Item.getDefinition(target);

    if (def.category === ItemCategory.JEWEL || def.category === ItemCategory.CONSUMABLE) {
      return {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: target.level,
        newLevel: target.level,
        itemDestroyed: false,
        message: 'A Joia da Alma não pode ser aplicada neste item.',
      };
    }

    if (target.level >= 9) {
      return {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: target.level,
        newLevel: target.level,
        itemDestroyed: false,
        message: 'Refinamentos acima de +9 exigem a Máquina do Caos em Feywood.',
      };
    }

    // Cálculo da taxa de sucesso
    const successRate = target.luck ? 0.75 : 0.50;
    const roll = rngRoll !== undefined ? rngRoll : Math.random();
    const prevLevel = target.level;

    if (roll <= successRate) {
      target.level += 1;
      const isExcl = target.excellentMask > 0;
      target.maxDurability = def.baseDurability + target.level * 2 + (isExcl ? 15 : 0);
      target.durability = target.maxDurability;

      return {
        outcome: UpgradeOutcome.SUCCESS,
        previousLevel: prevLevel,
        newLevel: target.level,
        itemDestroyed: false,
        message: `A alma consagrou o item! Elevado para +${target.level}.`,
      };
    }

    // Falha
    let newLevel = 0;
    if (prevLevel <= 6) {
      newLevel = Math.max(0, prevLevel - 1);
    } else {
      // Nível 7 ou 8 falhando volta para 0
      newLevel = 0;
    }

    target.level = newLevel;
    const isExcl = target.excellentMask > 0;
    target.maxDurability = def.baseDurability + target.level * 2 + (isExcl ? 15 : 0);
    target.durability = Math.min(target.durability, target.maxDurability);

    return {
      outcome: UpgradeOutcome.LEVEL_DOWN,
      previousLevel: prevLevel,
      newLevel: target.level,
      itemDestroyed: false,
      message:
        prevLevel >= 7
          ? `A alma se corrompeu! O item caiu drasticamente para +${newLevel}!`
          : `A joia estilhaçou e o item regrediu para +${newLevel}.`,
    };
  }

  /**
   * Aplicação da Jewel of Life (Joia da Vida)
   * - Alvo: Adiciona ou eleva a opção adicional (+4, +8, +12, +16, +20, +24, +28)
   * - Taxa de sucesso: 50%
   * - Penalidade em falha: A opção é resetada para 0
   */
  public static applyJewelOfLife(
    target: ItemInstance,
    rngRoll?: number
  ): UpgradeResult {
    const def = Item.getDefinition(target);

    if (
      def.category === ItemCategory.JEWEL ||
      def.category === ItemCategory.CONSUMABLE ||
      def.category === ItemCategory.RING ||
      def.category === ItemCategory.PENDANT
    ) {
      return {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: target.level,
        newLevel: target.level,
        previousOption: target.optionLevel,
        newOption: target.optionLevel,
        itemDestroyed: false,
        message: 'A Joia da Vida não pode ser usada neste item.',
      };
    }

    if (target.optionLevel >= 28) {
      return {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: target.level,
        newLevel: target.level,
        previousOption: target.optionLevel,
        newOption: target.optionLevel,
        itemDestroyed: false,
        message: 'O item já atingiu o limite máximo de Opção da Vida (+28).',
      };
    }

    const prevOption = target.optionLevel;
    const roll = rngRoll !== undefined ? rngRoll : Math.random();

    if (roll <= 0.50) {
      target.optionLevel += 4;
      return {
        outcome: UpgradeOutcome.SUCCESS,
        previousLevel: target.level,
        newLevel: target.level,
        previousOption: prevOption,
        newOption: target.optionLevel,
        itemDestroyed: false,
        message: `A seiva vital floresceu! Opção aumentada para +${target.optionLevel}.`,
      };
    }

    // Falha: reseta a opção adicional para 0
    target.optionLevel = 0;
    return {
      outcome: UpgradeOutcome.FAILURE,
      previousLevel: target.level,
      newLevel: target.level,
      previousOption: prevOption,
      newOption: 0,
      itemDestroyed: false,
      message: 'A energia vital evaporou e a opção do item foi perdida!',
    };
  }

  /**
   * Refinamento na Máquina do Caos (Níveis +10 até +15)
   * Baseado na tabela oficial de risco do documento Economy_and_Crafting.md
   */
  public static applyChaosMachineUpgrade(
    target: ItemInstance,
    ingredients: ChaosMachineIngredients,
    rngRoll?: number
  ): UpgradeResult {
    if (target.level < 9 || target.level >= 15) {
      return {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: target.level,
        newLevel: target.level,
        itemDestroyed: false,
        message: 'A Máquina do Caos só aceita itens entre +9 e +14 para este refinamento.',
      };
    }

    // Valida ingredientes mínimos de acordo com o nível
    const targetTargetLevel = target.level + 1;
    const requiredJewels = target.level - 8; // +10 exige 1, +11 exige 2, etc.

    if (ingredients.chaosJewels < 1) {
      return {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: target.level,
        newLevel: target.level,
        itemDestroyed: false,
        message: 'É necessária ao menos 1 Jewel of Chaos como catalisador.',
      };
    }

    if (
      ingredients.blessJewels < requiredJewels ||
      ingredients.soulJewels < requiredJewels
    ) {
      return {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: target.level,
        newLevel: target.level,
        itemDestroyed: false,
        message: `Refinar para +${targetTargetLevel} requer ${requiredJewels} Jewel of Blessing e ${requiredJewels} Jewel of Soul.`,
      };
    }

    // Tabela de taxas de sucesso base
    const baseRates: Record<number, number> = {
      10: 0.60,
      11: 0.55,
      12: 0.50,
      13: 0.45,
      14: 0.40,
      15: 0.35,
    };

    let rate = baseRates[targetTargetLevel] || 0.35;
    if (target.luck) {
      rate += 0.15; // +15% de taxa com Luck (ex: 60% -> 75%)
    }
    if (ingredients.hasTalismanOfLuck) {
      rate += 0.10; // +10% com Talismã da Sorte adicional
    }

    // Taxa máxima de 75% a 90%
    rate = Math.min(0.90, rate);

    const prevLevel = target.level;
    const roll = rngRoll !== undefined ? rngRoll : Math.random();

    if (roll <= rate) {
      // Sucesso na Forja
      target.level += 1;
      const def = Item.getDefinition(target);
      const isExcl = target.excellentMask > 0;
      target.maxDurability = def.baseDurability + target.level * 2 + (isExcl ? 15 : 0);
      target.durability = target.maxDurability;

      return {
        outcome: UpgradeOutcome.SUCCESS,
        previousLevel: prevLevel,
        newLevel: target.level,
        itemDestroyed: false,
        message: `GLÓRIA AO CAOS! A alavanca liberou a chama dourada: Item forjado para +${target.level}!`,
      };
    }

    // Falha na Forja
    if (ingredients.hasTalismanOfChaosAssembly) {
      // Protegido por Talismã de Proteção
      target.level = Math.max(9, prevLevel - 1);
      return {
        outcome: UpgradeOutcome.LEVEL_DOWN,
        previousLevel: prevLevel,
        newLevel: target.level,
        itemDestroyed: false,
        message: 'O Talismã de Proteção evitou a destruição! O item foi preservado em +' + target.level,
      };
    }

    // Penalidade conforme tabela de risco:
    // +10: Item retorna para +9 ou quebra
    // +11 a +12: Perde níveis
    // +13 a +15: Destruição total
    if (targetTargetLevel <= 12) {
      target.level = Math.max(0, prevLevel - 2);
      return {
        outcome: UpgradeOutcome.LEVEL_DOWN,
        previousLevel: prevLevel,
        newLevel: target.level,
        itemDestroyed: false,
        message: `Fumaça negra e faíscas! A forja falhou e o item regrediu para +${target.level}.`,
      };
    } else {
      // +13, +14, +15: Destruição total (quebra em cinzas)
      return {
        outcome: UpgradeOutcome.DESTROYED,
        previousLevel: prevLevel,
        newLevel: 0,
        itemDestroyed: true,
        message: 'EXPLOSÃO METÁLICA! As forças do Caos consumiram o item e o reduziram a cinzas!',
      };
    }
  }

  /**
   * Aplicação da Jewel of Harmony (Joia da Harmonia)
   * - Taxa de sucesso: 80%
   * - Efeito: Adiciona opção amarela especial
   */
  public static applyJewelOfHarmony(
    target: ItemInstance,
    forcedOptionType?: HarmonyOptionType,
    rngRoll?: number
  ): UpgradeResult {
    const def = Item.getDefinition(target);

    if (def.category !== ItemCategory.WEAPON && def.category !== ItemCategory.ARMOR && def.category !== ItemCategory.SHIELD) {
      return {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: target.level,
        newLevel: target.level,
        itemDestroyed: false,
        message: 'A Joia da Harmonia só pode ser fundida em Armas, Armaduras ou Escudos.',
      };
    }

    if (target.harmonyOption) {
      return {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: target.level,
        newLevel: target.level,
        itemDestroyed: false,
        message: 'O item já possui uma Opção de Harmonia ativa. Purifique-o antes no NPC.',
      };
    }

    const roll = rngRoll !== undefined ? rngRoll : Math.random();

    if (roll <= 0.80) {
      const optionType: HarmonyOptionType =
        forcedOptionType ||
        (def.category === ItemCategory.WEAPON
          ? 'CRITICAL_DAMAGE'
          : 'DAMAGE_DECREASE');

      const value = optionType === 'CRITICAL_DAMAGE' ? 25 : 5;

      target.harmonyOption = {
        type: optionType,
        level: 1,
        value,
      };

      return {
        outcome: UpgradeOutcome.SUCCESS,
        previousLevel: target.level,
        newLevel: target.level,
        itemDestroyed: false,
        message: `Harmonia Ancestral despertada! Concedido: ${optionType} (+${value}).`,
      };
    }

    return {
      outcome: UpgradeOutcome.FAILURE,
      previousLevel: target.level,
      newLevel: target.level,
      itemDestroyed: false,
      message: 'A união da pedra falhou e a joia se desfez em pó brilhante sem afetar o item.',
    };
  }
}
