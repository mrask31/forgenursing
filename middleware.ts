import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes (also include billing routes for access)
  const publicRoutes = ['/', '/login', '/signup', '/auth/callback', '/privacy', '/terms', '/billing/payment-required']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')

  // Protected routes
  const protectedRoutes = ['/clinical-desk', '/tutor', '/binder', '/readiness', '/settings', '/classes']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Allow access to billing pages (success, cancel, payment-required) and checkout
  const billingRoutes = ['/billing', '/checkout']
  const isBillingRoute = billingRoutes.some(route => pathname.startsWith(route))

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check subscription status for authenticated users accessing protected routes
  if (user && isProtectedRoute && !isBillingRoute) {
    // Use service role key to bypass RLS for subscription status check
    // This is safe because we're only reading subscription_status, not sensitive data
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let subscriptionStatus: string | undefined
    let profileError: any = null
    
    if (serviceRoleKey) {
      // Use service role key to bypass RLS
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      )
      const { data: profile, error } = await adminClient
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('[Middleware] Error fetching profile with service role:', error)
        profileError = error
      } else {
        subscriptionStatus = profile?.subscription_status
      }
    } else {
      // Fallback to anon key (may be blocked by RLS)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('[Middleware] Error fetching profile with anon key:', error)
        profileError = error
      } else {
        subscriptionStatus = profile?.subscription_status
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

    const hasActiveSubscription = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'

    if (!hasActiveSubscription) {
      // User doesn't have active subscription, redirect to payment required page
      return NextResponse.redirect(new URL('/billing/payment-required', request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    // Check if they have active subscription before redirecting
    // Use service role key to bypass RLS for subscription status check
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let subscriptionStatus: string | undefined
    let profileError: any = null
    
    if (serviceRoleKey) {
      // Use service role key to bypass RLS
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      )
      const { data: profile, error } = await adminClient
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('[Middleware] Error fetching profile with service role:', error)
        profileError = error
      } else {
        subscriptionStatus = profile?.subscription_status
      }
    } else {
      // Fallback to anon key (may be blocked by RLS)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('[Middleware] Error fetching profile with anon key:', error)
        profileError = error
      } else {
        subscriptionStatus = profile?.subscription_status
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

    const hasActiveSubscription = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'

    if (hasActiveSubscription) {
      return NextResponse.redirect(new URL('/tutor', request.url))
    } else {
      // No active subscription, redirect to payment required
      return NextResponse.redirect(new URL('/billing/payment-required', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

