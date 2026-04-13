import { test, expect } from '@playwright/test';

test.skip(({ browserName }, testInfo) => testInfo.project.name !== 'mobile-safari',
  'Mobile-only suite');

const ROUTES = ['/', '/signup', '/login', '/pricing', '/tutor'];

for (const route of ROUTES) {
  test(`mobile: ${route} renders without horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow, `${route} has horizontal overflow on 390px`).toBe(false);

    await page.screenshot({ path: `test-results/mobile${route.replace(/\//g, '_') || '_root'}.png`, fullPage: true });
  });
}
