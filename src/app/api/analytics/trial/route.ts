import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { newTrialConversion } from '@/lib/analytics/conversions'
import { captureConversion } from '@/lib/analytics/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return new NextResponse(null, { status: 401 })
    const { data: profile, error: profileError } = await supabase.from('profiles')
      .select('is_beta, trial_ends_at, subscription_status, stripe_subscription_id').eq('id', user.id).single()
    if (profileError || !profile) return new NextResponse(null, { status: 503 })
    const event = newTrialConversion(user, profile)
    if (event) {
      let body: Record<string, unknown> = {}
      try { body = await request.json() } catch {}
      const attribution: Record<string, string | number | boolean | null> = { experience: 'free_sample', measurement_version: 1, site_host: new URL(request.url).hostname, is_qa: body.is_qa === true || user.email?.toLowerCase() === 'mrask30@gmail.com' }
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'landing_page', '$session_id']) {
        if (typeof body[key] === 'string') attribution[key] = (body[key] as string).slice(0, 200)
      }
      if (!await captureConversion(event)) return new NextResponse(null, { status: 503 })
      if (!await captureConversion({ ...event, event: 'trial_signup_completed', conversion_id: `signup:${user.id}`, properties: { ...event.properties, ...attribution } })) return new NextResponse(null, { status: 503 })
    }
    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
