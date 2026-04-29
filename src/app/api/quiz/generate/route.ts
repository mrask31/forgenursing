import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getEntitlementForUser } from '@/lib/entitlement';
import { buildQuizPrompt, buildGenericQuizPrompt, getCategoryForIndex } from '@/lib/ai/quiz-prompts';
import { z } from 'zod';
import OpenAI from 'openai';

export const maxDuration = 30;

const openaiEmbeddings = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Zod schema for validating Claude's JSON response
const QuizQuestionSchema = z.object({
  question_stem: z.string().min(10),
  options: z.array(z.object({
    label: z.enum(['A', 'B', 'C', 'D']),
    text: z.string().min(1),
  })).length(4),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  rationale_correct: z.string().min(10),
  rationale_incorrect: z.record(z.enum(['A', 'B', 'C', 'D']), z.string()),
  nclex_category: z.string(),
  difficulty: z.number().int().min(1).max(5),
});

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
    const { sessionId, questionIndex, sourceType, classId, category } = body;

    if (!sessionId || questionIndex === undefined || !sourceType) {
      return NextResponse.json({ error: 'Missing required fields: sessionId, questionIndex, sourceType' }, { status: 400 });
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: 'Session is not in progress' }, { status: 400 });
    }

    // Get user's program level
    let programLevel: 'LPN' | 'ADN' | 'BSN' | 'MSN' = 'ADN';
    const { data: profile } = await supabase
      .from('profiles')
      .select('program_level')
      .eq('id', user.id)
      .single();
    if (profile?.program_level) {
      programLevel = profile.program_level as 'LPN' | 'ADN' | 'BSN' | 'MSN';
    }

    // Get previous question stems for deduplication.
    // Include current session stems plus recent user-level stems so question 1 of a new quiz
    // does not repeatedly generate the same high-probability NCLEX scenario.
    const { data: prevQuestions } = await supabase
      .from('quiz_questions')
      .select('question_stem')
      .eq('session_id', sessionId);

    const { data: recentUserQuestions } = await supabase
      .from('quiz_questions')
      .select('question_stem, created_at, quiz_sessions!inner(user_id)')
      .eq('quiz_sessions.user_id', user.id)
      .neq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(50);

    const dedupeStemSet = new Set<string>();
    for (const question of [...(prevQuestions ?? []), ...(recentUserQuestions ?? [])]) {
      const stem = (question as any)?.question_stem;
      if (typeof stem === 'string' && stem.trim().length > 0) {
        dedupeStemSet.add(stem.trim());
      }
    }
    const previousStems = Array.from(dedupeStemSet).slice(0, 50);

    let prompt: string;
    let sourceChunkText: string | null = null;
    let sourceDocId: string | null = null;

    if (sourceType === 'document') {
      // RAG: fetch a document chunk via embedding search
      const ragQuery = `NCLEX nursing question about clinical concepts`;
      try {
        const embeddingResponse = await openaiEmbeddings.embeddings.create({
          model: 'text-embedding-3-small',
          input: ragQuery,
        });
        const queryEmbedding = embeddingResponse.data?.[0]?.embedding;
        if (queryEmbedding) {
          const rpcParams: any = {
            query_embedding: queryEmbedding,
            match_threshold: 0.3,
            match_count: 5,
            user_id_filter: user.id,
            filter_active: true,
          };

          const { data: matchedChunks } = await supabase.rpc('match_documents', rpcParams);

          if (matchedChunks && matchedChunks.length > 0) {
            // Pick a chunk based on question index to spread across document
            const chunkIndex = questionIndex % matchedChunks.length;
            const chunk = matchedChunks[chunkIndex];
            sourceChunkText = chunk.content || '';
            sourceDocId = chunk.id || null;
          }
        }
      } catch (ragError) {
        console.error('[Quiz Generate] RAG error, falling back to generic:', ragError);
      }

      if (sourceChunkText) {
        prompt = buildQuizPrompt(programLevel, sourceChunkText, previousStems);
      } else {
        // Fallback to generic if RAG fails
        const cat = getCategoryForIndex(questionIndex, category);
        prompt = buildGenericQuizPrompt(programLevel, cat, previousStems);
      }
    } else {
      // Generic quiz
      const cat = getCategoryForIndex(questionIndex, category || session.nclex_category);
      prompt = buildGenericQuizPrompt(programLevel, cat, previousStems);
    }

    // Call Claude Sonnet via generateText (NOT streamText — need complete JSON)
    let questionData;
    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        const retryHint = retries > 0
          ? '\n\nIMPORTANT: Your previous response was not valid JSON. Please respond with ONLY the JSON object, no markdown fences, no explanation.'
          : '';

        const { text } = await generateText({
          model: anthropic('claude-sonnet-4-20250514') as any,
          maxTokens: 1000,
          prompt: prompt + retryHint,
        });

        // Strip markdown fences if present
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();

        questionData = QuizQuestionSchema.parse(JSON.parse(cleaned));
        break;
      } catch (parseError) {
        retries++;
        if (retries > maxRetries) {
          console.error('[Quiz Generate] Failed to parse Claude response after retries:', parseError);
          return NextResponse.json({ error: 'Failed to generate valid question. Please try again.' }, { status: 500 });
        }
      }
    }

    // Insert into quiz_questions table
    const { data: question, error: insertError } = await supabase
      .from('quiz_questions')
      .insert({
        session_id: sessionId,
        question_index: questionIndex,
        question_stem: questionData!.question_stem,
        options: questionData!.options,
        correct_answer: questionData!.correct_answer,
        rationale_correct: questionData!.rationale_correct,
        rationale_incorrect: questionData!.rationale_incorrect,
        nclex_category: questionData!.nclex_category,
        difficulty: questionData!.difficulty,
        source_doc_id: sourceDocId,
        source_chunk_text: sourceChunkText,
      })
      .select('id, session_id, question_index, question_stem, options, nclex_category, difficulty')
      .single();

    if (insertError) {
      console.error('[Quiz Generate] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save question' }, { status: 500 });
    }

    // Return question WITHOUT correct_answer or rationales (those come after answering)
    return NextResponse.json({ question });
  } catch (error: any) {
    // Handle Anthropic rate limits
    if (error?.status === 429) {
      const retryAfter = error?.headers?.['retry-after'] || 5;
      return NextResponse.json(
        { error: 'Rate limited. Please try again shortly.', retryAfter },
        { status: 429 }
      );
    }
    console.error('[Quiz Generate] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
