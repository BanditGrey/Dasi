/**
 * Dasi MMORPG - Sistema de Guildas & Alianças (GuildSystem)
 *
 * Cobre as regras de `docs/PVP_and_Castle_Siege.md` § 3.2 na parte que não depende
 * do cerco em si:
 *   - fundação de guilda com 1 Mestre e até `MAX_MEMBERS` membros;
 *   - convites, aceitação, promoção de cargo, saída e expulsão;
 *   - alianças bilaterais simétricas entre guildas;
 *   - tesouro de guilda com contribuições e o **Imposto Territorial** cobrado
 *     sobre toda movimentação de Zen em lojas de NPC (3%–7% conforme o bioma);
 *   - **Asas da Coroa**: cosmético `cloak_of_supreme_emperor` concedido ao Mestre
 *     da guilda que controla o castelo, válido até a próxima batalha semanal.
 *
 * Toda a API é síncrona e determinística (sem relógio próprio quando `now` é
 * fornecido), para permitir testes e o uso direto pelo servidor autoritativo.
 */

import type { ScenarioBiome } from '../world/CollisionSystem.ts';

export const GuildRank = {
  MASTER: 'MASTER',
  SUB_LEADER: 'SUB_LEADER',
  MEMBER: 'MEMBER',
} as const;

export type GuildRank = typeof GuildRank[keyof typeof GuildRank];

export const GUILD_LIMITS = {
  MAX_MEMBERS: 32,
  /** Alianças simultâneas por guilda */
  MAX_ALLIANCES: 3,
  MIN_LEVEL_TO_FOUND: 100,
  FOUNDING_COST_ZEN: 500_000,
  /** Departamento de impostos: 3% (biomas básicos) a 7% (zonas de cerco) */
  MIN_TAX_RATE: 0.03,
  MAX_TAX_RATE: 0.07,
} as const;

/**
 * Imposto Territorial por bioma (docs/PVP_and_Castle_Siege.md §3.2 e
 * Valley_of_Loren_Castle_Siege_Level_Design.md §"Tributo Continental").
 * Zonas de Loren pagam mais: é o território efetivamente conquistado.
 */
export const TERRITORIAL_TAX_BY_BIOME: Record<string, number> = {
  LORENCIA: 0.05,
  NORIA: 0.03,
  DEVIAS: 0.04,
  DUNGEON: 0.04,
  LOST_TOWER: 0.05,
  ATLANS: 0.04,
  TARKAN: 0.05,
  ICARUS: 0.06,
  VALLEY_OF_LOREN: 0.07,
  BLOOD_CASTLE: 0.05,
  DEVIL_SQUARE: 0.05,
  CHAOS_CASTLE: 0.05,
  DUEL_COLISEUM: 0.04,
};

/** Item cosmético concedido ao Mestre do castelo (Manta do Imperador Supremo) */
export const CROWN_CLOAK_DEF_ID = 'cloak_of_supreme_emperor';

export interface GuildMember {
  sessionId: string;
  characterName: string;
  rank: GuildRank;
  joinedAt: number;
  /** Contribuição acumulada em Zen */
  contributedZen: number;
}

export interface Guild {
  id: string;
  name: string;
  /** Nome normalizado (upper-case) para busca e unicidade */
  normalizedName: string;
  masterSessionId: string;
  members: Map<string, GuildMember>;
  /** IDs de guildas aliadas (relação simétrica) */
  allies: Set<string>;
  /** Tesouro da guilda em Zen */
  treasuryZen: number;
  createdAt: number;
  /** Total arrecadado via Imposto Territorial desde a fundação */
  totalTaxCollected: number;
}

export interface PendingInvitation {
  guildId: string;
  invitedSessionId: string;
  invitedByName: string;
  createdAt: number;
}

export interface GuildActionResult {
  success: boolean;
  error?: string;
  guild?: Guild;
  message?: string;
}

/** Sessão mínima necessária — mantém o módulo desacoplado do GameServer. */
export interface GuildActor {
  sessionId: string;
  character: { name: string; level?: number; zen?: number; characterClass?: string };
}

export class GuildSystem {
  private guilds: Map<string, Guild> = new Map();
  private sessionToGuild: Map<string, string> = new Map();
  private invitations: Map<string, PendingInvitation> = new Map();
  private guildCounter = 1;

  /** Guilda que atualmente detém o Castelo do Vale de Loren */
  private castleOwnerGuildId: string | null = null;
  /** Sessões que carregam a Manta do Imperador Supremo */
  private crownCloakHolders: Set<string> = new Set();

  // ==========================================================================
  // CONSULTAS
  // ==========================================================================

  public getGuild(guildId: string): Guild | undefined {
    return this.guilds.get(guildId);
  }

  public getGuildByName(name: string): Guild | undefined {
    const normalized = this.normalizeName(name);
    for (const guild of this.guilds.values()) {
      if (guild.normalizedName === normalized) return guild;
    }
    return undefined;
  }

  public getGuildOfSession(sessionId: string): Guild | undefined {
    const guildId = this.sessionToGuild.get(sessionId);
    return guildId ? this.guilds.get(guildId) : undefined;
  }

  public getMember(sessionId: string): GuildMember | undefined {
    return this.getGuildOfSession(sessionId)?.members.get(sessionId);
  }

  public getAllGuilds(): Guild[] {
    return Array.from(this.guilds.values());
  }

  public getCastleOwner(): Guild | null {
    return this.castleOwnerGuildId ? this.guilds.get(this.castleOwnerGuildId) ?? null : null;
  }

  /** Cargo do membro, ou `null` se ele não pertence a nenhuma guilda */
  public getRank(sessionId: string): GuildRank | null {
    return this.getMember(sessionId)?.rank ?? null;
  }

  public isMaster(sessionId: string): boolean {
    return this.getRank(sessionId) === GuildRank.MASTER;
  }

  /** Sub-líder ou Mestre: quem pode manter os pedestais sagrados no Selo da Coroa */
  public isLeadership(sessionId: string): boolean {
    const rank = this.getRank(sessionId);
    return rank === GuildRank.MASTER || rank === GuildRank.SUB_LEADER;
  }

  public areAllied(guildIdA: string, guildIdB: string): boolean {
    if (guildIdA === guildIdB) return true;
    return this.guilds.get(guildIdA)?.allies.has(guildIdB) ?? false;
  }

  public getPendingInvitations(sessionId: string): PendingInvitation[] {
    return Array.from(this.invitations.values()).filter(
      (inv) => inv.invitedSessionId === sessionId
    );
  }

  // ==========================================================================
  // FUNDAÇÃO, ENTRADA E SAÍDA
  // ==========================================================================

  /**
   * Funda uma nova guilda. O fundador torna-se Mestre e paga `FOUNDING_COST_ZEN`.
   */
  public createGuild(actor: GuildActor, name: string, now = Date.now()): GuildActionResult {
    const trimmed = (name || '').trim();
    const validationError = this.validateGuildName(trimmed);
    if (validationError) return { success: false, error: validationError };

    if (this.getGuildOfSession(actor.sessionId)) {
      return { success: false, error: 'Você já pertence a uma guilda. Saia dela antes de fundar outra.' };
    }

    const level = actor.character?.level ?? 1;
    if (level < GUILD_LIMITS.MIN_LEVEL_TO_FOUND) {
      return {
        success: false,
        error: `É necessário nível ${GUILD_LIMITS.MIN_LEVEL_TO_FOUND} para fundar uma guilda (atual: ${level}).`,
      };
    }

    const zen = actor.character?.zen ?? 0;
    if (zen < GUILD_LIMITS.FOUNDING_COST_ZEN) {
      return {
        success: false,
        error: `Fundar uma guilda custa ${GUILD_LIMITS.FOUNDING_COST_ZEN.toLocaleString('pt-BR')} Zen (possui ${zen.toLocaleString('pt-BR')}).`,
      };
    }

    if (this.getGuildByName(trimmed)) {
      return { success: false, error: `Já existe uma guilda chamada "${trimmed}".` };
    }

    actor.character.zen = zen - GUILD_LIMITS.FOUNDING_COST_ZEN;

    const guild: Guild = {
      id: `guild-${(this.guildCounter++).toString(16)}`,
      name: trimmed,
      normalizedName: this.normalizeName(trimmed),
      masterSessionId: actor.sessionId,
      members: new Map(),
      allies: new Set(),
      treasuryZen: 0,
      createdAt: now,
      totalTaxCollected: 0,
    };

    guild.members.set(actor.sessionId, {
      sessionId: actor.sessionId,
      characterName: actor.character?.name || 'Hero',
      rank: GuildRank.MASTER,
      joinedAt: now,
      contributedZen: 0,
    });

    this.guilds.set(guild.id, guild);
    this.sessionToGuild.set(actor.sessionId, guild.id);

    return {
      success: true,
      guild,
      message: `Guilda "${guild.name}" fundada! Que os portões do Vale de Loren se curvem à sua aliança.`,
    };
  }

  public inviteMember(actor: GuildActor, target: GuildActor, now = Date.now()): GuildActionResult {
    const guild = this.getGuildOfSession(actor.sessionId);
    if (!guild) return { success: false, error: 'Você não pertence a nenhuma guilda.' };

    if (!this.isLeadership(actor.sessionId)) {
      return { success: false, error: 'Apenas o Mestre e os Sub-líderes podem convidar membros.' };
    }

    if (target.sessionId === actor.sessionId) {
      return { success: false, error: 'Você não pode convidar a si mesmo.' };
    }

    if (this.getGuildOfSession(target.sessionId)) {
      return { success: false, error: `${target.character?.name || 'O jogador'} já pertence a uma guilda.` };
    }

    if (guild.members.size >= GUILD_LIMITS.MAX_MEMBERS) {
      return { success: false, error: `A guilda atingiu o limite de ${GUILD_LIMITS.MAX_MEMBERS} membros.` };
    }

    this.invitations.set(target.sessionId, {
      guildId: guild.id,
      invitedSessionId: target.sessionId,
      invitedByName: actor.character?.name || 'Hero',
      createdAt: now,
    });

    return {
      success: true,
      guild,
      message: `Convite enviado para ${target.character?.name || 'o aventureiro'}.`,
    };
  }

  /**
   * Aceita um convite pendente. Sem `guildId`, aceita o convite mais recente.
   */
  public acceptInvitation(actor: GuildActor, guildId?: string, now = Date.now()): GuildActionResult {
    const invitation = this.invitations.get(actor.sessionId);
    if (!invitation) {
      return { success: false, error: 'Você não possui convites de guilda pendentes.' };
    }
    if (guildId && invitation.guildId !== guildId) {
      return { success: false, error: 'Convite não corresponde à guilda informada.' };
    }

    const guild = this.guilds.get(invitation.guildId);
    if (!guild) {
      this.invitations.delete(actor.sessionId);
      return { success: false, error: 'A guilda do convite não existe mais.' };
    }

    if (this.getGuildOfSession(actor.sessionId)) {
      this.invitations.delete(actor.sessionId);
      return { success: false, error: 'Você já pertence a uma guilda.' };
    }

    guild.members.set(actor.sessionId, {
      sessionId: actor.sessionId,
      characterName: actor.character?.name || 'Hero',
      rank: GuildRank.MEMBER,
      joinedAt: now,
      contributedZen: 0,
    });
    this.sessionToGuild.set(actor.sessionId, guild.id);
    this.invitations.delete(actor.sessionId);

    return { success: true, guild, message: `Bem-vindo à guilda "${guild.name}"!` };
  }

  public declineInvitation(actor: GuildActor, guildId?: string): GuildActionResult {
    const invitation = this.invitations.get(actor.sessionId);
    if (!invitation || (guildId && invitation.guildId !== guildId)) {
      return { success: false, error: 'Nenhum convite pendente para recusar.' };
    }
    this.invitations.delete(actor.sessionId);
    return { success: true, message: 'Convite recusado.' };
  }

  /**
   * Promove a Sub-líder ou rebaixa para Membro. Só o Mestre comanda cargos.
   */
  public setRank(actor: GuildActor, targetSessionId: string, rank: GuildRank): GuildActionResult {
    const guild = this.getGuildOfSession(actor.sessionId);
    if (!guild) return { success: false, error: 'Você não pertence a nenhuma guilda.' };
    if (!this.isMaster(actor.sessionId)) {
      return { success: false, error: 'Apenas o Mestre da guilda pode alterar cargos.' };
    }
    if (targetSessionId === actor.sessionId) {
      return { success: false, error: 'O Mestre não pode rebaixar a si mesmo (transfira a liderança).' };
    }

    const target = guild.members.get(targetSessionId);
    if (!target) return { success: false, error: 'O jogador não é membro desta guilda.' };

    target.rank = rank;
    return {
      success: true,
      guild,
      message: `${target.characterName} agora é ${rank === GuildRank.SUB_LEADER ? 'Sub-líder' : 'Membro'} de "${guild.name}".`,
    };
  }

  /**
   * Transfere a liderança (necessário antes de o Mestre sair, por exemplo).
   */
  public transferLeadership(actor: GuildActor, targetSessionId: string): GuildActionResult {
    const guild = this.getGuildOfSession(actor.sessionId);
    if (!guild) return { success: false, error: 'Você não pertence a nenhuma guilda.' };
    if (!this.isMaster(actor.sessionId)) {
      return { success: false, error: 'Apenas o Mestre pode transferir a liderança.' };
    }

    const target = guild.members.get(targetSessionId);
    if (!target) return { success: false, error: 'O jogador não é membro desta guilda.' };

    const currentMaster = guild.members.get(actor.sessionId);
    if (currentMaster) currentMaster.rank = GuildRank.SUB_LEADER;
    target.rank = GuildRank.MASTER;
    guild.masterSessionId = targetSessionId;

    return { success: true, guild, message: `A liderança de "${guild.name}" passou para ${target.characterName}.` };
  }

  /**
   * Remove um jogador da guilda: saída voluntária ou expulsão por liderança.
   * Se o Mestre sair e houver outros membros, a liderança passa ao mais antigo.
   * Se a guilda ficar vazia, é dissolvida.
   */
  public removeMember(actor: GuildActor, targetSessionId: string): GuildActionResult {
    const guild = this.getGuildOfSession(actor.sessionId);
    if (!guild) return { success: false, error: 'Você não pertence a nenhuma guilda.' };

    const isSelf = targetSessionId === actor.sessionId;
    if (!isSelf && !this.isLeadership(actor.sessionId)) {
      return { success: false, error: 'Apenas o Mestre e os Sub-líderes podem expulsar membros.' };
    }

    const target = guild.members.get(targetSessionId);
    if (!target) return { success: false, error: 'O jogador não é membro desta guilda.' };

    if (!isSelf && target.rank === GuildRank.MASTER) {
      return { success: false, error: 'Um Mestre não pode ser expulso — transfira a liderança primeiro.' };
    }
    if (isSelf && target.rank === GuildRank.MASTER && guild.members.size > 1) {
      return {
        success: false,
        error: 'Transfira a liderança antes de sair da guilda (há outros membros).',
      };
    }

    guild.members.delete(targetSessionId);
    this.sessionToGuild.delete(targetSessionId);
    this.crownCloakHolders.delete(targetSessionId);

    if (guild.members.size === 0) {
      this.dissolveGuild(guild.id);
      return { success: true, message: `A guilda "${guild.name}" foi dissolvida por falta de membros.` };
    }

    if (target.rank === GuildRank.MASTER) {
      // Passa a liderança ao membro mais antigo
      const successor = Array.from(guild.members.values()).sort((a, b) => a.joinedAt - b.joinedAt)[0];
      successor.rank = GuildRank.MASTER;
      guild.masterSessionId = successor.sessionId;
    }

    return {
      success: true,
      guild,
      message: isSelf
        ? `Você saiu da guilda "${guild.name}".`
        : `${target.characterName} foi removido da guilda "${guild.name}".`,
    };
  }

  public leaveGuild(actor: GuildActor): GuildActionResult {
    return this.removeMember(actor, actor.sessionId);
  }

  /**
   * Dissolve a guilda: remove membros, alianças e cobranças pendentes.
   * O tesouro é perdido (regra de ouro: guilda sem membros não tem herdeiros).
   */
  public dissolveGuild(guildId: string): void {
    const guild = this.guilds.get(guildId);
    if (!guild) return;

    for (const sessionId of guild.members.keys()) {
      this.sessionToGuild.delete(sessionId);
      this.crownCloakHolders.delete(sessionId);
      if (this.invitations.has(sessionId)) this.invitations.delete(sessionId);
    }

    for (const allyId of guild.allies) {
      this.guilds.get(allyId)?.allies.delete(guildId);
    }

    for (const [sessionId, inv] of Array.from(this.invitations.entries())) {
      if (inv.guildId === guildId) this.invitations.delete(sessionId);
    }

    if (this.castleOwnerGuildId === guildId) {
      this.castleOwnerGuildId = null;
    }

    this.guilds.delete(guildId);
  }

  // ==========================================================================
  // ALIANÇAS
  // ==========================================================================

  /**
   * Propõe aliança. Como não há salas de chat síncronas neste nível do protocolo,
   * a aliança é registrada de forma **simétrica imediata** entre as duas guildas.
   */
  public proposeAlliance(actor: GuildActor, targetGuildId: string): GuildActionResult {
    const guild = this.getGuildOfSession(actor.sessionId);
    if (!guild) return { success: false, error: 'Você não pertence a nenhuma guilda.' };
    if (!this.isMaster(actor.sessionId)) {
      return { success: false, error: 'Apenas o Mestre pode firmar alianças.' };
    }
    if (targetGuildId === guild.id) {
      return { success: false, error: 'Uma guilda não pode ser aliada de si mesma.' };
    }

    const target = this.guilds.get(targetGuildId);
    if (!target) return { success: false, error: 'Guilda alvo não encontrada.' };

    if (guild.allies.has(targetGuildId)) {
      return { success: false, error: `"${guild.name}" já é aliada de "${target.name}".` };
    }
    if (guild.allies.size >= GUILD_LIMITS.MAX_ALLIANCES) {
      return { success: false, error: `Limite de ${GUILD_LIMITS.MAX_ALLIANCES} alianças atingido.` };
    }
    if (target.allies.size >= GUILD_LIMITS.MAX_ALLIANCES) {
      return { success: false, error: `"${target.name}" já atingiu o limite de alianças.` };
    }

    guild.allies.add(targetGuildId);
    target.allies.add(guild.id);

    return {
      success: true,
      guild,
      message: `Aliança selada entre "${guild.name}" e "${target.name}".`,
    };
  }

  public breakAlliance(actor: GuildActor, targetGuildId: string): GuildActionResult {
    const guild = this.getGuildOfSession(actor.sessionId);
    if (!guild) return { success: false, error: 'Você não pertence a nenhuma guilda.' };
    if (!this.isMaster(actor.sessionId)) {
      return { success: false, error: 'Apenas o Mestre pode romper alianças.' };
    }
    if (!guild.allies.has(targetGuildId)) {
      return { success: false, error: 'As guildas não são aliadas.' };
    }

    guild.allies.delete(targetGuildId);
    this.guilds.get(targetGuildId)?.allies.delete(guild.id);

    return { success: true, guild, message: 'Aliança rompida.' };
  }

  // ==========================================================================
  // TESOURO & IMPOSTO TERRITORIAL
  // ==========================================================================

  /**
   * Deposita Zen no tesouro da guilda. Aceita valor parcial se o jogador
   * não possuir o total (deposita o que tiver, nunca negativo).
   */
  public depositToTreasury(actor: GuildActor, amountZen: number): GuildActionResult {
    const guild = this.getGuildOfSession(actor.sessionId);
    if (!guild) return { success: false, error: 'Você não pertence a nenhuma guilda.' };

    const available = actor.character?.zen ?? 0;
    const amount = Math.floor(amountZen);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'Informe um valor positivo de Zen para depositar.' };
    }

    const deposited = Math.min(amount, available);
    if (deposited <= 0) {
      return { success: false, error: 'Você não possui Zen suficiente.' };
    }

    actor.character.zen = available - deposited;
    guild.treasuryZen += deposited;

    const member = guild.members.get(actor.sessionId);
    if (member) member.contributedZen += deposited;

    return {
      success: true,
      guild,
      message: `${deposited.toLocaleString('pt-BR')} Zen depositados no tesouro de "${guild.name}".`,
    };
  }

  /**
   * ✨ Imposto Territorial — aplicado a **toda** movimentação de Zen em lojas.
   *
   * @param biome Bioma onde a transação ocorreu (define a alíquota, 3%–7%)
   * @param grossZen Valor transacionado (bruto)
   * @returns `tax` (Zen desviado para o tesouro) e `netZen` (o que fica com o jogador)
   */
  public applyTerritorialTax(
    biome: ScenarioBiome | string,
    grossZen: number,
    commit = true
  ): { tax: number; netZen: number; rate: number; ownerGuildId: string | null } {
    const rate = TERRITORIAL_TAX_BY_BIOME[String(biome).toUpperCase()] ?? GUILD_LIMITS.MIN_TAX_RATE;
    const owner = this.getCastleOwner();

    if (!owner || grossZen <= 0) {
      return { tax: 0, netZen: grossZen, rate, ownerGuildId: owner?.id ?? null };
    }

    const tax = Math.floor(grossZen * rate);
    if (commit) {
      owner.treasuryZen += tax;
      owner.totalTaxCollected += tax;
    }

    return { tax, netZen: grossZen - tax, rate, ownerGuildId: owner.id };
  }

  // ==========================================================================
  // ASAS DA COROA (Manta do Imperador Supremo)
  // ==========================================================================

  /**
   * Define a guilda vencedora do cerco e distribui a Manta do Imperador Supremo
   * ao Mestre dela. Remove a manta de quem a possuía (Mestre anterior).
   */
  public setCastleOwner(guildId: string): { success: boolean; error?: string; owner?: Guild } {
    const guild = this.guilds.get(guildId);
    if (!guild) return { success: false, error: 'Guilda vencedora não encontrada.' };

    // Revoga a manta dos antigos portadores
    this.crownCloakHolders.clear();
    this.castleOwnerGuildId = guildId;
    this.crownCloakHolders.add(guild.masterSessionId);

    return { success: true, owner: guild };
  }

  public isCrownCloakHolder(sessionId: string): boolean {
    return this.crownCloakHolders.has(sessionId);
  }

  /**
   * Remove a manta de um jogador que deixou a liderança ou está morrendo/deslogando.
   */
  public revokeCrownCloak(sessionId: string): void {
    this.crownCloakHolders.delete(sessionId);
  }

  // ==========================================================================
  // SERIALIZAÇÃO
  // ==========================================================================

  public toJSON(): object {
    const owner = this.getCastleOwner();
    return {
      guildCount: this.guilds.size,
      castleOwner: owner ? { id: owner.id, name: owner.name, masterSessionId: owner.masterSessionId } : null,
      crownCloakHolders: Array.from(this.crownCloakHolders),
      guilds: this.getAllGuilds().map((g) => ({
        id: g.id,
        name: g.name,
        masterSessionId: g.masterSessionId,
        membersCount: g.members.size,
        treasuryZen: g.treasuryZen,
        totalTaxCollected: g.totalTaxCollected,
        allies: Array.from(g.allies),
        createdAt: g.createdAt,
      })),
    };
  }

  // ==========================================================================
  // UTILITÁRIOS
  // ==========================================================================

  private normalizeName(name: string): string {
    return name.trim().toUpperCase();
  }

  private validateGuildName(name: string): string | null {
    if (name.length < 3) return 'O nome da guilda deve ter ao menos 3 caracteres.';
    if (name.length > 16) return 'O nome da guilda deve ter no máximo 16 caracteres.';
    if (!/^[A-Za-zÀ-ÿ0-9 _-]+$/.test(name)) {
      return 'O nome da guilda aceita apenas letras, números, espaço, hífen e underscore.';
    }
    return null;
  }
}
