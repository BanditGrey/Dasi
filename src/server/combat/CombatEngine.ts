/**
 * Dasi MMORPG - Motor de Combate Autoritativo e Feedback de Impacto
 * Implementa cálculo de acerto/erro, fórmulas de dano por cores,
 * efeitos de impacto (Hit-Stop/Stagger/Knockback) e drops físicos no chão.
 */

import { Monster, type GroundDropItem } from './Monster.ts';
import { MobSpawner } from './MobSpawner.ts';
import type { BossManager } from '../bosses/BossManager.ts';
import { Item } from '../inventory/Item.ts';
import { EquipmentSlot, WeaponExcellentOption, ItemCategory } from '../inventory/types.ts';
import type { ClientSession } from '../network/SessionManager.ts';
import type { ItemInstance } from '../inventory/types.ts';
import { CanonicalFormulas, CharacterClassId, type CharacterAttributes } from './CanonicalFormulas.ts';
import { DropManager, type HitDamageEntry } from './DropManager.ts';
import { ComboSkillEngine } from './ComboSkillEngine.ts';
import { SkillCatalog } from './SkillCatalog.ts';
import { EffectId } from './EffectManager.ts';

export type DamageType = 'NORMAL' | 'SKILL' | 'CRITICAL' | 'EXCELLENT' | 'IGNORE_DEFENSE' | 'MISS';

export interface DamageColorConfig {
  type: DamageType;
  colorHex: string;
  label: string;
  hitStopMs: number;
}

export const DAMAGE_COLORS: Record<DamageType, DamageColorConfig> = {
  NORMAL: { type: 'NORMAL', colorHex: '#FFFFFF', label: 'Normal', hitStopMs: 40 },
  SKILL: { type: 'SKILL', colorHex: '#FF8800', label: 'Habilidade', hitStopMs: 60 },
  CRITICAL: { type: 'CRITICAL', colorHex: '#00E5FF', label: 'Crítico', hitStopMs: 85 },
  EXCELLENT: { type: 'EXCELLENT', colorHex: '#39FF14', label: 'Excelente', hitStopMs: 100 },
  IGNORE_DEFENSE: { type: 'IGNORE_DEFENSE', colorHex: '#FFD700', label: 'Ignorar Defesa', hitStopMs: 120 },
  MISS: { type: 'MISS', colorHex: '#AAAAAA', label: 'Errou', hitStopMs: 0 },
};

export interface AttackRequest {
  targetMobId: string;
  skillId?: string;
  playerX: number;
  playerY: number;
}

export interface AttackResult {
  success: boolean;
  attackerId: string;
  targetId: string;
  isMiss: boolean;
  damage: number;
  damageType: DamageType;
  colorHex: string;
  targetHp: number;
  targetMaxHp: number;
  targetSd?: number;
  targetMaxSd?: number;
  sdDamage?: number;
  hpDamage?: number;
  isCombo?: boolean;
  comboDamage?: number;
  reflectedDamage?: number;
  isDead: boolean;
  staggered: boolean;
  hitStopMs: number;
  knockback: {
    x: number;
    y: number;
  };
  dropsGenerated: GroundDropItem[];
  xpGained: number;
  error?: string;
}

export interface MonsterAttackResult {
  success: boolean;
  mobId: string;
  targetId: string;
  isMiss: boolean;
  damage: number;
  damageType: DamageType;
  colorHex: string;
  playerHp: number;
  playerMaxHp: number;
  playerSd: number;
  playerMaxSd: number;
  isDead: boolean;
  staggered: boolean;
}

export interface SupportSkillResult {
  success: boolean;
  skillId: string;
  casterId: string;
  targetId: string;
  buffType?: string;
  buffValue?: number;
  durationSeconds?: number;
  hpHealed?: number;
  currentHp?: number;
  maxHp?: number;
  currentMp?: number;
  error?: string;
}

export interface PotionResult {
  success: boolean;
  potionType: string;
  hpRestored: number;
  mpRestored: number;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  error?: string;
}

export interface PickupResult {
  success: boolean;
  dropId: string;
  item: ItemInstance | null;
  zen: number;
  error?: string;
}

export class CombatEngine {
  public readonly spawner: MobSpawner;
  public bossManager?: BossManager;
  private groundDrops: Map<string, GroundDropItem> = new Map();
  private mobDamageLog: Map<string, HitDamageEntry[]> = new Map();

  constructor(spawner?: MobSpawner, bossManager?: BossManager) {
    this.spawner = spawner ?? new MobSpawner();
    this.bossManager = bossManager;
  }

  /**
   * Processa requisição de ataque do jogador contra monstro de forma 100% autoritativa
   */
  public processPlayerAttack(session: ClientSession, req: AttackRequest): AttackResult {
    const { targetMobId, skillId, playerX, playerY } = req;
    const sId = String(skillId || '').toLowerCase();

    // Se for um Chefe Mundial (Boss)
    if (this.bossManager && targetMobId.startsWith('boss-')) {
      return this.processBossAttack(session, req);
    }

    const mob = this.spawner.getMonster(targetMobId);

    if (!mob || mob.isDead) {
      return {
        success: false,
        attackerId: session.sessionId,
        targetId: targetMobId,
        isMiss: true,
        damage: 0,
        damageType: 'MISS',
        colorHex: DAMAGE_COLORS.MISS.colorHex,
        targetHp: 0,
        targetMaxHp: 0,
        isDead: true,
        staggered: false,
        hitStopMs: 0,
        knockback: { x: 0, y: 0 },
        dropsGenerated: [],
        xpGained: 0,
        error: 'Alvo inválido ou já derrotado',
      };
    }

    // Valida alcance máximo de combate (ex: melee 220 unidades, magia/flecha 450)
    const distToMob = Math.hypot(mob.x - playerX, mob.y - playerY);
    const maxRange = 300;
    if (!Number.isFinite(distToMob) || distToMob > maxRange) {
      return {
        success: false,
        attackerId: session.sessionId,
        targetId: targetMobId,
        isMiss: true,
        damage: 0,
        damageType: 'MISS',
        colorHex: DAMAGE_COLORS.MISS.colorHex,
        targetHp: mob.currentHp,
        targetMaxHp: mob.maxHp,
        isDead: false,
        staggered: false,
        hitStopMs: 0,
        knockback: { x: 0, y: 0 },
        dropsGenerated: [],
        xpGained: 0,
        error: 'Alvo fora de alcance',
      };
    }

    // 1. Obtém equipamento e calcula atributos ofensivos do jogador
    const weaponRight = session.inventory.getEquippedItem(EquipmentSlot.WEAPON_RIGHT);
    const weaponLeft = session.inventory.getEquippedItem(EquipmentSlot.WEAPON_LEFT);
    const wings = session.inventory.getEquippedItem(EquipmentSlot.WINGS);

    const primaryWeapon = weaponRight || (weaponLeft && Item.getDefinition(weaponLeft).category === ItemCategory.WEAPON ? weaponLeft : null);

    const classId = CanonicalFormulas.getClassId(session.character.characterClass);
    const isBow = primaryWeapon ? CanonicalFormulas.isBowOrCrossbow(primaryWeapon.defId) : false;

    const charAttrs: CharacterAttributes = {
      classId,
      level: session.character.level,
      strength: session.character.strength,
      agility: session.character.agility,
      vitality: session.character.vitality,
      energy: session.character.energy,
      leadership: session.character.command,
      currentHp: session.currentHp ?? 1000,
      maxHp: session.maxHp ?? 1000,
      currentSd: session.currentSd ?? 500,
      maxSd: session.maxSd ?? 500,
      currentMp: session.currentMp ?? 300,
      maxMp: session.maxMp ?? 300,
      currentBp: 100,
      maxBp: 100,
    };

    const canonicalAtk = CanonicalFormulas.calculateAttackPower(charAttrs, isBow);
    const canonicalRates = CanonicalFormulas.calculateDefenseAndRates(charAttrs);

    let minAttack = canonicalAtk.minDamage;
    let maxAttack = canonicalAtk.maxDamage;
    let attackRate = canonicalRates.attackRatePvE;
    let hasLuck = false;
    let hasSkill = false;
    let hasExcellentDmgOption = false;
    let isTwoHanded = false;

    // Se a habilidade for feitiço mágico ou o jogador utilizar poder arcano
    const isMagicSpell = ['evil', 'spirit', 'lightning', 'fireball', 'ice', 'energy_ball', 'meteorite', 'decay', 'nova'].some((sp) => sId.includes(sp));
    if (isMagicSpell && canonicalAtk.minMagicDamage !== undefined && canonicalAtk.maxMagicDamage !== undefined) {
      minAttack = canonicalAtk.minMagicDamage;
      maxAttack = canonicalAtk.maxMagicDamage;
      if (primaryWeapon) {
        const staffBonus = Math.floor(primaryWeapon.level * 3) + 5;
        minAttack += staffBonus;
        maxAttack += staffBonus;
        attackRate += primaryWeapon.level * 4;
        hasLuck = primaryWeapon.luck;
        hasSkill = primaryWeapon.skill;
        hasExcellentDmgOption = Item.hasExcellentOption(primaryWeapon, WeaponExcellentOption.EXCELLENT_DAMAGE_10_PCT);
      }
    } else if (primaryWeapon) {
      const dmg = Item.calculateDamage(primaryWeapon);
      minAttack += dmg.min;
      maxAttack += dmg.max;
      attackRate += primaryWeapon.level * 4;
      hasLuck = primaryWeapon.luck;
      hasSkill = primaryWeapon.skill;
      hasExcellentDmgOption = Item.hasExcellentOption(primaryWeapon, WeaponExcellentOption.EXCELLENT_DAMAGE_10_PCT);
      isTwoHanded = Item.getDefinition(primaryWeapon).isTwoHanded ?? false;
    } else {
      // Desarmado
      minAttack += 5;
      maxAttack += 10;
    }

    // Bônus de Greater Damage (se houver buff ativo)
    const greaterDmgBuff = session.activeBuffs?.get('GREATER_DAMAGE');
    if (greaterDmgBuff && greaterDmgBuff.expiresAt > Date.now()) {
      minAttack += greaterDmgBuff.value;
      maxAttack += greaterDmgBuff.value;
    }

    // 2. Cálculo de Hit / Miss
    // Chance de acerto baseada na taxa de ataque vs taxa de defesa (habilidades ativas e magias possuem acerto aprimorado de 99%)
    const isUsingActiveSkill = Boolean(skillId || hasSkill || isMagicSpell);
    const totalRate = attackRate + mob.defenseRate;
    const hitChance = isUsingActiveSkill ? 0.99 : (totalRate > 0 ? Math.min(0.96, Math.max(0.10, attackRate / totalRate)) : 0.85);
    const isHit = Math.random() <= hitChance;

    if (!isHit) {
      return {
        success: true,
        attackerId: session.sessionId,
        targetId: mob.id,
        isMiss: true,
        damage: 0,
        damageType: 'MISS',
        colorHex: DAMAGE_COLORS.MISS.colorHex,
        targetHp: mob.currentHp,
        targetMaxHp: mob.maxHp,
        isDead: false,
        staggered: false,
        hitStopMs: 0,
        knockback: { x: 0, y: 0 },
        dropsGenerated: [],
        xpGained: 0,
      };
    }

    // 3. Determina Tipo de Dano (Normal, Skill, Crítico, Excelente, Ignorar Defesa)
    // Chances:
    // - Ignorar Defesa: 3% se possuir Asas equipadas (+1% se nível >= 9)
    // - Excelente: 10% se a arma tiver a opção excelente correspondente
    // - Crítico: 5% base + 5% por sorte na arma + agilidade/200
    // - Habilidade: se skillId estiver presente ou arma tiver skill
    let damageType: DamageType = 'NORMAL';

    const ignoreDefChance = wings ? (wings.level >= 9 ? 0.05 : 0.03) : 0;
    const excellentChance = hasExcellentDmgOption ? 0.12 : 0.02;
    const criticalChance = 0.05 + (hasLuck ? 0.05 : 0) + (session.character.agility / 2000);

    const roll = Math.random();

    let finalDamage = 0;
    let poiseDamage = 15;
    let knockbackDistance = isTwoHanded ? 30 : 18;

    const skillDef = skillId ? SkillCatalog.findSkill(skillId) : undefined;
    const isUsingSkill = Boolean(skillDef || skillId || hasSkill);
    let skillMultiplier = 1.0;
    if (isUsingSkill) {
      if (skillDef) {
        // Validação autoritativa de Mana
        if (session.currentMp !== undefined && session.currentMp < skillDef.manaCost) {
          return {
            success: false,
            attackerId: session.sessionId,
            targetId: mob.id,
            isMiss: true,
            damage: 0,
            damageType: 'MISS',
            colorHex: DAMAGE_COLORS.MISS.colorHex,
            targetHp: mob.currentHp,
            targetMaxHp: mob.maxHp,
            isDead: false,
            staggered: false,
            hitStopMs: 0,
            knockback: { x: 0, y: 0 },
            dropsGenerated: [],
            xpGained: 0,
          };
        }
        if (session.currentMp !== undefined) {
          session.currentMp = Math.max(0, session.currentMp - skillDef.manaCost);
        }
        skillMultiplier = skillDef.calculateDamageMultiplier(charAttrs);
        if (skillDef.poiseDamage) poiseDamage = skillDef.poiseDamage;
        if (skillDef.knockbackDistance) knockbackDistance = skillDef.knockbackDistance;
      } else if (sId.includes('death') || sId.includes('stab')) {
        // Death Stab do Blade Knight: Fator 250% + (Energy / 10)%
        const rawMult = (ComboSkillEngine.calculateDKSkillMultiplier(session.character.energy) + 50) / 100;
        skillMultiplier = Math.max(2.5, rawMult);
        poiseDamage = 45;
        knockbackDistance = 35;
        if (session.currentMp !== undefined) session.currentMp = Math.max(0, session.currentMp - 12);
      } else if (sId.includes('twist') || sId.includes('cyclone') || sId.includes('spin')) {
        // Twisting Slash do Blade Knight: Fator 200% + (Energy / 10)%
        const rawMult = ComboSkillEngine.calculateDKSkillMultiplier(session.character.energy) / 100;
        skillMultiplier = Math.max(2.0, rawMult);
        poiseDamage = 30;
        knockbackDistance = 16;
        if (session.currentMp !== undefined) session.currentMp = Math.max(0, session.currentMp - 10);
      } else if (sId.includes('evil') || sId.includes('spirit')) {
        // Evil Spirits do Dark Wizard / Soul Master: Fator 220% + (Energy / 20)%
        const rawMult = 2.2 + (session.character.energy / 2000);
        skillMultiplier = Math.max(2.2, rawMult);
        poiseDamage = 25;
        knockbackDistance = 12;
        if (session.currentMp !== undefined) session.currentMp = Math.max(0, session.currentMp - 30);
      } else if (sId.includes('lightning')) {
        // Lightning do Dark Wizard: Fator 160%, alto empurrão
        skillMultiplier = 1.6;
        poiseDamage = 35;
        knockbackDistance = 32;
        if (session.currentMp !== undefined) session.currentMp = Math.max(0, session.currentMp - 15);
      } else if (sId.includes('fireball') || sId.includes('fire_ball')) {
        // Fireball do Dark Wizard: Fator 180%
        skillMultiplier = 1.8;
        poiseDamage = 30;
        knockbackDistance = 18;
        if (session.currentMp !== undefined) session.currentMp = Math.max(0, session.currentMp - 8);
      } else if (sId.includes('energy_ball') || sId.includes('energyball')) {
        // Energy Ball: Fator 120%, magia básica inicial
        skillMultiplier = 1.2;
        poiseDamage = 15;
        knockbackDistance = 10;
        if (session.currentMp !== undefined) session.currentMp = Math.max(0, session.currentMp - 1);
      } else if (sId.includes('mana_shield') || sId.includes('soul_barrier')) {
        // Mana Shield / Soul Barrier do Soul Master
        if (!session.activeBuffs) session.activeBuffs = new Map();
        const absorbPct = Math.min(50, 10 + Math.floor(session.character.energy / 50) + Math.floor(session.character.agility / 200));
        session.activeBuffs.set('MANA_SHIELD', {
          value: absorbPct,
          durationMs: 60000,
          expiresAt: Date.now() + 60000,
        });
        if (session.currentMp !== undefined) session.currentMp = Math.max(0, session.currentMp - 70);
        skillMultiplier = 1.0;
        poiseDamage = 0;
        knockbackDistance = 0;
      } else {
        const rawMult = ComboSkillEngine.calculateDKSkillMultiplier(session.character.energy) / 100;
        skillMultiplier = Math.max(1.8, rawMult);
        poiseDamage = 25;
        knockbackDistance += 6;
      }
    }

    const isPenetration = sId.includes('penetrat') || sId.includes('perfur');
    const effectiveMobDef = isPenetration ? Math.floor(mob.defense / 2) : mob.defense;

    if (Math.random() <= ignoreDefChance || (isPenetration && Math.random() <= 0.35)) {
      damageType = 'IGNORE_DEFENSE';
      const baseDmg = Math.floor(minAttack + Math.random() * (maxAttack - minAttack + 1));
      finalDamage = isUsingSkill ? Math.floor(baseDmg * skillMultiplier) : baseDmg;
      poiseDamage = 45;
      knockbackDistance += 15;
    } else if (roll <= excellentChance) {
      damageType = 'EXCELLENT';
      const baseDmg = Math.floor(maxAttack * 1.20) + (primaryWeapon ? primaryWeapon.level * 4 : 5);
      finalDamage = (isUsingSkill ? Math.floor(baseDmg * skillMultiplier) : baseDmg) - effectiveMobDef;
      poiseDamage = 35;
      knockbackDistance += 12;
    } else if (roll <= excellentChance + criticalChance) {
      damageType = 'CRITICAL';
      const baseDmg = maxAttack + (primaryWeapon ? primaryWeapon.level * 3 : 3);
      finalDamage = (isUsingSkill ? Math.floor(baseDmg * skillMultiplier) : baseDmg) - effectiveMobDef;
      poiseDamage = 30;
      knockbackDistance += 8;
    } else if (isUsingSkill) {
      damageType = 'SKILL';
      const baseDmg = Math.floor(minAttack + Math.random() * (maxAttack - minAttack + 1));
      finalDamage = Math.floor(baseDmg * skillMultiplier) - effectiveMobDef;
    } else {
      damageType = 'NORMAL';
      const baseDmg = Math.floor(minAttack + Math.random() * (maxAttack - minAttack + 1));
      finalDamage = baseDmg - effectiveMobDef;
    }

    finalDamage = Math.max(1, finalDamage);

    // 4. Calcula vetor de recuo direcional (Knockback)
    const kx = mob.x - playerX;
    const ky = mob.y - playerY;

    // 5. Aplica dano autoritativo na entidade do monstro
    const dmgResult = mob.takeDamage(finalDamage, poiseDamage, knockbackDistance, kx, ky);

    // Registra dano no log para cálculo de Top Hit Damage
    let mobHits = this.mobDamageLog.get(mob.id);
    if (!mobHits) {
      mobHits = [];
      this.mobDamageLog.set(mob.id, mobHits);
    }
    mobHits.push({
      sessionId: session.sessionId,
      partyId: session.partyId,
      damage: dmgResult.damageTaken,
      timestamp: Date.now(),
      x: playerX,
      y: playerY,
    });

    let dropsGenerated: GroundDropItem[] = [];
    let xpGained = 0;

    // 6. Se o monstro foi derrotado, gera Drops e distribui XP
    if (dmgResult.isDead) {
      xpGained = mob.xpReward;
      const ownerInfo = DropManager.calculateTopHitDamageOwner(mobHits, mob.x, mob.y);
      const ownerSessionId = ownerInfo ? ownerInfo.ownerSessionId : session.sessionId;
      const ownerPartyId = ownerInfo ? ownerInfo.ownerPartyId : session.partyId;
      this.mobDamageLog.delete(mob.id);

      dropsGenerated = mob.rollDrops(ownerSessionId, ownerPartyId);
      for (const drop of dropsGenerated) {
        this.groundDrops.set(drop.dropId, drop);
      }
    }

    // Processamento de dano em área (AoE) e vórtices autoritativos (Twisting Slash & Evil Spirits)
    const isEvilSpirits = sId.includes('evil') || sId.includes('spirit');
    const isTwisting = sId.includes('twist') || sId.includes('cyclone') || sId.includes('spin');
    const aoeRadius = skillDef?.aoeRadius ?? (isTwisting ? 180 : (isEvilSpirits ? 260 : 0));
    const maxAoeTargets = skillDef?.maxAoeTargets ?? (isEvilSpirits ? 8 : 6);

    if (aoeRadius > 0) {
      let hitCount = 0;
      for (const otherMob of this.spawner.getAllMonsters()) {
        if (hitCount >= maxAoeTargets) break;
        if (otherMob.id !== mob.id && !otherMob.isDead) {
          const dist = Math.hypot(otherMob.x - playerX, otherMob.y - playerY);
          if (dist <= aoeRadius) {
            hitCount++;
            const aoeDmg = Math.max(1, Math.floor(finalDamage * 0.85));
            const aoeResult = otherMob.takeDamage(aoeDmg, 25, 12, otherMob.x - playerX, otherMob.y - playerY);
            if (aoeResult.isDead) {
              const aoeDrops = otherMob.rollDrops(session.sessionId, session.partyId);
              dropsGenerated.push(...aoeDrops);
              for (const drop of aoeDrops) {
                this.groundDrops.set(drop.dropId, drop);
              }
              xpGained += otherMob.xpReward;
            }
          }
        }
      }
    }

    // Aplicação de efeitos autoritativos de controle de grupo no monstro alvo
    if (skillDef?.effectId === EffectId.STERN) {
      mob.staggerUntil = Date.now() + 1500;
      mob.state = 'STAGGERED';
    } else if (skillDef?.effectId === EffectId.ICE || skillDef?.effectId === EffectId.ICE_ARROW) {
      mob.moveSpeed = Math.floor(mob.moveSpeed * 0.5);
    }

    // Aplicação de buffs autoritativos no jogador (Mana Shield / Soul Barrier)
    if (skillDef?.effectId === EffectId.MANA_SHIELD || sId.includes('mana_shield') || sId.includes('soul_barrier')) {
      if (!session.activeBuffs) session.activeBuffs = new Map();
      const absorbPct = Math.min(50, 10 + Math.floor(session.character.energy / 50) + Math.floor(session.character.agility / 200));
      session.activeBuffs.set('MANA_SHIELD', {
        value: absorbPct,
        durationMs: 60000,
        expiresAt: Date.now() + 60000,
      });
    }

    const colorConfig = DAMAGE_COLORS[damageType];

    return {
      success: true,
      attackerId: session.sessionId,
      targetId: mob.id,
      isMiss: false,
      damage: dmgResult.damageTaken,
      damageType,
      colorHex: colorConfig.colorHex,
      targetHp: mob.currentHp,
      targetMaxHp: mob.maxHp,
      isDead: dmgResult.isDead,
      staggered: dmgResult.staggered,
      hitStopMs: colorConfig.hitStopMs,
      knockback: {
        x: Math.round(mob.x),
        y: Math.round(mob.y),
      },
      dropsGenerated,
      xpGained,
    };
  }

  /**
   * Processa ataque autoritativo contra um Chefe de Múltiplas Fases (Boss)
   */
  private processBossAttack(session: ClientSession, req: AttackRequest): AttackResult {
    const { targetMobId, skillId, playerX, playerY } = req;
    const boss = this.bossManager?.getBoss(targetMobId);

    if (!boss || boss.isDead) {
      return {
        success: false,
        attackerId: session.sessionId,
        targetId: targetMobId,
        isMiss: true,
        damage: 0,
        damageType: 'MISS',
        colorHex: DAMAGE_COLORS.MISS.colorHex,
        targetHp: 0,
        targetMaxHp: 0,
        isDead: true,
        staggered: false,
        hitStopMs: 0,
        knockback: { x: 0, y: 0 },
        dropsGenerated: [],
        xpGained: 0,
        error: 'Chefe inválido ou já derrotado',
      };
    }

    const distToBoss = Math.hypot(boss.x - playerX, boss.y - playerY);
    if (!Number.isFinite(distToBoss) || distToBoss > 400) {
      return {
        success: false,
        attackerId: session.sessionId,
        targetId: targetMobId,
        isMiss: true,
        damage: 0,
        damageType: 'MISS',
        colorHex: DAMAGE_COLORS.MISS.colorHex,
        targetHp: boss.currentHp,
        targetMaxHp: boss.maxHp,
        isDead: false,
        staggered: false,
        hitStopMs: 0,
        knockback: { x: 0, y: 0 },
        dropsGenerated: [],
        xpGained: 0,
        error: 'Chefe fora de alcance',
      };
    }

    const weaponRight = session.inventory.getEquippedItem(EquipmentSlot.WEAPON_RIGHT);
    const weaponLeft = session.inventory.getEquippedItem(EquipmentSlot.WEAPON_LEFT);
    const wings = session.inventory.getEquippedItem(EquipmentSlot.WINGS);
    const primaryWeapon = weaponRight || (weaponLeft && Item.getDefinition(weaponLeft).category === ItemCategory.WEAPON ? weaponLeft : null);

    let minAttack = Math.floor(session.character.strength / 6);
    let maxAttack = Math.floor(session.character.strength / 4);
    let attackRate = session.character.level * 5 + Math.floor(session.character.agility * 1.5);
    let hasLuck = false;
    let hasSkill = false;
    let excellentBonusDmgPercent = 0;

    if (primaryWeapon) {
      const wDmg = Item.calculateDamage(primaryWeapon);
      minAttack += wDmg.min;
      maxAttack += wDmg.max;
      attackRate += Math.floor(wDmg.max * 1.2);
      if (primaryWeapon.luck) hasLuck = true;
      if (primaryWeapon.skill) hasSkill = true;
      if (primaryWeapon.excellentMask && (primaryWeapon.excellentMask & WeaponExcellentOption.INCREASE_DMG_2_PERCENT)) {
        excellentBonusDmgPercent += 2;
      }
    }

    // Taxa de Acerto vs Evasão do Chefe
    const hitChance = Math.min(0.95, Math.max(0.20, attackRate / (attackRate + boss.defenseRate)));
    const hitRoll = Math.random();

    if (hitRoll > hitChance) {
      return {
        success: true,
        attackerId: session.sessionId,
        targetId: boss.id,
        isMiss: true,
        damage: 0,
        damageType: 'MISS',
        colorHex: DAMAGE_COLORS.MISS.colorHex,
        targetHp: boss.currentHp,
        targetMaxHp: boss.maxHp,
        isDead: false,
        staggered: false,
        hitStopMs: DAMAGE_COLORS.MISS.hitStopMs,
        knockback: { x: Math.round(boss.x), y: Math.round(boss.y) },
        dropsGenerated: [],
        xpGained: 0,
      };
    }

    const rollType = Math.random();
    let damageType: DamageType = 'NORMAL';
    let finalDamage = 0;
    let poiseDamage = 15;

    const hasWings = !!wings;
    const ignoreDefenseChance = hasWings ? 0.05 : 0.0;
    const excellentChance = 0.10 + (excellentBonusDmgPercent > 0 ? 0.05 : 0.0);
    const criticalChance = hasLuck ? 0.25 : 0.05;

    if (rollType < ignoreDefenseChance) {
      damageType = 'IGNORE_DEFENSE';
      finalDamage = maxAttack;
      poiseDamage = 35;
    } else if (rollType < ignoreDefenseChance + excellentChance) {
      damageType = 'EXCELLENT';
      finalDamage = Math.floor(maxAttack * 1.2) - boss.defense;
      poiseDamage = 30;
    } else if (rollType < ignoreDefenseChance + excellentChance + criticalChance) {
      damageType = 'CRITICAL';
      finalDamage = maxAttack - boss.defense;
      poiseDamage = 25;
    } else if (skillId || hasSkill) {
      damageType = 'SKILL';
      const baseDmg = Math.floor(minAttack + Math.random() * (maxAttack - minAttack + 1));
      finalDamage = Math.floor(baseDmg * 1.8) - boss.defense;
      poiseDamage = 30;
    } else {
      damageType = 'NORMAL';
      const baseDmg = Math.floor(minAttack + Math.random() * (maxAttack - minAttack + 1));
      finalDamage = baseDmg - boss.defense;
    }

    finalDamage = Math.max(1, finalDamage);

    // Aplica dano autoritativo no Chefe (Absorve escudo primeiro, checa transição de fase)
    const dmgResult = boss.takeDamage(finalDamage, poiseDamage);

    let dropsGenerated: GroundDropItem[] = [];
    let xpGained = 0;

    if (dmgResult.died) {
      xpGained = boss.xpReward;
      dropsGenerated = boss.generateBossDrops(session.sessionId);
      for (const drop of dropsGenerated) {
        this.groundDrops.set(drop.dropId, drop);
      }
    }

    const colorConfig = DAMAGE_COLORS[damageType];

    return {
      success: true,
      attackerId: session.sessionId,
      targetId: boss.id,
      isMiss: false,
      damage: dmgResult.actualHpDamage + dmgResult.shieldDamage,
      damageType,
      colorHex: colorConfig.colorHex,
      targetHp: boss.currentHp,
      targetMaxHp: boss.maxHp,
      isDead: dmgResult.died,
      staggered: dmgResult.staggered,
      hitStopMs: colorConfig.hitStopMs,
      knockback: {
        x: Math.round(boss.x),
        y: Math.round(boss.y),
      },
      dropsGenerated,
      xpGained,
    };
  }

  /**
   * Processa combate PvP autoritativo entre dois jogadores com:
   * - Fórmulas Canônicas de Ataque e Defesa por classe
   * - Taxa de Acerto PvP (attackRatePvP vs defenseRatePvP)
   * - Combo Skill do Blade Knight (Passo 1 -> 2 -> 3)
   * - Absorção de Mana Shield do Soul Master (até 50%)
   * - Absorção de Escudo SD 90/10 (90% no SD e 10% no HP)
   * - Reflexão de Dano (Damage Reflect)
   */
  public processPvPAttack(
    attacker: ClientSession,
    target: ClientSession,
    req: AttackRequest
  ): AttackResult {
    const { skillId, playerX, playerY } = req;
    const targetX = target.x ?? playerX;
    const targetY = target.y ?? playerY;

    // 1. Validações básicas de combate
    const targetHp = target.currentHp ?? 0;
    const targetMaxHp = target.maxHp ?? 1000;
    const targetSd = target.currentSd ?? 0;
    const targetMaxSd = target.maxSd ?? 500;

    if (targetHp <= 0) {
      return {
        success: false,
        attackerId: attacker.sessionId,
        targetId: target.sessionId,
        isMiss: true,
        damage: 0,
        damageType: 'MISS',
        colorHex: DAMAGE_COLORS.MISS.colorHex,
        targetHp: 0,
        targetMaxHp,
        targetSd: 0,
        targetMaxSd,
        isDead: true,
        staggered: false,
        hitStopMs: 0,
        knockback: { x: targetX, y: targetY },
        dropsGenerated: [],
        xpGained: 0,
        error: 'Alvo já está derrotado',
      };
    }

    const dist = Math.hypot(targetX - playerX, targetY - playerY);
    if (!Number.isFinite(dist) || dist > 300) {
      return {
        success: false,
        attackerId: attacker.sessionId,
        targetId: target.sessionId,
        isMiss: true,
        damage: 0,
        damageType: 'MISS',
        colorHex: DAMAGE_COLORS.MISS.colorHex,
        targetHp,
        targetMaxHp,
        targetSd,
        targetMaxSd,
        isDead: false,
        staggered: false,
        hitStopMs: 0,
        knockback: { x: targetX, y: targetY },
        dropsGenerated: [],
        xpGained: 0,
        error: 'Alvo fora de alcance',
      };
    }

    // 2. Atributos Canônicos do Atacante e Defensor
    const attackerClass = CanonicalFormulas.getClassId(attacker.character.characterClass);
    const targetClass = CanonicalFormulas.getClassId(target.character.characterClass);

    const attackerWeaponRight = attacker.inventory.getEquippedItem(EquipmentSlot.WEAPON_RIGHT);
    const attackerWeaponLeft = attacker.inventory.getEquippedItem(EquipmentSlot.WEAPON_LEFT);
    const attackerPrimaryWeapon = attackerWeaponRight || (attackerWeaponLeft && Item.getDefinition(attackerWeaponLeft).category === ItemCategory.WEAPON ? attackerWeaponLeft : null);
    const attackerWings = attacker.inventory.getEquippedItem(EquipmentSlot.WINGS);
    const isBow = attackerPrimaryWeapon ? CanonicalFormulas.isBowOrCrossbow(attackerPrimaryWeapon.defId) : false;

    const attackerAttrs: CharacterAttributes = {
      classId: attackerClass,
      level: attacker.character.level,
      strength: attacker.character.strength,
      agility: attacker.character.agility,
      vitality: attacker.character.vitality,
      energy: attacker.character.energy,
      leadership: attacker.character.command,
      currentHp: attacker.currentHp ?? 1000,
      maxHp: attacker.maxHp ?? 1000,
      currentSd: attacker.currentSd ?? 500,
      maxSd: attacker.maxSd ?? 500,
      currentMp: attacker.currentMp ?? 300,
      maxMp: attacker.maxMp ?? 300,
      currentBp: 100,
      maxBp: 100,
    };

    const targetAttrs: CharacterAttributes = {
      classId: targetClass,
      level: target.character.level,
      strength: target.character.strength,
      agility: target.character.agility,
      vitality: target.character.vitality,
      energy: target.character.energy,
      leadership: target.character.command,
      currentHp: targetHp,
      maxHp: targetMaxHp,
      currentSd: targetSd,
      maxSd: targetMaxSd,
      currentMp: target.currentMp ?? 300,
      maxMp: target.maxMp ?? 300,
      currentBp: 100,
      maxBp: 100,
    };

    const atkPower = CanonicalFormulas.calculateAttackPower(attackerAttrs, isBow);
    const atkRates = CanonicalFormulas.calculateDefenseAndRates(attackerAttrs);
    const defRates = CanonicalFormulas.calculateDefenseAndRates(targetAttrs);

    let minAttack = atkPower.minDamage;
    let maxAttack = atkPower.maxDamage;
    let attackRatePvP = atkRates.attackRatePvP;
    let defenseRatePvP = defRates.defenseRatePvP;
    let defense = defRates.defense;

    // Equipamento ofensivo
    let hasLuck = false;
    let hasSkill = false;
    let hasExcellentDmgOption = false;

    if (attackerPrimaryWeapon) {
      const dmg = Item.calculateDamage(attackerPrimaryWeapon);
      minAttack += dmg.min;
      maxAttack += dmg.max;
      hasLuck = attackerPrimaryWeapon.luck;
      hasSkill = attackerPrimaryWeapon.skill;
      hasExcellentDmgOption = Item.hasExcellentOption(attackerPrimaryWeapon, WeaponExcellentOption.EXCELLENT_DAMAGE_10_PCT);
    } else {
      minAttack += 5;
      maxAttack += 10;
    }

    // Bônus Greater Damage do atacante
    const greaterDmgBuff = attacker.activeBuffs?.get('GREATER_DAMAGE');
    if (greaterDmgBuff && greaterDmgBuff.expiresAt > Date.now()) {
      minAttack += greaterDmgBuff.value;
      maxAttack += greaterDmgBuff.value;
    }

    // Bônus Greater Defense do defensor
    const greaterDefBuff = target.activeBuffs?.get('GREATER_DEFENSE');
    if (greaterDefBuff && greaterDefBuff.expiresAt > Date.now()) {
      defense += greaterDefBuff.value;
    }

    // 3. Taxa de Acerto PvP
    const totalRate = attackRatePvP + defenseRatePvP;
    const hitChance = totalRate > 0 ? Math.min(0.96, Math.max(0.10, attackRatePvP / totalRate)) : 0.85;
    const isHit = Math.random() <= hitChance;

    if (!isHit) {
      return {
        success: true,
        attackerId: attacker.sessionId,
        targetId: target.sessionId,
        isMiss: true,
        damage: 0,
        damageType: 'MISS',
        colorHex: DAMAGE_COLORS.MISS.colorHex,
        targetHp,
        targetMaxHp,
        targetSd,
        targetMaxSd,
        isDead: false,
        staggered: false,
        hitStopMs: 0,
        knockback: { x: targetX, y: targetY },
        dropsGenerated: [],
        xpGained: 0,
      };
    }

    // 4. Tipo de Dano
    const ignoreDefChance = attackerWings ? (attackerWings.level >= 9 ? 0.05 : 0.03) : 0;
    const excellentChance = hasExcellentDmgOption ? 0.12 : 0.02;
    const criticalChance = 0.05 + (hasLuck ? 0.05 : 0) + (attacker.character.agility / 2000);

    let damageType: DamageType = 'NORMAL';
    let baseDamage = 0;
    const roll = Math.random();

    if (Math.random() <= ignoreDefChance) {
      damageType = 'IGNORE_DEFENSE';
      baseDamage = Math.floor(minAttack + Math.random() * (maxAttack - minAttack + 1));
      // Defesa calculada como 0!
    } else if (roll <= excellentChance) {
      damageType = 'EXCELLENT';
      baseDamage = Math.max(1, Math.floor(maxAttack * 1.20) + (attackerPrimaryWeapon ? attackerPrimaryWeapon.level * 4 : 5) - defense);
    } else if (roll <= excellentChance + criticalChance) {
      damageType = 'CRITICAL';
      baseDamage = Math.max(1, maxAttack + (attackerPrimaryWeapon ? attackerPrimaryWeapon.level * 3 : 3) - defense);
    } else if (skillId || hasSkill) {
      damageType = 'SKILL';
      const raw = Math.floor(minAttack + Math.random() * (maxAttack - minAttack + 1));
      baseDamage = Math.max(1, Math.floor(raw * 1.8) - defense);
    } else {
      damageType = 'NORMAL';
      const raw = Math.floor(minAttack + Math.random() * (maxAttack - minAttack + 1));
      baseDamage = Math.max(1, raw - defense);
    }

    let finalDamage = baseDamage;

    // 5. Avaliação do Combo Skill do Blade Knight
    let isCombo = false;
    let comboDamage = 0;
    if (skillId) {
      if (!attacker.recentSkills) attacker.recentSkills = [];
      attacker.recentSkills.push(skillId);
      if (attacker.recentSkills.length > 5) {
        attacker.recentSkills = attacker.recentSkills.slice(-5);
      }
      const comboCheck = CanonicalFormulas.evaluateCombo(
        attacker.recentSkills,
        attacker.character.strength,
        attacker.character.agility,
        attacker.character.energy
      );
      if (comboCheck.isCombo) {
        isCombo = true;
        comboDamage = comboCheck.comboDamage;
        finalDamage += comboDamage; // Dano do combo ignora a defesa do alvo!
      }
    }

    // 6. Absorção de Mana Shield do Soul Master no Alvo
    const manaShieldBuff = target.activeBuffs?.get('MANA_SHIELD');
    if (manaShieldBuff && manaShieldBuff.expiresAt > Date.now()) {
      const absorbed = Math.floor((finalDamage * manaShieldBuff.value) / 100);
      finalDamage = Math.max(1, finalDamage - absorbed);
    }

    // 7. Aplicação da Regra Canônica de SD 90/10
    const distribution = CanonicalFormulas.applySdAbsorption(finalDamage, targetSd, targetHp);

    target.currentSd = distribution.remainingSd;
    target.currentHp = distribution.remainingHp;

    // 8. Efeito de Reflexão de Dano (Damage Reflect)
    let reflectedDamage = 0;
    const reflectBuff = target.activeBuffs?.get('DAMAGE_REFLECT');
    if (reflectBuff && reflectBuff.expiresAt > Date.now()) {
      reflectedDamage = Math.floor((finalDamage * reflectBuff.value) / 100);
      if (reflectedDamage > 0 && attacker.currentHp !== undefined) {
        attacker.currentHp = Math.max(1, attacker.currentHp - reflectedDamage);
      }
    }

    const colorConfig = DAMAGE_COLORS[damageType];

    return {
      success: true,
      attackerId: attacker.sessionId,
      targetId: target.sessionId,
      isMiss: false,
      damage: finalDamage,
      damageType,
      colorHex: colorConfig.colorHex,
      targetHp: distribution.remainingHp,
      targetMaxHp,
      targetSd: distribution.remainingSd,
      targetMaxSd,
      sdDamage: distribution.sdDamage,
      hpDamage: distribution.hpDamage,
      isCombo,
      comboDamage,
      reflectedDamage,
      isDead: distribution.isDead,
      staggered: finalDamage > 100,
      hitStopMs: colorConfig.hitStopMs,
      knockback: {
        x: targetX,
        y: targetY,
      },
      dropsGenerated: [],
      xpGained: 0,
    };
  }

  /**
   * Processa requisição de coleta de item do chão
   */
  public pickupGroundItem(
    session: ClientSession,
    dropId: string,
    playerX: number,
    playerY: number
  ): PickupResult {
    const drop = this.groundDrops.get(dropId);
    if (!drop) {
      return { success: false, dropId, item: null, zen: 0, error: 'O item não se encontra mais no chão' };
    }

    // Validação de proximidade física (máximo 160 unidades)
    const dist = Math.hypot(drop.x - playerX, drop.y - playerY);
    if (!Number.isFinite(dist) || dist > 180) {
      return { success: false, dropId, item: null, zen: 0, error: 'Você está muito distante para recolher este item' };
    }

    // Validação de posse autoritativa (Loot Lock de 15 segundos para o Top Hit Damage e membros de sua Party)
    const now = Date.now();
    if (drop.ownerSessionId && drop.lootLockUntil && now < drop.lootLockUntil) {
      const isOwner = session.sessionId === drop.ownerSessionId;
      const isSameParty = Boolean(session.partyId && drop.ownerPartyId && session.partyId === drop.ownerPartyId);
      if (!isOwner && !isSameParty) {
        return {
          success: false,
          dropId,
          item: null,
          zen: 0,
          error: 'Item protegido pelo sistema de Top Hit Damage',
        };
      }
    }

    // Se for pilha de Zen
    if (drop.zen > 0 && !drop.item) {
      this.groundDrops.delete(dropId);
      return {
        success: true,
        dropId,
        item: null,
        zen: drop.zen,
      };
    }

    // Se for item físico
    if (drop.item) {
      const placed = session.inventory.addItem(drop.item);
      if (!placed) {
        return {
          success: false,
          dropId,
          item: drop.item,
          zen: 0,
          error: 'Bolsa cheia! Não há espaço na grade de inventário.',
        };
      }

      this.groundDrops.delete(dropId);
      return {
        success: true,
        dropId,
        item: drop.item,
        zen: 0,
      };
    }

    return { success: false, dropId, item: null, zen: 0, error: 'Drop corrompido' };
  }

  public getAllGroundDrops(): GroundDropItem[] {
    return Array.from(this.groundDrops.values());
  }

  public getGroundDrop(dropId: string): GroundDropItem | undefined {
    return this.groundDrops.get(dropId);
  }

  public removeGroundDrop(dropId: string): boolean {
    return this.groundDrops.delete(dropId);
  }

  public registerExternalGroundDrop(drop: GroundDropItem): void {
    this.groundDrops.set(drop.dropId, drop);
  }

  public clearMobDamageLog(mobId?: string): void {
    if (mobId) {
      this.mobDamageLog.delete(mobId);
    } else {
      this.mobDamageLog.clear();
    }
  }

  public getMobDamageLog(mobId: string): HitDamageEntry[] | undefined {
    return this.mobDamageLog.get(mobId);
  }

  /**
   * Processa ataque autoritativo desferido por um monstro contra um jogador
   */
  public processMonsterAttack(mobId: string, session: ClientSession): MonsterAttackResult {
    const mob = this.spawner.getMonster(mobId);
    if (!mob || mob.isDead) {
      return {
        success: false,
        mobId,
        targetId: session.sessionId,
        isMiss: true,
        damage: 0,
        damageType: 'MISS',
        colorHex: DAMAGE_COLORS.MISS.colorHex,
        playerHp: session.currentHp ?? 1000,
        playerMaxHp: session.maxHp ?? 1000,
        playerSd: session.currentSd ?? 500,
        playerMaxSd: session.maxSd ?? 500,
        isDead: false,
        staggered: false,
      };
    }

    // 1. Defesa e Evasão do Jogador (Atributos + Equipamentos)
    const classId = CanonicalFormulas.getClassId(session.character.characterClass);
    const charAttrs: CharacterAttributes = {
      classId,
      level: session.character.level,
      strength: session.character.strength,
      agility: session.character.agility,
      vitality: session.character.vitality,
      energy: session.character.energy,
      leadership: session.character.command,
      currentHp: session.currentHp ?? 1000,
      maxHp: session.maxHp ?? 1000,
      currentSd: session.currentSd ?? 500,
      maxSd: session.maxSd ?? 500,
      currentMp: session.currentMp ?? 300,
      maxMp: session.maxMp ?? 300,
      currentBp: 100,
      maxBp: 100,
    };

    const defStats = CanonicalFormulas.calculateDefenseAndRates(charAttrs);
    let totalDefense = defStats.defense;

    const armorSlots = [
      EquipmentSlot.HELM,
      EquipmentSlot.ARMOR,
      EquipmentSlot.PANTS,
      EquipmentSlot.GLOVES,
      EquipmentSlot.BOOTS,
      EquipmentSlot.WEAPON_LEFT, // Escudos
    ];
    for (const slot of armorSlots) {
      const eq = session.inventory?.getEquippedItem(slot);
      if (eq) {
        totalDefense += Item.calculateDefense(eq);
      }
    }

    // 2. Taxa de Acerto do Monstro vs Evasão do Jogador
    const totalRate = mob.attackRate + defStats.defenseRatePvE;
    const hitChance = totalRate > 0 ? Math.min(0.95, Math.max(0.10, mob.attackRate / totalRate)) : 0.85;
    const isHit = Math.random() <= hitChance;

    if (!isHit) {
      return {
        success: true,
        mobId,
        targetId: session.sessionId,
        isMiss: true,
        damage: 0,
        damageType: 'MISS',
        colorHex: DAMAGE_COLORS.MISS.colorHex,
        playerHp: session.currentHp ?? 1000,
        playerMaxHp: session.maxHp ?? 1000,
        playerSd: session.currentSd ?? 500,
        playerMaxSd: session.maxSd ?? 500,
        isDead: false,
        staggered: false,
      };
    }

    // 3. Cálculo de Dano do Monstro
    const baseDamage = Math.floor(mob.attackMin + Math.random() * (mob.attackMax - mob.attackMin + 1));
    let rawDamage = Math.max(1, baseDamage - Math.floor(totalDefense / 2));

    // 4. Absorção do Mana Shield (Soul Barrier do Dark Wizard)
    const manaShieldBuff = session.activeBuffs?.get('MANA_SHIELD');
    if (manaShieldBuff && manaShieldBuff.expiresAt > Date.now()) {
      const absorbPct = Math.min(50, Math.max(10, manaShieldBuff.value));
      rawDamage = Math.max(1, Math.floor(rawDamage * (1 - absorbPct / 100)));
    }

    // 5. Absorção de Asas (se equipadas)
    const wings = session.inventory?.getEquippedItem(EquipmentSlot.WINGS);
    if (wings) {
      const wingAbsorb = Math.min(40, 12 + wings.level * 2);
      rawDamage = Math.max(1, Math.floor(rawDamage * (1 - wingAbsorb / 100)));
    }

    // 6. Distribuição Canônica no SD e HP (90% SD / 10% HP)
    const curSd = session.currentSd ?? 500;
    const curHp = session.currentHp ?? 1000;
    const distribution = CanonicalFormulas.applySdAbsorption(rawDamage, curSd, curHp);

    session.currentSd = distribution.remainingSd;
    session.currentHp = distribution.remainingHp;

    const isDead = session.currentHp <= 0;
    if (isDead) {
      session.currentHp = 0;
    }

    return {
      success: true,
      mobId,
      targetId: session.sessionId,
      isMiss: false,
      damage: rawDamage,
      damageType: 'NORMAL',
      colorHex: '#EF4444',
      playerHp: session.currentHp,
      playerMaxHp: session.maxHp ?? 1000,
      playerSd: session.currentSd,
      playerMaxSd: session.maxSd ?? 500,
      isDead,
      staggered: rawDamage > 40,
    };
  }

  /**
   * Atualização de ciclo de jogo (IA de monstros e limpeza de drops expirados)
   */
  public update(deltaTimeSec: number, players: { id: string; x: number; y: number }[] = []): {
    hasMoved: boolean;
    respawned: Monster[];
    despawnedIds: string[];
    attacks: { mobId: string; targetId: string }[];
    expiredDropIds: string[];
  } {
    const spawnerResult = this.spawner.update(deltaTimeSec, players);

    // Limpeza de drops expirados
    const now = Date.now();
    const expiredDropIds: string[] = [];
    for (const [dropId, drop] of this.groundDrops.entries()) {
      if (now >= drop.expiresAt) {
        this.groundDrops.delete(dropId);
        expiredDropIds.push(dropId);
      }
    }

    return {
      ...spawnerResult,
      expiredDropIds,
    };
  }

  /**
   * Conjuração autoritativa de habilidades de suporte, cura e bênçãos (Buffs)
   */
  public castSupportSkill(
    session: ClientSession,
    skillId: string,
    targetSession?: ClientSession
  ): SupportSkillResult {
    const sId = String(skillId || '').toLowerCase();
    const target = targetSession || session;
    const energy = session.character.energy;

    if (!session.activeBuffs) session.activeBuffs = new Map();
    if (!target.activeBuffs) target.activeBuffs = new Map();

    if (session.currentMp === undefined) session.currentMp = 300;
    if (target.currentHp === undefined) target.currentHp = 1000;
    if (target.maxHp === undefined) target.maxHp = 1000;

    // 1. HEAL (Fairy Elf / Muse Elf)
    if (sId.includes('heal') || sId.includes('cura')) {
      const mpCost = 20;
      if (session.currentMp < mpCost) {
        return { success: false, skillId, casterId: session.sessionId, targetId: target.sessionId, error: 'Mana insuficiente' };
      }
      session.currentMp -= mpCost;
      const healAmount = CanonicalFormulas.calculateHeal(energy);
      const prevHp = target.currentHp;
      target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount);
      const hpHealed = target.currentHp - prevHp;

      return {
        success: true,
        skillId: 'heal',
        casterId: session.sessionId,
        targetId: target.sessionId,
        hpHealed,
        currentHp: target.currentHp,
        maxHp: target.maxHp,
        currentMp: session.currentMp,
      };
    }

    // 2. GREATER_DEFENSE (Fairy Elf)
    if (sId.includes('greater_defense') || sId.includes('greater_def') || sId.includes('defense_buff') || sId.includes('def_buff')) {
      const mpCost = 30;
      if (session.currentMp < mpCost) {
        return { success: false, skillId, casterId: session.sessionId, targetId: target.sessionId, error: 'Mana insuficiente' };
      }
      session.currentMp -= mpCost;
      const defBonus = CanonicalFormulas.calculateGreaterDefense(energy);
      const durationSeconds = 60;
      target.activeBuffs.set('GREATER_DEFENSE', {
        value: defBonus,
        durationMs: durationSeconds * 1000,
        expiresAt: Date.now() + durationSeconds * 1000,
      });

      return {
        success: true,
        skillId: 'greater_defense',
        casterId: session.sessionId,
        targetId: target.sessionId,
        buffType: 'GREATER_DEFENSE',
        buffValue: defBonus,
        durationSeconds,
        currentMp: session.currentMp,
      };
    }

    // 3. GREATER_DAMAGE (Fairy Elf)
    if (sId.includes('greater_damage') || sId.includes('greater_dmg') || sId.includes('damage_buff') || sId.includes('atk_buff')) {
      const mpCost = 30;
      if (session.currentMp < mpCost) {
        return { success: false, skillId, casterId: session.sessionId, targetId: target.sessionId, error: 'Mana insuficiente' };
      }
      session.currentMp -= mpCost;
      const dmgBonus = CanonicalFormulas.calculateGreaterDamage(energy);
      const durationSeconds = 60;
      target.activeBuffs.set('GREATER_DAMAGE', {
        value: dmgBonus,
        durationMs: durationSeconds * 1000,
        expiresAt: Date.now() + durationSeconds * 1000,
      });

      return {
        success: true,
        skillId: 'greater_damage',
        casterId: session.sessionId,
        targetId: target.sessionId,
        buffType: 'GREATER_DAMAGE',
        buffValue: dmgBonus,
        durationSeconds,
        currentMp: session.currentMp,
      };
    }

    // 4. MANA_SHIELD (Soul Master)
    if (sId.includes('mana_shield') || sId.includes('soul_barrier') || sId.includes('shield')) {
      const mpCost = 70;
      if (session.currentMp < mpCost) {
        return { success: false, skillId, casterId: session.sessionId, targetId: target.sessionId, error: 'Mana insuficiente' };
      }
      session.currentMp -= mpCost;
      const { absorptionPercent, durationSeconds } = CanonicalFormulas.calculateManaShield(session.character.agility, energy);
      target.activeBuffs.set('MANA_SHIELD', {
        value: absorptionPercent,
        durationMs: durationSeconds * 1000,
        expiresAt: Date.now() + durationSeconds * 1000,
      });

      return {
        success: true,
        skillId: 'mana_shield',
        casterId: session.sessionId,
        targetId: target.sessionId,
        buffType: 'MANA_SHIELD',
        buffValue: absorptionPercent,
        durationSeconds,
        currentMp: session.currentMp,
      };
    }

    // 5. GREATER_FORTITUDE (Blade Knight)
    if (sId.includes('fortitude') || sId.includes('swell_life') || sId.includes('life_buff')) {
      const mpCost = 50;
      if (session.currentMp < mpCost) {
        return { success: false, skillId, casterId: session.sessionId, targetId: target.sessionId, error: 'Mana insuficiente' };
      }
      session.currentMp -= mpCost;
      const { hpBonusPercent, durationSeconds } = CanonicalFormulas.calculateGreaterFortitude(session.character.vitality, energy);
      target.activeBuffs.set('GREATER_FORTITUDE', {
        value: hpBonusPercent,
        durationMs: durationSeconds * 1000,
        expiresAt: Date.now() + durationSeconds * 1000,
      });

      const oldMax = target.maxHp;
      target.maxHp = Math.floor(oldMax * (1 + hpBonusPercent / 100));
      target.currentHp = Math.min(target.maxHp, target.currentHp + Math.floor(oldMax * (hpBonusPercent / 100)));

      return {
        success: true,
        skillId: 'greater_fortitude',
        casterId: session.sessionId,
        targetId: target.sessionId,
        buffType: 'GREATER_FORTITUDE',
        buffValue: hpBonusPercent,
        durationSeconds,
        currentHp: target.currentHp,
        maxHp: target.maxHp,
        currentMp: session.currentMp,
      };
    }

    return {
      success: false,
      skillId,
      casterId: session.sessionId,
      targetId: target.sessionId,
      error: `Habilidade de suporte desconhecida: ${skillId}`,
    };
  }

  /**
   * Consumo autoritativo de poções de Vida e Mana
   */
  public usePotion(
    session: ClientSession,
    potionType: string
  ): PotionResult {
    if (session.currentHp === undefined) session.currentHp = 1000;
    if (session.maxHp === undefined) session.maxHp = 1000;
    if (session.currentMp === undefined) session.currentMp = 300;
    if (session.maxMp === undefined) session.maxMp = 300;

    const pType = String(potionType || '').toLowerCase();
    let hpRestored = 0;
    let mpRestored = 0;

    if (pType.includes('heal') || pType.includes('hp') || pType.includes('vida')) {
      if (session.currentHp >= session.maxHp) {
        return {
          success: false,
          potionType,
          hpRestored: 0,
          mpRestored: 0,
          currentHp: session.currentHp,
          maxHp: session.maxHp,
          currentMp: session.currentMp,
          maxMp: session.maxMp,
          error: 'HP já está no máximo',
        };
      }
      let restoreFactor = 0.25;
      if (pType.includes('small')) restoreFactor = 0.15;
      else if (pType.includes('large')) restoreFactor = 0.35;

      hpRestored = Math.floor(session.maxHp * restoreFactor);
      session.currentHp = Math.min(session.maxHp, session.currentHp + hpRestored);
    } else if (pType.includes('mana') || pType.includes('mp')) {
      if (session.currentMp >= session.maxMp) {
        return {
          success: false,
          potionType,
          hpRestored: 0,
          mpRestored: 0,
          currentHp: session.currentHp,
          maxHp: session.maxHp,
          currentMp: session.currentMp,
          maxMp: session.maxMp,
          error: 'MP já está no máximo',
        };
      }
      let restoreFactor = 0.30;
      if (pType.includes('small')) restoreFactor = 0.20;
      else if (pType.includes('large')) restoreFactor = 0.40;

      mpRestored = Math.floor(session.maxMp * restoreFactor);
      session.currentMp = Math.min(session.maxMp, session.currentMp + mpRestored);
    } else {
      return {
        success: false,
        potionType,
        hpRestored: 0,
        mpRestored: 0,
        currentHp: session.currentHp,
        maxHp: session.maxHp,
        currentMp: session.currentMp,
        maxMp: session.maxMp,
        error: `Tipo de poção desconhecido: ${potionType}`,
      };
    }

    return {
      success: true,
      potionType,
      hpRestored,
      mpRestored,
      currentHp: session.currentHp,
      maxHp: session.maxHp,
      currentMp: session.currentMp,
      maxMp: session.maxMp,
    };
  }
}
