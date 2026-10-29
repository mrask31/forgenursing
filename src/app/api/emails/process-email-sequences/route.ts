import { retakeLifecycleEmail } from '@/lib/emails/retake-lifecycle'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { trialEmailAuthorized } from '@/lib/emails/trial-engagement'
import { hasPurchasedRetakePass } from '@/lib/emails/retake-pass-eligibility'

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

function betaDay0(_name: string): { subject: string; html: string } {
  void _name
  return retakeLifecycleEmail('beta')
}

function betaDay2(_name: string): { subject: string; html: string } {
  void _name
  return retakeLifecycleEmail('beta')
}

function betaDay5(_name: string): { subject: string; html: string } {
  void _name
  return retakeLifecycleEmail('beta')
}

function betaDay10(_name: string): { subject: string; html: string } {
  void _name
  return retakeLifecycleEmail('beta')
}

function betaDay85(_name: string): { subject: string; html: string } {
  void _name
  return retakeLifecycleEmail('beta')
}

function betaDay91(_name: string): { subject: string; html: string } {
  void _name
  return retakeLifecycleEmail('beta')
}

// ─── Trial email templates ──────────────────────────────────────────────────

function trialDay0(_name: string): { subject: string; html: string } {
  void _name
  return retakeLifecycleEmail('welcome')
}

function trialDay1(_name: string): { subject: string; html: string } {
  void _name
  return retakeLifecycleEmail('practice')
}

function trialDay3(_name: string): { subject: string; html: string } {
  void _name
  return retakeLifecycleEmail('day3')
}

function trialDay6(_name: string): { subject: string; html: string } {
  void _name
  return retakeLifecycleEmail('day6')
}

function trialDay8(_name: string): { subject: string; html: string } {
  void _name
  return retakeLifecycleEmail('expired')
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
    const isAuthorized = trialEmailAuthorized(request)
    if (process.env.VERCEL_ENV !== 'production') return NextResponse.json({ error: 'production_only' }, { status: 503 })

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
      .select('id, is_beta, preferred_name, subscription_status, stripe_subscription_id')

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
        if (profile.subscription_status === 'active' || profile.stripe_subscription_id || await hasPurchasedRetakePass(supabase, profile.id)) continue
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
