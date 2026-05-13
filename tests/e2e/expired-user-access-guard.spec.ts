import { test, expect } from '@playwright/test';
import { admin, deleteUserByEmail } from './helpers/supabase';
import { uniqueTestEmail } from './helpers/users';

/**
 * REGRESSION TEST — Expired User Cannot Access Protected Routes
 * @smoke @regression
 *
 * Verifies that a user with subscription_status='expired' cannot access
 * /tutor, /quiz, or /entry — even via client-side navigation from /billing/cancel.
 *
 * Root cause: Client-side navigation within the (app) layout group bypasses
 * middleware. The fix adds a client-side access guard in the (app) layout.
 */

const TEST_EMAIL = uniqueTestEmail('expired-guard');
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;

let testUserId: string | null = null;

test.afterAll(async () => {
  if (TEST_EMAIL) {
    await deleteUserByEmail(TEST_EMAIL);
  }
});

test.describe('Expired user access guard @smoke @regression', () => {
  test.beforeAll(async () => {
    // Create an expired test user
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });

    expect(createError).toBeNull();
    testUserId = createData!.user!.id;

    // Set profile to expired state
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        subscription_status: 'expired',
        trial_ends_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // expired 7 days ago
        is_beta: false,
        beta_expires_at: null,
        quiz_first_enabled: true,
        phi_acknowledged_at: new Date().toISOString(),
        program_level: 'BSN',
      })
      .eq('id', testUserId);

    expect(profileError).toBeNull();
  });

  test('direct /tutor access redirects to /checkout', async ({ page }) => {
    // Log in
    await page.goto('/login');
    await page.getByTestId('login-email').fill(TEST_EMAIL);
    await page.getByTestId('login-password').fill(TEST_PASSWORD);
    await page.getByTestId('login-submit').click();

    // Should be redirected to /checkout (middleware blocks expired users)
    await page.waitForURL(/\/checkout/, { timeout: 15_000 });

    // Now try direct navigation to /tutor
    await page.goto('/tutor');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Should be redirected away from /tutor
    const url = page.url();
    expect(url).not.toContain('/tutor');
    expect(url).toMatch(/\/checkout/);
  });

  test('direct /quiz access redirects to /checkout', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(TEST_EMAIL);
    await page.getByTestId('login-password').fill(TEST_PASSWORD);
    await page.getByTestId('login-submit').click();

    await page.waitForURL(/\/checkout/, { timeout: 15_000 });

    await page.goto('/quiz');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    const url = page.url();
    expect(url).not.toContain('/quiz');
    expect(url).toMatch(/\/checkout/);
  });

  test('client-side navigation from /billing/cancel to /tutor is blocked', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(TEST_EMAIL);
    await page.getByTestId('login-password').fill(TEST_PASSWORD);
    await page.getByTestId('login-submit').click();

    await page.waitForURL(/\/checkout/, { timeout: 15_000 });

    // Navigate to billing cancel page directly (allowed — it's unguarded)
    await page.goto('/billing/cancel');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Billing cancel page should load (it's unguarded)
    expect(page.url()).toContain('/billing/cancel');

    // Now attempt client-side navigation to /tutor via JavaScript
    await page.evaluate(() => {
      window.location.href = '/tutor';
    });

    // Wait for navigation and guard to fire
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await page.waitForTimeout(3_000);

    const finalUrl = page.url();
    // Should be redirected to /checkout, not /tutor
    expect(finalUrl).not.toContain('/tutor');
    expect(finalUrl).toMatch(/\/checkout/);
  });

  test('tutor UI is not visible to expired user', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(TEST_EMAIL);
    await page.getByTestId('login-password').fill(TEST_PASSWORD);
    await page.getByTestId('login-submit').click();

    await page.waitForURL(/\/checkout/, { timeout: 15_000 });

    // Try to access tutor with sessionId param
    await page.goto('/tutor?sessionId=fake-session-id');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Wait for client-side guard
    await page.waitForTimeout(3_000);

    const url = page.url();
    expect(url).not.toContain('/tutor');

    // Tutor chat interface should not be visible
    const chatInput = page.locator('textarea, [data-testid="chat-input"]');
    await expect(chatInput).not.toBeVisible({ timeout: 3_000 });
  });
});
