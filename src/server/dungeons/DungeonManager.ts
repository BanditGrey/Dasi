/**
 * Dasi MMORPG - Gerenciador Central de Instâncias de Dungeons
 * Controla ciclos de instâncias das Catacumbas, checagem de timeout e persistência de checkpoints.
 */

import { DungeonInstance } from './DungeonInstance.ts';
import type { ClientSession } from '../network/SessionManager.ts';

export class DungeonManager {
  private instances: Map<string, DungeonInstance> = new Map();
  private sessionToInstance: Map<string, string> = new Map();
  private instanceCounter = 1;

  /**
   * Cria ou entra em uma instância das Catacumbas do Dungeon
   */
  public enterDungeon(session: ClientSession): {
    instance: DungeonInstance;
    isNew: boolean;
  } {
    const existingInstanceId = this.sessionToInstance.get(session.sessionId);
    if (existingInstanceId) {
      const inst = this.instances.get(existingInstanceId);
      if (inst && inst.state === 'ACTIVE') {
        return { instance: inst, isNew: false };
      }
    }

    const newId = `dng-instance-${(this.instanceCounter++).toString(16)}`;
    const instance = new DungeonInstance(newId);
    instance.start();
    instance.addParticipant(session.sessionId);

    this.instances.set(newId, instance);
    this.sessionToInstance.set(session.sessionId, newId);

    return { instance, isNew: true };
  }

  public getInstance(instanceId: string): DungeonInstance | undefined {
    return this.instances.get(instanceId);
  }

  public getSessionInstance(sessionId: string): DungeonInstance | undefined {
    const id = this.sessionToInstance.get(sessionId);
    return id ? this.instances.get(id) : undefined;
  }

  public leaveDungeon(sessionId: string): void {
    const id = this.sessionToInstance.get(sessionId);
    if (id) {
      const inst = this.instances.get(id);
      if (inst) {
        inst.removeParticipant(sessionId);
      }
      this.sessionToInstance.delete(sessionId);
    }
  }

  public update(now = Date.now()): void {
    for (const [id, inst] of this.instances.entries()) {
      if (inst.state === 'ACTIVE' && now >= inst.endTime) {
        inst.state = 'FAILED';
      }
      // Remove instâncias concluídas há mais de 10 minutos
      if (inst.state !== 'ACTIVE' && now > inst.endTime + 600000) {
        this.instances.delete(id);
      }
    }
  }

  public getAllInstances(): DungeonInstance[] {
    return Array.from(this.instances.values());
  }
}
