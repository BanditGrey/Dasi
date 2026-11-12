/** Exporta modelos e módulos modulares oficiais canônicos.
 * node tools/export_modular_heroes.mjs ALL | DK | DW | ELF | MG | DL [--canonical]
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { HERO_CLASSES, ARMOR_SLOTS, ARMOR_VARIANTS, CLASS_WEAPONS, createModularHero, createArmorModule, createWeaponModule } from '../src/client/dev_viewer/modularHero.js';

// Suporte para compilação oficial canônica completa via Blender 5.2 LTS
const BLENDER_PATH = 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe';
if (process.argv.includes('--canonical') || process.argv.includes('--blender')) {
  if (existsSync(BLENDER_PATH)) {
    console.log('[Canonical Asset Pipeline] Delegando compilação canônica em lote para Blender 5.2 LTS...');
    const res = spawnSync(BLENDER_PATH, ['-b', '--python', 'tools/build_canonical_glbs.py'], { stdio: 'inherit' });
    process.exit(res.status ?? 0);
  } else {
    console.warn('[Canonical Asset Pipeline] Blender 5.2 não encontrado em:', BLENDER_PATH);
  }
}

const selection = process.argv[2];
const ids = selection === 'ALL' ? Object.keys(HERO_CLASSES) : Object.hasOwn(HERO_CLASSES, selection ?? '') ? [selection] : [];
if (!ids.length) { console.error('Informe ALL, DK, DW, ELF, MG ou DL.'); process.exit(1); }
class NodeFileReader {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }).catch(error => this.onerror?.(error)); }
  readAsDataURL(blob) { blob.arrayBuffer().then(value => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`; this.onloadend?.(); }).catch(error => this.onerror?.(error)); }
}
globalThis.FileReader = NodeFileReader;
const dir = 'src/client/dev_viewer/models/modular_heroes';
await mkdir(dir, { recursive: true });
async function writeGlb(name, object) {
  const result = await new GLTFExporter().parseAsync(object, { binary: true });
  await writeFile(`${dir}/${name}.glb`, Buffer.from(result));
}
for (const id of ids) {
  const lower = id.toLowerCase();
  await writeGlb(`hero_${lower}_modular`, createModularHero(THREE, id).group);
  for (const slot of ARMOR_SLOTS) for (const variant of ARMOR_VARIANTS) {
    await writeGlb(`${lower}_${slot}_${variant}`, createArmorModule(THREE, id, slot, variant));
  }
  for (const weaponId of CLASS_WEAPONS[id]) {
    await writeGlb(`${lower}_weapon_${weaponId.toLowerCase()}`, createWeaponModule(THREE, id, weaponId));
  }
  console.log(`${id}: herói, ${ARMOR_SLOTS.length * ARMOR_VARIANTS.length} armaduras e ${CLASS_WEAPONS[id].length} armas exportados`);
}
