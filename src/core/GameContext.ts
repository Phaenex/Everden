import type { EventBus } from './EventBus';
import type { DataRegistry } from '@/data/DataRegistry';
import type { SaveSystem } from './SaveSystem';
import type { WorldState } from '@/simulation/WorldState';

/** Shared context passed to all game modules at init. */
export interface GameContext {
  eventBus: EventBus;
  data: DataRegistry;
  save: SaveSystem;
  worldState: WorldState;
  canvas: HTMLCanvasElement;
}
