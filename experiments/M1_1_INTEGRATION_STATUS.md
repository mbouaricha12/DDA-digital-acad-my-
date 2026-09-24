# M1.1 Integration Gate

> **Status update (24 September 2026): MERGED, then restructured.** M1.1 — and
> since then M1.2 — live on `main` as *dedicated lesson views* (`lesson-m11`/
> `lesson-m12`) wired through **`LESSON_REGISTRY`** in `dist/app.js`. The
> "bridge reloads the app" mechanism described below existed only on the
> integration branch and is no longer present in the shipped code (no
> `location.reload` anywhere in `dist/`). Requirements listed below are now
> covered by committed tests: `tests/test_m1_runtime_contract.js`,
> `tests/test_lesson_registry.js`, `tests/smoke_app_boot.js` (gate closed →
> open, full journey, reload-free resume). Kept for history.

Status: branch implementation, not yet merged to main.

Implemented on this branch:
- M1.1 authored lesson adapted to existing renderer contract (`content`, `practice`, `evaluation`).
- M1 inserted into the runtime curriculum before `app.js` executes.
- Existing `DDALearning.nextActionable()` remains the source of truth.
- M1 stays structurally behind M0 because the existing module engine controls module status.
- Once M0.1, M0.2 and M0.3 quizzes are complete, the bridge reloads the app and promotes M1.1 into the main lesson reader.
- M1.1 exercise and quiz use the existing gate/progress engine.
- Three pre-gate reasoning scenarios keep wrong-answer feedback and retry.
- Progression automatically sees M1.1 because it already flattens authored curriculum lessons.

Still required before merge:
- GitHub Actions green.
- Browser E2E on branch deployment or preview.
- Verify M0 incomplete -> M1 locked.
- Verify M0 complete -> M1 available and M1.1 rendered.
- Verify wrong -> feedback -> retry -> exercise -> quiz.
- Verify Home / Terminal / Parcours / Progression consistency after transition.
- Verify reload/resume and mobile widths 320/375/390/428.

This bridge is intentionally conservative: no M1.2, M1.3, M2, payment, backend or market-data work is included.
