"""
Combat State Machine for Dasi.
Manages combat states: IDLE, WINDUP, ACTIVE_STRIKE, HIT_STOP, RECOVERY, DODGE.
Supports invulnerability frames (i-frames), combo buffering, and hit-stop clock pausing.
"""

from __future__ import annotations
from enum import Enum, auto
from dataclasses import dataclass
from typing import Optional, Callable
from .agility_scaling import AgilityScalingSystem, AttackPhaseTiming


class CombatState(Enum):
    IDLE = auto()
    WINDUP = auto()
    ACTIVE_STRIKE = auto()
    HIT_STOP = auto()
    RECOVERY = auto()
    DODGE = auto()


@dataclass
class DodgeConfig:
    duration: float = 0.450        # Total dodge roll duration
    iframe_start: float = 0.020    # Invulnerability begins immediately
    iframe_duration: float = 0.220 # 220 ms of pure i-frames
    stamina_cost: float = 20.0


class CombatStateMachine:
    """
    Finite State Machine driving character combat actions.
    Integrates non-linear timings, hit-stop dilation, and dodge i-frames.
    """

    def __init__(self, actor_id: str, agility: int = 100, weapon_speed_mod: float = 1.0):
        self.actor_id = actor_id
        self.agility = agility
        self.weapon_speed_mod = weapon_speed_mod

        self.current_state: CombatState = CombatState.IDLE
        self.previous_state: CombatState = CombatState.IDLE
        self.state_time: float = 0.0

        # Combo tracking
        self.combo_step: int = 1
        self.max_combo_steps: int = 3
        self.has_buffered_attack: bool = False
        self.current_timings: AttackPhaseTiming = AgilityScalingSystem.calculate_phase_timings(
            agility, weapon_speed_mod
        )

        # Hit-Stop tracking
        self.hit_stop_remaining: float = 0.0
        self.state_before_hit_stop: CombatState = CombatState.ACTIVE_STRIKE

        # Dodge tracking
        self.dodge_config = DodgeConfig()
        self.is_invulnerable: bool = False

        # Callbacks
        self.on_state_enter: Optional[Callable[[CombatState, CombatState], None]] = None
        self.on_strike_start: Optional[Callable[[int], None]] = None
        self.on_strike_end: Optional[Callable[[int], None]] = None

    def change_state(self, new_state: CombatState) -> None:
        if self.current_state == new_state:
            return

        old_state = self.current_state
        self.previous_state = old_state
        self.current_state = new_state
        self.state_time = 0.0

        # Handle i-frames on exit
        if old_state == CombatState.DODGE and new_state != CombatState.DODGE:
            self.is_invulnerable = False

        # State entry triggers
        if new_state == CombatState.WINDUP:
            if self.combo_step == 1:
                self.current_timings = AgilityScalingSystem.calculate_phase_timings(
                    self.agility, self.weapon_speed_mod
                )
            else:
                self.current_timings = AgilityScalingSystem.calculate_combo_chained_timing(
                    self.combo_step, self.agility, self.weapon_speed_mod
                )
            self.has_buffered_attack = False

        elif new_state == CombatState.ACTIVE_STRIKE:
            if self.on_strike_start:
                self.on_strike_start(self.combo_step)

        elif new_state == CombatState.RECOVERY:
            if self.on_strike_end:
                self.on_strike_end(self.combo_step)

        elif new_state == CombatState.IDLE:
            self.combo_step = 1
            self.has_buffered_attack = False

        if self.on_state_enter:
            self.on_state_enter(old_state, new_state)

    def trigger_attack_input(self) -> bool:
        """User presses attack button."""
        if self.current_state == CombatState.IDLE:
            self.combo_step = 1
            self.change_state(CombatState.WINDUP)
            return True

        # If in recovery and past combo cancel threshold, advance combo immediately!
        if self.current_state == CombatState.RECOVERY:
            progress = self.state_time / max(1e-4, self.current_timings.recovery_time)
            if progress >= self.current_timings.combo_window_start:
                self.advance_combo()
                return True
            else:
                # Buffer attack for when threshold is reached
                self.has_buffered_attack = True
                return True

        # If in windup or active strike, buffer the next attack
        if self.current_state in (CombatState.WINDUP, CombatState.ACTIVE_STRIKE, CombatState.HIT_STOP):
            self.has_buffered_attack = True
            return True

        return False

    def trigger_dodge_input(self) -> bool:
        """User triggers active dodge roll."""
        # Dodge can cancel IDLE, RECOVERY, and WINDUP (defensive priority)
        if self.current_state in (CombatState.IDLE, CombatState.RECOVERY, CombatState.WINDUP):
            self.change_state(CombatState.DODGE)
            return True
        return False

    def trigger_hit_stop(self, duration: float) -> None:
        """Freezes character local time dilation upon hitting a target."""
        if duration <= 0.0:
            return
        self.hit_stop_remaining = duration
        if self.current_state != CombatState.HIT_STOP:
            self.state_before_hit_stop = self.current_state
            self.change_state(CombatState.HIT_STOP)

    def advance_combo(self) -> None:
        """Chains to next attack in combo sequence."""
        self.combo_step = (self.combo_step % self.max_combo_steps) + 1
        self.change_state(CombatState.WINDUP)

    def update(self, delta_time: float) -> None:
        """Advances combat state machine by delta_time."""
        if delta_time <= 0.0:
            return

        # Handle Hit-Stop freeze
        if self.current_state == CombatState.HIT_STOP:
            self.hit_stop_remaining -= delta_time
            if self.hit_stop_remaining <= 0.0:
                self.hit_stop_remaining = 0.0
                # Resume the interrupted strike phase
                self.change_state(self.state_before_hit_stop)
            return

        self.state_time += delta_time

        # Update specific states
        if self.current_state == CombatState.WINDUP:
            if self.state_time >= self.current_timings.windup_time:
                self.change_state(CombatState.ACTIVE_STRIKE)

        elif self.current_state == CombatState.ACTIVE_STRIKE:
            if self.state_time >= self.current_timings.active_strike_time:
                self.change_state(CombatState.RECOVERY)

        elif self.current_state == CombatState.RECOVERY:
            rec_progress = self.state_time / max(1e-4, self.current_timings.recovery_time)

            # Check buffered attack combo chaining
            if self.has_buffered_attack and rec_progress >= self.current_timings.combo_window_start:
                self.advance_combo()
                return

            if self.state_time >= self.current_timings.recovery_time:
                self.change_state(CombatState.IDLE)

        elif self.current_state == CombatState.DODGE:
            # i-frame window check
            iframe_end = self.dodge_config.iframe_start + self.dodge_config.iframe_duration
            self.is_invulnerable = (
                self.dodge_config.iframe_start <= self.state_time <= iframe_end
            )

            if self.state_time >= self.dodge_config.duration:
                self.change_state(CombatState.IDLE)
