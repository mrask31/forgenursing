import { test, expect } from '@playwright/test';

const SEED_EMAIL = process.env.SEED_USER_EMAIL!;
const SEED_PASS = process.env.SEED_USER_PASSWORD!;

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(SEED_EMAIL);
  await page.getByTestId('login-password').fill(SEED_PASS);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(/\/(tutor|dashboard|app|checkout)/, { timeout: 30_000 });

  // If redirected to /checkout, the seed user's subscription_status isn't set correctly
  if (page.url().includes('/checkout')) {
    throw new Error('Seed user redirected to /checkout — run: npx tsx tests/e2e/setup/create-seed-user.ts');
  }

  // Dismiss any post-login modals (PHI acknowledgment, program selection)
  await page.waitForTimeout(2_000);
  const phiButton = page.getByRole('button', { name: /I Understand/i });
  if (await phiButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await phiButton.click();
    await page.waitForTimeout(1_000);
  }
  const programButton = page.getByRole('button', { name: /BSN/i });
  if (await programButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await programButton.click();
    await page.waitForTimeout(1_000);
  }
});

test('AI response renders ADPIE blocks as styled cards, not code fences', async ({ page }) => {
  await page.goto('/tutor');
  await page.getByTestId('chat-input').fill(
    'A 68yo post-op patient has BP 88/52, HR 118, restless. What is my first nursing action?'
  );
  await page.getByTestId('chat-send').click();

  // Claude API + streaming can take 15-45s depending on load
  await page.waitForSelector('[data-testid="adpie-block-orient"]', { timeout: 60_000 });

  for (const block of ['orient', 'map', 'reasoning', 'trap', 'check']) {
    await expect(page.getByTestId(`adpie-block-${block}`)).toBeVisible();
  }

  const fenceCount = await page.locator('pre code:has-text("ORIENT")').count();
  expect(fenceCount, 'ADPIE leaking as code fence — markdown renderer is broken').toBe(0);

  await expect(page.getByTestId('adpie-block-trap')).toHaveClass(/trap-card|trap-block|border-\[#e6a817\]/);
});
