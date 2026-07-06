import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { AnswerFeedback } from '@/lib/answer-trap';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role configuration');
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await req.json();
    const { session_id, question_id, question_index, selected_answer } = body;

    // Validate required fields
    if (!session_id || !question_id || question_index === undefined || !selected_answer) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, question_id, question_index, selected_answer' },
        { status: 400 }
      );
    }

    if (!['A', 'B', 'C', 'D'].includes(selected_answer)) {
      return NextResponse.json(
        { error: 'Invalid answer. Must be A, B, C, or D.' },
        { status: 400 }
      );
    }

    // Verify session exists and question is part of it
    const { data: session, error: sessionError } = await supabase
      .from('answer_trap_sessions')
      .select('id, questions, answers, completed_at')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.completed_at) {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      );
    }

    const questionIds = session.questions as string[];
    if (!questionIds.includes(question_id)) {
      return NextResponse.json(
        { error: 'Question not part of this session' },
        { status: 400 }
      );
    }

    // Check if already answered
    const existingAnswers = (session.answers as any[]) || [];
    const alreadyAnswered = existingAnswers.find((a: any) => a.question_id === question_id);
    if (alreadyAnswered) {
      // Re-fetch and return the feedback (idempotent)
      const { data: question } = await supabase
        .from('answer_trap_questions')
        .select('correct_answer, trap_type, trap_display_name, key_cue, why_correct_short, why_wrong_short, one_line_fix')
        .eq('id', question_id)
        .single();

      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      const feedback: AnswerFeedback = {
        is_correct: alreadyAnswered.is_correct,
        correct_answer: question.correct_answer,
        trap_type: question.trap_type,
        trap_display_name: question.trap_display_name,
        key_cue: question.key_cue,
        why_correct_short: question.why_correct_short,
        why_wrong_short: question.why_wrong_short,
        one_line_fix: question.one_line_fix,
      };

      return NextResponse.json(feedback);
    }

    // Fetch the question to check the answer
    const { data: question, error: questionError } = await supabase
      .from('answer_trap_questions')
      .select('correct_answer, trap_type, trap_display_name, key_cue, why_correct_short, why_wrong_short, one_line_fix')
      .eq('id', question_id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const is_correct = selected_answer === question.correct_answer;

    // Append answer to session
    const newAnswer = {
      question_id,
      selected_answer,
      is_correct,
      trap_type: question.trap_type,
    };

    const updatedAnswers = [...existingAnswers, newAnswer];
    const newScore = updatedAnswers.filter((a: any) => a.is_correct).length;

    const { error: updateError } = await supabase
      .from('answer_trap_sessions')
      .update({
        answers: updatedAnswers,
        score: newScore,
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('[AnswerTrapCheck/answer] Session update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save answer' },
        { status: 500 }
      );
    }

    // Return feedback
    const feedback: AnswerFeedback = {
      is_correct,
      correct_answer: question.correct_answer,
      trap_type: question.trap_type,
      trap_display_name: question.trap_display_name,
      key_cue: question.key_cue,
      why_correct_short: question.why_correct_short,
      why_wrong_short: question.why_wrong_short,
      one_line_fix: question.one_line_fix,
    };

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('[AnswerTrapCheck/answer] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
