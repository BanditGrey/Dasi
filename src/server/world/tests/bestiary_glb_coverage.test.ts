/**
 * Validação dos protótipos GLB estáticos do bestiário. Estes arquivos são
 * referências visuais para o Dev Viewer, não assets finais de jogo.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Polyfills para execução em ambiente Node.js Headless com texturas embutidas
if (typeof (globalThis as any).self === 'undefined') {
  (globalThis as any).self = globalThis;
}
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = globalThis;
}
THREE.ImageLoader.prototype.load = function (url: string, onLoad?: (img: any) => void) {
  const mockImage = { width: 256, height: 256, complete: true, isMock: true };
  if (onLoad) setTimeout(() => onLoad(mockImage), 0);
  return mockImage as any;
};
// @ts-ignore - construtores e mapa do Dev Viewer são módulos ESM JavaScript.
import { BESTIARY_CREATURES, buildBestiaryCreature } from '../../../../tools/bestiary_models.mjs';
// @ts-ignore - módulos ESM JavaScript do Dev Viewer.
import { GLTF_BESTIARY_MAP, loadBestiaryCreatureGLB } from '../../../client/dev_viewer/dasi3dContent.js';
// @ts-ignore - carregador ESM usado pelo Dev Viewer.
import { GLTFLoader as DevViewerGLTFLoader } from '../../../client/dev_viewer/libs/GLTFLoader.js';
// @ts-ignore - mapa de tipos do cliente é JavaScript ESM puro.
import { BESTIARY_RUNTIME_MODELS, resolveBestiaryRuntimeModel } from '../../../client/dev_viewer/bestiaryRuntimeMap.js';
import { MONSTER_DEFINITIONS } from '../../combat/Monster.ts';

const ASSETS = [
  { id: 'ICE_QUEEN', filename: 'ice_queen', minMeshes: 12, landmarks: ['ice_queen_ice_gown', 'ice_queen_face', 'ice_queen_ice_crown', 'ice_queen_frost_scepter'] },
  { id: 'GORGON', filename: 'gorgon', minMeshes: 16, landmarks: ['gorgon_serpentine_coil', 'gorgon_scaled_torso', 'gorgon_serpent_crown', 'gorgon_triple_stinger_tail'] },
  { id: 'HYDRA', filename: 'hydra', minMeshes: 60, landmarks: ['hydra_coiled_body', 'hydra_head_left', 'hydra_head_center', 'hydra_head_right', 'hydra_tail_curve'] },
  { id: 'BALROG', filename: 'balrog', minMeshes: 38, landmarks: ['balrog_obsidian_torso', 'balrog_magma_heart', 'balrog_left_wing', 'balrog_right_wing', 'balrog_hoof_left', 'balrog_hoof_right'] },
  { id: 'ZAIKAN', filename: 'zaikan', minMeshes: 56, landmarks: ['zaikan_scorpion_abdomen', 'zaikan_biomechanical_thorax', 'zaikan_solar_vacuum_core', 'zaikan_scorpion_tail', 'zaikan_solar_stinger'] },
  { id: 'KUNDUN', filename: 'kundun', minMeshes: 65, landmarks: ['kundun_chaos_mantle', 'kundun_chaos_torso', 'kundun_chaos_staff', 'kundun_gravitational_halo', 'kundun_crown_chaos_gem'] },
  { id: 'GOLDEN_TITAN', filename: 'golden_titan', minMeshes: 30, landmarks: ['golden_titan_solar_cuirass', 'golden_titan_solar_helm', 'golden_titan_sunblade', 'golden_titan_halo', 'golden_titan_boot_left', 'golden_titan_boot_right'] },
  { id: 'GOLDEN_BUDGE_DRAGON', filename: 'golden_budge_dragon', minMeshes: 30, landmarks: ['golden_budge_dragon_body', 'golden_budge_dragon_head', 'golden_budge_dragon_wing_left', 'golden_budge_dragon_wing_right', 'golden_budge_dragon_tail'] },
  { id: 'GOLDEN_SOLDIER', filename: 'golden_soldier', minMeshes: 45, landmarks: ['golden_soldier_armored_skeleton', 'golden_soldier_skull', 'golden_soldier_sun_axe', 'golden_soldier_round_shield'] },
  { id: 'GOLDEN_LIZARD_KING', filename: 'golden_lizard_king', minMeshes: 55, landmarks: ['golden_lizard_king_amphibious_body', 'golden_lizard_king_head', 'golden_lizard_king_dorsal_plate_1', 'golden_lizard_king_tail'] },
  { id: 'GOLDEN_TANTALOS', filename: 'golden_tantalos', minMeshes: 50, landmarks: ['golden_tantalos_solar_titan', 'golden_tantalos_solar_cuirass', 'golden_tantalos_solar_maul', 'golden_tantalos_desert_cape'] },
  { id: 'GOLDEN_DRAGON', filename: 'golden_dragon', minMeshes: 78, landmarks: ['golden_dragon_colossal_body', 'golden_dragon_skull', 'golden_dragon_wing_left', 'golden_dragon_wing_right', 'golden_dragon_long_tail', 'golden_dragon_solar_heart'] },
] as const;

async function loadGlb(path: string) {
  const bytes = readFileSync(path);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return { bytes, gltf: await new GLTFLoader().parseAsync(buffer, '') };
}

describe('Protótipos GLB estáticos do bestiário', () => {
  it('mapeia os tipos já existentes no servidor para o GLB correto sem criar spawns especulativos', () => {
    const supportedServerTypes = [
      'ice_queen', 'boss_ice_queen', 'gorgon', 'boss_gorgon', 'hydra',
      'balrog', 'boss_balrog', 'zaikan', 'boss_zaikan', 'boss_kundun',
      'golden_budge_dragon', 'golden_soldier', 'golden_titan', 'golden_tantalos', 'golden_dragon',
    ];
    for (const type of supportedServerTypes) {
      const visual = resolveBestiaryRuntimeModel(type);
      assert.ok(visual?.modelId, `${type}: sem modelo visual mapeado`);
      assert.ok(GLTF_BESTIARY_MAP[visual.modelId as keyof typeof GLTF_BESTIARY_MAP], `${type}: GLB não existe no catálogo`);
    }

    const mappedModelIds = new Set(Object.values(BESTIARY_RUNTIME_MODELS).map((visual: any) => visual.modelId).filter(Boolean));
    assert.deepStrictEqual([...mappedModelIds].sort(), ASSETS.map(({ id }) => id).sort(), 'Todo protótipo precisa ter um mapeamento visual');
    assert.strictEqual(resolveBestiaryRuntimeModel('golden_lizard_king')?.modelId, 'GOLDEN_LIZARD_KING');
    assert.strictEqual(MONSTER_DEFINITIONS.golden_lizard_king, undefined, 'O protótipo não cria stats/spawn de servidor sem especificação');
    assert.strictEqual(resolveBestiaryRuntimeModel('boss_hydra'), null, 'Hydra comum não deve ser promovida silenciosamente a boss de fases');
  });

  it('constrói os doze modelos com metadados estáticos, geometria e marcos nomeados', () => {
    assert.deepStrictEqual(BESTIARY_CREATURES, ASSETS.map(({ id }) => id));
    assert.throws(() => buildBestiaryCreature('UNKNOWN_BOSS'), /Criatura sem GLB procedural/);
    const viewerHtml = readFileSync('src/client/dev_viewer/index.html', 'utf8');
    for (const { id } of ASSETS) assert.ok(viewerHtml.includes(`data-id="${id}"`), `${id}: botão ausente no Dev Viewer`);

    for (const asset of ASSETS) {
      const root = buildBestiaryCreature(asset.id);
      assert.strictEqual(root.name, `BESTIARY_${asset.id}`);
      assert.strictEqual(root.userData.creatureId, asset.id);
      assert.strictEqual(root.userData.staticVisualOnly, true);
      assert.strictEqual(root.userData.collisionsIncluded, false);
      assert.strictEqual(root.userData.skeletalRigIncluded, false);
      assert.strictEqual(root.userData.animationClipsIncluded, false);
      assert.strictEqual(root.userData.runtimeEffectsIncluded, false);

      let meshes = 0;
      root.traverse((object: THREE.Object3D) => {
        if ((object as THREE.Mesh).isMesh) meshes++;
        assert.ok(!(object as THREE.Light).isLight && !(object as THREE.Points).isPoints, asset.id);
      });
      assert.ok(meshes >= 1, `${asset.id}: apenas ${meshes} malhas`);
      for (const landmark of asset.landmarks) assert.ok(root.getObjectByName(landmark), `${asset.id}: ${landmark}`);

      const bounds = new THREE.Box3().setFromObject(root);
      assert.ok(bounds.max.y > 2, `${asset.id}: altura insuficiente`);
      assert.ok(bounds.min.y >= -0.01, `${asset.id}: modelo muito abaixo do plano do solo (${bounds.min.y})`);
    }
  });

  it('carrega os doze GLBs, confere mapa, cópias, metadados e ausência de rig/animação/runtime FX', async () => {
    for (const asset of ASSETS) {
      const viewerPath = `src/client/dev_viewer/models/bestiary/${asset.filename}.glb`;
      const prototypePath = `prototypes/3d_bestiary/${asset.filename}.glb`;
      const { bytes, gltf } = await loadGlb(viewerPath);
      assert.ok(bytes.length > 20_000, `${asset.id}: arquivo muito pequeno`);
      assert.strictEqual(bytes.toString('ascii', 0, 4), 'glTF', `${asset.id}: cabeçalho GLB inválido`);
      assert.deepStrictEqual(readFileSync(prototypePath), bytes, `${asset.id}: cópias divergentes`);
      assert.strictEqual(GLTF_BESTIARY_MAP[asset.id], `models/bestiary/${asset.filename}.glb`);
      assert.strictEqual(gltf.animations.length, 0, `${asset.id}: GLB não deve conter clips`);

      const root = gltf.scene.getObjectByName(`BESTIARY_${asset.id}`);
      assert.ok(root, `${asset.id}: raiz não encontrada`);
      assert.strictEqual(root.userData.creatureId, asset.id);
      assert.strictEqual(root.userData.staticVisualOnly, true);
      assert.strictEqual(root.userData.collisionsIncluded, false);
      assert.strictEqual(root.userData.skeletalRigIncluded, false);
      assert.strictEqual(root.userData.animationClipsIncluded, false);
      assert.strictEqual(root.userData.runtimeEffectsIncluded, false);
      for (const landmark of asset.landmarks) assert.ok(root.getObjectByName(landmark), `${asset.id}: ${landmark}`);

      const bounds = new THREE.Box3().setFromObject(root);
      assert.ok(bounds.max.y > 2, `${asset.id}: altura insuficiente`);
      assert.ok(bounds.min.y >= -0.01, `${asset.id}: modelo abaixo do solo (${bounds.min.y})`);
      let meshes = 0;
      gltf.scene.traverse((object: THREE.Object3D) => {
        assert.ok(!(object as THREE.Light).isLight && !(object as THREE.Points).isPoints, `${asset.id}: GLB deve excluir luzes e partículas`);
        assert.ok(!(object as THREE.SkinnedMesh).isSkinnedMesh && !(object as THREE.Bone).isBone, `${asset.id}: GLB deve excluir rig`);
        if ((object as THREE.Mesh).isMesh) meshes++;
      });
      assert.ok(meshes >= 1, `${asset.id}: apenas ${meshes} malhas exportadas`);
    }
  });

  it('substitui a prévia procedural pelo GLB estático no Dev Viewer e preserva o anel de spawn', () => {
    const originalLoad = DevViewerGLTFLoader.prototype.load;
    const oldWindow = (globalThis as any).window;
    const host = new THREE.Group();
    const targetGroup = new THREE.Group();
    host.add(targetGroup);
    const fallback = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    const spawnRing = new THREE.Mesh(new THREE.RingGeometry(1, 1.2), new THREE.MeshStandardMaterial());
    targetGroup.add(fallback, spawnRing);
    const glbScene = new THREE.Group();
    const prototypeMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    glbScene.add(prototypeMesh);
    let loadedModel: THREE.Object3D | null = null;
    try {
      (globalThis as any).window = {};
      DevViewerGLTFLoader.prototype.load = function (this: any, url: string, onLoad: (gltf: { scene: THREE.Group }) => void) {
        assert.strictEqual(url, GLTF_BESTIARY_MAP.HYDRA);
        onLoad({ scene: glbScene });
        return this;
      } as any;
      loadBestiaryCreatureGLB('HYDRA', targetGroup, THREE, (model: THREE.Object3D) => { loadedModel = model; }, [spawnRing]);
      assert.ok(loadedModel);
      assert.strictEqual((loadedModel as THREE.Object3D).name, 'GLTF_BESTIARY_HYDRA');
      assert.strictEqual(fallback.visible, false);
      assert.strictEqual(spawnRing.visible, true);
      assert.ok(targetGroup.children.includes(loadedModel as THREE.Object3D));
      assert.strictEqual(prototypeMesh.castShadow, true);
      assert.strictEqual(prototypeMesh.receiveShadow, true);
    } finally {
      DevViewerGLTFLoader.prototype.load = originalLoad;
      if (oldWindow === undefined) delete (globalThis as any).window;
      else (globalThis as any).window = oldWindow;
    }
  });
});
