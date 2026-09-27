# Hands-On Fitness — Implementation Plan (from PRD v1.0)

Source: `HANDS ON FITNESS.md` — PRD v1.0 Draft. This plan turns §5.1–5.6 + §6 user journey into ordered build phases. Each phase has a goal, tasks, **concrete outputs**, and exit criteria. No out-of-scope work (§7) is included.

Decisions needed first (PRD §8): nutrition logging scope, offline video requirement, custom timer durations. Phase 0 resolves these — they change data model and player design.

---

## Phase 0 — Decisions, Stack & Data Model

**Goal:** Unblock all downstream work.

**Tasks:**
1. Resolve PRD §8 open questions:
   - Nutrition: tips-only vs. meal logging (recommend: tips-only for v1)
   - Offline playback: required for v1? (recommend: stream-only v1, cache player state)
   - Custom timer durations: allow or fixed? (recommend: fixed presets v1)
2. Choose stack: Flutter (iOS+Android single codebase) or React Native + Expo; backend: Firebase (Auth/Firestore/FCM) for MVP speed.
3. Define analytics events for §4 metrics (D7 retention, sessions/week, completion rate, wellness engagement).
4. Define core data model.

**Concrete outputs:**
- `docs/decisions.md` — 3 open questions resolved with rationale
- `docs/data-model.md` — `User { goal, level, timeBudget }`, `Session { id, type, goal, level, durationMin, steps[{ name, durationSec, cueAudio }] }`, `Plan { userId, date, sessionIds }`, `CompletionLog { userId, sessionId, startedAt, finishedAt, durationSec }`, `WellnessLog { userId, date, waterMl, sleepTipSeen, mealTipSeen }`
- `docs/analytics-events.md` — `onboarding_completed, plan_generated, session_started, session_completed, wellness_tip_viewed, water_logged, reminder_sent/opened`
- Repo scaffold: `/app`, `/docs`, `/assets`, CI lint/test skeleton

**Exit criteria:** Data model + events reviewed; stack locked; Phase 1 can start without rework.

---

## Phase 1 — Onboarding & Goal Setting (PRD §5.1)

**Goal:** Capture goal, level, time budget.

**Tasks:**
- Sign-up (email/social, minimal) + 3-step onboarding: goal (weight loss / strength / flexibility / stress relief) → level (beginner/intermediate/advanced) → time (10/20/30+ min).
- Persist profile; allow edit later.
- Emit `onboarding_completed`.

**Concrete outputs:**
- Screens: `OnboardingGoal`, `OnboardingLevel`, `OnboardingTime`, `ProfileEdit`
- `UserProfile` API/store + validation tests
- Analytics: onboarding funnel (started → completed ≥ 80%)

**Exit criteria:** New user completes onboarding in < 90s; profile persists across restarts. Covers PRD 5.1 Must/Should.

## Phase 2 — Session Content Library (supports PRD §5.2)

**Goal:** Have playable content before building the player.

**Tasks:**
- Produce/license 24–36 starter sessions: 3 goals × 3 levels × 2 types (workout/yoga) × 2 durations (10/20 min), plus 30-min variants where cheap.
- Each session: ordered steps with per-step durations, form cues, thumbnail, audio script.
- Seed as JSON; abstract behind `SessionRepository` so video source can swap later.

**Concrete outputs:**
- `assets/sessions/*.json` (or Firestore `sessions` collection) — min. 24 sessions with schema from Phase 0
- `SessionRepository` interface + seed loader + unit tests (schema validation, duration sums match header)
- Content QA checklist (audio intelligible, steps ≤ 60s each for beginners)

**Exit criteria:** App can list/filter sessions by goal/level/time offline from seed data. Unblocks Phases 3–4.

## Phase 3 — Personalized Daily Plan (PRD §5.3)

**Goal:** "What should I do today?" answered automatically.

**Tasks:**
- Rule engine: `goal + level + timeBudget → today's session(s)` + weekly workout/yoga mix (e.g. 4 workout / 3 yoga default, stress-relief/flexibility weighted to yoga).
- Today view + 7-day strip; swap/reschedule a day (same-duration alternative).
- Emit `plan_generated`.

**Concrete outputs:**
- `PlanEngine.generate(profile, weekHistory) → Plan` + deterministic tests (e.g. beginner/10-min never gets advanced/30-min; weekly mix assertions)
- Screens: `TodayPlan`, `WeekView`, `SwapSession` sheet
- Edge handling: missed day rollover, rest-day suggestion

**Exit criteria:** 3 test profiles produce correct 7-day plans; swap works without breaking streak logic. Covers 5.3 Must/Should.

## Phase 4 — Guided Session Player (PRD §5.2 core)

**Goal:** Reliable timer-first player — the heart of the app.

**Tasks:**
- Video/audio playback + **visible countdown per exercise/pose** (Must), pause/skip/repeat (Must).
- Audible "3,2,1, switch" cues (Should), adjustable intensity/duration variant selector (Should).
- Handle calls/backgrounding: pause timer, resume correctly.
- Emit `session_started/completed` with durations for 60% completion metric.

**Concrete outputs:**
- Screen: `SessionPlayer { countdown ring, step list, pause/skip/repeat, cue toggle }`
- `TimerEngine` (tested: pause/resume drift < 500ms, skip/repeat state correct)
- `CompletionLog` written on finish; player crash-recovery test
- Manual QA matrix: 10-min beginner workout + 20-min yoga end-to-end

**Exit criteria:** Session completion rate measurable; player survives interruption; ≥ 60% completion achievable in testing. Covers 5.2 Must/Should.

## Phase 5 — Wellness Tips + Water Tracking (PRD §5.4)

**Goal:** Daily wellness loop tied to workouts.

**Tasks:**
- Tip library: hygiene (pre/post-workout, skin/foot), rest/sleep, nutrition-by-goal. Contextual rule: hydration tip after workout (Should).
- Water logging: quick-add buttons + daily total; bedtime reminder setting.
- Emit `wellness_tip_viewed`, `water_logged`.

**Concrete outputs:**
- `WellnessRepository` (tips by category/goal) + `WaterLog` store
- Components: `WellnessCard`, `WaterTracker`, contextual trigger `postSession → hydration tip`
- Tests: tip rotation (no repeat within 7 days), water totals reset daily

**Exit criteria:** Every session completion surfaces a relevant tip; water intake persists; ≥ 25% weekly engagement measurable. Covers 5.4 Must/Should.

## Phase 6 — Progress Tracking (PRD §5.5)

**Goal:** Visible streaks and history to drive retention.

**Tasks:**
- Streak counter (consecutive active days, timezone-safe), session history + total time.
- Weekly/monthly summary combining fitness + wellness (water/sleep/meals) (Should).

**Concrete outputs:**
- Screens: `ProgressHome { streak, totals }`, `HistoryList`, `WeeklySummary`
- `StreakCalculator` + tests (missed day resets, timezone edge, multiple sessions/day = 1 streak day)
- Summary generator combining `CompletionLog + WellnessLog`

**Exit criteria:** Streak logic unit-tested; summary renders with real data from Phases 4–5. Covers 5.5 Must/Should.

## Phase 7 — Reminders & Notifications (PRD §5.6)

**Goal:** Consistency loop.

**Tasks:**
- Daily workout/yoga reminder (Must, user-chosen time), hydration reminders (Should), wind-down/sleep reminder (Could — include only if cheap).
- Deep-link: tap → today's plan / water log. Permission onboarding + quiet-hours respect.

**Concrete outputs:**
- `NotificationScheduler` + settings screen (`ReminderTime`, toggles per type)
- Integration tests: schedule → fire → deep-link to correct screen
- Analytics: `reminder_sent/opened`, opt-in rate tracked

**Exit criteria:** Reminders fire reliably on iOS+Android; JET opt-out honored. Covers 5.6 Must/Should/Could.

## Phase 8 — Polish, Beta & v1 Release

**Goal:** Hit §4 success metrics with real users.

**Tasks:**
- Accessibility (timer legibility, cue volume), empty/error states, app-store assets, privacy policy (health data).
- Closed beta (20–50 users): measure D7 retention, 3x/week, 60% completion, 25% wellness.
- Fix top drop-offs (onboarding → plan → player → completion funnel).
- Tag `v1.0.0`, store submission.

**Concrete outputs:**
- Beta report: 4 metrics vs. targets + top 5 fixes shipped
- `CHANGELOG.md`, store listings, `v1.0.0` tag
- Go/no-go checklist: crash-free ≥ 99%, completion tracking verified, notifications verified

**Exit criteria:** All Must requirements demonstrable end-to-end via §6 user journey (signup → plan → session → streak → tip → reminder → summary).

---

## Build Order Summary

| Order | Phase | PRD Section | Unlocks |
| ----- | ----- | ----------- | ------- |
| 0 | Decisions + data model | §8, §4 | everything |
| 1 | Onboarding | §5.1 | personalization |
| 2 | Content library | §5.2 (data) | plan + player |
| 3 | Daily plan | §5.3 | today view |
| 4 | Session player | §5.2 (app) | core value |
| 5 | Wellness + water | §5.4 | retention loop |
| 6 | Progress/streaks | §5.5 | motivation |
| 7 | Notifications | §5.6 | consistency |
| 8 | Beta + release | §4, §6 | v1 ship |

Minimum viable slice to validate the concept: Phases 0–4 (onboard → plan → play → log). Phases 5–7 can follow in that order without rework if the Phase 0 data model is honored.

## Suggested Repo Layout (when code starts)

```text
/app            # mobile app (screens, player, notifications)
/docs           # decisions.md, data-model.md, analytics-events.md
/assets/sessions # seed session JSON + media manifests
/functions (or /backend) # plan engine, summary generator if server-side
```