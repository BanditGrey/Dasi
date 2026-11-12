/**
 * Dasi MMORPG - Repositório Canônico de Personagens & Persistência Autoritativa
 * Implementação do armazenamento de personagens com serialização binária de 16 bytes
 * por item (1.728 bytes para inventário 108 slots e 3.840 bytes para Baú/Warehouse 240 slots).
 */

import type { ClientSession } from '../network/SessionManager.ts';
import { BinaryItemSerializer } from './BinaryItemSerializer.ts';
import type { CharacterProgressionState } from '../progression/QuestManager.ts';
import type { MasterSkillTreeState } from '../progression/MasterSkillTree.ts';
import type { PlacedItem } from '../inventory/types.ts';

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
  progression: CharacterProgressionState;
  masterTree: MasterSkillTreeState;
  gensFamily: string | null;
  gensContribution: number;
  gensRank: number;
  updatedAt: number;
}

export class CharacterRepository {
  private records: Map<string, CharacterRecord> = new Map();

  /**
   * Salva um registro de personagem na base de dados
   */
  public async saveCharacter(record: CharacterRecord): Promise<void> {
    record.updatedAt = Date.now();
    this.records.set(record.name.toLowerCase(), record);
  }

  /**
   * Carrega um registro pelo nome do personagem
   */
  public async loadCharacter(name: string): Promise<CharacterRecord | null> {
    return this.records.get(name.toLowerCase()) ?? null;
  }

  /**
   * Salva os dados autoritativos de uma ClientSession ativa
   */
  public async saveFromSession(session: ClientSession): Promise<CharacterRecord> {
    const char = session.character;
    const inventoryItems = session.inventory.getAllGridItems();
    const inventoryBinary = BinaryItemSerializer.serializeInventory(inventoryItems);
    const warehouseBinary = BinaryItemSerializer.serializeWarehouse([]);

    const record: CharacterRecord = {
      name: char.name,
      account: session.sessionId,
      class: char.characterClass,
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
      pkLevel: char.pkLevel ?? 3,
      pkCount: char.pkCount ?? 0,
      inventoryBinary,
      warehouseBinary,
      progression: session.progressionState ? { ...session.progressionState } : {
        sebinaPart1Completed: false,
        sebinaChangeCompleted: false,
        marlonHeroCompleted: false,
        marlonComboCompleted: false,
        thirdClassChangeCompleted: false,
      },
      masterTree: session.masterTreeState ? { ...session.masterTreeState } : {
        masterLevel: 1,
        masterPoints: 0,
        allocatedSkills: {},
      },
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
    session.character.pkLevel = record.pkLevel;
    session.character.pkCount = record.pkCount;

    session.x = record.x;
    session.y = record.y;
    session.resets = record.resets;
    session.masterResets = record.masterResets;
    session.wCoins = record.wCoins;
    session.currentMap = record.currentMap;
    session.gensFamily = record.gensFamily as any;
    session.gensContribution = record.gensContribution;
    session.gensRank = record.gensRank;
    session.progressionState = { ...record.progression };
    session.masterTreeState = { ...record.masterTree };

    // Deserializa itens no inventário
    const deserializedItems = BinaryItemSerializer.deserializeInventory(record.inventoryBinary);
    session.inventory.clear();
    for (const placed of deserializedItems) {
      if (placed) {
        session.inventory.addItem(placed.item, placed.x, placed.y);
      }
    }

    return true;
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
}
