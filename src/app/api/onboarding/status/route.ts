import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get onboarding status from profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('onboarding_completed, onboarding_step, onboarding_skipped')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[Onboarding Status] Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 })
  }

  return NextResponse.json({
    completed: profile?.onboarding_completed || false,
    step: profile?.onboarding_step || 0,
    skipped: profile?.onboarding_skipped || false,
  })
}

export async function PATCH(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { step, completed, skipped } = body

  // Build update object
  const updates: any = {}
  if (typeof step === 'number') updates.onboarding_step = step
  if (typeof completed === 'boolean') {
    updates.onboarding_completed = completed
    if (completed) {
      updates.onboarding_completed_at = new Date().toISOString()
      updates.onboarding_step = 3 // Mark as fully complete
    }
  }
  if (typeof skipped === 'boolean') {
    updates.onboarding_skipped = skipped
    if (skipped) {
      updates.onboarding_completed = true // Treat skip as completed
      updates.onboarding_completed_at = new Date().toISOString()
    }
  }

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('[Onboarding Status] Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
