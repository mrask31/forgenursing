'use client'

import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import Hero from '@/components/landing/Hero'
import HowItClicks from '@/components/landing/HowItClicks'
import ThreeFeatures from '@/components/landing/ThreeFeatures'
import BeliefValidation from '@/components/landing/BeliefValidation'
import ClosingCTA from '@/components/landing/ClosingCTA'
// import { startStripeCheckout } from '@/lib/stripeClient' // Disabled during beta

export default function HomePage() {
  // Structured Data (JSON-LD) for SEO
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://forgenursing.com'

    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ForgeNursing',
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      description: 'Clinical judgment trainer for nursing students using ADPIE framework',
      sameAs: [],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
      }
    }

    const softwareApplicationSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'ForgeNursing',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '9.99',
        priceCurrency: 'USD',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/signup`
      },
      description: 'Clinical judgment trainer that helps nursing students practice from their materials, find the thinking error behind missed answers, and retest weak spots.',
      featureList: [
        'Mistake-type feedback',
        'NCLEX-style practice quizzes from your materials',
        'General NCLEX practice questions',
        'AI tutor support for missed answers',
        'ADPIE clinical reasoning support',
        'Weakness-focused practice',
        'BSN, ADN, LPN, MSN program support',
        '7-day free trial',
        'Founding Student pricing'
      ]
    }

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is ForgeNursing?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ForgeNursing is a clinical judgment trainer for nursing students. It helps students practice NCLEX-style questions, understand why they missed an answer, and fix the reasoning pattern behind the mistake.'
          }
        },
        {
          '@type': 'Question',
          name: 'What makes Forge different from other NCLEX prep tools?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Most tools stop at rationales. ForgeNursing maps the thinking error behind a missed answer — such as priority, safety, assessment, delegation, medication, or therapeutic communication — then helps students practice that weakness again.'
          }
        },
        {
          '@type': 'Question',
          name: 'Do I need to upload my own materials?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Forge works best when you upload your syllabus, textbooks, lecture notes, or study guides. It can also provide general NCLEX-style practice when you do not have materials uploaded.'
          }
        },
        {
          '@type': 'Question',
          name: 'Does ForgeNursing have a free trial?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. ForgeNursing includes a 7-day free trial. After the trial, the Founding Student Plan is $9.99 per month or $79 per year. Cancel anytime.'
          }
        }
      ]
    }

    const addSchema = (schema: object, id: string) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = id
      script.text = JSON.stringify(schema)
      document.head.appendChild(script)
    }

    const existingOrg = document.getElementById('organization-schema')
    const existingApp = document.getElementById('software-application-schema')
    const existingFaq = document.getElementById('faq-schema')

    if (existingOrg) existingOrg.remove()
    if (existingApp) existingApp.remove()
    if (existingFaq) existingFaq.remove()

    addSchema(organizationSchema, 'organization-schema')
    addSchema(softwareApplicationSchema, 'software-application-schema')
    addSchema(faqSchema, 'faq-schema')

    return () => {
      const org = document.getElementById('organization-schema')
      const app = document.getElementById('software-application-schema')
      const faq = document.getElementById('faq-schema')
      if (org) org.remove()
      if (app) app.remove()
      if (faq) faq.remove()
    }
  }, [])

  const [user, setUser] = useState<any>(null)
  const [betaFull, setBetaFull] = useState(false)
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/beta-spots', { cache: 'no-store' })
      .then((r) => r.json())
      .then(({ spotsRemaining, isFull }) => {
        setSpotsRemaining(spotsRemaining)
        setBetaFull(isFull)
      })
      .catch(() => {
        // Fail safe: assume beta is full when fetch fails
        setSpotsRemaining(0)
        setBetaFull(true)
      })
  }, [])

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('[Landing Page] Supabase environment variables are missing - user detection disabled')
      return
    }

    try {
      const supabase = getBrowserClient()

      supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
        setUser(user)
      }).catch((error: any) => {
        console.error('[Landing Page] Error getting user:', error)
      })
    } catch (error) {
      console.error('[Landing Page] Error creating Supabase client:', error)
    }
  }, [])

  return (
    <main className="w-full bg-white">
      {/* Section 1: Hero */}
      <Hero user={user} betaFull={betaFull} />

      {/* Section 2: The Problem — Sound familiar? */}
      <BeliefValidation />

      {/* Section 3: This is Forge. */}
      <ThreeFeatures />

      {/* Section 4: How Forge teaches clinical reasoning */}
      <HowItClicks />

      {/* Section 5: Build Confidence Before Exam Day */}
      <section className="bg-[#F7F9FB] py-14 sm:py-18 md:py-20" aria-labelledby="confidence-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-xs font-bold text-[#0D8F9C] uppercase tracking-widest mb-3">
              Confidence, Not Just Questions
            </p>
            <h2 id="confidence-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3">
              Build Confidence Before Exam Day
            </h2>
            <p className="text-base sm:text-lg text-[#1E2D3D]/70 max-w-2xl mx-auto">
              The goal is not more random questions. The goal is knowing exactly what to improve — and walking into your exam prepared.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl border border-[#DDE5EE] bg-white p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#E0F4F6] flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-[#0D8F9C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0B2545]">Find Weak Patterns</h3>
              <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">
                Forge identifies the clinical judgment patterns behind your missed answers — not just which questions you got wrong.
              </p>
            </div>

            <div className="rounded-2xl border border-[#DDE5EE] bg-white p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#E0F4F6] flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-[#0D8F9C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0B2545]">Practice With Purpose</h3>
              <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">
                Short focused drills target your specific weak patterns — so every question you practice actually moves you forward.
              </p>
            </div>

            <div className="rounded-2xl border border-[#DDE5EE] bg-white p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#E0F4F6] flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-[#0D8F9C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0B2545]">Retest Your Weaknesses</h3>
              <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">
                Forge retests the patterns you missed so you can see real progress — not just more scores to worry about.
              </p>
            </div>

            <div className="rounded-2xl border border-[#DDE5EE] bg-white p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#E0F4F6] flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-[#0D8F9C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0B2545]">Walk Into Exam Day Prepared</h3>
              <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">
                Leave each session knowing what you improved — so you build real confidence, not just hope.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Pricing */}
      <section className="bg-white py-14 sm:py-18 md:py-20" aria-labelledby="pricing-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-xs font-bold text-[#0D8F9C] uppercase tracking-widest mb-3">
              Founding Student Plan
            </p>
            <h2 id="pricing-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3">
              Start free. Then choose monthly or annual.
            </h2>
            <p className="text-base sm:text-lg text-[#1E2D3D]/70">
              Full ForgeNursing access — clinical judgment practice, mistake-type feedback, and tutor support for missed answers. Cancel anytime.
            </p>
          </div>

          {/* What's included */}
          <div className="max-w-2xl mx-auto mb-10 bg-[#F7F9FB] border border-[#DDE5EE] rounded-2xl p-6">
            <p className="text-xs font-bold text-[#0B2545] uppercase tracking-widest mb-4">All plans include</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                'NCLEX-style practice quizzes',
                'Questions from your uploaded materials',
                'General NCLEX practice when you need it',
                'Mistake-type feedback',
                'AI tutor support for missed answers',
                'ADPIE clinical reasoning support',
                'Weakness-focused practice',
                'BSN, ADN, LPN, MSN program support',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-[#1E2D3D]">
                  <Check className="w-4 h-4 text-[#0D8F9C] mt-0.5 flex-shrink-0" />
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {/* Monthly */}
            <a
              href="/signup?plan=monthly"
              className="bg-[#F7F9FB] border border-[#DDE5EE] rounded-2xl p-6 hover:border-[#0D8F9C] transition-colors text-left group"
            >
              <h3 className="font-bold text-[#0B2545] mb-1">Monthly</h3>
              <div className="mb-3">
                <span className="text-3xl font-bold text-[#0B2545]">$9.99</span>
                <span className="text-sm text-[#1E2D3D]/60"> / month</span>
              </div>
              <p className="text-xs text-[#1E2D3D]/60 mb-4">Flexible, cancel anytime</p>
              <span className="text-xs font-semibold text-[#0D8F9C] group-hover:underline">
                Start 7-day free trial →
              </span>
            </a>

            {/* Annual */}
            <a
              href="/signup?plan=annual"
              className="bg-[#E0F4F6] border-2 border-[#0D8F9C] rounded-2xl p-6 hover:bg-[#d0ecef] transition-colors text-left relative group"
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0D8F9C] text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                Best Value
              </span>
              <h3 className="font-bold text-[#0B2545] mb-1 mt-2">Annual</h3>
              <div className="mb-1">
                <span className="text-3xl font-bold text-[#0B2545]">$79</span>
                <span className="text-sm text-[#1E2D3D]/60"> / year</span>
              </div>
              <p className="text-xs text-[#0D8F9C] font-semibold mb-1">Save 34% vs monthly</p>
              <p className="text-xs text-[#1E2D3D]/60 mb-4">Best value for a full year</p>
              <span className="text-xs font-semibold text-[#0D8F9C] group-hover:underline">
                Start 7-day free trial →
              </span>
            </a>
          </div>
          <p className="max-w-2xl mx-auto text-center text-xs text-[#1E2D3D]/45 mt-6 leading-relaxed">
            ForgeNursing is a study aid. Subscription purchase does not guarantee passing any course, exam, NCLEX®, licensing exam, or certification.
          </p>
        </div>
      </section>

      {/* Section 7: Final CTA */}
      <ClosingCTA betaFull={betaFull} />

      {/* Disclaimer */}
      <section className="bg-[#F7F9FB] py-8 sm:py-10" aria-label="Disclaimer">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-[#1E2D3D]/50 leading-relaxed">
            <span className="hidden sm:inline">ForgeNursing provides AI-generated NCLEX-style study tools for educational practice and clinical reasoning. It supplements, but does not replace, instruction, clinical training, official licensure preparation materials, or faculty guidance. NCLEX® is a registered trademark of the National Council of State Boards of Nursing, Inc. ForgeNursing is not affiliated with, endorsed by, or sponsored by NCSBN.</span>
            <span className="sm:hidden">AI-generated NCLEX-style study aid. Not affiliated with NCSBN. No exam outcome guaranteed.</span>
          </p>
        </div>
      </section>
    </main>
  )
}
