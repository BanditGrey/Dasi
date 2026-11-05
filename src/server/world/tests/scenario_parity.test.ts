/**
 * Dasi MMORPG - Teste de Paridade do Catálogo de Cenários (Servidor x Cliente)
 *
 * Garante que o registry autoritativo (CollisionSystem.ts) e o espelho
 * client-side (dasiCollisionEngine.js) permaneçam idênticos em ID, bounds,
 * spawn point e volumes de colisão. Qualquer cenário adicionado de um lado
 * sem o outro quebra a predição do cliente e o anti-cheat de posição.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CollisionSystem } from '../CollisionSystem.ts';
// @ts-ignore - módulo JS do Dev Viewer (ESM puro, sem dependências de browser)
import { DasiCollisionEngine } from '../../../client/dev_viewer/dasiCollisionEngine.js';

const SERVER = CollisionSystem.getAllScenarios();
const CLIENT: any[] = DasiCollisionEngine.getAllScenarios();

describe('3. Paridade do Catálogo de Cenários (Servidor x Cliente)', () => {
  it('Ambos os lados expõem exatamente os mesmos 56 IDs canônicos', () => {
    const serverIds = SERVER.map((s) => s.id).sort();
    const clientIds = CLIENT.map((s) => s.id).sort();

    assert.strictEqual(CLIENT.length, 56, `Cliente deveria ter 56 cenários, tem ${CLIENT.length}`);
    assert.deepStrictEqual(clientIds, serverIds, 'IDs do cliente divergem dos IDs do servidor');
  });

  it('Bounds e spawn points são idênticos em todos os cenários', () => {
    for (const serverScenario of SERVER) {
      const clientScenario = CLIENT.find((s) => s.id === serverScenario.id);
      assert.ok(clientScenario, `Cenário ${serverScenario.id} ausente no cliente`);

      assert.deepStrictEqual(
        clientScenario.bounds,
        serverScenario.bounds,
        `Bounds divergentes em ${serverScenario.id}`
      );
      assert.deepStrictEqual(
        clientScenario.spawnPoint,
        serverScenario.spawnPoint,
        `Spawn point divergente em ${serverScenario.id}`
      );
    }
  });

  it('Cada cenário possui a mesma quantidade de colisores nos dois lados', () => {
    for (const serverScenario of SERVER) {
      const clientScenario = CLIENT.find((s) => s.id === serverScenario.id);
      assert.ok(clientScenario);
      assert.strictEqual(
        clientScenario.colliders.length,
        serverScenario.colliders.length,
        `Quantidade de colisores divergente em ${serverScenario.id}`
      );
    }
  });

  it('A resolução de movimento coincide em cenários de cerco e arenas de evento', () => {
    const probes = [
      { scenario: 'VOL_01', from: { x: 0, z: 0 }, to: { x: 0, z: 40 } },
      { scenario: 'VOL_02', from: { x: 0, z: -10 }, to: { x: 0, z: 6 } },
      { scenario: 'VOL_04', from: { x: 0, z: -5 }, to: { x: -20, z: -5 } },
      { scenario: 'EVT_01', from: { x: 0, z: -20 }, to: { x: 0, z: 30 } },
      { scenario: 'EVT_02', from: { x: 0, z: 0 }, to: { x: 0, z: 40 } },
      { scenario: 'EVT_03', from: { x: 0, z: 0 }, to: { x: 30, z: 0 } },
      { scenario: 'EVT_04', from: { x: 0, z: 0 }, to: { x: 25, z: 0 } },
    ];

    for (const probe of probes) {
      const server = CollisionSystem.resolveMovement(probe.scenario, probe.from, probe.to, 0.45);
      const client = DasiCollisionEngine.resolveMovement(probe.scenario, probe.from, probe.to, 0.45);

      assert.ok(
        Math.abs(client.x - server.x) < 1e-6 && Math.abs(client.z - server.z) < 1e-6,
        `Divergência física em ${probe.scenario}: servidor (${server.x}, ${server.z}) vs cliente (${client.x}, ${client.z})`
      );
    }
  });
});
