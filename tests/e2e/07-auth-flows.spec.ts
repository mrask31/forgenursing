import { test, expect } from '@playwright/test';
import { uniqueTestEmail, TEST_PASSWORD } from './helpers/users';
import { admin, deleteUserByEmail } from './helpers/supabase';

test.describe('Auth flows @smoke', () => {
  const email = uniqueTestEmail('auth');

  test.beforeAll(async () => {
    await admin.auth.admin.createUser({
      email, password: TEST_PASSWORD, email_confirm: true,
    });
  });
  test.afterAll(async () => { await deleteUserByEmail(email); });

  test('login → logout', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(TEST_PASSWORD);
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/(tutor|dashboard|app)/);

    // Logout is in the Sidebar profile menu
    await page.getByTestId('user-menu').click();
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/(login|signup|$)/);
  });

  // NOTE: Skipped — no dedicated /reset-password page exists in the app
  test.skip('password reset request submits successfully', async ({ page }) => {
    await page.goto('/reset-password');
    await page.getByTestId('reset-email').fill(email);
    await page.getByTestId('reset-submit').click();
    await expect(page.getByText(/check your (email|inbox)/i)).toBeVisible();
  });
});
