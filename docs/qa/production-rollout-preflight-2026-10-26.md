# Retake relaunch production preflight — October 26, 2026

Muse accepted the 210-question integration and all pre-rollout product gates. Production application promotion remains blocked on Vercel Production environment configuration; the existing production application has not been replaced.

## Live Stripe preparation completed

- Retake Pass price: `price_1UUvnoGnWxTbupf0AuLln0BP`, USD 29.99 one-time, product `prod_VVxjphgA87DeSQ`, live ForgeNursing account `acct_1SoyLxGnWxTbupf0`.
- Live pass webhook: `we_1UUvocGnWxTbupf0fc6wf3ww`, `https://forgenursing.com/api/retake-pass/webhook`; checkout completed/async payment succeeded, charge refunded/dispute created. Signing secret is not recorded here.
- Archived `price_1TMo2NGnWxTbupf0va0QJHYY` ($129/year) and `price_1TMo1DGnWxTbupf0VdaeMXWf` ($59/every four months), after clearing their products' default-price assignments. Existing subscriptions were not canceled.
- Legacy subscription webhook now acknowledges non-subscription Checkout events without subscription fulfillment; the dedicated pass webhook fulfills passes. Route tests cover isolation and continued subscription-update processing.

## Production catalog staged

70 production packets are inserted. Read-only comparison confirms all 70 packet/version hashes match the accepted preview catalog (210 questions). No learner records were backdated or modified. This catalog publication does not promote the application. Content remains AI-assisted/source-checked, not independently clinically validated.

## Required Production environment settings

Vercel project `prj_C45ip1WYiAfPA3rl3k0jcreWkXl4`, team `team_We3i024LK5yzwcMVBIxdY0H3` rejected Production environment listing/writes with HTTP 403 additional permissions required. No authenticated Vercel CLI fallback is installed.

Set these in Production, without branch scope:

| Variable | Value |
| --- | --- |
| STRIPE_PRICE_RETAKE_PASS | price_1UUvnoGnWxTbupf0AuLln0BP |
| STRIPE_RETAKE_WEBHOOK_SECRET | Signing secret of live endpoint we_1UUvocGnWxTbupf0fc6wf3ww |
| SOURCE_CHECKED_PRACTICE_ENABLED | true |

Keep STRIPE_SECRET_KEY live for the ForgeNursing account. Do not substitute preview/test secrets. After configuration, build the release with Production environment variables; do not alias the sandbox Preview artifact directly.

## Verification and rollback

Local suite: 243 tests across 41 files passed; TypeScript passed. Incremental lint reported zero new findings, with 429 pre-existing errors and 11 warnings (23 baseline findings resolved); full lint is not clean.

Current production rollback reference: deployment `dpl_DDrVTRmAvRMQTnBCWdSZbWcnDDVw`, main commit `fe1bfd4fd43f6076489c44a03d3f3ac3c5b54d8d`.

After production build and promotion: verify live pricing, signed-out trial/checkout path, live $29.99 Checkout mode, pass webhook fulfillment and production bank access. Muse must complete clean signed-out production money-path acceptance before marketing. No live purchase has been made by this preflight.
