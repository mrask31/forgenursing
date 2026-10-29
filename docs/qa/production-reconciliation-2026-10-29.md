# ForgeNursing production reconciliation — October 29, 2026

## Cause and repair

The relaunch was deployed to production, not merely preview. Vercel records production db7c65fa on October 26, batch-5 production 55d1eb3 (dpl_HCT1DWUHy7j1ERH4dgfhHVqXNaQD), and October 27 production 3b808b6 from codex/release-reliability. Those commits were never merged into main. October 28's SEO release 8db1dde, based on October 14 main, replaced the relaunch; October 29 email releases continued from that stale ancestry. This was an application regression caused by divergent release branches, not loss of bank data.

Merge release-reliability into current main, preserving the October 28 SEO content and October 29 email ledger/retry fixes. All future production work must start from updated main. Do not promote an older branch that lacks current production ancestry. Restore the one-time pass, default source-checked bank, anytime review, Courses retirement, current legal copy, trial/pass account display and earlier tutor/auth fixes together.

## Additional reconciliation fixes

Day-five and expiry emails now describe the $29.99 nonrenewing pass and one free extension. Trial email processors check production pass purchases before sending, even if legacy profile fields still say trialing. An unavailable pass lookup fails closed. Frozen retries advertising retired subscription prices are held for reconciliation, never silently rewritten under an existing provider idempotency key. No such pending old-price retries existed at the read-only check. Existing recurring customers are not canceled or migrated.

## Verified before release

- 264 tests across 45 files pass; TypeScript passes.
- Incremental lint: zero new/blocking errors; 426 documented legacy errors and 11 warnings remain.
- Stripe connector now exposes dedicated live ForgeNursing acct_1SoyLxGnWxTbupf0. Live active product prod_VVxjphgA87DeSQ is named ForgeNursing Retake Pass — 3 months. Active price price_1UUvnoGnWxTbupf0AuLln0BP is 2999 USD, one_time, recurring=null, livemode=true.
- Supabase gqrpjvmxquipurmhmvfs: 80 active source-checked families in production and preview; production pass count zero. Grant, extension and checkout-intent functions exist. No database migrations or learner edits required by this reconciliation.
- Vercel project prj_C45ip1WYiAfPA3rl3k0jcreWkXl4 / team_We3i024LK5yzwcMVBIxdY0H3 is the intended production target. Environment metadata listing denied (403); no authenticated CLI installed. No secret values were retrieved or changed. Production runtime configuration must be verified behaviorally.

## Remaining checks

Record new deployment ID/commit and confirm custom-domain assignment. Crawl homepage/pricing/FAQ/Terms/Privacy and signed-out checkout. Authenticated production checkout, default bank, immediate review, trial-days display and regression acceptance remain separate checks; no live purchase authorized or performed. Verify completed pass receipt/analytics when a legitimate payment exists. Keep the November 2 marketing video on hold until production acceptance passes. No paid campaigns launched.

## Authenticated production verification — October 29

Verified on the live custom domain using the founder's existing subscription account, not a fresh trial. Internal test original session c7d4088a-165c-47b6-8ef2-300c14187b9e remains saved at 1/5 answered; its intentional miss and subsequent correct retry/review are test activity, not customer outcomes. No learner dates or payments were altered.

- Mixed bank practice selected by default; served the source-checked AV-fistula family original. Wrong selection showed its own explanation, key cue and related-retry control.
- Related retry completed 1/1 and saved separately, with return-to-original link. Original session resumed at question 2/5 after navigation.
- The original miss created one review, suggested October 30 but available immediately October 29. Review now opened a fresh family question, accepted the answer, saved separately and emptied the queue. No timing gate.
- Signed-in Buy opened Stripe showing ForgeNursing Retake Pass — 3 months, $29.99, and explicit Live mode / test data not accepted. Returned using Back to ForgeNursing without payment. Stripe Link requested verification automatically; no code entered or payment credentials supplied. A test checkout was created but not paid.
- General Tutor rendered without a course selector; historical conversation was retained. No new tutor response or inline handoff tested this pass. CPR intake controls rendered; no ratings/date were saved, so recalculated-focus behavior is not freshly verified.
- Generated supplement is explicitly optional and labeled; no generated question was requested. Topic/Suggested bank sessions not exercised in this pass.
- Corrected results-page wording that called all practice AI-generated; the neutral score disclaimer now fits bank and generated questions.

Remaining: fresh trial signup/countdown/expiry, CPR save-to-focus, Topic/Suggested sessions and generated-question labels, inline tutor response, actual paid-pass receipt/webhook/analytics and economics/ad approval. Production acceptance is substantially advanced, not fully closed.
