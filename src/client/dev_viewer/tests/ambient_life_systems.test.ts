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
  });
});
