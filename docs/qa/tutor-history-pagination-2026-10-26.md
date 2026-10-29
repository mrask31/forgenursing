# Tutor history inventory — October 26, 2026

1477b21 acceptance: cold first-open of NUR 400 IV-drip transcript from My Courses passes without refresh; switching and Back/retry pass. User reports Mar 20 session no longer listed in drawer while alive in My Courses.

Confirmed code cause: /api/chats/list limited all results to 50 updated_at-descending rows, and drawer provided no pagination. This made older records fall out as new sessions arrived, without deleting the records.

Fix: API keeps 50-row pages, fetches one sentinel row, orders by updated_at and id descending, returns a validated timestamp/UUID cursor. Cursor filters are constructed only from validated values. Drawer appends unique rows on Load older conversations, keeps course grouping/link context, labels loaded inventory and further availability, and displays failures without discarding loaded rows. General Tutor filters now precede pagination. No course/session data is changed.

Validation: 230 tests / 33 files, TypeScript and incremental lint pass. Tests verify 50+1 boundary, final page, timestamp/ID filter and malformed cursor rejection. Browser acceptance pending: load older conversations until Mar 20 returns; confirm NUR 400 has both sessions and each opens with class context; no repeated rows; final-page button disappears; regression check cold-open and Back/retry.

Production remains unchanged. Course cleanup, dictionary, self-service, review coverage, real trial display, legacy prices and production rollout remain open.
