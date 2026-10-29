# ForgeNursing email gaps — October 29, 2026

## Production investigation
- support@forgenursing.com welcome queue: created 18:49:51 UTC (1:49:51 PM CT), pending, zero attempts, no provider ID/error at investigation. The signup trigger worked; no send had yet been attempted. Existing welcome cron ran at minute 15 each hour; the next run was 2:15 PM CT. This is not a bounce/delivery finding. One earlier October 29 welcome is marked sent in the queue.
- Change welcome processing to every five minutes, set reply-to to support, and use the existing fail-closed cron authorization helper. Mailbox delivery still requires confirmation.
- Known real Retake Pass is saved with purchase time 18:54:02 UTC and actual expiry 2027-01-29 18:54:02 UTC (January 29, 12:54 PM CST).

## Purchase email
- New subject: Your Retake Pass is active.
- Uses saved access-until date, Home/performance report, bank practice, scheduled reviews, exact free-extension/no-auto-renew terms, Account at /settings, support reply-to and Michael's founder sign-off.
- Transactional database outbox is inserted with each newly granted production pass. Unique pass constraint plus existing unique checkout fulfillment prevents webhook/confirmation duplication. Preview grants do not queue mail. No bulk backfill of past purchases.
- Five-minute production worker claims atomically, freezes the payload, uses a stable Resend idempotency key, and retries unknown outcomes only inside 23 hours. Old uncertain sends are held for reconciliation, never blindly resent after provider key expiry. Refunded/expired passes are suppressed. Provider acceptance is recorded separately from mailbox delivery.
- SQL migration is additive, service-role-only, RLS enabled, empty function search path.

## Google and Stripe checks still open
- Google Analytics and Stripe dashboard browsers are signed out. Stripe connector did not expose the receipt-email dashboard setting. Its enabled/disabled status is unverified; no setting was changed.
- GA4 property 521524312 and Google Ads 810-255-0658: known purchase and morning signup receipt remain unverified. Do not label them seen or absent without destination access.
- Source inspection: GTM-WGRTRVG9 is installed; signup pushes sign_up to dataLayer. Retake Pass fulfillment currently has no explicit GA4 purchase send. PostHog server capture is not proof of Google receipt. Inspect GTM mappings and actual GA4/Ads events before adding or changing conversion destinations. No historical conversions were fabricated or replayed.

## UI and verification
- Removed Configured Stripe key mode from expanded existing billing UI.
- Automated tests cover concurrent workers, lost provider receipt, identical retry payload/key, retry-window expiration, preview/refund suppression, actual date and terms.
- Updated a stale prompt test that still required the removed upload feature; no tutor code changed in this release.
- Muse: inspect Account > Existing billing account; verify new email copy and expiry; confirm welcome mailbox receipt; reconcile Google events against the real purchase and trial signups. Ads remain gated.
