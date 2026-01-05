'use client'

import { ReactNode, useMemo } from 'react'
import { findMedicalTerms, MEDICAL_TERMS } from '@/lib/medicalTerms'
import MedicalTermPopover from './MedicalTermPopover'
import ReactMarkdown from 'react-markdown'

interface MessageWithMedicalTermsProps {
  content: string
  markdownComponents?: Record<string, React.ComponentType<any>>
}

/**
 * Component that processes the entire message content to find medical terms
 * and renders it with ReactMarkdown, ensuring medical terms are detected
 * even when ReactMarkdown splits text into fragments.
 * 
 * Strategy: Process the full content, find all terms, then render with a custom
 * text component that checks each fragment against our known terms.
 */
export default function MessageWithMedicalTerms({ 
  content, 
  markdownComponents 
}: MessageWithMedicalTermsProps): ReactNode {
  // Find all medical terms in the full content with their original casing
  const medicalTermMap = useMemo(() => {
    const matches = findMedicalTerms(content)
    const map = new Map<string, { term: string; definition: string; category?: string }>()
    
    for (const match of matches) {
      // Store both the lowercase version (for matching) and the original casing
      const originalTerm = content.slice(match.startIndex, match.endIndex)
      // Find the category from MEDICAL_TERMS
      const termData = MEDICAL_TERMS.find(t => t.term.toLowerCase() === match.term.toLowerCase())
      map.set(originalTerm.toLowerCase(), {
        term: match.term,
        definition: match.definition,
        category: termData?.category
      })
    }
    
    return map
  }, [content])

  // If no medical terms found, just render normally
  if (medicalTermMap.size === 0) {
    return (
      <ReactMarkdown components={markdownComponents}>
        {content}
      </ReactMarkdown>
    )
  }

  // Custom text component that checks fragments against our term map
  const enhancedComponents = {
    ...markdownComponents,
    text: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => {
      if (!children) return null
      const text = String(children)
      const lowerText = text.toLowerCase()
      
      // If fragment is empty or just whitespace, return as-is
      if (!text.trim() || text.trim().length === 0) {
        return <>{text}</>
      }
      
      // Check if this fragment contains any medical terms
      // We need to check all terms and find matches, handling word boundaries
      const parts: ReactNode[] = []
      let lastIndex = 0
      const matches: Array<{ start: number; end: number; termInfo: { term: string; definition: string; category?: string } }> = []
      
      // Find all term matches in this fragment
      for (const [lowerTerm, termInfo] of Array.from(medicalTermMap.entries())) {
        // Create regex that matches the term with word boundaries
        // Escape special regex characters
        const escapedTerm = lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // Match word boundaries: start of string, whitespace, or punctuation before, and same after
        const regex = new RegExp(`(^|[\\s.,;:!?()[\\]{}()-])(${escapedTerm})([\\s.,;:!?()[\\]{}()-]|$)`, 'gi')
        let match
        
        while ((match = regex.exec(lowerText)) !== null) {
          // match[2] is the actual term (group 2)
          const termStart = match.index + match[1].length // Skip the boundary char before
          const termEnd = termStart + match[2].length
          
          // Check if this match overlaps with a previous match
          const overlaps = matches.some(m => 
            (termStart >= m.start && termStart < m.end) ||
            (termEnd > m.start && termEnd <= m.end) ||
            (termStart <= m.start && termEnd >= m.end)
          )
          
          if (!overlaps) {
            matches.push({
              start: termStart,
              end: termEnd,
              termInfo
            })
          }
        }
      }
      
      // Sort matches by start position
      matches.sort((a, b) => a.start - b.start)
      
      // Build the parts array with text and term popovers
      for (const match of matches) {
        // Add text before the match
        if (match.start > lastIndex) {
          parts.push(text.slice(lastIndex, match.start))
        }
        
        // Add the medical term with popover (preserve original casing)
        const originalTerm = text.slice(match.start, match.end)
        parts.push(
          <MedicalTermPopover
            key={`term-${match.start}-${match.end}`}
            term={match.termInfo.term}
            definition={match.termInfo.definition}
            category={match.termInfo.category}
          >
            {originalTerm}
          </MedicalTermPopover>
        )
        
        lastIndex = match.end
      }
      
      // Add remaining text after the last match
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex))
      }
      
      // If no matches found, return original text
      if (parts.length === 0) {
        return <>{text}</>
      }
      
      return <>{parts}</>
    }
  }

  return (
    <ReactMarkdown components={enhancedComponents}>
      {content}
    </ReactMarkdown>
  )
}

