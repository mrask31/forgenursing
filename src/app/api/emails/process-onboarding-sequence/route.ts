import { NextResponse } from 'next/server'
import {
  verifyAuthorization,
  createServiceRoleClient,
  processPendingEmails,
} from '@/lib/emails/email-utils'
import {
  getDay3EligibleUsers,
  getDay6EligibleUsers,
} from '@/lib/emails/email-eligibility'

export async function POST(request: Request) {
  try {
    // Verify authorization
    if (!verifyAuthorization(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()

    const results = {
      day_3_queued: 0,
      day_6_queued: 0,
      sent: 0,
      failed: 0,
      errors: [] as Array<{ email: string; type: string; error: string }>,
    }

    // ---------------------------------------------------------------
    // Phase 1: Query eligible users and insert pending email_queue records
    // ---------------------------------------------------------------

    // Day 3 — inactive trial users
    const day3Users = await getDay3EligibleUsers(supabase)
    for (const user of day3Users) {
      const { error } = await supabase.from('email_queue').insert({
        user_id: user.user_id,
        email: user.email,
        email_type: 'onboarding_day_3',
        status: 'pending',
      })
      // ON CONFLICT (user_id, email_type) DO NOTHING is handled by the
      // unique constraint — Supabase returns a 409/conflict error which
      // we intentionally ignore for idempotency.
      if (!error) {
        results.day_3_queued++
      }
    }

    // Day 6 — trial users approaching expiration
    const day6Users = await getDay6EligibleUsers(supabase)
    for (const user of day6Users) {
      const { error } = await supabase.from('email_queue').insert({
        user_id: user.user_id,
        email: user.email,
        email_type: 'onboarding_day_6',
        status: 'pending',
      })
      if (!error) {
        results.day_6_queued++
      }
    }

    // ---------------------------------------------------------------
    // Phase 2: Send all pending onboarding emails (Day 0 + Day 3 + Day 6)
    // ---------------------------------------------------------------
    const sendResult = await processPendingEmails(supabase, [
      'onboarding_day_0',
      'onboarding_day_3',
      'onboarding_day_6',
    ])

    results.sent = sendResult.sent
    results.failed = sendResult.failed
    results.errors = sendResult.errors

    return NextResponse.json({
      success: true,
      day_3_queued: results.day_3_queued,
      day_6_queued: results.day_6_queued,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    })
  } catch (error: any) {
    console.error('[Onboarding Sequence] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// Vercel cron invokes routes via GET with Authorization: Bearer $CRON_SECRET
export const GET = POST
