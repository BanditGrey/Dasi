/**
 * Dasi MMORPG - Testes Automatizados da Máquina do Caos, Lojas de NPCs e Atributos
 * 
 * Cobertura de Testes:
 * 1. Forja de Armas do Caos (Chaos Dragon Axe, Chaos Nature Bow, Chaos Lightning Staff)
 * 2. Forja de Asas Tier 1 (Wings of Dragon, Wings of Soul, Wings of Elf)
 * 3. Refinamento de Itens +10 até +15 na Máquina do Caos (Sucesso, Regressão e Destruição)
 * 4. Sistema de Lojas de NPCs (Han the Blacksmith & Pupa the Potion Girl)
 * 5. Sistema de Level Up e Distribuição de Atributos (STR / AGI / VIT / ENE)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GridInventory } from '../GridInventory.ts';
import { Item } from '../Item.ts';
import { ChaosMachine } from '../ChaosMachine.ts';
import { NPCShopSystem } from '../../economy/NPCShop.ts';
import { SessionManager } from '../../network/SessionManager.ts';
import { ItemCategory, type ItemInstance } from '../types.ts';
import type { CharacterSummary } from '../../network/protocol.ts';

describe('1. Máquina do Caos (Chaos Machine Crafting autoritativo)', () => {
  function createTestCharacter(zen = 10000000): CharacterSummary {
    return {
      name: 'ChaosSmith',
      characterClass: 'DK',
      level: 250,
      strength: 300,
      agility: 100,
      vitality: 100,
      energy: 80,
      command: 0,
      zen,
      statPoints: 0,
    };
  }

  // ==========================================
  // RECEITA: ARMAS DO CAOS
  // ==========================================
  test('Forja de Armas do Caos: Rejeita ingredientes sem item +4+opt', () => {
    const inv = new GridInventory({ cols: 8, rows: 8 });
    const char = createTestCharacter();

    // Item de nível 2 e sem opção (inválido)
    const blade = Item.create('dragon_blade', { level: 2, optionLevel: 0 });
    const chaos = Item.create('jewel_of_chaos');
    inv.addItem(blade);
    inv.addItem(chaos);

    const res = ChaosMachine.executeMix(inv, char, {
      mixType: 'CHAOS_WEAPON',
      itemUuids: [blade.uuid, chaos.uuid],
      rngRoll: 0.1,
    });

    assert.equal(res.success, false);
    assert.ok(res.message.includes('nível +4 e Opção Adicional +4'));
    assert.equal(inv.getAllGridItems().length, 2, 'Itens não devem ser consumidos se a receita for inválida');
  });

  test('Forja de Armas do Caos: Sucesso gera arma do Caos e consome ingredientes', () => {
    const inv = new GridInventory({ cols: 8, rows: 8 });
    const char = createTestCharacter(500000);

    // Item válido: +4 com Option +4
    const blade = Item.create('dragon_blade', { level: 4, optionLevel: 4 });
    const chaos = Item.create('jewel_of_chaos');
    const bless = Item.create('jewel_of_blessing');
    const soul = Item.create('jewel_of_soul');

    inv.addItem(blade);
    inv.addItem(chaos);
    inv.addItem(bless);
    inv.addItem(soul);

    const initialZen = char.zen;

    const res = ChaosMachine.executeMix(inv, char, {
      mixType: 'CHAOS_WEAPON',
      itemUuids: [blade.uuid, chaos.uuid, bless.uuid, soul.uuid],
      rngRoll: 0.05, // Garante rolagem vencedora
    });

    assert.equal(res.success, true);
    assert.ok(res.rate >= 1 && res.rate <= 100);
    assert.equal(char.zen, initialZen - 20000, 'Dedução de 20.000 Zen da taxa de forja');
    assert.ok(res.createdItem);

    const createdDef = Item.getDefinition(res.createdItem);
    const validChaosWeapons = ['chaos_dragon_axe', 'chaos_nature_bow', 'chaos_lightning_staff'];
    assert.ok(validChaosWeapons.includes(createdDef.id), `Arma forjada deve ser do Caos: ${createdDef.id}`);

    // Ingredientes anteriores devem ter sido removidos do grid
    assert.equal(inv.getPlacedItem(blade.uuid), null);
    assert.equal(inv.getPlacedItem(chaos.uuid), null);
    assert.equal(inv.getPlacedItem(bless.uuid), null);
    assert.equal(inv.getPlacedItem(soul.uuid), null);

    // Apenas a nova arma forjada deve estar na bolsa
    const placed = inv.getAllGridItems();
    assert.equal(placed.length, 1);
    assert.equal(placed[0].item.uuid, res.createdItem.uuid);
  });

  test('Forja de Armas do Caos: Falha consome e destrói todos os materiais', () => {
    const inv = new GridInventory({ cols: 8, rows: 8 });
    const char = createTestCharacter(500000);

    const blade = Item.create('dragon_blade', { level: 4, optionLevel: 4 });
    const chaos = Item.create('jewel_of_chaos');
    inv.addItem(blade);
    inv.addItem(chaos);

    const res = ChaosMachine.executeMix(inv, char, {
      mixType: 'CHAOS_WEAPON',
      itemUuids: [blade.uuid, chaos.uuid],
      rngRoll: 0.99, // Força falha
    });

    assert.equal(res.success, false);
    assert.ok(res.message.includes('colapsou e todos os materiais foram destruídos'));
    assert.equal(inv.getAllGridItems().length, 0, 'Todos os materiais devem ser destruídos no grid');
  });

  // ==========================================
  // RECEITA: ASAS TIER 1
  // ==========================================
  test('Forja de Asas Tier 1: Requer Arma do Caos +4+opt e Jewel of Chaos', () => {
    const inv = new GridInventory({ cols: 8, rows: 8 });
    const char = createTestCharacter();

    // Arma normal não deve ser aceita
    const normalSword = Item.create('dragon_blade', { level: 7, optionLevel: 4 });
    const chaos = Item.create('jewel_of_chaos');
    inv.addItem(normalSword);
    inv.addItem(chaos);

    const res = ChaosMachine.executeMix(inv, char, {
      mixType: 'FIRST_WING',
      itemUuids: [normalSword.uuid, chaos.uuid],
    });

    assert.equal(res.success, false);
    assert.ok(res.message.includes('É necessária 1 Arma do Caos'));
  });

  test('Forja de Asas Tier 1: Sucesso gera Asas de Dragon, Soul ou Elf', () => {
    const inv = new GridInventory({ cols: 8, rows: 8 });
    const char = createTestCharacter();

    const chaosAxe = Item.create('chaos_dragon_axe', { level: 4, optionLevel: 4, luck: true });
    const chaosJewel = Item.create('jewel_of_chaos');
    inv.addItem(chaosAxe);
    inv.addItem(chaosJewel);

    const res = ChaosMachine.executeMix(inv, char, {
      mixType: 'FIRST_WING',
      itemUuids: [chaosAxe.uuid, chaosJewel.uuid],
      rngRoll: 0.1, // Sucesso
    });

    assert.equal(res.success, true);
    assert.ok(res.createdItem);
    const createdDef = Item.getDefinition(res.createdItem);
    assert.equal(createdDef.category, ItemCategory.WING);
    assert.ok(['wings_of_dragon', 'wings_of_soul', 'wings_of_elf'].includes(createdDef.id));

    // Materiais consumidos
    assert.equal(inv.getPlacedItem(chaosAxe.uuid), null);
    assert.equal(inv.getPlacedItem(chaosJewel.uuid), null);
    assert.equal(inv.getAllGridItems().length, 1);
  });

  // ==========================================
  // RECEITA: REFINAMENTO +10 ATÉ +15
  // ==========================================
  test('Refinamento +10 até +15: Sucesso aprimora item +9 para +10 com taxa de 50% a 70%', () => {
    const inv = new GridInventory({ cols: 8, rows: 8 });
    const char = createTestCharacter(5000000);

    const blade = Item.create('dragon_blade', { level: 9, luck: true });
    const chaos = Item.create('jewel_of_chaos');
    const bless = Item.create('jewel_of_blessing');
    const soul = Item.create('jewel_of_soul');

    inv.addItem(blade);
    inv.addItem(chaos);
    inv.addItem(bless);
    inv.addItem(soul);

    const res = ChaosMachine.executeMix(inv, char, {
      mixType: 'ITEM_UPGRADE',
      targetItemUuid: blade.uuid,
      itemUuids: [blade.uuid, chaos.uuid, bless.uuid, soul.uuid],
      rngRoll: 0.2, // Sucesso
    });

    assert.equal(res.success, true);
    assert.equal(res.rate, 75, 'Taxa com sorte deve atingir 75%');
    assert.ok(res.updatedItem);
    assert.equal(res.updatedItem.level, 10);

    // Joias consumidas, item preservado no inventário
    assert.equal(inv.getPlacedItem(chaos.uuid), null);
    assert.equal(inv.getPlacedItem(bless.uuid), null);
    assert.equal(inv.getPlacedItem(soul.uuid), null);
    assert.ok(inv.getPlacedItem(blade.uuid));
  });

  test('Refinamento +10 até +15: Falha em item +10 causa regressão de níveis', () => {
    const inv = new GridInventory({ cols: 8, rows: 8 });
    const char = createTestCharacter(5000000);

    const blade = Item.create('dragon_blade', { level: 10, luck: false });
    const chaos = Item.create('jewel_of_chaos');
    const bless1 = Item.create('jewel_of_blessing');
    const bless2 = Item.create('jewel_of_blessing');
    const soul1 = Item.create('jewel_of_soul');
    const soul2 = Item.create('jewel_of_soul');

    inv.addItem(blade);
    inv.addItem(chaos);
    inv.addItem(bless1);
    inv.addItem(bless2);
    inv.addItem(soul1);
    inv.addItem(soul2);

    const res = ChaosMachine.executeMix(inv, char, {
      mixType: 'ITEM_UPGRADE',
      targetItemUuid: blade.uuid,
      itemUuids: [blade.uuid, chaos.uuid, bless1.uuid, bless2.uuid, soul1.uuid, soul2.uuid],
      rngRoll: 0.99, // Falha
    });

    assert.equal(res.success, false);
    assert.ok(res.updatedItem);
    assert.equal(res.updatedItem.level, 8, 'Em falha até +12 regride 2 níveis (+10 -> +8)');
    assert.ok(inv.getPlacedItem(blade.uuid), 'Item não é destruído até +12');
  });

  test('Refinamento +10 até +15: Falha fatal em item +13 resulta em destruição total', () => {
    const inv = new GridInventory({ cols: 8, rows: 8 });
    const char = createTestCharacter(20000000);

    const blade = Item.create('dragon_blade', { level: 13, luck: true });
    const chaos = Item.create('jewel_of_chaos');
    // +14 exige 5 bless e 5 soul
    const blessList = Array.from({ length: 5 }, () => Item.create('jewel_of_blessing'));
    const soulList = Array.from({ length: 5 }, () => Item.create('jewel_of_soul'));

    inv.addItem(blade);
    inv.addItem(chaos);
    for (const b of blessList) inv.addItem(b);
    for (const s of soulList) inv.addItem(s);

    const res = ChaosMachine.executeMix(inv, char, {
      mixType: 'ITEM_UPGRADE',
      targetItemUuid: blade.uuid,
      itemUuids: [blade.uuid, chaos.uuid, ...blessList.map((b) => b.uuid), ...soulList.map((s) => s.uuid)],
      rngRoll: 0.99, // Falha
    });

    assert.equal(res.success, false);
    assert.equal(res.itemDestroyed, true);
    assert.ok(res.message.includes('CATÁSTROFE NO CAOS'));
    assert.equal(inv.getPlacedItem(blade.uuid), null, 'O item +13 deve ser totalmente destruído e removido do grid');
  });
});

describe('2. Lojas de NPCs (src/server/economy/NPCShop.ts)', () => {
  test('Catálogos de Han the Blacksmith e Pupa the Potion Girl estão configurados corretamente', () => {
    const han = NPCShopSystem.getShop('han_blacksmith');
    assert.ok(han);
    assert.equal(han.zone, 'Lorencia');
    assert.ok(han.catalog.some((i) => i.itemDefId === 'small_dagger' && i.priceZen === 500));
    assert.ok(han.catalog.some((i) => i.itemDefId === 'short_sword' && i.priceZen === 1500));
    assert.ok(han.catalog.some((i) => i.itemDefId === 'dragon_gloves' && i.priceZen === 20000));
    assert.ok(han.catalog.some((i) => i.itemDefId === 'dragon_boots' && i.priceZen === 25000));

    const pupa = NPCShopSystem.getShop('pupa_potion_girl');
    assert.ok(pupa);
    assert.equal(pupa.zone, 'Noria');
    assert.ok(pupa.catalog.some((i) => i.itemDefId === 'potion_health' && i.priceZen === 200));
    assert.ok(pupa.catalog.some((i) => i.itemDefId === 'potion_mana' && i.priceZen === 300));
  });

  test('Compra em NPC por Zen: Adiciona item à bolsa e debita saldo do jogador', () => {
    const sm = new SessionManager();
    const mockSocket = {};
    const session = sm.createSession(mockSocket);
    session.character.zen = 10000;

    const res = NPCShopSystem.processBuy(
      session,
      { npcId: 'han_blacksmith', itemDefId: 'short_sword' },
      (s) => sm.getSerializedInventoryState(s)
    );

    assert.equal(res.success, true);
    assert.equal(res.zenRemaining, 10000 - 1500);
    assert.equal(session.character.zen, 8500);
    assert.ok(res.boughtItem);
    assert.equal(res.boughtItem.defId, 'short_sword');
    assert.ok(session.inventory.getPlacedItem(res.boughtItem.uuid));
  });

  test('Compra em NPC: Rejeita compra se Zen for insuficiente', () => {
    const sm = new SessionManager();
    const session = sm.createSession({});
    session.character.zen = 100; // Menos que o preço de 500 Zen

    const res = NPCShopSystem.processBuy(
      session,
      { npcId: 'han_blacksmith', itemDefId: 'small_dagger' },
      (s) => sm.getSerializedInventoryState(s)
    );

    assert.equal(res.success, false);
    assert.ok(res.error?.includes('Zen insuficiente'));
    assert.equal(session.character.zen, 100, 'Zen não deve ser debitado');
  });

  test('Compra em NPC: Rejeita se inventário estiver completamente cheio', () => {
    const sm = new SessionManager();
    const session = sm.createSession({});
    session.character.zen = 500000;

    // Enche toda a grade 8x8 (64 células) com itens 1x1
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        session.inventory.addItem(Item.create('jewel_of_blessing'), x, y);
      }
    }

    const res = NPCShopSystem.processBuy(
      session,
      { npcId: 'pupa_potion_girl', itemDefId: 'potion_health' },
      (s) => sm.getSerializedInventoryState(s)
    );

    assert.equal(res.success, false);
    assert.ok(res.error?.includes('Inventário cheio'));
  });
});

describe('3. Level Up e Distribuição de Atributos (5 Pontos por Nível)', () => {
  test('Ganho de níveis concede exatamente 5 pontos de atributos por nível', () => {
    const sm = new SessionManager();
    const session = sm.createSession({});
    const initialLevel = session.character.level;
    const initialPoints = session.character.statPoints;

    sm.levelUp(session.sessionId, 3); // Ganha 3 níveis

    assert.equal(session.character.level, initialLevel + 3);
    assert.equal(session.character.statPoints, initialPoints + 15, 'Deve receber 3 * 5 = 15 pontos livres');
  });
});


test('Imposto de compra só é creditado após uma transação bem-sucedida', () => {
  const sm = new SessionManager();
  const session = sm.createSession({});
  let treasury = 0;
  const collector = (_biome: string, gross: number, commit = true) => {
    const tax = Math.floor(gross * 0.05);
    if (commit) treasury += tax;
    return { tax, netZen: gross - tax };
  };
  const buy = () => NPCShopSystem.processBuy(session,
    { npcId: 'han_blacksmith', itemDefId: 'small_dagger' },
    (s) => sm.getSerializedInventoryState(s), collector);
  session.character.zen = 0;
  assert.equal(buy().success, false);
  assert.equal(treasury, 0);
  session.character.zen = 10000;
  for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++)
    session.inventory.addItem(Item.create('jewel_of_blessing'), x, y);
  assert.equal(buy().success, false);
  assert.equal(treasury, 0);
  const placed = session.inventory.getAllGridItems()[0];
  session.inventory.removeItem(placed.item.uuid);
  assert.equal(buy().success, true);
  assert.equal(treasury, 25);
  assert.equal(session.character.zen, 9475);
});
