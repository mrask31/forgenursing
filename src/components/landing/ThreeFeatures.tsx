import { Check, Brain, Bookmark, MessageSquare, Target, Zap, TrendingUp } from 'lucide-react'

export default function ThreeFeatures() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 bg-gradient-to-br from-white via-indigo-50/30 to-white">
      <div className="text-center mb-12 sm:mb-16 md:mb-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent mb-4 sm:mb-6">
          Built for How Nurses Actually Learn
        </h2>
        <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto px-4 font-medium leading-relaxed">
          Every feature is designed to reduce cognitive load — not add more
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
        {/* Card A - Enhanced */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-indigo-200/60 rounded-2xl p-6 sm:p-8 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300 transform hover:scale-[1.02]">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-5 shadow-sm">
            <Brain className="w-8 h-8 text-indigo-600" />
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

        {/* Card B - Enhanced */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-indigo-200/60 rounded-2xl p-6 sm:p-8 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300 transform hover:scale-[1.02]">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-5 shadow-sm">
            <Bookmark className="w-8 h-8 text-indigo-600" />
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

        {/* Card C - Enhanced */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-indigo-200/60 rounded-2xl p-6 sm:p-8 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300 transform hover:scale-[1.02]">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-5 shadow-sm">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
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

      {/* Additional Feature Highlights - Enhanced */}
      <div className="bg-white/80 backdrop-blur-sm border-2 border-indigo-200/60 rounded-2xl p-8 sm:p-10 md:p-14 shadow-xl shadow-slate-200/50">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 text-center mb-6 sm:mb-8">
          What Makes ForgeNursing Different
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Target className="w-7 h-7 text-indigo-600" />
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
