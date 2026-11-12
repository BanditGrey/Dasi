/**
 * Dasi MMORPG - Sistema Canônico de Gens (Famílias Duprian & Vanert)
 * Engenharia reversa integral do GameServer Webzen MU Online Season 5.2
 * (GensSystem.cpp, GensSystem.h, GameServerInfo - Custom.dat).
 */

export const GensFamily = {
  NONE: 0,
  VANERT: 1,  // Família Vanert (Azul - Cavaleiros e Defensores)
  DUPRIAN: 2, // Família Duprian (Vermelho - Conquistadores e Glória)
} as const;

export type GensFamily = typeof GensFamily[keyof typeof GensFamily];

export const GensSymbol = {
  GRAND_DUKE: 1,      // Grão-Duque (Rank 1 do servidor)
  DUKE: 2,            // Duque (Rank 2..5)
  MARQUIS: 3,         // Marquês (Rank 6..10)
  COUNT: 4,           // Conde (Rank 11..30)
  VISCOUNT: 5,        // Visconde (Rank 31..50)
  BARON: 6,           // Barão (Rank 51..100)
  KNIGHT_COMMANDER: 7,// Comandante Cavaleiro (Rank 101..200)
  SUPERIOR_KNIGHT: 8, // Cavaleiro Superior (Rank 201..300)
  KNIGHT: 9,          // Cavaleiro (Rank > 300 com >= 10.000 contribuição)
  MAJOR: 10,          // Major (6.000 a 9.999 contribuição)
  CAPTAIN: 11,        // Capitão (3.000 a 5.999 contribuição)
  LIEUTENANT: 12,     // Tenente (1.500 a 2.999 contribuição)
  SERGEANT: 13,       // Sargento (500 a 1.499 contribuição)
  PRIVATE: 14,        // Soldado Raso / Recruta (0 a 499 contribuição)
} as const;

export type GensSymbol = typeof GensSymbol[keyof typeof GensSymbol];

export interface GensMemberData {
  playerId: string;
  name: string;
  family: GensFamily;
  contribution: number;
  rank: number; // Posição no ranking geral (1..N)
}

export class GensSystem {
  /**
   * Determina o símbolo e patente do membro conforme sua pontuação e rank da Webzen
   */
  public static calculateGensSymbol(contribution: number, rank = 0): GensSymbol {
    if (contribution >= 10000 && rank > 0) {
      if (rank === 1) return GensSymbol.GRAND_DUKE;
      if (rank >= 2 && rank <= 5) return GensSymbol.DUKE;
      if (rank >= 6 && rank <= 10) return GensSymbol.MARQUIS;
      if (rank >= 11 && rank <= 30) return GensSymbol.COUNT;
      if (rank >= 31 && rank <= 50) return GensSymbol.VISCOUNT;
      if (rank >= 51 && rank <= 100) return GensSymbol.BARON;
      if (rank >= 101 && rank <= 200) return GensSymbol.KNIGHT_COMMANDER;
      if (rank >= 201 && rank <= 300) return GensSymbol.SUPERIOR_KNIGHT;
      return GensSymbol.KNIGHT;
    }

    if (contribution >= 6000) return GensSymbol.MAJOR;
    if (contribution >= 3000) return GensSymbol.CAPTAIN;
    if (contribution >= 1500) return GensSymbol.LIEUTENANT;
    if (contribution >= 500) return GensSymbol.SERGEANT;
    return GensSymbol.PRIVATE;
  }

  /**
   * Verifica se o combate entre dois jogadores em uma Battle Zone de Gens é hostil
   */
  public static isHostileCombat(attackerFamily: GensFamily, targetFamily: GensFamily, isBattleZone: boolean): boolean {
    if (!isBattleZone) return false;
    if (attackerFamily === GensFamily.NONE || targetFamily === GensFamily.NONE) return false;
    return attackerFamily !== targetFamily;
  }

  /**
   * Calcula o ganho e perda de contribuição em um combate PvP em Zona de Batalha Gens
   * - O assassino ganha pontos baseados na diferença de nível
   * - A vítima perde pontos correspondentes
   * - O assassino NÃO ganha status PK (não vira assassino)
   */
  public static calculateKillReward(
    killerLevel: number,
    victimLevel: number,
    consecutiveKillsOnSameVictim = 0
  ): { contributionGain: number; contributionLoss: number; pkGained: boolean } {
    // Proteção contra anti-jogo / farming da mesma vítima (máximo 3 vezes por hora)
    if (consecutiveKillsOnSameVictim >= 3) {
      return { contributionGain: 0, contributionLoss: 0, pkGained: false };
    }

    const levelDelta = victimLevel - killerLevel;
    let baseGain = 5;

    if (levelDelta >= 30) baseGain = 10;
    else if (levelDelta >= 10) baseGain = 7;
    else if (levelDelta <= -30) baseGain = 1;
    else if (levelDelta <= -10) baseGain = 3;

    return {
      contributionGain: baseGain,
      contributionLoss: Math.max(1, baseGain - 1),
      pkGained: false, // Regra canônica: Gens War é livre de penalidade PK
    };
  }
}
