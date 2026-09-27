# Analytics Events — Hands-On Fitness v1

Maps 1:1 to PRD §4 success metrics. Instrument from day 1.

| Event | When | Properties | Metric |
| ----- | ---- | ---------- | ------ |
| `onboarding_completed` | goal+level+time saved | `goal, level, timeBudgetMin, durationSec` | funnel (target ≥80% started→completed) |
| `plan_generated` | daily plan created | `userId, date, sessionIds, mixWorkoutYoga` | personalization working |
| `session_started` | player opens + plays | `userId, sessionId, type, level, durationMin` | denominator for completion |
| `session_completed` | last step finishes | `userId, sessionId, durationSec, completedBool` | ≥60% completion; ≥3x/week |
| `wellness_tip_viewed` | tip card seen | `userId, tipId, category, trigger` | ≥25% weekly engagement |
| `water_logged` | quick-add tapped | `userId, date, addedMl, totalMl` | wellness retention loop |
| `reminder_sent` | notification scheduled/fired | `type: workout\|hydration\|sleep` | delivery health |
| `reminder_opened` | tap deep-links | `type, targetScreen` | opt-in + CTR |

Targets: ≥40% D7 retention, ≥3 sessions/user/week, ≥60% completion, ≥25% wellness/week.
Tooling: Firebase Analytics (required); add PostHog only if funnel analysis is painful.
