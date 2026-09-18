import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DEMO_LESSONS, demoFeedback, publicDemoQuestion } from '../src/lib/demo-lessons'
import { scoreTrap } from '../src/lib/answer-trap'
const mocks = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.create }))
import { POST } from '../src/app/api/answer-trap-check/retry/route'
const sid = '00000000-0000-4000-8000-000000000001'
const aid = '00000000-0000-4000-8000-000000000002'
const qid = '00000000-0000-4000-8000-000000000003'
function request(extra = {}) { return new NextRequest('https://example.test/api/answer-trap-check/retry', { method: 'POST', body: JSON.stringify({ session_id: sid, anonymous_id: aid, question_id: qid, ...extra }) }) }
function setup(session: unknown) {
  const query: any = { select: vi.fn(), eq: vi.fn(), single: vi.fn() }
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query)
  query.single.mockResolvedValueOnce({ data: session }).mockResolvedValueOnce({ data: { question_stem: DEMO_LESSONS[0].sourceStem } })
  const from = vi.fn().mockReturnValue(query)
  mocks.create.mockReturnValue({ from })
  return query
}
const eligible = { questions: [qid], answers: [{ question_id: qid, is_correct: false }], completed_at: null }
beforeEach(() => { vi.resetAllMocks() })
describe('demo teaching content', () => {
  it('has a distinct explanation for every distractor and keeps answer keys private', () => {
    for (const lesson of DEMO_LESSONS) for (const item of [lesson.initial, lesson.retry]) {
      expect(item.options).toHaveLength(4)
      expect(new Set(item.options.map(option => option.label)).size).toBe(4)
      expect(item.options.some(option => option.label === item.correct_answer)).toBe(true)
      const wrong = item.options.filter(option => option.label !== item.correct_answer)
      expect(new Set(wrong.map(option => item.rationales[option.label])).size).toBe(3)
      for (const option of wrong) expect(item.rationales[option.label].length).toBeGreaterThan(20)
      expect(Object.keys(publicDemoQuestion(item, qid)).sort()).toEqual(['id','options','question_index','question_stem'])
    }
  })
  it('offers retries only after an original miss and explains the chosen option', () => {
    const lesson = DEMO_LESSONS[0]
    expect(demoFeedback(lesson, 'D').why_wrong_short).toContain('ST depression')
    expect(demoFeedback(lesson, 'D').retry_available).toBe(true)
    expect(demoFeedback(lesson, 'B').retry_available).toBe(false)
    expect(demoFeedback(lesson, 'A', true).retry_available).toBe(false)
  })
  it('lists missed topics without claiming a diagnosed pattern', () => {
    const result = scoreTrap([{ question_id: 'a', selected_answer: 'A', is_correct: false, trap_type: 'Delegation' }, { question_id: 'b', selected_answer: 'A', is_correct: false, trap_type: 'Priority-setting' }])
    expect(result.review_topics).toEqual(['Delegating routine care', 'Recognizing urgent symptoms'])
    expect(result.trap_explanation).not.toContain('You may tend')
    expect(result.trap_why_tempting).toBeNull()
  })
})
describe('related retry endpoint', () => {
  it('requires the anonymous credential and a missed question', async () => {
    const query = setup(eligible)
    const response = await POST(request())
    expect(response.status).toBe(200)
    expect(query.eq).toHaveBeenCalledWith('anonymous_id', aid)
    const data = await response.json()
    expect(data.question.correct_answer).toBeUndefined()
    expect(data.question.question_stem).toContain('2.8')
  })
  it.each([null, { ...eligible, completed_at: 'today' }, { ...eligible, questions: [] }, { ...eligible, answers: [] }, { ...eligible, answers: [{ question_id: qid, is_correct: true }] }])('rejects unavailable or ineligible sessions', async session => {
    setup(session)
    expect((await POST(request())).status).toBe(403)
  })
  it('scores the related question without rewriting the original score', async () => {
    const query = setup(eligible)
    const response = await POST(request({ selected_answer: 'C' }))
    expect((await response.json()).feedback.is_correct).toBe(true)
    expect(query.update).toBeUndefined()
  })
  it('rejects invalid answers before querying storage', async () => {
    expect((await POST(request({ selected_answer: 'E' }))).status).toBe(400)
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
