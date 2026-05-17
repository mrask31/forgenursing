import { BookOpen, Brain, Upload, FileText, RotateCcw } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Miss → Map → Fix → Retest',
    body: 'ForgeNursing is built around the moment you get a question wrong. It helps map the mistake type, fix the reasoning, and practice that weakness again.',
  },
  {
    icon: BookOpen,
    title: 'See the thinking error',
    body: 'Not just “right” or “wrong.” Forge shows whether you missed priority, safety, assessment, delegation, medication, knowledge, or therapeutic communication.',
  },
  {
    icon: RotateCcw,
    title: 'Practice the pattern again',
    body: 'The goal is not to memorize one rationale. The goal is to recognize the pattern the next time a question tries to trick you.',
  },
]

const UploadCallout = () => (
  <div className="mt-5 space-y-3">
    {/* Mock upload zone */}
    <div className="border-2 border-dashed border-[#0D8F9C]/40 rounded-xl p-4 flex flex-col items-center gap-2 bg-[#F7F9FB]">
      <div className="w-8 h-8 bg-[#E0F4F6] rounded-lg flex items-center justify-center">
        <Upload className="w-4 h-4 text-[#0D8F9C]" />
      </div>
      <p className="text-xs text-[#1E2D3D]/60 text-center">Upload your study guide, slides, or class notes</p>
    </div>
    {/* File chips */}
    <div className="space-y-1.5">
      {[
        'Med-Surg Exam 2 Study Guide.pdf',
        'Professor Kim — Pharm Notes Week 3.pdf',
      ].map((name) => (
        <div key={name} className="flex items-center gap-2 px-3 py-2 bg-[#E0F4F6] rounded-lg">
          <FileText className="w-3.5 h-3.5 text-[#0D8F9C] flex-shrink-0" />
          <span className="text-xs text-[#0B2545] font-medium truncate">{name}</span>
        </div>
      ))}
    </div>
    <p className="text-xs text-[#1E2D3D]/60 leading-relaxed">
      Start from your material, then use missed answers to find the clinical judgment gap.
    </p>
  </div>
)

export default function ThreeFeatures() {
  return (
    <section className="bg-[#F7F9FB] py-14 sm:py-18 md:py-20" aria-labelledby="introduce-forge-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 id="introduce-forge-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3">
            Forge trains the judgment behind the answer.
          </h2>
          <p className="text-lg sm:text-xl text-[#0B2545]/70 italic font-display max-w-3xl mx-auto">
            Practice from your notes. Miss one. Find the mistake type. Fix the pattern.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-start mb-12 sm:mb-16">
          {features.map((feat) => {
            const Icon = feat.icon
            return (
              <div
                key={feat.title}
                className="bg-white border border-[#DDE5EE] rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="w-12 h-12 bg-[#E0F4F6] rounded-xl flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-[#0D8F9C]" />
                </div>
                <h3 className="text-lg font-bold text-[#0B2545] mb-3">{feat.title}</h3>
                <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">{feat.body}</p>
                {feat.title === 'Miss → Map → Fix → Retest' && <UploadCallout />}
              </div>
            )
          })}
        </div>

        {/* Forge avatar display */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#0B2545] to-[#0D8F9C] flex items-center justify-center shadow-xl shadow-[#0B2545]/20">
            <span className="text-white font-bold text-3xl sm:text-4xl tracking-tight">Fx</span>
          </div>
          <div className="text-center">
            <div className="text-base font-bold text-[#0B2545]">Forge</div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0D8F9C] rounded-full mt-1">
              <span className="text-white text-xs font-semibold">Clinical Judgment Trainer</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
