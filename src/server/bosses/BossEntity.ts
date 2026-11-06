/**
 * Dasi MMORPG - Entidade Autoritativa de Chefe de Múltiplas Fases
 * Suporta fases dinâmicas, barreiras de escudo rúnico, canalização de telégrafos,
 * mecânica de Enrage, dano de aura e convocação de lacaios.
 */

import { Monster, type GroundDropItem, type MonsterState } from '../combat/Monster.ts';
import { BOSS_CONFIGS, type BossConfig, type BossPhaseConfig, type BossTelegraphSkill } from './BossDefinitions.ts';
import { Item } from '../inventory/Item.ts';
import { WeaponExcellentOption, ArmorExcellentOption, ItemCategory, type ItemInstance } from '../inventory/types.ts';

let bossIdCounter = 1;

export interface ActiveTelegraph {
  castId: string;
  skill: BossTelegraphSkill;
  startedAt: number;
  finishesAt: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
}

export interface SerializedBoss {
  id: string;
  type: string;
  name: string;
  title: string;
  location: string;
  level: number;
  currentHp: number;
  maxHp: number;
  currentShield: number;
  maxShield: number;
  poise: number;
  maxPoise: number;
  currentPhaseIndex: number;
  currentPhaseName: string;
  isEnraged: boolean;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: MonsterState;
  isDead: boolean;
  activeTelegraph: {
    skillId: string;
    skillName: string;
    shape: string;
    durationMs: number;
    remainingMs: number;
    radius: number;
    angleDeg?: number;
  } | null;
  auraActive: boolean;
  auraType?: string;
}

export class BossEntity {
  public readonly id: string;
  public readonly type: string;
  public readonly name: string;
  public readonly title: string;
  public readonly location: string;
  public readonly level: number;
  public readonly maxHp: number;
  public currentHp: number;

  public defense: number;
  public defenseRate: number;
  public attackMin: number;
  public attackMax: number;
  public attackRate: number;
  public moveSpeed: number;
  public xpReward: number;
  public maxPoise: number;
  public poise: number;

  public x: number;
  public y: number;
  public spawnX: number;
  public spawnY: number;
  public targetX: number;
  public targetY: number;

  public state: MonsterState = 'IDLE';
  public isDead = false;
  public staggerUntil = 0;

  public readonly config: BossConfig;
  public currentPhaseIndex = 1;
  public currentShield = 0;
  public maxShield = 0;
  public isEnraged = false;
  public activeTelegraph: ActiveTelegraph | null = null;
  public skillCooldowns: Map<string, number> = new Map();
  public pendingAddSummons: { monsterType: string; count: number }[] = [];

  constructor(type: string, x: number, y: number) {
    const config = BOSS_CONFIGS[type];
    if (!config) throw new Error(`Tipo de chefe desconhecido: ${type}`);
    this.config = config;

    this.id = `boss-${type}-${(bossIdCounter++).toString(16).padStart(4, '0')}`;
    this.type = type;
    this.name = config.name;
    this.title = config.title;
    this.location = config.location;
    this.level = config.level;
    this.maxHp = config.maxHp;
    this.currentHp = config.maxHp;
    this.defense = config.defense;
    this.defenseRate = config.defenseRate;
    this.attackMin = config.attackMin;
    this.attackMax = config.attackMax;
    this.attackRate = config.attackRate;
    this.moveSpeed = config.moveSpeed;
    this.xpReward = config.xpReward;
    this.maxPoise = config.maxPoise;
    this.poise = config.maxPoise;

    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.targetX = x;
    this.targetY = y;

    // Inicializa a fase 1
    this.applyPhaseConfig(this.config.phases[0]);
  }

  public getCurrentPhase(): BossPhaseConfig {
    return this.config.phases[this.currentPhaseIndex - 1] || this.config.phases[0];
  }

  /**
   * Aplica bônus de fase, escudos e enrage
   */
  private applyPhaseConfig(phase: BossPhaseConfig): void {
    if (phase.shieldHp && phase.shieldHp > 0) {
      this.currentShield = phase.shieldHp;
      this.maxShield = phase.shieldHp;
    } else {
      this.currentShield = 0;
      this.maxShield = 0;
    }

    if (phase.enraged) {
      this.isEnraged = true;
    }

    // Escala ataque e velocidade
    this.attackMin = Math.round(this.config.attackMin * phase.damageMultiplier);
    this.attackMax = Math.round(this.config.attackMax * phase.damageMultiplier);
    this.moveSpeed = Math.round(this.config.moveSpeed * phase.attackSpeedMultiplier);

    // Agenda lacaios se houver
    if (phase.summonAdds) {
      this.pendingAddSummons.push(phase.summonAdds);
    }
  }

  /**
   * Aplica dano com prioridade para quebra de escudo
   */
  public takeDamage(amount: number, poiseDamage = 10): {
    actualHpDamage: number;
    shieldDamage: number;
    shieldBroken: boolean;
    phaseChanged: boolean;
    died: boolean;
    staggered: boolean;
  } {
    if (this.isDead) {
      return { actualHpDamage: 0, shieldDamage: 0, shieldBroken: false, phaseChanged: false, died: false, staggered: false };
    }

    let shieldDamage = 0;
    let shieldBroken = false;
    let actualHpDamage = 0;

    // 1. Absorção por Escudo
    if (this.currentShield > 0) {
      if (amount <= this.currentShield) {
        this.currentShield -= amount;
        shieldDamage = amount;
        amount = 0;
      } else {
        shieldDamage = this.currentShield;
        amount -= this.currentShield;
        this.currentShield = 0;
        shieldBroken = true;
      }
    }

    // 2. Dano direto à Vida
    if (amount > 0) {
      actualHpDamage = Math.min(this.currentHp, amount);
      this.currentHp -= actualHpDamage;
    }

    // 3. Poise & Stagger (Chefes enraivecidos têm imunidade estrita a stagger)
    let staggered = false;
    if (!this.isEnraged) {
      this.poise -= poiseDamage;
      if (this.poise <= 0) {
        this.state = 'STAGGERED';
        this.staggerUntil = Date.now() + 1200;
        this.poise = this.maxPoise;
        staggered = true;
        // Interrompe qualquer canalização de telégrafo se tomar stagger
        if (this.activeTelegraph) {
          this.activeTelegraph = null;
        }
      }
    }

    // 4. Morte
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.isDead = true;
      this.state = 'DEAD';
      this.activeTelegraph = null;
      return { actualHpDamage, shieldDamage, shieldBroken, phaseChanged: false, died: true, staggered: false };
    }

    // 5. Verificação de Transição de Fase
    const currentHpPercent = (this.currentHp / this.maxHp) * 100;
    let phaseChanged = false;

    for (let i = this.config.phases.length - 1; i >= 0; i--) {
      const p = this.config.phases[i];
      if (currentHpPercent <= p.hpThresholdPercent && this.currentPhaseIndex < p.phaseIndex) {
        this.currentPhaseIndex = p.phaseIndex;
        this.applyPhaseConfig(p);
        phaseChanged = true;
        break;
      }
    }

    return { actualHpDamage, shieldDamage, shieldBroken, phaseChanged, died: false, staggered };
  }

  /**
   * Tenta iniciar um ataque telegrafado disponível da fase atual
   */
  public tryStartTelegraph(now: number, targetX: number, targetY: number): ActiveTelegraph | null {
    if (this.isDead || this.state === 'STAGGERED' || this.activeTelegraph) {
      return null;
    }

    const phase = this.getCurrentPhase();
    for (const skill of phase.telegraphSkills) {
      const lastUsed = this.skillCooldowns.get(skill.id) || 0;
      if (now - lastUsed >= skill.cooldownMs) {
        this.activeTelegraph = {
          castId: `cast-${skill.id}-${now.toString(16)}`,
          skill,
          startedAt: now,
          finishesAt: now + skill.castDurationMs,
          originX: this.x,
          originY: this.y,
          targetX,
          targetY,
        };
        this.skillCooldowns.set(skill.id, now);
        this.state = 'ATTACKING';
        return this.activeTelegraph;
      }
    }

    return null;
  }

  /**
   * Conclui ou expira telégrafo ativo
   */
  public updateTelegraph(now: number): {
    completed: boolean;
    telegraph: ActiveTelegraph | null;
  } {
    if (!this.activeTelegraph) {
      return { completed: false, telegraph: null };
    }

    if (now >= this.activeTelegraph.finishesAt) {
      const finished = this.activeTelegraph;
      this.activeTelegraph = null;
      this.state = 'IDLE';
      return { completed: true, telegraph: finished };
    }

    return { completed: false, telegraph: this.activeTelegraph };
  }

  /**
   * Drena lacaios que foram agendados para spawn durante transições
   */
  public popPendingAdds(): { monsterType: string; count: number }[] {
    const list = [...this.pendingAddSummons];
    this.pendingAddSummons = [];
    return list;
  }

  /**
   * Gera a lista física de drops ao derrotar o chefe
   */
  public generateBossDrops(ownerSessionId?: string): GroundDropItem[] {
    const drops: GroundDropItem[] = [];
    const now = Date.now();
    const expiresAt = now + 60000; // 60 segundos de permanência no chão

    // 1. Pilhas massivas de Zen (2 a 4 pilhas)
    const zenPiles = 3;
    for (let i = 0; i < zenPiles; i++) {
      const zenAmount = Math.floor(this.config.zenMin + Math.random() * (this.config.zenMax - this.config.zenMin));
      const angle = (i / zenPiles) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const dist = 30 + Math.random() * 45;
      drops.push({
        dropId: `drop-boss-zen-${now}-${i}`,
        item: null,
        zen: zenAmount,
        x: Math.round(this.x + Math.cos(angle) * dist),
        y: Math.round(this.y + Math.sin(angle) * dist),
        createdAt: now,
        expiresAt,
        ownerSessionId,
        isJewel: false,
        isExcellent: false,
      });
    }

    // 2. Tabela de Drops Raros & Lendários
    let itemDropIndex = 0;
    for (const entry of this.config.dropTable) {
      const roll = Math.random();
      if (roll <= entry.chance) {
        const itemLevel = entry.maxLevel ? Math.floor(Math.random() * (entry.maxLevel + 1)) : 0;
        const hasSkill = entry.allowSkill ? Math.random() < 0.6 : false;
        const hasLuck = entry.allowLuck ? Math.random() < 0.4 : false;
        const isExclRoll = entry.excellentChance ? Math.random() < entry.excellentChance : false;

        let excellentOptions = 0;
        if (isExclRoll) {
          excellentOptions = WeaponExcellentOption.ATTACK_SPEED_7 | WeaponExcellentOption.INCREASE_DMG_2_PERCENT;
        }

        const itemInst = Item.create(entry.itemDefId, {
          level: itemLevel,
          skill: hasSkill,
          luck: hasLuck,
          excellentMask: excellentOptions,
        });

        const angle = Math.random() * Math.PI * 2;
        const dist = 35 + Math.random() * 55;
        const isJewel = Item.getDefinition(itemInst).category === ItemCategory.JEWEL;
        const isExcellent = (itemInst.excellentMask ?? 0) > 0;

        drops.push({
          dropId: `drop-boss-item-${now}-${itemDropIndex++}`,
          item: itemInst,
          zen: 0,
          x: Math.round(this.x + Math.cos(angle) * dist),
          y: Math.round(this.y + Math.sin(angle) * dist),
          createdAt: now,
          expiresAt,
          ownerSessionId,
          isJewel,
          isExcellent,
        });
      }
    }

    return drops;
  }

  public toJSON(): SerializedBoss {
    const phase = this.getCurrentPhase();
    const now = Date.now();

    return {
      id: this.id,
      type: this.type,
      name: this.name,
      title: this.title,
      location: this.location,
      level: this.level,
      currentHp: this.currentHp,
      maxHp: this.maxHp,
      currentShield: this.currentShield,
      maxShield: this.maxShield,
      poise: this.poise,
      maxPoise: this.maxPoise,
      currentPhaseIndex: this.currentPhaseIndex,
      currentPhaseName: phase.name,
      isEnraged: this.isEnraged,
      x: this.x,
      y: this.y,
      targetX: this.targetX,
      targetY: this.targetY,
      state: this.state,
      isDead: this.isDead,
      activeTelegraph: this.activeTelegraph
        ? {
            skillId: this.activeTelegraph.skill.id,
            skillName: this.activeTelegraph.skill.name,
            shape: this.activeTelegraph.skill.shape,
            durationMs: this.activeTelegraph.skill.castDurationMs,
            remainingMs: Math.max(0, this.activeTelegraph.finishesAt - now),
            radius: this.activeTelegraph.skill.radius,
            angleDeg: this.activeTelegraph.skill.angleDeg,
          }
        : null,
      auraActive: !!phase.auraDamagePerSec,
      auraType: phase.auraType,
    };
  }
}
