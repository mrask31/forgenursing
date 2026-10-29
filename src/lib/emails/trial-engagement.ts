import type { SupabaseClient } from '@supabase/supabase-js'

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

export function trialEmailAuthorized(request: Request): boolean {
  const bearer = request.headers.get('authorization')
  const cron = process.env.CRON_SECRET?.trim()
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  return Boolean((cron && (bearer === `Bearer ${cron}` || request.headers.get('x-cron-secret') === cron))
    || (service && bearer === `Bearer ${service}`))
}

export function buildTrialPayload(candidate: Candidate, step: TrialStep): Payload {
  const ends = new Date(candidate.trial_ends_at).toLocaleDateString('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric' })
  const first = step === 'trial_day_3'
  return {
    from: 'ForgeNursing <trial@forgenursing.com>', to: [candidate.email], reply_to: 'support@forgenursing.com',
    subject: first ? 'Try one question, then one related retry' : 'Your ForgeNursing trial: what happens next',
    text: first
      ? `Hey — Mike here.\n\nStart with one practice question. Answer it, read the explanation, then try the related retry to put that reasoning to work. You do not need to finish a long study session to get started.\n\nOpen practice: https://forgenursing.com/quiz\n\nYour free trial ends on ${ends}. No card was required, and the free trial does not automatically charge you.\n\nIf something is getting in the way, reply and tell me.\n\nMike\nFounder, ForgeNursing`
      : `Hey — Mike here.\n\nYour ForgeNursing free trial ends on ${ends}. It does not automatically charge you. If you choose to subscribe, the current options are $9.99/month or $79/year; a paid subscription renews until canceled.\n\nBefore the trial ends, try one practice question, read the explanation and complete the related retry.\n\nReview plans: https://forgenursing.com/pricing\n\nQuestions or feedback? Reply here.\n\nMike\nFounder, ForgeNursing`,
  }
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
  const [profile, auth] = await Promise.all([
    admin.from('profiles').select('is_beta,subscription_status,stripe_subscription_id,trial_ends_at').eq('id', candidate.user_id).maybeSingle(),
    admin.auth.admin.getUserById(candidate.user_id),
  ])
  if (profile.error || auth.error) {
    await finish({ status: 'uncertain', error_code: 'eligibility_unavailable' })
    return 'failed'
  }
  const p = profile.data, user = auth.data.user
  if (!p || p.is_beta || p.subscription_status !== 'trialing' || p.stripe_subscription_id
    || !Number.isFinite(Date.parse(p.trial_ends_at)) || Date.parse(p.trial_ends_at) <= now
    || !user?.email_confirmed_at || user.email !== payload.to[0]
    || user.user_metadata?.email_opt_out === true || user.user_metadata?.marketing_emails === false) {
    return await finish({ status: 'skipped', error_code: 'no_longer_eligible' }) ? 'skipped' : 'failed'
  }
  try {
    const response = await (options.transport ?? fetch)('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY?.trim()}`,
        'Content-Type': 'application/json', 'Idempotency-Key': `trial-engagement/${candidate.user_id}/${step}` },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15000), redirect: 'error', cache: 'no-store',
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
