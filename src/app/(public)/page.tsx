'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Map,
  RotateCcw,
  ShieldCheck,
  Target,
} from 'lucide-react'

const painPoints = [
  'I failed NCLEX and my score report did not tell me what to change.',
  'I keep narrowing questions down to two and choosing the wrong one.',
  'I read rationales every day, but my scores are still not moving.',
  'I am scared to retake because I do not know why I missed the last attempt.',
]

const patternTypes = [
  'Priority vs. true answer',
  'Assessment vs. intervention',
  'SATA overselecting',
  'Delegation and scope',
  'Safety and first action',
  'Second-guessing',
  'Content gap vs. reasoning gap',
  'Passive rationale review',
]

const recoverySteps = [
  {
    title: 'Start with the Retake Recovery Check',
    body: 'Answer a focused set of questions about your failed attempt, current study habits, retake timeline, and the question types that keep hurting you.',
  },
  {
    title: 'Complete a diagnostic set',
    body: 'Work through original NCLEX-style questions designed to expose reasoning patterns like priority, SATA, delegation, safety, and first-action thinking.',
  },
  {
    title: 'Review each Answer Autopsy',
    body: 'For missed answers, ForgeNursing explains why the wrong answer was tempting, what cue was missed, and what pattern caused the mistake.',
  },
  {
    title: 'Follow your Fix Plan',
    body: 'Get a 7-day or 14-day retake plan based on your pattern map, then retest the same weak reasoning areas before your next attempt.',
  },
]

const includedFeatures = [
  'Free Retake Recovery Check',
  'Diagnostic question sets',
  'Answer Autopsies for missed questions',
  'Mistake Pattern Map',
  '7-day and 14-day Fix Plans',
  'Weekly Retake Readiness Reports',
]

async function captureLandingView() {
  try {
    const posthog = (await import('posthog-js')).default
    posthog.capture('retake_landing_page_viewed', {
      source: 'homepage',
      positioning: 'nclex_retake_recovery',
    })
  } catch {}
}

export default function HomePage() {
  useEffect(() => {
    captureLandingView()

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://forgenursing.com'

    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ForgeNursing',
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      description: 'NCLEX retake recovery tool for diagnosing missed-answer patterns before a retake.',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
      },
    }

    const softwareApplicationSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'ForgeNursing Retake Recovery',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '19.99',
        priceCurrency: 'USD',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/pricing`,
      },
      description: 'ForgeNursing helps NCLEX retakers diagnose why they missed questions, map mistake patterns, and build a focused retake plan.',
      featureList: includedFeatures,
    }

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Who is ForgeNursing for?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ForgeNursing is built for NCLEX retakers and students whose scores are stuck because they do not know what mistake pattern to fix next.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does ForgeNursing guarantee a passing NCLEX result?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. ForgeNursing does not guarantee an exam outcome. It helps retakers identify missed-answer patterns and build a clearer recovery plan.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is ForgeNursing a question bank?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. ForgeNursing is a retake recovery and diagnostic tool. It uses targeted diagnostic questions and missed-answer analysis to show why answers are being missed.',
          },
        },
      ],
    }

    const addSchema = (schema: object, id: string) => {
      const existing = document.getElementById(id)
      if (existing) existing.remove()

      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = id
      script.text = JSON.stringify(schema)
      document.head.appendChild(script)
    }

    addSchema(organizationSchema, 'organization-schema')
    addSchema(softwareApplicationSchema, 'software-application-schema')
    addSchema(faqSchema, 'faq-schema')

    return () => {
      document.getElementById('organization-schema')?.remove()
      document.getElementById('software-application-schema')?.remove()
      document.getElementById('faq-schema')?.remove()
    }
  }, [])

  return (
    <main className="w-full bg-white text-[#0B2545]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#E0F4F6] via-white to-[#F7F9FB]" aria-labelledby="hero-heading">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0D8F9C] via-[#0BBCD4] to-[#0D8F9C]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#0D8F9C]/30 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C] shadow-sm">
                NCLEX Retake Recovery
              </p>
              <h1 id="hero-heading" className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.03] tracking-tight text-[#0B2545]">
                Failed NCLEX and don’t know what to fix before your retake?
              </h1>
              <p className="mt-6 max-w-2xl text-lg sm:text-xl leading-8 text-[#1E2D3D]/75">
                ForgeNursing helps NCLEX retakers find the mistake patterns behind missed answers, so your next study plan is not just “do more questions.”
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/retake-recovery-check"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-6 py-3 text-base font-bold text-white shadow-lg shadow-[#0D8F9C]/20 transition hover:bg-[#0a7d88]"
                >
                  Start Your Free Retake Recovery Check
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#DDE5EE] bg-white px-6 py-3 text-base font-bold text-[#0B2545] transition hover:border-[#0D8F9C] hover:text-[#0D8F9C]"
                >
                  See How It Works
                </Link>
              </div>
              <p className="mt-4 text-sm text-[#1E2D3D]/60">
                No pass guarantees. No shame. Just a clearer plan for what to fix next.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#DDE5EE] bg-white p-5 sm:p-6 shadow-2xl shadow-[#0B2545]/10">
              <div className="rounded-3xl bg-[#F7F9FB] p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">Your Retake Snapshot</p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-[#DDE5EE] bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-[#0B2545]">Likely top risk</p>
                        <p className="text-sm text-[#1E2D3D]/65">Priority vs. true answer</p>
                      </div>
                      <Target className="h-8 w-8 text-[#0D8F9C]" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#DDE5EE] bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-[#0B2545]">Second pattern</p>
                        <p className="text-sm text-[#1E2D3D]/65">Narrowed to two, picked wrong</p>
                      </div>
                      <FileSearch className="h-8 w-8 text-[#0D8F9C]" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#0D8F9C]/25 bg-[#E0F4F6] p-4">
                    <p className="text-sm font-bold text-[#0B2545]">Next focus</p>
                    <p className="mt-1 text-sm text-[#1E2D3D]/70">
                      Stop treating every miss like a content gap. Diagnose the decision pattern first.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20" aria-labelledby="problem-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">The real retake problem</p>
            <h2 id="problem-heading" className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[#0B2545]">
              Doing more questions is not always the answer.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#1E2D3D]/70">
              If you failed NCLEX, your next attempt needs more than another pile of practice questions. You need to know whether you are missing content, priority, SATA, delegation, first-action thinking, or changing answers too often.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {painPoints.map((point) => (
              <div key={point} className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-5">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0D8F9C]" />
                  <p className="text-base font-semibold text-[#1E2D3D]">“{point}”</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F7F9FB] py-16 sm:py-20" aria-labelledby="diagnose-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">The new ForgeNursing</p>
            <h2 id="diagnose-heading" className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[#0B2545]">
              Diagnose why you missed — not just what you missed.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#1E2D3D]/70">
              Most rationales explain the correct answer. ForgeNursing shows the mistake pattern behind the wrong answer, then turns that pattern into a focused retake plan.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon={<ClipboardCheck className="h-7 w-7" />}
              title="Retake Recovery Check"
              body="Start with a fast assessment of your failed attempt, study habits, weak question types, and retake timeline."
            />
            <FeatureCard
              icon={<FileSearch className="h-7 w-7" />}
              title="Answer Autopsy"
              body="When you miss a diagnostic question, see why your answer was tempting, what cue you missed, and what reasoning pattern caused it."
            />
            <FeatureCard
              icon={<Map className="h-7 w-7" />}
              title="Mistake Pattern Map"
              body="Track recurring patterns like priority vs. true answer, SATA overselecting, delegation, first action, and second-guessing."
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20" aria-labelledby="steps-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">Miss → Autopsy → Pattern → Fix Plan → Retest</p>
              <h2 id="steps-heading" className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[#0B2545]">
                A recovery workflow built for one retake window.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#1E2D3D]/70">
                ForgeNursing is not another endless monthly study app. It is a 90-day retake recovery pass designed to help you find the pattern, fix the pattern, and retest the pattern.
              </p>
            </div>
            <div className="space-y-4">
              {recoverySteps.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-5 sm:p-6">
                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0D8F9C] text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0B2545]">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#1E2D3D]/70">{step.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F9FB] py-16 sm:py-20" aria-labelledby="patterns-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">What gets tracked</p>
            <h2 id="patterns-heading" className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[#0B2545]">
              Your missed answers become a pattern map.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#1E2D3D]/70">
              A score tells you what happened. Your mistake pattern tells you what to change before the next attempt.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {patternTypes.map((pattern) => (
              <div key={pattern} className="rounded-2xl border border-[#DDE5EE] bg-white p-4 text-sm font-bold text-[#0B2545] shadow-sm">
                {pattern}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20" aria-labelledby="pricing-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-[#0D8F9C]/25 bg-gradient-to-br from-[#E0F4F6] via-white to-[#F7F9FB] p-6 sm:p-8 lg:p-10 shadow-xl shadow-[#0B2545]/8">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">90-Day Retake Recovery Pass</p>
                <h2 id="pricing-heading" className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[#0B2545]">
                  $19.99 for one focused recovery window.
                </h2>
                <p className="mt-4 text-lg leading-8 text-[#1E2D3D]/70">
                  Built for retakers who need a clearer plan before the next attempt — not another endless subscription.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link href="/retake-recovery-check" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-6 py-3 font-bold text-white transition hover:bg-[#0a7d88]">
                    Start Free Recovery Check
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link href="/pricing" className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#DDE5EE] bg-white px-6 py-3 font-bold text-[#0B2545] transition hover:border-[#0D8F9C] hover:text-[#0D8F9C]">
                    View Pass Details
                  </Link>
                </div>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm border border-[#DDE5EE]">
                <p className="text-sm font-bold text-[#0B2545]">Included in the pass</p>
                <div className="mt-4 space-y-3">
                  {includedFeatures.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm text-[#1E2D3D]/75">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0D8F9C]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0B2545] py-16 sm:py-20 text-white" aria-labelledby="final-cta-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <RotateCcw className="mx-auto h-10 w-10 text-[#0BBCD4]" />
          <h2 id="final-cta-heading" className="mt-5 font-display text-3xl sm:text-4xl font-bold">
            Before you retake, know why you picked the wrong one.
          </h2>
          <p className="mt-4 text-lg leading-8 text-white/75">
            Start with a free recovery check. If ForgeNursing does not help you see your miss patterns more clearly, you will know quickly.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/retake-recovery-check" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-[#0B2545] transition hover:bg-white/90">
              Start Your Free Retake Recovery Check
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/faq" className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/25 px-6 py-3 font-bold text-white transition hover:bg-white/10">
              Read FAQ
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/55">
            ForgeNursing is an educational study aid. It is not affiliated with NCSBN and does not guarantee exam outcomes.
          </p>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-[#DDE5EE] bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E0F4F6] text-[#0D8F9C]">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-bold text-[#0B2545]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#1E2D3D]/70">{body}</p>
    </div>
  )
}
