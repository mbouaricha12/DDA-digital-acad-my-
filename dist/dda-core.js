(function () {
  'use strict';

  const STORAGE_KEY = 'dda-prototype-state-v3';
  const LEGACY_KEYS = ['dda-prototype-state-v2', 'dda-prototype-state'];
  const SCHEMA_VERSION = 3;
  const EVENT_NAMES = new Set(['view_opened', 'onboarding_complete', 'lesson_understood', 'exercise_attempt', 'exercise_complete', 'quiz_attempt', 'quiz_complete', 'preference_updated', 'profile_updated', 'session_reset', 'access_denied', 'plan_preview']);
  const EVENT_METADATA_KEYS = new Set(['view', 'level', 'goal', 'lesson', 'correct', 'preference', 'enabled', 'permission', 'plan']);
  const ENTITLEMENTS = Object.freeze({
    visitor: ['dashboard_preview', 'access'],
    free: ['dashboard', 'path', 'lesson_m01', 'progress', 'profile', 'resources_free', 'membership', 'market_room', 'broker_hub', 'support'],
    premium: ['dashboard', 'path', 'lesson_m01', 'progress', 'profile', 'resources_free', 'membership', 'market_room', 'broker_hub', 'support', 'resources_premium', 'certificate_preview', 'advanced_modules']
  });

  const curriculum = Object.freeze({
    id: 'darius-free',
    title: 'Darius Free',
    modules: Array.from({ length: 10 }, (_, index) => ({
      id: `M${index}`,
      title: index === 0 ? 'Fondations des marchés' : `Module M${index}`,
      status: index === 0 ? 'active' : 'future',
      lessons: index === 0 ? [{ id: 'M0.1', title: 'Le trading comme commerce', estimatedMinutes: 12, status: 'active' }] : []
    }))
  });

  function emptyState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      user: null,
      membership: { plan: 'free', status: 'demo' },
      onboarding: null,
      progress: { lessonViewed: false, exerciseComplete: false, quizComplete: false, moduleProgress: 0, xp: 0 },
      preferences: { lowData: false, reminders: false },
      events: [],
      updatedAt: null
    };
  }

  function sanitizeText(value, maxLength) {
    return String(value || '').trim().replace(/[<>]/g, '').slice(0, maxLength);
  }

  function safePlan(value) { return value === 'premium' ? 'premium' : 'free'; }

  function normalizeLegacy(raw) {
    const next = emptyState();
    if (!raw || typeof raw !== 'object') return next;
    if (raw.schemaVersion === SCHEMA_VERSION && raw.progress) return Object.assign(next, raw, { membership: { plan: safePlan(raw.membership?.plan), status: 'demo' }, preferences: { ...next.preferences, ...raw.preferences }, events: Array.isArray(raw.events) ? raw.events.slice(-50) : [] });
    if (raw.user || raw.progress) {
      next.user = raw.user || null;
      next.membership = { plan: safePlan(raw.membership?.plan || raw.plan), status: 'demo' };
      next.onboarding = raw.onboarding || null;
      next.progress = { ...next.progress, ...(raw.progress || {}) };
      next.preferences = { ...next.preferences, ...(raw.preferences || {}) };
      next.events = Array.isArray(raw.events) ? raw.events.slice(-50) : [];
      return next;
    }
    next.user = raw.name ? { id: 'local-pilot', name: sanitizeText(raw.name, 60), email: sanitizeText(raw.email, 120).toLowerCase(), mode: 'device-demo' } : null;
    next.onboarding = raw.onboardingComplete ? { level: sanitizeText(raw.level, 40), goal: sanitizeText(raw.goal, 80), time: sanitizeText(raw.time, 80), complete: true } : null;
    next.progress = {
      lessonViewed: Boolean(raw.onboardingComplete),
      exerciseComplete: Boolean(raw.exerciseComplete),
      quizComplete: Boolean(raw.quizComplete),
      moduleProgress: Number(raw.moduleProgress || 0),
      xp: raw.quizComplete ? 120 : raw.exerciseComplete ? 60 : raw.onboardingComplete ? 30 : 0
    };
    return next;
  }

  function load() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) raw = LEGACY_KEYS.map(key => localStorage.getItem(key)).find(Boolean);
      return normalizeLegacy(JSON.parse(raw || '{}'));
    }
    catch { return emptyState(); }
  }

  function save(state) {
    const safe = normalizeLegacy(state);
    safe.schemaVersion = SCHEMA_VERSION;
    safe.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return safe;
  }

  function clear() { [STORAGE_KEY, ...LEGACY_KEYS].forEach(key => localStorage.removeItem(key)); return emptyState(); }

  function can(state, permission) {
    const tier = state?.user ? safePlan(state.membership?.plan) : 'visitor';
    return ENTITLEMENTS[tier].includes(permission);
  }

  window.DDA = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    curriculum,
    entitlements: ENTITLEMENTS,
    can,
    createUser(name, email) {
      return { id: `local-${Date.now()}`, name: sanitizeText(name, 60), email: sanitizeText(email, 120).toLowerCase(), mode: 'device-demo' };
    },
    load,
    save,
    clear,
    setPlan(state, plan) { return save({ ...state, membership: { plan: safePlan(plan), status: 'demo' } }); },
    track(state, name, metadata) {
      if (!EVENT_NAMES.has(name)) return state;
      const safeMetadata = {};
      Object.entries(metadata || {}).filter(([key]) => EVENT_METADATA_KEYS.has(key)).slice(0, 5).forEach(([key, value]) => { safeMetadata[key] = sanitizeText(value, 80); });
      const event = { name, at: new Date().toISOString(), metadata: safeMetadata };
      return save({ ...state, events: [...(state.events || []), event].slice(-50) });
    }
  });
})();
