import { test, expect } from '@playwright/test';

/**
 * Quick landing page regression check.
 * Verifies key sections render on the public homepage.
 */

test('@smoke landing page renders key sections', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle', { timeout: 15_000 });

  // Hero
  await expect(page.getByText(/Stop guessing/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Start Practice|Start Free/i).first()).toBeVisible();

  // Key sections (scroll through page)
  await expect(page.getByText(/Clinical Judgment Map/i).first()).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/Sound familiar/i).first()).toBeVisible({ timeout: 5_000 });
  
  // Scroll to bottom for pricing
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1_000);

  // Pricing section
  await expect(page.getByText(/\$9\.99/i).first()).toBeVisible({ timeout: 5_000 });
});
