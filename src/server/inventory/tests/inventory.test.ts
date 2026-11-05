import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  GridInventory,
  Item,
  JewelSystem,
  EquipmentSlot,
  WeaponExcellentOption,
  ArmorExcellentOption,
  UpgradeOutcome,
} from '../index.ts';

describe('Sistema de Inventário em Grade 8x8 (Estilo Continent of Legend)', () => {
  test('Inicialização e dimensões padrão da grade 8x8', () => {
    const inv = new GridInventory();
    assert.equal(inv.cols, 8);
    assert.equal(inv.rows, 8);
    assert.equal(inv.getAllGridItems().length, 0);

    // Células devem estar todas livres
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        assert.equal(inv.getItemAt(c, r), null);
      }
    }
  });

  test('Posicionamento e validação de limites (Bounds Check)', () => {
    const inv = new GridInventory();
    // Dragon Blade é 2x4 (largura 2, altura 4)
    const sword = Item.create('dragon_blade');

    // Cabe perfeitamente na posição (0, 0)
    assert.equal(inv.canPlaceItem(sword, 0, 0), true);

    // Cabe na posição limite inferior direito (6, 4) -> ocupa x: 6..7, y: 4..7
    assert.equal(inv.canPlaceItem(sword, 6, 4), true);

    // Fora dos limites na horizontal: x=7 com largura 2 ultrapassa (7 + 2 = 9 > 8)
    assert.equal(inv.canPlaceItem(sword, 7, 0), false);

    // Fora dos limites na vertical: y=5 com altura 4 ultrapassa (5 + 4 = 9 > 8)
    assert.equal(inv.canPlaceItem(sword, 0, 5), false);

    // Coordenadas negativas
    assert.equal(inv.canPlaceItem(sword, -1, 0), false);
    assert.equal(inv.canPlaceItem(sword, 0, -1), false);
  });

  test('Rotação de itens (Item Rotation)', () => {
    const inv = new GridInventory();
    // Archangel Sword é 1x4 (largura 1, altura 4)
    const sword = Item.create('archangel_sword');

    // Em pé: não cabe em y=6 (6 + 4 = 10 > 8)
    assert.equal(inv.canPlaceItem(sword, 0, 6, false), false);

    // Rotacionado: vira 4x1 (largura 4, altura 1), cabe perfeitamente em (0, 6)
    assert.equal(inv.canPlaceItem(sword, 0, 6, true), true);

    // Adiciona rotacionado e verifica ocupação horizontal
    const placed = inv.addItem(sword, 2, 7, true);
    assert.equal(placed, true);
    assert.equal(inv.getItemAt(2, 7)?.uuid, sword.uuid);
    assert.equal(inv.getItemAt(3, 7)?.uuid, sword.uuid);
    assert.equal(inv.getItemAt(4, 7)?.uuid, sword.uuid);
    assert.equal(inv.getItemAt(5, 7)?.uuid, sword.uuid);
    // Célula acima (2, 6) deve estar livre
    assert.equal(inv.getItemAt(2, 6), null);
  });

  test('Detecção de sobreposição e colisão de células (Overlap Check)', () => {
    const inv = new GridInventory();
    // Dragon Armor é 2x2
    const armor = Item.create('dragon_armor');
    // Dragon Helm é 2x2
    const helm = Item.create('dragon_helm');

    // Posiciona armadura em (2, 2) -> ocupa (2,2), (3,2), (2,3), (3,3)
    const res1 = inv.addItem(armor, 2, 2);
    assert.equal(res1, true);

    // Tentar posicionar elmo em (3, 3) deve falhar (colisão no pixel 3,3)
    assert.equal(inv.canPlaceItem(helm, 3, 3), false);
    assert.equal(inv.addItem(helm, 3, 3), false);

    // Tentar posicionar elmo em (1, 2) deve falhar (colisão na coluna 2)
    assert.equal(inv.canPlaceItem(helm, 1, 2), false);

    // Posicionar elmo em (4, 2) deve ter sucesso (adjacente, sem colisão)
    assert.equal(inv.canPlaceItem(helm, 4, 2), true);
    assert.equal(inv.addItem(helm, 4, 2), true);
  });

  test('Movimentação interna e remoção de itens', () => {
    const inv = new GridInventory();
    const dagger = Item.create('small_dagger'); // 1x2

    inv.addItem(dagger, 0, 0);
    assert.equal(inv.getItemAt(0, 0)?.uuid, dagger.uuid);
    assert.equal(inv.getItemAt(0, 1)?.uuid, dagger.uuid);

    // Move para (4, 4)
    const moveRes = inv.moveItem(dagger.uuid, 4, 4);
    assert.equal(moveRes, true);

    // Células antigas devem estar livres
    assert.equal(inv.getItemAt(0, 0), null);
    assert.equal(inv.getItemAt(0, 1), null);

    // Novas células ocupadas
    assert.equal(inv.getItemAt(4, 4)?.uuid, dagger.uuid);
    assert.equal(inv.getItemAt(4, 5)?.uuid, dagger.uuid);

    // Remove do inventário
    const removed = inv.removeItem(dagger.uuid);
    assert.equal(removed?.uuid, dagger.uuid);
    assert.equal(inv.getItemAt(4, 4), null);
    assert.equal(inv.getItemAt(4, 5), null);
    assert.equal(inv.getAllGridItems().length, 0);
  });

  test('Auto-alocação (First-fit algorithm) e grade cheia', () => {
    const inv = new GridInventory();

    // Adiciona 16 itens de armadura 2x2: cobrem perfeitamente os 64 slots (16 * 4 = 64)
    for (let i = 0; i < 16; i++) {
      const helm = Item.create('dragon_helm');
      const added = inv.addItem(helm);
      assert.equal(added, true, `Item ${i} deveria caber`);
    }

    assert.equal(inv.getAllGridItems().length, 16);

    // Grade totalmente cheia: mesmo uma joia 1x1 não deve caber
    const jewel = Item.create('jewel_of_blessing');
    assert.equal(inv.addItem(jewel), false);
  });
});

describe('Slots de Equipamento & Regras de Combate', () => {
  test('Equipamento em slot válido e compatibilidade de categoria', () => {
    const inv = new GridInventory();
    const helm = Item.create('dragon_helm');
    inv.addItem(helm);

    // Tentar equipar Elmo no slot de BOTAS deve falhar
    const failEquip = inv.equipItem(helm.uuid, EquipmentSlot.BOOTS);
    assert.equal(failEquip.success, false);

    // Equipar Elmo no slot de HELM tem sucesso
    const successEquip = inv.equipItem(helm.uuid, EquipmentSlot.HELM);
    assert.equal(successEquip.success, true);
    assert.equal(inv.getEquippedItem(EquipmentSlot.HELM)?.uuid, helm.uuid);
    // Deve ter saído da grade
    assert.equal(inv.getAllGridItems().length, 0);
  });

  test('Validação de Requisitos de Atributos (STR / AGI / Level)', () => {
    const inv = new GridInventory();
    const sword = Item.create('dragon_blade'); // Requer STR: 160, AGI: 50
    inv.addItem(sword);

    // Jogador com Força insuficiente (100 < 160)
    const weakPlayer = { strength: 100, agility: 60, level: 100, playerClass: 'DK' };
    const res1 = inv.equipItem(sword.uuid, EquipmentSlot.WEAPON_RIGHT, weakPlayer);
    assert.equal(res1.success, false);
    assert.match(res1.error || '', /Força insuficiente/);

    // Jogador forte o bastante
    const strongPlayer = { strength: 200, agility: 70, level: 150, playerClass: 'DK' };
    const res2 = inv.equipItem(sword.uuid, EquipmentSlot.WEAPON_RIGHT, strongPlayer);
    assert.equal(res2.success, true);
  });

  test('Restrição de Classe (DK, DW, ELF)', () => {
    const inv = new GridInventory();
    const staff = Item.create('kundun_staff'); // Apenas DW
    inv.addItem(staff);

    const darkKnight = { strength: 200, agility: 100, energy: 400, level: 200, playerClass: 'DK' };
    const res = inv.equipItem(staff.uuid, EquipmentSlot.WEAPON_RIGHT, darkKnight);
    assert.equal(res.success, false);
    assert.match(res.error || '', /Classe DK não pode equipar/);
  });

  test('Regra de Arma de Duas Mãos (Two-Handed Weapon)', () => {
    const inv = new GridInventory();
    const twoHandAxe = Item.create('chaos_dragon_axe'); // TwoHanded
    const shield = Item.create('dragon_shield');

    inv.addItem(twoHandAxe);
    inv.addItem(shield);

    // Equipa escudo na mão esquerda
    const eqShield = inv.equipItem(shield.uuid, EquipmentSlot.WEAPON_LEFT);
    assert.equal(eqShield.success, true);

    // Tentar equipar Machado de 2 Mãos com a mão esquerda ocupada deve falhar
    const eqAxeFail = inv.equipItem(twoHandAxe.uuid, EquipmentSlot.WEAPON_RIGHT);
    assert.equal(eqAxeFail.success, false);
    assert.match(eqAxeFail.error || '', /Mão secundária deve estar vazia/);

    // Desequipa escudo
    inv.unequipItem(EquipmentSlot.WEAPON_LEFT);

    // Agora equipar machado de 2 mãos tem sucesso
    const eqAxeSuccess = inv.equipItem(twoHandAxe.uuid, EquipmentSlot.WEAPON_RIGHT);
    assert.equal(eqAxeSuccess.success, true);

    // Tentar equipar escudo enquanto segura machado de 2 mãos deve falhar
    const eqShieldAgain = inv.equipItem(shield.uuid, EquipmentSlot.WEAPON_LEFT);
    assert.equal(eqShieldAgain.success, false);
    assert.match(eqShieldAgain.error || '', /Não é possível equipar escudo/);
  });

  test('Troca (Swap) de itens equipados com retorno ao inventário', () => {
    const inv = new GridInventory();
    const armor1 = Item.create('dragon_armor');
    const armor2 = Item.create('dragon_armor');

    inv.addItem(armor1);
    inv.addItem(armor2);

    // Equipa armor1
    inv.equipItem(armor1.uuid, EquipmentSlot.ARMOR);
    assert.equal(inv.getEquippedItem(EquipmentSlot.ARMOR)?.uuid, armor1.uuid);

    // Equipa armor2 no mesmo slot -> armor1 deve retornar ao grid
    const swapRes = inv.equipItem(armor2.uuid, EquipmentSlot.ARMOR);
    assert.equal(swapRes.success, true);
    assert.equal(swapRes.unequippedItem?.uuid, armor1.uuid);
    assert.equal(inv.getEquippedItem(EquipmentSlot.ARMOR)?.uuid, armor2.uuid);
    assert.equal(inv.getAllGridItems().length, 1);
    assert.equal(inv.getAllGridItems()[0].item.uuid, armor1.uuid);
  });
});

describe('Estrutura de Itens, Opções Excelentes e Harmonia', () => {
  test('Cálculo de dano com bônus de nível, Life e Opção Excelente (+2%)', () => {
    // Archangel Sword: Min 120, Max 170
    const sword = Item.create('archangel_sword', {
      level: 9, // +3 * 9 = +27 de dano
      optionLevel: 16, // +16 de dano da Life
    });

    const dmg1 = Item.calculateDamage(sword);
    // Min = 120 + 27 + 16 = 163
    // Max = 170 + 27 + 16 = 213
    assert.equal(dmg1.min, 163);
    assert.equal(dmg1.max, 213);

    // Adiciona opção excelente: +2% de dano
    Item.addExcellentOption(sword, WeaponExcellentOption.INCREASE_DMG_2_PERCENT);
    const dmg2 = Item.calculateDamage(sword);
    assert.equal(dmg2.min, Math.floor(163 * 1.02)); // 166
    assert.equal(dmg2.max, Math.floor(213 * 1.02)); // 217
  });

  test('Operações com Bitmask de Opções Excelentes', () => {
    const armor = Item.create('dragon_armor');
    assert.equal(Item.countExcellentOptions(armor), 0);

    // Concede Damage Decrease -4% e Reflect Damage +5%
    Item.addExcellentOption(armor, ArmorExcellentOption.DAMAGE_DECREASE_4_PCT);
    Item.addExcellentOption(armor, ArmorExcellentOption.REFLECT_DAMAGE_5_PCT);

    assert.equal(Item.countExcellentOptions(armor), 2);
    assert.equal(Item.hasExcellentOption(armor, ArmorExcellentOption.DAMAGE_DECREASE_4_PCT), true);
    assert.equal(Item.hasExcellentOption(armor, ArmorExcellentOption.REFLECT_DAMAGE_5_PCT), true);
    assert.equal(Item.hasExcellentOption(armor, ArmorExcellentOption.INCREASE_HP_4_PCT), false);
  });

  test('Cálculo de Defesa com Opção da Vida e Harmonia', () => {
    const armor = Item.create('dragon_armor', {
      level: 11, // Nível 11: 9*3 + 2*4 = 27 + 8 = 35 bônus de nível
      optionLevel: 28, // +28 defesa da Life
      harmonyOption: { type: 'DEFENSE_POWER', level: 1, value: 20 },
    });

    // Base defense: 68
    // Total = 68 + 35 + 28 + 20 = 151
    const def = Item.calculateDefense(armor);
    assert.equal(def, 151);
  });
});

describe('Lógica das Joias Sagradas (Bless, Soul, Life, Chaos, Harmony)', () => {
  test('Jewel of Blessing: 100% de sucesso de +0 a +5, rejeita em +6', () => {
    const blade = Item.create('dragon_blade', { level: 0 });

    // Evolui sucessivamente até +6
    for (let targetLevel = 1; targetLevel <= 6; targetLevel++) {
      const res = JewelSystem.applyJewelOfBlessing(blade);
      assert.equal(res.outcome, UpgradeOutcome.SUCCESS);
      assert.equal(blade.level, targetLevel);
    }

    assert.equal(blade.level, 6);

    // Tentar usar Bless no +6 deve ser categoricamente rejeitado
    const rejected = JewelSystem.applyJewelOfBlessing(blade);
    assert.equal(rejected.outcome, UpgradeOutcome.INVALID_TARGET);
    assert.equal(blade.level, 6);
  });

  test('Jewel of Soul: Sucesso com roll e influência da Sorte (Luck)', () => {
    const swordNoLuck = Item.create('dragon_blade', { level: 6, luck: false });
    const swordWithLuck = Item.create('dragon_blade', { level: 6, luck: true });

    // Com roll 0.60:
    // Sem luck (taxa 50%): 0.60 > 0.50 -> FALHA!
    const failRes = JewelSystem.applyJewelOfSoul(swordNoLuck, 0.60);
    assert.equal(failRes.outcome, UpgradeOutcome.LEVEL_DOWN);
    assert.equal(swordNoLuck.level, 5); // +6 cai para +5

    // Com luck (taxa 75%): 0.60 <= 0.75 -> SUCESSO!
    const successRes = JewelSystem.applyJewelOfSoul(swordWithLuck, 0.60);
    assert.equal(successRes.outcome, UpgradeOutcome.SUCCESS);
    assert.equal(swordWithLuck.level, 7); // +6 sobe para +7
  });

  test('Jewel of Soul: Penalidade fatal no +7 e +8 (queda direta para +0)', () => {
    const sword7 = Item.create('dragon_blade', { level: 7, luck: false });

    // Força falha com roll 0.90
    const fail7 = JewelSystem.applyJewelOfSoul(sword7, 0.90);
    assert.equal(fail7.outcome, UpgradeOutcome.LEVEL_DOWN);
    assert.equal(sword7.level, 0); // Regride imediatamente para +0!

    const sword8 = Item.create('dragon_blade', { level: 8, luck: false });
    const fail8 = JewelSystem.applyJewelOfSoul(sword8, 0.90);
    assert.equal(fail8.outcome, UpgradeOutcome.LEVEL_DOWN);
    assert.equal(sword8.level, 0); // Regride imediatamente para +0!
  });

  test('Jewel of Life: Sucesso (+4 até +28) e Reset em falha', () => {
    const armor = Item.create('dragon_armor', { optionLevel: 0 });

    // Sucesso com roll 0.30 (<= 0.50)
    const res1 = JewelSystem.applyJewelOfLife(armor, 0.30);
    assert.equal(res1.outcome, UpgradeOutcome.SUCCESS);
    assert.equal(armor.optionLevel, 4);

    // Outro sucesso
    JewelSystem.applyJewelOfLife(armor, 0.20);
    assert.equal(armor.optionLevel, 8);

    // Falha com roll 0.80 (> 0.50): reseta para 0
    const failRes = JewelSystem.applyJewelOfLife(armor, 0.80);
    assert.equal(failRes.outcome, UpgradeOutcome.FAILURE);
    assert.equal(armor.optionLevel, 0);
  });

  test('Máquina do Caos: Refino +9 para +10 e Destruição no +13..+15', () => {
    const sword = Item.create('dragon_blade', { level: 9, luck: true });

    // Upgrade para +10 com ingredientes adequados e roll de sucesso
    const ingredients = {
      chaosJewels: 1,
      blessJewels: 1,
      soulJewels: 1,
      zen: 2000000,
    };

    // Taxa base +10 com Luck é 75% (0.60 + 0.15). Roll 0.50 = Sucesso
    const res10 = JewelSystem.applyChaosMachineUpgrade(sword, ingredients, 0.50);
    assert.equal(res10.outcome, UpgradeOutcome.SUCCESS);
    assert.equal(sword.level, 10);

    // Testa falha crítica no +13 sem talismã de proteção -> DESTRUIÇÃO TOTAL
    const sword13 = Item.create('dragon_blade', { level: 13, luck: false });
    const ing13 = {
      chaosJewels: 1,
      blessJewels: 5,
      soulJewels: 5,
      zen: 10000000,
      hasTalismanOfChaosAssembly: false,
    };

    // Roll 0.95 -> Falha na tentativa para +14
    const resDestroy = JewelSystem.applyChaosMachineUpgrade(sword13, ing13, 0.95);
    assert.equal(resDestroy.outcome, UpgradeOutcome.DESTROYED);
    assert.equal(resDestroy.itemDestroyed, true);

    // Testa falha no +13 COM Talismã de Proteção -> Item salvo
    const sword13Protected = Item.create('dragon_blade', { level: 13, luck: false });
    const ing13Prot = {
      chaosJewels: 1,
      blessJewels: 5,
      soulJewels: 5,
      zen: 10000000,
      hasTalismanOfChaosAssembly: true,
    };

    const resProt = JewelSystem.applyChaosMachineUpgrade(sword13Protected, ing13Prot, 0.95);
    assert.equal(resProt.outcome, UpgradeOutcome.LEVEL_DOWN);
    assert.equal(resProt.itemDestroyed, false);
    assert.equal(sword13Protected.level, 12);
  });

  test('Jewel of Harmony: 80% de chance para conceder Opção Amarela', () => {
    const sword = Item.create('dragon_blade');
    assert.equal(sword.harmonyOption, null);

    // Roll 0.50 (<= 0.80) -> Sucesso
    const res = JewelSystem.applyJewelOfHarmony(sword, 'CRITICAL_DAMAGE', 0.50);
    assert.equal(res.outcome, UpgradeOutcome.SUCCESS);
    const harmony = sword.harmonyOption as { type: string; value: number } | null;
    assert.ok(harmony, 'A opção de harmonia deveria ter sido aplicada');
    assert.equal(harmony.type, 'CRITICAL_DAMAGE');
    assert.equal(harmony.value, 25);

    // Tentar aplicar novamente deve ser rejeitado (já possui opção de harmonia)
    const rejected = JewelSystem.applyJewelOfHarmony(sword, 'ATTACK_SPEED', 0.10);
    assert.equal(rejected.outcome, UpgradeOutcome.INVALID_TARGET);
  });
});

describe('Serialização e Persistência do Inventário', () => {
  test('Ciclo completo de Serialização (Save) e Desserialização (Load)', () => {
    const inv = new GridInventory();

    const sword = Item.create('dragon_blade', {
      level: 11,
      luck: true,
      skill: true,
      optionLevel: 16,
    });
    Item.addExcellentOption(sword, WeaponExcellentOption.EXCELLENT_DAMAGE_10_PCT);

    const helm = Item.create('dragon_helm', { level: 7 });
    const jewel = Item.create('jewel_of_blessing');

    inv.addItem(sword, 0, 0, false);
    inv.addItem(jewel, 5, 5, false);
    inv.addItem(helm);
    inv.equipItem(helm.uuid, EquipmentSlot.HELM);

    // Serializa
    const serialized = inv.serialize();
    assert.equal(serialized.items.length, 2); // sword + jewel no grid
    assert.equal(serialized.equipped.length, 1); // helm equipado

    // Desserializa em uma nova instância
    const loadedInv = GridInventory.deserialize(serialized);

    assert.equal(loadedInv.getAllGridItems().length, 2);
    assert.equal(loadedInv.getEquippedItem(EquipmentSlot.HELM)?.defId, 'dragon_helm');
    assert.equal(loadedInv.getEquippedItem(EquipmentSlot.HELM)?.level, 7);

    const loadedSword = loadedInv.getItemAt(0, 0);
    assert.notEqual(loadedSword, null);
    assert.equal(loadedSword?.defId, 'dragon_blade');
    assert.equal(loadedSword?.level, 11);
    assert.equal(loadedSword?.luck, true);
    assert.equal(loadedSword?.skill, true);
    assert.equal(loadedSword?.optionLevel, 16);
    assert.equal(
      Item.hasExcellentOption(loadedSword!, WeaponExcellentOption.EXCELLENT_DAMAGE_10_PCT),
      true
    );
  });
});
