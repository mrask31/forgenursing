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

test('AI response renders ADPIE blocks as styled cards, not code fences', async ({ page }) => {
  await page.goto('/tutor');
  await page.getByTestId('chat-input').fill(
    'A 68yo post-op patient has BP 88/52, HR 118, restless. What is my first nursing action?'
  );
  await page.getByTestId('chat-send').click();

  await page.waitForSelector('[data-testid="adpie-block-orient"]', { timeout: 30_000 });

  for (const block of ['orient', 'map', 'reasoning', 'trap', 'check']) {
    await expect(page.getByTestId(`adpie-block-${block}`)).toBeVisible();
  }

  const fenceCount = await page.locator('pre code:has-text("ORIENT")').count();
  expect(fenceCount, 'ADPIE leaking as code fence — markdown renderer is broken').toBe(0);

  await expect(page.getByTestId('adpie-block-trap')).toHaveClass(/trap-card|trap-block|border-\[#e6a817\]/);
});
