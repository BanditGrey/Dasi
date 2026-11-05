/**
 * Client Combat State Machine with i-frames, Hit-Stop Dilation, and Combo Buffer.
 */

import { AgilityScaling, type AttackPhaseTiming } from './AgilityScaling.ts';

export const CombatState = {
  IDLE: 'IDLE',
  WINDUP: 'WINDUP',
  ACTIVE_STRIKE: 'ACTIVE_STRIKE',
  HIT_STOP: 'HIT_STOP',
  RECOVERY: 'RECOVERY',
  DODGE: 'DODGE',
} as const;
export type CombatState = typeof CombatState[keyof typeof CombatState];

export class CombatStateMachine {
  public currentState: CombatState = CombatState.IDLE;
  public stateTime = 0;
  public comboStep = 1;
  public isInvulnerable = false;
  public hitStopRemaining = 0;
  private stateBeforeHitStop: CombatState = CombatState.ACTIVE_STRIKE;
  private hasBufferedAttack = false;

  public readonly actorId: string;
  public agility: number;
  public weaponSpeedMod: number;
  public timings: AttackPhaseTiming;

  constructor(
    actorId: string,
    agility: number = 100,
    weaponSpeedMod: number = 1.0
  ) {
    this.actorId = actorId;
    this.agility = agility;
    this.weaponSpeedMod = weaponSpeedMod;
    this.timings = AgilityScaling.calculatePhaseTimings(this.agility, this.weaponSpeedMod);
  }

  public triggerAttack(): boolean {
    if (this.currentState === CombatState.IDLE) {
      this.comboStep = 1;
      this.transitionTo(CombatState.WINDUP);
      return true;
    }

    if (this.currentState === CombatState.RECOVERY) {
      const progress = this.stateTime / Math.max(1e-4, this.timings.recoveryTime);
      if (progress >= this.timings.comboWindowStart) {
        this.advanceCombo();
        return true;
      }
      this.hasBufferedAttack = true;
      return true;
    }

    if (
      this.currentState === CombatState.WINDUP ||
      this.currentState === CombatState.ACTIVE_STRIKE ||
      this.currentState === CombatState.HIT_STOP
    ) {
      this.hasBufferedAttack = true;
      return true;
    }

    return false;
  }

  public triggerDodge(): boolean {
    if (
      this.currentState === CombatState.IDLE ||
      this.currentState === CombatState.RECOVERY ||
      this.currentState === CombatState.WINDUP
    ) {
      this.transitionTo(CombatState.DODGE);
      return true;
    }
    return false;
  }

  public triggerHitStop(duration: number): void {
    if (duration <= 0) return;
    this.hitStopRemaining = duration;
    if (this.currentState !== CombatState.HIT_STOP) {
      this.stateBeforeHitStop = this.currentState;
      this.transitionTo(CombatState.HIT_STOP);
    }
  }

  private advanceCombo(): void {
    this.comboStep = (this.comboStep % 3) + 1;
    this.transitionTo(CombatState.WINDUP);
  }

  private transitionTo(nextState: CombatState): void {
    this.currentState = nextState;
    this.stateTime = 0;

    if (nextState === CombatState.WINDUP) {
      this.timings =
        this.comboStep === 1
          ? AgilityScaling.calculatePhaseTimings(this.agility, this.weaponSpeedMod)
          : AgilityScaling.calculateComboTiming(this.comboStep, this.agility, this.weaponSpeedMod);
      this.hasBufferedAttack = false;
    } else if (nextState === CombatState.IDLE) {
      this.comboStep = 1;
      this.isInvulnerable = false;
    }
  }

  public update(deltaTime: number): void {
    if (deltaTime <= 0) return;

    if (this.currentState === CombatState.HIT_STOP) {
      this.hitStopRemaining -= deltaTime;
      if (this.hitStopRemaining <= 0) {
        this.hitStopRemaining = 0;
        this.transitionTo(this.stateBeforeHitStop);
      }
      return;
    }

    this.stateTime += deltaTime;

    switch (this.currentState) {
      case CombatState.WINDUP:
        if (this.stateTime >= this.timings.windupTime) {
          this.transitionTo(CombatState.ACTIVE_STRIKE);
        }
        break;

      case CombatState.ACTIVE_STRIKE:
        if (this.stateTime >= this.timings.activeStrikeTime) {
          this.transitionTo(CombatState.RECOVERY);
        }
        break;

      case CombatState.RECOVERY: {
        const progress = this.stateTime / Math.max(1e-4, this.timings.recoveryTime);
        if (this.hasBufferedAttack && progress >= this.timings.comboWindowStart) {
          this.advanceCombo();
          return;
        }
        if (this.stateTime >= this.timings.recoveryTime) {
          this.transitionTo(CombatState.IDLE);
        }
        break;
      }

      case CombatState.DODGE: {
        // i-frames active between 20ms and 240ms
        this.isInvulnerable = this.stateTime >= 0.02 && this.stateTime <= 0.24;
        if (this.stateTime >= 0.45) {
          this.transitionTo(CombatState.IDLE);
        }
        break;
      }
    }
  }
}
