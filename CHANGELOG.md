# Changelog — Hands-On Fitness

## Unreleased (toward v1.0.0)
- Phase 7: reminders API (`POST/GET/PATCH/DELETE /reminders`, `GET /reminders/due`, `POST /reminders/:id/opened`), 60s local scheduler with quiet-hours + `reminder_sent/opened` analytics, prototype Reminders tab with browser-notification demo + deep-links (workout→Today, hydration/sleep→Wellness)
- Phase 8: beta plan, privacy note, release checklist (this changelog)

## v1.1 — Design + local stack
- Calm Active design: preview page, Flutter `theme.dart` (Outfit + Manrope), color hierarchy
- Local stack: Postgres 16 + Node API via Docker, 9 seeded sessions, web prototype (Today/Player/Wellness/Progress)

## v1.0 — PRD
- Initial PRD v1.0 + README rebuild + implementation plan (Phases 0–8)
