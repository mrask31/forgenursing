# Source-checked limited learning loop — October 14, 2026

## Implemented

- Frozen bank: 60 families, 180 questions (one original, one immediate retry, one delayed review). All keys, option order and choice-specific explanations match draft revision 2. Authored cues and takeaways are retained in `content/drafts/teaching-points.tsv`.
- Separate `ai_source_checked` publication tier, immutable version/hash, references and irreversible withdrawal. No independent clinical approval is created or implied. Difficulty values are provisional and their rating is hidden for this tier.
- Generic practice uses fresh frozen originals when enabled. Original misses offer their family's retry and schedule one delayed review 24 hours later. A correct original does not schedule a review. No recursive retries, automatic generated filler or recycling after delayed-variant exhaustion.
- Idempotent starts and first-answer scoring; actual question exposure is persisted. Review starts resume the same attempt. Original, retry and delayed scores remain separate. Progress and suggested focus use original attempts; suggested focuses must have fresh bank content available.
- Server-bound ownership and entitlement checks. Source questions/sessions cannot be altered by direct client writes. Public clients cannot read the whole content bank or invoke its service-only functions.
- Content withdrawal blocks question serving, answer/retry/review feedback, saved result retrieval and new tutor handoff. Existing historical scores remain historical; withdrawal is not a claim that every other question is clinically sound.
- Review events identify the real original opportunity, content version and source-check tier. Reports compare matching tiers/versions rather than pooling source checks with independent review.

## Database changes applied

Project: ForgeNursing (`gqrpjvmxquipurmhmvfs`). Applied the source-checked learning-loop and write-guard migrations. Inserted 60 **preview** publications containing 180 questions. No production publications were inserted. Existing independent-approval records and rules are unchanged.

`tests/database/source-checked-loop.sql` runs with transaction-local dummy users and rolls back. Eleven assertion groups passed: idempotent start; current-question exposure/ownership/audience; first-answer and 24-hour scheduling; correct-original completion; retry resumption/separate score; delayed resumption/ownership/exhaustion/separate score; bank exhaustion; immutable content/withdrawal; service-only permissions; cross-user RLS; direct owner mutation protection. This is a database integration test, not a browser test or a clinical validation.

## Verification

- 172 tests across 24 files passed, including exact content preservation for all 180 questions and new source-tier API boundaries.
- TypeScript passed.
- Incremental lint gate passed: zero new/blocking errors. Full legacy baseline remains 452 errors and 16 warnings; this is not a clean full-lint claim.
- Database advisors checked. New content table intentionally has RLS with no client policy (service-only). New indexes are unused before traffic, as expected. Existing mutable-search-path, legacy security-definer/extension and leaked-password-protection notices remain outside this patch.
- No independent clinical validation or learner-outcome evidence is claimed.

## Preview activation blocker

Vercel's connector returned **403 forbidden** for setting the project environment variable, including the retry after the user's clarification. No authenticated Vercel CLI is available in this workspace. The feature flag is therefore not enabled by this work.

In the ForgeNursing Vercel project, add:

- Key: `SOURCE_CHECKED_PRACTICE_ENABLED`
- Value: `true`
- Environment: **Preview only**
- Git branch: `codex/release-reliability`

Then redeploy the latest preview commit. Keep Production unchanged until the authenticated preview checks pass. Do not hardcode the flag or remove the environment gate to work around permissions.

## Remaining release checks

1. Authenticated browser run on the enabled preview: Home start, mixed/topic selection, original miss, fresh retry, saved results, returning to the original session, refresh/resume and exhaustion messages on mobile and desktop.
2. Concurrent HTTP submissions and reloads on that preview; database serialization/idempotency already passed sequential integration checks, but actual concurrent browser/API delivery has not been verified here.
3. Confirm PostHog receives the rendered/answered events under QA exclusion, then check the real due-review path after 24 hours. Do not manufacture production review events or move real learners' dates.
4. Complete the previously outstanding paid Stripe lifecycle and broader tutor evaluation before declaring the whole application ready for unrestricted recruitment. These are not replaced by the frozen-bank tests.
5. After preview verification, publish identical validated packets with `production` audience, enable the flag for Production, deploy the verified release and run a production smoke check. There are currently no production source-checked publications.

The source-checked launch path respects the owner's decision not to commission an RN review; it never relabels that choice as independent clinical validation. Software checks establish behavior and data integrity, not medical correctness or learning efficacy.

## Repeatable content preparation

`npx tsx scripts/clinical/build-source-checked-bank.ts` builds the bank from the frozen draft and authored teaching points. `npx tsx scripts/clinical/prepare-source-checked-import.ts preview /tmp/forge-preview-import.sql` validates packets/hashes and emits an insert-only SQL script without connecting to a database. Use the production audience only during the approved release step and verify imported hashes against the artifact. Published packets cannot be edited in place.
