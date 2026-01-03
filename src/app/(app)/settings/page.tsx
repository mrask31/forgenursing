'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Mail, LogOut, CreditCard, Layout, GraduationCap, Calendar } from 'lucide-react'
import { useDensity } from '@/contexts/DensityContext'
import { getDensityTokens } from '@/lib/density-tokens'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [graduationDate, setGraduationDate] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const { density, setDensity } = useDensity()
  const tokens = getDensityTokens(density)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Load graduation date from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('graduation_date')
          .eq('id', user.id)
          .single()
        
        if (profile?.graduation_date) {
          // Format date for input (YYYY-MM-DD)
          const date = new Date(profile.graduation_date)
          const formatted = date.toISOString().split('T')[0]
          setGraduationDate(formatted)
        }
      }
      
      setLoading(false)
    }
    
    loadProfile()
  }, [])

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-clinical-bg flex items-center justify-center">
        <div className="text-clinical-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-clinical-bg">
      <div className={`${tokens.containerMaxWidth} mx-auto ${tokens.sectionPadding} px-4 md:px-8`}>
        {/* Header */}
        <div className={`mb-8`}>
          <h1 className={`${tokens.heading} font-semibold text-clinical-text-primary tracking-tight mb-2`}>
            Settings
          </h1>
          <p className={`${tokens.smallText} text-clinical-text-secondary`}>
            Manage your account and preferences.
          </p>
        </div>

        {/* Display Density Section */}
        <div className={`bg-clinical-card border border-clinical-border rounded-xl ${tokens.cardPadding} shadow-sm mb-6`}>
          <div className="flex items-center gap-3 mb-4">
            <Layout className="w-5 h-5 text-clinical-text-secondary" />
            <h2 className={`${tokens.subheading} font-semibold text-clinical-text-primary`}>
              Display Density
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className={`${tokens.smallText} text-clinical-text-secondary mb-3`}>
                Choose how much space and text size you prefer. Comfort is larger and easier to read; Compact fits more on screen.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDensity('comfort')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    density === 'comfort'
                      ? 'bg-clinical-primary text-white border-clinical-primary'
                      : 'bg-clinical-card text-clinical-text-primary border-clinical-border hover:border-clinical-primary'
                  } ${tokens.bodyText} font-medium`}
                >
                  Comfort
                </button>
                <button
                  onClick={() => setDensity('compact')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    density === 'compact'
                      ? 'bg-clinical-primary text-white border-clinical-primary'
                      : 'bg-clinical-card text-clinical-text-primary border-clinical-border hover:border-clinical-primary'
                  } ${tokens.bodyText} font-medium`}
                >
                  Compact
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Goals Section */}
        <div className={`bg-clinical-card border border-clinical-border rounded-xl ${tokens.cardPadding} shadow-sm mb-6`}>
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-5 h-5 text-clinical-text-secondary" />
            <h2 className={`${tokens.subheading} font-semibold text-clinical-text-primary`}>
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
                      const supabase = createBrowserClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                      )
                      
                      const { error } = await supabase
                        .from('profiles')
                        .upsert({
                          id: user.id,
                          graduation_date: graduationDate || null,
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
                  className={`px-4 py-2 bg-clinical-primary text-white rounded-lg ${tokens.smallText} font-medium hover:bg-clinical-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
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

        {/* Account Section */}
        <div className={`bg-clinical-card border border-clinical-border rounded-xl ${tokens.cardPadding} shadow-sm mb-6`}>
          <h2 className={`${tokens.subheading} font-semibold text-clinical-text-primary mb-4`}>
            Account
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-clinical-text-secondary" />
              <div>
                <p className={`${tokens.smallText} text-clinical-text-secondary`}>Email</p>
                <p className={`${tokens.smallText} font-medium text-clinical-text-primary`}>
                  {user?.email || 'Not available'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg ${tokens.smallText} font-medium hover:bg-red-100 transition-colors`}
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>

        {/* Subscription Section */}
        <div className={`bg-clinical-card border border-clinical-border rounded-xl ${tokens.cardPadding} shadow-sm mb-6`}>
          <h2 className={`${tokens.subheading} font-semibold text-clinical-text-primary mb-4`}>
            Subscription
          </h2>
          <div className="space-y-4">
            <div>
              <p className={`${tokens.smallText} text-clinical-text-secondary mb-1`}>Status</p>
              <p className={`${tokens.smallText} font-medium text-clinical-text-primary`}>
                Free Preview
              </p>
            </div>
            <button
              disabled
              className={`inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg ${tokens.smallText} font-medium cursor-not-allowed`}
            >
              <CreditCard className="w-4 h-4" />
              Manage Billing
              <span className="text-xs ml-1">(Coming soon)</span>
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className={`bg-clinical-card border border-clinical-border rounded-xl ${tokens.cardPadding} shadow-sm`}>
          <h2 className={`${tokens.subheading} font-semibold text-clinical-text-primary mb-4`}>
            Support
          </h2>
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

