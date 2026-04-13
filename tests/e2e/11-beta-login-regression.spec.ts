import { test, expect } from '@playwright/test';

const EMAIL = process.env.BETA_CLONE_EMAIL!;
const PASS = process.env.BETA_CLONE_PASSWORD!;

/**
 * REGRESSION TEST — Beta Login Redirect Landmine
 *
 * Background: The login page (src/app/(public)/login/page.tsx) only checks
 * hasSubscriptionAccess() and does NOT check isBetaActive(). A beta user with
 * subscription_status = null will be incorrectly redirected to /checkout.
 *
 * As of the last production audit, no real users were in this state — every
 * beta user had subscription_status = 'trialing' or 'active', so the bug was
 * dormant. This test exists to catch it the moment it wakes up.
 *
 * If this test fails: STOP. A beta user has been locked out of their own
 * paid-for access. Fix the login redirect to call hasAccess() with is_beta
 * and beta_expires_at, not hasSubscriptionAccess() alone.
 */
test('@regression Beta user with subscription_status=null reaches /tutor, not /checkout', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(EMAIL);
  await page.getByTestId('login-password').fill(PASS);
  await page.getByTestId('login-submit').click();

  await page.waitForLoadState('networkidle', { timeout: 15_000 });

  const finalUrl = page.url();

  expect(
    finalUrl,
    `LANDMINE TRIGGERED: Beta user redirected to ${finalUrl}. ` +
    `The dormant login-redirect bug has activated. A real beta user is now ` +
    `locked out of /tutor. Fix immediately — see Open Items.`
  ).not.toContain('/checkout');

  expect(finalUrl).toContain('/tutor');
});
