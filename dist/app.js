const buttons = document.querySelectorAll('[data-view]');
const views = document.querySelectorAll('.view');
const desktopItems = document.querySelectorAll('.nav-item');
const mobileItems = document.querySelectorAll('.mobile-nav button');
const contextTitle = document.getElementById('context-title');
const lessonView = document.getElementById('lesson');
const activeLessonId = lessonView.dataset.lessonId || DDA.primaryLessonId;
const titles = { dashboard: 'Aujourd’hui', access: 'Accès pilote', path: 'Mon parcours', lesson: 'Leçon en cours', progress: 'Progression', resources: 'Ressources', markets: 'Marchés & BRVM', brokers: 'Broker Hub', membership: 'DDA Premium', support: 'Aide & support', profile: 'Mon profil' };
const viewPermissions = { path: 'path', lesson: 'lesson_m01', progress: 'progress', resources: 'resources_free', markets: 'market_room', brokers: 'broker_hub', membership: 'membership', support: 'support', profile: 'profile' };
const MODULE_STATUS_LABEL = { completed: 'Terminé', in_progress: 'En cours', available: 'Disponible', locked: 'Verrouillé', coming_soon: 'Prochainement' };
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

function renderPathList() {
  const container = document.getElementById('path-list');
  if (!container) return;
  container.innerHTML = DDA.curriculum.modules.map((module, index) => {
    const status = DDALearning.moduleStatus(DDA.curriculum, module.id, prototypeState);
    const renderable = isRenderableModule(module);
    const heading = renderable ? module.lessons[0]?.title || module.title : module.title;
    const summary = module.summary || module.lessons[0]?.summary || 'Contenu en préparation.';
    const number = String(index + 1).padStart(2, '0');
    const tag = renderable ? 'button' : 'article';
    const cls = `path-card ${renderable ? 'current' : 'locked'}`;
    const attrs = renderable ? ' data-view="lesson"' : '';
    return `<${tag} class="${cls}"${attrs}><span class="path-number">${number}</span><div><small>${moduleStatusLabel(status, renderable)}</small><h3>${heading}</h3><p>${summary}</p></div><span>${moduleActionLabel(status, renderable)}</span></${tag}>`;
  }).join('');
  container.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => showView(el.dataset.view)));
}

function renderModulesRecap() {
  const container = document.getElementById('modules-recap-list');
  if (!container) return;
  container.innerHTML = DDA.curriculum.modules.map(module => {
    const status = DDALearning.moduleStatus(DDA.curriculum, module.id, prototypeState);
    return `<li><span class="module-id">${module.id}</span><strong>${module.title}</strong><span class="module-pill ${status}">${MODULE_STATUS_LABEL[status] || status}</span></li>`;
  }).join('');
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
    document.getElementById('lesson-index-label').textContent = continueComplete ? 'COMPÉTENCE VALIDÉE' : 'LEÇON 1 SUR 7';
    document.getElementById('lesson-primary-action').innerHTML = continueComplete ? 'Revoir la leçon <span>→</span>' : 'Reprendre la leçon <span>→</span>';
  }

  document.getElementById('market-skill-label').textContent = activeLessonProgress.quizComplete ? 'Fondation validée' : activeLessonProgress.exerciseComplete ? 'En progression' : 'En démarrage';
  document.getElementById('market-skill-bar').style.width = `${progress}%`;

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

  const evalUnlocked = DDALearning.evaluationStatus(activeLessonProgress) !== DDALearning.STEP_STATUS.LOCKED;
  const quiz = document.getElementById('quiz-block');
  quiz.classList.toggle('locked-check', !evalUnlocked);
  quiz.setAttribute('aria-disabled', String(!evalUnlocked));

  document.getElementById('result-card').hidden = !complete;
  if (complete) document.getElementById('saved-state').textContent = 'Exercice et quiz validés localement — aucune donnée envoyée';

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

  renderPathList();
  renderModulesRecap();
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

document.querySelectorAll('.resource-open').forEach(button => button.addEventListener('click', () => {
  const resource = resources[button.dataset.resource];
  document.getElementById('reader-label').textContent = resource.label;
  document.getElementById('reader-title').textContent = resource.title;
  document.getElementById('reader-content').innerHTML = resource.body;
  document.getElementById('resource-reader').hidden = false;
  document.getElementById('resource-reader').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));
document.getElementById('reader-close').addEventListener('click', () => { document.getElementById('resource-reader').hidden = true; });

function closeGate() { document.getElementById('gate-layer').hidden = true; }
document.querySelectorAll('.premium-gate').forEach(button => button.addEventListener('click', () => {
  if (DDA.can(prototypeState, button.dataset.permission)) { showToast('Atelier Premium débloqué dans cette démonstration.'); return; }
  document.getElementById('gate-layer').hidden = false;
  prototypeState = DDA.track(prototypeState, 'access_denied', { permission: button.dataset.permission, plan: 'free' });
}));
document.getElementById('gate-close').addEventListener('click', closeGate);
document.getElementById('gate-layer').addEventListener('click', event => { if (event.target.id === 'gate-layer') closeGate(); });
document.getElementById('gate-preview').addEventListener('click', () => { closeGate(); showView('membership'); });
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
  const name = document.getElementById('first-name').value.trim();
  const email = document.getElementById('email').value.trim();
  const consent = document.getElementById('consent').checked;
  const error = document.getElementById('signup-error');
  if (!name || !email || !consent) { error.textContent = 'Complète les champs et confirme le stockage local.'; return; }
  error.textContent = '';
  saveState({ user: DDA.createUser(name, email) });
  event.currentTarget.hidden = true;
  document.getElementById('onboarding-form').hidden = false;
  document.getElementById('step-dot-2').classList.add('active');
});

document.getElementById('onboarding-form').addEventListener('submit', async event => {
  event.preventDefault();
  const level = document.getElementById('level').value;
  const goal = document.getElementById('goal').value;
  const time = document.getElementById('time').value;
  if (!level || !goal || !time) { document.getElementById('onboarding-error').textContent = 'Choisis les trois éléments du parcours.'; return; }
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
    feedback.textContent = correct ? successText : 'Pas encore. Relis le principe, puis essaie à nouveau.';
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

bindQuestion(activeLessonId, 'exercise', 'Correct. Tu reconnais le mécanisme fondamental de l’échange.');
bindQuestion(activeLessonId, 'quiz', 'Correct. La discipline du processus passe avant la précipitation.');

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
  const name = document.getElementById('profile-first-name').value.trim();
  if (!name) { document.getElementById('profile-error').textContent = 'Indique ton prénom.'; return; }
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

const initialView = location.hash.replace('#', '');
if (titles[initialView]) showView(initialView);
