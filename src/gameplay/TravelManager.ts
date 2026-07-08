import type { EventBus } from '@/core/EventBus';
import type { ISaveable } from '@/core/IGameModule';
import type { WorldClock } from '@/simulation/WorldClock';

export type TravelZone = 'lilypond' | 'ferry_rest';

export interface TravelDestination {
  id: TravelZone;
  name: string;
  spawn: { x: number; z: number };
  hours: number;
}

const DESTINATIONS: Record<TravelZone, TravelDestination> = {
  lilypond: { id: 'lilypond', name: 'Lilypond Causeway', spawn: { x: 0.5, z: 1.2 }, hours: 1.5 },
  ferry_rest: { id: 'ferry_rest', name: "Ferryman's Rest", spawn: { x: -4.5, z: -3.5 }, hours: 1.5 },
};

/**
 * Zone travel — Lilypond ↔ Ferryman's Rest. Advances clock on arrival.
 */
export class TravelManager implements ISaveable {
  readonly saveKey = 'travel';
  private zone: TravelZone = 'lilypond';

  constructor(
    private eventBus: EventBus,
    private clock: WorldClock,
  ) {}

  getZone(): TravelZone {
    return this.zone;
  }

  getDestination(id: TravelZone): TravelDestination {
    return DESTINATIONS[id];
  }

  canTravel(to: TravelZone): boolean {
    return this.zone !== to;
  }

  travel(to: TravelZone): TravelDestination | null {
    if (!this.canTravel(to)) return null;
    const dest = DESTINATIONS[to];
    const from = this.zone;
    this.zone = to;
    this.clock.advanceHours(dest.hours);
    this.eventBus.emit('travel:departed', { from, to, hours: dest.hours });
    this.eventBus.emit('player:moved', { x: dest.spawn.x, y: 0, z: dest.spawn.z });
    this.eventBus.emit('travel:arrived', { zone: to, name: dest.name });
    return dest;
  }

  serialize(): { zone: TravelZone } {
    return { zone: this.zone };
  }

  deserialize(data: unknown): void {
    const state = data as { zone?: TravelZone };
    if (state.zone === 'ferry_rest' || state.zone === 'lilypond') {
      this.zone = state.zone;
    }
  }
}

export function oppositeZone(zone: TravelZone): TravelZone {
  return zone === 'lilypond' ? 'ferry_rest' : 'lilypond';
}
