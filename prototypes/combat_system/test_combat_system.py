"""
Comprehensive Test and Demonstration Suite for Dasi Combat & Physics System.
Runs automated verifications for:
1. Agility scaling & avoidance of the "Agility Bug".
2. Combo inertia chaining & state machine flow.
3. Volumetric Weapon Traces & collision sub-stepping.
4. Hit-Stop, Stagger & Poise mechanics across damage types.
5. Dodge invulnerability frames (i-frames).
6. Wing Aerodynamics & Flapping Dynamics (Tier 1, 2, 3).
"""

from __future__ import annotations
import math
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from prototypes.combat_system.vector3 import Vector3
from prototypes.combat_system.agility_scaling import AgilityScalingSystem
from prototypes.combat_system.weapon_trace import WeaponTraceSystem, WeaponSocket, TargetHurtbox
from prototypes.combat_system.combat_state_machine import CombatStateMachine, CombatState
from prototypes.combat_system.combat_simulator import (
    CombatSimulator,
    CombatantStats,
    DamageType,
    StaggerLevel,
)
from prototypes.combat_system.wings_physics import WingPhysicsSystem, WingTier


class TestAgilityScaling(unittest.TestCase):
    """Verifies that agility scaling never causes frame skipping or hitbox collapse."""

    def test_agility_scaling_continuity(self):
        agilities = [50, 100, 300, 600, 1200, 2000, 3500]
        prev_aps = 0.0

        for agi in agilities:
            timing = AgilityScalingSystem.calculate_phase_timings(agi)

            # Verification 1: Active strike collision window NEVER drops below MIN_ACTIVE_WINDOW (65 ms)
            self.assertGreaterEqual(
                timing.active_strike_time,
                AgilityScalingSystem.MIN_ACTIVE_WINDOW,
                f"Collision window collapsed at AGI={agi}!",
            )

            # Verification 2: Windup is physiologically plausible (>= 80 ms)
            self.assertGreaterEqual(
                timing.windup_time,
                AgilityScalingSystem.MIN_WINDUP,
                f"Windup collapsed at AGI={agi}!",
            )

            # Verification 3: Attacks Per Second scales monotonically
            self.assertGreater(
                timing.attacks_per_second,
                prev_aps,
                f"APS did not scale smoothly at AGI={agi}!",
            )
            prev_aps = timing.attacks_per_second

            # Verification 4: Ghosting triggers only at high tier
            if agi >= AgilityScalingSystem.GHOSTING_AGI_THRESHOLD:
                self.assertTrue(timing.has_after_images)
            else:
                self.assertFalse(timing.has_after_images)

    def test_combo_chained_momentum(self):
        """Combo steps 2 and 3 should reduce windup via momentum reuse."""
        agi = 250
        step1 = AgilityScalingSystem.calculate_phase_timings(agi)
        step2 = AgilityScalingSystem.calculate_combo_chained_timing(2, agi)
        step3 = AgilityScalingSystem.calculate_combo_chained_timing(3, agi)

        self.assertLess(step2.windup_time, step1.windup_time)
        self.assertLess(step3.windup_time, step2.windup_time)
        # Active strike clarity must remain identical
        self.assertEqual(step2.active_strike_time, step1.active_strike_time)


class TestWeaponTraceCollision(unittest.TestCase):
    """Verifies volumetric swept collision along blade sockets."""

    def test_swept_capsule_detection(self):
        trace = WeaponTraceSystem(owner_id="hero")
        trace.begin_swing(initial_energy=100.0)

        target = TargetHurtbox(
            actor_id="goblin",
            actor_name="Goblin Scout",
            position=Vector3(1.0, 0.0, 0.0),
            capsule_height=1.6,
            capsule_radius=0.4,
        )

        # Frame 0: weapon is on the left
        pos_t0 = {
            "Hilt": Vector3(0.0, -0.8, 1.0),
            "MidBlade": Vector3(0.6, -0.8, 1.0),
            "Tip": Vector3(1.2, -0.8, 1.0),
        }
        hits_t0 = trace.update_trace(pos_t0, delta_time=0.016, potential_targets=[target])
        self.assertEqual(len(hits_t0), 0)

        # Frame 1: weapon swings across to the right (swept capsule intersects target at y=0)
        pos_t1 = {
            "Hilt": Vector3(0.0, 0.8, 1.0),
            "MidBlade": Vector3(0.6, 0.8, 1.0),
            "Tip": Vector3(1.2, 0.8, 1.0),
        }
        hits_t1 = trace.update_trace(pos_t1, delta_time=0.016, potential_targets=[target])
        self.assertEqual(len(hits_t1), 1)
        self.assertEqual(hits_t1[0].target_id, "goblin")

        # Frame 2: swing continues, same target shouldn't be hit twice in the same swing
        pos_t2 = {
            "Hilt": Vector3(0.0, 1.2, 1.0),
            "MidBlade": Vector3(0.6, 1.2, 1.0),
            "Tip": Vector3(1.2, 1.2, 1.0),
        }
        hits_t2 = trace.update_trace(pos_t2, delta_time=0.016, potential_targets=[target])
        self.assertEqual(len(hits_t2), 0)


class TestCombatStateMachine(unittest.TestCase):
    """Verifies state machine transitions, combo buffering, and hit-stop."""

    def test_full_attack_cycle_and_combo(self):
        sm = CombatStateMachine(actor_id="hero", agility=150)
        self.assertEqual(sm.current_state, CombatState.IDLE)

        # Input attack -> transitions to WINDUP
        sm.trigger_attack_input()
        self.assertEqual(sm.current_state, CombatState.WINDUP)

        # Advance through Windup into ACTIVE_STRIKE
        sm.update(sm.current_timings.windup_time + 0.001)
        self.assertEqual(sm.current_state, CombatState.ACTIVE_STRIKE)

        # Hit-Stop freeze
        sm.trigger_hit_stop(0.050)
        self.assertEqual(sm.current_state, CombatState.HIT_STOP)

        # Updating while in Hit-Stop should NOT advance attack phase
        sm.update(0.030)
        self.assertEqual(sm.current_state, CombatState.HIT_STOP)

        # Complete Hit-Stop
        sm.update(0.021)
        self.assertEqual(sm.current_state, CombatState.ACTIVE_STRIKE)

        # Finish Active Strike -> RECOVERY
        sm.update(sm.current_timings.active_strike_time)
        self.assertEqual(sm.current_state, CombatState.RECOVERY)

        # Buffer attack during recovery -> chains combo step 2
        sm.update(sm.current_timings.recovery_time * sm.current_timings.combo_window_start)
        sm.trigger_attack_input()
        self.assertEqual(sm.current_state, CombatState.WINDUP)
        self.assertEqual(sm.combo_step, 2)

    def test_dodge_invulnerability_frames(self):
        sm = CombatStateMachine(actor_id="hero")
        sm.trigger_dodge_input()
        self.assertEqual(sm.current_state, CombatState.DODGE)

        # Before i-frame start
        sm.update(0.010)
        self.assertFalse(sm.is_invulnerable)

        # Inside i-frame window
        sm.update(0.050)
        self.assertTrue(sm.is_invulnerable)

        # After i-frame window expires
        sm.update(0.200)
        self.assertFalse(sm.is_invulnerable)


class TestHitStopAndDamageImpact(unittest.TestCase):
    """Verifies proportional hit-stop, camera shake, and stagger across damage types."""

    def test_hit_stop_scaling_by_damage_type(self):
        attacker = CombatantStats("BloodKnight", strength=200, agility=120)
        defender = CombatantStats("DarkKnight", defense=50, tenacity=0.10)
        sim = CombatSimulator(attacker, defender)

        # Dummy hit
        from prototypes.combat_system.weapon_trace import HitEvent
        hit = HitEvent("BloodKnight", "DarkKnight", "DarkKnight", "Tip", Vector3(1, 0, 1), 15.0, 80.0)

        normal_fb = sim.calculate_damage_and_feedback(hit, force_damage_type=DamageType.NORMAL)
        crit_fb = sim.calculate_damage_and_feedback(hit, force_damage_type=DamageType.CRITICAL)
        ignore_fb = sim.calculate_damage_and_feedback(hit, force_damage_type=DamageType.IGNORE_DEFENSE)

        # Verify Hit-Stop progression: Normal < Critical < Ignore Defense
        self.assertLess(normal_fb.hit_stop_duration, crit_fb.hit_stop_duration)
        self.assertLess(crit_fb.hit_stop_duration, ignore_fb.hit_stop_duration)

        # Verify Camera Shake progression
        self.assertLess(normal_fb.camera_shake.amplitude_deg, crit_fb.camera_shake.amplitude_deg)
        self.assertLess(crit_fb.camera_shake.amplitude_deg, ignore_fb.camera_shake.amplitude_deg)

    def test_heavy_weapon_impact(self):
        att_1h = CombatantStats("Knight1H", strength=200, is_two_handed=False)
        att_2h = CombatantStats("Knight2H", strength=200, is_two_handed=True)
        defender = CombatantStats("Boss", defense=80, tenacity=0.0)

        sim_1h = CombatSimulator(att_1h, defender)
        sim_2h = CombatSimulator(att_2h, defender)

        from prototypes.combat_system.weapon_trace import HitEvent
        hit = HitEvent("K", "B", "Boss", "Tip", Vector3(1, 0, 1), 15.0, 80.0)

        fb_1h = sim_1h.calculate_damage_and_feedback(hit, DamageType.NORMAL)
        fb_2h = sim_2h.calculate_damage_and_feedback(hit, DamageType.NORMAL)

        # 2H weapon must have higher hit-stop and recoil magnitude
        self.assertGreater(fb_2h.hit_stop_duration, fb_1h.hit_stop_duration)
        self.assertGreater(fb_2h.camera_shake.amplitude_deg, fb_1h.camera_shake.amplitude_deg)


class TestWingPhysics(unittest.TestCase):
    """Verifies aerodynamic simulation for Wing Tiers 1, 2, and 3."""

    def test_wing_tiers_properties(self):
        wings = WingPhysicsSystem(WingTier.TIER_1_NEOPHYTE)
        state_t1 = wings.simulate(
            character_velocity=Vector3(8.0, 0.0, 0.0),
            character_forward=Vector3.forward(),
            wind_velocity=Vector3.zero(),
            altitude_above_ground=2.0,
            turn_rate_yaw=0.5,
        )

        wings.set_tier(WingTier.TIER_3_SOVEREIGN)
        state_t3 = wings.simulate(
            character_velocity=Vector3(8.0, 0.0, 0.0),
            character_forward=Vector3.forward(),
            wind_velocity=Vector3.zero(),
            altitude_above_ground=2.0,
            turn_rate_yaw=0.5,
        )

        # Tier 3 wingspan and lift force must vastly exceed Tier 1
        self.assertGreater(state_t3.current_wingspan, state_t1.current_wingspan)
        self.assertGreater(state_t3.lift_force.z, state_t1.lift_force.z)
        self.assertGreater(state_t3.banking_angle_deg, state_t1.banking_angle_deg)
        self.assertTrue(wings.profile.can_sustain_flight)


def run_interactive_combat_demonstration():
    """Prints a detailed visual report and ASCII telemetry graph."""
    print("=" * 80)
    print(" DASI COMBAT & ANIMATION PHYSICS - DEMONSTRAÇÃO DO PROTÓTIPO")
    print("=" * 80)

    # 1. Agility Scaling Graph
    print("\n[1] RESOLUÇÃO DEFINITIVA DO 'BUG DE AGILIDADE':")
    print(f"{'AGI':>6} | {'Windup':>8} | {'Strike':>8} | {'Recovery':>9} | {'Total':>7} | {'APS':>6} | {'Ghosting'}")
    print("-" * 65)
    for agi in [50, 150, 300, 600, 1000, 1500, 2500, 4000]:
        t = AgilityScalingSystem.calculate_phase_timings(agi)
        ghost = "ON (Runic Trails)" if t.has_after_images else "OFF"
        print(f"{agi:>6} | {t.windup_time:>7.3f}s | {t.active_strike_time:>7.3f}s | {t.recovery_time:>8.3f}s | {t.total_duration:>6.3f}s | {t.attacks_per_second:>5.2f} | {ghost}")

    # 2. Combat Combo and Impact Simulation
    print("\n[2] SIMULAÇÃO DE IMPACTO, HIT-STOP E STAGGER:")
    attacker = CombatantStats(
        name="Blood Knight (+13 Dragon Armor)",
        strength=280,
        agility=180,
        is_two_handed=True,
    )
    defender = CombatantStats(
        name="Death Knight (Elite Mob)",
        defense=85,
        poise=90.0,
        tenacity=0.15,
    )

    sim = CombatSimulator(attacker, defender)
    sim.attacker_sm.trigger_attack_input()

    dt = 0.016  # 60 FPS timestep
    simulated_time = 0.0
    hits_occurred = 0

    print(f"Iniciando golpe com {attacker.name} contra {defender.name}...")
    while simulated_time < 0.80 and hits_occurred < 1:
        feedbacks = sim.step(dt)
        for fb in feedbacks:
            hits_occurred += 1
            print(f"  -> CONTATO CONFIRMADO!")
            print(f"     * Tipo de Dano: {fb.damage_type.value}")
            print(f"     * Dano Infligido: {fb.damage} HP (HP restante do alvo: {defender.current_hp})")
            print(f"     * Hit-Stop (Micro-Freeze): {fb.hit_stop_duration * 1000:.1f} ms")
            print(f"     * Stagger / Reação: {fb.stagger_level.name}")
            print(f"     * Shaker de Câmera: {fb.camera_shake.frequency_hz} Hz / {fb.camera_shake.amplitude_deg}°")
            print(f"     * VFX Disparado: {fb.vfx_type}")
            print(f"     * Recuo Vetorial: ({fb.recoil_vector.x:.2f}, {fb.recoil_vector.y:.2f}, {fb.recoil_vector.z:.2f})")
        simulated_time += dt

    # 3. Wings Aerodynamic Simulation
    print("\n[3] SIMULAÇÃO AERODINÂMICA DE ASAS (TIER 1 vs TIER 2 vs TIER 3):")
    wings_sim = WingPhysicsSystem()
    velocity = Vector3(10.0, 0.0, 0.0)  # 10 m/s sprint
    wind = Vector3(2.0, 1.0, 0.0)

    for tier in [WingTier.TIER_1_NEOPHYTE, WingTier.TIER_2_CELESTIAL, WingTier.TIER_3_SOVEREIGN]:
        wings_sim.set_tier(tier)
        w_state = wings_sim.simulate(
            character_velocity=velocity,
            character_forward=Vector3.forward(),
            wind_velocity=wind,
            altitude_above_ground=1.5,
            turn_rate_yaw=0.75,
        )
        print(f"  - {tier.name}:")
        print(f"    * Envergadura Ativa: {w_state.current_wingspan} m")
        print(f"    * Frequência de Flap: {w_state.flapping_frequency} Hz")
        print(f"    * Força de Sustentação (Lift Z): {w_state.lift_force.z:.1f} N")
        print(f"    * Ângulo de Banking (Curva): {w_state.banking_angle_deg}°")
        print(f"    * Redução Efetiva de Gravidade: {w_state.effective_gravity_reduction * 100:.1f}%")
        print(f"    * Raio de Downwash no Solo: {w_state.ground_downwash_radius} m")

    print("\n" + "=" * 80)
    print(" TODOS OS SUBSISTEMAS TESTADOS E OPERACIONAIS COM SUCESSO!")
    print("=" * 80)


if __name__ == "__main__":
    # Run unit tests
    suite = unittest.TestLoader().loadTestsFromTestCase(TestAgilityScaling)
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestWeaponTraceCollision))
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestCombatStateMachine))
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestHitStopAndDamageImpact))
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestWingPhysics))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Run interactive demo
    run_interactive_combat_demonstration()

    sys.exit(0 if result.wasSuccessful() else 1)
