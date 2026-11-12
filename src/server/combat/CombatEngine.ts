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

    if (primaryWeapon) {
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
    // Chance de acerto baseada na taxa de ataque do atacante vs taxa de defesa do monstro
    const totalRate = attackRate + mob.defenseRate;
    const hitChance = totalRate > 0 ? Math.min(0.96, Math.max(0.10, attackRate / totalRate)) : 0.85;
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

    if (Math.random() <= ignoreDefChance) {
      damageType = 'IGNORE_DEFENSE';
      const baseDmg = Math.floor(minAttack + Math.random() * (maxAttack - minAttack + 1));
      finalDamage = baseDmg; // Defesa do alvo calculada como 0!
      poiseDamage = 45;
      knockbackDistance += 15;
    } else if (roll <= excellentChance) {
      damageType = 'EXCELLENT';
      // Dano Excelente: Dano Máximo * 1.20 + bônus
      finalDamage = Math.floor(maxAttack * 1.20) + (primaryWeapon ? primaryWeapon.level * 4 : 5) - mob.defense;
      poiseDamage = 35;
      knockbackDistance += 12;
    } else if (roll <= excellentChance + criticalChance) {
      damageType = 'CRITICAL';
      // Dano Crítico: Dano Máximo garantido + bônus
      finalDamage = maxAttack + (primaryWeapon ? primaryWeapon.level * 3 : 3) - mob.defense;
      poiseDamage = 30;
      knockbackDistance += 8;
    } else if (skillId || hasSkill) {
      damageType = 'SKILL';
      const baseDmg = Math.floor(minAttack + Math.random() * (maxAttack - minAttack + 1));
      // Habilidade DK multiplica dano base por ~1.8
      finalDamage = Math.floor(baseDmg * 1.8) - mob.defense;
      poiseDamage = 25;
      knockbackDistance += 6;
    } else {
      damageType = 'NORMAL';
      const baseDmg = Math.floor(minAttack + Math.random() * (maxAttack - minAttack + 1));
      finalDamage = baseDmg - mob.defense;
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
}
