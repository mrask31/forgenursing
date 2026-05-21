import Link from 'next/link'
import { ArrowRight, CheckCircle2, ClipboardList, HelpCircle, RefreshCcw, Target } from 'lucide-react'

const painPoints = [
  {
    icon: HelpCircle,
    text: 'I narrow it down to two answers and still pick wrong.',
  },
  {
    icon: ClipboardList,
    text: 'The rationale tells me the answer, not my mistake.',
  },
  {
    icon: RefreshCcw,
    text: 'I keep missing the same kind of question.',
  },
  {
    icon: Target,
    text: 'I need to know what to fix before test day.',
  },
]

function MapPreview() {
  return (
    <div className="rounded-3xl border border-[#DDE5EE] bg-white p-4 shadow-xl shadow-[#0B2545]/5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#0B2545]">Clinical Judgment Map</p>
          <p className="text-[11px] text-[#1E2D3D]/45">A map of how you answer</p>
        </div>
        <span className="text-[11px] font-semibold text-[#0D8F9C]">View full map →</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Next Growth Pattern</p>
          <p className="mt-2 text-lg font-bold text-[#0B2545]">Assessment-first</p>
          <p className="mt-1 text-xl font-bold text-[#0D8F9C]">Building</p>
          <p className="mt-2 text-xs text-[#1E2D3D]/60">Train when to assess before intervening.</p>
        </div>
        <div className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Strongest Pattern</p>
          <p className="mt-2 text-lg font-bold text-[#0B2545]">Medication reasoning</p>
          <p className="mt-1 text-xl font-bold text-[#0D8F9C]">Improving</p>
          <p className="mt-2 text-xs text-[#1E2D3D]/60">Medication safety cues are getting sharper.</p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-[#DDE5EE] p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Patterns to Train</p>
        {[
          ['Assessment-first', 'Building', '45%'],
          ['Priority-setting', 'Building', '38%'],
          ['Medication reasoning', 'Improving', '78%'],
        ].map(([name, label, width]) => (
          <div key={name} className="mb-3 last:mb-0">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-bold text-[#0B2545]">{name}</span>
              <span className="font-semibold text-[#0D8F9C]">{label}</span>
            </div>
            <div className="h-2 rounded-full bg-[#EEF3F7]">
              <div className="h-2 rounded-full bg-[#0D8F9C]" style={{ width }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BeliefValidation() {
  return (
    <section className="bg-[#F7F9FB] py-14 sm:py-18 md:py-20" aria-labelledby="validation-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 id="validation-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3 sm:mb-4">
            Sound familiar?
          </h2>
          <p className="mx-auto max-w-2xl text-base text-[#1E2D3D]/70 sm:text-lg">
            The problem is not always that you need more questions. Sometimes you need to know why the wrong answer felt right.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {painPoints.map(({ icon: Icon, text }) => (
            <div key={text} className="rounded-2xl border border-[#DDE5EE] bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E0F4F6]">
                <Icon className="h-6 w-6 text-[#0D8F9C]" />
              </div>
              <p className="text-sm font-bold leading-relaxed text-[#0B2545]">{text}</p>
            </div>
          ))}
        </div>

        <div id="clinical-judgment-map" className="mt-14 scroll-mt-24 grid grid-cols-1 items-center gap-8 rounded-3xl border border-[#DDE5EE] bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">Why Forge is different</p>
            <h3 className="mt-3 font-display text-3xl leading-tight text-[#0B2545] sm:text-4xl">
              Most NCLEX tools give you more questions. Forge gives you a map.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-[#1E2D3D]/70">
              Forge analyzes how you think through questions, shows what is costing you points, and creates short practice that trains the real pattern.
            </p>
            <div className="mt-6 space-y-3">
              {[
                ['Clinical Judgment Map', 'See your patterns, strengths, and next growth area.'],
                ['Recommended Next Focus', 'Forge identifies the pattern to train next.'],
                ['Confidence Builder', 'Track progress without discouraging score labels.'],
              ].map(([title, body]) => (
                <div key={title} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0D8F9C]" />
                  <div>
                    <p className="font-bold text-[#0B2545]">{title}</p>
                    <p className="text-sm text-[#1E2D3D]/65">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/signup?plan=monthly" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0D8F9C] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a7d88]">
              Start Free Practice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <MapPreview />
        </div>
      </div>
    </section>
  )
}
