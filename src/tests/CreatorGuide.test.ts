import { describe, expect, it } from 'vitest';
import type { CreatorGuide } from '@/ui/characterCreation/CreatorGuide';
import guide from '../../public/data/creator-guide.json';

describe('creator-guide.json', () => {
  it('has copy for every creator tab and stat block', () => {
    const g = guide as CreatorGuide;

    for (const tab of ['species', 'appearance', 'wardrobe', 'stats', 'kit', 'skills', 'story', 'settings', 'review']) {
      expect(g.tabs[tab]?.length).toBeGreaterThan(10);
    }

    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
      expect(g.stats[key].label).toBeTruthy();
      expect(g.stats[key].inGame).toBeTruthy();
    }

    expect(g.skills.length).toBeGreaterThanOrEqual(4);
    expect(g.settings.skipOpeningNarration.label).toBeTruthy();
    expect(g.settings.showControlHints.description).toBeTruthy();
  });
});
