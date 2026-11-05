/** Exporta o blockout procedural de um cenário para GLB (sem Blender).
 * Uso: node --experimental-strip-types tools/export_scenario_glb.mjs LOR_01
 * Não exporta luzes ou partículas: elas pertencem ao runtime do visualizador.
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { buildScenario3D } from '../src/client/dev_viewer/dasi3dScenarios.js';
import { SCENARIO_CATALOG } from '../src/server/world/CollisionSystem.ts';

const id = process.argv[2];
if (!SCENARIO_CATALOG.some((scenario) => scenario.id === id)) {
  console.error('Informe um ID canônico, por exemplo: LOR_01');
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

const group = new THREE.Group();
group.name = id;
buildScenario3D(id, THREE, group, [], {});
// O exportador glTF serializa meshes instanciadas via EXT_mesh_gpu_instancing.
// Partículas e luzes devem continuar sendo controladas pelo runtime, não pelo GLB.
for (const child of [...group.children]) {
  if (child.isPoints || child.isLight) group.remove(child);
}
const buffer = await new GLTFExporter().parseAsync(group, { binary: true, onlyVisible: true });
const dir = 'src/client/dev_viewer/models/scenarios';
await mkdir(dir, { recursive: true });
const file = `${dir}/${id.toLowerCase()}.glb`;
await writeFile(file, Buffer.from(buffer));
console.log(`Blockout exportado: ${file}`);
