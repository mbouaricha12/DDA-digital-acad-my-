# M1.1 Integration Gate

Status: branch implementation, not yet merged to main.

Implemented on this branch:
- M1.1 authored lesson adapted to existing renderer contract (`content`, `practice`, `evaluation`).
- M1 inserted into the runtime curriculum before `app.js` executes.
- Existing `DDALearning.nextActionable()` remains the source of truth.
- M1 stays structurally behind M0 because the existing module engine controls module status; a direct `#lesson-m11` route now returns an enrolled learner to Parcours while M0 remains incomplete (the historical deep-links internal to M0 are intentionally unchanged).
- Once M0.1, M0.2 and M0.3 quizzes are complete, `DDALearning.nextActionable()` promotes M1.1 into the main lesson reader; Terminal, Parcours and Progression share that source of truth.
- Parcours now changes chapter, module number, lesson count and CTA to M1 when M0 is complete instead of presenting M1.1 inside an obsolete M0 card.
- Focus Mode is derived from the lesson-view registry, so M1.1 receives the same distraction-free treatment as M0.
- M1.1 exercise and quiz use the existing gate/progress engine.
- Three pre-gate reasoning scenarios keep wrong-answer feedback and retry.
- Progression automatically sees M1.1 because it already flattens authored curriculum lessons.

Validation evidence on this branch:
- `node tests/test_m1_golden_lesson.js`: 10/10 checks passed.
- `node tests/test_m1_integration_contract.js`: 4/4 checks passed.
- `node tests/test_m1_runtime_integration.js`: 5/5 checks passed (real `dda-core.js` + `learning-engine.js` in an isolated runtime), including M0 lock, M0→M1 promotion and M1 resume.

Still required before merge:
- GitHub Actions green.
- Browser E2E on branch deployment or preview (the current agent environment has neither Playwright nor Chromium pre-installed despite the legacy harness expectation).
- Verify wrong -> feedback -> retry -> exercise -> quiz with real taps/clicks.
- Verify Home / Terminal / Parcours / Progression consistency after transition.
- Verify reload/resume and mobile widths 320/375/390/428.

This bridge is intentionally conservative: no M1.2, M1.3, M2, payment, backend or market-data work is included.
