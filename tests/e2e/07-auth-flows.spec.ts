import { test, expect } from '@playwright/test';
import { uniqueTestEmail, TEST_PASSWORD } from './helpers/users';
import { admin, deleteUserByEmail } from './helpers/supabase';

test.describe('Auth flows @smoke', () => {
  const email = uniqueTestEmail('auth');

  test.beforeAll(async () => {
    // Create user with email confirmed AND pre-set the profile fields that
    // trigger blocking modals (PHI acknowledgment + program level) so the
    // login → logout flow isn't gated by onboarding dialogs.
    const { data } = await admin.auth.admin.createUser({
      email, password: TEST_PASSWORD, email_confirm: true,
    });

    if (data.user) {
      // Ensure the profile has phi_acknowledged_at and program_level set
      // so the PHI modal and Program Selection modal don't appear.
      // Also set subscription_status to 'trialing' so login doesn't
      // redirect to /checkout.
      await admin
        .from('profiles')
        .upsert({
          id: data.user.id,
          phi_acknowledged_at: new Date().toISOString(),
          program_level: 'BSN',
          subscription_status: 'trialing',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'id' });
    }
  });

  test.afterAll(async () => { await deleteUserByEmail(email); });

  test('login → logout', async ({ page, isMobile }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(TEST_PASSWORD);
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/(tutor|dashboard|app)/, { timeout: 30_000 });

    // --- Dismiss onboarding modals that gate the app ---
    // AppShell loads the profile async and may show:
    //   1. PHI Acknowledgment modal (if phi_acknowledged_at is null)
    //   2. Program Selection modal (if program_level is null)
    // Even though we pre-set these in beforeAll, handle them as a safety net.

    // Give the page time to load profile and potentially show modals
    await page.waitForTimeout(2_000);

    // PHI Acknowledgment modal — "I Understand — Start Studying"
    const phiButton = page.getByRole('button', { name: /I Understand/i });
    if (await phiButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await phiButton.click();
      await page.waitForTimeout(1_000);
    }

    // Program Selection modal — pick any program level
    const programButton = page.getByRole('button', { name: /BSN/i });
    if (await programButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await programButton.click();
      await page.waitForTimeout(1_000);
    }

    // Ensure no blocking overlay remains before interacting with sidebar
    // The Radix dialog overlay has: data-state="open", class includes
    // "fixed inset-0 z-50 bg-black/80"
    const overlay = page.locator('div[data-state="open"].fixed.inset-0');
    await expect(overlay).toHaveCount(0, { timeout: 5_000 }).catch(() => {
      // If overlay still exists, it might be a different state — continue anyway
    });

    if (isMobile) {
      // On mobile (iPhone 13 / 390px), the sidebar is hidden behind a drawer.
      // Open the mobile nav drawer via the hamburger menu button.
      await page.getByLabel('Open navigation menu').click();
      await page.waitForTimeout(500);

      // Two Sidebar instances exist: the desktop one (display:none on mobile)
      // and the one inside the MobileNav drawer. Scope to the visible drawer.
      const mobileDrawer = page.locator('aside[aria-label="Navigation menu"]');
      await expect(mobileDrawer).toBeVisible({ timeout: 5_000 });

      const userMenu = mobileDrawer.getByTestId('user-menu');
      await userMenu.scrollIntoViewIfNeeded();
      await userMenu.click();

      const logoutBtn = mobileDrawer.getByTestId('logout-button');
      await expect(logoutBtn).toBeVisible({ timeout: 5_000 });
      await logoutBtn.click();
    } else {
      // Desktop: sidebar is always visible on the left
      await page.getByTestId('user-menu').first().click();
      await expect(page.getByTestId('logout-button').first()).toBeVisible({ timeout: 5_000 });
      await page.getByTestId('logout-button').first().click();
    }

    await expect(page).toHaveURL(/\/(login|signup|$)/, { timeout: 15_000 });
  });

  test('password reset request submits successfully', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByTestId('forgot-email').fill(email);
    await page.getByTestId('forgot-submit').click();
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10_000 });
  });
});
