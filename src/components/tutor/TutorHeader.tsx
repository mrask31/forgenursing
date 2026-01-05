'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ToggleLeft, ToggleRight, HelpCircle, Plus } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { useTutorContext } from './TutorContext'
import ExamModeDialog from './ExamModeDialog'
import { ExamPlan, StudentClass, NotebookTopic } from '@/lib/types'
import { listExams } from '@/lib/api/exams'

type Mode = 'tutor' | 'reflections'

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
      <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm px-3 sm:px-6 md:px-8 py-4 sm:py-4 rounded-xl shadow-lg shadow-slate-200/50 mb-4 sm:mb-5 w-full">
        {/* Left: NCLEX Practice Mode */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => onStrictModeChange(!strictMode)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              strictMode
                ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 text-indigo-700 shadow-md shadow-indigo-200/50'
                : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50 border-2 border-transparent hover:border-indigo-200'
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

        {/* Center: Tutor / Reflections - Enhanced */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full p-1.5 border border-slate-200/60 shadow-sm">
            <button
              onClick={() => handleModeChange('tutor')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                currentMode === 'tutor'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Tutor
            </button>
            <button
              onClick={() => handleModeChange('reflections')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                currentMode === 'reflections'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
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
                className="rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 max-w-[200px] truncate transition-all duration-200"
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
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-md shadow-indigo-200/30 hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-200/50 text-indigo-700 whitespace-nowrap transition-all duration-200 transform hover:scale-105 active:scale-95 font-semibold"
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

