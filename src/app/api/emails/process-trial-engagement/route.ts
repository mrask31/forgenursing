import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deliverTrialEngagement, trialEmailAuthorized, type TrialStep } from '@/lib/emails/trial-engagement'

export const maxDuration = 300
export async function POST(request: Request) {
  if (!trialEmailAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (process.env.VERCEL_ENV !== 'production') return NextResponse.json({ error: 'production_only' }, { status: 503 })
  if (!process.env.RESEND_API_KEY?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return NextResponse.json({ error: 'email_configuration_missing' }, { status: 503 })
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const results = { sent: 0, skipped: 0, failed: 0, reconciliation_required: 0 }
  const steps: [TrialStep, string][] = [['trial_day_3', 'get_trial_day3_eligible_users'], ['trial_day_5', 'get_trial_day5_eligible_users']]
  for (const [step, rpc] of steps) {
    const { data, error } = await admin.rpc(rpc)
    if (error) { results.failed++; continue }
    for (const user of data ?? []) {
      try { results[await deliverTrialEngagement(admin, user, step)]++ }
      catch { results.failed++ }
    }
  }
  return NextResponse.json({ success: results.failed === 0 && results.reconciliation_required === 0, ...results },
    { status: results.failed || results.reconciliation_required ? 503 : 200 })
}

export const GET = POST
