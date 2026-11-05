/**
 * Dasi MMORPG - Máquina do Caos (Chaos Machine Crafter)
 * Motor de síntese e forja alquímica clássica de Noria (Feywood).
 * 
 * Receitas implementadas:
 * 1. Forja de Armas do Caos (Chaos Dragon Axe, Chaos Nature Bow, Chaos Lightning Staff):
 *    - Requisito: Item +4+opt (arma ou armadura) + 1x Jewel of Chaos + Bless/Soul opcionais.
 *    - Taxa de sucesso: 1% a 100%.
 * 2. Forja de Asas Tier 1 (Wings of Dragon, Wings of Soul, Wings of Elf):
 *    - Requisito: Arma do Caos +4+opt + 1x Jewel of Chaos + Bless/Soul opcionais.
 *    - Taxa de sucesso: 1% a 100%.
 * 3. Refinamento de Itens +10 até +15:
 *    - Requisito: Item base (+9 a +14) + Bless + Soul + Chaos + Zen.
 *    - Taxa de sucesso: 50% a 70% (com influência de Sorte/Luck).
 *    - Falha severa: +10 a +12 perde níveis; +13 a +15 destruição total do item.
 */

import { GridInventory } from './GridInventory.ts';
import { Item } from './Item.ts';
import { ItemCategory, UpgradeOutcome, type ItemInstance } from './types.ts';
import type { CharacterSummary } from '../network/protocol.ts';

export type ChaosMixType =
  | 'CHAOS_WEAPON'
  | 'FIRST_WING'
  | 'SECOND_WING'
  | 'THIRD_WING'
  | 'ITEM_UPGRADE'
  | 'FRUIT_CREATION';

export interface ChaosMachineIngredients {
  chaosJewels: number;
  blessJewels: number;
  soulJewels: number;
  zen: number;
  hasTalismanOfLuck?: boolean;
}

export interface ChaosMachineMixRequest {
  mixType: ChaosMixType;
  itemUuids: string[];
  targetItemUuid?: string; // Para ITEM_UPGRADE
  rngRoll?: number;        // Determinístico para testes automatizados (0.0 a 1.0)
}

export interface ChaosMachineMixResult {
  success: boolean;
  mixType: ChaosMixType;
  rate: number;            // 1 a 100 (%)
  zenCost: number;
  createdItem?: ItemInstance;
  updatedItem?: ItemInstance;
  destroyedItemUuids: string[];
  message: string;
  itemDestroyed?: boolean;
}

export class ChaosMachine {
  /**
   * Avalia os itens fornecidos e calcula a viabilidade, taxa de sucesso e custo em Zen da receita.
   */
  public static evaluateMix(
    inventory: GridInventory,
    character: CharacterSummary,
    req: ChaosMachineMixRequest
  ): {
    valid: boolean;
    rate: number;
    zenCost: number;
    error?: string;
    targetItem?: ItemInstance;
    ingredients?: {
      chaosJewelUuids: string[];
      blessJewelUuids: string[];
      soulJewelUuids: string[];
      supportItemUuids: string[];
    };
  } {
    const { mixType, itemUuids, targetItemUuid } = req;

    // 1. Carrega as instâncias de itens da bolsa
    const placedItems = itemUuids
      .map((uuid) => inventory.getPlacedItem(uuid))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    if (placedItems.length !== itemUuids.length) {
      return { valid: false, rate: 0, zenCost: 0, error: 'Um ou mais itens não foram localizados no inventário' };
    }

    const items = placedItems.map((p) => p.item);
    const chaosJewels = items.filter((it) => it.defId === 'jewel_of_chaos');
    const blessJewels = items.filter((it) => it.defId === 'jewel_of_blessing');
    const soulJewels = items.filter((it) => it.defId === 'jewel_of_soul');

    // ==========================================
    // RECEITA 1: FORJA DE ARMAS DO CAOS
    // ==========================================
    if (mixType === 'CHAOS_WEAPON') {
      const zenCost = 20000;
      if ((character.zen ?? 0) < zenCost) {
        return { valid: false, rate: 0, zenCost, error: `Zen insuficiente. Custo da forja: ${zenCost} Zen.` };
      }

      if (chaosJewels.length < 1) {
        return { valid: false, rate: 0, zenCost, error: 'A forja do Caos requer pelo menos 1 Jewel of Chaos.' };
      }

      // Encontra itens de sacrifício +4+opt (arma ou armadura ou escudo)
      const sacrificeItems = items.filter((it) => {
        if (it.defId.startsWith('jewel_')) return false;
        const def = Item.getDefinition(it);
        const isGear = [ItemCategory.WEAPON, ItemCategory.ARMOR, ItemCategory.SHIELD, ItemCategory.HELM, ItemCategory.PANTS, ItemCategory.GLOVES, ItemCategory.BOOTS].includes(def.category);
        return isGear && it.level >= 4 && it.optionLevel >= 4;
      });

      if (sacrificeItems.length < 1) {
        return {
          valid: false,
          rate: 0,
          zenCost,
          error: 'É necessário pelo menos 1 item com nível +4 e Opção Adicional +4 ou superior.',
        };
      }

      // Cálculo da taxa de sucesso: 1% a 100%
      let calculatedRate = 0;
      for (const item of sacrificeItems) {
        calculatedRate += item.level * 6 + item.optionLevel * 3;
        if (item.luck) calculatedRate += 10;
        if (item.excellentMask > 0) calculatedRate += 15;
      }

      calculatedRate += blessJewels.length * 5;
      calculatedRate += soulJewels.length * 3;
      calculatedRate += 5; // Bônus base da Jewel of Chaos

      const finalRate = Math.min(100, Math.max(1, calculatedRate));

      return {
        valid: true,
        rate: finalRate,
        zenCost,
        ingredients: {
          chaosJewelUuids: chaosJewels.map((j) => j.uuid),
          blessJewelUuids: blessJewels.map((j) => j.uuid),
          soulJewelUuids: soulJewels.map((j) => j.uuid),
          supportItemUuids: sacrificeItems.map((s) => s.uuid),
        },
      };
    }

    // ==========================================
    // RECEITA 2: FORJA DE ASAS TIER 1
    // ==========================================
    if (mixType === 'FIRST_WING') {
      const zenCost = 100000;
      if ((character.zen ?? 0) < zenCost) {
        return { valid: false, rate: 0, zenCost, error: `Zen insuficiente. Custo da forja: ${zenCost} Zen.` };
      }

      if (chaosJewels.length < 1) {
        return { valid: false, rate: 0, zenCost, error: 'A forja de Asas requer pelo menos 1 Jewel of Chaos.' };
      }

      // Requer 1 Arma do Caos +4+opt
      const chaosWeapons = ['chaos_dragon_axe', 'chaos_nature_bow', 'chaos_lightning_staff'];
      const targetChaosWeapon = items.find(
        (it) => chaosWeapons.includes(it.defId) && it.level >= 4 && it.optionLevel >= 4
      );

      if (!targetChaosWeapon) {
        return {
          valid: false,
          rate: 0,
          zenCost,
          error: 'É necessária 1 Arma do Caos (Axe, Bow ou Staff) com nível +4 e Opção Adicional +4 ou superior.',
        };
      }

      // Cálculo da taxa: 1% a 100%
      let calculatedRate = 40 + targetChaosWeapon.level * 4 + targetChaosWeapon.optionLevel * 2;
      if (targetChaosWeapon.luck) calculatedRate += 10;
      calculatedRate += blessJewels.length * 5;
      calculatedRate += soulJewels.length * 3;

      const finalRate = Math.min(100, Math.max(1, calculatedRate));

      return {
        valid: true,
        rate: finalRate,
        zenCost,
        targetItem: targetChaosWeapon,
        ingredients: {
          chaosJewelUuids: chaosJewels.map((j) => j.uuid),
          blessJewelUuids: blessJewels.map((j) => j.uuid),
          soulJewelUuids: soulJewels.map((j) => j.uuid),
          supportItemUuids: [targetChaosWeapon.uuid],
        },
      };
    }

    // ==========================================
    // RECEITA 3: FORJA DE ASAS TIER 2
    // ==========================================
    if (mixType === 'SECOND_WING') {
      const zenCost = 200000;
      if ((character.zen ?? 0) < zenCost) {
        return { valid: false, rate: 0, zenCost, error: `Zen insuficiente. Custo da forja: ${zenCost} Zen.` };
      }

      if (chaosJewels.length < 1) {
        return { valid: false, rate: 0, zenCost, error: 'A forja de Asas Tier 2 requer pelo menos 1 Jewel of Chaos.' };
      }

      const lochsFeather = items.find((it) => it.defId === 'lochs_feather');
      if (!lochsFeather) {
        return { valid: false, rate: 0, zenCost, error: "É necessária 1 Loch's Feather (Pena de Loch) para sintetizar Asas Tier 2." };
      }

      const t1Wings = items.find((it) => {
        const def = Item.getDefinition(it);
        return (
          def.category === ItemCategory.WING &&
          ['wings_of_satan', 'wings_of_heaven', 'wings_of_fairy', 'wings_of_dragon', 'wings_of_soul', 'wings_of_elf'].includes(it.defId)
        );
      });

      if (!t1Wings) {
        return { valid: false, rate: 0, zenCost, error: 'São necessárias Asas base de sacrifício para criar Asas Tier 2.' };
      }

      let calculatedRate = 40 + t1Wings.level * 3 + t1Wings.optionLevel * 2;
      if (t1Wings.luck) calculatedRate += 10;
      calculatedRate += blessJewels.length * 5;
      calculatedRate += soulJewels.length * 3;

      const finalRate = Math.min(90, Math.max(1, calculatedRate));

      return {
        valid: true,
        rate: finalRate,
        zenCost,
        targetItem: t1Wings,
        ingredients: {
          chaosJewelUuids: chaosJewels.map((j) => j.uuid),
          blessJewelUuids: blessJewels.map((j) => j.uuid),
          soulJewelUuids: soulJewels.map((j) => j.uuid),
          supportItemUuids: [t1Wings.uuid, lochsFeather.uuid],
        },
      };
    }

    // ==========================================
    // RECEITA 4: FORJA DE ASAS TIER 3
    // ==========================================
    if (mixType === 'THIRD_WING') {
      const zenCost = 2000000;
      if ((character.zen ?? 0) < zenCost) {
        return { valid: false, rate: 0, zenCost, error: `Zen insuficiente. Custo da forja: ${zenCost} Zen.` };
      }

      if (chaosJewels.length < 1) {
        return { valid: false, rate: 0, zenCost, error: 'A forja de Asas Tier 3 requer pelo menos 1 Jewel of Chaos.' };
      }

      const condorFeather = items.find((it) => it.defId === 'condor_feather');
      const condorFlame = items.find((it) => it.defId === 'condor_flame');

      if (!condorFeather || !condorFlame) {
        return { valid: false, rate: 0, zenCost, error: 'A forja de Asas Tier 3 requer 1 Condor Feather e 1 Flame of Condor.' };
      }

      const t2Wings = items.find((it) => {
        const def = Item.getDefinition(it);
        return (
          def.category === ItemCategory.WING &&
          ['wings_of_dragon', 'wings_of_soul', 'wings_of_elf', 'wings_of_darkness', 'cape_of_lord', 'cape_of_dark_lord'].includes(it.defId)
        );
      });

      if (!t2Wings) {
        return { valid: false, rate: 0, zenCost, error: 'São necessárias Asas Tier 2 de sacrifício para sintetizar Asas Tier 3.' };
      }

      let calculatedRate = 20 + t2Wings.level * 2 + t2Wings.optionLevel;
      if (t2Wings.luck) calculatedRate += 5;
      calculatedRate += blessJewels.length * 4;
      calculatedRate += soulJewels.length * 2;

      const finalRate = Math.min(40, Math.max(10, calculatedRate));

      return {
        valid: true,
        rate: finalRate,
        zenCost,
        targetItem: t2Wings,
        ingredients: {
          chaosJewelUuids: chaosJewels.map((j) => j.uuid),
          blessJewelUuids: blessJewels.map((j) => j.uuid),
          soulJewelUuids: soulJewels.map((j) => j.uuid),
          supportItemUuids: [t2Wings.uuid, condorFeather.uuid, condorFlame.uuid],
        },
      };
    }

    // ==========================================
    // RECEITA 5: CRIAÇÃO DE FRUTAS DE STATS
    // ==========================================
    if (mixType === 'FRUIT_CREATION') {
      const zenCost = 500000;
      if ((character.zen ?? 0) < zenCost) {
        return { valid: false, rate: 0, zenCost, error: `Zen insuficiente. Custo da criação de frutas: ${zenCost} Zen.` };
      }

      const creationJewel = items.find((it) => it.defId === 'jewel_of_creation');
      if (!creationJewel) {
        return { valid: false, rate: 0, zenCost, error: 'A criação de Frutas requer 1 Jewel of Creation.' };
      }

      if (chaosJewels.length < 1) {
        return { valid: false, rate: 0, zenCost, error: 'A criação de Frutas requer 1 Jewel of Chaos.' };
      }

      return {
        valid: true,
        rate: 90,
        zenCost,
        ingredients: {
          chaosJewelUuids: [chaosJewels[0].uuid],
          blessJewelUuids: [],
          soulJewelUuids: [],
          supportItemUuids: [creationJewel.uuid],
        },
      };
    }

    // ==========================================
    // RECEITA 3: REFINAMENTO DE ITENS +10 ATÉ +15
    // ==========================================
    if (mixType === 'ITEM_UPGRADE') {
      const mainUuid = targetItemUuid || items.find((it) => !it.defId.startsWith('jewel_'))?.uuid;
      const targetItem = items.find((it) => it.uuid === mainUuid);

      if (!targetItem) {
        return { valid: false, rate: 0, zenCost: 0, error: 'Item alvo para refinamento não especificado.' };
      }

      if (targetItem.level < 9 || targetItem.level >= 15) {
        return {
          valid: false,
          rate: 0,
          zenCost: 0,
          error: 'A Máquina do Caos refina exclusivamente itens de nível +9 até +14.',
        };
      }

      const nextLevel = targetItem.level + 1;
      const requiredJewels = targetItem.level - 8; // +10 exige 1, +11 exige 2, etc.
      const zenCost = 2000000 * requiredJewels;

      if ((character.zen ?? 0) < zenCost) {
        return { valid: false, rate: 0, zenCost, error: `Zen insuficiente. Refino para +${nextLevel} custa ${zenCost} Zen.` };
      }

      if (chaosJewels.length < 1) {
        return { valid: false, rate: 0, zenCost, error: 'Requer ao menos 1 Jewel of Chaos.' };
      }

      if (blessJewels.length < requiredJewels) {
        return {
          valid: false,
          rate: 0,
          zenCost,
          error: `Refinar para +${nextLevel} requer ${requiredJewels} Jewel of Blessing.`,
        };
      }

      if (soulJewels.length < requiredJewels) {
        return {
          valid: false,
          rate: 0,
          zenCost,
          error: `Refinar para +${nextLevel} requer ${requiredJewels} Jewel of Soul.`,
        };
      }

      // Tabela de taxas de sucesso: 50% a 70%
      const baseRates: Record<number, number> = {
        10: 60,
        11: 55,
        12: 50,
        13: 45,
        14: 45,
        15: 40,
      };

      let finalRate = baseRates[nextLevel] ?? 50;
      if (targetItem.luck) {
        finalRate += 15; // +15% de bônus de Sorte (ex: 50% -> 65%, 55% -> 70%)
      }

      // Limita taxa entre 50% e 75%
      finalRate = Math.min(75, Math.max(35, finalRate));

      return {
        valid: true,
        rate: finalRate,
        zenCost,
        targetItem,
        ingredients: {
          chaosJewelUuids: chaosJewels.slice(0, 1).map((j) => j.uuid),
          blessJewelUuids: blessJewels.slice(0, requiredJewels).map((j) => j.uuid),
          soulJewelUuids: soulJewels.slice(0, requiredJewels).map((j) => j.uuid),
          supportItemUuids: [targetItem.uuid],
        },
      };
    }

    return { valid: false, rate: 0, zenCost: 0, error: 'Tipo de combinação inválido.' };
  }

  /**
   * Executa a síntese alquímica autoritativa da Máquina do Caos.
   */
  public static executeMix(
    inventory: GridInventory,
    character: CharacterSummary,
    req: ChaosMachineMixRequest
  ): ChaosMachineMixResult {
    const evaluation = this.evaluateMix(inventory, character, req);

    if (!evaluation.valid) {
      return {
        success: false,
        mixType: req.mixType,
        rate: 0,
        zenCost: evaluation.zenCost,
        destroyedItemUuids: [],
        message: evaluation.error || 'Combinação inválida.',
      };
    }

    const { rate, zenCost, ingredients, targetItem } = evaluation;

    // 1. Debita o custo de Zen
    character.zen = (character.zen ?? 0) - zenCost;

    // 2. Realiza o sorteio pseudo-aleatório (ou determinado por rngRoll)
    const roll = req.rngRoll !== undefined ? req.rngRoll : Math.random();
    const isSuccess = roll <= rate / 100;

    // ==========================================
    // 1. RESULTADO DA FORJA DE ARMAS DO CAOS
    // ==========================================
    if (req.mixType === 'CHAOS_WEAPON') {
      // Remove todos os ingredientes do inventário
      const itemsToDestroy = req.itemUuids;
      for (const uuid of itemsToDestroy) {
        inventory.removeItem(uuid);
      }

      if (isSuccess) {
        // Seleciona uma das 3 armas do Caos
        const chaosWeaponPool = ['chaos_dragon_axe', 'chaos_nature_bow', 'chaos_lightning_staff'];
        const chosenDefId = chaosWeaponPool[Math.floor(Math.random() * chaosWeaponPool.length)];

        // Atributos bônus do resultado
        const hasSkill = Math.random() < 0.50;
        const hasLuck = Math.random() < 0.30;
        const optionLevel = Math.random() < 0.25 ? 4 : 0;

        const createdItem = Item.create(chosenDefId, {
          level: 0,
          skill: hasSkill,
          luck: hasLuck,
          optionLevel,
        });

        // Adiciona à bolsa
        inventory.addItem(createdItem);

        return {
          success: true,
          mixType: req.mixType,
          rate,
          zenCost,
          createdItem,
          destroyedItemUuids: itemsToDestroy,
          message: `GLÓRIA AO CAOS! A forja liberou a chama dourada: ${Item.getDefinition(createdItem).name} foi forjada com sucesso!`,
        };
      } else {
        return {
          success: false,
          mixType: req.mixType,
          rate,
          zenCost,
          destroyedItemUuids: itemsToDestroy,
          message: 'Fumaça escura e estalos metálicos! A forja do Caos colapsou e todos os materiais foram destruídos!',
        };
      }
    }

    // ==========================================
    // 2. RESULTADO DA FORJA DE ASAS TIER 1
    // ==========================================
    if (req.mixType === 'FIRST_WING') {
      const itemsToDestroy = req.itemUuids;
      for (const uuid of itemsToDestroy) {
        inventory.removeItem(uuid);
      }

      if (isSuccess) {
        // Seleciona uma das 3 Asas Tier 1
        const wingPool = ['wings_of_dragon', 'wings_of_soul', 'wings_of_elf'];
        const chosenDefId = wingPool[Math.floor(Math.random() * wingPool.length)];

        const hasLuck = Math.random() < 0.30;
        const optionLevel = Math.random() < 0.30 ? 4 : 0;

        const createdItem = Item.create(chosenDefId, {
          level: 0,
          luck: hasLuck,
          optionLevel,
        });

        inventory.addItem(createdItem);

        return {
          success: true,
          mixType: req.mixType,
          rate,
          zenCost,
          createdItem,
          destroyedItemUuids: itemsToDestroy,
          message: `ASAS DO DESTINO! As engrenagens ecoaram nos céus: ${Item.getDefinition(createdItem).name} emergiu em resplendor!`,
        };
      } else {
        return {
          success: false,
          mixType: req.mixType,
          rate,
          zenCost,
          destroyedItemUuids: itemsToDestroy,
          message: 'Explosão cataclísmica! As energias celestiais dissiparam e todos os materiais se reduziram a pó.',
        };
      }
    }

    // ==========================================
    // RESULTADO DA FORJA DE ASAS TIER 2
    // ==========================================
    if (req.mixType === 'SECOND_WING') {
      const itemsToDestroy = req.itemUuids;
      for (const uuid of itemsToDestroy) {
        inventory.removeItem(uuid);
      }

      if (isSuccess) {
        const wingPool = ['wings_of_dragon', 'wings_of_soul', 'wings_of_elf', 'wings_of_darkness', 'cape_of_lord'];
        const chosenDefId = wingPool[Math.floor(Math.random() * wingPool.length)];

        const hasLuck = Math.random() < 0.30;
        const optionLevel = Math.random() < 0.30 ? 4 : 0;

        const createdItem = Item.create(chosenDefId, {
          level: 0,
          luck: hasLuck,
          optionLevel,
        });

        inventory.addItem(createdItem);

        return {
          success: true,
          mixType: req.mixType,
          rate,
          zenCost,
          createdItem,
          destroyedItemUuids: itemsToDestroy,
          message: `MAGIA ANCESTRAL! As penas cósmicas se uniram: ${Item.getDefinition(createdItem).name} foi forjada com sucesso!`,
        };
      } else {
        return {
          success: false,
          mixType: req.mixType,
          rate,
          zenCost,
          destroyedItemUuids: itemsToDestroy,
          message: 'Falha na condensação mágica! Todos os materiais foram destruídos pelo fogo do Caos.',
        };
      }
    }

    // ==========================================
    // RESULTADO DA FORJA DE ASAS TIER 3
    // ==========================================
    if (req.mixType === 'THIRD_WING') {
      const itemsToDestroy = req.itemUuids;
      for (const uuid of itemsToDestroy) {
        inventory.removeItem(uuid);
      }

      if (isSuccess) {
        const wingPool = ['wings_of_storm', 'wings_of_space_time', 'wings_of_dimension', 'wings_of_ruin', 'cape_of_emperor'];
        const chosenDefId = wingPool[Math.floor(Math.random() * wingPool.length)];

        const hasLuck = Math.random() < 0.35;
        const optionLevel = Math.random() < 0.35 ? 4 : 0;

        const createdItem = Item.create(chosenDefId, {
          level: 0,
          luck: hasLuck,
          optionLevel,
        });

        inventory.addItem(createdItem);

        return {
          success: true,
          mixType: req.mixType,
          rate,
          zenCost,
          createdItem,
          destroyedItemUuids: itemsToDestroy,
          message: `ASCENSÃO CELESTIAL! A Chama de Condor brilhou nos céus: ${Item.getDefinition(createdItem).name} emergiu em glória!`,
        };
      } else {
        return {
          success: false,
          mixType: req.mixType,
          rate,
          zenCost,
          destroyedItemUuids: itemsToDestroy,
          message: 'Colapso dimensional! As Chamas de Condor consumiram todos os ingredientes lendários!',
        };
      }
    }

    // ==========================================
    // RESULTADO DA CRIAÇÃO DE FRUTAS
    // ==========================================
    if (req.mixType === 'FRUIT_CREATION') {
      const itemsToDestroy = req.itemUuids;
      for (const uuid of itemsToDestroy) {
        inventory.removeItem(uuid);
      }

      if (isSuccess) {
        const fruitPool = ['fruit_strength', 'fruit_agility', 'fruit_vitality', 'fruit_energy', 'fruit_command'];
        const chosenDefId = fruitPool[Math.floor(Math.random() * fruitPool.length)];

        const createdItem = Item.create(chosenDefId);
        inventory.addItem(createdItem);

        return {
          success: true,
          mixType: req.mixType,
          rate,
          zenCost,
          createdItem,
          destroyedItemUuids: itemsToDestroy,
          message: `ALQUIMIA REALIZADA! A essência da Criação condensou: ${Item.getDefinition(createdItem).name} foi colhida!`,
        };
      } else {
        return {
          success: false,
          mixType: req.mixType,
          rate,
          zenCost,
          destroyedItemUuids: itemsToDestroy,
          message: 'As energias se desestabilizaram e a Joia da Criação se desfez em fumaça.',
        };
      }
    }

    // ==========================================
    // 3. RESULTADO DE REFINAMENTO +10 ATÉ +15
    // ==========================================
    if (req.mixType === 'ITEM_UPGRADE' && targetItem && ingredients) {
      // Remove joias catalisadoras consumidas
      const consumedJewels = [
        ...ingredients.chaosJewelUuids,
        ...ingredients.blessJewelUuids,
        ...ingredients.soulJewelUuids,
      ];

      for (const jewelUuid of consumedJewels) {
        inventory.removeItem(jewelUuid);
      }

      const prevLevel = targetItem.level;
      const targetNextLevel = prevLevel + 1;

      if (isSuccess) {
        targetItem.level += 1;
        const def = Item.getDefinition(targetItem);
        const isExcl = targetItem.excellentMask > 0;
        targetItem.maxDurability = def.baseDurability + targetItem.level * 2 + (isExcl ? 15 : 0);
        targetItem.durability = targetItem.maxDurability;

        return {
          success: true,
          mixType: req.mixType,
          rate,
          zenCost,
          updatedItem: targetItem,
          destroyedItemUuids: consumedJewels,
          message: `SUCESSO SUPREMO! ${Item.getDefinition(targetItem).name} foi aprimorado com sucesso para +${targetItem.level}!`,
        };
      } else {
        // Penalidade severa clássica
        if (targetNextLevel <= 12) {
          // +10, +11, +12: Perde níveis (regressão de 2 níveis)
          targetItem.level = Math.max(0, prevLevel - 2);
          const def = Item.getDefinition(targetItem);
          const isExcl = targetItem.excellentMask > 0;
          targetItem.maxDurability = def.baseDurability + targetItem.level * 2 + (isExcl ? 15 : 0);
          targetItem.durability = Math.min(targetItem.durability, targetItem.maxDurability);

          return {
            success: false,
            mixType: req.mixType,
            rate,
            zenCost,
            updatedItem: targetItem,
            destroyedItemUuids: consumedJewels,
            message: `A forja falhou! ${Item.getDefinition(targetItem).name} regrediu para +${targetItem.level}.`,
          };
        } else {
          // +13, +14, +15: Destruição total do item!
          inventory.removeItem(targetItem.uuid);
          return {
            success: false,
            mixType: req.mixType,
            rate,
            zenCost,
            itemDestroyed: true,
            destroyedItemUuids: [...consumedJewels, targetItem.uuid],
            message: `CATÁSTROFE NO CAOS! As energias colapsaram e ${Item.getDefinition(targetItem).name} foi pulverizado!`,
          };
        }
      }
    }

    return {
      success: false,
      mixType: req.mixType,
      rate: 0,
      zenCost: 0,
      destroyedItemUuids: [],
      message: 'Operação não suportada.',
    };
  }
}
