import Link from 'next/link'
import { ArrowRight, AlertCircle } from 'lucide-react'

const painPoints = [
  "I narrow it down to two answers and pick the wrong one",
  "I memorize content but miss prioritization",
  "I don't understand why answers are unsafe",
  "I freeze on \"what to do first\" questions",
  "I study for hours but can't explain my reasoning out loud",
]

export default function BeliefValidation() {
  return (
    <section className="bg-[#F7F9FB] py-14 sm:py-18 md:py-20" aria-labelledby="validation-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 id="validation-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3 sm:mb-4">
            <span className="hidden sm:inline">If this sounds like you, Forge can help</span>
            <span className="sm:hidden">Sound familiar?</span>
          </h2>
          <p className="text-base sm:text-lg text-[#1E2D3D]/70 hidden sm:block">
            You know the content. You study hard. But when it comes to clinical reasoning, something doesn't click.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 sm:mb-10">
          {painPoints.map((point, i) => (
            <div
              key={i}
              className="flex items-start gap-3 sm:gap-4 p-5 bg-white rounded-xl border-l-4 border-l-red-500 border border-[#DDE5EE] shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-sm sm:text-base text-[#1E2D3D] font-medium leading-relaxed flex-1">
                {point}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-[#0B2545] rounded-2xl p-6 sm:p-8 md:p-10 text-center text-white">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 hidden sm:block">
            Not generic answers. Your actual course content.
          </h3>
          <h3 className="text-xl font-bold mb-3 sm:hidden">
            Your course content
          </h3>
          <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 text-white/80 leading-relaxed hidden sm:block">
            Forge uses your uploaded textbooks and notes to explain clinical reasoning using ADPIE — the same framework your professors test. Every response is grounded in your curriculum, not generic content.
          </p>
          <p className="text-sm mb-6 text-white/80 sm:hidden">
            Uses your textbooks. ADPIE framework. Your curriculum.
          </p>
          <Link
            href="/signup?plan=monthly"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-[#0D8F9C] text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm min-h-[44px]"
          >
            Join Free Beta
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
