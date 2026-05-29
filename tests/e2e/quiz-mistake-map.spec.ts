import { test, expect } from '@playwright/test';
import { admin, deleteUserByEmail } from './helpers/supabase';
import { uniqueTestEmail } from './helpers/users';

/**
 * SMOKE TEST — Quiz Mistake Map / Fix with Tutor
 * @smoke @regression
 *
 * Verifies the Miss → Map → Fix product promise inside the app:
 * - A seeded quiz question can be resumed through the UI
 * - A wrong answer displays Mistake Type, trap, fix instruction, and retest focus
 * - "Fix with Tutor" opens a seeded tutor session with mistake metadata
 * - Results page summarizes clinical judgment patterns using confidence-building language
 */

test.describe.configure({ mode: 'serial' });

const TEST_EMAIL = uniqueTestEmail('mistake-map');
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;

let testUserId: string | null = null;
let sessionId: string | null = null;

 test.afterAll(async () => {
  if (TEST_EMAIL) {
    await deleteUserByEmail(TEST_EMAIL);
  }
});

async function createAccessibleQuizUser() {
  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  expect(createError, `Failed to create test user: ${createError?.message}`).toBeNull();
  expect(createData?.user?.id).toBeTruthy();
  testUserId = createData!.user!.id;

  const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      quiz_first_enabled: true,
      default_entry_path: 'quiz',
      subscription_status: 'trialing',
      trial_ends_at: trialEnd,
      phi_acknowledged_at: new Date().toISOString(),
      program_level: 'BSN',
    })
    .eq('id', testUserId);

  expect(profileError, `Failed to update profile: ${profileError?.message}`).toBeNull();
}

async function seedKnownQuizQuestion() {
  expect(testUserId).toBeTruthy();

  const { data: session, error: sessionError } = await admin
    .from('quiz_sessions')
    .insert({
      user_id: testUserId,
      source_type: 'generic',
      nclex_category: 'Psychosocial Integrity',
      status: 'in_progress',
      score: 0,
      total_questions: 1,
      current_question_index: 0,
    })
    .select('id')
    .single();

  expect(sessionError, `Failed to seed quiz session: ${sessionError?.message}`).toBeNull();
  expect(session?.id).toBeTruthy();
  sessionId = session!.id;

  const { error: questionError } = await admin
    .from('quiz_questions')
    .insert({
      session_id: sessionId,
      question_index: 0,
      question_stem:
        'A client scheduled for a cardiac catheterization says, "I am scared something will go wrong." What is the nurse’s best response?',
      options: [
        { label: 'A', text: 'Provide detailed information about the procedure and possible complications.' },
        { label: 'B', text: 'Acknowledge the client’s feelings and ask what concerns them most.' },
        { label: 'C', text: 'Tell the client the procedure is common and the provider is experienced.' },
        { label: 'D', text: 'Document the statement and continue preparing the client for the procedure.' },
      ],
      correct_answer: 'B',
      rationale_correct:
        'Acknowledging the client’s fear and inviting specific concerns uses therapeutic communication and allows assessment before teaching.',
      rationale_incorrect: {
        A: 'Providing detailed information may be useful later, but it skips acknowledging the client’s anxiety first.',
        C: 'Reassurance can dismiss the client’s fear instead of assessing it.',
        D: 'Documentation alone does not address the client’s immediate emotional cue.',
      },
      nclex_category: 'Psychosocial Integrity',
      difficulty: 3,
      mistake_type: 'Therapeutic communication',
      reasoning_trap: 'You tried to educate before reducing anxiety.',
      fix_instruction: 'When emotion is the cue, acknowledge feelings before teaching, explaining, or reassuring.',
      retest_focus: 'therapeutic communication with anxious clients',
    });

  expect(questionError, `Failed to seed quiz question: ${questionError?.message}`).toBeNull();
}

async function login(page: any) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(TEST_EMAIL);
  await page.getByTestId('login-password').fill(TEST_PASSWORD);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(/\/quiz/, { timeout: 20_000 });
}

test('@smoke @regression missed question shows mistake map and opens fix tutor', async ({ page }) => {
  await createAccessibleQuizUser();
  await seedKnownQuizQuestion();

  await login(page);

  const resumeButton = page.getByRole('button', { name: /^Resume$/ });
  await expect(resumeButton).toBeVisible({ timeout: 15_000 });
  await resumeButton.click();

  await expect(page.getByText(/cardiac catheterization/i)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /^A\)/ }).click();
  await page.getByRole('button', { name: /Submit Answer/i }).click();

  await expect(page.getByText(/Missed this one/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Mistake Type: Therapeutic communication/i)).toBeVisible();
  await expect(page.getByText(/You tried to educate before reducing anxiety/i)).toBeVisible();
  await expect(page.getByText(/When emotion is the cue/i)).toBeVisible();
  await expect(page.getByText(/therapeutic communication with anxious clients/i)).toBeVisible();

  const fixButton = page.getByRole('button', { name: /Fix with Tutor/i });
  await expect(fixButton).toBeVisible();
  await fixButton.click();

  await page.waitForURL(/\/tutor\?sessionId=/, { timeout: 20_000 });
  await expect(page.getByText(/Mistake Type: Therapeutic communication/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/The trap:/i)).toBeVisible();
  await expect(page.getByText(/How to fix it:/i)).toBeVisible();
  await expect(page.getByText(/what made your answer feel right/i)).toBeVisible();

  const { data: chats, error: chatError } = await admin
    .from('chats')
    .select('id, title, metadata')
    .eq('user_id', testUserId)
    .eq('metadata->>source', 'quiz_fix_weakness')
    .order('created_at', { ascending: false })
    .limit(1);

  expect(chatError).toBeNull();
  expect(chats?.length).toBeGreaterThan(0);
  expect(chats![0].title).toContain('Therapeutic communication');
  expect(chats![0].metadata?.mistakeType).toBe('Therapeutic communication');
});

test('@smoke @regression quiz results summarizes clinical judgment pattern', async ({ page }) => {
  expect(sessionId).toBeTruthy();

  await login(page);
  await page.goto(`/quiz/results?sessionId=${sessionId}`);

  await expect(page.getByText(/Your Clinical Judgment Pattern/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Pattern to keep training/i)).toBeVisible();
  await expect(page.getByText(/Therapeutic communication/i).first()).toBeVisible();
  await expect(page.getByText(/Patterns to Train/i)).toBeVisible();
  await expect(page.getByText(/Questions to Review/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Train Pattern/i }).first()).toBeVisible();
});
