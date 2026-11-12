/**
 * Dasi MMORPG - Gerenciador Canônico de Drops e Posse de Loot (Top Hit Damage)
 * Transcrição das regras de C++ do MU Online Season 5.2
 * (GameServer/Monster.cpp, Map.cpp, MapItem.cpp, ItemOptionRate.cpp).
 */

export interface HitDamageEntry {
  sessionId: string;
  partyId?: string;
  damage: number;
  timestamp: number;
  x: number;
  y: number;
}

export interface GroundItemInstance {
  dropId: string;
  itemDefId: string;
  level: number;
  skill: boolean;
  luck: boolean;
  option: number;
  isExcellent: boolean;
  isAncient: boolean;
  x: number;
  y: number;
  ownerSessionId: string;
  ownerPartyId?: string;
  createdAt: number;
  lootLockUntil: number; // 15 segundos exclusivo do dono e sua party
  expiresAt: number;     // 30 segundos até despawn
}

export class DropManager {
  public static readonly DAMAGE_TIMEOUT_MS = 30000; // 30 segundos
  public static readonly MAX_DISTANCE_TILES = 20;
  public static readonly MAX_DISTANCE_UNITS = 450;  // Raio máximo de combate (melee + ranged)
  public static readonly LOOT_LOCK_MS = 15000;     // 15 segundos
  public static readonly ITEM_LIFETIME_MS = 30000;  // 30 segundos
  public static readonly PICKUP_RADIUS_TILES = 2;   // Raio máximo de 2 tiles
  public static readonly PICKUP_RADIUS_UNITS = 180; // Raio máximo de coleta física em unidades de mundo

  private static dropCounter = 1;

  /**
   * Determina o dono legítimo do drop calculando o Top Hit Damage
   * com suporte a agregação de dano da Party e expiração de 30 segundos.
   */
  public static calculateTopHitDamageOwner(
    damageLog: HitDamageEntry[],
    monsterX: number,
    monsterY: number,
    now: number = Date.now()
  ): { ownerSessionId: string; ownerPartyId?: string } | null {
    // 1. Filtra registros válidos (menos de 30s e distância <= raio de combate)
    const validHits = damageLog.filter((hit) => {
      const isTimeValid = (now - hit.timestamp) <= this.DAMAGE_TIMEOUT_MS;
      const dist = Math.hypot(hit.x - monsterX, hit.y - monsterY);
      return isTimeValid && (dist <= this.MAX_DISTANCE_UNITS || dist <= this.MAX_DISTANCE_TILES);
    });

    if (validHits.length === 0) {
      return null;
    }

    // 2. Agrega danos individuais e danos de Party
    const soloDamage = new Map<string, number>();
    const partyDamage = new Map<string, number>();
    const partyMembersMaxDamage = new Map<string, { sessionId: string; damage: number }>();

    for (const hit of validHits) {
      // Dano solo
      const curSolo = soloDamage.get(hit.sessionId) ?? 0;
      soloDamage.set(hit.sessionId, curSolo + hit.damage);

      // Se estiver em party
      if (hit.partyId) {
        const curParty = partyDamage.get(hit.partyId) ?? 0;
        partyDamage.set(hit.partyId, curParty + hit.damage);

        const bestMember = partyMembersMaxDamage.get(hit.partyId);
        const playerTotal = curSolo + hit.damage;
        if (!bestMember || playerTotal > bestMember.damage) {
          partyMembersMaxDamage.set(hit.partyId, { sessionId: hit.sessionId, damage: playerTotal });
        }
      }
    }

    // 3. Compara o maior dano entre Partys e Jogadores Solo
    let topDamage = -1;
    let winnerSessionId = '';
    let winnerPartyId: string | undefined = undefined;

    // Avalia partys
    for (const [pId, pDmg] of partyDamage.entries()) {
      if (pDmg > topDamage) {
        topDamage = pDmg;
        winnerPartyId = pId;
        winnerSessionId = partyMembersMaxDamage.get(pId)!.sessionId;
      }
    }

    // Avalia jogadores solo
    for (const [sId, sDmg] of soloDamage.entries()) {
      // Se não for membro de party vencedora e superou o dano
      if (sDmg > topDamage) {
        topDamage = sDmg;
        winnerPartyId = undefined;
        winnerSessionId = sId;
      }
    }

    return winnerSessionId ? { ownerSessionId: winnerSessionId, ownerPartyId: winnerPartyId } : null;
  }

  /**
   * Sorteia o nível do item baseado no nível do monstro com o deslocamento de -25 para itens Excelentes
   */
  public static calculateItemTierRange(monsterLevel: number, isExcellent: boolean): { minBaseLevel: number; maxBaseLevel: number } {
    const searchLevel = isExcellent ? Math.max(1, monsterLevel - 25) : monsterLevel;
    return {
      minBaseLevel: Math.max(1, searchLevel - 4),
      maxBaseLevel: searchLevel + 2,
    };
  }

  /**
   * Sorteia os atributos canônicos de um item dropado (Nível +0..+3, Skill, Luck, JoL)
   */
  public static rollItemAttributes(isExcellent: boolean, rngRoll: () => number = Math.random): {
    level: number;
    skill: boolean;
    luck: boolean;
    option: number;
  } {
    let level = 0;
    let skill = false;
    let luck = false;
    let option = 0;

    if (isExcellent) {
      // Itens Excelentes de monstros comuns são sempre +0 e com skill garantida
      level = 0;
      skill = true;
      luck = rngRoll() < 0.01; // 1% de chance de Luck
      option = 0;
    } else {
      // Nível: 70% +0, 15% +1, 10% +2, 5% +3
      const lvlRoll = rngRoll();
      if (lvlRoll < 0.70) level = 0;
      else if (lvlRoll < 0.85) level = 1;
      else if (lvlRoll < 0.95) level = 2;
      else level = 3;

      // Skill: 6% de chance
      skill = rngRoll() < 0.06;

      // Luck: 4% de chance
      luck = rngRoll() < 0.04;

      // Joia da Vida (+4..+12): 96% sem, 1.5% (+4), 1.0% (+8), 0.5% (+12)
      const jolRoll = rngRoll();
      if (jolRoll >= 0.96 && jolRoll < 0.975) option = 1; // +4
      else if (jolRoll >= 0.975 && jolRoll < 0.985) option = 2; // +8
      else if (jolRoll >= 0.985 && jolRoll < 0.990) option = 3; // +12
      else option = 0;
    }

    return { level, skill, luck, option };
  }

  /**
   * Instancia um item físico no chão com trava de posse exclusiva por 15 segundos
   */
  public static createGroundItem(
    itemDefId: string,
    x: number,
    y: number,
    ownerSessionId: string,
    ownerPartyId?: string,
    isExcellent: boolean = false,
    now: number = Date.now()
  ): GroundItemInstance {
    const attrs = this.rollItemAttributes(isExcellent);

    return {
      dropId: `drop-${(this.dropCounter++).toString(16)}`,
      itemDefId,
      level: attrs.level,
      skill: attrs.skill,
      luck: attrs.luck,
      option: attrs.option,
      isExcellent,
      isAncient: false,
      x,
      y,
      ownerSessionId,
      ownerPartyId,
      createdAt: now,
      lootLockUntil: now + this.LOOT_LOCK_MS,
      expiresAt: now + this.ITEM_LIFETIME_MS,
    };
  }

  /**
   * Valida se um jogador pode recolher o item do chão
   * (Verifica distância <= 2 tiles, trava de 15s de posse e autorização de party).
   */
  public static canLootItem(
    groundItem: GroundItemInstance,
    collectorSessionId: string,
    collectorPartyId?: string,
    playerX?: number,
    playerY?: number,
    now: number = Date.now()
  ): { allowed: boolean; reason?: string } {
    // 1. Verificação de expiração
    if (now >= groundItem.expiresAt) {
      return { allowed: false, reason: 'O item já desapareceu.' };
    }

    // 2. Verificação de distância física (máximo de 2 tiles)
    if (playerX !== undefined && playerY !== undefined) {
      const dx = Math.abs(playerX - groundItem.x);
      const dy = Math.abs(playerY - groundItem.y);
      if (dx > this.PICKUP_RADIUS_TILES || dy > this.PICKUP_RADIUS_TILES) {
        return { allowed: false, reason: 'Muito distante para coletar o item.' };
      }
    }

    // 3. Verificação de Trava de Posse (Loot Lock de 15s)
    if (now < groundItem.lootLockUntil) {
      const isOwner = groundItem.ownerSessionId === collectorSessionId;
      const isSameParty = groundItem.ownerPartyId && collectorPartyId && groundItem.ownerPartyId === collectorPartyId;

      if (!isOwner && !isSameParty) {
        return { allowed: false, reason: 'Você não pode coletar este item ainda (posse exclusiva).' };
      }
    }

    return { allowed: true };
  }
}
