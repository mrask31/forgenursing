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


    // Step 4: Send each email
    for (const item of pendingEmails) {
      try {
        let subject: string
        let html: string

        if (item.email_type === 'day_6_reminder') {
          // Day 6: 24 hours before expiration
          const dayOfWeek = new Date(item.trial_ends_at).toLocaleDateString('en-US', { weekday: 'long' })
          subject = '⏳ 24 Hours Left: Your NCLEX progress is on the line'
          html = generateDay6Email(dayOfWeek, item.questions_answered)
        } else {
          // Day 7: Trial expired
          subject = 'Your trial has expired. Your data is safe.'
          html = generateDay7Email(item.questions_answered)
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

        await supabase.rpc('mark_trial_expiration_email_sent', {
          p_email_id: item.id,
          p_resend_email_id: emailData?.id || null,
          p_success: true,
          p_error_message: null,
        })

        results.sent++
      } catch (error: any) {
        await supabase.rpc('mark_trial_expiration_email_sent', {
          p_email_id: item.id,
          p_resend_email_id: null,
          p_success: false,
          p_error_message: error.message || 'Unknown error',
        })

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
function generateDay6Email(dayOfWeek: string, questionsAnswered: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>24 Hours Left in Your Trial</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header with urgency -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">⏳</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                24 Hours Left
              </h1>
              <p style="margin: 12px 0 0 0; color: #fef2f2; font-size: 16px;">
                Your NCLEX progress is on the line
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- The Deadline -->
              <div style="margin-bottom: 32px; padding: 20px; background-color: #fef2f2; border-radius: 12px; border-left: 4px solid #dc2626;">
                <h2 style="margin: 0 0 12px 0; color: #991b1b; font-size: 18px; font-weight: 700;">
                  The Deadline
                </h2>
                <p style="margin: 0; color: #7f1d1d; font-size: 16px; line-height: 1.6;">
                  Your 7-day access to ForgeNursing Pro expires tomorrow, <strong>${dayOfWeek}</strong>.
                </p>
              </div>

              <!-- The Value Reinforcement -->
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 700;">
                  Don't Lose Your Momentum
                </h2>
                <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px; line-height: 1.6;">
                  You've already completed <strong style="color: #4f46e5;">${questionsAnswered} practice questions</strong>. Don't lose your streak—the 2026 NCLEX Blueprint waits for no one.
                </p>
                <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.6;">
                  Your performance data, incorrect answers, and custom study plan will be locked unless you upgrade today.
                </p>
              </div>

              <!-- CTA -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="https://forgenursing.com/checkout?source=day6" 
                       style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                      Upgrade to Pro & Keep My Progress
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What You'll Keep -->
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 700;">
                  What you'll keep with Pro:
                </h3>
                <div style="margin-bottom: 8px;">
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  <span style="color: #334155; font-size: 15px;">All ${questionsAnswered} questions you've answered</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  <span style="color: #334155; font-size: 15px;">Your performance analytics and weak areas</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  <span style="color: #334155; font-size: 15px;">Custom study plan based on your progress</span>
                </div>
                <div>
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  <span style="color: #334155; font-size: 15px;">Unlimited access to 2026 NCLEX content</span>
                </div>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                ForgeNursing - Your AI-powered NCLEX prep partner
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Questions? Reply to this email anytime.
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

// Day 7 Email Template (Trial expired)
function generateDay7Email(questionsAnswered: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Trial Has Expired</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">🔒</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Your trial has expired
              </h1>
              <p style="margin: 12px 0 0 0; color: #e2e8f0; font-size: 16px;">
                Your data is safe.
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- The Status -->
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 700;">
                  Your Account Status
                </h2>
                <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.6;">
                  Your trial has ended, and your account has been moved to read-only. Your ${questionsAnswered} answered questions and performance data are safely stored.
                </p>
              </div>

              <!-- The 2026 Promise -->
              <div style="margin-bottom: 32px; padding: 24px; background-color: #f1f5f9; border-radius: 12px; border-left: 4px solid #4f46e5;">
                <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 18px; font-weight: 700;">
                  Continue Your NCLEX Journey
                </h2>
                <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
                  To continue practicing clinical judgment scenarios and high-yield 2026 safety topics, simply pick a plan below.
                </p>
              </div>

              <!-- The Reassurance -->
              <div style="margin-bottom: 32px; padding: 20px; background-color: #ecfdf5; border-radius: 12px; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.6;">
                  <strong>We've saved your performance analytics and incorrect answers</strong> so you can pick up right where you left off.
                </p>
              </div>

              <!-- CTA -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="https://forgenursing.com/checkout?source=day7" 
                       style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                      Choose a Plan & Unlock Now
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What's Waiting -->
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 700;">
                  What's waiting for you:
                </h3>
                <div style="margin-bottom: 8px;">
                  <span style="color: #4f46e5; font-size: 18px; margin-right: 8px;">→</span>
                  <span style="color: #334155; font-size: 15px;">Your ${questionsAnswered} answered questions with detailed explanations</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #4f46e5; font-size: 18px; margin-right: 8px;">→</span>
                  <span style="color: #334155; font-size: 15px;">Performance analytics showing your strengths and weaknesses</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #4f46e5; font-size: 18px; margin-right: 8px;">→</span>
                  <span style="color: #334155; font-size: 15px;">Personalized study plan based on your progress</span>
                </div>
                <div>
                  <span style="color: #4f46e5; font-size: 18px; margin-right: 8px;">→</span>
                  <span style="color: #334155; font-size: 15px;">Full access to 2026 NCLEX clinical judgment scenarios</span>
                </div>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                ForgeNursing - Your AI-powered NCLEX prep partner
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Questions? Reply to this email anytime.
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
