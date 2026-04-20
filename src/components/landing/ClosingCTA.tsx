'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface ClosingCTAProps {
  betaFull?: boolean
}

export default function ClosingCTA({ betaFull = false }: ClosingCTAProps) {
  return (
    <section className="bg-[#0B2545] py-14 sm:py-18 md:py-20" aria-labelledby="cta-heading">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 id="cta-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-white mb-4 sm:mb-5">
          Forge is ready when you are.
        </h2>
        <p className="text-base sm:text-lg text-white/70 mb-8 sm:mb-10 leading-relaxed">
          Most students know within 2–3 sessions whether ForgeNursing changes how they study.
        </p>
        {betaFull ? (
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 sm:px-10 py-4 bg-[#0D8F9C] text-white rounded-lg text-base sm:text-lg font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm min-h-[52px]"
          >
            Start 7-Day Free Trial →
          </Link>
        ) : (
          <Link
            href="/signup?plan=monthly"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 sm:px-10 py-4 bg-[#0D8F9C] text-white rounded-lg text-base sm:text-lg font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm min-h-[52px]"
          >
            Join Free Beta →
          </Link>
        )}
        <p className="text-xs text-white/40 mt-4">
          {betaFull ? '7-day free trial · No credit card required' : 'Free access · No credit card required'}
        </p>
      </div>
    </section>
  )
}
