import Link from 'next/link'
import { ArrowRight, AlertCircle } from 'lucide-react'

export default function BeliefValidation() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50" aria-labelledby="validation-heading">
      <div className="text-center mb-8 sm:mb-12">
        <h2 id="validation-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent mb-3 sm:mb-4">
          <span className="hidden sm:inline">Designed to Complement — Not Replace — Your Other Study Tools</span>
          <span className="sm:hidden">Works With Your Other Tools</span>
        </h2>
        <p className="text-base sm:text-lg text-slate-700 mb-6 sm:mb-8 hidden sm:block">
          Question banks test what you know. Videos help you remember. ForgeNursing helps you think through NCLEX-style decisions when your brain freezes.
        </p>
        <p className="text-base sm:text-lg text-slate-700 mb-6 sm:mb-8 sm:hidden">
          Think through decisions when your brain freezes.
        </p>
      </div>
      
      <p className="text-base sm:text-lg text-slate-700 mb-4 sm:mb-6 text-center">
        If any of these sound familiar, you're exactly who ForgeNursing was built for:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 sm:mb-8">
        <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-red-50/90 to-rose-50/90 backdrop-blur-sm border-2 border-red-300/70 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
          </div>
          <p className="text-base sm:text-lg text-slate-700 font-semibold flex-1 leading-relaxed">
            I know the content, but I freeze on "what do I do first?"
          </p>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-red-50/90 to-rose-50/90 backdrop-blur-sm border-2 border-red-300/70 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
          </div>
          <p className="text-base sm:text-lg text-slate-700 font-semibold flex-1 leading-relaxed">
            I can't tell what's most important in the question
          </p>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-red-50/90 to-rose-50/90 backdrop-blur-sm border-2 border-red-300/70 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
          </div>
          <p className="text-base sm:text-lg text-slate-700 font-semibold flex-1 leading-relaxed">
            I keep studying, but nothing sticks under pressure
          </p>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-red-50/90 to-rose-50/90 backdrop-blur-sm border-2 border-red-300/70 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
          </div>
          <p className="text-base sm:text-lg text-slate-700 font-semibold flex-1 leading-relaxed">
            I'm tired of re-learning the same topic
          </p>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl p-6 sm:p-8 md:p-10 text-center text-white shadow-xl shadow-indigo-500/30">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-white drop-shadow-md hidden sm:block">
          Built With Nursing Students and Educators in Mind
        </h3>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-white drop-shadow-md sm:hidden">
          Student-Centered & Ethical
        </h3>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/95 leading-relaxed hidden sm:block">
          ForgeNursing is pilot-tested with real students to ensure it supports clinical reasoning — ethically, calmly, and effectively. No gimmicks. No pressure. Not a replacement for school. Just meaningful learning that helps prioritization click.
        </p>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/95 leading-relaxed sm:hidden">
          Pilot-tested with real students. Ethical, calm, no gimmicks.
        </p>
        <Link
          href="/signup?plan=monthly"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-white text-indigo-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl min-h-[44px] transform hover:scale-105 active:scale-95"
        >
          See How It Works
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>
      </div>
    </section>
  )
}
