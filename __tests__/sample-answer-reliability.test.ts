import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { submitSampleAnswer, AnswerSubmissionError } from '../src/lib/submit-sample-answer'
const mocks = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.create }))
import { POST } from '../src/app/api/answer-trap-check/answer/route'
const sid = '00000000-0000-4000-8000-000000000001'
const qid = '00000000-0000-4000-8000-000000000002'
const requestId = '00000000-0000-4000-8000-000000000003'
const payload = { session_id: sid, question_id: qid, question_index: 0, selected_answer: 'A' }
const feedback = { is_correct: true, correct_answer: 'A', trap_type: 'Safety', trap_display_name: 'Safety', key_cue: 'cue', why_correct_short: 'reason', why_wrong_short: 'comparison', one_line_fix: 'lesson' }
const savedAnswer = { question_id: qid, selected_answer: 'B', is_correct: false, trap_type: 'Safety' }
function request() { return new NextRequest('https://example.test/api/answer-trap-check/answer', { method: 'POST', headers: { 'x-request-id': requestId }, body: JSON.stringify(payload) }) }
function setup(answers: typeof savedAnswer[] = [], completed = false, saved: { id: string } | null = { id: sid }) {
  const query = { select: vi.fn(), eq: vi.fn(), is: vi.fn(), single: vi.fn(), update: vi.fn(), maybeSingle: vi.fn() }
  for (const method of ['select', 'eq', 'is', 'update'] as const) query[method].mockReturnValue(query)
  query.single.mockResolvedValueOnce({ data: { id: sid, questions: [qid], answers, completed_at: completed ? '2026-10-14T00:00:00Z' : null } })
    .mockResolvedValueOnce({ data: { question_stem: 'Nonclinical test fixture', options: [{ label: 'A', text: 'Option A' }, { label: 'B', text: 'Option B' }], ...feedback } })
  query.maybeSingle.mockResolvedValue({ data: saved, error: null })
  mocks.create.mockReturnValue({ from: () => query })
  return query
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.test')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only-not-a-real-key')
})
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); vi.restoreAllMocks() })
describe('sample answer transport', () => {
  it('returns only valid feedback and sends a request reference', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(feedback)); vi.stubGlobal('fetch', fetcher)
    expect(await submitSampleAnswer(payload)).toMatchObject(feedback)
    expect(fetcher.mock.calls[0][1].headers['X-Request-ID']).toMatch(/^[a-f0-9-]{36}$/)
  })
  it('handles an HTML gateway error without leaking its body or replaying the answer', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('<html>upstream details</html>', { status: 502 })); vi.stubGlobal('fetch', fetcher)
    const failure = await submitSampleAnswer(payload).catch(e => e)
    expect(failure).toBeInstanceOf(AnswerSubmissionError)
    expect(failure).toMatchObject({ code: 'http', status: 502 })
    expect(failure.message).not.toContain('upstream details')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('rejects malformed successful responses instead of showing unsaved feedback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ saved: true })))
    await expect(submitSampleAnswer(payload)).rejects.toMatchObject({ code: 'invalid_response', status: 200 })
  })
  it('preserves a recoverable message for network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(submitSampleAnswer(payload)).rejects.toMatchObject({ code: 'network', status: null })
  })
  it('bounds a stalled submission and reports a timeout', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))))))
    const pending = submitSampleAnswer(payload).catch(e => e)
    await vi.advanceTimersByTimeAsync(20_000)
    expect(await pending).toMatchObject({ code: 'timeout' })
  })
})
describe('sample answer persistence', () => {
  it('rejects malformed input without querying the session', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const query = setup()
    const response = await POST(new NextRequest('https://example.test/api/answer-trap-check/answer', { method: 'POST', body: '{bad json' }))
    expect(response.status).toBe(400)
    expect(query.single).not.toHaveBeenCalled()
  })
  it('conditions updates on the prior answers and unfinished session', async () => {
    const query = setup()
    expect((await POST(request())).status).toBe(200)
    expect(query.eq).toHaveBeenCalledWith('answers', '[]')
    expect(query.is).toHaveBeenCalledWith('completed_at', null)
  })
  it('does not claim success when a competing request changed the session', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setup([], false, null)
    const response = await POST(request())
    expect(response.status).toBe(409)
    expect(response.headers.get('x-request-id')).toBe(requestId)
    expect(await response.json()).not.toHaveProperty('is_correct')
  })
  it('returns the original saved answer on duplicate submissions, including completed sessions', async () => {
    const query = setup([savedAnswer], true)
    const response = await POST(request())
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ is_correct: false })
    expect(query.update).not.toHaveBeenCalled()
  })
  it('reports save failures without returning feedback', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const query = setup(); query.maybeSingle.mockResolvedValue({ data: null, error: { code: 'TEST_FAILURE' } })
    const response = await POST(request())
    expect(response.status).toBe(500)
    expect(await response.json()).not.toHaveProperty('is_correct')
  })
})
