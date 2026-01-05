'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  AlertCircle, Calendar, 
  Flame, Target, GraduationCap, Bookmark, 
  CheckCircle2, Sparkles, Search, Folder, Tag,
  Brain, ChevronRight, MessageSquare
} from 'lucide-react'
import { useDensity } from '@/contexts/DensityContext'
import { getDensityTokens } from '@/lib/density-tokens'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'
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
  const [studyStreak, setStudyStreak] = useState<number>(0)
  const [activeDays, setActiveDays] = useState<number>(0)
  const [topicsStudied, setTopicsStudied] = useState<number>(0)
  const [clipsCount, setClipsCount] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showAllClips, setShowAllClips] = useState(false)
  const [chatCountsByClass, setChatCountsByClass] = useState<Array<{ classId: string; className: string; classCode: string; count: number }>>([])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Load graduation date from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('graduation_date')
          .eq('id', user.id)
          .single()
        
        if (profile?.graduation_date) {
          setGraduationDate(profile.graduation_date)
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

  const handleReviewClip = (clip: Clip) => {
    if (clip.chat_id) {
      const params = new URLSearchParams()
      params.set('mode', 'tutor')
      params.set('sessionId', clip.chat_id)
      if (clip.class_id) params.set('classId', clip.class_id)
      if (clip.message_id) params.set('messageId', clip.message_id)
      router.push(`/tutor?${params.toString()}`)
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('forgenursing-tutor-prefill', `Review this learning moment: ${clip.title}\n\n${clip.content}`)
      }
      const params = new URLSearchParams()
      params.set('mode', 'tutor')
      if (clip.class_id) params.set('classId', clip.class_id)
      router.push(`/tutor?${params.toString()}`)
    }
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
      <div className="h-full bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const displayClips = showAllClips ? filteredClips : filteredClips.slice(0, 6)

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className={`${tokens.containerMaxWidth || 'max-w-7xl'} mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8`}>
        {/* Medical Dashboard Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-1">
                Clinical Dashboard
              </h1>
              <p className="text-sm text-slate-600">
                Patient ID: {new Date().toLocaleDateString()} • Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-700">Active</span>
            </div>
          </div>
        </div>

        {/* Vital Signs Row - Medical Style Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white border-l-4 border-l-orange-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Streak</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-slate-900">{studyStreak}</div>
            <div className="text-xs text-slate-600 mt-0.5">day{studyStreak === 1 ? '' : 's'} consecutive</div>
          </div>

          <div className="bg-white border-l-4 border-l-blue-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">This Week</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-slate-900">{activeDays}</div>
            <div className="text-xs text-slate-600 mt-0.5">active day{activeDays === 1 ? '' : 's'}</div>
          </div>

          <div className="bg-white border-l-4 border-l-teal-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-4 h-4 text-teal-500" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Concepts</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-slate-900">{topicsStudied}</div>
            <div className="text-xs text-slate-600 mt-0.5">topics explored</div>
          </div>

          <div className="bg-white border-l-4 border-l-purple-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Bookmark className="w-4 h-4 text-purple-500" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Saved</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-slate-900">{clipsCount}</div>
            <div className="text-xs text-slate-600 mt-0.5">learning moments</div>
          </div>
        </div>

        {/* Study Activity by Class - New Section */}
        {chatCountsByClass.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm mb-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200 px-4 py-3 rounded-t-lg">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Study Activity by Class
              </h3>
              <p className="text-xs text-slate-600 mt-1">See where you're spending the most study time</p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {chatCountsByClass.map((item) => (
                  <div
                    key={item.classId}
                    className="p-3 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {item.classCode}
                      </span>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {item.count} {item.count === 1 ? 'session' : 'sessions'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate">{item.className}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid - Medical Chart Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Left Column: Flagged for Review & Graduation */}
          <div className="space-y-4 md:space-y-6">
            {/* Focus Areas - Medical Alert Panel */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Flagged for Review
                  </h3>
                  {focusAreas.length > 0 && (
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {focusAreas.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                {focusAreas.length > 0 ? (
                  <div className="space-y-2">
                    {focusAreas.slice(0, 5).map((area, index) => (
                      <button
                        key={index}
                        onClick={() => handleFocusAreaClick(area)}
                        className="w-full flex items-center justify-between gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg hover:border-amber-300 hover:bg-amber-100 transition-all group text-left"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span className="text-xs font-medium text-amber-900 truncate">
                            {area.topic}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-50" />
                    <p className="text-xs font-medium">All clear</p>
                    <p className="text-[10px] text-slate-400 mt-1">No topics flagged</p>
                  </div>
                )}
              </div>
            </div>

            {/* Graduation Countdown - Medical Progress Indicator */}
            {graduationDate && daysUntilGrad !== null && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg shadow-sm">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      Graduation
                    </h3>
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  {daysUntilGrad > 0 ? (
                    <div className="text-center">
                      <div className="text-4xl font-bold text-indigo-700 mb-2">{daysUntilGrad}</div>
                      <div className="text-xs text-slate-700 mb-2">day{daysUntilGrad === 1 ? '' : 's'} remaining</div>
                      <div className="text-[10px] text-slate-600">
                        {new Date(graduationDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-700 mb-2">🎓 Complete!</div>
                      <div className="text-xs text-slate-700">Graduation reached</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Learning Library - Medical Record View */}
          <div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-purple-500" />
                    Learning Library
                  </h3>
                  <span className="text-xs text-slate-600">{clipsCount} total</span>
                </div>
              </div>
              
              {/* Search and Filters */}
              <div className="p-4 border-b border-slate-200 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search learning moments..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                {(folders.length > 0 || tags.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedFolder(null)
                        setSelectedTag(null)
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        !selectedFolder && !selectedTag
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
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
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                          selectedFolder === folder
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Folder className="w-3 h-3" />
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
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                          selectedTag === tag
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clips List - Medical Record Cards */}
              <div className="p-4">
                {displayClips.length > 0 ? (
                  <div className="space-y-3">
                    {displayClips.map((clip) => (
                      <button
                        key={clip.id}
                        onClick={() => handleReviewClip(clip)}
                        className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-sm font-semibold text-slate-900 truncate">
                                {clip.title}
                              </h4>
                              <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                {clip.folder}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 line-clamp-2 mb-2">
                              {clip.content.substring(0, 150)}...
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {clip.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              <span className="text-[10px] text-slate-400">
                                {formatTimeAgo(clip.created_at)}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm mb-1">
                      {allClips.length === 0 ? 'No learning moments saved yet' : 'No clips match your filters'}
                    </p>
                    <p className="text-xs">
                      {allClips.length === 0 && 'Save learning moments during study sessions'}
                    </p>
                  </div>
                )}
                
                {filteredClips.length > 6 && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllClips(!showAllClips)}
                      className="text-xs"
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
          <p className="text-xs text-slate-500 italic">
            Dashboard metrics reflect study activity and engagement — not a guarantee of NCLEX performance.
          </p>
        </div>
      </div>
    </div>
  )
}
