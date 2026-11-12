import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EffectManager, EffectId } from '../EffectManager.ts';
import { ComboSkillEngine, WeaponSkillId, ClassOrbSkillId } from '../ComboSkillEngine.ts';

describe('EffectManager - Canonical Webzen Buffs & Formulas', () => {
  it('calcula o Mana Shield (Soul Barrier) respeitando teto de 50% e fórmula canônica', () => {
    // Exemplo: 500 Dex, 1000 Energy
    // Redução = 10 + floor(500 / 50) + floor(1000 / 200) = 10 + 10 + 5 = 25%
    // Duração = 60 + floor(1000 / 40) = 60 + 25 = 85s
    const ms1 = EffectManager.calculateManaShield(500, 1000);
    assert.equal(ms1.percentReduction, 25);
    assert.equal(ms1.durationSeconds, 85);

    // Teste de clamp no máximo de 50%
    const msMax = EffectManager.calculateManaShield(2000, 3000);
    assert.equal(msMax.percentReduction, 50);
  });

  it('calcula o Greater Fortitude (Greater Life) do BK com teto de 100%', () => {
    // Exemplo: 400 Vit, 800 Ene
    // Bonus % = 12 + floor(400 / 100) + floor(800 / 20) = 12 + 4 + 40 = 56%
    // Duração = 60 + floor(800 / 10) = 60 + 80 = 140s
    const gl1 = EffectManager.calculateGreaterLife(400, 800);
    assert.equal(gl1.percentBonusHp, 56);
    assert.equal(gl1.durationSeconds, 140);

    const glMax = EffectManager.calculateGreaterLife(2000, 2500);
    assert.equal(glMax.percentBonusHp, 100);
  });

  it('calcula buffs de Fada Elfa e Dark Lord com precisão', () => {
    // Greater Defense: 2 + floor(800 / 8) = 102
    const gd = EffectManager.calculateGreaterDefense(800);
    assert.equal(gd.defenseBonus, 102);
    assert.equal(gd.durationSeconds, 60);

    // Greater Damage: 3 + floor(700 / 7) = 103
    const dmg = EffectManager.calculateGreaterDamage(700);
    assert.equal(dmg.damageBonus, 103);
    assert.equal(dmg.durationSeconds, 60);

    // DL Critical Damage: floor(500 / 25) + floor(600 / 30) = 20 + 20 = 40
    const crit = EffectManager.calculateGreaterCriticalDamage(500, 600);
    assert.equal(crit.criticalDamageBonus, 40);
    assert.equal(crit.durationSeconds, 110);
  });

  it('gerencia a lista de efeitos ativos, expiração e decaimento por tick', () => {
    const mgr = new EffectManager();
    mgr.addEffect(EffectId.MANA_SHIELD, 'Soul Barrier', 10, 25);
    mgr.addEffect(EffectId.GREATER_DAMAGE, 'Greater Damage', 2, 50);

    assert.equal(mgr.hasEffect(EffectId.MANA_SHIELD), true);
    assert.equal(mgr.hasEffect(EffectId.GREATER_DAMAGE), true);

    // Passam 2 segundos: Greater Damage expira, Mana Shield continua
    const expired1 = mgr.tick(2);
    assert.equal(expired1.length, 1);
    assert.equal(expired1[0].index, EffectId.GREATER_DAMAGE);
    assert.equal(mgr.hasEffect(EffectId.GREATER_DAMAGE), false);
    assert.equal(mgr.hasEffect(EffectId.MANA_SHIELD), true);
    assert.equal(mgr.getEffect(EffectId.MANA_SHIELD)?.durationSeconds, 8);
  });
});

describe('ComboSkillEngine - BK Combo State Machine & Multipliers', () => {
  it('completa o combo estrito (Arma -> Skill Orbe A -> Skill Orbe B) dentro de 3000ms', () => {
    const combo = new ComboSkillEngine();
    const t0 = 1000;

    // 1. Falling Slash (Arma)
    const r1 = combo.registerSkill(WeaponSkillId.FALLING_SLASH, t0);
    assert.equal(r1, false);

    // 2. Twisting Slash (Orbe A) aos 1500ms
    const r2 = combo.registerSkill(ClassOrbSkillId.TWISTING_SLASH, t0 + 500);
    assert.equal(r2, false);

    // 3. Death Stab (Orbe B diferente) aos 2200ms -> COMBO DETONADO!
    const r3 = combo.registerSkill(ClassOrbSkillId.DEATH_STAB, t0 + 1200);
    assert.equal(r3, true);
  });

  it('falha o combo se repetir a mesma skill de orbe na terceira etapa', () => {
    const combo = new ComboSkillEngine();
    const t0 = 1000;

    combo.registerSkill(WeaponSkillId.CYCLONE, t0);
    combo.registerSkill(ClassOrbSkillId.TWISTING_SLASH, t0 + 500);
    // Repete Twisting Slash
    const r = combo.registerSkill(ClassOrbSkillId.TWISTING_SLASH, t0 + 1000);
    assert.equal(r, false);
  });

  it('quebra o combo se exceder a janela de 3000ms', () => {
    const combo = new ComboSkillEngine();
    const t0 = 1000;

    combo.registerSkill(WeaponSkillId.CYCLONE, t0);
    // Passam 3500ms (> 3000ms)
    const r = combo.registerSkill(ClassOrbSkillId.TWISTING_SLASH, t0 + 3500);
    assert.equal(r, false);
  });

  it('calcula o dano de combo canônico: 2 * Base + (Str + Dex + Ene) / 2', () => {
    // Base 500, Str 1000, Dex 600, Ene 400
    // Bonus stats = floor((1000 + 600 + 400) / 2) = 1000
    // Combo Damage = (500 * 2) + 1000 = 2000
    const dmg = ComboSkillEngine.calculateComboDamage(500, 1000, 600, 400);
    assert.equal(dmg, 2000);
  });

  it('calcula multiplicadores de dano físico de habilidades (DK e DL)', () => {
    // DK: 200 + floor(1000 / 10) = 300%
    const dkRate = ComboSkillEngine.calculateDKSkillMultiplier(1000);
    assert.equal(dkRate, 300);

    // DL: 200 + floor(1000 / 20) = 250%
    const dlRate = ComboSkillEngine.calculateDLSkillMultiplier(1000);
    assert.equal(dlRate, 250);
  });
});
