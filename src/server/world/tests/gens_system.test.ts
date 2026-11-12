import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GensSystem, GensFamily, GensSymbol } from '../GensSystem.ts';

describe('GensSystem - Canonical Webzen Duprian & Vanert Mechanics', () => {
  it('determina patentes padrão com base na contribuição (< 10.000 pontos)', () => {
    assert.equal(GensSystem.calculateGensSymbol(0), GensSymbol.PRIVATE);
    assert.equal(GensSystem.calculateGensSymbol(499), GensSymbol.PRIVATE);
    assert.equal(GensSystem.calculateGensSymbol(500), GensSymbol.SERGEANT);
    assert.equal(GensSystem.calculateGensSymbol(1500), GensSymbol.LIEUTENANT);
    assert.equal(GensSystem.calculateGensSymbol(3000), GensSymbol.CAPTAIN);
    assert.equal(GensSystem.calculateGensSymbol(6000), GensSymbol.MAJOR);
    assert.equal(GensSystem.calculateGensSymbol(9999), GensSymbol.MAJOR);
  });

  it('determina patentes de oficiais de alta patente (>= 10.000 pontos) baseado no rank', () => {
    assert.equal(GensSystem.calculateGensSymbol(15000, 1), GensSymbol.GRAND_DUKE);
    assert.equal(GensSystem.calculateGensSymbol(12000, 3), GensSymbol.DUKE);
    assert.equal(GensSystem.calculateGensSymbol(11000, 8), GensSymbol.MARQUIS);
    assert.equal(GensSystem.calculateGensSymbol(10500, 25), GensSymbol.COUNT);
    assert.equal(GensSystem.calculateGensSymbol(10200, 40), GensSymbol.VISCOUNT);
    assert.equal(GensSystem.calculateGensSymbol(10100, 80), GensSymbol.BARON);
    assert.equal(GensSystem.calculateGensSymbol(10050, 150), GensSymbol.KNIGHT_COMMANDER);
    assert.equal(GensSystem.calculateGensSymbol(10020, 250), GensSymbol.SUPERIOR_KNIGHT);
    assert.equal(GensSystem.calculateGensSymbol(10010, 350), GensSymbol.KNIGHT);
  });

  it('identifica combate hostil em Zonas de Batalha de Gens sem penalidade de PK', () => {
    // Duprian (2) vs Vanert (1) em Battle Zone => Hostil
    const hostile = GensSystem.isHostileCombat(GensFamily.DUPRIAN, GensFamily.VANERT, true);
    assert.equal(hostile, true);

    // Mesmo Gens na Battle Zone => Não hostil
    const same = GensSystem.isHostileCombat(GensFamily.DUPRIAN, GensFamily.DUPRIAN, true);
    assert.equal(same, false);

    // Fora de Battle Zone => Não é combate de Gens
    const nonBattle = GensSystem.isHostileCombat(GensFamily.DUPRIAN, GensFamily.VANERT, false);
    assert.equal(nonBattle, false);
  });

  it('calcula recompensa e perda de contribuição por abate com anti-farming', () => {
    const reward = GensSystem.calculateKillReward(380, 400, 0);
    assert.equal(reward.contributionGain, 7);
    assert.equal(reward.contributionLoss, 6);
    assert.equal(reward.pkGained, false); // NUNCA ganha PK em Gens Battle!

    // Abate repetido consecutivamente (>= 3 vezes) não concede pontos (anti-farming)
    const farmed = GensSystem.calculateKillReward(380, 400, 3);
    assert.equal(farmed.contributionGain, 0);
    assert.equal(farmed.contributionLoss, 0);
  });
});
