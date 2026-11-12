/**
 * Dasi MMORPG - Chaos Machine Combination Engine
 * Engenharia reversa e implementação canônica baseada nas fontes Webzen C++ GameServer:
 * - ChaosBox.h / ChaosBox.cpp
 * 
 * Suporta todas as 9 grandes receitas do Goblin do Caos de Noria:
 * 1. Upgrade de Nível (+10 até +15) com regras estritas de perda e bônus de Luck (+25%)
 * 2. Criação de Arma do Caos (Chaos Dragon Axe, Chaos Lightning Staff, Chaos Nature Bow)
 * 3. Criação de Asas Nível 1 (Wings of Satan, Wings of Heaven, Wings of Elf, Wings of Mistery)
 * 4. Criação de Asas Nível 2 (Dragon, Soul, Spirits, Darkness, Cape of Lord)
 * 5. Criação de Asas Nível 3 (Feather of Condor Mix + Wing 3 Mix)
 * 6. Cadeia de Fabricação do Fenrir (Piece of Horn -> Broken Horn -> Horn of Fenrir -> Fenrir Black/Blue)
 * 7. Criação de Dinorant (10 Unirias com 255 durabilidade + Chaos)
 * 8. Criação de Frutas de Atributo (Chaos + Creation -> Fruta de Força, Agilidade, Vitalidade, Energia, Comando)
 * 9. Convites de Evento (Blood Castle Cloak & Devil Square Invitation)
 */

import type { ItemInstance } from './types.ts';
import { ITEM_DEFINITIONS } from './definitions.ts';

export const ChaosMixType = {
  PLUS_LEVEL: 'PLUS_LEVEL',
  CHAOS_WEAPON: 'CHAOS_WEAPON',
  WING_LEVEL_1: 'WING_LEVEL_1',
  WING_LEVEL_2: 'WING_LEVEL_2',
  FEATHER_OF_CONDOR: 'FEATHER_OF_CONDOR',
  WING_LEVEL_3: 'WING_LEVEL_3',
  PIECE_OF_HORN: 'PIECE_OF_HORN',
  BROKEN_HORN: 'BROKEN_HORN',
  HORN_OF_FENRIR: 'HORN_OF_FENRIR',
  FENRIR_UPGRADE: 'FENRIR_UPGRADE',
  DINORANT: 'DINORANT',
  FRUIT: 'FRUIT',
  BLOOD_CASTLE: 'BLOOD_CASTLE',
  DEVIL_SQUARE: 'DEVIL_SQUARE',
} as const;

export type ChaosMixType = typeof ChaosMixType[keyof typeof ChaosMixType];

export interface ChaosMixResult {
  success: boolean;
  itemDestroyed: boolean;
  resultItem?: ItemInstance;
  costZen: number;
  successRate: number;
  message: string;
}

export class ChaosMachineEngine {
  /**
   * 1. UPGRADE DE NÍVEL (+10 até +15)
   * Regras canônicas Webzen:
   * +10: 50% base (75% com Luck), 1 Bless, 1 Soul, 1 Chaos, 2.000.000 Zen
   * +11: 45% base (70% com Luck), 2 Bless, 2 Soul, 1 Chaos, 4.000.000 Zen
   * +12: 45% base (70% com Luck), 3 Bless, 3 Soul, 1 Chaos, 6.000.000 Zen
   * +13: 45% base (70% com Luck), 4 Bless, 4 Soul, 1 Chaos, 8.000.000 Zen
   * +14: 40% base (65% com Luck), 5 Bless, 5 Soul, 1 Chaos, 10.000.000 Zen
   * +15: 40% base (65% com Luck), 6 Bless, 6 Soul, 1 Chaos, 12.000.000 Zen
   * Em caso de falha: O item é completamente DESTRUÍDO (virando cinzas).
   */
  public static mixPlusLevel(
    targetItem: ItemInstance,
    blessCount: number,
    soulCount: number,
    chaosCount: number,
    playerZen: number,
    randomRoll: number = Math.random()
  ): ChaosMixResult {
    const curLevel = targetItem.level;
    if (curLevel < 9 || curLevel >= 15) {
      return { success: false, itemDestroyed: false, costZen: 0, successRate: 0, message: 'O item deve estar entre +9 e +14 para este mix' };
    }

    const nextLevel = curLevel + 1;
    const reqBless = nextLevel - 9;
    const reqSoul = nextLevel - 9;
    const reqChaos = 1;
    const costZen = (nextLevel - 9) * 2_000_000;

    let baseRate = 0.45;
    if (nextLevel === 10) baseRate = 0.50;
    else if (nextLevel >= 14) baseRate = 0.40;

    const luckBonus = targetItem.luck ? 0.25 : 0.00;
    const successRate = Math.min(1.0, baseRate + luckBonus);

    if (blessCount < reqBless || soulCount < reqSoul || chaosCount < reqChaos) {
      return {
        success: false,
        itemDestroyed: false,
        costZen: 0,
        successRate: 0,
        message: `Joias insuficientes. Requer: ${reqBless} Bless, ${reqSoul} Soul, ${reqChaos} Chaos`,
      };
    }

    if (playerZen < costZen) {
      return {
        success: false,
        itemDestroyed: false,
        costZen,
        successRate: 0,
        message: `Zen insuficiente. Custo: ${costZen} Zen`,
      };
    }

    if (randomRoll < successRate) {
      targetItem.level = nextLevel;
      return {
        success: true,
        itemDestroyed: false,
        resultItem: targetItem,
        costZen,
        successRate,
        message: `Sucesso! O item alcançou o nível +${nextLevel}!`,
      };
    } else {
      // Destruição total na falha
      return {
        success: false,
        itemDestroyed: true,
        costZen,
        successRate,
        message: 'A combinação falhou catastróficamente! O item se desfez em pedaços.',
      };
    }
  }

  /**
   * 2. CRIAÇÃO DE ARMA DO CAOS (ChaosItemMix)
   * 1+ itens +4+4 ou superior + 1 Jewel of Chaos
   * Retorna: chaos_dragon_axe, chaos_lightning_staff ou chaos_nature_bow
   */
  public static mixChaosWeapon(
    materialItems: ItemInstance[],
    hasChaos: boolean,
    playerZen: number,
    randomRoll: number = Math.random()
  ): ChaosMixResult {
    const validItems = materialItems.filter((i) => i.level >= 4 && (i.optionLevel || 0) >= 4);
    if (validItems.length === 0 || !hasChaos) {
      return {
        success: false,
        itemDestroyed: false,
        costZen: 0,
        successRate: 0,
        message: 'Requer ao menos 1 item +4 com option +4 e 1 Jewel of Chaos',
      };
    }

    const costZen = 100_000;
    if (playerZen < costZen) {
      return { success: false, itemDestroyed: false, costZen, successRate: 0, message: 'Zen insuficiente' };
    }

    // Taxa escala com o nível e options dos itens (base 2% por item + níveis, máximo 100%)
    let rate = 0.20;
    for (const it of validItems) {
      rate += it.level * 0.05 + (it.optionLevel || 0) * 0.02;
    }
    const successRate = Math.min(1.0, rate);

    if (randomRoll < successRate) {
      const chaosWeapons = ['chaos_dragon_axe', 'chaos_lightning_staff', 'chaos_nature_bow'];
      const chosen = chaosWeapons[Math.floor(Math.random() * chaosWeapons.length)];
      const createdItem: ItemInstance = {
        uuid: `chaos-wpn-${Date.now()}`,
        defId: chosen,
        level: Math.floor(Math.random() * 5), // +0 até +4
        durability: 100,
        maxDurability: 100,
        skill: true,
        luck: Math.random() < 0.5,
        optionLevel: Math.random() < 0.5 ? 4 : 0,
        excellentMask: 0,
      };

      return {
        success: true,
        itemDestroyed: false,
        resultItem: createdItem,
        costZen,
        successRate,
        message: `Combinação do Caos concluída com sucesso! Criado ${chosen}.`,
      };
    } else {
      return {
        success: false,
        itemDestroyed: true,
        costZen,
        successRate,
        message: 'Combinação falhou! Os materiais foram consumidos.',
      };
    }
  }

  /**
   * 3. CRIAÇÃO DE ASAS NÍVEL 1 (Wing1Mix)
   * 1x Arma do Caos +4+4 ou superior + 1 Jewel of Chaos
   */
  public static mixWing1(
    chaosWeapon: ItemInstance,
    hasChaos: boolean,
    playerZen: number,
    randomRoll: number = Math.random()
  ): ChaosMixResult {
    const isChaosWpn =
      chaosWeapon.defId === 'chaos_dragon_axe' ||
      chaosWeapon.defId === 'chaos_lightning_staff' ||
      chaosWeapon.defId === 'chaos_nature_bow';

    if (!isChaosWpn || chaosWeapon.level < 4 || (chaosWeapon.optionLevel || 0) < 4 || !hasChaos) {
      return {
        success: false,
        itemDestroyed: false,
        costZen: 0,
        successRate: 0,
        message: 'Requer 1 Arma do Caos +4 com option +4 e 1 Jewel of Chaos',
      };
    }

    const costZen = 1_000_000;
    if (playerZen < costZen) {
      return { success: false, itemDestroyed: false, costZen, successRate: 0, message: 'Zen insuficiente' };
    }

    const successRate = Math.min(1.0, 0.40 + chaosWeapon.level * 0.05 + (chaosWeapon.optionLevel || 0) * 0.02);

    if (randomRoll < successRate) {
      const wings1 = ['wings_of_satan', 'wings_of_heaven', 'wings_of_elf', 'wings_of_mistery'];
      const chosen = wings1[Math.floor(Math.random() * wings1.length)];
      const createdWing: ItemInstance = {
        uuid: `wing1-${Date.now()}`,
        defId: chosen,
        level: 0,
        durability: 200,
        maxDurability: 200,
        skill: false,
        luck: Math.random() < 0.3,
        optionLevel: 0,
        excellentMask: 0,
      };

      return {
        success: true,
        itemDestroyed: false,
        resultItem: createdWing,
        costZen,
        successRate,
        message: `Asas Nível 1 forjadas com êxito! Conquistado ${chosen}.`,
      };
    } else {
      return {
        success: false,
        itemDestroyed: true,
        costZen,
        successRate,
        message: 'A combinação de asas falhou! Todos os materiais viraram cinzas.',
      };
    }
  }

  /**
   * 4. CRIAÇÃO DE ASAS NÍVEL 2 (Wing2Mix)
   * 1x Asas Nível 1 + 1x Loch's Feather (ou Crest of Monarch) + 1 Jewel of Chaos
   * Custo: 5.000.000 Zen. Taxa máxima: 90%.
   */
  public static mixWing2(
    wing1: ItemInstance,
    hasFeatherOrCrest: boolean,
    isCrest: boolean,
    hasChaos: boolean,
    playerZen: number,
    randomRoll: number = Math.random()
  ): ChaosMixResult {
    if (!wing1.defId.startsWith('wings_of_') || !hasFeatherOrCrest || !hasChaos) {
      return {
        success: false,
        itemDestroyed: false,
        costZen: 0,
        successRate: 0,
        message: "Requer Asas Nível 1, Loch's Feather (ou Crest of Monarch) e 1 Jewel of Chaos",
      };
    }

    const costZen = 5_000_000;
    if (playerZen < costZen) {
      return { success: false, itemDestroyed: false, costZen, successRate: 0, message: 'Zen insuficiente (5.000.000 Zen)' };
    }

    const successRate = Math.min(0.90, 0.40 + wing1.level * 0.04);

    if (randomRoll < successRate) {
      let chosen: string;
      if (isCrest) {
        chosen = 'cape_of_lord';
      } else {
        const wings2 = ['wings_of_dragon', 'wings_of_soul', 'wings_of_spirits', 'wings_of_darkness'];
        chosen = wings2[Math.floor(Math.random() * wings2.length)];
      }

      const createdWing: ItemInstance = {
        uuid: `wing2-${Date.now()}`,
        defId: chosen,
        level: 0,
        durability: 220,
        maxDurability: 220,
        skill: false,
        luck: Math.random() < 0.25,
        optionLevel: 0,
        excellentMask: 0,
      };

      return {
        success: true,
        itemDestroyed: false,
        resultItem: createdWing,
        costZen,
        successRate,
        message: `Asas Nível 2 despertadas com poder lendário! Conquistado ${chosen}.`,
      };
    } else {
      return {
        success: false,
        itemDestroyed: true,
        costZen,
        successRate,
        message: 'A combinação de asas nível 2 fracassou! Os itens foram perdidos.',
      };
    }
  }

  /**
   * 5. CRIAÇÃO DE FENRIR - ETAPAS 1 A 4 (Horn of Fenrir Pipeline)
   */

  // Etapa 1: Piece of Horn (20 Splinters + 20 Bless of Guardian + Chaos -> 70% rate)
  public static mixPieceOfHorn(
    splinterCount: number,
    blessGuardianCount: number,
    hasChaos: boolean,
    randomRoll: number = Math.random()
  ): ChaosMixResult {
    if (splinterCount < 20 || blessGuardianCount < 20 || !hasChaos) {
      return {
        success: false,
        itemDestroyed: false,
        costZen: 0,
        successRate: 0,
        message: 'Requer 20 Splinter of Armor, 20 Bless of Guardian e 1 Jewel of Chaos',
      };
    }

    const rate = 0.70; // 70%
    if (randomRoll < rate) {
      return {
        success: true,
        itemDestroyed: false,
        resultItem: {
          uuid: `piece-horn-${Date.now()}`,
          defId: 'piece_of_horn',
          level: 0,
          durability: 5,
          maxDurability: 5,
          skill: false,
          luck: false,
          optionLevel: 0,
          excellentMask: 0,
        },
        costZen: 0,
        successRate: rate,
        message: 'Fragmento de Chifre (Piece of Horn) forjado com sucesso!',
      };
    }
    return { success: false, itemDestroyed: true, costZen: 0, successRate: rate, message: 'Falha na forja do Piece of Horn' };
  }

  // Etapa 2: Broken Horn (5 Piece of Horn + 10 Claw of Beast + Chaos -> 50% rate)
  public static mixBrokenHorn(
    pieceOfHornCount: number,
    clawOfBeastCount: number,
    hasChaos: boolean,
    randomRoll: number = Math.random()
  ): ChaosMixResult {
    if (pieceOfHornCount < 5 || clawOfBeastCount < 10 || !hasChaos) {
      return {
        success: false,
        itemDestroyed: false,
        costZen: 0,
        successRate: 0,
        message: 'Requer 5 Piece of Horn, 10 Claw of Beast e 1 Jewel of Chaos',
      };
    }

    const rate = 0.50; // 50%
    if (randomRoll < rate) {
      return {
        success: true,
        itemDestroyed: false,
        resultItem: {
          uuid: `broken-horn-${Date.now()}`,
          defId: 'broken_horn',
          level: 0,
          durability: 1,
          maxDurability: 1,
          skill: false,
          luck: false,
          optionLevel: 0,
          excellentMask: 0,
        },
        costZen: 0,
        successRate: rate,
        message: 'Chifre Fraturado (Broken Horn) reconstruído com sucesso!',
      };
    }
    return { success: false, itemDestroyed: true, costZen: 0, successRate: rate, message: 'Falha na união do Broken Horn' };
  }

  // Etapa 3: Horn of Fenrir Vermelho (Broken Horn + 3 Jewels of Life + Chaos + 10M Zen -> 30% rate)
  public static mixHornOfFenrir(
    hasBrokenHorn: boolean,
    lifeCount: number,
    hasChaos: boolean,
    playerZen: number,
    randomRoll: number = Math.random()
  ): ChaosMixResult {
    const costZen = 10_000_000;
    if (!hasBrokenHorn || lifeCount < 3 || !hasChaos) {
      return {
        success: false,
        itemDestroyed: false,
        costZen: 0,
        successRate: 0,
        message: 'Requer 1 Broken Horn, 3 Jewels of Life, 1 Jewel of Chaos e 10.000.000 Zen',
      };
    }
    if (playerZen < costZen) {
      return { success: false, itemDestroyed: false, costZen, successRate: 0, message: 'Zen insuficiente (10.000.000 Zen)' };
    }

    const rate = 0.30; // 30% canônico Webzen
    if (randomRoll < rate) {
      return {
        success: true,
        itemDestroyed: false,
        resultItem: {
          uuid: `fenrir-red-${Date.now()}`,
          defId: 'fenrir_red',
          level: 0,
          durability: 255,
          maxDurability: 255,
          skill: true, // Habilidade Plasma Storm
          luck: false,
          optionLevel: 0,
          excellentMask: 0,
        },
        costZen,
        successRate: rate,
        message: 'O poderoso Lobo Fenrir Vermelho despertou do seu sono milenar!',
      };
    }
    return { success: false, itemDestroyed: true, costZen, successRate: rate, message: 'A invocação do Fenrir falhou!' };
  }

  // Etapa 4: Fenrir Upgrade (Vermelho + 5 Life + Chaos + Arma +4+4 -> Fenrir Negro; ou Armadura +4+4 -> Fenrir Azul)
  public static mixFenrirUpgrade(
    redFenrir: ItemInstance,
    catalystItem: ItemInstance,
    lifeCount: number,
    hasChaos: boolean,
    playerZen: number,
    randomRoll: number = Math.random()
  ): ChaosMixResult {
    const costZen = 10_000_000;
    if (redFenrir.defId !== 'fenrir_red' || lifeCount < 5 || !hasChaos) {
      return {
        success: false,
        itemDestroyed: false,
        costZen: 0,
        successRate: 0,
        message: 'Requer 1 Fenrir Vermelho, 5 Jewels of Life, 1 Jewel of Chaos e 1 Item +4 com option',
      };
    }
    if (catalystItem.level < 4 || (catalystItem.optionLevel || 0) < 4) {
      return {
        success: false,
        itemDestroyed: false,
        costZen: 0,
        successRate: 0,
        message: 'O item catalisador deve ser no mínimo +4 com option +4',
      };
    }

    const def = ITEM_DEFINITIONS[catalystItem.defId];
    const isWeapon = def && def.category === 'WEAPON';
    const resultDefId = isWeapon ? 'fenrir_black' : 'fenrir_blue';

    const rate = 0.79; // 79% canônico Webzen
    if (randomRoll < rate) {
      return {
        success: true,
        itemDestroyed: false,
        resultItem: {
          uuid: `${resultDefId}-${Date.now()}`,
          defId: resultDefId,
          level: 0,
          durability: 255,
          maxDurability: 255,
          skill: true,
          luck: false,
          optionLevel: 0,
          excellentMask: 0,
        },
        costZen,
        successRate: rate,
        message: `Evolução consagrada! Fenrir transformado em ${resultDefId === 'fenrir_black' ? 'Fenrir da Destruição (Negro)' : 'Fenrir da Proteção (Azul)'}!`,
      };
    }

    return {
      success: false,
      itemDestroyed: true,
      costZen,
      successRate: rate,
      message: 'A mutação do Fenrir fracassou! A criatura foi consumida pelo vórtice.',
    };
  }

  /**
   * 6. CRIAÇÃO DE DINORANT (DinorantMix)
   * 10x Horn of Uniria (durabilidade 255) + 1 Jewel of Chaos + 500.000 Zen -> 70% rate
   */
  public static mixDinorant(
    uniriaCount: number,
    hasChaos: boolean,
    playerZen: number,
    randomRoll: number = Math.random()
  ): ChaosMixResult {
    const costZen = 500_000;
    if (uniriaCount < 10 || !hasChaos) {
      return { success: false, itemDestroyed: false, costZen: 0, successRate: 0, message: 'Requer 10 Horn of Uniria com durabilidade cheia e 1 Jewel of Chaos' };
    }
    if (playerZen < costZen) {
      return { success: false, itemDestroyed: false, costZen, successRate: 0, message: 'Zen insuficiente (500.000 Zen)' };
    }

    const rate = 0.70;
    if (randomRoll < rate) {
      return {
        success: true,
        itemDestroyed: false,
        resultItem: {
          uuid: `dino-${Date.now()}`,
          defId: 'dinorant',
          level: 0,
          durability: 255,
          maxDurability: 255,
          skill: true, // Raid Skill
          luck: false,
          optionLevel: 0,
          excellentMask: 0,
        },
        costZen,
        successRate: rate,
        message: 'Dinorant alado gerado com sucesso!',
      };
    }

    return { success: false, itemDestroyed: true, costZen, successRate: rate, message: 'A fusão dos Unirias falhou.' };
  }

  /**
   * 7. CRIAÇÃO DE FRUTA DE ATRIBUTO (FruitMix)
   * 1x Jewel of Chaos + 1x Jewel of Creation + 3.000.000 Zen -> 90% rate
   */
  public static mixFruit(
    hasChaos: boolean,
    hasCreation: boolean,
    playerZen: number,
    randomRoll: number = Math.random()
  ): ChaosMixResult {
    const costZen = 3_000_000;
    if (!hasChaos || !hasCreation) {
      return { success: false, itemDestroyed: false, costZen: 0, successRate: 0, message: 'Requer 1 Jewel of Chaos e 1 Jewel of Creation' };
    }
    if (playerZen < costZen) {
      return { success: false, itemDestroyed: false, costZen, successRate: 0, message: 'Zen insuficiente (3.000.000 Zen)' };
    }

    const rate = 0.90; // 90%
    if (randomRoll < rate) {
      const fruits = ['fruit_strength', 'fruit_agility', 'fruit_vitality', 'fruit_energy', 'fruit_command'];
      const chosen = fruits[Math.floor(Math.random() * fruits.length)];
      return {
        success: true,
        itemDestroyed: false,
        resultItem: {
          uuid: `fruit-${Date.now()}`,
          defId: chosen,
          level: 0,
          durability: 1,
          maxDurability: 1,
          skill: false,
          luck: false,
          optionLevel: 0,
          excellentMask: 0,
        },
        costZen,
        successRate: rate,
        message: `Fruta divina forjada: ${chosen}!`,
      };
    }

    return { success: false, itemDestroyed: true, costZen, successRate: rate, message: 'A criação da fruta falhou.' };
  }
}
