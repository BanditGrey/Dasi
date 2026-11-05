import { it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
// @ts-ignore - exporter incluído no Dev Viewer
import { GLTFExporter } from '../libs/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SCENARIO_CATALOG } from '../../../server/world/CollisionSystem.ts';
// @ts-ignore - módulo JS do visualizador
import { createEnvironment } from '../dasi3dContent.js';
// @ts-ignore - módulo JS do visualizador
import { buildEditedScenarioSnapshot } from '../exportEditedScenario.js';

it('exporta GLB estático com edições de piso e objetos sem modificar a cena', async () => {
  const env = createEnvironment('LOR_01', THREE);
  const tiles = env.tileFloor as any;
  assert.ok(tiles.setTile(0, 0, 'musgo'));
  assert.ok(tiles.setObject(0, 0, 'muro_x'));
  const source = env.group;
  const sourceCount = source.children.length;
  const snapshot = buildEditedScenarioSnapshot(THREE, source);
  assert.equal(source.children.length, sourceCount);
  assert.ok(source.getObjectByName('scenario_tiled_floor').isInstancedMesh);
  const tile = snapshot.getObjectByName('scenario_tiled_floor_0');
  assert.ok(tile?.isMesh);
  const base = tiles.mesh.material.color;
  const tint = new THREE.Color(0x91aa86);
  assert.ok(Math.abs(tile.material.color.r - base.r * tint.r) < 1e-6);
  assert.ok(snapshot.getObjectByName('scenario_tile_muro_x_0'));
  let excluded = 0;
  snapshot.traverse((o: any) => { if (o.isLight || o.isPoints || o.userData?.runtimeOnly || o.isInstancedMesh) excluded++; });
  assert.equal(excluded, 0);

  const originalFileReader = (globalThis as any).FileReader;
  (globalThis as any).FileReader = class {
    result: any; onloadend?: () => void; onerror?: (err: unknown) => void;
    readAsArrayBuffer(blob: Blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }).catch(this.onerror); }
    readAsDataURL(blob: Blob) { blob.arrayBuffer().then(value => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`; this.onloadend?.(); }).catch(this.onerror); }
  };
  try {
    const glb = await new GLTFExporter().parseAsync(snapshot, { binary: true }) as ArrayBuffer;
    const loaded = await new GLTFLoader().parseAsync(glb, '');
    const loadedTile = loaded.scene.getObjectByName('scenario_tiled_floor_0') as THREE.Mesh;
    assert.ok(loadedTile);
    assert.ok(Math.abs((loadedTile.material as THREE.MeshStandardMaterial).color.r - tile.material.color.r) < 1e-5);
    assert.ok(loaded.scene.getObjectByName('scenario_tile_muro_x_0'));
  } finally {
    if (originalFileReader === undefined) delete (globalThis as any).FileReader;
    else (globalThis as any).FileReader = originalFileReader;
  }
});

it('preserva a posição das lajes e omite instâncias invisíveis no snapshot', () => {
  const env = createEnvironment('EVT_03', THREE);
  const tiles = env.tileFloor as any;
  const slabs = (env.animParts as any).chaosTiles;
  tiles.setTile(0, 0, 'pedra');
  tiles.setObject(0, 0, 'arbusto');
  slabs[0].position.y -= 5;
  slabs[1].visible = false;
  const snapshot = buildEditedScenarioSnapshot(THREE, env.group);
  let floorCount = 0;
  snapshot.traverse((o: any) => { if (o.name === 'scenario_tiled_floor') floorCount++; });
  assert.equal(floorCount, 35);
  assert.ok(snapshot.getObjectByName('scenario_tile_arbusto_0'));
  assert.ok(snapshot.getObjectByName('scenario_tile_pedra_0'));
  const snapSlab = snapshot.getObjectByName('scenario_tile_arbusto_0').parent.parent.parent;
  assert.equal(snapSlab.position.y, slabs[0].position.y);
});

it('produz snapshots editados nos 56 cenários sem incluir instâncias ou efeitos de runtime', () => {
  for (const scenario of SCENARIO_CATALOG) {
    const env = createEnvironment(scenario.id, THREE);
    const controller = env.tileFloor as any;
    assert.ok(controller, scenario.id);
    let col = -1, row = -1;
    outer: for (let r = 0; r < controller.rows; r++) for (let c = 0; c < controller.cols; c++) {
      if (controller.isValidCell(c, r)) { col = c; row = r; break outer; }
    }
    assert.ok(col >= 0, scenario.id);
    assert.ok(controller.setTile(col, row, 'musgo'), scenario.id);
    assert.ok(controller.setObject(col, row, 'muro_x'), scenario.id);
    const original = controller.getEdits();
    const snapshot = buildEditedScenarioSnapshot(THREE, env.group);
    const index = scenario.id === 'EVT_03' ? 0 : row * controller.cols + col;
    const tile = snapshot.getObjectByName(`scenario_tiled_floor_${index}`);
    const wall = snapshot.getObjectByName(`scenario_tile_muro_x_${index}`);
    assert.ok(tile?.isMesh, scenario.id);
    assert.ok(wall?.isMesh, scenario.id);
    let unsupported = 0;
    snapshot.traverse((node: any) => { if (node.isInstancedMesh || node.isLight || node.isPoints || node.userData?.runtimeOnly) unsupported++; });
    assert.equal(unsupported, 0, scenario.id);
    assert.deepEqual(controller.getEdits(), original, scenario.id);
  }
});
