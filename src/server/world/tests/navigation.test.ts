import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NavigationManager,
  GATE_TABLE,
} from '../NavigationManager.ts';

describe('NavigationManager - Webzen MoveReq & Gate System', () => {
  it('aplica desconto de 1/3 no requisito de nível para Magic Gladiator, Dark Lord e Rage Fighter', () => {
    // Atlans (Map 7, Gate 49, base MinLevel 70)
    const dkReq = NavigationManager.getRequiredMoveLevel('DK', 7, 70);
    assert.equal(dkReq, 70);

    const dwReq = NavigationManager.getRequiredMoveLevel('DW', 7, 70);
    assert.equal(dwReq, 70);

    const elfReq = NavigationManager.getRequiredMoveLevel('ELF', 7, 70);
    assert.equal(elfReq, 70);

    // MG e DL: Math.floor(70 * 2 / 3) = 46
    const mgReq = NavigationManager.getRequiredMoveLevel('MG', 7, 70);
    assert.equal(mgReq, 46);

    const dlReq = NavigationManager.getRequiredMoveLevel('DL', 7, 70);
    assert.equal(dlReq, 46);

    // Exceção canônica: Swamp of Calmness (Map 56) não recebe desconto
    const swampMgReq = NavigationManager.getRequiredMoveLevel('MG', 56, 400);
    assert.equal(swampMgReq, 400);
  });

  it('processa comando /move com sucesso deduzindo Zen e validando nível', () => {
    const player = {
      name: 'HeroDK',
      className: 'DK',
      level: 150,
      zen: 100_000,
    };

    const res = NavigationManager.processMoveRequest(player, 'Tarkan');
    assert.equal(res.success, true);
    assert.equal(res.mapId, 8); // Tarkan é Map 8
    assert.equal(res.costZen, 8000);
    assert.ok(res.x! >= GATE_TABLE[57].x);
    assert.ok(res.x! <= GATE_TABLE[57].tx);
  });

  it('bloqueia teleporte quando o nível ou zen for insuficiente', () => {
    const lowLevelPlayer = {
      name: 'NoobDK',
      className: 'DK',
      level: 20,
      zen: 50_000,
    };

    // Tarkan exige nível 140
    const levelRes = NavigationManager.processMoveRequest(lowLevelPlayer, 'Tarkan');
    assert.equal(levelRes.success, false);
    assert.ok(levelRes.message.includes('Nível insuficiente'));

    const poorPlayer = {
      name: 'PoorDK',
      className: 'DK',
      level: 150,
      zen: 100, // Custo Tarkan é 8000
    };
    const zenRes = NavigationManager.processMoveRequest(poorPlayer, 'Tarkan');
    assert.equal(zenRes.success, false);
    assert.ok(zenRes.message.includes('Zen insuficiente'));
  });

  it('bloqueia teleporte para jogadores PK (Assassinos com PK Level >= 5)', () => {
    const pkPlayer = {
      name: 'RedKiller',
      className: 'DK',
      level: 300,
      zen: 1_000_000,
      pkLevel: 5, // Murderer 2 / Phonomania
    };

    const pkRes = NavigationManager.processMoveRequest(pkPlayer, 'Lorencia');
    assert.equal(pkRes.success, false);
    assert.ok(pkRes.message.includes('Assassinos (PK) estão proibidos'));
  });

  it('detecta transição de portal físico (Flag 1) ao pisar na área de gatilho', () => {
    const player = {
      className: 'DK',
      level: 50,
    };

    // Gate 1: Portal Lorencia -> Dungeon (X: 121..123, Y: 232..233, Map 0)
    const stepRes = NavigationManager.checkGateStep(player, 0, 122, 233);
    assert.equal(stepRes.triggered, true);
    assert.equal(stepRes.targetGateId, 2); // Gate 2 (Dungeon)
    assert.equal(stepRes.targetMap, 1); // Dungeon é Map 1

    // Fora do portal
    const missRes = NavigationManager.checkGateStep(player, 0, 50, 50);
    assert.equal(missRes.triggered, false);
  });
});
