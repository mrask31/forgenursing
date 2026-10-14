import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { contentOnHold, CONTENT_HOLD_CODE } from '@/lib/learning/content-hold'

const state = vi.hoisted(() => ({
  fresh: false,
  user: { id: 'owner' } as { id: string } | null,
  row: {} as Record<string, unknown>,
  rpc: vi.fn(), insert: vi.fn(), model: vi.fn(),
}))
vi.mock('@/lib/entitlement', () => ({ getEntitlementForUser: async () => ({ hasAccess: true }) }))
vi.mock('@/lib/learning/server', () => ({ approvedContent: async () => [], learningAdmin: vi.fn() }))
vi.mock('openai', () => ({ default: class OpenAI {} }))
vi.mock('ai', () => ({ generateText: state.model }))
vi.mock('@/lib/supabase/server', () => ({ createClient: () => ({
  auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
  rpc: state.rpc,
  from: (table: string) => {
    const q = {
      select: () => q, eq: () => q, not: () => q, lt: () => q, neq: () => q,
      limit: () => q,
      then: (resolve: (value: {data: Record<string, unknown>[], error: null}) => unknown) => Promise.resolve(resolve({data: state.fresh ? [] : [state.row], error: null})),
      order: () => q,
      single: async () => ({ data: table === 'quiz_sessions'
        ? { id: 'session', user_id: 'owner', status: 'in_progress', total_questions: 5, source_type: 'generic' }
        : table === 'profiles' ? { program_level: 'ADN' } : state.row, error: null }),
      maybeSingle: async () => ({ data: table === 'profiles' ? { program_level: 'ADN' } : state.fresh ? null : state.row, error: null }),
      insert: state.insert,
    }
    return q
  },
}) }))
import { POST as answer } from '@/app/api/quiz/answer/route'
import { POST as generate } from '@/app/api/quiz/generate/route'
import { POST as retry } from '@/app/api/quiz/retest-weakness/route'
import { POST as tutor } from '@/app/api/quiz/dig-deeper/route'
import { GET as results } from '@/app/api/quiz/results/route'
import { GET as progress } from '@/app/api/judgment-map/route'
import { GET as fixPlan } from '@/app/api/fix-plan/route'
import { GET as visual } from '@/app/api/visual-lessons/match/route'
const id = '11111111-1111-4111-8111-111111111111'
const request = () => new NextRequest(`http://localhost/api/test?sessionId=session&questionId=${id}`, {
  method: 'POST', body: JSON.stringify({ questionId: id, userAnswer: 'B', sessionId: 'session', questionIndex: 0, quizSessionId: 'session' }),
})
beforeEach(() => {
  state.fresh = false
  state.user = { id: 'owner' }
  state.row = { id, question_stem: 'A patient with COPD has oxygen saturation of 82%.',
    rationale_correct: 'Unsafe QA fixture — must never reach a learner.',
    quiz_sessions: { user_id: 'owner' }, clinical_content_id: 'not-a-bypass' }
  vi.clearAllMocks()
})
describe('clinical incident containment', () => {
  it.each(['COPD', 'chronic obstructive pulmonary disease', 'Emphysema', 'chronic bronchitis'])('holds the %s family regardless of claimed approval', name => {
    expect(contentOnHold({ question_stem: `A patient has ${name}`, clinical_content_id: id })).toBe(true)
  })
  it('also catches the family in rationale or option text without treating unrelated content as approved', () => {
    expect(contentOnHold({ rationale_incorrect: { A: 'In COPD...' } })).toBe(true)
    expect(contentOnHold({ options: [{ label: 'A', text: 'COPD exacerbation' }] })).toBe(true)
    expect(contentOnHold({ question_stem: 'An elevated potassium result' })).toBe(false)
  })
  it.each([
    ['answer submission', answer], ['saved question resume', generate], ['related retry', retry],
    ['tutor context', tutor], ['saved results', results], ['visual lesson matching', visual],
  ] as const)('blocks %s before returning clinical content or mutating data', async (_name, route) => {
    const response = await route(request())
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.code).toBe(CONTENT_HOLD_CODE)
    expect(JSON.stringify(body)).not.toContain('Unsafe QA fixture')
    expect(body).not.toHaveProperty('questions')
    expect(body).not.toHaveProperty('correct_answer')
    expect(state.rpc).not.toHaveBeenCalled()
    expect(state.insert).not.toHaveBeenCalled()
    expect(state.model).not.toHaveBeenCalled()
  })
  it('rejects freshly generated held content before inserting or returning it', async () => {
    state.fresh = true
    state.model.mockResolvedValue({ text: JSON.stringify({
      question_stem: 'A patient with COPD has oxygen saturation of 82%.',
      options: ['A', 'B', 'C', 'D'].map(label => ({ label, text: 'Synthetic QA option' })),
      correct_answer: 'B', rationale_correct: 'Unsafe QA fixture must not reach a learner.',
      rationale_incorrect: { A: 'Synthetic rationale', C: 'Synthetic rationale', D: 'Synthetic rationale' },
    }) })
    const response = await generate(request())
    expect(response.status).toBe(409)
    expect((await response.json()).code).toBe(CONTENT_HOLD_CODE)
    expect(state.model).toHaveBeenCalledOnce()
    expect(state.insert).not.toHaveBeenCalled()
  })
  it('rejects a newly generated held retry from an unrelated original before creating a child session', async () => {
    state.fresh = true
    state.row = { id, question_stem: 'An unrelated original question', answered_at: '2026-10-14', is_correct: false,
      learning_attempt: 1, correct_answer: 'A', user_answer: 'B', quiz_sessions: {user_id: 'owner', quiz_mode: 'standard'} }
    state.model.mockResolvedValue({text: JSON.stringify({
      question_stem: 'A patient with COPD has oxygen saturation of 82%.',
      options: ['A', 'B', 'C', 'D'].map(label => ({label, text: 'Synthetic QA option'})),
      correct_answer: 'B', rationale_correct: 'Unsafe QA fixture must not reach a learner.',
      rationale_incorrect: {A: 'Synthetic rationale', C: 'Synthetic rationale', D: 'Synthetic rationale'},
      nclex_category: 'Physiological Adaptation', difficulty: 3,
    })})
    const response = await retry(request())
    expect(response.status).toBe(409)
    expect((await response.json()).code).toBe(CONTENT_HOLD_CODE)
    expect(state.model).toHaveBeenCalledOnce()
    expect(state.insert).not.toHaveBeenCalled()
  })
  it.each([['progress', progress], ['focus suggestions', fixPlan]] as const)('excludes held answers from %s without deleting records', async (_name, route) => {
    const response = await route()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({clinical_hold_count: 1})
    expect(state.rpc).not.toHaveBeenCalled()
    expect(state.insert).not.toHaveBeenCalled()
  })
  it('still requires authentication before returning a hold status', async () => {
    state.user = null
    expect((await answer(request())).status).toBe(401)
  })
})
