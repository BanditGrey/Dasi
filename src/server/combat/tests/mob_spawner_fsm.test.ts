/**
 * DASI MMORPG - TESTES DE IA DE MOBS & SPAWNERS AUTORITATIVOS (FSM)
 * Valida a máquina de estados finitos (Aggro, Chase, Attack, Leash, Wander)
 * e o suporte a zonas de múltiplos biomas (Devias, Dungeon, Lost Tower).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Monster } from '../Monster.ts';
import { MobSpawner } from '../MobSpawner.ts';

describe('3. Máquina de Estados Finitos (FSM) & IA de Mobs', () => {
  it('detecta jogador dentro do raio de aggro e inicia perseguição (CHASE/MOVING)', () => {
    const mob = new Monster('spider', 100, 100);
    assert.strictEqual(mob.state, 'IDLE');
    assert.strictEqual(mob.targetPlayerId, null);

    // Jogador distante (> aggroRange de 100)
    const farPlayer = [{ id: 'p1', x: 250, y: 250 }];
    const resFar = mob.think(farPlayer, 0.1);
    assert.strictEqual(resFar, null);
    assert.strictEqual(mob.targetPlayerId, null);

    // Jogador próximo (dentro do raio de visão)
    const nearPlayer = [{ id: 'p1', x: 140, y: 140 }];
    const resNear = mob.think(nearPlayer, 0.1);
    assert.strictEqual(mob.targetPlayerId, 'p1');
    assert.strictEqual(mob.state, 'MOVING');
    assert.strictEqual(mob.targetX, 140);
    assert.strictEqual(mob.targetY, 140);
  });

  it('quando entra no alcance de ataque, comuta para ATTACKING e dispara golpe', () => {
    const mob = new Monster('bull_fighter', 100, 100);
    mob.attackRange = 40;
    mob.attackCooldown = 0.5;

    // Jogador no alcance de ataque
    const adjacentPlayer = [{ id: 'p1', x: 120, y: 100 }]; // dist = 20 <= attackRange
    const attackEvent = mob.think(adjacentPlayer, 0.1);

    assert.strictEqual(mob.state, 'ATTACKING');
    assert.ok(attackEvent, 'Deve retornar evento de ataque');
    assert.strictEqual(attackEvent?.action, 'ATTACK');
    assert.strictEqual(attackEvent?.targetId, 'p1');

    // Segundo tick imediato deve estar em cooldown
    const cooldownEvent = mob.think(adjacentPlayer, 0.1);
    assert.strictEqual(cooldownEvent, null, 'Deve respeitar o cooldown de ataque');
  });

  it('leash / evade: se o monstro se afastar além da distância máxima, desiste e retorna ao spawn', () => {
    const mob = new Monster('hound', 200, 200);
    mob.spawnX = 200;
    mob.spawnY = 200;
    mob.maxLeashDistance = 150;
    mob.targetPlayerId = 'p1';

    // Posição atual muito longe do spawn
    mob.x = 400;
    mob.y = 400; // dist = ~282 > 150

    const player = [{ id: 'p1', x: 420, y: 420 }];
    const res = mob.think(player, 0.1);

    assert.strictEqual(res, null);
    assert.strictEqual(mob.targetPlayerId, null, 'Deve ter perdido o aggro por leash');
    assert.strictEqual(mob.targetX, 200, 'Destino deve voltar a ser o spawnX');
    assert.strictEqual(mob.targetY, 200, 'Destino deve voltar a ser o spawnY');
    assert.strictEqual(mob.state, 'MOVING');
  });

  it('serialização inclui rotação angular e estados da criatura', () => {
    const mob = new Monster('skeleton', 150, 150);
    mob.targetX = 200;
    mob.targetY = 150;
    mob.update(0.1);

    const s = mob.serialize();
    assert.strictEqual(s.type, 'skeleton');
    assert.strictEqual(typeof s.rotation, 'number');
    assert.strictEqual(s.isDead, false);
    assert.ok(['IDLE', 'MOVING', 'ATTACKING', 'STAGGERED', 'DEAD'].includes(s.state));
  });

  it('MobSpawner suporta zonas de biomas adicionais (Devias, Dungeon, Lost Tower)', () => {
    const spawner = new MobSpawner();
    const initialCount = spawner.getAllMonsters().length;
    assert.strictEqual(initialCount, 14, 'Lorencia padrão inicia com 14 monstros');

    // Inicializa Devias
    spawner.initBiomeZones('DEVIAS');
    const deviasZone = spawner.getZone('zone_devias_yetis');
    assert.ok(deviasZone, 'Zona dos Yetis de Devias deve existir');
    assert.strictEqual(deviasZone?.monsterType, 'yeti');

    // Inicializa Dungeon
    spawner.initBiomeZones('DUNGEON');
    assert.ok(spawner.getZone('zone_dungeon_liches'));
    assert.ok(spawner.getZone('zone_dungeon_skeletons'));

    // Inicializa Lost Tower
    spawner.initBiomeZones('LOST_TOWER');
    assert.ok(spawner.getZone('zone_lost_tower_demons'));

    assert.ok(spawner.getAllMonsters().length > initialCount, 'Contagem total de monstros deve ter aumentado');
  });

  it('MobSpawner.update processa jogadores e reporta ataques autoritativos', () => {
    const spawner = new MobSpawner();
    const spider = spawner.getAllMonsters().find((m) => m.type === 'spider')!;

    // Posiciona um jogador colado na aranha
    const players = [{ id: 'hero-1', x: spider.x + 5, y: spider.y + 5 }];
    const tickResult = spawner.update(0.1, players);

    assert.ok(Array.isArray(tickResult.attacks));
    const spiderAttack = tickResult.attacks.find((a) => a.mobId === spider.id);
    assert.ok(spiderAttack, 'A aranha deve ter atacado o jogador adjacente');
    assert.strictEqual(spiderAttack?.targetId, 'hero-1');
  });
});
