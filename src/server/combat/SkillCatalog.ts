/**
 * Dasi MMORPG - Catálogo Canônico de Habilidades de Todas as 5 Classes
 * Transcrição das habilidades originais da Season 5.2 (Skill.cpp, SkillManager.cpp).
 * Classes: Dark Knight (DK), Dark Wizard (DW), Fairy Elf (ELF), Magic Gladiator (MG), Dark Lord (DL).
 */

import { EffectId } from './EffectManager.ts';
import { ComboSkillEngine } from './ComboSkillEngine.ts';
import type { CharacterAttributes } from './CanonicalFormulas.ts';

export type CharacterClassKey = 'DK' | 'DW' | 'ELF' | 'MG' | 'DL';

export interface SkillDefinition {
  id: number;
  slug: string;
  name: string;
  classes: CharacterClassKey[];
  manaCost: number;
  agCost: number;
  minLevel: number;
  type: 'PHYSICAL' | 'MAGICAL' | 'HYBRID' | 'BUFF';
  aoeRadius?: number;      // 0 ou undefined se for alvo único
  maxAoeTargets?: number;  // Limite máximo de alvos no raio AoE
  knockbackDistance?: number;
  poiseDamage?: number;
  effectId?: number;       // EffectId do EffectManager se aplicar buff/debuff
  calculateDamageMultiplier(attrs: CharacterAttributes): number;
}

export class SkillCatalog {
  private static skillsBySlug: Map<string, SkillDefinition> = new Map();
  private static skillsById: Map<number, SkillDefinition> = new Map();

  static {
    // -------------------------------------------------------------
    // 1. DARK KNIGHT (BLADE KNIGHT / BLADE MASTER)
    // -------------------------------------------------------------
    SkillCatalog.register({
      id: 41,
      slug: 'twisting_slash',
      name: 'Twisting Slash (Tormenta de Aço)',
      classes: ['DK', 'MG'],
      manaCost: 10,
      agCost: 0,
      minLevel: 80,
      type: 'PHYSICAL',
      aoeRadius: 180,
      maxAoeTargets: 8,
      knockbackDistance: 16,
      poiseDamage: 30,
      calculateDamageMultiplier: (attrs) => {
        return Math.max(2.0, ComboSkillEngine.calculateDKSkillMultiplier(attrs.energy) / 100);
      },
    });

    SkillCatalog.register({
      id: 43,
      slug: 'death_stab',
      name: 'Death Stab (Estocada do Trovão)',
      classes: ['DK'],
      manaCost: 12,
      agCost: 0,
      minLevel: 160,
      type: 'PHYSICAL',
      knockbackDistance: 35,
      poiseDamage: 45,
      calculateDamageMultiplier: (attrs) => {
        return Math.max(2.5, (ComboSkillEngine.calculateDKSkillMultiplier(attrs.energy) + 50) / 100);
      },
    });

    SkillCatalog.register({
      id: 42,
      slug: 'rageful_blow',
      name: 'Rageful Blow (Impacto Devastador)',
      classes: ['DK'],
      manaCost: 20,
      agCost: 15,
      minLevel: 170,
      type: 'PHYSICAL',
      aoeRadius: 150,
      maxAoeTargets: 6,
      knockbackDistance: 25,
      poiseDamage: 50,
      effectId: EffectId.STERN,
      calculateDamageMultiplier: (attrs) => {
        return Math.max(2.8, (ComboSkillEngine.calculateDKSkillMultiplier(attrs.energy) + 80) / 100);
      },
    });

    SkillCatalog.register({
      id: 45,
      slug: 'greater_fortitude',
      name: 'Greater Fortitude (Grito de Sangue / Swell Life)',
      classes: ['DK'],
      manaCost: 22,
      agCost: 0,
      minLevel: 120,
      type: 'BUFF',
      effectId: EffectId.GREATER_LIFE,
      calculateDamageMultiplier: () => 1.0,
    });

    // -------------------------------------------------------------
    // 2. DARK WIZARD (SOUL MASTER / GRAND MASTER)
    // -------------------------------------------------------------
    SkillCatalog.register({
      id: 1,
      slug: 'energy_ball',
      name: 'Energy Ball',
      classes: ['DW'],
      manaCost: 3,
      agCost: 0,
      minLevel: 1,
      type: 'MAGICAL',
      knockbackDistance: 8,
      poiseDamage: 12,
      calculateDamageMultiplier: () => 1.0,
    });

    SkillCatalog.register({
      id: 2,
      slug: 'fireball',
      name: 'Fireball',
      classes: ['DW', 'MG'],
      manaCost: 6,
      agCost: 0,
      minLevel: 5,
      type: 'MAGICAL',
      knockbackDistance: 12,
      poiseDamage: 18,
      calculateDamageMultiplier: () => 1.25,
    });

    SkillCatalog.register({
      id: 4,
      slug: 'lightning',
      name: 'Lightning',
      classes: ['DW', 'MG'],
      manaCost: 12,
      agCost: 0,
      minLevel: 10,
      type: 'MAGICAL',
      knockbackDistance: 14,
      poiseDamage: 22,
      calculateDamageMultiplier: () => 1.5,
    });

    SkillCatalog.register({
      id: 6,
      slug: 'ice',
      name: 'Ice',
      classes: ['DW', 'MG'],
      manaCost: 16,
      agCost: 0,
      minLevel: 15,
      type: 'MAGICAL',
      knockbackDistance: 10,
      poiseDamage: 20,
      effectId: EffectId.ICE,
      calculateDamageMultiplier: () => 1.4,
    });

    SkillCatalog.register({
      id: 9,
      slug: 'evil_spirits',
      name: 'Evil Spirits (Legião das Sombras)',
      classes: ['DW', 'MG'],
      manaCost: 35,
      agCost: 5,
      minLevel: 50,
      type: 'MAGICAL',
      aoeRadius: 220,
      maxAoeTargets: 8,
      knockbackDistance: 10,
      poiseDamage: 20,
      calculateDamageMultiplier: (attrs) => {
        // Escalonamento de dano mágico baseado na Energia do mago
        const bonus = Math.floor(attrs.energy / 20);
        return (150 + bonus) / 100;
      },
    });

    SkillCatalog.register({
      id: 10,
      slug: 'hellfire',
      name: 'Hellfire (Vulcão do Tártaro)',
      classes: ['DW', 'MG'],
      manaCost: 40,
      agCost: 8,
      minLevel: 60,
      type: 'MAGICAL',
      aoeRadius: 120,
      maxAoeTargets: 6,
      knockbackDistance: 30, // Knock-up / projeção
      poiseDamage: 40,
      calculateDamageMultiplier: (attrs) => {
        const bonus = Math.floor(attrs.energy / 15);
        return (220 + bonus) / 100;
      },
    });

    SkillCatalog.register({
      id: 38,
      slug: 'ice_storm',
      name: 'Ice Storm (Nevasca Absoluta)',
      classes: ['DW'],
      manaCost: 45,
      agCost: 10,
      minLevel: 160,
      type: 'MAGICAL',
      aoeRadius: 160,
      maxAoeTargets: 7,
      knockbackDistance: 15,
      poiseDamage: 35,
      effectId: EffectId.ICE,
      calculateDamageMultiplier: (attrs) => {
        const bonus = Math.floor(attrs.energy / 15);
        return (240 + bonus) / 100;
      },
    });

    SkillCatalog.register({
      id: 18,
      slug: 'mana_shield',
      name: 'Mana Shield (Soul Barrier)',
      classes: ['DW'],
      manaCost: 30,
      agCost: 0,
      minLevel: 100,
      type: 'BUFF',
      effectId: EffectId.MANA_SHIELD,
      calculateDamageMultiplier: () => 1.0,
    });

    // -------------------------------------------------------------
    // 3. FAIRY ELF (MUSE ELF / HIGH ELF)
    // -------------------------------------------------------------
    SkillCatalog.register({
      id: 24,
      slug: 'triple_shot',
      name: 'Triple Shot (Disparo Triplo Harmônico)',
      classes: ['ELF'],
      manaCost: 5,
      agCost: 0,
      minLevel: 1,
      type: 'PHYSICAL',
      aoeRadius: 180,
      maxAoeTargets: 2,
      knockbackDistance: 18,
      poiseDamage: 28,
      calculateDamageMultiplier: (attrs) => {
        // Disparo triplo de 3 flechas convergentes (fator de 240% com bônus de Agi/Str)
        const bonus = Math.floor(attrs.agility / 40);
        return (240 + bonus) / 100;
      },
    });

    SkillCatalog.register({
      id: 52,
      slug: 'penetration',
      name: 'Penetration (Flecha do Horizonte)',
      classes: ['ELF'],
      manaCost: 14,
      agCost: 0,
      minLevel: 130,
      type: 'PHYSICAL',
      knockbackDistance: 32,
      poiseDamage: 40,
      calculateDamageMultiplier: (attrs) => {
        const bonus = Math.floor(attrs.agility / 25);
        return (220 + bonus) / 100;
      },
    });

    SkillCatalog.register({
      id: 51,
      slug: 'ice_arrow',
      name: 'Ice Arrow (Flecha de Gelo Paralisante)',
      classes: ['ELF'],
      manaCost: 20,
      agCost: 5,
      minLevel: 140,
      type: 'PHYSICAL',
      knockbackDistance: 10,
      poiseDamage: 45,
      effectId: EffectId.ICE_ARROW,
      calculateDamageMultiplier: (attrs) => {
        const bonus = Math.floor(attrs.agility / 30);
        return (200 + bonus) / 100;
      },
    });

    SkillCatalog.register({
      id: 26,
      slug: 'heal',
      name: 'Healing Song (Cântico das Estrelas)',
      classes: ['ELF'],
      manaCost: 10,
      agCost: 0,
      minLevel: 1,
      type: 'BUFF',
      calculateDamageMultiplier: () => 1.0,
    });

    SkillCatalog.register({
      id: 27,
      slug: 'greater_defense',
      name: 'Greater Defense (Bênção de Proteção)',
      classes: ['ELF'],
      manaCost: 15,
      agCost: 0,
      minLevel: 15,
      type: 'BUFF',
      effectId: EffectId.GREATER_DEFENSE,
      calculateDamageMultiplier: () => 1.0,
    });

    SkillCatalog.register({
      id: 28,
      slug: 'greater_damage',
      name: 'Greater Damage (Bênção de Ataque)',
      classes: ['ELF'],
      manaCost: 18,
      agCost: 0,
      minLevel: 20,
      type: 'BUFF',
      effectId: EffectId.GREATER_DAMAGE,
      calculateDamageMultiplier: () => 1.0,
    });

    // -------------------------------------------------------------
    // 4. MAGIC GLADIATOR (DUEL MASTER)
    // -------------------------------------------------------------
    SkillCatalog.register({
      id: 55,
      slug: 'fire_slash',
      name: 'Fire Slash (Corte da Fenda Ígnea)',
      classes: ['MG'],
      manaCost: 15,
      agCost: 10,
      minLevel: 120,
      type: 'HYBRID',
      knockbackDistance: 20,
      poiseDamage: 42,
      effectId: EffectId.FIRE_SLASH,
      calculateDamageMultiplier: (attrs) => {
        const bonus = Math.floor((attrs.strength + attrs.energy) / 20);
        return (230 + bonus) / 100;
      },
    });

    SkillCatalog.register({
      id: 56,
      slug: 'power_slash',
      name: 'Power Slash (Lâminas do Éter)',
      classes: ['MG'],
      manaCost: 12,
      agCost: 0,
      minLevel: 60,
      type: 'HYBRID',
      aoeRadius: 200,
      maxAoeTargets: 5,
      knockbackDistance: 16,
      poiseDamage: 32,
      calculateDamageMultiplier: (attrs) => {
        const bonus = Math.floor(attrs.energy / 15);
        return (190 + bonus) / 100;
      },
    });

    // -------------------------------------------------------------
    // 5. DARK LORD (LORD EMPEROR)
    // -------------------------------------------------------------
    SkillCatalog.register({
      id: 60,
      slug: 'force',
      name: 'Force (Onda Sagrada)',
      classes: ['DL'],
      manaCost: 8,
      agCost: 0,
      minLevel: 1,
      type: 'MAGICAL',
      knockbackDistance: 14,
      poiseDamage: 20,
      calculateDamageMultiplier: () => 1.3,
    });

    SkillCatalog.register({
      id: 61,
      slug: 'fireburst',
      name: 'Fireburst (Chicote de Fogo)',
      classes: ['DL'],
      manaCost: 15,
      agCost: 5,
      minLevel: 80,
      type: 'MAGICAL',
      aoeRadius: 100, // Efeito em cadeia para alvos adjacentes
      maxAoeTargets: 3,
      knockbackDistance: 22,
      poiseDamage: 38,
      calculateDamageMultiplier: (attrs) => {
        return Math.max(1.8, ComboSkillEngine.calculateDLSkillMultiplier(attrs.energy) / 100);
      },
    });

    SkillCatalog.register({
      id: 62,
      slug: 'earthquake',
      name: 'Earthquake (Pisada Sísmica do Corcel)',
      classes: ['DL'],
      manaCost: 25,
      agCost: 15,
      minLevel: 180,
      type: 'PHYSICAL',
      aoeRadius: 240,
      maxAoeTargets: 8,
      knockbackDistance: 40, // Projeção alta pelo impacto sísmico
      poiseDamage: 55,
      calculateDamageMultiplier: (attrs) => {
        const bonus = Math.floor(attrs.strength / 10 + (attrs.leadership || 0) / 5 + attrs.level * 2);
        return (250 + Math.min(250, bonus)) / 100;
      },
    });

    SkillCatalog.register({
      id: 65,
      slug: 'electric_spark',
      name: 'Electric Spark (Descarga Imperial)',
      classes: ['DL'],
      manaCost: 40,
      agCost: 25,
      minLevel: 220,
      type: 'MAGICAL',
      aoeRadius: 280,
      maxAoeTargets: 8,
      knockbackDistance: 30,
      poiseDamage: 50,
      calculateDamageMultiplier: (attrs) => {
        const bonus = Math.floor(attrs.energy / 10 + (attrs.leadership || 0) / 10);
        return (300 + bonus) / 100;
      },
    });

    SkillCatalog.register({
      id: 64,
      slug: 'critical_damage',
      name: 'Greater Critical Damage (Foco Imperial)',
      classes: ['DL'],
      manaCost: 25,
      agCost: 0,
      minLevel: 100,
      type: 'BUFF',
      effectId: EffectId.GREATER_CRITICAL_DAMAGE,
      calculateDamageMultiplier: () => 1.0,
    });
  }

  public static register(skill: SkillDefinition): void {
    SkillCatalog.skillsBySlug.set(skill.slug.toLowerCase(), skill);
    SkillCatalog.skillsById.set(skill.id, skill);
  }

  public static getBySlug(slug: string): SkillDefinition | undefined {
    return SkillCatalog.skillsBySlug.get(slug.toLowerCase());
  }

  public static getById(id: number): SkillDefinition | undefined {
    return SkillCatalog.skillsById.get(id);
  }

  public static findSkill(identifier: string | number): SkillDefinition | undefined {
    if (typeof identifier === 'number') {
      return SkillCatalog.getById(identifier);
    }
    const num = Number(identifier);
    if (!Number.isNaN(num) && SkillCatalog.skillsById.has(num)) {
      return SkillCatalog.getById(num);
    }
    return SkillCatalog.getBySlug(String(identifier));
  }

  public static getAllSkills(): SkillDefinition[] {
    return Array.from(SkillCatalog.skillsBySlug.values());
  }
}
