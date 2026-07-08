import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveSystem } from '@/core/SaveSystem';
import type { ISaveable } from '@/core/IGameModule';

describe('SaveSystem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips save data', () => {
    const save = new SaveSystem();
    const mod: ISaveable = {
      saveKey: 'test',
      serialize: () => ({ value: 42 }),
      deserialize: vi.fn(),
    };
    save.register(mod);
    save.save();
    save.load();
    expect(mod.deserialize).toHaveBeenCalledWith({ value: 42 });
  });

  it('loads save files at or below the current version (v1 saves without name/motivation still load)', () => {
    localStorage.setItem(
      'everden_save_v1',
      JSON.stringify({
        version: 1,
        timestamp: 1,
        modules: { playerProfile: { species: 'vole' } },
      }),
    );
    const save = new SaveSystem();
    const profile = {
      saveKey: 'playerProfile',
      species: 'frog',
      name: 'Traveler',
      motivation: 'investigator' as const,
      serialize: () => ({}),
      deserialize(data: unknown) {
        const state = data as { species?: string; name?: string; motivation?: string };
        if (state.species) this.species = state.species;
        this.name = state.name?.trim() || 'Traveler';
        if (state.motivation) this.motivation = state.motivation as typeof this.motivation;
      },
    };
    save.register(profile);
    expect(save.load()).toBe(true);
    expect(profile.species).toBe('vole');
    expect(profile.name).toBe('Traveler');
  });
});
