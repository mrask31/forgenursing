import type { SupabaseClient } from '@supabase/supabase-js'
import { stableTrialPayload, TRIAL_RETRY_WINDOW_MS } from './trial-engagement'

export function retakePurchaseEmail(accessUntil: string) {
  const end = new Date(accessUntil)
  if (!Number.isFinite(end.getTime())) throw new Error('Missing actual pass expiry')
  const date = end.toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
  const subject = 'Your Retake Pass is active'
  const paragraphs = [
    `Your ForgeNursing Retake Pass is active, with access through ${date}.`,
    'Your $29.99 payment covers 3 months. Nothing auto-renews.',
    '1. Open Home to add your exam date or performance report. Enter the Below, Near, or Above ratings you have to help choose your study focus.',
    '2. Start your first bank practice session. Read the explanations and try a related retry after a miss.',
    '3. Misses schedule reviews you can take anytime during your access. Return to Review to revisit the distinctions you want to remember.',
    "If you don't pass, one free three-month extension is available after your initial three months. No proof is required. You can claim it in Account; nothing auto-renews.",
    'Open Account to view your access and reach your invoices and payment details.',
    'Reply anytime if you need a hand. I read your feedback personally.',
  ]
  const links = [['Home', 'https://forgenursing.com/entry'], ['Start bank practice', 'https://forgenursing.com/quiz'], ['Account', 'https://forgenursing.com/settings']]
  const signoff = '— Michael\nFounder, ForgeNursing\nFormer Navy Hospital Corpsman, FMF'
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return { subject, text: [...paragraphs, ...links.map(([label, url]) => `${label}: ${url}`), signoff].join('\n\n'), html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0B2545;line-height:1.7"><h1 style="color:#0D8F9C">${subject}</h1>${paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}${links.map(([label, url]) => `<p><a href="${url}" style="color:#087986;font-weight:bold">${label} →</a></p>`).join('')}<p>${signoff.replace(/\n/g, '<br>')}</p></div>` }
}
const TABLE = 'retake_purchase_emails'
export type PurchaseDelivery = { id: string; pass_id: string; user_id: string; email: string; access_until: string; status: string; first_attempt_at: string | null; updated_at: string; provider_message_id: string | null; payload: Record<string, unknown> | null }
export async function deliverPurchaseEmail(admin: SupabaseClient, row: PurchaseDelivery, options: { now?: number; transport?: typeof fetch } = {}) {
  const now = options.now ?? Date.now()
  if (!['pending', 'sending', 'uncertain'].includes(row.status) || row.provider_message_id) return 'skipped'
  if (row.first_attempt_at) {
    const first = Date.parse(row.first_attempt_at), updated = Date.parse(row.updated_at)
    if (!Number.isFinite(first) || now - first >= TRIAL_RETRY_WINDOW_MS || now < first || !row.payload) {
      await admin.from(TABLE).update({ status: 'reconciliation_required', error_code: 'retry_window_closed' }).eq('id', row.id).eq('updated_at', row.updated_at)
      return 'reconciliation_required'
    }
    if (!Number.isFinite(updated) || now - updated < 5 * 60 * 1000) return 'skipped'
  }
  const stamp = new Date(now).toISOString()
  const payload = row.payload ?? { from: 'ForgeNursing <welcome@forgenursing.com>', to: [row.email], reply_to: 'support@forgenursing.com', ...retakePurchaseEmail(row.access_until) }
  const claim = await admin.from(TABLE).update({ status: 'sending', updated_at: stamp, first_attempt_at: row.first_attempt_at ?? stamp, payload }).eq('id', row.id).eq('status', row.status).eq('updated_at', row.updated_at).select('id').maybeSingle()
  if (claim.error || !claim.data) return 'skipped'
  const finish = async (values: Record<string, unknown>) => {
    const result = await admin.from(TABLE).update({ ...values, updated_at: new Date(now).toISOString() }).eq('id', row.id).eq('status', 'sending').eq('updated_at', stamp).select('id').maybeSingle()
    return !result.error && Boolean(result.data)
  }
  const pass = await admin.from('retake_passes').select('audience,refunded_at,access_until').eq('id', row.pass_id).maybeSingle()
  if (pass.error) { await finish({ status: 'uncertain', error_code: 'pass_lookup_failed' }); return 'failed' }
  if (!pass.data || pass.data.audience !== 'production' || pass.data.refunded_at || Date.parse(pass.data.access_until) <= now) {
    await finish({ status: 'skipped', error_code: 'pass_not_active' }); return 'skipped'
  }
  try {
    const response = await (options.transport ?? fetch)('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY?.trim()}`, 'Content-Type': 'application/json', 'Idempotency-Key': `retake-purchase/${row.pass_id}` }, body: stableTrialPayload(payload), signal: AbortSignal.timeout(15000), redirect: 'error', cache: 'no-store' })
    const body = await response.json().catch(() => ({}))
    if (response.ok && typeof body.id === 'string' && body.id) return await finish({ status: 'sent', provider_message_id: body.id, error_code: null }) ? 'sent' : 'reconciliation_required'
    await finish({ status: 'uncertain', error_code: `resend_http_${response.status}` })
  } catch { await finish({ status: 'uncertain', error_code: 'provider_outcome_unknown' }) }
  return 'failed'
}
