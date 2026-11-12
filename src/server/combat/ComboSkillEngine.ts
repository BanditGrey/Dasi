/**
 * Dasi MMORPG - Motor de Combo de Habilidades & Multiplicadores de Dano Canônicos
 * Engenharia reversa integral do GameServer Webzen MU Online Season 5.2
 * (ComboSkill.cpp, Attack.cpp, ObjectManager.cpp, GameServerInfo - Character.dat).
 */

export const WeaponSkillId = {
  FALLING_SLASH: 19,
  LUNGE: 20,
  UPPERCUT: 21,
  CYCLONE: 22,
  SLASH: 23,
} as const;

export const ClassOrbSkillId = {
  TWISTING_SLASH: 41,
  RAGEFUL_BLOW: 42,
  DEATH_STAB: 43,
  CRESCENT_MOON_SLASH: 44,
  FROZEN_STAB: 48,
  BLOOD_STORM: 49,
} as const;

export class ComboSkillEngine {
  private step = 0; // 0 = Nada/Pronto, 1 = Golpe de Arma executado, 2 = 1ª Skill de Classe executada
  private firstClassSkill: number | null = null;
  private expirationTimestamp = 0;

  public reset(): void {
    this.step = 0;
    this.firstClassSkill = null;
    this.expirationTimestamp = 0;
  }

  /**
   * Avalia a execução de uma habilidade na cadeia de Combo do Blade Knight.
   * Regra canônica:
   * 1. Habilidade de Arma (Falling Slash, Lunge, Uppercut, Cyclone, Slash).
   * 2. Primeira Habilidade de Orbe/Classe (Twisting, Rageful, Death Stab, Frozen Stab).
   * 3. Segunda Habilidade de Orbe DIFERENTE da primeira (dentro da janela de 3000ms).
   *
   * @param skillId ID da habilidade disparada
   * @param nowTimestamp Timestamp atual em milissegundos
   * @returns true se o Combo foi detonado com sucesso
   */
  public registerSkill(skillId: number, nowTimestamp: number): boolean {
    const isWeaponSkill = Object.values(WeaponSkillId).includes(skillId as any);
    const isClassSkill = Object.values(ClassOrbSkillId).includes(skillId as any);

    // Se passou do tempo da janela (3000ms), zera o estado
    if (this.step > 0 && nowTimestamp > this.expirationTimestamp) {
      this.reset();
    }

    // Etapa 1: Início da cadeia com Arma
    if (isWeaponSkill) {
      this.step = 1;
      this.firstClassSkill = null;
      this.expirationTimestamp = nowTimestamp + 3000;
      return false;
    }

    // Etapa 2: Primeira skill de orbe
    if (isClassSkill && this.step === 1) {
      this.step = 2;
      this.firstClassSkill = skillId;
      this.expirationTimestamp = nowTimestamp + 3000;
      return false;
    }

    // Etapa 3: Segunda skill de orbe DIFERENTE
    if (isClassSkill && this.step === 2) {
      if (this.firstClassSkill !== skillId) {
        // COMBO ATIVADO COM SUCESSO!
        this.reset();
        return true;
      }
      // Se repetiu a mesma habilidade, apenas renova a janela mantendo o passo
      this.expirationTimestamp = nowTimestamp + 3000;
      return false;
    }

    // Qualquer habilidade fora da ordem quebra o combo
    this.reset();
    return false;
  }

  /**
   * Calcula o dano canônico da explosão de Combo do Blade Knight:
   * ComboDamage = (2 * BaseDamage) + ((Strength + Dexterity + Energy) / 2)
   */
  public static calculateComboDamage(baseDamage: number, strength: number, dexterity: number, energy: number): number {
    const statsBonus = Math.floor((strength + dexterity + energy) / 2);
    return (baseDamage * 2) + statsBonus;
  }

  /**
   * Multiplicador canônico de dano físico de habilidades do Dark Knight / Blade Knight:
   * Multiplier = 200% + (Energy / 10)%, limitado canonicamente a 500% (DKDamageMultiplierMaxRate).
   */
  public static calculateDKSkillMultiplier(energy: number): number {
    const rawRate = 200 + Math.floor(energy / 10);
    return Math.min(500, Math.max(200, rawRate));
  }

  /**
   * Multiplicador canônico de dano de habilidades do Dark Lord (Force, Fire Burst, Earthquake, Fire Scream):
   * Multiplier = 200% + (Energy / 20)%, limitado canonicamente a 500% (DLDamageMultiplierMaxRate).
   */
  public static calculateDLSkillMultiplier(energy: number): number {
    const rawRate = 200 + Math.floor(energy / 20);
    return Math.min(500, Math.max(200, rawRate));
  }
}
