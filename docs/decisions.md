# Architectural Decisions — Hands-On Fitness (PRD v1.0)

Source: `HANDS ON FITNESS.md` + `IMPLEMENTATION_PLAN.md` Phase 0.
Status: Proposed — review and lock before Phase 1 to avoid rework.

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

**Decision: Firebase — Auth + Firestore + Storage + FCM + Analytics.**
- Auth: email + Google/Apple social (Phase 1 <90s onboarding)
- Firestore: `users, sessions, plans, completionLogs, wellnessLogs`
- Storage + CDN: session videos, stream-only (see D4)
- FCM + local notifications: daily workout (Must), hydration (Should), wind-down (Could)

Video: start Storage + CDN; move to Cloudflare Stream / Mux for adaptive bitrate if buffering hurts the 60% completion metric.

Rejected: custom backend for v1 — no live coaching / social / wearables (§7 out of scope), `PlanEngine` runs client-side.

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
