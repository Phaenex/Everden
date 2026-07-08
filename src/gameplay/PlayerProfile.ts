import type { ISaveable } from '@/core/IGameModule';
import type { SpeciesStats } from '@/data/types';
import { defaultAppearance, type CharacterAppearance } from '@/gameplay/CharacterAppearance';
import { defaultCreatorSettings, type CreatorSettings } from '@/gameplay/CreatorSettings';
import { applyRacial } from '@/gameplay/PointBuy';

export type ArrivalMotivation = 'investigator' | 'messenger' | 'neighbor';

export interface PlayerProfileState {
  species: string;
  name?: string;
  motivation?: ArrivalMotivation;
  stats?: SpeciesStats;
  appearance?: CharacterAppearance;
  settings?: CreatorSettings;
}

const DEFAULT_STATS: SpeciesStats = { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 12 };

/** Persisted player identity from character creation. */
export class PlayerProfile implements ISaveable {
  readonly saveKey = 'playerProfile';
  species = 'frog';
  name = 'Traveler';
  motivation: ArrivalMotivation = 'investigator';
  stats: SpeciesStats = { ...DEFAULT_STATS };
  appearance: CharacterAppearance = defaultAppearance();
  settings: CreatorSettings = defaultCreatorSettings();
  private statsPersisted = false;

  setFromCreation(
    species: string,
    name: string,
    motivation: ArrivalMotivation,
    stats: SpeciesStats,
    appearance: CharacterAppearance,
    settings: CreatorSettings = defaultCreatorSettings(),
  ): void {
    this.species = species;
    this.name = name;
    this.motivation = motivation;
    this.stats = { ...stats };
    this.statsPersisted = true;
    this.settings = { ...settings };
    this.appearance = {
      variant: appearance.variant,
      hueShift: appearance.hueShift,
      marking: appearance.marking,
      wardrobe: { ...appearance.wardrobe },
    };
  }

  serialize(): PlayerProfileState {
    return {
      species: this.species,
      name: this.name,
      motivation: this.motivation,
      stats: { ...this.stats },
      appearance: {
        variant: this.appearance.variant,
        hueShift: this.appearance.hueShift,
        marking: this.appearance.marking,
        wardrobe: { ...this.appearance.wardrobe },
      },
      settings: { ...this.settings },
    };
  }

  deserialize(data: unknown): void {
    const state = data as Partial<PlayerProfileState>;
    if (state.species) this.species = state.species;
    const trimmed = state.name?.trim();
    this.name = trimmed && trimmed.length > 0 ? trimmed.slice(0, 24) : 'Traveler';
    if (
      state.motivation === 'investigator' ||
      state.motivation === 'messenger' ||
      state.motivation === 'neighbor'
    ) {
      this.motivation = state.motivation;
    }
    if (state.stats) {
      this.stats = { ...state.stats };
      this.statsPersisted = true;
    }
    if (state.appearance) {
      this.appearance = {
        variant: state.appearance.variant ?? 0,
        hueShift: state.appearance.hueShift ?? 0,
        marking: state.appearance.marking ?? 'none',
        wardrobe: { ...state.appearance.wardrobe },
      };
    }
    if (state.settings) {
      this.settings = {
        skipOpeningNarration: state.settings.skipOpeningNarration ?? false,
        showControlHints: state.settings.showControlHints ?? true,
      };
    }
  }

  /** v2 saves without stats — caller supplies species defaults after load. */
  needsStatMigration(): boolean {
    return !this.statsPersisted;
  }

  applySpeciesDefaults(
    finalStats: SpeciesStats,
    appearance?: CharacterAppearance,
  ): void {
    this.stats = { ...finalStats };
    this.statsPersisted = true;
    if (appearance) this.appearance = appearance;
  }
}

/** Sets matching world flags so dialogue can branch on arrival motivation. */
export function applyMotivationFlags(
  motivation: ArrivalMotivation,
  setFlag: (key: string, value: boolean) => void,
): void {
  setFlag('arrival_investigator', motivation === 'investigator');
  setFlag('arrival_messenger', motivation === 'messenger');
  setFlag('arrival_neighbor', motivation === 'neighbor');
}

/** Build final stats from point-buy base + species racial bonuses. */
export function finalizeStats(
  base: SpeciesStats,
  racial?: { plus2: keyof SpeciesStats; plus1: keyof SpeciesStats },
): SpeciesStats {
  return applyRacial(base, racial);
}
