'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, LogOut, CreditCard, Layout, GraduationCap, Calendar, XCircle, CheckCircle } from 'lucide-react'
import { useDensity } from '@/contexts/DensityContext'
import { getDensityTokens } from '@/lib/density-tokens'

/** Shape from /api/subscription/status (Supabase-first, trial-aware) */
interface SubscriptionData {
  subscription: {
    id: string
    status: string
    trialEndDate: string | null
    cancelAtPeriodEnd: boolean
  } | null
  status: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [graduationDate, setGraduationDate] = useState<string>('')
  const [preferredName, setPreferredName] = useState<string>('')
  const [programTrack, setProgramTrack] = useState<string>('')
  const [schoolName, setSchoolName] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const { density, setDensity } = useDensity()
  const tokens = getDensityTokens(density)

  useEffect(() => {
  const supabase = getBrowserClient()
    
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Load profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('graduation_date, preferred_name, program_track, school_name, trial_ends_at')
          .eq('id', user.id)
          .single()
        
        if (profile?.graduation_date) {
          // Format date for input (YYYY-MM-DD)
          const date = new Date(profile.graduation_date)
          const formatted = date.toISOString().split('T')[0]
          setGraduationDate(formatted)
        }
        
        if (profile?.preferred_name) {
          setPreferredName(profile.preferred_name)
        }
        
        if (profile?.program_track) {
          setProgramTrack(profile.program_track)
        }
        
        if (profile?.school_name) {
          setSchoolName(profile.school_name)
        }

        if (profile?.trial_ends_at) {
          setTrialEndsAt(profile.trial_ends_at)
        }

        // Load subscription from /api/subscription/status only (no Stripe/invoice calls)
        try {
          const subRes = await fetch('/api/subscription/status', { credentials: 'include' })
          if (subRes.ok) {
            const data = await subRes.json()
            const status = data.status ?? null
            setSubscriptionData({
              status,
              subscription: status
                ? {
                    id: data.stripe_subscription_id ?? '',
                    status,
                    trialEndDate: data.trial_end_display ?? data.trial_end_date ?? null,
                    cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
                  }
                : null,
            })
          }
        } catch (error) {
          console.error('Error loading subscription:', error)
        }
      }
      
      setLoading(false)
    }
    
    loadProfile()
  }, [])

  const handleLogout = async () => {
    const supabase = getBrowserClient()
    
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="h-full bg-clinical-bg flex items-center justify-center">
        <div className="text-clinical-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
      <div className={`${tokens.containerMaxWidth || 'max-w-4xl'} mx-auto px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pt-safe-t`}>
        {/* Header - Enhanced */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <Layout className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
              Settings
            </h1>
          </div>
          <p className="text-sm sm:text-base text-slate-600 ml-11 sm:ml-14 max-w-2xl leading-relaxed">
            Manage your account and preferences.
          </p>
        </div>

        {/* Identity Section - New */}
        <div className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/50 ${tokens.cardPadding || 'p-4 sm:p-6'} mb-6`}>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 pb-3 border-b border-slate-200">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
              <GraduationCap className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            </div>
            <h2 className={`${tokens.subheading} font-bold text-slate-900`}>
              Identity
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className={`block ${tokens.smallText} text-clinical-text-secondary mb-2`}>
                Preferred Name
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="e.g., Michael R."
                className={`w-full px-4 py-2 border border-clinical-border rounded-lg ${tokens.bodyText} text-clinical-text-primary focus:outline-none focus:ring-2 focus:ring-clinical-primary`}
              />
            </div>
            <div>
              <label className={`block ${tokens.smallText} text-clinical-text-secondary mb-2`}>
                Program / Track
              </label>
              <select
                value={programTrack}
                onChange={(e) => setProgramTrack(e.target.value)}
                className={`w-full px-4 py-2 border border-clinical-border rounded-lg ${tokens.bodyText} text-clinical-text-primary focus:outline-none focus:ring-2 focus:ring-clinical-primary bg-white`}
              >
                <option value="">Select program...</option>
                <option value="RN Track">RN Track</option>
                <option value="ADN">ADN</option>
                <option value="BSN">BSN</option>
                <option value="LPN">LPN</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={`block ${tokens.smallText} text-clinical-text-secondary mb-2`}>
                School Name <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g., State University"
                className={`w-full px-4 py-2 border border-clinical-border rounded-lg ${tokens.bodyText} text-clinical-text-primary focus:outline-none focus:ring-2 focus:ring-clinical-primary`}
              />
            </div>
            <button
              onClick={async () => {
                if (!user) return
                setIsSaving(true)
                try {
                  const supabase = getBrowserClient()
                  
                  const { error } = await supabase
                    .from('profiles')
                    .upsert({
                      id: user.id,
                      preferred_name: preferredName || null,
                      program_track: programTrack || null,
                      school_name: schoolName || null,
                    })
                  
                  if (error) throw error
                  alert('Identity information saved!')
                } catch (error) {
                  console.error('Error saving identity:', error)
                  alert('Failed to save identity information. Please try again.')
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={isSaving}
              className={`w-full px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl ${tokens.smallText || 'text-sm'} font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40`}
            >
              {isSaving ? 'Saving...' : 'Save Identity'}
            </button>
          </div>
        </div>

        {/* Display Density Section - Enhanced */}
        <div className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/50 ${tokens.cardPadding || 'p-4 sm:p-6'} mb-6`}>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 pb-3 border-b border-slate-200">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
              <Layout className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            </div>
            <h2 className={`${tokens.subheading} font-bold text-slate-900`}>
              Display Density
            </h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <p className={`${tokens.smallText} text-clinical-text-secondary mb-2 sm:mb-3`}>
                Choose how much space and text size you prefer. Comfort is larger and easier to read; Compact fits more on screen.
              </p>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setDensity('comfort')}
                  className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                    density === 'comfort'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md shadow-indigo-500/30'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  } ${tokens.bodyText || 'text-sm'} font-semibold`}
                >
                  Comfort
                </button>
                <button
                  onClick={() => setDensity('compact')}
                  className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                    density === 'compact'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md shadow-indigo-500/30'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  } ${tokens.bodyText || 'text-sm'} font-semibold`}
                >
                  Compact
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Goals Section - Enhanced */}
        <div className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/50 ${tokens.cardPadding || 'p-4 sm:p-6'} mb-6`}>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 pb-3 border-b border-slate-200">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            </div>
            <h2 className={`${tokens.subheading} font-bold text-slate-900`}>
              Academic Goals
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className={`block ${tokens.smallText} text-clinical-text-secondary mb-2`}>
                Graduation Date
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={graduationDate}
                  onChange={(e) => setGraduationDate(e.target.value)}
                  className={`flex-1 px-4 py-2 border border-clinical-border rounded-lg ${tokens.bodyText} text-clinical-text-primary focus:outline-none focus:ring-2 focus:ring-clinical-primary`}
                />
                <button
                  onClick={async () => {
                    if (!user) return
                    setIsSaving(true)
                    try {
                      const supabase = getBrowserClient()
                      
                      const { error } = await supabase
                        .from('profiles')
                        .upsert({
                          id: user.id,
                          graduation_date: graduationDate || null,
                          preferred_name: preferredName || null,
                          program_track: programTrack || null,
                          school_name: schoolName || null,
                        })
                      
                      if (error) throw error
                      alert('Graduation date saved!')
                    } catch (error) {
                      console.error('Error saving graduation date:', error)
                      alert('Failed to save graduation date. Please try again.')
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                  disabled={isSaving}
                  className={`px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl ${tokens.smallText || 'text-sm'} font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40`}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
              <p className={`${tokens.smallText} text-clinical-text-secondary mt-2`}>
                Set your graduation date to see a countdown on your dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Account Section - Enhanced */}
        <div className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/50 ${tokens.cardPadding || 'p-4 sm:p-6'} mb-6`}>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 pb-3 border-b border-slate-200">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
              <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            </div>
            <h2 className={`${tokens.subheading} font-bold text-slate-900`}>
              Account
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Mail className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <div>
                <p className={`${tokens.smallText} text-slate-500 mb-0.5`}>Email</p>
                <p className={`${tokens.smallText} font-medium text-slate-900`}>
                  {user?.email || 'Not available'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 border-2 border-red-200 rounded-xl ${tokens.smallText || 'text-sm'} font-semibold hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>

        {/* Subscription Section - Enhanced */}
        <div className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/50 ${tokens.cardPadding || 'p-4 sm:p-6'} mb-6`}>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 pb-3 border-b border-slate-200">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            </div>
            <h2 className={`${tokens.subheading} font-bold text-slate-900`}>
              Subscription
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className={`${tokens.smallText} text-clinical-text-secondary mb-1`}>Status</p>
              <div className="flex items-center gap-2">
                {subscriptionData?.subscription ? (
                  <>
                    {subscriptionData.subscription.status === 'trialing' ? (
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                    ) : subscriptionData.subscription.status === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <p className={`${tokens.smallText} font-medium text-clinical-text-primary`}>
                      {subscriptionData.subscription.status === 'trialing'
                        ? `Trial active — ends ${subscriptionData.subscription.trialEndDate ?? '—'}`
                        : subscriptionData.subscription.status === 'active'
                          ? 'Active subscription'
                          : subscriptionData.subscription.status === 'canceled'
                            ? 'Canceled'
                            : String(subscriptionData.subscription.status || 'Unknown')}
                    </p>
                  </>
                ) : subscriptionData !== null ? (
                  <p className={`${tokens.smallText} text-clinical-text-secondary`}>
                    No active subscription.
                  </p>
                ) : (
                  <p className={`${tokens.smallText} text-clinical-text-secondary`}>
                    Subscription details could not be loaded. Refresh the page or contact support if this persists.
                  </p>
                )}
              </div>
            </div>

            {/* Trial period - show days remaining */}
            {trialEndsAt && new Date(trialEndsAt) > new Date() && (
              <div className="p-3 sm:p-4 bg-indigo-50/80 border border-indigo-200/60 rounded-xl">
                {(() => {
                  const now = new Date()
                  const endDate = new Date(trialEndsAt)
                  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  const formattedDate = endDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                  
                  return (
                    <>
                      <p className={`${tokens.smallText} font-medium text-indigo-900 mb-1`}>
                        {daysRemaining === 1 
                          ? '🎯 Last day of your trial!' 
                          : `🎯 ${daysRemaining} days left in your trial`}
                      </p>
                      <p className={`${tokens.smallText} text-indigo-700 mb-3`}>
                        Your trial ends on <span className="font-semibold">{formattedDate}</span>. Subscribe anytime to continue your access.
                      </p>
                      <button
                        onClick={() => router.push('/checkout')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        Subscribe Now
                      </button>
                    </>
                  )
                })()}
              </div>
            )}
                      </p>
                    </>
                  )
                })()}
              </div>
            )}

            {/* Active (past trial) — paid subscription */}
            {subscriptionData?.subscription?.status === 'active' && !subscriptionData?.subscription?.cancelAtPeriodEnd && (
              <p className={`${tokens.smallText} text-clinical-text-secondary`}>
                Your 7-day trial has ended and you're on a paid subscription. Cancel anytime to stop at the end of your billing period.
              </p>
            )}

            {/* Cancel at Period End Notice */}
            {subscriptionData?.subscription?.cancelAtPeriodEnd && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className={`${tokens.smallText} text-amber-800`}>
                  Your subscription will be canceled at the end of the current billing period.
                </p>
              </div>
            )}

            {/* Cancel Subscription Button — shown when subscribed (including during trial) */}
            {subscriptionData?.subscription && 
             subscriptionData.subscription.status !== 'canceled' && 
             !subscriptionData.subscription.cancelAtPeriodEnd && (
              <button
                onClick={async () => {
                  const isTrialing = subscriptionData.subscription?.status === 'trialing'
                  const trialEnd = subscriptionData.subscription?.trialEndDate
                  const confirmMsg = isTrialing
                    ? `Cancel before your trial ends? You won't be charged. You'll keep access until ${trialEnd || 'the end of your trial'}.`
                    : 'Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.'
                  if (!confirm(confirmMsg)) return

                  setIsCanceling(true)
                  try {
                    const res = await fetch('/api/stripe/cancel-subscription', {
                      method: 'POST',
                      credentials: 'include',
                    })
                    if (!res.ok) {
                      const error = await res.json()
                      throw new Error(error.error || 'Failed to cancel subscription')
                    }
                    const subRes = await fetch('/api/subscription/status', { credentials: 'include' })
                    if (subRes.ok) {
                      const data = await subRes.json()
                      const status = data.status ?? null
                      setSubscriptionData({
                        status,
                        subscription: status ? { id: data.stripe_subscription_id ?? '', status, trialEndDate: data.trial_end_display ?? data.trial_end_date ?? null, cancelAtPeriodEnd: data.cancel_at_period_end ?? false } : null,
                      })
                    }
                    const successMsg = isTrialing
                      ? "You won't be charged. Access continues until the end of your trial."
                      : 'Your subscription will be canceled at the end of the current billing period.'
                    alert(successMsg)
                  } catch (error: any) {
                    console.error('Error canceling subscription:', error)
                    alert(error.message || 'Failed to cancel subscription. Please try again or contact support.')
                  } finally {
                    setIsCanceling(false)
                  }
                }}
                disabled={isCanceling}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 border-2 border-red-200 rounded-lg ${tokens.smallText} font-semibold hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-sm hover:shadow-md`}
              >
                <XCircle className="w-4 h-4" />
                {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
        </div>

        {/* Support Section - Enhanced */}
        <div className={`bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/50 ${tokens.cardPadding || 'p-6'}`}>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 pb-3 border-b border-slate-200">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
              <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            </div>
            <h2 className={`${tokens.subheading} font-bold text-slate-900`}>
              Support
            </h2>
          </div>
          <p className={`${tokens.smallText} text-clinical-text-secondary`}>
            Need help? Email{' '}
            <a
              href="mailto:support@forgenursing.com"
              className="text-clinical-primary hover:text-clinical-secondary transition-colors"
            >
              support@forgenursing.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

