import { expect, test } from '@playwright/test';
import {
  clearEverdenSave,
  completeCharacterWizard,
  readSaveProfile,
  skipOpeningNarration,
} from './character-helpers';

test.describe('Character creation wizard', () => {
  test('new game wizard saves tortoise messenger profile', async ({ page }) => {
    await completeCharacterWizard(page, {
      species: 'tortoise',
      name: 'Shellen Test',
      motivationLabel: /Carrying someone else's worry/,
    });

    await skipOpeningNarration(page);

    await page.keyboard.press('Escape');
    await expect(page.locator('.pause-menu:not(.hidden)')).toBeVisible();
    await page.locator('#save-btn').click();
    await page.keyboard.press('Escape');

    const profile = await readSaveProfile(page);
    expect(profile?.species).toBe('tortoise');
    expect(profile?.name).toBe('Shellen Test');
    expect(profile?.motivation).toBe('messenger');
  });

  test('continue journey skips wizard and opening beat', async ({ page }) => {
    await completeCharacterWizard(page, { species: 'frog', name: 'SaveTest' });
    await skipOpeningNarration(page);

    await page.keyboard.press('Escape');
    await page.locator('#save-btn').click();
    await page.keyboard.press('Escape');

    await page.goto('/');
    await page.getByRole('button', { name: 'Continue journey' }).click();
    await page.waitForSelector('#game-canvas.visible', { timeout: 30_000 });

    await expect(page.locator('#title-screen')).toHaveClass(/hidden/);
    await expect(page.locator('.dialogue-panel:not(.hidden)')).toHaveCount(0);
    await expect(page.locator('.hud-district')).toContainText(/causeway/i);

    const profile = await readSaveProfile(page);
    expect(profile?.name).toBe('SaveTest');
  });

  test('new game warns before overwrite when save exists', async ({ page }) => {
    await completeCharacterWizard(page, { species: 'vole', name: 'Overwrite' });
    await skipOpeningNarration(page);
    await page.keyboard.press('Escape');
    await page.locator('#save-btn').click();
    await page.keyboard.press('Escape');

    await page.goto('/');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'New game' }).click();
    await page.waitForSelector('[data-species="frog"]');
    await expect(page.locator('#title-flow .species-btn')).toHaveCount(5);
  });
});
