import { pageMetadata } from '@/lib/seo'
import AnswerTrapClient from './AnswerTrapClient'

export const metadata = pageMetadata("Free NCLEX-RN Practice Questions", "Try three free NCLEX-style questions with answer explanations and optional related retries. No account or credit card required.", "/answer-trap-check")

export default function AnswerTrapCheckPage() {
  return <AnswerTrapClient />
}
