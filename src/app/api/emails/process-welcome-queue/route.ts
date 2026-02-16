import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// This endpoint processes the welcome email queue
// Can be called via:
// 1. Vercel Cron Job
// 2. Manual trigger after signup
// 3. External cron service

export async function POST(request: Request) {
  try {
    // Verify authorization (can be cron secret or service role key)
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

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[Welcome Queue] RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get pending emails from queue
    const { data: pendingEmails, error: queueError } = await supabase
      .rpc('get_pending_welcome_emails', { batch_size: 10 })

    if (queueError) {
      console.error('[Welcome Queue] Error fetching queue:', queueError)
      return NextResponse.json(
        { error: 'Failed to fetch queue', details: queueError },
        { status: 500 }
      )
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No pending emails in queue',
      })
    }

    console.log(`[Welcome Queue] Processing ${pendingEmails.length} emails`)

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as any[],
    }

    // Process each email
    for (const item of pendingEmails) {
      try {
        const trialEndDate = item.trial_ends_at
          ? new Date(item.trial_ends_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
          : 'in 7 days'

        // Send email via Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'ForgeNursing <welcome@forgenursing.com>',
          to: item.email,
          subject: 'You\'re in! Your 7-day ForgeNursing trial starts now 🩺',
          html: generateWelcomeEmailHTML(trialEndDate),
        })

        if (emailError) {
          throw emailError
        }

        // Mark as sent in database
        await supabase.rpc('mark_welcome_email_sent', {
          p_queue_id: item.id,
          p_email_id: emailData?.id || null,
          p_success: true,
          p_error_message: null,
        })

        results.sent++
        console.log(`[Welcome Queue] Sent email to ${item.email} (ID: ${emailData?.id})`)
      } catch (error: any) {
        // Mark as failed in database
        await supabase.rpc('mark_welcome_email_sent', {
          p_queue_id: item.id,
          p_email_id: null,
          p_success: false,
          p_error_message: error.message || 'Unknown error',
        })

        results.failed++
        results.errors.push({
          email: item.email,
          error: error.message,
        })
        console.error(`[Welcome Queue] Failed to send to ${item.email}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingEmails.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    })
  } catch (error: any) {
    console.error('[Welcome Queue] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to generate email HTML
function generateWelcomeEmailHTML(trialEndDate: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ForgeNursing</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Welcome to the future of NCLEX Prep.
              </h1>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- The 7-Day Promise -->
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 700;">
                  The 7-Day Promise
                </h2>
                <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.6;">
                  You now have full, unlimited access to ForgeNursing for the next 7 days. No credit card required, no strings attached.
                </p>
              </div>

              <!-- The 2026 Edge -->
              <div style="margin-bottom: 32px; padding: 24px; background-color: #f1f5f9; border-radius: 12px; border-left: 4px solid #4f46e5;">
                <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 18px; font-weight: 700;">
                  The 2026 Edge
                </h2>
                <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
                  Our platform is fully updated for the April 2026 NCLEX Test Plan, focusing on the clinical judgment scenarios you'll see on exam day.
                </p>
              </div>

              <!-- The Quick Win CTA -->
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 20px; font-weight: 700;">
                  The 'Quick Win' CTA
                </h2>
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td align="center">
                      <a href="https://forgenursing.com/tutor?action=start-quiz" 
                         style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                        Take Your First 10-Question Quiz
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Trial Expiration Notice -->
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                  Your trial expires on <strong style="color: #1e293b;">${trialEndDate}</strong>.<br>
                  We'll save all your progress, so you can pick up right where you left off when you're ready to subscribe.
                </p>
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
                You're receiving this because you signed up for ForgeNursing
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
