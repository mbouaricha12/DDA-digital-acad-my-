/* DDA lazy modules — route-aware, idempotent and intentionally dependency-light. */
(function () {
  'use strict';
  const loaded = new Map();
  const ready = new Set();
  const groups = {
    lessons: ['m1-1-lesson.js', 'm1-2-lesson.js', 'm1-3-lesson.js'],
    premium: ['p2-lessons.js'],
    markets: ['market-intelligence.js'],
    brvm: ['mbrvm-1-lesson.js'],
    // DDA Lab ("IA pour agir"): exactly the same deferred-loading model
    // already used for p2-lessons.js above (mandate §6 audit — dda-lab.js
    // was the only authored content file still loaded unconditionally for
    // 100% of visitors). This mitigates exposure by no longer fetching it
    // for a visitor who never opens the Lab; it is not, on its own, a fix
    // for the file's content still being publicly readable on direct
    // request — that is a separate, deeper fix tracked outside this file.
    ailab: ['dda-lab.js']
  };
  function loadScript(src) {
    if (loaded.has(src)) return loaded.get(src);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.dataset.ddaLazy = 'true';
      script.onload = resolve;
      script.onerror = () => reject(new Error(`DDA lazy module failed to load: ${src}`));
      document.head.appendChild(script);
    });
    loaded.set(src, promise);
    return promise;
  }
  function groupForView(view) {
    if (['lesson-m11', 'lesson-m12', 'lesson-m13'].includes(view)) return ['lessons'];
    if (['lesson-p21', 'lesson-p22', 'premium-track', 'premium-lab', 'premium-assessment'].includes(view)) return ['premium'];
    // #markets preloads the BRVM lesson too, so its "Introduction à la BRVM"
    // link never pays a second, visible lazy-load delay on click.
    if (view === 'markets') return ['markets', 'brvm'];
    if (view === 'lesson-mbrvm1') return ['brvm'];
    // DDA Lab catalog + its five lessons (LAB1-4, capstone). Note: 'premium-lab'
    // above is an unrelated, pre-existing feature (the Risk Plan Practice Lab) —
    // this is the separate "IA pour agir" track registered by dda-lab.js.
    if (['lab', 'lesson-lab1', 'lesson-lab2', 'lesson-lab3', 'lesson-lab4', 'lesson-lab-capstone'].includes(view)) return ['ailab'];
    return [];
  }
  // A deep-link is a deliberate request for a feature. During the parser
  // phase, preload only that feature's scripts so reloads remain deterministic
  // without paying the cost on the default Access/Dashboard route.
  const initialGroups = groupForView(location.hash.slice(1));
  if (initialGroups.length && document.readyState === 'loading') {
    const tags = initialGroups.flatMap(group => groups[group]).map(src => `<script src="${src}" data-dda-lazy="bootstrap"><\/script>`).join('');
    document.write(tags);
    initialGroups.forEach(group => ready.add(group));
  }
  async function ensure(view) {
    const groupsToLoad = groupForView(view);
    for (const group of groupsToLoad) {
      for (const src of groups[group]) {
        await loadScript(src);
        // Lot 2 (mandate §6 audit): a content-fetching module (currently
        // p2-lessons.js) can only start its authenticated BFF fetch once its
        // own script has actually run — that fetch necessarily outlives the
        // script tag's own `onload` (loadScript() above). Such a module
        // registers its in-flight fetch promise at
        // window.DDALazyContentReady[src] (keyed by its own filename, so
        // this stays generic for any future module) — awaiting it here
        // means curriculum rebuild / DOM mounting below never runs on
        // half-loaded Premium content. A plain script with no such entry is
        // unaffected: awaiting `undefined` resolves immediately.
        await window.DDALazyContentReady?.[src];
      }
    }
    if (groupsToLoad.includes('lessons') || groupsToLoad.includes('premium') || groupsToLoad.includes('brvm')) {
      window.DDA?.refreshCurriculum?.();
    }
    window.DDA_LAZY_REFRESH?.();
    groupsToLoad.forEach(group => ready.add(group));
    return view;
  }
  function needs(view) { return groupForView(view).length > 0; }
  function isReady(view) { return groupForView(view).every(group => ready.has(group)); }
  window.DDALazyModules = Object.freeze({ ensure, needs, isReady, loaded });
})();
