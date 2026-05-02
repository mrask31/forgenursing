import { test, expect } from '@playwright/test';
import { admin, deleteUserByEmail } from './helpers/supabase';
import { uniqueTestEmail } from './helpers/users';

/**
 * ROUTING TEST — Quiz-First User Routes to /entry
 * @smoke @regression
 *
 * Verifies that a user with quiz_first_enabled=true and default_entry_path=null
 * is routed to /entry (the quiz-first choice screen) after login, NOT /tutor.
 *
 * This is the complement of tutor-unchanged-when-flag-off.spec.ts.
 *
 * Strategy:
 *   1. Create a test user via Supabase admin API (auto-confirmed).
 *   2. Set profile: quiz_first_enabled=true, trialing, trial not expired.
 *   3. Log in through the UI.
 *   4. Assert final URL is /entry.
 *   5. Assert the entry choice screen renders.
 *   6. Clean up the test user.
 */

const TEST_EMAIL = uniqueTestEmail('quiz-routing');
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;

let testUserId: string | null = null;

test.afterAll(async () => {
  if (TEST_EMAIL) {
    await deleteUserByEmail(TEST_EMAIL);
  }
});

test('@smoke @regression Quiz-first user routes to /entry after login', async ({ page }) => {
  // ── Step 1: Create user via admin API (auto-confirmed, no email verification) ──
  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true, // Skip email verification
  });

  expect(createError, `Failed to create test user: ${createError?.message}`).toBeNull();
  expect(createData?.user?.id).toBeTruthy();
  testUserId = createData!.user!.id;

  // ── Step 2: Set profile flags for quiz-first trialing user ──
  const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      quiz_first_enabled: true,
      default_entry_path: null,
      subscription_status: 'trialing',
      trial_ends_at: trialEnd,
      phi_acknowledged_at: new Date().toISOString(), // Skip PHI modal
      program_level: 'BSN', // Skip program selection modal
    })
    .eq('id', testUserId);

  expect(profileError, `Failed to update profile: ${profileError?.message}`).toBeNull();

  // Verify profile was set correctly
  const { data: profile } = await admin
    .from('profiles')
    .select('quiz_first_enabled, default_entry_path, subscription_status, trial_ends_at')
    .eq('id', testUserId)
    .single();

  expect(profile?.quiz_first_enabled).toBe(true);
  expect(profile?.default_entry_path).toBeNull();
  expect(profile?.subscription_status).toBe('trialing');

  // ── Step 3: Log in through the UI ──
  await page.goto('/login');
  await page.getByTestId('login-email').fill(TEST_EMAIL);
  await page.getByTestId('login-password').fill(TEST_PASSWORD);
  await page.getByTestId('login-submit').click();

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle', { timeout: 20_000 });

  const finalUrl = page.url();

  // ── Step 4: Assert routing ──
  expect(
    finalUrl,
    `ROUTING BUG: Quiz-first user (quiz_first_enabled=true, default_entry_path=null) ` +
    `was routed to ${finalUrl} instead of /entry. ` +
    `Check auth callback, login page, and middleware resolveEntryPath logic.`
  ).toContain('/entry');

  expect(finalUrl).not.toContain('/tutor');

  // ── Step 5: Assert the entry choice screen renders ──
  // The /entry page should show "Practice Questions" and "AI Clinical Tutor" buttons
  await expect(
    page.getByText('Practice Questions').first()
  ).toBeVisible({ timeout: 10_000 });

  await expect(
    page.getByText('AI Clinical Tutor').first()
  ).toBeVisible({ timeout: 5_000 });

  // Verify "How do you want to study?" or similar heading is present
  await expect(
    page.getByText(/how do you want to study/i).first()
  ).toBeVisible({ timeout: 5_000 });
});

test('@smoke Quiz-first user with default_entry_path=quiz routes to /quiz', async ({ page }) => {
  // This test reuses the user created in the previous test
  // Update default_entry_path to 'quiz'
  if (!testUserId) {
    test.skip(true, 'Depends on previous test creating the user');
    return;
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ default_entry_path: 'quiz' })
    .eq('id', testUserId);

  expect(updateError).toBeNull();

  // Log in
  await page.goto('/login');
  await page.getByTestId('login-email').fill(TEST_EMAIL);
  await page.getByTestId('login-password').fill(TEST_PASSWORD);
  await page.getByTestId('login-submit').click();

  await page.waitForLoadState('networkidle', { timeout: 20_000 });

  const finalUrl = page.url();

  expect(
    finalUrl,
    `ROUTING BUG: User with default_entry_path=quiz was routed to ${finalUrl} instead of /quiz.`
  ).toContain('/quiz');

  expect(finalUrl).not.toContain('/tutor');
  expect(finalUrl).not.toContain('/entry');
});

test('@smoke Quiz-first user with default_entry_path=tutor routes to /tutor', async ({ page }) => {
  if (!testUserId) {
    test.skip(true, 'Depends on previous test creating the user');
    return;
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ default_entry_path: 'tutor' })
    .eq('id', testUserId);

  expect(updateError).toBeNull();

  // Log in
  await page.goto('/login');
  await page.getByTestId('login-email').fill(TEST_EMAIL);
  await page.getByTestId('login-password').fill(TEST_PASSWORD);
  await page.getByTestId('login-submit').click();

  await page.waitForLoadState('networkidle', { timeout: 20_000 });

  const finalUrl = page.url();

  expect(
    finalUrl,
    `ROUTING BUG: User with default_entry_path=tutor was routed to ${finalUrl} instead of /tutor.`
  ).toContain('/tutor');

  expect(finalUrl).not.toContain('/entry');

  // Reset for cleanup
  await admin
    .from('profiles')
    .update({ default_entry_path: null })
    .eq('id', testUserId);
});
