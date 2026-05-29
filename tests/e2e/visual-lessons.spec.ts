import { test, expect } from '@playwright/test';
import { admin, deleteUserByEmail } from './helpers/supabase';
import { uniqueTestEmail } from './helpers/users';

/**
 * SMOKE TEST — Visual Lessons / Show Me Visually
 * @smoke @regression
 *
 * Verifies the Visual Lessons v0.1 loop:
 * - A missed question shows the Show Me Visually button
 * - The button opens a visual lesson modal
 * - A fallback lesson can match by mistake type
 * - Step cards and check question render
 */

test.describe.configure({ mode: 'serial' });

const TEST_EMAIL = uniqueTestEmail('visual-lessons');
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

async function seedVisualFallbackLesson() {
  const { error } = await admin
    .from('visual_lessons')
    .upsert(
      {
        title: 'Therapeutic communication: respond to the feeling first',
        concept: 'fallback therapeutic communication reasoning',
        mistake_type: 'Therapeutic communication',
        nclex_category: null,
        trigger_keywords: ['therapeutic', 'communication', 'anxiety', 'fear', 'feelings', 'acknowledge'],
        lesson_steps: [
          { title: 'The cue', body: 'The client expresses fear, worry, anger, grief, or confusion.' },
          { title: 'What is happening', body: 'The emotional cue needs to be acknowledged before teaching or reassurance.' },
          { title: 'Why it matters', body: 'Jumping to facts too soon can shut down communication.' },
          { title: 'Nursing move', body: 'Choose the response that invites the client to say more and validates the concern.' },
        ],
        check_question: {
          stem: 'What should the nurse usually do first when emotion is the cue?',
          options: ['Acknowledge the feeling', 'Give a long explanation', 'Change the subject', 'Offer false reassurance'],
          correct: 'Acknowledge the feeling',
          explanation: 'Therapeutic communication starts by acknowledging the client’s feeling or concern.',
        },
        is_active: true,
      },
      { onConflict: 'concept' }
    );

  expect(error, `Failed to seed visual lesson: ${error?.message}`).toBeNull();
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
      key_cue: 'The client is expressing fear before the procedure.',
      why_correct_short: 'Acknowledging the fear keeps communication open before teaching.',
      why_wrong_short: 'Teaching feels helpful, but it skips the emotional cue.',
      one_line_fix: 'When emotion is the cue, respond to the feeling before giving facts.',
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

test('@smoke @regression missed question opens Show Me Visually lesson', async ({ page }) => {
  await createAccessibleQuizUser();
  await seedVisualFallbackLesson();
  await seedKnownQuizQuestion();

  await login(page);

  const resumeButton = page.getByRole('button', { name: /^Resume$/ });
  await expect(resumeButton).toBeVisible({ timeout: 15_000 });
  await resumeButton.click();

  await expect(page.getByText(/cardiac catheterization/i)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /^A\)/ }).click();
  await page.getByRole('button', { name: /Submit Answer/i }).click();

  await expect(page.getByText(/Missed this one/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /Show Me Visually/i })).toBeVisible();

  await page.getByRole('button', { name: /Show Me Visually/i }).click();

  await expect(page.getByText(/Show Me Visually/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/respond to the feeling first/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/The cue/i)).toBeVisible();
  await expect(page.getByText(/The client expresses fear/i)).toBeVisible();
  await expect(page.getByText(/Check yourself/i)).toBeVisible();

  await page.getByRole('button', { name: /^Acknowledge the feeling$/ }).click();
  await expect(page.getByText(/Therapeutic communication starts/i)).toBeVisible();

  await expect(page.getByRole('button', { name: /Got it — Retest this pattern/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ask Tutor about this/i })).toBeVisible();
});
