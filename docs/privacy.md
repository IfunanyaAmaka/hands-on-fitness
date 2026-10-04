# Privacy Note — Hands-On Fitness v1 (Phase 8, draft)

- Collects: goal, level, time budget, session completions, water intake, reminder times. No full calorie/macro tracking (§7 out of scope).
- Health data stays in Postgres (Neon prod); videos stream from R2 signed URLs (no public buckets).
- Auth via Better Auth (session/JWT); never log tokens. Analytics events carry no free-text health notes.
- Required before beta: full privacy policy + data-deletion path (delete user → cascade logs/reminders).
- Notifications: opt-in per type; quiet hours 22:00–06:00 default; opt-out honored immediately.
