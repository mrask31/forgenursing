import { demoLesson, demoFeedback } from '@/lib/demo-lessons';
import { selectedAnswerComparison } from '@/lib/practice-progress';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { AnswerFeedback, SessionAnswer } from '@/lib/answer-trap';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role configuration');
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const suppliedId = req.headers.get('x-request-id');
  const requestId = suppliedId && /^[a-f0-9-]{36}$/i.test(suppliedId) ? suppliedId : randomUUID();
  const response = await answer(req, requestId);
  response.headers.set('X-Request-ID', requestId);
  if (response.status >= 400) console.error('[AnswerTrapCheck/answer]', { request_id: requestId, status: response.status });
  return response;
}

async function answer(req: NextRequest, requestId: string) {
  try {
    const supabase = getServiceClient();
    const parsed = z.object({
      session_id: z.string().uuid(), question_id: z.string().uuid(),
      question_index: z.number().int().min(0).max(2), selected_answer: z.enum(['A', 'B', 'C', 'D']),
    }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid answer submission' }, { status: 400 });
    const { session_id, question_id, question_index, selected_answer } = parsed.data;

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

    const questionIds = session.questions as string[];
    if (!Number.isInteger(question_index) || questionIds[question_index] !== question_id) {
      return NextResponse.json(
        { error: 'Question not part of this session' },
        { status: 400 }
      );
    }

    // Check if already answered
    const existingAnswers = (session.answers as SessionAnswer[]) || [];
    const alreadyAnswered = existingAnswers.find((a: SessionAnswer) => a.question_id === question_id);
    if (alreadyAnswered) {
      // Re-fetch and return the feedback (idempotent)
      const { data: question } = await supabase
        .from('answer_trap_questions')
        .select('question_stem, options, correct_answer, trap_type, trap_display_name, key_cue, why_correct_short, why_wrong_short, one_line_fix')
        .eq('id', question_id)
        .single();

      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      const lesson = demoLesson(question.question_stem);
      const feedback: AnswerFeedback = lesson ? demoFeedback(lesson, alreadyAnswered.selected_answer) : {
        is_correct: alreadyAnswered.is_correct,
        correct_answer: question.correct_answer,
        trap_type: question.trap_type,
        trap_display_name: question.trap_display_name,
        key_cue: question.key_cue,
        why_correct_short: question.why_correct_short,
        why_wrong_short: selectedAnswerComparison(alreadyAnswered.selected_answer, question.options, question.correct_answer),
        one_line_fix: question.one_line_fix,
      };

      return NextResponse.json(feedback);
    }

    if (session.completed_at) {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      );
    }

    // Fetch the question to check the answer
    const { data: question, error: questionError } = await supabase
      .from('answer_trap_questions')
      .select('question_stem, options, correct_answer, trap_type, trap_display_name, key_cue, why_correct_short, why_wrong_short, one_line_fix')
      .eq('id', question_id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const lesson = demoLesson(question.question_stem);
    const is_correct = selected_answer === (lesson?.initial.correct_answer ?? question.correct_answer);

    // Append answer to session
    const newAnswer = {
      question_id,
      selected_answer,
      is_correct,
      trap_type: question.trap_type,
    };

    const updatedAnswers = [...existingAnswers, newAnswer];
    const newScore = updatedAnswers.filter((a: SessionAnswer) => a.is_correct).length;

    const update = supabase
      .from('answer_trap_sessions')
      .update({
        answers: updatedAnswers,
        score: newScore,
      })
      .eq('id', session_id)
      .is('completed_at', null);
    // Compare-and-swap prevents concurrent submissions from overwriting each other.
    const guarded = session.answers == null ? update.is('answers', null) : update.eq('answers', JSON.stringify(session.answers));
    const { data: saved, error: updateError } = await guarded.select('id').maybeSingle();

    if (updateError) {
      console.error('[AnswerTrapCheck/answer] Save failed', { request_id: requestId, code: updateError.code });
      return NextResponse.json(
        { error: 'Failed to save answer' },
        { status: 500 }
      );
    }

    if (!saved) {
      return NextResponse.json({ error: 'Session changed. Please retry to retrieve your saved answer.' }, { status: 409 });
    }

    // Return feedback
    const feedback: AnswerFeedback = lesson ? demoFeedback(lesson, selected_answer) : {
      is_correct,
      correct_answer: question.correct_answer,
      trap_type: question.trap_type,
      trap_display_name: question.trap_display_name,
      key_cue: question.key_cue,
      why_correct_short: question.why_correct_short,
      why_wrong_short: selectedAnswerComparison(selected_answer, question.options, question.correct_answer),
      one_line_fix: question.one_line_fix,
    };

    return NextResponse.json(feedback);
  } catch {
    console.error('[AnswerTrapCheck/answer] Unexpected failure', { request_id: requestId });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
