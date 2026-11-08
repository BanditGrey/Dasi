/**
 * Validação dos GLBs articulados do bestiário (puppet de partes rígidas).
 *
 * Estes arquivos reutilizam a geometria dos protótipos estáticos e acrescentam
 * pivôs + cinco clips GLTF. O contrato testado: geometria idêntica ao estático,
 * pose de repouso preservada, ausência de skin/ossos (a técnica é rígida),
 * clips que apontam para pivôs existentes e metadados honestos sobre o que o
 * arquivo contém. Colisões, IA, atributos e VFX continuam no runtime.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// @ts-ignore - ferramenta de inventário estrutural GLB é ESM JavaScript.
import { inspectHeroGlb } from '../../../../tools/audit_hero_glb.mjs';
// @ts-ignore - módulos ESM JavaScript do Dev Viewer.
import {
  GLTF_BESTIARY_MAP,
  GLTF_BESTIARY_ANIMATED_MAP,
  loadBestiaryCreatureAnimatedGLB,
} from '../../../client/dev_viewer/dasi3dContent.js';
// @ts-ignore - carregador ESM usado pelo Dev Viewer.
import { GLTFLoader as DevViewerGLTFLoader } from '../../../client/dev_viewer/libs/GLTFLoader.js';
// @ts-ignore - perfis e controlador do rig são ESM JavaScript.
import { BESTIARY_RIG_PROFILES, createBestiaryAnimationController } from '../../../client/dev_viewer/bestiaryRig.js';

const ASSETS = [
  { id: 'ICE_QUEEN', filename: 'ice_queen', locomotion: 'WALK', landmarks: ['ice_queen_ice_gown', 'ice_queen_face', 'ice_queen_ice_crown', 'ice_queen_frost_scepter'] },
  { id: 'GORGON', filename: 'gorgon', locomotion: 'SLITHER', landmarks: ['gorgon_serpentine_coil', 'gorgon_scaled_torso', 'gorgon_serpent_crown', 'gorgon_triple_stinger_tail'] },
  { id: 'HYDRA', filename: 'hydra', locomotion: 'SWIM', landmarks: ['hydra_coiled_body', 'hydra_head_left', 'hydra_head_center', 'hydra_head_right'] },
  { id: 'BALROG', filename: 'balrog', locomotion: 'WALK', landmarks: ['balrog_obsidian_torso', 'balrog_magma_heart', 'balrog_left_wing', 'balrog_right_wing'] },
  { id: 'ZAIKAN', filename: 'zaikan', locomotion: 'SCUTTLE', landmarks: ['zaikan_scorpion_abdomen', 'zaikan_biomechanical_thorax', 'zaikan_scorpion_tail', 'zaikan_solar_stinger'] },
  { id: 'KUNDUN', filename: 'kundun', locomotion: 'FLOAT', landmarks: ['kundun_chaos_mantle', 'kundun_chaos_torso', 'kundun_chaos_staff', 'kundun_gravitational_halo'] },
  { id: 'GOLDEN_TITAN', filename: 'golden_titan', locomotion: 'WALK', landmarks: ['golden_titan_solar_cuirass', 'golden_titan_solar_helm', 'golden_titan_sunblade', 'golden_titan_halo'] },
  { id: 'GOLDEN_BUDGE_DRAGON', filename: 'golden_budge_dragon', locomotion: 'FLY', landmarks: ['golden_budge_dragon_body', 'golden_budge_dragon_head', 'golden_budge_dragon_wing_left', 'golden_budge_dragon_tail'] },
  { id: 'GOLDEN_SOLDIER', filename: 'golden_soldier', locomotion: 'WALK', landmarks: ['golden_soldier_armored_skeleton', 'golden_soldier_skull', 'golden_soldier_sun_axe', 'golden_soldier_round_shield'] },
  { id: 'GOLDEN_LIZARD_KING', filename: 'golden_lizard_king', locomotion: 'WALK', landmarks: ['golden_lizard_king_amphibious_body', 'golden_lizard_king_head', 'golden_lizard_king_dorsal_plate_1', 'golden_lizard_king_tail'] },
  { id: 'GOLDEN_TANTALOS', filename: 'golden_tantalos', locomotion: 'WALK', landmarks: ['golden_tantalos_solar_titan', 'golden_tantalos_solar_cuirass', 'golden_tantalos_solar_maul', 'golden_tantalos_desert_cape'] },
  { id: 'GOLDEN_DRAGON', filename: 'golden_dragon', locomotion: 'FLY', landmarks: ['golden_dragon_colossal_body', 'golden_dragon_skull', 'golden_dragon_wing_left', 'golden_dragon_long_tail'] },
] as const;

const EXPECTED_CLIPS = (locomotion: string) => ['IDLE', locomotion, 'ATTACK', 'HURT', 'DEATH'];

async function loadGlb(path: string) {
  const bytes = readFileSync(path);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return { bytes, gltf: await new GLTFLoader().parseAsync(buffer, '') };
}

describe('GLBs articulados do bestiário', () => {
  it('cataloga as doze criaturas com caminho existente e perfil coerente', () => {
    assert.deepStrictEqual(Object.keys(GLTF_BESTIARY_ANIMATED_MAP).sort(), ASSETS.map(({ id }) => id).sort());
    assert.deepStrictEqual(Object.keys(GLTF_BESTIARY_ANIMATED_MAP).sort(), Object.keys(GLTF_BESTIARY_MAP).sort(), 'o catálogo articulado cobre o mesmo conjunto do estático');

    for (const asset of ASSETS) {
      assert.strictEqual(GLTF_BESTIARY_ANIMATED_MAP[asset.id], `models/bestiary_animated/${asset.filename}.glb`);
      assert.ok(existsSync(`src/client/dev_viewer/${GLTF_BESTIARY_ANIMATED_MAP[asset.id]}`), `${asset.id}: arquivo ausente no Dev Viewer`);
      assert.ok(existsSync(`prototypes/3d_bestiary_animated/${asset.filename}.glb`), `${asset.id}: cópia ausente em prototypes`);
      assert.strictEqual(BESTIARY_RIG_PROFILES[asset.id].locomotion, asset.locomotion, `${asset.id}: perfil diverge do clip esperado`);
    }
  });

  it('preserva a geometria do protótipo estático e acrescenta pivôs sem skin', async () => {
    for (const asset of ASSETS) {
      const animatedPath = `src/client/dev_viewer/models/bestiary_animated/${asset.filename}.glb`;
      const staticPath = `src/client/dev_viewer/models/bestiary/${asset.filename}.glb`;
      const animated = inspectHeroGlb(readFileSync(animatedPath));
      const staticInfo = inspectHeroGlb(readFileSync(staticPath));

      assert.strictEqual(animated.triangles, staticInfo.triangles, `${asset.id}: contagem de triângulos mudou`);
      assert.strictEqual(animated.materials, staticInfo.materials, `${asset.id}: materiais mudaram`);
      assert.strictEqual(animated.skins, 0, `${asset.id}: puppet rígido não deve declarar skin`);
      assert.deepStrictEqual(readFileSync(`prototypes/3d_bestiary_animated/${asset.filename}.glb`), readFileSync(animatedPath), `${asset.id}: cópias divergentes`);

      const { gltf } = await loadGlb(animatedPath);
      const staticScene = (await loadGlb(staticPath)).gltf.scene;
      const root = gltf.scene.getObjectByName(`BESTIARY_${asset.id}`);
      assert.ok(root, `${asset.id}: raiz ausente`);

      let meshes = 0;
      let pivots = 0;
      gltf.scene.traverse((object: THREE.Object3D) => {
        if ((object as THREE.Mesh).isMesh) meshes += 1;
        if ((object as any).userData?.jointPivot) pivots += 1;
        assert.ok(!(object as THREE.SkinnedMesh).isSkinnedMesh && !(object as THREE.Bone).isBone, `${asset.id}: rig esquelético inesperado`);
        assert.ok(!(object as THREE.Light).isLight && !(object as THREE.Points).isPoints, `${asset.id}: luzes/partículas não pertencem ao GLB`);
      });
      // Compara travessia com travessia: o array glTF `meshes` pode ser menor
      // quando uma mesma malha é instanciada por mais de um nó.
      let staticMeshes = 0;
      staticScene.traverse((object: THREE.Object3D) => { if ((object as THREE.Mesh).isMesh) staticMeshes += 1; });
      assert.strictEqual(meshes, staticMeshes, `${asset.id}: contagem de malhas mudou`);
      assert.ok(pivots >= 2, `${asset.id}: apenas ${pivots} pivôs`);
      assert.strictEqual(pivots, root.userData.rigJointCount, `${asset.id}: rigJointCount divergente`);

      for (const landmark of asset.landmarks) assert.ok(root.getObjectByName(landmark), `${asset.id}: marco ${landmark} perdido`);
    }
  });

  it('mantém a pose de repouso idêntica ao protótipo estático e acima do solo', async () => {
    for (const asset of ASSETS) {
      const animated = await loadGlb(`src/client/dev_viewer/models/bestiary_animated/${asset.filename}.glb`);
      const staticGlb = await loadGlb(`src/client/dev_viewer/models/bestiary/${asset.filename}.glb`);
      const boxAnimated = new THREE.Box3().setFromObject(animated.gltf.scene);
      const boxStatic = new THREE.Box3().setFromObject(staticGlb.gltf.scene);
      const drift = Math.max(
        Math.abs(boxAnimated.min.x - boxStatic.min.x), Math.abs(boxAnimated.min.y - boxStatic.min.y),
        Math.abs(boxAnimated.min.z - boxStatic.min.z), Math.abs(boxAnimated.max.x - boxStatic.max.x),
        Math.abs(boxAnimated.max.y - boxStatic.max.y), Math.abs(boxAnimated.max.z - boxStatic.max.z),
      );
      assert.ok(drift < 1e-6, `${asset.id}: pose de repouso deslocada em ${drift}`);
      assert.ok(boxAnimated.min.y >= -0.01, `${asset.id}: modelo abaixo do plano do solo (${boxAnimated.min.y})`);
      assert.ok(boxAnimated.max.y > 2, `${asset.id}: altura insuficiente`);
    }
  });

  it('exporta cinco clips por criatura mirando pivôs existentes', async () => {
    for (const asset of ASSETS) {
      const { gltf } = await loadGlb(`src/client/dev_viewer/models/bestiary_animated/${asset.filename}.glb`);
      const root = gltf.scene.getObjectByName(`BESTIARY_${asset.id}`) as THREE.Object3D & { userData: Record<string, any> };
      const clipNames = gltf.animations.map((clip: THREE.AnimationClip) => clip.name);
      assert.deepStrictEqual(clipNames, EXPECTED_CLIPS(asset.locomotion), `${asset.id}: conjunto de clips`);

      assert.strictEqual(root.userData.assetKind, 'bestiary-creature-animated');
      assert.strictEqual(root.userData.rigKind, 'rigid-part-puppet');
      assert.strictEqual(root.userData.animationClipsIncluded, true);
      assert.strictEqual(root.userData.skeletalRigIncluded, false);
      assert.strictEqual(root.userData.staticVisualOnly, false);
      assert.strictEqual(root.userData.collisionsIncluded, false);
      assert.strictEqual(root.userData.runtimeEffectsIncluded, false);
      assert.strictEqual(root.userData.animationLocomotion, asset.locomotion);
      assert.deepStrictEqual(root.userData.animationStates, EXPECTED_CLIPS(asset.locomotion));

      for (const clip of gltf.animations) {
        assert.ok(clip.tracks.length > 0, `${asset.id}/${clip.name}: sem tracks`);
        assert.ok(clip.duration > 0.4, `${asset.id}/${clip.name}: duração insuficiente`);
        for (const track of clip.tracks) {
          const nodeName = track.name.split('.')[0];
          const pivot = root.getObjectByName(nodeName);
          assert.ok(pivot, `${asset.id}/${clip.name}: track aponta para ${nodeName}, que não existe`);
          assert.strictEqual((pivot as any).userData?.jointPivot, true, `${asset.id}/${clip.name}: ${nodeName} não é pivô`);
          assert.ok(track.values.every((value: number) => Number.isFinite(value)), `${asset.id}/${clip.name}/${track.name}: valores não finitos`);
        }
      }
    }
  });

  it('não altera os protótipos estáticos, que continuam sem clips', async () => {
    for (const asset of ASSETS) {
      const { gltf } = await loadGlb(`src/client/dev_viewer/models/bestiary/${asset.filename}.glb`);
      assert.strictEqual(gltf.animations.length, 0, `${asset.id}: GLB estático passou a conter clips`);
      const root = gltf.scene.getObjectByName(`BESTIARY_${asset.id}`) as THREE.Object3D & { userData: Record<string, any> };
      assert.strictEqual(root.userData.staticVisualOnly, true);
      assert.strictEqual(root.userData.animationClipsIncluded, false);
    }
  });

  it('carrega o GLB articulado no Dev Viewer com controlador de estados e recorre ao estático quando falta arquivo', () => {
    const originalLoad = DevViewerGLTFLoader.prototype.load;
    const oldWindow = (globalThis as any).window;
    const viewerHtml = readFileSync('src/client/dev_viewer/index.html', 'utf8');
    for (const state of ['IDLE', 'MOVE', 'ATTACK', 'HURT', 'DEATH']) {
      assert.ok(viewerHtml.includes(`data-bestiary-anim="${state}"`), `botão de clip ${state} ausente no Dev Viewer`);
    }

    try {
      (globalThis as any).window = {};
      const host = new THREE.Group();
      const targetGroup = new THREE.Group();
      host.add(targetGroup);
      const fallback = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
      const spawnRing = new THREE.Mesh(new THREE.RingGeometry(1, 1.2), new THREE.MeshStandardMaterial());
      targetGroup.add(fallback, spawnRing);

      const requested: string[] = [];
      const animatedGltf = { scene: new THREE.Group(), animations: [] as THREE.AnimationClip[] };
      const staticGltf = { scene: new THREE.Group(), animations: [] as THREE.AnimationClip[] };

      // Caso 1: arquivo articulado presente → controlador anexado ao modelo.
      DevViewerGLTFLoader.prototype.load = function (this: any, url: string, onLoad: (gltf: any) => void) {
        requested.push(url);
        onLoad(url.includes('bestiary_animated') ? animatedGltf : staticGltf);
        return this;
      } as any;

      let loaded: any = null;
      let controller: any = 'unset';
      loadBestiaryCreatureAnimatedGLB('HYDRA', targetGroup, THREE, (model: any, anim: any) => {
        loaded = model;
        controller = anim;
      }, [spawnRing]);

      // Copia antes de comparar: `deepStrictEqual` do Node é `asserts actual is T`
      // e estreitaria `requested` para o tipo literal do caminho.
      assert.deepStrictEqual([...requested], [GLTF_BESTIARY_ANIMATED_MAP.HYDRA]);
      assert.ok(loaded, 'modelo não carregado');
      assert.strictEqual(loaded.name, 'GLTF_BESTIARY_ANIMATED_HYDRA');
      assert.strictEqual(controller, null, 'sem clips, o controlador deve ser null e não quebrar');
      assert.strictEqual(loaded.userData.animController, null);
      assert.strictEqual(fallback.visible, false, 'prévia procedural deve ser ocultada');
      assert.strictEqual(spawnRing.visible, true, 'anel de spawn preservado');
      assert.ok(targetGroup.children.includes(loaded));

      // Caso 2: arquivo articulado ausente → recai para o protótipo estático.
      requested.length = 0;
      const fallbackGroup = new THREE.Group();
      host.add(fallbackGroup);
      fallbackGroup.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
      DevViewerGLTFLoader.prototype.load = function (this: any, url: string, onLoad: (gltf: any) => void, _onProgress: any, onError: (err: Error) => void) {
        requested.push(url);
        if (url.includes('bestiary_animated')) onError(new Error('404'));
        else onLoad(staticGltf);
        return this;
      } as any;
      let fallbackModel: any = null;
      loadBestiaryCreatureAnimatedGLB('BALROG', fallbackGroup, THREE, (model: any) => { fallbackModel = model; }, []);
      assert.deepStrictEqual([...requested], [GLTF_BESTIARY_ANIMATED_MAP.BALROG, GLTF_BESTIARY_MAP.BALROG]);
      assert.strictEqual(fallbackModel.name, 'GLTF_BESTIARY_BALROG');
    } finally {
      DevViewerGLTFLoader.prototype.load = originalLoad;
      if (oldWindow === undefined) delete (globalThis as any).window;
      else (globalThis as any).window = oldWindow;
    }
  });

  it('reproduz os clips reais do GLB com AnimationMixer sem mover a pose de repouso antes do primeiro update', async () => {
    const { gltf } = await loadGlb('src/client/dev_viewer/models/bestiary_animated/balrog.glb');
    const restBox = new THREE.Box3().setFromObject(gltf.scene);
    const controller = createBestiaryAnimationController(THREE, gltf.scene, gltf.animations, { fadeDuration: 0 });
    assert.ok(controller);
    assert.strictEqual(controller.state, 'IDLE');
    assert.strictEqual(controller.locomotion, 'WALK');

    controller.update(0.25);
    assert.strictEqual(controller.state, 'IDLE');
    controller.setBaseState('MOVE');
    controller.update(0.4);
    assert.strictEqual(controller.state, 'MOVE');
    controller.trigger('ATTACK');
    assert.strictEqual(controller.state, 'ATTACK');
    controller.update(1.6);
    assert.strictEqual(controller.state, 'MOVE', 'ATTACK retorna à locomocão');
    controller.die();
    controller.update(2.4);
    assert.strictEqual(controller.state, 'DEATH');
    assert.ok(controller.isDead);
    controller.dispose();

    // O arquivo em si continua com a pose de repouso: animação é reprodução, não edição.
    const { gltf: reloaded } = await loadGlb('src/client/dev_viewer/models/bestiary_animated/balrog.glb');
    const reloadedBox = new THREE.Box3().setFromObject(reloaded.scene);
    assert.ok(reloadedBox.equals(restBox) || reloadedBox.min.distanceTo(restBox.min) < 1e-6, 'pose do arquivo mudou');
  });
});
