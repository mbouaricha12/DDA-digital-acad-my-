/* DDA lazy modules — route-aware, idempotent and intentionally dependency-light. */
(function () {
  'use strict';
  const loaded = new Map();
  const ready = new Set();
  const groups = {
    lessons: ['m1-1-lesson.js', 'm1-2-lesson.js', 'm1-3-lesson.js'],
    premium: ['p2-lessons.js'],
    markets: ['market-intelligence.js']
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
    if (view === 'markets') return ['markets'];
    return [];
  }
  // A deep-link is a deliberate request for a feature. During the parser
  // phase, preload only that feature's scripts so reloads remain deterministic
  // without paying the cost on the default Access/Dashboard route.
  const initialGroups = groupForView(location.hash.slice(1));
  try {
    const saved = JSON.parse(localStorage.getItem('dda-prototype-state-v4') || 'null');
    const hasM1Progress = Object.keys(saved?.lessons || {}).some(id => /^M1\./.test(id));
    if (hasM1Progress && !initialGroups.includes('lessons')) initialGroups.push('lessons');
  } catch { /* malformed or unavailable storage must never block the shell */ }
  if (initialGroups.length && document.readyState === 'loading') {
    const tags = initialGroups.flatMap(group => groups[group]).map(src => `<script src="${src}" data-dda-lazy="bootstrap"><\/script>`).join('');
    document.write(tags);
    initialGroups.forEach(group => ready.add(group));
  }
  async function ensure(view) {
    const groupsToLoad = groupForView(view);
    for (const group of groupsToLoad) {
      for (const src of groups[group]) await loadScript(src);
    }
    if (groupsToLoad.includes('lessons') || groupsToLoad.includes('premium')) {
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
