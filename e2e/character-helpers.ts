import type { Page } from '@playwright/test';

const SAVE_KEY = 'everden_save_v1';

export async function clearEverdenSave(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
}

/** Tabbed character creator: folk → story → review → Enter (no `?qa=1`). */
export async function completeCharacterWizard(
  page: Page,
  opts: { species?: string; name?: string; motivationLabel?: RegExp } = {},
): Promise<void> {
  const species = opts.species ?? 'tortoise';
  const name = opts.name ?? 'River Test';
  const motivationLabel = opts.motivationLabel ?? /Carrying someone else's worry/;

  await clearEverdenSave(page);
  await page.reload();
  await page.waitForSelector('.creator-shell');
  await page.screenshot({ path: 'docs/playtests/screenshots/AR_intro_wizard_tortoise_species.png' }).catch(() => {});

  await page.locator(`.species-card[data-species="${species}"]`).click();
  await page.locator('.creator-tab[data-tab="story"]').click();
  await page.locator('.title-name-input').fill(name);
  await page.getByRole('button', { name: motivationLabel }).click();
  await page.locator('.creator-tab[data-tab="review"]').click();
  await page.screenshot({ path: 'docs/playtests/screenshots/AR_intro_wizard_tortoise_motivation.png' }).catch(() => {});
  await page.getByRole('button', { name: /Enter Reedwater Basin/ }).click();
  await page.waitForSelector('#game-canvas.visible', { timeout: 30_000 });
}

/** Walk every creator tab and assert panel content mounts. */
export async function smokeCreatorTabs(page: Page): Promise<void> {
  const tabs: { id: string; selector: string }[] = [
    { id: 'species', selector: '.species-card' },
    { id: 'appearance', selector: '.variant-grid' },
    { id: 'wardrobe', selector: '.wardrobe-grid' },
    { id: 'stats', selector: '.stat-controls' },
    { id: 'kit', selector: '.kit-ability-list' },
    { id: 'skills', selector: '.skills-reference-list' },
    { id: 'story', selector: '.title-name-input' },
    { id: 'settings', selector: '.settings-list' },
    { id: 'review', selector: '.review-panel' },
  ];
  for (const tab of tabs) {
    await page.locator(`.creator-tab[data-tab="${tab.id}"]`).click();
    await page.waitForSelector(tab.selector, { timeout: 5_000 });
  }
  await page.screenshot({ path: 'docs/playtests/screenshots/AR025_creator_all_tabs.png', fullPage: true }).catch(() => {});
}

/** New game with opening narration skipped via Settings tab. */
export async function completeCharacterWizardSkipNarration(
  page: Page,
  opts: { species?: string; name?: string } = {},
): Promise<void> {
  const species = opts.species ?? 'frog';
  const name = opts.name ?? 'Skip Narration';

  await clearEverdenSave(page);
  await page.reload();
  await page.waitForSelector('.creator-shell');
  await page.locator(`.species-card[data-species="${species}"]`).click();
  await page.locator('.creator-tab[data-tab="settings"]').click();
  await page.locator('.settings-row input').first().check();
  await page.locator('.creator-tab[data-tab="story"]').click();
  await page.locator('.title-name-input').fill(name);
  await page.locator('.creator-tab[data-tab="review"]').click();
  await page.getByRole('button', { name: /Enter Reedwater Basin/ }).click();
  await page.waitForSelector('#game-canvas.visible', { timeout: 30_000 });
}

export async function completeCharacterWithAppearance(
  page: Page,
  opts: {
    species?: string;
    name?: string;
    skipNarration?: boolean;
    buildIndex?: number;
    variantIndex?: number;
    skinToneIndex?: number;
    patternIntensity?: number;
    marking?: 'none' | 'spots' | 'stripes';
    hueShift?: number;
    hatLabel?: RegExp;
    cloakLabel?: RegExp;
    accessoryLabel?: RegExp;
  } = {},
): Promise<void> {
  const species = opts.species ?? 'frog';
  const name = opts.name ?? 'Style Test';
  const skipNarration = opts.skipNarration ?? true;

  await clearEverdenSave(page);
  await page.reload();
  await page.waitForSelector('.creator-shell');
  await page.locator(`.species-card[data-species="${species}"]`).click();

  await page.locator('.creator-tab[data-tab="appearance"]').click();
  if (opts.buildIndex !== undefined) {
    await page.locator('.build-card').nth(opts.buildIndex).click();
  }
  if (opts.variantIndex !== undefined) {
    await page.locator('.variant-card').nth(opts.variantIndex).click();
  }
  if (opts.skinToneIndex !== undefined) {
    await page.locator('.swatch-row').first().locator('.swatch-btn').nth(opts.skinToneIndex).click();
  }
  if (opts.marking && opts.marking !== 'none') {
    const label = opts.marking.charAt(0).toUpperCase() + opts.marking.slice(1);
    await page.getByRole('button', { name: label, exact: true }).click();
  }
  if (opts.patternIntensity !== undefined) {
    await page.locator('.hue-slider').first().evaluate((el, v) => {
      const input = el as HTMLInputElement;
      input.value = String(v);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, opts.patternIntensity);
  }

  if (opts.hatLabel || opts.cloakLabel || opts.accessoryLabel) {
    await page.locator('.creator-tab[data-tab="wardrobe"]').click();
    if (opts.hatLabel) await page.getByRole('button', { name: opts.hatLabel }).click();
    if (opts.cloakLabel) await page.getByRole('button', { name: opts.cloakLabel }).click();
    if (opts.accessoryLabel) await page.getByRole('button', { name: opts.accessoryLabel }).click();
  }

  if (skipNarration) {
    await page.locator('.creator-tab[data-tab="settings"]').click();
    await page.locator('.settings-row input').first().check();
  }

  await page.locator('.creator-tab[data-tab="story"]').click();
  await page.locator('.title-name-input').fill(name);
  await page.locator('.creator-tab[data-tab="review"]').click();
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

export function readSaveProfile(page: Page): Promise<{
  species?: string;
  name?: string;
  motivation?: string;
  stats?: Record<string, number>;
  appearance?: {
    variant?: number;
    build?: number;
    hueShift?: number;
    marking?: string;
    wardrobe?: { hat?: string; cloak?: string; accessory?: string };
  };
  settings?: { skipOpeningNarration?: boolean; showControlHints?: boolean };
} | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const file = JSON.parse(raw) as {
        modules?: {
          playerProfile?: {
            species?: string;
            name?: string;
            motivation?: string;
            stats?: Record<string, number>;
            appearance?: {
              variant?: number;
              build?: number;
              hueShift?: number;
              marking?: string;
              wardrobe?: { hat?: string; cloak?: string; accessory?: string };
            };
            settings?: { skipOpeningNarration?: boolean; showControlHints?: boolean };
          };
        };
      };
      return file.modules?.playerProfile ?? null;
    } catch {
      return null;
    }
  }, SAVE_KEY);
}
