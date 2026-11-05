/**
 * Dasi MMORPG - Testes Unitários das Arenas de Eventos Clássicas
 * Valida Blood Castle (Ponte e Portão), Devil Square (Ondas), Chaos Castle (Lajes Móveis) e Duelo 1v1.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BloodCastleInstance } from '../BloodCastleInstance.ts';
import { DevilSquareInstance } from '../DevilSquareInstance.ts';
import { ChaosCastleInstance } from '../ChaosCastleInstance.ts';
import { DuelColiseumInstance } from '../DuelColiseumInstance.ts';
import { EventManager } from '../EventManager.ts';
import { SessionManager } from '../../network/SessionManager.ts';
import { Item } from '../../inventory/Item.ts';

describe('1. Blood Castle (BloodCastleInstance.ts)', () => {
  it('Ciclo completo: Quota de Mobs -> Quebra do Portão -> Feiticeiros -> Entrega ao Arcanjo', () => {
    const bc = new BloodCastleInstance({
      instanceId: 'bc-test-1',
      bridgeMobQuota: 5,
      gateMaxHp: 2000,
      sorcerersCount: 2,
    });

    const now = 100000;
    bc.start(now);
    bc.addParticipant('sess-hero');

    assert.strictEqual(bc.stage, 'BRIDGE_KILL_QUOTA');

    // 1. Elimina monstros na ponte até cumprir a quota
    for (let i = 0; i < 4; i++) {
      const q = bc.recordBridgeKill();
      assert.strictEqual(q.quotaCompleted, false);
    }
    const qFinal = bc.recordBridgeKill();
    assert.strictEqual(qFinal.quotaCompleted, true);
    assert.strictEqual(bc.stage, 'CASTLE_GATE_ASSAULT');

    // 2. Ataca o Portão do Castelo até estilhaçar
    const a1 = bc.attackGate(1200);
    assert.strictEqual(a1.destroyed, false);
    assert.strictEqual(bc.gateHp, 800);

    const a2 = bc.attackGate(900);
    assert.strictEqual(a2.destroyed, true);
    assert.strictEqual(bc.gateDestroyed, true);
    assert.strictEqual(bc.stage, 'SANCTUM_SORCERERS');

    // 3. Derrota Feiticeiros no pátio interior
    const s1 = bc.recordSorcererKill();
    assert.strictEqual(s1.allSorcerersDead, false);
    const s2 = bc.recordSorcererKill();
    assert.strictEqual(s2.allSorcerersDead, true);
    assert.strictEqual(s2.weaponRevealed, true);
    assert.strictEqual(bc.stage, 'ARCHANGEL_WEAPON_DELIVERY');

    // 4. Coleta a Arma Celestial e entrega ao Arcanjo
    const pickupOk = bc.pickupArchangelWeapon('sess-hero');
    assert.strictEqual(pickupOk, true);
    assert.strictEqual(bc.weaponCarrierSessionId, 'sess-hero');

    const delivery = bc.deliverWeaponToArchangel('sess-hero', now + 60000); // Entregou com 14 minutos restantes
    assert.strictEqual(delivery.success, true);
    assert.strictEqual(bc.stage, 'TRIUMPH');
    assert.ok(delivery.rewards);
    assert.ok(delivery.rewards?.jewels.includes('jewel_of_blessing'));
    assert.ok(delivery.rewards?.jewels.includes('jewel_of_chaos'));
  });

  it('Expira por tempo limite e transiciona para FAILED', () => {
    const bc = new BloodCastleInstance({ instanceId: 'bc-test-timeout', durationMs: 5000 });
    const now = 100000;
    bc.start(now);

    const update1 = bc.update(now + 2000);
    assert.strictEqual(update1.failed, false);

    const update2 = bc.update(now + 6000);
    assert.strictEqual(update2.failed, true);
    assert.strictEqual(bc.stage, 'FAILED');
  });
});

describe('2. Devil Square (DevilSquareInstance.ts)', () => {
  it('Avança pelas 4 ondas de monstros com contagem de pontos e pilares de chamas', () => {
    const ds = new DevilSquareInstance('ds-test-1');
    const now = 200000;
    ds.start(now);
    ds.addParticipant('sess-mage');

    assert.strictEqual(ds.currentWaveIndex, 1);
    assert.strictEqual(ds.state, 'WAVE_ACTIVE');

    // Abates na onda 1
    ds.recordKill('spider');
    ds.recordKill('spider');
    assert.strictEqual(ds.killsCount, 2);
    assert.strictEqual(ds.score, 40);

    // Atualiza rotação dos pilares de fogo
    const initialAngle = ds.pillars[0].flameAngleDeg;
    ds.update(now + 1000, 1.0);
    assert.notStrictEqual(ds.pillars[0].flameAngleDeg, initialAngle, 'Pilares devem rotacionar chamas');

    // Simula transição para a onda 2 por expiração do tempo da onda 1
    const w1Duration = ds.waves[0].durationMs;
    const tickWave2 = ds.update(now + w1Duration + 10, 0.1);
    assert.strictEqual(tickWave2.waveAdvanced, true);
    assert.strictEqual(ds.currentWaveIndex, 2);

    // Simula conclusão de todas as 4 ondas sequencialmente
    let curTime = now + ds.waves[0].durationMs + 10;
    ds.update(curTime, 0.1); // Avança para Onda 2
    curTime += ds.waves[1].durationMs + 10;
    ds.update(curTime, 0.1); // Avança para Onda 3
    curTime += ds.waves[2].durationMs + 10;
    ds.update(curTime, 0.1); // Avança para Onda 4
    curTime += ds.waves[3].durationMs + 10;
    const tickTriumph = ds.update(curTime, 0.1); // Triunfo ao término da Onda 4
    assert.strictEqual(tickTriumph.triumph, true);
    assert.strictEqual(ds.state, 'TRIUMPH');

    const rewards = ds.generateTriumphRewards();
    assert.ok(rewards.jewels.length >= 4);
    assert.ok(rewards.xpBonus > 0);
  });
});

describe('3. Chaos Castle (ChaosCastleInstance.ts)', () => {
  it('Arena encolhe em 3 estágios (42m -> 28m -> 14m) e elimina combatentes por knockback no abismo', () => {
    const cc = new ChaosCastleInstance('cc-test-1');
    // Adiciona 10 combatentes (1 jogador no centro e 9 bots distribuídos radialmente)
    cc.addCombatant('player-1', 'Gladiator', true, 1000, 0, 0);
    for (let i = 2; i <= 10; i++) {
      const angle = ((i - 2) / 9) * Math.PI * 2;
      cc.addCombatant(`bot-${i}`, `Bot ${i}`, false, 100, Math.cos(angle) * 3.5, Math.sin(angle) * 3.5);
    }

    cc.start(Date.now());
    assert.strictEqual(cc.stage, 'STAGE_1_FULL');
    assert.strictEqual(cc.currentHalfSize, 21.0);
    assert.strictEqual(cc.getAliveCount(), 10);

    // Derrota 3 bots para baixar sobreviventes para 70% (<= 75% -> Colapso 1)
    cc.damageCombatant('bot-2', 500);
    cc.damageCombatant('bot-3', 500);
    const resCollapse1 = cc.damageCombatant('bot-4', 500);

    assert.strictEqual(resCollapse1.stageAdvanced, true);
    assert.strictEqual(cc.stage, 'STAGE_2_COLLAPSED_1');
    assert.strictEqual(cc.currentHalfSize, 14.0, 'Arena deve encolher para 28x28m (raio 14m)');

    // Derrota mais bots até sobrar <= 40% (4 bots/jogadores) -> Colapso 2
    cc.damageCombatant('bot-5', 500);
    cc.damageCombatant('bot-6', 500);
    const resCollapse2 = cc.damageCombatant('bot-7', 500);

    assert.strictEqual(resCollapse2.stageAdvanced, true);
    assert.strictEqual(cc.stage, 'STAGE_3_COLLAPSED_2');
    assert.strictEqual(cc.currentHalfSize, 7.0, 'Arena deve encolher para 14x14m (raio 7m)');

    // Elimina os últimos até restar 1 (Last Man Standing)
    cc.damageCombatant('bot-8', 500);
    cc.damageCombatant('bot-9', 500);
    const finalKill = cc.damageCombatant('bot-10', 500);

    assert.strictEqual(finalKill.winner, 'player-1', 'Player 1 deve ser o último sobrevivente vitorioso');
    assert.strictEqual(cc.stage, 'FINISHED');
  });
});

describe('4. Coliseu de Duelos 1v1 (DuelColiseumInstance.ts)', () => {
  it('Pareia duelistas, realiza contagem regressiva, contabiliza abates até vitória e barra espectadores', () => {
    const duel = new DuelColiseumInstance('duel-test-1', 3); // Primeiro a 3 pontos vence
    const now = 500000;

    // Registro do Duelista 1
    const r1 = duel.registerDuelist('sess-d1', 'Ares', 'DK', 200, 2000, now);
    assert.strictEqual(r1, true);
    assert.strictEqual(duel.state, 'WAITING_PLAYERS');

    // Registro do Duelista 2
    const r2 = duel.registerDuelist('sess-d2', 'Athena', 'DW', 195, 1500, now);
    assert.strictEqual(r2, true);
    assert.strictEqual(duel.state, 'COUNTDOWN');

    // Contagem regressiva conclui
    const cTick = duel.update(now + 4500);
    assert.strictEqual(cTick.state, 'FIGHTING');

    // Validação de barreira de espectador
    duel.addSpectator('sess-spec');
    const specAllowed = duel.isActionPermitted('sess-spec', 0, 0);
    assert.strictEqual(specAllowed, false, 'Espectadores não podem intervir no duelo');

    const duelistAllowed = duel.isActionPermitted('sess-d1', 5, 5);
    assert.strictEqual(duelistAllowed, true);

    // Abates de Ares (3 seguidos até a vitória)
    duel.recordKill('sess-d1', now + 10000);
    assert.strictEqual(duel.duelist1?.score, 1);
    duel.update(now + 15000); // Conclui contagem entre rounds
    duel.recordKill('sess-d1', now + 20000);
    assert.strictEqual(duel.duelist1?.score, 2);
    duel.update(now + 25000); // Conclui contagem entre rounds

    const matchEnd = duel.recordKill('sess-d1', now + 30000);
    assert.strictEqual(matchEnd.isMatchOver, true);
    assert.strictEqual(matchEnd.matchWinner, 'Ares');
    assert.strictEqual(duel.state, 'MATCH_OVER');
  });
});

describe('5. Gerenciador de Eventos (EventManager.ts)', () => {
  it('Valida ingressos obrigatórios (Invisibility Cloak, Devil Invitation, Chaos Armor)', () => {
    const eventManager = new EventManager();
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({} as any);
    session.characterName = 'EventTester';

    // 1. Tenta entrar no Blood Castle sem Capa
    const bcFail = eventManager.enterEvent('BLOOD_CASTLE', session);
    assert.strictEqual(bcFail.success, false);
    assert.ok(bcFail.error?.includes('Invisibility Cloak'));

    // Libera espaço no grid para os itens de teste
    for (const p of session.inventory.getAllGridItems()) {
      session.inventory.removeItem(p.item.uuid);
    }

    // Dá a Capa ao jogador e tenta novamente
    const cloak = Item.create('cloak_of_invisibility');
    const addedCloak = session.inventory.addItem(cloak, 0, 0);
    assert.strictEqual(addedCloak, true);
    assert.strictEqual(session.inventory.hasItem('cloak_of_invisibility'), true);

    const bcSuccess = eventManager.enterEvent('BLOOD_CASTLE', session);
    assert.strictEqual(bcSuccess.success, true);
    assert.strictEqual(session.inventory.hasItem('cloak_of_invisibility'), false, 'Capa deve ser consumida na entrada');

    // 2. Devil Square com Convite
    const invite = Item.create('devil_square_invitation');
    session.inventory.addItem(invite, 0, 0);
    const dsSuccess = eventManager.enterEvent('DEVIL_SQUARE', session);
    assert.strictEqual(dsSuccess.success, true);

    // 3. Chaos Castle com Armadura
    const chaosArmor = Item.create('armor_of_chaos');
    session.inventory.addItem(chaosArmor, 0, 0);
    const ccSuccess = eventManager.enterEvent('CHAOS_CASTLE', session);
    assert.strictEqual(ccSuccess.success, true);
  });
});
