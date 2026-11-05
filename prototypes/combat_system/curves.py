"""
Curves and Spline Mathematics for Dasi Combat & Animation Dynamics.
Includes Cubic Bézier evaluation, Hermite interpolation, and animation easing.
"""

from __future__ import annotations
import math
from typing import Tuple


class CubicBezier:
    """
    Parametric Cubic Bézier Curve: B(t) = (1-t)³ P0 + 3(1-t)²t P1 + 3(1-t)t² P2 + t³ P3.
    Used for smooth acceleration, windup easing, and recovery deceleration.
    """

    def __init__(self, p0: float, p1: float, p2: float, p3: float):
        self.p0 = p0
        self.p1 = p1
        self.p2 = p2
        self.p3 = p3

    def evaluate(self, t: float) -> float:
        t = max(0.0, min(1.0, t))
        u = 1.0 - t
        return (
            (u ** 3) * self.p0
            + 3.0 * (u ** 2) * t * self.p1
            + 3.0 * u * (t ** 2) * self.p2
            + (t ** 3) * self.p3
        )

    def derivative(self, t: float) -> float:
        """First derivative dB/dt representing velocity/rate of change."""
        t = max(0.0, min(1.0, t))
        u = 1.0 - t
        return (
            3.0 * (u ** 2) * (self.p1 - self.p0)
            + 6.0 * u * t * (self.p2 - self.p1)
            + 3.0 * (t ** 2) * (self.p3 - self.p2)
        )


class HermiteSpline:
    """
    Cubic Hermite Spline for continuous inertia blending between animation states.
    Ensures C1 continuity (smooth position and velocity matching at combo transition points).
    """

    @staticmethod
    def interpolate(p0: float, m0: float, p1: float, m1: float, t: float) -> float:
        t = max(0.0, min(1.0, t))
        t2 = t * t
        t3 = t2 * t
        h00 = 2.0 * t3 - 3.0 * t2 + 1.0
        h10 = t3 - 2.0 * t2 + t
        h01 = -2.0 * t3 + 3.0 * t2
        h11 = t3 - t2
        return h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1

    @staticmethod
    def derivative(p0: float, m0: float, p1: float, m1: float, t: float) -> float:
        t = max(0.0, min(1.0, t))
        t2 = t * t
        dh00 = 6.0 * t2 - 6.0 * t
        dh10 = 3.0 * t2 - 4.0 * t + 1.0
        dh01 = -6.0 * t2 + 6.0 * t
        dh11 = 3.0 * t2 - 2.0 * t
        return dh00 * p0 + dh10 * m0 + dh01 * p1 + dh11 * m1


# Standard Game Feel Animation Easing Presets
EASE_IN_QUAD = CubicBezier(0.0, 0.1, 0.25, 1.0)
EASE_OUT_EXPO = CubicBezier(0.0, 0.7, 0.1, 1.0)
ATTACK_WINDUP_CURVE = CubicBezier(0.0, 0.05, 0.2, 1.0)     # Slow build-up of physical tension
ACTIVE_STRIKE_CURVE = CubicBezier(0.0, 0.85, 0.95, 1.0)    # Explosive velocity release
RECOVERY_DECEL_CURVE = CubicBezier(0.0, 0.3, 0.7, 1.0)     # Natural weight dampening
