import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { newTrialConversion } from '@/lib/analytics/conversions'
import { captureConversion } from '@/lib/analytics/server'

export async function POST() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return new NextResponse(null, { status: 401 })
    const { data: profile, error: profileError } = await supabase.from('profiles')
      .select('is_beta, trial_ends_at, subscription_status, stripe_subscription_id').eq('id', user.id).single()
    if (profileError || !profile) return new NextResponse(null, { status: 503 })
    const event = newTrialConversion(user, profile)
    if (event && !await captureConversion(event)) return new NextResponse(null, { status: 503 })
    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
