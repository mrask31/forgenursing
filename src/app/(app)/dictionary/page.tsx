'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, BookOpen, Bookmark, BookmarkCheck } from 'lucide-react'
import { MEDICAL_TERMS } from '@/lib/medicalTerms'
import MedicalTermPopover from '@/components/tutor/MedicalTermPopover'

export default function DictionaryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(MEDICAL_TERMS.map(t => t.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [])

  // Filter terms based on search and category
  const filteredTerms = useMemo(() => {
    let filtered = MEDICAL_TERMS

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.term.toLowerCase().includes(query) ||
        t.definition.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => a.term.localeCompare(b.term))
  }, [searchQuery, selectedCategory])

  // Load saved words on mount
  useEffect(() => {
    fetch('/api/wordbank')
      .then(res => res.json())
      .then(data => {
        if (data.words) {
          const saved = new Set(data.words.map((w: any) => w.term.toLowerCase()))
          setSavedWords(saved)
        }
      })
      .catch(() => {}) // Silently fail if not authenticated
  }, [])

  const handleSaveWord = async (term: string, definition: string, category?: string) => {
    try {
      const response = await fetch('/api/wordbank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, definition, category }),
      })

      if (response.ok || response.status === 409) {
        setSavedWords(prev => new Set([...prev, term.toLowerCase()]))
      }
    } catch (error) {
      console.error('Failed to save word:', error)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Medical Dictionary
          </h1>
          <p className="text-sm text-slate-600">
            Search and save medical terms for quick reference during your studies
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medical terms..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <p className="text-sm text-slate-600">
              {filteredTerms.length} {filteredTerms.length === 1 ? 'term' : 'terms'} found
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredTerms.length > 0 ? (
              filteredTerms.map((term) => {
                const isSaved = savedWords.has(term.term.toLowerCase())
                return (
                  <div key={term.term} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{term.term}</h3>
                          {term.category && (
                            <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                              {term.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{term.definition}</p>
                      </div>
                      <button
                        onClick={() => !isSaved && handleSaveWord(term.term, term.definition, term.category)}
                        disabled={isSaved}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                          isSaved
                            ? 'text-emerald-600 bg-emerald-50 cursor-default'
                            : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="w-4 h-4" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-4 h-4" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">No terms found</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

