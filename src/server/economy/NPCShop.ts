/**
 * Dasi MMORPG - Sistema de Lojas de NPCs (NPC Economy & Merchants)
 * Gerencia catálogos de comerciantes, compra de itens por Zen e validação autoritativa.
 * 
 * Lojas clássicas:
 * 1. Han the Blacksmith (Ferreiro de Lorencia):
 *    - Small Dagger, Short Sword, Dragon Gloves, Dragon Boots
 * 2. Pupa the Potion Girl (Alquimista de Noria / Feywood):
 *    - Health Potion, Mana Potion
 */

import { Item } from '../inventory/Item.ts';
import type { ItemInstance } from '../inventory/types.ts';
import type { ClientSession } from '../network/SessionManager.ts';
import type { NpcShopBuyReqPayload, NpcShopBuyResPayload, SerializedInventoryState } from '../network/protocol.ts';

export interface ShopItemListing {
  itemDefId: string;
  priceZen: number;
  level?: number;
  luck?: boolean;
  skill?: boolean;
}

export interface NPCShopDefinition {
  npcId: string;
  npcName: string;
  zone: string;
  title: string;
  catalog: ShopItemListing[];
}

export const NPC_SHOPS: Record<string, NPCShopDefinition> = {
  han_blacksmith: {
    npcId: 'han_blacksmith',
    npcName: 'Han the Blacksmith',
    zone: 'Lorencia',
    title: 'Ferreiro Imperial de Lorencia',
    catalog: [
      { itemDefId: 'small_dagger', priceZen: 500, level: 0 },
      { itemDefId: 'short_sword', priceZen: 1500, level: 0, skill: true },
      { itemDefId: 'dragon_gloves', priceZen: 20000, level: 0 },
      { itemDefId: 'dragon_boots', priceZen: 25000, level: 0 },
    ],
  },
  pupa_potion_girl: {
    npcId: 'pupa_potion_girl',
    npcName: 'Pupa the Potion Girl',
    zone: 'Noria',
    title: 'Comerciante de Elixires Élficos',
    catalog: [
      { itemDefId: 'potion_health', priceZen: 200, level: 0 },
      { itemDefId: 'potion_mana', priceZen: 300, level: 0 },
    ],
  },
  lumen_barmaid: {
    npcId: 'lumen_barmaid',
    npcName: 'Lumen the Barmaid',
    zone: 'Lorencia',
    title: 'Estalajadeira da Taberna de Lorencia',
    catalog: [
      { itemDefId: 'potion_health_small', priceZen: 80, level: 0 },
      { itemDefId: 'potion_health_medium', priceZen: 150, level: 0 },
      { itemDefId: 'potion_health', priceZen: 250, level: 0 },
      { itemDefId: 'potion_mana_small', priceZen: 100, level: 0 },
      { itemDefId: 'potion_mana_medium', priceZen: 200, level: 0 },
      { itemDefId: 'potion_mana', priceZen: 350, level: 0 },
      { itemDefId: 'potion_antidote', priceZen: 500, level: 0 },
      { itemDefId: 'town_portal_scroll', priceZen: 1200, level: 0 },
      { itemDefId: 'ale_beer', priceZen: 800, level: 0 },
    ],
  },
  craftsman_eo: {
    npcId: 'craftsman_eo',
    npcName: 'Craftsman Eo',
    zone: 'Noria',
    title: 'Mestre Armeiro de Feywood',
    catalog: [
      { itemDefId: 'short_bow', priceZen: 1200, level: 0, skill: true },
      { itemDefId: 'elven_bow', priceZen: 3500, level: 0, skill: true },
      { itemDefId: 'battle_bow', priceZen: 8500, level: 0, skill: true },
      { itemDefId: 'vine_helm', priceZen: 900, level: 0 },
      { itemDefId: 'vine_armor', priceZen: 1800, level: 0 },
      { itemDefId: 'vine_pants', priceZen: 1400, level: 0 },
      { itemDefId: 'vine_gloves', priceZen: 800, level: 0 },
      { itemDefId: 'vine_boots', priceZen: 850, level: 0 },
      { itemDefId: 'silk_armor', priceZen: 4500, level: 0 },
    ],
  },
  alex_merchant: {
    npcId: 'alex_merchant',
    npcName: 'Wandering Merchant Alex',
    zone: 'Devias',
    title: 'Mercador Viajante de Boreal',
    catalog: [
      { itemDefId: 'plate_helm', priceZen: 15000, level: 0 },
      { itemDefId: 'plate_armor', priceZen: 25000, level: 0 },
      { itemDefId: 'plate_pants', priceZen: 20000, level: 0 },
      { itemDefId: 'plate_gloves', priceZen: 12000, level: 0 },
      { itemDefId: 'plate_boots', priceZen: 14000, level: 0 },
      { itemDefId: 'plate_shield', priceZen: 18000, level: 0 },
      { itemDefId: 'skull_shield', priceZen: 12000, level: 0 },
      { itemDefId: 'broad_sword', priceZen: 12000, level: 0, skill: true },
      { itemDefId: 'crystal_sword', priceZen: 45000, level: 0, skill: true },
    ],
  },
};

export class NPCShopSystem {
  public static getShop(npcId: string): NPCShopDefinition | undefined {
    return NPC_SHOPS[npcId];
  }

  public static getAllShops(): NPCShopDefinition[] {
    return Object.values(NPC_SHOPS);
  }

  /**
   * Processa compra autoritativa de item de loja de NPC.
   */
  public static processBuy(
    session: ClientSession,
    req: NpcShopBuyReqPayload,
    getInventoryState: (session: ClientSession) => SerializedInventoryState
  ): NpcShopBuyResPayload {
    const { npcId, itemDefId, targetX, targetY } = req;
    const shop = this.getShop(npcId);

    if (!shop) {
      return {
        success: false,
        npcId,
        itemDefId,
        zenRemaining: session.character.zen ?? 0,
        error: `Comerciante '${npcId}' não encontrado no mundo.`,
      };
    }

    const listing = shop.catalog.find((entry) => entry.itemDefId === itemDefId);
    if (!listing) {
      return {
        success: false,
        npcId,
        itemDefId,
        zenRemaining: session.character.zen ?? 0,
        error: `O comerciante ${shop.npcName} não possui este item à venda.`,
      };
    }

    const currentZen = session.character.zen ?? 0;
    if (currentZen < listing.priceZen) {
      return {
        success: false,
        npcId,
        itemDefId,
        zenRemaining: currentZen,
        error: `Zen insuficiente! Você precisa de ${listing.priceZen.toLocaleString()} Zen (Possui: ${currentZen.toLocaleString()}).`,
      };
    }

    // Cria instância do item
    const newItem = Item.create(itemDefId, {
      level: listing.level ?? 0,
      luck: listing.luck ?? false,
      skill: listing.skill ?? false,
    });

    // Tenta alocar no inventário da sessão
    let placed;
    if (targetX !== undefined && targetY !== undefined) {
      placed = session.inventory.addItem(newItem, targetX, targetY);
    } else {
      placed = session.inventory.addItem(newItem);
    }

    if (!placed) {
      return {
        success: false,
        npcId,
        itemDefId,
        zenRemaining: currentZen,
        error: 'Inventário cheio! Não há espaço para acomodar este item na grade.',
      };
    }

    // Debita o Zen
    session.character.zen = currentZen - listing.priceZen;

    const inventoryState = getInventoryState(session);

    return {
      success: true,
      npcId,
      itemDefId,
      boughtItem: newItem,
      zenRemaining: session.character.zen,
      message: `${Item.getDefinition(newItem).name} comprado com sucesso por ${listing.priceZen.toLocaleString()} Zen de ${shop.npcName}!`,
      inventoryState,
      character: session.character,
    };
  }

  /**
   * Avalia o preço de venda de um item baseado em sua raridade, nível, sorte e excelência.
   */
  public static getSellPrice(item: ItemInstance): number {
    const def = Item.getDefinition(item);
    let basePrice = 200;

    if (def.category === 'WEAPON') basePrice = 1000 + (def.minDamage ?? 10) * 40;
    else if (def.category === 'ARMOR' || def.category === 'HELM' || def.category === 'PANTS') basePrice = 800 + (def.defense ?? 5) * 35;
    else if (def.category === 'GLOVES' || def.category === 'BOOTS' || def.category === 'SHIELD') basePrice = 500 + (def.defense ?? 5) * 30;
    else if (def.category === 'WING') basePrice = 50000;
    else if (def.category === 'JEWEL') {
      if (item.defId === 'jewel_of_blessing') return 6000000;
      if (item.defId === 'jewel_of_soul') return 4500000;
      if (item.defId === 'jewel_of_chaos') return 810000;
      if (item.defId === 'jewel_of_life') return 15000000;
      if (item.defId === 'jewel_of_creation') return 12000000;
      return 1000000;
    }

    let multiplier = 1 + item.level * 0.4;
    if (item.luck) multiplier += 0.25;
    if (item.skill) multiplier += 0.2;
    if (item.excellentMask > 0) multiplier *= 3.5;

    return Math.floor(basePrice * multiplier);
  }

  /**
   * Processa a venda de um item do inventário do jogador para o NPC, concedendo Zen.
   */
  public static processSell(
    session: ClientSession,
    itemUuid: string,
    getInventoryState: (session: ClientSession) => SerializedInventoryState
  ): { success: boolean; zenGained: number; zenRemaining: number; message: string; inventoryState?: SerializedInventoryState; error?: string } {
    const placed = session.inventory.getPlacedItem(itemUuid);
    if (!placed) {
      return {
        success: false,
        zenGained: 0,
        zenRemaining: session.character.zen ?? 0,
        message: 'Item não encontrado no inventário.',
        error: 'Item não encontrado no inventário.',
      };
    }

    const price = this.getSellPrice(placed.item);
    const itemName = Item.getDefinition(placed.item).name;

    session.inventory.removeItem(itemUuid);
    session.character.zen = (session.character.zen ?? 0) + price;

    const inventoryState = getInventoryState(session);

    return {
      success: true,
      zenGained: price,
      zenRemaining: session.character.zen,
      message: `${itemName} vendido com sucesso por ${price.toLocaleString()} Zen!`,
      inventoryState,
    };
  }
}
