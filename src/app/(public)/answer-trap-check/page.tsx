import type { Metadata } from 'next'
import AnswerTrapClient from './AnswerTrapClient'

export const metadata: Metadata = {
  title: 'Find Your NCLEX Answer Trap | DownToTwo by ForgeNursing',
  description:
    'Still getting NCLEX questions down to two answers and picking the wrong one? Take a free 3-question check to find the reasoning pattern behind your miss.',
  openGraph: {
    title: 'Find Your NCLEX Answer Trap | DownToTwo by ForgeNursing',
    description:
      'Find the pattern behind the miss. Free 3-question NCLEX decision check — no account required.',
    url: '/answer-trap-check',
    siteName: 'ForgeNursing',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Your NCLEX Answer Trap | DownToTwo by ForgeNursing',
    description:
      'Still picking the wrong answer when two look right? Find the reasoning trap behind it.',
  },
  alternates: {
    canonical: '/answer-trap-check',
  },
}

export default function AnswerTrapCheckPage() {
  return <AnswerTrapClient />
}
