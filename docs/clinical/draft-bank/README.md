# Draft-bank integration checkpoint — 2026-10-14

## Outcome

Revision 2 of the 180-item draft is now versioned in this checkout at `content/drafts/question-bank-v1.json`. It contains 60 families, each with an original, retry, and delayed-review item. All items remain `draft_ai_reviewed`, `eligible_for_production: false`, and `independent_clinical_validation: false`.

The offline `preview.html` permits editorial inspection of all questions, choices, keys, rationales, and source links. Answers are saved locally under this exact bank hash when browser storage is available. It sends no analytics and has no database connection. Its three role totals remain separate. It does not exercise the signed-in application or scheduler, and is not a public study release. A file previewer that disables JavaScript will require downloading and opening the HTML in a browser.

## Editorial corrections

| Item | Correction |
|---|---|
| qb1-d06-v1 | Replaced home-caregiver teaching with a scope-and-competence assignment scenario that tests the original distinction. |
| qb1-p03-v1 | Replaced fall prevention with urgent bleeding recognition, retaining the distinction about circulation. |
| qb2-f18-r1 | Replaced a “none of these” answer with a concrete expired-medicine decision. |
| qb2-f18-v1 | Replaced an in-date storage problem with an expired unopened-product scenario. |
| qb3-g20-r1 | Replaced reporting-threshold recall with consistent daily-weight measurement. |
| qb1-i05-r1 | Explicitly placed mask removal after gloves, eye protection, and gown in CDC Example 1. The earlier stem risked implying removal with contaminated gloves. |
| qb1-i01-v1 | Replaced editorial language about “claiming a seal” with a wrist-coverage application question. |

Two family labels were narrowed: `right-circumstance-client-must-be-stable` became `delegation-circumstances-and-change`; `abcs-airway-first` became `postoperative-stridor-urgent-airway-assessment`. These changes do not claim that every stable-client task is delegable or that an ABC mnemonic determines every emergency sequence.

All answer letters were preserved. Each role still contains 15 A, 15 B, 15 C, and 15 D keys. Content hashes were regenerated using an explicit canonical UTF-8 JSON algorithm. The complete bank hash also covers source links, roles, parent IDs, scope notes, and family mappings; a question-text hash alone is not a publication approval.

Source checks used for these corrections:

- [CDC PPE sequences](https://www.cdc.gov/healthcare-associated-infections/media/pdfs/ppe-sequence-p.pdf)
- [FDA expired medicines](https://www.fda.gov/drugs/safe-disposal-medicines/dont-be-tempted-use-expired-medicines)
- [AHA heart-failure monitoring](https://www.heart.org/en/health-topics/heart-failure/living-with-heart-failure-and-managing-advanced-hf/physical-changes-to-report-for-heart-failure)
- [WTCS delegation and supervision](https://wtcs.pressbooks.pub/healthalts/chapter/1-8-delegation-and-supervision/)
- [WTCS prioritization](https://wtcs.pressbooks.pub/nursingmpc/chapter/2-3-tools-for-prioritizing/)

This was a targeted AI editorial/source pass, not a new exhaustive clinical validation of all 180 items. Foundational distractors, near-paraphrase variants and incomplete NCLEX coverage remain limitations.

## Staging contract

`src/lib/learning/draft-bank.ts` validates the retained export, verifies content hashes, checks unique IDs/stems/options and full option rationales, and requires exact family metadata and parent links. It translates to the app's display/grading field names without manufacturing a difficulty rating, clinical cue, one-line teaching rule, provenance, or clinical approval ID. Those unauthored fields remain absent.

The existing temporary content hold also applies to draft selection and the preview builder. Seen variants return no fresh item; the helper does not silently select another family. Selection here is content inspection, not an actual due review.

No production route imports this module. No publication approval was created, existing clinical gate weakened, database migrated, production page changed, student history rewritten, or PostHog event emitted.

## Verification

- 161 tests pass across 22 files, including seven new staging tests.
- TypeScript check passes.
- DOM simulation of the generated preview exercised every question against its stored key. One deliberately incorrect original remained 59/60 while retry and delayed-review totals independently reached 60/60.
- Preview duplicate submission did not change counts. Reload restored saved responses; clearing responses and rejecting invalid locally stored answers worked.
- This simulation used the existing local Happy DOM dependency. It is not a real-browser visual/accessibility check or an authenticated database test.

Reproduce bank and software checks:

```sh
node --import tsx scripts/clinical/stage-draft-bank.ts content/drafts/question-bank-v1.json docs/clinical/draft-bank/staging-report.json
node --import tsx scripts/clinical/build-draft-preview.ts content/drafts/question-bank-v1.json docs/clinical/draft-bank/preview.html
npx vitest run
npx tsc --noEmit
```

## Remaining release work

1. The 60 editorial distinctions currently have no exact entries in the runtime's eight-item taxonomy. They must be deliberately registered as new provisional concepts without rewriting historical events or assigning broad-topic aliases.
2. The existing `ClinicalPacket` requires at least three delayed variants per family. This draft has one. Publishing under that format would require 120 additional delayed variants. Alternatively, an explicitly limited one-review content format would need implementation and exhaustion tests; the current gate has not been silently reduced.
3. Difficulty, key cues, one-line teaching rules and packet provenance/reference sections still need authored values. The staging adapter does not guess them.
4. The current publication path requires independent clinical approval. The owner has declined RN review. A truthful source-reviewed publication path would need to be explicitly designed, labeled, and implemented separately; do not fabricate approval or present AI review as equivalent. No new request to recruit an RN is made by this checkpoint.
5. After the publication model and schema are resolved, test original miss → retry → genuinely due review against authenticated preview persistence, access controls, concurrency, source withdrawal, content exhaustion, original-score separation, and real opportunity-linked analytics. The offline workbench does not satisfy those acceptance checks.

The full bank is staged for review, not integrated into student-facing production. The earlier 154-test reliability checkpoint and its clinical incident remain separate evidence; the new tests do not clear that incident or certify the tutor.
