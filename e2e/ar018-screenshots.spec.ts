import { test } from '@playwright/test';
import { completeCharacterWizard, skipOpeningNarration } from './character-helpers';

const SHOT = 'docs/playtests/screenshots';

test.describe('AR-018 wizard screenshots', () => {
  test('tortoise messenger path captures for agent run log', async ({ page }) => {
    await completeCharacterWizard(page, {
      species: 'tortoise',
      name: 'River Test',
      motivationLabel: /Carrying someone else's worry/,
    });
    await page.screenshot({ path: `${SHOT}/AR_intro_wizard_tortoise_confirm.png` });

    await skipOpeningNarration(page);
    await page.screenshot({ path: `${SHOT}/AR_intro_wizard_tortoise_opening.png` });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SHOT}/AR_intro_wizard_tortoise_causeway.png` });
  });
});
