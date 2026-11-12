/**
 * Dasi MMORPG - Spawner de Monstros para Zonas de Lorencia
 * Gerencia ciclo de vida, IA de perambulação e respawn autoritativo.
 */

import { Monster, type SerializedMonster } from './Monster.ts';

export interface SpawnerZoneConfig {
  id: string;
  name: string;
  monsterType: string;
  centerX: number;
  centerY: number;
  radius: number;
  maxMobs: number;
  respawnDelayMs: number;
}

export class MobSpawner {
  private zones: Map<string, SpawnerZoneConfig> = new Map();
  private monsters: Map<string, Monster> = new Map();
  private mobToZone: Map<string, string> = new Map();
  private pendingRespawns: { zoneId: string; respawnAt: number }[] = [];
  private wanderTimer = 0;

  constructor() {
    this.initLorenciaDefaultZones();
  }

  /**
   * Configura zonas icônicas das planícies e cemitério de Lorencia
   */
  public initLorenciaDefaultZones(): void {
    // 1. Campos do Norte - Aranhas Gigantes (Spider)
    this.addZone({
      id: 'zone_lorencia_spiders',
      name: 'Campos das Aranhas',
      monsterType: 'spider',
      centerX: 160,
      centerY: 140,
      radius: 90,
      maxMobs: 4,
      respawnDelayMs: 4000,
    });

    // 2. Planícies do Poente - Cães de Caça / Lobos (Hound)
    this.addZone({
      id: 'zone_lorencia_hounds',
      name: 'Planícies dos Hounds',
      monsterType: 'hound',
      centerX: 200,
      centerY: 360,
      radius: 100,
      maxMobs: 3,
      respawnDelayMs: 5000,
    });

    // 3. Charcos do Sul - Touros Guerreiros (Bull Fighter)
    this.addZone({
      id: 'zone_lorencia_bulls',
      name: 'Charcos dos Touros',
      monsterType: 'bull_fighter',
      centerX: 520,
      centerY: 360,
      radius: 100,
      maxMobs: 3,
      respawnDelayMs: 5000,
    });

    // 4. Cemitério Abandonado - Soldados Esqueletos (Skeleton)
    this.addZone({
      id: 'zone_lorencia_skeletons',
      name: 'Cemitério das Almas Esquecidas',
      monsterType: 'skeleton',
      centerX: 560,
      centerY: 140,
      radius: 90,
      maxMobs: 4,
      respawnDelayMs: 6000,
    });

    this.spawnInitialMobs();
  }

  /**
   * Registra zonas dinâmicas para biomas específicos (Devias, Dungeon, Lost Tower)
   */
  public initBiomeZones(biome: string): void {
    const b = String(biome || '').toUpperCase();
    if (b === 'DEVIAS') {
      this.addZone({
        id: 'zone_devias_yetis',
        name: 'Fortaleza dos Yetis',
        monsterType: 'yeti',
        centerX: 300,
        centerY: 300,
        radius: 100,
        maxMobs: 4,
        respawnDelayMs: 6000,
      });
    } else if (b === 'DUNGEON') {
      this.addZone({
        id: 'zone_dungeon_liches',
        name: 'Cripta dos Liches',
        monsterType: 'lich',
        centerX: 250,
        centerY: 250,
        radius: 90,
        maxMobs: 4,
        respawnDelayMs: 7000,
      });
      this.addZone({
        id: 'zone_dungeon_skeletons',
        name: 'Garras do Abismo',
        monsterType: 'skeleton',
        centerX: 400,
        centerY: 400,
        radius: 90,
        maxMobs: 4,
        respawnDelayMs: 6000,
      });
    } else if (b === 'LOST_TOWER') {
      this.addZone({
        id: 'zone_lost_tower_demons',
        name: 'Passagem dos Demônios',
        monsterType: 'demon',
        centerX: 350,
        centerY: 350,
        radius: 110,
        maxMobs: 4,
        respawnDelayMs: 8000,
      });
    }
    this.spawnInitialMobs();
  }

  public addZone(config: SpawnerZoneConfig): void {
    this.zones.set(config.id, config);
  }

  public getZone(zoneId: string): SpawnerZoneConfig | undefined {
    return this.zones.get(zoneId);
  }

  /**
   * Preenche todas as zonas com seus monstros iniciais
   */
  public spawnInitialMobs(): void {
    for (const [zoneId, zone] of this.zones.entries()) {
      const currentCount = this.getMobsInZoneCount(zoneId);
      const toSpawn = zone.maxMobs - currentCount;
      for (let i = 0; i < toSpawn; i++) {
        this.spawnMobInZone(zone);
      }
    }
  }

  private spawnMobInZone(zone: SpawnerZoneConfig): Monster {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * zone.radius;
    const spawnX = Math.round(zone.centerX + Math.cos(angle) * dist);
    const spawnY = Math.round(zone.centerY + Math.sin(angle) * dist);

    const mob = new Monster(zone.monsterType, spawnX, spawnY);
    this.monsters.set(mob.id, mob);
    this.mobToZone.set(mob.id, zone.id);
    return mob;
  }

  private getMobsInZoneCount(zoneId: string): number {
    let count = 0;
    for (const [mobId, zId] of this.mobToZone.entries()) {
      if (zId === zoneId) {
        const mob = this.monsters.get(mobId);
        if (mob && !mob.isDead) count++;
      }
    }
    return count;
  }

  public registerExternalMonster(mob: Monster): void {
    this.monsters.set(mob.id, mob);
  }

  public removeMonster(mobId: string): boolean {
    this.mobToZone.delete(mobId);
    return this.monsters.delete(mobId);
  }

  public getMonster(mobId: string): Monster | undefined {
    return this.monsters.get(mobId);
  }

  public getAllMonsters(): Monster[] {
    return Array.from(this.monsters.values());
  }

  public getSerializedMonsters(): SerializedMonster[] {
    return Array.from(this.monsters.values()).map((m) => m.serialize());
  }

  /**
   * Ciclo de atualização de física, IA e respawn
   */
  public update(deltaTimeSec: number, players: { id: string; x: number; y: number }[] = []): {
    hasMoved: boolean;
    respawned: Monster[];
    despawnedIds: string[];
    attacks: { mobId: string; targetId: string }[];
  } {
    const now = Date.now();
    const respawned: Monster[] = [];
    const despawnedIds: string[] = [];
    const attacks: { mobId: string; targetId: string }[] = [];

    // 0. Processa IA com detecção de jogadores e combate
    if (players.length > 0) {
      for (const mob of this.monsters.values()) {
        if (!mob.isDead) {
          const res = mob.think(players, deltaTimeSec);
          if (res && res.action === 'ATTACK' && res.targetId) {
            attacks.push({ mobId: mob.id, targetId: res.targetId });
          }
        }
      }
    }

    // 1. Processa cadáveres expirados
    for (const [mobId, mob] of this.monsters.entries()) {
      if (mob.isDead && now >= mob.corpseExpiresAt) {
        const zoneId = this.mobToZone.get(mobId);
        this.monsters.delete(mobId);
        this.mobToZone.delete(mobId);
        despawnedIds.push(mobId);

        if (zoneId) {
          const zone = this.zones.get(zoneId);
          const delay = zone ? zone.respawnDelayMs : 5000;
          this.pendingRespawns.push({
            zoneId,
            respawnAt: now + delay,
          });
        }
      }
    }

    // 2. Processa respawns pendentes
    for (let i = this.pendingRespawns.length - 1; i >= 0; i--) {
      const respawn = this.pendingRespawns[i];
      if (now >= respawn.respawnAt) {
        this.pendingRespawns.splice(i, 1);
        const zone = this.zones.get(respawn.zoneId);
        if (zone && this.getMobsInZoneCount(zone.id) < zone.maxMobs) {
          const mob = this.spawnMobInZone(zone);
          respawned.push(mob);
        }
      }
    }

    // 3. IA de perambulação periódica (a cada ~2.5s)
    this.wanderTimer += deltaTimeSec;
    if (this.wanderTimer >= 2.5) {
      this.wanderTimer = 0;
      for (const mob of this.monsters.values()) {
        if (!mob.isDead && mob.state === 'IDLE' && Math.random() < 0.6) {
          mob.wander(60);
        }
      }
    }

    // 4. Atualiza locomoção dos monstros
    let hasMoved = false;
    for (const mob of this.monsters.values()) {
      const oldX = mob.x;
      const oldY = mob.y;
      mob.update(deltaTimeSec);
      if (Math.abs(mob.x - oldX) > 0.01 || Math.abs(mob.y - oldY) > 0.01) {
        hasMoved = true;
      }
    }

    return { hasMoved, respawned, despawnedIds, attacks };
  }

  public clear(): void {
    this.monsters.clear();
    this.mobToZone.clear();
    this.pendingRespawns = [];
  }
}
