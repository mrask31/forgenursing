# Full app audit remediation October 25 2026

Owner supplied a first-hand production and staging audit on October 25. Treat its unverified actions as unverified. Prior October 16 acceptance does not prove current production acceptance. Required production gates remain held.

First batch implemented:
- Checkout retrieves the selected Stripe Price before creating a session and requires the advertised USD 999 monthly or USD 7900 annual price, active, recurring, licensed, one-period interval. Rejects mismatches with 503 before creating checkout. Duplicate configured IDs are rejected. Does not mutate live prices or existing subscriptions.
- Current release already retires new founder purchases with HTTP410 and standard-only pricing; production founder-flow mismatch remains reported, not live-fixed. No founder rate has been invented or published into legal copy.
- Signup middleware no longer redirects signed-in users away; page displays existing identity with Account and explicit sign-out action instead. Anonymous signup validation retained. Clean-session browser acceptance still required; audit's in-session behavior is not evidence anonymous signup fails.
- /practice redirects to /quiz; branded root not-found with Home/Practice/FAQ links.

Validation: 204 tests across28files, TypeScript and incremental lint passed. Lint has zero new/blocking errors,451 legacy errors,16warnings. New route regressions confirm configured$129 annual and wrongcurrency/interval/inactive/metered prices never createcheckout. No deployed browser verification claimed.

Access blocker: Stripe connector lists only CreaseOS accounts and sandbox. Do not use those accounts for ForgeNursing. ForgeNursing live price/config checks and portal configuration require the proper connection. No financial transactions, cancellations or credential changes performed.

Review investigation: code schedules only eligible missed original questions backed by available source-checked/clinical publications, not arbitrary generated items or retry misses. Separate source_question_id keys prevent a later miss from overwriting an earlier queue row. Do not implement unconditional generation/backdating as a fake fix. Audit session-level comparison still required.

Remaining audit work: review queue clarity/coverage and missdebrief retry resumption; billing/account selfservice; shared suggestion engine; unauthenticated review flow; tutor dead Save/Flag promises/course context/history hygiene/blankresumption; taxonomy integrity and withinset duplication; stale home/course UI; in-app help; production bank rollout after gates; mobile/Safari. Trends/streaks are product proposals, not established defects. Source-check versus AIgenerated disclaimers must remain distinct and truthful while mixed content exists. Do not merge duplicate learner history or change clinical packet hashes silently.
