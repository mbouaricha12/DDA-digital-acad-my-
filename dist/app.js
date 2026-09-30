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
  },
  {
    id: 'P2.1', viewId: 'lesson-p21', suffix: 'p21', title: 'Risk Before Entry',
    permission: 'premium_track', quizBlock: 'p21-quiz', understoodScrollTo: 'p21-decision-block',
    questions: [
      { role: 'exercise', block: 'p21-decision', success: '@practice' },
      { role: 'quiz', block: 'p21-quiz', success: '@data', result: true }
    ]
  },
  {
    id: 'P2.2', viewId: 'lesson-p22', suffix: 'p22', title: 'The Anatomy of a Controlled Trade', prerequisite: 'P2.1',
    permission: 'premium_track', quizBlock: 'p22-quiz', understoodScrollTo: 'p22-sequence-block',
    questions: [
      { role: 'exercise', block: 'p22-sequence', success: '@practice' },
      { role: 'quiz', block: 'p22-quiz', success: '@data', result: true }
    ]
  }
]);

// L’état est chargé avant le montage afin que les leçons Premium authored ne
// soient jamais injectées dans le DOM d’un utilisateur Free.
let prototypeState = DDA.load();
let remoteUser = null;
let bffAuthMode = 'signup';

// Résolution runtime du registre contre le curriculum réel : une leçon
// déclarée mais absente du curriculum (fichier authored non chargé) n'est pas
// montée — les boucles ci-dessous ne consomment que mountedLessons.
const mountedLessons = LESSON_REGISTRY
  .map(entry => ({ ...entry, meta: DDALearning.findLesson(DDA.curriculum, entry.id) }))
  .filter(entry => entry.meta);

const activeLessonId = DDA.primaryLessonId;
const activeLessonMeta = DDALearning.findLesson(DDA.curriculum, activeLessonId);
const activeLessonDef = activeLessonMeta.lesson;

// The lesson reader is data-driven: render each lesson's markup into its mount
// points only when its local entitlement allows it. Premium lessons are
// mounted later when the local demo is activated, before their interactions
// are bound. Une seule boucle pour toutes les leçons — plus de bloc copié.
function mountLesson(entry) {
  const main = document.getElementById(`${entry.viewId}-main`);
  const outline = document.getElementById(`${entry.viewId}-outline`);
  if (!main || !outline || main.dataset.ddaLessonMounted === 'true') return;
  const suffix = entry.suffix || undefined;
  main.insertAdjacentHTML('beforeend', DDALessonRenderer.renderLessonMain(entry.meta.module, entry.meta.lesson, suffix));
  outline.innerHTML = DDALessonRenderer.renderLessonOutline(entry.meta.lesson, suffix);
  if (entry.id === 'M0.2') main.insertAdjacentHTML('beforeend', '<section class="lesson-practice-handoff"><p class="eyebrow gold">Après la leçon</p><h3>Mettre la lecture en pratique</h3><p>Ouvre une mission guidée dans le Terminal pour repérer une zone sans chercher un prix exact.</p><button type="button" class="secondary-action" data-practice-launch="M0.2">Lancer la mission Practice <span>→</span></button></section>');
  if (entry.id === 'P2.2') main.insertAdjacentHTML('beforeend', '<section class="lesson-practice-handoff premium-handoff"><p class="eyebrow gold">Après les leçons</p><h3>Practice Lab — Build the Risk Plan</h3><p>Construis un plan dans un scénario pédagogique synthétique, puis fais vérifier ta décision.</p><button type="button" class="secondary-action" data-view="premium-lab">Ouvrir le Practice Lab <span>→</span></button></section>');
  main.dataset.ddaLessonMounted = 'true';
}
mountedLessons.forEach(entry => {
  if (entry.permission === 'premium_track' && !DDA.can(prototypeState, 'premium_track')) return;
  mountLesson(entry);
});
function findLessonBlock(lessonDef, id) { return lessonDef.blocks.find(b => b.id === id); }

function bindViewButton(button) {
  button.addEventListener('click', () => {
    // Acquisition V1 landing funnel: any button explicitly opting in via
    // data-analytics is recorded under its own real event name before the
    // normal navigation happens — never a substitute for view_opened, which
    // still fires for every navigation regardless of this attribute.
    if (button.dataset.analytics) trackEvent(button.dataset.analytics, {
      view: button.dataset.view,
      position: button.dataset.funnelPosition
    });
    if (button.dataset.terminalHandoff === 'true') {
      const observation = document.getElementById('terminal-observation');
      if (observation) saveState({ terminal: { ...getTerminalState(), observation: observation.value.trim() } });
    }
    showView(button.dataset.view);
    if (button.dataset.scrollTo) {
      requestAnimationFrame(() => document.getElementById(button.dataset.scrollTo)?.scrollIntoView({
        behavior: prototypeState.preferences?.lowData ? 'auto' : 'smooth',
        block: 'start'
      }));
    }
    if (button.dataset.terminalHandoff === 'true') openJournalComposer(null, button, terminalJournalDraft());
  });
}
const buttons = document.querySelectorAll('[data-view]');
buttons.forEach(bindViewButton);
document.querySelectorAll('[data-practice-launch]').forEach(button => button.addEventListener('click', () => { const lesson = button.dataset.practiceLaunch; saveState({ terminal: { ...getTerminalState(), practice: { ...(getTerminalState().practice || {}), sourceLesson: lesson, sourceLessonTitle: 'Support & Résistance' } } }); showView('dashboard'); setTimeout(() => document.getElementById('analysis-terminal')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); }));
const views = document.querySelectorAll('.view');
const desktopItems = document.querySelectorAll('.nav-item');
const mobileItems = document.querySelectorAll('.mobile-nav button');
const contextTitle = document.getElementById('context-title');

// Access onboarding selects — native controls remain in the form as the
// source of truth, while the visible interaction uses DDA's own Learning OS
// surface. This preserves validation, keyboard semantics and existing submit
// handlers without exposing a browser-specific radio/menu treatment.
function initDdaSelect(select) {
  if (!select || select.dataset.ddaReady) return;
  select.dataset.ddaReady = 'true';
  select.classList.add('dda-native-select');
  const id = `${select.id}-dda-menu`;
  const wrapper = document.createElement('div');
  wrapper.className = 'dda-select';
  wrapper.dataset.selectFor = select.id;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'dda-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-controls', id);
  trigger.setAttribute('aria-expanded', 'false');
  const label = document.createElement('span');
  const chevron = document.createElement('span');
  chevron.className = 'dda-select-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '⌄';
  trigger.append(label, chevron);
  const menu = document.createElement('div');
  menu.id = id;
  menu.className = 'dda-select-menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', select.previousElementSibling?.textContent || 'Choisir une option');
  [...select.options].forEach(option => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'dda-select-option';
    item.dataset.value = option.value;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    item.textContent = option.textContent;
    item.addEventListener('click', () => {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      closeDdaSelect(wrapper);
      trigger.focus();
    });
    menu.appendChild(item);
  });
  select.parentNode.insertBefore(wrapper, select);
  wrapper.append(select, trigger, menu);

  const sync = () => {
    const current = select.options[select.selectedIndex];
    label.textContent = current?.value ? current.textContent : 'Choisir';
    label.classList.toggle('has-value', Boolean(current?.value));
    menu.querySelectorAll('.dda-select-option').forEach(item => {
      const selected = item.dataset.value === select.value;
      item.setAttribute('aria-selected', String(selected));
      item.classList.toggle('is-selected', selected);
    });
    trigger.setAttribute('aria-invalid', select.getAttribute('aria-invalid') || 'false');
  };
  const open = () => {
    document.querySelectorAll('.dda-select.is-open').forEach(other => { if (other !== wrapper) closeDdaSelect(other); });
    wrapper.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  };
  const focusOptionWhenVisible = option => {
    if (!option) return;
    const focusAfterReveal = () => {
      if (!wrapper.classList.contains('is-open')) return;
      if (getComputedStyle(menu).visibility === 'visible' && Number(getComputedStyle(menu).opacity) >= 0.99) option.focus();
      else requestAnimationFrame(focusAfterReveal);
    };
    requestAnimationFrame(focusAfterReveal);
  };
  trigger.addEventListener('click', () => wrapper.classList.contains('is-open') ? closeDdaSelect(wrapper) : open());
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const options = [...menu.querySelectorAll('.dda-select-option')];
      const wasOpen = wrapper.classList.contains('is-open');
      if (!wasOpen) open();
      const selected = options.indexOf(menu.querySelector('.is-selected'));
      const focused = options.indexOf(document.activeElement);
      const target = options[Math.min(focused >= 0 ? focused + 1 : selected + 1, options.length - 1)];
      if (wasOpen) target?.focus(); else focusOptionWhenVisible(target);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (wrapper.classList.contains('is-open')) closeDdaSelect(wrapper);
      else {
        open();
        focusOptionWhenVisible(menu.querySelector('.is-selected') || menu.querySelector('.dda-select-option'));
      }
    }
  });
  menu.addEventListener('keydown', event => {
    const options = [...menu.querySelectorAll('.dda-select-option')];
    const index = options.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') { event.preventDefault(); options[(index + 1) % options.length]?.focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); options[(index - 1 + options.length) % options.length]?.focus(); }
    if (event.key === 'Escape') { event.preventDefault(); closeDdaSelect(wrapper); trigger.focus(); }
  });
  select.addEventListener('change', sync);
  new MutationObserver(sync).observe(select, { attributes: true, attributeFilter: ['aria-invalid'] });
  sync();
}
function closeDdaSelect(wrapper) {
  wrapper.classList.remove('is-open');
  const trigger = wrapper.querySelector('.dda-select-trigger');
  trigger?.setAttribute('aria-expanded', 'false');
}
['level', 'goal', 'time'].forEach(id => initDdaSelect(document.getElementById(id)));
document.addEventListener('click', event => {
  if (!event.target.closest('.dda-select')) document.querySelectorAll('.dda-select.is-open').forEach(closeDdaSelect);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelectorAll('.dda-select.is-open').forEach(closeDdaSelect);
});

const titles = {
  landing: 'Découvrir DDA', dashboard: 'Aujourd’hui', access: 'Créer mon compte', path: 'Mon parcours',
  progress: 'Progression', journal: 'Journal', resources: 'Ressources', markets: 'Marchés & BRVM', brokers: 'Broker Hub',
  membership: 'DDA Premium', 'premium-track': 'Premium Track · P2', 'premium-lab': 'Premium Lab · Risk Plan', 'premium-assessment': 'Premium Assessment · Controlled Decision', support: 'Aide & support', profile: 'Mon profil', community: 'Communauté',
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
  'premium-track': 'premium_track', 'premium-lab': 'premium_track', 'premium-assessment': 'premium_track',
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

const BOOT_HASH_VIEW = location.hash.replace('#', '');
const initialAttribution = window.DDA_INITIAL_ATTRIBUTION || {};
delete window.DDA_INITIAL_ATTRIBUTION;

// Acquisition V1 — first-touch capture, a no-op after the first call on this
// device (see DDA.captureAcquisition). Runs on every boot, before any view is
// shown, so a shared link's UTM parameters are captured however deep into the
// app it points (not only through #landing).
prototypeState = DDA.captureAcquisition(prototypeState, {
  source: initialAttribution.source,
  medium: initialAttribution.medium,
  campaign: initialAttribution.campaign,
  referrer: document.referrer,
  landingPath: location.hash
});
// Attribution is captured locally once; do not leave potentially identifying
// query parameters in the address bar, copied links, or subsequent history.
if (location.search) history.replaceState(history.state, '', location.pathname + location.hash);

function saveState(update) {
  prototypeState = DDA.save({ ...prototypeState, ...update });
  renderState();
}

// P3 BFF bridge — deliberately opt-in. With no deployment URL, the existing
// localStorage prototype remains the only source of truth and this is a no-op.
async function hydrateRemoteSession() {
  if (!window.DDABFF?.enabled()) return null;
  try {
    const user = await window.DDABFF.getMe();
    if (!user) return null;
    remoteUser = user;
    const localUser = prototypeState.user || {};
    prototypeState = DDA.save({
      ...prototypeState,
      user: {
        ...localUser,
        name: user.display_name || localUser.name || 'Apprenant',
        email: user.email || localUser.email || ''
      }
    });
    renderState();
    return user;
  } catch {
    // A temporary BFF outage must not destroy the learner's local prototype.
    return null;
  }
}

function setBffAuthMode(mode) {
  if (!window.DDABFF?.enabled()) return;
  bffAuthMode = mode === 'login' ? 'login' : 'signup';
  const login = bffAuthMode === 'login';
  const firstNameField = document.getElementById('first-name');
  const firstNameLabel = firstNameField?.closest('label');
  const passwordField = document.getElementById('access-password');
  const passwordLabel = document.getElementById('access-password-field');
  const consentField = document.getElementById('access-consent-field');
  const consent = document.getElementById('consent');
  const title = document.getElementById('access-form-title');
  const step = document.getElementById('access-step-label');
  const submit = document.querySelector('#signup-form button[type="submit"]');
  const forgot = document.getElementById('bff-forgot-password');
  if (firstNameLabel) firstNameLabel.hidden = login;
  if (firstNameField) firstNameField.required = !login;
  if (passwordLabel) passwordLabel.hidden = false;
  if (passwordField) { passwordField.required = true; passwordField.autocomplete = login ? 'current-password' : 'new-password'; }
  if (consentField) consentField.hidden = login;
  if (consent) consent.required = !login;
  if (title) title.textContent = login ? 'Se connecter' : 'Créer mon compte';
  if (step) step.textContent = login ? 'Accès sécurisé' : 'Créer un compte';
  if (submit) submit.innerHTML = login ? 'Ouvrir ma session <span>→</span>' : 'Recevoir le lien de vérification <span>→</span>';
  if (forgot) forgot.hidden = !login;
  document.getElementById('signup-error').textContent = '';
}

function showOnboardingAfterRemoteAuth(user) {
  if (!user) return;
  const name = user.display_name || prototypeState.user?.name || 'Apprenant';
  prototypeState = DDA.save({ ...prototypeState, user: DDA.createUser(name, user.email || '') });
  renderState();
  document.getElementById('signup-form').hidden = true;
  document.getElementById('bff-recovery-form').hidden = true;
  document.getElementById('bff-verify-panel').hidden = true;
  if (prototypeState.onboarding?.complete) {
    showView('lesson');
    return;
  }
  document.getElementById('onboarding-form').hidden = false;
  document.getElementById('step-dot-2').classList.add('active');
}

async function handleBffVerificationToken() {
  const token = window.DDA_VERIFY_TOKEN;
  delete window.DDA_VERIFY_TOKEN;
  if (!token || !window.DDABFF?.enabled()) return;
  const panel = document.getElementById('bff-verify-panel');
  const message = document.getElementById('bff-verify-message');
  const form = document.getElementById('signup-form');
  if (panel) panel.hidden = false;
  if (form) form.hidden = true;
  try {
    await window.DDABFF.verifyEmail(token);
    if (message) message.textContent = 'Adresse confirmée. Tu peux maintenant ouvrir ta session.';
  } catch {
    if (message) message.textContent = 'Ce lien est invalide, expiré ou déjà utilisé. Demande un nouveau lien depuis l’inscription.';
  }
}

function initBffAuthUi() {
  if (!window.DDABFF?.enabled()) return;
  document.getElementById('bff-auth-tools').hidden = false;
  setBffAuthMode('signup');
  document.getElementById('bff-mode-signup').addEventListener('click', () => {
    document.getElementById('bff-recovery-form').hidden = true;
    document.getElementById('bff-verify-panel').hidden = true;
    document.getElementById('signup-form').hidden = false;
    setBffAuthMode('signup');
  });
  document.getElementById('bff-mode-login').addEventListener('click', () => {
    document.getElementById('bff-recovery-form').hidden = true;
    document.getElementById('bff-verify-panel').hidden = true;
    document.getElementById('signup-form').hidden = false;
    setBffAuthMode('login');
  });
  document.getElementById('bff-verify-login').addEventListener('click', () => {
    document.getElementById('bff-verify-panel').hidden = true;
    document.getElementById('signup-form').hidden = false;
    setBffAuthMode('login');
  });
  document.getElementById('bff-forgot-password').addEventListener('click', () => {
    document.getElementById('signup-form').hidden = true;
    document.getElementById('bff-recovery-form').hidden = false;
    document.getElementById('recovery-email').value = document.getElementById('email').value;
  });
  document.getElementById('recovery-back').addEventListener('click', () => {
    document.getElementById('bff-recovery-form').hidden = true;
    document.getElementById('signup-form').hidden = false;
    setBffAuthMode('login');
  });
  document.getElementById('bff-recovery-form').addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('recovery-email').value.trim();
    const error = document.getElementById('recovery-error');
    if (!email) { error.textContent = 'Indique ton adresse e-mail.'; return; }
    error.textContent = '';
    try {
      await window.DDABFF.requestPasswordReset(email);
      error.textContent = 'Si un compte correspond, un message de récupération va être envoyé.';
    } catch {
      error.textContent = 'La demande ne peut pas être traitée pour le moment. Réessaie plus tard.';
    }
  });
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
  DDA.curriculum.modules.forEach(module => {
    if (module.premiumOnly && prototypeState.membership?.plan !== 'premium') return;
    module.lessons.forEach(lesson => flat.push({ module, lesson }));
  });
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
      <article class="mastery-row mastery-row-focused" data-mastery-level="${level}" data-proof-state="${level >= 4 ? 'confirmed' : level >= 3 ? 'practiced' : 'learning'}">
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
  const proof = practice.proof || {};
  const source = practice.sourceLessonTitle ? `Après la leçon ${practice.sourceLesson} · ${practice.sourceLessonTitle}` : 'Practice Terminal autonome';
  const proofType = proof.type === 'zone_identification' ? 'Identification de zone' : 'Mission Practice';
  container.innerHTML = `<div class="practice-proof-row ${validated ? 'is-validated' : 'is-retry'}"><span class="practice-proof-icon">${validated ? '✓' : '↻'}</span><div><strong>${proofType} — Practice Terminal</strong><p>${source}</p><p>${practice.feedback || 'Mission tentée localement.'}</p><small>Preuve ${proof.id || 'locale'} · ${validated ? 'conservée sur cet appareil.' : 'à reprendre — elle ne compte pas comme compétence acquise.'}</small></div></div>`;
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
let journalComposerMetadata = null;

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
    const sourceView = entry.sourceLesson === 'M0.2' ? 'lesson-m02' : '';
    const proofMeta = entry.terminalSource ? `<div class="journal-proof-meta"><strong>Preuve ${entry.proofId || 'locale'}</strong><span>${entry.sourceLesson || 'M0.2'} · ${entry.proofType || 'zone_identification'}</span>${sourceView ? `<button type="button" class="text-action journal-proof-source" data-view="${sourceView}">Revoir la leçon <span>→</span></button>` : ''}</div>` : '';
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
            ${proofMeta}
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

function weeklyReviewWindow() {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const entries = (prototypeState.journal?.entries || []).filter(entry => {
    const at = new Date(entry.createdAt).getTime();
    return Number.isFinite(at) && at >= start.getTime() && at <= end.getTime();
  });
  const markets = [...new Set(entries.map(entry => entry.market).filter(Boolean))];
  return { start, end, entries, markets };
}

function renderWeeklyReview() {
  const panel = document.getElementById('weekly-review-panel');
  if (!panel) return;
  const locked = document.getElementById('weekly-review-locked');
  const content = document.getElementById('weekly-review-content');
  const premium = DDA.can(prototypeState, 'premium_track');
  locked.hidden = premium;
  content.hidden = !premium;
  const windowData = weeklyReviewWindow();
  const review = premiumRecord().reviews?.['weekly-review'] || {};
  document.getElementById('weekly-review-window').textContent = `${windowData.start.toLocaleDateString('fr-FR')} → ${windowData.end.toLocaleDateString('fr-FR')} · données locales uniquement`;
  document.getElementById('weekly-review-status').textContent = review.status === 'completed' ? 'Enregistrée' : 'À commencer';
  document.getElementById('weekly-review-evidence').innerHTML = `<div><strong>${windowData.entries.length}</strong><span>entrée${windowData.entries.length > 1 ? 's' : ''} dans la fenêtre</span></div><div><strong>${windowData.markets.length}</strong><span>marché${windowData.markets.length > 1 ? 's' : ''} observé${windowData.markets.length > 1 ? 's' : ''}</span></div><p>${windowData.entries.length ? 'Cette synthèse relit tes traces réelles, sans extrapoler de performance.' : 'Aucune entrée récente : commence par documenter une observation avant de tirer une conclusion.'}</p>`;
  document.getElementById('weekly-review-strength').value = review.reflection || '';
  document.getElementById('weekly-review-pattern').value = review.pattern || '';
  document.getElementById('weekly-review-focus').value = review.focus || '';
  document.getElementById('weekly-review-next-action').value = review.nextAction || '';
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
    note: document.getElementById('journal-note').value,
    ...(journalComposerMetadata || {})
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
  journalComposerMetadata = fields.terminalSource ? { terminalSource: true, sourceLesson: fields.sourceLesson, proofId: fields.proofId, proofType: fields.proofType } : null;
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
  journalComposerMetadata = null;
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

function openWeeklyReview() {
  const panel = document.getElementById('weekly-review-panel');
  if (!panel) return;
  switchJournalTab('entries');
  document.getElementById('journal-entries-panel').hidden = true;
  document.getElementById('journal-composer').hidden = true;
  panel.hidden = false;
  renderWeeklyReview();
  document.getElementById('weekly-review-title')?.focus();
  if (DDA.can(prototypeState, 'premium_track')) trackEvent('premium_review_opened', { proof: 'weekly-review' });
}

function closeWeeklyReview() {
  document.getElementById('weekly-review-panel').hidden = true;
  document.getElementById('journal-entries-panel').hidden = false;
  document.getElementById('weekly-review-open')?.focus();
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
      ? 'Proposé parce que tu as validé tout le curriculum disponible — ton Journal est encore vide, c’est la prochaine chose réelle à faire.'
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

// Darius Analysis Terminal — only deterministic, pedagogical series are rendered.
// Values are normalized indices, not quotes, recommendations or live market data.
const TERMINAL_SERIES = Object.freeze({
  'BRVM Composite': [48, 50, 49, 52, 55, 54, 57, 56, 58, 61, 60, 63, 62, 65, 64, 67, 66, 64, 68, 70, 69, 72, 71, 74, 73, 76, 75, 77, 76, 79, 78, 80],
  'BRVM 30': [54, 53, 55, 54, 57, 59, 58, 56, 57, 60, 62, 61, 63, 62, 65, 64, 66, 68, 67, 69, 68, 71, 70, 72, 71, 73, 72, 74, 73, 76, 75, 77],
  'EUR/USD pédagogique': [72, 71, 70, 72, 73, 72, 74, 75, 74, 73, 75, 77, 76, 78, 77, 76, 78, 79, 78, 80, 79, 81, 80, 79, 81, 82, 81, 83, 82, 84, 83, 85]
});
const TERMINAL_VIEWBOX = Object.freeze({ width: 900, height: 420, left: 58, right: 824, top: 48, bottom: 350 });
const terminalInteraction = { tool: 'crosshair', draft: null, crosshair: null, view: null, ready: false };
function getTerminalState() {
  return {
    instrument: prototypeState.terminal?.instrument || 'BRVM Composite',
    timeframe: prototypeState.terminal?.timeframe || '1D',
    zoom: Number(prototypeState.terminal?.zoom) || 1,
    pan: Number(prototypeState.terminal?.pan) || 0,
    drawings: Array.isArray(prototypeState.terminal?.drawings) ? prototypeState.terminal.drawings : [],
    observation: prototypeState.terminal?.observation || '',
    practice: prototypeState.terminal?.practice || null
  };
}
function terminalClamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function terminalDataset(instrument) {
  const source = TERMINAL_SERIES[instrument] || TERMINAL_SERIES['BRVM Composite'];
  return source.map((close, index) => {
    const open = index ? source[index - 1] : close - 1;
    return { open, close, high: Math.max(open, close) + 1 + (index % 3) * .35, low: Math.min(open, close) - 1 - (index % 2) * .3, index };
  });
}
function terminalSvgPoint(event) {
  const svg = document.getElementById('terminal-chart');
  const rect = svg.getBoundingClientRect();
  return {
    x: terminalClamp((event.clientX - rect.left) / Math.max(1, rect.width) * TERMINAL_VIEWBOX.width, 0, TERMINAL_VIEWBOX.width),
    y: terminalClamp((event.clientY - rect.top) / Math.max(1, rect.height) * TERMINAL_VIEWBOX.height, 0, TERMINAL_VIEWBOX.height)
  };
}
function terminalDrawingMarkup(drawing, className = '') {
  if (!drawing) return '';
  const extra = className ? ` ${className}` : '';
  if (drawing.type === 'zone') {
    return `<rect class="sr-zone${extra}" x="${Math.min(drawing.x1, drawing.x2)}" y="${Math.min(drawing.y1, drawing.y2)}" width="${Math.abs(drawing.x2 - drawing.x1)}" height="${Math.abs(drawing.y2 - drawing.y1)}" rx="3"/>`;
  }
  if (drawing.type === 'fib') {
    return [0, .382, .5, .618, 1].map(level => {
      const yy = drawing.y1 + (drawing.y2 - drawing.y1) * level;
      return `<line class="fib-line${extra}" x1="${Math.min(drawing.x1, drawing.x2)}" x2="${Math.max(drawing.x1, drawing.x2)}" y1="${yy}" y2="${yy}"/><text class="fib-label" x="${terminalClamp(Math.max(drawing.x1, drawing.x2) - 38, 6, 850)}" y="${yy - 4}">${Math.round(level * 100)}%</text>`;
    }).join('');
  }
  return `<line class="draw-line${extra}" x1="${drawing.x1}" y1="${drawing.y1}" x2="${drawing.x2}" y2="${drawing.y2}"/>`;
}
function renderTerminalDraft() {
  const group = document.getElementById('terminal-drawing-draft');
  if (group) group.innerHTML = terminalDrawingMarkup(terminalInteraction.draft, 'is-preview');
}
function renderTerminalCrosshair() {
  const group = document.getElementById('terminal-crosshair');
  const readout = document.getElementById('terminal-candle-readout');
  if (!group) return;
  const point = terminalInteraction.crosshair;
  const view = terminalInteraction.view;
  group.hidden = !point || terminalInteraction.tool !== 'crosshair';
  if (!point || !view) {
    if (readout) readout.textContent = 'Survole une bougie pour lire sa séquence et ses valeurs pédagogiques.';
    return;
  }
  const { left, right, top, bottom } = TERMINAL_VIEWBOX;
  const candleIndex = terminalClamp(Math.round((point.x - left) / (right - left) * (view.visible.length - 1)), 0, view.visible.length - 1);
  const candle = view.visible[candleIndex];
  const value = view.max - (point.y - top) / (bottom - top) * (view.max - view.min);
  const vertical = group.querySelector('.crosshair-v');
  const horizontal = group.querySelector('.crosshair-h');
  const xLabel = group.querySelector('.crosshair-x-label');
  const yLabel = group.querySelector('.crosshair-y-label');
  vertical.setAttribute('x1', point.x);
  vertical.setAttribute('x2', point.x);
  horizontal.setAttribute('y1', point.y);
  horizontal.setAttribute('y2', point.y);
  xLabel.setAttribute('x', terminalClamp(point.x - 26, 6, 850));
  xLabel.textContent = `SEQ ${String(candle.index + 1).padStart(2, '0')}`;
  const labelY = terminalClamp(point.y - 9, top, bottom - 18);
  yLabel.parentElement.setAttribute('transform', `translate(0 ${labelY})`);
  yLabel.textContent = value.toFixed(1);
  if (readout) readout.textContent = `Séquence ${String(candle.index + 1).padStart(2, '0')} · O ${candle.open.toFixed(1)} · H ${candle.high.toFixed(1)} · B ${candle.low.toFixed(1)} · C ${candle.close.toFixed(1)} · indices sans unité`;
}
function renderDariusAnalysisTerminal() {
  const svg = document.getElementById('terminal-chart');
  if (!svg) return;
  const state = getTerminalState();
  const data = terminalDataset(state.instrument);
  const visibleCount = Math.max(12, Math.round(data.length / state.zoom));
  const maxPan = Math.max(0, data.length - visibleCount);
  const start = terminalClamp(state.pan, 0, maxPan);
  const visible = data.slice(start, start + visibleCount);
  const min = Math.min(...visible.map(candle => candle.low)) - 1;
  const max = Math.max(...visible.map(candle => candle.high)) + 1;
  const { left, right, top, bottom } = TERMINAL_VIEWBOX;
  const x = index => left + index * ((right - left) / Math.max(1, visible.length - 1));
  const y = value => top + (max - value) / (max - min) * (bottom - top);
  const candleWidth = Math.max(5, Math.min(22, (right - left) / visible.length * .5));
  terminalInteraction.view = { visible, min, max };

  const horizontalGrid = Array.from({ length: 5 }, (_, index) => {
    const yy = top + index * (bottom - top) / 4;
    const value = (max - index * (max - min) / 4).toFixed(1);
    return `<line class="grid grid-horizontal" x1="${left}" x2="${right}" y1="${yy}" y2="${yy}"/><text class="axis-value" x="${right + 12}" y="${yy + 4}">${value}</text>`;
  }).join('');
  const verticalGrid = Array.from({ length: 7 }, (_, index) => {
    const xx = left + index * (right - left) / 6;
    return `<line class="grid grid-vertical" x1="${xx}" x2="${xx}" y1="${top}" y2="${bottom}"/>`;
  }).join('');
  const candles = visible.map((candle, index) => {
    const centerX = x(index);
    const openY = y(candle.open);
    const closeY = y(candle.close);
    const klass = candle.close >= candle.open ? 'candle-up' : 'candle-down';
    return `<g class="terminal-candle ${klass}" data-sequence="${candle.index + 1}"><line class="wick" x1="${centerX}" x2="${centerX}" y1="${y(candle.high)}" y2="${y(candle.low)}"/><rect class="candle-body" x="${centerX - candleWidth / 2}" y="${Math.min(openY, closeY)}" width="${candleWidth}" height="${Math.max(3, Math.abs(closeY - openY))}" rx="1.5"/></g>`;
  }).join('');
  const sequenceLabels = Array.from({ length: 6 }, (_, labelIndex) => {
    const index = Math.round(labelIndex * (visible.length - 1) / 5);
    const candle = visible[index];
    return `<text class="axis-sequence" x="${x(index)}" y="389">SEQ ${String(candle.index + 1).padStart(2, '0')}</text>`;
  }).join('');
  const drawings = state.drawings.map(drawing => terminalDrawingMarkup(drawing)).join('');
  svg.innerHTML = `<rect class="chart-canvas" x="0" y="0" width="900" height="420"/><g class="terminal-grid">${horizontalGrid}${verticalGrid}</g><g class="terminal-candles">${candles}</g><g class="terminal-drawings">${drawings}</g><g id="terminal-drawing-draft"></g>${sequenceLabels}<g id="terminal-crosshair" hidden><line class="crosshair crosshair-v" x1="0" x2="0" y1="${top}" y2="${bottom}"/><line class="crosshair crosshair-h" x1="${left}" x2="${right}" y1="0" y2="0"/><rect class="crosshair-label-x" x="0" y="365" width="52" height="19" rx="4"/><text class="crosshair-x-label" x="5" y="378">SEQ 00</text><g class="crosshair-value-label"><rect x="${right + 5}" y="0" width="54" height="19" rx="4"/><text class="crosshair-y-label" x="${right + 32}" y="13">0.0</text></g></g>`;

  document.getElementById('terminal-instrument').value = state.instrument;
  document.getElementById('terminal-timeframe').value = state.timeframe;
  document.getElementById('terminal-zoom').value = String(state.zoom);
  document.getElementById('terminal-zoom-value').textContent = `${state.zoom}×`;
  document.getElementById('terminal-chart-market').textContent = state.instrument;
  const observation = document.getElementById('terminal-observation');
  if (document.activeElement !== observation) observation.value = state.observation;
  document.getElementById('terminal-observation-state').textContent = state.observation ? 'Observation conservée localement' : 'Non enregistré';
  document.getElementById('terminal-chart-caption').textContent = `${state.instrument} · ${state.timeframe} · série synthétique locale · indices normalisés sans unité · aucune cotation en temps réel.`;
  document.getElementById('terminal-undo-drawing').disabled = state.drawings.length === 0;
  document.getElementById('terminal-clear-drawings').disabled = state.drawings.length === 0;
  const practice = state.practice || {};
  document.getElementById('terminal-practice-proof').textContent = practice.status === 'validated' ? 'Preuve conservée localement' : practice.attempts ? 'À reprendre' : 'À commencer';
  document.getElementById('terminal-practice-feedback').textContent = practice.feedback || 'Aucune vérification effectuée.';
  document.getElementById('terminal-practice-validate').textContent = practice.status === 'validated' ? 'Rejouer la mission' : 'Vérifier ma lecture';
  renderTerminalDraft();
  renderTerminalCrosshair();
}
function terminalJournalDraft() {
  const state = getTerminalState();
  const proof = state.practice?.proof || {};
  const drawingLabels = state.drawings.map(drawing => ({ zone: 'zone Support/Résistance', line: 'ligne de tendance', fib: 'Fibonacci' }[drawing.type] || 'annotation')).join(', ');
  return {
    market: state.instrument,
    context: `Observation du Darius Analysis Terminal — timeframe ${state.timeframe}. Série pédagogique locale contrôlée, sans cotation en temps réel.`,
    scenario: state.observation,
    process: `Graphique manipulé en ${state.timeframe}, zoom ${state.zoom}/3${drawingLabels ? `; annotations : ${drawingLabels}` : ''}.`,
    note: drawingLabels ? `Annotations conservées dans le Terminal : ${drawingLabels}.` : 'Brouillon transféré depuis le Terminal — complète ton raisonnement avant d’enregistrer.',
    terminalSource: true,
    sourceLesson: proof.lessonId || state.practice?.sourceLesson || 'M0.2',
    proofId: proof.id || 'm02-zone-identification',
    proofType: proof.type || 'zone_identification'
  };
}
function initDariusAnalysisTerminal() {
  const svg = document.getElementById('terminal-chart');
  if (!svg || terminalInteraction.ready) return;
  terminalInteraction.ready = true;
  const update = patch => saveState({ terminal: { ...getTerminalState(), ...patch } });
  const setZoom = value => update({ zoom: terminalClamp(Math.round(value), 1, 3), pan: 0 });
  const hint = document.getElementById('terminal-tool-hint');

  document.getElementById('terminal-instrument').addEventListener('change', event => update({ instrument: event.target.value, pan: 0 }));
  document.getElementById('terminal-timeframe').addEventListener('change', event => update({ timeframe: event.target.value }));
  document.getElementById('terminal-zoom').addEventListener('input', event => setZoom(Number(event.target.value)));
  document.getElementById('terminal-zoom-out').addEventListener('click', () => setZoom(getTerminalState().zoom - 1));
  document.getElementById('terminal-zoom-in').addEventListener('click', () => setZoom(getTerminalState().zoom + 1));
  document.getElementById('terminal-pan-left').addEventListener('click', () => update({ pan: Math.max(0, getTerminalState().pan - 3) }));
  document.getElementById('terminal-pan-right').addEventListener('click', () => {
    const state = getTerminalState();
    const data = terminalDataset(state.instrument);
    update({ pan: Math.min(data.length - Math.max(12, Math.round(data.length / state.zoom)), state.pan + 3) });
  });
  document.querySelectorAll('[data-terminal-tool]').forEach(button => button.addEventListener('click', () => {
    terminalInteraction.tool = button.dataset.terminalTool;
    terminalInteraction.draft = null;
    document.querySelectorAll('[data-terminal-tool]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    hint.textContent = terminalInteraction.tool === 'crosshair' ? 'Survole le graphique pour lire une bougie et ses indices normalisés.' : 'Glisse sur le graphique pour placer ton annotation.';
    renderTerminalDraft();
    renderTerminalCrosshair();
  }));

  svg.addEventListener('pointermove', event => {
    const point = terminalSvgPoint(event);
    terminalInteraction.crosshair = point;
    if (terminalInteraction.draft) {
      terminalInteraction.draft = { ...terminalInteraction.draft, x2: point.x, y2: point.y };
      renderTerminalDraft();
    }
    renderTerminalCrosshair();
  });
  svg.addEventListener('pointerleave', () => {
    if (!terminalInteraction.draft) terminalInteraction.crosshair = null;
    renderTerminalCrosshair();
  });
  svg.addEventListener('pointerdown', event => {
    if (terminalInteraction.tool === 'crosshair' || event.button !== 0) return;
    event.preventDefault();
    const point = terminalSvgPoint(event);
    terminalInteraction.draft = { type: terminalInteraction.tool, x1: point.x, y1: point.y, x2: point.x, y2: point.y };
    if (svg.setPointerCapture) svg.setPointerCapture(event.pointerId);
    hint.textContent = 'Continue le geste puis relâche pour conserver le tracé.';
    renderTerminalDraft();
  });
  svg.addEventListener('pointerup', () => {
    const draft = terminalInteraction.draft;
    if (!draft) return;
    terminalInteraction.draft = null;
    renderTerminalDraft();
    const distance = Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1);
    if (distance < 12) {
      hint.textContent = 'Geste trop court — étire le tracé sur le graphique.';
      return;
    }
    const drawings = [...getTerminalState().drawings, draft].slice(-100);
    update({ drawings });
    hint.textContent = draft.type === 'zone'
      ? 'Zone S/R tracée et conservée localement. Annule ou efface avec les commandes du dock.'
      : draft.type === 'fib'
        ? 'Niveaux Fibonacci tracés et conservés localement. Annule ou efface avec les commandes du dock.'
        : 'Ligne de tendance tracée et conservée localement. Annule ou efface avec les commandes du dock.';
  });
  svg.addEventListener('pointercancel', () => {
    terminalInteraction.draft = null;
    renderTerminalDraft();
    hint.textContent = 'Geste annulé.';
  });
  svg.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !terminalInteraction.draft) return;
    terminalInteraction.draft = null;
    renderTerminalDraft();
    hint.textContent = 'Tracé annulé.';
  });
  document.getElementById('terminal-undo-drawing').addEventListener('click', () => {
    const drawings = getTerminalState().drawings;
    if (drawings.length) update({ drawings: drawings.slice(0, -1) });
    hint.textContent = 'Dernier tracé annulé.';
  });
  document.getElementById('terminal-clear-drawings').addEventListener('click', () => {
    if (!getTerminalState().drawings.length) return;
    update({ drawings: [] });
    hint.textContent = 'Tous les tracés ont été effacés du graphique local.';
  });
  document.getElementById('terminal-save-observation').addEventListener('click', () => {
    const observation = document.getElementById('terminal-observation').value.trim();
    if (!observation) {
      document.getElementById('terminal-observation-state').textContent = 'Écris une observation avant de l’enregistrer.';
      return;
    }
    update({ observation });
    showToast('Observation conservée sur cet appareil.');
  });
  document.getElementById('terminal-practice-validate').addEventListener('click', () => {
    const state = getTerminalState();
    const zones = state.drawings.filter(drawing => drawing.type === 'zone');
    const zone = zones[zones.length - 1];
    const height = zone ? Math.abs(zone.y2 - zone.y1) : 0;
    const center = zone ? (zone.y2 + zone.y1) / 2 : 0;
    const valid = Boolean(zone && height >= 45 && height <= 130 && center >= 100 && center <= 320);
    const attempts = Number(state.practice?.attempts || 0) + 1;
    const status = valid ? 'validated' : 'retry';
    const practice = {
      ...(state.practice || {}), status, attempts,
      feedback: valid
        ? 'Bonne lecture : tu as matérialisé une zone, sans la réduire à un prix exact. Preuve conservée localement.'
        : zone
          ? 'Relis la consigne : élargis ou déplace ta zone vers la partie centrale du graphique, puis réessaie.'
          : 'Choisis Zone S/R et glisse sur deux niveaux pour matérialiser une zone avant de vérifier.',
      proof: { id: 'm02-zone-identification', type: 'zone_identification', lessonId: state.practice?.sourceLesson || 'M0.2', status },
      ...(valid ? { completedAt: new Date().toISOString() } : {})
    };
    update({ practice });
    if (valid) showToast('Preuve de pratique conservée sur cet appareil.');
  });
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
  renderWeeklyReview();
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
  renderPremiumState();

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

// Native-feeling in-app history. Only route IDs are stored in history.state;
// learner data remains in the existing local/BFF stores and is never copied here.
const DDA_APP_HISTORY_MARKER = '__ddaAppNav';
const DDA_APP_HISTORY_VIEW = '__ddaAppView';
const DDA_APP_HISTORY_INDEX = '__ddaAppIndex';
let appHistoryInitialized = false;

function isKnownAppView(id) {
  return typeof id === 'string' && Boolean(document.getElementById(id)?.classList.contains('view'));
}

function getDdaHistoryState() {
  const state = history.state;
  return state && typeof state === 'object' && !Array.isArray(state) ? state : {};
}

function writeDdaHistory(viewId, mode = 'push') {
  if (!isKnownAppView(viewId)) return;
  const state = getDdaHistoryState();
  const marked = state[DDA_APP_HISTORY_MARKER] === true
    && Number.isInteger(state[DDA_APP_HISTORY_INDEX])
    && state[DDA_APP_HISTORY_INDEX] >= 0;
  const index = marked ? state[DDA_APP_HISTORY_INDEX] : 0;
  const nextState = {
    ...state,
    [DDA_APP_HISTORY_MARKER]: true,
    [DDA_APP_HISTORY_VIEW]: viewId,
    [DDA_APP_HISTORY_INDEX]: index
  };

  if (!appHistoryInitialized || !marked) {
    history.replaceState(nextState, '', `#${viewId}`);
    appHistoryInitialized = true;
    return;
  }
  if (mode === 'anchor') {
    history.replaceState({ ...nextState, [DDA_APP_HISTORY_INDEX]: index + 1 }, '', `#${viewId}`);
    return;
  }
  if (mode === 'push' && state[DDA_APP_HISTORY_VIEW] !== viewId) {
    history.pushState({ ...nextState, [DDA_APP_HISTORY_INDEX]: index + 1 }, '', `#${viewId}`);
    return;
  }
  history.replaceState(nextState, '', `#${viewId}`);
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

function showView(id, recordEvent = true, historyMode = 'auto') {
  // The public website is a separate document. Keep old Academy deep-links
  // deterministic instead of attempting to render a public view in the app
  // shell (which would recreate the architecture mixing we just removed).
  if (id === 'landing' && !document.getElementById('landing')) {
    window.location.assign('./index.html#landing');
    return;
  }
  if (id === 'back') {
    const state = getDdaHistoryState();
    if (state[DDA_APP_HISTORY_MARKER] === true && Number.isInteger(state[DDA_APP_HISTORY_INDEX]) && state[DDA_APP_HISTORY_INDEX] > 0) {
      history.back();
      return;
    }
    id = smartBackTarget();
    if (historyMode === 'auto') historyMode = 'replace';
  }
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
      const isPremiumTrack = permission === 'premium_track';
      openGate({
        eyebrow: isPremiumTrack ? 'DDA Premium · P2' : 'Offre Standard · M1+',
        title: isPremiumTrack ? 'Cette expérience est réservée à Premium.' : 'Ce module est réservé à l’offre Standard.',
        description: isPremiumTrack
          ? 'DDA Free (Découverte) peut voir l’aperçu, mais le contenu P2 complet est disponible uniquement dans la démonstration Premium locale. Aucun paiement réel — active l’aperçu pour explorer ce module.'
          : 'DDA Free (Découverte) donne accès au module M0 Fondations. Les modules M1 et suivants sont réservés aux offres Standard et Pro (CDCP-OS §4.2). Aucun paiement réel — active l’aperçu pour explorer ce module.',
        canUnlock: true,
        unlockText: isPremiumTrack ? 'Activer l’aperçu Premium (simulation)' : 'Activer l’aperçu Standard (simulation)',
        previewText: 'Voir la formule Premium',
        targetView: id
      });
      return;
    }
  }
  views.forEach(view => view.classList.toggle('active', view.id === id));
  document.querySelectorAll('.dda-surface').forEach(surface => {
    surface.classList.toggle('is-active', Boolean(surface.querySelector('.view.active')));
  });
  [...desktopItems, ...mobileItems].forEach(item => {
    const isActive = item.dataset.view === id;
    item.classList.toggle('active', isActive);
    if (isActive) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  document.body.classList.toggle('lesson-focus', LESSON_VIEW_IDS.has(id));
  document.body.classList.toggle('dda-auth-shell', id === 'access');
  document.body.classList.toggle('dda-app-shell', id !== 'landing' && id !== 'access');
  // Acquisition V1 — #landing is a public marketing surface, not an app screen:
  // it must never show the authenticated chrome (sidebar/plan/profile, topbar,
  // mobile nav, prototype banner). Scoped purely via this body class, same
  // pattern as lesson-focus above — no new routing concept.
  document.body.classList.toggle('public-shell', id === 'landing');
  document.body.classList.toggle('access-mode', id === 'access');
  syncLandingMobileCta();
  contextTitle.textContent = titles[id] || 'DDA';
  const navigationMode = historyMode === 'auto' ? (recordEvent ? 'push' : 'replace') : historyMode;
  writeDdaHistory(id, navigationMode);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id !== currentView) {
    previousView = currentView;
    storePreviousView(previousView);
    currentView = id;
  }
  if (recordEvent) trackEvent('view_opened', { view: id });
  if (recordEvent && id === 'premium-track') trackEvent('premium_track_viewed', { view: id });
  if (recordEvent && (id === 'lesson-p21' || id === 'lesson-p22')) trackEvent('premium_module_started', { module: 'P2', lesson: id });
  if (id === 'landing') {
    trackEvent('landing_viewed', {
      source: prototypeState.acquisition?.source,
      medium: prototypeState.acquisition?.medium,
      campaign: prototypeState.acquisition?.campaign
    });
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

window.addEventListener('popstate', event => {
  const viewId = event.state?.[DDA_APP_HISTORY_VIEW];
  if (!isKnownAppView(viewId)) return;
  appHistoryInitialized = true;
  showView(viewId, true, 'pop');
});

// Keep hash links (including the DDA brand link and shared deep links) on the
// same router/history path as buttons without adding a second route system.
window.addEventListener('hashchange', () => {
  const viewId = location.hash.slice(1);
  if (!isKnownAppView(viewId) || viewId === currentView) return;
  showView(viewId, true, 'anchor');
});

const resources = {
  checklist: { title: 'Checklist avant une décision', label: 'Guide · DDA Free', body: '<ol><li>Ai-je compris le contexte du marché ?</li><li>Mon scénario est-il écrit clairement ?</li><li>Où mon idée devient-elle invalide ?</li><li>Quel risque suis-je prêt à accepter ?</li><li>Est-ce une décision prévue ou impulsive ?</li><li>Puis-je justifier mon choix sans parler de gain ?</li></ol>' },
  glossary: { title: 'Les mots essentiels du marché', label: 'Glossaire · DDA Free', body: '<dl><dt>Actif</dt><dd>Ce qui est échangé sur un marché.</dd><dt>Acheteur</dt><dd>Participant qui cherche à acquérir un actif.</dd><dt>Vendeur</dt><dd>Participant qui accepte de céder un actif.</dd><dt>Liquidité</dt><dd>Facilité avec laquelle un actif peut être échangé sans déplacer fortement le prix.</dd><dt>Volatilité</dt><dd>Amplitude et rythme des variations observées, sans garantie sur leur direction future.</dd><dt>Spread</dt><dd>Écart entre le prix auquel un acheteur se positionne et celui auquel un vendeur accepte d’échanger.</dd><dt>Invalidation</dt><dd>Condition prévue à l’avance qui indique qu’une hypothèse n’est plus cohérente.</dd><dt>Risque</dt><dd>Part d’incertitude et de perte potentielle à maîtriser avant d’agir.</dd></dl>' }
};

let readerTrigger = null;
document.querySelectorAll('.resource-open').forEach(button => button.addEventListener('click', () => {
  const resource = resources[button.dataset.resource];
  document.getElementById('reader-label').textContent = resource.label;
  document.getElementById('reader-title').textContent = resource.title;
  document.getElementById('reader-content').innerHTML = resource.body;
  readerTrigger = button;
  const reader = document.getElementById('resource-reader');
  reader.hidden = false;
  reader.scrollIntoView({ behavior: prototypeState.preferences.lowData ? 'auto' : 'smooth', block: 'start' });
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
  mountPremiumLessons();
  renderState();
  closeGate();
  showToast('Accès Premium débloqué en aperçu.');
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
  mountPremiumLessons();
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
document.getElementById('weekly-review-open').addEventListener('click', openWeeklyReview);
document.getElementById('weekly-review-preview').addEventListener('click', () => { closeWeeklyReview(); showView('membership'); });
document.getElementById('weekly-review-cancel').addEventListener('click', closeWeeklyReview);
document.getElementById('weekly-review-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!DDA.can(prototypeState, 'premium_track')) return;
  const fields = {
    reflection: document.getElementById('weekly-review-strength').value.trim(),
    pattern: document.getElementById('weekly-review-pattern').value.trim(),
    focus: document.getElementById('weekly-review-focus').value.trim(),
    nextAction: document.getElementById('weekly-review-next-action').value.trim()
  };
  const error = document.getElementById('weekly-review-error');
  if (!Object.values(fields).some(Boolean)) {
    error.textContent = 'Renseigne au moins une réflexion avant d’enregistrer.';
    return;
  }
  error.textContent = '';
  const windowData = weeklyReviewWindow();
  const previous = premiumRecord().reviews?.['weekly-review'] || {};
  savePremiumPatch({ reviews: { ...premiumRecord().reviews, 'weekly-review': {
    ...previous,
    status: 'completed',
    openedAt: previous.openedAt || new Date().toISOString(),
    completedAt: new Date().toISOString(),
    sourceProof: 'journal-window',
    windowStart: windowData.start.toISOString(),
    windowEnd: windowData.end.toISOString(),
    entryCount: windowData.entries.length,
    markets: windowData.markets.join(' · '),
    ...fields
  } } });
  trackEvent('premium_weekly_review_completed', { proof: 'journal-window' });
  closeWeeklyReview();
  showToast('Revue hebdomadaire enregistrée localement.');
});
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
  const sourceButton = event.target.closest('.journal-proof-source');
  if (sourceButton) {
    showView(sourceButton.dataset.view);
  } else if (editButton) {
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

document.getElementById('signup-form').addEventListener('submit', async event => {
  event.preventDefault();
  const nameField = document.getElementById('first-name');
  const emailField = document.getElementById('email');
  const passwordField = document.getElementById('access-password');
  const consentField = document.getElementById('consent');
  const name = nameField.value.trim();
  const email = emailField.value.trim();
  const password = passwordField?.value || '';
  const consent = consentField.checked;
  const error = document.getElementById('signup-error');
  const bffMode = Boolean(window.DDABFF?.enabled());
  const invalidFields = [((!bffMode || bffAuthMode !== 'login') && !name) && nameField, !email && emailField, (bffMode && password.length < 12) && passwordField, (!bffMode && !consent) && consentField].filter(Boolean);
  [nameField, emailField, passwordField, consentField].filter(Boolean).forEach(field => field.setAttribute('aria-invalid', String(invalidFields.includes(field))));
  if (invalidFields.length) {
    error.textContent = bffMode
      ? (bffAuthMode === 'login' ? 'Indique ton e-mail et ton mot de passe.' : 'Complète les champs et utilise un mot de passe d’au moins 12 caractères.')
      : 'Complète les champs et confirme le stockage local.';
    invalidFields[0].focus();
    return;
  }
  error.textContent = '';
  if (bffMode) {
    try {
      if (bffAuthMode === 'signup') {
        await window.DDABFF.register({ email, password, display_name: name });
        document.getElementById('bff-auth-status').textContent = 'Si l’inscription peut être finalisée, un lien de vérification vient d’être envoyé. Vérifie ta boîte mail puis connecte-toi.';
        setBffAuthMode('login');
        document.getElementById('email').value = email;
      } else {
        await window.DDABFF.login({ email, password });
        const user = await hydrateRemoteSession();
        if (!user) throw new Error('session_missing');
        document.getElementById('bff-auth-status').textContent = '';
        showOnboardingAfterRemoteAuth(user);
      }
    } catch (authError) {
      error.textContent = authError?.status === 401 ? 'E-mail ou mot de passe incorrect.' : 'Impossible de terminer cette étape pour le moment. Réessaie plus tard.';
    }
    return;
  }
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
      const message = button.dataset.feedback || (correct ? successText : 'Pas encore. Reviens aux faits observables, puis essaie à nouveau.');
      feedback.replaceChildren();
      const kicker = document.createElement('strong');
      kicker.className = 'feedback-kicker';
      kicker.textContent = correct ? 'Darius Insight — lecture confirmée' : 'Darius Insight — point à revoir';
      const copy = document.createElement('span');
      copy.className = 'feedback-copy';
      copy.textContent = message || 'Relis le raisonnement présenté dans cette étape avant de répondre à nouveau.';
      feedback.append(kicker, copy);
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

function mountPremiumLessons() {
  if (!DDA.can(prototypeState, 'premium_track')) return;
  mountedLessons.filter(entry => entry.permission === 'premium_track').forEach(entry => {
    const main = document.getElementById(`${entry.viewId}-main`);
    const wasMounted = main?.dataset.ddaLessonMounted === 'true';
    mountLesson(entry);
    if (!wasMounted && main) {
      bindRegistryQuestions(entry);
      main.querySelectorAll('[data-view]').forEach(bindViewButton);
    }
  });
}

/* -------------------------------------------------------------------------
   Premium P2 — local vertical slice controller.
   It deliberately writes only through DDA.updatePremium()/DDA.track(); no server
   entitlement, financial result or market signal is implied.                 */
function premiumRecord() {
  return prototypeState.premium || DDA.emptyPremiumState();
}

function renderPremiumState() {
  const premium = premiumRecord();
  const p21 = DDALearning.getLessonProgress(prototypeState, 'P2.1');
  const p22 = DDALearning.getLessonProgress(prototypeState, 'P2.2');
  const lab = premium.labs?.['p2-risk-plan'] || {};
  const assessment = premium.assessments?.['p2-controlled-decision'] || {};
  const proof = premium.proofs?.['p2-risk-foundations'] || null;
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  set('p2-p21-status', p21.quizComplete ? 'Validée' : p21.exerciseComplete ? 'En cours' : 'À commencer');
  set('p2-p22-status', p22.quizComplete ? 'Validée' : p22.exerciseComplete ? 'En cours' : p21.quizComplete ? 'À commencer' : 'Après P2.1');
  set('p2-lab-status', lab.status === 'validated' ? 'Validé' : lab.status === 'retry' ? 'À reprendre' : p22.quizComplete ? 'À commencer' : 'Après les leçons');
  set('p2-assessment-status', assessment.passed ? 'Validé' : lab.status === 'validated' ? 'À commencer' : 'Après le Lab');
  set('premium-track-progress', assessment.passed ? 'Preuve créée · prochaine action : Journal' : lab.status === 'validated' ? 'Lab validé · assessment disponible' : p22.quizComplete ? 'Leçons validées · Lab disponible' : p21.quizComplete ? 'P2.1 validée · P2.2 disponible' : 'Parcours non commencé');
  const receipt = document.getElementById('premium-proof-receipt');
  if (receipt) receipt.hidden = !proof;
  if (proof) set('p2-proof-date', proof.createdAt ? new Date(proof.createdAt).toLocaleString('fr-FR') : 'Local timestamp');
  const progress = document.getElementById('premium-proof-progress');
  if (progress) progress.innerHTML = proof
    ? `<article class="premium-proof-row"><strong>${proof.skill || 'Risk Foundations'}</strong><span>${proof.level || 'Level 3 — Apply'}</span><p>${proof.source || 'P2 Guided Risk Lab + Assessment'}</p><small>${proof.createdAt ? new Date(proof.createdAt).toLocaleString('fr-FR') : 'Local timestamp'} · ${proof.nextAction || 'Continue to the next Premium Practice.'}</small></article>`
    : '<p>Aucune preuve Premium validée pour le moment.</p>';
}

function savePremiumPatch(patch) {
  prototypeState = DDA.updatePremium(prototypeState, patch);
  renderState();
}

function premiumFeedback(el, good, title, text) {
  if (!el) return;
  el.className = `feedback ${good ? 'success' : 'error'}`;
  el.replaceChildren();
  const strong = document.createElement('strong'); strong.className = 'feedback-kicker'; strong.textContent = title;
  const span = document.createElement('span'); span.className = 'feedback-copy'; span.textContent = text;
  el.append(strong, span);
}

document.getElementById('premium-lab-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const values = {
    direction: document.getElementById('p2-direction').value,
    setup: document.getElementById('p2-setup').value.trim(),
    entry: document.getElementById('p2-entry').value.trim(),
    invalidation: document.getElementById('p2-invalidation').value.trim(),
    risk: Number(document.getElementById('p2-risk').value),
    target: document.getElementById('p2-target').value.trim(),
    noTrade: document.getElementById('p2-no-trade').value.trim()
  };
  const feedback = document.getElementById('premium-lab-feedback');
  const attempts = Number(premiumRecord().labs?.['p2-risk-plan']?.attempts || 0) + 1;
  let status = 'retry';
  let message = 'Review required. Your stop is present, but the scenario invalidation has not been established. Revisit the market structure before defining the risk.';
  let title = 'Review required';
  if (values.invalidation.length < 10) {
    message = 'Review required. Your stop is present, but the scenario invalidation has not been established. Revisit the market structure before defining the risk.';
  } else if (values.entry.length < 10) {
    title = 'Decision check';
    message = 'Decision check. You have identified a zone, but a zone alone does not define an entry condition.';
  } else if (!Number.isFinite(values.risk) || values.risk <= 0 || values.risk > 50 || values.target.length < 5 || values.noTrade.length < 10) {
    title = 'Risk boundary check';
    message = 'Define a measurable risk at or below the $50 educational example, a coherent target and a clear no-trade condition before execution.';
  } else {
    status = 'validated'; title = 'Good';
    message = 'Your invalidation is defined before execution. This gives the trade a measurable risk boundary.';
  }
  const lab = { status, attempts, lastFeedback: message, sourceLesson: 'P2.2', proofId: 'p2-risk-foundations', ...(status === 'validated' ? { completedAt: new Date().toISOString() } : {}) };
  savePremiumPatch({ trackId: 'P2-risk-discipline', labs: { ...premiumRecord().labs, 'p2-risk-plan': lab } });
  trackEvent('premium_lab_attempted', { lab: 'p2-risk-plan' });
  if (status === 'validated') trackEvent('premium_lab_validated', { lab: 'p2-risk-plan' });
  premiumFeedback(feedback, status === 'validated', title, message);
});

document.getElementById('premium-assessment-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const feedback = document.getElementById('premium-assessment-feedback');
  if (premiumRecord().labs?.['p2-risk-plan']?.status !== 'validated') {
    premiumFeedback(feedback, false, 'Lab required', 'Valide d’abord le P2 Lab afin que l’assessment repose sur une décision construite.'); return;
  }
  const answers = ['p2-q1', 'p2-q2', 'p2-q3', 'p2-q4'].map(name => document.querySelector(`input[name="${name}"]:checked`)?.value);
  const passed = answers.join('|') === 'wait|respect|c|b';
  const previous = premiumRecord().assessments?.['p2-controlled-decision'] || {};
  const assessment = { attempts: Number(previous.attempts || 0) + 1, passed, completedAt: passed ? new Date().toISOString() : undefined };
  savePremiumPatch({ assessments: { ...premiumRecord().assessments, 'p2-controlled-decision': assessment } });
  trackEvent('premium_assessment_completed', { assessment: 'p2-controlled-decision' });
  if (!passed) {
    premiumFeedback(feedback, false, 'Review required', 'Relis la distinction entre résultat et processus, puis vérifie que le risque ne dépasse jamais la limite définie.'); return;
  }
  const createdAt = new Date().toISOString();
  const proof = { type: 'skill_evidence', source: 'P2 Guided Risk Lab + Assessment', competencyId: 'risk_foundations', skill: 'Risk Foundations', level: 'Level 3 — Apply', createdAt, nextAction: 'Continue to the next Premium Practice.' };
  savePremiumPatch({ modules: { ...premiumRecord().modules, P2: { status: 'completed', completedAt: createdAt } }, proofs: { ...premiumRecord().proofs, 'p2-risk-foundations': proof } });
  trackEvent('premium_proof_created', { proof: 'p2-risk-foundations', skill: 'Risk Foundations', nextAction: 'Journal' });
  premiumFeedback(feedback, true, 'Validated', 'Controlled Decision validée. Une preuve pédagogique locale a été créée — elle ne constitue pas une certification officielle.');
});

document.getElementById('p2-journal-bridge')?.addEventListener('click', event => {
  const proof = premiumRecord().proofs?.['p2-risk-foundations'];
  if (!proof) return;
  trackEvent('premium_review_opened', { proof: 'p2-risk-foundations' });
  showView('journal');
  openJournalComposer(null, event.currentTarget, {
    market: 'XAUUSD — scénario synthétique',
    context: 'Price approaches a previously identified support zone. Higher-timeframe structure remains bullish.',
    scenario: 'Potential bullish reaction — exercice pédagogique local.',
    process: 'Context → Setup → Entry → Invalidation → Risk → Target → Review',
    decision: 'Risk Plan construit dans le P2 Guided Risk Lab.',
    outcome: 'À revoir dans le Journal — aucune donnée de marché réelle.',
    whatWorked: 'J’ai défini une invalidation avant de considérer l’entrée.',
    toImprove: 'Continuer à distinguer résultat et qualité du processus.',
    note: 'Risk Foundations · Level 3 — Apply', terminalSource: true, sourceLesson: 'P2.2', proofId: 'p2-risk-foundations', proofType: 'skill_evidence'
  });
});

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
  previousView = null;
  storePreviousView(null);
  showToast('Tes données ont été effacées.');
}

document.getElementById('reset-session').addEventListener('click', resetPilot);
document.getElementById('profile-reset').addEventListener('click', resetPilot);

document.getElementById('profile-form').addEventListener('submit', async event => {
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
  if (remoteUser && window.DDABFF?.enabled()) {
    try {
      const updated = await window.DDABFF.updateMe({ display_name: name });
      if (!updated) {
        document.getElementById('profile-error').textContent = 'Ta session serveur a expiré. Reconnecte-toi pour modifier ce profil.';
        return;
      }
      remoteUser = updated;
    } catch {
      document.getElementById('profile-error').textContent = 'Le profil serveur est momentanément indisponible. Réessaie sans perdre tes données locales.';
      return;
    }
  }
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
initBffAuthUi();
hydrateRemoteSession();
handleBffVerificationToken();
renderMarketIntelligence();

// A first-time visitor (no local profile yet, no deep-link hash) must land on
// the real entry point — Access/onboarding — never on the Terminal's static
// default-active markup, which would otherwise show a placeholder "Richard"
// dashboard as if already signed in before anyone has actually onboarded.
const initialView = BOOT_HASH_VIEW;
if (initialView && document.getElementById(initialView)) {
  // Pre-seed currentView to the view we're actually booting into so showView()'s
  // own "record previous" logic below doesn't treat this restore as a real
  // transition and clobber the previousView just restored from sessionStorage
  // above (see V1.1 correction) with the hardcoded 'dashboard' default.
  currentView = initialView;
  showView(initialView);
} else if (!prototypeState.user) showView('access');

if (!appHistoryInitialized) {
  const activeViewId = document.querySelector('.view.active')?.id || 'dashboard';
  writeDdaHistory(activeViewId, 'replace');
}


/* DDA Visual Identity V2 — progressive reveals for premium editorial rhythm.
   Purely presentational: no learning state, navigation, or analytics semantics. */
(function initDDAVisualRhythm() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const selector = [
    '.landing-main-copy',
    '.landing-aperture',
    '.landing-method article',
    '.landing-experience',
    '.experience-flow li',
    '.landing-product > *',
    '.product-window',
    '.product-index article',
    '.landing-proof > *',
    '.proof-composition > *',
    '.proof-principles li',
    '.landing-ecosystem > *',
    '.domain-rail article',
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

/* Growth / conversion V1 — mesure uniquement les étapes réellement atteintes.
   Aucun pixel tiers ni donnée personnelle : les événements passent par le même
   adaptateur local que le reste du produit et restent inoffensifs hors GO. */
(function initLandingFunnelMeasurement() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !('IntersectionObserver' in window)) return;
  const seen = new Set();
  const nodes = document.querySelectorAll('[data-funnel-section]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const section = entry.target.dataset.funnelSection;
      if (!section || seen.has(section)) return;
      seen.add(section);
      trackEvent('landing_section_reached', { section });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -12% 0px' });
  nodes.forEach(node => observer.observe(node));
})();

// The mobile CTA is useful after the hero, not on top of the first decision.
// Keep it out of the reader's way when it would cover the final Free card.
// Desktop never receives either mobile-only visibility state.
function syncLandingMobileCta() {
  const isPublicLanding = document.body.classList.contains('public-shell');
  const isMobileViewport = window.matchMedia
    ? window.matchMedia('(max-width: 639px)').matches
    : window.innerWidth <= 639;
  let coversLastCard = false;
  if (isPublicLanding && isMobileViewport) {
    const lastCard = document.querySelector('.landing-free-grid article:last-child');
    const cta = document.querySelector('.landing-mobile-cta');
    if (lastCard && cta) {
      const cardRect = lastCard.getBoundingClientRect();
      const ctaRect = cta.getBoundingClientRect();
      coversLastCard = cardRect.bottom > ctaRect.top && cardRect.top < ctaRect.bottom;
    }
  }
  document.body.classList.toggle('landing-cta-covering-content', coversLastCard);
  document.body.classList.toggle('landing-has-scrolled', isPublicLanding && window.scrollY > 520);
}
window.addEventListener('scroll', syncLandingMobileCta, { passive: true });
window.addEventListener('resize', syncLandingMobileCta, { passive: true });

/* Premium visual finish — narrative motion and practice preview only. */
(function initLandingNarrativePreview() {
  const flow = [...document.querySelectorAll('[data-experience-step]')];
  const status = document.querySelector('[data-experience-status]');
  const labels = ['Discover — commencer par une question claire.', 'Learn — donner un cadre à ce que tu observes.', 'Practice — essayer avec le droit au retry.', 'Analyze — comprendre ce qui a changé.', 'Improve — choisir la prochaine action utile.'];
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let active = 0;
  const render = (index) => {
    active = index % flow.length;
    flow.forEach((node, i) => node.classList.toggle('is-active', i === active));
    if (status) status.textContent = labels[active];
  };
  if (flow.length && !reduced) {
    window.setInterval(() => {
      if (document.body.classList.contains('public-shell')) render(active + 1);
    }, 2600);
  }
  document.querySelectorAll('[data-proof-choice]').forEach(button => button.addEventListener('click', () => {
    const right = button.dataset.proofChoice === 'right';
    const box = button.closest('[data-proof-demo]');
    box?.classList.toggle('is-confirmed', right);
    box?.classList.toggle('is-review', !right);
    const state = box?.querySelector('[data-proof-state]');
    const feedback = box?.querySelector('[data-proof-feedback]');
    if (state) state.textContent = right ? 'Preuve comprise' : 'À revoir';
    if (feedback) feedback.textContent = right ? 'Exact. Une observation expliquée devient une preuve de compréhension.' : 'À revoir. DDA t’indique ce qui manque, puis te permet de recommencer.';
  }));
})();

// Forms are disabled in static HTML. Only expose local-submit controls after
// every application handler above has been installed successfully.
document.querySelectorAll('form[data-js-submit] button[type="submit"]').forEach(button => {
  button.disabled = false;
});

/* Mission rails — each destination states its job and offers one contextual next step. */
document.getElementById('journal-mission-new')?.addEventListener('click', () => document.getElementById('journal-new-entry')?.click());
