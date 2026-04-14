import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { hasAccess } from '@/lib/subscription-access'

function getStripeClient(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' })
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const plan = searchParams.get('plan')
  const next = searchParams.get('next') ?? '/tutor'
  
  // Confirm redirectTo / callbackUrl matches production domain
  // Use NEXT_PUBLIC_APP_URL if available, otherwise use request origin
  const appUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? (process.env.NEXT_PUBLIC_APP_URL.startsWith('http') 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : `https://${process.env.NEXT_PUBLIC_APP_URL}`)
    : origin

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
    
    if (error) {
      console.error('[Auth Callback] Error exchanging code for session:', error)
      // Use appUrl for consistent redirects (already declared at top of function)
      return NextResponse.redirect(`${appUrl}/login?error=auth-code-error`)
    }
    
    if (!error) {
      // Ensure profile exists with correct subscription status
      const { data: { user } } = await supabase.auth.getUser()
      let subscriptionStatus = 'pending_payment'
      let trialEndsAt: string | null = null
      let isBeta: boolean = false
      let betaExpiresAt: string | null = null
      let onboardingCompleted = false
      
      if (user) {
        // Use service role key to bypass RLS for profile operations
        // This is necessary because RLS might block the anon key
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        let profileClient = supabase
        
        if (serviceRoleKey) {
          // Use service role key to bypass RLS
          profileClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey
          ) as any
        }
        
        // Check if profile exists, create/update if needed
        const { data: profile, error: profileError } = await profileClient
          .from('profiles')
          .select('id, subscription_status, stripe_customer_id, onboarding_completed, trial_ends_at, is_beta, beta_expires_at')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          // Profile doesn't exist or query failed, create it with pending_payment status
          const { error: insertError } = await profileClient
            .from('profiles')
            .insert({
              id: user.id,
              subscription_status: 'pending_payment',
              onboarding_completed: false,
              onboarding_step: 0,
            })
          
          if (insertError) {
            console.error('[Auth Callback] Error creating profile:', insertError)
            // Continue with default pending_payment status
          }
          onboardingCompleted = false
        } else {
          subscriptionStatus = profile.subscription_status || 'pending_payment'
          trialEndsAt = profile.trial_ends_at || null
          isBeta = profile.is_beta || false
          betaExpiresAt = profile.beta_expires_at || null
          onboardingCompleted = profile.onboarding_completed || false
          
          if (!profile.subscription_status) {
            const { error: updateError } = await profileClient
              .from('profiles')
              .update({ subscription_status: 'pending_payment' })
              .eq('id', user.id)
            if (updateError) console.error('[Auth Callback] Error updating profile:', updateError)
          }

          // Sync subscription from Stripe on login — fixes missed webhooks, delayed events
          const stripe = getStripeClient()
          const customerId = profile.stripe_customer_id
          if (stripe && customerId && serviceRoleKey) {
            try {
              const { data: subs } = await stripe.subscriptions.list({
                customer: customerId,
                status: 'all',
                limit: 10,
              })
              const sub = subs.find((s) => s.status === 'trialing' || s.status === 'active') ?? subs[0]
              if (sub) {
                const status =
                  sub.status === 'trialing' ? 'trialing' :
                  sub.status === 'active' ? 'active' :
                  sub.status === 'past_due' || sub.status === 'unpaid' ? 'past_due' : 'canceled'
                await profileClient
                  .from('profiles')
                  .update({ subscription_status: status, stripe_subscription_id: sub.id })
                  .eq('id', user.id)
                subscriptionStatus = status
              }
            } catch (e) {
              // Best-effort; keep existing subscriptionStatus
            }
          }
        }
      }

      // If user hasn't completed onboarding, redirect to onboarding
      // DISABLED: Skip onboarding, go straight to checkout for payment
      // if (!onboardingCompleted) {
      //   return NextResponse.redirect(`${appUrl}/onboarding`)
      // }

      // If there's a plan parameter, redirect to checkout initiation page
      // This will trigger the Stripe checkout flow
      if (plan && (plan === 'monthly' || plan === 'semester' || plan === 'annual')) {
        return NextResponse.redirect(`${appUrl}/checkout?plan=${plan}`)
      }
      
      // Check access: active, trialing+not expired, or beta active
      if (!hasAccess(subscriptionStatus, trialEndsAt, isBeta, betaExpiresAt)) {
        return NextResponse.redirect(`${appUrl}/checkout`)
      }
      return NextResponse.redirect(`${appUrl}${next}`)
    }
  }

  // If something breaks, send them to the login page
  // Use appUrl for consistent redirects (already declared at top of function)
  return NextResponse.redirect(`${appUrl}/login?error=auth-code-error`)
}