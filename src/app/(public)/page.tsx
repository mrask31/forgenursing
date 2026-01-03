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

export default function LandingPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <Hero user={user} />

      {/* How studying finally clicks */}
      <HowItClicks />

      {/* Built for how nurses actually learn */}
      <ThreeFeatures />

      {/* If this sounds like you... */}
      <BeliefValidation />

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Choose the plan that fits your journey
          </h2>
          
          {/* All Plans Include */}
          <div className="mt-8 mb-12 max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-slate-700 mb-4">All plans include full access to:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
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
                <span>Step-by-step clinical reasoning</span>
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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Monthly Plan */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Monthly Access</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-slate-900">$24.99</span>
              <span className="text-lg text-slate-600"> / month</span>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Perfect for students who want flexibility.
            </p>
            <ul className="space-y-2.5 mb-6 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>Unlimited access to ForgeNursing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>Billed monthly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>Cancel anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>7-day free trial included</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => startStripeCheckout('monthly')}
              className="w-full text-center px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              Start Your Free Trial
              <ArrowRight className="w-4 h-4 inline-block ml-2" />
            </button>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Secure checkout • Cancel anytime
            </p>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Learn clinical judgment the way the NCLEX tests it — one step at a time.
            </p>
          </div>

          {/* Semester Plan - Most Popular */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-400 rounded-2xl p-4 sm:p-6 shadow-xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-semibold shadow-lg">
                Most Popular
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 mt-2">Semester Access</h3>
            <div className="mb-1">
              <span className="text-4xl font-bold text-slate-900">$89</span>
            </div>
            <p className="text-xs text-slate-600 mb-1">One-Time Payment • 4 Months</p>
            <p className="text-sm text-indigo-700 mb-4 font-semibold">
              Save $11 vs monthly
            </p>
            <p className="text-sm text-slate-700 mb-4 font-medium">
              Designed for a single term or NCLEX prep cycle.
            </p>
            <ul className="space-y-2.5 mb-6 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>4 full months of access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>No contracts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>No surprise renewals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>7-day free trial included</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => startStripeCheckout('semester')}
              className="w-full text-center px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              Get Semester Access
              <ArrowRight className="w-4 h-4 inline-block ml-2" />
            </button>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Secure checkout • Cancel anytime
            </p>
            <p className="text-xs text-slate-500 mt-2 text-center">
              One affordable pass for your entire semester.
            </p>
          </div>

          {/* Annual Plan - Best Value */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-400 rounded-2xl p-4 sm:p-6 shadow-xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-semibold shadow-lg">
                Best Value
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 mt-2">Annual Access</h3>
            <div className="mb-1">
              <span className="text-4xl font-bold text-slate-900">$199</span>
              <span className="text-lg text-slate-600"> / year</span>
            </div>
            <p className="text-sm text-indigo-700 mb-4 font-semibold">
              Save 34% vs monthly
            </p>
            <p className="text-sm text-slate-700 mb-4 font-medium">
              For students committed to mastery and peace of mind.
            </p>
            <ul className="space-y-2.5 mb-6 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>12 months of unlimited access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>Best overall savings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>Renews annually (reminders sent)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>7-day free trial included</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => startStripeCheckout('annual')}
              className="w-full text-center px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              Save With Annual Access
              <ArrowRight className="w-4 h-4 inline-block ml-2" />
            </button>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Secure checkout • Cancel anytime
            </p>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Train your clinical judgment all year — and walk into the NCLEX confident.
            </p>
          </div>

        </div>

        {/* Micro-copy */}
        <div className="text-center space-y-2 mb-12">
          <p className="text-xs text-slate-500">All prices in USD</p>
          <p className="text-xs text-slate-500">Student-first pricing — no hidden fees</p>
        </div>

        {/* Trust + Clarity Section */}
        <div className="bg-slate-50 rounded-2xl p-8 md:p-12 mb-12 border border-slate-200">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Simple. Honest. Student-Friendly.
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* 7-Day Free Trial */}
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2">7-Day Free Trial — No Risk</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Try ForgeNursing free for 7 days. Explore every feature. If it's not right for you, cancel before the trial ends and you won't be charged. No pressure. No hassle.
              </p>
            </div>

            {/* Cancel Anytime */}
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Cancel Anytime</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                You're always in control. If you're on a monthly or annual plan, you can cancel anytime in one click from your account settings. Your access continues until the end of the billing period.
              </p>
            </div>

            {/* 7-Day Refund Policy */}
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2">7-Day Refund Policy</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                If you purchase a paid plan and decide ForgeNursing isn't the right fit, just contact us within 7 days of your first payment and we'll issue a full refund — no hoops, no guilt trips, no stress.
              </p>
              <p className="text-xs text-slate-500 mt-2 italic">
                (Refunds don't apply after 7 days or to renewed billing cycles — standard practice.)
              </p>
            </div>
          </div>
        </div>

        {/* Reassurance Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 md:p-12 border border-indigo-200">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Built for Future Nurses — Not Big Tech
            </h3>
            <p className="text-lg text-slate-700 mb-6 leading-relaxed">
              ForgeNursing doesn't replace your studying.<br />
              It guides your thinking, helps you recognize patterns, and builds the confidence you need to make safe clinical decisions.
            </p>
            <p className="text-xl md:text-2xl font-semibold text-indigo-700">
              So when the NCLEX challenges you with complex patient scenarios…
            </p>
            <p className="text-2xl md:text-3xl font-bold text-indigo-700 mt-2">
              you'll already know how to think through them.
            </p>
          </div>
        </div>
      </section>

      {/* Final Closing CTA */}
      <ClosingCTA />
    </div>
  )
}
