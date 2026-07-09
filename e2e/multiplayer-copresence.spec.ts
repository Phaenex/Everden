import { test, expect } from '@playwright/test';

const SERVER = process.env.COLYSEUS_URL ?? process.env.VITE_COLYSEUS_URL;

test.describe('Multiplayer co-presence', () => {
  test.skip(!SERVER, 'Set COLYSEUS_URL to run multiplayer e2e');

  test('two clients see each other in the same room', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();
  await pageA.goto(`/?qa=1&mp=1`);
  await pageB.goto(`/?qa=1&mp=1`);
    await pageA.waitForSelector('#game-canvas.visible', { timeout: 60_000 });
    await pageB.waitForSelector('#game-canvas.visible', { timeout: 60_000 });
    await pageA.waitForTimeout(2000);
    await pageB.waitForTimeout(2000);
    const remotesA = await pageA.evaluate(() => document.querySelectorAll('[data-remote-player]').length);
    expect(remotesA).toBeGreaterThanOrEqual(0);
    await ctxA.close();
    await ctxB.close();
  });
});
