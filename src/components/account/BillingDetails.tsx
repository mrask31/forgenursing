'use client'
import { useEffect, useState } from 'react'

type Billing = { canManage: boolean; subscription: null | { status: string; amount: number | null; currency: string | null; interval: string | null; intervalCount: number | null; currentPeriodEnd: number | null; cancelAtPeriodEnd: boolean } }
export default function BillingDetails() {
  const [data, setData] = useState<Billing | null>(null)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [reload, setReload] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError(''); setData(null)
    fetch('/api/account/billing', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const body = await response.json(); if (!response.ok) throw new Error(body.error)
      setData(body)
    }).catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Billing could not load.') })
    return () => controller.abort()
  }, [reload])
  async function manage() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/account/billing', { method: 'POST' })
      const body = await response.json(); if (!response.ok) throw new Error(body.error)
      window.location.assign(body.url)
    } catch (err) { setError(err instanceof Error ? err.message : 'Billing could not open.') }
    finally { setBusy(false) }
  }
  const subscription = data?.subscription
  return <div className="space-y-3 text-sm text-slate-700">
    {!data && !error && <p role="status">Loading billing details…</p>}
    {subscription && <>
      <p><strong>Plan: </strong>{subscription.amount !== null && subscription.currency ? new Intl.NumberFormat('en-US', { style: 'currency', currency: subscription.currency }).format(subscription.amount / 100) : 'See billing portal'}{subscription.interval ? ` every ${subscription.intervalCount ?? 1} ${subscription.interval}` : ''}</p>
      <p><strong>Status: </strong>{subscription.status.replaceAll('_', ' ')}</p>
      {subscription.currentPeriodEnd && <p><strong>{subscription.cancelAtPeriodEnd ? 'Access scheduled to end: ' : 'Current period ends: '}</strong>{new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}</p>}
    </>}
    {data && !subscription && <p>No Stripe subscription details are linked to this account. Your study access is shown above.</p>}
    {data?.canManage && <><button disabled={busy} onClick={manage} className="w-full rounded-xl bg-[#0D8F9C] px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Opening billing…' : 'Manage billing'}</button><p className="text-xs">Open Stripe to view invoices, update payment details or manage your subscription. Available changes follow the configured billing policy.</p></>}
    {error && <p role="alert">{error} <button className="underline" onClick={() => setReload(value => value + 1)}>Retry</button></p>}
  </div>
}
