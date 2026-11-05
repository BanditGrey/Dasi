import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SCENARIO_CATALOG } from '../../../server/world/CollisionSystem.ts';
// @ts-ignore - módulos do visualizador
import { createEnvironment } from '../dasi3dContent.js';
// @ts-ignore - módulo JS compartilhado com o browser
import { createTiledFloor, loadTileEdits, saveTileEdits, validateTileDocument } from '../tileFloor.js';

describe('Piso modular visual', () => {
  it('subdivide pisos sem ampliar bordas e troca apenas a célula escolhida', () => {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 9), new THREE.MeshStandardMaterial({ color: 0x556677 }));
    floor.position.set(1, 0.5, 3);
    floor.rotation.x = -Math.PI / 2;
    const tiles = createTiledFloor(THREE, floor)!;
    assert.equal(tiles.cols, 3);
    assert.equal(tiles.rows, 3);
    assert.equal(tiles.mesh.count, 9);
    assert.deepEqual(tiles.mesh.position.toArray(), floor.position.toArray());
    const last = new THREE.Matrix4();
    tiles.mesh.getMatrixAt(8, last);
    assert.equal(last.elements[0], 2);
    assert.equal(last.elements[5], 1);
    assert.equal(tiles.setTile(1, 2, 'musgo'), true);
    assert.deepEqual(tiles.getEdits(), { '1,2': 'musgo' });
    assert.equal(tiles.setTile(3, 0, 'musgo'), false);
    assert.equal(tiles.setTile(0, 0, 'inválido'), false);
    assert.equal(tiles.setTile(1, 2, 'original'), true);
    assert.deepEqual(tiles.getEdits(), {});
  });

  it('troca peças 3D individualmente, inclusive na borda, e mantém seleção do piso', () => {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 9), new THREE.MeshStandardMaterial());
    floor.rotation.x = -Math.PI / 2;
    const tiles = createTiledFloor(THREE, floor)!;
    const slab = tiles.mesh.getObjectByName('scenario_tile_laje') as THREE.InstancedMesh;
    const stone = tiles.mesh.getObjectByName('scenario_tile_pedra') as THREE.InstancedMesh;
    const transform = new THREE.Matrix4();
    assert.ok(tiles.setTile(2, 2, 'laje'));
    slab.getMatrixAt(8, transform);
    assert.ok(Math.abs(transform.elements[0] - 2) < 1e-6);
    assert.ok(Math.abs(transform.elements[5] - 1) < 1e-6);
    assert.ok(tiles.setTile(2, 2, 'pedra'));
    slab.getMatrixAt(8, transform);
    assert.equal(transform.elements[0], 0);
    stone.getMatrixAt(8, transform);
    assert.equal(transform.elements[0], 2);
    tiles.mesh.updateMatrixWorld(true);
    const hit = new THREE.Raycaster(new THREE.Vector3(4, 5, -4), new THREE.Vector3(0, -1, 0)).intersectObject(tiles.mesh)[0];
    assert.equal(hit.instanceId, 8);
    assert.equal(hit.object, tiles.mesh);
    assert.ok(tiles.setTile(2, 2, 'original'));
    stone.getMatrixAt(8, transform);
    assert.equal(transform.elements[0], 0);
    assert.deepEqual(tiles.getEdits(), {});
  });

  it('permite selecionar uma célula do piso com raycast', () => {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial());
    floor.rotation.x = -Math.PI / 2;
    const tiles = createTiledFloor(THREE, floor)!;
    tiles.mesh.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(new THREE.Vector3(-2, 5, 2), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObject(tiles.mesh)[0];
    assert.ok(hit);
    assert.equal(hit.instanceId, 0);
  });

  it('salva por cenário, aceita aliases e rejeita dados inválidos', () => {
    const saved = new Map<string, string>();
    const original = (globalThis as any).localStorage;
    (globalThis as any).localStorage = { getItem: (k: string) => saved.get(k) ?? null, setItem: (k: string, v: string) => saved.set(k, v) };
    try {
      const tiles = createTiledFloor(THREE, new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial()))!;
      assert.ok(tiles.setTile(1, 1, 'terra'));
      assert.equal(saveTileEdits('LORENCIA', tiles), true);
      assert.deepEqual(loadTileEdits('LOR_01'), { '1,1': 'terra' });
      assert.deepEqual(loadTileEdits('LOR_02'), {});
      tiles.applyEdits({ '-1,0': 'terra', '99,99': 'terra', '0,0': 'inexistente' });
      assert.deepEqual(tiles.getEdits(), { '1,1': 'terra' });
      saved.set('dasi:tiles:v1:LOR_01', '{');
      assert.deepEqual(loadTileEdits('LOR_01'), {});
    } finally {
      if (original === undefined) delete (globalThis as any).localStorage;
      else (globalThis as any).localStorage = original;
    }
  });

  it('valida importação antes de aplicar e rejeita cenário e célula incorretos', () => {
    const tiles = createTiledFloor(THREE, new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial()))!;
    const document = { version: 1, scenarioId: 'LOR_01', tileSize: 4, cols: 2, rows: 2, edits: { '1,1': 'pedra' } };
    assert.equal(validateTileDocument(document, 'LORENCIA', tiles), true);
    assert.equal(validateTileDocument({ ...document, scenarioId: 'LOR_02' }, 'LOR_01', tiles), false);
    assert.equal(validateTileDocument({ ...document, edits: { '2,0': 'musgo' } }, 'LOR_01', tiles), false);
    assert.equal(validateTileDocument({ ...document, edits: { '0,0': 'inválido' } }, 'LOR_01', tiles), false);
    assert.equal(validateTileDocument({ ...document, edits: [] }, 'LOR_01', tiles), false);
  });

  it('converte apenas pisos planos marcados e mantém arenas especiais intactas', () => {
    const supported: string[] = [];
    const unsupported: string[] = [];
    for (const scenario of SCENARIO_CATALOG) {
      const env = createEnvironment(scenario.id, THREE);
      if (env.tileFloor) {
        supported.push(scenario.id);
        assert.ok(env.group.getObjectByName('scenario_tiled_floor'));
        assert.equal(env.group.getObjectByName('scenario_base_floor'), undefined);
      } else unsupported.push(scenario.id);
    }
    assert.equal(supported.length, 46);
    assert.deepEqual(unsupported, ['ICA_01', 'ICA_02', 'VOL_02', 'VOL_03', 'VOL_04', 'VOL_05', 'EVT_01', 'EVT_02', 'EVT_03', 'EVT_04']);
  });
});
