'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, CheckCircle2, Eye, Loader2, PlayCircle, X } from 'lucide-react'

interface QuizRationaleProps {
  isCorrect: boolean
  userAnswer: string
  correctAnswer: string
  options: { label: string; text: string }[]
  rationaleCorrect: string
  rationaleIncorrect: Record<string, string>
  nclexCategory: string
  difficulty: number
  mistakeType?: string | null
  reasoningTrap?: string | null
  fixInstruction?: string | null
  retestFocus?: string | null
  keyCue?: string | null
  whyCorrectShort?: string | null
  whyWrongShort?: string | null
  oneLineFix?: string | null
  sessionId: string
  questionId: string
  questionIndex: number
  onNext: () => void
  onRetestWeakness?: () => void
  isRetestingWeakness?: boolean
  isLast: boolean
}

type VisualLesson = {
  id: string
  title: string
  concept: string
  mistake_type: string | null
  nclex_category: string | null
  lesson_steps: Array<{ title: string; body: string }>
  check_question: {
    stem: string
    options: string[]
    correct: string
    explanation?: string
  } | null
  video_url: string | null
  thumbnail_url: string | null
}

const clearTutorAutoSendState = () => {
  if (typeof window === 'undefined') return

  localStorage.removeItem('forgenursing-tutor-prefill')
  localStorage.removeItem('forgenursing-tutor-auto-send')
  localStorage.removeItem('forgenursing-tutor-has-images')
}

function fallbackMistakeType(category: string) {
  if (category === 'Psychosocial Integrity') return 'Therapeutic communication'
  if (category === 'Pharmacological Therapies') return 'Medication reasoning'
  if (category === 'Safety and Infection Control') return 'Safety'
  if (category === 'Delegation') return 'Delegation'
  if (category === 'Reduction of Risk Potential') return 'Lab / diagnostic interpretation'
  if (category === 'Management of Care' || category === 'Priority Setting') return 'Priority-setting'
  if (category === 'Health Promotion and Maintenance') return 'Patient education'
  if (category === 'Physiological Adaptation') return 'Assessment-first'
  return 'Clinical judgment'
}

export default function QuizRationale({
  isCorrect, userAnswer, correctAnswer, options, rationaleCorrect,
  rationaleIncorrect, nclexCategory, difficulty, mistakeType, reasoningTrap,
  fixInstruction, retestFocus, keyCue, whyCorrectShort, whyWrongShort, oneLineFix,
  sessionId, questionId, questionIndex, onNext,
  onRetestWeakness, isRetestingWeakness = false, isLast,
}: QuizRationaleProps) {
  const router = useRouter()
  const [isDiggingDeeper, setIsDiggingDeeper] = useState(false)
  const [showFullRationale, setShowFullRationale] = useState(false)
  const [digDeeperError, setDigDeeperError] = useState<string | null>(null)
  const [isVisualLessonOpen, setIsVisualLessonOpen] = useState(false)
  const [isLoadingVisualLesson, setIsLoadingVisualLesson] = useState(false)
  const [visualLesson, setVisualLesson] = useState<VisualLesson | null>(null)
  const [visualLessonError, setVisualLessonError] = useState<string | null>(null)
  const [selectedCheckAnswer, setSelectedCheckAnswer] = useState<string | null>(null)
  const correctOptionText = options.find(o => o.label === correctAnswer)?.text ?? ''
  const userOptionText = options.find(o => o.label === userAnswer)?.text ?? ''
  const displayedMistakeType = mistakeType || fallbackMistakeType(nclexCategory)
  const showMistakeMap = !isCorrect && displayedMistakeType

  const handleToggleFullRationale = () => {
    setShowFullRationale(prev => !prev)
    try {
      const posthog = require('posthog-js').default
      posthog.capture('show_full_rationale_clicked', {
        session_id: sessionId,
        question_id: questionId,
        question_index: questionIndex,
        is_opening: !showFullRationale,
        nclex_category: nclexCategory,
        mistake_type: displayedMistakeType,
      })
    } catch {}
  }

  const handleShowVisualLesson = async () => {
    if (isLoadingVisualLesson) return
    setIsVisualLessonOpen(true)
    setVisualLessonError(null)
    setSelectedCheckAnswer(null)

    try {
      const posthog = require('posthog-js').default
      posthog.capture('visual_lesson_button_clicked', {
        session_id: sessionId,
        question_id: questionId,
        question_index: questionIndex,
        nclex_category: nclexCategory,
        mistake_type: displayedMistakeType,
      })
    } catch {}

    if (visualLesson) return

    setIsLoadingVisualLesson(true)
    try {
      const response = await fetch(`/api/visual-lessons/match?questionId=${encodeURIComponent(questionId)}`, {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Visual lesson could not load')
      }

      const data = await response.json()
      if (!data.matched || !data.lesson) {
        setVisualLessonError('Forge does not have a visual lesson for this exact concept yet.')
        return
      }

      setVisualLesson(data.lesson)
      try {
        const posthog = require('posthog-js').default
        posthog.capture('visual_lesson_opened', {
          session_id: sessionId,
          question_id: questionId,
          question_index: questionIndex,
          lesson_id: data.lesson.id,
          lesson_concept: data.lesson.concept,
          nclex_category: nclexCategory,
          mistake_type: displayedMistakeType,
        })
      } catch {}
    } catch (error: any) {
      console.error('[QuizRationale] Visual lesson error:', error)
      setVisualLessonError(error?.message || 'Visual lesson could not load')
    } finally {
      setIsLoadingVisualLesson(false)
    }
  }

  const handleCheckAnswer = (answer: string) => {
    setSelectedCheckAnswer(answer)
    try {
      const posthog = require('posthog-js').default
      posthog.capture('visual_lesson_check_answered', {
        session_id: sessionId,
        question_id: questionId,
        question_index: questionIndex,
        lesson_id: visualLesson?.id ?? null,
        answer,
        is_correct: answer === visualLesson?.check_question?.correct,
      })
    } catch {}
  }

  const handleFixWeakness = async () => {
    if (isDiggingDeeper) return

    setIsDiggingDeeper(true)
    setDigDeeperError(null)
    clearTutorAutoSendState()

    try {
      try {
        const posthog = require('posthog-js').default
        posthog.capture('fix_weakness_clicked', {
          session_id: sessionId,
          question_id: questionId,
          question_index: questionIndex,
          nclex_category: nclexCategory,
          source: isVisualLessonOpen ? 'visual_lesson_modal' : 'rationale_screen',
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          mistake_type: displayedMistakeType,
          retest_focus: retestFocus ?? null,
        })
        posthog.capture('dig_deeper_clicked', {
          session_id: sessionId,
          question_id: questionId,
          question_index: questionIndex,
          nclex_category: nclexCategory,
          source: isVisualLessonOpen ? 'visual_lesson_modal' : 'rationale_screen',
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          mistake_type: displayedMistakeType,
          retest_focus: retestFocus ?? null,
        })
      } catch {}

      const response = await fetch('/api/quiz/dig-deeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quizSessionId: sessionId,
          questionId,
        }),
      })

      if (!response.ok) {
        console.error('[QuizRationale] Fix weakness handoff failed:', await response.text())
        setDigDeeperError('Could not open tutor. Please try again.')
        return
      }

      const data = await response.json()
      if (!data.chatId) {
        setDigDeeperError('Could not open tutor. Please try again.')
        return
      }

      clearTutorAutoSendState()
      router.push(`/tutor?sessionId=${data.chatId}`)
    } catch (error) {
      console.error('[QuizRationale] Fix weakness error:', error)
      setDigDeeperError('Could not open tutor. Please try again.')
    } finally {
      setIsDiggingDeeper(false)
    }
  }

  return (
    <div className="space-y-4 pb-48 sm:pb-8">
      <div
        className="rounded-xl p-4 text-white"
        style={{ backgroundColor: isCorrect ? '#22C55E' : '#EF4444' }}
      >
        <p className="font-bold text-base">
          {isCorrect ? '✓ Correct!' : '✗ Missed this one'}
        </p>
        {!isCorrect && (
          <div className="mt-2 space-y-1 text-sm">
            <p>You chose: <span className="font-semibold">{userAnswer}{userOptionText ? ` — ${userOptionText}` : ''}</span></p>
            <p>Better answer: <span className="font-semibold">{correctAnswer}{correctOptionText ? ` — ${correctOptionText}` : ''}</span></p>
          </div>
        )}
        {isCorrect && (
          <p className="mt-1 text-sm">{correctAnswer}) {correctOptionText}</p>
        )}
      </div>

      <div className="rounded-xl border border-[#DDE5EE] bg-white p-4 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0D8F9C' }}>
          Quick why
        </p>
        {keyCue && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Key cue</p>
            <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>{keyCue}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
            {isCorrect ? 'Why you got it' : 'Why the better answer works'}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>
            {whyCorrectShort || rationaleCorrect}
          </p>
        </div>
        {!isCorrect && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Why your answer was tempting</p>
            <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>
              {whyWrongShort || rationaleIncorrect[userAnswer] || reasoningTrap || 'The answer was plausible, but it missed the most important cue.'}
            </p>
          </div>
        )}
        {oneLineFix && (
          <div className="rounded-lg bg-[#F7F9FB] border border-[#DDE5EE] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Remember this</p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: '#0B2545' }}>{oneLineFix}</p>
          </div>
        )}
      </div>

      {!isCorrect && (
        <button
          type="button"
          onClick={handleShowVisualLesson}
          disabled={isLoadingVisualLesson}
          className="w-full rounded-lg border-2 text-sm font-bold py-3 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
          style={{ borderColor: '#0D8F9C', color: '#0D8F9C', minHeight: '48px' }}
        >
          {isLoadingVisualLesson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          Show Me Visually
        </button>
      )}

      {showMistakeMap && (
        <div className="rounded-xl p-4 text-white" style={{ backgroundColor: '#0B2545' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">
            Pattern Forge noticed
          </p>
          <p className="text-lg font-bold mb-2">Mistake Type: {displayedMistakeType}</p>
          {reasoningTrap && (
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">The trap</p>
              <p className="text-sm leading-relaxed text-white/90">{reasoningTrap}</p>
            </div>
          )}
          {fixInstruction && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">How to fix it</p>
              <p className="text-sm leading-relaxed text-white/90">{fixInstruction}</p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleToggleFullRationale}
        className="w-full rounded-lg border text-sm font-semibold py-3"
        style={{ borderColor: '#DDE5EE', color: '#0B2545', minHeight: '44px' }}
      >
        {showFullRationale ? 'Hide full rationale' : 'Show full rationale'}
      </button>

      {showFullRationale && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#0B2545' }}>
              Why {correctAnswer} is better
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{rationaleCorrect}</p>
          </div>

          {!isCorrect && rationaleIncorrect[userAnswer] && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#EF4444' }}>
                Why {userAnswer} pulled you in
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{rationaleIncorrect[userAnswer]}</p>
            </div>
          )}
        </div>
      )}

      {showMistakeMap && retestFocus && (
        <div className="rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-4">
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#0D8F9C' }}>
            Next move
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Practice this pattern next: <span className="font-semibold" style={{ color: '#0B2545' }}>{retestFocus}</span>
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="px-2 py-1 rounded bg-gray-100">{nclexCategory}</span>
        <span>{'●'.repeat(difficulty)}{'○'.repeat(5 - difficulty)}</span>
      </div>

      <p className="text-center text-[10px] leading-snug text-gray-400">
        AI-generated rationale • Educational use only
      </p>

      {digDeeperError && (
        <p className="text-xs text-red-600">{digDeeperError}</p>
      )}

      <div className="sticky bottom-0 z-20 bg-white px-1 pt-3 pb-6 sm:static sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-2">
        <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3 sm:border-0 sm:p-0">
          <button
            onClick={onNext}
            className="w-full rounded-lg text-white font-semibold text-base transition-all shadow-sm"
            style={{ backgroundColor: '#0D8F9C', minHeight: '52px' }}
          >
            {isLast ? 'See Results' : 'Next Question →'}
          </button>

          {!isCorrect && onRetestWeakness && (
            <button
              type="button"
              onClick={onRetestWeakness}
              disabled={isRetestingWeakness}
              className="block w-full rounded-lg text-white text-center font-semibold text-sm py-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0D8F9C', minHeight: '44px' }}
            >
              {isRetestingWeakness ? 'Building Retest…' : 'Retest this pattern →'}
            </button>
          )}

          {!isCorrect && (
            <button
              type="button"
              onClick={handleFixWeakness}
              disabled={isDiggingDeeper}
              className="block w-full rounded-lg border text-center font-semibold text-sm py-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ borderColor: '#0B2545', color: '#0B2545', minHeight: '44px' }}
            >
              {isDiggingDeeper ? 'Opening Tutor…' : 'Fix with Tutor →'}
            </button>
          )}
        </div>
      </div>

      {isVisualLessonOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 px-4 py-6 overflow-y-auto">
          <div className="min-h-full flex items-end sm:items-center justify-center">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="bg-[#0B2545] text-white p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0BBCD4] mb-2">
                    <Brain className="w-3.5 h-3.5" />
                    Show Me Visually
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {visualLesson?.title || 'Visual lesson'}
                  </h2>
                  <p className="text-xs text-white/65 mt-1">
                    Here is what was happening behind that question.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVisualLessonOpen(false)}
                  className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                  aria-label="Close visual lesson"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                {isLoadingVisualLesson && (
                  <div className="py-10 text-center">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-[#0D8F9C]" />
                    <p className="text-sm text-gray-500">Finding the best visual lesson...</p>
                  </div>
                )}

                {!isLoadingVisualLesson && visualLessonError && (
                  <div className="rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-4 text-sm text-gray-700">
                    {visualLessonError}
                  </div>
                )}

                {!isLoadingVisualLesson && visualLesson && (
                  <>
                    {visualLesson.video_url ? (
                      <div className="rounded-xl overflow-hidden border border-[#DDE5EE] bg-black">
                        <video src={visualLesson.video_url} controls className="w-full" poster={visualLesson.thumbnail_url || undefined} />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#E0F4F6] flex items-center justify-center flex-shrink-0">
                          <PlayCircle className="w-6 h-6 text-[#0D8F9C]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0B2545]">Visual step lesson</p>
                          <p className="text-xs text-gray-500">Video support is coming next. For now, Forge shows the process step by step.</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {visualLesson.lesson_steps.map((step, index) => (
                        <div key={`${step.title}-${index}`} className="rounded-xl border border-[#DDE5EE] bg-white p-4">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0D8F9C] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#0B2545]">{step.title}</p>
                              <p className="text-sm text-gray-700 leading-relaxed mt-1">{step.body}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {visualLesson.check_question && (
                      <div className="rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#0D8F9C]">Check yourself</p>
                        <p className="text-sm font-bold text-[#0B2545]">{visualLesson.check_question.stem}</p>
                        <div className="space-y-2">
                          {visualLesson.check_question.options.map((option) => {
                            const selected = selectedCheckAnswer === option
                            const correct = option === visualLesson.check_question?.correct
                            const showResult = selectedCheckAnswer !== null
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => handleCheckAnswer(option)}
                                className="w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all"
                                style={{
                                  borderColor: showResult && correct ? '#22C55E' : selected ? '#0D8F9C' : '#DDE5EE',
                                  backgroundColor: showResult && correct ? '#DCFCE7' : selected ? '#E0F4F6' : '#FFFFFF',
                                  color: '#0B2545',
                                }}
                              >
                                {option}
                              </button>
                            )
                          })}
                        </div>
                        {selectedCheckAnswer && (
                          <div className="rounded-lg bg-white border border-[#DDE5EE] p-3 text-sm text-gray-700">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#0D8F9C] flex-shrink-0" />
                              <p>{visualLesson.check_question.explanation || `Correct answer: ${visualLesson.check_question.correct}`}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 pt-1">
                      {onRetestWeakness && (
                        <button
                          type="button"
                          onClick={onRetestWeakness}
                          disabled={isRetestingWeakness}
                          className="w-full rounded-lg text-white font-bold py-3 disabled:opacity-60"
                          style={{ backgroundColor: '#0D8F9C', minHeight: '48px' }}
                        >
                          {isRetestingWeakness ? 'Building Retest…' : 'Got it — Retest this pattern'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleFixWeakness}
                        disabled={isDiggingDeeper}
                        className="w-full rounded-lg border font-bold py-3 disabled:opacity-60"
                        style={{ borderColor: '#0B2545', color: '#0B2545', minHeight: '48px' }}
                      >
                        {isDiggingDeeper ? 'Opening Tutor…' : 'Ask Tutor about this'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
