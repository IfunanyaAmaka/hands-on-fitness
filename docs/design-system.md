# Design System — Hands-On Fitness ("Calm Active")

Locked 2026-09-27. Visual reference: `design-preview.html`. Flutter tokens: `app/lib/theme.dart`.
Fonts: **Outfit** (display/timer/headings) + **Manrope** (body/labels) via `google_fonts`.

## Color hierarchy (60 · 30 · 10)

| Level | Role | Token | Usage |
| ----- | ---- | ----- | ----- |
| Base 60% | Calm canvas | off-white `#FAF7F2` / player dark `#121417` | Screen backgrounds only |
| Primary 30% | Action + workout | coral `#FF6B5B` | Start buttons, workout timer ring, workout pills (`#FFE9E6` bg), selected states |
| Secondary 20% | Yoga + calm guidance | deep teal `#0E7C6B` (sage `#4CAF82` on dark) | Yoga sessions, wellness cards, Swap/secondary buttons, water buttons (`#E6F5EF` bg) |
| Accent 10% | Reward | amber `#FFB020` | Streak flame, weekly ring fill, achievements — sparingly |
| Ink | Text | `#1A1D21` headings / `#6B7280` muted / `#FFFFFF` on dark | Body copy never uses brand colors |

Semantic: success `#2E9E5B`, warning amber, error `#D64545` (avoid pure red mid-session; amber for "paused").

## Rules

1. One action color per screen (coral Start; teal Swap styled secondary).
2. Workout vs. yoga always distinct pills + timer-ring color by `session.type`.
3. Timer ≥64–80px Outfit ExtraBold, tabular; `3·2·1·SWITCH` cue letter-spaced + haptic.
4. Cards 24px radius, buttons 16px radius, touch targets ≥56–72px in player.
5. Contrast: ink-on-bg 14:1; coral for large elements only (3.5:1 on white); muted ≥14px only.
6. Player defaults to dark theme (glare + battery).

## Screen mapping

- Onboarding: one question/screen, coral selected-card border, progress dots.
- Today: ink hero card (white text), coral Start, teal Swap, 7-day strip.
- Player: dark bg, coral/teal ring by type, Pause/Skip/Back + Finish.
- Wellness: white cards, teal water quick-add, amber streak bar.
- Progress: amber ring + flame, teal secondary stats, no-guilt copy ("Rest days count").
