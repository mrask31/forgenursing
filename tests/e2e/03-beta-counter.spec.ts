import { test, expect } from '@playwright/test';
import { getBetaCount } from './helpers/supabase';

test('Landing page beta counter matches Supabase live count @smoke', async ({ page }) => {
  await page.goto('/');
  const counterEl = page.getByTestId('beta-counter');
  await expect(counterEl).toBeVisible();

  const text = (await counterEl.textContent()) || '';
  const onPage = parseInt(text.replace(/[^0-9]/g, ''), 10);
  const live = await getBetaCount();

  expect(onPage, `Counter on page (${onPage}) ≠ Supabase (${live})`).toBe(live);
});
