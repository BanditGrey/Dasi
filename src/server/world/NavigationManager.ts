/**
 * Dasi MMORPG - Navigation and Gate System
 * Engenharia reversa e implementação canônica baseada nas fontes Webzen C++ GameServer:
 * - Move.h / Move.cpp
 * - Gate.h / Gate.cpp
 * - Move.txt e Gate.txt
 * 
 * Regras Canônicas:
 * 1. Classes Especiais (MG, DL, RF) possuem desconto de 1/3 no requisito de nível:
 *    MinLevel = Math.floor(Level * 2 / 3), exceto em Swamp of Calmness (Map 56).
 * 2. Bloqueio de PK (Phonomania / Assassino com PK Level >= 5):
 *    Não pode utilizar `/move` ou janela de teleporte para cidades pacíficas.
 * 3. Gates com Flag 0 (Spawn / Teleporte): sorteia coordenada aleatória válida no retângulo (X..TX, Y..TY).
 * 4. Gates com Flag 1 (Portal Físico): ao pisar na área, redireciona para o TargetGate correspondente.
 */

export interface MoveReqInfo {
  index: number;
  name: string;
  gate: number;
  minLevel: number;
  maxLevel: number;
  costZen: number;
}

export interface GateInfo {
  index: number;
  flag: number; // 0 = Teleport Spawn, 1 = Entrance Trigger, 2 = Exit Landing
  map: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  targetGate: number;
  dir: number;
  minLevel: number;
  maxLevel: number;
}

// -----------------------------------------------------------------------------
// Tabela Canônica Move.txt (37 Destinos Oficiais)
// -----------------------------------------------------------------------------
export const MOVE_TABLE: Record<number, MoveReqInfo> = {
  1: { index: 1, name: 'Arena', gate: 50, minLevel: 50, maxLevel: 400, costZen: 2000 },
  2: { index: 2, name: 'Lorencia', gate: 17, minLevel: 10, maxLevel: 400, costZen: 2000 },
  3: { index: 3, name: 'Noria', gate: 27, minLevel: 10, maxLevel: 400, costZen: 2000 },
  4: { index: 4, name: 'Devias', gate: 22, minLevel: 20, maxLevel: 400, costZen: 2000 },
  5: { index: 5, name: 'Devias2', gate: 72, minLevel: 20, maxLevel: 400, costZen: 2500 },
  6: { index: 6, name: 'Devias3', gate: 73, minLevel: 20, maxLevel: 400, costZen: 3000 },
  7: { index: 7, name: 'Devias4', gate: 74, minLevel: 20, maxLevel: 400, costZen: 3500 },
  8: { index: 8, name: 'Dungeon', gate: 2, minLevel: 30, maxLevel: 400, costZen: 3000 },
  9: { index: 9, name: 'Dungeon2', gate: 6, minLevel: 40, maxLevel: 400, costZen: 3500 },
  10: { index: 10, name: 'Dungeon3', gate: 10, minLevel: 50, maxLevel: 400, costZen: 4000 },
  11: { index: 11, name: 'Atlans', gate: 49, minLevel: 70, maxLevel: 400, costZen: 4000 },
  12: { index: 12, name: 'Atlans2', gate: 75, minLevel: 80, maxLevel: 400, costZen: 4500 },
  13: { index: 13, name: 'Atlans3', gate: 76, minLevel: 90, maxLevel: 400, costZen: 5000 },
  14: { index: 14, name: 'LostTower', gate: 42, minLevel: 50, maxLevel: 400, costZen: 5000 },
  15: { index: 15, name: 'LostTower2', gate: 31, minLevel: 50, maxLevel: 400, costZen: 5500 },
  16: { index: 16, name: 'LostTower3', gate: 33, minLevel: 50, maxLevel: 400, costZen: 6000 },
  17: { index: 17, name: 'LostTower4', gate: 35, minLevel: 60, maxLevel: 400, costZen: 6500 },
  18: { index: 18, name: 'LostTower5', gate: 37, minLevel: 60, maxLevel: 400, costZen: 7000 },
  19: { index: 19, name: 'LostTower6', gate: 39, minLevel: 70, maxLevel: 400, costZen: 7500 },
  20: { index: 20, name: 'LostTower7', gate: 41, minLevel: 70, maxLevel: 400, costZen: 8000 },
  21: { index: 21, name: 'Tarkan', gate: 57, minLevel: 140, maxLevel: 400, costZen: 8000 },
  22: { index: 22, name: 'Tarkan2', gate: 77, minLevel: 140, maxLevel: 400, costZen: 8500 },
  23: { index: 23, name: 'Icarus', gate: 63, minLevel: 170, maxLevel: 400, costZen: 10000 },
  25: { index: 25, name: 'Aida1', gate: 119, minLevel: 150, maxLevel: 400, costZen: 8500 },
  26: { index: 26, name: 'Crywolf', gate: 118, minLevel: 10, maxLevel: 400, costZen: 0 },
  27: { index: 27, name: 'Aida2', gate: 140, minLevel: 150, maxLevel: 400, costZen: 8500 },
  28: { index: 28, name: 'Kanturu1', gate: 138, minLevel: 200, maxLevel: 400, costZen: 9000 },
  29: { index: 29, name: 'Kanturu2', gate: 141, minLevel: 220, maxLevel: 400, costZen: 9000 },
  30: { index: 30, name: 'KanturuRelic', gate: 139, minLevel: 230, maxLevel: 400, costZen: 12000 },
  31: { index: 31, name: 'Elbeland', gate: 267, minLevel: 10, maxLevel: 400, costZen: 2000 },
  32: { index: 32, name: 'Elbeland2', gate: 268, minLevel: 10, maxLevel: 400, costZen: 2500 },
  33: { index: 33, name: 'SwampofCalmness', gate: 273, minLevel: 400, maxLevel: 400, costZen: 15000 },
  34: { index: 34, name: 'Raklion', gate: 287, minLevel: 280, maxLevel: 400, costZen: 15000 },
  43: { index: 43, name: 'Elbeland3', gate: 269, minLevel: 10, maxLevel: 400, costZen: 3000 },
  45: { index: 45, name: 'Kanturu_ruin_island', gate: 334, minLevel: 160, maxLevel: 400, costZen: 15000 },
  46: { index: 46, name: 'Karutan1', gate: 335, minLevel: 170, maxLevel: 400, costZen: 13000 },
  47: { index: 47, name: 'Karutan2', gate: 344, minLevel: 170, maxLevel: 400, costZen: 14000 },
};

// -----------------------------------------------------------------------------
// Principais Gates Canônicos (Gate.txt)
// -----------------------------------------------------------------------------
export const GATE_TABLE: Record<number, GateInfo> = {
  // Lorencia
  17: { index: 17, flag: 0, map: 0, x: 133, y: 118, tx: 151, ty: 135, targetGate: 0, dir: 0, minLevel: 0, maxLevel: 400 },
  1: { index: 1, flag: 1, map: 0, x: 121, y: 232, tx: 123, ty: 233, targetGate: 2, dir: 0, minLevel: 20, maxLevel: 400 },
  18: { index: 18, flag: 1, map: 0, x: 5, y: 38, tx: 6, ty: 41, targetGate: 19, dir: 0, minLevel: 15, maxLevel: 400 },
  23: { index: 23, flag: 1, map: 0, x: 213, y: 246, tx: 217, ty: 247, targetGate: 24, dir: 0, minLevel: 10, maxLevel: 400 },

  // Dungeon
  2: { index: 2, flag: 0, map: 1, x: 107, y: 247, tx: 110, ty: 247, targetGate: 0, dir: 1, minLevel: 20, maxLevel: 400 },
  6: { index: 6, flag: 0, map: 1, x: 231, y: 126, tx: 234, ty: 127, targetGate: 0, dir: 1, minLevel: 20, maxLevel: 400 },
  10: { index: 10, flag: 0, map: 1, x: 3, y: 83, tx: 4, ty: 86, targetGate: 0, dir: 3, minLevel: 20, maxLevel: 400 },

  // Devias
  22: { index: 22, flag: 0, map: 2, x: 197, y: 35, tx: 218, ty: 50, targetGate: 0, dir: 0, minLevel: 15, maxLevel: 400 },
  72: { index: 72, flag: 0, map: 2, x: 20, y: 25, tx: 25, ty: 30, targetGate: 0, dir: 0, minLevel: 20, maxLevel: 400 },
  73: { index: 73, flag: 0, map: 2, x: 225, y: 230, tx: 230, ty: 235, targetGate: 0, dir: 0, minLevel: 20, maxLevel: 400 },
  74: { index: 74, flag: 0, map: 2, x: 60, y: 180, tx: 65, ty: 185, targetGate: 0, dir: 0, minLevel: 20, maxLevel: 400 },
  19: { index: 19, flag: 2, map: 2, x: 242, y: 34, tx: 243, ty: 37, targetGate: 0, dir: 7, minLevel: 15, maxLevel: 400 },

  // Noria
  27: { index: 27, flag: 0, map: 3, x: 171, y: 108, tx: 177, ty: 117, targetGate: 0, dir: 0, minLevel: 0, maxLevel: 400 },
  24: { index: 24, flag: 2, map: 3, x: 148, y: 5, tx: 155, ty: 6, targetGate: 0, dir: 5, minLevel: 10, maxLevel: 400 },

  // LostTower
  42: { index: 42, flag: 0, map: 4, x: 208, y: 77, tx: 212, ty: 81, targetGate: 0, dir: 1, minLevel: 40, maxLevel: 400 },
  31: { index: 31, flag: 0, map: 4, x: 241, y: 237, tx: 244, ty: 238, targetGate: 0, dir: 1, minLevel: 40, maxLevel: 400 },
  33: { index: 33, flag: 0, map: 4, x: 86, y: 166, tx: 87, ty: 168, targetGate: 0, dir: 3, minLevel: 40, maxLevel: 400 },
  35: { index: 35, flag: 0, map: 4, x: 87, y: 86, tx: 88, ty: 89, targetGate: 0, dir: 3, minLevel: 50, maxLevel: 400 },
  37: { index: 37, flag: 0, map: 4, x: 128, y: 53, tx: 131, ty: 54, targetGate: 0, dir: 1, minLevel: 50, maxLevel: 400 },
  39: { index: 39, flag: 0, map: 4, x: 52, y: 53, tx: 55, ty: 54, targetGate: 0, dir: 1, minLevel: 50, maxLevel: 400 },
  41: { index: 41, flag: 0, map: 4, x: 7, y: 85, tx: 10, ty: 87, targetGate: 0, dir: 1, minLevel: 50, maxLevel: 400 },

  // Arena (Stadium)
  50: { index: 50, flag: 0, map: 6, x: 63, y: 110, tx: 67, ty: 115, targetGate: 0, dir: 0, minLevel: 50, maxLevel: 400 },

  // Atlans
  49: { index: 49, flag: 0, map: 7, x: 14, y: 11, tx: 27, ty: 23, targetGate: 0, dir: 0, minLevel: 60, maxLevel: 400 },
  75: { index: 75, flag: 0, map: 7, x: 220, y: 35, tx: 225, ty: 40, targetGate: 0, dir: 0, minLevel: 70, maxLevel: 400 },
  76: { index: 76, flag: 0, map: 7, x: 60, y: 150, tx: 65, ty: 155, targetGate: 0, dir: 0, minLevel: 80, maxLevel: 400 },

  // Tarkan
  57: { index: 57, flag: 0, map: 8, x: 254, y: 13, tx: 255, ty: 17, targetGate: 0, dir: 0, minLevel: 130, maxLevel: 400 },
  77: { index: 77, flag: 0, map: 8, x: 100, y: 150, tx: 105, ty: 155, targetGate: 0, dir: 0, minLevel: 140, maxLevel: 400 },

  // Icarus
  63: { index: 63, flag: 0, map: 10, x: 14, y: 12, tx: 16, ty: 15, targetGate: 0, dir: 0, minLevel: 160, maxLevel: 400 },

  // Aida
  119: { index: 119, flag: 0, map: 33, x: 82, y: 10, tx: 85, ty: 14, targetGate: 0, dir: 0, minLevel: 150, maxLevel: 400 },
  140: { index: 140, flag: 0, map: 33, x: 120, y: 100, tx: 125, ty: 105, targetGate: 0, dir: 0, minLevel: 150, maxLevel: 400 },

  // Crywolf
  118: { index: 118, flag: 0, map: 34, x: 115, y: 25, tx: 125, ty: 35, targetGate: 0, dir: 0, minLevel: 10, maxLevel: 400 },

  // Kanturu
  138: { index: 138, flag: 0, map: 37, x: 140, y: 180, tx: 145, ty: 185, targetGate: 0, dir: 0, minLevel: 200, maxLevel: 400 },
  141: { index: 141, flag: 0, map: 37, x: 200, y: 100, tx: 205, ty: 105, targetGate: 0, dir: 0, minLevel: 220, maxLevel: 400 },
  139: { index: 139, flag: 0, map: 38, x: 140, y: 140, tx: 145, ty: 145, targetGate: 0, dir: 0, minLevel: 230, maxLevel: 400 },
  334: { index: 334, flag: 0, map: 37, x: 50, y: 50, tx: 55, ty: 55, targetGate: 0, dir: 0, minLevel: 160, maxLevel: 400 },

  // Elbeland
  267: { index: 267, flag: 0, map: 51, x: 50, y: 220, tx: 55, ty: 225, targetGate: 0, dir: 0, minLevel: 10, maxLevel: 400 },
  268: { index: 268, flag: 0, map: 51, x: 100, y: 180, tx: 105, ty: 185, targetGate: 0, dir: 0, minLevel: 10, maxLevel: 400 },
  269: { index: 269, flag: 0, map: 51, x: 150, y: 120, tx: 155, ty: 125, targetGate: 0, dir: 0, minLevel: 10, maxLevel: 400 },

  // Swamp of Calmness
  273: { index: 273, flag: 0, map: 56, x: 128, y: 100, tx: 132, ty: 105, targetGate: 0, dir: 0, minLevel: 400, maxLevel: 400 },

  // Raklion
  287: { index: 287, flag: 0, map: 57, x: 170, y: 25, tx: 175, ty: 30, targetGate: 0, dir: 0, minLevel: 280, maxLevel: 400 },

  // Karutan
  335: { index: 335, flag: 0, map: 62, x: 120, y: 130, tx: 125, ty: 135, targetGate: 0, dir: 0, minLevel: 170, maxLevel: 400 },
  344: { index: 344, flag: 0, map: 62, x: 180, y: 80, tx: 185, ty: 85, targetGate: 0, dir: 0, minLevel: 170, maxLevel: 400 },
};

export class NavigationManager {
  /**
   * Calcula o nível mínimo exigido para entrada no mapa considerando a classe do personagem.
   * C++ CGate::GetMoveLevel:
   * MG, DL e RF recebem redução para 2/3 do nível mínimo (exceto em Swamp of Calmness).
   */
  public static getRequiredMoveLevel(className: string, mapId: number, baseMinLevel: number): number {
    const isSpecialClass = className === 'MG' || className === 'DL' || className === 'RF';
    if (isSpecialClass && mapId !== 56) {
      return Math.floor((baseMinLevel * 2) / 3);
    }
    return baseMinLevel;
  }

  /**
   * Processa o comando ou clique na janela de Move (/move <mapName> ou moveIndex)
   */
  public static processMoveRequest(
    player: {
      name: string;
      className: string;
      level: number;
      zen: number;
      pkLevel?: number; // 3 = Normal, 4 = Murderer 1, 5 = Murderer 2, 6 = Phonomania
    },
    moveIndexOrName: number | string
  ): {
    success: boolean;
    mapId?: number;
    x?: number;
    y?: number;
    costZen?: number;
    message: string;
  } {
    let moveInfo: MoveReqInfo | undefined;

    if (typeof moveIndexOrName === 'number') {
      moveInfo = MOVE_TABLE[moveIndexOrName];
    } else {
      const lower = moveIndexOrName.toLowerCase().trim();
      moveInfo = Object.values(MOVE_TABLE).find((m) => m.name.toLowerCase() === lower);
    }

    if (!moveInfo) {
      return { success: false, message: 'Destino de teleporte não encontrado' };
    }

    const gate = GATE_TABLE[moveInfo.gate];
    if (!gate) {
      return { success: false, message: 'Gate de destino inválido' };
    }

    // Validação de PK Level (Assassinos com PK >= 5 não podem utilizar teleporte para cidades/mapas)
    if (player.pkLevel && player.pkLevel >= 5) {
      return { success: false, message: 'Assassinos (PK) estão proibidos de usar o sistema de teleporte' };
    }

    // Validação de Nível com desconto de classe
    const reqLevel = this.getRequiredMoveLevel(player.className, gate.map, moveInfo.minLevel);
    if (player.level < reqLevel) {
      return {
        success: false,
        message: `Nível insuficiente. Nível necessário: ${reqLevel} (Seu nível: ${player.level})`,
      };
    }

    // Validação de Zen
    if (player.zen < moveInfo.costZen) {
      return {
        success: false,
        costZen: moveInfo.costZen,
        message: `Zen insuficiente. Custo: ${moveInfo.costZen} Zen (Você possui: ${player.zen} Zen)`,
      };
    }

    // Sorteio de coordenadas válidas no retângulo de spawn do gate (X..TX, Y..TY)
    const rangeX = Math.max(0, gate.tx - gate.x);
    const rangeY = Math.max(0, gate.ty - gate.y);
    const spawnX = gate.x + (rangeX > 0 ? Math.floor(Math.random() * (rangeX + 1)) : 0);
    const spawnY = gate.y + (rangeY > 0 ? Math.floor(Math.random() * (rangeY + 1)) : 0);

    return {
      success: true,
      mapId: gate.map,
      x: spawnX,
      y: spawnY,
      costZen: moveInfo.costZen,
      message: `Teleportado com sucesso para ${moveInfo.name}!`,
    };
  }

  /**
   * Verifica se o personagem pisou em um portal de transição de mapa físico (Flag 1)
   */
  public static checkGateStep(
    player: {
      className: string;
      level: number;
    },
    currentMap: number,
    x: number,
    y: number
  ): {
    triggered: boolean;
    targetGateId?: number;
    targetMap?: number;
    targetX?: number;
    targetY?: number;
    message?: string;
  } {
    // Procura gate de entrada (flag 1) na posição do jogador
    const entranceGate = Object.values(GATE_TABLE).find(
      (g) =>
        g.flag === 1 &&
        g.map === currentMap &&
        x >= g.x &&
        x <= g.tx &&
        y >= g.y &&
        y <= g.ty
    );

    if (!entranceGate) {
      return { triggered: false };
    }

    const targetGate = GATE_TABLE[entranceGate.targetGate];
    if (!targetGate) {
      return { triggered: false };
    }

    const reqLevel = this.getRequiredMoveLevel(player.className, targetGate.map, entranceGate.minLevel);
    if (player.level < reqLevel) {
      return {
        triggered: false,
        message: `Nível insuficiente para atravessar o portal. Necessário: ${reqLevel}`,
      };
    }

    const rangeX = Math.max(0, targetGate.tx - targetGate.x);
    const rangeY = Math.max(0, targetGate.ty - targetGate.y);
    const landingX = targetGate.x + (rangeX > 0 ? Math.floor(Math.random() * (rangeX + 1)) : 0);
    const landingY = targetGate.y + (rangeY > 0 ? Math.floor(Math.random() * (rangeY + 1)) : 0);

    return {
      triggered: true,
      targetGateId: targetGate.index,
      targetMap: targetGate.map,
      targetX: landingX,
      targetY: landingY,
      message: `Atravessou o portal para o Mapa ${targetGate.map}`,
    };
  }
}
