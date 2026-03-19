export default function HowItClicks() {
  return (
    <section id="how-forge-thinks" className="bg-white py-14 sm:py-18 md:py-20" aria-labelledby="how-forge-thinks-heading">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 id="how-forge-thinks-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3 sm:mb-4">
            How Forge teaches clinical reasoning
          </h2>
          <p className="text-base sm:text-lg text-[#1E2D3D]/70 max-w-2xl mx-auto">
            Not steps — a real conversation. Forge never hands you the answer. Forge teaches you to find it.
          </p>
        </div>

        {/* Conversation flow */}
        <div className="bg-[#F7F9FB] border border-[#DDE5EE] rounded-2xl overflow-hidden shadow-lg shadow-[#0B2545]/5">

          {/* Tutor chrome */}
          <div className="bg-[#0B2545] px-5 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0B2545] to-[#0D8F9C] border border-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">Fx</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Forge</div>
              <div className="text-[10px] text-[#0BBCD4]">Clinical Preceptor · NP</div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Student question */}
            <div className="flex justify-end">
              <div className="bg-[#0B2545] text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] shadow-sm">
                <p className="text-sm font-medium">What are the priority assessments for a patient with heart failure?</p>
              </div>
            </div>

            {/* Forge response */}
            <div className="flex justify-start">
              <div className="bg-white border border-[#DDE5EE] rounded-2xl rounded-tl-sm px-5 py-4 max-w-[100%] shadow-sm space-y-3 w-full">

                {/* ORIENT */}
                <div className="bg-[#E0F4F6] rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-widest">ORIENT</span>
                    <span className="text-[10px] text-[#0D8F9C]/70">· Building foundational understanding</span>
                  </div>
                  <p className="text-sm text-[#1E2D3D] leading-relaxed">
                    Heart failure means the heart can't pump effectively. Blood backs up — into the lungs (left-sided) or the body (right-sided). Before we prioritize, we need to know which direction the failure is going.
                  </p>
                </div>

                {/* THE MAP */}
                <div className="bg-[#0B2545]/5 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-[#0B2545] uppercase tracking-widest">THE MAP</span>
                    <span className="text-[10px] text-[#0B2545]/50">· Priority ladder</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { num: '1', label: 'Respiratory status', detail: 'O2 sat, lung sounds, RR, work of breathing' },
                      { num: '2', label: 'Circulatory status', detail: 'BP, HR, skin perfusion, cap refill' },
                      { num: '3', label: 'Fluid balance', detail: 'Edema, I&O, daily weight, JVD' },
                      { num: '4', label: 'Mental status', detail: 'Confusion = decreased cerebral perfusion' },
                    ].map((item) => (
                      <div key={item.num} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#0B2545] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{item.num}</span>
                        <div>
                          <span className="text-xs font-bold text-[#0B2545]">{item.label}</span>
                          <span className="text-xs text-[#1E2D3D]/70"> — {item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* REASONING */}
                <div className="bg-white border border-[#DDE5EE] rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-[#0B2545] uppercase tracking-widest">REASONING</span>
                    <span className="text-[10px] text-[#0B2545]/50">· Socratic guidance</span>
                  </div>
                  <p className="text-sm text-[#1E2D3D] leading-relaxed">
                    Before I give you the full assessment checklist — what tells you this patient is in distress <em>right now</em>? Which system is most threatened when fluid overloads the pulmonary circulation?
                  </p>
                </div>

                {/* TRAP */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">TRAP</span>
                    <span className="text-[10px] text-amber-600/70">· Common NCLEX mistake</span>
                  </div>
                  <p className="text-sm text-[#1E2D3D] leading-relaxed">
                    Students often jump straight to administering diuretics. NCLEX will test whether you assess respiratory status <strong>before</strong> any intervention. Airway always comes first.
                  </p>
                </div>

                {/* CHECK */}
                <div className="bg-[#0D8F9C]/10 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-widest">CHECK</span>
                    <span className="text-[10px] text-[#0D8F9C]/70">· Test your understanding</span>
                  </div>
                  <p className="text-sm text-[#1E2D3D] leading-relaxed">
                    Which specific vital sign finding would prompt you to call a rapid response immediately for this patient?
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Caption */}
        <p className="text-center text-sm text-[#1E2D3D]/60 mt-6 italic max-w-2xl mx-auto">
          "Forge doesn't give you the answer. Forge teaches you to find it — the way a real preceptor does."
        </p>
      </div>
    </section>
  )
}
