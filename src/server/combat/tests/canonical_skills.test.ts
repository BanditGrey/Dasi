/**
 * Dasi MMORPG - Testes Automatizados de Habilidades Canônicas das 5 Classes
 * Cobre as 5 classes: Dark Knight, Dark Wizard, Fairy Elf, Magic Gladiator e Dark Lord.
 * Valida consumo autoritativo de Mana, multiplicadores e efeitos de área (AoE).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CombatEngine } from '../CombatEngine.ts';
import { MobSpawner } from '../MobSpawner.ts';
import { SessionManager } from '../../network/SessionManager.ts';
import { SkillCatalog } from '../SkillCatalog.ts';
import { EffectId } from '../EffectManager.ts';

describe('1. Catálogo de Habilidades das 5 Classes (SkillCatalog)', () => {
  it('registra todas as habilidades canônicas essenciais com metadados corretos', () => {
    const skills = SkillCatalog.getAllSkills();
    assert.ok(skills.length >= 18, 'Deve conter pelo menos 18 habilidades registradas');

    // Valida DK
    const twist = SkillCatalog.getBySlug('twisting_slash');
    assert.ok(twist);
    assert.equal(twist.manaCost, 10);
    assert.equal(twist.aoeRadius, 180);

    // Valida DW
    const evil = SkillCatalog.findSkill('evil_spirits');
    assert.ok(evil);
    assert.equal(evil.manaCost, 35);
    assert.equal(evil.aoeRadius, 220);

    // Valida Elf
    const triple = SkillCatalog.findSkill('triple_shot');
    assert.ok(triple);
    assert.equal(triple.manaCost, 5);

    // Valida MG
    const pSlash = SkillCatalog.findSkill('power_slash');
    assert.ok(pSlash);
    assert.equal(pSlash.manaCost, 12);
    assert.equal(pSlash.aoeRadius, 200);

    // Valida DL
    const earthquake = SkillCatalog.findSkill('earthquake');
    assert.ok(earthquake);
    assert.equal(earthquake.manaCost, 25);
    assert.equal(earthquake.aoeRadius, 240);
  });
});

describe('2. Execução de Habilidades do Dark Wizard (Soul Master)', () => {
  it('executa Evil Spirits com dano mágico em área 360° e consumo de 35 MP', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'SoulMasterDW';
    session.character.characterClass = 'DW';
    session.character.energy = 800;
    session.currentMp = 500;

    const mobs = spawner.getAllMonsters();
    const targetMob = mobs[0];
    const secondMob = mobs[1];

    // Posiciona mobs próximos no raio de 220 de Evil Spirits
    targetMob.x = 150;
    targetMob.y = 150;
    secondMob.x = 180;
    secondMob.y = 160;

    const initialMp = session.currentMp;
    const initialHp2 = secondMob.currentHp;

    let res = combat.processPlayerAttack(session, {
      targetMobId: targetMob.id,
      skillId: 'evil_spirits',
      playerX: 140,
      playerY: 140,
    });

    if (res.isMiss) {
      res = combat.processPlayerAttack(session, {
        targetMobId: targetMob.id,
        skillId: 'evil_spirits',
        playerX: 140,
        playerY: 140,
      });
    }

    assert.equal(res.success, true);
    assert.ok(['SKILL', 'CRITICAL', 'EXCELLENT', 'IGNORE_DEFENSE'].includes(res.damageType));
    assert.ok(session.currentMp <= initialMp - 35, 'Deve deduzir 35 de Mana');
    assert.ok(secondMob.currentHp < initialHp2, 'Evil Spirits deve atingir segundo monstro na área AoE');
  });

  it('bloqueia execução de Evil Spirits se a Mana for insuficiente', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.characterClass = 'DW';
    session.currentMp = 20; // Requer 35 MP

    const targetMob = spawner.getAllMonsters()[0];
    const res = combat.processPlayerAttack(session, {
      targetMobId: targetMob.id,
      skillId: 'evil_spirits',
      playerX: targetMob.x + 20,
      playerY: targetMob.y + 20,
    });

    assert.equal(res.success, false);
    assert.equal(session.currentMp, 20, 'Mana não deve ser gasta em tentativa fracassada');
  });
});

describe('3. Execução de Habilidades da Fairy Elf (Muse Elf)', () => {
  it('executa Triple Shot com consumo de 5 MP e alto dano concentrado', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'MuseElf';
    session.character.characterClass = 'ELF';
    session.character.agility = 900;
    session.character.strength = 200;
    session.currentMp = 400;

    const mobs = spawner.getAllMonsters();
    const targetMob = mobs.find((m) => m.maxHp >= 100) || mobs[0];
    const initialMp = session.currentMp;

    let res = combat.processPlayerAttack(session, {
      targetMobId: targetMob.id,
      skillId: 'triple_shot',
      playerX: targetMob.x + 30,
      playerY: targetMob.y + 30,
    });

    if (res.isMiss) {
      res = combat.processPlayerAttack(session, {
        targetMobId: targetMob.id,
        skillId: 'triple_shot',
        playerX: targetMob.x + 30,
        playerY: targetMob.y + 30,
      });
    }

    assert.equal(res.success, true);
    assert.ok(session.currentMp <= initialMp - 5, 'Deve deduzir 5 de Mana do Triple Shot');
    assert.ok(['SKILL', 'CRITICAL', 'EXCELLENT', 'IGNORE_DEFENSE'].includes(res.damageType));
  });

  it('executa Ice Arrow aplicando redução e consumo de 20 MP', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.characterClass = 'ELF';
    session.character.agility = 600;
    session.currentMp = 300;

    const targetMob = spawner.getAllMonsters()[0];
    const initialSpeed = targetMob.moveSpeed;
    const initialMp = session.currentMp;

    const res = combat.processPlayerAttack(session, {
      targetMobId: targetMob.id,
      skillId: 'ice_arrow',
      playerX: targetMob.x + 20,
      playerY: targetMob.y + 20,
    });

    assert.equal(res.success, true);
    assert.ok(session.currentMp <= initialMp - 20, 'Deve deduzir 20 de Mana');
    assert.ok(targetMob.moveSpeed <= Math.floor(initialSpeed * 0.6), 'Monstro deve sofrer redução de velocidade por gelo');
  });
});

describe('4. Execução de Habilidades do Dark Lord (Lord Emperor)', () => {
  it('executa Earthquake com pisada sísmica 360° em raio 240 e consumo de 25 MP', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'LordEmperor';
    session.character.characterClass = 'DL';
    session.character.strength = 800;
    session.character.command = 500;
    session.character.energy = 400;
    session.currentMp = 600;

    const mobs = spawner.getAllMonsters();
    const targetMob = mobs[0];
    const secondMob = mobs[1];

    targetMob.x = 200;
    targetMob.y = 200;
    secondMob.x = 240;
    secondMob.y = 210;

    const initialMp = session.currentMp;
    const initialHp2 = secondMob.currentHp;

    let res = combat.processPlayerAttack(session, {
      targetMobId: targetMob.id,
      skillId: 'earthquake',
      playerX: 190,
      playerY: 190,
    });

    if (res.isMiss) {
      res = combat.processPlayerAttack(session, {
        targetMobId: targetMob.id,
        skillId: 'earthquake',
        playerX: 190,
        playerY: 190,
      });
    }

    assert.equal(res.success, true);
    assert.ok(session.currentMp <= initialMp - 25, 'Deve deduzir 25 de Mana');
    assert.ok(secondMob.currentHp < initialHp2, 'Earthquake deve atingir monstros no raio sísmico de 240');
  });
});

describe('5. Execução de Habilidades do Magic Gladiator (Duel Master)', () => {
  it('executa Power Slash com dano em leque frontal e consumo de 12 MP', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'DuelMasterMG';
    session.character.characterClass = 'MG';
    session.character.strength = 600;
    session.character.energy = 500;
    session.currentMp = 350;

    const mobs = spawner.getAllMonsters();
    const targetMob = mobs[0];
    const secondMob = mobs[1];

    targetMob.x = 100;
    targetMob.y = 100;
    secondMob.x = 130;
    secondMob.y = 120;

    const initialMp = session.currentMp;
    const initialHp2 = secondMob.currentHp;

    let res = combat.processPlayerAttack(session, {
      targetMobId: targetMob.id,
      skillId: 'power_slash',
      playerX: 90,
      playerY: 90,
    });

    if (res.isMiss) {
      res = combat.processPlayerAttack(session, {
        targetMobId: targetMob.id,
        skillId: 'power_slash',
        playerX: 90,
        playerY: 90,
      });
    }

    assert.equal(res.success, true);
    assert.ok(session.currentMp <= initialMp - 12, 'Deve deduzir 12 de Mana do Power Slash');
    assert.ok(secondMob.currentHp < initialHp2, 'Power Slash deve atingir alvos no arco frontal');
  });
});
