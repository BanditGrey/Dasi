import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  HarmonyAnd380System,
  JewelOfHarmonyItemType,
} from '../HarmonyAnd380System.ts';
import type { ItemInstance } from '../types.ts';

describe('HarmonyAnd380System - Jewel of Harmony & Level 380 PvP Engine', () => {
  it('determina corretamente o tipo de item para opções Harmony', () => {
    assert.equal(HarmonyAnd380System.getHarmonyItemType('bone_blade'), JewelOfHarmonyItemType.WEAPON);
    assert.equal(HarmonyAnd380System.getHarmonyItemType('grand_viper_staff'), JewelOfHarmonyItemType.STAFF);
    assert.equal(HarmonyAnd380System.getHarmonyItemType('dragon_knight_armor'), JewelOfHarmonyItemType.ARMOR);
    assert.equal(HarmonyAnd380System.getHarmonyItemType('jewel_of_chaos'), JewelOfHarmonyItemType.NONE);
  });

  it('refina Gemstone em Jewel of Harmony com 80% de chance canônica', () => {
    const successResult = HarmonyAnd380System.refineGemstone(0.79);
    assert.equal(successResult.success, true);
    assert.equal(successResult.resultItemDefId, 'jewel_of_harmony');

    const failResult = HarmonyAnd380System.refineGemstone(0.81);
    assert.equal(failResult.success, false);
    assert.equal(failResult.resultItemDefId, null);
  });

  it('fundição de itens em Pedras de Refinamento (Osborne)', () => {
    const normalItem: ItemInstance = {
      uuid: 'test-norm',
      defId: 'blade',
      level: 0,
      durability: 100,
      maxDurability: 100,
      skill: false,
      luck: false,
      optionLevel: 0,
      excellentMask: 0,
    };

    // Item normal: 50% de chance de Lower Refining Stone
    const normalSuccess = HarmonyAnd380System.smeltItem(normalItem, 0.49);
    assert.equal(normalSuccess.success, true);
    assert.equal(normalSuccess.resultItemDefId, 'lower_refining_stone');

    const normalFail = HarmonyAnd380System.smeltItem(normalItem, 0.51);
    assert.equal(normalFail.success, false);

    // Item excelente: 80% de chance de Higher Refining Stone
    const excItem: ItemInstance = {
      ...normalItem,
      excellentMask: 1, // Excelente
    };
    const excSuccess = HarmonyAnd380System.smeltItem(excItem, 0.79);
    assert.equal(excSuccess.success, true);
    assert.equal(excSuccess.resultItemDefId, 'higher_refining_stone');

    // Ancient não pode ser fundido
    const ancientItem: ItemInstance = {
      ...normalItem,
      ancientOption: 5,
    };
    assert.equal(HarmonyAnd380System.smeltItem(ancientItem, 0.1).success, false);
  });

  it('aplica Jewel of Harmony e concede opção canônica e rank inicial', () => {
    const weapon: ItemInstance = {
      uuid: 'test-wpn',
      defId: 'bone_blade',
      level: 13,
      durability: 140,
      maxDurability: 140,
      skill: true,
      luck: true,
      optionLevel: 16,
      excellentMask: 0,
    };

    const res = HarmonyAnd380System.applyJewelOfHarmony(weapon, 0.05);
    assert.equal(res.success, true);
    assert.ok(weapon.harmonyOption);
    assert.ok(weapon.harmonyOption.level >= 0);
    assert.ok(weapon.harmonyOption.value > 0);
  });

  it('evolui o rank da opção Harmony com pedras de refinamento e remove no Jerridon', () => {
    const staff: ItemInstance = {
      uuid: 'test-staff',
      defId: 'grand_viper_staff',
      level: 13,
      durability: 140,
      maxDurability: 140,
      skill: true,
      luck: true,
      optionLevel: 16,
      excellentMask: 0,
    };

    HarmonyAnd380System.applyJewelOfHarmony(staff, 0.01);
    const initialRank = staff.harmonyOption!.level;

    // Upgrade bem-sucedido com Higher Refining Stone (50% taxa)
    const upRes = HarmonyAnd380System.upgradeHarmonyOption(staff, 'higher_refining_stone', 0.40);
    assert.equal(upRes.success, true);
    assert.equal(staff.harmonyOption!.level, initialRank + 1);

    // Remoção no NPC Jerridon
    const removeRes = HarmonyAnd380System.removeHarmonyOption(staff);
    assert.equal(removeRes.success, true);
    assert.ok(removeRes.costZen > 0);
    assert.equal(staff.harmonyOption, null);
  });

  it('combinação de Item Nível 380 na Chaos Machine (50% taxa, item preservado na falha)', () => {
    const item380: ItemInstance = {
      uuid: 'test-380',
      defId: 'bone_blade',
      level: 4,
      durability: 140,
      maxDurability: 140,
      skill: true,
      luck: true,
      optionLevel: 4, // +4 option (mínimo exigido)
      excellentMask: 0,
    };

    // Falha por falta de Zen
    const noZen = HarmonyAnd380System.combine380PvP(item380, 5_000_000, true, true, 0.1);
    assert.equal(noZen.success, false);
    assert.equal(noZen.itemDestroyed, false);

    // Falha por nível menor que +4
    const lowLevel = HarmonyAnd380System.combine380PvP({ ...item380, level: 3 }, 15_000_000, true, true, 0.1);
    assert.equal(lowLevel.success, false);

    // Falha no sorteio: o item NUNCA é destruído
    const failRoll = HarmonyAnd380System.combine380PvP(item380, 15_000_000, true, true, 0.95);
    assert.equal(failRoll.success, false);
    assert.equal(failRoll.itemDestroyed, false);
    assert.equal(item380.itemOption380, undefined);

    // Sucesso no sorteio: ativa os bônus PvP
    const successRoll = HarmonyAnd380System.combine380PvP(item380, 15_000_000, true, true, 0.10);
    assert.equal(successRoll.success, true);
    assert.equal(item380.itemOption380, true);

    // Verifica os bônus canônicos de PvP concedidos à arma
    const bonuses = HarmonyAnd380System.get380PvPBonuses(item380);
    assert.equal(bonuses.damagePvP, 200);
    assert.equal(bonuses.attackSuccessRatePvP, 10);
  });

  it('verifica bônus específicos de cada peça do set 380', () => {
    const helm: ItemInstance = { uuid: 'h', defId: 'dragon_knight_helm', level: 4, durability: 100, maxDurability: 100, skill: false, luck: false, optionLevel: 4, excellentMask: 0, itemOption380: true };
    const armor: ItemInstance = { uuid: 'a', defId: 'dragon_knight_armor', level: 4, durability: 100, maxDurability: 100, skill: false, luck: false, optionLevel: 4, excellentMask: 0, itemOption380: true };
    const pants: ItemInstance = { uuid: 'p', defId: 'dragon_knight_pants', level: 4, durability: 100, maxDurability: 100, skill: false, luck: false, optionLevel: 4, excellentMask: 0, itemOption380: true };
    const gloves: ItemInstance = { uuid: 'g', defId: 'dragon_knight_gloves', level: 4, durability: 100, maxDurability: 100, skill: false, luck: false, optionLevel: 4, excellentMask: 0, itemOption380: true };
    const boots: ItemInstance = { uuid: 'b', defId: 'dragon_knight_boots', level: 4, durability: 100, maxDurability: 100, skill: false, luck: false, optionLevel: 4, excellentMask: 0, itemOption380: true };

    assert.equal(HarmonyAnd380System.get380PvPBonuses(helm).sdRecoveryRate, 2);
    assert.equal(HarmonyAnd380System.get380PvPBonuses(armor).sdRecoveryType, 1);
    assert.equal(HarmonyAnd380System.get380PvPBonuses(pants).defensePvP, 200);
    assert.equal(HarmonyAnd380System.get380PvPBonuses(gloves).maxHp, 200);
    assert.equal(HarmonyAnd380System.get380PvPBonuses(boots).maxSd, 700);
  });
});
