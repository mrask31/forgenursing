import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Account management remains available after study access expires.
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Please log in again to view your account.' }, { status: 401 })
    const { data: profile, error: profileError } = await supabase.from('profiles')
      .select('is_beta, beta_expires_at, preferred_name, subscription_status, trial_ends_at')
      .eq('id', user.id).single()
    if (profileError) return NextResponse.json({ error: 'Your account details could not load. Please retry.' }, { status: 503 })
    return NextResponse.json({ email: user.email, profile }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'Your account is temporarily unavailable. Please retry.' }, { status: 503 })
  }
}
