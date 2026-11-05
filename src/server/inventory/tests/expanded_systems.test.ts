/**
 * Dasi MMORPG - Testes Automatizados dos Sistemas Expandidos
 * 
 * Cobertura Completa:
 * 1. Forja de Asas Tier 2 (Loch's Feather + Chaos + Asas T1)
 * 2. Forja de Asas Tier 3 (Condor Feather + Condor Flame + Asas T2)
 * 3. Síntese de Frutas Alquímicas (Jewel of Creation + Chaos)
 * 4. Consumo de Frutas e Alocação Permanente de Atributos
 * 5. Abertura de Box of Kundun (+1 a +5) com Excelência Garantida
 * 6. Novas Lojas de NPCs (Lumen, Craftsman Eo, Alex) e Sistema de Venda (Sell Price)
 * 7. Bestiário de Chefes Mundiais (Ice Queen, Gorgon, Hydra, Balrog, Zaikan)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GridInventory } from '../GridInventory.ts';
import { Item } from '../Item.ts';
import { ChaosMachine } from '../ChaosMachine.ts';
import { NPCShopSystem } from '../../economy/NPCShop.ts';
import { BoxOfKundunSystem } from '../../economy/BoxOfKundun.ts';
import { MONSTER_DEFINITIONS } from '../../combat/Monster.ts';
import { ItemCategory } from '../types.ts';
import type { CharacterSummary } from '../../network/protocol.ts';

describe('⚡ Sistemas Expandidos & Economia Avançada de Dasi', () => {
  function createTestCharacter(zen = 10000000): CharacterSummary {
    return {
      name: 'ArchChaosMaster',
      characterClass: 'DK',
      level: 380,
      strength: 600,
      agility: 220,
      vitality: 200,
      energy: 150,
      command: 0,
      zen,
      statPoints: 0,
    };
  }

  // =========================================================================
  // 1. FORJA DE ASAS TIER 2 NA MÁQUINA DO CAOS
  // =========================================================================
  describe('1. Forja de Asas Tier 2 (Chaos Machine)', () => {
    it('Rejeita forja sem Loch\'s Feather ou sem Asas base', () => {
      const inv = new GridInventory({ cols: 8, rows: 8 });
      const char = createTestCharacter();
      const chaos = Item.create('jewel_of_chaos');
      inv.addItem(chaos);

      const res = ChaosMachine.executeMix(inv, char, {
        mixType: 'SECOND_WING',
        itemUuids: [chaos.uuid],
      });

      assert.equal(res.success, false);
      assert.ok(res.message.includes('Loch\'s Feather'));
    });

    it('Sucesso na síntese gera Asas Tier 2 canônicas (Dragon, Soul, Elf, Darkness ou Cape)', () => {
      const inv = new GridInventory({ cols: 8, rows: 8 });
      const char = createTestCharacter(500000);

      const baseWing = Item.create('wings_of_satan', { level: 9, optionLevel: 4, luck: true });
      const feather = Item.create('lochs_feather');
      const chaos = Item.create('jewel_of_chaos');
      const bless = Item.create('jewel_of_blessing');

      inv.addItem(baseWing);
      inv.addItem(feather);
      inv.addItem(chaos);
      inv.addItem(bless);

      const prevZen = char.zen;

      const res = ChaosMachine.executeMix(inv, char, {
        mixType: 'SECOND_WING',
        itemUuids: [baseWing.uuid, feather.uuid, chaos.uuid, bless.uuid],
        rngRoll: 0.1, // Sucesso forçado
      });

      assert.equal(res.success, true);
      assert.equal(char.zen, prevZen - 200000, 'Dedução de 200.000 Zen da taxa');
      assert.ok(res.createdItem);

      const createdDef = Item.getDefinition(res.createdItem);
      assert.equal(createdDef.category, ItemCategory.WING);
      const validT2 = ['wings_of_dragon', 'wings_of_soul', 'wings_of_elf', 'wings_of_darkness', 'cape_of_lord'];
      assert.ok(validT2.includes(createdDef.id), `Asa criada ${createdDef.id} deve ser Tier 2`);

      // Materiais devem ter sido consumidos
      assert.equal(inv.getPlacedItem(baseWing.uuid), null);
      assert.equal(inv.getPlacedItem(feather.uuid), null);
      assert.equal(inv.getPlacedItem(chaos.uuid), null);
      assert.equal(inv.getAllGridItems().length, 1);
    });
  });

  // =========================================================================
  // 2. FORJA DE ASAS TIER 3 NA MÁQUINA DO CAOS
  // =========================================================================
  describe('2. Forja de Asas Tier 3 (Chaos Machine)', () => {
    it('Rejeita forja se faltar Condor Feather ou Flame of Condor', () => {
      const inv = new GridInventory({ cols: 8, rows: 8 });
      const char = createTestCharacter();

      const t2Wing = Item.create('wings_of_dragon', { level: 9, optionLevel: 4 });
      const chaos = Item.create('jewel_of_chaos');
      inv.addItem(t2Wing);
      inv.addItem(chaos);

      const res = ChaosMachine.executeMix(inv, char, {
        mixType: 'THIRD_WING',
        itemUuids: [t2Wing.uuid, chaos.uuid],
      });

      assert.equal(res.success, false);
      assert.ok(res.message.includes('Condor Feather e 1 Flame of Condor'));
    });

    it('Sucesso forja Asas Celestiais Supremas Tier 3 (Storm, Space-Time, Dimension, Ruin, Emperor)', () => {
      const inv = new GridInventory({ cols: 8, rows: 8 });
      const char = createTestCharacter(5000000);

      const t2Wing = Item.create('wings_of_dragon', { level: 9, optionLevel: 4, luck: true });
      const condorFeather = Item.create('condor_feather');
      const condorFlame = Item.create('condor_flame');
      const chaos = Item.create('jewel_of_chaos');

      inv.addItem(t2Wing);
      inv.addItem(condorFeather);
      inv.addItem(condorFlame);
      inv.addItem(chaos);

      const res = ChaosMachine.executeMix(inv, char, {
        mixType: 'THIRD_WING',
        itemUuids: [t2Wing.uuid, condorFeather.uuid, condorFlame.uuid, chaos.uuid],
        rngRoll: 0.05, // Sucesso forçado
      });

      assert.equal(res.success, true);
      assert.ok(res.createdItem);
      const createdDef = Item.getDefinition(res.createdItem);
      assert.equal(createdDef.category, ItemCategory.WING);
      assert.equal(createdDef.requirements.level, 400, 'Asas Tier 3 requerem nível 400');
      assert.ok(createdDef.defense! >= 88);

      const validT3 = ['wings_of_storm', 'wings_of_space_time', 'wings_of_dimension', 'wings_of_ruin', 'cape_of_emperor'];
      assert.ok(validT3.includes(createdDef.id), `Asa criada ${createdDef.id} deve ser Tier 3`);
    });
  });

  // =========================================================================
  // 3. SÍNTESE E CONSUMO DE FRUTAS DE ATRIBUTOS
  // =========================================================================
  describe('3. Frutas de Atributos (Jewel of Creation + Chaos)', () => {
    it('Cria fruta alquímica com 90% de chance na Chaos Machine', () => {
      const inv = new GridInventory({ cols: 8, rows: 8 });
      const char = createTestCharacter(1000000);

      const creation = Item.create('jewel_of_creation');
      const chaos = Item.create('jewel_of_chaos');
      inv.addItem(creation);
      inv.addItem(chaos);

      const res = ChaosMachine.executeMix(inv, char, {
        mixType: 'FRUIT_CREATION',
        itemUuids: [creation.uuid, chaos.uuid],
        rngRoll: 0.1, // Sucesso
      });

      assert.equal(res.success, true);
      assert.ok(res.createdItem);
      assert.ok(res.createdItem.defId.startsWith('fruit_'));
      assert.equal(char.zen, 500000, 'Taxa de 500.000 Zen deduzida');
    });

    it('Consome fruta e concede bônus permanente de 1 a 3 pontos ao atributo correspondente', () => {
      const char = createTestCharacter();
      const initialStr = char.strength;

      const fruitRes = BoxOfKundunSystem.consumeFruit('fruit_strength', char);
      assert.equal(fruitRes.success, true);
      assert.equal(fruitRes.statGained, 'strength');
      assert.ok(fruitRes.pointsGained >= 1 && fruitRes.pointsGained <= 3);
      assert.equal(char.strength, initialStr + fruitRes.pointsGained);
    });
  });

  // =========================================================================
  // 4. SISTEMA DE CAIXAS DE KUNDUN (+1 A +5)
  // =========================================================================
  describe('4. Abertura de Box of Kundun (+1 a +5)', () => {
    it('Box of Kundun +1 gera item inicial com opção excelente', () => {
      const res = BoxOfKundunSystem.openBox('box_of_kundun_1');
      assert.equal(res.success, true);
      assert.ok(res.item);
      assert.ok(res.item.excellentMask > 0, 'Item de Box of Kundun deve possuir opção excelente');
      const def = Item.getDefinition(res.item);
      assert.ok(def.name);
    });

    it('Box of Kundun +5 gera item de patamar lendário e supremo', () => {
      const res = BoxOfKundunSystem.openBox('box_of_kundun_5');
      assert.equal(res.success, true);
      assert.ok(res.item);
      assert.ok(res.item.excellentMask > 0);
      const def = Item.getDefinition(res.item);
      assert.ok(def);
    });
  });

  // =========================================================================
  // 5. LOJAS DE NPCS EXPANDIDAS & SISTEMA DE VENDA
  // =========================================================================
  describe('5. Lojas de NPCs Expandidas & Sistema de Venda', () => {
    it('Registra todos os 5 comerciantes canônicos com títulos e localizações', () => {
      const shops = NPCShopSystem.getAllShops();
      assert.equal(shops.length, 5, 'Deve conter exatamente 5 lojas registradas');

      const ids = shops.map((s) => s.npcId);
      assert.ok(ids.includes('han_blacksmith'));
      assert.ok(ids.includes('pupa_potion_girl'));
      assert.ok(ids.includes('lumen_barmaid'));
      assert.ok(ids.includes('craftsman_eo'));
      assert.ok(ids.includes('alex_merchant'));
    });

    it('Calcula preço de venda proporcional à qualidade, nível e excelência', () => {
      const normalSword = Item.create('short_sword', { level: 0 });
      const priceNormal = NPCShopSystem.getSellPrice(normalSword);

      const upgradedSword = Item.create('short_sword', { level: 9, luck: true });
      const priceUpgraded = NPCShopSystem.getSellPrice(upgradedSword);

      assert.ok(priceUpgraded > priceNormal, 'Item refinado +9 deve valer mais que +0');

      const jewelBless = Item.create('jewel_of_blessing');
      const priceBless = NPCShopSystem.getSellPrice(jewelBless);
      assert.equal(priceBless, 6000000, 'Jewel of Blessing vale 6.000.000 Zen no NPC clássico');
    });

    it('Processa venda de item autoritativamente e credita Zen ao jogador', () => {
      const inv = new GridInventory({ cols: 8, rows: 8 });
      const char = createTestCharacter(1000);
      const itemToSell = Item.create('dragon_gloves', { level: 3 });
      inv.addItem(itemToSell);

      const fakeSession: any = {
        sessionId: 'test-session-sell',
        inventory: inv,
        character: char,
      };

      const initialZen = char.zen;
      const sellRes = NPCShopSystem.processSell(fakeSession, itemToSell.uuid, () => ({
        cols: 8,
        rows: 8,
        items: [],
        equipped: [],
      }));

      assert.equal(sellRes.success, true);
      assert.ok(sellRes.zenGained > 0);
      assert.equal(char.zen, initialZen + sellRes.zenGained);
      assert.equal(inv.getPlacedItem(itemToSell.uuid), null, 'Item vendido deve ser removido da bolsa');
    });
  });

  // =========================================================================
  // 6. CHEFES MUNDIAIS & INVASÕES LENDÁRIAS (BESTIÁRIO)
  // =========================================================================
  describe('6. Bestiário Completo de Chefes Mundiais (World Bosses)', () => {
    it('Contém todos os 5 Chefes Mundiais canônicos registrados com estatísticas de elite', () => {
      const bosses = ['ice_queen', 'gorgon', 'hydra', 'balrog', 'zaikan'];

      for (const bId of bosses) {
        const boss = MONSTER_DEFINITIONS[bId];
        assert.ok(boss, `Chefe mundial ${bId} ausente do bestiário`);
        assert.ok(boss.level >= 50, `Chefe ${bId} deve ser nível 50+ (Atual: ${boss.level})`);
        assert.ok(boss.maxHp >= 15000, `HP de ${bId} deve ser monumental (Atual: ${boss.maxHp})`);
        assert.ok(boss.maxPoise >= 200, `Poise de ${bId} deve resistir a staggers fáceis`);
        assert.ok(boss.dropTable.length >= 5, `Tabela de drops de ${bId} deve ser rica`);
      }
    });

    it('Valida que Balrog e Zaikan dropam insumos para Asas Tier 3 e Box of Kundun', () => {
      const balrog = MONSTER_DEFINITIONS['balrog'];
      const zaikan = MONSTER_DEFINITIONS['zaikan'];

      const balrogDrops = balrog.dropTable.map((d) => d.itemDefId);
      assert.ok(balrogDrops.includes('condor_feather'), 'Balrog deve dropar Condor Feather');
      assert.ok(balrogDrops.includes('box_of_kundun_4'), 'Balrog deve dropar Box of Kundun +4');

      const zaikanDrops = zaikan.dropTable.map((d) => d.itemDefId);
      assert.ok(zaikanDrops.includes('condor_flame'), 'Zaikan deve dropar Flame of Condor');
      assert.ok(zaikanDrops.includes('box_of_kundun_5'), 'Zaikan deve dropar Box of Kundun +5');
    });
  });
});
