'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function ClosingCTA() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="text-center space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
            Start your 7-day free trial today
          </h2>
          <div className="space-y-2 text-base sm:text-lg text-slate-700">
            <p>Your textbooks become your tutor.</p>
            <p>Your questions finally make sense.</p>
            <p className="font-bold text-indigo-700 text-lg sm:text-xl">Your confidence starts here.</p>
          </div>
        </div>
        
        <div className="pt-4 sm:pt-6">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-indigo-600 text-white rounded-xl text-base sm:text-lg font-semibold hover:bg-indigo-700 transition-all shadow-xl hover:shadow-2xl min-h-[44px]"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <p className="text-sm text-slate-600 mt-3 sm:mt-4">
            No credit risk. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
