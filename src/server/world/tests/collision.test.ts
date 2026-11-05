/**
 * Dasi MMORPG - Testes Unitários de Colisão Física & Registro dos 56 Cenários Canônicos
 * Validação rigorosa de bounds, deslizamento em quinas, caixas AABB, cilindros e radiais.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CollisionSystem } from '../CollisionSystem.ts';

describe('1. Catálogo Completo dos 56 Cenários Canônicos (CollisionSystem)', () => {
  it('Possui todos os 56 cenários canônicos registrados com bounds e spawnPoints válidos', () => {
    const scenarios = CollisionSystem.getAllScenarios();
    assert.strictEqual(scenarios.length, 56, `Deveria ter exatamente 56 cenários registrados, mas tem ${scenarios.length}`);

    const biomeCounts: Record<string, number> = {
      LORENCIA: 0,
      NORIA: 0,
      DEVIAS: 0,
      DUNGEON: 0,
      LOST_TOWER: 0,
      ATLANS: 0,
      TARKAN: 0,
      ICARUS: 0,
      VALLEY_OF_LOREN: 0,
      BLOOD_CASTLE: 0,
      DEVIL_SQUARE: 0,
      CHAOS_CASTLE: 0,
      DUEL_COLISEUM: 0,
    };

    for (const sc of scenarios) {
      assert.ok(sc.id, 'Cenário deve possuir ID');
      assert.ok(sc.name, `Cenário ${sc.id} deve possuir nome`);
      assert.ok(sc.bounds, `Cenário ${sc.id} deve possuir bounds`);
      assert.ok(sc.bounds.minX < sc.bounds.maxX, `Bounds X de ${sc.id} inválido`);
      assert.ok(sc.bounds.minZ < sc.bounds.maxZ, `Bounds Z de ${sc.id} inválido`);
      assert.ok(sc.spawnPoint, `Cenário ${sc.id} deve possuir spawnPoint`);
      assert.ok(Array.isArray(sc.colliders), `Cenário ${sc.id} deve possuir array de colliders`);
      assert.ok(sc.colliders.length > 0, `Cenário ${sc.id} deve ter pelo menos 1 colisor físico`);

      biomeCounts[sc.biome] = (biomeCounts[sc.biome] || 0) + 1;
    }

    assert.strictEqual(biomeCounts['LORENCIA'], 7, 'Lorencia deve ter 7 cenários');
    assert.strictEqual(biomeCounts['NORIA'], 7, 'Noria deve ter 7 cenários');
    assert.strictEqual(biomeCounts['DEVIAS'], 6, 'Devias deve ter 6 cenários');
    assert.strictEqual(biomeCounts['DUNGEON'], 6, 'Dungeon deve ter 6 cenários');
    assert.strictEqual(biomeCounts['LOST_TOWER'], 7, 'Lost Tower deve ter 7 cenários');
    assert.strictEqual(biomeCounts['ATLANS'], 7, 'Atlans deve ter 7 cenários');
    assert.strictEqual(biomeCounts['TARKAN'], 5, 'Tarkan deve ter 5 cenários');
    assert.strictEqual(biomeCounts['ICARUS'], 2, 'Icarus deve ter 2 cenários');
    assert.strictEqual(biomeCounts['VALLEY_OF_LOREN'], 5, 'Valley of Loren deve ter 5 cenários de Castle Siege');
    assert.strictEqual(biomeCounts['BLOOD_CASTLE'], 1, 'Blood Castle deve ter 1 cenário');
    assert.strictEqual(biomeCounts['DEVIL_SQUARE'], 1, 'Devil Square deve ter 1 cenário');
    assert.strictEqual(biomeCounts['CHAOS_CASTLE'], 1, 'Chaos Castle deve ter 1 cenário');
    assert.strictEqual(biomeCounts['DUEL_COLISEUM'], 1, 'Coliseu de Duelos deve ter 1 cenário');

    const totalZones = Object.values(biomeCounts).reduce((a, b) => a + b, 0);
    assert.strictEqual(totalZones, 56, `Soma dos cenários por zona deveria ser 56, obtido ${totalZones}`);
  });

  it('Registra os 5 cenários de Castle Siege e as 4 arenas de evento com spawn fora dos colisores', () => {
    const siegeIds = ['VOL_01', 'VOL_02', 'VOL_03', 'VOL_04', 'VOL_05'];
    const eventIds = ['EVT_01', 'EVT_02', 'EVT_03', 'EVT_04'];

    for (const id of [...siegeIds, ...eventIds]) {
      const sc = CollisionSystem.getScenario(id);
      assert.ok(sc, `Cenário ${id} deve estar registrado`);
      assert.strictEqual(sc.instanced, true, `${id} deve ser uma instância isolada (Castle Siege / Arena)`);

      // O spawn deve estar dentro dos bounds
      assert.ok(sc.spawnPoint.x > sc.bounds.minX && sc.spawnPoint.x < sc.bounds.maxX, `Spawn X de ${id} fora dos bounds`);
      assert.ok(sc.spawnPoint.z > sc.bounds.minZ && sc.spawnPoint.z < sc.bounds.maxZ, `Spawn Z de ${id} fora dos bounds`);

      // O spawn não pode estar dentro de nenhum colisor sólido (o jogador nasceria preso)
      const resolved = CollisionSystem.resolveMovement(
        id,
        { x: sc.spawnPoint.x, z: sc.spawnPoint.z },
        { x: sc.spawnPoint.x, z: sc.spawnPoint.z },
        0.45
      );
      const drift = Math.hypot(resolved.x - sc.spawnPoint.x, resolved.z - sc.spawnPoint.z);
      assert.ok(drift < 0.001, `Spawn de ${id} está dentro de um colisor (deslocado ${drift.toFixed(3)}m)`);
    }

    const gate = CollisionSystem.getScenario('VOL_02');
    assert.strictEqual(gate?.destructibleHp?.['cyclopean_iron_gate'], 25_000_000, 'Portão ciclópico deve ter 25M de HP');
  });

  it('Resgata cenários por ID e por código canônico', () => {
    const lorenciaById = CollisionSystem.getScenario('LOR_01');
    assert.ok(lorenciaById);
    assert.strictEqual(lorenciaById.code, 'LORENCIA_CITADEL');

    const lorenciaByCode = CollisionSystem.getScenario('LORENCIA_CITADEL');
    assert.ok(lorenciaByCode);
    assert.strictEqual(lorenciaByCode.id, 'LOR_01');

    const balrogLair = CollisionSystem.getScenario('LT_07');
    assert.ok(balrogLair);
    assert.strictEqual(balrogLair.code, 'LOST_TOWER_BALROG_THRONE');
  });
});

describe('2. Física de Colisão & Deslizamento (Sliding Response)', () => {
  it('Clampa a posição do jogador dentro dos limites externos do mapa (Outer Bounds)', () => {
    const scenario = CollisionSystem.getScenario('LOR_01'); // bounds: minX: -20, maxX: 20, minZ: -20, maxZ: 20
    assert.ok(scenario, 'LOR_01 deve estar registrado');
    const radius = 0.45;

    // Tentativa de escapar pela borda X positiva
    const resRight = CollisionSystem.resolveMovement('LOR_01', { x: 19, z: 0 }, { x: 25, z: 0 }, radius);
    assert.strictEqual(resRight.collided, true);
    assert.strictEqual(resRight.x, scenario.bounds.maxX - radius);

    // Tentativa de escapar pela borda Z negativa
    const resTop = CollisionSystem.resolveMovement('LOR_01', { x: 0, z: -19 }, { x: 0, z: -25 }, radius);
    assert.strictEqual(resTop.collided, true);
    assert.strictEqual(resTop.z, scenario.bounds.minZ + radius);
  });

  it('Desliza suavemente contra colisor cilíndrico (ex: Fonte do Arcanjo)', () => {
    // Fonte em 0,0 com raio 3.2m
    const radius = 0.45;
    const current = { x: 0, z: -5.0 };
    const target = { x: 0, z: 0 }; // Tentando andar direto para o centro da fonte

    const res = CollisionSystem.resolveMovement('LOR_01', current, target, radius);
    assert.strictEqual(res.collided, true);
    // Deve ser empurrado para a borda do cilindro (3.2 + 0.45 = 3.65m de distância)
    const dist = Math.hypot(res.x, res.z);
    assert.ok(Math.abs(dist - 3.65) < 0.001, `Distância deveria ser 3.65, obtido ${dist}`);
  });

  it('Desliza perfeitamente contra obstáculo cúbico AABB (ex: Tenda de Bazar)', () => {
    // Tenda tent_sw em x: -7.2, z: -4.0 com width: 3.2, depth: 3.0
    // minX: -7.2 - 1.6 = -8.8, maxX: -7.2 + 1.6 = -5.6
    // minZ: -4.0 - 1.5 = -5.5, maxZ: -4.0 + 1.5 = -2.5
    const radius = 0.45;
    const current = { x: -7.2, z: -7.0 };
    const target = { x: -7.2, z: -4.0 }; // Andando de baixo para o centro da tenda

    const res = CollisionSystem.resolveMovement('LOR_01', current, target, radius);
    assert.strictEqual(res.collided, true);
    // Deve deslizar para a face inferior (minBoxZ com raio: -5.5 - 0.45 = -5.95)
    assert.ok(Math.abs(res.z - (-5.95)) < 0.001, `Z deveria ser -5.95, obtido ${res.z}`);
  });

  it('Respeita colisor de fronteira radial (RADIAL_BOUNDARY) em Icarus', () => {
    // ICA_01: center_island_void em 0,0 com maxRadius: 9.5
    const radius = 0.45;
    const current = { x: 0, z: 5.0 };
    const target = { x: 0, z: 25.0 }; // Tentando cair da ilha flutuante

    const res = CollisionSystem.resolveMovement('ICA_01', current, target, radius);
    assert.strictEqual(res.collided, true);
    const dist = Math.hypot(res.x, res.z);
    // maxAllowed = 9.5 - 0.45 = 9.05
    assert.ok(Math.abs(dist - 9.05) < 0.001, `Distância deveria ser 9.05, obtido ${dist}`);
  });

  it('Permite movimento livre sem colisão quando não há obstáculos no caminho', () => {
    const current = { x: 0, z: -10 };
    const target = { x: 1, z: -10.5 };

    const res = CollisionSystem.resolveMovement('LOR_01', current, target, 0.45);
    assert.strictEqual(res.collided, false);
    assert.strictEqual(res.x, 1);
    assert.strictEqual(res.z, -10.5);
  });
});
