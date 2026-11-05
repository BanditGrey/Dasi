/**
 * DASI MMORPG - MOTOR DE COMBATE 100% IDLE (AUTO-BATTLE & AFK COMBAT ENGINE)
 * Sistema autônomo inspirado no Mu Helper clássico e em Idle RPGs 3D modernos.
 * 
 * Responsabilidades:
 * 1. Auto-Targeting: Aquisição autônoma do monstro vivo mais próximo.
 * 2. Auto-Approach: Condução cinemática do herói até o alcance de ataque.
 * 3. Auto-Skill Rotation: Rotação automática de habilidades (Twisting Slash, Death Stab, Golpe Base).
 * 4. Auto-Loot: Escaneamento e coleta contínua de Zen, Joias e Itens sem intervenção manual.
 * 5. Auto-Potion: Uso inteligente de elixires de Vida (HP < 65%) e Mana (MP < 40%).
 * 6. Telemetria AFK: Cálculo em tempo real de DPS, monstros derrotados, Zen e Joias acumuladas.
 */

export interface IdleMetrics {
  startTime: number;
  uptimeSec: number;
  monstersKilled: number;
  zenCollected: number;
  jewelsCollected: number;
  totalDamageDealt: number;
  dps: number;
  xpGained: number;
}

export interface OfflineHuntingRewards {
  durationHours: number;
  mapId: string;
  monstersKilled: number;
  xpGained: number;
  zenCollected: number;
  jewels: {
    bless: number;
    soul: number;
    chaos: number;
    life: number;
  };
}

export interface IdleConfig {
  enabled: boolean;
  searchRadius: number;       // Raio de busca por monstros (unidades 2D)
  attackRangeMelee: number;   // Alcance para armas corpo a corpo (ex: 55 unidades)
  attackRangeSkill: number;   // Alcance para habilidades de área (ex: 110 unidades)
  autoPickupRadius: number;   // Raio para coleta automática de drops (ex: 220 unidades)
  autoPotionHpPct: number;    // Limiar para beber Poção de Vida (0.0 a 1.0)
  autoPotionMpPct: number;    // Limiar para beber Poção de Mana (0.0 a 1.0)
  potionCooldownSec: number;  // Intervalo mínimo entre poções
  skillCycleDelaySec: number; // Delay entre ciclos de habilidades especiais
}

export interface AutoSkillEntry {
  id: string;
  name: string;
  icon: string;
  cooldownMs: number;
  manaCost: number;
  lastUsedMs: number;
  isReady: boolean;
}

export class IdleAutoCombatEngine {
  public config: IdleConfig = {
    enabled: true,
    searchRadius: 450,
    attackRangeMelee: 55,
    attackRangeSkill: 110,
    autoPickupRadius: 240,
    autoPotionHpPct: 0.65,
    autoPotionMpPct: 0.40,
    potionCooldownSec: 1.5,
    skillCycleDelaySec: 2.2,
  };

  public metrics: IdleMetrics = {
    startTime: Date.now(),
    uptimeSec: 0,
    monstersKilled: 0,
    zenCollected: 0,
    jewelsCollected: 0,
    totalDamageDealt: 0,
    dps: 0,
    xpGained: 0,
  };

  public skills: AutoSkillEntry[] = [
    {
      id: 'cyclone',
      name: 'Twisting Slash',
      icon: '🌪️',
      cooldownMs: 2500,
      manaCost: 35,
      lastUsedMs: 0,
      isReady: true,
    },
    {
      id: 'death_stab',
      name: 'Death Stab',
      icon: '⚡',
      cooldownMs: 4000,
      manaCost: 55,
      lastUsedMs: 0,
      isReady: true,
    },
  ];

  public currentTargetId: string | null = null;
  public currentAction: string = 'Procurando Inimigos...';
  public lastAttackMs: number = 0;
  public lastPotionHpMs: number = 0;
  public lastPotionMpMs: number = 0;

  // Janela deslizante para cálculo de DPS
  private recentDamageRecords: Array<{ time: number; damage: number }> = [];

  constructor(config: Partial<IdleConfig> = {}) {
    this.config = { ...this.config, ...config };
    this.metrics.startTime = Date.now();
  }

  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.currentAction = 'Auto-Hunt Pausado';
      this.currentTargetId = null;
    } else {
      this.currentAction = 'Auto-Hunt Ativo';
    }
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Ciclo principal de decisão autônoma do motor Idle.
   * Recebe uma interface adaptadora do estado do jogo (appContext).
   */
  public update(
    deltaTimeSec: number,
    state: {
      playerX: number;
      playerY: number;
      playerHp: number;
      playerMaxHp: number;
      playerMp: number;
      playerMaxMp: number;
      monsters: Array<{ id: string; x: number; y: number; isDead: boolean; name?: string }>;
      groundDrops: Array<{ dropId: string; x: number; y: number; isJewel?: boolean; zen?: number }>;
    },
    actions: {
      movePlayer: (x: number, y: number) => void;
      attackMonster: (mobId: string, skillId?: string) => void;
      pickupDrop: (dropId: string) => void;
      useHealthPotion: () => void;
      useManaPotion: () => void;
    }
  ): {
    action: string;
    targetId: string | null;
    metrics: IdleMetrics;
  } {
    const now = Date.now();
    this.metrics.uptimeSec = Math.floor((now - this.metrics.startTime) / 1000);
    this.cleanRecentDamage(now);

    if (!this.config.enabled) {
      return { action: this.currentAction, targetId: null, metrics: this.metrics };
    }

    // 1. AUTO-POTION: Avaliação inteligente de Vitais
    const hpRatio = state.playerHp / Math.max(1, state.playerMaxHp);
    if (hpRatio < this.config.autoPotionHpPct && now - this.lastPotionHpMs >= this.config.potionCooldownSec * 1000) {
      this.lastPotionHpMs = now;
      actions.useHealthPotion();
    }

    const mpRatio = state.playerMp / Math.max(1, state.playerMaxMp);
    if (mpRatio < this.config.autoPotionMpPct && now - this.lastPotionMpMs >= this.config.potionCooldownSec * 1000) {
      this.lastPotionMpMs = now;
      actions.useManaPotion();
    }

    // 2. AUTO-LOOT: Coleta automática de drops no chão
    for (const drop of state.groundDrops) {
      const dist = Math.hypot(drop.x - state.playerX, drop.y - state.playerY);
      if (dist <= this.config.autoPickupRadius) {
        actions.pickupDrop(drop.dropId);
      }
    }

    // 3. AUTO-TARGETING: Localiza monstro vivo mais próximo
    let target = state.monsters.find((m) => m.id === this.currentTargetId && !m.isDead);
    if (!target) {
      this.currentTargetId = null;
      let nearestDist = Infinity;
      let candidate = null;

      for (const mob of state.monsters) {
        if (mob.isDead) continue;
        const dist = Math.hypot(mob.x - state.playerX, mob.y - state.playerY);
        if (dist <= this.config.searchRadius && dist < nearestDist) {
          nearestDist = dist;
          candidate = mob;
        }
      }

      if (candidate) {
        target = candidate;
        this.currentTargetId = candidate.id;
      }
    }

    // Se nenhum monstro estiver na área, aguarda ou patrulha suavemente
    if (!target) {
      this.currentAction = 'Procurando Monstros na Zona...';
      return { action: this.currentAction, targetId: null, metrics: this.metrics };
    }

    // 4. AUTO-APPROACH: Move o herói até o monstro
    const targetDist = Math.hypot(target.x - state.playerX, target.y - state.playerY);

    // Seleciona a próxima habilidade da rotação autônoma
    const chosenSkill = this.selectNextSkill(now, state.playerMp);
    const requiredRange = chosenSkill ? this.config.attackRangeSkill : this.config.attackRangeMelee;

    if (targetDist > requiredRange) {
      // Conduz herói em direção ao alvo
      actions.movePlayer(target.x, target.y);
      this.currentAction = `Aproximando-se de ${target.name || 'Monstro'} (${Math.round(targetDist)}m)`;
      return { action: this.currentAction, targetId: target.id, metrics: this.metrics };
    }

    // 5. AUTO-ATTACK: Executa ataque e rotação de habilidades
    const attackIntervalMs = chosenSkill ? 900 : 750;
    if (now - this.lastAttackMs >= attackIntervalMs) {
      this.lastAttackMs = now;

      if (chosenSkill) {
        chosenSkill.lastUsedMs = now;
        actions.attackMonster(target.id, chosenSkill.id);
        this.currentAction = `Conjurando ${chosenSkill.name} contra ${target.name || 'Alvo'}`;
      } else {
        actions.attackMonster(target.id);
        this.currentAction = `Atacando ${target.name || 'Alvo'} com Golpe de Arma`;
      }
    }

    return {
      action: this.currentAction,
      targetId: target.id,
      metrics: this.metrics,
    };
  }

  /**
   * Seleciona a melhor habilidade disponível na rotação autônoma
   */
  private selectNextSkill(now: number, playerMp: number): AutoSkillEntry | null {
    for (const skill of this.skills) {
      skill.isReady = now - skill.lastUsedMs >= skill.cooldownMs && playerMp >= skill.manaCost;
      if (skill.isReady) {
        return skill;
      }
    }
    return null;
  }

  /**
   * Registra dano aplicado para cálculo de telemetria de DPS
   */
  public recordDamageDealt(damage: number): void {
    if (damage <= 0) return;
    const now = Date.now();
    this.metrics.totalDamageDealt += damage;
    this.recentDamageRecords.push({ time: now, damage });
    this.cleanRecentDamage(now);
  }

  /**
   * Registra derrota de um monstro
   */
  public recordMonsterKilled(): void {
    this.metrics.monstersKilled++;
  }

  /**
   * Registra coleta de drop de joia ou zen
   */
  public recordLoot(isJewel: boolean, zen = 0): void {
    if (isJewel) this.metrics.jewelsCollected++;
    if (zen > 0) this.metrics.zenCollected += zen;
  }

  /**
   * Limpa registros antigos de dano e recalcula DPS (média móvel de 5 segundos)
   */
  private cleanRecentDamage(now: number): void {
    const windowStart = now - 5000;
    this.recentDamageRecords = this.recentDamageRecords.filter((r) => r.time >= windowStart);

    const totalInWindow = this.recentDamageRecords.reduce((acc, r) => acc + r.damage, 0);
    this.metrics.dps = Math.round(totalInWindow / 5);
  }

  /**
   * Simula a progressão e recompensas de caça acumuladas durante período AFK offline.
   */
  public simulateOfflineHunting(durationHours: number, mapId = 'LORENCIA'): OfflineHuntingRewards {
    const clampedHours = Math.max(0.1, Math.min(12, durationHours));

    let mobsPerHour = 180;
    let avgXpPerMob = 350;
    let avgZenPerMob = 45;

    if (mapId === 'NORIA') {
      mobsPerHour = 160;
      avgXpPerMob = 650;
      avgZenPerMob = 90;
    } else if (mapId === 'DEVIAS') {
      mobsPerHour = 140;
      avgXpPerMob = 1200;
      avgZenPerMob = 180;
    }

    const monstersKilled = Math.floor(mobsPerHour * clampedHours);
    const xpGained = monstersKilled * avgXpPerMob;
    const zenCollected = monstersKilled * avgZenPerMob;

    // Probabilidade cumulativa das joias clássicas
    const blessCount = Math.floor(monstersKilled * 0.012);
    const soulCount = Math.floor(monstersKilled * 0.018);
    const chaosCount = Math.floor(monstersKilled * 0.025);
    const lifeCount = Math.floor(monstersKilled * 0.008);

    return {
      durationHours: clampedHours,
      mapId,
      monstersKilled,
      xpGained,
      zenCollected,
      jewels: {
        bless: Math.max(0, blessCount),
        soul: Math.max(0, soulCount),
        chaos: Math.max(0, chaosCount),
        life: Math.max(0, lifeCount),
      },
    };
  }
}
