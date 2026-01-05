'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ToggleLeft, ToggleRight, HelpCircle, Plus } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { MessageSquare, FileText, Stethoscope, Brain } from 'lucide-react'
import { useTutorContext } from './TutorContext'
import ExamModeDialog from './ExamModeDialog'
import { ExamPlan, StudentClass, NotebookTopic } from '@/lib/types'
import { listExams } from '@/lib/api/exams'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'


type Mode = 'tutor' | 'reflections'

// Icon mapping for session types
const getSessionIcon = (sessionType: string | null) => {
  switch (sessionType) {
    case 'reflection':
      return Brain
    case 'snapshot':
      return Stethoscope
    case 'question':
      return MessageSquare
    case 'notes':
      return FileText
    default:
      return MessageSquare
  }
}

// Badge text for session types
const getSessionBadge = (sessionType: string | null) => {
  switch (sessionType) {
    case 'reflection':
      return 'Reflection'
    case 'snapshot':
      return 'Snapshot'
    case 'question':
      return 'Question'
    case 'notes':
      return 'Notes'
    default:
      return 'General'
  }
}

interface TutorHeaderProps {
  mode: Mode
  strictMode: boolean
  onStrictModeChange: (strict: boolean) => void
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
  strictMode, 
  onStrictModeChange,
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
  const tutorContext = useTutorContext()


  // Load active exam if examId is present
  useEffect(() => {
    const loadActiveExam = async () => {
      if (tutorContext.activeExamId && tutorContext.selectedClassId) {
        try {
          const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )
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
      <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 bg-white px-3 sm:px-6 md:px-8 py-3 sm:py-3.5 rounded-lg shadow-sm mb-3 sm:mb-4 w-full">
        {/* Left: NCLEX Practice Mode */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => onStrictModeChange(!strictMode)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 ${
              strictMode
                ? 'bg-indigo-50 border-2 border-indigo-300 text-indigo-700 shadow-sm'
                : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
            }`}
          >
            {strictMode ? (
              <ToggleRight className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-slate-400 flex-shrink-0" />
            )}
            <span className={`font-medium text-sm whitespace-nowrap ${strictMode ? 'text-indigo-700 font-semibold' : ''}`}>
              NCLEX Practice Mode
            </span>
          </button>
          {/* Help tooltip */}
          <div className="relative group">
            <HelpCircle className={`w-4 h-4 cursor-help transition-colors flex-shrink-0 ${
              strictMode ? 'text-indigo-500 hover:text-indigo-700' : 'text-slate-400 hover:text-slate-600'
            }`} />
            <div className="absolute top-full left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
              <div className="absolute top-0 left-4 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
              <p className="font-semibold mb-1.5 text-white">NCLEX Practice Mode</p>
              <p className="text-slate-300 leading-relaxed">
                When enabled, the tutor will ask you to think through answers first before providing explanations. This simulates exam conditions and helps build your reasoning skills.
              </p>
            </div>
          </div>
        </div>

        {/* Center: Tutor / Reflections */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1 bg-slate-200 rounded-full p-1 border border-slate-200">
            <button
              onClick={() => handleModeChange('tutor')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                currentMode === 'tutor'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Tutor
            </button>
            <button
              onClick={() => handleModeChange('reflections')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                currentMode === 'reflections'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Reflections
            </button>
          </div>
        </div>

        {/* Right: Class / Topic strip + History */}
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
          {/* Class select - hidden in Reflections mode (reflections are personal, not class-based) */}
          {currentMode === 'tutor' && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
                Class
              </span>
              <select
                value={selectedClassId ?? ""}
                onChange={(e) => onSelectClass?.(e.target.value || undefined)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-[200px] truncate"
              >
                <option value="">General Tutor</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.code} – {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Start New Chat button - only show when there's an active session */}
          {currentSessionId && (
            <div className="flex-shrink-0">
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
                className="flex items-center gap-2 bg-white border-slate-300 shadow-sm hover:bg-slate-50 hover:border-slate-400 text-slate-700 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Chat</span>
              </Button>
            </div>
          )}

          {/* History button removed - now in sidebar */}
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

