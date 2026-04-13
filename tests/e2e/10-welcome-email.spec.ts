import { test, expect } from '@playwright/test';
import { admin, deleteUserByEmail } from './helpers/supabase';
import { uniqueTestEmail, TEST_PASSWORD } from './helpers/users';

test('Signup enqueues welcome email in welcome_email_queue', async ({ page }) => {
  const email = uniqueTestEmail('welcome');

  await page.goto('/signup');
  await page.getByTestId('signup-email').fill(email);
  await page.getByTestId('signup-password').fill(TEST_PASSWORD);
  await page.getByTestId('signup-confirm-password').fill(TEST_PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByTestId('signup-submit').click();
  await page.waitForURL(/\/(tutor|onboarding|dashboard|app|trial|checkout)/, { timeout: 15_000 });

  await new Promise((r) => setTimeout(r, 2000));

  const { data: list } = await admin.auth.admin.listUsers();
  const user = list.users.find((u) => u.email === email);
  expect(user).toBeTruthy();

  const { data: queueRow } = await admin
    .from('welcome_email_queue')
    .select('*')
    .eq('user_id', user!.id)
    .single();

  expect(queueRow, 'No row in welcome_email_queue for new signup').toBeTruthy();
  expect(['pending', 'sent']).toContain(queueRow!.status);

  await deleteUserByEmail(email);
});
