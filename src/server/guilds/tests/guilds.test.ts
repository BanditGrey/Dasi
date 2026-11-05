/**
 * Dasi MMORPG - Testes Unitários do Sistema de Guildas
 *
 * Cobre fundação, convites, cargos, saída/expulsão, alianças, tesouro,
 * Imposto Territorial e a Manta do Imperador Supremo (Asas da Coroa).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  GuildSystem,
  GuildRank,
  GUILD_LIMITS,
  TERRITORIAL_TAX_BY_BIOME,
  CROWN_CLOAK_DEF_ID,
} from '../GuildSystem.ts';

/** Ator mínimo aceito pelo GuildSystem (mesma forma de uma sessão real) */
function actor(sessionId: string, name: string, overrides: Record<string, unknown> = {}) {
  return {
    sessionId,
    character: { name, level: 200, zen: 1_000_000, ...overrides },
  };
}

function createFundedGuild(system: GuildSystem) {
  const master = actor('sess-master', 'Valdaran');
  const joined = system.createGuild(master, 'Loren Guard', 1_000);
  assert.strictEqual(joined.success, true, joined.error ?? 'esperado sucesso');
  return { master, guild: joined.guild! };
}

describe('1. Fundação de guilda (GuildSystem.createGuild)', () => {
  it('Cobra o custo de fundação, define o Mestre e entra no índice de sessões', () => {
    const system = new GuildSystem();
    const master = actor('sess-master', 'Valdaran');

    const result = system.createGuild(master, 'Loren Guard', 1_000);

    assert.strictEqual(result.success, true, result.error ?? 'esperado sucesso');
    assert.strictEqual(result.guild!.masterSessionId, 'sess-master');
    assert.strictEqual(result.guild!.members.get('sess-master')!.rank, GuildRank.MASTER);
    assert.strictEqual(master.character.zen, 1_000_000 - GUILD_LIMITS.FOUNDING_COST_ZEN);
    assert.strictEqual(system.getGuildOfSession('sess-master')!.id, result.guild!.id);
  });

  it('Rejeita nível insuficiente, Zen insuficiente e nome duplicado', () => {
    const system = new GuildSystem();

    const lowLevel = system.createGuild(actor('a', 'Novato', { level: 10 }), 'Aurora');
    assert.strictEqual(lowLevel.success, false);
    assert.match(lowLevel.error!, /nível/);

    const poor = system.createGuild(actor('b', 'Mendigo', { zen: 10 }), 'Aurora');
    assert.strictEqual(poor.success, false);
    assert.match(poor.error!, /Zen/);

    createFundedGuild(system);
    const duplicate = system.createGuild(actor('c', 'Outro'), 'LOREN GUARD');
    assert.strictEqual(duplicate.success, false);
    assert.match(duplicate.error!, /Já existe/);
  });

  it('Limita o nome da guilda e bloqueia quem já tem guilda', () => {
    const system = new GuildSystem();
    const master = actor('sess-master', 'Valdaran');

    assert.strictEqual(system.createGuild(master, 'AB').success, false);
    assert.strictEqual(system.createGuild(master, 'X'.repeat(20)).success, false);

    assert.strictEqual(system.createGuild(master, 'Legião').success, true);
    const twice = system.createGuild(master, 'Outra Legião');
    assert.strictEqual(twice.success, false);
    assert.match(twice.error!, /já pertence/);
  });
});

describe('2. Convites, cargos e membros', () => {
  it('Convida, aceita e promove a Sub-líder', () => {
    const system = new GuildSystem();
    const { master, guild } = createFundedGuild(system);
    const recruit = actor('sess-recruit', 'Selene');

    const invite = system.inviteMember(master, recruit, 2_000);
    assert.strictEqual(invite.success, true, invite.error ?? 'esperado sucesso');
    assert.strictEqual(system.getPendingInvitations('sess-recruit').length, 1);

    const accepted = system.acceptInvitation(recruit, guild.id, 3_000);
    assert.strictEqual(accepted.success, true, accepted.error ?? 'esperado sucesso');
    assert.strictEqual(guild.members.size, 2);
    assert.strictEqual(system.getRank('sess-recruit'), GuildRank.MEMBER);

    const promoted = system.setRank(master, 'sess-recruit', GuildRank.SUB_LEADER);
    assert.strictEqual(promoted.success, true, promoted.error ?? 'esperado sucesso');
    assert.strictEqual(system.isLeadership('sess-recruit'), true);
  });

  it('Recusa convite e impede convite de membro comum', () => {
    const system = new GuildSystem();
    const { master } = createFundedGuild(system);
    const guest = actor('sess-guest', 'Kael');

    system.inviteMember(master, guest);
    const declined = system.declineInvitation(guest);
    assert.strictEqual(declined.success, true);
    assert.strictEqual(system.getPendingInvitations('sess-guest').length, 0);

    const outsider = actor('sess-outsider', 'Nina');
    const fromOutsider = system.inviteMember(outsider, guest);
    assert.strictEqual(fromOutsider.success, false);
    assert.match(fromOutsider.error!, /nenhuma guilda/);
  });

  it('Respeita o teto de membros', () => {
    const system = new GuildSystem();
    const { master, guild } = createFundedGuild(system);

    for (let i = 1; i < GUILD_LIMITS.MAX_MEMBERS; i++) {
      const member = actor(`sess-${i}`, `Membro${i}`);
      assert.strictEqual(system.inviteMember(master, member).success, true);
      assert.strictEqual(system.acceptInvitation(member, guild.id).success, true);
    }

    const extra = actor('sess-extra', 'Extra');
    const overflow = system.inviteMember(master, extra);
    assert.strictEqual(overflow.success, false);
    assert.match(overflow.error!, /limite/);
  });

  it('Transfere liderança, expulsa membros e dissolve a guilda ao esvaziar', () => {
    const system = new GuildSystem();
    const { master, guild } = createFundedGuild(system);
    const recruit = actor('sess-recruit', 'Selene');
    system.inviteMember(master, recruit);
    system.acceptInvitation(recruit, guild.id);

    const transferred = system.transferLeadership(master, 'sess-recruit');
    assert.strictEqual(transferred.success, true, transferred.error ?? 'esperado sucesso');
    assert.strictEqual(guild.masterSessionId, 'sess-recruit');
    assert.strictEqual(system.getRank('sess-master'), GuildRank.SUB_LEADER);

    const kicked = system.removeMember(recruit, 'sess-master');
    assert.strictEqual(kicked.success, true, kicked.error ?? 'esperado sucesso');
    assert.strictEqual(guild.members.size, 1);

    const left = system.leaveGuild(recruit);
    assert.strictEqual(left.success, true, left.error ?? 'esperado sucesso');
    assert.strictEqual(system.getGuild(guild.id), undefined);
  });

  it('Mestre com outros membros precisa transferir antes de sair', () => {
    const system = new GuildSystem();
    const { master, guild } = createFundedGuild(system);
    const recruit = actor('sess-recruit', 'Selene');
    system.inviteMember(master, recruit);
    system.acceptInvitation(recruit, guild.id);

    const leaving = system.leaveGuild(master);
    assert.strictEqual(leaving.success, false);
    assert.match(leaving.error!, /Transfira a liderança/);
  });
});

describe('3. Alianças', () => {
  it('Cria aliança simétrica e rompe dos dois lados', () => {
    const system = new GuildSystem();
    const a = actor('sess-a', 'Alfa');
    const b = actor('sess-b', 'Beta');
    const guildA = system.createGuild(a, 'Alfa').guild!;
    const guildB = system.createGuild(b, 'Beta').guild!;

    const allied = system.proposeAlliance(a, guildB.id);
    assert.strictEqual(allied.success, true, allied.error ?? 'esperado sucesso');
    assert.strictEqual(system.areAllied(guildA.id, guildB.id), true);
    assert.strictEqual(system.areAllied(guildB.id, guildA.id), true);

    const broken = system.breakAlliance(b, guildA.id);
    assert.strictEqual(broken.success, true, broken.error ?? 'esperado sucesso');
    assert.strictEqual(system.areAllied(guildA.id, guildB.id), false);
  });

  it('Só o Mestre firma alianças e o limite de 3 é respeitado', () => {
    const system = new GuildSystem();
    const leader = actor('sess-leader', 'Líder');
    const mainGuild = system.createGuild(leader, 'Principal').guild!;

    const member = actor('sess-member', 'Membro');
    system.inviteMember(leader, member);
    system.acceptInvitation(member, mainGuild.id);

    assert.strictEqual(system.proposeAlliance(member, 'guild-x').success, false);

    for (let i = 0; i < GUILD_LIMITS.MAX_ALLIANCES; i++) {
      const other = actor(`sess-ally-${i}`, `Aliada${i}`);
      const otherGuild = system.createGuild(other, `Aliada${i}`).guild!;
      assert.strictEqual(system.proposeAlliance(leader, otherGuild.id).success, true);
    }

    const extra = actor('sess-ally-extra', 'AliadaExtra');
    const extraGuild = system.createGuild(extra, 'AliadaExtra').guild!;
    const overflow = system.proposeAlliance(leader, extraGuild.id);
    assert.strictEqual(overflow.success, false);
    assert.match(overflow.error!, /Limite/);
  });
});

describe('4. Tesouro e Imposto Territorial', () => {
  it('Deposita no tesouro debitando o Zen do jogador', () => {
    const system = new GuildSystem();
    const { master, guild } = createFundedGuild(system);
    master.character.zen = 50_000;

    const deposit = system.depositToTreasury(master, 20_000);
    assert.strictEqual(deposit.success, true, deposit.error ?? 'esperado sucesso');
    assert.strictEqual(guild.treasuryZen, 20_000);
    assert.strictEqual(master.character.zen, 30_000);
    assert.strictEqual(guild.members.get('sess-master')!.contributedZen, 20_000);
  });

  it('Sem dono do castelo, nenhum imposto é cobrado', () => {
    const system = new GuildSystem();
    const result = system.applyTerritorialTax('VALLEY_OF_LOREN', 100_000);
    assert.strictEqual(result.tax, 0);
    assert.strictEqual(result.netZen, 100_000);
  });

  it('Com dono do castelo, aplica a alíquota do bioma no tesouro', () => {
    const system = new GuildSystem();
    const { guild } = createFundedGuild(system);
    assert.strictEqual(system.setCastleOwner(guild.id).success, true);

    const valley = system.applyTerritorialTax('VALLEY_OF_LOREN', 100_000);
    assert.strictEqual(valley.rate, TERRITORIAL_TAX_BY_BIOME.VALLEY_OF_LOREN);
    assert.strictEqual(valley.tax, 7_000);
    assert.strictEqual(valley.netZen, 93_000);
    assert.strictEqual(guild.treasuryZen, 7_000);

    const noria = system.applyTerritorialTax('NORIA', 100_000);
    assert.strictEqual(noria.tax, 3_000);
    assert.strictEqual(guild.treasuryZen, 10_000);
    assert.strictEqual(guild.totalTaxCollected, 10_000);
  });
});

describe('5. Asas da Coroa (Manta do Imperador Supremo)', () => {
  it('Concede a manta ao Mestre vencedor e revoga do anterior', () => {
    const system = new GuildSystem();
    const first = system.createGuild(actor('sess-first', 'Primeiro'), 'Primeira').guild!;
    const second = system.createGuild(actor('sess-second', 'Segundo'), 'Segunda').guild!;

    system.setCastleOwner(first.id);
    assert.strictEqual(system.isCrownCloakHolder('sess-first'), true);

    system.setCastleOwner(second.id);
    assert.strictEqual(system.isCrownCloakHolder('sess-first'), false);
    assert.strictEqual(system.isCrownCloakHolder('sess-second'), true);
    assert.strictEqual(system.getCastleOwner()!.id, second.id);
  });

  it('Dissolver a guilda dona libera o castelo', () => {
    const system = new GuildSystem();
    const { guild } = createFundedGuild(system);
    system.setCastleOwner(guild.id);

    system.dissolveGuild(guild.id);

    assert.strictEqual(system.getCastleOwner(), null);
    assert.strictEqual(system.isCrownCloakHolder('sess-master'), false);
  });

  it('Usa o cosmético canônico da Manta', () => {
    assert.strictEqual(CROWN_CLOAK_DEF_ID, 'cloak_of_supreme_emperor');
  });
});
