import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Compatibility endpoint. The database provisions trials once when the account
// is created. Never accept a client-supplied user ID or reset an access date.
export async function POST() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile, error: profileError } = await supabase.from('profiles')
    .select('is_beta, beta_expires_at, trial_ends_at').eq('id', user.id).single()
  if (profileError || !profile) return NextResponse.json({ error: 'Access details unavailable' }, { status: 503 })
  return NextResponse.json({ success: true, isBeta: !!profile.is_beta,
    betaExpiresAt: profile.beta_expires_at, trialEndsAt: profile.trial_ends_at })
}
