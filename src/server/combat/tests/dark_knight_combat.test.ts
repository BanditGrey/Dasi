import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CombatEngine } from '../CombatEngine.ts';
import { MobSpawner } from '../MobSpawner.ts';
import { SessionManager } from '../../network/SessionManager.ts';
import { Item } from '../../inventory/Item.ts';
import { EquipmentSlot, WeaponExcellentOption } from '../../inventory/types.ts';
import { ComboSkillEngine } from '../ComboSkillEngine.ts';

describe('Dark Knight (Blade Knight) Combat Engine - Skills, Formulas & AoE', () => {
  it('calcula corretamente o multiplicador canônico de habilidade do Dark Knight', () => {
    // 80 Energy: 200 + floor(80/10) = 208%
    const mult80 = ComboSkillEngine.calculateDKSkillMultiplier(80);
    assert.equal(mult80, 208);

    // 250 Energy: 200 + 25 = 225%
    const mult250 = ComboSkillEngine.calculateDKSkillMultiplier(250);
    assert.equal(mult250, 225);

    // Limite máximo canônico de 500%
    const multMax = ComboSkillEngine.calculateDKSkillMultiplier(4000);
    assert.equal(multMax, 500);
  });

  it('executa ataque básico de espada do Dark Knight sem consumo de MP/AG', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'BladeKnight';
    session.character.characterClass = 'DK';
    session.character.strength = 400;
    session.character.energy = 80;
    session.currentMp = 300;
    session.maxMp = 300;

    const mobs = spawner.getAllMonsters();
    const targetMob = mobs.find((m) => m.maxHp >= 100) || mobs[0];
    assert.ok(targetMob);

    const initialMp = session.currentMp;

    const result = combat.processPlayerAttack(session, {
      targetMobId: targetMob.id,
      playerX: targetMob.x + 20,
      playerY: targetMob.y + 20,
    });

    assert.equal(result.success, true);
    // Ataque básico não consome MP
    assert.equal(session.currentMp, initialMp);
  });

  it('executa Twisting Slash com dano aumentado, consumo de 10 MP e acerto AoE em monstros adjacentes', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'BladeMaster';
    session.character.characterClass = 'DK';
    session.character.strength = 500;
    session.character.energy = 100;
    session.currentMp = 300;
    session.maxMp = 300;

    const mobs = spawner.getAllMonsters();
    assert.ok(mobs.length >= 2, 'Deve haver ao menos 2 monstros no spawner');

    const mob1 = mobs[0];
    const mob2 = mobs[1];

    // Posiciona mob1 e mob2 próximos do jogador para testar AoE de 180 unidades
    const playerX = 150;
    const playerY = 150;
    mob1.x = 160;
    mob1.y = 155;
    mob2.x = 170;
    mob2.y = 165;

    const initialHpMob2 = mob2.currentHp;
    const initialMp = session.currentMp;

    const result = combat.processPlayerAttack(session, {
      targetMobId: mob1.id,
      skillId: 'twisting_slash',
      playerX,
      playerY,
    });

    assert.equal(result.success, true);
    assert.equal(result.damageType, 'SKILL');
    assert.ok(result.damage > 0);

    // Valida consumo de Mana
    assert.equal(session.currentMp, initialMp - 10);

    // Valida dano AoE colateral no mob2 próximo
    assert.ok(mob2.currentHp < initialHpMob2, 'Mob2 deve receber dano do vórtice 360° de Twisting Slash');
  });

  it('executa Death Stab com alto multiplicador de dano e quebra de postura', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'DeathKnight';
    session.character.characterClass = 'DK';
    session.character.strength = 600;
    session.character.energy = 120;
    session.currentMp = 300;

    const mobs = spawner.getAllMonsters();
    const targetMob = mobs.find((m) => m.maxHp >= 100) || mobs[0];

    const initialMp = session.currentMp;

    const result = combat.processPlayerAttack(session, {
      targetMobId: targetMob.id,
      skillId: 'death_stab',
      playerX: targetMob.x + 30,
      playerY: targetMob.y + 30,
    });

    assert.equal(result.success, true);
    assert.ok(['SKILL', 'CRITICAL', 'EXCELLENT'].includes(result.damageType));
    assert.ok(result.damage >= 40, 'Death Stab deve infligir dano expressivo');
    assert.equal(result.isDead, true, 'Monstro deve ser derrotado pelo golpe fatal');

    // Consumo de 12 MP
    assert.equal(session.currentMp, initialMp - 12);
  });
});
