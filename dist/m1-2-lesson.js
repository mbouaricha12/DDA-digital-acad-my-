/* DDA M1.2 — client loader.
   docs/RISK_REGISTER.md R-04 fix: the real M1.2 lesson text, exercises and
   quiz answers no longer live here — see m1-1-lesson.js's header comment
   for the full rationale, identical for this file. They now live only on
   the authenticated BFF (bff/src/m1-content.js), behind
   GET /v1/m1/content/M1.2.

   This file only fetches that content and sets the exact same
   globalThis.DDAM12GoldenLesson global dda-core.js's buildCurriculum()
   already reads. */
(function (root) {
  'use strict';

  root.DDAM12GoldenLesson = null;

  async function loadM12Content() {
    if (!root.DDABFF || !root.DDABFF.enabled() || typeof root.DDABFF.fetchM1Content !== 'function') {
      root.DDAM12GoldenLesson = null;
      return root.DDAM12GoldenLesson;
    }
    try {
      const result = await root.DDABFF.fetchM1Content('M1.2');
      root.DDAM12GoldenLesson = result.lesson || null;
    } catch {
      root.DDAM12GoldenLesson = null; /* honest failure: left out, never a fabricated fallback */
    }
    return root.DDAM12GoldenLesson;
  }

  root.DDAReloadM12LessonContent = loadM12Content;
  root.DDALazyContentReady = root.DDALazyContentReady || {};
  root.DDALazyContentReady['m1-2-lesson.js'] = loadM12Content();
})(typeof self !== 'undefined' ? self : this);
