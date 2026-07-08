import type { Page } from '@playwright/test';

const SAVE_KEY = 'everden_save_v1';

export async function clearEverdenSave(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
}

/** Full wizard: species → name → motivation → Enter (no `?qa=1`). */
export async function completeCharacterWizard(
  page: Page,
  opts: { species?: string; name?: string; motivationLabel?: RegExp } = {},
): Promise<void> {
  const species = opts.species ?? 'tortoise';
  const name = opts.name ?? 'River Test';
  const motivationLabel = opts.motivationLabel ?? /Carrying someone else's worry/;

  await clearEverdenSave(page);
  await page.reload();
  await page.waitForSelector('#title-flow .species-btn');
  await page.screenshot({ path: 'docs/playtests/screenshots/AR_intro_wizard_tortoise_species.png' }).catch(() => {});

  await page.locator(`[data-species="${species}"]`).click();
  await page.getByRole('button', { name: /Next — name your character/ }).click();
  await page.locator('.title-name-input').fill(name);
  await page.getByRole('button', { name: /Next — why you came/ }).click();
  await page.getByRole('button', { name: motivationLabel }).click();
  await page.getByRole('button', { name: /Next — review sheet/ }).click();
  await page.screenshot({ path: 'docs/playtests/screenshots/AR_intro_wizard_tortoise_motivation.png' }).catch(() => {});
  await page.getByRole('button', { name: /Enter Reedwater Basin/ }).click();
  await page.waitForSelector('#game-canvas.visible', { timeout: 30_000 });
}

/** Click through 3-line opening narration on new game. */
export async function skipOpeningNarration(page: Page): Promise<void> {
  const panel = page.locator('.dialogue-panel:not(.hidden)');
  await panel.waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Begin' }).click();
  await panel.waitFor({ state: 'hidden', timeout: 10_000 });
}

export function readSaveProfile(page: Page): Promise<{ species?: string; name?: string; motivation?: string } | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const file = JSON.parse(raw) as { modules?: { playerProfile?: { species?: string; name?: string; motivation?: string } } };
      return file.modules?.playerProfile ?? null;
    } catch {
      return null;
    }
  }, SAVE_KEY);
}
