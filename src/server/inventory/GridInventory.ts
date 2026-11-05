import {
  EquipmentSlot,
  ItemCategory,
} from './types.ts';
import type {
  ItemInstance,
  PlacedItem,
  GridDimensions,
} from './types.ts';
import { Item } from './Item.ts';

export interface PlayerStatsContext {
  strength: number;
  agility: number;
  vitality?: number;
  energy?: number;
  command?: number;
  level: number;
  playerClass?: string;
}

export class GridInventory {
  public readonly cols: number;
  public readonly rows: number;

  // Matriz 2D de células contendo o UUID do item ou null
  private grid: (string | null)[][];
  // Mapa de itens posicionados no grid indexados por UUID
  private placedItems: Map<string, PlacedItem>;
  // Itens atualmente equipados nos slots de corpo
  private equippedSlots: Map<EquipmentSlot, ItemInstance>;

  constructor(dimensions: GridDimensions = { cols: 8, rows: 8 }) {
    this.cols = dimensions.cols;
    this.rows = dimensions.rows;
    this.placedItems = new Map();
    this.equippedSlots = new Map();

    this.grid = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null)
    );
  }

  /**
   * Verifica se um item pode ser posicionado nas coordenadas (x, y)
   */
  public canPlaceItem(
    item: ItemInstance,
    x: number,
    y: number,
    rotated = false,
    ignoreItemId?: string
  ): boolean {
    const def = Item.getDefinition(item);
    const effWidth = rotated ? def.height : def.width;
    const effHeight = rotated ? def.width : def.height;

    // Checagem de limites da grade 8x8
    if (x < 0 || y < 0 || x + effWidth > this.cols || y + effHeight > this.rows) {
      return false;
    }

    // Checagem de sobreposição de células
    for (let row = y; row < y + effHeight; row++) {
      for (let col = x; col < x + effWidth; col++) {
        const occupant = this.grid[row][col];
        if (occupant !== null && occupant !== ignoreItemId) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Encontra a primeira célula livre que acomoda as dimensões especificadas
   */
  public findFreeSlot(
    width: number,
    height: number
  ): { x: number; y: number; rotated: boolean } | null {
    // Tenta orientação normal primeiro
    for (let r = 0; r <= this.rows - height; r++) {
      for (let c = 0; c <= this.cols - width; c++) {
        let fits = true;
        for (let dy = 0; dy < height; dy++) {
          for (let dx = 0; dx < width; dx++) {
            if (this.grid[r + dy][c + dx] !== null) {
              fits = false;
              break;
            }
          }
          if (!fits) break;
        }
        if (fits) {
          return { x: c, y: r, rotated: false };
        }
      }
    }

    // Se largura e altura forem diferentes, tenta rotacionado
    if (width !== height) {
      const rotW = height;
      const rotH = width;
      for (let r = 0; r <= this.rows - rotH; r++) {
        for (let c = 0; c <= this.cols - rotW; c++) {
          let fits = true;
          for (let dy = 0; dy < rotH; dy++) {
            for (let dx = 0; dx < rotW; dx++) {
              if (this.grid[r + dy][c + dx] !== null) {
                fits = false;
                break;
              }
            }
            if (!fits) break;
          }
          if (fits) {
            return { x: c, y: r, rotated: true };
          }
        }
      }
    }

    return null;
  }

  /**
   * Adiciona um item ao grid. Se x e y não forem especificados, procura o primeiro slot livre.
   */
  public addItem(
    item: ItemInstance,
    x?: number,
    y?: number,
    rotated = false
  ): boolean {
    const def = Item.getDefinition(item);

    let targetX = x;
    let targetY = y;
    let targetRotated = rotated;

    if (targetX === undefined || targetY === undefined) {
      const free = this.findFreeSlot(def.width, def.height);
      if (!free) {
        return false; // Inventário cheio para as dimensões deste item
      }
      targetX = free.x;
      targetY = free.y;
      targetRotated = free.rotated;
    }

    if (!this.canPlaceItem(item, targetX, targetY, targetRotated)) {
      return false;
    }

    item.rotated = targetRotated;
    const effW = targetRotated ? def.height : def.width;
    const effH = targetRotated ? def.width : def.height;

    // Ocupa as células na matriz
    for (let r = targetY; r < targetY + effH; r++) {
      for (let c = targetX; c < targetX + effW; c++) {
        this.grid[r][c] = item.uuid;
      }
    }

    this.placedItems.set(item.uuid, {
      item,
      x: targetX,
      y: targetY,
      width: effW,
      height: effH,
    });

    return true;
  }

  /**
   * Remove um item do grid pelo UUID
   */
  public removeItem(itemId: string): ItemInstance | null {
    const placed = this.placedItems.get(itemId);
    if (!placed) {
      return null;
    }

    // Libera as células
    for (let r = placed.y; r < placed.y + placed.height; r++) {
      for (let c = placed.x; c < placed.x + placed.width; c++) {
        if (this.grid[r][c] === itemId) {
          this.grid[r][c] = null;
        }
      }
    }

    this.placedItems.delete(itemId);
    return placed.item;
  }

  /**
   * Move um item para uma nova posição na grade (com suporte a rotação)
   */
  public moveItem(
    itemId: string,
    newX: number,
    newY: number,
    rotated?: boolean
  ): boolean {
    const placed = this.placedItems.get(itemId);
    if (!placed) {
      return false;
    }

    const item = placed.item;
    const isRotated = rotated !== undefined ? rotated : !!item.rotated;

    // Valida nova posição ignorando a si mesmo
    if (!this.canPlaceItem(item, newX, newY, isRotated, itemId)) {
      return false;
    }

    // Remove ocupação anterior
    for (let r = placed.y; r < placed.y + placed.height; r++) {
      for (let c = placed.x; c < placed.x + placed.width; c++) {
        if (this.grid[r][c] === itemId) {
          this.grid[r][c] = null;
        }
      }
    }

    // Aplica nova rotação
    item.rotated = isRotated;
    const def = Item.getDefinition(item);
    const effW = isRotated ? def.height : def.width;
    const effH = isRotated ? def.width : def.height;

    // Registra nova ocupação
    for (let r = newY; r < newY + effH; r++) {
      for (let c = newX; c < newX + effW; c++) {
        this.grid[r][c] = itemId;
      }
    }

    placed.x = newX;
    placed.y = newY;
    placed.width = effW;
    placed.height = effH;

    return true;
  }

  /**
   * Obtém o item posicionado em uma célula de coordenadas (x, y)
   */
  public getItemAt(x: number, y: number): ItemInstance | null {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
      return null;
    }
    const id = this.grid[y][x];
    if (!id) return null;
    return this.placedItems.get(id)?.item ?? null;
  }

  /**
   * Obtém os dados de colocação do item
   */
  public getPlacedItem(itemId: string): PlacedItem | null {
    return this.placedItems.get(itemId) ?? null;
  }

  /**
   * Retorna todos os itens presentes na grade
   */
  public getAllGridItems(): PlacedItem[] {
    return Array.from(this.placedItems.values());
  }

  /**
   * Verifica se o jogador possui um item com o ID de definição informado
   */
  public hasItem(defId: string): boolean {
    return Array.from(this.placedItems.values()).some((p) => p.item.defId === defId);
  }

  /**
   * Encontra o primeiro item com o ID de definição informado
   */
  public findItemByDefId(defId: string): PlacedItem | null {
    for (const p of this.placedItems.values()) {
      if (p.item.defId === defId) return p;
    }
    return null;
  }

  /**
   * Remove o primeiro item com o ID de definição informado da bolsa
   */
  public removeItemByDefId(defId: string): boolean {
    const found = this.findItemByDefId(defId);
    if (!found) return false;
    return !!this.removeItem(found.item.uuid);
  }

  // ==========================================
  // SLOTS DE EQUIPAMENTO
  // ==========================================

  /**
   * Equipa um item que está no inventário em um slot de equipamento
   */
  public equipItem(
    itemId: string,
    slot: EquipmentSlot,
    context?: PlayerStatsContext
  ): { success: boolean; unequippedItem?: ItemInstance; error?: string } {
    const placed = this.placedItems.get(itemId);
    if (!placed) {
      return { success: false, error: 'Item não encontrado no inventário' };
    }

    const item = placed.item;
    const def = Item.getDefinition(item);

    // Valida se o slot é compatível com o item
    if (!def.validEquipSlots || !def.validEquipSlots.includes(slot)) {
      return {
        success: false,
        error: `Item "${def.name}" não pode ser equipado no slot ${slot}`,
      };
    }

    // Valida atributos e requisitos de nível do jogador se fornecidos
    if (context) {
      const reqs = Item.calculateRequirements(item);
      if (context.strength < reqs.strength) {
        return { success: false, error: `Força insuficiente (requer ${reqs.strength})` };
      }
      if (context.agility < reqs.agility) {
        return { success: false, error: `Agilidade insuficiente (requer ${reqs.agility})` };
      }
      if (reqs.energy && (context.energy || 0) < reqs.energy) {
        return { success: false, error: `Energia insuficiente (requer ${reqs.energy})` };
      }
      if (reqs.level && context.level < reqs.level) {
        return { success: false, error: `Nível insuficiente (requer nível ${reqs.level})` };
      }
      if (
        def.requirements.allowedClasses &&
        context.playerClass &&
        !def.requirements.allowedClasses.includes(context.playerClass)
      ) {
        return { success: false, error: `Classe ${context.playerClass} não pode equipar este item` };
      }
    }

    // Regra de Arma de Duas Mãos (Two-Handed Weapon)
    if (def.isTwoHanded) {
      // Se estamos equipando arma de 2 mãos no slot principal, a mão esquerda (off-hand) deve estar livre
      if (this.equippedSlots.has(EquipmentSlot.WEAPON_LEFT)) {
        return {
          success: false,
          error: 'Mão secundária deve estar vazia para equipar arma de duas mãos',
        };
      }
    }

    // Se o slot esquerdo for alvo de equipamento, não podemos se a mão direita tiver arma de 2 mãos
    if (slot === EquipmentSlot.WEAPON_LEFT) {
      const mainHand = this.equippedSlots.get(EquipmentSlot.WEAPON_RIGHT);
      if (mainHand) {
        const mainDef = Item.getDefinition(mainHand);
        if (mainDef.isTwoHanded) {
          return {
            success: false,
            error: 'Não é possível equipar escudo ou arma secundária com arma de duas mãos na mão principal',
          };
        }
      }
    }

    // Verifica se já existe um item equipado neste slot
    const existingEquipped = this.equippedSlots.get(slot);

    // Remove o item a ser equipado do grid
    this.removeItem(itemId);

    // Se havia um item equipado, tenta colocá-lo no grid (se possível no mesmo espaço ou outro livre)
    if (existingEquipped) {
      const placedBack = this.addItem(existingEquipped, placed.x, placed.y, false);
      if (!placedBack) {
        // Tenta qualquer slot livre
        const anySlot = this.addItem(existingEquipped);
        if (!anySlot) {
          // Reverte operação de remoção
          this.addItem(item, placed.x, placed.y, placed.item.rotated);
          return { success: false, error: 'Sem espaço no inventário para desequipar o item anterior' };
        }
      }
    }

    // Registra no slot de equipamento
    this.equippedSlots.set(slot, item);

    return {
      success: true,
      unequippedItem: existingEquipped,
    };
  }

  /**
   * Desequipa um item de um slot para o grid
   */
  public unequipItem(
    slot: EquipmentSlot,
    targetX?: number,
    targetY?: number
  ): { success: boolean; error?: string } {
    const item = this.equippedSlots.get(slot);
    if (!item) {
      return { success: false, error: `Nenhum item equipado no slot ${slot}` };
    }

    const placed = this.addItem(item, targetX, targetY);
    if (!placed) {
      return { success: false, error: 'Sem espaço livre no inventário para acomodar o item' };
    }

    this.equippedSlots.delete(slot);
    return { success: true };
  }

  /**
   * Retorna o item equipado em determinado slot
   */
  public getEquippedItem(slot: EquipmentSlot): ItemInstance | null {
    return this.equippedSlots.get(slot) ?? null;
  }

  /**
   * Retorna todos os slots equipados
   */
  public getAllEquipped(): Map<EquipmentSlot, ItemInstance> {
    return new Map(this.equippedSlots);
  }

  /**
   * Gera representação gráfica em ASCII da grade 8x8 para debug
   */
  public getDebugGridString(): string {
    const lines: string[] = [];
    lines.push('    0   1   2   3   4   5   6   7');
    lines.push('  +---+---+---+---+---+---+---+---+');

    for (let r = 0; r < this.rows; r++) {
      let rowStr = `${r} |`;
      for (let c = 0; c < this.cols; c++) {
        const id = this.grid[r][c];
        if (id) {
          // Usa os 3 primeiros caracteres do ID para exibição compacta
          const code = id.replace('item-', '').substring(0, 3);
          rowStr += `${code}|`;
        } else {
          rowStr += ' . |';
        }
      }
      lines.push(rowStr);
      lines.push('  +---+---+---+---+---+---+---+---+');
    }

    return lines.join('\n');
  }

  /**
   * Serialização para persistência em JSON ou banco de dados
   */
  public serialize(): {
    cols: number;
    rows: number;
    items: { item: ItemInstance; x: number; y: number; rotated: boolean }[];
    equipped: { slot: EquipmentSlot; item: ItemInstance }[];
  } {
    const items = Array.from(this.placedItems.values()).map((p) => ({
      item: p.item,
      x: p.x,
      y: p.y,
      rotated: !!p.item.rotated,
    }));

    const equipped = Array.from(this.equippedSlots.entries()).map(([slot, item]) => ({
      slot,
      item,
    }));

    return {
      cols: this.cols,
      rows: this.rows,
      items,
      equipped,
    };
  }

  /**
   * Restaura o inventário a partir do estado serializado
   */
  public static deserialize(data: ReturnType<GridInventory['serialize']>): GridInventory {
    const inv = new GridInventory({ cols: data.cols, rows: data.rows });

    for (const entry of data.items) {
      inv.addItem(entry.item, entry.x, entry.y, entry.rotated);
    }

    for (const eq of data.equipped) {
      inv.equippedSlots.set(eq.slot, eq.item);
    }

    return inv;
  }
}
