import Link from 'next/link'
import { ArrowRight, AlertCircle } from 'lucide-react'

export default function BeliefValidation() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 bg-white">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700 mb-4 sm:mb-6">
          If You've Ever Felt Like This...
        </h2>
        <p className="text-base sm:text-lg text-slate-500 mb-6 sm:mb-8">
          ForgeNursing was built for students who feel stuck
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12">
        <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-red-50 border-2 border-red-200 hover:bg-red-100 transition-colors">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
          </div>
          <p className="text-base sm:text-lg text-slate-600 font-medium flex-1">
            I know the content but freeze on NCLEX-style questions
          </p>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-red-50 border-2 border-red-200 hover:bg-red-100 transition-colors">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
          </div>
          <p className="text-base sm:text-lg text-slate-600 font-medium flex-1">
            I don't know how to prioritize what to do first
          </p>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-red-50 border-2 border-red-200 hover:bg-red-100 transition-colors">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
          </div>
          <p className="text-base sm:text-lg text-slate-600 font-medium flex-1">
            Everything blurs together when I study
          </p>
        </div>
        <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-red-50 border-2 border-red-200 hover:bg-red-100 transition-colors">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
          </div>
          <p className="text-base sm:text-lg text-slate-600 font-medium flex-1">
            I keep forgetting and re-asking the same questions
          </p>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 sm:p-8 md:p-12 text-center text-white shadow-xl">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-white drop-shadow-sm">
          ForgeNursing Teaches You the "Why" Behind Every Answer
        </h3>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white">
          Build real clinical reasoning — not just memorization. Pass NCLEX the first time with confidence.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-indigo-600 rounded-xl text-base sm:text-lg font-semibold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl min-h-[44px]"
        >
          See How It Works
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </Link>
      </div>
    </section>
  )
}
