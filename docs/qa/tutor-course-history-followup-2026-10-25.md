# Tutor course history follow-up

Acceptance of 3ab0c527: Save/Flag removal and Back/retry pass. Main history open/refresh/switch transcript paths pass. Course-owned NUR 400 IV-drip-rates conversation still opens blank from drawer without classId, while My Courses link works. Refusal-derived titles survived the display sanitizer; login retained obsolete Library/Dashboard copy.

Fix: drawer links now carry the same course context used to group sessions. Explicit-session resolution selects the requested session before correcting course context in the URL; previously that early return could leave the welcome screen. Metadata failures now stop with a visible error. Title display substitutes Tutor conversation for the two reported refusal forms, including prefixed No and I could not. No saved transcript/title records are modified. Login now describes explanations/retries and progress rather than nonexistent library/dashboard destinations.

Validation: 227 tests / 32 files, TypeScript, incremental lint (zero new blockers) pass. Browser acceptance pending: same NUR 400 session from drawer and My Courses; refresh/switch; both refusal title examples; login copy; Back/retry regression. This change does not recover conversations that genuinely have no saved messages, invent descriptive titles, or change production.
