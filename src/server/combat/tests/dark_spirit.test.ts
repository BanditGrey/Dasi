import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DarkSpiritManager,
  DarkSpiritMode,
} from '../DarkSpiritManager.ts';

describe('DarkSpiritManager - DL Dark Spirit, Dark Horse & Guardian Pets Engine', () => {
  it('calcula os atributos de ataque canônicos do Dark Spirit com base em Level e Command', () => {
    // Level 50, Command 1000, sem cetro
    // MinDmg = 180 + 50*15 + 1000/8 = 180 + 750 + 125 = 1055
    // MaxDmg = 200 + 50*15 + 1000/4 = 200 + 750 + 250 = 1200
    // Speed = 20 + 50*4/5 + 1000/50 = 20 + 40 + 20 = 80
    // SuccessRate = 1000 + 50*16 = 1800
    const stats = DarkSpiritManager.calculateDarkSpiritStats(50, 1000);
    assert.equal(stats.level, 50);
    assert.equal(stats.minDamage, 1055);
    assert.equal(stats.maxDamage, 1200);
    assert.equal(stats.attackSpeed, 80);
    assert.equal(stats.attackSuccessRate, 1800);
    assert.equal(stats.criticalRate, 30);
    assert.equal(stats.rangeAttackRate, 30);
  });

  it('aplica amplificação de cetro (Scepter Rise) ao ataque do Dark Spirit', () => {
    // Scepter com MagicDamageRate = 40, Level = 13
    // risePercent = 40/2 + 13*2 = 20 + 26 = 46%
    const baseStats = DarkSpiritManager.calculateDarkSpiritStats(50, 1000);
    const scepterStats = DarkSpiritManager.calculateDarkSpiritStats(50, 1000, {
      level: 13,
      magicDamageRate: 40,
    });

    const expectedMin = baseStats.minDamage + Math.floor((baseStats.minDamage * 46) / 100);
    const expectedMax = baseStats.maxDamage + Math.floor((baseStats.maxDamage * 46) / 100);

    assert.equal(scepterStats.minDamage, expectedMin);
    assert.equal(scepterStats.maxDamage, expectedMax);
  });

  it('processa ataque do Dark Spirit com redução de defesa e cálculo de crítico', () => {
    const stats = DarkSpiritManager.calculateDarkSpiritStats(10, 100);
    const targetDefense = 50;

    // Ataque com sorteio médio e sem crítico
    const normalAttack = DarkSpiritManager.processDarkSpiritAttack(stats, targetDefense, 0.5, 0.5);
    assert.ok(normalAttack.damage > 0);
    assert.equal(normalAttack.isCritical, false);

    // Ataque com acerto crítico (critRoll < 0.30)
    const critAttack = DarkSpiritManager.processDarkSpiritAttack(stats, targetDefense, 0.5, 0.1);
    assert.equal(critAttack.isCritical, true);
    assert.equal(critAttack.damage, Math.floor(normalAttack.damage * 1.5));
  });

  it('calcula absorção de dano e skill Earthquake do Cavalo das Trevas (Dark Horse)', () => {
    // Level 50, Str 1000, Cmd 1000
    // Absorção = 30 + 50/2 = 55%
    // eqBase = 1000/10 + 1000/5 + 50*10 = 100 + 200 + 500 = 800
    // Min = 100 + 800 = 900, Max = 150 + 800 = 950
    const horse = DarkSpiritManager.calculateDarkHorseStats(50, 1000, 1000);
    assert.equal(horse.damageAbsorptionPercent, 55);
    assert.equal(horse.earthquakeDamageMin, 900);
    assert.equal(horse.earthquakeDamageMax, 950);
  });

  it('retorna os modificadores canônicos de guardiões clássicos (Satan, Angel, Dinorant, Fenrir)', () => {
    assert.deepEqual(DarkSpiritManager.getGuardianModifiers('satan'), {
      damageIncreasePercent: 30,
      damageAbsorptionPercent: 0,
    });

    assert.deepEqual(DarkSpiritManager.getGuardianModifiers('guardian_angel'), {
      damageIncreasePercent: 0,
      damageAbsorptionPercent: 20,
    });

    assert.deepEqual(DarkSpiritManager.getGuardianModifiers('dinorant'), {
      damageIncreasePercent: 15,
      damageAbsorptionPercent: 10,
    });

    assert.deepEqual(DarkSpiritManager.getGuardianModifiers('fenrir_black'), {
      damageIncreasePercent: 10,
      damageAbsorptionPercent: 0,
    });

    assert.deepEqual(DarkSpiritManager.getGuardianModifiers('fenrir_blue'), {
      damageIncreasePercent: 0,
      damageAbsorptionPercent: 10,
    });
  });
});
