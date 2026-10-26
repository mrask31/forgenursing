# Bank-default daily practice — October 26, 2026

Product decision: source-checked bank originals are default daily practice; generated questions are an explicit supplement. Prior pagination acceptance on f05d2117 passes: 50 to 85 sessions, no pagination duplicates, older NUR 400 cold-opens, switching and Back/retry pass.

Implementation: new generic/mixed session requests default to bank even if the request omits practiceSource. If the source-checked rollout flag is off, return bank_not_enabled instead of silently creating generated sessions. Bank exhaustion remains explicit with no generated fallback. Existing frozen-bank RPC maintains original/retry/review scoring and scheduling. Uploaded-note practice stays separate. Explicit practiceSource=generated creates a session marked generated_supplement_v1; question generation skips curated-bank selection for that marker. No migration or clinical packet edit.

Home identifies daily bank practice. Mixed/topic/suggested are bank choices. Generated supplement is under a separate expandable chooser with an honest no-scheduled-review explanation. Copy identifies bank content as AI-assisted/source-checked, not independently clinically validated.

Validation: 232 tests across 33 files, TypeScript and incremental lint pass. Regression tests verify default-bank requests cannot fall through when rollout is off; explicit supplement works separately. Browser acceptance remains pending.

Deployment prerequisite: SOURCE_CHECKED_PRACTICE_ENABLED=true in Preview scoped to codex/release-reliability, with existing valid preview publication. Environment access remains denied through Vercel connector; no flag change claimed. Production publication/flag and rollout remain separate release gates.

Acceptance: Home starts bank originals; Mixed and Topic start bank originals; wrong original schedules one future review; generated supplement explicitly generates and does not schedule bank review; retry separately scored; refresh/resume preserves source; exhausted bank explains exhaustion instead of silently generating. No learner backdating, trial extension, price cleanup or production deployment performed.
