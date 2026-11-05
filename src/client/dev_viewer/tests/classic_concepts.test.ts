import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { SCENARIO_CATALOG } from '../../../server/world/CollisionSystem.ts';
// @ts-ignore JS module shared with the browser
import { CLASSIC_CONCEPTS, conceptKeyForScenario, SCENARIO_CONCEPTS, getScenarioConcept } from '../classicConcepts.js';

test('cada cenário resolve para sua família visual sem confundir as arenas', () => {
  for (const scenario of SCENARIO_CATALOG) {
    const key = conceptKeyForScenario(scenario.id);
    assert.equal(key, scenario.biome, scenario.id);
    const concept = (CLASSIC_CONCEPTS as Record<string, { file: string }>)[key];
    assert.ok(concept, `Concept ausente: ${scenario.id}`);
    assert.ok(existsSync(`src/client/dev_viewer/art/classic/${concept.file}.jpg`));
  }
});


test('galeria oferece abas para as três arenas de evento adicionais', () => {
  const html = readFileSync('src/client/dev_viewer/index.html', 'utf8');
  for (const id of ['DEVIL_SQUARE', 'CHAOS_CASTLE', 'DUEL_COLISEUM']) {
    assert.match(html, new RegExp(`data-biome="${id}"`));
    assert.ok((CLASSIC_CONCEPTS as Record<string, { file: string }>)[id]);
  }
});


test('concepts individuais pertencem ao catálogo e possuem arquivos próprios', () => {
  const ids = Object.keys(SCENARIO_CONCEPTS);
  for (const id of ['LOR_01', 'LOR_02', 'LOR_03', 'LOR_04', 'LOR_05', 'LOR_06', 'LOR_07', 'NOR_01', 'NOR_02', 'NOR_03']) assert.ok(ids.includes(id), id);
  for (const id of ids) {
    assert.ok(SCENARIO_CATALOG.some((scenario) => scenario.id === id), id);
    const concept = getScenarioConcept(id);
    assert.ok(concept?.title);
    assert.ok(existsSync(`src/client/dev_viewer/${concept.src}`), id);
  }
  for (const id of ['NOR_04', 'NOR_05', 'NOR_06', 'NOR_07', 'DEV_01', 'DEV_02', 'DEV_03', 'DEV_04', 'DEV_05', 'DEV_06']) assert.ok(ids.includes(id), id);
  for (const id of ['DNG_01', 'DNG_02', 'DNG_03', 'DNG_04', 'DNG_05', 'DNG_06', 'LT_01', 'LT_02', 'LT_03', 'LT_04']) assert.ok(ids.includes(id), id);
  for (const id of ['LT_05', 'LT_06', 'LT_07', 'ATL_01', 'ATL_02', 'ATL_03', 'ATL_04', 'ATL_05', 'ATL_06', 'ATL_07']) assert.ok(ids.includes(id), id);
  for (const id of ['TAR_01', 'TAR_02', 'TAR_03', 'TAR_04', 'TAR_05', 'ICA_01', 'ICA_02', 'VOL_01', 'VOL_02', 'VOL_03']) assert.ok(ids.includes(id), id);
  for (const scenario of SCENARIO_CATALOG) assert.ok(ids.includes(scenario.id), `Concept individual ausente: ${scenario.id}`);
  assert.equal(ids.length, SCENARIO_CATALOG.length);
  assert.equal(getScenarioConcept('INVALID_01'), null);
});
