'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, CreditCard, Loader2, Settings, Target, User } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'

type Profile = {
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

function formatEntryPath(value?: string | null) {
  if (value === '/quiz') return 'Practice Questions'
  if (value === '/tutor') return 'Clinical Tutor'
  if (value === '/readiness') return 'Judgment Map'
  if (value === '/entry' || !value) return 'Study Options'
  return value.replace(/^\//, '').replace(/-/g, ' ')
}

function formatStatus(value?: string | null) {
  if (!value) return 'Not available'
  if (value === 'active') return 'Active'
  if (value === 'trialing') return 'Trialing'
  if (value === 'expired') return 'Expired'
  if (value === 'past_due') return 'Past due'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function accessLabel(profile: Profile | null) {
  if (profile?.subscription_status === 'active') return 'Subscription active'
  if (profile?.subscription_status === 'trialing') return `Trial active through ${formatDate(profile.trial_ends_at)}`
  if (profile?.subscription_status === 'expired') return 'Subscription needed'
  if (profile?.subscription_status === 'past_due') return 'Payment update needed'
  return 'Not available'
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), ms)
    Promise.resolve(promise)
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer))
  })
}

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const supabase = getBrowserClient()
        const userResult: any = await withTimeout(supabase.auth.getUser(), 5000)
        const user = userResult.data?.user

        if (!user) {
          setError('Please log in again to view settings.')
          return
        }

        setEmail(user.email ?? null)

        const profileResult: any = await withTimeout(
          supabase
            .from('profiles')
            .select('preferred_name, program_track, program_level, graduation_date, subscription_status, trial_ends_at, default_entry_path')
            .eq('id', user.id)
            .single(),
          7000
        )

        if (profileResult.error) {
          console.error('[Settings] profile load error:', profileResult.error)
          setProfile(null)
          return
        }

        setProfile(profileResult.data as Profile)
      } catch (err) {
        console.error('[Settings] load error:', err)
        setError('Settings took too long to load. Please refresh and try again.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#0D8F9C]" />
          <p className="text-sm text-slate-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <Settings className="w-10 h-10 mx-auto mb-4 text-[#0D8F9C]" />
          <h1 className="text-xl font-bold text-[#0B2545] mb-2">Settings unavailable</h1>
          <p className="text-sm text-slate-600 mb-5">{error}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="rounded-xl bg-[#0D8F9C] px-5 py-3 text-sm font-bold text-white">
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
            <span className="text-xs font-bold uppercase tracking-wide text-[#0B2545]">Settings</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-[#0B2545] sm:text-4xl">Account settings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            View your ForgeNursing account, study profile, and access status.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SettingsCard icon={<User className="h-5 w-5" />} title="Account">
            <SettingRow label="Email" value={email || 'Not available'} />
            <SettingRow label="Name" value={profile?.preferred_name || 'Student Account'} />
          </SettingsCard>

          <SettingsCard icon={<Brain className="h-5 w-5" />} title="Study profile">
            <SettingRow label="Program" value={profile?.program_track || profile?.program_level || 'RN Track'} />
            <SettingRow label="Graduation" value={formatDate(profile?.graduation_date)} />
            <SettingRow label="Default start" value={formatEntryPath(profile?.default_entry_path)} />
          </SettingsCard>

          <SettingsCard icon={<CreditCard className="h-5 w-5" />} title="Access">
            <SettingRow label="Status" value={formatStatus(profile?.subscription_status)} />
            <SettingRow label="Access" value={accessLabel(profile)} />
          </SettingsCard>

          <SettingsCard icon={<Target className="h-5 w-5" />} title="Quick links">
            <Link href="/quiz" className="block rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-3 text-sm font-bold text-[#0B2545] hover:border-[#0D8F9C]">Practice Questions →</Link>
            <Link href="/readiness" className="block rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-3 text-sm font-bold text-[#0B2545] hover:border-[#0D8F9C]">Judgment Map →</Link>
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
