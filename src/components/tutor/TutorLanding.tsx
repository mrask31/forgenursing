'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileSearch, ShieldCheck } from 'lucide-react'

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
  onStartSession,
  attachedFiles = [],
  selectedClassId,
  selectedClass,
}: TutorLandingProps) {
  const router = useRouter()
  const isGeneralTutor = !selectedClassId
  const [hasAnyMaterials, setHasAnyMaterials] = useState<boolean | null>(null)
  const [hasAnyChats, setHasAnyChats] = useState<boolean | null>(null)

  useEffect(() => {
    const checkUserContent = async () => {
      try {
        const binderRes = await fetch('/api/binder', { credentials: 'include' })
        if (binderRes.ok) {
          const binderData = await binderRes.json()
          const materials = binderData.files || []
          setHasAnyMaterials(materials.length > 0)
        }

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

  const promptChips = isGeneralTutor
    ? [
        'I failed NCLEX. Help me figure out what to change.',
        'Walk me through a wrong answer using an Answer Autopsy.',
        'Explain priority vs. true answer with examples.',
        'Help me stop narrowing to two and picking wrong.',
        'Show me how to review rationales actively.',
        'Build a 7-day retake focus plan.',
      ]
    : [
        `Help me use ${selectedClass?.code || 'this class'} for retake recovery.`,
        'Quiz me from my materials and identify the miss pattern.',
        'Explain this topic as a retake risk area.',
        'Help me turn my notes into a focused fix plan.',
      ]

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-5 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E0F4F6] text-[#0D8F9C]">
        <FileSearch className="h-7 w-7" />
      </div>

      <div className="space-y-3">
        <p className="inline-flex rounded-full bg-[#E0F4F6] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0D8F9C]">
          Answer Autopsy Coach
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Let’s figure out why the wrong answer made sense.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Use this coach after a missed question, a confusing rationale, or a failed retake attempt. The goal is to identify the reasoning trap and turn it into a decision rule for the next question.
        </p>
      </div>

      {isGeneralTutor && hasAnyMaterials === false && (
        <div className="rounded-xl border border-teal-100 bg-teal-50 p-4 text-left sm:text-center">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Optional: add your course material</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Course files can help with content gaps, but the retake workflow works even without uploads.
              </p>
            </div>
            <button
              onClick={() => router.push('/classes')}
              className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: '#0D8F9C', minHeight: '44px' }}
            >
              Add Materials →
            </button>
          </div>
        </div>
      )}

      {isGeneralTutor && hasAnyChats === true && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-slate-600">
          Continue a prior autopsy from History, or start fresh with one of the prompts below.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
        {promptChips.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSuggestionClick(prompt)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-[#0D8F9C] hover:bg-[#E0F4F6] transition-colors"
            style={{ minHeight: '52px' }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {attachedFiles.length > 0 && (
        <div className="rounded-xl border border-[#DDE5EE] bg-white p-3 text-xs text-slate-500">
          {attachedFiles.length} attached file{attachedFiles.length === 1 ? '' : 's'} will be used as supporting context.
        </div>
      )}

      <div className="mx-auto max-w-2xl rounded-xl border border-[#DDE5EE] bg-white p-4 text-left">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0D8F9C]" />
          <p className="text-xs leading-5 text-slate-500">
            Do not paste full copyrighted questions from third-party banks. Summarize the scenario, your answer, the correct answer, and what confused you.
          </p>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-snug">
        AI-generated study support • Educational use only • No pass guarantee
      </p>
    </div>
  )
}
