// DDA M1.2 — Golden Lesson: Comment les ordres s'exécutent ?
(function (root, factory) {
  const lesson = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = lesson;
  else root.DDAM12GoldenLesson = lesson;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const competency = Object.freeze({ id: 'order_execution_understanding', label: 'Compréhension des ordres et de l’exécution' });
  const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 80, quizComplete: 140 });
  const content = Object.freeze({
    lead: 'Cette leçon explique comment les ordres rencontrent la liquidité disponible : bid, ask, spread, ordre au marché, ordre limite et exécution — sans transformer ces notions en conseil de trading.'
  });
  const steps = Object.freeze([
    Object.freeze({ id: 'lesson', label: 'Observer' }),
    Object.freeze({ id: 'exercise', label: 'Appliquer' }),
    Object.freeze({ id: 'quiz', label: 'Prouver' }),
    Object.freeze({ id: 'review', label: 'Résultat' })
  ]);

  const immediateOptions = Object.freeze([
    Object.freeze({ text: 'Un ordre au marché privilégie l’exécution immédiate, mais ne garantit pas un prix exact.', correct: true, feedback: 'Exact. Il cherche à s’exécuter contre la liquidité disponible. Si plusieurs niveaux sont nécessaires, le prix moyen peut différer du premier prix affiché.' }),
    Object.freeze({ text: 'Un ordre au marché garantit toujours le prix visible au moment du clic.', correct: false, feedback: 'Non. Le prix visible peut ne pas contenir assez de liquidité pour toute la quantité demandée.' }),
    Object.freeze({ text: 'Un ordre au marché attend forcément qu’un prix précis soit atteint.', correct: false, feedback: 'Non. C’est précisément le rôle d’un ordre limite : définir un prix maximum à l’achat ou minimum à la vente.' })
  ]);

  const spreadOptions = Object.freeze([
    Object.freeze({ text: 'Le spread est l’écart entre le meilleur prix acheteur (bid) et le meilleur prix vendeur (ask).', correct: true, feedback: 'Oui. Le bid est le meilleur prix proposé par un acheteur ; l’ask est le meilleur prix demandé par un vendeur.' }),
    Object.freeze({ text: 'Le spread est toujours la commission facturée par le courtier.', correct: false, feedback: 'Non. Le spread décrit d’abord l’écart bid/ask. Des frais ou commissions peuvent exister séparément selon le marché et l’intermédiaire.' }),
    Object.freeze({ text: 'Le spread mesure la direction future du marché.', correct: false, feedback: 'Non. Il décrit une caractéristique de cotation et de liquidité, pas une prédiction.' })
  ]);

  const limitOptions = Object.freeze([
    Object.freeze({ text: 'L’ordre limite contrôle le prix maximal accepté à l’achat, mais son exécution n’est pas garantie.', correct: true, feedback: 'Exact. Le contrôle du prix a une contrepartie : si le marché n’atteint pas ce niveau ou si la liquidité manque, l’ordre peut rester non exécuté.' }),
    Object.freeze({ text: 'L’ordre limite garantit à la fois le prix choisi et une exécution immédiate.', correct: false, feedback: 'Non. Il peut garantir une contrainte de prix, pas l’exécution.' }),
    Object.freeze({ text: 'Un ordre limite sert uniquement à fermer une position.', correct: false, feedback: 'Non. Un ordre limite est un type d’instruction de prix ; son usage ne se réduit pas à une fermeture.' })
  ]);

  const exerciseOptions = Object.freeze([
    Object.freeze({ text: '2 unités peuvent s’exécuter à 50,10 puis 2 unités à 50,12 ; le prix moyen sera supérieur à 50,10.', correct: true, feedback: 'Bonne lecture. L’ordre consomme d’abord la meilleure offre disponible, puis le niveau suivant pour la quantité restante. Cet exemple est purement pédagogique.' }),
    Object.freeze({ text: 'Les 4 unités s’exécutent obligatoirement à 50,10 car c’est le meilleur ask.', correct: false, feedback: 'Non. Il n’y a que 2 unités disponibles à 50,10 dans le scénario. La quantité restante doit chercher la liquidité suivante.' }),
    Object.freeze({ text: 'L’ordre est automatiquement annulé car deux niveaux de prix existent.', correct: false, feedback: 'Non. Un ordre au marché peut se répartir sur plusieurs niveaux si c’est nécessaire pour obtenir la quantité demandée.' })
  ]);

  const practice = Object.freeze({
    id: 'm12-exercise',
    label: 'Exercice d’application',
    heading: 'Lire une exécution sur plusieurs niveaux',
    prompt: 'Dans cet exemple synthétique, un achat au marché de 4 unités rencontre 2 unités à 50,10 puis au moins 3 unités à 50,12. Que décrit correctement l’exécution ?',
    successText: 'Bonne lecture. Tu distingues le prix affiché de la liquidité réellement disponible.',
    choices: exerciseOptions
  });

  const evaluation = Object.freeze({
    id: 'm12-quiz',
    label: 'Quiz de validation',
    heading: 'Quelle affirmation décrit le mieux l’exécution d’un ordre ?',
    prompt: 'Choisis la réponse la plus précise.',
    successText: 'Correct. Tu relies type d’ordre, liquidité disponible, bid/ask et prix d’exécution.',
    choices: Object.freeze([
      Object.freeze({ text: 'L’exécution dépend du type d’ordre et de la liquidité disponible aux prix rencontrés.', correct: true }),
      Object.freeze({ text: 'Le prix affiché au moment du clic est toujours le prix final obtenu.', correct: false, feedback: 'Non. La quantité disponible et le déplacement entre plusieurs niveaux peuvent modifier le prix moyen d’exécution.' }),
      Object.freeze({ text: 'Un ordre limite et un ordre au marché garantissent exactement la même chose.', correct: false, feedback: 'Non. L’un privilégie l’exécution, l’autre impose une contrainte de prix.' })
    ])
  });

  const ladder = '<div class="dda-order-ladder" role="img" aria-label="Carnet pédagogique synthétique montrant deux niveaux vendeurs, le meilleur ask et deux niveaux acheteurs.">' +
    '<div class="ladder-side ask"><span>Vendeurs · ASK</span><strong>50,12 · 3 unités</strong><strong class="best">50,10 · 2 unités</strong></div>' +
    '<div class="ladder-spread"><small>SPREAD</small><b>0,02</b></div>' +
    '<div class="ladder-side bid"><strong class="best">50,08 · 4 unités</strong><strong>50,06 · 5 unités</strong><span>Acheteurs · BID</span></div>' +
    '<p>Exemple pédagogique synthétique — aucune donnée de marché réelle.</p></div>';

  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'm12-competency-intro', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({
      type: 'text_short', id: 'm12-concept', step: 'lesson', outline: 'Bid, ask et exécution',
      eyebrow: 'Le mécanisme', heading: 'Un prix affiché représente une possibilité d’échange, pas une promesse d’exécution.',
      body: 'À un instant donné, le meilleur bid représente le prix acheteur le plus élevé disponible et le meilleur ask le prix vendeur le plus bas disponible. Entre les deux se trouve le spread. Quand un ordre arrive, il rencontre la liquidité disponible à ces niveaux.',
      principle: Object.freeze({ label: 'Principe essentiel', text: 'Sépare toujours trois questions : quel type d’ordre est envoyé, quelle liquidité est disponible, et à quel prix l’exécution a réellement lieu.' })
    }),
    Object.freeze({
      type: 'mini_simulation', id: 'm12-ladder', step: 'lesson', outline: 'Lire une cotation',
      eyebrow: 'Observer', heading: 'Lis ce mini carnet d’ordres pédagogique.',
      prompt: 'Repère le meilleur ask, le meilleur bid et l’écart entre les deux. Les chiffres ci-dessous sont fictifs et uniquement pédagogiques.',
      state: ladder
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm12-market-order', step: 'lesson', outline: 'Ordre au marché',
      eyebrow: 'Décider', heading: 'Si la priorité est une exécution immédiate, que faut-il comprendre ?',
      prompt: 'Choisis la formulation la plus rigoureuse.', options: immediateOptions
    }),
    Object.freeze({
      type: 'mini_simulation', id: 'm12-market-vs-limit', step: 'lesson', outline: 'Marché vs limite',
      eyebrow: 'Comparer', heading: 'Deux instructions, deux compromis différents.',
      prompt: 'Aucune n’est “meilleure” par nature : elles répondent à des contraintes différentes.',
      state: '<div class="dda-order-compare"><article><span>ORDRE AU MARCHÉ</span><strong>Priorité : exécution</strong><p>Le prix exact n’est pas garanti et plusieurs niveaux de liquidité peuvent être consommés.</p></article><article><span>ORDRE LIMITE</span><strong>Priorité : contrainte de prix</strong><p>L’exécution n’est pas garantie et l’ordre peut rester en attente si le prix choisi n’est pas disponible.</p></article></div>'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm12-limit-order', step: 'lesson', outline: 'Comprendre la limite',
      eyebrow: 'Appliquer', heading: 'Que protège réellement un ordre limite ?',
      prompt: 'Choisis sans supposer qu’une exécution est garantie.', options: limitOptions
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm12-spread', step: 'lesson', outline: 'Comprendre le spread',
      eyebrow: 'Lire la cotation', heading: 'Que représente le spread ?',
      prompt: 'Reviens au mini carnet ci-dessus.', options: spreadOptions
    }),
    Object.freeze({
      type: 'case_study', id: 'm12-slippage-case', step: 'lesson', outline: 'Quand le prix moyen change',
      label: 'Cas pédagogique · liquidité limitée',
      text: 'Un acheteur envoie un ordre au marché de 4 unités. Le meilleur ask affiche 50,10, mais seulement 2 unités y sont disponibles. Le niveau suivant affiche 50,12 avec suffisamment de quantité pour compléter l’ordre.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm12-exercise', step: 'exercise', outline: 'Exercice d’application',
      eyebrow: 'Appliquer', heading: practice.heading, prompt: practice.prompt, options: exerciseOptions
    }),
    Object.freeze({ type: 'quiz', id: 'm12-quiz', step: 'quiz', outline: evaluation.heading, locked: true, data: evaluation }),
    Object.freeze({ type: 'journal_link', id: 'm12-journal', step: 'review', prompt: 'Résume avec tes mots la différence entre ordre au marché, ordre limite, bid, ask et spread.', cta: 'Ouvrir Journal & Plan' }),
    Object.freeze({ type: 'summary', id: 'm12-result', step: 'review', idSuffix: 'm12', data: Object.freeze({ heading: 'Compréhension des ordres et de l’exécution confirmée.', body: 'Tu sais distinguer bid, ask, spread, ordre au marché et ordre limite, et expliquer pourquoi le prix d’exécution peut différer du premier prix affiché.' }) })
  ]);

  return Object.freeze({
    id: 'M1.2',
    title: 'Comment les ordres s’exécutent ?',
    summary: 'Lire bid, ask, spread et comprendre comment ordres au marché et ordres limites rencontrent la liquidité.',
    estimatedMinutes: 16,
    markUnderstoodLabel: 'Passer à l’exercice',
    competency,
    xp,
    content,
    practice,
    evaluation,
    steps,
    blocks
  });
});