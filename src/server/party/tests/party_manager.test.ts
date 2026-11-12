import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PartyManager,
  type PartyMember,
} from '../PartyManager.ts';

describe('PartyManager - Webzen Party Experience & Gold Party Multipliers', () => {
  it('distribui experiência padrão em party geral (General Party)', () => {
    // 2 membros da mesma classe (DK + DK) -> 160% total (80% cada)
    const members2: PartyMember[] = [
      { sessionId: 'dk1', name: 'Knight1', className: 'DK', level: 100, isLeader: true },
      { sessionId: 'dk2', name: 'Knight2', className: 'DK', level: 100 },
    ];

    const res2 = PartyManager.calculatePartyExp(1000, members2, 50);
    assert.equal(res2.isGoldParty, false);
    assert.equal(res2.totalPartyExp, 1600); // 160%
    assert.equal(res2.memberExpShares[0].expGranted, 800);
    assert.equal(res2.memberExpShares[1].expGranted, 800);

    // 5 membros sem diversidade de classes -> 225% total (45% cada)
    const members5: PartyMember[] = [
      { sessionId: 'dk1', name: 'Knight1', className: 'DK', level: 100, isLeader: true },
      { sessionId: 'dk2', name: 'Knight2', className: 'DK', level: 100 },
      { sessionId: 'dk3', name: 'Knight3', className: 'DK', level: 100 },
      { sessionId: 'dk4', name: 'Knight4', className: 'DK', level: 100 },
      { sessionId: 'dk5', name: 'Knight5', className: 'DK', level: 100 },
    ];

    const res5 = PartyManager.calculatePartyExp(1000, members5, 50);
    assert.equal(res5.isGoldParty, false);
    assert.equal(res5.totalPartyExp, 2250); // 225%
    assert.equal(res5.memberExpShares[0].expGranted, 450);
  });

  it('ativa o bônus de Gold Party quando há 3 ou mais classes distintas', () => {
    // 3 classes distintas: DK + DW + ELF -> 225% total (75% cada)
    const gold3: PartyMember[] = [
      { sessionId: 'dk1', name: 'Knight', className: 'DK', level: 100, isLeader: true },
      { sessionId: 'dw1', name: 'Wizard', className: 'DW', level: 100 },
      { sessionId: 'fe1', name: 'Elf', className: 'ELF', level: 100 },
    ];

    const resGold3 = PartyManager.calculatePartyExp(1000, gold3, 50);
    assert.equal(resGold3.isGoldParty, true);
    assert.equal(resGold3.totalPartyExp, 2250);
    assert.equal(resGold3.memberExpShares[0].expGranted, 750);

    // 5 classes distintas: DK + DW + ELF + MG + DL -> 300% total (60% cada)
    const gold5: PartyMember[] = [
      { sessionId: 'dk1', name: 'Knight', className: 'DK', level: 100, isLeader: true },
      { sessionId: 'dw1', name: 'Wizard', className: 'DW', level: 100 },
      { sessionId: 'fe1', name: 'Elf', className: 'ELF', level: 100 },
      { sessionId: 'mg1', name: 'Gladiator', className: 'MG', level: 100 },
      { sessionId: 'dl1', name: 'Lord', className: 'DL', level: 100 },
    ];

    const resGold5 = PartyManager.calculatePartyExp(1000, gold5, 50);
    assert.equal(resGold5.isGoldParty, true);
    assert.equal(resGold5.totalPartyExp, 3000); // 300%
    assert.equal(resGold5.memberExpShares[0].expGranted, 600);
  });

  it('bloqueia concessão de EXP para membros com diferença de nível superior a 130 (anti-powerlevel)', () => {
    const partyWithNoob: PartyMember[] = [
      { sessionId: 'leader', name: 'HighMaster', className: 'DK', level: 350, isLeader: true },
      { sessionId: 'noob', name: 'LowNoob', className: 'DW', level: 100 }, // Delta = 250 > 130!
    ];

    const res = PartyManager.calculatePartyExp(1000, partyWithNoob, 80);
    assert.equal(res.memberExpShares[0].eligible, true);
    assert.equal(res.memberExpShares[0].expGranted, 800);

    // Membro de nível muito baixo não recebe EXP
    assert.equal(res.memberExpShares[1].eligible, false);
    assert.equal(res.memberExpShares[1].expGranted, 0);
  });
});
