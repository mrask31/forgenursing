export const RETAKE_TERMS = "$29.99 one-time for 3 months. Nothing auto-renews. If you don't pass, one free three-month extension is available after the initial period, with no proof required. The trial is 7 days, with no card required."
export type RetakeEmailStep = 'welcome' | 'practice' | 'day3' | 'day5' | 'day6' | 'expired' | 'beta'
export function retakeLifecycleEmail(step: RetakeEmailStep, ends?: string): {subject:string;html:string;text:string} {
  const welcome = step === 'welcome'
  const subject = welcome ? "You're in — here's what to do first" : step === 'day6' ? 'Your ForgeNursing trial is ending soon' : step === 'expired' ? 'Your ForgeNursing trial has ended' : step === 'day5' ? 'Your retake plan: what happens next' : 'One bank question, then a clearer next step'
  const paragraphs = welcome ? [
    'Welcome to ForgeNursing. You have finished nursing school, and this next attempt deserves a plan built around what you need now. One exam result does not define you.',
    '1. Add your exam date or performance report on Home. Enter the Below, Near, or Above ratings you have; these details are optional and help choose a starting focus.',
    '2. Start your first bank practice session. Answer a few source-checked originals, read the explanations, and try a related retry after a miss.',
    '3. Return to Review to revisit missed distinctions. Suggested bank practice helps you choose a next step from your report or practice history.',
    '7 days free. No credit card.',
    ...(ends ? [`Your trial ends ${ends}.`] : []),
    'Reply anytime if something gets in your way. I read your feedback personally.',
  ] : [
    step === 'expired' ? 'Your free trial has ended. Your saved work remains, and you can choose whether to continue your NCLEX-RN retake preparation.' : step === 'day6' ? 'Your free trial is ending soon. Review your saved plan and decide whether you want to continue. There is no automatic charge.' : 'Preparing for another NCLEX-RN attempt does not require doing everything today. Start with one bank question and explain why you chose your answer.',
    'Read the explanation, try a related retry after a miss, and use Review to revisit the distinction. Practice results are not predictions of passing.',
    ...(ends ? [`Your trial ends ${ends}.`] : []),
    ...(step === 'day5' || step === 'day6' || step === 'expired' ? [RETAKE_TERMS] : step === 'beta' ? [] : ['Your 7-day trial requires no card and does not automatically charge you.']),
    'Questions about your next step? Reply here.',
  ]
  const links = welcome ? [['Add your exam date or performance report','https://forgenursing.com/entry'],['Start bank practice','https://forgenursing.com/quiz']] : [[step === 'expired' || step === 'day6' || step === 'day5' ? 'View Retake Pass' : 'Start bank practice',step === 'expired' || step === 'day6' || step === 'day5' ? 'https://forgenursing.com/pricing' : 'https://forgenursing.com/quiz']]
  const signoff = '— Michael\nFounder, ForgeNursing\nFormer Navy Hospital Corpsman, FMF'
  const escape = (s:string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  return {subject,text:[...paragraphs,...links.map(([label,url])=>`${label}: ${url}`),signoff].join('\n\n'),html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0B2545;line-height:1.7"><h1 style="color:#0D8F9C">${escape(subject)}</h1>${paragraphs.map(p=>`<p>${escape(p)}</p>`).join('')}${links.map(([label,url])=>`<p><a style="color:#087986;font-weight:bold" href="${url}">${escape(label)} →</a></p>`).join('')}<p>${signoff.replace(/\n/g,'<br>')}</p></div>`}
}
