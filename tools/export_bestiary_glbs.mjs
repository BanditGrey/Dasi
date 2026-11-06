#!/usr/bin/env node
/**
 * Export the current boss/invasion creature prototypes to static GLB.
 * Usage: node tools/export_bestiary_glbs.mjs ALL | creature ID from BESTIARY_CREATURES
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { BESTIARY_CREATURES, buildBestiaryCreature } from './bestiary_models.mjs';

const OUTPUT_DIRS = [
  'prototypes/3d_bestiary',
  'src/client/dev_viewer/models/bestiary',
];
const FILES = Object.freeze({
  ICE_QUEEN: 'ice_queen',
  GORGON: 'gorgon',
  HYDRA: 'hydra',
  BALROG: 'balrog',
  ZAIKAN: 'zaikan',
  KUNDUN: 'kundun',
  GOLDEN_TITAN: 'golden_titan',
  GOLDEN_BUDGE_DRAGON: 'golden_budge_dragon',
  GOLDEN_SOLDIER: 'golden_soldier',
  GOLDEN_LIZARD_KING: 'golden_lizard_king',
  GOLDEN_TANTALOS: 'golden_tantalos',
  GOLDEN_DRAGON: 'golden_dragon',
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
const request = process.argv[2] ?? 'ALL';
const selected = request.toUpperCase() === 'ALL' ? [...BESTIARY_CREATURES] : [request.toUpperCase()];
const unknown = selected.filter((id) => !Object.hasOwn(FILES, id));
if (unknown.length > 0) {
  console.error(`Seleção inválida: ${unknown.join(', ')}. Use ALL ou um ID de criatura suportado.`);
  process.exit(1);
}

for (const directory of OUTPUT_DIRS) await mkdir(directory, { recursive: true });
for (const id of selected) {
  const scene = buildBestiaryCreature(id);
  scene.updateMatrixWorld(true);
  const result = await new GLTFExporter().parseAsync(scene, {
    binary: true,
    onlyVisible: true,
    truncateDrawRange: true,
  });
  const bytes = Buffer.from(result);
  if (bytes.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${id}: saída GLB inválida`);
  const filename = `${FILES[id]}.glb`;
  for (const directory of OUTPUT_DIRS) await writeFile(`${directory}/${filename}`, bytes);
  console.log(`${id}: ${filename} (${bytes.byteLength.toLocaleString('en-US')} bytes) → ${OUTPUT_DIRS.join(', ')}`);
}
