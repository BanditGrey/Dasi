/**
 * Dasi MMORPG - Instância das Catacumbas Subterrâneas (Dungeon Multi-Andares)
 * Andar 1 (Ossuário & Portão de Ossos) -> Andar 2 (Lodo Tóxico & Válvulas) -> Andar 3 (Covil do Gorgon).
 */

import { BossEntity } from '../bosses/BossEntity.ts';
import { Monster, type GroundDropItem } from '../combat/Monster.ts';
import { Item } from '../inventory/Item.ts';
import type { ClientSession } from '../network/SessionManager.ts';

export type DungeonFloor = 1 | 2 | 3;
export type DungeonState = 'ACTIVE' | 'CLEARED' | 'FAILED';

export interface DungeonObjective {
  id: string;
  floor: DungeonFloor;
  description: string;
  isCompleted: boolean;
}

export class DungeonInstance {
  public readonly id: string;
  public state: DungeonState = 'ACTIVE';
  public currentFloor: DungeonFloor = 1;
  public startTime = 0;
  public endTime = 0;
  public readonly durationMs: number;

  public participants: Set<string> = new Set();
  public deathsCount = 0;
  public secretsFound = 0;

  // Andar 1: Chave de Ossos e Portão
  public floor1GateUnlocked = false;
  public boneKeyFound = false;

  // Andar 2: Válvulas de Drenagem de Lodo Tóxico
  public toxicMudActive = true;
  public valvesActivated = 0;
  public readonly totalValvesRequired = 2;
  public floor2GateUnlocked = false;

  // Andar 3: Covil do Gorgon e Pilares Rúnicos
  public gorgonBoss: BossEntity | null = null;
  public pillarsRemaining = 8;
  public gorgonDefeated = false;

  public objectives: DungeonObjective[] = [
    {
      id: 'dng_obj_floor1_key',
      floor: 1,
      description: 'Derrote o Sentinela dos Ossos e recupere a Chave dos Ossos (Andar 1)',
      isCompleted: false,
    },
    {
      id: 'dng_obj_floor1_gate',
      floor: 1,
      description: 'Destranque o Portão de Ferro para acessar o Andar 2',
      isCompleted: false,
    },
    {
      id: 'dng_obj_floor2_valves',
      floor: 2,
      description: 'Ative as 2 Válvulas Antigas para drenar o lodo ácido e abrir o Andar 3',
      isCompleted: false,
    },
    {
      id: 'dng_obj_floor3_gorgon',
      floor: 3,
      description: 'Adentre a Cúpula Fraturada e aniquile Gorgon, o Guardião do Abismo',
      isCompleted: false,
    },
  ];

  constructor(instanceId: string, durationMs = 20 * 60 * 1000) {
    this.id = instanceId;
    this.durationMs = durationMs;
  }

  public start(now = Date.now()): void {
    this.startTime = now;
    this.endTime = now + this.durationMs;
    this.state = 'ACTIVE';
  }

  public addParticipant(sessionId: string): void {
    this.participants.add(sessionId);
  }

  public removeParticipant(sessionId: string): void {
    this.participants.delete(sessionId);
  }

  /**
   * Coleta a Chave dos Ossos no Andar 1
   */
  public collectBoneKey(): boolean {
    if (this.currentFloor !== 1) return false;
    this.boneKeyFound = true;
    const obj = this.objectives.find((o) => o.id === 'dng_obj_floor1_key');
    if (obj) obj.isCompleted = true;
    return true;
  }

  /**
   * Destranca o portão do Andar 1 e transiciona para o Andar 2
   */
  public unlockFloor1Gate(): boolean {
    if (this.currentFloor !== 1 || !this.boneKeyFound) return false;
    this.floor1GateUnlocked = true;
    this.currentFloor = 2;
    const obj = this.objectives.find((o) => o.id === 'dng_obj_floor1_gate');
    if (obj) obj.isCompleted = true;
    return true;
  }

  /**
   * Ativa uma válvula de drenagem de esgoto ácido no Andar 2
   */
  public activateDrainValve(): {
    valvesActivated: number;
    mudDrained: boolean;
    floor3Unlocked: boolean;
  } {
    if (this.currentFloor !== 2) {
      return { valvesActivated: this.valvesActivated, mudDrained: !this.toxicMudActive, floor3Unlocked: this.floor2GateUnlocked };
    }

    this.valvesActivated = Math.min(this.totalValvesRequired, this.valvesActivated + 1);

    if (this.valvesActivated >= this.totalValvesRequired) {
      this.toxicMudActive = false;
      this.floor2GateUnlocked = true;
      this.currentFloor = 3;
      const obj = this.objectives.find((o) => o.id === 'dng_obj_floor2_valves');
      if (obj) obj.isCompleted = true;

      // Spawna o Gorgon no Andar 3
      this.gorgonBoss = new BossEntity('boss_gorgon', 400, 250);

      return { valvesActivated: this.valvesActivated, mudDrained: true, floor3Unlocked: true };
    }

    return { valvesActivated: this.valvesActivated, mudDrained: false, floor3Unlocked: false };
  }

  /**
   * Destrói um pilar rúnico do Gorgon durante a luta (cobertura)
   */
  public destroyPillar(): number {
    if (this.pillarsRemaining > 0) {
      this.pillarsRemaining--;
    }
    return this.pillarsRemaining;
  }

  /**
   * Registra a derrota de Gorgon no Andar 3
   */
  public recordGorgonDefeated(): boolean {
    if (this.currentFloor !== 3) return false;
    this.gorgonDefeated = true;
    this.state = 'CLEARED';
    const obj = this.objectives.find((o) => o.id === 'dng_obj_floor3_gorgon');
    if (obj) obj.isCompleted = true;
    return true;
  }

  /**
   * Calcula a classificação final (Rank S, A, B, C) e recompensas
   */
  public calculateRank(now = Date.now()): {
    rank: 'S' | 'A' | 'B' | 'C';
    timeElapsedSeconds: number;
    rewards: {
      jewels: string[];
      boxDefId: string;
      zen: number;
      xpBonus: number;
    };
  } {
    const elapsedSec = Math.floor((now - this.startTime) / 1000);
    let rank: 'S' | 'A' | 'B' | 'C' = 'C';

    if (elapsedSec < 300 && this.deathsCount === 0) {
      rank = 'S';
    } else if (elapsedSec < 500 && this.deathsCount <= 1) {
      rank = 'A';
    } else if (elapsedSec < 800) {
      rank = 'B';
    } else {
      rank = 'C';
    }

    let jewels = ['jewel_of_blessing'];
    let boxDefId = 'box_of_kundun_2';
    let zen = 100000;
    let xpBonus = 40000;

    switch (rank) {
      case 'S':
        jewels = ['jewel_of_blessing', 'jewel_of_soul', 'jewel_of_chaos', 'jewel_of_life'];
        boxDefId = 'box_of_kundun_4';
        zen = 400000;
        xpBonus = 150000;
        break;
      case 'A':
        jewels = ['jewel_of_blessing', 'jewel_of_soul', 'jewel_of_chaos'];
        boxDefId = 'box_of_kundun_3';
        zen = 250000;
        xpBonus = 90000;
        break;
      case 'B':
        jewels = ['jewel_of_blessing', 'jewel_of_chaos'];
        boxDefId = 'box_of_kundun_2';
        zen = 150000;
        xpBonus = 60000;
        break;
      case 'C':
      default:
        jewels = ['jewel_of_chaos'];
        boxDefId = 'box_of_kundun_1';
        zen = 80000;
        xpBonus = 35000;
        break;
    }

    return {
      rank,
      timeElapsedSeconds: elapsedSec,
      rewards: {
        jewels,
        boxDefId,
        zen,
        xpBonus,
      },
    };
  }

  public toJSON(now = Date.now()): object {
    return {
      id: this.id,
      state: this.state,
      currentFloor: this.currentFloor,
      timeRemainingMs: Math.max(0, this.endTime - now),
      participantsCount: this.participants.size,
      floor1GateUnlocked: this.floor1GateUnlocked,
      boneKeyFound: this.boneKeyFound,
      toxicMudActive: this.toxicMudActive,
      valvesActivated: this.valvesActivated,
      totalValvesRequired: this.totalValvesRequired,
      floor2GateUnlocked: this.floor2GateUnlocked,
      pillarsRemaining: this.pillarsRemaining,
      gorgonBoss: this.gorgonBoss ? this.gorgonBoss.toJSON() : null,
      gorgonDefeated: this.gorgonDefeated,
      objectives: this.objectives,
    };
  }
}
