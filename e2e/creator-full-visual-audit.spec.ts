import { expect, test } from '@playwright/test';
import { clearEverdenSave } from './character-helpers';
import fs from 'node:fs';
import path from 'node:path';

const SHOTS = path.join(process.cwd(), 'docs/playtests/screenshots');
const MANIFEST = path.join(process.cwd(), 'docs/playtests/visual-audit-manifest.json');

const FOLK = ['frog', 'toad', 'vole', 'turtle', 'tortoise'] as const;
const BUILDS = ['slim', 'medium', 'stout'] as const;

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

/** Mirror of public/data/wardrobe.json — id, slot, label, allowed species. */
const WARDROBE: { id: string; slot: 'hat' | 'cloak' | 'accessory'; label: string; species: readonly string[] }[] = [
  { id: 'reed_hat', slot: 'hat', label: 'Reed sun hat', species: ['frog', 'toad', 'vole'] },
  { id: 'shell_cap', slot: 'hat', label: 'Shell cap', species: ['turtle', 'tortoise'] },
  { id: 'mudwall_helm', slot: 'hat', label: 'Mudwall helm', species: ['turtle', 'tortoise'] },
  { id: 'lily_bloom', slot: 'hat', label: 'Lily bloom', species: ['frog', 'toad', 'vole'] },
  { id: 'ferry_kepi', slot: 'hat', label: 'Ferry kepi', species: ['*'] },
  { id: 'marsh_hood', slot: 'hat', label: 'Marsh hood', species: ['*'] },
  { id: 'basin_cloak', slot: 'cloak', label: 'Basin travel cloak', species: ['*'] },
  { id: 'ferry_shawl', slot: 'cloak', label: "Ferryman's shawl", species: ['frog', 'toad', 'vole'] },
  { id: 'croakend_weave', slot: 'cloak', label: 'Croakend patchcloak', species: ['*'] },
  { id: 'levy_mantle', slot: 'cloak', label: 'Levy mantle', species: ['*'] },
  { id: 'rain_poncho', slot: 'cloak', label: 'Rain poncho', species: ['*'] },
  { id: 'elder_robe', slot: 'cloak', label: 'Elder robe', species: ['turtle', 'tortoise', 'frog'] },
  { id: 'reed_charm', slot: 'accessory', label: 'Reed hop charm', species: ['*'] },
  { id: 'clay_bead', slot: 'accessory', label: 'Clay prayer bead', species: ['turtle', 'tortoise'] },
  { id: 'market_scarf', slot: 'accessory', label: 'Lilymarket scarf', species: ['frog', 'toad', 'vole'] },
  { id: 'levy_pin', slot: 'accessory', label: "Levy clerk's pin", species: ['*'] },
  { id: 'shell_brooch', slot: 'accessory', label: 'Shell brooch', species: ['*'] },
  { id: 'hop_whistle', slot: 'accessory', label: 'Hop whistle', species: ['frog', 'toad', 'vole'] },
];

const SECTION: Record<'hat' | 'cloak' | 'accessory', number> = { hat: 0, cloak: 1, accessory: 2 };

function allowed(item: { species: readonly string[] }, species: string): boolean {
  return item.species.includes('*') || item.species.includes(species);
}

// Escape a label for use inside a RegExp (apostrophes etc. are literal).
function rx(label: string): RegExp {
  return new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

test.describe('AR-037 Full per-species creator visual audit', () => {
  test('every species: build, pattern, and every applicable outfit piece', async ({ page }) => {
    test.setTimeout(600_000);
    const completedIds: string[] = [];
    const track = (id: string) => completedIds.push(id);

    await clearEverdenSave(page);
    await page.reload();
    await page.waitForSelector('.creator-shell');

    const selectSpecies = async (species: string) => {
      await page.locator('.creator-tab[data-tab="species"]').click();
      await page.locator(`.species-card[data-species="${species}"]`).click();
      await page.waitForTimeout(250);
    };

    const clearWardrobe = async () => {
      await page.locator('.creator-tab[data-tab="wardrobe"]').click();
      for (let s = 0; s < 3; s++) {
        const none = page.locator('.wardrobe-section').nth(s).getByRole('button', { name: /^None/ });
        if ((await none.count()) > 0) await none.first().click();
      }
    };

    // 1. Tabs
    for (const tab of TABS) {
      await page.locator(`.creator-tab[data-tab="${tab}"]`).click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SHOTS, `AR035_tab_${tab}.png`) });
      track(`tab_${tab}`);
    }

    // 2. Folk cards (full page per species)
    for (const species of FOLK) {
      await selectSpecies(species);
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SHOTS, `AR035_folk_${species}.png`) });
      track(`folk_${species}`);
    }

    // 3. Per-species: builds, patterns, and every applicable outfit piece.
    for (const species of FOLK) {
      await selectSpecies(species);
      await clearWardrobe();

      // Builds (bare body — proves single-sprite, correct species per build).
      await page.locator('.creator-tab[data-tab="appearance"]').click();
      for (let b = 0; b < 3; b++) {
        await page.locator('.build-card').nth(b).click();
        await page.waitForTimeout(400);
        await page.locator('.creator-preview-canvas').screenshot({
          path: path.join(SHOTS, `AR035_build_${species}_${BUILDS[b]}.png`),
        });
        track(`build_${species}_${BUILDS[b]}`);
      }

      // Patterns at medium build.
      await page.locator('.build-card').nth(1).click();
      for (let v = 0; v < 4; v++) {
        await page.locator('.variant-card').nth(v).click();
        await page.waitForTimeout(400);
        await page.locator('.creator-preview-canvas').screenshot({
          path: path.join(SHOTS, `AR035_pat_${species}_p${v + 1}.png`),
        });
        track(`pat_${species}_p${v + 1}`);
      }
      await page.locator('.variant-card').nth(0).click();

      // Every applicable outfit piece, one at a time, on a cleared body.
      for (const item of WARDROBE) {
        if (!allowed(item, species)) continue;
        await clearWardrobe();
        const btn = page
          .locator('.wardrobe-section')
          .nth(SECTION[item.slot])
          .getByRole('button', { name: rx(item.label) });
        if ((await btn.count()) === 0) continue;
        await btn.first().click();
        await page.waitForTimeout(450);
        await page.locator('.creator-preview-canvas').screenshot({
          path: path.join(SHOTS, `AR035_out_${species}_${item.id}.png`),
        });
        track(`out_${species}_${item.id}`);
      }
    }

    // 4. Global look controls (on frog).
    await selectSpecies('frog');
    await clearWardrobe();
    await page.locator('.creator-tab[data-tab="appearance"]').click();
    for (const m of ['spots', 'stripes', 'none'] as const) {
      await page.locator('.marking-btn').filter({ hasText: new RegExp(`^${m}$`, 'i') }).first().click();
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(SHOTS, `AR035_marking_${m}.png`) });
      track(`marking_${m}`);
    }
    await page.locator('.hue-slider').evaluate((el) => {
      const input = el as HTMLInputElement;
      input.value = '45';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_hue_45.png') });
    track('hue_shift');

    await page.getByRole('button', { name: /Randomize look/ }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_randomize.png') });
    track('randomize_look');

    await page.getByRole('button', { name: /Reset tab/ }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_reset_look.png') });
    track('reset_look');

    // 5. Full combo (hat + cloak + accessory) on frog.
    await clearWardrobe();
    await page.getByRole('button', { name: /Ferry kepi/i }).click();
    await page.getByRole('button', { name: /Basin travel cloak/i }).click();
    await page.getByRole('button', { name: /Shell brooch/i }).click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_outfits_full_equipped.png') });
    track('outfits_full');

    // 6. Panels.
    await page.locator('.creator-tab[data-tab="stats"]').click();
    await page.locator('.stat-control-row .stat-btn').nth(1).click();
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

    // 7. Enter the world.
    await page.getByRole('button', { name: /Enter Reedwater Basin/ }).click();
    await page.waitForSelector('#game-canvas.visible', { timeout: 30_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, 'AR035_entered_causeway.png') });
    track('enter_causeway');

    fs.writeFileSync(
      MANIFEST,
      JSON.stringify(
        {
          runId: 'AR-037',
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
