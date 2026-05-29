import { test, expect } from '@playwright/test';
import { admin, deleteUserByEmail } from './helpers/supabase';
import { uniqueTestEmail } from './helpers/users';

/**
 * SMOKE TEST — Settings / Logout
 * @smoke @regression
 *
 * Verifies:
 * - Authenticated user can open Settings from the app shell
 * - Settings page displays polished account/access labels
 * - Logout clears session and lands on /login
 */

test.describe.configure({ mode: 'serial' });

const TEST_EMAIL = uniqueTestEmail('settings-logout');
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;

let testUserId: string | null = null;

test.afterAll(async () => {
  if (TEST_EMAIL) {
    await deleteUserByEmail(TEST_EMAIL);
  }
});

async function createActiveUser() {
  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  expect(createError, `Failed to create user: ${createError?.message}`).toBeNull();
  expect(createData?.user?.id).toBeTruthy();
  testUserId = createData!.user!.id;

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      preferred_name: 'Settings Tester',
      quiz_first_enabled: true,
      default_entry_path: null,
      subscription_status: 'active',
      trial_ends_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      phi_acknowledged_at: new Date().toISOString(),
      program_level: 'BSN',
      program_track: 'BSN',
    })
    .eq('id', testUserId);

  expect(profileError, `Failed to update profile: ${profileError?.message}`).toBeNull();
}

async function login(page: any) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(TEST_EMAIL);
  await page.getByTestId('login-password').fill(TEST_PASSWORD);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(/\/(entry|quiz|tutor)/, { timeout: 20_000 });
}

test('@smoke @regression settings loads and logout clears session', async ({ page }) => {
  await createActiveUser();
  await login(page);

  await page.getByTestId('user-menu').first().click();
  await page.getByRole('link', { name: /^Settings$/ }).click();

  await expect(page).toHaveURL(/\/settings/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /Account settings/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(TEST_EMAIL)).toBeVisible();
  await expect(page.getByText(/Subscription active/i)).toBeVisible();
  await expect(page.getByText(/Study Options/i)).toBeVisible();

  await page.getByTestId('user-menu').first().click();
  await page.getByTestId('logout-button').click();

  await expect(page).toHaveURL(/\/login\?loggedOut=true/, { timeout: 20_000 });

  await page.goto('/entry');
  await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
});

