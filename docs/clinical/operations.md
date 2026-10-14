# Clinical content and learning-loop operations

## Current boundary

No clinical approvals are created by this release. The eight exported sample pairs are explicitly **unreviewed**. Dynamic practice continues to carry an AI-generated label. New generation receives model/prompt provenance; historical provenance is not guessed. Controlled concept mappings on generated or sample questions remain provisional.

Delayed review delivers only immutable packets approved by an independent qualified RN. The queue is built, but cannot serve students until reviewed packets are published and students miss an original from one of those packets. It does not backfill unreviewed historical misses. This preserves the difference between implementation readiness and clinical approval.

## Review and publish

1. Use `node --import tsx scripts/clinical/export-demo-packets.ts <output-dir>` to export all current sample pairs. These are review inputs, not publishable approvals. The checked-in snapshots preserve the starting material.
2. Reviewer completes rubric v0.2, reference checks, original/retry transfer assessment, and at least three distinct delayed variants. Use `ClinicalPacket` in `src/lib/learning/clinical-content.ts` as the exact JSON schema. Only NCLEX-RN packets are currently publishable.
3. Freeze the packet and calculate `packetHash(ClinicalPacket.parse(packet))`. Reviewer signs an approval record with that exact SHA-256, independent-review statement, license-verification record, rubric version, timestamp, resolved-criteria statement and retained review record. Software checks fields and integrity; an operator independently verifies reviewer identity/credentials and the actual review evidence.
4. Set server-only Supabase credentials in the operator environment. Run `node --import tsx scripts/clinical/publish.ts packet.json approval.json` to validate without publishing. Append `--publish` only after verifying the human review. No student-facing approval endpoint exists.
5. Publication is insert-only by packet/version/hash; content is immutable. Correction requires a new version and new approval. Withdrawal is permanent: set withdrawn_at and withdrawal_reason with privileged operator access. It prevents future generation/retry/review delivery and grading; already-viewed/history text is not erased.
6. Initial review is due 24 hours after an original miss. A correct delayed answer schedules the next unused variant after 3 days, then 7 days; a miss schedules the next unused variant after 1 day. All review outcomes are separate from the original score. After the approved variants are exhausted the queue ends, without a mastery claim. Resuming a started review keeps its variant and attempt ID.

## Tutor evaluation

The prompt now explicitly challenges faulty keys, identifies insufficient evidence, refuses fabricated citations, and directs real-patient requests to qualified help. Those instructions are not clinical validation. Use rubric probes against the actual production tutor configuration and have the independent reviewer score saved responses. The current release includes a probe runner for repeatable base-prompt evaluation; uploaded-source, image and full conversational integration require additional clinician-reviewed runs.

## Measurement

V2 events distinguish eligible miss, offered, tapped, loaded, failed and answered. Each retry links to its original question instance even across sessions. Immediate retries are optional and limited to the first retry per original; subsequent requests resume the same retry rather than generate an endless chain. Results-page offers share the same ID as rationale-page offers.

Reports deduplicate opportunities and question instances. Immediate final rates use 24-hour mature cohorts; pending counts remain visible. Separate public sample and signed-in experiences, QA and public traffic, and provisional versus reviewed mappings. Do not interpret a generated concept label as validated clinical transfer.

Delayed answer events exist, but a complete due-cohort return report requires authoritative queue data from the database. Do not use page views as a substitute for due opportunities or call answer-only data a return rate. Do not claim causality, exam readiness or proven retention from these observational reports.
