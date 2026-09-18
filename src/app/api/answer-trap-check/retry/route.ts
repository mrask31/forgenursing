import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { demoLesson, demoFeedback, publicDemoQuestion } from '@/lib/demo-lessons';
import { z } from 'zod';

const input = z.object({
  session_id: z.string().uuid(),
  anonymous_id: z.string().uuid(),
  question_id: z.string().uuid(),
  selected_answer: z.enum(['A', 'B', 'C', 'D']).optional(),
});

// A teaching exercise, separate from the original score and saved progress.
export async function POST(req: NextRequest) {
  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid practice request' }, { status: 400 });
  try {
    const { session_id, anonymous_id, question_id, selected_answer } = parsed.data;
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: session } = await supabase.from('answer_trap_sessions')
      .select('questions, answers, completed_at').eq('id', session_id).eq('anonymous_id', anonymous_id).single();
    const answer = session?.answers?.find((a: { question_id: string }) => a.question_id === question_id);
    if (!session || session.completed_at || !session.questions.includes(question_id) || !answer || answer.is_correct) {
      return NextResponse.json({ error: 'A related retry is not available for this question.' }, { status: 403 });
    }
    const { data: question } = await supabase.from('answer_trap_questions')
      .select('question_stem').eq('id', question_id).single();
    const lesson = question && demoLesson(question.question_stem);
    if (!lesson) return NextResponse.json({ error: 'No related retry is available.' }, { status: 404 });
    return NextResponse.json(selected_answer
      ? { feedback: demoFeedback(lesson, selected_answer, true) }
      : { question: publicDemoQuestion(lesson.retry, question_id + '-retry') });
  } catch {
    return NextResponse.json({ error: 'Could not load the retry. Please try again.' }, { status: 500 });
  }
}
