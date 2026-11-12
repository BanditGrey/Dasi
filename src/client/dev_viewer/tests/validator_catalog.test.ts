import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// @ts-ignore - ESM catalog from client module
import { VALIDATION_CATALOG } from '../validator.js';

describe('Estúdio de Validação Canônica (Sim / Não)', () => {
  it('garante que a página do validador e seu script existam', () => {
    assert.ok(fs.existsSync('src/client/dev_viewer/validator.html'), 'validator.html não encontrado');
    assert.ok(fs.existsSync('src/client/dev_viewer/validator.js'), 'validator.js não encontrado');

    const html = fs.readFileSync('src/client/dev_viewer/validator.html', 'utf8');
    assert.ok(html.includes('btn-vote-sim'), 'Botão SIM ausente no HTML');
    assert.ok(html.includes('btn-vote-nao'), 'Botão NÃO ausente no HTML');
    assert.ok(html.includes('val-progress-bar-wrap'), 'Barra de progresso ausente no HTML');
  });

  it('valida que o catálogo contenha exatamente os 93 assets canônicos em 12 categorias estruturadas', () => {
    assert.strictEqual(VALIDATION_CATALOG.length, 93, 'O catálogo deve conter exatamente 93 assets');

    const heroes = VALIDATION_CATALOG.filter((a: any) => a.category === 'HERO');
    const bosses = VALIDATION_CATALOG.filter((a: any) => a.category === 'BOSS');
    const golden = VALIDATION_CATALOG.filter((a: any) => a.category === 'GOLDEN');
    const field = VALIDATION_CATALOG.filter((a: any) => a.category === 'FIELD');
    const armors = VALIDATION_CATALOG.filter((a: any) => a.category === 'ARMOR');
    const weapons = VALIDATION_CATALOG.filter((a: any) => a.category === 'WEAPON');
    const creatures = VALIDATION_CATALOG.filter((a: any) => a.category === 'CREATURE');
    const sceneries = VALIDATION_CATALOG.filter((a: any) => a.category === 'SCENERY');
    const npcs = VALIDATION_CATALOG.filter((a: any) => a.category === 'NPC');
    const mounts = VALIDATION_CATALOG.filter((a: any) => a.category === 'MOUNT');
    const wings = VALIDATION_CATALOG.filter((a: any) => a.category === 'WINGS');
    const modulars = VALIDATION_CATALOG.filter((a: any) => a.category === 'MODULAR');

    assert.strictEqual(heroes.length, 6, 'Devem existir 6 classes heroicas (5 animadas + Golden Master Base)');
    assert.strictEqual(bosses.length, 6, 'Devem existir 6 chefes de bioma');
    assert.strictEqual(golden.length, 6, 'Devem existir 6 criaturas de invasão dourada');
    assert.strictEqual(field.length, 6, 'Devem existir 6 criaturas de campo');
    assert.strictEqual(armors.length, 6, 'Devem existir 6 conjuntos de armaduras de museu');
    assert.strictEqual(weapons.length, 13, 'Devem existir 13 armas e escudos canônicos');
    assert.strictEqual(creatures.length, 7, 'Devem existir 7 criaturas do bestiário animado');
    assert.strictEqual(sceneries.length, 13, 'Devem existir 13 cenários mundiais e arenas de eventos');
    assert.strictEqual(npcs.length, 10, 'Devem existir 10 NPCs canônicos de Lorencia, Noria, Devias e Eventos');
    assert.strictEqual(mounts.length, 10, 'Devem existir 10 montarias e pets oficiais');
    assert.strictEqual(wings.length, 5, 'Devem existir 5 asas e capas lendárias');
    assert.strictEqual(modulars.length, 5, 'Devem existir 5 heróis modulares com peças independentes');

    const dkMaster = VALIDATION_CATALOG.find((a: any) => a.id === 'HERO_DK_MASTER');
    assert.ok(dkMaster, 'HERO_DK_MASTER deve estar registrado no catálogo');
    assert.strictEqual(dkMaster.glb, 'models/hero_dk_master_base.glb');
  });

  it('verifica que todos os 93 arquivos GLB existem no disco', () => {
    for (const asset of VALIDATION_CATALOG) {
      const fullPath = path.join('src/client/dev_viewer', asset.glb);
      assert.ok(fs.existsSync(fullPath), `${asset.id}: GLB não encontrado em ${fullPath}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 2_000, `${asset.id}: GLB muito pequeno (${stats.size} bytes)`);
    }
  });

  it('valida que todos os assets declarem fontes autênticas do material de estudo (.bmd)', () => {
    for (const asset of VALIDATION_CATALOG) {
      assert.ok(asset.sourceBmd, `${asset.id}: sourceBmd ausente`);
      assert.ok(asset.sourceBmd.toLowerCase().includes('bmd') || asset.sourceBmd.toLowerCase().includes('cpp'), `${asset.id}: deve referenciar BMD ou fonte C++ do material de estudo`);
    }
  });

  it('garante que todos os assets possuam parâmetros de colisão válidos e autoritativos', () => {
    for (const asset of VALIDATION_CATALOG) {
      assert.ok(asset.collision, `${asset.id}: sem parâmetros de colisão`);
      assert.ok(typeof asset.collision.radius === 'number' && asset.collision.radius > 0, `${asset.id}: raio inválido`);
      assert.ok(typeof asset.collision.height === 'number' && asset.collision.height > 0, `${asset.id}: altura inválida`);
      assert.ok(typeof asset.collision.step === 'number' && asset.collision.step > 0, `${asset.id}: step height inválido`);
    }
  });

  it('confere que a página principal do Dev Viewer possui link para o Validador', () => {
    const indexHtml = fs.readFileSync('src/client/dev_viewer/index.html', 'utf8');
    assert.ok(indexHtml.includes('validator.html'), 'Link para validator.html ausente no index.html');
  });
});
