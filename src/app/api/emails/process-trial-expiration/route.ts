import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// This endpoint processes trial expiration emails (Day 6 and Day 7)
// Should be called daily via cron job

export async function POST(request: Request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    
    const isAuthorized = 
      authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` ||
      authHeader === `Bearer ${process.env.CRON_SECRET}` ||
      cronSecret === process.env.CRON_SECRET

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[Trial Expiration] RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const results = {
      day_6_queued: 0,
      day_7_queued: 0,
      sent: 0,
      failed: 0,
      errors: [] as any[],
    }

    // Step 1: Find and queue Day 6 reminders (24h before expiration)
    const { data: day6Users, error: day6Error } = await supabase
      .rpc('get_users_for_day_6_reminder')

    if (day6Error) {
      console.error('[Trial Expiration] Error fetching Day 6 users:', day6Error)
    } else if (day6Users && day6Users.length > 0) {
      
      for (const user of day6Users) {
        await supabase.rpc('queue_trial_expiration_email', {
          p_user_id: user.user_id,
          p_email: user.email,
          p_email_type: 'day_6_reminder',
          p_trial_ends_at: user.trial_ends_at,
          p_questions_answered: user.questions_answered || 0,
        })
        results.day_6_queued++
      }
    }

    // Step 2: Find and queue Day 7 expiration notices (trial expired)
    const { data: day7Users, error: day7Error } = await supabase
      .rpc('get_users_for_day_7_expiration')

    if (day7Error) {
      console.error('[Trial Expiration] Error fetching Day 7 users:', day7Error)
    } else if (day7Users && day7Users.length > 0) {
      
      for (const user of day7Users) {
        await supabase.rpc('queue_trial_expiration_email', {
          p_user_id: user.user_id,
          p_email: user.email,
          p_email_type: 'day_7_expiration',
          p_trial_ends_at: user.trial_ends_at,
          p_questions_answered: user.questions_answered || 0,
        })
        results.day_7_queued++
      }
    }

    // Step 3: Process pending emails from queue
    const { data: pendingEmails, error: queueError } = await supabase
      .rpc('get_pending_trial_expiration_emails', { batch_size: 50 })

    if (queueError) {
      console.error('[Trial Expiration] Error fetching queue:', queueError)
      return NextResponse.json(
        { error: 'Failed to fetch queue', details: queueError },
        { status: 500 }
      )
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        day_6_queued: results.day_6_queued,
        day_7_queued: results.day_7_queued,
        sent: 0,
        message: 'No pending emails to send',
      })
    }


    // Step 4: Send each email — ONLY process valid email_type values
    const VALID_TYPES = ['day_6_reminder', 'day_7_expiration']

    for (const item of pendingEmails) {
      // Reject invalid email_type — do NOT send, mark as invalid
      if (!VALID_TYPES.includes(item.email_type)) {
        console.error(`[Trial Expiration] INVALID email_type '${item.email_type}' for ${item.email} — skipping send, marking invalid`)
        await supabase.rpc('mark_trial_expiration_email_sent', {
          p_email_id: item.id,
          p_resend_email_id: null,
          p_success: false,
          p_error_message: `Invalid email_type: ${item.email_type}. Only day_6_reminder and day_7_expiration are valid.`,
        })
        results.failed++
        results.errors.push({
          email: item.email,
          type: item.email_type,
          error: `Invalid email_type: ${item.email_type}`,
        })
        continue
      }

      try {
        let subject: string
        let html: string

        switch (item.email_type) {
          case 'day_6_reminder':
            subject = 'Your trial ends tomorrow'
            html = generateDay6Email()
            break
          case 'day_7_expiration':
            subject = 'Your trial has ended'
            html = generateDay7Email()
            break
          default:
            // Should never reach here due to VALID_TYPES check above
            throw new Error(`Unexpected email_type: ${item.email_type}`)
        }

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'ForgeNursing <trial@forgenursing.com>',
          to: item.email,
          subject,
          html,
        })

        if (emailError) {
          throw emailError
        }

        const { error: markError } = await supabase.rpc('mark_trial_expiration_email_sent', {
          p_email_id: item.id,
          p_resend_email_id: emailData?.id || null,
          p_success: true,
          p_error_message: null,
        })
        if (markError) {
          console.error(`[Trial Expiration] Failed to mark email as sent for ${item.email}:`, markError)
        }

        results.sent++
      } catch (error: any) {
        const { error: markError } = await supabase.rpc('mark_trial_expiration_email_sent', {
          p_email_id: item.id,
          p_resend_email_id: null,
          p_success: false,
          p_error_message: error.message || 'Unknown error',
        })
        if (markError) {
          console.error(`[Trial Expiration] Failed to mark email as failed for ${item.email}:`, markError)
        }

        results.failed++
        results.errors.push({
          email: item.email,
          type: item.email_type,
          error: error.message,
        })
        console.error(`[Trial Expiration] Failed to send to ${item.email}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      day_6_queued: results.day_6_queued,
      day_7_queued: results.day_7_queued,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    })
  } catch (error: any) {
    console.error('[Trial Expiration] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Vercel cron invokes routes via GET with Authorization: Bearer $CRON_SECRET
export const GET = POST

// Day 6 Email Template (24h before expiration)
function generateDay6Email(): string {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
  <p>Hey — Michael here.</p>
  <p>Your ForgeNursing trial ends tomorrow. I'll keep this short.</p>
  <p>If something clicked for you over the past 6 days — if you found yourself actually thinking through a patient scenario instead of just trying to remember the right answer — that's what ForgeNursing is built to do.</p>
  <p>Tomorrow that access goes away unless you choose to continue.</p>
  <p><strong>Monthly:</strong> $24.99/month<br><strong>Semester:</strong> $89 every 4 months<br><strong>Annual:</strong> $199/year</p>
  <p>If you have questions about which plan makes sense for where you are in your nursing journey, reply to this email. I'll help you figure it out personally.</p>
  <p>If it's not the right time, no hard feelings. I'd still love to know what wasn't working — reply and tell me.</p>
  <p>— Michael<br>Founder, ForgeNursing<br>Former Navy Hospital Corpsman, FMF</p>
  <a href="https://forgenursing.com/pricing" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Continue with ForgeNursing →</a>
</div>`
}

// Day 7 Email Template (Trial expired)
function generateDay7Email(): string {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
  <p>Hey — Michael here.</p>
  <p>Your ForgeNursing trial ended today. Your account is still there — nothing has been deleted — but your access is paused until you choose a plan.</p>
  <p>If you're ready to continue:</p>
  <p><strong>Monthly:</strong> $24.99/month<br><strong>Semester:</strong> $89 every 4 months<br><strong>Annual:</strong> $199/year</p>
  <a href="https://forgenursing.com/pricing" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Unlock My Account →</a>
  <p>If you're not ready right now, I get it. Timing matters.</p>
  <p>But if ForgeNursing didn't click for you at all — if something felt off, confusing, or just not useful — I'd genuinely like to know. Reply to this email and tell me what was missing. That feedback goes directly into what I build next.</p>
  <p>Either way, thank you for trying it.</p>
  <p>— Michael<br>Founder, ForgeNursing<br>Former Navy Hospital Corpsman, FMF</p>
</div>`
}
