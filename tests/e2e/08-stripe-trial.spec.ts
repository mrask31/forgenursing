import { test, expect } from '@playwright/test';
import { admin } from './helpers/supabase';
import { uniqueTestEmail, TEST_PASSWORD } from './helpers/users';

test('User 21+ hits paywall after trial expiry', async ({ page }) => {
  const email = uniqueTestEmail('stripe');
  const { data: created } = await admin.auth.admin.createUser({
    email, password: TEST_PASSWORD, email_confirm: true,
  });
  await admin.from('profiles').update({
    is_beta: false,
    subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  }).eq('id', created.user!.id);

  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(TEST_PASSWORD);
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('paywall')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/\$24\.99|\$89|\$199/)).toBeVisible();

  await admin.auth.admin.deleteUser(created.user!.id);
});
