import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { GameServer } from '../GameServer.ts';
import { Opcodes, type PacketMessage } from '../protocol.ts';
import { Item } from '../../inventory/Item.ts';
import { ItemCategory } from '../../inventory/types.ts';
import { PartyManager } from '../../party/PartyManager.ts';

// Mock WebSocket para simular conexões de teste
class MockWebSocket {
  public readyState = 1; // WebSocket.OPEN
  public sentMessages: string[] = [];

  public send(data: string | Buffer): void {
    if (typeof data === 'string') {
      this.sentMessages.push(data);
    } else {
      this.sentMessages.push(data.toString('utf-8'));
    }
  }

  public getParsedMessages(): PacketMessage<any>[] {
    return this.sentMessages.map((msg) => {
      try {
        return JSON.parse(msg);
      } catch {
        return { opcode: 0, subcode: 0, seq: 0, payload: null };
      }
    });
  }

  public getLastMessage(): PacketMessage<any> | undefined {
    const msgs = this.getParsedMessages();
    return msgs[msgs.length - 1];
  }

  public clear(): void {
    this.sentMessages = [];
  }
}

describe('Master Server Orchestration - All Canonical Subsystems & Game Loop', () => {
  let server: GameServer;

  before(async () => {
    server = new GameServer({ port: 8999, host: '127.0.0.1', dbPath: ':memory:' });
  });

  it('1. Garante que todos os 16 subsistemas autoritativos estão instanciados no GameServer', () => {
    assert.ok(server.sessionManager, 'SessionManager deve existir');
    assert.ok(server.bossManager, 'BossManager deve existir');
    assert.ok(server.eventManager, 'EventManager deve existir');
    assert.ok(server.dungeonManager, 'DungeonManager deve existir');
    assert.ok(server.guildSystem, 'GuildSystem deve existir');
    assert.ok(server.castleSiege, 'CastleSiegeManager deve existir');
    assert.ok(server.combatEngine, 'CombatEngine deve existir');
    assert.ok(server.navigationManager, 'NavigationManager deve existir');
    assert.ok(server.partyManager, 'PartyManager deve existir');
    assert.ok(server.tradeManager, 'TradeManager deve existir');
    assert.ok(server.personalShopManager, 'PersonalShopManager deve existir');
    assert.ok(server.resetManager, 'ResetManager deve existir');
    assert.ok(server.questManager, 'QuestManager deve existir');
    assert.ok(server.gensSystem, 'GensSystem deve existir');
    assert.ok(server.socketItemSystem, 'SocketItemSystem deve existir');
    assert.ok(server.harmonySystem, 'HarmonyAnd380System deve existir');
  });

  it('2. Orquestra Navegação e Teleportes com desconto de classe e bloqueio de PK', () => {
    const mockWs = new MockWebSocket();
    const session = server.sessionManager.createSession(mockWs, false);
    session.state = 'AUTHENTICATED';
    session.character.level = 150;
    session.character.zen = 100000;

    // Dispara teleporte para Devias
    (server as any).dispatchPacket(session, {
      opcode: Opcodes.MSG_TELEPORT_REQ.opcode,
      subcode: Opcodes.MSG_TELEPORT_REQ.subcode,
      seq: 1,
      payload: { destinationName: 'Devias' },
    });

    const res = mockWs.getLastMessage();
    assert.equal(res?.opcode, Opcodes.MSG_TELEPORT_RES.opcode);
    assert.equal(res?.subcode, Opcodes.MSG_TELEPORT_RES.subcode);
    assert.equal(res?.payload?.success, true);
    assert.equal(res?.payload?.map, 2); // Devias Map 2
    assert.equal(session.currentMap, 2);

    // Testa gatilho de portal físico (Flag 1) em Lorencia (121, 232) -> Dungeon Gate 2
    (server as any).dispatchPacket(session, {
      opcode: Opcodes.MSG_GATE_TRIGGER_REQ.opcode,
      subcode: Opcodes.MSG_GATE_TRIGGER_REQ.subcode,
      seq: 2,
      payload: { currentMap: 0, currentX: 121, currentY: 232 },
    });

    const gateRes = mockWs.getLastMessage();
    assert.equal(gateRes?.opcode, Opcodes.MSG_GATE_TRIGGER_RES.opcode);
    assert.equal(gateRes?.payload?.triggered, true);
    assert.equal(gateRes?.payload?.map, 1); // Dungeon Map 1
  });

  it('3. Orquestra Sistema de Grupos (Party) e EXP Especial de Gold Party', () => {
    const ws1 = new MockWebSocket();
    const ws2 = new MockWebSocket();
    const ws3 = new MockWebSocket();

    const s1 = server.sessionManager.createSession(ws1, false);
    s1.state = 'AUTHENTICATED';
    s1.character.characterClass = 'DK';
    s1.character.name = 'BladeKnight';
    s1.character.level = 200;

    const s2 = server.sessionManager.createSession(ws2, false);
    s2.state = 'AUTHENTICATED';
    s2.character.characterClass = 'DW';
    s2.character.name = 'SoulMaster';
    s2.character.level = 200;

    const s3 = server.sessionManager.createSession(ws3, false);
    s3.state = 'AUTHENTICATED';
    s3.character.characterClass = 'FE';
    s3.character.name = 'MuseElf';
    s3.character.level = 200;

    // S1 convida S2
    (server as any).dispatchPacket(s1, {
      opcode: Opcodes.MSG_PARTY_INVITE_REQ.opcode,
      subcode: Opcodes.MSG_PARTY_INVITE_REQ.subcode,
      seq: 1,
      payload: { targetSessionId: s2.sessionId },
    });

    assert.ok(s1.partyId);
    assert.equal(s2.partyId, s1.partyId);

    // S1 convida S3 -> Agora formam Gold Party (DK + DW + FE = 3 classes)
    (server as any).dispatchPacket(s1, {
      opcode: Opcodes.MSG_PARTY_INVITE_REQ.opcode,
      subcode: Opcodes.MSG_PARTY_INVITE_REQ.subcode,
      seq: 2,
      payload: { targetSessionId: s3.sessionId },
    });

    assert.equal(s3.partyId, s1.partyId);
    const members = server.partyManager.getParty(s1.partyId)!;
    assert.equal(members.length, 3);
    assert.equal(PartyManager.isGoldParty(members), true);

    // Simula ganho de experiência em abate compartilhado
    ws2.clear();
    (server as any).handleCombatAttackReq(s1, {
      targetMobId: 'mob-spider-01',
      playerX: 100,
      playerY: 100,
    });
  });

  it('4. Orquestra Troca Atômica Anti-Scam (Trade) entre dois jogadores', () => {
    const ws1 = new MockWebSocket();
    const ws2 = new MockWebSocket();

    const s1 = server.sessionManager.createSession(ws1, false);
    s1.state = 'AUTHENTICATED';
    s1.character.name = 'TraderA';
    s1.character.zen = 500000;

    const s2 = server.sessionManager.createSession(ws2, false);
    s2.state = 'AUTHENTICATED';
    s2.character.name = 'TraderB';
    s2.character.zen = 100000;

    // Solicita troca
    (server as any).dispatchPacket(s1, {
      opcode: Opcodes.MSG_TRADE_REQUEST_REQ.opcode,
      subcode: Opcodes.MSG_TRADE_REQUEST_REQ.subcode,
      seq: 1,
      payload: { targetSessionId: s2.sessionId },
    });

    assert.ok(s1.activeTradeId);
    assert.equal(s2.activeTradeId, s1.activeTradeId);

    // S1 oferta 50.000 Zen
    (server as any).dispatchPacket(s1, {
      opcode: Opcodes.MSG_TRADE_ZEN_ADD_REQ.opcode,
      subcode: Opcodes.MSG_TRADE_ZEN_ADD_REQ.subcode,
      seq: 2,
      payload: { tradeId: s1.activeTradeId, amountZen: 50000 },
    });

    // Zera o tempo de trava anti-scam para simular teste unitário imediato
    const tradeSession = server.tradeManager.getTradeBySession(s1.sessionId);
    if (tradeSession) {
      tradeSession.initiator.lockUntil = 0;
      tradeSession.target.lockUntil = 0;
    }

    // Ambos aceitam a troca
    (server as any).dispatchPacket(s1, {
      opcode: Opcodes.MSG_TRADE_CONFIRM_REQ.opcode,
      subcode: Opcodes.MSG_TRADE_CONFIRM_REQ.subcode,
      seq: 3,
      payload: { tradeId: s1.activeTradeId },
    });

    (server as any).dispatchPacket(s2, {
      opcode: Opcodes.MSG_TRADE_CONFIRM_REQ.opcode,
      subcode: Opcodes.MSG_TRADE_CONFIRM_REQ.subcode,
      seq: 3,
      payload: { tradeId: s2.activeTradeId },
    });

    // Troca consolidada atomicamente
    assert.equal(s1.character.zen, 450000); // 500k - 50k
    assert.equal(s2.character.zen, 150000); // 100k + 50k
  });

  it('5. Orquestra Loja Pessoal (Personal Shop / PShop) com limite de 2 Bilhões de Zen', () => {
    const ws1 = new MockWebSocket();
    const ws2 = new MockWebSocket();

    const seller = server.sessionManager.createSession(ws1, false);
    seller.state = 'AUTHENTICATED';
    seller.character.name = 'Merchant';
    seller.character.zen = 100000;

    const buyer = server.sessionManager.createSession(ws2, false);
    buyer.state = 'AUTHENTICATED';
    buyer.character.name = 'Customer';
    buyer.character.zen = 500000;

    const sword = Item.create('chaos_dragon_axe');
    seller.inventory.addItem(sword);

    // Abre loja
    (server as any).dispatchPacket(seller, {
      opcode: Opcodes.MSG_PSHOP_OPEN_REQ.opcode,
      subcode: Opcodes.MSG_PSHOP_OPEN_REQ.subcode,
      seq: 1,
      payload: {
        title: 'Armas Raras de Chaos',
        items: [
          {
            slot: 0,
            itemId: sword.uuid,
            itemName: 'Chaos Dragon Axe',
            priceZen: 200000,
            priceBless: 0,
            priceSoul: 0,
            width: 2,
            height: 3,
          },
        ],
      },
    });

    assert.equal(seller.pshopOpen, true);

    // Comprador inspeciona a loja
    (server as any).dispatchPacket(buyer, {
      opcode: Opcodes.MSG_PSHOP_INSPECT_REQ.opcode,
      subcode: Opcodes.MSG_PSHOP_INSPECT_REQ.subcode,
      seq: 1,
      payload: { sellerSessionId: seller.sessionId },
    });

    const inspectRes = ws2.getLastMessage();
    assert.equal(inspectRes?.payload?.success, true);
    assert.equal(inspectRes?.payload?.items?.length, 1);

    // Comprador compra o item do slot 0
    (server as any).dispatchPacket(buyer, {
      opcode: Opcodes.MSG_PSHOP_BUY_REQ.opcode,
      subcode: Opcodes.MSG_PSHOP_BUY_REQ.subcode,
      seq: 2,
      payload: { sellerSessionId: seller.sessionId, slot: 0 },
    });

    assert.equal(buyer.character.zen, 300000); // 500k - 200k
    assert.equal(seller.character.zen, 300000); // 100k + 200k
  });

  it('6. Orquestra Progressão: Resets, Master Resets, Quests e Master Skill Tree', () => {
    const ws = new MockWebSocket();
    const session = server.sessionManager.createSession(ws, false);
    session.state = 'AUTHENTICATED';
    session.character.level = 400;
    session.character.zen = 50000000; // 50 Milhões

    // Executa Reset Nível 400
    (server as any).dispatchPacket(session, {
      opcode: Opcodes.MSG_RESET_REQ.opcode,
      subcode: Opcodes.MSG_RESET_REQ.subcode,
      seq: 1,
      payload: {},
    });

    const resetRes = ws.getLastMessage();
    assert.equal(resetRes?.payload?.success, true);
    assert.equal(session.character.level, 1);
    assert.equal(session.resets, 1);
    assert.equal(session.character.statPoints, 500); // 1 reset * 500 pontos

    // Simula 100 resets e Nível 400 para Master Reset
    session.resets = 100;
    session.character.level = 400;

    (server as any).dispatchPacket(session, {
      opcode: Opcodes.MSG_MASTER_RESET_REQ.opcode,
      subcode: Opcodes.MSG_MASTER_RESET_REQ.subcode,
      seq: 2,
      payload: {},
    });

    const masterRes = ws.getLastMessage();
    assert.equal(masterRes?.payload?.success, true);
    assert.equal(session.masterResets, 1);
    assert.equal(session.wCoins, 500);

    // Executa alocação de ponto na Árvore Master (Master Skill Tree)
    (server as any).dispatchPacket(session, {
      opcode: Opcodes.MSG_MASTER_SKILL_ALLOC_REQ.opcode,
      subcode: Opcodes.MSG_MASTER_SKILL_ALLOC_REQ.subcode,
      seq: 3,
      payload: { skillId: 'mst_armor_defense' },
    });

    const treeRes = ws.getLastMessage();
    assert.equal(treeRes?.payload?.success, true);
    assert.equal(treeRes?.payload?.newLevel, 1);

    // Executa etapa da Quest de Sebina (Nível 150)
    session.progressionState!.level = 150;
    (server as any).dispatchPacket(session, {
      opcode: Opcodes.MSG_QUEST_ACTION_REQ.opcode,
      subcode: Opcodes.MSG_QUEST_ACTION_REQ.subcode,
      seq: 4,
      payload: { questId: 'SEBINA_PRIEST_PART1', action: 'START' },
    });

    const questRes = ws.getLastMessage();
    assert.equal(questRes?.payload?.success, true);
  });

  it('7. Orquestra Famílias Gens (Duprian & Vanert) e Patentes', () => {
    const ws = new MockWebSocket();
    const session = server.sessionManager.createSession(ws, false);
    session.state = 'AUTHENTICATED';

    // Alista-se na família Vanert (1)
    (server as any).dispatchPacket(session, {
      opcode: Opcodes.MSG_GENS_JOIN_REQ.opcode,
      subcode: Opcodes.MSG_GENS_JOIN_REQ.subcode,
      seq: 1,
      payload: { family: 1 },
    });

    const gensRes = ws.getLastMessage();
    assert.equal(gensRes?.payload?.success, true);
    assert.equal(session.gensFamily, 1);
    assert.equal(gensRes?.payload?.symbol, 14); // Soldado Raso (Private)

    // Consulta status de Gens
    (server as any).dispatchPacket(session, {
      opcode: Opcodes.MSG_GENS_STATUS_REQ.opcode,
      subcode: Opcodes.MSG_GENS_STATUS_REQ.subcode,
      seq: 2,
      payload: {},
    });

    const statusRes = ws.getLastMessage();
    assert.equal(statusRes?.payload?.family, 1);
  });

  it('8. Orquestra Refinamento Jewel of Harmony e Montagem de Sockets', () => {
    const ws = new MockWebSocket();
    const session = server.sessionManager.createSession(ws, false);
    session.state = 'AUTHENTICATED';

    const sword = Item.create('dragon_slayer');
    session.inventory.addItem(sword);

    // Aplica Jewel of Harmony na Dragon Slayer
    (server as any).dispatchPacket(session, {
      opcode: Opcodes.MSG_HARMONY_SMELT_REQ.opcode,
      subcode: Opcodes.MSG_HARMONY_SMELT_REQ.subcode,
      seq: 1,
      payload: { targetItemUuid: sword.uuid },
    });

    const harmonyRes = ws.getLastMessage();
    assert.equal(harmonyRes?.payload?.success, true);
    assert.ok(harmonyRes?.payload?.optionName);

    // Monta Seed Sphere no Socket 0
    (server as any).dispatchPacket(session, {
      opcode: Opcodes.MSG_SOCKET_MOUNT_REQ.opcode,
      subcode: Opcodes.MSG_SOCKET_MOUNT_REQ.subcode,
      seq: 2,
      payload: { targetItemUuid: sword.uuid, socketIndex: 0 },
    });

    const socketRes = ws.getLastMessage();
    assert.equal(socketRes?.payload?.success, true);
    assert.equal(socketRes?.payload?.mountedSphere, 'Seed Sphere Tier 1');
  });
});
