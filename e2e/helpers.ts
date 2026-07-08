import type { Page } from '@playwright/test';
import type { EverdenQaState } from '../src/core/QaHarness';

export async function waitForEverden(page: Page): Promise<void> {
  await page.goto('/?qa=1&nodev=1');
  await page.waitForSelector('#game-canvas.visible', { timeout: 30_000 });
  await page.waitForFunction(() => window.__everden?.ready !== undefined, undefined, { timeout: 30_000 });
  await page.evaluate(async () => {
    await window.__everden!.ready;
  });
}

export async function getState(page: Page): Promise<EverdenQaState> {
  return page.evaluate(() => window.__everden!.getState());
}

export async function loadScene(page: Page, sceneId: string): Promise<void> {
  await page.evaluate(async (id) => {
    await window.__everden!.loadScene(id);
  }, sceneId);
  await page.waitForTimeout(300);
}

export async function waitForDiceDuel(page: Page, timeout = 8000): Promise<void> {
  const duel = page.locator('.dice-duel:not(.hidden)');
  await duel.waitFor({ state: 'visible', timeout });
  await duel.waitFor({ state: 'hidden', timeout });
}

export async function runCombatUntilEnd(page: Page, maxTurns = 40): Promise<'ended' | 'timeout'> {
  for (let i = 0; i < maxTurns; i++) {
    const active = await page.evaluate(() => window.__everden!.isCombatActive());
    if (!active) return 'ended';

    await page.evaluate((turn) => {
      const qa = window.__everden!;
      if (!qa.isCombatActive()) return;
      if (turn > 25) qa.combatFlee();
      else qa.combatAttack();
    }, i);

    await page.waitForTimeout(400);
    const duel = page.locator('.dice-duel:not(.hidden)');
    if (await duel.isVisible()) {
      await duel.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    }
  }
  return page.evaluate(() => (window.__everden!.isCombatActive() ? 'timeout' : 'ended'));
}
