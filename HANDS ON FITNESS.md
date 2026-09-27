**Product Requirements Document**

# **Hands-On Fitness**

Your daily companion for workouts, yoga, and everyday wellness.

Version 1.0Status: DraftOwner: Product

**1\. Overview**

Hands-On Fitness is a mobile app that gives people a simple, guided daily fitness practice combining workouts and yoga, paired with everyday wellness guidance — hydration, rest, nutrition, and hygiene — so users build a sustainable, healthy routine rather than just a workout habit.

**2\. Target Users**

* **Beginners** intimidated by gyms who want a low-pressure way to start moving.  
* **Busy professionals** with limited time who need efficient, structured sessions.  
* **Yoga & fitness enthusiasts** who want a single app blending strength, flexibility, and mindfulness.

**3\. Problem Statement**

People struggle to stay consistent with fitness because they don't know what to do each day, lack guidance on proper form, lose motivation without visible progress, and rarely connect exercise to the daily habits (sleep, water, food, hygiene) that make it effective.

**Core problem to solve:** Give people one guided daily practice — workout \+ yoga \+ wellness — so they never have to wonder "what should I do today, and how do I take care of myself around it?"

**4\. Goals & Success Metrics**

**≥ 40%**

Day-7 retention (users who return within a week)

**≥ 3x**

Average sessions completed per user per week

**≥ 60%**

Session completion rate (started vs finished)

**≥ 25%**

Users engaging with wellness tips weekly

**5\. Key Features & Requirements**

### **5.1 Onboarding & Goal Setting**

| Requirement | Priority |
| :---- | :---- |
| User selects fitness goal (weight loss, strength, flexibility, stress relief) | **Must** |
| User sets experience level (beginner / intermediate / advanced) | **Must** |
| User sets available time per day (10 / 20 / 30+ min) | **Should** |

### **5.2 Guided Workout & Yoga Sessions**

| Requirement | Priority |
| :---- | :---- |
| Video and audio-guided sessions for workouts and yoga | **Must** |
| **Built-in countdown timer** for each exercise/pose, visible during video/audio playback | **Must** |
| Audible countdown cues (e.g. "3, 2, 1, switch") for hands-free use | **Should** |
| Pause/skip/repeat controls within a session | **Must** |
| Adjustable session intensity or duration | **Should** |

### **5.3 Personalized Daily Plan**

| Requirement | Priority |
| :---- | :---- |
| Daily plan auto-generated from user's goal, level, and time budget | **Must** |
| Mix of workout and yoga sessions across the week | **Must** |
| User can swap or reschedule a day's session | **Should** |

### **5.4 Wellness Tips**

| Requirement | Priority |
| :---- | :---- |
| Daily hygiene tips (pre/post-workout hygiene, skin/foot care for active users) | **Must** |
| Water consumption reminders and simple daily intake tracking | **Must** |
| Quality rest / sleep tips, with optional bedtime reminder | **Must** |
| Nutritional meal guidance (balanced meal ideas tied to goal, e.g. recovery, weight loss) | **Must** |
| Tips surfaced contextually (e.g. hydration tip right after a workout) | **Should** |

### **5.5 Progress Tracking**

| Requirement | Priority |
| :---- | :---- |
| Streak tracking for consecutive active days | **Must** |
| Log of completed sessions and time spent | **Must** |
| Weekly/monthly summary combining fitness \+ wellness (water, sleep, meals logged) | **Should** |

### **5.6 Reminders & Notifications**

| Requirement | Priority |
| :---- | :---- |
| Daily workout/yoga reminder notification | **Must** |
| Hydration reminder notifications | **Should** |
| Wind-down / sleep reminder notification | **Could** |

**6\. User Journey**

1. Sign up and set fitness goals, level, and available time  
2. Receive a personalized daily plan mixing workouts and yoga  
3. Start a session — follow guided video/audio with a live countdown timer per exercise/pose  
4. Complete session; see streak and progress update  
5. Receive a relevant wellness tip (hydration, rest, nutrition, or hygiene)  
6. Get reminders to stay consistent (workout time, water, sleep)  
7. Review weekly/monthly progress summary across fitness and wellness

**7\. Out of Scope (v1)**

* Live 1:1 coaching or real-time trainer video calls  
* Social/community feed and friend challenges  
* Wearable device integration  
* Full calorie/macro tracking (only lightweight nutrition guidance in v1)

**8\. Open Questions**

* Should nutrition guidance be general tips only, or allow logging meals?  
* Is offline playback of workout/yoga videos required for v1?  
* Should countdown timers support custom durations set by the user?

**Note — Technical Choices (informative, not requirements)**

Locked 2026-09-27. Source of truth: `docs/decisions.md`. Does not change §5 requirements.

* App: Flutter (single codebase, iOS + Android)
* Database: PostgreSQL 16 (local via Docker `hof-db`; prod: Neon serverless)
* Auth: Better Auth via Node API (email + Google/Apple social, session/JWT)
* File storage: Cloudflare R2 (video/thumbs/cues via API signed URLs, stream-only v1)
* API: Node + Hono + Drizzle (`/app` → API → Postgres/R2)
* Push: FCM/APNs (daily workout Must, hydration Should, wind-down Could)
* Analytics: Firebase Analytics (+ PostHog for funnels) — §4 metrics
* Local run: `docker compose up --build -d` → `localhost:5432` (db), `localhost:3000` (api)

Hands-On Fitness · Product Requirements Document · Draft v1.0  
