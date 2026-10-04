# Architectural Decisions — Hands-On Fitness (PRD v1.0)

Source: `HANDS ON FITNESS.md` + `IMPLEMENTATION_PLAN.md` Phase 0.
Status: Locked 2026-09-27 — D3 = Postgres + Better Auth + R2 (matches PRD technical note).

## D1 — PRD §8 Open Questions

### Nutrition: tips-only vs. meal logging?
**Decision: tips-only for v1.**
Rationale: logging needs food DB + diary UI, doubles Phase 5 scope.
Consequence: store `mealTipSeen`, not meals. Revisit if wellness engagement ≥25%.

### Offline video for v1?
**Decision: stream-only v1.**
Rationale: offline = DRM, storage quota, download manager (~2-3 weeks extra).
Consequence: cache seed JSON + timer state only, not video.

### Custom timer durations?
**Decision: fixed presets v1 (10 / 20 / 30-min variants).**
Rationale: custom breaks content QA and `PlanEngine` determinism.
Consequence: add custom in v1.1 if requested.

## D2 — App stack

**Decision: Flutter (single codebase, iOS + Android).**
Rationale: best timer + video + background handling, one language, good seed-JSON support.
Alternative: React Native + Expo if team is JS-only (more native-module work for background timer/audio cues).
Rejected: separate native Swift + Kotlin for MVP (2x cost, no PRD benefit).

## D3 — Backend

**Decision: Postgres + Better Auth + Cloudflare R2 + Node API (locked 2026-09-27, supersedes Firebase option).**
- Postgres 16: `users, sessions, steps, plans, completion_logs, wellness_logs, tips` (local via Docker `hof-db`; prod: Neon serverless). SQL fits weekly-mix + streak summaries better than Firestore.
- Better Auth via Node API (Hono + Drizzle): email + Google/Apple social, session/JWT; Better-Auth tables live alongside app tables, linked by `authUserId`.
- Cloudflare R2: `hof-videos/{sessionId}/main.mp4`, thumbs, cues — API returns short-lived signed URLs, stream-only v1 (zero egress fees).
- FCM/APNs + local notifications: daily workout (Must), hydration (Should), wind-down (Could). Push still needed — R2/Auth don't do push.

Video: start R2 + CDN; move to Cloudflare Stream for adaptive bitrate if buffering hurts the 60% completion metric.

Superseded: Firebase (Auth/Firestore/Storage) — was faster for MVP but rejected for control + video egress costs. `PlanEngine` still runs client-side; API stays thin (auth, CRUD, signed URLs, reminders).

## D4 — Data model

See `data-model.md`. Pure, deterministic `PlanEngine`; timezone-safe `StreakCalculator`; video behind `SessionRepository` interface.

## D5 — Session Player (core risk, PRD §5.2)

- Timer-first, not video-first. `TimerEngine` owns truth (not video clock).
- Requirements: pause/resume drift <500ms, survives call/background, pause/skip/repeat (Must).
- Audible `3,2,1,switch` via TTS or pre-rendered MP3 (Should — include, cheap in Flutter).
- Persist `sessionId + stepIndex + remainingSec` every 5s for crash recovery.
- Write `CompletionLog` only on `session_completed` (drives 60% metric).

## D6 — Analytics (PRD §4)

See `analytics-events.md`. Firebase Analytics (+ PostHog for funnels if needed). Instrument day 1.

## D7 — Repo / release

```text
/app               # onboarding, TodayPlan, SessionPlayer, progress, settings
/docs              # decisions.md, data-model.md, analytics-events.md
/assets/sessions   # seed JSON (24-36 sessions)
/functions         # only if PlanEngine/summary moves server-side later
```

- CI: analyze + unit tests (`PlanEngine, TimerEngine, StreakCalculator`) on every push.
- Beta 20–50 users, measure 4 metrics, then tag `v1.0.0`.

## Top risks

1. Content bottleneck (24–36 sessions) — start JSON + licensed clips.
2. Player background bugs killing completion rate.
3. Notification opt-in — ask contextually after first plan, not at launch.
