(function () {
  'use strict';

  /* DDA Acquisition V1 — analytics adapter. */
  const FORWARDABLE_EVENTS = {
    landing_visit: 'landing_visit',
    onboarding_complete: 'dda_signup',
    broker_selected: 'broker_selected',
    affiliate_link_click: 'affiliate_link_click',
    activation_v1: 'activation_v1'
  };
  const SAFE_PROP_KEYS = ['source', 'medium', 'campaign', 'referrer', 'step', 'broker'];
  const DEBUG_QUEUE_LIMIT = 200;
  const debugQueue = [];
  let transport = 'debug';
  let initAttempted = false;

  function config() { return (typeof window !== 'undefined' && window.DDA_ANALYTICS_CONFIG) || {}; }
  function pushDebug(entry) { debugQueue.push(entry); if (debugQueue.length > DEBUG_QUEUE_LIMIT) debugQueue.shift(); }
  function safeProps(props) {
    const out = {};
    Object.entries(props || {}).forEach(([key, value]) => {
      if (SAFE_PROP_KEYS.includes(key) && value !== undefined && value !== null && value !== '') out[key] = String(value).slice(0, 120);
    });
    return out;
  }
  function loadPosthogScript(host) {
    return new Promise(resolve => {
      try {
        const script = document.createElement('script');
        script.src = `${host.replace(/\/$/, '')}/static/array.js`;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      } catch { resolve(false); }
    });
  }
  async function init() {
    if (initAttempted) return;
    initAttempted = true;
    const { posthogKey, posthogHost } = config();
    if (!posthogKey) return;
    try {
      const host = posthogHost || 'https://us.i.posthog.com';
      const loaded = await loadPosthogScript(host);
      if (loaded && typeof window.posthog !== 'undefined' && typeof window.posthog.init === 'function') {
        window.posthog.init(posthogKey, { api_host: host, autocapture: false, capture_pageview: false, disable_session_recording: true });
        transport = 'posthog';
      }
    } catch { transport = 'debug'; }
  }
  function send(name, props) {
    const externalName = FORWARDABLE_EVENTS[name];
    const entry = { at: new Date().toISOString(), localName: name, externalName: externalName || null, sent: false };
    if (!externalName) { pushDebug(entry); return; }
    const props_ = safeProps(props);
    const distinctId = props && props.visitorId ? String(props.visitorId).slice(0, 60) : undefined;
    entry.props = props_;
    entry.distinctId = distinctId;
    try {
      if (transport === 'posthog' && typeof window.posthog !== 'undefined' && distinctId) {
        window.posthog.identify(distinctId);
        window.posthog.capture(externalName, props_);
        entry.sent = true;
      }
    } catch {}
    pushDebug(entry);
  }
  window.DDAAnalytics = Object.freeze({ init, send, getDebugQueue() { return debugQueue.slice(); }, getTransport() { return transport; } });
  init();
})();

/* -------------------------------------------------------------------------
   M1.1 integration bridge — branch-only implementation.
   This runs before app.js. It synchronously loads the authored M1.1 lesson,
   inserts it into the existing curriculum, preserves DDALearning.nextActionable()
   as the source of truth, and transitions the main lesson reader to M1.1 once
   M0.1 + M0.2 + M0.3 are all complete. Nothing here changes production main
   until this draft PR is verified and merged.
--------------------------------------------------------------------------- */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.DDA) return;

  try {
    if (!window.DDAM1GoldenLesson) {
      const request = new XMLHttpRequest();
      request.open('GET', 'm1-1-lesson.js', false);
      request.send(null);
      if (request.status >= 200 && request.status < 300) {
        (0, eval)(request.responseText);
      }
    }
  } catch (error) {
    console.warn('DDA M1.1 bridge: lesson file unavailable; leaving base curriculum unchanged.', error);
    return;
  }

  const lesson = window.DDAM1GoldenLesson;
  if (!lesson) return;
  const base = window.DDA;

  const modules = base.curriculum.modules.map(module => {
    if (module.id !== 'M1') return module;
    return Object.freeze({ ...module, lessons: Object.freeze([lesson]) });
  });
  const curriculum = Object.freeze({ ...base.curriculum, modules: Object.freeze(modules) });

  function m0Complete(state) {
    return ['M0.1', 'M0.2', 'M0.3'].every(id => Boolean(state?.lessons?.[id]?.quizComplete));
  }

  const bootState = base.load();
  const primaryLessonId = m0Complete(bootState) ? 'M1.1' : base.primaryLessonId;

  function updateLesson(state, lessonId, patch) {
    const next = base.updateLesson(state, lessonId, patch);
    if (lessonId === 'M0.3' && patch && patch.quizComplete === true && m0Complete(next)) {
      try { sessionStorage.setItem('dda-m1-transition', 'ready'); } catch {}
      setTimeout(() => location.reload(), 180);
    }
    return next;
  }

  window.DDA = Object.freeze({
    ...base,
    curriculum,
    primaryLessonId,
    updateLesson
  });

  // M1.1 has three ungated reasoning checks before the real exercise gate.
  // The existing app binds the exercise and quiz through lesson.practice / lesson.evaluation.
  // This small branch-only listener adds explanatory feedback + retry to the three practice cases.
  document.addEventListener('DOMContentLoaded', () => {
    if (primaryLessonId !== 'M1.1') return;
    ['m1-buy-pressure', 'm1-sell-pressure', 'm1-balance'].forEach(name => {
      const group = document.querySelector(`[data-question="${name}"]`);
      if (!group || group.dataset.m1Bound === 'true') return;
      group.dataset.m1Bound = 'true';
      const feedback = document.getElementById(`${name}-feedback`);
      group.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
        group.querySelectorAll('button').forEach(item => item.classList.remove('correct', 'incorrect'));
        const correct = button.dataset.correct === 'true';
        button.classList.add(correct ? 'correct' : 'incorrect');
        if (feedback) {
          feedback.textContent = button.dataset.feedback || (correct ? 'Bonne lecture.' : 'Pas encore. Relis le principe, puis essaie à nouveau.');
          feedback.className = `feedback ${correct ? 'success' : 'error'}`;
        }
      }));
    });
  });
})();
