import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deliverTrialEngagement, trialEmailAuthorized, stableTrialPayload, TRIAL_RETRY_WINDOW_MS, trialStepEligible, buildTrialPayload, type TrialStep } from '../src/lib/emails/trial-engagement'
import type { SupabaseClient } from '@supabase/supabase-js'

vi.mock('../src/lib/emails/retake-pass-eligibility', () => ({ hasPurchasedRetakePass: vi.fn(async () => false) }))
import { hasPurchasedRetakePass } from '../src/lib/emails/retake-pass-eligibility'

const now = Date.parse('2026-10-29T02:00:00Z')
const candidate = { user_id: 'fixture', email: 'fixture@example.invalid', trial_ends_at: '2026-11-02T02:00:00Z' }
function fixture(options: { saveFails?: boolean; claimFails?: boolean; paid?: boolean; optedOut?: boolean; throws?: boolean; emptyId?: boolean } = {}, step: TrialStep = 'trial_day_3', expiry = candidate.trial_ends_at) {
  const rows: any[] = []
  const requests: any[] = []
  const transport = vi.fn(async (_url: any, init: any) => {
    requests.push({ body: init.body, key: init.headers['Idempotency-Key'] })
    if (options.throws) throw new Error('private provider detail')
    return new Response(JSON.stringify(options.emptyId ? {} : { id: 'accepted-id' }), { status: 200 })
  }) as unknown as typeof fetch
  const admin = {
    auth: { admin: { getUserById: async () => ({ data: { user: { email: candidate.email,
      email_confirmed_at: new Date(now).toISOString(), user_metadata: { email_opt_out: options.optedOut } } }, error: null }) } },
    from(table: string) {
      const filters: [string, unknown][] = []
      let insert: any, update: any
      const q: any = {
        select: () => q, eq: (k: string, v: unknown) => { filters.push([k,v]); return q }, maybeSingle: () => q,
        insert: (value: any) => { insert = value; return q }, update: (value: any) => { update = value; return q },
        then(resolve: any, reject: any) { return Promise.resolve().then(() => {
          if (table === 'profiles') return { data: { is_beta: false, subscription_status: options.paid ? 'active' : 'trialing',
            stripe_subscription_id: null, trial_ends_at: expiry }, error: null }
          if (insert) {
            if (options.claimFails) return { data: null, error: { code: 'database_unavailable' } }
            if (rows.some(r => r.user_id===insert.user_id && r.step===insert.step)) return { data: null, error: { code: '23505' } }
            const row = { id: 'claim', provider_message_id: null, ...structuredClone(insert) }; rows.push(row)
            return { data: structuredClone(row), error: null }
          }
          const row=rows.find(r=>filters.every(([k,v])=>r[k]===v))
          if (update && row) {
            if (options.saveFails && update.status==='sent') return { data: null, error: { code: 'receipt_write_failed' } }
            Object.assign(row,structuredClone(update))
          }
          return { data: row ? structuredClone(row) : null, error: null }
        }).then(resolve,reject) },
      }; return q
    },
  } as unknown as SupabaseClient
  return { rows,requests,transport,send: (at=now) => deliverTrialEngagement(admin,{...candidate,trial_ends_at:expiry},step,{now:at,transport}) }
}
describe('trial engagement delivery', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(now); vi.mocked(hasPurchasedRetakePass).mockResolvedValue(false) })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })
  it('claims once under concurrency and skips a recorded success', async () => {
    const f=fixture(); const results=await Promise.all([f.send(),f.send()])
    expect(results.filter(x=>x==='sent')).toHaveLength(1); expect(f.requests).toHaveLength(1)
    expect(await f.send()).toBe('skipped'); expect(f.rows[0].provider_message_id).toBe('accepted-id')
  })
  it('never sends when the claim fails', async () => {
    const f=fixture({claimFails:true}); expect(await f.send()).toBe('failed'); expect(f.requests).toHaveLength(0)
  })
  it.each([{paid:true},{optedOut:true}])('rechecks eligibility after the claim: %j', async options => {
    const f=fixture(options); expect(await f.send()).toBe('skipped'); expect(f.requests).toHaveLength(0)
  })
  it('suppresses a pass holder even when the profile still says trialing', async () => {
    vi.mocked(hasPurchasedRetakePass).mockResolvedValue(true)
    const f=fixture(); expect(await f.send()).toBe('skipped'); expect(f.requests).toHaveLength(0)
  })
  it('keeps a lost receipt safe and retries the identical provider request', async () => {
    const options={saveFails:true}; const f=fixture(options)
    expect(await f.send()).toBe('reconciliation_required')
    options.saveFails=false; vi.setSystemTime(now+3600000)
    expect(await f.send(now+3600000)).toBe('sent')
    expect(f.requests[1]).toEqual(f.requests[0])
  })
  it('holds old uncertain outcomes instead of sending after key expiry', async () => {
    const f=fixture({throws:true}); expect(await f.send()).toBe('failed')
    expect(f.rows[0].error_code).toBe('provider_outcome_unknown')
    expect(await f.send(now+TRIAL_RETRY_WINDOW_MS)).toBe('reconciliation_required'); expect(f.requests).toHaveLength(1)
  })
  it('does not count an accepted response without an id as sent', async () => {
    const f=fixture({emptyId:true}); expect(await f.send()).toBe('failed'); expect(f.rows[0].status).toBe('uncertain')
  })
  it('never replays held legacy records', async () => {
    const f=fixture(); f.rows.push({id:'old',user_id:candidate.user_id,step:'trial_day_3',status:'legacy_hold'})
    expect(await f.send()).toBe('skipped'); expect(f.requests).toHaveLength(0)
  })
  it('keeps a jsonb-reordered payload byte-identical', () => {
    expect(stableTrialPayload({to:['fixture@example.invalid'],text:'same',subject:'same'}))
      .toBe(stableTrialPayload({subject:'same',text:'same',to:['fixture@example.invalid']}))
  })
  it('rejects missing secrets including a literal undefined bearer', () => {
    vi.stubEnv('CRON_SECRET',''); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','')
    expect(trialEmailAuthorized(new Request('https://example.invalid',{headers:{authorization:'Bearer undefined'}}))).toBe(false)
  })
})

describe('expiry eligibility and wording', () => {
  const profile = {is_beta:false,subscription_status:'trialing',stripe_subscription_id:null,trial_ends_at:new Date(now+3600000).toISOString()}
  it('includes a trialing account in Day 6, suppresses it before the window and after expiry', () => {
    expect(trialStepEligible(profile,'trial_day_6',now)).toBe(true)
    expect(trialStepEligible(profile,'trial_day_6',now-26*3600000)).toBe(false)
    expect(trialStepEligible(profile,'trial_day_6',now+3600000)).toBe(false)
  })
  it.each(['trialing','expired'])('expiry does not depend on a separate status job: %s', subscription_status => {
    const p={...profile,subscription_status,trial_ends_at:new Date(now-3600000).toISOString()}
    expect(trialStepEligible(p,'trial_expired',now)).toBe(true)
    expect(trialStepEligible(p,'trial_expired',now+86400000)).toBe(false)
  })
  it.each([{subscription_status:'active'},{is_beta:true},{stripe_subscription_id:'sub_paid'},{trial_ends_at:'invalid'}])('suppresses ineligible recipients %j', change => {
    expect(trialStepEligible({...profile,...change},'trial_day_6',now)).toBe(false)
    expect(trialStepEligible({...profile,trial_ends_at:new Date(now-1).toISOString(),...change},'trial_expired',now)).toBe(false)
  })
  it('uses the actual expiry date, past tense after expiry, reply-to and current offer', () => {
    const payload=buildTrialPayload(candidate,'trial_expired')
    expect(payload.text).toContain('Your trial ended November 1')
    expect(payload.text).toContain('$29.99 one-time for 3 months')
    expect(payload.text).toContain('Nothing auto-renews')
    expect(payload.reply_to).toBe('support@forgenursing.com')
    expect(payload.text).not.toContain('Your trial ends')
  })
})

it('sends an expiry message for a still-trialing profile exactly once under concurrency', async () => {
  const f=fixture({},'trial_expired',new Date(now-3600000).toISOString())
  const results=await Promise.all([f.send(),f.send()])
  expect(results.filter(x=>x==='sent')).toHaveLength(1)
  expect(f.requests).toHaveLength(1)
  expect(JSON.parse(f.requests[0].body).subject).toBe('Your ForgeNursing trial has ended')
  expect(await f.send()).toBe('skipped')
})
it('never sends a Day 6 reminder that has become an expiry notice while queued', async () => {
  const f=fixture({},'trial_day_6',new Date(now-3600000).toISOString())
  expect(await f.send()).toBe('skipped');expect(f.requests).toHaveLength(0)
})
