import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEntitlementForUser } from '@/lib/entitlement'
import bank from '../../../../../content/source-checked-bank.json'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Question bank staging index', robots: { index: false, follow: false } }

export default async function BankPreviewIndex() {
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound()
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) redirect('/login')
  if (!(await getEntitlementForUser(user.id)).hasAccess) redirect('/pricing')
  return <main className="mx-auto max-w-2xl px-5 py-8 text-[#0B2545]">
    <h1 className="text-2xl font-bold">Question bank staging preview</h1>
    <p className="my-4">Choose a family, select an answer, then submit to see the learner explanation. These previews do not save learner attempts. Content is AI-assisted and source-checked, without independent clinical validation.</p>
    <ol className="space-y-3">{bank.map(({packet}, i) => <li key={packet.packet_id}><Link className="underline" href={`/preview/bank/${packet.packet_id}`}>
      {String(i + 1).padStart(2, '0')} · {packet.packet_id} · {packet.distinction_id.replaceAll('-', ' ')}
    </Link></li>)}</ol>
  </main>
}
