# Bank 4 audit handoff

Start with **questions.md**. It has all 30 questions, grouped by family and Q001 Original / Q002 Immediate retry / Q003 Delayed review. Derive each key independently before opening the collapsed author-key and rationale section.

- `preview.html`: self-contained offline editorial question/answer preview. Download and open in a browser if the file viewer disables scripts. This is not a staging learner route or a scheduler test.
- `audit-ledger.csv`: blank per-item key/verdict/source/distractor/category/variant ledger for Muse. No approval values were prefilled.
- `source-notes.md`: section-specific source checks, scope limits, known ambiguity boundaries, publication requirements and fresh-trial blocker.
- `staging-report.json`: structural dry run; publishable count remains zero.
- Repository source: `content/drafts/question-bank-4.json` and `content/drafts/teaching-points-bank-4.tsv`.

Status: all 30 are drafts, not published or counted toward the launch gate. The existing 180-question source is unchanged. Approval of all 30 would permit packet conversion and preview acceptance toward a possible 210-question catalog; it does not itself ship them.

Validation performed: retained draft parser/content hashes/role-parent checks, 30 items and 10 families, no exact ID/stem/distinction collision with existing draft, dynamic-count preview generation, seven retained draft-bank tests, TypeScript and incremental lint gate. No browser, independent key derivation or clinical approval claimed.

No new app deployment URL is needed for this content handoff: these files are editorial artifacts on the release branch. The accepted app preview remains https://forgenursing-eo7xu7zqo-michaels-projects-b1fddaa4.vercel.app until superseded by a later branch deployment.
