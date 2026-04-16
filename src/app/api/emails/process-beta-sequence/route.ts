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
                I'm Michael — Navy Corpsman turned developer — I built Forge because I know there is a difference between memorizing material and then knowing the material. In health care, you must know the material.
              </p>

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
                Michael
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

function generateWeek1Email(daysRemaining: number): string {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
  <p>Hey — Michael here.</p>
  <p>You've had ForgeNursing for a week. I wanted to check in personally and make sure you actually got a chance to try it — not just sign up and forget about it.</p>
  <p>If you haven't logged in yet, no judgment. Nursing school is relentless and there's never a perfect time to try something new.</p>
  <p>Here's the simplest possible starting point — just copy and paste this when you log in:</p>
  <p style="background: #f0f9f8; border-left: 4px solid #00B4A6; padding: 12px 16px; font-style: italic;">→ "Walk me through an NCLEX-style priority question"</p>
  <p>That's it. One question. Two minutes. If it doesn't click for you after that, reply and tell me why — I genuinely want to know.</p>
  <p>And if you're currently in a nursing course, try this instead:</p>
  <p style="background: #f0f9f8; border-left: 4px solid #00B4A6; padding: 12px 16px; font-style: italic;">→ "I'm studying [your current topic]. Teach me this the way NCLEX would test it."</p>
  <p>You still have <strong>${daysRemaining} days</strong> of free access. No rush — but the best time to build a new study habit is before the old one stops working.</p>
  <p>— Michael<br>Founder, ForgeNursing<br>Former Navy Hospital Corpsman, FMF</p>
  <a href="https://forgenursing.com" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Log In and Try It →</a>
</div>`
}

function generateDay30Email(daysRemaining: number): string {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
  <p>Hey — Michael here.</p>
  <p>You've had ForgeNursing for 30 days. I want to ask you something directly, and I'd love an actual answer.</p>
  <p><strong>What's working for you — and what's missing?</strong></p>
  <p>I'm not asking to be polite. I'm a solo founder building this evenings and weekends, and every piece of feedback I get goes directly into what I build next. If something isn't clicking, I want to know before you move on.</p>
  <p>Two questions — reply directly to this email:</p>
  <p>1. What's one thing ForgeNursing has actually helped you with?<br>2. What's one thing that's frustrating, confusing, or just not there yet?</p>
  <p>You still have <strong>${daysRemaining} days</strong> of free access. I want to make sure those days are worth your time.</p>
  <p>— Michael<br>Founder, ForgeNursing<br>Former Navy Hospital Corpsman, FMF</p>
  <a href="https://forgenursing.com" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Log In and Share Feedback →</a>
</div>`
}

function generateDay45Email(daysRemaining: number): string {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
  <p>Hey — Michael here.</p>
  <p>You're halfway through your beta access and I want to make sure you're getting the most out of it.</p>
  <p>The feature our most active users keep coming back to isn't the NCLEX practice questions. It's uploading their own class materials and having Forge teach them in clinical reasoning style.</p>
  <p>Your syllabus. Your lecture notes. Your professor's study guide. Whatever you're working with right now — upload it, and Forge builds clinical reasoning conversations around your actual coursework. Not summaries. Not flashcards. The same Socratic teaching style, applied directly to what you're studying this week.</p>
  <p>Here's how to try it right now:</p>
  <p>1. Log in and tap the <strong>paperclip icon</strong> in the chat input<br>2. Upload any PDF, Word doc, or image from your class materials<br>3. Type: <em>"Teach me this content the way NCLEX would test it"</em></p>
  <p>The students getting the most out of ForgeNursing aren't just using it for NCLEX prep. They're using it every week for every course.</p>
  <p>You have <strong>${daysRemaining} days</strong> left. That's a full semester's worth of material you could work through this way.</p>
  <p>— Michael<br>Founder, ForgeNursing<br>Former Navy Hospital Corpsman, FMF</p>
  <a href="https://forgenursing.com" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Try It Now →</a>
</div>`
}

function generateDay60Email(daysRemaining: number): string {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
  <p>Hey — Michael here.</p>
  <p>You've had ForgeNursing for 60 days. That means you were one of the first people to ever use this product — before it was polished, before it was proven, before anyone knew if it would work.</p>
  <p>That matters to me. And I want to make sure it means something to you too.</p>
  <p>When your beta access ends in 30 days, ForgeNursing moves to paid plans starting at $24.99/month. But you won't pay that.</p>
  <p>As a beta founder, you'll get permanent access to ForgeNursing at a rate that never changes — as long as you stay subscribed:</p>
  <p><strong>Monthly:</strong> $14.99/month — forever<br><strong>Semester:</strong> $59 every 4 months — forever<br><strong>Annual:</strong> $129/year — forever</p>
  <p>This rate is exclusive to beta users. It will never be offered publicly. When your 90 days end, so does this offer.</p>
  <p>No action needed right now. I just wanted you to know it's coming — and that you earned it.</p>
  <p>— Michael<br>Founder, ForgeNursing<br>Former Navy Hospital Corpsman, FMF</p>
  <a href="https://forgenursing.com" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Log In →</a>
</div>`
}

function generateDay76Email(daysRemaining: number): string {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
  <p>Hey — Michael here.</p>
  <p>Your ForgeNursing beta access ends in 14 days. I want to be direct with you about what that means.</p>
  <p>When your 90 days are up, two things happen at the same time:</p>
  <p>1. Your free access ends<br>2. Your founder rate expires — permanently</p>
  <p>The pricing I shared with you — $14.99/month, $59/semester, $129/year — is exclusive to beta users and closes the moment your beta does. After that, ForgeNursing is $24.99/month for everyone else. That gap never closes.</p>
  <p>If ForgeNursing has helped you think more clearly through patient scenarios, prioritize faster under pressure, or approach your coursework differently — this is the moment to lock that in.</p>
  <p><strong>Subscribe before your beta ends and your founder rate is yours for life.</strong></p>
  <p>If you have questions about which plan is right for you, reply to this email. I'll help you figure it out personally.</p>
  <p>— Michael<br>Founder, ForgeNursing<br>Former Navy Hospital Corpsman, FMF</p>
  <a href="https://forgenursing.com/pricing" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Lock In My Founder Rate →</a>
</div>`
}

function generateDay90Email(daysRemaining: number): string {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
  <p>Hey — Michael here.</p>
  <p>Today is the last day of your ForgeNursing beta access. I wanted to reach out personally before it closes.</p>
  <p>Ninety days ago you took a chance on something that didn't exist yet. You helped me understand what nursing students actually need — not what I assumed they needed. That shaped everything about where ForgeNursing is going.</p>
  <p>If you want to keep going, today is the day to do it.</p>
  <p>Your founder rate — $14.99/month, $59/semester, or $129/year — expires when your beta does. After midnight tonight it's gone permanently. Everyone who joins after you pays $24.99/month.</p>
  <p>If ForgeNursing isn't the right fit right now, I understand. Reply and tell me why — I read every response personally and it genuinely helps me build something better.</p>
  <p>Either way — thank you for being here from the beginning.</p>
  <p>— Michael<br>Founder, ForgeNursing<br>Former Navy Hospital Corpsman, FMF</p>
  <a href="https://forgenursing.com/pricing" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Lock In My Founder Rate →</a>
</div>`
}
