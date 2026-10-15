import type { StreamTextTransform, TextStreamPart, ToolSet } from 'ai'

export const EVIDENCE_RECHECK_MESSAGE = 'I could not give a sufficiently supported explanation for this question. Please check the complete question and its source with your instructor. You can share the relevant source passage so we can compare the reasoning without guessing at legal rules or exam standards.'
export const INCOMPLETE_TUTOR_MESSAGE = 'The explanation did not finish, so I have not shown a partial answer. Please try again.'

/** Narrow release safeguard for observed authority overclaims, not clinical validation. */
export function hasUnsupportedAuthorityClaim(text: string): boolean {
  const plain = text.normalize('NFKC').replace(/[*_`]/g, '').replace(/\s+/g, ' ')
  return [
    /\b(?:every|all|any|no)\s+(?:state(?:s)?|jurisdiction(?:s)?)\b/i,
    /\b(?:all|every|no)\s+nurse practice acts?\b/i,
    /\b(?:ncsbn|nclex(?: next generation)?)\b[^.!?]{0,160}\b(?:requires?|mandates?|prohibits?|designed|standards?|principles|testing logic)\b/i,
    /\b(?:according to|consistent with|mandated by|required by)\s+(?:the\s+)?(?:ncsbn|nclex)\b/i,
  ].some(pattern => pattern.test(plain))
}

/** Buffer the answer so a late unsupported claim cannot leak through early deltas. */
export function evidenceOutputGuard<TOOLS extends ToolSet>(): StreamTextTransform<TOOLS> {
  return () => {
    let parts: TextStreamPart<TOOLS>[] = []
    let failed = false
    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(part, controller) {
        if (failed) return
        if (part.type === 'error') {
          parts = []
          failed = true
          controller.enqueue(part)
          return
        }
        parts.push(part)
        if (part.type !== 'finish') return

        const text = parts.filter(p => p.type === 'text-delta').map(p => p.textDelta).join('')
        const replacement = part.finishReason !== 'stop'
          ? INCOMPLETE_TUTOR_MESSAGE
          : hasUnsupportedAuthorityClaim(text) ? EVIDENCE_RECHECK_MESSAGE : null
        let emitted = false
        for (const pending of parts) {
          if (replacement && pending.type === 'text-delta') {
            if (!emitted) controller.enqueue({ type: 'text-delta', textDelta: replacement })
            emitted = true
          } else {
            controller.enqueue(pending)
          }
        }
        parts = []
      },
      flush(controller) {
        // An interrupted stream is never a verified complete explanation.
        if (!failed && parts.length) {
          controller.enqueue({ type: 'text-delta', textDelta: INCOMPLETE_TUTOR_MESSAGE })
        }
      },
    })
  }
}
