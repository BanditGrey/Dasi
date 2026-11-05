/**
 * Dasi MMORPG - Gerenciador Central de Arenas de Eventos
 * Orquestra Blood Castle, Devil Square, Chaos Castle e Coliseu de Duelos.
 */

import { BloodCastleInstance } from './BloodCastleInstance.ts';
import { DevilSquareInstance } from './DevilSquareInstance.ts';
import { ChaosCastleInstance } from './ChaosCastleInstance.ts';
import { DuelColiseumInstance } from './DuelColiseumInstance.ts';
import type { ClientSession } from '../network/SessionManager.ts';

export type EventType = 'BLOOD_CASTLE' | 'DEVIL_SQUARE' | 'CHAOS_CASTLE' | 'DUEL_COLISEUM';

export class EventManager {
  public bloodCastle: BloodCastleInstance | null = null;
  public devilSquare: DevilSquareInstance | null = null;
  public chaosCastle: ChaosCastleInstance | null = null;
  public activeDuels: Map<string, DuelColiseumInstance> = new Map();

  private instanceCounter = 1;

  /**
   * Tenta inscrever e entrar em um dos 4 eventos
   */
  public enterEvent(
    type: EventType,
    session: ClientSession
  ): {
    success: boolean;
    instanceId?: string;
    error?: string;
  } {
    const inv = session.inventory;

    switch (type) {
      case 'BLOOD_CASTLE': {
        // Valida Capa da Invisibilidade
        const hasCloak = inv.hasItem('cloak_of_invisibility');
        if (!hasCloak) {
          return { success: false, error: 'Requer Invisibility Cloak (+1 a +7) para entrar no Blood Castle!' };
        }

        if (!this.bloodCastle || this.bloodCastle.stage === 'TRIUMPH' || this.bloodCastle.stage === 'FAILED') {
          this.bloodCastle = new BloodCastleInstance({
            instanceId: `bc-${(this.instanceCounter++).toString(16)}`,
          });
          this.bloodCastle.start();
        }

        // Consome a capa
        inv.removeItemByDefId('cloak_of_invisibility');
        this.bloodCastle.addParticipant(session.sessionId);
        return { success: true, instanceId: this.bloodCastle.id };
      }

      case 'DEVIL_SQUARE': {
        // Valida Convite do Devil Square
        const hasInvitation = inv.hasItem('devil_square_invitation');
        if (!hasInvitation) {
          return { success: false, error: 'Requer Devil Invitation para entrar no Devil Square!' };
        }

        if (!this.devilSquare || this.devilSquare.state === 'TRIUMPH' || this.devilSquare.state === 'FAILED') {
          this.devilSquare = new DevilSquareInstance(`ds-${(this.instanceCounter++).toString(16)}`);
          this.devilSquare.start();
        }

        // Consome o convite
        inv.removeItemByDefId('devil_square_invitation');
        this.devilSquare.addParticipant(session.sessionId);
        return { success: true, instanceId: this.devilSquare.id };
      }

      case 'CHAOS_CASTLE': {
        // Valida Armadura do Caos
        const hasArmor = inv.hasItem('armor_of_chaos');
        if (!hasArmor) {
          return { success: false, error: 'Requer Armor of Guardsman para entrar no Chaos Castle!' };
        }

        if (!this.chaosCastle || this.chaosCastle.stage === 'FINISHED') {
          this.chaosCastle = new ChaosCastleInstance(`cc-${(this.instanceCounter++).toString(16)}`);
          // Adiciona participantes simulados para criar a experiência Battle Royale clássica
          for (let i = 1; i <= 9; i++) {
            this.chaosCastle.addCombatant(`bot-chaos-${i}`, `Guardsman #${i}`, false, 800);
          }
        }

        inv.removeItemByDefId('armor_of_chaos');
        const charHp = (session.character?.vitality ?? 100) * 10;
        this.chaosCastle.addCombatant(session.sessionId, session.character?.name || 'Hero', true, charHp);

        if (this.chaosCastle.stage === 'WAITING') {
          this.chaosCastle.start();
        }

        return { success: true, instanceId: this.chaosCastle.id };
      }

      case 'DUEL_COLISEUM': {
        // Encontra ou cria uma arena de duelo
        let duel = Array.from(this.activeDuels.values()).find((d) => d.state === 'WAITING_PLAYERS');
        if (!duel) {
          duel = new DuelColiseumInstance(`duel-${(this.instanceCounter++).toString(16)}`);
          this.activeDuels.set(duel.id, duel);
        }

        const registered = duel.registerDuelist(
          session.sessionId,
          session.character?.name || 'Hero',
          session.character?.characterClass || 'DK',
          session.character?.level || 1,
          (session.character?.vitality ?? 100) * 10
        );

        if (registered) {
          return { success: true, instanceId: duel.id };
        } else {
          duel.addSpectator(session.sessionId);
          return { success: true, instanceId: duel.id };
        }
      }

      default:
        return { success: false, error: 'Tipo de evento inválido' };
    }
  }

  /**
   * Ciclo de atualização de todas as instâncias ativas
   */
  public update(now = Date.now(), deltaTimeSec = 0.05): void {
    if (this.bloodCastle) {
      this.bloodCastle.update(now);
    }
    if (this.devilSquare) {
      this.devilSquare.update(now, deltaTimeSec);
    }
    if (this.chaosCastle) {
      this.chaosCastle.update(now);
    }
    for (const [id, duel] of this.activeDuels.entries()) {
      duel.update(now);
    }
  }

  public getStatusOverview(now = Date.now()): object {
    return {
      bloodCastle: this.bloodCastle ? this.bloodCastle.toJSON(now) : null,
      devilSquare: this.devilSquare ? this.devilSquare.toJSON(now) : null,
      chaosCastle: this.chaosCastle ? this.chaosCastle.toJSON() : null,
      activeDuelsCount: this.activeDuels.size,
    };
  }
}
