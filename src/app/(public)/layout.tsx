import type { Metadata } from 'next'
import PublicLayout from '@/components/layout/PublicLayout'
import { AppShell } from '@/components/layout/AppShell'

// Ensure auth pages are not cached
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: {
    default: 'ForgeNursing | NCLEX Retake Recovery',
    template: '%s | ForgeNursing'
  },
  description: 'Failed NCLEX and do not know what to fix? ForgeNursing helps retakers identify missed-answer patterns, review Answer Autopsies, and build a focused retake plan.',
  keywords: [
    'NCLEX retake',
    'failed NCLEX',
    'NCLEX retake recovery',
    'NCLEX retake plan',
    'NCLEX missed questions',
    'NCLEX answer rationale',
    'NCLEX priority questions',
    'NCLEX SATA questions',
    'NCLEX delegation questions',
    'NCLEX study plan after failing',
    'NCLEX mistake patterns',
    'nursing exam prep',
    'clinical judgment',
    'nursing prioritization',
  ],
  authors: [{ name: 'ForgeNursing' }],
  creator: 'ForgeNursing',
  publisher: 'ForgeNursing',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://forgenursing.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'ForgeNursing',
    title: 'ForgeNursing | NCLEX Retake Recovery',
    description: 'Failed NCLEX and do not know what to fix? ForgeNursing helps retakers find the mistake patterns behind missed answers before the next attempt.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ForgeNursing - NCLEX Retake Recovery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ForgeNursing | NCLEX Retake Recovery',
    description: 'Know why you picked the wrong one before you retake NCLEX.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
