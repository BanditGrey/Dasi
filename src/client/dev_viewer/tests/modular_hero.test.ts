import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// @ts-ignore - JS partilhado com o browser
import { HERO_CLASSES, ARMOR_SLOTS, ARMOR_VARIANTS, CLASS_WEAPONS, createArmorModule, createModularHero, createWeaponModule } from '../modularHero.js';

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

test('permite troca dinâmica de armas modulares e exporta GLBs inspecionáveis', async () => {
  for (const id of Object.keys(HERO_CLASSES)) {
    const hero = createModularHero(THREE, id) as any;
    const weapons = hero.getAvailableWeapons();
    assert.ok(weapons.length >= 2, `${id} possui ao menos 2 armas modulares`);
    assert.equal(hero.getWeapon(), weapons[0]);

    // Troca para a segunda arma
    const secondWeapon = weapons[1];
    assert.ok(hero.setWeapon(secondWeapon));
    assert.equal(hero.getWeapon(), secondWeapon);
    assert.ok(hero.group.getObjectByName(`weapon_blockout_${id}`));

    // Rejeita arma inválida
    assert.equal(hero.setWeapon('INVALID_WEAPON'), false);
    assert.equal(hero.getWeapon(), secondWeapon);

    // Valida módulos GLB exportados de cada arma
    const prefix = `src/client/dev_viewer/models/modular_heroes/${id.toLowerCase()}`;
    for (const weaponId of weapons) {
      const module = await loadGlb(`${prefix}_weapon_${weaponId.toLowerCase()}.glb`);
      const root = module.scene.getObjectByName(`module_${id}_weapon_${weaponId.toLowerCase()}`);
      assert.ok(root, `${id}/${weaponId}`);
      assert.equal(root.userData.heroClass, id);
      assert.equal(root.userData.weaponId, weaponId);
      let meshCount = 0;
      root.traverse((node: any) => { if (node.isMesh) meshCount++; });
      assert.ok(meshCount > 0, `${id}/${weaponId} tem malhas 3D`);
    }
  }
  assert.throws(() => createWeaponModule(THREE, 'DK', 'INVALID_WEAPON'));
  assert.throws(() => createWeaponModule(THREE, 'INVALID_CLASS', 'DRAGON_BLADE'));
});

test('modular hero suporta aprimoramento +0 a +15 com auras e emissivos dinâmicos', () => {
  const hero = createModularHero(THREE, 'DK') as any;
  assert.equal(typeof hero.updateRefinementGlow, 'function');

  // Aplica +15
  hero.updateRefinementGlow(15);
  let hasGlowAt15 = false;
  hero.group.traverse((node: any) => {
    if (node.isMesh && node.material?.emissiveIntensity >= 3.0) {
      hasGlowAt15 = true;
    }
  });
  assert.ok(hasGlowAt15, 'Herói modular deve emitir aura intensa no nível +15');

  // Retorna para +0
  hero.updateRefinementGlow(0);
  let hasGlowAt0 = false;
  hero.group.traverse((node: any) => {
    if (node.isMesh && node.material?.emissiveIntensity > 0 && node.material?.name !== 'gem') {
      hasGlowAt0 = true;
    }
  });
  assert.equal(hasGlowAt0, false, 'Herói modular no nível +0 não deve emitir brilho de refino nas armaduras');
});
