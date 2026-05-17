import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/entitlement';

function compactSentence(value: string | null | undefined, maxLength = 170): string {
  if (!value) return '';
  const firstSentence = value.trim().split(/(?<=[.!?])\s+/)[0] || value.trim();
  if (firstSentence.length <= maxLength) return firstSentence;
  return `${firstSentence.slice(0, maxLength).trim()}…`;
}

function fallbackMistakeType(category: string | null | undefined): string {
  if (category === 'Psychosocial Integrity') return 'Therapeutic communication';
  if (category === 'Pharmacological Therapies') return 'Medication reasoning';
  if (category === 'Safety and Infection Control') return 'Safety';
  if (category === 'Delegation') return 'Delegation';
  if (category === 'Reduction of Risk Potential') return 'Lab / diagnostic interpretation';
  if (category === 'Management of Care' || category === 'Priority Setting') return 'Priority-setting';
  if (category === 'Health Promotion and Maintenance') return 'Patient education';
  if (category === 'Physiological Adaptation') return 'Assessment-first';
  return 'Clinical judgment';
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
      return NextResponse.json(
        { error: 'Missing required fields: quizSessionId, questionId' },
        { status: 400 }
      );
    }

    const { data: question, error: questionError } = await supabase
      .from('quiz_questions')
      .select('id, session_id, question_index, question_stem, options, correct_answer, user_answer, is_correct, rationale_correct, rationale_incorrect, nclex_category, difficulty, mistake_type, reasoning_trap, fix_instruction, retest_focus, quiz_sessions!inner(id, user_id, source_type, nclex_category)')
      .eq('id', questionId)
      .eq('session_id', quizSessionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Quiz question not found' }, { status: 404 });
    }

    const session = Array.isArray(question.quiz_sessions)
      ? question.quiz_sessions[0]
      : question.quiz_sessions;

    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const category = question.nclex_category || session.nclex_category || 'NCLEX Review';
    const mistakeType = question.mistake_type || fallbackMistakeType(category);
    const title = `Fix Weakness — ${mistakeType}`;
    const options = Array.isArray(question.options) ? question.options : [];
    const selectedAnswer = question.user_answer || 'Not answered';
    const selectedOptionText = options.find((option: any) => option.label === selectedAnswer)?.text;
    const correctOptionText = options.find((option: any) => option.label === question.correct_answer)?.text;
    const selectedRationale =
      question.rationale_incorrect && typeof question.rationale_incorrect === 'object'
        ? (question.rationale_incorrect as Record<string, string>)[selectedAnswer]
        : undefined;

    const keyCue = compactSentence(question.rationale_correct, 160);
    const trap = question.reasoning_trap || compactSentence(selectedRationale, 140);
    const fixInstruction = question.fix_instruction || 'Let’s identify the cue that should have changed your priority.';
    const retestFocus = question.retest_focus || `${mistakeType} practice`;

    const seededContent = [
      'Let’s fix this missed question.',
      `**Mistake Type: ${mistakeType}**`,
      trap ? `**The trap:** ${trap}` : null,
      fixInstruction ? `**How to fix it:** ${fixInstruction}` : null,
      `You chose **${selectedAnswer}${selectedOptionText ? `: ${selectedOptionText}` : ''}**.`,
      `Better answer: **${question.correct_answer}${correctOptionText ? `: ${correctOptionText}` : ''}**.`,
      keyCue ? `Key cue: ${keyCue}` : null,
      `Next focus: ${retestFocus}.`,
      'Your move: what made your answer feel right at first?'
    ].filter(Boolean).join('\n\n');

    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        mode: 'tutor',
        session_type: 'question',
        title,
        metadata: {
          source: 'quiz_fix_weakness',
          quizSessionId,
          questionId,
          questionIndex: question.question_index,
          nclexCategory: category,
          questionStem: question.question_stem,
          options,
          selectedAnswer,
          correctAnswer: question.correct_answer,
          rationaleCorrect: question.rationale_correct,
          rationaleForSelectedAnswer: selectedRationale || null,
          mistakeType,
          reasoningTrap: trap,
          fixInstruction,
          retestFocus,
        },
      })
      .select('id, title, session_type, mode')
      .single();

    if (chatError || !chat) {
      console.error('[Quiz Fix Weakness] Create chat error:', chatError);
      return NextResponse.json({ error: 'Failed to create tutor session' }, { status: 500 });
    }

    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chat.id,
        role: 'assistant',
        content: seededContent,
        sequence_number: 0,
      });

    if (messageError) {
      console.error('[Quiz Fix Weakness] Seed message error:', messageError);
      return NextResponse.json({ error: 'Failed to seed tutor context' }, { status: 500 });
    }

    return NextResponse.json({
      chatId: chat.id,
      session_type: chat.session_type || 'question',
      title: chat.title,
      mode: chat.mode || 'tutor',
    });
  } catch (error) {
    console.error('[Quiz Fix Weakness] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
