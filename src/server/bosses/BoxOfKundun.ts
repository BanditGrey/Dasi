/**
 * Dasi MMORPG - Caixa de Kundun (Box of Kundun +1 até +5)
 * Gera itens excelentes clássicos, pilhas de joias e dispersão física ao ser aberta.
 */

import { Item } from '../inventory/Item.ts';
import { WeaponExcellentOption, ArmorExcellentOption, ItemCategory, type ItemInstance } from '../inventory/types.ts';
import type { GroundDropItem } from '../combat/Monster.ts';
import { KUNDUN_BOX_POOLS, BoxOfKundunSystem } from '../economy/BoxOfKundun.ts';

export interface BoxLootResult {
  boxDefId: string;
  tier: number;
  items: ItemInstance[];
  zen: number;
  groundDrops: GroundDropItem[];
}

export class BoxOfKundun {
  /**
   * Identifica o tier da Box (+1 a +5) a partir do ID
   */
  public static getTierFromId(boxId: string): number {
    switch (boxId) {
      case 'box_of_kundun_1': return 1;
      case 'box_of_kundun_2': return 2;
      case 'box_of_kundun_3': return 3;
      case 'box_of_kundun_4': return 4;
      case 'box_of_kundun_5': return 5;
      default: return 1;
    }
  }

  /**
   * Abre a Box of Kundun e projeta os drops com dispersão física
   */
  public static openBox(boxId: string, playerX: number, playerY: number, ownerSessionId?: string): BoxLootResult {
    const tier = BoxOfKundun.getTierFromId(boxId);
    const now = Date.now();
    const expiresAt = now + 45000;
    const generatedItems: ItemInstance[] = [];
    const groundDrops: GroundDropItem[] = [];

    // Zen progressivo com o tier
    const zen = 10000 * Math.pow(2.2, tier);

    // 1. Geração de Equipamento Excelente Canônico de Acordo com o Tier
    const canonicalPool = KUNDUN_BOX_POOLS[boxId] || KUNDUN_BOX_POOLS.box_of_kundun_1;
    const baseLevel = Math.min(6, tier);

    // Seleciona 1 a 2 itens de equipamento
    const equipmentCount = tier >= 4 ? 2 : 1;
    for (let i = 0; i < equipmentCount; i++) {
      const chosenDefId = canonicalPool[Math.floor(Math.random() * canonicalPool.length)];
      const isWeapon = chosenDefId.includes('sword') ||
        chosenDefId.includes('blade') ||
        chosenDefId.includes('bow') ||
        chosenDefId.includes('staff') ||
        chosenDefId.includes('scepter') ||
        chosenDefId.includes('axe') ||
        chosenDefId.includes('dagger') ||
        chosenDefId.includes('crossbow');

      const itemLevel = Math.floor(Math.random() * (baseLevel + 1));
      const hasSkill = isWeapon;
      const hasLuck = Math.random() < 0.75; // Sorte alta na Box de Kundun

      // Combinação de Opções Excelentes
      let excellentOptions = 0;
      if (isWeapon) {
        excellentOptions = WeaponExcellentOption.INCREASE_DMG_2_PERCENT | WeaponExcellentOption.EXCELLENT_DAMAGE_10_PCT;
      } else {
        excellentOptions = ArmorExcellentOption.DEFENSE_RATE_10_PCT | ArmorExcellentOption.DAMAGE_DECREASE_4_PCT;
      }

      const item = Item.create(chosenDefId, {
        level: itemLevel,
        skill: hasSkill,
        luck: hasLuck,
        excellentMask: excellentOptions,
      });

      generatedItems.push(item);
    }

    // 2. Joias Sagradas Garantidas
    const jewelPool = ['jewel_of_blessing', 'jewel_of_soul', 'jewel_of_chaos', 'jewel_of_life'];
    if (tier >= 4) {
      jewelPool.push('jewel_of_harmony');
    }
    const jewelCount = Math.min(tier, 3);
    for (let j = 0; j < jewelCount; j++) {
      const jewelId = jewelPool[Math.floor(Math.random() * jewelPool.length)];
      const jewelItem = Item.create(jewelId);
      generatedItems.push(jewelItem);
    }

    // 3. Projeta como Ground Drops com Dispersão Circular e Radial
    let dropIdx = 0;
    // Drop do Zen
    groundDrops.push({
      dropId: `drop-box-zen-${now}-${dropIdx++}`,
      item: null,
      zen: Math.round(zen),
      x: playerX,
      y: playerY,
      createdAt: now,
      expiresAt,
      ownerSessionId,
      isJewel: false,
      isExcellent: false,
    });

    // Drops dos Itens
    for (let i = 0; i < generatedItems.length; i++) {
      const it = generatedItems[i];
      const angle = (i / generatedItems.length) * Math.PI * 2 + (Math.random() * 0.3 - 0.15);
      const dist = 25 + Math.random() * 35;
      const isJewel = Item.getDefinition(it).category === ItemCategory.JEWEL;
      const isExcellent = (it.excellentMask ?? 0) > 0;

      groundDrops.push({
        dropId: `drop-box-item-${now}-${dropIdx++}`,
        item: it,
        zen: 0,
        x: Math.round(playerX + Math.cos(angle) * dist),
        y: Math.round(playerY + Math.sin(angle) * dist),
        createdAt: now,
        expiresAt,
        ownerSessionId,
        isJewel,
        isExcellent,
      });
    }

    return {
      boxDefId: boxId,
      tier,
      items: generatedItems,
      zen,
      groundDrops,
    };
  }

  public static consumeFruit(fruitDefId: string, character: any) {
    return BoxOfKundunSystem.consumeFruit(fruitDefId, character);
  }
}
