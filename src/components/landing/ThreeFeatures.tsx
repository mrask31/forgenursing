import { Check, Brain, Bookmark, MessageSquare, Target, Zap, TrendingUp } from 'lucide-react'

export default function ThreeFeatures() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="text-center mb-8 sm:mb-12 md:mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
          Built for How Nurses Actually Learn
        </h2>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-4">
          Every feature is designed to reduce cognitive load — not add more
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
        {/* Card A */}
        <div className="bg-white border-2 border-indigo-100 rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
            <Brain className="w-7 h-7 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            ForgeMap™ — See the Logic
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Turn complex topics into scannable clinical reasoning blocks: cause → effect → priorities → interventions → monitoring.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Visual concept maps</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Clinical reasoning flow</span>
            </li>
          </ul>
        </div>

        {/* Card B */}
        <div className="bg-white border-2 border-indigo-100 rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
            <Bookmark className="w-7 h-7 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            ForgeClips™ — Keep the Breakthroughs
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Save key explanations into a personal study library — organized, searchable, ready before exams.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Organized by topic</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Quick review before exams</span>
            </li>
          </ul>
        </div>

        {/* Card C */}
        <div className="bg-white border-2 border-indigo-100 rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            Smart Study Sessions — Clean, Focused, Calm
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Chats don't become chaos. Sessions archive gracefully while your learning stays organized.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Class-specific sessions</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Easy history access</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Additional Feature Highlights */}
      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 sm:p-8 md:p-12 shadow-xl">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 text-center mb-6 sm:mb-8">
          What Makes ForgeNursing Different
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Uses Your Actual Materials</h4>
              <p className="text-slate-700 text-sm">
                Unlike generic question banks, ForgeNursing learns from your lecture notes and textbooks. Every answer is contextualized to your curriculum.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Teaches Reasoning, Not Answers</h4>
              <p className="text-slate-700 text-sm">
                No answer dumping. We guide you through the "why" behind every decision, building the clinical judgment NCLEX tests.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Tracks Your Progress</h4>
              <p className="text-slate-700 text-sm">
                See what you've studied, what needs more work, and build consistency with your personal dashboard.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Always Available</h4>
              <p className="text-slate-700 text-sm">
                Study on your schedule. Ask questions anytime, get instant step-by-step guidance, and build understanding at your pace.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
