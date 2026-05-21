import { BookOpen, Brain, ClipboardList, MessageCircle, Target, Upload, Zap } from 'lucide-react'

function TargetedDrillMockup() {
  return (
    <div className="mt-5 rounded-2xl border border-[#DDE5EE] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E0F4F6]">
          <Target className="h-5 w-5 text-[#0D8F9C]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#0D8F9C]">Recommended Next Focus</p>
          <p className="mt-1 text-sm font-bold text-[#0B2545]">Assessment-first</p>
          <p className="mt-1 text-xs text-[#1E2D3D]/60">Train when to assess before intervening.</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-[#DDE5EE] p-3">
        <p className="text-sm font-bold text-[#0B2545]">3-Question Drill</p>
        <p className="text-xs text-[#1E2D3D]/55">Short, focused, and built from your map.</p>
        <div className="mt-3 rounded-lg bg-[#0D8F9C] px-3 py-2 text-center text-xs font-bold text-white">Start Drill →</div>
      </div>
    </div>
  )
}

function QuickWhyMockup() {
  return (
    <div className="mt-5 rounded-2xl border border-[#DDE5EE] bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#0D8F9C]">Quick Why</p>
      <div className="mt-3 space-y-3 text-xs leading-relaxed text-[#1E2D3D]/70">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Key cue</p>
          <p>The client shows possible swallowing difficulty.</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Why the better answer works</p>
          <p>Assessment must come before feeding interventions.</p>
        </div>
        <div className="rounded-xl bg-[#F7F9FB] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Remember this</p>
          <p className="font-semibold text-[#0B2545]">When safety risk is possible, assess first.</p>
        </div>
      </div>
    </div>
  )
}

function TutorMockup() {
  return (
    <div className="mt-5 rounded-2xl border border-[#DDE5EE] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B2545] to-[#0D8F9C] text-xs font-bold text-white">Fx</div>
        <div>
          <p className="text-xs font-bold text-[#0B2545]">Forge Tutor</p>
          <p className="text-[10px] text-[#0D8F9C]">Focused fix</p>
        </div>
      </div>
      <div className="space-y-3 text-xs leading-relaxed">
        <div className="ml-8 rounded-2xl bg-[#E0F4F6] p-3 text-[#0B2545]">
          Why is assessment-first the priority here?
        </div>
        <div className="mr-6 rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-3 text-[#1E2D3D]/75">
          Because dysphagia creates aspiration risk. Before feeding, the nurse needs to assess swallowing safety.
        </div>
        <div className="rounded-xl border border-[#DDE5EE] px-3 py-2 text-[#94A3B8]">Ask another question…</div>
      </div>
    </div>
  )
}

const featureCards = [
  {
    icon: Target,
    title: '3-Question Targeted Drills',
    body: 'Forge turns your next growth pattern into a short drill so practice feels focused instead of endless.',
    mockup: <TargetedDrillMockup />,
  },
  {
    icon: Zap,
    title: 'Quick Why Feedback',
    body: 'See the key cue, why the better answer works, why your answer was tempting, and what to remember next time.',
    mockup: <QuickWhyMockup />,
  },
  {
    icon: MessageCircle,
    title: 'Fix with Tutor',
    body: 'Turn a missed answer into a short, focused tutor session that builds understanding without another long lecture.',
    mockup: <TutorMockup />,
  },
]

const practiceModes = [
  {
    icon: Target,
    title: 'Recommended Practice',
    body: 'Forge builds your next quiz from your current training pattern.',
    highlighted: true,
  },
  {
    icon: Upload,
    title: 'Practice From My Notes',
    body: 'Create practice from study guides, slides, and class material.',
  },
  {
    icon: BookOpen,
    title: 'Choose a Topic',
    body: 'Pick Pharm, Safety, Delegation, Psychosocial, or another NCLEX area.',
  },
  {
    icon: ClipboardList,
    title: 'General NCLEX Practice',
    body: 'Build overall confidence with mixed NCLEX-style practice.',
  },
]

export default function ThreeFeatures() {
  return (
    <section className="bg-white py-14 sm:py-18 md:py-20" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">Built around the missed answer</p>
          <h2 id="features-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3">
            Miss one. Find the thinking error. Fix the pattern.
          </h2>
          <p className="mx-auto max-w-2xl text-base text-[#1E2D3D]/70 sm:text-lg">
            Forge does not just explain answers. It turns every missed question into a personalized training signal.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="rounded-3xl border border-[#DDE5EE] bg-[#F7F9FB] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E0F4F6]">
                  <Icon className="h-6 w-6 text-[#0D8F9C]" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-[#0B2545]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#1E2D3D]/70">{feature.body}</p>
                {feature.mockup}
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <h3 className="font-display text-3xl text-[#0B2545]">Practice your way</h3>
          <p className="mt-2 text-sm text-[#1E2D3D]/60">Choose the best way to study today.</p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {practiceModes.map((mode) => {
            const Icon = mode.icon
            return (
              <div
                key={mode.title}
                className={`rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  mode.highlighted ? 'border-[#0D8F9C] bg-[#E0F4F6]' : 'border-[#DDE5EE] bg-white'
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0D8F9C] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xl text-[#0D8F9C]">›</span>
                </div>
                <p className="text-sm font-bold text-[#0B2545]">{mode.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#1E2D3D]/60">{mode.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
