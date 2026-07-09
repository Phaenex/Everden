import { describe, it, expect } from 'vitest';
import { PlayerProfile, applyMotivationFlags } from '@/gameplay/PlayerProfile';
import { defaultAppearance } from '@/gameplay/CharacterAppearance';
import { defaultCreatorSettings } from '@/gameplay/CreatorSettings';
import { abilityModifier, getOpeningNarrationLines } from '@/gameplay/OpeningNarration';
import { resolveInitialTitleStep } from '@/ui/TitleScreen';

describe('PlayerProfile', () => {
  it('serializes v4 state with stats and migrated appearance', () => {
    const profile = new PlayerProfile();
    profile.setFromCreation(
      'tortoise',
      'Myrtle',
      'neighbor',
      { str: 12, dex: 8, con: 16, int: 12, wis: 14, cha: 10 },
      {
        variant: 1,
        build: 2,
        hueShift: 10,
        marking: 'spots',
        wardrobe: { hat: 'shell_cap' },
      } as never,
    );
    const ser = profile.serialize();
    expect(ser.species).toBe('tortoise');
    expect(ser.name).toBe('Myrtle');
    expect(ser.motivation).toBe('neighbor');
    expect(ser.stats).toEqual({ str: 12, dex: 8, con: 16, int: 12, wis: 14, cha: 10 });
    expect(ser.appearance?.patternId).toBeDefined();
    expect(ser.appearance?.build).toBe(2);
    expect(ser.appearance?.marking).toBe('spots');
    expect(ser.appearance?.wardrobe.hat).toBe('shell_cap');
    expect(ser.settings).toEqual(defaultCreatorSettings());
  });

  it('defaults blank name to Traveler on deserialize (v1 saves without name/motivation)', () => {
    const profile = new PlayerProfile();
    profile.deserialize({ species: 'frog' });
    expect(profile.name).toBe('Traveler');
    expect(profile.motivation).toBe('investigator');
    expect(profile.needsStatMigration()).toBe(true);
  });

  it('truncates overlong names to 24 characters', () => {
    const profile = new PlayerProfile();
    profile.deserialize({ species: 'frog', name: 'a'.repeat(40) });
    expect(profile.name).toHaveLength(24);
  });

  it('loads v3 stats without migration flag', () => {
    const profile = new PlayerProfile();
    profile.deserialize({
      species: 'frog',
      stats: { str: 8, dex: 16, con: 10, int: 10, wis: 10, cha: 12 },
      appearance: defaultAppearance(),
    });
    expect(profile.needsStatMigration()).toBe(false);
    expect(profile.stats.dex).toBe(16);
  });
});

describe('applyMotivationFlags', () => {
  it('sets exactly one arrival flag for each motivation', () => {
    const flags = new Map<string, boolean>();
    applyMotivationFlags('messenger', (k, v) => flags.set(k, v));
    expect(flags.get('arrival_investigator')).toBe(false);
    expect(flags.get('arrival_messenger')).toBe(true);
    expect(flags.get('arrival_neighbor')).toBe(false);
  });
});

describe('OpeningNarration', () => {
  it('abilityModifier matches 5e floor formula', () => {
    expect(abilityModifier(14)).toBe(2);
    expect(abilityModifier(9)).toBe(-1);
    expect(abilityModifier(10)).toBe(0);
  });

  it('returns three lines tailored to species and motivation', () => {
    const lines = getOpeningNarrationLines('tortoise', 'investigator');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('Tortoise');
    expect(lines[1]).toContain('council votes in seven days');
    expect(lines[2]).toContain('Lilymarket');
  });
});

describe('TitleScreen.resolveInitialTitleStep', () => {
  it('shows menu when a save exists, creator otherwise', () => {
    expect(resolveInitialTitleStep(true)).toBe('menu');
    expect(resolveInitialTitleStep(false)).toBe('creator');
  });
});
