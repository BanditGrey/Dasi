"""
Iconic Skills Physics Simulation Engine for Dasi.
Simulates real physics, aerodynamics, force fields, and kinematics for:
1. Twisting Slash (Blood Knight) - Torso angular momentum, centripetal suction field, blade slice trace, and shrapnel ejection.
2. Evil Spirits (Chaos Arcanist) - 12 to 24 logarithmic spiral projectiles, volumetric sweeps, and multi-hit damage damping.
3. Triple Shot (Sylph Huntress) - 3D convergent ballistics with drag, aerodynamic flutter, focus crossing, and target/terrain penetration.
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
# COMMON COMBAT ENTITY & HURTBOX DEFINITION
# ==============================================================================

@dataclass
class SimulatedTarget:
    """Represents a physics-aware target with mass, position, poise, and armor resistance."""
    id: str
    name: str
    position: Vector3
    velocity: Vector3 = field(default_factory=Vector3.zero)
    mass_kg: float = 80.0
    radius: float = 0.5
    height: float = 1.8
    current_hp: float = 1000.0
    poise: float = 100.0
    current_poise: float = 100.0
    armor_material_resistance: float = 1500.0  # N/m for penetration calculations
    is_boss: bool = False

    # Tracking per skill cast
    hits_taken: int = 0
    total_damage_received: float = 0.0
    stagger_count: int = 0
    attached_arrows: List[str] = field(default_factory=list)

    def is_alive(self) -> bool:
        return self.current_hp > 0.0

    def apply_damage(self, damage: float, poise_damage: float = 0.0) -> bool:
        """Applies damage and posture reduction. Returns True if posture broke."""
        self.current_hp = max(0.0, self.current_hp - damage)
        self.total_damage_received += damage
        self.hits_taken += 1
        
        self.current_poise = max(0.0, self.current_poise - poise_damage)
        poise_broken = (self.current_poise <= 0.0)
        if poise_broken:
            self.stagger_count += 1
            self.current_poise = self.poise * 0.5  # Partial recovery threshold
        return poise_broken


# ==============================================================================
# 1. TWISTING SLASH SIMULATION (BLOOD KNIGHT)
# ==============================================================================

@dataclass
class BladeShrapnel:
    """A physical fragment ejected from high-speed blade impact or ground friction."""
    position: Vector3
    velocity: Vector3
    mass_kg: float = 0.15
    radius: float = 0.04
    is_active: bool = True
    bounces_left: int = 2
    lifetime: float = 0.0
    max_lifetime: float = 1.2


@dataclass
class TwistingSlashConfig:
    blade_length: float = 1.9          # Blade reach in meters
    vortex_radius: float = 4.5         # Centripetal suction horizon
    vortex_pull_constant: float = 3.2  # G_vortex constant (N*s^2/m)
    friction_static: float = 0.40      # Ground static friction coeff
    friction_kinetic: float = 0.28     # Ground kinetic friction coeff
    spin_duration: float = 1.20        # Total spin duration in seconds
    total_rotations: float = 3.0       # Number of 360-degree turns
    base_damage_per_hit: float = 280.0
    poise_damage: float = 45.0
    shrapnel_count: int = 6
    shrapnel_drag_coeff: float = 0.47


class TwistingSlashSimulator:
    """
    Simulates the physical dynamics of Twisting Slash:
    - Torso angular acceleration and peak rotational speed.
    - Centripetal vortex suction pulling light and medium targets inward.
    - Blade sweep slicing with multi-revolution hit registry.
    - Impact momentum transfer (tangential sweep + centrifugal ejection).
    - Shrapnel physics with aerodynamic drag, gravity, and ground bouncing.
    """

    def __init__(self, caster_pos: Vector3, config: Optional[TwistingSlashConfig] = None):
        self.caster_pos = caster_pos
        self.config = config or TwistingSlashConfig()

        # Kinematic state
        self.elapsed_time: float = 0.0
        self.current_angle_rad: float = 0.0
        self.current_angular_velocity: float = 0.0
        self.is_finished: bool = False

        # Revolution tracking: targets hit in current revolution
        self.current_revolution_index: int = 0
        self.revolution_hits: Set[Tuple[int, str]] = set()  # (rev_index, target_id)

        # Active shrapnel
        self.shrapnel_list: List[BladeShrapnel] = []

        # History and telemetry
        self.total_blade_hits: int = 0
        self.pulled_targets: Set[str] = set()

    def get_blade_tip_position(self) -> Vector3:
        """Returns the current 3D position of the blade tip."""
        x = self.caster_pos.x + self.config.blade_length * math.cos(self.current_angle_rad)
        y = self.caster_pos.y + self.config.blade_length * math.sin(self.current_angle_rad)
        z = self.caster_pos.z + 1.0  # Torso/waist height
        return Vector3(x, y, z)

    def get_blade_tangential_velocity(self) -> Vector3:
        """Returns the linear velocity vector of the blade tip."""
        v_mag = self.current_angular_velocity * self.config.blade_length
        # Tangent vector: (-sin theta, cos theta, 0)
        vx = -v_mag * math.sin(self.current_angle_rad)
        vy = v_mag * math.cos(self.current_angle_rad)
        return Vector3(vx, vy, 0.0)

    def step(self, dt: float, targets: List[SimulatedTarget]) -> List[Dict]:
        """Advances simulation by dt. Returns list of hit events during this step."""
        if self.is_finished or dt <= 0.0:
            return []

        self.elapsed_time += dt
        if self.elapsed_time >= self.config.spin_duration:
            self.is_finished = True

        hit_events: List[Dict] = []

        # 1. Update Torso Angular Kinematics (Spin-up, sustain, spin-down)
        # Using a smooth bell-shaped angular velocity profile
        total_angle = self.config.total_rotations * 2.0 * math.pi
        t_norm = min(1.0, self.elapsed_time / self.config.spin_duration)
        
        # Smooth trapezoidal/sinusoidal angular velocity
        # Omega peak roughly at t_norm = 0.5.
        # Note: Integral of sin(pi * t) from 0 to 1 is 2/pi.
        # Multiplying by pi / 2 ensures exact integration to total_angle.
        avg_omega = total_angle / self.config.spin_duration
        self.current_angular_velocity = avg_omega * ((math.pi / 2.0) * math.sin(math.pi * t_norm))
        d_theta = self.current_angular_velocity * dt
        self.current_angle_rad += d_theta

        self.current_revolution_index = int(self.current_angle_rad / (2.0 * math.pi))

        # 2. Centripetal Force Field (Suction Vortex)
        self._apply_centripetal_vortex(dt, targets)

        # 3. Blade Collision Sweeps against targets
        blade_tip = self.get_blade_tip_position()
        blade_tangent_v = self.get_blade_tangential_velocity()

        for target in targets:
            if not target.is_alive():
                continue

            hit_key = (self.current_revolution_index, target.id)
            if hit_key in self.revolution_hits:
                continue  # Already struck this target in the current revolution

            # Check distance from caster center in horizontal plane
            d_vec = target.position - self.caster_pos
            dist_2d = math.hypot(d_vec.x, d_vec.y)

            # Within blade cutting cylinder: [inner_radius, blade_length + target.radius]
            if dist_2d <= (self.config.blade_length + target.radius):
                # Angular alignment check with the sweeping blade
                target_angle = math.atan2(d_vec.y, d_vec.x) % (2.0 * math.pi)
                curr_sweep_angle = self.current_angle_rad % (2.0 * math.pi)
                angle_diff = abs(target_angle - curr_sweep_angle)
                if angle_diff > math.pi:
                    angle_diff = 2.0 * math.pi - angle_diff

                # If blade crossed the target angular sector
                # (allowing tolerance proportional to angular step and target size)
                angular_reach = math.atan2(target.radius, max(0.5, dist_2d)) + max(0.2, abs(d_theta) * 1.5)
                if angle_diff <= angular_reach:
                    # Struck target!
                    self.revolution_hits.add(hit_key)
                    self.total_blade_hits += 1

                    poise_broken = target.apply_damage(
                        self.config.base_damage_per_hit,
                        self.config.poise_damage
                    )

                    # Calculate momentum transfer:
                    # Tangential sweep vector + outward ejection if poise broken
                    tangent_norm = Vector3(-math.sin(self.current_angle_rad), math.cos(self.current_angle_rad), 0.0)
                    radial_norm = Vector3(d_vec.x / max(0.01, dist_2d), d_vec.y / max(0.01, dist_2d), 0.0)

                    # Base tangential impulse
                    recoil = tangent_norm * (blade_tangent_v.length() * (35.0 / max(30.0, target.mass_kg)))

                    # If posture broken, eject target outward (centrifugal release)
                    if poise_broken and not target.is_boss:
                        ejection_speed = 8.5 * (60.0 / max(40.0, target.mass_kg))
                        recoil = recoil + radial_norm * ejection_speed + Vector3(0.0, 0.0, 2.5)

                    target.velocity = target.velocity + recoil

                    # Spawn shrapnel from impact
                    self._spawn_blade_shrapnel(blade_tip, blade_tangent_v)

                    hit_events.append({
                        "target_id": target.id,
                        "revolution": self.current_revolution_index,
                        "damage": self.config.base_damage_per_hit,
                        "poise_broken": poise_broken,
                        "recoil_velocity": target.velocity,
                        "impact_point": blade_tip,
                    })

        # 4. Update Shrapnel Physics
        self._update_shrapnel(dt)

        return hit_events

    def _apply_centripetal_vortex(self, dt: float, targets: List[SimulatedTarget]) -> None:
        """Pulls targets within vortex radius towards the blade radius based on mass & friction."""
        g = 9.81
        for target in targets:
            if not target.is_alive() or target.is_boss:
                continue

            d_vec = self.caster_pos - target.position
            dist_2d = math.hypot(d_vec.x, d_vec.y)

            # Only pull targets between blade orbit and vortex boundary
            if self.config.blade_length < dist_2d <= self.config.vortex_radius:
                # Inward unit vector
                inward_dir = Vector3(d_vec.x / dist_2d, d_vec.y / dist_2d, 0.0)

                # Centripetal suction force formula:
                # F_pull = G_vortex * (omega^2 * (R_vortex - r)) / (1 + 0.015 * m)
                mass_damp = 1.0 + 0.015 * target.mass_kg
                omega_sq = self.current_angular_velocity ** 2
                f_pull_mag = self.config.vortex_pull_constant * (omega_sq * (self.config.vortex_radius - dist_2d)) / mass_damp

                # Friction thresholds
                f_static_max = self.config.friction_static * target.mass_kg * g
                if f_pull_mag > f_static_max:
                    # Target breaks static friction and accelerates inward
                    f_kinetic = self.config.friction_kinetic * target.mass_kg * g
                    f_net = f_pull_mag - f_kinetic
                    a_inward = f_net / target.mass_kg

                    # Apply velocity and displacement
                    target.velocity = target.velocity + inward_dir * (a_inward * dt)
                    # Ground drag damping
                    target.velocity = target.velocity * max(0.0, 1.0 - 2.5 * dt)
                    target.position = target.position + target.velocity * dt

                    self.pulled_targets.add(target.id)

    def _spawn_blade_shrapnel(self, origin: Vector3, blade_vel: Vector3) -> None:
        """Spawns realistic debris fragments ejected from impact."""
        for _ in range(self.config.shrapnel_count):
            # Ejection along blade tangent with radial and vertical scatter
            cone_x = random.uniform(-0.4, 0.4)
            cone_y = random.uniform(-0.4, 0.4)
            cone_z = random.uniform(0.75, 1.35)  # Realistic energetic upward arc (min 6.0 m/s)

            base_v = blade_vel * 0.45
            eject_v = Vector3(
                base_v.x + cone_x * 12.0,
                base_v.y + cone_y * 12.0,
                base_v.z + cone_z * 8.0,
            )
            shrapnel = BladeShrapnel(
                position=origin,
                velocity=eject_v,
                mass_kg=random.uniform(0.1, 0.3),
            )
            self.shrapnel_list.append(shrapnel)

    def _update_shrapnel(self, dt: float) -> None:
        """Updates shrapnel positions with gravity, aerodynamic drag, and ground bouncing."""
        rho = 1.225
        g = Vector3(0.0, 0.0, -9.81)

        for s in self.shrapnel_list:
            if not s.is_active:
                continue

            s.lifetime += dt
            if s.lifetime >= s.max_lifetime:
                s.is_active = False
                continue

            # Quadratic air resistance: F_d = -0.5 * rho * C_d * A * |v| * v
            speed = s.velocity.length()
            if speed > 1e-4:
                area = math.pi * (s.radius ** 2)
                f_drag_mag = 0.5 * rho * self.config.shrapnel_drag_coeff * area * (speed ** 2)
                drag_acc = -(s.velocity.normalized()) * (f_drag_mag / s.mass_kg)
            else:
                drag_acc = Vector3.zero()

            total_acc = g + drag_acc
            s.velocity = s.velocity + total_acc * dt
            s.position = s.position + s.velocity * dt

            # Ground bounce collision
            if s.position.z <= 0.0:
                s.position = Vector3(s.position.x, s.position.y, 0.0)
                if s.bounces_left > 0 and abs(s.velocity.z) > 0.5:
                    s.bounces_left -= 1
                    s.velocity = Vector3(
                        s.velocity.x * 0.65,
                        s.velocity.y * 0.65,
                        -s.velocity.z * 0.35,  # Restitution coeff = 0.35
                    )
                else:
                    s.velocity = Vector3.zero()
                    s.is_active = False


# ==============================================================================
# 2. EVIL SPIRITS SIMULATION (CHAOS ARCANIST)
# ==============================================================================

@dataclass
class SpectralSpirit:
    """An individual spectral soul projectile expanding in a logarithmic spiral."""
    index: int
    initial_phase_rad: float
    current_angle_rad: float
    current_radius: float
    position: Vector3
    prev_position: Vector3
    is_active: bool = True
    traveled_distance: float = 0.0


@dataclass
class EvilSpiritsConfig:
    spirit_count: int = 16            # 12 to 24 spirits
    r0: float = 0.50                  # Initial radius in meters
    r_max: float = 12.0               # Maximum outward reach
    duration_sec: float = 1.60        # Full wave lifetime
    turns: float = 1.5                # Number of revolutions before fading
    spirit_radius: float = 0.45       # Collision sphere radius
    hover_amplitude: float = 0.45     # Vertical wave amplitude
    hover_freq: float = 8.0           # Vertical oscillation frequency
    base_damage: float = 350.0        # First hit damage
    damping_factor: float = 0.55      # Exponential damping per subsequent hit
    damping_floor: float = 0.18       # Minimum damage multiplier floor
    max_hits_per_target: int = 4      # Hard cap to prevent instant-kill shotgunning


class EvilSpiritsSimulator:
    """
    Simulates the chaotic spectral swarm of Evil Spirits:
    - Trajectories governed by logarithmic spiral r = r0 * exp(b * theta).
    - Uniform phase distribution of 12-24 spirits with vertical hovering sinusoidal waves.
    - Volumetric continuous swept-sphere collision detection.
    - Strict multi-hit damage damping preventing unfair point-blank stacking while rewarding wide area denial.
    """

    def __init__(self, caster_pos: Vector3, config: Optional[EvilSpiritsConfig] = None):
        self.caster_pos = caster_pos
        self.config = config or EvilSpiritsConfig()

        # Clamp spirit count to [12, 24] range
        self.spirit_count = max(12, min(24, self.config.spirit_count))

        # Logarithmic spiral coefficient: b = ln(R_max / r0) / (2 * pi * turns)
        self.b_coeff = math.log(self.config.r_max / self.config.r0) / (2.0 * math.pi * self.config.turns)
        self.total_angular_sweep = 2.0 * math.pi * self.config.turns
        self.angular_velocity = self.total_angular_sweep / self.config.duration_sec

        self.elapsed_time: float = 0.0
        self.is_finished: bool = False

        # Target hit ledger for this cast: target_id -> count of hits taken
        self.target_hits: Dict[str, int] = {}

        # Instantiate spirits
        self.spirits: List[SpectralSpirit] = []
        self._initialize_spirits()

    def _initialize_spirits(self) -> None:
        """Distributes spirits uniformly across [0, 2*pi) with slight chaotic jitter."""
        angle_step = (2.0 * math.pi) / self.spirit_count
        for i in range(self.spirit_count):
            jitter = random.uniform(-0.08, 0.08)
            phase = (i * angle_step + jitter) % (2.0 * math.pi)
            init_pos = self._calculate_spirit_position(phase, theta_progress=0.0, time=0.0)
            spirit = SpectralSpirit(
                index=i,
                initial_phase_rad=phase,
                current_angle_rad=phase,
                current_radius=self.config.r0,
                position=init_pos,
                prev_position=init_pos,
            )
            self.spirits.append(spirit)

    def _calculate_spirit_position(self, initial_phase: float, theta_progress: float, time: float) -> Vector3:
        """Calculates 3D position in logarithmic spiral with sinusoidal hover."""
        # r = r0 * exp(b * theta_progress)
        r = self.config.r0 * math.exp(self.b_coeff * theta_progress)
        theta = initial_phase + theta_progress

        x = self.caster_pos.x + r * math.cos(theta)
        y = self.caster_pos.y + r * math.sin(theta)
        # Sinusoidal vertical hover: z = z0 + A * sin(omega_z * t + initial_phase)
        z = self.caster_pos.z + 1.2 + self.config.hover_amplitude * math.sin(self.config.hover_freq * time + initial_phase)

        return Vector3(x, y, z)

    def step(self, dt: float, targets: List[SimulatedTarget]) -> List[Dict]:
        """Advances spirit swarm by dt and checks for volumetric hits."""
        if self.is_finished or dt <= 0.0:
            return []

        self.elapsed_time += dt
        if self.elapsed_time >= self.config.duration_sec:
            self.is_finished = True

        theta_progress = self.angular_velocity * self.elapsed_time
        hit_events: List[Dict] = []

        for spirit in self.spirits:
            if not spirit.is_active:
                continue

            spirit.prev_position = spirit.position
            spirit.current_angle_rad = spirit.initial_phase_rad + theta_progress
            spirit.current_radius = self.config.r0 * math.exp(self.b_coeff * theta_progress)
            spirit.position = self._calculate_spirit_position(spirit.initial_phase_rad, theta_progress, self.elapsed_time)
            
            step_dist = (spirit.position - spirit.prev_position).length()
            spirit.traveled_distance += step_dist

            if spirit.current_radius >= self.config.r_max:
                spirit.is_active = False
                continue

            # Volumetric swept-sphere test against targets
            for target in targets:
                if not target.is_alive():
                    continue

                curr_target_hits = self.target_hits.get(target.id, 0)
                if curr_target_hits >= self.config.max_hits_per_target:
                    continue  # Target reached saturation limit for this cast

                # Swept capsule test: distance from target center to segment (prev_pos -> current_pos)
                target_center = Vector3(target.position.x, target.position.y, target.position.z + target.height * 0.5)
                dist_to_sweep = distance_point_to_segment(target_center, spirit.prev_position, spirit.position)

                collision_threshold = self.config.spirit_radius + target.radius
                if dist_to_sweep <= collision_threshold:
                    # Struck target! Calculate damped damage
                    hit_index = curr_target_hits + 1
                    damping_mult = max(self.config.damping_floor, self.config.damping_factor ** (hit_index - 1))
                    final_damage = self.config.base_damage * damping_mult

                    self.target_hits[target.id] = hit_index
                    poise_broken = target.apply_damage(final_damage, poise_damage=15.0)

                    # Micro-spectral impulse
                    impact_dir = (target_center - spirit.position).normalized()
                    target.velocity = target.velocity + impact_dir * 1.5

                    hit_events.append({
                        "spirit_index": spirit.index,
                        "target_id": target.id,
                        "hit_order": hit_index,
                        "damage": final_damage,
                        "damping_multiplier": damping_mult,
                        "poise_broken": poise_broken,
                        "impact_pos": spirit.position,
                    })

        return hit_events


# ==============================================================================
# 3. TRIPLE SHOT SIMULATION (SYLPH HUNTRESS)
# ==============================================================================

class ArrowState(Enum):
    IN_FLIGHT = auto()
    STUCK_IN_TARGET = auto()
    STUCK_IN_GROUND = auto()
    DEFLECTED = auto()
    EXPIRED = auto()


@dataclass
class BallisticArrow:
    """An individual arrow simulated with full 3D aerodynamics and penetration physics."""
    index: int  # 0: Left, 1: Center, 2: Right
    position: Vector3
    velocity: Vector3
    prev_position: Vector3
    state: ArrowState = ArrowState.IN_FLIGHT
    mass_kg: float = 0.045               # 45g standard war arrow
    cross_section_area: float = 0.00018  # m^2 (shaft + broadhead tip)
    drag_coeff: float = 0.045            # Very low aerodynamic drag
    shaft_length: float = 0.75           # 75 cm arrow length
    lifetime: float = 0.0
    max_lifetime: float = 4.0

    # Penetration and attachment
    stuck_target_id: Optional[str] = None
    stuck_relative_pos: Vector3 = field(default_factory=Vector3.zero)
    penetration_depth_m: float = 0.0
    quiver_amplitude: float = 0.0        # Visual vibration of stuck arrow
    quiver_decay: float = 6.0


@dataclass
class TripleShotConfig:
    bow_draw_speed: float = 85.0        # Muzzle speed in m/s (approx 306 km/h)
    arrow_mass: float = 0.045           # 45 grams
    socket_offset: float = 0.22         # Distance between bow sockets in meters
    focus_distance: float = 18.0        # Convergence point distance
    base_damage: float = 240.0
    poise_damage: float = 35.0
    air_density: float = 1.225          # kg/m^3
    flutter_intensity: float = 0.08     # Aerodynamic lateral flutter


class TripleShotSimulator:
    """
    Simulates the advanced 3D ballistics of Triple Shot:
    - 3 simultaneous arrows launched from Left, Center, and Right bow sockets.
    - Convergent angular steering calculated to intersect precisely at focus range D_focus.
    - True 3D numerical integration (Euler-Cromer) with gravity and quadratic air resistance.
    - Kinetic energy calculation on impact: E_k = 0.5 * m * v^2.
    - Target/Ground penetration depth and physical arrow sticking with bone attachment and quiver vibration.
    """

    def __init__(
        self,
        caster_pos: Vector3,
        aim_direction: Vector3,
        config: Optional[TripleShotConfig] = None
    ):
        self.caster_pos = caster_pos
        self.aim_dir = aim_direction.normalized()
        self.config = config or TripleShotConfig()

        self.elapsed_time: float = 0.0
        self.is_finished: bool = False

        # Calculate Bow Basis Vectors: Forward, Right, Up
        world_up = Vector3.up()
        self.bow_forward = self.aim_dir
        self.bow_right = self.bow_forward.cross(world_up).normalized()
        if self.bow_right.length_squared() < 1e-4:
            self.bow_right = Vector3.right()
        self.bow_up = self.bow_right.cross(self.bow_forward).normalized()

        # Convergence focus point: P_focus = Caster + Aim * D_focus + (0, 0, 1.2)
        self.focus_point = self.caster_pos + self.aim_dir * self.config.focus_distance + Vector3(0.0, 0.0, 1.2)

        # Instantiate 3 arrows
        self.arrows: List[BallisticArrow] = []
        self._spawn_convergent_arrows()

    def _spawn_convergent_arrows(self) -> None:
        """Spawns Left, Center, and Right arrows aimed to converge at focus_point."""
        socket_offsets = [-self.config.socket_offset, 0.0, self.config.socket_offset]
        g = 9.81

        # Flight time to focus point estimation: t = D / v
        t_flight = self.config.focus_distance / self.config.bow_draw_speed
        # Gravitational drop compensation loft velocity
        v_loft = 0.5 * g * t_flight

        for i, lateral_offset in enumerate(socket_offsets):
            # Origin of arrow: bow center + lateral displacement along bow_right
            origin = self.caster_pos + Vector3(0.0, 0.0, 1.2) + self.bow_right * lateral_offset

            # Direction vector pointing straight to focus point
            dir_to_focus = (self.focus_point - origin).normalized()

            # Initial velocity with loft compensation
            init_v = dir_to_focus * self.config.bow_draw_speed + Vector3(0.0, 0.0, v_loft)

            arrow = BallisticArrow(
                index=i,
                position=origin,
                velocity=init_v,
                prev_position=origin,
                mass_kg=self.config.arrow_mass,
            )
            self.arrows.append(arrow)

    def step(self, dt: float, targets: List[SimulatedTarget]) -> List[Dict]:
        """Advances arrow flight, applies aerodynamic drag/gravity, and checks hits."""
        if self.is_finished or dt <= 0.0:
            return []

        self.elapsed_time += dt
        all_settled = True
        hit_events: List[Dict] = []
        g = Vector3(0.0, 0.0, -9.81)

        # Map targets by ID for fast lookup
        target_map = {t.id: t for t in targets}

        for arrow in self.arrows:
            if arrow.state == ArrowState.EXPIRED:
                continue

            # Case 1: Arrow already stuck into a moving target
            if arrow.state == ArrowState.STUCK_IN_TARGET:
                target = target_map.get(arrow.stuck_target_id)
                if target and target.is_alive():
                    # Move with target's position
                    arrow.position = target.position + arrow.stuck_relative_pos
                    arrow.quiver_amplitude = max(0.0, arrow.quiver_amplitude - self.config.flutter_intensity * dt)
                else:
                    # Target died; arrow falls or expires
                    arrow.state = ArrowState.EXPIRED
                continue

            # Case 2: Arrow stuck into terrain
            if arrow.state == ArrowState.STUCK_IN_GROUND:
                arrow.quiver_amplitude = max(0.0, arrow.quiver_amplitude - arrow.quiver_decay * dt)
                continue

            # Case 3: Arrow in flight
            all_settled = False
            arrow.lifetime += dt
            if arrow.lifetime >= arrow.max_lifetime:
                arrow.state = ArrowState.EXPIRED
                continue

            arrow.prev_position = arrow.position

            # Aerodynamic Drag: F_d = -0.5 * rho * C_d * A * |v| * v
            speed = arrow.velocity.length()
            if speed > 1e-4:
                drag_force_mag = (
                    0.5
                    * self.config.air_density
                    * arrow.drag_coeff
                    * arrow.cross_section_area
                    * (speed ** 2)
                )
                drag_acc = -(arrow.velocity.normalized()) * (drag_force_mag / arrow.mass_kg)
            else:
                drag_acc = Vector3.zero()

            # Slight lateral aerodynamic flutter
            flutter_x = random.uniform(-1.0, 1.0) * self.config.flutter_intensity
            flutter_y = random.uniform(-1.0, 1.0) * self.config.flutter_intensity
            flutter_acc = Vector3(flutter_x, flutter_y, 0.0)

            # Numerical integration
            total_acc = g + drag_acc + flutter_acc
            arrow.velocity = arrow.velocity + total_acc * dt
            arrow.position = arrow.position + arrow.velocity * dt

            # Collision Check A: Ground Impact (z <= 0)
            if arrow.position.z <= 0.0:
                arrow.position = Vector3(arrow.position.x, arrow.position.y, 0.0)
                arrow.state = ArrowState.STUCK_IN_GROUND
                # Calculate kinetic energy and ground embed depth
                impact_speed = arrow.velocity.length()
                e_k = 0.5 * arrow.mass_kg * (impact_speed ** 2)
                ground_resistance = 3200.0  # N/m
                arrow.penetration_depth_m = min(arrow.shaft_length, e_k / ground_resistance)
                arrow.quiver_amplitude = 1.0
                arrow.velocity = Vector3.zero()
                continue

            # Collision Check B: Target Hurtbox Sweeps
            for target in targets:
                if not target.is_alive():
                    continue

                target_center = Vector3(
                    target.position.x,
                    target.position.y,
                    target.position.z + target.height * 0.5,
                )
                dist_to_arrow_path = distance_point_to_segment(
                    target_center, arrow.prev_position, arrow.position
                )

                if dist_to_arrow_path <= (target.radius + 0.15):
                    # Direct Hit!
                    impact_speed = arrow.velocity.length()
                    kinetic_energy = 0.5 * arrow.mass_kg * (impact_speed ** 2)

                    # Penetration depth based on target material resistance
                    embed_depth = min(arrow.shaft_length, kinetic_energy / max(100.0, target.armor_material_resistance))
                    arrow.penetration_depth_m = embed_depth

                    # Pin arrow to target body
                    arrow.state = ArrowState.STUCK_IN_TARGET
                    arrow.stuck_target_id = target.id
                    arrow.stuck_relative_pos = arrow.position - target.position
                    arrow.quiver_amplitude = 1.0
                    target.attached_arrows.append(f"arrow_{arrow.index}")

                    # Apply damage and impulse
                    poise_broken = target.apply_damage(
                        self.config.base_damage,
                        self.config.poise_damage,
                    )
                    # Physical impulse: J = m * v
                    impulse = arrow.velocity * (arrow.mass_kg * 4.0 / max(30.0, target.mass_kg))
                    target.velocity = target.velocity + impulse

                    arrow.velocity = Vector3.zero()

                    hit_events.append({
                        "arrow_index": arrow.index,
                        "target_id": target.id,
                        "impact_speed": impact_speed,
                        "kinetic_energy_joules": kinetic_energy,
                        "penetration_depth_cm": embed_depth * 100.0,
                        "damage": self.config.base_damage,
                        "poise_broken": poise_broken,
                        "hit_pos": arrow.position,
                    })
                    break

        if all_settled:
            self.is_finished = True

        return hit_events
