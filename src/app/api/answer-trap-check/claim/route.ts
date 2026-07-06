import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role configuration');
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    // This endpoint requires authentication
    const authClient = createServerClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to save your result.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { session_id, anonymous_id } = body;

    if (!session_id || !anonymous_id) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, anonymous_id' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Verify session exists and matches anonymous_id
    const { data: session, error: sessionError } = await supabase
      .from('answer_trap_sessions')
      .select('id, anonymous_id, user_id, completed_at')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.anonymous_id !== anonymous_id) {
      return NextResponse.json(
        { error: 'Session does not match' },
        { status: 403 }
      );
    }

    // Already claimed
    if (session.user_id) {
      return NextResponse.json({
        success: true,
        already_claimed: true,
        message: 'Session was already saved to an account.',
      });
    }

    // Attach user_id
    const { error: updateError } = await supabase
      .from('answer_trap_sessions')
      .update({ user_id: user.id })
      .eq('id', session_id);

    if (updateError) {
      console.error('[AnswerTrapCheck/claim] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save session to account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      already_claimed: false,
      message: 'Answer Trap result saved to your account.',
    });
  } catch (error) {
    console.error('[AnswerTrapCheck/claim] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
