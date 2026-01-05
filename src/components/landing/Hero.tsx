'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare, BookOpen, GraduationCap, TrendingUp, Award } from 'lucide-react'

interface HeroProps {
  user: any
}

export default function Hero({ user }: HeroProps) {
  return (
    <>
      {/* Trust Bar - Statistics - Enhanced */}
      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white py-5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="text-lg font-bold">Your Materials</div>
              <div className="text-xs opacity-95 font-medium">Not Generic Content</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Award className="w-6 h-6" />
              </div>
              <div className="text-lg font-bold">Step-by-Step</div>
              <div className="text-xs opacity-95 font-medium">Clinical Reasoning</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-lg font-bold">Free Preview</div>
              <div className="text-xs opacity-95 font-medium">No Credit Card</div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section - Enhanced */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-20 md:pt-24 md:pb-32 bg-gradient-to-br from-white via-indigo-50/30 to-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Text Content - Order first on mobile */}
          <div className="order-2 lg:order-1">
            {/* Tagline - Ultra clear what it is - Enhanced */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200/60 text-indigo-700 rounded-full text-sm font-semibold mb-6 shadow-sm">
              <div className="p-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
              AI Tutor for NCLEX Prep
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent tracking-tight mb-6 sm:mb-8 leading-tight">
              Pass NCLEX the First Time with Clinical Reasoning — Not Memorization
            </h1>
            
            <p className="text-xl sm:text-2xl md:text-3xl text-slate-700 mb-8 sm:mb-10 leading-relaxed font-semibold">
              The only AI tutor that uses <strong className="text-indigo-700 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">your actual lecture notes and textbooks</strong> to teach you how to think like a nurse.
            </p>
            
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {user ? (
                <Link
                  href="/tutor"
                  className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-base sm:text-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transform hover:scale-105 active:scale-95"
                >
                  Go to Tutor
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-base sm:text-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transform hover:scale-105 active:scale-95"
                  >
                    Start Free Preview
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Link>
                  <p className="text-sm text-slate-600 text-center sm:text-left font-medium">
                    Takes ~30 seconds to get started
                  </p>
                </>
              )}
            </div>
            
            {/* Key Differentiators - Enhanced */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-8 border-t-2 border-slate-200/60">
              <div className="flex items-start gap-3.5 p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200">
                <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl shadow-sm">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm mb-1">Your Materials</div>
                  <div className="text-xs text-slate-600 font-medium">Uses your notes & textbooks</div>
                </div>
              </div>
              <div className="flex items-start gap-3.5 p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200">
                <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl shadow-sm">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm mb-1">Step-by-Step</div>
                  <div className="text-xs text-slate-600 font-medium">Guides reasoning, not answers</div>
                </div>
              </div>
              <div className="flex items-start gap-3.5 p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200">
                <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl shadow-sm">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm mb-1">NCLEX Ready</div>
                  <div className="text-xs text-slate-600 font-medium">Builds exam thinking</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Visual - Enhanced Chat Interface Preview - Order first on mobile */}
          <div className="w-full max-w-[640px] mx-auto lg:mx-0 order-1 lg:order-2">
            <div className="bg-white/90 backdrop-blur-sm border-2 border-slate-200/60 rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
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
