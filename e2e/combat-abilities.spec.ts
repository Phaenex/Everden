import { test, expect } from '@playwright/test';
import { waitForEverden, loadScene } from './helpers';

/** One smoke per playable species — ability buttons render and QA can fire the kit's first ability. */
const SPECIES_ABILITIES: { species: string; pattern: RegExp; abilityId: string }[] = [
  { species: 'frog', pattern: /leap|tongue/i, abilityId: 'leap' },
  { species: 'toad', pattern: /bufotoxin|fear|burrow/i, abilityId: 'bufotoxin_spit' },
  { species: 'turtle', pattern: /shell|withdraw|ram/i, abilityId: 'shell_block' },
  { species: 'tortoise', pattern: /shell|withdraw|ram/i, abilityId: 'withdraw' },
  { species: 'vole', pattern: /burrow|poultice|nibble/i, abilityId: 'cheek_poultice' },
];

test.describe('Combat — species ability smoke (V4)', () => {
  for (const { species, pattern, abilityId } of SPECIES_ABILITIES) {
    test(`${species} exposes ability buttons and can use ${abilityId}`, async ({ page }) => {
      await waitForEverden(page, { species });
      const state = await page.evaluate(() => window.__everden!.getState());
      expect(state.species).toBe(species);

      await loadScene(page, 'mudwall');
      await page.evaluate(() => window.__everden!.startCombat('blackfen_poachers'));
      await expect(page.locator('.combat-panel:not(.hidden)')).toBeVisible({ timeout: 5000 });

      await expect
        .poll(async () => {
          const labels = await page.locator('.combat-actions button').allTextContents();
          return labels.some((l) => pattern.test(l));
        })
        .toBe(true);

      const used = await page.evaluate(
        ([id]) => {
          const qa = window.__everden!;
          if (!qa.isCombatActive()) return false;
          qa.combatUseAbility(id);
          return true;
        },
        [abilityId] as const,
      );
      expect(used).toBe(true);
    });
  }
});
