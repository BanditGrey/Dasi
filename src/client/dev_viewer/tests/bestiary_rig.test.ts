/**
 * Validação do rig de puppet de partes rígidas e dos clips GLTF do bestiário.
 *
 * O contrato testado aqui é estrutural: pose de repouso preservada, pivôs em
 * identidade, geometria intacta, clips com loops fechados e máquina de estados
 * determinística. Qualidade artística continua dependendo de revisão visual.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
// @ts-ignore - construtores do bestiário estático são módulos ESM JavaScript.
import { buildBestiaryCreature } from '../../../../tools/bestiary_models.mjs';
// @ts-ignore - módulo ESM JavaScript partilhado com o browser.
import {
  BESTIARY_ANIMATION_STATES,
  BESTIARY_LOCOMOTION_CLIPS,
  BESTIARY_RIG_PROFILES,
  attachBestiaryRig,
  classifyBestiaryNode,
  createBestiaryAnimationClips,
  createBestiaryAnimationController,
  resolveBestiaryRigProfile,
  buildAnimatedBestiaryCreature,
} from '../bestiaryRig.js';

const CREATURES = ['ICE_QUEEN', 'GORGON', 'HYDRA', 'BALROG', 'ZAIKAN', 'KUNDUN'] as const;

function countMeshes(node: THREE.Object3D): number {
  let total = 0;
  node.traverse((child) => { if ((child as THREE.Mesh).isMesh) total += 1; });
  return total;
}

function boundsOf(node: THREE.Object3D) {
  node.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(node);
}

test('classificação por nome separa membros, armas, giros e contêineres', () => {
  assert.equal(classifyBestiaryNode('golden_soldier_armored_skeleton', 'GOLDEN_SOLDIER'), null, 'contêiner não vira braço');
  assert.equal(classifyBestiaryNode('golden_titan_sunblade', 'GOLDEN_TITAN')?.channel, 'weapon');
  assert.equal(classifyBestiaryNode('balrog_upper_arm_left', 'BALROG')?.chainKey, 'arm_left');
  assert.equal(classifyBestiaryNode('balrog_thigh_right', 'BALROG')?.chainKey, 'leg_right');
  assert.equal(classifyBestiaryNode('zaikan_walking_leg_3_upper', 'ZAIKAN')?.chainKey, 'leg_main_3');
  assert.equal(classifyBestiaryNode('golden_dragon_leg_2_lower', 'GOLDEN_DRAGON')?.chainKey, 'leg_main_2');
  assert.equal(classifyBestiaryNode('golden_dragon_wing_finger_1_2', 'GOLDEN_DRAGON')?.channel, 'wing');
  assert.equal(classifyBestiaryNode('hydra_jaw_left', 'HYDRA')?.channel, 'jaw');
  assert.equal(classifyBestiaryNode('kundun_gravitational_halo', 'KUNDUN')?.channel, 'spin');
  assert.equal(classifyBestiaryNode('zaikan_solar_stinger', 'ZAIKAN')?.channel, 'tail');
  assert.equal(classifyBestiaryNode('ice_queen_ice_gown', 'ICE_QUEEN')?.channel, 'extra');
  assert.equal(classifyBestiaryNode('gorgon_scaled_torso', 'GORGON'), null, 'massa corporal fica rígida');
  assert.equal(classifyBestiaryNode('', 'GORGON'), null);
});

test('todo perfil declarado produz um arquétipo com locomocão e morte conhecidas', () => {
  const locomotionNames = ['WALK', 'RUN', 'SCUTTLE', 'SLITHER', 'SWIM', 'FLY', 'FLOAT'];
  const deathStyles = ['topple', 'collapse', 'sink'];
  for (const [id, profile] of Object.entries(BESTIARY_RIG_PROFILES)) {
    assert.ok(locomotionNames.includes(profile.locomotion), `${id}: locomocão ${profile.locomotion}`);
    assert.ok(deathStyles.includes(profile.death), `${id}: morte ${profile.death}`);
    assert.ok(BESTIARY_LOCOMOTION_CLIPS.includes(profile.locomotion), `${id}: fora da lista de clips`);
    assert.ok(profile.intensity > 0, id);
  }
  assert.equal(resolveBestiaryRigProfile('CRIATURA_DESCONHECIDA').locomotion, 'WALK');
  assert.equal(resolveBestiaryRigProfile('  balrog  ').death, 'topple');
});

test('o rig preserva pose, geometria e marcos, criando pivôs em identidade', () => {
  for (const id of CREATURES) {
    const reference = buildBestiaryCreature(id);
    const beforeBox = boundsOf(reference);
    const beforeMeshes = countMeshes(reference);
    const landmarks = [...(reference.userData.landmarks ?? [])] as string[];

    const root = buildBestiaryCreature(id);
    const rig = attachBestiaryRig(THREE, root, id);
    const afterBox = boundsOf(root);

    assert.ok(rig.joints.length > 1, `${id}: nenhum pivô articulado`);
    assert.equal(countMeshes(root), beforeMeshes, `${id}: contagem de malhas mudou`);
    assert.ok(rig.joints[0].channel === 'body' && rig.joints[0].pivotName === `${id.toLowerCase()}_rig_body`, id);

    const drift = Math.max(
      Math.abs(afterBox.min.x - beforeBox.min.x), Math.abs(afterBox.min.y - beforeBox.min.y),
      Math.abs(afterBox.min.z - beforeBox.min.z), Math.abs(afterBox.max.x - beforeBox.max.x),
      Math.abs(afterBox.max.y - beforeBox.max.y), Math.abs(afterBox.max.z - beforeBox.max.z),
    );
    assert.ok(drift < 1e-9, `${id}: pose de repouso deslocada em ${drift}`);
    assert.ok(afterBox.min.y >= -0.01, `${id}: modelo abaixo do solo`);

    for (const landmark of landmarks) assert.ok(root.getObjectByName(landmark), `${id}: marco ${landmark} perdido`);

    const names = new Set<string>();
    for (const joint of rig.joints) {
      assert.ok(joint.pivot, `${id}: pivô ausente`);
      assert.ok(!names.has(joint.pivotName), `${id}: pivô duplicado ${joint.pivotName}`);
      names.add(joint.pivotName);
      assert.deepEqual(joint.pivot.rotation.toArray().slice(0, 3), [0, 0, 0], `${id}: pivô ${joint.pivotName} nasce rotacionado`);
      assert.equal(joint.pivot.userData.jointPivot, true, id);
      assert.ok(Number.isFinite(joint.sideSign) && Math.abs(joint.sideSign) === 1, id);
      assert.ok(root.getObjectByName(joint.pivotName), `${id}: pivô fora da hierarquia`);
    }

    assert.equal(root.userData.rigKind, 'rigid-part-puppet', id);
    assert.equal(root.userData.animationClipsIncluded, true, id);
    assert.equal(root.userData.skeletalRigIncluded, false, `${id}: puppet não usa skin`);
    assert.equal(root.userData.staticVisualOnly, false, id);
    assert.equal(root.userData.collisionsIncluded, false, id);
    assert.equal(root.userData.runtimeEffectsIncluded, false, id);
    assert.equal(root.userData.animationLocomotion, resolveBestiaryRigProfile(id).locomotion, id);
    assert.equal(root.userData.rigJointCount, rig.joints.length, id);

    let skinned = 0;
    root.traverse((child: THREE.Object3D) => {
      assert.ok(!(child as THREE.SkinnedMesh).isSkinnedMesh && !(child as THREE.Bone).isBone, `${id}: rig esquelético inesperado`);
      assert.ok(!(child as THREE.Light).isLight, `${id}: luz embutida`);
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) skinned += 1;
    });
    assert.equal(skinned, 0, id);
  }
});

test('clips cobrem os cinco estados, fecham o loop e miram pivôs existentes', () => {
  for (const id of CREATURES) {
    const root = buildBestiaryCreature(id);
    const rig = attachBestiaryRig(THREE, root, id);
    const clips = createBestiaryAnimationClips(THREE, rig) as THREE.AnimationClip[];
    const profile = resolveBestiaryRigProfile(id);
    const names = clips.map((clip) => clip.name);

    assert.deepEqual(names, ['IDLE', profile.locomotion, 'ATTACK', 'HURT', 'DEATH'], `${id}: conjunto de clips`);
    for (const state of BESTIARY_ANIMATION_STATES) {
      assert.ok(state === 'MOVE' ? names.includes(profile.locomotion) : names.includes(state), `${id}: estado ${state}`);
    }

    for (const clip of clips) {
      assert.ok(clip.duration > 0.4, `${id}/${clip.name}: duração curta`);
      assert.ok(clip.tracks.length > 0, `${id}/${clip.name}: sem tracks`);
      const looping = clip.name === 'IDLE' || clip.name === profile.locomotion;
      for (const track of clip.tracks) {
        const nodeName = track.name.split('.')[0];
        const pivot = root.getObjectByName(nodeName);
        assert.ok(pivot, `${id}/${clip.name}: track aponta para nó inexistente ${nodeName}`);
        assert.equal(pivot.userData.jointPivot, true, `${id}/${clip.name}: ${nodeName} não é pivô`);
        assert.ok(track.times.length >= 2, `${id}/${clip.name}/${track.name}`);
        assert.ok(track.times.every((time) => Number.isFinite(time) && time >= 0 && time <= clip.duration + 1e-6), `${id}/${clip.name}/${track.name}: tempos fora do clip`);
        assert.ok(track.values.every((value) => Number.isFinite(value)), `${id}/${clip.name}/${track.name}: valores não finitos`);
        if (track instanceof THREE.QuaternionKeyframeTrack) {
          assert.equal(track.values.length, track.times.length * 4, `${id}/${clip.name}/${track.name}`);
          for (let index = 0; index < track.values.length; index += 4) {
            const norm = Math.hypot(track.values[index], track.values[index + 1], track.values[index + 2], track.values[index + 3]);
            assert.ok(Math.abs(norm - 1) < 1e-4, `${id}/${clip.name}/${track.name}: quaternião não normalizado`);
          }
        } else {
          assert.equal(track.values.length, track.times.length * 3, `${id}/${clip.name}/${track.name}`);
        }
        if (looping) {
          const stride = track.values.length / track.times.length;
          const first = track.values.slice(0, stride);
          const last = track.values.slice(track.values.length - stride);
          if (track instanceof THREE.QuaternionKeyframeTrack) {
            // Quaterniões têm dupla cobertura: q e -q descrevem a mesma pose.
            // O giro contínuo termina em w negativo, então comparamos a orientação.
            const dot = first.reduce((sum, value, index) => sum + value * last[index], 0);
            assert.ok(Math.abs(Math.abs(dot) - 1) < 1e-6, `${id}/${clip.name}/${track.name}: loop não fecha (dot=${dot})`);
          } else {
            for (let index = 0; index < stride; index++) {
              assert.ok(Math.abs(first[index] - last[index]) < 1e-6, `${id}/${clip.name}/${track.name}: loop não fecha`);
            }
          }
        }
      }
    }

    const death = clips.find((clip) => clip.name === 'DEATH') as THREE.AnimationClip;
    const bodyTrack = death.tracks.find((track) => track.name.startsWith(`${id.toLowerCase()}_rig_body.position`));
    assert.ok(bodyTrack, `${id}: DEATH sem queda do corpo`);
    assert.notDeepEqual(
      Array.from(bodyTrack.values.slice(0, 3)),
      Array.from(bodyTrack.values.slice(-3)),
      `${id}: DEATH deve terminar fora da pose inicial`
    );
  }
});

test('buildAnimatedBestiaryCreature devolve raiz, rig e clips consistentes', () => {
  const { root, rig, clips } = buildAnimatedBestiaryCreature(THREE, 'BALROG', buildBestiaryCreature);
  assert.equal(root.name, 'BESTIARY_BALROG');
  assert.equal(root.animations, clips);
  assert.equal(clips.length, 5);
  assert.deepEqual(root.userData.animationStates, clips.map((clip) => clip.name));
  assert.equal(rig.locomotion, 'WALK');
  assert.throws(() => createBestiaryAnimationClips(THREE, { joints: [] }), /Rig inválido/);
  assert.throws(() => attachBestiaryRig(THREE, null, 'BALROG'), /nó raiz/);
});

test('o controlador alterna estados, retorna de tiros únicos e trava na morte', () => {
  const { root, clips } = buildAnimatedBestiaryCreature(THREE, 'GOLDEN_BUDGE_DRAGON', buildBestiaryCreature);
  const controller = createBestiaryAnimationController(THREE, root, clips, { fadeDuration: 0 });
  assert.ok(controller);
  assert.equal(controller.state, 'IDLE');
  assert.equal(controller.locomotion, 'FLY');
  assert.equal(controller.isDead, false);

  assert.equal(controller.setBaseState('MOVE'), true);
  assert.equal(controller.state, 'MOVE');
  controller.update(0.1);

  assert.equal(controller.trigger('ATTACK'), true);
  assert.equal(controller.state, 'ATTACK');
  const attack = clips.find((clip) => clip.name === 'ATTACK') as THREE.AnimationClip;
  controller.update(attack.duration + 0.2);
  assert.equal(controller.state, 'MOVE', 'tiros únicos voltam ao estado base');

  assert.equal(controller.trigger('HURT'), true);
  const hurt = clips.find((clip) => clip.name === 'HURT') as THREE.AnimationClip;
  controller.update(hurt.duration + 0.2);
  assert.equal(controller.state, 'MOVE');

  assert.equal(controller.setBaseState('IDLE'), true);
  assert.equal(controller.state, 'IDLE');
  assert.equal(controller.trigger('IDLE'), false, 'só ATTACK/HURT são disparos');
  assert.equal(controller.setBaseState('UNKNOWN'), true, 'estado desconhecido recai para IDLE');
  assert.equal(controller.state, 'IDLE');

  assert.equal(controller.die(), true);
  assert.equal(controller.state, 'DEATH');
  assert.equal(controller.isDead, true);
  const death = clips.find((clip) => clip.name === 'DEATH') as THREE.AnimationClip;
  controller.update(death.duration + 0.5);
  assert.equal(controller.state, 'DEATH', 'a morte é terminal');
  assert.equal(controller.die(), false);
  assert.equal(controller.trigger('ATTACK'), false);
  assert.equal(controller.setBaseState('IDLE'), false);

  controller.dispose();
  controller.update(0.1);
  assert.equal(controller.state, 'DEATH');

  assert.equal(createBestiaryAnimationController(THREE, root, []), null);
  assert.equal(createBestiaryAnimationController(THREE, null, clips), null);
});
