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
import { stripTypeScriptTypes } from 'node:module';
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
  type TeleportReqPayload,
  type GateTriggerReqPayload,
  type PartyInviteReqPayload,
  type PartyRespondInviteReqPayload,
  type TradeRequestReqPayload,
  type TradeRespondReqPayload,
  type TradeItemAddReqPayload,
  type TradeZenAddReqPayload,
  type TradeConfirmReqPayload,
  type TradeCancelReqPayload,
  type PShopOpenReqPayload,
  type PShopBuyReqPayload,
  type PShopInspectReqPayload,
  type QuestActionReqPayload,
  type MasterSkillAllocReqPayload,
  type GensJoinReqPayload,
  type HarmonySmeltReqPayload,
  type HarmonyRestoreReqPayload,
  type SocketMountReqPayload,
  type SocketUnmountReqPayload,
  type KalimaPortalSpawnReqPayload,
  type KalimaEnterReqPayload,
  LocationType,
} from './protocol.ts';
import { SessionManager, type ClientSession } from './SessionManager.ts';
import { CombatEngine } from '../combat/CombatEngine.ts';
import { BossManager } from '../bosses/BossManager.ts';
import { BoxOfKundun } from '../bosses/BoxOfKundun.ts';
import { EventManager } from '../events/EventManager.ts';
import { KalimaInstance } from '../events/KalimaInstance.ts';
import { CharacterRepository } from '../database/CharacterRepository.ts';
import { DungeonManager } from '../dungeons/DungeonManager.ts';
import { GuildSystem, TERRITORIAL_TAX_BY_BIOME } from '../guilds/GuildSystem.ts';
import { CastleSiegeManager } from '../siege/CastleSiegeManager.ts';
import { Item } from '../inventory/Item.ts';
import { JewelSystem } from '../inventory/JewelSystem.ts';
import { ChaosMachine } from '../inventory/ChaosMachine.ts';
import { NPCShopSystem } from '../economy/NPCShop.ts';
import { ITEM_DEFINITIONS } from '../inventory/definitions.ts';
import { CanonicalTerrainGrid } from '../world/CanonicalTerrainGrid.ts';
import { NavigationManager } from '../world/NavigationManager.ts';
import { PartyManager } from '../party/PartyManager.ts';
import { TradeManager } from '../economy/TradeManager.ts';
import { PersonalShopManager, type PShopItemEntry } from '../economy/PersonalShopManager.ts';
import { ResetManager } from '../progression/ResetManager.ts';
import { QuestManager } from '../progression/QuestManager.ts';
import { MasterSkillTree } from '../progression/MasterSkillTree.ts';
import { GensSystem } from '../world/GensSystem.ts';
import { SocketItemSystem } from '../inventory/SocketItemSystem.ts';
import { HarmonyAnd380System } from '../inventory/HarmonyAnd380System.ts';
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
  enableDevControls?: boolean;
}

export class GameServer {
  public readonly port: number;
  public readonly host: string;
  private staticDir: string;
  private heartbeatIntervalMs: number;
  private readonly enableDevControls: boolean;
  private readonly lastSiegeAttack = new Map<string, number>();

  private httpServer: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  public readonly sessionManager: SessionManager;
  public readonly bossManager: BossManager;
  public readonly eventManager: EventManager;
  public readonly dungeonManager: DungeonManager;
  public readonly guildSystem: GuildSystem;
  public readonly castleSiege: CastleSiegeManager;
  public readonly combatEngine: CombatEngine;
  public readonly navigationManager: NavigationManager;
  public readonly partyManager: PartyManager;
  public readonly tradeManager: TradeManager;
  public readonly personalShopManager: PersonalShopManager;
  public readonly resetManager: ResetManager;
  public readonly questManager: QuestManager;
  public readonly gensSystem: GensSystem;
  public readonly socketItemSystem: SocketItemSystem;
  public readonly harmonySystem: HarmonyAnd380System;
  public readonly characterRepository: CharacterRepository;
  public readonly activeKalimaPortals = new Map<string, { portalId: string; ownerId: string; partyId: string | null; kalimaLevel: number; x: number; y: number; expiresAt: number; }>();
  private lastAutoSaveTime = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private gameLoopTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: GameServerConfig = {}) {
    this.port = config.port ?? 8080;
    this.host = config.host ?? '127.0.0.1';
    this.staticDir = config.staticDir ?? path.resolve(process.cwd(), 'src/client/dev_viewer');
    this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? 15000;
    this.enableDevControls = config.enableDevControls ?? false;
    this.sessionManager = new SessionManager();
    this.bossManager = new BossManager();
    this.eventManager = new EventManager();
    this.dungeonManager = new DungeonManager();
    this.guildSystem = new GuildSystem();
    this.castleSiege = new CastleSiegeManager(this.guildSystem);
    this.combatEngine = new CombatEngine(undefined, this.bossManager);
    this.navigationManager = new NavigationManager();
    this.partyManager = new PartyManager();
    this.tradeManager = new TradeManager();
    this.personalShopManager = new PersonalShopManager();
    this.resetManager = new ResetManager();
    this.questManager = new QuestManager();
    this.gensSystem = new GensSystem();
    this.socketItemSystem = new SocketItemSystem();
    this.harmonySystem = new HarmonyAnd380System();
    this.characterRepository = new CharacterRepository();
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

      this.wss = new WebSocketServer({ server: this.httpServer, maxPayload: 64 * 1024 });

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

    // Salva todas as sessões autenticadas antes de encerrar
    for (const session of this.sessionManager.getAllSessions()) {
      if (session.state === 'AUTHENTICATED') {
        this.characterRepository.saveFromSession(session).catch(() => {});
      }
    }
    this.characterRepository.close();

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

    if (req.method === 'POST' && ['/api/bosses/spawn', '/api/bosses/despawn', '/api/events/trigger', '/api/castle-siege/control', '/api/box/open'].includes(pathname) && !this.enableDevControls) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Developer controls disabled' }));
      return;
    }

    // Remoção manual de Chefes via console de desenvolvimento
    if (pathname === '/api/bosses/despawn' && req.method === 'POST') {
      this.readLimitedBody(req, res, (body) => {
        try {
          const data = body ? JSON.parse(body) : {};
          const bossId = String(data.bossId || '');
          if (!bossId || !this.bossManager.removeBoss(bossId)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Chefe ativo não encontrado.' }));
            return;
          }
          this.broadcastBossesState();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, bossId }));
        } catch (err: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // Spawn manual de Chefes via API POST
    if (pathname === '/api/bosses/spawn' && req.method === 'POST') {
      this.readLimitedBody(req, res, (body) => {
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
      this.readLimitedBody(req, res, (body) => {
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

    // Rota da API para Guildas, Alianças e Imposto Territorial
    if (pathname === '/api/guilds') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ...this.guildSystem.toJSON(),
          territorialTaxByBiome: TERRITORIAL_TAX_BY_BIOME,
        })
      );
      return;
    }

    // Rota da API para o Cerco ao Castelo (fase, estruturas, Selo da Coroa)
    if (pathname === '/api/castle-siege') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.castleSiege.toJSON()));
      return;
    }

    // Controle do Cerco via API POST (abrir inscrições / iniciar batalha)
    if (pathname === '/api/castle-siege/control' && req.method === 'POST') {
      this.readLimitedBody(req, res, (body) => {
        try {
          const data = body ? JSON.parse(body) : {};
          const action = data.action;

          if (action === 'OPEN_REGISTRATION') {
            this.castleSiege.openRegistration();
          } else if (action === 'START_BATTLE') {
            const started = this.castleSiege.startBattle();
            if (!started.success) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: started.error }));
              return;
            }
          } else if (action === 'RESET') {
            this.castleSiege.reset();
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: `Ação de cerco desconhecida: ${action}` }));
            return;
          }

          this.broadcastSiegeState();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, siege: this.castleSiege.toJSON() }));
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
      this.readLimitedBody(req, res, (body) => {
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

    // Rota da API para Master Index de mapas canônicos extraídos
    if (pathname === '/api/canonical-maps') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(CanonicalTerrainGrid.getMasterIndex()));
      return;
    }

    if (pathname.startsWith('/api/canonical-maps/')) {
      const mapId = pathname.slice('/api/canonical-maps/'.length).toUpperCase();
      const summary = CanonicalTerrainGrid.getMapSummary(mapId);
      if (!summary) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Mapa canônico '${mapId}' não encontrado` }));
        return;
      }
      const layout = CanonicalTerrainGrid.loadObjectsLayout(mapId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ summary, objects: layout }));
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

      // Browsers do not understand TypeScript even when its MIME type is JavaScript.
      if (isSharedSource && ext === '.ts') {
        fs.readFile(filePath, 'utf8', (readError, source) => {
          if (readError) { res.writeHead(500); res.end(); return; }
          try {
            const js = stripTypeScriptTypes(source, { mode: 'strip' });
            res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Content-Length': Buffer.byteLength(js) });
            res.end(req.method === 'HEAD' ? undefined : js);
          } catch {
            res.writeHead(500); res.end('Could not compile shared module');
          }
        });
        return;
      }
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
  private readLimitedBody(req: http.IncomingMessage, res: http.ServerResponse, done: (body: string) => void): void {
    const chunks: Buffer[] = [];
    let size = 0;
    let rejected = false;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > 64 * 1024) {
        if (!rejected) { rejected = true; res.writeHead(413); res.end('Request body too large'); }
      } else if (!rejected) chunks.push(chunk);
    });
    req.on('end', () => { if (!rejected) done(Buffer.concat(chunks).toString('utf8')); });
  }

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
      if (session.state === 'AUTHENTICATED') {
        this.characterRepository.saveFromSession(session).catch(() => {});
      }
      this.castleSiege.releasePedestal(session.sessionId);
      if (this.castleSiege.crownSeal.masterSessionId === session.sessionId) this.castleSiege.interruptCrownSeal('jogador desconectado');
      this.lastSiegeAttack.delete(session.sessionId);
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

    // Login é provisório para o sandbox, mas comandos de jogo exigem sessão iniciada.
    if (session.state !== 'AUTHENTICATED') {
      (session.socket as WebSocket).close(1008, 'Login required');
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

    if (!this.enableDevControls && (
      (opcode === Opcodes.MSG_ITEM_SPAWN_DEV_REQ.opcode && subcode === Opcodes.MSG_ITEM_SPAWN_DEV_REQ.subcode) ||
      (opcode === Opcodes.MSG_BOSS_SPAWN_REQ.opcode && subcode === Opcodes.MSG_BOSS_SPAWN_REQ.subcode) ||
      (opcode === Opcodes.MSG_GOLDEN_INVASION_REQ.opcode && subcode === Opcodes.MSG_GOLDEN_INVASION_REQ.subcode)
    )) { (session.socket as WebSocket).close(1008, 'Developer controls disabled'); return; }

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

    // 20b. Arenas de Evento: Spawn de Portal de Kalima (0x81:0x0d)
    if (opcode === Opcodes.MSG_KALIMA_PORTAL_SPAWN_REQ.opcode && subcode === Opcodes.MSG_KALIMA_PORTAL_SPAWN_REQ.subcode) {
      this.handleKalimaPortalSpawnReq(session, payload as KalimaPortalSpawnReqPayload);
      return;
    }

    // 20c. Arenas de Evento: Entrada em Kalima (0x81:0x0f)
    if (opcode === Opcodes.MSG_KALIMA_ENTER_REQ.opcode && subcode === Opcodes.MSG_KALIMA_ENTER_REQ.subcode) {
      this.handleKalimaEnterReq(session, payload as KalimaEnterReqPayload);
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

    // 23. Social / Guildas (0xB0) — consulta, fundação, convites, cargos, alianças e tesouro
    if (opcode === Opcodes.MSG_GUILD_STATUS_REQ.opcode && subcode === Opcodes.MSG_GUILD_STATUS_REQ.subcode) {
      this.handleGuildStatusReq(session);
      return;
    }
    if (opcode === Opcodes.MSG_GUILD_CREATE_REQ.opcode && subcode === Opcodes.MSG_GUILD_CREATE_REQ.subcode) {
      this.handleGuildCreateReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_GUILD_INVITE_REQ.opcode && subcode === Opcodes.MSG_GUILD_INVITE_REQ.subcode) {
      this.handleGuildInviteReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_GUILD_RESPOND_INVITE_REQ.opcode && subcode === Opcodes.MSG_GUILD_RESPOND_INVITE_REQ.subcode) {
      this.handleGuildRespondInviteReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_GUILD_RANK_REQ.opcode && subcode === Opcodes.MSG_GUILD_RANK_REQ.subcode) {
      this.handleGuildRankReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_GUILD_LEAVE_REQ.opcode && subcode === Opcodes.MSG_GUILD_LEAVE_REQ.subcode) {
      this.handleGuildLeaveReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_GUILD_ALLIANCE_REQ.opcode && subcode === Opcodes.MSG_GUILD_ALLIANCE_REQ.subcode) {
      this.handleGuildAllianceReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_GUILD_TREASURY_REQ.opcode && subcode === Opcodes.MSG_GUILD_TREASURY_REQ.subcode) {
      this.handleGuildTreasuryReq(session, payload as any);
      return;
    }

    // 24. Cerco ao Castelo (0xB1) — status, inscrição, estruturas, pedestais e Selo
    if (opcode === Opcodes.MSG_SIEGE_STATUS_REQ.opcode && subcode === Opcodes.MSG_SIEGE_STATUS_REQ.subcode) {
      this.handleSiegeStatusReq(session);
      return;
    }
    if (opcode === Opcodes.MSG_SIEGE_REGISTER_REQ.opcode && subcode === Opcodes.MSG_SIEGE_REGISTER_REQ.subcode) {
      this.handleSiegeRegisterReq(session);
      return;
    }
    if (opcode === Opcodes.MSG_SIEGE_ATTACK_STRUCTURE_REQ.opcode && subcode === Opcodes.MSG_SIEGE_ATTACK_STRUCTURE_REQ.subcode) {
      this.handleSiegeAttackStructureReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_SIEGE_PEDESTAL_REQ.opcode && subcode === Opcodes.MSG_SIEGE_PEDESTAL_REQ.subcode) {
      this.handleSiegePedestalReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_SIEGE_CROWN_SEAL_REQ.opcode && subcode === Opcodes.MSG_SIEGE_CROWN_SEAL_REQ.subcode) {
      this.handleSiegeCrownSealReq(session, payload as any);
      return;
    }

    // 25. Navegação & Portais (0x30)
    if (opcode === Opcodes.MSG_TELEPORT_REQ.opcode && subcode === Opcodes.MSG_TELEPORT_REQ.subcode) {
      this.handleTeleportReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_GATE_TRIGGER_REQ.opcode && subcode === Opcodes.MSG_GATE_TRIGGER_REQ.subcode) {
      this.handleGateTriggerReq(session, payload as any);
      return;
    }

    // 26. Social / Party (0xB2)
    if (opcode === Opcodes.MSG_PARTY_INVITE_REQ.opcode && subcode === Opcodes.MSG_PARTY_INVITE_REQ.subcode) {
      this.handlePartyInviteReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_PARTY_RESPOND_INVITE_REQ.opcode && subcode === Opcodes.MSG_PARTY_RESPOND_INVITE_REQ.subcode) {
      this.handlePartyRespondInviteReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_PARTY_LEAVE_REQ.opcode && subcode === Opcodes.MSG_PARTY_LEAVE_REQ.subcode) {
      this.handlePartyLeaveReq(session);
      return;
    }

    // 27. Troca Atômica / Trade (0x76)
    if (opcode === Opcodes.MSG_TRADE_REQUEST_REQ.opcode && subcode === Opcodes.MSG_TRADE_REQUEST_REQ.subcode) {
      this.handleTradeRequestReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_TRADE_RESPOND_REQ.opcode && subcode === Opcodes.MSG_TRADE_RESPOND_REQ.subcode) {
      this.handleTradeRespondReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_TRADE_ITEM_ADD_REQ.opcode && subcode === Opcodes.MSG_TRADE_ITEM_ADD_REQ.subcode) {
      this.handleTradeItemAddReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_TRADE_ZEN_ADD_REQ.opcode && subcode === Opcodes.MSG_TRADE_ZEN_ADD_REQ.subcode) {
      this.handleTradeZenAddReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_TRADE_CONFIRM_REQ.opcode && subcode === Opcodes.MSG_TRADE_CONFIRM_REQ.subcode) {
      this.handleTradeConfirmReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_TRADE_CANCEL_REQ.opcode && subcode === Opcodes.MSG_TRADE_CANCEL_REQ.subcode) {
      this.handleTradeCancelReq(session, payload as any);
      return;
    }

    // 28. Loja Pessoal / Personal Shop (0x77)
    if (opcode === Opcodes.MSG_PSHOP_OPEN_REQ.opcode && subcode === Opcodes.MSG_PSHOP_OPEN_REQ.subcode) {
      this.handlePShopOpenReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_PSHOP_CLOSE_REQ.opcode && subcode === Opcodes.MSG_PSHOP_CLOSE_REQ.subcode) {
      this.handlePShopCloseReq(session);
      return;
    }
    if (opcode === Opcodes.MSG_PSHOP_INSPECT_REQ.opcode && subcode === Opcodes.MSG_PSHOP_INSPECT_REQ.subcode) {
      this.handlePShopInspectReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_PSHOP_BUY_REQ.opcode && subcode === Opcodes.MSG_PSHOP_BUY_REQ.subcode) {
      this.handlePShopBuyReq(session, payload as any);
      return;
    }

    // 29. Progressão: Resets, Master Resets, Quests e Master Skill Tree (0x83)
    if (opcode === Opcodes.MSG_RESET_REQ.opcode && subcode === Opcodes.MSG_RESET_REQ.subcode) {
      this.handleResetReq(session);
      return;
    }
    if (opcode === Opcodes.MSG_MASTER_RESET_REQ.opcode && subcode === Opcodes.MSG_MASTER_RESET_REQ.subcode) {
      this.handleMasterResetReq(session);
      return;
    }
    if (opcode === Opcodes.MSG_QUEST_INFO_REQ.opcode && subcode === Opcodes.MSG_QUEST_INFO_REQ.subcode) {
      this.handleQuestInfoReq(session);
      return;
    }
    if (opcode === Opcodes.MSG_QUEST_ACTION_REQ.opcode && subcode === Opcodes.MSG_QUEST_ACTION_REQ.subcode) {
      this.handleQuestActionReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_MASTER_SKILL_ALLOC_REQ.opcode && subcode === Opcodes.MSG_MASTER_SKILL_ALLOC_REQ.subcode) {
      this.handleMasterSkillAllocReq(session, payload as any);
      return;
    }

    // 30. Famílias Gens (0x84)
    if (opcode === Opcodes.MSG_GENS_JOIN_REQ.opcode && subcode === Opcodes.MSG_GENS_JOIN_REQ.subcode) {
      this.handleGensJoinReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_GENS_STATUS_REQ.opcode && subcode === Opcodes.MSG_GENS_STATUS_REQ.subcode) {
      this.handleGensStatusReq(session);
      return;
    }
    if (opcode === Opcodes.MSG_GENS_LEAVE_REQ.opcode && subcode === Opcodes.MSG_GENS_LEAVE_REQ.subcode) {
      this.handleGensLeaveReq(session);
      return;
    }

    // 31. Refinamento Harmony & Sockets (0x85)
    if (opcode === Opcodes.MSG_HARMONY_SMELT_REQ.opcode && subcode === Opcodes.MSG_HARMONY_SMELT_REQ.subcode) {
      this.handleHarmonySmeltReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_HARMONY_RESTORE_REQ.opcode && subcode === Opcodes.MSG_HARMONY_RESTORE_REQ.subcode) {
      this.handleHarmonyRestoreReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_SOCKET_MOUNT_REQ.opcode && subcode === Opcodes.MSG_SOCKET_MOUNT_REQ.subcode) {
      this.handleSocketMountReq(session, payload as any);
      return;
    }
    if (opcode === Opcodes.MSG_SOCKET_UNMOUNT_REQ.opcode && subcode === Opcodes.MSG_SOCKET_UNMOUNT_REQ.subcode) {
      this.handleSocketUnmountReq(session, payload as any);
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

  private async handleAuthLoginReq(session: ClientSession, payload: AuthLoginReqPayload): Promise<void> {
    const username = (payload?.username || 'HeroOfDasi').trim();
    const charClass = payload?.characterClass || 'DK';

    // 1. Tenta carregar dados persistidos do personagem no SQLite
    const loaded = await this.characterRepository.loadIntoSession(username, session);
    if (loaded) {
      this.sessionManager.authenticateSession(session.sessionId, session.character.name, session.character.characterClass);
      console.log(`[GameServer] Personagem persistido recuperado: [${session.character.name}] Nível ${session.character.level} Classe: ${session.character.characterClass}`);
    } else {
      this.sessionManager.authenticateSession(session.sessionId, username, charClass);
      await this.characterRepository.saveFromSession(session).catch(() => {});
      console.log(`[GameServer] Novo personagem registrado e salvo: [${session.character.name}] Classe: ${session.character.characterClass}`);
    }

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

    // Bosses são mantidos pelo BossManager, fora do snapshot normal de monstros.
    if (req.targetMobId?.startsWith('boss-')) this.broadcastBossesState();

    // Se o monstro foi derrotado e gerou drops no chão (0x16:0x01)
    if (result.dropsGenerated && result.dropsGenerated.length > 0) {
      this.broadcastPacket(
        Opcodes.MSG_GROUND_ITEM_DROP.opcode,
        Opcodes.MSG_GROUND_ITEM_DROP.subcode,
        { drops: result.dropsGenerated }
      );
    }

    // Distribuição de experiência canônica de grupo (Party) se houver membros
    if (result.xpGained && result.xpGained > 0 && session.partyId) {
      const party = this.partyManager.getParty(session.partyId);
      if (party) {
        const expDist = PartyManager.calculatePartyExp(result.xpGained, party, 50);
        for (const share of expDist.memberExpShares) {
          if (share.eligible && share.expGranted > 0) {
            const memberSession = this.sessionManager.getSession(share.sessionId);
            if (memberSession) {
              this.sendPacket(
                memberSession,
                Opcodes.MSG_PLAYER_STATUS_EXP.opcode,
                Opcodes.MSG_PLAYER_STATUS_EXP.subcode,
                { expGained: share.expGranted, isPartyExp: true, isGoldParty: expDist.isGoldParty }
              );
            }
          }
        }
      }
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
      (s) => this.sessionManager.getSerializedInventoryState(s),
      this.territorialTaxCollector
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
      (s) => this.sessionManager.getSerializedInventoryState(s),
      this.territorialTaxCollector,
      this.getSessionBiome(session)
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
    try {
      const type = payload?.type || 'boss_gorgon';
      const x = payload?.x ?? 400;
      const y = payload?.y ?? 250;
      this.bossManager.spawnBoss(type, x, y);
      this.broadcastBossesState();
    } catch (err: any) {
      this.sendPacket(session, Opcodes.MSG_BOSS_UPDATE_RES.opcode, Opcodes.MSG_BOSS_UPDATE_RES.subcode, {
        success: false,
        error: err.message,
        bosses: this.bossManager.getSerializedBosses(),
      });
    }
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

  private handleKalimaPortalSpawnReq(session: ClientSession, payload: KalimaPortalSpawnReqPayload): void {
    if (session.state !== 'AUTHENTICATED') return;

    const defId = payload.lostMapDefId || '';
    const match = defId.match(/lost_map_(\d+)/);
    const kalimaLevel = match ? parseInt(match[1], 10) : 1;

    if (!session.inventory.hasItem(defId)) {
      this.sendPacket(session, Opcodes.MSG_KALIMA_PORTAL_SPAWN_RES.opcode, Opcodes.MSG_KALIMA_PORTAL_SPAWN_RES.subcode, {
        success: false,
        error: `Item [${defId}] não encontrado no inventário!`,
      });
      return;
    }

    const isSpecialClass = session.character.characterClass === 'MG' || session.character.characterClass === 'DL';
    const canEnter = KalimaInstance.canEnterKalima(kalimaLevel, session.character.level, isSpecialClass);
    if (!canEnter) {
      this.sendPacket(session, Opcodes.MSG_KALIMA_PORTAL_SPAWN_RES.opcode, Opcodes.MSG_KALIMA_PORTAL_SPAWN_RES.subcode, {
        success: false,
        error: `Nível ${session.character.level} incompatível com Kalima ${kalimaLevel}!`,
      });
      return;
    }

    session.inventory.removeItemByDefId(defId);
    const party = this.partyManager.getPartyBySession(session.sessionId);
    const portal = KalimaInstance.spawnKalimaPortal(
      session.sessionId,
      party?.partyId ?? null,
      kalimaLevel,
      payload.x ?? session.x ?? 125,
      payload.y ?? session.y ?? 125
    );

    this.activeKalimaPortals.set(portal.portalId, {
      portalId: portal.portalId,
      ownerId: session.sessionId,
      partyId: party?.partyId ?? null,
      kalimaLevel: portal.kalimaLevel,
      x: portal.x,
      y: portal.y,
      expiresAt: Date.now() + portal.durationSeconds * 1000,
    });

    this.sendPacket(session, Opcodes.MSG_KALIMA_PORTAL_SPAWN_RES.opcode, Opcodes.MSG_KALIMA_PORTAL_SPAWN_RES.subcode, {
      success: true,
      portalId: portal.portalId,
      kalimaLevel: portal.kalimaLevel,
      durationSeconds: portal.durationSeconds,
      x: portal.x,
      y: portal.y,
    });
  }

  private handleKalimaEnterReq(session: ClientSession, payload: KalimaEnterReqPayload): void {
    if (session.state !== 'AUTHENTICATED') return;

    const portal = this.activeKalimaPortals.get(payload.portalId);
    if (!portal || Date.now() > portal.expiresAt) {
      this.sendPacket(session, Opcodes.MSG_KALIMA_ENTER_RES.opcode, Opcodes.MSG_KALIMA_ENTER_RES.subcode, {
        success: false,
        error: 'Portal de Kalima expirou ou não existe!',
      });
      return;
    }

    const party = this.partyManager.getPartyBySession(session.sessionId);
    const isOwner = portal.ownerId === session.sessionId;
    const isPartyMember = Boolean(portal.partyId && party && portal.partyId === party.partyId);

    if (!isOwner && !isPartyMember) {
      this.sendPacket(session, Opcodes.MSG_KALIMA_ENTER_RES.opcode, Opcodes.MSG_KALIMA_ENTER_RES.subcode, {
        success: false,
        error: 'Apenas o invocador ou membros do grupo podem entrar neste portal!',
      });
      return;
    }

    const isSpecialClass = session.character.characterClass === 'MG' || session.character.characterClass === 'DL';
    const canEnter = KalimaInstance.canEnterKalima(portal.kalimaLevel, session.character.level, isSpecialClass);
    if (!canEnter) {
      this.sendPacket(session, Opcodes.MSG_KALIMA_ENTER_RES.opcode, Opcodes.MSG_KALIMA_ENTER_RES.subcode, {
        success: false,
        error: `Nível ${session.character.level} insuficiente ou acima do teto para Kalima ${portal.kalimaLevel}!`,
      });
      return;
    }

    session.currentMap = 24 + (portal.kalimaLevel - 1);
    session.x = 20;
    session.y = 20;

    this.sendPacket(session, Opcodes.MSG_KALIMA_ENTER_RES.opcode, Opcodes.MSG_KALIMA_ENTER_RES.subcode, {
      success: true,
      kalimaLevel: portal.kalimaLevel,
      targetMap: `KALIMA_${portal.kalimaLevel}`,
      x: 20,
      y: 20,
    });
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
  // HANDLERS DE GUILDAS (0xB0) & CERCO AO CASTELO (0xB1)
  // ==========================================

  /**
   * Imposto Territorial: liga as lojas de NPC ao tesouro da guilda que controla
   * o castelo. A alíquota vem do bioma da loja (`TERRITORIAL_TAX_BY_BIOME`).
   */
  private get territorialTaxCollector() {
    return (biome: string, grossZen: number, commit = true) => this.guildSystem.applyTerritorialTax(biome, grossZen, commit);
  }

  /** Bioma associado à sessão — hoje, Lorencia como praça central do servidor. */
  private getSessionBiome(session: ClientSession): string {
    return (session as any).mapBiome ?? 'LORENCIA';
  }

  /** Atores de guilda são projeções da sessão (o GuildSystem não conhece sockets). */
  private guildActor(session: ClientSession) {
    return { sessionId: session.sessionId, character: session.character };
  }

  /** Localiza a sessão de outro jogador pelo apelido (para convites). */
  private findSessionByCharacterName(name: string): ClientSession | undefined {
    const normalized = (name || '').trim().toLowerCase();
    return this.sessionManager
      .getAllSessions()
      .find((s) => s.character.name.toLowerCase() === normalized);
  }

  private sendGuildStatus(session: ClientSession, extra: Record<string, unknown> = {}): void {
    const guild = this.guildSystem.getGuildOfSession(session.sessionId);
    this.sendPacket(session, Opcodes.MSG_GUILD_STATUS_RES.opcode, Opcodes.MSG_GUILD_STATUS_RES.subcode, {
      success: true,
      ...extra,
      guild: guild
        ? {
            id: guild.id,
            name: guild.name,
            masterSessionId: guild.masterSessionId,
            members: Array.from(guild.members.values()),
            allies: Array.from(guild.allies),
            treasuryZen: guild.treasuryZen,
            totalTaxCollected: guild.totalTaxCollected,
          }
        : null,
      rank: this.guildSystem.getRank(session.sessionId),
      pendingInvitations: this.guildSystem.getPendingInvitations(session.sessionId),
      hasCrownCloak: this.guildSystem.isCrownCloakHolder(session.sessionId),
      castleOwner: this.guildSystem.getCastleOwner()?.name ?? null,
    });
  }

  private broadcastSiegeState(): void {
    this.broadcastPacket(
      Opcodes.MSG_SIEGE_STATUS_RES.opcode,
      Opcodes.MSG_SIEGE_STATUS_RES.subcode,
      { siege: this.castleSiege.toJSON() }
    );
  }

  private handleGuildStatusReq(session: ClientSession): void {
    this.sendGuildStatus(session);
  }

  private handleGuildCreateReq(session: ClientSession, payload: { name?: string }): void {
    const result = this.guildSystem.createGuild(this.guildActor(session), payload?.name ?? '');
    this.sendGuildStatus(session, { success: result.success, error: result.error, message: result.message });
  }

  private handleGuildInviteReq(session: ClientSession, payload: { targetName?: string }): void {
    const target = this.findSessionByCharacterName(payload?.targetName ?? '');
    if (!target) {
      this.sendGuildStatus(session, { success: false, error: 'Jogador não encontrado online.' });
      return;
    }

    const result = this.guildSystem.inviteMember(this.guildActor(session), this.guildActor(target));
    if (result.success) {
      this.sendGuildStatus(target, { message: `${session.character.name} convidou você para "${result.guild?.name}".` });
    }
    this.sendGuildStatus(session, { success: result.success, error: result.error, message: result.message });
  }

  private handleGuildRespondInviteReq(
    session: ClientSession,
    payload: { accept?: boolean; guildId?: string }
  ): void {
    const accept = payload?.accept !== false;
    const result = accept
      ? this.guildSystem.acceptInvitation(this.guildActor(session), payload?.guildId)
      : this.guildSystem.declineInvitation(this.guildActor(session), payload?.guildId);

    this.sendGuildStatus(session, { success: result.success, error: result.error, message: result.message });
  }

  private handleGuildRankReq(
    session: ClientSession,
    payload: { targetName?: string; rank?: 'MASTER' | 'SUB_LEADER' | 'MEMBER'; transfer?: boolean }
  ): void {
    const target = this.findSessionByCharacterName(payload?.targetName ?? '');
    if (!target) {
      this.sendGuildStatus(session, { success: false, error: 'Jogador não encontrado online.' });
      return;
    }

    const result = payload?.transfer
      ? this.guildSystem.transferLeadership(this.guildActor(session), target.sessionId)
      : this.guildSystem.setRank(this.guildActor(session), target.sessionId, payload?.rank ?? 'MEMBER');

    if (result.success && target.sessionId !== session.sessionId) {
      this.sendGuildStatus(target, { message: result.message, messageFrom: session.character.name });
    }
    this.sendGuildStatus(session, { success: result.success, error: result.error, message: result.message });
  }

  private handleGuildLeaveReq(session: ClientSession, payload: { targetName?: string }): void {
    const target = payload?.targetName ? this.findSessionByCharacterName(payload.targetName) : undefined;
    const result = target
      ? this.guildSystem.removeMember(this.guildActor(session), target.sessionId)
      : this.guildSystem.leaveGuild(this.guildActor(session));

    this.sendGuildStatus(session, { success: result.success, error: result.error, message: result.message });
  }

  private handleGuildAllianceReq(
    session: ClientSession,
    payload: { targetGuildId?: string; breakAlliance?: boolean }
  ): void {
    const guildId = payload?.targetGuildId ?? '';
    const result = payload?.breakAlliance
      ? this.guildSystem.breakAlliance(this.guildActor(session), guildId)
      : this.guildSystem.proposeAlliance(this.guildActor(session), guildId);

    this.sendGuildStatus(session, { success: result.success, error: result.error, message: result.message });
  }

  private handleGuildTreasuryReq(session: ClientSession, payload: { amountZen?: number }): void {
    const result = this.guildSystem.depositToTreasury(this.guildActor(session), payload?.amountZen ?? 0);
    this.sendGuildStatus(session, { success: result.success, error: result.error, message: result.message });
  }

  private handleSiegeStatusReq(session: ClientSession): void {
    this.sendPacket(session, Opcodes.MSG_SIEGE_STATUS_RES.opcode, Opcodes.MSG_SIEGE_STATUS_RES.subcode, {
      siege: this.castleSiege.toJSON(),
    });
  }

  private handleSiegeRegisterReq(session: ClientSession): void {
    const guild = this.guildSystem.getGuildOfSession(session.sessionId);
    if (!guild) {
      this.sendPacket(session, Opcodes.MSG_SIEGE_REGISTER_RES.opcode, Opcodes.MSG_SIEGE_REGISTER_RES.subcode, {
        success: false,
        error: 'Você precisa pertencer a uma guilda para se inscrever no cerco.',
      });
      return;
    }
    if (!this.guildSystem.isLeadership(session.sessionId)) {
      this.sendPacket(session, Opcodes.MSG_SIEGE_REGISTER_RES.opcode, Opcodes.MSG_SIEGE_REGISTER_RES.subcode, {
        success: false,
        error: 'Apenas o Mestre e os Sub-líderes podem inscrever a guilda.',
      });
      return;
    }

    const result = this.castleSiege.registerGuild(guild.id);
    if (result.success) this.broadcastSiegeState();
    this.sendPacket(session, Opcodes.MSG_SIEGE_REGISTER_RES.opcode, Opcodes.MSG_SIEGE_REGISTER_RES.subcode, {
      ...result,
      siege: this.castleSiege.toJSON(),
    });
  }

  private handleSiegeAttackStructureReq(
    session: ClientSession,
    payload: { structureId?: string; damage?: number }
  ): void {
    const guild = this.guildSystem.getGuildOfSession(session.sessionId);
    if (!guild) {
      this.sendPacket(session, Opcodes.MSG_SIEGE_ATTACK_STRUCTURE_RES.opcode, Opcodes.MSG_SIEGE_ATTACK_STRUCTURE_RES.subcode, {
        success: false,
        error: 'Apenas membros de guildas inscritas podem atacar as estruturas do castelo.',
      });
      return;
    }

    const now = Date.now();
    const last = this.lastSiegeAttack.get(session.sessionId) ?? 0;
    const damage = now - last >= 500 ? Math.max(1, Math.floor(session.character.strength / 4)) : 0;
    if (damage) this.lastSiegeAttack.set(session.sessionId, now);
    const hit = this.castleSiege.damageStructure(guild.id, payload?.structureId ?? '', damage);
    this.broadcastPacket(
      Opcodes.MSG_SIEGE_ATTACK_STRUCTURE_RES.opcode,
      Opcodes.MSG_SIEGE_ATTACK_STRUCTURE_RES.subcode,
      {
        success: hit.applied > 0,
        structureId: payload?.structureId,
        applied: hit.applied,
        hp: hit.hp,
        destroyed: hit.destroyed,
        stage: this.castleSiege.stage,
      }
    );
  }

  private handleSiegePedestalReq(session: ClientSession, payload: { side?: 'west' | 'east'; release?: boolean }): void {
    if (payload?.release) {
      this.castleSiege.releasePedestal(session.sessionId);
      this.sendPacket(session, Opcodes.MSG_SIEGE_PEDESTAL_RES.opcode, Opcodes.MSG_SIEGE_PEDESTAL_RES.subcode, {
        success: true,
        side: payload?.side ?? null,
        siege: this.castleSiege.toJSON(),
      });
      return;
    }

    const result = this.castleSiege.occupyPedestal(session.sessionId, payload?.side === 'east' ? 'east' : 'west');
    if (result.success) this.broadcastSiegeState();
    this.sendPacket(session, Opcodes.MSG_SIEGE_PEDESTAL_RES.opcode, Opcodes.MSG_SIEGE_PEDESTAL_RES.subcode, {
      ...result,
      side: payload?.side ?? 'west',
      siege: this.castleSiege.toJSON(),
    });
  }

  private handleSiegeCrownSealReq(session: ClientSession, payload: { action?: 'BEGIN' | 'INTERRUPT' }): void {
    const result = payload?.action === 'INTERRUPT'
      ? session.sessionId === this.castleSiege.crownSeal.masterSessionId
        ? { success: true, ...this.castleSiege.interruptCrownSeal('interrompido manualmente') }
        : { success: false, error: 'Apenas o Mestre canalizando pode interromper.' }
      : this.castleSiege.beginCrownSeal(session.sessionId);

    this.broadcastPacket(
      Opcodes.MSG_SIEGE_CROWN_SEAL_RES.opcode,
      Opcodes.MSG_SIEGE_CROWN_SEAL_RES.subcode,
      { ...result, siege: this.castleSiege.toJSON() }
    );
  }

  // ==========================================
  // SUBSISTEMAS ORQUESTRADOS: NAVEGAÇÃO, GRUPO, TROCA, LOJA, PROGRESSÃO, GENS & HARMONY
  // ==========================================

  private handleTeleportReq(session: ClientSession, req: TeleportReqPayload): void {
    if (!req?.destinationName) {
      this.sendPacket(session, Opcodes.MSG_TELEPORT_RES.opcode, Opcodes.MSG_TELEPORT_RES.subcode, {
        success: false,
        error: 'Destino não informado',
      });
      return;
    }

    const res = NavigationManager.processMoveRequest(
      {
        name: session.character.name,
        className: session.character.characterClass,
        level: session.character.level,
        zen: session.character.zen ?? 0,
        pkLevel: (session.character as any).pkLevel ?? 3,
      },
      req.destinationName
    );

    if (res.success && res.mapId !== undefined && res.x !== undefined && res.y !== undefined) {
      session.currentMap = res.mapId;
      session.x = res.x;
      session.y = res.y;
      session.character.zen = (session.character.zen ?? 0) - (res.costZen ?? 0);

      this.sendPacket(session, Opcodes.MSG_TELEPORT_RES.opcode, Opcodes.MSG_TELEPORT_RES.subcode, {
        success: true,
        destinationName: req.destinationName,
        map: res.mapId,
        x: res.x,
        y: res.y,
        zenCost: res.costZen,
        zenRemaining: session.character.zen,
      });
    } else {
      this.sendPacket(session, Opcodes.MSG_TELEPORT_RES.opcode, Opcodes.MSG_TELEPORT_RES.subcode, {
        success: false,
        error: res.message,
      });
    }
  }

  private handleGateTriggerReq(session: ClientSession, req: GateTriggerReqPayload): void {
    const res = NavigationManager.checkGateStep(
      {
        className: session.character.characterClass,
        level: session.character.level,
      },
      req?.currentMap ?? session.currentMap ?? 0,
      req?.currentX ?? session.x ?? 0,
      req?.currentY ?? session.y ?? 0
    );

    if (res.triggered && res.targetMap !== undefined && res.targetX !== undefined && res.targetY !== undefined) {
      session.currentMap = res.targetMap;
      session.x = res.targetX;
      session.y = res.targetY;

      this.sendPacket(session, Opcodes.MSG_GATE_TRIGGER_RES.opcode, Opcodes.MSG_GATE_TRIGGER_RES.subcode, {
        triggered: true,
        targetGateIndex: res.targetGateId,
        map: res.targetMap,
        x: res.targetX,
        y: res.targetY,
        message: res.message,
      });
      return;
    }

    this.sendPacket(session, Opcodes.MSG_GATE_TRIGGER_RES.opcode, Opcodes.MSG_GATE_TRIGGER_RES.subcode, {
      triggered: false,
    });
  }

  private handlePartyInviteReq(session: ClientSession, req: PartyInviteReqPayload): void {
    const targetSession = this.sessionManager.getSession(req?.targetSessionId);
    if (!targetSession) {
      this.sendPacket(session, Opcodes.MSG_PARTY_INVITE_RES.opcode, Opcodes.MSG_PARTY_INVITE_RES.subcode, {
        success: false,
        error: 'Jogador alvo não encontrado',
      });
      return;
    }

    if (targetSession.partyId) {
      this.sendPacket(session, Opcodes.MSG_PARTY_INVITE_RES.opcode, Opcodes.MSG_PARTY_INVITE_RES.subcode, {
        success: false,
        error: 'O jogador alvo já está em um grupo',
      });
      return;
    }

    let partyId = session.partyId;
    if (!partyId) {
      partyId = this.partyManager.createParty({
        sessionId: session.sessionId,
        name: session.character.name,
        className: session.character.characterClass,
        level: session.character.level,
        isLeader: true,
      });
      session.partyId = partyId;
    }

    const added = this.partyManager.addMember(partyId, {
      sessionId: targetSession.sessionId,
      name: targetSession.character.name,
      className: targetSession.character.characterClass,
      level: targetSession.character.level,
    });

    if (added) {
      targetSession.partyId = partyId;
      const members = this.partyManager.getParty(partyId) || [];
      const isGoldParty = PartyManager.isGoldParty(members);

      this.sendPacket(session, Opcodes.MSG_PARTY_INVITE_RES.opcode, Opcodes.MSG_PARTY_INVITE_RES.subcode, {
        success: true,
        partyId,
        targetSessionId: targetSession.sessionId,
        message: `${targetSession.character.name} entrou no grupo`,
      });

      this.sendPacket(targetSession, Opcodes.MSG_PARTY_RESPOND_INVITE_RES.opcode, Opcodes.MSG_PARTY_RESPOND_INVITE_RES.subcode, {
        success: true,
        partyId,
        memberCount: members.length,
        isGoldParty,
        members,
      });
    } else {
      this.sendPacket(session, Opcodes.MSG_PARTY_INVITE_RES.opcode, Opcodes.MSG_PARTY_INVITE_RES.subcode, {
        success: false,
        error: 'Grupo lotado (máximo 5 membros)',
      });
    }
  }

  private handlePartyRespondInviteReq(session: ClientSession, req: PartyRespondInviteReqPayload): void {
    if (!req?.accept) return;
    const members = this.partyManager.getParty(req.partyId) || [];
    this.sendPacket(session, Opcodes.MSG_PARTY_RESPOND_INVITE_RES.opcode, Opcodes.MSG_PARTY_RESPOND_INVITE_RES.subcode, {
      success: true,
      partyId: req.partyId,
      memberCount: members.length,
      isGoldParty: PartyManager.isGoldParty(members),
      members,
    });
  }

  private handlePartyLeaveReq(session: ClientSession): void {
    if (!session.partyId) {
      this.sendPacket(session, Opcodes.MSG_PARTY_LEAVE_RES.opcode, Opcodes.MSG_PARTY_LEAVE_RES.subcode, {
        success: false,
        message: 'Você não está em um grupo',
      });
      return;
    }

    const res = this.partyManager.removeMember(session.sessionId);
    session.partyId = undefined;

    this.sendPacket(session, Opcodes.MSG_PARTY_LEAVE_RES.opcode, Opcodes.MSG_PARTY_LEAVE_RES.subcode, {
      success: true,
      message: 'Você saiu do grupo',
    });

    if (res && !res.disbanded) {
      for (const m of res.remaining) {
        const s = this.sessionManager.getSession(m.sessionId);
        if (s) {
          this.sendPacket(s, Opcodes.MSG_PARTY_INFO_RES.opcode, Opcodes.MSG_PARTY_INFO_RES.subcode, {
            partyId: res.partyId,
            isGoldParty: PartyManager.isGoldParty(res.remaining),
            memberCount: res.remaining.length,
            members: res.remaining,
          });
        }
      }
    }
  }

  private handleTradeRequestReq(session: ClientSession, req: TradeRequestReqPayload): void {
    const target = this.sessionManager.getSession(req?.targetSessionId);
    if (!target) {
      this.sendPacket(session, Opcodes.MSG_TRADE_REQUEST_RES.opcode, Opcodes.MSG_TRADE_REQUEST_RES.subcode, {
        success: false,
        error: 'Jogador alvo não encontrado',
      });
      return;
    }

    const tradeRes = this.tradeManager.requestTrade(
      session.sessionId,
      session.character.name,
      target.sessionId,
      target.character.name
    );

    if (tradeRes.success && tradeRes.tradeSession) {
      session.activeTradeId = tradeRes.tradeSession.tradeId;
      target.activeTradeId = tradeRes.tradeSession.tradeId;

      const payload = {
        success: true,
        tradeId: tradeRes.tradeSession.tradeId,
        initiatorSessionId: session.sessionId,
        initiatorName: session.character.name,
        targetSessionId: target.sessionId,
        targetName: target.character.name,
        message: tradeRes.message,
      };

      this.sendPacket(session, Opcodes.MSG_TRADE_REQUEST_RES.opcode, Opcodes.MSG_TRADE_REQUEST_RES.subcode, payload);
      this.sendPacket(target, Opcodes.MSG_TRADE_REQUEST_RES.opcode, Opcodes.MSG_TRADE_REQUEST_RES.subcode, payload);
    } else {
      this.sendPacket(session, Opcodes.MSG_TRADE_REQUEST_RES.opcode, Opcodes.MSG_TRADE_REQUEST_RES.subcode, {
        success: false,
        error: tradeRes.message,
      });
    }
  }

  private handleTradeRespondReq(session: ClientSession, req: TradeRespondReqPayload): void {
    if (!req?.accept) {
      this.tradeManager.cancelTrade(session.sessionId);
      session.activeTradeId = undefined;
      this.sendPacket(session, Opcodes.MSG_TRADE_RESPOND_RES.opcode, Opcodes.MSG_TRADE_RESPOND_RES.subcode, {
        success: false,
        tradeId: req.tradeId,
        state: 'CANCELLED',
        message: 'Negociação recusada',
      });
      return;
    }

    this.sendPacket(session, Opcodes.MSG_TRADE_RESPOND_RES.opcode, Opcodes.MSG_TRADE_RESPOND_RES.subcode, {
      success: true,
      tradeId: req.tradeId,
      state: 'OFFERING',
      message: 'Negociação aceita',
    });
  }

  private handleTradeItemAddReq(session: ClientSession, req: TradeItemAddReqPayload): void {
    const item = session.inventory.getItemByUuid(req.itemUuid);
    if (!item) {
      this.sendPacket(session, Opcodes.MSG_TRADE_ITEM_ADD_RES.opcode, Opcodes.MSG_TRADE_ITEM_ADD_RES.subcode, {
        success: false,
        tradeId: req.tradeId,
        error: 'Item não encontrado no inventário',
      });
      return;
    }

    const offerResult = this.tradeManager.offerItem(session.sessionId, item);
    this.sendPacket(session, Opcodes.MSG_TRADE_ITEM_ADD_RES.opcode, Opcodes.MSG_TRADE_ITEM_ADD_RES.subcode, {
      success: offerResult.success,
      tradeId: req.tradeId,
      item: offerResult.success ? item : undefined,
      error: offerResult.success ? undefined : offerResult.message,
    });
  }

  private handleTradeZenAddReq(session: ClientSession, req: TradeZenAddReqPayload): void {
    if ((session.character.zen ?? 0) < req.amountZen) {
      this.sendPacket(session, Opcodes.MSG_TRADE_ZEN_ADD_RES.opcode, Opcodes.MSG_TRADE_ZEN_ADD_RES.subcode, {
        success: false,
        tradeId: req.tradeId,
        zenOffered: 0,
        error: 'Zen insuficiente',
      });
      return;
    }

    const offerResult = this.tradeManager.offerZen(session.sessionId, req.amountZen);
    this.sendPacket(session, Opcodes.MSG_TRADE_ZEN_ADD_RES.opcode, Opcodes.MSG_TRADE_ZEN_ADD_RES.subcode, {
      success: offerResult.success,
      tradeId: req.tradeId,
      zenOffered: req.amountZen,
      error: offerResult.success ? undefined : offerResult.message,
    });
  }

  private handleTradeConfirmReq(session: ClientSession, req: TradeConfirmReqPayload): void {
    const trade = this.tradeManager.getTradeBySession(session.sessionId);
    if (!trade) {
      this.sendPacket(session, Opcodes.MSG_TRADE_CONFIRM_RES.opcode, Opcodes.MSG_TRADE_CONFIRM_RES.subcode, {
        success: false,
        tradeId: req.tradeId,
        completed: false,
        state: 'CANCELLED',
        error: 'Negociação não encontrada',
      });
      return;
    }

    const targetSessionId = trade.initiator.sessionId === session.sessionId
      ? trade.target.sessionId
      : trade.initiator.sessionId;
    const targetSession = this.sessionManager.getSession(targetSessionId);

    const result = this.tradeManager.acceptTrade(session.sessionId);

    if (result.isFullyCommitted && targetSession) {
      const p1 = trade.initiator;
      const p2 = trade.target;
      const s1 = this.sessionManager.getSession(p1.sessionId);
      const s2 = this.sessionManager.getSession(p2.sessionId);

      if (s1 && s2) {
        for (const item of p1.items) s1.inventory.removeItem(item.uuid);
        for (const item of p2.items) s2.inventory.removeItem(item.uuid);

        for (const item of p1.items) s2.inventory.addItem(item);
        for (const item of p2.items) s1.inventory.addItem(item);

        s1.character.zen = (s1.character.zen ?? 0) - p1.zen + p2.zen;
        s2.character.zen = (s2.character.zen ?? 0) - p2.zen + p1.zen;

        s1.activeTradeId = undefined;
        s2.activeTradeId = undefined;

        this.sendPacket(s1, Opcodes.MSG_TRADE_CONFIRM_RES.opcode, Opcodes.MSG_TRADE_CONFIRM_RES.subcode, {
          success: true,
          tradeId: req.tradeId,
          completed: true,
          state: 'COMMITTED',
          character: s1.character,
          inventoryState: this.sessionManager.getSerializedInventoryState(s1),
          message: 'Negociação concluída com sucesso!',
        });

        this.sendPacket(s2, Opcodes.MSG_TRADE_CONFIRM_RES.opcode, Opcodes.MSG_TRADE_CONFIRM_RES.subcode, {
          success: true,
          tradeId: req.tradeId,
          completed: true,
          state: 'COMMITTED',
          character: s2.character,
          inventoryState: this.sessionManager.getSerializedInventoryState(s2),
          message: 'Negociação concluída com sucesso!',
        });
      }
    } else {
      this.sendPacket(session, Opcodes.MSG_TRADE_CONFIRM_RES.opcode, Opcodes.MSG_TRADE_CONFIRM_RES.subcode, {
        success: result.success,
        tradeId: req.tradeId,
        completed: false,
        state: trade.state,
        message: result.message,
      });
    }
  }

  private handleTradeCancelReq(session: ClientSession, req: TradeCancelReqPayload): void {
    const trade = this.tradeManager.getTradeBySession(session.sessionId);
    this.tradeManager.cancelTrade(session.sessionId);
    session.activeTradeId = undefined;

    this.sendPacket(session, Opcodes.MSG_TRADE_CANCEL_RES.opcode, Opcodes.MSG_TRADE_CANCEL_RES.subcode, {
      success: true,
      tradeId: req.tradeId,
      state: 'CANCELLED',
      inventoryState: this.sessionManager.getSerializedInventoryState(session),
      message: 'Negociação cancelada',
    });

    if (trade) {
      const otherId = trade.initiator.sessionId === session.sessionId ? trade.target.sessionId : trade.initiator.sessionId;
      const otherSession = this.sessionManager.getSession(otherId);
      if (otherSession) {
        otherSession.activeTradeId = undefined;
        this.sendPacket(otherSession, Opcodes.MSG_TRADE_CANCEL_RES.opcode, Opcodes.MSG_TRADE_CANCEL_RES.subcode, {
          success: true,
          tradeId: req.tradeId,
          state: 'CANCELLED',
          inventoryState: this.sessionManager.getSerializedInventoryState(otherSession),
          message: 'O parceiro cancelou a negociação',
        });
      }
    }
  }

  private handlePShopOpenReq(session: ClientSession, req: PShopOpenReqPayload): void {
    const res = this.personalShopManager.openShop(
      session.sessionId,
      session.character.name,
      req.title,
      req.items as PShopItemEntry[]
    );

    if (res.success) {
      session.pshopOpen = true;
      session.pshopTitle = req.title;
      this.sendPacket(session, Opcodes.MSG_PSHOP_OPEN_RES.opcode, Opcodes.MSG_PSHOP_OPEN_RES.subcode, {
        success: true,
        title: req.title,
        itemCount: req.items.length,
      });
    } else {
      this.sendPacket(session, Opcodes.MSG_PSHOP_OPEN_RES.opcode, Opcodes.MSG_PSHOP_OPEN_RES.subcode, {
        success: false,
        error: res.error,
      });
    }
  }

  private handlePShopCloseReq(session: ClientSession): void {
    this.personalShopManager.closeShop(session.sessionId);
    session.pshopOpen = false;
    session.pshopTitle = undefined;
    this.sendPacket(session, Opcodes.MSG_PSHOP_CLOSE_RES.opcode, Opcodes.MSG_PSHOP_CLOSE_RES.subcode, {
      success: true,
      message: 'Loja pessoal fechada',
    });
  }

  private handlePShopInspectReq(session: ClientSession, req: PShopInspectReqPayload): void {
    const shop = this.personalShopManager.getShop(req.sellerSessionId);
    if (!shop || !shop.isOpen) {
      this.sendPacket(session, Opcodes.MSG_PSHOP_INSPECT_RES.opcode, Opcodes.MSG_PSHOP_INSPECT_RES.subcode, {
        success: false,
        error: 'Loja não encontrada ou fechada',
      });
      return;
    }

    this.sendPacket(session, Opcodes.MSG_PSHOP_INSPECT_RES.opcode, Opcodes.MSG_PSHOP_INSPECT_RES.subcode, {
      success: true,
      sellerSessionId: req.sellerSessionId,
      ownerName: shop.ownerName,
      title: shop.storeTitle,
      items: Array.from(shop.items.values()),
    });
  }

  private handlePShopBuyReq(session: ClientSession, req: PShopBuyReqPayload): void {
    const seller = this.sessionManager.getSession(req.sellerSessionId);
    if (!seller) {
      this.sendPacket(session, Opcodes.MSG_PSHOP_BUY_RES.opcode, Opcodes.MSG_PSHOP_BUY_RES.subcode, {
        success: false,
        error: 'Vendedor não encontrado',
      });
      return;
    }

    const buyerZen = session.character.zen ?? 0;
    const sellerZen = seller.character.zen ?? 0;

    const res = this.personalShopManager.purchaseItem(
      session.sessionId,
      seller.sessionId,
      req.slot,
      buyerZen,
      sellerZen,
      0,
      0,
      0,
      0
    );

    if (res.success && res.item) {
      session.character.zen = res.newBuyerZen;
      seller.character.zen = res.newSellerZen;

      const itemInstance = seller.inventory.getItemByUuid(res.item.itemId);
      if (itemInstance) {
        seller.inventory.removeItem(itemInstance.uuid);
        session.inventory.addItem(itemInstance);
      }

      this.sendPacket(session, Opcodes.MSG_PSHOP_BUY_RES.opcode, Opcodes.MSG_PSHOP_BUY_RES.subcode, {
        success: true,
        sellerSessionId: seller.sessionId,
        slot: req.slot,
        boughtItem: itemInstance,
        buyerZen: session.character.zen,
        inventoryState: this.sessionManager.getSerializedInventoryState(session),
      });

      this.sendPacket(seller, Opcodes.MSG_INVENTORY_SYNC_ALL.opcode, Opcodes.MSG_INVENTORY_SYNC_ALL.subcode, {
        character: seller.character,
        inventoryState: this.sessionManager.getSerializedInventoryState(seller),
      });
    } else {
      this.sendPacket(session, Opcodes.MSG_PSHOP_BUY_RES.opcode, Opcodes.MSG_PSHOP_BUY_RES.subcode, {
        success: false,
        error: res.error,
      });
    }
  }

  private handleResetReq(session: ClientSession): void {
    const resetState = {
      characterId: session.sessionId,
      level: session.character.level,
      resets: session.resets ?? 0,
      masterResets: session.masterResets ?? 0,
      zen: session.character.zen ?? 0,
      wCoins: session.wCoins ?? 0,
      strength: session.character.strength,
      agility: session.character.agility,
      vitality: session.character.vitality,
      energy: session.character.energy,
      leadership: session.character.command ?? 0,
      statPoints: session.character.statPoints ?? 0,
    };

    const res = ResetManager.executeReset(resetState);

    if (res.success) {
      session.character.level = resetState.level;
      session.character.zen = resetState.zen;
      session.character.strength = resetState.strength;
      session.character.agility = resetState.agility;
      session.character.vitality = resetState.vitality;
      session.character.energy = resetState.energy;
      session.character.command = resetState.leadership;
      session.character.statPoints = resetState.statPoints;
      session.resets = resetState.resets;

      this.sendPacket(session, Opcodes.MSG_RESET_RES.opcode, Opcodes.MSG_RESET_RES.subcode, {
        success: true,
        resets: session.resets,
        level: session.character.level,
        statPoints: session.character.statPoints,
        zenRemaining: session.character.zen,
        character: session.character,
      });
    } else {
      this.sendPacket(session, Opcodes.MSG_RESET_RES.opcode, Opcodes.MSG_RESET_RES.subcode, {
        success: false,
        resets: session.resets ?? 0,
        level: session.character.level,
        statPoints: session.character.statPoints ?? 0,
        zenRemaining: session.character.zen ?? 0,
        error: res.error,
      });
    }
  }

  private handleMasterResetReq(session: ClientSession): void {
    const resetState = {
      characterId: session.sessionId,
      level: session.character.level,
      resets: session.resets ?? 0,
      masterResets: session.masterResets ?? 0,
      zen: session.character.zen ?? 0,
      wCoins: session.wCoins ?? 0,
      strength: session.character.strength,
      agility: session.character.agility,
      vitality: session.character.vitality,
      energy: session.character.energy,
      leadership: session.character.command ?? 0,
      statPoints: session.character.statPoints ?? 0,
    };

    const res = ResetManager.executeMasterReset(resetState);

    if (res.success) {
      session.character.level = resetState.level;
      session.resets = resetState.resets;
      session.masterResets = resetState.masterResets;
      session.wCoins = resetState.wCoins;
      session.character.statPoints = resetState.statPoints;

      this.sendPacket(session, Opcodes.MSG_MASTER_RESET_RES.opcode, Opcodes.MSG_MASTER_RESET_RES.subcode, {
        success: true,
        masterResets: session.masterResets,
        resetsRemaining: session.resets,
        wCoinsGranted: 500,
        masterPointsGranted: 10,
        character: session.character,
      });
    } else {
      this.sendPacket(session, Opcodes.MSG_MASTER_RESET_RES.opcode, Opcodes.MSG_MASTER_RESET_RES.subcode, {
        success: false,
        masterResets: session.masterResets ?? 0,
        resetsRemaining: session.resets ?? 0,
        wCoinsGranted: 0,
        masterPointsGranted: 0,
        error: res.error,
      });
    }
  }

  private handleQuestInfoReq(session: ClientSession): void {
    const prog = session.progressionState;
    if (!prog) return;

    this.sendPacket(session, Opcodes.MSG_QUEST_INFO_RES.opcode, Opcodes.MSG_QUEST_INFO_RES.subcode, {
      success: true,
      characterId: prog.characterId,
      classTier: prog.classTier,
      hasComboUnlocked: prog.hasComboUnlocked,
      hasMasterLevelUnlocked: prog.hasMasterLevelUnlocked,
      quests: prog.quests,
    });
  }

  private handleQuestActionReq(session: ClientSession, req: QuestActionReqPayload): void {
    const prog = session.progressionState;
    if (!prog) return;

    let success = false;
    let message = '';

    if (req.questId === 'SEBINA_PRIEST_PART1') {
      if (req.action === 'START') {
        success = QuestManager.startSebinaPart1(prog);
        message = success ? 'Quest de Sebina Parte 1 iniciada' : 'Requisitos não atendidos';
      } else {
        prog.inventoryItemIds.push('scroll_of_emperor');
        success = QuestManager.completeSebinaPart1(prog);
        message = success ? 'Quest de Sebina Parte 1 concluída (+10 pontos)' : 'Item não encontrado';
      }
    } else if (req.questId === 'SEBINA_PRIEST_PART2') {
      prog.inventoryItemIds.push('broken_sword');
      success = QuestManager.completeSebinaPart2(prog);
      message = success ? 'Evolução para 2ª Classe concluída!' : 'Falha na evolução';
    } else if (req.questId === 'MARLON_HONOR_RING') {
      prog.inventoryItemIds.push('ring_of_honor');
      success = QuestManager.completeMarlonPart1(prog);
      message = success ? 'Quest de Marlon Parte 1 concluída (+6 pontos por nível)' : 'Requisitos não atendidos';
    } else if (req.questId === 'MARLON_DARK_STONE') {
      prog.inventoryItemIds.push('dark_stone');
      success = QuestManager.completeMarlonPart2(prog);
      message = success ? 'Combo do Blade Knight desbloqueado!' : 'Requisitos não atendidos';
    } else if (req.questId?.startsWith('DEVIN')) {
      prog.inventoryItemIds.push('flame_of_death_beam_knight', 'horn_of_hell_maine', 'feather_of_phoenix');
      success = QuestManager.completeDevinThirdClassChange(prog);
      message = success ? 'Evolução para 3ª Classe concluída com Apostle Devin!' : 'Falha na evolução Devin';
    }

    this.sendPacket(session, Opcodes.MSG_QUEST_ACTION_RES.opcode, Opcodes.MSG_QUEST_ACTION_RES.subcode, {
      success,
      questId: req.questId,
      completed: success,
      classTier: prog.classTier,
      hasComboUnlocked: prog.hasComboUnlocked,
      statPointsBonus: prog.statPoints,
      message,
    });
  }

  private handleMasterSkillAllocReq(session: ClientSession, req: MasterSkillAllocReqPayload): void {
    const tree = session.masterTreeState;
    if (!tree) return;

    const res = MasterSkillTree.investSkillPoint(tree, req.skillId);
    const node = tree.skills.get(req.skillId);

    this.sendPacket(session, Opcodes.MSG_MASTER_SKILL_ALLOC_RES.opcode, Opcodes.MSG_MASTER_SKILL_ALLOC_RES.subcode, {
      success: res.success,
      skillId: req.skillId,
      newLevel: node?.currentLevel ?? 0,
      availablePoints: tree.availableMasterPoints,
      error: res.error,
    });
  }

  private handleGensJoinReq(session: ClientSession, req: GensJoinReqPayload): void {
    session.gensFamily = req.family;
    session.gensContribution = session.gensContribution ?? 0;
    session.gensRank = session.gensRank ?? 100;

    const symbol = GensSystem.calculateGensSymbol(session.gensContribution, session.gensRank);

    this.sendPacket(session, Opcodes.MSG_GENS_JOIN_RES.opcode, Opcodes.MSG_GENS_JOIN_RES.subcode, {
      success: true,
      family: session.gensFamily,
      symbol,
      contribution: session.gensContribution,
      rank: session.gensRank,
    });
  }

  private handleGensStatusReq(session: ClientSession): void {
    const family = session.gensFamily ?? 0;
    const contribution = session.gensContribution ?? 0;
    const rank = session.gensRank ?? 0;
    const symbol = GensSystem.calculateGensSymbol(contribution, rank);

    this.sendPacket(session, Opcodes.MSG_GENS_STATUS_RES.opcode, Opcodes.MSG_GENS_STATUS_RES.subcode, {
      success: true,
      family,
      symbol,
      contribution,
      rank,
    });
  }

  private handleGensLeaveReq(session: ClientSession): void {
    session.gensFamily = 0;
    session.gensContribution = 0;
    this.sendPacket(session, Opcodes.MSG_GENS_LEAVE_RES.opcode, Opcodes.MSG_GENS_LEAVE_RES.subcode, {
      success: true,
      penaltyFeeZen: 0,
      message: 'Você abandonou sua família Gens',
    });
  }

  private handleHarmonySmeltReq(session: ClientSession, req: HarmonySmeltReqPayload): void {
    const target = session.inventory.getItemByUuid(req.targetItemUuid);
    if (!target) {
      this.sendPacket(session, Opcodes.MSG_HARMONY_SMELT_RES.opcode, Opcodes.MSG_HARMONY_SMELT_RES.subcode, {
        success: false,
        targetItemUuid: req.targetItemUuid,
        error: 'Item alvo não encontrado',
      });
      return;
    }

    const res = HarmonyAnd380System.applyJewelOfHarmony(target);

    this.sendPacket(session, Opcodes.MSG_HARMONY_SMELT_RES.opcode, Opcodes.MSG_HARMONY_SMELT_RES.subcode, {
      success: res.success,
      targetItemUuid: req.targetItemUuid,
      optionName: res.option?.name,
      optionValue: res.option?.values[res.rank ?? 0],
      inventoryState: this.sessionManager.getSerializedInventoryState(session),
      error: res.success ? undefined : res.message,
    });
  }

  private handleHarmonyRestoreReq(session: ClientSession, req: HarmonyRestoreReqPayload): void {
    const target = session.inventory.getItemByUuid(req.targetItemUuid);
    if (!target) {
      this.sendPacket(session, Opcodes.MSG_HARMONY_RESTORE_RES.opcode, Opcodes.MSG_HARMONY_RESTORE_RES.subcode, {
        success: false,
        targetItemUuid: req.targetItemUuid,
        restored: false,
        error: 'Item não encontrado',
      });
      return;
    }

    const res = HarmonyAnd380System.removeHarmonyOption(target);
    this.sendPacket(session, Opcodes.MSG_HARMONY_RESTORE_RES.opcode, Opcodes.MSG_HARMONY_RESTORE_RES.subcode, {
      success: res.success,
      targetItemUuid: req.targetItemUuid,
      restored: res.success,
      inventoryState: this.sessionManager.getSerializedInventoryState(session),
      error: res.success ? undefined : res.message,
    });
  }

  private handleSocketMountReq(session: ClientSession, req: SocketMountReqPayload): void {
    const target = session.inventory.getItemByUuid(req.targetItemUuid);
    if (!target) {
      this.sendPacket(session, Opcodes.MSG_SOCKET_MOUNT_RES.opcode, Opcodes.MSG_SOCKET_MOUNT_RES.subcode, {
        success: false,
        targetItemUuid: req.targetItemUuid,
        socketIndex: req.socketIndex,
        error: 'Item alvo não encontrado',
      });
      return;
    }

    if (!target.socketOptions || target.socketOptions.length < 5) {
      target.socketOptions = [254, 254, 254, 255, 255];
    }

    const itemDef = ITEM_DEFINITIONS[target.defId];
    const isWeapon = itemDef?.category === ItemCategory.WEAPON;
    const isStaff = target.defId.includes('staff');
    const res = SocketItemSystem.mountSeedSphere(
      target.socketOptions as [number, number, number, number, number],
      req.socketIndex,
      1,
      1,
      isWeapon,
      isStaff
    );

    if (res.success) {
      target.socketOptions = res.newSlots;
      target.socketBonusOption = res.bonusOption;
    }

    this.sendPacket(session, Opcodes.MSG_SOCKET_MOUNT_RES.opcode, Opcodes.MSG_SOCKET_MOUNT_RES.subcode, {
      success: res.success,
      targetItemUuid: req.targetItemUuid,
      socketIndex: req.socketIndex,
      mountedSphere: res.success ? 'Seed Sphere Tier 1' : undefined,
      inventoryState: this.sessionManager.getSerializedInventoryState(session),
      error: res.error,
    });
  }

  private handleSocketUnmountReq(session: ClientSession, req: SocketUnmountReqPayload): void {
    const target = session.inventory.getItemByUuid(req.targetItemUuid);
    if (!target || !target.socketOptions) {
      this.sendPacket(session, Opcodes.MSG_SOCKET_UNMOUNT_RES.opcode, Opcodes.MSG_SOCKET_UNMOUNT_RES.subcode, {
        success: false,
        targetItemUuid: req.targetItemUuid,
        socketIndex: req.socketIndex,
        unmounted: false,
        error: 'Item ou slots de socket não encontrados',
      });
      return;
    }

    const itemDef = ITEM_DEFINITIONS[target.defId];
    const isWeapon = itemDef?.category === ItemCategory.WEAPON;
    const isStaff = target.defId.includes('staff');
    const res = SocketItemSystem.unmountSeedSphere(
      target.socketOptions as [number, number, number, number, number],
      req.socketIndex,
      isWeapon,
      isStaff
    );

    if (res.success) {
      target.socketOptions = res.newSlots;
      target.socketBonusOption = res.bonusOption;
    }

    this.sendPacket(session, Opcodes.MSG_SOCKET_UNMOUNT_RES.opcode, Opcodes.MSG_SOCKET_UNMOUNT_RES.subcode, {
      success: res.success,
      targetItemUuid: req.targetItemUuid,
      socketIndex: req.socketIndex,
      unmounted: res.success,
      inventoryState: this.sessionManager.getSerializedInventoryState(session),
      error: res.error,
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

      // Coleta posições dos jogadores ativos para a IA dos monstros
      const activePlayers = this.sessionManager.getAllSessions()
        .filter((s) => s.state === 'AUTHENTICATED' && s.x !== undefined && s.y !== undefined)
        .map((s) => ({ id: s.sessionId, x: s.x!, y: s.y! }));

      const updateResult = this.combatEngine.update(0.1, activePlayers);

      if (updateResult.hasMoved || updateResult.respawned.length > 0 || updateResult.despawnedIds.length > 0 || (updateResult.attacks && updateResult.attacks.length > 0)) {
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

      // Ciclo do Cerco ao Castelo (canalização do Selo da Coroa e prazo da batalha)
      const previousPhase = this.castleSiege.phase;
      const siegeState = this.castleSiege.update(now);
      if (siegeState.phase !== previousPhase || siegeState.sealPercent > 0) {
        this.broadcastSiegeState();
      }

      // Ciclo dos Efeitos e Buffs dos Jogadores (Decaimento Temporal)
      for (const session of this.sessionManager.getAllSessions()) {
        if (session.state === 'AUTHENTICATED' && session.effectManager) {
          session.effectManager.tick(0.1);
        }
      }

      // Ciclo dos Portais de Kalima (expiração de 180s)
      for (const [id, portal] of this.activeKalimaPortals.entries()) {
        if (now > portal.expiresAt) {
          this.activeKalimaPortals.delete(id);
        }
      }

      // Auto-save periódico de personagens (a cada 60 segundos)
      if (now - this.lastAutoSaveTime > 60000) {
        this.lastAutoSaveTime = now;
        for (const session of this.sessionManager.getAllSessions()) {
          if (session.state === 'AUTHENTICATED') {
            this.characterRepository.saveFromSession(session).catch(() => {});
          }
        }
      }
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
  const server = new GameServer({ port, host: process.env.HOST ?? '127.0.0.1', enableDevControls: process.env.DASI_DEV_CONTROLS === '1' });
  server.start().catch((err) => {
    console.error('Falha ao iniciar o GameServer:', err);
    process.exit(1);
  });
}
