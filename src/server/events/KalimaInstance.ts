/**
 * Dasi MMORPG - Instância do Evento de Kalima & Lord Kundun (Kalima 1 a 7)
 * Engenharia reversa integral do GameServer Webzen MU Online Season 5.2
 * (Kalima.cpp, Kalima.h, Gate.txt, ItemManager.cpp).
 */

export interface KalimaLevelRequirement {
  level: number;
  minLevelNormal: number;
  maxLevelNormal: number;
  minLevelSpecial: number; // MG, DL, RF
  maxLevelSpecial: number;
  illusionBossId: number;
}

export const KALIMA_REQUIREMENTS: Record<number, KalimaLevelRequirement> = {
  1: { level: 1, minLevelNormal: 40, maxLevelNormal: 130, minLevelSpecial: 20, maxLevelSpecial: 110, illusionBossId: 161 },
  2: { level: 2, minLevelNormal: 131, maxLevelNormal: 180, minLevelSpecial: 111, maxLevelSpecial: 160, illusionBossId: 181 },
  3: { level: 3, minLevelNormal: 181, maxLevelNormal: 230, minLevelSpecial: 161, maxLevelSpecial: 210, illusionBossId: 182 },
  4: { level: 4, minLevelNormal: 231, maxLevelNormal: 280, minLevelSpecial: 211, maxLevelSpecial: 260, illusionBossId: 183 },
  5: { level: 5, minLevelNormal: 281, maxLevelNormal: 330, minLevelSpecial: 261, maxLevelSpecial: 310, illusionBossId: 184 },
  6: { level: 6, minLevelNormal: 331, maxLevelNormal: 349, minLevelSpecial: 311, maxLevelSpecial: 349, illusionBossId: 185 },
  7: { level: 7, minLevelNormal: 350, maxLevelNormal: 400, minLevelSpecial: 250, maxLevelSpecial: 400, illusionBossId: 275 }, // Lord Kundun Verdadeiro!
};

export class KalimaInstance {
  /**
   * Valida se um personagem tem o nível correto para ingressar no piso de Kalima
   */
  public static canEnterKalima(kalimaLevel: number, characterLevel: number, isSpecialClass: boolean): boolean {
    const req = KALIMA_REQUIREMENTS[kalimaLevel];
    if (!req) return false;

    if (isSpecialClass) {
      return characterLevel >= req.minLevelSpecial && characterLevel <= req.maxLevelSpecial;
    }
    return characterLevel >= req.minLevelNormal && characterLevel <= req.maxLevelNormal;
  }

  /**
   * Converte 5x Kundun Marks do mesmo nível no item completo Lost Map
   * (Regra canônica do inventário Webzen: ao juntar 5 marcas no inventário,
   * elas são consumidas e substituídas por 1 Lost Map +N).
   */
  public static craftLostMap(markCount: number, markLevel: number): { success: boolean; lostMapLevel?: number; remainingMarks: number } {
    if (markCount < 5 || markLevel < 1 || markLevel > 7) {
      return { success: false, remainingMarks: markCount };
    }

    return {
      success: true,
      lostMapLevel: markLevel,
      remainingMarks: markCount - 5,
    };
  }

  /**
   * Spawna o Portal de Kalima ao usar o Lost Map no chão
   * O portal dura exatamente 180 segundos (3 minutos) e aceita membros da party
   */
  public static spawnKalimaPortal(
    ownerPlayerId: string,
    partyId: string | null,
    kalimaLevel: number,
    x: number,
    y: number
  ): { portalId: string; kalimaLevel: number; x: number; y: number; durationSeconds: number } {
    return {
      portalId: `kalima_gate_${ownerPlayerId}_${Date.now()}`,
      kalimaLevel,
      x,
      y,
      durationSeconds: 180,
    };
  }

  /**
   * Gera o loot sagrado ao derrotar Lord Kundun (Kalima 7)
   * Canônico: drop garantido de 3 Itens Ancient (Sets Sagrados)
   */
  public static generateLordKundunDrops(): { ancientCount: number; dropCategories: string[] } {
    return {
      ancientCount: 3,
      dropCategories: ['ANCIENT_SET_ARMOR', 'ANCIENT_WEAPON', 'ANCIENT_ACCESSORY'],
    };
  }
}
