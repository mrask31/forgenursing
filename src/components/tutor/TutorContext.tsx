'use client'
import { createContext, useContext, ReactNode } from 'react'
import type { StudentClass, NotebookTopic } from '@/lib/types'

interface TutorContextState {
  selectedClassId?: string
  selectedTopicId?: string
  activeExamId?: string
  selectedClass?: StudentClass | null
  selectedTopic?: NotebookTopic | null
  selectedTopicTitle?: string
  selectedTopicFileIds?: string[]
  mode: 'tutor'
  classes: StudentClass[]
  loading: boolean
  setSelectedClassId: (id: string | undefined) => void
  setSelectedTopicId: (id: string | undefined) => void
  setActiveExamId: (id: string | undefined) => void
  clearTopic: () => void
}

const generalTutor: TutorContextState = {
  mode: 'tutor', classes: [], loading: false,
  selectedClass: null, selectedTopic: null,
  setSelectedClassId: () => {}, setSelectedTopicId: () => {},
  setActiveExamId: () => {}, clearTopic: () => {},
}
const TutorContext = createContext<TutorContextState>(generalTutor)
export function TutorProvider({ children }: { children: ReactNode }) {
  return <TutorContext.Provider value={generalTutor}>{children}</TutorContext.Provider>
}
export function useTutorContext() { return useContext(TutorContext) }
