import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

type Example = {
  scenario: string
  temptingAnswer: string
  betterMove: string
  why: string
}

type Section = {
  eyebrow?: string
  title: string
  body: string[]
  bullets?: string[]
  example?: Example
}

type RelatedLink = {
  href: string
  label: string
  description: string
}

type SeoHelpPageProps = {
  eyebrow: string
  title: string
  subtitle: string
  sections: Section[]
  relatedLinks?: RelatedLink[]
  primaryCtaHref?: string
}

const defaultRelatedLinks: RelatedLink[] = [
  {
    href: '/why-do-i-get-nclex-questions-down-to-two-answers',
    label: 'Why you get NCLEX questions down to two answers',
    description: 'Learn why two answers can both feel right and how to separate the safest option from the tempting one.',
  },
  {
    href: '/nclex-answer-traps',
    label: 'NCLEX Answer Traps',
    description: 'See the common reasoning patterns that can cost nursing students points on NCLEX-style questions.',
  },
  {
    href: '/nclex-priority-vs-assessment',
    label: 'Priority vs assessment questions',
    description: 'Understand when to assess first and when the question is asking for immediate priority action.',
  },
]

export default function SeoHelpPage({
  eyebrow,
  title,
  subtitle,
  sections,
  relatedLinks = defaultRelatedLinks,
  primaryCtaHref = '/answer-trap-check?ref=seo_help',
}: SeoHelpPageProps) {
  return (
    <main className="bg-[#F7F9FB] text-[#0B2545]">
      <section className="bg-white border-b border-[#DDE5EE]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">
            {eyebrow}
          </p>
          <h1 className="mb-5 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="max-w-3xl text-base leading-8 text-[#1E2D3D]/75 sm:text-lg">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0a7d88]"
            >
              Find My Answer Trap
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/nclex-practice"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0B2545]/20 px-6 py-3 text-sm font-bold text-[#0B2545] transition-colors hover:border-[#0D8F9C] hover:text-[#0D8F9C]"
            >
              Back to NCLEX practice
            </Link>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="space-y-8">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-[#DDE5EE] bg-white p-5 shadow-sm sm:p-7"
            >
              {section.eyebrow ? (
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">
                  {section.eyebrow}
                </p>
              ) : null}
              <h2 className="mb-4 text-2xl font-bold leading-tight text-[#0B2545]">
                {section.title}
              </h2>
              <div className="space-y-4 text-base leading-8 text-[#1E2D3D]/75">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              {section.bullets ? (
                <ul className="mt-5 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm leading-6 text-[#1E2D3D]/75">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0D8F9C]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {section.example ? (
                <div className="mt-6 rounded-2xl border border-[#0D8F9C]/25 bg-[#E0F4F6]/45 p-4 sm:p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">
                    NCLEX-style example
                  </p>
                  <p className="mb-4 text-sm leading-7 text-[#0B2545]">
                    {section.example.scenario}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-red-100 bg-white p-4">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-red-700">
                        Tempting answer
                      </p>
                      <p className="text-sm leading-6 text-[#1E2D3D]/75">
                        {section.example.temptingAnswer}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#0D8F9C]/30 bg-white p-4">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#0D8F9C]">
                        Better move
                      </p>
                      <p className="text-sm leading-6 text-[#1E2D3D]/75">
                        {section.example.betterMove}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#1E2D3D]/75">
                    {section.example.why}
                  </p>
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-2xl bg-[#0B2545] p-6 text-white sm:p-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/55">
            Free check
          </p>
          <h2 className="mb-3 text-2xl font-bold">Find the Answer Trap behind your misses.</h2>
          <p className="mb-6 max-w-2xl text-sm leading-7 text-white/80">
            Take three NCLEX-style questions and get a first signal for the reasoning pattern that may be costing you points. No account required to start.
          </p>
          <Link
            href={primaryCtaHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0a7d88]"
          >
            Find My Answer Trap
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-5 text-xs leading-6 text-white/55">
            ForgeNursing is a study tool. These pages and the Answer Trap Check do not predict NCLEX outcomes or guarantee exam readiness.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-[#0B2545]">Related NCLEX help pages</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-[#DDE5EE] bg-white p-4 shadow-sm transition-colors hover:border-[#0D8F9C]/50"
              >
                <h3 className="mb-2 text-sm font-bold text-[#0B2545]">{link.label}</h3>
                <p className="text-sm leading-6 text-[#1E2D3D]/65">{link.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  )
}
