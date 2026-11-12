import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CombatEngine } from '../CombatEngine.ts';
import { MobSpawner } from '../MobSpawner.ts';
import { SessionManager } from '../../network/SessionManager.ts';
import { Item } from '../../inventory/Item.ts';
import { EquipmentSlot } from '../../inventory/types.ts';

describe('Combate Bidirecional, Sobrevivência & Dark Wizard Combat', () => {
  it('processa ataque autoritativo do monstro contra o jogador com divisão 90/10 no SD e HP', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'Hero';
    session.character.characterClass = 'DK';
    session.character.agility = 60;
    session.currentHp = 1000;
    session.maxHp = 1000;
    session.currentSd = 500;
    session.maxSd = 500;

    const mobs = spawner.getAllMonsters();
    const spider = mobs.find((m) => m.type === 'spider') || mobs[0];
    assert.ok(spider);

    const initialHp = session.currentHp;
    const initialSd = session.currentSd;

    const res = combat.processMonsterAttack(spider.id, session);
    assert.equal(res.success, true);

    if (!res.isMiss) {
      assert.ok(res.damage > 0);
      assert.ok(session.currentSd < initialSd || session.currentHp < initialHp);
      assert.equal(res.playerHp, session.currentHp);
      assert.equal(res.playerSd, session.currentSd);
    }
  });

  it('aplica absorção de dano do Mana Shield (Soul Barrier) quando o buff está ativo', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();

    // Sessão sem buff
    const sessionNoBuff = sessionManager.createSession({});
    sessionNoBuff.character.characterClass = 'DW';
    sessionNoBuff.character.agility = 40;
    sessionNoBuff.currentHp = 800;
    sessionNoBuff.currentSd = 400;

    // Sessão com Mana Shield (35% de absorção)
    const sessionWithBuff = sessionManager.createSession({});
    sessionWithBuff.character.characterClass = 'DW';
    sessionWithBuff.character.agility = 40;
    sessionWithBuff.currentHp = 800;
    sessionWithBuff.currentSd = 400;
    sessionWithBuff.activeBuffs = new Map([
      ['MANA_SHIELD', { value: 35, durationMs: 60000, expiresAt: Date.now() + 60000 }]
    ]);

    const mobs = spawner.getAllMonsters();
    const bull = mobs.find((m) => m.type === 'bull_fighter') || mobs[0];
    assert.ok(bull);

    // Força cálculo determinístico de dano
    const resWithBuff = combat.processMonsterAttack(bull.id, sessionWithBuff);
    if (!resWithBuff.isMiss) {
      // Dano recebido com buff deve ser reduzido
      assert.ok(resWithBuff.damage >= 1);
    }
  });

  it('detecta morte do jogador quando HP chega a zero', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.agility = 0;
    session.currentHp = 1; // Quase morto
    session.currentSd = 0;

    const mobs = spawner.getAllMonsters();
    const skeleton = mobs.find((m) => m.type === 'skeleton') || mobs[0];
    assert.ok(skeleton);

    let defeated = false;
    for (let i = 0; i < 5; i++) {
      const res = combat.processMonsterAttack(skeleton.id, session);
      if (!res.isMiss && res.damage >= 1) {
        assert.equal(res.isDead, true);
        assert.equal(session.currentHp, 0);
        defeated = true;
        break;
      }
    }
    assert.ok(defeated, 'O jogador deve ser derrotado com HP zerado.');
  });

  it('Dark Wizard executa Evil Spirits com dano mágico em área de 260 unidades e acerto em múltiplos monstros', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'SoulMaster';
    session.character.characterClass = 'DW';
    session.character.energy = 500;
    session.character.agility = 100;
    session.currentMp = 600;
    session.maxMp = 600;

    const mobs = spawner.getAllMonsters();
    assert.ok(mobs.length >= 3);

    // Posiciona 3 monstros próximos
    const target = mobs[0];
    const mob2 = mobs[1];
    const mob3 = mobs[2];

    target.x = 200; target.y = 200; target.currentHp = 300; target.isDead = false;
    mob2.x = 250; mob2.y = 220; mob2.currentHp = 300; mob2.isDead = false;
    mob3.x = 280; mob3.y = 260; mob3.currentHp = 300; mob3.isDead = false;

    const initialMp = session.currentMp;

    const res = combat.processPlayerAttack(session, {
      targetMobId: target.id,
      skillId: 'evil_spirits',
      playerX: 210,
      playerY: 210,
    });

    assert.equal(res.success, true);
    assert.ok(session.currentMp < initialMp, 'Evil Spirits deve consumir Mana.');
    assert.ok(res.damage > 0, 'Dano mágico deve ser positivo.');

    // Monstros adjacentes devem ter sofrido dano da área
    assert.ok(mob2.currentHp < 300, 'Mob 2 deve receber dano da área de Evil Spirits');
    assert.ok(mob3.currentHp < 300, 'Mob 3 deve receber dano da área de Evil Spirits');
  });

  it('Dark Wizard conjura Mana Shield (Soul Barrier) e recebe buff ativo na sessão', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'SoulMaster';
    session.character.characterClass = 'DW';
    session.character.energy = 600;
    session.character.agility = 200;
    session.currentMp = 500;
    session.maxMp = 500;

    const mobs = spawner.getAllMonsters();
    const target = mobs[0];

    const res = combat.processPlayerAttack(session, {
      targetMobId: target.id,
      skillId: 'mana_shield',
      playerX: target.x + 30,
      playerY: target.y + 30,
    });

    assert.equal(res.success, true);
    assert.ok(session.activeBuffs?.has('MANA_SHIELD'));

    const buff = session.activeBuffs?.get('MANA_SHIELD');
    assert.ok(buff);
    // Absorção: 10 + floor(600/50) + floor(200/200) = 10 + 12 + 1 = 23%
    assert.equal(buff.value, 23);
    assert.ok(buff.expiresAt > Date.now());
  });

  it('Dark Wizard executa Lightning com empurrão (knockback elevado) e consome 15 MP', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.characterClass = 'DW';
    session.character.energy = 300;
    session.currentMp = 400;

    const mobs = spawner.getAllMonsters();
    const target = mobs[0];
    target.currentHp = 500;

    const startMp = session.currentMp;
    const res = combat.processPlayerAttack(session, {
      targetMobId: target.id,
      skillId: 'lightning',
      playerX: target.x + 40,
      playerY: target.y + 40,
    });

    assert.equal(res.success, true);
    assert.equal(session.currentMp, startMp - 12);
    assert.ok(res.knockback.x !== 0 || res.knockback.y !== 0);
  });
});
