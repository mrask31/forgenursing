import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEntitlementForUser } from '@/lib/entitlement'

type VisualLesson = {
  id: string
  title: string
  concept: string
  mistake_type: string | null
  nclex_category: string | null
  trigger_keywords: string[] | null
  lesson_steps: Array<{ title: string; body: string }>
  check_question: {
    stem: string
    options: string[]
    correct: string
    explanation?: string
  } | null
  video_url: string | null
  thumbnail_url: string | null
}

function normalizeText(value: unknown) {
  return String(value ?? '').toLowerCase()
}

function keywordScore(lesson: VisualLesson, text: string) {
  const keywords = lesson.trigger_keywords ?? []
  return keywords.reduce((score, keyword) => {
    const normalized = keyword.toLowerCase()
    if (!normalized) return score
    return text.includes(normalized) ? score + 1 : score
  }, 0)
}

function scoreLesson(lesson: VisualLesson, question: any) {
  const haystack = normalizeText([
    question.question_stem,
    question.nclex_category,
    question.mistake_type,
    question.retest_focus,
    question.key_cue,
    question.reasoning_trap,
    question.fix_instruction,
    question.rationale_correct,
  ].filter(Boolean).join(' '))

  let score = 0

  if (lesson.mistake_type && question.mistake_type && lesson.mistake_type === question.mistake_type) {
    score += 6
  }

  if (lesson.nclex_category && question.nclex_category && lesson.nclex_category === question.nclex_category) {
    score += 3
  }

  score += keywordScore(lesson, haystack) * 4

  if (lesson.concept && haystack.includes(lesson.concept.toLowerCase())) {
    score += 5
  }

  return score
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entitlement = await getEntitlementForUser(user.id)
    if (!entitlement.hasAccess) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    const questionId = req.nextUrl.searchParams.get('questionId')
    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
    }

    const { data: question, error: questionError } = await supabase
      .from('quiz_questions')
      .select('id, question_stem, nclex_category, mistake_type, retest_focus, key_cue, reasoning_trap, fix_instruction, rationale_correct, quiz_sessions!inner(user_id)')
      .eq('id', questionId)
      .eq('quiz_sessions.user_id', user.id)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const { data: lessons, error: lessonsError } = await supabase
      .from('visual_lessons')
      .select('id, title, concept, mistake_type, nclex_category, trigger_keywords, lesson_steps, check_question, video_url, thumbnail_url')
      .eq('is_active', true)

    if (lessonsError) {
      console.error('[Visual Lessons] lessons query error:', lessonsError)
      return NextResponse.json({ error: 'Failed to load visual lessons' }, { status: 500 })
    }

    const ranked = ((lessons ?? []) as VisualLesson[])
      .map((lesson) => ({ lesson, score: scoreLesson(lesson, question) }))
      .sort((a, b) => b.score - a.score)

    const best = ranked[0]

    if (!best || best.score <= 0) {
      return NextResponse.json({ lesson: null, matched: false })
    }

    return NextResponse.json({
      lesson: best.lesson,
      matched: true,
      score: best.score,
    })
  } catch (error) {
    console.error('[Visual Lessons] match GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
