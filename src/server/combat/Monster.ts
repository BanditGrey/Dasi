/**
 * Dasi MMORPG - Entidade de Monstro e Tabela de Drops Autoritativa
 * Baseado no Bestiário clássico do Continent of Legend (MU Online).
 */

import { Item } from '../inventory/Item.ts';
import { WeaponExcellentOption, ArmorExcellentOption, ItemCategory } from '../inventory/types.ts';
import type { ItemInstance } from '../inventory/types.ts';

export type MonsterState = 'IDLE' | 'MOVING' | 'ATTACKING' | 'STAGGERED' | 'DEAD';

export interface MonsterDefinition {
  type: string;
  name: string;
  level: number;
  maxHp: number;
  defense: number;
  defenseRate: number; // Taxa de esquiva / evasão
  attackMin: number;
  attackMax: number;
  attackRate: number;
  moveSpeed: number; // Unidades por segundo
  xpReward: number;
  maxPoise: number;
  dropTable: DropTableEntry[];
  zenMin: number;
  zenMax: number;
}

export interface DropTableEntry {
  itemDefId: string;
  chance: number; // 0.0 a 1.0 (ex: 0.02 = 2%)
  maxLevel?: number;
  allowSkill?: boolean;
  allowLuck?: boolean;
  excellentChance?: number; // chance de vir excelente
}

export interface GroundDropItem {
  dropId: string;
  item: ItemInstance | null;
  zen: number;
  x: number;
  y: number;
  createdAt: number;
  expiresAt: number;
  ownerSessionId?: string;
  isJewel: boolean;
  isExcellent: boolean;
}

export interface SerializedMonster {
  id: string;
  type: string;
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: MonsterState;
  isDead: boolean;
}

export const MONSTER_DEFINITIONS: Record<string, MonsterDefinition> = {
  spider: {
    type: 'spider',
    name: 'Spider',
    level: 2,
    maxHp: 40,
    defense: 3,
    defenseRate: 4,
    attackMin: 8,
    attackMax: 12,
    attackRate: 15,
    moveSpeed: 45,
    xpReward: 35,
    maxPoise: 20,
    zenMin: 50,
    zenMax: 180,
    dropTable: [
      { itemDefId: 'jewel_of_blessing', chance: 0.02 },
      { itemDefId: 'jewel_of_chaos', chance: 0.04 },
      { itemDefId: 'small_dagger', chance: 0.15, maxLevel: 2, allowLuck: true, allowSkill: true, excellentChance: 0.08 },
      { itemDefId: 'short_sword', chance: 0.10, maxLevel: 2, allowLuck: true, allowSkill: true, excellentChance: 0.05 },
    ],
  },
  budge_dragon: {
    type: 'budge_dragon',
    name: 'Budge Dragon',
    level: 4,
    maxHp: 65,
    defense: 4,
    defenseRate: 6,
    attackMin: 12,
    attackMax: 18,
    attackRate: 20,
    moveSpeed: 60,
    xpReward: 60,
    maxPoise: 25,
    zenMin: 80,
    zenMax: 240,
    dropTable: [
      { itemDefId: 'jewel_of_chaos', chance: 0.05 },
      { itemDefId: 'jewel_of_blessing', chance: 0.02 },
      { itemDefId: 'small_dagger', chance: 0.12, maxLevel: 2, allowLuck: true, allowSkill: true, excellentChance: 0.06 },
    ],
  },
  hound: {
    type: 'hound',
    name: 'Hound',
    level: 9,
    maxHp: 130,
    defense: 9,
    defenseRate: 10,
    attackMin: 22,
    attackMax: 30,
    attackRate: 35,
    moveSpeed: 70,
    xpReward: 140,
    maxPoise: 35,
    zenMin: 150,
    zenMax: 450,
    dropTable: [
      { itemDefId: 'jewel_of_blessing', chance: 0.03 },
      { itemDefId: 'jewel_of_soul', chance: 0.025 },
      { itemDefId: 'jewel_of_chaos', chance: 0.05 },
      { itemDefId: 'dragon_gloves', chance: 0.08, maxLevel: 3, allowLuck: true, excellentChance: 0.06 },
      { itemDefId: 'dragon_boots', chance: 0.08, maxLevel: 3, allowLuck: true, excellentChance: 0.06 },
    ],
  },
  bull_fighter: {
    type: 'bull_fighter',
    name: 'Bull Fighter',
    level: 6,
    maxHp: 95,
    defense: 6,
    defenseRate: 7,
    attackMin: 16,
    attackMax: 24,
    attackRate: 25,
    moveSpeed: 50,
    xpReward: 90,
    maxPoise: 40,
    zenMin: 100,
    zenMax: 320,
    dropTable: [
      { itemDefId: 'jewel_of_blessing', chance: 0.025 },
      { itemDefId: 'jewel_of_chaos', chance: 0.045 },
      { itemDefId: 'short_sword', chance: 0.12, maxLevel: 3, allowLuck: true, allowSkill: true, excellentChance: 0.07 },
      { itemDefId: 'dragon_helm', chance: 0.07, maxLevel: 3, allowLuck: true, excellentChance: 0.05 },
      { itemDefId: 'dragon_shield', chance: 0.05, maxLevel: 3, allowLuck: true, allowSkill: true, excellentChance: 0.05 },
    ],
  },
  skeleton: {
    type: 'skeleton',
    name: 'Skeleton',
    level: 14,
    maxHp: 230,
    defense: 15,
    defenseRate: 14,
    attackMin: 38,
    attackMax: 48,
    attackRate: 50,
    moveSpeed: 55,
    xpReward: 290,
    maxPoise: 50,
    zenMin: 300,
    zenMax: 900,
    dropTable: [
      { itemDefId: 'jewel_of_blessing', chance: 0.04 },
      { itemDefId: 'jewel_of_soul', chance: 0.035 },
      { itemDefId: 'jewel_of_life', chance: 0.02 },
      { itemDefId: 'jewel_of_chaos', chance: 0.06 },
      { itemDefId: 'dragon_blade', chance: 0.05, maxLevel: 4, allowLuck: true, allowSkill: true, excellentChance: 0.10 },
      { itemDefId: 'dragon_armor', chance: 0.06, maxLevel: 4, allowLuck: true, excellentChance: 0.08 },
      { itemDefId: 'dragon_pants', chance: 0.06, maxLevel: 4, allowLuck: true, excellentChance: 0.08 },
      { itemDefId: 'ring_of_ice', chance: 0.03, maxLevel: 0, excellentChance: 0.05 },
    ],
  },
  golden_budge_dragon: {
    type: 'golden_budge_dragon',
    name: 'Golden Budge Dragon',
    level: 25,
    maxHp: 1800,
    defense: 45,
    defenseRate: 60,
    attackMin: 45,
    attackMax: 70,
    attackRate: 85,
    moveSpeed: 85,
    xpReward: 3500,
    maxPoise: 80,
    zenMin: 5000,
    zenMax: 15000,
    dropTable: [
      { itemDefId: 'box_of_kundun_1', chance: 1.0 },
      { itemDefId: 'jewel_of_chaos', chance: 0.8 },
      { itemDefId: 'jewel_of_blessing', chance: 0.4 },
    ],
  },
  golden_soldier: {
    type: 'golden_soldier',
    name: 'Golden Soldier',
    level: 45,
    maxHp: 6500,
    defense: 95,
    defenseRate: 90,
    attackMin: 110,
    attackMax: 165,
    attackRate: 150,
    moveSpeed: 60,
    xpReward: 9500,
    maxPoise: 160,
    zenMin: 15000,
    zenMax: 40000,
    dropTable: [
      { itemDefId: 'box_of_kundun_2', chance: 1.0 },
      { itemDefId: 'jewel_of_blessing', chance: 0.7 },
      { itemDefId: 'jewel_of_soul', chance: 0.5 },
    ],
  },
  golden_titan: {
    type: 'golden_titan',
    name: 'Golden Titan',
    level: 65,
    maxHp: 18000,
    defense: 160,
    defenseRate: 140,
    attackMin: 220,
    attackMax: 310,
    attackRate: 230,
    moveSpeed: 55,
    xpReward: 22000,
    maxPoise: 280,
    zenMin: 35000,
    zenMax: 90000,
    dropTable: [
      { itemDefId: 'box_of_kundun_3', chance: 1.0 },
      { itemDefId: 'jewel_of_blessing', chance: 0.9 },
      { itemDefId: 'jewel_of_soul', chance: 0.8 },
      { itemDefId: 'jewel_of_life', chance: 0.5 },
    ],
  },
  golden_tantalos: {
    type: 'golden_tantalos',
    name: 'Golden Tantalos',
    level: 85,
    maxHp: 45000,
    defense: 250,
    defenseRate: 200,
    attackMin: 360,
    attackMax: 490,
    attackRate: 340,
    moveSpeed: 70,
    xpReward: 55000,
    maxPoise: 420,
    zenMin: 80000,
    zenMax: 200000,
    dropTable: [
      { itemDefId: 'box_of_kundun_4', chance: 1.0 },
      { itemDefId: 'jewel_of_blessing', chance: 1.0 },
      { itemDefId: 'jewel_of_soul', chance: 1.0 },
      { itemDefId: 'jewel_of_life', chance: 0.7 },
    ],
  },
  golden_dragon: {
    type: 'golden_dragon',
    name: 'Great Golden Dragon',
    level: 105,
    maxHp: 95000,
    defense: 380,
    defenseRate: 290,
    attackMin: 520,
    attackMax: 720,
    attackRate: 480,
    moveSpeed: 75,
    xpReward: 120000,
    maxPoise: 650,
    zenMin: 180000,
    zenMax: 450000,
    dropTable: [
      { itemDefId: 'box_of_kundun_5', chance: 1.0 },
      { itemDefId: 'box_of_kundun_5', chance: 0.5 },
      { itemDefId: 'jewel_of_blessing', chance: 1.0 },
      { itemDefId: 'jewel_of_soul', chance: 1.0 },
      { itemDefId: 'jewel_of_life', chance: 0.9 },
    ],
  },

  // ==========================================
  // CHEFES MUNDIAIS LENDÁRIOS (WORLD BOSSES)
  // ==========================================
  ice_queen: {
    type: 'ice_queen',
    name: 'Ice Queen (A Dama Solitária de Boreal)',
    level: 52,
    maxHp: 16000,
    defense: 110,
    defenseRate: 90,
    attackMin: 140,
    attackMax: 190,
    attackRate: 160,
    moveSpeed: 60,
    xpReward: 18000,
    maxPoise: 250,
    zenMin: 20000,
    zenMax: 60000,
    dropTable: [
      { itemDefId: 'box_of_kundun_2', chance: 1.0 },
      { itemDefId: 'lochs_feather', chance: 0.35 },
      { itemDefId: 'jewel_of_blessing', chance: 0.8 },
      { itemDefId: 'jewel_of_soul', chance: 0.7 },
      { itemDefId: 'crystal_sword', chance: 0.25, maxLevel: 3, allowLuck: true, allowSkill: true, excellentChance: 0.15 },
      { itemDefId: 'dragon_helm', chance: 0.25, maxLevel: 3, allowLuck: true, excellentChance: 0.15 },
    ],
  },
  gorgon: {
    type: 'gorgon',
    name: 'Gorgon (O Guardião do Abismo)',
    level: 55,
    maxHp: 20000,
    defense: 130,
    defenseRate: 100,
    attackMin: 160,
    attackMax: 220,
    attackRate: 180,
    moveSpeed: 55,
    xpReward: 24000,
    maxPoise: 300,
    zenMin: 30000,
    zenMax: 70000,
    dropTable: [
      { itemDefId: 'box_of_kundun_2', chance: 1.0 },
      { itemDefId: 'jewel_of_chaos', chance: 0.9 },
      { itemDefId: 'jewel_of_blessing', chance: 0.8 },
      { itemDefId: 'chaos_dragon_axe', chance: 0.3, maxLevel: 3, allowLuck: true, allowSkill: true, excellentChance: 0.2 },
      { itemDefId: 'skull_shield', chance: 0.35, maxLevel: 3, allowLuck: true, excellentChance: 0.15 },
      { itemDefId: 'plate_armor', chance: 0.25, maxLevel: 3, allowLuck: true, excellentChance: 0.15 },
    ],
  },
  hydra: {
    type: 'hydra',
    name: 'Hydra (O Terror Abissal de Atlans)',
    level: 74,
    maxHp: 38000,
    defense: 210,
    defenseRate: 170,
    attackMin: 280,
    attackMax: 390,
    attackRate: 280,
    moveSpeed: 70,
    xpReward: 48000,
    maxPoise: 400,
    zenMin: 60000,
    zenMax: 180000,
    dropTable: [
      { itemDefId: 'box_of_kundun_3', chance: 1.0 },
      { itemDefId: 'crest_of_monarch', chance: 0.35 },
      { itemDefId: 'arrow_viper_bow', chance: 0.3, maxLevel: 4, allowLuck: true, allowSkill: true, excellentChance: 0.25 },
      { itemDefId: 'great_lord_scepter', chance: 0.3, maxLevel: 4, allowLuck: true, allowSkill: true, excellentChance: 0.25 },
      { itemDefId: 'guardian_armor', chance: 0.3, maxLevel: 4, allowLuck: true, excellentChance: 0.2 },
      { itemDefId: 'jewel_of_blessing', chance: 0.9 },
      { itemDefId: 'jewel_of_soul', chance: 0.9 },
    ],
  },
  balrog: {
    type: 'balrog',
    name: 'Balrog (O Lorde do Abismo Infernal)',
    level: 84,
    maxHp: 55000,
    defense: 280,
    defenseRate: 210,
    attackMin: 380,
    attackMax: 520,
    attackRate: 350,
    moveSpeed: 65,
    xpReward: 70000,
    maxPoise: 500,
    zenMin: 90000,
    zenMax: 250000,
    dropTable: [
      { itemDefId: 'box_of_kundun_4', chance: 1.0 },
      { itemDefId: 'condor_feather', chance: 0.3 },
      { itemDefId: 'sword_of_destruction', chance: 0.35, maxLevel: 5, allowLuck: true, allowSkill: true, excellentChance: 0.3 },
      { itemDefId: 'archangel_sword', chance: 0.2, maxLevel: 5, allowLuck: true, allowSkill: true, excellentChance: 0.3 },
      { itemDefId: 'black_dragon_armor', chance: 0.3, maxLevel: 5, allowLuck: true, excellentChance: 0.25 },
      { itemDefId: 'grand_soul_armor', chance: 0.3, maxLevel: 5, allowLuck: true, excellentChance: 0.25 },
      { itemDefId: 'jewel_of_blessing', chance: 1.0 },
      { itemDefId: 'jewel_of_soul', chance: 1.0 },
    ],
  },
  zaikan: {
    type: 'zaikan',
    name: 'Zaikan (O Flagelo das Areias de Tarkan)',
    level: 95,
    maxHp: 80000,
    defense: 340,
    defenseRate: 260,
    attackMin: 460,
    attackMax: 640,
    attackRate: 420,
    moveSpeed: 80,
    xpReward: 100000,
    maxPoise: 600,
    zenMin: 150000,
    zenMax: 400000,
    dropTable: [
      { itemDefId: 'box_of_kundun_5', chance: 1.0 },
      { itemDefId: 'condor_flame', chance: 0.25 },
      { itemDefId: 'bone_blade', chance: 0.25, maxLevel: 5, allowLuck: true, allowSkill: true, excellentChance: 0.35 },
      { itemDefId: 'grand_viper_staff', chance: 0.25, maxLevel: 5, allowLuck: true, allowSkill: true, excellentChance: 0.35 },
      { itemDefId: 'dark_phoenix_armor', chance: 0.25, maxLevel: 5, allowLuck: true, excellentChance: 0.3 },
      { itemDefId: 'dark_soul_armor', chance: 0.25, maxLevel: 5, allowLuck: true, excellentChance: 0.3 },
      { itemDefId: 'jewel_of_blessing', chance: 1.0 },
      { itemDefId: 'jewel_of_soul', chance: 1.0 },
      { itemDefId: 'jewel_of_life', chance: 0.8 },
    ],
  },
};

let mobCounter = 1;
let dropCounter = 1;

export class Monster {
  public readonly id: string;
  public readonly type: string;
  public readonly name: string;
  public readonly level: number;
  public maxHp: number;
  public currentHp: number;
  public defense: number;
  public defenseRate: number;
  public attackMin: number;
  public attackMax: number;
  public attackRate: number;
  public moveSpeed: number;
  public xpReward: number;
  public maxPoise: number;
  public poise: number;

  public x: number;
  public y: number;
  public spawnX: number;
  public spawnY: number;
  public targetX: number;
  public targetY: number;

  public state: MonsterState = 'IDLE';
  public isDead = false;
  public staggerUntil = 0;
  public corpseExpiresAt = 0;
  public readonly dropTable: DropTableEntry[];
  public readonly zenMin: number;
  public readonly zenMax: number;

  constructor(type: string, x: number, y: number, customDef?: Partial<MonsterDefinition>) {
    const baseDef = MONSTER_DEFINITIONS[type] || MONSTER_DEFINITIONS.spider;
    const def = { ...baseDef, ...customDef };

    this.id = `mob-${type}-${(mobCounter++).toString(16).padStart(4, '0')}`;
    this.type = type;
    this.name = def.name;
    this.level = def.level;
    this.maxHp = def.maxHp;
    this.currentHp = def.maxHp;
    this.defense = def.defense;
    this.defenseRate = def.defenseRate;
    this.attackMin = def.attackMin;
    this.attackMax = def.attackMax;
    this.attackRate = def.attackRate;
    this.moveSpeed = def.moveSpeed;
    this.xpReward = def.xpReward;
    this.maxPoise = def.maxPoise;
    this.poise = def.maxPoise;

    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.targetX = x;
    this.targetY = y;

    this.dropTable = def.dropTable;
    this.zenMin = def.zenMin;
    this.zenMax = def.zenMax;
  }

  /**
   * Aplica dano autoritativo, poise/stagger e calcula morte
   */
  public takeDamage(
    amount: number,
    poiseDamage = 15,
    knockbackDist = 0,
    knockbackDirX = 0,
    knockbackDirY = 0
  ): { damageTaken: number; isDead: boolean; staggered: boolean } {
    if (this.isDead) {
      return { damageTaken: 0, isDead: true, staggered: false };
    }

    const damageTaken = Math.min(this.currentHp, Math.max(1, amount));
    this.currentHp -= damageTaken;

    // Redução de Postura (Poise)
    this.poise -= poiseDamage;
    let staggered = false;

    if (this.poise <= 0) {
      staggered = true;
      this.poise = this.maxPoise; // Reseta após quebra de postura
      this.state = 'STAGGERED';
      this.staggerUntil = Date.now() + 150; // 150ms de hit-stop / flinch
    }

    // Aplicação de Knockback se houver vetor de empurrão
    if (knockbackDist > 0 && (knockbackDirX !== 0 || knockbackDirY !== 0)) {
      const len = Math.hypot(knockbackDirX, knockbackDirY) || 1;
      const nx = knockbackDirX / len;
      const ny = knockbackDirY / len;
      this.x += nx * knockbackDist;
      this.y += ny * knockbackDist;
      this.targetX = this.x;
      this.targetY = this.y;
    }

    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.isDead = true;
      this.state = 'DEAD';
      this.corpseExpiresAt = Date.now() + 3000; // Desaparece após 3s
      return { damageTaken, isDead: true, staggered: true };
    }

    return { damageTaken, isDead: false, staggered };
  }

  /**
   * Gera drops no chão com base na tabela de loot e coordenadas
   */
  public rollDrops(ownerSessionId?: string): GroundDropItem[] {
    const drops: GroundDropItem[] = [];
    const now = Date.now();
    const dropLifetime = 60000; // 60 segundos no chão

    // 1. Drop de Zen (ouro)
    const zenAmount = Math.floor(this.zenMin + Math.random() * (this.zenMax - this.zenMin + 1));
    if (zenAmount > 0) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 20;
      drops.push({
        dropId: `drop-zen-${(dropCounter++).toString(16)}`,
        item: null,
        zen: zenAmount,
        x: Math.round(this.x + Math.cos(angle) * dist),
        y: Math.round(this.y + Math.sin(angle) * dist),
        createdAt: now,
        expiresAt: now + dropLifetime,
        ownerSessionId,
        isJewel: false,
        isExcellent: false,
      });
    }

    // 2. Drop de Itens da Tabela de Loot
    for (const entry of this.dropTable) {
      if (Math.random() <= entry.chance) {
        try {
          const maxLvl = entry.maxLevel ?? 0;
          const level = maxLvl > 0 ? Math.floor(Math.random() * (maxLvl + 1)) : 0;
          const luck = entry.allowLuck ? Math.random() < 0.25 : false;
          const skill = entry.allowSkill ? Math.random() < 0.30 : false;

          let excellentMask = 0;
          const isExcellent = entry.excellentChance ? Math.random() <= entry.excellentChance : false;

          if (isExcellent) {
            // Seleciona 1 ou 2 opções excelentes aleatórias
            const isWeapon = entry.itemDefId.includes('blade') || entry.itemDefId.includes('sword') || entry.itemDefId.includes('dagger');
            if (isWeapon) {
              const opts = [
                WeaponExcellentOption.INCREASE_DMG_2_PERCENT,
                WeaponExcellentOption.EXCELLENT_DAMAGE_10_PCT,
                WeaponExcellentOption.ATTACK_SPEED_7,
                WeaponExcellentOption.MANA_PER_KILL,
                WeaponExcellentOption.HP_PER_KILL,
              ];
              const chosen = opts[Math.floor(Math.random() * opts.length)];
              excellentMask |= chosen;
            } else {
              const opts = [
                ArmorExcellentOption.DEFENSE_RATE_10_PCT,
                ArmorExcellentOption.DAMAGE_DECREASE_4_PCT,
                ArmorExcellentOption.REFLECT_DAMAGE_5_PCT,
                ArmorExcellentOption.INCREASE_HP_4_PCT,
                ArmorExcellentOption.ZEN_30_PERCENT,
              ];
              const chosen = opts[Math.floor(Math.random() * opts.length)];
              excellentMask |= chosen;
            }
          }

          const item = Item.create(entry.itemDefId, {
            level,
            luck,
            skill,
            excellentMask,
          });

          const isJewel = Item.getDefinition(item).category === ItemCategory.JEWEL;
          const angle = Math.random() * Math.PI * 2;
          const dist = 15 + Math.random() * 25;

          drops.push({
            dropId: `drop-item-${(dropCounter++).toString(16)}`,
            item,
            zen: 0,
            x: Math.round(this.x + Math.cos(angle) * dist),
            y: Math.round(this.y + Math.sin(angle) * dist),
            createdAt: now,
            expiresAt: now + dropLifetime,
            ownerSessionId,
            isJewel,
            isExcellent,
          });
        } catch (e) {
          console.warn('[Monster] Falha criando item de drop:', entry.itemDefId, e);
        }
      }
    }

    return drops;
  }

  /**
   * Atualização de IA / Movimentação do monstro
   */
  public update(deltaTimeSec: number): void {
    if (this.isDead) return;

    const now = Date.now();
    if (this.state === 'STAGGERED') {
      if (now >= this.staggerUntil) {
        this.state = 'IDLE';
      }
      return;
    }

    // Se possui destino de caminhada
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 3) {
      this.state = 'MOVING';
      const step = Math.min(dist, this.moveSpeed * deltaTimeSec);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
      this.state = 'IDLE';
    }
  }

  /**
   * Define novo alvo de movimentação com restrição de raio de spawn
   */
  public wander(radius = 120): void {
    if (this.isDead || this.state === 'STAGGERED') return;

    const angle = Math.random() * Math.PI * 2;
    const dist = 15 + Math.random() * Math.max(10, radius - 15);
    this.targetX = Math.round(this.spawnX + Math.cos(angle) * dist);
    this.targetY = Math.round(this.spawnY + Math.sin(angle) * dist);
    this.state = 'MOVING';
  }

  public serialize(): SerializedMonster {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      level: this.level,
      currentHp: this.currentHp,
      maxHp: this.maxHp,
      x: Math.round(this.x),
      y: Math.round(this.y),
      targetX: Math.round(this.targetX),
      targetY: Math.round(this.targetY),
      state: this.state,
      isDead: this.isDead,
    };
  }
}
