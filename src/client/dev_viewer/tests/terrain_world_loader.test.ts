import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import * as THREE from '../libs/three.module.js';
import {
  muToThreeCoords,
  muToThreeRotation,
  filterObjectsInBounds,
  createObjectMarkersGroup,
  MU_TERRAIN_SCALE,
} from '../terrainWorldLoader.js';

describe('Dev Viewer - Canonical Terrain & World Objects Loader', () => {
  it('aplica o fator de escala TERRAIN_SCALE = 100.0 e mapeia Z-up para Y-up', () => {
    assert.strictEqual(MU_TERRAIN_SCALE, 100.0, 'Escala canônica de terreno deve ser 100.0');

    // Em MU Online: x=1397.1 (horizontal), y=682.56 (profundidade), z=44.23 (altura)
    // Em Three.js:  x=13.971, y=0.442 (altura), z=6.826 (profundidade)
    const muPos = { x: 1397.1, y: 682.56, z: 44.23 };
    const threePos = muToThreeCoords(muPos);

    assert.strictEqual(threePos.x, 13.971);
    assert.strictEqual(threePos.y, 0.442);
    assert.strictEqual(threePos.z, 6.826);
  });

  it('converte rotações em graus para radianos', () => {
    const muAngle = { pitch: 0, roll: 0, yaw: -60 };
    const rot = muToThreeRotation(muAngle);

    assert.strictEqual(rot.x, 0);
    assert.strictEqual(rot.z, 0);
    // -60 graus em radianos = -1.0472
    assert.strictEqual(rot.y, -1.0472);
  });

  it('filtra instâncias de objetos contidas nos limites do cenário', () => {
    const testObjects = [
      { index: 0, type: 30, position: { x: 500, y: 500, z: 0 }, angle: { pitch: 0, roll: 0, yaw: 0 }, scale: 1 }, // (5, 5) -> DENTRO
      { index: 1, type: 33, position: { x: 5000, y: 5000, z: 0 }, angle: { pitch: 0, roll: 0, yaw: 0 }, scale: 1 }, // (50, 50) -> FORA
      { index: 2, type: 12, position: { x: -200, y: 0, z: 0 }, angle: { pitch: 0, roll: 0, yaw: 0 }, scale: 1 }, // (-2, 0) -> DENTRO
    ];

    const bounds = { minX: -5, maxX: 10, minZ: -5, maxZ: 10 };
    const filtered = filterObjectsInBounds(testObjects, bounds);

    assert.strictEqual(filtered.length, 2, 'Dois objetos devem cair dentro dos limites do cenário');
    assert.strictEqual(filtered[0].index, 0);
    assert.strictEqual(filtered[1].index, 2);
  });

  it('gera grupo Three.js de marcadores físicos com metadados canônicos', () => {
    const testObjects = [
      {
        index: 42,
        type: 30,
        position: { x: 1000, y: 2000, z: 100 },
        angle: { pitch: 0, roll: 0, yaw: 90 },
        scale: 1.5,
      },
    ];

    const group = createObjectMarkersGroup(testObjects, THREE);
    assert.ok(group, 'Grupo Three.js deve ser instanciado');
    assert.strictEqual(group.name, 'CanonicalWorldObjects');
    assert.strictEqual(group.children.length, 1);

    const marker: any = group.children[0];
    assert.strictEqual(marker.position.x, 10);
    assert.strictEqual(marker.position.y, 1.6); // 1.0 (z/100) + 0.6 offset
    assert.strictEqual(marker.position.z, 20);
    assert.strictEqual(marker.scale.x, 1.5);
    assert.strictEqual(marker.userData.muIndex, 42);
    assert.strictEqual(marker.userData.muType, 30);
  });
});
