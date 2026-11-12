import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { CanonicalTerrainGrid, TerrainWallFlags } from '../CanonicalTerrainGrid.ts';

describe('Canonical Terrain Extractor & Collision Parity (MU Online Season 5.2)', () => {
  it('carrega o master index com os 12 mundos canônicos extraídos de reference/', () => {
    const master = CanonicalTerrainGrid.getMasterIndex();
    assert.ok(Array.isArray(master), 'Master index deve ser uma lista de mapas');
    assert.strictEqual(master.length, 12, 'Deve conter exatamente 12 mapas canônicos principais');

    const expectedMapIds = [
      'LORENCIA',
      'DUNGEON',
      'DEVIAS',
      'NORIA',
      'LOST_TOWER',
      'ATLANS',
      'TARKAN',
      'DEVIL_SQUARE',
      'ICARUS',
      'BLOOD_CASTLE',
      'CHAOS_CASTLE',
      'VALLEY_OF_LOREN',
    ];

    const extractedIds = master.map((m) => m.id);
    for (const expectedId of expectedMapIds) {
      assert.ok(extractedIds.includes(expectedId), `Mapa ${expectedId} deve estar presente no índice`);
    }

    const totalObjects = master.reduce((acc, m) => acc + m.objects_count, 0);
    assert.strictEqual(totalObjects, 38344, 'A contagem total de objetos instanciados 3D nos 12 mundos deve ser 38.344');
  });

  it('valida as 5 asserções originais de integridade do ZzzLodTerrain.cpp da Webzen', () => {
    // Estas são as exatas verificações de sanidade embutidas no código C++ da Webzen:
    // reference/mu_roxgaming_5.2/source/Main/source/ZzzLodTerrain.cpp:194-198
    // WD_0LORENCIA: if(TerrainWall[123*256+135]!=5) Error=true;
    // WD_1DUNGEON:  if(TerrainWall[120*256+227]!=4) Error=true;
    // WD_2DEVIAS:   if(TerrainWall[ 55*256+208]!=5) Error=true;
    // WD_3NORIA:    if(TerrainWall[119*256+186]!=5) Error=true;
    // WD_4LOSTTOWER:if(TerrainWall[ 75*256+193]!=5) Error=true;

    const lorWall = CanonicalTerrainGrid.getTileAttribute('LORENCIA', 135, 123);
    assert.strictEqual(lorWall, 5, 'Lorencia [123][135] deve ser 5 (TW_SAFEZONE | TW_NOMOVE)');

    const dngWall = CanonicalTerrainGrid.getTileAttribute('DUNGEON', 227, 120);
    assert.strictEqual(dngWall, 4, 'Dungeon [120][227] deve ser 4 (TW_NOMOVE)');

    const devWall = CanonicalTerrainGrid.getTileAttribute('DEVIAS', 208, 55);
    assert.strictEqual(devWall, 5, 'Devias [55][208] deve ser 5 (TW_SAFEZONE | TW_NOMOVE)');

    const norWall = CanonicalTerrainGrid.getTileAttribute('NORIA', 186, 119);
    assert.strictEqual(norWall, 5, 'Noria [119][186] deve ser 5 (TW_SAFEZONE | TW_NOMOVE)');

    const ltWall = CanonicalTerrainGrid.getTileAttribute('LOST_TOWER', 193, 75);
    assert.strictEqual(ltWall, 5, 'Lost Tower [75][193] deve ser 5 (TW_SAFEZONE | TW_NOMOVE)');
  });

  it('verifica caminhabilidade, zona segura e água nas regiões canônicas de Lorencia', () => {
    // Praça central de Lorencia (125, 125) é zona segura caminhável
    const centerAttr = CanonicalTerrainGrid.getTileAttribute('LORENCIA', 125, 125);
    assert.strictEqual(centerAttr, TerrainWallFlags.SAFEZONE, 'Centro de Lorencia (125, 125) deve ter flag SAFEZONE');
    assert.strictEqual(CanonicalTerrainGrid.isTileWalkable('LORENCIA', 125, 125), true, 'Centro de Lorencia deve ser caminhável');
    assert.strictEqual(CanonicalTerrainGrid.isTileSafeZone('LORENCIA', 125, 125), true, 'Centro de Lorencia deve ser SafeZone');

    // Parede de Lorencia (135, 123) não deve ser caminhável
    assert.strictEqual(CanonicalTerrainGrid.isTileWalkable('LORENCIA', 135, 123), false, 'Parede (135, 123) não pode ser caminhável');

    // Borda exterior extrema (0, 0) é bloqueada (fora da área jogável)
    assert.strictEqual(CanonicalTerrainGrid.isTileWalkable('LORENCIA', 0, 0), false, 'Ladrilho (0, 0) deve ser bloqueado');
  });

  it('carrega o sumário de colisão e valida dimensões 256x256', () => {
    const summary = CanonicalTerrainGrid.getMapSummary('LORENCIA');
    assert.ok(summary !== null, 'Sumário de Lorencia deve existir');
    assert.strictEqual(summary.width, 256, 'Largura da grid deve ser 256');
    assert.strictEqual(summary.height, 256, 'Altura da grid deve ser 256');
    assert.strictEqual(summary.wall_counts.walkable, 46021, 'Ladrilhos caminháveis de Lorencia');
    assert.strictEqual(summary.wall_counts.blocked, 2560, 'Ladrilhos bloqueados de Lorencia');
  });

  it('carrega o layout de instâncias 3D dos objetos de Lorencia com posições válidas', () => {
    const layout = CanonicalTerrainGrid.loadObjectsLayout('LORENCIA');
    assert.ok(layout !== null, 'Layout de Lorencia deve existir');
    assert.strictEqual(layout.total_objects, 2870, 'Lorencia deve ter 2.870 objetos instanciados');
    assert.strictEqual(layout.objects.length, 2870, 'A lista de objetos deve conter 2.870 itens');

    const firstObj = layout.objects[0];
    assert.strictEqual(typeof firstObj.index, 'number');
    assert.strictEqual(typeof firstObj.type, 'number');
    assert.strictEqual(typeof firstObj.position.x, 'number');
    assert.strictEqual(typeof firstObj.position.y, 'number');
    assert.strictEqual(typeof firstObj.position.z, 'number');
    assert.strictEqual(typeof firstObj.scale, 'number');
    assert.ok(firstObj.scale > 0, 'Escala do objeto deve ser positiva');

    // Filtra objetos por tipo
    const type30 = CanonicalTerrainGrid.getObjectsByType('LORENCIA', 30);
    assert.ok(type30.length > 0, 'Deve conter objetos do tipo 30');
  });
});
