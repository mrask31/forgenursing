import { test, expect } from '@playwright/test';
import { admin, deleteUserByEmail } from './helpers/supabase';
import { uniqueTestEmail, TEST_PASSWORD } from './helpers/users';

test.describe('Welcome email queue', () => {
  let testEmail: string;

  test.afterAll(async () => {
    if (testEmail) {
      await deleteUserByEmail(testEmail);
    }
  });

  test('Signup enqueues welcome email in welcome_email_queue', async ({ page }) => {
    testEmail = uniqueTestEmail('welcome');

    await page.goto('/signup');
    await page.getByTestId('signup-email').fill(testEmail);
    await page.getByTestId('signup-password').fill(TEST_PASSWORD);
    await page.getByTestId('signup-confirm-password').fill(TEST_PASSWORD);
    await page.getByRole('checkbox').check();

    // Anti-bot: signup form rejects submissions faster than 3 seconds
    await page.waitForTimeout(3_500);

    await page.getByTestId('signup-submit').click();
    await page.waitForURL(/\/(tutor|onboarding|dashboard|app|trial|checkout)/, { timeout: 30_000 });

    // Wait for the DB trigger / server-side queue insertion to fire
    await page.waitForTimeout(5_000);

    const { data: list } = await admin.auth.admin.listUsers();
    const user = list.users.find((u) => u.email === testEmail);
    expect(user, `Auth user not found for ${testEmail}`).toBeTruthy();

    const { data: queueRow } = await admin
      .from('welcome_email_queue')
      .select('*')
      .eq('user_id', user!.id)
      .single();

    expect(queueRow, 'No row in welcome_email_queue for new signup').toBeTruthy();
    expect(['pending', 'sent', 'skipped']).toContain(queueRow!.status);
  });
});
