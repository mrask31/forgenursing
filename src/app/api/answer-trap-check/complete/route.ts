import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scoreTrap } from '@/lib/answer-trap';
import type { SessionAnswer } from '@/lib/answer-trap';

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
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing required field: session_id' },
        { status: 400 }
      );
    }

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('answer_trap_sessions')
      .select('id, answers, total_questions, completed_at')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // If already completed, return cached result
    if (session.completed_at) {
      const { data: completedSession } = await supabase
        .from('answer_trap_sessions')
        .select('score, total_questions, detected_trap, detected_trap_display')
        .eq('id', session_id)
        .single();

      if (completedSession) {
        const answers = (session.answers as SessionAnswer[]) || [];
        const result = scoreTrap(answers);
        return NextResponse.json(result);
      }
    }

    const answers = (session.answers as SessionAnswer[]) || [];

    // Require all questions answered
    if (answers.length < (session.total_questions || 3)) {
      return NextResponse.json(
        { error: `Please answer all ${session.total_questions || 3} questions before completing.` },
        { status: 400 }
      );
    }

    // Score the session
    const result = scoreTrap(answers);

    // Update session with result
    const { error: updateError } = await supabase
      .from('answer_trap_sessions')
      .update({
        detected_trap: result.detected_trap,
        detected_trap_display: result.detected_trap_display,
        completed_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('[AnswerTrapCheck/complete] Session update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save results' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[AnswerTrapCheck/complete] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
