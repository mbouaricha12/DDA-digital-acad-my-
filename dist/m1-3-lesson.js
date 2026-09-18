// DDA M1.3 — Golden Lesson: Qui participe aux marchés — et pourquoi ?
(function (root, factory) {
  const lesson = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = lesson;
  else root.DDAM13GoldenLesson = lesson;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const competency = Object.freeze({ id: 'market_participant_roles_understanding', label: 'Compréhension des rôles des participants de marché' });
  const xp = Object.freeze({ lessonViewed: 30, exerciseComplete: 80, quizComplete: 140 });
  const content = Object.freeze({
    lead: 'Cette leçon montre pourquoi deux participants peuvent prendre des positions opposées sans que l’un soit “idiot” ou “manipulateur” : leurs objectifs, contraintes et horizons peuvent être différents.'
  });
  const steps = Object.freeze([
    Object.freeze({ id: 'lesson', label: 'Observer' }),
    Object.freeze({ id: 'exercise', label: 'Appliquer' }),
    Object.freeze({ id: 'quiz', label: 'Prouver' }),
    Object.freeze({ id: 'review', label: 'Résultat' })
  ]);

  const hedgerOptions = Object.freeze([
    Object.freeze({ text: 'C’est un comportement de couverture : l’entreprise cherche surtout à réduire l’incertitude sur un coût futur.', correct: true, feedback: 'Exact. Une couverture cherche d’abord à réduire une exposition existante ; elle n’implique pas forcément une opinion directionnelle sur le marché.' }),
    Object.freeze({ text: 'L’entreprise parie obligatoirement sur une baisse du marché.', correct: false, feedback: 'Non. Une position de couverture peut être prise pour stabiliser un coût ou un revenu, même si l’entreprise n’a aucune conviction directionnelle.' }),
    Object.freeze({ text: 'L’entreprise essaie nécessairement de manipuler le prix.', correct: false, feedback: 'Non. Une opération de couverture répond à un besoin économique réel et ne permet pas de conclure à une manipulation.' })
  ]);

  const investorOptions = Object.freeze([
    Object.freeze({ text: 'Un investisseur de long terme peut chercher une exposition durable à un actif selon son mandat et son horizon.', correct: true, feedback: 'Oui. Son objectif peut être l’allocation de capital sur plusieurs années, très différent d’un trader intraday.' }),
    Object.freeze({ text: 'Un investisseur de long terme doit acheter et vendre plusieurs fois par jour.', correct: false, feedback: 'Non. La fréquence d’intervention dépend de la stratégie, du mandat et de l’horizon.' }),
    Object.freeze({ text: 'Un investisseur de long terme connaît forcément la direction prochaine du prix.', correct: false, feedback: 'Non. Un horizon long ne supprime jamais l’incertitude.' })
  ]);

  const liquidityOptions = Object.freeze([
    Object.freeze({ text: 'Un apporteur de liquidité peut afficher simultanément un bid et un ask pour faciliter les échanges, tout en gérant son propre risque.', correct: true, feedback: 'Exact. Il fournit des prix des deux côtés et gère son inventaire, ses coûts et son exposition.' }),
    Object.freeze({ text: 'S’il affiche un prix à l’achat et à la vente, c’est parce qu’il connaît à l’avance la prochaine direction.', correct: false, feedback: 'Non. Coter deux côtés ne prouve aucune connaissance certaine du futur.' }),
    Object.freeze({ text: 'Son rôle est uniquement de faire perdre les autres participants.', correct: false, feedback: 'Non. Cette lecture transforme un rôle de marché en intention cachée sans preuve.' })
  ]);

  const exerciseOptions = Object.freeze([
    Object.freeze({ text: 'La transaction peut simplement réunir deux participants ayant des objectifs différents : l’un réduit un risque, l’autre accepte l’exposition correspondante.', correct: true, feedback: 'Bonne lecture. Deux motivations différentes peuvent parfaitement se rencontrer dans la même transaction.' }),
    Object.freeze({ text: 'Celui qui vend est forcément pessimiste et celui qui achète forcément optimiste.', correct: false, feedback: 'Trop simpliste. Un vendeur peut couvrir un risque, rééquilibrer un portefeuille ou répondre à une contrainte sans avoir une opinion baissière.' }),
    Object.freeze({ text: 'Si deux participants prennent des positions opposées, l’un d’eux doit forcément être manipulé.', correct: false, feedback: 'Non. Des horizons, contraintes et objectifs différents suffisent à expliquer des décisions opposées.' })
  ]);

  const practice = Object.freeze({
    id: 'm13-exercise',
    label: 'Exercice d’application',
    heading: 'Relier une transaction à des motivations différentes',
    prompt: 'Une entreprise vend un contrat pour réduire son risque sur un coût futur, tandis qu’un autre participant accepte l’exposition inverse. Quelle lecture est la plus rigoureuse ?',
    successText: 'Bonne lecture. Tu distingues la position visible de la motivation réelle du participant.',
    choices: exerciseOptions
  });

  const evaluation = Object.freeze({
    id: 'm13-quiz',
    label: 'Quiz de validation',
    heading: 'Que faut-il retenir sur les participants de marché ?',
    prompt: 'Choisis la réponse la plus précise.',
    successText: 'Correct. Tu comprends que les échanges réunissent des participants aux objectifs, horizons et contraintes différents.',
    choices: Object.freeze([
      Object.freeze({ text: 'Un même marché réunit des investisseurs, spéculateurs, entreprises de couverture, apporteurs de liquidité et intermédiaires dont les objectifs peuvent être très différents.', correct: true }),
      Object.freeze({ text: 'Tous les participants achètent et vendent pour la même raison.', correct: false, feedback: 'Non. Les objectifs peuvent aller de l’allocation long terme à la couverture, en passant par la fourniture de liquidité ou la prise d’exposition.' }),
      Object.freeze({ text: 'Une position acheteuse permet toujours de connaître l’opinion complète et l’horizon de celui qui l’a prise.', correct: false, feedback: 'Non. Une position visible ne révèle pas automatiquement le contexte, la contrainte ou l’horizon du participant.' })
    ])
  });

  const participantMap = '<div class="dda-participant-map" role="img" aria-label="Carte pédagogique synthétique des principaux rôles de marché.">' +
    '<article><span>INVESTIR</span><strong>Investisseurs</strong><p>Allouer du capital selon un mandat et un horizon.</p></article>' +
    '<article><span>SE COUVRIR</span><strong>Entreprises · Hedgers</strong><p>Réduire une exposition économique existante.</p></article>' +
    '<article><span>PRENDRE UNE EXPOSITION</span><strong>Traders · Spéculateurs</strong><p>Accepter une incertitude de prix selon leur scénario et leur horizon.</p></article>' +
    '<article><span>FACILITER L’ÉCHANGE</span><strong>Apporteurs de liquidité</strong><p>Coter, absorber des flux et gérer leur inventaire.</p></article>' +
    '<article><span>TRANSMETTRE / ORGANISER</span><strong>Courtiers · Places de marché</strong><p>Mettre en relation les ordres selon les règles du marché.</p></article>' +
    '<p>Carte pédagogique simplifiée — les rôles réels peuvent se combiner.</p></div>';

  const blocks = Object.freeze([
    Object.freeze({ type: 'competency_check', id: 'm13-competency-intro', step: 'lesson', mode: 'targets', competency }),
    Object.freeze({
      type: 'text_short', id: 'm13-concept', step: 'lesson', outline: 'Des objectifs différents',
      eyebrow: 'Le concept', heading: 'Une position visible ne révèle pas toute l’intention derrière la transaction.',
      body: 'Sur un marché, les participants n’ont ni le même horizon, ni les mêmes contraintes, ni les mêmes raisons d’agir. Une vente peut être une couverture, un rééquilibrage, une prise de profit, une contrainte de mandat ou une décision spéculative. Une position seule ne suffit donc pas à raconter toute l’histoire.',
      principle: Object.freeze({ label: 'Principe essentiel', text: 'Ne confonds jamais la direction d’une transaction avec la motivation complète du participant qui l’envoie.' })
    }),
    Object.freeze({
      type: 'mini_simulation', id: 'm13-participant-map', step: 'lesson', outline: 'Cartographier les rôles',
      eyebrow: 'Observer', heading: 'Un même marché, plusieurs fonctions.',
      prompt: 'Observe les rôles ci-dessous. Ils peuvent se croiser et parfois se combiner.',
      state: participantMap
    }),
    Object.freeze({
      type: 'case_study', id: 'm13-hedger-case', step: 'lesson', outline: 'Cas 1 · couverture',
      label: 'Cas 1 · entreprise',
      text: 'Une entreprise sait qu’elle devra payer une matière première ou une devise plus tard. Elle utilise un instrument de marché pour réduire l’incertitude sur ce coût futur.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm13-hedger', step: 'lesson', outline: 'Identifier la couverture',
      eyebrow: 'Raisonner', heading: 'Quel rôle décrit le mieux cette décision ?', prompt: 'Choisis la motivation la plus cohérente.', options: hedgerOptions
    }),
    Object.freeze({
      type: 'case_study', id: 'm13-investor-case', step: 'lesson', outline: 'Cas 2 · allocation',
      label: 'Cas 2 · investisseur',
      text: 'Un fonds investit selon un mandat pluriannuel et construit progressivement une exposition à plusieurs actifs sans chercher à réagir à chaque mouvement intraday.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm13-investor', step: 'lesson', outline: 'Identifier l’horizon',
      eyebrow: 'Nouveau cas', heading: 'Quelle lecture est la plus juste ?', prompt: 'Distingue horizon et prédiction.', options: investorOptions
    }),
    Object.freeze({
      type: 'case_study', id: 'm13-liquidity-case', step: 'lesson', outline: 'Cas 3 · liquidité',
      label: 'Cas 3 · cotation',
      text: 'Un participant professionnel affiche des prix acheteurs et vendeurs, absorbe une partie des flux et ajuste ses cotations pour gérer son inventaire et son risque.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm13-liquidity', step: 'lesson', outline: 'Identifier la fonction',
      eyebrow: 'Comprendre le rôle', heading: 'Que décrit le mieux cette activité ?', prompt: 'Évite les explications basées sur une intention cachée.', options: liquidityOptions
    }),
    Object.freeze({
      type: 'case_study', id: 'm13-exercise-case', step: 'exercise', outline: 'Exercice d’application',
      label: 'Exercice · deux motivations opposées',
      text: 'Une entreprise vend un contrat pour réduire un risque sur un coût futur. Un autre participant accepte l’exposition inverse parce que son mandat, son horizon et son scénario sont différents.'
    }),
    Object.freeze({
      type: 'decision_choice', id: 'm13-exercise', step: 'exercise', outline: 'Relier les motivations',
      eyebrow: 'Appliquer', heading: practice.heading, prompt: practice.prompt, options: exerciseOptions
    }),
    Object.freeze({ type: 'quiz', id: 'm13-quiz', step: 'quiz', outline: evaluation.heading, locked: true, data: evaluation }),
    Object.freeze({ type: 'journal_link', id: 'm13-journal', step: 'review', prompt: 'Note avec tes mots pourquoi une transaction opposée ne signifie pas forcément une opinion opposée sur le futur.', cta: 'Ouvrir Journal & Plan' }),
    Object.freeze({ type: 'summary', id: 'm13-result', step: 'review', idSuffix: 'm13', data: Object.freeze({ heading: 'Compréhension des rôles de marché confirmée.', body: 'Tu sais maintenant distinguer allocation, couverture, spéculation, fourniture de liquidité et intermédiation sans attribuer automatiquement une intention cachée aux participants.' }) })
  ]);

  return Object.freeze({
    id: 'M1.3',
    title: 'Qui participe aux marchés — et pourquoi ?',
    summary: 'Comprendre les rôles, horizons et motivations des principaux participants de marché.',
    estimatedMinutes: 15,
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