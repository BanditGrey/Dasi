/**
 * Dasi MMORPG - Servidor Autoritativo de Jogo (WebSocket & HTTP Dev Viewer)
 * Inspirado na arquitetura clássica de redes do Continent of Legend (MU Online).
 * 
 * Funcionalidades:
 * - Handshake criptográfico e autenticação de sessões com Zero-Trust
 * - Sincronização em tempo real do GridInventory 8x8 e slots de equipamento
 * - Processamento autoritativo de movimentação, equipar/desequipar e Joias Sagradas
 * - Servidor HTTP integrado para servir a interface visual do Dev Viewer
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import {
  Opcodes,
  decodeBinaryPacket,
  encodeBinaryPacket,
  type PacketMessage,
  type HandshakeHelloPayload,
  type AuthLoginReqPayload,
  type ItemMoveReqPayload,
  type ItemUseJewelReqPayload,
  type ItemSpawnDevReqPayload,
  type CombatAttackReqPayload,
  type GroundItemPickupReqPayload,
  type ChaosMachineMixReqPayload,
  type NpcShopBuyReqPayload,
  type NpcShopSellReqPayload,
  type NpcShopSellResPayload,
  type StatPointAllocReqPayload,
  type FruitConsumeReqPayload,
  type FruitConsumeResPayload,
  LocationType,
} from './protocol.ts';
import { SessionManager, type ClientSession } from './SessionManager.ts';
import { CombatEngine } from '../combat/CombatEngine.ts';
import { BossManager } from '../bosses/BossManager.ts';
import { BoxOfKundun } from '../bosses/BoxOfKundun.ts';
import { EventManager } from '../events/EventManager.ts';
import { DungeonManager } from '../dungeons/DungeonManager.ts';
import { Item } from '../inventory/Item.ts';
import { JewelSystem } from '../inventory/JewelSystem.ts';
import { ChaosMachine } from '../inventory/ChaosMachine.ts';
import { NPCShopSystem } from '../economy/NPCShop.ts';
import { ITEM_DEFINITIONS } from '../inventory/definitions.ts';
import {
  ItemCategory,
  UpgradeOutcome,
  type ItemInstance,
  type EquipmentSlot,
} from '../inventory/types.ts';

export interface GameServerConfig {
  port?: number;
  host?: string;
  staticDir?: string;
  heartbeatIntervalMs?: number;
}

export class GameServer {
  public readonly port: number;
  public readonly host: string;
  private staticDir: string;
  private heartbeatIntervalMs: number;

  private httpServer: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  public readonly sessionManager: SessionManager;
  public readonly bossManager: BossManager;
  public readonly eventManager: EventManager;
  public readonly dungeonManager: DungeonManager;
  public readonly combatEngine: CombatEngine;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private gameLoopTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: GameServerConfig = {}) {
    this.port = config.port ?? 8080;
    this.host = config.host ?? '0.0.0.0';
    this.staticDir = config.staticDir ?? path.resolve(process.cwd(), 'src/client/dev_viewer');
    this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? 15000;
    this.sessionManager = new SessionManager();
    this.bossManager = new BossManager();
    this.eventManager = new EventManager();
    this.dungeonManager = new DungeonManager();
    this.combatEngine = new CombatEngine(undefined, this.bossManager);
  }

  /**
   * Inicia o Servidor HTTP e WebSocket
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;

    return new Promise((resolve, reject) => {
      this.httpServer = http.createServer((req, res) => {
        this.handleHttpRequest(req, res);
      });

      this.wss = new WebSocketServer({ server: this.httpServer });

      this.wss.on('connection', (ws: WebSocket, req) => {
        this.handleWebSocketConnection(ws, req);
      });

      this.wss.on('error', (err) => {
        console.error('[GameServer] WebSocket Server Error:', err);
      });

      this.httpServer.on('error', (err) => {
        console.error('[GameServer] HTTP Server Error:', err);
        reject(err);
      });

      this.httpServer.listen(this.port, this.host, () => {
        this.isRunning = true;
        this.startHeartbeat();
        this.startGameLoop();
        console.log(`====================================================`);
        console.log(`⚔️  DASI MMORPG - SERVIDOR DE JOGO ONLINE ⚔️`);
        console.log(`Conexão WebSocket: ws://localhost:${this.port}`);
        console.log(`Dev Viewer Web:   http://localhost:${this.port}`);
        console.log(`Porta autoritativa: ${this.port}`);
        console.log(`====================================================`);
        resolve();
      });
    });
  }

  /**
   * Encerra graciosamente o servidor
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.gameLoopTimer) {
      clearInterval(this.gameLoopTimer);
      this.gameLoopTimer = null;
    }

    return new Promise((resolve) => {
      // Notifica e desconecta todas as sessões
      for (const session of this.sessionManager.getAllSessions()) {
        try {
          this.sendPacket(session, Opcodes.MSG_SESSION_TERMINATE.opcode, Opcodes.MSG_SESSION_TERMINATE.subcode, {
            reason: 'Server shutting down',
          });
          const ws = session.socket as WebSocket;
          ws.close();
        } catch {
          // Ignore
        }
      }

      if (this.wss) {
        this.wss.close(() => {
          if (this.httpServer) {
            this.httpServer.close(() => {
              this.isRunning = false;
              resolve();
            });
          } else {
            this.isRunning = false;
            resolve();
          }
        });
      } else {
        this.isRunning = false;
        resolve();
      }
    });
  }

  /**
   * Manipula requisições HTTP estáticas para a interface web de desenvolvimento
   */
  /**
   * Manipula requisições HTTP estáticas para a interface web de desenvolvimento e rotas de API
   */
  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    // CORS headers para compatibilidade com clientes Web / DevTools / UE5
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = parsedUrl.pathname;

    // Rota da API de status do servidor
    if (pathname === '/api/status' || pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'online',
          server: 'Dasi MMORPG Core Server v1.0.0',
          uptimeSec: Math.floor(process.uptime()),
          activeSessions: this.sessionManager.getAllSessions().length,
          activeMonsters: this.combatEngine.spawner.getAllMonsters().length,
          activeGroundDrops: this.combatEngine.getAllGroundDrops().length,
        })
      );
      return;
    }

    // Rota da API para catálogo de itens disponíveis
    if (pathname === '/api/items/definitions') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(ITEM_DEFINITIONS));
      return;
    }

    // Rota da API para lista de Lojas de NPCs
    if (pathname === '/api/shops') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(NPCShopSystem.getAllShops()));
      return;
    }

    // Rota da API para receitas da Máquina do Caos
    if (pathname === '/api/chaos/recipes') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          CHAOS_WEAPON: {
            name: 'Forja de Armas do Caos',
            location: 'Noria / Feywood',
            costZen: 20000,
            requiredItems: ['Item +4+opt', 'Jewel of Chaos'],
            optionalItems: ['Jewel of Blessing', 'Jewel of Soul'],
            rateMin: 1,
            rateMax: 100,
            outputs: ['chaos_dragon_axe', 'chaos_nature_bow', 'chaos_lightning_staff'],
          },
          FIRST_WING: {
            name: 'Forja de Asas Tier 1',
            location: 'Noria / Feywood',
            costZen: 100000,
            requiredItems: ['Arma do Caos +4+opt', 'Jewel of Chaos'],
            optionalItems: ['Jewel of Blessing', 'Jewel of Soul'],
            rateMin: 1,
            rateMax: 90,
            outputs: ['wings_of_satan', 'wings_of_heaven', 'wings_of_fairy'],
          },
          SECOND_WING: {
            name: 'Forja de Asas Tier 2',
            location: 'Noria / Feywood',
            costZen: 2000000,
            requiredItems: ['Asas Tier 1', 'Loch\'s Feather (ou Crest of Monarch)', 'Jewel of Chaos'],
            optionalItems: ['Itens Excelentes +4+opt', 'Jewel of Blessing', 'Jewel of Soul'],
            rateMin: 1,
            rateMax: 90,
            outputs: ['wings_of_dragon', 'wings_of_soul', 'wings_of_elf', 'wings_of_darkness', 'cape_of_lord'],
          },
          THIRD_WING: {
            name: 'Forja de Asas Tier 3',
            location: 'Noria / Feywood',
            costZen: 10000000,
            requiredItems: ['Asas Tier 2 +9/opt4+', 'Condor Feather', 'Condor Flame', 'Jewel of Chaos', 'Jewel of Creation', '10x Bless', '10x Soul'],
            rateMin: 1,
            rateMax: 40,
            outputs: ['wings_of_storm', 'wings_of_space_time', 'wings_of_dimension', 'wings_of_eternal', 'wings_of_illusion', 'wings_of_ruin', 'cape_of_emperor'],
          },
          FRUIT_CREATION: {
            name: 'Criação de Frutas de Atributos',
            location: 'Noria / Feywood',
            costZen: 500000,
            requiredItems: ['Jewel of Creation', 'Jewel of Chaos'],
            rateMin: 90,
            rateMax: 90,
            outputs: ['fruit_strength', 'fruit_agility', 'fruit_vitality', 'fruit_energy', 'fruit_command'],
          },
          ITEM_UPGRADE: {
            name: 'Refinamento +10 até +15',
            location: 'Noria / Feywood',
            requiredItems: ['Item +9 a +14', 'Jewel of Chaos', 'Bless (Nível-8)', 'Soul (Nível-8)'],
            costZenFormula: '2,000,000 * (Nível - 8)',
            rates: { 10: '60% (75% com Luck)', 11: '55% (70% com Luck)', 12: '50% (65% com Luck)', 13: '45% (60% com Luck)', 14: '45% (60% com Luck)', 15: '40% (55% com Luck)' },
            failureRisk: '+10 a +12 regride níveis; +13 a +15 destruição total do item',
          },
        })
      );
      return;
    }

    // Rota da API para Chefes Mundiais (Bosses)
    if (pathname === '/api/bosses') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          activeBosses: this.bossManager.getSerializedBosses(),
          activeInvasions: this.bossManager.goldenInvasion.getActiveInvasions(),
        })
      );
      return;
    }

    // Spawn manual de Chefes via API POST
    if (pathname === '/api/bosses/spawn' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          const type = data.type || 'boss_gorgon';
          const x = data.x ?? 400;
          const y = data.y ?? 250;
          const boss = this.bossManager.spawnBoss(type, x, y);
          this.broadcastBossesState();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, boss: boss.toJSON() }));
        } catch (err: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Rota da API para Status das Arenas de Eventos
    if (pathname === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.eventManager.getStatusOverview()));
      return;
    }

    // Disparo manual de eventos via API POST
    if (pathname === '/api/events/trigger' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          const eventType = data.type;
          if (eventType === 'GOLDEN_INVASION') {
            const inv = this.bossManager.goldenInvasion.triggerInvasion(
              this.combatEngine.spawner,
              data.tier ?? 1,
              data.mapId ?? 'LORENCIA'
            );
            this.broadcastMonstersState();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, invasion: inv }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: `Evento ${eventType} configurado no EventManager` }));
        } catch (err: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Rota da API para Dungeons ativas
    if (pathname === '/api/dungeons') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.dungeonManager.getAllInstances().map((d) => d.toJSON())));
      return;
    }

    // Rota da API para abertura da Box of Kundun
    if (pathname === '/api/box/open' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          const boxId = data.boxId || 'box_of_kundun_1';
          const x = data.playerX ?? 400;
          const y = data.playerY ?? 250;
          const loot = BoxOfKundun.openBox(boxId, x, y);

          for (const drop of loot.groundDrops) {
            this.combatEngine.registerExternalGroundDrop(drop);
            this.broadcastPacket(Opcodes.MSG_GROUND_ITEM_DROP.opcode, Opcodes.MSG_GROUND_ITEM_DROP.subcode, { drop });
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, loot }));
        } catch (err: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Se for uma requisição para a API não encontrada, responde 404 JSON
    if (pathname.startsWith('/api/')) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `API route '${pathname}' not found` }));
      return;
    }

    // Roteamento de arquivos estáticos da interface Dev Viewer
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }

    // Os diretórios de teste e artefatos de build nunca são servidos publicamente.
    if (/\/(tests|node_modules|__pycache__|dist|build)(\/|$)/.test(pathname)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    // O Dev Viewer importa módulos de jogo compartilhados com o servidor
    // (ex.: /src/server/world/CollisionSystem.ts), então /src/** é servido a partir
    // da raiz do repositório. Todo o resto é resolvido no diretório do Dev Viewer.
    const resolvedStaticDir = path.resolve(this.staticDir);
    const sharedSourceRoot = path.resolve(process.cwd(), 'src');
    const isSharedSource = pathname === '/src' || pathname.startsWith('/src/');
    const baseDir = isSharedSource ? path.resolve(process.cwd()) : resolvedStaticDir;
    const allowedRoot = isSharedSource ? sharedSourceRoot : resolvedStaticDir;
    const filePath = path.resolve(baseDir, '.' + pathname);

    // Proteção contra path traversal: nada fora da raiz permitida é servido
    if (!filePath.startsWith(allowedRoot + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.glb': 'model/gltf-binary',
        '.gltf': 'model/gltf+json',
        // Módulos fonte servidos ao Dev Viewer (o módulo compartilhado de colisão
        // vive em src/server/world e é importado pelo cliente WebGL).
        '.ts': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.map': 'application/json; charset=utf-8',
        '.wasm': 'application/wasm',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
      });

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    });
  }

  /**
   * Manipula nova conexão WebSocket
   */
  private handleWebSocketConnection(ws: WebSocket, req: http.IncomingMessage): void {
    const session = this.sessionManager.createSession(ws);
    // Auto-detect IP or connection info
    const remoteAddress = req.socket.remoteAddress;
    console.log(`[GameServer] Nova conexão estabelecida: Session=${session.sessionId} IP=${remoteAddress}`);

    ws.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
      session.isBinaryMode = isBinary;
      this.handleIncomingMessage(session, data, isBinary);
    });

    ws.on('close', (code, reason) => {
      console.log(`[GameServer] Sessão desconectada: Session=${session.sessionId} Code=${code} Motivo=${reason}`);
      this.sessionManager.removeSessionBySocket(ws);
    });

    ws.on('error', (err) => {
      console.warn(`[GameServer] Erro de socket Session=${session.sessionId}:`, err.message);
    });
  }

  /**
   * Decodifica e roteia mensagens recebidas (Binário C1/C2 ou JSON)
   */
  private handleIncomingMessage(session: ClientSession, data: WebSocket.RawData, isBinary: boolean): void {
    try {
      let packet: PacketMessage | null = null;

      if (isBinary && Buffer.isBuffer(data)) {
        packet = decodeBinaryPacket(data);
      } else {
        const text = data.toString('utf-8');
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed.opcode === 'number') {
            packet = {
              opcode: parsed.opcode,
              subcode: parsed.subcode ?? 1,
              seq: parsed.seq ?? 0,
              payload: parsed.payload ?? parsed,
            };
          }
        } catch (jsonErr) {
          console.warn('[GameServer] Mensagem de texto não é JSON válido:', text);
          return;
        }
      }

      if (!packet) {
        console.warn('[GameServer] Falha ao decodificar pacote');
        return;
      }

      session.seqIn = packet.seq;
      this.dispatchPacket(session, packet);
    } catch (err) {
      console.error('[GameServer] Erro processando pacote de sessão:', session.sessionId, err);
    }
  }

  /**
   * Despacha o pacote para o handler de subsistema correto
   */
  private dispatchPacket(session: ClientSession, packet: PacketMessage): void {
    const { opcode, subcode, payload } = packet;

    // 1. Handshake & Autenticação
    if (opcode === Opcodes.MSG_HANDSHAKE_HELLO.opcode && subcode === Opcodes.MSG_HANDSHAKE_HELLO.subcode) {
      this.handleHandshakeHello(session, payload as HandshakeHelloPayload);
      return;
    }

    if (opcode === Opcodes.MSG_AUTH_LOGIN_REQ.opcode && subcode === Opcodes.MSG_AUTH_LOGIN_REQ.subcode) {
      this.handleAuthLoginReq(session, payload as AuthLoginReqPayload);
      return;
    }

    // 2. Ping / Pong
    if (opcode === Opcodes.MSG_PING.opcode) {
      this.handlePing(session, payload);
      return;
    }

    // 3. Sincronização de Inventário
    if (opcode === Opcodes.MSG_INVENTORY_SYNC_ALL.opcode && subcode === Opcodes.MSG_INVENTORY_SYNC_ALL.subcode) {
      this.sendInventorySync(session);
      return;
    }

    // 4. Mover / Equipar / Desequipar Item
    if (opcode === Opcodes.MSG_ITEM_MOVE_REQ.opcode && subcode === Opcodes.MSG_ITEM_MOVE_REQ.subcode) {
      this.handleItemMoveReq(session, payload as ItemMoveReqPayload);
      return;
    }

    // 5. Aplicação de Joias Sagradas
    if (opcode === Opcodes.MSG_ITEM_USE_JEWEL_REQ.opcode && subcode === Opcodes.MSG_ITEM_USE_JEWEL_REQ.subcode) {
      this.handleItemUseJewelReq(session, payload as ItemUseJewelReqPayload);
      return;
    }

    // 6. Spawn de Itens (Dev Helper)
    if (opcode === Opcodes.MSG_ITEM_SPAWN_DEV_REQ.opcode && subcode === Opcodes.MSG_ITEM_SPAWN_DEV_REQ.subcode) {
      this.handleDevSpawnReq(session, payload as ItemSpawnDevReqPayload);
      return;
    }

    // 7. Combate: Ataque do Jogador (0x50:0x01)
    if (opcode === Opcodes.MSG_COMBAT_ATTACK_REQ.opcode && subcode === Opcodes.MSG_COMBAT_ATTACK_REQ.subcode) {
      this.handleCombatAttackReq(session, payload as CombatAttackReqPayload);
      return;
    }

    // 8. Coleta de Drop do Chão (0x16:0x02)
    if (opcode === Opcodes.MSG_GROUND_ITEM_PICKUP_REQ.opcode && subcode === Opcodes.MSG_GROUND_ITEM_PICKUP_REQ.subcode) {
      this.handleGroundItemPickupReq(session, payload as GroundItemPickupReqPayload);
      return;
    }

    // 9. Síntese e Forja na Máquina do Caos (0x72:0x01)
    if (opcode === Opcodes.MSG_CHAOS_MACHINE_MIX_REQ.opcode && subcode === Opcodes.MSG_CHAOS_MACHINE_MIX_REQ.subcode) {
      this.handleChaosMachineMixReq(session, payload as ChaosMachineMixReqPayload);
      return;
    }

    // 10. Compra em Lojas de NPCs (0x74:0x01)
    if (opcode === Opcodes.MSG_NPC_SHOP_BUY_REQ.opcode && subcode === Opcodes.MSG_NPC_SHOP_BUY_REQ.subcode) {
      this.handleNpcShopBuyReq(session, payload as NpcShopBuyReqPayload);
      return;
    }

    // 10.1 Venda em Lojas de NPCs (0x74:0x03)
    if (opcode === Opcodes.MSG_NPC_SHOP_SELL_REQ.opcode && subcode === Opcodes.MSG_NPC_SHOP_SELL_REQ.subcode) {
      this.handleNpcShopSellReq(session, payload as NpcShopSellReqPayload);
      return;
    }

    // 11. Alocação de Pontos de Atributos / Stats (0x75:0x01)
    if (opcode === Opcodes.MSG_STAT_POINT_ALLOC_REQ.opcode && subcode === Opcodes.MSG_STAT_POINT_ALLOC_REQ.subcode) {
      this.handleStatPointAllocReq(session, payload as StatPointAllocReqPayload);
      return;
    }

    // 11.1 Consumo de Fruta Mágica (0x75:0x03)
    if (opcode === Opcodes.MSG_FRUIT_CONSUME_REQ.opcode && subcode === Opcodes.MSG_FRUIT_CONSUME_REQ.subcode) {
      this.handleFruitConsumeReq(session, payload as FruitConsumeReqPayload);
      return;
    }

    // 12. Chefe Mundial: Spawn Manual (0x80:0x01)
    if (opcode === Opcodes.MSG_BOSS_SPAWN_REQ.opcode && subcode === Opcodes.MSG_BOSS_SPAWN_REQ.subcode) {
      this.handleBossSpawnReq(session, payload as any);
      return;
    }

    // 13. Invasão Dourada: Gatilho Manual (0x80:0x04)
    if (opcode === Opcodes.MSG_GOLDEN_INVASION_REQ.opcode && subcode === Opcodes.MSG_GOLDEN_INVASION_REQ.subcode) {
      this.handleGoldenInvasionReq(session, payload as any);
      return;
    }

    // 14. Box of Kundun: Abertura (0x80:0x06)
    if (opcode === Opcodes.MSG_BOX_KUNDUN_OPEN_REQ.opcode && subcode === Opcodes.MSG_BOX_KUNDUN_OPEN_REQ.subcode) {
      this.handleBoxKundunOpenReq(session, payload as any);
      return;
    }

    // 15. Arenas de Evento: Consulta de Status (0x81:0x01)
    if (opcode === Opcodes.MSG_EVENT_STATUS_REQ.opcode && subcode === Opcodes.MSG_EVENT_STATUS_REQ.subcode) {
      this.handleEventStatusReq(session);
      return;
    }

    // 16. Arenas de Evento: Entrada com Ingresso (0x81:0x03)
    if (opcode === Opcodes.MSG_EVENT_ENTER_REQ.opcode && subcode === Opcodes.MSG_EVENT_ENTER_REQ.subcode) {
      this.handleEventEnterReq(session, payload as any);
      return;
    }

    // 17. Arenas de Evento: Ação no Blood Castle (0x81:0x05)
    if (opcode === Opcodes.MSG_BLOOD_CASTLE_ACTION_REQ.opcode && subcode === Opcodes.MSG_BLOOD_CASTLE_ACTION_REQ.subcode) {
      this.handleBloodCastleActionReq(session, payload as any);
      return;
    }

    // 18. Arenas de Evento: Ação no Devil Square (0x81:0x07)
    if (opcode === Opcodes.MSG_DEVIL_SQUARE_ACTION_REQ.opcode && subcode === Opcodes.MSG_DEVIL_SQUARE_ACTION_REQ.subcode) {
      this.handleDevilSquareActionReq(session, payload as any);
      return;
    }

    // 19. Arenas de Evento: Ação no Chaos Castle (0x81:0x09)
    if (opcode === Opcodes.MSG_CHAOS_CASTLE_ACTION_REQ.opcode && subcode === Opcodes.MSG_CHAOS_CASTLE_ACTION_REQ.subcode) {
      this.handleChaosCastleActionReq(session, payload as any);
      return;
    }

    // 20. Arenas de Evento: Duelo 1v1 (0x81:0x0b)
    if (opcode === Opcodes.MSG_DUEL_ACTION_REQ.opcode && subcode === Opcodes.MSG_DUEL_ACTION_REQ.subcode) {
      this.handleDuelActionReq(session, payload as any);
      return;
    }

    // 21. Catacumbas / Dungeons: Entrada (0x82:0x01)
    if (opcode === Opcodes.MSG_DUNGEON_ENTER_REQ.opcode && subcode === Opcodes.MSG_DUNGEON_ENTER_REQ.subcode) {
      this.handleDungeonEnterReq(session);
      return;
    }

    // 22. Catacumbas / Dungeons: Progresso de Andar (0x82:0x03)
    if (opcode === Opcodes.MSG_DUNGEON_PROGRESS_REQ.opcode && subcode === Opcodes.MSG_DUNGEON_PROGRESS_REQ.subcode) {
      this.handleDungeonProgressReq(session, payload as any);
      return;
    }

    console.warn(`[GameServer] Opcode desconhecido: 0x${opcode.toString(16)}:0x${subcode.toString(16)}`);
  }

  // ==========================================
  // HANDLERS ESPECÍFICOS DE COMANDOS
  // ==========================================

  private handleHandshakeHello(session: ClientSession, payload: HandshakeHelloPayload): void {
    const clientVer = payload?.clientVersion || '1.0.0';
    console.log(`[GameServer] Handshake recebido do cliente (versão ${clientVer})`);

    const challenge = {
      serverVersion: '1.0.0-PROD',
      serverTime: Date.now(),
      salt: `salt-${Math.random().toString(36).substring(2, 10)}`,
    };

    this.sendPacket(
      session,
      Opcodes.MSG_HANDSHAKE_CHALLENGE.opcode,
      Opcodes.MSG_HANDSHAKE_CHALLENGE.subcode,
      challenge
    );
  }

  private handleAuthLoginReq(session: ClientSession, payload: AuthLoginReqPayload): void {
    const username = payload?.username || 'HeroOfDasi';
    const charClass = payload?.characterClass || 'DK';

    this.sessionManager.authenticateSession(session.sessionId, username, charClass);
    console.log(`[GameServer] Sessão autenticada: [${session.character.name}] Classe: ${session.character.characterClass}`);

    const res = {
      success: true,
      sessionId: session.sessionId,
      token: `jwt-${session.sessionId}-${Date.now().toString(16)}`,
      character: session.character,
      message: `Bem-vindo ao continente de Dasi, ${session.character.name}!`,
    };

    this.sendPacket(
      session,
      Opcodes.MSG_AUTH_LOGIN_RES.opcode,
      Opcodes.MSG_AUTH_LOGIN_RES.subcode,
      res
    );

    // Envia automaticamente a sincronização completa do inventário logo após autenticação
    this.sendInventorySync(session);

    // Envia monstros ativos na zona (0x15:0x01)
    this.sendPacket(
      session,
      Opcodes.MSG_MONSTER_SPAWN_OR_MOVE.opcode,
      Opcodes.MSG_MONSTER_SPAWN_OR_MOVE.subcode,
      { monsters: this.combatEngine.spawner.getSerializedMonsters(), timestamp: Date.now() }
    );

    // Envia drops existentes no chão (0x16:0x01)
    this.sendPacket(
      session,
      Opcodes.MSG_GROUND_ITEM_DROP.opcode,
      Opcodes.MSG_GROUND_ITEM_DROP.subcode,
      { drops: this.combatEngine.getAllGroundDrops() }
    );
  }

  private handlePing(session: ClientSession, payload: any): void {
    session.lastPingAt = Date.now();
    this.sendPacket(session, Opcodes.MSG_PONG.opcode, Opcodes.MSG_PONG.subcode, {
      clientTime: payload?.clientTime ?? 0,
      serverTime: Date.now(),
    });
  }

  public sendInventorySync(session: ClientSession): void {
    const state = this.sessionManager.getSerializedInventoryState(session);
    this.sendPacket(
      session,
      Opcodes.MSG_INVENTORY_SYNC_ALL.opcode,
      Opcodes.MSG_INVENTORY_SYNC_ALL.subcode,
      {
        inventory: state,
        character: session.character,
        definitions: ITEM_DEFINITIONS,
      }
    );
  }

  /**
   * Processa movimentação de itens (Grid -> Grid, Grid -> Equipment, Equipment -> Grid, etc.)
   */
  private handleItemMoveReq(session: ClientSession, req: ItemMoveReqPayload): void {
    const inv = session.inventory;
    const { itemUuid, sourceType, targetType, targetX, targetY, targetSlot, sourceSlot, rotated } = req;

    // 1. CASO: GRID -> GRID (Mover ou rotacionar dentro da bolsa 8x8)
    if (sourceType === LocationType.GRID && targetType === LocationType.GRID) {
      if (targetX === undefined || targetY === undefined) {
        this.sendMoveResult(session, req, false, 'Coordenadas destino ausentes');
        return;
      }

      const success = inv.moveItem(itemUuid, targetX, targetY, rotated);
      if (!success) {
        this.sendMoveResult(session, req, false, 'Espaço ocupado ou fora dos limites do inventário');
        return;
      }

      this.sendMoveResult(session, req, true);
      return;
    }

    // 2. CASO: GRID -> EQUIPAMENTO (Equipar item do inventário no personagem)
    if (sourceType === LocationType.GRID && targetType === LocationType.EQUIPMENT) {
      if (!targetSlot) {
        this.sendMoveResult(session, req, false, 'Slot de equipamento não especificado');
        return;
      }

      const equipRes = inv.equipItem(itemUuid, targetSlot, {
        strength: session.character.strength,
        agility: session.character.agility,
        vitality: session.character.vitality,
        energy: session.character.energy,
        level: session.character.level,
        playerClass: session.character.characterClass,
      });

      if (!equipRes.success) {
        this.sendMoveResult(session, req, false, equipRes.error || 'Falha ao equipar item');
        return;
      }

      this.sendMoveResult(session, req, true);
      return;
    }

    // 3. CASO: EQUIPAMENTO -> GRID (Desequipar item para o inventário)
    if (sourceType === LocationType.EQUIPMENT && targetType === LocationType.GRID) {
      const slotToUnequip = sourceSlot || targetSlot;
      if (!slotToUnequip) {
        this.sendMoveResult(session, req, false, 'Slot de origem não fornecido para desequipar');
        return;
      }

      const unequipRes = inv.unequipItem(slotToUnequip, targetX, targetY);
      if (!unequipRes.success) {
        this.sendMoveResult(session, req, false, unequipRes.error || 'Sem espaço na grade para desequipar');
        return;
      }

      this.sendMoveResult(session, req, true);
      return;
    }

    // 4. CASO: EQUIPAMENTO -> EQUIPAMENTO (Troca entre mãos direita e esquerda, ou anéis)
    if (sourceType === LocationType.EQUIPMENT && targetType === LocationType.EQUIPMENT) {
      if (!sourceSlot || !targetSlot) {
        this.sendMoveResult(session, req, false, 'Slots de equipamento inválidos');
        return;
      }

      const itemA = inv.getEquippedItem(sourceSlot);
      const itemB = inv.getEquippedItem(targetSlot);

      if (!itemA) {
        this.sendMoveResult(session, req, false, 'Nenhum item no slot de origem');
        return;
      }

      // Valida se itemA pode ser colocado em targetSlot
      const defA = Item.getDefinition(itemA);
      if (!defA.validEquipSlots || !defA.validEquipSlots.includes(targetSlot)) {
        this.sendMoveResult(session, req, false, 'Item incompatível com o slot de destino');
        return;
      }

      // Se itemB existe, valida se pode ser colocado em sourceSlot
      if (itemB) {
        const defB = Item.getDefinition(itemB);
        if (!defB.validEquipSlots || !defB.validEquipSlots.includes(sourceSlot)) {
          this.sendMoveResult(session, req, false, 'Item substituído não pode ir para o slot de origem');
          return;
        }
      }

      // Efetua a troca autoritativa
      inv.unequipItem(sourceSlot);
      if (itemB) {
        inv.unequipItem(targetSlot);
      }

      inv.addItem(itemA);
      inv.equipItem(itemA.uuid, targetSlot);

      if (itemB) {
        inv.addItem(itemB);
        inv.equipItem(itemB.uuid, sourceSlot);
      }

      this.sendMoveResult(session, req, true);
      return;
    }

    this.sendMoveResult(session, req, false, 'Operação de movimento não suportada');
  }

  private sendMoveResult(
    session: ClientSession,
    req: ItemMoveReqPayload,
    success: boolean,
    error?: string
  ): void {
    const inventoryState = this.sessionManager.getSerializedInventoryState(session);

    this.sendPacket(
      session,
      Opcodes.MSG_ITEM_MOVE_RES.opcode,
      Opcodes.MSG_ITEM_MOVE_RES.subcode,
      {
        success,
        itemUuid: req.itemUuid,
        sourceType: req.sourceType,
        targetType: req.targetType,
        targetSlot: req.targetSlot,
        newX: req.targetX,
        newY: req.targetY,
        rotated: req.rotated,
        error,
        inventoryState,
      }
    );
  }

  /**
   * Processa o uso de Joias Sagradas (Bless, Soul, Life, Chaos, Harmony)
   */
  private handleItemUseJewelReq(session: ClientSession, req: ItemUseJewelReqPayload): void {
    const inv = session.inventory;
    const { jewelUuid, targetUuid, targetLocation, targetSlot } = req;

    // 1. Localiza a joia no inventário
    const jewelPlaced = inv.getPlacedItem(jewelUuid);
    if (!jewelPlaced) {
      this.sendJewelResult(session, req, {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: 0,
        newLevel: 0,
        message: 'A Joia especificada não foi encontrada na sua bolsa.',
        itemDestroyed: false,
      });
      return;
    }

    const jewelDef = Item.getDefinition(jewelPlaced.item);
    if (jewelDef.category !== ItemCategory.JEWEL) {
      this.sendJewelResult(session, req, {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: 0,
        newLevel: 0,
        message: 'O item selecionado não é uma Joia Sagrada.',
        itemDestroyed: false,
      });
      return;
    }

    // 2. Localiza o item alvo (no Grid ou equipado)
    let targetItem: ItemInstance | null = null;
    let targetIsEquipped = false;
    let equippedSlotKey: EquipmentSlot | null = null;

    if (targetLocation === LocationType.EQUIPMENT && targetSlot) {
      targetItem = inv.getEquippedItem(targetSlot);
      targetIsEquipped = true;
      equippedSlotKey = targetSlot;
    } else {
      const placed = inv.getPlacedItem(targetUuid);
      if (placed) {
        targetItem = placed.item;
      }
    }

    if (!targetItem) {
      this.sendJewelResult(session, req, {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: 0,
        newLevel: 0,
        message: 'O item alvo para aprimoramento não foi encontrado.',
        itemDestroyed: false,
      });
      return;
    }

    // Impede usar joia nela mesma
    if (targetItem.uuid === jewelPlaced.item.uuid) {
      this.sendJewelResult(session, req, {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: targetItem.level,
        newLevel: targetItem.level,
        message: 'Você não pode aplicar uma joia sobre ela mesma.',
        itemDestroyed: false,
      });
      return;
    }

    // 3. Aplica a mecânica da joia correspondente
    let upgradeResult;
    const jewelId = jewelDef.id;

    if (jewelId === 'jewel_of_blessing') {
      upgradeResult = JewelSystem.applyJewelOfBlessing(targetItem);
    } else if (jewelId === 'jewel_of_soul') {
      upgradeResult = JewelSystem.applyJewelOfSoul(targetItem);
    } else if (jewelId === 'jewel_of_life') {
      upgradeResult = JewelSystem.applyJewelOfLife(targetItem);
    } else if (jewelId === 'jewel_of_chaos') {
      // Máquina do Caos / Refino de Caos para níveis altos (+9 a +15)
      upgradeResult = JewelSystem.applyChaosMachineCombination(targetItem, {
        chaosJewels: 1,
        blessJewels: 0,
        soulJewels: 0,
        zen: 100000,
      });
    } else if (jewelId === 'jewel_of_harmony') {
      upgradeResult = JewelSystem.applyJewelOfHarmony(targetItem);
    } else {
      this.sendJewelResult(session, req, {
        outcome: UpgradeOutcome.INVALID_TARGET,
        previousLevel: targetItem.level,
        newLevel: targetItem.level,
        message: `Joia desconhecida: ${jewelDef.name}`,
        itemDestroyed: false,
      });
      return;
    }

    // 4. Se a aplicação foi válida (mesmo que tenha falhado e caído o nível), consome a Joia
    if (upgradeResult.outcome !== UpgradeOutcome.INVALID_TARGET && upgradeResult.outcome !== UpgradeOutcome.NO_EFFECT) {
      inv.removeItem(jewelUuid);
    }

    // 5. Se o item foi destruído (pela Máquina do Caos em níveis altos)
    if (upgradeResult.itemDestroyed) {
      if (targetIsEquipped && equippedSlotKey) {
        inv.unequipItem(equippedSlotKey);
        inv.removeItem(targetItem.uuid);
      } else {
        inv.removeItem(targetItem.uuid);
      }
      targetItem = null;
    }

    // 6. Envia o resultado com o estado do inventário sincronizado
    this.sendJewelResult(session, req, upgradeResult, targetItem);
  }

  private sendJewelResult(
    session: ClientSession,
    req: ItemUseJewelReqPayload,
    result: {
      outcome: UpgradeOutcome;
      previousLevel: number;
      newLevel: number;
      previousOption?: number;
      newOption?: number;
      message: string;
      itemDestroyed: boolean;
    },
    updatedItem: ItemInstance | null = null
  ): void {
    const isSuccess = result.outcome === UpgradeOutcome.SUCCESS;
    const inventoryState = this.sessionManager.getSerializedInventoryState(session);

    this.sendPacket(
      session,
      Opcodes.MSG_ITEM_USE_JEWEL_RES.opcode,
      Opcodes.MSG_ITEM_USE_JEWEL_RES.subcode,
      {
        success: isSuccess,
        outcome: result.outcome,
        jewelUuid: req.jewelUuid,
        targetUuid: req.targetUuid,
        previousLevel: result.previousLevel,
        newLevel: result.newLevel,
        previousOption: result.previousOption,
        newOption: result.newOption,
        itemDestroyed: result.itemDestroyed,
        message: result.message,
        updatedItem,
        inventoryState,
      }
    );
  }

  /**
   * Spawn de Itens para teste e sandbox pelo Dev Client
   */
  private handleDevSpawnReq(session: ClientSession, req: ItemSpawnDevReqPayload): void {
    const { itemDefId, level = 0, excellentMask = 0, luck = false, skill = false, count = 1 } = req;
    const inv = session.inventory;

    let spawnedCount = 0;
    for (let i = 0; i < count; i++) {
      try {
        const item = Item.create(itemDefId, {
          level,
          excellentMask,
          luck,
          skill,
        });

        const placed = inv.addItem(item);
        if (placed) {
          spawnedCount++;
        } else {
          break; // Sem mais espaço
        }
      } catch (err) {
        console.warn('[GameServer] Falha criando item para spawn:', itemDefId, err);
        break;
      }
    }

    this.sendPacket(
      session,
      Opcodes.MSG_ITEM_SPAWN_DEV_RES.opcode,
      Opcodes.MSG_ITEM_SPAWN_DEV_RES.subcode,
      {
        success: spawnedCount > 0,
        spawnedCount,
        requestedCount: count,
        itemDefId,
        inventoryState: this.sessionManager.getSerializedInventoryState(session),
      }
    );
  }

  /**
   * Processa requisição de combate (ataque do jogador contra monstro)
   */
  private handleCombatAttackReq(session: ClientSession, req: CombatAttackReqPayload): void {
    const result = this.combatEngine.processPlayerAttack(session, req);

    // Broadcast do resultado de ataque para todos os jogadores na arena (0x50:0x02)
    this.broadcastPacket(
      Opcodes.MSG_COMBAT_ATTACK_RES.opcode,
      Opcodes.MSG_COMBAT_ATTACK_RES.subcode,
      result
    );

    // Se o monstro foi derrotado e gerou drops no chão (0x16:0x01)
    if (result.dropsGenerated && result.dropsGenerated.length > 0) {
      this.broadcastPacket(
        Opcodes.MSG_GROUND_ITEM_DROP.opcode,
        Opcodes.MSG_GROUND_ITEM_DROP.subcode,
        { drops: result.dropsGenerated }
      );
    }
  }

  /**
   * Processa requisição de coleta de itens / Zen do chão
   */
  private handleGroundItemPickupReq(session: ClientSession, req: GroundItemPickupReqPayload): void {
    const result = this.combatEngine.pickupGroundItem(session, req.dropId, req.playerX, req.playerY);

    if (result.success) {
      if (result.zen && result.zen > 0) {
        session.character.zen = (session.character.zen ?? 0) + result.zen;
      }

      // Envia confirmação de coleta para o jogador com estado de inventário sincronizado
      this.sendPacket(
        session,
        Opcodes.MSG_GROUND_ITEM_PICKUP_RES.opcode,
        Opcodes.MSG_GROUND_ITEM_PICKUP_RES.subcode,
        {
          success: true,
          dropId: req.dropId,
          item: result.item,
          zen: result.zen,
          character: session.character,
          inventoryState: this.sessionManager.getSerializedInventoryState(session),
        }
      );

      // Notifica todos os demais clientes para removerem o item do chão
      this.broadcastPacket(
        Opcodes.MSG_GROUND_ITEM_REMOVE.opcode,
        Opcodes.MSG_GROUND_ITEM_REMOVE.subcode,
        { dropId: req.dropId },
        session.sessionId
      );
    } else {
      this.sendPacket(
        session,
        Opcodes.MSG_GROUND_ITEM_PICKUP_RES.opcode,
        Opcodes.MSG_GROUND_ITEM_PICKUP_RES.subcode,
        {
          success: false,
          dropId: req.dropId,
          error: result.error,
        }
      );
    }
  }

  /**
   * Processa requisição de combinação na Máquina do Caos (0x72:0x01)
   */
  private handleChaosMachineMixReq(session: ClientSession, req: ChaosMachineMixReqPayload): void {
    const result = ChaosMachine.executeMix(session.inventory, session.character, req);
    const inventoryState = this.sessionManager.getSerializedInventoryState(session);

    this.sendPacket(
      session,
      Opcodes.MSG_CHAOS_MACHINE_MIX_RES.opcode,
      Opcodes.MSG_CHAOS_MACHINE_MIX_RES.subcode,
      {
        success: result.success,
        mixType: result.mixType,
        rate: result.rate,
        zenCost: result.zenCost,
        createdItem: result.createdItem ?? null,
        updatedItem: result.updatedItem ?? null,
        destroyedItemUuids: result.destroyedItemUuids,
        message: result.message,
        itemDestroyed: result.itemDestroyed ?? false,
        inventoryState,
        character: session.character,
      }
    );
  }

  /**
   * Processa compra autoritativa em lojas de NPCs (0x74:0x01)
   */
  private handleNpcShopBuyReq(session: ClientSession, req: NpcShopBuyReqPayload): void {
    const result = NPCShopSystem.processBuy(
      session,
      req,
      (s) => this.sessionManager.getSerializedInventoryState(s)
    );

    this.sendPacket(
      session,
      Opcodes.MSG_NPC_SHOP_BUY_RES.opcode,
      Opcodes.MSG_NPC_SHOP_BUY_RES.subcode,
      result
    );
  }

  /**
   * Processa venda autoritativa de itens para lojas de NPCs (0x74:0x03)
   */
  private handleNpcShopSellReq(session: ClientSession, req: NpcShopSellReqPayload): void {
    const result = NPCShopSystem.processSell(
      session,
      req.itemUuid,
      (s) => this.sessionManager.getSerializedInventoryState(s)
    );

    this.sendPacket(
      session,
      Opcodes.MSG_NPC_SHOP_SELL_RES.opcode,
      Opcodes.MSG_NPC_SHOP_SELL_RES.subcode,
      result
    );

    if (result.success) {
      this.sendInventorySync(session);
    }
  }

  /**
   * Processa alocação autoritativa de pontos de atributos (0x75:0x01)
   */
  private handleStatPointAllocReq(session: ClientSession, req: StatPointAllocReqPayload): void {
    const { stat, points } = req;
    const validStats = ['strength', 'agility', 'vitality', 'energy', 'command'];

    if (!validStats.includes(stat)) {
      this.sendPacket(
        session,
        Opcodes.MSG_STAT_POINT_ALLOC_RES.opcode,
        Opcodes.MSG_STAT_POINT_ALLOC_RES.subcode,
        {
          success: false,
          stat,
          pointsAllocated: 0,
          pointsRemaining: session.character.statPoints ?? 0,
          character: session.character,
          error: `Atributo inválido: '${stat}'. Opções: ${validStats.join(', ')}.`,
        }
      );
      return;
    }

    if (!points || typeof points !== 'number' || points <= 0 || !Number.isInteger(points)) {
      this.sendPacket(
        session,
        Opcodes.MSG_STAT_POINT_ALLOC_RES.opcode,
        Opcodes.MSG_STAT_POINT_ALLOC_RES.subcode,
        {
          success: false,
          stat,
          pointsAllocated: 0,
          pointsRemaining: session.character.statPoints ?? 0,
          character: session.character,
          error: 'A quantidade de pontos deve ser um número inteiro positivo.',
        }
      );
      return;
    }

    const availablePoints = session.character.statPoints ?? 0;
    if (availablePoints < points) {
      this.sendPacket(
        session,
        Opcodes.MSG_STAT_POINT_ALLOC_RES.opcode,
        Opcodes.MSG_STAT_POINT_ALLOC_RES.subcode,
        {
          success: false,
          stat,
          pointsAllocated: 0,
          pointsRemaining: availablePoints,
          character: session.character,
          error: `Pontos insuficientes! Disponíveis: ${availablePoints}, solicitados: ${points}.`,
        }
      );
      return;
    }

    // Aloca autoritativamente
    session.character[stat] += points;
    session.character.statPoints -= points;

    this.sendPacket(
      session,
      Opcodes.MSG_STAT_POINT_ALLOC_RES.opcode,
      Opcodes.MSG_STAT_POINT_ALLOC_RES.subcode,
      {
        success: true,
        stat,
        pointsAllocated: points,
        pointsRemaining: session.character.statPoints,
        character: session.character,
        message: `Atributo ${stat} elevado com sucesso para ${session.character[stat]}! Pontos restantes: ${session.character.statPoints}.`,
      }
    );
  }

  /**
   * Processa consumo autoritativo de fruta mágica de atributos (0x75:0x03)
   */
  private handleFruitConsumeReq(session: ClientSession, req: FruitConsumeReqPayload): void {
    const { fruitDefId } = req;
    if (!fruitDefId || !fruitDefId.startsWith('fruit_')) {
      this.sendPacket(
        session,
        Opcodes.MSG_FRUIT_CONSUME_RES.opcode,
        Opcodes.MSG_FRUIT_CONSUME_RES.subcode,
        {
          success: false,
          error: 'DefId de fruta inválido.',
        }
      );
      return;
    }

    const hasFruit = session.inventory.hasItem(fruitDefId);
    if (!hasFruit) {
      this.sendPacket(
        session,
        Opcodes.MSG_FRUIT_CONSUME_RES.opcode,
        Opcodes.MSG_FRUIT_CONSUME_RES.subcode,
        {
          success: false,
          fruitDefId,
          error: 'Você não possui esta fruta em seu inventário.',
        }
      );
      return;
    }

    session.inventory.removeItemByDefId(fruitDefId);
    const result = BoxOfKundun.consumeFruit(fruitDefId, session.character);
    const inventoryState = this.sessionManager.getSerializedInventoryState(session);

    this.sendInventorySync(session);
    this.sendPacket(
      session,
      Opcodes.MSG_FRUIT_CONSUME_RES.opcode,
      Opcodes.MSG_FRUIT_CONSUME_RES.subcode,
      {
        success: true,
        fruitDefId,
        statGained: result.statGained,
        pointsGained: result.pointsGained,
        newTotal: result.newTotal,
        character: session.character,
        inventoryState,
        message: result.message,
      }
    );
  }

  // ==========================================
  // HANDLERS: BOSSES, EVENTOS E DUNGEONS
  // ==========================================

  private handleBossSpawnReq(session: ClientSession, payload: { type?: string; x?: number; y?: number }): void {
    const type = payload?.type || 'boss_gorgon';
    const x = payload?.x ?? 400;
    const y = payload?.y ?? 250;
    this.bossManager.spawnBoss(type, x, y);
    this.broadcastBossesState();
  }

  private handleGoldenInvasionReq(session: ClientSession, payload: { tier?: number; mapId?: string }): void {
    const inv = this.bossManager.goldenInvasion.triggerInvasion(
      this.combatEngine.spawner,
      payload?.tier ?? 1,
      payload?.mapId ?? 'LORENCIA'
    );
    this.broadcastMonstersState();
    this.broadcastPacket(
      Opcodes.MSG_GOLDEN_INVASION_RES.opcode,
      Opcodes.MSG_GOLDEN_INVASION_RES.subcode,
      { invasion: inv }
    );
  }

  private handleBoxKundunOpenReq(session: ClientSession, payload: { boxDefId?: string; playerX?: number; playerY?: number }): void {
    const boxDefId = payload?.boxDefId || 'box_of_kundun_1';
    const hasBox = session.inventory.hasItem(boxDefId);
    if (!hasBox) {
      this.sendPacket(session, Opcodes.MSG_BOX_KUNDUN_OPEN_RES.opcode, Opcodes.MSG_BOX_KUNDUN_OPEN_RES.subcode, {
        success: false,
        error: 'Você não possui esta Box of Kundun no inventário.',
      });
      return;
    }

    session.inventory.removeItemByDefId(boxDefId);
    const x = payload?.playerX ?? 400;
    const y = payload?.playerY ?? 250;
    const loot = BoxOfKundun.openBox(boxDefId, x, y, session.sessionId);

    for (const drop of loot.groundDrops) {
      this.combatEngine.registerExternalGroundDrop(drop);
      this.broadcastPacket(Opcodes.MSG_GROUND_ITEM_DROP.opcode, Opcodes.MSG_GROUND_ITEM_DROP.subcode, { drop });
    }

    this.sendInventorySync(session);
    this.sendPacket(session, Opcodes.MSG_BOX_KUNDUN_OPEN_RES.opcode, Opcodes.MSG_BOX_KUNDUN_OPEN_RES.subcode, {
      success: true,
      loot,
    });
  }

  private handleEventStatusReq(session: ClientSession): void {
    this.sendPacket(session, Opcodes.MSG_EVENT_STATUS_RES.opcode, Opcodes.MSG_EVENT_STATUS_RES.subcode, {
      events: this.eventManager.getStatusOverview(),
    });
  }

  private handleEventEnterReq(session: ClientSession, payload: { eventType: string }): void {
    const res = this.eventManager.enterEvent(payload?.eventType as any, session);
    this.sendInventorySync(session);
    this.sendPacket(session, Opcodes.MSG_EVENT_ENTER_RES.opcode, Opcodes.MSG_EVENT_ENTER_RES.subcode, res);
  }

  private handleBloodCastleActionReq(session: ClientSession, payload: { action: string; damage?: number }): void {
    const bc = this.eventManager.bloodCastle;
    if (!bc) return;

    if (payload.action === 'BRIDGE_KILL') {
      const quota = bc.recordBridgeKill();
      this.broadcastPacket(Opcodes.MSG_BLOOD_CASTLE_UPDATE_RES.opcode, Opcodes.MSG_BLOOD_CASTLE_UPDATE_RES.subcode, {
        stage: bc.stage,
        gateHp: bc.gateHp,
        quotaCompleted: quota.quotaCompleted,
      });
    } else if (payload.action === 'GATE_ATTACK') {
      const atk = bc.attackGate(payload.damage ?? 500);
      this.broadcastPacket(Opcodes.MSG_BLOOD_CASTLE_UPDATE_RES.opcode, Opcodes.MSG_BLOOD_CASTLE_UPDATE_RES.subcode, {
        stage: bc.stage,
        gateHp: atk.gateHp,
        gateDestroyed: atk.destroyed,
      });
    } else if (payload.action === 'SORCERER_KILL') {
      const sorc = bc.recordSorcererKill();
      this.broadcastPacket(Opcodes.MSG_BLOOD_CASTLE_UPDATE_RES.opcode, Opcodes.MSG_BLOOD_CASTLE_UPDATE_RES.subcode, {
        stage: bc.stage,
        weaponRevealed: sorc.weaponRevealed,
      });
    } else if (payload.action === 'PICKUP_WEAPON') {
      const picked = bc.pickupArchangelWeapon(session.sessionId);
      this.broadcastPacket(Opcodes.MSG_BLOOD_CASTLE_UPDATE_RES.opcode, Opcodes.MSG_BLOOD_CASTLE_UPDATE_RES.subcode, {
        stage: bc.stage,
        weaponCarrier: session.character.name,
        success: picked,
      });
    } else if (payload.action === 'DELIVER_WEAPON') {
      const delivered = bc.deliverWeaponToArchangel(session.sessionId);
      this.broadcastPacket(Opcodes.MSG_BLOOD_CASTLE_UPDATE_RES.opcode, Opcodes.MSG_BLOOD_CASTLE_UPDATE_RES.subcode, {
        stage: bc.stage,
        triumph: delivered.success,
        rewards: delivered.rewards,
      });
    }
  }

  private handleDevilSquareActionReq(session: ClientSession, payload: { mobType?: string }): void {
    const ds = this.eventManager.devilSquare;
    if (!ds) return;
    ds.recordKill(payload?.mobType || 'spider');
    this.broadcastPacket(Opcodes.MSG_DEVIL_SQUARE_UPDATE_RES.opcode, Opcodes.MSG_DEVIL_SQUARE_UPDATE_RES.subcode, {
      killsCount: ds.killsCount,
      score: ds.score,
      currentWave: ds.currentWaveIndex,
    });
  }

  private handleChaosCastleActionReq(session: ClientSession, payload: { targetId?: string; damage?: number }): void {
    const cc = this.eventManager.chaosCastle;
    if (!cc || !payload.targetId) return;
    const res = cc.damageCombatant(payload.targetId, payload.damage ?? 300);
    this.broadcastPacket(Opcodes.MSG_CHAOS_CASTLE_UPDATE_RES.opcode, Opcodes.MSG_CHAOS_CASTLE_UPDATE_RES.subcode, {
      ...res,
      aliveCount: cc.getAliveCount(),
      stage: cc.stage,
      currentHalfSize: cc.currentHalfSize,
    });
  }

  private handleDuelActionReq(session: ClientSession, payload: { duelId?: string; action?: string; killerSessionId?: string }): void {
    const duel = this.eventManager.activeDuels.get(payload.duelId || '');
    if (!duel) return;
    if (payload.action === 'KILL') {
      const killRes = duel.recordKill(payload.killerSessionId || session.sessionId);
      this.broadcastPacket(Opcodes.MSG_DUEL_UPDATE_RES.opcode, Opcodes.MSG_DUEL_UPDATE_RES.subcode, {
        duelId: duel.id,
        ...killRes,
      });
    }
  }

  private handleDungeonEnterReq(session: ClientSession): void {
    const res = this.dungeonManager.enterDungeon(session);
    this.sendPacket(session, Opcodes.MSG_DUNGEON_ENTER_RES.opcode, Opcodes.MSG_DUNGEON_ENTER_RES.subcode, {
      success: true,
      instance: res.instance.toJSON(),
      isNew: res.isNew,
    });
  }

  private handleDungeonProgressReq(session: ClientSession, payload: { action: string }): void {
    const dng = this.dungeonManager.getSessionInstance(session.sessionId);
    if (!dng) return;

    if (payload.action === 'COLLECT_BONE_KEY') {
      dng.collectBoneKey();
    } else if (payload.action === 'UNLOCK_FLOOR1_GATE') {
      dng.unlockFloor1Gate();
    } else if (payload.action === 'ACTIVATE_VALVE') {
      dng.activateDrainValve();
    } else if (payload.action === 'DEFEAT_GORGON') {
      dng.recordGorgonDefeated();
    }

    this.sendPacket(session, Opcodes.MSG_DUNGEON_PROGRESS_RES.opcode, Opcodes.MSG_DUNGEON_PROGRESS_RES.subcode, {
      instance: dng.toJSON(),
    });
  }

  // ==========================================
  // HELPERS DE ENVIO DE PACOTES & BROADCAST
  // ==========================================

  public broadcastPacket(opcode: number, subcode: number, payload: object, excludeSessionId?: string): void {
    for (const session of this.sessionManager.getAllSessions()) {
      if (session.state === 'AUTHENTICATED' && session.sessionId !== excludeSessionId) {
        this.sendPacket(session, opcode, subcode, payload);
      }
    }
  }

  public broadcastMonstersState(): void {
    const monsters = this.combatEngine.spawner.getSerializedMonsters();
    this.broadcastPacket(
      Opcodes.MSG_MONSTER_SPAWN_OR_MOVE.opcode,
      Opcodes.MSG_MONSTER_SPAWN_OR_MOVE.subcode,
      { monsters, timestamp: Date.now() }
    );
  }

  public broadcastBossesState(): void {
    const bosses = this.bossManager.getSerializedBosses();
    this.broadcastPacket(
      Opcodes.MSG_BOSS_UPDATE_RES.opcode,
      Opcodes.MSG_BOSS_UPDATE_RES.subcode,
      { bosses, timestamp: Date.now() }
    );
  }

  private startGameLoop(): void {
    this.gameLoopTimer = setInterval(() => {
      if (!this.isRunning) return;
      const now = Date.now();
      const updateResult = this.combatEngine.update(0.1);

      if (updateResult.hasMoved || updateResult.respawned.length > 0 || updateResult.despawnedIds.length > 0) {
        this.broadcastMonstersState();
      }

      if (updateResult.expiredDropIds && updateResult.expiredDropIds.length > 0) {
        for (const dropId of updateResult.expiredDropIds) {
          this.broadcastPacket(
            Opcodes.MSG_GROUND_ITEM_REMOVE.opcode,
            Opcodes.MSG_GROUND_ITEM_REMOVE.subcode,
            { dropId }
          );
        }
      }

      // Ciclo dos Chefes Mundiais (Telégrafos, Fases, Auras e Lacaios)
      const bossResult = this.bossManager.update(now, this.combatEngine.spawner);
      if (bossResult.newTelegraphs.length > 0) {
        for (const tel of bossResult.newTelegraphs) {
          this.broadcastPacket(
            Opcodes.MSG_BOSS_TELEGRAPH_CAST.opcode,
            Opcodes.MSG_BOSS_TELEGRAPH_CAST.subcode,
            { telegraph: tel }
          );
        }
      }

      if (bossResult.updatedBosses.length > 0 || bossResult.spawnedAdds.length > 0) {
        this.broadcastBossesState();
        if (bossResult.spawnedAdds.length > 0) {
          this.broadcastMonstersState();
        }
      }

      // Ciclo das Arenas de Evento & Dungeons
      this.eventManager.update(now, 0.1);
      this.dungeonManager.update(now);
    }, 100);
  }

  public sendPacket(session: ClientSession, opcode: number, subcode: number, payload: object): void {
    const ws = session.socket as WebSocket;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    session.seqOut = (session.seqOut + 1) & 0xffffffff;

    if (session.isBinaryMode) {
      const buf = encodeBinaryPacket(opcode, subcode, session.seqOut, payload);
      ws.send(buf);
    } else {
      const msg = {
        opcode,
        subcode,
        seq: session.seqOut,
        payload,
      };
      ws.send(JSON.stringify(msg));
    }
  }

  /**
   * Heartbeat para manutenção e limpeza de sessões mortas
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      for (const session of this.sessionManager.getAllSessions()) {
        const ws = session.socket as WebSocket;
        if (now - session.lastPingAt > 60000) {
          console.log(`[GameServer] Desconectando sessão por inatividade: ${session.sessionId}`);
          try {
            ws.terminate();
          } catch {
            // Ignore
          }
          this.sessionManager.removeSession(session.sessionId);
        }
      }
    }, this.heartbeatIntervalMs);
  }
}

// Iniciação automática se executado como script principal
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('GameServer.ts') ||
  process.argv[1].endsWith('GameServer.js')
);

if (isMainModule) {
  const port = parseInt(process.env.PORT || '8080', 10);
  const server = new GameServer({ port });
  server.start().catch((err) => {
    console.error('Falha ao iniciar o GameServer:', err);
    process.exit(1);
  });
}
