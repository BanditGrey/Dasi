/**
 * Dasi MMORPG - Testes de NavMesh e Pathfinding dos Monstros com Contorno de Obstáculos (Passo 9)
 * Valida desvios laterais em 45°/90° contornando caixas AABB e cilindros de Lorencia.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Monster } from '../Monster.ts';
import { CollisionSystem } from '../../world/CollisionSystem.ts';

describe('NavMesh & Pathfinding de Monstros - Contorno de Obstáculos (Passo 9)', () => {
  it('1. Monstro contorna suavemente a Fonte Central Cilíndrica de Lorencia sem travar', () => {
    // Em LOR_01, a fonte do arcanjo fica em x: 0, z: 0 com raio 3.2m
    const scenario = CollisionSystem.getScenario('LOR_01');
    assert.ok(scenario, 'Cenário LOR_01 deve existir no CollisionSystem');

    const fountain = scenario.colliders.find((c) => c.id === 'fountain_basin');
    assert.ok(fountain, 'Colisor fountain_basin deve existir em LOR_01');

    // Monstro posicionado ao sul da fonte, querendo alcançar o jogador ao norte
    const mob = new Monster('spider', 0, -6);
    mob.scenarioId = 'LOR_01';
    mob.moveSpeed = 4.0; // 4 metros por segundo
    mob.targetX = 0;
    mob.targetY = 6;

    const initialY = mob.y;

    // Executa simulação de 5 segundos de movimentação (10 passos de 0.5s)
    let deflectedHorizontally = false;
    for (let step = 0; step < 10; step++) {
      mob.update(0.5, 'LOR_01');

      // Se o monstro desviou para os lados (X diferente de 0) para contornar a fonte
      if (Math.abs(mob.x) > 0.5) {
        deflectedHorizontally = true;
      }

      // O monstro NUNCA deve penetrar o interior da fonte (distância ao centro < raio - margem)
      const distToCenter = Math.hypot(mob.x, mob.y);
      assert.ok(
        distToCenter >= (fountain as any).radius - 0.1,
        `Monstro violou colisão interna da fonte (dist: ${distToCenter}, raio: ${(fountain as any).radius})`
      );
    }

    assert.ok(deflectedHorizontally, 'Monstro deve ter projetado raio de desvio lateral (X != 0)');
    assert.ok(mob.y > initialY, 'Monstro deve ter progredido em direção ao alvo ao norte (Y > initialY)');
  });

  it('2. Monstro contorna a quina de obstáculo AABB (Tenda de Lorencia)', () => {
    // Tenda tent_sw em x: -7.2, z: -4, width: 3.2, depth: 3
    const mob = new Monster('hound', -7.2, -8);
    mob.scenarioId = 'LOR_01';
    mob.moveSpeed = 3.5;
    mob.targetX = -7.2;
    mob.targetY = 0; // Alvo do outro lado da tenda

    const initialY = mob.y;
    let avoidedAabb = false;

    for (let step = 0; step < 8; step++) {
      mob.update(0.5, 'LOR_01');
      if (Math.abs(mob.x - (-7.2)) > 0.4) {
        avoidedAabb = true;
      }
    }

    assert.ok(avoidedAabb, 'Monstro deve ter contornado a quina da tenda AABB lateralmente');
    assert.ok(mob.y > initialY, 'Monstro deve continuar progredindo em direção ao alvo');
  });

  it('3. Em campo aberto desimpedido, o monstro se move em linha reta direta', () => {
    // Região aberta de Lorencia LOR_01 (longe dos obstáculos centrais e muros)
    const mob = new Monster('bull_fighter', 15, 0);
    mob.scenarioId = 'LOR_01';
    mob.moveSpeed = 3.0;
    mob.targetX = 15;
    mob.targetY = 8;

    mob.update(1.0, 'LOR_01');

    // Movimento puro no eixo Y sem necessidade de desvio
    assert.strictEqual(mob.x, 15, 'Em campo livre, a coordenada X deve permanecer inalterada');
    assert.strictEqual(mob.y, 3, 'Deve avançar exatamente step = 3 unidades em 1s');
  });
});
