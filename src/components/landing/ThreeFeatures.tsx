import { Check, Brain, Bookmark, MessageSquare, Target, Zap, TrendingUp } from 'lucide-react'

export default function ThreeFeatures() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-gradient-to-br from-white via-indigo-50/30 to-white" aria-labelledby="features-heading">
      <div className="text-center mb-8 sm:mb-12">
        <h2 id="features-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent mb-3 sm:mb-4">
          <span className="hidden sm:inline">Built for how nurses actually think</span>
          <span className="sm:hidden">How nurses think</span>
        </h2>
        <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto px-4 leading-relaxed hidden sm:block">
          ForgeNursing teaches you to think through prioritization, safety, and clinical judgment — not just memorize answers.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
        {/* Card A - Enhanced */}
        <div className="bg-white/80 backdrop-blur-sm border border-indigo-200/60 rounded-xl p-5 sm:p-6 shadow-md shadow-slate-200/50 hover:shadow-lg hover:shadow-indigo-200/30 transition-all duration-300 transform hover:scale-[1.01]">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center mb-4 shadow-sm">
            <Brain className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            <span className="hidden sm:inline">Step-by-step clinical reasoning</span>
            <span className="sm:hidden">Clinical reasoning</span>
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4 hidden sm:block">
            Learn to think through prioritization using ABCs, safety protocols, and NCLEX frameworks.
          </p>
          <ul className="space-y-2 text-sm text-slate-600 hidden sm:block">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>ABCs and safety first</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Prioritization frameworks</span>
            </li>
          </ul>
        </div>

        {/* Card B - Enhanced */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-indigo-200/60 rounded-2xl p-6 sm:p-8 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300 transform hover:scale-[1.02]">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-5 shadow-sm">
            <Bookmark className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            <span className="hidden sm:inline">Uses your course materials</span>
            <span className="sm:hidden">Your materials</span>
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4 hidden sm:block">
            Explanations come from your uploaded textbooks and notes — not generic content.
          </p>
          <ul className="space-y-2 text-sm text-slate-600 hidden sm:block">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Your textbooks & notes</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Matches your curriculum</span>
            </li>
          </ul>
        </div>

        {/* Card C - Enhanced */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-indigo-200/60 rounded-2xl p-6 sm:p-8 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300 transform hover:scale-[1.02]">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-5 shadow-sm">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            <span className="hidden sm:inline">Guides your thinking</span>
            <span className="sm:hidden">Guided thinking</span>
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4 hidden sm:block">
            Teaches you how to reason through questions — not just what the answer is.
          </p>
          <ul className="space-y-2 text-sm text-slate-600 hidden sm:block">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Explains the "why"</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Builds confidence</span>
            </li>
          </ul>
        </div>

        {/* Card D - Save What Matters */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-indigo-200/60 rounded-2xl p-6 sm:p-8 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-200/30 transition-all duration-300 transform hover:scale-[1.02]">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-5 shadow-sm">
            <Bookmark className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            <span className="hidden sm:inline">Save what matters</span>
            <span className="sm:hidden">Save insights</span>
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4 hidden sm:block">
            Bookmark key insights and review them before exams.
          </p>
          <ul className="space-y-2 text-sm text-slate-600 hidden sm:block">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Personal library</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Quick review</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Additional Feature Highlights - Enhanced */}
      <div className="bg-white/80 backdrop-blur-sm border border-indigo-200/60 rounded-xl p-6 sm:p-8 md:p-10 shadow-lg shadow-slate-200/50">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 text-center mb-5 sm:mb-6">
          <span className="hidden sm:inline">Evidence-based and NCLEX-aligned</span>
          <span className="sm:hidden">NCLEX-aligned</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Target className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2 hidden sm:block">Standard NCLEX frameworks</h4>
              <h4 className="font-bold text-slate-900 mb-2 sm:hidden">NCLEX frameworks</h4>
              <p className="text-slate-700 text-sm hidden sm:block">
                ABCs, safety protocols, prioritization
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2 hidden sm:block">Your textbooks, not generic content</h4>
              <h4 className="font-bold text-slate-900 mb-2 sm:hidden">Your textbooks</h4>
              <p className="text-slate-700 text-sm hidden sm:block">
                Explanations grounded in your materials
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2 hidden sm:block">Supports learning, doesn't replace it</h4>
              <h4 className="font-bold text-slate-900 mb-2 sm:hidden">Supports learning</h4>
              <p className="text-slate-700 text-sm hidden sm:block">
                Complements your program and study tools
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2 hidden sm:block">7-day free trial</h4>
              <h4 className="font-bold text-slate-900 mb-2 sm:hidden">Free trial</h4>
              <p className="text-slate-700 text-sm hidden sm:block">
                Cancel anytime, no questions asked
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
