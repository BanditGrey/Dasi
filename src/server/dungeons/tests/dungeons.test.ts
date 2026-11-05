/**
 * Dasi MMORPG - Testes Unitários das Catacumbas Subterrâneas (Dungeon)
 * Valida progressão pelos 3 andares, mecânicas de chaves, válvulas, lodo tóxico e derrota do Gorgon.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DungeonInstance } from '../DungeonInstance.ts';
import { DungeonManager } from '../DungeonManager.ts';
import { SessionManager } from '../../network/SessionManager.ts';

describe('1. Instância Multi-Andares do Dungeon (DungeonInstance.ts)', () => {
  it('Progressão completa pelos 3 andares com objetivos, chaves, válvulas e batalha contra Gorgon', () => {
    const dng = new DungeonInstance('dng-unit-1', 15 * 60 * 1000);
    const now = 300000;
    dng.start(now);
    dng.addParticipant('sess-dungeon-crawler');

    assert.strictEqual(dng.currentFloor, 1);
    assert.strictEqual(dng.state, 'ACTIVE');

    // Andar 1: Tenta abrir portão sem a chave (deve falhar)
    const gateFail = dng.unlockFloor1Gate();
    assert.strictEqual(gateFail, false);

    // Coleta a Chave dos Ossos e destranca o portão do Andar 1 -> Avança para o Andar 2
    dng.collectBoneKey();
    assert.strictEqual(dng.boneKeyFound, true);
    const gateOk = dng.unlockFloor1Gate();
    assert.strictEqual(gateOk, true);
    assert.strictEqual(dng.currentFloor, 2);

    // Andar 2: Lodo tóxico ativo
    assert.strictEqual(dng.toxicMudActive, true);
    // Ativa a primeira válvula
    const v1 = dng.activateDrainValve();
    assert.strictEqual(v1.valvesActivated, 1);
    assert.strictEqual(v1.mudDrained, false);

    // Ativa a segunda válvula -> Drena o esgoto e avança para o Andar 3
    const v2 = dng.activateDrainValve();
    assert.strictEqual(v2.valvesActivated, 2);
    assert.strictEqual(v2.mudDrained, true);
    assert.strictEqual(dng.toxicMudActive, false);
    assert.strictEqual(dng.currentFloor, 3);
    assert.ok(dng.gorgonBoss, 'Gorgon deve ter sido instanciado no Andar 3');
    assert.strictEqual(dng.gorgonBoss?.name, 'Gorgon');

    // Andar 3: Destruição de pilares rúnicos durante o combate
    assert.strictEqual(dng.pillarsRemaining, 8);
    dng.destroyPillar();
    dng.destroyPillar();
    assert.strictEqual(dng.pillarsRemaining, 6);

    // Derrota Gorgon e conclui a Dungeon com sucesso
    const defeated = dng.recordGorgonDefeated();
    assert.strictEqual(defeated, true);
    assert.strictEqual(dng.state, 'CLEARED');
    assert.strictEqual(dng.gorgonDefeated, true);

    // Avaliação de Classificação (Rank S para corrida rápida de 2 minutos sem mortes)
    const rankInfo = dng.calculateRank(now + 120 * 1000);
    assert.strictEqual(rankInfo.rank, 'S');
    assert.ok(rankInfo.rewards.jewels.length >= 4);
    assert.strictEqual(rankInfo.rewards.boxDefId, 'box_of_kundun_4');
    assert.ok(rankInfo.rewards.zen >= 400000);
  });

  it('Classificação rebaixa para Rank B ou C se demorar mais tempo ou sofrer mortes', () => {
    const dng = new DungeonInstance('dng-unit-slow', 15 * 60 * 1000);
    const now = 400000;
    dng.start(now);
    dng.deathsCount = 3;

    // Conclusão com 11 minutos decorridos e 3 mortes
    const rankInfo = dng.calculateRank(now + 700 * 1000);
    assert.ok(rankInfo.rank === 'B' || rankInfo.rank === 'C');
  });
});

describe('2. Gerenciador de Dungeons (DungeonManager.ts)', () => {
  it('Controla sessões de jogadores, entrada única e limpeza por timeout', () => {
    const manager = new DungeonManager();
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({} as any);

    // Primeira entrada: cria nova instância
    const entry1 = manager.enterDungeon(session);
    assert.strictEqual(entry1.isNew, true);
    assert.strictEqual(entry1.instance.participants.has(session.sessionId), true);

    // Segunda chamada na mesma sessão: retorna a mesma instância ativa
    const entry2 = manager.enterDungeon(session);
    assert.strictEqual(entry2.isNew, false);
    assert.strictEqual(entry2.instance.id, entry1.instance.id);

    // Saída da dungeon
    manager.leaveDungeon(session.sessionId);
    assert.strictEqual(manager.getSessionInstance(session.sessionId), undefined);
  });
});
