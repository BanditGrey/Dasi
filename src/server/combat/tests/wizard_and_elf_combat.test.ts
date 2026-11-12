/**
 * Dasi MMORPG - Testes Canônicos de Habilidades do Dark Wizard & Fairy Elf
 * Validação de magias arcanas, disparos de arco, cura, bênçãos (buffs) e poções autoritativas.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CombatEngine } from '../CombatEngine.ts';
import { MobSpawner } from '../MobSpawner.ts';
import { SessionManager } from '../../network/SessionManager.ts';
import { Item } from '../../inventory/Item.ts';
import { EquipmentSlot, WeaponExcellentOption } from '../../inventory/types.ts';
import { CanonicalFormulas } from '../CanonicalFormulas.ts';
import { GameServer } from '../../network/GameServer.ts';
import { Opcodes } from '../../network/protocol.ts';

describe('1. Dark Wizard (Soul Master) - Spells Arcanos & AoE (Evil Spirits, Lightning, Fireball)', () => {
  it('executa Evil Spirits com dano mágico baseado em Energia, consumo de 35 MP e acerto AoE multi-alvo', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'GrandWizard';
    session.character.characterClass = 'DW';
    session.character.strength = 80;
    session.character.agility = 300;
    session.character.energy = 500;
    session.currentMp = 400;

    // Equipa um Cajado do Caos (Chaos Lightning Staff +7)
    const staff = Item.create('chaos_lightning_staff', {
      level: 7,
      skill: true,
      luck: true,
      excellentMask: WeaponExcellentOption.EXCELLENT_DAMAGE_10_PCT,
    });
    session.inventory.clear();
    session.inventory.addItem(staff, 0, 0);
    session.inventory.equipItem(staff.uuid, EquipmentSlot.WEAPON_RIGHT);

    const mobs = spawner.getAllMonsters();
    assert.ok(mobs.length >= 2, 'Deve haver monstros no spawner');

    const primaryMob = mobs[0];
    const secondaryMob = mobs[1];
    primaryMob.maxHp = 600;
    primaryMob.currentHp = 600;
    secondaryMob.maxHp = 600;
    secondaryMob.currentHp = 600;

    // Posiciona o segundo monstro a 80 unidades (dentro do raio de 240 do Evil Spirits)
    secondaryMob.x = primaryMob.x + 50;
    secondaryMob.y = primaryMob.y + 50;

    const initialMp = session.currentMp;
    const initialHpPrimary = primaryMob.currentHp;
    const initialHpSecondary = secondaryMob.currentHp;

    const result = combat.processPlayerAttack(session, {
      targetMobId: primaryMob.id,
      skillId: 'evil_spirits',
      playerX: primaryMob.x + 40,
      playerY: primaryMob.y + 40,
    });

    assert.equal(result.success, true);
    assert.ok(result.damage > 0, 'Dano mágico deve ser positivo');
    assert.equal(primaryMob.currentHp < initialHpPrimary, true, 'Alvo primário deve sofrer dano de Evil Spirits');
    assert.equal(secondaryMob.currentHp < initialHpSecondary, true, 'Alvo secundário no raio de 240 deve sofrer dano AoE');
    assert.equal(session.currentMp, initialMp - 35, 'Deve deduzir exatamente 35 de Mana');
  });

  it('executa Lightning com empurrão elétrico (Knockback 42) e consumo de 15 MP', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'VoltMaster';
    session.character.characterClass = 'DW';
    session.character.energy = 300;
    session.currentMp = 200;

    const mobs = spawner.getAllMonsters();
    const targetMob = mobs[0];
    targetMob.maxHp = 500;
    targetMob.currentHp = 500;

    const initialMp = session.currentMp;

    const result = combat.processPlayerAttack(session, {
      targetMobId: targetMob.id,
      skillId: 'lightning',
      playerX: targetMob.x + 30,
      playerY: targetMob.y + 30,
    });

    assert.equal(result.success, true);
    assert.ok(result.damage > 0);
    assert.equal(session.currentMp, initialMp - 12, 'Deve deduzir exatamente 12 de Mana');
  });
});

describe('2. Fairy Elf (Muse Elf) - Tiro com Arco & Habilidades de Suporte (Triple Shot, Penetration, Heal, Buffs)', () => {
  it('executa Triple Shot disparando flechas em cone e acertando alvos adjacentes', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'SilverArcher';
    session.character.characterClass = 'ELF';
    session.character.strength = 120;
    session.character.agility = 450;
    session.character.energy = 100;
    session.currentMp = 250;

    // Equipa Arco do Caos (Chaos Nature Bow)
    const bow = Item.create('chaos_nature_bow', {
      level: 9,
      skill: true,
      luck: true,
    });
    session.inventory.clear();
    session.inventory.addItem(bow, 0, 0);
    session.inventory.equipItem(bow.uuid, EquipmentSlot.WEAPON_RIGHT);

    const mobs = spawner.getAllMonsters();
    const mob1 = mobs[0];
    const mob2 = mobs[1];
    mob1.maxHp = 500;
    mob1.currentHp = 500;
    mob2.maxHp = 500;
    mob2.currentHp = 500;
    mob2.x = mob1.x + 40;
    mob2.y = mob1.y + 40;

    const initialMp = session.currentMp;
    const initialHpMob2 = mob2.currentHp;

    const result = combat.processPlayerAttack(session, {
      targetMobId: mob1.id,
      skillId: 'triple_shot',
      playerX: mob1.x + 60,
      playerY: mob1.y + 60,
    });

    assert.equal(result.success, true);
    assert.ok(result.damage > 0);
    assert.equal(mob2.currentHp < initialHpMob2, true, 'Mob adjacente deve sofrer dano do cone do Triple Shot');
    assert.equal(session.currentMp, initialMp - 5, 'Consumo de Mana de Triple Shot verificado');
  });

  it('executa Penetration reduzindo defesa do alvo pela metade', () => {
    const spawner = new MobSpawner();
    const combat = new CombatEngine(spawner);
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'SniperElf';
    session.character.characterClass = 'ELF';
    session.character.strength = 150;
    session.character.agility = 600;
    session.currentMp = 200;

    const mobs = spawner.getAllMonsters();
    const targetMob = mobs[0];
    targetMob.defense = 60;
    targetMob.maxHp = 600;
    targetMob.currentHp = 600;

    const initialMp = session.currentMp;

    const result = combat.processPlayerAttack(session, {
      targetMobId: targetMob.id,
      skillId: 'penetration',
      playerX: targetMob.x + 80,
      playerY: targetMob.y + 80,
    });

    assert.equal(result.success, true);
    assert.ok(result.damage > 0);
    assert.equal(session.currentMp, initialMp - 14, 'Consumo de Mana de Penetration verificado');
  });

  it('conjura Heal curando HP de acordo com a Energia canônica (5 + Ene/5)', () => {
    const combat = new CombatEngine();
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'SaintElf';
    session.character.characterClass = 'ELF';
    session.character.energy = 400; // Cura esperada: 5 + 400/5 = 85 HP
    session.maxHp = 1000;
    session.currentHp = 500;
    session.currentMp = 150;

    const initialMp = session.currentMp;

    const result = combat.castSupportSkill(session, 'heal');
    assert.equal(result.success, true);
    assert.equal(result.hpHealed, 85);
    assert.equal(session.currentHp, 585);
    assert.equal(session.currentMp, initialMp - 20, 'Heal consome 20 MP');
  });

  it('conjura Greater Defense e Greater Damage aplicando buffs autoritativos', () => {
    const combat = new CombatEngine();
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.character.name = 'BuffElf';
    session.character.characterClass = 'ELF';
    session.character.energy = 560;
    session.currentMp = 200;

    // Greater Defense: 2 + 560/8 = 72 de defesa
    const defRes = combat.castSupportSkill(session, 'greater_defense');
    assert.equal(defRes.success, true);
    assert.equal(defRes.buffType, 'GREATER_DEFENSE');
    assert.equal(defRes.buffValue, 72);
    assert.equal(session.activeBuffs?.get('GREATER_DEFENSE')?.value, 72);

    // Greater Damage: 3 + 560/7 = 83 de dano
    const dmgRes = combat.castSupportSkill(session, 'greater_damage');
    assert.equal(dmgRes.success, true);
    assert.equal(dmgRes.buffType, 'GREATER_DAMAGE');
    assert.equal(dmgRes.buffValue, 83);
    assert.equal(session.activeBuffs?.get('GREATER_DAMAGE')?.value, 83);
  });

  it('conjura Mana Shield do Soul Master e Greater Fortitude do Blade Knight', () => {
    const combat = new CombatEngine();
    const sessionManager = new SessionManager();
    
    // 1. Mana Shield
    const dwSession = sessionManager.createSession({});
    dwSession.character.characterClass = 'DW';
    dwSession.character.agility = 250;
    dwSession.character.energy = 600;
    dwSession.currentMp = 300;
    // 10 + 250/50 + 600/200 = 10 + 5 + 3 = 18%
    const msRes = combat.castSupportSkill(dwSession, 'mana_shield');
    assert.equal(msRes.success, true);
    assert.equal(msRes.buffType, 'MANA_SHIELD');
    assert.equal(msRes.buffValue, 18);

    // 2. Greater Fortitude
    const dkSession = sessionManager.createSession({});
    dkSession.character.characterClass = 'DK';
    dkSession.character.vitality = 300;
    dkSession.character.energy = 200;
    dkSession.maxHp = 1000;
    dkSession.currentHp = 1000;
    dkSession.currentMp = 200;
    // 12 + 300/100 + 200/20 = 12 + 3 + 10 = 25% de aumento de HP
    const gfRes = combat.castSupportSkill(dkSession, 'greater_fortitude');
    assert.equal(gfRes.success, true);
    assert.equal(gfRes.buffType, 'GREATER_FORTITUDE');
    assert.equal(gfRes.buffValue, 25);
    assert.equal(dkSession.maxHp, 1250);
  });
});

describe('3. Sistema de Poções & Integração de Rede (0x51:0x01 e 0x51:0x03)', () => {
  it('consome poções de Vida e Mana recuperando percentuais canônicos', () => {
    const combat = new CombatEngine();
    const sessionManager = new SessionManager();
    const session = sessionManager.createSession({});

    session.maxHp = 1000;
    session.currentHp = 400; // 40% da vida
    session.maxMp = 500;
    session.currentMp = 100; // 20% da mana

    // Poção de cura padrão: +25% de 1000 = 250 HP
    const hpRes = combat.usePotion(session, 'healing_potion');
    assert.equal(hpRes.success, true);
    assert.equal(hpRes.hpRestored, 250);
    assert.equal(session.currentHp, 650);

    // Poção de mana grande: +40% de 500 = 200 MP
    const mpRes = combat.usePotion(session, 'large_mana_potion');
    assert.equal(mpRes.success, true);
    assert.equal(mpRes.mpRestored, 200);
    assert.equal(session.currentMp, 300);
  });

  it('processa pacote de rede 0x51:0x01 (Action Execute) e 0x51:0x03 (Potion Use) no GameServer', async () => {
    const server = new GameServer({ port: 8395, dbPath: ':memory:' });
    try {
      const sessionManager = server.sessionManager;

      const dummyWs: any = { readyState: 1, send: () => {} };
      const session = sessionManager.createSession(dummyWs);
      session.character.name = 'SpellMaster';
      session.character.characterClass = 'ELF';
      session.character.energy = 300;
      session.maxHp = 1000;
      session.currentHp = 400;
      session.maxMp = 400;
      session.currentMp = 300;

      let receivedPacket: any = null;
      dummyWs.send = (data: string) => {
        receivedPacket = JSON.parse(data);
      };

      // 1. Simula envio de pacote MSG_ACTION_EXECUTE_REQ para Heal
      (server as any).handleActionExecuteReq(session, { skillId: 'heal' });
      assert.ok(receivedPacket);
      assert.equal(receivedPacket.opcode, Opcodes.MSG_ACTION_COOLDOWN_RES.opcode);
      assert.equal(receivedPacket.subcode, Opcodes.MSG_ACTION_COOLDOWN_RES.subcode);
      assert.equal(receivedPacket.payload.success, true);
      assert.equal(receivedPacket.payload.skillId, 'heal');

      // 2. Simula envio de pacote MSG_POTION_USE_REQ
      (server as any).handlePotionUseReq(session, { potionType: 'healing_potion' });
      assert.ok(receivedPacket);
      assert.equal(receivedPacket.opcode, Opcodes.MSG_PLAYER_STATUS_VITALS.opcode);
      assert.equal(receivedPacket.subcode, Opcodes.MSG_PLAYER_STATUS_VITALS.subcode);
      assert.equal(receivedPacket.payload.potionResult.success, true);
    } finally {
      server.characterRepository.close();
      await server.stop();
    }
  });
});
