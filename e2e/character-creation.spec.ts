import { expect, test } from '@playwright/test';
import {
  clearEverdenSave,
  completeCharacterWizard,
  completeCharacterWizardSkipNarration,
  completeCharacterWithAppearance,
  readSaveProfile,
  skipOpeningNarration,
  smokeCreatorTabs,
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
    await page.waitForSelector('.creator-shell');
    await expect(page.locator('.species-card')).toHaveCount(5);
  });

  test('all nine creator tabs render their panels', async ({ page }) => {
    await clearEverdenSave(page);
    await page.reload();
    await page.waitForSelector('.creator-shell');
    await smokeCreatorTabs(page);
    await expect(page.locator('.creator-tab')).toHaveCount(9);
  });

  test('skip opening narration setting enters causeway without dialogue panel', async ({ page }) => {
    await completeCharacterWizardSkipNarration(page, { species: 'frog', name: 'NoIntro' });
    await expect(page.locator('.dialogue-panel:not(.hidden)')).toHaveCount(0);
    await expect(page.locator('.hud-district')).toContainText(/causeway/i);

    await page.keyboard.press('Escape');
    await page.locator('#save-btn').click();
    await page.keyboard.press('Escape');

    const profile = await readSaveProfile(page);
    expect(profile?.settings?.skipOpeningNarration).toBe(true);
  });

  test('look and outfit choices persist in save', async ({ page }) => {
    test.setTimeout(60_000);
    await completeCharacterWithAppearance(page, {
      species: 'frog',
      name: 'OutfitSave',
      variantIndex: 2,
      marking: 'spots',
      hueShift: 35,
      hatLabel: /Ferry kepi/,
      cloakLabel: /Levy mantle/,
    });

    await page.locator('#game-canvas').click({ position: { x: 320, y: 240 } });
    await page.keyboard.press('Escape');
    await expect(page.locator('.pause-menu:not(.hidden)')).toBeVisible({ timeout: 10_000 });
    await page.locator('#save-btn').click();
    await page.keyboard.press('Escape');

    const profile = await readSaveProfile(page);
    expect(profile?.appearance?.variant).toBe(2);
    expect(profile?.appearance?.marking).toBe('spots');
    expect(profile?.appearance?.hueShift).toBe(35);
    expect(profile?.appearance?.wardrobe?.hat).toBe('ferry_kepi');
    expect(profile?.appearance?.wardrobe?.cloak).toBe('levy_mantle');
  });
});
