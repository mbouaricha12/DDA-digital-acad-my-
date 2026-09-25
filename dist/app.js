/* ==========================================================================
   DDA LESSON REGISTRY — chaque leçon déclarée UNE SEULE FOIS.
   Audit de la restructuration : chaque leçon ajoutée au fil des tranches
   (M0.1 → M0.2 → M0.3 → M1.1 → M1.2) copiait-collait un bloc de montage, un
   appel renderLessonProgressUI, un bindMarkUnderstood, une section
   bindQuestion et des resets — plus des littéraux parallèles (titres
   d'écran, permissions, carte id→vue, carte vue→prérequis) qu'il fallait
   tenir synchronisés à la main, avec des incohérences réelles (table d'ids
   `m1-quiz-block` recopiée alors que le suffixe de M1.1 est `m11`). Ce
   registre unique remplace tout ça : montage, ids d'UI (lessonUiIds),
   routes, titres, permissions, verrou séquentiel, ancres de scroll et
   liaisons de questions en sont DÉRIVÉS. Ajouter une leçon = une entrée
   ici + ses mount points dans index.html — rien d'autre.
   Ce littéral reste volontairement des données pures (aucune référence
   externe) : le test le réévalue tel quel avec vm.
   ========================================================================== */
const LESSON_REGISTRY = Object.freeze([
  {
    id: 'M0.1', viewId: 'lesson', suffix: '', title: 'Leçon en cours',
    permission: 'lesson_m01',
    quizBlock: 'quiz', understoodScrollTo: 'exercise-block',
    questions: [
      { role: 'exercise', block: 'exercise', success: '@practice', gate: true },
      { role: 'quiz', block: 'quiz', success: '@data', result: true },
      { role: 'practice', block: 'comparison-choice', success: 'Bonne lecture.' }
    ]
  },
  {
    id: 'M0.2', viewId: 'lesson-m02', suffix: 'm2', title: 'Support & Résistance', prerequisite: 'M0.1',
    permission: 'lesson_m01',
    quizBlock: 'm2-quiz', understoodScrollTo: 'm2-observe-4-block',
    questions: [
      { role: 'practice', block: 'm2-identify-1', success: '@block', reveal: true },
      { role: 'practice', block: 'm2-identify-2', success: '@block', reveal: true },
      { role: 'practice', block: 'm2-myth-line', success: 'Bonne lecture.' },
      { role: 'practice', block: 'm2-spot-error', success: 'Bon réflexe critique.' },
      { role: 'exercise', block: 'm2-challenge-zone', success: '@block', gate: true, reveal: true },
      { role: 'quiz', block: 'm2-quiz', success: '@data', result: true }
    ]
  },
  {
    id: 'M0.3', viewId: 'lesson-m03', suffix: 'm3', title: 'Lire une tendance', prerequisite: 'M0.2',
    permission: 'lesson_m01',
    quizBlock: 'm3-quiz', understoodScrollTo: 'm3-observe-4-block',
    questions: [
      { role: 'practice', block: 'm3-classify-1', success: 'Bonne lecture.' },
      { role: 'practice', block: 'm3-classify-2', success: 'Bonne lecture.' },
      { role: 'practice', block: 'm3-classify-3', success: 'Bonne lecture.' },
      { role: 'exercise', block: 'm3-challenge', success: 'Bonne lecture — direction confirmée sans aide.', gate: true },
      { role: 'quiz', block: 'm3-quiz', success: '@data', result: true }
    ]
  },
  {
    // M1.1 est authored dans son propre fichier (m1-1-lesson.js) et promue dans
    // le curriculum par dda-core.js quand ce fichier est chargé ; si le fichier
    // est absent, l'entrée reste inerte au lieu d'un rendu partiel.
    // Matrice des droits CDCP-OS §4.2 (arbitrage D1 Option B) : M1+ réservé à
    // l'offre Standard/Pro (advanced_modules).
    id: 'M1.1', viewId: 'lesson-m11', suffix: 'm11', title: 'Pourquoi les prix évoluent ?', prerequisite: 'M0.3',
    permission: 'advanced_modules',
    quizBlock: 'm1-quiz', understoodScrollTo: 'm1-exercise-case-block',
    questions: [
      { role: 'practice', block: 'm1-buy-pressure', success: 'Bonne lecture du déséquilibre.' },
      { role: 'practice', block: 'm1-sell-pressure', success: 'Bonne lecture du déséquilibre.' },
      { role: 'practice', block: 'm1-balance', success: 'Bonne lecture de l’équilibre relatif.' },
      { role: 'exercise', block: 'm1-exercise', success: '@practice', gate: true },
      { role: 'quiz', block: 'm1-quiz', success: '@data', result: true }
    ]
  },
  {
    id: 'M1.2', viewId: 'lesson-m12', suffix: 'm12', title: 'Comment les ordres s’exécutent ?', prerequisite: 'M1.1',
    permission: 'advanced_modules',
    quizBlock: 'm12-quiz', understoodScrollTo: 'm12-slippage-case-block',
    questions: [
      { role: 'practice', block: 'm12-market-order', success: 'Bonne compréhension de l’ordre au marché.' },
      { role: 'practice', block: 'm12-limit-order', success: 'Bonne compréhension de l’ordre limite.' },
      { role: 'practice', block: 'm12-spread', success: 'Bonne lecture du spread.' },
      { role: 'exercise', block: 'm12-exercise', success: '@practice', gate: true },
      { role: 'quiz', block: 'm12-quiz', success: '@data', result: true }
    ]
  },
  {
    // M1.3 est authored dans son propre fichier (m1-3-lesson.js) et promue dans
    // le curriculum par dda-core.js quand ce fichier est chargé ; si le fichier
    // est absent, l'entrée reste inerte au lieu d'un rendu partiel.
    id: 'M1.3', viewId: 'lesson-m13', suffix: 'm13', title: 'Comment les marchés s’organisent ?', prerequisite: 'M1.2',
    permission: 'advanced_modules',
    quizBlock: 'm13-quiz', understoodScrollTo: 'm13-exercise-case-block',
    questions: [
      { role: 'practice', block: 'm13-actor', success: 'Bonne lecture des rôles sur un marché organisé.' },
      { role: 'practice', block: 'm13-market-type', success: 'Bonne distinction entre émission et échanges.' },
      { role: 'practice', block: 'm13-organized', success: 'Bonne lecture de l’organisation d’un marché.' },
      { role: 'exercise', block: 'm13-exercise', success: '@practice', gate: true },
      { role: 'quiz', block: 'm13-quiz', success: '@data', result: true }
    ]
  }
]);

// Résolution runtime du registre contre le curriculum réel : une leçon
// déclarée mais absente du curriculum (fichier authored non chargé) n'est pas
// montée — les boucles ci-dessous ne consomment que mountedLessons.
const mountedLessons = LESSON_REGISTRY
  .map(entry => ({ ...entry, meta: DDALearning.findLesson(DDA.curriculum, entry.id) }))
  .filter(entry => entry.meta);

const activeLessonId = DDA.primaryLessonId;
const activeLessonMeta = DDALearning.findLesson(DDA.curriculum, activeLessonId);
const activeLessonDef = activeLessonMeta.lesson;

// The lesson reader is data-driven: render each mounted lesson's markup into
// its mount points BEFORE anything below captures [data-view] buttons, so
// buttons generated inside lessons (Quitter, Voir ma Progression, …) get
// bound too. Une seule boucle pour toutes les leçons — plus de bloc copié.
mountedLessons.forEach(entry => {
  const suffix = entry.suffix || undefined;
  document.getElementById(`${entry.viewId}-main`).insertAdjacentHTML('beforeend', DDALessonRenderer.renderLessonMain(entry.meta.module, entry.meta.lesson, suffix));
  document.getElementById(`${entry.viewId}-outline`).innerHTML = DDALessonRenderer.renderLessonOutline(entry.meta.lesson, suffix);
});
function findLessonBlock(lessonDef, id) { return lessonDef.blocks.find(b => b.id === id); }

const buttons = document.querySelectorAll('[data-view]');
const views = document.querySelectorAll('.view');
const desktopItems = document.querySelectorAll('.nav-item');
const mobileItems = document.querySelectorAll('.mobile-nav button');
const contextTitle = document.getElementById('context-title');
const titles = {
  landing: 'Découvrir DDA', dashboard: 'Aujourd’hui', access: 'Créer mon compte', path: 'Mon parcours',
  progress: 'Progression', journal: 'Journal & Plan', resources: 'Ressources', markets: 'Marchés & BRVM', brokers: 'Broker Hub',
  membership: 'DDA Premium', support: 'Aide & support', profile: 'Mon profil', community: 'Communauté',
  practice: 'Pratique avancée', intelligence: 'Intelligence DDA',
  // Lesson screen titles are declared once, in LESSON_REGISTRY — never a
  // second hand-maintained list to keep in sync.
  ...Object.fromEntries(LESSON_REGISTRY.map(entry => [entry.viewId, entry.title]))
};
// V1.1 correction: 'dashboard' was never gated here even though DDA.curriculum's
// own entitlements model (dda-core.js ENTITLEMENTS) already lists 'dashboard' as a
// free/premium-only permission, not a visitor one — the deep-link/reload matrix this
// tranche requires (mandate item 3) surfaced that an anonymous visitor navigating
// straight to #dashboard bypassed Access entirely and saw the Terminal's real
// authenticated shell. Wiring it here uses the exact same, already-tested
// permission-gate showView() applies to every other protected view — no new logic.
const viewPermissions = {
  dashboard: 'dashboard', path: 'path', progress: 'progress', journal: 'journal', resources: 'resources_free',
  markets: 'market_room', brokers: 'broker_hub', membership: 'membership', support: 'support', profile: 'profile',
  community: 'community', practice: 'practice', intelligence: 'intelligence',
  // Matrice des droits CDCP-OS §4.2 (arbitrage D1 validé, Option B) : M0 en
  // Free (lesson_m01), M1+ réservé à l'offre Standard/Pro (advanced_modules) —
  // dérivé du registre, jamais une liste parallèle écrite à la main.
  ...Object.fromEntries(LESSON_REGISTRY.map(entry => [entry.viewId, entry.permission || 'lesson_m01']))
};
// Maps a lesson id to the view that actually renders it — the Terminal cockpit's
// "continue" button follows DDALearning.nextActionable, which will point at the
// next authored lesson the moment the previous lesson's quiz is complete;
// without this map it would still say "Reprendre la leçon" but navigate to the
// wrong view instead. Derived from the registry — one declaration per lesson.
const LESSON_VIEW_ID = Object.freeze(Object.fromEntries(LESSON_REGISTRY.map(entry => [entry.id, entry.viewId])));
// Les identifiants d'UI d'une leçon découlent de son suffixe de registre —
// plus aucune table d'ids recopiée à la main (source passée d'incohérences).
function lessonUiIds(entry) {
  const suffix = entry.suffix ? `-${entry.suffix}` : '';
  return {
    loopId: `lesson-loop${suffix}`,
    outlineListId: `lesson-outline-list${suffix}`,
    gateId: `${entry.quizBlock}-block`,
    evalName: entry.quizBlock,
    resultId: `result-card${suffix}`,
    markUnderstoodId: `mark-understood${suffix}`,
    savedStateId: `saved-state${suffix}`,
    resultStatsId: `result-stats${suffix}`
  };
}
const MODULE_STATUS_LABEL = { completed: 'Terminé', in_progress: 'En cours', available: 'Disponible', locked: 'Verrouillé', coming_soon: 'Prochainement' };
// Structural demo only — no real index value, date or amount. Swap for a real feed's response later without touching the markup.
const MARKET_DEMO = {
  indices: [
    { label: 'BRVM Composite', description: 'Indice large de la cote BRVM.' },
    { label: 'BRVM 30', description: 'Indice des valeurs les plus liquides de la cote.' }
  ],
  calendar: [
    { company: 'Société A', event: 'Détachement de dividende' },
    { company: 'Société B', event: 'Mise en paiement' },
    { company: 'Société C', event: 'Assemblée générale' }
  ]
};
const NEXT_STEP_PHRASE = { lesson: 'voir la leçon', exercise: 'réussir l’exercice', quiz: 'valider le quiz' };

// Illustrative candlestick shape (never real price data — same "Mode pédagogique"
// honesty as the badge next to it) replacing a generic line sparkline with DDA's
// own visual signature: blue/ivory candles, never green/red (§ zéro signal).
const CANDLE_PATTERNS = [
  [6, 14, 4, 16, 9, 15, 5, 17],
  [10, 15, 12, 6, 16, 8, 13, 7]
];
function candlestickSpark(patternIndex) {
  const pattern = CANDLE_PATTERNS[patternIndex % CANDLE_PATTERNS.length];
  const bars = pattern.map((open, i) => {
    const close = pattern[(i + 1) % pattern.length];
    const x = 6 + i * 15.5;
    const top = 30 - Math.max(open, close) * 1.5;
    const bottom = 30 - Math.min(open, close) * 1.5;
    const wickTop = top - 3;
    const wickBottom = bottom + 3;
    const up = close >= open;
    const fill = up ? 'var(--cta-blue-2)' : 'rgba(244,247,252,.4)';
    return `<line x1="${x + 3.5}" y1="${wickTop}" x2="${x + 3.5}" y2="${wickBottom}" stroke="${fill}" stroke-width="1"/><rect x="${x}" y="${top}" width="7" height="${Math.max(bottom - top, 1.5)}" fill="${fill}" rx="1"/>`;
  }).join('');
  return `<svg class="index-sparkline candlestick" viewBox="0 0 120 34" aria-hidden="true">${bars}</svg>`;
}

// Daily Value Loop V1 — "Pourquoi cette action ?". Keyed by the exact same
// `step` DDALearning.lessonNextStep() already returns (see NEXT_STEP_PHRASE
// above) — never a second, parallel notion of lesson state. One honest
// sentence per real state, nothing computed here that the engine doesn't
// already know.
// No 'review' key: nextActionable() (learning-engine.js) never returns a
// lesson whose lessonNextStep() is 'review' (that only fires once quizComplete
// is true, i.e. once the lesson IS completed) — the real "everything validated"
// rationale lives in renderTerminalLeadComplete(), not here.
const WHY_PHRASE = {
  lesson: 'Proposé parce que tu n’as pas encore ouvert cette leçon — c’est la première étape non commencée de ton parcours.',
  exercise: 'Proposé parce que tu as compris la leçon mais n’as pas encore validé l’exercice qui la confirme.',
  quiz: 'Proposé parce que l’exercice est validé — il ne reste que le quiz pour confirmer cette compétence.'
};

// The four levels DDA will ever claim for a competency, and the only real signal
// each one is allowed to rest on. Levels 2-4 come from durably stored lesson
// progress (state.lessons), so once earned they can never be lost. Level 1
// (Découvrir) is read from the rolling `events` log (capped at 50 — see
// competencyLevel below) since the current schema keeps no durable "opened but
// not yet understood" flag; this is a real, honest signal, just a narrower
// window than the durable ones above it.
const COMPETENCY_LEVEL_LABEL = { 0: 'Pas encore commencé', 1: 'Découvert', 2: 'Compris', 3: 'Appliqué', 4: 'Maîtrisé' };

// lessonProgress alone can only ever prove Comprendre/Appliquer/Maîtriser (durable
// booleans). Découvrir additionally needs lessonId to check the lesson's own
// view_opened events — never invented, and never claimed once a durable signal
// above it already exists.
function competencyLevel(lessonId, lessonProgress) {
  if (lessonProgress.quizComplete) return 4;
  if (lessonProgress.exerciseComplete) return 3;
  if (lessonProgress.lessonViewed) return 2;
  const viewId = LESSON_VIEW_ID[lessonId] || lessonId;
  const discovered = (prototypeState.events || []).some(event => event.name === 'view_opened' && event.metadata?.view === viewId);
  return discovered ? 1 : 0;
}

// Every lesson with real content shares this exact four-step evidence path — never
// a fabricated fifth step, never a skipped one. `lesson` metadata on
// lesson_understood/exercise_complete/quiz_complete already scopes each event to
// the lesson that produced it (bindMarkUnderstood/bindQuestion), so two lessons'
// timelines never cross-contaminate each other's "when".
function lessonProofMilestones(lessonId) {
  const viewId = LESSON_VIEW_ID[lessonId] || lessonId;
  return [
    { level: 1, label: 'Leçon ouverte', matches: event => event.name === 'view_opened' && event.metadata?.view === viewId, done: lp => competencyLevel(lessonId, lp) >= 1 },
    { level: 2, label: 'Leçon comprise', matches: event => event.name === 'lesson_understood' && event.metadata?.lesson === lessonId, done: lp => lp.lessonViewed },
    { level: 3, label: 'Exercice validé', matches: event => event.name === 'exercise_complete' && event.metadata?.lesson === lessonId, done: lp => lp.exerciseComplete },
    { level: 4, label: 'Quiz validé — compétence confirmée', matches: event => event.name === 'quiz_complete' && event.metadata?.lesson === lessonId, done: lp => lp.quizComplete }
  ];
}

function relativeTime(iso) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

function countActiveDays(events) {
  return new Set((events || []).map(event => event.at.slice(0, 10))).size;
}

// Real, computed from the same event log as countActiveDays — never fabricated —
// scoped to a single view's own "view_opened" events (e.g. how many distinct days
// this device has opened Market Intelligence).
function countActiveDaysForView(events, viewId) {
  return new Set((events || [])
    .filter(event => event.name === 'view_opened' && event.metadata?.view === viewId)
    .map(event => event.at.slice(0, 10))).size;
}

let prototypeState = DDA.load();

// Acquisition V1 — first-touch capture, a no-op after the first call on this
// device (see DDA.captureAcquisition). Runs on every boot, before any view is
// shown, so a shared link's UTM parameters are captured however deep into the
// app it points (not only through #landing).
prototypeState = DDA.captureAcquisition(prototypeState, {
  source: new URLSearchParams(location.search).get('utm_source'),
  medium: new URLSearchParams(location.search).get('utm_medium'),
  campaign: new URLSearchParams(location.search).get('utm_campaign'),
  referrer: document.referrer,
  landingPath: location.pathname + location.hash
});

function saveState(update) {
  prototypeState = DDA.save({ ...prototypeState, ...update });
  renderState();
}

function updateLessonState(lessonId, patch) {
  prototypeState = DDA.updateLesson(prototypeState, lessonId, patch);
  renderState();
}

function trackEvent(name, metadata) {
  prototypeState = DDA.track(prototypeState, name, metadata);
  // Single choke point forwarding to the acquisition analytics adapter (see
  // dda-analytics.js). Guarded and wrapped so a missing/failed adapter never
  // breaks the product — PostHog is never a dependency of the core app.
  if (window.DDAAnalytics) {
    try { window.DDAAnalytics.send(name, { ...metadata, visitorId: prototypeState.acquisition?.visitorId }); }
    catch { /* analytics must never break the product */ }
  }
  renderState();
}

function addJournalEntry(fields) {
  prototypeState = DDA.addJournalEntry(prototypeState, fields);
  renderState();
}

function updateJournalEntry(id, fields) {
  prototypeState = DDA.updateJournalEntry(prototypeState, id, fields);
  renderState();
}

function deleteJournalEntry(id) {
  prototypeState = DDA.deleteJournalEntry(prototypeState, id);
  renderState();
}

function saveJournalPlan(fields) {
  prototypeState = DDA.saveJournalPlan(prototypeState, fields);
  renderState();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 2600);
}

function setLoading(active, message = 'Préparation de ton parcours…') {
  const layer = document.getElementById('loading-layer');
  layer.querySelector('p').textContent = message;
  layer.hidden = !active;
}

function moduleStatusLabel(status, renderable) {
  if (status === DDALearning.MODULE_STATUS.COMPLETED) return 'VALIDÉE';
  if (status === DDALearning.MODULE_STATUS.LOCKED) return 'VERROUILLÉE';
  if (status === DDALearning.MODULE_STATUS.COMING_SOON) return 'À SUIVRE';
  return renderable ? 'EN COURS' : 'DISPONIBLE';
}

function moduleActionLabel(status, renderable) {
  if (status === DDALearning.MODULE_STATUS.COMPLETED) return renderable ? 'Revoir' : 'Terminé';
  if (status === DDALearning.MODULE_STATUS.LOCKED || status === DDALearning.MODULE_STATUS.COMING_SOON) return 'Verrouillée';
  return renderable ? 'Continuer' : 'Ouvrir';
}

// The Parcours screen is a journey, not a stack of identical cards: one rich
// "current chapter" for the single authored module, then a compact connected
// rail for the honestly-labeled modules still to come (never a fake card per
// module). All text comes straight from curriculum data — nothing invented.
function renderPathJourney() {
  const container = document.getElementById('path-list');
  if (!container) return;
  const modules = DDA.curriculum.modules;
  // Parcours must follow the same next-action truth as Terminal/Progression.
  // The previous implementation always picked the module containing M0.1,
  // which kept the hero visually pinned to M0 even after the learner advanced
  // into M1. Resolve the real current target first, then derive its module.
  const continueTarget = resolveContinueTarget();
  const currentLessonTarget = continueTarget || lastAuthoredLesson();
  const currentModule = currentLessonTarget?.module || modules[0];
  const currentIndex = Math.max(0, modules.findIndex(module => module.id === currentModule.id));
  const currentStatus = DDALearning.moduleStatus(DDA.curriculum, currentModule.id, prototypeState);
  const currentLesson = currentLessonTarget ? currentLessonTarget.lesson : currentModule.lessons[0];
  const currentView = currentLessonTarget ? (LESSON_VIEW_ID[currentLesson.id] || 'lesson') : 'lesson';
  const currentNumber = String(currentIndex + 1).padStart(2, '0');
  const lessonCount = currentModule.lessons.length;
  const actionLabel = continueTarget ? moduleActionLabel(currentStatus, true) : 'Revoir';
  // Parcours reconstruction (Phase A): the hero now states *why* this is the
  // current chapter — same WHY_PHRASE/lessonNextStep() truth the Terminal
  // already shows, reused verbatim so the two screens never disagree.
  const why = continueTarget
    ? (WHY_PHRASE[DDALearning.lessonNextStep(DDALearning.getLessonProgress(prototypeState, continueTarget.lesson.id))] || '')
    : 'Compétence validée — reviens ici quand un nouveau module sera disponible.';

  // UX Focus V1: only the nearest future modules belong in the default journey.
  // Hiding distant placeholders keeps Parcours focused on the learner's real horizon.
  const futureCandidates = modules.map((module, index) => ({ module, index }))
    .filter(({ index }) => index > currentIndex);
  // Mobile/product clarity: the journey rail only surfaces future modules that
  // already have meaningful authored framing. Bare placeholder modules such as
  // "À venir" belong in the compact future count, not beside the real next module.
  const futureModules = futureCandidates
    .filter(({ module }) => module.title !== 'À venir' && Boolean(module.summary))
    .slice(0, 3);
  const rail = futureModules.map(({ module, index }) => {
    const status = DDALearning.moduleStatus(DDA.curriculum, module.id, prototypeState);
    const number = String(index + 1).padStart(2, '0');
    return `<li class="journey-node ${status}"><span class="journey-dot"></span><span class="path-number">${number}</span><div><small>${moduleStatusLabel(status, false)}</small><strong>${module.title}</strong>${module.summary ? `<p>${module.summary}</p>` : ''}</div></li>`;
  }).join('');
  const hiddenFutureCount = Math.max(0, futureCandidates.length - futureModules.length);
  const futureNote = hiddenFutureCount > 0
    ? `<p class="journey-future-note">+${hiddenFutureCount} module${hiddenFutureCount > 1 ? 's' : ''} prévu${hiddenFutureCount > 1 ? 's' : ''} plus loin dans le parcours — affiché${hiddenFutureCount > 1 ? 's' : ''} quand ils deviennent pertinents.</p>`
    : '';

  container.innerHTML = `
    <button class="journey-current" data-view="${currentView}">
      <div class="journey-current-eyebrow"><span class="path-number">${currentNumber}</span><div><small>${moduleStatusLabel(currentStatus, true)}</small><span class="journey-current-tag">${currentModule.title}</span></div></div>
      <h2>${currentLesson.title}</h2>
      <p>${currentLesson.summary}</p>
      <p class="journey-current-why"><svg class="icon"><use href="#icon-compass"/></svg><span>${why}</span></p>
      <div class="journey-meta"><span><svg class="icon"><use href="#icon-clock"/></svg>${currentLesson.estimatedMinutes} min</span><span><svg class="icon"><use href="#icon-book"/></svg>${lessonCount} leçon${lessonCount > 1 ? 's' : ''}</span></div>
      <span class="primary-action">${actionLabel} <span>→</span></span>
    </button>
    <ol class="journey-rail" aria-label="Prochains modules du parcours">${rail}</ol>
    ${futureNote}`;
  container.querySelector('.journey-current').addEventListener('click', () => showView(currentView));
}

function renderModulesRecap() {
  const container = document.getElementById('modules-recap-list');
  if (!container) return;
  const modules = DDA.curriculum.modules;
  const next = DDALearning.nextActionable(DDA.curriculum, prototypeState);
  const activeModuleId = next?.module?.id || modules.find(module => module.lessons.some(lesson => DDALearning.getLessonProgress(prototypeState, lesson.id).quizComplete))?.id || 'M0';
  const activeIndex = Math.max(0, modules.findIndex(module => module.id === activeModuleId));
  const visibleModules = modules.slice(0, Math.min(modules.length, Math.max(3, activeIndex + 2)));
  container.innerHTML = visibleModules.map(module => {
    const status = DDALearning.moduleStatus(DDA.curriculum, module.id, prototypeState);
    return `<li><span class="module-id">${module.id}</span><strong>${module.title}</strong><span class="module-pill ${status}">${MODULE_STATUS_LABEL[status] || status}</span></li>`;
  }).join('');
  const hidden = modules.length - visibleModules.length;
  if (hidden > 0) container.insertAdjacentHTML('beforeend', `<li class="modules-recap-more"><span class="module-id">…</span><strong>${hidden} modules plus loin</strong><span class="module-pill coming_soon">Progressif</span></li>`);
}

function renderMarketIntelligence() {
  const indices = document.getElementById('market-indices');
  if (indices) {
    indices.innerHTML = MARKET_DEMO.indices.map((item, i) => `
      <article class="index-card">
        <div class="index-card-head"><strong>${item.label}</strong><span class="data-badge"><svg class="icon"><use href="#icon-blocked"/></svg>Mode pédagogique</span></div>
        ${candlestickSpark(i)}
        <p>${item.description}</p>
      </article>
    `).join('');
  }
  const calendar = document.getElementById('market-calendar-list');
  if (calendar) {
    calendar.innerHTML = MARKET_DEMO.calendar.map(row => `
      <li><div><strong>${row.company}</strong><small>${row.event}</small></div><span class="data-badge"><svg class="icon"><use href="#icon-clock"/></svg>Exemple</span></li>
    `).join('');
  }
}

// The real, curriculum-flattened list of lessons with actual authored content —
// M1-M9 have none yet (empty lessons[]), so they never appear here. Drives the
// deep "Fil de maîtrise" view on Progression; Terminal shows only the current
// lesson via resolveContinueTarget() — same competencyLevel() underneath, so the
// two screens can never disagree about the same competency's real state.
function authoredLessons() {
  const flat = [];
  DDA.curriculum.modules.forEach(module => module.lessons.forEach(lesson => flat.push({ module, lesson })));
  return flat;
}

// The complete, honest Fil de maîtrise for Progression: one real row per authored
// lesson's own named competency (never a fabricated shared "domain" score merging
// several lessons into one number), each with its real 4-step evidence trail —
// plus the competencies nothing authored yet measures, shown as exactly that,
// never as a guaranteed "next" competency (mandate §7).
function renderMasteryList() {
  const container = document.getElementById('mastery-list');
  if (!container) return;
  const events = prototypeState.events || [];
  const next = DDALearning.nextActionable(DDA.curriculum, prototypeState);
  const all = authoredLessons();

  // UX Focus V1: Progression opens on useful evidence, not a wall of untouched rows.
  // Keep completed competencies plus the single current lesson; future untouched lessons stay contextual.
  const visible = all.filter(({ lesson }) => {
    const lp = DDALearning.getLessonProgress(prototypeState, lesson.id);
    return lp.quizComplete || lesson.id === next?.lesson?.id;
  });
  const rowsToRender = visible.length ? visible : all.slice(0, 1);

  const rows = rowsToRender.map(({ lesson }) => {
    const lessonProgress = DDALearning.getLessonProgress(prototypeState, lesson.id);
    const level = competencyLevel(lesson.id, lessonProgress);
    const proofMilestones = lessonProofMilestones(lesson.id);
    const milestones = proofMilestones.map(milestone => {
      const done = milestone.done(lessonProgress);
      const event = [...events].reverse().find(milestone.matches);
      const when = done ? (event ? relativeTime(event.at) : 'Complété') : 'À venir';
      const icon = done ? '<svg class="icon"><use href="#icon-check-circle"/></svg>' : '';
      return `<li class="${done ? 'done' : 'pending'}"><span class="proof-dot">${icon}</span><div><strong>${milestone.label}</strong><small>${when}</small></div></li>`;
    }).join('');
    const lessonView = LESSON_VIEW_ID[lesson.id] || 'lesson';
    const missingMilestone = proofMilestones.find(milestone => milestone.level > level);
    const nextStepNote = missingMilestone
      ? `Prochaine preuve : ${missingMilestone.label}.`
      : 'Compétence confirmée sur cet appareil.';
    return `
      <article class="mastery-row mastery-row-focused">
        <div class="mastery-row-head">
          <div><p class="mastery-lesson">${lesson.id} — ${lesson.title}</p><strong>${lesson.competency.label}</strong></div>
          <div class="mastery-level">
            <div class="terminal-thread-beads" role="img" aria-label="${beadsAriaLabel(level)}">${renderBeads(level)}</div>
            <span>${COMPETENCY_LEVEL_LABEL[level]}</span>
          </div>
        </div>
        <ol class="proof-timeline">${milestones}</ol>
        <p class="mastery-next-step">${nextStepNote}</p>
        <button class="text-action mastery-row-lesson-link" type="button" data-view="${lessonView}">${level >= 4 ? 'Revoir cette leçon' : 'Continuer cette leçon'} <span>→</span></button>
      </article>`;
  }).join('');

  const hiddenCount = Math.max(0, all.length - rowsToRender.length);
  const context = hiddenCount > 0
    ? `<div class="mastery-context-note"><strong>${hiddenCount} compétence${hiddenCount > 1 ? 's' : ''} plus loin dans ton parcours.</strong><span>Elles apparaîtront ici quand elles deviennent utiles.</span></div>`
    : '';
  container.innerHTML = rows + context;
}

function renderPracticeProof() {
  const container = document.getElementById('progress-practice-proof');
  if (!container) return;
  const practice = prototypeState.terminal?.practice;
  if (!practice?.attempts) {
    container.innerHTML = '<p class="practice-proof-empty">Aucune mission validée pour le moment. Le Terminal te proposera une première lecture guidée.</p>';
    return;
  }
  const validated = practice.status === 'validated';
  container.innerHTML = `<div class="practice-proof-row ${validated ? 'is-validated' : 'is-retry'}"><span class="practice-proof-icon">${validated ? '✓' : '↻'}</span><div><strong>Zone Support/Résistance — Practice Terminal</strong><p>${practice.feedback || 'Mission tentée localement.'}</p><small>${validated ? 'Preuve de pratique conservée sur cet appareil.' : 'Mission à reprendre — elle ne compte pas comme compétence acquise.'}</small></div></div>`;
}

// Product state connection (Navigation Integrity V1, mandat §4/§9): Progression
// → compétence → leçon pertinente. Delegated once on the stable container since
// renderMasteryList() regenerates its children on every renderState() call —
// the static buttons.forEach binding at load time never sees these.
document.getElementById('mastery-list')?.addEventListener('click', event => {
  const button = event.target.closest('.mastery-row-lesson-link');
  if (button) showView(button.dataset.view);
});

// The same nextActionable() call Terminal's "continue" button already uses — never
// a second, diverging notion of "what's next". Journal's count is shown only as
// activity/reflection context (mandate §9) — it is never read into the level above.
function renderProgressNextStep() {
  const el = document.getElementById('progress-next-step');
  if (el) {
    const next = DDALearning.nextActionable(DDA.curriculum, prototypeState);
    el.textContent = next
      ? `Continuer ${next.lesson.title} (${next.lesson.id}) — ${NEXT_STEP_PHRASE[next.step] || 'continuer'}.`
      : 'Toutes les leçons disponibles sont validées. Ton prochain module sera bientôt disponible.';
  }
  const noteEl = document.getElementById('progress-journal-note');
  if (!noteEl) return;
  const count = (prototypeState.journal?.entries || []).length;
  noteEl.hidden = count === 0;
  if (count > 0) noteEl.textContent = `${count} réflexion${count > 1 ? 's' : ''} enregistrée${count > 1 ? 's' : ''} dans ton Journal — une preuve de pratique et de réflexion, jamais un niveau de compétence.`;
}

function renderProgressHero() {
  const startedEl = document.getElementById('progress-modules-started');
  if (!startedEl) return;
  const started = DDA.curriculum.modules.filter(module => {
    const status = DDALearning.moduleStatus(DDA.curriculum, module.id, prototypeState);
    return status === DDALearning.MODULE_STATUS.IN_PROGRESS || status === DDALearning.MODULE_STATUS.COMPLETED;
  }).length;
  const startedLabel = `${started}/${DDA.curriculum.modules.length}`;
  const totalXp = DDALearning.totalXp(DDA.curriculum, prototypeState);
  const activeDays = countActiveDays(prototypeState.events);
  startedEl.textContent = startedLabel;
  document.getElementById('progress-total-xp').textContent = String(totalXp);
  document.getElementById('progress-active-days').textContent = String(activeDays);
  // Profil mirrors the exact same real values as Progression — never a second,
  // diverging computation of "how far has this learner gotten".
  document.getElementById('profile-modules-started').textContent = startedLabel;
  document.getElementById('profile-total-xp').textContent = String(totalXp);
  document.getElementById('profile-active-days').textContent = String(activeDays);
}

// Real data only: learner's own name, the real completed lesson, and the real
// event timestamp. Unmistakably a preview — never anything resembling a real,
// verifiable credential.
function renderCertificatePreview(lessonProgress) {
  const locked = document.getElementById('certificate-locked');
  if (!locked) return;
  const gate = document.getElementById('certificate-gate');
  const preview = document.getElementById('certificate-preview-block');
  const eligible = Boolean(lessonProgress.quizComplete);
  const premium = DDA.can(prototypeState, 'certificate_preview');

  locked.hidden = eligible;
  gate.hidden = !eligible || premium;
  preview.hidden = !eligible || !premium;
  if (!eligible || !premium) return;

  const name = prototypeState.user?.name || 'Richard';
  const event = [...(prototypeState.events || [])].reverse().find(e => e.name === 'quiz_complete');
  const date = event ? new Date(event.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  document.getElementById('certificate-name').textContent = name;
  document.getElementById('certificate-module').textContent = `${activeLessonMeta.module.title} — ${activeLessonDef.title}`;
  document.getElementById('certificate-date').textContent = date ? `Complété le ${date}` : 'Complété localement';
}

// ---------- Journal & Plan ----------
const JOURNAL_FIELD_LABELS = {
  context: 'Contexte',
  scenario: 'Scénario envisagé',
  process: 'Processus suivi',
  decision: 'Décision prise',
  outcome: 'Résultat ou issue',
  whatWorked: 'Ce qui a été bien fait',
  toImprove: 'Ce qui doit être amélioré',
  note: 'Note personnelle'
};
let journalEditingId = null;
let journalComposerTrigger = null;
let journalStep = 1;

function formatJournalDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderJournalList() {
  const list = document.getElementById('journal-list');
  if (!list) return;
  const entries = prototypeState.journal?.entries || [];
  document.getElementById('journal-count').textContent = `${entries.length} entrée${entries.length > 1 ? 's' : ''}`;
  document.getElementById('journal-empty').hidden = entries.length > 0;
  const lastEntryLine = document.getElementById('journal-last-entry');
  lastEntryLine.hidden = entries.length === 0;
  if (entries.length) lastEntryLine.textContent = `Dernière entrée : ${formatJournalDate(entries[0].createdAt)}`;
  list.innerHTML = entries.map((entry, idx) => {
    const detailRows = Object.entries(JOURNAL_FIELD_LABELS)
      .filter(([field]) => entry[field])
      .map(([field, label]) => `<div><dt>${label}</dt><dd>${entry[field]}</dd></div>`)
      .join('');
    const snippet = entry.decision || entry.scenario || entry.context || 'Aucun détail renseigné.';
    const entryNumber = String(entries.length - idx).padStart(2, '0');
    return `
      <li class="journal-entry-card">
        <details>
          <summary>
            <span class="journal-entry-index">${entryNumber}</span>
            <span class="journal-entry-market">${entry.market || 'Sans marché précisé'}</span>
            <span class="journal-entry-date">${formatJournalDate(entry.createdAt)}</span>
            <span class="journal-entry-snippet">${snippet.slice(0, 90)}</span>
          </summary>
          <div class="journal-entry-detail">
            <dl>${detailRows || '<div><dd>Aucun détail renseigné.</dd></div>'}</dl>
            <div class="journal-entry-actions">
              <button class="secondary-action dark-action journal-entry-edit" data-id="${entry.id}" type="button">Modifier</button>
              <button class="text-action journal-entry-delete" data-id="${entry.id}" type="button">Supprimer</button>
            </div>
          </div>
        </details>
      </li>`;
  }).join('');
}

function renderJournalPlan() {
  const form = document.getElementById('journal-plan-form');
  if (!form) return;
  const plan = prototypeState.journal?.plan || {};
  document.getElementById('plan-markets').value = plan.marketsStudied || '';
  document.getElementById('plan-slots').value = plan.studySlots || '';
  document.getElementById('plan-checklist').value = plan.checklist || '';
  document.getElementById('plan-discipline').value = plan.disciplineRules || '';
  document.getElementById('plan-goals').value = plan.learningGoals || '';
  document.getElementById('plan-mistakes').value = plan.mistakesToAvoid || '';
  document.getElementById('plan-checkpoints').value = plan.pointsToVerify || '';
  document.getElementById('journal-plan-note').textContent = plan.updatedAt ? `Enregistré ${relativeTime(plan.updatedAt)}` : 'Pas encore enregistré';
}

function collectJournalFields() {
  return {
    market: document.getElementById('journal-market').value,
    context: document.getElementById('journal-context').value,
    scenario: document.getElementById('journal-scenario').value,
    process: document.getElementById('journal-process').value,
    decision: document.getElementById('journal-decision').value,
    outcome: document.getElementById('journal-outcome').value,
    whatWorked: document.getElementById('journal-whatworked').value,
    toImprove: document.getElementById('journal-toimprove').value,
    note: document.getElementById('journal-note').value
  };
}

function goToJournalStep(step) {
  journalStep = step;
  document.querySelectorAll('.journal-step').forEach(el => el.classList.toggle('active', Number(el.dataset.step) === step));
  [1, 2, 3].forEach(n => document.getElementById(`journal-step-dot-${n}`).classList.toggle('active', n <= step));
  document.getElementById('journal-step-prev').hidden = step === 1;
  document.getElementById('journal-step-next').hidden = step === 3;
  document.getElementById('journal-step-save').hidden = step !== 3;
}

function openJournalComposer(entry, trigger, draft = null) {
  journalEditingId = entry ? entry.id : null;
  journalComposerTrigger = trigger || null;
  const fields = entry || draft || DDA.emptyJournalEntry();
  document.getElementById('journal-market').value = fields.market || '';
  document.getElementById('journal-context').value = fields.context || '';
  document.getElementById('journal-scenario').value = fields.scenario || '';
  document.getElementById('journal-process').value = fields.process || '';
  document.getElementById('journal-decision').value = fields.decision || '';
  document.getElementById('journal-outcome').value = fields.outcome || '';
  document.getElementById('journal-whatworked').value = fields.whatWorked || '';
  document.getElementById('journal-toimprove').value = fields.toImprove || '';
  document.getElementById('journal-note').value = fields.note || '';
  document.getElementById('journal-composer-eyebrow').textContent = entry ? 'Modifier l’entrée' : 'Nouvelle entrée';
  document.getElementById('journal-source-context').hidden = !fields.terminalSource;
  document.getElementById('journal-composer-delete').hidden = !entry;
  document.getElementById('journal-entry-error').textContent = '';
  goToJournalStep(1);
  document.getElementById('journal-entries-panel').hidden = true;
  document.getElementById('journal-composer').hidden = false;
  document.getElementById('journal-market').focus();
}

function closeJournalComposer() {
  document.getElementById('journal-composer').hidden = true;
  document.getElementById('journal-entries-panel').hidden = false;
  journalEditingId = null;
  const trigger = journalComposerTrigger;
  journalComposerTrigger = null;
  // The trigger can be a now-detached node if the list was just re-rendered
  // (e.g. right after saving an edit) — fall back to a button that always exists.
  if (trigger && document.body.contains(trigger)) trigger.focus();
  else document.getElementById('journal-new-entry').focus();
}

function switchJournalTab(tab) {
  document.getElementById('journal-tab-entries').classList.toggle('active', tab === 'entries');
  document.getElementById('journal-tab-entries').setAttribute('aria-selected', String(tab === 'entries'));
  document.getElementById('journal-tab-plan').classList.toggle('active', tab === 'plan');
  document.getElementById('journal-tab-plan').setAttribute('aria-selected', String(tab === 'plan'));
  document.getElementById('journal-composer').hidden = true;
  document.getElementById('journal-entries-panel').hidden = tab !== 'entries';
  document.getElementById('journal-plan-panel').hidden = tab !== 'plan';
}

// lessonDef/loopId let this drive any lesson's stepper — M0.1 and M0.2 each
// declare their own `steps` sequence; this function only ever asks "where does
// the id learning-engine.js just returned sit in that lesson's own sequence?"
function updateLessonLoop(lessonDef, lessonProgress, loopId) {
  const loop = document.getElementById(loopId);
  if (!loop) return;
  const step = DDALearning.lessonNextStep(lessonProgress);
  const order = lessonDef.steps.map(s => s.id);
  const currentIndex = order.indexOf(step);
  loop.querySelectorAll('li').forEach(item => {
    const itemIndex = order.indexOf(item.dataset.step);
    const isNow = itemIndex === currentIndex && step !== 'review';
    item.classList.toggle('done', itemIndex < currentIndex || step === 'review');
    item.classList.toggle('now', isNow);
    if (isNow) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
}

function updateLessonOutline(step, outlineListId) {
  document.querySelectorAll(`#${outlineListId} li`).forEach(item => {
    item.classList.toggle('active', item.dataset.outlineStep === step);
  });
}

// Real data only: XP already earned on this lesson, the competency it maps to,
// and the next actionable lesson from the engine — never a fabricated stat.
function renderResultStats(lesson, lessonProgress, statsId) {
  const stats = document.getElementById(statsId);
  if (!stats) return;
  const xp = DDALearning.lessonXp(lesson, lessonProgress);
  const next = DDALearning.nextActionable(DDA.curriculum, prototypeState);
  const nextLabel = next ? `${next.lesson.title} — ${NEXT_STEP_PHRASE[next.step] || 'continuer'}` : 'Prochain module bientôt disponible.';
  stats.innerHTML = `
    <div><dt>Compétence</dt><dd>${lesson.competency.label} — niveau confirmé</dd></div>
    <div><dt>XP obtenu sur cette leçon</dt><dd>+${xp} XP</dd></div>
    <div><dt>Prochaine étape</dt><dd>${nextLabel}</dd></div>`;
}

// One reusable "lesson view" driver: stepper, outline highlighting, the
// exercise→quiz gate, and the result reveal. Called once per lesson (M0.1's
// call uses the exact ids it has always used; M0.2's uses its 'm2' ids) so
// two independently-gated lessons can share this without any hardcoding of
// "the" active lesson.
function renderLessonProgressUI(lessonId, lessonDef, ids) {
  const lessonProgress = DDALearning.getLessonProgress(prototypeState, lessonId);
  const step = DDALearning.lessonNextStep(lessonProgress);
  const complete = Boolean(lessonProgress.quizComplete);
  updateLessonLoop(lessonDef, lessonProgress, ids.loopId);
  updateLessonOutline(step, ids.outlineListId);
  const evalUnlocked = DDALearning.evaluationStatus(lessonProgress) !== DDALearning.STEP_STATUS.LOCKED;
  const gate = document.getElementById(ids.gateId);
  if (gate) {
    gate.classList.toggle('locked-check', !evalUnlocked);
    gate.setAttribute('aria-disabled', String(!evalUnlocked));
    gate.querySelectorAll(`[data-question="${ids.evalName}"] button`).forEach(button => { button.disabled = !evalUnlocked; });
  }
  const resultCard = document.getElementById(ids.resultId);
  const markButton = document.getElementById(ids.markUnderstoodId);
  if (resultCard) resultCard.hidden = !complete;
  if (markButton) markButton.hidden = complete;
  if (complete) {
    const saved = document.getElementById(ids.savedStateId);
    if (saved) saved.textContent = 'Exercice et quiz validés localement — aucune donnée envoyée';
    renderResultStats(lessonDef, lessonProgress, ids.resultStatsId);
  }
  return { lessonProgress, step, complete };
}

// CEO correction (Daily Value Loop V1.1): this used to fall back to the fixed
// activeLessonId (M0.1) once nextActionable() found nothing left, so the
// Terminal kept presenting an already-completed lesson as if it were still
// today's destination. nextActionable() (learning-engine.js, unchanged) is
// already the single correct source for "is there a real next step" — it
// returns null exactly when every authored lesson is validated, and every
// other consumer in this file (renderResultStats, renderProgressNextStep,
// renderMembershipNextStep) already treats that null honestly. This function
// now does too: it is a thin, honest wrapper, nothing more.
function resolveContinueTarget() {
  return DDALearning.nextActionable(DDA.curriculum, prototypeState);
}

// The last real, authored lesson — used only once resolveContinueTarget()
// returns null (curriculum complete) to offer an explicitly-labelled review
// link and to show a mastered competency on the thread/skillmap. Reuses
// authoredLessons() (already the single source for "every real lesson, in
// order") — never a fixed M0.1/M0.2 id, so this adapts automatically once
// M1+ gain real content.
function lastAuthoredLesson() {
  const flat = authoredLessons();
  return flat.length ? flat[flat.length - 1] : null;
}

// The sidebar's "Leçon en cours" shortcut, corrected: it used to be pinned to
// the fixed view id "lesson" (always M0.1), so once a learner moved on to
// M0.2/M0.3 it silently sent them back to a lesson they had already
// completed. It now targets whatever resolveContinueTarget() honestly
// reports as current, via the same LESSON_VIEW_ID map the Terminal's own
// primary action uses — one source of truth, no second nav engine. Once the
// curriculum is complete it relabels itself as a review link to the last
// real lesson rather than pointing at a dead "current lesson" concept.
function renderNavCurrentLesson(continueTarget) {
  const item = document.getElementById('nav-current-lesson');
  if (!item) return;
  const label = item.querySelector('svg') ? item.lastChild : null;
  if (continueTarget) {
    item.dataset.view = LESSON_VIEW_ID[continueTarget.lesson.id] || 'lesson';
    if (label) label.textContent = ' Leçon en cours';
  } else {
    const last = lastAuthoredLesson();
    item.dataset.view = last ? (LESSON_VIEW_ID[last.lesson.id] || 'lesson') : 'lesson';
    if (label) label.textContent = ' Revoir la dernière leçon';
  }
}

// The real, greeting-time-of-day text — never a fixed "Bonsoir" regardless of the hour.
function greetingPrefix() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

// Shared bead-chain renderer — the DDA "fil de maîtrise" signature (Design Gate #3).
// level: 0 (nothing yet) up to `count` (fully mastered) — the same 0/2/3/4 scale
// competencyLevel() already returns, just expressed as filled/current/empty beads
// instead of a generic bar, so it never implies false precision between levels.
function renderBeads(level, count = 4) {
  return Array.from({ length: count }, (_, i) => {
    const idx = i + 1;
    if (level >= count) return '<i class="on"></i>';
    if (idx < level) return '<i class="on"></i>';
    if (idx === Math.max(level, 1) && level < count) return '<i class="now"></i>';
    return '<i></i>';
  }).join('');
}

// Real, level-accurate description for screen-reader users — the visual bead fill
// must never carry information the accessible name doesn't also state.
function beadsAriaLabel(level, count = 4) {
  if (level >= count) return `Compétence validée — ${count} étapes sur ${count}`;
  if (level <= 0) return `Compétence non démarrée — 0 étape sur ${count}`;
  return `Compétence en cours — étape ${level} sur ${count}`;
}

// The next lesson actually authored right after this one in the curriculum — never a
// guessed or invented competency. Returns null once nothing real follows (M1–M9 are
// still empty), which is the honest state the thread must show as "no next" then.
function lessonAfter(curriculum, lessonId) {
  const flat = [];
  curriculum.modules.forEach(m => m.lessons.forEach(l => flat.push({ module: m, lesson: l })));
  const index = flat.findIndex(x => x.lesson.id === lessonId);
  return index >= 0 && index + 1 < flat.length ? flat[index + 1] : null;
}

function renderTerminalThread(continueTarget) {
  const labelEl = document.getElementById('terminal-thread-label');
  if (!labelEl) return;
  const nextEl = document.getElementById('terminal-thread-next');
  const beadsEl = document.getElementById('terminal-thread-beads');
  if (!continueTarget) {
    // Curriculum complete: show the last real competency at its true, fully
    // mastered level (4/4) — never blank/stale, and never a "next"
    // competency, since nothing authored actually follows it yet.
    const last = lastAuthoredLesson();
    if (!last) return;
    labelEl.textContent = last.lesson.competency.label;
    beadsEl.innerHTML = renderBeads(4);
    beadsEl.setAttribute('aria-label', beadsAriaLabel(4));
    nextEl.hidden = true;
    return;
  }
  const lessonProgress = DDALearning.getLessonProgress(prototypeState, continueTarget.lesson.id);
  const level = competencyLevel(continueTarget.lesson.id, lessonProgress);
  labelEl.textContent = continueTarget.lesson.competency.label;
  beadsEl.innerHTML = renderBeads(level);
  beadsEl.setAttribute('aria-label', beadsAriaLabel(level));
  const after = lessonAfter(DDA.curriculum, continueTarget.lesson.id);
  const showNext = Boolean(after && after.lesson.competency.label !== continueTarget.lesson.competency.label);
  nextEl.hidden = !showNext;
  if (showNext) nextEl.innerHTML = `Prochaine compétence : <b>${after.lesson.competency.label}</b>`;
}

function renderTerminalMeta(continueTarget) {
  const stepEl = document.getElementById('terminal-meta-step');
  if (!stepEl || !continueTarget) return;
  // Real next step still pending: show the step/module/xp meta strip and
  // un-hide it (it is explicitly hidden by renderTerminalLeadComplete() once
  // the curriculum is complete, so coming back to a real step must restore it).
  const metaEl = document.getElementById('terminal-lead-meta');
  if (metaEl) metaEl.hidden = false;
  const lessonProgress = DDALearning.getLessonProgress(prototypeState, continueTarget.lesson.id);
  const step = DDALearning.lessonNextStep(lessonProgress);
  stepEl.textContent = step === 'review' ? 'leçon terminée' : (NEXT_STEP_PHRASE[step] || '—');
  document.getElementById('terminal-meta-module').textContent = continueTarget.lesson.id;
  const xpKey = step === 'lesson' ? 'lessonViewed' : step === 'exercise' ? 'exerciseComplete' : step === 'quiz' ? 'quizComplete' : null;
  const nextXp = xpKey && continueTarget.lesson.xp ? continueTarget.lesson.xp[xpKey] : null;
  document.getElementById('terminal-meta-xp').textContent = nextXp ? `+${nextXp} XP` : '—';

  // Daily Value Loop V1 — same `step` value drives the rationale line. Note:
  // nextActionable() (learning-engine.js) only ever returns a lesson whose
  // status isn't COMPLETED, and lessonNextStep() only returns 'review' once
  // quizComplete is true (i.e. status IS COMPLETED) — so step is never
  // 'review' here. The real "nothing left to do today" state is continueTarget
  // === null, handled by renderTerminalLeadComplete(), including its one
  // primary action (Journal/Market Intelligence) and review-only secondary link.
  const whyText = document.getElementById('terminal-lead-why-text');
  if (whyText) whyText.textContent = WHY_PHRASE[step] || '';
  const secondary = document.getElementById('terminal-lead-secondary');
  if (secondary) secondary.hidden = true;
}

// CEO correction (Daily Value Loop V1.1): once resolveContinueTarget() honestly
// returns null (every authored lesson validated), there is no lesson-based
// "next step" left to head the Terminal with — but the mandate still requires
// exactly one primary action and an honest rationale. This reuses the exact
// Journal-empty/Market-Intelligence branching already validated in V1 (it was
// previously the conditional secondary action for step === 'review'; here it
// is promoted to the one primary action, since there is nothing real to pair
// it with). The completed lesson itself is demoted to a labelled review-only
// link — never presented as the next pedagogical step.
// M0 Build Tranche debt fix (mandate §11): this used to read the fixed string
// "CURRICULUM M0 COMPLÉTÉ" — accurate only while M0 was the sole authored
// module, and false the moment a second module (M1+) also gets authored and
// completed. It now reads which modules are ACTUALLY complete from
// DDALearning.moduleStatus() (the same engine call moduleSnapshot/Parcours
// already use — no second notion of "complete"), so the label stays correct
// on its own once M1+ exist, with no future edit required here.
function completedModuleIds() {
  return DDA.curriculum.modules
    .filter(module => DDALearning.moduleStatus(DDA.curriculum, module.id, prototypeState) === DDALearning.MODULE_STATUS.COMPLETED)
    .map(module => module.id);
}

function renderTerminalLeadComplete() {
  const last = lastAuthoredLesson();
  const pillEl = document.getElementById('lesson-state-pill');
  if (pillEl) pillEl.textContent = 'Complété';
  const indexEl = document.getElementById('lesson-index-label');
  if (indexEl) {
    const completedIds = completedModuleIds();
    indexEl.textContent = completedIds.length
      ? `CURRICULUM ${completedIds.join(' + ')} COMPLÉTÉ${completedIds.length > 1 ? 'S' : ''}`
      : 'CURRICULUM DISPONIBLE COMPLÉTÉ';
  }
  const moduleEl = document.getElementById('terminal-lead-module');
  if (moduleEl) moduleEl.textContent = last ? last.module.title : 'DDA';
  const titleEl = document.getElementById('terminal-lead-title');
  if (titleEl) titleEl.textContent = 'Toutes les leçons disponibles sont validées.';
  const summaryEl = document.getElementById('terminal-lead-summary');
  if (summaryEl) summaryEl.textContent = 'Ton prochain module sera bientôt disponible — en attendant, continue avec ce qui est réellement à ta disposition aujourd’hui.';

  const journalEmpty = (prototypeState.journal?.entries || []).length === 0;
  const whyText = document.getElementById('terminal-lead-why-text');
  if (whyText) {
    whyText.textContent = journalEmpty
      ? 'Proposé parce que tu as validé tout le curriculum disponible — ton Journal & Plan est encore vide, c’est la prochaine chose réelle à faire.'
      : 'Proposé parce que tu as validé tout le curriculum disponible — Market Intelligence est une destination réelle pour continuer à observer les marchés.';
  }
  const primary = document.getElementById('lesson-primary-action');
  if (primary) {
    primary.dataset.view = journalEmpty ? 'journal' : 'markets';
    primary.innerHTML = journalEmpty ? 'Ouvrir ton Journal <span>→</span>' : 'Explorer Market Intelligence <span>→</span>';
  }
  const secondary = document.getElementById('terminal-lead-secondary');
  if (secondary) {
    if (last) {
      secondary.hidden = false;
      secondary.dataset.view = LESSON_VIEW_ID[last.lesson.id] || 'lesson';
      secondary.innerHTML = `Revoir ${last.lesson.id} <span>→</span>`;
    } else {
      secondary.hidden = true;
    }
  }
  const metaEl = document.getElementById('terminal-lead-meta');
  if (metaEl) metaEl.hidden = true;
}

// Reuses the same honest, structurally-labelled demo data as the full Markets screen —
// no new API, no new figures, same "Non connecté" badge and decorative sparkline path.
function renderTerminalMarketIntelligence() {
  const row = document.getElementById('terminal-mi-row');
  if (!row) return;
  row.innerHTML = MARKET_DEMO.indices.map((item, i) => `
    <div class="terminal-mi-idx">
      <div class="top"><b>${item.label}</b><span class="badge"><svg class="icon"><use href="#icon-blocked"/></svg>Mode pédagogique</span></div>
      ${candlestickSpark(i)}
    </div>`).join('');
}

// Darius Analysis Terminal P0.4 — local, deterministic teaching data only.
// The series is deliberately normalized and labelled as pedagogical: it is not
// a quote feed, not an investment signal, and not a substitute for market data.
const TERMINAL_SERIES = Object.freeze({
  'BRVM Composite': [48, 50, 49, 52, 55, 54, 57, 56, 58, 61, 60, 63, 62, 65, 64, 67, 66, 64, 68, 70, 69, 72, 71, 74, 73, 76, 75, 77, 76, 79, 78, 80],
  'BRVM 30': [54, 53, 55, 54, 57, 59, 58, 56, 57, 60, 62, 61, 63, 62, 65, 64, 66, 68, 67, 69, 68, 71, 70, 72, 71, 73, 72, 74, 73, 76, 75, 77],
  'EUR/USD pédagogique': [72, 71, 70, 72, 73, 72, 74, 75, 74, 73, 75, 77, 76, 78, 77, 76, 78, 79, 78, 80, 79, 81, 80, 79, 81, 82, 81, 83, 82, 84, 83, 85]
});
const terminalInteraction = { tool: 'crosshair', draft: null, crosshair: null, ready: false };
function getTerminalState() { return { instrument: prototypeState.terminal?.instrument || 'BRVM Composite', timeframe: prototypeState.terminal?.timeframe || '1D', zoom: Number(prototypeState.terminal?.zoom) || 1, pan: Number(prototypeState.terminal?.pan) || 0, drawings: Array.isArray(prototypeState.terminal?.drawings) ? prototypeState.terminal.drawings : [], observation: prototypeState.terminal?.observation || '', practice: prototypeState.terminal?.practice || null }; }
function terminalClamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function terminalDataset(instrument) { const source = TERMINAL_SERIES[instrument] || TERMINAL_SERIES['BRVM Composite']; return source.map((close, index) => { const open = index ? source[index - 1] : close - 1; return { open, close, high: Math.max(open, close) + 1 + (index % 3) * .35, low: Math.min(open, close) - 1 - (index % 2) * .3, index }; }); }
function terminalSvgPoint(event) { const svg = document.getElementById('terminal-chart'); const rect = svg.getBoundingClientRect(); return { x: terminalClamp((event.clientX - rect.left) / rect.width * 900, 0, 900), y: terminalClamp((event.clientY - rect.top) / rect.height * 420, 0, 420) }; }
function renderTerminalCrosshair() { const group = document.getElementById('terminal-crosshair'); if (!group) return; const point = terminalInteraction.crosshair; group.hidden = !point; if (!point) return; group.querySelector('.crosshair-v').setAttribute('x1', point.x); group.querySelector('.crosshair-v').setAttribute('x2', point.x); group.querySelector('.crosshair-h').setAttribute('y1', point.y); group.querySelector('.crosshair-h').setAttribute('y2', point.y); group.querySelector('.crosshair-x-label').setAttribute('x', terminalClamp(point.x - 22, 4, 852)); group.querySelector('.crosshair-x-label').textContent = `x ${Math.round(point.x)}`; }
function renderDariusAnalysisTerminal() {
  const svg = document.getElementById('terminal-chart'); if (!svg) return;
  const state = getTerminalState(); const data = terminalDataset(state.instrument); const visibleCount = Math.max(12, Math.round(data.length / state.zoom)); const maxPan = Math.max(0, data.length - visibleCount); const start = terminalClamp(state.pan, 0, maxPan); const visible = data.slice(start, start + visibleCount); const min = Math.min(...visible.map(c => c.low)) - 1; const max = Math.max(...visible.map(c => c.high)) + 1; const x = i => 34 + i * (832 / Math.max(1, visible.length - 1)); const y = value => 24 + (max - value) / (max - min) * 332; const candleWidth = Math.max(5, 680 / visible.length);
  const grid = [0, 1, 2, 3, 4].map(i => `<line class="grid" x1="24" x2="876" y1="${24 + i * 83}" y2="${24 + i * 83}"/>`).join('');
  const candles = visible.map((candle, i) => { const cx = x(i); const top = y(Math.max(candle.open, candle.close)); const bottom = y(Math.min(candle.open, candle.close)); return `<line class="wick" x1="${cx}" x2="${cx}" y1="${y(candle.high)}" y2="${y(candle.low)}"/><rect class="${candle.close >= candle.open ? 'candle-up' : 'candle-down'}" x="${cx - candleWidth / 2}" y="${top}" width="${candleWidth}" height="${Math.max(3, bottom - top)}" rx="1"/>`; }).join('');
  const labels = visible.filter((_, i) => i % Math.max(1, Math.floor(visible.length / 5)) === 0).map((candle, i) => `<text x="${x(i * Math.max(1, Math.floor(visible.length / 5)))}" y="388">${candle.index + 1}</text>`).join('');
  const drawings = state.drawings.map(drawing => { if (drawing.type === 'zone') return `<rect class="sr-zone" x="${Math.min(drawing.x1, drawing.x2)}" y="${Math.min(drawing.y1, drawing.y2)}" width="${Math.abs(drawing.x2 - drawing.x1)}" height="${Math.abs(drawing.y2 - drawing.y1)}"/>`; if (drawing.type === 'fib') return [0, .382, .5, .618, 1].map(level => { const yy = drawing.y1 + (drawing.y2 - drawing.y1) * level; return `<line class="fib-line" x1="${Math.min(drawing.x1, drawing.x2)}" x2="${Math.max(drawing.x1, drawing.x2)}" y1="${yy}" y2="${yy}"/><text class="fib-label" x="${Math.max(drawing.x1, drawing.x2) - 34}" y="${yy - 3}">${Math.round(level * 100)}%</text>`; }).join(''); return `<line class="draw-line" x1="${drawing.x1}" y1="${drawing.y1}" x2="${drawing.x2}" y2="${drawing.y2}"/>`; }).join('');
  svg.innerHTML = `${grid}${drawings}${candles}${labels}<g id="terminal-crosshair" hidden><line class="crosshair crosshair-v" x1="0" x2="0" y1="18" y2="368"/><line class="crosshair crosshair-h" x1="24" x2="876" y1="0" y2="0"/><rect class="crosshair-label" x="4" y="372" width="44" height="18" rx="3"/><text class="crosshair-x-label" x="10" y="385">x 0</text></g>`;
  document.getElementById('terminal-instrument').value = state.instrument; document.getElementById('terminal-timeframe').value = state.timeframe; document.getElementById('terminal-zoom').value = String(state.zoom); const observation = document.getElementById('terminal-observation'); if (document.activeElement !== observation) observation.value = state.observation; document.getElementById('terminal-observation-state').textContent = state.observation ? 'Observation conservée localement' : 'Non enregistré'; document.getElementById('terminal-chart-caption').textContent = `${state.instrument} · ${state.timeframe} · série historique locale contrôlée · valeurs normalisées · aucune cotation en temps réel.`; renderTerminalCrosshair();
  const practice = state.practice || {}; document.getElementById('terminal-practice-proof').textContent = practice.status === 'validated' ? 'Preuve conservée localement' : practice.attempts ? 'À reprendre' : 'À commencer'; document.getElementById('terminal-practice-feedback').textContent = practice.feedback || 'Aucune vérification effectuée.'; document.getElementById('terminal-practice-validate').textContent = practice.status === 'validated' ? 'Rejouer la mission' : 'Vérifier ma lecture';
}
function terminalJournalDraft() {
  const state = getTerminalState();
  const drawingLabels = state.drawings.map(drawing => ({ zone: 'zone Support/Résistance', line: 'ligne', fib: 'Fibonacci' }[drawing.type] || 'annotation')).join(', ');
  return {
    market: state.instrument,
    context: `Observation du Darius Analysis Terminal — timeframe ${state.timeframe}. Série pédagogique locale contrôlée, sans cotation en temps réel.`,
    scenario: state.observation,
    process: `Graphique manipulé en ${state.timeframe}, zoom ${state.zoom}/3${drawingLabels ? `; annotations : ${drawingLabels}` : ''}.`,
    note: drawingLabels ? `Annotations conservées dans le Terminal : ${drawingLabels}.` : 'Brouillon transféré depuis le Terminal — complète ton raisonnement avant d’enregistrer.',
    terminalSource: true
  };
}
function initDariusAnalysisTerminal() {
  const svg = document.getElementById('terminal-chart'); if (!svg || terminalInteraction.ready) return; terminalInteraction.ready = true; const update = patch => saveState({ terminal: { ...getTerminalState(), ...patch } });
  document.getElementById('terminal-instrument').addEventListener('change', event => update({ instrument: event.target.value, pan: 0 })); document.getElementById('terminal-timeframe').addEventListener('change', event => update({ timeframe: event.target.value })); document.getElementById('terminal-zoom').addEventListener('input', event => update({ zoom: Number(event.target.value), pan: 0 })); document.getElementById('terminal-pan-left').addEventListener('click', () => update({ pan: Math.max(0, getTerminalState().pan - 3) })); document.getElementById('terminal-pan-right').addEventListener('click', () => { const state = getTerminalState(); const data = terminalDataset(state.instrument); update({ pan: Math.min(data.length - Math.max(12, Math.round(data.length / state.zoom)), state.pan + 3) }); });
  document.querySelectorAll('[data-terminal-tool]').forEach(button => button.addEventListener('click', () => { terminalInteraction.tool = button.dataset.terminalTool; document.querySelectorAll('[data-terminal-tool]').forEach(item => item.classList.toggle('active', item === button)); document.getElementById('terminal-tool-hint').textContent = terminalInteraction.tool === 'crosshair' ? 'Déplace le pointeur sur le graphique.' : 'Clique deux fois sur le graphique pour placer cette annotation.'; terminalInteraction.draft = null; }));
  svg.addEventListener('pointermove', event => { terminalInteraction.crosshair = terminalSvgPoint(event); renderTerminalCrosshair(); }); svg.addEventListener('pointerleave', () => { terminalInteraction.crosshair = null; renderTerminalCrosshair(); }); svg.addEventListener('pointerdown', event => { if (terminalInteraction.tool === 'crosshair') return; const point = terminalSvgPoint(event); if (!terminalInteraction.draft) { terminalInteraction.draft = point; document.getElementById('terminal-tool-hint').textContent = 'Encore un clic pour terminer l’annotation.'; return; } const drawing = { type: terminalInteraction.tool, x1: terminalInteraction.draft.x, y1: terminalInteraction.draft.y, x2: point.x, y2: point.y }; update({ drawings: [...getTerminalState().drawings, drawing] }); terminalInteraction.draft = null; document.getElementById('terminal-tool-hint').textContent = 'Annotation conservée localement. Tu peux en ajouter une autre.'; });
  document.getElementById('terminal-save-observation').addEventListener('click', () => { const observation = document.getElementById('terminal-observation').value.trim(); if (!observation) { document.getElementById('terminal-observation-state').textContent = 'Écris une observation avant de l’enregistrer.'; return; } update({ observation }); showToast('Observation conservée sur cet appareil.'); });
  document.getElementById('terminal-practice-validate').addEventListener('click', () => { const state = getTerminalState(); const zones = state.drawings.filter(drawing => drawing.type === 'zone'); const zone = zones[zones.length - 1]; const height = zone ? Math.abs(zone.y2 - zone.y1) : 0; const center = zone ? (zone.y1 + zone.y2) / 2 : 0; const valid = Boolean(zone && height >= 45 && height <= 130 && center >= 100 && center <= 320); const attempts = Number(state.practice?.attempts || 0) + 1; const practice = valid ? { status: 'validated', attempts, feedback: 'Bonne lecture : tu as matérialisé une zone, sans la réduire à un prix exact. Preuve conservée localement.', completedAt: new Date().toISOString() } : { status: 'retry', attempts, feedback: zone ? 'Relis la consigne : élargis ou déplace ta zone vers la partie centrale du graphique, puis réessaie.' : 'Choisis Zone S/R et place deux points pour créer une zone avant de vérifier.' }; update({ practice }); if (valid) showToast('Preuve de pratique conservée sur cet appareil.'); });
}

// The learner's own most recent Journal entry, or an honest empty state — never an
// invented example quote.
function renderTerminalJournalNote() {
  const el = document.getElementById('terminal-journal-note');
  if (!el) return;
  const entries = prototypeState.journal?.entries || [];
  if (!entries.length) {
    el.innerHTML = '<p style="font-style:normal">Aucune entrée pour l’instant — ta prochaine observation apparaîtra ici.</p>';
    return;
  }
  const entry = entries[0];
  const snippet = entry.decision || entry.scenario || entry.context || entry.note || '';
  const trimmed = snippet.length > 140 ? `${snippet.slice(0, 140)}…` : snippet;
  el.innerHTML = `<p>« ${trimmed || 'Entrée enregistrée sans détail.'} »<small>${entry.market || 'Sans marché précisé'} — ${formatJournalDate(entry.createdAt)}</small></p>`;
}

// Only the active lesson's own competency is real; the other two rows mirror the
// exact "À découvrir" honesty already used on the Progression screen's mastery
// list — never a fabricated level for a competency nothing in the curriculum
// measures yet. Terminal shows only the one lesson currently pointing forward
// (a quick glance); Progression is the deep view showing every authored lesson —
// same underlying competencyLevel(), never a contradictory second logic.
function renderTerminalSkillmap(continueTarget) {
  const el = document.getElementById('terminal-skillmap');
  if (!el) return;
  let label, level;
  if (continueTarget) {
    const lessonProgress = DDALearning.getLessonProgress(prototypeState, continueTarget.lesson.id);
    label = continueTarget.lesson.competency.label;
    level = competencyLevel(continueTarget.lesson.id, lessonProgress);
  } else {
    // Curriculum complete: the one real row shows the last authored
    // competency, fully mastered — never blank, never a fabricated "next".
    const last = lastAuthoredLesson();
    if (!last) return;
    label = last.lesson.competency.label;
    level = 4;
  }
  const rows = [
    { label, real: true },
    { label: 'Gestion du risque', real: false },
    { label: 'Discipline', real: false }
  ];
  el.innerHTML = rows.map(row => `
    <div class="terminal-skillmap-row">
      <span>${row.label}</span>
      ${row.real
        ? `<div class="terminal-thread-beads" role="img" aria-label="${beadsAriaLabel(level)}">${renderBeads(level)}</div>`
        : '<small>À découvrir</small>'}
    </div>`).join('');
}

// The one real next action available on this surface right now — reuses the
// same nextActionable() call Terminal/Progression already use when the learner
// is still on Free, so it never invents a second notion of "what's next".
// Once Premium is simulated, points at the one real gated feature (the
// Ressources Premium atelier / certificate preview) rather than a vague promise.
function renderMembershipNextStep(premium) {
  const el = document.getElementById('membership-next-step');
  if (!el) return;
  if (premium) {
    el.textContent = 'Ton accès Premium est en aperçu sur cet appareil — ouvre l’atelier Ressources Premium ou l’aperçu de certification pour voir ce qu’il débloque réellement dès aujourd’hui.';
    return;
  }
  const next = DDALearning.nextActionable(DDA.curriculum, prototypeState);
  el.textContent = next
    ? `Continuer ${next.lesson.title} (${next.lesson.id}) sur DDA Free — Premium reste disponible en aperçu quand tu voudras l’explorer.`
    : 'Tu as validé les leçons disponibles sur DDA Free — ouvre l’aperçu Premium ci-dessus pour voir ce qu’il débloque dès aujourd’hui.';
}

function renderState() {
  const name = prototypeState.user?.name || 'Richard';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'RD';
  const activeLessonProgress = DDALearning.getLessonProgress(prototypeState, activeLessonId);
  const xp = DDALearning.totalXp(DDA.curriculum, prototypeState) || 20;
  // Deliberately out of scope for the Daily Value Loop correction: `complete`
  // only tracks M0.1's own quizComplete and drives the certificate preview
  // below — Parcours itself follows resolveContinueTarget(), never a pinned
  // module (the old isRenderableModule() helper is gone: it hardcoded M0.1).
  const complete = Boolean(activeLessonProgress.quizComplete);
  const continueTarget = resolveContinueTarget();
  // CEO correction (Daily Value Loop V1.1): continueTarget is now honestly null
  // once every authored lesson is validated — there is no "current" lesson left
  // to track progress against, so the ring reports the true 100%, not a stale
  // reading of whatever activeLessonId happens to be.
  const curriculumComplete = !continueTarget;
  const progress = curriculumComplete
    ? 100
    : DDALearning.lessonProgressPercent(DDALearning.getLessonProgress(prototypeState, continueTarget.lesson.id));

  document.getElementById('dashboard-name').textContent = name;
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-avatar').textContent = initials;
  document.getElementById('greeting-prefix').textContent = greetingPrefix();
  document.getElementById('module-percent').textContent = `${progress}%`;
  document.getElementById('module-ring').style.setProperty('--progress', progress);
  document.getElementById('week-xp').textContent = `+${xp} XP`;
  const activeDays = countActiveDays(prototypeState.events);
  document.getElementById('active-days').textContent = `${activeDays} jour${activeDays > 1 ? 's' : ''}`;
  const marketVisitDays = countActiveDaysForView(prototypeState.events, 'markets');
  const marketVisitEl = document.getElementById('market-visit-days');
  if (marketVisitEl) {
    marketVisitEl.textContent = String(marketVisitDays);
    document.getElementById('market-visit-days-suffix').textContent = marketVisitDays > 1 ? 'jours' : 'jour';
  }
  // Reuses the exact honest phrasing renderProgressNextStep() already shows for
  // this same curriculumComplete state — never a second, contradictory message.
  // Daily Value Loop V1.1 fix: this used to hardcode activeLessonId (always
  // M0.1), so Home kept telling a learner who had validated M0.1 to "terminer
  // M0.1" forever, while Terminal/Parcours/Progression had already moved on to
  // M0.2/M0.3 via continueTarget — a direct cross-surface contradiction. Now
  // follows the same continueTarget every other surface already uses.
  document.getElementById('personalized-next').textContent = curriculumComplete
    ? 'Toutes les leçons disponibles sont validées. Ton prochain module sera bientôt disponible.'
    : prototypeState.onboarding?.goal
      ? `Objectif : ${prototypeState.onboarding.goal}. Prochaine étape : terminer ${continueTarget.lesson.id}.`
      : 'Une étape claire pour continuer à progresser.';

  if (continueTarget) {
    // nextActionable() only ever returns a lesson whose status isn't COMPLETED,
    // so this is always the "still in progress" case — the completed case is
    // handled entirely by renderTerminalLeadComplete() below.
    document.getElementById('lesson-state-pill').textContent = 'En cours';
    const lessonIndex = continueTarget.module.lessons.findIndex(l => l.id === continueTarget.lesson.id) + 1;
    document.getElementById('lesson-index-label').textContent = `LEÇON ${lessonIndex} SUR ${continueTarget.module.lessons.length}`;
    document.getElementById('lesson-primary-action').innerHTML = 'Reprendre la leçon <span>→</span>';
    document.getElementById('lesson-primary-action').dataset.view = LESSON_VIEW_ID[continueTarget.lesson.id] || 'lesson';
    document.getElementById('terminal-lead-module').textContent = continueTarget.module.title;
    document.getElementById('terminal-lead-title').textContent = continueTarget.lesson.title;
    document.getElementById('terminal-lead-summary').textContent = continueTarget.lesson.summary;
  } else {
    renderTerminalLeadComplete();
  }
  renderTerminalThread(continueTarget);
  renderTerminalMeta(continueTarget);
  renderDariusAnalysisTerminal();
  renderTerminalMarketIntelligence();
  renderTerminalJournalNote();
  renderTerminalSkillmap(continueTarget);

  renderMasteryList();
  renderPracticeProof();
  renderProgressNextStep();
  renderProgressHero();
  renderCertificatePreview(activeLessonProgress);
  renderJournalList();
  renderJournalPlan();

  renderNavCurrentLesson(continueTarget);

  // Restore every mounted lesson's progress UI from stored state — one
  // registry-driven loop covers all of them, ids derived by lessonUiIds.
  mountedLessons.forEach(entry => renderLessonProgressUI(entry.id, entry.meta.lesson, lessonUiIds(entry)));

  document.getElementById('resume-device').hidden = !prototypeState.user;
  document.body.classList.toggle('low-data', Boolean(prototypeState.preferences.lowData));

  const premium = prototypeState.membership?.plan === 'premium';
  const hasProfile = Boolean(prototypeState.user);
  document.getElementById('profile-form').hidden = !hasProfile;
  document.querySelector('.preference-panel').hidden = !hasProfile;
  document.getElementById('empty-profile').hidden = hasProfile;
  if (hasProfile) {
    document.getElementById('profile-large-avatar').textContent = initials;
    document.getElementById('profile-heading-name').textContent = name;
    document.getElementById('profile-heading-email').textContent = prototypeState.user.email || 'Compte local';
    document.getElementById('profile-plan-badge').textContent = premium ? 'DDA Premium · Aperçu' : 'DDA Free';
    document.getElementById('profile-first-name').value = name;
    document.getElementById('profile-level').value = prototypeState.onboarding?.level || 'Débutant';
    document.getElementById('profile-goal').value = prototypeState.onboarding?.goal || 'Comprendre les marchés';
    document.getElementById('profile-time').value = prototypeState.onboarding?.time || '10 minutes par jour';
  }
  document.getElementById('profile-low-data').checked = Boolean(prototypeState.preferences.lowData);
  document.getElementById('profile-reminders').checked = Boolean(prototypeState.preferences.reminders);
  const count = prototypeState.events?.length || 0;
  document.getElementById('event-count').textContent = `${count} événement${count > 1 ? 's' : ''}`;

  document.getElementById('sidebar-plan').textContent = premium ? 'DDA Premium · Aperçu' : 'DDA Free';
  document.getElementById('membership-status').textContent = premium ? 'DDA Premium' : 'DDA Free';
  document.getElementById('free-plan-state').textContent = premium ? 'Inclus avec Premium' : 'Formule active';
  document.getElementById('preview-premium').hidden = premium;
  document.getElementById('revert-free').hidden = !premium;
  document.querySelector('.current-plan').classList.toggle('is-included', premium);
  document.querySelector('.premium-plan').classList.toggle('is-active', premium);
  document.querySelectorAll('.premium-gate').forEach(button => {
    button.textContent = premium ? 'Ouvrir l’atelier' : 'Voir l’aperçu Premium';
  });
  renderMembershipNextStep(premium);

  renderPathJourney();
  renderModulesRecap();

  document.getElementById('storage-warning').hidden = DDA.storageAvailable();
}

// Navigation Integrity V1 — real "previous screen" tracking, so a lesson's
// or Journal's "← Retour" returns to wherever the learner actually came from
// (Parcours, Terminal, Progression, Market Intelligence…) instead of a
// hardcoded destination. Updated on every real showView() call, including
// direct window.showView() calls from tests/deep-link boot — one source of
// truth, not a second routing system.
//
// V1.1 correction (real bug, found by reproducing an actual reload — not
// showView() called in isolation): previousView lived ONLY in memory. A
// learner opening a lesson from Progression/Parcours and then reloading the
// page (or the tab was restored, or the link opened in a context that
// re-executes this script) lost that memory entirely — the next boot always
// re-seeded previousView from the hardcoded 'dashboard' default, so "←
// Retour" silently fell back to Aujourd'hui instead of the real origin.
// Persisted to sessionStorage (this tab's session only, never localStorage —
// this is navigation-in-progress memory, not durable learner state) and
// restored at boot, with currentView pre-seeded to the deep-linked view so
// the boot's own showView() call doesn't immediately clobber the restored
// value with its normal (correct, for a real transition) "record previous"
// logic below.
const PREV_VIEW_STORAGE_KEY = 'dda-nav-previous-view';
function readStoredPreviousView() {
  try { return sessionStorage.getItem(PREV_VIEW_STORAGE_KEY); } catch (error) { return null; }
}
function storePreviousView(view) {
  try {
    if (view) sessionStorage.setItem(PREV_VIEW_STORAGE_KEY, view);
    else sessionStorage.removeItem(PREV_VIEW_STORAGE_KEY);
  } catch (error) { /* private/blocked storage — back-link still falls back to dashboard */ }
}
let currentView = 'dashboard';
let previousView = readStoredPreviousView();
const LESSON_VIEW_IDS = new Set(Object.values(LESSON_VIEW_ID));
// Le verrou séquentiel est la chaîne déclarée par le registre (`prerequisite`
// de chaque leçon), jamais une carte parallèle écrite à la main.
const LESSON_PREREQUISITE = Object.freeze(Object.fromEntries(LESSON_REGISTRY.filter(entry => entry.prerequisite).map(entry => [entry.viewId, entry.prerequisite])));

function smartBackTarget() {
  if (previousView && titles[previousView] && !LESSON_VIEW_IDS.has(previousView) && previousView !== 'access') return previousView;
  return 'dashboard';
}

let gateTrigger = null;
let pendingGatedView = null;

function openGate(options = {}) {
  const gate = document.getElementById('gate-layer');
  if (!gate) return;
  const eyebrowEl = document.getElementById('gate-eyebrow');
  const titleEl = document.getElementById('gate-title');
  const descEl = document.getElementById('gate-description');
  const unlockBtn = document.getElementById('gate-unlock');
  const previewBtn = document.getElementById('gate-preview');

  if (eyebrowEl) eyebrowEl.textContent = options.eyebrow || 'DDA Premium';
  if (titleEl) titleEl.textContent = options.title || 'Cette expérience sera disponible avec Premium.';
  if (descEl) descEl.textContent = options.description || 'Aucun achat ni paiement réel n’est proposé ici.';
  if (unlockBtn) {
    unlockBtn.hidden = !options.canUnlock;
    if (options.unlockText) unlockBtn.innerHTML = `${options.unlockText} <span>→</span>`;
  }
  if (previewBtn) {
    previewBtn.textContent = options.previewText || (options.canUnlock ? 'Voir la formule Premium' : 'Voir la formule Premium →');
    previewBtn.className = options.canUnlock ? 'secondary-action' : 'primary-action';
  }
  pendingGatedView = options.targetView || null;
  gate.hidden = false;
  document.getElementById('gate-close')?.focus();
}

function closeGate() {
  const gate = document.getElementById('gate-layer');
  if (!gate || gate.hidden) return;
  gate.hidden = true;
  pendingGatedView = null;
  if (gateTrigger) { gateTrigger.focus(); gateTrigger = null; }
}

function showView(id, recordEvent = true) {
  if (id === 'back') id = smartBackTarget();
  const prerequisiteLessonId = LESSON_PREREQUISITE[id];
  if (prerequisiteLessonId && !DDALearning.getLessonProgress(prototypeState, prerequisiteLessonId).quizComplete) {
    showToast('Cette leçon se débloque après la validation de l’étape précédente.');
    id = 'path';
  }
  const permission = viewPermissions[id];
  if (permission && !DDA.can(prototypeState, permission)) {
    prototypeState = DDA.track(prototypeState, 'access_denied', { view: id, permission, plan: prototypeState.membership?.plan || 'visitor' });
    if (!prototypeState.user) {
      showToast('Termine ton inscription pour accéder à cette section.');
      id = 'access';
    } else {
      const fallbackView = currentView && currentView !== id && titles[currentView] ? currentView : 'path';
      showView(fallbackView, false);
      openGate({
        eyebrow: 'Offre Standard · M1+',
        title: 'Ce module est réservé à l’offre Standard.',
        description: 'DDA Free (Découverte) donne accès au module M0 Fondations. Les modules M1 et suivants sont réservés aux offres Standard et Pro (CDCP-OS §4.2). Aucun paiement réel — active l’aperçu pour explorer ce module.',
        canUnlock: true,
        unlockText: 'Activer l’aperçu Standard (simulation)',
        previewText: 'Voir la formule Premium',
        targetView: id
      });
      return;
    }
  }
  views.forEach(view => view.classList.toggle('active', view.id === id));
  [...desktopItems, ...mobileItems].forEach(item => item.classList.toggle('active', item.dataset.view === id));
  document.body.classList.toggle('lesson-focus', LESSON_VIEW_IDS.has(id));
  // Acquisition V1 — #landing is a public marketing surface, not an app screen:
  // it must never show the authenticated chrome (sidebar/plan/profile, topbar,
  // mobile nav, prototype banner). Scoped purely via this body class, same
  // pattern as lesson-focus above — no new routing concept.
  document.body.classList.toggle('public-shell', id === 'landing');
  contextTitle.textContent = titles[id] || 'DDA';
  history.replaceState(null, '', `#${id}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id !== currentView) {
    previousView = currentView;
    storePreviousView(previousView);
    currentView = id;
  }
  if (recordEvent) trackEvent('view_opened', { view: id });
  if (id === 'landing') {
    trackEvent('landing_visit', {
      source: prototypeState.acquisition?.source,
      medium: prototypeState.acquisition?.medium,
      campaign: prototypeState.acquisition?.campaign
    });
  }
  // Funnel measurability (mandate §18): #access is the real start of both the
  // signup step (name/email) and the qualification step (level/goal/time) —
  // no real distinction exists yet between the two screens, so both fire here.
  if (id === 'access' && !prototypeState.user) {
    trackEvent('signup_started', {});
    trackEvent('qualification_started', {});
  }
}

buttons.forEach(button => button.addEventListener('click', () => {
  // Acquisition V1 landing funnel: any button explicitly opting in via
  // data-analytics is recorded under its own real event name before the
  // normal navigation happens — never a substitute for view_opened, which
  // still fires for every navigation regardless of this attribute.
  if (button.dataset.analytics) trackEvent(button.dataset.analytics, { view: button.dataset.view });
  showView(button.dataset.view);
  if (button.dataset.terminalHandoff === 'true') openJournalComposer(null, button, terminalJournalDraft());
}));

const resources = {
  checklist: { title: 'Checklist avant une décision', label: 'Guide · DDA Free', body: '<ol><li>Ai-je compris le contexte du marché ?</li><li>Mon scénario est-il écrit clairement ?</li><li>Où mon idée devient-elle invalide ?</li><li>Quel risque suis-je prêt à accepter ?</li><li>Est-ce une décision prévue ou impulsive ?</li><li>Puis-je justifier mon choix sans parler de gain ?</li></ol>' },
  glossary: { title: 'Les mots essentiels du marché', label: 'Glossaire · DDA Free', body: '<dl><dt>Actif</dt><dd>Ce qui est échangé sur un marché.</dd><dt>Acheteur</dt><dd>Participant qui cherche à acquérir un actif.</dd><dt>Vendeur</dt><dd>Participant qui accepte de céder un actif.</dd><dt>Risque</dt><dd>Part d’incertitude et de perte potentielle à maîtriser avant d’agir.</dd></dl>' }
};

let readerTrigger = null;
document.querySelectorAll('.resource-open').forEach(button => button.addEventListener('click', () => {
  const resource = resources[button.dataset.resource];
  document.getElementById('reader-label').textContent = resource.label;
  document.getElementById('reader-title').textContent = resource.title;
  document.getElementById('reader-content').innerHTML = resource.body;
  readerTrigger = button;
  document.getElementById('resource-reader').hidden = false;
  document.getElementById('resource-reader').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('reader-close').focus();
}));
function closeReader() {
  const reader = document.getElementById('resource-reader');
  if (reader.hidden) return;
  reader.hidden = true;
  if (readerTrigger) { readerTrigger.focus(); readerTrigger = null; }
}
document.getElementById('reader-close').addEventListener('click', closeReader);

document.querySelectorAll('.premium-gate').forEach(button => button.addEventListener('click', () => {
  if (DDA.can(prototypeState, button.dataset.permission)) { showToast('Atelier Premium débloqué en aperçu.'); return; }
  gateTrigger = button;
  prototypeState = DDA.track(prototypeState, 'access_denied', { permission: button.dataset.permission, plan: 'free' });
  openGate({
    eyebrow: 'DDA Premium',
    title: 'Cette expérience sera disponible avec Premium.',
    description: 'Aucun achat ni paiement réel n’est proposé ici.',
    canUnlock: true,
    unlockText: 'Simuler l’accès Premium sur cet appareil',
    previewText: 'Voir la formule Premium'
  });
}));
document.getElementById('gate-unlock')?.addEventListener('click', () => {
  const target = pendingGatedView;
  prototypeState = DDA.setPlan(prototypeState, 'premium');
  prototypeState = DDA.track(prototypeState, 'plan_preview', { plan: 'premium' });
  renderState();
  closeGate();
  showToast('Accès Standard débloqué en aperçu.');
  if (target) showView(target);
});
document.getElementById('gate-close')?.addEventListener('click', closeGate);
document.getElementById('gate-layer')?.addEventListener('click', event => { if (event.target.id === 'gate-layer') closeGate(); });
document.getElementById('gate-preview')?.addEventListener('click', () => { closeGate(); showView('membership'); });

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!document.getElementById('gate-layer').hidden) closeGate();
  else if (!document.getElementById('resource-reader').hidden) closeReader();
  else if (!document.getElementById('journal-composer').hidden) closeJournalComposer();
});
document.getElementById('preview-premium').addEventListener('click', () => {
  prototypeState = DDA.setPlan(prototypeState, 'premium');
  prototypeState = DDA.track(prototypeState, 'plan_preview', { plan: 'premium' });
  renderState();
  showToast('Accès Premium simulé sur cet appareil.');
});
document.getElementById('revert-free').addEventListener('click', () => {
  prototypeState = DDA.setPlan(prototypeState, 'free');
  prototypeState = DDA.track(prototypeState, 'plan_preview', { plan: 'free' });
  renderState();
  showToast('Retour à DDA Free.');
});

function filterBrokers() {
  const marketSelect = document.getElementById('broker-market');
  const useSelect = document.getElementById('broker-use');
  const market = marketSelect.value;
  const use = useSelect.value;
  marketSelect.classList.toggle('is-filtered', market !== 'all');
  useSelect.classList.toggle('is-filtered', use !== 'all');
  let visible = 0;
  document.querySelectorAll('.broker-row').forEach(card => {
    const matchMarket = market === 'all' || card.dataset.market.split(' ').includes(market);
    const matchUse = use === 'all' || card.dataset.use.split(' ').includes(use);
    card.hidden = !(matchMarket && matchUse);
    if (!card.hidden) visible += 1;
  });
  document.getElementById('broker-empty').hidden = visible > 0;
}
document.getElementById('broker-market').addEventListener('change', filterBrokers);
document.getElementById('broker-use').addEventListener('change', filterBrokers);
document.querySelectorAll('.broker-detail').forEach(button => button.addEventListener('click', () => {
  const broker = button.closest('.broker-row')?.dataset.broker;
  // Measures interest in a broker profile only. No real link exists yet and
  // affiliate_link_click is never fired here — a separate CEO validation is
  // required before any real broker link/click is wired (see EVENT_NAMES).
  if (broker) trackEvent('broker_selected', { broker });
  showToast('Fiche complète différée jusqu’à vérification réglementaire.');
}));

document.getElementById('journal-tab-entries').addEventListener('click', () => switchJournalTab('entries'));
document.getElementById('journal-tab-plan').addEventListener('click', () => switchJournalTab('plan'));
document.getElementById('journal-new-entry').addEventListener('click', event => openJournalComposer(null, event.currentTarget));
document.getElementById('journal-composer-back').addEventListener('click', closeJournalComposer);
document.getElementById('journal-step-prev').addEventListener('click', () => goToJournalStep(journalStep - 1));
document.getElementById('journal-step-next').addEventListener('click', () => goToJournalStep(journalStep + 1));
document.getElementById('journal-composer-delete').addEventListener('click', () => {
  if (!journalEditingId) return;
  deleteJournalEntry(journalEditingId);
  trackEvent('journal_entry_deleted', {});
  closeJournalComposer();
  showToast('Entrée supprimée.');
});
document.getElementById('journal-entry-form').addEventListener('submit', event => {
  event.preventDefault();
  const fields = collectJournalFields();
  const hasContent = Object.values(fields).some(value => value.trim());
  if (!hasContent) {
    document.getElementById('journal-entry-error').textContent = 'Renseigne au moins un champ avant d’enregistrer.';
    goToJournalStep(1);
    return;
  }
  document.getElementById('journal-entry-error').textContent = '';
  const editingId = journalEditingId;
  if (editingId) {
    updateJournalEntry(editingId, fields);
    trackEvent('journal_entry_updated', {});
  } else {
    addJournalEntry(fields);
    trackEvent('journal_entry_created', {});
  }
  closeJournalComposer();
  showToast(editingId ? 'Entrée mise à jour.' : 'Entrée enregistrée localement.');
});
document.getElementById('journal-list').addEventListener('click', event => {
  const editButton = event.target.closest('.journal-entry-edit');
  const deleteButton = event.target.closest('.journal-entry-delete');
  if (editButton) {
    const entry = (prototypeState.journal?.entries || []).find(item => item.id === editButton.dataset.id);
    if (entry) openJournalComposer(entry, editButton);
  } else if (deleteButton) {
    deleteJournalEntry(deleteButton.dataset.id);
    trackEvent('journal_entry_deleted', {});
    showToast('Entrée supprimée.');
  }
});
document.getElementById('journal-plan-form').addEventListener('submit', event => {
  event.preventDefault();
  saveJournalPlan({
    marketsStudied: document.getElementById('plan-markets').value,
    studySlots: document.getElementById('plan-slots').value,
    checklist: document.getElementById('plan-checklist').value,
    disciplineRules: document.getElementById('plan-discipline').value,
    learningGoals: document.getElementById('plan-goals').value,
    mistakesToAvoid: document.getElementById('plan-mistakes').value,
    pointsToVerify: document.getElementById('plan-checkpoints').value
  });
  trackEvent('journal_plan_saved', {});
  showToast('Plan personnel enregistré.');
});

document.getElementById('support-form').addEventListener('submit', event => {
  event.preventDefault();
  const message = document.getElementById('support-message').value.trim();
  if (!message) return;
  document.getElementById('support-note').textContent = 'Demande préparée localement. Le canal support sera connecté avant le lancement.';
  showToast('Brouillon de demande préparé — aucun envoi réel.');
});

function bindNotifyButton(viewId, buttonId, prefKey, label) {
  document.getElementById(buttonId)?.addEventListener('click', () => {
    saveState({ preferences: { ...prototypeState.preferences, [prefKey]: true } });
    trackEvent('preference_updated', { preference: prefKey, enabled: 'true' });
    const note = document.getElementById(`${viewId}-notify-note`);
    if (note) note.textContent = 'Préférence enregistrée sur cet appareil — aucune inscription réelle envoyée.';
    showToast(`Tu seras averti localement quand ${label} sera activé.`);
  });
}
bindNotifyButton('community', 'community-notify', 'communityNotify', 'la Communauté');
bindNotifyButton('practice', 'practice-notify', 'practiceNotify', 'la Pratique avancée');
bindNotifyButton('intelligence', 'intelligence-notify', 'intelligenceNotify', 'l’Intelligence DDA');

document.getElementById('play-demo').addEventListener('click', event => {
  const caption = document.getElementById('video-caption');
  event.currentTarget.textContent = event.currentTarget.textContent === '▶' ? 'Ⅱ' : '▶';
  caption.textContent = event.currentTarget.textContent === 'Ⅱ' ? 'Illustration — vidéo à venir' : 'Une décision commence par l’observation.';
});

function bindMarkUnderstood(lessonId, ids) {
  const button = document.getElementById(ids.buttonId);
  if (!button) return;
  button.addEventListener('click', () => {
    const state = document.getElementById(ids.savedStateId);
    if (state) {
      state.textContent = 'Compréhension marquée localement — aucune donnée envoyée';
      state.style.borderColor = '#58b88a';
      state.style.color = '#58b88a';
    }
    const scrollTarget = document.getElementById(ids.scrollToId);
    if (scrollTarget) scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateLessonState(lessonId, { lessonViewed: true });
    trackEvent('lesson_understood', { lesson: lessonId });
  });
}

// « J'ai compris » de chaque leçon montée — ids et ancre de scroll dérivés
// du registre (lessonUiIds + understoodScrollTo), plus de bloc par leçon.
mountedLessons.forEach(entry => {
  const ui = lessonUiIds(entry);
  bindMarkUnderstood(entry.id, { buttonId: ui.markUnderstoodId, savedStateId: ui.savedStateId, scrollToId: entry.understoodScrollTo });
});

document.getElementById('signup-form').addEventListener('submit', event => {
  event.preventDefault();
  const nameField = document.getElementById('first-name');
  const emailField = document.getElementById('email');
  const consentField = document.getElementById('consent');
  const name = nameField.value.trim();
  const email = emailField.value.trim();
  const consent = consentField.checked;
  const error = document.getElementById('signup-error');
  const invalidFields = [!name && nameField, !email && emailField, !consent && consentField].filter(Boolean);
  [nameField, emailField, consentField].forEach(field => field.setAttribute('aria-invalid', String(invalidFields.includes(field))));
  if (invalidFields.length) { error.textContent = 'Complète les champs et confirme le stockage local.'; invalidFields[0].focus(); return; }
  error.textContent = '';
  saveState({ user: DDA.createUser(name, email) });
  trackEvent('signup_completed', {});
  event.currentTarget.hidden = true;
  document.getElementById('onboarding-form').hidden = false;
  document.getElementById('step-dot-2').classList.add('active');
});

document.getElementById('onboarding-form').addEventListener('submit', async event => {
  event.preventDefault();
  const levelField = document.getElementById('level');
  const goalField = document.getElementById('goal');
  const timeField = document.getElementById('time');
  const level = levelField.value;
  const goal = goalField.value;
  const time = timeField.value;
  const invalidFields = [!level && levelField, !goal && goalField, !time && timeField].filter(Boolean);
  [levelField, goalField, timeField].forEach(field => field.setAttribute('aria-invalid', String(invalidFields.includes(field))));
  if (invalidFields.length) { document.getElementById('onboarding-error').textContent = 'Choisis les trois éléments du parcours.'; invalidFields[0].focus(); return; }
  document.getElementById('onboarding-error').textContent = '';
  saveState({ onboarding: { level, goal, time, complete: true } });
  updateLessonState(activeLessonId, { lessonViewed: true });
  trackEvent('onboarding_complete', { level, goal });
  trackEvent('qualification_completed', { level, goal });
  setLoading(true);
  if (!prototypeState.preferences.lowData) await new Promise(resolve => setTimeout(resolve, 450));
  setLoading(false);
  showView('lesson');
});

// Generalized to bind ANY [data-question] interaction — M0.1's original
// exercise/quiz, and Golden Lesson #2's zone_identify/decision_choice blocks
// reusing the exact same data-correct/data-feedback contract. `question.role`
// ('exercise'|'quiz'|anything else) controls only the completion side-effects
// below; a block with no gating role (a practice reasoning check) just shows
// per-choice feedback. `options` lets a second lesson target its own gate,
// result card and saved-state elements — omitted, defaults reproduce M0.1's
// exact original behavior.
function bindQuestion(lessonId, question, options) {
  const { role, name, successText } = question;
  const opts = options || {};
  const group = document.querySelector(`[data-question="${name}"]`);
  if (!group) return;
  const feedback = document.getElementById(`${name}-feedback`);
  group.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    if (group.closest('.locked-check')?.getAttribute('aria-disabled') === 'true') return;
    group.querySelectorAll('button').forEach(item => item.classList.remove('correct', 'incorrect'));
    const correct = button.dataset.correct === 'true';
    if (role === 'exercise' || role === 'quiz') trackEvent(role === 'exercise' ? 'exercise_attempt' : 'quiz_attempt', { correct: String(correct), lesson: lessonId });
    button.classList.add(correct ? 'correct' : 'incorrect');
    if (feedback) {
      // A choice's own feedback (correct or not) wins when authored; otherwise
      // fall back to the block's successText / a generic retry prompt.
      feedback.textContent = button.dataset.feedback || (correct ? successText : 'Pas encore. Relis le principe, puis essaie à nouveau.');
      feedback.className = `feedback ${correct ? 'success' : 'error'}`;
    }
    if (opts.revealId) {
      const reveal = document.getElementById(opts.revealId);
      if (reveal) reveal.hidden = false;
    }
    group.closest('section')?.classList.add('answered');
    if (correct && role === 'exercise') {
      updateLessonState(lessonId, { exerciseComplete: true });
      trackEvent('exercise_complete', { lesson: lessonId });
      const gate = document.getElementById(opts.gateId || 'quiz-block');
      if (gate) {
        gate.classList.remove('locked-check');
        gate.setAttribute('aria-disabled', 'false');
        gate.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    if (correct && role === 'quiz') {
      const wasActivated = DDA.isActivated_v1(prototypeState);
      updateLessonState(lessonId, { quizComplete: true });
      trackEvent('quiz_complete', { lesson: lessonId });
      // activation_v1 = M0.1 completed successfully (CEO-fixed definition).
      // Fires exactly once per device, the moment that becomes true — M0.2/
      // M0.3 quiz completions reuse this same code path but never retrigger it.
      if (!wasActivated && DDA.isActivated_v1(prototypeState)) trackEvent('activation_v1', { lesson: lessonId });
      const resultCard = document.getElementById(opts.resultId || 'result-card');
      if (resultCard) {
        resultCard.hidden = false;
        resultCard.classList.add('just-completed');
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => resultCard.classList.remove('just-completed'), 900);
      }
      const saved = document.getElementById(opts.savedStateId || 'saved-state');
      if (saved) saved.textContent = 'Exercice et quiz validés localement — aucune donnée envoyée';
    }
  }));
}

// Les liaisons [data-question] de chaque leçon montée découlent de son entrée
// de registre : le rôle ('practice'|'exercise'|'quiz') pilote les effets de
// complétion de bindQuestion — un `practice` ne fait jamais semblant d'être
// un verrou, l'`exercise` est le seul à déverrouiller le quiz (`gate`), le
// `quiz` le seul à ouvrir la carte résultat (`result`). Les textes de succès
// pointent la source honnête : '@block' → successText du bloc authored,
// '@practice' → lesson.practice.successText, '@data' → quiz data.successText,
// sinon le texte littéral choisi pour cette question.
function bindRegistryQuestions(entry) {
  const lesson = entry.meta.lesson;
  const ui = lessonUiIds(entry);
  entry.questions.forEach(descriptor => {
    const block = findLessonBlock(lesson, descriptor.block);
    if (!block) return;
    let successText = descriptor.success;
    if (successText === '@block') successText = block.successText;
    else if (successText === '@practice') successText = lesson.practice?.successText;
    else if (successText === '@data') successText = block.data?.successText;
    const options = {};
    if (descriptor.gate) options.gateId = ui.gateId;
    if (descriptor.result) { options.resultId = ui.resultId; options.savedStateId = ui.savedStateId; }
    if (descriptor.reveal) options.revealId = `${descriptor.block}-reveal`;
    const name = descriptor.role === 'quiz' ? (block.data?.id || block.id) : block.id;
    bindQuestion(entry.id, { role: descriptor.role, name, successText }, options);
  });
}
mountedLessons.forEach(bindRegistryQuestions);

function updateNetworkState() {
  const online = navigator.onLine;
  const status = document.getElementById('network-state');
  status.classList.toggle('offline', !online);
  status.querySelector('span').textContent = online ? 'En ligne' : 'Mode hors connexion';
}

document.getElementById('resume-session').addEventListener('click', () => {
  showView(prototypeState.onboarding?.complete ? 'lesson' : 'access');
});

function resetPilot() {
  prototypeState = DDA.clear();
  document.getElementById('signup-form').reset();
  document.getElementById('signup-form').hidden = false;
  document.getElementById('onboarding-form').hidden = true;
  mountedLessons.forEach(entry => {
    const card = document.getElementById(lessonUiIds(entry).resultId);
    if (card) card.hidden = true;
  });
  renderState();
  showView('access', false);
  showToast('Tes données ont été effacées.');
}

document.getElementById('reset-session').addEventListener('click', resetPilot);
document.getElementById('profile-reset').addEventListener('click', resetPilot);

document.getElementById('profile-form').addEventListener('submit', event => {
  event.preventDefault();
  const nameField = document.getElementById('profile-first-name');
  const name = nameField.value.trim();
  if (!name) {
    nameField.setAttribute('aria-invalid', 'true');
    document.getElementById('profile-error').textContent = 'Indique ton prénom.';
    nameField.focus();
    return;
  }
  nameField.setAttribute('aria-invalid', 'false');
  const level = document.getElementById('profile-level').value;
  const goal = document.getElementById('profile-goal').value;
  const time = document.getElementById('profile-time').value;
  saveState({
    user: { ...prototypeState.user, name },
    onboarding: { level, goal, time, complete: true }
  });
  trackEvent('profile_updated', { level, goal });
  document.getElementById('profile-error').textContent = '';
  showToast('Profil mis à jour.');
});

document.getElementById('profile-low-data').addEventListener('change', event => {
  saveState({ preferences: { ...prototypeState.preferences, lowData: event.currentTarget.checked } });
  trackEvent('preference_updated', { preference: 'lowData', enabled: String(event.currentTarget.checked) });
});

document.getElementById('profile-reminders').addEventListener('change', event => {
  saveState({ preferences: { ...prototypeState.preferences, reminders: event.currentTarget.checked } });
  trackEvent('preference_updated', { preference: 'reminders', enabled: String(event.currentTarget.checked) });
  showToast(event.currentTarget.checked ? 'Préférence de rappel enregistrée.' : 'Rappels désactivés.');
});

window.addEventListener('online', updateNetworkState);
window.addEventListener('offline', updateNetworkState);
updateNetworkState();
initDariusAnalysisTerminal();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

renderState();
renderMarketIntelligence();

// A first-time visitor (no local profile yet, no deep-link hash) must land on
// the real entry point — Access/onboarding — never on the Terminal's static
// default-active markup, which would otherwise show a placeholder "Richard"
// dashboard as if already signed in before anyone has actually onboarded.
const initialView = location.hash.replace('#', '');
if (titles[initialView]) {
  // Pre-seed currentView to the view we're actually booting into so showView()'s
  // own "record previous" logic below doesn't treat this restore as a real
  // transition and clobber the previousView just restored from sessionStorage
  // above (see V1.1 correction) with the hardcoded 'dashboard' default.
  currentView = initialView;
  showView(initialView);
} else if (!prototypeState.user) showView('landing');


/* DDA Visual Identity V2 — progressive reveals for premium editorial rhythm.
   Purely presentational: no learning state, navigation, or analytics semantics. */
(function initDDAVisualRhythm() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const selector = [
    '.landing-main-copy',
    '.landing-aperture',
    '.landing-method article',
    '.landing-institution > div',
    '.landing-demo-grid article',
    '.landing-problem-list li',
    '.landing-steps-list li',
    '.landing-plan-card',
    '.landing-guardrails > *',
    '.landing-final-cta > *',
    '.terminal-entry',
    '.terminal-lead',
    '.terminal-mi',
    '.terminal-two > section',
    '.terminal-family',
    '.terminal-aperture',
    '.terminal-tools',
    '.section-intro',
    '.journey-current',
    '.journey-node',
    '.panel',
    '.lesson-main > *',
    '.library-entry',
    '.resource-feature',
    '.plan-card',
    '.broker-row',
    '.journal-entry-card'
  ].join(',');

  function prepare(root = document) {
    // querySelectorAll only matches descendants — when called with a single
    // newly-added element as root, it must be considered too, not just its children.
    const nodes = root !== document && root.matches?.(selector) ? [root, ...root.querySelectorAll(selector)] : root.querySelectorAll(selector);
    nodes.forEach((node, index) => {
      if (node.dataset.revealReady === 'true') return;
      node.dataset.revealReady = 'true';
      node.setAttribute('data-reveal', '');
      node.setAttribute('data-reveal-delay', String(index % 4));
      observer?.observe(node);
    });
  }

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const observer = !reduced && 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' })
    : null;

  if (!observer) {
    document.documentElement.classList.add('no-reveal-motion');
    document.querySelectorAll(selector).forEach(node => node.classList.add('revealed'));
  } else {
    prepare();
    // Scoped to each mutation's own added nodes, never the whole document:
    // renderState() replaces dozens of subtrees via innerHTML per learner
    // action (each one itself a childList mutation), so a full-document
    // re-scan on every mutation re-queries and re-observes the same targets
    // over and over across a session, growing unboundedly instead of doing
    // fixed, bounded work per render.
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) prepare(node);
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }
})();
