"""
Aerodynamic Wing Physics and Dynamics System for Dasi (Tiers 1, 2, and 3).
Simulates dynamic lift, aerodynamic drag, speed-adaptive flapping, banking roll tilt,
and ground downwash effects.
"""

from __future__ import annotations
import math
from enum import Enum
from dataclasses import dataclass
from .vector3 import Vector3


class WingTier(Enum):
    TIER_1_NEOPHYTE = 1     # Feathered / Glider wings
    TIER_2_CELESTIAL = 2    # Angelic / Demonic dual membrane wings
    TIER_3_SOVEREIGN = 3    # Colossal Archangel / Void Sovereign wings


@dataclass
class WingProfile:
    tier: WingTier
    min_wingspan: float         # Idle wingspan in meters
    max_wingspan: float         # Expanded wingspan in full flight
    lift_coefficient: float     # C_L
    drag_coefficient: float     # C_D
    idle_flap_frequency: float  # Hz at zero horizontal speed
    max_flap_frequency: float   # Hz at sprint / high velocity
    max_banking_angle: float    # Max roll tilt during sharp turns (degrees)
    can_sustain_flight: bool    # True for Tier 3 (Icarus archipelago access)
    ground_downwash_power: float


TIER_PROFILES: dict[WingTier, WingProfile] = {
    WingTier.TIER_1_NEOPHYTE: WingProfile(
        tier=WingTier.TIER_1_NEOPHYTE,
        min_wingspan=1.8,
        max_wingspan=2.4,
        lift_coefficient=0.45,
        drag_coefficient=0.25,
        idle_flap_frequency=0.8,
        max_flap_frequency=2.4,
        max_banking_angle=14.0,
        can_sustain_flight=False,
        ground_downwash_power=0.3,
    ),
    WingTier.TIER_2_CELESTIAL: WingProfile(
        tier=WingTier.TIER_2_CELESTIAL,
        min_wingspan=2.8,
        max_wingspan=3.8,
        lift_coefficient=0.85,
        drag_coefficient=0.32,
        idle_flap_frequency=1.2,
        max_flap_frequency=3.2,
        max_banking_angle=28.0,
        can_sustain_flight=False,  # Gliding and low altitude hovering
        ground_downwash_power=0.7,
    ),
    WingTier.TIER_3_SOVEREIGN: WingProfile(
        tier=WingTier.TIER_3_SOVEREIGN,
        min_wingspan=4.2,
        max_wingspan=6.0,
        lift_coefficient=1.40,
        drag_coefficient=0.40,
        idle_flap_frequency=1.6,
        max_flap_frequency=4.0,
        max_banking_angle=48.0,
        can_sustain_flight=True,   # Full 3D flight & Icarus access
        ground_downwash_power=1.5,
    ),
}


@dataclass
class WingSimulationState:
    current_wingspan: float
    flapping_frequency: float
    lift_force: Vector3
    drag_force: Vector3
    net_aerodynamic_force: Vector3
    banking_angle_deg: float
    ground_downwash_radius: float
    effective_gravity_reduction: float


class WingPhysicsSystem:
    """
    Simulates dynamic wing physics for player character.
    Integrates aerodynamics, ground effect, and character orientation.
    """

    GRAVITY: float = 9.81
    AIR_DENSITY: float = 1.225  # kg/m³ at sea level

    def __init__(self, tier: WingTier = WingTier.TIER_1_NEOPHYTE):
        self.profile = TIER_PROFILES[tier]
        self.current_tier = tier

    def set_tier(self, tier: WingTier) -> None:
        self.current_tier = tier
        self.profile = TIER_PROFILES[tier]

    def simulate(
        self,
        character_velocity: Vector3,
        character_forward: Vector3,
        wind_velocity: Vector3,
        altitude_above_ground: float,
        turn_rate_yaw: float,  # rad/s turning speed
        character_mass: float = 80.0,
    ) -> WingSimulationState:
        """
        Executes aerodynamic simulation step.
        """
        # Relative air velocity
        v_rel = character_velocity - wind_velocity
        speed = v_rel.length()
        horizontal_speed = math.sqrt(v_rel.x * v_rel.x + v_rel.y * v_rel.y)

        # Dynamic wingspan expansion based on speed (wings open wide as speed increases)
        speed_factor = min(1.0, horizontal_speed / 12.0)  # 12 m/s sprint reference
        current_wingspan = self.profile.min_wingspan + (
            self.profile.max_wingspan - self.profile.min_wingspan
        ) * speed_factor

        # Flapping frequency accelerates with horizontal speed
        flapping_freq = self.profile.idle_flap_frequency + (
            self.profile.max_flap_frequency - self.profile.idle_flap_frequency
        ) * speed_factor

        # Wing area approximation (proportional to wingspan²)
        wing_area = (current_wingspan * 0.5) ** 2 * math.pi * 0.6

        # Aerodynamic Lift & Drag: 0.5 * rho * v² * S * C
        dynamic_pressure = 0.5 * self.AIR_DENSITY * (speed * speed)
        raw_lift_mag = dynamic_pressure * wing_area * self.profile.lift_coefficient
        raw_drag_mag = dynamic_pressure * wing_area * self.profile.drag_coefficient

        # Ground effect amplification (Wieselberger equation approximation)
        if altitude_above_ground > 0.1 and altitude_above_ground < current_wingspan * 1.5:
            h_ratio = altitude_above_ground / current_wingspan
            ground_effect_factor = 1.0 + (0.35 / (h_ratio + 0.2))
            raw_lift_mag *= min(1.8, ground_effect_factor)

        # Lift points upwards along world Z (or character local up)
        lift_force = Vector3(0.0, 0.0, raw_lift_mag)

        # Drag points opposite to relative velocity
        if speed > 1e-4:
            drag_force = -v_rel.normalized() * raw_drag_mag
        else:
            drag_force = Vector3.zero()

        net_force = lift_force + drag_force

        # Banking roll tilt during turns (centripetal force balance)
        if horizontal_speed > 0.5 and abs(turn_rate_yaw) > 1e-3:
            raw_bank = math.degrees(math.atan((turn_rate_yaw * horizontal_speed) / self.GRAVITY))
            banking_deg = max(
                -self.profile.max_banking_angle,
                min(self.profile.max_banking_angle, raw_bank),
            )
        else:
            banking_deg = 0.0

        # Ground downwash radius (air vortex hitting the ground)
        if altitude_above_ground < 4.0:
            downwash_radius = current_wingspan * (1.2 - (altitude_above_ground / 5.0)) * self.profile.ground_downwash_power
        else:
            downwash_radius = 0.0

        # Gravity reduction percentage
        weight = character_mass * self.GRAVITY
        gravity_reduction = min(1.0, lift_force.z / weight)

        return WingSimulationState(
            current_wingspan=round(current_wingspan, 2),
            flapping_frequency=round(flapping_freq, 2),
            lift_force=lift_force,
            drag_force=drag_force,
            net_aerodynamic_force=net_force,
            banking_angle_deg=round(banking_deg, 2),
            ground_downwash_radius=round(max(0.0, downwash_radius), 2),
            effective_gravity_reduction=round(gravity_reduction, 3),
        )
