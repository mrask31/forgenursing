import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const plan = searchParams.get('plan')
  const next = searchParams.get('next') ?? '/clinical-desk'

  if (code) {
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
    
    // Exchange the code for a session (Log them in!)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Ensure profile exists with correct subscription status
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if profile exists, create/update if needed
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, subscription_status')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Create profile with pending_payment status
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              subscription_status: 'pending_payment',
            })
        } else if (!profile.subscription_status) {
          // Update existing profile to set status if missing
          await supabase
            .from('profiles')
            .update({ subscription_status: 'pending_payment' })
            .eq('id', user.id)
        }
      }

      // If there's a plan parameter, redirect to checkout initiation page
      // This will trigger the Stripe checkout flow
      if (plan && (plan === 'monthly' || plan === 'semester' || plan === 'annual')) {
        return NextResponse.redirect(`${origin}/checkout?plan=${plan}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If something breaks, send them to the login page
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}