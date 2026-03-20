'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, Calendar,
  Flame, Target, GraduationCap, Bookmark,
  CheckCircle2, Sparkles, Search, Folder, Tag,
  Brain, ChevronRight, MessageSquare, Trash2
} from 'lucide-react'
import { useDensity } from '@/contexts/DensityContext'
import { getDensityTokens } from '@/lib/density-tokens'
import { Button } from '@/components/ui/button'
import { getBrowserClient } from '@/lib/supabase/client'
import { listClasses } from '@/lib/api/classes'
import type { StudentClass } from '@/lib/types'
import ReactMarkdown from 'react-markdown'

interface Chat {
  id: string
  title: string | null
  session_type: string | null
  updated_at: string
  metadata?: {
    classId?: string
    class_id?: string
    topicTitle?: string
    topicTerm?: string
    [key: string]: any
  }
}

interface Clip {
  id: string
  title: string
  content: string
  folder: string
  tags: string[]
  created_at: string
  chat_id: string | null
  class_id: string | null
  message_id: string | null
}

interface FocusArea {
  topic: string
  priority: 'high' | 'medium' | 'low'
  lastStudied?: string
  chatId?: string
  messageId?: string // For flagged message pairs
}

interface RecentDocument {
  id: string
  filename: string
  created_at: string
  document_type: string | null
  metadata?: {
    class_id?: string
    classId?: string
    [key: string]: any
  }
}

export default function ClinicalDashboard() {
  const { density } = useDensity()
  const tokens = getDensityTokens(density)
  const router = useRouter()
  const [classes, setClasses] = useState<StudentClass[]>([])
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([])
  const [allClips, setAllClips] = useState<Clip[]>([])
  const [filteredClips, setFilteredClips] = useState<Clip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [graduationDate, setGraduationDate] = useState<string | null>(null)
  const [preferredName, setPreferredName] = useState<string | null>(null)
  const [programTrack, setProgramTrack] = useState<string | null>(null)
  const [studyStreak, setStudyStreak] = useState<number>(0)
  const [activeDays, setActiveDays] = useState<number>(0)
  const [topicsStudied, setTopicsStudied] = useState<number>(0)
  const [clipsCount, setClipsCount] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showAllClips, setShowAllClips] = useState(false)
  const [chatCountsByClass, setChatCountsByClass] = useState<Array<{ classId: string; className: string; classCode: string; count: number }>>([])
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([])
  const [expandedClipId, setExpandedClipId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
  const supabase = getBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Load profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('graduation_date, preferred_name, program_track')
          .eq('id', user.id)
          .single()

        if (profile) {
          if (profile.graduation_date) {
            setGraduationDate(profile.graduation_date)
          }
          if (profile.preferred_name) {
            setPreferredName(profile.preferred_name)
          }
          if (profile.program_track) {
            setProgramTrack(profile.program_track)
          }
        }

        // Load classes
        const userClasses = await listClasses(user.id)
        setClasses(userClasses)

        // Load all chats (including archived) to find needsHelp chats
        const chatsRes = await fetch('/api/chats/list?includeArchived=true', {
          credentials: 'include'
        })
        if (chatsRes.ok) {
          const chatsData = await chatsRes.json()
          const allChats = (chatsData.chats || []) as Chat[]

          // Filter to tutor mode chats only (not reflections)
          const tutorChats = allChats.filter(chat =>
            !chat.session_type ||
            chat.session_type === 'general' ||
            chat.session_type === 'question' ||
            chat.session_type === 'snapshot'
          )


          // Calculate consistency (active days in last 7)
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          const recentActiveDays = new Set(
            tutorChats
              .filter(chat => new Date(chat.updated_at) >= sevenDaysAgo)
              .map(chat => new Date(chat.updated_at).toDateString())
          ).size
          setActiveDays(recentActiveDays)

          // Calculate study streak (consecutive days with activity)
          const sortedChats = [...tutorChats].sort((a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
          let streak = 0
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          for (let i = 0; i < sortedChats.length; i++) {
            const chatDate = new Date(sortedChats[i].updated_at)
            chatDate.setHours(0, 0, 0, 0)
            const daysDiff = Math.floor((today.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24))

            if (daysDiff === streak) {
              streak++
            } else if (daysDiff > streak) {
              break
            }
          }
          setStudyStreak(streak)

          // Calculate concepts mastered (unique topics from chat titles/metadata)
          const uniqueTopics = new Set(
            tutorChats
              .map(chat => chat.title || chat.metadata?.topicTitle || chat.metadata?.topicTerm)
              .filter(Boolean)
          )
          setTopicsStudied(uniqueTopics.size)

          // Generate focus areas from flagged message pairs
          // Collect all flagged message IDs from all chats
          const flaggedMessagePairs: Array<{ chatId: string; messageId: string; chatTitle: string; updatedAt: string }> = []

          for (const chat of allChats) {
            const isTutorChat = !chat.session_type ||
              chat.session_type === 'general' ||
              chat.session_type === 'question' ||
              chat.session_type === 'snapshot'

            if (isTutorChat && chat.metadata?.flaggedMessages && Array.isArray(chat.metadata.flaggedMessages)) {
              const flaggedIds = chat.metadata.flaggedMessages as string[]
              for (const messageId of flaggedIds) {
                flaggedMessagePairs.push({
                  chatId: chat.id,
                  messageId,
                  chatTitle: chat.title || chat.metadata?.topicTitle || chat.metadata?.topicTerm || 'Untitled Topic',
                  updatedAt: chat.updated_at
                })
              }
            }
          }

          // Sort by most recently updated
          flaggedMessagePairs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

          // Create focus areas from flagged message pairs
          const focusTopics: FocusArea[] = flaggedMessagePairs.map(pair => ({
            topic: `${pair.chatTitle} (Flagged Q&A)`,
            priority: 'high' as const,
            lastStudied: pair.updatedAt,
            chatId: pair.chatId,
            messageId: pair.messageId // Store messageId for navigation
          }))

          setFocusAreas(focusTopics)

          // Calculate chat counts by class
          const classChatCounts: Array<{ classId: string; className: string; classCode: string; count: number }> = []
          for (const classItem of userClasses) {
            const classChats = tutorChats.filter((chat: Chat) => {
              const chatClassId = chat.metadata?.classId || chat.metadata?.class_id
              return chatClassId === classItem.id
            })
            if (classChats.length > 0) {
              classChatCounts.push({
                classId: classItem.id,
                className: classItem.name,
                classCode: classItem.code,
                count: classChats.length
              })
            }
          }
          // Sort by count (descending)
          classChatCounts.sort((a, b) => b.count - a.count)
          setChatCountsByClass(classChatCounts)
        }

        // Load all clips
        const clipsRes = await fetch('/api/clips/list', {
          credentials: 'include'
        })
        if (clipsRes.ok) {
          const clipsData = await clipsRes.json()
          const clips = (clipsData.clips || []) as Clip[]
          setAllClips(clips)
          setClipsCount(clips.length)
          filterClips(clips, searchQuery, selectedFolder, selectedTag)
        }

        // Load recent documents for Quick Study section
        const docsRes = await fetch('/api/binder', {
          credentials: 'include'
        })
        if (docsRes.ok) {
          const docsData = await docsRes.json()
          const docs = (docsData.files || []) as RecentDocument[]
          // Sort by created_at descending and take top 3
          const sortedDocs = docs.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ).slice(0, 3)
          setRecentDocuments(sortedDocs)
        }
      } catch (error) {
        console.error('[Dashboard] Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const filterClips = (clips: Clip[], query: string, folder: string | null, tag: string | null) => {
    let filtered = [...clips]

    if (query) {
      const searchQuery = query.toLowerCase()
      filtered = filtered.filter(
        clip => clip.title.toLowerCase().includes(searchQuery) || clip.content.toLowerCase().includes(searchQuery)
      )
    }

    if (folder) {
      filtered = filtered.filter(clip => clip.folder === folder)
    }

    if (tag) {
      filtered = filtered.filter(clip => clip.tags.includes(tag))
    }

    setFilteredClips(filtered)
  }

  useEffect(() => {
    filterClips(allClips, searchQuery, selectedFolder, selectedTag)
  }, [searchQuery, selectedFolder, selectedTag, allClips])

  const folders = Array.from(new Set(allClips.map(c => c.folder))).sort()
  const tags = Array.from(new Set(allClips.flatMap(c => c.tags))).sort()

  const handleFocusAreaClick = (area: FocusArea) => {
    if (area.chatId) {
      const params = new URLSearchParams()
      params.set('mode', 'tutor')
      params.set('sessionId', area.chatId)
      if (area.messageId) params.set('messageId', area.messageId)
      router.push(`/tutor?${params.toString()}`)
    }
  }

  const handleReviewClip = async (clip: Clip) => {
    // If no chat_id, show content inline
    if (!clip.chat_id) {
      setExpandedClipId(expandedClipId === clip.id ? null : clip.id)
      return
    }

    // Verify the session still exists before navigating
    try {
      const res = await fetch(`/api/history?id=${clip.chat_id}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const messages = Array.isArray(data) ? data : data.messages || []
        if (messages.length > 0) {
          // Session exists — navigate to it
          const params = new URLSearchParams()
          params.set('mode', 'tutor')
          params.set('sessionId', clip.chat_id)
          if (clip.class_id) params.set('classId', clip.class_id)
          if (clip.message_id) params.set('messageId', clip.message_id)
          router.push(`/tutor?${params.toString()}`)
          return
        }
      }
    } catch {
      // Session check failed — fall through to inline display
    }

    // Session is deleted or empty — show content inline
    setExpandedClipId(expandedClipId === clip.id ? null : clip.id)
  }

  const handleDeleteClip = async (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the review clip action

    if (!confirm('Are you sure you want to delete this learning moment? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/clips?id=${clipId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete clip')
      }

      // Remove from local state - this will trigger the useEffect to re-filter
      const updatedClips = allClips.filter(c => c.id !== clipId)
      setAllClips(updatedClips)
      setClipsCount(prev => prev - 1)
    } catch (error) {
      console.error('Failed to delete clip:', error)
      alert('Failed to delete clip. Please try again.')
    }
  }

  const handleStudyDocument = (doc: RecentDocument) => {
    const classId = doc.metadata?.class_id || doc.metadata?.classId
    const params = new URLSearchParams()
    if (classId) {
      params.set('classId', classId)
    }
    router.push(`/tutor?${params.toString()}`)
  }

  const formatTimeAgo = (dateString: string) => {
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

  const calculateDaysUntilGraduation = () => {
    if (!graduationDate) return null
    const grad = new Date(graduationDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    grad.setHours(0, 0, 0, 0)
    const diff = grad.getTime() - today.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  const daysUntilGrad = calculateDaysUntilGraduation()

  if (isLoading) {
    return (
      <div className="h-full bg-[var(--gray-50)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--teal-light)] mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--teal)] border-t-transparent"></div>
          </div>
          <p className="text-lg font-medium text-[var(--gray-400)]">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const displayClips = showAllClips ? filteredClips : filteredClips.slice(0, 6)

  return (
    <div className="h-full overflow-y-auto bg-[var(--gray-50)]">
      <div className={`${tokens.containerMaxWidth || 'max-w-7xl'} mx-auto px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 pt-safe-t pb-safe-b`}>
        {/* Medical Dashboard Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between mb-3 sm:mb-4 flex-wrap gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-2 sm:p-2.5 bg-[var(--teal)] rounded-xl flex-shrink-0">
                  {/* Teal waveform icon */}
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12h2l3-9 4 18 4-18 3 9h2" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-[var(--gray-400)] uppercase tracking-wider">Student Chart</p>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-[var(--navy)]">
                      {preferredName || 'Student'}
                    </h1>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[var(--green)] rounded-full"></div>
                      <span className="text-xs sm:text-sm font-medium text-[var(--green)]">Active</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Student Chart Details */}
              <div className="ml-11 sm:ml-14 max-w-2xl space-y-1 sm:space-y-1.5">
                <p className="text-sm sm:text-base font-medium text-[var(--gray-800)]">
                  {programTrack || 'RN Track'}
                </p>
                {graduationDate && daysUntilGrad !== null && (
                  <p className="text-xs sm:text-sm text-[var(--gray-400)]">
                    {daysUntilGrad > 0 ? (
                      <>
                        Class of {new Date(graduationDate).getFullYear()} &middot; {daysUntilGrad} day{daysUntilGrad === 1 ? '' : 's'} until {new Date(graduationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </>
                    ) : (
                      <>
                        Class of {new Date(graduationDate).getFullYear()} &middot; Graduation reached
                      </>
                    )}
                  </p>
                )}
                <p className="text-xs text-[var(--gray-400)]">
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Study Vitals Label */}
        <div className="mb-3 sm:mb-4 border-b border-[var(--gray-200)] pb-2">
          <h2 className="text-xs sm:text-sm font-semibold text-[var(--gray-400)] uppercase tracking-wider">
            Study Vitals
          </h2>
        </div>

        {/* Vital Signs Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-white border border-[var(--gray-200)] border-t-4 border-t-[var(--amber)] rounded-xl p-3 sm:p-4 md:p-5 hover:border-[var(--teal)] transition-colors duration-200">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-[var(--amber-light)] rounded-lg">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--amber)]" />
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-[var(--gray-400)] uppercase tracking-wide">Streak</span>
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--navy)] mb-1">{studyStreak}</div>
            <div className="text-xs sm:text-sm text-[var(--gray-400)]">day{studyStreak === 1 ? '' : 's'} consecutive</div>
          </div>

          <div className="bg-white border border-[var(--gray-200)] border-t-4 border-t-[var(--teal)] rounded-xl p-3 sm:p-4 md:p-5 hover:border-[var(--teal)] transition-colors duration-200">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-[var(--teal-light)] rounded-lg">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--teal)]" />
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-[var(--gray-400)] uppercase tracking-wide">This Week</span>
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--navy)] mb-1">{activeDays}</div>
            <div className="text-xs sm:text-sm text-[var(--gray-400)]">active day{activeDays === 1 ? '' : 's'}</div>
          </div>

          <div className="bg-white border border-[var(--gray-200)] border-t-4 border-t-[var(--teal-bright)] rounded-xl p-3 sm:p-4 md:p-5 hover:border-[var(--teal)] transition-colors duration-200">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-[var(--teal-light)] rounded-lg">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--teal-bright)]" />
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-[var(--gray-400)] uppercase tracking-wide">Concepts</span>
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--navy)] mb-1">{topicsStudied}</div>
            <div className="text-xs sm:text-sm text-[var(--gray-400)]">topics explored</div>
          </div>

          <div className="bg-white border border-[var(--gray-200)] border-t-4 border-t-[var(--navy)] rounded-xl p-3 sm:p-4 md:p-5 hover:border-[var(--teal)] transition-colors duration-200">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-[var(--gray-100)] rounded-lg">
                <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--navy)]" />
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-[var(--gray-400)] uppercase tracking-wide">Saved</span>
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--navy)] mb-1">{clipsCount}</div>
            <div className="text-xs sm:text-sm text-[var(--gray-400)]">learning moments</div>
          </div>
        </div>

        {/* Study Activity by Class */}
        {chatCountsByClass.length > 0 && (
          <div className="bg-white border border-[var(--gray-200)] rounded-xl mb-8 overflow-hidden">
            <div className="border-b border-[var(--gray-200)] px-6 py-4">
              <h3 className="text-base font-bold text-[var(--navy)] flex items-center gap-2.5 mb-1">
                <div className="p-1.5 bg-[var(--navy)] rounded-lg">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-[var(--gray-400)] uppercase tracking-wider">Study Activity by Class</span>
              </h3>
              <p className="text-sm text-[var(--gray-400)] ml-8">See where you're spending the most study time</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {chatCountsByClass.map((item) => (
                  <div
                    key={item.classId}
                    className="p-4 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--teal)] transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-[var(--navy)] truncate">
                        {item.classCode}
                      </span>
                      <span className="text-xs font-bold text-[var(--teal)] bg-[var(--teal-light)] px-2.5 py-1 rounded-lg border border-[var(--teal)]/20">
                        {item.count} {item.count === 1 ? 'session' : 'sessions'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--gray-400)] truncate">{item.className}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Study - Recent Materials */}
        {recentDocuments.length > 0 && (
          <div className="bg-white border border-[var(--gray-200)] rounded-xl mb-8 overflow-hidden">
            <div className="border-b border-[var(--gray-200)] px-6 py-4">
              <h3 className="text-base font-bold text-[var(--navy)] flex items-center gap-2.5 mb-1">
                <div className="p-1.5 bg-[var(--teal)] rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-[var(--gray-400)] uppercase tracking-wider">Quick Study</span>
              </h3>
              <p className="text-sm text-[var(--gray-400)] ml-8">Jump right into your recently uploaded materials</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--teal)] transition-colors duration-200"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[var(--navy)] truncate mb-1">
                          {doc.filename}
                        </h4>
                        <p className="text-xs text-[var(--gray-400)]">
                          Uploaded {formatTimeAgo(doc.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleStudyDocument(doc)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--teal)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
                      >
                        <Sparkles className="w-4 h-4" />
                        Study This
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid - Medical Chart Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-6">
          {/* Left Column: Flagged for Review & Graduation */}
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Focus Areas - Flagged for Review */}
            <div className="bg-white border border-[var(--gray-200)] rounded-xl overflow-hidden">
              <div className="border-b border-[var(--gray-200)] px-6 py-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-[var(--amber)] flex items-center gap-2.5">
                    <div className="p-1.5 bg-[var(--amber)] rounded-lg">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-[var(--gray-400)] uppercase tracking-wider">Flagged for Review</span>
                  </h3>
                  {focusAreas.length > 0 && (
                    <span className="text-xs font-bold text-[var(--amber)] bg-[var(--amber-light)] px-3 py-1 rounded-lg border border-[var(--amber)]/20">
                      {focusAreas.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--gray-400)] ml-8">Review Queue</p>
              </div>
              <div className="p-6">
                {focusAreas.length > 0 ? (
                  <div className="space-y-3">
                    {focusAreas.slice(0, 5).map((area, index) => (
                      <button
                        key={index}
                        onClick={() => handleFocusAreaClick(area)}
                        className="w-full flex items-center justify-between gap-3 p-4 bg-[var(--amber-light)] border border-[var(--amber)]/20 rounded-xl hover:border-[var(--amber)] transition-colors duration-200 group text-left"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <AlertCircle className="w-5 h-5 text-[var(--amber)] flex-shrink-0" />
                          <span className="text-sm font-semibold text-[var(--gray-800)] truncate">
                            {area.topic}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--amber)] group-hover:translate-x-1 transition-transform flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--green-light)] mb-4">
                      <CheckCircle2 className="w-8 h-8 text-[var(--green)]" />
                    </div>
                    <p className="text-sm font-semibold text-[var(--gray-800)]">All clear</p>
                    <p className="text-xs text-[var(--gray-400)] mt-1">No topics flagged</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Learning Library */}
          <div>
            <div className="bg-white border border-[var(--gray-200)] rounded-xl overflow-hidden">
              <div className="border-b border-[var(--gray-200)] px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--navy)] flex items-center gap-2.5">
                    <div className="p-1.5 bg-[var(--navy)] rounded-lg">
                      <Bookmark className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-[var(--gray-400)] uppercase tracking-wider">Learning Library</span>
                  </h3>
                  <span className="text-sm font-bold text-[var(--gray-800)] bg-[var(--gray-100)] px-3 py-1 rounded-lg border border-[var(--gray-200)]">{clipsCount} total</span>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="p-6 border-b border-[var(--gray-200)] space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--gray-400)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search learning moments..."
                    className="w-full pl-12 pr-4 py-3 text-sm font-medium border border-[var(--gray-200)] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[var(--teal)]/50 focus:border-[var(--teal)] transition-colors duration-200"
                  />
                </div>
                {(folders.length > 0 || tags.length > 0) && (
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => {
                        setSelectedFolder(null)
                        setSelectedTag(null)
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 ${
                        !selectedFolder && !selectedTag
                          ? 'bg-[var(--teal)] text-white'
                          : 'bg-white text-[var(--gray-800)] border border-[var(--gray-200)] hover:border-[var(--teal)]'
                      }`}
                    >
                      All
                    </button>
                    {folders.map(folder => (
                      <button
                        key={folder}
                        onClick={() => {
                          setSelectedFolder(folder)
                          setSelectedTag(null)
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 flex items-center gap-1.5 ${
                          selectedFolder === folder
                            ? 'bg-[var(--teal)] text-white'
                            : 'bg-white text-[var(--gray-800)] border border-[var(--gray-200)] hover:border-[var(--teal)]'
                        }`}
                      >
                        <Folder className="w-3.5 h-3.5" />
                        {folder}
                      </button>
                    ))}
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTag(tag)
                          setSelectedFolder(null)
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 flex items-center gap-1.5 ${
                          selectedTag === tag
                            ? 'bg-[var(--teal)] text-white'
                            : 'bg-white text-[var(--gray-800)] border border-[var(--gray-200)] hover:border-[var(--teal)]'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clips List */}
              <div className="p-6">
                {displayClips.length > 0 ? (
                  <div className="space-y-4">
                    {displayClips.map((clip) => (
                      <div
                        key={clip.id}
                        className="relative group"
                      >
                        <button
                          onClick={() => handleReviewClip(clip)}
                          className="w-full text-left p-5 rounded-xl border border-[var(--gray-200)] bg-white hover:border-[var(--teal)] transition-colors duration-200"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                                <h4 className="text-base font-bold text-[var(--navy)] truncate">
                                  {clip.title}
                                </h4>
                                <span className="text-xs font-semibold text-[var(--teal)] bg-[var(--teal-light)] px-3 py-1 rounded-lg border border-[var(--teal)]/20">
                                  {clip.folder}
                                </span>
                              </div>
                              {expandedClipId === clip.id ? (
                                <div className="text-sm text-[var(--gray-800)] mb-3 leading-relaxed whitespace-pre-wrap">
                                  <ReactMarkdown>{clip.content}</ReactMarkdown>
                                </div>
                              ) : (
                                <div className="text-sm text-[var(--gray-400)] line-clamp-2 mb-3 leading-relaxed">
                                  {(() => {
                                    const stripped = clip.content
                                      .replace(/^(certainly|sure|great question|absolutely|of course|let'?s|okay|alright|i'?d be happy to|here'?s|let me)[!,.]?\s*/i, '')
                                      .replace(/^(let'?s\s+)?(break\s+down|dive\s+into|explore|look\s+at|walk\s+through|go\s+over)\s+(some\s+)?(key\s+)?(concepts?|topics?|points?|details?|information)[\s.!,]*/i, '')
                                      .replace(/^#{1,3}\s+\S+\s*\n?/, '')
                                      .trim()
                                    return (stripped || clip.content).substring(0, 150) + '...'
                                  })()}
                                </div>
                              )}
                              <div className="flex items-center gap-2.5 flex-wrap">
                                {clip.tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="text-xs font-medium px-2.5 py-1 bg-[var(--gray-100)] text-[var(--gray-800)] rounded-lg border border-[var(--gray-200)]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                <span className="text-xs text-[var(--gray-400)] font-medium">
                                  {formatTimeAgo(clip.created_at)}
                                </span>
                                {expandedClipId === clip.id && (
                                  <span className="text-xs text-[var(--teal)] font-medium">Viewing saved content</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={(e) => handleDeleteClip(clip.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-[var(--red)] hover:bg-[var(--red-light)] transition-colors duration-200"
                                title="Delete this learning moment"
                                aria-label="Delete clip"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <ChevronRight className="w-5 h-5 text-[var(--gray-400)] group-hover:text-[var(--teal)] group-hover:translate-x-1 transition-all duration-200" />
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--teal-light)] mb-6">
                      <Bookmark className="w-10 h-10 text-[var(--teal)]" />
                    </div>
                    <p className="text-base font-semibold text-[var(--gray-800)] mb-2">
                      {allClips.length === 0 ? 'No learning moments saved yet' : 'No clips match your filters'}
                    </p>
                    <p className="text-sm text-[var(--gray-400)]">
                      {allClips.length === 0 && 'Save learning moments during study sessions'}
                    </p>
                  </div>
                )}

                {filteredClips.length > 6 && (
                  <div className="mt-6 text-center">
                    <Button
                      onClick={() => setShowAllClips(!showAllClips)}
                      className="bg-[var(--teal)] hover:opacity-90 text-white transition-opacity duration-200 font-semibold"
                    >
                      {showAllClips ? 'Show Less' : `Show All (${filteredClips.length})`}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--gray-400)] italic">
            Dashboard metrics reflect study activity and engagement — not a guarantee of NCLEX performance.
          </p>
        </div>
      </div>
    </div>
  )
}
