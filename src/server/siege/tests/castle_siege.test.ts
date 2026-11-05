/**
 * Dasi MMORPG - Testes Unitários do Cerco ao Castelo
 *
 * Valida `docs/PVP_and_Castle_Siege.md` § 3 sobre `CastleSiegeManager`:
 * portão ciclópico (25M), Estátuas da Vida (4 × 8M), respawn defensor,
 * Selo da Coroa (2 pedestais + 30s contínuos) e sucessão do castelo.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GuildSystem, GuildRank } from '../../guilds/GuildSystem.ts';
import {
  CastleSiegeManager,
  CastleSiegePhase,
  SiegeStage,
  CROWN_SEAL_DURATION_MS,
} from '../CastleSiegeManager.ts';

function actor(sessionId: string, name: string, overrides: Record<string, unknown> = {}) {
  return {
    sessionId,
    character: { name, level: 200, zen: 2_000_000, ...overrides },
  };
}

/**
 * Monta uma guilda inscrita com um Mestre e um Sub-líder, com o cerco já em
 * batalha e o Salão do Trono liberado (portão + 4 estátuas destruídos).
 */
function setupSiege() {
  const guilds = new GuildSystem();
  const master = actor('sess-master', 'Valdaran');
  const sub = actor('sess-sub', 'Selene');

  const guild = guilds.createGuild(master, 'Loren Guard').guild!;
  guilds.inviteMember(master, sub);
  guilds.acceptInvitation(sub, guild.id);
  guilds.setRank(master, 'sess-sub', GuildRank.SUB_LEADER);

  const siege = new CastleSiegeManager(guilds, {
    crownSealDurationMs: CROWN_SEAL_DURATION_MS,
    battleDurationMs: 90 * 60 * 1000,
    registrationDurationMs: 60 * 60 * 1000,
  });

  return { guilds, guild, master, sub, siege };
}

/** Avança o cerco até o Salão do Trono liberado */
function openThrone(siege: CastleSiegeManager, guildId: string, now = 1000) {
  siege.openRegistration(0);
  assert.strictEqual(siege.registerGuild(guildId, 0).success, true);
  assert.strictEqual(siege.startBattle(now).success, true);
  assert.strictEqual(siege.damageStructure(guildId, 'cyclopean_iron_gate', 25_000_000).destroyed, true);
  for (const id of ['life_statue_nw', 'life_statue_ne', 'life_statue_sw', 'life_statue_se']) {
    assert.strictEqual(siege.damageStructure(guildId, id, 8_000_000).destroyed, true);
  }
  assert.strictEqual(siege.canReachThrone(), true);
}

describe('1. Estruturas do catálogo (SCENARIO_CATALOG)', () => {
  it('Importa apenas portão e Estátuas da Vida do Vale de Loren', () => {
    const { siege } = setupSiege();

    // 5 estruturas: portão + 4 estátuas (o Portão do Arcanjo é do Blood Castle)
    assert.strictEqual(siege.structures.size, 5);
    assert.strictEqual(siege.getStructure('archangel_gate'), undefined);

    const gate = siege.getGate()!;
    assert.strictEqual(gate.maxHp, 25_000_000);
    assert.strictEqual(gate.scenarioId, 'VOL_02');

    const statues = siege.getLifeStatues();
    assert.strictEqual(statues.length, 4);
    assert.strictEqual(statues.every((s) => s.maxHp === 8_000_000), true);
    assert.strictEqual(statues.every((s) => s.scenarioId === 'VOL_03'), true);
  });

  it('Rotula as estruturas em português para o cliente', () => {
    const { siege } = setupSiege();
    assert.strictEqual(siege.getGate()!.label, 'Portão Ciclópico de Ferro');
    assert.match(siege.getLifeStatues()[0].label, /Estátua da Vida/);
  });
});

describe('2. Inscrição e início da batalha', () => {
  it('Bloqueia inscrição fora da janela e guilda inexistente', () => {
    const { siege, guild } = setupSiege();

    const closed = siege.registerGuild(guild.id);
    assert.strictEqual(closed.success, false);
    assert.match(closed.error!, /fechadas/);

    siege.openRegistration(0);
    assert.strictEqual(siege.phase, CastleSiegePhase.REGISTRATION);
    assert.strictEqual(siege.registerGuild('guild-inexistente').success, false);
    assert.strictEqual(siege.registerGuild(guild.id).success, true);

    const duplicate = siege.registerGuild(guild.id);
    assert.strictEqual(duplicate.success, false);
    assert.match(duplicate.error!, /já está inscrita/);
  });

  it('Não começa sem guildas inscritas e restaura estruturas ao iniciar', () => {
    const { siege, guild } = setupSiege();

    siege.openRegistration(0);
    const noGuilds = new CastleSiegeManager(new GuildSystem());
    noGuilds.openRegistration(0);
    assert.strictEqual(noGuilds.startBattle(0).success, false);

    siege.registerGuild(guild.id);
    assert.strictEqual(siege.startBattle(1000).success, true);
    assert.strictEqual(siege.phase, CastleSiegePhase.BATTLE);
    assert.strictEqual(siege.stage, SiegeStage.GATE_ASSAULT);
    assert.strictEqual(siege.getGate()!.hp, 25_000_000);
    assert.strictEqual(siege.getScoreboard().length, 1);
  });

  it('A guilda dona do castelo entra automaticamente como defensora', () => {
    const { siege, guilds, guild } = setupSiege();
    guilds.setCastleOwner(guild.id);

    siege.openRegistration(0);

    assert.strictEqual(siege.registeredGuilds.has(guild.id), true);
  });

  it('Encerra a janela de inscrição no prazo', () => {
    const { siege } = setupSiege();
    siege.openRegistration(0);
    siege.update(siege.registrationEndsAt + 1);
    assert.strictEqual(siege.phase, CastleSiegePhase.CLOSED);
  });
});

describe('3. Portão ciclópico e Estátuas da Vida', () => {
  it('Portão bloqueia o pátio até ser destruído', () => {
    const { siege, guild } = setupSiege();
    siege.openRegistration(0);
    siege.registerGuild(guild.id);
    siege.startBattle(1000);

    const hit = siege.damageStructure(guild.id, 'cyclopean_iron_gate', 5_000_000);
    assert.strictEqual(hit.applied, 5_000_000);
    assert.strictEqual(hit.hp, 20_000_000);
    assert.strictEqual(siege.canReachStatues(), false);
    assert.strictEqual(siege.stage, SiegeStage.GATE_ASSAULT);

    const final = siege.damageStructure(guild.id, 'cyclopean_iron_gate', 20_000_000);
    assert.strictEqual(final.destroyed, true);
    assert.strictEqual(siege.canReachStatues(), true);
    assert.strictEqual(siege.stage, SiegeStage.COURTYARD_STATUES);
    assert.strictEqual(siege.getScoreboard()[0].damage, 25_000_000);
  });

  it('Cada Estátua derrubada empurra o respawn defensor para trás', () => {
    const { siege, guild } = setupSiege();
    siege.openRegistration(0);
    siege.registerGuild(guild.id);
    siege.startBattle(1000);
    siege.damageStructure(guild.id, 'cyclopean_iron_gate', 25_000_000);

    assert.strictEqual(siege.getDefenderRespawnScenario(), 'VOL_03');
    assert.strictEqual(siege.defendersHaveInvulnerability(), true);

    siege.damageStructure(guild.id, 'life_statue_nw', 8_000_000);
    assert.strictEqual(siege.getStandingStatuesCount(), 3);
    assert.strictEqual(siege.getDefenderRespawnScenario(), 'VOL_04');

    siege.damageStructure(guild.id, 'life_statue_ne', 8_000_000);
    assert.strictEqual(siege.getDefenderRespawnScenario(), 'VOL_04');

    siege.damageStructure(guild.id, 'life_statue_sw', 8_000_000);
    assert.strictEqual(siege.getDefenderRespawnScenario(), 'VOL_01');

    siege.damageStructure(guild.id, 'life_statue_se', 8_000_000);
    assert.strictEqual(siege.getDefenderRespawnScenario(), 'VOL_01');
    assert.strictEqual(siege.defendersHaveInvulnerability(), false);
    assert.strictEqual(siege.stage, SiegeStage.DRAWBRIDGE_CROSSING);
  });

  it('Aplica a regra de dano excedente e ignora guilda não inscrita', () => {
    const { siege, guild, guilds } = setupSiege();
    const outsider = guilds.createGuild(actor('sess-out', 'Outsider'), 'Outsiders').guild!;

    siege.openRegistration(0);
    siege.registerGuild(guild.id);
    siege.startBattle(1000);

    const denied = siege.damageStructure(outsider.id, 'cyclopean_iron_gate', 1_000_000);
    assert.strictEqual(denied.applied, 0);
    assert.strictEqual(siege.getGate()!.hp, 25_000_000);

    const overflow = siege.damageStructure(guild.id, 'cyclopean_iron_gate', 99_000_000);
    assert.strictEqual(overflow.applied, 25_000_000);
    assert.strictEqual(overflow.hp, 0);
  });
});

describe('4. Selo da Coroa (2 pedestais + 30s contínuos)', () => {
  it('Exige o Salão liberado para ocupar os pedestais', () => {
    const { siege, guild, sub } = setupSiege();
    siege.openRegistration(0);
    siege.registerGuild(guild.id);
    siege.startBattle(1000);

    const sealed = siege.occupyPedestal('sess-sub', 'west');
    assert.strictEqual(sealed.success, false);
    assert.match(sealed.error!, /selado/);
    assert.ok(sub.character.name);
  });

  it('Apenas liderança ocupa pedestal e cada lado exige jogador distinto', () => {
    const { siege, guild, guilds, master, sub } = setupSiege();
    const common = actor('sess-common', 'Plebeu');
    guilds.inviteMember(master, common);
    guilds.acceptInvitation(common, guild.id);

    openThrone(siege, guild.id);

    const notLeader = siege.occupyPedestal('sess-common', 'west');
    assert.strictEqual(notLeader.success, false);
    assert.match(notLeader.error!, /Sub-líderes/);

    assert.strictEqual(siege.occupyPedestal('sess-master', 'west').success, true);
    const sameOnBoth = siege.occupyPedestal('sess-master', 'east');
    assert.strictEqual(sameOnBoth.success, false);
    assert.strictEqual(siege.occupyPedestal('sess-sub', 'east').success, true);
    assert.strictEqual(siege.hasBothPedestals(), true);
    assert.ok(sub.character.name);
  });

  it('Canaliza 30s contínuos e conclui o cerco', () => {
    const { siege, guild, guilds } = setupSiege();
    openThrone(siege, guild.id);
    siege.occupyPedestal('sess-master', 'west');
    siege.occupyPedestal('sess-sub', 'east');

    assert.strictEqual(siege.beginCrownSeal('sess-master', 2000).success, true);
    assert.strictEqual(siege.stage, SiegeStage.CROWN_SEAL);

    let now = 2000;
    now += 15_000;
    let state = siege.update(now);
    assert.strictEqual(state.phase, CastleSiegePhase.BATTLE);
    assert.strictEqual(state.sealPercent, 50);

    now += 15_000;
    state = siege.update(now);
    assert.strictEqual(state.phase, CastleSiegePhase.CONCLUDED);
    assert.strictEqual(siege.stage, SiegeStage.TRIUMPH);
    assert.strictEqual(guilds.getCastleOwner()!.id, guild.id);
    assert.strictEqual(guilds.isCrownCloakHolder('sess-master'), true);
    assert.strictEqual(siege.lastResult!.guildId, guild.id);
  });

  it('Interrupção zera o progresso (empurrão, atordoamento ou morte)', () => {
    const { siege, guild } = setupSiege();
    openThrone(siege, guild.id);
    siege.occupyPedestal('sess-master', 'west');
    siege.occupyPedestal('sess-sub', 'east');
    siege.beginCrownSeal('sess-master', 2000);

    siege.update(2000 + 25_000);
    assert.strictEqual(siege.crownSeal.progressMs, 25_000);

    const interrupted = siege.interruptCrownSeal('atordoado');
    assert.strictEqual(interrupted.progressReset, true);
    assert.strictEqual(siege.crownSeal.progressMs, 0);
    assert.strictEqual(siege.crownSeal.masterSessionId, null);
    assert.strictEqual(siege.stage, SiegeStage.DRAWBRIDGE_CROSSING);
  });

  it('Perder um pedestal interrompe a canalização no próximo update', () => {
    const { siege, guild } = setupSiege();
    openThrone(siege, guild.id);
    siege.occupyPedestal('sess-master', 'west');
    siege.occupyPedestal('sess-sub', 'east');
    siege.beginCrownSeal('sess-master', 2000);
    siege.update(2000 + 10_000);

    siege.releasePedestal('sess-sub');
    siege.update(2000 + 10_500);

    assert.strictEqual(siege.crownSeal.progressMs, 0);
    assert.strictEqual(siege.crownSeal.masterSessionId, null);
  });

  it('Só o Mestre canaliza e a guilda precisa estar inscrita', () => {
    const { siege, guild } = setupSiege();
    openThrone(siege, guild.id);
    siege.occupyPedestal('sess-master', 'west');
    siege.occupyPedestal('sess-sub', 'east');

    const bySub = siege.beginCrownSeal('sess-sub', 2000);
    assert.strictEqual(bySub.success, false);
    assert.match(bySub.error!, /Mestre/);
  });

  it('Um pedestal não pode ser mantido sem canalização com apenas um lado ocupado', () => {
    const { siege, guild } = setupSiege();
    openThrone(siege, guild.id);
    siege.occupyPedestal('sess-master', 'west');

    const attempt = siege.beginCrownSeal('sess-master', 2000);
    assert.strictEqual(attempt.success, false);
    assert.match(attempt.error!, /dois pedestais/);
  });
});

describe('5. Fim da batalha e placar', () => {
  it('Sem Selo da Coroa até o fim, o castelo não muda de dono', () => {
    const { siege, guild, guilds } = setupSiege();
    openThrone(siege, guild.id);

    const state = siege.update(siege.battleEndsAt + 1);

    assert.strictEqual(state.phase, CastleSiegePhase.CONCLUDED);
    assert.strictEqual(siege.stage, SiegeStage.FAILED);
    assert.strictEqual(guilds.getCastleOwner(), null);
    assert.strictEqual(siege.lastResult, null);
  });

  it('Placar ordena guildas por dano e ignora estruturas já destruídas', () => {
    const { siege, guild, guilds } = setupSiege();
    const rival = guilds.createGuild(actor('sess-rival', 'Rival'), 'Rivais').guild!;

    siege.openRegistration(0);
    siege.registerGuild(guild.id);
    siege.registerGuild(rival.id);
    siege.startBattle(1000);

    siege.damageStructure(guild.id, 'cyclopean_iron_gate', 10_000_000);
    siege.damageStructure(rival.id, 'cyclopean_iron_gate', 15_000_000);

    const repeated = siege.damageStructure(rival.id, 'cyclopean_iron_gate', 1_000_000);
    assert.strictEqual(repeated.applied, 0, 'portão já destruído não gera dano');

    const board = siege.getScoreboard();
    assert.strictEqual(board.length, 2);
    assert.strictEqual(board[0].guildId, rival.id);
    assert.strictEqual(board[0].damage, 15_000_000);
  });

  it('Serializa o estado para o painel do cliente', () => {
    const { siege, guild } = setupSiege();
    openThrone(siege, guild.id);
    siege.occupyPedestal('sess-master', 'west');
    siege.occupyPedestal('sess-sub', 'east');
    siege.beginCrownSeal('sess-master', 2000);
    siege.update(2000 + 6_000);

    const json = siege.toJSON(2000 + 6_000) as Record<string, any>;

    assert.strictEqual(json.phase, CastleSiegePhase.BATTLE);
    assert.strictEqual(json.stage, SiegeStage.CROWN_SEAL);
    assert.strictEqual(json.standingStatues, 0);
    assert.strictEqual(json.crownSeal.progressPercent, 20);
    assert.strictEqual(json.gate.destroyed, true);
    assert.strictEqual(json.lifeStatues.length, 4);
    assert.deepStrictEqual(json.taxRateRange, [0.03, 0.07]);
  });
});
