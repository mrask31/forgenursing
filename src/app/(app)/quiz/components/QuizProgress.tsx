'use client'

interface QuizProgressProps {
  current: number
  total: number
}

export default function QuizProgress({ current, total }: QuizProgressProps) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold" style={{ color: '#0B2545' }}>
        Diagnostic question {current + 1} of {total}
      </p>
      <div className="w-full h-2 rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: '#0D8F9C' }}
        />
      </div>
    </div>
  )
}
