#!/usr/bin/env node
/**
 * Build the dedicated static GLBs for Devil Square, Chaos Castle and the Duel
 * Colosseum. The prototype copy is the source artifact; the viewer copy is kept
 * byte-for-byte in sync for direct delivery by the Dev Viewer static server.
 *
 * Usage:
 *   node tools/export_event_arenas.mjs ALL
 *   node tools/export_event_arenas.mjs EVT_02
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { EVENT_ARENA_BUILDERS } from './event_arena_models.mjs';

const OUTPUT_DIRS = [
  'prototypes/3d_scenery',
  'src/client/dev_viewer/models/events',
];
const ASSET_NAMES = Object.freeze({
  EVT_02: 'devil_square',
  EVT_03: 'chaos_castle',
  EVT_04: 'duel_coliseum',
});
const ALIASES = Object.freeze({
  DEVIL_SQUARE: 'EVT_02',
  DEVIL_SQUARE_PENTAGRAM: 'EVT_02',
  CHAOS_CASTLE: 'EVT_03',
  CHAOS_CASTLE_SUSPENDED_COLISEUM: 'EVT_03',
  DUEL_COLISEUM: 'EVT_04',
  DUEL_COLISEUM_GLORY: 'EVT_04',
});

class NodeFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer()
      .then((value) => { this.result = value; this.onloadend?.(); })
      .catch((error) => this.onerror?.(error));
  }

  readAsDataURL(blob) {
    blob.arrayBuffer()
      .then((value) => {
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(value).toString('base64')}`;
        this.onloadend?.();
      })
      .catch((error) => this.onerror?.(error));
  }
}

globalThis.FileReader = NodeFileReader;

function canonicalize(value) {
  const key = String(value ?? '').trim().toUpperCase();
  return ALIASES[key] ?? key;
}

const request = process.argv[2] ?? 'ALL';
const selected = request.toUpperCase() === 'ALL'
  ? Object.keys(EVENT_ARENA_BUILDERS)
  : [canonicalize(request)];
const unknown = selected.filter((id) => !Object.hasOwn(EVENT_ARENA_BUILDERS, id));
if (unknown.length > 0) {
  console.error(`Seleção inválida: ${unknown.join(', ')}. Use ALL, EVT_02, EVT_03 ou EVT_04.`);
  process.exit(1);
}

for (const directory of OUTPUT_DIRS) await mkdir(directory, { recursive: true });

for (const id of selected) {
  const scene = EVENT_ARENA_BUILDERS[id]();
  scene.updateMatrixWorld(true);
  const result = await new GLTFExporter().parseAsync(scene, {
    binary: true,
    onlyVisible: true,
    truncateDrawRange: true,
  });
  const bytes = Buffer.from(result);
  if (bytes.toString('ascii', 0, 4) !== 'glTF') {
    throw new Error(`${id}: o exportador não produziu um cabeçalho GLB válido`);
  }
  const filename = `${ASSET_NAMES[id]}.glb`;
  for (const directory of OUTPUT_DIRS) {
    await writeFile(`${directory}/${filename}`, bytes);
  }
  console.log(`${id}: ${filename} (${bytes.byteLength.toLocaleString('en-US')} bytes) → ${OUTPUT_DIRS.join(', ')}`);
}
