'use client'

import { useState, useEffect } from 'react'

type Mode = 'tutor'

interface TutorLandingProps {
  mode: Mode
  onStartSession: (message: string) => Promise<void>
  attachedFiles?: { id: string, name: string, document_type: string | null }[]
  attachedContext?: 'none' | 'syllabus' | 'textbook' | 'mixed'
  selectedClassId?: string
  selectedClass?: { code: string; name: string; type?: string } | null
}

export default function TutorLanding({
  mode,
  onStartSession,
  attachedFiles = [],
  attachedContext = 'none'
}: TutorLandingProps) {
  const hasAttachedFiles = attachedFiles.length > 0
  const isGeneralTutor = true
  const [hasAnyChats, setHasAnyChats] = useState<boolean | null>(null)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning.'
    if (hour < 17) return 'Good afternoon.'
    return 'Good evening.'
  }

  useEffect(() => {
    const checkUserContent = async () => {
      try {
        const chatsRes = await fetch('/api/chats/list', { credentials: 'include' })
        if (chatsRes.ok) {
          const chatsData = await chatsRes.json()
          const chats = chatsData.chats || []
          setHasAnyChats(chats.length > 0)
        }
      } catch (error) {
        console.error('[TutorLanding] Error checking user content:', error)
      }
    }

    checkUserContent()
  }, [])

  const handleSuggestionClick = async (prompt: string) => {
    await onStartSession(prompt)
  }

  const promptChips = ['Explain a concept step by step', 'Give me an NCLEX-style priority question', 'Why is this answer unsafe?', 'Help me study pharmacology']

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-5 sm:py-8 space-y-4 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          {isGeneralTutor ? `${getGreeting()} I’m ready to help.` : `${getGreeting()} What are we studying?`}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          Ask for a concept breakdown, an NCLEX-style question, a clinical scenario, or help understanding why an answer is unsafe.
        </p>
      </div>

      {isGeneralTutor && hasAnyChats === true && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-slate-600">
          Continue from History, or start fresh with one of the prompts below.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {promptChips.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSuggestionClick(prompt)}
            className="rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm hover:border-[#0D8F9C] hover:bg-[#E0F4F6] transition-colors"
            style={{ minHeight: '44px' }}
          >
            {prompt}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 leading-snug">
        AI-generated study support • Educational use only
      </p>
    </div>
  )
}

