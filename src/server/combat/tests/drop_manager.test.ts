import test from 'node:test';
import assert from 'node:assert/strict';
import { DropManager, type HitDamageEntry } from '../DropManager.ts';

test('DropManager: Top Hit Damage e Agregação de Party', () => {
  const now = Date.now();
  const monsterX = 100;
  const monsterY = 100;

  // Cenário:
  // Jogador Solo A causa 400 de dano.
  // Membros da Party Alpha (B e C):
  // B causa 250 de dano, C causa 200 de dano. (Total da Party: 450 de dano!)
  // Membro D causou dano há 35 segundos (expirou).
  const log: HitDamageEntry[] = [
    { sessionId: 'user-A', damage: 400, timestamp: now - 5000, x: 102, y: 101 },
    { sessionId: 'user-B', partyId: 'party-alpha', damage: 250, timestamp: now - 3000, x: 99, y: 100 },
    { sessionId: 'user-C', partyId: 'party-alpha', damage: 200, timestamp: now - 2000, x: 101, y: 99 },
    { sessionId: 'user-D', damage: 500, timestamp: now - 35000, x: 100, y: 100 }, // EXPIRADO (> 30s)
  ];

  const winner = DropManager.calculateTopHitDamageOwner(log, monsterX, monsterY, now);

  assert.ok(winner);
  // Party Alpha venceu (450 > 400 de A, e D expirou).
  assert.equal(winner.ownerPartyId, 'party-alpha');
  // O membro com maior dano dentro da Party Alpha é user-B (250 > 200)
  assert.equal(winner.ownerSessionId, 'user-B');
});

test('DropManager: Intervalo de Nível de Item e Deslocamento Excelente (-25)', () => {
  // Monstro Nível 50:
  // Item comum: [50 - 4 .. 50 + 2] = [46 .. 52]
  const normalRange = DropManager.calculateItemTierRange(50, false);
  assert.equal(normalRange.minBaseLevel, 46);
  assert.equal(normalRange.maxBaseLevel, 52);

  // Item Excelente de Monstro Nível 50:
  // Deslocamento de -25 níveis: searchLevel = 25
  // [25 - 4 .. 25 + 2] = [21 .. 27]
  const excRange = DropManager.calculateItemTierRange(50, true);
  assert.equal(excRange.minBaseLevel, 21);
  assert.equal(excRange.maxBaseLevel, 27);
});

test('DropManager: Trava de Posse de 15 Segundos e Raio de Coleta', () => {
  const now = Date.now();
  const groundItem = DropManager.createGroundItem(
    'dragon_helm',
    100,
    100,
    'player-1',
    'party-1',
    true,
    now
  );

  // 1. Estranho tenta coletar dentro dos 15 segundos => RECUSADO
  const lootStrangerEarly = DropManager.canLootItem(groundItem, 'stranger-99', undefined, 100, 100, now + 5000);
  assert.equal(lootStrangerEarly.allowed, false);

  // 2. Membro da mesma party tenta coletar dentro dos 15 segundos => AUTORIZADO
  const lootPartyEarly = DropManager.canLootItem(groundItem, 'party-member-2', 'party-1', 100, 100, now + 5000);
  assert.equal(lootPartyEarly.allowed, true);

  // 3. O próprio dono tenta coletar dentro dos 15 segundos => AUTORIZADO
  const lootOwnerEarly = DropManager.canLootItem(groundItem, 'player-1', 'party-1', 100, 100, now + 5000);
  assert.equal(lootOwnerEarly.allowed, true);

  // 4. Estranho tenta coletar após os 15 segundos (trava expirou) => AUTORIZADO
  const lootStrangerLate = DropManager.canLootItem(groundItem, 'stranger-99', undefined, 100, 100, now + 16000);
  assert.equal(lootStrangerLate.allowed, true);

  // 5. Coleta além de 2 tiles de distância => RECUSADO (Anti-hack)
  const lootTooFar = DropManager.canLootItem(groundItem, 'player-1', 'party-1', 105, 100, now + 5000);
  assert.equal(lootTooFar.allowed, false);

  // 6. Item após 30 segundos despawna => RECUSADO
  const lootDespawned = DropManager.canLootItem(groundItem, 'player-1', 'party-1', 100, 100, now + 35000);
  assert.equal(lootDespawned.allowed, false);
});
