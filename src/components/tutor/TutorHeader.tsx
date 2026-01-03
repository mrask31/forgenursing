'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Clock, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, X, GraduationCap, HelpCircle, Plus, Trash2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
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

interface Chat {
  id: string
  title: string | null
  session_type: string | null
  updated_at: string
  metadata?: {
    classId?: string
    class_id?: string
    [key: string]: any
  }
}

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
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false)
  const [activeExam, setActiveExam] = useState<ExamPlan | null>(null)
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set(['general'])) // Default: General Tutor expanded
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set()) // Track selected chats for deletion
  const [isDeleting, setIsDeleting] = useState(false)
  const tutorContext = useTutorContext()

  // Fetch chats for history (include archived chats)
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/chats/list?includeArchived=true', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setChats(data.chats || [])
        } else {
          console.error('Failed to fetch chats:', response.status, response.statusText)
          setChats([])
        }
      } catch (error) {
        console.error('[TutorHeader] Failed to fetch chats:', error)
        setChats([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchChats()
  }, [])

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

  // Filter chats by mode (memoized to avoid recalculation)
  const filteredChats = useMemo(() => {
    return chats.filter(chat => {
      if (currentMode === 'tutor') {
        return !chat.session_type || chat.session_type === 'general' || chat.session_type === 'question' || chat.session_type === 'snapshot'
      } else if (currentMode === 'reflections') {
        return chat.session_type === 'reflection'
      }
      return true
    })
  }, [chats, currentMode])

  const handleModeChange = (mode: Mode) => {
    router.push(`/tutor?mode=${mode}`)
  }

  const handleChatClick = (chatId: string, classId?: string | null) => {
    const url = classId
      ? `/tutor?mode=${currentMode}&sessionId=${chatId}&classId=${classId}`
      : `/tutor?mode=${currentMode}&sessionId=${chatId}`
    router.push(url)
    setIsHistoryOpen(false)
  }

  const handleToggleSelectAll = () => {
    if (selectedChatIds.size === filteredChats.length) {
      // Deselect all
      setSelectedChatIds(new Set())
    } else {
      // Select all
      setSelectedChatIds(new Set(filteredChats.map(chat => chat.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedChatIds.size === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedChatIds.size} chat${selectedChatIds.size === 1 ? '' : 's'}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/chats/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ chatIds: Array.from(selectedChatIds) }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[TutorHeader] Failed to delete chats:', error)
        alert('Failed to delete chats. Please try again.')
        return
      }

      // Check if current session was deleted before clearing selection
      const currentSessionId = searchParams.get('sessionId') || searchParams.get('chatId')
      const wasCurrentSessionDeleted = currentSessionId && selectedChatIds.has(currentSessionId)
      
      // Remove deleted chats from local state
      setChats(prev => prev.filter(chat => !selectedChatIds.has(chat.id)))
      setSelectedChatIds(new Set())
      
      // If current session was deleted, navigate away
      if (wasCurrentSessionDeleted) {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('sessionId')
        params.delete('chatId')
        params.delete('id')
        router.replace(`/tutor?${params.toString()}`)
      }
    } catch (error) {
      console.error('[TutorHeader] Error deleting chats:', error)
      alert('Failed to delete chats. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Group chats by class, then by time
  const groupChatsByClassAndTime = (chats: Chat[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const thisWeek = new Date(today)
    thisWeek.setDate(thisWeek.getDate() - 7)

    // First, group chats by class
    const chatsByClass = new Map<string, Chat[]>()
    
    chats.forEach((chat) => {
      const classId = chat.metadata?.classId || chat.metadata?.class_id || null
      const key = classId || 'general'
      
      if (!chatsByClass.has(key)) {
        chatsByClass.set(key, [])
      }
      chatsByClass.get(key)!.push(chat)
    })

    // Then, for each class, group by time
    const result: Array<{
      classLabel: string
      classId: string | null
      timeGroups: Array<{ label: string; chats: Chat[] }>
    }> = []

    // Process General Tutor first
    if (chatsByClass.has('general')) {
      const generalChats = chatsByClass.get('general')!
      const timeGroups: Array<{ label: string; chats: Chat[] }> = [
        { label: 'Today', chats: [] },
        { label: 'Yesterday', chats: [] },
        { label: 'Earlier this week', chats: [] },
        { label: 'Older', chats: [] },
      ]

      generalChats.forEach((chat) => {
        const chatDate = new Date(chat.updated_at)
        if (chatDate >= today) {
          timeGroups[0].chats.push(chat)
        } else if (chatDate >= yesterday) {
          timeGroups[1].chats.push(chat)
        } else if (chatDate >= thisWeek) {
          timeGroups[2].chats.push(chat)
        } else {
          timeGroups[3].chats.push(chat)
        }
      })

      const filteredTimeGroups = timeGroups.filter(group => group.chats.length > 0)
      if (filteredTimeGroups.length > 0) {
        result.push({
          classLabel: 'General Tutor',
          classId: null,
          timeGroups: filteredTimeGroups,
        })
      }
    }

    // Process class-specific chats
    chatsByClass.forEach((classChats, classId) => {
      if (classId === 'general') return // Already processed

      // Find class name from classes prop
      const classInfo = classes.find(c => c.id === classId)
      const classLabel = classInfo ? `${classInfo.code} — ${classInfo.name}` : `Class ${classId}`

      const timeGroups: Array<{ label: string; chats: Chat[] }> = [
        { label: 'Today', chats: [] },
        { label: 'Yesterday', chats: [] },
        { label: 'Earlier this week', chats: [] },
        { label: 'Older', chats: [] },
      ]

      classChats.forEach((chat) => {
        const chatDate = new Date(chat.updated_at)
        if (chatDate >= today) {
          timeGroups[0].chats.push(chat)
        } else if (chatDate >= yesterday) {
          timeGroups[1].chats.push(chat)
        } else if (chatDate >= thisWeek) {
          timeGroups[2].chats.push(chat)
        } else {
          timeGroups[3].chats.push(chat)
        }
      })

      const filteredTimeGroups = timeGroups.filter(group => group.chats.length > 0)
      if (filteredTimeGroups.length > 0) {
        result.push({
          classLabel,
          classId,
          timeGroups: filteredTimeGroups,
        })
      }
    })

    return result
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

          {/* History button - ensure it fits within header padding */}
          <div className="flex-shrink-0">
            <Sheet open={isHistoryOpen} onOpenChange={(open) => {
              setIsHistoryOpen(open)
              // Clear selection when closing
              if (!open) {
                setSelectedChatIds(new Set())
              }
            }}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-white border-slate-300 shadow-sm hover:bg-slate-50 hover:border-slate-400 text-slate-700 whitespace-nowrap"
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">History</span>
                </Button>
              </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 flex flex-col">
              <SheetHeader className="px-6 py-4 border-b border-slate-200 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <SheetTitle className="text-slate-900 font-semibold tracking-tight">Session History</SheetTitle>
                    <p className="text-xs text-slate-600 mt-1">
                      Quickly return to past learning moments.
                    </p>
                  </div>
                  {filteredChats.length > 0 && (
                    <div className="flex items-center gap-2">
                      {selectedChatIds.size > 0 ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete ({selectedChatIds.size})
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedChatIds(new Set())}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleToggleSelectAll}
                          className="text-xs text-slate-600"
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading ? (
                  <div className="p-6 text-center text-slate-600">Loading...</div>
                ) : filteredChats.length === 0 ? (
                  <div className="p-6 text-center text-slate-600">No chats yet</div>
                ) : (
                  <div className="p-4">
                    {groupChatsByClassAndTime(filteredChats).map((classGroup, classIndex) => {
                      const classKey = classGroup.classId || 'general'
                      const isExpanded = expandedClasses.has(classKey)
                      const totalChats = classGroup.timeGroups.reduce((sum, tg) => sum + tg.chats.length, 0)

                      return (
                        <div key={classKey} className={classIndex > 0 ? 'mt-6' : ''}>
                          {/* Collapsible Class Header */}
                          <button
                            onClick={() => {
                              setExpandedClasses(prev => {
                                const next = new Set(prev)
                                if (next.has(classKey)) {
                                  next.delete(classKey)
                                } else {
                                  next.add(classKey)
                                }
                                return next
                              })
                            }}
                            className="w-full flex items-center justify-between gap-2 px-2 py-2 mb-2 rounded-lg hover:bg-slate-50 transition-colors group"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <GraduationCap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                              <h2 className="text-sm font-semibold text-slate-900 truncate">
                                {classGroup.classLabel}
                              </h2>
                              <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                {totalChats} {totalChats === 1 ? 'chat' : 'chats'}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0 transition-colors" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0 transition-colors" />
                            )}
                          </button>
                          
                          {/* Time Groups within this class - only show if expanded */}
                          {isExpanded && (
                            <div className="pl-2">
                              {classGroup.timeGroups.map((timeGroup, timeIndex) => (
                                <div key={timeIndex} className="mb-6">
                                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide px-2 mb-2">
                                    {timeGroup.label}
                                  </h3>
                                  {timeGroup.chats.map((chat) => {
                                    const Icon = getSessionIcon(chat.session_type)
                                    const badge = getSessionBadge(chat.session_type)
                                    const currentSessionId = searchParams.get('sessionId') || searchParams.get('chatId')
                                    const isActive = currentSessionId === chat.id
                                    const isSelected = selectedChatIds.has(chat.id)

                                    return (
                                      <div
                                        key={chat.id}
                                        className={`w-full p-3 rounded-lg mb-1 transition-colors ${
                                          isActive && !isSelected
                                            ? 'bg-[var(--tutor-primary)]/10 border border-[var(--tutor-primary)]/20'
                                            : isSelected
                                            ? 'bg-blue-50 border border-blue-200'
                                            : 'hover:bg-slate-50 border border-transparent'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2">
                                          {/* Checkbox for selection */}
                                          <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) => {
                                              setSelectedChatIds(prev => {
                                                const next = new Set(prev)
                                                if (checked) {
                                                  next.add(chat.id)
                                                } else {
                                                  next.delete(chat.id)
                                                }
                                                return next
                                              })
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="mt-0.5 flex-shrink-0"
                                          />
                                          {/* Chat content - clickable when not in selection mode */}
                                          <button
                                            onClick={(e) => {
                                              if (selectedChatIds.size > 0) {
                                                // In selection mode, clicking toggles selection
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setSelectedChatIds(prev => {
                                                  const next = new Set(prev)
                                                  if (next.has(chat.id)) {
                                                    next.delete(chat.id)
                                                  } else {
                                                    next.add(chat.id)
                                                  }
                                                  return next
                                                })
                                              } else {
                                                // Normal mode, navigate to chat
                                                const url = classGroup.classId
                                                  ? `/tutor?mode=${currentMode}&sessionId=${chat.id}&classId=${classGroup.classId}`
                                                  : `/tutor?mode=${currentMode}&sessionId=${chat.id}`
                                                router.push(url)
                                                setIsHistoryOpen(false)
                                              }
                                            }}
                                            className="flex-1 text-left min-w-0"
                                          >
                                            <div className="flex items-start gap-2">
                                              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-500" />
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                  <span className="text-sm font-medium text-slate-900 truncate">
                                                    {chat.title || 'Untitled Chat'}
                                                  </span>
                                                  <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    {badge}
                                                  </span>
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                  {formatTime(chat.updated_at)}
                                                </span>
                                              </div>
                                            </div>
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          </div>
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

