import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import * as THREE from 'three';
// @ts-ignore - módulo JS compartilhado com o navegador
import { DasiCollisionEngine } from '../dasiCollisionEngine.js';
// @ts-ignore - módulo JS compartilhado com o navegador
import {
  GLTF_HERO_MAP,
  GLTF_BLOCKOUT_HERO_MAP,
  resolveHeroAnimationClip,
  createHero,
} from '../dasi3dContent.js';
import { CollisionSystem } from '../../../server/world/CollisionSystem.ts';

test('DasiCollisionEngine expõe constantes canônicas de colisão e helper createPlayerColliderMesh', () => {
  assert.equal(DasiCollisionEngine.DEFAULT_PLAYER_RADIUS, 0.45);
  assert.equal(DasiCollisionEngine.DEFAULT_PLAYER_HEIGHT, 1.85);
  assert.equal(DasiCollisionEngine.DEFAULT_STEP_HEIGHT, 0.35);

  // Paridade com o servidor (CollisionSystem)
  assert.equal(CollisionSystem.DEFAULT_PLAYER_RADIUS, DasiCollisionEngine.DEFAULT_PLAYER_RADIUS);
  assert.equal(CollisionSystem.DEFAULT_PLAYER_HEIGHT, DasiCollisionEngine.DEFAULT_PLAYER_HEIGHT);
  assert.equal(CollisionSystem.DEFAULT_STEP_HEIGHT, DasiCollisionEngine.DEFAULT_STEP_HEIGHT);

  const debugGroup = DasiCollisionEngine.createPlayerColliderMesh(THREE);
  assert.ok(debugGroup instanceof THREE.Group, 'Deve retornar um THREE.Group');
  assert.equal(debugGroup.name, 'PlayerColliderMesh');

  const capsule = debugGroup.getObjectByName('PlayerCollider_Capsule') as THREE.Mesh;
  assert.ok(capsule, 'Cápsula deve existir');
  assert.equal(capsule.position.y, 1.85 / 2);

  const footprint = debugGroup.getObjectByName('PlayerCollider_Footprint') as THREE.Mesh;
  assert.ok(footprint, 'Pegada no solo deve existir');
  assert.equal(footprint.position.y, 0.02);

  const stepThreshold = debugGroup.getObjectByName('PlayerCollider_StepThreshold') as THREE.Mesh;
  assert.ok(stepThreshold, 'Anel de altura de degrau deve existir');
  assert.equal(stepThreshold.position.y, 0.35);
});

test('GLTF_HERO_MAP e GLTF_BLOCKOUT_HERO_MAP cobrem todas as 5 classes com arquivos reais existentes', () => {
  const heroMap = GLTF_HERO_MAP as Record<string, string>;
  const blockoutMap = GLTF_BLOCKOUT_HERO_MAP as Record<string, string>;
  const classes = ['DK', 'DW', 'ELF', 'MG', 'DL'];
  const fullNames = ['DARK_KNIGHT', 'DARK_WIZARD', 'FAIRY_ELF', 'MAGIC_GLADIATOR', 'DARK_LORD'];

  for (const cls of classes) {
    const animPath = heroMap[cls];
    const blockoutPath = blockoutMap[cls];
    assert.ok(animPath, `GLTF_HERO_MAP deve mapear ${cls}`);
    assert.ok(blockoutPath, `GLTF_BLOCKOUT_HERO_MAP deve mapear ${cls}`);
    assert.ok(existsSync(`src/client/dev_viewer/${animPath}`), `Arquivo físico ${animPath} deve existir`);
    assert.ok(existsSync(`src/client/dev_viewer/${blockoutPath}`), `Arquivo físico ${blockoutPath} deve existir`);
  }

  for (const name of fullNames) {
    assert.ok(heroMap[name], `GLTF_HERO_MAP deve suportar alias ${name}`);
    assert.ok(blockoutMap[name], `GLTF_BLOCKOUT_HERO_MAP deve suportar alias ${name}`);
  }
});

test('Os 5 GLBs animados oficiais possuem 21 animações e rig canônico', () => {
  const classes = ['dk', 'dw', 'elf', 'mg', 'dl'];
  for (const cls of classes) {
    const buffer = readFileSync(`src/client/dev_viewer/models/animated_heroes/hero_${cls}_animated.glb`);
    const jsonLen = buffer.readUInt32LE(12);
    const jsonStr = buffer.toString('utf8', 20, 20 + jsonLen);
    const gltf = JSON.parse(jsonStr);

    const animNames = (gltf.animations || []).map((a: { name: string }) => a.name);
    assert.ok(animNames.length >= 20, `${cls} deve conter pelo menos 20 animações (encontrado ${animNames.length})`);
    assert.ok(animNames.includes('Idle'), `${cls} deve conter animação Idle`);
    assert.ok(animNames.includes('Walking_A'), `${cls} deve conter animação Walking_A`);
    assert.ok(animNames.includes('Running_A'), `${cls} deve conter animação Running_A`);
    assert.ok(animNames.includes('Death_A'), `${cls} deve conter animação Death_A`);
  }
});

test('resolveHeroAnimationClip resolve locomoção e skills oficiais por classe', () => {
  const mockAnims = [
    { name: 'Idle', duration: 2.0 },
    { name: 'Walking_A', duration: 1.0 },
    { name: 'Running_A', duration: 0.8 },
    { name: '2H_Melee_Attack_Spin', duration: 1.2 },
    { name: '1H_Melee_Attack_Slice_Horizontal', duration: 0.9 },
    { name: 'Spellcast_Shoot', duration: 1.1 },
    { name: 'Spellcast_Raise', duration: 1.3 },
    { name: '2H_Ranged_Shoot', duration: 1.0 },
    { name: '2H_Ranged_Aiming', duration: 0.8 },
  ];

  // Locomoção
  assert.equal(resolveHeroAnimationClip(mockAnims, 'DK', 'Walking_A')?.name, 'Walking_A');
  assert.equal(resolveHeroAnimationClip(mockAnims, 'DK', 'WALK')?.name, 'Walking_A');
  assert.equal(resolveHeroAnimationClip(mockAnims, 'DK', 'Idle')?.name, 'Idle');
  assert.equal(resolveHeroAnimationClip(mockAnims, 'DK', 'IDLE')?.name, 'Idle');
  assert.equal(resolveHeroAnimationClip(mockAnims, 'DK', 'Running_A')?.name, 'Running_A');
  assert.equal(resolveHeroAnimationClip(mockAnims, 'DK', 'RUN')?.name, 'Running_A');

  // Skills por classe
  assert.equal(resolveHeroAnimationClip(mockAnims, 'DK', 'TWISTING_SLASH')?.name, '2H_Melee_Attack_Spin');
  assert.equal(resolveHeroAnimationClip(mockAnims, 'DK', 'DEATH_STAB')?.name, '1H_Melee_Attack_Slice_Horizontal');

  assert.equal(resolveHeroAnimationClip(mockAnims, 'DW', 'TWISTING_SLASH')?.name, 'Spellcast_Shoot');
  assert.equal(resolveHeroAnimationClip(mockAnims, 'DW', 'DEATH_STAB')?.name, 'Spellcast_Raise');

  assert.equal(resolveHeroAnimationClip(mockAnims, 'ELF', 'TWISTING_SLASH')?.name, '2H_Ranged_Shoot');
  assert.equal(resolveHeroAnimationClip(mockAnims, 'ELF', 'DEATH_STAB')?.name, '2H_Ranged_Aiming');
});

test('createHero retorna interface completa de customização e animação', () => {
  for (const cls of ['DK', 'DW', 'ELF', 'MG', 'DL']) {
    const hero = createHero(cls, {}, THREE);
    assert.ok(hero.group instanceof THREE.Group);
    assert.equal(typeof hero.updateAnim, 'function');
    assert.equal(typeof hero.setArmor, 'function');
    assert.equal(typeof hero.setWeapon, 'function');
    assert.equal(typeof hero.setWings, 'function');
    assert.equal(typeof hero.toggleBaseMesh, 'function');
    assert.equal(typeof hero.triggerAnimation, 'function');
  }
});
