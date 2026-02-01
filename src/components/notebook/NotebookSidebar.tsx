'use client'

import { useState, useEffect } from 'react'
import { NotebookTopic } from '@/lib/types'
import { listNotebookTopics } from '@/lib/api/notebook'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'

interface NotebookSidebarProps {
  userId: string
  classId: string
  onTopicSelect: (topic: NotebookTopic) => void
  selectedTopicId?: string
}

export default function NotebookSidebar({
  userId,
  classId,
  onTopicSelect,
  selectedTopicId,
}: NotebookSidebarProps) {
  const [topics, setTopics] = useState<NotebookTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopics()
  }, [userId, classId])

  const loadTopics = async () => {
    setLoading(true)
    const topicList = await listNotebookTopics(userId, classId)
    setTopics(topicList)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-[var(--tutor-text-muted)]">
        Loading topics...
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-[var(--tutor-border-subtle)]">
      <div className="p-4 border-b border-[var(--tutor-border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-[var(--tutor-text-main)]">
            Topics
          </h2>
        </div>
        <p className="text-xs text-[var(--tutor-text-muted)]">
          Topics are automatically organized from your study sessions
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {topics.length === 0 ? (
          <div className="text-center py-8 text-[var(--tutor-text-muted)]">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No topics yet.</p>
            <p className="text-xs mt-1">
              Topics will appear here as you study with the tutor
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onTopicSelect(topic)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedTopicId === topic.id
                    ? 'bg-[var(--tutor-primary)]/10 border border-[var(--tutor-primary)]/20'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="font-medium text-sm text-[var(--tutor-text-main)] mb-1">
                  {topic.title}
                </div>
                {topic.nclexCategory && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {topic.nclexCategory}
                  </Badge>
                )}
                {topic.confidence !== undefined && (
                  <div className="text-xs text-[var(--tutor-text-muted)] mt-1">
                    Confidence: {topic.confidence}%
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

