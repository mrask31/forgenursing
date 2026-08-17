'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'

type Plan = 'retake'

interface PricingContentProps {
  isBeta: boolean
  isSubscribed: boolean
}

async function startStandardCheckout(plan: Plan): Promise<void> {
  const { startStripeCheckout } = await import('@/lib/stripeClient')
  await startStripeCheckout(plan)
}

const included = [
  '90 days of access for one focused retake window',
  'Retake Recovery Check',
  'Diagnostic question sets',
  'Answer Autopsies for missed diagnostic questions',
  'Mistake Pattern Map',
  '7-day and 14-day Fix Plans',
  'Weekly Retake Readiness Reports',
]

const reasons = [
  'Built for NCLEX retakers, not generic nursing school study.',
  'Focused on why answers were missed, not just what topic was weak.',
  'One simple price instead of another monthly subscription.',
]

export default function PricingContent({ isSubscribed }: PricingContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isSubscribed) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-[#F7F9FB] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl p-8 shadow-lg border border-[#DDE5EE]">
          <div className="w-16 h-16 bg-[#E0F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-[#0D8F9C]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] mb-2">You already have access</h1>
          <p className="text-[#1E2D3D]/70 mb-6">Your ForgeNursing access is active. Go back to the app to continue your recovery plan.</p>
          <button
            onClick={() => router.push('/entry')}
            className="w-full px-6 py-3 bg-[#0D8F9C] text-white rounded-xl font-bold hover:bg-[#0a7d88] transition-colors"
          >
            Go to ForgeNursing →
          </button>
        </div>
      </div>
    )
  }

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      await startStandardCheckout('retake')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-white text-[#0B2545]">
      <section className="bg-gradient-to-br from-[#E0F4F6] via-white to-[#F7F9FB] py-14 sm:py-20" aria-labelledby="pricing-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-bold text-[#0D8F9C] hover:text-[#0a7d88]">
            ← Back to Home
          </Link>
          <div className="mt-8 text-center max-w-3xl mx-auto">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#0D8F9C]/30 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">
              90-Day Retake Recovery Pass
            </p>
            <h1 id="pricing-heading" className="mt-5 font-display text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-[#0B2545]">
              One retake window. One focused recovery plan.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#1E2D3D]/75">
              ForgeNursing is priced for retakers who need clarity now — not another open-ended monthly subscription.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="rounded-[2rem] border border-[#0D8F9C]/25 bg-gradient-to-br from-[#E0F4F6] via-white to-[#F7F9FB] p-6 sm:p-8 shadow-xl shadow-[#0B2545]/8">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">Retake Recovery Pass</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-bold text-[#0B2545]">$19.99</span>
                <span className="pb-2 text-base font-semibold text-[#1E2D3D]/65">/ 90 days</span>
              </div>
              <p className="mt-4 text-base leading-7 text-[#1E2D3D]/70">
                Designed for one NCLEX retake preparation window. No monthly billing positioning, no annual upsell, no confusing plan grid.
              </p>

              <div className="mt-6 rounded-2xl border border-[#DDE5EE] bg-white p-5">
                <p className="font-bold text-[#0B2545]">Includes</p>
                <div className="mt-4 space-y-3">
                  {included.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-[#1E2D3D]/75">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0D8F9C]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="mt-6 inline-flex w-full min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-6 py-3 text-base font-bold text-white shadow-lg shadow-[#0D8F9C]/20 transition hover:bg-[#0a7d88] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Starting checkout...
                  </>
                ) : (
                  <>
                    Unlock Retake Recovery Pass
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <Link href="/retake-recovery-check" className="mt-3 inline-flex w-full min-h-[46px] items-center justify-center rounded-xl border border-[#DDE5EE] bg-white px-6 py-3 text-sm font-bold text-[#0B2545] transition hover:border-[#0D8F9C] hover:text-[#0D8F9C]">
                Start the free check first
              </Link>

              <p className="mt-4 text-xs leading-5 text-[#1E2D3D]/55">
                ForgeNursing is an educational study aid. It is not affiliated with NCSBN and does not guarantee exam outcomes.
              </p>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-[#DDE5EE] bg-[#F7F9FB] p-6 sm:p-8">
                <h2 className="font-display text-2xl font-bold text-[#0B2545]">Why this is different</h2>
                <div className="mt-5 space-y-4">
                  {reasons.map((reason) => (
                    <div key={reason} className="flex items-start gap-3 text-sm leading-6 text-[#1E2D3D]/75">
                      <Target className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0D8F9C]" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#DDE5EE] bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="font-display text-2xl font-bold text-[#0B2545]">Use it with what you already bought</h2>
                <p className="mt-4 text-sm leading-6 text-[#1E2D3D]/70">
                  Keep using UWorld, Archer, ATI, HESI, Bootcamp, your program materials, or any other prep resource. ForgeNursing is the recovery layer that helps you diagnose the missed-answer patterns your main resource may not organize for you.
                </p>
                <div className="mt-5 rounded-2xl border border-[#0D8F9C]/25 bg-[#E0F4F6] p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0D8F9C]" />
                    <p className="text-sm leading-6 text-[#1E2D3D]/75">
                      If you use outside questions, summarize them in your own words. Do not paste full copyrighted questions from third-party platforms.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#DDE5EE] bg-[#0B2545] p-6 sm:p-8 text-white">
                <h2 className="font-display text-2xl font-bold">Not ready to pay?</h2>
                <p className="mt-4 text-sm leading-6 text-white/70">
                  Start with the free Retake Recovery Check. It gives you a starting snapshot before you decide whether the full pass is worth it.
                </p>
                <Link href="/retake-recovery-check" className="mt-5 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0B2545] transition hover:bg-white/90">
                  Start Free Check
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
