/**
 * DASI MMORPG - SISTEMA DE COLISÃO FÍSICA AUTORITATIVO & REGISTRY DOS 47 CENÁRIOS
 * Suporte a caixas AABB, cilindros, barreiras radiais, deslizamento (sliding response) e bounds.
 */

export type ColliderType = 'BOX' | 'CYLINDER' | 'RADIAL_BOUNDARY' | 'HAZARD';

export interface BoxCollider {
  type: 'BOX';
  id: string;
  x: number;
  z: number;
  width: number;  // extensão no eixo X
  depth: number;  // extensão no eixo Z
  height?: number;
}

export interface CylinderCollider {
  type: 'CYLINDER';
  id: string;
  x: number;
  z: number;
  radius: number;
  height?: number;
}

export interface RadialBoundaryCollider {
  type: 'RADIAL_BOUNDARY';
  id: string;
  x: number;
  z: number;
  maxRadius: number; // Jogador não pode passar para fora de maxRadius
}

export type ScenarioCollider = BoxCollider | CylinderCollider | RadialBoundaryCollider;

export interface ScenarioMapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ScenarioDefinition {
  id: string;
  code: string;
  name: string;
  biome: 'LORENCIA' | 'NORIA' | 'DEVIAS' | 'DUNGEON' | 'LOST_TOWER' | 'ATLANS' | 'TARKAN' | 'ICARUS';
  bounds: ScenarioMapBounds;
  spawnPoint: { x: number; z: number };
  colliders: ScenarioCollider[];
}

export class CollisionSystem {
  public static readonly DEFAULT_PLAYER_RADIUS = 0.45; // Metros (Cápsula de herói)

  /**
   * Catálogo Oficial de todos os 47 Cenários Canônicos e suas Barreiras Físicas
   */
  public static readonly SCENARIOS: Record<string, ScenarioDefinition> = {};

  static {
    // ------------------------------------------------------------------------
    // 1. LORENCIA (7 CENÁRIOS)
    // ------------------------------------------------------------------------
    CollisionSystem.registerScenario({
      id: 'LOR_01',
      code: 'LORENCIA_CITADEL',
      name: 'Lorencia Citadel (Praça Central & Fonte do Arcanjo)',
      biome: 'LORENCIA',
      bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -2.0 },
      colliders: [
        { type: 'CYLINDER', id: 'fountain_basin', x: 0, z: 0, radius: 3.2 },
        { type: 'CYLINDER', id: 'archangel_pedestal', x: 0, z: 0, radius: 0.9 },
        // 4 Tendas de Bazar
        { type: 'BOX', id: 'tent_sw', x: -7.2, z: -4.0, width: 3.2, depth: 3.0 },
        { type: 'BOX', id: 'tent_se', x: 7.2, z: -4.0, width: 3.2, depth: 3.0 },
        { type: 'BOX', id: 'tent_nw', x: -7.2, z: 4.5, width: 3.2, depth: 3.0 },
        { type: 'BOX', id: 'tent_ne', x: 7.2, z: 4.5, width: 3.2, depth: 3.0 },
        // Taverna da Lareira (Fachada Norte)
        { type: 'BOX', id: 'tavern_facade', x: 0, z: 13.5, width: 16.5, depth: 4.5 },
        // Muralha Sul e Portão
        { type: 'BOX', id: 'wall_south_left', x: -11.0, z: -16.0, width: 14.0, depth: 3.0 },
        { type: 'BOX', id: 'wall_south_right', x: 11.0, z: -16.0, width: 14.0, depth: 3.0 },
        { type: 'CYLINDER', id: 'tower_sw', x: -14.0, z: -16.0, radius: 3.2 },
        { type: 'CYLINDER', id: 'tower_se', x: 14.0, z: -16.0, radius: 3.2 },
        // 8 Postes de Tochas
        { type: 'CYLINDER', id: 'torch_1', x: -3.5, z: -12.0, radius: 0.35 },
        { type: 'CYLINDER', id: 'torch_2', x: 3.5, z: -12.0, radius: 0.35 },
        { type: 'CYLINDER', id: 'torch_3', x: -3.5, z: 10.5, radius: 0.35 },
        { type: 'CYLINDER', id: 'torch_4', x: 3.5, z: 10.5, radius: 0.35 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'LOR_02',
      code: 'LORENCIA_EAST_GATE',
      name: 'Lorencia East Gate & Planícies das Bestas',
      biome: 'LORENCIA',
      bounds: { minX: -24, maxX: 24, minZ: -18, maxZ: 18 },
      spawnPoint: { x: -16, z: 0 },
      colliders: [
        { type: 'BOX', id: 'gate_arch_north', x: -16, z: 7.0, width: 3.0, depth: 10.0 },
        { type: 'BOX', id: 'gate_arch_south', x: -16, z: -7.0, width: 3.0, depth: 10.0 },
        { type: 'BOX', id: 'palisade_east', x: 22, z: 0, width: 2.0, depth: 34.0 },
        { type: 'CYLINDER', id: 'watch_tower', x: -13, z: 8.5, radius: 2.2 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'LOR_03',
      code: 'LORENCIA_WEST_GATE',
      name: 'Lorencia West Gate & Mata das Aranhas Negras',
      biome: 'LORENCIA',
      bounds: { minX: -24, maxX: 24, minZ: -18, maxZ: 18 },
      spawnPoint: { x: 16, z: 0 },
      colliders: [
        { type: 'CYLINDER', id: 'spider_tree_1', x: -4.0, z: 6.0, radius: 1.4 },
        { type: 'CYLINDER', id: 'spider_tree_2', x: 2.0, z: -7.0, radius: 1.2 },
        { type: 'CYLINDER', id: 'spider_tree_3', x: -10.0, z: -5.0, radius: 1.5 },
        { type: 'BOX', id: 'wrecked_wagon', x: -2.0, z: 1.0, width: 3.5, depth: 2.2 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'LOR_04',
      code: 'LORENCIA_NORTH_GATE',
      name: 'Lorencia North Gate & Ponte do Fosso do Castelo',
      biome: 'LORENCIA',
      bounds: { minX: -24, maxX: 24, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -12 },
      colliders: [
        { type: 'BOX', id: 'castle_wall_main', x: 0, z: 14.0, width: 44.0, depth: 3.5 },
        { type: 'CYLINDER', id: 'gate_tower_left', x: -9.0, z: 14.0, radius: 2.8 },
        { type: 'CYLINDER', id: 'gate_tower_right', x: 9.0, z: 14.0, radius: 2.8 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'LOR_05',
      code: 'LORENCIA_CEMETERY',
      name: 'Lorencia South Plains & Cemitério Melancólico',
      biome: 'LORENCIA',
      bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: 14 },
      colliders: [
        { type: 'BOX', id: 'mausoleum_crypt', x: 0, z: -8.0, width: 5.2, depth: 4.4 },
        { type: 'BOX', id: 'gravestone_1', x: -5.0, z: -2.0, width: 1.0, depth: 0.6 },
        { type: 'BOX', id: 'gravestone_2', x: 5.0, z: -2.0, width: 1.0, depth: 0.6 },
        { type: 'BOX', id: 'gravestone_3', x: -7.0, z: 4.0, width: 1.0, depth: 0.6 },
        { type: 'BOX', id: 'gravestone_4', x: 7.0, z: 4.0, width: 1.0, depth: 0.6 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'LOR_06',
      code: 'LORENCIA_TAVERN_INT',
      name: 'Lorencia Golden Hearth Tavern (Interior da Estalagem)',
      biome: 'LORENCIA',
      bounds: { minX: -11, maxX: 11, minZ: -9, maxZ: 9 },
      spawnPoint: { x: 0, z: -6.5 },
      colliders: [
        { type: 'BOX', id: 'tavern_counter', x: -4.5, z: 2.0, width: 6.5, depth: 1.4 },
        { type: 'BOX', id: 'tavern_hearth', x: 0, z: 7.5, width: 4.0, depth: 1.8 },
        { type: 'CYLINDER', id: 'table_1', x: 4.5, z: 3.0, radius: 1.4 },
        { type: 'CYLINDER', id: 'table_2', x: 4.5, z: -3.0, radius: 1.4 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'LOR_07',
      code: 'LORENCIA_FORGE',
      name: 'Lorencia Blacksmith Forge (Forja do Ferreiro Han)',
      biome: 'LORENCIA',
      bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
      spawnPoint: { x: 0, z: -6 },
      colliders: [
        { type: 'BOX', id: 'furnace_hearth', x: -4.5, z: 4.5, width: 3.5, depth: 3.5 },
        { type: 'BOX', id: 'anvil_block', x: 0, z: 1.0, width: 1.2, depth: 0.8 },
        { type: 'BOX', id: 'weapon_rack_forge', x: 6.5, z: 0, width: 1.2, depth: 5.0 },
      ],
    });

    // ------------------------------------------------------------------------
    // 2. NORIA (7 CENÁRIOS)
    // ------------------------------------------------------------------------
    CollisionSystem.registerScenario({
      id: 'NOR_01',
      code: 'NORIA_SANCTUARY',
      name: 'Noria Feywood Sanctuary (Praça Élfica Central)',
      biome: 'NORIA',
      bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -3.0 },
      colliders: [
        { type: 'CYLINDER', id: 'mother_tree_center', x: 0, z: 6.0, radius: 4.2 },
        { type: 'CYLINDER', id: 'sacred_fey_pylon_1', x: -8.0, z: -4.0, radius: 1.2 },
        { type: 'CYLINDER', id: 'sacred_fey_pylon_2', x: 8.0, z: -4.0, radius: 1.2 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'NOR_02',
      code: 'NORIA_CHAOS_MACHINE',
      name: 'Noria Chaos Machine Workshop (Oficina Alquímica do Caos)',
      biome: 'NORIA',
      bounds: { minX: -16, maxX: 16, minZ: -16, maxZ: 16 },
      spawnPoint: { x: 0, z: -8.0 },
      colliders: [
        { type: 'BOX', id: 'chaos_machine_base', x: 0, z: 0, width: 6.5, depth: 6.5 },
        { type: 'BOX', id: 'sacrifice_plinth', x: 0, z: -4.2, width: 2.2, depth: 1.6 },
        { type: 'CYLINDER', id: 'steam_boiler_left', x: -5.5, z: 2.0, radius: 1.5 },
        { type: 'CYLINDER', id: 'steam_boiler_right', x: 5.5, z: 2.0, radius: 1.5 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'NOR_03',
      code: 'NORIA_QUEEN_ALTAR',
      name: "Noria Queen Lúthien's Altar & Águas da Vida",
      biome: 'NORIA',
      bounds: { minX: -18, maxX: 18, minZ: -18, maxZ: 18 },
      spawnPoint: { x: 0, z: -10 },
      colliders: [
        { type: 'BOX', id: 'queen_altar_platform', x: 0, z: 3.0, width: 6.0, depth: 5.0 },
        { type: 'CYLINDER', id: 'healing_pool_basin', x: 0, z: -2.0, radius: 2.8 },
        { type: 'CYLINDER', id: 'amber_sap_pylon_l', x: -5.5, z: 3.0, radius: 0.8 },
        { type: 'CYLINDER', id: 'amber_sap_pylon_r', x: 5.5, z: 3.0, radius: 0.8 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'NOR_04',
      code: 'NORIA_EAST_GROVES',
      name: 'Noria East Fey Groves (Bosques dos Goblins)',
      biome: 'NORIA',
      bounds: { minX: -22, maxX: 22, minZ: -18, maxZ: 18 },
      spawnPoint: { x: -16, z: 0 },
      colliders: [
        { type: 'CYLINDER', id: 'grove_tree_1', x: -6, z: 6, radius: 1.6 },
        { type: 'CYLINDER', id: 'grove_tree_2', x: 4, z: -6, radius: 1.8 },
        { type: 'CYLINDER', id: 'grove_tree_3', x: 10, z: 5, radius: 1.5 },
        { type: 'BOX', id: 'fallen_trunk', x: 0, z: -1, width: 8.0, depth: 1.5 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'NOR_05',
      code: 'NORIA_MUSHROOM_GLADE',
      name: 'Noria Giant Mushroom Glade (Clareira dos Cogumelos)',
      biome: 'NORIA',
      bounds: { minX: -19, maxX: 19, minZ: -19, maxZ: 19 },
      spawnPoint: { x: 0, z: -14 },
      colliders: [
        { type: 'CYLINDER', id: 'shroom_huge_cyan', x: -5.5, z: 2.0, radius: 2.0 },
        { type: 'CYLINDER', id: 'shroom_huge_purple', x: 6.0, z: 1.0, radius: 1.9 },
        { type: 'CYLINDER', id: 'shroom_stem_3', x: -2.0, z: -5.0, radius: 1.3 },
        { type: 'CYLINDER', id: 'shroom_stem_4', x: 4.5, z: -6.0, radius: 1.4 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'NOR_06',
      code: 'NORIA_DEEP_CANYON',
      name: 'Noria Deep Canyon & Ponte Pênsil de Raízes',
      biome: 'NORIA',
      bounds: { minX: -22, maxX: 22, minZ: -14, maxZ: 14 },
      spawnPoint: { x: -18, z: 0 },
      colliders: [
        // Penhascos do Desfiladeiro
        { type: 'BOX', id: 'chasm_north_cliff', x: 0, z: 9.0, width: 44.0, depth: 6.0 },
        { type: 'BOX', id: 'chasm_south_cliff', x: 0, z: -9.0, width: 44.0, depth: 6.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'NOR_07',
      code: 'NORIA_CREEPER_HOLLOW',
      name: 'Noria Creeper Hollow (Covil do Stone Golem)',
      biome: 'NORIA',
      bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -14 },
      colliders: [
        { type: 'RADIAL_BOUNDARY', id: 'hollow_root_ring', x: 0, z: 0, maxRadius: 18.5 },
        { type: 'BOX', id: 'golem_monolith', x: 0, z: 2.0, width: 3.5, depth: 3.5 },
      ],
    });

    // ------------------------------------------------------------------------
    // 3. DEVIAS (6 CENÁRIOS)
    // ------------------------------------------------------------------------
    CollisionSystem.registerScenario({
      id: 'DEV_01',
      code: 'DEVIAS_CITADEL',
      name: 'Devias Glacial Citadel (O Grande Braseiro Rei)',
      biome: 'DEVIAS',
      bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -6.5 },
      colliders: [
        { type: 'CYLINDER', id: 'king_hearth_cauldron', x: 0, z: 0, radius: 3.2 },
        { type: 'BOX', id: 'fortress_wall_north', x: 0, z: 16.5, width: 36.0, depth: 3.5 },
        { type: 'CYLINDER', id: 'ice_bastion_w', x: -14.0, z: 8.0, radius: 3.0 },
        { type: 'CYLINDER', id: 'ice_bastion_e', x: 14.0, z: 8.0, radius: 3.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'DEV_02',
      code: 'DEVIAS_CATHEDRAL',
      name: 'Devias Glacial Cathedral (Fachada & Rosácea de Gelo)',
      biome: 'DEVIAS',
      bounds: { minX: -22, maxX: 22, minZ: -19, maxZ: 19 },
      spawnPoint: { x: 0, z: -12.0 },
      colliders: [
        { type: 'BOX', id: 'cathedral_wall_facade', x: 0, z: 12.0, width: 26.0, depth: 5.5 },
        { type: 'BOX', id: 'buttress_left', x: -12.0, z: 10.0, width: 2.2, depth: 6.0 },
        { type: 'BOX', id: 'buttress_right', x: 12.0, z: 10.0, width: 2.2, depth: 6.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'DEV_03',
      code: 'DEVIAS_SNOWFIELDS',
      name: 'Devias North Snowfields (Campos dos Vermes Glaciais)',
      biome: 'DEVIAS',
      bounds: { minX: -24, maxX: 24, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -15.0 },
      colliders: [
        { type: 'BOX', id: 'granite_ridge_1', x: -8.0, z: 4.0, width: 6.0, depth: 3.5 },
        { type: 'BOX', id: 'granite_ridge_2', x: 10.0, z: -3.0, width: 7.0, depth: 4.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'DEV_04',
      code: 'DEVIAS_ICE_RIDGE',
      name: 'Devias Ice Shard Ridge (Cordilheira dos Cristais)',
      biome: 'DEVIAS',
      bounds: { minX: -22, maxX: 22, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -15.0 },
      colliders: [
        { type: 'CYLINDER', id: 'ice_shard_1', x: -7.5, z: -4.0, radius: 1.8 },
        { type: 'CYLINDER', id: 'ice_shard_2', x: 7.5, z: -4.0, radius: 1.8 },
        { type: 'CYLINDER', id: 'ice_shard_3', x: -9.0, z: 6.0, radius: 2.1 },
        { type: 'CYLINDER', id: 'ice_shard_4', x: 9.0, z: 6.0, radius: 2.1 },
        { type: 'CYLINDER', id: 'ice_shard_5', x: 0, z: 12.0, radius: 2.4 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'DEV_05',
      code: 'DEVIAS_CHASM_BRIDGE',
      name: 'Devias Frozen Abyss & Ponte da Fenda Polar',
      biome: 'DEVIAS',
      bounds: { minX: -22, maxX: 22, minZ: -16, maxZ: 16 },
      spawnPoint: { x: -18, z: 0 },
      colliders: [
        { type: 'BOX', id: 'polar_abyss_north', x: 0, z: 8.5, width: 44.0, depth: 7.0 },
        { type: 'BOX', id: 'polar_abyss_south', x: 0, z: -8.5, width: 44.0, depth: 7.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'DEV_06',
      code: 'DEVIAS_ICE_QUEEN_LAIR',
      name: 'Devias Ice Queen Frozen Palace (Arena do Palácio)',
      biome: 'DEVIAS',
      bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -14.0 },
      colliders: [
        { type: 'RADIAL_BOUNDARY', id: 'queen_palace_ring', x: 0, z: 0, maxRadius: 18.5 },
        { type: 'BOX', id: 'ice_queen_throne', x: 0, z: 10.0, width: 5.5, depth: 3.5 },
        { type: 'CYLINDER', id: 'ice_pillar_1', x: -7.0, z: 2.0, radius: 1.3 },
        { type: 'CYLINDER', id: 'ice_pillar_2', x: 7.0, z: 2.0, radius: 1.3 },
      ],
    });

    // ------------------------------------------------------------------------
    // 4. DUNGEON (6 CENÁRIOS)
    // ------------------------------------------------------------------------
    CollisionSystem.registerScenario({
      id: 'DNG_01',
      code: 'DUNGEON_ENTRANCE',
      name: 'Dungeon 1: Catacumbas da Entrada & Ossuário',
      biome: 'DUNGEON',
      bounds: { minX: -18, maxX: 18, minZ: -18, maxZ: 18 },
      spawnPoint: { x: 0, z: -12.0 },
      colliders: [
        { type: 'BOX', id: 'pillar_dng_1', x: -6.0, z: -2.0, width: 1.8, depth: 1.8 },
        { type: 'BOX', id: 'pillar_dng_2', x: 6.0, z: -2.0, width: 1.8, depth: 1.8 },
        { type: 'BOX', id: 'pillar_dng_3', x: -6.0, z: 6.0, width: 1.8, depth: 1.8 },
        { type: 'BOX', id: 'pillar_dng_4', x: 6.0, z: 6.0, width: 1.8, depth: 1.8 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'DNG_02',
      code: 'DUNGEON_PRISON_CORRIDOR',
      name: 'Dungeon 1: Corredor das Celas Profanadas',
      biome: 'DUNGEON',
      bounds: { minX: -22, maxX: 22, minZ: -12, maxZ: 12 },
      spawnPoint: { x: -18, z: 0 },
      colliders: [
        { type: 'BOX', id: 'cell_wall_north', x: 0, z: 7.0, width: 44.0, depth: 4.5 },
        { type: 'BOX', id: 'cell_wall_south', x: 0, z: -7.0, width: 44.0, depth: 4.5 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'DNG_03',
      code: 'DUNGEON_POISON_CRYPTS',
      name: 'Dungeon 2: Criptas Venenosas dos Touros',
      biome: 'DUNGEON',
      bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -14.0 },
      colliders: [
        { type: 'BOX', id: 'sarcophagus_1', x: -6.0, z: 2.0, width: 3.2, depth: 1.8 },
        { type: 'BOX', id: 'sarcophagus_2', x: 6.0, z: 2.0, width: 3.2, depth: 1.8 },
        { type: 'CYLINDER', id: 'poison_pool_center', x: 0, z: 0, radius: 2.8 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'DNG_04',
      code: 'DUNGEON_TORTURE_CHAMBER',
      name: 'Dungeon 2: Câmara de Tortura & Poço dos Sacrifícios',
      biome: 'DUNGEON',
      bounds: { minX: -18, maxX: 18, minZ: -18, maxZ: 18 },
      spawnPoint: { x: 0, z: -12.0 },
      colliders: [
        { type: 'CYLINDER', id: 'torture_pit', x: 0, z: 0, radius: 3.2 },
        { type: 'BOX', id: 'iron_maiden_rack', x: -8.0, z: 3.0, width: 2.2, depth: 4.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'DNG_05',
      code: 'DUNGEON_MAZE_LOST_SOULS',
      name: 'Dungeon 3: Labirinto das Almas Perdidas',
      biome: 'DUNGEON',
      bounds: { minX: -21, maxX: 21, minZ: -21, maxZ: 21 },
      spawnPoint: { x: -16, z: -16 },
      colliders: [
        { type: 'BOX', id: 'maze_wall_1', x: -5.0, z: 0, width: 1.5, depth: 18.0 },
        { type: 'BOX', id: 'maze_wall_2', x: 5.0, z: 0, width: 1.5, depth: 18.0 },
        { type: 'BOX', id: 'maze_wall_cross', x: 0, z: 5.0, width: 12.0, depth: 1.5 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'DNG_06',
      code: 'DUNGEON_GORGON_LAIR',
      name: "Dungeon 3: Gorgon's Lair (Covil da Górgona)",
      biome: 'DUNGEON',
      bounds: { minX: -21, maxX: 21, minZ: -21, maxZ: 21 },
      spawnPoint: { x: 0, z: -15.0 },
      colliders: [
        { type: 'RADIAL_BOUNDARY', id: 'gorgon_arena_wall', x: 0, z: 0, maxRadius: 19.5 },
        // 8 Pilares de suporte (Destrutíveis)
        { type: 'CYLINDER', id: 'gorgon_pillar_1', x: -8.0, z: 0, radius: 1.4 },
        { type: 'CYLINDER', id: 'gorgon_pillar_2', x: 8.0, z: 0, radius: 1.4 },
        { type: 'CYLINDER', id: 'gorgon_pillar_3', x: 0, z: -8.0, radius: 1.4 },
        { type: 'CYLINDER', id: 'gorgon_pillar_4', x: 0, z: 8.0, radius: 1.4 },
        { type: 'CYLINDER', id: 'gorgon_altar', x: 0, z: 0, radius: 2.4 },
      ],
    });

    // ------------------------------------------------------------------------
    // 5. LOST TOWER (7 CENÁRIOS)
    // ------------------------------------------------------------------------
    CollisionSystem.registerScenario({
      id: 'LT_01',
      code: 'LOST_TOWER_GATEWAY',
      name: 'Lost Tower 1: O Portal de Obsidiana',
      biome: 'LOST_TOWER',
      bounds: { minX: -19, maxX: 19, minZ: -19, maxZ: 19 },
      spawnPoint: { x: 0, z: -12.0 },
      colliders: [
        { type: 'BOX', id: 'obsidian_gate_l', x: -6.0, z: 12.0, width: 3.5, depth: 3.5 },
        { type: 'BOX', id: 'obsidian_gate_r', x: 6.0, z: 12.0, width: 3.5, depth: 3.5 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'LT_02',
      code: 'LOST_TOWER_RUNED_HALLS',
      name: 'Lost Tower 2: Os Corredores Rúnicos',
      biome: 'LOST_TOWER',
      bounds: { minX: -22, maxX: 22, minZ: -14, maxZ: 14 },
      spawnPoint: { x: -16, z: 0 },
      colliders: [
        { type: 'BOX', id: 'runed_pillar_1', x: -8.0, z: 0, width: 2.0, depth: 2.0 },
        { type: 'BOX', id: 'runed_pillar_2', x: 0, z: 0, width: 2.0, depth: 2.0 },
        { type: 'BOX', id: 'runed_pillar_3', x: 8.0, z: 0, width: 2.0, depth: 2.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'LT_03',
      code: 'LOST_TOWER_MAGMA_GRATES',
      name: 'Lost Tower 3: O Abismo das Grelhas de Magma',
      biome: 'LOST_TOWER',
      bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -14.0 },
      colliders: [
        { type: 'CYLINDER', id: 'cyclopean_chain_1', x: -8.0, z: -8.0, radius: 1.0 },
        { type: 'CYLINDER', id: 'cyclopean_chain_2', x: 8.0, z: -8.0, radius: 1.0 },
        { type: 'CYLINDER', id: 'cyclopean_chain_3', x: -8.0, z: 8.0, radius: 1.0 },
        { type: 'CYLINDER', id: 'cyclopean_chain_4', x: 8.0, z: 8.0, radius: 1.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'LT_04',
      code: 'LOST_TOWER_DEMON_BALCONY',
      name: 'Lost Tower 4: As Sacadas dos Demônios',
      biome: 'LOST_TOWER',
      bounds: { minX: -21, maxX: 21, minZ: -17, maxZ: 17 },
      spawnPoint: { x: 0, z: -12.0 },
      colliders: [
        { type: 'BOX', id: 'balcony_parapet_n', x: 0, z: 14.5, width: 40.0, depth: 2.0 },
        { type: 'BOX', id: 'balcony_parapet_w', x: -18.5, z: 0, width: 2.0, depth: 30.0 },
        { type: 'BOX', id: 'balcony_parapet_e', x: 18.5, z: 0, width: 2.0, depth: 30.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'LT_05',
      code: 'LOST_TOWER_COLONNADE',
      name: 'Lost Tower 5: A Colunata Espiral',
      biome: 'LOST_TOWER',
      bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -14.0 },
      colliders: [
        { type: 'CYLINDER', id: 'spiral_col_1', x: -6.0, z: -3.0, radius: 1.6 },
        { type: 'CYLINDER', id: 'spiral_col_2', x: 6.0, z: -3.0, radius: 1.6 },
        { type: 'CYLINDER', id: 'spiral_col_3', x: -6.0, z: 6.0, radius: 1.6 },
        { type: 'CYLINDER', id: 'spiral_col_4', x: 6.0, z: 6.0, radius: 1.6 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'LT_06',
      code: 'LOST_TOWER_RAMPARTS',
      name: 'Lost Tower 6: As Muralhas Infernais',
      biome: 'LOST_TOWER',
      bounds: { minX: -22, maxX: 22, minZ: -18, maxZ: 18 },
      spawnPoint: { x: 0, z: -12.0 },
      colliders: [
        { type: 'BOX', id: 'magma_trench_left', x: -7.0, z: 0, width: 2.5, depth: 28.0 },
        { type: 'BOX', id: 'magma_trench_right', x: 7.0, z: 0, width: 2.5, depth: 28.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'LT_07',
      code: 'LOST_TOWER_BALROG_THRONE',
      name: "Lost Tower 7: Balrog's Throne of Hellfire (Trono do Balrog)",
      biome: 'LOST_TOWER',
      bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
      spawnPoint: { x: 0, z: -16.0 },
      colliders: [
        { type: 'RADIAL_BOUNDARY', id: 'balrog_arena_void', x: 0, z: 0, maxRadius: 20.5 },
        { type: 'BOX', id: 'balrog_throne_seat', x: 0, z: 12.0, width: 6.5, depth: 5.0 },
        { type: 'BOX', id: 'fire_obelisk_w', x: -10.0, z: 0, width: 2.0, depth: 2.0 },
        { type: 'BOX', id: 'fire_obelisk_e', x: 10.0, z: 0, width: 2.0, depth: 2.0 },
      ],
    });

    // ------------------------------------------------------------------------
    // 6. ATLANS (7 CENÁRIOS)
    // ------------------------------------------------------------------------
    CollisionSystem.registerScenario({
      id: 'ATL_01',
      code: 'ATLANS_SHALLOWS',
      name: 'Atlans 1: Areias Peroladas & Cáusticas Solares',
      biome: 'ATLANS',
      bounds: { minX: -21, maxX: 21, minZ: -21, maxZ: 21 },
      spawnPoint: { x: 0, z: -14.0 },
      colliders: [
        { type: 'CYLINDER', id: 'doric_column_broken', x: -5.0, z: 2.0, radius: 1.5 },
        { type: 'CYLINDER', id: 'doric_column_standing', x: 6.0, z: -3.0, radius: 1.4 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'ATL_02',
      code: 'ATLANS_SANCTUARY',
      name: 'Atlans 1: Santuário de Nácar & Domo de Ar',
      biome: 'ATLANS',
      bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -6.0 },
      colliders: [
        { type: 'CYLINDER', id: 'nacar_pedestal_center', x: 0, z: 0, radius: 2.0 },
        { type: 'BOX', id: 'parabolic_arch_base_1', x: -6.0, z: -6.0, width: 1.5, depth: 1.5 },
        { type: 'BOX', id: 'parabolic_arch_base_2', x: 6.0, z: -6.0, width: 1.5, depth: 1.5 },
        { type: 'BOX', id: 'parabolic_arch_base_3', x: -6.0, z: 6.0, width: 1.5, depth: 1.5 },
        { type: 'BOX', id: 'parabolic_arch_base_4', x: 6.0, z: 6.0, width: 1.5, depth: 1.5 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'ATL_03',
      code: 'ATLANS_CORAL_LABYRINTH',
      name: 'Atlans 2: Labirinto dos Corais de Gorgônia',
      biome: 'ATLANS',
      bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
      spawnPoint: { x: -16, z: -16 },
      colliders: [
        { type: 'CYLINDER', id: 'coral_massive_1', x: -6.0, z: -5.0, radius: 3.5 },
        { type: 'CYLINDER', id: 'coral_massive_2', x: 6.0, z: -4.0, radius: 3.2 },
        { type: 'CYLINDER', id: 'coral_massive_3', x: 0, z: 7.0, radius: 4.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'ATL_04',
      code: 'ATLANS_SLIPSTREAM_TRENCH',
      name: 'Atlans 2: Trincheira dos Túneis Slipstream',
      biome: 'ATLANS',
      bounds: { minX: -24, maxX: 24, minZ: -15, maxZ: 15 },
      spawnPoint: { x: -20, z: 0 },
      colliders: [
        { type: 'BOX', id: 'trench_wall_north', x: 0, z: 10.0, width: 48.0, depth: 6.0 },
        { type: 'BOX', id: 'trench_wall_south', x: 0, z: -10.0, width: 48.0, depth: 6.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'ATL_05',
      code: 'ATLANS_LEVIATHAN_GRAVE',
      name: 'Atlans 3: Cemitério dos Leviatãs Ancestrais',
      biome: 'ATLANS',
      bounds: { minX: -23, maxX: 23, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -14.0 },
      colliders: [
        { type: 'BOX', id: 'leviathan_skull', x: 0, z: 10.0, width: 5.5, depth: 4.5 },
        { type: 'BOX', id: 'rib_cluster_w', x: -7.0, z: 0, width: 1.5, depth: 16.0 },
        { type: 'BOX', id: 'rib_cluster_e', x: 7.0, z: 0, width: 1.5, depth: 16.0 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'ATL_06',
      code: 'ATLANS_HYDROTHERMAL',
      name: 'Atlans 3: Fendas Hidrotermais & Black Smokers',
      biome: 'ATLANS',
      bounds: { minX: -21, maxX: 21, minZ: -19, maxZ: 19 },
      spawnPoint: { x: 0, z: -14.0 },
      colliders: [
        { type: 'CYLINDER', id: 'black_smoker_1', x: -5.0, z: 2.0, radius: 1.8 },
        { type: 'CYLINDER', id: 'black_smoker_2', x: 6.0, z: 3.0, radius: 2.0 },
        { type: 'CYLINDER', id: 'black_smoker_3', x: 0, z: 10.0, radius: 2.2 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'ATL_07',
      code: 'ATLANS_HYDRA_MAW',
      name: "Atlans 3: Hydra's Abyssal Maw (Arena da Hidra)",
      biome: 'ATLANS',
      bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
      spawnPoint: { x: 0, z: -16.0 },
      colliders: [
        { type: 'RADIAL_BOUNDARY', id: 'abyssal_maw_boundary', x: 0, z: 0, maxRadius: 20.5 },
        { type: 'CYLINDER', id: 'hydra_spire_left', x: -10.0, z: 0, radius: 2.0 },
        { type: 'CYLINDER', id: 'hydra_spire_right', x: 10.0, z: 0, radius: 2.0 },
      ],
    });

    // ------------------------------------------------------------------------
    // 7. TARKAN (5 CENÁRIOS)
    // ------------------------------------------------------------------------
    CollisionSystem.registerScenario({
      id: 'TAR_01',
      code: 'TARKAN_DUNES',
      name: 'Tarkan 1: Dunas Carmesim & Máquinas Soterradas',
      biome: 'TARKAN',
      bounds: { minX: -23, maxX: 23, minZ: -21, maxZ: 21 },
      spawnPoint: { x: 0, z: -14.0 },
      colliders: [
        { type: 'CYLINDER', id: 'giant_rusted_gear_1', x: -7.0, z: 2.0, radius: 2.6 },
        { type: 'CYLINDER', id: 'giant_rusted_gear_2', x: 8.0, z: -3.0, radius: 2.2 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'TAR_02',
      code: 'TARKAN_OASIS',
      name: 'Tarkan 1: Oásis da Miragem Fervente',
      biome: 'TARKAN',
      bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -14.0 },
      colliders: [
        { type: 'CYLINDER', id: 'sulfur_lake_hazard', x: 0, z: 0, radius: 3.8 },
        { type: 'CYLINDER', id: 'iron_cactus_1', x: -6.0, z: 6.0, radius: 0.8 },
        { type: 'CYLINDER', id: 'iron_cactus_2', x: 6.0, z: 6.0, radius: 0.8 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'TAR_03',
      code: 'TARKAN_LEVIATHAN_SPINE',
      name: 'Tarkan 2: Desfiladeiro da Espinha do Deserto',
      biome: 'TARKAN',
      bounds: { minX: -24, maxX: 24, minZ: -18, maxZ: 18 },
      spawnPoint: { x: -18, z: 0 },
      colliders: [
        { type: 'BOX', id: 'sandstone_wall_n', x: 0, z: 12.0, width: 48.0, depth: 6.0 },
        { type: 'BOX', id: 'sandstone_wall_s', x: 0, z: -12.0, width: 48.0, depth: 6.0 },
        { type: 'BOX', id: 'vertebra_fossil_1', x: -5.0, z: 0, width: 2.2, depth: 2.2 },
        { type: 'BOX', id: 'vertebra_fossil_2', x: 5.0, z: 0, width: 2.2, depth: 2.2 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'TAR_04',
      code: 'TARKAN_IRON_SCRAPYARD',
      name: 'Tarkan 2: Cemitério das Rodas de Ferro',
      biome: 'TARKAN',
      bounds: { minX: -22, maxX: 22, minZ: -20, maxZ: 20 },
      spawnPoint: { x: 0, z: -14.0 },
      colliders: [
        { type: 'BOX', id: 'iron_wheel_wreck_1', x: -6.0, z: 4.0, width: 3.5, depth: 1.5 },
        { type: 'BOX', id: 'iron_wheel_wreck_2', x: 6.0, z: 4.0, width: 3.5, depth: 1.5 },
        { type: 'BOX', id: 'iron_wheel_wreck_3', x: 0, z: -4.0, width: 3.5, depth: 1.5 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'TAR_05',
      code: 'TARKAN_ZAIKAN_CRATER',
      name: "Tarkan 2: Zaikan's Sand Crater (Arena de Zaikan)",
      biome: 'TARKAN',
      bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
      spawnPoint: { x: 0, z: -16.0 },
      colliders: [
        { type: 'RADIAL_BOUNDARY', id: 'crater_dune_wall', x: 0, z: 0, maxRadius: 20.5 },
        { type: 'CYLINDER', id: 'zaikan_pillar_nw', x: -8.0, z: 8.0, radius: 1.6 },
        { type: 'CYLINDER', id: 'zaikan_pillar_ne', x: 8.0, z: 8.0, radius: 1.6 },
        { type: 'CYLINDER', id: 'zaikan_pillar_sw', x: -8.0, z: -8.0, radius: 1.6 },
        { type: 'CYLINDER', id: 'zaikan_pillar_se', x: 8.0, z: -8.0, radius: 1.6 },
      ],
    });

    // ------------------------------------------------------------------------
    // 8. ICARUS (2 CENÁRIOS)
    // ------------------------------------------------------------------------
    CollisionSystem.registerScenario({
      id: 'ICA_01',
      code: 'ICARUS_CITADEL',
      name: 'Icarus Aethel: Cidadela Central & Núcleo de Aetherita',
      biome: 'ICARUS',
      bounds: { minX: -24, maxX: 24, minZ: -24, maxZ: 24 },
      spawnPoint: { x: 0, z: -4.0 },
      colliders: [
        { type: 'RADIAL_BOUNDARY', id: 'center_island_void', x: 0, z: 0, maxRadius: 9.5 },
        { type: 'CYLINDER', id: 'aetherite_pedestal', x: 0, z: 0, radius: 1.6 },
      ],
    });

    CollisionSystem.registerScenario({
      id: 'ICA_02',
      code: 'ICARUS_PHOENIX_NEST',
      name: "Icarus Aethel: Dark Phoenix Lotus Nest (Ninho da Fênix)",
      biome: 'ICARUS',
      bounds: { minX: -21, maxX: 21, minZ: -21, maxZ: 21 },
      spawnPoint: { x: 0, z: -10.0 },
      colliders: [
        { type: 'RADIAL_BOUNDARY', id: 'phoenix_nest_edge', x: 0, z: 0, maxRadius: 10.5 },
        { type: 'CYLINDER', id: 'cosmic_fire_core', x: 0, z: 0, radius: 2.2 },
      ],
    });
  }

  public static registerScenario(def: ScenarioDefinition): void {
    CollisionSystem.SCENARIOS[def.id] = def;
    CollisionSystem.SCENARIOS[def.code] = def;
  }

  public static getScenario(key: string): ScenarioDefinition | undefined {
    return CollisionSystem.SCENARIOS[key];
  }

  public static getAllScenarios(): ScenarioDefinition[] {
    const list: ScenarioDefinition[] = [];
    const seen = new Set<string>();
    for (const s of Object.values(CollisionSystem.SCENARIOS)) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        list.push(s);
      }
    }
    return list;
  }

  /**
   * Resolve colisão física do jogador com deslizamento (Sliding Response)
   * @param scenarioId ID ou Código do cenário
   * @param currentPos Posição atual { x, z }
   * @param targetPos Posição desejada { x, z }
   * @param playerRadius Raio da cápsula (padrão 0.45m)
   * @returns Posição final ajustada com deslizamento e bounds
   */
  public static resolveMovement(
    scenarioId: string,
    currentPos: { x: number; z: number },
    targetPos: { x: number; z: number },
    playerRadius: number = CollisionSystem.DEFAULT_PLAYER_RADIUS
  ): { x: number; z: number; collided: boolean } {
    const scenario = CollisionSystem.getScenario(scenarioId) || CollisionSystem.SCENARIOS['LOR_01'];
    let finalX = targetPos.x;
    let finalZ = targetPos.z;
    let collided = false;

    // 1. Clampa nos limites externos da cena
    const clampedX = Math.max(scenario.bounds.minX + playerRadius, Math.min(scenario.bounds.maxX - playerRadius, finalX));
    const clampedZ = Math.max(scenario.bounds.minZ + playerRadius, Math.min(scenario.bounds.maxZ - playerRadius, finalZ));
    if (clampedX !== finalX || clampedZ !== finalZ) {
      collided = true;
      finalX = clampedX;
      finalZ = clampedZ;
    }

    // 2. Itera pelos colisores
    for (const col of scenario.colliders) {
      if (col.type === 'CYLINDER' || col.type === 'HAZARD') {
        const dx = finalX - col.x;
        const dz = finalZ - col.z;
        const dist = Math.hypot(dx, dz);
        const minDist = col.radius + playerRadius;

        if (dist < minDist) {
          collided = true;
          if (dist > 0.0001) {
            const nx = dx / dist;
            const nz = dz / dist;
            finalX = col.x + nx * minDist;
            finalZ = col.z + nz * minDist;
          } else {
            finalX += minDist;
          }
        }
      } else if (col.type === 'BOX') {
        const halfW = col.width / 2 + playerRadius;
        const halfD = col.depth / 2 + playerRadius;
        const minBoxX = col.x - halfW;
        const maxBoxX = col.x + halfW;
        const minBoxZ = col.z - halfD;
        const maxBoxZ = col.z + halfD;

        if (finalX > minBoxX && finalX < maxBoxX && finalZ > minBoxZ && finalZ < maxBoxZ) {
          collided = true;
          // Descobre qual borda está mais próxima para deslizar
          const dLeft = Math.abs(finalX - minBoxX);
          const dRight = Math.abs(maxBoxX - finalX);
          const dTop = Math.abs(maxBoxZ - finalZ);
          const dBottom = Math.abs(finalZ - minBoxZ);

          const minD = Math.min(dLeft, dRight, dTop, dBottom);
          if (minD === dLeft) finalX = minBoxX;
          else if (minD === dRight) finalX = maxBoxX;
          else if (minD === dBottom) finalZ = minBoxZ;
          else if (minD === dTop) finalZ = maxBoxZ;
        }
      } else if (col.type === 'RADIAL_BOUNDARY') {
        const dx = finalX - col.x;
        const dz = finalZ - col.z;
        const dist = Math.hypot(dx, dz);
        const maxAllowed = col.maxRadius - playerRadius;

        if (dist > maxAllowed) {
          collided = true;
          if (dist > 0.0001) {
            const nx = dx / dist;
            const nz = dz / dist;
            finalX = col.x + nx * maxAllowed;
            finalZ = col.z + nz * maxAllowed;
          }
        }
      }
    }

    return { x: finalX, z: finalZ, collided };
  }
}
