# Retake Pass wiring — October 26, 2026

Batch 1 accepted by Muse: password change end-to-end and dictionary canonicalization. No rework to those paths.

## Implemented in this batch

New /pricing and /checkout offer only $29.99 one-time for three calendar months, seven-day no-card trial, one free three-month extension, and no auto-renewal. Old recurring checkout endpoint returns 410; founder endpoint remains retired. FAQ/Terms payment mechanics updated. Full landing/positioning sweep remains phase 5.

Verified paid Checkout Session grants access only after server retrieval and checks for owner, audience, mode=payment, complete/paid status, exact 2999 USD total, exact configured single line item/quantity and one-time price, successful payment intent, nonrefunded/nondisputed charge. Verified charge timestamp anchors three UTC calendar months; month-end dates clamp. No client-supplied access dates or profile active-status write. Confirmation-on-return is idempotent; signed webhook supplies fulfillment even if the browser does not return. Refund/dispute webhook events revoke pass access. Delivery remains unverified until configuration and browser acceptance.

Two additive migrations applied in shared Supabase project: retake_passes with own-row read RLS/service-only writes; service-only checkout-intent token table/RPC. Preview and production audience are separate. Repeated checkout starts share a database token and Stripe idempotency key until session expiry. Extension is owner/audience scoped, row-locked, available only after initial end, rejected if already used or refunded, and starts three months when activated. Expired trial/pass study pages show a locked state with retained-work/Account path instead of automatic checkout redirect; APIs continue requiring entitlement. Existing legacy paid access remains intact pending its separate renewal transition.

Settings displays purchase/access-until dates, active/ended state, free-extension availability/used state, and pass invoice portal. Existing billing portal remains under Existing billing account. Pass grants flow through API entitlement, subscription-status compatibility endpoint, browser user hook and middleware. Session-cookie preservation added for authenticated login redirects; client no longer treats a 2.5-second timeout as proof of signed-out state. One-off post-sign-in Settings bounce still needs browser regression acceptance.

## Stripe configuration and current blocker

Created in dedicated ForgeNursing sandbox acct_1SoyM3Gnwd1bHIvc, livemode=false:
- One-time price price_1UUqD0Gnwd1bHIvchVGDxJdG, 2999 USD, no recurring interval; product prod_VVrwpnQltAd2hS; lookup retake_pass_3_months_v1.
- Webhook we_1UUqOdGnwd1bHIvcpxwfi5Xj to the stable release branch /api/retake-pass/webhook; checkout completion, async success, refund and dispute events, API 2025-12-15.clover.

Vercel rejected creation of STRIPE_RETAKE_WEBHOOK_SECRET_TEST with 403 (no create-env permission). No CLI installed/authenticated. Do not retry unchanged. User must set its signing secret from the sandbox endpoint in Preview scoped to codex/release-reliability, and confirm STRIPE_SECRET_KEY_TEST belongs to the same dedicated sandbox. The sandbox price ID has a server-side default; STRIPE_PRICE_RETAKE_PASS_TEST can override it. Never paste keys/signing secrets into chat. Vercel protection must permit real webhook delivery; no protection bypass or gate change claimed. Delivery and purchase acceptance cannot be claimed from endpoint creation alone.

Production requires live STRIPE_PRICE_RETAKE_PASS and STRIPE_RETAKE_WEBHOOK_SECRET plus valid live key, created/configured only in the coordinated rollout. Live $129/year and $59/every-four-months prices are NOT archived in this preview batch, because production changes are held for Muse acceptance. Archive during live offer switch. Archival does not cancel existing renewals: legacy account transition remains an explicit gate, no silent cancellation performed.

## Validation

237 tests / 38 files pass (obsolete subscription-purchase tests replaced by retirement/pass-checkout and fulfillment boundaries); TypeScript passes; incremental lint zero new blockers. Supabase transaction-only synthetic fixtures verified grant idempotency, early-extension rejection, one extension, second rejection, and stable checkout tokens. All fixture transactions rolled back; zero synthetic users and zero pass grants persisted at verification. No learner records were backdated. Own-row RLS enabled; authenticated cannot execute grant/extend/checkout-intent RPCs. Security advisor reports intentional service-only/no-policy checkout-intents INFO; existing unrelated mutable-search-path warnings remain and are not claimed resolved.

## Acceptance and remaining release work

Use a fresh test account for pass-only expiry (the paid owner account intentionally retains its legacy access). Verify sandbox checkout, grant dates, invoice portal, refresh/resume, webhook delivery without browser return, duplicate confirmation, incorrect/foreign/unpaid sessions, and extension/expiry boundaries using clearly isolated synthetic fixtures rather than changing real learner dates. Mutation boundary tests do not substitute for Muse's browser pass.

Still pending: anytime review UI/RPCs; Courses removal/General-only tutor; production bank publication and bank-default acceptance; full retaker-positioning/copy sweep; real trial-days acceptance; 30 new question drafts and independent Muse audit to reach 200+; coordinated live catalog switch and production money-path acceptance. This is the pass-wiring acceptance batch, not relaunch readiness.

Build follow-up: Next.js route validation requires a nonoptional Request parameter; checkout/extend/portal signatures corrected after first Vercel build failed. No READY claim made for the failed build. Cross-origin mutation regression added.
