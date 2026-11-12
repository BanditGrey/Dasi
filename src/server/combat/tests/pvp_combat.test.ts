/**
 * Dasi MMORPG - Testes Unitários de Combate PvP e Fórmulas Canônicas
 * Valida o motor autoritativo de combate entre jogadores:
 * - Fórmulas de Ataque e Defesa canônicas por classe
 * - Regra de Absorção do Escudo SD 90/10
 * - Combo Skill do Blade Knight (Passo 1 -> 2 -> 3)
 * - Absorção de Mana Shield do Soul Master (Cap 50%)
 * - Reflexão de Dano (Damage Reflect) da Summoner
 * - Trava de Posse de Loot (Top Hit Damage / 15s Loot Lock)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CombatEngine, type AttackRequest } from '../CombatEngine.ts';
import { CanonicalFormulas, CharacterClassId } from '../CanonicalFormulas.ts';
import { SessionManager, type ClientSession } from '../../network/SessionManager.ts';
import { Item } from '../../inventory/Item.ts';
import { EquipmentSlot } from '../../inventory/types.ts';

describe('Combate PvP Autoritativo e Fórmulas Canônicas (MU Season 5.2)', () => {
  const sessionManager = new SessionManager();

  function createTestSession(
    username: string,
    characterClass: string,
    x: number,
    y: number,
    stats?: { str?: number; agi?: number; vit?: number; ene?: number; cmd?: number; hp?: number; sd?: number }
  ): ClientSession {
    const session = sessionManager.createSession(`socket-${username}`);
    sessionManager.authenticateSession(session.sessionId, username, characterClass);
    session.x = x;
    session.y = y;

    if (stats) {
      if (stats.str !== undefined) session.character.strength = stats.str;
      if (stats.agi !== undefined) session.character.agility = stats.agi;
      if (stats.vit !== undefined) session.character.vitality = stats.vit;
      if (stats.ene !== undefined) session.character.energy = stats.ene;
      if (stats.cmd !== undefined) session.character.command = stats.cmd;
      if (stats.hp !== undefined) {
        session.currentHp = stats.hp;
        session.maxHp = stats.hp;
      }
      if (stats.sd !== undefined) {
        session.currentSd = stats.sd;
        session.maxSd = stats.sd;
      }
    }

    return session;
  }

  it('1. Combate PvP Padrão DK vs DW com Absorção Canônica SD 90/10', () => {
    const engine = new CombatEngine();
    const dk = createTestSession('BladeKnight_PvP', 'DK', 100, 100, {
      str: 600,
      agi: 200,
      vit: 150,
      ene: 100,
      hp: 1500,
      sd: 1000,
    });

    const dw = createTestSession('SoulMaster_PvP', 'DW', 120, 100, {
      str: 100,
      agi: 180,
      vit: 120,
      ene: 500,
      hp: 800,
      sd: 600,
    });

    const initialSd = dw.currentSd!;
    const initialHp = dw.currentHp!;

    // Ataque PvP do DK contra o DW
    const attackReq: AttackRequest = {
      targetMobId: dw.sessionId,
      playerX: dk.x!,
      playerY: dk.y!,
    };

    let result;
    do {
      result = engine.processPvPAttack(dk, dw, attackReq);
    } while (result.isMiss);

    assert.equal(result.success, true);
    assert.equal(result.isMiss, false);
    assert.ok(result.damage > 0, 'Dano deve ser maior que zero');
    assert.ok(result.sdDamage! > 0, 'SD deve absorver a maior parte do dano (90%)');
    assert.ok(result.hpDamage! > 0, '10% do dano deve penetrar diretamente no HP');

    // Valida proporção 90/10 exata da fórmula
    const expectedSdDmg = Math.floor((result.damage * 90) / 100);
    const expectedHpDmg = result.damage - expectedSdDmg;
    assert.equal(result.sdDamage, expectedSdDmg);
    assert.equal(result.hpDamage, expectedHpDmg);

    // Valida que o defensor teve SD e HP atualizados
    assert.equal(dw.currentSd, initialSd - expectedSdDmg);
    assert.equal(dw.currentHp, initialHp - expectedHpDmg);
  });

  it('2. Esgotamento do Escudo SD: quando SD zera, 100% do dano restante penetra no HP', () => {
    const engine = new CombatEngine();
    const attacker = createTestSession('Attacker', 'DK', 100, 100, { str: 800, agi: 200, hp: 1500, sd: 1000 });
    const target = createTestSession('LowSdTarget', 'DW', 105, 100, { str: 100, agi: 50, hp: 1000, sd: 20 }); // Apenas 20 de SD

    const req: AttackRequest = { targetMobId: target.sessionId, playerX: 100, playerY: 100 };
    let result;
    do {
      result = engine.processPvPAttack(attacker, target, req);
    } while (result.isMiss);

    assert.ok(result.damage > 20, 'Dano do DK supera os 20 de SD restantes');
    assert.equal(result.sdDamage, 20, 'Todo o SD restante de 20 foi esgotado');
    assert.equal(target.currentSd, 0, 'SD do alvo zerou');
    assert.equal(result.hpDamage, result.damage - 20, 'O dano restante que excedeu o SD foi 100% para o HP');
    assert.equal(target.currentHp, 1000 - result.hpDamage);
  });

  it('3. Sequência Canônica de Combo Skill do Blade Knight', () => {
    const engine = new CombatEngine();
    const bk = createTestSession('ComboMaster_BK', 'DK', 100, 100, {
      str: 600,
      agi: 200,
      vit: 200,
      ene: 200,
      hp: 2000,
      sd: 1200,
    });

    const target = createTestSession('Sandbag', 'DK', 105, 100, {
      str: 200,
      agi: 100,
      hp: 5000,
      sd: 3000,
    });

    // Passo 1: Habilidade de Arma (Cyclone)
    let res1;
    do {
      res1 = engine.processPvPAttack(bk, target, { targetMobId: target.sessionId, skillId: 'weapon_cyclone', playerX: 100, playerY: 100 });
    } while (res1.isMiss);
    assert.equal(res1.isCombo, false);

    // Passo 2: Twisting Slash
    let res2;
    do {
      res2 = engine.processPvPAttack(bk, target, { targetMobId: target.sessionId, skillId: 'twisting_slash', playerX: 100, playerY: 100 });
    } while (res2.isMiss);
    assert.equal(res2.isCombo, false);

    // Passo 3: Death Stab => DISPARA O COMBO SKILL!
    let res3;
    do {
      res3 = engine.processPvPAttack(bk, target, { targetMobId: target.sessionId, skillId: 'death_stab', playerX: 100, playerY: 100 });
    } while (res3.isMiss);

    assert.equal(res3.isCombo, true);
    // Fórmula Canônica de Dano do Combo: (Str + Dex + Ene) / 2 = (600 + 200 + 200) / 2 = 500
    const expectedComboDamage = Math.floor((600 + 200 + 200) / 2);
    assert.equal(res3.comboDamage, expectedComboDamage);
    assert.ok(res3.damage >= expectedComboDamage, 'Dano final inclui o bônus do Combo');
  });

  it('4. Mana Shield (Soul Barrier) do Soul Master absorve até o teto de 50%', () => {
    // Cálculo canônico: 10 + (Agi / 50) + (Ene / 200)
    // Agi: 150, Ene: 400 => 10 + 3 + 2 = 15%
    const msStats = CanonicalFormulas.calculateManaShield(150, 400);
    assert.equal(msStats.absorptionPercent, 15);
    assert.equal(msStats.durationSeconds, 70); // 60 + 400/40 = 70s

    // Atributos elevados devem respeitar o teto rígido de 50%
    const cappedStats = CanonicalFormulas.calculateManaShield(1500, 3000);
    assert.equal(cappedStats.absorptionPercent, 50, 'Mana Shield não pode exceder o teto canônico de 50%');

    // Teste no motor de PvP:
    const engine = new CombatEngine();
    const attacker = createTestSession('AttackerDK', 'DK', 100, 100, { str: 500, agi: 100, hp: 1000, sd: 500 });
    const defenderWithShield = createTestSession('ShieldedDW', 'DW', 110, 100, { str: 100, agi: 100, hp: 1000, sd: 500 });

    // Aplica buff ativo de Mana Shield de 40% de absorção no defensor
    defenderWithShield.activeBuffs = new Map([
      ['MANA_SHIELD', { value: 40, durationMs: 60000, expiresAt: Date.now() + 60000 }],
    ]);

    const req: AttackRequest = { targetMobId: defenderWithShield.sessionId, playerX: 100, playerY: 100 };
    let result;
    do {
      result = engine.processPvPAttack(attacker, defenderWithShield, req);
    } while (result.isMiss);

    assert.equal(result.success, true);
    assert.ok(result.damage > 0);
  });

  it('5. Reflexão de Dano (Damage Reflect) da Summoner', () => {
    const engine = new CombatEngine();
    const attacker = createTestSession('AggressiveDK', 'DK', 100, 100, { str: 600, agi: 100, hp: 1200, sd: 800 });
    const summoner = createTestSession('ReflectSU', 'SU', 110, 100, { str: 100, agi: 100, hp: 1500, sd: 1000 });

    // Aplica buff ativo de Reflexão de 35% de dano
    summoner.activeBuffs = new Map([
      ['DAMAGE_REFLECT', { value: 35, durationMs: 60000, expiresAt: Date.now() + 60000 }],
    ]);

    const initialAttackerHp = attacker.currentHp!;
    const req: AttackRequest = { targetMobId: summoner.sessionId, playerX: 100, playerY: 100 };

    let result;
    do {
      result = engine.processPvPAttack(attacker, summoner, req);
    } while (result.isMiss);

    assert.ok(result.reflectedDamage! > 0, 'Deve ter calculado dano refletido');
    const expectedReflect = Math.floor((result.damage * 35) / 100);
    assert.equal(result.reflectedDamage, expectedReflect);
    // Atacante sofreu a reflexão na sua própria vida
    assert.equal(attacker.currentHp, initialAttackerHp - expectedReflect);
  });

  it('6. Greater Fortitude (Swell Life) do Blade Knight', () => {
    // 12 + (Vit / 100) + (Ene / 20) [Cap: 100%]
    const gfNormal = CanonicalFormulas.calculateGreaterFortitude(200, 400);
    // 12 + 2 + 20 = 34%
    assert.equal(gfNormal.hpBonusPercent, 34);
    assert.equal(gfNormal.durationSeconds, 100); // 60 + 400/10 = 100s

    // Teste de teto de 100%
    const gfMax = CanonicalFormulas.calculateGreaterFortitude(3000, 3000);
    assert.equal(gfMax.hpBonusPercent, 100);
  });

  it('7. Proteção de Posse de Loot (Top Hit Damage): estranho não pode coletar item trancado', () => {
    const engine = new CombatEngine();
    const owner = createTestSession('LegitOwner', 'DK', 100, 100);
    const thief = createTestSession('LootThief', 'DK', 100, 100);

    const mob = engine.spawner.getAllMonsters()[0];
    mob.currentHp = 1;
    engine.clearMobDamageLog(mob.id);

    // O dono legítimo ataca e derrota o monstro
    let killResult;
    do {
      killResult = engine.processPlayerAttack(owner, {
        targetMobId: mob.id,
        playerX: mob.x - 10,
        playerY: mob.y,
      });
    } while (killResult.isMiss);

    assert.equal(killResult.isDead, true);
    assert.ok(killResult.dropsGenerated.length > 0);

    const drop = killResult.dropsGenerated[0];

    // Ladrão tenta coletar imediatamente (dentro dos 15 segundos de trava) => RECUSADO!
    const thiefAttempt = engine.pickupGroundItem(thief, drop.dropId, drop.x, drop.y);
    assert.equal(thiefAttempt.success, false);
    assert.equal(thiefAttempt.error, 'Item protegido pelo sistema de Top Hit Damage');

    // O dono legítimo tenta coletar => SUCESSO!
    const ownerAttempt = engine.pickupGroundItem(owner, drop.dropId, drop.x, drop.y);
    assert.equal(ownerAttempt.success, true);
    assert.equal(ownerAttempt.dropId, drop.dropId);
  });

  it('8. Membro da mesma Party pode coletar o item trancado durante o Loot Lock', () => {
    const engine = new CombatEngine();
    const partyId = 'party-victory-01';

    const p1 = createTestSession('PartyLeader', 'DK', 100, 100);
    p1.partyId = partyId;

    const p2 = createTestSession('PartyMember', 'DW', 100, 100);
    p2.partyId = partyId;

    const mob = engine.spawner.getAllMonsters()[1];
    mob.currentHp = 1;
    engine.clearMobDamageLog(mob.id);

    // Líder da party derrota o monstro
    let killResult;
    do {
      killResult = engine.processPlayerAttack(p1, {
        targetMobId: mob.id,
        playerX: mob.x - 10,
        playerY: mob.y,
      });
    } while (killResult.isMiss);

    const drop = killResult.dropsGenerated[0];

    // Membro da mesma party tenta coletar dentro dos 15 segundos => PERMITIDO!
    const memberPickup = engine.pickupGroundItem(p2, drop.dropId, drop.x, drop.y);
    assert.equal(memberPickup.success, true);
    assert.equal(memberPickup.dropId, drop.dropId);
  });
});
