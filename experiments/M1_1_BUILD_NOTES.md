# DDA — M1.1 Golden Lesson Build Notes

Branch: `chatgpt/m1-1-golden-lesson`

## Purpose

Create the first authored lesson for Module M1 — **Comprendre les marchés financiers** — without touching the current public product until the lesson experience is validated.

Golden lesson: **M1.1 — Pourquoi les prix évoluent ?**

Target competency: **Compréhension de la formation du prix**.

## Pedagogical contract

The lesson must teach a beginner to explain, without prediction or signal language, how executed orders and available liquidity can move a price upward, downward, or leave it relatively balanced.

Core concepts:
- buyers and sellers
- counterparties
- available liquidity
- aggressive buying
- aggressive selling
- imbalance
- relative balance / range

Explicit exclusions:
- no entry signal
- no BUY/SELL instruction
- no prediction claim
- no profit promise
- no advanced SMC/order-flow jargon

## Golden path implemented in the isolated prototype

1. Concept introduction
2. Buyer-pressure scenario
3. Seller-pressure scenario
4. Relative-balance/range scenario
5. New-context application exercise
6. Final validation quiz
7. Evidence panel

Every graded interaction supports:
- wrong answer
- explanatory feedback
- retry
- correct answer

The evidence panel deliberately does **not** award “Maîtriser” from a single lesson completion.

## Integration gate before touching the public flow

The isolated lesson must first be checked for:
- clarity for a beginner
- mobile usability around 390px
- no overflow
- feedback quality
- distinct identity from M0.1/M0.2/M0.3
- no prediction/signal language

Only after that should M1.1 be integrated into the existing Learning Engine.

## Planned product integration — Pass 2

1. Add `buildM11Lesson()` to `dist/dda-core.js`.
2. Replace M1's empty `lessons: []` with `[buildM11Lesson()]`.
3. Mount M1.1 in `dist/index.html` and `dist/app.js` with a dedicated view/id suffix.
4. Extend `LESSON_VIEW_ID` with `M1.1`.
5. Generalize `isRenderableModule()` so an authored M1 can become the current chapter after M0 completion.
6. Preserve `DDALearning.nextActionable()` as the single next-step source of truth.
7. Verify module gating: M0 incomplete → M1 locked; M0 complete → M1 available.
8. Verify Home/Terminal/Parcours/Progression consistency.
9. Add real-click regression tests for M0→M1.1 transition, wrong→feedback→retry, exercise, quiz, reload/resume and 390px.

## CEO validation criterion

A beginner completing M1.1 should be able to answer:

> Why can a price rise, fall, or stay in a range?

Expected understanding:

> Because executed orders interact with available counterparties and liquidity. When aggressive demand or supply absorbs nearby liquidity, trades may move to new price levels; when pressures are relatively balanced, price may remain within a range. This explains a mechanism, not a guaranteed future direction.
