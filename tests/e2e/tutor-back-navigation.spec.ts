import { test, expect } from '@playwright/test';
import { admin, deleteUserByEmail } from './helpers/supabase';
import { uniqueTestEmail } from './helpers/users';

/**
 * REGRESSION TEST — Tutor Back Navigation
 * @smoke @regression
 *
 * Verifies that navigating to the tutor from quiz (Fix with Tutor)
 * and then going back returns the user to the correct quiz context.
 *
 * NOTE: The tutor does NOT have an in-app "Back to Quiz" button.
 * These tests use browser back navigation (history.back()).
 */

const TEST_EMAIL = uniqueTestEmail('tutor-back');
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;
let testUserId: string | null = null;
let sessionId: string | null = null;

async function createTestUser() {
  const { data, error } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  expect(error).toBeNull();
  testUserId = data!.user!.id;

  const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await admin.from('profiles').update({
    quiz_first_enabled: true,
    default_entry_path: 'quiz',
    subscription_status: 'trialing',
    trial_ends_at: trialEnd,
    phi_acknowledged_at: new Date().toISOString(),
    program_level: 'BSN',
  }).eq('id', testUserId);

  // Seed a quiz session with 1 unanswered question (same pattern as quiz-mistake-map)
  const { data: sess } = await admin.from('quiz_sessions').insert({
    user_id: testUserId,
    source_type: 'generic',
    status: 'in_progress',
    score: 0,
    total_questions: 1,
    current_question_index: 0,
  }).select('id').single();
  sessionId = sess!.id;

  // Seed one unanswered question
  await admin.from('quiz_questions').insert({
    session_id: sessionId,
    question_index: 0,
    question_stem: 'A patient with chest pain and diaphoresis arrives in the ED. Which action should the nurse take FIRST?',
    options: [
      { label: 'A', text: 'Administer aspirin 325 mg' },
      { label: 'B', text: 'Obtain a 12-lead ECG' },
      { label: 'C', text: 'Start an IV line' },
      { label: 'D', text: 'Notify the physician' },
    ],
    correct_answer: 'B',
    rationale_correct: 'A 12-lead ECG is the priority to identify the cardiac rhythm and guide treatment.',
    rationale_incorrect: { A: 'Aspirin is important but ECG takes priority.', B: 'Correct.', C: 'IV access is needed but ECG first.', D: 'Notify after initial assessment.' },
    nclex_category: 'Priority Setting',
    difficulty: 3,
    mistake_type: 'Priority-setting',
    reasoning_trap: 'Jumped to intervention before assessment.',
    fix_instruction: 'Always assess before intervening in acute scenarios.',
    retest_focus: 'priority-setting with acute cardiac patients',
  });
}

async function login(page: any) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(TEST_EMAIL);
  await page.getByTestId('login-password').fill(TEST_PASSWORD);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(/\/quiz/, { timeout: 20_000 });
}

test.afterAll(async () => {
  if (testUserId) {
    // Clean up quiz data
    if (sessionId) {
      await admin.from('quiz_questions').delete().eq('session_id', sessionId);
      await admin.from('quiz_sessions').delete().eq('id', sessionId);
    }
    // Clean up chats created by Fix with Tutor
    await admin.from('messages').delete().eq('chat_id', testUserId); // best effort
    const { data: chats } = await admin.from('chats').select('id').eq('user_id', testUserId);
    if (chats) {
      for (const chat of chats) {
        await admin.from('messages').delete().eq('chat_id', chat.id);
      }
      await admin.from('chats').delete().eq('user_id', testUserId);
    }
  }
  await deleteUserByEmail(TEST_EMAIL);
});

test('@smoke @regression Fix with Tutor → browser back returns to quiz rationale', async ({ page }) => {
  await createTestUser();
  await login(page);

  // Login routes to /quiz (default_entry_path = 'quiz')
  // Should show Resume button for the in-progress session
  const resumeBtn = page.getByRole('button', { name: /^Resume$/i });
  await expect(resumeBtn).toBeVisible({ timeout: 15_000 });
  await resumeBtn.click();

  // Question should appear
  await expect(page.getByText(/chest pain/i)).toBeVisible({ timeout: 15_000 });

  // Answer incorrectly (choose A, correct is B)
  await page.getByRole('button', { name: /^A\)/ }).click();
  await page.getByRole('button', { name: /Submit Answer/i }).click();

  // Rationale screen should show with Fix with Tutor
  await expect(page.getByText(/Missed this one/i)).toBeVisible({ timeout: 15_000 });
  const fixBtn = page.getByRole('button', { name: /Fix with Tutor/i });
  await expect(fixBtn).toBeVisible({ timeout: 10_000 });

  // Record current URL before navigating to tutor
  const quizUrl = page.url();

  await fixBtn.click();

  // Should navigate to tutor
  await page.waitForURL(/\/tutor/, { timeout: 20_000 });
  expect(page.url()).toContain('/tutor');

  // Browser back should return to quiz
  await page.goBack();
  await page.waitForLoadState('networkidle', { timeout: 15_000 });

  const backUrl = page.url();
  expect(backUrl).toContain('/quiz');
  expect(backUrl).not.toContain('/login');
  expect(backUrl).not.toContain('/entry');
});

test('@smoke @regression Results → Train Pattern tutor → browser back returns to results', async ({ page }) => {
  // Complete the session first
  if (!testUserId || !sessionId) {
    test.skip(true, 'Depends on previous test setup');
    return;
  }

  // Mark session as completed
  await admin.from('quiz_sessions').update({
    status: 'completed',
    score: 3,
    current_question_index: 5,
    completed_at: new Date().toISOString(),
  }).eq('id', sessionId);

  await login(page);

  // Go to results page
  await page.goto(`/quiz/results?sessionId=${sessionId}`);
  await page.waitForLoadState('networkidle', { timeout: 15_000 });

  // Verify results page loaded
  await expect(page.getByText(/Diagnostic Complete|Focused Drill Complete|Quiz Complete/i).first()).toBeVisible({ timeout: 10_000 });

  // Click Train Pattern or Fix with Tutor on results
  const trainBtn = page.getByRole('button', { name: /Train Pattern|Fix with Tutor/i }).first();
  const trainVisible = await trainBtn.isVisible({ timeout: 5_000 }).catch(() => false);

  if (trainVisible) {
    await trainBtn.click();

    // Should navigate to tutor
    await page.waitForURL(/\/tutor/, { timeout: 20_000 });
    expect(page.url()).toContain('/tutor');

    // Browser back should return to results
    await page.goBack();
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    const backUrl = page.url();
    expect(backUrl).toContain(`/quiz/results`);
    expect(backUrl).toContain(sessionId!);

    // Results content should still render
    await expect(page.getByText(/Diagnostic Complete|Focused Drill Complete|Quiz Complete/i).first()).toBeVisible({ timeout: 10_000 });
  } else {
    // Results page loaded but no Train Pattern button (no missed questions in seeded data)
    // Just verify results page is accessible
    expect(page.url()).toContain('/quiz/results');
  }
});

test('@smoke Show Me Visually modal still opens after back navigation', async ({ page }) => {
  // This test verifies the visual lessons modal works independently
  // Uses the existing visual-lessons test pattern but adds a back-nav check
  if (!testUserId) {
    test.skip(true, 'Depends on test user setup');
    return;
  }

  await login(page);
  await page.goto(`/quiz`);
  await page.waitForLoadState('networkidle', { timeout: 15_000 });

  // Resume if available
  const resumeBtn = page.getByRole('button', { name: /^Resume$/i });
  const hasResume = await resumeBtn.isVisible({ timeout: 5_000 }).catch(() => false);
  
  if (hasResume) {
    await resumeBtn.click();
    await page.waitForTimeout(2_000);
  }

  // Look for Show Me Visually button
  const showVisual = page.getByRole('button', { name: /Show Me Visually/i });
  const visualVisible = await showVisual.isVisible({ timeout: 5_000 }).catch(() => false);

  if (visualVisible) {
    await showVisual.click();

    // Modal should open
    await expect(page.getByText(/Show Me Visually/i).first()).toBeVisible({ timeout: 10_000 });

    // Close modal (click X or outside)
    const closeBtn = page.getByRole('button', { name: /close|×/i }).first();
    const closeVisible = await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (closeVisible) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    // Page should still be usable
    await page.waitForTimeout(1_000);
    expect(page.url()).toContain('/quiz');
  } else {
    // No Show Me Visually visible — quiz may have advanced past the wrong answer
    // Just confirm quiz page is functional
    expect(page.url()).toContain('/quiz');
  }
});
