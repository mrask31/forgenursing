import { retakeLifecycleEmail } from '@/lib/emails/retake-lifecycle'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// This endpoint processes the beta user email sequence (Day 3, Week 1, Day 30, Day 45, Day 60, Day 76, Day 90)
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
      console.error('[Beta Sequence] RESEND_API_KEY not configured')
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
      day_3_queued: 0,
      week_1_queued: 0,
      day_30_queued: 0,
      day_45_queued: 0,
      day_60_queued: 0,
      day_76_queued: 0,
      day_90_queued: 0,
      sent: 0,
      failed: 0,
      errors: [] as { email: string; type: string; error: string }[],
    }

    // Step 1: Find and queue Day 3 emails
    const { data: day3Users, error: day3Error } = await supabase
      .rpc('get_beta_users_for_day_3')

    if (day3Error) {
      console.error('[Beta Sequence] Error fetching Day 3 users:', day3Error)
    } else if (day3Users && day3Users.length > 0) {
      for (const user of day3Users) {
        await supabase.rpc('queue_beta_lifecycle_email', {
          p_user_id: user.user_id,
          p_email: user.email,
          p_email_type: 'day_3',
        })
        results.day_3_queued++
      }
    }

    // Step 2: Find and queue Week 1 emails
    const { data: week1Users, error: week1Error } = await supabase
      .rpc('get_beta_users_for_week_1')

    if (week1Error) {
      console.error('[Beta Sequence] Error fetching Week 1 users:', week1Error)
    } else if (week1Users && week1Users.length > 0) {
      for (const user of week1Users) {
        await supabase.rpc('queue_beta_lifecycle_email', {
          p_user_id: user.user_id,
          p_email: user.email,
          p_email_type: 'week_1',
        })
        results.week_1_queued++
      }
    }

    // Step 3: Find and queue Day 30 emails
    const { data: day30Users, error: day30Error } = await supabase
      .rpc('get_beta_users_for_day_30')

    if (day30Error) {
      console.error('[Beta Sequence] Error fetching Day 30 users:', day30Error)
    } else if (day30Users && day30Users.length > 0) {
      for (const user of day30Users) {
        await supabase.rpc('queue_beta_lifecycle_email', {
          p_user_id: user.user_id,
          p_email: user.email,
          p_email_type: 'day_30',
        })
        results.day_30_queued++
      }
    }

    // Step 4: Find and queue Day 45 emails
    const { data: day45Users, error: day45Error } = await supabase
      .rpc('get_beta_users_for_day_45')

    if (day45Error) {
      console.error('[Beta Sequence] Error fetching Day 45 users:', day45Error)
    } else if (day45Users && day45Users.length > 0) {
      for (const user of day45Users) {
        await supabase.rpc('queue_beta_lifecycle_email', {
          p_user_id: user.user_id,
          p_email: user.email,
          p_email_type: 'day_45',
        })
        results.day_45_queued++
      }
    }

    // Step 5: Find and queue Day 60 emails
    const { data: day60Users, error: day60Error } = await supabase
      .rpc('get_beta_users_for_day_60')

    if (day60Error) {
      console.error('[Beta Sequence] Error fetching Day 60 users:', day60Error)
    } else if (day60Users && day60Users.length > 0) {
      for (const user of day60Users) {
        await supabase.rpc('queue_beta_lifecycle_email', {
          p_user_id: user.user_id,
          p_email: user.email,
          p_email_type: 'day_60',
        })
        results.day_60_queued++
      }
    }

    // Step 6: Find and queue Day 76 emails (14 days before beta_expires_at)
    const { data: day76Users, error: day76Error } = await supabase
      .rpc('get_beta_users_for_day_76')

    if (day76Error) {
      console.error('[Beta Sequence] Error fetching Day 76 users:', day76Error)
    } else if (day76Users && day76Users.length > 0) {
      for (const user of day76Users) {
        await supabase.rpc('queue_beta_lifecycle_email', {
          p_user_id: user.user_id,
          p_email: user.email,
          p_email_type: 'day_76',
        })
        results.day_76_queued++
      }
    }

    // Step 7: Find and queue Day 90 emails (beta expiration day)
    const { data: day90Users, error: day90Error } = await supabase
      .rpc('get_beta_users_for_day_90')

    if (day90Error) {
      console.error('[Beta Sequence] Error fetching Day 90 users:', day90Error)
    } else if (day90Users && day90Users.length > 0) {
      for (const user of day90Users) {
        await supabase.rpc('queue_beta_lifecycle_email', {
          p_user_id: user.user_id,
          p_email: user.email,
          p_email_type: 'day_90',
        })
        results.day_90_queued++
      }
    }

    // Step 8: Process pending emails from queue
    const { data: pendingEmails, error: queueError } = await supabase
      .rpc('get_pending_beta_lifecycle_emails', { batch_size: 50 })

    if (queueError) {
      console.error('[Beta Sequence] Error fetching queue:', queueError)
      return NextResponse.json(
        { error: 'Failed to fetch queue', details: queueError },
        { status: 500 }
      )
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        ...results,
        sent: 0,
        message: 'No pending emails to send',
      })
    }

    // Step 9: Send each email
    for (const item of pendingEmails) {
      try {
        const daysRemaining = item.beta_expires_at
          ? Math.max(0, Math.ceil((new Date(item.beta_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0

        let subject: string
        let html: string

        if (item.email_type === 'day_3') {
          subject = "How's Forge treating you so far?"
          html = generateDay3Email(daysRemaining)
        } else if (item.email_type === 'week_1') {
          subject = 'One week in — have you tried it yet?'
          html = generateWeek1Email(daysRemaining)
        } else if (item.email_type === 'day_30') {
          subject = '30 days in — honest question for you'
          html = generateDay30Email(daysRemaining)
        } else if (item.email_type === 'day_45') {
          subject = 'The feature our most active users swear by'
          html = generateDay45Email(daysRemaining)
        } else if (item.email_type === 'day_60') {
          subject = "You've been with us since the beginning — here's what that means"
          html = generateDay60Email(daysRemaining)
        } else if (item.email_type === 'day_76') {
          subject = '14 days left — and this offer closes with it'
          html = generateDay76Email(daysRemaining)
        } else {
          // day_90
          subject = 'Your beta access ends today'
          html = generateDay90Email(daysRemaining)
        }

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'ForgeNursing <support@forgenursing.com>',
          to: item.email,
          replyTo: 'support@forgenursing.com',
          subject,
          html,
        })

        if (emailError) {
          throw emailError
        }

        // Mark as sent in beta_email_sequence
        const { error: markError } = await supabase.rpc('mark_beta_lifecycle_email_sent', {
          p_queue_id: item.id,
          p_success: true,
          p_email_id: emailData?.id || null,
          p_error_msg: null,
        })
        if (markError) {
          console.error(`[Beta Sequence] Failed to mark email as sent for ${item.email} (${item.email_type}):`, markError)
        }

        // Log to welcome_emails_sent
        const { error: upsertError } = await supabase.from('welcome_emails_sent').upsert(
          {
            user_id: item.user_id,
            email: item.email,
            type: item.email_type,
            sent_at: new Date().toISOString(),
            email_id: emailData?.id || null,
            status: 'sent',
          },
          { onConflict: 'user_id,type' }
        )
        if (upsertError) {
          console.error(`[Beta Sequence] Failed to log to welcome_emails_sent for ${item.email} (${item.email_type}):`, upsertError)
        }

        results.sent++
      } catch (error: any) {
        const { error: markError } = await supabase.rpc('mark_beta_lifecycle_email_sent', {
          p_queue_id: item.id,
          p_success: false,
          p_email_id: null,
          p_error_msg: error.message || 'Unknown error',
        })
        if (markError) {
          console.error(`[Beta Sequence] Failed to mark email as failed for ${item.email} (${item.email_type}):`, markError)
        }

        results.failed++
        results.errors.push({
          email: item.email,
          type: item.email_type,
          error: error.message,
        })
        console.error(`[Beta Sequence] Failed to send ${item.email_type} to ${item.email}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error: any) {
    console.error('[Beta Sequence] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Vercel cron invokes routes via GET with Authorization: Bearer $CRON_SECRET
export const GET = POST

// ─── Email Templates ────────────────────────────────────────────────────────

function generateDay3Email(_daysRemaining: number): string {
  void _daysRemaining
  return retakeLifecycleEmail('beta').html
}

function generateWeek1Email(_daysRemaining: number): string {
  void _daysRemaining
  return retakeLifecycleEmail('beta').html
}

function generateDay30Email(_daysRemaining: number): string {
  void _daysRemaining
  return retakeLifecycleEmail('beta').html
}

function generateDay45Email(_daysRemaining: number): string {
  void _daysRemaining
  return retakeLifecycleEmail('beta').html
}

function generateDay60Email(_daysRemaining: number): string {
  void _daysRemaining
  return retakeLifecycleEmail('beta').html
}

function generateDay76Email(_daysRemaining: number): string {
  void _daysRemaining
  return retakeLifecycleEmail('beta').html
}

function generateDay90Email(_daysRemaining: number): string {
  void _daysRemaining
  return retakeLifecycleEmail('beta').html
}
