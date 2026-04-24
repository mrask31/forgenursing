import { test, expect } from '@playwright/test';

/**
 * REGRESSION TEST — Tutor Unchanged When quiz_first_enabled = false
 * @regression
 *
 * Verifies that the existing tutor flow is completely unaffected when
 * quiz_first_enabled is false (the default for all profiles).
 *
 * This test uses the same beta/test user credentials as other regression tests.
 * The test user MUST have quiz_first_enabled = false (the default).
 *
 * If this test fails: STOP. The quiz-first middleware branch is leaking into
 * the default tutor flow. All 33 existing users are potentially affected.
 */

const EMAIL = process.env.BETA_CLONE_EMAIL!;
const PASS = process.env.BETA_CLONE_PASSWORD!;

test('@regression Tutor flow unchanged when quiz_first_enabled = false', async ({ page }) => {
  // 1. Log in
  await page.goto('/login');
  await page.getByTestId('login-email').fill(EMAIL);
  await page.getByTestId('login-password').fill(PASS);
  await page.getByTestId('login-submit').click();

  await page.waitForLoadState('networkidle', { timeout: 15_000 });

  const finalUrl = page.url();

  // 2. Assert redirect to /tutor (NOT /entry or /quiz)
  expect(
    finalUrl,
    `REGRESSION: User with quiz_first_enabled=false was redirected to ${finalUrl} instead of /tutor. ` +
    `The quiz-first middleware branch is leaking. Fix middleware.ts immediately.`
  ).toContain('/tutor');

  expect(finalUrl).not.toContain('/entry');
  expect(finalUrl).not.toContain('/quiz');

  // 3. Assert tutor chat interface loads
  // Wait for the tutor page to render (look for known tutor UI elements)
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10_000 });

  // 4. Assert no quiz-related UI elements visible
  // The sidebar should NOT show "Practice Questions" when flag is off
  const sidebarText = await page.locator('aside').textContent();
  expect(sidebarText).not.toContain('Practice Questions');

  // No quiz-related routes should be linked
  const quizLinks = await page.locator('a[href*="/quiz"]').count();
  expect(quizLinks).toBe(0);

  const entryLinks = await page.locator('a[href*="/entry"]').count();
  expect(entryLinks).toBe(0);
});
