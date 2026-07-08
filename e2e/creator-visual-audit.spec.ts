import { test } from '@playwright/test';
import { clearEverdenSave } from './character-helpers';
import path from 'node:path';

const SHOTS = path.join(process.cwd(), 'docs/playtests/screenshots');

test.describe('Creator visual audit AR-034', () => {
  test('capture creator tabs for agent eye verification', async ({ page }) => {
    test.setTimeout(120_000);
    await clearEverdenSave(page);
    await page.reload();
    await page.waitForSelector('.creator-shell');

    await page.screenshot({ path: path.join(SHOTS, 'AR034_01_folk.png') });

    await page.locator('.creator-tab[data-tab="appearance"]').click();
    await page.locator('.build-card').nth(2).click();
    await page.locator('.variant-card').nth(3).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SHOTS, 'AR034_02_look_stout_p4.png') });

    await page.locator('.creator-tab[data-tab="wardrobe"]').click();
    await page.getByRole('button', { name: /Ferry kepi/ }).click();
    await page.getByRole('button', { name: /Basin travel cloak/ }).click();
    await page.getByRole('button', { name: /Shell brooch/ }).click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SHOTS, 'AR034_03_outfits_full.png') });

    await page.locator('.creator-tab[data-tab="species"]').click();
    await page.locator('.species-card[data-species="tortoise"]').click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SHOTS, 'AR034_04_tortoise_folk.png') });

    await page.locator('.creator-tab[data-tab="wardrobe"]').click();
    await page.getByRole('button', { name: /Shell cap/ }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SHOTS, 'AR034_05_tortoise_shell_cap.png') });

    const preview = page.locator('.creator-preview-canvas');
    await preview.screenshot({ path: path.join(SHOTS, 'AR034_06_preview_crop.png') });
  });
});
