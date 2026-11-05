/** Exporta o blockout procedural de um cenário para GLB (sem Blender).
 * Uso: node --experimental-strip-types tools/export_scenario_glb.mjs LOR_01
 * Ou exporte todos com ALL; exporte um bioma: node --experimental-strip-types tools/export_scenario_glb.mjs LORENCIA
 * Não exporta luzes ou partículas: elas pertencem ao runtime do visualizador.
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { buildScenario3D } from '../src/client/dev_viewer/dasi3dScenarios.js';
import { SCENARIO_CATALOG } from '../src/server/world/CollisionSystem.ts';

const selection = process.argv[2];
const scenarios = SCENARIO_CATALOG.filter((scenario) => selection === 'ALL' || scenario.id === selection || scenario.biome === selection);
if (scenarios.length === 0) {
  console.error('Informe um ID ou bioma canônico, por exemplo: LOR_01 ou LORENCIA');
  process.exit(1);
}

// GLTFExporter usa FileReader do navegador mesmo para a saída binária.
class NodeFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((value) => { this.result = value; this.onloadend?.(); })
      .catch((error) => this.onerror?.(error));
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(value).toString('base64')}`;
      this.onloadend?.();
    }).catch((error) => this.onerror?.(error));
  }
}
globalThis.FileReader = NodeFileReader;

const dir = 'src/client/dev_viewer/models/scenarios';
await mkdir(dir, { recursive: true });
for (const scenario of scenarios) {
  const group = new THREE.Group();
  group.name = scenario.id;
  buildScenario3D(scenario.id, THREE, group, [], {});
  // Partículas e luzes permanecem sob controle do runtime, inclusive as aninhadas.
  const runtimeOnly = [];
  group.traverse((child) => { if (child.isPoints || child.isLight || child.userData.runtimeOnly) runtimeOnly.push(child); });
  for (const child of runtimeOnly) child.removeFromParent();
  const buffer = await new GLTFExporter().parseAsync(group, { binary: true, onlyVisible: true });
  const file = `${dir}/${scenario.id.toLowerCase()}.glb`;
  await writeFile(file, Buffer.from(buffer));
  console.log(`Blockout exportado: ${file}`);
}
