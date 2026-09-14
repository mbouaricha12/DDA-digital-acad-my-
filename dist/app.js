// The lesson reader is data-driven: render the active lesson's markup into its
// mount points before anything below captures [data-view] buttons, so buttons
// generated inside the lesson (Quitter, Voir ma Progression, …) get bound too.
const activeLessonId = DDA.primaryLessonId;
const activeLessonMeta = DDALearning.findLesson(DDA.curriculum, activeLessonId);
const activeLessonDef = activeLessonMeta.lesson;
document.getElementById('lesson-main').insertAdjacentHTML('beforeend', DDALessonRenderer.renderLessonMain(activeLessonMeta.module, activeLessonDef));
document.getElementById('lesson-outline').innerHTML = DDALessonRenderer.renderLessonOutline(activeLessonDef);

// Golden Lesson #2 — Support & Résistance. Mounted exactly the way M0.1 is,
// with an 'm2' idSuffix so its ids never collide with M0.1's, proving the
// same renderer supports a second, independently-gated lesson unmodified.
const lessonM02Id = 'M0.2';
const lessonM02Meta = DDALearning.findLesson(DDA.curriculum, lessonM02Id);
const lessonM02Def = lessonM02Meta.lesson;
document.getElementById('lesson-m02-main').insertAdjacentHTML('beforeend', DDALessonRenderer.renderLessonMain(lessonM02Meta.module, lessonM02Def, 'm2'));
document.getElementById('lesson-m02-outline').innerHTML = DDALessonRenderer.renderLessonOutline(lessonM02Def, 'm2');
function findLessonBlock(lessonDef, id) { return lessonDef.blocks.find(b => b.id === id); }

const buttons = document.querySelectorAll('[data-view]');
const views = document.querySelectorAll('.view');
const desktopItems = document.querySelectorAll('.nav-item');
const mobileItems = document.querySelectorAll('.mobile-nav button');
const contextTitle = document.getElementById('context-title');
const titles = { dashboard: 'Aujourd’hui', access: 'Accès pilote', path: 'Mon parcours', lesson: 'Leçon en cours', 'lesson-m02': 'Support & Résistance', progress: 'Progression', journal: 'Journal & Plan', resources: 'Ressources', markets: 'Marchés & BRVM', brokers: 'Broker Hub', membership: 'DDA Premium', support: 'Aide & support', profile: 'Mon profil' };
const viewPermissions = { path: 'path', lesson: 'lesson_m01', 'lesson-m02': 'lesson_m01', progress: 'progress', journal: 'journal', resources: 'resources_free', markets: 'market_room', brokers: 'broker_hub', membership: 'membership', support: 'support', profile: 'profile' };
// M0.2 reuses the same `lesson_m01` free-tier entitlement — no separate premium
// tier is being introduced for it in this tranche, so no new key is invented.
// Maps a lesson id to the view that actually renders it — the Terminal cockpit's
// "continue" button follows DDALearning.nextActionable, which will point at
// M0.2 the moment M0.1's quiz is complete; without this map it would still say
// "Reprendre la leçon" but navigate to the now-completed M0.1 view instead.
const LESSON_VIEW_ID = { 'M0.1': 'lesson', 'M0.2': 'lesson-m02' };
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
  const rows = authoredLessons().map(({ lesson }) => {
    const lessonProgress = DDALearning.getLessonProgress(prototypeState, lesson.id);
    const level = competencyLevel(lesson.id, lessonProgress);
    const milestones = lessonProofMilestones(lesson.id).map(milestone => {
      const done = milestone.done(lessonProgress);
      const event = [...events].reverse().find(milestone.matches);
      const when = done ? (event ? relativeTime(event.at) : 'Complété') : 'À venir';
      const icon = done ? '<svg class="icon"><use href="#icon-check-circle"/></svg>' : '';
      return `<li class="${done ? 'done' : 'pending'}"><span class="proof-dot">${icon}</span><div><strong>${milestone.label}</strong><small>${when}</small></div></li>`;
    }).join('');
    return `
      <article class="mastery-row">
        <div class="mastery-row-head">
          <div><p class="mastery-lesson">${lesson.id} — ${lesson.title}</p><strong>${lesson.competency.label}</strong></div>
          <div class="mastery-level">
            <div class="terminal-thread-beads" role="img" aria-label="${beadsAriaLabel(level)}">${renderBeads(level)}</div>
            <span>${COMPETENCY_LEVEL_LABEL[level]}</span>
          </div>
        </div>
        <ol class="proof-timeline">${milestones}</ol>
      </article>`;
  }).join('');

  const unmeasured = ['Gestion du risque', 'Discipline'].map(label => `
      <article class="mastery-row unmeasured">
        <div class="mastery-row-head">
          <div><strong>${label}</strong></div>
          <div class="mastery-level"><span>Pas encore évalué</span></div>
        </div>
        <p class="mastery-unmeasured-note">DDA ne propose pas encore de leçon mesurant cette compétence.</p>
      </article>`).join('');

  container.innerHTML = rows + unmeasured;
}

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

function openJournalComposer(entry, trigger) {
  journalEditingId = entry ? entry.id : null;
  journalComposerTrigger = trigger || null;
  const fields = entry || DDA.emptyJournalEntry();
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

function resolveContinueTarget() {
  const next = DDALearning.nextActionable(DDA.curriculum, prototypeState);
  if (next) return next;
  const found = DDALearning.findLesson(DDA.curriculum, activeLessonId);
  return found ? { module: found.module, lesson: found.lesson } : null;
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
  if (!labelEl || !continueTarget) return;
  const lessonProgress = DDALearning.getLessonProgress(prototypeState, continueTarget.lesson.id);
  const level = competencyLevel(continueTarget.lesson.id, lessonProgress);
  labelEl.textContent = continueTarget.lesson.competency.label;
  const beadsEl = document.getElementById('terminal-thread-beads');
  beadsEl.innerHTML = renderBeads(level);
  beadsEl.setAttribute('aria-label', beadsAriaLabel(level));
  const after = lessonAfter(DDA.curriculum, continueTarget.lesson.id);
  const nextEl = document.getElementById('terminal-thread-next');
  const showNext = Boolean(after && after.lesson.competency.label !== continueTarget.lesson.competency.label);
  nextEl.hidden = !showNext;
  if (showNext) nextEl.innerHTML = `Prochaine compétence : <b>${after.lesson.competency.label}</b>`;
}

function renderTerminalMeta(continueTarget) {
  const stepEl = document.getElementById('terminal-meta-step');
  if (!stepEl || !continueTarget) return;
  const lessonProgress = DDALearning.getLessonProgress(prototypeState, continueTarget.lesson.id);
  const step = DDALearning.lessonNextStep(lessonProgress);
  stepEl.textContent = step === 'review' ? 'leçon terminée' : (NEXT_STEP_PHRASE[step] || '—');
  document.getElementById('terminal-meta-module').textContent = continueTarget.lesson.id;
  const xpKey = step === 'lesson' ? 'lessonViewed' : step === 'exercise' ? 'exerciseComplete' : step === 'quiz' ? 'quizComplete' : null;
  const nextXp = xpKey && continueTarget.lesson.xp ? continueTarget.lesson.xp[xpKey] : null;
  document.getElementById('terminal-meta-xp').textContent = nextXp ? `+${nextXp} XP` : '—';
}

// Reuses the same honest, structurally-labelled demo data as the full Markets screen —
// no new API, no new figures, same "Non connecté" badge and decorative sparkline path.
function renderTerminalMarketIntelligence() {
  const row = document.getElementById('terminal-mi-row');
  if (!row) return;
  row.innerHTML = MARKET_DEMO.indices.map(item => `
    <div class="terminal-mi-idx">
      <div class="top"><b>${item.label}</b><span class="badge"><svg class="icon"><use href="#icon-blocked"/></svg>Non connecté</span></div>
      <svg class="index-sparkline" viewBox="0 0 120 30" aria-hidden="true"><path d="M2 18 L22 18 L42 12 L62 20 L82 10 L102 16 L118 14"/></svg>
    </div>`).join('');
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
  if (!el || !continueTarget) return;
  const lessonProgress = DDALearning.getLessonProgress(prototypeState, continueTarget.lesson.id);
  const level = competencyLevel(continueTarget.lesson.id, lessonProgress);
  const rows = [
    { label: continueTarget.lesson.competency.label, real: true },
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
    el.textContent = 'Ton accès Premium est simulé sur cet appareil — ouvre l’atelier Ressources Premium ou l’aperçu de certification pour voir ce qu’il débloque réellement dès aujourd’hui.';
    return;
  }
  const next = DDALearning.nextActionable(DDA.curriculum, prototypeState);
  el.textContent = next
    ? `Continuer ${next.lesson.title} (${next.lesson.id}) sur DDA Free — Premium reste disponible en démonstration quand tu voudras l’explorer.`
    : 'Tu as validé les leçons disponibles sur DDA Free — simule l’accès Premium ci-dessus pour voir ce qu’il débloque dès aujourd’hui.';
}

function renderState() {
  const name = prototypeState.user?.name || 'Richard';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'RD';
  const activeLessonProgress = DDALearning.getLessonProgress(prototypeState, activeLessonId);
  const xp = DDALearning.totalXp(DDA.curriculum, prototypeState) || 20;
  const complete = Boolean(activeLessonProgress.quizComplete);
  const continueTarget = resolveContinueTarget();
  // The ring tracks whatever lesson the Terminal is actually pointing the learner to,
  // not the fixed primary lesson — otherwise it would freeze at 100% forever once M0.1
  // is done while M0.2 is genuinely in progress.
  const continueLessonProgress = continueTarget
    ? DDALearning.getLessonProgress(prototypeState, continueTarget.lesson.id)
    : activeLessonProgress;
  const progress = DDALearning.lessonProgressPercent(continueLessonProgress);

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
  document.getElementById('personalized-next').textContent = complete
    ? `${activeLessonId} est validée. Ton prochain module sera bientôt disponible.`
    : prototypeState.onboarding?.goal
      ? `Objectif : ${prototypeState.onboarding.goal}. Prochaine étape : terminer ${activeLessonId}.`
      : 'Une étape claire pour continuer à progresser.';

  if (continueTarget) {
    const continueComplete = continueLessonProgress.quizComplete;
    document.getElementById('lesson-state-pill').textContent = continueComplete ? 'Validée' : 'En cours';
    const lessonIndex = continueTarget.module.lessons.findIndex(l => l.id === continueTarget.lesson.id) + 1;
    document.getElementById('lesson-index-label').textContent = continueComplete ? 'COMPÉTENCE VALIDÉE' : `LEÇON ${lessonIndex} SUR ${continueTarget.module.lessons.length}`;
    document.getElementById('lesson-primary-action').innerHTML = continueComplete ? 'Revoir la leçon <span>→</span>' : 'Reprendre la leçon <span>→</span>';
    document.getElementById('lesson-primary-action').dataset.view = LESSON_VIEW_ID[continueTarget.lesson.id] || 'lesson';
    document.getElementById('terminal-lead-module').textContent = continueTarget.module.title;
    document.getElementById('terminal-lead-title').textContent = continueTarget.lesson.title;
    document.getElementById('terminal-lead-summary').textContent = continueTarget.lesson.summary;
  }
  renderTerminalThread(continueTarget);
  renderTerminalMeta(continueTarget);
  renderTerminalMarketIntelligence();
  renderTerminalJournalNote();
  renderTerminalSkillmap(continueTarget);

  renderMasteryList();
  renderProgressNextStep();
  renderProgressHero();
  renderCertificatePreview(activeLessonProgress);
  renderJournalList();
  renderJournalPlan();

  const journey = document.querySelector('.journey-button');
  journey.textContent = complete ? `Revoir ${activeLessonId}` : prototypeState.onboarding?.complete ? `Reprendre ${activeLessonId}` : 'Tester le parcours';
  journey.dataset.view = prototypeState.onboarding?.complete ? 'lesson' : 'access';

  renderLessonProgressUI(activeLessonId, activeLessonDef, {
    loopId: 'lesson-loop', outlineListId: 'lesson-outline-list', gateId: 'quiz-block', evalName: 'quiz',
    resultId: 'result-card', markUnderstoodId: 'mark-understood', savedStateId: 'saved-state', resultStatsId: 'result-stats'
  });
  renderLessonProgressUI(lessonM02Id, lessonM02Def, {
    loopId: 'lesson-loop-m2', outlineListId: 'lesson-outline-list-m2', gateId: 'm2-quiz-block', evalName: 'm2-quiz',
    resultId: 'result-card-m2', markUnderstoodId: 'mark-understood-m2', savedStateId: 'saved-state-m2', resultStatsId: 'result-stats-m2'
  });

  document.getElementById('resume-device').hidden = !prototypeState.user;
  document.getElementById('low-data-toggle').checked = Boolean(prototypeState.preferences.lowData);
  document.body.classList.toggle('low-data', Boolean(prototypeState.preferences.lowData));
  const dataButton = document.getElementById('low-data-button');
  dataButton.textContent = prototypeState.preferences.lowData ? 'Data réduite' : 'Data normale';
  dataButton.setAttribute('aria-pressed', String(Boolean(prototypeState.preferences.lowData)));

  const premium = prototypeState.membership?.plan === 'premium';
  const hasProfile = Boolean(prototypeState.user);
  document.getElementById('profile-form').hidden = !hasProfile;
  document.querySelector('.preference-panel').hidden = !hasProfile;
  document.getElementById('empty-profile').hidden = hasProfile;
  if (hasProfile) {
    document.getElementById('profile-large-avatar').textContent = initials;
    document.getElementById('profile-heading-name').textContent = name;
    document.getElementById('profile-heading-email').textContent = prototypeState.user.email || 'Compte local';
    document.getElementById('profile-plan-badge').textContent = premium ? 'DDA Premium · Démo' : 'DDA Free';
    document.getElementById('profile-first-name').value = name;
    document.getElementById('profile-level').value = prototypeState.onboarding?.level || 'Débutant';
    document.getElementById('profile-goal').value = prototypeState.onboarding?.goal || 'Comprendre les marchés';
    document.getElementById('profile-time').value = prototypeState.onboarding?.time || '10 minutes par jour';
  }
  document.getElementById('profile-low-data').checked = Boolean(prototypeState.preferences.lowData);
  document.getElementById('profile-reminders').checked = Boolean(prototypeState.preferences.reminders);
  const count = prototypeState.events?.length || 0;
  document.getElementById('event-count').textContent = `${count} événement${count > 1 ? 's' : ''}`;

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
  renderMembershipNextStep(premium);

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
  document.body.classList.toggle('lesson-focus', id === 'lesson' || id === 'lesson-m02');
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
document.querySelectorAll('.broker-detail').forEach(button => button.addEventListener('click', () => showToast('Fiche complète différée jusqu’à vérification réglementaire.')));

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

document.getElementById('play-demo').addEventListener('click', event => {
  const caption = document.getElementById('video-caption');
  event.currentTarget.textContent = event.currentTarget.textContent === '▶' ? 'Ⅱ' : '▶';
  caption.textContent = event.currentTarget.textContent === 'Ⅱ' ? 'Démonstration visuelle — prototype sans vidéo finale' : 'Une décision commence par l’observation.';
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

bindMarkUnderstood(activeLessonId, { buttonId: 'mark-understood', savedStateId: 'saved-state', scrollToId: 'exercise-block' });
bindMarkUnderstood(lessonM02Id, { buttonId: 'mark-understood-m2', savedStateId: 'saved-state-m2', scrollToId: 'm2-observe-4-block' });

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
      updateLessonState(lessonId, { quizComplete: true });
      trackEvent('quiz_complete', { lesson: lessonId });
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

bindQuestion(activeLessonId, { role: 'exercise', name: activeLessonDef.practice.id, successText: activeLessonDef.practice.successText });
bindQuestion(activeLessonId, { role: 'quiz', name: activeLessonDef.evaluation.id, successText: activeLessonDef.evaluation.successText });

// Golden Lesson #2 — Support & Résistance. Phases B/D/E/F are practice reasoning
// checks (no gating role: they only ever show explanatory feedback). Phase G's
// zone identification is the exercise gate; its short comprehension question is
// the quiz gate — the same two-gate shape as M0.1, mirrored on purpose.
const m2Identify1 = findLessonBlock(lessonM02Def, 'm2-identify-1');
const m2Identify2 = findLessonBlock(lessonM02Def, 'm2-identify-2');
const m2MythLine = findLessonBlock(lessonM02Def, 'm2-myth-line');
const m2SpotError = findLessonBlock(lessonM02Def, 'm2-spot-error');
const m2Challenge = findLessonBlock(lessonM02Def, 'm2-challenge-zone');
const m2QuizBlock = findLessonBlock(lessonM02Def, 'm2-quiz');

bindQuestion(lessonM02Id, { role: 'practice', name: m2Identify1.id, successText: m2Identify1.successText }, { revealId: `${m2Identify1.id}-reveal` });
bindQuestion(lessonM02Id, { role: 'practice', name: m2Identify2.id, successText: m2Identify2.successText }, { revealId: `${m2Identify2.id}-reveal` });
bindQuestion(lessonM02Id, { role: 'practice', name: m2MythLine.id, successText: 'Bonne lecture.' });
bindQuestion(lessonM02Id, { role: 'practice', name: m2SpotError.id, successText: 'Bon réflexe critique.' });
bindQuestion(lessonM02Id, { role: 'exercise', name: m2Challenge.id, successText: m2Challenge.successText }, { gateId: 'm2-quiz-block', revealId: `${m2Challenge.id}-reveal` });
bindQuestion(lessonM02Id, { role: 'quiz', name: m2QuizBlock.data.id, successText: m2QuizBlock.data.successText }, { resultId: 'result-card-m2', savedStateId: 'saved-state-m2' });

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
  document.getElementById('result-card-m2').hidden = true;
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
