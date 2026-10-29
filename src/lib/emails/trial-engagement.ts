import { retakeLifecycleEmail } from '@/lib/emails/retake-lifecycle'
import type { SupabaseClient } from '@supabase/supabase-js'
import { hasPurchasedRetakePass } from './retake-pass-eligibility'

export type TrialStep = 'trial_day_3' | 'trial_day_5'
type Candidate = { user_id: string; email: string; trial_ends_at: string }
type Payload = { from: string; to: string[]; reply_to: string; subject: string; text: string }
type Delivery = {
  id: string; status: string; created_at: string; updated_at: string;
  provider_message_id: string | null; payload: Payload | null
}
export type TrialDeliveryResult = 'sent' | 'skipped' | 'failed' | 'reconciliation_required'
export const TRIAL_RETRY_WINDOW_MS = 23 * 60 * 60 * 1000
const LEASE_MS = 5 * 60 * 1000
const TABLE = 'trial_engagement_deliveries'
// jsonb can reorder object keys. Canonicalize the first request and retries.
export function stableTrialPayload(payload: unknown): string {
  return JSON.stringify(payload, (_key,value) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0)) : value)
}

export function trialEmailAuthorized(request: Request): boolean {
  const bearer = request.headers.get('authorization')
  const cron = process.env.CRON_SECRET?.trim()
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  return Boolean((cron && (bearer === `Bearer ${cron}` || request.headers.get('x-cron-secret') === cron))
    || (service && bearer === `Bearer ${service}`))
}

export function buildTrialPayload(candidate: Candidate, step: TrialStep): Payload {
  const ends = new Date(candidate.trial_ends_at).toLocaleDateString('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric' })
  const content = retakeLifecycleEmail(step === 'trial_day_3' ? 'day3' : 'day5', ends)
  return {from:'ForgeNursing <trial@forgenursing.com>',to:[candidate.email],reply_to:'support@forgenursing.com',subject:content.subject,text:content.text}

}

// Claim a unique user/step row before the provider. Freeze the payload so a
// retry across deployments uses the same body and stable provider key.
export async function deliverTrialEngagement(
  admin: SupabaseClient, candidate: Candidate, step: TrialStep,
  options: { now?: number; transport?: typeof fetch } = {},
): Promise<TrialDeliveryResult> {
  const now = options.now ?? Date.now()
  const { data, error } = await admin.from(TABLE).select('*').eq('user_id', candidate.user_id).eq('step', step).maybeSingle()
  if (error) return 'failed'
  const previous = data as Delivery | null
  if (previous && !['sending', 'uncertain'].includes(previous.status)) return 'skipped'
  if (previous?.provider_message_id) return 'reconciliation_required'
  if (previous) {
    const created = Date.parse(previous.created_at), updated = Date.parse(previous.updated_at)
    if (![created, updated].every(Number.isFinite) || now < created || now < updated
      || now - created >= TRIAL_RETRY_WINDOW_MS || !previous.payload) return 'reconciliation_required'
    if (now - updated < LEASE_MS) return 'skipped'
  }
  // Do not replay frozen messages advertising the retired subscription offer.
  if (previous?.payload && /\$9\.99|\$79/.test(previous.payload.text)) return 'reconciliation_required'
  const claimedAt = new Date(now).toISOString()
  const payload = previous?.payload ?? buildTrialPayload(candidate, step)
  const claim = previous
    ? await admin.from(TABLE).update({ status: 'sending', updated_at: claimedAt, error_code: null })
      .eq('id', previous.id).eq('status', previous.status).eq('updated_at', previous.updated_at).select('id').maybeSingle()
    : await admin.from(TABLE).insert({ user_id: candidate.user_id, step, status: 'sending', payload,
      created_at: claimedAt, updated_at: claimedAt }).select('id').maybeSingle()
  if (claim.error) return claim.error.code === '23505' ? 'skipped' : 'failed'
  if (!claim.data?.id) return 'skipped'
  const claimId = claim.data.id
  const finish = async (values: Record<string, unknown>) => {
    const saved = await admin.from(TABLE).update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', claimId).eq('status', 'sending').eq('updated_at', claimedAt).select('id').maybeSingle()
    return !saved.error && Boolean(saved.data)
  }
  // Recheck after the claim: payment, expiry or changed address must suppress
  // a stale trial prompt. Never change the stored recipient on a retry.
  const [profile, auth, purchasedPass] = await Promise.all([
    admin.from('profiles').select('is_beta,subscription_status,stripe_subscription_id,trial_ends_at').eq('id', candidate.user_id).maybeSingle(),
    admin.auth.admin.getUserById(candidate.user_id),
    hasPurchasedRetakePass(admin, candidate.user_id),
  ])
  if (profile.error || auth.error) {
    await finish({ status: 'uncertain', error_code: 'eligibility_unavailable' })
    return 'failed'
  }
  const p = profile.data, user = auth.data.user
  if (purchasedPass || !p || p.is_beta || p.subscription_status !== 'trialing' || p.stripe_subscription_id
    || !Number.isFinite(Date.parse(p.trial_ends_at)) || Date.parse(p.trial_ends_at) <= now
    || !user?.email_confirmed_at || user.email !== payload.to[0]
    || user.user_metadata?.email_opt_out === true || user.user_metadata?.marketing_emails === false) {
    return await finish({ status: 'skipped', error_code: 'no_longer_eligible' }) ? 'skipped' : 'failed'
  }
  try {
    const response = await (options.transport ?? fetch)('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY?.trim()}`,
        'Content-Type': 'application/json', 'Idempotency-Key': `trial-engagement/${candidate.user_id}/${step}` },
      body: stableTrialPayload(payload), signal: AbortSignal.timeout(15000), redirect: 'error', cache: 'no-store',
    })
    const body = await response.json().catch(() => ({}))
    if (response.ok && typeof body.id === 'string' && body.id) {
      return await finish({ status: 'sent', provider_message_id: body.id, error_code: null }) ? 'sent' : 'reconciliation_required'
    }
    await finish({ status: 'uncertain', error_code: `resend_http_${response.status}` })
    return 'failed'
  } catch {
    await finish({ status: 'uncertain', error_code: 'provider_outcome_unknown' })
    return 'failed'
  }
}
