import type { Metadata } from 'next'
import AppRouteLayoutClient from './AppRouteLayoutClient'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function AppRouteLayout({ children }: { children: React.ReactNode }) {
  return <AppRouteLayoutClient>{children}</AppRouteLayoutClient>
}
