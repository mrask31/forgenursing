'use client'

import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Check, Clock } from 'lucide-react'
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
      description: 'AI clinical preceptor for nursing students using ADPIE framework',
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
        price: '24.99',
        priceCurrency: 'USD',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/signup`
      },
      description: 'AI clinical preceptor that teaches nursing students to think in ADPIE using their own textbooks and course materials. Includes NP voice.',
      featureList: [
        'ADPIE clinical reasoning framework',
        'Upload your own textbooks and notes',
        'NP voice for audio learning',
        'Gemini Vision for clinical images',
        'Session history and clinical pearls',
        'Free beta access'
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
            text: 'ForgeNursing is an AI clinical preceptor for nursing students. Forge teaches clinical reasoning using the ADPIE framework and your own uploaded course materials — textbooks, notes, and syllabi.'
          }
        },
        {
          '@type': 'Question',
          name: 'How does Forge use ADPIE?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Every response from Forge follows the ADPIE clinical reasoning structure: Orient (foundational understanding), The Map (priority framework), Reasoning (Socratic guidance), Trap (common NCLEX mistakes), and Check (follow-up question to test understanding).'
          }
        },
        {
          '@type': 'Question',
          name: 'Do I need to upload my own materials?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Forge works best when you upload your syllabus, textbooks, and lecture notes. This ensures Forge teaches from your specific program curriculum, not generic nursing content.'
          }
        },
        {
          '@type': 'Question',
          name: 'Is ForgeNursing free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. ForgeNursing is currently in free beta. No credit card required. Sign up and start studying immediately.'
          }
        },
        {
          '@type': 'Question',
          name: 'What makes Forge different from other NCLEX prep tools?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Forge is a clinical preceptor, not a question bank. It teaches you how to think using ADPIE — the framework your professors actually test — and grounds every explanation in your own course materials. It also includes a real NP voice so you can hear clinical reasoning explained out loud.'
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
    fetch('/api/beta-spots')
      .then((r) => r.json())
      .then(({ spotsRemaining, isFull }) => {
        setSpotsRemaining(spotsRemaining)
        setBetaFull(isFull)
      })
      .catch(() => {})
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

      {/* Section 5: What's Coming */}
      <section className="bg-[#F7F9FB] py-14 sm:py-18 md:py-20" aria-labelledby="whats-coming-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 id="whats-coming-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3">
              ForgeNursing is just getting started.
            </h2>
            <p className="text-base sm:text-lg text-[#1E2D3D]/70">
              The clinical workspace is growing. Here's what's next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Clinical Simulations */}
            <div className="bg-white border border-[#DDE5EE] rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-sm">
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0D8F9C]/10 text-[#0D8F9C] text-[10px] font-bold rounded-full uppercase tracking-wide">
                  <Clock className="w-2.5 h-2.5" />
                  Coming Soon
                </span>
              </div>
              <div className="w-11 h-11 bg-[#E0F4F6] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#0D8F9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#0B2545] mb-2">Clinical Simulations</h3>
              <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">
                Practice being the nurse before you ever touch a patient. Forge presents an unfolding patient case. Your decisions change what happens next.
              </p>
            </div>

            {/* Gemini Vision */}
            <div className="bg-white border border-[#DDE5EE] rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-sm">
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0D8F9C]/10 text-[#0D8F9C] text-[10px] font-bold rounded-full uppercase tracking-wide">
                  <Clock className="w-2.5 h-2.5" />
                  Coming Soon
                </span>
              </div>
              <div className="w-11 h-11 bg-[#E0F4F6] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#0D8F9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#0B2545] mb-2">Gemini Vision</h3>
              <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">
                Upload EKG strips, wound photos, lab results. Forge analyzes the image and teaches you what to look for — clinically, not just descriptively.
              </p>
            </div>

            {/* Course Workspace */}
            <div className="bg-white border border-[#DDE5EE] rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-sm">
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0D8F9C]/10 text-[#0D8F9C] text-[10px] font-bold rounded-full uppercase tracking-wide">
                  <Clock className="w-2.5 h-2.5" />
                  Coming Soon
                </span>
              </div>
              <div className="w-11 h-11 bg-[#E0F4F6] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#0D8F9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#0B2545] mb-2">Course Workspace</h3>
              <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">
                Forge remembers what you covered last session and picks up where you left off. No more re-establishing context every time you open the app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Pricing */}
      <section className="bg-white py-14 sm:py-18 md:py-20" aria-labelledby="pricing-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 id="pricing-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3">
              One price. Full access. Cancel anytime.
            </h2>
            <p className="text-base sm:text-lg text-[#1E2D3D]/70">
              Every plan includes the full Forge experience — no feature tiers.
            </p>
          </div>

          {/* What's included */}
          <div className="max-w-2xl mx-auto mb-10 bg-[#F7F9FB] border border-[#DDE5EE] rounded-2xl p-6">
            <p className="text-xs font-bold text-[#0B2545] uppercase tracking-widest mb-4">All plans include</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { included: true, text: 'Forge — AI clinical preceptor with NP voice' },
                { included: true, text: 'ADPIE clinical reasoning on every response' },
                { included: true, text: 'Upload your textbooks and class notes' },
                { included: true, text: 'Clinical image analysis (EKG, labs, wounds)' },
                { included: true, text: 'Session history and clinical pearls saved' },
                { included: true, text: 'BSN, ADN, LPN, MSN program support' },
                { included: false, text: 'Clinical simulations (coming soon)' },
                { included: false, text: 'Persistent course workspace (coming soon)' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2 text-sm text-[#1E2D3D]">
                  {item.included ? (
                    <Check className="w-4 h-4 text-[#0D8F9C] mt-0.5 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#94A3B8] mt-0.5 flex-shrink-0" />
                  )}
                  <span className="leading-snug">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {betaFull ? (
            /* Beta full: show pricing cards */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {/* Monthly */}
              <a
                href="/checkout?plan=monthly"
                className="bg-[#F7F9FB] border border-[#DDE5EE] rounded-2xl p-6 hover:border-[#0D8F9C] transition-colors text-left group"
              >
                <h3 className="font-bold text-[#0B2545] mb-1">Monthly</h3>
                <div className="mb-3">
                  <span className="text-3xl font-bold text-[#0B2545]">$24.99</span>
                  <span className="text-sm text-[#1E2D3D]/60"> / month</span>
                </div>
                <p className="text-xs text-[#1E2D3D]/60 mb-4">Flexible, cancel anytime</p>
                <span className="text-xs font-semibold text-[#0D8F9C] group-hover:underline">
                  Start 7-day free trial →
                </span>
              </a>

              {/* Semester — highlighted */}
              <a
                href="/checkout?plan=semester"
                className="bg-[#E0F4F6] border-2 border-[#0D8F9C] rounded-2xl p-6 hover:bg-[#d0ecef] transition-colors text-left relative group"
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0D8F9C] text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  Most Popular
                </span>
                <h3 className="font-bold text-[#0B2545] mb-1 mt-2">Semester</h3>
                <div className="mb-1">
                  <span className="text-3xl font-bold text-[#0B2545]">$89</span>
                </div>
                <p className="text-xs text-[#0D8F9C] font-semibold mb-1">One-time · 4 months</p>
                <p className="text-xs text-[#1E2D3D]/60 mb-4">Save $11 vs monthly</p>
                <span className="text-xs font-semibold text-[#0D8F9C] group-hover:underline">
                  Start 7-day free trial →
                </span>
              </a>

              {/* Annual */}
              <a
                href="/checkout?plan=annual"
                className="bg-[#F7F9FB] border border-[#DDE5EE] rounded-2xl p-6 hover:border-[#0D8F9C] transition-colors text-left group"
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0B2545] text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold hidden">
                  Best Value
                </span>
                <h3 className="font-bold text-[#0B2545] mb-1">Annual</h3>
                <div className="mb-3">
                  <span className="text-3xl font-bold text-[#0B2545]">$149</span>
                </div>
                <p className="text-xs text-[#1E2D3D]/60 mb-4">Best value for a full year</p>
                <span className="text-xs font-semibold text-[#0D8F9C] group-hover:underline">
                  Start 7-day free trial →
                </span>
              </a>
            </div>
          ) : (
            <p className="text-sm text-[#1E2D3D]/50 text-center italic mt-8">
              Beta access is free. Pricing starts at $89/semester after launch.
            </p>
          )}
        </div>
      </section>

      {/* Section 7: Final CTA */}
      <ClosingCTA betaFull={betaFull} />

      {/* Disclaimer */}
      <section className="bg-[#F7F9FB] py-8 sm:py-10" aria-label="Disclaimer">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-[#1E2D3D]/50">
            <span className="hidden sm:inline">ForgeNursing supports clinical reasoning and supplements your nursing education. It does not replace instruction, clinical training, or licensed NCLEX prep resources.</span>
            <span className="sm:hidden">Supplemental study tool — not a replacement for instruction or clinical training.</span>
          </p>
        </div>
      </section>
    </main>
  )
}
