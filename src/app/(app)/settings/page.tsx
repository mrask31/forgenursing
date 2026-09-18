'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, CreditCard, Loader2, Settings, Target, User } from 'lucide-react'
import { isBetaActive } from '@/lib/subscription-access'

type Profile = {
  is_beta: boolean | null
  beta_expires_at: string | null
  preferred_name: string | null
  program_track: string | null
  program_level: string | null
  graduation_date: string | null
  subscription_status: string | null
  trial_ends_at: string | null
  default_entry_path: string | null
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  try {
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return 'Not set'
  }
}

function accessLabel(profile: Profile | null) {
  if (profile?.subscription_status === 'active') return 'Subscription active'
  if (isBetaActive(profile?.is_beta, profile?.beta_expires_at)) return `Beta access through ${formatDate(profile?.beta_expires_at)}`
  if (profile?.subscription_status === 'trialing') return profile.trial_ends_at && new Date(profile.trial_ends_at).getTime() > Date.now() ? `Trial ends ${formatDate(profile.trial_ends_at)}` : 'Your trial has ended'
  if (profile?.subscription_status === 'expired') return 'Subscription needed'
  if (profile?.subscription_status === 'canceled') return 'Subscription canceled'
  if (profile?.subscription_status === 'past_due') return 'Payment update needed'
  return 'Not available'
}

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [reload, setReload] = useState(0)
  useEffect(() => {
    let disposed = false
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    setLoading(true)
    setError(null)
    async function load() {
      try {
        const response = await fetch('/api/account', { cache: 'no-store', signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Your account could not load.')
        if (!controller.signal.aborted) { setEmail(data.email); setProfile(data.profile) }
      } catch (err) {
        if (disposed) return
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Your account could not load.')
        else setError('Your account took too long to load. Please retry.')
      } finally {
        clearTimeout(timeout)
        if (!disposed) setLoading(false)
      }
    }
    void load()
    return () => { disposed = true; clearTimeout(timeout); controller.abort() }
  }, [reload])

  if (loading) {
    return (
      <div className="min-h-[50vh] bg-[#F7F9FB] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#0D8F9C]" />
          <p className="text-sm text-slate-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[50vh] bg-[#F7F9FB] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <Settings className="w-10 h-10 mx-auto mb-4 text-[#0D8F9C]" />
          <h1 className="text-xl font-bold text-[#0B2545] mb-2">Settings unavailable</h1>
          <p className="text-sm text-slate-600 mb-5">{error}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setReload(value => value + 1)} className="rounded-xl bg-[#0D8F9C] px-5 py-3 text-sm font-bold text-white">
              Try Again
            </button>
            <Link href="/login" className="rounded-xl border border-[#DDE5EE] px-5 py-3 text-sm font-bold text-[#0B2545]">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6 pb-16">
        <header>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0D8F9C]/20 bg-[#E0F4F6] px-3 py-1.5">
            <Settings className="h-4 w-4 text-[#0D8F9C]" />
            <span className="text-xs font-bold uppercase tracking-wide text-[#0B2545]">Account</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-[#0B2545] sm:text-4xl">Your account</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Your trial, subscription, and study preferences in one place.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SettingsCard icon={<User className="h-5 w-5" />} title="Account">
            <SettingRow label="Email" value={email || 'Not available'} />
            <SettingRow label="Name" value={profile?.preferred_name || 'Student Account'} />
          </SettingsCard>

          <SettingsCard icon={<Brain className="h-5 w-5" />} title="Your study plan">
            <p className="text-sm text-slate-600">Update your exam date, preparation notes, or Candidate Performance Report ratings from Home.</p>
            <Link href="/entry" className="inline-block py-2 font-semibold text-[#087986] underline">Open my study plan →</Link>
          </SettingsCard>

          <SettingsCard icon={<CreditCard className="h-5 w-5" />} title="Access">

            <SettingRow label="Access" value={accessLabel(profile)} />
            {profile?.subscription_status !== 'active' && <Link href="/pricing" className="block rounded-xl bg-[#0D8F9C] px-4 py-3 text-center font-bold text-white">View subscription options</Link>}
            <a href="mailto:support@forgenursing.com?subject=Subscription%20help" className="inline-block py-2 text-sm font-semibold text-[#087986] underline">Get help changing or canceling a subscription</a>
          </SettingsCard>

          <SettingsCard icon={<Target className="h-5 w-5" />} title="Help">
            <a href="mailto:support@forgenursing.com" className="block rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-3 text-sm font-bold text-[#0B2545] hover:border-[#0D8F9C]">Contact Support →</a>
          </SettingsCard>
        </section>
      </div>
    </div>
  )
}

function SettingsCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#DDE5EE] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0F4F6] text-[#0D8F9C]">{icon}</div>
        <h2 className="text-lg font-bold text-[#0B2545]">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium text-[#0B2545]">{value}</span>
    </div>
  )
}
