/* DDA M1.1 — client loader.
   docs/RISK_REGISTER.md R-04 fix: the real M1.1 lesson text, exercises and
   quiz answers no longer live here, or in any other public, statically
   served file — anyone could read this file directly and see the full
   lesson and every correct quiz answer without defeating any
   authentication or entitlement check. They now live only on the
   authenticated BFF (bff/src/m1-content.js), behind
   GET /v1/m1/content/M1.1 (the same hasAdvancedModulesAccess() guard
   /v1/m1/preview already uses — M1 has no free-preview lesson, unlike
   P2.1, so every M1.* id requires it).

   This file only fetches that content and sets the exact same
   globalThis.DDAM1GoldenLesson global dda-core.js's buildCurriculum()
   already reads — the rest of the app never has to know the difference. A
   lesson that could not be fetched (not entitled yet, or a genuine
   server/network failure) is simply left null — buildCurriculum() already
   treats an absent M1 lesson as "not authored yet" (same honest fallback
   every other lazy content file relies on). window.DDALazyContentReady is
   awaited by dda-lazy-modules.js's ensure() before curriculum/DOM mounting
   runs, so it never runs on half-loaded content. */
(function (root) {
  'use strict';

  root.DDAM1GoldenLesson = null;

  async function loadM11Content() {
    if (!root.DDABFF || !root.DDABFF.enabled() || typeof root.DDABFF.fetchM1Content !== 'function') {
      root.DDAM1GoldenLesson = null;
      return root.DDAM1GoldenLesson;
    }
    try {
      const result = await root.DDABFF.fetchM1Content('M1.1');
      root.DDAM1GoldenLesson = result.lesson || null;
    } catch {
      root.DDAM1GoldenLesson = null; /* honest failure: left out, never a fabricated fallback */
    }
    return root.DDAM1GoldenLesson;
  }

  root.DDAReloadM11LessonContent = loadM11Content;
  root.DDALazyContentReady = root.DDALazyContentReady || {};
  root.DDALazyContentReady['m1-1-lesson.js'] = loadM11Content();
})(typeof self !== 'undefined' ? self : this);
