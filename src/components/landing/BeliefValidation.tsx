import Link from 'next/link'
import { ArrowRight, AlertCircle } from 'lucide-react'

export default function BeliefValidation() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent mb-4 sm:mb-6">
          If You've Ever Felt Like This...
        </h2>
        <p className="text-lg sm:text-xl text-slate-700 mb-8 sm:mb-10 font-medium">
          ForgeNursing was built for students who feel stuck
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12">
        <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-red-50/80 to-rose-50/80 backdrop-blur-sm border-2 border-red-200/60 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
          </div>
          <p className="text-base sm:text-lg text-slate-700 font-semibold flex-1 leading-relaxed">
            I know the content but freeze on NCLEX-style questions
          </p>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-red-50/80 to-rose-50/80 backdrop-blur-sm border-2 border-red-200/60 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
          </div>
          <p className="text-base sm:text-lg text-slate-700 font-semibold flex-1 leading-relaxed">
            I don't know how to prioritize what to do first
          </p>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-red-50/80 to-rose-50/80 backdrop-blur-sm border-2 border-red-200/60 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
          </div>
          <p className="text-base sm:text-lg text-slate-700 font-semibold flex-1 leading-relaxed">
            Everything blurs together when I study
          </p>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-red-50/80 to-rose-50/80 backdrop-blur-sm border-2 border-red-200/60 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
          </div>
          <p className="text-base sm:text-lg text-slate-700 font-semibold flex-1 leading-relaxed">
            I keep forgetting and re-asking the same questions
          </p>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 sm:p-10 md:p-14 text-center text-white shadow-2xl shadow-indigo-500/30">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-white drop-shadow-lg">
          ForgeNursing Teaches You the "Why" Behind Every Answer
        </h3>
        <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10 text-white/95 font-medium leading-relaxed">
          Build real clinical reasoning — not just memorization. Pass NCLEX the first time with confidence.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-indigo-700 rounded-xl text-base sm:text-lg font-bold hover:bg-indigo-50 transition-all duration-200 shadow-xl hover:shadow-2xl min-h-[44px] transform hover:scale-105 active:scale-95"
        >
          See How It Works
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </Link>
      </div>
    </section>
  )
}
