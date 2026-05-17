export default function HowItClicks() {
  return (
    <section id="how-forge-thinks" className="bg-white py-14 sm:py-18 md:py-20" aria-labelledby="how-forge-thinks-heading">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 id="how-forge-thinks-heading" className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-[#0B2545] mb-3 sm:mb-4">
            Miss → Map → Fix → Retest
          </h2>
          <p className="text-base sm:text-lg text-[#1E2D3D]/70 max-w-2xl mx-auto">
            Most apps explain the answer. ForgeNursing helps you find the clinical judgment mistake that made you choose the wrong one.
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
              <div className="text-[10px] text-[#0BBCD4]">Clinical Judgment Trainer</div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Miss */}
            <div className="bg-white border border-[#DDE5EE] rounded-2xl px-5 py-4 shadow-sm space-y-3">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest">MISS</span>
                  <span className="text-[10px] text-red-700/60">· You chose the tempting answer</span>
                </div>
                <p className="text-sm text-[#1E2D3D] leading-relaxed">
                  You picked <strong>A: Give detailed information about the procedure.</strong> It sounds helpful — but the client is anxious right now.
                </p>
              </div>

              {/* Map */}
              <div className="bg-[#0B2545] rounded-xl p-3.5 text-white">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">MAP</span>
                  <span className="text-[10px] text-white/50">· Identify the mistake type</span>
                </div>
                <p className="text-sm font-bold mb-1">Mistake Type: Therapeutic communication</p>
                <p className="text-sm text-white/85 leading-relaxed">
                  The trap was educating before acknowledging fear. When emotion is the cue, the nurse first validates the client’s concern.
                </p>
              </div>

              {/* Fix */}
              <div className="bg-[#E0F4F6] border border-[#0D8F9C]/20 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-widest">FIX</span>
                  <span className="text-[10px] text-[#0D8F9C]/70">· Learn the reasoning move</span>
                </div>
                <p className="text-sm text-[#1E2D3D] leading-relaxed">
                  Better answer: <strong>“Tell me what concerns you most about the procedure.”</strong> This opens assessment of fear before teaching.
                </p>
              </div>

              {/* Retest */}
              <div className="bg-white border border-[#DDE5EE] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-[#0B2545] uppercase tracking-widest">RETEST</span>
                  <span className="text-[10px] text-[#0B2545]/50">· Practice the same weakness again</span>
                </div>
                <p className="text-sm text-[#1E2D3D] leading-relaxed">
                  Forge gives you another question targeting the same judgment pattern, so you do not just memorize one rationale — you fix the habit.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Caption */}
        <p className="text-center text-sm text-[#1E2D3D]/60 mt-6 italic max-w-2xl mx-auto">
          "The goal is not more questions. The goal is knowing why you picked the wrong answer."
        </p>
      </div>
    </section>
  )
}
