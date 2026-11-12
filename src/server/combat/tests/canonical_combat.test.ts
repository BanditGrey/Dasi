import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CanonicalFormulas,
  CharacterClassId,
  type CharacterAttributes,
} from '../CanonicalFormulas.ts';

test('CanonicalFormulas: Poder de Ataque das 6 Classes Canônicas', () => {
  const baseAttrs: CharacterAttributes = {
    classId: CharacterClassId.DARK_KNIGHT,
    level: 100,
    strength: 400,
    agility: 200,
    vitality: 150,
    energy: 100,
    currentHp: 1000,
    maxHp: 1000,
    currentSd: 500,
    maxSd: 500,
    currentMp: 300,
    maxMp: 300,
    currentBp: 200,
    maxBp: 200,
  };

  // 1. Dark Knight: Str / 8 .. Str / 4
  const dkAtk = CanonicalFormulas.calculateAttackPower({ ...baseAttrs, classId: CharacterClassId.DARK_KNIGHT });
  assert.equal(dkAtk.minDamage, 50);  // 400 / 8
  assert.equal(dkAtk.maxDamage, 100); // 400 / 4

  // 2. Dark Wizard: Str / 6 .. Str / 4 (Phys), Ene / 9 .. Ene / 4 (Magic)
  const dwAtk = CanonicalFormulas.calculateAttackPower({ ...baseAttrs, classId: CharacterClassId.DARK_WIZARD, energy: 360 });
  assert.equal(dwAtk.minDamage, 66);  // 400 / 6
  assert.equal(dwAtk.maxDamage, 100); // 400 / 4
  assert.equal(dwAtk.minMagicDamage, 40); // 360 / 9
  assert.equal(dwAtk.maxMagicDamage, 90); // 360 / 4

  // 3. Fairy Elf: Bow vs Melee
  const elfMelee = CanonicalFormulas.calculateAttackPower({ ...baseAttrs, classId: CharacterClassId.FAIRY_ELF, agility: 280 }, false);
  assert.equal(elfMelee.minDamage, 40); // 280 / 7
  assert.equal(elfMelee.maxDamage, 70); // 280 / 4

  const elfBow = CanonicalFormulas.calculateAttackPower({ ...baseAttrs, classId: CharacterClassId.FAIRY_ELF, agility: 280, strength: 140 }, true);
  // min: 280 / 14 + 140 / 7 = 20 + 20 = 40
  // max: 280 / 8 + 140 / 4 = 35 + 35 = 70
  assert.equal(elfBow.minDamage, 40);
  assert.equal(elfBow.maxDamage, 70);

  // 4. Magic Gladiator: Str / 6 + Ene / 12 .. Str / 4 + Ene / 8
  const mgAtk = CanonicalFormulas.calculateAttackPower({ ...baseAttrs, classId: CharacterClassId.MAGIC_GLADIATOR, strength: 300, energy: 240 });
  assert.equal(mgAtk.minDamage, 70);  // 300/6 + 240/12 = 50 + 20 = 70
  assert.equal(mgAtk.maxDamage, 105); // 300/4 + 240/8 = 75 + 30 = 105

  // 5. Dark Lord: Str / 7 + Ene / 14 .. Str / 5 + Ene / 10
  const dlAtk = CanonicalFormulas.calculateAttackPower({ ...baseAttrs, classId: CharacterClassId.DARK_LORD, strength: 350, energy: 140 });
  assert.equal(dlAtk.minDamage, 60); // 350/7 + 140/14 = 50 + 10 = 60
  assert.equal(dlAtk.maxDamage, 84); // 350/5 + 140/10 = 70 + 14 = 84
});

test('CanonicalFormulas: Absorção de Escudo SD 90/10 Canônica (PvP)', () => {
  // Caso 1: Dano menor que o SD (90% no SD, 10% no HP)
  // Dano de 100 contra 500 SD e 1000 HP => 90 SD, 10 HP
  const res1 = CanonicalFormulas.applySdAbsorption(100, 500, 1000);
  assert.equal(res1.sdDamage, 90);
  assert.equal(res1.hpDamage, 10);
  assert.equal(res1.remainingSd, 410);
  assert.equal(res1.remainingHp, 990);
  assert.equal(res1.isDead, false);

  // Caso 2: Dano esgota o SD restante
  // Dano de 100 contra 40 SD e 1000 HP => SD absorve 40, restante 60 vai para HP
  const res2 = CanonicalFormulas.applySdAbsorption(100, 40, 1000);
  assert.equal(res2.sdDamage, 40);
  assert.equal(res2.hpDamage, 60);
  assert.equal(res2.remainingSd, 0);
  assert.equal(res2.remainingHp, 940);

  // Caso 3: Personagem com SD zerado (100% no HP)
  const res3 = CanonicalFormulas.applySdAbsorption(150, 0, 500);
  assert.equal(res3.sdDamage, 0);
  assert.equal(res3.hpDamage, 150);
  assert.equal(res3.remainingSd, 0);
  assert.equal(res3.remainingHp, 350);
});

test('CanonicalFormulas: Sequência e Dano do Combo Skill', () => {
  // Sequência válida: arma -> twisting -> death_stab
  const comboSuccess = CanonicalFormulas.evaluateCombo(
    ['weapon_cyclone', 'twisting_slash', 'death_stab'],
    400, // Str
    200, // Dex
    100  // Ene
  );
  assert.equal(comboSuccess.isCombo, true);
  // (400 + 200 + 100) / 2 = 700 / 2 = 350
  assert.equal(comboSuccess.comboDamage, 350);

  // Sequência inválida: sem passo 1
  const comboFail = CanonicalFormulas.evaluateCombo(
    ['fireball', 'twisting_slash', 'death_stab'],
    400,
    200,
    100
  );
  assert.equal(comboFail.isCombo, false);
  assert.equal(comboFail.comboDamage, 0);
});

test('CanonicalFormulas: Fórmulas de Buffs Canônicos e Tetos (Caps)', () => {
  // Mana Shield: 10 + (250/50) + (800/200) = 10 + 5 + 4 = 19%
  const ms1 = CanonicalFormulas.calculateManaShield(250, 800);
  assert.equal(ms1.absorptionPercent, 19);
  assert.equal(ms1.durationSeconds, 80); // 60 + 800/40 = 80s

  // Mana Shield atingindo o Cap de 50%
  const msCapped = CanonicalFormulas.calculateManaShield(2000, 4000);
  assert.equal(msCapped.absorptionPercent, 50);

  // Greater Fortitude: 12 + (500/100) + (400/20) = 12 + 5 + 20 = 37%
  const gf = CanonicalFormulas.calculateGreaterFortitude(500, 400);
  assert.equal(gf.hpBonusPercent, 37);
  assert.equal(gf.durationSeconds, 100); // 60 + 400/10 = 100s

  // Greater Damage & Greater Defense da Elf
  assert.equal(CanonicalFormulas.calculateGreaterDamage(700), 103); // 3 + 700/7 = 103
  assert.equal(CanonicalFormulas.calculateGreaterDefense(800), 102); // 2 + 800/8 = 102
  assert.equal(CanonicalFormulas.calculateHeal(500), 105);           // 5 + 500/5 = 105

  // Damage Reflect da Summoner (cap 50%)
  assert.equal(CanonicalFormulas.calculateDamageReflect(420), 40); // 30 + 420/42 = 40%
  assert.equal(CanonicalFormulas.calculateDamageReflect(2000), 50); // Capped at 50%
});
