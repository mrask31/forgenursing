import Link from 'next/link'
import { ArrowRight, AlertCircle } from 'lucide-react'

export default function BeliefValidation() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50" aria-labelledby="validation-heading">
      <div className="text-center mb-8 sm:mb-12">
        <h2 id="validation-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent mb-3 sm:mb-4">
          <span className="hidden sm:inline">If this sounds like you, ForgeNursing can help</span>
          <span className="sm:hidden">Sound familiar?</span>
        </h2>
        <p className="text-base sm:text-lg text-slate-700 mb-6 sm:mb-8 hidden sm:block">
          You know the content. You study hard. But when it comes to NCLEX-style questions, something doesn't click.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 sm:mb-8">
        <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-red-50/90 to-rose-50/90 backdrop-blur-sm border-2 border-red-300/70 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
          </div>
          <p className="text-base sm:text-lg text-slate-700 font-semibold flex-1 leading-relaxed">
            I narrow it down to two answers and pick the wrong one
          </p>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-red-50/90 to-rose-50/90 backdrop-blur-sm border-2 border-red-300/70 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
          </div>
          <p className="text-base sm:text-lg text-slate-700 font-semibold flex-1 leading-relaxed">
            I memorize content but miss prioritization
          </p>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-red-50/90 to-rose-50/90 backdrop-blur-sm border-2 border-red-300/70 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
          </div>
          <p className="text-base sm:text-lg text-slate-700 font-semibold flex-1 leading-relaxed">
            I don't understand why answers are unsafe
          </p>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-red-50/90 to-rose-50/90 backdrop-blur-sm border-2 border-red-300/70 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
          </div>
          <p className="text-base sm:text-lg text-slate-700 font-semibold flex-1 leading-relaxed">
            I freeze on "what to do first" questions
          </p>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl p-6 sm:p-8 md:p-10 text-center text-white shadow-xl shadow-indigo-500/30">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-white drop-shadow-md hidden sm:block">
          Not generic answers. Your actual course content.
        </h3>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-white drop-shadow-md sm:hidden">
          Your course content
        </h3>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/95 leading-relaxed hidden sm:block">
          ForgeNursing uses your uploaded textbooks and notes to explain clinical reasoning. Every explanation is grounded in standard NCLEX frameworks (ABCs, safety, prioritization) and your program's curriculum — not generic content.
        </p>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/95 leading-relaxed sm:hidden">
          Uses your textbooks. NCLEX frameworks. Your curriculum.
        </p>
        <Link
          href="/signup?plan=monthly"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-white text-indigo-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl min-h-[44px] transform hover:scale-105 active:scale-95"
        >
          Try it free for 7 days
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>
      </div>
    </section>
  )
}
