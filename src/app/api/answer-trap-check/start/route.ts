import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashIp, RATE_LIMIT_MAX_SESSIONS_PER_HOUR } from '@/lib/answer-trap';
import type { PublicQuestion } from '@/lib/answer-trap';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role configuration');
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();

    // Extract IP for rate limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const ipHash = hashIp(ip);

    // Rate limit: max sessions per IP per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('answer_trap_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('[AnswerTrapCheck/start] Rate limit query error:', countError);
    }

    if ((count ?? 0) >= RATE_LIMIT_MAX_SESSIONS_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many checks. Please try again in an hour.' },
        { status: 429 }
      );
    }

    // Parse optional UTM params from body
    let utm_source: string | null = null;
    let utm_medium: string | null = null;
    let utm_campaign: string | null = null;
    let source_url: string | null = null;

    try {
      const body = await req.json();
      utm_source = body.utm_source ?? null;
      utm_medium = body.utm_medium ?? null;
      utm_campaign = body.utm_campaign ?? null;
      source_url = body.source_url ?? null;
    } catch {
      // Empty body is fine
    }

    // Select 3 questions from different trap types for variety
    const { data: allQuestions, error: questionsError } = await supabase
      .from('answer_trap_questions')
      .select('id, trap_type')
      .eq('is_active', true);

    if (questionsError || !allQuestions || allQuestions.length < 3) {
      console.error('[AnswerTrapCheck/start] Not enough questions:', questionsError);
      return NextResponse.json(
        { error: 'Not enough questions available. Please try again later.' },
        { status: 503 }
      );
    }

    // Group by trap_type, pick one random question per type, then select 3 diverse types
    const byTrap: Record<string, string[]> = {};
    for (const q of allQuestions) {
      if (!byTrap[q.trap_type]) byTrap[q.trap_type] = [];
      byTrap[q.trap_type].push(q.id);
    }

    const trapTypes = Object.keys(byTrap);
    // Shuffle trap types
    for (let i = trapTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [trapTypes[i], trapTypes[j]] = [trapTypes[j], trapTypes[i]];
    }

    // Pick one random question from each of the first 3 trap types
    const selectedIds: string[] = [];
    for (let i = 0; i < Math.min(3, trapTypes.length); i++) {
      const ids = byTrap[trapTypes[i]];
      const randomId = ids[Math.floor(Math.random() * ids.length)];
      selectedIds.push(randomId);
    }

    // If we somehow have fewer than 3 trap types, fill from remaining questions
    if (selectedIds.length < 3) {
      const remaining = allQuestions
        .filter(q => !selectedIds.includes(q.id))
        .map(q => q.id);
      while (selectedIds.length < 3 && remaining.length > 0) {
        const idx = Math.floor(Math.random() * remaining.length);
        selectedIds.push(remaining.splice(idx, 1)[0]);
      }
    }

    // Fetch full question data for selected IDs (only public fields)
    const { data: questions, error: fetchError } = await supabase
      .from('answer_trap_questions')
      .select('id, question_stem, options')
      .in('id', selectedIds);

    if (fetchError || !questions || questions.length < 3) {
      console.error('[AnswerTrapCheck/start] Failed to fetch questions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to load questions. Please try again.' },
        { status: 500 }
      );
    }

    // Shuffle the questions order
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    // Generate anonymous session ID
    const anonymousId = crypto.randomUUID();

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('answer_trap_sessions')
      .insert({
        anonymous_id: anonymousId,
        questions: questions.map(q => q.id),
        ip_hash: ipHash,
        source_url,
        utm_source,
        utm_medium,
        utm_campaign,
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      console.error('[AnswerTrapCheck/start] Session insert error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to start check. Please try again.' },
        { status: 500 }
      );
    }

    // Build public response (no answers, no feedback)
    const publicQuestions: PublicQuestion[] = questions.map((q, idx) => ({
      id: q.id,
      question_stem: q.question_stem,
      options: q.options as { label: string; text: string }[],
      question_index: idx,
    }));

    return NextResponse.json({
      session_id: session.id,
      anonymous_id: anonymousId,
      questions: publicQuestions,
    });
  } catch (error) {
    console.error('[AnswerTrapCheck/start] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
