import * as THREE from 'three';
import type { EventBus } from '@/core/EventBus';
import type { IGameModule } from '@/core/IGameModule';
import { NavMesh, type NavPoint } from './NavMesh';

export interface WalkIntent {
  x: number;
  z: number;
  stopRadius?: number;
  onArrive?: () => void;
}

/**
 * BG3-style click-to-move — follows NavMesh path, emits player:moved.
 */
export class NavigationController implements IGameModule {
  readonly position = new THREE.Vector3();
  private nav: NavMesh | null = null;
  private path: NavPoint[] = [];
  private pathIndex = 0;
  private speed = 5.8;
  private moveModifier = 1;
  private locked = false;
  private intent: WalkIntent | null = null;

  constructor(private eventBus: EventBus) {}

  init(): void {
    this.eventBus.on('combat:started', () => {
      this.locked = true;
      this.cancel();
    });
    this.eventBus.on('combat:ended', () => {
      this.locked = false;
    });
    this.eventBus.on('dialogue:opened', () => {
      this.locked = true;
      this.cancel();
    });
    this.eventBus.on('dialogue:closed', () => {
      this.locked = false;
    });
  }

  dispose(): void {}

  setNavMesh(nav: NavMesh | null): void {
    this.nav = nav;
  }

  setMoveModifier(mod: number): void {
    this.moveModifier = mod;
  }

  setPosition(x: number, z: number): void {
    this.position.set(x, 0, z);
    this.cancel();
    this.emitMoved();
  }

  isMoving(): boolean {
    return this.pathIndex < this.path.length;
  }

  cancel(): void {
    this.path = [];
    this.pathIndex = 0;
    this.intent = null;
  }

  walkTo(intent: WalkIntent): boolean {
    if (this.locked) return false;
    if (!this.nav) return false;

    let destX = intent.x;
    let destZ = intent.z;
    if (!this.nav.isWalkable(destX, destZ)) {
      const snap = this.nav.nearestWalkable({ x: destX, z: destZ });
      if (!snap) return false;
      destX = snap.x;
      destZ = snap.z;
    }

    const stop = intent.stopRadius ?? 0.25;
    const dx = destX - this.position.x;
    const dz = destZ - this.position.z;
    if (Math.hypot(dx, dz) <= stop) {
      intent.onArrive?.();
      return true;
    }

    const path = this.nav.findPath(
      { x: this.position.x, z: this.position.z },
      { x: destX, z: destZ },
    );
    if (path.length === 0) return false;

    this.path = path;
    this.pathIndex = path.length > 1 ? 1 : 0;
    this.intent = intent;
    return true;
  }

  update(dt: number): void {
    if (this.locked || this.pathIndex >= this.path.length) return;

    this.shortcutPath();

    const target = this.path[this.pathIndex]!;
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    const dist = Math.hypot(dx, dz);
    const step = this.speed * this.moveModifier * dt;

    if (dist <= step) {
      this.position.x = target.x;
      this.position.z = target.z;
      this.pathIndex++;
      this.emitMoved();
      if (this.pathIndex >= this.path.length) {
        this.finishWalk();
      }
      return;
    }

    this.position.x += (dx / dist) * step;
    this.position.z += (dz / dist) * step;
    this.emitMoved();
  }

  /** Skip grid corners when a straight run to the next hop (or goal) is clear. */
  private shortcutPath(): void {
    if (!this.nav || this.pathIndex >= this.path.length) return;

    const here = { x: this.position.x, z: this.position.z };
    if (this.intent && this.nav.canWalkDirectly(here, { x: this.intent.x, z: this.intent.z })) {
      this.path = [here, { x: this.intent.x, z: this.intent.z }];
      this.pathIndex = 1;
      return;
    }

    while (this.pathIndex < this.path.length - 1) {
      const next = this.path[this.pathIndex + 1]!;
      if (!this.nav.canWalkDirectly(here, next)) break;
      this.pathIndex++;
    }
  }

  private finishWalk(): void {
    const intent = this.intent;
    this.intent = null;
    this.path = [];
    this.pathIndex = 0;
    intent?.onArrive?.();
  }

  private emitMoved(): void {
    this.eventBus.emit('player:moved', {
      x: this.position.x,
      y: 0,
      z: this.position.z,
    });
  }
}
