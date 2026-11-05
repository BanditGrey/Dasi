/**
 * Aerodynamic Wing Simulation System for Dasi (Client Gameplay).
 */

export const WingTier = {
  TIER_1_NEOPHYTE: 1,
  TIER_2_CELESTIAL: 2,
  TIER_3_SOVEREIGN: 3,
} as const;
export type WingTier = typeof WingTier[keyof typeof WingTier];

export interface WingState {
  wingspan: number;
  flapFrequencyHz: number;
  liftForceN: number;
  bankingAngleDeg: number;
  gravityReductionFactor: number;
}

export class WingAerodynamics {
  public static simulate(
    tier: WingTier,
    horizontalSpeed: number,
    turnRateYaw: number,
    altitude: number
  ): WingState {
    const minSpan = tier === 1 ? 1.8 : tier === 2 ? 2.8 : 4.2;
    const maxSpan = tier === 1 ? 2.4 : tier === 2 ? 3.8 : 6.0;
    const idleFlap = tier === 1 ? 0.8 : tier === 2 ? 1.2 : 1.6;
    const maxFlap = tier === 1 ? 2.4 : tier === 2 ? 3.2 : 4.0;
    const cL = tier === 1 ? 0.45 : tier === 2 ? 0.85 : 1.4;
    const maxBank = tier === 1 ? 14 : tier === 2 ? 28 : 48;

    const speedRatio = Math.min(1.0, horizontalSpeed / 12.0);
    const wingspan = minSpan + (maxSpan - minSpan) * speedRatio;
    const flapFrequency = idleFlap + (maxFlap - idleFlap) * speedRatio;

    // Lift calculation
    const airDensity = 1.225;
    const wingArea = Math.pow(wingspan * 0.5, 2) * Math.PI * 0.6;
    let lift = 0.5 * airDensity * Math.pow(horizontalSpeed, 2) * wingArea * cL;

    // Ground effect
    if (altitude > 0.1 && altitude < wingspan * 1.5) {
      const hRatio = altitude / wingspan;
      lift *= Math.min(1.8, 1.0 + 0.35 / (hRatio + 0.2));
    }

    const weight = 80 * 9.81;
    const gravReduction = Math.min(1.0, lift / weight);

    let banking = 0;
    if (horizontalSpeed > 0.5 && Math.abs(turnRateYaw) > 0.001) {
      const rawBank = (Math.atan((turnRateYaw * horizontalSpeed) / 9.81) * 180) / Math.PI;
      banking = Math.max(-maxBank, Math.min(maxBank, rawBank));
    }

    return {
      wingspan: Number(wingspan.toFixed(2)),
      flapFrequencyHz: Number(flapFrequency.toFixed(2)),
      liftForceN: Number(lift.toFixed(1)),
      bankingAngleDeg: Number(banking.toFixed(2)),
      gravityReductionFactor: Number(gravReduction.toFixed(3)),
    };
  }
}
