# Purchase tracking, trial expiry and sample labels — November 3, 2026

Base production commit: `644a9bd5f678a9bf5bc5c492ef0e4f7341f0b1fe`.

Sources:
- [Analytics fix brief](https://drive.google.com/file/d/1wf6CXu8K20fNm3c1-iKkRXauNaLPIahq/view)
- [Sample handoff brief, item 5](https://drive.google.com/file/d/17lUbb0srgzHmzcZEGsB0Y4PILCUlGnMr/view)
- [Email gaps background](https://drive.google.com/file/d/14kZR_G1PTX4P4QgN490sGWiODnaHn_LL/view)

## Purchase tracking

Previously the Retake Pass confirmation returned only `confirmed: true`; there was no GA4 purchase instrumentation. Legacy invoice tracking in PostHog covers subscriptions, not this one-time offer.

The authenticated confirmation endpoint now returns a minimal measurement receipt **only after** Stripe retrieval and the existing ownership, paid/completed state, audience, amount, price, charge/refund and fulfillment validations pass. It returns payment-intent ID, $29.99, USD and live-mode flag. No email or card data is included; response is private/no-store.

Account's checkout-return path sends GA4 `purchase` using that payment-intent ID as `transaction_id`, with currency/value/item. It does not fire on checkout creation, pricing visits, failed confirmation or ordinary Account visits. Persistent and in-memory guards suppress repeats; the stable transaction ID provides GA4's additional transaction deduplication. Sandbox, preview and explicit QA contexts are suppressed from live conversion reporting.

`begin_checkout` fires after a checkout session is successfully created and before redirecting, with an 800ms maximum wait. Failure of measurement cannot block payment or account access. Stripe charging, webhook and entitlement rules are unchanged.

The GA4 stream remains `G-5BYYQ7382S`, property 521524312. GTM remains `GTM-WGRTRVG9`. Direct Google tag event commands no longer depend on a GTM custom-event trigger. The conversion helper initializes a missing dataLayer, loads the standard Google tag if needed, and explicitly disables its own page_view so GTM retains page-view ownership.

### Signup audit

Repository search found one `auth.signUp` path: `/signup`. Its prior success handler silently omitted measurement if GTM had not initialized dataLayer yet. It now uses the same initialized Google tag command path and ignores the empty-identities response Supabase can return for an existing user. The old plain-object sign_up push is removed to avoid double instrumenting that same success.

This establishes the code failure mode, not the historical cause of every missing October 29 event. No new account was created during this work. Browser analytics remains best-effort: blocked scripts/consent/network failures or closing Stripe without returning to Account can prevent collection. This is not a webhook-to-GA4 Measurement Protocol sender. No historical purchase is replayed or synthetic revenue generated. **GA4 Realtime/Ads acceptance remains pending the next real live checkout-return purchase and signup.** Muse must match the payment-intent ID to Stripe and separately verify/import the Google Ads conversion action.

## Trial-expiry email repair

Live readback confirmed the legacy Day 6 and expired-trial selector functions exclude `subscription_status='trialing'`. The Day 6 reminder therefore cannot select normal active trials. Expiry selection also depends on a separate status-update job running first. The old queue contains no October/November expiry receipts; its last sent expiry row is April 21. Runtime log queries timed out, so no historical cron success/failure is inferred.

The replacement production-only route uses `get_trial_expiry_candidates(text)`:

- Day 6: trialing, expires within 25 hours, has not expired.
- Expiry: trialing **or expired**, ended within the last 24 hours.
- Both exclude beta accounts, subscription-linked/active paid access, production Retake Pass purchasers (even expired/refunded passes), unconfirmed email, opt-outs and previously sent/pending legacy messages.
- Sent/skipped/held new-ledger steps are excluded. No old expiry dates are changed and no old users outside these windows are backfilled.

The existing trial delivery ledger now accepts Day 6/expiry steps. Each provider request is preceded by a unique claim and eligibility recheck, uses a frozen payload and stable Resend idempotency key, retries only within the existing 23-hour safety window, and holds uncertain old outcomes for reconciliation. Day 3/5 behavior is preserved. Expiry copy uses the actual Chicago-calendar date, past tense, current pass terms and support reply-to.

Vercel's existing expiry cron is changed from daily to hourly at minute 10. Candidate/query/delivery failures produce a retryable 503, not a false successful send count. No new email provider or secret is required.

Migration applied on project `gqrpjvmxquipurmhmvfs` as version `20261103172128`, name `repair_trial_expiry_delivery`. Readback at about 11:21 AM CST found 0 Day 6 candidates and 1 expired candidate, with its legitimate eligibility window extending until 3:22 PM CST November 3. No manual send occurred. The old sender/queue records remain intact.

Security readback: anon execute false; authenticated execute false; service_role execute true; ledger RLS true. New function has a pinned empty search_path and qualified relations. Existing unrelated advisor findings remain; the new function does not appear in those findings.

**First scheduled provider acceptance/receipt and mailbox delivery remain pending.** A provider acceptance is not proof of inbox delivery. Check `trial_engagement_deliveries` step `trial_expired`/`trial_day_6` and Resend receipt before closing that acceptance item.

## Sample item 5

Related-question panel now says: “Same concept; it doesn’t change your original score. No account needed.” The action remains “Try a related question”; retry scores still stay separate. Search of current sample components found no Skip control, so no new scoring behavior or skip option was introduced. Existing Continue advances after feedback; it is not a skipped unanswered original.

## Validation

- 319 tests across 51 files pass, including confirmed-only purchase receipts, no anonymous/failed confirmation receipt, sandbox/QA suppression, duplicate guards, missing dataLayer initialization, checkout wait bound, expiry status/time boundaries, concurrent send claims and route failure/environment guards.
- TypeScript passes.
- Incremental lint gate passes: zero new/blocking errors; 364 documented legacy errors, 11 warnings. This is not a clean full-lint claim.
- `git diff --check` passes.
- No manual email, payment, account creation, learner answer/date edits, GA4 revenue backfill or Google Ads configuration changes.
