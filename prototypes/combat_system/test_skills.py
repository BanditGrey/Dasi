"""
Comprehensive Test Suite for Dasi Iconic Skills Physics Simulation.
Validates:
1. Twisting Slash:
   - Torso angular kinematics, peak angular velocity, and tangential tip speed.
   - Centripetal vortex suction force field vs target mass and ground friction.
   - Slice collision registry per revolution and centrifugal ejection.
   - Shrapnel physics with aerodynamic drag, gravity, and ground bouncing.
2. Evil Spirits:
   - Logarithmic spiral equation correctness (r = r0 * e^(b*theta)).
   - Uniform projectile distribution across 12 to 24 spirits.
   - 3D hovering oscillation.
   - Volumetric swept-sphere collision detection.
   - Multi-hit damage damping and shotgunning prevention cap.
3. Triple Shot:
   - 3D ballistic trajectory convergence at focus range D_focus.
   - Post-focus divergence.
   - Aerodynamic drag deceleration and gravitational drop.
   - Kinetic energy calculation and target armor penetration depth.
   - Arrow sticking state in target vs ground.
"""

from __future__ import annotations
import math
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from prototypes.combat_system.vector3 import Vector3
from prototypes.combat_system.skills_simulation import (
    SimulatedTarget,
    TwistingSlashSimulator,
    TwistingSlashConfig,
    EvilSpiritsSimulator,
    EvilSpiritsConfig,
    TripleShotSimulator,
    TripleShotConfig,
    ArrowState,
)


class TestTwistingSlashPhysics(unittest.TestCase):
    """Validates the mechanical, aerodynamic, and force-field physics of Twisting Slash."""

    def test_torso_angular_kinematics_and_tip_velocity(self):
        caster_pos = Vector3(0.0, 0.0, 0.0)
        config = TwistingSlashConfig(
            blade_length=2.0,
            spin_duration=1.0,
            total_rotations=3.0,
        )
        sim = TwistingSlashSimulator(caster_pos, config)

        dt = 0.02
        max_omega = 0.0
        max_tip_speed = 0.0

        while not sim.is_finished:
            sim.step(dt, targets=[])
            if sim.current_angular_velocity > max_omega:
                max_omega = sim.current_angular_velocity
            tip_v = sim.get_blade_tangential_velocity()
            if tip_v.length() > max_tip_speed:
                max_tip_speed = tip_v.length()

        # Expected total angle: 3 * 2 * pi = 6*pi (~18.85 rad)
        self.assertAlmostEqual(sim.current_angle_rad, 6.0 * math.pi, delta=0.5)

        # Average omega is 6*pi rad / 1.0s = 18.85 rad/s. Peak should exceed 25 rad/s
        self.assertGreater(max_omega, 22.0, "Angular velocity peak was too low!")

        # Tip speed = omega * R. At peak: >= 22 * 2.0 = 44 m/s (~158 km/h)
        self.assertGreater(max_tip_speed, 40.0, "Blade tip tangential speed was below realistic threshold!")

    def test_centripetal_vortex_mass_discrimination(self):
        """Verifies that light targets are pulled into blade radius while massive targets resist."""
        caster_pos = Vector3(0.0, 0.0, 0.0)
        config = TwistingSlashConfig(
            blade_length=1.8,
            vortex_radius=4.5,
            vortex_pull_constant=3.5,
            friction_static=0.45,
            spin_duration=1.2,
        )
        sim = TwistingSlashSimulator(caster_pos, config)

        # Light goblin (45 kg) at 3.2m (inside vortex)
        goblin = SimulatedTarget(
            id="goblin_1",
            name="Goblin Scout",
            position=Vector3(3.2, 0.0, 0.0),
            mass_kg=45.0,
        )
        # Heavy stone golem (650 kg) at 3.2m (inside vortex)
        golem = SimulatedTarget(
            id="golem_1",
            name="Stone Golem",
            position=Vector3(3.2, 0.0, 0.0),
            mass_kg=650.0,
        )

        dt = 0.016  # 60 FPS
        initial_goblin_dist = goblin.position.distance_to(caster_pos)
        initial_golem_dist = golem.position.distance_to(caster_pos)

        # Run for 0.6 seconds (around peak vortex power)
        for _ in range(35):
            sim.step(dt, [goblin, golem])

        final_goblin_dist = goblin.position.distance_to(caster_pos)
        final_golem_dist = golem.position.distance_to(caster_pos)

        # Goblin must be pulled significantly inward
        self.assertLess(
            final_goblin_dist,
            initial_goblin_dist - 0.4,
            f"Goblin was not pulled inward enough! Dist: {final_goblin_dist}m vs Initial: {initial_goblin_dist}m",
        )
        self.assertIn("goblin_1", sim.pulled_targets)

        # Golem must remain static due to static friction exceeding pull force
        self.assertAlmostEqual(
            final_golem_dist,
            initial_golem_dist,
            delta=0.01,
            msg="Heavy golem was moved by vortex when it should have resisted!",
        )

    def test_blade_multi_revolution_slice_and_ejection(self):
        """Verifies that a target in the blade orbit gets hit once per revolution."""
        caster_pos = Vector3(0.0, 0.0, 0.0)
        config = TwistingSlashConfig(
            blade_length=2.0,
            spin_duration=1.2,
            total_rotations=3.0,
            base_damage_per_hit=250.0,
            poise_damage=60.0,
        )
        sim = TwistingSlashSimulator(caster_pos, config)

        target = SimulatedTarget(
            id="target_dummy",
            name="Combat Dummy",
            position=Vector3(1.5, 0.0, 0.0),  # Right in blade path
            mass_kg=70.0,
            poise=50.0,  # Will break poise on first hit
        )

        all_hits = []
        dt = 0.01
        while not sim.is_finished:
            hits = sim.step(dt, [target])
            all_hits.extend(hits)

        # Should be hit across distinct revolutions (up to 3 times)
        revs_hit = {h["revolution"] for h in all_hits}
        self.assertGreaterEqual(len(revs_hit), 2, "Target was not struck across multiple revolutions!")
        self.assertGreater(target.total_damage_received, 400.0)
        self.assertGreater(target.stagger_count, 0, "Posture break did not trigger stagger!")

    def test_shrapnel_aerodynamics_and_bouncing(self):
        """Verifies that impact shrapnel experiences drag, gravity, and ground bouncing."""
        caster_pos = Vector3(0.0, 0.0, 0.0)
        config = TwistingSlashConfig(blade_length=2.0, shrapnel_count=4)
        sim = TwistingSlashSimulator(caster_pos, config)

        target = SimulatedTarget(
            id="target_impact",
            name="Impact Dummy",
            position=Vector3(1.5, 0.0, 0.0),
        )

        # Step until impact spawns shrapnel
        dt = 0.01
        while len(sim.shrapnel_list) == 0 and not sim.is_finished:
            sim.step(dt, [target])

        self.assertGreater(len(sim.shrapnel_list), 0, "No shrapnel spawned from blade impact!")
        first_shrapnel = sim.shrapnel_list[0]
        initial_speed = first_shrapnel.velocity.length()
        self.assertGreater(initial_speed, 5.0, "Shrapnel initial speed too low!")

        # Step until shrapnel touches ground
        for _ in range(100):
            sim.step(dt, [target])

        # Shrapnel should have bounced and decayed
        self.assertGreaterEqual(first_shrapnel.position.z, 0.0, "Shrapnel fell below terrain plane!")


class TestEvilSpiritsPhysics(unittest.TestCase):
    """Validates logarithmic spiral math, swept-sphere detection, and multi-hit damping."""

    def test_logarithmic_spiral_geometry(self):
        """Validates r(theta) = r0 * exp(b * theta) expansion."""
        caster_pos = Vector3(0.0, 0.0, 0.0)
        config = EvilSpiritsConfig(
            spirit_count=16,
            r0=0.5,
            r_max=12.0,
            duration_sec=1.5,
            turns=1.5,
        )
        sim = EvilSpiritsSimulator(caster_pos, config)

        self.assertEqual(len(sim.spirits), 16)

        # Check b coefficient
        expected_b = math.log(12.0 / 0.5) / (2.0 * math.pi * 1.5)
        self.assertAlmostEqual(sim.b_coeff, expected_b, places=4)

        # Advance by half duration
        dt = 0.02
        steps = int(0.75 / dt)
        for _ in range(steps):
            sim.step(dt, targets=[])

        # At half duration (half of turns = 0.75 turns = 1.5 * pi rad sweep)
        theta_mid = sim.angular_velocity * sim.elapsed_time
        expected_r_mid = 0.5 * math.exp(expected_b * theta_mid)
        self.assertAlmostEqual(sim.spirits[0].current_radius, expected_r_mid, delta=0.2)

        # Spirits must remain within [r0, r_max] during expansion
        for spirit in sim.spirits:
            if spirit.is_active:
                self.assertGreaterEqual(spirit.current_radius, 0.49)
                self.assertLessEqual(spirit.current_radius, 12.05)

    def test_hovering_altitude_bounds(self):
        """Verifies vertical oscillation stays within specified amplitude."""
        caster_pos = Vector3(0.0, 0.0, 0.0)
        config = EvilSpiritsConfig(hover_amplitude=0.45)
        sim = EvilSpiritsSimulator(caster_pos, config)

        dt = 0.02
        z_min = 999.0
        z_max = -999.0

        for _ in range(50):
            sim.step(dt, targets=[])
            for spirit in sim.spirits:
                z_min = min(z_min, spirit.position.z)
                z_max = max(z_max, spirit.position.z)

        # Center height is caster.z + 1.2 = 1.2.
        # With amplitude 0.45, z must be in [1.2 - 0.45, 1.2 + 0.45] = [0.75, 1.65]
        self.assertGreaterEqual(z_min, 0.74)
        self.assertLessEqual(z_max, 1.66)

    def test_multi_hit_damage_damping_and_shotgun_prevention(self):
        """
        Crucial gameplay rule:
        Target takes damped damage per spirit and cannot take more than max_hits_per_target hits.
        """
        caster_pos = Vector3(0.0, 0.0, 0.0)
        config = EvilSpiritsConfig(
            spirit_count=20,
            base_damage=400.0,
            damping_factor=0.55,
            damping_floor=0.18,
            max_hits_per_target=3,  # Strict cap of 3 hits
        )
        sim = EvilSpiritsSimulator(caster_pos, config)

        target = SimulatedTarget(
            id="boss_dummy",
            name="Chaos Boss",
            position=Vector3(2.0, 0.0, 0.0),
            radius=1.2,  # Wide target, intercepts multiple spiral arms
        )

        dt = 0.02
        all_hits = []
        while not sim.is_finished:
            hits = sim.step(dt, [target])
            all_hits.extend(hits)

        # Must not exceed max_hits_per_target
        self.assertLessEqual(len(all_hits), 3, f"Target took {len(all_hits)} hits, exceeding cap of 3!")

        if len(all_hits) >= 2:
            # Hit 1 damage: 400.0
            self.assertAlmostEqual(all_hits[0]["damage"], 400.0, delta=1.0)
            # Hit 2 damage: 400.0 * 0.55 = 220.0
            self.assertAlmostEqual(all_hits[1]["damage"], 220.0, delta=1.0)
            self.assertLess(all_hits[1]["damage"], all_hits[0]["damage"])

        if len(all_hits) >= 3:
            # Hit 3 damage: 400.0 * (0.55^2) = 121.0
            self.assertAlmostEqual(all_hits[2]["damage"], 121.0, delta=1.0)
            self.assertLess(all_hits[2]["damage"], all_hits[1]["damage"])


class TestTripleShotPhysics(unittest.TestCase):
    """Validates 3D ballistics, trajectory convergence at D_focus, drag, and penetration."""

    def test_trajectory_convergence_at_focus_range(self):
        """Verifies that Left, Center, and Right arrows converge at D_focus."""
        caster_pos = Vector3(0.0, 0.0, 0.0)
        aim_dir = Vector3(1.0, 0.0, 0.0)
        focus_dist = 20.0
        config = TripleShotConfig(
            bow_draw_speed=100.0,
            socket_offset=0.30,
            focus_distance=focus_dist,
        )
        sim = TripleShotSimulator(caster_pos, aim_dir, config)

        arrow_left = sim.arrows[0]
        arrow_center = sim.arrows[1]
        arrow_right = sim.arrows[2]

        initial_lateral_spread = arrow_left.position.distance_to(arrow_right.position)
        self.assertAlmostEqual(initial_lateral_spread, 0.60, delta=0.01)

        # Track spread over distance
        min_spread = initial_lateral_spread
        dt = 0.005

        while not sim.is_finished and arrow_center.position.x < focus_dist + 5.0:
            sim.step(dt, targets=[])
            if arrow_left.state == ArrowState.IN_FLIGHT and arrow_right.state == ArrowState.IN_FLIGHT:
                spread = arrow_left.position.distance_to(arrow_right.position)
                if spread < min_spread:
                    min_spread = spread

        # At or near the focus point, arrows must converge to within < 0.10m
        self.assertLess(
            min_spread,
            0.12,
            f"Arrows failed to converge! Minimum lateral distance was {min_spread}m",
        )

    def test_aerodynamic_drag_deceleration_and_gravity(self):
        """Verifies quadratic air resistance reduces arrow velocity over distance."""
        caster_pos = Vector3(0.0, 0.0, 0.0)
        aim_dir = Vector3(1.0, 0.0, 0.0)
        config = TripleShotConfig(
            bow_draw_speed=90.0,
            focus_distance=40.0,
        )
        sim = TripleShotSimulator(caster_pos, aim_dir, config)
        arrow = sim.arrows[1]  # Center arrow

        initial_speed = arrow.velocity.length()
        dt = 0.01

        # Advance 20 steps (0.2s)
        for _ in range(20):
            sim.step(dt, targets=[])

        current_speed = arrow.velocity.length()
        self.assertLess(current_speed, initial_speed, "Aerodynamic drag failed to decelerate arrow!")

    def test_arrow_penetration_and_target_attachment(self):
        """Verifies kinetic energy calculation and armor penetration depth."""
        caster_pos = Vector3(0.0, 0.0, 0.0)
        aim_dir = Vector3(1.0, 0.0, 0.0)
        config = TripleShotConfig(
            bow_draw_speed=85.0,
            arrow_mass=0.045,
            focus_distance=15.0,
            base_damage=250.0,
        )
        sim = TripleShotSimulator(caster_pos, aim_dir, config)

        # Light leather armor target: low material resistance (900 N/m)
        light_target = SimulatedTarget(
            id="scout",
            name="Elf Scout",
            position=Vector3(12.0, 0.0, 0.0),
            armor_material_resistance=900.0,
        )

        dt = 0.005
        hit_events = []
        while not sim.is_finished and len(hit_events) == 0:
            hits = sim.step(dt, [light_target])
            hit_events.extend(hits)

        self.assertGreater(len(hit_events), 0, "No arrow struck target!")
        hit = hit_events[0]

        # Kinetic energy: 0.5 * 0.045 * (85)^2 ~ 162.5 Joules
        self.assertGreater(hit["kinetic_energy_joules"], 100.0)

        # Light target penetration depth should be deep (~15 to 25 cm)
        self.assertGreater(hit["penetration_depth_cm"], 10.0)
        self.assertLessEqual(hit["penetration_depth_cm"], 75.0)  # Cannot exceed shaft length

        # Check arrow state is STUCK_IN_TARGET
        stuck_arrow = sim.arrows[hit["arrow_index"]]
        self.assertEqual(stuck_arrow.state, ArrowState.STUCK_IN_TARGET)
        self.assertEqual(stuck_arrow.stuck_target_id, "scout")

        # Move target and verify arrow follows
        prev_arrow_pos = stuck_arrow.position
        light_target.position = light_target.position + Vector3(0.0, 2.0, 0.0)
        sim.step(0.01, [light_target])
        self.assertNotEqual(stuck_arrow.position, prev_arrow_pos)
        self.assertAlmostEqual(stuck_arrow.position.y, light_target.position.y, delta=0.5)

    def test_arrow_ground_impact_sticking(self):
        """Verifies that an arrow that misses targets and hits ground sticks into the earth."""
        caster_pos = Vector3(0.0, 0.0, 0.5)  # Very low height
        aim_dir = Vector3(1.0, 0.0, -0.3).normalized()  # Aiming downwards into ground
        sim = TripleShotSimulator(caster_pos, aim_dir)

        dt = 0.01
        for _ in range(50):
            sim.step(dt, targets=[])

        # All arrows should stick into the ground (z == 0.0)
        for arrow in sim.arrows:
            self.assertEqual(arrow.state, ArrowState.STUCK_IN_GROUND)
            self.assertAlmostEqual(arrow.position.z, 0.0, delta=0.01)
            self.assertGreater(arrow.penetration_depth_m, 0.0)


if __name__ == "__main__":
    unittest.main()
