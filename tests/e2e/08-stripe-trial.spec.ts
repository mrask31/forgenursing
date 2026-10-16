import { test, expect } from '@playwright/test';
import { admin } from './helpers/supabase';
import { uniqueTestEmail, TEST_PASSWORD } from './helpers/users';

test('Expired no-card trial reaches current paid plans', async ({ page }) => {
  const email = uniqueTestEmail('stripe');
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email, password: TEST_PASSWORD, email_confirm: true,
  });
  if (createError || !created.user) throw createError || new Error('QA user was not created');
  try {
    const { error: profileError } = await admin.from('profiles').update({
      is_beta: false,
      subscription_status: 'trialing',
      trial_ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', created.user.id);
    if (profileError) throw profileError;

    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(TEST_PASSWORD);
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('paywall')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('$9.99', { exact: true })).toBeVisible();
    await expect(page.getByText('$79', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue to Checkout' })).toBeEnabled();
    await page.getByRole('button', { name: /Annual/ }).click();
    await expect(page.getByText('$79/year. Renews until canceled.', { exact: true })).toBeVisible();
    await expect(page.getByText(/\$24\.99|\$89|\$199/)).toHaveCount(0);

  } finally {
    const { error: cleanupError } = await admin.auth.admin.deleteUser(created.user.id);
    if (cleanupError) throw cleanupError;
  }
});
