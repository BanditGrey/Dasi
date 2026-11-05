"""
Advanced Combat Skills and Companion Physical AI Simulation for Dasi.

Simulates physics, kinematics, and state machines for:
1. Fire Slash (Rune Duelist): Progressive seismic rift, sequential volcanic plasma geysers,
   convective thermal lift, and multi-stack metallurgical armor shredding.
2. Power Slash (Rune Duelist): Fan of supersonic ether blade crescents with Mach shock cones,
   atmospheric cutting drag, and directional swept stagger.
3. Earthquake (Imperial Sovereign - Dark Horse): Incandescent iron hooves seismic stomp,
   radial dispersive Rayleigh shockwave, poise-checked vertical knock-up, and parabolic ragdoll.
4. Fireburst (Imperial Sovereign): Supersonic flame whip crack triggering a cascading tri-cluster
   thermobaric overpressure detonation and residual combustion.
5. Dark Raven (Imperial Sovereign Companion): 3D free-flight companion with aerodynamics and AI
   state machine scaled dynamically by Command (CMD) attribute (Orbital Patrol, Screw Dive-Bombing,
   Eye Peck with Blinding chance, and Smooth Shoulder Return).
"""

from __future__ import annotations
import math
import random
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import List, Dict, Optional, Tuple, Set

try:
    from .vector3 import Vector3, distance_point_to_segment
except ImportError:
    from vector3 import Vector3, distance_point_to_segment


# ==============================================================================
# COMBAT TARGET DEFINITION WITH ARMOR SHRED & STATUS DEBUFFS
# ==============================================================================

@dataclass(unsafe_hash=True)
class AdvancedCombatTarget:
    """
    Physical target with mass, poise, dynamic armor reduction (shredding),
    status ailments (blindness, burn), and airborne ragdoll kinematics.
    """
    id: str = field(hash=True)
    name: str = field(hash=False)
    position: Vector3 = field(hash=False)
    velocity: Vector3 = field(default_factory=Vector3.zero, hash=False)
    mass_kg: float = field(default=80.0, hash=False)
    radius: float = field(default=0.5, hash=False)
    height: float = field(default=1.8, hash=False)
    current_hp: float = field(default=1200.0, hash=False)
    max_hp: float = field(default=1200.0, hash=False)
    poise: float = field(default=100.0, hash=False)
    current_poise: float = field(default=100.0, hash=False)
    base_armor: float = field(default=200.0, hash=False)
    is_boss: bool = field(default=False, hash=False)

    # Status & Debuff tracking
    armor_shred_stacks: int = field(default=0, hash=False)
    armor_shred_timer: float = field(default=0.0, hash=False)
    max_shred_stacks: int = field(default=5, hash=False)
    shred_percent_per_stack: float = field(default=0.10, hash=False)

    is_blinded: bool = field(default=False, hash=False)
    blind_timer: float = field(default=0.0, hash=False)
    accuracy_penalty: float = field(default=0.0, hash=False)

    is_burning: bool = field(default=False, hash=False)
    burn_timer: float = field(default=0.0, hash=False)
    burn_dps: float = field(default=0.0, hash=False)

    # Ragdoll state
    is_airborne: bool = field(default=False, hash=False)

    # Telemetry
    total_damage_taken: float = field(default=0.0, hash=False)
    hits_taken: int = field(default=0, hash=False)
    stagger_count: int = field(default=0, hash=False)

    def is_alive(self) -> bool:
        return self.current_hp > 0.0

    @property
    def effective_armor(self) -> float:
        """Returns armor after applying active armor shred debuff stacks."""
        reduction = min(0.50, self.armor_shred_stacks * self.shred_percent_per_stack)
        return self.base_armor * (1.0 - reduction)

    def apply_armor_shred(self, stacks: int = 1, duration: float = 6.0) -> None:
        """Adds armor shred stacks and refreshes duration."""
        self.armor_shred_stacks = min(self.max_shred_stacks, self.armor_shred_stacks + stacks)
        self.armor_shred_timer = duration

    def apply_blind(self, duration: float, accuracy_reduction: float = 0.65) -> None:
        """Applies blindness state impairing vision and accuracy."""
        self.is_blinded = True
        self.blind_timer = duration
        self.accuracy_penalty = accuracy_reduction

    def apply_burn(self, dps: float, duration: float) -> None:
        """Applies burning DoT effect."""
        self.is_burning = True
        self.burn_dps = max(self.burn_dps, dps)
        self.burn_timer = max(self.burn_timer, duration)

    def apply_damage(self, raw_damage: float, poise_damage: float = 0.0) -> Tuple[float, bool]:
        """
        Calculates mitigated damage based on effective armor and reduces poise.
        Mitigation formula: D_effective = D_raw * (400 / (400 + EffectiveArmor))
        Returns: (actual_damage, poise_broken)
        """
        eff_armor = self.effective_armor
        mitigation_multiplier = 400.0 / (400.0 + max(0.0, eff_armor))
        final_damage = max(1.0, raw_damage * mitigation_multiplier)

        self.current_hp = max(0.0, self.current_hp - final_damage)
        self.total_damage_taken += final_damage
        self.hits_taken += 1

        self.current_poise = max(0.0, self.current_poise - poise_damage)
        poise_broken = (self.current_poise <= 0.0)
        if poise_broken:
            self.stagger_count += 1
            self.current_poise = self.poise * 0.40  # Reset threshold

        return final_damage, poise_broken

    def update_physics_and_status(self, dt: float) -> Optional[Dict]:
        """Updates airborne ballistics, friction, gravity, and debuff timers."""
        event = None

        # 1. Update debuff timers
        if self.armor_shred_timer > 0.0:
            self.armor_shred_timer -= dt
            if self.armor_shred_timer <= 0.0:
                self.armor_shred_stacks = 0

        if self.blind_timer > 0.0:
            self.blind_timer -= dt
            if self.blind_timer <= 0.0:
                self.is_blinded = False
                self.accuracy_penalty = 0.0

        if self.burn_timer > 0.0:
            burn_tick = self.burn_dps * dt
            self.current_hp = max(0.0, self.current_hp - burn_tick)
            self.total_damage_taken += burn_tick
            self.burn_timer -= dt
            if self.burn_timer <= 0.0:
                self.is_burning = False
                self.burn_dps = 0.0

        # 2. Update physical displacement & gravity
        if self.is_airborne or self.position.z > 0.0:
            g = 9.81
            new_vz = self.velocity.z - g * dt
            new_pos = self.position + self.velocity * dt
            self.velocity = Vector3(self.velocity.x * 0.98, self.velocity.y * 0.98, new_vz)

            if new_pos.z <= 0.0:
                # Landed on ground
                impact_speed = abs(self.velocity.z)
                fall_damage = max(0.0, 0.5 * self.mass_kg * (impact_speed ** 2) * 0.015)
                self.current_hp = max(0.0, self.current_hp - fall_damage)
                self.total_damage_taken += fall_damage

                self.position = Vector3(new_pos.x, new_pos.y, 0.0)
                self.velocity = Vector3.zero()
                self.is_airborne = False

                event = {
                    "type": "ground_landing",
                    "target_id": self.id,
                    "impact_speed": impact_speed,
                    "fall_damage": fall_damage,
                }
            else:
                self.position = new_pos
        else:
            # Ground friction
            frict = max(0.0, 1.0 - 5.0 * dt)
            self.velocity = self.velocity * frict
            self.position = self.position + self.velocity * dt

        return event


# ==============================================================================
# 1. FIRE SLASH (RUNE DUELIST)
# ==============================================================================

@dataclass
class PlasmaVent:
    """Represents a volcanic plasma geyser erupting from the seismic rift."""
    index: int
    position: Vector3
    ignition_time: float
    active_duration: float = 0.45
    radius: float = 1.4
    height: float = 2.6
    is_ignited: bool = False
    is_extinguished: bool = False
    targets_hit: Set[str] = field(default_factory=set)


@dataclass
class FireSlashConfig:
    fissure_reach: float = 8.5          # Total fissure propagation length (meters)
    fissure_speed: float = 22.0         # Propagation speed (m/s)
    num_vents: int = 5                  # Plasma geysers along the rift
    vent_radius: float = 1.4            # Eruption blast radius (meters)
    base_damage: float = 320.0
    poise_damage: float = 40.0
    armor_shred_per_stack: float = 0.10 # 10% armor reduction per stack
    max_shred_stacks: int = 5           # Up to 50% shred
    shred_duration: float = 6.0         # Duration in seconds
    convective_lift_base: float = 5.2   # Vertical launch speed (m/s)
    lateral_ejection_speed: float = 3.8 # Horizontal push away from fissure axis


class FireSlashSimulator:
    """
    Simulates the Rune Duelist's Fire Slash:
    - Progressive seismic fissure tearing through terrain.
    - Sequential volcanic plasma geysers with upward convective lift.
    - Metallurgical armor shredding stacks (up to 50% defense reduction).
    """

    def __init__(
        self,
        caster_pos: Vector3,
        direction: Vector3,
        config: Optional[FireSlashConfig] = None
    ):
        self.caster_pos = caster_pos
        # Project direction to horizontal plane (XY)
        d_xy = Vector3(direction.x, direction.y, 0.0).normalized()
        self.direction = d_xy if d_xy.length_squared() > 1e-6 else Vector3(1.0, 0.0, 0.0)
        self.config = config or FireSlashConfig()

        self.elapsed_time: float = 0.0
        self.current_fissure_length: float = 0.0
        self.is_finished: bool = False
        self.total_plasma_hits: int = 0

        # Pre-calculate plasma vent positions along fissure line
        self.vents: List[PlasmaVent] = []
        spacing = self.config.fissure_reach / self.config.num_vents
        for i in range(self.config.num_vents):
            dist = spacing * (i + 1)
            vent_pos = self.caster_pos + self.direction * dist
            ignite_t = dist / self.config.fissure_speed
            self.vents.append(PlasmaVent(
                index=i,
                position=vent_pos,
                ignition_time=ignite_t,
                active_duration=0.45,
                radius=self.config.vent_radius,
            ))

    def step(self, dt: float, targets: List[AdvancedCombatTarget]) -> List[Dict]:
        """Advances fissure and vent simulation by dt. Returns combat events."""
        if self.is_finished or dt <= 0.0:
            return []

        self.elapsed_time += dt
        self.current_fissure_length = min(
            self.config.fissure_reach,
            self.config.fissure_speed * self.elapsed_time
        )

        events: List[Dict] = []
        all_extinguished = True

        # Lateral unit vector perpendicular to fissure direction
        lateral_dir = Vector3(-self.direction.y, self.direction.x, 0.0).normalized()

        for vent in self.vents:
            # Check ignition
            if not vent.is_ignited and self.elapsed_time >= vent.ignition_time:
                vent.is_ignited = True
                events.append({
                    "type": "plasma_vent_ignited",
                    "vent_index": vent.index,
                    "position": vent.position,
                    "time": self.elapsed_time,
                })

            if vent.is_ignited and not vent.is_extinguished:
                active_time = self.elapsed_time - vent.ignition_time
                if active_time > vent.active_duration:
                    vent.is_extinguished = True
                    continue

                all_extinguished = False

                # Test collision against targets
                for target in targets:
                    if not target.is_alive():
                        continue
                    if target.id in vent.targets_hit:
                        continue

                    # Distance in horizontal plane
                    d_pos = target.position - vent.position
                    dist_2d = math.hypot(d_pos.x, d_pos.y)

                    if dist_2d <= (vent.radius + target.radius):
                        vent.targets_hit.add(target.id)
                        self.total_plasma_hits += 1

                        # Apply armor shred stack BEFORE or WITH damage
                        target.apply_armor_shred(
                            stacks=1,
                            duration=self.config.shred_duration
                        )

                        # Apply mitigated damage
                        actual_dmg, poise_broken = target.apply_damage(
                            self.config.base_damage,
                            self.config.poise_damage
                        )

                        # Convective thermal lift & lateral push
                        mass_scale = 80.0 / max(40.0, target.mass_kg)
                        vz = self.config.convective_lift_base * mass_scale
                        
                        # Determine which side of fissure target is on
                        side_sign = 1.0 if d_pos.dot(lateral_dir) >= 0.0 else -1.0
                        v_lat = lateral_dir * (self.config.lateral_ejection_speed * side_sign * mass_scale)

                        target.velocity = Vector3(v_lat.x, v_lat.y, vz)
                        target.is_airborne = True

                        events.append({
                            "type": "fire_slash_hit",
                            "vent_index": vent.index,
                            "target_id": target.id,
                            "damage": actual_dmg,
                            "armor_shred_stacks": target.armor_shred_stacks,
                            "effective_armor": target.effective_armor,
                            "poise_broken": poise_broken,
                            "lift_velocity_z": vz,
                        })

        if all_extinguished and self.current_fissure_length >= self.config.fissure_reach:
            self.is_finished = True

        return events


# ==============================================================================
# 2. POWER SLASH (RUNE DUELIST)
# ==============================================================================

@dataclass
class EtherBladeArc:
    """Individual supersonic ether blade crescent propagating within the cone."""
    index: int
    direction: Vector3
    position: Vector3
    velocity: Vector3
    speed: float
    distance_traveled: float = 0.0
    is_active: bool = True
    targets_hit: Set[str] = field(default_factory=set)


@dataclass
class PowerSlashConfig:
    blade_count: int = 5                # Fan of 5 ether blade crescents
    spread_angle_deg: float = 48.0      # Total angular spread (degrees)
    initial_speed: float = 450.0        # Supersonic launch velocity (m/s)
    drag_coeff: float = 0.0025          # Aerodynamic resistance slowing blade
    max_range: float = 14.0             # Range in meters
    base_damage: float = 260.0
    poise_damage: float = 35.0
    multi_hit_damping: float = 0.65     # Damping exponent for overlapping slices
    blade_width_base: float = 0.95      # Transversal cutting width


class PowerSlashSimulator:
    """
    Simulates the Rune Duelist's Power Slash:
    - Conic supersonic fan of 5 ether blade crescents with Mach shock cones.
    - Atmospheric cutting drag decelerating the blades.
    - Directional swept collision with multi-hit damping to avoid shotgun exploits.
    """

    def __init__(
        self,
        caster_pos: Vector3,
        forward_dir: Vector3,
        config: Optional[PowerSlashConfig] = None
    ):
        self.caster_pos = caster_pos
        f_xy = Vector3(forward_dir.x, forward_dir.y, 0.0).normalized()
        self.forward_dir = f_xy if f_xy.length_squared() > 1e-6 else Vector3(1.0, 0.0, 0.0)
        self.config = config or PowerSlashConfig()

        self.elapsed_time: float = 0.0
        self.is_finished: bool = False
        self.target_hit_counts: Dict[str, int] = {}
        self.blades: List[EtherBladeArc] = []

        # Generate blade fan
        base_angle = math.atan2(self.forward_dir.y, self.forward_dir.x)
        half_spread_rad = math.radians(self.config.spread_angle_deg) / 2.0
        step_rad = (2.0 * half_spread_rad) / max(1, self.config.blade_count - 1)

        for i in range(self.config.blade_count):
            angle = base_angle - half_spread_rad + i * step_rad
            blade_dir = Vector3(math.cos(angle), math.sin(angle), 0.0).normalized()
            init_v = blade_dir * self.config.initial_speed
            self.blades.append(EtherBladeArc(
                index=i,
                direction=blade_dir,
                position=self.caster_pos + blade_dir * 0.4,
                velocity=init_v,
                speed=self.config.initial_speed,
            ))

    def step(self, dt: float, targets: List[AdvancedCombatTarget]) -> List[Dict]:
        """Advances blade trajectories and detects swept slicing collisions."""
        if self.is_finished or dt <= 0.0:
            return []

        self.elapsed_time += dt
        events: List[Dict] = []
        active_count = 0

        for blade in self.blades:
            if not blade.is_active:
                continue

            prev_pos = blade.position
            # Atmospheric cutting drag: v(t + dt) = v / (1 + drag * v * dt)
            blade.speed = blade.speed / (1.0 + self.config.drag_coeff * blade.speed * dt)
            blade.velocity = blade.direction * blade.speed
            travel_step = blade.speed * dt
            blade.distance_traveled += travel_step
            blade.position = prev_pos + blade.velocity * dt

            if blade.distance_traveled >= self.config.max_range or blade.speed < 40.0:
                blade.is_active = False
                continue

            active_count += 1

            # Transversal cutting width expands slightly with distance
            curr_width = self.config.blade_width_base + blade.distance_traveled * 0.06

            # Swept segment check against targets
            for target in targets:
                if not target.is_alive():
                    continue
                if target.id in blade.targets_hit:
                    continue

                dist_to_path = distance_point_to_segment(target.position, prev_pos, blade.position)
                if dist_to_path <= (curr_width * 0.5 + target.radius):
                    blade.targets_hit.add(target.id)
                    hit_index = self.target_hit_counts.get(target.id, 0)
                    self.target_hit_counts[target.id] = hit_index + 1

                    # Multi-hit damage damping: D_eff = D_base * (0.65)^hit_index
                    damping_factor = self.config.multi_hit_damping ** hit_index
                    raw_damage = self.config.base_damage * damping_factor

                    actual_dmg, poise_broken = target.apply_damage(
                        raw_damage,
                        self.config.poise_damage * damping_factor
                    )

                    # Directional momentum transfer along blade trajectory
                    recoil = blade.direction * (6.0 * (80.0 / max(40.0, target.mass_kg)))
                    target.velocity = target.velocity + recoil

                    events.append({
                        "type": "power_slash_hit",
                        "blade_index": blade.index,
                        "target_id": target.id,
                        "hit_order": hit_index + 1,
                        "damage": actual_dmg,
                        "damping_factor": damping_factor,
                        "poise_broken": poise_broken,
                        "impact_pos": blade.position,
                    })

        if active_count == 0:
            self.is_finished = True

        return events


# ==============================================================================
# 3. EARTHQUAKE (IMPERIAL SOVEREIGN & DARK HORSE)
# ==============================================================================

@dataclass
class EarthquakeConfig:
    seismic_speed: float = 20.0         # Radial wave propagation speed (m/s)
    max_radius: float = 9.0             # Maximum radius of the earthquake (meters)
    crest_thickness: float = 1.25       # Thickness of the high-energy seismic crest
    base_damage: float = 450.0
    poise_damage: float = 85.0
    base_knockup_impulse: float = 640.0 # N*s vertical impulse
    base_radial_impulse: float = 380.0  # N*s horizontal outward push
    energy_decay_rate: float = 0.08     # Soil inelastic damping factor
    boss_poise_threshold: float = 150.0 # Poise needed to resist complete launch


class EarthquakeSimulator:
    """
    Simulates the Dark Horse's seismic hoof stomp:
    - Concentric expanding Rayleigh seismic wave.
    - Energy falloff through geometric spreading and soil attenuation.
    - Vertical launch knock-up and radial ragdoll physics.
    - Ground impact calculation upon landing.
    """

    def __init__(
        self,
        epicenter: Vector3,
        config: Optional[EarthquakeConfig] = None
    ):
        self.epicenter = epicenter
        self.config = config or EarthquakeConfig()

        self.elapsed_time: float = 0.0
        self.current_radius: float = 0.0
        self.is_finished: bool = False
        self.targets_hit: Set[str] = set()
        self.airborne_targets: Dict[str, AdvancedCombatTarget] = {}

    def step(self, dt: float, targets: List[AdvancedCombatTarget]) -> List[Dict]:
        """Advances seismic wave and updates ballistic ragdoll trajectories."""
        if dt <= 0.0:
            return []

        events: List[Dict] = []
        self.elapsed_time += dt

        if not self.is_finished:
            self.current_radius = self.config.seismic_speed * self.elapsed_time
            r_min = max(0.0, self.current_radius - self.config.crest_thickness)
            r_max = self.current_radius

            for target in targets:
                if not target.is_alive():
                    continue
                if target.id in self.targets_hit:
                    continue

                d_vec = target.position - self.epicenter
                dist_2d = math.hypot(d_vec.x, d_vec.y)

                # Within current wave crest
                if (r_min - target.radius) <= dist_2d <= (r_max + target.radius):
                    self.targets_hit.add(target.id)

                    # Energy attenuation: I(r) = I0 * (r0 / r)^0.5 * e^(-decay * r)
                    r_eval = max(1.0, dist_2d)
                    attenuation = math.sqrt(1.0 / r_eval) * math.exp(-self.config.energy_decay_rate * (r_eval - 1.0))
                    raw_damage = self.config.base_damage * attenuation

                    actual_dmg, poise_broken = target.apply_damage(
                        raw_damage,
                        self.config.poise_damage
                    )

                    # Determine knock-up vs micro-stagger
                    radial_norm = Vector3(d_vec.x / r_eval, d_vec.y / r_eval, 0.0)
                    mass_ratio = 75.0 / max(35.0, target.mass_kg)

                    if target.is_boss and target.current_poise > self.config.boss_poise_threshold:
                        # Heavy boss with unbroken poise resists airborne launch
                        v_rad = radial_norm * (self.config.base_radial_impulse * attenuation * 0.25 / target.mass_kg)
                        target.velocity = v_rad
                        knocked_up = False
                        vz = 0.0
                    else:
                        # Full ragdoll knock-up
                        knocked_up = True
                        vz = (self.config.base_knockup_impulse * attenuation * mass_ratio) / target.mass_kg
                        vr = (self.config.base_radial_impulse * attenuation * mass_ratio) / target.mass_kg
                        target.velocity = radial_norm * vr + Vector3(0.0, 0.0, vz)
                        target.is_airborne = True
                        self.airborne_targets[target.id] = target

                    events.append({
                        "type": "earthquake_shockwave_hit",
                        "target_id": target.id,
                        "distance_from_center": dist_2d,
                        "damage": actual_dmg,
                        "poise_broken": poise_broken,
                        "knocked_up": knocked_up,
                        "vertical_velocity": vz,
                    })

            if self.current_radius >= self.config.max_radius:
                self.is_finished = True

        # Update airborne target landings
        active_airborne: Dict[str, AdvancedCombatTarget] = {}
        for tid, target in self.airborne_targets.items():
            landing_event = target.update_physics_and_status(dt)
            if landing_event:
                events.append(landing_event)
            if target.is_airborne:
                active_airborne[tid] = target
        self.airborne_targets = active_airborne

        return events


# ==============================================================================
# 4. FIREBURST (IMPERIAL SOVEREIGN)
# ==============================================================================

@dataclass
class DetonationNode:
    """Individual thermobaric overpressure blast node in the Fireburst chain."""
    index: int
    offset: Vector3
    delay: float
    radius: float
    damage: float
    poise_damage: float
    is_detonated: bool = False
    targets_hit: Set[str] = field(default_factory=set)


@dataclass
class FireburstConfig:
    crack_reach: float = 10.0
    num_nodes: int = 3
    node_delays: Tuple[float, float, float] = (0.0, 0.09, 0.18)
    node_radii: Tuple[float, float, float] = (1.8, 2.4, 2.0)
    node_damages: Tuple[float, float, float] = (220.0, 300.0, 260.0)
    node_poise_damages: Tuple[float, float, float] = (30.0, 50.0, 40.0)
    node_offsets: Tuple[Vector3, Vector3, Vector3] = (
        Vector3(0.0, 0.0, 0.0),
        Vector3(0.6, 0.4, 0.2),
        Vector3(-0.5, 0.5, 0.4),
    )
    burn_threshold_hits: int = 2        # Inflicts residual burn if hit by >= 2 nodes
    burn_duration: float = 4.0
    burn_dps: float = 65.0


class FireburstSimulator:
    """
    Simulates the Imperial Sovereign's Fireburst:
    - Supersonic whip tip crack deflagrating airborne volatile particles.
    - 3 rapid sequential micro-explosions forming a thermobaric cascade.
    - Overlapping blast interference with ignition and combustion DoT.
    """

    def __init__(
        self,
        caster_pos: Vector3,
        target_pos: Vector3,
        config: Optional[FireburstConfig] = None
    ):
        self.caster_pos = caster_pos
        self.target_pos = target_pos
        self.config = config or FireburstConfig()

        self.elapsed_time: float = 0.0
        self.is_finished: bool = False
        self.target_hit_counts: Dict[str, int] = {}

        # Initialize the 3 cascade explosion nodes
        self.nodes: List[DetonationNode] = []
        for i in range(self.config.num_nodes):
            self.nodes.append(DetonationNode(
                index=i,
                offset=self.config.node_offsets[i],
                delay=self.config.node_delays[i],
                radius=self.config.node_radii[i],
                damage=self.config.node_damages[i],
                poise_damage=self.config.node_poise_damages[i],
            ))

    def step(self, dt: float, targets: List[AdvancedCombatTarget]) -> List[Dict]:
        """Advances detonation timing and applies explosion overpressures."""
        if self.is_finished or dt <= 0.0:
            return []

        self.elapsed_time += dt
        events: List[Dict] = []
        all_detonated = True

        for node in self.nodes:
            if not node.is_detonated and self.elapsed_time >= node.delay:
                node.is_detonated = True
                node_center = self.target_pos + node.offset

                events.append({
                    "type": "fireburst_node_detonated",
                    "node_index": node.index,
                    "center": node_center,
                    "radius": node.radius,
                    "time": self.elapsed_time,
                })

                for target in targets:
                    if not target.is_alive():
                        continue

                    d_vec = target.position - node_center
                    dist = d_vec.length()

                    if dist <= (node.radius + target.radius):
                        node.targets_hit.add(target.id)
                        hit_count = self.target_hit_counts.get(target.id, 0) + 1
                        self.target_hit_counts[target.id] = hit_count

                        # Pressure falloff from node center
                        intensity = max(0.2, 1.0 - (dist / (node.radius + target.radius)))
                        actual_dmg, poise_broken = target.apply_damage(
                            node.damage * intensity,
                            node.poise_damage * intensity
                        )

                        # Overpressure shock pushout
                        push_dir = d_vec.normalized() if dist > 0.01 else Vector3.up()
                        target.velocity = target.velocity + push_dir * (5.5 * intensity)

                        # Check ignition threshold (>= 2 cluster hits)
                        burn_applied = False
                        if hit_count == self.config.burn_threshold_hits:
                            target.apply_burn(
                                dps=self.config.burn_dps,
                                duration=self.config.burn_duration
                            )
                            burn_applied = True

                        events.append({
                            "type": "fireburst_blast_hit",
                            "node_index": node.index,
                            "target_id": target.id,
                            "cluster_hits": hit_count,
                            "damage": actual_dmg,
                            "poise_broken": poise_broken,
                            "burn_applied": burn_applied,
                        })

            if not node.is_detonated:
                all_detonated = False

        if all_detonated and self.elapsed_time >= (self.config.node_delays[-1] + 0.15):
            self.is_finished = True

        return events


# ==============================================================================
# 5. DARK RAVEN (IMPERIAL SOVEREIGN COMPANION)
# ==============================================================================

class RavenState(Enum):
    PERCHED = auto()             # Resting on Sovereign's shoulder
    ORBITING_PATROL = auto()     # Elliptical aerial patrol above hero
    TARGET_ACQUISITION = auto()  # Scanning & locking onto high priority threat
    DIVE_BOMBING = auto()        # High-speed corkscrew descent
    EYE_PECK = auto()            # Close-quarter cranial laceration with blind chance
    RETURN_TO_SHOULDER = auto()  # Banking ascent returning to hero


@dataclass
class DarkRavenConfig:
    mass_kg: float = 2.4
    base_command_radius: float = 8.0     # Meters (CMD = 0)
    cmd_radius_scaling: float = 0.015    # +15m per 1000 CMD
    base_patrol_speed: float = 7.0       # m/s
    cmd_patrol_scaling: float = 0.40     # +40% at 1000 CMD
    base_dive_speed: float = 18.0        # m/s
    cmd_dive_scaling: float = 0.85       # +85% at 1000 CMD (up to 33.3 m/s)
    screw_angular_freq: float = 16.0     # rad/s for spiral dive
    screw_radius: float = 0.60           # Spiral corkscrew amplitude
    base_damage: float = 120.0
    cmd_damage_scaling: float = 1.50     # +150% at 1000 CMD
    base_blind_chance: float = 0.15      # 15% base
    cmd_blind_scaling: float = 0.45      # Up to 60% at 1000 CMD
    base_blind_duration: float = 3.0     # Seconds
    cmd_blind_duration_scaling: float = 2.5
    peck_duration: float = 0.28          # Seconds spent pecking at head
    pecks_count: int = 3
    orbit_height: float = 4.5
    orbit_radius_a: float = 3.2
    orbit_radius_b: float = 2.2
    shoulder_offset: Vector3 = Vector3(0.35, -0.15, 1.65)


class DarkRavenAI:
    """
    Simulates the Sovereign's Dark Raven companion:
    - Autonomy, speed, dive kinetic energy, and blindness scaled by Command (CMD).
    - 6-state 3D free-flight machine:
      PERCHED -> ORBITING_PATROL -> TARGET_ACQUISITION -> DIVE_BOMBING -> EYE_PECK -> RETURN_TO_SHOULDER
    - Corkscrew descent trajectory (*mergulho em parafuso*).
    - Cranial eye-peck attack with statistical blindness infliction.
    """

    def __init__(
        self,
        hero_pos: Vector3,
        command_stat: float = 300.0,
        config: Optional[DarkRavenConfig] = None
    ):
        self.hero_pos = hero_pos
        self.command_stat = command_stat
        self.config = config or DarkRavenConfig()

        self.state: RavenState = RavenState.PERCHED
        self.position: Vector3 = self.hero_pos + self.config.shoulder_offset
        self.velocity: Vector3 = Vector3.zero()

        # Target and operational timers
        self.current_target: Optional[AdvancedCombatTarget] = None
        self.orbit_angle: float = 0.0
        self.state_timer: float = 0.0
        self.peck_elapsed: float = 0.0
        self.dive_start_pos: Vector3 = self.position

        # Telemetry
        self.total_kills_assisted: int = 0
        self.total_blinds_inflicted: int = 0
        self.successful_attacks: int = 0

    # --------------------------------------------------------------------------
    # CMD Scaling Properties
    # --------------------------------------------------------------------------
    @property
    def effective_command_radius(self) -> float:
        return self.config.base_command_radius + self.config.cmd_radius_scaling * self.command_stat

    @property
    def effective_patrol_speed(self) -> float:
        ratio = self.command_stat / 1000.0
        return self.config.base_patrol_speed * (1.0 + self.config.cmd_patrol_scaling * ratio)

    @property
    def effective_dive_speed(self) -> float:
        ratio = self.command_stat / 1000.0
        return self.config.base_dive_speed * (1.0 + self.config.cmd_dive_scaling * ratio)

    @property
    def effective_damage(self) -> float:
        ratio = self.command_stat / 1000.0
        return self.config.base_damage * (1.0 + self.config.cmd_damage_scaling * ratio)

    @property
    def effective_blind_chance(self) -> float:
        ratio = self.command_stat / 1000.0
        return min(0.70, self.config.base_blind_chance + self.config.cmd_blind_scaling * ratio)

    @property
    def effective_blind_duration(self) -> float:
        ratio = self.command_stat / 1000.0
        return self.config.base_blind_duration + self.config.cmd_blind_duration_scaling * ratio

    # --------------------------------------------------------------------------
    # Direct Sovereign Commands
    # --------------------------------------------------------------------------
    def order_attack(self, target: AdvancedCombatTarget) -> None:
        """Sovereign orders an immediate targeted dive on a specific enemy."""
        if target.is_alive():
            self.current_target = target
            self.dive_start_pos = self.position
            self.state = RavenState.DIVE_BOMBING
            self.state_timer = 0.0

    def order_patrol(self) -> None:
        """Orders raven to leave shoulder and enter aerial orbit."""
        self.current_target = None
        self.state = RavenState.ORBITING_PATROL
        self.state_timer = 0.0

    def order_return(self) -> None:
        """Orders raven to disengage and land back on the hero's shoulder."""
        self.current_target = None
        self.state = RavenState.RETURN_TO_SHOULDER
        self.state_timer = 0.0

    # --------------------------------------------------------------------------
    # AI State Machine Step
    # --------------------------------------------------------------------------
    def step(
        self,
        dt: float,
        hero_pos: Vector3,
        nearby_targets: List[AdvancedCombatTarget],
        force_blind_roll: Optional[bool] = None  # Injected seed for deterministic tests
    ) -> List[Dict]:
        """Advances Raven AI by dt. Returns combat and flight telemetry events."""
        if dt <= 0.0:
            return []

        self.hero_pos = hero_pos
        self.state_timer += dt
        events: List[Dict] = []
        shoulder_target = self.hero_pos + self.config.shoulder_offset

        # 1. PERCHED STATE
        if self.state == RavenState.PERCHED:
            self.position = shoulder_target
            self.velocity = Vector3.zero()

            # Auto-acquire if hostile exists within command radius
            threat = self._find_priority_target(nearby_targets)
            if threat:
                self.current_target = threat
                self.dive_start_pos = self.position
                self.state = RavenState.DIVE_BOMBING
                self.state_timer = 0.0
                events.append({
                    "type": "raven_dive_launched",
                    "target_id": threat.id,
                    "dive_speed": self.effective_dive_speed,
                })

        # 2. ORBITING_PATROL STATE
        elif self.state == RavenState.ORBITING_PATROL:
            omega = self.effective_patrol_speed / max(0.5, self.config.orbit_radius_a)
            self.orbit_angle = (self.orbit_angle + omega * dt) % (2.0 * math.pi)

            # 3D Elliptical orbit with flapping oscillation
            ox = self.config.orbit_radius_a * math.cos(self.orbit_angle)
            oy = self.config.orbit_radius_b * math.sin(self.orbit_angle)
            oz = self.config.orbit_height + 0.35 * math.sin(self.orbit_angle * 2.0)
            target_pos = self.hero_pos + Vector3(ox, oy, oz)

            # Move smoothly towards orbital point
            to_orbit = target_pos - self.position
            self.velocity = to_orbit * 4.0
            self.position = self.position + self.velocity * dt

            # Scan for targets
            threat = self._find_priority_target(nearby_targets)
            if threat:
                self.current_target = threat
                self.dive_start_pos = self.position
                self.state = RavenState.DIVE_BOMBING
                self.state_timer = 0.0
                events.append({
                    "type": "raven_dive_launched",
                    "target_id": threat.id,
                    "dive_speed": self.effective_dive_speed,
                })

        # 3. DIVE_BOMBING STATE (Screw descent)
        elif self.state == RavenState.DIVE_BOMBING:
            if not self.current_target or not self.current_target.is_alive():
                # Target vanished or died, return to patrol or shoulder
                self.state = RavenState.ORBITING_PATROL
                self.current_target = None
                return events

            target_head = self.current_target.position + Vector3(0.0, 0.0, self.current_target.height * 0.92)
            d_to_head = target_head - self.position
            dist = d_to_head.length()

            # Close-quarter threshold reached
            if dist <= 0.45:
                self.state = RavenState.EYE_PECK
                self.peck_elapsed = 0.0
                self.state_timer = 0.0
                self.position = target_head
                self.velocity = Vector3.zero()
            else:
                # Corkscrew dive formula: v = v_dive * D_dir + v_screw
                dive_dir = d_to_head.normalized()
                perp = Vector3(-dive_dir.y, dive_dir.x, 0.0).normalized()
                if perp.length_squared() < 1e-4:
                    perp = Vector3(1.0, 0.0, 0.0)

                screw_phase = self.config.screw_angular_freq * self.state_timer
                screw_offset = perp * (self.config.screw_radius * math.sin(screw_phase))

                v_linear = dive_dir * self.effective_dive_speed
                self.velocity = v_linear + screw_offset * 3.0
                self.position = self.position + self.velocity * dt

        # 4. EYE_PECK STATE (Cranial assault & Blindness)
        elif self.state == RavenState.EYE_PECK:
            if not self.current_target or not self.current_target.is_alive():
                self.state = RavenState.RETURN_TO_SHOULDER
                self.current_target = None
                return events

            target_head = self.current_target.position + Vector3(0.0, 0.0, self.current_target.height * 0.92)
            self.position = target_head  # Anchor to skull
            self.peck_elapsed += dt

            if self.peck_elapsed >= self.config.peck_duration:
                # Deliver cranial peck damage
                actual_dmg, poise_broken = self.current_target.apply_damage(
                    self.effective_damage,
                    poise_damage=30.0
                )
                self.successful_attacks += 1

                # Roll blindness chance
                blind_rolled = force_blind_roll if force_blind_roll is not None else (random.random() < self.effective_blind_chance)
                blind_duration = self.effective_blind_duration

                if blind_rolled:
                    self.current_target.apply_blind(blind_duration, accuracy_reduction=0.65)
                    self.total_blinds_inflicted += 1

                events.append({
                    "type": "raven_eye_peck_hit",
                    "target_id": self.current_target.id,
                    "damage": actual_dmg,
                    "poise_broken": poise_broken,
                    "blind_inflicted": blind_rolled,
                    "blind_duration": blind_duration if blind_rolled else 0.0,
                    "cmd_stat": self.command_stat,
                })

                # Check if other enemies remain in range
                next_threat = self._find_priority_target(nearby_targets, exclude_id=self.current_target.id)
                if next_threat:
                    self.current_target = next_threat
                    self.dive_start_pos = self.position
                    self.state = RavenState.DIVE_BOMBING
                    self.state_timer = 0.0
                else:
                    self.state = RavenState.RETURN_TO_SHOULDER
                    self.current_target = None
                    self.state_timer = 0.0

        # 5. RETURN_TO_SHOULDER STATE
        elif self.state == RavenState.RETURN_TO_SHOULDER:
            d_to_shoulder = shoulder_target - self.position
            dist = d_to_shoulder.length()

            if dist <= 0.15:
                # Smooth landing
                self.position = shoulder_target
                self.velocity = Vector3.zero()
                self.state = RavenState.PERCHED
                self.state_timer = 0.0
                events.append({
                    "type": "raven_perched",
                    "hero_pos": self.hero_pos,
                })
            else:
                # Dynamic banking approach with deceleration
                approach_speed = self.effective_patrol_speed * min(1.0, max(0.25, dist / 2.5))
                self.velocity = d_to_shoulder.normalized() * approach_speed
                self.position = self.position + self.velocity * dt

        return events

    def _find_priority_target(
        self,
        targets: List[AdvancedCombatTarget],
        exclude_id: Optional[str] = None
    ) -> Optional[AdvancedCombatTarget]:
        """Scans for closest alive target within effective command leash radius."""
        best_target = None
        min_dist = self.effective_command_radius

        for t in targets:
            if not t.is_alive():
                continue
            if exclude_id and t.id == exclude_id:
                continue

            dist = self.hero_pos.distance_to(t.position)
            if dist <= min_dist:
                min_dist = dist
                best_target = t

        return best_target
