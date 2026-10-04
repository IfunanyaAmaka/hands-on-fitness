# Release Checklist — v1.0.0 (Phase 8 go/no-go)

- [ ] §6 user journey demonstrable end-to-end: signup → plan → session → streak → tip → reminder → summary
- [ ] Crash-free ≥ 99% (beta cohort)
- [ ] Completion tracking verified (`session_started/completed`-rate measurable, ≥60% achievable)
- [ ] Notifications verified: schedule → fire → deep-link (workout→Today, hydration/sleep→Wellness), opt-out honored
- [ ] Timer: pause/resume drift <500ms, survives interruption; cues audible
- [ ] Accessibility: timer ≥64sp, contrast ≥4.5:1 body, cue volume control, font scaling
- [ ] Empty/error states: no plan, API down, no sessions (prototype fallbacks present)
- [ ] Privacy policy published; delete-user path tested
- [ ] Beta report filed (4 metrics vs. targets + top 5 fixes)
- [ ] Tag `v1.0.0`, store listings + screenshots (light Today + dark Player)

Note: repo already has tags `v1.0` (PRD) and `v1.1` (README). Use `v1.0.0` for the app release per plan.
