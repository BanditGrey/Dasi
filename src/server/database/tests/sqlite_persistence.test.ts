import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CharacterRepository, type CharacterRecord } from '../CharacterRepository.ts';
import { SessionManager } from '../../network/SessionManager.ts';
import { Item } from '../../inventory/Item.ts';
import { EquipmentSlot, WeaponExcellentOption } from '../../inventory/types.ts';
import { QuestManager } from '../../progression/QuestManager.ts';
import { MasterSkillTree } from '../../progression/MasterSkillTree.ts';

describe('CharacterRepository - SQLite Persistence & Session Recovery', () => {
  const testDbDir = path.resolve(process.cwd(), 'data/test_db');
  const testDbFile = path.resolve(testDbDir, 'test_characters.sqlite');

  // Limpa banco de teste anterior se existir
  if (fs.existsSync(testDbFile)) {
    try { fs.unlinkSync(testDbFile); } catch {}
  }

  it('inicializa o banco SQLite, tabela characters e executa operações CRUD básicas', async () => {
    const repo = new CharacterRepository(testDbFile);

    const initialCount = repo.count();
    assert.equal(initialCount, 0);

    const progression = QuestManager.createDefaultState('acc-001', 'BladeHero', 0, 300);
    progression.hasComboUnlocked = true;
    const masterTree = MasterSkillTree.createDefaultTree('BladeHero');

    const dummyRecord: CharacterRecord = {
      name: 'BladeHero',
      account: 'acc-001',
      class: 'DK',
      level: 300,
      resets: 2,
      masterResets: 0,
      zen: 5000000,
      wCoins: 150,
      strength: 650,
      agility: 220,
      vitality: 180,
      energy: 90,
      command: 0,
      statPoints: 15,
      currentMap: 0,
      x: 140.5,
      y: 128.2,
      pkLevel: 3,
      pkCount: 0,
      inventoryBinary: Buffer.alloc(1728, 0xFF),
      warehouseBinary: Buffer.alloc(3840, 0xFF),
      progression,
      masterTree,
      gensFamily: 1, // DUPRIAN
      gensContribution: 1250,
      gensRank: 2,
      updatedAt: Date.now(),
    };

    await repo.saveCharacter(dummyRecord);
    assert.equal(repo.count(), 1);

    const loaded = await repo.loadCharacter('bladehero');
    assert.ok(loaded);
    assert.equal(loaded.name, 'BladeHero');
    assert.equal(loaded.level, 300);
    assert.equal(loaded.strength, 650);
    assert.equal(loaded.zen, 5000000);
    assert.equal(loaded.gensFamily, 1);
    assert.equal(loaded.gensContribution, 1250);
    assert.equal(loaded.inventoryBinary.length, 1728);

    repo.close();
  });

  it('persiste em disco e restaura exatamente os mesmos dados após reabertura do arquivo SQLite', async () => {
    // Reabre o mesmo arquivo em nova instância
    const repoReopened = new CharacterRepository(testDbFile);
    assert.equal(repoReopened.count(), 1);

    const loaded = await repoReopened.loadCharacter('BladeHero');
    assert.ok(loaded);
    assert.equal(loaded.name, 'BladeHero');
    assert.equal(loaded.class, 'DK');
    assert.equal(loaded.level, 300);
    assert.equal(loaded.strength, 650);
    assert.equal(loaded.resets, 2);
    assert.equal(loaded.progression.hasComboUnlocked, true);

    // Atualiza status (sobe de nível e ganha zen)
    loaded.level = 301;
    loaded.zen += 50000;
    loaded.strength += 5;
    await repoReopened.saveCharacter(loaded);

    repoReopened.close();

    // Reabre pela terceira vez para confirmar UPSERT
    const repo3 = new CharacterRepository(testDbFile);
    const updated = await repo3.loadCharacter('BladeHero');
    assert.ok(updated);
    assert.equal(updated.level, 301);
    assert.equal(updated.zen, 5050000);
    assert.equal(updated.strength, 655);

    repo3.close();
  });

  it('salva e restaura uma ClientSession completa incluindo itens no grid e slots de equipamento', async () => {
    const sessionManager = new SessionManager();
    const mockSocket = {};
    const session = sessionManager.createSession(mockSocket);

    session.character.name = 'KnightOfLorencia';
    session.character.characterClass = 'DK';
    session.character.level = 280;
    session.character.zen = 12000000;
    session.character.strength = 500;
    session.character.agility = 160;

    session.inventory.clear();

    // Adiciona e equipa uma arma lendária no slot de mão direita
    const dragonBlade = Item.create('dragon_blade', {
      level: 11,
      luck: true,
      skill: true,
      excellentMask: WeaponExcellentOption.INCREASE_DMG_2_PERCENT,
    });
    const placed = session.inventory.addItem(dragonBlade, 0, 0);
    assert.ok(placed, 'Item deve ser adicionado ao grid');
    const equipRes = session.inventory.equipItem(dragonBlade.uuid, EquipmentSlot.WEAPON_RIGHT);
    assert.equal(equipRes.success, true);

    // Salva a sessão no repositório persistente
    const repo = new CharacterRepository(testDbFile);
    await repo.saveFromSession(session);
    repo.close();

    // Cria uma nova sessão vazia para o mesmo jogador
    const freshSessionManager = new SessionManager();
    const freshSession = freshSessionManager.createSession({});
    freshSession.inventory.clear();

    // Carrega do banco diretamente na sessão
    const repoReload = new CharacterRepository(testDbFile);
    const success = await repoReload.loadIntoSession('KnightOfLorencia', freshSession);
    assert.equal(success, true);

    // Valida atributos da sessão
    assert.equal(freshSession.character.name, 'KnightOfLorencia');
    assert.equal(freshSession.character.level, 280);
    assert.equal(freshSession.character.zen, 12000000);
    assert.equal(freshSession.character.strength, 500);
    assert.equal(freshSession.character.agility, 160);

    // Valida itens equipados restaurados
    const equippedWeapon = freshSession.inventory.getEquippedItem(EquipmentSlot.WEAPON_RIGHT);
    assert.ok(equippedWeapon, 'Arma na mão direita deve ser restaurada');
    assert.equal(equippedWeapon.defId, 'dragon_blade');
    assert.equal(equippedWeapon.level, 11);
    assert.equal(equippedWeapon.skill, true);
    assert.equal(equippedWeapon.luck, true);

    repoReload.close();
  });

  // Limpeza pós-teste
  it('limpa arquivo de teste temporário', () => {
    if (fs.existsSync(testDbFile)) {
      try { fs.unlinkSync(testDbFile); } catch {}
    }
  });
});
