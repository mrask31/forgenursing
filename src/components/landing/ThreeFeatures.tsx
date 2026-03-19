import { BookOpen, Mic, Brain } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Forge thinks in ADPIE',
    body: 'Every response follows the same clinical reasoning framework your professors use. Orient → Map → Reasoning → Trap → Check. You don\'t just get an answer — you get a preceptor walking you through the thought process.',
  },
  {
    icon: BookOpen,
    title: 'Forge knows your materials',
    body: 'Upload your textbooks and class notes. Forge teaches from your curriculum, not generic content. The explanations match what your program teaches and how your professors test.',
  },
  {
    icon: Mic,
    title: 'Forge speaks to you',
    body: 'Forge has a real NP voice. Toggle it on and hear your clinical preceptor explain concepts out loud while you study. Reinforce learning through listening — not just reading.',
  },
]

export default function ThreeFeatures() {
  return (
    <section className="bg-[#F7F9FB] py-14 sm:py-18 md:py-20" aria-labelledby="introduce-forge-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 id="introduce-forge-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3">
            This is Forge.
          </h2>
          <p className="text-lg sm:text-xl text-[#0B2545]/70 italic font-display">
            Your AI Nurse Practitioner preceptor. Available 24/7.
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
              <span className="text-white text-xs font-semibold">NP · Clinical Preceptor</span>
            </div>
          </div>
          <p className="text-xs text-[#1E2D3D]/50 text-center max-w-xs">
            Powered by Gemini 2.0 Flash · ADPIE clinical reasoning framework
          </p>
        </div>

      </div>
    </section>
  )
}
