import { afterEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ client: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.client }))
import { GET } from '../src/app/api/emails/process-trial-engagement/route'
import { GET as expiration } from '../src/app/api/emails/process-trial-expiration/route'
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

describe('expiry processor guards', () => {
  it('requires authorization before creating the service client', async () => {
    vi.stubEnv('CRON_SECRET','secret')
    expect((await expiration(new Request('https://example.invalid'))).status).toBe(401)
    expect(mocks.client).not.toHaveBeenCalled()
  })
  it('never sends from a preview', async () => {
    vi.stubEnv('CRON_SECRET','secret');vi.stubEnv('VERCEL_ENV','preview')
    expect((await expiration(new Request('https://example.invalid',{headers:{authorization:'Bearer secret'}}))).status).toBe(503)
    expect(mocks.client).not.toHaveBeenCalled()
  })
  it('reports candidate-query failure as retryable rather than a false success', async () => {
    vi.stubEnv('CRON_SECRET','secret');vi.stubEnv('VERCEL_ENV','production')
    vi.stubEnv('RESEND_API_KEY','test');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test');vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.invalid')
    mocks.client.mockReturnValue({rpc:vi.fn(async()=>({data:null,error:{message:'database unavailable'}}))})
    const response=await expiration(new Request('https://example.invalid',{headers:{authorization:'Bearer secret'}}))
    expect(response.status).toBe(503);expect(await response.json()).toMatchObject({success:false,failed:2,sent:0})
  })
})
