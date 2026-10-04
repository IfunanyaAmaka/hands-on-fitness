# Beta Plan — Hands-On Fitness v1 (Phase 8)

## Cohort
20–50 users: 1/3 beginners, 1/3 busy pros, 1/3 yoga enthusiasts. 2 weeks minimum.

## Metrics vs. PRD §4 targets
| Metric | Target | Event source |
| ------ | ------ | ------------ |
| Day-7 retention | ≥ 40% | `onboarding_completed` → return within 7d |
| Sessions / user / week | ≥ 3x | `session_completed` count |
| Session completion rate | ≥ 60% | `session_completed` / `session_started` |
| Wellness engagement weekly | ≥ 25% | `wellness_tip_viewed` + `water_logged` |

## Funnel to watch
onboarding → plan → player → completion → tip → reminder opt-in → week-2 summary.
Fix the biggest drop-off first; ship top 5 fixes before store submission.

## Exit
Beta report documents 4 metrics vs. targets + fixes shipped → go/no-go per `release-checklist.md`.
