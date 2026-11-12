/**
 * DASI MMORPG - SISTEMA DE COLISÃO FÍSICA AUTORITATIVO & REGISTRY DOS 56 CENÁRIOS
 * Suporte a caixas AABB, cilindros, barreiras radiais, zonas de perigo (HAZARD),
 * deslizamento (sliding response) e clamp de bounds.
 *
 * Catálogo canônico único (docs/level_design/All_56_Scenarios_Master_Index.md):
 *   - 47 cenários de progressão nos 8 biomas principais
 *   - 5 cenários de Valley of Loren / Castle Siege (VOL_01..VOL_05)
 *   - 4 arenas de evento (EVT_01..EVT_04)
 *
 * A geometria abaixo é a MESMA renderizada pelo Dev Viewer (Three.js) — o teste
 * de paridade `tests/scenario_parity.test.ts` garante que cliente e servidor
 * nunca divirjam em bounds, spawn points ou volumes de colisão.
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

/** Zonas de perigo (lava, areia movediça, ácido): aplicam dano/queda fatal ao entrar */
export interface HazardCollider {
  type: 'HAZARD';
  id: string;
  x: number;
  z: number;
  radius: number;
}

export type ScenarioCollider = BoxCollider | CylinderCollider | RadialBoundaryCollider | HazardCollider;

/** Serialização compacta usada pelo registry canônico (ver SCENARIO_CATALOG) */

/** Biomas de progressão (8) e zonas especiais (Cerco de Castelo & Arenas de Evento). */
export type ScenarioBiome =
  | 'LORENCIA'
  | 'NORIA'
  | 'DEVIAS'
  | 'DUNGEON'
  | 'LOST_TOWER'
  | 'ATLANS'
  | 'TARKAN'
  | 'ICARUS'
  | 'VALLEY_OF_LOREN'
  | 'BLOOD_CASTLE'
  | 'DEVIL_SQUARE'
  | 'CHAOS_CASTLE'
  | 'DUEL_COLISEUM';

/** Os 8 biomas de progressão em ordem canônica de jornada */
export const PROGRESSION_BIOMES: readonly ScenarioBiome[] = [
  'LORENCIA',
  'NORIA',
  'DEVIAS',
  'DUNGEON',
  'LOST_TOWER',
  'ATLANS',
  'TARKAN',
  'ICARUS',
] as const;

/** Zonas especiais de Cerco de Castelo e Arenas de Evento */
export const SPECIAL_ZONES: readonly ScenarioBiome[] = [
  'VALLEY_OF_LOREN',
  'BLOOD_CASTLE',
  'DEVIL_SQUARE',
  'CHAOS_CASTLE',
  'DUEL_COLISEUM',
] as const;

export interface ScenarioMapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ScenarioDefinition extends ScenarioCatalogEntry {
  /** Zona segura: guardas da cidade e regras de PK não se aplicam */
  safeZone?: boolean;
  /** Arena de evento/siege instanciada (não faz parte do mundo aberto) */
  instanced?: boolean;
  /** HP de estruturas destrutíveis indexadas pelo id do colisor (portões, estátuas) */
  destructibleHp?: Record<string, number>;
}

export interface MovementResolution {
  x: number;
  z: number;
  collided: boolean;
  /** IDs dos colisores tocados no frame (útil para anti-cheat e testes) */
  collidersHit: string[];
  /** Zonas de perigo pisadas neste frame (lava, areia movediça, ácido) */
  hazardsHit: string[];
}

const PLAYER_RADIUS_FALLBACK = 0.45;

export interface ScenarioCatalogEntry {
  id: string;
  code: string;
  name: string;
  biome: ScenarioBiome;
  bounds: ScenarioMapBounds;
  spawnPoint: { x: number; z: number };
  colliders: ScenarioCollider[];
  safeZone?: boolean;
  instanced?: boolean;
  destructibleHp?: Record<string, number>;
}
/**
 * Catálogo canônico e imutável dos 56 cenários de Dasi.
 *
 * Esta é a ÚNICA fonte de verdade do level design / volumes de colisão.
 * O Dev Viewer (WEBGL / Three.js) renderiza exatamente estes volumes, e o
 * servidor autoritativo usa exatamente estas barreiras — o teste
 * `src/server/world/tests/scenario_parity.test.ts` garante que ambos os lados
 * compartilham o mesmo catálogo, sem duplicação de dados.
 */
export const SCENARIO_CATALOG: readonly ScenarioCatalogEntry[] = [
  // --------------------------------------------------------------------------
  // 1. LORENCIA (7 CENÁRIOS)
  // --------------------------------------------------------------------------
  {
    id: 'LOR_01',
    code: 'LORENCIA_CITADEL',
    name: 'Lorencia Citadel (Praça Central & Fonte do Arcanjo)',
    biome: 'LORENCIA',
    bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
    spawnPoint: { x: 0, z: -5 },
    colliders: [
      { type: 'CYLINDER', id: 'fountain_basin', x: 0, z: 0, radius: 3.2 },
      { type: 'CYLINDER', id: 'archangel_pedestal', x: 0, z: 0, radius: 0.9 },
      { type: 'BOX', id: 'tent_sw', x: -7.2, z: -4, width: 3.2, depth: 3 },
      { type: 'BOX', id: 'tent_se', x: 7.2, z: -4, width: 3.2, depth: 3 },
      { type: 'BOX', id: 'tent_nw', x: -7.2, z: 4.5, width: 3.2, depth: 3 },
      { type: 'BOX', id: 'tent_ne', x: 7.2, z: 4.5, width: 3.2, depth: 3 },
      { type: 'BOX', id: 'tavern_facade', x: 0, z: 13.5, width: 16.5, depth: 4.5 },
      { type: 'BOX', id: 'wall_south_left', x: -11, z: -16, width: 14, depth: 3 },
      { type: 'BOX', id: 'wall_south_right', x: 11, z: -16, width: 14, depth: 3 },
      { type: 'CYLINDER', id: 'tower_sw', x: -14, z: -16, radius: 3.2 },
      { type: 'CYLINDER', id: 'tower_se', x: 14, z: -16, radius: 3.2 },
      { type: 'CYLINDER', id: 'torch_1', x: -3.5, z: -12, radius: 0.35 },
      { type: 'CYLINDER', id: 'torch_2', x: 3.5, z: -12, radius: 0.35 },
      { type: 'CYLINDER', id: 'torch_3', x: -3.5, z: 10.5, radius: 0.35 },
      { type: 'CYLINDER', id: 'torch_4', x: 3.5, z: 10.5, radius: 0.35 },
    ],
  },
  {
    id: 'LOR_02',
    code: 'LORENCIA_EAST_GATE',
    name: 'Lorencia East Gate & Planícies das Bestas',
    biome: 'LORENCIA',
    bounds: { minX: -25, maxX: 25, minZ: -25, maxZ: 25 },
    spawnPoint: { x: -18, z: 0 },
    colliders: [
      { type: 'BOX', id: 'east_gate_north_wall', x: -15, z: 8, width: 4, depth: 14 },
      { type: 'BOX', id: 'east_gate_south_wall', x: -15, z: -8, width: 4, depth: 14 },
      { type: 'CYLINDER', id: 'watchtower_north', x: -15, z: 15, radius: 2.8 },
      { type: 'CYLINDER', id: 'watchtower_south', x: -15, z: -15, radius: 2.8 },
      { type: 'BOX', id: 'rock_outcrop_1', x: 5, z: 10, width: 6, depth: 4.5 },
      { type: 'BOX', id: 'rock_outcrop_2', x: 12, z: -12, width: 7.5, depth: 5 },
      { type: 'CYLINDER', id: 'beast_boulder', x: -2, z: -4, radius: 2 },
    ],
  },
  {
    id: 'LOR_03',
    code: 'LORENCIA_WEST_GATE',
    name: 'Lorencia West Gate & Bosque das Aranhas',
    biome: 'LORENCIA',
    bounds: { minX: -25, maxX: 25, minZ: -25, maxZ: 25 },
    spawnPoint: { x: 18, z: 0 },
    colliders: [
      { type: 'BOX', id: 'west_gate_north_wall', x: 15, z: 8, width: 4, depth: 14 },
      { type: 'BOX', id: 'west_gate_south_wall', x: 15, z: -8, width: 4, depth: 14 },
      { type: 'CYLINDER', id: 'spider_tree_ancient', x: 0, z: 0, radius: 3.5 },
      { type: 'CYLINDER', id: 'spider_tree_1', x: -10, z: 8, radius: 2.2 },
      { type: 'CYLINDER', id: 'spider_tree_2', x: -8, z: -12, radius: 2.4 },
      { type: 'CYLINDER', id: 'spider_tree_3', x: 6, z: -14, radius: 1.8 },
      { type: 'BOX', id: 'webbed_ruins', x: -14, z: 12, width: 5.5, depth: 6 },
    ],
  },
  {
    id: 'LOR_04',
    code: 'LORENCIA_NORTH_GATE',
    name: 'Lorencia North Gate & Ponte do Castelo Real',
    biome: 'LORENCIA',
    bounds: { minX: -20, maxX: 20, minZ: -30, maxZ: 15 },
    spawnPoint: { x: 0, z: 10 },
    colliders: [
      { type: 'BOX', id: 'chasm_left', x: -14, z: -10, width: 12, depth: 28 },
      { type: 'BOX', id: 'chasm_right', x: 14, z: -10, width: 12, depth: 28 },
      { type: 'BOX', id: 'bridge_left_railing', x: -4.5, z: -10, width: 1, depth: 28 },
      { type: 'BOX', id: 'bridge_right_railing', x: 4.5, z: -10, width: 1, depth: 28 },
      { type: 'CYLINDER', id: 'royal_bastion_left', x: -6, z: -25, radius: 3 },
      { type: 'CYLINDER', id: 'royal_bastion_right', x: 6, z: -25, radius: 3 },
    ],
  },
  {
    id: 'LOR_05',
    code: 'LORENCIA_SOUTH_CEMETERY',
    name: 'Lorencia South Cemetery (Cemitério dos Caídos)',
    biome: 'LORENCIA',
    bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
    spawnPoint: { x: 0, z: 18 },
    colliders: [
      { type: 'BOX', id: 'mausoleum_grand', x: 0, z: -8, width: 8.5, depth: 7 },
      { type: 'BOX', id: 'crypt_left', x: -12, z: 2, width: 4.5, depth: 5 },
      { type: 'BOX', id: 'crypt_right', x: 12, z: 2, width: 4.5, depth: 5 },
      { type: 'CYLINDER', id: 'statue_weeping_angel', x: 0, z: 5, radius: 1.4 },
      { type: 'BOX', id: 'cemetery_fence_back', x: 0, z: -19, width: 36, depth: 1.5 },
      { type: 'CYLINDER', id: 'dead_willow_tree', x: -8, z: -14, radius: 2.1 },
    ],
  },
  {
    id: 'LOR_06',
    code: 'LORENCIA_TAVERN_INTERIOR',
    name: 'Lorencia Tavern (A Taverna da Lareira)',
    biome: 'LORENCIA',
    bounds: { minX: -12, maxX: 12, minZ: -10, maxZ: 10 },
    spawnPoint: { x: 0, z: 7 },
    colliders: [
      { type: 'BOX', id: 'tavern_counter', x: -6, z: -2, width: 2.5, depth: 9 },
      { type: 'BOX', id: 'hearth_fireplace', x: 0, z: -8.8, width: 6, depth: 2 },
      { type: 'CYLINDER', id: 'table_round_1', x: 4, z: 2, radius: 1.6 },
      { type: 'CYLINDER', id: 'table_round_2', x: 4, z: -5, radius: 1.6 },
      { type: 'BOX', id: 'ale_barrels', x: -9.5, z: -7, width: 3, depth: 3.5 },
    ],
  },
  {
    id: 'LOR_07',
    code: 'LORENCIA_BLACKSMITH_FORGE',
    name: 'Lorencia Blacksmith (A Forja de Hanzo)',
    biome: 'LORENCIA',
    bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
    spawnPoint: { x: 0, z: 6 },
    colliders: [
      { type: 'BOX', id: 'forge_furnace', x: 0, z: -6.5, width: 6.5, depth: 3.5 },
      { type: 'CYLINDER', id: 'giant_anvil', x: 0, z: -1, radius: 1.4 },
      { type: 'BOX', id: 'water_quenching_trough', x: -5.5, z: -1.5, width: 2.2, depth: 5 },
      { type: 'BOX', id: 'weapon_rack', x: 6, z: 0, width: 1.8, depth: 6 },
    ],
  },
  // --------------------------------------------------------------------------
  // 2. NORIA (7 CENÁRIOS)
  // --------------------------------------------------------------------------
  {
    id: 'NOR_01',
    code: 'NORIA_SANCTUARY',
    name: 'Noria Sanctuary (A Grande Árvore Mãe & Praça Élfica)',
    biome: 'NORIA',
    bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
    spawnPoint: { x: 0, z: 12 },
    colliders: [
      { type: 'CYLINDER', id: 'mother_tree_trunk', x: 0, z: -5, radius: 5.2 },
      { type: 'CYLINDER', id: 'mother_root_se', x: 4.8, z: -1.5, radius: 1.8 },
      { type: 'CYLINDER', id: 'mother_root_sw', x: -4.8, z: -1.5, radius: 1.8 },
      { type: 'CYLINDER', id: 'mother_root_nw', x: -4.5, z: -8.5, radius: 1.8 },
      { type: 'CYLINDER', id: 'mother_root_ne', x: 4.5, z: -8.5, radius: 1.8 },
      { type: 'CYLINDER', id: 'elf_fountain', x: 0, z: 6.5, radius: 2.2 },
      { type: 'BOX', id: 'elf_pavilion_west', x: -13, z: 2, width: 5, depth: 7 },
      { type: 'BOX', id: 'elf_pavilion_east', x: 13, z: 2, width: 5, depth: 7 },
    ],
  },
  {
    id: 'NOR_02',
    code: 'NORIA_CHAOS_MACHINE',
    name: 'Noria Chaos Machine (Oficina dos Duendes)',
    biome: 'NORIA',
    bounds: { minX: -14, maxX: 14, minZ: -14, maxZ: 14 },
    spawnPoint: { x: 0, z: 8 },
    colliders: [
      { type: 'CYLINDER', id: 'chaos_machine_platform', x: 0, z: 0, radius: 3.2 },
      { type: 'CYLINDER', id: 'chaos_gear_column_1', x: -2.5, z: -2.5, radius: 0.9 },
      { type: 'CYLINDER', id: 'chaos_gear_column_2', x: 2.5, z: -2.5, radius: 0.9 },
      { type: 'BOX', id: 'goblin_workbench_left', x: -8.5, z: 3, width: 3.5, depth: 6 },
      { type: 'BOX', id: 'goblin_workbench_right', x: 8.5, z: 3, width: 3.5, depth: 6 },
      { type: 'BOX', id: 'chaos_chest_vault', x: 0, z: -10, width: 6, depth: 2.5 },
    ],
  },
  {
    id: 'NOR_03',
    code: 'NORIA_QUEEN_ALTAR',
    name: 'Noria Queen\'s Altar (Altar da Rainha Lúthien)',
    biome: 'NORIA',
    bounds: { minX: -18, maxX: 18, minZ: -18, maxZ: 18 },
    spawnPoint: { x: 0, z: 12 },
    colliders: [
      { type: 'BOX', id: 'queen_pedestal', x: 0, z: -4, width: 5, depth: 4.5 },
      { type: 'CYLINDER', id: 'queen_statue', x: 0, z: -4, radius: 1.2 },
      { type: 'CYLINDER', id: 'sacred_pool', x: 0, z: 4.5, radius: 3.2 },
      { type: 'CYLINDER', id: 'rune_pillar_nw', x: -6, z: -8, radius: 0.9 },
      { type: 'CYLINDER', id: 'rune_pillar_ne', x: 6, z: -8, radius: 0.9 },
      { type: 'CYLINDER', id: 'rune_pillar_sw', x: -6, z: 0, radius: 0.9 },
      { type: 'CYLINDER', id: 'rune_pillar_se', x: 6, z: 0, radius: 0.9 },
    ],
  },
  {
    id: 'NOR_04',
    code: 'NORIA_EAST_GROVES',
    name: 'Noria East Groves (Bosque das Ninfas)',
    biome: 'NORIA',
    bounds: { minX: -24, maxX: 24, minZ: -24, maxZ: 24 },
    spawnPoint: { x: -16, z: 0 },
    colliders: [
      { type: 'CYLINDER', id: 'grove_tree_1', x: -6, z: -8, radius: 2.5 },
      { type: 'CYLINDER', id: 'grove_tree_2', x: 8, z: -10, radius: 2.8 },
      { type: 'CYLINDER', id: 'grove_tree_3', x: 4, z: 12, radius: 2.4 },
      { type: 'CYLINDER', id: 'grove_tree_4', x: -10, z: 14, radius: 2.2 },
      { type: 'BOX', id: 'nymph_monolith', x: 0, z: 0, width: 3.5, depth: 3.5 },
    ],
  },
  {
    id: 'NOR_05',
    code: 'NORIA_GIANT_MUSHROOM_GLADE',
    name: 'Noria Giant Mushroom Glade (Clareira dos Fungos Colossais)',
    biome: 'NORIA',
    bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
    spawnPoint: { x: 0, z: 15 },
    colliders: [
      { type: 'CYLINDER', id: 'giant_mushroom_center', x: 0, z: 0, radius: 3.8 },
      { type: 'CYLINDER', id: 'giant_mushroom_left', x: -10, z: -6, radius: 2.8 },
      { type: 'CYLINDER', id: 'giant_mushroom_right', x: 10, z: -6, radius: 2.8 },
      { type: 'CYLINDER', id: 'spore_node_1', x: -5, z: 8, radius: 1.6 },
      { type: 'CYLINDER', id: 'spore_node_2', x: 6, z: 7, radius: 1.6 },
    ],
  },
  {
    id: 'NOR_06',
    code: 'NORIA_DEEP_CANYON',
    name: 'Noria Deep Canyon (Garganta das Vinhas & Ponte Pênsil)',
    biome: 'NORIA',
    bounds: { minX: -15, maxX: 15, minZ: -28, maxZ: 28 },
    spawnPoint: { x: 0, z: 22 },
    colliders: [
      { type: 'BOX', id: 'canyon_abyss_left', x: -10, z: 0, width: 8, depth: 40 },
      { type: 'BOX', id: 'canyon_abyss_right', x: 10, z: 0, width: 8, depth: 40 },
      { type: 'BOX', id: 'rope_bridge_railing_l', x: -3.2, z: 0, width: 0.6, depth: 36 },
      { type: 'BOX', id: 'rope_bridge_railing_r', x: 3.2, z: 0, width: 0.6, depth: 36 },
    ],
  },
  {
    id: 'NOR_07',
    code: 'NORIA_CREEPER_HOLLOW',
    name: 'Noria Creeper Hollow (Covil do Stone Golem)',
    biome: 'NORIA',
    bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
    spawnPoint: { x: 0, z: 16 },
    colliders: [
      { type: 'CYLINDER', id: 'golem_torso_boulder', x: 0, z: -3, radius: 4.2 },
      { type: 'BOX', id: 'crag_west', x: -14, z: 0, width: 6, depth: 16 },
      { type: 'BOX', id: 'crag_east', x: 14, z: 0, width: 6, depth: 16 },
      { type: 'BOX', id: 'crag_north', x: 0, z: -16, width: 22, depth: 6 },
      { type: 'CYLINDER', id: 'earth_pillar_1', x: -6, z: 6, radius: 1.5 },
      { type: 'CYLINDER', id: 'earth_pillar_2', x: 6, z: 6, radius: 1.5 },
    ],
  },
  // --------------------------------------------------------------------------
  // 3. DEVIAS (6 CENÁRIOS)
  // --------------------------------------------------------------------------
  {
    id: 'DEV_01',
    code: 'DEVIAS_GLACIAL_CITADEL',
    name: 'Devias Glacial Citadel (A Fortaleza & Grande Braseiro do Rei)',
    biome: 'DEVIAS',
    bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
    spawnPoint: { x: 0, z: 14 },
    colliders: [
      { type: 'CYLINDER', id: 'kings_hearth_brazier', x: 0, z: 0, radius: 3.5 },
      { type: 'CYLINDER', id: 'brazier_flame_core', x: 0, z: 0, radius: 1.2 },
      { type: 'BOX', id: 'fortress_wall_nw', x: -14, z: -10, width: 8, depth: 16 },
      { type: 'BOX', id: 'fortress_wall_ne', x: 14, z: -10, width: 8, depth: 16 },
      { type: 'CYLINDER', id: 'ice_pillar_1', x: -7, z: -8, radius: 1.2 },
      { type: 'CYLINDER', id: 'ice_pillar_2', x: 7, z: -8, radius: 1.2 },
      { type: 'CYLINDER', id: 'ice_pillar_3', x: -7, z: 6, radius: 1.2 },
      { type: 'CYLINDER', id: 'ice_pillar_4', x: 7, z: 6, radius: 1.2 },
    ],
  },
  {
    id: 'DEV_02',
    code: 'DEVIAS_CATHEDRAL',
    name: 'Devias Cathedral (Fachada da Basílica Boreal)',
    biome: 'DEVIAS',
    bounds: { minX: -20, maxX: 20, minZ: -24, maxZ: 16 },
    spawnPoint: { x: 0, z: 10 },
    colliders: [
      { type: 'BOX', id: 'cathedral_main_facade', x: 0, z: -14, width: 22, depth: 8 },
      { type: 'CYLINDER', id: 'bell_tower_left', x: -10, z: -14, radius: 3 },
      { type: 'CYLINDER', id: 'bell_tower_right', x: 10, z: -14, radius: 3 },
      { type: 'BOX', id: 'frozen_stairs', x: 0, z: -8, width: 9, depth: 3 },
    ],
  },
  {
    id: 'DEV_03',
    code: 'DEVIAS_NORTH_SNOWFIELDS',
    name: 'Devias North Snowfields (Campos de Nevasca do Norte)',
    biome: 'DEVIAS',
    bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
    spawnPoint: { x: 0, z: -20 },
    colliders: [
      { type: 'BOX', id: 'shipwreck_icebound', x: -10, z: -5, width: 8, depth: 14 },
      { type: 'CYLINDER', id: 'glacier_hump_1', x: 8, z: 8, radius: 4 },
      { type: 'CYLINDER', id: 'glacier_hump_2', x: -12, z: 12, radius: 3.5 },
      { type: 'BOX', id: 'ice_cliff_barrier', x: 0, z: 22, width: 44, depth: 4 },
    ],
  },
  {
    id: 'DEV_04',
    code: 'DEVIAS_ICE_SHARD_RIDGE',
    name: 'Devias Ice Shard Ridge (Crista dos Espinhos de Gelo)',
    biome: 'DEVIAS',
    bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
    spawnPoint: { x: 0, z: 16 },
    colliders: [
      { type: 'CYLINDER', id: 'ice_spike_colossal', x: 0, z: 0, radius: 3.2 },
      { type: 'CYLINDER', id: 'ice_spike_cluster_1', x: -9, z: -8, radius: 2.4 },
      { type: 'CYLINDER', id: 'ice_spike_cluster_2', x: 9, z: -8, radius: 2.4 },
      { type: 'CYLINDER', id: 'ice_spike_cluster_3', x: -8, z: 8, radius: 2 },
      { type: 'CYLINDER', id: 'ice_spike_cluster_4', x: 8, z: 8, radius: 2 },
    ],
  },
  {
    id: 'DEV_05',
    code: 'DEVIAS_FROZEN_ABYSS',
    name: 'Devias Frozen Abyss Bridge (Ponte do Abismo Pergelissolo)',
    biome: 'DEVIAS',
    bounds: { minX: -14, maxX: 14, minZ: -26, maxZ: 26 },
    spawnPoint: { x: 0, z: 20 },
    colliders: [
      { type: 'BOX', id: 'chasm_void_left', x: -9.5, z: 0, width: 7, depth: 46 },
      { type: 'BOX', id: 'chasm_void_right', x: 9.5, z: 0, width: 7, depth: 46 },
      { type: 'BOX', id: 'bridge_ice_railing_left', x: -3, z: 0, width: 0.5, depth: 44 },
      { type: 'BOX', id: 'bridge_ice_railing_right', x: 3, z: 0, width: 0.5, depth: 44 },
    ],
  },
  {
    id: 'DEV_06',
    code: 'DEVIAS_ICE_QUEEN_PALACE',
    name: 'Devias Ice Queen Palace (O Trono Lapidado da Rainha do Gelo)',
    biome: 'DEVIAS',
    bounds: { minX: -18, maxX: 18, minZ: -18, maxZ: 18 },
    spawnPoint: { x: 0, z: 13 },
    colliders: [
      { type: 'BOX', id: 'queen_ice_throne_dais', x: 0, z: -6.5, width: 6, depth: 5.5 },
      { type: 'CYLINDER', id: 'ice_queen_statue_frost', x: 0, z: -6.5, radius: 1.4 },
      { type: 'CYLINDER', id: 'crystalline_column_nw', x: -6, z: -10, radius: 1 },
      { type: 'CYLINDER', id: 'crystalline_column_ne', x: 6, z: -10, radius: 1 },
      { type: 'CYLINDER', id: 'crystalline_column_sw', x: -6, z: 2, radius: 1 },
      { type: 'CYLINDER', id: 'crystalline_column_se', x: 6, z: 2, radius: 1 },
    ],
  },
  // --------------------------------------------------------------------------
  // 4. DUNGEON (6 CENÁRIOS)
  // --------------------------------------------------------------------------
  {
    id: 'DNG_01',
    code: 'DUNGEON_ENTRANCE',
    name: 'Dungeon 1: Entrada & Ossuário Ancestral',
    biome: 'DUNGEON',
    bounds: { minX: -18, maxX: 18, minZ: -18, maxZ: 18 },
    spawnPoint: { x: 0, z: 12 },
    colliders: [
      { type: 'BOX', id: 'ossuary_pyramid', x: 0, z: -2, width: 5.5, depth: 5.5 },
      { type: 'BOX', id: 'dungeon_gate_left', x: -9, z: 14, width: 8, depth: 3 },
      { type: 'BOX', id: 'dungeon_gate_right', x: 9, z: 14, width: 8, depth: 3 },
      { type: 'CYLINDER', id: 'skull_brazier_1', x: -4, z: 6, radius: 0.8 },
      { type: 'CYLINDER', id: 'skull_brazier_2', x: 4, z: 6, radius: 0.8 },
      { type: 'BOX', id: 'crypt_wall_north', x: 0, z: -14, width: 26, depth: 4 },
    ],
  },
  {
    id: 'DNG_02',
    code: 'DUNGEON_PRISON',
    name: 'Dungeon 2: Corredores das Prisões & Grilhões',
    biome: 'DUNGEON',
    bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
    spawnPoint: { x: -14, z: 0 },
    colliders: [
      { type: 'BOX', id: 'cell_block_north_1', x: -6, z: 12, width: 7, depth: 6 },
      { type: 'BOX', id: 'cell_block_north_2', x: 6, z: 12, width: 7, depth: 6 },
      { type: 'BOX', id: 'cell_block_south_1', x: -6, z: -12, width: 7, depth: 6 },
      { type: 'BOX', id: 'cell_block_south_2', x: 6, z: -12, width: 7, depth: 6 },
      { type: 'CYLINDER', id: 'iron_cage_gibbet', x: 0, z: 0, radius: 1.5 },
    ],
  },
  {
    id: 'DNG_03',
    code: 'DUNGEON_POISON_CRYPTS',
    name: 'Dungeon 3: Criptas Venenosas & Poços de Lodo',
    biome: 'DUNGEON',
    bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
    spawnPoint: { x: 0, z: 14 },
    colliders: [
      { type: 'HAZARD', id: 'acid_pool_center', x: 0, z: 0, radius: 3.8 },
      { type: 'BOX', id: 'poison_tomb_left', x: -10, z: -6, width: 4.5, depth: 6 },
      { type: 'BOX', id: 'poison_tomb_right', x: 10, z: -6, width: 4.5, depth: 6 },
      { type: 'CYLINDER', id: 'slime_vent_1', x: -6, z: 8, radius: 1 },
      { type: 'CYLINDER', id: 'slime_vent_2', x: 6, z: 8, radius: 1 },
    ],
  },
  {
    id: 'DNG_04',
    code: 'DUNGEON_TORTURE_PIT',
    name: 'Dungeon 4: Poço de Tortura & Fornalhas de Sangue',
    biome: 'DUNGEON',
    bounds: { minX: -18, maxX: 18, minZ: -18, maxZ: 18 },
    spawnPoint: { x: 0, z: 12 },
    colliders: [
      { type: 'BOX', id: 'rack_of_torture', x: -5, z: -2, width: 4.5, depth: 3 },
      { type: 'CYLINDER', id: 'iron_maiden', x: 5, z: -2, radius: 1.4 },
      { type: 'CYLINDER', id: 'blood_furnace', x: 0, z: -10, radius: 2.6 },
      { type: 'BOX', id: 'spike_grate_floor', x: 0, z: 4, width: 6, depth: 3.5 },
    ],
  },
  {
    id: 'DNG_05',
    code: 'DUNGEON_LOST_SOULS_MAZE',
    name: 'Dungeon 5: Labirinto das Almas Perdidas',
    biome: 'DUNGEON',
    bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
    spawnPoint: { x: -16, z: -16 },
    colliders: [
      { type: 'BOX', id: 'maze_wall_h1', x: -4, z: -8, width: 18, depth: 2.5 },
      { type: 'BOX', id: 'maze_wall_h2', x: 6, z: 4, width: 18, depth: 2.5 },
      { type: 'BOX', id: 'maze_wall_v1', x: -10, z: 4, width: 2.5, depth: 16 },
      { type: 'BOX', id: 'maze_wall_v2', x: 4, z: -6, width: 2.5, depth: 14 },
      { type: 'CYLINDER', id: 'spectral_monolith', x: 12, z: 12, radius: 2 },
    ],
  },
  {
    id: 'DNG_06',
    code: 'DUNGEON_GORGON_LAIR',
    name: 'Dungeon 6: O Covil Abissal da Górgona',
    biome: 'DUNGEON',
    bounds: { minX: -24, maxX: 24, minZ: -24, maxZ: 24 },
    spawnPoint: { x: 0, z: 18 },
    colliders: [
      { type: 'BOX', id: 'gorgon_dais', x: 0, z: -6, width: 8, depth: 7 },
      { type: 'CYLINDER', id: 'gorgon_throne_sculpt', x: 0, z: -7, radius: 2.2 },
      { type: 'CYLINDER', id: 'petrified_warrior_1', x: -6, z: 2, radius: 1.1 },
      { type: 'CYLINDER', id: 'petrified_warrior_2', x: 6, z: 2, radius: 1.1 },
      { type: 'CYLINDER', id: 'petrified_archer', x: -8, z: -10, radius: 0.9 },
      { type: 'CYLINDER', id: 'serpent_pillar_1', x: -12, z: 6, radius: 1.8 },
      { type: 'CYLINDER', id: 'serpent_pillar_2', x: 12, z: 6, radius: 1.8 },
    ],
  },
  // --------------------------------------------------------------------------
  // 5. LOST TOWER (7 CENÁRIOS)
  // --------------------------------------------------------------------------
  {
    id: 'LT_01',
    code: 'LOST_TOWER_GATEWAY',
    name: 'Lost Tower 1: Portal de Obsidiana & Chamas',
    biome: 'LOST_TOWER',
    bounds: { minX: -18, maxX: 18, minZ: -22, maxZ: 14 },
    spawnPoint: { x: 0, z: 8 },
    colliders: [
      { type: 'BOX', id: 'obsidian_arch_left', x: -7, z: -12, width: 4, depth: 6 },
      { type: 'BOX', id: 'obsidian_arch_right', x: 7, z: -12, width: 4, depth: 6 },
      { type: 'BOX', id: 'obsidian_lintel', x: 0, z: -12, width: 14, depth: 3 },
      { type: 'CYLINDER', id: 'infernal_brazier_l', x: -4, z: -4, radius: 1.2 },
      { type: 'CYLINDER', id: 'infernal_brazier_r', x: 4, z: -4, radius: 1.2 },
    ],
  },
  {
    id: 'LT_02',
    code: 'LOST_TOWER_RUNED_CORRIDORS',
    name: 'Lost Tower 2: Corredores Rúnicos Incandescentes',
    biome: 'LOST_TOWER',
    bounds: { minX: -16, maxX: 16, minZ: -28, maxZ: 28 },
    spawnPoint: { x: 0, z: 22 },
    colliders: [
      { type: 'BOX', id: 'runed_wall_left', x: -8.5, z: 0, width: 4, depth: 48 },
      { type: 'BOX', id: 'runed_wall_right', x: 8.5, z: 0, width: 4, depth: 48 },
      { type: 'CYLINDER', id: 'demon_pillar_center1', x: 0, z: 8, radius: 1.1 },
      { type: 'CYLINDER', id: 'demon_pillar_center2', x: 0, z: -8, radius: 1.1 },
    ],
  },
  {
    id: 'LT_03',
    code: 'LOST_TOWER_MAGMA_GRATES',
    name: 'Lost Tower 3: Grelhas de Ferro sobre Mar de Magma',
    biome: 'LOST_TOWER',
    bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
    spawnPoint: { x: 0, z: 14 },
    colliders: [
      { type: 'HAZARD', id: 'magma_pit_sw', x: -8, z: 5, radius: 4.5 },
      { type: 'HAZARD', id: 'magma_pit_se', x: 8, z: 5, radius: 4.5 },
      { type: 'HAZARD', id: 'magma_pit_north', x: 0, z: -8, radius: 5.5 },
      { type: 'CYLINDER', id: 'iron_support_col_1', x: -4, z: -1, radius: 1.2 },
      { type: 'CYLINDER', id: 'iron_support_col_2', x: 4, z: -1, radius: 1.2 },
    ],
  },
  {
    id: 'LT_04',
    code: 'LOST_TOWER_DEMON_BALCONY',
    name: 'Lost Tower 4: Mirante Demoníaco & Gárgulas',
    biome: 'LOST_TOWER',
    bounds: { minX: -22, maxX: 22, minZ: -16, maxZ: 18 },
    spawnPoint: { x: 0, z: 6 },
    colliders: [
      { type: 'BOX', id: 'balcony_abyss_railing', x: 0, z: -12, width: 36, depth: 2 },
      { type: 'CYLINDER', id: 'gargoyle_perch_left', x: -14, z: -10, radius: 2.2 },
      { type: 'CYLINDER', id: 'gargoyle_perch_right', x: 14, z: -10, radius: 2.2 },
      { type: 'BOX', id: 'tower_core_back', x: 0, z: 14, width: 20, depth: 5 },
    ],
  },
  {
    id: 'LT_05',
    code: 'LOST_TOWER_SPIRAL_COLONNADE',
    name: 'Lost Tower 5: Colunata Espiral Ascendente',
    biome: 'LOST_TOWER',
    bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
    spawnPoint: { x: 0, z: 14 },
    colliders: [
      { type: 'CYLINDER', id: 'spiral_core_pillar', x: 0, z: 0, radius: 4.2 },
      { type: 'CYLINDER', id: 'colonnade_col_1', x: -9, z: 0, radius: 1.3 },
      { type: 'CYLINDER', id: 'colonnade_col_2', x: 9, z: 0, radius: 1.3 },
      { type: 'CYLINDER', id: 'colonnade_col_3', x: 0, z: -9, radius: 1.3 },
      { type: 'CYLINDER', id: 'colonnade_col_4', x: 0, z: 9, radius: 1.3 },
    ],
  },
  {
    id: 'LT_06',
    code: 'LOST_TOWER_INFERNAL_RAMPARTS',
    name: 'Lost Tower 6: Muralhas Infernais & Balistas',
    biome: 'LOST_TOWER',
    bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
    spawnPoint: { x: 0, z: -16 },
    colliders: [
      { type: 'BOX', id: 'rampart_wall_front', x: 0, z: 12, width: 38, depth: 4 },
      { type: 'BOX', id: 'demon_ballista_left', x: -10, z: 6, width: 4.5, depth: 5 },
      { type: 'BOX', id: 'demon_ballista_right', x: 10, z: 6, width: 4.5, depth: 5 },
      { type: 'CYLINDER', id: 'hellfire_mortar', x: 0, z: -2, radius: 2.2 },
    ],
  },
  {
    id: 'LT_07',
    code: 'LOST_TOWER_BALROG_THRONE',
    name: 'Lost Tower 7: O Pináculo & Trono de Fogo do Balrog',
    biome: 'LOST_TOWER',
    bounds: { minX: -24, maxX: 24, minZ: -24, maxZ: 24 },
    spawnPoint: { x: 0, z: 16 },
    colliders: [
      { type: 'BOX', id: 'balrog_throne_dais', x: 0, z: -8, width: 9, depth: 8 },
      { type: 'CYLINDER', id: 'balrog_magma_seat', x: 0, z: -9, radius: 2.6 },
      { type: 'CYLINDER', id: 'pillar_of_fire_nw', x: -10, z: -14, radius: 1.8 },
      { type: 'CYLINDER', id: 'pillar_of_fire_ne', x: 10, z: -14, radius: 1.8 },
      { type: 'CYLINDER', id: 'pillar_of_fire_sw', x: -10, z: 6, radius: 1.8 },
      { type: 'CYLINDER', id: 'pillar_of_fire_se', x: 10, z: 6, radius: 1.8 },
      { type: 'HAZARD', id: 'sacrificial_pit', x: 0, z: 2, radius: 3.2 },
    ],
  },
  // --------------------------------------------------------------------------
  // 6. ATLANS (7 CENÁRIOS)
  // --------------------------------------------------------------------------
  {
    id: 'ATL_01',
    code: 'ATLANS_SHALLOS',
    name: 'Atlans 1: Águas Rasas & Recifes com Caustics',
    biome: 'ATLANS',
    bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
    spawnPoint: { x: 0, z: 14 },
    colliders: [
      { type: 'CYLINDER', id: 'coral_spire_center', x: 0, z: -2, radius: 3.2 },
      { type: 'CYLINDER', id: 'coral_spire_left', x: -10, z: 4, radius: 2.2 },
      { type: 'CYLINDER', id: 'coral_spire_right', x: 10, z: 4, radius: 2.2 },
      { type: 'BOX', id: 'nacar_slab', x: 0, z: -12, width: 7, depth: 4.5 },
    ],
  },
  {
    id: 'ATL_02',
    code: 'ATLANS_NACAR_SANCTUARY',
    name: 'Atlans 2: Santuário de Nácar (Cúpula de Ar Élfica)',
    biome: 'ATLANS',
    bounds: { minX: -18, maxX: 18, minZ: -18, maxZ: 18 },
    spawnPoint: { x: 0, z: 12 },
    colliders: [
      { type: 'CYLINDER', id: 'nacar_altar_platform', x: 0, z: 0, radius: 3.8 },
      { type: 'CYLINDER', id: 'air_bubble_generator', x: 0, z: 0, radius: 1.1 },
      { type: 'CYLINDER', id: 'sanctuary_column_nw', x: -7, z: -7, radius: 0.9 },
      { type: 'CYLINDER', id: 'sanctuary_column_ne', x: 7, z: -7, radius: 0.9 },
      { type: 'CYLINDER', id: 'sanctuary_column_sw', x: -7, z: 7, radius: 0.9 },
      { type: 'CYLINDER', id: 'sanctuary_column_se', x: 7, z: 7, radius: 0.9 },
    ],
  },
  {
    id: 'ATL_03',
    code: 'ATLANS_CORAL_LABYRINTH',
    name: 'Atlans 3: Labirinto dos Corais Magenta & Anêmonas',
    biome: 'ATLANS',
    bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
    spawnPoint: { x: -16, z: 0 },
    colliders: [
      { type: 'BOX', id: 'coral_wall_1', x: -6, z: -8, width: 14, depth: 3 },
      { type: 'BOX', id: 'coral_wall_2', x: 6, z: 8, width: 14, depth: 3 },
      { type: 'CYLINDER', id: 'giant_anemone_1', x: 4, z: -4, radius: 2.8 },
      { type: 'CYLINDER', id: 'giant_anemone_2', x: -6, z: 6, radius: 2.8 },
    ],
  },
  {
    id: 'ATL_04',
    code: 'ATLANS_SLIPSTREAM_TRENCH',
    name: 'Atlans 4: Trincheira das Correntes & Anéis Marinhos',
    biome: 'ATLANS',
    bounds: { minX: -16, maxX: 16, minZ: -30, maxZ: 30 },
    spawnPoint: { x: 0, z: 24 },
    colliders: [
      { type: 'BOX', id: 'trench_wall_left', x: -9, z: 0, width: 5, depth: 52 },
      { type: 'BOX', id: 'trench_wall_right', x: 9, z: 0, width: 5, depth: 52 },
      { type: 'CYLINDER', id: 'hydro_ring_pylon_1', x: 0, z: 10, radius: 1 },
      { type: 'CYLINDER', id: 'hydro_ring_pylon_2', x: 0, z: -10, radius: 1 },
    ],
  },
  {
    id: 'ATL_05',
    code: 'ATLANS_LEVIATHAN_GRAVEYARD',
    name: 'Atlans 5: Cemitério de Leviatãs & Esqueleto Ciclópico',
    biome: 'ATLANS',
    bounds: { minX: -24, maxX: 24, minZ: -24, maxZ: 24 },
    spawnPoint: { x: 0, z: 16 },
    colliders: [
      { type: 'BOX', id: 'leviathan_skull', x: 0, z: -12, width: 7, depth: 8.5 },
      { type: 'BOX', id: 'ribcage_left', x: -8, z: 0, width: 3.5, depth: 16 },
      { type: 'BOX', id: 'ribcage_right', x: 8, z: 0, width: 3.5, depth: 16 },
      { type: 'BOX', id: 'sunken_galleon', x: 12, z: 10, width: 6, depth: 12 },
    ],
  },
  {
    id: 'ATL_06',
    code: 'ATLANS_HYDROTHERMAL_FISSURES',
    name: 'Atlans 6: Fendas Hidrotermais & Basalto Vulcânico',
    biome: 'ATLANS',
    bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
    spawnPoint: { x: 0, z: 14 },
    colliders: [
      { type: 'CYLINDER', id: 'black_smoker_chimney1', x: -6, z: -4, radius: 2.2 },
      { type: 'CYLINDER', id: 'black_smoker_chimney2', x: 6, z: -4, radius: 2.2 },
      { type: 'CYLINDER', id: 'black_smoker_chimney3', x: 0, z: 6, radius: 1.8 },
      { type: 'HAZARD', id: 'fissure_magma_vent', x: 0, z: -12, radius: 3.5 },
    ],
  },
  {
    id: 'ATL_07',
    code: 'ATLANS_HYDRA_MAW',
    name: 'Atlans 7: O Fosso Abissal da Grande Hydra Marinha',
    biome: 'ATLANS',
    bounds: { minX: -24, maxX: 24, minZ: -24, maxZ: 24 },
    spawnPoint: { x: 0, z: 18 },
    colliders: [
      { type: 'HAZARD', id: 'hydra_maw_abyss', x: 0, z: -4, radius: 6.5 },
      { type: 'CYLINDER', id: 'hydra_tentacle_spire1', x: -10, z: -12, radius: 2 },
      { type: 'CYLINDER', id: 'hydra_tentacle_spire2', x: 10, z: -12, radius: 2 },
      { type: 'CYLINDER', id: 'hydra_tentacle_spire3', x: -12, z: 4, radius: 2 },
      { type: 'CYLINDER', id: 'hydra_tentacle_spire4', x: 12, z: 4, radius: 2 },
    ],
  },
  // --------------------------------------------------------------------------
  // 7. TARKAN (5 CENÁRIOS)
  // --------------------------------------------------------------------------
  {
    id: 'TAR_01',
    code: 'TARKAN_CRIMSON_DUNES',
    name: 'Tarkan 1: Dunas de Areia Carmesim & Tempestades',
    biome: 'TARKAN',
    bounds: { minX: -25, maxX: 25, minZ: -25, maxZ: 25 },
    spawnPoint: { x: 0, z: 18 },
    colliders: [
      { type: 'CYLINDER', id: 'dune_crest_1', x: -10, z: -8, radius: 5.5 },
      { type: 'CYLINDER', id: 'dune_crest_2', x: 10, z: 6, radius: 6 },
      { type: 'BOX', id: 'petrified_monolith', x: 0, z: -2, width: 4.5, depth: 4.5 },
      { type: 'CYLINDER', id: 'desert_cairn', x: -6, z: 10, radius: 1.5 },
    ],
  },
  {
    id: 'TAR_02',
    code: 'TARKAN_BOILING_OASIS',
    name: 'Tarkan 2: Oásis Fervilhante & Palmeiras Ressecadas',
    biome: 'TARKAN',
    bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
    spawnPoint: { x: 0, z: 14 },
    colliders: [
      { type: 'HAZARD', id: 'boiling_water_pool', x: 0, z: 0, radius: 4.8 },
      { type: 'CYLINDER', id: 'dead_palm_tree_1', x: -7, z: -6, radius: 1.2 },
      { type: 'CYLINDER', id: 'dead_palm_tree_2', x: 7, z: -6, radius: 1.2 },
      { type: 'CYLINDER', id: 'dead_palm_tree_3', x: 0, z: 8, radius: 1.2 },
      { type: 'BOX', id: 'salt_crust_formation', x: 10, z: 4, width: 5, depth: 4 },
    ],
  },
  {
    id: 'TAR_03',
    code: 'TARKAN_LEVIATHAN_SPINE',
    name: 'Tarkan 3: Espinhaço do Grande Verme do Deserto',
    biome: 'TARKAN',
    bounds: { minX: -22, maxX: 22, minZ: -28, maxZ: 28 },
    spawnPoint: { x: 0, z: 22 },
    colliders: [
      { type: 'BOX', id: 'worm_skull_fossil', x: 0, z: -18, width: 8, depth: 9 },
      { type: 'BOX', id: 'worm_rib_arc_left', x: -7, z: 0, width: 3, depth: 26 },
      { type: 'BOX', id: 'worm_rib_arc_right', x: 7, z: 0, width: 3, depth: 26 },
      { type: 'CYLINDER', id: 'keratin_spike', x: 0, z: 6, radius: 1.8 },
    ],
  },
  {
    id: 'TAR_04',
    code: 'TARKAN_IRON_SCRAPYARD',
    name: 'Tarkan 4: Cemitério de Autômatos & Rodas de Ferro',
    biome: 'TARKAN',
    bounds: { minX: -24, maxX: 24, minZ: -24, maxZ: 24 },
    spawnPoint: { x: -16, z: 0 },
    colliders: [
      { type: 'CYLINDER', id: 'colossal_iron_wheel_1', x: 0, z: -8, radius: 4.5 },
      { type: 'CYLINDER', id: 'colossal_iron_wheel_2', x: 6, z: 8, radius: 3.8 },
      { type: 'BOX', id: 'automaton_chassis_wreck', x: -8, z: 6, width: 6, depth: 5.5 },
      { type: 'BOX', id: 'scrap_pile_high', x: 12, z: -10, width: 6, depth: 7 },
    ],
  },
  {
    id: 'TAR_05',
    code: 'TARKAN_ZAIKAN_CRATER',
    name: 'Tarkan 5: A Cratera de Areia Movediça de Zaikan',
    biome: 'TARKAN',
    bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
    spawnPoint: { x: 0, z: 20 },
    colliders: [
      { type: 'HAZARD', id: 'quicksand_vortex_center', x: 0, z: 0, radius: 7 },
      { type: 'CYLINDER', id: 'zaikan_altar_monolith', x: 0, z: -14, radius: 2.8 },
      { type: 'CYLINDER', id: 'crater_bone_horn_left', x: -12, z: -8, radius: 2 },
      { type: 'CYLINDER', id: 'crater_bone_horn_right', x: 12, z: -8, radius: 2 },
    ],
  },
  // --------------------------------------------------------------------------
  // 8. ICARUS (2 CENÁRIOS)
  // --------------------------------------------------------------------------
  {
    id: 'ICA_01',
    code: 'ICARUS_CITADEL',
    name: 'Icarus Aethel: Cidadela Central & Núcleo de Aetherita',
    biome: 'ICARUS',
    bounds: { minX: -24, maxX: 24, minZ: -24, maxZ: 24 },
    spawnPoint: { x: 0, z: -4 },
    colliders: [
      { type: 'RADIAL_BOUNDARY', id: 'center_island_void', x: 0, z: 0, maxRadius: 9.5 },
      { type: 'CYLINDER', id: 'aetherite_pedestal', x: 0, z: 0, radius: 1.6 },
      { type: 'CYLINDER', id: 'light_prism_monolith_1', x: -6, z: -5, radius: 1.2 },
      { type: 'CYLINDER', id: 'light_prism_monolith_2', x: 6, z: -5, radius: 1.2 },
    ],
  },
  {
    id: 'ICA_02',
    code: 'ICARUS_PHOENIX_NEST',
    name: 'Icarus Aethel: Dark Phoenix Lotus Nest (Ninho da Fênix)',
    biome: 'ICARUS',
    bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
    spawnPoint: { x: 0, z: 5 },
    colliders: [
      { type: 'RADIAL_BOUNDARY', id: 'phoenix_nest_void', x: 0, z: 0, maxRadius: 10.5 },
      { type: 'CYLINDER', id: 'phoenix_nest_core', x: 0, z: -3.5, radius: 3.5 },
      { type: 'CYLINDER', id: 'flame_feather_spire_nw', x: -6, z: -8, radius: 1.4 },
      { type: 'CYLINDER', id: 'flame_feather_spire_ne', x: 6, z: -8, radius: 1.4 },
    ],
  },
  // --------------------------------------------------------------------------
  // 9. VALLEY OF LOREN & CASTLE SIEGE (5 CENÁRIOS)
  // --------------------------------------------------------------------------
  {
    id: 'VOL_01',
    code: 'VALLEY_OF_LOREN_SIEGE_CAMP',
    name: 'Valley of Loren: Campo de Guerra & Acampamento das Alianças',
    biome: 'VALLEY_OF_LOREN',
    bounds: { minX: -40, maxX: 40, minZ: -30, maxZ: 30 },
    spawnPoint: { x: 0, z: -28 },
    safeZone: true,
    instanced: true,
    colliders: [
      { type: 'BOX', id: 'catapult_nw', x: -18, z: -18, width: 6, depth: 4, height: 3.5 },
      { type: 'BOX', id: 'catapult_ne', x: 18, z: -18, width: 6, depth: 4, height: 3.5 },
      { type: 'BOX', id: 'catapult_s', x: 0, z: -22, width: 6, depth: 4, height: 3.5 },
      { type: 'BOX', id: 'guild_command_tent', x: -26, z: 6, width: 9, depth: 8, height: 3 },
      { type: 'BOX', id: 'alliance_banner_marker_n', x: 12, z: -6, width: 1.2, depth: 1.2 },
      { type: 'BOX', id: 'alliance_banner_marker_s', x: -12, z: -6, width: 1.2, depth: 1.2 },
      { type: 'BOX', id: 'trench_palisade_west', x: -30, z: -8, width: 1.6, depth: 20, height: 2.2 },
      { type: 'BOX', id: 'trench_palisade_east', x: 30, z: -8, width: 1.6, depth: 20, height: 2.2 },
    ],
  },
  {
    id: 'VOL_02',
    code: 'VALLEY_OF_LOREN_FIRST_BASTION',
    name: 'Valley of Loren: Primeiro Baluarte & Portão Ciclópico de Ferro',
    biome: 'VALLEY_OF_LOREN',
    bounds: { minX: -30, maxX: 30, minZ: -20, maxZ: 20 },
    spawnPoint: { x: 0, z: -16 },
    instanced: true,
    destructibleHp: {
      cyclopean_iron_gate: 25_000_000,
    },
    colliders: [
      { type: 'BOX', id: 'cyclopean_iron_gate', x: 0, z: 6, width: 8, depth: 1.2, height: 10 },
      { type: 'CYLINDER', id: 'keep_tower_west', x: -12, z: 6, radius: 3.5 },
      { type: 'CYLINDER', id: 'keep_tower_east', x: 12, z: 6, radius: 3.5 },
      { type: 'BOX', id: 'curtain_wall_west', x: -21, z: 6, width: 14, depth: 2.5, height: 10 },
      { type: 'BOX', id: 'curtain_wall_east', x: 21, z: 6, width: 14, depth: 2.5, height: 10 },
    ],
  },
  {
    id: 'VOL_03',
    code: 'VALLEY_OF_LOREN_LIFE_STATUES',
    name: 'Valley of Loren: Pátio das Estátuas da Vida',
    biome: 'VALLEY_OF_LOREN',
    bounds: { minX: -35, maxX: 35, minZ: -25, maxZ: 25 },
    spawnPoint: { x: 0, z: -20 },
    instanced: true,
    destructibleHp: {
      life_statue_nw: 8_000_000,
      life_statue_ne: 8_000_000,
      life_statue_sw: 8_000_000,
      life_statue_se: 8_000_000,
    },
    colliders: [
      { type: 'CYLINDER', id: 'life_statue_nw', x: -12, z: 8, radius: 1.8, height: 7 },
      { type: 'CYLINDER', id: 'life_statue_ne', x: 12, z: 8, radius: 1.8, height: 7 },
      { type: 'CYLINDER', id: 'life_statue_sw', x: -12, z: -8, radius: 1.8, height: 7 },
      { type: 'CYLINDER', id: 'life_statue_se', x: 12, z: -8, radius: 1.8, height: 7 },
      { type: 'CYLINDER', id: 'bastion_cannon_west', x: -26, z: 0, radius: 2 },
      { type: 'CYLINDER', id: 'bastion_cannon_east', x: 26, z: 0, radius: 2 },
      { type: 'BOX', id: 'courtyard_wall_north', x: 0, z: 18, width: 70, depth: 2, height: 9 },
      { type: 'BOX', id: 'courtyard_wall_south', x: 0, z: -18, width: 70, depth: 2, height: 9 },
    ],
  },
  {
    id: 'VOL_04',
    code: 'VALLEY_OF_LOREN_DRAWBRIDGE_CHOKE',
    name: 'Valley of Loren: O Gargalo da Ponte Levadiça sobre o Fosso de Lava',
    biome: 'VALLEY_OF_LOREN',
    bounds: { minX: -25, maxX: 25, minZ: -15, maxZ: 15 },
    spawnPoint: { x: 0, z: -12 },
    instanced: true,
    colliders: [
      { type: 'BOX', id: 'drawbridge_parapet_west', x: -3.6, z: 0, width: 1, depth: 24, height: 1.1 },
      { type: 'BOX', id: 'drawbridge_parapet_east', x: 3.6, z: 0, width: 1, depth: 24, height: 1.1 },
      { type: 'HAZARD', id: 'lava_pit_west', x: -14, z: 0, radius: 9.5 },
      { type: 'HAZARD', id: 'lava_pit_east', x: 14, z: 0, radius: 9.5 },
      { type: 'CYLINDER', id: 'oil_cauldron_nw', x: -8, z: 10, radius: 1.2 },
      { type: 'CYLINDER', id: 'oil_cauldron_ne', x: 8, z: 10, radius: 1.2 },
    ],
  },
  {
    id: 'VOL_05',
    code: 'VALLEY_OF_LOREN_CROWN_SEAL',
    name: 'Valley of Loren: O Salão do Trono Real & O Selo da Coroa',
    biome: 'VALLEY_OF_LOREN',
    bounds: { minX: -22, maxX: 22, minZ: -22, maxZ: 22 },
    spawnPoint: { x: 0, z: -18 },
    instanced: true,
    colliders: [
      { type: 'BOX', id: 'royal_throne_dais', x: 0, z: 14, width: 6, depth: 5, height: 4.5 },
      { type: 'CYLINDER', id: 'sacred_pedestal_west', x: -8, z: 10, radius: 1 },
      { type: 'CYLINDER', id: 'sacred_pedestal_east', x: 8, z: 10, radius: 1 },
      { type: 'CYLINDER', id: 'alabaster_column_nw', x: -14, z: 6, radius: 1.2, height: 10 },
      { type: 'CYLINDER', id: 'alabaster_column_ne', x: 14, z: 6, radius: 1.2, height: 10 },
      { type: 'CYLINDER', id: 'alabaster_column_w1', x: -14, z: -2, radius: 1.2, height: 10 },
      { type: 'CYLINDER', id: 'alabaster_column_e1', x: 14, z: -2, radius: 1.2, height: 10 },
      { type: 'CYLINDER', id: 'alabaster_column_w2', x: -14, z: -10, radius: 1.2, height: 10 },
      { type: 'CYLINDER', id: 'alabaster_column_e2', x: 14, z: -10, radius: 1.2, height: 10 },
      { type: 'CYLINDER', id: 'alabaster_column_sw', x: -8, z: -16, radius: 1.2, height: 10 },
      { type: 'CYLINDER', id: 'alabaster_column_se', x: 8, z: -16, radius: 1.2, height: 10 },
    ],
  },
  // --------------------------------------------------------------------------
  // 10. EVENT ARENAS & DESAFIOS CLÁSSICOS (4 CENÁRIOS)
  // --------------------------------------------------------------------------
  {
    id: 'EVT_01',
    code: 'BLOOD_CASTLE_MARTYRDOM',
    name: 'Blood Castle: A Ponte de Martírio do Arcanjo',
    biome: 'BLOOD_CASTLE',
    bounds: { minX: -10, maxX: 10, minZ: -36, maxZ: 36 },
    spawnPoint: { x: 0, z: -32 },
    instanced: true,
    destructibleHp: {
      archangel_gate: 5_000_000,
    },
    colliders: [
      { type: 'BOX', id: 'bc_parapet_left', x: -8.5, z: 0, width: 1, depth: 72, height: 1.2 },
      { type: 'BOX', id: 'bc_parapet_right', x: 8.5, z: 0, width: 1, depth: 72, height: 1.2 },
      { type: 'BOX', id: 'archangel_gate', x: 0, z: 26, width: 18, depth: 1.5, height: 8 },
      { type: 'CYLINDER', id: 'bc_gate_pylon_w', x: -7, z: 26, radius: 1.5 },
      { type: 'CYLINDER', id: 'bc_gate_pylon_e', x: 7, z: 26, radius: 1.5 },
      { type: 'CYLINDER', id: 'bc_altar_base', x: 0, z: 34, radius: 3 },
      { type: 'CYLINDER', id: 'bc_archangel_1', x: -7, z: -28, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_2', x: 7, z: -28, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_3', x: -7, z: -20, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_4', x: 7, z: -20, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_5', x: -7, z: -12, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_6', x: 7, z: -12, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_7', x: -7, z: -4, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_8', x: 7, z: -4, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_9', x: -7, z: 4, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_10', x: 7, z: 4, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_11', x: -7, z: 12, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_12', x: 7, z: 12, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_13', x: -7, z: 18, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_14', x: 7, z: 18, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_15', x: -7, z: 30, radius: 1.2 },
      { type: 'CYLINDER', id: 'bc_archangel_16', x: 7, z: 30, radius: 1.2 },
    ],
  },
  {
    id: 'EVT_02',
    code: 'DEVIL_SQUARE_PENTAGRAM',
    name: 'Devil Square: A Praça Circular da Carnificina Pentagramal',
    biome: 'DEVIL_SQUARE',
    bounds: { minX: -25, maxX: 25, minZ: -25, maxZ: 25 },
    spawnPoint: { x: 0, z: -20 },
    instanced: true,
    colliders: [
      { type: 'RADIAL_BOUNDARY', id: 'devil_square_ring', x: 0, z: 0, maxRadius: 24.5 },
      { type: 'CYLINDER', id: 'skull_totem_north', x: 0, z: 16, radius: 1.4, height: 6 },
      { type: 'CYLINDER', id: 'skull_totem_east', x: 16, z: 0, radius: 1.4, height: 6 },
      { type: 'CYLINDER', id: 'skull_totem_south', x: 0, z: -16, radius: 1.4, height: 6 },
      { type: 'CYLINDER', id: 'skull_totem_west', x: -16, z: 0, radius: 1.4, height: 6 },
      { type: 'CYLINDER', id: 'triumph_chest_pedestal', x: 0, z: 0, radius: 1.2 },
    ],
  },
  {
    id: 'EVT_03',
    code: 'CHAOS_CASTLE_SUSPENDED_COLISEUM',
    name: 'Chaos Castle: O Coliseu Suspenso das Lajes Desabantes',
    biome: 'CHAOS_CASTLE',
    bounds: { minX: -21, maxX: 21, minZ: -21, maxZ: 21 },
    spawnPoint: { x: 0, z: 0 },
    instanced: true,
    colliders: [
      { type: 'RADIAL_BOUNDARY', id: 'chaos_castle_abyss_ring', x: 0, z: 0, maxRadius: 20.5 },
      { type: 'BOX', id: 'tile_ring_outer_n', x: 0, z: 17.5, width: 7, depth: 7 },
      { type: 'BOX', id: 'tile_ring_outer_s', x: 0, z: -17.5, width: 7, depth: 7 },
      { type: 'BOX', id: 'tile_ring_outer_e', x: 17.5, z: 0, width: 7, depth: 7 },
      { type: 'BOX', id: 'tile_ring_outer_w', x: -17.5, z: 0, width: 7, depth: 7 },
      { type: 'BOX', id: 'tile_ring_mid_n', x: 0, z: 10.5, width: 7, depth: 7 },
      { type: 'BOX', id: 'tile_ring_mid_s', x: 0, z: -10.5, width: 7, depth: 7 },
      { type: 'BOX', id: 'tile_ring_mid_e', x: 10.5, z: 0, width: 7, depth: 7 },
      { type: 'BOX', id: 'tile_ring_mid_w', x: -10.5, z: 0, width: 7, depth: 7 },
    ],
  },
  {
    id: 'EVT_04',
    code: 'DUEL_COLISEUM_GLORY',
    name: 'Coliseu de Duelos: A Grande Arena da Glória',
    biome: 'DUEL_COLISEUM',
    bounds: { minX: -18, maxX: 18, minZ: -18, maxZ: 18 },
    spawnPoint: { x: -8, z: -8 },
    instanced: true,
    colliders: [
      { type: 'RADIAL_BOUNDARY', id: 'force_barrier_dome', x: 0, z: 0, maxRadius: 17.5 },
      { type: 'CYLINDER', id: 'octagon_plinth_n', x: 0, z: 13, radius: 1 },
      { type: 'CYLINDER', id: 'octagon_plinth_s', x: 0, z: -13, radius: 1 },
      { type: 'CYLINDER', id: 'octagon_plinth_e', x: 13, z: 0, radius: 1 },
      { type: 'CYLINDER', id: 'octagon_plinth_w', x: -13, z: 0, radius: 1 },
      { type: 'CYLINDER', id: 'holographic_scoreboard_pylon', x: 0, z: 0, radius: 1.5 },
    ],
  },
];

export class CollisionSystem {
  public static readonly DEFAULT_PLAYER_RADIUS = PLAYER_RADIUS_FALLBACK; // Metros (Cápsula de herói)
  public static readonly DEFAULT_PLAYER_HEIGHT = 1.85; // Metros (Altura oficial da cápsula)
  public static readonly DEFAULT_STEP_HEIGHT = 0.35; // Metros (Altura de passo para degraus)

  /**
   * Catálogo de Colisores Oficiais do Bestiário Canônico (MU Online Season 5.2)
   */
  public static readonly MONSTER_COLLISIONS: Record<string, { radius: number; height: number; stepHeight: number }> = Object.freeze({
    SPIDER: { radius: 0.45, height: 0.70, stepHeight: 0.25 },
    HOUND: { radius: 0.50, height: 1.10, stepHeight: 0.30 },
    BUDGE_DRAGON: { radius: 0.40, height: 1.00, stepHeight: 0.25 },
    BULL_FIGHTER: { radius: 0.65, height: 1.90, stepHeight: 0.35 },
    SKELETON: { radius: 0.45, height: 1.80, stepHeight: 0.35 },
    LICH: { radius: 0.55, height: 1.90, stepHeight: 0.35 },
    DEATH_KNIGHT: { radius: 0.60, height: 2.10, stepHeight: 0.35 },

    // Chefes Canônicos
    GORGON: { radius: 0.85, height: 2.40, stepHeight: 0.35 },
    ICE_QUEEN: { radius: 0.55, height: 2.00, stepHeight: 0.35 },
    BALROG: { radius: 1.10, height: 3.20, stepHeight: 0.45 },
    HYDRA: { radius: 1.40, height: 3.00, stepHeight: 0.45 },
    ZAIKAN: { radius: 1.20, height: 2.80, stepHeight: 0.45 },
    KUNDUN: { radius: 1.50, height: 3.60, stepHeight: 0.45 },

    // Invasão Dourada
    GOLDEN_BUDGE_DRAGON: { radius: 0.40, height: 1.00, stepHeight: 0.25 },
    GOLDEN_TITAN: { radius: 0.90, height: 2.60, stepHeight: 0.40 },
    GOLDEN_SOLDIER: { radius: 0.60, height: 2.10, stepHeight: 0.35 },
    GOLDEN_DRAGON: { radius: 1.20, height: 2.80, stepHeight: 0.45 },
    GOLDEN_LIZARD_KING: { radius: 0.85, height: 2.40, stepHeight: 0.40 },
    GOLDEN_TANTALOS: { radius: 1.20, height: 2.80, stepHeight: 0.45 },
  });

  public static getMonsterCollision(type: string): { radius: number; height: number; stepHeight: number } {
    const key = String(type || '').trim().toUpperCase();
    return CollisionSystem.MONSTER_COLLISIONS[key] || {
      radius: CollisionSystem.DEFAULT_PLAYER_RADIUS,
      height: CollisionSystem.DEFAULT_PLAYER_HEIGHT,
      stepHeight: CollisionSystem.DEFAULT_STEP_HEIGHT,
    };
  }

  /**
   * Catálogo Oficial de todos os 56 Cenários Canônicos e suas Barreiras Físicas.
   * Indexado por ID canônico (`LOR_01`) e por código (`LORENCIA_CITADEL`).
   */
  public static readonly SCENARIOS: Record<string, ScenarioDefinition> = {};

  static {
    for (const entry of SCENARIO_CATALOG) {
      CollisionSystem.registerScenario(entry);
    }
  }

  public static registerScenario(def: ScenarioCatalogEntry): void {
    // Clone defensivo: o catálogo é imutável, o registry não deve ser mutado por acidente.
    const scenario: ScenarioDefinition = {
      ...def,
      bounds: { ...def.bounds },
      spawnPoint: { ...def.spawnPoint },
      colliders: def.colliders.map((c) => ({ ...c })),
      destructibleHp: def.destructibleHp ? { ...def.destructibleHp } : undefined,
    };
    CollisionSystem.SCENARIOS[def.id] = scenario;
    CollisionSystem.SCENARIOS[def.code] = scenario;
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

  /** Cenários de um bioma/zona específico */
  public static getScenariosByBiome(biome: ScenarioBiome): ScenarioDefinition[] {
    return CollisionSystem.getAllScenarios().filter((s) => s.biome === biome);
  }

  /** Cenários do mundo aberto (exclui arenas instanciadas de Cerco e Eventos) */
  public static getOpenWorldScenarios(): ScenarioDefinition[] {
    return CollisionSystem.getAllScenarios().filter((s) => !s.instanced);
  }

  /** HP atual de estruturas destrutíveis (portão ciclópico, Estátuas da Vida) */
  public static getDestructibleHp(scenarioId: string, colliderId: string): number | undefined {
    return CollisionSystem.getScenario(scenarioId)?.destructibleHp?.[colliderId];
  }

  /**
   * Resolve colisão física do jogador com deslizamento (Sliding Response)
   * @param scenarioId ID ou Código do cenário
   * @param currentPos Posição atual { x, z }
   * @param targetPos Posição desejada { x, z }
   * @param playerRadius Raio da cápsula (padrão 0.45m)
   */
  public static resolveMovement(
    scenarioId: string,
    currentPos: { x: number; z: number },
    targetPos: { x: number; z: number },
    playerRadius: number = CollisionSystem.DEFAULT_PLAYER_RADIUS
  ): MovementResolution {
    const scenario = CollisionSystem.getScenario(scenarioId) || CollisionSystem.SCENARIOS['LOR_01'];
    let finalX = targetPos.x;
    let finalZ = targetPos.z;
    let collided = false;
    const collidersHit: string[] = [];
    const hazardsHit: string[] = [];

    // 1. Clampa nos limites externos da cena
    const clampedX = Math.max(scenario.bounds.minX + playerRadius, Math.min(scenario.bounds.maxX - playerRadius, finalX));
    const clampedZ = Math.max(scenario.bounds.minZ + playerRadius, Math.min(scenario.bounds.maxZ - playerRadius, finalZ));
    if (clampedX !== finalX || clampedZ !== finalZ) {
      collided = true;
      collidersHit.push('BOUNDS_OUTER');
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
          if (col.type === 'HAZARD') {
            // Zonas de perigo são atravessáveis: apenas sinalizam dano/queda.
            hazardsHit.push(col.id);
            continue;
          }
          collidersHit.push(col.id);
          if (dist > 0.0001) {
            const nx = dx / dist;
            const nz = dz / dist;
            // Projeta o jogador para fora do raio do cilindro (deslizamento radial)
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
          collidersHit.push(col.id);

          // Restringe faces de saída válidas baseadas na direção de aproximação do jogador (anti-tunneling)
          const dLeft = Math.abs(finalX - minBoxX);
          const dRight = Math.abs(maxBoxX - finalX);
          const dTop = Math.abs(maxBoxZ - finalZ);
          const dBottom = Math.abs(finalZ - minBoxZ);

          const fromLeft = currentPos.x <= minBoxX;
          const fromRight = currentPos.x >= maxBoxX;
          const fromBottom = currentPos.z <= minBoxZ;
          const fromTop = currentPos.z >= maxBoxZ;

          let minD = Infinity;
          let edge = 'bottom';

          if (fromLeft && dLeft < minD) { minD = dLeft; edge = 'left'; }
          if (fromRight && dRight < minD) { minD = dRight; edge = 'right'; }
          if (fromBottom && dBottom < minD) { minD = dBottom; edge = 'bottom'; }
          if (fromTop && dTop < minD) { minD = dTop; edge = 'top'; }

          // Fallback se o jogador já começou dentro da AABB
          if (minD === Infinity) {
            minD = Math.min(dLeft, dRight, dTop, dBottom);
            if (minD === dLeft) edge = 'left';
            else if (minD === dRight) edge = 'right';
            else if (minD === dBottom) edge = 'bottom';
            else edge = 'top';
          }

          if (edge === 'left') finalX = minBoxX;
          else if (edge === 'right') finalX = maxBoxX;
          else if (edge === 'bottom') finalZ = minBoxZ;
          else if (edge === 'top') finalZ = maxBoxZ;
        }
      } else if (col.type === 'RADIAL_BOUNDARY') {
        const dx = finalX - col.x;
        const dz = finalZ - col.z;
        const dist = Math.hypot(dx, dz);
        const maxAllowed = col.maxRadius - playerRadius;

        if (dist > maxAllowed) {
          collided = true;
          collidersHit.push(col.id);
          if (dist > 0.0001) {
            const nx = dx / dist;
            const nz = dz / dist;
            finalX = col.x + nx * maxAllowed;
            finalZ = col.z + nz * maxAllowed;
          }
        }
      }
    }

    return { x: finalX, z: finalZ, collided, collidersHit, hazardsHit };
  }
}
