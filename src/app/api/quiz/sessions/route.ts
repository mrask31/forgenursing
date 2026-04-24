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
    const { sourceType = 'generic', classId, nclexCategory } = body;

    // Validate sourceType
    if (!['document', 'generic', 'mixed'].includes(sourceType)) {
      return NextResponse.json({ error: 'Invalid sourceType' }, { status: 400 });
    }

    // Abandon any existing in_progress sessions
    await supabase
      .from('quiz_sessions')
      .update({ status: 'abandoned', abandoned_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'in_progress');

    // Create new session
    const { data: session, error: insertError } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: user.id,
        source_type: sourceType,
        class_id: classId || null,
        nclex_category: nclexCategory || null,
        status: 'in_progress',
        score: 0,
        total_questions: 10,
        current_question_index: 0,
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

    // Get user's sessions, most recent first
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
