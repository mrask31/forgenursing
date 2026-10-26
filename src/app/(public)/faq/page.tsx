'use client'

import Link from 'next/link'
import { ChevronDown, ArrowLeft, HelpCircle } from 'lucide-react'
import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
 {question:'Who is ForgeNursing for?',answer:'NCLEX-RN retakers building a focused plan for their next attempt. Your Candidate Performance Report helps identify where to begin.'},
 {question:'What does the Retake Pass cost?',answer:'$29.99 one-time for three months. Don’t pass, and the next three are free. Nothing auto-renews. Start with a seven-day free trial, no card required.'},
 {question:'How does the free extension work?',answer:'When your initial three months end, open Account and activate one free three-month extension. No proof of exam results and no claim process. The extension starts when activated. It can be used once per purchased pass, giving up to six months of access.'},
 {question:'Will I be charged after the trial or pass ends?',answer:'No. You must explicitly purchase a pass. A Retake Pass never auto-renews.'},
 {question:'Do you guarantee I will pass?',answer:'No. The guarantee provides one free access extension; it does not guarantee an NCLEX result. Practice results describe your work here, not validated pass probabilities.'},
 {question:'What happens after a missed question?',answer:'Review why your selected answer does not fit, then practice a related retry scored separately. Eligible bank-original misses also schedule a fresh review. Generated supplement misses do not schedule bank reviews.'},
 {question:'Is the content clinically validated?',answer:'AI-assisted, source-checked — not independently clinically validated. Check uncertain explanations against your nursing references. ForgeNursing is for learning, not patient-care decisions.'},
 {question:'Do I need my score report?',answer:'You can start without it. Adding Below, Near, or Above ratings from your Candidate Performance Report helps focus your practice plan.'},
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)



  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(faq => ({
          '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }) }} />
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Everything you need to know about ForgeNursing
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-lg font-semibold text-slate-900 flex-1">
                  {faq.question}
                </h2>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 pt-0">
                  <p className="text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions? */}
        <div className="mt-12 text-center p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/60 rounded-2xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Still have questions?
          </h2>
          <p className="text-slate-600 mb-6">
            We're here to help! Start your free trial and see how ForgeNursing can help you master NCLEX prioritization.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:scale-105 active:scale-95"
          >
            Start Your 7-Day Free Trial
          </Link>
        </div>
      </div>
    </main>
  )
}
