/**
 * Dasi MMORPG - Dark Spirit & Guardian Pet Combat Engine
 * Engenharia reversa e implementação canônica baseada nas fontes Webzen C++ GameServer:
 * - DarkSpirit.h / DarkSpirit.cpp
 * - GameServerInfo - Character.dat
 * 
 * Fórmulas Canônicas Webzen:
 * - Dano Mínimo: 180 + (PetLevel * 15) + Math.floor(Command / 8)
 * - Dano Máximo: 200 + (PetLevel * 15) + Math.floor(Command / 4)
 * - Velocidade de Ataque: 20 + Math.floor(PetLevel * 4 / 5) + Math.floor(Command / 50)
 * - Taxa de Ataque (Success Rate): 1000 + (PetLevel * 16)
 * - Chance de Ataque em Área (Range Attack): 30%
 * - Chance de Dano Crítico: 30%
 * - Bônus de Cetro (Scepter Rise): ((MagicDamageRate / 2) + Level * 2)%
 * 
 * Modificadores Canônicos de Guardiões:
 * - Satan: +30% Dano Causado
 * - Guardian Angel: 20% Dano Absorvido (Redução)
 * - Dinorant: +15% Dano Causado, 10% Dano Absorvido
 * - Black Fenrir: +10% Dano Causado
 * - Blue Fenrir: 10% Dano Absorvido
 * - Dark Horse: 30% + Math.floor(Level / 2)% Dano Absorvido
 * - Earthquake Skill: (Strength / 10) + (Command / 5) + (Level * 10)
 */

export const DarkSpiritMode = {
  NORMAL: 0,             // Standby / segue o mestre
  ATTACK_RANDOM: 1,      // Ataca aleatoriamente alvos dentro do alcance (8 tiles)
  ATTACK_WITH_MASTER: 2, // Ataca o mesmo alvo que o mestre atacar
  ATTACK_TARGET: 3,      // Focado exclusivamente em um alvo específico
} as const;

export type DarkSpiritMode = typeof DarkSpiritMode[keyof typeof DarkSpiritMode];

export interface DarkSpiritStats {
  level: number;
  durability: number;
  minDamage: number;
  maxDamage: number;
  attackSpeed: number;
  attackSuccessRate: number;
  criticalRate: number;
  rangeAttackRate: number;
}

export interface DarkHorseStats {
  level: number;
  durability: number;
  damageAbsorptionPercent: number;
  earthquakeDamageMin: number;
  earthquakeDamageMax: number;
}

export class DarkSpiritManager {
  /**
   * Calcula os atributos completos do Corvo das Trevas (Dark Spirit)
   */
  public static calculateDarkSpiritStats(
    petLevel: number,
    masterCommand: number,
    scepter?: { level: number; magicDamageRate: number }
  ): DarkSpiritStats {
    const clampedLevel = Math.max(1, Math.min(50, petLevel));

    // Constantes canônicas de GameServerInfo - Character.dat
    let minDmg = 180 + clampedLevel * 15 + Math.floor(masterCommand / 8);
    let maxDmg = 200 + clampedLevel * 15 + Math.floor(masterCommand / 4);

    // Amplificação por Cetro (Scepter Rise)
    if (scepter && scepter.magicDamageRate > 0) {
      const risePercent = Math.floor(scepter.magicDamageRate / 2) + scepter.level * 2;
      minDmg += Math.floor((minDmg * risePercent) / 100);
      maxDmg += Math.floor((maxDmg * risePercent) / 100);
    }

    const speed = 20 + Math.floor((clampedLevel * 4) / 5) + Math.floor(masterCommand / 50);
    const successRate = 1000 + clampedLevel * 16;

    return {
      level: clampedLevel,
      durability: 255,
      minDamage: minDmg,
      maxDamage: maxDmg,
      attackSpeed: speed,
      attackSuccessRate: successRate,
      criticalRate: 30, // 30%
      rangeAttackRate: 30, // 30%
    };
  }

  /**
   * Executa um ataque do Dark Spirit contra um monstro ou jogador alvo
   */
  public static processDarkSpiritAttack(
    stats: DarkSpiritStats,
    targetDefense: number,
    randomRoll: number = Math.random(),
    critRoll: number = Math.random()
  ): {
    damage: number;
    isCritical: boolean;
    isRangeAttack: boolean;
  } {
    // Sorteio de dano entre Min e Max
    const baseDamage = stats.minDamage + Math.floor(randomRoll * (stats.maxDamage - stats.minDamage + 1));
    const effectiveDamage = Math.max(1, baseDamage - targetDefense);

    const isCritical = critRoll * 100 < stats.criticalRate;
    const finalDamage = isCritical ? Math.floor(effectiveDamage * 1.5) : effectiveDamage;
    const isRangeAttack = Math.random() * 100 < stats.rangeAttackRate;

    return {
      damage: finalDamage,
      isCritical,
      isRangeAttack,
    };
  }

  /**
   * Calcula os atributos defensivos e de skill do Cavalo das Trevas (Dark Horse)
   */
  public static calculateDarkHorseStats(
    horseLevel: number,
    masterStrength: number,
    masterCommand: number
  ): DarkHorseStats {
    const clampedLevel = Math.max(1, Math.min(50, horseLevel));

    // Absorção: 30% base + Math.floor(Level / 2)%
    const absorb = 30 + Math.floor(clampedLevel / 2);

    // Dano da Skill Earthquake: (Str / 10) + (Cmd / 5) + (Level * 10)
    const eqBase = Math.floor(masterStrength / 10) + Math.floor(masterCommand / 5) + clampedLevel * 10;
    const eqMin = 100 + eqBase;
    const eqMax = 150 + eqBase;

    return {
      level: clampedLevel,
      durability: 255,
      damageAbsorptionPercent: absorb,
      earthquakeDamageMin: eqMin,
      earthquakeDamageMax: eqMax,
    };
  }

  /**
   * Retorna os multiplicadores de dano causado e absorvido de pets guardiões (Satan, Angel, Dinorant, Fenrir)
   */
  public static getGuardianModifiers(helperDefId?: string): {
    damageIncreasePercent: number;
    damageAbsorptionPercent: number;
  } {
    if (!helperDefId) return { damageIncreasePercent: 0, damageAbsorptionPercent: 0 };

    switch (helperDefId) {
      case 'satan':
        return { damageIncreasePercent: 30, damageAbsorptionPercent: 0 };
      case 'guardian_angel':
        return { damageIncreasePercent: 0, damageAbsorptionPercent: 20 };
      case 'dinorant':
        return { damageIncreasePercent: 15, damageAbsorptionPercent: 10 };
      case 'fenrir_black':
        return { damageIncreasePercent: 10, damageAbsorptionPercent: 0 };
      case 'fenrir_blue':
        return { damageIncreasePercent: 0, damageAbsorptionPercent: 10 };
      case 'fenrir_gold':
        return { damageIncreasePercent: 15, damageAbsorptionPercent: 15 };
      default:
        return { damageIncreasePercent: 0, damageAbsorptionPercent: 0 };
    }
  }
}
