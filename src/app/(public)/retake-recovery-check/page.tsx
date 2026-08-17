import type { Metadata } from 'next'
import RetakeRecoveryCheckClient from './RetakeRecoveryCheckClient'

export const metadata: Metadata = {
  title: 'Free NCLEX Retake Recovery Check',
  description: 'Start a free NCLEX retake recovery check to identify likely missed-answer patterns before your next attempt.',
  alternates: {
    canonical: '/retake-recovery-check',
  },
}

export default function RetakeRecoveryCheckPage() {
  return <RetakeRecoveryCheckClient />
}
