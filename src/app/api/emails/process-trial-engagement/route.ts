import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// This endpoint processes trial engagement emails (Day 3, Day 5)
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
      console.error('[Trial Engagement] RESEND_API_KEY not configured')
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
      sent: { day3: 0, day5: 0 },
      errors: [] as any[],
    }

    const days = [
      {
        key: 'day3' as const,
        rpcName: 'get_trial_day3_eligible_users',
        emailType: 'trial_day_3',
        subject: 'Have you tried it yet?',
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
  <p>Hey — Michael here.</p>
  <p>You've had ForgeNursing for three days. I wanted to check in and make sure you actually had a chance to try it — not just sign up and move on.</p>
  <p>If you haven't logged in yet, here's the simplest way to start:</p>
  <p style="background: #f0f9f8; border-left: 4px solid #00B4A6; padding: 12px 16px; font-style: italic;">→ "Walk me through an NCLEX-style priority question"</p>
  <p>Copy that, paste it into the chat, and see what happens. That's it. Two minutes.</p>
  <p>If you're currently in a nursing course and NCLEX feels far away, try this instead:</p>
  <p style="background: #f0f9f8; border-left: 4px solid #00B4A6; padding: 12px 16px; font-style: italic;">→ "I'm studying [your current topic]. Teach me this the way NCLEX would test it."</p>
  <p>You have 4 days left on your trial. No pressure — but the best time to try something new is before you talk yourself out of it.</p>
  <p>— Michael<br>Founder, ForgeNursing<br>Former Navy Hospital Corpsman, FMF</p>
  <a href="https://forgenursing.com" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Log In and Try It →</a>
</div>`,
      },
      {
        key: 'day5' as const,
        rpcName: 'get_trial_day5_eligible_users',
        emailType: 'trial_day_5',
        subject: '2 days left — here\'s what happens next',
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
  <p>Hey — Michael here.</p>
  <p>Your free trial ends in 2 days. I want to be upfront with you about what that means and what your options are.</p>
  <p>If ForgeNursing has clicked for you — if you've had even one moment where the clinical reasoning made something clearer than it's ever been — that's not a coincidence. That's the difference between memorizing facts and learning to think like a nurse.</p>
  <p>If you want to keep going after your trial ends, here's what's available:</p>
  <p><strong>Monthly:</strong> $9.99/month<br><strong>Annual:</strong> $79/year</p>
  <p>If you haven't had a chance to really try it yet, there's still time. Log in and type this right now:</p>
  <p style="background: #f0f9f8; border-left: 4px solid #00B4A6; padding: 12px 16px; font-style: italic;">→ "Walk me through an NCLEX-style priority question"</p>
  <p>Give it 10 minutes. If it doesn't click, no hard feelings — reply and tell me why. I read every response personally.</p>
  <p>— Michael<br>Founder, ForgeNursing<br>Former Navy Hospital Corpsman, FMF</p>
  <a href="https://forgenursing.com/pricing" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Choose a Plan →</a>
</div>`,
      },
    ]

    for (const day of days) {
      const { data: users, error: usersError } = await supabase.rpc(day.rpcName)

      if (usersError) {
        console.error(`[Trial Engagement] Error fetching ${day.key} users:`, usersError)
        continue
      }

      if (!users || users.length === 0) continue

      for (const user of users) {
        try {
          // Send the email directly — do NOT queue into trial_expiration_emails
          const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'ForgeNursing <trial@forgenursing.com>',
            to: user.email,
            subject: day.subject,
            html: day.html,
          })

          if (emailError) throw emailError

          // Track in welcome_emails_sent (NOT trial_expiration_emails)
          await supabase.from('welcome_emails_sent').upsert(
            {
              user_id: user.user_id,
              email: user.email,
              type: day.emailType,
              sent_at: new Date().toISOString(),
              email_id: emailData?.id || null,
              status: 'sent',
            },
            { onConflict: 'user_id,type' }
          )

          results.sent[day.key]++
        } catch (error: any) {
          results.errors.push({
            email: user.email,
            type: day.emailType,
            error: error.message,
          })
          console.error(`[Trial Engagement] Failed to send ${day.key} to ${user.email}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.sent,
      errors: results.errors,
    })
  } catch (error: any) {
    console.error('[Trial Engagement] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Vercel cron invokes routes via GET with Authorization: Bearer $CRON_SECRET
export const GET = POST
