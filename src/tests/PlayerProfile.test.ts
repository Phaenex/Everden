import { describe, it, expect } from 'vitest';
import { PlayerProfile, applyMotivationFlags } from '@/gameplay/PlayerProfile';
import { abilityModifier, getOpeningNarrationLines } from '@/gameplay/OpeningNarration';
import { resolveInitialTitleStep } from '@/ui/TitleScreen';

describe('PlayerProfile', () => {
  it('serializes name and motivation with species', () => {
    const profile = new PlayerProfile();
    profile.species = 'tortoise';
    profile.name = 'Myrtle';
    profile.motivation = 'neighbor';
    expect(profile.serialize()).toEqual({
      species: 'tortoise',
      name: 'Myrtle',
      motivation: 'neighbor',
    });
  });

  it('defaults blank name to Traveler on deserialize (v1 saves without name/motivation)', () => {
    const profile = new PlayerProfile();
    profile.deserialize({ species: 'frog' });
    expect(profile.name).toBe('Traveler');
    expect(profile.motivation).toBe('investigator');
  });

  it('truncates overlong names to 24 characters', () => {
    const profile = new PlayerProfile();
    profile.deserialize({ species: 'frog', name: 'a'.repeat(40) });
    expect(profile.name).toHaveLength(24);
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
  it('shows menu when a save exists, species step otherwise', () => {
    expect(resolveInitialTitleStep(true)).toBe('menu');
    expect(resolveInitialTitleStep(false)).toBe('species');
  });
});
