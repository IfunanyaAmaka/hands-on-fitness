# Hands-On Fitness

Your daily companion for workouts, yoga, and everyday wellness.

Hands-On Fitness is a mobile app that gives people a simple, guided daily fitness practice combining workouts and yoga, paired with everyday wellness guidance — hydration, rest, nutrition, and hygiene — so users build a sustainable, healthy routine rather than just a workout habit.

> Status: Draft v1.0 | Owner: Product | See `HANDS ON FITNESS.md` for full PRD

## Target Users

- **Beginners** intimidated by gyms who want a low-pressure way to start moving.
- **Busy professionals** with limited time who need efficient, structured sessions.
- **Yoga & fitness enthusiasts** who want a single app blending strength, flexibility, and mindfulness.

## Problem

People struggle to stay consistent because they don't know what to do each day, lack guidance on proper form, lose motivation without visible progress, and rarely connect exercise to daily habits (sleep, water, food, hygiene).

**Core solution:** One guided daily practice — workout + yoga + wellness — so users never wonder "what should I do today, and how do I take care of myself around it?"

## Goals & Success Metrics (v1)

- ≥ 40% Day-7 retention
- ≥ 3x average sessions / user / week
- ≥ 60% session completion rate (started vs finished)
- ≥ 25% users engaging with wellness tips weekly

## Key Features (v1)

### 1. Onboarding & Goal Setting
- Select goal: weight loss, strength, flexibility, stress relief [Must]
- Set level: beginner / intermediate / advanced [Must]
- Set time/day: 10 / 20 / 30+ min [Should]

### 2. Guided Workout & Yoga Sessions
- Video + audio-guided sessions [Must]
- Built-in countdown timer per exercise/pose [Must]
- Audible cues (e.g. "3, 2, 1, switch") [Should]
- Pause / skip / repeat [Must]
- Adjustable intensity / duration [Should]

### 3. Personalized Daily Plan
- Auto-generated from goal, level, time budget [Must]
- Mix of workout + yoga across week [Must]
- Swap / reschedule day [Should]

### 4. Wellness Tips
- Hygiene tips (pre/post-workout, skin/foot care) [Must]
- Water reminders + intake tracking [Must]
- Rest / sleep tips + bedtime reminder [Must]
- Nutritional meal guidance tied to goal [Must]
- Contextual surfacing (e.g. hydration after workout) [Should]

### 5. Progress Tracking
- Streaks for consecutive active days [Must]
- Log of completed sessions + time spent [Must]
- Weekly/monthly fitness + wellness summary [Should]

### 6. Reminders & Notifications
- Daily workout/yoga reminder [Must]
- Hydration reminders [Should]
- Wind-down / sleep reminder [Could]

## User Journey

1. Sign up, set goals, level, time
2. Get personalized daily plan (workout + yoga mix)
3. Start session — guided video/audio with live countdown
4. Complete session — see streak + progress update
5. Receive relevant wellness tip
6. Get reminders to stay consistent
7. Review weekly/monthly summary

## Out of Scope (v1)

- Live 1:1 coaching / trainer video calls
- Social / community feed, friend challenges
- Wearable integration
- Full calorie/macro tracking (lightweight guidance only)

## Open Questions

- Nutrition: general tips only or meal logging?
- Is offline video playback required for v1?
- Should timers support custom user durations?

## Repo Structure

```text
/
├── HANDS ON FITNESS.md  # Full Product Requirements Document v1.0
├── README.md            # This file - project overview
```

## Getting Started

This is currently a PRD-only repo. Next steps for implementation:
1. Finalize content source for videos (licensed / produced)
2. Define session data model + plan-generation rules
3. Design UX for timer, tracking, notifications
4. Implement MVP mobile app

---
Hands-On Fitness · PRD Draft v1.0
