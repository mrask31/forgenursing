import { afterEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ client: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.client }))
import { GET } from '../src/app/api/emails/process-trial-engagement/route'
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })
describe('trial processor environment guards', () => {
  it('rejects an unauthorized request without initializing a client', async () => {
    vi.stubEnv('CRON_SECRET', 'secret')
    expect((await GET(new Request('https://example.invalid'))).status).toBe(401)
    expect(mocks.client).not.toHaveBeenCalled()
  })
  it.each(['preview','development',''])('cannot send from %s', async environment => {
    vi.stubEnv('CRON_SECRET','secret'); vi.stubEnv('VERCEL_ENV',environment)
    expect((await GET(new Request('https://example.invalid',{headers:{authorization:'Bearer secret'}}))).status).toBe(503)
    expect(mocks.client).not.toHaveBeenCalled()
  })
})
