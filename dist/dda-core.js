(function () {
  'use strict';

  const STORAGE_KEY = 'dda-prototype-state-v4';
  const LEGACY_KEYS = ['dda-prototype-state-v3', 'dda-prototype-state-v2', 'dda-prototype-state'];
  const SCHEMA_VERSION = 4;
  const EVENT_NAMES = new Set(['view_opened', 'onboarding_complete', 'lesson_understood', 'exercise_attempt', 'exercise_complete', 'quiz_attempt', 'quiz_complete', 'preference_updated', 'profile_updated', 'session_reset', 'access_denied', 'plan_preview']);
  const EVENT_METADATA_KEYS = new Set(['view', 'level', 'goal', 'lesson', 'module', 'correct', 'preference', 'enabled', 'permission', 'plan']);
  const ENTITLEMENTS = Object.freeze({
    visitor: ['dashboard_preview', 'access'],
    free: ['dashboard', 'path', 'lesson_m01', 'progress', 'profile', 'resources_free', 'membership', 'market_room', 'broker_hub', 'support'],
    premium: ['dashboard', 'path', 'lesson_m01', 'progress', 'profile', 'resources_free', 'membership', 'market_room', 'broker_hub', 'support', 'resources_premium', 'certificate_preview', 'advanced_modules']
  });

  // M1-M9 are structural placeholders (empty lessons[]) — no content invented.
  const curriculum = Object.freeze({
    id: 'darius-free',
    title: 'Darius Free',
    modules: Object.freeze([
      {
        id: 'M0',
        title: 'Fondations des marchés',
        lessons: Object.freeze([
          {
            id: 'M0.1',
            title: 'Le trading comme commerce',
            summary: 'Acheteurs, vendeurs et échange d’un actif.',
            estimatedMinutes: 12,
            competency: { id: 'market_understanding', label: 'Compréhension des marchés' },
            xp: Object.freeze({ lessonViewed: 30, exerciseComplete: 60, quizComplete: 120 }),
            // Narrative beats, in reading order — this is the shape every future lesson (M0.2–M9)
            // will fill in. No content is invented for those; only M0.1 is authored.
            content: Object.freeze({
              lead: 'Avant de lire un graphique, commence par comprendre ce qui se passe réellement sur un marché.',
              concept: Object.freeze({
                heading: 'Le marché est un lieu d’échange',
                body: 'Le trading est une forme de commerce. Sur un marché, certains participants souhaitent acheter un actif et d’autres souhaitent le vendre. Le prix évolue lorsque l’équilibre entre ces intentions change.'
              }),
              principle: Object.freeze({
                label: 'Principe essentiel',
                text: 'Ton rôle n’est pas de deviner. Ton rôle est d’observer, comprendre et décider selon un plan.'
              }),
              diagram: 'exchange',
              example: Object.freeze({
                label: 'Exemple concret',
                text: 'Un participant achète de l’or tandis qu’un autre accepte de le vendre.'
              }),
              comparison: Object.freeze({
                heading: 'Deux façons d’aborder le même marché',
                bad: Object.freeze({ label: 'Réaction impulsive', items: Object.freeze(['Suivre le mouvement sans le comprendre', 'Décider sous le coup de l’émotion', 'Chercher un gain immédiat']) }),
                good: Object.freeze({ label: 'Décision méthodique', items: Object.freeze(['Observer avant d’agir', 'Suivre un plan écrit à l’avance', 'Accepter un risque défini']) })
              })
            }),
            practice: Object.freeze({
              id: 'exercise',
              label: 'Exercice',
              heading: 'Qui échange quoi ?',
              prompt: 'Quelle affirmation décrit le mieux ce qui vient de se passer ?',
              successText: 'Correct. Tu reconnais le mécanisme fondamental de l’échange.',
              choices: Object.freeze([
                Object.freeze({ text: 'Le prix monte toujours après un achat.', correct: false, feedback: 'Un achat ne garantit rien sur la suite : le prix dépend de l’équilibre entre toutes les intentions d’achat et de vente, pas d’une seule transaction.' }),
                Object.freeze({ text: 'Le marché met en relation des intentions d’achat et de vente.', correct: true }),
                Object.freeze({ text: 'Le vendeur connaît forcément l’avenir.', correct: false, feedback: 'Personne ne connaît l’avenir avec certitude. Le vendeur accepte simplement de céder l’actif à ce prix, maintenant.' })
              ])
            }),
            evaluation: Object.freeze({
              id: 'quiz',
              label: 'Quiz de validation',
              heading: 'Avant toute décision, que faut-il privilégier ?',
              successText: 'Correct. La discipline du processus passe avant la précipitation.',
              choices: Object.freeze([
                Object.freeze({ text: 'Entrer rapidement pour ne rien manquer.', correct: false, feedback: 'La précipitation est justement ce que ce module déconseille : observer avant d’agir protège ton capital.' }),
                Object.freeze({ text: 'Chercher un gain immédiat.', correct: false, feedback: 'Un gain isolé ne prouve rien sur la qualité d’une décision — c’est le principe essentiel vu plus haut.' }),
                Object.freeze({ text: 'Observer, comprendre et suivre un plan.', correct: true })
              ])
            }),
            result: Object.freeze({
              heading: 'Première compétence confirmée.',
              body: 'Tu as compris que le processus de décision passe avant le résultat.'
            })
          }
        ])
      },
      { id: 'M1', title: 'Comprendre les marchés financiers', summary: 'Pourquoi les prix évoluent et comment les marchés s’organisent.', lessons: Object.freeze([]) },
      { id: 'M2', title: 'Risque et discipline', summary: 'Protéger son capital avant de rechercher la performance.', lessons: Object.freeze([]) },
      { id: 'M3', title: 'Module M3', lessons: Object.freeze([]) },
      { id: 'M4', title: 'Module M4', lessons: Object.freeze([]) },
      { id: 'M5', title: 'Module M5', lessons: Object.freeze([]) },
      { id: 'M6', title: 'Module M6', lessons: Object.freeze([]) },
      { id: 'M7', title: 'Module M7', lessons: Object.freeze([]) },
      { id: 'M8', title: 'Module M8', lessons: Object.freeze([]) },
      { id: 'M9', title: 'Module M9', lessons: Object.freeze([]) }
    ])
  });

  const PRIMARY_LESSON_ID = curriculum.modules[0].lessons[0].id;

  function emptyLessonProgress() {
    return { lessonViewed: false, exerciseComplete: false, quizComplete: false };
  }

  function emptyState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      user: null,
      membership: { plan: 'free', status: 'demo' },
      onboarding: null,
      lessons: {},
      preferences: { lowData: false, reminders: false },
      events: [],
      updatedAt: null
    };
  }

  function sanitizeText(value, maxLength) {
    return String(value || '').trim().replace(/[<>]/g, '').slice(0, maxLength);
  }

  function safePlan(value) { return value === 'premium' ? 'premium' : 'free'; }

  function sanitizeLessons(rawLessons) {
    const lessons = {};
    if (rawLessons && typeof rawLessons === 'object') {
      Object.entries(rawLessons).forEach(([lessonId, entry]) => {
        if (!entry || typeof entry !== 'object') return;
        lessons[lessonId] = {
          lessonViewed: Boolean(entry.lessonViewed),
          exerciseComplete: Boolean(entry.exerciseComplete),
          quizComplete: Boolean(entry.quizComplete)
        };
      });
    }
    return lessons;
  }

  // v3 and earlier stored one flat `progress` object implicitly meaning M0.1.
  function migrateFlatProgress(progress) {
    if (!progress || typeof progress !== 'object') return {};
    const hasSignal = progress.lessonViewed || progress.exerciseComplete || progress.quizComplete;
    if (!hasSignal) return {};
    return {
      [PRIMARY_LESSON_ID]: {
        lessonViewed: Boolean(progress.lessonViewed),
        exerciseComplete: Boolean(progress.exerciseComplete),
        quizComplete: Boolean(progress.quizComplete)
      }
    };
  }

  function normalizeLegacy(raw) {
    const next = emptyState();
    if (!raw || typeof raw !== 'object') return next;

    if (raw.schemaVersion === SCHEMA_VERSION && raw.lessons) {
      return Object.assign(next, raw, {
        membership: { plan: safePlan(raw.membership?.plan), status: 'demo' },
        preferences: { ...next.preferences, ...raw.preferences },
        lessons: sanitizeLessons(raw.lessons),
        events: Array.isArray(raw.events) ? raw.events.slice(-50) : []
      });
    }

    // schemaVersion 3 (or unversioned object carrying a flat `progress`)
    if (raw.user || raw.progress) {
      next.user = raw.user || null;
      next.membership = { plan: safePlan(raw.membership?.plan || raw.plan), status: 'demo' };
      next.onboarding = raw.onboarding || null;
      next.lessons = sanitizeLessons(raw.lessons) ;
      if (Object.keys(next.lessons).length === 0) next.lessons = migrateFlatProgress(raw.progress);
      next.preferences = { ...next.preferences, ...(raw.preferences || {}) };
      next.events = Array.isArray(raw.events) ? raw.events.slice(-50) : [];
      return next;
    }

    // pre-schema (v1) flat shape
    next.user = raw.name ? { id: 'local-pilot', name: sanitizeText(raw.name, 60), email: sanitizeText(raw.email, 120).toLowerCase(), mode: 'device-demo' } : null;
    next.onboarding = raw.onboardingComplete ? { level: sanitizeText(raw.level, 40), goal: sanitizeText(raw.goal, 80), time: sanitizeText(raw.time, 80), complete: true } : null;
    next.lessons = migrateFlatProgress({
      lessonViewed: Boolean(raw.onboardingComplete),
      exerciseComplete: Boolean(raw.exerciseComplete),
      quizComplete: Boolean(raw.quizComplete)
    });
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
    return safe;
  }

  function clear() { [STORAGE_KEY, ...LEGACY_KEYS].forEach(key => localStorage.removeItem(key)); return emptyState(); }

  // Private/incognito storage limits or a full quota can make setItem throw.
  // The app must keep working in-memory for this session rather than crash.
  let storageAvailable = true;

  function can(state, permission) {
    const tier = state?.user ? safePlan(state.membership?.plan) : 'visitor';
    return ENTITLEMENTS[tier].includes(permission);
  }

  window.DDA = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    curriculum,
    primaryLessonId: PRIMARY_LESSON_ID,
    entitlements: ENTITLEMENTS,
    can,
    createUser(name, email) {
      return { id: `local-${Date.now()}`, name: sanitizeText(name, 60), email: sanitizeText(email, 120).toLowerCase(), mode: 'device-demo' };
    },
    load,
    save,
    clear,
    storageAvailable() { return storageAvailable; },
    emptyLessonProgress,
    setPlan(state, plan) { return save({ ...state, membership: { plan: safePlan(plan), status: 'demo' } }); },
    updateLesson(state, lessonId, patch) {
      const current = state.lessons?.[lessonId] || emptyLessonProgress();
      return save({ ...state, lessons: { ...state.lessons, [lessonId]: { ...current, ...patch } } });
    },
    track(state, name, metadata) {
      if (!EVENT_NAMES.has(name)) return state;
      const safeMetadata = {};
      Object.entries(metadata || {}).filter(([key]) => EVENT_METADATA_KEYS.has(key)).slice(0, 5).forEach(([key, value]) => { safeMetadata[key] = sanitizeText(value, 80); });
      const event = { name, at: new Date().toISOString(), metadata: safeMetadata };
      return save({ ...state, events: [...(state.events || []), event].slice(-50) });
    }
  });
})();
