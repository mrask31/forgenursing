'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import BetaWelcomeBanner from '@/components/layout/BetaWelcomeBanner'
import { useUser } from '@/hooks/useUser'

// Routes within (app) that do NOT require active subscription
const UNGUARDED_PATHS = ['/billing', '/onboarding']
const ACCESS_CHECK_TIMEOUT_MS = 2500

function AccessGateScreen({ message }: { message: string }) {
  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-teal-100" />
        <p className="text-sm font-medium text-slate-700" aria-live="polite">
          {message}
        </p>
      </div>
    </div>
  )
}

export default function AppRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { hasAccess, isLoading, user } = useUser()
  const [accessCheckTimedOut, setAccessCheckTimedOut] = useState(false)

  const isUnguarded = UNGUARDED_PATHS.some(p => pathname.startsWith(p))
  const authCheckComplete = !isLoading || accessCheckTimedOut
  const shouldRedirectToCheckout = !isUnguarded && authCheckComplete && !!user && !hasAccess
  const shouldRedirectToLogin = !isUnguarded && authCheckComplete && !user

  useEffect(() => {
    setAccessCheckTimedOut(false)

    if (isUnguarded || !isLoading) return

    const timeout = window.setTimeout(() => {
      setAccessCheckTimedOut(true)
    }, ACCESS_CHECK_TIMEOUT_MS)

    return () => window.clearTimeout(timeout)
  }, [isLoading, isUnguarded, pathname])

  useEffect(() => {
    if (shouldRedirectToCheckout) {
      router.replace('/checkout')
    }

    if (shouldRedirectToLogin) {
      router.replace('/login')
    }
  }, [router, shouldRedirectToCheckout, shouldRedirectToLogin])

  // Do not render protected route children while auth/access is unknown or denied.
  // This prevents expired users from seeing /tutor, /quiz, or /entry UI during
  // client-side navigation before router.replace('/checkout') completes.
  // If the access check hangs, fail closed and send the user to login/checkout.
  if (!isUnguarded && isLoading && !accessCheckTimedOut) {
    return <AccessGateScreen message="Checking your access…" />
  }

  if (shouldRedirectToCheckout) {
    return <AccessGateScreen message="Redirecting to checkout…" />
  }

  if (shouldRedirectToLogin) {
    return <AccessGateScreen message="Redirecting to login…" />
  }

  return (
    <AppShell variant="app">
      <BetaWelcomeBanner />
      {children}
    </AppShell>
  )
}
