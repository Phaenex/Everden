import { describe, it, expect } from 'vitest';
import { enemySlugs } from '@/presentation/DiceDuelOverlay';

describe('enemySlugs', () => {
  it('returns just the single word for a one-word enemy name', () => {
    expect(enemySlugs('Bulk')).toEqual(['bulk']);
  });

  it('returns the full slug then the first word for a multi-word name (matches shipped single-word asset files)', () => {
    expect(enemySlugs('Skadge the Poacher')).toEqual(['skadge_the_poacher', 'skadge']);
  });

  it('strips apostrophes and punctuation', () => {
    expect(enemySlugs("Grizz's Bulk")).toEqual(['grizzs_bulk', 'grizzs']);
  });

  it('returns an empty list for an empty/whitespace-only name (never throws)', () => {
    expect(enemySlugs('   ')).toEqual([]);
  });
});
