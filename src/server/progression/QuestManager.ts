/**
 * Dasi MMORPG - Gerenciador de Quests Canônicas
 * Transcrição das Quests de Sebina (150), Marlon (220) e Apostle Devin (400)
 * (GameServer/QuestObjective.cpp, Quest.cpp).
 */

export const QuestId = {
  SEBINA_PRIEST_PART1: 'SEBINA_PRIEST_PART1',
  SEBINA_PRIEST_PART2: 'SEBINA_PRIEST_PART2',
  MARLON_HONOR_RING: 'MARLON_HONOR_RING',
  MARLON_DARK_STONE: 'MARLON_DARK_STONE',
  DEVIN_PART1: 'DEVIN_PART1',
  DEVIN_PART2: 'DEVIN_PART2',
  DEVIN_PART3: 'DEVIN_PART3',
} as const;

export type QuestId = typeof QuestId[keyof typeof QuestId];

export interface QuestState {
  questId: QuestId;
  completed: boolean;
  active: boolean;
  progressCount: number;
  requiredCount: number;
}

export interface CharacterProgressionState {
  characterId: string;
  name: string;
  classId: number;
  level: number;
  classTier: number; // 1 = Base, 2 = 2ª Classe (ex: BK), 3 = 3ª Classe (ex: BM)
  statPoints: number;
  hasComboUnlocked: boolean;
  hasMasterLevelUnlocked: boolean;
  quests: Record<QuestId, QuestState>;
  inventoryItemIds: string[];
}

export class QuestManager {
  /**
   * Inicializa o estado de quests para um novo personagem
   */
  public static createDefaultState(characterId: string, name: string, classId: number, level: number): CharacterProgressionState {
    return {
      characterId,
      name,
      classId,
      level,
      classTier: 1,
      statPoints: 0,
      hasComboUnlocked: false,
      hasMasterLevelUnlocked: false,
      inventoryItemIds: [],
      quests: {
        SEBINA_PRIEST_PART1: { questId: QuestId.SEBINA_PRIEST_PART1, completed: false, active: false, progressCount: 0, requiredCount: 1 },
        SEBINA_PRIEST_PART2: { questId: QuestId.SEBINA_PRIEST_PART2, completed: false, active: false, progressCount: 0, requiredCount: 1 },
        MARLON_HONOR_RING: { questId: QuestId.MARLON_HONOR_RING, completed: false, active: false, progressCount: 0, requiredCount: 1 },
        MARLON_DARK_STONE: { questId: QuestId.MARLON_DARK_STONE, completed: false, active: false, progressCount: 0, requiredCount: 1 },
        DEVIN_PART1: { questId: QuestId.DEVIN_PART1, completed: false, active: false, progressCount: 0, requiredCount: 3 },
        DEVIN_PART2: { questId: QuestId.DEVIN_PART2, completed: false, active: false, progressCount: 0, requiredCount: 60 },
        DEVIN_PART3: { questId: QuestId.DEVIN_PART3, completed: false, active: false, progressCount: 0, requiredCount: 1 },
      },
    };
  }

  /**
   * Inicia a primeira etapa da Quest de Sebina (Nível 150)
   */
  public static startSebinaPart1(state: CharacterProgressionState): boolean {
    // Magic Gladiator e Dark Lord começam direto com benefícios e não fazem Sebina
    if (state.classId === 3 || state.classId === 4) {
      return false;
    }

    if (state.level < 150 || state.quests.SEBINA_PRIEST_PART1.completed) {
      return false;
    }

    state.quests.SEBINA_PRIEST_PART1.active = true;
    return true;
  }

  /**
   * Conclui Sebina Parte 1 entregando o Scroll of the Emperor
   */
  public static completeSebinaPart1(state: CharacterProgressionState): boolean {
    if (!state.quests.SEBINA_PRIEST_PART1.active || state.quests.SEBINA_PRIEST_PART1.completed) {
      return false;
    }

    const itemIdx = state.inventoryItemIds.indexOf('scroll_of_emperor');
    if (itemIdx === -1) {
      return false;
    }

    // Consome o item e concede 10 pontos
    state.inventoryItemIds.splice(itemIdx, 1);
    state.quests.SEBINA_PRIEST_PART1.completed = true;
    state.quests.SEBINA_PRIEST_PART1.active = false;
    state.statPoints += 10;

    // Ativa automaticamente a parte 2
    state.quests.SEBINA_PRIEST_PART2.active = true;
    return true;
  }

  /**
   * Conclui Sebina Parte 2 com o item de classe específico
   * (Broken Sword para DK, Tear of Elf para Elf, Soul of Wizard para DW, Abyssal Eye para Summoner)
   */
  public static completeSebinaPart2(state: CharacterProgressionState): boolean {
    if (!state.quests.SEBINA_PRIEST_PART2.active || state.quests.SEBINA_PRIEST_PART2.completed) {
      return false;
    }

    const requiredItemByClass: Record<number, string> = {
      0: 'soul_of_wizard',
      1: 'broken_sword',
      2: 'tear_of_elf',
      5: 'abyssal_eye',
    };

    const requiredItem = requiredItemByClass[state.classId];
    if (!requiredItem) {
      return false;
    }

    const itemIdx = state.inventoryItemIds.indexOf(requiredItem);
    if (itemIdx === -1) {
      return false;
    }

    state.inventoryItemIds.splice(itemIdx, 1);
    state.quests.SEBINA_PRIEST_PART2.completed = true;
    state.quests.SEBINA_PRIEST_PART2.active = false;

    // Concede evolução para 2ª Classe e +10 pontos extras
    state.classTier = 2;
    state.statPoints += 10;
    return true;
  }

  /**
   * Inicia e Conclui a Quest de Marlon (Nível 220)
   * Parte 1: Ring of Honor (concede +1 ponto por nível retroativo a partir do 220)
   */
  public static completeMarlonPart1(state: CharacterProgressionState): boolean {
    if (state.level < 220 || state.classTier < 2 || state.quests.MARLON_HONOR_RING.completed) {
      return false;
    }

    const itemIdx = state.inventoryItemIds.indexOf('ring_of_honor');
    if (itemIdx === -1) {
      return false;
    }

    state.inventoryItemIds.splice(itemIdx, 1);
    state.quests.MARLON_HONOR_RING.completed = true;

    // Bônus retroativo: concede 1 ponto para cada nível que o personagem possui além do nível 220
    const retroactiveLevels = Math.max(0, state.level - 220);
    state.statPoints += retroactiveLevels + 1;

    // Se for Blade Knight, ativa a parte 2 (Dark Stone para Combo)
    if (state.classId === 1) {
      state.quests.MARLON_DARK_STONE.active = true;
    }

    return true;
  }

  /**
   * Conclui a Quest de Marlon Parte 2 (Combo Skill para Blade Knight)
   */
  public static completeMarlonPart2(state: CharacterProgressionState): boolean {
    if (state.classId !== 1 || !state.quests.MARLON_DARK_STONE.active || state.quests.MARLON_DARK_STONE.completed) {
      return false;
    }

    const itemIdx = state.inventoryItemIds.indexOf('dark_stone');
    if (itemIdx === -1) {
      return false;
    }

    state.inventoryItemIds.splice(itemIdx, 1);
    state.quests.MARLON_DARK_STONE.completed = true;
    state.quests.MARLON_DARK_STONE.active = false;
    state.hasComboUnlocked = true;
    return true;
  }

  /**
   * Conclui a Quest de Mudança para 3ª Classe (Apostle Devin - Nível 400)
   * Requer os 3 itens raros: Flame of Death Beam Knight, Horn of Hell Maine e Feather of Phoenix
   */
  public static completeDevinThirdClassChange(state: CharacterProgressionState): boolean {
    if (state.level < 400 || state.classTier >= 3) {
      return false;
    }

    const flameIdx = state.inventoryItemIds.indexOf('flame_of_death_beam_knight');
    const hornIdx = state.inventoryItemIds.indexOf('horn_of_hell_maine');
    const featherIdx = state.inventoryItemIds.indexOf('feather_of_phoenix');

    if (flameIdx === -1 || hornIdx === -1 || featherIdx === -1) {
      return false;
    }

    // Remove os 3 itens
    const toRemove = [flameIdx, hornIdx, featherIdx].sort((a, b) => b - a);
    for (const idx of toRemove) {
      state.inventoryItemIds.splice(idx, 1);
    }

    state.classTier = 3;
    state.hasMasterLevelUnlocked = true;
    state.statPoints += 30; // Bônus comemorativo da 3ª classe
    state.quests.DEVIN_PART1.completed = true;
    return true;
  }
}
