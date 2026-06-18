import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/entitlement';
import { buildQuizPrompt, buildGenericQuizPrompt, buildTargetedMistakePrompt, getCategoryForIndex, MISTAKE_TYPES } from '@/lib/ai/quiz-prompts';
import { z } from 'zod';
import OpenAI from 'openai';

export const maxDuration = 30;

const openaiEmbeddings = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const QUESTION_SELECT = 'id, session_id, question_index, question_stem, options, nclex_category, difficulty, answered_at, user_answer, mistake_type, reasoning_trap, fix_instruction, retest_focus, key_cue, why_correct_short, why_wrong_short, one_line_fix';
const QUESTION_PUBLIC_SELECT = 'id, session_id, question_index, question_stem, options, nclex_category, difficulty, mistake_type, reasoning_trap, fix_instruction, retest_focus, key_cue, why_correct_short, why_wrong_short, one_line_fix';

const MistakeTypeSchema = z.enum(MISTAKE_TYPES);

type MistakeType = z.infer<typeof MistakeTypeSchema>;

function fallbackMistakeType(category?: string | null): MistakeType {
  switch (category) {
    case 'Management of Care':
    case 'Priority Setting':
      return 'Priority-setting';
    case 'Safety and Infection Control':
      return 'Safety';
    case 'Delegation':
      return 'Delegation';
    case 'Pharmacological Therapies':
      return 'Medication reasoning';
    case 'Reduction of Risk Potential':
      return 'Lab / diagnostic interpretation';
    case 'Psychosocial Integrity':
      return 'Therapeutic communication';
    case 'Health Promotion and Maintenance':
      return 'Patient education';
    case 'Physiological Adaptation':
      return 'Assessment-first';
    default:
      return 'Pathophysiology / knowledge gap';
  }
}

function defaultReasoningTrap(mistakeType: MistakeType): string {
  switch (mistakeType) {
    case 'Priority-setting':
      return 'The tempting answer may help later, but it does not address the most immediate priority first.';
    case 'Safety':
      return 'The tempting answer may be reasonable, but it misses the action that protects the client from harm first.';
    case 'Assessment-first':
      return 'The tempting answer jumps to intervention before gathering the assessment data needed to act safely.';
    case 'Therapeutic communication':
      return 'The tempting answer gives information or reassurance before acknowledging the client’s concern.';
    case 'Delegation':
      return 'The tempting answer gives the wrong task to the wrong team member or misses RN accountability.';
    case 'Medication reasoning':
      return 'The tempting answer misses a medication safety cue, expected effect, contraindication, or adverse effect pattern.';
    case 'Lab / diagnostic interpretation':
      return 'The tempting answer misses the lab or diagnostic cue that changes the priority.';
    case 'Patient education':
      return 'The tempting answer misses what the patient must understand or do safely after teaching.';
    default:
      return 'The tempting answer reflects a knowledge gap that changes the clinical decision.';
  }
}

function defaultFixInstruction(mistakeType: MistakeType): string {
  switch (mistakeType) {
    case 'Priority-setting':
      return 'When two actions both seem appropriate, choose the one that addresses the most immediate threat first.';
    case 'Safety':
      return 'Before choosing an action, ask which option prevents harm or reduces risk right now.';
    case 'Assessment-first':
      return 'Use assessment-before-intervention unless the client is already in immediate danger.';
    case 'Therapeutic communication':
      return 'When emotion is the cue, acknowledge feelings before teaching, explaining, or reassuring.';
    case 'Delegation':
      return 'Match the task to scope of practice, stability of the client, and RN responsibility.';
    case 'Medication reasoning':
      return 'Before giving or evaluating a medication, check the safety cue, expected effect, and adverse-effect pattern.';
    case 'Lab / diagnostic interpretation':
      return 'Tie abnormal data to the clinical risk it creates, then choose the action that addresses that risk first.';
    case 'Patient education':
      return 'Focus teaching on the behavior that keeps the patient safe after discharge or self-care.';
    default:
      return 'Go back to the underlying concept, then connect it to the safest nursing action.';
  }
}

function normalizeMistakeMetadata(questionData: any, lockedCategory: string, forcedMistakeType?: string | null) {
  const forcedParsed = MistakeTypeSchema.safeParse(forcedMistakeType);
  const parsedMistakeType = MistakeTypeSchema.safeParse(questionData?.mistake_type);
  const mistakeType = forcedParsed.success
    ? forcedParsed.data
    : parsedMistakeType.success
      ? parsedMistakeType.data
      : fallbackMistakeType(lockedCategory);

  return {
    mistake_type: mistakeType,
    reasoning_trap:
      typeof questionData?.reasoning_trap === 'string' && questionData.reasoning_trap.trim().length > 0
        ? questionData.reasoning_trap.trim()
        : defaultReasoningTrap(mistakeType),
    fix_instruction:
      typeof questionData?.fix_instruction === 'string' && questionData.fix_instruction.trim().length > 0
        ? questionData.fix_instruction.trim()
        : defaultFixInstruction(mistakeType),
    retest_focus:
      typeof questionData?.retest_focus === 'string' && questionData.retest_focus.trim().length > 0
        ? questionData.retest_focus.trim()
        : `${mistakeType.toLowerCase()} practice`,
  };
}

function defaultKeyCue(mistakeType: MistakeType): string {
  switch (mistakeType) {
    case 'Priority-setting':
      return 'Look for the cue that tells you which problem needs attention right now, not later.';
    case 'Safety':
      return 'Identify the finding that puts the patient at immediate risk of harm.';
    case 'Assessment-first':
      return 'Notice when a change in condition has an unclear cause — that signals you need more data before acting.';
    case 'Therapeutic communication':
      return 'Recognize when the patient is expressing an emotion or concern that needs acknowledgment first.';
    case 'Delegation':
      return 'Identify the task complexity and patient stability cues that determine who can safely perform the action.';
    case 'Medication reasoning':
      return 'Find the medication-related cue — a lab value, symptom, or timing detail — that changes what the nurse should do.';
    case 'Lab / diagnostic interpretation':
      return 'Spot the abnormal value or diagnostic finding that shifts the clinical priority.';
    case 'Patient education':
      return 'Identify what the patient must understand to stay safe after discharge or during self-care.';
    default:
      return 'Find the clinical detail in the scenario that changes the nursing priority.';
  }
}

function defaultWhyCorrectShort(mistakeType: MistakeType): string {
  switch (mistakeType) {
    case 'Priority-setting':
      return 'This answer addresses the most time-sensitive or life-threatening concern before handling secondary needs.';
    case 'Safety':
      return 'This answer removes or reduces the immediate threat to patient safety before other interventions.';
    case 'Assessment-first':
      return 'This answer gathers the critical data needed to determine the right intervention, preventing a wrong or premature action.';
    case 'Therapeutic communication':
      return 'This answer acknowledges the patient\'s feelings first, which builds trust and opens the door to effective teaching.';
    case 'Delegation':
      return 'This answer matches the task to the right team member based on scope of practice and patient stability.';
    case 'Medication reasoning':
      return 'This answer responds to the medication-safety cue correctly — whether holding, administering, or reassessing based on the data.';
    case 'Lab / diagnostic interpretation':
      return 'This answer connects the abnormal finding to the clinical action that prevents deterioration.';
    case 'Patient education':
      return 'This answer teaches the behavior that keeps the patient safest in their specific situation.';
    default:
      return 'This answer applies the correct clinical reasoning to the specific scenario presented.';
  }
}

// Patterns that indicate generic/pattern-level output rather than scenario-specific coaching
const GENERIC_PATTERNS = [
  'the nurse needs one more assessment cue',
  'the correct answer gathers the priority data',
  'the correct answer addresses the most',
  'this answer addresses the most urgent',
  'this answer addresses the most important',
  'the tempting answer helps later',
  'the tempting answer jumps to intervention',
  'there is a change in condition',
  'the client has a new immediate',
  'assessment before intervention',
  'when two answers sound right',
];

function isGenericFeedback(text: string): boolean {
  const lower = text.toLowerCase();
  return GENERIC_PATTERNS.some(pattern => lower.includes(pattern));
}

function normalizeMicroFeedback(questionData: any, mistakeType: string, lockedCategory: string) {
  const resolvedType: MistakeType = MistakeTypeSchema.safeParse(mistakeType).success
    ? mistakeType as MistakeType
    : fallbackMistakeType(lockedCategory);

  // Accept AI output only if non-empty AND not generic pattern-level text
  const keyCue = typeof questionData?.key_cue === 'string' && questionData.key_cue.trim().length > 0
    && !isGenericFeedback(questionData.key_cue)
    ? questionData.key_cue.trim()
    : defaultKeyCue(resolvedType);
  const whyCorrectShort = typeof questionData?.why_correct_short === 'string' && questionData.why_correct_short.trim().length > 0
    && !isGenericFeedback(questionData.why_correct_short)
    ? questionData.why_correct_short.trim()
    : defaultWhyCorrectShort(resolvedType);
  const whyWrongShort = typeof questionData?.why_wrong_short === 'string' && questionData.why_wrong_short.trim().length > 0
    && !isGenericFeedback(questionData.why_wrong_short)
    ? questionData.why_wrong_short.trim()
    : defaultReasoningTrap(resolvedType);
  const oneLineFix = typeof questionData?.one_line_fix === 'string' && questionData.one_line_fix.trim().length > 0
    && !isGenericFeedback(questionData.one_line_fix)
    ? questionData.one_line_fix.trim()
    : defaultFixInstruction(resolvedType);

  return {
    key_cue: keyCue,
    why_correct_short: whyCorrectShort,
    why_wrong_short: whyWrongShort,
    one_line_fix: oneLineFix,
  };
}

const QuizQuestionSchema = z.object({
  question_stem: z.string().min(10),
  options: z.array(z.object({
    label: z.enum(['A', 'B', 'C', 'D']),
    text: z.string().min(1),
  })).length(4),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  rationale_correct: z.string().min(10),
  rationale_incorrect: z.record(z.string(), z.string()).optional(),
  nclex_category: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(5).default(3),
  mistake_type: MistakeTypeSchema.optional(),
  reasoning_trap: z.string().min(10).optional(),
  fix_instruction: z.string().min(10).optional(),
  retest_focus: z.string().min(3).optional(),
  key_cue: z.string().min(5).optional(),
  why_correct_short: z.string().min(5).optional(),
  why_wrong_short: z.string().min(5).optional(),
  one_line_fix: z.string().min(5).optional(),
});

function extractJsonObject(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

function normalizeGeneratedQuestion(raw: any, finalCategory: string, forcedMistakeType?: string | null) {
  const parsed = QuizQuestionSchema.parse(raw);
  const labels = ['A', 'B', 'C', 'D'] as const;
  const optionMap = new Map<string, string>();

  for (const option of parsed.options) {
    optionMap.set(option.label, option.text);
  }

  const options = labels.map((label, index) => ({
    label,
    text: optionMap.get(label) || parsed.options[index]?.text || `Option ${label}`,
  }));

  const rationaleIncorrect: Record<string, string> = {};
  for (const label of labels) {
    if (label === parsed.correct_answer) continue;
    const existing = parsed.rationale_incorrect?.[label];
    rationaleIncorrect[label] = typeof existing === 'string' && existing.trim().length > 0
      ? existing.trim()
      : 'This answer may sound reasonable, but it misses the highest-priority clinical cue in the question.';
  }

  const forcedParsed = MistakeTypeSchema.safeParse(forcedMistakeType);

  return {
    ...parsed,
    options,
    rationale_incorrect: rationaleIncorrect,
    nclex_category: parsed.nclex_category || finalCategory,
    mistake_type: forcedParsed.success ? forcedParsed.data : parsed.mistake_type,
  };
}

function buildSafeFallbackQuestion(finalCategory: string, forcedMistakeType?: string | null, questionIndex = 0) {
  const forcedParsed = MistakeTypeSchema.safeParse(forcedMistakeType);
  const mistakeType = forcedParsed.success ? forcedParsed.data : fallbackMistakeType(finalCategory);
  const index = Math.abs(Number(questionIndex) || 0) % 3;

  const base = {
    nclex_category: finalCategory,
    difficulty: 3,
    mistake_type: mistakeType,
    reasoning_trap: defaultReasoningTrap(mistakeType),
    fix_instruction: defaultFixInstruction(mistakeType),
    retest_focus: `${mistakeType.toLowerCase()} practice`,
    key_cue: 'The nurse needs one more assessment cue before choosing an intervention.',
    why_correct_short: 'The correct answer gathers the priority data needed to act safely.',
    why_wrong_short: 'The tempting answer jumps to a reasonable intervention before assessment is complete.',
    one_line_fix: defaultFixInstruction(mistakeType),
  };

  const assessmentFirstQuestions = [
    {
      question_stem: 'A nurse is caring for a client who reports new shortness of breath while lying in bed. The client is awake and speaking in short phrases. Which action should the nurse take first?',
      options: [
        { label: 'A', text: 'Assess the client’s oxygen saturation and lung sounds.' },
        { label: 'B', text: 'Call the health care provider to report the change.' },
        { label: 'C', text: 'Teach the client to use pursed-lip breathing.' },
        { label: 'D', text: 'Review the client’s most recent medication list.' },
      ],
      correct_answer: 'A',
      rationale_correct: 'The nurse should assess first to determine the severity and likely cause of the new respiratory change. Oxygen saturation and lung sounds provide immediate data needed to choose a safe next action.',
      rationale_incorrect: {
        B: 'Calling the provider may be needed later, but the nurse first needs assessment data to report and to determine urgency.',
        C: 'Breathing techniques may help, but teaching is not the first priority when the client has a new respiratory change.',
        D: 'Medication review may be relevant later, but it does not address the immediate need to assess breathing status.',
      },
    },
    {
      question_stem: 'A nurse is caring for a postoperative client who reports increasing abdominal pain 2 hours after surgery. The client is pale and restless. Which action should the nurse take first?',
      options: [
        { label: 'A', text: 'Check the client’s blood pressure, heart rate, and surgical dressing.' },
        { label: 'B', text: 'Administer the prescribed opioid pain medication.' },
        { label: 'C', text: 'Help the client reposition and apply a warm blanket.' },
        { label: 'D', text: 'Document that the client is having expected postoperative pain.' },
      ],
      correct_answer: 'A',
      rationale_correct: 'Pallor, restlessness, and increasing pain after surgery can signal bleeding or clinical deterioration. The nurse must assess vital signs and the dressing before treating the symptom as routine pain.',
      rationale_incorrect: {
        B: 'Pain medication may be appropriate later, but giving it before assessment can mask signs of deterioration.',
        C: 'Comfort measures do not address the possible urgent postoperative complication.',
        D: 'Documentation is needed after assessment and intervention, not before determining what is happening.',
      },
    },
    {
      question_stem: 'A nurse is caring for a client with diabetes who says, “I feel shaky and weird.” The client is alert but diaphoretic. Which action should the nurse take first?',
      options: [
        { label: 'A', text: 'Check the client’s capillary blood glucose level.' },
        { label: 'B', text: 'Give the client a full meal tray.' },
        { label: 'C', text: 'Notify the provider of possible hypoglycemia.' },
        { label: 'D', text: 'Review the client’s insulin administration record.' },
      ],
      correct_answer: 'A',
      rationale_correct: 'Shakiness and diaphoresis suggest possible hypoglycemia, but the nurse should confirm the blood glucose before choosing the next intervention. This assessment guides whether rapid carbohydrates or another action is needed.',
      rationale_incorrect: {
        B: 'Food may be needed, but the nurse should first confirm the blood glucose and determine urgency.',
        C: 'The provider may need to be notified if the client does not respond, but immediate bedside assessment comes first.',
        D: 'Reviewing insulin history is useful later, but it does not address the client’s current symptoms first.',
      },
    },
  ];

  if (mistakeType === 'Assessment-first') {
    return {
      ...base,
      ...assessmentFirstQuestions[index],
    };
  }

  const genericQuestions = [
    {
      question_stem: 'A nurse is caring for a client with a new change in condition during a busy shift. Several actions seem appropriate. Which action should the nurse take first?',
      options: [
        { label: 'A', text: 'Collect focused assessment data related to the new change.' },
        { label: 'B', text: 'Document the change in the client’s medical record.' },
        { label: 'C', text: 'Delegate routine care to assistive personnel.' },
        { label: 'D', text: 'Review teaching materials with the client and family.' },
      ],
      correct_answer: 'A',
      rationale_correct: 'A new change in condition requires focused assessment before the nurse can choose the safest intervention. Assessment identifies the priority cue and prevents premature action.',
      rationale_incorrect: {
        B: 'Documentation is important after assessment and intervention, but it is not the first action for a new change in condition.',
        C: 'Delegation may help manage workload, but it does not address the client’s new clinical change first.',
        D: 'Teaching is useful when the client is stable, but a new condition change requires assessment first.',
      },
    },
    {
      question_stem: 'A nurse receives reports on four clients at the start of shift. Which client should the nurse assess first?',
      options: [
        { label: 'A', text: 'A client with pneumonia who is newly confused and has increased work of breathing.' },
        { label: 'B', text: 'A client with a sprained ankle requesting pain medication.' },
        { label: 'C', text: 'A client scheduled for discharge who needs medication teaching.' },
        { label: 'D', text: 'A client with stable hypertension waiting for a routine blood pressure recheck.' },
      ],
      correct_answer: 'A',
      rationale_correct: 'New confusion with increased work of breathing suggests possible hypoxia or deterioration. This client has the most immediate airway/breathing risk and should be assessed first.',
      rationale_incorrect: {
        B: 'Pain should be addressed, but it is not more urgent than a possible oxygenation problem.',
        C: 'Discharge teaching can wait until urgent clinical changes are assessed.',
        D: 'Routine monitoring for a stable client is not the priority over new respiratory deterioration.',
      },
    },
    {
      question_stem: 'A nurse is preparing morning care for several clients. Which task is most appropriate for the nurse to delegate to assistive personnel?',
      options: [
        { label: 'A', text: 'Obtain a stable client’s routine vital signs.' },
        { label: 'B', text: 'Teach a client how to use an incentive spirometer.' },
        { label: 'C', text: 'Assess a client reporting new chest pressure.' },
        { label: 'D', text: 'Evaluate whether pain medication was effective.' },
      ],
      correct_answer: 'A',
      rationale_correct: 'Obtaining routine vital signs for a stable client is within the role of assistive personnel. Teaching, assessment, and evaluation require nursing judgment and should not be delegated.',
      rationale_incorrect: {
        B: 'Teaching requires nursing knowledge and cannot be delegated to assistive personnel.',
        C: 'New chest pressure requires nursing assessment and possible urgent intervention.',
        D: 'Evaluation of medication effectiveness is a nursing responsibility.',
      },
    },
  ];

  return {
    ...base,
    ...genericQuestions[index],
  };
}

async function fetchExistingPublicQuestion(supabase: any, sessionId: string, questionIndex: number) {
  const { data } = await supabase
    .from('quiz_questions')
    .select(QUESTION_PUBLIC_SELECT)
    .eq('session_id', sessionId)
    .eq('question_index', questionIndex)
    .maybeSingle();

  return data ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entitlement = await getEntitlementForUser(user.id);
    if (!entitlement.hasAccess) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 });
    }

    const body = await req.json();
    const { sessionId, questionIndex, sourceType, category } = body;

    if (!sessionId || questionIndex === undefined || !sourceType) {
      return NextResponse.json({ error: 'Missing required fields: sessionId, questionIndex, sourceType' }, { status: 400 });
    }

    const numericQuestionIndex = Number(questionIndex);
    if (!Number.isInteger(numericQuestionIndex) || numericQuestionIndex < 0) {
      return NextResponse.json({ error: 'Invalid questionIndex' }, { status: 400 });
    }

    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: 'Session is not in progress' }, { status: 400 });
    }

    const intendedTotal = Number(session.total_questions) || 0;
    if (intendedTotal > 0 && numericQuestionIndex >= intendedTotal) {
      return NextResponse.json({ error: 'Question index is outside this session total' }, { status: 400 });
    }

    const selectedCategory = category || session.nclex_category || null;
    const isTargetedDrill = session.quiz_mode === 'targeted_drill' && session.target_mistake_type;
    const lockedCategory = isTargetedDrill ? null : getCategoryForIndex(numericQuestionIndex, selectedCategory);

    const { data: existingQuestion } = await supabase
      .from('quiz_questions')
      .select(QUESTION_SELECT)
      .eq('session_id', sessionId)
      .eq('question_index', numericQuestionIndex)
      .maybeSingle();

    if (existingQuestion && !existingQuestion.answered_at && !existingQuestion.user_answer) {
      return NextResponse.json({
        question: {
          id: existingQuestion.id,
          session_id: existingQuestion.session_id,
          question_index: existingQuestion.question_index,
          question_stem: existingQuestion.question_stem,
          options: existingQuestion.options,
          nclex_category: existingQuestion.nclex_category,
          difficulty: existingQuestion.difficulty,
          mistake_type: existingQuestion.mistake_type,
          reasoning_trap: existingQuestion.reasoning_trap,
          fix_instruction: existingQuestion.fix_instruction,
          retest_focus: existingQuestion.retest_focus,
          key_cue: existingQuestion.key_cue,
          why_correct_short: existingQuestion.why_correct_short,
          why_wrong_short: existingQuestion.why_wrong_short,
          one_line_fix: existingQuestion.one_line_fix,
        },
        resumed: true,
      });
    }

    if (existingQuestion && existingQuestion.answered_at) {
      return NextResponse.json({ error: 'Question already answered' }, { status: 409 });
    }

    let programLevel: 'LPN' | 'ADN' | 'BSN' | 'MSN' = 'ADN';
    const { data: profile } = await supabase
      .from('profiles')
      .select('program_level')
      .eq('id', user.id)
      .single();
    if (profile?.program_level) {
      programLevel = profile.program_level as 'LPN' | 'ADN' | 'BSN' | 'MSN';
    }

    const { data: prevQuestions } = await supabase
      .from('quiz_questions')
      .select('question_stem')
      .eq('session_id', sessionId);

    const { data: recentUserQuestions } = await supabase
      .from('quiz_questions')
      .select('question_stem, created_at, quiz_sessions!inner(user_id)')
      .eq('quiz_sessions.user_id', user.id)
      .neq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(50);

    const dedupeStemSet = new Set<string>();
    for (const question of [...(prevQuestions ?? []), ...(recentUserQuestions ?? [])]) {
      const stem = (question as any)?.question_stem;
      if (typeof stem === 'string' && stem.trim().length > 0) {
        dedupeStemSet.add(stem.trim());
      }
    }
    const previousStems = Array.from(dedupeStemSet).slice(0, 50);

    let prompt: string;
    let sourceChunkText: string | null = null;
    let sourceDocId: string | null = null;

    if (isTargetedDrill) {
      prompt = buildTargetedMistakePrompt(programLevel, session.target_mistake_type, session.target_focus || null, previousStems);
    } else if (sourceType === 'document') {
      const ragQuery = `NCLEX nursing question about clinical concepts`;
      try {
        const embeddingResponse = await openaiEmbeddings.embeddings.create({
          model: 'text-embedding-3-small',
          input: ragQuery,
        });
        const queryEmbedding = embeddingResponse.data?.[0]?.embedding;
        if (queryEmbedding) {
          const rpcParams: any = {
            query_embedding: queryEmbedding,
            match_threshold: 0.3,
            match_count: 5,
            user_id_filter: user.id,
            filter_active: true,
          };

          const { data: matchedChunks } = await supabase.rpc('match_documents', rpcParams);

          if (matchedChunks && matchedChunks.length > 0) {
            const chunkIndex = numericQuestionIndex % matchedChunks.length;
            const chunk = matchedChunks[chunkIndex];
            sourceChunkText = chunk.content || '';
            sourceDocId = chunk.id || null;
          }
        }
      } catch (ragError) {
        console.error('[Quiz Generate] RAG error, falling back to generic:', ragError);
      }

      if (sourceChunkText && !selectedCategory) {
        prompt = buildQuizPrompt(programLevel, sourceChunkText, previousStems);
      } else {
        prompt = buildGenericQuizPrompt(programLevel, lockedCategory!, previousStems);
      }
    } else {
      prompt = buildGenericQuizPrompt(programLevel, lockedCategory!, previousStems);
    }

    let questionData;
    let retries = 0;
    const maxRetries = 2;
    const finalCategoryHint = lockedCategory || session.nclex_category || 'Physiological Adaptation';

    while (retries <= maxRetries) {
      try {
        const retryHint = retries > 0
          ? '\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY one JSON object. Use exactly four options labeled A, B, C, and D. Include correct_answer, rationale_correct, rationale_incorrect, nclex_category, difficulty, and the clinical judgment metadata fields.'
          : '';

        const { text } = await generateText({
          model: anthropic('claude-sonnet-4-20250514') as any,
          maxTokens: 1800,
          prompt: prompt + retryHint,
        });

        const rawQuestion = extractJsonObject(text);
        questionData = normalizeGeneratedQuestion(rawQuestion, finalCategoryHint, isTargetedDrill ? session.target_mistake_type : null);
        if (!isTargetedDrill && lockedCategory) {
          questionData.nclex_category = lockedCategory;
        }
        break;
      } catch (parseError) {
        retries++;
        if (retries > maxRetries) {
          console.error('[Quiz Generate] Failed to parse Claude response after retries; using safe fallback:', parseError);
          questionData = buildSafeFallbackQuestion(finalCategoryHint, isTargetedDrill ? session.target_mistake_type : null, numericQuestionIndex);
          sourceChunkText = null;
          sourceDocId = null;
          break;
        }
      }
    }

    const finalCategory = questionData!.nclex_category || lockedCategory || 'Pharmacological Therapies';
    const mistakeMetadata = normalizeMistakeMetadata(questionData, finalCategory, isTargetedDrill ? session.target_mistake_type : null);
    const microFeedback = normalizeMicroFeedback(questionData, mistakeMetadata.mistake_type, finalCategory);

    const { data: question, error: insertError } = await supabase
      .from('quiz_questions')
      .insert({
        session_id: sessionId,
        question_index: numericQuestionIndex,
        question_stem: questionData!.question_stem,
        options: questionData!.options,
        correct_answer: questionData!.correct_answer,
        rationale_correct: questionData!.rationale_correct,
        rationale_incorrect: questionData!.rationale_incorrect,
        nclex_category: finalCategory,
        difficulty: questionData!.difficulty,
        source_doc_id: sourceDocId,
        source_chunk_text: sourceChunkText,
        ...mistakeMetadata,
        ...microFeedback,
      })
      .select(QUESTION_PUBLIC_SELECT)
      .single();

    if (insertError) {
      console.warn('[Quiz Generate] Insert failed; checking for existing generated question', insertError);
      const fallbackQuestion = await fetchExistingPublicQuestion(supabase, sessionId, numericQuestionIndex);
      if (fallbackQuestion) {
        return NextResponse.json({ question: fallbackQuestion, resumed: true, recovered: true });
      }
      return NextResponse.json({ error: 'Failed to save question' }, { status: 500 });
    }

    return NextResponse.json({ question });
  } catch (error: any) {
    if (error?.status === 429) {
      const retryAfter = error?.headers?.['retry-after'] || 5;
      return NextResponse.json(
        { error: 'Rate limited. Please try again shortly.', retryAfter },
        { status: 429 }
      );
    }
    console.error('[Quiz Generate] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
