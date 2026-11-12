/**
 * DASI MMORPG - GRID DE COLISÃO E DISPOSIÇÃO 3D CANÔNICA DE TERRENOS
 * Engenharia reversa integral de EncTerrain*.att e EncTerrain*.obj (MU Online Season 5.2).
 * Fonte autoritativa: reference/mu_roxgaming_5.2/client/Data/World* e source/Main/source/ZzzLodTerrain.cpp
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/** Flags de colisão e atributos de terreno canônicos (ZzzLodTerrain.h & _define.h) */
export const TerrainWallFlags = {
  SAFEZONE: 0x0001,       // Zona Segura: sem combate/PK
  CHARACTER: 0x0002,      // Ocupado por personagem ou monstro
  NOMOVE: 0x0004,         // Bloqueado para movimento (parede/obstáculo)
  NOGROUND: 0x0008,       // Sem solo / precipício / abismo
  WATER: 0x0010,          // Terreno aquático (Atlans ou rios)
  ACTION: 0x0020,         // Zona de ação / gatilho / portas
  HEIGHT: 0x0040,         // Elevação especial de terreno
  CAMERA_UP: 0x0080,      // Elevação forçada da câmera
  NOATTACKZONE: 0x0100,   // Zona sem ataque em mapas de evento
} as const;

export type TerrainWallFlag = keyof typeof TerrainWallFlags;

export interface CanonicalMapMeta {
  id: string;
  name: string;
  world_dir: string;
  has_att: boolean;
  has_obj: boolean;
  objects_count: number;
  walkable_tiles: number;
  blocked_tiles: number;
}

export interface WorldCollisionSummary {
  id: string;
  name: string;
  map_id: number;
  width: number;
  height: number;
  wall_counts: {
    walkable: number;
    blocked: number;
    water?: number;
    safe_zone?: number;
    other?: number;
    [key: string]: number | undefined;
  };
}

export interface WorldObjectPlacement {
  index: number;
  type: number;
  position: { x: number; y: number; z: number };
  angle: { pitch: number; roll: number; yaw: number };
  scale: number;
}

export interface WorldObjectsLayout {
  file: string;
  version: number;
  map_num: number;
  total_objects: number;
  objects: WorldObjectPlacement[];
}

export class CanonicalTerrainGrid {
  private static mapsBaseDir: string = path.resolve(process.cwd(), 'conversions', 'output', 'maps');
  private static masterIndexCache: CanonicalMapMeta[] | null = null;
  private static gridCache: Map<string, Uint16Array> = new Map();
  private static objectsCache: Map<string, WorldObjectsLayout> = new Map();

  /** Permite redefinir o diretório base para testes caso necessário */
  public static setMapsBaseDir(customPath: string): void {
    this.mapsBaseDir = customPath;
    this.masterIndexCache = null;
    this.gridCache.clear();
    this.objectsCache.clear();
  }

  public static getMapsBaseDir(): string {
    return this.mapsBaseDir;
  }

  /** Carrega o manifesto principal de mapas extraídos */
  public static getMasterIndex(): CanonicalMapMeta[] {
    if (this.masterIndexCache) {
      return this.masterIndexCache;
    }
    const indexPath = path.join(this.mapsBaseDir, 'maps_master_index.json');
    if (!fs.existsSync(indexPath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(indexPath, 'utf-8');
      this.masterIndexCache = JSON.parse(data) as CanonicalMapMeta[];
      return this.masterIndexCache;
    } catch {
      return [];
    }
  }

  /** Carrega o sumário de colisão de um mundo específico */
  public static getMapSummary(mapId: string): WorldCollisionSummary | null {
    const summaryPath = path.join(this.mapsBaseDir, mapId.toUpperCase(), 'collision_summary.json');
    if (!fs.existsSync(summaryPath)) {
      return null;
    }
    try {
      const data = fs.readFileSync(summaryPath, 'utf-8');
      return JSON.parse(data) as WorldCollisionSummary;
    } catch {
      return null;
    }
  }

  /**
   * Carrega a matriz de colisão 256x256 (65.536 valores) na memória em um Uint16Array linear.
   * Indexação canônica: index = y * 256 + x.
   */
  public static loadCollisionGrid(mapId: string): Uint16Array | null {
    const upperId = mapId.toUpperCase();
    if (this.gridCache.has(upperId)) {
      return this.gridCache.get(upperId)!;
    }

    const gridPath = path.join(this.mapsBaseDir, upperId, 'collision_grid.json');
    if (!fs.existsSync(gridPath)) {
      return null;
    }

    try {
      const data = fs.readFileSync(gridPath, 'utf-8');
      const raw2d = JSON.parse(data) as number[][];
      const flat = new Uint16Array(256 * 256);

      for (let y = 0; y < 256; y++) {
        const row = raw2d[y];
        if (!row) continue;
        for (let x = 0; x < 256; x++) {
          flat[y * 256 + x] = row[x] ?? TerrainWallFlags.NOMOVE;
        }
      }

      this.gridCache.set(upperId, flat);
      return flat;
    } catch {
      return null;
    }
  }

  /**
   * Obtém a flag bruta do ladrilho (x, y) no mapa especificado.
   * Caso esteja fora dos limites [0..255], retorna NOMOVE | NOGROUND.
   */
  public static getTileAttribute(mapId: string, x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);

    if (ix < 0 || ix >= 256 || iy < 0 || iy >= 256) {
      return TerrainWallFlags.NOMOVE | TerrainWallFlags.NOGROUND;
    }

    const grid = this.loadCollisionGrid(mapId);
    if (!grid) {
      return 0; // Fallback se o mapa não tiver grid extraída
    }

    return grid[iy * 256 + ix];
  }

  /**
   * Verifica se o ladrilho é caminhável segundo as regras canônicas do MU Online.
   * Não pode conter as flags NOMOVE (0x04) ou NOGROUND (0x08).
   */
  public static isTileWalkable(mapId: string, x: number, y: number): boolean {
    const attr = this.getTileAttribute(mapId, x, y);
    const blockedMask = TerrainWallFlags.NOMOVE | TerrainWallFlags.NOGROUND;
    return (attr & blockedMask) === 0;
  }

  /** Verifica se o ladrilho está em Zona Segura (SAFEZONE = 0x01) */
  public static isTileSafeZone(mapId: string, x: number, y: number): boolean {
    const attr = this.getTileAttribute(mapId, x, y);
    return (attr & TerrainWallFlags.SAFEZONE) !== 0;
  }

  /** Verifica se o ladrilho é água (WATER = 0x10) */
  public static isTileWater(mapId: string, x: number, y: number): boolean {
    const attr = this.getTileAttribute(mapId, x, y);
    return (attr & TerrainWallFlags.WATER) !== 0;
  }

  /**
   * Carrega o layout de instâncias 3D dos objetos do mundo (árvores, pontes, ruínas, colunas, tochas).
   */
  public static loadObjectsLayout(mapId: string): WorldObjectsLayout | null {
    const upperId = mapId.toUpperCase();
    if (this.objectsCache.has(upperId)) {
      return this.objectsCache.get(upperId)!;
    }

    const objectsPath = path.join(this.mapsBaseDir, upperId, 'objects_layout.json');
    if (!fs.existsSync(objectsPath)) {
      return null;
    }

    try {
      const data = fs.readFileSync(objectsPath, 'utf-8');
      const layout = JSON.parse(data) as WorldObjectsLayout;
      this.objectsCache.set(upperId, layout);
      return layout;
    } catch {
      return null;
    }
  }

  /**
   * Filtra objetos do mundo por tipo de asset (.bmd em Data/Object{WorldId}/Object{Type}.bmd).
   */
  public static getObjectsByType(mapId: string, type: number): WorldObjectPlacement[] {
    const layout = this.loadObjectsLayout(mapId);
    if (!layout || !layout.objects) {
      return [];
    }
    return layout.objects.filter((obj) => obj.type === type);
  }
}
