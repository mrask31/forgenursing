'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import BetaWelcomeBanner from '@/components/layout/BetaWelcomeBanner'
import { useUser } from '@/hooks/useUser'

// Routes within (app) that do NOT require active subscription
const UNGUARDED_PATHS = ['/billing', '/onboarding']

export default function AppRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { hasAccess, isLoading, user } = useUser()

  useEffect(() => {
    // Don't redirect while loading or if user isn't authenticated
    if (isLoading || !user) return

    // Don't guard billing or onboarding pages
    const isUnguarded = UNGUARDED_PATHS.some(p => pathname.startsWith(p))
    if (isUnguarded) return

    // If user doesn't have access, redirect to checkout
    if (!hasAccess) {
      router.replace('/checkout')
    }
  }, [hasAccess, isLoading, user, pathname, router])

  return (
    <AppShell variant="app">
      <BetaWelcomeBanner />
      {children}
    </AppShell>
  )
}
