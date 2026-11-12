/**
 * Dasi MMORPG - Testes do Sistema de Lojas de NPCs em Lorencia (Passo 8)
 * Compra de arcos, flechas, cajados, poções e venda de itens da bolsa por Zen.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NPCShopSystem } from '../NPCShop.ts';
import { GridInventory } from '../../inventory/GridInventory.ts';
import { Item } from '../../inventory/Item.ts';
import type { ClientSession } from '../../network/SessionManager.ts';

describe('Economia & Mercadores de Lorencia (Passo 8)', () => {
  function createTestSession(zen = 100000): ClientSession {
    const character = {
      id: 'char-eco-001',
      name: 'Vagabond',
      characterClass: 'DK',
      level: 50,
      strength: 100,
      agility: 80,
      vitality: 60,
      energy: 40,
      command: 0,
      zen,
      pkLevel: 3,
      statPoints: 0,
    };

    const inventory = new GridInventory({ cols: 8, rows: 8 });

    return {
      sessionId: 'sess-eco-001',
      character,
      inventory,
      currentHp: 600,
      maxHp: 600,
      currentMp: 200,
      maxMp: 200,
      currentSd: 300,
      maxSd: 300,
      activeBuffs: new Map(),
    } as unknown as ClientSession;
  }

  it('1. Compra arco, cajado e flechas em Han the Blacksmith deduzindo Zen e alocando na bolsa', () => {
    const session = createTestSession(50000);
    const startZen = session.character.zen!;

    // 1. Compra Short Bow (1.200 Zen)
    const buyBow = NPCShopSystem.processBuy(
      session,
      { npcId: 'han_blacksmith', itemDefId: 'short_bow' },
      () => ({ width: 8, height: 8, items: [], equipped: {} } as any)
    );

    assert.ok(buyBow.success, `Falha na compra do arco: ${buyBow.error}`);
    assert.strictEqual(session.character.zen, startZen - 1200);
    assert.strictEqual(buyBow.boughtItem?.defId, 'short_bow');

    // 2. Compra Skull Staff (4.000 Zen)
    const buyStaff = NPCShopSystem.processBuy(
      session,
      { npcId: 'han_blacksmith', itemDefId: 'skull_staff' },
      () => ({ width: 8, height: 8, items: [], equipped: {} } as any)
    );
    assert.ok(buyStaff.success);
    assert.strictEqual(session.character.zen, startZen - 1200 - 4000);
    assert.strictEqual(buyStaff.boughtItem?.defId, 'skull_staff');

    // 3. Compra Arrows (300 Zen)
    const buyArrows = NPCShopSystem.processBuy(
      session,
      { npcId: 'han_blacksmith', itemDefId: 'arrows' },
      () => ({ width: 8, height: 8, items: [], equipped: {} } as any)
    );
    assert.ok(buyArrows.success);
    assert.strictEqual(session.character.zen, startZen - 1200 - 4000 - 300);
    assert.strictEqual(buyArrows.boughtItem?.defId, 'arrows');
  });

  it('2. Compra poções de Vida e Mana em Pupa the Potion Girl / Lumen', () => {
    const session = createTestSession(10000);

    const buyHp = NPCShopSystem.processBuy(
      session,
      { npcId: 'pupa_potion_girl', itemDefId: 'potion_health_small' },
      () => ({} as any)
    );
    assert.ok(buyHp.success);
    assert.strictEqual(session.character.zen, 10000 - 80);

    const buyMp = NPCShopSystem.processBuy(
      session,
      { npcId: 'pupa_potion_girl', itemDefId: 'potion_mana_small' },
      () => ({} as any)
    );
    assert.ok(buyMp.success);
    assert.strictEqual(session.character.zen, 10000 - 80 - 100);
  });

  it('3. Venda autoritativa de item da bolsa concede Zen e remove o item do inventário', () => {
    const session = createTestSession(1000);
    const sword = Item.create('short_sword', { level: 3, skill: true });
    const placed = session.inventory.addItem(sword);
    assert.ok(placed, 'Item deve ser alocado no inventário');

    const expectedPrice = NPCShopSystem.getSellPrice(sword);
    assert.ok(expectedPrice > 0, 'Preço de venda deve ser maior que zero');

    const sellResult = NPCShopSystem.processSell(
      session,
      sword.uuid,
      () => ({} as any),
      undefined,
      'LORENCIA'
    );

    assert.ok(sellResult.success, `Falha na venda: ${sellResult.error}`);
    assert.strictEqual(session.character.zen, 1000 + expectedPrice);
    assert.strictEqual(session.inventory.getPlacedItem(sword.uuid), null, 'Item deve ter sido removido da bolsa');
  });

  it('4. Rejeita compra se o jogador não tiver Zen suficiente', () => {
    const session = createTestSession(500); // Tem apenas 500 Zen

    const buyGreatCrossbow = NPCShopSystem.processBuy(
      session,
      { npcId: 'han_blacksmith', itemDefId: 'great_reign_crossbow' }, // Custa 28.000 Zen
      () => ({} as any)
    );

    assert.strictEqual(buyGreatCrossbow.success, false);
    assert.ok(buyGreatCrossbow.error?.includes('Zen insuficiente'));
    assert.strictEqual(session.character.zen, 500, 'Zen não deve ser deduzido em transação falha');
  });

  it('5. Rejeita compra se a bolsa de 8x8 estiver completamente cheia', () => {
    const session = createTestSession(50000);
    // Enche toda a grade de 8x8 com adagas 1x1
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const dagger = Item.create('small_dagger');
        session.inventory.addItem(dagger, x, y);
      }
    }

    const buyResult = NPCShopSystem.processBuy(
      session,
      { npcId: 'han_blacksmith', itemDefId: 'short_bow' },
      () => ({} as any)
    );

    assert.strictEqual(buyResult.success, false);
    assert.ok(buyResult.error?.includes('Inventário cheio'));
  });
});
