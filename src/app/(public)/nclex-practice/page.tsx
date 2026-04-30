import type { Metadata } from 'next'
import NclexPracticePage from './NclexPracticeClient'

export const metadata: Metadata = {
  title: 'NCLEX Practice Questions From Your Nursing Notes',
  description:
    'ForgeNursing turns nursing notes into NCLEX-style practice questions, rationales, and missed-answer explanations using clinical judgment.',
  openGraph: {
    title: 'NCLEX Practice Questions From Your Nursing Notes | ForgeNursing',
    description:
      'ForgeNursing turns nursing notes into NCLEX-style practice questions, rationales, and missed-answer explanations using clinical judgment.',
    url: '/nclex-practice',
    siteName: 'ForgeNursing',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NCLEX Practice Questions From Your Nursing Notes | ForgeNursing',
    description:
      'Turn your nursing notes into NCLEX-style practice questions with rationales.',
  },
  alternates: {
    canonical: '/nclex-practice',
  },
}

export default function Page() {
  return <NclexPracticePage />
}
