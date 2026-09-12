// The lesson reader is data-driven: render the active lesson's markup into its
// mount points before anything below captures [data-view] buttons, so buttons
// generated inside the lesson (Quitter, Voir ma Progression, …) get bound too.
const activeLessonId = DDA.primaryLessonId;
const activeLessonMeta = DDALearning.findLesson(DDA.curriculum, activeLessonId);
const activeLessonDef = activeLessonMeta.lesson;
document.getElementById('lesson-main').insertAdjacentHTML('beforeend', DDALessonRenderer.renderLessonMain(activeLessonMeta.module, activeLessonDef));
document.getElementById('lesson-outline').innerHTML = DDALessonRenderer.renderLessonOutline(activeLessonDef);

const buttons = document.querySelectorAll('[data-view]');
const views = document.querySelectorAll('.view');
const desktopItems = document.querySelectorAll('.nav-item');
const mobileItems = document.querySelectorAll('.mobile-nav button');
const contextTitle = document.getElementById('context-title');
const titles = { dashboard: 'Aujourd’hui', access: 'Accès pilote', path: 'Mon parcours', lesson: 'Leçon en cours', progress: 'Progression', resources: 'Ressources', markets: 'Marchés & BRVM', brokers: 'Broker Hub', membership: 'DDA Premium', support: 'Aide & support', profile: 'Mon profil' };
const viewPermissions = { path: 'path', lesson: 'lesson_m01', progress: 'progress', resources: 'resources_free', markets: 'market_room', brokers: 'broker_hub', membership: 'membership', support: 'support', profile: 'profile' };
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
// Real accomplishments only — built from DDA.track's own event log, never fabricated.
const ACTIVITY_LABELS = {
  onboarding_complete: () => 'Parcours pilote créé',
  lesson_understood: () => 'Leçon comprise',
  exercise_complete: () => 'Exercice validé',
  quiz_complete: () => 'Quiz validé — compétence confirmée',
  profile_updated: () => 'Profil mis à jour',
  plan_preview: metadata => (metadata.plan === 'premium' ? 'Aperçu Premium activé' : 'Retour à DDA Free')
};
const NEXT_STEP_PHRASE = { lesson: 'voir la leçon', exercise: 'réussir l’exercice', quiz: 'valider le quiz' };
// Fixed, honest path for the one real lesson — done/pending only, no fabricated dates.
const PROOF_MILESTONES = [
  { label: 'Parcours pilote créé', eventName: 'onboarding_complete', done: () => Boolean(prototypeState.onboarding?.complete) },
  { label: 'Leçon comprise', eventName: 'lesson_understood', done: lp => lp.lessonViewed },
  { label: 'Exercice validé', eventName: 'exercise_complete', done: lp => lp.exerciseComplete },
  { label: 'Quiz validé — compétence confirmée', eventName: 'quiz_complete', done: lp => lp.quizComplete }
];

function competencyLevel(lessonProgress) {
  if (lessonProgress.quizComplete) return 4;
  if (lessonProgress.exerciseComplete) return 3;
  if (lessonProgress.lessonViewed) return 2;
  return 0;
}

function setLevelMeter(id, level) {
  const meter = document.getElementById(id);
  if (!meter) return;
  [...meter.children].forEach((segment, index) => segment.classList.toggle('filled', index < level));
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

let prototypeState = DDA.load();

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

// A module card can only be opened today if it holds the one lesson we have a reader view for.
function isRenderableModule(module) {
  return module.lessons.some(lesson => lesson.id === activeLessonId);
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
  const currentIndex = modules.findIndex(isRenderableModule);
  const currentModule = modules[currentIndex];
  const currentStatus = DDALearning.moduleStatus(DDA.curriculum, currentModule.id, prototypeState);
  const currentLesson = currentModule.lessons.find(lesson => lesson.id === activeLessonId);
  const currentNumber = String(currentIndex + 1).padStart(2, '0');
  const lessonCount = currentModule.lessons.length;

  const rail = modules.map((module, index) => ({ module, index })).filter(({ index }) => index !== currentIndex).map(({ module, index }) => {
    const status = DDALearning.moduleStatus(DDA.curriculum, module.id, prototypeState);
    const number = String(index + 1).padStart(2, '0');
    return `<li class="journey-node ${status}"><span class="journey-dot"></span><span class="path-number">${number}</span><div><small>${moduleStatusLabel(status, false)}</small><strong>${module.title}</strong>${module.summary ? `<p>${module.summary}</p>` : ''}</div></li>`;
  }).join('');

  container.innerHTML = `
    <button class="journey-current" data-view="lesson">
      <div class="journey-current-eyebrow"><span class="path-number">${currentNumber}</span><div><small>${moduleStatusLabel(currentStatus, true)}</small><span class="journey-current-tag">${currentModule.title}</span></div></div>
      <h2>${currentLesson.title}</h2>
      <p>${currentLesson.summary}</p>
      <div class="journey-meta"><span><svg class="icon"><use href="#icon-clock"/></svg>${currentLesson.estimatedMinutes} min</span><span><svg class="icon"><use href="#icon-book"/></svg>${lessonCount} leçon${lessonCount > 1 ? 's' : ''}</span></div>
      <span class="primary-action">${moduleActionLabel(currentStatus, true)} <span>→</span></span>
    </button>
    <ol class="journey-rail" aria-label="Prochains modules du parcours">${rail}</ol>`;
  container.querySelector('.journey-current').addEventListener('click', () => showView('lesson'));
}

function renderModulesRecap() {
  const container = document.getElementById('modules-recap-list');
  if (!container) return;
  container.innerHTML = DDA.curriculum.modules.map(module => {
    const status = DDALearning.moduleStatus(DDA.curriculum, module.id, prototypeState);
    return `<li><span class="module-id">${module.id}</span><strong>${module.title}</strong><span class="module-pill ${status}">${MODULE_STATUS_LABEL[status] || status}</span></li>`;
  }).join('');
}

function renderMarketIntelligence() {
  const indices = document.getElementById('market-indices');
  if (indices) {
    indices.innerHTML = MARKET_DEMO.indices.map(item => `
      <article class="index-card">
        <div class="index-card-head"><strong>${item.label}</strong><span class="data-badge"><svg class="icon"><use href="#icon-blocked"/></svg>Non connecté</span></div>
        <svg class="index-sparkline" viewBox="0 0 120 30" aria-hidden="true"><path d="M2 18 L22 18 L42 12 L62 20 L82 10 L102 16 L118 14"/></svg>
        <p>${item.description}</p>
      </article>
    `).join('');
  }
  const calendar = document.getElementById('market-calendar-list');
  if (calendar) {
    calendar.innerHTML = MARKET_DEMO.calendar.map(row => `
      <li><div><strong>${row.company}</strong><small>${row.event}</small></div><span class="data-badge"><svg class="icon"><use href="#icon-clock"/></svg>À confirmer</span></li>
    `).join('');
  }
}

function renderRecentActivity() {
  const container = document.getElementById('recent-activity-list');
  if (!container) return;
  const items = (prototypeState.events || []).filter(event => ACTIVITY_LABELS[event.name]).slice(-4).reverse();
  if (!items.length) {
    container.innerHTML = '<li class="activity-empty">Ton activité récente apparaîtra ici.</li>';
    return;
  }
  container.innerHTML = items.map(event => `
    <li><svg class="icon"><use href="#icon-check-circle"/></svg><div><strong>${ACTIVITY_LABELS[event.name](event.metadata || {})}</strong><small>${relativeTime(event.at)}</small></div></li>
  `).join('');
}

function renderProofTimeline() {
  const container = document.getElementById('proof-timeline');
  if (!container) return;
  const lessonProgress = DDALearning.getLessonProgress(prototypeState, activeLessonId);
  const events = prototypeState.events || [];
  container.innerHTML = PROOF_MILESTONES.map(milestone => {
    const done = milestone.done(lessonProgress);
    const event = [...events].reverse().find(e => e.name === milestone.eventName);
    const when = done ? (event ? relativeTime(event.at) : 'Complété') : 'À venir';
    const icon = done ? '<svg class="icon"><use href="#icon-check-circle"/></svg>' : '';
    return `<li class="${done ? 'done' : 'pending'}"><span class="proof-dot">${icon}</span><div><strong>${milestone.label}</strong><small>${when}</small></div></li>`;
  }).join('');
}

function renderProgressHero() {
  const startedEl = document.getElementById('progress-modules-started');
  if (!startedEl) return;
  const started = DDA.curriculum.modules.filter(module => {
    const status = DDALearning.moduleStatus(DDA.curriculum, module.id, prototypeState);
    return status === DDALearning.MODULE_STATUS.IN_PROGRESS || status === DDALearning.MODULE_STATUS.COMPLETED;
  }).length;
  startedEl.textContent = `${started}/${DDA.curriculum.modules.length}`;
  document.getElementById('progress-total-xp').textContent = String(DDALearning.totalXp(DDA.curriculum, prototypeState));
  document.getElementById('progress-active-days').textContent = String(countActiveDays(prototypeState.events));
}

function updateLessonLoop(lessonProgress) {
  const loop = document.getElementById('lesson-loop');
  if (!loop) return;
  const step = DDALearning.lessonNextStep(lessonProgress);
  const order = ['lesson', 'exercise', 'quiz', 'review'];
  const currentIndex = order.indexOf(step);
  loop.querySelectorAll('li').forEach(item => {
    const itemIndex = order.indexOf(item.dataset.step);
    item.classList.toggle('done', itemIndex < currentIndex || step === 'review');
    item.classList.toggle('now', itemIndex === currentIndex && step !== 'review');
  });
}

function updateLessonOutline(step) {
  document.querySelectorAll('#lesson-outline-list li').forEach(item => {
    item.classList.toggle('active', item.dataset.outlineStep === step);
  });
}

// Real data only: XP already earned on this lesson, the competency it maps to,
// and the next actionable lesson from the engine — never a fabricated stat.
function renderResultStats(lesson, lessonProgress) {
  const stats = document.getElementById('result-stats');
  if (!stats) return;
  const xp = DDALearning.lessonXp(lesson, lessonProgress);
  const next = DDALearning.nextActionable(DDA.curriculum, prototypeState);
  const nextLabel = next ? `${next.lesson.title} — ${NEXT_STEP_PHRASE[next.step] || 'continuer'}` : 'Prochain module bientôt disponible.';
  stats.innerHTML = `
    <div><dt>Compétence</dt><dd>${lesson.competency.label} — niveau confirmé</dd></div>
    <div><dt>XP obtenu sur cette leçon</dt><dd>+${xp} XP</dd></div>
    <div><dt>Prochaine étape</dt><dd>${nextLabel}</dd></div>`;
}

function updateCockpitAlert(continueTarget) {
  const cue = document.getElementById('cockpit-alert-cue');
  if (!cue) return;
  const step = continueTarget && NEXT_STEP_PHRASE[DDALearning.lessonNextStep(DDALearning.getLessonProgress(prototypeState, continueTarget.lesson.id))];
  cue.hidden = !step;
  cue.textContent = step ? `Prochaine étape : ${step} de « ${continueTarget.lesson.title} ».` : '';
}

function resolveContinueTarget() {
  const next = DDALearning.nextActionable(DDA.curriculum, prototypeState);
  if (next) return next;
  const found = DDALearning.findLesson(DDA.curriculum, activeLessonId);
  return found ? { module: found.module, lesson: found.lesson } : null;
}

function renderState() {
  const name = prototypeState.user?.name || 'Richard';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'RD';
  const activeLessonProgress = DDALearning.getLessonProgress(prototypeState, activeLessonId);
  const progress = DDALearning.lessonProgressPercent(activeLessonProgress);
  const xp = DDALearning.totalXp(DDA.curriculum, prototypeState) || 20;
  const complete = Boolean(activeLessonProgress.quizComplete);

  document.getElementById('dashboard-name').textContent = name;
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-avatar').textContent = initials;
  document.getElementById('module-percent').textContent = `${progress}%`;
  document.getElementById('module-ring').style.setProperty('--progress', progress);
  document.getElementById('week-xp').textContent = `+${xp} XP`;
  const activeDays = countActiveDays(prototypeState.events);
  document.getElementById('active-days').textContent = `${activeDays} jour${activeDays > 1 ? 's' : ''}`;
  document.getElementById('personalized-next').textContent = complete
    ? `${activeLessonId} est validée. Ton prochain module sera bientôt disponible.`
    : prototypeState.onboarding?.goal
      ? `Objectif : ${prototypeState.onboarding.goal}. Prochaine étape : terminer ${activeLessonId}.`
      : 'Une étape claire pour continuer à progresser.';

  const continueTarget = resolveContinueTarget();
  if (continueTarget) {
    const continueLessonProgress = DDALearning.getLessonProgress(prototypeState, continueTarget.lesson.id);
    const continueComplete = continueLessonProgress.quizComplete;
    document.getElementById('lesson-state-pill').textContent = continueComplete ? 'Validée' : 'En cours';
    const lessonIndex = continueTarget.module.lessons.findIndex(l => l.id === continueTarget.lesson.id) + 1;
    document.getElementById('lesson-index-label').textContent = continueComplete ? 'COMPÉTENCE VALIDÉE' : `LEÇON ${lessonIndex} SUR ${continueTarget.module.lessons.length}`;
    document.getElementById('lesson-primary-action').innerHTML = continueComplete ? 'Revoir la leçon <span>→</span>' : 'Reprendre la leçon <span>→</span>';
  }
  updateCockpitAlert(continueTarget);
  renderRecentActivity();

  document.getElementById('market-skill-label').textContent = activeLessonProgress.quizComplete ? 'Fondation validée' : activeLessonProgress.exerciseComplete ? 'En progression' : 'En démarrage';
  setLevelMeter('market-skill-level', competencyLevel(activeLessonProgress));
  renderProofTimeline();
  renderProgressHero();

  const step = DDALearning.lessonNextStep(activeLessonProgress);
  ['action-lesson', 'action-exercise', 'action-quiz'].forEach(id => document.getElementById(id).classList.remove('done', 'current'));
  if (step === 'review') {
    ['action-lesson', 'action-exercise', 'action-quiz'].forEach(id => document.getElementById(id).classList.add('done'));
  } else if (step === 'quiz') {
    document.getElementById('action-lesson').classList.add('done');
    document.getElementById('action-exercise').classList.add('done');
    document.getElementById('action-quiz').classList.add('current');
  } else {
    document.getElementById('action-lesson').classList.add('current');
  }

  const journey = document.querySelector('.journey-button');
  journey.textContent = complete ? `Revoir ${activeLessonId}` : prototypeState.onboarding?.complete ? `Reprendre ${activeLessonId}` : 'Tester le parcours';
  journey.dataset.view = prototypeState.onboarding?.complete ? 'lesson' : 'access';

  updateLessonLoop(activeLessonProgress);
  updateLessonOutline(step);
  const evalUnlocked = DDALearning.evaluationStatus(activeLessonProgress) !== DDALearning.STEP_STATUS.LOCKED;
  const quiz = document.getElementById('quiz-block');
  quiz.classList.toggle('locked-check', !evalUnlocked);
  quiz.setAttribute('aria-disabled', String(!evalUnlocked));
  quiz.querySelectorAll('[data-question="quiz"] button').forEach(button => { button.disabled = !evalUnlocked; });

  document.getElementById('result-card').hidden = !complete;
  document.getElementById('mark-understood').hidden = complete;
  if (complete) {
    document.getElementById('saved-state').textContent = 'Exercice et quiz validés localement — aucune donnée envoyée';
    renderResultStats(activeLessonDef, activeLessonProgress);
  }

  document.getElementById('resume-device').hidden = !prototypeState.user;
  document.getElementById('low-data-toggle').checked = Boolean(prototypeState.preferences.lowData);
  document.body.classList.toggle('low-data', Boolean(prototypeState.preferences.lowData));
  const dataButton = document.getElementById('low-data-button');
  dataButton.textContent = prototypeState.preferences.lowData ? 'Data réduite' : 'Data normale';
  dataButton.setAttribute('aria-pressed', String(Boolean(prototypeState.preferences.lowData)));

  const hasProfile = Boolean(prototypeState.user);
  document.getElementById('profile-form').hidden = !hasProfile;
  document.querySelector('.preference-panel').hidden = !hasProfile;
  document.getElementById('empty-profile').hidden = hasProfile;
  if (hasProfile) {
    document.getElementById('profile-large-avatar').textContent = initials;
    document.getElementById('profile-heading-name').textContent = name;
    document.getElementById('profile-heading-email').textContent = prototypeState.user.email || 'Compte local';
    document.getElementById('profile-first-name').value = name;
    document.getElementById('profile-level').value = prototypeState.onboarding?.level || 'Débutant';
    document.getElementById('profile-goal').value = prototypeState.onboarding?.goal || 'Comprendre les marchés';
    document.getElementById('profile-time').value = prototypeState.onboarding?.time || '10 minutes par jour';
  }
  document.getElementById('profile-low-data').checked = Boolean(prototypeState.preferences.lowData);
  document.getElementById('profile-reminders').checked = Boolean(prototypeState.preferences.reminders);
  const count = prototypeState.events?.length || 0;
  document.getElementById('event-count').textContent = `${count} événement${count > 1 ? 's' : ''}`;

  const premium = prototypeState.membership?.plan === 'premium';
  document.getElementById('sidebar-plan').textContent = premium ? 'DDA Premium · Démo' : 'DDA Free';
  document.getElementById('membership-status').textContent = premium ? 'DDA Premium' : 'DDA Free';
  document.getElementById('free-plan-state').textContent = premium ? 'Inclus avec Premium' : 'Formule active';
  document.getElementById('preview-premium').hidden = premium;
  document.getElementById('revert-free').hidden = !premium;
  document.querySelector('.current-plan').classList.toggle('is-included', premium);
  document.querySelector('.premium-plan').classList.toggle('is-active', premium);
  document.querySelectorAll('.premium-gate').forEach(button => {
    button.textContent = premium ? 'Ouvrir l’atelier' : 'Voir l’aperçu Premium';
  });

  renderPathJourney();
  renderModulesRecap();

  document.getElementById('storage-warning').hidden = DDA.storageAvailable();
}

function showView(id, recordEvent = true) {
  const permission = viewPermissions[id];
  if (permission && !DDA.can(prototypeState, permission)) {
    prototypeState = DDA.track(prototypeState, 'access_denied', { view: id, permission });
    showToast('Crée d’abord ton espace pilote pour accéder à cette section.');
    id = 'access';
  }
  views.forEach(view => view.classList.toggle('active', view.id === id));
  [...desktopItems, ...mobileItems].forEach(item => item.classList.toggle('active', item.dataset.view === id));
  contextTitle.textContent = titles[id] || 'DDA';
  history.replaceState(null, '', `#${id}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (recordEvent) trackEvent('view_opened', { view: id });
}

buttons.forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));

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

let gateTrigger = null;
function closeGate() {
  const gate = document.getElementById('gate-layer');
  if (gate.hidden) return;
  gate.hidden = true;
  if (gateTrigger) { gateTrigger.focus(); gateTrigger = null; }
}
document.querySelectorAll('.premium-gate').forEach(button => button.addEventListener('click', () => {
  if (DDA.can(prototypeState, button.dataset.permission)) { showToast('Atelier Premium débloqué dans cette démonstration.'); return; }
  gateTrigger = button;
  document.getElementById('gate-layer').hidden = false;
  document.getElementById('gate-close').focus();
  prototypeState = DDA.track(prototypeState, 'access_denied', { permission: button.dataset.permission, plan: 'free' });
}));
document.getElementById('gate-close').addEventListener('click', closeGate);
document.getElementById('gate-layer').addEventListener('click', event => { if (event.target.id === 'gate-layer') closeGate(); });
document.getElementById('gate-preview').addEventListener('click', () => { closeGate(); showView('membership'); });

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!document.getElementById('gate-layer').hidden) closeGate();
  else if (!document.getElementById('resource-reader').hidden) closeReader();
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
  const market = document.getElementById('broker-market').value;
  const use = document.getElementById('broker-use').value;
  let visible = 0;
  document.querySelectorAll('.broker-card').forEach(card => {
    const matchMarket = market === 'all' || card.dataset.market.split(' ').includes(market);
    const matchUse = use === 'all' || card.dataset.use.split(' ').includes(use);
    card.hidden = !(matchMarket && matchUse);
    if (!card.hidden) visible += 1;
  });
  document.getElementById('broker-empty').hidden = visible > 0;
}
document.getElementById('broker-market').addEventListener('change', filterBrokers);
document.getElementById('broker-use').addEventListener('change', filterBrokers);
document.querySelectorAll('.broker-detail').forEach(button => button.addEventListener('click', () => showToast('Fiche complète différée jusqu’à vérification réglementaire.')));

document.getElementById('support-form').addEventListener('submit', event => {
  event.preventDefault();
  const message = document.getElementById('support-message').value.trim();
  if (!message) return;
  document.getElementById('support-note').textContent = 'Demande préparée localement. Le canal support sera connecté avant le lancement.';
  showToast('Brouillon de demande préparé — aucun envoi réel.');
});

document.getElementById('play-demo').addEventListener('click', event => {
  const caption = document.getElementById('video-caption');
  event.currentTarget.textContent = event.currentTarget.textContent === '▶' ? 'Ⅱ' : '▶';
  caption.textContent = event.currentTarget.textContent === 'Ⅱ' ? 'Démonstration visuelle — prototype sans vidéo finale' : 'Une décision commence par l’observation.';
});

document.getElementById('mark-understood').addEventListener('click', () => {
  const state = document.getElementById('saved-state');
  state.textContent = 'Compréhension marquée localement — aucune donnée envoyée';
  state.style.borderColor = '#58b88a';
  state.style.color = '#58b88a';
  document.getElementById('exercise-block').scrollIntoView({ behavior: 'smooth', block: 'start' });
  trackEvent('lesson_understood', { lesson: activeLessonId });
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
  setLoading(true);
  if (!prototypeState.preferences.lowData) await new Promise(resolve => setTimeout(resolve, 450));
  setLoading(false);
  showView('lesson');
});

function bindQuestion(lessonId, name, successText) {
  const group = document.querySelector(`[data-question="${name}"]`);
  const feedback = document.getElementById(`${name}-feedback`);
  group.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    if (group.closest('.locked-check')?.getAttribute('aria-disabled') === 'true') return;
    group.querySelectorAll('button').forEach(item => item.classList.remove('correct', 'incorrect'));
    const correct = button.dataset.correct === 'true';
    trackEvent(name === 'exercise' ? 'exercise_attempt' : 'quiz_attempt', { correct: String(correct), lesson: lessonId });
    button.classList.add(correct ? 'correct' : 'incorrect');
    feedback.textContent = correct ? successText : (button.dataset.feedback || 'Pas encore. Relis le principe, puis essaie à nouveau.');
    feedback.className = `feedback ${correct ? 'success' : 'error'}`;
    if (correct && name === 'exercise') {
      updateLessonState(lessonId, { exerciseComplete: true });
      trackEvent('exercise_complete', { lesson: lessonId });
      const quiz = document.getElementById('quiz-block');
      quiz.classList.remove('locked-check');
      quiz.setAttribute('aria-disabled', 'false');
      quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (correct && name === 'quiz') {
      updateLessonState(lessonId, { quizComplete: true });
      trackEvent('quiz_complete', { lesson: lessonId });
      const resultCard = document.getElementById('result-card');
      resultCard.hidden = false;
      resultCard.classList.add('just-completed');
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => resultCard.classList.remove('just-completed'), 900);
      document.getElementById('saved-state').textContent = 'Exercice et quiz validés localement — aucune donnée envoyée';
    }
  }));
}

bindQuestion(activeLessonId, activeLessonDef.practice.id, activeLessonDef.practice.successText);
bindQuestion(activeLessonId, activeLessonDef.evaluation.id, activeLessonDef.evaluation.successText);

function updateNetworkState() {
  const online = navigator.onLine;
  const status = document.getElementById('network-state');
  status.classList.toggle('offline', !online);
  status.querySelector('span').textContent = online ? 'En ligne' : 'Mode hors connexion';
}

document.getElementById('low-data-toggle').addEventListener('change', event => {
  saveState({ preferences: { ...prototypeState.preferences, lowData: event.currentTarget.checked } });
  trackEvent('preference_updated', { preference: 'lowData', enabled: String(event.currentTarget.checked) });
});

document.getElementById('low-data-button').addEventListener('click', () => {
  saveState({ preferences: { ...prototypeState.preferences, lowData: !prototypeState.preferences.lowData } });
  trackEvent('preference_updated', { preference: 'lowData', enabled: String(prototypeState.preferences.lowData) });
});

document.getElementById('resume-session').addEventListener('click', () => {
  showView(prototypeState.onboarding?.complete ? 'lesson' : 'access');
});

function resetPilot() {
  prototypeState = DDA.clear();
  document.getElementById('signup-form').reset();
  document.getElementById('signup-form').hidden = false;
  document.getElementById('onboarding-form').hidden = true;
  document.getElementById('result-card').hidden = true;
  renderState();
  showView('access', false);
  showToast('Données de démonstration effacées.');
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

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

renderState();
renderMarketIntelligence();

const initialView = location.hash.replace('#', '');
if (titles[initialView]) showView(initialView);
