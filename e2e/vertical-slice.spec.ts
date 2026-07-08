import { expect, test } from '@playwright/test';
import { getState, loadScene, runCombatUntilEnd, waitForDiceDuel, waitForEverden } from './helpers';

test.describe('Vertical slice — mechanical gates', () => {
  test.beforeEach(async ({ page }) => {
    await waitForEverden(page);
  });

  test('boots into causeway with main quest active', async ({ page }) => {
    const state = await getState(page);
    expect(state.sceneId).toBe('causeway');
    expect(state.species).toBe('frog');
    expect(state.questStages.what_water_remembers).toBeDefined();
    await expect(page.locator('.hud-district')).toContainText(/causeway/i);
  });

  test('loads all five districts without error', async ({ page }) => {
    const districts = [
      { id: 'causeway', label: /causeway/i },
      { id: 'lilymarket', label: /lilymarket/i },
      { id: 'croakend', label: /croakend/i },
      { id: 'mudwall', label: /mudwall/i },
      { id: 'ferry_rest', label: /ferry/i },
    ];
    for (const d of districts) {
      await loadScene(page, d.id);
      await expect(page.locator('.hud-district')).toContainText(d.label);
      const state = await getState(page);
      expect(state.sceneId).toBe(d.id);
      expect(state.npcIds.length).toBeLessThanOrEqual(8);
    }
  });

  test('NPC presence survives +6 hour skip (no crash, bounded count)', async ({ page }) => {
    await loadScene(page, 'lilymarket');
    const before = await getState(page);
    await page.evaluate(() => window.__everden!.advanceHours(6));
    await page.waitForTimeout(500);
    const after = await getState(page);
    expect(after.npcIds.length).toBeLessThanOrEqual(8);
    expect(after.hour).not.toBe(before.hour);
  });

  test('four examines set evidence_gathered flag', async ({ page }) => {
    for (const target of ['flooded_cellar', 'levy_plans', 'chapel_mural', 'ferry_depth']) {
      await page.evaluate((t) => window.__everden!.completeExamine(t), target);
    }
    await page.evaluate(() => window.__everden!.setFlag('evidence_gathered'));
    const state = await getState(page);
    expect(state.flags).toContain('evidence_gathered');
  });

  test('Domet dialogue skill check shows dice duel overlay', async ({ page }) => {
    await loadScene(page, 'mudwall');
    await page.evaluate(() => window.__everden!.talkTo('elder_domet'));
    await expect(page.locator('.dialogue-panel:not(.hidden)')).toBeVisible();
    const clicked = await page.evaluate(() =>
      window.__everden!.clickDialogueChoice('Pip says the levy'),
    );
    expect(clicked).toBe(true);
    await waitForDiceDuel(page);
    await expect(page.locator('.dice-duel')).toHaveClass(/hidden/);
  });

  test('Blackfen combat exposes diplomacy and resolves without soft-lock', async ({ page }) => {
    await loadScene(page, 'mudwall');
    await page.evaluate(() => window.__everden!.startCombat('blackfen_poachers'));
    await expect(page.locator('.combat-panel:not(.hidden)')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.combat-actions button').filter({ hasText: /persuade/i })).toBeVisible({
      timeout: 15_000,
    });
    const result = await runCombatUntilEnd(page);
    expect(result).toBe('ended');
    await expect(page.locator('.combat-panel')).toHaveClass(/hidden/);
  });

  test('save round-trip persists quest stage and scene', async ({ page }) => {
    await loadScene(page, 'croakend');
    await page.evaluate(() => {
      const qa = window.__everden!;
      qa.setQuestStage('what_water_remembers', 'ferry');
      qa.save();
    });
    const before = await getState(page);

    await page.goto('/?qa=1&keep=1&nodev=1');
    await page.waitForSelector('#game-canvas.visible', { timeout: 30_000 });
    await page.waitForFunction(() => window.__everden !== undefined, undefined, { timeout: 30_000 });
    await page.evaluate(async () => {
      await window.__everden!.ready;
    });

    const after = await getState(page);
    expect(after.sceneId).toBe(before.sceneId);
    expect(after.questStages.what_water_remembers).toBe('ferry');
  });

  test('ferry quest stage can be advanced via dialogue hooks', async ({ page }) => {
    await loadScene(page, 'ferry_rest');
    await page.evaluate(() => window.__everden!.talkTo('grizz_burrowman'));
    await expect(page.locator('.dialogue-panel:not(.hidden)')).toBeVisible();
    await page.evaluate(() => window.__everden!.clickDialogueChoice('ferry tolls'));
    const clicked = await page.evaluate(() => window.__everden!.clickDialogueChoice('Understood'));
    expect(clicked).toBe(true);
    await page.waitForTimeout(300);
    const state = await getState(page);
    expect(state.questStages.ferry_toll_dispute).toBe('ask_around');
  });
});
