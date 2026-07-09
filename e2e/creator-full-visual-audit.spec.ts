import { expect, test } from '@playwright/test';
import { clearEverdenSave } from './character-helpers';
import fs from 'node:fs';
import path from 'node:path';

const SHOTS = path.join(process.cwd(), 'docs/playtests/screenshots');
const MANIFEST = path.join(process.cwd(), 'docs/playtests/visual-audit-manifest.json');

const FOLK = ['frog', 'toad', 'vole', 'turtle', 'tortoise'] as const;

const TABS = [
  'species',
  'appearance',
  'wardrobe',
  'stats',
  'kit',
  'skills',
  'story',
  'settings',
  'review',
] as const;

/** Every wardrobe label from wardrobe.json, grouped by slot. */
const OUTFIT_BY_SLOT: { section: number; labels: readonly string[] }[] = [
  {
    section: 0,
    labels: ['Reed sun hat', 'Lily bloom', 'Ferry kepi', 'Marsh hood'],
  },
  {
    section: 1,
    labels: [
      'Basin travel cloak',
      "Ferryman's shawl",
      'Croakend patchcloak',
      'Levy mantle',
      'Rain poncho',
      'Elder robe',
    ],
  },
  {
    section: 2,
    labels: [
      'Reed hop charm',
      'Lilymarket scarf',
      "Levy clerk's pin",
      'Shell brooch',
      'Hop whistle',
    ],
  },
];

const TORTOISE_ONLY: { section: number; labels: readonly string[] }[] = [
  { section: 0, labels: ['Shell cap', 'Mudwall helm'] },
  { section: 2, labels: ['Clay prayer bead'] },
];

function slug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

test.describe('AR-035 Full creator visual audit', () => {
  test('screenshot every tab, folk, look combo, outfit, and control', async ({ page }) => {
    test.setTimeout(480_000);
    const completedIds: string[] = [];
    const track = (id: string) => completedIds.push(id);

    await clearEverdenSave(page);
    await page.reload();
    await page.waitForSelector('.creator-shell');

    for (const tab of TABS) {
      await page.locator(`.creator-tab[data-tab="${tab}"]`).click();
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(SHOTS, `AR035_tab_${tab}.png`) });
      track(`tab_${tab}`);
    }

    for (const species of FOLK) {
      await page.locator('.creator-tab[data-tab="species"]').click();
      await page.locator(`.species-card[data-species="${species}"]`).click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(SHOTS, `AR035_folk_${species}.png`) });
      track(`folk_${species}`);
    }

    await page.locator('.creator-tab[data-tab="species"]').click();
    await page.locator('.species-card[data-species="frog"]').click();
    await page.locator('.creator-tab[data-tab="appearance"]').click();

    for (let b = 0; b < 3; b++) {
      await page.locator('.build-card').nth(b).click();
      for (let v = 0; v < 4; v++) {
        await page.locator('.variant-card').nth(v).click();
        await page.waitForTimeout(550);
        await page.screenshot({ path: path.join(SHOTS, `AR035_look_frog_b${b}_p${v + 1}.png`) });
        track(`look_b${b}_p${v + 1}`);
      }
    }

    for (const marking of ['Spots', 'Stripes', 'None'] as const) {
      await page.getByRole('button', { name: marking }).click();
      await page.waitForTimeout(450);
      await page.screenshot({ path: path.join(SHOTS, `AR035_marking_${marking.toLowerCase()}.png`) });
      track(`marking_${marking.toLowerCase()}`);
    }

    await page.locator('.hue-slider').evaluate((el) => {
      const input = el as HTMLInputElement;
      input.value = '45';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_hue_45.png') });
    track('hue_shift');

    await page.getByRole('button', { name: /Randomize look/ }).click();
    await page.waitForTimeout(650);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_randomize.png') });
    track('randomize_look');

    await page.getByRole('button', { name: /Reset tab/ }).click();
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_reset_look.png') });
    track('reset_look');

    await page.locator('.build-card').nth(1).click();
    await page.locator('.creator-tab[data-tab="wardrobe"]').click();

    const OUTFIT_TRACK: Record<string, string> = {
      'Reed sun hat': 'outfit_reed_sun_hat',
      'Lily bloom': 'outfit_lily_bloom',
      'Ferry kepi': 'outfit_ferry_kepi',
      'Marsh hood': 'outfit_marsh_hood',
      'Basin travel cloak': 'outfit_basin_cloak',
      "Ferryman's shawl": 'outfit_ferry_shawl',
      'Croakend patchcloak': 'outfit_croakend',
      'Levy mantle': 'outfit_levy_mantle',
      'Rain poncho': 'outfit_rain_poncho',
      'Elder robe': 'outfit_elder_robe',
      'Reed hop charm': 'outfit_reed_charm',
      'Lilymarket scarf': 'outfit_market_scarf',
      "Levy clerk's pin": 'outfit_levy_pin',
      'Shell brooch': 'outfit_shell_brooch',
      'Hop whistle': 'outfit_hop_whistle',
      'Shell cap': 'outfit_shell_cap',
      'Mudwall helm': 'outfit_mudwall_helm',
      'Clay prayer bead': 'outfit_clay_bead',
    };

    async function shotOutfit(section: number, label: string, fileSlug: string): Promise<void> {
      await page.locator('.creator-tab[data-tab="wardrobe"]').click();
      for (let s = 0; s < 3; s++) {
        await page.locator('.wardrobe-section').nth(s).getByRole('button', { name: /^None/ }).click();
      }
      const btn = page.locator('.wardrobe-section').nth(section).getByRole('button', { name: new RegExp(label, 'i') });
      if ((await btn.count()) === 0) return;
      await btn.first().click();
      await page.waitForTimeout(500);
      await page.locator('.creator-preview-canvas').screenshot({
        path: path.join(SHOTS, `AR035_outfit_${fileSlug}.png`),
      });
      const tid = OUTFIT_TRACK[label];
      if (tid) track(tid);
    }

    for (const group of OUTFIT_BY_SLOT) {
      for (const label of group.labels) {
        await shotOutfit(group.section, label, slug(label));
      }
    }

    await page.locator('.creator-tab[data-tab="species"]').click();
    await page.locator('.species-card[data-species="tortoise"]').click();
    await page.locator('.creator-tab[data-tab="wardrobe"]').click();
    for (const group of TORTOISE_ONLY) {
      for (const label of group.labels) {
        await shotOutfit(group.section, label, `tortoise_${slug(label)}`);
      }
    }

    await page.locator('.creator-tab[data-tab="species"]').click();
    await page.locator('.species-card[data-species="frog"]').click();
    await page.locator('.creator-tab[data-tab="wardrobe"]').click();
    await page.getByRole('button', { name: /Ferry kepi/i }).click();
    await page.getByRole('button', { name: /Basin travel cloak/i }).click();
    await page.getByRole('button', { name: /Shell brooch/i }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_outfits_full_equipped.png') });
    track('outfits_full');

    await page.locator('.creator-tab[data-tab="stats"]').click();
    const firstPlus = page.locator('.stat-control-row .stat-btn').nth(1);
    await firstPlus.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_stats_plus.png') });
    track('stats_plus');

    await page.locator('.creator-tab[data-tab="kit"]').click();
    await expect(page.locator('.kit-ability-list')).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, 'AR035_kit.png') });
    track('kit_panel');

    await page.locator('.creator-tab[data-tab="skills"]').click();
    await expect(page.locator('.skills-reference-list')).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, 'AR035_skills.png') });
    track('skills_panel');

    await page.locator('.creator-tab[data-tab="settings"]').click();
    await page.locator('.settings-row input').first().check();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_settings.png') });
    track('settings_toggle');

    await page.locator('.creator-tab[data-tab="story"]').click();
    await page.locator('.title-name-input').fill('Audit Traveler');
    await page.getByRole('button', { name: /Carrying someone else's worry/ }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_story.png') });
    track('story_fill');

    await page.locator('.creator-tab[data-tab="review"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_review.png') });
    track('review_panel');

    await page.screenshot({ path: path.join(SHOTS, 'AR035_all_tabs_fullpage.png'), fullPage: true });
    track('fullpage');

    await page.getByRole('button', { name: /Enter Reedwater Basin/ }).click();
    await page.waitForSelector('#game-canvas.visible', { timeout: 30_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_entered_causeway.png') });
    track('enter_causeway');

    fs.writeFileSync(
      MANIFEST,
      JSON.stringify(
        {
          runId: 'AR-035',
          completedAt: new Date().toISOString(),
          playwright: 'pass',
          spec: 'e2e/creator-full-visual-audit.spec.ts',
          completedIds,
          screenshotDir: 'docs/playtests/screenshots',
        },
        null,
        2,
      ),
    );
  });
});
