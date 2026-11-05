/**
 * Dasi MMORPG - Gerenciador Central de Chefes Mundiais & Sub-Chefes
 * Orquestra spawns, ciclos de IA, telégrafos, auras e invasões douradas.
 */

import { BossEntity, type SerializedBoss, type ActiveTelegraph } from './BossEntity.ts';
import { BOSS_CONFIGS } from './BossDefinitions.ts';
import { GoldenInvasionSystem } from './GoldenInvasionSystem.ts';
import { Monster, type GroundDropItem } from '../combat/Monster.ts';
import type { MobSpawner } from '../combat/MobSpawner.ts';

export interface BossTickResult {
  updatedBosses: SerializedBoss[];
  newTelegraphs: ActiveTelegraph[];
  completedTelegraphs: ActiveTelegraph[];
  spawnedAdds: Monster[];
  auraHits: {
    bossId: string;
    bossName: string;
    auraType: string;
    damage: number;
    x: number;
    y: number;
    radius: number;
  }[];
}

export class BossManager {
  private activeBosses: Map<string, BossEntity> = new Map();
  public readonly goldenInvasion: GoldenInvasionSystem;
  private lastAuraCheckTime = 0;

  constructor() {
    this.goldenInvasion = new GoldenInvasionSystem();
  }

  /**
   * Spawna um chefe com base no tipo canônico
   */
  public spawnBoss(type: string, x = 400, y = 250): BossEntity {
    const boss = new BossEntity(type, x, y);
    this.activeBosses.set(boss.id, boss);
    return boss;
  }

  public getBoss(bossId: string): BossEntity | undefined {
    return this.activeBosses.get(bossId);
  }

  public getAllBosses(): BossEntity[] {
    return Array.from(this.activeBosses.values());
  }

  public getSerializedBosses(): SerializedBoss[] {
    return Array.from(this.activeBosses.values()).map((b) => b.toJSON());
  }

  public removeBoss(bossId: string): boolean {
    return this.activeBosses.delete(bossId);
  }

  /**
   * Ciclo de atualização de IA e habilidades para todos os chefes ativos
   */
  public update(now: number, spawner?: MobSpawner): BossTickResult {
    const updatedBosses: SerializedBoss[] = [];
    const newTelegraphs: ActiveTelegraph[] = [];
    const completedTelegraphs: ActiveTelegraph[] = [];
    const spawnedAdds: Monster[] = [];
    const auraHits: BossTickResult['auraHits'] = [];

    const isAuraTick = now - this.lastAuraCheckTime >= 1000;
    if (isAuraTick) {
      this.lastAuraCheckTime = now;
    }

    for (const [bossId, boss] of this.activeBosses.entries()) {
      if (boss.isDead) {
        continue;
      }

      // 1. Atualização do Telégrafo Ativo
      const telegraphStatus = boss.updateTelegraph(now);
      if (telegraphStatus.completed && telegraphStatus.telegraph) {
        completedTelegraphs.push(telegraphStatus.telegraph);
      }

      // 2. Tenta iniciar um novo ataque telegrafado se estiver ocioso
      if (!boss.activeTelegraph && boss.state !== 'STAGGERED') {
        const started = boss.tryStartTelegraph(now, boss.targetX, boss.targetY);
        if (started) {
          newTelegraphs.push(started);
        }
      }

      // 3. Processa Lacaios Convocados pela transição de fase
      const pendingAdds = boss.popPendingAdds();
      for (const addBatch of pendingAdds) {
        for (let i = 0; i < addBatch.count; i++) {
          const angle = (i / addBatch.count) * Math.PI * 2;
          const addX = Math.round(boss.x + Math.cos(angle) * 60);
          const addY = Math.round(boss.y + Math.sin(angle) * 60);
          const mob = new Monster(addBatch.monsterType, addX, addY);
          spawnedAdds.push(mob);
          if (spawner) {
            spawner.registerExternalMonster(mob);
          }
        }
      }

      // 4. Dano de Aura por Segundo
      const currentPhase = boss.getCurrentPhase();
      if (isAuraTick && currentPhase.auraDamagePerSec && currentPhase.auraDamagePerSec > 0) {
        auraHits.push({
          bossId: boss.id,
          bossName: boss.name,
          auraType: currentPhase.auraType || 'FIRE',
          damage: currentPhase.auraDamagePerSec,
          x: boss.x,
          y: boss.y,
          radius: 120, // Raio de proximidade em unidades
        });
      }

      updatedBosses.push(boss.toJSON());
    }

    return {
      updatedBosses,
      newTelegraphs,
      completedTelegraphs,
      spawnedAdds,
      auraHits,
    };
  }
}
