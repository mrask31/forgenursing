import UploadMaterialsMockup from './UploadMaterialsMockup'
import ChatInterfaceMockup from './ChatInterfaceMockup'
import LibraryMockup from './LibraryMockup'

export default function HowItClicks() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 bg-white">
      <div className="text-center mb-8 sm:mb-12 md:mb-16">
        <p className="text-sm sm:text-base text-slate-600 mb-2">Here's how ForgeNursing works</p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
          Get Everything You Need to Pass the First Time
        </h2>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-4">
          Unlike generic question banks, ForgeNursing learns your curriculum and teaches you how to think
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
        {/* Step 1 */}
        <div className="text-center">
          <div className="mb-6">
            <div className="w-full max-w-[400px] mx-auto bg-white border-2 border-indigo-200 rounded-xl shadow-lg overflow-hidden">
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
          <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full text-lg font-bold mb-4 shadow-lg">
            1
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            Upload Your Materials
          </h3>
          <p className="text-slate-600 leading-relaxed">
            Upload lecture notes, slides, and textbooks. The AI learns <strong>your curriculum</strong> — not a generic one.
          </p>
        </div>

        {/* Step 2 */}
        <div className="text-center">
          <div className="mb-6">
            <div className="w-full max-w-[400px] mx-auto bg-white border-2 border-indigo-200 rounded-xl shadow-lg overflow-hidden">
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
          <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full text-lg font-bold mb-4 shadow-lg">
            2
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            Get Step-by-Step Reasoning
          </h3>
          <p className="text-slate-600 leading-relaxed">
            Ask anything. The tutor guides you through priorities, risks, and next steps — <strong>exactly how NCLEX expects you to think</strong>.
          </p>
        </div>

        {/* Step 3 */}
        <div className="text-center">
          <div className="mb-6">
            <div className="w-full max-w-[400px] mx-auto bg-white border-2 border-indigo-200 rounded-xl shadow-lg overflow-hidden">
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
          <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full text-lg font-bold mb-4 shadow-lg">
            3
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            Build Your Knowledge Library
          </h3>
          <p className="text-slate-600 leading-relaxed">
            Save key explanations into your personal study library. Review before exams — <strong>your learning stays organized</strong>.
          </p>
        </div>
      </div>
    </section>
  )
}
