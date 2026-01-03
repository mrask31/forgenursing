import { redirect } from 'next/navigation'

// Redirect /library to /readiness (Dashboard) since Library is now integrated into Dashboard
export default function LibraryPage() {
  redirect('/readiness')
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
}

export default function LibraryPage() {
  const router = useRouter()
  const { density } = useDensity()
  const tokens = getDensityTokens(density)
  const [clips, setClips] = useState<Clip[]>([])
  const [filteredClips, setFilteredClips] = useState<Clip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    loadClips()
  }, [])

  useEffect(() => {
    filterClips()
  }, [clips, searchQuery, selectedFolder, selectedTag])

  const loadClips = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/clips', {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to load clips')
      const { clips: loadedClips } = await response.json()
      setClips(loadedClips || [])
    } catch (error) {
      console.error('Failed to load clips:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterClips = () => {
    let filtered = [...clips]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        clip => clip.title.toLowerCase().includes(query) || clip.content.toLowerCase().includes(query)
      )
    }

    if (selectedFolder) {
      filtered = filtered.filter(clip => clip.folder === selectedFolder)
    }

    if (selectedTag) {
      filtered = filtered.filter(clip => clip.tags.includes(selectedTag))
    }

    setFilteredClips(filtered)
  }

  const folders = Array.from(new Set(clips.map(c => c.folder))).sort()
  const tags = Array.from(new Set(clips.flatMap(c => c.tags))).sort()

  const handleReview = (clip: Clip) => {
    // Navigate to the original chat if available, otherwise create new session with prefilled content
    if (clip.chat_id) {
      // Navigate to the specific chat where this clip was saved from
      const params = new URLSearchParams()
      params.set('mode', 'tutor')
      params.set('sessionId', clip.chat_id)
      if (clip.class_id) {
        params.set('classId', clip.class_id)
      }
      router.push(`/tutor?${params.toString()}`)
    } else {
      // No chat_id - navigate to tutor with prefilled content
      if (typeof window !== 'undefined') {
        localStorage.setItem('forgenursing-tutor-prefill', `Review this learning moment: ${clip.title}\n\n${clip.content}`)
      }
      const params = new URLSearchParams()
      params.set('mode', 'tutor')
      if (clip.class_id) {
        params.set('classId', clip.class_id)
      }
      router.push(`/tutor?${params.toString()}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className={`${tokens.containerMaxWidth || 'max-w-7xl'} mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8`}>
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className={`${tokens.heading} font-semibold text-clinical-text-primary tracking-tight mb-2`}>
            My Learning Library
          </h1>
          <p className={`${tokens.bodyText} text-clinical-text-secondary mb-1`}>
            Saved learning moments from your tutoring sessions
          </p>
          <p className={`${tokens.smallText} text-clinical-text-secondary`}>
            Your personal nursing study vault — organized for quick review.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clips..."
              className={`w-full ${tokens.bodyText} pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-primary focus:border-transparent`}
            />
          </div>

          {/* Folder and Tag Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedFolder(null)
                setSelectedTag(null)
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !selectedFolder && !selectedTag
                  ? 'bg-clinical-primary text-white'
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  selectedFolder === folder
                    ? 'bg-clinical-primary text-white'
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  selectedTag === tag
                    ? 'bg-clinical-primary text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Clips Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-clinical-primary w-8 h-8 mb-4" />
            <p className={`${tokens.bodyText} text-clinical-text-secondary`}>Loading clips...</p>
          </div>
        ) : filteredClips.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className={`${tokens.bodyText} text-clinical-text-secondary mb-2`}>
              {clips.length === 0 ? 'No clips saved yet' : 'No clips match your filters'}
            </p>
            {clips.length === 0 && (
              <p className={`${tokens.smallText} text-clinical-text-secondary`}>
                Save learning moments from your tutoring sessions to build your library
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredClips.map(clip => (
              <div
                key={clip.id}
                className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`${tokens.subheading} font-semibold text-clinical-text-primary mb-1 truncate`}>
                      {clip.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-clinical-text-secondary">
                      <span className="flex items-center gap-1">
                        <Folder className="w-3 h-3" />
                        {clip.folder}
                      </span>
                      <span>•</span>
                      <span>{new Date(clip.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className={`${tokens.bodyText} text-clinical-text-secondary mb-4 line-clamp-3 prose prose-slate max-w-none`}>
                  <ReactMarkdown>{clip.content.substring(0, 200) + (clip.content.length > 200 ? '...' : '')}</ReactMarkdown>
                </div>

                {clip.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {clip.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => handleReview(clip)}
                  className="mt-auto bg-clinical-primary text-white hover:bg-clinical-secondary w-full"
                >
                  {clip.chat_id ? 'Continue Chat' : 'Review'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

