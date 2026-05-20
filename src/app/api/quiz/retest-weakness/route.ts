import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/entitlement';
import { MISTAKE_TYPES } from '@/lib/ai/quiz-prompts';

export const maxDuration = 30;

const MistakeTypeSchema = z.enum(MISTAKE_TYPES);

type MistakeType = z.infer<typeof MistakeTypeSchema>;
type ProgramLevel = 'LPN' | 'ADN' | 'BSN' | 'MSN';

const QuizQuestionSchema = z.object({
  question_stem: z.string().min(10),
  options: z.array(z.object({
    label: z.enum(['A', 'B', 'C', 'D']),
    text: z.string().min(1),
  })).length(4),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  rationale_correct: z.string().min(10),
  rationale_incorrect: z.record(z.enum(['A', 'B', 'C', 'D']), z.string()),
  nclex_category: z.string(),
  difficulty: z.number().int().min(1).max(5),
  mistake_type: MistakeTypeSchema.optional(),
  reasoning_trap: z.string().min(10).optional(),
  fix_instruction: z.string().min(10).optional(),
  retest_focus: z.string().min(3).optional(),
});

const PROGRAM_BLOCKS: Record<ProgramLevel, string> = {
  LPN: 'Generate at the LPN/LVN level. Focus on safety, basic assessment, and task-based clinical reasoning.',
  ADN: 'Generate at the ADN level. Focus on acute care prioritization, delegation basics, medication safety, and NCLEX-RN reasoning.',
  BSN: 'Generate at the BSN level. Include clinical judgment, patient education, leadership basics, and full NCLEX-RN reasoning depth.',
  MSN: 'Generate at the MSN/graduate level. Advanced clinical decision-making is appropriate, but keep the item nurse-focused unless the source context requires provider-level reasoning.',
};

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
      return 'The tempting answer misses a medication safety cue, expected effect, contraindication, or adverse-effect pattern.';
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

function normalizeMistakeMetadata(questionData: any, sourceMistakeType: MistakeType, sourceRetestFocus: string) {
  const parsedMistakeType = MistakeTypeSchema.safeParse(questionData?.mistake_type);
  const mistakeType = parsedMistakeType.success ? parsedMistakeType.data : sourceMistakeType;

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
        : sourceRetestFocus,
  };
}

function buildRetestPrompt(args: {
  programLevel: ProgramLevel;
  category: string;
  mistakeType: MistakeType;
  retestFocus: string;
  originalStem: string;
  originalUserAnswer: string | null;
  originalCorrectAnswer: string;
  originalReasoningTrap: string;
  originalFixInstruction: string;
  previousStems: string[];
}) {
  return `<identity>
You are ForgeNursing Retest Generator. You create targeted NCLEX-style multiple-choice questions that help nursing students practice the SAME clinical judgment weakness they just missed, without reusing the same scenario.
</identity>

<program_level>
${PROGRAM_BLOCKS[args.programLevel] ?? PROGRAM_BLOCKS.ADN}
</program_level>

<target_weakness>
NCLEX CATEGORY: ${args.category}
MISTAKE TYPE: ${args.mistakeType}
RETEST FOCUS: ${args.retestFocus}
ORIGINAL REASONING TRAP: ${args.originalReasoningTrap}
ORIGINAL FIX INSTRUCTION: ${args.originalFixInstruction}
</target_weakness>

<original_question_do_not_repeat>
${args.originalStem}
Student chose: ${args.originalUserAnswer || 'unknown'}
Correct answer: ${args.originalCorrectAnswer}
</original_question_do_not_repeat>

<blocked_recent_questions>
Do NOT repeat or closely paraphrase any of these stems. Use a new patient scenario, new clinical details, and a new surface context while testing the same judgment weakness.
${JSON.stringify(args.previousStems.slice(0, 50))}
</blocked_recent_questions>

<instructions>
Generate exactly ONE NCLEX-style multiple-choice question.
- The question must target the same MISTAKE TYPE and RETEST FOCUS.
- Use a different scenario than the original missed question.
- Provide exactly 4 answer choices labeled A-D.
- Exactly one answer is correct.
- Distractors should be plausible and should reveal the same kind of thinking trap.
- The correct answer should require the same clinical judgment move described in the fix instruction.
- Avoid "all of the above," "none of the above," and negative stems unless safety requires it.
- Keep the question appropriate to the student's program level.
</instructions>

<output_format>
Respond with ONLY valid JSON. No markdown, no preamble.
{
  "question_stem": "...",
  "options": [
    {"label": "A", "text": "..."},
    {"label": "B", "text": "..."},
    {"label": "C", "text": "..."},
    {"label": "D", "text": "..."}
  ],
  "correct_answer": "C",
  "rationale_correct": "...",
  "rationale_incorrect": {
    "A": "...",
    "B": "...",
    "C": "...",
    "D": "..."
  },
  "nclex_category": "${args.category}",
  "difficulty": 3,
  "mistake_type": "${args.mistakeType}",
  "reasoning_trap": "...",
  "fix_instruction": "...",
  "retest_focus": "${args.retestFocus}"
}
</output_format>`;
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

    const body = await req.json().catch(() => ({}));
    const { quizSessionId, questionId } = body as {
      quizSessionId?: string;
      questionId?: string;
    };

    if (!quizSessionId || !questionId) {
      return NextResponse.json({ error: 'Missing required fields: quizSessionId, questionId' }, { status: 400 });
    }

    const { data: sourceQuestion, error: sourceError } = await supabase
      .from('quiz_questions')
      .select('id, session_id, question_stem, correct_answer, user_answer, nclex_category, mistake_type, reasoning_trap, fix_instruction, retest_focus, quiz_sessions!inner(id, user_id, source_type, nclex_category)')
      .eq('id', questionId)
      .eq('session_id', quizSessionId)
      .single();

    if (sourceError || !sourceQuestion) {
      return NextResponse.json({ error: 'Source question not found' }, { status: 404 });
    }

    const sourceSession = Array.isArray(sourceQuestion.quiz_sessions)
      ? sourceQuestion.quiz_sessions[0]
      : sourceQuestion.quiz_sessions;

    if (!sourceSession || sourceSession.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const category = sourceQuestion.nclex_category || sourceSession.nclex_category || 'Priority Setting';
    const parsedMistakeType = MistakeTypeSchema.safeParse(sourceQuestion.mistake_type);
    const mistakeType = parsedMistakeType.success ? parsedMistakeType.data : fallbackMistakeType(category);
    const retestFocus = sourceQuestion.retest_focus || `${mistakeType.toLowerCase()} practice`;
    const reasoningTrap = sourceQuestion.reasoning_trap || defaultReasoningTrap(mistakeType);
    const fixInstruction = sourceQuestion.fix_instruction || defaultFixInstruction(mistakeType);

    let programLevel: ProgramLevel = 'ADN';
    const { data: profile } = await supabase
      .from('profiles')
      .select('program_level')
      .eq('id', user.id)
      .single();
    if (profile?.program_level && ['LPN', 'ADN', 'BSN', 'MSN'].includes(profile.program_level)) {
      programLevel = profile.program_level as ProgramLevel;
    }

    const { data: recentQuestions } = await supabase
      .from('quiz_questions')
      .select('question_stem, created_at, quiz_sessions!inner(user_id)')
      .eq('quiz_sessions.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const previousStems = Array.from(new Set((recentQuestions ?? [])
      .map((question: any) => question.question_stem)
      .filter((stem: any) => typeof stem === 'string' && stem.trim().length > 0)
      .map((stem: string) => stem.trim())));

    const prompt = buildRetestPrompt({
      programLevel,
      category,
      mistakeType,
      retestFocus,
      originalStem: sourceQuestion.question_stem,
      originalUserAnswer: sourceQuestion.user_answer,
      originalCorrectAnswer: sourceQuestion.correct_answer,
      originalReasoningTrap: reasoningTrap,
      originalFixInstruction: fixInstruction,
      previousStems,
    });

    let questionData;
    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        const retryHint = retries > 0
          ? '\n\nIMPORTANT: Your previous response was not valid JSON. Please respond with ONLY the JSON object, no markdown fences, no explanation.'
          : '';

        const { text } = await generateText({
          model: anthropic('claude-sonnet-4-20250514') as any,
          maxTokens: 1200,
          prompt: prompt + retryHint,
        });

        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();

        questionData = QuizQuestionSchema.parse(JSON.parse(cleaned));
        questionData.nclex_category = category;
        break;
      } catch (parseError) {
        retries++;
        if (retries > maxRetries) {
          console.error('[Retest Weakness] Failed to parse model response:', parseError);
          return NextResponse.json({ error: 'Failed to generate retest question. Please try again.' }, { status: 500 });
        }
      }
    }

    const mistakeMetadata = normalizeMistakeMetadata(questionData, mistakeType, retestFocus);

    const { data: retestSession, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: user.id,
        source_type: 'generic',
        nclex_category: category,
        status: 'in_progress',
        score: 0,
        total_questions: 1,
        current_question_index: 0,
      })
      .select()
      .single();

    if (sessionError || !retestSession) {
      console.error('[Retest Weakness] Session insert error:', sessionError);
      return NextResponse.json({ error: 'Failed to create retest session' }, { status: 500 });
    }

    const { data: retestQuestion, error: questionError } = await supabase
      .from('quiz_questions')
      .insert({
        session_id: retestSession.id,
        question_index: 0,
        question_stem: questionData!.question_stem,
        options: questionData!.options,
        correct_answer: questionData!.correct_answer,
        rationale_correct: questionData!.rationale_correct,
        rationale_incorrect: questionData!.rationale_incorrect,
        nclex_category: category,
        difficulty: questionData!.difficulty,
        ...mistakeMetadata,
      })
      .select('id, session_id, question_index, question_stem, options, nclex_category, difficulty, mistake_type, reasoning_trap, fix_instruction, retest_focus')
      .single();

    if (questionError || !retestQuestion) {
      console.error('[Retest Weakness] Question insert error:', questionError);
      return NextResponse.json({ error: 'Failed to save retest question' }, { status: 500 });
    }

    return NextResponse.json({
      session: retestSession,
      question: retestQuestion,
      mistake_type: mistakeMetadata.mistake_type,
      retest_focus: mistakeMetadata.retest_focus,
    });
  } catch (error: any) {
    if (error?.status === 429) {
      const retryAfter = error?.headers?.['retry-after'] || 5;
      return NextResponse.json({ error: 'Rate limited. Please try again shortly.', retryAfter }, { status: 429 });
    }
    console.error('[Retest Weakness] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
