import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is called after signup to set the trial period (or beta access)
// and trigger the welcome email

const BETA_CAP = 20
const BETA_DAYS = 90
const TRIAL_DAYS = 7

async function triggerWelcomeEmail(serviceRoleKey: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://forgenursing.com'
    await fetch(`${appUrl}/api/emails/process-welcome-queue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    })
  } catch (emailError) {
    console.error('[Set Trial] Failed to trigger welcome email:', emailError)
  }
}

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

    // Check beta user count — direct query to avoid stale RPC cache
    const { count: betaCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_beta', true)

    if (!countError && typeof betaCount === 'number' && betaCount < BETA_CAP) {
      // Beta slot available — grant 90-day free access
      const betaExpiresAt = new Date()
      betaExpiresAt.setDate(betaExpiresAt.getDate() + BETA_DAYS)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_beta: true,
          beta_expires_at: betaExpiresAt.toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        console.error('[Set Trial] Error setting beta access:', updateError)
        return NextResponse.json(
          { error: 'Failed to set beta access', details: updateError },
          { status: 500 }
        )
      }

      // Trigger welcome email (non-blocking)
      await triggerWelcomeEmail(process.env.SUPABASE_SERVICE_ROLE_KEY!)

      return NextResponse.json({
        success: true,
        isBeta: true,
        betaExpiresAt: betaExpiresAt.toISOString(),
      })
    }

    // Beta full — fall through to standard 7-day trial
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

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

    // Trigger welcome email (non-blocking)
    await triggerWelcomeEmail(process.env.SUPABASE_SERVICE_ROLE_KEY!)

    return NextResponse.json({
      success: true,
      isBeta: false,
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
