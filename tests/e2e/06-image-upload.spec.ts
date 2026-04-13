import { test, expect } from '@playwright/test';
import path from 'path';

const SEED_EMAIL = process.env.SEED_USER_EMAIL!;
const SEED_PASS = process.env.SEED_USER_PASSWORD!;

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(SEED_EMAIL);
  await page.getByTestId('login-password').fill(SEED_PASS);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(/\/(tutor|dashboard|app)/);
});

test('Image upload: preview shows and image reaches API payload', async ({ page }) => {
  await page.goto('/tutor');

  const apiCall = page.waitForRequest((req) =>
    req.url().includes('/api/chat') && req.method() === 'POST'
  );

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'sample-ekg.png'));

  await expect(page.getByTestId('image-preview')).toBeVisible();

  await page.getByTestId('chat-input').fill('What rhythm is this?');
  await page.getByTestId('chat-send').click();

  const req = await apiCall;
  const body = req.postDataJSON();
  const serialized = JSON.stringify(body);
  expect(
    serialized.includes('image') || serialized.includes('base64') || serialized.includes('data:image'),
    'Image not present in /api/chat payload'
  ).toBe(true);
});
