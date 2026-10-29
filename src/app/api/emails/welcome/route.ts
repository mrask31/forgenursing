import { retakeLifecycleEmail } from '@/lib/emails/retake-lifecycle'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// Verify request is from Supabase using service role key
function verifySupabaseRequest(authHeader: string | null): boolean {
  if (!authHeader) return false
  const token = authHeader.replace('Bearer ', '')
  return token === process.env.SUPABASE_SERVICE_ROLE_KEY
}

export async function POST(request: Request) {
  try {
    // Verify the request is from Supabase
    const authHeader = request.headers.get('authorization')
    if (!verifySupabaseRequest(authHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, email } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email' },
        { status: 400 }
      )
    }

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[Welcome Email] RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Get trial end date from database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_ends_at')
      .eq('id', userId)
      .single()

    const trialEndsAt = profile?.trial_ends_at 
      ? new Date(profile.trial_ends_at)
      : null

    const trialEndDate = trialEndsAt 
      ? trialEndsAt.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      : 'in 7 days'

    // Send welcome email
    const { data, error } = await resend.emails.send({
      from: 'ForgeNursing <welcome@forgenursing.com>',
      to: email,
      subject: 'You\'re in! Your 7-day ForgeNursing trial starts now 🩺',
      html: retakeLifecycleEmail('welcome',trialEndDate).html,
    })

    if (error) {
      console.error('[Welcome Email] Failed to send:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }


    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: 'Welcome email sent successfully',
    })
  } catch (error: any) {
    console.error('[Welcome Email] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
