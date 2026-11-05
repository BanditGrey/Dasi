/**
 * Dasi MMORPG - Instância do Chaos Castle (O Coliseu das Lajes Desabantes)
 * Battle Royale medieval com armadura idêntica, lajes que desabam no abismo cósmico e ondas de choque na morte.
 */

export interface ChaosCombatant {
  id: string;
  name: string;
  isPlayer: boolean;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  isAlive: boolean;
  fallenInAbyss: boolean;
}

export type ChaosCastleStage = 'WAITING' | 'STAGE_1_FULL' | 'STAGE_2_COLLAPSED_1' | 'STAGE_3_COLLAPSED_2' | 'FINISHED';

export class ChaosCastleInstance {
  public readonly id: string;
  public stage: ChaosCastleStage = 'WAITING';
  public startTime = 0;
  public endTime = 0;
  public durationMs: number;

  public combatants: Map<string, ChaosCombatant> = new Map();
  public initialCount = 0;

  // Limites da Arena (Dimensões em Metros/Unidades)
  // Stage 1 (Full): 42x42m -> [-21, 21]
  // Stage 2 (1º Colapso): 28x28m -> [-14, 14]
  // Stage 3 (2º Colapso): 14x14m -> [-7, 7]
  public currentHalfSize = 21.0;

  public winnerId: string | null = null;
  public recentShockwaves: { x: number; y: number; radius: number; force: number }[] = [];

  constructor(instanceId: string, durationMs = 10 * 60 * 1000) {
    this.id = instanceId;
    this.durationMs = durationMs;
  }

  public addCombatant(id: string, name: string, isPlayer: boolean, hp = 1000, x?: number, y?: number): void {
    let spawnX = x;
    let spawnY = y;
    if (spawnX === undefined || spawnY === undefined) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 5.0; // Spawna dentro da plataforma central
      spawnX = Math.round(Math.cos(angle) * dist);
      spawnY = Math.round(Math.sin(angle) * dist);
    }
    this.combatants.set(id, {
      id,
      name,
      isPlayer,
      hp,
      maxHp: hp,
      x: spawnX,
      y: spawnY,
      isAlive: true,
      fallenInAbyss: false,
    });
  }

  public start(now = Date.now()): void {
    this.startTime = now;
    this.endTime = now + this.durationMs;
    this.stage = 'STAGE_1_FULL';
    this.currentHalfSize = 21.0;
    this.initialCount = this.combatants.size;
  }

  public getAliveCount(): number {
    let count = 0;
    for (const c of this.combatants.values()) {
      if (c.isAlive && !c.fallenInAbyss) count++;
    }
    return count;
  }

  /**
   * Processa dano em um combatente e lida com morte explosiva
   */
  public damageCombatant(targetId: string, damage: number): {
    died: boolean;
    shockwave: { x: number; y: number; radius: number } | null;
    stageAdvanced: boolean;
    winner: string | null;
  } {
    const target = this.combatants.get(targetId);
    if (!target || !target.isAlive) {
      return { died: false, shockwave: null, stageAdvanced: false, winner: null };
    }

    target.hp -= damage;
    if (target.hp <= 0) {
      target.hp = 0;
      target.isAlive = false;

      // 1. Detonação da Onda de Choque na Morte
      const shockwave = {
        x: target.x,
        y: target.y,
        radius: 4.5,
        force: 2.2,
      };
      this.recentShockwaves.push(shockwave);
      this.applyShockwaveKnockback(shockwave.x, shockwave.y, shockwave.radius, shockwave.force);

      // 2. Verifica encolhimento da Arena com base nos combatentes restantes
      const stageAdvanced = this.checkArenaCollapse();

      // 3. Verifica condição de vitória (Último Sobrevivente)
      const aliveCount = this.getAliveCount();
      if (aliveCount <= 1) {
        this.stage = 'FINISHED';
        for (const c of this.combatants.values()) {
          if (c.isAlive && !c.fallenInAbyss) {
            this.winnerId = c.id;
            break;
          }
        }
        return { died: true, shockwave, stageAdvanced, winner: this.winnerId };
      }

      return { died: true, shockwave, stageAdvanced, winner: null };
    }

    return { died: false, shockwave: null, stageAdvanced: false, winner: null };
  }

  /**
   * Empurra combatentes próximos e verifica queda no abismo
   */
  private applyShockwaveKnockback(originX: number, originY: number, radius: number, force: number): void {
    for (const c of this.combatants.values()) {
      if (!c.isAlive || c.fallenInAbyss) continue;

      const dx = c.x - originX;
      const dy = c.y - originY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0 && dist <= radius) {
        const factor = (1 - dist / radius) * force;
        c.x += (dx / dist) * factor * 2;
        c.y += (dy / dist) * factor * 2;

        // Verifica se foi empurrado para além das lajes ativas da arena (Ring-out no abismo)
        if (Math.abs(c.x) > this.currentHalfSize || Math.abs(c.y) > this.currentHalfSize) {
          c.fallenInAbyss = true;
          c.isAlive = false;
        }
      }
    }
  }

  /**
   * Avalia se as lajes externas devem desabar
   */
  private checkArenaCollapse(): boolean {
    const alive = this.getAliveCount();
    const ratio = this.initialCount > 0 ? alive / this.initialCount : 1.0;

    if (this.stage === 'STAGE_1_FULL' && ratio <= 0.75) {
      this.stage = 'STAGE_2_COLLAPSED_1';
      this.currentHalfSize = 14.0; // Encolhe para 28x28m
      this.purgeCombatantsInVoid();
      return true;
    }

    if (this.stage === 'STAGE_2_COLLAPSED_1' && ratio <= 0.40) {
      this.stage = 'STAGE_3_COLLAPSED_2';
      this.currentHalfSize = 7.0; // Encolhe para 14x14m (Tablado Central)
      this.purgeCombatantsInVoid();
      return true;
    }

    return false;
  }

  /**
   * Elimina qualquer combatente que esteja sobre lajes que acabaram de desabar
   */
  private purgeCombatantsInVoid(): void {
    for (const c of this.combatants.values()) {
      if (c.isAlive && (Math.abs(c.x) > this.currentHalfSize || Math.abs(c.y) > this.currentHalfSize)) {
        c.fallenInAbyss = true;
        c.isAlive = false;
      }
    }
  }

  /**
   * Ciclo de atualização de tempo
   */
  public update(now = Date.now()): {
    stage: ChaosCastleStage;
    aliveCount: number;
    winner: string | null;
  } {
    if (this.stage === 'FINISHED') {
      return { stage: 'FINISHED', aliveCount: this.getAliveCount(), winner: this.winnerId };
    }

    if (now >= this.endTime) {
      this.stage = 'FINISHED';
      // Quem tiver maior HP vence
      let bestCandidate: ChaosCombatant | null = null;
      for (const c of this.combatants.values()) {
        if (c.isAlive && !c.fallenInAbyss) {
          if (!bestCandidate || c.hp > bestCandidate.hp) {
            bestCandidate = c;
          }
        }
      }
      this.winnerId = bestCandidate ? bestCandidate.id : null;
      return { stage: 'FINISHED', aliveCount: this.getAliveCount(), winner: this.winnerId };
    }

    return { stage: this.stage, aliveCount: this.getAliveCount(), winner: null };
  }

  public toJSON(): object {
    return {
      id: this.id,
      stage: this.stage,
      currentHalfSize: this.currentHalfSize,
      initialCount: this.initialCount,
      aliveCount: this.getAliveCount(),
      winnerId: this.winnerId,
      combatants: Array.from(this.combatants.values()).map((c) => ({
        id: c.id,
        name: c.name,
        isPlayer: c.isPlayer,
        hp: c.hp,
        maxHp: c.maxHp,
        x: Math.round(c.x),
        y: Math.round(c.y),
        isAlive: c.isAlive,
        fallenInAbyss: c.fallenInAbyss,
      })),
    };
  }
}
