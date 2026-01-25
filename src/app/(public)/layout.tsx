import type { Metadata } from 'next'
import PublicLayout from '@/components/layout/PublicLayout'
import { AppShell } from '@/components/layout/AppShell'

// Ensure auth pages are not cached
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: {
    default: 'ForgeNursing | AI Tutor for NCLEX Prep & Clinical Reasoning',
    template: '%s | ForgeNursing'
  },
  description: 'Studying hard but still stuck on NCLEX questions? ForgeNursing turns your lecture notes and textbooks into step-by-step clinical reasoning — so prioritization finally clicks. Free 7-day trial.',
  keywords: [
    'NCLEX prep',
    'NCLEX preparation',
    'nursing tutor',
    'AI nursing tutor',
    'clinical reasoning',
    'nursing school',
    'NCLEX study guide',
    'nursing exam prep',
    'clinical judgment',
    'nursing prioritization',
    'NCLEX questions',
    'nursing education',
    'RN exam prep',
    'LPN exam prep',
    'nursing study tool',
    'step-by-step clinical reasoning',
    'nursing AI assistant'
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
    title: 'ForgeNursing | AI Tutor for NCLEX Prep & Clinical Reasoning',
    description: 'Studying hard but still stuck on NCLEX questions? ForgeNursing turns your lecture notes and textbooks into step-by-step clinical reasoning — so prioritization finally clicks. Free 7-day trial.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ForgeNursing - AI Tutor for NCLEX Prep',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ForgeNursing | AI Tutor for NCLEX Prep & Clinical Reasoning',
    description: 'Studying hard but still stuck on NCLEX questions? ForgeNursing turns your lecture notes and textbooks into step-by-step clinical reasoning — so prioritization finally clicks.',
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
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-verification-code',
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

