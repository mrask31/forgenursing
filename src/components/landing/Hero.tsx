'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare, BookOpen, GraduationCap, TrendingUp, Award } from 'lucide-react'

interface HeroProps {
  user: any
}

export default function Hero({ user }: HeroProps) {
  return (
    <>
      {/* Trust Bar - Statistics */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <GraduationCap className="w-5 h-5 opacity-90" />
              <div className="text-lg font-semibold">Your Materials</div>
              <div className="text-xs opacity-90">Not Generic Content</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Award className="w-5 h-5 opacity-90" />
              <div className="text-lg font-semibold">Step-by-Step</div>
              <div className="text-xs opacity-90">Clinical Reasoning</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <TrendingUp className="w-5 h-5 opacity-90" />
              <div className="text-lg font-semibold">Free Preview</div>
              <div className="text-xs opacity-90">No Credit Card</div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16 md:pt-20 md:pb-24 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Text Content - Order first on mobile */}
          <div className="order-2 lg:order-1">
            {/* Tagline - Ultra clear what it is */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
              <MessageSquare className="w-4 h-4" />
              AI Tutor for NCLEX Prep
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-4 sm:mb-6 leading-tight">
              Pass NCLEX the First Time with Clinical Reasoning — Not Memorization
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-slate-700 mb-6 sm:mb-8 leading-relaxed font-medium">
              The only AI tutor that uses <strong className="text-indigo-600">your actual lecture notes and textbooks</strong> to teach you how to think like a nurse.
            </p>
            
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {user ? (
                <Link
                  href="/tutor"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white rounded-xl text-base sm:text-lg font-semibold hover:bg-indigo-700 transition-all shadow-xl hover:shadow-2xl"
                >
                  Go to Tutor
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white rounded-xl text-base sm:text-lg font-semibold hover:bg-indigo-700 transition-all shadow-xl hover:shadow-2xl"
                  >
                    Start Free Preview
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Link>
                  <p className="text-sm text-slate-600 text-center sm:text-left">
                    Takes ~30 seconds to get started
                  </p>
                </>
              )}
            </div>
            
            {/* Key Differentiators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">Your Materials</div>
                  <div className="text-xs text-slate-600">Uses your notes & textbooks</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">Step-by-Step</div>
                  <div className="text-xs text-slate-600">Guides reasoning, not answers</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">NCLEX Ready</div>
                  <div className="text-xs text-slate-600">Builds exam thinking</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Visual - Enhanced Chat Interface Preview - Order first on mobile */}
          <div className="w-full max-w-[640px] mx-auto lg:mx-0 order-1 lg:order-2">
            <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
              {/* Browser Chrome Bar */}
              <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-slate-400 border border-slate-200">
                  clinical-studio.forgenursing.com
                </div>
              </div>
              
              {/* Chat Interface Preview */}
              <div className="bg-slate-50 p-4 sm:p-6 space-y-4 min-h-[350px] sm:min-h-[450px] relative">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] shadow-sm">
                    <p className="text-sm font-medium">How do I prioritize care for a patient with heart failure?</p>
                  </div>
                </div>
                
                {/* Assistant Response */}
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] shadow-sm">
                    <p className="text-sm text-slate-700 leading-relaxed mb-3 font-medium">
                      Great question! Let's think through this step-by-step:
                    </p>
                    <div className="mt-3 space-y-2.5 text-xs text-slate-600">
                      <div className="flex items-start gap-2 bg-indigo-50 p-2 rounded-lg">
                        <span className="font-bold text-indigo-600 text-sm">1.</span>
                        <div>
                          <strong className="text-slate-900">Assess:</strong> Airway, breathing, circulation — check O2 sat, lung sounds, peripheral edema
                        </div>
                      </div>
                      <div className="flex items-start gap-2 bg-indigo-50 p-2 rounded-lg">
                        <span className="font-bold text-indigo-600 text-sm">2.</span>
                        <div>
                          <strong className="text-slate-900">Prioritize:</strong> Respiratory distress = immediate intervention (ABCs first)
                        </div>
                      </div>
                      <div className="flex items-start gap-2 bg-indigo-50 p-2 rounded-lg">
                        <span className="font-bold text-indigo-600 text-sm">3.</span>
                        <div>
                          <strong className="text-slate-900">Intervene:</strong> Position upright, O2, diuretics, monitor fluid balance
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs text-indigo-600 font-medium">
                        💡 This is how NCLEX wants you to think — priorities first, then actions
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Input Bar - Positioned at bottom */}
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="bg-white border-2 border-indigo-300 rounded-full px-4 py-3 flex items-center gap-3 shadow-lg">
                    <input 
                      type="text" 
                      placeholder="Ask a clinical question..." 
                      className="flex-1 text-sm outline-none text-slate-700 bg-transparent"
                      disabled
                    />
                    <button className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
