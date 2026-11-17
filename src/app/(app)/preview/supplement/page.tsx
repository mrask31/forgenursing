import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { nclexCategoryLabel } from '@/lib/nclex-categories'
import { createClient } from '@/lib/supabase/server'
import { getEntitlementForUser } from '@/lib/entitlement'
import { SUPPLEMENT_BATCH_6 } from '@/lib/supplement-preview'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Supplement questions staging index', robots: { index: false, follow: false } }

export default async function SupplementPreviewIndex() {
  // A screenshot tool for staging, never a production answer-key endpoint.
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound()
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) redirect('/login')
  if (!(await getEntitlementForUser(user.id)).hasAccess) redirect('/pricing')
  return <main className="mx-auto max-w-2xl px-5 py-8 text-[#0B2545]">
    <h1 className="text-2xl font-bold">Supplement questions staging preview</h1>
    <p className="my-4">These are supplement questions, separate from the audited question bank. Select an answer, then submit to see the learner explanation. Nothing is scored, saved, or scheduled for review. Content is AI-assisted and not independently clinically validated.</p>
    <ol className="space-y-3">{SUPPLEMENT_BATCH_6.questions.map(question => <li key={question.id}><Link className="underline" href={`/preview/supplement/${question.id}`}>
      {question.q} · {question.id} · {question.topic} · {nclexCategoryLabel(question.nclex_category)}
    </Link></li>)}</ol>
  </main>
}
