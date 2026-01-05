'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function ClosingCTA() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50">
      <div className="text-center space-y-8 sm:space-y-10">
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
            Start your 7-day free trial today
          </h2>
          <div className="space-y-3 text-lg sm:text-xl md:text-2xl text-slate-700 font-medium">
            <p>Your textbooks become your tutor.</p>
            <p>Your questions finally make sense.</p>
            <p className="font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent text-xl sm:text-2xl md:text-3xl">Your confidence starts here.</p>
          </div>
        </div>
        
        <div className="pt-6 sm:pt-8">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-10 sm:px-12 py-5 sm:py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-lg sm:text-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 min-h-[44px] transform hover:scale-105 active:scale-95"
          >
            Get Started Free
            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </Link>
          <p className="text-base text-slate-600 mt-4 sm:mt-6 font-medium">
            No credit risk. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
