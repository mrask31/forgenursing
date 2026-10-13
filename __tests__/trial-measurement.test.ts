import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), single: vi.fn(), capture: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser }, from: () => ({ select: () => ({ eq: () => ({ single: mocks.single }) }) }) }) }))
vi.mock('@/lib/analytics/server', () => ({ captureConversion: mocks.capture }))
import { POST } from '../src/app/api/analytics/trial/route'
const request = () => new Request('https://forgenursing.com/api/analytics/trial', { method: 'POST', body: JSON.stringify({ utm_source: 'instagram', utm_campaign: 'q05-ppe', is_qa: true, $session_id: 'test-session', email: 'must-not-send' }) })
beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'new-user', created_at: new Date(Date.now()-60000).toISOString() } } })
  mocks.single.mockResolvedValue({ data: { is_beta: false, trial_ends_at: new Date(Date.now()+86400000).toISOString(), subscription_status: 'trialing', stripe_subscription_id: null } })
  mocks.capture.mockResolvedValue(true)
})
describe('server verified trial measurement', () => {
  it('uses verified account identity, carries allowed attribution, and omits supplied personal data', async () => {
    expect((await POST(request())).status).toBe(204)
    expect(mocks.capture.mock.calls[1][0]).toMatchObject({ event: 'trial_signup_completed', distinct_id: 'new-user', conversion_id: 'signup:new-user', properties: { utm_source: 'instagram', utm_campaign: 'q05-ppe', is_qa: true, $session_id: 'test-session', site_host: 'forgenursing.com' } })
    expect(mocks.capture.mock.calls[1][0].properties.email).toBeUndefined()
  })
  it('rejects anonymous calls without emitting conversions', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    expect((await POST(request())).status).toBe(401)
    expect(mocks.capture).not.toHaveBeenCalled()
  })
  it('does not relabel an old account as a new signup', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'old', created_at: '2020-01-01' } } })
    expect((await POST(request())).status).toBe(204)
    expect(mocks.capture).not.toHaveBeenCalled()
  })
  it('returns a retryable response if the new measurement delivery fails', async () => {
    mocks.capture.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    expect((await POST(request())).status).toBe(503)
  })
})
