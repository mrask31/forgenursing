import type { Metadata } from 'next'
import NclexPracticePage from './NclexPracticeClient'

export const metadata: Metadata = {
  title: 'Stop Guessing Between Two Nursing Answers | ForgeNursing',
  description:
    'ForgeNursing helps nursing students find the clinical judgment mistake behind missed NCLEX-style questions, then practice the weakness again.',
  openGraph: {
    title: 'Stop Guessing Between Two Nursing Answers | ForgeNursing',
    description:
      'Miss a question, find the thinking error, fix the clinical judgment pattern, and practice again with ForgeNursing.',
    url: '/nclex-practice',
    siteName: 'ForgeNursing',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stop Guessing Between Two Nursing Answers | ForgeNursing',
    description:
      'ForgeNursing shows the clinical judgment mistake behind missed NCLEX-style questions.',
  },
  alternates: {
    canonical: '/nclex-practice',
  },
}

export default function Page() {
  return <NclexPracticePage />
}
