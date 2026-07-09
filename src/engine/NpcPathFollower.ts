import * as THREE from 'three';
import type { IGameModule } from '@/core/IGameModule';
import { NavMesh } from './NavMesh';
import {
  beginWalk,
  cancelWalk,
  createMovementState,
  DEFAULT_MOVEMENT_CONFIG,
  stepMovement,
  type MovementState,
} from '../../shared/movement/MovementSim';

interface Walker {
  id: string;
  group: THREE.Group;
  state: MovementState;
  destX: number;
  destZ: number;
  stopRadius: number;
  onArrive?: () => void;
}

/**
 * NavMesh pathing for NPC sprites — uses shared MovementSim (same as player + server).
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

    const state = createMovementState(group.position.x, group.position.z);
    const dx = x - state.x;
    const dz = z - state.z;
    if (Math.hypot(dx, dz) <= stopRadius) {
      group.position.set(x, 0, z);
      onArrive?.();
      return true;
    }

    if (!beginWalk(state, this.nav, x, z, stopRadius)) return false;

    this.walkers.set(id, {
      id,
      group,
      state,
      destX: x,
      destZ: z,
      stopRadius,
      onArrive,
    });
    return true;
  }

  update(dt: number): void {
    if (!this.nav) return;

    const config = { ...DEFAULT_MOVEMENT_CONFIG, maxSpeed: this.speed };

    for (const [id, w] of [...this.walkers.entries()]) {
      const moving = stepMovement(w.state, this.nav, dt, config);
      w.group.position.set(w.state.x, 0, w.state.z);

      if (!moving) {
        this.walkers.delete(id);
        cancelWalk(w.state);
        w.onArrive?.();
      }
    }
  }
}
