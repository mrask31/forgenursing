import { test, expect } from '@playwright/test';
import { uniqueTestEmail, TEST_PASSWORD } from './helpers/users';
import { getProfileByEmail, deleteUserByEmail } from './helpers/supabase';

test.describe('Signup flow @smoke', () => {
  const email = uniqueTestEmail('signup');

  test.afterAll(async () => { await deleteUserByEmail(email); });

  test('new user can create an account and land in app', async ({ page }) => {
    await page.goto('/signup');
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill(TEST_PASSWORD);
    await page.getByTestId('signup-confirm-password').fill(TEST_PASSWORD);
    await page.getByRole('checkbox').check();
    await page.getByTestId('signup-submit').click();

    await expect(page).toHaveURL(/\/(tutor|onboarding|dashboard|app)/, { timeout: 15_000 });

    const result = await getProfileByEmail(email);
    expect(result, `No profile created for ${email}`).not.toBeNull();
    expect(result!.profile).toBeTruthy();
  });
});
