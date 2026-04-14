import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// This endpoint processes the beta user email sequence (Day 3, Day 30, Day 76)
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
      day_30_queued: 0,
      day_76_queued: 0,
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

    // Step 2: Find and queue Day 30 emails
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

    // Step 3: Find and queue Day 76 emails (14 days before beta_expires_at)
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

    // Step 4: Process pending emails from queue
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
        day_3_queued: results.day_3_queued,
        day_30_queued: results.day_30_queued,
        day_76_queued: results.day_76_queued,
        sent: 0,
        message: 'No pending emails to send',
      })
    }

    // Step 5: Send each email
    for (const item of pendingEmails) {
      try {
        let subject: string
        let html: string

        if (item.email_type === 'day_3') {
          subject = "How's Forge treating you so far?"
          html = generateDay3Email()
        } else if (item.email_type === 'day_30') {
          subject = 'One month in — what do you think?'
          html = generateDay30Email()
        } else {
          subject = 'Your beta access ends in 14 days'
          html = generateDay76Email()
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
        await supabase.rpc('mark_beta_lifecycle_email_sent', {
          p_queue_id: item.id,
          p_success: true,
          p_email_id: emailData?.id || null,
          p_error_msg: null,
        })

        // Log to welcome_emails_sent
        await supabase.from('welcome_emails_sent').upsert(
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

        results.sent++
      } catch (error: any) {
        await supabase.rpc('mark_beta_lifecycle_email_sent', {
          p_queue_id: item.id,
          p_success: false,
          p_email_id: null,
          p_error_msg: error.message || 'Unknown error',
        })

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
      day_3_queued: results.day_3_queued,
      day_30_queued: results.day_30_queued,
      day_76_queued: results.day_76_queued,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
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

function generateDay3Email(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How's Forge treating you so far?</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Hey — quick check-in
              </h1>
              <p style="margin: 12px 0 0 0; color: #e0e7ff; font-size: 16px;">
                You've been in the beta for a few days now
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.7;">
                Just wanted to pop in and see how things are going. You signed up for the ForgeNursing beta a few days ago — have you had a chance to try asking a clinical question yet?
              </p>

              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.7;">
                If you haven't, no worries — try something like <em>"What are the priority nursing interventions for a patient in DKA?"</em> and see what Forge comes back with. It's built to think through clinical scenarios the way the NCLEX expects you to.
              </p>

              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.7;">
                And if you've already been using it — I'd genuinely love to hear what you think. What's clicking? What feels off? Just hit reply and let me know. Every piece of feedback shapes what we build next.
              </p>

              <!-- CTA -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="https://forgenursing.com?utm_source=beta_sequence&utm_content=day_3"
                       style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 12px; font-weight: 600; font-size: 17px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                      Log Back In to Forge
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; color: #64748b; font-size: 15px; line-height: 1.7;">
                Talk soon,<br>
                The ForgeNursing Team
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                ForgeNursing — Your AI-powered NCLEX prep partner
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Questions? Just reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

function generateDay30Email(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>One month in — what do you think?</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                One month already
              </h1>
              <p style="margin: 12px 0 0 0; color: #d1fae5; font-size: 16px;">
                Thank you for being part of this
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.7;">
                It's been about a month since you joined the ForgeNursing beta, and I wanted to take a second to say thank you — seriously. You're one of the people helping us figure out what this thing should actually become.
              </p>

              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.7;">
                I have two honest questions for you, and I'd really appreciate a candid answer:
              </p>

              <div style="margin: 0 0 24px 0; padding: 20px; background-color: #f0fdf4; border-radius: 12px; border-left: 4px solid #10b981;">
                <p style="margin: 0 0 12px 0; color: #166534; font-size: 16px; font-weight: 600;">
                  1. What's working well for you?
                </p>
                <p style="margin: 0; color: #166534; font-size: 16px; font-weight: 600;">
                  2. What's missing or feels frustrating?
                </p>
              </div>

              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.7;">
                There's no survey or form — just reply to this email. Even one sentence helps. We read every response and it directly influences what we prioritize next.
              </p>

              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.7;">
                Your beta access is still going strong, so keep using Forge as much as you want. We're shipping improvements every week based on feedback from testers like you.
              </p>

              <p style="margin: 24px 0 0 0; color: #64748b; font-size: 15px; line-height: 1.7;">
                Grateful you're here,<br>
                The ForgeNursing Team
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                ForgeNursing — Your AI-powered NCLEX prep partner
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Questions? Just reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

function generateDay76Email(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your beta access ends in 14 days</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">⏳</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Your beta access ends in 14 days
              </h1>
              <p style="margin: 12px 0 0 0; color: #fef2f2; font-size: 16px;">
                Here's what happens next
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.7;">
                Thanks for being part of the ForgeNursing beta — your access is coming to an end in about two weeks. I wanted to give you a heads-up so there are no surprises.
              </p>

              <!-- Expiration details -->
              <div style="margin: 0 0 28px 0; padding: 20px; background-color: #fef2f2; border-radius: 12px; border-left: 4px solid #dc2626;">
                <h2 style="margin: 0 0 12px 0; color: #991b1b; font-size: 18px; font-weight: 700;">
                  What's changing
                </h2>
                <p style="margin: 0; color: #7f1d1d; font-size: 15px; line-height: 1.7;">
                  Once your beta period ends, your account will move to read-only. You'll still be able to log in, but you won't be able to start new quizzes or ask clinical questions until you subscribe.
                </p>
              </div>

              <!-- Pricing -->
              <div style="margin: 0 0 28px 0; padding: 20px; background-color: #f1f5f9; border-radius: 12px; border-left: 4px solid #4f46e5;">
                <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 18px; font-weight: 700;">
                  Pricing after launch
                </h2>
                <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.7;">
                  Plans start at <strong>$89/semester</strong> — full access to everything you've been using during the beta, plus everything we ship between now and then.
                </p>
              </div>

              <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.7;">
                All your progress, answered questions, and performance data will be saved. Subscribe before your beta expires and you'll pick up right where you left off with zero interruption.
              </p>

              <!-- CTA -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="https://forgenursing.com/checkout?source=beta_expiry"
                       style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                      Subscribe Before Beta Ends
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; color: #64748b; font-size: 15px; line-height: 1.7;">
                Thanks for helping us build this,<br>
                The ForgeNursing Team
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                ForgeNursing — Your AI-powered NCLEX prep partner
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Questions? Just reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
