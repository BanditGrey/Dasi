/**
 * Dasi MMORPG - Instância do Devil Square (A Praça Circular da Carnificina Pentagramal)
 * Sobrevivência contra 4 ondas progressivas de monstros com pilares de chamas giratórias.
 */

import { Monster, type GroundDropItem } from '../combat/Monster.ts';
import { Item } from '../inventory/Item.ts';
import { ItemCategory } from '../inventory/types.ts';

export type DevilSquareState = 'WAITING_START' | 'WAVE_ACTIVE' | 'WAVE_INTERMISSION' | 'TRIUMPH' | 'FAILED';

export interface SkullPillarHazard {
  id: string;
  x: number;
  y: number;
  flameAngleDeg: number;
  active: boolean;
  damage: number;
}

export interface WaveConfig {
  waveNumber: number;
  name: string;
  durationMs: number;
  mobTypes: { type: string; count: number }[];
  scorePerKill: number;
}

export class DevilSquareInstance {
  public readonly id: string;
  public state: DevilSquareState = 'WAITING_START';
  public currentWaveIndex = 0;
  public totalWaves = 4;
  public startTime = 0;
  public waveEndTime = 0;
  public eventEndTime = 0;

  public participants: Set<string> = new Set();
  public killsCount = 0;
  public score = 0;

  // 4 Pilares de Crânios Vomitadores de Fogo nos 4 quadrantes
  public readonly pillars: SkullPillarHazard[] = [
    { id: 'pillar_ne', x: 120, y: 120, flameAngleDeg: 0, active: true, damage: 30 },
    { id: 'pillar_nw', x: -120, y: 120, flameAngleDeg: 90, active: true, damage: 30 },
    { id: 'pillar_sw', x: -120, y: -120, flameAngleDeg: 180, active: true, damage: 30 },
    { id: 'pillar_se', x: 120, y: -120, flameAngleDeg: 270, active: true, damage: 30 },
  ];

  public readonly waves: WaveConfig[] = [
    {
      waveNumber: 1,
      name: 'Onda 1: Horda dos Rastejantes',
      durationMs: 90000, // 90 segundos
      mobTypes: [
        { type: 'spider', count: 6 },
        { type: 'budge_dragon', count: 4 },
      ],
      scorePerKill: 20,
    },
    {
      waveNumber: 2,
      name: 'Onda 2: Infantaria das Sombras',
      durationMs: 90000,
      mobTypes: [
        { type: 'hound', count: 5 },
        { type: 'bull_fighter', count: 4 },
        { type: 'skeleton', count: 3 },
      ],
      scorePerKill: 45,
    },
    {
      waveNumber: 3,
      name: 'Onda 3: A Vanguarda Corrompida',
      durationMs: 120000,
      mobTypes: [
        { type: 'skeleton', count: 6 },
        { type: 'golden_soldier', count: 2 },
      ],
      scorePerKill: 90,
    },
    {
      waveNumber: 4,
      name: 'Onda 4: Clímax do Pentagrama Dourado',
      durationMs: 120000,
      mobTypes: [
        { type: 'golden_titan', count: 1 },
        { type: 'golden_budge_dragon', count: 3 },
      ],
      scorePerKill: 200,
    },
  ];

  constructor(instanceId: string) {
    this.id = instanceId;
  }

  public start(now = Date.now()): void {
    this.startTime = now;
    this.currentWaveIndex = 1;
    this.state = 'WAVE_ACTIVE';
    this.waveEndTime = now + this.waves[0].durationMs;
    // Duração total do evento
    const totalDuration = this.waves.reduce((sum, w) => sum + w.durationMs, 0);
    this.eventEndTime = now + totalDuration;
  }

  public addParticipant(sessionId: string): void {
    this.participants.add(sessionId);
  }

  public removeParticipant(sessionId: string): void {
    this.participants.delete(sessionId);
  }

  public recordKill(mobType: string): void {
    this.killsCount++;
    const currentWave = this.getCurrentWaveConfig();
    const points = currentWave ? currentWave.scorePerKill : 30;
    this.score += points;
  }

  public getCurrentWaveConfig(): WaveConfig | undefined {
    return this.waves[this.currentWaveIndex - 1];
  }

  /**
   * Atualiza a rotação dos jatos de chamas dos 4 pilares
   */
  public updatePillars(deltaTimeSec: number): void {
    const rotationSpeed = 35; // graus por segundo
    for (const pillar of this.pillars) {
      pillar.flameAngleDeg = (pillar.flameAngleDeg + rotationSpeed * deltaTimeSec) % 360;
    }
  }

  /**
   * Ciclo de atualização de ondas e temporizadores
   */
  public update(now = Date.now(), deltaTimeSec = 0.05): {
    state: DevilSquareState;
    currentWave: number;
    waveRemainingMs: number;
    waveAdvanced: boolean;
    triumph: boolean;
  } {
    if (this.state === 'TRIUMPH' || this.state === 'FAILED') {
      return {
        state: this.state,
        currentWave: this.currentWaveIndex,
        waveRemainingMs: 0,
        waveAdvanced: false,
        triumph: this.state === 'TRIUMPH',
      };
    }

    this.updatePillars(deltaTimeSec);

    const waveRemainingMs = Math.max(0, this.waveEndTime - now);

    // Se a onda expirou, avança para a próxima
    if (waveRemainingMs <= 0) {
      if (this.currentWaveIndex < this.totalWaves) {
        this.currentWaveIndex++;
        const nextWave = this.getCurrentWaveConfig()!;
        this.waveEndTime = now + nextWave.durationMs;
        this.score += 500; // Bônus de onda concluída
        return {
          state: this.state,
          currentWave: this.currentWaveIndex,
          waveRemainingMs: nextWave.durationMs,
          waveAdvanced: true,
          triumph: false,
        };
      } else {
        // Todas as 4 ondas concluídas com sucesso!
        this.state = 'TRIUMPH';
        this.score += 2500; // Bônus de triunfo
        return {
          state: 'TRIUMPH',
          currentWave: this.currentWaveIndex,
          waveRemainingMs: 0,
          waveAdvanced: false,
          triumph: true,
        };
      }
    }

    return {
      state: this.state,
      currentWave: this.currentWaveIndex,
      waveRemainingMs,
      waveAdvanced: false,
      triumph: false,
    };
  }

  /**
   * Gera a chuva de joias e recompensas do Baú Central de Triunfo
   */
  public generateTriumphRewards(): { jewels: string[]; xpBonus: number; zen: number } {
    return {
      jewels: ['jewel_of_blessing', 'jewel_of_soul', 'jewel_of_chaos', 'jewel_of_life'],
      xpBonus: 60000 + this.killsCount * 300,
      zen: 150000 + this.score * 50,
    };
  }

  public toJSON(now = Date.now()): object {
    return {
      id: this.id,
      state: this.state,
      currentWaveIndex: this.currentWaveIndex,
      totalWaves: this.totalWaves,
      waveName: this.getCurrentWaveConfig()?.name || 'Encerrado',
      waveRemainingMs: Math.max(0, this.waveEndTime - now),
      killsCount: this.killsCount,
      score: this.score,
      participantsCount: this.participants.size,
      pillars: this.pillars.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        angleDeg: Math.round(p.flameAngleDeg),
        damage: p.damage,
      })),
    };
  }
}
