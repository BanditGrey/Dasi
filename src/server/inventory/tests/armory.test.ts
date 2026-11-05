import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ITEM_DEFINITIONS } from '../definitions.ts';
import { ItemCategory, EquipmentSlot } from '../types.ts';
import { Item } from '../Item.ts';
import { GridInventory } from '../GridInventory.ts';

describe('🏛️ Catálogo Completo de Armaduras & Armas 3D (Armory Engine)', () => {
  it('Contém todos os conjuntos canônicos de armaduras para todas as classes', () => {
    const requiredSets = [
      // DK
      ['leather', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      ['scale', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      ['plate', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      ['dragon', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      ['dark_phoenix', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      // DW
      ['pad', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      ['bone', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      ['sphinx', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      ['legendary', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      ['grand_soul', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      // ELF
      ['vine', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      ['silk', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      ['wind', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      ['spirit', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      ['divine', 'helm', 'armor', 'pants', 'gloves', 'boots'],
      // MG (sem elmo)
      ['storm_crow', 'armor', 'pants', 'gloves', 'boots'],
      ['hurricane', 'armor', 'pants', 'gloves', 'boots'],
      // DL
      ['dark_master', 'mask', 'armor', 'pants', 'gloves', 'boots'],
    ];

    for (const [prefix, ...parts] of requiredSets) {
      for (const part of parts) {
        const itemId = `${prefix}_${part}`;
        const def = ITEM_DEFINITIONS[itemId];
        assert.ok(def, `Definição de item ausente: ${itemId}`);
        assert.ok(def.defense && def.defense > 0, `${itemId} deve possuir valor de defesa positivo`);
        assert.ok(def.baseDurability > 0, `${itemId} deve possuir durabilidade positiva`);
      }
    }
  });

  it('Contém todas as armas clássicas com atributos balanceados', () => {
    const weapons = [
      'dragon_blade', 'archangel_sword', 'chaos_dragon_axe', 'sword_of_destruction', 'bone_blade',
      'skull_staff', 'serpent_staff', 'chaos_lightning_staff', 'kundun_staff', 'archangel_staff', 'grand_viper_staff',
      'short_bow', 'elven_bow', 'chaos_nature_bow', 'celestial_bow', 'great_reign_crossbow', 'archangel_crossbow',
      'rune_blade', 'dark_reign_blade',
      'battle_scepter', 'lord_scepter', 'great_lord_scepter'
    ];

    for (const wId of weapons) {
      const def = ITEM_DEFINITIONS[wId];
      assert.ok(def, `Arma não encontrada: ${wId}`);
      assert.strictEqual(def.category, ItemCategory.WEAPON);
      assert.ok(def.minDamage && def.minDamage > 0);
      assert.ok(def.maxDamage && def.maxDamage >= def.minDamage);
      assert.ok(def.attackSpeed && def.attackSpeed > 0);
    }
  });

  it('Equipa set completo no GridInventory e calcula bônus defensivo composto', () => {
    const inv = new GridInventory({ cols: 8, rows: 8 });
    const dragonPieces = [
      'dragon_helm', 'dragon_armor', 'dragon_pants', 'dragon_gloves', 'dragon_boots'
    ];

    for (const pId of dragonPieces) {
      const item = Item.create(pId, { level: 9, luck: true });
      const placed = inv.addItem(item);
      assert.strictEqual(placed, true, `Falha ao adicionar ${pId} na bolsa`);
      const def = ITEM_DEFINITIONS[pId];
      const slot = def.validEquipSlots![0];
      const res = inv.equipItem(item.uuid, slot);
      assert.strictEqual(res.success, true, `Falha ao equipar ${pId} no slot ${slot}: ${res.error}`);
    }

    const equippedMap = inv.getAllEquipped();
    assert.strictEqual(equippedMap.size, 5);

    let totalDefense = 0;
    for (const [_, item] of equippedMap) {
      totalDefense += Item.calculateDefense(item);
    }
    assert.ok(totalDefense > 200, `Defesa do set Dragon +9 deve ultrapassar 200 (Atual: ${totalDefense})`);
  });

  it('Valida hierarquia das Asas (Tiers 1, 2 e 3)', () => {
    const wingsT1 = ['wings_of_fairy', 'wings_of_heaven', 'wings_of_satan'];
    const wingsT2 = ['wings_of_dragon', 'wings_of_soul', 'wings_of_elf', 'wings_of_darkness', 'cape_of_lord'];
    const wingsT3 = ['wings_of_storm', 'wings_of_space_time', 'wings_of_dimension'];

    for (const w of wingsT1) {
      const def = ITEM_DEFINITIONS[w];
      assert.ok(def, `Asa ${w} não encontrada`);
      assert.strictEqual(def.category, ItemCategory.WING);
      assert.strictEqual(def.requirements.level, 180, `Asa ${w} deveria ter nível 180 mas tem ${def.requirements.level}`);
    }

    for (const w of wingsT2) {
      const def = ITEM_DEFINITIONS[w];
      assert.ok(def);
      assert.ok(def.requirements.level && def.requirements.level === 215);
    }

    for (const w of wingsT3) {
      const def = ITEM_DEFINITIONS[w];
      assert.ok(def);
      assert.ok(def.requirements.level && def.requirements.level === 400);
      assert.ok(def.defense && def.defense >= 88);
    }
  });
});
