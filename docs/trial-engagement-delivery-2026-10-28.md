# Trial engagement delivery repair — October 28, 2026

Day 3/5 now use trial_engagement_deliveries, independently of the Day 6/7 queue and welcome ledger. Unique user/step claims precede provider calls. Successful sends require a provider ID and a successful receipt write. Retries reuse the stored payload and a stable Resend idempotency key, wait at least five minutes, and stop at 23 hours from the first claim.

The production-only processor runs hourly to recover within that window. Its eligibility RPCs exclude paid/Stripe-linked, beta, unconfirmed and opted-out accounts. Eligibility is checked again after claiming. Preview and local processors never send.

At migration cutover, current or already-passed Day 3/5 steps for still-active app trials are held as legacy_hold because the old sender could have sent without recording a receipt. Do not replay these without provider reconciliation. Future steps are not automatically held. No historical receipts are fabricated or erased.

Deployment order: apply the additive migration, verify restricted privileges and cutover counts, deploy source, then inspect the deployed revision. Do not invoke the production sender for testing. Unit fixtures use example.invalid and an isolated provider transport.

Known separate follow-ups: Day 6/7 expiry eligibility/status semantics and the expiry-maintenance route's id/user_id mismatch remain to repair; they are not covered by this change. General email sequences not scheduled in vercel.json remain legacy code and must not be manually invoked or re-enabled without reconciling their ledger assumptions.
