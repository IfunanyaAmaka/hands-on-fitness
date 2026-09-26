# Hands-On Fitness

> Your daily companion for workouts, yoga, and everyday wellness.

[![Status: Draft v1.0](https://img.shields.io/badge/status-draft_v1.0-yellow)](./HANDS%20ON%20FITNESS.md)
[![Platform: Mobile](https://img.shields.io/badge/platform-mobile-blue)](#)
[![PRD: Included](https://img.shields.io/badge/PRD-included-green)](./HANDS%20ON%20FITNESS.md)

Hands-On Fitness is a mobile app that gives people a simple, guided daily fitness practice combining **workouts + yoga**, paired with everyday wellness guidance — **hydration, rest, nutrition, and hygiene** — so users build a sustainable, healthy routine rather than just a workout habit.

**Core idea:** One guided daily practice, so users never wonder *"what should I do today, and how do I take care of myself around it?"*

Full spec: [`HANDS ON FITNESS.md`](./HANDS%20ON%20FITNESS.md) — Product Requirements Document v1.0 (Draft)

---

## Table of Contents

- [Who It's For](#who-its-for)
- [Problem](#problem)
- [Goals & Success Metrics](#goals--success-metrics)
- [Key Features](#key-features)
- [User Journey](#user-journey)
- [Out of Scope (v1)](#out-of-scope-v1)
- [Repo Structure](#repo-structure)
- [Getting Started](#getting-started)
- [Roadmap](#roadmap)
- [Open Questions](#open-questions)
- [Contributing](#contributing)
- [License](#license)

---

## Who It's For

- **Beginners** intimidated by gyms who want a low-pressure way to start moving.
- **Busy professionals** with limited time who need efficient, structured sessions.
- **Yoga & fitness enthusiasts** who want a single app blending strength, flexibility, and mindfulness.

## Problem

People struggle to stay consistent because they:

1. Don't know what to do each day
2. Lack guidance on proper form
3. Lose motivation without visible progress
4. Rarely connect exercise to daily habits (sleep, water, food, hygiene)

## Goals & Success Metrics

| Metric | Target (v1) |
| ------ | ----------- |
| Day-7 retention | ≥ 40% |
| Avg. sessions / user / week | ≥ 3x |
| Session completion rate (started vs. finished) | ≥ 60% |
| Users engaging with wellness tips weekly | ≥ 25% |

## Key Features

### 1. Onboarding & Goal Setting

- Select goal: weight loss, strength, flexibility, stress relief `[Must]`
- Set level: beginner / intermediate / advanced `[Must]`
- Set time/day: 10 / 20 / 30+ min `[Should]`

### 2. Guided Workout & Yoga Sessions

- Video + audio-guided sessions `[Must]`
- Built-in countdown timer per exercise/pose, visible during playback `[Must]`
- Audible cues (e.g. "3, 2, 1, switch") for hands-free use `[Should]`
- Pause / skip / repeat controls `[Must]`
- Adjustable intensity / duration `[Should]`

### 3. Personalized Daily Plan

- Auto-generated from goal, level, time budget `[Must]`
- Mix of workout + yoga across the week `[Must]`
- Swap / reschedule a day's session `[Should]`

### 4. Wellness Tips

- Hygiene tips — pre/post-workout, skin/foot care `[Must]`
- Water reminders + simple intake tracking `[Must]`
- Rest / sleep tips + optional bedtime reminder `[Must]`
- Nutritional meal guidance tied to goal (e.g. recovery, weight loss) `[Must]`
- Contextual surfacing — e.g. hydration tip right after workout `[Should]`

### 5. Progress Tracking

- Streaks for consecutive active days `[Must]`
- Log of completed sessions + time spent `[Must]`
- Weekly/monthly fitness + wellness summary (water, sleep, meals) `[Should]`

### 6. Reminders & Notifications

- Daily workout/yoga reminder `[Must]`
- Hydration reminders `[Should]`
- Wind-down / sleep reminder `[Could]`

## User Journey

1. Sign up, set goals, level, available time
2. Get personalized daily plan (workout + yoga mix)
3. Start session — guided video/audio with live countdown per exercise/pose
4. Complete session — see streak + progress update
5. Receive relevant wellness tip (hydration, rest, nutrition, hygiene)
6. Get reminders to stay consistent (workout, water, sleep)
7. Review weekly/monthly summary

## Out of Scope (v1)

- Live 1:1 coaching / trainer video calls
- Social / community feed, friend challenges
- Wearable device integration
- Full calorie/macro tracking (lightweight guidance only in v1)

## Repo Structure

```text
/
├── HANDS ON FITNESS.md  # Full Product Requirements Document v1.0
├── README.md            # This file - project overview
```

## Getting Started

This is currently a **PRD-only repo** — no app code yet.

Next steps for implementation:

1. Finalize content source for videos (licensed / produced)
2. Define session data model + plan-generation rules
   - e.g. `Session { id, type, goal, level, duration, steps[{ name, durationSec }] }`
3. Design UX for timer, tracking, notifications
4. Implement MVP mobile app (onboarding → daily plan → player → streaks → reminders)

## Roadmap

- [x] PRD v1.0 draft
- [ ] Resolve open questions (nutrition scope, offline playback, custom timers)
- [ ] Session data model + plan-generation rules
- [ ] UX designs for player / tracking / notifications
- [ ] MVP build
- [ ] Analytics for the 4 success metrics

## Open Questions

- Nutrition: general tips only or meal logging?
- Is offline video playback required for v1?
- Should timers support custom user durations?

See full PRD for context: [`HANDS ON FITNESS.md`](./HANDS%20ON%20FITNESS.md)

## Contributing

Issues and PRs welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit, push, open a PR against `main`

## License

TBD — no license file yet. All rights reserved by default until a license is added.

---

Hands-On Fitness · PRD Draft v1.0 · Owner: Product
