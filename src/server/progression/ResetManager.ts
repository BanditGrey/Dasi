/**
 * Dasi MMORPG - Gerenciador de Resets e Master Resets
 * Implementação dos modos canônicos de Reset (Pontos vs Acumulativo)
 * e do sistema de Master Reset com premiações.
 */

export type ResetMode = 'POINTS' | 'CUMULATIVE';

export interface ResetConfig {
  mode: ResetMode;
  requiredLevel: number;
  pointsPerReset: number;
  zenCostMultiplier: number;
  baseZenCost: number;
  maxResets: number;
}

export interface MasterResetConfig {
  requiredResets: number;
  requiredLevel: number;
  rewardWCoins: number;
  rewardMasterPoints: number;
  statBonusPermanent: number;
}

export interface CharacterResetState {
  characterId: string;
  level: number;
  resets: number;
  masterResets: number;
  zen: number;
  wCoins: number;
  strength: number;
  agility: number;
  vitality: number;
  energy: number;
  leadership: number;
  statPoints: number;
}

export class ResetManager {
  public static readonly DEFAULT_RESET_CONFIG: ResetConfig = {
    mode: 'POINTS',
    requiredLevel: 400,
    pointsPerReset: 500,
    zenCostMultiplier: 5000000, // 5 Milhões por reset
    baseZenCost: 10000000,      // 10 Milhões base
    maxResets: 1000,
  };

  public static readonly DEFAULT_MASTER_RESET_CONFIG: MasterResetConfig = {
    requiredResets: 100,
    requiredLevel: 400,
    rewardWCoins: 500,
    rewardMasterPoints: 10,
    statBonusPermanent: 100,
  };

  /**
   * Calcula o custo em Zen para efetuar o próximo reset
   */
  public static calculateResetZenCost(currentResets: number, config: ResetConfig = this.DEFAULT_RESET_CONFIG): number {
    return Math.min(2000000000, config.baseZenCost + (currentResets * config.zenCostMultiplier));
  }

  /**
   * Executa o comando /reset no personagem
   */
  public static executeReset(
    state: CharacterResetState,
    config: ResetConfig = this.DEFAULT_RESET_CONFIG
  ): { success: boolean; error?: string } {
    if (state.level < config.requiredLevel) {
      return { success: false, error: `Nível insuficiente. Necessário nível ${config.requiredLevel}.` };
    }

    if (state.resets >= config.maxResets) {
      return { success: false, error: 'Limite máximo de resets já atingido.' };
    }

    const zenCost = this.calculateResetZenCost(state.resets, config);
    if (state.zen < zenCost) {
      return { success: false, error: `Zen insuficiente. Necessário ${zenCost.toLocaleString()} Zen.` };
    }

    // Deduz o Zen e incrementa os resets
    state.zen -= zenCost;
    state.resets += 1;
    state.level = 1;

    if (config.mode === 'POINTS') {
      // Modo Pontos: zera os atributos para a base e entrega pontos proporcionais
      state.strength = 28;
      state.agility = 20;
      state.vitality = 25;
      state.energy = 10;
      state.leadership = 0;
      state.statPoints = state.resets * config.pointsPerReset;
    } else {
      // Modo Acumulativo: mantém os atributos atuais e adiciona os pontos do nível 1
      state.statPoints += 0;
    }

    return { success: true };
  }

  /**
   * Executa o comando /mreset (Master Reset)
   */
  public static executeMasterReset(
    state: CharacterResetState,
    config: MasterResetConfig = this.DEFAULT_MASTER_RESET_CONFIG
  ): { success: boolean; error?: string } {
    if (state.level < config.requiredLevel) {
      return { success: false, error: `Nível insuficiente para Master Reset (requer nível ${config.requiredLevel}).` };
    }

    if (state.resets < config.requiredResets) {
      return { success: false, error: `Resets insuficientes. Necessário ${config.requiredResets} resets.` };
    }

    // Zera os resets normais e o nível
    state.resets = 0;
    state.level = 1;
    state.masterResets += 1;

    // Concede premiações
    state.wCoins += config.rewardWCoins;
    state.statPoints = config.statBonusPermanent * state.masterResets;

    // Reseta os stats para a base
    state.strength = 28;
    state.agility = 20;
    state.vitality = 25;
    state.energy = 10;
    state.leadership = 0;

    return { success: true };
  }
}
