import { retakeLifecycleEmail } from '@/lib/emails/retake-lifecycle'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Test endpoint to send a welcome email to yourself
// Usage: POST /api/emails/send-test-welcome
// Body: { "email": "your-email@example.com" }

export async function POST(request: Request) {
  try {
    // Simple auth check - only allow in development or with service role key
    const authHeader = request.headers.get('authorization')
    const isDev = process.env.NODE_ENV === 'development'
    const isAuthorized = 
      isDev || 
      authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized - only available in development or with service role key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email address' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Calculate trial end date (7 days from now)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)
    const trialEndDate = trialEndsAt.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    // Send test email
    const { data, error } = await resend.emails.send({
      from: 'ForgeNursing <welcome@forgenursing.com>',
      to: email,
      subject: '[TEST] You\'re in! Your 7-day ForgeNursing trial starts now 🩺',
      html: generateWelcomeEmailHTML(trialEndDate),
    })

    if (error) {
      console.error('[Test Welcome] Failed to send:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }


    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: `Test welcome email sent to ${email}`,
      trialEndDate,
    })
  } catch (error: any) {
    console.error('[Test Welcome] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

function generateWelcomeEmailHTML(trialEndDate: string): string {
  return retakeLifecycleEmail('welcome',trialEndDate).html
}
