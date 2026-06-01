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

function normalizeMicroFeedback(questionData: any, mistakeType: string, lockedCategory: string) {
  const keyCue = typeof questionData?.key_cue === 'string' && questionData.key_cue.trim().length > 0
    ? questionData.key_cue.trim()
    : 'Find the clinical cue that changes what the nurse should do first.';
  const whyCorrectShort = typeof questionData?.why_correct_short === 'string' && questionData.why_correct_short.trim().length > 0
    ? questionData.why_correct_short.trim()
    : 'The correct answer addresses the most important clinical cue in the question.';
  const whyWrongShort = typeof questionData?.why_wrong_short === 'string' && questionData.why_wrong_short.trim().length > 0
    ? questionData.why_wrong_short.trim()
    : defaultReasoningTrap(MistakeTypeSchema.safeParse(mistakeType).success ? mistakeType as MistakeType : fallbackMistakeType(lockedCategory));
  const oneLineFix = typeof questionData?.one_line_fix === 'string' && questionData.one_line_fix.trim().length > 0
    ? questionData.one_line_fix.trim()
    : defaultFixInstruction(MistakeTypeSchema.safeParse(mistakeType).success ? mistakeType as MistakeType : fallbackMistakeType(lockedCategory));

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
  rationale_incorrect: z.record(z.enum(['A', 'B', 'C', 'D']), z.string()),
  nclex_category: z.string(),
  difficulty: z.number().int().min(1).max(5),
  mistake_type: MistakeTypeSchema.optional(),
  reasoning_trap: z.string().min(10).optional(),
  fix_instruction: z.string().min(10).optional(),
  retest_focus: z.string().min(3).optional(),
  key_cue: z.string().min(5).optional(),
  why_correct_short: z.string().min(5).optional(),
  why_wrong_short: z.string().min(5).optional(),
  one_line_fix: z.string().min(5).optional(),
});

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

    while (retries <= maxRetries) {
      try {
        const retryHint = retries > 0
          ? '\n\nIMPORTANT: Your previous response was not valid JSON. Please respond with ONLY the JSON object, no markdown fences, no explanation.'
          : '';

        const { text } = await generateText({
          model: anthropic('claude-sonnet-4-20250514') as any,
          maxTokens: 1400,
          prompt: prompt + retryHint,
        });

        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();

        questionData = QuizQuestionSchema.parse(JSON.parse(cleaned));
        if (!isTargetedDrill && lockedCategory) {
          questionData.nclex_category = lockedCategory;
        }
        break;
      } catch (parseError) {
        retries++;
        if (retries > maxRetries) {
          console.error('[Quiz Generate] Failed to parse Claude response after retries:', parseError);
          return NextResponse.json({ error: 'Failed to generate valid question. Please try again.' }, { status: 500 });
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
