# ForgeNursing measurement spec (paste-ready for the site builder)

Goal: learn where visitors drop off and which reels drive traffic. Currently
PostHog only sees pageviews, so an engaged visitor who answers all 3 questions
on one page can look like a bounce. Anonymous test visits pollute the baseline.

## 1. PostHog funnel events (add to the site)

- `quiz_started` — visitor taps "Start free practice". Props: `utm_source`,
  `utm_campaign`, `landing_page`.
- `question_answered` — each answer submitted. Props: `question_id`,
  `correct` (bool), `attempt` (1 = original, 2+ = related retry).
- `related_retry_started` — visitor taps "Try a related question".
- `sample_completed` — results screen viewed. Props: `score` (e.g. 1/3),
  `retry_correct_count`.
- `trial_signup_started` — "Create Free Account" tapped.
- `trial_signup_completed` — account created.

Funnel to build in PostHog: session → quiz_started → question_answered →
sample_completed → trial_signup_completed. Add the same events to the
signup-page view so drop-off between results and signup is visible.

## 2. Tagged links (per platform, per reel)

Every bio link and caption link gets UTM params so each visit maps to a
platform and a reel. Preserve params through the quiz into signup.

- TikTok bio: `https://forgenursing.com/?utm_source=tiktok&utm_medium=social&utm_campaign=profile`
- TikTok reel captions (per reel): `...&utm_campaign=q05-ppe` (use the
  question id of the reel's question)
- Instagram: `utm_source=instagram`, Facebook: `utm_source=facebook`,
  YouTube: `utm_source=youtube` — same `utm_campaign` convention.
- Direct/referrer-less visits stay "direct"; no tag needed.

## 3. Clean the baseline

- Exclude the owner's visits from the "public traffic" view (already-known
  account + his home IP/device). Keep a separate "all traffic" view for QA.

## 4. What this answers (once ~100+ clean visits exist)

- Bounce cause: which funnel step loses the most visitors.
- Channel quality: TikTok vs Instagram vs YouTube vs Facebook per-visit
  completion and signup rates.
- Reel quality: which questions/hooks produce clicks that actually try the quiz.

## 5. Retry-loop measurement v2 (2026-10-14)

Status: Sections 1–3 describe the original rollout; public events and owner-account/device QA exclusion were implemented October 13. Home-IP exclusion was not established. This section defines the next version for both public sample and signed-in practice. Keep them separate in reports.

### Common identity and scope

Every loop event includes `loop_version: 2`, `experience` (`free_sample` or `signed_in`), `quiz_session_id`/`sample_session_id`, `question_id`, `distinction_id` (nullable), `distinction_status` (`reviewed`, `provisional`, `unmapped`), `retry_opportunity_id`, and `retry_ui_version`. Never include clinical question text, student free text, email or patient information in these events.

`retry_opportunity_id` identifies one original missed question instance: sample session + original question ID, or the unique signed-in original question ID. It persists across reloads, retries and later review. `source_question_id` is null for originals and the original ID for retries/reviews. Do not identify a new attempt by a reusable bank ID alone.

Assign `distinction_id` from a controlled, versioned taxonomy. AI-assigned mappings remain provisional; never substitute a broad mistake type or slugified free text. A reviewed original/retry/review set shares one reviewer-confirmed ID. Unknown concepts stay null and are excluded from distinction-level retention comparisons, but included in overall uptake counts.

### Events

- `question_answered`: existing props plus common identity, `correct`, `attempt` (1 original, 2 first immediate retry), `retry_eligible`, `source_question_id`. Emit after a saved answer; duplicate delivery is deduplicated by question instance in reports.
- `related_retry_offered`: emit when an eligible original-miss feedback view presents the retry action. Identifies an actual visible offer, not merely theoretical eligibility.
- `related_retry_started`: tap on the retry action. Same opportunity ID across repeated clicks and attempts to load it.
- `related_retry_loaded`: retry question rendered successfully, with its actual question ID.
- `related_retry_failed`: request failed; include `stage` (`load` or `answer`) and a bounded error code, never raw errors or clinical text.
- `review_question_answered`: saved delayed-review answer. Include distinct review attempt ID as `question_id`, original `source_question_id`, `distinction_id`, opportunity ID, `correct`, `days_since_miss`, `review_round`, and approved content version.

Retries remain optional. Only original misses are eligible for immediate retry in v2. A missed retry returns the student to their original session and future review; it does not recursively spawn another immediate retry.

### Denominators and matching

Use unique opportunity IDs and match child events to their original opportunity, scoped to the same experience and version. Deduplicate answer events by question instance. Do not divide raw event totals.

1. Offer coverage: unique eligible misses with an offer / unique eligible misses.
2. Retry uptake: unique offered opportunities with a start / unique offered opportunities. Also show starts / all eligible misses to expose delivery gaps.
3. Load success: started opportunities with a loaded retry / started opportunities; show failures separately.
4. Retry completion: started opportunities with a saved retry answer / started opportunities; also show answered / loaded.
5. Immediate retry success: answered retry instances correct / answered retry instances.
6. Delayed-review return: due opportunities answered / due opportunities, grouped by due-date cohort.
7. Delayed success: correct review answers / answered review attempts, by reviewed distinction and elapsed-time band (1–2, 3–6, 7+ days). Compare immediate and delayed answers only within the same learner/opportunity cohort; separate first delayed attempt from subsequent attempts.

For immediate metrics use a 24-hour outcome window after the original miss. Exclude immature opportunities from finalized rates; show them as pending. Later attempts are reported separately. For delayed return use a seven-day grace window after due time. A count under 100 is descriptive and exploratory; 100 is not a statistical validation threshold.

### Interpretation

- Low uptake warrants investigation: visibility, time constraints, perceived value, or technical failures may contribute.
- Low load success points to delivery errors; low completion among loaded retries may indicate abandonment, usability, difficulty or confusion.
- High immediate success with lower delayed success warrants investigation of transfer, retention, question comparability and returning-student selection.
- Delayed success provides evidence of retained understanding among returning students. It does not prove the app caused learning or predict exam readiness.
- Date comparisons are observational. Track `retry_ui_version` and exposure, and avoid causal claims from an uncontrolled before/after change.

### Guardrails

Keep public production reports separate from all-traffic QA. Continue owner/device exclusions; historical anonymous tests remain unidentified. Do not create fake review events before the queue exists. Do not backfill guessed distinction IDs or fabricated approval. A useful approved-review queue needs real independently reviewed content before it can serve students.
