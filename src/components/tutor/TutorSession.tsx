'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import ClinicalTutorWorkspace from '@/components/chat/ClinicalTutorWorkspace'
import ChatInterface from '@/components/tutor/ChatInterface'
import TutorEmptyState from '@/components/tutor/TutorEmptyState'
import ChatMessageList, { type ChatMessage } from '@/components/tutor/ChatMessageList'
import { useTutorContext } from '@/components/tutor/TutorContext'
import { listNotebookTopics } from '@/lib/api/notebook'
import { NotebookTopic } from '@/lib/types'
import { getBrowserClient } from '@/lib/supabase/client'
import posthog from 'posthog-js'

type Mode = 'tutor'

interface TutorSessionProps {
  sessionId?: string // Optional - will be created on first message if missing
  mode: Mode
  onSessionCreated?: (sessionId: string) => void // Callback when session is created
  attachedFiles?: { id: string, name: string, document_type: string | null }[] // Attached files from parent
  onDetachFile?: (fileId: string) => void // Callback to detach a file
  messages?: ChatMessage[] // Messages from parent for evidence derivation
  onMessagesChange?: (messages: ChatMessage[]) => void // Callback to update messages in parent
  onTopicsChange?: (topics: NotebookTopic[]) => void // Callback to update topics in parent for header
  scrollToMessageId?: string // Optional message ID to scroll to when messages load
}

export default function TutorSession({
  sessionId: propSessionId,
  mode,
  onSessionCreated,
  attachedFiles: propAttachedFiles = [],
  onDetachFile,
  messages: propMessages = [],
  onMessagesChange: propOnMessagesChange,
  onTopicsChange,
  scrollToMessageId
}: TutorSessionProps) {
  const router = useRouter()
  const tutorContext = useTutorContext()
  // Use prop attachedFiles if provided, otherwise use local state
  const [localAttachedFiles, setLocalAttachedFiles] = useState<{ id: string, name: string, document_type: string | null }[]>([])
  const [isLoadingAttachedFiles, setIsLoadingAttachedFiles] = useState(false)
  // Merge prop and local: prop takes precedence for display, but we keep local for updates
  const attachedFiles = propAttachedFiles.length > 0 ? propAttachedFiles : localAttachedFiles
  
  // Evidence state management - use prop messages if provided, otherwise local state
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([])
  const messages = propMessages.length > 0 ? propMessages : localMessages
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [savingToNotebook, setSavingToNotebook] = useState<string | null>(null)
  
  // Debug: Log attachedFiles prop flow
  useEffect(() => {
  }, [propAttachedFiles, localAttachedFiles, attachedFiles]);
  
  const [localSessionId, setLocalSessionId] = useState<string | undefined>(propSessionId)
  const [activeChunkCount, setActiveChunkCount] = useState<number>(0)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef<boolean>(true) // Track if we should auto-scroll
  const [availableTopics, setAvailableTopics] = useState<NotebookTopic[]>([])
  const lastLoadedClassIdRef = useRef<string | undefined>(undefined) // Prevent duplicate loads
  
  // Update localSessionId when prop changes and reset auto-scroll
  useEffect(() => {
    if (propSessionId) {
      setLocalSessionId(propSessionId)
      // Reset auto-scroll when session changes
      shouldAutoScrollRef.current = true
    }
  }, [propSessionId])

  // Zero-click onboarding: auto-inject a starter scenario on first-ever session
  const STARTER_SCENARIOS = [
    "You have a 72-year-old patient with heart failure presenting with SOB and bilateral crackles. Where do you start?",
    "Your patient is a 45-year-old diabetic admitted with blood glucose of 580 mg/dL, fruity breath, and Kussmaul respirations. What's your priority?",
    "A 28-year-old post-op patient suddenly becomes restless, tachycardic at 120, and their surgical dressing is saturated. What do you assess first?",
    "You're caring for a 65-year-old on IV heparin whose aPTT comes back at 95 seconds (therapeutic range 60-80). What's your next action?",
    "A 3-month-old infant is brought to the ED with a temperature of 102.5°F, poor feeding, and a bulging fontanelle. What are your priority assessments?",
  ]
  const onboardingTriggeredRef = useRef(false)

  useEffect(() => {
    if (onboardingTriggeredRef.current) return
    if (!localSessionId) return
    // Only trigger if no messages yet in this session
    if (messages.length > 0) return
    // Check if onboarding was already completed
    if (typeof window === 'undefined') return
    if (localStorage.getItem('forge-onboarding-completed')) return

    // Check if user has any prior sessions
    const checkAndTrigger = async () => {
      try {
        const res = await fetch('/api/chats/list', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        const chats = data.chats || []
        // Filter to only tutor chats (not reflections)
        const tutorChats = chats.filter((c: any) =>
          !c.session_type || c.session_type === 'general' || c.session_type === 'question' || c.session_type === 'snapshot'
        )
        // If more than 1 chat exists (current one + others), user is not new
        if (tutorChats.length > 1) {
          localStorage.setItem('forge-onboarding-completed', 'true')
          return
        }

        // This is the user's first session — auto-inject a starter scenario
        onboardingTriggeredRef.current = true
        const scenarioIndex = Date.now() % 5
        const scenario = STARTER_SCENARIOS[scenarioIndex]

        posthog.capture('zero_click_onboarding_triggered')

        // Small delay to let ClinicalTutorWorkspace initialize
        setTimeout(() => {
          handleSend(scenario)
        }, 800)
      } catch (err) {
        console.error('[TutorSession] Onboarding check failed:', err)
      }
    }

    // Delay the check to let the session fully initialize
    const timer = setTimeout(checkAndTrigger, 1200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSessionId, messages.length])
  
  // Hide file banner when topic or exam context is active
  const hasStructuredContext = !!(tutorContext.selectedTopicId || tutorContext.activeExamId)
  
  // Use localSessionId for rendering (will be updated when session is created)
  const sessionId = localSessionId

  // Check for active binder files
  useEffect(() => {
    const checkActiveFiles = async () => {
      try {
        const response = await fetch('/api/binder', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          const activeFiles = data.files?.filter((f: any) => f.isActive !== false) || []
          setActiveChunkCount(activeFiles.length)
        }
      } catch (error) {
        console.error('[TutorSession] Error checking active files:', error)
      }
    }
    
    if (mode === 'tutor') {
      checkActiveFiles()
    }
  }, [mode])

  // Check if user has seen onboarding
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('forgenursing-has-seen-tutor-onboarding')
      setHasSeenOnboarding(seen === 'true')
    }
  }, [])

  // Mark onboarding as seen when files are added
  useEffect(() => {
    if (activeChunkCount > 0 && !hasSeenOnboarding && typeof window !== 'undefined') {
      localStorage.setItem('forgenursing-has-seen-tutor-onboarding', 'true')
      setHasSeenOnboarding(true)
    }
  }, [activeChunkCount, hasSeenOnboarding])

  // Load topics when class is selected
  useEffect(() => {
    const loadTopics = async () => {
      // Prevent duplicate loads for the same classId
      if (lastLoadedClassIdRef.current === tutorContext.selectedClassId) {
        return
      }

      if (!tutorContext.selectedClassId) {
        setAvailableTopics([])
        if (onTopicsChange) {
          onTopicsChange([])
        }
        lastLoadedClassIdRef.current = undefined
        return
      }

      // Mark that we're loading this classId
      lastLoadedClassIdRef.current = tutorContext.selectedClassId

      try {
  const supabase = getBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const topics = await listNotebookTopics(user.id, tutorContext.selectedClassId)
          setAvailableTopics(topics)
          if (onTopicsChange) {
            onTopicsChange(topics)
          }
        }
      } catch (error) {
        console.error('[TutorSession] Failed to load topics:', error)
        setAvailableTopics([])
        if (onTopicsChange) {
          onTopicsChange([])
        }
        // Reset ref on error so we can retry
        lastLoadedClassIdRef.current = undefined
      }
    }

    loadTopics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorContext.selectedClassId]) // Removed onTopicsChange to prevent infinite loops - it's just a callback

  // Stable callback for handling attached files changes
  const handleAttachedFilesChange = useCallback((files: { id: string, name: string, document_type: string | null }[]) => {
    // If we have prop files, we can't update them locally (parent controls them)
    // But we can still update local state for cases where prop is not provided
    if (propAttachedFiles.length === 0) {
      setLocalAttachedFiles(files)
    }
  }, [propAttachedFiles.length])

  // Load attached files from metadata (only if sessionId exists)
  // Note: If propAttachedFiles is provided, we don't load from metadata (parent controls it)
  useEffect(() => {
    if (!sessionId || propAttachedFiles.length > 0) {
      // If parent provides files, don't override them
      if (propAttachedFiles.length === 0) {
        setLocalAttachedFiles([])
      }
      return
    }

    let isCancelled = false
    setIsLoadingAttachedFiles(true)
    fetch(`/api/chats/metadata?chatId=${sessionId}`, {
      credentials: 'include'
    })
      .then(async (metadataRes) => {
        if (isCancelled) return
        if (metadataRes.ok) {
          const metadata = await metadataRes.json()
          
          if (metadata.metadata?.attachedFiles && Array.isArray(metadata.metadata.attachedFiles)) {
            const attachedFilesList: { id: string, name: string, document_type: string | null }[] = 
              metadata.metadata.attachedFiles.map((f: any) => ({
                id: f.id || f.canonicalId || String(f.id || ''),
                name: f.name || f.filename || 'Unknown file',
                document_type: f.document_type !== undefined ? f.document_type : null
              }))
            
            if (!isCancelled && (attachedFilesList.length > 0 || propAttachedFiles.length === 0)) {
              setLocalAttachedFiles(attachedFilesList)
            }
          } else if (metadata.metadata?.attachedFileIds && Array.isArray(metadata.metadata.attachedFileIds)) {
            const allFilesRes = await fetch('/api/binder', { credentials: 'include' })
            if (isCancelled) return
            if (allFilesRes.ok) {
              const allFilesData = await allFilesRes.json()
              const allFiles = allFilesData.files || []
              
              const attachedFilesList: { id: string, name: string, document_type: string | null }[] = 
                metadata.metadata.attachedFileIds
                  .map((id: string) => {
                    const file = allFiles.find((f: any) => f.canonicalId === id || f.id === id)
                    if (file) {
                      return {
                        id: file.canonicalId || file.id,
                        name: file.filename || file.name || 'Unknown file',
                        document_type: file.document_type !== undefined ? file.document_type : null
                      }
                    }
                    return null
                  })
                  .filter((f: any) => f !== null)
              
              if (!isCancelled && (attachedFilesList.length > 0 || propAttachedFiles.length === 0)) {
                setLocalAttachedFiles(attachedFilesList)
              }
            }
          }
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          console.error('[TutorSession] Failed to load attached files:', error)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingAttachedFiles(false)
        }
      })
    
    return () => {
      isCancelled = true
    }
  }, [sessionId, propAttachedFiles.length]) // Fixed: use propAttachedFiles.length instead of attachedFiles

  // Helper to generate a title for a session based on context
  const generateSessionTitle = async (currentSessionId: string): Promise<string> => {
    try {
      // Prefer topic name if available
      if (tutorContext.selectedTopic?.title) {
        const classInfo = tutorContext.selectedClass
          ? ` — ${tutorContext.selectedClass.code}`
          : ''
        return `${tutorContext.selectedTopic.title}${classInfo}`
      }

      // Fetch messages to get first user message
      const historyResponse = await fetch(`/api/history?id=${currentSessionId}`, {
        credentials: 'include'
      })
      
      if (historyResponse.ok) {
        const messages = await historyResponse.json()
        if (Array.isArray(messages) && messages.length > 0) {
          // Find first user message
          const firstUserMessage = messages.find((msg: any) => msg.role === 'user')
          if (firstUserMessage?.content) {
            // Truncate to 50 chars for title
            const title = firstUserMessage.content.trim().slice(0, 50)
            return title || 'Untitled Session'
          }
        }
      }
    } catch (error) {
      console.error('[TutorSession] Error generating title:', error)
    }
    
    return 'Untitled Session'
  }

  // Handler for starting a new session
  const handleStartNewSession = async () => {
    try {
      // Step A: Archive current session if it has messages
      if (sessionId) {
        try {
          // Check if session has messages
          const historyResponse = await fetch(`/api/history?id=${sessionId}`, {
            credentials: 'include'
          })
          
          if (historyResponse.ok) {
            const messages = await historyResponse.json()
            if (Array.isArray(messages) && messages.length > 0) {
              // Generate and update title
              const newTitle = await generateSessionTitle(sessionId)
              await fetch('/api/chats/update-title', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  chatId: sessionId,
                  title: newTitle
                })
              })
            }
          }
        } catch (error) {
          console.error('[TutorSession] Error archiving session:', error)
          // Continue anyway - don't block new session creation
        }
      }

      // Step B: Create a new session
      const intent = 'new_question' // Always new_question now
      
      const payload: any = { intent }
      
      // Include context if available
      if (tutorContext.selectedClassId) {
        payload.classId = tutorContext.selectedClassId
      }
      if (tutorContext.selectedTopicId) {
        payload.topicId = tutorContext.selectedTopicId
      }
      if (tutorContext.activeExamId) {
        payload.examId = tutorContext.activeExamId
      }
      if (tutorContext.selectedTopicFileIds && tutorContext.selectedTopicFileIds.length > 0) {
        payload.fileIds = tutorContext.selectedTopicFileIds
      }
      if (mode === 'tutor' && attachedFiles.length > 0) {
        payload.attachedFileIds = attachedFiles.map(f => f.id)
      }
      
      const resolveResponse = await fetch('/api/chats/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      
      if (!resolveResponse.ok) {
        console.error('[TutorSession] Failed to create new session')
        alert('Failed to start new session. Please try again.')
        return
      }
      
      const { chatId } = await resolveResponse.json()
      if (!chatId) {
        console.error('[TutorSession] No chatId returned from resolve')
        alert('Failed to start new session. Please try again.')
        return
      }
      
      // Step C: Reset UI state
      setLocalSessionId(chatId)
      
      // Update URL to include new sessionId
      const params = new URLSearchParams(window.location.search)
      params.set('sessionId', chatId)
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
      
      // Notify parent that session was created
      if (onSessionCreated) {
        onSessionCreated(chatId)
      }
    } catch (error) {
      console.error('[TutorSession] Failed to start new session:', error)
      alert('Failed to start new session. Please try again.')
    }
  }

  const handleSend = async (message: string, imageData?: Array<{ base64: string; mimeType: string }>) => {
    if (!message.trim() && (!imageData || imageData.length === 0)) return

    // Mark onboarding as completed after user's first real message
    if (typeof window !== 'undefined' && !localStorage.getItem('forge-onboarding-completed')) {
      localStorage.setItem('forge-onboarding-completed', 'true')
    }

    let effectiveSessionId = sessionId

    // Create session if it doesn't exist
    if (!effectiveSessionId) {
      try {
        // Determine intent
        const intent = 'new_question' // Always new_question now
        
        // Build payload with context
        const payload: any = { intent }
        
        // Include context if available
        if (tutorContext.selectedClassId) {
          payload.classId = tutorContext.selectedClassId
        }
        if (tutorContext.selectedTopicId) {
          payload.topicId = tutorContext.selectedTopicId
        }
        if (tutorContext.activeExamId) {
          payload.examId = tutorContext.activeExamId
        }
        // Include topic fileIds if available (from attached materials in notebook)
        if (tutorContext.selectedTopicFileIds && tutorContext.selectedTopicFileIds.length > 0) {
          payload.fileIds = tutorContext.selectedTopicFileIds
        }
        if (mode === 'tutor' && attachedFiles.length > 0) {
          payload.attachedFileIds = attachedFiles.map(f => f.id)
        }
        
        
        const resolveResponse = await fetch('/api/chats/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        
        if (!resolveResponse.ok) {
          console.error('[TutorSession] Failed to create session')
          alert('Failed to create session. Please try again.')
          throw new Error('Failed to create session')
        }
        
        const { chatId } = await resolveResponse.json()
        if (!chatId) {
          console.error('[TutorSession] No chatId returned from resolve')
          alert('Failed to create session. Please try again.')
          throw new Error('No chatId returned')
        }
        
        effectiveSessionId = chatId
        
        // Update local state immediately so UI re-renders with the new session
        setLocalSessionId(chatId)
        
        // Update URL to include sessionId (without reload)
        const params = new URLSearchParams(window.location.search)
        params.set('sessionId', chatId)
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
        
        // Notify parent that session was created
        if (onSessionCreated) {
          onSessionCreated(chatId)
        }
      } catch (error) {
        console.error('[TutorSession] Failed to create session:', error)
        throw error // Re-throw so ChatInterface can handle it
      }
    }

    // Dispatch the event to trigger AI response
    // ClinicalTutorWorkspace will handle saving the message
    // If session was just created, wait longer for ClinicalTutorWorkspace to re-initialize
    const delay = !sessionId ? 500 : 100 // Longer delay if session was just created
    

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('tutor-send-message', {
        detail: {
          message: message.trim(),
          sessionId: effectiveSessionId,
          imageData: imageData || undefined,
        }
      }))
    }, delay)
  }

  const hasMessages = !!sessionId

  // Calculate attached context for ChatInterface
  const attachedFilesCount = attachedFiles.length
  const attachedTypes = attachedFiles
    .map(f => f.document_type)
    .filter((dt): dt is string => dt !== null && dt !== undefined) as string[]
  
  let attachedContext: 'none' | 'syllabus' | 'textbook' | 'mixed' = 'none'
  if (attachedFilesCount > 0) {
    const uniqueTypes = Array.from(new Set(attachedTypes))
    if (uniqueTypes.length === 1 && uniqueTypes[0] === 'syllabus') {
      attachedContext = 'syllabus'
    } else if (uniqueTypes.length === 1 && (uniqueTypes[0] === 'textbook' || uniqueTypes[0] === 'reference')) {
      attachedContext = 'textbook'
    } else if (uniqueTypes.length > 1) {
      attachedContext = 'mixed'
    } else if (uniqueTypes.length === 0) {
      attachedContext = 'textbook'
    }
  }

  // Scroll to specific message if scrollToMessageId is provided
  // This effect tries multiple times to find the message element as messages load asynchronously
  useEffect(() => {
    if (!scrollToMessageId || !scrollContainerRef.current) return
    
    let attempts = 0
    const maxAttempts = 20 // Try for up to 2 seconds (20 * 100ms)
    
    const tryScroll = () => {
      attempts++
      const container = scrollContainerRef.current
      if (!container) return
      
      // Find the message element by data attribute
      const messageElement = container.querySelector(`[data-message-id="${scrollToMessageId}"]`) as HTMLElement
      if (messageElement) {
        // Scroll to the message with some offset from top
        const containerRect = container.getBoundingClientRect()
        const elementRect = messageElement.getBoundingClientRect()
        const scrollTop = container.scrollTop + elementRect.top - containerRect.top - 100 // 100px offset from top
        
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        })
        
        // Temporarily highlight the message
        messageElement.style.transition = 'background-color 0.3s'
        messageElement.style.backgroundColor = 'rgba(99, 102, 241, 0.1)' // indigo-50
        setTimeout(() => {
          messageElement.style.backgroundColor = ''
        }, 2000)
      } else if (attempts < maxAttempts) {
        // Message not found yet, try again
        setTimeout(tryScroll, 100)
      }
    }
    
    // Start trying after a short delay to allow initial render
    setTimeout(tryScroll, 200)
  }, [scrollToMessageId, sessionId]) // Use sessionId as dependency to retry when session changes

  // Track previous message count and last user message to detect new user messages
  const prevMessageCountRef = useRef<number>(0)
  const prevLastUserMessageRef = useRef<string | null>(null)

  // Auto-scroll to bottom when a new user message is added
  useEffect(() => {
    if (!scrollContainerRef.current || !shouldAutoScrollRef.current || scrollToMessageId) return
    
    const currentMessageCount = messages.length
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null
    const lastMessageKey = lastMessage ? `${lastMessage.role}-${lastMessage.content?.slice(0, 50)}` : null
    
    // Check if a new user message was just added
    const isNewUserMessage = lastMessage?.role === 'user' && 
      lastMessageKey !== prevLastUserMessageRef.current &&
      currentMessageCount > prevMessageCountRef.current
    
    if (isNewUserMessage) {
      const container = scrollContainerRef.current
      
      // Use requestAnimationFrame for better timing with DOM updates
      const scrollToBottom = () => {
        if (container && shouldAutoScrollRef.current) {
          const scrollHeight = container.scrollHeight
          container.scrollTo({
            top: scrollHeight,
            behavior: 'smooth'
          })
        }
      }
      
      // Try multiple times to ensure scroll happens after DOM updates
      requestAnimationFrame(() => {
        scrollToBottom()
        setTimeout(scrollToBottom, 100)
        setTimeout(scrollToBottom, 300)
      })
    }
    
    // Update refs
    prevMessageCountRef.current = currentMessageCount
    prevLastUserMessageRef.current = lastMessageKey
  }, [messages, scrollToMessageId, sessionId])

  // Auto-scroll to bottom when session loads or messages change (only if user hasn't manually scrolled up and no scrollToMessageId)
  useEffect(() => {
    if (!scrollContainerRef.current || !shouldAutoScrollRef.current || scrollToMessageId) return
    
    const container = scrollContainerRef.current
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      if (container && shouldAutoScrollRef.current) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'auto' // Instant scroll on load, smooth for new messages
        })
      }
    }, 150)
  }, [messages.length, scrollToMessageId, sessionId]) // Added sessionId to trigger on initial load

  // Listen for scroll events to show/hide scroll-to-bottom button
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100 // 100px threshold
      
      // Update auto-scroll flag: only auto-scroll if user is near bottom
      shouldAutoScrollRef.current = isNearBottom
      
      // Show button if user has scrolled up
      setShowScrollToBottom(!isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    // Check initial state
    handleScroll()

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleScrollToBottom = () => {
    if (!scrollContainerRef.current) return
    shouldAutoScrollRef.current = true
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth'
    })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {/* Scrollable messages OR landing */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-1 min-h-0">
        {hasMessages ? (
          <>
            {onboardingTriggeredRef.current && messages.length <= 2 && (
              <div className="mx-auto max-w-2xl px-4 pt-4 pb-1">
                <p className="text-xs text-slate-400 italic text-center">
                  Forge started a scenario for you — respond to begin
                </p>
              </div>
            )}
            <ClinicalTutorWorkspace 
            key={sessionId}
            chatId={sessionId} 
            filterMode="mixed"
            mode="tutor"
            attachedFiles={attachedFiles}
            selectedMessageId={selectedMessageId}
            onSelectMessage={setSelectedMessageId}
            scrollToMessageId={scrollToMessageId}
            scrollContainerRef={scrollContainerRef}
            onMessagesChange={(msgs) => {
              const chatMessages = msgs as ChatMessage[]
              if (propOnMessagesChange) {
                // Parent manages messages
                propOnMessagesChange(chatMessages)
              } else if (propMessages.length === 0) {
                // Local state management
                setLocalMessages(chatMessages)
              }
            }}
          />
          </>
        ) : mode === 'tutor' && activeChunkCount === 0 && !sessionId && !tutorContext.selectedClassId ? (
          // Only show empty state if there's no active session, no files, AND no class selected
          // If a class is selected, the landing page will show the welcome message instead
          <TutorEmptyState 
            activeChunkCount={activeChunkCount}
            hasSeenOnboarding={hasSeenOnboarding}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-slate-600 text-sm">
                {mode === 'tutor' 
                  ? "What would you like to study today?"
                  : "What would you like to reflect on today?"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scroll to bottom button - appears when user scrolls up */}
      {showScrollToBottom && (
        <button
          onClick={handleScrollToBottom}
          className="absolute bottom-24 right-6 z-20 p-2.5 rounded-full bg-white/90 backdrop-blur-sm border border-slate-300 shadow-lg text-slate-500 hover:text-indigo-600 hover:bg-white hover:border-indigo-400 hover:shadow-xl transition-all duration-200 opacity-70 hover:opacity-100"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Chat input docked at bottom */}
      <div className="flex-shrink-0">
        <ChatInterface
          mode={mode}
          sessionId={sessionId}
          onSend={handleSend}
          initialPrompt={(() => {
            if (mode === 'tutor' && tutorContext.selectedTopic) {
              const classInfo = tutorContext.selectedClass
                ? ` from ${tutorContext.selectedClass.code} — ${tutorContext.selectedClass.name}`
                : ''
              return `I want to study ${tutorContext.selectedTopic.title}${classInfo}. Please explain it step by step at my level and then quiz me with NCLEX-style questions.`
            }
            return undefined
          })()}
          attachedFiles={attachedFiles}
          attachedContext={attachedContext}
          onDetach={onDetachFile}
          onAttachFiles={handleAttachedFilesChange}
        />
        {/* Disclaimer below chat box */}
        <p className="text-[9px] text-slate-400 text-center mt-2 pb-2">
          Educational use only. Not a medical device.
        </p>
      </div>
    </div>
  )
}

