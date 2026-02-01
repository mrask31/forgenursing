'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, ArrowLeft, HelpCircle } from 'lucide-react'
import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'What is ForgeNursing?',
    answer: 'ForgeNursing is an AI-powered clinical reasoning tutor that helps nursing students prepare for NCLEX by turning their lecture notes and textbooks into step-by-step clinical reasoning guidance. It helps students understand prioritization, safety protocols, and clinical judgment.'
  },
  {
    question: 'How does ForgeNursing help with NCLEX prep?',
    answer: 'ForgeNursing uses your own course materials to provide step-by-step clinical reasoning guidance. It helps you think through NCLEX-style questions using frameworks like ABCs, Maslow\'s hierarchy, and safety protocols. Instead of just giving answers, it teaches you how to reason through prioritization and clinical decisions.'
  },
  {
    question: 'Do I need to upload my own materials?',
    answer: 'Yes, ForgeNursing works best when you upload your syllabus, textbooks, and lecture notes. This ensures the AI tutor aligns with your specific nursing program\'s curriculum and teaching style.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes, ForgeNursing offers a 7-day free trial. You can start using the platform immediately and cancel anytime during the trial period without being charged.'
  },
  {
    question: 'What makes ForgeNursing different from other NCLEX prep tools?',
    answer: 'ForgeNursing focuses on teaching clinical reasoning and prioritization using your own materials, rather than generic question banks. It provides step-by-step guidance that helps you understand the "why" behind clinical decisions, not just memorizing answers.'
  },
  {
    question: 'How much does ForgeNursing cost?',
    answer: 'ForgeNursing offers three plans: Monthly ($24.99/month), Semester ($89 for 4 months, ~$22.25/month), and Annual ($199/year, ~$16.58/month). All plans include a 7-day free trial with full access to all features.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. If you cancel during the 7-day free trial, you won\'t be charged. After the trial, you can cancel anytime and your access will continue until the end of your billing period.'
  },
  {
    question: 'What features are included in my subscription?',
    answer: 'All plans include: step-by-step clinical reasoning guidance, Clinical Studio (NCLEX-style simulations), strict testing mode, key concepts & evidence review, support for your uploaded textbooks, and progress insights & history.'
  },
  {
    question: 'How do I upload my course materials?',
    answer: 'After signing up, you can upload your materials through the Classes section. Simply create a class, then drag and drop your PDFs, PowerPoints, or other documents. The AI will process them and use them to provide personalized guidance.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we take data security seriously. All uploaded materials and study sessions are encrypted and stored securely. We never share your personal information or study data with third parties.'
  },
  {
    question: 'Can I use ForgeNursing on my phone or tablet?',
    answer: 'Yes, ForgeNursing is a web-based application that works on any device with a modern web browser, including phones, tablets, and computers.'
  },
  {
    question: 'Does ForgeNursing replace my NCLEX prep course?',
    answer: 'No, ForgeNursing is designed to supplement your existing NCLEX prep resources and nursing education. It helps you develop clinical reasoning skills using your own course materials, but should be used alongside your program\'s curriculum and other prep resources.'
  }
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    // Add FAQ structured data
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'faq-schema'
    script.text = JSON.stringify(faqSchema)
    document.head.appendChild(script)

    return () => {
      const existingScript = document.getElementById('faq-schema')
      if (existingScript) existingScript.remove()
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
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
