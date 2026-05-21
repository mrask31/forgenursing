import { BarChart3, CheckCircle2, Lightbulb, Search } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: 'Miss a question',
    body: 'Your answer reveals a missed cue, not a personal failure.',
  },
  {
    icon: BarChart3,
    title: 'Spot the pattern',
    body: 'Forge maps the clinical judgment pattern behind the miss.',
  },
  {
    icon: Lightbulb,
    title: 'Fix the reasoning',
    body: 'Quick Why feedback shows what to notice next time.',
  },
  {
    icon: CheckCircle2,
    title: 'Retest the pattern',
    body: 'A focused drill helps turn the pattern into confidence.',
  },
]

export default function HowItClicks() {
  return (
    <section id="how-forge-thinks" className="bg-[#F7F9FB] py-14 sm:py-18 md:py-20" aria-labelledby="how-forge-thinks-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">How it works</p>
          <h2 id="how-forge-thinks-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3 sm:mb-4">
            How Forge helps you fix the pattern
          </h2>
          <p className="mx-auto max-w-2xl text-base text-[#1E2D3D]/70 sm:text-lg">
            Miss one. Find the thinking error. Fix the pattern. Then practice it again until it sticks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="relative rounded-2xl border border-[#DDE5EE] bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E0F4F6]">
                    <Icon className="h-6 w-6 text-[#0D8F9C]" />
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E0F4F6] text-sm font-bold text-[#0D8F9C]">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0B2545]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#1E2D3D]/65">{step.body}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-10 rounded-3xl border border-[#DDE5EE] bg-white p-5 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">The Forge loop</p>
              <h3 className="mt-3 font-display text-3xl text-[#0B2545]">Most apps explain the answer. Forge trains the thinking.</h3>
              <p className="mt-4 text-sm leading-relaxed text-[#1E2D3D]/70">
                A normal rationale tells you what was right. Forge shows why your answer felt tempting, maps the pattern, and gives you a short drill to build the habit.
              </p>
            </div>
            <div className="rounded-2xl bg-[#0B2545] p-5 text-white">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {['Miss', 'Map', 'Fix', 'Retest'].map((label, index) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#0BBCD4]">{index + 1}</p>
                    <p className="mt-1 text-lg font-bold text-white">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-white/70">
                Every missed question becomes signal for what Forge should train next.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
