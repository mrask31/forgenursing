'use client'

import { Sparkles, CheckCircle, ArrowRight, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Step3MagicProps {
  response: string
  onComplete: () => void
}

export default function Step3Magic({ response, onComplete }: Step3MagicProps) {
  // Detect if response references uploaded materials
  const hasBinderContext = response.toLowerCase().includes('from your') ||
    response.toLowerCase().includes('your uploaded') ||
    response.toLowerCase().includes('your materials') ||
    response.toLowerCase().includes('your document')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">
          See the difference? 🎉
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          ForgeNursing just explained that concept using{' '}
          <span className="font-semibold text-indigo-600">your uploaded material</span> — not generic content.
          <br />
          This is how every explanation works.
        </p>
      </div>

      {/* Response Display */}
      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 mb-6 shadow-lg">
        {/* Grounding Indicator */}
        {hasBinderContext && (
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-indigo-100">
            <FileText className="w-4 h-4 text-teal-600" />
            <span className="text-xs text-teal-700 font-medium">
              ✅ Using your uploaded materials
            </span>
          </div>
        )}

        {/* Response Content */}
        <div className="prose prose-slate prose-sm max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="mb-3 last:mb-0 text-sm text-slate-700 leading-relaxed">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 space-y-1 mb-3">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 space-y-1 mb-3">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-sm text-slate-700">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-slate-900">{children}</strong>
              ),
              h1: ({ children }) => (
                <h1 className="text-xl font-semibold text-slate-900 mb-3 mt-4 first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold text-slate-900 mb-2 mt-4 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-semibold text-slate-900 mb-2 mt-3 first:mt-0">
                  {children}
                </h3>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-indigo-600 bg-indigo-50 text-slate-700 rounded-r pl-4 pr-4 py-3 my-3 text-sm">
                  {children}
                </blockquote>
              ),
            }}
          >
            {response}
          </ReactMarkdown>
        </div>
      </div>

      {/* Key Features Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Personalized to you
          </h3>
          <p className="text-xs text-slate-600">
            Every explanation uses your textbooks and notes
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Step-by-step reasoning
          </h3>
          <p className="text-xs text-slate-600">
            Learn how to think through prioritization
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            NCLEX-focused
          </h3>
          <p className="text-xs text-slate-600">
            Built for clinical reasoning and exam success
          </p>
        </div>
      </div>

      {/* Recommended First Step */}
      <div className="mb-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
        <h3 className="text-base font-semibold text-slate-900 mb-2">
          Recommended first step
        </h3>
        <p className="text-sm text-slate-700 mb-4">
          Most nursing students struggle with understanding why an answer is unsafe. Start here.
        </p>
        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-base font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          Go to Clinical Tutor
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-xs text-slate-500 mt-3">
          You can explore anything — this is just a great place to begin.
        </p>
      </div>
    </div>
  )
}
