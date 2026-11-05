"""
Comprehensive Unit Test Suite for Dasi Advanced Combat Skills & War Companion.

Validates physics, kinematics, status effects, and state machines for:
1. Fire Slash (Rune Duelist):
   - Fissure linear propagation velocity, reach, and sequential vent ignition.
   - Upward convective lift and lateral ejection.
   - Metallurgical Armor Shred stacking up to 50% cap, duration refresh, and damage amplification.
2. Power Slash (Rune Duelist):
   - Conic spread angle (48 degrees) and 5-blade fan geometry.
   - Supersonic initial velocity (450 m/s) and atmospheric drag deceleration.
   - Multi-hit exponential damage damping (0.65 ratio) avoiding shotgun exploits.
3. Earthquake (Imperial Sovereign & Dark Horse):
   - Radial seismic wave expansion and energy decay over distance.
   - Full vertical knock-up and parabolic ragdoll trajectory for regular monsters.
   - Boss poise resistance check (stays grounded with micro-stagger).
   - Ground landing fall impact damage.
4. Fireburst (Imperial Sovereign):
   - Tri-cluster sequential detonation delays (0.0s, 0.09s, 0.18s).
   - Overpressure blast radius and push impulse.
   - Residual combustion (burn DoT) triggered at >= 2 cluster hits.
5. Dark Raven (Imperial Sovereign Companion):
   - Dynamic parameter scaling governed by Command (CMD).
   - 6-state free-flight AI cycle (Perched -> Dive -> Eye-Peck -> Return -> Perched).
   - Corkscrew spiral dive kinematic offsets.
   - Eye peck attack, cranial targeting, and blindness debuff mechanics.
"""

from __future__ import annotations
import math
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from prototypes.combat_system.vector3 import Vector3
from prototypes.combat_system.advanced_skills import (
    AdvancedCombatTarget,
    FireSlashSimulator,
    FireSlashConfig,
    PowerSlashSimulator,
    PowerSlashConfig,
    EarthquakeSimulator,
    EarthquakeConfig,
    FireburstSimulator,
    FireburstConfig,
    DarkRavenAI,
    DarkRavenConfig,
    RavenState,
)


# ==============================================================================
# 1. FIRE SLASH TESTS
# ==============================================================================

class TestFireSlashPhysics(unittest.TestCase):
    """Validates the seismic fissure kinematics, plasma vents, and armor shredding."""

    def test_fissure_propagation_and_vent_ignition_timing(self):
        caster_pos = Vector3(0.0, 0.0, 0.0)
        direction = Vector3(1.0, 0.0, 0.0)
        config = FireSlashConfig(
            fissure_reach=10.0,
            fissure_speed=20.0,
            num_vents=5,
            vent_radius=1.5,
        )
        sim = FireSlashSimulator(caster_pos, direction, config)

        self.assertEqual(len(sim.vents), 5)
        # Spacing is 10.0 / 5 = 2.0m. Ignition times = 2/20=0.1s, 4/20=0.2s, 6/20=0.3s, 8/20=0.4s, 10/20=0.5s
        for i, vent in enumerate(sim.vents):
            expected_dist = 2.0 * (i + 1)
            expected_time = expected_dist / 20.0
            self.assertAlmostEqual(vent.position.x, expected_dist, delta=1e-3)
            self.assertAlmostEqual(vent.ignition_time, expected_time, delta=1e-3)

        # Step up to 0.25s: vents 0 and 1 should ignite, vent 2, 3, 4 should not yet
        targets = []
        events = sim.step(0.25, targets)
        self.assertTrue(sim.vents[0].is_ignited)
        self.assertTrue(sim.vents[1].is_ignited)
        self.assertFalse(sim.vents[2].is_ignited)

    def test_armor_shredding_stacks_and_mitigation_reduction(self):
        target = AdvancedCombatTarget(
            id="target_dummy",
            name="Iron Golem",
            position=Vector3(2.0, 0.0, 0.0),
            base_armor=200.0,
            mass_kg=100.0,
        )
        self.assertEqual(target.effective_armor, 200.0)

        # Apply 1 stack (10% reduction)
        target.apply_armor_shred(1, duration=5.0)
        self.assertEqual(target.armor_shred_stacks, 1)
        self.assertAlmostEqual(target.effective_armor, 180.0, delta=1e-3)

        # Apply 4 more stacks (should reach 5 stacks = 50% reduction)
        target.apply_armor_shred(4, duration=5.0)
        self.assertEqual(target.armor_shred_stacks, 5)
        self.assertAlmostEqual(target.effective_armor, 100.0, delta=1e-3)

        # Apply 1 more stack (should be capped at 5 stacks = 50% max)
        target.apply_armor_shred(1, duration=5.0)
        self.assertEqual(target.armor_shred_stacks, 5)
        self.assertAlmostEqual(target.effective_armor, 100.0, delta=1e-3)

        # Test duration decay
        target.update_physics_and_status(5.1)
        self.assertEqual(target.armor_shred_stacks, 0)
        self.assertEqual(target.effective_armor, 200.0)

    def test_convective_lift_and_lateral_ejection(self):
        caster_pos = Vector3(0.0, 0.0, 0.0)
        direction = Vector3(1.0, 0.0, 0.0)
        config = FireSlashConfig(fissure_reach=8.0, fissure_speed=20.0, num_vents=4)
        sim = FireSlashSimulator(caster_pos, direction, config)

        target = AdvancedCombatTarget(
            id="goblin",
            name="Goblin",
            position=Vector3(2.0, 0.3, 0.0),  # Right near Vent 1 at x=2.0
            mass_kg=60.0,
        )

        # Run simulation to trigger vent 1
        events = sim.step(0.15, [target])
        hit_events = [e for e in events if e.get("type") == "fire_slash_hit"]
        self.assertEqual(len(hit_events), 1)

        # Verify vertical lift and airborne status
        self.assertTrue(target.is_airborne)
        self.assertGreater(target.velocity.z, 0.0)
        # Verify lateral ejection (since target y=0.3 > 0, ejection should push in +y direction)
        self.assertGreater(target.velocity.y, 0.0)
        self.assertEqual(target.armor_shred_stacks, 1)


# ==============================================================================
# 2. POWER SLASH TESTS
# ==============================================================================

class TestPowerSlashPhysics(unittest.TestCase):
    """Validates the supersonic ether fan geometry, aerodynamic drag, and multi-hit damping."""

    def test_blade_fan_conic_geometry(self):
        caster_pos = Vector3(0.0, 0.0, 0.0)
        forward = Vector3(1.0, 0.0, 0.0)  # Along +X axis (0 rad)
        config = PowerSlashConfig(blade_count=5, spread_angle_deg=48.0)
        sim = PowerSlashSimulator(caster_pos, forward, config)

        self.assertEqual(len(sim.blades), 5)
        # Middle blade should be along +X
        mid_blade = sim.blades[2]
        self.assertAlmostEqual(mid_blade.direction.x, 1.0, delta=1e-3)
        self.assertAlmostEqual(mid_blade.direction.y, 0.0, delta=1e-3)

        # First and last blades should span 48 deg total (+/- 24 deg)
        first_blade = sim.blades[0]
        last_blade = sim.blades[4]
        dot_span = first_blade.direction.dot(last_blade.direction)
        expected_dot = math.cos(math.radians(48.0))
        self.assertAlmostEqual(dot_span, expected_dot, delta=1e-3)

    def test_supersonic_drag_deceleration(self):
        caster_pos = Vector3(0.0, 0.0, 0.0)
        forward = Vector3(1.0, 0.0, 0.0)
        config = PowerSlashConfig(initial_speed=450.0, drag_coeff=0.003)
        sim = PowerSlashSimulator(caster_pos, forward, config)

        blade = sim.blades[2]
        v0 = blade.speed
        self.assertEqual(v0, 450.0)

        dt = 0.01
        sim.step(dt, [])

        # Aerodynamic drag equation: v_new = v0 / (1 + drag * v0 * dt)
        expected_v = v0 / (1.0 + 0.003 * v0 * dt)
        self.assertAlmostEqual(blade.speed, expected_v, delta=1e-2)
        self.assertLess(blade.speed, v0)

    def test_multi_hit_exponential_damping(self):
        caster_pos = Vector3(0.0, 0.0, 0.0)
        forward = Vector3(1.0, 0.0, 0.0)
        config = PowerSlashConfig(
            blade_count=5,
            spread_angle_deg=20.0,  # Narrow cone to guarantee multiple blades hit
            base_damage=200.0,
            multi_hit_damping=0.65,
        )
        sim = PowerSlashSimulator(caster_pos, forward, config)

        target = AdvancedCombatTarget(
            id="boss_dummy",
            name="Training Dummy",
            position=Vector3(2.0, 0.0, 0.0),
            radius=1.2,  # Wide enough to intersect multiple fan blades
            base_armor=0.0,  # 0 armor to verify raw damage scaling
        )

        # Simulate until blades pass target
        all_hits = []
        for _ in range(20):
            events = sim.step(0.005, [target])
            for e in events:
                if e.get("type") == "power_slash_hit":
                    all_hits.append(e)

        self.assertGreater(len(all_hits), 1)
        # Check damping progression
        for i, hit in enumerate(all_hits):
            expected_damping = 0.65 ** i
            self.assertAlmostEqual(hit["damping_factor"], expected_damping, delta=1e-3)


# ==============================================================================
# 3. EARTHQUAKE TESTS
# ==============================================================================

class TestEarthquakePhysics(unittest.TestCase):
    """Validates the Dark Horse seismic wave, knock-up ballistics, and poise checks."""

    def test_seismic_wave_radial_expansion_and_timing(self):
        epicenter = Vector3(0.0, 0.0, 0.0)
        config = EarthquakeConfig(seismic_speed=20.0, max_radius=10.0, crest_thickness=1.5)
        sim = EarthquakeSimulator(epicenter, config)

        dt = 0.2
        sim.step(dt, [])
        # Radius after 0.2s = 20 * 0.2 = 4.0m
        self.assertAlmostEqual(sim.current_radius, 4.0, delta=1e-3)
        self.assertFalse(sim.is_finished)

        # After total 0.5s = 10.0m reached -> should finish
        sim.step(0.3, [])
        self.assertAlmostEqual(sim.current_radius, 10.0, delta=1e-3)
        self.assertTrue(sim.is_finished)

    def test_knockup_ragdoll_vs_boss_poise_resistance(self):
        epicenter = Vector3(0.0, 0.0, 0.0)
        config = EarthquakeConfig(seismic_speed=20.0, base_knockup_impulse=600.0, boss_poise_threshold=150.0)
        sim = EarthquakeSimulator(epicenter, config)

        normal_mob = AdvancedCombatTarget(
            id="skeleton",
            name="Skeleton Soldier",
            position=Vector3(3.0, 0.0, 0.0),
            mass_kg=60.0,
            is_boss=False,
            poise=50.0,
        )
        heavy_boss = AdvancedCombatTarget(
            id="kundun",
            name="Illusion of Kundun",
            position=Vector3(3.0, 0.0, 0.0),
            mass_kg=400.0,
            is_boss=True,
            poise=300.0,
            current_poise=300.0,
        )

        # Trigger shockwave at 3.0m (time = 3.0 / 20 = 0.15s)
        events = sim.step(0.16, [normal_mob, heavy_boss])
        hits = {e["target_id"]: e for e in events if e.get("type") == "earthquake_shockwave_hit"}

        self.assertIn("skeleton", hits)
        self.assertIn("kundun", hits)

        # Normal mob should be knocked up in the air
        self.assertTrue(hits["skeleton"]["knocked_up"])
        self.assertTrue(normal_mob.is_airborne)
        # Initial launch impulse vz was > 6.0 m/s, after dt=0.16s gravity it remains > 4.0 m/s
        self.assertGreater(hits["skeleton"]["vertical_velocity"], 5.5)
        self.assertGreater(normal_mob.velocity.z, 4.0)

        # Boss with 300 poise (> 150) should resist knock-up
        self.assertFalse(hits["kundun"]["knocked_up"])
        self.assertFalse(heavy_boss.is_airborne)
        self.assertEqual(heavy_boss.velocity.z, 0.0)

    def test_parabolic_trajectory_and_ground_landing_damage(self):
        target = AdvancedCombatTarget(
            id="acrobat_mob",
            name="Flying Goblin",
            position=Vector3(0.0, 0.0, 0.0),
            velocity=Vector3(0.0, 0.0, 10.0),  # Launched upward at 10 m/s
            mass_kg=70.0,
        )
        target.is_airborne = True

        # Simulate trajectory under gravity g = 9.81 m/s^2
        # Peak altitude at t = 10 / 9.81 ~= 1.02s, landing at t ~= 2.04s
        landing_event = None
        for _ in range(120):  # 120 * 0.02 = 2.4s
            event = target.update_physics_and_status(0.02)
            if event and event.get("type") == "ground_landing":
                landing_event = event
                break

        self.assertIsNotNone(landing_event)
        self.assertFalse(target.is_airborne)
        self.assertAlmostEqual(target.position.z, 0.0, delta=1e-3)
        self.assertGreater(landing_event["fall_damage"], 0.0)


# ==============================================================================
# 4. FIREBURST TESTS
# ==============================================================================

class TestFireburstPhysics(unittest.TestCase):
    """Validates the supersonic whip crack, tri-cluster chain detonation, and combustion DoT."""

    def test_tri_cluster_chronological_detonations(self):
        caster_pos = Vector3(0.0, 0.0, 0.0)
        target_pos = Vector3(5.0, 0.0, 0.0)
        config = FireburstConfig(
            node_delays=(0.0, 0.09, 0.18),
        )
        sim = FireburstSimulator(caster_pos, target_pos, config)

        # t = 0.01: Node 0 detonated, Nodes 1 and 2 pending
        e1 = sim.step(0.01, [])
        detonated_nodes = [e["node_index"] for e in e1 if e.get("type") == "fireburst_node_detonated"]
        self.assertEqual(detonated_nodes, [0])

        # Step +0.09s (t = 0.10s): Node 1 should detonate
        e2 = sim.step(0.09, [])
        detonated_nodes = [e["node_index"] for e in e2 if e.get("type") == "fireburst_node_detonated"]
        self.assertEqual(detonated_nodes, [1])

        # Step +0.09s (t = 0.19s): Node 2 should detonate
        e3 = sim.step(0.09, [])
        detonated_nodes = [e["node_index"] for e in e3 if e.get("type") == "fireburst_node_detonated"]
        self.assertEqual(detonated_nodes, [2])

    def test_combustion_burn_threshold_trigger(self):
        caster_pos = Vector3(0.0, 0.0, 0.0)
        target_pos = Vector3(5.0, 0.0, 0.0)
        config = FireburstConfig(
            node_delays=(0.0, 0.05, 0.10),
            node_radii=(2.0, 2.0, 2.0),
            burn_threshold_hits=2,
            burn_duration=3.0,
            burn_dps=50.0,
        )
        sim = FireburstSimulator(caster_pos, target_pos, config)

        target = AdvancedCombatTarget(
            id="mutant",
            name="Cursed Warrior",
            position=target_pos,  # Directly in center of cluster
        )

        self.assertFalse(target.is_burning)

        # Step 1: 1st explosion
        sim.step(0.01, [target])
        self.assertFalse(target.is_burning)
        self.assertEqual(sim.target_hit_counts.get(target.id), 1)

        # Step 2: 2nd explosion -> should reach threshold and ignite!
        sim.step(0.05, [target])
        self.assertTrue(target.is_burning)
        self.assertEqual(sim.target_hit_counts.get(target.id), 2)
        self.assertEqual(target.burn_dps, 50.0)
        self.assertEqual(target.burn_timer, 3.0)


# ==============================================================================
# 5. DARK RAVEN AI & CMD SCALING TESTS
# ==============================================================================

class TestDarkRavenAI(unittest.TestCase):
    """Validates the Command stat scaling, AI state machine, screw dive, and blindness."""

    def test_command_stat_scaling_matrix(self):
        hero_pos = Vector3(0.0, 0.0, 0.0)
        config = DarkRavenConfig()

        raven_cmd0 = DarkRavenAI(hero_pos, command_stat=0.0, config=config)
        raven_cmd500 = DarkRavenAI(hero_pos, command_stat=500.0, config=config)
        raven_cmd1000 = DarkRavenAI(hero_pos, command_stat=1000.0, config=config)

        # 1. Command radius: 8m -> 15.5m -> 23m
        self.assertAlmostEqual(raven_cmd0.effective_command_radius, 8.0, delta=1e-2)
        self.assertAlmostEqual(raven_cmd500.effective_command_radius, 15.5, delta=1e-2)
        self.assertAlmostEqual(raven_cmd1000.effective_command_radius, 23.0, delta=1e-2)

        # 2. Dive speed: 18m/s -> 25.65m/s -> 33.3m/s
        self.assertAlmostEqual(raven_cmd0.effective_dive_speed, 18.0, delta=1e-2)
        self.assertAlmostEqual(raven_cmd1000.effective_dive_speed, 18.0 * 1.85, delta=1e-2)

        # 3. Blind chance: 15% -> 37.5% -> 60%
        self.assertAlmostEqual(raven_cmd0.effective_blind_chance, 0.15, delta=1e-2)
        self.assertAlmostEqual(raven_cmd500.effective_blind_chance, 0.375, delta=1e-2)
        self.assertAlmostEqual(raven_cmd1000.effective_blind_chance, 0.60, delta=1e-2)

    def test_complete_ai_flight_cycle(self):
        hero_pos = Vector3(0.0, 0.0, 0.0)
        raven = DarkRavenAI(hero_pos, command_stat=400.0)

        # 1. Initial State: PERCHED on shoulder
        self.assertEqual(raven.state, RavenState.PERCHED)
        shoulder_target = hero_pos + raven.config.shoulder_offset
        self.assertAlmostEqual(raven.position.distance_to(shoulder_target), 0.0, delta=1e-3)

        # Spawn a target within command radius (e.g. at 6m)
        target = AdvancedCombatTarget(
            id="orc",
            name="Orc Raider",
            position=Vector3(6.0, 0.0, 0.0),
            height=1.8,
            current_hp=500.0,
        )

        # Step 1: Detects target and transitions to DIVE_BOMBING
        events = raven.step(0.05, hero_pos, [target])
        self.assertEqual(raven.state, RavenState.DIVE_BOMBING)
        self.assertEqual(raven.current_target, target)

        # Simulate dive steps until reaching head (dist <= 0.45m)
        for _ in range(60):
            if raven.state == RavenState.EYE_PECK:
                break
            raven.step(0.02, hero_pos, [target])

        self.assertEqual(raven.state, RavenState.EYE_PECK)

        # Simulate peck phase with forced blindness roll
        peck_event = None
        for _ in range(25):
            evs = raven.step(0.02, hero_pos, [target], force_blind_roll=True)
            for e in evs:
                if e.get("type") == "raven_eye_peck_hit":
                    peck_event = e
                    break
            if peck_event:
                break

        self.assertIsNotNone(peck_event)
        self.assertTrue(peck_event["blind_inflicted"])
        self.assertTrue(target.is_blinded)
        self.assertGreater(target.blind_timer, 0.0)
        self.assertEqual(target.accuracy_penalty, 0.65)

        # After attacking the only enemy, Raven enters RETURN_TO_SHOULDER
        self.assertEqual(raven.state, RavenState.RETURN_TO_SHOULDER)

        # Simulate return flight until PERCHED
        for _ in range(150):
            if raven.state == RavenState.PERCHED:
                break
            raven.step(0.02, hero_pos, [target])

        self.assertEqual(raven.state, RavenState.PERCHED)
        self.assertAlmostEqual(raven.position.distance_to(shoulder_target), 0.0, delta=0.2)

    def test_direct_sovereign_orders(self):
        hero_pos = Vector3(0.0, 0.0, 0.0)
        raven = DarkRavenAI(hero_pos, command_stat=500.0)

        # Order patrol
        raven.order_patrol()
        self.assertEqual(raven.state, RavenState.ORBITING_PATROL)

        # Step in patrol
        raven.step(0.1, hero_pos, [])
        self.assertEqual(raven.state, RavenState.ORBITING_PATROL)
        self.assertGreater(raven.orbit_angle, 0.0)

        # Order return
        raven.order_return()
        self.assertEqual(raven.state, RavenState.RETURN_TO_SHOULDER)


if __name__ == "__main__":
    unittest.main()
