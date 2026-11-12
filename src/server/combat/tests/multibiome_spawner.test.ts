/**
 * DASI MMORPG - TESTES AUTORITATIVOS DE SPAWN MULTI-BIOMA
 * Valida a orquestração de zonas, monstros canônicos e IA por bioma.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MobSpawner } from '../MobSpawner.ts';
import { MONSTER_DEFINITIONS, Monster } from '../Monster.ts';

describe('1. Entidades Canônicas Expandidas (Monster.ts)', () => {
  it('instancia Skeleton Warrior com atributos e drop de Joias', () => {
    assert.ok(MONSTER_DEFINITIONS['skeleton_warrior'], 'Skeleton Warrior deve estar definido');
    const mob = new Monster('skeleton_warrior', 100, 100);
    assert.strictEqual(mob.type, 'skeleton_warrior');
    assert.strictEqual(mob.level, 19);
    assert.strictEqual(mob.maxHp, 320);
    assert.strictEqual(mob.defense, 28);
    assert.ok(mob.dropTable.some((d) => d.itemDefId === 'jewel_of_blessing'));
  });

  it('instancia Orc Warrior com força física e resistências', () => {
    assert.ok(MONSTER_DEFINITIONS['orc'], 'Orc deve estar definido');
    const mob = new Monster('orc', 200, 200);
    assert.strictEqual(mob.type, 'orc');
    assert.strictEqual(mob.level, 24);
    assert.strictEqual(mob.maxHp, 580);
    assert.strictEqual(mob.attackMin, 72);
  });

  it('instancia Abyssal Ghost com alta evasão e velocidade rápida', () => {
    assert.ok(MONSTER_DEFINITIONS['ghost'], 'Ghost deve estar definido');
    const mob = new Monster('ghost', 300, 300);
    assert.strictEqual(mob.type, 'ghost');
    assert.strictEqual(mob.level, 32);
    assert.strictEqual(mob.defenseRate, 75);
    assert.strictEqual(mob.moveSpeed, 68);
  });

  it('instancia Dragon Evolved como predador lendário de alta postura', () => {
    assert.ok(MONSTER_DEFINITIONS['dragon_evolved'], 'Dragon Evolved deve estar definido');
    const mob = new Monster('dragon_evolved', 400, 400);
    assert.strictEqual(mob.type, 'dragon_evolved');
    assert.strictEqual(mob.level, 75);
    assert.strictEqual(mob.maxHp, 8500);
    assert.strictEqual(mob.maxPoise, 350);
    assert.ok(mob.dropTable.some((d) => d.itemDefId === 'jewel_of_chaos'));
  });
});

describe('2. Orquestração Multi-Bioma de Zonas e Mobs (MobSpawner.ts)', () => {
  it('inicializa zonas de Noria com Budge Dragons e Orcs', () => {
    const spawner = new MobSpawner();
    spawner.initBiomeZones('NORIA');
    const noriaDragons = spawner.getZone('zone_noria_dragons');
    const noriaOrcs = spawner.getZone('zone_noria_orcs');

    assert.ok(noriaDragons, 'Zona de dragões de Noria deve existir');
    assert.strictEqual(noriaDragons.monsterType, 'budge_dragon');
    assert.ok(noriaOrcs, 'Zona de orcs de Noria deve existir');
    assert.strictEqual(noriaOrcs.monsterType, 'orc');

    const active = spawner.getAllMonsters();
    assert.ok(active.some((m) => m.type === 'budge_dragon'));
    assert.ok(active.some((m) => m.type === 'orc'));
  });

  it('inicializa zonas de Devias Boreal com Yetis e Orcs da Neve', () => {
    const spawner = new MobSpawner();
    spawner.initBiomeZones('DEVIAS');
    const yetis = spawner.getZone('zone_devias_yetis');
    const orcs = spawner.getZone('zone_devias_orcs');

    assert.ok(yetis, 'Zona de Yetis de Devias deve existir');
    assert.strictEqual(yetis.monsterType, 'yeti');
    assert.ok(orcs, 'Zona de Orcs de Devias deve existir');
    assert.strictEqual(orcs.monsterType, 'orc');

    const active = spawner.getAllMonsters();
    assert.ok(active.some((m) => m.type === 'yeti'));
  });

  it('inicializa zonas da Dungeon com Liches, Skeleton Warriors e Espectros', () => {
    const spawner = new MobSpawner();
    spawner.initBiomeZones('DUNGEON');
    const liches = spawner.getZone('zone_dungeon_liches');
    const skels = spawner.getZone('zone_dungeon_skeletons');
    const ghosts = spawner.getZone('zone_dungeon_ghosts');

    assert.ok(liches && skels && ghosts, 'As 3 zonas de Dungeon devem existir');
    assert.strictEqual(skels.monsterType, 'skeleton_warrior');
    assert.strictEqual(ghosts.monsterType, 'ghost');

    const active = spawner.getAllMonsters();
    assert.ok(active.some((m) => m.type === 'skeleton_warrior'));
    assert.ok(active.some((m) => m.type === 'ghost'));
  });

  it('inicializa zonas de Lost Tower com Demônios e Dragões Anciãos', () => {
    const spawner = new MobSpawner();
    spawner.initBiomeZones('LOST_TOWER');
    const demons = spawner.getZone('zone_lost_tower_demons');
    const dragons = spawner.getZone('zone_lost_tower_dragons');

    assert.ok(demons && dragons, 'Zonas de Lost Tower devem existir');
    assert.strictEqual(demons.monsterType, 'demon');
    assert.strictEqual(dragons.monsterType, 'dragon_evolved');

    const active = spawner.getAllMonsters();
    assert.ok(active.some((m) => m.type === 'dragon_evolved'));
  });

  it('inicializa Atlans, Tarkan e Icarus com predadores canônicos', () => {
    const spawner = new MobSpawner();
    spawner.initBiomeZones('ATLANS');
    spawner.initBiomeZones('TARKAN');
    spawner.initBiomeZones('ICARUS');

    assert.ok(spawner.getZone('zone_atlans_hydra'));
    assert.ok(spawner.getZone('zone_tarkan_zaikan'));
    assert.ok(spawner.getZone('zone_icarus_dragons'));

    const active = spawner.getAllMonsters();
    assert.ok(active.some((m) => m.type === 'hydra'));
    assert.ok(active.some((m) => m.type === 'zaikan'));
    assert.ok(active.some((m) => m.type === 'dragon_evolved'));
  });
});
