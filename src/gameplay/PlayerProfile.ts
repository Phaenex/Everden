import type { ISaveable } from '@/core/IGameModule';

export type ArrivalMotivation = 'investigator' | 'messenger' | 'neighbor';

export interface PlayerProfileState {
  species: string;
  name?: string;
  motivation?: ArrivalMotivation;
}

/** Persisted player identity from character creation. */
export class PlayerProfile implements ISaveable {
  readonly saveKey = 'playerProfile';
  species = 'frog';
  name = 'Traveler';
  motivation: ArrivalMotivation = 'investigator';

  serialize(): PlayerProfileState {
    return { species: this.species, name: this.name, motivation: this.motivation };
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
