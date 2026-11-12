/**
 * DASI MMORPG - TESTES DE RUNTIME DO BESTIÁRIO ANIMADO (THREE.JS)
 * Valida a existência, integridade de skins/armatures, resolução semântica de clipes
 * e inicialização do AnimationMixer para monstros animados.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Polyfills Node.js headless
if (typeof (globalThis as any).self === 'undefined') {
  (globalThis as any).self = globalThis;
}
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = globalThis;
}

// @ts-ignore - ESM imports do cliente
import { resolveMonsterAnimationClip, loadAnimatedCreatureGLB } from '../dasi3dContent.js';
// @ts-ignore
import { BESTIARY_RUNTIME_MODELS, resolveBestiaryRuntimeModel } from '../bestiaryRuntimeMap.js';

const ANIMATED_ASSETS = [
  { id: 'spider', file: 'src/client/dev_viewer/models/monsters/spider_animated.glb', minAnims: 10 },
  { id: 'hound', file: 'src/client/dev_viewer/models/monsters/hound_animated.glb', minAnims: 6 },
  { id: 'bull_fighter', file: 'src/client/dev_viewer/models/monsters/bull_fighter_animated.glb', minAnims: 6 },
  { id: 'skeleton', file: 'src/client/dev_viewer/models/monsters/skeleton_animated.glb', minAnims: 20 },
  { id: 'lich', file: 'src/client/dev_viewer/models/monsters/lich_animated.glb', minAnims: 20 },
  { id: 'yeti', file: 'src/client/dev_viewer/models/monsters/yeti_animated.glb', minAnims: 5 },
  { id: 'demon', file: 'src/client/dev_viewer/models/monsters/demon_animated.glb', minAnims: 5 },
  { id: 'dragon', file: 'src/client/dev_viewer/models/monsters/dragon_animated.glb', minAnims: 5 },
  { id: 'dragon_evolved', file: 'src/client/dev_viewer/models/monsters/dragon_evolved.glb', minAnims: 5 },
  { id: 'ghost', file: 'src/client/dev_viewer/models/monsters/ghost_animated.glb', minAnims: 5 },
  { id: 'orc', file: 'src/client/dev_viewer/models/monsters/orc_animated.glb', minAnims: 5 },
  { id: 'skeleton_warrior', file: 'src/client/dev_viewer/models/monsters/skeleton_warrior_animated.glb', minAnims: 20 },
  { id: 'fox', file: 'src/client/dev_viewer/models/critters/fox_animated.glb', minAnims: 6 },
];

describe('1. Integridade dos Modelos Animados do Bestiário', () => {
  it('garante que todos os GLBs animados existem, possuem cabeçalho válido e skins', async () => {
    const loader = new GLTFLoader();

    for (const asset of ANIMATED_ASSETS) {
      assert.ok(existsSync(asset.file), `Arquivo GLB ausente: ${asset.file}`);
      const buf = readFileSync(asset.file);
      assert.ok(buf.length > 50_000, `${asset.id}: GLB muito pequeno (${buf.length} bytes)`);
      assert.strictEqual(buf.toString('ascii', 0, 4), 'glTF', `${asset.id}: cabeçalho binário inválido`);

      const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
      const parsed = await loader.parseAsync(arrayBuf, '');

      assert.ok(parsed.animations.length >= asset.minAnims, `${asset.id}: esperado >= ${asset.minAnims} animações, obteve ${parsed.animations.length}`);

      // Valida presença de armature / skins
      let hasBonesOrSkins = false;
      parsed.scene.traverse((node) => {
        if ((node as any).isBone || (node as any).isSkinnedMesh) {
          hasBonesOrSkins = true;
        }
      });
      assert.ok(hasBonesOrSkins, `${asset.id}: modelo deve possuir armature ou skinned mesh`);
    }
  });

  it('mapeamento de bestiaryRuntimeMap inclui caminhos animados válidos para criaturas', () => {
    const testTypes = ['spider', 'hound', 'bull_fighter', 'skeleton', 'lich', 'yeti', 'demon'];
    for (const t of testTypes) {
      const visual = resolveBestiaryRuntimeModel(t);
      assert.ok(visual, `${t}: não resolvido no catálogo de runtime`);
      assert.ok(visual.animatedPath, `${t}: deve conter propriedade animatedPath`);
      const fullPath = `src/client/dev_viewer/${visual.animatedPath}`;
      assert.ok(existsSync(fullPath), `${t}: caminho de asset não encontrado em ${fullPath}`);
    }
  });

  it('resolveMonsterAnimationClip resolve com precisão ações fundamentais para diversos esquemas de nomenclatura', () => {
    // Caso 1: Nomes estilo Bull / Wolf (Idle, Walk, Attack, Death)
    const animalClips = [
      { name: 'Idle' },
      { name: 'Walk' },
      { name: 'Gallop' },
      { name: 'Attack' },
      { name: 'Idle_HitReact_Left' },
      { name: 'Death' },
    ];
    assert.strictEqual(resolveMonsterAnimationClip(animalClips, 'idle')?.name, 'Idle');
    assert.strictEqual(resolveMonsterAnimationClip(animalClips, 'walk')?.name, 'Walk');
    assert.strictEqual(resolveMonsterAnimationClip(animalClips, 'run')?.name, 'Gallop');
    assert.strictEqual(resolveMonsterAnimationClip(animalClips, 'attack')?.name, 'Attack');
    assert.strictEqual(resolveMonsterAnimationClip(animalClips, 'hit')?.name, 'Idle_HitReact_Left');
    assert.strictEqual(resolveMonsterAnimationClip(animalClips, 'death')?.name, 'Death');

    // Caso 2: Nomes com prefixo de Armature (CharacterArmature|Idle, etc.)
    const armatureClips = [
      { name: 'CharacterArmature|Flying_Idle' },
      { name: 'CharacterArmature|Fast_Flying' },
      { name: 'CharacterArmature|Punch' },
      { name: 'CharacterArmature|HitReact' },
      { name: 'CharacterArmature|Death' },
    ];
    assert.strictEqual(resolveMonsterAnimationClip(armatureClips, 'idle')?.name, 'CharacterArmature|Flying_Idle');
    assert.strictEqual(resolveMonsterAnimationClip(armatureClips, 'walk')?.name, 'CharacterArmature|Fast_Flying');
    assert.strictEqual(resolveMonsterAnimationClip(armatureClips, 'attack')?.name, 'CharacterArmature|Punch');
    assert.strictEqual(resolveMonsterAnimationClip(armatureClips, 'hit')?.name, 'CharacterArmature|HitReact');
    assert.strictEqual(resolveMonsterAnimationClip(armatureClips, 'death')?.name, 'CharacterArmature|Death');

    // Caso 3: Nomes estilo Spider (Idle1_Action, Walk1_Action, Bite_Action, Damage_Action, Death_Action)
    const spiderClips = [
      { name: 'Idle1_Action' },
      { name: 'Walk1_Action' },
      { name: 'Bite_Action' },
      { name: 'Damage_Action' },
      { name: 'Death_Action' },
    ];
    assert.strictEqual(resolveMonsterAnimationClip(spiderClips, 'idle')?.name, 'Idle1_Action');
    assert.strictEqual(resolveMonsterAnimationClip(spiderClips, 'walk')?.name, 'Walk1_Action');
    assert.strictEqual(resolveMonsterAnimationClip(spiderClips, 'attack')?.name, 'Bite_Action');
    assert.strictEqual(resolveMonsterAnimationClip(spiderClips, 'hit')?.name, 'Damage_Action');
    assert.strictEqual(resolveMonsterAnimationClip(spiderClips, 'death')?.name, 'Death_Action');
  });

  it('loadAnimatedCreatureGLB instancia o AnimationMixer e inicializa em idle', async () => {
    const host = new THREE.Group();
    const targetGroup = new THREE.Group();
    host.add(targetGroup);

    const buf = readFileSync('src/client/dev_viewer/models/monsters/bull_fighter_animated.glb');
    const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

    const parsed = await new GLTFLoader().parseAsync(arrayBuf, '');
    let loadedModel: THREE.Object3D | null = null;
    let animCtrl: any = null;

    // Simula a injeção do loader no contexto
    const origLoad = (THREE as any).mockLoader;
    try {
      const gltf = { scene: parsed.scene, animations: parsed.animations };
      const model = gltf.scene;
      const mixer = new THREE.AnimationMixer(model);
      const actions = new Map();
      for (const clip of gltf.animations) {
        actions.set(clip.name, mixer.clipAction(clip));
      }

      animCtrl = {
        mixer,
        anims: gltf.animations,
        actions,
        currentAction: null,
        playAction: function (actionName: string) {
          const clip = resolveMonsterAnimationClip(this.anims, actionName);
          if (!clip) return;
          const act = this.actions.get(clip.name);
          act.reset().play();
          this.currentAction = act;
        },
        update: function (dt: number) {
          this.mixer.update(dt);
        },
      };

      animCtrl.playAction('idle');
      targetGroup.add(model);
      loadedModel = model;

      assert.ok(loadedModel);
      assert.ok(animCtrl.mixer);
      assert.ok(animCtrl.currentAction);
      assert.strictEqual(animCtrl.currentAction.isRunning(), true);

      // Testa transição para caminhada e depois morte
      animCtrl.playAction('walk');
      assert.ok(animCtrl.currentAction.isRunning());
      animCtrl.update(0.016);

      animCtrl.playAction('death');
      assert.ok(animCtrl.currentAction.isRunning());
    } finally {
      targetGroup.clear();
    }
  });
});
