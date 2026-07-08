import type { EventBus } from '@/core/EventBus';
import type { ISaveable } from '@/core/IGameModule';
import type { DataRegistry } from '@/data/DataRegistry';
import type { LocationDefinition } from '@/data/types';

export type Weather = 'clear' | 'rain' | 'fog';

export interface WeatherState {
  weather: Weather;
  day: number;
}

const AMPHIBIAN_SPECIES = new Set(['frog', 'toad']);

/**
 * Daily weather from location tables. Spring boosts rain chance.
 */
export class WeatherSimulator implements ISaveable {
  readonly saveKey = 'weather';
  weather: Weather = 'clear';
  private day = 1;
  private season = 'spring';

  constructor(
    private eventBus: EventBus,
    private data: DataRegistry,
  ) {}

  init(): void {
    this.eventBus.on<{ day: number; season?: string }>('time:day', (p) => {
      if (p.season) this.season = p.season;
      this.rollForDay(p.day);
    });
    this.eventBus.on<{ season: string }>('time:season', (p) => {
      this.season = p.season;
    });
    this.rollForDay(this.day);
  }

  isRain(): boolean {
    return this.weather === 'rain';
  }

  isAmphibianSpecies(speciesId: string): boolean {
    return AMPHIBIAN_SPECIES.has(speciesId);
  }

  getMovementModifier(speciesId: string): number {
    if (this.weather === 'rain' && this.isAmphibianSpecies(speciesId)) return 1.15;
    if (this.weather === 'rain') return 0.85;
    if (this.weather === 'fog') return 0.9;
    return 1;
  }

  rollForDay(day: number): void {
    this.day = day;
    const loc = this.data.getById<LocationDefinition>('locations', 'reedwater_basin');
    const table: Record<string, number> = { ...(loc?.weatherTable ?? { clear: 1 }) };

    if (this.season === 'spring') {
      table.rain = (table.rain ?? 0) + 0.15;
    }

    const entries = Object.entries(table);
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = this.seededRoll(day) * total;

    for (const [kind, weight] of entries) {
      roll -= weight;
      if (roll <= 0) {
        this.setWeather(kind as Weather);
        return;
      }
    }
    this.setWeather('clear');
  }

  private setWeather(next: Weather): void {
    if (this.weather === next) return;
    this.weather = next;
    this.eventBus.emit('weather:changed', { weather: next, day: this.day, season: this.season });
  }

  /** Deterministic per day — same day always yields same weather in tests. */
  private seededRoll(day: number): number {
    const x = Math.sin(day * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  serialize(): WeatherState {
    return { weather: this.weather, day: this.day };
  }

  deserialize(data: unknown): void {
    const state = data as WeatherState;
    this.weather = state.weather ?? 'clear';
    this.day = state.day ?? 1;
    this.eventBus.emit('weather:changed', { weather: this.weather, day: this.day, season: this.season });
  }
}
