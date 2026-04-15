import { test, expect } from '@playwright/test';
import { admin } from './helpers/supabase';

const SEED_EMAIL = process.env.SEED_USER_EMAIL!;
const SEED_PASS = process.env.SEED_USER_PASSWORD!;

let seedUserId: string;
let medSurgClassId: string;
let pedsClassId: string;

test.beforeAll(async () => {
  // Find seed user
  const { data: list } = await admin.auth.admin.listUsers();
  const seedUser = list.users.find(u => u.email === SEED_EMAIL);
  if (!seedUser) throw new Error('Seed user not found');
  seedUserId = seedUser.id;

  // Clean up any existing test classes first
  await admin.from('student_classes').delete().eq('user_id', seedUserId).eq('code', 'QA-MEDSURG');
  await admin.from('student_classes').delete().eq('user_id', seedUserId).eq('code', 'QA-PEDS');

  // Insert Med-Surg class
  const { data: ms, error: msErr } = await admin
    .from('student_classes')
    .insert({
      user_id: seedUserId,
      code: 'QA-MEDSURG',
      name: 'Med-Surg Nursing',
      type: 'med_surg',
    })
    .select('id')
    .single();
  if (msErr) throw msErr;
  medSurgClassId = ms.id;

  // Insert Pediatrics class
  const { data: peds, error: pedsErr } = await admin
    .from('student_classes')
    .insert({
      user_id: seedUserId,
      code: 'QA-PEDS',
      name: 'Pediatric Nursing',
      type: 'peds',
    })
    .select('id')
    .single();
  if (pedsErr) throw pedsErr;
  pedsClassId = peds.id;
});

test.afterAll(async () => {
  // Clean up test classes
  if (medSurgClassId) await admin.from('student_classes').delete().eq('id', medSurgClassId);
  if (pedsClassId) await admin.from('student_classes').delete().eq('id', pedsClassId);
});

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(SEED_EMAIL);
  await page.getByTestId('login-password').fill(SEED_PASS);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(/\/(tutor|dashboard|app)/, { timeout: 30_000 });
});

test('Course chips adapt when student switches active course', async ({ page }) => {
  await page.goto('/tutor');

  // Wait for the course-switcher to be populated
  await page.waitForTimeout(2_000);

  await page.getByTestId('course-switcher').selectOption({ label: 'QA-MEDSURG – Med-Surg Nursing' });
  await page.waitForTimeout(1_500);

  const medSurgChips = await page.getByTestId('study-chip').allTextContents();
  expect(medSurgChips.length).toBeGreaterThan(0);

  await page.getByTestId('course-switcher').selectOption({ label: 'QA-PEDS – Pediatric Nursing' });
  await page.waitForTimeout(1_500);

  const pedsChips = await page.getByTestId('study-chip').allTextContents();
  expect(pedsChips.length).toBeGreaterThan(0);
  expect(pedsChips, 'Chips must change when course changes').not.toEqual(medSurgChips);
});
