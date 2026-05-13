import { test, expect } from '@playwright/test';
import { admin } from './helpers/supabase';

/**
 * SMOKE TEST — Tutor Message Save (Post UUID-Fix Verification)
 * @smoke @regression
 *
 * Verifies that /api/chat/save correctly accepts valid UUID chat IDs
 * and saves user messages without the "Failed to save message" error.
 *
 * Bug: commit pre-7ce3d43 had UUID regex 8-4-4-12 instead of 8-4-4-4-12,
 * rejecting ALL valid UUIDs and breaking every tutor message save.
 *
 * Uses BETA_CLONE test account (has active access, routes to /tutor).
 */

const EMAIL = process.env.BETA_CLONE_EMAIL!;
const PASS = process.env.BETA_CLONE_PASSWORD!;

test.describe('Tutor message save @smoke', () => {
  test('suggested prompt saves without error', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.getByTestId('login-email').fill(EMAIL);
    await page.getByTestId('login-password').fill(PASS);
    await page.getByTestId('login-submit').click();

    // Wait for tutor to load
    await page.waitForURL(/\/tutor/, { timeout: 20_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // 2. Look for a suggested prompt button or the chat input
    // The tutor has suggested prompts or an empty state with quick-start options
    const suggestedPrompt = page.locator('button:has-text("NCLEX"), button:has-text("priority"), button:has-text("question"), [data-testid="suggested-prompt"]').first();
    const chatInput = page.locator('textarea, input[placeholder*="Ask"], input[placeholder*="clinical"], [data-testid="chat-input"]').first();

    // Try clicking a suggested prompt if visible
    const hasSuggested = await suggestedPrompt.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasSuggested) {
      await suggestedPrompt.click();
    } else {
      // Fall back to typing in the input
      await chatInput.waitFor({ state: 'visible', timeout: 10_000 });
      await chatInput.fill('Give me one NCLEX-style priority question about pharmacology.');
      // Find and click the send button
      const sendBtn = page.locator('button[type="submit"], button:has-text("Send"), [data-testid="send-button"], button[aria-label*="send" i]').first();
      await sendBtn.click();
    }

    // 3. Wait a moment for the save request to complete
    await page.waitForTimeout(3_000);

    // 4. Assert NO error banner appears
    const errorBanner = page.locator('text="Failed to save message"');
    const invalidIdError = page.locator('text="Invalid chat ID"');

    await expect(errorBanner).not.toBeVisible({ timeout: 5_000 });
    await expect(invalidIdError).not.toBeVisible({ timeout: 2_000 });

    // 5. Assert a user message appeared in the chat
    // Look for the message content in the chat area
    const chatArea = page.locator('[class*="message"], [data-testid="chat-messages"], [role="log"], main').first();
    await expect(chatArea).toBeVisible({ timeout: 5_000 });

    // 6. Wait for AI response to begin (streaming indicator or assistant message)
    // The AI response should start within 15 seconds
    const aiResponse = page.locator('[class*="assistant"], [data-role="assistant"], [class*="prose"]').first();
    await expect(aiResponse).toBeVisible({ timeout: 20_000 });
  });

  test('typed message saves without error', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.getByTestId('login-email').fill(EMAIL);
    await page.getByTestId('login-password').fill(PASS);
    await page.getByTestId('login-submit').click();

    await page.waitForURL(/\/tutor/, { timeout: 20_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // 2. Type a custom message
    const chatInput = page.locator('textarea, input[placeholder*="Ask"], input[placeholder*="clinical"], [data-testid="chat-input"]').first();
    await chatInput.waitFor({ state: 'visible', timeout: 10_000 });
    await chatInput.fill('What are the priority nursing actions for a patient with chest pain?');

    // Submit
    const sendBtn = page.locator('button[type="submit"], button:has-text("Send"), [data-testid="send-button"], button[aria-label*="send" i]').first();
    await sendBtn.click();

    // 3. Wait for save
    await page.waitForTimeout(3_000);

    // 4. Assert no error
    const errorBanner = page.locator('text="Failed to save message"');
    await expect(errorBanner).not.toBeVisible({ timeout: 5_000 });

    // 5. Assert AI response begins
    const aiResponse = page.locator('[class*="assistant"], [data-role="assistant"], [class*="prose"]').first();
    await expect(aiResponse).toBeVisible({ timeout: 25_000 });
  });

  test('Supabase has messages for test user', async () => {
    // Verify at DB level that messages exist for the beta clone user
    const { data: users } = await admin.auth.admin.listUsers();
    const testUser = users.users.find(u => u.email === EMAIL);
    expect(testUser, `Test user ${EMAIL} not found in auth.users`).toBeTruthy();

    // Check for recent chats
    const { data: chats, error: chatError } = await admin
      .from('chats')
      .select('id, title, updated_at')
      .eq('user_id', testUser!.id)
      .order('updated_at', { ascending: false })
      .limit(3);

    expect(chatError).toBeNull();
    expect(chats!.length, 'Expected at least 1 chat for test user').toBeGreaterThan(0);

    // Check for messages in the most recent chat
    const latestChat = chats![0];
    const { data: messages, error: msgError } = await admin
      .from('messages')
      .select('id, role, content, created_at')
      .eq('chat_id', latestChat.id)
      .order('created_at', { ascending: false })
      .limit(5);

    expect(msgError).toBeNull();
    expect(messages!.length, 'Expected at least 1 message in latest chat').toBeGreaterThan(0);

    // Verify there's at least one user message
    const userMessages = messages!.filter(m => m.role === 'user');
    expect(userMessages.length, 'Expected at least 1 user message').toBeGreaterThan(0);
  });
});
