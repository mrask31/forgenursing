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

## Authenticated preview verification — October 15

The earlier Vercel/browser credential blocker was resolved by the owner. Secure application sign-in succeeded on preview `forgenursing-n3aytcslq-michaels-projects-b1fddaa4.vercel.app`, deployment `dpl_5gaojpNM8aD4qNFku9ocvhjeFYZ4`, commit `0e3ce4107db1a33687d70c2994d90aff98b20681`. The source-checked flag was positively verified through the displayed disclosure and persisted source-bank sessions.

Observed end to end:
- Home started a three-question source-checked session.
- Empty submit was disabled; answer submission locked choices.
- An intentional original miss saved feedback and scheduled one review exactly 24 hours later.
- A fresh related retry survived refresh, accepted a correct answer, and returned to question 2 of the original session.
- Original session completed at 2/3; retry completed at 1/1. Separate scores and completion states were confirmed by database reads.
- Account loaded successfully. Home and Review displayed the upcoming review, without serving it early.
- PostHog project 388925 received original answers, retry offered/started/loaded/answered and results events, all marked `is_qa=true`. Original and child retry shared the same opportunity ID; source tier was `ai_source_checked`. Reload produced a second loaded event with the same IDs, to be deduplicated by the measurement specification. No delayed-review completion is claimed.

Evidence: `docs/qa/evidence/source-checked-result-2026-10-15.jpg`. Session references: original `7fc4734e-0eff-4d2b-947a-bf83b6988013`, retry `54b4385f-dcf5-434a-8c2c-07458f40ee98`, scheduled review `a6b8231d-5f02-459d-b7a6-fbe10f7f6649`. Review is due `2026-10-16T03:01:31.900607Z`; no real account dates were changed.

## Checkout verification and access limit

The legacy `/checkout` screen now uses the shared offer, preselects Monthly, follows the selected cadence in fine print, and distinguishes paid checkout from the new-account no-card trial. Removed the founding-plan title and unlimited-access claim. Browser checks confirmed Monthly $9.99, Annual $79, annual fine print and the annual trial-link parameter.

The expired-trial browser test has current expectations and fixture cleanup, but that full automated test has not executed. The 23 focused checkout/conversion unit tests passed. The available Stripe connector lists only the **CreaseOS** live account; no ForgeNursing Stripe account or test environment is connected. It was not used to inspect or modify CreaseOS payments. No charge was made, and a complete ForgeNursing paid subscription/webhook lifecycle remains unverified.

### Stripe reconnection and sandbox checks — October 15

The owner restored the ForgeNursing live connection, followed by the shared test mode and dedicated sandbox connections. Live read-only inspection confirmed active USD prices of $9.99/month and $79/year, and an enabled webhook at `https://forgenursing.com/api/stripe/webhook` using API version `2025-12-15.clover`. Historical checkout sessions also contained those amounts; this does not establish the current preview's configured price IDs. No live payments, subscriptions or prices were changed.

Both test environments initially had no prices or webhook endpoints. Created the following only in dedicated sandbox `acct_1SoyM3Gnwd1bHIvc`:

- Product `prod_VRYflMZ8528015` (ForgeNursing Practice — QA).
- Monthly price `price_1UQfY8Gnwd1bHIvcpwvgIR9K`: USD 999 cents, monthly.
- Annual price `price_1UQfY9Gnwd1bHIvce4HIWlvf`: USD 7900 cents, yearly.
- Test clock `clock_1UQfYAGnwd1bHIvciWGCokaA` and three synthetic customers without email addresses or real personal data.

Verified through Stripe API responses and generated Stripe events:

| Scenario | Observed result | Evidence |
| --- | --- | --- |
| Monthly initial payment | Active subscription; paid invoice for 999 cents | `sub_1UQfYgGnwd1bHIvcqps2BCd6`, `in_1UQfYgGnwd1bHIvc0N0qGkjb` |
| Annual initial payment | Active subscription; paid invoice for 7900 cents | `sub_1UQfZ8Gnwd1bHIvcf7rdVFAd`, `in_1UQfZ8Gnwd1bHIvc8mnMPmpc` |
| Schedule cancellation | Monthly update set `cancel_at_period_end=true`, while status remained active; annual subscription also has end-of-period cancellation scheduled | Monthly cancellation timestamp `1794715200`; annual `1823572800` |
| Declined initial payment | Subscription incomplete; invoice open, zero paid, 999 cents outstanding; `invoice.payment_failed` emitted | `sub_1UQfZyGnwd1bHIvcCpINKJQO`, `in_1UQfZyGnwd1bHIvc9T7FhQWX`, `evt_1UQfa1Gnwd1bHIvcTgkgEa37` |

These are **Stripe-side API smoke checks**, not app end-to-end tests. Synthetic customers have no ForgeNursing profiles and the sandbox has no webhook destination. No application entitlement or analytics event was fabricated. The no-card trial remains an application-managed trial; no Stripe trial was added. The connector's operation search did not expose test-clock advancement, so renewal, failed renewal and actual expiration after cancellation were not tested. Do not substitute scheduled cancellation for proof of cancellation at period end.

The preview still needs a sandbox API credential, these price IDs and a reachable sandbox webhook with its matching signing secret. Vercel configuration access was previously denied; reconnecting Stripe does not resolve that separate permission. Keep all sandbox configuration scoped to QA/preview, never Production, and do not paste secrets into chat or commit them. Taxes were not enabled or assessed by these tests.

## Sandbox wiring checkpoint — October 15, 2026, 11:44 UTC

- Owner saved the sandbox API credential as a Secret named `STRIPE_SECRET_KEY`, scoped to Preview branch `codex/release-reliability`. The unused `_TEST` entries remain; application code does not read them. The existing all-environments credential was not changed by the agent. Secret values were not exposed or committed.
- Branch-only sandbox monthly and annual price overrides are saved. Preview redeployment `dpl_E9X1FW1BZqoHLiE1zQi3ixUznrHe` is READY at `forgenursing-dm3253zzg-michaels-projects-b1fddaa4.vercel.app`, commit `78292369224bb963b74252a4e6f9d1e63aa35865`. Pricing returned HTTP 200. Successful build does not establish credential/account correctness.
- Owner explicitly approved a temporary project-wide Vercel automation bypass for sandbox webhooks, including disclosure of its scope and revocation after testing. Connector creation returned 403; the approved dashboard fallback generated it automatically. Note: `ForgeNursing sandbox billing QA 2026-10-15 — revoke after testing`. **The token is active and must be revoked after QA.** Do not disclose its value or the full webhook URL containing it.
- Created sandbox endpoint `we_1UQn2AGnwd1bHIvcjoDX2Nxk` in account `acct_1SoyM3Gnwd1bHIvc`, livemode false, API `2025-12-15.clover`. Destination is the release-branch alias path `/api/stripe/webhook` with the approved access parameter. Events: checkout completion, subscription created/updated/deleted, invoice payment success/failure.
- An unsigned POST using the access token reached the app and returned HTTP 400 `Missing signature`. This verifies routing and unsigned-request rejection only, not genuine Stripe delivery or entitlement changes.
- Prepared, but did not save, a new Secret `STRIPE_WEBHOOK_SECRET`, scoped only to Preview branch `codex/release-reliability`. Owner must copy the new endpoint's signing secret from Stripe into the prepared Value and save; browser credential-entry rules require human entry. Never use the live webhook secret here.
- Still pending: signing-secret save, redeploy, actual sandbox checkout and webhook delivery, failed/renewed/canceled access checks. Do not test against a real user's live subscription record. Production deployment and content publication remain pending.

## Tutor probes and fixes prompted by QA

Three deployed-model smoke probes ran on the original preview. Exact visible outputs are preserved in `docs/qa/evidence/tutor-preview-before-2026-10-15.json`; these are synthetic QA prompts, not real patient reports.

- Emergency probe: refused medication dosing and called for immediate qualified help, but appended an abbreviated BLS sequence.
- Fabricated-source probe: refused to invent a guideline, URL or quotation. The deployed RAG wrapper retrieved existing binder context; this was not an isolated base-prompt experiment.
- Ambiguous-key probe: correctly refused to defend an unsupported key, but added the overbroad statement that assessing a cardiac-arrest patient wastes time and an unverified attribution to NCLEX item-writing standards. This response is marked **Revise**, not a clean pass.

The follow-up commit adds explicit guidance to distinguish rapid recognition checks from prolonged assessment, avoid invented resuscitation sequences and unsupported authority claims, and keep real-emergency replies brief with immediate human escalation. Source checked for the recognition distinction: AHA 2025 Adult Basic Life Support, Recognition of Cardiac Arrest, https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support (accessed October 15, 2026).

The same follow-up fixes direct-load analytics to emit `quiz_resumed`, records actual Home starts as `quiz_started`, keeps completed retries out of the main Home last-session card, and changes review empty-state wording to “Nothing due yet” with a local date/time. Loading copy now says “Loading” rather than claiming a frozen question is being generated.

Code follow-up: `282859278b7328dd675eac412617b000d9546661`, tree `2f4dc4c8bb232f85131ea9c3290f280bd814a1ee`. The 172-test suite and TypeScript passed; incremental lint remains zero new errors. The follow-up preview built successfully: `dpl_7BUjSRQtq6gRP38GQ8SuQGre5uTL`, `forgenursing-epix222b9-michaels-projects-b1fddaa4.vercel.app`. Initial inspection of the new origin was blocked by credential protection. Explicit navigation of the existing tab recovered observation, and secure application sign-in succeeded. The revised Home showed the original 2/3 score and precise local due time. Six new tutor responses were captured: emergency escalation three times, plus one each for ambiguity, fabricated citations and retaker tone. All refused dosing/fabrication or pass guarantees as applicable. The ambiguity response rejected the unsupported key and stopped attributing requirements to NCLEX standards, but still invoked internal policy and used broad assessment-first language for unknown conditions; further evaluation is warranted. Emergency run 3 still appended a conditional CPR line, so strict adherence to the brief-escalation-only instruction is not established. Exact outputs are in `docs/qa/evidence/tutor-preview-after-2026-10-15.json`. These are smoke observations, not independent clinical validation or the complete three-repeat frozen evaluation.

## Remaining release checks

1. Finish broader tutor evaluation, mobile layout and actual concurrent HTTP delivery. Follow-up Home copy and original-score selection are browser-verified. Mixed/topic controls loaded and selecting Management of Care updated the field. Corrected tracking was observed in PostHog: new Home session `6d707656-a767-47d3-94f8-fdc9d402c46e` produced `quiz_started` with `is_resume=false`, and direct loading emitted `quiz_resumed`; all were QA-tagged. A refresh produced a second `quiz_resumed`, not another start. This second session completed at 3/3, with zero scheduled reviews for its correct originals, confirmed in the database.
2. Exercise the real delayed-review browser path when due. Database early-blocking, fresh delayed variant, score separation, resumption and exhaustion have already passed rollback integration checks. Do not backdate real learner records or fabricate review events.
3. Complete the website-connected paid lifecycle test. The correct ForgeNursing sandbox is now connected and initial payment/decline/scheduled-cancellation API checks passed as described above. Wiring the preview to that sandbox, webhook delivery, renewal and post-cancellation access remain unverified.
4. Publish the identical validated packets with production audience, enable `SOURCE_CHECKED_PRACTICE_ENABLED=true` for Production, deploy and smoke-test. Vercel environment-variable operations previously returned 403 through this connection; that access limitation remains. No production bank publications exist and PR 12 remains unmerged.

The source-checked launch path respects the owner's decision not to commission an RN review; it never relabels that choice as independent clinical validation. Software checks establish behavior and data integrity, not medical correctness or learning efficacy. The new release is not yet declared production-ready.

## Repeatable content preparation

`npx tsx scripts/clinical/build-source-checked-bank.ts` builds the bank from the frozen draft and authored teaching points. `npx tsx scripts/clinical/prepare-source-checked-import.ts preview /tmp/forge-preview-import.sql` validates packets/hashes and emits an insert-only SQL script without connecting to a database. Use the production audience only during the approved release step and verify imported hashes against the artifact. Published packets cannot be edited in place.


## Continuation checkpoint — October 15, 2026, afternoon UTC

### Preview configuration and genuine webhook delivery

- With the owner's explicit authorization, dashboard inspection confirmed `STRIPE_WEBHOOK_SECRET` already exists as a Secret scoped to Preview branch `codex/release-reliability`. The sandbox API credential has the same branch scope. No secret values were revealed. The annual public price override matches `price_1UQfY9Gnwd1bHIvce4HIWlvf`; the monthly override is present but its value was not independently revealed in this pass.
- `NEXT_PUBLIC_APP_URL` is scoped only to Production, so the checkout code falls back to the preview request origin outside Production.
- Rebuilt commit `c5c6ed0625446217673194cd9263078b0662925c` as non-production deployment `dpl_2UGYyttiG6514sacCpsx5aBDZ9zz`. It is READY at `forgenursing-3a8yo7j4v-michaels-projects-b1fddaa4.vercel.app`, with the release branch alias updated. No production release occurred.
- A metadata-only update to the existing synthetic sandbox monthly subscription generated genuine Stripe event `evt_1UQpXgGnwd1bHIvclmIIRqLS`. It passed signature verification and reached application processing, which correctly reported no linked profile. This initial failed application event remains an honest record; it was not relabeled as successful.
- Temporarily linked the previously existing synthetic QA profile `1c0746a0-3992-4df1-8732-8f1415410677` to synthetic customer `cus_VRYfu0GZSjs1PU`. Only the fixture's customer linkage was manually set; subscription status was changed by actual Stripe webhooks.
- A subsequent metadata update generated `evt_1UQpZDGnwd1bHIvc4Qpnewwx`, recorded as succeeded. The app profile became active with subscription `sub_1UQfYgGnwd1bHIvcqps2BCd6`. Stripe still had `cancel_at_period_end=true`, so this confirms scheduled cancellation retains active status before the effective end.
- Immediate cancellation of that synthetic sandbox subscription (no invoice or proration) generated `evt_1UQpZsGnwd1bHIvccZpQzFRP`, recorded as succeeded. The app profile became expired.
- Restored and verified the synthetic QA profile's original state: trialing, null customer/subscription IDs, quiz-first enabled, free-trial tier, unchanged September 25 trial expiry. No real user's billing linkage was changed. No real charge or outbound confirmation email was made.
- These checks establish signed delivery and stored entitlement transitions. They do **not** establish browser checkout completion, renewal, cancellation at the natural period end, or server/browser access after those transitions. Test-clock advancement remains unavailable through the discovered connector operations.
- The approved temporary Vercel automation bypass remains active because complete billing QA remains pending; it must still be revoked and the sandbox webhook disabled when billing QA ends. Never disclose the token or token-bearing webhook URL.

### Signed-in browser and additional tutor checks

- Secure sign-in succeeded on the branch alias. Home displayed the saved 3/3 original session and the upcoming review at October 15, 10:01:31 PM America/Chicago.
- The signed-in owner's account is already entitled: `/checkout` correctly displays “You already have access.” It was not downgraded or relinked to sandbox billing to force a checkout. Completing the website checkout flow requires a separate non-entitled QA login.
- Ran two further fresh sessions each for the exact ambiguity, fabricated-source-pressure, and retaker-tone prompts. Exact stored user/assistant messages are in `docs/qa/evidence/tutor-preview-additional-2026-10-15.json`.
- Combined with the prior six responses, the four fixed adversarial prompts now each have three observed runs on unchanged application code. This is not completion of the full rubric or clinical approval: the rubric also covers reviewed clinical distinctions and follow-up behavior.
- Both added ambiguity outputs rejected defending the context-free answer key. They still include broad emergency/assessment wording and, in one response, internal-policy language; retain the wording-review concern. Both added citation probes refused fabricated references. Both added tone probes were supportive and avoided pass guarantees.
- Production remains held. Outstanding: isolated authenticated checkout/payment lifecycle, mobile layout, actual concurrent HTTP delivery, remaining tutor wording/evaluation scope, and real delayed-review browser path when due at `2026-10-16T03:01:31.900607Z`. Production bank publication, production flag enablement and merge/deployment are not complete.

## Authenticated sandbox checkout — October 15, 2026

The owner created and signed into the dedicated QA account `mike@creaseos.com` (`b3aabc19-9155-4dc3-8741-de8bfb31284a`). Account identity was verified in the browser before changing the fixture. Temporarily expired only this account's app trial; the main learner account was unchanged.

- Direct navigation to Tutor redirected to checkout after trial expiry.
- Monthly checkout showed Sandbox, $9.99/month, correct QA email and recurring terms. The documented declined test card displayed a decline and left the profile without paid access or Stripe linkage.
- Successful monthly test payment returned to the preview Home. Stripe session `cs_test_b1COtqWlx7NSy2rIZQAG2oNGpGfhjKdJyoZHb232s9KiOiDYwkvOpDa7An` completed, paid 999 USD cents, livemode false. Subscription `sub_1UQq4zGnwd1bHIvcAhcJ69kc`, customer `cus_VRjXDUnoxRB7P7`, invoice `in_1UQq4xGnwd1bHIvcoiuAJd1S`. Checkout completion `evt_1UQq51Gnwd1bHIvc8qY1zgrw` and invoice payment `evt_1UQq50Gnwd1bHIvc0UHYmdCH` succeeded in app logs. Profile became active/monthly; Account displayed Subscription active.
- Scheduled cancellation through the sandbox API retained active status. Event `evt_1UQq5uGnwd1bHIvcxw18VkNU` succeeded, and Tutor loaded after the QA account completed its practice-material acknowledgement and BSN fixture selection. The current Account page offers cancellation through support, not a self-service cancellation button; this is not a browser cancellation-flow claim.
- Immediate sandbox cancellation (no proration or invoice) produced `evt_1UQq6lGnwd1bHIvc5EMQ40n5`, succeeded, profile expired. Reloading Tutor redirected to checkout. This verifies revocation after immediate cancellation, not natural period-end expiration.
- Annual selection updated the checkout fine print to $79/year. Hosted checkout showed Sandbox and $79.00 billed annually. Session `cs_test_b1fgsB5VmFhuYkNHfCm6ogDDLQITd6NvzGCVaK9UCPNpZVnEcCNtzZkgVL` completed, paid 7900 USD cents, livemode false; subscription `sub_1UQq8xGnwd1bHIvc8k16ysf4`, customer `cus_VRjcmjULPe22No`, invoice `in_1UQq8vGnwd1bHIvcJYKYV196`. Preview Home returned and the profile became active/annual. Checkout `evt_1UQq8zGnwd1bHIvcqWa46Q1d` and invoice payment `evt_1UQq90Gnwd1bHIvcnsxzpAlT` succeeded.
- Annual cleanup cancellation `evt_1UQq9eGnwd1bHIvc249C0A4d` succeeded. Both browser-created subscriptions are canceled. Restored and verified the QA profile to trialing, original expiry `2026-10-22T14:39:51.839167Z`, is_beta false, null Stripe links, free_trial tier and quiz-first enabled. Browser Account again shows Trial ends Oct 22, 2026. Evidence: `docs/qa/evidence/billing-qa-trial-restored-2026-10-15.jpg`.
- No live charge was made. Link's optional information-saving checkbox was disabled. Checkout may send its normal subscription confirmation to the designated QA email; receipt was not independently checked. These tests do not establish renewal, failed renewal, or natural period-end expiration.

### Webhook ordering follow-up

Both `customer.subscription.created` deliveries arrived before checkout linked the customer and were recorded failed: `evt_1UQq50Gnwd1bHIvceuODUUVG` and `evt_1UQq8zGnwd1bHIvcgG4JDK6X`. Checkout completion subsequently succeeded. These failures remain recorded honestly and are retryable; no successful retry is claimed.

Code inspection identified a separate retry hazard: both normal delivery and the retry handler applied the historical subscription snapshot. Added a shared reconciler that retrieves current Stripe status before updating access, ignores a superseded subscription, and conditions the write on unchanged customer/subscription linkage. Missing linkage remains a retryable failure rather than falsely acknowledging delivery. Six regression cases cover stale active and past-due events, replacement subscriptions, missing linkage, conditional writes and Stripe retrieval failure. No guarantee of global serialization across simultaneous Stripe changes is claimed.

Production remains held for the remaining release gates above. The temporary webhook bypass still requires cleanup after the deployed follow-up is verified.


### Deployed follow-up and cleanup checkpoint

- Commit `b3b6e3333eea900208a861662a5f5e1bf896d766` deployed READY as `dpl_F1zJTQom1ZrC7BrpiwM4foGrwKZd`, preview `forgenursing-onek21we3-michaels-projects-b1fddaa4.vercel.app`; branch alias updated. Remote tree matches the locally tested tree. All 178 tests across 25 files passed, TypeScript passed, and lint for the new helper/regression file passed.
- Temporarily linked the old isolated synthetic fixture to its original canceled sandbox customer. A metadata-only update emitted genuine event `evt_1UQqI9Gnwd1bHIvcmadxQMgU`, recorded succeeded by the deployed handler. Profile became expired from current Stripe status. Restored and verified that fixture to its original trialing/null-link state. This is a deployed handler check; stale delivery behavior is covered by regression tests, not a claimed manual resend.
- Disabled sandbox webhook `we_1UQn2AGnwd1bHIvcjoDX2Nxk`; Stripe returned status disabled. Both browser-created subscriptions remain canceled and the dedicated login account retains its original trial.
- **Bypass revocation is still blocked.** The Vercel connector returned 403 for revoking the approved temporary automation bypass. The previously approved dashboard fallback was attempted, but browser credential protection blocked observation even after navigation recovery. Manual handoff opened the existing Vercel tab. Owner needs Project Settings > Deployment Protection > Protection Bypass for Automation and must revoke the entry noted `ForgeNursing sandbox billing QA 2026-10-15 — revoke after testing`. Do not paste the bypass value into chat. The sandbox webhook is already disabled.
- Production remains unmerged/unreleased. Remaining checks include renewal/failed renewal/natural cancellation, mobile layout, actual concurrent HTTP delivery, outstanding tutor evaluation wording, and the real delayed review due `2026-10-16T03:01:31.900607Z` (October 15, 10:01:31 PM America/Chicago).


### Bypass removal verified — October 15, 2026, after 10:24 AM America/Chicago

The owner confirmed removal. After a permission-review timeout and a transient browser connection interruption, the dashboard recovered. Project Settings > Deployment Protection displayed the empty Protection Bypass for Automation list: “Add a secret that can be used to bypass Deployment Protection for this project.” No bypass entries remained. Vercel Authentication / Require Log In remained enabled with Standard Protection. No settings were changed during this verification. This supersedes the blocked cleanup checkpoint above: temporary bypass cleanup is complete, and the sandbox webhook remains disabled.

Remaining release gates are unchanged. In particular, the real delayed review cannot be exercised before `2026-10-16T03:01:31.900607Z` (October 15, 10:01:31 PM America/Chicago). No production release or publication is claimed.


## Additional release checks — October 15, 2026

- Actual concurrent browser delivery: two signed-in tabs opened session `d3bf7279-29fa-4c20-85eb-d6542ed74182`, selected conflicting A/C answers to question `a26ea969-3ded-4848-ba94-f36a62ecb85a`, and invoked Submit concurrently. Both UI submissions completed and both tabs displayed the same saved A answer and its matching incorrect-answer feedback. Database verification showed one answered question, first answer A, and exactly one review with due_at minus missed_at = one day. This closes the two-tab first-answer race smoke check, not a load/stress-test claim.
- Temporary preview-only responsive route was deployed at commit `50ce4379b4dda3cc02b4e45ce73b5ff492f30bdf`. Landing-page layouts rendered in nominal 320/390 px iframes; the 320 frame's actual content width was 312 px with equal scrollWidth, so no horizontal overflow was observed in that document. The narrow header wrapped its CTA across lines. These are Chromium frame observations, not an iPhone Safari test. Credential-protection observation failed when navigating to authenticated Home and remained blocked after explicit navigation. Remaining mobile screens/interactions are NOT verified.
- Removed the temporary route in commit `ecd2bb7eae19396438df1b4af84bbb2f913219dc`; it must not ship as product UI.
- Captured initial delegation explanation, alternate explanation, and wrong-rationale correction in `docs/qa/evidence/tutor-delegation-2026-10-15.json`. The tutor rejected the false claim that UAPs cannot notice/report changes. However, the alternate explanation's “no license required” shortcut was overbroad, and the first response withheld a full explanation after the learner had already attempted reasoning.
- Prompt correction `0cb03b5b14a0d6c60fdce5e39b7cf736d6182f80` specifies delegation limits and direct feedback after attempted reasoning. The corrected code (with QA route removed) deployed READY as `dpl_ESMMEeNNu7W39JRwrMkjPFrhvEdc`, preview `forgenursing-pbbp4ygpl-michaels-projects-b1fddaa4.vercel.app`. All 178 tests/25 files and TypeScript passed. Incremental lint: zero new/blocking errors, 451 legacy errors, 16 warnings, one baseline entry resolved. Tests do not establish model-response correctness.
- Recheck conversation `9a801573-7b23-4463-9e40-db4a15b2dfee` gave B and explained the attempted answer directly, provided a different example without repeating the “no license required” phrase, and corrected the false reporting rationale. This is one follow-up sequence, not the full three-repeat rubric. The new pressure-injury example and universal scope wording still need source/wording review; do not mark broad tutor evaluation complete.
- Stripe connector operation discovery again did not expose test-clock advancement. Dashboard fallback reaches a separate Stripe sign-in wall. Renewal, failed renewal, and natural period-end cancellation remain pending. The sandbox webhook stays disabled, and the Vercel bypass remains revoked; renewed end-to-end webhook tests need a reachable approved sandbox endpoint. No live Stripe writes were made.
- Scheduled continuation for the real delayed review at October 15, 10:03 PM America/Chicago, just after its genuine due time. No dates were backdated. A scheduled continuation is not a passed check.

Production remains unmerged/unreleased. Remaining: complete tutor repeat/source review, remaining mobile/browser acceptance, sandbox renewal lifecycle, and genuine delayed-review acceptance. Production content publication/flag enablement and a production-configured build come only after those gates; never promote a sandbox-configured preview build to Production.

Tutor recheck evidence is saved in `docs/qa/evidence/tutor-delegation-recheck-2026-10-15.json`. The deliberate wrong-key follow-up was rejected, but it produced unsupported assertions about every jurisdiction's nurse practice act and NCSBN/NCLEX standards despite the prompt's evidence policy. **Tutor release gate remains open; the prompt correction is not a validated resolution.** Further fixes and fresh repeated deployed checks are required.

### Stripe browser access checkpoint — October 15, 11:36 AM Central

Owner reported successful sign-in. Inspection was blocked by native credential protection. One explicit navigation to https://dashboard.stripe.com/ returned only an empty Dashboard root; the subsequent observation was again blocked. This does not establish an authenticated account or sandbox selection. No further browser recovery or credential-entry attempts were made. Connector search for advancing existing test clocks returned no matching operations in OpenAPI 2026-09-30.preview. Renewal lifecycle remains unverified; no billing mutations or production release occurred in this continuation. Do not ask the owner to repeat ordinary sign-in as though the current problem were an incorrect credential.

## Current release checkpoint — October 15, 2026, after remaining-checks continuation

This section supersedes earlier status counts, but preserves the historical failures above.

### Completed this continuation

- Final local source and test files match remote branch source/test files exactly (git diff against fetched branch returned empty). **191 tests across 26 files passed**. TypeScript passed. New/changed AI helper and regression files pass ESLint. Incremental lint passed with **0 new/blocking errors, 451 legacy errors and 16 warnings**, one resolved baseline entry; full lint is not clean.
- Latest source/test preview commit `e6e00e9d9a245301f266658ac3c365af998ecf65` built READY: deployment `dpl_EL5DSCisEyggwKthruQNUCDvkmUW`, `forgenursing-hh8gju1ex-michaels-projects-b1fddaa4.vercel.app`. Production was not changed.
- Appended a final evidence policy after all dynamic tutor instructions. Prompt-only recheck still made a universal jurisdiction assertion (captured in `docs/qa/evidence/tutor-final-policy-failure-2026-10-15.json`); it was not accepted as a fix.
- Added a narrow server output guard for the observed unsupported jurisdiction and exam-authority patterns. It buffers the completed response before emitting learner-facing text, preserves stream finish metadata, and discards interrupted drafts. This introduces complete-response latency. It is a known-pattern safeguard, with possible false positives and unrecognized phrasings, **not clinical validation**.
- Initial guarded deployment missed “any U.S. jurisdiction”; recorded that failure in `docs/qa/evidence/tutor-guard-initial-recheck-2026-10-15.json`, expanded the pattern and added a regression. A build then failed because the regex Unicode flag exceeded the project's TypeScript target; replaced it with target-compatible syntax and verified successful subsequent builds.
- Regression coverage includes captured claims split across chunks, ordinary source-neutral teaching, emergency escalation, interrupted/truncated streams, and actual AI SDK `streamText` / data-stream response protocol integration.
- Three independent fresh wrong-key conversations on guarded code rejected A and selected B without the prior jurisdiction/NCLEX-authority claims. The first was observed in browser and storage; two others were confirmed from stored synthetic QA messages after browser observation failed. **Unsupported certainty and speculation about why the answer key author erred remain; the broader tutor release gate is OPEN.** A fourth interrupted attempt was not counted. An editing-exercise refusal was model behavior, not proof that the server fallback fired live.
- One fresh emergency probe immediately directed the learner to qualified help without dosing or a treatment sequence. The UI still appended study questions; expanded the handoff detector with three observed/variant regression cases. Reloading the deployed conversation confirmed the study nudges are absent. This is one fresh emergency run, not a complete repeated emergency evaluation.
- Exact current probe messages and limitations: `docs/qa/evidence/tutor-guard-final-checks-2026-10-15.json`.
- Mobile code review fixed narrow-screen Progress card stacking, long Account value wrapping, missing safe-area top padding and bottom content clearance above fixed navigation. These static fixes are saved. **Authenticated phone-width and Safari interaction acceptance remain unverified**; the available controlled browser exposes no viewport resize. The temporary responsive QA route remains removed.

### Remaining sandbox lifecycle fixtures are ready

Evidence: `docs/qa/evidence/billing-renewal-fixtures-2026-10-15.json`. Dedicated sandbox only: `acct_1SoyM3Gnwd1bHIvc`, livemode false. New clock `clock_1UQriKGnwd1bHIvc6t7uRygA`, named **Forge release remaining lifecycle QA 2026-10-15**, starts at `2026-10-15T17:00:00Z`. Three synthetic customers have no email addresses and no linked Forge profiles. Each initial invoice is paid 999 USD cents.

| Scenario | Subscription | Prepared state |
| --- | --- | --- |
| Successful renewal | `sub_1UQrjHGnwd1bHIvc3c2hq8fr` | Active, successful test payment method |
| Failed renewal | `sub_1UQrjLGnwd1bHIvcqaIAx39u` | Active after paid initial invoice, then replaced customer payment source with documented charge-failure test token; default subscription payment override absent |
| Natural cancellation | `sub_1UQrjPGnwd1bHIvcRoUUe2Pd` | Active with cancel_at_period_end true |

Period end is `2026-11-15T17:00:00Z`. Required manual action in Stripe sandbox: Billing → Subscriptions → Simulations → open the exact clock name above → **Advance time to November 16, 2026, 11:00 AM America/Chicago (`2026-11-16T17:00:00Z`)**. The connector does not expose clock advancement, and browser credential protection persists; do not request repeated ordinary sign-in. After advancement, read resulting subscriptions/invoices/events and verify actual outcomes; fixture setup is not a renewal pass.

The sandbox webhook remains disabled and the temporary Vercel bypass remains revoked. Clock advancement alone verifies Stripe-side behavior, **not application entitlement changes**. End-to-end lifecycle checks additionally require a reachable approved sandbox webhook endpoint and isolated profile linkage/cleanup. Do not recreate a project-wide security bypass without the necessary approval. No live Stripe records were changed.

### Release decision and next checks

**HOLD — not production-ready.** Remaining gates:
1. Broader tutor wording/source and repeated rubric evaluation; current mitigation does not close it.
2. Authenticated mobile/browser acceptance of Home, practice/retry/review/results, Progress, Account and Tutor.
3. Successful/failed renewal and natural period-end cancellation, followed by signed app webhook and access-transition verification.
4. Genuine delayed-review acceptance after `2026-10-16T03:01:31.900607Z` (October 15, 10:01:31 PM America/Chicago). Continuation is already scheduled for 10:03 PM Central, automation `6ad0fc3a1c2c819196ebbf3295b8a665`; a schedule is not a passed check.

Then confirm production environment/live billing configuration, publish the frozen source-checked production bank and enable the intended production flag through the approved release process. Build with Production configuration; **never promote the sandbox-configured preview build**. Merge, production content publication and production deployment remain undone. The source-checked designation and lack of independent RN validation must remain explicit.

### Clock advancement results verified — October 15, 2026, after 12:18 PM Central

Owner advanced the intended sandbox simulation to November 16, 2026, 17:00 UTC (screenshot). Subsequent read-only Stripe API inspection confirms all three prepared **Stripe-side** lifecycle expectations:

- Successful renewal: subscription `sub_1UQrjHGnwd1bHIvc3c2hq8fr` remains active, period advanced to November 15–December 15. New cycle invoice `in_1UQsHNGnwd1bHIvc7ZCFpmFk` is paid, USD 999 cents, zero remaining, one payment attempt.
- Failed renewal: subscription `sub_1UQrjLGnwd1bHIvcqaIAx39u` is past_due. New cycle invoice `in_1UQsHPGnwd1bHIvcMjzXGU8n` is open after one attempted collection, zero paid, USD 999 cents outstanding; Stripe has a next_payment_attempt scheduled. This verifies the initial failed renewal, not exhausted retries or eventual cancellation.
- Natural period-end cancellation: subscription `sub_1UQrjPGnwd1bHIvcRoUUe2Pd` is canceled, ended_at `1794762000` (November 15, 17:00 UTC), matching its scheduled period end. The complete invoice list contains only its original paid invoice, with no renewal invoice.

All objects are livemode false and belong to `clock_1UQriKGnwd1bHIvc6t7uRygA`. Exact selected non-sensitive API evidence is saved in `docs/qa/evidence/billing-renewal-results-2026-10-15.json`. No payments or subscription settings were changed during verification.

This closes the three pending Stripe-side simulation checks. It does **not** close signed application webhook delivery or browser/server entitlement transitions for these outcomes: the sandbox endpoint remains disabled, the security bypass remains revoked, and these synthetic customers have no linked Forge profiles. Do not finish/delete the simulation before remaining app integration work has a verified evidence/fixture plan. Production remains held for application billing lifecycle, tutor evaluation, mobile acceptance and genuine delayed-review acceptance.

### Continued QA after 1:09 PM Central — latest prompt revision and access blockers

- Read current Library rubric v0.2 and Batch 1 revision 3. Preserve the owner's source-checked release choice; no independent clinical approval is claimed.
- Removed conflicting response-template instructions and replaced the tutor's exclusive-Socratic identity with direct explanation of attempted reasoning. Disputed answer keys now use a concise, scenario-specific review that states missing-source limits and avoids author-motive speculation. Changed the TRAP instruction from an unsupported “most common mistake” claim to the actual reasoning mix-up.
- Latest source commit `9a3f5c87b3a59c535fc933f5a6fa54ec6af8faad` built READY as `dpl_BKJub7mDawthcKZKVMiEeBtAvmTf`, preview `forgenursing-bob4su4kh-michaels-projects-b1fddaa4.vercel.app`. All 191 tests/26 files, TypeScript and incremental lint pass. Lint remains 451 legacy errors/16 warnings, zero new blocking errors. No SDK upgrade or model change was made.
- **Fresh model checks on this revision have NOT executed.** Browser inventory first returned retained-data restriction; its prescribed fresh-document recovery initially restored the signed-in tutor. Reload after deployment then failed with native credential-observation restriction. One explicit navigation recovery to Home also failed. Stopped browser attempts; do not repeatedly ask the owner to sign in or use another automation/network method to evade the browser restriction.
- Frozen the remaining 27-response, three-repeat behavior plan in `docs/qa/tutor-release-probe-plan-2026-10-15.json`. Earlier response samples apply to older prompt configurations. Current tutor gate remains open.
- Billing code tracing confirms subscription events retrieve current Stripe status; active grants access, past_due/unpaid map to past_due and block paid access, canceled maps to expired. This is code evidence, not a deployed signed-delivery/access test for the new fixtures. Vercel project inspection confirms authentication remains enabled for previews. The existing sandbox webhook remains disabled and its former bypass revoked.
- Official Vercel guidance identifies project-wide automation bypass as the supported third-party webhook mechanism. No new bypass, public preview exception, or share link was created. A temporary bypass needs explicit approval plus a verified cleanup path; previous connector creation/revocation returned 403. Browser credential restriction is a separate problem and should not be conflated with Vercel deployment protection.
- Mobile static checks found no additional fixed-width constraints in the quiz/retry/results/review component scan. This does not establish phone rendering or interactions. Actual 320/390-width authenticated acceptance and Safari remain unverified.
- Private automation lookup confirmed the delayed-review task is enabled with DTSTART;TZID=America/Chicago:20261015T220300. No duplicate task or schedule change was made.
- Exact bounded next steps and mobile acceptance checklist: `docs/qa/remaining-release-acceptance-2026-10-15.md`.

**Still HOLD.** No production publication, merge or deployment. Work is now blocked on protected webhook access/approval, usable browser observation for new tutor runs, actual mobile viewport acceptance, and the genuine delayed-review due time.

### Temporary webhook access approved, creation blocked — October 15, 1:28 PM Central

Owner explicitly approved recreating the project-wide temporary Vercel automation bypass solely for sandbox billing tests and revoking it afterward, with manual cleanup risk disclosed. The authorized connector request returned HTTP 403: permission to create the protection bypass denied. No bypass was created. No installed Vercel CLI was available for the mapped fallback. The previously established native browser credential-observation restriction remains unresolved; no repeated login was requested.

Read-only Stripe inspection reconfirmed existing sandbox endpoint `we_1UQn2AGnwd1bHIvcjoDX2Nxk`, description “ForgeNursing preview-only billing QA 2026-10-15; revoke access after testing”, is disabled and livemode false, with the expected six event types. It still points to the release-branch /api/stripe/webhook destination. Secret-bearing query values were not disclosed.

Concrete manual continuation: owner creates the approved temporary automation bypass in Vercel, replaces only the existing sandbox endpoint URL's x-vercel-protection-bypass query value with that new secret, saves, then enables the existing endpoint. Retain its signing secret and event selections; do not create a new endpoint or touch live Stripe. Never paste the bypass value into chat. After owner confirms, verify endpoint state through the Stripe connector and continue isolated-fixture signed-event/profile checks. Browser access checks remain separately blocked. After tests disable the endpoint and revoke the temporary bypass; verify cleanup, requesting owner removal if connector revocation again fails.

### Signed lifecycle reconciliation passed — October 15, after 1:36 PM Central

Owner completed the approved temporary bypass creation and sandbox endpoint update/enabling. Connector inspection confirmed the existing endpoint enabled, livemode false, expected branch webhook destination and event selection. Secret-bearing URL values were never disclosed.

Temporarily linked only designated QA profile `b3aabc19-9155-4dc3-8741-de8bfb31284a` to each prepared synthetic subscription in sequence. Billing status was not manually set to the expected result. A metadata-only update emitted a genuine signed `customer.subscription.updated` for each. Deployed app logs and profile reads verified:

| Stripe outcome | Signed event | App processing | Resulting profile status |
| --- | --- | --- | --- |
| Renewed active subscription | `evt_1UQtWnGnwd1bHIvcuw3DaTTV` | succeeded | active |
| Failed renewal, past_due | `evt_1UQtXIGnwd1bHIvc8WfLhIR5` | succeeded | past_due |
| Natural period-end cancellation | `evt_1UQtXgGnwd1bHIvcZsYi8SuW` | succeeded | expired |

This verifies real signature acceptance and current-subscription reconciliation after the three simulated outcomes. It is NOT a claim that the original renewal/cancellation events were redelivered, and it does NOT establish new server-response/browser access acceptance while native browser observation remains restricted.

Restored the QA profile conditionally and compared every captured billing field to its pre-test snapshot: exact match. Status trialing, original October 22 expiry, beta false, null Stripe customer/subscription links, quiz-first true, free_trial tier. Main owner account and live Stripe were untouched. Disabled sandbox endpoint `we_1UQn2AGnwd1bHIvcjoDX2Nxk`; Stripe confirmed disabled.

**ACTION REQUIRED: temporary bypass remains active.** Authorized revocation returned Vercel 403 permission denied. No CLI is installed, and the established browser restriction prevents dashboard cleanup. Owner must revoke the temporary Protection Bypass for Automation entry just created for these remaining sandbox lifecycle tests. Do not repeat the failed unchanged connector request or claim removal before verified/reported evidence. The sandbox endpoint is already disabled.

Exact non-secret evidence: `docs/qa/evidence/billing-lifecycle-signed-reconciliation-2026-10-15.json`.

Remaining release gates: temporary-bypass cleanup; actual access acceptance after billing states; fresh tutor probes on code `9a3f5c87b3a59c535fc933f5a6fa54ec6af8faad`; authenticated mobile acceptance; genuine delayed review at its scheduled due time. Production remains held.
