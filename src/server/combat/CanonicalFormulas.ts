/**
 * Dasi MMORPG - Fórmulas Canônicas de Combate, Balanço e Buffs
 * Transcrição autoritativa das regras em C++ do MU Online Season 5.2
 * (GameServer/ObjectManager.cpp, SkillManager.cpp, Attack.cpp).
 */

export const CharacterClassId = {
  DARK_WIZARD: 0,
  DARK_KNIGHT: 1,
  FAIRY_ELF: 2,
  MAGIC_GLADIATOR: 3,
  DARK_LORD: 4,
  SUMMONER: 5,
} as const;

export type CharacterClassId = typeof CharacterClassId[keyof typeof CharacterClassId];

export interface CharacterAttributes {
  classId: CharacterClassId;
  level: number;
  masterLevel?: number;
  strength: number;
  agility: number;
  vitality: number;
  energy: number;
  leadership?: number;
  currentHp: number;
  maxHp: number;
  currentSd: number;
  maxSd: number;
  currentMp: number;
  maxMp: number;
  currentBp: number;
  maxBp: number;
}

export interface AttackPower {
  minDamage: number;
  maxDamage: number;
  minMagicDamage?: number;
  maxMagicDamage?: number;
}

export interface DefenseStats {
  defense: number;
  defenseRatePvE: number;
  defenseRatePvP: number;
  attackRatePvE: number;
  attackRatePvP: number;
}

export interface DamageDistribution {
  sdDamage: number;
  hpDamage: number;
  remainingSd: number;
  remainingHp: number;
  isDead: boolean;
}

export interface ComboResult {
  isCombo: boolean;
  comboDamage: number;
}

export class CanonicalFormulas {
  /**
   * Mapeia string identificadora de classe para CharacterClassId numérico canônico
   */
  public static getClassId(className: string): CharacterClassId {
    const upper = (className || '').toUpperCase();
    if (upper === 'DK' || upper === 'BK' || upper === 'BLADE_KNIGHT' || upper === 'DARK_KNIGHT') {
      return CharacterClassId.DARK_KNIGHT;
    }
    if (upper === 'DW' || upper === 'SM' || upper === 'SOUL_MASTER' || upper === 'DARK_WIZARD' || upper === 'GRAND_MASTER') {
      return CharacterClassId.DARK_WIZARD;
    }
    if (upper === 'ELF' || upper === 'FE' || upper === 'ME' || upper === 'FAIRY_ELF' || upper === 'MUSE_ELF' || upper === 'HIGH_ELF') {
      return CharacterClassId.FAIRY_ELF;
    }
    if (upper === 'MG' || upper === 'DM' || upper === 'MAGIC_GLADIATOR' || upper === 'DUEL_MASTER') {
      return CharacterClassId.MAGIC_GLADIATOR;
    }
    if (upper === 'DL' || upper === 'LE' || upper === 'DARK_LORD' || upper === 'LORD_EMPEROR') {
      return CharacterClassId.DARK_LORD;
    }
    if (upper === 'SU' || upper === 'BS' || upper === 'DIMENSION_MASTER' || upper === 'SUMMONER') {
      return CharacterClassId.SUMMONER;
    }
    return CharacterClassId.DARK_KNIGHT;
  }

  /**
   * Identifica se um item é arco ou besta da Fairy Elf
   */
  public static isBowOrCrossbow(itemDefId?: string): boolean {
    if (!itemDefId) return false;
    const lower = itemDefId.toLowerCase();
    return lower.includes('bow') || lower.includes('crossbow');
  }

  /**
   * Calcula o poder de ataque físico e mágico canônico de acordo com a classe do personagem
   */
  public static calculateAttackPower(attrs: CharacterAttributes, isBowEquipped: boolean = false): AttackPower {
    const { classId, strength: str, agility: dex, energy: ene, leadership: cmd = 0 } = attrs;

    switch (classId) {
      case CharacterClassId.DARK_KNIGHT:
        return {
          minDamage: Math.floor(str / 8),
          maxDamage: Math.floor(str / 4),
        };

      case CharacterClassId.DARK_WIZARD:
        return {
          minDamage: Math.floor(str / 6),
          maxDamage: Math.floor(str / 4),
          minMagicDamage: Math.floor(ene / 9),
          maxMagicDamage: Math.floor(ene / 4),
        };

      case CharacterClassId.FAIRY_ELF:
        if (isBowEquipped) {
          return {
            minDamage: Math.floor(dex / 14) + Math.floor(str / 7),
            maxDamage: Math.floor(dex / 8) + Math.floor(str / 4),
          };
        }
        return {
          minDamage: Math.floor(dex / 7),
          maxDamage: Math.floor(dex / 4),
        };

      case CharacterClassId.MAGIC_GLADIATOR:
        return {
          minDamage: Math.floor(str / 6) + Math.floor(ene / 12),
          maxDamage: Math.floor(str / 4) + Math.floor(ene / 8),
          minMagicDamage: Math.floor(ene / 9),
          maxMagicDamage: Math.floor(ene / 4),
        };

      case CharacterClassId.DARK_LORD:
        return {
          minDamage: Math.floor(str / 7) + Math.floor(ene / 14),
          maxDamage: Math.floor(str / 5) + Math.floor(ene / 10),
        };

      case CharacterClassId.SUMMONER:
        return {
          minDamage: Math.floor(str / 8),
          maxDamage: Math.floor(str / 4),
          minMagicDamage: Math.floor(ene / 9),
          maxMagicDamage: Math.floor(ene / 4),
        };

      default:
        return {
          minDamage: Math.floor(str / 8),
          maxDamage: Math.floor(str / 4),
        };
    }
  }

  /**
   * Calcula defesa, taxa de defesa e taxa de acerto (PvE e PvP)
   */
  public static calculateDefenseAndRates(attrs: CharacterAttributes): DefenseStats {
    const { classId, level: lvl, agility: dex, strength: str, leadership: cmd = 0 } = attrs;

    let defense = 0;
    let defenseRatePvE = 0;
    let defenseRatePvP = 0;
    let attackRatePvE = 0;
    let attackRatePvP = 0;

    switch (classId) {
      case CharacterClassId.DARK_KNIGHT:
        defense = Math.floor(dex / 3);
        defenseRatePvE = Math.floor(dex / 3);
        defenseRatePvP = Math.floor(lvl * 2 + (dex * 45) / 10);
        attackRatePvE = Math.floor(lvl * 5 + (dex * 3) / 2 + Math.floor(str / 4));
        attackRatePvP = Math.floor(lvl * 3 + dex * 45 / 10);
        break;

      case CharacterClassId.DARK_WIZARD:
        defense = Math.floor(dex / 4);
        defenseRatePvE = Math.floor(dex / 3);
        defenseRatePvP = Math.floor(lvl * 2 + (dex / 4));
        attackRatePvE = Math.floor(lvl * 5 + (dex * 3) / 2 + Math.floor(str / 4));
        attackRatePvP = Math.floor(lvl * 3 + dex * 4);
        break;

      case CharacterClassId.FAIRY_ELF:
        defense = Math.floor(dex / 10);
        defenseRatePvE = Math.floor(dex / 4);
        defenseRatePvP = Math.floor(lvl * 2 + (dex * 6) / 10);
        attackRatePvE = Math.floor(lvl * 5 + (dex * 3) / 2 + Math.floor(str / 4));
        attackRatePvP = Math.floor(lvl * 3 + (dex * 6) / 10);
        break;

      case CharacterClassId.MAGIC_GLADIATOR:
        defense = Math.floor(dex / 4);
        defenseRatePvE = Math.floor(dex / 3);
        defenseRatePvP = Math.floor(lvl * 2 + (dex * 35) / 10);
        attackRatePvE = Math.floor(lvl * 5 + (dex * 3) / 2 + Math.floor(str / 4));
        attackRatePvP = Math.floor(lvl * 3 + (dex * 35) / 10);
        break;

      case CharacterClassId.DARK_LORD:
        defense = Math.floor(dex / 7);
        defenseRatePvE = Math.floor(dex / 7);
        defenseRatePvP = Math.floor(lvl * 2 + (dex / 2));
        attackRatePvE = Math.floor(lvl * 5 + (dex * 6) / 2 + Math.floor(str / 4) + Math.floor(cmd / 10));
        attackRatePvP = Math.floor(lvl * 3 + dex * 4);
        break;

      case CharacterClassId.SUMMONER:
        defense = Math.floor(dex / 3);
        defenseRatePvE = Math.floor(dex / 4);
        defenseRatePvP = Math.floor(lvl * 2 + (dex * 35) / 10);
        attackRatePvE = Math.floor(lvl * 5 + (dex * 3) / 2 + Math.floor(str / 4));
        attackRatePvP = Math.floor(lvl * 3 + (dex * 35) / 10);
        break;
    }

    return {
      defense,
      defenseRatePvE,
      defenseRatePvP,
      attackRatePvE,
      attackRatePvP,
    };
  }

  /**
   * Aplica a Regra de Absorção do Escudo SD 90/10 Canônica em Combate PvP
   * (90% do dano vai para o SD e 10% penetra na Vida até o SD zerar).
   */
  public static applySdAbsorption(damage: number, currentSd: number, currentHp: number): DamageDistribution {
    if (damage <= 0) {
      return {
        sdDamage: 0,
        hpDamage: 0,
        remainingSd: currentSd,
        remainingHp: currentHp,
        isDead: currentHp <= 0,
      };
    }

    let sdDmg = 0;
    let hpDmg = 0;

    if (currentSd > 0) {
      const idealSdDmg = Math.floor((damage * 90) / 100);
      const idealHpDmg = damage - idealSdDmg;

      if (currentSd >= idealSdDmg) {
        sdDmg = idealSdDmg;
        hpDmg = idealHpDmg;
      } else {
        // SD esgotou: o que sobrou além do SD restante vai direto para o HP
        sdDmg = currentSd;
        const remainingDmg = damage - sdDmg;
        hpDmg = remainingDmg;
      }
    } else {
      // Sem SD: 100% no HP
      sdDmg = 0;
      hpDmg = damage;
    }

    const nextSd = Math.max(0, currentSd - sdDmg);
    const nextHp = Math.max(0, currentHp - hpDmg);

    return {
      sdDamage: sdDmg,
      hpDamage: hpDmg,
      remainingSd: nextSd,
      remainingHp: nextHp,
      isDead: nextHp <= 0,
    };
  }

  /**
   * Avalia a sequência de habilidades para disparar o Combo Skill do Blade Knight
   * Passo 1: Habilidade de Arma (Cyclone, Slash, Lunge, etc.)
   * Passo 2: Twisting Slash ou Rageful Blow
   * Passo 3: Death Stab
   */
  public static evaluateCombo(
    recentSkills: string[],
    strength: number,
    agility: number,
    energy: number
  ): ComboResult {
    if (recentSkills.length < 3) {
      return { isCombo: false, comboDamage: 0 };
    }

    const [s1, s2, s3] = recentSkills.slice(-3);

    const isStep1 = ['weapon_cyclone', 'weapon_slash', 'weapon_lunge', 'weapon_falling_slash'].includes(s1);
    const isStep2 = ['twisting_slash', 'rageful_blow'].includes(s2);
    const isStep3 = s3 === 'death_stab';

    if (isStep1 && isStep2 && isStep3) {
      // Fórmula Canônica de Dano do Combo: (Str + Dex + Ene) / 2
      const comboDamage = Math.floor((strength + agility + energy) / 2);
      return {
        isCombo: true,
        comboDamage,
      };
    }

    return { isCombo: false, comboDamage: 0 };
  }

  /**
   * Fórmula Canônica de Mana Shield (Soul Barrier) do Soul Master
   * Absorção (%) = 10 + (Agi / 50) + (Ene / 200) [Cap: 50%]
   * Duração (s) = 60 + (Ene / 40)
   */
  public static calculateManaShield(agility: number, energy: number): { absorptionPercent: number; durationSeconds: number } {
    const rawAbsorption = 10 + Math.floor(agility / 50) + Math.floor(energy / 200);
    const absorptionPercent = Math.min(50, rawAbsorption);
    const durationSeconds = 60 + Math.floor(energy / 40);

    return { absorptionPercent, durationSeconds };
  }

  /**
   * Fórmula Canônica de Greater Fortitude (Swell Life) do Blade Knight
   * Bônus de HP (%) = 12 + (Vit / 100) + (Ene / 20) [Cap: 100%]
   * Duração (s) = 60 + (Ene / 10)
   */
  public static calculateGreaterFortitude(vitality: number, energy: number): { hpBonusPercent: number; durationSeconds: number } {
    const rawBonus = 12 + Math.floor(vitality / 100) + Math.floor(energy / 20);
    const hpBonusPercent = Math.min(100, rawBonus);
    const durationSeconds = 60 + Math.floor(energy / 10);

    return { hpBonusPercent, durationSeconds };
  }

  /**
   * Fórmula Canônica de Greater Damage da Muse Elf
   * Bônus = 3 + (Ene / 7)
   */
  public static calculateGreaterDamage(energy: number): number {
    return 3 + Math.floor(energy / 7);
  }

  /**
   * Fórmula Canônica de Greater Defense da Muse Elf
   * Bônus = 2 + (Ene / 8)
   */
  public static calculateGreaterDefense(energy: number): number {
    return 2 + Math.floor(energy / 8);
  }

  /**
   * Fórmula Canônica de Heal da Muse Elf
   * HP Curado = 5 + (Ene / 5)
   */
  public static calculateHeal(energy: number): number {
    return 5 + Math.floor(energy / 5);
  }

  /**
   * Fórmula Canônica de Critical Damage Buff do Dark Lord
   * Bônus = (Cmd / 25) + (Ene / 30)
   */
  public static calculateCriticalDamageBuff(leadership: number, energy: number): number {
    return Math.floor(leadership / 25) + Math.floor(energy / 30);
  }

  /**
   * Fórmula Canônica de Damage Reflect da Summoner
   * Reflexão (%) = 30 + (Ene / 42) [Cap: 50%]
   */
  public static calculateDamageReflect(energy: number): number {
    const rawReflect = 30 + Math.floor(energy / 42);
    return Math.min(50, rawReflect);
  }
}
