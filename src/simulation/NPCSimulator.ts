import type { EventBus } from '@/core/EventBus';
import type { ISaveable } from '@/core/IGameModule';
import type { DataRegistry } from '@/data/DataRegistry';

export interface NPCRuntimeState {
  id: string;
  location: string;
  activity: string;
  x: number;
  z: number;
}

export interface NPCSimState {
  npcs: Record<string, NPCRuntimeState>;
}

/**
 * NPC daily schedules and positions. Updates on tick:hour.
 */
export class NPCSimulator implements ISaveable {
  readonly saveKey = 'npcSimulator';
  private states = new Map<string, NPCRuntimeState>();

  constructor(
    private eventBus: EventBus,
    private data: DataRegistry,
  ) {}

  init(): void {
    for (const npc of this.data.get('npcs')) {
      this.states.set(npc.id, {
        id: npc.id,
        location: npc.schedule[0]?.location ?? 'lilypond',
        activity: 'idle',
        x: npc.position.x,
        z: npc.position.z,
      });
    }
    this.eventBus.on<{ hour: number }>('time:hour', ({ hour }) => this.onHour(hour));
  }

  getState(id: string): NPCRuntimeState | undefined {
    return this.states.get(id);
  }

  getAll(): NPCRuntimeState[] {
    return [...this.states.values()];
  }

  private onHour(hour: number): void {
    for (const npc of this.data.get('npcs')) {
      const entry = npc.schedule.find((s) => hour >= s.startHour && hour < s.endHour);
      const state = this.states.get(npc.id);
      if (!state || !entry) continue;

      if (state.location !== entry.location) {
        const target = this.locationCoords(entry.location);
        state.x = target.x;
        state.z = target.z;
        state.location = entry.location;
        this.eventBus.emit('npc:moved', { ...state });
      }
      state.activity = entry.activity;
      this.eventBus.emit('npc:activity', { id: npc.id, activity: entry.activity });
    }
  }

  private locationCoords(location: string): { x: number; z: number } {
    const coords: Record<string, { x: number; z: number }> = {
      lilymarket: { x: 2, z: 0 },
      lilypond: { x: 0, z: 0 },
      council_shell: { x: -2, z: 1 },
      levy_site: { x: 4, z: -2 },
      ferry_rest: { x: -4, z: -3 },
      sunken_chapel: { x: 6, z: 4 },
      croakend: { x: -1, z: -2 },
      mudwall: { x: 3, z: 2 },
      blackfen: { x: 8, z: -4 },
    };
    return coords[location] ?? { x: 0, z: 0 };
  }

  /** Soak test helper — advance N hours instantly. */
  simulateHours(hours: number, getHour: () => number, advanceHour: () => void): void {
    for (let i = 0; i < hours; i++) {
      this.onHour(getHour());
      advanceHour();
    }
  }

  serialize(): NPCSimState {
    const npcs: Record<string, NPCRuntimeState> = {};
    for (const [id, s] of this.states) npcs[id] = { ...s };
    return { npcs };
  }

  deserialize(data: unknown): void {
    const state = data as NPCSimState;
    this.states.clear();
    for (const [id, s] of Object.entries(state.npcs)) {
      this.states.set(id, s);
    }
  }
}
