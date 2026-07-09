import { describe, it, expect } from 'vitest';
import { CombatAuthority } from '../../server/src/services/CombatAuthority.js';

describe('CombatAuthority', () => {
  it('validates turn order for combat actions', () => {
    const auth = new CombatAuthority();
    auth.start('enc1', [
      { id: 'p1', team: 'player', hp: 10, speciesId: 'frog' },
      { id: 'e1', team: 'enemy', hp: 8, speciesId: 'toad' },
    ]);
    expect(auth.validateAction('enc1', 'p1', { action: 'attack' })).toBe(true);
    expect(auth.validateAction('enc1', 'e1', { action: 'attack' })).toBe(false);
    auth.advanceTurn('enc1');
    expect(auth.validateAction('enc1', 'e1', { action: 'attack' })).toBe(true);
  });
});
