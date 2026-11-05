/**
 * Dasi MMORPG - Instância do Coliseu de Duelos (Arena 1v1 de Honra)
 * Disputa marcial competitiva 1v1 com placar holográfico e barreira mágica de espectadores.
 */

export interface DuelistInfo {
  sessionId: string;
  name: string;
  className: string;
  level: number;
  score: number;
  currentHp: number;
  maxHp: number;
  wins: number;
}

export type DuelState = 'WAITING_PLAYERS' | 'COUNTDOWN' | 'FIGHTING' | 'ROUND_OVER' | 'MATCH_OVER';

export class DuelColiseumInstance {
  public readonly id: string;
  public state: DuelState = 'WAITING_PLAYERS';
  public readonly targetScore: number;

  public duelist1: DuelistInfo | null = null;
  public duelist2: DuelistInfo | null = null;
  public spectators: Set<string> = new Set();

  public roundNumber = 1;
  public countdownTimer = 0;
  public winnerId: string | null = null;

  // Barreira mágica do coliseu (Raio máximo permitido para combatentes = 17.5m)
  public static readonly BARRIER_RADIUS = 17.5;

  constructor(instanceId: string, targetScore = 10) {
    this.id = instanceId;
    this.targetScore = targetScore;
  }

  public registerDuelist(
    sessionId: string,
    name: string,
    className: string,
    level: number,
    maxHp: number,
    now = Date.now()
  ): boolean {
    if (!this.duelist1) {
      this.duelist1 = {
        sessionId,
        name,
        className,
        level,
        score: 0,
        currentHp: maxHp,
        maxHp,
        wins: 0,
      };
      return true;
    }

    if (!this.duelist2 && this.duelist1.sessionId !== sessionId) {
      this.duelist2 = {
        sessionId,
        name,
        className,
        level,
        score: 0,
        currentHp: maxHp,
        maxHp,
        wins: 0,
      };
      // Ambos duelistas registrados -> inicia contagem regressiva
      this.startCountdown(now);
      return true;
    }

    return false;
  }

  public addSpectator(sessionId: string): void {
    this.spectators.add(sessionId);
  }

  public removeSpectator(sessionId: string): void {
    this.spectators.delete(sessionId);
  }

  private startCountdown(now = Date.now()): void {
    this.state = 'COUNTDOWN';
    this.countdownTimer = now + 4000; // 4 segundos de contagem (3.. 2.. 1.. LUTA!)
  }

  public update(now = Date.now()): { state: DuelState; countdownSec: number } {
    if (this.state === 'COUNTDOWN') {
      const remainingMs = this.countdownTimer - now;
      if (remainingMs <= 0) {
        this.state = 'FIGHTING';
        return { state: 'FIGHTING', countdownSec: 0 };
      }
      return { state: 'COUNTDOWN', countdownSec: Math.ceil(remainingMs / 1000) };
    }

    return { state: this.state, countdownSec: 0 };
  }

  /**
   * Registra um abate no duelo
   */
  public recordKill(killerSessionId: string, now = Date.now()): {
    roundWinner: string;
    isMatchOver: boolean;
    d1Score: number;
    d2Score: number;
    matchWinner: string | null;
  } {
    if (this.state !== 'FIGHTING' || !this.duelist1 || !this.duelist2) {
      return { roundWinner: '', isMatchOver: false, d1Score: 0, d2Score: 0, matchWinner: null };
    }

    if (this.duelist1.sessionId === killerSessionId) {
      this.duelist1.score++;
    } else if (this.duelist2.sessionId === killerSessionId) {
      this.duelist2.score++;
    }

    const d1Score = this.duelist1.score;
    const d2Score = this.duelist2.score;

    if (d1Score >= this.targetScore) {
      this.state = 'MATCH_OVER';
      this.winnerId = this.duelist1.sessionId;
      return { roundWinner: this.duelist1.name, isMatchOver: true, d1Score, d2Score, matchWinner: this.duelist1.name };
    }

    if (d2Score >= this.targetScore) {
      this.state = 'MATCH_OVER';
      this.winnerId = this.duelist2.sessionId;
      return { roundWinner: this.duelist2.name, isMatchOver: true, d1Score, d2Score, matchWinner: this.duelist2.name };
    }

    // Próximo round
    this.roundNumber++;
    this.duelist1.currentHp = this.duelist1.maxHp;
    this.duelist2.currentHp = this.duelist2.maxHp;
    this.startCountdown(now);

    return {
      roundWinner: killerSessionId === this.duelist1.sessionId ? this.duelist1.name : this.duelist2.name,
      isMatchOver: false,
      d1Score,
      d2Score,
      matchWinner: null,
    };
  }

  /**
   * Valida se um participante está dentro da arena ou se é espectador tentando interferir
   */
  public isActionPermitted(sessionId: string, targetX: number, targetY: number): boolean {
    const isCombatant = (this.duelist1?.sessionId === sessionId) || (this.duelist2?.sessionId === sessionId);
    if (!isCombatant) {
      // Espectadores não podem interagir com a área de duelo interna
      return false;
    }

    // Impede fuga para fora da cúpula
    const dist = Math.sqrt(targetX * targetX + targetY * targetY);
    return dist <= DuelColiseumInstance.BARRIER_RADIUS;
  }

  public toJSON(): object {
    return {
      id: this.id,
      state: this.state,
      targetScore: this.targetScore,
      roundNumber: this.roundNumber,
      duelist1: this.duelist1,
      duelist2: this.duelist2,
      spectatorsCount: this.spectators.size,
      winnerId: this.winnerId,
    };
  }
}
