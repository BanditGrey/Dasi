import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// @ts-ignore - JS partilhado com o browser
import { HERO_CLASSES, ARMOR_SLOTS, ARMOR_VARIANTS, createArmorModule, createModularHero } from '../modularHero.js';

async function loadGlb(path: string) {
  const buffer = await readFile(path);
  return new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), '');
}

test('troca uma peça sem alterar outros slots e rejeita combinações inválidas', () => {
  for (const id of Object.keys(HERO_CLASSES)) {
    const hero = createModularHero(THREE, id) as any;
    assert.equal(Object.keys(hero.getArmor()).length, 6);
    const oldChest = hero.anchors.chest.children[0];
    const oldBoots = hero.anchors.boots.children[0];
    const chestPosition = hero.anchors.chest.position.clone();
    assert.ok(hero.setArmor('chest', 'elite'), id);
    assert.notEqual(hero.anchors.chest.children[0], oldChest);
    assert.equal(hero.anchors.boots.children[0], oldBoots);
    assert.deepEqual(hero.anchors.chest.position.toArray(), chestPosition.toArray());
    assert.equal(hero.getArmor().chest, 'elite');
    assert.equal(hero.getArmor().boots, 'base');
    assert.equal(hero.setArmor('chest', 'invalid'), false);
    assert.equal(hero.setArmor('unknown', 'base'), false);
    assert.equal(hero.getArmor().chest, 'elite');
    assert.throws(() => createArmorModule(THREE, id, 'helmet', 'invalid'));
  }
  assert.throws(() => createModularHero(THREE, '__proto__'));
});

test('os cinco blockouts e 60 módulos GLB possuem slots e metadados de compatibilidade', async () => {
  for (const id of Object.keys(HERO_CLASSES)) {
    const prefix = `src/client/dev_viewer/models/modular_heroes/${id.toLowerCase()}`;
    const hero = await loadGlb(`src/client/dev_viewer/models/modular_heroes/hero_${id.toLowerCase()}_modular.glb`);
    assert.ok(hero.scene.getObjectByName(`hero_${id}_modular`), id);
    assert.ok(hero.scene.getObjectByName(`weapon_blockout_${id}`), id);
    for (const slot of ARMOR_SLOTS) {
      const anchor = hero.scene.getObjectByName(`slot_${slot}`);
      assert.ok(anchor, `${id}/${slot}`);
      assert.ok(anchor.getObjectByName(`module_${id}_${slot}_base`), `${id}/${slot}`);
      for (const variant of ARMOR_VARIANTS) {
        const module = await loadGlb(`${prefix}_${slot}_${variant}.glb`);
        const root = module.scene.getObjectByName(`module_${id}_${slot}_${variant}`);
        assert.ok(root, `${id}/${slot}/${variant}`);
        assert.equal(root.userData.heroClass, id);
        assert.equal(root.userData.slot, slot);
        assert.equal(root.userData.variant, variant);
        let meshCount = 0;
        root.traverse((node: any) => { if (node.isMesh) meshCount++; });
        assert.ok(meshCount > 0, `${id}/${slot}/${variant}`);
      }
    }
    assert.equal(hero.animations.length, 0); // Os blockouts ainda não são rigados.
  }
});

test('a interface expõe a troca e os downloads do protótipo', () => {
  const html = readFileSync('src/client/dev_viewer/index.html', 'utf8');
  for (const id of ['hero-modular-mode', 'hero-armor-slot', 'hero-armor-variant', 'hero-armor-apply', 'hero-modular-download', 'hero-armor-download']) assert.ok(html.includes(`id="${id}"`), id);
  const viewer = readFileSync('src/client/dev_viewer/dasi3dViewer.js', 'utf8');
  assert.ok(viewer.includes('this.modularHeroMode ? createModularHero'));
});
