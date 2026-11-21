/* DDA M1.3 — client loader.
   docs/RISK_REGISTER.md R-04 fix: the real M1.3 lesson text, exercises and
   quiz answers no longer live here — see m1-1-lesson.js's header comment
   for the full rationale, identical for this file. They now live only on
   the authenticated BFF (bff/src/m1-content.js), behind
   GET /v1/m1/content/M1.3.

   This file only fetches that content and sets the exact same
   globalThis.DDAM13GoldenLesson global dda-core.js's buildCurriculum()
   already reads. */
(function (root) {
  'use strict';

  root.DDAM13GoldenLesson = null;

  async function loadM13Content() {
    if (!root.DDABFF || !root.DDABFF.enabled() || typeof root.DDABFF.fetchM1Content !== 'function') {
      root.DDAM13GoldenLesson = null;
      return root.DDAM13GoldenLesson;
    }
    try {
      const result = await root.DDABFF.fetchM1Content('M1.3');
      root.DDAM13GoldenLesson = result.lesson || null;
    } catch {
      root.DDAM13GoldenLesson = null; /* honest failure: left out, never a fabricated fallback */
    }
    return root.DDAM13GoldenLesson;
  }

  root.DDAReloadM13LessonContent = loadM13Content;
  root.DDALazyContentReady = root.DDALazyContentReady || {};
  root.DDALazyContentReady['m1-3-lesson.js'] = loadM13Content();
})(typeof self !== 'undefined' ? self : this);
