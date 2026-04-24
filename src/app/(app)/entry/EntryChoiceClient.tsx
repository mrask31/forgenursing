'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/client'

export default function EntryChoiceClient() {
  const router = useRouter()
  const [preferredName, setPreferredName] = useState<string>('')
  const [rememberChoice, setRememberChoice] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = getBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_name')
        .eq('id', user.id)
        .single()
      if (profile?.preferred_name) setPreferredName(profile.preferred_name)
    }
    loadProfile()
  }, [])

  const handleChoice = async (path: 'quiz' | 'tutor') => {
    setLoading(true)
    try {
      if (rememberChoice) {
        const supabase = getBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('profiles')
            .update({ default_entry_path: path })
            .eq('id', user.id)
        }
      }

      // PostHog event
      try {
        const posthog = (await import('posthog-js')).default
        posthog.capture('quiz_path_selected', {
          source: 'entry_screen',
          had_previous_preference: false,
          remember_choice_checked: rememberChoice,
        })
      } catch {}

      router.push(path === 'quiz' ? '/quiz' : '/tutor')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: '#0B2545' }}>
            Hey{preferredName ? ` ${preferredName}` : ''}! 👋
          </h1>
          <p className="text-base" style={{ color: '#0B2545' }}>
            How do you want to study?
          </p>
        </div>

        <button
          onClick={() => handleChoice('quiz')}
          disabled={loading}
          className="w-full rounded-xl border-2 p-4 text-left transition-all hover:shadow-md disabled:opacity-50"
          style={{ borderColor: '#0D8F9C', minHeight: '56px' }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <p className="font-semibold text-base" style={{ color: '#0B2545' }}>Practice Questions</p>
              <p className="text-sm text-gray-500 mt-0.5">
                NCLEX-style quiz — test your knowledge with instant feedback
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleChoice('tutor')}
          disabled={loading}
          className="w-full rounded-xl border-2 p-4 text-left transition-all hover:shadow-md disabled:opacity-50"
          style={{ borderColor: '#0B2545', minHeight: '56px' }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="font-semibold text-base" style={{ color: '#0B2545' }}>AI Clinical Tutor</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Socratic reasoning — work through concepts step by step
              </p>
            </div>
          </div>
        </button>

        <label className="flex items-center gap-3 cursor-pointer px-1" style={{ minHeight: '44px' }}>
          <input
            type="checkbox"
            checked={rememberChoice}
            onChange={(e) => setRememberChoice(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 accent-[#0D8F9C]"
          />
          <span className="text-sm text-gray-600">Remember my choice</span>
        </label>

        <p className="text-center text-sm text-gray-400 px-4">
          You can always switch modes from the menu.
        </p>
      </div>
    </div>
  )
}
