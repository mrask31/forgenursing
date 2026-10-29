import { z } from 'zod';
import { sourceCheckedEnabled, sourceCheckedRpc } from '@/lib/learning/source-checked-server';
import { normalizeBankCategory } from '@/lib/learning/source-checked-content';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/entitlement';

const VALID_QUIZ_MODES = ['standard', 'targeted_drill', 'retest', 'diagnostic'] as const;

type QuizMode = typeof VALID_QUIZ_MODES[number];

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
    const {
      sourceType = 'generic',
      practiceSource = 'bank',
      classId,
      nclexCategory,
      quizMode = 'standard',
      targetMistakeType = null,
      targetFocus = null,
      totalQuestions,
    } = body;

    if (!['bank', 'generated'].includes(practiceSource)) return NextResponse.json({ error: 'Invalid practice source' }, { status: 400 });

    if (!['document', 'generic', 'mixed'].includes(sourceType)) {
      return NextResponse.json({ error: 'Invalid sourceType' }, { status: 400 });
    }

    if (!VALID_QUIZ_MODES.includes(quizMode as QuizMode)) {
      return NextResponse.json({ error: 'Invalid quizMode' }, { status: 400 });
    }

    const isTargetedDrill = quizMode === 'targeted_drill';
    const isDiagnostic = quizMode === 'diagnostic';

    if (isTargetedDrill && !targetMistakeType) {
      return NextResponse.json({ error: 'targetMistakeType is required for targeted drills' }, { status: 400 });
    }

    const sessionTotalQuestions = isTargetedDrill
      ? 3
      : isDiagnostic
        ? 5
        : Math.max(1, Math.min(Number(totalQuestions) || 10, 20));

    if (sourceType !== 'document' && practiceSource === 'bank') {
      if (!sourceCheckedEnabled()) return NextResponse.json({ error: 'Source-checked bank practice is not enabled here yet. Choose Generated supplement for additional practice.', code: 'bank_not_enabled' }, { status: 503 });
      const requestId = z.string().uuid().safeParse(body.requestId);
      if (!requestId.success) return NextResponse.json({ error: 'A valid session request ID is required.' }, { status: 400 });
      if (quizMode === 'retest') return NextResponse.json({ error: 'Start a retry from a missed question.' }, { status: 400 });
      const { data, error } = await sourceCheckedRpc('start_source_checked_session', {
        p_user_id: user.id, p_request_id: requestId.data,
        p_total: Math.min(5, Math.floor(sessionTotalQuestions)),
        p_category: normalizeBankCategory(typeof nclexCategory === 'string' ? nclexCategory : null),
        p_focus: isTargetedDrill && typeof targetMistakeType === 'string' ? targetMistakeType : null,
      });
      if (error || !data) {
        const exhausted = error?.message?.includes('No fresh');
        return NextResponse.json({ error: exhausted ? 'No fresh questions remain in this focus. Try another topic, revisit saved explanations, or check your review queue.' : error?.message?.includes('NCLEX-RN') ? 'This question bank supports the NCLEX-RN track.' : 'Your practice could not start. Please retry.', code: exhausted ? 'fresh_content_exhausted' : 'practice_unavailable' }, { status: exhausted ? 409 : 503 });
      }
      return NextResponse.json(data);
    }

    await supabase
      .from('quiz_sessions')
      .update({ status: 'abandoned', abandoned_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'in_progress');

    const { data: session, error: insertError } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: user.id,
        source_type: sourceType,
        content_policy: practiceSource === 'generated' && sourceType !== 'document' ? 'generated_supplement_v1' : null,
        class_id: classId || null,
        nclex_category: nclexCategory || null,
        status: 'in_progress',
        score: 0,
        total_questions: sessionTotalQuestions,
        current_question_index: 0,
        quiz_mode: quizMode,
        target_mistake_type: targetMistakeType || null,
        target_focus: targetFocus || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Quiz Sessions] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('[Quiz Sessions] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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

    const { data: sessions, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[Quiz Sessions] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions: sessions ?? [] });
  } catch (error) {
    console.error('[Quiz Sessions] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
