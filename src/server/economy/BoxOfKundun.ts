/**
 * Dasi MMORPG - Sistema de Abertura de Box of Kundun (+1 a +5) e Consumo de Frutas
 * Autoritativo, determinístico e balanceado com base nas tabelas canônicas.
 */

import { Item } from '../inventory/Item.ts';
import { WeaponExcellentOption, ArmorExcellentOption, type ItemInstance } from '../inventory/types.ts';
import type { CharacterSummary } from '../network/protocol.ts';

export interface BoxDropResult {
  success: boolean;
  boxDefId: string;
  item: ItemInstance;
  message: string;
}

export interface FruitConsumeResult {
  success: boolean;
  statGained: 'strength' | 'agility' | 'vitality' | 'energy' | 'command';
  pointsGained: number;
  newTotal: number;
  message: string;
}

export const KUNDUN_BOX_POOLS: Record<string, string[]> = {
  box_of_kundun_1: [
    'small_dagger', 'short_sword', 'gladius', 'short_bow', 'skull_staff',
    'leather_helm', 'leather_armor', 'leather_pants', 'leather_gloves', 'leather_boots',
    'pad_helm', 'pad_armor', 'pad_pants', 'pad_gloves', 'pad_boots',
    'vine_helm', 'vine_armor', 'vine_pants', 'vine_gloves', 'vine_boots',
    'small_shield', 'ring_of_ice',
  ],
  box_of_kundun_2: [
    'falchion', 'blade', 'elven_bow', 'angelic_staff', 'battle_scepter',
    'bronze_helm', 'bronze_armor', 'bronze_pants', 'bronze_gloves', 'bronze_boots',
    'bone_helm', 'bone_armor', 'bone_pants', 'bone_gloves', 'bone_boots',
    'silk_helm', 'silk_armor', 'silk_pants', 'silk_gloves', 'silk_boots',
    'scale_helm', 'scale_armor', 'scale_pants', 'scale_gloves', 'scale_boots',
    'horn_shield', 'ring_of_poison',
  ],
  box_of_kundun_3: [
    'broad_sword', 'crystal_sword', 'battle_bow', 'serpent_staff', 'master_scepter',
    'chaos_dragon_axe', 'chaos_nature_bow', 'chaos_lightning_staff',
    'brass_helm', 'brass_armor', 'brass_pants', 'brass_gloves', 'brass_boots',
    'plate_helm', 'plate_armor', 'plate_pants', 'plate_gloves', 'plate_boots',
    'sphinx_helm', 'sphinx_armor', 'sphinx_pants', 'sphinx_gloves', 'sphinx_boots',
    'wind_helm', 'wind_armor', 'wind_pants', 'wind_gloves', 'wind_boots',
    'spirit_helm', 'spirit_armor', 'spirit_pants', 'spirit_gloves', 'spirit_boots',
    'kite_shield', 'light_plate_armor', 'pendant_of_ability',
  ],
  box_of_kundun_4: [
    'dragon_blade', 'sword_of_destruction', 'tiger_bow', 'silver_bow', 'gorgon_staff',
    'legendary_staff', 'great_lord_scepter', 'rune_blade', 'thunder_sword',
    'dragon_helm', 'dragon_armor', 'dragon_pants', 'dragon_gloves', 'dragon_boots',
    'legendary_helm', 'legendary_armor', 'legendary_pants', 'legendary_gloves', 'legendary_boots',
    'guardian_helm', 'guardian_armor', 'guardian_pants', 'guardian_gloves', 'guardian_boots',
    'storm_crow_armor', 'storm_crow_pants', 'storm_crow_gloves', 'storm_crow_boots',
    'dark_steel_armor', 'skull_shield', 'plate_shield', 'dragon_shield',
    'ring_of_fire', 'pendant_of_lightning',
  ],
  box_of_kundun_5: [
    'archangel_sword', 'knight_blade', 'bone_blade', 'celestial_bow', 'arrow_viper_bow',
    'saint_crossbow', 'archangel_crossbow', 'great_reign_crossbow',
    'kundun_staff', 'archangel_staff', 'grand_viper_staff', 'dark_reign_blade',
    'shining_scepter', 'solay_scepter',
    'black_dragon_helm', 'black_dragon_armor', 'black_dragon_pants', 'black_dragon_gloves', 'black_dragon_boots',
    'dark_phoenix_helm', 'dark_phoenix_armor', 'dark_phoenix_pants', 'dark_phoenix_gloves', 'dark_phoenix_boots',
    'great_dragon_helm', 'great_dragon_armor', 'great_dragon_pants', 'great_dragon_gloves', 'great_dragon_boots',
    'grand_soul_helm', 'grand_soul_armor', 'grand_soul_pants', 'grand_soul_gloves', 'grand_soul_boots',
    'dark_soul_helm', 'dark_soul_armor', 'dark_soul_pants', 'dark_soul_gloves', 'dark_soul_boots',
    'divine_helm', 'divine_armor', 'divine_pants', 'divine_gloves', 'divine_boots',
    'hurricane_armor', 'hurricane_pants', 'hurricane_gloves', 'hurricane_boots',
    'dark_master_helm', 'dark_master_armor', 'dark_master_pants', 'dark_master_gloves', 'dark_master_boots',
    'tower_shield', 'grand_soul_shield', 'ring_of_earth', 'pendant_of_wind',
  ],
};

export class BoxOfKundunSystem {
  /**
   * Abre uma Box of Kundun e instancia um item com opções excelentes
   */
  public static openBox(boxDefId: string, rngRoll?: number): BoxDropResult {
    const pool = KUNDUN_BOX_POOLS[boxDefId] || KUNDUN_BOX_POOLS.box_of_kundun_1;
    const index = Math.floor((rngRoll !== undefined ? rngRoll : Math.random()) * pool.length);
    const chosenDefId = pool[Math.min(pool.length - 1, Math.max(0, index))];

    // Sorteia nível (0 a 3) e opções excelentes (1 a 2 opções)
    const level = Math.floor(Math.random() * 4);
    const luck = Math.random() < 0.60;
    const skill = Math.random() < 0.60;

    // Excelência garantida da Box of Kundun
    let excellentMask = 0;
    const isWeapon =
      chosenDefId.includes('sword') ||
      chosenDefId.includes('blade') ||
      chosenDefId.includes('bow') ||
      chosenDefId.includes('staff') ||
      chosenDefId.includes('scepter') ||
      chosenDefId.includes('axe') ||
      chosenDefId.includes('dagger') ||
      chosenDefId.includes('crossbow');

    if (isWeapon) {
      excellentMask |= WeaponExcellentOption.EXCELLENT_DAMAGE_10_PCT;
      if (Math.random() < 0.5) excellentMask |= WeaponExcellentOption.ATTACK_SPEED_7;
    } else {
      excellentMask |= ArmorExcellentOption.DAMAGE_DECREASE_4_PCT;
      if (Math.random() < 0.5) excellentMask |= ArmorExcellentOption.DEFENSE_RATE_10_PCT;
    }

    const item = Item.create(chosenDefId, {
      level,
      luck,
      skill,
      excellentMask,
      optionLevel: Math.random() < 0.4 ? 4 : 0,
    });

    const def = Item.getDefinition(item);

    return {
      success: true,
      boxDefId,
      item,
      message: `A ${boxDefId.toUpperCase()} explodiu em um feixe de luz verde esmeralda: Excelente ${def.name} +${item.level} foi revelado!`,
    };
  }

  /**
   * Consome uma fruta de atributos gerada pela Jewel of Creation e aplica permanentemente no personagem
   */
  public static consumeFruit(fruitDefId: string, character: CharacterSummary): FruitConsumeResult {
    const points = Math.floor(Math.random() * 3) + 1; // 1 a 3 pontos
    let statGained: 'strength' | 'agility' | 'vitality' | 'energy' | 'command' = 'strength';

    if (fruitDefId === 'fruit_strength') {
      statGained = 'strength';
      character.strength = (character.strength ?? 0) + points;
    } else if (fruitDefId === 'fruit_agility') {
      statGained = 'agility';
      character.agility = (character.agility ?? 0) + points;
    } else if (fruitDefId === 'fruit_vitality') {
      statGained = 'vitality';
      character.vitality = (character.vitality ?? 0) + points;
    } else if (fruitDefId === 'fruit_energy') {
      statGained = 'energy';
      character.energy = (character.energy ?? 0) + points;
    } else if (fruitDefId === 'fruit_command') {
      statGained = 'command';
      character.command = (character.command ?? 0) + points;
    }

    const newTotal = (character as any)[statGained];

    return {
      success: true,
      statGained,
      pointsGained: points,
      newTotal,
      message: `Você saboreou a Fruta Mágica! +${points} pontos adicionados a ${statGained.toUpperCase()} (Novo Total: ${newTotal}).`,
    };
  }
}

export const BoxOfKundun = BoxOfKundunSystem;
