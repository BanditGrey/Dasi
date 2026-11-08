#!/usr/bin/env node
/**
 * Exporta o bestiário articulado (puppet de partes rígidas + clips GLTF).
 *
 * Os GLBs estáticos de `tools/export_bestiary_glbs.mjs` continuam intactos:
 * esta etapa gera uma segunda família de arquivos com animação real embutida,
 * gravada em `prototypes/3d_bestiary_animated` e
 * `src/client/dev_viewer/models/bestiary_animated`.
 *
 * Uso: node tools/export_bestiary_animated.mjs ALL | <ID da criatura>
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { BESTIARY_CREATURES, buildBestiaryCreature } from './bestiary_models.mjs';
import { buildAnimatedBestiaryCreature, BESTIARY_ANIMATION_STATES } from '../src/client/dev_viewer/bestiaryRig.js';

const OUTPUT_DIRS = [
  'prototypes/3d_bestiary_animated',
  'src/client/dev_viewer/models/bestiary_animated',
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
  const { root, rig, clips } = buildAnimatedBestiaryCreature(THREE, id, buildBestiaryCreature);
  root.updateMatrixWorld(true);

  const missing = BESTIARY_ANIMATION_STATES.filter((state) => state === 'MOVE'
    ? !clips.some((clip) => clip.name === rig.locomotion)
    : !clips.some((clip) => clip.name === state));
  if (missing.length > 0) throw new Error(`${id}: clips ausentes (${missing.join(', ')})`);

  const result = await new GLTFExporter().parseAsync(root, {
    binary: true,
    onlyVisible: true,
    truncateDrawRange: true,
    animations: clips,
  });
  const bytes = Buffer.from(result);
  if (bytes.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${id}: saída GLB inválida`);

  const filename = `${FILES[id]}.glb`;
  for (const directory of OUTPUT_DIRS) await writeFile(`${directory}/${filename}`, bytes);
  console.log(
    `${id}: ${filename} (${bytes.byteLength.toLocaleString('en-US')} bytes) `
    + `→ ${rig.joints.length} pivôs, ${rig.locomotion}, ${clips.length} clips [${clips.map((clip) => clip.name).join(', ')}]`
  );
}
