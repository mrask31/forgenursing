'use client'

import { AppShell } from '@/components/layout/AppShell'
import BetaWelcomeBanner from '@/components/layout/BetaWelcomeBanner'

export default function AppRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell variant="app">
      <BetaWelcomeBanner />
      {children}
    </AppShell>
  )
}
