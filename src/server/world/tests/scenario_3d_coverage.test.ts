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

it('GLB de blockout de Lorencia é carregável e preserva marcos principais', async () => {
  const { readFileSync } = await import('node:fs');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const bytes = readFileSync('src/client/dev_viewer/models/scenarios/lor_01.glb');
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const gltf = await new GLTFLoader().parseAsync(arrayBuffer, '');
  assert.ok(gltf.scene.getObjectByName('lorencia_angel_statue'));
  assert.ok(gltf.scene.getObjectByName('lorencia_tavern_details'));
  const paving = gltf.scene.getObjectByName('lorencia_paving') as THREE.InstancedMesh;
  assert.ok(paving?.isInstancedMesh);
  assert.strictEqual(paving.count, 780);
});


it('Os sete blockouts de Lorencia carregam como GLBs distintos sem luzes ou partículas', async () => {
  const { readFileSync } = await import('node:fs');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  for (let index = 1; index <= 7; index++) {
    const id = `LOR_${String(index).padStart(2, '0')}`;
    const bytes = readFileSync(`src/client/dev_viewer/models/scenarios/${id.toLowerCase()}.glb`);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const gltf = await new GLTFLoader().parseAsync(buffer, '');
    assert.ok(gltf.scene.getObjectByName(id), id);
    let meshes = 0;
    gltf.scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) meshes++;
      assert.ok(!(obj as THREE.Light).isLight && !(obj as THREE.Points).isPoints, id);
    });
    assert.ok(meshes > 0, id);
  }
});


it('Os sete blockouts de Noria carregam com GLTFLoader e o santuário preserva detalhes', async () => {
  const { readFileSync } = await import('node:fs');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  for (let index = 1; index <= 7; index++) {
    const id = `NOR_${String(index).padStart(2, '0')}`;
    const bytes = readFileSync(`src/client/dev_viewer/models/scenarios/${id.toLowerCase()}.glb`);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const gltf = await new GLTFLoader().parseAsync(buffer, '');
    assert.ok(gltf.scene.getObjectByName(id), id);
    let meshes = 0;
    gltf.scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) meshes++;
      assert.ok(!(obj as THREE.Light).isLight && !(obj as THREE.Points).isPoints, id);
    });
    assert.ok(meshes > 0, id);
    if (id === 'NOR_01') {
      assert.ok(gltf.scene.getObjectByName('noria_tree_details'));
      assert.ok(gltf.scene.getObjectByName('noria_pavilion_details'));
      assert.ok(gltf.scene.getObjectByName('noria_fountain_water'));
    }
  }
});

it('Os seis blockouts de Devias carregam e preservam detalhes da cidadela', async () => {
  const { readFileSync } = await import('node:fs');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  for (let index = 1; index <= 6; index++) {
    const id = `DEV_${String(index).padStart(2, '0')}`;
    const bytes = readFileSync(`src/client/dev_viewer/models/scenarios/${id.toLowerCase()}.glb`);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const gltf = await new GLTFLoader().parseAsync(buffer, '');
    assert.ok(gltf.scene.getObjectByName(id), id);
    let meshes = 0;
    gltf.scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) meshes++;
      assert.ok(!(obj as THREE.Light).isLight && !(obj as THREE.Points).isPoints, id);
    });
    assert.ok(meshes > 0, id);
    if (id === 'DEV_01') {
      assert.ok(gltf.scene.getObjectByName('devias_thawed_stone'));
      assert.ok(gltf.scene.getObjectByName('devias_brazier_flame'));
      assert.ok(gltf.scene.getObjectByName('devias_battlements'));
    }
  }
});

it('Todos os 56 blockouts carregam e excluem efeitos controlados pelo runtime', async () => {
  const { readFileSync } = await import('node:fs');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  for (const scenario of CollisionSystem.getAllScenarios()) {
    const bytes = readFileSync(`src/client/dev_viewer/models/scenarios/${scenario.id.toLowerCase()}.glb`);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const gltf = await new GLTFLoader().parseAsync(buffer, '');
    assert.ok(gltf.scene.getObjectByName(scenario.id), scenario.id);
    let meshes = 0;
    gltf.scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) meshes++;
      assert.ok(!(obj as THREE.Light).isLight && !(obj as THREE.Points).isPoints && !obj.userData.runtimeOnly, scenario.id);
    });
    assert.ok(meshes > 0, scenario.id);
  }
});

it('GLBs dedicados das arenas de evento carregam, preservam marcos e mantêm o mapa de aliases', async () => {
  const { readFileSync } = await import('node:fs');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  // @ts-ignore - módulo JS do Dev Viewer
  const { GLTF_BIOME_MAP, resolveScenarioBiome } = await import('../../../client/dev_viewer/dasi3dContent.js');
  const assets = [
    {
      id: 'EVT_02',
      alias: 'DEVIL_SQUARE',
      filename: 'devil_square',
      landmarks: ['devil_square_floor', 'devil_square_pentagram', 'devil_square_skull_totem_north', 'devil_square_triumph_chest', 'devil_square_iron_cage'],
    },
    {
      id: 'EVT_03',
      alias: 'CHAOS_CASTLE',
      filename: 'chaos_castle',
      landmarks: ['chaos_castle_suspended_platform', 'chaos_castle_abyss_rift', 'chaos_castle_force_barrier', 'chaos_castle_ruin_01'],
    },
    {
      id: 'EVT_04',
      alias: 'DUEL_COLISEUM',
      filename: 'duel_coliseum',
      landmarks: ['duel_coliseum_fighting_floor', 'duel_coliseum_seating_tier_01', 'duel_coliseum_scoreboard', 'duel_coliseum_force_dome'],
    },
  ] as const;

  for (const asset of assets) {
    const viewerPath = `src/client/dev_viewer/models/events/${asset.filename}.glb`;
    const prototypePath = `prototypes/3d_scenery/${asset.filename}.glb`;
    const bytes = readFileSync(viewerPath);
    assert.ok(bytes.length > 100_000, `${asset.id}: asset inesperadamente pequeno`);
    assert.strictEqual(bytes.toString('ascii', 0, 4), 'glTF', `${asset.id}: cabeçalho GLB inválido`);
    assert.deepStrictEqual(readFileSync(prototypePath), bytes, `${asset.id}: protótipo e cópia do Viewer divergiram`);
    assert.strictEqual(resolveScenarioBiome(asset.id), asset.id);
    assert.strictEqual(resolveScenarioBiome(asset.alias), asset.alias);
    assert.strictEqual(GLTF_BIOME_MAP[asset.id], `models/events/${asset.filename}.glb`);
    assert.strictEqual(GLTF_BIOME_MAP[asset.alias], `models/events/${asset.filename}.glb`);

    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const gltf = await new GLTFLoader().parseAsync(buffer, '');
    const arena = gltf.scene.getObjectByName(asset.alias);
    assert.ok(arena, `${asset.id}: raiz do cenário ausente`);
    assert.strictEqual(arena.userData.scenarioId, asset.id);
    assert.strictEqual(arena.userData.staticVisualOnly, true);
    assert.strictEqual(arena.userData.collisionsIncluded, false);
    for (const landmark of asset.landmarks) assert.ok(arena.getObjectByName(landmark), `${asset.id}: ${landmark}`);

    let meshCount = 0;
    arena.traverse((object: THREE.Object3D) => {
      assert.ok(!(object as THREE.Light).isLight && !(object as THREE.Points).isPoints, `${asset.id}: efeitos runtime fora do GLB`);
      if ((object as THREE.Mesh).isMesh) meshCount++;
    });
    assert.ok(meshCount >= 150, `${asset.id}: geometria abaixo do mínimo esperado (${meshCount})`);

    if (asset.id === 'EVT_03') {
      let tileCount = 0;
      arena.traverse((object: THREE.Object3D) => {
        if (/^chaos_castle_tile_r\d{2}_c\d{2}$/.test(object.name)) tileCount++;
      });
      assert.strictEqual(tileCount, 36, 'Chaos Castle deve exportar cada uma das 36 lajes separadamente');
    }
    if (asset.id === 'EVT_04') {
      const dome = arena.getObjectByName('duel_coliseum_force_dome') as THREE.Mesh;
      assert.ok(dome.material instanceof THREE.Material && dome.material.transparent);
    }
  }
});

it('Atmosfera de cerco e eventos anima; interiores de Lorencia não recebem chuva', async () => {
  // @ts-ignore - módulo JS usado pelo visualizador
  const { createEnvironment } = await import('../../../client/dev_viewer/dasi3dContent.js');
  for (const id of ['LOR_06', 'LOR_07']) {
    const env = createEnvironment(id, THREE);
    assert.equal((env.animParts as any).rainSystem, undefined, id);
  }
  const colors = new Set<number>();
  for (const id of ['VOL_01', 'EVT_01', 'EVT_02', 'EVT_03', 'EVT_04']) {
    const env = createEnvironment(id, THREE);
    const cloud = (env.animParts as any).siegeSmoke || (env.animParts as any).bloodNebula;
    assert.ok(cloud, id);
    if (id.startsWith('EVT_')) colors.add(cloud.material.color.getHex());
    const before = cloud.geometry.attributes.position.array[1];
    env.updateAnim(1, 0.05);
    const after = cloud.geometry.attributes.position.array[1];
    assert.notStrictEqual(before, after, id);
    env.updateAnim(1, NaN);
    assert.ok(Number.isFinite(cloud.geometry.attributes.position.array[1]), id);
  }
  assert.strictEqual(colors.size, 4, 'Cada arena tem paleta própria');
});

it('Lorencia leste e bosque preservam marcos e atmosfera após exportação', async () => {
  const { readFileSync } = await import('node:fs');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  for (const [id, names] of [
    ['LOR_02', ['lorencia_east_road', 'lorencia_east_gate_details', 'lorencia_east_grass']],
    ['LOR_03', ['lorencia_spider_ruin_details', 'lorencia_spider_web']],
  ] as const) {
    const bytes = readFileSync(`src/client/dev_viewer/models/scenarios/${id.toLowerCase()}.glb`);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const gltf = await new GLTFLoader().parseAsync(buffer, '');
    for (const name of names) assert.ok(gltf.scene.getObjectByName(name), `${id}: ${name}`);
    if (id === 'LOR_02') {
      const grass = gltf.scene.getObjectByName('lorencia_east_grass') as THREE.InstancedMesh;
      assert.ok(grass.isInstancedMesh);
      assert.strictEqual(grass.count, 72);
      assert.strictEqual(grass.userData.nonBlockingDecoration, true);
    }
  }
  // @ts-ignore - módulo do visualizador
  const { createEnvironment } = await import('../../../client/dev_viewer/dasi3dContent.js');
  const forest = createEnvironment('LOR_03', THREE);
  const motes = (forest.animParts as any).forestMotes;
  assert.ok(motes);
  const positions = motes.geometry.attributes.position.array;
  const before = positions[1];
  forest.updateAnim(0.5, 1 / 60);
  assert.notStrictEqual(positions[1], before);
});
