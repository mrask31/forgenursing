import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is called after signup to set the trial period
// and trigger the welcome email

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Initialize Supabase with service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Set trial_ends_at to 7 days from now
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ trial_ends_at: trialEndsAt.toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('[Set Trial] Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to set trial', details: updateError },
        { status: 500 }
      )
    }

    console.log(`[Set Trial] Trial set for user ${userId} until ${trialEndsAt.toISOString()}`)

    // Trigger welcome email processing (non-blocking)
    // This will process the queue that was populated by the database trigger
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://forgenursing.com'
      await fetch(`${appUrl}/api/emails/process-welcome-queue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('[Set Trial] Failed to trigger welcome email:', emailError)
    }

    return NextResponse.json({
      success: true,
      trialEndsAt: trialEndsAt.toISOString(),
    })
  } catch (error: any) {
    console.error('[Set Trial] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
