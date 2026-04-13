import { test, expect } from '@playwright/test';

const SEED_EMAIL = process.env.SEED_USER_EMAIL!;
const SEED_PASS = process.env.SEED_USER_PASSWORD!;

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(SEED_EMAIL);
  await page.getByTestId('login-password').fill(SEED_PASS);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(/\/(tutor|dashboard|app)/);
});

test('Course chips adapt when student switches active course', async ({ page }) => {
  await page.goto('/tutor');

  await page.getByTestId('course-switcher').click();
  await page.getByRole('option', { name: /Med-Surg/i }).click();

  const medSurgChips = await page.getByTestId('study-chip').allTextContents();
  expect(medSurgChips.length).toBeGreaterThan(0);

  await page.getByTestId('course-switcher').click();
  await page.getByRole('option', { name: /Pediatrics/i }).click();

  const pedsChips = await page.getByTestId('study-chip').allTextContents();
  expect(pedsChips.length).toBeGreaterThan(0);
  expect(pedsChips, 'Chips must change when course changes').not.toEqual(medSurgChips);
});
