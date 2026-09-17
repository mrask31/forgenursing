import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn(), service: vi.fn(), updateUser: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.auth, updateUser: mocks.updateUser }, from: mocks.from }) }))
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.service }))
import { POST as trial } from '../src/app/api/auth/set-trial/route'
import { POST as claim } from '../src/app/api/answer-trap-check/claim/route'
import { PUT as savePlan } from '../src/app/api/retake-plan/route'

beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null })
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only'
})
function claimRequest() { return new NextRequest('http://localhost/api/answer-trap-check/claim', { method: 'POST', body: JSON.stringify({ session_id: 'check', anonymous_id: 'anon' }) }) }
function serviceSession(session: object, claimed: object[] = [{ id: 'check' }]) {
  const update = vi.fn()
  const select = vi.fn()
  const query: any = { select, eq: vi.fn(), single: vi.fn(), update, is: vi.fn() }
  select.mockReturnValue(query); query.eq.mockReturnValue(query); query.is.mockReturnValue(query)
  query.single.mockResolvedValue({ data: session, error: null })
  update.mockImplementation(() => { select.mockResolvedValue({ data: claimed, error: null }); return query })
  mocks.service.mockReturnValue({ from: () => query })
  return query
}
describe('trial access is owned by database provisioning', () => {
  it('rejects anonymous calls without opening privileged storage', async () => {
    mocks.auth.mockResolvedValue({ data: { user: null }, error: null })
    expect((await trial()).status).toBe(401)
    expect(mocks.from).not.toHaveBeenCalled()
    expect(mocks.service).not.toHaveBeenCalled()
  })
  it('reads the authenticated account and returns unchanged dates on repeat calls', async () => {
    const profile = { is_beta: true, beta_expires_at: '2026-09-01', trial_ends_at: '2026-06-10' }
    const eq = vi.fn().mockReturnValue({ single: async () => ({ data: profile }) })
    mocks.from.mockReturnValue({ select: () => ({ eq }) })
    const first = await (await trial()).json()
    expect(await (await trial()).json()).toEqual(first)
    expect(eq).toHaveBeenCalledWith('id', 'owner')
    expect(first.betaExpiresAt).toBe('2026-09-01')
    expect(mocks.service).not.toHaveBeenCalled()
  })
})
describe('starter check ownership', () => {
  it('rejects anonymous claims', async () => {
    mocks.auth.mockResolvedValue({ data: { user: null }, error: null })
    expect((await claim(claimRequest())).status).toBe(401)
  })
  it('rejects another account’s claimed check', async () => {
    const query = serviceSession({ anonymous_id: 'anon', user_id: 'other', completed_at: 'today' })
    expect((await claim(claimRequest())).status).toBe(409)
    expect(query.update).not.toHaveBeenCalled()
  })
  it('rejects unfinished checks and incorrect anonymous credentials', async () => {
    const query = serviceSession({ anonymous_id: 'anon', user_id: null, completed_at: null })
    expect((await claim(claimRequest())).status).toBe(409)
    expect(query.update).not.toHaveBeenCalled()
    serviceSession({ anonymous_id: 'different', user_id: null, completed_at: 'today' })
    expect((await claim(claimRequest())).status).toBe(403)
  })
  it('claims only an unowned row, and reports a concurrent claim', async () => {
    const query = serviceSession({ anonymous_id: 'anon', user_id: null, completed_at: 'today' })
    expect((await claim(claimRequest())).status).toBe(200)
    expect(query.is).toHaveBeenCalledWith('user_id', null)
    serviceSession({ anonymous_id: 'anon', user_id: null, completed_at: 'today' }, [])
    expect((await claim(claimRequest())).status).toBe(409)
  })
  it('makes a repeat claim idempotent for the same owner', async () => {
    const query = serviceSession({ anonymous_id: 'anon', user_id: 'owner', completed_at: 'today' })
    expect((await (await claim(claimRequest())).json()).already_claimed).toBe(true)
    expect(query.update).not.toHaveBeenCalled()
  })
})
describe('plan preferences stay separate from access', () => {
  it('rejects anonymous saves', async () => {
    mocks.auth.mockResolvedValue({ data: { user: null }, error: null })
    expect((await savePlan(new Request('http://localhost', { method: 'PUT', body: '{}' }))).status).toBe(401)
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })
  it('only stores validated preferences on the current account', async () => {
    mocks.updateUser.mockResolvedValue({ error: null })
    const response = await savePlan(new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ completed: true, is_beta: true, user_id: 'other' }) }))
    expect(response.status).toBe(200)
    expect(mocks.updateUser).toHaveBeenCalledWith({ data: { retake_plan: { completed: true, targetDate: '', previousPrep: '', difficulty: null, cpr: {} } } })
  })
})
