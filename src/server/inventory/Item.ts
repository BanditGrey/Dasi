import {
  ItemCategory,
  WeaponExcellentOption,
  ArmorExcellentOption,
} from './types.ts';
import type {
  ItemInstance,
  ItemDefinition,
  HarmonyOption,
} from './types.ts';
import { ITEM_DEFINITIONS } from './definitions.ts';

let uuidCounter = 1;

/**
 * Utilitário simples para gerar UUIDs sequenciais com timestamp e randomicidade
 */
export function generateItemUUID(): string {
  const time = Date.now().toString(16);
  const rand = Math.random().toString(16).substring(2, 8);
  const seq = (uuidCounter++).toString(16).padStart(4, '0');
  return `item-${time}-${rand}-${seq}`;
}

export class Item {
  /**
   * Instancia um item a partir da definição base
   */
  public static create(
    defId: string,
    options: Partial<Omit<ItemInstance, 'uuid' | 'defId'>> = {}
  ): ItemInstance {
    const def = ITEM_DEFINITIONS[defId];
    if (!def) {
      throw new Error(`Definição de item não encontrada: ${defId}`);
    }

    const level = Math.max(0, Math.min(15, options.level ?? 0));
    const isExcl = (options.excellentMask ?? 0) > 0;
    const maxDur = def.baseDurability + level * 2 + (isExcl ? 15 : 0);

    return {
      uuid: generateItemUUID(),
      defId,
      level,
      durability: options.durability ?? maxDur,
      maxDurability: maxDur,
      skill: options.skill ?? false,
      luck: options.luck ?? false,
      optionLevel: options.optionLevel ?? 0,
      excellentMask: options.excellentMask ?? 0,
      harmonyOption: options.harmonyOption ?? null,
      rotated: options.rotated ?? false,
    };
  }

  /**
   * Obtém a definição estática do item
   */
  public static getDefinition(item: ItemInstance): ItemDefinition {
    const def = ITEM_DEFINITIONS[item.defId];
    if (!def) {
      throw new Error(`Item definition not found: ${item.defId}`);
    }
    return def;
  }

  /**
   * Retorna as dimensões efetivas do item considerando se está rotacionado
   */
  public static getDimensions(item: ItemInstance): { width: number; height: number } {
    const def = this.getDefinition(item);
    if (item.rotated) {
      return { width: def.height, height: def.width };
    }
    return { width: def.width, height: def.height };
  }

  /**
   * Verifica se o item possui uma opção excelente específica
   */
  public static hasExcellentOption(item: ItemInstance, mask: number): boolean {
    return (item.excellentMask & mask) === mask;
  }

  /**
   * Adiciona uma opção excelente ao item
   */
  public static addExcellentOption(item: ItemInstance, mask: number): void {
    item.excellentMask |= mask;
    // Recalcula durabilidade com bônus de excelente se necessário
    const def = this.getDefinition(item);
    item.maxDurability = def.baseDurability + item.level * 2 + 15;
    item.durability = Math.min(item.durability, item.maxDurability);
  }

  /**
   * Conta a quantidade de opções excelentes ativas
   */
  public static countExcellentOptions(item: ItemInstance): number {
    let count = 0;
    let mask = item.excellentMask;
    while (mask > 0) {
      count += mask & 1;
      mask >>= 1;
    }
    return count;
  }

  /**
   * Calcula o poder de ataque total (Mínimo / Máximo) com bônus de Nível, Joia da Vida e Excelência
   */
  public static calculateDamage(item: ItemInstance): { min: number; max: number } {
    const def = this.getDefinition(item);
    if (def.category !== ItemCategory.WEAPON || def.minDamage === undefined || def.maxDamage === undefined) {
      return { min: 0, max: 0 };
    }

    // Bônus de nível (+3 por nível até +9, +4 por nível de +10 até +15)
    let levelBonus = 0;
    if (item.level <= 9) {
      levelBonus = item.level * 3;
    } else {
      levelBonus = 9 * 3 + (item.level - 9) * 4;
    }

    // Bônus da Joia da Vida (+4, +8, +12, +16, +20, +24, +28)
    const lifeBonus = item.optionLevel;

    // Bônus base da arma
    let min = def.minDamage + levelBonus + lifeBonus;
    let max = def.maxDamage + levelBonus + lifeBonus;

    // Se tiver opção excelente +2% dano
    if (this.hasExcellentOption(item, WeaponExcellentOption.INCREASE_DMG_2_PERCENT)) {
      min = Math.floor(min * 1.02);
      max = Math.floor(max * 1.02);
    }

    // Bônus de Harmonia (Amarelo)
    if (item.harmonyOption?.type === 'MIN_ATTACK_POWER') {
      min += item.harmonyOption.value;
    }
    if (item.harmonyOption?.type === 'MAX_ATTACK_POWER') {
      max += item.harmonyOption.value;
    }

    return { min, max };
  }

  /**
   * Calcula a defesa total com bônus de Nível, Joia da Vida e Excelência
   */
  public static calculateDefense(item: ItemInstance): number {
    const def = this.getDefinition(item);
    if (def.defense === undefined) {
      return 0;
    }

    let levelBonus = 0;
    if (item.level <= 9) {
      levelBonus = item.level * 3;
    } else {
      levelBonus = 9 * 3 + (item.level - 9) * 4;
    }

    const lifeBonus = item.optionLevel;
    let totalDefense = def.defense + levelBonus + lifeBonus;

    if (item.harmonyOption?.type === 'DEFENSE_POWER') {
      totalDefense += item.harmonyOption.value;
    }

    return totalDefense;
  }

  /**
   * Calcula os atributos mínimos requeridos ajustados pelo nível do item
   */
  public static calculateRequirements(item: ItemInstance): {
    strength: number;
    agility: number;
    energy: number;
    level: number;
  } {
    const def = this.getDefinition(item);
    const req = def.requirements;
    const levelFactor = 1 + item.level * 0.03;

    return {
      strength: Math.floor((req.strength || 0) * levelFactor),
      agility: Math.floor((req.agility || 0) * levelFactor),
      energy: Math.floor((req.energy || 0) * (req.energy ? levelFactor : 0)),
      level: req.level || 0,
    };
  }

  /**
   * Formata o nome completo e detalhado do item com todos os prefixos e sufixos
   */
  public static getDisplayName(item: ItemInstance): string {
    const def = this.getDefinition(item);
    const parts: string[] = [];

    const isExcl = item.excellentMask > 0;
    if (isExcl) parts.push('Excellent');
    parts.push(def.name);

    if (item.level > 0) {
      parts.push(`+${item.level}`);
    }

    const tags: string[] = [];
    if (item.skill) tags.push('Skill');
    if (item.luck) tags.push('Luck');
    if (item.optionLevel > 0) tags.push(`+${item.optionLevel}`);
    if (item.harmonyOption) {
      tags.push(`Harmony: ${item.harmonyOption.type}+${item.harmonyOption.value}`);
    }

    if (tags.length > 0) {
      parts.push(`[${tags.join(' ')}]`);
    }

    return parts.join(' ');
  }
}
