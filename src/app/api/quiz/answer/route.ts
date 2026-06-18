import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/entitlement';

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
    const { questionId, userAnswer } = body;

    if (!questionId || !userAnswer) {
      return NextResponse.json({ error: 'Missing required fields: questionId, userAnswer' }, { status: 400 });
    }

    if (!['A', 'B', 'C', 'D'].includes(userAnswer)) {
      return NextResponse.json({ error: 'Invalid answer. Must be A, B, C, or D.' }, { status: 400 });
    }

    const { data: question, error: fetchError } = await supabase
      .from('quiz_questions')
      .select('*, quiz_sessions!inner(user_id, id, status, score, current_question_index, total_questions)')
      .eq('id', questionId)
      .single();

    if (fetchError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const baseResult = {
      correct_answer: question.correct_answer,
      rationale_correct: question.rationale_correct,
      rationale_incorrect: question.rationale_incorrect,
      mistake_type: question.mistake_type,
      reasoning_trap: question.reasoning_trap,
      fix_instruction: question.fix_instruction,
      retest_focus: question.retest_focus,
      key_cue: question.key_cue,
      why_correct_short: question.why_correct_short,
      why_wrong_short: question.why_wrong_short,
      one_line_fix: question.one_line_fix,
    };

    console.log('[Quiz Answer] ANSWER_ROUTE_MICRO_FEEDBACK', JSON.stringify({
      question_id: questionId,
      key_cue: question.key_cue,
      why_correct_short: question.why_correct_short,
      why_wrong_short: question.why_wrong_short,
      one_line_fix: question.one_line_fix,
    }));

    if (question.answered_at) {
      return NextResponse.json({
        ...baseResult,
        is_correct: question.is_correct,
        user_answer: question.user_answer,
      });
    }

    const isCorrect = userAnswer === question.correct_answer;
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('quiz_questions')
      .update({
        user_answer: userAnswer,
        is_correct: isCorrect,
        answered_at: now,
      })
      .eq('id', questionId);

    if (updateError) {
      console.error('[Quiz Answer] Update question error:', updateError);
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }

    const session = question.quiz_sessions;
    const newScore = (session.score || 0) + (isCorrect ? 1 : 0);
    const newIndex = (session.current_question_index || 0) + 1;
    const isComplete = newIndex >= session.total_questions;

    const sessionUpdate: any = {
      score: newScore,
      current_question_index: newIndex,
    };

    if (isComplete) {
      sessionUpdate.status = 'completed';
      sessionUpdate.completed_at = now;
    }

    const { error: sessionUpdateError } = await supabase
      .from('quiz_sessions')
      .update(sessionUpdate)
      .eq('id', session.id);

    if (sessionUpdateError) {
      console.error('[Quiz Answer] Update session error:', sessionUpdateError);
    }

    return NextResponse.json({
      ...baseResult,
      is_correct: isCorrect,
      user_answer: userAnswer,
      session_complete: isComplete,
      score: newScore,
      total_answered: newIndex,
    });
  } catch (error) {
    console.error('[Quiz Answer] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}