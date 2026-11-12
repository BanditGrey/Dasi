/**
 * DASI MMORPG - TESTES DE SISTEMA DE VIDA AMBIENTAL (AMBIENT LIFE & FAUNA)
 * Valida a criação de bandos de aves reativas, cardumes, morcegos,
 * flicker de tochas e ciclo de atualização a 60 FPS.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

// Polyfills Node.js headless
if (typeof (globalThis as any).self === 'undefined') {
  (globalThis as any).self = globalThis;
}
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = globalThis;
}

// @ts-ignore
import { AmbientLifeEngine } from '../ambientLifeEngine.js';

describe('2. Sistema de Vida Ambiental & Fauna Dinâmica (AmbientLifeEngine)', () => {
  it('inicializa fauna correta para Lorencia (aves e tochas)', () => {
    const scene = new THREE.Scene();
    const engine = new AmbientLifeEngine(scene, 'lorencia_citadel');

    assert.ok(engine.containerGroup);
    assert.strictEqual(engine.currentScenarioId, 'lorencia_citadel');
    assert.ok(engine.birds.length > 0, 'Deve conter aves em Lorencia');
    assert.strictEqual(engine.birds.length, 12);
    assert.ok(engine.torches.length > 0, 'Deve conter tochas na cidadela de Lorencia');
    assert.strictEqual(engine.bats.length, 0, 'Não deve conter morcegos em Lorencia');
    assert.strictEqual(engine.fishes.length, 0, 'Não deve conter peixes em Lorencia');
  });

  it('inicializa fauna correta para Dungeon Catacombs (morcegos e tochas espectrais)', () => {
    const scene = new THREE.Scene();
    const engine = new AmbientLifeEngine(scene, 'dungeon_catacombs');

    assert.strictEqual(engine.birds.length, 0, 'Não deve conter aves na Dungeon');
    assert.ok(engine.bats.length >= 8, 'Deve conter morcegos na Dungeon');
    assert.ok(engine.torches.length > 0, 'Deve conter tochas verdes na Dungeon');
  });

  it('inicializa fauna correta para Atlans Thalassa (cardume de peixes)', () => {
    const scene = new THREE.Scene();
    const engine = new AmbientLifeEngine(scene, 'atlans_thalassa');

    assert.strictEqual(engine.birds.length, 0);
    assert.strictEqual(engine.bats.length, 0);
    assert.ok(engine.fishes.length >= 15, 'Deve conter cardume de peixes em Atlans');
  });

  it('reação de fuga das aves ao jogador se aproximar a menos de 4 metros', () => {
    const scene = new THREE.Scene();
    const engine = new AmbientLifeEngine(scene, 'lorencia_citadel');
    const firstBird = engine.birds[0];

    assert.strictEqual(firstBird.state, 'LANDED');

    // Posiciona o jogador próximo à ave (< 4.2m)
    const birdPos = firstBird.mesh.position;
    const nearbyPlayer = new THREE.Vector3(birdPos.x + 1.0, 0, birdPos.z + 1.0);

    // Executa atualização
    engine.update(0.016, nearbyPlayer);

    assert.strictEqual(firstBird.state, 'TAKING_OFF', 'A ave deve ter decolado com a proximidade do jogador');
    assert.ok(firstBird.velocity.y > 0, 'Velocidade vertical de decolagem deve ser positiva');
  });

  it('tochas e braseiros modulam intensidade com flicker orgânico', () => {
    const scene = new THREE.Scene();
    const engine = new AmbientLifeEngine(scene, 'lorencia_citadel');
    const firstTorch = engine.torches[0];
    const initialIntensity = firstTorch.light.intensity;

    // Executa alguns passos de tempo
    engine.update(0.1, new THREE.Vector3(0, 0, 0));
    const nextIntensity = firstTorch.light.intensity;

    assert.notStrictEqual(nextIntensity, initialIntensity, 'Intensidade da tocha deve variar com o flicker');
    assert.ok(nextIntensity > 0, 'Intensidade da tocha deve ser positiva');
  });

  it('publicClear limpa todos os recursos e objetos da cena', () => {
    const scene = new THREE.Scene();
    const engine = new AmbientLifeEngine(scene, 'lorencia_citadel');

    assert.ok(engine.containerGroup.children.length > 0);
    engine.publicClear();

    assert.strictEqual(engine.containerGroup.children.length, 0);
    assert.strictEqual(engine.birds.length, 0);
    assert.strictEqual(engine.torches.length, 0);
    assert.strictEqual(engine.critters.length, 0);
  });

  it('inicializa fauna terrestre (raposas) em Lorencia e reage com fuga rápida ao herói', () => {
    const scene = new THREE.Scene();
    const engine = new AmbientLifeEngine(scene, 'lorencia_citadel');

    assert.ok(engine.critters.length >= 3, 'Deve conter pelo menos 3 critters/raposas em Lorencia');
    const firstFox = engine.critters[0];
    assert.strictEqual(firstFox.kind, 'fox');
    assert.strictEqual(firstFox.state, 'GRAZING');

    // Posiciona herói a menos de 4m da raposa
    const foxPos = firstFox.group.position;
    const playerPos = new THREE.Vector3(foxPos.x + 1.2, 0, foxPos.z + 1.2);

    engine.update(0.016, playerPos);

    assert.strictEqual(firstFox.state, 'FLEEING', 'A raposa deve entrar em estado de fuga ao detectar o herói');
    assert.strictEqual(firstFox.speed, 4.2, 'A velocidade deve acelerar para galope de fuga');
    assert.ok(firstFox.fleeDirection.lengthSq() > 0, 'Direção de fuga deve estar normalizada');
  });

  it('conecta síntese de áudio procedural na decolagem de aves', () => {
    const soundCalls: string[] = [];
    const mockAudio = {
      playWildlifeSound(kind: string) {
        soundCalls.push(kind);
      },
    };

    const scene = new THREE.Scene();
    const engine = new AmbientLifeEngine(scene, 'lorencia_citadel', mockAudio);
    const firstBird = engine.birds[0];
    const birdPos = firstBird.mesh.position;
    const nearbyPlayer = new THREE.Vector3(birdPos.x + 1.0, 0, birdPos.z + 1.0);

    engine.update(0.016, nearbyPlayer);

    assert.ok(soundCalls.includes('wings'), 'Deve disparar áudio procedural de revoada de asas');
  });

  it('toggleAmbient alterna visibilidade e execução da vitalidade ambiental', () => {
    const scene = new THREE.Scene();
    const engine = new AmbientLifeEngine(scene, 'lorencia_citadel');

    assert.strictEqual(engine.enabled, true);
    assert.strictEqual(engine.containerGroup.visible, true);

    const isNowOff = engine.toggleAmbient(false);
    assert.strictEqual(isNowOff, false);
    assert.strictEqual(engine.containerGroup.visible, false);

    const isNowOn = engine.toggleAmbient(true);
    assert.strictEqual(isNowOn, true);
    assert.strictEqual(engine.containerGroup.visible, true);
  });
});
