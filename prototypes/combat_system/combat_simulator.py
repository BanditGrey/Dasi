"""
Full Combat Simulation Harness for Dasi.
Integrates Weapon Traces, State Machine, Damage Formulas, Hit-Stop, Stagger, and Camera Shake.
"""

from __future__ import annotations
import math
import random
from enum import Enum, auto
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple

from .vector3 import Vector3
from .weapon_trace import WeaponTraceSystem, WeaponSocket, TargetHurtbox, HitEvent
from .combat_state_machine import CombatStateMachine, CombatState
from .wings_physics import WingPhysicsSystem, WingTier, WingSimulationState


class DamageType(Enum):
    NORMAL = "Normal (Branco)"
    SKILL = "Habilidade (Laranja)"
    CRITICAL = "Crítico (Azul Claro)"
    EXCELLENT = "Excelente (Verde Limão)"
    IGNORE_DEFENSE = "Ignorar Defesa (Dourado)"
    DOUBLE_DAMAGE = "Dano Duplo (Roxo)"


class StaggerLevel(Enum):
    NONE = auto()
    LIGHT_FLINCH = auto()      # Bone-layer blend only
    MEDIUM_KNOCKBACK = auto()  # Interrupt and push back
    HARD_KNOCKDOWN = auto()    # Posture break ragdoll


@dataclass
class CameraShakeEvent:
    frequency_hz: float
    amplitude_deg: float
    duration_sec: float


@dataclass
class ImpactFeedback:
    damage: int
    damage_type: DamageType
    hit_stop_duration: float
    stagger_level: StaggerLevel
    recoil_vector: Vector3
    camera_shake: CameraShakeEvent
    vfx_type: str


@dataclass
class CombatantStats:
    name: str
    max_hp: int = 1000
    current_hp: int = 1000
    strength: int = 150
    agility: int = 100
    vitality: int = 80
    energy: int = 50
    defense: int = 60
    poise: float = 100.0
    current_poise: float = 100.0
    tenacity: float = 0.15      # Reduces hit-stop and recoil
    is_two_handed: bool = False
    weapon_speed_mod: float = 1.0


class CombatSimulator:
    """
    Simulates high-fidelity combat interactions between combatants.
    """

    def __init__(self, attacker_stats: CombatantStats, defender_stats: CombatantStats):
        self.attacker_stats = attacker_stats
        self.defender_stats = defender_stats

        # Position tracking
        self.attacker_pos = Vector3(0.0, 0.0, 0.0)
        self.defender_pos = Vector3(1.2, 0.0, 0.0)  # In front of attacker

        # Combat state machines
        self.attacker_sm = CombatStateMachine(
            actor_id="attacker",
            agility=attacker_stats.agility,
            weapon_speed_mod=attacker_stats.weapon_speed_mod,
        )
        self.defender_sm = CombatStateMachine(
            actor_id="defender",
            agility=defender_stats.agility,
            weapon_speed_mod=defender_stats.weapon_speed_mod,
        )

        # Volumetric Weapon Trace
        blade_length = 1.8 if attacker_stats.is_two_handed else 1.2
        sockets = [
            WeaponSocket("Hilt", Vector3(0.0, 0.0, 0.1), radius=0.15),
            WeaponSocket("MidBlade", Vector3(0.0, 0.0, blade_length * 0.5), radius=0.18),
            WeaponSocket("Tip", Vector3(0.0, 0.0, blade_length), radius=0.22),
        ]
        self.weapon_trace = WeaponTraceSystem(owner_id="attacker", sockets=sockets)

        # Connect state machine callbacks to weapon trace
        self.attacker_sm.on_strike_start = self._on_strike_start
        self.attacker_sm.on_strike_end = self._on_strike_end

        # Wings System
        self.wings = WingPhysicsSystem(WingTier.TIER_2_CELESTIAL)

        # Simulation telemetry
        self.elapsed_time: float = 0.0
        self.impact_logs: List[ImpactFeedback] = []

    def _on_strike_start(self, combo_step: int) -> None:
        initial_energy = 120.0 if self.attacker_stats.is_two_handed else 90.0
        self.weapon_trace.begin_swing(initial_energy=initial_energy)

    def _on_strike_end(self, combo_step: int) -> None:
        self.weapon_trace.end_swing()

    def calculate_damage_and_feedback(
        self, hit: HitEvent, force_damage_type: Optional[DamageType] = None
    ) -> ImpactFeedback:
        """
        Calculates damage, hit-stop duration, stagger reaction, and camera shake.
        """
        min_atk = self.attacker_stats.strength * 1.5
        max_atk = self.attacker_stats.strength * 2.2
        target_def = self.defender_stats.defense

        # Determine damage type
        if force_damage_type:
            dtype = force_damage_type
        else:
            roll = random.random()
            if roll < 0.10:
                dtype = DamageType.IGNORE_DEFENSE
            elif roll < 0.25:
                dtype = DamageType.EXCELLENT
            elif roll < 0.50:
                dtype = DamageType.CRITICAL
            elif roll < 0.75:
                dtype = DamageType.SKILL
            else:
                dtype = DamageType.NORMAL

        # Damage calculation
        if dtype == DamageType.NORMAL:
            base_dmg = random.uniform(min_atk, max_atk) - target_def
            hit_stop = 0.040
            cam_shake = CameraShakeEvent(18.0, 0.15, 0.10)
            vfx = "VFX_Slash_White"

        elif dtype == DamageType.SKILL:
            base_dmg = (random.uniform(min_atk, max_atk) * 1.35) - target_def
            hit_stop = 0.060
            cam_shake = CameraShakeEvent(22.0, 0.30, 0.12)
            vfx = "VFX_Sparks_Orange"

        elif dtype == DamageType.CRITICAL:
            base_dmg = max_atk + 50.0 - target_def
            hit_stop = 0.085
            cam_shake = CameraShakeEvent(28.0, 0.55, 0.18)
            vfx = "VFX_SonicShock_Cyan"

        elif dtype == DamageType.EXCELLENT:
            base_dmg = (max_atk * 1.20) + 80.0 - (target_def * 0.8)
            hit_stop = 0.100
            cam_shake = CameraShakeEvent(30.0, 0.70, 0.22)
            vfx = "VFX_ElectroBurst_Lime"

        elif dtype == DamageType.IGNORE_DEFENSE:
            base_dmg = random.uniform(min_atk, max_atk) * 1.25  # Zero defense
            hit_stop = 0.120
            cam_shake = CameraShakeEvent(35.0, 1.25, 0.25)
            vfx = "VFX_ArmorShatter_Gold"

        elif dtype == DamageType.DOUBLE_DAMAGE:
            base_dmg = (random.uniform(min_atk, max_atk) - target_def) * 2.0
            hit_stop = 0.090
            cam_shake = CameraShakeEvent(26.0, 0.60, 0.20)
            vfx = "VFX_DoubleStrike_Purple"

        # Heavy weapon impact scaling
        if self.attacker_stats.is_two_handed:
            hit_stop *= 1.35
            cam_shake.amplitude_deg *= 1.4

        # Attacker/Defender Tenacity reduction
        tenacity = self.defender_stats.tenacity
        final_hit_stop = max(0.020, hit_stop * (1.0 - tenacity))

        final_damage = max(1, int(base_dmg))
        self.defender_stats.current_hp = max(0, self.defender_stats.current_hp - final_damage)

        # Stagger and Poise Damage
        poise_damage = final_damage * 0.4
        self.defender_stats.current_poise -= poise_damage

        # Calculate recoil impulse vector
        recoil_dir = (self.defender_pos - self.attacker_pos).normalized()
        recoil_mag = (final_damage / 100.0) * (1.5 if self.attacker_stats.is_two_handed else 1.0)
        recoil_vector = recoil_dir * recoil_mag

        if self.defender_stats.current_poise <= 0.0:
            stagger = StaggerLevel.HARD_KNOCKDOWN
            self.defender_stats.current_poise = self.defender_stats.poise  # Reset poise after knockdown
            recoil_vector = recoil_vector * 2.2 + Vector3(0.0, 0.0, 1.8)  # Air launch
        elif poise_damage > 30.0:
            stagger = StaggerLevel.MEDIUM_KNOCKBACK
        else:
            stagger = StaggerLevel.LIGHT_FLINCH

        feedback = ImpactFeedback(
            damage=final_damage,
            damage_type=dtype,
            hit_stop_duration=round(final_hit_stop, 3),
            stagger_level=stagger,
            recoil_vector=recoil_vector,
            camera_shake=cam_shake,
            vfx_type=vfx,
        )
        return feedback

    def step(self, delta_time: float, force_damage_type: Optional[DamageType] = None) -> List[ImpactFeedback]:
        """
        Advances the simulation by delta_time.
        Updates state machines, blade motion, swept collision, and impact resolution.
        """
        self.elapsed_time += delta_time

        # Update State Machines
        self.attacker_sm.update(delta_time)
        self.defender_sm.update(delta_time)

        feedbacks: List[ImpactFeedback] = []

        # If attacker is in ACTIVE_STRIKE, calculate blade arc trajectory
        if self.attacker_sm.current_state == CombatState.ACTIVE_STRIKE:
            phase_time = self.attacker_sm.state_time
            total_active = self.attacker_sm.current_timings.active_strike_time
            progress = min(1.0, phase_time / max(1e-4, total_active))

            # Simulate dynamic horizontal blade sweep from -60 deg to +60 deg
            angle_rad = math.radians(-60.0 + 120.0 * progress)
            cos_a = math.cos(angle_rad)
            sin_a = math.sin(angle_rad)

            # Compute socket positions in world space
            current_sockets: Dict[str, Vector3] = {}
            for sock in self.weapon_trace.sockets:
                reach = sock.relative_offset.z
                # Swung in front of attacker at chest height
                sock_pos = self.attacker_pos + Vector3(
                    cos_a * reach,
                    sin_a * reach,
                    1.1,
                )
                current_sockets[sock.name] = sock_pos

            # Check if defender is invulnerable (e.g. dodging with i-frames)
            target_hurtbox = TargetHurtbox(
                actor_id=self.defender_sm.actor_id,
                actor_name=self.defender_stats.name,
                position=self.defender_pos,
                capsule_height=1.8,
                capsule_radius=0.45,
                poise=self.defender_stats.poise,
                armor_density=self.defender_stats.defense * 0.3,
            )

            # Swept trace
            hits = self.weapon_trace.update_trace(
                current_socket_world_positions=current_sockets,
                delta_time=delta_time,
                potential_targets=[target_hurtbox],
            )

            for hit in hits:
                if self.defender_sm.is_invulnerable:
                    # Defender successfully evaded with i-frames!
                    continue

                fb = self.calculate_damage_and_feedback(hit, force_damage_type)
                feedbacks.append(fb)
                self.impact_logs.append(fb)

                # Trigger Hit-Stop on attacker (micro-freeze animation and weapon trace)
                self.attacker_sm.trigger_hit_stop(fb.hit_stop_duration)

                # Move defender by recoil
                self.defender_pos = self.defender_pos + Vector3(
                    fb.recoil_vector.x * 0.1, fb.recoil_vector.y * 0.1, 0.0
                )

        return feedbacks
