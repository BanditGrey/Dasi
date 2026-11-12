/**
 * Dasi MMORPG - Gerenciador Canônico de Buffs, Debuffs e Efeitos (EffectManager)
 * Engenharia reversa integral do GameServer Webzen MU Online Season 5.2
 * (EffectManager.cpp, Effect.cpp, SkillManager.cpp, GameServerInfo - Skill.dat).
 */

export const EffectId = {
  GREATER_DAMAGE: 1,             // Greater Damage (Fada Elfa Buff Ataque)
  GREATER_DEFENSE: 2,            // Greater Defense (Fada Elfa Buff Defesa)
  ELF_BUFFER: 3,                 // Shadow Phantom Soldier buff iniciante
  MANA_SHIELD: 4,                // Soul Barrier / Mana Shield (Soul Master)
  GREATER_CRITICAL_DAMAGE: 5,    // Critical Damage buff (Dark Lord)
  INFINITY_ARROW: 6,             // Flechas Infinitas (Muse Elf)
  BP_RECOVERY: 7,                // Recuperação de AG / Stamina
  GREATER_LIFE: 8,               // Greater Fortitude / Swell Life (Blade Knight)
  GREATER_MANA: 9,               // Greater Mana
  BLESS_POTION: 10,              // Poção de Bless (+20% Dmg)
  SOUL_POTION: 11,               // Poção de Soul (+20 Vel, +8 AG Rec)
  POISON: 55,                    // Envenenamento (Dano contínuo 3% do HP)
  ICE: 56,                       // Congelamento (Redução de 50% de velocidade de movimento)
  ICE_ARROW: 57,                 // Flecha de Gelo (Stun/Paralisia total)
  FIRE_SLASH: 58,                // Fire Slash (Redução de defesa do alvo)
  PHYSI_DAMAGE_IMMUNITY: 59,     // Imunidade a Dano Físico
  MAGIC_DAMAGE_IMMUNITY: 60,     // Imunidade a Dano Mágico
  STERN: 61,                     // Atordoamento (Stun)
  DAMAGE_REFLECT: 71,            // Dano Refletido (Summoner)
  SLEEP: 72,                     // Sono (Alvo dorme, incapaz de agir até receber dano)
  BLIND: 73,                     // Cegueira (Redução severa de taxa de ataque)
  LESSER_DAMAGE: 76,             // Fraqueza / Weakness (Redução de dano do alvo)
  LESSER_DEFENSE: 77,            // Inovação / Innovation (Redução de defesa do alvo)
  SWORD_POWER: 81,               // Berserker / Sword Power (Aumenta dano, reduz defesa)
  MAGIC_CIRCLE: 82,              // Círculo Mágico (Aumenta dano mágico mínimo)
  FROZEN_STAB: 86,               // Golpe Gélido (Stun e Slow)
} as const;

export type EffectId = typeof EffectId[keyof typeof EffectId];

export interface ActiveEffect {
  index: EffectId;
  name: string;
  durationSeconds: number; // Segundos restantes
  value1: number;          // Bônus primário (ex: % de redução de dano)
  value2: number;          // Bônus secundário (ex: dano adicional)
  value3: number;          // Bônus terciário
  value4: number;          // Bônus quaternário
  sourcePlayerId?: string; // ID de quem aplicou o buff
}

export class EffectManager {
  /**
   * Fórmula canônica do Mana Shield (Soul Barrier do DW/SM):
   * Redução % = 10 + (Dex / 50) + (Energy / 200), limitado canonicamente a 50% (ManaShieldMaxRate).
   * Duração = 60 + (Energy / 40) segundos.
   */
  public static calculateManaShield(dexterity: number, energy: number): { percentReduction: number; durationSeconds: number } {
    const rawPercent = 10 + Math.floor(dexterity / 50) + Math.floor(energy / 200);
    const percentReduction = Math.min(50, Math.max(10, rawPercent));
    const durationSeconds = 60 + Math.floor(energy / 40);
    return { percentReduction, durationSeconds };
  }

  /**
   * Fórmula canônica do Greater Fortitude (Greater Life do DK/BK):
   * HP Extra % = 12 + (Vitality / 100) + (Energy / 20), limitado a 100% (GreaterLifeMaxRate).
   * Duração = 60 + (Energy / 10) segundos.
   */
  public static calculateGreaterLife(vitality: number, energy: number): { percentBonusHp: number; durationSeconds: number } {
    const rawPercent = 12 + Math.floor(vitality / 100) + Math.floor(energy / 20);
    const percentBonusHp = Math.min(100, Math.max(12, rawPercent));
    const durationSeconds = 60 + Math.floor(energy / 10);
    return { percentBonusHp, durationSeconds };
  }

  /**
   * Fórmula canônica do Greater Defense da Elfa:
   * Defesa Adicional = 2 + (Energy / 8).
   * Duração fixa = 60 segundos.
   */
  public static calculateGreaterDefense(energy: number): { defenseBonus: number; durationSeconds: number } {
    const defenseBonus = 2 + Math.floor(energy / 8);
    return { defenseBonus, durationSeconds: 60 };
  }

  /**
   * Fórmula canônica do Greater Damage da Elfa:
   * Dano Adicional = 3 + (Energy / 7).
   * Duração fixa = 60 segundos.
   */
  public static calculateGreaterDamage(energy: number): { damageBonus: number; durationSeconds: number } {
    const damageBonus = 3 + Math.floor(energy / 7);
    return { damageBonus, durationSeconds: 60 };
  }

  /**
   * Fórmula canônica do Critical Damage do Dark Lord:
   * Dano Crítico Extra = (Energy / 25) + (Leadership / 30).
   * Duração = 60 + (Energy / 10) segundos.
   */
  public static calculateGreaterCriticalDamage(energy: number, leadership: number): { criticalDamageBonus: number; durationSeconds: number } {
    const criticalDamageBonus = Math.floor(energy / 25) + Math.floor(leadership / 30);
    const durationSeconds = 60 + Math.floor(energy / 10);
    return { criticalDamageBonus, durationSeconds };
  }

  /**
   * Fórmula canônica do Reflect Damage da Summoner:
   * Reflexão % = 30 + (Energy / 42), limitado a 50% (ReflectDamageMaxRate).
   * Duração = 30 + (Energy / 25) segundos.
   */
  public static calculateReflectDamage(energy: number): { reflectPercent: number; durationSeconds: number } {
    const rawPercent = 30 + Math.floor(energy / 42);
    const reflectPercent = Math.min(50, Math.max(30, rawPercent));
    const durationSeconds = 30 + Math.floor(energy / 25);
    return { reflectPercent, durationSeconds };
  }

  /**
   * Fórmula canônica de Inovação (Innovation / Lesser Defense - Debuff da Summoner):
   * Redução de Defesa % = 32 + (Energy / 50), limitado a 40%.
   * Duração = 5 + (Energy / 300) segundos.
   */
  public static calculateLesserDefense(energy: number): { defenseReductionPercent: number; durationSeconds: number } {
    const rawPercent = 32 + Math.floor(energy / 50);
    const defenseReductionPercent = Math.min(40, Math.max(32, rawPercent));
    const durationSeconds = 5 + Math.floor(energy / 300);
    return { defenseReductionPercent, durationSeconds };
  }

  /**
   * Fórmula canônica de Fraqueza (Weakness / Lesser Damage - Debuff da Summoner):
   * Redução de Dano % = 32 + (Energy / 50), limitado a 40%.
   * Duração = 5 + (Energy / 300) segundos.
   */
  public static calculateLesserDamage(energy: number): { damageReductionPercent: number; durationSeconds: number } {
    const rawPercent = 32 + Math.floor(energy / 50);
    const damageReductionPercent = Math.min(40, Math.max(32, rawPercent));
    const durationSeconds = 5 + Math.floor(energy / 300);
    return { damageReductionPercent, durationSeconds };
  }

  /**
   * Gerenciador de lista ativa de efeitos de uma entidade (Player ou Monstro)
   */
  private effects: Map<EffectId, ActiveEffect> = new Map();

  /**
   * Adiciona ou substitui um efeito. Se o efeito já existe com valor superior, preserva.
   */
  public addEffect(
    index: EffectId,
    name: string,
    durationSeconds: number,
    value1 = 0,
    value2 = 0,
    value3 = 0,
    value4 = 0,
    sourcePlayerId?: string
  ): void {
    const existing = this.effects.get(index);
    if (existing) {
      // Atualiza duração se a nova for maior e atualiza valores se forem mais fortes
      existing.durationSeconds = Math.max(existing.durationSeconds, durationSeconds);
      existing.value1 = Math.max(existing.value1, value1);
      existing.value2 = Math.max(existing.value2, value2);
      existing.value3 = Math.max(existing.value3, value3);
      existing.value4 = Math.max(existing.value4, value4);
      return;
    }

    this.effects.set(index, {
      index,
      name,
      durationSeconds,
      value1,
      value2,
      value3,
      value4,
      sourcePlayerId,
    });
  }

  public removeEffect(index: EffectId): boolean {
    return this.effects.delete(index);
  }

  public hasEffect(index: EffectId): boolean {
    return this.effects.has(index);
  }

  public getEffect(index: EffectId): ActiveEffect | undefined {
    return this.effects.get(index);
  }

  public getAllEffects(): ActiveEffect[] {
    return Array.from(this.effects.values());
  }

  public clear(): void {
    this.effects.clear();
  }

  /**
   * Executa o tick a cada segundo. Decrementa duração e remove efeitos expirados.
   * Retorna os efeitos expirados neste tick.
   */
  public tick(deltaSeconds = 1): ActiveEffect[] {
    const expired: ActiveEffect[] = [];

    for (const [id, effect] of this.effects.entries()) {
      effect.durationSeconds -= deltaSeconds;
      if (effect.durationSeconds <= 0) {
        expired.push(effect);
        this.effects.delete(id);
      }
    }

    return expired;
  }
}
