import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TradeManager,
  TradeState,
} from '../TradeManager.ts';
import type { ItemInstance } from '../../inventory/types.ts';

describe('TradeManager - Anti-Scam & Transactional Trade Engine', () => {
  it('abre negociação entre dois jogadores e aloca sessão', () => {
    const tm = new TradeManager();
    const res = tm.requestTrade('p1', 'PlayerOne', 'p2', 'PlayerTwo');

    assert.equal(res.success, true);
    assert.ok(res.tradeSession);
    assert.equal(res.tradeSession.state, TradeState.OFFERING);
    assert.equal(tm.getActiveTradeCount(), 1);
  });

  it('impõe proteção anti-scam com destravamento e reset ao alterar itens ou Zen', () => {
    const tm = new TradeManager();
    tm.requestTrade('p1', 'PlayerOne', 'p2', 'PlayerTwo');

    // Jogador 2 aceita previamente
    const acc2 = tm.acceptTrade('p2');
    assert.equal(acc2.success, true);
    assert.equal(acc2.isFullyCommitted, false);

    // Jogador 1 altera a oferta de Zen
    tm.offerZen('p1', 500_000);

    // Jogador 2 deve ter seu aceite resetado e receber trava de tempo
    const accAgain = tm.acceptTrade('p2');
    assert.equal(accAgain.success, false);
    assert.ok(accAgain.message.includes('Aguarde'));

    // Jogador 1 insere um item
    const item: ItemInstance = {
      uuid: 'trade-blade',
      defId: 'blade',
      level: 0,
      durability: 100,
      maxDurability: 100,
      skill: false,
      luck: false,
      optionLevel: 0,
      excellentMask: 0,
    };
    const itemRes = tm.offerItem('p1', item);
    assert.equal(itemRes.success, true);
  });

  it('cancela imediatamente a negociação ao solicitar cancelamento', () => {
    const tm = new TradeManager();
    tm.requestTrade('p1', 'PlayerOne', 'p2', 'PlayerTwo');

    const cancelRes = tm.cancelTrade('p1');
    assert.equal(cancelRes.success, true);
    assert.equal(tm.getActiveTradeCount(), 0);
  });
});
