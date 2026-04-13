import { test, expect } from '@playwright/test';
import { getBetaCount } from './helpers/supabase';

test('Landing page beta counter matches Supabase when slots available @smoke', async ({ page }) => {
  const live = await getBetaCount();

  await page.goto('/');
  const counterEl = page.getByTestId('beta-counter');

  if (live >= 20) {
    // Beta full — banner should be hidden
    await expect(counterEl).toHaveCount(0);
    test.info().annotations.push({
      type: 'skip-reason',
      description: `Beta full (${live}/20) — counter correctly hidden`,
    });
    return;
  }

  // Beta has room — banner should be visible and match
  await expect(counterEl).toBeVisible();

  const text = (await counterEl.textContent()) || '';
  const onPage = parseInt(text.replace(/[^0-9]/g, ''), 10);

  expect(onPage, `Counter on page (${onPage}) ≠ Supabase (${live})`).toBe(live);
});
