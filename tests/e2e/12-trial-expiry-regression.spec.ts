import { test, expect } from '@playwright/test';
import { uniqueTestEmail, TEST_PASSWORD } from './helpers/users';
import { admin } from './helpers/supabase';

/**
 * REGRESSION TEST — Trial Expiry Revenue Wall
 *
 * Background: hasSubscriptionAccess() previously treated 'trialing' status as
 * unconditionally valid, allowing users with expired trials to access /tutor
 * indefinitely. Fixed in the trial expiry revenue bug fix commit. This test
 * ensures the wall stays up.
 *
 * If this test fails: STOP. Someone has reintroduced the short-circuit in
 * hasSubscriptionAccess, hasAccess, or one of the inline callers. Real users
 * are studying for free. Fix immediately.
 */
test('@regression Expired-trial user cannot reach /tutor', async ({ page }) => {
  const email = uniqueTestEmail('trial-expiry');

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  const userId = created.user!.id;

  try {
    // Put user into the exact vulnerable state
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await admin.from('profiles').update({
      is_beta: false,
      subscription_status: 'trialing',
      trial_ends_at: yesterday,
      phi_acknowledged_at: new Date().toISOString(),
      program_level: 'BSN',
    }).eq('id', userId);

    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(TEST_PASSWORD);
    await page.getByTestId('login-submit').click();

    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    const finalUrl = page.url();

    // Must NOT be on /tutor
    expect(
      finalUrl,
      `REVENUE BUG: Expired-trial user reached ${finalUrl}. The trial expiry wall is down. Fix hasAccess().`
    ).not.toContain('/tutor');

    // Must be on a paywall / checkout / payment-required route
    expect(
      finalUrl.includes('/checkout') || finalUrl.includes('/payment-required') || finalUrl.includes('/billing'),
      `Expired-trial user should be routed to a paywall. Instead landed at: ${finalUrl}`
    ).toBe(true);
  } finally {
    await admin.auth.admin.deleteUser(userId);
  }
});
