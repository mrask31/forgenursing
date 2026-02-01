'use client'

import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { Check, ArrowRight, Sparkles, Shield, Heart } from 'lucide-react'
import Hero from '@/components/landing/Hero'
import HowItClicks from '@/components/landing/HowItClicks'
import ThreeFeatures from '@/components/landing/ThreeFeatures'
import BeliefValidation from '@/components/landing/BeliefValidation'
import ClosingCTA from '@/components/landing/ClosingCTA'
import { startStripeCheckout } from '@/lib/stripeClient'

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
      description: 'AI-powered clinical reasoning tutor for nursing students preparing for NCLEX',
      sameAs: [
        // Add social media URLs when available
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        // Add email when available
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
        priceValidUntil: '2025-12-31',
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/signup`
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '150',
        bestRating: '5',
        worstRating: '1'
      },
      description: 'AI tutor that turns your nursing textbooks and lecture notes into step-by-step clinical reasoning guidance for NCLEX preparation',
      featureList: [
        'Step-by-step clinical reasoning',
        'Uses your own course materials',
        'NCLEX-style question practice',
        'Visual concept maps',
        'Progress tracking',
        '7-day free trial'
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
            text: 'ForgeNursing is an AI-powered clinical reasoning tutor that helps nursing students prepare for NCLEX by turning their lecture notes and textbooks into step-by-step clinical reasoning guidance. It helps students understand prioritization, safety protocols, and clinical judgment.'
          }
        },
        {
          '@type': 'Question',
          name: 'How does ForgeNursing help with NCLEX prep?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ForgeNursing uses your own course materials to provide step-by-step clinical reasoning guidance. It helps you think through NCLEX-style questions using frameworks like ABCs, Maslow\'s hierarchy, and safety protocols. Instead of just giving answers, it teaches you how to reason through prioritization and clinical decisions.'
          }
        },
        {
          '@type': 'Question',
          name: 'Do I need to upload my own materials?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, ForgeNursing works best when you upload your syllabus, textbooks, and lecture notes. This ensures the AI tutor aligns with your specific nursing program\'s curriculum and teaching style.'
          }
        },
        {
          '@type': 'Question',
          name: 'Is there a free trial?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, ForgeNursing offers a 7-day free trial. You can start using the platform immediately and cancel anytime during the trial period without being charged.'
          }
        },
        {
          '@type': 'Question',
          name: 'What makes ForgeNursing different from other NCLEX prep tools?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ForgeNursing focuses on teaching clinical reasoning and prioritization using your own materials, rather than generic question banks. It provides step-by-step guidance that helps you understand the "why" behind clinical decisions, not just memorizing answers.'
          }
        }
      ]
    }

    // Add schemas to page
    const addSchema = (schema: object, id: string) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = id
      script.text = JSON.stringify(schema)
      document.head.appendChild(script)
    }

    // Remove existing schemas if they exist (for hot reload)
    const existingOrg = document.getElementById('organization-schema')
    const existingApp = document.getElementById('software-application-schema')
    const existingFaq = document.getElementById('faq-schema')
    
    if (existingOrg) existingOrg.remove()
    if (existingApp) existingApp.remove()
    if (existingFaq) existingFaq.remove()

    addSchema(organizationSchema, 'organization-schema')
    addSchema(softwareApplicationSchema, 'software-application-schema')
    addSchema(faqSchema, 'faq-schema')

    // Cleanup on unmount
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

  useEffect(() => {
    // Safely create Supabase client - don't break landing page if env vars are missing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('[Landing Page] Supabase environment variables are missing - user detection disabled')
      return
    }
    
    try {
      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
      
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
      }).catch((error) => {
        console.error('[Landing Page] Error getting user:', error)
        // Don't break the page if auth check fails
      })
    } catch (error) {
      console.error('[Landing Page] Error creating Supabase client:', error)
      // Don't break the page if Supabase client creation fails
    }
  }, [])

  return (
    <main className="w-full bg-slate-50">
      <div className="flex flex-col">
        {/* Hero Section */}
        <div className="order-1">
          <Hero user={user} />
        </div>

        {/* If this sounds like you... */}
        <div className="order-2 md:order-4">
          <BeliefValidation />
        </div>

        {/* How studying finally clicks */}
        <div className="order-3 md:order-2">
          <HowItClicks />
        </div>

        {/* Built for how nurses actually learn */}
        <div className="order-4 md:order-3">
          <ThreeFeatures />
        </div>

        {/* Pricing - Enhanced */}
        <section className="order-5 md:order-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-gradient-to-br from-white via-indigo-50/30 to-white" aria-labelledby="pricing-heading">
          <div className="text-center mb-10 sm:mb-12">
            <h2 id="pricing-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent mb-4">
              <span className="hidden sm:inline">Simple, Student-Friendly Pricing</span>
              <span className="sm:hidden">Simple Pricing</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-700 mb-4 hidden sm:block">
              Start with a free preview. If you feel stuck, give yourself one week with a tutor that uses your materials.
            </p>
            <p className="text-base sm:text-lg text-slate-700 mb-4 sm:hidden">
              Free preview. One week to see if it helps.
            </p>
            
            {/* All Plans Include */}
            <div className="mt-6 mb-8 max-w-3xl mx-auto">
              <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-3">All plans include full access to:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Step-by-step clinical reasoning</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Clinical Studio (NCLEX-style simulations)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Strict testing mode</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Key concepts & evidence review</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Support for your uploaded textbooks</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Progress insights & history</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-700 text-center mb-6 sm:mb-8">
            Most students decide if ForgeNursing helps within the first 2–3 sessions.
          </p>

          {/* Pricing Cards */}
          {/* UI display-only; billing handled by Stripe Price IDs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {/* Monthly Plan - Enhanced */}
            <div className="bg-white/80 backdrop-blur-sm border-2 border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300 transform hover:scale-[1.02]">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Monthly Access</h3>
              <div className="mb-4">
                <span className="text-3xl sm:text-4xl font-bold text-slate-900">$24.99</span>
                <span className="text-slate-600 text-sm sm:text-base ml-1">/month</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mb-6">Perfect for focused study periods</p>
              <button
                onClick={() => startStripeCheckout('monthly')}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm sm:text-base font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 transform hover:scale-105 active:scale-95"
              >
                Start Free Preview
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 inline-block ml-2" />
              </button>
            </div>

            {/* Semester Plan - Enhanced */}
            <div className="bg-white/80 backdrop-blur-sm border-2 border-indigo-300/60 rounded-2xl p-6 sm:p-8 shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/40 transition-all duration-300 transform hover:scale-[1.02] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Semester Access</h3>
              <div className="mb-2">
                <span className="text-3xl sm:text-4xl font-bold text-slate-900">$89</span>
                <span className="text-slate-600 text-sm sm:text-base ml-1">/semester</span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 mb-1">4 months</p>
              <p className="text-xs sm:text-sm text-indigo-600 font-semibold mb-4">
                ~$22.25/month • Save 11% vs monthly
              </p>
              <p className="text-xs sm:text-sm text-slate-600 mb-6">Best value for a full term</p>
              <button
                onClick={() => startStripeCheckout('semester')}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm sm:text-base font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 transform hover:scale-105 active:scale-95"
              >
                Start Free Preview
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 inline-block ml-2" />
              </button>
            </div>

            {/* Annual Plan - Enhanced */}
            <div className="bg-white/80 backdrop-blur-sm border-2 border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300 transform hover:scale-[1.02]">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Annual Access</h3>
              <div className="mb-2">
                <span className="text-3xl sm:text-4xl font-bold text-slate-900">$199</span>
                <span className="text-slate-600 text-sm sm:text-base ml-1">/year</span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 mb-1">12 months</p>
              <p className="text-xs sm:text-sm text-indigo-600 font-semibold mb-4">
                ~$16.58/month • Save 34% vs monthly
              </p>
              <p className="text-xs sm:text-sm text-slate-600 mb-6">Maximum savings for long-term commitment</p>
              <button
                onClick={() => startStripeCheckout('annual')}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm sm:text-base font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 transform hover:scale-105 active:scale-95"
              >
                Start Free Preview
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 inline-block ml-2" />
              </button>
            </div>
          </div>

          {/* Trust Section - Enhanced */}
          <div className="text-center pt-8 sm:pt-12 border-t border-slate-200">
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <span>7-day free trial included</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <span>No hidden fees</span>
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <div className="order-6 md:order-6">
          <ClosingCTA />
        </div>

        {/* Disclaimer Section */}
        <section className="order-7 md:order-7 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-slate-50" aria-label="Disclaimer">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl mx-auto">
              <span className="hidden sm:inline">ForgeNursing supports clinical reasoning and supplements your nursing education. It does not replace instruction, clinical training, or NCLEX prep resources.</span>
              <span className="sm:hidden">Supplemental study tool — not a replacement for instruction.</span>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

