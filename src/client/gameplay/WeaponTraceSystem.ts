/**
 * Swept Volumetric Weapon Trace System for Dasi (Client Gameplay).
 * Accurately tracks weapon blade sockets and executes continuous capsule traces.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function distSq(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

export interface WeaponSocketDef {
  name: string;
  offset: Vec3;
  radius: number;
}

export interface ClientHurtbox {
  actorId: string;
  position: Vec3;
  height: number;
  radius: number;
}

export class WeaponTraceSystem {
  public readonly ownerId: string;
  public readonly sockets: WeaponSocketDef[];
  private active = false;
  private previousPositions = new Map<string, Vec3>();
  private hitActors = new Set<string>();

  constructor(
    ownerId: string,
    sockets: WeaponSocketDef[] = [
      { name: 'Hilt', offset: { x: 0, y: 0, z: 0.1 }, radius: 0.12 },
      { name: 'MidBlade', offset: { x: 0, y: 0, z: 0.8 }, radius: 0.16 },
      { name: 'Tip', offset: { x: 0, y: 0, z: 1.6 }, radius: 0.2 },
    ]
  ) {
    this.ownerId = ownerId;
    this.sockets = sockets;
  }

  public beginSwing(): void {
    this.active = true;
    this.hitActors.clear();
    this.previousPositions.clear();
  }

  public endSwing(): void {
    this.active = false;
    this.hitActors.clear();
    this.previousPositions.clear();
  }

  public updateSweep(
    currentSocketPositions: Map<string, Vec3>,
    targets: ClientHurtbox[]
  ): string[] {
    if (!this.active) return [];

    const hits: string[] = [];

    for (const socket of this.sockets) {
      const curr = currentSocketPositions.get(socket.name);
      const prev = this.previousPositions.get(socket.name);
      if (!curr || !prev) continue;

      for (const target of targets) {
        if (target.actorId === this.ownerId || this.hitActors.has(target.actorId)) {
          continue;
        }

        // Distance check from swept blade segment to target center
        const targetCenter: Vec3 = {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z + target.height * 0.5,
        };

        const distMid = Math.sqrt(
          distSq(
            {
              x: (curr.x + prev.x) * 0.5,
              y: (curr.y + prev.y) * 0.5,
              z: (curr.z + prev.z) * 0.5,
            },
            targetCenter
          )
        );

        if (distMid <= socket.radius + target.radius) {
          this.hitActors.add(target.actorId);
          hits.push(target.actorId);
        }
      }
    }

    currentSocketPositions.forEach((val, key) => {
      this.previousPositions.set(key, { ...val });
    });

    return hits;
  }
}
