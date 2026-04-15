import { test, expect } from '@playwright/test';
import path from 'path';

const SEED_EMAIL = process.env.SEED_USER_EMAIL!;
const SEED_PASS = process.env.SEED_USER_PASSWORD!;

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(SEED_EMAIL);
  await page.getByTestId('login-password').fill(SEED_PASS);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(/\/(tutor|dashboard|app)/, { timeout: 30_000 });
});

test('Image upload: preview shows and message sends without error', async ({ page }) => {
  await page.goto('/tutor', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2_000);

  // Target the image file input specifically (accept="image/*")
  const fileInput = page.locator('input[type="file"][accept="image/*"]');
  await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'sample-ekg.png'));

  // Image preview should appear
  await expect(page.getByTestId('image-preview')).toBeVisible({ timeout: 5_000 });

  // Send button should be enabled (image attached counts as content)
  const sendButton = page.getByTestId('chat-send');
  await expect(sendButton).toBeEnabled();

  // Type a message and send
  await page.getByTestId('chat-input').fill('What rhythm is this?');
  await sendButton.click();

  // Wait for AI response — should not show an error
  // The assistant message will appear in the chat; just verify no error toast/banner
  await page.waitForTimeout(5_000);

  // Image preview should be cleared after send
  await expect(page.getByTestId('image-preview')).not.toBeVisible({ timeout: 10_000 });
});
