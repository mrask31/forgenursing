import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// Excluded accounts — skip entirely
const EXCLUDED_EMAILS = [
  'qa-seed@forgenursing.test',
  'qa-beta-clone@forgenursing.test',
  'mrask30@gmail.com',
  'admin@mjrintelligencegroup.com',
]

// Beta track schedule: day → email_type
const BETA_SCHEDULE: Record<number, string> = {
  0: 'beta_day_0',
  2: 'beta_day_2',
  5: 'beta_day_5',
  10: 'beta_day_10',
  85: 'beta_day_85',
  91: 'beta_day_91',
}

// Trial track schedule: day → email_type
const TRIAL_SCHEDULE: Record<number, string> = {
  0: 'trial_day_0',
  1: 'trial_day_1',
  3: 'trial_day_3',
  6: 'trial_day_6',
  8: 'trial_day_8',
}

// ─── Email content generators ───────────────────────────────────────────────

function emailShell(header: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #0B2545 0%, #0D8F9C 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">${header}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 30px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">ForgeNursing — Your AI clinical preceptor</p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">Questions? Just reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(text: string, url: string = 'https://forgenursing.com/tutor'): string {
  return `<table role="presentation" style="width: 100%; margin: 28px 0;">
  <tr>
    <td align="center">
      <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #0B2545 0%, #0D8F9C 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 16px;">${text}</a>
    </td>
  </tr>
</table>`
}

function signoff(): string {
  return `<p style="margin: 24px 0 0 0; color: #334155; font-size: 16px;">Michael</p>`
}


// ─── Beta email templates ───────────────────────────────────────────────────

function betaDay0(name: string): { subject: string; html: string } {
  const firstName = name || 'there'
  return {
    subject: "You're in — here's what to do first",
    html: emailShell("Welcome to ForgeNursing", `
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Hey ${firstName},</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">I'm Michael — Navy Corpsman turned developer. I built ForgeNursing because I saw the gap between memorizing nursing content and actually knowing how to think through a patient scenario. Most study tools quiz you. Forge teaches you.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Here's the difference: when you bring Forge a clinical question, it doesn't just give you the answer. It walks you through the reasoning — Socratic style — the way a great preceptor would on the floor. You learn to think like a nurse, not just recall like a textbook.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Try this right now to see what I mean:</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px; background: #f0fdf4; border-left: 4px solid #0D8F9C; padding: 12px 16px; font-style: italic;">"A patient with heart failure is short of breath and has crackles in both lungs. What are my priority interventions and why?"</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Paste that in and watch how Forge thinks through it with you. That's the experience.</p>
      ${ctaButton('Start Your First Session')}
      ${signoff()}
    `),
  }
}

function betaDay2(name: string): { subject: string; html: string } {
  const firstName = name || 'there'
  return {
    subject: 'Did you try it yet?',
    html: emailShell("Quick check-in", `
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Hey ${firstName},</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">If you haven't asked Forge a question yet, try this one right now:</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px; background: #f0fdf4; border-left: 4px solid #0D8F9C; padding: 12px 16px; font-style: italic;">"My patient is a 68-year-old on warfarin who just fell. What do I assess first and what labs do I need?"</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Takes two minutes. You'll see exactly how Forge thinks through clinical scenarios differently than any quiz app.</p>
      ${ctaButton('Ask Forge Now')}
      ${signoff()}
    `),
  }
}

function betaDay5(name: string): { subject: string; html: string } {
  const firstName = name || 'there'
  return {
    subject: 'Clinical tip: the one thing NCLEX always tests',
    html: emailShell("The ABCs Priority Framework", `
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Hey ${firstName},</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">NCLEX loves priority questions — and the framework that unlocks most of them is simpler than you think. Airway, Breathing, Circulation. In that order. If a question gives you four patients or four interventions, the one that addresses the highest ABC threat is almost always the answer.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">The hard part isn't knowing ABCs exist — it's recognizing which clinical signs map to which level. That's exactly what Forge walks you through.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Try asking Forge: <em>"Give me a priority question with four patients and walk me through the ABC framework to find the answer."</em></p>
      ${ctaButton('Practice With Forge')}
      ${signoff()}
    `),
  }
}

function betaDay10(name: string): { subject: string; html: string } {
  const firstName = name || 'there'
  return {
    subject: "Here's what a real Forge session looks like",
    html: emailShell("Inside a Forge Session", `
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Hey ${firstName},</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Here's a condensed look at how Forge works through a clinical scenario using the ADPIE framework:</p>
      <p style="margin: 0 0 8px 0; color: #0B2545; font-size: 15px; font-weight: 600;">ORIENT — Forge sets the scene:</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; padding-left: 16px; border-left: 3px solid #e2e8f0;"><em>"Your patient is a 72-year-old admitted for pneumonia. Temp 101.8°F, RR 28, SpO2 89% on room air. What's your first assessment priority?"</em></p>
      <p style="margin: 0 0 8px 0; color: #0B2545; font-size: 15px; font-weight: 600;">MAP — You identify the key data:</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; padding-left: 16px; border-left: 3px solid #e2e8f0;"><em>You answer, and Forge guides you to connect the SpO2 and RR to the airway/breathing priority.</em></p>
      <p style="margin: 0 0 8px 0; color: #0B2545; font-size: 15px; font-weight: 600;">REASONING — Forge pushes your thinking:</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; padding-left: 16px; border-left: 3px solid #e2e8f0;"><em>"Why would you address oxygenation before the fever? What happens if you reverse that order?"</em></p>
      <p style="margin: 0 0 8px 0; color: #0B2545; font-size: 15px; font-weight: 600;">TRAP — Forge flags the common mistake:</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; padding-left: 16px; border-left: 3px solid #e2e8f0;"><em>"Many students jump to antipyretics first. NCLEX wants you to stabilize the ABCs before treating symptoms."</em></p>
      <p style="margin: 0 0 8px 0; color: #0B2545; font-size: 15px; font-weight: 600;">CHECK — Forge confirms your understanding:</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; padding-left: 16px; border-left: 3px solid #e2e8f0;"><em>"Now apply that same logic: new scenario, same patient develops chest pain. What's your priority now?"</em></p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">That's one session. Five minutes. And you walked away understanding the reasoning, not just the answer.</p>
      ${ctaButton('Try It Yourself')}
      ${signoff()}
    `),
  }
}

function betaDay85(name: string): { subject: string; html: string } {
  const firstName = name || 'there'
  return {
    subject: 'Your beta access ends in 5 days',
    html: emailShell("Beta Access Ending Soon", `
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Hey ${firstName},</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">You've had 85 days of free access to ForgeNursing as one of our earliest beta users. That means a lot — you helped shape what this product became.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Your beta access ends in 5 days. After that, you'll need a subscription to keep using Forge.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">The monthly plan is <strong>$9.99/month</strong> — cancel anytime. Or save with the annual plan at <strong>$79/year</strong>.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">If Forge has helped you think through clinical scenarios more clearly, now's the time to lock it in.</p>
      ${ctaButton('Subscribe Before Beta Ends', 'https://forgenursing.com/checkout')}
      ${signoff()}
    `),
  }
}

function betaDay91(name: string): { subject: string; html: string } {
  const firstName = name || 'there'
  return {
    subject: 'Your beta access has ended',
    html: emailShell("Beta Access Ended", `
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Hey ${firstName},</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Your 90-day beta period ended yesterday. Your account and all your session history are still there — nothing has been deleted.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">To pick up where you left off, subscribe below. Plans start at $9.99/month.</p>
      ${ctaButton('Subscribe Now', 'https://forgenursing.com/checkout')}
      ${signoff()}
    `),
  }
}

// ─── Trial email templates ──────────────────────────────────────────────────

function trialDay0(name: string): { subject: string; html: string } {
  const firstName = name || 'there'
  return {
    subject: 'Welcome — you have 7 days free',
    html: emailShell("Welcome to ForgeNursing", `
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Hey ${firstName},</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">You have 7 days of free access to ForgeNursing — an AI clinical preceptor that teaches you to think like a nurse, not just memorize like a textbook.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">When you bring Forge a clinical question, it doesn't hand you the answer. It walks you through the reasoning — Socratic style — so you actually understand the "why" behind every intervention.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Try this right now:</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px; background: #f0fdf4; border-left: 4px solid #0D8F9C; padding: 12px 16px; font-style: italic;">"A patient with diabetes has a blood sugar of 52 mg/dL and is confused. What do I do first and why?"</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Paste that in and see how Forge thinks through it with you. That's the experience — and you have 7 days to use it as much as you want.</p>
      ${ctaButton('Start Your First Session')}
      ${signoff()}
    `),
  }
}

function trialDay1(name: string): { subject: string; html: string } {
  const firstName = name || 'there'
  return {
    subject: 'Try this right now',
    html: emailShell("One question, two minutes", `
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Hey ${firstName},</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Here's a clinical question to ask Forge today:</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px; background: #f0fdf4; border-left: 4px solid #0D8F9C; padding: 12px 16px; font-style: italic;">"I have a post-op patient with sudden chest pain and dyspnea. Walk me through my assessment and priority interventions."</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Two minutes. One question. You'll see exactly why this is different from a quiz app.</p>
      ${ctaButton('Ask Forge Now')}
      ${signoff()}
    `),
  }
}

function trialDay3(name: string): { subject: string; html: string } {
  const firstName = name || 'there'
  return {
    subject: 'Clinical tip: how to eliminate wrong NCLEX answers',
    html: emailShell("Test-Taking Strategy", `
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Hey ${firstName},</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Here's a strategy that works on almost every NCLEX priority question: eliminate the assessment options when the question already gives you enough data to act.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">NCLEX loves to include "assess vital signs" or "gather more data" as distractors when the stem already tells you everything you need. If the patient is in distress and you have the clinical picture, the answer is an intervention — not more assessment.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">The trick is recognizing when you have enough information. That's the clinical judgment piece — and it's exactly what Forge builds in every session.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Try asking: <em>"Give me a priority question where assessment is a distractor and walk me through why."</em></p>
      ${ctaButton('Practice With Forge')}
      ${signoff()}
    `),
  }
}

function trialDay6(name: string): { subject: string; html: string } {
  const firstName = name || 'there'
  return {
    subject: 'Your trial ends tomorrow',
    html: emailShell("Trial Ending Tomorrow", `
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Hey ${firstName},</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Your free trial ends tomorrow. After that, your account stays intact but access to Forge pauses until you subscribe.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Here's what you'll lose access to:</p>
      <ul style="margin: 0 0 16px 0; color: #334155; font-size: 16px; padding-left: 24px;">
        <li style="margin-bottom: 8px;">Unlimited clinical reasoning sessions</li>
        <li style="margin-bottom: 8px;">Upload your own class materials for Socratic teaching</li>
        <li style="margin-bottom: 8px;">24/7 AI preceptor on any nursing topic</li>
      </ul>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Plans start at <strong>$9.99/month</strong> — cancel anytime. Or save with the annual plan at $79/year.</p>
      ${ctaButton('Subscribe Now', 'https://forgenursing.com/checkout')}
      ${signoff()}
    `),
  }
}

function trialDay8(name: string): { subject: string; html: string } {
  const firstName = name || 'there'
  return {
    subject: 'Your free trial has ended',
    html: emailShell("Trial Ended", `
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Hey ${firstName},</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">Your 7-day free trial has ended. Your account and session history are still there — nothing has been deleted.</p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">To continue using Forge, subscribe below. Plans start at $9.99/month.</p>
      ${ctaButton('Subscribe to Continue', 'https://forgenursing.com/checkout')}
      ${signoff()}
    `),
  }
}

// ─── Template dispatcher ────────────────────────────────────────────────────

function getEmailContent(emailType: string, name: string): { subject: string; html: string } | null {
  switch (emailType) {
    case 'beta_day_0':  return betaDay0(name)
    case 'beta_day_2':  return betaDay2(name)
    case 'beta_day_5':  return betaDay5(name)
    case 'beta_day_10': return betaDay10(name)
    case 'beta_day_85': return betaDay85(name)
    case 'beta_day_91': return betaDay91(name)
    case 'trial_day_0': return trialDay0(name)
    case 'trial_day_1': return trialDay1(name)
    case 'trial_day_3': return trialDay3(name)
    case 'trial_day_6': return trialDay6(name)
    case 'trial_day_8': return trialDay8(name)
    default: return null
  }
}

// ─── Route handler ──────────────────────────────────────────────────────────

async function processEmailSequences(request: Request) {
  try {
    // Auth: accept Bearer CRON_SECRET, Bearer SUPABASE_SERVICE_ROLE_KEY, or x-cron-secret header
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')

    const isAuthorized =
      authHeader === `Bearer ${process.env.CRON_SECRET}` ||
      authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` ||
      cronSecret === process.env.CRON_SECRET

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[Email Sequences] RESEND_API_KEY not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const results = {
      users_checked: 0,
      emails_due: 0,
      already_sent: 0,
      sent: 0,
      failed: 0,
      errors: [] as { user_id: string; email_type: string; error: string }[],
    }

    // Step 1: Query all users — profiles joined with auth.users for email + created_at
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, is_beta, preferred_name')

    if (profilesError) {
      console.error('[Email Sequences] Error fetching profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: profilesError },
        { status: 500 }
      )
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, ...results, message: 'No users found' })
    }

    // Get auth.users data (email, created_at) via admin API
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    })

    if (authError) {
      console.error('[Email Sequences] Error fetching auth users:', authError)
      return NextResponse.json(
        { error: 'Failed to fetch auth users', details: authError },
        { status: 500 }
      )
    }

    // Build lookup map: user_id → { email, created_at }
    const authMap = new Map<string, { email: string; created_at: string }>()
    for (const u of authUsers) {
      if (u.email) {
        authMap.set(u.id, { email: u.email, created_at: u.created_at })
      }
    }

    // Step 2: Get all existing sent records for deduplication
    const { data: sentRecords, error: sentError } = await supabase
      .from('welcome_emails_sent')
      .select('user_id, type')

    if (sentError) {
      console.error('[Email Sequences] Error fetching sent records:', sentError)
      return NextResponse.json(
        { error: 'Failed to fetch sent records', details: sentError },
        { status: 500 }
      )
    }

    const sentSet = new Set<string>()
    if (sentRecords) {
      for (const r of sentRecords) {
        sentSet.add(`${r.user_id}:${r.type}`)
      }
    }

    const now = Date.now()

    // Step 3: Process each user
    for (const profile of profiles) {
      const auth = authMap.get(profile.id)
      if (!auth) continue

      // Skip excluded accounts
      if (EXCLUDED_EMAILS.includes(auth.email.toLowerCase())) continue

      results.users_checked++

      const daysSinceSignup = Math.floor((now - new Date(auth.created_at).getTime()) / 86400000)
      const schedule = profile.is_beta ? BETA_SCHEDULE : TRIAL_SCHEDULE
      const emailType = schedule[daysSinceSignup]

      if (!emailType) continue // No email due today for this user

      results.emails_due++

      // Deduplicate: check if already sent
      const dedupeKey = `${profile.id}:${emailType}`
      if (sentSet.has(dedupeKey)) {
        results.already_sent++
        continue
      }

      // Get email content
      const content = getEmailContent(emailType, profile.preferred_name || '')
      if (!content) continue

      try {
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'ForgeNursing <support@forgenursing.com>',
          to: auth.email,
          replyTo: 'support@forgenursing.com',
          subject: content.subject,
          html: content.html,
        })

        if (emailError) throw emailError

        // Record in welcome_emails_sent for deduplication
        await supabase.from('welcome_emails_sent').upsert(
          {
            user_id: profile.id,
            email: auth.email,
            type: emailType,
            sent_at: new Date().toISOString(),
            email_id: emailData?.id || null,
            status: 'sent',
          },
          { onConflict: 'user_id,type' }
        )

        // Update welcome_email_queue status if applicable
        await supabase
          .from('welcome_email_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('user_id', profile.id)
          .eq('status', 'pending')

        results.sent++
        console.log(`[Email Sequences] Sent ${emailType} to ${auth.email}`)
      } catch (error: any) {
        results.failed++
        results.errors.push({
          user_id: profile.id,
          email_type: emailType,
          error: error.message || 'Unknown error',
        })
        console.error(`[Email Sequences] Failed to send ${emailType} to ${auth.email}:`, error)
      }
    }

    return NextResponse.json({ success: true, ...results })
  } catch (error: any) {
    console.error('[Email Sequences] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Vercel cron sends GET
export async function GET(request: Request) {
  return processEmailSequences(request)
}

export async function POST(request: Request) {
  return processEmailSequences(request)
}
