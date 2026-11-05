/**
 * Dasi MMORPG - Sistema de Invasões Douradas (Golden Invasions)
 * Controla o surgimento global do Exército Dourado e distribuição de Box of Kundun.
 */

import { Monster } from '../combat/Monster.ts';
import type { MobSpawner } from '../combat/MobSpawner.ts';

export interface GoldenInvasionEvent {
  id: string;
  tier: number;
  name: string;
  mapId: string;
  spawnTime: number;
  durationMs: number;
  expiresAt: number;
  spawnedMonsterIds: string[];
  announcement: string;
}

export class GoldenInvasionSystem {
  private activeInvasions: Map<string, GoldenInvasionEvent> = new Map();
  private invasionCounter = 1;

  /**
   * Dispara uma Invasão Dourada em um mapa específico
   */
  public triggerInvasion(spawner: MobSpawner, tier = 1, mapId = 'LORENCIA'): GoldenInvasionEvent {
    const now = Date.now();
    const durationMs = 15 * 60 * 1000; // 15 minutos
    const id = `invasion-golden-${(this.invasionCounter++).toString(16)}`;

    let goldenType = 'golden_budge_dragon';
    let count = 3;
    let announcement = '[ SISTEMA ] O céu se escurece sobre Lorencia... O Golden Budge Dragon emergiu!';

    switch (tier) {
      case 1:
        goldenType = 'golden_budge_dragon';
        count = 3;
        announcement = '[ SISTEMA ] O céu se escurece sobre Lorencia... Golden Budge Dragons avistados!';
        break;
      case 2:
        goldenType = 'golden_soldier';
        count = 2;
        announcement = '[ SISTEMA ] Trombetas ecoam em Devias... Soldados Dourados invadiram as neves!';
        break;
      case 3:
        goldenType = 'golden_titan';
        count = 2;
        announcement = '[ SISTEMA ] A terra estremece nas Catacumbas... Golden Titans despertaram!';
        break;
      case 4:
        goldenType = 'golden_tantalos';
        count = 1;
        announcement = '[ SISTEMA ] As areias de Tarkan fervem... O Golden Tantalos marchou sobre o deserto!';
        break;
      case 5:
      default:
        goldenType = 'golden_dragon';
        count = 1;
        announcement = '[ SISTEMA ] O Grande Dragão Dourado de Kundun desceu sobre os céus de Dasi!';
        break;
    }

    const spawnedMonsterIds: string[] = [];

    // Spawna os monstros através do spawner
    for (let i = 0; i < count; i++) {
      const offsetX = (i - Math.floor(count / 2)) * 60;
      const x = 400 + offsetX;
      const y = 250 + (i % 2 === 0 ? 30 : -30);

      const mob = new Monster(goldenType, x, y);
      spawner.registerExternalMonster(mob);
      spawnedMonsterIds.push(mob.id);
    }

    const event: GoldenInvasionEvent = {
      id,
      tier,
      name: `Invasão Dourada Tier ${tier}`,
      mapId,
      spawnTime: now,
      durationMs,
      expiresAt: now + durationMs,
      spawnedMonsterIds,
      announcement,
    };

    this.activeInvasions.set(id, event);
    return event;
  }

  public getActiveInvasions(): GoldenInvasionEvent[] {
    const now = Date.now();
    const active: GoldenInvasionEvent[] = [];
    for (const [id, inv] of this.activeInvasions.entries()) {
      if (now < inv.expiresAt) {
        active.push(inv);
      } else {
        this.activeInvasions.delete(id);
      }
    }
    return active;
  }
}
