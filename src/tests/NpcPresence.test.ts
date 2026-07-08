import { describe, it, expect } from 'vitest';
import { locationToScene, npcPresentInScene } from '@/gameplay/NpcPresence';
import type { NPCDefinition } from '@/data/types';

const domet: NPCDefinition = {
  id: 'elder_domet',
  name: 'Domet',
  title: 'Speaker',
  bio: '',
  species: 'turtle',
  faction: 'mudwall_masons',
  home: 'mudwall',
  workplace: 'council_shell',
  schedule: [
    { startHour: 10, endHour: 14, activity: 'work', location: 'council_shell' },
    { startHour: 14, endHour: 18, activity: 'work', location: 'mudwall' },
    { startHour: 18, endHour: 10, activity: 'sleep', location: 'mudwall' },
  ],
  dialogueId: 'domet_intro',
  position: { x: 0, y: 0, z: 0 },
};

const fennick: NPCDefinition = {
  id: 'fennick_farrow',
  name: 'Fennick Farrow',
  title: 'Vale Peddler',
  bio: '',
  species: 'vole',
  faction: 'vale_wanderers',
  home: 'causeway',
  workplace: 'causeway',
  schedule: [{ startHour: 0, endHour: 24, activity: 'work', location: 'causeway' }],
  dialogueId: 'fennick_intro',
  position: { x: 0, y: 0, z: 0 },
};

describe('NpcPresence', () => {
  it('maps council_shell to mudwall scene', () => {
    expect(locationToScene('council_shell')).toBe('mudwall');
  });

  it('maps causeway to the causeway hub scene (regression: hub had no location mapping, so any NPC scheduled there was silently invisible)', () => {
    expect(locationToScene('causeway')).toBe('causeway');
    expect(npcPresentInScene(fennick, 3, 'causeway')).toBe(true);
    expect(npcPresentInScene(fennick, 22, 'causeway')).toBe(true);
    expect(npcPresentInScene(fennick, 12, 'lilymarket')).toBe(false);
  });

  it('npcPresentInScene respects schedule hour windows', () => {
    expect(npcPresentInScene(domet, 11, 'mudwall')).toBe(true);
    expect(npcPresentInScene(domet, 11, 'croakend')).toBe(false);
    expect(npcPresentInScene(domet, 15, 'mudwall')).toBe(true);
    // Domet's 18->10 overnight entry sleeps at 'mudwall' itself, so hour 8 (before he
    // wakes for council duty at 10) correctly finds him still there, not off the map.
    expect(npcPresentInScene(domet, 8, 'mudwall')).toBe(true);
  });

  it('matches overnight (midnight-crossing) schedule entries (regression: startHour > endHour, e.g. 18->8, previously matched no hour at all — every NPC with a "sleep 18-8" style entry silently vanished from every scene overnight instead of showing at their mapped sleep location)', () => {
    const pip: NPCDefinition = {
      ...domet,
      id: 'pip_marshwick',
      schedule: [
        { startHour: 8, endHour: 18, activity: 'work', location: 'lilymarket' },
        { startHour: 18, endHour: 8, activity: 'sleep', location: 'lilypond' },
      ],
    };
    // Hours on both sides of midnight, and midnight itself, must all resolve to the
    // overnight entry (lilypond -> lilymarket) once the work window has ended.
    expect(npcPresentInScene(pip, 20, 'lilymarket')).toBe(true);
    expect(npcPresentInScene(pip, 0, 'lilymarket')).toBe(true);
    expect(npcPresentInScene(pip, 5, 'lilymarket')).toBe(true);
    // Still correctly absent right at the boundary into the work window's own scene check.
    expect(npcPresentInScene(pip, 8, 'lilymarket')).toBe(true); // work entry starts, same scene either way
    expect(npcPresentInScene(pip, 12, 'croakend')).toBe(false);
  });
});
