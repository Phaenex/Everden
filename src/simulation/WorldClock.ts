import type { EventBus } from '@/core/EventBus';
import type { IGameModule, ISaveable } from '@/core/IGameModule';

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_MONTH = 30;
const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export type Season = (typeof SEASONS)[number];

export interface TimeState {
  totalMinutes: number;
}

/**
 * In-game calendar. 1 game hour = 4 real minutes by default (set via minutesPerRealSecond).
 * Kept slow deliberately — NPC schedules pop in/out on the hour with no walk transition yet,
 * so a faster clock reads as constant glitching while exploring a district.
 */
export class WorldClock implements IGameModule, ISaveable {
  readonly saveKey = 'worldClock';
  private _totalMinutes = 8 * MINUTES_PER_HOUR; // start 08:00 day 1
  private minutesPerRealSecond = 0.25; // 1 game hour per 4 real minutes

  constructor(private eventBus: EventBus) {}

  init(): void {
    this.emitTimeEvents();
  }

  dispose(): void {}

  update(dt: number): void {
    const prevHour = this.hour;
    const prevDay = this.day;
    const prevSeason = this.season;

    this._totalMinutes += dt * this.minutesPerRealSecond * MINUTES_PER_HOUR;

    if (this.hour !== prevHour) {
      this.eventBus.emit('time:hour', { hour: this.hour, day: this.day, season: this.season });
    }
    if (this.day !== prevDay) this.eventBus.emit('time:day', { day: this.day, season: this.season });
    if (this.season !== prevSeason) this.eventBus.emit('time:season', { season: this.season });
  }

  get hour(): number {
    return Math.floor((this._totalMinutes / MINUTES_PER_HOUR) % HOURS_PER_DAY);
  }

  get day(): number {
    return Math.floor(this._totalMinutes / (MINUTES_PER_HOUR * HOURS_PER_DAY)) + 1;
  }

  get season(): Season {
    const month = Math.floor(this.day / DAYS_PER_MONTH) % 4;
    return SEASONS[month]!;
  }

  get totalMinutes(): number {
    return this._totalMinutes;
  }

  setTotalMinutes(minutes: number): void {
    this._totalMinutes = minutes;
    this.emitTimeEvents();
  }

  advanceHours(hours: number): void {
    this._totalMinutes += hours * MINUTES_PER_HOUR;
    this.emitTimeEvents();
  }

  serialize(): TimeState {
    return { totalMinutes: this._totalMinutes };
  }

  deserialize(data: unknown): void {
    const state = data as TimeState;
    this._totalMinutes = state.totalMinutes;
  }

  private emitTimeEvents(): void {
    this.eventBus.emit('time:hour', { hour: this.hour, day: this.day });
    this.eventBus.emit('time:day', { day: this.day, season: this.season });
  }
}
