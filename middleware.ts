import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { hasAccess } from '@/lib/subscription-access'

export async function middleware(request: NextRequest) {
  // Hard exit for all API routes — let them handle their own auth
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Wrap entire middleware in try/catch to prevent ANY crash
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const { pathname } = request.nextUrl

    // Add aggressive cache control headers for login/signup pages FIRST
    // This must happen before any other processing to prevent caching
    if (pathname === '/login' || pathname === '/signup') {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      response.headers.set('X-Cache-Control', 'no-cache')
      response.headers.set('Vary', '*')
      response.headers.set('X-Timestamp', Date.now().toString())
      response.headers.set('X-Request-ID', `${Date.now()}-${Math.random().toString(36).substring(7)}`)
    }

    // Early return for public routes if Supabase is not configured
    // This prevents the entire site from breaking if env vars are missing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If Supabase is not configured, allow public routes to pass through
    // This ensures the landing page and other public pages still work
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Middleware] Supabase environment variables are missing!')
      // For public routes, allow access even without Supabase
      const publicRoutes = ['/', '/login', '/signup', '/auth/callback', '/privacy', '/terms', '/billing/payment-required', '/checkout']
      const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')
      
      if (isPublicRoute) {
        // Add cache control headers for login and signup pages
        if (pathname === '/login' || pathname === '/signup') {
          response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
          response.headers.set('Pragma', 'no-cache')
          response.headers.set('Expires', '0')
        }
        return response
      }
      
      // For protected routes without Supabase, redirect to login
      // But don't crash the site
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Create Supabase client with error handling
    let supabase
    let user = null
    
    try {
      supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value,
                ...options,
              })
              response.cookies.set({
                name,
                value,
                ...options,
              })
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value: '',
                ...options,
              })
              response.cookies.set({
                name,
                value: '',
                ...options,
              })
            },
          },
        }
      )

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      user = authUser
      
      // Note: getUser() automatically refreshes the session if needed
      // The createServerClient with cookie handlers ensures refreshed tokens
      // are written back to response cookies via the set() handler above
    } catch (error) {
      // If Supabase client creation or auth check fails, log error but don't crash
      console.error('[Middleware] Error initializing Supabase:', error)
      // Allow public routes to continue
      const publicRoutes = ['/', '/login', '/signup', '/auth/callback', '/privacy', '/terms', '/billing/payment-required', '/checkout']
      const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')
      if (isPublicRoute) {
        return response
      }
      // For protected routes, redirect to login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Public routes (also include billing routes for access)
    const publicRoutes = ['/', '/login', '/signup', '/auth/callback', '/privacy', '/terms', '/billing/payment-required', '/checkout']
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')

    // Protected routes that require authentication AND active subscription
    const protectedRoutes = ['/clinical-desk', '/tutor', '/binder', '/readiness', '/settings', '/classes', '/help', '/onboarding', '/entry', '/quiz']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    // CRITICAL: For login/signup pages, only redirect if we have a VALID authenticated user
    // If getUser() failed or returned no user (stale token), let the page handle cleanup
    if ((pathname === '/login' || pathname === '/signup') && user && supabase) {
      // Only redirect if we have a valid user - this means the token is good
      // If token is stale, getUser() will fail and user will be null, so we skip this
      try {
        // Check if they have active subscription before redirecting
        // Use service role key to bypass RLS for subscription status check
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        let subscriptionStatus: string | undefined
        let trialEndsAt: string | undefined
        let isBeta: boolean | undefined
        let betaExpiresAt: string | undefined
        let profileError: any = null
        
        let quizFirstEnabled: boolean | undefined
        let defaultEntryPath: string | null | undefined

        if (serviceRoleKey) {
          // Use service role key to bypass RLS
          const adminClient = createClient(
            supabaseUrl,
            serviceRoleKey
          )
          const { data: profile, error } = await adminClient
            .from('profiles')
            .select('subscription_status, trial_ends_at, is_beta, beta_expires_at, quiz_first_enabled, default_entry_path')
            .eq('id', user.id)
            .single()
          
          if (error) {
            console.error('[Middleware] Error fetching profile with service role:', error)
            profileError = error
          } else {
            subscriptionStatus = profile?.subscription_status
            trialEndsAt = profile?.trial_ends_at
            isBeta = profile?.is_beta ?? false
            betaExpiresAt = profile?.beta_expires_at
            quizFirstEnabled = profile?.quiz_first_enabled ?? false
            defaultEntryPath = profile?.default_entry_path ?? null
          }
        } else {
          // Fallback to anon key (may be blocked by RLS)
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('subscription_status, trial_ends_at, is_beta, beta_expires_at, quiz_first_enabled, default_entry_path')
            .eq('id', user.id)
            .single()
          
          if (error) {
            console.error('[Middleware] Error fetching profile with anon key:', error)
            profileError = error
          } else {
            subscriptionStatus = profile?.subscription_status
            trialEndsAt = profile?.trial_ends_at
            isBeta = profile?.is_beta ?? false
            betaExpiresAt = profile?.beta_expires_at
            quizFirstEnabled = profile?.quiz_first_enabled ?? false
            defaultEntryPath = profile?.default_entry_path ?? null
          }
        }

        // If we couldn't fetch the profile, default to blocking access (fail secure)
        if (profileError || subscriptionStatus === undefined) {
          console.warn('[Middleware] Could not determine subscription status, blocking access', {
            userId: user.id,
            error: profileError?.message,
            hasServiceRoleKey: !!serviceRoleKey
          })
          return NextResponse.redirect(new URL('/billing/payment-required', request.url))
        }

        const userHasAccess = hasAccess(subscriptionStatus, trialEndsAt, isBeta, betaExpiresAt)

        if (userHasAccess) {
          // Quiz-first routing: only when quiz_first_enabled = true
          if (quizFirstEnabled === true) {
            if (defaultEntryPath === 'quiz') {
              return NextResponse.redirect(new URL('/quiz', request.url))
            } else if (defaultEntryPath === 'tutor') {
              return NextResponse.redirect(new URL('/tutor', request.url))
            } else {
              // No saved preference — show entry choice screen
              return NextResponse.redirect(new URL('/entry', request.url))
            }
          }
          // Default: quiz_first_enabled = false or not present → /tutor (existing behavior)
          return NextResponse.redirect(new URL('/tutor', request.url))
        } else {
          // No active subscription, redirect to payment required
          return NextResponse.redirect(new URL('/billing/payment-required', request.url))
        }
      } catch (error) {
        // If subscription check fails, let them stay on login page to handle it
        console.error('[Middleware] Error checking subscription status for auth redirect:', error)
        return response
      }
    }

    // If on login/signup and no valid user (or stale token), let the page handle it
    if (pathname === '/login' || pathname === '/signup') {
      return response
    }

    // Also add cache headers for landing page
    if (pathname === '/') {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    }

    // CRITICAL: Check subscription status for protected routes
    if (isProtectedRoute && user) {
      try {
        // Use service role key to bypass RLS for subscription status check
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        let subscriptionStatus: string | undefined
        let trialEndsAt: string | undefined
        let isBeta: boolean | undefined
        let betaExpiresAt: string | undefined
        let profileError: any = null
        
        if (serviceRoleKey) {
          // Use service role key to bypass RLS
          const adminClient = createClient(
            supabaseUrl,
            serviceRoleKey
          )
          const { data: profile, error } = await adminClient
            .from('profiles')
            .select('subscription_status, trial_ends_at, is_beta, beta_expires_at')
            .eq('id', user.id)
            .single()
          
          if (error) {
            console.error('[Middleware] Error fetching profile for protected route:', error)
            profileError = error
          } else {
            subscriptionStatus = profile?.subscription_status
            trialEndsAt = profile?.trial_ends_at
            isBeta = profile?.is_beta ?? false
            betaExpiresAt = profile?.beta_expires_at
          }
        } else {
          // Fallback to anon key (may be blocked by RLS)
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('subscription_status, trial_ends_at, is_beta, beta_expires_at')
            .eq('id', user.id)
            .single()
          
          if (error) {
            console.error('[Middleware] Error fetching profile for protected route:', error)
            profileError = error
          } else {
            subscriptionStatus = profile?.subscription_status
            trialEndsAt = profile?.trial_ends_at
            isBeta = profile?.is_beta ?? false
            betaExpiresAt = profile?.beta_expires_at
          }
        }

        // If we couldn't fetch the profile, default to blocking access (fail secure)
        if (profileError || subscriptionStatus === undefined) {
          console.warn('[Middleware] Could not determine subscription status for protected route, blocking access', {
            userId: user.id,
            pathname,
            error: profileError?.message
          })
          return NextResponse.redirect(new URL('/billing/payment-required', request.url))
        }

        const userHasAccess = hasAccess(subscriptionStatus, trialEndsAt, isBeta, betaExpiresAt)

        console.log('[Middleware] Protected route access check', {
          userId: user.id,
          pathname,
          subscriptionStatus,
          trialEndsAt,
          userHasAccess,
          isOnboarding: pathname.startsWith('/onboarding')
        })

        // Allow onboarding page even without subscription (they need to complete it first)
        if (pathname.startsWith('/onboarding')) {
          return response
        }

        // For all other protected routes, require active subscription
        if (!userHasAccess) {
          console.log('[Middleware] BLOCKING: User accessing protected route without subscription - redirecting to checkout', {
            userId: user.id,
            pathname,
            subscriptionStatus,
            trialEndsAt
          })
          return NextResponse.redirect(new URL('/checkout', request.url))
        }

        console.log('[Middleware] ALLOWING: User has active subscription', {
          userId: user.id,
          pathname,
          subscriptionStatus
        })
      } catch (error) {
        console.error('[Middleware] Error checking subscription for protected route:', error)
        // Fail secure - redirect to payment required
        return NextResponse.redirect(new URL('/billing/payment-required', request.url))
      }
    }

    // If accessing protected route without authentication, redirect to login
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    // CRITICAL: If middleware crashes, log error but ALWAYS return a response
    // This prevents the entire site from going down
    console.error('[Middleware] CRITICAL ERROR - Middleware crashed:', error)
    
    // For any route, return a basic response to prevent site crash
    // Public routes should work, protected routes will redirect on client side
    const pathname = request.nextUrl.pathname
    const publicRoutes = ['/', '/login', '/signup', '/auth/callback', '/privacy', '/terms', '/billing/payment-required', '/checkout']
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')
    
    if (isPublicRoute) {
      // Allow public routes to load even if middleware crashes
      return NextResponse.next({
        request: {
          headers: request.headers,
        },
      })
    }
    
    // For protected routes, try to redirect to login (but don't crash if this fails)
    try {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    } catch {
      // If even redirect fails, return basic response
      return NextResponse.next({
        request: {
          headers: request.headers,
        },
      })
    }
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}

