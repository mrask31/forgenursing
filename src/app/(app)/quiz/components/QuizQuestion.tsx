'use client'

interface QuizQuestionProps {
  stem: string
  options: { label: string; text: string }[]
  selectedAnswer: string | null
  onSelect: (label: string) => void
  onSubmit: () => void
  submitting: boolean
}

export default function QuizQuestion({
  stem, options, selectedAnswer, onSelect, onSubmit, submitting,
}: QuizQuestionProps) {
  return (
    <div className="space-y-4 pb-56 sm:pb-8">
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>{stem}</p>
      </div>

      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selectedAnswer === opt.label
          return (
            <button
              key={opt.label}
              onClick={() => onSelect(opt.label)}
              className="w-full rounded-lg border-2 p-3 text-left text-sm transition-all"
              style={{
                borderColor: isSelected ? '#0D8F9C' : '#E5E7EB',
                backgroundColor: isSelected ? '#E0F4F6' : 'white',
                minHeight: '56px',
                color: '#0B2545',
              }}
            >
              <span className="font-semibold">{opt.label})</span> {opt.text}
            </button>
          )
        })}
      </div>

      <p className="text-center text-[10px] leading-snug text-gray-400">
        AI-generated NCLEX-style practice • Educational use only
      </p>

      <div className="h-28 sm:hidden" aria-hidden="true" />

      <div className="sticky bottom-0 z-20 bg-white px-1 pt-3 pb-6 sm:static sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0">
        <button
          onClick={onSubmit}
          disabled={!selectedAnswer || submitting}
          className="w-full rounded-lg text-white font-semibold text-base transition-all disabled:opacity-40 shadow-sm"
          style={{ backgroundColor: selectedAnswer ? '#0D8F9C' : '#9CA3AF', minHeight: '56px' }}
        >
          {submitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      </div>
    </div>
  )
}
