/**
 * Dasi MMORPG - Árvore de Habilidades Master (Master Skill Tree)
 * Sistema de 200 Níveis Master da Season 5.2 (GameServer/MasterSkillTree.cpp).
 */

export interface MasterSkillNode {
  skillId: string;
  name: string;
  treeIndex: 0 | 1 | 2; // Ramo 0, 1 ou 2
  rank: number;         // 1 a 9
  currentLevel: number;
  maxLevel: number;     // Tipicamente 5 ou 10 ou 20
  requiredRankPoints: number; // Mínimo de pontos investidos no mesmo ramo
}

export interface MasterSkillTreeState {
  characterId: string;
  masterLevel: number;
  masterExperience: number;
  availableMasterPoints: number;
  skills: Map<string, MasterSkillNode>;
}

export class MasterSkillTree {
  public static readonly MAX_MASTER_LEVEL = 200;

  /**
   * Inicializa o estado da Árvore Master para um personagem de 3ª classe
   */
  public static createDefaultTree(characterId: string): MasterSkillTreeState {
    const skills = new Map<string, MasterSkillNode>();

    // Ramo 0: Proteção & Sobrevivência
    skills.set('mst_armor_defense', {
      skillId: 'mst_armor_defense',
      name: 'Defesa de Armadura Aprimorada',
      treeIndex: 0,
      rank: 1,
      currentLevel: 0,
      maxLevel: 20,
      requiredRankPoints: 0,
    });
    skills.set('mst_max_hp_boost', {
      skillId: 'mst_max_hp_boost',
      name: 'Aumento de Vida Máxima',
      treeIndex: 0,
      rank: 2,
      currentLevel: 0,
      maxLevel: 20,
      requiredRankPoints: 10,
    });

    // Ramo 1: Bravura & Ofensiva
    skills.set('mst_weapon_mastery', {
      skillId: 'mst_weapon_mastery',
      name: 'Maestria com Armas',
      treeIndex: 1,
      rank: 1,
      currentLevel: 0,
      maxLevel: 20,
      requiredRankPoints: 0,
    });
    skills.set('mst_critical_rate_boost', {
      skillId: 'mst_critical_rate_boost',
      name: 'Aumento de Taxa Crítica',
      treeIndex: 1,
      rank: 2,
      currentLevel: 0,
      maxLevel: 20,
      requiredRankPoints: 10,
    });

    // Ramo 2: Maestria & Habilidades Especiais
    skills.set('mst_mana_efficiency', {
      skillId: 'mst_mana_efficiency',
      name: 'Eficiência de Mana e AG',
      treeIndex: 2,
      rank: 1,
      currentLevel: 0,
      maxLevel: 20,
      requiredRankPoints: 0,
    });
    skills.set('mst_skill_damage_boost', {
      skillId: 'mst_skill_damage_boost',
      name: 'Dano de Habilidade Aprimorado',
      treeIndex: 2,
      rank: 2,
      currentLevel: 0,
      maxLevel: 20,
      requiredRankPoints: 10,
    });

    return {
      characterId,
      masterLevel: 1,
      masterExperience: 0,
      availableMasterPoints: 1,
      skills,
    };
  }

  /**
   * Concede nível Master e entrega 1 ponto por nível até o teto de 200
   */
  public static addMasterLevel(state: MasterSkillTreeState, levelsToAdd: number = 1): void {
    const nextLevel = Math.min(this.MAX_MASTER_LEVEL, state.masterLevel + levelsToAdd);
    const added = nextLevel - state.masterLevel;
    state.masterLevel = nextLevel;
    state.availableMasterPoints += added;
  }

  /**
   * Adiciona 1 ponto a um talento da Árvore Master
   */
  public static investSkillPoint(state: MasterSkillTreeState, skillId: string): { success: boolean; error?: string } {
    if (state.availableMasterPoints <= 0) {
      return { success: false, error: 'Pontos Master insuficientes.' };
    }

    const node = state.skills.get(skillId);
    if (!node) {
      return { success: false, error: 'Habilidade não encontrada na árvore.' };
    }

    if (node.currentLevel >= node.maxLevel) {
      return { success: false, error: 'Habilidade já se encontra no nível máximo.' };
    }

    // Calcula os pontos totais investidos no mesmo ramo
    let branchPoints = 0;
    for (const s of state.skills.values()) {
      if (s.treeIndex === node.treeIndex) {
        branchPoints += s.currentLevel;
      }
    }

    if (branchPoints < node.requiredRankPoints) {
      return { success: false, error: `Requer ${node.requiredRankPoints} pontos investidos no ramo para desbloquear este rank.` };
    }

    node.currentLevel += 1;
    state.availableMasterPoints -= 1;
    return { success: true };
  }
}
