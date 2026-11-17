import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEntitlementForUser } from '@/lib/entitlement'
import { supplementQuestion } from '@/lib/supplement-preview'
import SupplementPreviewClient from '../SupplementPreviewClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Supplement question staging preview', robots: { index: false, follow: false } }

export default async function SupplementPreviewPage({ params }: { params: { id: string } }) {
  // A screenshot tool for staging, never a production answer-key endpoint.
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound()
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) redirect('/login')
  if (!(await getEntitlementForUser(user.id)).hasAccess) redirect('/pricing')
  const question = supplementQuestion(params.id)
  if (!question) notFound()
  return <SupplementPreviewClient key={question.id} question={question} />
}
