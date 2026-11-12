import test from 'node:test';
import assert from 'node:assert/strict';
import { QuestManager } from '../QuestManager.ts';
import { ResetManager, type CharacterResetState } from '../ResetManager.ts';
import { MasterSkillTree } from '../MasterSkillTree.ts';

test('QuestManager: Progressão de Quests de Sebina (150) e Marlon (220)', () => {
  // Cria personagem DK nível 150
  const state = QuestManager.createDefaultState('char-1', 'Ares', 1, 150);

  // Inicia Sebina Parte 1
  assert.equal(QuestManager.startSebinaPart1(state), true);
  assert.equal(state.quests.SEBINA_PRIEST_PART1.active, true);

  // Tenta concluir sem o Scroll
  assert.equal(QuestManager.completeSebinaPart1(state), false);

  // Entrega Scroll of Emperor
  state.inventoryItemIds.push('scroll_of_emperor');
  assert.equal(QuestManager.completeSebinaPart1(state), true);
  assert.equal(state.quests.SEBINA_PRIEST_PART1.completed, true);
  assert.equal(state.statPoints, 10);
  assert.equal(state.quests.SEBINA_PRIEST_PART2.active, true);

  // Entrega Broken Sword para DK
  state.inventoryItemIds.push('broken_sword');
  assert.equal(QuestManager.completeSebinaPart2(state), true);
  assert.equal(state.classTier, 2); // Virou Blade Knight
  assert.equal(state.statPoints, 20);

  // Evolui para nível 220 e faz Marlon
  state.level = 225;
  state.inventoryItemIds.push('ring_of_honor');
  assert.equal(QuestManager.completeMarlonPart1(state), true);
  assert.equal(state.quests.MARLON_HONOR_RING.completed, true);
  // Ganha 225 - 220 + 1 = 6 pontos retroativos
  assert.equal(state.statPoints, 26);
  assert.equal(state.quests.MARLON_DARK_STONE.active, true);

  // Conclui Dark Stone e desbloqueia Combo
  state.inventoryItemIds.push('dark_stone');
  assert.equal(QuestManager.completeMarlonPart2(state), true);
  assert.equal(state.hasComboUnlocked, true);
});

test('QuestManager: Mudança para 3ª Classe (Apostle Devin - Nível 400)', () => {
  const state = QuestManager.createDefaultState('char-2', 'Zeus', 1, 400);
  state.classTier = 2; // Já é Blade Knight

  state.inventoryItemIds.push('flame_of_death_beam_knight');
  state.inventoryItemIds.push('horn_of_hell_maine');
  state.inventoryItemIds.push('feather_of_phoenix');

  assert.equal(QuestManager.completeDevinThirdClassChange(state), true);
  assert.equal(state.classTier, 3); // Blade Master
  assert.equal(state.hasMasterLevelUnlocked, true);
  assert.equal(state.statPoints, 30);
});

test('ResetManager: Execução de Reset e Master Reset', () => {
  const char: CharacterResetState = {
    characterId: 'char-1',
    level: 400,
    resets: 0,
    masterResets: 0,
    zen: 100000000, // 100 Milhões
    wCoins: 0,
    strength: 300,
    agility: 200,
    vitality: 150,
    energy: 100,
    leadership: 0,
    statPoints: 0,
  };

  // 1. Reset Normal no Modo Pontos
  const res1 = ResetManager.executeReset(char);
  assert.equal(res1.success, true);
  assert.equal(char.resets, 1);
  assert.equal(char.level, 1);
  assert.equal(char.statPoints, 500); // 1 reset * 500 pontos
  assert.equal(char.strength, 28);    // Resetou para base

  // 2. Simula atingir 100 resets e executa Master Reset
  char.resets = 100;
  char.level = 400;
  const mr = ResetManager.executeMasterReset(char);
  assert.equal(mr.success, true);
  assert.equal(char.resets, 0); // Zera resets normais
  assert.equal(char.masterResets, 1);
  assert.equal(char.wCoins, 500);
  assert.equal(char.statPoints, 100);
});

test('MasterSkillTree: Progressão de Níveis e Investimento em Talentos', () => {
  const tree = MasterSkillTree.createDefaultTree('char-1');
  assert.equal(tree.masterLevel, 1);
  assert.equal(tree.availableMasterPoints, 1);

  // Adiciona 20 níveis Master
  MasterSkillTree.addMasterLevel(tree, 19);
  assert.equal(tree.masterLevel, 20);
  assert.equal(tree.availableMasterPoints, 20);

  // Investe 10 pontos em mst_armor_defense (Rank 1, Ramo 0)
  for (let i = 0; i < 10; i++) {
    const inv = MasterSkillTree.investSkillPoint(tree, 'mst_armor_defense');
    assert.equal(inv.success, true);
  }
  assert.equal(tree.skills.get('mst_armor_defense')!.currentLevel, 10);
  assert.equal(tree.availableMasterPoints, 10);

  // Agora desbloqueou o Rank 2 (mst_max_hp_boost requer 10 pontos no ramo)
  const invRank2 = MasterSkillTree.investSkillPoint(tree, 'mst_max_hp_boost');
  assert.equal(invRank2.success, true);
  assert.equal(tree.skills.get('mst_max_hp_boost')!.currentLevel, 1);
  assert.equal(tree.availableMasterPoints, 9);
});
