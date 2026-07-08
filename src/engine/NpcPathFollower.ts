import * as THREE from 'three';
import type { IGameModule } from '@/core/IGameModule';
import { NavMesh, type NavPoint } from './NavMesh';

interface Walker {
  group: THREE.Group;
  path: NavPoint[];
  pathIndex: number;
  destX: number;
  destZ: number;
  stopRadius: number;
  onArrive?: () => void;
}

/**
 * NavMesh pathing for NPC sprites — slower than the player, one path per actor.
 */
export class NpcPathFollower implements IGameModule {
  private nav: NavMesh | null = null;
  private walkers = new Map<string, Walker>();
  private speed = 3.1;

  init(): void {}
  dispose(): void {
    this.cancelAll();
  }

  setNavMesh(nav: NavMesh | null): void {
    this.nav = nav;
  }

  isWalking(id: string): boolean {
    return this.walkers.has(id);
  }

  hasActiveWalkers(): boolean {
    return this.walkers.size > 0;
  }

  cancel(id: string): void {
    this.walkers.delete(id);
  }

  cancelAll(): void {
    this.walkers.clear();
  }

  walkTo(
    id: string,
    group: THREE.Group,
    destX: number,
    destZ: number,
    onArrive?: () => void,
    stopRadius = 0.28,
  ): boolean {
    if (!this.nav) return false;

    let x = destX;
    let z = destZ;
    if (!this.nav.isWalkable(x, z)) {
      const snap = this.nav.nearestWalkable({ x, z });
      if (!snap) return false;
      x = snap.x;
      z = snap.z;
    }

    const dx = x - group.position.x;
    const dz = z - group.position.z;
    if (Math.hypot(dx, dz) <= stopRadius) {
      group.position.set(x, 0, z);
      onArrive?.();
      return true;
    }

    const path = this.nav.findPath(
      { x: group.position.x, z: group.position.z },
      { x, z },
    );
    if (path.length === 0) return false;

    this.walkers.set(id, {
      group,
      path,
      pathIndex: path.length > 1 ? 1 : 0,
      destX: x,
      destZ: z,
      stopRadius,
      onArrive,
    });
    return true;
  }

  update(dt: number): void {
    if (!this.nav) return;

    for (const [id, w] of [...this.walkers.entries()]) {
      if (w.pathIndex >= w.path.length) {
        this.finishWalker(id, w);
        continue;
      }

      this.shortcutWalker(w);

      const target = w.path[w.pathIndex]!;
      const dx = target.x - w.group.position.x;
      const dz = target.z - w.group.position.z;
      const dist = Math.hypot(dx, dz);
      const step = this.speed * dt;

      if (dist <= step) {
        w.group.position.set(target.x, 0, target.z);
        w.pathIndex++;
        if (w.pathIndex >= w.path.length) {
          this.finishWalker(id, w);
        }
        continue;
      }

      w.group.position.x += (dx / dist) * step;
      w.group.position.z += (dz / dist) * step;
    }
  }

  private shortcutWalker(w: Walker): void {
    if (!this.nav || w.pathIndex >= w.path.length) return;

    const here = { x: w.group.position.x, z: w.group.position.z };
    if (this.nav.canWalkDirectly(here, { x: w.destX, z: w.destZ })) {
      w.path = [here, { x: w.destX, z: w.destZ }];
      w.pathIndex = 1;
      return;
    }

    while (w.pathIndex < w.path.length - 1) {
      const next = w.path[w.pathIndex + 1]!;
      if (!this.nav.canWalkDirectly(here, next)) break;
      w.pathIndex++;
    }
  }

  private finishWalker(id: string, w: Walker): void {
    this.walkers.delete(id);
    w.onArrive?.();
  }
}
