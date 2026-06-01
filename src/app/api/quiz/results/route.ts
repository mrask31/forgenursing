import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/entitlement';

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entitlement = await getEntitlementForUser(user.id);
    if (!entitlement.hasAccess) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 });
    }

    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Quiz session not found' }, { status: 404 });
    }

    const intendedTotal = Number(session.total_questions) || 20;

    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('session_id', sessionId)
      .not('answered_at', 'is', null)
      .lt('question_index', intendedTotal)
      .order('question_index', { ascending: true });

    if (questionsError) {
      console.error('[Quiz Results] Questions fetch error:', questionsError);
      return NextResponse.json({ error: 'Failed to load quiz questions' }, { status: 500 });
    }

    return NextResponse.json({
      session,
      questions: questions ?? [],
    });
  } catch (error) {
    console.error('[Quiz Results] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
