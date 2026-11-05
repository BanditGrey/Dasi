/**
 * Dasi MMORPG - Definições Canônicas de Chefes Mundiais, Habilidades e Fases
 * Baseado no Bestiário oficial do Continent of Legend (Gorgon, Ice Queen, Balrog, Zaikan, Kundun).
 */

import type { DropTableEntry } from '../combat/Monster.ts';

export type TelegraphShape = 'CIRCLE' | 'CONE' | 'LINE' | 'ARENA_WIDE';

export type BossStatusEffect = 'NONE' | 'PETRIFY' | 'FREEZE' | 'BURN' | 'STUN' | 'KNOCKBACK' | 'SLOW';

export interface BossTelegraphSkill {
  id: string;
  name: string;
  shape: TelegraphShape;
  castDurationMs: number;
  cooldownMs: number;
  damageMultiplier: number;
  radius: number;           // Alcance ou raio em metros/unidades
  angleDeg?: number;        // Apenas para CONE (ex: 60°)
  lineWidth?: number;       // Apenas para LINE (largura da linha)
  statusEffect: BossStatusEffect;
  effectDurationMs: number;
  description: string;
}

export interface BossPhaseConfig {
  phaseIndex: number;
  name: string;
  hpThresholdPercent: number; // HP em % para entrar na fase (ex: 100%, 65%, 25%)
  shieldHp?: number;          // Barreira rúnica que precisa ser quebrada
  attackSpeedMultiplier: number;
  damageMultiplier: number;
  telegraphSkills: BossTelegraphSkill[];
  summonAdds?: {
    monsterType: string;
    count: number;
  };
  auraDamagePerSec?: number;
  auraType?: 'FIRE' | 'ICE' | 'POISON' | 'ABYSS';
  enraged?: boolean;
}

export interface BossConfig {
  type: string;
  name: string;
  title: string;
  level: number;
  maxHp: number;
  defense: number;
  defenseRate: number;
  attackMin: number;
  attackMax: number;
  attackRate: number;
  moveSpeed: number;
  xpReward: number;
  maxPoise: number;
  zenMin: number;
  zenMax: number;
  location: string;
  phases: BossPhaseConfig[];
  dropTable: DropTableEntry[];
}

export const BOSS_CONFIGS: Record<string, BossConfig> = {
  // =========================================================================
  // 1. GORGON — O Guardião do Abismo Esquecido (Dungeon 3)
  // =========================================================================
  boss_gorgon: {
    type: 'boss_gorgon',
    name: 'Gorgon',
    title: 'O Guardião do Abismo',
    level: 55,
    maxHp: 85000,
    defense: 125,
    defenseRate: 85,
    attackMin: 180,
    attackMax: 260,
    attackRate: 220,
    moveSpeed: 65,
    xpReward: 32000,
    maxPoise: 350,
    zenMin: 50000,
    zenMax: 150000,
    location: 'DNG_06',
    phases: [
      {
        phaseIndex: 1,
        name: 'Aproximação Agressiva',
        hpThresholdPercent: 100,
        attackSpeedMultiplier: 1.0,
        damageMultiplier: 1.0,
        telegraphSkills: [
          {
            id: 'gorgon_tail_slam',
            name: 'Pancada com Cauda de Espinhos',
            shape: 'LINE',
            castDurationMs: 1200,
            cooldownMs: 8000,
            damageMultiplier: 1.4,
            radius: 8.0,
            lineWidth: 2.5,
            statusEffect: 'KNOCKBACK',
            effectDurationMs: 1000,
            description: 'Gorgon chicoteia a cauda em linha reta esmagando quem estiver no caminho.',
          },
        ],
      },
      {
        phaseIndex: 2,
        name: 'Olhar Petrificante da Cripta',
        hpThresholdPercent: 60,
        shieldHp: 15000,
        attackSpeedMultiplier: 1.2,
        damageMultiplier: 1.25,
        summonAdds: {
          monsterType: 'skeleton',
          count: 3,
        },
        telegraphSkills: [
          {
            id: 'gorgon_petrify_gaze',
            name: 'Olhar de Petrificação Esmeralda',
            shape: 'CONE',
            castDurationMs: 2500,
            cooldownMs: 14000,
            damageMultiplier: 1.8,
            radius: 12.0,
            angleDeg: 60,
            statusEffect: 'PETRIFY',
            effectDurationMs: 4000,
            description: 'Canaliza feixe verde; congela jogadores sem cobertura atrás de pilares por 4 segundos.',
          },
        ],
      },
      {
        phaseIndex: 3,
        name: 'Fúria Abissal Enraivecida',
        hpThresholdPercent: 25,
        attackSpeedMultiplier: 1.45,
        damageMultiplier: 1.5,
        enraged: true,
        auraDamagePerSec: 35,
        auraType: 'POISON',
        telegraphSkills: [
          {
            id: 'gorgon_abyss_rupture',
            name: 'Ruptura das Criptas Profundas',
            shape: 'CIRCLE',
            castDurationMs: 1800,
            cooldownMs: 10000,
            damageMultiplier: 2.2,
            radius: 7.0,
            statusEffect: 'STUN',
            effectDurationMs: 2000,
            description: 'Salta e quebra o solo liberando jatos venenosos que atordoam em 360 graus.',
          },
        ],
      },
    ],
    dropTable: [
      { itemDefId: 'jewel_of_chaos', chance: 1.0 },
      { itemDefId: 'jewel_of_blessing', chance: 0.85 },
      { itemDefId: 'jewel_of_soul', chance: 0.70 },
      { itemDefId: 'serpent_sword', chance: 0.35, maxLevel: 5, allowLuck: true, allowSkill: true, excellentChance: 0.50 },
      { itemDefId: 'dragon_blade', chance: 0.25, maxLevel: 5, allowLuck: true, allowSkill: true, excellentChance: 0.35 },
      { itemDefId: 'box_of_kundun_3', chance: 0.40 },
    ],
  },

  // =========================================================================
  // 2. ICE QUEEN — A Rainha das Neves de Devias (Devias Boreal)
  // =========================================================================
  boss_ice_queen: {
    type: 'boss_ice_queen',
    name: 'Ice Queen',
    title: 'A Dama Solitária de Boreal',
    level: 52,
    maxHp: 75000,
    defense: 110,
    defenseRate: 120,
    attackMin: 160,
    attackMax: 235,
    attackRate: 240,
    moveSpeed: 70,
    xpReward: 28000,
    maxPoise: 280,
    zenMin: 45000,
    zenMax: 130000,
    location: 'DEV_06',
    phases: [
      {
        phaseIndex: 1,
        name: 'Vento Congelante',
        hpThresholdPercent: 100,
        attackSpeedMultiplier: 1.0,
        damageMultiplier: 1.0,
        telegraphSkills: [
          {
            id: 'ice_spear_pierce',
            name: 'Lança Glacial Perfurante',
            shape: 'LINE',
            castDurationMs: 1000,
            cooldownMs: 7000,
            damageMultiplier: 1.3,
            radius: 14.0,
            lineWidth: 2.0,
            statusEffect: 'SLOW',
            effectDurationMs: 3000,
            description: 'Dispara um espigão de gelo colossal que prega o guerreiro no chão.',
          },
        ],
      },
      {
        phaseIndex: 2,
        name: 'Valsa da Nevasca Ártica',
        hpThresholdPercent: 55,
        shieldHp: 12000,
        attackSpeedMultiplier: 1.25,
        damageMultiplier: 1.2,
        auraDamagePerSec: 25,
        auraType: 'ICE',
        telegraphSkills: [
          {
            id: 'ice_blizzard_waltz',
            name: 'Valsa da Nevasca Branca',
            shape: 'CIRCLE',
            castDurationMs: 2200,
            cooldownMs: 12000,
            damageMultiplier: 2.0,
            radius: 8.5,
            statusEffect: 'FREEZE',
            effectDurationMs: 3000,
            description: 'Cria tempestade polar que reduz campo de visão e congela sólidos em raio.',
          },
        ],
      },
      {
        phaseIndex: 3,
        name: 'Explosão Polar Final',
        hpThresholdPercent: 20,
        attackSpeedMultiplier: 1.5,
        damageMultiplier: 1.4,
        enraged: true,
        telegraphSkills: [
          {
            id: 'ice_polar_cataclysm',
            name: 'Cataclismo Polar Zero Absoluto',
            shape: 'ARENA_WIDE',
            castDurationMs: 3000,
            cooldownMs: 18000,
            damageMultiplier: 2.8,
            radius: 25.0,
            statusEffect: 'FREEZE',
            effectDurationMs: 3500,
            description: 'Explosão em toda a sala que precisa ter seu canal interrompido com quebra de postura.',
          },
        ],
      },
    ],
    dropTable: [
      { itemDefId: 'jewel_of_blessing', chance: 0.90 },
      { itemDefId: 'jewel_of_soul', chance: 0.75 },
      { itemDefId: 'ring_of_ice', chance: 0.45, maxLevel: 0, excellentChance: 0.60 },
      { itemDefId: 'ice_staff', chance: 0.35, maxLevel: 5, allowLuck: true, allowSkill: true, excellentChance: 0.40 },
      { itemDefId: 'box_of_kundun_2', chance: 0.50 },
    ],
  },

  // =========================================================================
  // 3. BALROG — O Lorde do Abismo Infernal (Lost Tower 7)
  // =========================================================================
  boss_balrog: {
    type: 'boss_balrog',
    name: 'Balrog',
    title: 'O Lorde do Abismo Infernal',
    level: 80,
    maxHp: 160000,
    defense: 220,
    defenseRate: 150,
    attackMin: 340,
    attackMax: 480,
    attackRate: 350,
    moveSpeed: 60,
    xpReward: 75000,
    maxPoise: 550,
    zenMin: 120000,
    zenMax: 350000,
    location: 'LT_07',
    phases: [
      {
        phaseIndex: 1,
        name: 'Tremor dos Céus e Foice Vulcânica',
        hpThresholdPercent: 100,
        attackSpeedMultiplier: 1.0,
        damageMultiplier: 1.0,
        telegraphSkills: [
          {
            id: 'balrog_scythe_cleave',
            name: 'Ceifa das Chamas Infernais',
            shape: 'CONE',
            castDurationMs: 1400,
            cooldownMs: 7000,
            damageMultiplier: 1.5,
            radius: 9.0,
            angleDeg: 180,
            statusEffect: 'KNOCKBACK',
            effectDurationMs: 1200,
            description: 'Golpe horizontal de 180° com a foice em brasa empurrando guerreiros contra as paredes.',
          },
        ],
      },
      {
        phaseIndex: 2,
        name: 'Asas da Danação e Fúria Magmática',
        hpThresholdPercent: 60,
        shieldHp: 28000,
        attackSpeedMultiplier: 1.25,
        damageMultiplier: 1.3,
        summonAdds: {
          monsterType: 'hound',
          count: 4,
        },
        telegraphSkills: [
          {
            id: 'balrog_wings_of_damnation',
            name: 'Vórtice das Asas da Danação',
            shape: 'CIRCLE',
            castDurationMs: 2000,
            cooldownMs: 11000,
            damageMultiplier: 2.1,
            radius: 8.0,
            statusEffect: 'BURN',
            effectDurationMs: 4000,
            description: 'Bate asas de membrana negra conjurando furacões de fogo infernal.',
          },
        ],
      },
      {
        phaseIndex: 3,
        name: 'Lorde Enraivecido do Fogo Eterno',
        hpThresholdPercent: 25,
        attackSpeedMultiplier: 1.5,
        damageMultiplier: 1.6,
        enraged: true,
        auraDamagePerSec: 50,
        auraType: 'FIRE',
        telegraphSkills: [
          {
            id: 'balrog_hellfire_apocalypse',
            name: 'Apocalipse Vulcânico da Torre',
            shape: 'ARENA_WIDE',
            castDurationMs: 3200,
            cooldownMs: 20000,
            damageMultiplier: 3.0,
            radius: 30.0,
            statusEffect: 'STUN',
            effectDurationMs: 2500,
            description: 'Cravando a foice no solo, abre fissuras de magma incandescentes sob toda a arena.',
          },
        ],
      },
    ],
    dropTable: [
      { itemDefId: 'jewel_of_blessing', chance: 1.0 },
      { itemDefId: 'jewel_of_soul', chance: 1.0 },
      { itemDefId: 'jewel_of_life', chance: 0.65 },
      { itemDefId: 'jewel_of_chaos', chance: 0.80 },
      { itemDefId: 'dragon_slayer', chance: 0.30, maxLevel: 6, allowLuck: true, allowSkill: true, excellentChance: 0.60 },
      { itemDefId: 'archangel_sword', chance: 0.20, maxLevel: 6, allowLuck: true, allowSkill: true, excellentChance: 0.50 },
      { itemDefId: 'box_of_kundun_4', chance: 0.60 },
    ],
  },

  // =========================================================================
  // 4. ZAIKAN — O Flagelo das Areias de Tarkan (Tarkan Desert)
  // =========================================================================
  boss_zaikan: {
    type: 'boss_zaikan',
    name: 'Zaikan',
    title: 'O Flagelo das Areias',
    level: 90,
    maxHp: 240000,
    defense: 290,
    defenseRate: 210,
    attackMin: 420,
    attackMax: 590,
    attackRate: 420,
    moveSpeed: 75,
    xpReward: 110000,
    maxPoise: 700,
    zenMin: 200000,
    zenMax: 500000,
    location: 'TAR_05',
    phases: [
      {
        phaseIndex: 1,
        name: 'Predador das Dunas',
        hpThresholdPercent: 100,
        attackSpeedMultiplier: 1.0,
        damageMultiplier: 1.0,
        telegraphSkills: [
          {
            id: 'zaikan_dune_dive',
            name: 'Mergulho & Erupção nas Dunas',
            shape: 'CIRCLE',
            castDurationMs: 1600,
            cooldownMs: 9000,
            damageMultiplier: 1.7,
            radius: 6.5,
            statusEffect: 'KNOCKBACK',
            effectDurationMs: 1500,
            description: 'Mergulha sob a areia e irrompe sob os pés com força sísmica de lançamento.',
          },
        ],
      },
      {
        phaseIndex: 2,
        name: 'Raio Térmico Solar',
        hpThresholdPercent: 55,
        shieldHp: 35000,
        attackSpeedMultiplier: 1.25,
        damageMultiplier: 1.35,
        telegraphSkills: [
          {
            id: 'zaikan_solar_vacuum',
            name: 'Rajada de Vácuo Solar',
            shape: 'CONE',
            castDurationMs: 2400,
            cooldownMs: 13000,
            damageMultiplier: 2.3,
            radius: 15.0,
            angleDeg: 120,
            statusEffect: 'BURN',
            effectDurationMs: 3500,
            description: 'Abre a carapaça e dispara feixe térmico em arco contínuo de varredura.',
          },
        ],
      },
      {
        phaseIndex: 3,
        name: 'Monstruosidade Biomecânica Feroz',
        hpThresholdPercent: 20,
        attackSpeedMultiplier: 1.6,
        damageMultiplier: 1.65,
        enraged: true,
        auraDamagePerSec: 60,
        auraType: 'FIRE',
        telegraphSkills: [
          {
            id: 'zaikan_sandstorm_maelstrom',
            name: 'Turbilhão de Tempestade de Areia',
            shape: 'ARENA_WIDE',
            castDurationMs: 2800,
            cooldownMs: 16000,
            damageMultiplier: 2.7,
            radius: 28.0,
            statusEffect: 'SLOW',
            effectDurationMs: 4000,
            description: 'Cria redemoinho titânico de areia cegando e arrancando armadura dos alvos.',
          },
        ],
      },
    ],
    dropTable: [
      { itemDefId: 'jewel_of_blessing', chance: 1.0 },
      { itemDefId: 'jewel_of_soul', chance: 1.0 },
      { itemDefId: 'jewel_of_life', chance: 0.80 },
      { itemDefId: 'jewel_of_chaos', chance: 0.90 },
      { itemDefId: 'dragon_armor', chance: 0.40, maxLevel: 7, allowLuck: true, excellentChance: 0.65 },
      { itemDefId: 'chaos_dragon_axe', chance: 0.35, maxLevel: 7, allowLuck: true, allowSkill: true, excellentChance: 0.60 },
      { itemDefId: 'box_of_kundun_5', chance: 0.70 },
    ],
  },

  // =========================================================================
  // 5. KUNDUN — A Encarnação do Senhor da Escuridão (World Boss / Kalima)
  // =========================================================================
  boss_kundun: {
    type: 'boss_kundun',
    name: 'Kundun',
    title: 'O Senhor da Escuridão',
    level: 120,
    maxHp: 650000,
    defense: 450,
    defenseRate: 350,
    attackMin: 680,
    attackMax: 980,
    attackRate: 650,
    moveSpeed: 70,
    xpReward: 350000,
    maxPoise: 1200,
    zenMin: 500000,
    zenMax: 1500000,
    location: 'KAL_01',
    phases: [
      {
        phaseIndex: 1,
        name: 'Despertar Cósmico do Caos',
        hpThresholdPercent: 100,
        attackSpeedMultiplier: 1.0,
        damageMultiplier: 1.0,
        telegraphSkills: [
          {
            id: 'kundun_dark_orbs',
            name: 'Esferas Cósmicas da Danação',
            shape: 'CONE',
            castDurationMs: 1500,
            cooldownMs: 8000,
            damageMultiplier: 1.6,
            radius: 16.0,
            angleDeg: 90,
            statusEffect: 'SLOW',
            effectDurationMs: 3000,
            description: 'Conjura projéteis de matéria escura que desintegram proteções mágicas.',
          },
        ],
      },
      {
        phaseIndex: 2,
        name: 'Distorção Espaço-Temporal & Ilusões',
        hpThresholdPercent: 70,
        shieldHp: 60000,
        attackSpeedMultiplier: 1.25,
        damageMultiplier: 1.3,
        summonAdds: {
          monsterType: 'skeleton',
          count: 4,
        },
        telegraphSkills: [
          {
            id: 'kundun_time_warp',
            name: 'Distorção Gravitacional',
            shape: 'CIRCLE',
            castDurationMs: 2200,
            cooldownMs: 13000,
            damageMultiplier: 2.2,
            radius: 10.0,
            statusEffect: 'STUN',
            effectDurationMs: 2500,
            description: 'Dobra o tecido do espaço atraindo todos os heróis para o vórtice.',
          },
        ],
      },
      {
        phaseIndex: 3,
        name: 'Dreno Ancestral de Vida',
        hpThresholdPercent: 40,
        shieldHp: 45000,
        attackSpeedMultiplier: 1.4,
        damageMultiplier: 1.5,
        auraDamagePerSec: 80,
        auraType: 'ABYSS',
        telegraphSkills: [
          {
            id: 'kundun_life_leech',
            name: 'Sucção de Almas Imortais',
            shape: 'ARENA_WIDE',
            castDurationMs: 3000,
            cooldownMs: 18000,
            damageMultiplier: 2.5,
            radius: 35.0,
            statusEffect: 'KNOCKBACK',
            effectDurationMs: 2000,
            description: 'Drena energia vital dos heróis para restaurar sua própria couraça protetora.',
          },
        ],
      },
      {
        phaseIndex: 4,
        name: 'Cataclismo de Kundun (Enrage Máximo)',
        hpThresholdPercent: 15,
        attackSpeedMultiplier: 1.7,
        damageMultiplier: 1.8,
        enraged: true,
        auraDamagePerSec: 120,
        auraType: 'ABYSS',
        telegraphSkills: [
          {
            id: 'kundun_final_judgment',
            name: 'Cataclismo Supremo de Kundun',
            shape: 'ARENA_WIDE',
            castDurationMs: 3500,
            cooldownMs: 15000,
            damageMultiplier: 3.5,
            radius: 40.0,
            statusEffect: 'PETRIFY',
            effectDurationMs: 3000,
            description: 'Golpe apocalíptico com aniquilação estelar.',
          },
        ],
      },
    ],
    dropTable: [
      { itemDefId: 'jewel_of_blessing', chance: 1.0 },
      { itemDefId: 'jewel_of_soul', chance: 1.0 },
      { itemDefId: 'jewel_of_life', chance: 1.0 },
      { itemDefId: 'jewel_of_harmony', chance: 0.90 },
      { itemDefId: 'kundun_staff', chance: 0.40, maxLevel: 8, allowLuck: true, allowSkill: true, excellentChance: 0.80 },
      { itemDefId: 'dragon_slayer', chance: 0.35, maxLevel: 8, allowLuck: true, allowSkill: true, excellentChance: 0.75 },
      { itemDefId: 'box_of_kundun_5', chance: 1.0 },
      { itemDefId: 'box_of_kundun_5', chance: 0.5 },
    ],
  },
};
