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
      
      // Check if this fragment matches any medical term (case-insensitive)
      const lowerText = text.toLowerCase().trim()
      const termInfo = medicalTermMap.get(lowerText)
      
      if (termInfo) {
        // This fragment is a medical term - wrap it with popover
        return (
          <MedicalTermPopover
            term={termInfo.term}
            definition={termInfo.definition}
            category={termInfo.category}
          >
            {text}
          </MedicalTermPopover>
        )
      }
      
      // Check if this fragment contains a medical term (for multi-word terms)
      // This handles cases where ReactMarkdown might split a term
      for (const [lowerTerm, termInfo] of Array.from(medicalTermMap.entries())) {
        if (lowerText.includes(lowerTerm)) {
          // Found a term within this fragment - process it
          const parts: ReactNode[] = []
          let lastIndex = 0
          const regex = new RegExp(lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
          let match
          
          while ((match = regex.exec(lowerText)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
              parts.push(text.slice(lastIndex, match.index))
            }
            
            // Add the medical term with popover
            const originalTerm = text.slice(match.index, match.index + match[0].length)
            parts.push(
              <MedicalTermPopover
                key={`term-${match.index}`}
                term={termInfo.term}
                definition={termInfo.definition}
                category={termInfo.category}
              >
                {originalTerm}
              </MedicalTermPopover>
            )
            
            lastIndex = match.index + match[0].length
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex))
          }
          
          return <>{parts}</>
        }
      }
      
      // No medical term found in this fragment
      return <>{text}</>
    }
  }

  return (
    <ReactMarkdown components={enhancedComponents}>
      {content}
    </ReactMarkdown>
  )
}

