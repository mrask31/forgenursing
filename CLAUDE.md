# CLAUDE.md — ForgeNursing repo (v1.2, 2026-11-05)

This repo is forgenursing.com, an NCLEX-RN retake program. You are the code owner/builder. Work is specified by Muse (producer/auditor) and approved by Michael (owner). The canonical **ForgeNursing Operating Brief** (v1.0, 2026-11-05; Google Drive → ForgeNursing → 01 Product & App → Specs & Handoffs) governs this business — if this file and the brief ever conflict, the brief wins and the conflict should be flagged.

### Brief access rule

If you cannot open the Drive brief, proceed on this file and say in your report that the brief was not checked — **except** for any change touching pricing, offer terms, or clinical content. For those, stop and ask Michael before writing code.

## Product facts — never embellish

- Retake Pass: **$29.99 one-time for 3 months**. No subscription, no auto-renew, ever.
- Guarantee: **"Don't pass? 3 more months free"** — one free 3-month extension, no proof required, claimed at end of month 3.
- **7-day free trial, no card required.**
- Question bank: **240 audited questions** (80 families), more added weekly. Never display an invented larger fixed count anywhere (a stale "3,000+ questions" claim shipped once — never again). "240+ … more added weekly" (signup) is approved.
- Content is AI-assisted and source-checked. **Never** claim independent clinical validation, pass rates, guarantees of passing, testimonials, or success statistics.
- **No mock/practice exam exists.** Never build UI or copy implying one.

## Where things live

| What | Path |
|---|---|
| Audited question bank (published) | `content/source-checked-bank.json` — 80 packets × (original, retry, review) = 240 items; every packet has `independent_clinical_validation: false` |
| Draft banks (not published) | `content/drafts/` |
| Bank build/publish scripts | `scripts/clinical/` (`build-source-checked-bank.ts`, `publish.ts`, …) |
| Retake Pass terms (code constants) | `src/lib/retake-pass.ts` (`RETAKE_PASS`: 2999 USD cents, 3 months, 1 extension) and `matchesRetakePassPrice` |
| Pass checkout / fulfillment server | `src/app/api/retake-pass/checkout/route.ts`, `src/lib/retake-pass-server.ts` |
| Checkout-return handler (purchase) | `src/components/account/RetakePassDetails.tsx` on `/settings?pass_checkout=cs_…` → `POST /api/retake-pass/confirm` → `trackPassPurchase()` |
| GA4 conversion module | `src/lib/analytics/ga4-conversions.ts` (`sign_up`, `begin_checkout`, `purchase`; hostname + QA suppression) |
| `begin_checkout` | `src/components/account/RetakePassCheckout.tsx` → `trackPassCheckout(checkoutId)` after session creation |
| `/signup` success handler (`sign_up`) | `src/app/(public)/signup/page.tsx` (`ga4Conversion('sign_up', …)`) |
| Pricing / offer copy | `src/app/(public)/page.tsx` (homepage + meta), `pricing/page.tsx`, `faq/page.tsx`, `terms/page.tsx`, `signup/page.tsx`, `src/components/account/RetakePassCheckout.tsx`, `answer-trap-check/components/Trap*.tsx`, emails in `src/lib/emails/retake-lifecycle.ts` (`RETAKE_TERMS`) and `retake-purchase.ts` |
| Trial expiry job | `src/app/api/emails/process-trial-expiration/route.ts` (cron `10 * * * *` in `vercel.json`); selection SQL in `supabase/migrations/20261103172128_repair_trial_expiry_delivery.sql` |

Legacy subscription code (`src/lib/stripeClient.ts`, `/api/stripe/checkout*`) is retired: new purchases return 410. Keep webhook support for existing subscribers; never re-expose these offers. This file is the only agent rules file for the repo; do not add a parallel `.cursorrules`.

## Clinical content

- Question stems, options, rationales, and explanations come **only** from the audited bank in `content/source-checked-bank.json`. Never generate or "improve" clinical content inline. If content is missing, leave a clearly marked placeholder and flag it.
- Only bank-original misses schedule reviews; generated/supplement questions are labeled as supplements wherever they appear.

## Copy rules

- No "you failed" framing in **ad copy and paid placements** (personal-attributes policy). Speak to retakers respectfully everywhere.
  - Named exceptions, owner-approved Oct 26, 2026: the site hero and search-intent pages may use "Failed the NCLEX?" — homepage H1 and meta description (`src/app/(public)/page.tsx`), `/failed-nclex-what-to-do-next`, the `/nclex-practice` card, and the "Failed the NCLEX?" help-page CTAs. Do not remove these, and do not reuse this wording in ads or paid landing variants.
- No artificial urgency, no discount framing, no subscription language for the Retake Pass ("per month", "cancel anytime" are banned strings for this product).

### Banned-strings check (proposed — not wired to CI until Michael approves)

Run before any PR that touches copy. Exit code 1 means clean; any output is a violation to fix or justify.

```bash
grep -rnEi --include=*.ts --include=*.tsx \
  "3,000|3000\+|per month|/month\b|cancel any ?time|mock exam|practice exam|simulated exam|full-length exam|exam simulator" \
  src | grep -v -E "\.test\.|__tests__"
```

(Bare "monthly" is intentionally not matched — it is a legacy plan identifier in webhook code.)

## Analytics — do not break

- GA4 `purchase` fires on the authenticated checkout-return path **only after** Stripe retrieval + ownership/paid/amount/price/fulfillment validation, with the Stripe payment-intent ID as `transaction_id`, $29.99 USD. Duplicate guards stay in place. Sandbox/preview/QA contexts stay suppressed.
- `begin_checkout` fires after checkout-session creation; `sign_up` fires from the single /signup success handler via the initialized tag path.
- Any PR touching checkout, signup, pricing, or tracking must say so in its description so acceptance can re-verify GA4/Ads/Stripe receipt.

### Verifying GA4 suppression is intact

1. `npx vitest --run __tests__/ga4-conversions.test.ts __tests__/pass-purchase-measurement.test.ts __tests__/measurement.test.ts` passes.
2. In `ga4-conversions.ts`, `ga4Conversion` still returns early unless the hostname is exactly `forgenursing.com` / `www.forgenursing.com` and `is_qa` is false (`?qa=1` or the localStorage QA flag from `src/lib/analytics/measurement.ts`).
3. `trackPassPurchase` still rejects anything that is not a `pi_…` ID, 29.99, `USD`, `livemode: true`.
4. On a preview URL (`*.vercel.app`), GA4 DebugView shows no `sign_up` / `begin_checkout` / `purchase`.

## Commands (from package.json)

- Install: `npm ci`
- Dev: `npm run dev`
- Build: `npm run build` (runs `prebuild` → `npm run lint:gate`, the baseline-aware ESLint gate in `scripts/quality/lint-gate.mjs`; new lint errors fail the build)
- Lint: `npm run lint` (plain `next lint`) / `npm run lint:gate`
- Unit tests: `npm test` (`vitest --run`, files in `__tests__/`)
- E2E: `npm run test:e2e` (Playwright, `tests/e2e/`); smoke: `npm run test:e2e:smoke`

## Branches, deploys, and definition of done

- **Production branch is `main`.** Vercel project `forgenursing` (team `michaels-projects-b1fddaa4`) builds every push to `main` as a production deploy to forgenursing.com. Every push to `main` is a live release.
- Never push directly to `main` unless the spec says to. Work on a feature branch, rebase it on the current `origin/main` immediately before merging, and never merge a branch cut before a verified production change without reconciling it first (this is how the Oct 29, 2026 incident happened — production kept selling the retired subscription offer; fixed by `309f82a`, now in `main`).
- Merging is not done. A change is done when Muse verifies the **live production behavior** against the spec's acceptance criteria.

## Trial emails

- Trial lifecycle emails (Day 6 "ends tomorrow", expiry) select from `get_trial_expiry_candidates` semantics: trialing accounts included; beta, paid-linked, Retake Pass purchasers, unconfirmed emails, and opt-outs excluded; the delivery ledger + Resend idempotency keys prevent duplicates. The expiry job runs hourly. Do not reintroduce status filters that exclude `trialing`.
