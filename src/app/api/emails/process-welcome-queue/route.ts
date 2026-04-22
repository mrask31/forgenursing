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
          subject: 'You\'re in — here\'s what to do first',
          html: generateWelcomeEmailHTML(trialEndDate),
        })

        if (emailError) {
          throw emailError
        }

        // Mark as sent in database
        const { error: markError } = await supabase.rpc('mark_welcome_email_sent', {
          p_queue_id: item.id,
          p_email_id: emailData?.id || null,
          p_success: true,
          p_error_message: null,
        })
        if (markError) {
          console.error(`[Welcome Queue] Failed to mark email as sent for ${item.email}:`, markError)
        }

        results.sent++
      } catch (error: any) {
        // Mark as failed in database
        const { error: markError } = await supabase.rpc('mark_welcome_email_sent', {
          p_queue_id: item.id,
          p_email_id: null,
          p_success: false,
          p_error_message: error.message || 'Unknown error',
        })
        if (markError) {
          console.error(`[Welcome Queue] Failed to mark email as failed for ${item.email}:`, markError)
        }

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

  <p>Welcome to ForgeNursing. Whatever brought you here — nursing school, NCLEX prep, or just looking for a smarter way to study — you now have a tool that works differently than anything else you've tried.</p>

  <p>Here's the problem with most nursing study tools: they test what you know. ForgeNursing teaches you how to think like a nurse. That's a different thing entirely — and it's the thing NCLEX actually measures.</p>

  <p style="font-weight: bold;">Here's what makes us different:</p>

  <p>When you bring a question or a patient scenario to Forge, it doesn't give you the answer. It thinks through it with you — asking what you notice first, what matters most, what you'd do and why. It reasons like a clinical preceptor, not a textbook.</p>

  <p>And if you're still in school, you don't have to wait for NCLEX prep to matter. Upload your class materials — your syllabus, lecture notes, study guides — and Forge will teach you that content in the same clinical reasoning style. Better understanding now. NCLEX readiness built in automatically.</p>

  <p style="font-weight: bold;">Your first step:</p>

  <p>Log in and try one of these right now:</p>

  <p style="background: #f0f9f8; border-left: 4px solid #00B4A6; padding: 12px 16px; font-weight: bold;">
    → "Walk me through an NCLEX-style priority question"
  </p>

  <p>or if you're currently in a nursing course:</p>

  <p style="background: #f0f9f8; border-left: 4px solid #00B4A6; padding: 12px 16px; font-style: italic;">
    → "I'm studying [topic]. Teach me this the way NCLEX would test it."
  </p>

  <p>You have 7 days free. No credit card. No obligation. Just try it once and see if it clicks.</p>

  <p>Reply to this email anytime — I read every one personally.</p>

  <p>
    — Michael<br>
    Founder, ForgeNursing<br>
    Former Navy Hospital Corpsman, FMF
  </p>

  <a href="https://forgenursing.com" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
    Log In and Get Started →
  </a>

</div>`
}
