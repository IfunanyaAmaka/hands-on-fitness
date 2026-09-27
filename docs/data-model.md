# Data Model — Hands-On Fitness v1

Locked in Phase 0. All Phase 1–6 code must honor this schema.

## Entities

```text
User {
  id: string
  goal: weight_loss | strength | flexibility | stress_relief
  level: beginner | intermediate | advanced
  timeBudgetMin: 10 | 20 | 30
}

Session {
  id: string
  type: workout | yoga
  goal: User.goal
  level: User.level
  durationMin: 10 | 20 | 30
  steps: Step[]
}

Step {
  name: string
  durationSec: number   // ≤60 for beginners (content QA rule)
  cueAudioUrl?: string
  thumbnail?: string
}

Plan {
  userId: string
  date: yyyy-mm-dd
  sessionIds: string[]
  swappedFrom?: string  // original sessionId if user swapped
}

CompletionLog {
  userId: string
  sessionId: string
  startedAt: timestamp
  finishedAt?: timestamp
  completedBool: boolean
}

WellnessLog {
  userId: string
  date: yyyy-mm-dd
  waterMl: number
  tipsSeen: string[]    // Tip ids
}

Tip {
  id: string
  category: hygiene | water | sleep | nutrition
  goal?: User.goal      // null = all goals
  body: string
  trigger: daily | post_workout
}
```

## Rules

- `PlanEngine.generate(profile, weekHistory) -> Plan` is pure + deterministic.
  - Beginner/10-min never gets advanced/30-min.
  - Default weekly mix: 4 workout / 3 yoga; stress_relief/flexibility weighted to yoga.
  - Missed day rolls over; suggest rest day after 6 active days.
- `StreakCalculator`: 1 streak day = ≥1 completed session; timezone-safe; missed day resets.
- `Wellness`: tip rotation — no repeat within 7 days; `post_workout` trigger always shows hydration tip.
- `WaterLog`: quick-add buttons; totals reset daily at local midnight.
- Video behind `SessionRepository` interface — seed JSON path today, Firestore/Storage tomorrow, no player changes.
