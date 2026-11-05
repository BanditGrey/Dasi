/**
 * Dasi MMORPG - Instância do Blood Castle (A Ponte do Martírio)
 * Rush PvE contra o relógio de 15 minutos: Quota da Ponte -> Quebra do Portão -> Feiticeiros -> Entrega ao Arcanjo.
 */

import { Monster, type GroundDropItem } from '../combat/Monster.ts';
import { Item } from '../inventory/Item.ts';
import { ItemCategory } from '../inventory/types.ts';

export type BloodCastleStage =
  | 'WAITING_START'
  | 'BRIDGE_KILL_QUOTA'
  | 'CASTLE_GATE_ASSAULT'
  | 'SANCTUM_SORCERERS'
  | 'ARCHANGEL_WEAPON_DELIVERY'
  | 'TRIUMPH'
  | 'FAILED';

export interface BloodCastleConfig {
  instanceId: string;
  durationMs?: number; // Padrão: 15 minutos (900.000 ms)
  bridgeMobQuota?: number; // Padrão: 15 monstros
  gateMaxHp?: number; // Padrão: 15.000 HP
  sorcerersCount?: number; // Padrão: 3 feiticeiros
}

export class BloodCastleInstance {
  public readonly id: string;
  public stage: BloodCastleStage = 'WAITING_START';
  public readonly durationMs: number;
  public startTime = 0;
  public endTime = 0;

  // 1. Quota da Ponte
  public bridgeMobsKilled = 0;
  public readonly bridgeMobQuota: number;

  // 2. Portão do Castelo
  public gateHp: number;
  public readonly gateMaxHp: number;
  public gateDestroyed = false;

  // 3. Feiticeiros do Santuário Interior
  public sorcerersKilled = 0;
  public readonly sorcerersCount: number;

  // 4. Arma do Arcanjo
  public weaponDropped = false;
  public weaponCarrierSessionId: string | null = null;
  public archangelDelivered = false;

  public participants: Set<string> = new Set();
  public score = 0;
  public rewardChestGenerated = false;

  constructor(config: BloodCastleConfig) {
    this.id = config.instanceId;
    this.durationMs = config.durationMs ?? 15 * 60 * 1000;
    this.bridgeMobQuota = config.bridgeMobQuota ?? 15;
    this.gateMaxHp = config.gateMaxHp ?? 15000;
    this.gateHp = this.gateMaxHp;
    this.sorcerersCount = config.sorcerersCount ?? 3;
  }

  /**
   * Inicia o evento e ativa a contagem regressiva
   */
  public start(now = Date.now()): void {
    this.startTime = now;
    this.endTime = now + this.durationMs;
    this.stage = 'BRIDGE_KILL_QUOTA';
  }

  public addParticipant(sessionId: string): void {
    this.participants.add(sessionId);
  }

  public removeParticipant(sessionId: string): void {
    this.participants.delete(sessionId);
    if (this.weaponCarrierSessionId === sessionId) {
      this.weaponCarrierSessionId = null; // Dropa a arma se o portador desconectar
    }
  }

  /**
   * Registra abate de um monstro na ponte
   */
  public recordBridgeKill(): { quotaCompleted: boolean } {
    if (this.stage !== 'BRIDGE_KILL_QUOTA') return { quotaCompleted: false };

    this.bridgeMobsKilled++;
    this.score += 50;

    if (this.bridgeMobsKilled >= this.bridgeMobQuota) {
      this.stage = 'CASTLE_GATE_ASSAULT';
      return { quotaCompleted: true };
    }

    return { quotaCompleted: false };
  }

  /**
   * Causa dano ao Portão de Ferro do Castelo
   */
  public attackGate(damage: number): {
    gateHp: number;
    destroyed: boolean;
  } {
    if (this.stage !== 'CASTLE_GATE_ASSAULT') {
      return { gateHp: this.gateHp, destroyed: false };
    }

    this.gateHp = Math.max(0, this.gateHp - damage);
    this.score += Math.round(damage / 10);

    if (this.gateHp <= 0) {
      this.gateHp = 0;
      this.gateDestroyed = true;
      this.stage = 'SANCTUM_SORCERERS';
      return { gateHp: 0, destroyed: true };
    }

    return { gateHp: this.gateHp, destroyed: false };
  }

  /**
   * Registra abate de um Feiticeiro do Caos no pátio interior
   */
  public recordSorcererKill(): {
    allSorcerersDead: boolean;
    weaponRevealed: boolean;
  } {
    if (this.stage !== 'SANCTUM_SORCERERS') {
      return { allSorcerersDead: false, weaponRevealed: false };
    }

    this.sorcerersKilled++;
    this.score += 250;

    if (this.sorcerersKilled >= this.sorcerersCount) {
      this.weaponDropped = true;
      this.stage = 'ARCHANGEL_WEAPON_DELIVERY';
      return { allSorcerersDead: true, weaponRevealed: true };
    }

    return { allSorcerersDead: false, weaponRevealed: false };
  }

  /**
   * Um jogador coleta a Arma Celestial do Arcanjo
   */
  public pickupArchangelWeapon(sessionId: string): boolean {
    if (this.stage !== 'ARCHANGEL_WEAPON_DELIVERY' || !this.weaponDropped) {
      return false;
    }
    this.weaponCarrierSessionId = sessionId;
    this.score += 500;
    return true;
  }

  /**
   * O portador da arma interage com a estátua do Arcanjo no fim da ponte
   */
  public deliverWeaponToArchangel(sessionId: string, now = Date.now()): {
    success: boolean;
    rewards: {
      score: number;
      jewels: string[];
      xpBonus: number;
    } | null;
  } {
    if (this.stage !== 'ARCHANGEL_WEAPON_DELIVERY' || this.weaponCarrierSessionId !== sessionId) {
      return { success: false, rewards: null };
    }

    this.archangelDelivered = true;
    this.stage = 'TRIUMPH';

    // Bônus de tempo restante: 10 pontos por segundo restante
    const remainingSeconds = Math.max(0, Math.floor((this.endTime - now) / 1000));
    const timeBonus = remainingSeconds * 10;
    this.score += 2000 + timeBonus;

    const rewards = {
      score: this.score,
      jewels: ['jewel_of_blessing', 'jewel_of_chaos'],
      xpBonus: 50000 + remainingSeconds * 200,
    };

    return { success: true, rewards };
  }

  /**
   * Atualização de ciclo de tempo
   */
  public update(now = Date.now()): {
    stage: BloodCastleStage;
    timeRemainingMs: number;
    failed: boolean;
  } {
    if (this.stage === 'TRIUMPH' || this.stage === 'FAILED') {
      return { stage: this.stage, timeRemainingMs: 0, failed: this.stage === 'FAILED' };
    }

    const timeRemainingMs = Math.max(0, this.endTime - now);
    if (timeRemainingMs <= 0) {
      this.stage = 'FAILED';
      return { stage: 'FAILED', timeRemainingMs: 0, failed: true };
    }

    return { stage: this.stage, timeRemainingMs, failed: false };
  }

  public toJSON(now = Date.now()): object {
    return {
      id: this.id,
      stage: this.stage,
      timeRemainingMs: Math.max(0, this.endTime - now),
      bridgeMobsKilled: this.bridgeMobsKilled,
      bridgeMobQuota: this.bridgeMobQuota,
      gateHp: this.gateHp,
      gateMaxHp: this.gateMaxHp,
      gateDestroyed: this.gateDestroyed,
      sorcerersKilled: this.sorcerersKilled,
      sorcerersCount: this.sorcerersCount,
      weaponCarrierSessionId: this.weaponCarrierSessionId,
      archangelDelivered: this.archangelDelivered,
      participantsCount: this.participants.size,
      score: this.score,
    };
  }
}
