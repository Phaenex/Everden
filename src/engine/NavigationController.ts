import type { EventBus } from '@/core/EventBus';
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
import { applySeparation, type Separable } from './Separation';

export interface WalkIntent {
  x: number;
  z: number;
  stopRadius?: number;
  onArrive?: () => void;
}

/**
 * BG3-style click-to-move — follows NavMesh path, emits player:moved with heading.
 * Uses shared MovementSim so server authority matches client prediction.
 */
export class NavigationController implements IGameModule {
  private nav: NavMesh | null = null;
  private state: MovementState = createMovementState(0, 0);
  private moveModifier = 1;
  private locked = false;
  private intent: WalkIntent | null = null;
  private nearbyAgents: Separable[] = [];

  constructor(private eventBus: EventBus) {}

  get position(): { x: number; z: number; y: number } {
    return { x: this.state.x, y: 0, z: this.state.z };
  }

  get heading(): number {
    return this.state.heading;
  }

  get velocity(): { x: number; z: number } {
    return { x: this.state.vx, z: this.state.vz };
  }

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
    this.eventBus.on<{ agents: Separable[] }>('crowd:agents', ({ agents }) => {
      this.nearbyAgents = agents;
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
    this.state.x = x;
    this.state.z = z;
    this.state.vx = 0;
    this.state.vz = 0;
    cancelWalk(this.state);
    this.intent = null;
    this.emitMoved();
  }

  /** Server reconciliation — snap to authoritative position. */
  reconcilePosition(x: number, z: number, heading?: number): void {
    this.state.x = x;
    this.state.z = z;
    if (heading !== undefined) this.state.heading = heading;
    this.emitMoved();
  }

  isMoving(): boolean {
    return this.state.moving;
  }

  cancel(): void {
    cancelWalk(this.state);
    this.intent = null;
  }

  walkTo(intent: WalkIntent): boolean {
    if (this.locked || !this.nav) return false;

    const ok = beginWalk(
      this.state,
      this.nav,
      intent.x,
      intent.z,
      intent.stopRadius ?? 0.25,
    );
    if (!ok) return false;

    const dx = intent.x - this.state.x;
    const dz = intent.z - this.state.z;
    if (Math.hypot(dx, dz) <= (intent.stopRadius ?? 0.25)) {
      intent.onArrive?.();
      return true;
    }

    this.intent = intent;
    this.eventBus.emit('player:walk_intent', { x: intent.x, z: intent.z });
    return true;
  }

  update(dt: number): void {
    if (this.locked || !this.nav) return;

    const wasMoving = this.state.moving;
    stepMovement(this.state, this.nav, dt, DEFAULT_MOVEMENT_CONFIG, this.moveModifier);

    if (this.nearbyAgents.length > 0) {
      const self: Separable = { id: '__local__', x: this.state.x, z: this.state.z };
      const offsets = applySeparation([self, ...this.nearbyAgents.filter((a) => a.id !== '__local__')]);
      const off = offsets.get('__local__');
      if (off) {
        this.state.x += off.x * dt;
        this.state.z += off.z * dt;
      }
    }

    if (wasMoving || this.state.moving) this.emitMoved();

    if (!this.state.moving && this.intent) {
      const intent = this.intent;
      this.intent = null;
      intent.onArrive?.();
    }
  }

  private emitMoved(): void {
    this.eventBus.emit('player:moved', {
      x: this.state.x,
      y: 0,
      z: this.state.z,
      heading: this.state.heading,
      moving: this.state.moving,
      vx: this.state.vx,
      vz: this.state.vz,
    });
  }
}
