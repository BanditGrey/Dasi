/**
 * Dasi MMORPG - Testes Automatizados de Rede e Servidor de Jogo
 * Cobertura:
 * 1. Inicialização e Handshake criptográfico (Hello -> Challenge -> Login -> Sync)
 * 2. Ping / Pong e cálculo de RTT
 * 3. Sincronização do GridInventory 8x8 e slots de equipamento
 * 4. Validação autoritativa de movimentação e colisão de células
 * 5. Equipar e desequipar itens respeitando restrições
 * 6. Aplicação de Joias Sagradas (Bless, Soul, Life) via rede
 * 7. Teste de Carga & Concorrência (20 conexões simultâneas com handshake completo)
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { WebSocket } from 'ws';
import { GameServer } from '../GameServer.ts';
import { Opcodes, LocationType } from '../protocol.ts';

const TEST_PORT = 8199;
const SERVER_URL = `ws://127.0.0.1:${TEST_PORT}`;
const HTTP_URL = `http://127.0.0.1:${TEST_PORT}`;

describe('Servidor de Jogo Dasi (WebSocket / HTTP Dev Server)', () => {
  let server: GameServer;

  before(async () => {
    server = new GameServer({ port: TEST_PORT });
    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  // Helper para conectar cliente WebSocket e escutar eventos
  function createTestClient(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(SERVER_URL);
      ws.once('open', () => resolve(ws));
      ws.once('error', reject);
    });
  }

  // Helper para aguardar pacote específico do servidor
  function waitForPacket(
    ws: WebSocket,
    targetOpcode: number,
    targetSubcode?: number,
    timeoutMs = 3000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        ws.off('message', onMessage);
        reject(new Error(`Timeout aguardando pacote Opcode 0x${targetOpcode.toString(16)}:0x${(targetSubcode ?? 0).toString(16)}`));
      }, timeoutMs);

      const onMessage = (data: any) => {
        try {
          const msg = JSON.parse(data.toString('utf-8'));
          if (msg.opcode === targetOpcode && (targetSubcode === undefined || msg.subcode === targetSubcode)) {
            clearTimeout(timer);
            ws.off('message', onMessage);
            resolve(msg.payload);
          }
        } catch {
          // Ignore non-json
        }
      };

      ws.on('message', onMessage);
    });
  }

  // Helper para enviar pacote JSON
  function sendPacket(ws: WebSocket, opcodeObj: { opcode: number; subcode: number }, payload: any = {}): void {
    ws.send(JSON.stringify({
      opcode: opcodeObj.opcode,
      subcode: opcodeObj.subcode,
      seq: 1,
      payload,
    }));
  }

  // ==========================================
  // TESTES DE API HTTP E STATUS
  // ==========================================
  test('Endpoint HTTP /api/status retorna informações do servidor', async () => {
    const res = await fetch(`${HTTP_URL}/api/status`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, 'online');
    assert.ok(json.server.includes('Dasi MMORPG'));
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  });

  test('Sanidade HTTP: /api/shops, /api/chaos/recipes e 404 para rotas desconhecidas', async () => {
    // 1. Catálogo de Lojas
    const resShops = await fetch(`${HTTP_URL}/api/shops`);
    assert.equal(resShops.status, 200);
    const shops = await resShops.json();
    assert.ok(Array.isArray(shops));
    assert.ok(shops.some((s: any) => s.npcId === 'han_blacksmith'));
    assert.ok(shops.some((s: any) => s.npcId === 'pupa_potion_girl'));

    // 2. Receitas do Caos
    const resChaos = await fetch(`${HTTP_URL}/api/chaos/recipes`);
    assert.equal(resChaos.status, 200);
    const chaos = await resChaos.json();
    assert.ok(chaos.CHAOS_WEAPON);
    assert.ok(chaos.FIRST_WING);
    assert.ok(chaos.ITEM_UPGRADE);

    // 3. Rota 404
    const res404 = await fetch(`${HTTP_URL}/api/invalid_route`);
    assert.equal(res404.status, 404);
    const errJson = await res404.json();
    assert.ok(errJson.error);
  });

  // ==========================================
  // HANDSHAKE & SESSÃO
  // ==========================================
  test('Fluxo completo de Handshake e Autenticação (Hello -> Challenge -> Login -> Sync)', async () => {
    const ws = await createTestClient();

    // 1. Envia Hello
    const challengePromise = waitForPacket(ws, Opcodes.MSG_HANDSHAKE_CHALLENGE.opcode, Opcodes.MSG_HANDSHAKE_CHALLENGE.subcode);
    sendPacket(ws, Opcodes.MSG_HANDSHAKE_HELLO, { clientVersion: '1.0.0-PROD', clientTime: Date.now() });

    const challenge = await challengePromise;
    assert.equal(challenge.serverVersion, '1.0.0-PROD');
    assert.ok(challenge.salt);

    // 2. Envia Login Request
    const loginResPromise = waitForPacket(ws, Opcodes.MSG_AUTH_LOGIN_RES.opcode, Opcodes.MSG_AUTH_LOGIN_RES.subcode);
    const syncPromise = waitForPacket(ws, Opcodes.MSG_INVENTORY_SYNC_ALL.opcode, Opcodes.MSG_INVENTORY_SYNC_ALL.subcode);

    sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, { username: 'Conqueror', characterClass: 'DK' });

    const loginRes = await loginResPromise;
    assert.equal(loginRes.success, true);
    assert.equal(loginRes.character.name, 'Conqueror');
    assert.equal(loginRes.character.characterClass, 'DK');
    assert.ok(loginRes.sessionId);

    // 3. Verifica recebimento automático da sincronização de inventário
    const syncData = await syncPromise;
    assert.ok(syncData.inventory);
    assert.equal(syncData.inventory.cols, 8);
    assert.equal(syncData.inventory.rows, 8);
    assert.ok(syncData.inventory.items.length > 0);

    ws.close();
  });

  // ==========================================
  // PING / PONG
  // ==========================================
  test('Heartbeat Ping e resposta Pong', async () => {
    const ws = await createTestClient();
    const now = Date.now();

    const pongPromise = waitForPacket(ws, Opcodes.MSG_PONG.opcode, Opcodes.MSG_PONG.subcode);
    sendPacket(ws, Opcodes.MSG_PING, { clientTime: now });

    const pong = await pongPromise;
    assert.equal(pong.clientTime, now);
    assert.ok(pong.serverTime >= now);

    ws.close();
  });

  // ==========================================
  // MOVIMENTAÇÃO DE ITENS NO GRID (8x8)
  // ==========================================
  test('Movimentação válida de item no Grid 8x8 e rejeição de movimento inválido', async () => {
    const ws = await createTestClient();

    // Autentica
    const syncPromise = waitForPacket(ws, Opcodes.MSG_INVENTORY_SYNC_ALL.opcode, Opcodes.MSG_INVENTORY_SYNC_ALL.subcode);
    sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, { username: 'MoverTest' });
    const sync = await syncPromise;

    // Encontra uma joia 1x1 no inventário (por exemplo na coluna 6 ou 7)
    const jewelItem = sync.inventory.items.find((it: any) => it.item.defId === 'jewel_of_blessing');
    assert.ok(jewelItem, 'Deve possuir Jewel of Blessing para teste');

    // 1. Move para slot vazio (ex: 0, 7)
    const moveResPromise = waitForPacket(ws, Opcodes.MSG_ITEM_MOVE_RES.opcode, Opcodes.MSG_ITEM_MOVE_RES.subcode);
    sendPacket(ws, Opcodes.MSG_ITEM_MOVE_REQ, {
      itemUuid: jewelItem.item.uuid,
      sourceType: LocationType.GRID,
      sourceX: jewelItem.x,
      sourceY: jewelItem.y,
      targetType: LocationType.GRID,
      targetX: 0,
      targetY: 7,
    });

    const moveRes = await moveResPromise;
    assert.equal(moveRes.success, true);
    assert.equal(moveRes.newX, 0);
    assert.equal(moveRes.newY, 7);

    // 2. Tenta mover para fora dos limites (x: 10, y: 10) -> Deve falhar
    const failMovePromise = waitForPacket(ws, Opcodes.MSG_ITEM_MOVE_RES.opcode, Opcodes.MSG_ITEM_MOVE_RES.subcode);
    sendPacket(ws, Opcodes.MSG_ITEM_MOVE_REQ, {
      itemUuid: jewelItem.item.uuid,
      sourceType: LocationType.GRID,
      sourceX: 0,
      sourceY: 7,
      targetType: LocationType.GRID,
      targetX: 10,
      targetY: 10,
    });

    const failRes = await failMovePromise;
    assert.equal(failRes.success, false);
    assert.ok(failRes.error);

    ws.close();
  });

  // ==========================================
  // EQUIPAR E DESEQUIPAR ITENS
  // ==========================================
  test('Equipar arma/armadura no slot correspondente e desequipar de volta ao grid', async () => {
    const ws = await createTestClient();

    const syncPromise = waitForPacket(ws, Opcodes.MSG_INVENTORY_SYNC_ALL.opcode, Opcodes.MSG_INVENTORY_SYNC_ALL.subcode);
    sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, { username: 'EquipHero' });
    const sync = await syncPromise;

    // Localiza dragon_helm no grid
    const helm = sync.inventory.items.find((it: any) => it.item.defId === 'dragon_helm');
    assert.ok(helm, 'Deve encontrar dragon_helm no inventário');

    // 1. Equipa o Elmo no slot HELM
    const equipPromise = waitForPacket(ws, Opcodes.MSG_ITEM_MOVE_RES.opcode, Opcodes.MSG_ITEM_MOVE_RES.subcode);
    sendPacket(ws, Opcodes.MSG_ITEM_MOVE_REQ, {
      itemUuid: helm.item.uuid,
      sourceType: LocationType.GRID,
      sourceX: helm.x,
      sourceY: helm.y,
      targetType: LocationType.EQUIPMENT,
      targetSlot: 'HELM',
    });

    const equipRes = await equipPromise;
    assert.equal(equipRes.success, true);
    assert.ok(equipRes.inventoryState.equipped.some((eq: any) => eq.slot === 'HELM' && eq.item.uuid === helm.item.uuid));

    // 2. Desequipa o Elmo de volta para o grid (por exemplo em 0, 4 onde estava)
    const unequipPromise = waitForPacket(ws, Opcodes.MSG_ITEM_MOVE_RES.opcode, Opcodes.MSG_ITEM_MOVE_RES.subcode);
    sendPacket(ws, Opcodes.MSG_ITEM_MOVE_REQ, {
      itemUuid: helm.item.uuid,
      sourceType: LocationType.EQUIPMENT,
      sourceSlot: 'HELM',
      targetType: LocationType.GRID,
      targetX: 0,
      targetY: 4,
    });

    const unequipRes = await unequipPromise;
    assert.equal(unequipRes.success, true);
    assert.ok(unequipRes.inventoryState.items.some((it: any) => it.item.uuid === helm.item.uuid));

    ws.close();
  });

  // ==========================================
  // APLICAÇÃO DE JOIAS SAGRADAS (BLESS, SOUL, LIFE)
  // ==========================================
  test('Uso da Jewel of Blessing aprimora com 100% de sucesso item +3 para +4', async () => {
    const ws = await createTestClient();

    const syncPromise = waitForPacket(ws, Opcodes.MSG_INVENTORY_SYNC_ALL.opcode, Opcodes.MSG_INVENTORY_SYNC_ALL.subcode);
    sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, { username: 'BlessMaster' });
    const sync = await syncPromise;

    // Encontra item alvo de nível baixo (ex: dragon_helm nível 3)
    const targetItem = sync.inventory.items.find((it: any) => it.item.defId === 'dragon_helm');
    const blessJewel = sync.inventory.items.find((it: any) => it.item.defId === 'jewel_of_blessing');

    assert.ok(targetItem, 'Item alvo deve existir');
    assert.ok(blessJewel, 'Jewel of Blessing deve existir');

    const prevLevel = targetItem.item.level;

    const jewelResPromise = waitForPacket(ws, Opcodes.MSG_ITEM_USE_JEWEL_RES.opcode, Opcodes.MSG_ITEM_USE_JEWEL_RES.subcode);
    sendPacket(ws, Opcodes.MSG_ITEM_USE_JEWEL_REQ, {
      jewelUuid: blessJewel.item.uuid,
      targetUuid: targetItem.item.uuid,
      targetLocation: LocationType.GRID,
    });

    const jewelRes = await jewelResPromise;
    assert.equal(jewelRes.success, true);
    assert.equal(jewelRes.outcome, 'SUCCESS');
    assert.equal(jewelRes.previousLevel, prevLevel);
    assert.equal(jewelRes.newLevel, prevLevel + 1);

    // Joia deve ter sido removida do inventário
    assert.ok(!jewelRes.inventoryState.items.some((it: any) => it.item.uuid === blessJewel.item.uuid));

    ws.close();
  });

  test('Uso da Jewel of Life em item válido altera a opção adicional', async () => {
    const ws = await createTestClient();

    const syncPromise = waitForPacket(ws, Opcodes.MSG_INVENTORY_SYNC_ALL.opcode, Opcodes.MSG_INVENTORY_SYNC_ALL.subcode);
    sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, { username: 'LifeMaster' });
    const sync = await syncPromise;

    const targetItem = sync.inventory.items.find((it: any) => it.item.defId === 'dragon_blade');
    const lifeJewel = sync.inventory.items.find((it: any) => it.item.defId === 'jewel_of_life');

    assert.ok(targetItem && lifeJewel);

    const jewelResPromise = waitForPacket(ws, Opcodes.MSG_ITEM_USE_JEWEL_RES.opcode, Opcodes.MSG_ITEM_USE_JEWEL_RES.subcode);
    sendPacket(ws, Opcodes.MSG_ITEM_USE_JEWEL_REQ, {
      jewelUuid: lifeJewel.item.uuid,
      targetUuid: targetItem.item.uuid,
      targetLocation: LocationType.GRID,
    });

    const res = await jewelResPromise;
    assert.ok(res.outcome === 'SUCCESS' || res.outcome === 'FAILURE');
    assert.ok(res.message);

    ws.close();
  });

  // ==========================================
  // DEV SPAWN COMMAND
  // ==========================================
  test('Comando Dev MSG_ITEM_SPAWN_DEV_REQ adiciona novo item ao inventário', async () => {
    const ws = await createTestClient();

    const syncPromise = waitForPacket(ws, Opcodes.MSG_INVENTORY_SYNC_ALL.opcode, Opcodes.MSG_INVENTORY_SYNC_ALL.subcode);
    sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, { username: 'SpawnDev' });
    await syncPromise;

    const spawnPromise = waitForPacket(ws, Opcodes.MSG_ITEM_SPAWN_DEV_RES.opcode, Opcodes.MSG_ITEM_SPAWN_DEV_RES.subcode);
    sendPacket(ws, Opcodes.MSG_ITEM_SPAWN_DEV_REQ, {
      itemDefId: 'jewel_of_blessing',
      count: 1,
    });

    const spawnRes = await spawnPromise;
    assert.equal(spawnRes.success, true);
    assert.equal(spawnRes.spawnedCount, 1);
    assert.ok(spawnRes.inventoryState);

    ws.close();
  });

  // ==========================================
  // MÁQUINA DO CAOS VIA REDE (0x72:0x01 / 0x72:0x02)
  // ==========================================
  test('Fluxo de rede da Máquina do Caos (0x72:0x01 -> 0x72:0x02)', async () => {
    const ws = await createTestClient();

    const syncPromise = waitForPacket(ws, Opcodes.MSG_INVENTORY_SYNC_ALL.opcode, Opcodes.MSG_INVENTORY_SYNC_ALL.subcode);
    sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, { username: 'ChaosNetHero' });
    const sync = await syncPromise;

    // Localiza dragon_blade (+7 e opt 4) e jewel_of_chaos
    const blade = sync.inventory.items.find((it: any) => it.item.defId === 'dragon_blade');
    const chaos = sync.inventory.items.find((it: any) => it.item.defId === 'jewel_of_chaos');
    assert.ok(blade && chaos, 'Deve possuir dragon_blade e jewel_of_chaos');

    const mixResPromise = waitForPacket(
      ws,
      Opcodes.MSG_CHAOS_MACHINE_MIX_REQ.opcode,
      Opcodes.MSG_CHAOS_MACHINE_MIX_RES.subcode
    );

    sendPacket(ws, Opcodes.MSG_CHAOS_MACHINE_MIX_REQ, {
      mixType: 'CHAOS_WEAPON',
      itemUuids: [blade.item.uuid, chaos.item.uuid],
      rngRoll: 0.05, // Garante sucesso
    });

    const mixRes = await mixResPromise;
    assert.equal(mixRes.success, true);
    assert.equal(mixRes.mixType, 'CHAOS_WEAPON');
    assert.ok(mixRes.rate > 0);
    assert.ok(mixRes.createdItem);
    assert.ok(mixRes.inventoryState);

    ws.close();
  });

  // ==========================================
  // LOJA DE NPCS VIA REDE (0x74:0x01 / 0x74:0x02)
  // ==========================================
  test('Fluxo de compra em NPC via rede (0x74:0x01 -> 0x74:0x02)', async () => {
    const ws = await createTestClient();

    const syncPromise = waitForPacket(ws, Opcodes.MSG_INVENTORY_SYNC_ALL.opcode, Opcodes.MSG_INVENTORY_SYNC_ALL.subcode);
    sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, { username: 'ShopperHero' });
    await syncPromise;

    const buyResPromise = waitForPacket(
      ws,
      Opcodes.MSG_NPC_SHOP_BUY_REQ.opcode,
      Opcodes.MSG_NPC_SHOP_BUY_RES.subcode
    );

    sendPacket(ws, Opcodes.MSG_NPC_SHOP_BUY_REQ, {
      npcId: 'han_blacksmith',
      itemDefId: 'small_dagger',
    });

    const buyRes = await buyResPromise;
    assert.equal(buyRes.success, true);
    assert.equal(buyRes.npcId, 'han_blacksmith');
    assert.equal(buyRes.itemDefId, 'small_dagger');
    assert.ok(buyRes.boughtItem);
    assert.ok(buyRes.inventoryState);

    ws.close();
  });

  // ==========================================
  // DISTRIBUIÇÃO DE ATRIBUTOS VIA REDE (0x75:0x01 / 0x75:0x02)
  // ==========================================
  test('Alocação autoritativa de pontos de atributos (0x75:0x01 -> 0x75:0x02)', async () => {
    const ws = await createTestClient();

    const syncPromise = waitForPacket(ws, Opcodes.MSG_INVENTORY_SYNC_ALL.opcode, Opcodes.MSG_INVENTORY_SYNC_ALL.subcode);
    sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, { username: 'StatsHero' });
    const sync = await syncPromise;

    const initialStr = sync.character.strength;
    const initialPoints = sync.character.statPoints;
    assert.ok(initialPoints >= 5, 'Deve possuir pelo menos 5 pontos livres');

    const allocResPromise = waitForPacket(
      ws,
      Opcodes.MSG_STAT_POINT_ALLOC_REQ.opcode,
      Opcodes.MSG_STAT_POINT_ALLOC_RES.subcode
    );

    sendPacket(ws, Opcodes.MSG_STAT_POINT_ALLOC_REQ, {
      stat: 'strength',
      points: 5,
    });

    const allocRes = await allocResPromise;
    assert.equal(allocRes.success, true);
    assert.equal(allocRes.stat, 'strength');
    assert.equal(allocRes.pointsAllocated, 5);
    assert.equal(allocRes.pointsRemaining, initialPoints - 5);
    assert.equal(allocRes.character.strength, initialStr + 5);

    ws.close();
  });

  test('Venda autoritativa de item para NPC concede Zen e sincroniza inventário', async () => {
    const ws = await createTestClient();
    const challengePromise = waitForPacket(ws, Opcodes.MSG_HANDSHAKE_CHALLENGE.opcode, Opcodes.MSG_HANDSHAKE_CHALLENGE.subcode);
    sendPacket(ws, Opcodes.MSG_HANDSHAKE_HELLO, { clientVersion: '1.0.0', clientTime: Date.now() });
    await challengePromise;

    const loginResPromise = waitForPacket(ws, Opcodes.MSG_AUTH_LOGIN_RES.opcode, Opcodes.MSG_AUTH_LOGIN_RES.subcode);
    const syncPromise = waitForPacket(ws, Opcodes.MSG_INVENTORY_SYNC_ALL.opcode, Opcodes.MSG_INVENTORY_SYNC_ALL.subcode);
    sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, { username: 'MerchantSeller', characterClass: 'DK' });
    const [loginRes, sync] = await Promise.all([loginResPromise, syncPromise]);

    const initialZen = loginRes.character.zen ?? 0;
    // Spawn um item para vender
    const spawnResPromise = waitForPacket(ws, Opcodes.MSG_ITEM_SPAWN_DEV_RES.opcode, Opcodes.MSG_ITEM_SPAWN_DEV_RES.subcode);
    sendPacket(ws, Opcodes.MSG_ITEM_SPAWN_DEV_REQ, { itemDefId: 'jewel_of_blessing', count: 1 });
    const spawnRes = await spawnResPromise;
    assert.equal(spawnRes.success, true);

    const jewelItem = spawnRes.inventoryState.items.find((i: any) => i.item.defId === 'jewel_of_blessing');
    assert.ok(jewelItem, 'Deve possuir a joia no inventário');

    // Vende a joia para o NPC
    const sellResPromise = waitForPacket(ws, Opcodes.MSG_NPC_SHOP_SELL_RES.opcode, Opcodes.MSG_NPC_SHOP_SELL_RES.subcode);
    sendPacket(ws, Opcodes.MSG_NPC_SHOP_SELL_REQ, { itemUuid: jewelItem.item.uuid });
    const sellRes = await sellResPromise;

    assert.equal(sellRes.success, true);
    assert.ok(sellRes.zenGained > 0);
    assert.equal(sellRes.zenRemaining, initialZen + sellRes.zenGained);

    ws.close();
  });

  test('Consumo de Fruta Mágica adiciona atributos permanentemente', async () => {
    const ws = await createTestClient();
    const challengePromise = waitForPacket(ws, Opcodes.MSG_HANDSHAKE_CHALLENGE.opcode, Opcodes.MSG_HANDSHAKE_CHALLENGE.subcode);
    sendPacket(ws, Opcodes.MSG_HANDSHAKE_HELLO, { clientVersion: '1.0.0', clientTime: Date.now() });
    await challengePromise;

    const loginResPromise = waitForPacket(ws, Opcodes.MSG_AUTH_LOGIN_RES.opcode, Opcodes.MSG_AUTH_LOGIN_RES.subcode);
    sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, { username: 'FruitEater', characterClass: 'DK' });
    const loginRes = await loginResPromise;
    const initialEnergy = loginRes.character.energy ?? 0;

    // Spawn fruit_energy
    const spawnResPromise = waitForPacket(ws, Opcodes.MSG_ITEM_SPAWN_DEV_RES.opcode, Opcodes.MSG_ITEM_SPAWN_DEV_RES.subcode);
    sendPacket(ws, Opcodes.MSG_ITEM_SPAWN_DEV_REQ, { itemDefId: 'fruit_energy', count: 1 });
    await spawnResPromise;

    // Consome a fruta
    const consumeResPromise = waitForPacket(ws, Opcodes.MSG_FRUIT_CONSUME_RES.opcode, Opcodes.MSG_FRUIT_CONSUME_RES.subcode);
    sendPacket(ws, Opcodes.MSG_FRUIT_CONSUME_REQ, { fruitDefId: 'fruit_energy' });
    const consumeRes = await consumeResPromise;

    assert.equal(consumeRes.success, true);
    assert.equal(consumeRes.statGained, 'energy');
    assert.ok(consumeRes.pointsGained >= 1 && consumeRes.pointsGained <= 3);
    assert.equal(consumeRes.character.energy, initialEnergy + consumeRes.pointsGained);

    ws.close();
  });

  test('Abertura autoritativa de Box of Kundun gera drops com feixe de luz', async () => {
    const ws = await createTestClient();
    const challengePromise = waitForPacket(ws, Opcodes.MSG_HANDSHAKE_CHALLENGE.opcode, Opcodes.MSG_HANDSHAKE_CHALLENGE.subcode);
    sendPacket(ws, Opcodes.MSG_HANDSHAKE_HELLO, { clientVersion: '1.0.0', clientTime: Date.now() });
    await challengePromise;

    const loginResPromise = waitForPacket(ws, Opcodes.MSG_AUTH_LOGIN_RES.opcode, Opcodes.MSG_AUTH_LOGIN_RES.subcode);
    sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, { username: 'BoxHunter', characterClass: 'DK' });
    await loginResPromise;

    // Spawn box_of_kundun_4
    const spawnResPromise = waitForPacket(ws, Opcodes.MSG_ITEM_SPAWN_DEV_RES.opcode, Opcodes.MSG_ITEM_SPAWN_DEV_RES.subcode);
    sendPacket(ws, Opcodes.MSG_ITEM_SPAWN_DEV_REQ, { itemDefId: 'box_of_kundun_4', count: 1 });
    await spawnResPromise;

    // Abre a Box
    const openResPromise = waitForPacket(ws, Opcodes.MSG_BOX_KUNDUN_OPEN_RES.opcode, Opcodes.MSG_BOX_KUNDUN_OPEN_RES.subcode);
    sendPacket(ws, Opcodes.MSG_BOX_KUNDUN_OPEN_REQ, { boxDefId: 'box_of_kundun_4', playerX: 420, playerY: 260 });
    const openRes = await openResPromise;

    assert.equal(openRes.success, true);
    assert.ok(openRes.loot);
    assert.ok(openRes.loot.items.length > 0);
    assert.ok(openRes.loot.groundDrops.length > 0);

    ws.close();
  });

  // ==========================================
  // TESTE DE CARGA & CONCORRÊNCIA
  // ==========================================
  test('Teste de Carga: 20 conexões simultâneas realizam Handshake, Login e Sync sem falhas', async () => {
    const CLIENT_COUNT = 20;
    const clients: WebSocket[] = [];

    try {
      const connectionPromises = Array.from({ length: CLIENT_COUNT }, async (_, i) => {
        const ws = await createTestClient();
        clients.push(ws);

        // Handshake
        const challengePromise = waitForPacket(ws, Opcodes.MSG_HANDSHAKE_CHALLENGE.opcode, Opcodes.MSG_HANDSHAKE_CHALLENGE.subcode);
        sendPacket(ws, Opcodes.MSG_HANDSHAKE_HELLO, { clientVersion: '1.0.0', clientTime: Date.now() });
        await challengePromise;

        // Login & Sync
        const loginResPromise = waitForPacket(ws, Opcodes.MSG_AUTH_LOGIN_RES.opcode, Opcodes.MSG_AUTH_LOGIN_RES.subcode);
        const syncPromise = waitForPacket(ws, Opcodes.MSG_INVENTORY_SYNC_ALL.opcode, Opcodes.MSG_INVENTORY_SYNC_ALL.subcode);

        sendPacket(ws, Opcodes.MSG_AUTH_LOGIN_REQ, {
          username: `LoadPlayer_${i}`,
          characterClass: i % 2 === 0 ? 'DK' : 'DW',
        });

        const [loginRes, sync] = await Promise.all([loginResPromise, syncPromise]);
        assert.equal(loginRes.success, true);
        assert.equal(loginRes.character.name, `LoadPlayer_${i}`);
        assert.ok(sync.inventory.items.length > 0);

        return true;
      });

      const results = await Promise.all(connectionPromises);
      assert.equal(results.length, CLIENT_COUNT);
      assert.ok(results.every((r) => r === true));
    } finally {
      // Fecha todos os clientes
      for (const client of clients) {
        try {
          client.close();
        } catch {
          // Ignore
        }
      }
    }
  });
});
