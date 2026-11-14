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
const DDA_VISIBLE_LESSON_TITLES = Object.freeze({
  'M0.1': 'Leçon en cours — Le trading comme commerce',
  'M0.2': 'Support & Résistance — Identifier les zones de support et de résistance',
  'M0.3': 'Lire une tendance — Comprendre les tendances du marché',
  'M1.1': 'Pourquoi les prix évoluent ? — Comprendre la formation des prix',
  'M1.2': 'Comment les ordres s’exécutent ? — Comprendre l’exécution des ordres',
  'M1.3': 'Comment les marchés s’organisent ? — Découvrir les acteurs des marchés financiers',
  'MBRVM.1': 'Introduction à la BRVM',
  'P2.1': 'Définir son risque avant une décision',
  'P2.2': 'Construire une décision maîtrisée'
});
function displayLessonTitle(id, fallback = '') {
  return DDA_VISIBLE_LESSON_TITLES[id] || fallback || 'Leçon';
}
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
    // Vidéo réelle du VIDEO_REGISTRY (mandat §5, P1.3) : correspondance directe
    // avec le sujet de cette leçon.
    video: 'VID-SUPPORTS-RESISTANCES',
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
    // Vidéo réelle du VIDEO_REGISTRY (mandat §5, P1.3) : les moyennes mobiles
    // sont un outil courant de lecture de tendance, cohérent avec cette leçon.
    video: 'VID-MOYENNES-MOBILES',
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
    // MBRVM.1 est authored dans son propre fichier (mbrvm-1-lesson.js) et
    // promue dans le curriculum par dda-core.js quand ce fichier est chargé.
    // Domaine indépendant (mandat §6) : aucun `prerequisite` — accessible dès
    // qu'un apprenant Free ouvre #markets, sans dépendre de M0/M1 ni de
    // Premium.
    id: 'MBRVM.1', viewId: 'lesson-mbrvm1', suffix: 'mbrvm1', title: 'Introduction à la BRVM',
    permission: 'lesson_m01', independent: true,
    quizBlock: 'mbrvm1-quiz', understoodScrollTo: 'mbrvm1-exercise-case-block',
    questions: [
      { role: 'practice', block: 'mbrvm1-identify-action', success: 'Bonne distinction : une action est une part de propriété.' },
      { role: 'practice', block: 'mbrvm1-identify-bond', success: 'Bonne distinction : une obligation est un prêt avec échéance.' },
      { role: 'practice', block: 'mbrvm1-cap-check', success: 'Bonne lecture de la formule de capitalisation.' },
      { role: 'exercise', block: 'mbrvm1-exercise', success: '@practice', gate: true },
      { role: 'quiz', block: 'mbrvm1-quiz', success: '@data', result: true }
    ]
  },
  {
    id: 'P2.1', viewId: 'lesson-p21', suffix: 'p21', title: 'Le risque avant l’entrée',
    permission: 'premium_track', quizBlock: 'p21-quiz', understoodScrollTo: 'p21-decision-block',
    // Aperçu gratuit du module Premium Track (mandat §5) : cette leçon reste
    // lisible sans Premium — showView() laisse passer un apprenant Free ici
    // malgré le `permission: 'premium_track'` ci-dessus.
    preview: true, duration: 15, objectives: ['Identifier le risque avant d’entrer en position', 'Distinguer une entrée réfléchie d’une entrée impulsive'],
    premiumReason: 'Premium donne accès au Risk Plan Lab et à l’assessment Controlled Decision qui prolongent cette leçon par la pratique guidée.',
    questions: [
      { role: 'exercise', block: 'p21-decision', success: '@practice' },
      { role: 'quiz', block: 'p21-quiz', success: '@data', result: true }
    ]
  },
  {
    id: 'P2.2', viewId: 'lesson-p22', suffix: 'p22', title: 'L’anatomie d’un trade contrôlé', prerequisite: 'P2.1',
    permission: 'premium_track', quizBlock: 'p22-quiz', understoodScrollTo: 'p22-sequence-block',
    duration: 18, objectives: ['Décomposer un trade contrôlé en ses étapes', 'Relier chaque étape à une condition de non-trade'],
    premiumReason: 'Premium donne accès au Risk Plan Lab et à l’assessment Controlled Decision qui prolongent cette leçon par la pratique guidée.',
    questions: [
      { role: 'exercise', block: 'p22-sequence', success: '@practice' },
      { role: 'quiz', block: 'p22-quiz', success: '@data', result: true }
    ]
  }
]);

/* ==========================================================================
   VIDEO REGISTRY — bibliothèque vidéo DDA. Ajouter une vidéo = une entrée
   ici, rien d'autre : la Bibliothèque DDA (#resources) se construit à partir
   de ce tableau (renderVideoShelf), aucune modification de academy.html
   n'est nécessaire pour publier une nouvelle vidéo. Une entrée LESSON_REGISTRY
   peut aussi référencer un id de ce registre via son champ `video` (P1.3) :
   mountLesson() l'injecte alors dans la leçon via le lecteur léger existant
   (lesson-renderer.js, renderYouTubeLite — jamais modifié pour ça).
   `video_visibility` distingue une vidéo YouTube publique ou non répertoriée
   (acquisition / apprentissage Free — jamais du contenu Premium protégé)
   d'un contenu hébergé et protégé côté serveur (`protected_host`, pas encore
   utilisé). `preview: true` marque un aperçu gratuit d'un module Premium.
   Durées non communiquées par le fondateur : volontairement omises plutôt
   qu'inventées.
   ========================================================================== */
const VIDEO_REGISTRY = Object.freeze([
  {
    id: 'VID-INDICATEURS', title: 'Les indicateurs en trading', module: null,
    level: 'débutant', type: 'video', access: 'free', duration: null, status: 'publié',
    video_visibility: 'public_youtube', preview: false,
    url: 'https://youtube.com/shorts/BTipx88k_U8',
    description: 'Un premier repère pour comprendre à quoi servent les indicateurs techniques.'
  },
  {
    id: 'VID-MOYENNES-MOBILES', title: 'Les moyennes mobiles en trading', module: null,
    level: 'débutant', type: 'video', access: 'free', duration: null, status: 'publié',
    video_visibility: 'public_youtube', preview: false,
    url: 'https://youtube.com/shorts/rVd4dF6JaZ4',
    description: 'Ce que mesure une moyenne mobile, et pourquoi elle lisse le prix plutôt que de le prédire.'
  },
  {
    id: 'VID-VOLATILITE-FOREX', title: 'La volatilité sur le Forex', module: null,
    level: 'débutant', type: 'video', access: 'free', duration: null, status: 'publié',
    video_visibility: 'public_youtube', preview: false,
    url: 'https://youtube.com/shorts/HaP-Onie9Lc',
    description: 'Comprendre pourquoi certaines paires de devises bougent plus vite que d’autres.'
  },
  {
    id: 'VID-CRYPTOMONNAIES', title: 'Comprendre les cryptomonnaies', module: null,
    level: 'débutant', type: 'video', access: 'free', duration: null, status: 'publié',
    video_visibility: 'public_youtube', preview: false,
    url: 'https://youtube.com/shorts/yBNc_eQbiow',
    description: 'Les bases pour situer les cryptomonnaies parmi les actifs étudiés dans DDA.'
  },
  {
    id: 'VID-TYPES-DE-TRADERS', title: 'Les types de traders', module: null,
    level: 'débutant', type: 'video', access: 'free', duration: null, status: 'publié',
    video_visibility: 'public_youtube', preview: false,
    url: 'https://youtube.com/shorts/bVJ9n-Etcpc',
    description: 'Les grandes familles de traders selon leur horizon de temps, pour situer ses propres repères.'
  },
  {
    id: 'VID-SUPPORTS-RESISTANCES', title: 'Supports et résistances', module: 'M0.2',
    level: 'débutant', type: 'video', access: 'free', duration: null, status: 'publié',
    video_visibility: 'public_youtube', preview: false,
    url: 'https://youtube.com/shorts/pRFqhk55bL4',
    description: 'Ce qu’est un niveau de support ou de résistance, et pourquoi le prix y réagit souvent.'
  },
  {
    id: 'VID-BOUGIES-JAPONAISES', title: 'Les bougies japonaises', module: null,
    level: 'débutant', type: 'video', access: 'free', duration: null, status: 'publié',
    video_visibility: 'public_youtube', preview: false,
    url: 'https://youtube.com/shorts/WDifN6ZKnjY',
    description: 'Comment lire une bougie japonaise — ouverture, clôture, plus haut et plus bas d’une période.'
  },
  {
    id: 'VID-MARCHE-DES-DEVISES', title: 'Le marché des devises', module: null,
    level: 'débutant', type: 'video', access: 'free', duration: null, status: 'publié',
    video_visibility: 'public_youtube', preview: false,
    url: 'https://youtube.com/shorts/bUHsQnIAFuc',
    description: 'Comment fonctionne le marché des devises (Forex) et qui y échange.'
  }
]);

// L’état est chargé avant le montage afin que les leçons Premium authored ne
// soient jamais injectées dans le DOM d’un utilisateur Free.
let prototypeState = window.DDABFF?.enabled()
  ? (DDA.setStorageScope(null) || DDA.load())
  : DDA.load();
let remoteUser = null;
let bffAuthMode = 'signup';
function progressImportMarkerKey(userId) {
  return userId ? `dda-progress-import-v1:user:${encodeURIComponent(userId)}` : '';
}
function hasImportedUnscopedProgress(userId) {
  const key = progressImportMarkerKey(userId);
  if (!key) return false;
  try { return localStorage.getItem(key) === 'done'; } catch { return false; }
}
// Last successful signup's credentials, kept only in memory for this page
// load — never persisted — so the "resend confirmation" action (signup
// reliability audit, P0 2026-11) can reuse them without asking the learner
// to retype the whole form.
let lastSignupAttempt = null;

// Protection Premium côté serveur (mandat §7.3, P1.1). `prototypeState.
// membership.plan` is a local, learner-editable value — it must stay the
// only gate in the local pilot (no BFF configured), exactly as before. As
// soon as a BFF is configured, the server's own entitlement check
// (/v1/premium/preview, already real and already enforced server-side)
// becomes the ONLY authority for 'premium_track': null = not yet checked
// (fails closed, same as false), true = server confirmed an active Premium
// entitlement. Never persisted — always re-derived at boot/login.
// Deliberately NOT conditioned on `remoteUser`: the very first showView()
// call for a deep-linked view runs synchronously, before
// hydrateRemoteSession() has had a chance to resolve and set it — gating on
// `remoteUser` here would silently fall back to the local, learner-editable
// plan for exactly that first render, reopening the exploit this exists to
// close. Before any session is confirmed, BFF-configured mode simply has no
// Premium content to show (serverPremiumConfirmed starts null → false),
// which is correct: nothing server-authorized has been seen yet either way.
let serverPremiumConfirmed = null;
function canUnlock(permission) {
  if (permission === 'premium_track' && window.DDABFF?.enabled()) {
    return serverPremiumConfirmed === true;
  }
  return DDA.can(prototypeState, permission);
}
async function refreshServerPremiumEntitlement() {
  if (!window.DDABFF?.enabled() || !remoteUser) { serverPremiumConfirmed = null; return; }
  serverPremiumConfirmed = await window.DDABFF.hasServerPremiumEntitlement();
  // Lot 2 (mandate §6 audit): P2.2/LAB4/LABCAP's real content is never
  // shipped to the browser until the server has actually confirmed this —
  // fetch it now, before mounting anything, so mountPremiumLessons()/
  // mountPremiumLabLessons() below never render a half-loaded or empty
  // Premium lesson. A Free learner (serverPremiumConfirmed !== true) never
  // reaches this fetch for P2.2/LAB4/LABCAP; P2.1's own free-preview fetch
  // already happened independently when p2-lessons.js first loaded.
  if (serverPremiumConfirmed === true) {
    if (!window.DDAP2Lessons?.p22 && typeof window.DDAReloadPremiumLessonContent === 'function') {
      await window.DDAReloadPremiumLessonContent();
      window.DDA?.refreshCurriculum?.();
      mountedLessons = LESSON_REGISTRY
        .map(entry => ({ ...entry, meta: DDALearning.findLesson(DDA.curriculum, entry.id) }))
        .filter(entry => entry.meta);
    }
    await ensureLabPremiumContentLoaded();
  }
  // Both of these now also show the honest "temporarily unavailable"
  // message themselves (see their own comments) when canUnlock is true but
  // the real content's fetch failed — never a silently blank lesson.
  mountPremiumLessons();
  mountPremiumLabLessons();
  renderState();
  // A deep-link opened the honest paywall before this server check resolved
  // (canUnlock fails closed on the initial null). If the server just
  // confirmed a real entitlement, finish what the learner actually asked
  // for instead of leaving them stuck on the gate they never chose.
  if (serverPremiumConfirmed === true && pendingGatedView) {
    const target = pendingGatedView;
    closeGate();
    showView(target);
  }
}

// Résolution runtime du registre contre le curriculum réel : une leçon
// déclarée mais absente du curriculum (fichier authored non chargé) n'est pas
// montée — les boucles ci-dessous ne consomment que mountedLessons.
let mountedLessons = LESSON_REGISTRY
  .map(entry => ({ ...entry, meta: DDALearning.findLesson(DDA.curriculum, entry.id) }))
  .filter(entry => entry.meta);

const activeLessonId = DDA.primaryLessonId;
const activeLessonMeta = DDALearning.findLesson(DDA.curriculum, activeLessonId);
const activeLessonDef = activeLessonMeta.lesson;

// Lesson Tabs (founder mandate, done this pass — PR #205/#206 deliberately
// deferred it). `scope` is the `${viewId}-main` element a lesson's markup was
// mounted into: it holds both the [data-lesson-tab] buttons and the
// [data-lesson-panel] panels lesson-renderer.js now emits (see its
// renderLessonMain comment). Switching is purely a `hidden` toggle — nothing
// is ever unmounted, so every existing scroll anchor, [data-question] group
// and locked-check gate still exists in the DOM exactly where it always has.
function activateLessonTab(scope, name) {
  if (!scope) return;
  scope.querySelectorAll('[data-lesson-tab]').forEach(tab => {
    const active = tab.dataset.lessonTab === name;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    tab.classList.toggle('is-active', active);
  });
  scope.querySelectorAll('[data-lesson-panel]').forEach(panel => {
    panel.hidden = panel.dataset.lessonPanel !== name;
  });
}
function bindLessonTabs(main) {
  const tabs = main?.querySelectorAll('[data-lesson-tab]');
  if (!tabs || !tabs.length) return;
  tabs.forEach(tab => tab.addEventListener('click', () => activateLessonTab(main, tab.dataset.lessonTab)));
}
// Every programmatic "scroll a learner to this lesson block" call in this
// file (the mark-understood anchor, the exercise→quiz gate reveal, the quiz
// result card, the module sidecard's "Aller au quiz" shortcut) now has to
// open that block's tab first if it is the inactive one — a scrollIntoView
// on a `hidden` element has no box to scroll to. This is the single place
// that does it: callers that used to do
// `document.getElementById(id)?.scrollIntoView(...)` now do
// `revealLessonAnchor(id)?.scrollIntoView(...)`, with identical behavior for
// any target that isn't inside a lesson tab panel (most of the app).
function revealLessonAnchor(idOrElement) {
  const el = typeof idOrElement === 'string' ? document.getElementById(idOrElement) : idOrElement;
  if (!el) return null;
  const panel = el.closest('[data-lesson-panel]');
  if (panel && panel.hidden) activateLessonTab(panel.parentElement, panel.dataset.lessonPanel);
  return el;
}

// The lesson reader is data-driven: render each lesson's markup into its mount
// points only when its local entitlement allows it. Premium lessons are
// mounted later when the local demo is activated, before their interactions
// are bound. Une seule boucle pour toutes les leçons — plus de bloc copié.
function mountLesson(entry) {
  const main = document.getElementById(`${entry.viewId}-main`);
  const outline = document.getElementById(`${entry.viewId}-outline`);
  if (!main || !outline || main.dataset.ddaLessonMounted === 'true') return;
  // The content fetch behind this entry may have failed on an earlier
  // attempt and already shown the honest "temporarily unavailable" message
  // (renderPremiumContentUnavailable) — real content has now actually
  // arrived, so clear that message before mounting it.
  if (main.dataset.ddaPremiumUnavailable === 'true') {
    main.querySelector('.lesson-premium-unavailable')?.remove();
    delete main.dataset.ddaPremiumUnavailable;
  }
  const suffix = entry.suffix || undefined;
  main.insertAdjacentHTML('beforeend', DDALessonRenderer.renderLessonMain(entry.meta.module, entry.meta.lesson, suffix));
  // academy.html gives .lesson-outline a static, empty [data-sidecard-slot]
  // child (the mount point renderLessonSidecard fills) — preserve it instead
  // of wiping it out with the lesson's own "Dans cette leçon" outline below.
  const sidecardSlot = outline.querySelector('[data-sidecard-slot]');
  outline.innerHTML = (sidecardSlot ? sidecardSlot.outerHTML : '') + DDALessonRenderer.renderLessonOutline(entry.meta.lesson, suffix);
  // P1.3 : une leçon peut référencer une vidéo réelle du VIDEO_REGISTRY par
  // son id (champ `video`). Rendue avec le lecteur léger déjà utilisé par la
  // Bibliothèque (#resources) — miniature, clic pour charger, pas d'autoplay
  // — sans aucune modification de lesson-renderer.js.
  //
  // Lot D (founder mockup — lesson player): the mockup puts this same player
  // in a dominant hero position at the very top of the lesson view, above
  // the title/stepper/tabs — not buried inside the "À propos de la leçon"
  // panel's text, where it used to sit (PR #205/#206). This moves the
  // mount point only: the anchor is now the lesson's own leading
  // `.eyebrow.gold` line (the first element renderLessonMain emits — see
  // lesson-renderer.js), so the player lands right below the breadcrumb/
  // progress head and .lesson-quick-nav/.module-toc that already sit above
  // it in academy.html, and above eyebrow/h1/lesson-loop/tabs. It stays the
  // exact same component (renderYouTubeLite — lesson-renderer.js is still
  // never touched for this), wrapped in `.lesson-video-hero` purely for
  // hero-sized CSS (styles.css) — no new markup, no second player, no
  // duplicate mount. A lesson with no `video` field renders nothing here:
  // never a fake/empty hero placeholder for the 7 of 9 lessons without a
  // real VIDEO_REGISTRY entry.
  if (entry.video) {
    const video = VIDEO_REGISTRY.find(v => v.id === entry.video);
    const heroAnchor = main.querySelector('.eyebrow.gold') || main.querySelector('.lesson-loop');
    if (video && heroAnchor) {
      // Overlay key points: the same "Dans cette leçon" outline beats already
      // authored for this lesson (lesson.blocks[].outline) and already shown
      // elsewhere on the page — never a separate, invented list. Capped to
      // the pre-exercise beats so the overlay previews the lesson, never the
      // exercise/quiz answers.
      const outlinePoints = (entry.meta.lesson.blocks || [])
        .filter(block => block.outline && block.step === 'lesson')
        .map(block => block.outline);
      const overlay = outlinePoints.length ? { title: entry.meta.lesson.title, points: outlinePoints } : null;
      const videoMarkup = DDALessonRenderer.renderYouTubeLite(video, `lesson-video-${entry.id}`, overlay);
      const reservedHero = main.querySelector('.lesson-hero-media');
      if (reservedHero) {
        reservedHero.classList.add('lesson-video-hero');
        reservedHero.innerHTML = videoMarkup;
      } else {
        heroAnchor.insertAdjacentHTML('beforebegin', `<div class="lesson-video-hero">${videoMarkup}</div>`);
      }
    }
  }
  bindLessonTabs(main);
  main.querySelectorAll('[data-video-frame], .video-frame video').forEach(media => {
    media.addEventListener('error', () => {
      const surface = media.closest('.video-explainer-block');
      const fallback = surface?.querySelector('[data-video-fallback]');
      if (!surface || !fallback) return;
      surface.dataset.videoState = 'error';
      media.hidden = true;
      fallback.hidden = false;
    }, { once: true });
  });
  if (entry.id === 'M0.2') main.insertAdjacentHTML('beforeend', '<section class="lesson-practice-handoff"><p class="eyebrow gold">Après la leçon</p><h3>Mettre la lecture en pratique</h3><p>Ouvre une mission guidée dans le Terminal pour repérer une zone sans chercher un prix exact.</p><button type="button" class="secondary-action" data-practice-launch="M0.2">Lancer la mission Practice <span>→</span></button></section>');
  if (entry.id === 'P2.2') main.insertAdjacentHTML('beforeend', '<section class="lesson-practice-handoff premium-handoff"><p class="eyebrow gold">Après les leçons</p><h3>Practice Lab — Build the Risk Plan</h3><p>Construis un plan dans un scénario pédagogique synthétique, puis fais vérifier ta décision.</p><button type="button" class="secondary-action" data-view="premium-lab">Ouvrir le Practice Lab <span>→</span></button></section>');
  main.dataset.ddaLessonMounted = 'true';
}
// Lot 2 (mandate §6 audit): a Premium lesson's real content now arrives
// from the authenticated BFF, never embedded in this public bundle. A
// learner can reach this point with `canUnlock('premium_track')` true but
// the content genuinely missing in exactly two honest cases: a local/pilot
// session with no BFF configured (there is no server left to fetch real
// content from — the old "embed it anyway" fallback is exactly the leak
// this fix closes, so it is no longer available here either) or a
// server-confirmed Premium learner whose content fetch itself failed
// (network/BFF outage). Both get this same honest message — never a
// fabricated placeholder that would resemble the real lesson, and never a
// silently blank view.
function renderPremiumContentUnavailable(viewId, title) {
  const main = document.getElementById(`${viewId}-main`);
  if (!main || main.dataset.ddaLessonMounted === 'true' || main.dataset.ddaPremiumUnavailable === 'true') return;
  main.dataset.ddaPremiumUnavailable = 'true';
  const reason = window.DDABFF?.enabled()
    ? 'Nous n’avons pas pu charger le contenu réel de cette leçon Premium depuis le serveur. Réessaie dans un instant.'
    : 'Cette leçon Premium nécessite une connexion au serveur DDA pour charger son contenu réel, qui n’est plus jamais inclus dans l’application elle-même.';
  main.insertAdjacentHTML('beforeend', `<section class="lesson-premium-unavailable"><p class="eyebrow gold">Contenu Premium</p><h2>${title ? `${title} est ` : ''}temporairement indisponible</h2><p>${reason}</p><button type="button" class="secondary-action" data-view="path">Retour à mon parcours</button></section>`);
  main.querySelectorAll('[data-view]').forEach(bindViewButton);
}
mountedLessons.forEach(entry => {
  if (entry.permission === 'premium_track' && !canUnlock('premium_track')) return;
  mountLesson(entry);
});
LESSON_REGISTRY.filter(entry => entry.permission === 'premium_track' && !mountedLessons.some(m => m.id === entry.id)).forEach(entry => {
  if (canUnlock('premium_track')) renderPremiumContentUnavailable(entry.viewId, entry.title);
});
function refreshMountedLessons() {
  mountedLessons = LESSON_REGISTRY
    .map(entry => ({ ...entry, meta: DDALearning.findLesson(DDA.curriculum, entry.id) }))
    .filter(entry => entry.meta);
  mountedLessons.forEach(entry => {
    if (entry.permission === 'premium_track' && !canUnlock('premium_track')) return;
    const main = document.getElementById(`${entry.viewId}-main`);
    const wasMounted = main?.dataset.ddaLessonMounted === 'true';
    mountLesson(entry);
    if (!wasMounted) bindRegistryQuestions(entry);
  });
  LESSON_REGISTRY.filter(entry => entry.permission === 'premium_track' && !mountedLessons.some(m => m.id === entry.id)).forEach(entry => {
    if (canUnlock('premium_track')) renderPremiumContentUnavailable(entry.viewId, entry.title);
  });
  // DDA Lab (Lot 1, mandate §6 audit): dda-lab.js is now lazy-loaded via the
  // "ailab" group, so window.DDALab may only just have become available —
  // (re)build its registry and mount/bind what it unlocks. Both calls are
  // idempotent no-ops once already done (see their own comments above).
  mountLabTrack();
  mountPremiumLabLessons();
  renderState();
  if (window.DDAMarketIntelligence) {
    renderMarketIntelligence();
    renderTerminalMarketIntelligence();
  }
}
window.DDA_LAZY_REFRESH = refreshMountedLessons;
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
    const targetView = button.dataset.view;
    const lazy = window.DDALazyModules;
    if (lazy?.needs(targetView) && !lazy.isReady(targetView)) {
      lazy.ensure(targetView).then(() => showView(targetView)).catch(error => {
        console.error(error);
        showToast('Cette section est momentanément indisponible.');
      });
    } else {
      showView(targetView);
    }
    if (button.dataset.scrollTo) {
      requestAnimationFrame(() => revealLessonAnchor(button.dataset.scrollTo)?.scrollIntoView({
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
const contextSection = document.getElementById('context-section');

// The sidebar's "Academy" nav section (founder reference maquette: Mes
// Parcours/Mes Leçons/Exercices & Quiz/Ressources/Certificats grouped and
// collapsible) — opens expanded by default on both the desktop rail and the
// mobile drawer (matching the maquette), [data-view] routing on its real
// nav-items underneath is untouched; this only toggles visibility + the
// chevron, purely presentational, one real DOM id per rail so desktop and
// drawer collapse independently.
['nav-academy', 'drawer-academy'].forEach(prefix => {
  const toggle = document.getElementById(`${prefix}-toggle`);
  const group = document.getElementById(`${prefix}-group`);
  if (!toggle || !group) return;
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') !== 'false';
    toggle.setAttribute('aria-expanded', String(!expanded));
    group.hidden = expanded;
  });
});

// Mobile drawer — the sidebar's full navigation, reachable on mobile where
// .sidebar itself stays display:none. Routing is already handled by the
// generic [data-view] binding above; this only opens/closes the panel.
(function initMobileDrawer() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  const closeButton = document.getElementById('mobile-drawer-close');
  if (!toggle || !drawer || !backdrop) return;
  function close() {
    drawer.hidden = true;
    backdrop.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }
  function open() {
    drawer.hidden = false;
    backdrop.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
  }
  toggle.addEventListener('click', () => (drawer.hidden ? open() : close()));
  closeButton?.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  drawer.addEventListener('click', event => { if (event.target.closest('[data-view]')) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !drawer.hidden) close(); });
})();

// Mobile header overlap fix: .topbar is sticky at a fixed offset equal to
// the prototype banner's single-line height (29px). The banner's disclosure
// copy is long enough to wrap to two lines on narrow phones (~360-400px),
// which made the sticky topbar overlap/clip the banner's second line and,
// because both are position:sticky stacked by a hardcoded pixel offset, the
// topbar's own content (brand, context title) then rendered partly hidden
// behind the banner — the "header dégradé" bug reported on real devices.
// Measuring the banner's real rendered height and exposing it as a CSS
// custom property keeps the two elements correctly stacked at any width,
// font-scaling or text-wrap, instead of guessing a constant.
(function syncBannerHeight() {
  const banner = document.querySelector('.prototype-banner');
  if (!banner) return;
  function sync() {
    document.documentElement.style.setProperty('--banner-h', `${Math.ceil(banner.getBoundingClientRect().height)}px`);
  }
  sync();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(sync).observe(banner);
  } else {
    window.addEventListener('resize', sync);
  }
})();

// Topbar notifications bell: no notification system exists yet, so it must
// never look like it holds something unread. Clicking it gives an honest,
// visible answer instead of doing nothing.
(function initNotificationsBell() {
  const bell = document.querySelector('.topbar [aria-label="Notifications"]');
  if (!bell) return;
  bell.addEventListener('click', () => showToast('Aucune notification pour le moment.'));
})();

// Header search: filters the existing sidebar navigation by its real label
// text — never a fake/unwired search box. No new content, no server call;
// it only shows/hides .nav-item entries already in the DOM.
(function initTopbarSearch() {
  const form = document.getElementById('topbar-search-form');
  const input = document.getElementById('topbar-search-input');
  if (!form || !input) return;
  form.addEventListener('submit', event => event.preventDefault());
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
      const label = item.textContent.trim().toLowerCase();
      item.style.display = !query || label.includes(query) ? '' : 'none';
    });
    document.querySelectorAll('.sidebar .nav-section-label').forEach(label => {
      let node = label.nextElementSibling;
      let hasVisible = false;
      while (node && !node.classList.contains('nav-section-label')) {
        if (node.classList.contains('nav-item') && node.style.display !== 'none') hasVisible = true;
        node = node.nextElementSibling;
      }
      label.style.display = query && !hasVisible ? 'none' : '';
    });
  });
})();

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
  // Below 640px the menu becomes a fixed, viewport-anchored "bottom sheet"
  // (see alpha-polish.css) — its on-screen position no longer depends on
  // `wrapper` at all. Left nested inside `wrapper` anyway, it still has to
  // resolve its paint order inside whichever stacking context `wrapper`
  // happens to sit in (e.g. #access's own fade-in animation creates one),
  // so a LATER field in the same form — sharing the exact same wrapper
  // z-index — can paint its own trigger on top of an EARLIER field's open
  // sheet. That is the confirmed cause of the reported bug: opening
  // "Niveau" shows "Objectif pédagogique"'s trigger bleeding through on
  // top of it. Moving the sheet to a direct child of <body> while open
  // removes it from every ancestor stacking context, so it always paints
  // above the whole page — matching what position:fixed already visually
  // promises. Desktop/tablet keep the menu nested (position:absolute,
  // anchored to the trigger), so it is restored to `wrapper` whenever the
  // breakpoint isn't the mobile sheet.
  const isMobileSheet = () => Boolean(window.matchMedia?.('(max-width: 639px)').matches);
  const restoreMenuHome = () => { if (menu.parentNode !== wrapper) wrapper.appendChild(menu); };
  const open = () => {
    document.querySelectorAll('.dda-select.is-open').forEach(other => { if (other !== wrapper) closeDdaSelect(other); });
    if (isMobileSheet()) document.body.appendChild(menu); else restoreMenuHome();
    wrapper.classList.add('is-open');
    menu.classList.add('is-open');
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
  // The open menu may currently live under <body> (mobile bottom sheet —
  // see open() above) rather than under `wrapper`, so it has to be found by
  // id (aria-controls), not by a wrapper-scoped query, then returned home.
  const menuId = trigger?.getAttribute('aria-controls');
  const menu = menuId && document.getElementById(menuId);
  if (menu) {
    menu.classList.remove('is-open');
    if (menu.parentNode !== wrapper) wrapper.appendChild(menu);
  }
}
['level', 'goal', 'time', 'terminal-instrument', 'terminal-timeframe', 'p2-direction', 'broker-market', 'broker-use', 'support-subject', 'profile-level', 'profile-goal', 'profile-time'].forEach(id => initDdaSelect(document.getElementById(id)));
document.addEventListener('click', event => {
  // The open menu can be a direct child of <body> (mobile bottom sheet), so
  // "inside the control" must also accept a click that lands in the
  // detached menu itself, not only inside its original `.dda-select` wrapper.
  if (!event.target.closest('.dda-select, .dda-select-menu')) document.querySelectorAll('.dda-select.is-open').forEach(closeDdaSelect);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelectorAll('.dda-select.is-open').forEach(closeDdaSelect);
});
// Crossing the mobile-sheet breakpoint (e.g. a device rotation) while a
// menu is open would otherwise leave it detached at <body> under desktop's
// position:absolute rules (or vice versa), rendered at a meaningless
// location — simplest correct behavior is to close any open menu so the
// next open() re-evaluates isMobileSheet() and reparents correctly.
let ddaSelectWasMobileSheet = Boolean(window.matchMedia?.('(max-width: 639px)').matches);
window.addEventListener('resize', () => {
  const nowMobileSheet = Boolean(window.matchMedia?.('(max-width: 639px)').matches);
  if (nowMobileSheet !== ddaSelectWasMobileSheet) {
    ddaSelectWasMobileSheet = nowMobileSheet;
    document.querySelectorAll('.dda-select.is-open').forEach(closeDdaSelect);
  }
});

const titles = {
  landing: 'Découvrir DDA', dashboard: 'Aujourd’hui', access: 'Créer mon profil', path: 'Mon parcours',
  progress: 'Mes progrès', journal: 'Journal', resources: 'Ressources', markets: 'Marchés', brokers: 'Broker Hub',
  membership: 'DDA Premium', 'premium-track': 'Premium Track · P2', 'premium-lab': 'Premium Lab · Risk Plan', 'premium-assessment': 'Premium Assessment · Controlled Decision', support: 'Aide & support', profile: 'Mon profil', community: 'Communauté',
  practice: 'Pratique avancée', intelligence: 'Intelligence DDA', lab: 'DDA Lab',
  forex: 'Forex', stocks: 'Actions', indices: 'Indices', crypto: 'Crypto',
  live: 'DDA Live', business: 'DDA Business', experts: 'DDA Experts',
  // Lesson screen titles are declared once, in LESSON_REGISTRY — never a
  // second hand-maintained list to keep in sync.
  ...Object.fromEntries(LESSON_REGISTRY.map(entry => [entry.viewId, entry.title])),
  // DDA Lab lesson titles come from window.DDALab's own data, not a second
  // hand-maintained list — same principle as LESSON_REGISTRY above.
  // dda-lab.js is now lazy-loaded (Lot 1, mandate §6 audit): window.DDALab
  // may not exist yet at this point, so these keys are filled in later by
  // applyLabTitles() the moment it becomes available — `titles` is a plain
  // mutable object, never frozen, precisely so this patch-in-place works.
  ...(window.DDALab ? { 'lesson-lab1': window.DDALab.lessons[0].title, 'lesson-lab2': window.DDALab.lessons[1].title, 'lesson-lab3': window.DDALab.lessons[2].title, 'lesson-lab4': window.DDALab.lessons[3].title, 'lesson-lab-capstone': window.DDALab.capstone.title } : {})
};
// See the comment on the `titles` literal above — fills the lesson-lab*
// titles once dda-lab.js has actually loaded (deep-link boot, or lazily via
// mountLabTrack()/DDA_LAZY_REFRESH). Safe to call repeatedly.
function applyLabTitles() {
  if (!window.DDALab) return;
  titles['lesson-lab1'] = window.DDALab.lessons[0].title;
  titles['lesson-lab2'] = window.DDALab.lessons[1].title;
  titles['lesson-lab3'] = window.DDALab.lessons[2].title;
  titles['lesson-lab4'] = window.DDALab.lessons[3].title;
  titles['lesson-lab-capstone'] = window.DDALab.capstone.title;
}
applyLabTitles();
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
  community: 'community', practice: 'practice', intelligence: 'intelligence', lab: 'lesson_m01',
  'premium-track': 'premium_track', 'premium-lab': 'premium_track', 'premium-assessment': 'premium_track',
  // Matrice des droits CDCP-OS §4.2 (arbitrage D1 validé, Option B) : M0 en
  // Free (lesson_m01), M1+ réservé à l'offre Standard/Pro (advanced_modules) —
  // dérivé du registre, jamais une liste parallèle écrite à la main.
  ...Object.fromEntries(LESSON_REGISTRY.map(entry => [entry.viewId, entry.permission || 'lesson_m01'])),
  // DDA Lab: LAB1-3 Free (lesson_m01), LAB4 + le projet final appartiennent à
  // DDA Premium (premium_track, réutilisé — aucun nouveau palier commercial).
  'lesson-lab1': 'lesson_m01', 'lesson-lab2': 'lesson_m01', 'lesson-lab3': 'lesson_m01',
  'lesson-lab4': 'premium_track', 'lesson-lab-capstone': 'premium_track'
};
// Aperçu gratuit par module Premium (mandat §5) : une leçon marquée
// `preview: true` dans son registre reste lisible sans Premium malgré sa
// permission `premium_track` — derived from LESSON_REGISTRY, jamais une
// seconde liste à tenir à la main.
const LESSON_PREVIEW_VIEW_IDS = new Set(LESSON_REGISTRY.filter(entry => entry.preview).map(entry => entry.viewId));
// "Where am I" landmark (navigation audit): mirrors the sidebar's own
// section groupings (nav-section-label in academy.html) so the topbar never
// claims a location the sidebar doesn't already show. access/landing are
// deliberately absent — those are entry shells, not a space inside the app.
const VIEW_SECTION = {
  dashboard: 'Apprendre', path: 'Apprendre',
  ...Object.fromEntries(LESSON_REGISTRY.map(entry => [entry.viewId, 'Apprendre'])),
  practice: 'Pratiquer',
  progress: 'Mon travail', journal: 'Mon travail',
  lab: 'Explorer', community: 'Explorer', intelligence: 'Explorer', experts: 'Explorer',
  live: 'Explorer', business: 'Explorer', resources: 'Explorer', markets: 'Explorer',
  forex: 'Explorer', stocks: 'Explorer', indices: 'Explorer', crypto: 'Explorer', brokers: 'Explorer',
  'lesson-lab1': 'Explorer', 'lesson-lab2': 'Explorer', 'lesson-lab3': 'Explorer',
  'lesson-lab4': 'Explorer', 'lesson-lab-capstone': 'Explorer',
  'premium-track': 'Explorer', 'premium-lab': 'Explorer', 'premium-assessment': 'Explorer',
  membership: 'Compte', support: 'Compte', profile: 'Compte'
};
// Maps a lesson id to the view that actually renders it — the Terminal cockpit's
// "continue" button follows DDALearning.nextActionable, which will point at the
// next authored lesson the moment the previous lesson's quiz is complete;
// without this map it would still say "Reprendre la leçon" but navigate to the
// wrong view instead. Derived from the registry — one declaration per lesson.
const LESSON_VIEW_ID = Object.freeze(Object.fromEntries(LESSON_REGISTRY.map(entry => [entry.id, entry.viewId])));
// Reverse of the map above — lets showView fire a single lesson_started event
// by view id without a second per-lesson registry (Lot H, activation funnel).
const VIEW_TO_LESSON_ID = Object.freeze(Object.fromEntries(LESSON_REGISTRY.map(entry => [entry.viewId, entry.id])));
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
// Market Intelligence is loaded only when its route is opened. Keep an empty
// safe value here so the Academy shell can boot without the optional module.
const MARKET_DEMO = Object.freeze({ indices: [], calendar: [] });
function marketDemo() { return window.DDAMarketIntelligence?.demo || MARKET_DEMO; }
// No publication is shown until a source, redistribution right and editorial
// verification are all recorded. An empty registry is intentional: it prevents
// synthetic documents from acquiring the appearance of official BRVM material.
// The contract itself lives in brvm-publications.js (shared with the landing
// ticker) so this page never maintains its own copy of the validation rule.
const BRVM_PUBLICATION_REQUIRED_FIELDS = window.DDABrvmPublications.REQUIRED_FIELDS;
let BRVM_PUBLICATIONS = Object.freeze([]);
let brvmPublicationFetchState = 'idle';
let brvmPublicationFetchStarted = false;
function isVerifiedBrvmPublication(publication) { return window.DDABrvmPublications.isVerified(publication); }
function verifiedBrvmPublications() { return BRVM_PUBLICATIONS.filter(isVerifiedBrvmPublication); }
async function loadBrvmPublications() {
  if (!window.DDABFF?.enabled?.() || typeof window.DDABFF.getBrvmPublications !== 'function' || brvmPublicationFetchStarted) return;
  brvmPublicationFetchStarted = true;
  brvmPublicationFetchState = 'loading';
  renderMarketIntelligence();
  try {
    const items = await window.DDABFF.getBrvmPublications();
    if (!Array.isArray(items)) throw new Error('brvm_publications_invalid_response');
    BRVM_PUBLICATIONS = Object.freeze(items.filter(isVerifiedBrvmPublication));
    brvmPublicationFetchState = 'loaded';
  } catch {
    brvmPublicationFetchState = 'error';
    brvmPublicationFetchStarted = false;
  }
  renderMarketIntelligence();
}
const NEXT_STEP_PHRASE = { lesson: 'voir la leçon', exercise: 'réussir l’exercice', quiz: 'valider le quiz' };

// Illustrative candlestick shape (never real price data — same "Mode pédagogique"
// honesty as the badge next to it) replacing a generic line sparkline with DDA's
// own visual signature: blue/ivory candles, never green/red (§ zéro signal).
const CANDLE_PATTERNS = [[6, 14, 4, 16, 9, 15, 5, 17]];
function candlestickSpark(patternIndex) {
  const patterns = window.DDAMarketIntelligence?.candlePatterns || CANDLE_PATTERNS;
  const pattern = patterns[patternIndex % patterns.length];
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
// Level 4 fires on a single correct quiz pass (see competencyLevel below) — it proves the
// learner can answer a multiple-choice check, not that the skill is verified in practice.
// "Maîtrisé" previously overclaimed that; label it for what it actually demonstrates.
const COMPETENCY_LEVEL_LABEL = { 0: 'Pas encore commencé', 1: 'Découvert', 2: 'Compris', 3: 'Appliqué', 4: 'Quiz réussi' };

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

// Activity is a strict rolling seven-day measure of learning work, not page
// traffic. Opening a route, changing a preference, or viewing a premium teaser
// must never inflate the learner's active-day metric.
const LEARNING_ACTIVITY_EVENTS = new Set([
  'lesson_understood', 'exercise_complete', 'quiz_complete',
  'practice_attempted', 'journal_entry_created', 'journal_entry_updated',
  'journal_plan_saved', 'premium_lab_attempted', 'premium_lab_validated',
  'premium_assessment_completed', 'premium_weekly_review_completed'
]);
function countActiveDays(events, now = Date.now()) {
  const windowStart = now - (7 * 24 * 60 * 60 * 1000);
  return new Set((events || [])
    .filter(event => LEARNING_ACTIVITY_EVENTS.has(event.name))
    .map(event => ({ event, timestamp: Date.parse(event.at) }))
    .filter(({ timestamp }) => Number.isFinite(timestamp) && timestamp >= windowStart && timestamp <= now)
    .map(({ event }) => new Date(event.at).toISOString().slice(0, 10))).size;
}

// Lot 9 (maquette "Mes progrès" — badges/séries) : la vraie série de jours
// consécutifs, calculée depuis le même journal d'événements que
// countActiveDays — jamais un second chiffre inventé. Si aujourd'hui n'a
// pas encore d'activité, la série reste comptée depuis hier (elle n'est
// rompue qu'après une journée entière sans aucune activité réelle).
function countCurrentStreak(events, now = Date.now()) {
  const activeDays = new Set((events || [])
    .filter(event => LEARNING_ACTIVITY_EVENTS.has(event.name))
    .map(event => Date.parse(event.at))
    .filter(Number.isFinite)
    .map(timestamp => new Date(timestamp).toISOString().slice(0, 10)));
  const cursor = new Date(now);
  if (!activeDays.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
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
  content: initialAttribution.content,
  referrer: document.referrer,
  landingPath: location.hash,
  partnerRef: initialAttribution.partnerRef
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
// Lot J — never let a pulled server value downgrade a local one: once a step
// is true on either side, it stays true. This is the only merge rule, so a
// stale server read can never erase progress a learner just made locally,
// and a stale local device can never erase what a learner already proved
// elsewhere.
function mergeProgressNeverDowngrade(localState, remoteProgress) {
  if (!remoteProgress) return localState;
  const mergedLessons = { ...localState.lessons };
  Object.entries(remoteProgress.lessons || {}).forEach(([lessonId, remote]) => {
    const current = mergedLessons[lessonId] || { lessonViewed: false, exerciseComplete: false, quizComplete: false };
    mergedLessons[lessonId] = {
      lessonViewed: current.lessonViewed || Boolean(remote.lessonViewed),
      exerciseComplete: current.exerciseComplete || Boolean(remote.exerciseComplete),
      quizComplete: current.quizComplete || Boolean(remote.quizComplete)
    };
  });
  const remoteOnboarding = remoteProgress.onboarding;
  const onboarding = remoteOnboarding?.complete && !localState.onboarding?.complete
    ? { level: remoteOnboarding.level, goal: remoteOnboarding.goal, time: remoteOnboarding.time, complete: true }
    : localState.onboarding;
  return { ...localState, lessons: mergedLessons, onboarding };
}

// Navigation audit follow-up: the back-office existed with no way to find
// it short of knowing admin.html's URL. Reveals the (otherwise-hidden)
// sidebar/drawer links only once the server itself confirms an admin role —
// never from anything stored client-side, matching the same server-derived
// gate admin.html itself enforces (bff/src/app.js withAdmin). Failures
// (not configured, network) just leave the link hidden, never surfaced as
// an error — most learners simply aren't admins, which is the expected case.
async function revealAdminLinkIfAdmin() {
  if (!window.DDABFF?.enabled()) return;
  try {
    const result = await window.DDABFF.getAdminOverview();
    if (result.status !== 200) return;
    document.getElementById('sidebar-admin-link')?.removeAttribute('hidden');
    document.getElementById('drawer-admin-link')?.removeAttribute('hidden');
  } catch { /* stays hidden */ }
}

async function hydrateRemoteSession() {
  if (!window.DDABFF?.enabled()) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let user;
    try { user = await window.DDABFF.getMe({ signal: controller.signal }); }
    finally { clearTimeout(timeout); }
    if (!user) {
      remoteUser = null;
      prototypeState = DDA.setStorageScope(null) || DDA.load();
      window.DDARefreshAiHistory?.();
      return null;
    }
    if (typeof user.user_id !== 'string' || !user.user_id.trim()) throw new Error('bff_user_identity_missing');
    const accountState = DDA.setStorageScope(user.user_id);
    if (!accountState) throw new Error('bff_user_identity_invalid');
    remoteUser = user;
    let nextState = {
      ...accountState,
      user: {
        ...(accountState.user || {}),
        name: user.display_name || 'Apprenant',
        email: user.email || ''
      }
    };
    try {
      const remoteProgress = await window.DDABFF.getProgress();
      nextState = mergeProgressNeverDowngrade(nextState, remoteProgress);
    } catch {
      // Progress sync is best-effort: a failed pull leaves local progress untouched.
    }
    prototypeState = DDA.save(nextState);
    window.DDARefreshAiHistory?.();
    return user;
  } catch {
    // A temporary BFF outage leaves the isolated guest namespace intact. It
    // must never cause guest data to be attributed to a remote account.
    remoteUser = null;
    prototypeState = DDA.setStorageScope(null) || DDA.load();
    window.DDARefreshAiHistory?.();
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
  const passwordHelp = document.getElementById('access-password-help');
  const consentField = document.getElementById('access-consent-field');
  const consentLabel = document.getElementById('access-consent-label');
  const consent = document.getElementById('consent');
  const title = document.getElementById('access-form-title');
  const step = document.getElementById('access-step-label');
  const note = document.getElementById('access-form-note');
  const emailHelp = document.getElementById('access-email-help');
  const submit = document.querySelector('#signup-form button[type="submit"]');
  const forgot = document.getElementById('bff-forgot-password');
  const resend = document.getElementById('bff-resend-confirmation');
  if (firstNameLabel) firstNameLabel.hidden = login;
  if (firstNameField) firstNameField.required = !login;
  if (passwordLabel) passwordLabel.hidden = false;
  if (passwordField) { passwordField.required = true; passwordField.autocomplete = login ? 'current-password' : 'new-password'; }
  // A clear, upfront password requirement (signup reliability, P0 2026-11):
  // shown only while creating an account, where the 12-character minimum is
  // new information, not while signing back in with a password already set.
  if (passwordHelp) passwordHelp.hidden = login;
  if (consentField) consentField.hidden = login;
  if (consent) consent.required = !login;
  // The BFF path really does create a server-side account (Supabase Auth),
  // unlike the local-only prototype mode this label's original wording
  // describes — showing that copy here would tell a real signer-upper
  // something false about where their data goes.
  if (consentLabel) consentLabel.textContent = 'Je crée un compte sécurisé (e-mail + mot de passe) pour retrouver la progression de mes leçons et mon onboarding après confirmation de mon adresse e-mail. Le Journal, le Terminal, les préférences et mes réponses restent sur cet appareil.';
  if (emailHelp) emailHelp.textContent = login
    ? 'Cette adresse e-mail est transmise au service d’authentification pour ouvrir ta session.'
    : 'Cette adresse e-mail est transmise au service d’authentification pour créer ton compte et t’envoyer le lien de confirmation.';
  if (title) title.textContent = login ? 'Se connecter' : 'Commence ton parcours Free';
  if (step) step.textContent = login ? 'Accès sécurisé' : 'Étape 1 sur 2 · commencer';
  if (note) note.textContent = login
    ? 'Ouvre ta session DDA. Les leçons et l’onboarding sont liés à ton compte ; le Journal, le Terminal et les réponses restent sur cet appareil.'
    : 'Pas de carte bancaire ni de courtier : deux minutes pour préparer ta première leçon.';
  if (submit) submit.innerHTML = login ? 'Ouvrir ma session <span>→</span>' : 'Recevoir le lien de vérification <span>→</span>';
  if (forgot) forgot.hidden = !login;
  if (resend) resend.hidden = true;
  lastSignupAttempt = null;
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

// PKCE error messages (P0 auth reliability audit, 2026-11): "verifier
// expired/missing" (this browser never made the original request, or its
// cookie expired — see bff/src/app.js) is a materially different, and more
// honest, situation than "the code itself is invalid/already used". Showing
// the same generic text for both would hide the real, actionable advice
// ("open the link in the same browser you used to ask for it") behind a
// message that reads like the link is simply dead.
function bffVerifierErrorMessage(error, genericMessage) {
  const code = error?.body?.code;
  if (code === 'recovery_verifier_expired' || code === 'signup_verifier_expired') {
    return 'Ce lien doit être ouvert dans le même navigateur que celui utilisé pour la demande, et la demande ne doit pas avoir expiré. Fais une nouvelle demande.';
  }
  if (code === 'oauth_verifier_expired') {
    return 'La connexion avec Google doit se terminer dans le même onglet que celui qui l’a démarrée, et la demande ne doit pas avoir expiré. Réessaie « Continuer avec Google ».';
  }
  if (code === 'oauth_email_unverified') {
    return 'Ton compte Google n’a pas d’adresse e-mail vérifiée. Vérifie-la auprès de Google, ou utilise l’e-mail et le mot de passe.';
  }
  return genericMessage;
}

// Google OAuth return (founder directive, 2026-11): GoTrue's own redirect
// carries the STANDARD OAuth error params (`error`/`error_description`) when
// the user refuses consent at Google, or `oauth_provider_not_configured`
// when bff/src/app.js's /v1/auth/oauth/google/start route bounced back
// because the founder has not finished enabling the provider in the
// Supabase dashboard yet — see that route's own comment. Each gets its own
// honest, specific message rather than one generic "connection failed".
function oauthErrorMessage(code) {
  if (code === 'access_denied') return 'Tu as annulé la connexion avec Google. Tu peux réessayer, ou utiliser l’e-mail et le mot de passe.';
  if (code === 'oauth_provider_not_configured' || code === 'oauth_not_configured') return 'La connexion avec Google n’est pas encore activée sur ce compte. Utilise l’e-mail et le mot de passe en attendant.';
  if (code === 'rate_limited') return 'Trop de tentatives. Réessaie dans quelques minutes.';
  if (code === 'server_error') return 'La connexion avec Google est momentanément indisponible. Réessaie dans un instant, ou utilise l’e-mail et le mot de passe.';
  return 'La connexion avec Google a échoué. Réessaie, ou utilise l’e-mail et le mot de passe.';
}

async function handleBffVerificationToken() {
 const params=new URLSearchParams(location.search),hashParams=new URLSearchParams(location.hash.slice(1));
 const recovery=window.DDA_AUTH_RECOVERY===true||params.get('type')==='recovery'||hashParams.get('type')==='recovery';
 const token=window.DDA_VERIFY_TOKEN||params.get('token_hash')||params.get('token')||hashParams.get('token_hash')||hashParams.get('token'),code=window.DDA_AUTH_CODE||params.get('code');
 // Google OAuth return (founder directive, 2026-11): Supabase bounces the
 // browser back to the exact redirect_to bff/src/app.js's start route gave
 // it, which always carries this marker — set once, server-side, never
 // guessed from the presence of `code` alone (recovery and signup-
 // confirmation links also carry a bare `code`; this is what tells an OAuth
 // return apart from either of those). Read from the SAME window globals
 // academy.html's inline head script stashes `code`/`type=recovery` into
 // (window.DDA_OAUTH_PROVIDER / window.DDA_OAUTH_ERROR), never from
 // location.search/hash directly: by the time this function runs, that
 // script has already stripped the entire query string from the address
 // bar (privacy hygiene, same as it does for `code`/`token`), so params
 // read here would otherwise always be empty.
 const oauthProvider=window.DDA_OAUTH_PROVIDER||params.get('auth')||hashParams.get('auth');
 const oauthError=window.DDA_OAUTH_ERROR||params.get('error')||hashParams.get('error');
 delete window.DDA_VERIFY_TOKEN;delete window.DDA_AUTH_RECOVERY;delete window.DDA_AUTH_CODE;delete window.DDA_OAUTH_PROVIDER;delete window.DDA_OAUTH_ERROR;if(!window.DDABFF?.enabled())return;
 if(oauthProvider==='oauth-google'){
  showView('access',false,'replace');
  const panel=document.getElementById('bff-verify-panel'),message=document.getElementById('bff-verify-message'),form=document.getElementById('signup-form');
  if(panel)panel.hidden=true;if(form)form.hidden=true;
  if(oauthError){if(message)message.textContent=oauthErrorMessage(oauthError);if(panel)panel.hidden=false;return;}
  if(!code){if(message)message.textContent='Lien de connexion Google incomplet. Réessaie « Continuer avec Google ».';if(panel)panel.hidden=false;return;}
  if(message)message.textContent='Connexion avec Google en cours…';
  try{
   await window.DDABFF.exchangeOAuthCode('google',code);
   const user=await hydrateRemoteSession();
   if(!user)throw new Error('session_missing');
   revealAdminLinkIfAdmin();
   refreshServerPremiumEntitlement();
   showOnboardingAfterRemoteAuth(user);
  }catch(error){
   if(panel)panel.hidden=false;if(form)form.hidden=true;
   if(message)message.textContent=bffVerifierErrorMessage(error,'La connexion avec Google a échoué ou le lien a expiré. Réessaie « Continuer avec Google ».');
  }
  return;
 }
 if(recovery)showView('access',false,'replace');
 if(recovery&&code){const form=document.getElementById('bff-reset-password-form');document.getElementById('signup-form').hidden=true;document.getElementById('bff-recovery-form').hidden=true;form.hidden=false;form.dataset.recoveryReady='false';
  try{await window.DDABFF.exchangeRecoveryCode(code);form.dataset.recoveryReady='true';document.getElementById('reset-password-error').textContent='';}
  catch(error){form.hidden=true;const panel=document.getElementById('bff-verify-panel');panel.hidden=false;document.getElementById('bff-verify-message').textContent=bffVerifierErrorMessage(error,'Lien de récupération invalide ou expiré. Demande un nouveau lien.');}return;}
 // New, PKCE-protected signup confirmation links carry `code` instead of
 // `token` (see bff/src/supabase-auth.js's register()). The exchange only
 // succeeds in the SAME browser that submitted the signup form — that is
 // the whole point: a security scanner's sandboxed browser pre-visiting
 // this link has no way to complete it, so it can never falsely report
 // "lien invalide" to the real learner afterwards.
 if(!recovery&&code){
  const panel=document.getElementById('bff-verify-panel'),message=document.getElementById('bff-verify-message'),form=document.getElementById('signup-form');if(panel)panel.hidden=false;if(form)form.hidden=true;
  try{await window.DDABFF.exchangeSignupCode(code);if(message)message.textContent='Adresse confirmée. Tu peux maintenant ouvrir ta session.';}
  catch(error){if(message)message.textContent=bffVerifierErrorMessage(error,'Ce lien est invalide, expiré ou déjà utilisé. Demande un nouveau lien depuis l’inscription');}
  return;
 }
 if(!token){if(recovery){document.getElementById('bff-reset-password-form').hidden=true;const panel=document.getElementById('bff-verify-panel');panel.hidden=false;document.getElementById('bff-verify-message').textContent='Lien de récupération incomplet. Demande un nouveau lien.';}return;}
 if(recovery){const form=document.getElementById('bff-reset-password-form');document.getElementById('signup-form').hidden=true;document.getElementById('bff-recovery-form').hidden=true;form.hidden=false;form.dataset.recoveryReady='false';
  try{await window.DDABFF.verifyRecoveryToken(token);form.dataset.recoveryReady='true';document.getElementById('reset-password-error').textContent='';}
  catch{form.hidden=true;const panel=document.getElementById('bff-verify-panel');panel.hidden=false;document.getElementById('bff-verify-message').textContent='Lien de récupération invalide ou expiré. Demande un nouveau lien.';}return;}
 const panel=document.getElementById('bff-verify-panel'),message=document.getElementById('bff-verify-message'),form=document.getElementById('signup-form');if(panel)panel.hidden=false;if(form)form.hidden=true;
 try{await window.DDABFF.verifyEmail(token);if(message)message.textContent='Adresse confirmée. Tu peux maintenant ouvrir ta session.';}catch{if(message)message.textContent='Ce lien est invalide, expiré ou déjà utilisé. Demande un nouveau lien depuis l’inscription';}
}
function initBffAuthUi() {
  if (!window.DDABFF?.enabled()) return;
  document.getElementById('bff-auth-tools').hidden = false;
  // The wrap's own visibility then stays in sync with #signup-form's
  // (a :has() rule in alpha-polish.css) — shown here once,
  // exactly like #bff-auth-tools above, never re-toggled at every
  // mode-switch call site the way #signup-form itself is.
  const googleWrap = document.getElementById('bff-oauth-google-wrap');
  if (googleWrap) googleWrap.hidden = false;
  const googleButton = document.getElementById('bff-oauth-google');
  if (googleButton) {
    googleButton.addEventListener('click', () => {
      const url = window.DDABFF.oauthGoogleStartUrl();
      // A real full-page navigation — never a fetch (see bff-client.js's
      // oauthGoogleStartUrl comment): this is a redirect-based sign-in flow,
      // not an API call, and the one kind of request that reliably carries
      // the httpOnly verifier cookie the BFF is about to set on its own
      // redirect through Supabase and Google — mobile-safe, no popup, same
      // as the rest of this site.
      if (url) window.location.href = url;
    });
  }
  setBffAuthMode('signup');
  // Show/hide password toggle (P0.4) — a mistyped password that the learner
  // cannot see is a real cause of "it worked at signup, not at login".
  const toggle = document.getElementById('toggle-access-password');
  const passwordInput = document.getElementById('access-password');
  if (toggle && passwordInput) {
    toggle.addEventListener('click', () => {
      const show = passwordInput.type === 'password';
      passwordInput.type = show ? 'text' : 'password';
      toggle.textContent = show ? 'Masquer' : 'Afficher';
      toggle.setAttribute('aria-pressed', String(show));
    });
  }
  // Resend confirmation (signup reliability, P0 2026-11): a learner whose
  // verification e-mail is slow, filtered to spam, or simply never arrived
  // must not be stuck re-typing the whole form — re-sending reuses exactly
  // the credentials just submitted, kept only in memory for this page.
  const resendButton = document.getElementById('bff-resend-confirmation');
  if (resendButton) {
    resendButton.addEventListener('click', async () => {
      if (!lastSignupAttempt || resendButton.disabled) return;
      resendButton.disabled = true;
      const originalLabel = resendButton.textContent;
      resendButton.textContent = 'Envoi…';
      try {
        await window.DDABFF.register(lastSignupAttempt);
        document.getElementById('bff-auth-status').textContent = 'Nouveau lien envoyé. Vérifie ta boîte mail (et les spams).';
      } catch {
        document.getElementById('bff-auth-status').textContent = 'Impossible de renvoyer le lien pour le moment. Réessaie dans un instant.';
      } finally {
        resendButton.disabled = false;
        resendButton.textContent = originalLabel;
      }
    });
  }
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
  document.getElementById('bff-reset-password-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = document.getElementById('reset-password').value;
    const confirm = document.getElementById('reset-password-confirm').value;
    const error = document.getElementById('reset-password-error');
    if (form.dataset.recoveryReady !== 'true') { error.textContent = 'Le lien de récupération doit être validé. Demande un nouveau lien.'; return; }
    if (password.length < 12) { error.textContent = 'Le mot de passe doit contenir au moins 12 caractères.'; return; }
    if (password !== confirm) { error.textContent = 'Les deux mots de passe ne correspondent pas.'; return; }
    error.textContent = '';
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      await window.DDABFF.confirmPasswordReset({ password });
      form.hidden = true;
      form.dataset.recoveryReady = 'false';
      document.getElementById('signup-form').hidden = false;
      setBffAuthMode('login');
      document.getElementById('bff-auth-status').textContent = 'Mot de passe modifié. Connecte-toi avec ton nouveau mot de passe.';
      document.getElementById('reset-password').value = '';
      document.getElementById('reset-password-confirm').value = '';
    } catch {
      error.textContent = 'Impossible de modifier le mot de passe. Le lien a peut-être expiré : demande-en un nouveau.';
    } finally { submit.disabled = false; }
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
  // Lot J — push the already-merged row (never a partial patch), so a slow
  // or failed request can never leave the server holding less than it did
  // before; a failure here is silent and never blocks the local update.
  if (remoteUser && window.DDABFF?.enabled()) {
    const row = prototypeState.lessons?.[lessonId];
    if (row) window.DDABFF.saveLessonProgress(lessonId, row).catch(() => {});
  }
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

// Internal curriculum IDs remain useful to the engine and analytics, but they
// are not learner-facing language. Every surface below uses the authored title
// or a plain sequence label instead of exposing M0.1, P2.2, LAB1, etc.
function learnerLessonTitle(lessonOrId) {
  if (lessonOrId && typeof lessonOrId === 'object') return lessonOrId.title || 'cette leçon';
  const match = DDA.curriculum.modules.flatMap(module => module.lessons.map(lesson => ({ module, lesson })))
    .find(entry => entry.lesson.id === lessonOrId);
  return match?.lesson.title || 'cette leçon';
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
    return `<li><span class="module-id">Étape ${visibleModules.indexOf(module) + 1}</span><strong>${module.title}</strong><span class="module-pill ${status}">${MODULE_STATUS_LABEL[status] || status}</span></li>`;
  }).join('');
  const hidden = modules.length - visibleModules.length;
  if (hidden > 0) container.insertAdjacentHTML('beforeend', `<li class="modules-recap-more"><span class="module-id">…</span><strong>${hidden} modules plus loin</strong><span class="module-pill coming_soon">Progressif</span></li>`);
}

// Lot 8 (cahier des charges — instruments de marché) : XAUUSD, EURUSD,
// GBPUSD, USDJPY, US30, BTCUSD. Toujours une lecture serveur fraîche —
// jamais un chiffre fabriqué ou mis en cache côté client au-delà de cet
// appel — et jamais bloquant si le BFF ou les fournisseurs ne sont pas
// configurés : chaque carte retombe honnêtement sur "Bientôt disponible".
const GLOBAL_MARKET_SYMBOLS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'US30', 'BTCUSD'];

function renderGlobalMarketQuotesSkeleton(grid) {
  grid.innerHTML = GLOBAL_MARKET_SYMBOLS.map(symbol => `
    <article class="index-card" data-symbol="${symbol}">
      <div class="index-card-head"><strong>${symbol}</strong><span class="data-badge"><svg class="icon"><use href="#icon-blocked"/></svg>Bientôt disponible</span></div>
      <p>Cotation en attente de connexion à un fournisseur de données vérifié.</p>
    </article>
  `).join('');
}

async function renderGlobalMarketQuotes() {
  const grid = document.getElementById('market-global-grid');
  if (!grid) return;
  renderGlobalMarketQuotesSkeleton(grid);
  if (!window.DDABFF?.enabled()) return;
  try {
    const instruments = await window.DDABFF.getMarketQuotes();
    if (!instruments) return;
    grid.innerHTML = GLOBAL_MARKET_SYMBOLS.map(symbol => {
      const quote = instruments[symbol];
      if (!quote) return '';
      if (quote.status === 'ok') {
        const isDown = String(quote.price).trim().startsWith('-');
        return `<article class="index-card" data-symbol="${symbol}">
          <div class="index-card-head"><strong>${symbol}</strong><span class="data-badge is-live"><span class="status-dot"></span>Cotation vérifiée</span></div>
          <div class="index-card-example"><strong class="index-card-example-value">${quote.price}</strong></div>
          <p>${quote.label} · mis à jour le ${new Date(quote.asOf).toLocaleString('fr-FR')}</p>
        </article>`;
      }
      return `<article class="index-card" data-symbol="${symbol}">
        <div class="index-card-head"><strong>${symbol}</strong><span class="data-badge"><svg class="icon"><use href="#icon-blocked"/></svg>${quote.status === 'unavailable' ? 'Indisponible pour le moment' : 'Bientôt disponible'}</span></div>
        <p>${quote.label || symbol} — cotation en attente de connexion à un fournisseur de données vérifié.</p>
      </article>`;
    }).join('');
  } catch {
    // Keep the honest "Bientôt disponible" skeleton on any failure — never a stale or fabricated value.
  }
}

function renderMarketIntelligence() {
  renderGlobalMarketQuotes();
  // Keep the public section anchor intact; only the inner grid is data-driven.
  const indices = document.getElementById('market-index-grid');
  if (indices) {
    indices.innerHTML = marketDemo().indices.map((item, i) => `
      <article class="index-card">
        <div class="index-card-head"><strong>${item.label}</strong><span class="data-badge"><svg class="icon"><use href="#icon-blocked"/></svg>Mode pédagogique</span></div>
        ${item.exampleValue ? `<div class="index-card-example"><strong class="index-card-example-value">${item.exampleValue}</strong><span class="index-card-example-change${String(item.exampleChange).trim().startsWith('-') ? ' is-down' : ' is-up'}">${item.exampleChange}</span><small class="index-card-example-tag">Exemple pédagogique — pas une cotation réelle</small></div>` : ''}
        ${candlestickSpark(i)}
        <p>${item.description}</p>
      </article>
    `).join('');
  }
  const calendar = document.getElementById('market-calendar-list');
  if (calendar) {
    const sources = marketDemo().sources || [];
    calendar.innerHTML = sources.length
      ? sources.map(source => `
        <li class="brvm-source-row"><div><strong>${source.label}</strong><small>${source.type} · ${source.description}</small></div><a class="data-badge brvm-source-link" href="${source.href}" target="_blank" rel="noopener noreferrer">Source officielle <span aria-hidden="true">↗</span></a></li>
      `).join('')
      : '<li class="brvm-source-empty"><div><strong>Sources en préparation</strong><small>Aucune source officielle n’est actuellement configurée.</small></div></li>';
  }
  const publications = document.getElementById('brvm-publications-list');
  if (publications) {
    const verifiedPublications = verifiedBrvmPublications();
    publications.innerHTML = verifiedPublications.length
      ? verifiedPublications.map(publication => `<article class="brvm-publication-row"><div><strong><a href="${escapeHtml(publication.documentUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(publication.title)}</a></strong><small><a href="${escapeHtml(publication.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(publication.source)}</a> · ${escapeHtml(publication.referenceDate)} · récupéré le ${escapeHtml(publication.retrievedAt)}</small></div><span class="data-badge">Vérifié · actuel</span></article>`).join('')
      : brvmPublicationFetchState === 'loading'
        ? '<div class="brvm-publications-empty-copy"><span class="brvm-empty-mark" aria-hidden="true">…</span><div><strong>Chargement des publications vérifiées</strong><p>Les documents ne seront affichés qu’après vérification de leur provenance, de leur fraîcheur et de leurs droits.</p></div></div>'
        : brvmPublicationFetchState === 'error'
          ? '<div class="brvm-publications-empty-copy"><span class="brvm-empty-mark" aria-hidden="true">!</span><div><strong>Publications temporairement indisponibles</strong><p>Aucun document n’est affiché. Réessaie ultérieurement ; une erreur de service n’est pas interprétée comme un registre vide.</p></div></div>'
          : '<div class="brvm-publications-empty-copy"><span class="brvm-empty-mark" aria-hidden="true">—</span><div><strong>Aucune publication vérifiée disponible</strong><p>Le registre est prêt, mais DDA n’a pas encore connecté de source autorisée. Les documents en attente ne sont pas présentés comme consultables.</p><small>État actuel · collecte manuelle à cadrer · pas de dernière mise à jour disponible</small></div></div>';
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
          <div><p class="mastery-lesson">${lesson.title}</p><strong>${lesson.competency.label}</strong></div>
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
    container.innerHTML = '<p class="practice-proof-empty">Ta première mission t’attend dans le Terminal — une lecture guidée pour démarrer.</p>';
    return;
  }
  const validated = practice.status === 'validated';
  const proof = practice.proof || {};
  const source = practice.sourceLessonTitle ? `Après la leçon « ${practice.sourceLessonTitle} »` : 'Practice Terminal autonome';
  const proofType = proof.type === 'zone_identification' ? 'Identification de zone' : 'Mission Practice';
  container.innerHTML = `<div class="practice-proof-row ${validated ? 'is-validated' : 'is-retry'}"><span class="practice-proof-icon">${validated ? '✓' : '↻'}</span><div><strong>${escapeHtml(proofType)} — Practice Terminal</strong><p>${escapeHtml(source)}</p><p>${escapeHtml(practice.feedback || 'Mission tentée localement.')}</p><small>Preuve pédagogique · ${validated ? 'conservée sur cet appareil.' : 'à reprendre — elle ne compte pas comme compétence acquise.'}</small></div></div>`;
}

// Dashboard orientation layer: expose one recent, auditable proof without
// creating a second progress engine. Practice state and the existing event log
// remain the only sources; a view opening is never presented as proof.
// Real photos only, reused from the existing pool (same assets as the Lab
// photo rail) — picked by module prefix so a lesson's card matches its real
// module, never a generic stock image unrelated to the content.
const DASHBOARD_WEEK_PHOTO_BY_MODULE = Object.freeze({
  M0: 'images/photos/m0-foundations-observe.jpg',
  M1: 'images/photos/m1-terminal-analysis.jpg',
  P2: 'images/photos/p2-discipline-review.jpg',
  MBRVM: 'images/photos/brvm-market-fruits.jpg'
});

// Founder mockup's "À faire cette semaine" row — the real next 1-2 authored
// lessons after the current one (authoredLessons() order, same source the
// Fil de maîtrise and nav shortcuts already use), never a fabricated weekly
// plan. Hidden entirely once the curriculum is complete (nothing left to do).
function renderDashboardWeekAhead(continueTarget) {
  const section = document.getElementById('dashboard-week-ahead');
  const rail = document.getElementById('dashboard-week-rail');
  if (!section || !rail) return;
  const all = authoredLessons();
  const currentIndex = continueTarget ? all.findIndex(entry => entry.lesson.id === continueTarget.lesson.id) : -1;
  const upcoming = currentIndex === -1 ? [] : all.slice(currentIndex + 1, currentIndex + 3);
  if (!upcoming.length) {
    section.hidden = true;
    rail.innerHTML = '';
    return;
  }
  section.hidden = false;
  rail.innerHTML = upcoming.map(({ module, lesson }) => {
    const moduleKey = lesson.id.split('.')[0];
    const photo = DASHBOARD_WEEK_PHOTO_BY_MODULE[moduleKey] || DASHBOARD_WEEK_PHOTO_BY_MODULE.M0;
    const viewId = LESSON_VIEW_ID[lesson.id] || 'lesson';
    return `
      <button type="button" class="lab-photo-card" data-view="${viewId}">
        <div class="lab-photo-card-media"><img class="photo-fill" src="${photo}" alt="" loading="lazy"><div class="photo-scrim"></div></div>
        <strong>${escapeHtml(learnerLessonTitle(lesson))}</strong>
        <small>${escapeHtml(module.title)}</small>
      </button>`;
  }).join('');
}

function renderDashboardProof(continueTarget, curriculumComplete) {
  const titleEl = document.getElementById('dashboard-proof-title');
  const metaEl = document.getElementById('dashboard-proof-meta');
  const statusEl = document.getElementById('dashboard-proof-status');
  const stateEl = document.getElementById('dashboard-proof-state');
  const inlineEl = document.getElementById('dashboard-proof-state-inline');
  const actionEl = document.getElementById('dashboard-action-label');
  if (!titleEl || !metaEl || !statusEl || !stateEl || !inlineEl || !actionEl) return;

  let title = 'Ta première preuve apparaîtra ici après ta prochaine validation.';
  let meta = 'Valide une leçon, un exercice ou une mission pour commencer à construire ta trace.';
  let status = 'À construire';
  const practice = prototypeState.terminal?.practice;
  if (practice?.attempts) {
    const proof = practice.proof || {};
    const proofType = proof.type === 'zone_identification' ? 'Identification de zone' : 'Mission Practice';
    const validated = practice.status === 'validated';
    title = validated ? `${proofType} validée dans le Terminal.` : `${proofType} tentée — à reprendre.`;
    meta = practice.feedback || 'Mission tentée localement.';
    status = validated ? 'Conservée localement' : 'À reprendre';
  } else {
    const event = [...(prototypeState.events || [])].reverse().find(item => ['quiz_complete', 'exercise_complete', 'lesson_understood'].includes(item.name));
    if (event) {
      const lesson = learnerLessonTitle(event.metadata?.lesson);
      const labels = { quiz_complete: 'Quiz validé', exercise_complete: 'Exercice complété', lesson_understood: 'Leçon comprise' };
      title = `${labels[event.name]} — ${lesson}.`;
      meta = 'Preuve pédagogique enregistrée dans l’état local de cet appareil.';
      status = 'Enregistrée localement';
    }
  }
  titleEl.textContent = title;
  metaEl.textContent = meta;
  statusEl.textContent = status;
  stateEl.textContent = status;
  inlineEl.textContent = status;

  if (curriculumComplete) {
    actionEl.textContent = (prototypeState.journal?.entries || []).length === 0 ? 'Ouvrir le Journal' : 'Explorer les marchés';
  } else if (continueTarget) {
    actionEl.textContent = `Reprendre « ${learnerLessonTitle(continueTarget.lesson)} »`;
  } else {
    actionEl.textContent = '—';
  }
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
  const action = document.getElementById('progress-next-action');
  const next = DDALearning.nextActionable(DDA.curriculum, prototypeState);
  if (el) {
    el.textContent = next
      ? `Continuer « ${learnerLessonTitle(next.lesson)} » — ${NEXT_STEP_PHRASE[next.step] || 'continuer'}.`
      : 'Toutes les leçons disponibles sont validées. Ton prochain module sera bientôt disponible.';
  }
  if (action) {
    action.hidden = !next;
    if (next) {
      action.dataset.view = LESSON_VIEW_ID[next.lesson.id] || 'lesson';
      action.innerHTML = `${next.step === 'lesson' ? 'Commencer' : 'Reprendre'} « ${learnerLessonTitle(next.lesson)} » <span>→</span>`;
    }
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
  const totalModules = DDA.curriculum.modules.length;
  const startedLabel = `${started}/${totalModules}`;
  const totalXp = DDALearning.totalXp(DDA.curriculum, prototypeState);
  const activeDays = countActiveDays(prototypeState.events);
  const streak = countCurrentStreak(prototypeState.events);
  startedEl.textContent = startedLabel;
  document.getElementById('progress-total-xp').textContent = String(totalXp);
  document.getElementById('progress-active-days').textContent = String(activeDays);
  const streakNote = document.getElementById('progress-streak-note');
  if (streakNote) streakNote.textContent = streak > 0 ? `Série actuelle : ${streak} jour${streak > 1 ? 's' : ''}` : 'Série actuelle : 0 jour';
  const ring = document.getElementById('progress-modules-ring');
  if (ring) ring.style.setProperty('--progress', String(totalModules ? Math.round((started / totalModules) * 100) : 0));
  // Profil mirrors the exact same real values as Progression — never a second,
  // diverging computation of "how far has this learner gotten".
  document.getElementById('profile-modules-started').textContent = startedLabel;
  document.getElementById('profile-total-xp').textContent = String(totalXp);
  document.getElementById('profile-active-days').textContent = String(activeDays);
  // Carte de progression partageable (mandat §8) : mêmes chiffres réels que
  // ci-dessus, jamais une seconde source — aucune donnée personnelle (pas de
  // nom, pas d'e-mail) n'entre dans ce résumé.
  const shareXp = document.getElementById('share-card-xp');
  if (shareXp) shareXp.textContent = `${totalXp} XP`;
  const shareModules = document.getElementById('share-card-modules');
  if (shareModules) shareModules.textContent = `${startedLabel} modules`;
  const shareDays = document.getElementById('share-card-days');
  if (shareDays) shareDays.textContent = `${activeDays} jour${activeDays === 1 ? '' : 's'} actif${activeDays === 1 ? '' : 's'}`;
}

// Lot 9 (maquette "Mes progrès") : les 3 badges existaient déjà dans le
// HTML mais n'étaient reliés à aucune logique — ils restaient verrouillés
// pour toujours, quoi que l'apprenant fasse. Chaque condition ci-dessous
// réutilise un signal déjà réel et déjà affiché ailleurs (statut de module,
// quiz validé, entrées de Journal) — jamais une progression inventée.
function renderBadges() {
  const row = document.getElementById('badge-foundations')?.closest('.badge-row');
  if (!row) return;
  const badges = [
    { id: 'badge-foundations', unlocked: DDALearning.moduleStatus(DDA.curriculum, 'M0', prototypeState) === DDALearning.MODULE_STATUS.COMPLETED },
    { id: 'badge-risk', unlocked: DDALearning.getLessonProgress(prototypeState, 'P2.1').quizComplete && DDALearning.getLessonProgress(prototypeState, 'P2.2').quizComplete },
    { id: 'badge-discipline', unlocked: (prototypeState.journal?.entries || []).length >= 3 }
  ];
  let unlockedCount = 0;
  badges.forEach(badge => {
    const el = document.getElementById(badge.id);
    if (!el) return;
    el.classList.toggle('is-unlocked', badge.unlocked);
    const use = el.querySelector('.icon use');
    if (use) use.setAttribute('href', badge.unlocked ? '#icon-award' : '#icon-lock');
    if (badge.unlocked) unlockedCount += 1;
  });
  const note = document.getElementById('badges-note');
  if (note) {
    note.innerHTML = unlockedCount === badges.length
      ? '<svg class="icon"><use href="#icon-award"/></svg> Les 3 badges sont débloqués — bravo pour cette régularité.'
      : `<svg class="icon"><use href="#icon-compass"/></svg> ${unlockedCount}/${badges.length} badge${unlockedCount > 1 ? 's' : ''} débloqué${unlockedCount > 1 ? 's' : ''} · valide tes prochaines missions pour débloquer les autres`;
  }
}

function shareCardText() {
  const xp = document.getElementById('share-card-xp')?.textContent || '0 XP';
  const modules = document.getElementById('share-card-modules')?.textContent || '';
  const link = new URL('index.html', location.href).href;
  return `${xp} sur DDA (Darius Digital Academy) — ${modules} amorcés. Apprendre les marchés, construire des compétences, prouver sa progression : ${link}`;
}
document.getElementById('progress-share-open')?.addEventListener('click', () => {
  document.getElementById('share-card-confirmation').hidden = true;
  document.getElementById('share-card-layer').hidden = false;
  document.getElementById('share-card-close')?.focus();
});
document.getElementById('share-card-close')?.addEventListener('click', () => {
  document.getElementById('share-card-layer').hidden = true;
  document.getElementById('progress-share-open')?.focus();
});
document.getElementById('share-card-layer')?.addEventListener('click', event => { if (event.target.id === 'share-card-layer') document.getElementById('share-card-close').click(); });
document.getElementById('share-card-action')?.addEventListener('click', async () => {
  const text = shareCardText();
  const confirmation = document.getElementById('share-card-confirmation');
  try {
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      confirmation.textContent = 'Texte copié — colle-le où tu veux le partager.';
      confirmation.hidden = false;
    }
    prototypeState = DDA.track(prototypeState, 'progress_card_shared', {});
  } catch (_) { /* partage annulé ou indisponible — pas d'erreur bloquante */ }
});
document.getElementById('share-card-copy')?.addEventListener('click', async () => {
  const confirmation = document.getElementById('share-card-confirmation');
  try {
    await navigator.clipboard.writeText(shareCardText());
    confirmation.textContent = 'Texte copié — colle-le où tu veux le partager.';
    confirmation.hidden = false;
    prototypeState = DDA.track(prototypeState, 'progress_card_shared', {});
  } catch (_) { /* clipboard indisponible sur cet appareil */ }
});

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

  const name = prototypeState.user?.name || 'Apprenant';
  const event = [...(prototypeState.events || [])].reverse().find(e => e.name === 'quiz_complete');
  const date = event ? new Date(event.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  document.getElementById('certificate-name').textContent = name;
  document.getElementById('certificate-module').textContent = `${activeLessonMeta.module.title} — ${activeLessonDef.title}`;
  document.getElementById('certificate-date').textContent = date ? `Complété le ${date}` : 'Complété localement';
}

// ---------- Journal & Plan ----------
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
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
      .map(([field, label]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(entry[field])}</dd></div>`)
      .join('');
    const sourceView = entry.sourceLesson === 'M0.2' ? 'lesson-m02' : '';
    const proofMeta = entry.terminalSource ? `<div class="journal-proof-meta"><strong>Preuve pédagogique</strong><span>${escapeHtml(learnerLessonTitle(entry.sourceLesson))} · ${escapeHtml(entry.proofType === 'zone_identification' ? 'Identification de zone' : 'Pratique guidée')}</span>${sourceView ? `<button type="button" class="text-action journal-proof-source" data-view="${sourceView}">Revoir la leçon <span>→</span></button>` : ''}</div>` : '';
    const snippet = entry.decision || entry.scenario || entry.context || 'Aucun détail renseigné.';
    const entryNumber = String(entries.length - idx).padStart(2, '0');
    return `
      <li class="journal-entry-card">
        <details>
          <summary>
            <span class="journal-entry-index">${entryNumber}</span>
            <span class="journal-entry-market">${escapeHtml(entry.market || 'Sans marché précisé')}</span>
            <span class="journal-entry-date">${escapeHtml(formatJournalDate(entry.createdAt))}</span>
            <span class="journal-entry-snippet">${escapeHtml(snippet.slice(0, 90))}</span>
          </summary>
          <div class="journal-entry-detail">
            ${proofMeta}
            <dl>${detailRows || '<div><dd>Aucun détail renseigné.</dd></div>'}</dl>
            <div class="journal-entry-actions">
              <button class="secondary-action dark-action journal-entry-edit" data-id="${escapeHtml(entry.id)}" type="button">Modifier</button>
              <button class="text-action journal-entry-delete" data-id="${escapeHtml(entry.id)}" type="button">Supprimer</button>
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
  const premium = canUnlock('premium_track');
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
  if (canUnlock('premium_track')) trackEvent('premium_review_opened', { proof: 'weekly-review' });
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
// WCAG keyboard affordance for the two scrollable lesson rails. They are
// informational, but their overflow must not hide the remaining steps from a
// keyboard-only learner. The handler is delegated because lesson markup is
// mounted from the curriculum after boot.
document.addEventListener('keydown', event => {
  const rail = event.target.closest?.('.lesson-loop, .lesson-outline');
  if (!rail || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  const horizontal = rail.classList.contains('lesson-loop') && window.matchMedia('(max-width: 720px)').matches;
  const amount = horizontal ? Math.max(160, Math.round(rail.clientWidth * 0.8)) : Math.max(120, Math.round(rail.clientHeight * 0.8));
  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    rail.scrollTo({ left: horizontal && event.key === 'End' ? rail.scrollWidth : 0, top: !horizontal && event.key === 'End' ? rail.scrollHeight : 0, behavior: 'smooth' });
    return;
  }
  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
  const relevant = horizontal ? ['ArrowLeft', 'ArrowRight'].includes(event.key) : ['ArrowUp', 'ArrowDown'].includes(event.key);
  if (!relevant) return;
  event.preventDefault();
  rail.scrollBy({ left: horizontal ? (forward ? amount : -amount) : 0, top: horizontal ? 0 : (forward ? amount : -amount), behavior: 'smooth' });
});

// Real data only: XP already earned on this lesson, the competency it maps to,
// and the next actionable lesson from the engine — never a fabricated stat.
function renderResultStats(lesson, lessonProgress, statsId) {
  const stats = document.getElementById(statsId);
  if (!stats) return;
  const xp = DDALearning.lessonXp(lesson, lessonProgress);
  const next = DDALearning.nextActionable(DDA.curriculum, prototypeState);
  const nextLabel = next ? `${next.lesson.title} — ${NEXT_STEP_PHRASE[next.step] || 'continuer'}` : 'Prochain module bientôt disponible.';
  const nextViewId = next ? LESSON_VIEW_ID[next.lesson.id] : null;
  const nextCell = nextViewId
    ? `<dd><button class="text-action" type="button" data-view="${nextViewId}">${nextLabel} <span>→</span></button></dd>`
    : `<dd>${nextLabel}</dd>`;
  stats.innerHTML = `
    <div><dt>Compétence</dt><dd>${lesson.competency.label} — niveau confirmé</dd></div>
    <div><dt>XP obtenu sur cette leçon</dt><dd>+${xp} XP</dd></div>
    <div><dt>Prochaine étape</dt>${nextCell}</div>`;
  stats.querySelectorAll('[data-view]').forEach(bindViewButton);
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
  // Keeps the module summary's status labels live (e.g. "À commencer" →
  // "Terminée" the moment this lesson's quiz passes) without waiting for a
  // full showView re-entry. LAB_REGISTRY lessons call this same function but
  // aren't in LESSON_VIEW_ID, so this is a no-op for them (no module-toc
  // container exists on their views either).
  if (LESSON_VIEW_ID[lessonId]) {
    renderModuleToc(LESSON_VIEW_ID[lessonId]);
    renderLessonProgressHead(LESSON_VIEW_ID[lessonId]);
    renderLessonSidecard(LESSON_VIEW_ID[lessonId]);
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

// The sidebar's "Mes Leçons" shortcut (desktop #nav-current-lesson and the
// mobile drawer's #drawer-current-lesson — same behavior, both kept in sync
// here so the hamburger drawer is never a stale copy of the desktop rail),
// corrected: it used to be pinned to the fixed view id "lesson" (always
// M0.1), so once a learner moved on to M0.2/M0.3 it silently sent them back
// to a lesson they had already completed. It now targets whatever
// resolveContinueTarget() honestly reports as current, via the same
// LESSON_VIEW_ID map the Terminal's own primary action uses — one source of
// truth, no second nav engine. The label stays the static "Mes Leçons" (the
// founder's reference maquette wording) — only the real [data-view] target
// changes, exactly like every other nav-item's routing.
function renderNavCurrentLesson(continueTarget) {
  const last = continueTarget ? null : lastAuthoredLesson();
  const lessonId = continueTarget ? continueTarget.lesson.id : last?.lesson.id;
  const viewId = lessonId ? (LESSON_VIEW_ID[lessonId] || 'lesson') : 'lesson';
  ['nav-current-lesson', 'drawer-current-lesson'].forEach(id => {
    const item = document.getElementById(id);
    if (item) item.dataset.view = viewId;
  });
}

// The sidebar's "Exercices & Quiz" shortcut — same current/last lesson target
// as renderNavCurrentLesson above, but it also opens straight onto that
// lesson's real Exercice/Quiz tab (lesson-renderer.js's renderLessonMain):
// data-scroll-to points at that tab's panel id (lesson-panel-exercise, or
// -<suffix> for every lesson after M0.1 — the exact id renderLessonMain
// gives it), and bindViewButton's existing data-scroll-to handling already
// calls revealLessonAnchor(), which opens the tab (activateLessonTab) before
// scrolling to it. A lesson authored with no exercise/quiz blocks (none
// exist today) simply has no such panel — revealLessonAnchor() already
// no-ops safely on a missing id, so this never throws, it just lands on the
// lesson itself. No new exercise/quiz surface is invented: this only opens
// the one that already exists per lesson.
function renderNavCurrentExercise(continueTarget) {
  const last = continueTarget ? null : lastAuthoredLesson();
  const lessonId = continueTarget ? continueTarget.lesson.id : last?.lesson.id;
  const viewId = lessonId ? (LESSON_VIEW_ID[lessonId] || 'lesson') : 'lesson';
  const entry = lessonId ? LESSON_REGISTRY.find(e => e.id === lessonId) : null;
  const panelSuffix = entry?.suffix ? `-${entry.suffix}` : '';
  ['nav-current-exercise', 'drawer-current-exercise'].forEach(id => {
    const item = document.getElementById(id);
    if (!item) return;
    item.dataset.view = viewId;
    item.dataset.scrollTo = `lesson-panel-exercise${panelSuffix}`;
  });
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
  document.getElementById('terminal-meta-module').textContent = continueTarget.module.title;
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
    indexEl.textContent = 'PARCOURS DISPONIBLE · LEÇONS VALIDÉES';
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
      secondary.innerHTML = `Revoir « ${learnerLessonTitle(last.lesson)} » <span>→</span>`;
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
  row.innerHTML = marketDemo().indices.map((item, i) => `
    <div class="terminal-mi-idx">
      <div class="top"><b>${item.label}</b><span class="badge"><svg class="icon"><use href="#icon-blocked"/></svg>Mode pédagogique</span></div>
      ${candlestickSpark(i)}
    </div>`).join('');
}

// Terminal d'analyse — only deterministic, pedagogical series are rendered.
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
    context: `Observation du Terminal d’analyse — timeframe ${state.timeframe}. Série pédagogique locale contrôlée, sans cotation en temps réel.`,
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
    trackEvent('practice_attempted', { practice: 'm02-zone-identification', status });
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
  el.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = `« ${trimmed || 'Entrée enregistrée sans détail.'} »`;
  const small = document.createElement('small');
  small.textContent = `${entry.market || 'Sans marché précisé'} — ${formatJournalDate(entry.createdAt)}`;
  p.appendChild(small);
  el.appendChild(p);
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
    el.textContent = 'Ton accès Premium est présenté en démonstration — ouvre l’atelier Ressources Premium ou l’aperçu de certification pour voir ce qu’il débloque réellement dès aujourd’hui.';
    return;
  }
  const next = DDALearning.nextActionable(DDA.curriculum, prototypeState);
  el.textContent = next
    ? `Continuer « ${learnerLessonTitle(next.lesson)} » sur DDA Free — Premium reste disponible en aperçu quand tu voudras l’explorer.`
    : 'Tu as validé les leçons disponibles sur DDA Free — ouvre l’aperçu Premium ci-dessus pour voir ce qu’il débloque dès aujourd’hui.';
}

// M0 completion must distinguish a real Free → Premium handoff from a normal
// next-lesson transition. The destination remains the same guarded M1.1 view;
// only the action language changes so a Free learner knows M0 is complete and
// that the next click opens an honest Premium preview rather than a broken
// lesson.
function renderM0CompletionCta() {
  const cta = document.querySelector('#result-card-m3 .result-action[data-view="lesson-m11"]');
  if (!cta) return;
  const premium = canUnlock('premium_track');
  cta.innerHTML = premium
    ? 'Continuer vers Pourquoi les prix évoluent ? <span>→</span>'
    : 'Découvrir l’aperçu Premium : Pourquoi les prix évoluent ? <span>→</span>';
  cta.dataset.m0CompletionAccess = premium ? 'premium' : 'free';
}

function renderState() {
  const name = prototypeState.user?.name || 'Apprenant';
  const initials = prototypeState.user?.name
    ? name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
    : 'A';
  const activeLessonProgress = DDALearning.getLessonProgress(prototypeState, activeLessonId);
  const xp = DDALearning.totalXp(DDA.curriculum, prototypeState);
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
  // Header user chip (topbar-user): a second, independent on-screen copy of
  // the same name/initials the sidebar profile chip already shows — never a
  // second source of truth. [data-profile-name]/[data-profile-avatar] lets
  // both update from this one assignment without colliding ids.
  document.querySelectorAll('[data-profile-name]').forEach(node => { node.textContent = name; });
  document.querySelectorAll('[data-profile-avatar]').forEach(node => { node.textContent = initials; });
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
      ? `Objectif : ${prototypeState.onboarding.goal}. Prochaine étape : terminer « ${learnerLessonTitle(continueTarget.lesson)} ».`
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
  renderDashboardProof(continueTarget, curriculumComplete);
  renderDashboardWeekAhead(continueTarget);
  renderDariusAnalysisTerminal();
  renderTerminalJournalNote();
  renderTerminalSkillmap(continueTarget);

  renderMasteryList();
  renderPracticeProof();
  renderProgressNextStep();
  renderProgressHero();
  renderBadges();
  renderCertificatePreview(activeLessonProgress);
  renderJournalList();
  renderWeeklyReview();
  renderJournalPlan();

  renderNavCurrentLesson(continueTarget);
  renderNavCurrentExercise(continueTarget);

  // Restore every mounted lesson's progress UI from stored state — one
  // registry-driven loop covers all of them, ids derived from lessonUiIds.
  mountedLessons.forEach(entry => renderLessonProgressUI(entry.id, entry.meta.lesson, lessonUiIds(entry)));
  renderM0CompletionCta();

  // Lot — Signup coherence: the resume/erase nudge is for a RETURNING
  // learner who opens #access while a prior session already exists. Once
  // the learner has reached step 2 of the current visit's own signup flow
  // (onboarding-form revealed), prototypeState.user was just created by
  // that same flow seconds ago — showing "a progression already exists,
  // resume or erase it?" right under the active "Construire mon parcours"
  // button is false and confusing, and risks a first-time learner erasing
  // the account they are actively creating.
  document.getElementById('resume-device').hidden = !prototypeState.user || !document.getElementById('onboarding-form').hidden;
  document.body.classList.toggle('low-data', Boolean(prototypeState.preferences.lowData));

  const premium = prototypeState.membership?.plan === 'premium';
  const hasProfile = Boolean(prototypeState.user);
  document.getElementById('profile-form').hidden = !hasProfile;
  document.querySelector('.preference-panel').hidden = !hasProfile;
  document.getElementById('empty-profile').hidden = hasProfile;
  document.getElementById('profile-large-avatar').textContent = initials;
  document.getElementById('profile-heading-name').textContent = name;
  document.getElementById('profile-heading-email').textContent = remoteUser?.email || prototypeState.user?.email || 'Compte local';
  document.getElementById('profile-storage-scope').textContent = remoteUser ? 'Compte DDA' : 'Profil sur cet appareil';
  document.querySelector('.profile-chip small').textContent = remoteUser ? 'Mon profil (compte)' : 'Mon profil (appareil)';
  document.getElementById('profile-storage-disclosure').textContent = remoteUser
    ? 'Les informations de profil et la progression des leçons sont rattachées à ton compte DDA. Le Journal, le Terminal, les préférences et l’historique DDA AI restent sur cet appareil, isolés par compte et non synchronisés.'
    : 'Sans compte connecté, tes données restent sur cet appareil. Une mesure d’audience pseudonyme peut aider à comprendre comment les visiteurs découvrent DDA ; elle ne contient ni ton nom ni ton e-mail.';
  const importNotice = document.getElementById('profile-import-notice');
  if (importNotice) {
    const candidate = remoteUser ? DDA.readUnscopedProgressCandidate?.() : null;
    importNotice.hidden = !candidate || hasImportedUnscopedProgress(remoteUser?.user_id);
  }
  const logoutButton = document.getElementById('profile-logout');
  if (logoutButton) logoutButton.hidden = !remoteUser;
  document.getElementById('profile-first-name').value = hasProfile ? name : '';
  document.getElementById('profile-error').textContent = '';
  if (hasProfile) {
    const persistenceStatus = document.getElementById('profile-persistence-status');
    const remoteAccount = Boolean(window.DDABFF?.enabled() && remoteUser);
    if (persistenceStatus) {
      const storageReady = DDA.storageAvailable();
      persistenceStatus.textContent = remoteAccount
        ? (storageReady
            ? 'Leçons et onboarding liés à ton compte · Journal, Terminal, préférences et réponses sur cet appareil'
            : 'Leçons et onboarding liés à ton compte · stockage local indisponible pour tes autres données')
        : (storageReady
            ? 'Progression locale · enregistrée sur cet appareil'
            : 'Progression en mémoire · stockage local indisponible');
      persistenceStatus.classList.toggle('is-warning', !storageReady);
    }
    document.getElementById('profile-plan-badge').textContent = premium ? 'DDA Premium · démonstration locale' : 'DDA Free';
    document.getElementById('profile-level').value = prototypeState.onboarding?.level || 'Débutant';
    document.getElementById('profile-goal').value = prototypeState.onboarding?.goal || 'Comprendre les marchés';
    document.getElementById('profile-time').value = prototypeState.onboarding?.time || '10 minutes par jour';
  }
  document.getElementById('profile-low-data').checked = Boolean(prototypeState.preferences.lowData);
  document.getElementById('profile-reminders').checked = Boolean(prototypeState.preferences.reminders);
  const count = prototypeState.events?.length || 0;
  document.getElementById('event-count').textContent = `${count} événement${count > 1 ? 's' : ''}`;

  document.getElementById('sidebar-plan').textContent = premium ? 'Premium · démo locale' : 'DDA Free';
  document.querySelectorAll('[data-profile-role]').forEach(node => { node.textContent = premium ? 'Apprenant Premium' : 'Apprenant'; });
  document.getElementById('membership-status').textContent = premium ? 'DDA Premium · démonstration locale' : 'DDA Free';
  const membershipStatusNote = document.getElementById('membership-status-note');
  if (membershipStatusNote) membershipStatusNote.textContent = premium ? 'Sur cet appareil uniquement · aucun abonnement ni droit serveur' : 'Disponible maintenant · aucun achat actif';
  document.getElementById('free-plan-state').textContent = premium ? 'Inclus avec Premium' : 'Formule active';
  document.getElementById('preview-premium').hidden = premium;
  document.getElementById('revert-free').hidden = !premium;
  document.querySelector('.current-plan').classList.toggle('is-included', premium);
  document.querySelector('.premium-plan').classList.toggle('is-active', premium);
  document.querySelectorAll('.premium-gate').forEach(button => {
    button.textContent = premium ? 'Ouvrir l’atelier' : 'Voir l’aperçu Premium';
  });
  const waitlistJoined = Boolean(prototypeState.premiumWaitlist?.joined);
  const waitlistForm = document.getElementById('premium-waitlist-form');
  const waitlistConfirmation = document.getElementById('premium-waitlist-confirmation');
  if (waitlistForm) waitlistForm.hidden = waitlistJoined;
  if (waitlistConfirmation) waitlistConfirmation.hidden = !waitlistJoined;
  renderMembershipNextStep(premium);
  renderPremiumState();

  renderPathJourney();
  renderModulesRecap();
  renderLabCatalog();

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

// Navigation audit: a lesson could only go "← Retour" — no way back to the
// specific lesson just before it. Reuses the same prerequisite chain as the
// sequential lock above, so this never claims a "previous lesson" that isn't
// actually the one the lock would send you back to.
(function initLessonPrevLinks() {
  LESSON_VIEW_IDS.forEach(viewId => {
    const prerequisiteLessonId = LESSON_PREREQUISITE[viewId];
    const prevViewId = prerequisiteLessonId && LESSON_VIEW_ID[prerequisiteLessonId];
    if (!prevViewId) return;
    const quickNav = document.getElementById(viewId)?.querySelector('.lesson-quick-nav');
    if (!quickNav || quickNav.querySelector('[data-lesson-prev]')) return;
    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'text-action';
    prevButton.dataset.view = prevViewId;
    prevButton.dataset.lessonPrev = 'true';
    prevButton.textContent = '← Leçon précédente';
    const backLink = quickNav.querySelector('.back-link');
    if (backLink) backLink.after(prevButton); else quickNav.appendChild(prevButton);
    bindViewButton(prevButton);
  });
})();

// Navigation audit follow-up: from inside a lesson, the only way to see the
// module's other lessons was to leave the lesson entirely (Mon parcours).
// Renders into the static .module-toc container each LESSON_REGISTRY lesson
// view already has (see academy.html) — grouped by the id prefix before the
// dot ('M0.2' → 'M0', 'P2.1' → 'P2'), the same grouping DDA.curriculum.modules
// uses for M0/M1; P2 has no curriculum module of its own (the premium track
// lives outside DDA.curriculum by design), so its heading is named directly
// rather than invented from a non-existent module record.
function moduleGroupLabel(moduleKey) {
  if (moduleKey === 'P2') return 'Premium Track';
  return DDA.curriculum.modules.find(module => module.id === moduleKey)?.title || moduleKey;
}
function moduleTocLessonStatus(entry) {
  if (entry.prerequisite && !DDALearning.getLessonProgress(prototypeState, entry.prerequisite).quizComplete) return { label: 'Verrouillée', key: 'locked' };
  const progress = DDALearning.getLessonProgress(prototypeState, entry.id);
  if (progress.quizComplete) return { label: 'Terminée', key: 'done' };
  if (progress.exerciseComplete || progress.lessonViewed) return { label: 'En cours', key: 'in_progress' };
  return { label: 'À commencer', key: 'available' };
}
// Shared by renderModuleToc, which fills academy.html's static .module-toc
// container (every M0/M1/P2/MBRVM.1 lesson view has one — the only inventory
// below the 860px breakpoint, and still the only one MBRVM.1 ever gets, since
// it has no sidecard), and renderLessonSidecard, which embeds this same list
// a second time inside the right-hand "Module en cours" card — the one that
// actually shows once the viewport is wide enough for .module-toc to be
// hidden in CSS. See the "Lesson Experience — single module inventory" note
// below for the full breakpoint rationale.
//
// `variant` picks the markup's classes/navigation hook: default (used by
// .module-toc) keeps the original module-toc-item/-link/-status classes and
// a real data-view attribute, bound through bindViewButton exactly as
// before. 'sidecard' renders the identical list under sidecard-toc-*
// classes instead (styled the same — see styles.css — but a distinct
// selector, so a learner's-eye-view count like "how many lessons does this
// module summary list" never double-counts both copies at once) and uses
// data-sidecard-view, the same non-colliding hook the card's own CTA
// buttons already use, specifically so a generic `[data-view="lesson-pXX"]`
// locator elsewhere in the DOM (the .module-toc copy, hidden but still
// present at this breakpoint) can never be the one a `.last()`-style click
// accidentally resolves to.
function moduleTocListMarkup(viewId, siblings, variant) {
  const sidecard = variant === 'sidecard';
  const itemClass = sidecard ? 'sidecard-toc-item' : 'module-toc-item';
  const linkClass = sidecard ? 'sidecard-toc-link' : 'module-toc-link';
  const statusClass = sidecard ? 'sidecard-toc-status' : 'module-toc-status';
  const viewAttr = sidecard ? 'data-sidecard-view' : 'data-view';
  return siblings.map(sibling => {
    const status = moduleTocLessonStatus(sibling);
    const isCurrent = sibling.viewId === viewId;
    const disabled = status.key === 'locked' && !isCurrent;
    return `<li class="${itemClass}${isCurrent ? ' is-current' : ''}"><button type="button" class="${linkClass}" ${viewAttr}="${sibling.viewId}"${disabled ? ' disabled aria-disabled="true"' : ''}${isCurrent ? ' aria-current="page"' : ''}>${escapeHtml(sibling.title)}</button><span class="${statusClass}" data-status="${status.key}">${status.label}</span></li>`;
  }).join('');
}
function renderModuleToc(viewId) {
  const root = document.getElementById(viewId);
  const list = root?.querySelector('.module-toc-list');
  const heading = root?.querySelector('.module-toc-heading');
  if (!list || !heading) return;
  const lessonId = VIEW_TO_LESSON_ID[viewId];
  const moduleKey = lessonId?.split('.')[0];
  const siblings = LESSON_REGISTRY.filter(entry => entry.id.split('.')[0] === moduleKey);
  if (siblings.length < 2) { heading.textContent = ''; list.innerHTML = ''; return; }
  heading.textContent = moduleGroupLabel(moduleKey);
  list.innerHTML = moduleTocListMarkup(viewId, siblings);
  list.querySelectorAll('[data-view]:not([disabled])').forEach(bindViewButton);
}

// Lesson Experience V3 (founder mockup pass): a breadcrumb + "% of module
// complete" strip above the player, and a right-hand module card below the
// lesson outline — both derived from the exact same LESSON_REGISTRY/
// DDALearning data `renderModuleToc` already uses, never new fabricated
// numbers. Scoped to the 8 LESSON_REGISTRY views (M0/M1/P2) that already
// have a `-progress-head`/`-sidecard` mount point in academy.html; DDA Lab
// lessons keep their own existing chrome untouched.
//
// Lesson Experience — single module inventory (design audit, Lot C): these 8
// views used to ALSO render the static .module-toc block from academy.html
// (via renderModuleToc) directly under the breadcrumb — a second, full-width
// "here are this module's lessons" list duplicating what this card already
// shows, visible at the same time on the same page on wide viewports.
// renderLessonSidecard now folds that same itemized, click-to-jump list
// (moduleTocListMarkup's 'sidecard' variant — same data, same status
// labels, distinct classes and a data-sidecard-view hook instead of
// data-view, so it can never collide with the still-present .module-toc
// copy's own `[data-view]` buttons) into its own markup below the ring
// recap, and styles.css hides academy.html's static .module-toc (min-width:860px, the same
// breakpoint .lesson-outline/.lesson-sidecard itself becomes visible at) so
// only one copy ever shows at a time. Below that breakpoint the sidecard is
// `display:none` (existing, unrelated-to-this-fix rule) and .module-toc is
// the only inventory — i.e. on mobile/tablet nothing changed: it is still
// rendered by renderModuleToc exactly as before, just no longer also shown
// next to a visible sidecard on desktop. MBRVM.1 has no sidecard at all, so
// its .module-toc is never hidden and renderModuleToc keeps rendering it at
// every width. Nothing is lost: the quick-nav's "← Leçon précédente" link (a
// distinct feature — a jump to a specific prior lesson, not an index) was
// never part of .module-toc and still lives in .lesson-quick-nav, unchanged.
function moduleSiblingsFor(viewId) {
  const lessonId = VIEW_TO_LESSON_ID[viewId];
  const moduleKey = lessonId?.split('.')[0];
  if (!moduleKey) return null;
  const siblings = LESSON_REGISTRY.filter(entry => entry.id.split('.')[0] === moduleKey);
  return { moduleKey, siblings, lessonId };
}
function renderLessonProgressHead(viewId) {
  const head = document.getElementById(`${viewId}-progress-head`);
  if (!head) return;
  const info = moduleSiblingsFor(viewId);
  if (!info) { head.innerHTML = ''; return; }
  const { moduleKey, siblings } = info;
  const current = siblings.find(s => s.viewId === viewId);
  const doneCount = siblings.filter(s => moduleTocLessonStatus(s).key === 'done').length;
  const percent = siblings.length ? Math.round((doneCount / siblings.length) * 100) : 0;
  head.innerHTML = `
    <nav class="lesson-breadcrumb" aria-label="Fil d’Ariane">
      <button type="button" class="lesson-breadcrumb-link" data-sidecard-view="path">Mon parcours</button>
      <span aria-hidden="true">›</span>
      <span class="lesson-breadcrumb-current">${escapeHtml(moduleGroupLabel(moduleKey))}</span>
      <span aria-hidden="true">›</span>
      <span class="lesson-breadcrumb-current" aria-current="page">${escapeHtml(current?.title || '')}</span>
    </nav>
    <div class="lesson-module-progress" role="group" aria-label="Progression du module">
      <span class="lesson-module-progress-label">${percent}% du module complété</span>
      <span class="lesson-module-progress-bar"><span style="width:${percent}%"></span></span>
    </div>`;
  head.querySelectorAll('[data-sidecard-view]').forEach(button => {
    button.addEventListener('click', () => showView(button.dataset.sidecardView));
  });
}
function renderLessonSidecard(viewId) {
  const card = document.getElementById(`${viewId}-sidecard`);
  if (!card) return;
  const info = moduleSiblingsFor(viewId);
  if (!info) { card.innerHTML = ''; return; }
  const { moduleKey, siblings } = info;
  const current = siblings.find(s => s.viewId === viewId);
  const doneCount = siblings.filter(s => moduleTocLessonStatus(s).key === 'done').length;
  const percent = siblings.length ? Math.round((doneCount / siblings.length) * 100) : 0;
  // Honesty mandate: a total duration is only shown when EVERY sibling lesson
  // actually declares one in LESSON_REGISTRY (today: only P2.1/P2.2) — never
  // an invented number for M0/M1, which have no authored duration data.
  const allDurations = siblings.every(s => Number.isFinite(s.duration));
  const totalMinutes = allDurations ? siblings.reduce((sum, s) => sum + s.duration, 0) : null;

  // The itemized, click-to-jump list of every sibling lesson (with its live
  // status) also renders as academy.html's static .module-toc block, filled
  // by renderModuleToc — at narrow widths (<860px) that is the only copy a
  // learner sees, since this whole card is display:none there. From 860px up
  // the card becomes visible too, so styles.css hides .module-toc there and
  // this embedded copy (moduleTocListMarkup's 'sidecard' variant — same
  // data, same styling, distinct classes/nav hook) becomes the one a
  // learner sees instead — never both at once. See the long note above
  // moduleSiblingsFor for the full breakpoint rationale.
  const siblingList = siblings.length > 1 ? `
      <ol class="sidecard-toc-list lesson-sidecard-module-list">${moduleTocListMarkup(viewId, siblings, 'sidecard')}</ol>` : '';

  const recap = `
    <div class="lesson-sidecard-recap">
      <p class="eyebrow">Module en cours</p>
      <h3>${escapeHtml(moduleGroupLabel(moduleKey))}</h3>
      <div class="lesson-sidecard-recap-row">
        <div class="progress-ring lesson-sidecard-ring" style="--progress:${percent}"><strong>${percent}%</strong></div>
        <ul class="lesson-sidecard-recap-facts">
          <li>${siblings.length} leçon${siblings.length > 1 ? 's' : ''}</li>
          ${totalMinutes != null ? `<li>${totalMinutes} min au total</li>` : ''}
        </ul>
      </div>${siblingList}
    </div>`;

  const quiz = current?.quizBlock ? `
    <div class="lesson-sidecard-cta">
      <p class="eyebrow gold">Vérifier ta compréhension</p>
      <p>Le quiz de cette leçon valide ce que tu viens d’apprendre.</p>
      <button type="button" class="secondary-action" data-scroll-anchor="${escapeHtml(current.quizBlock)}-block">Aller au quiz de la leçon <span>→</span></button>
    </div>` : '';

  const premium = prototypeState.membership?.plan !== 'premium' ? `
    <div class="lesson-sidecard-cta lesson-sidecard-premium">
      <p class="eyebrow gold">DDA Premium</p>
      <p>Débloque le Practice Lab, l’assessment guidé et le suivi complet de ta progression.</p>
      <button type="button" class="secondary-action" data-sidecard-view="membership">Découvrir Premium <span>→</span></button>
    </div>` : '';

  const next = LESSON_REGISTRY.find(entry => entry.prerequisite === current?.id);
  const nextButton = next
    ? `<button type="button" class="primary-action lesson-sidecard-next" data-sidecard-view="${next.viewId}">Leçon suivante : ${escapeHtml(next.title)} <span>→</span></button>`
    : `<button type="button" class="secondary-action lesson-sidecard-next" data-sidecard-view="path">Retourner à mon parcours <span>→</span></button>`;

  card.innerHTML = `${recap}${quiz}${premium}${nextButton}`;
  // Deliberately data-sidecard-view, not the generic [data-view] bindViewButton
  // wires everywhere else: academy.html's static .module-toc (hidden by CSS
  // at this breakpoint, but still physically present in the DOM for narrower
  // viewports) already owns every real `[data-view="lesson-pXX"]` match on
  // the page, and this card's own navigation — the embedded sibling list
  // included (moduleTocListMarkup's 'sidecard' variant) — must never
  // silently become a second match a `.last()`-style locator could resolve
  // to instead of the one that's actually visible. Same showView() call
  // either way, just a separate, non-colliding hook, covering every button
  // this card renders: the sibling-lesson list and the quiz/premium/next
  // exits alike.
  card.querySelectorAll('[data-sidecard-view]').forEach(button => {
    button.addEventListener('click', () => showView(button.dataset.sidecardView));
  });
  card.querySelectorAll('[data-scroll-anchor]').forEach(button => {
    button.addEventListener('click', () => {
      revealLessonAnchor(button.dataset.scrollAnchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
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
  const metaEl = document.getElementById('gate-meta');
  const objectivesEl = document.getElementById('gate-objectives');

  if (eyebrowEl) eyebrowEl.textContent = options.eyebrow || 'DDA Premium';
  if (titleEl) titleEl.textContent = options.title || 'Cette expérience sera disponible avec Premium.';
  if (descEl) descEl.textContent = options.description || 'Aucun achat ni paiement réel n’est proposé ici.';
  // Paywall honnête (mandat §5) : une leçon Premium verrouillée identifiée
  // montre sa durée et ses objectifs réels — jamais juste "réservé à Premium".
  if (metaEl) {
    metaEl.hidden = !options.duration;
    metaEl.textContent = options.duration ? `${options.duration} min` : '';
  }
  if (objectivesEl) {
    const objectives = Array.isArray(options.objectives) ? options.objectives : [];
    objectivesEl.hidden = objectives.length === 0;
    objectivesEl.innerHTML = objectives.map(item => `<li>${item}</li>`).join('');
  }
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

// Paywall honnête (mandat §5) : titre, durée et objectifs réels d'une
// leçon Premium verrouillée — jamais juste "réservé à Premium". Lit
// LESSON_REGISTRY (P2.1/P2.2) puis LAB_REGISTRY (LAB4/LABCAP, dont les
// métadonnées vivent dans window.DDALab — jamais recopiées ici).
function lessonGateInfo(viewId) {
  const lesson = LESSON_REGISTRY.find(entry => entry.viewId === viewId && entry.permission === 'premium_track');
  if (lesson) {
    return { title: lesson.title, duration: lesson.duration || null, objectives: lesson.objectives || [], premiumReason: lesson.premiumReason || '' };
  }
  const lab = LAB_REGISTRY.find(entry => entry.viewId === viewId && entry.permission === 'premium_track');
  if (lab) {
    const labLesson = lab.meta?.lesson;
    return {
      title: labLesson?.title || titles[viewId] || '',
      duration: labLesson?.estimatedMinutes || null,
      objectives: labLesson?.summary ? [labLesson.summary] : [],
      premiumReason: 'Premium donne accès au projet final évalué et à la suite du parcours DDA Lab.'
    };
  }
  return null;
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
  if (window.DDALazyModules?.needs(id) && !window.DDALazyModules.isReady(id)) {
    window.DDALazyModules.ensure(id).then(() => showView(id, recordEvent, historyMode)).catch(error => {
      console.error(error);
      showToast('Cette section est momentanément indisponible.');
    });
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
  const prerequisiteLessonId = LESSON_PREREQUISITE[id] || LAB_PREREQUISITE[id];
  if (prerequisiteLessonId && !DDALearning.getLessonProgress(prototypeState, prerequisiteLessonId).quizComplete) {
    showToast('Cette leçon se débloque après la validation de l’étape précédente.');
    id = LAB_PREREQUISITE[id] ? 'lab' : 'path';
  }
  const permission = viewPermissions[id];
  if (permission && LESSON_PREVIEW_VIEW_IDS.has(id) && !canUnlock(permission)) {
    // Preview lesson: a Free learner reads it exactly like any Free lesson —
    // the permission is intentionally not enforced here.
  } else if (permission && !canUnlock(permission)) {
    prototypeState = DDA.track(prototypeState, 'access_denied', { view: id, permission, plan: prototypeState.membership?.plan || 'visitor' });
    if (!prototypeState.user) {
      showToast('Termine ton inscription pour accéder à cette section.');
      id = 'access';
    } else {
      const fallbackView = currentView && currentView !== id && titles[currentView] ? currentView : 'path';
      showView(fallbackView, false);
      const isPremiumTrack = permission === 'premium_track';
      const lessonInfo = lessonGateInfo(id);
      openGate({
        eyebrow: isPremiumTrack ? 'DDA Premium · P2' : 'DDA Premium · M1+',
        title: lessonInfo ? `« ${lessonInfo.title} » est une leçon Premium.` : 'Ce module est réservé à DDA Premium.',
        description: lessonInfo
          ? lessonInfo.premiumReason
          : (isPremiumTrack
            ? 'DDA Free peut voir l’aperçu, mais le contenu P2 complet est disponible uniquement dans la démonstration Premium locale. Aucun paiement réel — active l’aperçu pour explorer ce module.'
            : 'DDA Free donne accès au module M0 Fondations. Les modules M1 et suivants sont réservés à DDA Premium. Aucun paiement réel — active l’aperçu pour explorer ce module.'),
        duration: lessonInfo?.duration || null,
        objectives: lessonInfo?.objectives || [],
        canUnlock: true,
        unlockText: 'Activer l’aperçu Premium (simulation)',
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
  // The inline boot script sets data-boot-view once from the URL hash present
  // at initial parse, purely to hide chrome (.mobile-nav/.sidebar/.topbar) or
  // force a specific view visible (e.g. html[data-boot-view="lab"] #lab) during
  // the first-paint flash. It never updates again on its own, so once the SPA
  // router takes over it must keep this attribute in sync with the real active
  // view — otherwise the view whose id matched the boot hash stays forced
  // display:block (or chrome stays hidden) for the rest of the session, even
  // long after the router has moved on to a different view, stacking that
  // stale view's full height above the real one.
  document.documentElement.setAttribute('data-boot-view', id);
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
  contextTitle.textContent = titles[id] || 'DDA';
  const sectionLabel = VIEW_SECTION[id];
  contextSection.textContent = sectionLabel || '';
  contextSection.hidden = !sectionLabel;
  const navigationMode = historyMode === 'auto' ? (recordEvent ? 'push' : 'replace') : historyMode;
  writeDdaHistory(id, navigationMode);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id !== currentView) {
    previousView = currentView;
    storePreviousView(previousView);
    currentView = id;
  }
  if (id === 'markets') loadBrvmPublications();
  if (recordEvent) trackEvent('view_opened', { view: id });
  if (recordEvent && VIEW_TO_LESSON_ID[id]) trackEvent('lesson_started', { lesson: VIEW_TO_LESSON_ID[id] });
  if (LESSON_VIEW_IDS.has(id)) {
    renderModuleToc(id);
    renderLessonProgressHead(id);
    renderLessonSidecard(id);
  }
  if (recordEvent && id === 'premium-track') trackEvent('premium_track_viewed', { view: id });
  if (recordEvent && (id === 'lesson-p21' || id === 'lesson-p22')) trackEvent('premium_module_started', { module: 'P2', lesson: id });
  if (id === 'landing') {
    trackEvent('landing_viewed', {
      source: prototypeState.acquisition?.source,
      medium: prototypeState.acquisition?.medium,
      campaign: prototypeState.acquisition?.campaign,
      content: prototypeState.acquisition?.content
    });
    trackEvent('landing_visit', {
      source: prototypeState.acquisition?.source,
      medium: prototypeState.acquisition?.medium,
      campaign: prototypeState.acquisition?.campaign,
      content: prototypeState.acquisition?.content
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

function renderVideoShelf() {
  const list = document.getElementById('video-shelf-list');
  if (!list) return;
  list.innerHTML = VIDEO_REGISTRY.map(video => `
    <li class="library-entry">
      <div class="resource-icon"><svg class="icon"><use href="#icon-play"/></svg></div>
      <div class="library-entry-body">
        <span class="resource-type">Vidéo · YouTube</span>
        <h2>${video.title}</h2>
        <p>${video.description}</p>
        <ul class="resource-meta" aria-label="Métadonnées de la vidéo"><li>Vidéo courte</li><li>${video.level}</li><li>DDA Free</li></ul>
        <button class="secondary-action dark-action resource-open" data-video="${video.id}">Regarder</button>
      </div>
    </li>`).join('');
}

const resources = {
  checklist: { title: 'Checklist avant une décision', label: 'Guide · DDA Free', body: '<ol><li>Ai-je compris le contexte du marché ?</li><li>Mon scénario est-il écrit clairement ?</li><li>Où mon idée devient-elle invalide ?</li><li>Quel risque suis-je prêt à accepter ?</li><li>Est-ce une décision prévue ou impulsive ?</li><li>Puis-je justifier mon choix sans parler de gain ?</li></ol>' },
  glossary: { title: 'Les mots essentiels du marché', label: 'Glossaire · DDA Free', body: '<dl><dt>Actif</dt><dd>Ce qui est échangé sur un marché.</dd><dt>Acheteur</dt><dd>Participant qui cherche à acquérir un actif.</dd><dt>Vendeur</dt><dd>Participant qui accepte de céder un actif.</dd><dt>Liquidité</dt><dd>Facilité avec laquelle un actif peut être échangé sans déplacer fortement le prix.</dd><dt>Volatilité</dt><dd>Amplitude et rythme des variations observées, sans garantie sur leur direction future.</dd><dt>Spread</dt><dd>Écart entre le prix auquel un acheteur se positionne et celui auquel un vendeur accepte d’échanger.</dd><dt>Invalidation</dt><dd>Condition prévue à l’avance qui indique qu’une hypothèse n’est plus cohérente.</dd><dt>Risque</dt><dd>Part d’incertitude et de perte potentielle à maîtriser avant d’agir.</dd></dl>' }
};

let readerTrigger = null;
renderVideoShelf();
document.getElementById('resources')?.addEventListener('click', event => {
  const button = event.target.closest('.resource-open');
  if (!button) return;
  const label = document.getElementById('reader-label');
  const title = document.getElementById('reader-title');
  const content = document.getElementById('reader-content');
  if (button.dataset.video) {
    const video = VIDEO_REGISTRY.find(v => v.id === button.dataset.video);
    if (!video) return;
    label.textContent = 'Vidéo · DDA Free';
    title.textContent = video.title;
    content.innerHTML = window.DDALessonRenderer.renderYouTubeLite(video, `resource-video-${video.id}`);
  } else {
    const resource = resources[button.dataset.resource];
    if (!resource) return;
    label.textContent = resource.label;
    title.textContent = resource.title;
    content.innerHTML = resource.body;
  }
  readerTrigger = button;
  const reader = document.getElementById('resource-reader');
  reader.hidden = false;
  reader.scrollIntoView({ behavior: prototypeState.preferences.lowData ? 'auto' : 'smooth', block: 'start' });
  document.getElementById('reader-close').focus();
});

// Click-to-load YouTube: the lite block ships only a thumbnail + button
// (lesson-renderer.js). Clicking swaps it for a nocookie iframe — no
// autoplay parameter, so playback only starts once the learner presses
// play a second time, inside the YouTube player itself.
document.addEventListener('click', event => {
  const playButton = event.target.closest('.video-lite-play');
  if (!playButton) return;
  const frame = playButton.closest('.video-lite-frame');
  const ytId = frame?.dataset.youtubeId;
  if (!ytId) return;
  const label = frame.dataset.youtubeTitle || 'Vidéo pédagogique DDA';
  frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${ytId}" title="${label}" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
});
function closeReader() {
  const reader = document.getElementById('resource-reader');
  if (reader.hidden) return;
  reader.hidden = true;
  if (readerTrigger) { readerTrigger.focus(); readerTrigger = null; }
}
document.getElementById('reader-close').addEventListener('click', closeReader);

document.querySelectorAll('.premium-gate').forEach(button => button.addEventListener('click', () => {
  const target = button.dataset.premiumTarget;
  if (canUnlock(button.dataset.permission)) {
    if (target && viewPermissions[target] && !canUnlock(viewPermissions[target])) {
      showView('membership');
      showToast('L’aperçu local ne remplace pas un droit Premium confirmé par le serveur.');
      return;
    }
    if (target) { showView(target); return; }
    showToast('Atelier Premium débloqué en aperçu.');
    return;
  }
  gateTrigger = button;
  prototypeState = DDA.track(prototypeState, 'access_denied', { permission: button.dataset.permission, plan: 'free' });
  const localPreviewAvailable = !window.DDABFF?.enabled();
  openGate({
    eyebrow: 'DDA Premium',
    title: 'Cette expérience sera disponible avec Premium.',
    description: localPreviewAvailable
      ? 'Démonstration pédagogique sur cet appareil uniquement. Aucun achat ni paiement réel n’est proposé.'
      : 'L’accès à cet atelier exige un droit Premium confirmé par le serveur. Aucun paiement réel n’est activé.',
    canUnlock: localPreviewAvailable,
    unlockText: localPreviewAvailable ? 'Essayer la démonstration sur cet appareil' : undefined,
    previewText: 'Voir la formule Premium',
    targetView: target
  });
}));
document.getElementById('gate-unlock')?.addEventListener('click', () => {
  const target = pendingGatedView;
  prototypeState = DDA.setPlan(prototypeState, 'premium');
  prototypeState = DDA.track(prototypeState, 'plan_preview', { plan: 'premium' });
  mountPremiumLessons();
  mountPremiumLabLessons();
  renderState();
  closeGate();
  showToast('Démonstration Premium locale activée · aucun droit serveur.');
  if (target) showView(target);
});
document.getElementById('gate-close')?.addEventListener('click', closeGate);
document.getElementById('gate-layer')?.addEventListener('click', event => { if (event.target.id === 'gate-layer') closeGate(); });
document.getElementById('gate-preview')?.addEventListener('click', () => { closeGate(); showView('membership'); });
// Jamais un blocage sans sortie (mandat §5) : revient explicitement à la
// vue Free déjà affichée sous la fenêtre (showView(fallbackView) a déjà
// tourné avant l'ouverture de cette fenêtre) plutôt que de laisser
// l'apprenant deviner comment en sortir.
document.getElementById('gate-continue-free')?.addEventListener('click', closeGate);

// Liste d'attente Premium (mandat §6) : consentement explicite requis avant
// toute écriture — le bouton reste désactivé jusqu'à la case cochée, et
// rejoindre n'active ni n'implique aucun paiement.
document.getElementById('premium-waitlist-consent')?.addEventListener('change', event => {
  const joinBtn = document.getElementById('premium-waitlist-join');
  if (joinBtn) joinBtn.disabled = !event.target.checked;
});
document.getElementById('premium-waitlist-join')?.addEventListener('click', () => {
  const consent = document.getElementById('premium-waitlist-consent')?.checked === true;
  if (!consent) return;
  prototypeState = DDA.joinPremiumWaitlist(prototypeState, true);
  prototypeState = DDA.track(prototypeState, 'premium_waitlist_joined', { plan: prototypeState.membership?.plan || 'visitor' });
  document.getElementById('premium-waitlist-form').hidden = true;
  document.getElementById('premium-waitlist-confirmation').hidden = false;
});

// Commercial activation mandate (2026-11-14): the real "S'abonner" entry
// point. Asks the BFF for a real Chariow Checkout session and redirects
// there on success — never a simulated transaction. Today (no
// CHARIOW_API_KEY/CHARIOW_PREMIUM_PRODUCT_IDS configured in production) the
// BFF honestly answers "not configured", and this falls back to the exact
// same local waitlist as before — one funnel, not two.
function scrollToPremiumWaitlist() {
  requestAnimationFrame(() => revealLessonAnchor('premium-waitlist-panel')?.scrollIntoView({ behavior: prototypeState.preferences?.lowData ? 'auto' : 'smooth', block: 'start' }));
}
document.getElementById('premium-subscribe-cta')?.addEventListener('click', async () => {
  const button = document.getElementById('premium-subscribe-cta');
  if (!window.DDABFF?.enabled()) { showView('membership'); scrollToPremiumWaitlist(); return; }
  const originalLabel = button.innerHTML;
  button.disabled = true;
  button.innerHTML = 'Préparation du paiement…';
  try {
    const result = await window.DDABFF.startPremiumCheckout();
    if (result.checkoutUrl) { window.location.href = result.checkoutUrl; return; }
    showToast(result.error === 'rate_limited'
      ? 'Trop de tentatives — réessaie dans un instant.'
      : 'Le paiement en ligne n’est pas encore activé. Ton intérêt est enregistré ci-dessous.');
    showView('membership');
    scrollToPremiumWaitlist();
  } catch {
    showToast('Le paiement en ligne n’est pas encore disponible. Ton intérêt est enregistré ci-dessous.');
    showView('membership');
    scrollToPremiumWaitlist();
  } finally {
    button.disabled = false;
    button.innerHTML = originalLabel;
  }
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!document.getElementById('gate-layer').hidden) closeGate();
  else if (!document.getElementById('resource-reader').hidden) closeReader();
  else if (!document.getElementById('journal-composer').hidden) closeJournalComposer();
  else if (!document.getElementById('share-card-layer').hidden) document.getElementById('share-card-close').click();
});
document.getElementById('preview-premium').addEventListener('click', () => {
  prototypeState = DDA.setPlan(prototypeState, 'premium');
  prototypeState = DDA.track(prototypeState, 'plan_preview', { plan: 'premium' });
  mountPremiumLessons();
  mountPremiumLabLessons();
  renderState();
  showToast('Démonstration Premium locale activée · aucun abonnement actif.');
});
document.getElementById('revert-free').addEventListener('click', () => {
  prototypeState = DDA.setPlan(prototypeState, 'free');
  prototypeState = DDA.track(prototypeState, 'plan_preview', { plan: 'free' });
  renderState();
  showToast('Retour à DDA Free.');
});

/* ==========================================================================
   BROKER REGISTRY — préparatoire (mandat Addendum Broker Affiliation).
   `affiliate_status`/`affiliate_url`/`commission_model` existent pour que
   l'architecture soit prête, mais aucun `affiliate_url` n'est renseigné et
   aucun lien réel n'est câblé ici : seule une validation explicite du
   fondateur (hors de ce dépôt) peut faire passer une fiche à `active`.
   `regulation_status`/`min_deposit` restent `to_verify` tant que ce n'est
   pas confirmé — jamais une valeur inventée.
   ========================================================================== */
const BROKER_REGISTRY = Object.freeze([
  {
    id: 'Deriv', market: ['forex', 'synthetic'], use: ['learning', 'advanced'], monogram: 'D',
    description: 'Profil pour marchés dérivés et indices synthétiques.',
    affiliate_status: 'not_configured', affiliate_url: null, commission_model: null,
    disclosure_required: true, regulation_status: 'to_verify', min_deposit: 'to_verify'
  },
  {
    id: 'HFM', market: ['forex'], use: ['learning', 'advanced'], monogram: 'H',
    description: 'Profil pour Forex et CFD, sous réserve d’éligibilité locale.',
    affiliate_status: 'not_configured', affiliate_url: null, commission_model: null,
    disclosure_required: true, regulation_status: 'to_verify', min_deposit: 'to_verify'
  },
  {
    id: 'XM', market: ['forex'], use: ['learning', 'advanced'], monogram: 'X',
    description: 'Profil pour Forex et CFD, sous réserve d’éligibilité locale.',
    affiliate_status: 'not_configured', affiliate_url: null, commission_model: null,
    disclosure_required: true, regulation_status: 'to_verify', min_deposit: 'to_verify'
  },
  {
    id: 'Weltrade', market: ['forex', 'synthetic'], use: ['learning', 'advanced'], monogram: 'W',
    description: 'Profil pour Forex et instruments dérivés, sous réserve d’éligibilité locale.',
    affiliate_status: 'not_configured', affiliate_url: null, commission_model: null,
    disclosure_required: true, regulation_status: 'to_verify', min_deposit: 'to_verify'
  }
]);

function renderBrokerRows() {
  const grid = document.getElementById('broker-grid');
  if (!grid) return;
  grid.innerHTML = BROKER_REGISTRY.map(broker => `
    <article class="broker-row" data-broker="${broker.id}" data-market="${broker.market.join(' ')}" data-use="${broker.use.join(' ')}">
      <div class="broker-row-head">
        <span class="broker-monogram">${broker.monogram}</span>
        <div class="broker-row-heading"><h2>${broker.id}</h2><p>${broker.description}</p></div>
      </div>
      <dl><div><dt>Disponibilité</dt><dd>Selon le pays</dd></div><div><dt>Transparence</dt><dd>Relation partenaire à déclarer</dd></div><div><dt>Régulation</dt><dd>${broker.regulation_status === 'to_verify' ? 'À vérifier avant publication' : broker.regulation_status}</dd></div><div><dt>Dépôt minimum</dt><dd>${broker.min_deposit === 'to_verify' ? 'À vérifier avant publication' : broker.min_deposit}</dd></div></dl>
      <div class="broker-row-foot"><span class="verification"><svg class="icon"><use href="#icon-clock"/></svg> À vérifier avant publication</span><button class="secondary-action dark-action broker-detail">Voir les critères</button></div>
    </article>`).join('');
}
renderBrokerRows();

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
document.getElementById('broker-grid')?.addEventListener('click', event => {
  const button = event.target.closest('.broker-detail');
  if (!button) return;
  const broker = button.closest('.broker-row')?.dataset.broker;
  // Measures interest in a broker profile only. No real link exists yet and
  // affiliate_link_click is never fired here — a separate CEO validation is
  // required before any real broker link/click is wired (see EVENT_NAMES).
  if (broker) trackEvent('broker_selected', { broker });
  showToast('Fiche complète différée jusqu’à vérification réglementaire.');
});

document.getElementById('journal-tab-entries').addEventListener('click', () => switchJournalTab('entries'));
document.getElementById('journal-tab-plan').addEventListener('click', () => switchJournalTab('plan'));
document.getElementById('weekly-review-open').addEventListener('click', openWeeklyReview);
document.getElementById('weekly-review-preview').addEventListener('click', () => { closeWeeklyReview(); showView('membership'); });
document.getElementById('weekly-review-cancel').addEventListener('click', closeWeeklyReview);
document.getElementById('weekly-review-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!canUnlock('premium_track')) return;
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
// A Journal save can silently fail at the localStorage layer (quota
// exceeded, private-browsing storage caps, some in-app Android browsers
// that restrict storage outright) — DDA.save() already catches that
// internally and never throws, but every Journal call site below used to
// show its "saved" toast unconditionally, regardless of whether anything
// was actually persisted. DDA.storageAvailable() reflects the outcome of
// the write that just ran (it's set synchronously inside save(), which
// every journal mutation above funnels through), so checking it right
// after is enough to tell a real failure from a real success — no native
// browser-style notification, just one honest in-app message either way.
function journalSaveToast(successMessage) {
  showToast(DDA.storageAvailable()
    ? successMessage
    : 'Impossible d’enregistrer : stockage indisponible sur cet appareil. Ce changement ne sera pas conservé après la fermeture de la page.');
}
document.getElementById('journal-new-entry').addEventListener('click', event => openJournalComposer(null, event.currentTarget));
document.getElementById('journal-composer-back').addEventListener('click', closeJournalComposer);
document.getElementById('journal-step-prev').addEventListener('click', () => goToJournalStep(journalStep - 1));
document.getElementById('journal-step-next').addEventListener('click', () => goToJournalStep(journalStep + 1));
document.getElementById('journal-composer-delete').addEventListener('click', () => {
  if (!journalEditingId) return;
  deleteJournalEntry(journalEditingId);
  trackEvent('journal_entry_deleted', {});
  closeJournalComposer();
  journalSaveToast('Entrée supprimée.');
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
  journalSaveToast(editingId ? 'Entrée mise à jour.' : 'Entrée enregistrée localement.');
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
    journalSaveToast('Entrée supprimée.');
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
  journalSaveToast('Plan personnel enregistré.');
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
// 'intelligence' (DDA AI) was removed from this list (Lot 5, 2026-11-14): the
// real chat is already built and live just above this button on the same
// view — a "notify me at launch" CTA under a feature that already works
// was a leftover from before the chat existed, not an honest pending state.
bindNotifyButton('experts', 'experts-notify', 'expertsNotify', 'DDA Experts');
bindNotifyButton('live', 'live-notify', 'liveNotify', 'DDA Live');
bindNotifyButton('business', 'business-notify', 'businessNotify', 'DDA Business');

/* DDA AI Academy chat — a thin UI bridge over the authenticated BFF client.
   The browser never receives a provider key and never invents a reply when the
   BFF is disabled, unauthenticated or not configured. Only the last 12 turns
   are kept locally, under the authenticated account's own storage namespace. */
(function initDdaAiChat() {
  const form = document.getElementById('dda-ai-form');
  const input = document.getElementById('dda-ai-input');
  const transcript = document.getElementById('dda-ai-transcript');
  const empty = document.getElementById('dda-ai-empty');
  const status = document.getElementById('dda-ai-chat-status');
  const error = document.getElementById('dda-ai-error');
  const submit = document.getElementById('dda-ai-submit');
  if (!form || !input || !transcript || !status || !window.DDABFF) return;
  const guestStorageKey = 'dda-ai-chat-v1';
  const maxTurns = 12;
  let history = [];
  let historyStorageKey = null;
  let pending = false;
  function currentHistoryStorageKey() {
    if (!window.DDABFF.enabled()) return guestStorageKey;
    return remoteUser?.user_id
      ? `dda-ai-chat-v1:user:${encodeURIComponent(remoteUser.user_id)}`
      : null;
  }
  function loadHistoryForScope() {
    const nextKey = currentHistoryStorageKey();
    if (nextKey === historyStorageKey) return;
    historyStorageKey = nextKey;
    history = [];
    transcript.replaceChildren();
    empty.hidden = false;
    if (historyStorageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(historyStorageKey) || '[]');
        if (Array.isArray(saved)) history = saved.filter(turn => ['user', 'assistant'].includes(turn?.role) && typeof turn.content === 'string').slice(-maxTurns);
      } catch { history = []; }
    }
    history.forEach(turn => appendMessage(turn.role, turn.content));
  }
  loadHistoryForScope();
  window.DDARefreshAiHistory = loadHistoryForScope;
  const saveHistory = () => {
    if (!historyStorageKey) return;
    try { localStorage.setItem(historyStorageKey, JSON.stringify(history.slice(-maxTurns))); } catch { /* storage is optional */ }
  };
  function appendMessage(role, text, options = {}) {
    const item = document.createElement('div');
    item.className = `dda-ai-message dda-ai-message-${role}${options.pending ? ' is-pending' : ''}`;
    item.dataset.aiMessage = role;
    const label = document.createElement('span');
    label.className = 'dda-ai-message-label';
    label.textContent = role === 'user' ? 'Toi' : 'DDA AI';
    const copy = document.createElement('p');
    copy.className = 'dda-ai-message-copy';
    copy.textContent = text;
    item.append(label, copy);
    transcript.appendChild(item);
    empty.hidden = true;
    transcript.scrollTop = transcript.scrollHeight;
    return item;
  }
  if (!window.DDABFF.enabled()) {
    status.textContent = 'Service en attente de configuration';
    status.dataset.state = 'offline';
  } else {
    status.textContent = 'BFF sécurisé · session requise';
    status.dataset.state = 'ready';
  }
  function setPending(value) {
    pending = value;
    input.disabled = value;
    submit.disabled = value;
    submit.innerHTML = value ? 'Réflexion…' : 'Envoyer <span>→</span>';
  }
  function showUnavailable() {
    status.textContent = 'Assistant non disponible';
    status.dataset.state = 'offline';
    appendMessage('assistant', window.DDABFF.enabled()
      ? 'DDA AI n’est pas disponible pour cette session. Connecte-toi à ton compte DDA ou réessaie lorsque le service sera activé.'
      : 'DDA AI est en préparation sur cet environnement. Le BFF sécurisé n’est pas encore configuré ; aucune réponse simulée ne sera affichée.');
  }
  function providerError(code) {
    if (code === 'rate_limited') return 'La limite pédagogique temporaire est atteinte. Reviens plus tard pour continuer ta révision.';
    return 'Le service DDA AI rencontre un problème temporaire. Ta question n’a pas été remplacée par une réponse inventée.';
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    const message = input.value.trim();
    if (!message) { error.textContent = 'Écris une question avant d’envoyer.'; input.focus(); return; }
    error.textContent = '';
    loadHistoryForScope();
    const priorHistory = history.slice(-maxTurns);
    const requestScope = historyStorageKey;
    appendMessage('user', message);
    history.push({ role: 'user', content: message });
    saveHistory();
    input.value = '';
    setPending(true);
    const pendingMessage = appendMessage('assistant', 'DDA AI prépare une explication pédagogique…', { pending: true });
    try {
      const result = await window.DDABFF.askAI(message, priorHistory);
      pendingMessage.remove();
      if (requestScope !== historyStorageKey) return;
      if (!result.available) {
        showUnavailable();
      } else if (result.error) {
        status.textContent = 'Réponse interrompue';
        status.dataset.state = 'error';
        appendMessage('assistant', providerError(result.error));
      } else if (result.reply) {
        status.textContent = 'Assistant disponible';
        status.dataset.state = 'ready';
        appendMessage('assistant', result.reply);
        history.push({ role: 'assistant', content: result.reply });
        saveHistory();
      } else {
        status.textContent = 'Réponse indisponible';
        status.dataset.state = 'error';
        appendMessage('assistant', 'DDA AI n’a pas fourni de réponse exploitable. Réessaie avec une question plus précise.');
      }
    } catch {
      pendingMessage.remove();
      status.textContent = 'Service indisponible';
      status.dataset.state = 'error';
      appendMessage('assistant', 'Le service est momentanément indisponible. Tes données locales restent intactes.');
    } finally { setPending(false); input.focus(); }
  });
  document.querySelectorAll('[data-ai-prompt]').forEach(button => button.addEventListener('click', () => {
    input.value = button.dataset.aiPrompt || '';
    input.focus();
  }));
})();

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
    const scrollTarget = revealLessonAnchor(ids.scrollToId);
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

// P0 auth reliability audit (2026-11): the BFF now tells a wrong password
// apart from an unconfirmed email, a provider-side rate limit, and a
// transient server error (see classifyLoginError in bff/src/app.js). Before
// this fix every one of those showed the same "E-mail ou mot de passe
// incorrect." even when the password the user had just set was correct —
// the exact symptom reported in production. Never report "mot de passe
// incorrect" for a cause that is not actually a wrong credential.
function authErrorMessage(authError, { signup } = {}) {
  const code = authError?.body?.code || '';
  if (code === 'email_not_confirmed') {
    return 'Confirme ton adresse e-mail avant de te connecter : vérifie ta boîte mail (et les spams) puis clique sur le lien de confirmation.';
  }
  // Signup reliability audit (P0, 2026-11): classifyRegisterError() in
  // bff/src/app.js now tells a password the provider itself rejects as too
  // weak apart from every other registration failure — this used to fall
  // through to the same generic "could not complete this step" as a random
  // server glitch, which looks exactly like a bug to the person who just
  // typed the password that triggered it.
  if (code === 'weak_password') {
    return 'Ton mot de passe est trop simple : ajoute des majuscules, des chiffres ou des symboles.';
  }
  if (code === 'rate_limited') {
    return 'Trop de tentatives. Réessaie dans quelques minutes.';
  }
  if (code === 'server_error' || authError?.status >= 500 || !authError?.status) {
    return 'Le service est momentanément indisponible. Réessaie dans un instant.';
  }
  if (code === 'invalid_credentials' || authError?.status === 401) {
    return 'E-mail ou mot de passe incorrect.';
  }
  if (code === 'validation_error') {
    return signup
      ? 'Vérifie ton e-mail et choisis un mot de passe d’au moins 12 caractères.'
      : 'Indique ton e-mail et ton mot de passe.';
  }
  return 'Impossible de terminer cette étape pour le moment. Réessaie plus tard.';
}

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
    // Anti-double-submit + visible loading state (P0.4): a slow Supabase
    // round trip must never let a second click fire a second signup/login,
    // and the learner must see that something is happening rather than a
    // frozen form.
    const submitButton = document.querySelector('#signup-form button[type=submit]');
    if (submitButton?.disabled) return;
    const originalLabel = submitButton ? submitButton.innerHTML : '';
    if (submitButton) { submitButton.disabled = true; submitButton.innerHTML = bffAuthMode === 'login' ? 'Connexion…' : 'Envoi…'; }
    try {
      if (bffAuthMode === 'signup') {
        const attempt = { email, password, display_name: name, ref: prototypeState.acquisition?.partnerRef };
        await window.DDABFF.register(attempt);
        document.getElementById('bff-auth-status').textContent = 'Si l’inscription peut être finalisée, un lien de vérification vient d’être envoyé. Vérifie ta boîte mail (et les spams) puis connecte-toi.';
        setBffAuthMode('login');
        document.getElementById('email').value = email;
        // Must be set after setBffAuthMode('login'): mode switches clear any
        // previously remembered attempt and re-hide the resend button.
        lastSignupAttempt = attempt;
        const resendButton = document.getElementById('bff-resend-confirmation');
        if (resendButton) resendButton.hidden = false;
      } else {
        await window.DDABFF.login({ email, password });
        const user = await hydrateRemoteSession();
        if (!user) throw new Error('session_missing');
        document.getElementById('bff-auth-status').textContent = '';
        revealAdminLinkIfAdmin();
        refreshServerPremiumEntitlement();
        showOnboardingAfterRemoteAuth(user);
      }
    } catch (authError) {
      error.textContent = authErrorMessage(authError, { signup: bffAuthMode === 'signup' });
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.innerHTML = originalLabel; }
    }
    return;
  }
  saveState({ user: DDA.createUser(name, email) });
  trackEvent('signup_completed', {});
  event.currentTarget.hidden = true;
  document.getElementById('onboarding-form').hidden = false;
  document.getElementById('step-dot-2').classList.add('active');
  document.getElementById('step-dot-1').removeAttribute('aria-current');
  document.getElementById('step-dot-2').setAttribute('aria-current', 'step');
  // saveState() above already rendered with onboarding-form still hidden,
  // so the resume/erase nudge was computed as visible for the user object
  // this very step just created — correct that stale render now that step 2
  // is actually showing (see its own hidden-condition comment above).
  document.getElementById('resume-device').hidden = true;
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
  if (invalidFields.length) {
    const firstMissing = invalidFields[0];
    const fieldMessages = {
      level: 'Choisis ton niveau pour construire ton parcours.',
      goal: 'Choisis ton objectif pour construire ton parcours.',
      time: 'Choisis ton rythme pour construire ton parcours.'
    };
    document.getElementById('onboarding-error').textContent = fieldMessages[firstMissing.id] || 'Complète les trois éléments du parcours.';
    firstMissing.focus();
    return;
  }
  document.getElementById('onboarding-error').textContent = '';
  saveState({ onboarding: { level, goal, time, complete: true } });
  if (remoteUser && window.DDABFF?.enabled()) window.DDABFF.saveOnboardingProgress({ level, goal, time, complete: true }).catch(() => {});
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
      const next = document.createElement('small');
      next.className = 'feedback-next';
      next.textContent = correct
        ? (role === 'exercise' ? 'Le quiz de vérification est maintenant accessible.' : role === 'quiz' ? 'Cette validation est conservée localement sur cet appareil.' : 'Tu peux continuer lorsque tu es prêt.')
        : 'Relis le raisonnement présenté, puis choisis une autre réponse.';
      feedback.append(kicker, copy, next);
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
        revealLessonAnchor(gate);
        gate.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // The one moment in the app a learner actually watches something
        // unlock live, in place, instead of returning to it later — give it
        // a visible "just opened" beat, same short-lived-class pattern as
        // result-card.just-completed just below.
        gate.classList.add('just-unlocked');
        setTimeout(() => gate.classList.remove('just-unlocked'), 700);
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
        revealLessonAnchor(resultCard);
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

// DDA Lab guided mission: learner-authored output + transparent self-review.
// Delegated once so the activity works in every mounted lesson and after view changes.
(function bindLabMissionInteractions() {
  if (document.documentElement.dataset.labMissionBound === 'true') return;
  document.documentElement.dataset.labMissionBound = 'true';
  document.addEventListener('input', event => {
    const area = event.target.closest('[data-mission-answer]');
    if (!area) return;
    const mission = area.closest('[data-lab-mission]');
    const count = mission?.querySelector('[data-mission-count]');
    if (count) count.textContent = `${area.value.length} / 1200`;
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-mission-review]');
    if (!button) return;
    const mission = button.closest('[data-lab-mission]');
    if (!mission) return;
    const answer = mission.querySelector('[data-mission-answer]')?.value.trim() || '';
    const checks = [...mission.querySelectorAll('[data-mission-criterion]')];
    const completed = checks.filter(check => check.checked).length;
    const feedback = mission.querySelector('[data-mission-feedback]');
    if (!feedback) return;
    feedback.hidden = false;
    feedback.className = 'lab-mission-feedback ' + (answer.length >= 40 && completed === checks.length ? 'is-ready' : 'is-review');
    feedback.textContent = answer.length < 40
      ? 'Ton livrable est encore trop court. Ajoute le contexte, le public, le format et les contraintes avant de faire ton bilan.'
      : completed < checks.length
        ? `Tu as coché ${completed}/${checks.length} critères. Relis ton prompt et complète les éléments manquants avant de le réutiliser.`
        : 'Bilan positif : tu as rédigé un livrable et vérifié les 4 critères. Relis-le une dernière fois pour confirmer qu’aucune information n’a été inventée. Cette auto-évaluation ne remplace pas le quiz de validation.';
  });
})();


function mountPremiumLessons() {
  if (!canUnlock('premium_track')) return;
  mountedLessons.filter(entry => entry.permission === 'premium_track').forEach(entry => {
    const main = document.getElementById(`${entry.viewId}-main`);
    const wasMounted = main?.dataset.ddaLessonMounted === 'true';
    mountLesson(entry);
    if (!wasMounted && main) {
      bindRegistryQuestions(entry);
      main.querySelectorAll('[data-view]').forEach(bindViewButton);
    }
  });
  // Lot 2 (mandate §6 audit): canUnlock('premium_track') is true here, but a
  // premium_track LESSON_REGISTRY entry whose real content never arrived
  // (no BFF configured — e.g. the local "Premium Demo" preview toggle — or
  // a genuine fetch failure) is simply absent from mountedLessons. Every
  // call site of this function (gate-unlock, refreshServerPremiumEntitlement,
  // the boot-time mount pass) gets the same honest fallback this way,
  // instead of a silently blank lesson view.
  LESSON_REGISTRY.filter(entry => entry.permission === 'premium_track' && !mountedLessons.some(m => m.id === entry.id))
    .forEach(entry => renderPremiumContentUnavailable(entry.viewId, entry.title));
}

/* -------------------------------------------------------------------------
   DDA Lab — pilot track "IA pour agir". Deliberately a separate, small
   registry, not a merge into LESSON_REGISTRY: its lessons are not inside
   DDA.curriculum, so they never enter DDALearning.nextActionable()'s single
   trading-track sequence — opening the Lab must never change what the
   Terminal/Parcours/Progression recommend as the next trading step.
   Every mounting/binding/persistence function below (mountLesson,
   bindRegistryQuestions, bindMarkUnderstood, lessonUiIds, updateLessonState)
   is the exact same one LESSON_REGISTRY uses — reused unmodified by giving
   each entry the same { meta: { module, lesson } } shape findLesson() would
   have produced. Progress persists through the existing DDA.updateLesson()
   (a flat `state.lessons[id]` map, already lesson-id-agnostic) — no new
   storage key, no schema change. ------------------------------------------- */
// dda-lab.js is now lazy-loaded (Lot 1, mandate §6 audit — it used to be the
// only authored content file still fetched unconditionally for 100% of
// visitors, regardless of whether they ever opened the Lab). window.DDALab
// may therefore not exist yet the first time this file runs: labModule/
// LAB_REGISTRY/LAB_PREREQUISITE/LAB_VIEW_ID start empty and are (re)built by
// rebuildLabRegistry(), called once at boot (handles the deep-link case,
// where dda-lazy-modules.js's document.write bootstrap already loaded
// dda-lab.js before this script runs — same as p2-lessons.js already did)
// and again from mountLabTrack() once the lazy group actually finishes
// loading later (DDA_LAZY_REFRESH hook below).
// Lot 2 (mandate §6 audit) separately made LAB4/LABCAP's own real content
// arrive later and asynchronously (fetched from the authenticated BFF only
// once Premium is actually confirmed — see ensureLabPremiumContentLoaded()
// below), so window.DDALab.lessons[3]/.capstone can be *replaced* at
// runtime once that fetch resolves, independently of whether dda-lab.js
// itself has already loaded. rebuildLabRegistry() re-derives everything
// below from whatever window.DDALab currently is, and is safe to call again
// after either event — it deliberately has no "already built" guard.
let labModule = null;
let LAB_REGISTRY = [];
let LAB_PREREQUISITE = Object.freeze({});
let LAB_VIEW_ID = Object.freeze({});
function rebuildLabRegistry() {
  if (!window.DDALab) { labModule = null; LAB_REGISTRY = []; LAB_PREREQUISITE = Object.freeze({}); LAB_VIEW_ID = Object.freeze({}); return; }
  labModule = Object.freeze({ title: window.DDALab.track.title, lessons: [...window.DDALab.lessons, window.DDALab.capstone] });
  LAB_REGISTRY = Object.freeze([
    { id: 'LAB1', viewId: 'lesson-lab1', suffix: 'lab1', permission: 'lesson_m01', quizBlock: 'lab1-quiz', understoodScrollTo: 'lab1-exercise-block',
      meta: { module: labModule, lesson: window.DDALab.lessons[0] },
      questions: [
        // Lot F (audit DDA Lab/Premium) : ce decision_choice ("À toi de
        // juger") n'était dans aucune entrée de questions ici — bindQuestion
        // n'était donc jamais appelé pour lui, aucun clic sur ses boutons ne
        // déclenchait de validation ni de surlignage, malgré un feedback déjà
        // authored par choix dans dda-lab.js. role 'practice' : non bloquant,
        // comme M0.1's comparison-choice.
        { role: 'practice', block: 'lab1-practice-choice', success: 'Bonne lecture.' },
        { role: 'exercise', block: 'lab1-exercise', success: '@practice', gate: true },
        { role: 'quiz', block: 'lab1-quiz', success: '@data', result: true }
      ] },
    { id: 'LAB2', viewId: 'lesson-lab2', suffix: 'lab2', permission: 'lesson_m01', quizBlock: 'lab2-quiz', understoodScrollTo: 'lab2-exercise-block',
      meta: { module: labModule, lesson: window.DDALab.lessons[1] },
      questions: [
        // Lot F : même écart que LAB1 ci-dessus, sur le decision_choice
        // "À toi de choisir" de LAB2.
        { role: 'practice', block: 'lab2-practice-choice', success: 'Bonne lecture.' },
        { role: 'exercise', block: 'lab2-exercise', success: '@practice', gate: true },
        { role: 'quiz', block: 'lab2-quiz', success: '@data', result: true }
      ] },
    { id: 'LAB3', viewId: 'lesson-lab3', suffix: 'lab3', permission: 'lesson_m01', quizBlock: 'lab3-quiz', understoodScrollTo: 'lab3-exercise-block',
      meta: { module: labModule, lesson: window.DDALab.lessons[2] },
      questions: [
        // Lot F : même écart que LAB1/LAB2 ci-dessus, sur le decision_choice
        // "À toi de juger" de LAB3.
        { role: 'practice', block: 'lab3-practice-choice', success: 'Bonne lecture.' },
        { role: 'exercise', block: 'lab3-exercise', success: '@practice', gate: true },
        { role: 'quiz', block: 'lab3-quiz', success: '@data', result: true }
      ] },
    { id: 'LAB4', viewId: 'lesson-lab4', suffix: 'lab4', permission: 'premium_track', quizBlock: 'lab4-quiz', understoodScrollTo: 'lab4-exercise-block',
      meta: { module: labModule, lesson: window.DDALab.lessons[3] },
      questions: [
        { role: 'exercise', block: 'lab4-exercise', success: '@practice', gate: true },
        { role: 'quiz', block: 'lab4-quiz', success: '@data', result: true }
      ] },
    { id: 'LABCAP', viewId: 'lesson-lab-capstone', suffix: 'labcap', permission: 'premium_track', quizBlock: 'labcap-quiz', understoodScrollTo: 'labcap-checklist-block',
      meta: { module: labModule, lesson: window.DDALab.capstone },
      questions: [
        { role: 'quiz', block: 'labcap-quiz', success: '@data', result: true }
      ] }
  ]);
  LAB_PREREQUISITE = Object.freeze(Object.fromEntries(LAB_REGISTRY.filter(entry => entry.meta.lesson.prerequisite).map(entry => [entry.viewId, entry.meta.lesson.prerequisite])));
  // Reverse of the map above — same role LESSON_VIEW_ID plays for the main
  // curriculum, needed so the "previous lesson" link below can turn a
  // prerequisite id back into a navigable view.
  LAB_VIEW_ID = Object.freeze(Object.fromEntries(LAB_REGISTRY.map(entry => [entry.id, entry.viewId])));
}
rebuildLabRegistry();
// Navigation audit follow-up: initLessonPrevLinks (further up this file)
// only covers LESSON_REGISTRY — DDA Lab is a deliberately separate registry
// (see the block comment above rebuildLabRegistry) with its own prerequisite
// chain, so it needs its own, identically-shaped injector rather than
// reusing LESSON_PREREQUISITE/LESSON_VIEW_ID for lessons that aren't in them.
// Idempotent via its own DOM guard (quickNav.querySelector), so it is safe
// to call again — including every time mountLabTrack() runs.
function initLabPrevLinks() {
  LAB_REGISTRY.forEach(entry => {
    const prevViewId = LAB_VIEW_ID[LAB_PREREQUISITE[entry.viewId]];
    if (!prevViewId) return;
    const quickNav = document.getElementById(entry.viewId)?.querySelector('.lesson-quick-nav');
    if (!quickNav || quickNav.querySelector('[data-lesson-prev]')) return;
    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'text-action';
    prevButton.dataset.view = prevViewId;
    prevButton.dataset.lessonPrev = 'true';
    prevButton.textContent = '← Leçon précédente';
    const backLink = quickNav.querySelector('.back-link');
    if (backLink) backLink.after(prevButton); else quickNav.appendChild(prevButton);
    bindViewButton(prevButton);
  });
}
initLabPrevLinks();
// Lot 2 (mandate §6 audit): LAB4/LABCAP's real content now arrives only
// from the authenticated BFF, so a premium-gated entry must never be
// mounted while its content is still the empty metadata shell (dda-lab.js'
// buildLab4Meta()/buildLabCapstoneMeta()) — that would render a broken,
// content-less lesson instead of the honest "not loaded yet" state. LAB1-3
// are always free, static and immediately ready.
function labContentReady(entry) {
  return entry.permission !== 'premium_track' || (Array.isArray(entry.meta?.lesson?.blocks) && entry.meta.lesson.blocks.length > 0);
}
// Mounts the free LAB1-3 lessons (plus LAB4/capstone when already
// Premium-entitled AND their real content has actually arrived — see
// labContentReady() above) and binds their interactions. A no-op until
// dda-lab.js has actually loaded. Called once at boot (deep-link case) and
// again from the DDA_LAZY_REFRESH hook once the lazy "ailab" group resolves
// (normal nav-click case, where window.DDALab did not exist yet at boot) —
// every step here is guarded so repeated calls stay harmless:
// rebuildLabRegistry() just re-derives the same data when nothing actually
// changed, mountLesson() no-ops once a view is mounted, and the one
// genuinely non-idempotent step (bindMarkUnderstood, which would otherwise
// double-bind a click listener) only ever runs on the first successful pass
// via `labMarkUnderstoodBound`.
let labMarkUnderstoodBound = false;
function mountLabTrack() {
  if (!window.DDALab) return;
  rebuildLabRegistry();
  applyLabTitles();
  initLabPrevLinks();
  LAB_REGISTRY.forEach(entry => {
    // Same rule boot-time LESSON_REGISTRY mounting already uses (line ~158):
    // a premium entry mounts at boot too when the already-loaded state is
    // already premium (e.g. after a reload) — "not premium_track" alone
    // would wrongly skip LAB4/capstone for an already-premium learner.
    if (entry.permission === 'premium_track' && !canUnlock('premium_track')) return;
    if (!labContentReady(entry)) { renderPremiumContentUnavailable(entry.viewId, entry.meta?.lesson?.title); return; }
    const main = document.getElementById(`${entry.viewId}-main`);
    const wasMounted = main?.dataset.ddaLessonMounted === 'true';
    mountLesson(entry);
    if (!wasMounted) bindRegistryQuestions(entry);
  });
  if (!labMarkUnderstoodBound) {
    labMarkUnderstoodBound = true;
    LAB_REGISTRY.forEach(entry => {
      const ui = lessonUiIds(entry);
      bindMarkUnderstood(entry.id, { buttonId: ui.markUnderstoodId, savedStateId: ui.savedStateId, scrollToId: entry.understoodScrollTo });
    });
  }
}
mountLabTrack();
function mountPremiumLabLessons() {
  if (!window.DDALab || !canUnlock('premium_track')) return;
  LAB_REGISTRY.filter(entry => entry.permission === 'premium_track').forEach(entry => {
    if (!labContentReady(entry)) { renderPremiumContentUnavailable(entry.viewId, entry.meta?.lesson?.title); return; }
    const main = document.getElementById(`${entry.viewId}-main`);
    const wasMounted = main?.dataset.ddaLessonMounted === 'true';
    mountLesson(entry);
    if (!wasMounted && main) {
      bindRegistryQuestions(entry);
      main.querySelectorAll('[data-view]').forEach(bindViewButton);
    }
  });
}
// Lot 2 (mandate §6 audit): fetches LAB4/LABCAP's real content from the
// authenticated BFF and, if it actually came back, replaces window.DDALab
// wholesale (its lessons/capstone are frozen — never mutated in place) and
// rebuilds LAB_REGISTRY/the prerequisite maps against the new object.
// Resolves to false (no-op) when the BFF is disabled, the fetch fails, or
// the content was already loaded — callers never re-render on a no-op.
async function ensureLabPremiumContentLoaded() {
  if (!window.DDALab || typeof window.DDAFetchLabPremiumContent !== 'function') return false;
  const lab4Entry = LAB_REGISTRY.find(entry => entry.id === 'LAB4');
  if (labContentReady(lab4Entry || { permission: 'premium_track', meta: { lesson: window.DDALab.lessons[3] } })) return false;
  const { lab4, labcap } = await window.DDAFetchLabPremiumContent();
  if (!lab4 && !labcap) return false;
  window.DDALab = Object.freeze({
    track: window.DDALab.track,
    lessons: Object.freeze([window.DDALab.lessons[0], window.DDALab.lessons[1], window.DDALab.lessons[2], lab4 || window.DDALab.lessons[3]]),
    capstone: labcap || window.DDALab.capstone
  });
  rebuildLabRegistry();
  initLabPrevLinks();
  return true;
}
// A lesson's own three durable flags collapse here to one honest status word —
// never a fabricated "Maîtrisé" from a single quiz pass (the exact conflation
// the P0 audit flagged in the main curriculum's competencyLevel()).
function labLessonStatus(entry) {
  if (entry.permission === 'premium_track' && !canUnlock('premium_track')) return 'locked';
  const progress = DDALearning.getLessonProgress(prototypeState, entry.id);
  if (progress.quizComplete) return 'done';
  if (progress.exerciseComplete || progress.lessonViewed) return 'started';
  const prereq = LAB_REGISTRY.find(item => item.id === entry.meta.lesson.prerequisite);
  if (prereq && !DDALearning.getLessonProgress(prototypeState, prereq.id).quizComplete) return 'locked';
  return 'available';
}
const LAB_STATUS_LABEL = { locked: 'Verrouillé', available: 'À commencer', started: 'En cours', done: 'Terminé' };
function renderLabCatalog() {
  if (!window.DDALab) return;
  LAB_REGISTRY.forEach(entry => {
    const status = labLessonStatus(entry);
    const label = status === 'locked' && entry.permission === 'premium_track' && canUnlock('premium_track') === false
      ? 'DDA Premium'
      : LAB_STATUS_LABEL[status];
    [`lab-${entry.id}-status`, `lab-progress-${entry.id}-status`, `lab-photo-${entry.id}-status`].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = label;
    });
    const strip = document.querySelector(`[data-lab-step="${entry.id}"]`);
    if (strip) strip.dataset.state = status;
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
  const syncStep = (step, state, text) => {
    document.querySelector(`[data-p2-step="${step}"]`)?.setAttribute('data-state', state);
    set(`p2-progress-${step}-status`, text);
  };
  const p21Status = p21.quizComplete ? 'Validée' : p21.exerciseComplete ? 'En cours' : 'À commencer';
  const p22Status = p22.quizComplete ? 'Validée' : p22.exerciseComplete ? 'En cours' : p21.quizComplete ? 'À commencer' : 'Après P2.1';
  const labStatus = lab.status === 'validated' ? 'Validé' : lab.status === 'retry' ? 'À reprendre' : p22.quizComplete ? 'À commencer' : 'Après les leçons';
  const assessmentStatus = assessment.passed ? 'Validé' : lab.status === 'validated' ? 'À commencer' : 'Après le Lab';
  set('p2-p21-status', p21Status); set('p2-p22-status', p22Status); set('p2-lab-status', labStatus); set('p2-assessment-status', assessmentStatus);
  syncStep('p21', p21.quizComplete ? 'complete' : p21.exerciseComplete ? 'active' : 'ready', p21Status);
  syncStep('p22', p22.quizComplete ? 'complete' : p22.exerciseComplete ? 'active' : p21.quizComplete ? 'ready' : 'locked', p22Status);
  syncStep('lab', lab.status === 'validated' ? 'complete' : lab.status === 'retry' ? 'active' : p22.quizComplete ? 'ready' : 'locked', labStatus);
  syncStep('assessment', assessment.passed ? 'complete' : lab.status === 'validated' ? 'ready' : 'locked', assessmentStatus);
  set('premium-track-progress', assessment.passed ? 'Preuve créée · prochaine action : Journal' : lab.status === 'validated' ? 'Lab validé · assessment disponible' : p22.quizComplete ? 'Leçons validées · Lab disponible' : p21.quizComplete ? 'P2.1 validée · P2.2 disponible' : 'Prêt à commencer ? Ta première étape t’attend.');
  const receipt = document.getElementById('premium-proof-receipt');
  if (receipt) receipt.hidden = !proof;
  if (proof) set('p2-proof-date', proof.createdAt ? new Date(proof.createdAt).toLocaleString('fr-FR') : 'Horodatage local');
  const progress = document.getElementById('premium-proof-progress');
  if (progress) progress.innerHTML = proof
    ? `<article class="premium-proof-row"><strong>${proof.skill || 'Fondations du risque'}</strong><span>${proof.level || 'Niveau 3 — Appliquer'}</span><p>${proof.source || 'P2 Lab de risque guidé + Assessment'}</p><small>${proof.createdAt ? new Date(proof.createdAt).toLocaleString('fr-FR') : 'Horodatage local'} · ${proof.nextAction || 'Continuer vers la prochaine pratique Premium.'}</small></article>`
    : '<p>Ta première preuve Premium apparaîtra ici après ta prochaine validation.</p>';
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
  let message = 'Revue nécessaire. Ton stop est présent, mais l’invalidation du scénario n’a pas été établie. Revois la structure de marché avant de définir le risque.';
  let title = 'Revue nécessaire';
  if (values.invalidation.length < 10) {
    message = 'Revue nécessaire. Ton stop est présent, mais l’invalidation du scénario n’a pas été établie. Revois la structure de marché avant de définir le risque.';
  } else if (values.entry.length < 10) {
    title = 'Vérification de la décision';
    message = 'Vérification de la décision. Tu as identifié une zone, mais une zone seule ne définit pas une condition d’entrée.';
  } else if (!Number.isFinite(values.risk) || values.risk <= 0 || values.risk > 50 || values.target.length < 5 || values.noTrade.length < 10) {
    title = 'Vérification de la limite de risque';
    message = 'Définis un risque mesurable égal ou inférieur à l’exemple pédagogique de $50, un objectif cohérent et une condition de non-trade claire avant l’exécution.';
  } else {
    status = 'validated'; title = 'Bien';
    message = 'Ton invalidation est définie avant l’exécution. Cela donne au trade une limite de risque mesurable.';
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
    premiumFeedback(feedback, false, 'Lab requis', 'Valide d’abord le P2 Lab afin que l’assessment repose sur une décision construite.'); return;
  }
  const answers = ['p2-q1', 'p2-q2', 'p2-q3', 'p2-q4'].map(name => document.querySelector(`input[name="${name}"]:checked`)?.value);
  const passed = answers.join('|') === 'wait|respect|c|b';
  const previous = premiumRecord().assessments?.['p2-controlled-decision'] || {};
  const assessment = { attempts: Number(previous.attempts || 0) + 1, passed, completedAt: passed ? new Date().toISOString() : undefined };
  savePremiumPatch({ assessments: { ...premiumRecord().assessments, 'p2-controlled-decision': assessment } });
  trackEvent('premium_assessment_completed', { assessment: 'p2-controlled-decision' });
  if (!passed) {
    premiumFeedback(feedback, false, 'Revue nécessaire', 'Relis la distinction entre résultat et processus, puis vérifie que le risque ne dépasse jamais la limite définie.'); return;
  }
  const createdAt = new Date().toISOString();
  const proof = { type: 'skill_evidence', source: 'P2 Lab de risque guidé + Assessment', competencyId: 'risk_foundations', skill: 'Fondations du risque', level: 'Niveau 3 — Appliquer', createdAt, nextAction: 'Continuer vers la prochaine pratique Premium.' };
  savePremiumPatch({ modules: { ...premiumRecord().modules, P2: { status: 'completed', completedAt: createdAt } }, proofs: { ...premiumRecord().proofs, 'p2-risk-foundations': proof } });
  trackEvent('premium_proof_created', { proof: 'p2-risk-foundations', skill: 'Fondations du risque', nextAction: 'Journal' });
  premiumFeedback(feedback, true, 'Validé', 'Controlled Decision validée. Une preuve pédagogique locale a été créée — elle ne constitue pas une certification officielle.');
});

document.getElementById('p2-journal-bridge')?.addEventListener('click', event => {
  const proof = premiumRecord().proofs?.['p2-risk-foundations'];
  if (!proof) return;
  trackEvent('premium_review_opened', { proof: 'p2-risk-foundations' });
  showView('journal');
  openJournalComposer(null, event.currentTarget, {
    market: 'XAUUSD — scénario synthétique',
    context: 'Le prix approche une zone de support identifiée précédemment. La structure du timeframe supérieur reste haussière.',
    scenario: 'Réaction haussière potentielle — exercice pédagogique local.',
    process: 'Contexte → Setup → Entrée → Invalidation → Risque → Objectif → Revue',
    decision: 'Risk Plan construit dans le P2 Lab de risque guidé.',
    outcome: 'À revoir dans le Journal — aucune donnée de marché réelle.',
    whatWorked: 'J’ai défini une invalidation avant de considérer l’entrée.',
    toImprove: 'Continuer à distinguer résultat et qualité du processus.',
    note: 'Fondations du risque · Niveau 3 — Appliquer', terminalSource: true, sourceLesson: 'P2.2', proofId: 'p2-risk-foundations', proofType: 'skill_evidence'
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
document.getElementById('profile-logout')?.addEventListener('click', async event => {
  const email = remoteUser?.email || '';
  if (!remoteUser) return;
  event.currentTarget.disabled = true;
  let serverConfirmed = false;
  try {
    await window.DDABFF.logout();
    serverConfirmed = true;
  } catch { /* Hide local account data even if revocation cannot be confirmed. */ }
  remoteUser = null;
  serverPremiumConfirmed = null;
  try { localStorage.removeItem('dda-prototype-state-v4'); } catch { /* storage may be unavailable */ }
  DDA.setStorageScope(null);
  prototypeState = DDA.clear();
  window.DDARefreshAiHistory?.();
  renderState();
  setBffAuthMode('login');
  document.getElementById('email').value = email;
  document.getElementById('access-password').value = '';
  document.getElementById('signup-form').hidden = false;
  document.getElementById('onboarding-form').hidden = true;
  showView('access', false);
  if (serverConfirmed) showToast('Session fermée. Les données du compte restent isolées sur cet appareil.');
  else document.getElementById('bff-auth-status').textContent = 'Les données du compte sont masquées sur cet appareil, mais le serveur n’a pas confirmé la fermeture. Vérifie ta connexion avant de quitter le navigateur.';
});

document.getElementById('profile-import-progress')?.addEventListener('click', async event => {
  if (!remoteUser || !window.DDABFF?.enabled()) return;
  const candidate = DDA.readUnscopedProgressCandidate?.();
  if (!candidate) return;
  const accepted = window.confirm('Importer dans ce compte uniquement les étapes de leçon et les préférences d’onboarding trouvées sur cet appareil ? Le Journal, le Terminal, le profil historique et les conversations IA ne seront pas importés.');
  if (!accepted) return;

  const button = event.currentTarget;
  button.disabled = true;
  const importedState = mergeProgressNeverDowngrade(prototypeState, candidate);
  prototypeState = DDA.save(importedState);
  renderState();
  try {
    const lessonWrites = Object.entries(candidate.lessons || {}).map(([lessonId, progress]) =>
      window.DDABFF.saveLessonProgress(lessonId, progress).then(result => {
        if (!result) throw new Error('progress_import_session_expired');
        return result;
      }));
    const onboardingWrite = candidate.onboarding
      ? window.DDABFF.saveOnboardingProgress(candidate.onboarding).then(result => {
          if (!result) throw new Error('onboarding_import_session_expired');
          return result;
        })
      : Promise.resolve();
    await Promise.all([...lessonWrites, onboardingWrite]);
    localStorage.setItem(progressImportMarkerKey(remoteUser.user_id), 'done');
    document.getElementById('profile-error').textContent = '';
    renderState();
    showToast('Progression importée et rattachée à ton compte DDA.');
  } catch {
    document.getElementById('profile-error').textContent = 'La progression importée est conservée dans cet espace de compte sur cet appareil, mais le serveur n’a pas confirmé toutes les étapes. Tu pourras réessayer.';
    renderState();
  } finally {
    button.disabled = false;
  }
});

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
  if (remoteUser && window.DDABFF?.enabled()) window.DDABFF.saveOnboardingProgress({ level, goal, time, complete: true }).catch(() => {});
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

initBffAuthUi();

// A first-time visitor (no local profile yet, no deep-link hash) must land on
// the real entry point — Access/onboarding — never on the Terminal's static
// default-active markup, which would otherwise show a placeholder "Apprenant"
// dashboard as if already signed in before anyone has actually onboarded.
//
// Structure fix (fix/design-structure-color-3d-alignment): a RETURNING,
// already-onboarded learner opening academy.html with no hash (a bare
// bookmark, typed URL, or external link) used to hit neither branch below —
// showView() was never called, so no .view ever got its 'active' class and
// the learner saw a blank app shell (sidebar/topbar only, no content). The
// final `else` makes the same real entry point this comment already
// describes for every other case: dashboard for an onboarded learner.
async function bootAcademyAfterSessionCheck() {
  try {
    await hydrateRemoteSession();
    const savedLessons = Object.keys(prototypeState.lessons || {});
    if (savedLessons.some(id => /^M1\./.test(id))) await window.DDALazyModules?.ensure('lesson-m11');
    if (savedLessons.some(id => /^MBRVM\./.test(id))) await window.DDALazyModules?.ensure('lesson-mbrvm1');
    await refreshServerPremiumEntitlement();
  } catch {
    // Fail closed: a failed identity/entitlement check never unlocks Premium.
    serverPremiumConfirmed = null;
  }
  const sessionStatus = document.getElementById('session-check-status');
  if (sessionStatus) sessionStatus.hidden = true;
  initDariusAnalysisTerminal();
  window.DDARefreshAiHistory?.();
  renderState();
  renderMarketIntelligence();
  revealAdminLinkIfAdmin();

  const initialView = BOOT_HASH_VIEW;
  if (initialView && document.getElementById(initialView)) {
    // Pre-seed currentView so restoring a deep link does not clobber the
    // previously saved view in this tab's session history.
    currentView = initialView;
    showView(initialView);
  } else if (!prototypeState.user) {
    showView('access');
  } else {
    showView(prototypeState.onboarding?.complete ? 'dashboard' : 'access');
  }

  if (!appHistoryInitialized) {
    const activeViewId = document.querySelector('.view.active')?.id || 'dashboard';
    writeDdaHistory(activeViewId, 'replace');
  }
  await handleBffVerificationToken();
}
bootAcademyAfterSessionCheck();


/* DDA Visual Identity V2 — progressive reveals for Academy surfaces only.
   .section-intro (every view's own title+intro, always the first thing under
   the header) and the lesson header block (eyebrow/h1/lead/step rail) are
   deliberately excluded: they sit above the fold the instant a view becomes
   active, so hiding them behind an IntersectionObserver callback plus a
   550ms fade — on top of the view's own .32s dda-enter transition — just
   delays the one thing a learner needs to read first. Reveal stays for
   content genuinely below the fold. */
(function initAcademyVisualRhythm() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const selector = [
    '.terminal-entry', '.terminal-lead', '.terminal-mi', '.terminal-two > section', '.terminal-family',
    '.terminal-aperture', '.terminal-tools', '.journey-current', '.journey-node',
    '.panel', '.lesson-main > *:not(.eyebrow):not(h1):not(.lesson-lead):not(.lesson-loop)', '.library-entry', '.resource-feature', '.plan-card', '.broker-row',
    '.journal-entry-card'
  ].join(',');
  function prepare(root = document) {
    const nodes = root !== document && root.matches?.(selector)
      ? [root, ...root.querySelectorAll(selector)]
      : root.querySelectorAll(selector);
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
    ? new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }), { threshold: 0.08, rootMargin: '0px 0px -7% 0px' })
    : null;
  if (!observer) {
    document.documentElement.classList.add('no-reveal-motion');
    document.querySelectorAll(selector).forEach(node => node.classList.add('revealed'));
    return;
  }
  prepare();
  const mutationObserver = new MutationObserver(mutations => mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => { if (node.nodeType === 1) prepare(node); });
  }));
  mutationObserver.observe(document.body, { childList: true, subtree: true });
})();

// Forms are disabled in static HTML. Only expose local-submit controls after
// every application handler above has been installed successfully.
document.querySelectorAll('form[data-js-submit] button[type="submit"]').forEach(button => {
  button.disabled = false;
});

/* Mission rails — each destination states its job and offers one contextual next step. */
document.getElementById('journal-mission-new')?.addEventListener('click', () => document.getElementById('journal-new-entry')?.click());
