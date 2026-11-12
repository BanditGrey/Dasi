/**
 * Dasi MMORPG - Gerenciador Canônico de Loja Pessoal (Personal Shop / PShop)
 * Engenharia reversa integral do GameServer Webzen MU Online Season 5.2
 * (PersonalShop.cpp, PersonalShop.h, Protocol.h).
 */

export const MAX_ZEN_LIMIT = 2_000_000_000; // 2 Bilhões de Zen (Limite Canônico)

export interface PShopItemEntry {
  slot: number;
  itemId: string;
  itemName: string;
  priceZen: number;
  priceBless: number;
  priceSoul: number;
  width: number;
  height: number;
}

export interface PersonalShopState {
  ownerPlayerId: string;
  ownerName: string;
  storeTitle: string;
  isOpen: boolean;
  items: Map<number, PShopItemEntry>; // slot -> item
}

export class PersonalShopManager {
  private shops: Map<string, PersonalShopState> = new Map();

  /**
   * Abre a loja pessoal do jogador com título customizado
   */
  public openShop(playerId: string, ownerName: string, title: string, items: PShopItemEntry[]): { success: boolean; error?: string } {
    if (!title || title.trim().length === 0) {
      return { success: false, error: 'Título da loja não pode ser vazio' };
    }
    if (items.length === 0) {
      return { success: false, error: 'A loja precisa conter ao menos um item' };
    }

    const itemMap = new Map<number, PShopItemEntry>();
    for (const item of items) {
      if (item.priceZen < 0 || item.priceBless < 0 || item.priceSoul < 0) {
        return { success: false, error: 'Preço inválido' };
      }
      itemMap.set(item.slot, item);
    }

    this.shops.set(playerId, {
      ownerPlayerId: playerId,
      ownerName,
      storeTitle: title.slice(0, 36),
      isOpen: true,
      items: itemMap,
    });

    return { success: true };
  }

  public closeShop(playerId: string): void {
    this.shops.delete(playerId);
  }

  public getShop(playerId: string): PersonalShopState | undefined {
    return this.shops.get(playerId);
  }

  /**
   * Transação atômica de compra de item na Loja Pessoal
   */
  public purchaseItem(
    buyerId: string,
    sellerId: string,
    slot: number,
    buyerZen: number,
    sellerZen: number,
    buyerBlessCount: number,
    buyerSoulCount: number,
    sellerBlessCount = 0,
    sellerSoulCount = 0
  ): {
    success: boolean;
    item?: PShopItemEntry;
    newBuyerZen: number;
    newSellerZen: number;
    newBuyerBless: number;
    newBuyerSoul: number;
    newSellerBless: number;
    newSellerSoul: number;
    error?: string;
  } {
    const shop = this.shops.get(sellerId);
    if (!shop || !shop.isOpen) {
      return {
        success: false,
        newBuyerZen: buyerZen,
        newSellerZen: sellerZen,
        newBuyerBless: buyerBlessCount,
        newBuyerSoul: buyerSoulCount,
        newSellerBless: sellerBlessCount,
        newSellerSoul: sellerSoulCount,
        error: 'A loja pessoal não está aberta',
      };
    }

    const item = shop.items.get(slot);
    if (!item) {
      return {
        success: false,
        newBuyerZen: buyerZen,
        newSellerZen: sellerZen,
        newBuyerBless: buyerBlessCount,
        newBuyerSoul: buyerSoulCount,
        newSellerBless: sellerBlessCount,
        newSellerSoul: sellerSoulCount,
        error: 'Item não encontrado na loja',
      };
    }

    // Validação de Zen
    if (buyerZen < item.priceZen) {
      return {
        success: false,
        newBuyerZen: buyerZen,
        newSellerZen: sellerZen,
        newBuyerBless: buyerBlessCount,
        newBuyerSoul: buyerSoulCount,
        newSellerBless: sellerBlessCount,
        newSellerSoul: sellerSoulCount,
        error: 'Zen insuficiente para compra',
      };
    }

    // Validação de Overflow de Zen no vendedor (Proteção 2 Bilhões de Zen)
    if (sellerZen + item.priceZen > MAX_ZEN_LIMIT) {
      return {
        success: false,
        newBuyerZen: buyerZen,
        newSellerZen: sellerZen,
        newBuyerBless: buyerBlessCount,
        newBuyerSoul: buyerSoulCount,
        newSellerBless: sellerBlessCount,
        newSellerSoul: sellerSoulCount,
        error: 'O vendedor não pode receber mais Zen (limite de 2 bilhões atingido)',
      };
    }

    // Validação de Joias (Bless / Soul)
    if (buyerBlessCount < item.priceBless || buyerSoulCount < item.priceSoul) {
      return {
        success: false,
        newBuyerZen: buyerZen,
        newSellerZen: sellerZen,
        newBuyerBless: buyerBlessCount,
        newBuyerSoul: buyerSoulCount,
        newSellerBless: sellerBlessCount,
        newSellerSoul: sellerSoulCount,
        error: 'Joias insuficientes para compra',
      };
    }

    // Executa a transferência atômica
    const newBuyerZen = buyerZen - item.priceZen;
    const newSellerZen = sellerZen + item.priceZen;
    const newBuyerBless = buyerBlessCount - item.priceBless;
    const newBuyerSoul = buyerSoulCount - item.priceSoul;
    const newSellerBless = sellerBlessCount + item.priceBless;
    const newSellerSoul = sellerSoulCount + item.priceSoul;

    shop.items.delete(slot);

    // Se a loja esvaziou, fecha automaticamente
    if (shop.items.size === 0) {
      shop.isOpen = false;
    }

    return {
      success: true,
      item,
      newBuyerZen,
      newSellerZen,
      newBuyerBless,
      newBuyerSoul,
      newSellerBless,
      newSellerSoul,
    };
  }
}
