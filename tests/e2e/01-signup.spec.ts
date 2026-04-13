import { test, expect } from '@playwright/test';
import { uniqueTestEmail, TEST_PASSWORD } from './helpers/users';
import { getProfileByEmail, deleteUserByEmail } from './helpers/supabase';

test.describe('Signup flow @smoke', () => {
  const email = uniqueTestEmail('signup');

  test.afterAll(async () => { await deleteUserByEmail(email); });

  test('new user can create an account and land in app', async ({ page }) => {
    await page.goto('/signup');

    // Anti-bot: the form requires ≥3 seconds of interaction time and
    // formInteractedRef must be true (set on focus/change of inputs).
    // Playwright's fill() triggers focus+input events, satisfying the
    // interaction check. We add a small delay before submit to clear
    // the 3-second timer.

    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill(TEST_PASSWORD);
    await page.getByTestId('signup-confirm-password').fill(TEST_PASSWORD);

    // Terms checkbox is required — check it
    await page.getByRole('checkbox').check();

    // Wait enough time to pass the anti-bot 3-second check
    await page.waitForTimeout(3_500);

    await page.getByTestId('signup-submit').click();

    // Signup does NOT require email confirmation — user is redirected
    // straight to /tutor (or possibly through /checkout if trial setup
    // routes there). Accept either destination.
    await expect(page).toHaveURL(/\/(tutor|checkout|onboarding|dashboard|app)/, { timeout: 30_000 });

    // Verify the auth user record was actually created in Supabase
    const result = await getProfileByEmail(email);
    expect(result, `No auth user / profile created for ${email}`).not.toBeNull();
    expect(result!.auth, 'Auth user should exist').toBeTruthy();
  });
});
