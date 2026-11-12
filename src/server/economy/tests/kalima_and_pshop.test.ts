import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { KalimaInstance } from '../../events/KalimaInstance.ts';
import { PersonalShopManager, MAX_ZEN_LIMIT } from '../PersonalShopManager.ts';

describe('KalimaInstance - Canonical Webzen Kalima 1..7 & Lord Kundun', () => {
  it('valida requisitos de nível de entrada regulares e especiais (MG, DL, RF)', () => {
    // Kalima 1 Normal: 40..130
    assert.equal(KalimaInstance.canEnterKalima(1, 39, false), false);
    assert.equal(KalimaInstance.canEnterKalima(1, 40, false), true);
    assert.equal(KalimaInstance.canEnterKalima(1, 130, false), true);
    assert.equal(KalimaInstance.canEnterKalima(1, 131, false), false);

    // Kalima 1 Especial (MG/DL): 20..110
    assert.equal(KalimaInstance.canEnterKalima(1, 20, true), true);
    assert.equal(KalimaInstance.canEnterKalima(1, 110, true), true);

    // Kalima 7 (Lord Kundun): Normal 350..400, Especial 250..400
    assert.equal(KalimaInstance.canEnterKalima(7, 349, false), false);
    assert.equal(KalimaInstance.canEnterKalima(7, 350, false), true);
    assert.equal(KalimaInstance.canEnterKalima(7, 250, true), true);
  });

  it('combina 5x Kundun Marks para criar 1 Lost Map', () => {
    const craft = KalimaInstance.craftLostMap(7, 7);
    assert.equal(craft.success, true);
    assert.equal(craft.lostMapLevel, 7);
    assert.equal(craft.remainingMarks, 2);

    const failCraft = KalimaInstance.craftLostMap(4, 7);
    assert.equal(failCraft.success, false);
    assert.equal(failCraft.remainingMarks, 4);
  });

  it('gera portal com duração de 180 segundos e drops garantidos de Ancient de Lord Kundun', () => {
    const portal = KalimaInstance.spawnKalimaPortal('player_1', null, 7, 125, 125);
    assert.equal(portal.durationSeconds, 180);
    assert.equal(portal.kalimaLevel, 7);

    const drops = KalimaInstance.generateLordKundunDrops();
    assert.equal(drops.ancientCount, 3);
  });
});

describe('PersonalShopManager - PShop Open, Purchase & Zen Cap Protection', () => {
  it('abre loja pessoal e processa compra com sucesso debitando comprador e creditando vendedor', () => {
    const pshop = new PersonalShopManager();
    const openResult = pshop.openShop('seller_1', 'DarkMerchant', 'Venda de Sets e Armas', [
      {
        slot: 0,
        itemId: 'dragon_helm_plus_9',
        itemName: 'Dragon Helm +9',
        priceZen: 5_000_000,
        priceBless: 2,
        priceSoul: 0,
        width: 2,
        height: 2,
      },
    ]);

    assert.equal(openResult.success, true);
    const shop = pshop.getShop('seller_1');
    assert.equal(shop?.isOpen, true);
    assert.equal(shop?.items.size, 1);

    // Compra
    const purchase = pshop.purchaseItem('buyer_1', 'seller_1', 0, 10_000_000, 1_000_000, 5, 0);
    assert.equal(purchase.success, true);
    assert.equal(purchase.newBuyerZen, 5_000_000);
    assert.equal(purchase.newSellerZen, 6_000_000);
    assert.equal(purchase.newBuyerBless, 3);
    assert.equal(purchase.newSellerBless, 2);

    // Loja esvaziou -> auto-fechou
    assert.equal(shop?.isOpen, false);
  });

  it('bloqueia compra se ultrapassar o limite canônico de 2 bilhões de Zen no vendedor', () => {
    const pshop = new PersonalShopManager();
    pshop.openShop('seller_1', 'DarkMerchant', 'Item Caro', [
      {
        slot: 0,
        itemId: 'chaos_dragon_axe',
        itemName: 'Chaos Dragon Axe',
        priceZen: 100_000_000,
        priceBless: 0,
        priceSoul: 0,
        width: 2,
        height: 3,
      },
    ]);

    // Vendedor já tem 1.950.000.000 Zen. + 100.000.000 passaria de 2 bilhões (overflow!)
    const purchase = pshop.purchaseItem('buyer_1', 'seller_1', 0, 500_000_000, 1_950_000_000, 0, 0);
    assert.equal(purchase.success, false);
    assert.match(purchase.error ?? '', /2 bilhões/);
  });
});
