'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Volume2, VolumeX } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useTutorContext } from './TutorContext'
import ExamModeDialog from './ExamModeDialog'
import { ExamPlan, StudentClass, NotebookTopic } from '@/lib/types'
import { listExams } from '@/lib/api/exams'

type Mode = 'tutor'

interface TutorHeaderProps {
  mode: Mode
  selectedClass?: StudentClass | null
  selectedTopic?: NotebookTopic | null
  onClearTopic?: () => void
  onStartNewSession?: () => void
  classes?: StudentClass[]
  selectedClassId?: string
  onSelectClass?: (classId: string | undefined) => void
  currentSessionId?: string | null // Current active session ID for archiving
}

export default function TutorHeader({
  mode,
  selectedClass,
  selectedTopic,
  onClearTopic,
  onStartNewSession,
  classes = [],
  selectedClassId,
  onSelectClass,
  currentSessionId,
}: TutorHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentMode = mode
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false)
  const [activeExam, setActiveExam] = useState<ExamPlan | null>(null)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const tutorContext = useTutorContext()

  // Load voice preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVoiceEnabled(localStorage.getItem('forge-voice-enabled') === 'true')
    }
  }, [])

  const toggleVoice = () => {
    const newValue = !voiceEnabled
    setVoiceEnabled(newValue)
    if (typeof window !== 'undefined') {
      localStorage.setItem('forge-voice-enabled', String(newValue))
      // Dispatch event so audio players can react
      window.dispatchEvent(new CustomEvent('forge-voice-toggle', { detail: { enabled: newValue } }))
    }
  }


  // Load active exam if examId is present
  useEffect(() => {
    const loadActiveExam = async () => {
      if (tutorContext.activeExamId && tutorContext.selectedClassId) {
        try {
  const supabase = getBrowserClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const exams = await listExams(user.id, tutorContext.selectedClassId)
            const found = exams.find((e) => e.id === tutorContext.activeExamId)
            setActiveExam(found || null)
          }
        } catch (error) {
          console.error('[TutorHeader] Failed to load exam:', error)
        }
      } else {
        setActiveExam(null)
      }
    }

    loadActiveExam()
  }, [tutorContext.activeExamId, tutorContext.selectedClassId])

  const handleModeChange = (mode: Mode) => {
    router.push(`/tutor?mode=${mode}`)
  }

  return (
    <>
      <header className="flex items-center justify-between h-[52px] border-b border-[var(--gray-200)] bg-white px-3 sm:px-4 md:px-6 mb-0 w-full">
        {/* Left: Forge avatar + identity */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Forge avatar — small navy→teal gradient square */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--navy)] to-[var(--teal)] text-white text-xs font-bold select-none">
            Fx
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-[var(--gray-800)]">Forge</span>
            <span className="text-xs text-[var(--gray-400)]">Clinical Preceptor</span>
          </div>
          {/* Voice toggle */}
          <button
            onClick={toggleVoice}
            className={`ml-1 p-1.5 rounded-md transition-all duration-200 ${
              voiceEnabled
                ? 'text-[var(--teal)] bg-[var(--teal-light)]'
                : 'text-[var(--gray-400)] hover:text-[var(--teal)] hover:bg-[var(--teal-light)]'
            }`}
            title={voiceEnabled ? 'Voice enabled — click to mute' : 'Voice disabled — click to enable'}
            aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Right: Class selector + New Session */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Class select */}
          <select
            value={selectedClassId ?? ""}
            onChange={(e) => onSelectClass?.(e.target.value || undefined)}
            className="rounded-lg border border-[var(--gray-200)] bg-white px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-[var(--gray-800)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]/30 focus:border-[var(--teal)] w-[120px] sm:w-[160px] transition-colors"
          >
            <option value="">General Tutor</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.code} – {cls.name}
              </option>
            ))}
          </select>

          {/* New Session button - only show when there's an active session */}
          {currentSessionId && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!currentSessionId) return

                // Archive the current chat
                try {
                  const archiveRes = await fetch('/api/chats/archive', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ chatId: currentSessionId }),
                  })

                  if (!archiveRes.ok) {
                    console.error('[TutorHeader] Failed to archive chat')
                    // Continue anyway - don't block user
                  }
                } catch (error) {
                  console.error('[TutorHeader] Error archiving chat:', error)
                  // Continue anyway - don't block user
                }

                // Clear session and show landing page
                if (onStartNewSession) {
                  onStartNewSession()
                } else {
                  // Fallback: navigate to clear session
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete('sessionId')
                  params.delete('chatId')
                  params.delete('id')
                  router.push(`/tutor?${params.toString()}`)
                }
              }}
              className="flex-shrink-0 flex items-center gap-1.5 bg-[var(--teal)] text-white border-0 rounded-lg hover:bg-[#0A7A85] transition-colors font-semibold px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">New Session</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </div>
      </header>
      {/* Exam Mode Dialog - outside header for portal rendering */}
      {tutorContext.selectedClassId && (
        <ExamModeDialog
          isOpen={isExamDialogOpen}
          onClose={() => setIsExamDialogOpen(false)}
          classId={tutorContext.selectedClassId as string}
          onStartSession={(examId) => {
            tutorContext.setActiveExamId(examId)
          }}
        />
      )}
    </>
  )
}
