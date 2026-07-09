import * as THREE from 'three';
import type { EventBus } from '@/core/EventBus';
import type { IGameModule } from '@/core/IGameModule';
import type { NavigationController } from '@/engine/NavigationController';
import type { PickResult } from '@/engine/PointerSystem';
import type { SceneManager } from '@/presentation/SceneManager';
import { GAME_CURSORS } from '@/presentation/GameCursors';

export interface InteractableTarget {
  id: string;
  label: string;
  type: 'npc' | 'object' | 'examine' | 'travel' | 'combat' | 'merchant' | 'exit';
  position: THREE.Vector3;
  radius: number;
  payload?: Record<string, unknown>;
}

export interface PlayerInputDeps {
  navigation: NavigationController;
  sceneManager: SceneManager;
  canvas: HTMLCanvasElement;
  onPickFailed: () => void;
}

/**
 * BG3-style input — click ground to walk, click entity to walk-then-interact.
 */
export class PlayerController implements IGameModule {
  private interactables = new Map<string, InteractableTarget>();
  private nearest: InteractableTarget | null = null;
  private deps: PlayerInputDeps | null = null;
  private hoverId: string | null = null;
  private interactionLocked = false;

  constructor(private eventBus: EventBus) {}

  bind(deps: PlayerInputDeps): void {
    this.deps = deps;
    deps.canvas.style.cursor = GAME_CURSORS.walk;
  }

  init(): void {
    window.addEventListener('keydown', this.onKeyDown);
    this.deps?.canvas.addEventListener('click', this.onClick);
    this.deps?.canvas.addEventListener('mousemove', this.onMouseMove);
    this.eventBus.on('combat:started', () => {
      this.interactionLocked = true;
      this.setCursor('combat');
    });
    this.eventBus.on('combat:ended', () => {
      this.interactionLocked = false;
      this.setCursor('walk');
    });
    this.eventBus.on('dialogue:opened', () => {
      this.interactionLocked = true;
      this.setCursor('default');
    });
    this.eventBus.on('dialogue:closed', () => {
      this.interactionLocked = false;
      this.setCursor('walk');
    });
    this.eventBus.on<{ x: number; y: number; z: number }>('player:moved', () => {
      this.updateNearest();
    });
  }

  update(_dt: number): void {
    this.updateNearest();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    this.deps?.canvas.removeEventListener('click', this.onClick);
    this.deps?.canvas.removeEventListener('mousemove', this.onMouseMove);
  }

  get position(): THREE.Vector3 {
    const p = this.deps?.navigation.position;
    return p ? new THREE.Vector3(p.x, p.y, p.z) : new THREE.Vector3();
  }

  setMoveModifier(mod: number): void {
    this.deps?.navigation.setMoveModifier(mod);
  }

  clearInteractables(): void {
    this.interactables.clear();
    this.nearest = null;
    this.eventBus.emit('interaction:nearby', null);
  }

  registerInteractable(target: InteractableTarget): void {
    this.interactables.set(target.id, target);
  }

  getInteractable(id: string): InteractableTarget | undefined {
    return this.interactables.get(id);
  }

  getNearest(): InteractableTarget | null {
    return this.nearest;
  }

  approachAndUse(target: InteractableTarget): void {
    const nav = this.deps?.navigation;
    if (!nav) return;
    const ok = nav.walkTo({
      x: target.position.x,
      z: target.position.z,
      stopRadius: target.radius * 0.85,
      onArrive: () => this.eventBus.emit('interaction:use', target),
    });
    if (!ok) this.deps?.onPickFailed();
  }

  private updateNearest(): void {
    const pos = this.deps?.navigation.position;
    if (!pos) return;
    let best: InteractableTarget | null = null;
    let bestScore = Infinity;
    for (const t of this.interactables.values()) {
      const d = Math.hypot(t.position.x - pos.x, t.position.z - pos.z);
      if (d > t.radius) continue;
      const score = d + (t.type === 'exit' ? 2 : t.type === 'merchant' ? 1 : t.type === 'npc' ? -0.3 : 0);
      if (score < bestScore) {
        best = t;
        bestScore = score;
      }
    }
    if (best?.id !== this.nearest?.id) {
      this.nearest = best;
      this.eventBus.emit('interaction:nearby', best);
    }
  }

  private resolveInteractableId(pickId: string): string {
    if (pickId.startsWith('object:')) return pickId.slice(7);
    return pickId;
  }

  private handlePick(pick: PickResult): void {
    const deps = this.deps;
    if (!deps || this.interactionLocked) return;

    if (!pick) {
      deps.onPickFailed();
      return;
    }

    if (pick.type === 'entity') {
      deps.sceneManager.hideClickMarker();
      const id = this.resolveInteractableId(pick.interactableId);
      const target = this.interactables.get(id);
      if (target) {
        this.approachAndUse(target);
        return;
      }
    }

    if (pick.type === 'ground') {
      deps.sceneManager.showClickMarker(pick.point.x, pick.point.z);
      const ok = deps.navigation.walkTo({
        x: pick.point.x,
        z: pick.point.z,
        onArrive: () => deps.sceneManager.hideClickMarker(),
      });
      if (!ok) deps.onPickFailed();
    }
  }

  private onClick = (e: MouseEvent): void => {
    const deps = this.deps;
    if (!deps || this.interactionLocked) return;
    const pick = deps.sceneManager.pick(e.clientX, e.clientY, deps.canvas);
    this.handlePick(pick);
  };

  private onMouseMove = (e: MouseEvent): void => {
    const deps = this.deps;
    if (!deps) return;
    const hover = deps.sceneManager.pickHover(e.clientX, e.clientY, deps.canvas);
    if (hover === this.hoverId) return;
    this.hoverId = hover;
    const resolved = hover ? this.resolveInteractableId(hover) : null;
    if (resolved && this.interactables.has(resolved)) {
      this.setCursor('interact');
    } else {
      this.setCursor('walk');
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.interactionLocked) return;
    if (e.key.toLowerCase() === 'e' && this.nearest) {
      this.eventBus.emit('interaction:use', this.nearest);
    }
    if (e.key.toLowerCase() === 'g') {
      this.eventBus.emit('player:emote', { emote: 'wave' });
    }
  };

  private setCursor(mode: 'default' | 'walk' | 'interact' | 'combat'): void {
    const canvas = this.deps?.canvas;
    if (!canvas) return;
    canvas.style.cursor = GAME_CURSORS[mode];
  }
}
