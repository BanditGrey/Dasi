/**
 * Dasi MMORPG - Testes Automatizados do Repositório Canônico de Personagens & Kalima
 * Valida persistência autoritativa com serialização binária de 16 bytes e ciclo de vida de Kalima.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CharacterRepository } from '../CharacterRepository.ts';
import { SessionManager } from '../../network/SessionManager.ts';
import { Item } from '../../inventory/Item.ts';
import { KalimaInstance } from '../../events/KalimaInstance.ts';
import { GameServer } from '../../network/GameServer.ts';
import { Opcodes } from '../../network/protocol.ts';

describe('1. Repositório de Personagens & Persistência Binária (CharacterRepository)', () => {
  it('salva e recupera uma sessão de jogo preservando atributos, resets e inventário binário', async () => {
    const repo = new CharacterRepository();
    const sessionManager = new SessionManager();

    const dummyWs = { readyState: 1, send: () => {} };
    const session = sessionManager.createSession(dummyWs);
    session.state = 'AUTHENTICATED';
    session.character.name = 'ConquerorBK';
    session.character.characterClass = 'DK';
    session.character.level = 380;
    session.character.zen = 15000000;
    session.resets = 15;
    session.masterResets = 1;
    session.wCoins = 5000;
    session.gensFamily = 1; // DUPRIAN
    session.gensContribution = 12500;
    session.gensRank = 4;
    session.x = 142;
    session.y = 128;
    session.currentMap = 0; // Lorencia

    // Adiciona itens no inventário limpo
    session.inventory.clear();
    const sword = Item.create('dragon_blade');
    sword.level = 11;
    sword.luck = true;
    sword.skill = true;
    session.inventory.addItem(sword, 0, 0);

    const record = await repo.saveFromSession(session);
    assert.equal(record.name, 'ConquerorBK');
    assert.equal(record.resets, 15);
    assert.equal(record.masterResets, 1);
    assert.equal(record.wCoins, 5000);
    assert.equal(record.inventoryBinary.length, 108 * 16, 'Inventário deve ter 1728 bytes exatos');

    // Cria uma nova sessão vazia e restaura o personagem
    const restoreSession = sessionManager.createSession({ readyState: 1, send: () => {} });
    const loaded = await repo.loadIntoSession('ConquerorBK', restoreSession);

    assert.equal(loaded, true);
    assert.equal(restoreSession.character.name, 'ConquerorBK');
    assert.equal(restoreSession.character.level, 380);
    assert.equal(restoreSession.character.zen, 15000000);
    assert.equal(restoreSession.resets, 15);
    assert.equal(restoreSession.masterResets, 1);
    assert.equal(restoreSession.wCoins, 5000);
    assert.equal(restoreSession.gensFamily, 1);
    assert.equal(restoreSession.gensContribution, 12500);
    assert.equal(restoreSession.x, 142);
    assert.equal(restoreSession.y, 128);

    // Confere restauração do item do inventário
    const restoredItems = restoreSession.inventory.getAllGridItems();
    assert.equal(restoredItems.length, 1);
    assert.equal(restoredItems[0].item.defId, 'dragon_blade');
    assert.equal(restoredItems[0].item.level, 11);
    assert.equal(restoredItems[0].item.luck, true);
    assert.equal(restoredItems[0].item.skill, true);
  });

  it('exporta e importa snapshot de base de dados em formato JSON', async () => {
    const repo1 = new CharacterRepository();
    const sessionManager = new SessionManager();
    const s1 = sessionManager.createSession({ readyState: 1, send: () => {} });
    s1.character.name = 'GrandMaster_DW';
    s1.character.characterClass = 'DW';
    s1.character.level = 400;
    await repo1.saveFromSession(s1);

    const json = repo1.exportJson();
    assert.ok(json.includes('GrandMaster_DW'));
    assert.ok(json.includes('inventoryBinaryHex'));

    const repo2 = new CharacterRepository();
    repo2.importJson(json);
    assert.equal(repo2.count(), 1);

    const loaded = await repo2.loadCharacter('GrandMaster_DW');
    assert.ok(loaded);
    assert.equal(loaded.name, 'GrandMaster_DW');
    assert.equal(loaded.level, 400);
  });
});

describe('2. Orquestração de Kalima no GameServer (Kalima Portal & Lord Kundun)', () => {
  it('valida regras de craft do Lost Map e permissão de ingresso por classe', () => {
    // 5 Marks -> 1 Lost Map
    const craftFail = KalimaInstance.craftLostMap(4, 7);
    assert.equal(craftFail.success, false);

    const craftSuccess = KalimaInstance.craftLostMap(7, 7);
    assert.equal(craftSuccess.success, true);
    assert.equal(craftSuccess.lostMapLevel, 7);
    assert.equal(craftSuccess.remainingMarks, 2);

    // Classes normais (DK/DW/ELF) precisam de nível 350-400 para Kalima 7
    assert.equal(KalimaInstance.canEnterKalima(7, 340, false), false);
    assert.equal(KalimaInstance.canEnterKalima(7, 350, false), true);

    // Classes especiais (MG/DL) têm desconto e entram a partir do nível 250
    assert.equal(KalimaInstance.canEnterKalima(7, 240, true), false);
    assert.equal(KalimaInstance.canEnterKalima(7, 250, true), true);

    // Loot de Lord Kundun garante 3 Itens Ancient
    const drops = KalimaInstance.generateLordKundunDrops();
    assert.equal(drops.ancientCount, 3);
  });

  it('gerencia o ciclo de portais de Kalima no GameServer com limite temporal de 180s', () => {
    const server = new GameServer({ port: 8290 });
    const sessionManager = server.sessionManager;

    const dummyWs: any = {
      readyState: 1,
      send: (data: string) => {
        packets.push(JSON.parse(data));
      },
    };
    const packets: any[] = [];

    const session = sessionManager.createSession(dummyWs);
    session.state = 'AUTHENTICATED';
    session.character.characterClass = 'DK';
    session.character.level = 380;
    session.x = 130;
    session.y = 120;

    // Tenta spawnar sem Lost Map -> Erro
    (server as any).handleKalimaPortalSpawnReq(session, { lostMapDefId: 'lost_map_7' });
    const failPacket = packets.pop();
    assert.equal(failPacket.payload.success, false);
    assert.ok(failPacket.payload.error.includes('não encontrado'));

    // Adiciona Lost Map +7 e spawna portal com sucesso
    const lostMap = Item.create('lost_map_7');
    session.inventory.addItem(lostMap, 0, 0);

    (server as any).handleKalimaPortalSpawnReq(session, { lostMapDefId: 'lost_map_7' });
    const spawnPacket = packets.pop();
    assert.equal(spawnPacket.payload.success, true);
    assert.equal(spawnPacket.payload.kalimaLevel, 7);
    assert.equal(spawnPacket.payload.durationSeconds, 180);

    const portalId = spawnPacket.payload.portalId;
    assert.ok(server.activeKalimaPortals.has(portalId));

    // Entra no portal de Kalima
    (server as any).handleKalimaEnterReq(session, { portalId });
    const enterPacket = packets.pop();
    assert.equal(enterPacket.payload.success, true);
    assert.equal(enterPacket.payload.kalimaLevel, 7);
    assert.equal(enterPacket.payload.targetMap, 'KALIMA_7');
    assert.equal(session.currentMap, 30); // 24 + 6 = 30 (Kalima 7)
    assert.equal(session.x, 20);
    assert.equal(session.y, 20);
  });
});
