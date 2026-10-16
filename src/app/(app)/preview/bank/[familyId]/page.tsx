import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEntitlementForUser } from '@/lib/entitlement'
import { learningAdmin } from '@/lib/learning/server'
import { sourceCheckedContent } from '@/lib/learning/source-checked-server'
import BankPreviewClient from './BankPreviewClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Question bank staging preview', robots: { index: false, follow: false } }

export default async function BankPreviewPage({ params, searchParams = {} }: { params: { familyId: string }; searchParams?: { variant?: string } }) {
  // A screenshot tool for staging, never a production answer-key endpoint.
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound()
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) redirect('/login')
  if (!(await getEntitlementForUser(user.id)).hasAccess) redirect('/pricing')

  const { data, error } = await learningAdmin().from('source_checked_content_versions')
    .select('id').eq('packet_id', params.familyId).eq('audience', 'preview')
    .order('version', { ascending: false }).limit(1).maybeSingle()
  if (error) throw new Error('The staging bank could not load. Please retry.')
  if (!data) notFound()
  // Validates current publication, schema, incident holds and stored packet hash.
  const content = await sourceCheckedContent(data.id)
  if (!content) notFound()
  const variant = searchParams.variant ?? 'original'
  if (variant !== 'original' && variant !== 'retry' && variant !== 'review') notFound()
  return <BankPreviewClient key={variant} packet={content.packet} initialRole={variant} />
}
