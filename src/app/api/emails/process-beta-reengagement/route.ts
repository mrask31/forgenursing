import { NextResponse } from 'next/server'
import {
  verifyAuthorization,
  createServiceRoleClient,
  processPendingEmails,
} from '@/lib/emails/email-utils'
import { getBetaDay7EligibleUsers } from '@/lib/emails/email-eligibility'

export async function POST(request: Request) {
  try {
    // Verify authorization
    if (!verifyAuthorization(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()

    const results = {
      day_7_queued: 0,
      sent: 0,
      failed: 0,
      errors: [] as Array<{ email: string; type: string; error: string }>,
    }

    // ---------------------------------------------------------------
    // Phase 1: Query eligible beta users and insert pending email_queue records
    // ---------------------------------------------------------------

    const day7Users = await getBetaDay7EligibleUsers(supabase)
    for (const user of day7Users) {
      const { error } = await supabase.from('email_queue').insert({
        user_id: user.user_id,
        email: user.email,
        email_type: 'beta_day_7_reengagement',
        status: 'pending',
      })
      // ON CONFLICT (user_id, email_type) DO NOTHING is handled by the
      // unique constraint — Supabase returns a 409/conflict error which
      // we intentionally ignore for idempotency.
      if (!error) {
        results.day_7_queued++
      }
    }

    // ---------------------------------------------------------------
    // Phase 2: Send all pending beta re-engagement emails
    // ---------------------------------------------------------------
    const sendResult = await processPendingEmails(supabase, [
      'beta_day_7_reengagement',
    ])

    results.sent = sendResult.sent
    results.failed = sendResult.failed
    results.errors = sendResult.errors

    return NextResponse.json({
      success: true,
      day_7_queued: results.day_7_queued,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    })
  } catch (error: any) {
    console.error('[Beta Re-engagement] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
