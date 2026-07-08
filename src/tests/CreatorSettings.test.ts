import { describe, expect, it } from 'vitest';
import { defaultCreatorSettings } from '@/gameplay/CreatorSettings';
import { PlayerProfile } from '@/gameplay/PlayerProfile';
import { defaultAppearance } from '@/gameplay/CharacterAppearance';

describe('CreatorSettings', () => {
  it('defaults narration on and control hints on', () => {
    expect(defaultCreatorSettings()).toEqual({
      skipOpeningNarration: false,
      showControlHints: true,
    });
  });

  it('round-trips through PlayerProfile save state', () => {
    const profile = new PlayerProfile();
    profile.setFromCreation(
      'frog',
      'Pip',
      'investigator',
      { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 12 },
      defaultAppearance(),
      { skipOpeningNarration: true, showControlHints: false },
    );
    const serialized = profile.serialize();
    expect(serialized.settings).toEqual({
      skipOpeningNarration: true,
      showControlHints: false,
    });

    const loaded = new PlayerProfile();
    loaded.deserialize(serialized);
    expect(loaded.settings.skipOpeningNarration).toBe(true);
    expect(loaded.settings.showControlHints).toBe(false);
  });
});
