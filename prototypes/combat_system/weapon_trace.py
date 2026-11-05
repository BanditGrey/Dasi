"""
Volumetric Weapon Trace Collision System for Dasi.
Simulates continuous swept capsules along weapon blade sockets across animation sub-steps.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Set, Optional, Dict, Any
from .vector3 import Vector3, distance_segment_to_segment, distance_point_to_segment


@dataclass
class WeaponSocket:
    name: str
    relative_offset: Vector3   # Offset along weapon longitudinal axis (e.g., 0.0=hilt, 0.75=mid, 1.5=tip)
    radius: float = 0.15       # Radius of collision capsule around this blade section


@dataclass
class TraceSubstepPoint:
    socket_name: str
    world_pos: Vector3
    radius: float


@dataclass
class TargetHurtbox:
    actor_id: str
    actor_name: str
    position: Vector3
    capsule_height: float = 1.8
    capsule_radius: float = 0.45
    poise: float = 100.0
    armor_density: float = 20.0  # Resistance to blade penetration

    def get_capsule_segment(self) -> tuple[Vector3, Vector3]:
        """Returns the inner line segment of the vertical cylinder capsule."""
        # Assuming position is at the character feet/ground contact
        bottom = self.position + Vector3(0.0, 0.0, self.capsule_radius)
        top = self.position + Vector3(0.0, 0.0, max(self.capsule_radius, self.capsule_height - self.capsule_radius))
        return bottom, top


@dataclass
class HitEvent:
    attacker_id: str
    target_id: str
    target_name: str
    hit_socket: str
    hit_location: Vector3
    impact_velocity: float
    cleave_energy_remaining: float
    is_deflected: bool = False


class WeaponTraceSystem:
    """
    Manages continuous 3D swept collision for weapons during Active Strike windows.
    Eliminates tunneling effects and ghost swings through sub-step interpolation.
    """

    def __init__(self, owner_id: str, sockets: Optional[List[WeaponSocket]] = None):
        self.owner_id = owner_id
        self.sockets: List[WeaponSocket] = sockets or [
            WeaponSocket("Hilt", Vector3(0.0, 0.0, 0.1), radius=0.12),
            WeaponSocket("MidBlade", Vector3(0.0, 0.0, 0.8), radius=0.16),
            WeaponSocket("Tip", Vector3(0.0, 0.0, 1.6), radius=0.20),
        ]
        self.previous_socket_positions: Dict[str, Vector3] = {}
        self.hit_actors_this_swing: Set[str] = set()
        self.is_tracing_active: bool = False
        self.current_swing_energy: float = 100.0

    def begin_swing(self, initial_energy: float = 100.0) -> None:
        """Called when animation enters the ACTIVE_STRIKE window."""
        self.is_tracing_active = True
        self.hit_actors_this_swing.clear()
        self.previous_socket_positions.clear()
        self.current_swing_energy = initial_energy

    def end_swing(self) -> None:
        """Called when exiting ACTIVE_STRIKE or interrupted."""
        self.is_tracing_active = False
        self.hit_actors_this_swing.clear()
        self.previous_socket_positions.clear()

    def update_trace(
        self,
        current_socket_world_positions: Dict[str, Vector3],
        delta_time: float,
        potential_targets: List[TargetHurtbox],
    ) -> List[HitEvent]:
        """
        Executes swept capsule tests between previous and current socket positions.
        Returns a list of valid HitEvents detected in this frame.
        """
        if not self.is_tracing_active or delta_time <= 0.0:
            self.previous_socket_positions = current_socket_world_positions.copy()
            return []

        hits: List[HitEvent] = []

        # If we have no previous positions (first frame of swing), initialize and return
        if not self.previous_socket_positions:
            self.previous_socket_positions = current_socket_world_positions.copy()
            return []

        # Check sub-step swept capsules for each socket
        for sock in self.sockets:
            s_name = sock.name
            if s_name not in current_socket_world_positions or s_name not in self.previous_socket_positions:
                continue

            prev_pos = self.previous_socket_positions[s_name]
            curr_pos = current_socket_world_positions[s_name]
            displacement = curr_pos - prev_pos
            velocity = displacement.length() / delta_time

            # Test swept capsule against all potential targets
            for target in potential_targets:
                if target.actor_id == self.owner_id:
                    continue
                if target.actor_id in self.hit_actors_this_swing:
                    continue  # Already hit during this swing

                t_bottom, t_top = target.get_capsule_segment()

                # Shortest distance between the swept weapon segment and the target vertical capsule segment
                dist = distance_segment_to_segment(prev_pos, curr_pos, t_bottom, t_top)
                combined_radius = sock.radius + target.capsule_radius

                if dist <= combined_radius:
                    # Register impact
                    self.hit_actors_this_swing.add(target.actor_id)
                    hit_location = curr_pos.lerp(target.position, 0.5)

                    # Check blade penetration and deflection
                    armor_cost = target.armor_density * 1.5
                    deflected = False
                    if self.current_swing_energy <= armor_cost:
                        deflected = True
                        self.current_swing_energy = 0.0
                    else:
                        self.current_swing_energy -= armor_cost

                    hit_event = HitEvent(
                        attacker_id=self.owner_id,
                        target_id=target.actor_id,
                        target_name=target.actor_name,
                        hit_socket=s_name,
                        hit_location=hit_location,
                        impact_velocity=velocity,
                        cleave_energy_remaining=self.current_swing_energy,
                        is_deflected=deflected,
                    )
                    hits.append(hit_event)

                    if deflected:
                        # Weapon bounced off a heavy armor/shield; stop further cleave
                        self.is_tracing_active = False
                        break

        self.previous_socket_positions = current_socket_world_positions.copy()
        return hits
