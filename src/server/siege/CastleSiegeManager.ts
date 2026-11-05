/**
 * Dasi MMORPG - Gerenciador do Cerco ao Castelo (CastleSiegeManager)
 *
 * Implementa `docs/PVP_and_Castle_Siege.md` § 3 sobre a geometria já existente
 * dos 5 cenários `VOL_01..VOL_05` (`SCENARIO_CATALOG`):
 *
 *   VOL_01 Campo de Guerra ─► VOL_02 Portão Ciclópico (25M HP)
 *        ─► VOL_04 Ponte Levadiça ─► VOL_03 Estátuas da Vida (4 × 8M HP)
 *        ─► VOL_05 Salão do Trono & Selo da Coroa (30s de canalização)
 *
 * Regras canônicas:
 * - evento semanal, 90 minutos de duração;
 * - cada Estátua da Vida em pé mantém o respawn da guilda defensora no pátio
 *   com escudo de invulnerabilidade; pulverizá-las empurra o respawn para longe;
 * - o Selo da Coroa exige os **dois pedestais sagrados** mantidos ao mesmo tempo
 *   por Sub-líderes/Mestre, canalização contínua de 30s que reseta ao ser
 *   interrompida (empurrão, atordoamento ou morte do líder);
 * - o Mestre da guilda vencedora recebe a Manta do Imperador Supremo e a guilda
 *   passa a cobrar o Imposto Territorial (§3.2) via `GuildSystem.applyTerritorialTax`.
 */

import { CollisionSystem } from '../world/CollisionSystem.ts';
import { GuildSystem, GUILD_LIMITS } from '../guilds/GuildSystem.ts';

export const CastleSiegePhase = {
  CLOSED: 'CLOSED',
  REGISTRATION: 'REGISTRATION',
  BATTLE: 'BATTLE',
  CONCLUDED: 'CONCLUDED',
} as const;

export type CastleSiegePhase = typeof CastleSiegePhase[keyof typeof CastleSiegePhase];

/** Estágios táticos dentro da batalha (espelham os cenários VOL_02 → VOL_05) */
export const SiegeStage = {
  GATE_ASSAULT: 'GATE_ASSAULT',
  COURTYARD_STATUES: 'COURTYARD_STATUES',
  DRAWBRIDGE_CROSSING: 'DRAWBRIDGE_CROSSING',
  CROWN_SEAL: 'CROWN_SEAL',
  TRIUMPH: 'TRIUMPH',
  FAILED: 'FAILED',
} as const;

export type SiegeStage = typeof SiegeStage[keyof typeof SiegeStage];

export interface SiegeStructure {
  id: string;
  label: string;
  hp: number;
  maxHp: number;
  destroyed: boolean;
  scenarioId: string;
}

export interface CrownSealProgress {
  /** Mestre que iniciou a canalização */
  masterSessionId: string | null;
  /** Progresso contínuo em ms (0 .. CROWN_SEAL_DURATION_MS) */
  progressMs: number;
  /** Pedestal oeste (x = -8) mantido por um Sub-líder/Mestre */
  pedestalWest: string | null;
  /** Pedestal leste (x = +8) mantido por um Sub-líder/Mestre */
  pedestalEast: string | null;
  /** Última vez que a canalização avançou (para detectar inatividade) */
  lastUpdateAt: number;
}

export interface SiegeResult {
  guildId: string;
  guildName: string;
  totalDamageDealt: number;
  structuresDestroyed: number;
  concludedAt: number;
}

export interface CastleSiegeConfig {
  siegeId?: string;
  /** Duração da batalha (padrão: 90 minutos — §3.1) */
  battleDurationMs?: number;
  /** Janela de inscrição antes da batalha (padrão: 24h) */
  registrationDurationMs?: number;
  /** Canalização do Selo da Coroa (padrão: 30s — §3.1) */
  crownSealDurationMs?: number;
}

export const CROWN_SEAL_DURATION_MS = 30_000;
export const DEFAULT_BATTLE_DURATION_MS = 90 * 60 * 1000;
const PEDESTAL_REEVALUATION_MS = 250;

export class CastleSiegeManager {
  public readonly id: string;
  public phase: CastleSiegePhase = CastleSiegePhase.CLOSED;
  public stage: SiegeStage = SiegeStage.GATE_ASSAULT;

  public readonly battleDurationMs: number;
  public readonly registrationDurationMs: number;
  public readonly crownSealDurationMs: number;

  public registrationEndsAt = 0;
  public battleStartAt = 0;
  public battleEndsAt = 0;

  /** Estruturas destrutíveis indexadas por id do colisor em `SCENARIO_CATALOG` */
  public structures: Map<string, SiegeStructure> = new Map();
  /** Dano total por guilda, para desempate e placar */
  public damageByGuild: Map<string, number> = new Map();
  /** Guildas inscritas (atacantes + defensora) */
  public registeredGuilds: Set<string> = new Set();

  public crownSeal: CrownSealProgress = {
    masterSessionId: null,
    progressMs: 0,
    pedestalWest: null,
    pedestalEast: null,
    lastUpdateAt: 0,
  };

  public lastResult: SiegeResult | null = null;
  /** Ordem de chegada ao Salão do Trono (define o vencedor em disputa) */
  private throneClaimants: string[] = [];
  private lastPedestalCheckAt = 0;

  private readonly guilds: GuildSystem;

  constructor(guilds: GuildSystem, config: CastleSiegeConfig = {}) {
    this.guilds = guilds;
    this.id = config.siegeId ?? 'siege-valley-of-loren';
    this.battleDurationMs = config.battleDurationMs ?? DEFAULT_BATTLE_DURATION_MS;
    this.registrationDurationMs = config.registrationDurationMs ?? 24 * 60 * 60 * 1000;
    this.crownSealDurationMs = config.crownSealDurationMs ?? CROWN_SEAL_DURATION_MS;
    this.buildStructuresFromCatalog();
  }

  // ==========================================================================
  // CATÁLOGO ⇄ ESTRUTURAS
  // ==========================================================================

  /**
   * Materializa as estruturas destrutíveis a partir de `destructibleHp` do
   * catálogo canônico. Nenhum HP é duplicado aqui: a fonte é o `SCENARIO_CATALOG`.
   */
  private buildStructuresFromCatalog(): void {
    this.structures.clear();

    for (const scenario of CollisionSystem.getAllScenarios()) {
      // Apenas as estruturas do Vale de Loren pertencem ao cerco — o Portão do
      // Arcanjo (`EVT_01`) é do Blood Castle e não deve contar no placar.
      if (!scenario.id.startsWith('VOL_') || !scenario.destructibleHp) continue;

      for (const [colliderId, hp] of Object.entries(scenario.destructibleHp)) {
        this.structures.set(colliderId, {
          id: colliderId,
          label: this.describeStructure(colliderId),
          hp,
          maxHp: hp,
          destroyed: false,
          scenarioId: scenario.id,
        });
      }
    }
  }

  private describeStructure(colliderId: string): string {
    const labels: Record<string, string> = {
      cyclopean_iron_gate: 'Portão Ciclópico de Ferro',
      archangel_gate: 'Portão do Arcanjo',
    };
    if (labels[colliderId]) return labels[colliderId];
    if (colliderId.startsWith('life_statue')) {
      const suffix = colliderId.replace('life_statue_', '').toUpperCase();
      return `Estátua da Vida ${suffix}`;
    }
    return colliderId;
  }

  public getStructure(colliderId: string): SiegeStructure | undefined {
    return this.structures.get(colliderId);
  }

  public getLifeStatues(): SiegeStructure[] {
    return Array.from(this.structures.values()).filter((s) => s.id.startsWith('life_statue'));
  }

  public getGate(): SiegeStructure | undefined {
    return this.structures.get('cyclopean_iron_gate');
  }

  /** Quantas Estátuas da Vida continuam de pé (define o ponto de respawn defensor) */
  public getStandingStatuesCount(): number {
    return this.getLifeStatues().filter((s) => !s.destroyed).length;
  }

  /**
   * Ponto de respawn da guilda defensora conforme as estátuas restantes:
   * 4 em pé → pátio (VOL_03), 2–3 → ponte (VOL_04), 0–1 → campo (VOL_01).
   */
  public getDefenderRespawnScenario(): string {
    const standing = this.getStandingStatuesCount();
    if (standing >= 4) return 'VOL_03';
    if (standing >= 2) return 'VOL_04';
    return 'VOL_01';
  }

  /** Defensores só ficam invulneráveis enquanto houver estátua de pé */
  public defendersHaveInvulnerability(): boolean {
    return this.getStandingStatuesCount() > 0;
  }

  // ==========================================================================
  // CICLO DO EVENTO
  // ==========================================================================

  public openRegistration(now = Date.now()): void {
    this.phase = CastleSiegePhase.REGISTRATION;
    this.registrationEndsAt = now + this.registrationDurationMs;
    this.damageByGuild.clear();
    this.registeredGuilds.clear();
    this.throneClaimants = [];
    this.crownSeal = {
      masterSessionId: null,
      progressMs: 0,
      pedestalWest: null,
      pedestalEast: null,
      lastUpdateAt: 0,
    };
    // A guilda que já detém o castelo entra como defensora
    const owner = this.guilds.getCastleOwner();
    if (owner) this.registeredGuilds.add(owner.id);
  }

  public registerGuild(guildId: string, now = Date.now()): { success: boolean; error?: string } {
    if (this.phase !== CastleSiegePhase.REGISTRATION) {
      return { success: false, error: 'As inscrições para o Cerco ao Castelo estão fechadas.' };
    }
    if (!this.guilds.getGuild(guildId)) {
      return { success: false, error: 'Guilda não encontrada.' };
    }
    if (this.registeredGuilds.has(guildId)) {
      return { success: false, error: 'Esta guilda já está inscrita no cerco.' };
    }

    this.registeredGuilds.add(guildId);
    return { success: true };
  }

  public startBattle(now = Date.now()): { success: boolean; error?: string } {
    if (this.registeredGuilds.size === 0) {
      return { success: false, error: 'Nenhuma guilda inscrita — o cerco não pode começar.' };
    }

    // Restaura portões e estátuas a cada batalha semanal
    for (const structure of this.structures.values()) {
      structure.hp = structure.maxHp;
      structure.destroyed = false;
    }

    this.phase = CastleSiegePhase.BATTLE;
    this.stage = SiegeStage.GATE_ASSAULT;
    this.battleStartAt = now;
    this.battleEndsAt = now + this.battleDurationMs;
    this.damageByGuild.clear();
    for (const guildId of this.registeredGuilds) this.damageByGuild.set(guildId, 0);
    this.crownSeal = {
      masterSessionId: null,
      progressMs: 0,
      pedestalWest: null,
      pedestalEast: null,
      lastUpdateAt: now,
    };
    this.throneClaimants = [];

    return { success: true };
  }

  // ==========================================================================
  // AÇÕES DE BATALHA
  // ==========================================================================

  /**
   * Dano em uma estrutura destrutível (portão do VOL_02, estátuas do VOL_03).
   * Retorna o dano efetivamente aplicado para o registro de placar.
   */
  public damageStructure(
    guildId: string,
    colliderId: string,
    damage: number
  ): { applied: number; hp: number; destroyed: boolean; structure?: SiegeStructure } {
    const structure = this.structures.get(colliderId);
    if (!structure || this.phase !== CastleSiegePhase.BATTLE || structure.destroyed) {
      return { applied: 0, hp: structure?.hp ?? 0, destroyed: structure?.destroyed ?? false, structure };
    }

    if (!this.registeredGuilds.has(guildId)) {
      return { applied: 0, hp: structure.hp, destroyed: false, structure };
    }

    const applied = Math.max(0, Math.min(structure.hp, Math.floor(damage)));
    if (applied <= 0) return { applied: 0, hp: structure.hp, destroyed: false, structure };

    structure.hp -= applied;
    this.damageByGuild.set(guildId, (this.damageByGuild.get(guildId) ?? 0) + applied);

    if (structure.hp <= 0) {
      structure.hp = 0;
      structure.destroyed = true;
      this.recalculateStage();
    }

    return { applied, hp: structure.hp, destroyed: structure.destroyed, structure };
  }

  private recalculateStage(): void {
    const gate = this.getGate();
    const statuesStanding = this.getStandingStatuesCount();

    if (gate && !gate.destroyed) {
      this.stage = SiegeStage.GATE_ASSAULT;
      return;
    }
    if (statuesStanding > 0) {
      this.stage = SiegeStage.COURTYARD_STATUES;
      return;
    }
    if (this.crownSeal.progressMs < this.crownSealDurationMs) {
      this.stage = this.crownSeal.masterSessionId ? SiegeStage.CROWN_SEAL : SiegeStage.DRAWBRIDGE_CROSSING;
      return;
    }
    this.stage = SiegeStage.TRIUMPH;
  }

  /** Portão de ferro precisa cair antes de o pátio das estátuas ficar acessível */
  public canReachStatues(): boolean {
    return this.getGate()?.destroyed ?? false;
  }

  /** O Salão do Trono só abre quando o portão caiu e o pátio foi limpo */
  public canReachThrone(): boolean {
    return this.canReachStatues() && this.getStandingStatuesCount() === 0;
  }

  /**
   * Um jogador assume um dos dois pedestais sagrados do Salão do Trono.
   * Exige cargo de liderança (Mestre ou Sub-líder) — §3.1.
   */
  public occupyPedestal(
    sessionId: string,
    side: 'west' | 'east'
  ): { success: boolean; error?: string } {
    if (this.phase !== CastleSiegePhase.BATTLE) {
      return { success: false, error: 'Não há cerco em andamento.' };
    }
    if (!this.canReachThrone()) {
      return { success: false, error: 'O Salão do Trono está selado: destrua o portão e as Estátuas da Vida.' };
    }
    if (!this.guilds.isLeadership(sessionId)) {
      return { success: false, error: 'Apenas Mestres e Sub-líderes podem manter os pedestais sagrados.' };
    }

    const otherSideOccupant = side === 'west' ? this.crownSeal.pedestalEast : this.crownSeal.pedestalWest;
    if (otherSideOccupant === sessionId) {
      return { success: false, error: 'Os dois pedestais exigem líderes diferentes.' };
    }

    if (side === 'west') this.crownSeal.pedestalWest = sessionId;
    else this.crownSeal.pedestalEast = sessionId;

    return { success: true };
  }

  public releasePedestal(sessionId: string): void {
    if (this.crownSeal.pedestalWest === sessionId) this.crownSeal.pedestalWest = null;
    if (this.crownSeal.pedestalEast === sessionId) this.crownSeal.pedestalEast = null;
  }

  /**
   * O Mestre inicia a canalização do Selo da Coroa.
   * Requer: Salão liberado, ambos os pedestais mantidos e ser Mestre de guilda inscrita.
   */
  public beginCrownSeal(
    sessionId: string,
    now = Date.now()
  ): { success: boolean; error?: string } {
    if (this.phase !== CastleSiegePhase.BATTLE) {
      return { success: false, error: 'Não há cerco em andamento.' };
    }
    if (!this.canReachThrone()) {
      return { success: false, error: 'O Salão do Trono ainda está selado.' };
    }
    if (!this.guilds.isMaster(sessionId)) {
      return { success: false, error: 'Apenas o Mestre da Guilda pode canalizar o Selo da Coroa.' };
    }
    if (!this.hasBothPedestals()) {
      return { success: false, error: 'Os dois pedestais sagrados precisam ser mantidos simultaneamente.' };
    }

    const guild = this.guilds.getGuildOfSession(sessionId);
    if (!guild || !this.registeredGuilds.has(guild.id)) {
      return { success: false, error: 'Sua guilda não está inscrita neste cerco.' };
    }

    this.crownSeal.masterSessionId = sessionId;
    this.crownSeal.progressMs = 0;
    this.crownSeal.lastUpdateAt = now;
    this.stage = SiegeStage.CROWN_SEAL;

    return { success: true };
  }

  public hasBothPedestals(): boolean {
    const { pedestalWest, pedestalEast } = this.crownSeal;
    return Boolean(pedestalWest && pedestalEast && pedestalWest !== pedestalEast);
  }

  /**
   * Interrompe a canalização — empurrão, atordoamento ou morte do Mestre.
   * O progresso volta a zero (§3.1).
   */
  public interruptCrownSeal(reason = 'interrompido'): { progressReset: boolean; reason: string } {
    const hadProgress = this.crownSeal.progressMs > 0 || this.crownSeal.masterSessionId !== null;
    this.crownSeal.progressMs = 0;
    this.crownSeal.masterSessionId = null;
    if (this.phase === CastleSiegePhase.BATTLE) {
      this.stage = SiegeStage.DRAWBRIDGE_CROSSING;
    }
    return { progressReset: hadProgress, reason };
  }

  /**
   * O pedestal só continua válido enquanto o ocupante permanecer na guilda com
   * cargo de liderança. Chamado periodicamente no `update`.
   */
  private validatePedestals(): void {
    const check = (sessionId: string | null): string | null => {
      if (!sessionId) return null;
      return this.guilds.isLeadership(sessionId) ? sessionId : null;
    };

    const west = check(this.crownSeal.pedestalWest);
    const east = check(this.crownSeal.pedestalEast);

    if (west !== this.crownSeal.pedestalWest || east !== this.crownSeal.pedestalEast) {
      this.crownSeal.pedestalWest = west;
      this.crownSeal.pedestalEast = east;
      if (this.crownSeal.masterSessionId) {
        this.interruptCrownSeal('pedestal sagrado abandonado');
      }
    }
  }

  // ==========================================================================
  // LOOP DE ATUALIZAÇÃO
  // ==========================================================================

  public update(now = Date.now()): {
    phase: CastleSiegePhase;
    stage: SiegeStage;
    timeRemainingMs: number;
    sealPercent: number;
  } {
    if (this.phase === CastleSiegePhase.REGISTRATION) {
      if (now >= this.registrationEndsAt) {
        // Sem guildas inscritas a janela simplesmente fecha; o cerco só começa
        // por `startBattle` (chamado pelo agendador semanal).
        this.phase = CastleSiegePhase.CLOSED;
      }
    } else if (this.phase === CastleSiegePhase.BATTLE) {
      if (now - this.lastPedestalCheckAt >= PEDESTAL_REEVALUATION_MS) {
        this.lastPedestalCheckAt = now;
        this.validatePedestals();
      }

      const master = this.crownSeal.masterSessionId;
      if (master && this.hasBothPedestals()) {
        const delta = Math.max(0, now - this.crownSeal.lastUpdateAt);
        this.crownSeal.lastUpdateAt = now;
        this.crownSeal.progressMs = Math.min(
          this.crownSealDurationMs,
          this.crownSeal.progressMs + delta
        );

        if (this.crownSeal.progressMs >= this.crownSealDurationMs) {
          this.concludeSiege(master, now);
        }
      } else if (master) {
        // Um pedestal ficou vazio: a canalização contínua é perdida (§3.1)
        this.interruptCrownSeal('pedestal sagrado abandonado');
      } else {
        this.crownSeal.lastUpdateAt = now;
      }

      if (this.phase === CastleSiegePhase.BATTLE && now >= this.battleEndsAt) {
        this.failSiege(now);
      }
    }

    return {
      phase: this.phase,
      stage: this.stage,
      timeRemainingMs: this.getTimeRemainingMs(now),
      sealPercent: Math.min(100, Math.round((this.crownSeal.progressMs / this.crownSealDurationMs) * 100)),
    };
  }

  public getTimeRemainingMs(now = Date.now()): number {
    if (this.phase === CastleSiegePhase.REGISTRATION) return Math.max(0, this.registrationEndsAt - now);
    if (this.phase === CastleSiegePhase.BATTLE) return Math.max(0, this.battleEndsAt - now);
    return 0;
  }

  // ==========================================================================
  // CONCLUSÃO
  // ==========================================================================

  /**
   * Conclui o cerco: a guilda do Mestre vencedor assume o castelo, recebe a
   * Manta do Imperador Supremo e passa a cobrar o Imposto Territorial.
   */
  private concludeSiege(masterSessionId: string, now: number): void {
    const guild = this.guilds.getGuildOfSession(masterSessionId);
    if (!guild) {
      this.failSiege(now);
      return;
    }

    const outcome = this.guilds.setCastleOwner(guild.id);
    if (!outcome.success) {
      this.failSiege(now);
      return;
    }

    this.stage = SiegeStage.TRIUMPH;
    this.phase = CastleSiegePhase.CONCLUDED;
    this.lastResult = {
      guildId: guild.id,
      guildName: guild.name,
      totalDamageDealt: this.damageByGuild.get(guild.id) ?? 0,
      structuresDestroyed: Array.from(this.structures.values()).filter((s) => s.destroyed).length,
      concludedAt: now,
    };
  }

  public failSiege(now = Date.now()): void {
    if (this.phase !== CastleSiegePhase.BATTLE) return;

    this.stage = SiegeStage.FAILED;
    this.phase = CastleSiegePhase.CONCLUDED;
    this.crownSeal.progressMs = 0;
    this.crownSeal.masterSessionId = null;
    this.lastResult = null;
    this.battleEndsAt = now;
  }

  /** Reset completo (fim de temporada / testes) */
  public reset(): void {
    this.phase = CastleSiegePhase.CLOSED;
    this.stage = SiegeStage.GATE_ASSAULT;
    this.registrationEndsAt = 0;
    this.battleStartAt = 0;
    this.battleEndsAt = 0;
    this.registeredGuilds.clear();
    this.damageByGuild.clear();
    this.throneClaimants = [];
    this.lastResult = null;
    this.crownSeal = {
      masterSessionId: null,
      progressMs: 0,
      pedestalWest: null,
      pedestalEast: null,
      lastUpdateAt: 0,
    };
    for (const structure of this.structures.values()) {
      structure.hp = structure.maxHp;
      structure.destroyed = false;
    }
  }

  // ==========================================================================
  // SERIALIZAÇÃO / PLACAR
  // ==========================================================================

  public getScoreboard(): Array<{ guildId: string; guildName: string; damage: number }> {
    return Array.from(this.damageByGuild.entries())
      .map(([guildId, damage]) => ({
        guildId,
        guildName: this.guilds.getGuild(guildId)?.name ?? guildId,
        damage,
      }))
      .sort((a, b) => b.damage - a.damage);
  }

  public toJSON(now = Date.now()): object {
    const owner = this.guilds.getCastleOwner();
    return {
      id: this.id,
      phase: this.phase,
      stage: this.stage,
      timeRemainingMs: this.getTimeRemainingMs(now),
      registeredGuilds: Array.from(this.registeredGuilds),
      castleOwner: owner ? { id: owner.id, name: owner.name } : null,
      gate: this.getGate() ?? null,
      lifeStatues: this.getLifeStatues(),
      standingStatues: this.getStandingStatuesCount(),
      defenderRespawnScenario: this.getDefenderRespawnScenario(),
      crownSeal: {
        masterSessionId: this.crownSeal.masterSessionId,
        progressMs: this.crownSeal.progressMs,
        progressPercent: Math.min(100, Math.round((this.crownSeal.progressMs / this.crownSealDurationMs) * 100)),
        pedestalWest: this.crownSeal.pedestalWest,
        pedestalEast: this.crownSeal.pedestalEast,
      },
      scoreboard: this.getScoreboard(),
      lastResult: this.lastResult,
      taxRateRange: [GUILD_LIMITS.MIN_TAX_RATE, GUILD_LIMITS.MAX_TAX_RATE],
    };
  }
}
