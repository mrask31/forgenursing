import type { Metadata } from 'next'
import AnswerTrapClient from './AnswerTrapClient'

export const metadata: Metadata = {
  title: 'Free NCLEX-RN Practice Check | ForgeNursing',
  description:
    'Try three NCLEX-style questions, review your choices, and find a starting focus for your next attempt.',
  openGraph: {
    title: 'Free NCLEX-RN Practice Check | ForgeNursing',
    description:
      'Free three-question practice check for your NCLEX-RN retake. No account required.',
    url: '/answer-trap-check',
    siteName: 'ForgeNursing',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free NCLEX-RN Practice Check | ForgeNursing',
    description:
      'Start with three practice questions and useful explanations for your next attempt.',
  },
  alternates: {
    canonical: '/answer-trap-check',
  },
}

export default function AnswerTrapCheckPage() {
  return <AnswerTrapClient />
}
