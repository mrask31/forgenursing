'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ChevronDown, HelpCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'What is ForgeNursing now?',
    answer: 'ForgeNursing is an NCLEX retake recovery tool. It helps retakers identify the mistake patterns behind missed answers, then turns those patterns into a focused retake plan.',
  },
  {
    question: 'Who is ForgeNursing for?',
    answer: 'ForgeNursing is built for students who failed NCLEX, students preparing for a retake, and students whose scores are stuck because they keep missing the same kinds of questions without knowing why.',
  },
  {
    question: 'Is ForgeNursing another NCLEX question bank?',
    answer: 'No. ForgeNursing is not trying to replace large question banks. It uses diagnostic question sets and missed-answer analysis to help you understand why you are missing questions before your next attempt.',
  },
  {
    question: 'What is the Retake Recovery Check?',
    answer: 'The Retake Recovery Check is a free starting assessment. It asks about your failed attempt, study habits, retake timeline, and the question types that keep hurting you, then gives a starting snapshot of likely mistake patterns.',
  },
  {
    question: 'What is an Answer Autopsy?',
    answer: 'An Answer Autopsy explains why a wrong answer was tempting, what cue may have been missed, what reasoning pattern caused the mistake, and how to approach a similar question next time.',
  },
  {
    question: 'What mistake patterns does ForgeNursing track?',
    answer: 'ForgeNursing focuses on patterns like priority vs. true answer, assessment vs. intervention, SATA overselecting, delegation and scope, safety and first action, second-guessing, content gaps, and passive rationale review.',
  },
  {
    question: 'How does ForgeNursing help after I already failed?',
    answer: 'After a failed attempt, many students study harder without changing the actual pattern behind their misses. ForgeNursing helps you see whether the issue is content, priority, SATA, delegation, first-action thinking, second-guessing, or rationale review habits.',
  },
  {
    question: 'Can ForgeNursing guarantee that I pass NCLEX next time?',
    answer: 'No. No study tool can guarantee an NCLEX result. ForgeNursing is an educational study aid that helps you build a clearer recovery plan based on missed-answer patterns.',
  },
  {
    question: 'Can I use ForgeNursing with UWorld, Archer, ATI, HESI, Bootcamp, or Simple Nursing?',
    answer: 'Yes. Keep using your main prep resource. ForgeNursing is the recovery layer that helps diagnose the patterns behind missed answers and organize what to fix next.',
  },
  {
    question: 'Should I paste full questions from UWorld, ATI, Archer, HESI, or other tools?',
    answer: 'No. To respect third-party copyrights, do not paste full questions or rationales from other platforms. If you use an outside missed question, summarize the situation and rationale in your own words.',
  },
  {
    question: 'How much does ForgeNursing cost?',
    answer: 'ForgeNursing is being repositioned around a 90-Day Retake Recovery Pass for $19.99. The pass is designed for one focused retake preparation window instead of an open-ended monthly subscription.',
  },
  {
    question: 'What is included in the 90-Day Retake Recovery Pass?',
    answer: 'The pass includes the Retake Recovery Check, diagnostic question sets, Answer Autopsies, a Mistake Pattern Map, 7-day and 14-day Fix Plans, and Weekly Retake Readiness Reports.',
  },
  {
    question: 'Is this medical advice?',
    answer: 'No. ForgeNursing is an educational study aid for exam preparation and clinical judgment practice. It is not medical advice and should not be used for patient care decisions.',
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }

    const existing = document.getElementById('faq-schema')
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'faq-schema'
    script.text = JSON.stringify(faqSchema)
    document.head.appendChild(script)

    return () => {
      document.getElementById('faq-schema')?.remove()
    }
  }, [])

  return (
    <main className="min-h-screen bg-white text-[#0B2545]">
      <section className="bg-gradient-to-br from-[#E0F4F6] via-white to-[#F7F9FB] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0D8F9C] hover:text-[#0a7d88] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="mt-8 flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#0D8F9C] rounded-xl shadow-lg shadow-[#0D8F9C]/20">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">FAQ</p>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B2545]">
            Questions about NCLEX Retake Recovery
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#1E2D3D]/70">
            Clear answers about what ForgeNursing is, what it is not, and how the 90-day retake recovery pass works.
          </p>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className="bg-white border border-[#DDE5EE] rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left hover:bg-[#F7F9FB] transition-colors"
                >
                  <h2 className="text-base sm:text-lg font-bold text-[#0B2545] flex-1">
                    {faq.question}
                  </h2>
                  <ChevronDown
                    className={`w-5 h-5 text-[#0D8F9C] flex-shrink-0 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                    <p className="text-[#1E2D3D]/70 leading-7">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center p-8 bg-[#0B2545] rounded-[2rem] text-white">
            <h2 className="font-display text-3xl font-bold mb-3">
              Start with the free recovery check.
            </h2>
            <p className="text-white/75 mb-6 leading-7">
              You do not have to pay before you see whether the new ForgeNursing direction makes sense for your retake plan.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/retake-recovery-check"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#0B2545] rounded-xl font-bold hover:bg-white/90 transition-all duration-200"
              >
                Start Free Check
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 border border-white/25 text-white rounded-xl font-bold hover:bg-white/10 transition-all duration-200"
              >
                View $19.99 Pass
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
