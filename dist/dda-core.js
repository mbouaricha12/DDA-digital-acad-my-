(function () {
  'use strict';

  const STORAGE_KEY = 'dda-prototype-state-v4';
  const LEGACY_KEYS = ['dda-prototype-state-v3', 'dda-prototype-state-v2', 'dda-prototype-state'];
  const SCHEMA_VERSION = 4;
  // Acquisition V1 (CEO-validated) adds four event names to the existing local
  // allowlist: landing_visit, broker_selected, affiliate_link_click (defined but
  // never triggered until real broker links get separate CEO validation), and
  // activation_v1 — deliberately versioned so a future activation_v2 definition
  // can be added alongside it without reinterpreting what activation_v1 events
  // already meant when they were recorded.
  const EVENT_NAMES = new Set(['view_opened', 'onboarding_complete', 'lesson_understood', 'exercise_attempt', 'exercise_complete', 'quiz_attempt', 'quiz_complete', 'preference_updated', 'profile_updated', 'session_reset', 'access_denied', 'plan_preview', 'journal_entry_created', 'journal_entry_updated', 'journal_entry_deleted', 'journal_plan_saved', 'landing_visit', 'broker_selected', 'affiliate_link_click', 'activation_v1']);
  const EVENT_METADATA_KEYS = new Set(['view', 'level', 'goal', 'lesson', 'module', 'correct', 'preference', 'enabled', 'permission', 'plan', 'source', 'medium', 'campaign', 'broker']);
  const ENTITLEMENTS = Object.freeze({
    visitor: ['dashboard_preview', 'access'],
    free: ['dashboard', 'path', 'lesson_m01', 'progress', 'profile', 'resources_free', 'membership', 'market_room', 'broker_hub', 'support', 'journal'],
    premium: ['dashboard', 'path', 'lesson_m01', 'progress', 'profile', 'resources_free', 'membership', 'market_room', 'broker_hub', 'support', 'journal', 'resources_premium', 'certificate_preview', 'advanced_modules']
  });

  /* ---------------------------------------------------------------------
     DDA Learning & Engagement System V1 — architecture, not content.
     A lesson is no longer a fixed sequence of named sections (concept then
     diagram then example then comparison then exercise then quiz then
     result). It is an ordered list of typed BLOCKS. lesson-renderer.js
     dispatches each block by its `type` to a dedicated render function.
     Two lessons can freely use a different set of block types, in a
     different order and count, without any change to lesson-renderer.js,
     app.js or index.html — that is the property this exists to prove.
     Supported block types today (each has a real renderer in
     lesson-renderer.js): text_short, image_explainer, video, diagram,
     mini_simulation, scenario, case_study, graphical_exercise,
     decision_choice, quiz, summary, journal_link, competency_check,
     chart_observe, zone_identify. "feedback_explanatory" is not a
     standalone block: it is expressed per-choice inside a quiz,
     decision_choice or zone_identify block (`choice.feedback` /
     `zone.feedback`), because that is genuinely how explanatory feedback
     occurs in this product today — inventing a separate block for it
     would misrepresent the mechanic.
     M0.1 below only uses the block types it has real, authored content
     for (text_short, diagram, case_study, scenario, quiz ×2, summary,
     competency_check, journal_link). image_explainer, video,
     mini_simulation and graphical_exercise are real, tested renderers
     with no invented content behind them yet — see test_dda_v18.js,
     which exercises each directly with explicitly labelled structural
     fixtures, never through the live product. M0.1 is one valid
     composition of this engine, not the template every future lesson
     must copy — Golden Lesson #2 (M0.2, below) proves that by composing
     chart_observe, zone_identify and a graded decision_choice into a
     visibly different, observe-then-practice experience with the same
     engine and zero changes to how M0.1 renders or behaves. ---------- */
  function buildM01Lesson() {
    const competency = Object.freeze({ id: 'market_understanding', label: 'Compréhension des marchés' });
    const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 60, quizComplete: 120 });
    const content = Object.freeze({
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
    });
    const practice = Object.freeze({
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
    });
    const evaluation = Object.freeze({
      id: 'quiz',
      label: 'Quiz de validation',
      heading: 'Avant toute décision, que faut-il privilégier ?',
      successText: 'Correct. La discipline du processus passe avant la précipitation.',
      choices: Object.freeze([
        Object.freeze({ text: 'Entrer rapidement pour ne rien manquer.', correct: false, feedback: 'La précipitation est justement ce que ce module déconseille : observer avant d’agir protège ton capital.' }),
        Object.freeze({ text: 'Chercher un gain immédiat.', correct: false, feedback: 'Un gain isolé ne prouve rien sur la qualité d’une décision — c’est le principe essentiel vu plus haut.' }),
        Object.freeze({ text: 'Observer, comprendre et suivre un plan.', correct: true })
      ])
    });
    const result = Object.freeze({
      heading: 'Première compétence confirmée.',
      body: 'Tu as compris que le processus de décision passe avant le résultat.'
    });
    // The stepper (.lesson-loop) and its "done"/"now" highlighting are driven entirely
    // by this declared sequence — lesson-renderer.js and app.js read `steps`, they never
    // hardcode a count or a set of labels. Step ids must still be phase ids the central
    // progress engine (learning-engine.js, unchanged) actually emits from
    // DDALearning.lessonNextStep — 'lesson' | 'exercise' | 'quiz' | 'review' — since that
    // engine is what decides which step is current; a lesson can use any ordered subset
    // of them (a short lesson could skip 'exercise', for instance), but not invent new
    // ones, and a block only advances a step by actually driving the underlying progress
    // flag (an 'exercise'-step quiz block completing exerciseComplete, etc.).
    const steps = Object.freeze([
      Object.freeze({ id: 'lesson', label: 'Comprendre' }),
      Object.freeze({ id: 'exercise', label: 'Exercice' }),
      Object.freeze({ id: 'quiz', label: 'Quiz' }),
      Object.freeze({ id: 'review', label: 'Résultat' })
    ]);
    const blocks = Object.freeze([
      Object.freeze({ type: 'competency_check', id: 'competency-intro', step: 'lesson', mode: 'targets', competency }),
      Object.freeze({ type: 'text_short', id: 'concept', outline: content.concept.heading, step: 'lesson', eyebrow: 'Le concept', heading: content.concept.heading, body: content.concept.body, principle: content.principle }),
      Object.freeze({ type: 'diagram', id: 'exchange-diagram', step: 'lesson', diagram: content.diagram, caption: 'Une décision commence par l’observation.' }),
      Object.freeze({ type: 'case_study', id: 'example', outline: content.example.label, step: 'lesson', label: content.example.label, text: content.example.text }),
      Object.freeze({ type: 'scenario', id: 'comparison', outline: content.comparison.heading, step: 'lesson', heading: content.comparison.heading, bad: content.comparison.bad, good: content.comparison.good }),
      // Learning Experience & Progression Depth V1: the comparison above was
      // purely a static read — the learner never had to actually apply the
      // impulsive-vs-méthodique distinction to a situation. This graded
      // decision_choice (same engine M0.2 already uses, additive, no gating
      // role) makes them choose, get it wrong or right, and see why — a real
      // AGIR→SE TROMPER→COMPRENDRE moment before the exercise, without turning
      // M0.1 into a chart lesson.
      Object.freeze({
        type: 'decision_choice', id: 'comparison-choice', step: 'lesson', outline: 'À toi de choisir', eyebrow: 'Mettre en pratique',
        heading: 'Le prix vient de faire un mouvement brutal. Que fais-tu ?',
        prompt: 'Applique ce que tu viens de voir.',
        options: Object.freeze([
          Object.freeze({ text: 'J’ouvre immédiatement une position pour ne pas rater le mouvement.', correct: false, feedback: 'C’est une réaction impulsive : elle ignore justement le principe vu plus haut — observer avant d’agir.' }),
          Object.freeze({ text: 'J’observe la situation et je vérifie si elle correspond à mon plan avant de décider.', correct: true, feedback: 'C’est une décision méthodique : tu appliques le principe que tu viens de voir.' })
        ])
      }),
      Object.freeze({ type: 'quiz', id: 'exercise', outline: practice.heading, step: 'exercise', locked: false, data: practice }),
      Object.freeze({ type: 'quiz', id: 'quiz', outline: evaluation.heading, step: 'quiz', locked: true, data: evaluation }),
      Object.freeze({ type: 'journal_link', id: 'journal-prompt', step: 'review', prompt: 'Envie de documenter ce que tu retiens de cette leçon avant de continuer ?', cta: 'Ouvrir Journal & Plan' }),
      // Scope decision (Golden Lesson #2 tranche): Parcours' "current chapter" card
      // stays bound to M0.1 only (its routing was explicitly not generalized this
      // tranche — see app.js's isRenderableModule). This CTA is M0.2's real, sole
      // entry point: reachable once M0.1's quiz is actually complete, never before.
      Object.freeze({ type: 'summary', id: 'result', step: 'review', data: result, continueTo: Object.freeze({ view: 'lesson-m02', label: 'Continuer vers Support & Résistance' }) })
    ]);
    return Object.freeze({
      id: 'M0.1',
      title: 'Le trading comme commerce',
      summary: 'Acheteurs, vendeurs et échange d’un actif.',
      estimatedMinutes: 12,
      competency,
      xp,
      content,
      practice,
      evaluation,
      result,
      steps,
      blocks
    });
  }

  /* ---------------------------------------------------------------------
     Golden Lesson #2 — Support & Résistance. Same block/step engine as
     M0.1, deliberately different composition: M0.1 explains a concept
     through reading; this lesson makes the learner OBSERVE a synthetic
     pedagogical chart, TOUCH a zone, get explanatory feedback, then apply
     the same reasoning to a second, less-guided case, spot a flawed
     analysis, and finally prove the competency on a fresh chart. No real
     market data, no live feed, no signal, no entry/position guidance —
     every chart below is hand-authored synthetic geometry, never a real
     quote. Two new block types exist to support this (chart_observe,
     zone_identify) and `decision_choice` gained optional graded options
     (correct/feedback) — both additive, backward-compatible extensions of
     the same engine used by M0.1's blocks. --------------------------- */
  function buildM02Lesson() {
    const competency = Object.freeze({ id: 'zone_reading', label: 'Lecture des zones de support et résistance' });
    const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 70, quizComplete: 130 });

    // Synthetic pedagogical chart geometry (viewBox 0 0 300 160). Never real market data.
    const chartSupport = Object.freeze({
      points: Object.freeze([{ x: 10, y: 40 }, { x: 55, y: 112 }, { x: 95, y: 48 }, { x: 135, y: 110 }, { x: 175, y: 46 }, { x: 215, y: 108 }, { x: 255, y: 52 }, { x: 290, y: 80 }]),
      reactions: Object.freeze([{ x: 55, y: 112 }, { x: 135, y: 110 }, { x: 215, y: 108 }]),
      zone: Object.freeze({ y: 100, height: 20 }),
      ariaLabel: 'Graphique pédagogique synthétique : le prix redescend puis remonte à trois reprises dans la même zone basse.'
    });
    const chartResistance = Object.freeze({
      points: Object.freeze([{ x: 10, y: 120 }, { x: 50, y: 55 }, { x: 90, y: 118 }, { x: 130, y: 52 }, { x: 170, y: 116 }, { x: 210, y: 58 }, { x: 250, y: 112 }, { x: 290, y: 70 }]),
      reactions: Object.freeze([{ x: 50, y: 55 }, { x: 130, y: 52 }, { x: 210, y: 58 }]),
      zone: Object.freeze({ y: 42, height: 20 }),
      ariaLabel: 'Graphique pédagogique synthétique : nouveau cas, le prix redescend à trois reprises depuis la même zone haute.'
    });
    const chartFlawed = Object.freeze({
      points: Object.freeze([{ x: 10, y: 70 }, { x: 40, y: 95 }, { x: 75, y: 60 }, { x: 110, y: 100 }, { x: 150, y: 58 }, { x: 190, y: 98 }, { x: 230, y: 56 }, { x: 270, y: 90 }, { x: 290, y: 64 }]),
      reactions: Object.freeze([{ x: 75, y: 60 }, { x: 150, y: 58 }, { x: 230, y: 56 }]),
      flawReaction: Object.freeze({ x: 270, y: 90 }),
      ariaLabel: 'Graphique pédagogique annoté : une analyse trace une zone autour d’une seule réaction isolée, alors que trois réactions plus nettes apparaissent ailleurs sur le même graphique.'
    });
    const chartChallenge = Object.freeze({
      points: Object.freeze([{ x: 10, y: 50 }, { x: 45, y: 105 }, { x: 85, y: 44 }, { x: 120, y: 108 }, { x: 160, y: 42 }, { x: 200, y: 106 }, { x: 240, y: 48 }, { x: 280, y: 96 }]),
      reactions: Object.freeze([{ x: 45, y: 105 }, { x: 120, y: 108 }, { x: 200, y: 106 }]),
      zone: Object.freeze({ y: 98, height: 20 }),
      ariaLabel: 'Graphique pédagogique synthétique : dernier cas à analyser sans aide.'
    });

    const content = Object.freeze({
      lead: 'Cette leçon ne t’explique pas seulement une notion : elle te fait la pratiquer, comme sur un vrai graphique.'
    });

    const finalCheck = Object.freeze({
      id: 'm2-quiz',
      label: 'Quiz de validation',
      heading: 'Une dernière question avant de valider la compétence.',
      prompt: 'Que représente une zone de support ou de résistance ?',
      successText: 'Correct. Tu distingues une zone de réaction observée plusieurs fois d’un simple prix ponctuel.',
      choices: Object.freeze([
        Object.freeze({ text: 'Un prix exact que le marché ne peut jamais dépasser.', correct: false, feedback: 'C’est le mythe de la ligne parfaite : aucun prix n’est infranchissable, et une zone reste une zone, pas une barrière absolue.' }),
        Object.freeze({ text: 'Une zone où le prix a réagi plusieurs fois de façon visible.', correct: true }),
        Object.freeze({ text: 'Un signal indiquant qu’il faut acheter ou vendre immédiatement.', correct: false, feedback: 'Une zone de réaction n’est ni un signal ni une recommandation de position — elle t’aide seulement à lire le marché.' })
      ])
    });

    const steps = Object.freeze([
      Object.freeze({ id: 'lesson', label: 'Observer' }),
      Object.freeze({ id: 'exercise', label: 'Défi final' }),
      Object.freeze({ id: 'quiz', label: 'Quiz' }),
      Object.freeze({ id: 'review', label: 'Résultat' })
    ]);

    const blocks = Object.freeze([
      Object.freeze({ type: 'competency_check', id: 'm2-competency-intro', step: 'lesson', mode: 'targets', competency }),
      Object.freeze({
        type: 'chart_observe', id: 'm2-observe-1', step: 'lesson', outline: 'Observer', eyebrow: 'Observer',
        heading: 'Regarde simplement le prix.', prompt: 'Qu’est-ce qui semble se produire plusieurs fois dans cette zone ?', chart: chartSupport
      }),
      Object.freeze({
        type: 'zone_identify', id: 'm2-identify-1', step: 'lesson', outline: 'Toucher la zone',
        eyebrow: 'Identifier', heading: 'Touche la zone où le prix a réagi plusieurs fois.',
        prompt: 'Aucune précision au pixel près n’est nécessaire : choisis la bande qui te semble correspondre.',
        chart: chartSupport,
        successText: 'Exactement. Le prix a réagi trois fois au même endroit — c’est ce qui rend cette zone intéressante à observer.',
        reveal: 'Cette zone basse a fait réagir le prix à trois reprises : c’est une zone de réaction. Elle n’est pas un point exact, mais une bande.',
        zones: Object.freeze([
          Object.freeze({ label: 'Zone haute', top: 18, height: 20, correct: false, feedback: 'Regarde plutôt où le prix a répété la même réaction, pas où il a simplement été présent une fois.' }),
          Object.freeze({ label: 'Zone médiane', top: 38, height: 19, correct: false, feedback: 'Le prix traverse cette zone sans jamais y réagir plusieurs fois : ce n’est pas un point de repère.' }),
          Object.freeze({ label: 'Zone basse — plusieurs réactions', top: 58, height: 24, correct: true })
        ])
      }),
      Object.freeze({
        type: 'text_short', id: 'm2-naming', step: 'lesson', outline: 'Nommer',
        eyebrow: 'Nommer', heading: 'Cette zone a un nom : support.',
        body: 'Quand le prix réagit plusieurs fois à la baisse dans la même zone, on parle de zone de support. Si la réaction se produit plutôt vers le haut, on parle de zone de résistance. Le principe est le même : un endroit où le prix a montré, plusieurs fois, qu’il changeait de comportement.',
        principle: Object.freeze({ label: 'Vocabulaire professionnel', text: 'Support et résistance ne sont jamais un prix unique : ce sont des zones de réaction observées plusieurs fois.' })
      }),
      Object.freeze({
        type: 'decision_choice', id: 'm2-myth-line', step: 'lesson', outline: 'Ligne ou zone ?',
        eyebrow: 'Casser un mythe', heading: 'Une ligne parfaite… ou une zone ?',
        prompt: 'Laquelle de ces deux représentations décrit le mieux ce que tu viens d’observer ?',
        options: Object.freeze([
          Object.freeze({ text: 'Une ligne exacte, au prix près, que le marché respecterait à chaque fois.', correct: false, feedback: 'Sur le graphique précédent, les trois réactions ne se sont pas produites exactement au même prix — chercher une ligne parfaite fait perdre l’essentiel.' }),
          Object.freeze({ text: 'Une zone qui regroupe plusieurs réactions proches, sans exiger un prix exact.', correct: true, feedback: 'C’est exactement ce que tu as observé : plusieurs réactions proches, pas un prix unique.' })
        ]),
        note: 'DDA enseigne à raisonner en zones de réaction, jamais à chercher systématiquement un prix exact — cette simplification pédagogique reste une nuance, pas une règle absolue de marché.'
      }),
      Object.freeze({
        type: 'chart_observe', id: 'm2-observe-2', step: 'lesson', outline: 'Deuxième cas', eyebrow: 'Nouveau cas',
        heading: 'Un graphique différent.', prompt: 'Où le prix réagit-il plusieurs fois, cette fois ?', chart: chartResistance
      }),
      Object.freeze({
        type: 'zone_identify', id: 'm2-identify-2', step: 'lesson', outline: 'À toi de jouer',
        eyebrow: 'Identifier sans aide', heading: 'Identifie la zone pertinente.',
        prompt: 'Cette fois, aucune indication supplémentaire : observe et choisis.',
        chart: chartResistance,
        successText: 'C’est la bonne zone : le prix y a réagi trois fois à la baisse, ce qui en fait une résistance.',
        reveal: 'Cette zone haute est une zone de résistance : le prix y a buté trois fois avant de redescendre. La logique est la même que pour le premier cas — seule la direction change.',
        zones: Object.freeze([
          Object.freeze({ label: 'Zone haute — plusieurs réactions', top: 18, height: 20, correct: true }),
          Object.freeze({ label: 'Zone médiane', top: 38, height: 19, correct: false, feedback: 'Le prix traverse cette zone sans y réagir plusieurs fois.' }),
          Object.freeze({ label: 'Zone basse', top: 58, height: 24, correct: false, feedback: 'Le prix ne réagit pas plusieurs fois ici sur ce graphique — regarde plutôt en haut.' })
        ])
      }),
      Object.freeze({
        type: 'chart_observe', id: 'm2-observe-3', step: 'lesson', outline: 'Repérer une erreur', eyebrow: 'Analyse à corriger',
        heading: 'Une analyse déjà tracée — mais fragile.', prompt: 'Une zone a été entourée sur ce graphique. Regarde bien avant de continuer.',
        chart: chartFlawed, flaw: true
      }),
      Object.freeze({
        type: 'decision_choice', id: 'm2-spot-error', step: 'lesson', outline: 'Qu’est-ce qui est fragile ?',
        eyebrow: 'Esprit critique', heading: 'Qu’est-ce qui te paraît fragile dans cette analyse ?',
        prompt: 'Choisis le raisonnement le plus juste.',
        options: Object.freeze([
          Object.freeze({ text: 'Rien : une seule réaction suffit toujours à définir une zone fiable.', correct: false, feedback: 'Une réaction isolée ne prouve rien : c’est justement l’erreur à éviter. Une vraie zone se confirme par plusieurs réactions.' }),
          Object.freeze({ text: 'La zone entourée ne repose que sur une réaction isolée, alors que trois réactions plus nettes existent ailleurs sur le même graphique.', correct: true, feedback: 'Exactement. Une zone de réaction se confirme par répétition — pas par une seule coïncidence.' }),
          Object.freeze({ text: 'Le graphique est trop compliqué pour être analysé.', correct: false, feedback: 'Le graphique se lit très bien une fois qu’on cherche la répétition, pas la complexité apparente.' })
        ])
      }),
      Object.freeze({
        type: 'chart_observe', id: 'm2-observe-4', step: 'exercise', outline: 'Défi final', eyebrow: 'Défi final',
        heading: 'Un dernier graphique, sans aide.', prompt: 'Identifie la zone la plus pertinente, puis réponds à la question qui suit.', chart: chartChallenge
      }),
      Object.freeze({
        type: 'zone_identify', id: 'm2-challenge-zone', step: 'exercise', outline: 'Identifier la zone',
        eyebrow: 'Défi final', heading: 'Quelle est la zone la plus pertinente ici ?',
        chart: chartChallenge,
        successText: 'Bonne lecture : trois réactions confirment cette zone comme une zone de support pertinente.',
        reveal: 'Comme dans le premier cas, trois réactions au même endroit confirment la zone — la même lecture s’applique, sur un graphique différent.',
        zones: Object.freeze([
          Object.freeze({ label: 'Zone haute', top: 18, height: 19, correct: false, feedback: 'Le prix passe par ici sans y réagir plusieurs fois.' }),
          Object.freeze({ label: 'Zone médiane', top: 38, height: 19, correct: false, feedback: 'Aucune répétition claire ici : regarde plus bas.' }),
          Object.freeze({ label: 'Zone basse — plusieurs réactions', top: 58, height: 24, correct: true })
        ])
      }),
      Object.freeze({ type: 'quiz', id: 'm2-quiz', outline: finalCheck.heading, step: 'quiz', locked: true, data: finalCheck }),
      Object.freeze({ type: 'journal_link', id: 'm2-journal-prompt', step: 'review', prompt: 'Envie de noter ce que tu retiens de cet exercice dans ton Journal ?', cta: 'Ouvrir Journal & Plan' }),
      // M0.3 tranche: gives M0.2's result screen the same real "continue" CTA
      // M0.1's already has — M0.3 is now the next real lesson, so this is no
      // longer the dead end it honestly had to be before it existed.
      Object.freeze({ type: 'summary', id: 'm2-result', step: 'review', idSuffix: 'm2', continueTo: Object.freeze({ view: 'lesson-m03', label: 'Continuer vers Lire une tendance' }), data: Object.freeze({ heading: 'Compétence de lecture confirmée.', body: 'Tu as observé, identifié une zone, corrigé une analyse fragile et validé ta lecture sur un nouveau cas.' }) })
    ]);

    return Object.freeze({
      id: 'M0.2',
      title: 'Support & Résistance',
      summary: 'Observer, toucher et valider une zone de réaction — sans signal, sans position.',
      estimatedMinutes: 14,
      markUnderstoodLabel: 'Passer au défi final',
      competency,
      xp,
      content,
      steps,
      blocks
    });
  }

  /* ---------------------------------------------------------------------
     M0.3 — Lire une tendance. Gap identified after inspecting M0.1 (the
     market as an exchange) and M0.2 (spotting a horizontal reaction zone
     on ONE chart, explored in depth): nothing yet teaches the more basic,
     genuinely different chart-reading skill of reading a trend's overall
     DIRECTION (up / down / range) across several independent charts. This
     is a real prerequisite for M1 ("Comprendre les marchés financiers" —
     why prices move) without duplicating M1's own planned content (this
     lesson only ever describes a direction already observed, never why it
     happened). Deliberately a different rhythm from both predecessors:
     M0.1 has zero charts; M0.2 explores ONE chart in depth across many
     blocks with a spatial "touch a zone" interaction (zone_identify).
     M0.3 instead shows three short, independent charts in a compare/
     classify rhythm, each resolved by a categorical multiple-choice
     judgement (decision_choice) — genuinely different because "which of
     three directions is this" is a classification act, not a spatial one,
     so reusing decision_choice here is competency-driven, not component
     reuse for its own sake. Zero changes to lesson-renderer.js or
     learning-engine.js were needed: every block type below (competency_check,
     text_short, case_study, chart_observe, decision_choice, quiz,
     journal_link, summary) already existed with a real renderer, and each
     one's own id already scopes it safely — proving the engine already
     supported a third independently-mounted lesson with no new surface. --- */
  function buildM03Lesson() {
    const competency = Object.freeze({ id: 'trend_reading', label: 'Lecture de tendance' });
    const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 70, quizComplete: 130 });

    // Synthetic pedagogical chart geometry (viewBox 0 0 300 160), same convention
    // as M0.2 — never real market data. No `reactions`/`zone` needed here: this
    // lesson reads the overall slope of the line, not a horizontal band.
    const chartUp = Object.freeze({
      points: Object.freeze([{ x: 10, y: 128 }, { x: 50, y: 118 }, { x: 90, y: 125 }, { x: 130, y: 100 }, { x: 170, y: 108 }, { x: 210, y: 78 }, { x: 250, y: 88 }, { x: 290, y: 52 }]),
      ariaLabel: 'Graphique pédagogique synthétique : le prix progresse globalement vers le haut malgré quelques reculs temporaires.'
    });
    const chartDown = Object.freeze({
      points: Object.freeze([{ x: 10, y: 40 }, { x: 50, y: 52 }, { x: 90, y: 46 }, { x: 130, y: 72 }, { x: 170, y: 64 }, { x: 210, y: 96 }, { x: 250, y: 88 }, { x: 290, y: 124 }]),
      ariaLabel: 'Graphique pédagogique synthétique : le prix recule globalement malgré quelques rebonds temporaires.'
    });
    const chartRange = Object.freeze({
      points: Object.freeze([{ x: 10, y: 82 }, { x: 50, y: 60 }, { x: 90, y: 98 }, { x: 130, y: 64 }, { x: 170, y: 96 }, { x: 210, y: 62 }, { x: 250, y: 92 }, { x: 290, y: 80 }]),
      ariaLabel: 'Graphique pédagogique synthétique : le prix oscille dans une bande sans direction générale nette.'
    });
    const chartChallenge = Object.freeze({
      points: Object.freeze([{ x: 10, y: 120 }, { x: 45, y: 132 }, { x: 85, y: 100 }, { x: 120, y: 110 }, { x: 160, y: 78 }, { x: 200, y: 90 }, { x: 240, y: 55 }, { x: 280, y: 66 }]),
      ariaLabel: 'Graphique pédagogique synthétique : dernier cas à analyser sans aide.'
    });

    const content = Object.freeze({
      lead: 'Cette leçon ne t’apprend pas à prédire le marché : elle t’apprend à décrire calmement ce qu’il vient de faire.'
    });

    function trendOptions(correctLabel) {
      const base = [
        Object.freeze({ key: 'up', text: 'Tendance haussière : le prix progresse globalement vers le haut.', wrong: 'Regarde l’ensemble du graphique, pas un instant isolé : compare surtout le point de départ et le point d’arrivée.' }),
        Object.freeze({ key: 'down', text: 'Tendance baissière : le prix recule globalement.', wrong: 'Regarde l’ensemble du graphique, pas un instant isolé : compare surtout le point de départ et le point d’arrivée.' }),
        Object.freeze({ key: 'range', text: 'Tendance latérale : le prix oscille sans direction générale claire.', wrong: 'Ici, la direction générale entre le début et la fin du graphique est en réalité assez nette.' })
      ];
      return Object.freeze(base.map(opt => Object.freeze({
        text: opt.text,
        correct: opt.key === correctLabel,
        feedback: opt.key === correctLabel ? undefined : opt.wrong
      })));
    }

    const finalCheck = Object.freeze({
      id: 'm3-quiz',
      label: 'Quiz de validation',
      heading: 'Une dernière question avant de valider la compétence.',
      prompt: 'Que signifie une tendance haussière ?',
      successText: 'Correct. Tu distingues une direction générale déjà observée d’une prédiction sur l’avenir.',
      choices: Object.freeze([
        Object.freeze({ text: 'Une garantie que le prix va continuer à monter.', correct: false, feedback: 'Une tendance décrit un mouvement déjà observé, jamais une garantie sur l’avenir — c’est une lecture, pas une prédiction.' }),
        Object.freeze({ text: 'Une direction générale où le prix a globalement progressé sur la période observée.', correct: true }),
        Object.freeze({ text: 'Un signal indiquant qu’il faut acheter immédiatement.', correct: false, feedback: 'Une tendance n’est ni un signal ni une recommandation de position — elle t’aide seulement à lire le contexte du marché.' })
      ])
    });

    const steps = Object.freeze([
      Object.freeze({ id: 'lesson', label: 'Observer' }),
      Object.freeze({ id: 'exercise', label: 'Défi final' }),
      Object.freeze({ id: 'quiz', label: 'Quiz' }),
      Object.freeze({ id: 'review', label: 'Résultat' })
    ]);

    const blocks = Object.freeze([
      Object.freeze({ type: 'competency_check', id: 'm3-competency-intro', step: 'lesson', mode: 'targets', competency }),
      Object.freeze({
        type: 'text_short', id: 'm3-concept', step: 'lesson', outline: 'Une tendance, c’est une direction déjà observée',
        eyebrow: 'Le concept', heading: 'Une tendance, c’est une direction déjà observée.',
        body: 'Quand le prix progresse globalement dans un sens sur une période, on parle de tendance. Trois états suffisent à la décrire : elle monte, elle descend, ou elle n’a pas de direction claire.',
        principle: Object.freeze({ label: 'Principe essentiel', text: 'Lire une tendance, c’est constater un mouvement passé, jamais prédire un mouvement futur.' })
      }),
      Object.freeze({
        type: 'case_study', id: 'm3-example', step: 'lesson', outline: 'Exemple concret', label: 'Exemple concret',
        text: 'Que tu observes le cours d’une action à la BRVM, le prix international d’une matière première ou une paire de devises, la même lecture s’applique : regarder la direction générale, pas un instant isolé.'
      }),
      Object.freeze({
        type: 'chart_observe', id: 'm3-observe-1', step: 'lesson', outline: 'Premier graphique', eyebrow: 'Observer',
        heading: 'Premier graphique.', prompt: 'Que remarques-tu sur la direction générale du prix ?', chart: chartUp
      }),
      Object.freeze({
        type: 'decision_choice', id: 'm3-classify-1', step: 'lesson', outline: 'Classer', eyebrow: 'Classer',
        heading: 'Comment qualifierais-tu ce graphique ?', prompt: 'Choisis la description la plus juste.',
        options: trendOptions('up')
      }),
      Object.freeze({
        type: 'chart_observe', id: 'm3-observe-2', step: 'lesson', outline: 'Deuxième graphique', eyebrow: 'Nouveau cas',
        heading: 'Deuxième graphique.', prompt: 'Un nouveau cas — regarde bien avant de répondre.', chart: chartDown
      }),
      Object.freeze({
        type: 'decision_choice', id: 'm3-classify-2', step: 'lesson', outline: 'Classer', eyebrow: 'Classer',
        heading: 'Comment qualifierais-tu ce graphique ?', prompt: 'Choisis la description la plus juste.',
        options: trendOptions('down')
      }),
      Object.freeze({
        type: 'chart_observe', id: 'm3-observe-3', step: 'lesson', outline: 'Troisième graphique', eyebrow: 'Nouveau cas',
        heading: 'Troisième graphique.', prompt: 'Ce cas est différent des deux précédents.', chart: chartRange
      }),
      Object.freeze({
        type: 'decision_choice', id: 'm3-classify-3', step: 'lesson', outline: 'Classer', eyebrow: 'Classer',
        heading: 'Comment qualifierais-tu ce graphique ?', prompt: 'Choisis la description la plus juste.',
        options: trendOptions('range')
      }),
      Object.freeze({
        type: 'chart_observe', id: 'm3-observe-4', step: 'exercise', outline: 'Défi final', eyebrow: 'Défi final',
        heading: 'Un dernier graphique, sans aide.', prompt: 'Identifie la tendance, puis réponds à la question qui suit.', chart: chartChallenge
      }),
      Object.freeze({
        type: 'decision_choice', id: 'm3-challenge', step: 'exercise', outline: 'Défi final', eyebrow: 'Défi final',
        heading: 'Quelle est la tendance ici ?', prompt: 'Choisis la description la plus juste.',
        options: trendOptions('up')
      }),
      Object.freeze({ type: 'quiz', id: 'm3-quiz', outline: finalCheck.heading, step: 'quiz', locked: true, data: finalCheck }),
      Object.freeze({ type: 'journal_link', id: 'm3-journal-prompt', step: 'review', prompt: 'Envie de noter ce que tu retiens de cette lecture de tendance dans ton Journal ?', cta: 'Ouvrir Journal & Plan' }),
      Object.freeze({ type: 'summary', id: 'm3-result', step: 'review', idSuffix: 'm3', continueTo: Object.freeze({ view: 'lesson-m11', label: 'Continuer vers Pourquoi les prix évoluent ?' }), data: Object.freeze({ heading: 'Compétence de lecture de tendance confirmée.', body: 'Tu as observé plusieurs graphiques, classé leur direction générale et confirmé ta lecture sur un cas sans aide.' }) })
    ]);

    return Object.freeze({
      id: 'M0.3',
      title: 'Lire une tendance',
      summary: 'Reconnaître une direction générale sur un graphique — sans jamais prédire la suite.',
      estimatedMinutes: 12,
      markUnderstoodLabel: 'Passer au défi final',
      competency,
      xp,
      content,
      steps,
      blocks
    });
  }

  /* ---------------------------------------------------------------------
     M1.1 — Pourquoi les prix évoluent ?
     First authored lesson of M1. It teaches price formation through buyers,
     sellers, counterparties, liquidity and pressure — never signals, entries
     or live-market claims. All visual cases are synthetic pedagogical geometry.
     M1 itself is gated by learning-engine.js behind completion of the authored
     M0 module, so this lesson only becomes actionable after M0.1–M0.3 are
     genuinely completed. -------------------------------------------------- */
  function buildM11Lesson() {
    const competency = Object.freeze({ id: 'price_formation', label: 'Compréhension de la formation du prix' });
    const xp = Object.freeze({ lessonViewed: 40, exerciseComplete: 80, quizComplete: 150 });

    const chartUp = Object.freeze({
      points: Object.freeze([{ x: 10, y: 118 }, { x: 55, y: 112 }, { x: 95, y: 100 }, { x: 135, y: 88 }, { x: 175, y: 72 }, { x: 215, y: 62 }, { x: 255, y: 48 }, { x: 290, y: 38 }]),
      ariaLabel: 'Cas pédagogique synthétique : la pression acheteuse devient plus forte que l’offre immédiatement disponible et le prix progresse.'
    });
    const chartDown = Object.freeze({
      points: Object.freeze([{ x: 10, y: 42 }, { x: 55, y: 50 }, { x: 95, y: 62 }, { x: 135, y: 76 }, { x: 175, y: 88 }, { x: 215, y: 102 }, { x: 255, y: 116 }, { x: 290, y: 124 }]),
      ariaLabel: 'Cas pédagogique synthétique : la pression vendeuse devient plus forte que la demande immédiatement disponible et le prix recule.'
    });
    const chartBalance = Object.freeze({
      points: Object.freeze([{ x: 10, y: 82 }, { x: 50, y: 66 }, { x: 90, y: 92 }, { x: 130, y: 70 }, { x: 170, y: 90 }, { x: 210, y: 68 }, { x: 250, y: 88 }, { x: 290, y: 80 }]),
      ariaLabel: 'Cas pédagogique synthétique : acheteurs et vendeurs trouvent suffisamment de contreparties et le prix oscille sans pression directionnelle nette.'
    });
    const chartApply = Object.freeze({
      points: Object.freeze([{ x: 10, y: 116 }, { x: 50, y: 110 }, { x: 90, y: 96 }, { x: 130, y: 86 }, { x: 170, y: 70 }, { x: 210, y: 58 }, { x: 250, y: 46 }, { x: 290, y: 34 }]),
      ariaLabel: 'Nouveau cas pédagogique synthétique à interpréter : progression graduelle du prix.'
    });

    const content = Object.freeze({
      lead: 'Un prix ne bouge pas parce qu’une courbe “décide” de monter ou descendre. Il bouge quand les intentions d’achat et de vente ne trouvent plus le même équilibre au prix actuel.'
    });

    const finalCheck = Object.freeze({
      id: 'm11-quiz',
      label: 'Quiz de validation',
      heading: 'Prouve que tu comprends le mécanisme.',
      prompt: 'Pourquoi un prix peut-il rester dans une zone sans direction claire ?',
      successText: 'Correct. Tu relies maintenant mouvement et équilibre des intentions, sans transformer cela en signal.',
      choices: Object.freeze([
        Object.freeze({ text: 'Parce que le marché est arrêté.', correct: false, feedback: 'Un marché peut continuer à échanger tout en restant équilibré : des contreparties existent des deux côtés et aucune pression ne domine durablement.' }),
        Object.freeze({ text: 'Parce que les intentions d’achat et de vente trouvent suffisamment de contreparties et qu’aucune pression ne domine clairement.', correct: true }),
        Object.freeze({ text: 'Parce qu’un indicateur interdit au prix de sortir de la zone.', correct: false, feedback: 'Aucun indicateur ne contrôle le prix. Ici on explique seulement un état d’équilibre entre participants.' })
      ])
    });

    const steps = Object.freeze([
      Object.freeze({ id: 'lesson', label: 'Observer & comprendre' }),
      Object.freeze({ id: 'exercise', label: 'Appliquer' }),
      Object.freeze({ id: 'quiz', label: 'Prouver' }),
      Object.freeze({ id: 'review', label: 'Résultat' })
    ]);

    const blocks = Object.freeze([
      Object.freeze({ type: 'competency_check', id: 'm11-competency-intro', step: 'lesson', mode: 'targets', competency }),
      Object.freeze({
        type: 'text_short', id: 'm11-concept', step: 'lesson', outline: 'Ce qui fait bouger un prix',
        eyebrow: 'Comprendre', heading: 'Un prix se forme quand un acheteur rencontre un vendeur.',
        body: 'Chaque transaction a une contrepartie : pour acheter, quelqu’un doit accepter de vendre. La liquidité décrit la capacité du marché à trouver ces contreparties. Quand beaucoup d’ordres agressifs arrivent d’un côté et que les contreparties proches deviennent insuffisantes, le prix doit chercher plus loin.',
        principle: Object.freeze({ label: 'Idée clé', text: 'Hausse, baisse ou équilibre décrivent la relation entre pression d’achat, pression de vente et liquidité disponible — pas une certitude sur le prochain mouvement.' })
      }),
      Object.freeze({
        type: 'chart_observe', id: 'm11-up-observe', step: 'lesson', outline: 'Cas 1 · Pression acheteuse',
        eyebrow: 'Observer', heading: 'Cas 1 — acheteurs agressifs, peu de vendeurs disponibles.', prompt: 'Observe le déplacement synthétique du prix.', chart: chartUp
      }),
      Object.freeze({
        type: 'decision_choice', id: 'm11-up-decision', step: 'lesson', outline: 'Décider · Cas 1',
        eyebrow: 'Réfléchir', heading: 'Quelle explication est la plus cohérente ?', prompt: 'Choisis, puis lis le feedback.',
        options: Object.freeze([
          Object.freeze({ text: 'La pression acheteuse pousse le prix à chercher des vendeurs plus haut.', correct: true, feedback: 'Exact. Quand les acheteurs consomment les vendeurs disponibles au prix actuel, la transaction suivante peut devoir se faire plus haut.' }),
          Object.freeze({ text: 'Un achat suffit toujours à faire monter le marché.', correct: false, feedback: 'Non. Une transaction a toujours une contrepartie. C’est le déséquilibre persistant entre pression et liquidité disponible qui compte, pas un achat isolé.' }),
          Object.freeze({ text: 'Le graphique prouve que le prix continuera de monter.', correct: false, feedback: 'Le cas explique ce qui vient de se produire. Il ne prédit pas la suite et ne constitue aucun signal.' })
        ])
      }),
      Object.freeze({
        type: 'chart_observe', id: 'm11-down-observe', step: 'lesson', outline: 'Cas 2 · Pression vendeuse',
        eyebrow: 'Observer', heading: 'Cas 2 — vendeurs agressifs, peu d’acheteurs disponibles.', prompt: 'Même logique, direction inverse.', chart: chartDown
      }),
      Object.freeze({
        type: 'decision_choice', id: 'm11-down-decision', step: 'lesson', outline: 'Décider · Cas 2',
        eyebrow: 'Réfléchir', heading: 'Pourquoi le prix recule-t-il dans ce cas ?', prompt: 'Choisis la meilleure explication.',
        options: Object.freeze([
          Object.freeze({ text: 'Les vendeurs doivent accepter des prix plus bas pour trouver suffisamment d’acheteurs.', correct: true, feedback: 'Exact. La pression vendeuse consomme la demande disponible et le prix cherche de nouvelles contreparties plus bas.' }),
          Object.freeze({ text: 'Parce qu’il n’existe plus aucun acheteur.', correct: false, feedback: 'Il existe toujours une contrepartie à chaque transaction exécutée. Le problème est la quantité disponible au prix actuel, pas l’absence totale d’acheteurs.' }),
          Object.freeze({ text: 'Parce que toute baisse signifie qu’il faut vendre.', correct: false, feedback: 'Une explication de mouvement n’est pas une recommandation de position.' })
        ])
      }),
      Object.freeze({
        type: 'chart_observe', id: 'm11-balance-observe', step: 'lesson', outline: 'Cas 3 · Équilibre',
        eyebrow: 'Observer', heading: 'Cas 3 — suffisamment de contreparties des deux côtés.', prompt: 'Ici, aucune pression ne domine durablement.', chart: chartBalance
      }),
      Object.freeze({
        type: 'decision_choice', id: 'm11-balance-decision', step: 'lesson', outline: 'Décider · Cas 3',
        eyebrow: 'Réfléchir', heading: 'Quelle lecture décrit le mieux cette situation ?', prompt: 'Cherche l’explication, pas un signal.',
        options: Object.freeze([
          Object.freeze({ text: 'Les acheteurs et vendeurs trouvent des contreparties sans déséquilibre durable : le prix oscille.', correct: true, feedback: 'Exact. C’est un état de balance : le marché échange, mais aucune pression ne déplace durablement le prix dans une seule direction.' }),
          Object.freeze({ text: 'Personne ne négocie sur le marché.', correct: false, feedback: 'Un prix peut osciller tout en enregistrant beaucoup d’échanges. L’absence de direction ne signifie pas absence d’activité.' }),
          Object.freeze({ text: 'Le prix est obligé de rester dans cette zone.', correct: false, feedback: 'Aucune zone n’est une prison. Si l’équilibre change, le prix peut se déplacer.' })
        ])
      }),
      Object.freeze({
        type: 'case_study', id: 'm11-liquidity', step: 'lesson', outline: 'Liquidité & contreparties',
        label: 'Relier les notions', text: 'Imagine un marché où 100 acheteurs veulent exécuter immédiatement, mais où très peu de vendeurs acceptent le prix actuel. Pour continuer à échanger, des acheteurs peuvent accepter de payer plus cher. L’inverse vaut quand les vendeurs dominent. La liquidité indique simplement à quel point des contreparties sont disponibles autour du prix.'
      }),
      Object.freeze({
        type: 'chart_observe', id: 'm11-apply-observe', step: 'exercise', outline: 'Application',
        eyebrow: 'Appliquer', heading: 'Nouveau cas — sans explication préalable.', prompt: 'Observe, puis explique le mécanisme avec les notions de pression et de contrepartie.', chart: chartApply
      }),
      Object.freeze({
        type: 'decision_choice', id: 'm11-apply', step: 'exercise', outline: 'Application',
        eyebrow: 'À toi', heading: 'Quelle explication tient le mieux ?', prompt: 'Une seule réponse décrit le mécanisme sans faire de prédiction.',
        options: Object.freeze([
          Object.freeze({ text: 'La pression acheteuse semble avoir consommé une partie des vendeurs disponibles, poussant les échanges vers des prix plus hauts.', correct: true, feedback: 'Bonne application : tu expliques le mouvement par pression et liquidité, sans promettre la suite.' }),
          Object.freeze({ text: 'La hausse garantit que la prochaine décision doit être un achat.', correct: false, feedback: 'Ce serait transformer une observation en signal. La leçon n’enseigne pas cela.' }),
          Object.freeze({ text: 'Il n’y avait aucun vendeur pendant la hausse.', correct: false, feedback: 'Chaque transaction exécutée implique acheteur et vendeur. Ce qui change est leur disponibilité relative aux différents prix.' })
        ])
      }),
      Object.freeze({ type: 'quiz', id: 'm11-quiz', outline: finalCheck.heading, step: 'quiz', locked: true, data: finalCheck }),
      Object.freeze({ type: 'journal_link', id: 'm11-journal-prompt', step: 'review', prompt: 'Écris avec tes propres mots pourquoi un prix peut monter, baisser ou rester en équilibre.', cta: 'Ouvrir Journal & Plan' }),
      Object.freeze({ type: 'summary', id: 'm11-result', step: 'review', idSuffix: 'm11', data: Object.freeze({ heading: 'Compétence de formation du prix confirmée.', body: 'Tu as expliqué une hausse, une baisse et un équilibre à partir des contreparties, de la liquidité et de la pression — sans confondre compréhension et signal.' }) })
    ]);

    return Object.freeze({
      id: 'M1.1',
      title: 'Pourquoi les prix évoluent ?',
      summary: 'Acheteurs, vendeurs, contreparties, liquidité et déséquilibre.',
      estimatedMinutes: 16,
      markUnderstoodLabel: 'Passer à l’application',
      competency,
      xp,
      content,
      steps,
      blocks
    });
  }

  // M1-M9 are structural placeholders (empty lessons[]) — no content invented.
  // M1/M2 titles come from the validated roadmap (DDA_HANDOVER_BRIEF-1.md); no
  // real title exists yet for M3-M9 there, so their title is the honest "À
  // venir" fallback (Learning Experience & Progression Depth V1, mandat §9) —
  // never a generic "Module M3" placeholder that reads as a broken feature.
  const curriculum = Object.freeze({
    id: 'darius-free',
    title: 'Darius Free',
    modules: Object.freeze([
      { id: 'M0', title: 'Fondations des marchés', lessons: Object.freeze([buildM01Lesson(), buildM02Lesson(), buildM03Lesson()]) },
      { id: 'M1', title: 'Comprendre les marchés financiers', summary: 'Pourquoi les prix évoluent et comment les marchés s’organisent.', lessons: Object.freeze([buildM11Lesson()]) },
      { id: 'M2', title: 'Risque et discipline', summary: 'Protéger son capital avant de rechercher la performance.', lessons: Object.freeze([]) },
      { id: 'M3', title: 'À venir', lessons: Object.freeze([]) },
      { id: 'M4', title: 'À venir', lessons: Object.freeze([]) },
      { id: 'M5', title: 'À venir', lessons: Object.freeze([]) },
      { id: 'M6', title: 'À venir', lessons: Object.freeze([]) },
      { id: 'M7', title: 'À venir', lessons: Object.freeze([]) },
      { id: 'M8', title: 'À venir', lessons: Object.freeze([]) },
      { id: 'M9', title: 'À venir', lessons: Object.freeze([]) }
    ])
  });

  const PRIMARY_LESSON_ID = curriculum.modules[0].lessons[0].id;

  function emptyLessonProgress() {
    return { lessonViewed: false, exerciseComplete: false, quizComplete: false };
  }

  function emptyJournalPlan() {
    return {
      marketsStudied: '',
      studySlots: '',
      checklist: '',
      disciplineRules: '',
      learningGoals: '',
      mistakesToAvoid: '',
      pointsToVerify: '',
      updatedAt: null
    };
  }

  function emptyState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      user: null,
      membership: { plan: 'free', status: 'demo' },
      onboarding: null,
      lessons: {},
      // Journal & Plan V1 — a personal record of process, never of performance.
      // `entries` documents individual reflections (plan → act → review); `plan`
      // is the single standing document of the learner's own process rules.
      // Shape kept intentionally flat and generic so later layers (personal
      // stats, Weekly Review, Decision Replay, Darius AI, Trading Lab, Trader
      // DNA) can read from it without a migration.
      journal: { entries: [], plan: emptyJournalPlan() },
      preferences: { lowData: false, reminders: false },
      events: [],
      // Acquisition V1 — first-touch attribution only, captured once per device
      // by DDA.captureAcquisition(). No PII: a locally generated pseudonymous
      // visitorId plus the UTM/referrer context of the first real visit.
      acquisition: emptyAcquisition(),
      updatedAt: null
    };
  }

  function emptyAcquisition() {
    return { visitorId: null, source: null, medium: null, campaign: null, referrer: null, landingPath: null, firstSeenAt: null };
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

  const JOURNAL_TEXT_FIELDS = ['market', 'context', 'scenario', 'process', 'decision', 'outcome', 'whatWorked', 'toImprove', 'note'];

  function sanitizeJournalEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const entry = { id: sanitizeText(raw.id, 40) || `entry-${Date.now()}-${Math.round(Math.random() * 1000)}` };
    JOURNAL_TEXT_FIELDS.forEach(field => { entry[field] = sanitizeText(raw[field], 800); });
    entry.createdAt = sanitizeText(raw.createdAt, 40) || new Date().toISOString();
    entry.updatedAt = sanitizeText(raw.updatedAt, 40) || entry.createdAt;
    // An entry with every field blank carries nothing real to keep.
    if (!JOURNAL_TEXT_FIELDS.some(field => entry[field])) return null;
    return entry;
  }

  function sanitizeJournalPlan(raw) {
    const plan = emptyJournalPlan();
    if (!raw || typeof raw !== 'object') return plan;
    Object.keys(plan).forEach(field => {
      if (field === 'updatedAt') return;
      plan[field] = sanitizeText(raw[field], 600);
    });
    plan.updatedAt = sanitizeText(raw.updatedAt, 40) || null;
    return plan;
  }

  function sanitizeJournal(raw) {
    const entries = Array.isArray(raw?.entries) ? raw.entries.map(sanitizeJournalEntry).filter(Boolean).slice(0, 300) : [];
    return { entries, plan: sanitizeJournalPlan(raw?.plan) };
  }

  function sanitizeAcquisition(raw) {
    const acquisition = emptyAcquisition();
    if (!raw || typeof raw !== 'object') return acquisition;
    acquisition.visitorId = raw.visitorId ? sanitizeText(raw.visitorId, 60) : null;
    acquisition.source = raw.source ? sanitizeText(raw.source, 120) : null;
    acquisition.medium = raw.medium ? sanitizeText(raw.medium, 120) : null;
    acquisition.campaign = raw.campaign ? sanitizeText(raw.campaign, 120) : null;
    acquisition.referrer = raw.referrer ? sanitizeText(raw.referrer, 300) : null;
    acquisition.landingPath = raw.landingPath ? sanitizeText(raw.landingPath, 300) : null;
    acquisition.firstSeenAt = raw.firstSeenAt ? sanitizeText(raw.firstSeenAt, 40) : null;
    return acquisition;
  }

  function generateVisitorId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `visitor-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
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
        journal: sanitizeJournal(raw.journal),
        events: Array.isArray(raw.events) ? raw.events.slice(-50) : [],
        acquisition: sanitizeAcquisition(raw.acquisition)
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
      next.acquisition = sanitizeAcquisition(raw.acquisition);
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
    emptyJournalEntry() {
      const entry = { id: '' };
      JOURNAL_TEXT_FIELDS.forEach(field => { entry[field] = ''; });
      return entry;
    },
    addJournalEntry(state, fields) {
      const now = new Date().toISOString();
      const entry = sanitizeJournalEntry({ ...fields, id: `entry-${Date.now()}`, createdAt: now, updatedAt: now });
      if (!entry) return state;
      const journal = state.journal || { entries: [], plan: emptyJournalPlan() };
      return save({ ...state, journal: { ...journal, entries: [entry, ...journal.entries] } });
    },
    updateJournalEntry(state, id, fields) {
      const journal = state.journal || { entries: [], plan: emptyJournalPlan() };
      const now = new Date().toISOString();
      const entries = journal.entries.map(entry => entry.id === id ? (sanitizeJournalEntry({ ...entry, ...fields, id, updatedAt: now }) || entry) : entry);
      return save({ ...state, journal: { ...journal, entries } });
    },
    deleteJournalEntry(state, id) {
      const journal = state.journal || { entries: [], plan: emptyJournalPlan() };
      return save({ ...state, journal: { ...journal, entries: journal.entries.filter(entry => entry.id !== id) } });
    },
    saveJournalPlan(state, fields) {
      const journal = state.journal || { entries: [], plan: emptyJournalPlan() };
      const plan = sanitizeJournalPlan({ ...fields, updatedAt: new Date().toISOString() });
      return save({ ...state, journal: { ...journal, plan } });
    },
    // Acquisition V1 — first-touch attribution, captured once per device. A
    // pseudonymous visitorId is generated the first time this is called; the
    // source/medium/campaign/referrer of that first real visit are then kept
    // for the lifetime of the device's local state and never overwritten by a
    // later visit, so a returning visitor's original attribution isn't lost.
    // No email, name or other identity ever passes through this path.
    captureAcquisition(state, params) {
      if (state.acquisition && state.acquisition.visitorId) return state;
      const acquisition = sanitizeAcquisition({
        visitorId: generateVisitorId(),
        source: params?.source,
        medium: params?.medium,
        campaign: params?.campaign,
        referrer: params?.referrer,
        landingPath: params?.landingPath,
        firstSeenAt: new Date().toISOString()
      });
      return save({ ...state, acquisition });
    },
    // Versioned deliberately (see EVENT_NAMES comment above): a future
    // activation_v2 definition must be added as a new function, never by
    // redefining this one, so past activation_v1 events keep the meaning they
    // had when they were recorded.
    isActivated_v1(state) {
      return Boolean(state?.lessons?.['M0.1']?.quizComplete);
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
