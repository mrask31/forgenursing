'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'

export default function BetaWelcomeBanner() {
  const [betaExpires, setBetaExpires] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('forgenursing-beta-welcome')
    if (stored) {
      setBetaExpires(stored)
    }
  }, [])

  const dismiss = () => {
    setBetaExpires(null)
    localStorage.removeItem('forgenursing-beta-welcome')
  }

  if (!betaExpires) return null

  const expiryDate = new Date(betaExpires).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="w-full bg-[#0D8F9C] text-white text-sm py-3 px-4 relative flex items-center justify-center gap-3">
      <Sparkles className="w-4 h-4 flex-shrink-0" />
      <span>
        Welcome to the beta! You have <strong>free full access until {expiryDate}</strong>. No credit card needed.
      </span>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
