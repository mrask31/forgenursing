import { SITE_URL, pageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import PublicLayout from '@/components/layout/PublicLayout'
import { AppShell } from '@/components/layout/AppShell'

// Ensure auth pages are not cached
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMetadata('NCLEX-RN Retake Practice', 'Practice a few questions, understand your choices, and try a related question for your next NCLEX-RN attempt.', '/'),
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
  },
}

export default function PublicRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell variant="public">
      <PublicLayout>{children}</PublicLayout>
    </AppShell>
  )
}

