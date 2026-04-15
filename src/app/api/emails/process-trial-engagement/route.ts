import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// This endpoint processes trial engagement emails (Day 1, Day 3, Day 5)
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
      sent: { day1: 0, day3: 0, day5: 0 },
      errors: [] as any[],
    }

    const days = [
      {
        key: 'day1' as const,
        rpcName: 'get_trial_day1_eligible_users',
        emailType: 'trial_day_1',
        subject: "You're in — here's what to do first",
        body: [
          'Hey,',
          '',
          "Welcome to ForgeNursing. I'm Michael — I built this because I spent 8 years as a Navy Hospital Corpsman watching smart people fail NCLEX not because they didn't study, but because they studied the wrong way.",
          '',
          "ForgeNursing doesn't quiz you. It teaches you to think through patient scenarios the way NCLEX expects — step by step, the way a great clinical instructor would.",
          '',
          "Here's what I'd do on Day 1:",
          '',
          'Go to the tutor and type: "Walk me through a patient with heart failure who is getting worse."',
          '',
          "Don't look up the answer first. Just start. See what happens.",
          '',
          "That's the whole point.",
          '',
          '— Michael',
          'Founder, ForgeNursing',
          '',
          "P.S. Your trial runs for 7 days. You don't need all 7 to know if this clicks. Most people know by the end of the first real scenario.",
        ].join('\n'),
      },
      {
        key: 'day3' as const,
        rpcName: 'get_trial_day3_eligible_users',
        emailType: 'trial_day_3',
        subject: 'Have you tried a clinical question yet?',
        body: [
          'Hey,',
          '',
          'Quick check-in — have you had a chance to work through a clinical scenario yet?',
          '',
          "If not, no pressure. But here's what I'm seeing from students who use ForgeNursing: the ones who try a real patient scenario in the first 3 days are the ones who get it. The ones who keep meaning to start often run out of trial before they do.",
          '',
          "You've got 4 days left. That's enough time.",
          '',
          'Try this one: "My patient just came back from surgery and their BP dropped to 88/52. What do I do first?"',
          '',
          "Don't Google it. Type it into ForgeNursing and work through it. See how differently you think by the end.",
          '',
          '— Michael',
          '',
          "P.S. If you've already been using it and have questions or feedback — just reply to this email. I read every one.",
        ].join('\n'),
      },
      {
        key: 'day5' as const,
        rpcName: 'get_trial_day5_eligible_users',
        emailType: 'trial_day_5',
        subject: "2 days left — don't leave without trying this",
        body: [
          'Hey,',
          '',
          'Your trial ends in 2 days.',
          '',
          "If you've been using ForgeNursing, I hope it's clicking. If you haven't had a chance yet — today's the day.",
          '',
          "The students who pass NCLEX aren't the ones who memorized the most. They're the ones who learned to slow down on a question, identify what the patient actually needs right now, and think through priorities before acting.",
          '',
          "That's what ForgeNursing trains. Not trivia. Reasoning.",
          '',
          'If you want to keep going after your trial: forgenursing.com/pricing',
          '',
          "Monthly is $24.99. Semester is $89 — that's most popular for students mid-program.",
          '',
          'Either way — thank you for giving it a shot. It means a lot that you trusted it with your NCLEX prep.',
          '',
          '— Michael',
        ].join('\n'),
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
        let emailId: string | null = null
        try {
          const { data: queueData } = await supabase.rpc('queue_trial_expiration_email', {
            p_user_id: user.user_id,
            p_email: user.email,
            p_email_type: day.emailType,
            p_trial_ends_at: user.trial_ends_at,
            p_questions_answered: 0,
          })

          emailId = Array.isArray(queueData) ? (queueData[0]?.id ?? null) : (queueData?.id ?? null)

          const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'ForgeNursing <trial@forgenursing.com>',
            to: user.email,
            subject: day.subject,
            text: day.body,
          })

          if (emailError) throw emailError

          if (emailId) {
            await supabase.rpc('mark_trial_expiration_email_sent', {
              p_email_id: emailId,
              p_resend_email_id: emailData?.id || null,
              p_success: true,
              p_error_message: null,
            })
          }

          results.sent[day.key]++
        } catch (error: any) {
          if (emailId) {
            await supabase.rpc('mark_trial_expiration_email_sent', {
              p_email_id: emailId,
              p_resend_email_id: null,
              p_success: false,
              p_error_message: error.message || 'Unknown error',
            })
          }

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
