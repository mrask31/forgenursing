import Link from 'next/link'
import { ArrowRight, AlertCircle } from 'lucide-react'

const painPoints = [
  "I narrow it down to two answers and still pick the wrong one",
  "I know the content, but I miss what the nurse should do first",
  "The rationale tells me the answer, but not my thinking mistake",
  "I confuse priority, safety, assessment, and therapeutic communication",
  "I keep missing the same type of nursing question and do not know why",
]

export default function BeliefValidation() {
  return (
    <section className="bg-[#F7F9FB] py-14 sm:py-18 md:py-20" aria-labelledby="validation-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 id="validation-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3 sm:mb-4">
            <span className="hidden sm:inline">The hard part is not always the content.</span>
            <span className="sm:hidden">Sound familiar?</span>
          </h2>
          <p className="text-base sm:text-lg text-[#1E2D3D]/70 hidden sm:block max-w-2xl mx-auto">
            Nursing students often know the facts. The miss happens when two answers both look right and clinical judgment has to decide what matters first.
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
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 hidden sm:block text-white">
            Most study apps stop at rationales. Forge goes one step deeper.
          </h3>
          <h3 className="text-xl font-bold mb-3 sm:hidden text-white">
            Forge goes deeper than rationales.
          </h3>
          <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 text-white/80 leading-relaxed hidden sm:block max-w-3xl mx-auto">
            ForgeNursing shows the thinking error behind a missed answer — priority, safety, assessment, delegation, medication, or therapeutic communication — then helps you practice that weakness again.
          </p>
          <p className="text-sm mb-6 text-white/80 sm:hidden">
            Miss one. Find the thinking error. Fix the pattern.
          </p>
          <Link
            href="/signup?plan=monthly"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-[#0D8F9C] text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm min-h-[44px]"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
