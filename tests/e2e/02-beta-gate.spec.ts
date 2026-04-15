import { test, expect } from '@playwright/test';
import { uniqueTestEmail, TEST_PASSWORD } from './helpers/users';
import { getProfileByEmail, deleteUserByEmail, getBetaCount } from './helpers/supabase';

test.describe('Beta gate logic', () => {
  const email = uniqueTestEmail('beta-gate');
  test.afterAll(async () => { await deleteUserByEmail(email); });

  test('signup respects beta cap (≤20 → is_beta=true, >20 → trial)', async ({ page }) => {
    const countBefore = await getBetaCount();

    await page.goto('/signup');
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill(TEST_PASSWORD);
    await page.getByTestId('signup-confirm-password').fill(TEST_PASSWORD);
    await page.getByRole('checkbox').check();

    // Anti-bot: signup form rejects submissions faster than 3 seconds
    await page.waitForTimeout(3_500);

    await page.getByTestId('signup-submit').click();
    await page.waitForURL(/\/(tutor|onboarding|dashboard|app|trial|checkout)/, { timeout: 30_000 });

    const result = await getProfileByEmail(email);
    expect(result).not.toBeNull();
    const profile = result!.profile;

    if (countBefore < 20) {
      expect(profile.is_beta, 'User in slot ≤20 should be beta').toBe(true);
      expect(profile.beta_expires_at, 'beta_expires_at must be set').toBeTruthy();
      const expires = new Date(profile.beta_expires_at).getTime();
      const expected = Date.now() + 90 * 24 * 60 * 60 * 1000;
      expect(Math.abs(expires - expected)).toBeLessThan(60 * 60 * 1000);
      expect(profile.subscription_status).not.toBe('trialing');
    } else {
      expect(profile.is_beta, 'User in slot >20 must NOT be beta').toBe(false);
      expect(profile.subscription_status, 'Should be on Stripe trial').toBe('trialing');
      expect(profile.trial_ends_at).toBeTruthy();
    }
  });
});
