/**
 * Liga tipos autoritativos do servidor aos protótipos estáticos do bestiário.
 * O modelo GLB só substitui a malha visual; IA, hitbox, atributos e animação
 * continuam no runtime. GOLDEN_LIZARD_KING é apenas resolvível visualmente:
 * não existe definição de monstro/spawn no servidor até haver balanceamento.
 */
const runtimeModel = (fallbackType, modelId = null, scale = 1, labelHeight = 1.9, isBoss = false) =>
  Object.freeze({ fallbackType, modelId, scale, labelHeight, isBoss });

export const BESTIARY_RUNTIME_MODELS = Object.freeze({
  spider: runtimeModel('SPIDER'),
  hound: runtimeModel('BUDGE_DRAGON'),
  budge_dragon: runtimeModel('BUDGE_DRAGON'),
  bull_fighter: runtimeModel('BULL_FIGHTER'),
  skeleton: runtimeModel('SKELETON'),

  ice_queen: runtimeModel('ICE_QUEEN', 'ICE_QUEEN', 0.95, 2.9, true),
  boss_ice_queen: runtimeModel('ICE_QUEEN', 'ICE_QUEEN', 0.95, 2.9, true),
  gorgon: runtimeModel('GORGON', 'GORGON', 0.82, 3.4, true),
  boss_gorgon: runtimeModel('GORGON', 'GORGON', 0.82, 3.4, true),
  hydra: runtimeModel('BALROG', 'HYDRA', 0.68, 3.6, true),
  balrog: runtimeModel('BALROG', 'BALROG', 0.68, 3.9, true),
  boss_balrog: runtimeModel('BALROG', 'BALROG', 0.68, 3.9, true),
  zaikan: runtimeModel('BALROG', 'ZAIKAN', 0.68, 3.9, true),
  boss_zaikan: runtimeModel('BALROG', 'ZAIKAN', 0.68, 3.9, true),
  kundun: runtimeModel('BALROG', 'KUNDUN', 0.68, 3.8, true),
  boss_kundun: runtimeModel('BALROG', 'KUNDUN', 0.68, 3.8, true),

  golden_budge_dragon: runtimeModel('BUDGE_DRAGON', 'GOLDEN_BUDGE_DRAGON', 0.95, 2.4),
  golden_soldier: runtimeModel('GOLDEN_TITAN', 'GOLDEN_SOLDIER', 0.72, 3.0),
  golden_titan: runtimeModel('GOLDEN_TITAN', 'GOLDEN_TITAN', 0.72, 3.2),
  golden_lizard_king: runtimeModel('GOLDEN_TITAN', 'GOLDEN_LIZARD_KING', 0.8, 2.8),
  golden_tantalos: runtimeModel('GOLDEN_TITAN', 'GOLDEN_TANTALOS', 0.62, 3.4),
  golden_dragon: runtimeModel('GOLDEN_TITAN', 'GOLDEN_DRAGON', 0.48, 3.0),
});

export function resolveBestiaryRuntimeModel(monsterType) {
  const normalizedType = String(monsterType ?? '').trim().toLowerCase();
  return BESTIARY_RUNTIME_MODELS[normalizedType] ?? null;
}
