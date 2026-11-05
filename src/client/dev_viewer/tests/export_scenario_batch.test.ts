import { it } from 'node:test';
import assert from 'node:assert/strict';
import { crc32 } from 'node:zlib';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SCENARIO_CATALOG } from '../../../server/world/CollisionSystem.ts';
// @ts-ignore - módulos JS do visualizador
import { GLTFExporter } from '../libs/GLTFExporter.js';
// @ts-ignore
import { createEnvironment } from '../dasi3dContent.js';
// @ts-ignore
import { SCENARIO_BLOCKOUTS } from '../classicConcepts.js';
// @ts-ignore
import { makeTileDocument } from '../tileFloor.js';
// @ts-ignore
import { createStoredZip, exportScenarioBatch } from '../exportScenarioBatch.js';

function readStoredZip(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer), view = new DataView(buffer);
  const files = new Map<string, Uint8Array>();
  const text = new TextDecoder();
  let pos = 0;
  while (view.getUint32(pos, true) === 0x04034b50) {
    assert.equal(view.getUint16(pos + 8, true), 0); // método stored
    const crc = view.getUint32(pos + 14, true), size = view.getUint32(pos + 18, true);
    const nameLength = view.getUint16(pos + 26, true), extraLength = view.getUint16(pos + 28, true);
    const name = text.decode(bytes.subarray(pos + 30, pos + 30 + nameLength));
    const start = pos + 30 + nameLength + extraLength, data = bytes.slice(start, start + size);
    assert.equal(crc32(data), crc, name);
    assert.equal(files.has(name), false);
    files.set(name, data);
    pos = start + size;
  }
  assert.equal(view.getUint32(pos, true), 0x02014b50);
  assert.equal(view.getUint32(buffer.byteLength - 22, true), 0x06054b50);
  assert.equal(view.getUint16(buffer.byteLength - 12, true), files.size);
  return files;
}

it('empacota os 56 GLBs e manifesto, aplica edições capturadas e produz ZIP íntegro', async () => {
  const previous = (globalThis as any).FileReader;
  (globalThis as any).FileReader = class {
    result: any; onloadend?: () => void; onerror?: (err: unknown) => void;
    readAsArrayBuffer(blob: Blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }).catch(this.onerror); }
    readAsDataURL(blob: Blob) { blob.arrayBuffer().then(value => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`; this.onloadend?.(); }).catch(this.onerror); }
  };
  try {
    assert.deepEqual(new Set(SCENARIO_BLOCKOUTS), new Set(SCENARIO_CATALOG.map(s => s.id)));
    const initial = createEnvironment('LOR_01', THREE).tileFloor!;
    assert.ok(initial.setTile(0, 0, 'musgo'));
    assert.ok(initial.setObject(0, 0, 'muro_x'));
    const saved = new Map([['dasi:tiles:v1:LOR_01', JSON.stringify(makeTileDocument('LOR_01', initial))]]);
    const storage = { getItem: (key: string) => saved.get(key) ?? null };
    const progress: any[] = [];
    const zip = await exportScenarioBatch({ THREE, scenarioIds: SCENARIO_BLOCKOUTS, storage, createEnvironment, Exporter: GLTFExporter,
      onProgress: (p: any) => { progress.push(p); if (p.completed === 0) saved.clear(); } });
    const files = readStoredZip(await zip.arrayBuffer());
    assert.equal(files.size, 57);
    assert.equal(progress.at(-1).completed, 56);
    for (const id of SCENARIO_BLOCKOUTS) assert.ok(files.has(`${id.toLowerCase()}-editado.glb`), id);
    const manifest = JSON.parse(new TextDecoder().decode(files.get('manifesto.json')));
    assert.equal(manifest.scenarios.length, 56);
    assert.equal(manifest.scenarios[0].floorEdits, 1);
    assert.equal(manifest.scenarios[0].objectEdits, 1);
    const data = files.get('lor_01-editado.glb')!;
    const gltf = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer, '');
    assert.ok(gltf.scene.getObjectByName('scenario_tile_muro_x_0'));
  } finally {
    if (previous === undefined) delete (globalThis as any).FileReader;
    else (globalThis as any).FileReader = previous;
  }
});

it('rejeita dados locais inválidos e nomes inseguros sem retornar lote parcial', async () => {
  const storage = { getItem: () => '{' };
  await assert.rejects(exportScenarioBatch({ THREE, scenarioIds: ['LOR_01'], storage, createEnvironment, Exporter: GLTFExporter }), /LOR_01.*inválidas/);
  await assert.rejects(exportScenarioBatch({ THREE, scenarioIds: ['LOR_01', 'LOR_01'], storage, createEnvironment, Exporter: GLTFExporter }), /inválida/);
  assert.throws(() => createStoredZip([{ name: '../bad.glb', bytes: new Uint8Array() }]), /inválido/);
  assert.throws(() => createStoredZip([{ name: 'a', bytes: new Uint8Array() }, { name: 'a', bytes: new Uint8Array() }]), /duplicado/);
});

it('migra edições locais v1 no lote e interrompe em erro de exportação', async () => {
  const saved = JSON.stringify({ version: 1, scenarioId: 'LOR_01', edits: { '0,0': 'terra', '1,0': 'muro_y' } });
  const storage = { getItem: () => saved };
  class FakeExporter { async parseAsync() { return new ArrayBuffer(4); } }
  const zip = await exportScenarioBatch({ THREE, scenarioIds: ['LOR_01'], storage, createEnvironment, Exporter: FakeExporter });
  const files = readStoredZip(await zip.arrayBuffer());
  const manifest = JSON.parse(new TextDecoder().decode(files.get('manifesto.json')));
  assert.deepEqual(manifest.scenarios[0], { id: 'LOR_01', file: 'lor_01-editado.glb', floorEdits: 1, objectEdits: 1 });
  class BrokenExporter { async parseAsync() { throw new Error('falha de exportação'); } }
  await assert.rejects(exportScenarioBatch({ THREE, scenarioIds: ['LOR_01'], storage, createEnvironment, Exporter: BrokenExporter }), /falha de exportação/);
  await assert.rejects(exportScenarioBatch({ THREE, scenarioIds: ['LOR_01'], storage: { getItem: () => { throw new Error('bloqueado'); } }, createEnvironment, Exporter: FakeExporter }), /bloqueado/);
});
