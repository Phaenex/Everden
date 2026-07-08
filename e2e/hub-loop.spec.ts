import { test, expect } from '@playwright/test';
import { getState, loadScene, waitForEverden, waitForNpcWalkers } from './helpers';

/** V3 hub loop — all five districts load in a round-trip order without error. */
test.describe('District hub loop (V3 mechanical)', () => {
  test('round-trips causeway → lilymarket → mudwall → croakend → ferry → causeway', async ({
    page,
  }) => {
    await waitForEverden(page);
    const route = ['causeway', 'lilymarket', 'mudwall', 'croakend', 'ferry_rest', 'causeway'] as const;
    /** At 08:00 Grizz/Silt are on rest in Croakend — ferry_rest is intentionally empty. */
    const expectsNpcs: Record<(typeof route)[number], boolean> = {
      causeway: true,
      lilymarket: true,
      mudwall: true,
      croakend: true,
      ferry_rest: false,
    };

    for (const sceneId of route) {
      await loadScene(page, sceneId);
      const state = await getState(page);
      expect(state.sceneId).toBe(sceneId);
      if (expectsNpcs[sceneId]) {
        expect(state.npcIds.length).toBeGreaterThan(0);
      }
      expect(state.npcIds.length).toBeLessThanOrEqual(8);
    }
  });

  test('schedule shift walks Jenna into Lilymarket at noon instead of popping', async ({ page }) => {
    await waitForEverden(page);
    await loadScene(page, 'lilymarket');
    const before = await getState(page);
    expect(before.npcIds).not.toContain('jenna_leapwell');
    await page.evaluate(() => {
      for (let i = 0; i < 4; i++) window.__everden!.advanceHours(1);
    });
    await waitForNpcWalkers(page);
    const after = await getState(page);
    expect(after.hour).toBe(12);
    expect(after.npcIds).toContain('jenna_leapwell');
  });
});
