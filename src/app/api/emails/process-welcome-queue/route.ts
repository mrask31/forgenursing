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
  return processWelcomeQueue(request)
}

// Vercel cron invokes routes via GET with Authorization: Bearer $CRON_SECRET
export async function GET(request: Request) {
  return processWelcomeQueue(request)
}

async function processWelcomeQueue(request: Request) {
  try {
    // Verify authorization (can be cron secret or service role key)
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
          subject: 'My fault — you never actually got this',
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
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">

  <p>Michael here, founder of ForgeNursing.</p>

  <p>I owe you a straight answer: a technical issue on my end meant most beta users never received a welcome email. You signed up, got nothing, and probably assumed it wasn't worth going back to. That's on me, not you.</p>

  <p>Here's what you actually signed up for — and why it's different from everything else you've tried.</p>

  <p>ForgeNursing doesn't quiz you. It doesn't give you answers. It teaches you to <em>think</em> the way NCLEX expects you to think — through clinical reasoning, not memorization. That's why students who study hard still fail. They know the facts. They can't reason through the scenario under pressure.</p>

  <p>I want you to try one thing right now. Log in and tap this:</p>

  <p style="background: #f0f9f8; border-left: 4px solid #00B4A6; padding: 12px 16px; font-weight: bold;">
    → "Walk me through an NCLEX-style priority question"
  </p>

  <p>That's it. One prompt. See what happens.</p>

  <p>If it doesn't click for you, reply and tell me why. I read every response personally.</p>

  <p>
    — Michael<br>
    Founder, ForgeNursing<br>
    Former Navy Hospital Corpsman
  </p>

  <a href="https://forgenursing.com" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
    Log In and Try It →
  </a>

</div>`
}
