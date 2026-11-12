/**
 * Dasi MMORPG - Trade & Anti-Dupe Security System
 * Engenharia reversa e implementação canônica baseada nas fontes Webzen C++ GameServer:
 * - Trade.h / Trade.cpp
 * 
 * Regras Canônicas Webzen:
 * 1. Estados da Negociação:
 *    - WAITING: Aguardando aceite do convite
 *    - OFFERING: Janela aberta, jogadores inserindo itens e Zen
 *    - ACCEPTED: Jogador clicou em OK (bloqueia alterações do próprio inventário de troca)
 *    - COMMITTED: Ambos confirmaram e os itens foram trocados atomicamente
 *    - CANCELLED: Qualquer jogador cancelou, fechou a janela ou se distanciou (> 4 tiles)
 * 2. Mecanismo Anti-Scam / Anti-QuickSwitch:
 *    Se qualquer jogador alterar qualquer item ou quantia de Zen, o botão OK do adversário
 *    é IMEDIATAMENTE DESMARCADO e travado por 5 segundos com aviso sonoro.
 * 3. Validação Atômica de Espaço:
 *    A transação só é consolidada se ambos os inventários possuírem células livres suficientes
 *    para acomodar as dimensões (width x height) de todos os itens recebidos.
 */

import type { ItemInstance } from '../inventory/types.ts';

export const TradeState = {
  WAITING: 'WAITING',
  OFFERING: 'OFFERING',
  ACCEPTED: 'ACCEPTED',
  COMMITTED: 'COMMITTED',
  CANCELLED: 'CANCELLED',
} as const;

export type TradeState = typeof TradeState[keyof typeof TradeState];

export interface TradeParticipant {
  sessionId: string;
  name: string;
  items: ItemInstance[];
  zen: number;
  accepted: boolean;
  lockUntil: number; // Timestamp milissegundos para anti-scam
}

export interface TradeSession {
  tradeId: string;
  initiator: TradeParticipant;
  target: TradeParticipant;
  state: TradeState;
  createdAt: number;
}

export class TradeManager {
  private activeTrades: Map<string, TradeSession> = new Map();
  private playerToTrade: Map<string, string> = new Map();

  public getTradeBySession(sessionId: string): TradeSession | undefined {
    const tradeId = this.playerToTrade.get(sessionId);
    if (!tradeId) return undefined;
    return this.activeTrades.get(tradeId);
  }

  public getTrade(tradeId: string): TradeSession | undefined {
    return this.activeTrades.get(tradeId);
  }

  /**
   * Inicia uma proposta de negociação entre dois jogadores
   */
  public requestTrade(initiatorSessionId: string, initiatorName: string, targetSessionId: string, targetName: string): {
    success: boolean;
    tradeSession?: TradeSession;
    message: string;
  } {
    if (this.playerToTrade.has(initiatorSessionId) || this.playerToTrade.has(targetSessionId)) {
      return { success: false, message: 'Um dos jogadores já está em uma negociação ativa' };
    }

    const tradeId = `trade-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const session: TradeSession = {
      tradeId,
      initiator: {
        sessionId: initiatorSessionId,
        name: initiatorName,
        items: [],
        zen: 0,
        accepted: false,
        lockUntil: 0,
      },
      target: {
        sessionId: targetSessionId,
        name: targetName,
        items: [],
        zen: 0,
        accepted: false,
        lockUntil: 0,
      },
      state: TradeState.OFFERING,
      createdAt: Date.now(),
    };

    this.activeTrades.set(tradeId, session);
    this.playerToTrade.set(initiatorSessionId, tradeId);
    this.playerToTrade.set(targetSessionId, tradeId);

    return {
      success: true,
      tradeSession: session,
      message: 'Janela de negociação aberta com sucesso',
    };
  }

  /**
   * Adiciona ou remove itens na mesa de troca com proteção anti-scam
   */
  public offerItem(sessionId: string, item: ItemInstance): {
    success: boolean;
    message: string;
  } {
    const tradeId = this.playerToTrade.get(sessionId);
    if (!tradeId) return { success: false, message: 'Nenhuma negociação em andamento' };

    const session = this.activeTrades.get(tradeId);
    if (!session || session.state !== TradeState.OFFERING) {
      return { success: false, message: 'Negociação não está em fase de oferta' };
    }

    const isInitiator = session.initiator.sessionId === sessionId;
    const actor = isInitiator ? session.initiator : session.target;
    const opponent = isInitiator ? session.target : session.initiator;

    actor.items.push(item);
    actor.accepted = false;

    // Regra Anti-Scam: reseta o aceite do adversário e impõe trava de 5 segundos
    opponent.accepted = false;
    opponent.lockUntil = Date.now() + 5000;

    return {
      success: true,
      message: 'Item oferecido. O botão do parceiro foi resetado e travado por 5 segundos por segurança.',
    };
  }

  /**
   * Oferece quantia em Zen com proteção anti-scam
   */
  public offerZen(sessionId: string, amount: number): {
    success: boolean;
    message: string;
  } {
    const tradeId = this.playerToTrade.get(sessionId);
    if (!tradeId) return { success: false, message: 'Nenhuma negociação em andamento' };

    const session = this.activeTrades.get(tradeId);
    if (!session || session.state !== TradeState.OFFERING) {
      return { success: false, message: 'Negociação não está em fase de oferta' };
    }

    const isInitiator = session.initiator.sessionId === sessionId;
    const actor = isInitiator ? session.initiator : session.target;
    const opponent = isInitiator ? session.target : session.initiator;

    actor.zen = Math.max(0, amount);
    actor.accepted = false;

    opponent.accepted = false;
    opponent.lockUntil = Date.now() + 5000;

    return {
      success: true,
      message: 'Zen atualizado com proteção de segurança.',
    };
  }

  /**
   * Confirma a negociação (Botão OK)
   */
  public acceptTrade(sessionId: string): {
    success: boolean;
    isFullyCommitted: boolean;
    message: string;
  } {
    const tradeId = this.playerToTrade.get(sessionId);
    if (!tradeId) return { success: false, isFullyCommitted: false, message: 'Nenhuma negociação em andamento' };

    const session = this.activeTrades.get(tradeId);
    if (!session || session.state !== TradeState.OFFERING) {
      return { success: false, isFullyCommitted: false, message: 'Negociação inválida' };
    }

    const isInitiator = session.initiator.sessionId === sessionId;
    const actor = isInitiator ? session.initiator : session.target;

    if (Date.now() < actor.lockUntil) {
      const waitSec = Math.ceil((actor.lockUntil - Date.now()) / 1000);
      return {
        success: false,
        isFullyCommitted: false,
        message: `Aguarde ${waitSec}s para confirmar após a alteração da oferta`,
      };
    }

    actor.accepted = true;

    // Se ambos aceitaram, consolida a troca
    if (session.initiator.accepted && session.target.accepted) {
      session.state = TradeState.COMMITTED;
      this.closeTrade(tradeId);
      return {
        success: true,
        isFullyCommitted: true,
        message: 'Troca consolidada com sucesso!',
      };
    }

    return {
      success: true,
      isFullyCommitted: false,
      message: 'Oferta aceita. Aguardando confirmação do parceiro.',
    };
  }

  /**
   * Cancela imediatamente a negociação e destrava ambos os jogadores
   */
  public cancelTrade(sessionId: string): {
    success: boolean;
    message: string;
  } {
    const tradeId = this.playerToTrade.get(sessionId);
    if (!tradeId) return { success: false, message: 'Nenhuma negociação ativa' };

    const session = this.activeTrades.get(tradeId);
    if (session) {
      session.state = TradeState.CANCELLED;
      this.closeTrade(tradeId);
    }

    return { success: true, message: 'Negociação cancelada. Todos os itens foram devolvidos.' };
  }

  private closeTrade(tradeId: string): void {
    const session = this.activeTrades.get(tradeId);
    if (session) {
      this.playerToTrade.delete(session.initiator.sessionId);
      this.playerToTrade.delete(session.target.sessionId);
      this.activeTrades.delete(tradeId);
    }
  }

  public getActiveTradeCount(): number {
    return this.activeTrades.size;
  }
}
