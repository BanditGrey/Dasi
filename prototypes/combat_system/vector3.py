"""
Vector3 and 3D Geometry Utilities for Dasi Combat & Physics Simulation.
"""

from __future__ import annotations
import math
from dataclasses import dataclass
from typing import Tuple


@dataclass(frozen=True)
class Vector3:
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0

    def __add__(self, other: Vector3) -> Vector3:
        return Vector3(self.x + other.x, self.y + other.y, self.z + other.z)

    def __sub__(self, other: Vector3) -> Vector3:
        return Vector3(self.x - other.x, self.y - other.y, self.z - other.z)

    def __mul__(self, scalar: float) -> Vector3:
        return Vector3(self.x * scalar, self.y * scalar, self.z * scalar)

    def __rmul__(self, scalar: float) -> Vector3:
        return self.__mul__(scalar)

    def __truediv__(self, scalar: float) -> Vector3:
        if abs(scalar) < 1e-9:
            return Vector3(0.0, 0.0, 0.0)
        return Vector3(self.x / scalar, self.y / scalar, self.z / scalar)

    def __neg__(self) -> Vector3:
        return Vector3(-self.x, -self.y, -self.z)

    def dot(self, other: Vector3) -> float:
        return self.x * other.x + self.y * other.y + self.z * other.z

    def cross(self, other: Vector3) -> Vector3:
        return Vector3(
            self.y * other.z - self.z * other.y,
            self.z * other.x - self.x * other.z,
            self.x * other.y - self.y * other.x,
        )

    def length_squared(self) -> float:
        return self.x * self.x + self.y * self.y + self.z * self.z

    def length(self) -> float:
        return math.sqrt(self.length_squared())

    def normalized(self) -> Vector3:
        l = self.length()
        if l < 1e-9:
            return Vector3(0.0, 0.0, 0.0)
        return self / l

    def distance_to(self, other: Vector3) -> float:
        return (self - other).length()

    def lerp(self, other: Vector3, t: float) -> Vector3:
        clamped_t = max(0.0, min(1.0, t))
        return self + (other - self) * clamped_t

    def as_tuple(self) -> Tuple[float, float, float]:
        return (self.x, self.y, self.z)

    @classmethod
    def zero(cls) -> Vector3:
        return cls(0.0, 0.0, 0.0)

    @classmethod
    def up(cls) -> Vector3:
        return cls(0.0, 0.0, 1.0)

    @classmethod
    def forward(cls) -> Vector3:
        return cls(1.0, 0.0, 0.0)

    @classmethod
    def right(cls) -> Vector3:
        return cls(0.0, 1.0, 0.0)


def distance_point_to_segment(point: Vector3, seg_a: Vector3, seg_b: Vector3) -> float:
    """Calculates the minimum distance from a point to a 3D line segment."""
    ab = seg_b - seg_a
    ab_len_sq = ab.length_squared()
    if ab_len_sq < 1e-9:
        return (point - seg_a).length()
    ap = point - seg_a
    t = ap.dot(ab) / ab_len_sq
    t = max(0.0, min(1.0, t))
    closest = seg_a + ab * t
    return (point - closest).length()


def distance_segment_to_segment(
    p1: Vector3, p2: Vector3, p3: Vector3, p4: Vector3
) -> float:
    """
    Computes the shortest distance between two 3D segments (p1->p2 and p3->p4).
    Used for capsule-to-capsule or swept capsule collision testing.
    """
    d1 = p2 - p1
    d2 = p4 - p3
    r = p1 - p3

    a = d1.dot(d1)
    e = d2.dot(d2)
    f = d2.dot(r)

    if a <= 1e-9 and e <= 1e-9:
        return r.length()
    if a <= 1e-9:
        s = 0.0
        t = max(0.0, min(1.0, f / e))
    else:
        c = d1.dot(r)
        if e <= 1e-9:
            t = 0.0
            s = max(0.0, min(1.0, -c / a))
        else:
            b = d1.dot(d2)
            denom = a * e - b * b
            if denom != 0.0:
                s = max(0.0, min(1.0, (b * f - c * e) / denom))
            else:
                s = 0.0
            t = (b * s + f) / e
            if t < 0.0:
                t = 0.0
                s = max(0.0, min(1.0, -c / a))
            elif t > 1.0:
                t = 1.0
                s = max(0.0, min(1.0, (b - c) / a))

    c1 = p1 + d1 * s
    c2 = p3 + d2 * t
    return (c1 - c2).length()
