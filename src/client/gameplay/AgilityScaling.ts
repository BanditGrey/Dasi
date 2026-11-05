/**
 * Agility & Attack Speed Scalability System for Dasi (Client Gameplay).
 * Computes non-linear Bézier timing curves and continuous momentum blending.
 */

export interface AttackPhaseTiming {
  windupTime: number;
  activeStrikeTime: number;
  recoveryTime: number;
  totalDuration: number;
  comboWindowStart: number;
  attacksPerSecond: number;
  hasAfterImages: boolean;
}

export class AgilityScaling {
  public static readonly BASE_WINDUP = 0.35;
  public static readonly BASE_ACTIVE = 0.18;
  public static readonly BASE_RECOVERY = 0.42;

  public static readonly MIN_WINDUP = 0.08;
  public static readonly MIN_ACTIVE_WINDOW = 0.065; // Strictly clamped to prevent hit-box collapse
  public static readonly MIN_RECOVERY = 0.06;

  public static readonly K_WINDUP = 0.0018;
  public static readonly K_ACTIVE = 0.0009;
  public static readonly K_RECOVERY = 0.0022;

  public static readonly GHOSTING_AGI_THRESHOLD = 1200;

  public static calculatePhaseTimings(agility: number, weaponSpeedMod = 1.0): AttackPhaseTiming {
    const safeAgi = Math.max(10, agility);
    const speedMod = Math.max(0.5, Math.min(2.0, weaponSpeedMod));

    let windup =
      this.MIN_WINDUP + (this.BASE_WINDUP - this.MIN_WINDUP) * Math.exp(-this.K_WINDUP * safeAgi);
    windup /= speedMod;

    let active =
      this.MIN_ACTIVE_WINDOW +
      (this.BASE_ACTIVE - this.MIN_ACTIVE_WINDOW) * Math.exp(-this.K_ACTIVE * safeAgi);
    active /= speedMod;
    active = Math.max(this.MIN_ACTIVE_WINDOW, active);

    let recovery =
      this.MIN_RECOVERY + (this.BASE_RECOVERY - this.MIN_RECOVERY) * Math.exp(-this.K_RECOVERY * safeAgi);
    recovery /= speedMod;

    const total = windup + active + recovery;
    const comboWindow = Math.max(0.2, 0.6 - (safeAgi / 4000) * 0.4);
    const aps = 1.0 / total;

    return {
      windupTime: Number(windup.toFixed(4)),
      activeStrikeTime: Number(active.toFixed(4)),
      recoveryTime: Number(recovery.toFixed(4)),
      totalDuration: Number(total.toFixed(4)),
      comboWindowStart: Number(comboWindow.toFixed(3)),
      attacksPerSecond: Number(aps.toFixed(2)),
      hasAfterImages: safeAgi >= this.GHOSTING_AGI_THRESHOLD,
    };
  }

  public static calculateComboTiming(step: number, agility: number, weaponSpeedMod = 1.0): AttackPhaseTiming {
    const base = this.calculatePhaseTimings(agility, weaponSpeedMod);
    const momentumReduction = step === 2 ? 0.25 : step >= 3 ? 0.35 : 0.0;
    const chainedWindup = Math.max(this.MIN_WINDUP, base.windupTime * (1.0 - momentumReduction));
    const total = chainedWindup + base.activeStrikeTime + base.recoveryTime;

    return {
      ...base,
      windupTime: Number(chainedWindup.toFixed(4)),
      totalDuration: Number(total.toFixed(4)),
      attacksPerSecond: Number((1.0 / total).toFixed(2)),
    };
  }
}
