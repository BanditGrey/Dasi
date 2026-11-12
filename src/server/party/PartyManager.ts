/**
 * Dasi MMORPG - Party Experience and Group Bonus Engine
 * Engenharia reversa e implementação canônica baseada nas fontes Webzen C++ GameServer:
 * - Party.h / Party.cpp
 * - ObjectManager.cpp (Experience distribution)
 * - GameServerInfo - Common.dat
 * 
 * Regras Canônicas Webzen:
 * 1. Tamanho Máximo de Grupo: 5 jogadores.
 * 2. Fórmula de Experiência Geral (General Party Experience):
 *    - 2 jogadores: 160% total (80% cada)
 *    - 3 jogadores: 180% total (60% cada)
 *    - 4 jogadores: 200% total (50% cada)
 *    - 5 jogadores: 225% total (45% cada)
 * 3. Fórmula de Grupo Dourado (Gold Party / Special Party):
 *    Ativada quando o grupo contém 3 ou mais classes fundadoras distintas (DK, DW, ELF, MG, DL, SU):
 *    - 3 classes: 225% total (75% cada)
 *    - 4 classes: 260% total (65% cada)
 *    - 5 classes: 300% total (60% cada)
 * 4. Trava de Diferença de Nível (Level Gap Rule):
 *    Membros com diferença de nível superior a 130 níveis em relação ao líder/monstro não recebem EXP.
 */

export interface PartyMember {
  sessionId: string;
  name: string;
  className: string;
  level: number;
  isLeader?: boolean;
}

export interface PartyExpDistribution {
  totalMonsterExp: number;
  totalPartyExp: number;
  isGoldParty: boolean;
  memberExpShares: Array<{
    sessionId: string;
    expGranted: number;
    eligible: boolean;
    reason?: string;
  }>;
}

export class PartyManager {
  public static readonly MAX_PARTY_MEMBERS = 5;
  public static readonly MAX_LEVEL_GAP = 130;

  // Gerenciamento de Instâncias Ativas no Servidor
  private parties: Map<string, PartyMember[]> = new Map();
  private playerToParty: Map<string, string> = new Map();

  public createParty(leader: PartyMember): string {
    const partyId = `party-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    leader.isLeader = true;
    this.parties.set(partyId, [leader]);
    this.playerToParty.set(leader.sessionId, partyId);
    return partyId;
  }

  public getParty(partyId: string): PartyMember[] | undefined {
    return this.parties.get(partyId);
  }

  public getPartyBySession(sessionId: string): { partyId: string; members: PartyMember[] } | undefined {
    const partyId = this.playerToParty.get(sessionId);
    if (!partyId) return undefined;
    const members = this.parties.get(partyId);
    if (!members) return undefined;
    return { partyId, members };
  }

  public addMember(partyId: string, member: PartyMember): boolean {
    const members = this.parties.get(partyId);
    if (!members || members.length >= PartyManager.MAX_PARTY_MEMBERS) return false;
    member.isLeader = false;
    members.push(member);
    this.playerToParty.set(member.sessionId, partyId);
    return true;
  }

  public removeMember(sessionId: string): { partyId: string; remaining: PartyMember[]; disbanded: boolean } | null {
    const partyId = this.playerToParty.get(sessionId);
    if (!partyId) return null;
    this.playerToParty.delete(sessionId);
    const members = this.parties.get(partyId);
    if (!members) return null;
    const idx = members.findIndex((m) => m.sessionId === sessionId);
    if (idx !== -1) members.splice(idx, 1);

    if (members.length <= 1) {
      if (members.length === 1) {
        this.playerToParty.delete(members[0].sessionId);
      }
      this.parties.delete(partyId);
      return { partyId, remaining: [], disbanded: true };
    }

    if (!members.some((m) => m.isLeader)) {
      members[0].isLeader = true;
    }
    return { partyId, remaining: members, disbanded: false };
  }

  // Taxas de EXP Canônicas (GameServerInfo - Common.dat)
  private static readonly GENERAL_EXP_RATES = [100, 80, 60, 50, 45]; // Índices 0..4 (1..5 membros)
  private static readonly SPECIAL_EXP_RATES = [100, 80, 75, 65, 60]; // Índices 0..4 (1..5 membros)

  /**
   * Verifica se a composição do grupo qualifica como Gold Party (Special Party)
   * Exige 3 ou mais classes distintas.
   */
  public static isGoldParty(members: PartyMember[]): boolean {
    const distinctClasses = new Set(members.map((m) => m.className.toUpperCase()));
    return distinctClasses.size >= 3;
  }

  /**
   * Calcula a distribuição de experiência de monstro entre os membros do grupo
   */
  public static calculatePartyExp(
    baseMonsterExp: number,
    members: PartyMember[],
    monsterLevel: number
  ): PartyExpDistribution {
    const count = members.length;
    if (count <= 1) {
      return {
        totalMonsterExp: baseMonsterExp,
        totalPartyExp: baseMonsterExp,
        isGoldParty: false,
        memberExpShares: members.map((m) => ({
          sessionId: m.sessionId,
          expGranted: baseMonsterExp,
          eligible: true,
        })),
      };
    }

    const clampedCount = Math.min(this.MAX_PARTY_MEMBERS, count);
    const goldParty = this.isGoldParty(members);

    const rateTable = goldParty ? this.SPECIAL_EXP_RATES : this.GENERAL_EXP_RATES;
    const perMemberRate = rateTable[clampedCount - 1]; // ex: 60% por membro em Gold Party de 5
    const totalMultiplier = (perMemberRate * clampedCount) / 100; // ex: 3.0 (300%)

    const totalPartyExp = Math.floor(baseMonsterExp * totalMultiplier);

    // Média de níveis dos membros elegíveis
    const leader = members.find((m) => m.isLeader) || members[0];

    const memberExpShares = members.map((member) => {
      // Regra de Gap de Nível (anti-powerleveling)
      const levelDiff = Math.abs(member.level - leader.level);
      if (levelDiff > this.MAX_LEVEL_GAP) {
        return {
          sessionId: member.sessionId,
          expGranted: 0,
          eligible: false,
          reason: `Diferença de nível excessiva (> ${this.MAX_LEVEL_GAP} níveis)`,
        };
      }

      // Distribuição proporcional ao nível do personagem
      const individualExp = Math.floor((baseMonsterExp * perMemberRate) / 100);

      return {
        sessionId: member.sessionId,
        expGranted: individualExp,
        eligible: true,
      };
    });

    return {
      totalMonsterExp: baseMonsterExp,
      totalPartyExp,
      isGoldParty: goldParty,
      memberExpShares,
    };
  }
}
