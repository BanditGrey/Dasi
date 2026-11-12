import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
// @ts-ignore - módulo JS compartilhado com o navegador
import { CHARACTER_CONCEPTS, getCharacterConcept, HERO_NAMES } from '../characterConcepts.js';
// @ts-ignore - ferramenta Node
import { inspectHeroGlb } from '../../../../tools/audit_hero_glb.mjs';

const paths: Record<string, string> = { DK: 'dark_knight', DW: 'dark_wizard', ELF: 'fairy_elf', MG: 'magic_gladiator', DL: 'dark_lord' };

test('as cinco classes têm dossiê canônico de estudo e modelos 3D válidos', () => {
  assert.deepEqual(Object.keys(CHARACTER_CONCEPTS), Object.keys(paths));
  for (const id of Object.keys(paths)) {
    const concept = getCharacterConcept(id);
    assert.deepEqual(getCharacterConcept(`HERO_${id}`), concept);
    assert.ok(concept.title && concept.description);
    assert.ok(concept.studyMaterial, `studyMaterial ausente para ${id}`);
    assert.ok(concept.studyMaterial.baseBodyBmd, `baseBodyBmd ausente para ${id}`);
    assert.ok(concept.studyMaterial.canonicalArmorSet, `canonicalArmorSet ausente para ${id}`);

    // Verifica que o GLB mestre estático existe e possui cabeçalho glTF válido
    assert.ok(existsSync(`src/client/dev_viewer/${concept.src}`), `GLB estático não encontrado: ${concept.src}`);
    const glbBuf = readFileSync(`src/client/dev_viewer/${concept.src}`);
    assert.equal(glbBuf.subarray(0, 4).toString('utf8'), 'glTF', `Cabeçalho glTF inválido para ${id}`);

    // Verifica que o modelo animado oficial existe
    assert.ok(existsSync(`src/client/dev_viewer/${concept.animatedModel}`), `GLB animado não encontrado: ${concept.animatedModel}`);
  }
  const html = readFileSync('src/client/dev_viewer/index.html', 'utf8');
  const app = readFileSync('src/client/dev_viewer/app.js', 'utf8');
  for (const id of Object.keys(paths)) assert.ok(html.includes(`data-biome="HERO_${id}"`), id);
  assert.ok(app.includes('getCharacterConcept(id)'));
  assert.equal(getCharacterConcept('HERO_UNKNOWN'), null);
  assert.equal(getCharacterConcept('__proto__'), null);
});

test('os cinco GLBs existentes têm cabeçalho e geometria inspecionáveis', () => {
  for (const [id, name] of Object.entries(paths)) {
    const buffer = readFileSync(`src/client/dev_viewer/models/hero_${name}.glb`);
    const result = inspectHeroGlb(buffer);
    assert.ok(result.meshes > 0 && result.primitives > 0 && result.vertices > 0 && result.triangles > 0, id);
  }
  assert.throws(() => inspectHeroGlb(Buffer.alloc(20)), /inválido/);
});
