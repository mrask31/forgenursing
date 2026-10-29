import bank from '../content/source-checked-bank.json'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DEMO_LESSONS, LEGACY_DEMO_LESSONS, demoLesson, DEMO_SESSION_SIZE, selectDemoLessons, demoFeedback, publicDemoQuestion } from '../src/lib/demo-lessons'
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
  it('rotates twelve bank lessons into three distinct questions without mutating the bank', () => {
    expect(DEMO_LESSONS).toHaveLength(12)
    const original = DEMO_LESSONS.map(lesson => lesson.sourceStem)
    const selected = selectDemoLessons(() => 0)
    expect(selected).toHaveLength(DEMO_SESSION_SIZE)
    expect(new Set(selected.map(lesson => lesson.sourceStem)).size).toBe(3)
    expect(DEMO_LESSONS.map(lesson => lesson.sourceStem)).toEqual(original)
    expect(selectDemoLessons(() => 0.999).map(lesson => lesson.sourceStem)).toEqual(original.slice(0, 3))
    expect(selected.map(lesson => lesson.sourceStem)).not.toEqual(original.slice(0, 3))
    for (const lesson of DEMO_LESSONS.slice(3)) {
      expect(lesson.sources.length).toBeGreaterThan(0)
      for (const source of lesson.sources) expect(source.url).toMatch(/^https:\/\//)
    }
  })
  it('uses the unchanged signed-in bank content and no legacy demo stems', () => {
    for (const lesson of DEMO_LESSONS) {
      const packet = bank.find(entry => entry.packet.packet_id === lesson.bankQuestionId)!.packet
      expect(lesson.sourceStem).toBe(packet.original.question_stem)
      expect(LEGACY_DEMO_LESSONS.some(old => old.initial.question_stem === lesson.sourceStem || old.retry.question_stem === lesson.sourceStem)).toBe(false)
      for (const [item, q] of [[lesson.initial, packet.original], [lesson.retry, packet.retry]] as const) {
        expect(item.options).toEqual(q.options)
        expect(item.correct_answer).toBe(q.correct_answer)
        expect(item.why_correct_short).toBe(q.rationale_correct)
        expect(item.rationales).toEqual(q.rationale_incorrect)
      }
    }
  })
  it('has a distinct explanation for every distractor and keeps answer keys private', () => {
    for (const lesson of DEMO_LESSONS) for (const item of [lesson.initial, lesson.retry]) {
      expect(item.options).toHaveLength(4)
      expect(new Set(item.options.map(option => option.label)).size).toBe(4)
      expect(item.options.some(option => option.label === item.correct_answer)).toBe(true)
      const wrong = item.options.filter(option => option.label !== item.correct_answer)
      expect(new Set(wrong.map(option => item.rationales[option.label])).size).toBe(3)
      for (const option of wrong) expect(item.rationales[option.label].trim().length).toBeGreaterThan(0)
      expect(Object.keys(publicDemoQuestion(item, qid)).sort()).toEqual(['id','options','question_index','question_stem'])
    }
  })
  it('offers retries only after an original miss and explains the chosen option', () => {
    const lesson = DEMO_LESSONS[0]
    const wrong = Object.keys(lesson.initial.rationales)[0]
    expect(demoFeedback(lesson, wrong).why_wrong_short).toBe(lesson.initial.rationales[wrong])
    expect(demoFeedback(lesson, Object.keys(lesson.initial.rationales)[0]).retry_available).toBe(true)
    expect(demoFeedback(lesson, lesson.initial.correct_answer).retry_available).toBe(false)
    expect(demoFeedback(lesson, 'A', true).retry_available).toBe(false)
  })
  it('preserves feedback for in-flight legacy sessions', () => {
    for (const lesson of LEGACY_DEMO_LESSONS) expect(demoLesson(lesson.sourceStem)).toBe(lesson)
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
    expect(data.question.question_stem).toBe(DEMO_LESSONS[0].retry.question_stem)
  })
  it.each([null, { ...eligible, completed_at: 'today' }, { ...eligible, questions: [] }, { ...eligible, answers: [] }, { ...eligible, answers: [{ question_id: qid, is_correct: true }] }])('rejects unavailable or ineligible sessions', async session => {
    setup(session)
    expect((await POST(request())).status).toBe(403)
  })
  it('scores the related question without rewriting the original score', async () => {
    const query = setup(eligible)
    const response = await POST(request({ selected_answer: DEMO_LESSONS[0].retry.correct_answer }))
    expect((await response.json()).feedback.is_correct).toBe(true)
    expect(query.update).toBeUndefined()
  })
  it('rejects invalid answers before querying storage', async () => {
    expect((await POST(request({ selected_answer: 'E' }))).status).toBe(400)
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
