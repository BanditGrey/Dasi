/**
 * Dasi MMORPG - Cobertura 3D dos 56 Cenários Canônicos
 *
 * Garante que TODO cenário registrado no catálogo canônico possui um construtor
 * de geometria no Dev Viewer. Era exatamente esta a lacuna que deixava
 * VOL_02..VOL_05 e EVT_02..EVT_04 registrados na colisão, porém invisíveis no cliente.
 *
 * O construtor é executado de verdade com o Three.js real (sem WebGL/DOM),
 * garantindo que nenhum cenário lance exceção ao ser carregado no navegador.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { CollisionSystem } from '../CollisionSystem.ts';
// @ts-ignore - módulo JS do Dev Viewer (ESM puro, sem dependências de browser)
import { buildScenario3D } from '../../../client/dev_viewer/dasi3dScenarios.js';

describe('4. Cobertura 3D dos 56 Cenários (Dev Viewer)', () => {
  it('Constrói a geometria Procedural PBR de todos os 56 cenários sem lançar exceção', () => {
    const scenarios = CollisionSystem.getAllScenarios();
    assert.strictEqual(scenarios.length, 56);

    const failures: string[] = [];

    for (const scenario of scenarios) {
      const envGroup = new THREE.Group();
      const dynamicLights: THREE.Light[] = [];
      const animParts: Record<string, unknown> = {};

      try {
        const handled = buildScenario3D(scenario.id, THREE, envGroup, dynamicLights, animParts);
        if (!handled) failures.push(`${scenario.id}: construtor retornou falsy`);
        if (envGroup.children.length === 0) failures.push(`${scenario.id}: nenhuma malha gerada`);
      } catch (err: any) {
        failures.push(`${scenario.id}: ${err?.message ?? err}`);
      }
    }

    assert.deepStrictEqual(failures, [], `Cenários sem geometria 3D válida:\n${failures.join('\n')}`);
  });

  it('Os cenários de Castle Siege e Event Arenas geram iluminação dinâmica própria', () => {
    const instanced = CollisionSystem.getAllScenarios().filter((s) => s.instanced);
    assert.strictEqual(instanced.length, 9, 'São 5 cenários de Cerco + 4 Arenas de Evento');

    for (const scenario of instanced) {
      const envGroup = new THREE.Group();
      const dynamicLights: THREE.Light[] = [];
      buildScenario3D(scenario.id, THREE, envGroup, dynamicLights, {});
      assert.ok(
        dynamicLights.length > 0,
        `${scenario.id} deveria registrar pelo menos 1 luz dinâmica para o VFX da arena`
      );
    }
  });
});

it('Lorencia preserva detalhes do concept e não troca cenários por GLB de outro mapa', async () => {
  // A presença de window simula o caminho antes usado apenas no navegador.
  // @ts-ignore - módulo JS do visualizador
  const { createEnvironment } = await import('../../../client/dev_viewer/dasi3dContent.js');
  // @ts-ignore - GLTFLoader fornecido com o visualizador
  const { GLTFLoader } = await import('../../../client/dev_viewer/libs/GLTFLoader.js');
  const originalLoad = GLTFLoader.prototype.load;
  const oldWindow = (globalThis as any).window;
  let loadCount = 0;
  try {
    (globalThis as any).window = {};
    GLTFLoader.prototype.load = () => { loadCount++; };
    const plaza = createEnvironment('LOR_01', THREE);
    assert.ok(plaza.group.getObjectByName('lorencia_paving'));
    assert.ok(plaza.group.getObjectByName('lorencia_angel_statue'));
    assert.ok(plaza.group.getObjectByName('lorencia_tavern_details'));
    assert.ok((plaza.animParts as any).fountainWater);
    assert.strictEqual((plaza.animParts as any).torches.length, 4);
    for (const id of ['LOR_02', 'EVT_02', 'EVT_03', 'EVT_04']) {
      const env = createEnvironment(id, THREE);
      assert.ok(env.group.children.length > 0, id);
    }
    assert.strictEqual(loadCount, 0, 'GLBs genéricos não devem substituir mapas canônicos');
  } finally {
    GLTFLoader.prototype.load = originalLoad;
    if (oldWindow === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = oldWindow;
  }
});
