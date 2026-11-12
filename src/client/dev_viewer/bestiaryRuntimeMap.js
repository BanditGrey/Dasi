/**
 * Liga tipos autoritativos do servidor aos protótipos canônicos oficiais do bestiário.
 * Os modelos GLB canônicos extraídos diretamente do cliente oficial de MU Online Season 5.2
 * substituem as geometrias procedurais por completo.
 */
const runtimeModel = (fallbackType, modelId = null, scale = 1, labelHeight = 1.9, isBoss = false, animatedPath = null) =>
  Object.freeze({ fallbackType, modelId, scale, labelHeight, isBoss, animatedPath });

export const BESTIARY_RUNTIME_MODELS = Object.freeze({
  spider: runtimeModel('SPIDER', null, 1.0, 1.9, false, 'models/monsters/spider_animated.glb'),
  hound: runtimeModel('HOUND', null, 1.0, 1.9, false, 'models/monsters/hound_animated.glb'),
  budge_dragon: runtimeModel('BUDGE_DRAGON', null, 1.0, 1.9, false, 'models/monsters/dragon_animated.glb'),
  bull_fighter: runtimeModel('BULL_FIGHTER', null, 1.0, 2.2, false, 'models/monsters/bull_fighter_animated.glb'),
  skeleton: runtimeModel('SKELETON', null, 1.0, 2.2, false, 'models/monsters/skeleton_animated.glb'),
  lich: runtimeModel('LICH', null, 1.0, 2.4, false, 'models/monsters/lich_animated.glb'),
  death_knight: runtimeModel('DEATH_KNIGHT'),
  yeti: runtimeModel('YETI', null, 1.0, 2.6, false, 'models/monsters/yeti_animated.glb'),
  demon: runtimeModel('DEMON', null, 1.0, 2.8, false, 'models/monsters/demon_animated.glb'),
  ghost: runtimeModel('GHOST', null, 1.0, 2.0, false, 'models/monsters/ghost_animated.glb'),
  orc: runtimeModel('ORC', null, 1.0, 2.3, false, 'models/monsters/orc_animated.glb'),

  ice_queen: runtimeModel('ICE_QUEEN', 'ICE_QUEEN', 1.0, 2.9, true),
  boss_ice_queen: runtimeModel('ICE_QUEEN', 'ICE_QUEEN', 1.0, 2.9, true),
  gorgon: runtimeModel('GORGON', 'GORGON', 1.0, 3.4, true),
  boss_gorgon: runtimeModel('GORGON', 'GORGON', 1.0, 3.4, true),
  hydra: runtimeModel('HYDRA', 'HYDRA', 1.0, 3.6, true),
  balrog: runtimeModel('BALROG', 'BALROG', 1.0, 3.9, true, 'models/monsters/demon_animated.glb'),
  boss_balrog: runtimeModel('BALROG', 'BALROG', 1.0, 3.9, true, 'models/monsters/demon_animated.glb'),
  zaikan: runtimeModel('ZAIKAN', 'ZAIKAN', 1.0, 3.9, true),
  boss_zaikan: runtimeModel('ZAIKAN', 'ZAIKAN', 1.0, 3.9, true),
  kundun: runtimeModel('KUNDUN', 'KUNDUN', 1.0, 4.2, true),
  boss_kundun: runtimeModel('KUNDUN', 'KUNDUN', 1.0, 4.2, true),

  golden_budge_dragon: runtimeModel('GOLDEN_BUDGE_DRAGON', 'GOLDEN_BUDGE_DRAGON', 1.0, 1.5, false, 'models/monsters/dragon_animated.glb'),
  golden_soldier: runtimeModel('GOLDEN_SOLDIER', 'GOLDEN_SOLDIER', 1.0, 2.5, false, 'models/monsters/skeleton_animated.glb'),
  golden_titan: runtimeModel('GOLDEN_TITAN', 'GOLDEN_TITAN', 1.0, 3.0),
  golden_lizard_king: runtimeModel('GOLDEN_LIZARD_KING', 'GOLDEN_LIZARD_KING', 1.0, 2.8),
  golden_tantalos: runtimeModel('GOLDEN_TANTALOS', 'GOLDEN_TANTALOS', 1.0, 3.2),
  golden_dragon: runtimeModel('GOLDEN_DRAGON', 'GOLDEN_DRAGON', 1.0, 3.0, false, 'models/monsters/dragon_animated.glb'),
});

export function resolveBestiaryRuntimeModel(monsterType) {
  const normalizedType = String(monsterType ?? '').trim().toLowerCase();
  return BESTIARY_RUNTIME_MODELS[normalizedType] ?? null;
}
