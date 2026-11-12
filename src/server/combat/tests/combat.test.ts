/**
 * Dasi MMORPG - Testes Unitários e de Integração: Sistema de Monstros, Combate e Drops
 * Baseado no Continent of Legend (MU Online).
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';

import { Monster, MONSTER_DEFINITIONS } from '../Monster.ts';
import { MobSpawner } from '../MobSpawner.ts';
import { CombatEngine, DAMAGE_COLORS } from '../CombatEngine.ts';
import { GameServer } from '../../network/GameServer.ts';
import { SessionManager } from '../../network/SessionManager.ts';
import { Opcodes, encodeBinaryPacket, decodeBinaryPacket } from '../../network/protocol.ts';
import { Item } from '../../inventory/Item.ts';
import { WeaponExcellentOption, EquipmentSlot } from '../../inventory/types.ts';
import { BossManager } from '../../bosses/BossManager.ts';

describe('1. Entidade de Monstros & Sistema de Drops (Monster.ts)', () => {
  it('Criação correta dos monstros clássicos de Lorencia (Spider, Hound, Skeleton, Bull Fighter)', () => {
    const spider = new Monster('spider', 100, 100);
    assert.equal(spider.type, 'spider');
    assert.equal(spider.level, 2);
    assert.equal(spider.maxHp, 40);
    assert.equal(spider.currentHp, 40);
    assert.equal(spider.isDead, false);

    const hound = new Monster('hound', 200, 200);
    assert.equal(hound.type, 'hound');
    assert.equal(hound.level, 9);
    assert.equal(hound.maxHp, 130);

    const skeleton = new Monster('skeleton', 300, 300);
    assert.equal(skeleton.type, 'skeleton');
    assert.equal(skeleton.level, 14);
    assert.equal(skeleton.maxHp, 230);

    const bull = new Monster('bull_fighter', 400, 400);
    assert.equal(bull.type, 'bull_fighter');
    assert.equal(bull.level, 6);
    assert.equal(bull.maxHp, 95);
  });

  it('Aplicação autoritativa de dano, quebra de postura (Poise) e Stagger', () => {
    const mob = new Monster('spider', 100, 100);
    const initialHp = mob.currentHp;

    // Golpe leve que não quebra postura
    const hit1 = mob.takeDamage(10, 5);
    assert.equal(hit1.damageTaken, 10);
    assert.equal(mob.currentHp, initialHp - 10);
    assert.equal(hit1.staggered, false);
    assert.equal(mob.isDead, false);

    // Golpe forte que consome a postura restante
    const hit2 = mob.takeDamage(15, 20);
    assert.equal(hit2.staggered, true);
    assert.equal(mob.state, 'STAGGERED');
  });

  it('Aplicação de Knockback com vetor direcional', () => {
    const mob = new Monster('spider', 100, 100);
    // Ataque vindo de (50, 100) -> vetor de empurrão (+1, 0)
    mob.takeDamage(10, 5, 20, 1, 0);
    assert.equal(mob.x, 120);
    assert.equal(mob.y, 100);
  });

  it('Morte do monstro e geração de Drops físicos (Zen, Joias, Itens)', () => {
    const skeleton = new Monster('skeleton', 250, 250);
    const lethalHit = skeleton.takeDamage(999, 100);

    assert.equal(lethalHit.isDead, true);
    assert.equal(skeleton.isDead, true);
    assert.equal(skeleton.currentHp, 0);
    assert.equal(skeleton.state, 'DEAD');

    // Rola drops
    const drops = skeleton.rollDrops('session-test-01');
    assert.ok(drops.length >= 1, 'Deve gerar ao menos Zen ou item');

    // Valida que coordenadas dos drops são próximas ao monstro
    for (const drop of drops) {
      const dist = Math.hypot(drop.x - skeleton.x, drop.y - skeleton.y);
      assert.ok(dist <= 50, 'Drop deve estar no chão próximo ao monstro');
      assert.ok(drop.expiresAt > Date.now(), 'Drop deve ter tempo de expiração no chão');
    }
  });

  it('Geração rara de Joias e Itens Excelentes na tabela de Drop', () => {
    // Monstro com chance garantida de Joia e item excelente para teste
    const customMob = new Monster('skeleton', 100, 100, {
      dropTable: [
        { itemDefId: 'jewel_of_blessing', chance: 1.0 },
        { itemDefId: 'dragon_blade', chance: 1.0, maxLevel: 3, allowLuck: true, allowSkill: true, excellentChance: 1.0 },
      ],
    });

    const drops = customMob.rollDrops('tester');
    const jewelDrop = drops.find((d) => d.isJewel);
    const exclDrop = drops.find((d) => d.isExcellent);

    assert.ok(jewelDrop, 'Deve ter gerado Joia');
    assert.ok(exclDrop, 'Deve ter gerado item Excelente');
    assert.ok(exclDrop?.item?.excellentMask && exclDrop.item.excellentMask > 0);
  });
});

describe('2. Spawner de Monstros para Zonas de Lorencia (MobSpawner.ts)', () => {
  it('Inicializa as 4 zonas padrão de Lorencia com contagem correta', () => {
    const spawner = new MobSpawner();
    const zones = ['zone_lorencia_spiders', 'zone_lorencia_hounds', 'zone_lorencia_bulls', 'zone_lorencia_skeletons'];

    for (const z of zones) {
      assert.ok(spawner.getZone(z), `Zona ${z} deve existir`);
    }

    const allMobs = spawner.getAllMonsters();
    assert.equal(allMobs.length, 14, 'Total inicial de 4 spiders + 3 hounds + 3 bulls + 4 skeletons = 14');
  });

  it('Atualização de ciclo de jogo e perambulação (Wandering AI)', () => {
    const spawner = new MobSpawner();
    const mobs = spawner.getAllMonsters();
    const initialPos = { x: mobs[0].x, y: mobs[0].y };

    // Força perambulação determinística
    mobs[0].targetX = mobs[0].x + 60;
    mobs[0].targetY = mobs[0].y + 60;
    mobs[0].state = 'MOVING';
    assert.equal(mobs[0].state, 'MOVING');

    // Executa múltiplos ticks de movimento
    for (let i = 0; i < 15; i++) {
      spawner.update(0.1);
    }

    const currentPos = { x: mobs[0].x, y: mobs[0].y };
    const distMoved = Math.hypot(currentPos.x - initialPos.x, currentPos.y - initialPos.y);
    assert.ok(distMoved > 0, 'Monstro deve ter se movido');
  });

  it('Remoção de cadáver expirado e agendamento de respawn autoritativo', async () => {
    const spawner = new MobSpawner();
    const zone = spawner.getZone('zone_lorencia_spiders')!;
    zone.respawnDelayMs = 50; // Delay curto para teste

    const mob = spawner.getAllMonsters().find((m) => m.type === 'spider')!;
    mob.takeDamage(999, 100);
    mob.corpseExpiresAt = Date.now() - 10; // Força cadáver a expirar

    const res1 = spawner.update(0.1);
    assert.ok(res1.despawnedIds.includes(mob.id), 'Monstro morto deve ter sido despawnado');
    assert.equal(res1.respawned.length, 0, 'Ainda não deve ter respawnado antes do delay');

    // Aguarda o delay de respawn
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Próximo ciclo deve respawnar
    const res2 = spawner.update(0.1);
    assert.ok(res2.respawned.length > 0, 'Novo monstro deve ter sido respawnado');
  });
});

describe('3. Motor de Combate Autoritativo & Cálculo de Cores (CombatEngine.ts)', () => {
  it('Rejeita coordenadas não finitas em ataques e coleta', () => {
    const engine = new CombatEngine();
    const session = new SessionManager().createSession({});
    const mob = engine.spawner.getAllMonsters()[0];
    const hp = mob.currentHp;
    const result = engine.processPlayerAttack(session, { targetMobId: mob.id, playerX: NaN, playerY: mob.y });
    assert.equal(result.success, false);
    assert.equal(mob.currentHp, hp);
    const drop = mob.rollDrops(session.sessionId)[0];
    engine.registerExternalGroundDrop(drop);
    assert.equal(engine.pickupGroundItem(session, drop.dropId, NaN, drop.y).success, false);
    assert.ok(engine.getGroundDrop(drop.dropId));
  });

  it('Processa ataque com arma equipada calculando dano correto', () => {
    const engine = new CombatEngine();
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession('dummy-socket');
    sessionManager.authenticateSession(session.sessionId, 'KnightHero', 'DK');

    // Equipa Dragon Blade +7
    const blade = Item.create('dragon_blade', {
      level: 7,
      luck: true,
      skill: true,
      excellentMask: WeaponExcellentOption.INCREASE_DMG_2_PERCENT,
    });
    session.inventory.addItem(blade, 0, 0);
    session.inventory.equipItem(blade.uuid, EquipmentSlot.WEAPON_RIGHT);

    const mob = engine.spawner.getAllMonsters()[0];
    const initialHp = mob.currentHp;

    let result;
    do {
      result = engine.processPlayerAttack(session, {
        targetMobId: mob.id,
        playerX: mob.x - 40,
        playerY: mob.y,
      });
    } while (result.isMiss);

    assert.equal(result.success, true);
    assert.equal(result.isMiss, false);
    assert.ok(result.damage > 0, 'Dano deve ser maior que zero');
    assert.ok(['NORMAL', 'SKILL', 'CRITICAL', 'EXCELLENT', 'IGNORE_DEFENSE'].includes(result.damageType));
    assert.ok(result.colorHex.startsWith('#'));
    assert.equal(result.targetHp, mob.currentHp);
  });

  it('Aplica ataques autoritativos a chefes usando o snapshot separado do BossManager', () => {
    const bosses = new BossManager();
    const engine = new CombatEngine(undefined, bosses);
    const sessions = new SessionManager();
    const session = sessions.createSession('boss-combat-socket');
    sessions.authenticateSession(session.sessionId, 'BossFighter', 'DK');
    const boss = bosses.spawnBoss('boss_gorgon', 400, 250);

    let result: ReturnType<CombatEngine['processPlayerAttack']> | null = null;
    for (let attempt = 0; attempt < 100; attempt++) {
      result = engine.processPlayerAttack(session, {
        targetMobId: boss.id,
        skillId: 'twisting_slash',
        playerX: 380,
        playerY: 240,
      });
      if (!result.isMiss) break;
    }

    assert.ok(result && !result.isMiss, 'Ataque dentro do alcance deve conseguir acertar o chefe');
    assert.equal(result.targetId, boss.id);
    assert.ok(result.damage > 0);
    assert.equal(result.targetHp, boss.currentHp);
  });

  it('Identifica tipo de dano excelente e cores correspondentes', () => {
    assert.equal(DAMAGE_COLORS.NORMAL.colorHex, '#FFFFFF');
    assert.equal(DAMAGE_COLORS.SKILL.colorHex, '#FF8800');
    assert.equal(DAMAGE_COLORS.CRITICAL.colorHex, '#00E5FF');
    assert.equal(DAMAGE_COLORS.EXCELLENT.colorHex, '#39FF14');
    assert.equal(DAMAGE_COLORS.IGNORE_DEFENSE.colorHex, '#FFD700');
  });

  it('Derrota de monstro gera drop físico no chão e coleta (Pickup)', () => {
    const engine = new CombatEngine();
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession('dummy-socket');
    sessionManager.authenticateSession(session.sessionId, 'Collector', 'DK');

    const mob = engine.spawner.getAllMonsters()[0];
    mob.currentHp = 1; // Deixa com 1 de HP para morrer no próximo golpe

    let attackRes;
    do {
      attackRes = engine.processPlayerAttack(session, {
        targetMobId: mob.id,
        playerX: mob.x - 20,
        playerY: mob.y,
      });
    } while (attackRes.isMiss);

    assert.equal(attackRes.isDead, true);
    assert.ok(attackRes.dropsGenerated.length > 0, 'Deve ter gerado drops no chão');

    // Localiza um dos drops
    const drop = attackRes.dropsGenerated[0];
    const pickupRes = engine.pickupGroundItem(session, drop.dropId, drop.x, drop.y);

    assert.equal(pickupRes.success, true);
    assert.equal(pickupRes.dropId, drop.dropId);

    // Drop não deve mais estar no chão
    assert.equal(engine.getGroundDrop(drop.dropId), undefined);
  });

  it('Rejeita coleta de drop se o jogador estiver muito distante', () => {
    const engine = new CombatEngine();
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession('dummy-socket');

    const mob = engine.spawner.getAllMonsters()[0];
    mob.currentHp = 1;
    let attackRes;
    do {
      attackRes = engine.processPlayerAttack(session, {
        targetMobId: mob.id,
        playerX: mob.x - 10,
        playerY: mob.y,
      });
    } while (attackRes.isMiss);

    const drop = attackRes.dropsGenerated[0];
    // Jogador a 500 unidades de distância
    const pickupRes = engine.pickupGroundItem(session, drop.dropId, drop.x + 500, drop.y);
    assert.equal(pickupRes.success, false);
    assert.ok(pickupRes.error?.includes('distante'));
  });
});

describe('4. Integração de Rede GameServer: Combate, Monstros e Drops (Opcodes 0x15, 0x50, 0x16)', () => {
  let server: GameServer;
  const testPort = 8299;

  before(async () => {
    server = new GameServer({ port: testPort, dbPath: ':memory:' });
    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  function connectClient(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${testPort}`);
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
    });
  }

  function waitForPacket(
    ws: WebSocket,
    opcode: number,
    subcode: number,
    filter?: (payload: any) => boolean
  ): Promise<any> {
    return new Promise((resolve) => {
      const handler = (data: any) => {
        const text = data.toString('utf-8');
        try {
          const parsed = JSON.parse(text);
          if (parsed.opcode === opcode && parsed.subcode === subcode) {
            if (!filter || filter(parsed.payload)) {
              ws.off('message', handler);
              resolve(parsed.payload);
            }
          }
        } catch {
          // Ignore
        }
      };
      ws.on('message', handler);
    });
  }

  it('Recebe pacote 0x15:0x01 com monstros ativos no login', async () => {
    const ws = await connectClient();

    // 1. Handshake
    ws.send(JSON.stringify({
      opcode: Opcodes.MSG_HANDSHAKE_HELLO.opcode,
      subcode: Opcodes.MSG_HANDSHAKE_HELLO.subcode,
      payload: { clientVersion: '1.0.0', clientTime: Date.now() },
    }));
    await waitForPacket(ws, Opcodes.MSG_HANDSHAKE_CHALLENGE.opcode, Opcodes.MSG_HANDSHAKE_CHALLENGE.subcode);

    // 2. Login
    const promiseMonsters = waitForPacket(ws, Opcodes.MSG_MONSTER_SPAWN_OR_MOVE.opcode, Opcodes.MSG_MONSTER_SPAWN_OR_MOVE.subcode);
    ws.send(JSON.stringify({
      opcode: Opcodes.MSG_AUTH_LOGIN_REQ.opcode,
      subcode: Opcodes.MSG_AUTH_LOGIN_REQ.subcode,
      payload: { username: 'CombatTestHero', characterClass: 'DK' },
    }));

    const monstersPayload = await promiseMonsters;
    assert.ok(Array.isArray(monstersPayload.monsters));
    assert.ok(monstersPayload.monsters.length >= 10);

    ws.close();
  });

  it('Executa ataque de combate (0x50:0x01) e recebe broadcast com cor e dano (0x50:0x02)', async () => {
    const ws = await connectClient();

    // Handshake & Login
    ws.send(JSON.stringify({
      opcode: Opcodes.MSG_HANDSHAKE_HELLO.opcode,
      subcode: Opcodes.MSG_HANDSHAKE_HELLO.subcode,
      payload: { clientVersion: '1.0.0', clientTime: Date.now() },
    }));
    await waitForPacket(ws, Opcodes.MSG_HANDSHAKE_CHALLENGE.opcode, Opcodes.MSG_HANDSHAKE_CHALLENGE.subcode);

    ws.send(JSON.stringify({
      opcode: Opcodes.MSG_AUTH_LOGIN_REQ.opcode,
      subcode: Opcodes.MSG_AUTH_LOGIN_REQ.subcode,
      payload: { username: 'SlayerTest', characterClass: 'DK' },
    }));
    await waitForPacket(ws, Opcodes.MSG_AUTH_LOGIN_RES.opcode, Opcodes.MSG_AUTH_LOGIN_RES.subcode);

    // Pega monstro vivo do servidor
    const mob = server.combatEngine.spawner.getAllMonsters().find((m) => !m.isDead)!;

    // Envia ataque 0x50:0x01
    const promiseCombatRes = waitForPacket(ws, Opcodes.MSG_COMBAT_ATTACK_RES.opcode, Opcodes.MSG_COMBAT_ATTACK_RES.subcode);
    ws.send(JSON.stringify({
      opcode: Opcodes.MSG_COMBAT_ATTACK_REQ.opcode,
      subcode: Opcodes.MSG_COMBAT_ATTACK_REQ.subcode,
      payload: {
        targetMobId: mob.id,
        playerX: mob.x - 30,
        playerY: mob.y,
      },
    }));

    const combatRes = await promiseCombatRes;
    assert.equal(combatRes.success, true);
    assert.equal(combatRes.targetId, mob.id);
    assert.ok(combatRes.colorHex.startsWith('#'));
    assert.ok(typeof combatRes.damage === 'number');

    ws.close();
  });

  it('Fluxo completo de Morte de Monstro, Drop no Chão (0x16:0x01) e Coleta (0x16:0x02)', async () => {
    // Limpa drops anteriores para garantir que o cliente só receba o drop do monstro derrotado
    for (const drop of server.combatEngine.getAllGroundDrops()) {
      server.combatEngine.removeGroundDrop(drop.dropId);
    }

    const ws = await connectClient();

    // Handshake & Login
    ws.send(JSON.stringify({
      opcode: Opcodes.MSG_HANDSHAKE_HELLO.opcode,
      subcode: Opcodes.MSG_HANDSHAKE_HELLO.subcode,
      payload: { clientVersion: '1.0.0', clientTime: Date.now() },
    }));
    await waitForPacket(ws, Opcodes.MSG_HANDSHAKE_CHALLENGE.opcode, Opcodes.MSG_HANDSHAKE_CHALLENGE.subcode);

    ws.send(JSON.stringify({
      opcode: Opcodes.MSG_AUTH_LOGIN_REQ.opcode,
      subcode: Opcodes.MSG_AUTH_LOGIN_REQ.subcode,
      payload: { username: 'LooterMaster', characterClass: 'DK' },
    }));
    await waitForPacket(ws, Opcodes.MSG_AUTH_LOGIN_RES.opcode, Opcodes.MSG_AUTH_LOGIN_RES.subcode);

    // Localiza um monstro vivo e ajusta HP para 1 para forçar queda
    const mob = server.combatEngine.spawner.getAllMonsters().find((m) => !m.isDead) || server.combatEngine.spawner.getAllMonsters()[0];
    mob.isDead = false;
    mob.state = 'IDLE';
    mob.currentHp = 1;
    server.combatEngine.clearMobDamageLog(mob.id);

    // Ataca até acertar e derrotar o monstro (tratando eventual esquiva de 4%)
    let dropPayload: any = null;
    while (!dropPayload) {
      const promiseDrop = waitForPacket(
        ws,
        Opcodes.MSG_GROUND_ITEM_DROP.opcode,
        Opcodes.MSG_GROUND_ITEM_DROP.subcode,
        (p) => p.drops && p.drops.length > 0
      );

      const promiseAttack = waitForPacket(
        ws,
        Opcodes.MSG_COMBAT_ATTACK_RES.opcode,
        Opcodes.MSG_COMBAT_ATTACK_RES.subcode
      );

      ws.send(JSON.stringify({
        opcode: Opcodes.MSG_COMBAT_ATTACK_REQ.opcode,
        subcode: Opcodes.MSG_COMBAT_ATTACK_REQ.subcode,
        payload: {
          targetMobId: mob.id,
          playerX: mob.x - 20,
          playerY: mob.y,
        },
      }));

      const attackRes = await promiseAttack;
      if (attackRes.success && attackRes.isDead && attackRes.damage > 0) {
        dropPayload = await promiseDrop;
        break;
      }
    }
    assert.ok(Array.isArray(dropPayload.drops));
    assert.ok(dropPayload.drops.length > 0);

    const firstDrop = dropPayload.drops[0];

    // Envia requisição de coleta 0x16:0x02
    const promisePickup = waitForPacket(ws, Opcodes.MSG_GROUND_ITEM_PICKUP_RES.opcode, Opcodes.MSG_GROUND_ITEM_PICKUP_RES.subcode);
    ws.send(JSON.stringify({
      opcode: Opcodes.MSG_GROUND_ITEM_PICKUP_REQ.opcode,
      subcode: Opcodes.MSG_GROUND_ITEM_PICKUP_REQ.subcode,
      payload: {
        dropId: firstDrop.dropId,
        playerX: firstDrop.x,
        playerY: firstDrop.y,
      },
    }));

    const pickupRes = await promisePickup;
    assert.equal(pickupRes.success, true);
    assert.equal(pickupRes.dropId, firstDrop.dropId);

    ws.close();
  });
});
