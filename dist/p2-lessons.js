/* DDA Premium P2 — client loader.
   Lot 2 (mandate §6 audit, MASTER_AUDIT_DDA_LAUNCH.md §6): the real lesson
   text, exercises and quiz answers for P2.1/P2.2 no longer live here, or in
   any other public, statically-served file — anyone could read this file
   directly and see every Premium lesson and every correct quiz answer
   without defeating any authentication. They now live only on the
   authenticated BFF (bff/src/premium-content.js), behind
   GET /v1/premium/content/:lessonId (the same hasActivePremium() guard
   /v1/premium/preview already uses; P2.1 is served to any authenticated
   learner as the Premium Track's free preview, exactly as the client
   already treats it despite its premium_track permission).

   This file only fetches that content and exposes the exact same
   window.DDAP2Lessons = { p21, p22 } shape dda-core.js's buildCurriculum()
   already reads — the rest of the app (lesson renderer, sequential gate,
   quiz contract, lazy-loading) never has to know the difference. A lesson
   that could not be fetched (not entitled yet, or a genuine server/network
   failure) is simply left out of window.DDAP2Lessons — buildCurriculum()
   and mountedLessons already treat an absent lesson as "not authored yet",
   the same honest fallback every other lazy content file already relies on
   (no fabricated placeholder content is ever shown in its place).

   window.DDAReloadPremiumLessonContent() lets app.js ask for a fresh fetch
   once the server actually confirms a Premium entitlement that this file's
   first attempt could not yet see (e.g. P2.1's preview was fetched for a
   Free learner before any Premium check ran) — see its call site in
   refreshServerPremiumEntitlement(). ensure() in dda-lazy-modules.js awaits
   this file's first fetch (via window.DDALazyContentReady) before it
   resolves, so curriculum/DOM mounting never runs on half-loaded content. */
(function () {
  'use strict';

  window.DDAP2Lessons = null;

  async function loadP2Content() {
    if (!window.DDABFF?.enabled() || typeof window.DDABFF.fetchPremiumContent !== 'function') {
      window.DDAP2Lessons = null;
      return window.DDAP2Lessons;
    }
    let p21 = null;
    let p22 = null;
    try {
      const result = await window.DDABFF.fetchPremiumContent('P2.1');
      p21 = result.lesson || null;
    } catch { /* honest failure: left out, never a fabricated fallback */ }
    try {
      const result = await window.DDABFF.fetchPremiumContent('P2.2');
      p22 = result.lesson || null;
    } catch { /* honest failure: left out, never a fabricated fallback */ }
    window.DDAP2Lessons = (p21 || p22) ? Object.freeze({ ...(p21 ? { p21 } : {}), ...(p22 ? { p22 } : {}) }) : null;
    return window.DDAP2Lessons;
  }

  window.DDAReloadPremiumLessonContent = loadP2Content;
  window.DDALazyContentReady = window.DDALazyContentReady || {};
  window.DDALazyContentReady['p2-lessons.js'] = loadP2Content();
})();
