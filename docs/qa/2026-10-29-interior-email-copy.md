# October 29 interior fixes — email comparison

## Welcome before (complete production template)

```ts

function generateWelcomeEmailHTML(trialEndDate: string): string {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; font-size: 16px; line-height: 1.6;">

  <p>Welcome to ForgeNursing. Whatever brought you here — nursing school, NCLEX prep, or just looking for a smarter way to study — you now have a tool that works differently than anything else you've tried.</p>

  <p>Here's the problem with most nursing study tools: they test what you know. ForgeNursing teaches you how to think like a nurse. That's a different thing entirely — and it's the thing NCLEX actually measures.</p>

  <p style="font-weight: bold;">Here's what makes us different:</p>

  <p>When you bring a question or a patient scenario to Forge, it doesn't give you the answer. It thinks through it with you — asking what you notice first, what matters most, what you'd do and why. It reasons like a clinical preceptor, not a textbook.</p>

  <p>And if you're still in school, you don't have to wait for NCLEX prep to matter. Upload your class materials — your syllabus, lecture notes, study guides — and Forge will teach you that content in the same clinical reasoning style. Better understanding now. NCLEX readiness built in automatically.</p>

  <p style="font-weight: bold;">Your first step:</p>

  <p>Log in and try one of these right now:</p>

  <p style="background: #f0f9f8; border-left: 4px solid #00B4A6; padding: 12px 16px; font-weight: bold;">
    → "Walk me through an NCLEX-style priority question"
  </p>

  <p>or if you're currently in a nursing course:</p>

  <p style="background: #f0f9f8; border-left: 4px solid #00B4A6; padding: 12px 16px; font-style: italic;">
    → "I'm studying [topic]. Teach me this the way NCLEX would test it."
  </p>

  <p>You have 7 days free. No credit card. No obligation. Just try it once and see if it clicks.</p>

  <p>Reply to this email anytime — I read every one personally.</p>

  <p>
    — Michael<br>
    Founder, ForgeNursing<br>
    Former Navy Hospital Corpsman, FMF
  </p>

  <a href="https://forgenursing.com" style="background: #00B4A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
    Log In and Get Started →
  </a>

</div>`
}

```

## Welcome after

Welcome to ForgeNursing. You have finished nursing school, and this next attempt deserves a plan built around what you need now. One exam result does not define you.

1. Add your exam date or performance report on Home. Enter the Below, Near, or Above ratings you have; these details are optional and help choose a starting focus.

2. Start your first bank practice session. Answer a few source-checked originals, read the explanations, and try a related retry after a miss.

3. Return to Review to revisit missed distinctions. Suggested bank practice helps you choose a next step from your report or practice history.

7 days free. No credit card.

Your trial ends your saved trial end date.

Reply anytime if something gets in your way. I read your feedback personally.

Add your exam date or performance report: https://forgenursing.com/entry

Start bank practice: https://forgenursing.com/quiz

— Michael
Founder, ForgeNursing
Former Navy Hospital Corpsman, FMF

## Lifecycle verdicts and delivery boundaries

| Message | Verdict | Path |
|---|---|---|
| Welcome | Rewritten | Hourly welcome queue; direct welcome, test welcome and alternate onboarding generators now share the retake template |
| Day 3 | Rewritten | Hourly trial-engagement sender; alternate onboarding/sequence generator aligned |
| Day 5 | Rewritten | Hourly trial-engagement sender; exact Retake Pass terms retained |
| Day 6 | Rewritten | Daily trial-expiration sender; alternate generators aligned |
| Day 7 / trial expiry | Rewritten (same expiry message, not two new sends) | Existing daily expiration eligibility and sent flags retained |
| Pass purchase | Not sent by a custom app lifecycle sender | Stripe checkout enables invoice creation; provider receipt settings/content not changed |
| Free extension | Not sent by a custom app lifecycle sender | Existing extension endpoint returns the saved access state; no new email introduced |
| Legacy beta/alternate sequence | Rewritten defensively | Not scheduled by current Vercel crons; generic retake practice copy does not promise a new trial |

Delivery schedules, recipients, eligibility, opt-outs, payment suppression, sent flags and idempotency are unchanged. No emails were sent or replayed during this work. Existing frozen Day 3/5 retry payloads are not rewritten in place (provider idempotency requires stable content); normal new claims use revised copy. Historical delivered emails cannot be changed. The legacy cron forwarding to Supabase fn-send-emails is not in vercel.json; external scheduling/provider-side automations were not verified here.

## Other interior fixes

- General Tutor no longer injects the no-materials/My Courses pitch. Retired notes/class-mode prompt branches removed from this route; evidence and clinical-safety rules retained. Empty evidence panel and Help now describe current use.
- Home always displays the lowest saved CPR categories (Below first, otherwise Near), even when a saved session exists. Save updates React state directly; no page refresh required.
- Suggested bank practice is available using the first lowest CPR category, otherwise an established recent-miss focus, otherwise an explicitly mixed starting set. It requests bank originals; generated practice remains separate.
- /classes explains retirement and links to Home. No in-app /progress links found; no route added. Dictionary expansion remains backlog.

## Verification and Muse retest

279 tests passed, TypeScript passed, incremental lint gate passed with zero new/blocking errors (existing lint debt remains).

On the production deployment: save Pharmacological Therapies as the only Below rating while a session is in progress; Home must show it immediately. Select Suggested bank practice and verify bank source and category. Open a new General Tutor exchange and check no retired-feature pitch. Verify the next actual welcome and scheduled expiry emails against the copy above; no real-send receipt is claimed by offline tests.
