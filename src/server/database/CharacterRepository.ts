/**
 * Dasi MMORPG - Repositório Canônico de Personagens & Persistência Autoritativa
 * Implementação do armazenamento de personagens com SQLite nativo (node:sqlite) e
 * serialização binária de 16 bytes por item (1.728 bytes para inventário 108 slots e 3.840 bytes para Baú 240 slots).
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import type { ClientSession } from '../network/SessionManager.ts';
import { BinaryItemSerializer } from './BinaryItemSerializer.ts';
import { QuestManager, type CharacterProgressionState } from '../progression/QuestManager.ts';
import { MasterSkillTree, type MasterSkillTreeState } from '../progression/MasterSkillTree.ts';
import { GridInventory } from '../inventory/GridInventory.ts';

export interface CharacterRecord {
  name: string;
  account: string;
  class: 'DK' | 'DW' | 'ELF' | 'MG' | 'DL';
  level: number;
  resets: number;
  masterResets: number;
  zen: number;
  wCoins: number;
  strength: number;
  agility: number;
  vitality: number;
  energy: number;
  command: number;
  statPoints: number;
  currentMap: number;
  x: number;
  y: number;
  pkLevel: number;
  pkCount: number;
  inventoryBinary: Buffer; // 1.728 bytes (108 slots * 16 bytes)
  warehouseBinary: Buffer; // 3.840 bytes (240 slots * 16 bytes)
  inventoryJson?: string;
  warehouseJson?: string;
  progression: CharacterProgressionState;
  masterTree: MasterSkillTreeState;
  gensFamily: number | null;
  gensContribution: number;
  gensRank: number;
  updatedAt: number;
}

export class CharacterRepository {
  private db: DatabaseSync;
  private records: Map<string, CharacterRecord> = new Map();
  public readonly dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath ?? path.resolve(process.cwd(), 'data/dasi.sqlite');

    if (this.dbPath !== ':memory:') {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    this.db = new DatabaseSync(this.dbPath);
    this.initSchema();
    this.loadAllFromDb();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS characters (
        name TEXT PRIMARY KEY COLLATE NOCASE,
        account TEXT NOT NULL,
        class TEXT NOT NULL,
        level INTEGER NOT NULL,
        resets INTEGER NOT NULL DEFAULT 0,
        masterResets INTEGER NOT NULL DEFAULT 0,
        zen INTEGER NOT NULL DEFAULT 0,
        wCoins INTEGER NOT NULL DEFAULT 0,
        strength INTEGER NOT NULL,
        agility INTEGER NOT NULL,
        vitality INTEGER NOT NULL,
        energy INTEGER NOT NULL,
        command INTEGER NOT NULL DEFAULT 0,
        statPoints INTEGER NOT NULL DEFAULT 0,
        currentMap INTEGER NOT NULL DEFAULT 0,
        x REAL NOT NULL DEFAULT 125,
        y REAL NOT NULL DEFAULT 125,
        pkLevel INTEGER NOT NULL DEFAULT 3,
        pkCount INTEGER NOT NULL DEFAULT 0,
        inventoryBinary BLOB NOT NULL,
        warehouseBinary BLOB NOT NULL,
        inventoryJson TEXT,
        warehouseJson TEXT,
        progression TEXT NOT NULL,
        masterTree TEXT NOT NULL,
        gensFamily INTEGER,
        gensContribution INTEGER NOT NULL DEFAULT 0,
        gensRank INTEGER NOT NULL DEFAULT 0,
        updatedAt INTEGER NOT NULL
      );
    `);
  }

  private loadAllFromDb(): void {
    const rows = this.db.prepare('SELECT * FROM characters').all() as any[];
    for (const row of rows) {
      const record: CharacterRecord = {
        name: row.name,
        account: row.account,
        class: row.class as any,
        level: Number(row.level),
        resets: Number(row.resets),
        masterResets: Number(row.masterResets),
        zen: Number(row.zen),
        wCoins: Number(row.wCoins),
        strength: Number(row.strength),
        agility: Number(row.agility),
        vitality: Number(row.vitality),
        energy: Number(row.energy),
        command: Number(row.command),
        statPoints: Number(row.statPoints),
        currentMap: Number(row.currentMap),
        x: Number(row.x),
        y: Number(row.y),
        pkLevel: Number(row.pkLevel),
        pkCount: Number(row.pkCount),
        inventoryBinary: Buffer.from(row.inventoryBinary),
        warehouseBinary: Buffer.from(row.warehouseBinary),
        inventoryJson: row.inventoryJson ?? undefined,
        warehouseJson: row.warehouseJson ?? undefined,
        progression: JSON.parse(row.progression),
        masterTree: JSON.parse(row.masterTree),
        gensFamily: row.gensFamily !== null && row.gensFamily !== undefined ? Number(row.gensFamily) : null,
        gensContribution: Number(row.gensContribution),
        gensRank: Number(row.gensRank),
        updatedAt: Number(row.updatedAt),
      };
      this.records.set(record.name.toLowerCase(), record);
    }
  }

  /**
   * Salva um registro de personagem na base de dados
   */
  public async saveCharacter(record: CharacterRecord): Promise<void> {
    record.updatedAt = Date.now();
    this.records.set(record.name.toLowerCase(), record);

    const stmt = this.db.prepare(`
      INSERT INTO characters (
        name, account, class, level, resets, masterResets, zen, wCoins,
        strength, agility, vitality, energy, command, statPoints,
        currentMap, x, y, pkLevel, pkCount,
        inventoryBinary, warehouseBinary, inventoryJson, warehouseJson,
        progression, masterTree, gensFamily, gensContribution, gensRank, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(name) DO UPDATE SET
        account=excluded.account,
        class=excluded.class,
        level=excluded.level,
        resets=excluded.resets,
        masterResets=excluded.masterResets,
        zen=excluded.zen,
        wCoins=excluded.wCoins,
        strength=excluded.strength,
        agility=excluded.agility,
        vitality=excluded.vitality,
        energy=excluded.energy,
        command=excluded.command,
        statPoints=excluded.statPoints,
        currentMap=excluded.currentMap,
        x=excluded.x,
        y=excluded.y,
        pkLevel=excluded.pkLevel,
        pkCount=excluded.pkCount,
        inventoryBinary=excluded.inventoryBinary,
        warehouseBinary=excluded.warehouseBinary,
        inventoryJson=excluded.inventoryJson,
        warehouseJson=excluded.warehouseJson,
        progression=excluded.progression,
        masterTree=excluded.masterTree,
        gensFamily=excluded.gensFamily,
        gensContribution=excluded.gensContribution,
        gensRank=excluded.gensRank,
        updatedAt=excluded.updatedAt;
    `);

    stmt.run(
      record.name,
      record.account,
      record.class,
      record.level,
      record.resets,
      record.masterResets,
      record.zen,
      record.wCoins,
      record.strength,
      record.agility,
      record.vitality,
      record.energy,
      record.command,
      record.statPoints,
      record.currentMap,
      record.x,
      record.y,
      record.pkLevel,
      record.pkCount,
      record.inventoryBinary,
      record.warehouseBinary,
      record.inventoryJson ?? null,
      record.warehouseJson ?? null,
      JSON.stringify(record.progression),
      JSON.stringify(record.masterTree),
      record.gensFamily,
      record.gensContribution,
      record.gensRank,
      record.updatedAt
    );
  }

  /**
   * Carrega um registro pelo nome do personagem
   */
  public async loadCharacter(name: string): Promise<CharacterRecord | null> {
    const cached = this.records.get(name.toLowerCase());
    if (cached) return cached;

    const row = this.db.prepare('SELECT * FROM characters WHERE name = ? COLLATE NOCASE').get(name) as any;
    if (!row) return null;

    const record: CharacterRecord = {
      name: row.name,
      account: row.account,
      class: row.class as any,
      level: Number(row.level),
      resets: Number(row.resets),
      masterResets: Number(row.masterResets),
      zen: Number(row.zen),
      wCoins: Number(row.wCoins),
      strength: Number(row.strength),
      agility: Number(row.agility),
      vitality: Number(row.vitality),
      energy: Number(row.energy),
      command: Number(row.command),
      statPoints: Number(row.statPoints),
      currentMap: Number(row.currentMap),
      x: Number(row.x),
      y: Number(row.y),
      pkLevel: Number(row.pkLevel),
      pkCount: Number(row.pkCount),
      inventoryBinary: Buffer.from(row.inventoryBinary),
      warehouseBinary: Buffer.from(row.warehouseBinary),
      inventoryJson: row.inventoryJson ?? undefined,
      warehouseJson: row.warehouseJson ?? undefined,
      progression: JSON.parse(row.progression),
      masterTree: JSON.parse(row.masterTree),
      gensFamily: row.gensFamily !== null && row.gensFamily !== undefined ? Number(row.gensFamily) : null,
      gensContribution: Number(row.gensContribution),
      gensRank: Number(row.gensRank),
      updatedAt: Number(row.updatedAt),
    };

    this.records.set(record.name.toLowerCase(), record);
    return record;
  }

  /**
   * Salva os dados autoritativos de uma ClientSession ativa
   */
  public async saveFromSession(session: ClientSession): Promise<CharacterRecord> {
    const char = session.character;
    const inventoryItems = session.inventory.getAllGridItems();
    const inventoryBinary = BinaryItemSerializer.serializeInventory(inventoryItems);
    const warehouseBinary = BinaryItemSerializer.serializeWarehouse([]);
    const inventoryJson = JSON.stringify(session.inventory.serialize());

    const record: CharacterRecord = {
      name: char.name,
      account: session.sessionId,
      class: (char.characterClass || 'DK') as any,
      level: char.level,
      resets: session.resets ?? 0,
      masterResets: session.masterResets ?? 0,
      zen: char.zen,
      wCoins: session.wCoins ?? 0,
      strength: char.strength,
      agility: char.agility,
      vitality: char.vitality,
      energy: char.energy,
      command: char.command,
      statPoints: char.statPoints,
      currentMap: session.currentMap ?? 0,
      x: session.x ?? 125,
      y: session.y ?? 125,
      pkLevel: session.pkLevel ?? 3,
      pkCount: session.pkCount ?? 0,
      inventoryBinary,
      warehouseBinary,
      inventoryJson,
      progression: session.progressionState
        ? { ...session.progressionState }
        : QuestManager.createDefaultState(char.name, char.name, 0, char.level),
      masterTree: session.masterTreeState
        ? { ...session.masterTreeState }
        : MasterSkillTree.createDefaultTree(char.name),
      gensFamily: session.gensFamily ?? null,
      gensContribution: session.gensContribution ?? 0,
      gensRank: session.gensRank ?? 0,
      updatedAt: Date.now(),
    };

    await this.saveCharacter(record);
    return record;
  }

  /**
   * Carrega dados do repositório diretamente em uma ClientSession ativa
   */
  public async loadIntoSession(name: string, session: ClientSession): Promise<boolean> {
    const record = await this.loadCharacter(name);
    if (!record) return false;

    // Atualiza dados vitais e atributos
    session.character.name = record.name;
    session.character.characterClass = record.class;
    session.character.level = record.level;
    session.character.zen = record.zen;
    session.character.strength = record.strength;
    session.character.agility = record.agility;
    session.character.vitality = record.vitality;
    session.character.energy = record.energy;
    session.character.command = record.command;
    session.character.statPoints = record.statPoints;

    session.pkLevel = record.pkLevel;
    session.pkCount = record.pkCount;
    session.x = record.x;
    session.y = record.y;
    session.resets = record.resets;
    session.masterResets = record.masterResets;
    session.wCoins = record.wCoins;
    session.currentMap = record.currentMap;
    session.gensFamily = record.gensFamily ?? undefined;
    session.gensContribution = record.gensContribution;
    session.gensRank = record.gensRank;
    session.progressionState = { ...record.progression };
    session.masterTreeState = { ...record.masterTree };

    // Restaura inventário
    if (record.inventoryJson) {
      try {
        const parsed = JSON.parse(record.inventoryJson);
        const restoredInv = GridInventory.deserialize(parsed);
        session.inventory = restoredInv;
      } catch (e) {
        console.warn(`[CharacterRepository] Falha ao deserializar inventoryJson de ${name}, usando binário:`, e);
        this.restoreInventoryFromBinary(record.inventoryBinary, session);
      }
    } else {
      this.restoreInventoryFromBinary(record.inventoryBinary, session);
    }

    return true;
  }

  private restoreInventoryFromBinary(binary: Buffer, session: ClientSession): void {
    const deserializedItems = BinaryItemSerializer.deserializeInventory(binary);
    session.inventory.clear();
    for (const placed of deserializedItems) {
      if (placed) {
        session.inventory.addItem(placed.item, placed.x, placed.y);
      }
    }
  }

  /**
   * Retorna contagem de personagens cadastrados
   */
  public count(): number {
    return this.records.size;
  }

  /**
   * Lista todos os personagens
   */
  public listAll(): CharacterRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Exporta a base de personagens em formato JSON
   */
  public exportJson(): string {
    const exportable = Array.from(this.records.values()).map((rec) => ({
      ...rec,
      inventoryBinaryHex: rec.inventoryBinary.toString('hex'),
      warehouseBinaryHex: rec.warehouseBinary.toString('hex'),
    }));
    return JSON.stringify(exportable, null, 2);
  }

  /**
   * Importa personagens de uma string JSON
   */
  public importJson(json: string): void {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return;

    for (const item of parsed) {
      const record: CharacterRecord = {
        ...item,
        inventoryBinary: Buffer.from(item.inventoryBinaryHex, 'hex'),
        warehouseBinary: Buffer.from(item.warehouseBinaryHex, 'hex'),
      };
      this.saveCharacter(record);
    }
  }

  /**
   * Encerra a conexão com o banco SQLite
   */
  public close(): void {
    try {
      this.db.close();
    } catch {
      // Já fechado
    }
  }
}
