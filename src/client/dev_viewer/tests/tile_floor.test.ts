import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SCENARIO_CATALOG } from '../../../server/world/CollisionSystem.ts';
// @ts-ignore - módulos do visualizador
import { createEnvironment } from '../dasi3dContent.js';
// @ts-ignore - módulo JS compartilhado com o browser
import { createTiledFloor, createTiledBoxTop, createTiledRoundTop, loadTileEdits, saveTileEdits, validateTileDocument, tileDocumentLayers, makeTileDocument } from '../tileFloor.js';

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

  it('posiciona, substitui e restaura muros e vegetação sem afetar outras células', () => {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial());
    const tiles = createTiledFloor(THREE, floor)!;
    const wallX = tiles.mesh.getObjectByName('scenario_tile_muro_x') as THREE.InstancedMesh;
    const wallY = tiles.mesh.getObjectByName('scenario_tile_muro_y') as THREE.InstancedMesh;
    const bush = tiles.mesh.getObjectByName('scenario_tile_arbusto') as THREE.InstancedMesh;
    assert.equal(wallX.visible, false);
    assert.ok(tiles.setObject(0, 0, 'muro_x'));
    assert.ok(tiles.setObject(1, 0, 'muro_x'));
    assert.ok(tiles.setObject(1, 0, 'muro_x')); // reaplicar não altera a contagem
    assert.ok(tiles.setObject(0, 0, 'arbusto'));
    assert.equal(wallX.visible, true);
    assert.equal(bush.visible, true);
    assert.ok(tiles.setObject(1, 0, 'muro_y'));
    assert.equal(wallX.visible, false);
    assert.equal(wallY.visible, true);
    assert.deepEqual(tiles.getObjects(), { '0,0': 'arbusto', '1,0': 'muro_y' });
    const matrix = new THREE.Matrix4();
    bush.getMatrixAt(0, matrix);
    assert.equal(matrix.elements[0], 2);
    wallY.getMatrixAt(1, matrix);
    assert.equal(matrix.elements[0], 4);
    assert.ok(tiles.setObject(0, 0, 'original'));
    assert.equal(bush.visible, false);
    assert.equal(wallY.visible, true);
    const document = { version: 1, scenarioId: 'LOR_01', tileSize: 4, cols: 2, rows: 2, edits: tiles.getObjects() };
    assert.equal(validateTileDocument(document, 'LOR_01', tiles), true);
    const restored = createTiledFloor(THREE, floor)!;
    restored.applyEdits(document.edits, 'objects');
    assert.deepEqual(restored.getObjects(), { '1,0': 'muro_y' });
    assert.equal(restored.mesh.getObjectByName('scenario_tile_muro_y')!.visible, true);
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
      assert.deepEqual(loadTileEdits('LOR_01', tiles), { floor: { '1,1': 'terra' }, objects: {} });
      assert.deepEqual(loadTileEdits('LOR_02', tiles), { floor: {}, objects: {} });
      tiles.applyEdits({ '-1,0': 'terra', '99,99': 'terra', '0,0': 'inexistente' });
      assert.deepEqual(tiles.getEdits(), { '1,1': 'terra' });
      saved.set('dasi:tiles:v1:LOR_01', JSON.stringify({ version: 1, scenarioId: 'LOR_01', edits: { '0,0': 'muro_y', '1,1': 'terra' } }));
      assert.deepEqual(loadTileEdits('LOR_01', tiles), { floor: { '1,1': 'terra' }, objects: { '0,0': 'muro_y' } });
      saved.set('dasi:tiles:v1:LOR_01', '{');
      assert.deepEqual(loadTileEdits('LOR_01', tiles), { floor: {}, objects: {} });
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

  it('preserva piso e objeto por camada e migra dados antigos', () => {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial());
    const tiles = createTiledFloor(THREE, floor)!;
    assert.ok(tiles.setTile(0, 0, 'laje'));
    assert.ok(tiles.setObject(0, 0, 'muro_x'));
    assert.equal(tiles.mesh.getObjectByName('scenario_tile_laje')!.visible, true);
    assert.equal(tiles.mesh.getObjectByName('scenario_tile_muro_x')!.visible, true);
    assert.equal(tiles.setTile(0, 1, 'muro_x'), false);
    assert.equal(tiles.setObject(0, 1, 'laje'), false);
    const data = makeTileDocument('LORENCIA', tiles);
    assert.equal(validateTileDocument(data, 'LOR_01', tiles), true);
    assert.equal(validateTileDocument({ ...data, floor: { '0,0': 'arbusto' } }, 'LOR_01', tiles), false);
    assert.equal(validateTileDocument({ ...data, objects: { '00,0': 'arbusto' } }, 'LOR_01', tiles), false);
    tiles.setObject(0, 0, 'original');
    assert.deepEqual(tiles.getEdits(), { '0,0': 'laje' });
    tiles.clearEdits();
    assert.deepEqual(tiles.getEdits(), {});
    const migrated = tileDocumentLayers({ version: 1, edits: { '0,0': 'terra', '1,0': 'muro_y' } });
    assert.deepEqual(migrated, { floor: { '0,0': 'terra' }, objects: { '1,0': 'muro_y' } });
    tiles.applyEdits(data.floor);
    tiles.applyEdits(data.objects, 'objects');
    assert.deepEqual(tiles.getEdits(), { '0,0': 'laje' });
    assert.deepEqual(tiles.getObjects(), { '0,0': 'muro_x' });
  });

  it('limita a grade ao topo do bloco, preservando a geometria e o vão da ponte', () => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 24), new THREE.MeshStandardMaterial());
    box.position.y = 0.05;
    const tiles = createTiledBoxTop(THREE, box)!;
    assert.equal(tiles.cols, 2);
    assert.equal(tiles.rows, 6);
    assert.ok(Math.abs(tiles.mesh.position.y - 0.302) < 1e-9);
    tiles.mesh.updateMatrixWorld(true);
    assert.ok(new THREE.Raycaster(new THREE.Vector3(2, 5, 0), new THREE.Vector3(0, -1, 0)).intersectObject(tiles.mesh).length);
    assert.equal(new THREE.Raycaster(new THREE.Vector3(4, 5, 0), new THREE.Vector3(0, -1, 0)).intersectObject(tiles.mesh).length, 0);
    assert.equal(box.geometry.type, 'BoxGeometry');
    box.rotation.y = 0.1;
    assert.equal(createTiledBoxTop(THREE, box), null);
    for (const id of ['VOL_02', 'VOL_03', 'VOL_04', 'VOL_05', 'EVT_01']) {
      const env = createEnvironment(id, THREE);
      assert.ok(env.tileFloor, id);
      assert.ok(env.group.getObjectByName('scenario_tile_box_floor'), id);
    }
  });

  it('limita os tiles circulares ao interior seguro e rejeita bordas e abismos', () => {
    for (const id of ['ICA_01', 'ICA_02', 'EVT_02', 'EVT_04']) {
      const env = createEnvironment(id, THREE);
      const tiles = env.tileFloor!;
      assert.ok(env.group.getObjectByName('scenario_tile_round_floor'), id);
      assert.equal(tiles.isValidCell(0, 0), false, id);
      assert.equal(tiles.setTile(0, 0, 'terra'), false, id);
      assert.equal(tiles.setObject(0, 0, 'muro_x'), false, id);
      const bad = { version: 2, scenarioId: id, tileSize: 4, cols: tiles.cols, rows: tiles.rows, floor: { '0,0': 'terra' }, objects: {} };
      assert.equal(validateTileDocument(bad, id, tiles), false, id);
      const centerCol = Math.floor(tiles.cols / 2), centerRow = Math.floor(tiles.rows / 2);
      assert.equal(tiles.isValidCell(centerCol, centerRow), true, id);
      assert.equal(tiles.setTile(centerCol, centerRow, 'pedra'), true, id);
      tiles.mesh.updateMatrixWorld(true);
      const r = tiles.width / 2;
      const outside = new THREE.Raycaster(new THREE.Vector3(r + 1, 15, 0), new THREE.Vector3(0, -1, 0));
      assert.equal(outside.intersectObject(tiles.mesh).length, 0, id);
      const source = env.group.getObjectByName('scenario_tile_round_floor') as THREE.Mesh;
      const params = (source.geometry as any).parameters;
      const innerRadius = r * Math.cos(Math.PI / (params.radialSegments ?? params.segments));
      for (let row = 0; row < tiles.rows; row++) for (let col = 0; col < tiles.cols; col++) {
        if (!tiles.isValidCell(col, row)) continue;
        const x0 = -r + col * 4, y0 = -r + row * 4;
        for (const x of [x0, Math.min(x0 + 4, r)]) for (const y of [y0, Math.min(y0 + 4, r)])
          assert.ok(Math.hypot(x, y) <= innerRadius + 1e-7, id);
      }
    }
    const partial = new THREE.Mesh(new THREE.CircleGeometry(10, 16, 0, Math.PI), new THREE.MeshStandardMaterial());
    partial.rotation.x = -Math.PI / 2;
    assert.equal(createTiledRoundTop(THREE, partial), null);
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
    assert.equal(supported.length, 55);
    assert.deepEqual(unsupported, ['EVT_03']);
  });
});
