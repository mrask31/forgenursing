import UploadMaterialsMockup from './UploadMaterialsMockup'
import ChatInterfaceMockup from './ChatInterfaceMockup'
import LibraryMockup from './LibraryMockup'

export default function HowItClicks() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
      <div className="text-center mb-12 sm:mb-16 md:mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200/60 rounded-full text-sm font-semibold text-indigo-700 mb-4 shadow-sm">
          Here's how ForgeNursing works
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent mb-4 sm:mb-6">
          Get Everything You Need to Pass the First Time
        </h2>
        <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto px-4 font-medium leading-relaxed">
          Unlike generic question banks, ForgeNursing learns your curriculum and teaches you how to think
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
        {/* Step 1 */}
        <div className="text-center">
          <div className="mb-6">
            <div className="w-full max-w-[400px] mx-auto bg-white/90 backdrop-blur-sm border-2 border-indigo-200/60 rounded-xl shadow-xl shadow-indigo-500/10 overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
              <div className="h-8 bg-indigo-50 border-b border-indigo-200 flex items-center px-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                </div>
              </div>
              <div className="aspect-[4/3] bg-white relative overflow-hidden">
                <UploadMaterialsMockup />
              </div>
            </div>
          </div>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full text-xl font-bold mb-6 shadow-lg shadow-indigo-500/30">
            1
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Upload Your Materials
          </h3>
          <p className="text-slate-700 leading-relaxed font-medium">
            Upload lecture notes, slides, and textbooks. The AI learns <strong className="text-indigo-700">your curriculum</strong> — not a generic one.
          </p>
        </div>

        {/* Step 2 */}
        <div className="text-center">
          <div className="mb-6">
            <div className="w-full max-w-[400px] mx-auto bg-white/90 backdrop-blur-sm border-2 border-indigo-200/60 rounded-xl shadow-xl shadow-indigo-500/10 overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
              <div className="h-8 bg-indigo-50 border-b border-indigo-200 flex items-center px-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                </div>
              </div>
              <div className="aspect-[4/3] bg-white relative overflow-hidden">
                <ChatInterfaceMockup />
              </div>
            </div>
          </div>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full text-xl font-bold mb-6 shadow-lg shadow-indigo-500/30">
            2
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Get Step-by-Step Reasoning
          </h3>
          <p className="text-slate-700 leading-relaxed font-medium">
            Ask anything. The tutor guides you through priorities, risks, and next steps — <strong className="text-indigo-700">exactly how NCLEX expects you to think</strong>.
          </p>
        </div>

        {/* Step 3 */}
        <div className="text-center">
          <div className="mb-6">
            <div className="w-full max-w-[400px] mx-auto bg-white/90 backdrop-blur-sm border-2 border-indigo-200/60 rounded-xl shadow-xl shadow-indigo-500/10 overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
              <div className="h-8 bg-indigo-50 border-b border-indigo-200 flex items-center px-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                </div>
              </div>
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                <LibraryMockup />
              </div>
            </div>
          </div>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full text-xl font-bold mb-6 shadow-lg shadow-indigo-500/30">
            3
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Build Your Knowledge Library
          </h3>
          <p className="text-slate-700 leading-relaxed font-medium">
            Save key explanations into your personal study library. Review before exams — <strong className="text-indigo-700">your learning stays organized</strong>.
          </p>
        </div>
      </div>
    </section>
  )
}
